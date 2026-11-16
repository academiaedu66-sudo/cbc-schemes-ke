import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const AI_CONFIG_PATH = '_system/ai-counselling-config.json';

export type CounsellingRole = 'PARENT' | 'LEARNER';

export interface CounsellingMessage {
  sender: 'user' | 'counsellor';
  text: string;
}

export interface StoredAiConfig {
  geminiApiKey?: string;
  geminiModel?: string;
  updatedAt?: string;
}

let cachedAiConfig: { data: StoredAiConfig; expiresAt: number } | null = null;

export async function getStoredAiConfig(): Promise<StoredAiConfig> {
  if (cachedAiConfig && Date.now() < cachedAiConfig.expiresAt) {
    return cachedAiConfig.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(AI_CONFIG_PATH);

    if (error || !data) {
      const empty: StoredAiConfig = {};
      cachedAiConfig = { data: empty, expiresAt: Date.now() + 15000 };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as StoredAiConfig;
    cachedAiConfig = { data: parsed, expiresAt: Date.now() + 15000 };
    return parsed;
  } catch {
    return {};
  }
}

export async function saveStoredAiConfig(next: StoredAiConfig): Promise<StoredAiConfig> {
  const payload: StoredAiConfig = {
    ...next,
    updatedAt: new Date().toISOString(),
  };

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(AI_CONFIG_PATH, Buffer.from(JSON.stringify(payload, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to save Gemini config: ${error.message}`);
  }

  cachedAiConfig = { data: payload, expiresAt: Date.now() + 15000 };
  return payload;
}

export async function resolveGeminiApiKey(): Promise<string> {
  const stored = await getStoredAiConfig();
  return (
    stored.geminiApiKey ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    ''
  ).trim();
}

function buildSystemPrompt(role: CounsellingRole, gradeLabel: string): string {
  if (role === 'PARENT') {
    return [
      'You are a warm, experienced, culturally grounded Kenyan Guidance & Counselling Specialist speaking directly to a PARENT or GUARDIAN.',
      `Context: The parent is supporting a child in Kenya's Competency-Based Curriculum (CBC / CBE), currently around ${gradeLabel || 'PP1–Grade 12'}.`,
      'Guidelines:',
      '1. Acknowledge the parent’s feelings with empathy and zero judgment.',
      '2. Give 3 to 5 clear, practical, actionable steps they can apply at home this week (positive communication, structured routines, partnering with teachers, emotional safety).',
      '3. Where relevant, align advice with Kenya’s CBC reality (formative CBA assessments, KPSEA in Grade 6, KJSEA in Grade 9, Senior School pathways in Grades 10–12: STEM, Social Sciences, and Arts & Sports Science).',
      '4. End with one gentle reflection question or encouraging closing sentence.',
      '5. If there is any mention of self-harm, abuse, or medical/safety crisis, prioritize immediate safety and share Childline Kenya (Toll-Free 116) and Kenya Red Cross (1199).',
      'Keep your response concise (around 160–240 words), structured with short bullet points for readability.',
    ].join('\n');
  }

  return [
    'You are a warm, uplifting, trustworthy Kenyan School Guidance & Counselling Mentor speaking directly to a LEARNER / STUDENT.',
    `Context: The learner is studying in Kenya's CBC system (${gradeLabel || 'Primary / Junior / Senior School'}).`,
    'Core Motto of this portal: "BE ALIVE, YOU ARE SPECIAL."',
    'Guidelines:',
    '1. Speak directly to the learner with kindness, respect, encouragement, and age-appropriate clarity.',
    '2. Validate how they feel so they know they are not alone, then share 3 to 5 practical, doable steps (study habits, active recall, managing exam nerves, healthy friendships, speaking up to a trusted parent/teacher).',
    '3. Where relevant, connect gently to Kenyan CBC milestones (KPSEA, KJSEA, Senior School STEM / Social Sciences / Arts & Sports pathways, talent & character growth).',
    '4. If the learner expresses hopelessness, self-harm, abuse, or severe distress, immediately respond with deep care, urge them to speak to a parent, school counsellor, or trusted adult right now, and provide Childline Kenya Toll-Free 116 (free 24/7) and Kenya Red Cross 1199.',
    '5. End with a short uplifting reminder of their worth and one simple next step they can try today.',
    'Keep your response concise (around 150–220 words), warm, and easy to read.',
  ].join('\n');
}

async function callGoogleGeminiApi(params: {
  apiKey: string;
  role: CounsellingRole;
  gradeLabel: string;
  messages: CounsellingMessage[];
}): Promise<string | null> {
  const modelsToTry = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const systemText = buildSystemPrompt(params.role, params.gradeLabel);

  const contents = params.messages.slice(-10).map((m) => ({
    role: m.sender === 'user' ? 'user' : 'model',
    parts: [{ text: m.text }],
  }));

  for (const model of modelsToTry) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(
        params.apiKey
      )}`;

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: systemText }],
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 650,
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

      if (text) return text;
    } catch {
      // Try next model or fallback
    }
  }

  return null;
}

function buildBuiltInRoleTailoredCounselling(params: {
  role: CounsellingRole;
  gradeLabel: string;
  lastUserMessage: string;
}): string {
  const q = params.lastUserMessage.toLowerCase();
  const gradeNote = params.gradeLabel ? ` (${params.gradeLabel})` : '';

  // 1. Immediate Crisis / Safety Check
  if (
    /(suicid|kill myself|end my life|self[- ]?harm|hurt myself|abuse|defil|beaten badly|hopeless|don't want to live)/i.test(
      q
    )
  ) {
    if (params.role === 'LEARNER') {
      return [
        'Thank you for speaking up — **your life matters deeply, and you do not have to carry this alone.**',
        '',
        '- **Reach out right now:** Please talk immediately to a parent, guardian, school counsellor, teacher, or religious leader you trust.',
        '- **Free 24/7 Confidential Help in Kenya:** Call **Childline Kenya on `116`** (completely free from any network) or **Kenya Red Cross on `1199`** to speak with a trained counsellor right away.',
        '- **Stay around safe people:** Move to a safe room or sit with a trusted family member or friend right now.',
        '',
        'Remember: **Be Alive, You Are Special.** Please call `116` or talk to a trusted adult right away — help is ready for you.',
      ].join('\n');
    }
    return [
      'Thank you for sharing this urgently. When a child’s physical or emotional safety is at risk, **immediate calm protection comes first.**',
      '',
      '- **Ensure immediate safety:** Stay calm, listen without anger or blame, and keep your child supervised in a safe environment.',
      '- **Call free 24/7 Kenyan specialist support:** Contact **Childline Kenya (`116`)** or **Kenya Red Cross (`1199`)** for immediate professional crisis & child-protection guidance.',
      '- **Seek in-person care:** Visit a trusted paediatric/mental-health counsellor or hospital assessment desk promptly.',
      '',
      'Your calm presence right now is your child’s strongest anchor.',
    ].join('\n');
  }

  // 2. Phone / Screen Time / Social Media / Gaming
  if (/(phone|tiktok|screen|tv|game|gaming|internet|social media|youtube|whatsapp)/i.test(q)) {
    if (params.role === 'PARENT') {
      return [
        `Managing phones and screen habits${gradeNote} works best when **clear family boundaries replace daily shouting matches**:`,
        '',
        '- **Set "Device Parking" Hours:** Agree on a fixed basket/charging spot in the living room (never inside bedrooms overnight) at least 1 hour before sleep.',
        '- **Use "Study First, Screen Second":** Tie 30–45 minutes of leisure screen time to completing concrete CBC homework or reading tasks first.',
        '- **Replace the Void:** Children reach for screens when bored or stressed — co-create offline alternatives (sports, creative projects, cooking, family walks).',
        '- **Model the Habit:** Keep dinner and homework check-in times phone-free for adults too.',
        '',
        'Which time of day (evenings, weekends, or holidays) triggers the biggest screen struggle at home right now?',
      ].join('\n');
    }
    return [
      `It is very honest of you to notice how phones or screens are affecting your focus${gradeNote}! Here is how to take back control without feeling miserable:`,
      '',
      '- **Put the Phone in Another Room for 30 Minutes:** Willpower is hard when notifications buzz next to your books. Study in short 30-minute phone-free sprints, then take a 5-minute break.',
      '- **Protect Your Sleep:** Scrolling late drains your memory for tomorrow’s lessons. Charge your phone away from your bed at night.',
      '- **Mute Group Chats During Study Hours:** True friends will respect your goal to level up your future.',
      '',
      'Try just **one 30-minute phone-free study block** today — which subject will you test it on first?',
    ].join('\n');
  }

  // 3. Pathway / Career / Grade 10 Senior School Selection
  if (/(pathway|stem|career|grade 10|senior school|subject choice|future|what to become)/i.test(q)) {
    if (params.role === 'PARENT') {
      return [
        `Guiding your child into Kenya’s CBC Senior School Pathways${gradeNote} works best by balancing **natural ability, genuine interest, and future opportunity**:`,
        '',
        '- **Understand the 3 KICD Senior School Pathways:**',
        '  1. **STEM** (Pure Sciences, Applied Sciences, Technical & Engineering)',
        '  2. **Social Sciences** (Languages & Literature, Humanities & Business Studies)',
        '  3. **Arts & Sports Science** (Performing/Visual Arts & Sports Science)',
        '- **Avoid Forcing Prestige Alone:** Look at consistent KJSEA/school SBA strengths *and* which tasks energize your child naturally.',
        '- **Explore Real Careers Together:** Let them speak to professionals in fields they admire so they see why daily discipline matters.',
        '',
        'Which 2 or 3 learning areas does your child currently enjoy or perform best in?',
      ].join('\n');
    }
    return [
      `Thinking about your Senior School pathway and future career${gradeNote} is an exciting step! Here is a clear way to choose wisely:`,
      '',
      '- **Match Your 3 Clues:** Write down (1) subjects you understand fastest, (2) activities you enjoy even when they are challenging, and (3) problems in society you would love to solve.',
      '- **Know Kenya’s 3 CBC Pathways:**',
      '  - **STEM:** Great if you love Maths, Integrated Science, Pre-Technical, Medicine, Engineering, Tech, or Agriculture.',
      '  - **Social Sciences:** Great for Law, Business, Economics, Journalism, Languages, Teaching, and Leadership.',
      '  - **Arts & Sports:** Great for Creative Design, Media, Music, Performing Arts, and Sports Science.',
      '- **Don’t Pick Just Because Friends Picked It:** Your gift is unique — **Be Alive, You Are Special!**',
      '',
      'Tell me your **top 3 favourite subjects** right now and I will help you map the best pathway!',
    ].join('\n');
  }

  // 4. Exam Anxiety / KPSEA / KJSEA / Fear of Failing / Stress
  if (/(exam|test|kpsea|kjsea|anxi|afraid|fear|fail|panic|nervous|stress|overwhelm)/i.test(q)) {
    if (params.role === 'PARENT') {
      return [
        `Exam pressure${gradeNote} can make children freeze even when they have studied. Here is how you as a parent can calm their mind and boost performance:`,
        '',
        '- **Praise Effort Over Raw Marks:** Say *"I am proud of how consistently you are revising"* rather than comparing them to siblings or neighbours.',
        '- **Break Revision into Small Wins:** Help them revise **2 sub-strands per day** using past/trial papers instead of cramming whole textbooks at night.',
        '- **Guard Sleep & Nutrition:** 7.5–8 hours of sleep locks memory into the brain far better than midnight panic reading.',
        '- **Reassure Unconditional Support:** Remind your child that assessments measure progress, not their worth as your child.',
        '',
        'Is an Opener, Mid-Term, KPSEA, or KJSEA assessment coming up soon for your child?',
      ].join('\n');
    }
    return [
      `Feeling nervous before exams${gradeNote} actually shows that **you care about doing well** — let’s turn that nervousness into calm confidence:`,
      '',
      '- **Use the 25-Minute Rule:** Instead of staring at a huge pile of notes, pick **one topic**, study actively for 25 minutes, close the book, and write down 5 things you remember.',
      '- **Practice Questions Early:** Answering Opener/Mid-Term or KPSEA/KJSEA trial questions trains your brain so the exam room feels familiar.',
      '- **4-4-4 Calm Breathing:** If your heart races in an exam, breathe in for 4 seconds, hold for 4 seconds, and breathe out slowly for 4 seconds.',
      '- **Remember Your Worth:** One paper never defines your whole future. **Be Alive, You Are Special!**',
      '',
      'Which subject makes you feel the most nervous right now? Let’s make a simple game plan for it!',
    ].join('\n');
  }

  // 5. Peer Pressure / Friends / Bullying / Confidence
  if (/(friend|peer|bully|tease|fit in|lonely|confidence|self[- ]?esteem|shy)/i.test(q)) {
    if (params.role === 'PARENT') {
      return [
        `Peer influence and social confidence${gradeNote} shape both emotional health and school focus. Here is how to guide your child effectively:`,
        '',
        '- **Listen More Than You Lecture:** Ask open questions like *"How did your friends handle that?"* so your child feels safe telling you the truth.',
        '- **Know Their Circle:** Welcome their friends warmly or stay connected with fellow parents and the class teacher.',
        '- **Coach Firm Scripts:** Practice simple ways your child can say *"No thanks, that’s not for me"* without feeling awkward.',
        '- **Address Bullying Promptly:** If your child is being bullied, document specific incidents calmly and partner with the school administration/counsellor.',
        '',
        'Has your child pulled back quietly lately, or mentioned a specific group at school?',
      ].join('\n');
    }
    return [
      `Friendships and fitting in${gradeNote} can feel tough sometimes, so I am really glad you shared this:`,
      '',
      '- **Real Friends Respect Your Boundaries:** Anyone who pressures you to break rules, disrespect yourself, or abandon your goals is not protecting your future.',
      '- **Quality Beats Crowd Size:** Having **1 or 2 honest, encouraging friends** is far better than trying to please a loud group.',
      '- **Speak Up Early:** If someone is bullying or intimidating you, tell a trusted teacher, school counsellor, or parent — speaking up is strength, not weakness.',
      '- **Stand Tall in Who You Are:** You don’t need to copy anyone else to matter. **Be Alive, You Are Special!**',
      '',
      'Would you like tips on handling a specific friendship situation at school?',
    ].join('\n');
  }

  // 6. Academic Struggles / Maths / Science / Motivation / Timetable
  if (/(math|science|grade|marks|drop|improv|lazy|unmotivat|procrastinat|timetable|focus|study)/i.test(q)) {
    if (params.role === 'PARENT') {
      return [
        `When a learner’s motivation or marks dip${gradeNote}, the root cause is usually **skill gaps or feeling overwhelmed**, not laziness:`,
        '',
        '- **Pinpoint the Exact Gap:** Sit together for 15 minutes and ask *"Which exact topic started feeling confusing?"* — especially in cumulative subjects like Mathematics and Sciences.',
        '- **Create a Visible 1-Hour Daily Routine:** Consistency at the same hour each evening beats 5-hour weekend marathons.',
        '- **Celebrate Small Improvements:** Moving from 45% to 55% deserves genuine encouragement — momentum builds confidence!',
        '- **Consider Targeted Holiday/Personal Support:** A patient personal subject teacher for 2–3 tough subjects often unlocks rapid progress.',
        '',
        'Which specific subjects is your child finding toughest this term?',
      ].join('\n');
    }
    return [
      `Every top student once struggled with a tough subject${gradeNote} — falling behind simply means **you need a clearer method, not that you aren’t smart!**`,
      '',
      '- **Start With Your Hardest Subject When Fresh:** Give 25 focused minutes to Maths or Science *before* doing easier subjects.',
      '- **Learn by Doing, Not Just Reading:** Work out 5 practice problems on paper every day and check where each step went right or wrong.',
      '- **Ask Questions Without Shame:** Write down 2 things you didn’t understand in class and ask your teacher or study partner the same day.',
      '- **Track Daily Streaks:** Tick off each day you complete your 45-minute personal revision block!',
      '',
      'Which 1 or 2 subjects would you love to turn into your strongest comeback this term?',
    ].join('\n');
  }

  // 7. Default Warm Role-Specific Guidance (Parent vs Learner)
  if (params.role === 'PARENT') {
    return [
      `Thank you for reaching out as a **Parent / Guardian**${gradeNote}. Supporting your child’s academic and emotional growth takes patience and partnership:`,
      '',
      '- **Lead With Connection Before Correction:** Spend 10 relaxed minutes checking in on your child’s day before asking about homework or grades.',
      '- **Keep Routines Predictable:** Clear times for meals, 45–60 minutes of focused CBC study, chores, and rest help children feel secure and disciplined.',
      '- **Partner With Teachers Early:** Check your child’s progress across strands mid-term rather than waiting for end-term reports.',
      '- **Affirm Their Strengths:** Notice character, effort, creativity, and kindness alongside academic marks.',
      '',
      'Tell me a little more about your child’s grade level and the specific challenge on your mind so I can tailor step-by-step guidance for you.',
    ].join('\n');
  }

  return [
    `Welcome! I am really glad you reached out as a **Learner**${gradeNote}. First, always remember: **Be Alive, You Are Special!**`,
    '',
    '- **Take One Step at a Time:** Big goals become easy when broken into one small daily habit (even 30 focused minutes a day!).',
    '- **Ask for Help Early:** Strong learners ask teachers, parents, and mentors questions whenever something feels confusing or heavy.',
    '- **Balance Mind & Body:** Good sleep, water, physical play, and choosing positive friends sharpen your memory and mood.',
    '- **Believe in Your Growth:** Your brain grows stronger every time you practice something difficult.',
    '',
    'Share what is on your mind right now — whether it is **studies, exams, choosing a career pathway, friendships, or stress at home/school** — and let’s work through it together!',
  ].join('\n');
}

export async function generateGuidanceCounsellingReply(params: {
  role: CounsellingRole;
  gradeLabel?: string;
  messages: CounsellingMessage[];
}): Promise<{ reply: string; provider: 'gemini' | 'cbc-counsellor-ai' }> {
  const cleanMessages = params.messages.filter((m) => m.text?.trim());
  const lastUser =
    [...cleanMessages].reverse().find((m) => m.sender === 'user')?.text || '';
  const gradeLabel = (params.gradeLabel || '').trim();

  const apiKey = await resolveGeminiApiKey();
  if (apiKey) {
    const geminiText = await callGoogleGeminiApi({
      apiKey,
      role: params.role,
      gradeLabel,
      messages: cleanMessages,
    });

    if (geminiText) {
      return { reply: geminiText, provider: 'gemini' };
    }
  }

  return {
    reply: buildBuiltInRoleTailoredCounselling({
      role: params.role,
      gradeLabel,
      lastUserMessage: lastUser,
    }),
    provider: 'cbc-counsellor-ai',
  };
}
