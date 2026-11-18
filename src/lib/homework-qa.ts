import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { resolveGeminiApiKey } from '@/lib/counselling';
import { getApprovedCoursebook } from '../../scripts/cbc-syllabus-data.mjs';
import { resolveSyllabusSubject } from '@/lib/gaming';

const BUCKET_NAME = 'cbc-materials';
const HOMEWORK_LEDGER_PATH = '_system/homework-qa-ledger.json';

export const WEEKLY_SUBSCRIPTION_KES = 20;
export const WEEKLY_DURATION_MS = 7 * 24 * 60 * 60 * 1000; // 7 full days

export interface HomeworkSubscription {
  token: string;
  fullName: string;
  gradeLabel: string;
  phone: string;
  mpesaReceipt: string;
  checkoutRequestId: string;
  activatedAt: number;
  expiresAt: number;
}

export interface StoredHomeworkAnswer {
  answerId: string;
  fullName: string;
  gradeLabel: string;
  subject: string;
  question: string;
  visibleHalf: string;
  fullAnswer: string;
  provider: 'gemini' | 'cbc-tutor-ai';
  unlocked: boolean;
  createdAt: number;
}

export interface HomeworkLedger {
  subscriptionsByToken: Record<string, HomeworkSubscription>;
  subscriptionsByPhone: Record<string, HomeworkSubscription>;
  answers: Record<string, StoredHomeworkAnswer>;
  totalQuestionsAsked: number;
  updatedAt: string;
}

let cachedHomeworkLedger: { data: HomeworkLedger; loadedAt: number } | null = null;

function cleanPhoneKey(raw?: string): string {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('0') && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  return digits;
}

export async function getHomeworkLedger(forceFresh = false): Promise<HomeworkLedger> {
  if (
    !forceFresh &&
    cachedHomeworkLedger &&
    Date.now() - cachedHomeworkLedger.loadedAt < 3000
  ) {
    return cachedHomeworkLedger.data;
  }

  const empty: HomeworkLedger = {
    subscriptionsByToken: {},
    subscriptionsByPhone: {},
    answers: {},
    totalQuestionsAsked: 0,
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(HOMEWORK_LEDGER_PATH);

    if (error || !data) {
      cachedHomeworkLedger = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<HomeworkLedger>;
    const normalized: HomeworkLedger = {
      subscriptionsByToken: parsed.subscriptionsByToken || {},
      subscriptionsByPhone: parsed.subscriptionsByPhone || {},
      answers: parsed.answers || {},
      totalQuestionsAsked: Number(parsed.totalQuestionsAsked) || 0,
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedHomeworkLedger = { data: normalized, loadedAt: Date.now() };
    return normalized;
  } catch {
    return empty;
  }
}

export async function saveHomeworkLedger(ledger: HomeworkLedger): Promise<void> {
  const now = Date.now();
  // Keep latest 250 answers so JSON stays fast and compact
  const entries = Object.values(ledger.answers).sort(
    (a, b) => b.createdAt - a.createdAt
  );
  if (entries.length > 250) {
    const nextAnswers: Record<string, StoredHomeworkAnswer> = {};
    for (const item of entries.slice(0, 250)) {
      nextAnswers[item.answerId] = item;
    }
    ledger.answers = nextAnswers;
  }

  ledger.updatedAt = new Date().toISOString();
  cachedHomeworkLedger = { data: ledger, loadedAt: now };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      HOMEWORK_LEDGER_PATH,
      Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );
}

export function findActiveWeeklySubscription(
  ledger: HomeworkLedger,
  subscriptionToken?: string,
  phone?: string
): HomeworkSubscription | null {
  const now = Date.now();
  if (subscriptionToken && ledger.subscriptionsByToken[subscriptionToken]) {
    const sub = ledger.subscriptionsByToken[subscriptionToken];
    if (sub.expiresAt > now) return sub;
  }

  const pKey = cleanPhoneKey(phone);
  if (pKey && ledger.subscriptionsByPhone[pKey]) {
    const sub = ledger.subscriptionsByPhone[pKey];
    if (sub.expiresAt > now) return sub;
  }

  return null;
}

export async function activateWeeklySubscription(params: {
  fullName: string;
  gradeLabel: string;
  phone: string;
  mpesaReceipt: string;
  checkoutRequestId: string;
  answerId?: string;
}): Promise<{
  subscription: HomeworkSubscription;
  unlockedAnswer?: StoredHomeworkAnswer;
}> {
  const ledger = await getHomeworkLedger(true);
  const pKey = cleanPhoneKey(params.phone) || `anon_${Date.now()}`;

  // Reuse existing token if already issued for this checkoutRequestId
  const existing = Object.values(ledger.subscriptionsByToken).find(
    (s) => s.checkoutRequestId === params.checkoutRequestId
  );
  if (existing) {
    const ans = params.answerId ? ledger.answers[params.answerId] : undefined;
    if (ans && !ans.unlocked) {
      ans.unlocked = true;
      await saveHomeworkLedger(ledger);
    }
    return { subscription: existing, unlockedAnswer: ans };
  }

  const now = Date.now();
  const token = `wk_${crypto.randomBytes(14).toString('hex')}`;
  const sub: HomeworkSubscription = {
    token,
    fullName: params.fullName.trim() || 'CBC Learner',
    gradeLabel: params.gradeLabel.trim() || 'CBC',
    phone: pKey,
    mpesaReceipt: params.mpesaReceipt,
    checkoutRequestId: params.checkoutRequestId,
    activatedAt: now,
    expiresAt: now + WEEKLY_DURATION_MS,
  };

  ledger.subscriptionsByToken[token] = sub;
  if (pKey) {
    ledger.subscriptionsByPhone[pKey] = sub;
  }

  let unlockedAnswer: StoredHomeworkAnswer | undefined;
  if (params.answerId && ledger.answers[params.answerId]) {
    ledger.answers[params.answerId].unlocked = true;
    unlockedAnswer = ledger.answers[params.answerId];
  }

  await saveHomeworkLedger(ledger);
  return { subscription: sub, unlockedAnswer };
}

export function splitAnswerHalfway(fullAnswer: string): {
  visibleHalf: string;
  hiddenCharCount: number;
} {
  const clean = fullAnswer.trim();
  const paragraphs = clean
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= 3) {
    // Show roughly the first 45% of paragraphs so the cut-off lands right in the middle of the explanation
    const cutCount = Math.max(1, Math.floor(paragraphs.length * 0.45));
    const visibleHalf = paragraphs.slice(0, cutCount).join('\n\n');
    return {
      visibleHalf,
      hiddenCharCount: Math.max(120, clean.length - visibleHalf.length),
    };
  }

  const mid = Math.floor(clean.length * 0.46);
  const spaceIdx = clean.indexOf(' ', mid);
  const splitAt = spaceIdx > 0 ? spaceIdx : mid;
  const visibleHalf = clean.slice(0, splitAt).trim();
  return {
    visibleHalf,
    hiddenCharCount: Math.max(120, clean.length - visibleHalf.length),
  };
}

async function callGeminiHomeworkModel(params: {
  apiKey: string;
  fullName: string;
  gradeLabel: string;
  subject: string;
  question: string;
}): Promise<string | null> {
  const models = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const rawG = params.gradeLabel.toUpperCase();
  const gKey = rawG.includes('PP1')
    ? 'PP1'
    : rawG.includes('PP2')
    ? 'PP2'
    : (rawG.match(/\d+/)?.[0] || '7');
  const sylSubj = resolveSyllabusSubject(params.subject || 'Mathematics', gKey);
  const approvedCb = getApprovedCoursebook(
    gKey.startsWith('PP') ? gKey : Number(gKey) || 7,
    sylSubj
  );
  const systemPrompt = [
    `You are Gemini, an expert Kenyan Competency-Based Curriculum (CBC) Master Teacher tutoring a student named "${params.fullName}" who is in "${params.gradeLabel}".`,
    `Subject focus: ${params.subject || 'General CBC Studies'}.`,
    `Align concepts, terminology, and worked steps with the official KICD Approved CBC Course Materials (e.g. ${approvedCb.lbTitle} by ${approvedCb.authors}, ${approvedCb.publisher}${approvedCb.alternates?.length ? `; and ${approvedCb.alternates.join(', ')}` : ''}).`,
    'Write a detailed, crystal-clear, warm, and academically rigorous answer structured into 5 distinct sections separated by blank lines:',
    `1. Warm personal greeting to ${params.fullName} (${params.gradeLabel}) + Key Concept Definition.`,
    '2. Core Principle / Formula / Background Explanation.',
    '3. Complete Step-by-Step Worked Solution / Detailed Points (numbered clearly).',
    '4. Final Verified Answer & Practical Kenyan / Real-Life Application.',
    '5. Quick KNEC / KPSEA / KJSEA / Exam Marking Tip to score full marks.',
    'Target length: 240 to 380 words. Use clear bold headings and bullet points.',
  ].join('\n');

  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        params.apiKey
      )}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemPrompt }] },
          contents: [
            {
              role: 'user',
              parts: [
                {
                  text: `Learner Name: ${params.fullName}\nGrade: ${params.gradeLabel}\nSubject: ${params.subject}\nQuestion: ${params.question}`,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: 0.55,
            maxOutputTokens: 900,
          },
        }),
        cache: 'no-store',
      });
      if (!res.ok) continue;
      const json = await res.json();
      const text = json?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text || '')
        .join('\n')
        .trim();
      if (text && text.length > 120) return text;
    } catch {
      // Try next model or structured CBC engine
    }
  }
  return null;
}

function tryEvaluateMathExpression(question: string): {
  expr: string;
  result: number;
} | null {
  const normalized = question
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/\bof\b/gi, '*')
    .replace(/\^/g, '**');

  const match = normalized.match(
    /(\d+(?:\.\d+)?(?:\s*[\+\-\*\/]\s*\d+(?:\.\d+)?)+)/
  );
  if (!match) return null;
  const expr = match[1].trim();
  if (!/^[\d\s\+\-\*\/\.]+$/.test(expr)) return null;

  try {
    const val = Function(`"use strict"; return (${expr});`)();
    if (typeof val === 'number' && Number.isFinite(val)) {
      return { expr, result: Number(val.toFixed(4)) };
    }
  } catch {}
  return null;
}

function buildExpertCbcAnswer(params: {
  fullName: string;
  gradeLabel: string;
  subject: string;
  question: string;
}): string {
  const firstName = params.fullName.trim().split(/\s+/)[0] || params.fullName;
  const q = params.question.trim();
  const qLower = q.toLowerCase();
  const subj = params.subject || 'CBC Studies';

  // 1. Direct Arithmetic / BODMAS / Calculation Detector
  const mathEval = tryEvaluateMathExpression(q);
  if (mathEval) {
    return [
      `Hello **${params.fullName}** (${params.gradeLabel})! Great **Mathematics** problem. Let’s break down \`${mathEval.expr}\` carefully using the KICD **BODMAS** (Brackets, Orders, Division, Multiplication, Addition, Subtraction) rule so you earn every method mark.`,
      `**1. Identifying the Operations & Order of Priority**\nBefore calculating from left to right, check which operations appear in \`${mathEval.expr}\`. Under BODMAS, **Division (÷)** and **Multiplication (×)** must always be worked out *before* **Addition (+)** and **Subtraction (−)**.`,
      `**2. Step-by-Step Worked Calculation (${firstName}'s Working)**\n• Write down the original expression clearly: \`${mathEval.expr}\`\n• Group any multiplication or division terms first and simplify them accurately.\n• Combine the remaining addition and subtraction terms systematically from left to right.\n• Verified Computed Value: **${mathEval.result}**`,
      `**3. Final Verified Answer**\nTherefore, **${firstName}**, the exact answer to \`${mathEval.expr}\` is **${mathEval.result}**.`,
      `**4. KNEC / ${params.gradeLabel} Exam Marking Tip**\nNever write only the final number in an assessment! Always show at least **2 intermediate working lines** — in CBC rubrics (*Exceeding Expectations*), method marks account for over 60% of the score.`,
    ].join('\n\n');
  }

  // 2. Photosynthesis / Plant Biology
  if (/(photosynthes|chlorophyll|stomata|leaf|plant.*food)/i.test(qLower)) {
    return [
      `Hello **${params.fullName}** (${params.gradeLabel})! Excellent **Science & Biology** question on how green plants manufacture their own food.`,
      `**1. Definition of Photosynthesis**\n**Photosynthesis** (*photo* = light, *synthesis* = building up) is the biochemical process by which green plants, algae, and some bacteria use **sunlight energy** trapped by **chlorophyll** inside chloroplasts to convert **carbon dioxide (CO₂)** and **water (H₂O)** into **glucose (food)** and release **oxygen (O₂)** as a by-product.`,
      `**2. Raw Materials, Conditions & Word/Chemical Equation**\n• **Raw Materials:** Water (absorbed from soil by root hairs via osmosis) and Carbon dioxide (diffuses into leaves through tiny pores called **stomata**).\n• **Essential Conditions:** Sunlight energy and green pigment **Chlorophyll**.\n• **Word Equation:** \`Carbon dioxide + Water —(Sunlight / Chlorophyll)→ Glucose + Oxygen\`\n• **Balanced Chemical Equation:** \`6CO₂ + 6H₂O → C₆H₁₂O₆ + 6O₂\``,
      `**3. The Two Stages & Importance to Life in Kenya**\n• **Light Stage (in Grana):** Sunlight splits water molecules (*photolysis*) into hydrogen ions, ATP energy, and oxygen gas.\n• **Dark / Carbon-Fixation Stage (in Stroma):** Hydrogen ions combine with carbon dioxide to form glucose (stored as starch in crops like maize, beans, and potatoes).\n• **Ecological Value:** Supplies all oxygen breathed by animals/humans and forms the base of every food chain.`,
      `**4. ${params.gradeLabel} Exam Tip for ${firstName}**\nWhen asked how a leaf is adapted for photosynthesis, mention **broad flat lamina** (large surface area), **thinness** (short diffusion distance), **numerous chloroplasts in palisade cells**, and **network of veins** (xylem & phloem).`,
    ].join('\n\n');
  }

  // 3. Human Digestive / Circulatory / Respiratory Systems
  if (/(digest|stomach|intestine|heart|blood|circulat|respirat|lung|breathing|kidney|excret)/i.test(qLower)) {
    return [
      `Hello **${params.fullName}** (${params.gradeLabel})! Let’s explore this **Human Body Systems (${subj})** question step by step so it sticks in your memory permanently.`,
      `**1. Core Biological Function & Overview**\nOrgan systems in the human body work together to maintain life (**homeostasis**) by transporting nutrients and oxygen to cells, breaking down complex food molecules into soluble forms, and removing metabolic waste.`,
      `**2. Detailed Step-by-Step Mechanism & Key Organs**\n• **Structural Adaptation:** Every major organ involved has specialized tissues — for example, **folded villi** in the ileum (one-cell-thick epithelium + dense capillaries) for rapid absorption, **muscular left ventricle** in the heart to pump oxygenated blood under high pressure, and **moist thin alveoli** in the lungs for gaseous exchange.\n• **Sequential Pathway:** Trace the exact order from entry to target cells clearly using arrows (\`→\`) when answering structured CBC questions.\n• **Enzymes / Transport Media:** Match each region with its right pH and role (e.g., *salivary amylase* in the mouth for starch, *pepsin* in acidic stomach juice for proteins, *hemoglobin* in red blood cells for oxyhemoglobin transport).`,
      `**3. Direct Summary Answer for "${q}"**\nTo score full marks on *"${q}"*, state (a) the **exact organ/part name**, (b) its **structural feature**, and (c) **how that feature enables its function** (Structure + Function link).`,
      `**4. ${params.gradeLabel} Assessment Tip for ${firstName}**\nExaminers award 1 mark for naming the structure and a 2nd mark for explaining the adaptation — always connect the two using *"so that..."* or *"in order to..."*!`,
    ].join('\n\n');
  }

  // 4. Kiswahili (Insha, Ngeli, Methali, Sarufi, Fasihi)
  if (/(ngeli|methali|insha|sarufi|nomino|kitenzi|vivumishi|fasihi|shairi|msamiati|eleza maana)/i.test(qLower)) {
    return [
      `Hujambo **${params.fullName}** (${params.gradeLabel})! Hongera kwa kuuliza swali zuri sana la **Kiswahili**: *"${q}"*. Hebu tulichambue kwa ufasaha na mpangilio unaokubalika na KICD na KNEC.`,
      `**1. Utangulizi na Dhana Kuu (Msingi wa Swali)**\nKatika mtaala wa umilisi (**CBC Kiswahili**), mwanafunzi anatarajiwa kuelewa maana, matumizi sahihi katika sentensi, na umuhimu wa kipengele hiki cha lugha au fasihi katika mawasiliano ya kila siku.`,
      `**2. Uchambuzi wa Kina na Mifano Mwafaka (${firstName})**\n• **Kanuni ya Kisasa:** Zingatia upatanisho wa kisarufi (*viambishi awali vya nafsi, wakati na ngeli*) au muundo rasmi (Utangulizi, Mwili wenye aya zenye hoja kuu, na Hitimisho).\n• **Mfano wa 1 Katika Sentensi:** Andika sentensi fupi yenye tahajia sahihi na alama za uakifishaji (kikomo, mkato, kiulizi).\n• **Mfano wa 2 wa Kimuktadha:** Husisha jibu lako na maisha halisi ya mwanafunzi nchini Kenya (shuleni, nyumbani, utunzaji wa mazingira, au maadili mema).`,
      `**3. Jibu Kamili na Muhtasari**\nKwa hivyo **${firstName}**, unapojibu *"${q}"*, hakikisha umetoa **maelezo kamili**, **mfano mmoja au miwili sahihi**, na kuzingatia **lugha sanifu isiyo na mchanganyiko wa Sheng**.`,
      `**4. Kidokezo cha Kupata Alama Zote (${params.gradeLabel})**\nKatika usahihishaji wa Kiswahili, hati nadhifu, kuakifisha vyema, na kutumia msamiati mwafaka kunakuongezea alama za ubora (*Kuzidisha Matarajio*).`,
    ].join('\n\n');
  }

  // 5. Social Studies / History / Government / Geography of Kenya & Africa
  if (/(constitution|government|county|counties|kenya|africa|president|parliament|citizen|climate|river|mountain|migration|colon|independ)/i.test(qLower)) {
    return [
      `Hello **${params.fullName}** (${params.gradeLabel})! Fantastic **Social Studies / History & Citizenship** question: *"${q}"*. Let’s break it down clearly with accurate Kenyan & African curriculum facts.`,
      `**1. Background & Core Concept**\nUnder Kenya’s **2010 Constitution** and the KICD Social Studies / History framework, governance, geography, and historical developments are studied to understand national unity, devolution across **47 Counties**, sustainable resource use, and citizen rights & responsibilities.`,
      `**2. Detailed Point-by-Point Explanation**\n• **Key Point 1 (Structure / Cause):** Identify the primary constitutional organ, physical feature, or historical factor (e.g., the three arms of government — **Legislature, Executive, and Judiciary** — or relief/drainage/climatic factors).\n• **Key Point 2 (Roles & Impact):** Explain clearly how each factor operates in practice and affects citizens, trade, agriculture, or settlement patterns across Kenya and East Africa.\n• **Key Point 3 (Values & National Cohesion):** Connect the concept to national values such as accountability, equity, patriotism, and environmental stewardship.\n• **Key Point 4 (Real Kenyan Illustration):** Cite a concrete local example (e.g., County Assembly oversight, Lake Victoria / River Tana basin, or Rift Valley escarpment).`,
      `**3. Concise Final Summary for ${firstName}**\nIn summary, *"${q}"* is best answered by stating **4 well-explained points**, each with a **clear heading** followed by a **complete explanatory sentence** rather than one-word bullets.`,
      `**4. ${params.gradeLabel} Exam & SBA Tip**\nWhen a question asks you to *"Explain"*, *"State"*, or *"Discuss"*: **State** requires brief clear facts (1 mark each), while **Explain / Discuss** requires the fact *plus* its reason or effect (2 marks each)!`,
    ].join('\n\n');
  }

  // 6. Comprehensive Universal CBC Master Tutor Breakdown for ANY Question
  return [
    `Hello **${params.fullName}** (${params.gradeLabel})! Welcome to your personalized **Gemini ${subj} Tutor**. You asked:\n> *"${q}"*\n\nLet’s break this down thoroughly so you understand both the **underlying concept** and **how to present a top-scoring answer**.`,
    `**1. Understanding What the Question Requires**\nFirst, **${firstName}**, look at the key action words and core topic in *"${q}"*. In **${params.gradeLabel} (${subj})**, KICD competencies test your ability to define the main term accurately, explain how or why it works, and apply it to a real-life example.`,
    `**2. Step-by-Step Detailed Explanation & Working**\n• **Step 1 — Core Definition / Principle:** Begin your answer with a clear, one-sentence definition of the main concept in **${subj}** so the examiner immediately sees your mastery.\n• **Step 2 — Key Mechanisms / Main Points:** Present **3 to 4 structured points** in logical order. State the main fact first, then explain the *"because / how"* behind it.\n• **Step 3 — Worked Illustration / Practical Example:** Support your explanation with a concrete Kenyan or laboratory/classroom example relevant to **${params.gradeLabel}**.\n• **Step 4 — Verification & Accuracy Check:** Confirm that units, spelling of technical terms, formulas, or grammar rules match KICD textbook standards.`,
    `**3. Complete Model Answer Structure for ${firstName}**\nWhen writing this in your exercise book or assessment paper:\n1. **Opening Statement:** Directly address *"${q}"* using the exact keywords from the prompt.\n2. **Body Points (1–4):** Write each point on its own clean bullet or paragraph with an example.\n3. **Concluding Line:** Tie your points back to the final result or practical significance in **${subj}**.`,
    `**4. ${params.gradeLabel} Top-Scorer Tip**\nTo achieve **Exceeding Expectations (EE)** in ${subj}, always underline key technical terms, keep your steps neat, and double-check that every part of the question has been answered!`,
  ].join('\n\n');
}

export async function generateAndStoreHomeworkAnswer(params: {
  fullName: string;
  gradeLabel: string;
  subject: string;
  question: string;
  subscriptionToken?: string;
  phone?: string;
}): Promise<{
  answerId: string;
  unlocked: boolean;
  provider: 'gemini' | 'cbc-tutor-ai';
  visibleHalf: string;
  fullAnswer?: string;
  hiddenCharCount: number;
  subscriptionExpiresAt?: number;
}> {
  const ledger = await getHomeworkLedger(true);
  const activeSub = findActiveWeeklySubscription(
    ledger,
    params.subscriptionToken,
    params.phone
  );

  const apiKey = await resolveGeminiApiKey();
  let fullAnswer: string | null = null;
  let provider: 'gemini' | 'cbc-tutor-ai' = 'cbc-tutor-ai';

  if (apiKey) {
    fullAnswer = await callGeminiHomeworkModel({
      apiKey,
      fullName: params.fullName,
      gradeLabel: params.gradeLabel,
      subject: params.subject,
      question: params.question,
    });
    if (fullAnswer) {
      provider = 'gemini';
    }
  }

  if (!fullAnswer) {
    fullAnswer = buildExpertCbcAnswer({
      fullName: params.fullName,
      gradeLabel: params.gradeLabel,
      subject: params.subject,
      question: params.question,
    });
  }

  const { visibleHalf, hiddenCharCount } = splitAnswerHalfway(fullAnswer);
  const answerId = `ans_${crypto.randomBytes(10).toString('hex')}`;
  const isUnlocked = Boolean(activeSub);

  ledger.answers[answerId] = {
    answerId,
    fullName: params.fullName,
    gradeLabel: params.gradeLabel,
    subject: params.subject,
    question: params.question,
    visibleHalf,
    fullAnswer,
    provider,
    unlocked: isUnlocked,
    createdAt: Date.now(),
  };
  ledger.totalQuestionsAsked = (ledger.totalQuestionsAsked || 0) + 1;

  await saveHomeworkLedger(ledger);

  return {
    answerId,
    unlocked: isUnlocked,
    provider,
    visibleHalf,
    fullAnswer: isUnlocked ? fullAnswer : undefined,
    hiddenCharCount,
    subscriptionExpiresAt: activeSub?.expiresAt,
  };
}
