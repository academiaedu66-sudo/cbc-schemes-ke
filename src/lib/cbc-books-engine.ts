import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  PageBreak,
  Paragraph,
  TextRun,
} from 'docx';
import {
  buildDomainLessonNotes,
  getAllApprovedCoursebooksForGradeSubject,
  getApprovedCoursebook,
  getSyllabusForGrade,
  GRADES_CURRICULUM_PLAN,
  KICD_OFFICIAL_APPROVED_PORTAL_URL,
  PREPRIMARY_CURRICULUM_PLAN,
} from '../../scripts/cbc-syllabus-data.mjs';
import { ALL_GAMING_SUBJECTS, resolveSyllabusSubject } from '@/lib/gaming';
import {
  DOMAIN_EXERCISE_BANKS,
  generateDeepSubjectExercise,
  generateExtraTextbookExercise,
  generateWorkedDomainExercise,
  generateWorkedMathematicsExercise,
  type ExerciseItem,
  type StrandContext,
} from '@/lib/gaming-exercises';

export type CbcBookType = 'GRADE_UP' | 'MADE_FAMILIAR' | 'COMPLETE_BUNDLE';

export const BOOK_PRICES_KES: Record<CbcBookType, number> = {
  GRADE_UP: 500,
  MADE_FAMILIAR: 750,
  COMPLETE_BUNDLE: 1500,
};

export const BOOK_SERIES_TITLES: Record<CbcBookType, string> = {
  GRADE_UP: 'CBC GRADE UP',
  MADE_FAMILIAR: 'SUPER-LIGHT CBC COMPILATION',
  COMPLETE_BUNDLE: 'SMART CBC ALL SUBJECTS',
};

interface SyllabusBlock {
  strand: string;
  subs: string[];
  kiq: string;
  resources: string;
}

export interface EnrichedSubTopic {
  term: number;
  strandIndex: number;
  strand: string;
  substrand: string;
  subtopicTitle: string;
  kiq: string;
  resources: string;
}

function cleanScope(text: string): string {
  return String(text || '')
    .replace(/\s*\([^)]*Scope\)/gi, '')
    .trim();
}

function toPdfSafe(str: string): string {
  return String(str || '')
    .replace(/√/g, 'sqrt')
    .replace(/⁴/g, '^4')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/₁/g, '1')
    .replace(/₂/g, '2')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/÷/g, '/')
    .replace(/×/g, 'x')
    .replace(/−/g, '-')
    .replace(/⇒/g, '=>')
    .replace(/→/g, '->')
    .replace(/Ω/g, 'Ohm')
    .replace(/π/g, 'pi')
    .replace(/λ/g, 'lambda')
    .replace(/ρ/g, 'rho')
    .replace(/°/g, ' deg')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/•/g, '*')
    .replace(/\s{2,}/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapPdfText(text: string, maxChars = 86): string[] {
  const safe = toPdfSafe(text);
  const out: string[] = [];
  for (const rawLine of safe.split('\n')) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      out.push('');
      continue;
    }
    const words = trimmed.split(' ');
    let cur = '';
    for (const w of words) {
      if ((cur + ' ' + w).trim().length > maxChars) {
        if (cur) out.push(cur);
        cur = w;
      } else {
        cur = cur ? `${cur} ${w}` : w;
      }
    }
    if (cur) out.push(cur);
  }
  return out;
}

function splitSubAspects(sub: string): string[] {
  const cleaned = cleanScope(sub);
  const colonIdx = cleaned.indexOf(':');
  let prefix = '';
  let rest = cleaned;
  if (colonIdx > 0 && colonIdx < cleaned.length - 3) {
    prefix = cleaned.slice(0, colonIdx).trim();
    rest = cleaned.slice(colonIdx + 1).trim();
  }
  const rawParts = rest
    .split(/[,;&]|\band\b|\bna\b/i)
    .map((p) => p.trim())
    .filter((p) => p.length > 3);

  if (rawParts.length <= 1) return [cleaned];
  return rawParts.map((part) =>
    prefix && !part.toLowerCase().includes(prefix.toLowerCase())
      ? `${prefix}: ${part}`
      : part
  );
}

export function formatBookGradeLabel(gradeKey: string): string {
  const up = gradeKey.toUpperCase().trim();
  if (up === 'PP1' || up === 'PP2') return up;
  return `Grade ${up}`;
}

export function getSubjectsForGradeKey(gradeKey: string): string[] {
  const up = gradeKey.toUpperCase().trim();
  if (up === 'PP1' || up === 'PP2') {
    const found = PREPRIMARY_CURRICULUM_PLAN.find((p) => p.gradeCode === up);
    if (found) return [...found.subjects];
  } else {
    const gNum = Number(up);
    const found = GRADES_CURRICULUM_PLAN.find((p) => p.grade === gNum);
    if (found) return [...found.subjects];
  }
  return [...ALL_GAMING_SUBJECTS];
}

function resolveDomainKey(subject: string): string {
  const s = subject.toLowerCase();
  if (s.includes('math')) return 'mathematics';
  if (s.includes('fasihi')) return 'fasihi_kiswahili';
  if (s.includes('kiswahili')) return 'kiswahili';
  if (s.includes('literature in english')) return 'literature_english';
  if (s === 'french') return 'french';
  if (s === 'arabic') return 'arabic';
  if (s === 'german') return 'german';
  if (s.includes('english') || s.includes('language')) return 'english';
  if (s.includes('biology')) return 'biology';
  if (s.includes('chemistry')) return 'chemistry';
  if (
    s.includes('electricity') ||
    s.includes('aviation') ||
    s.includes('building') ||
    s.includes('metal') ||
    s.includes('power mechanics') ||
    s.includes('woodwork') ||
    s.includes('media technology')
  ) {
    return 'technical_engineering';
  }
  if (s.includes('physics')) return 'physics';
  if (s.includes('home science') || s.includes('homescience')) return 'homescience';
  if (s.includes('marine') || s.includes('fisheries')) return 'agriculture';
  if (s.includes('science')) return 'science';
  if (s.includes('environmental')) return 'environmental';
  if (s.includes('agriculture')) return 'agriculture';
  if (s.includes('business')) return 'business';
  if (
    s.includes('pre-technical') ||
    s.includes('computer') ||
    s.includes('information communication') ||
    s === 'ict'
  ) {
    return 'pretech_computer';
  }
  if (
    s.includes('creative') ||
    s.includes('music') ||
    s.includes('theatre') ||
    s.includes('fine arts') ||
    s.includes('sports') ||
    s.includes('physical education')
  ) {
    return 'creative_sports';
  }
  if (s.includes('christian') || s.includes('cre')) return 'cre';
  if (s.includes('islamic') || s.includes('ire')) return 'ire';
  return 'social_history_geography';
}

export interface ApprovedBookRef {
  series: string;
  publisher: string;
  authors: string;
  note?: string;
}

export function collectOrderedSubTopics(
  gradeKey: string,
  subject: string
): {
  strands: Array<{ strand: string; subs: string[]; kiq: string; resources: string }>;
  subTopics: EnrichedSubTopic[];
  coursebookTitle: string;
  approvedBooks: ApprovedBookRef[];
  officialPortalUrl: string;
} {
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const gradeArg = gradeKey.toUpperCase().startsWith('PP')
    ? gradeKey.toUpperCase()
    : Number(gradeKey) || 7;
  const syl = getSyllabusForGrade(gradeArg, sylSubject);
  const cb = getApprovedCoursebook(gradeArg, sylSubject);
  const rawApproved = (getAllApprovedCoursebooksForGradeSubject(
    gradeArg,
    sylSubject
  ) || []) as ApprovedBookRef[];

  const strandsMap: Array<{
    strand: string;
    subs: string[];
    kiq: string;
    resources: string;
  }> = [];
  const subTopics: EnrichedSubTopic[] = [];

  for (const term of [1, 2, 3]) {
    const blocks = (syl.strandsByTerm[term] || []) as SyllabusBlock[];
    for (const b of blocks) {
      if (!b || !b.strand || !Array.isArray(b.subs)) continue;
      const strandName = b.strand.trim();
      let grp = strandsMap.find((g) => g.strand === strandName);
      if (!grp) {
        grp = {
          strand: strandName,
          subs: [],
          kiq: b.kiq || '',
          resources: b.resources || '',
        };
        strandsMap.push(grp);
      }
      const sIdx = strandsMap.indexOf(grp);

      for (const rawSub of b.subs) {
        const cleanSub = cleanScope(rawSub);
        if (!grp.subs.includes(cleanSub)) {
          grp.subs.push(cleanSub);
        }
        const aspects = splitSubAspects(cleanSub);
        for (const asp of aspects) {
          subTopics.push({
            term,
            strandIndex: sIdx,
            strand: strandName,
            substrand: cleanSub,
            subtopicTitle: asp,
            kiq: b.kiq || '',
            resources: b.resources || 'Approved Learner Book, charts & practical realia',
          });
        }
      }
    }
  }

  return {
    strands: strandsMap,
    subTopics,
    coursebookTitle: cb.lbTitle,
    approvedBooks: rawApproved,
    officialPortalUrl: KICD_OFFICIAL_APPROVED_PORTAL_URL,
  };
}

export interface BookQuestionEntry {
  qNumber: number;
  strand: string;
  substrand: string;
  prompt: string;
  options?: [string, string, string, string];
  marks: number;
  answerText: string;
  explanation: string;
}

const ENGLISH_STRUCTURED_STEMS: Array<{
  marks: number;
  build: (t: EnrichedSubTopic, gradeLabel: string, subject: string) => {
    prompt: string;
    ans: string;
    exp: string;
  };
}> = [
  {
    marks: 4,
    build: (t) => ({
      prompt: `State and explain two core principles or rules learned under "${t.subtopicTitle}".`,
      ans: `Any two accurate principles/rules on "${t.subtopicTitle}" clearly explained (2 x 2 = 4 marks).`,
      exp: `Award 1 mark for naming each valid point and 1 mark for accurate explanation aligned to "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `${t.kiq || `How is "${t.subtopicTitle}" applied in everyday life in Kenya?`} Support your answer with two practical examples.`,
      ans: `Two well-explained real-life Kenyan applications answering the prompt on "${t.subtopicTitle}" (4 marks).`,
      exp: `Award 2 marks per clear, contextually accurate example demonstrating mastery of "${t.substrand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `During a practical activity on "${t.subtopicTitle}" using ${t.resources.toLowerCase()}, outline three sequential steps learners must follow.`,
      ans: `Three logical, ordered practical steps when working with ${t.resources.toLowerCase()} on "${t.subtopicTitle}" (3 marks).`,
      exp: `Award 1 mark for each accurate procedural step in proper sequence.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Distinguish clearly between the key concepts studied in "${t.subtopicTitle}" and give one real-world illustration.`,
      ans: `Clear conceptual distinction on "${t.subtopicTitle}" (2 mks) + 1 accurate real-world illustration (2 mks) = 4 marks.`,
      exp: `Ensure both sides of the distinction are stated explicitly rather than treating one side in isolation.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Identify three safety, hygiene, or accuracy precautions that must be observed when investigating "${t.subtopicTitle}".`,
      ans: `Three valid safety, hygiene, or accuracy precautions relevant to "${t.subtopicTitle}" (3 marks).`,
      exp: `Award 1 mark per distinct, actionable precaution using ${t.resources.toLowerCase()}.`,
    }),
  },
  {
    marks: 4,
    build: (t, gLbl) => ({
      prompt: `A ${gLbl} classmate made a common error while attempting a task on "${t.subtopicTitle}". Identify two common mistakes learners make in this topic and state how to avoid each.`,
      ans: `Two realistic misconceptions/errors on "${t.subtopicTitle}" (2 mks) + corrective method for each (2 mks) = 4 marks.`,
      exp: `Diagnostic awareness prevents careless errors during assessments on "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain two benefits of mastering "${t.subtopicTitle}" to a learner’s family or local Kenyan community.`,
      ans: `Two practical household, economic, or community benefits of "${t.subtopicTitle}" explained clearly (4 marks).`,
      exp: `Connect classroom knowledge under "${t.strand}" directly to problem-solving in society.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Define three key technical terms or vocabulary items encountered when studying "${t.subtopicTitle}".`,
      ans: `Accurate definitions of three domain terms belonging to "${t.subtopicTitle}" (3 x 1 = 3 marks).`,
      exp: `Precise command of subject terminology is essential for full marks in structured responses.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Describe how a group of learners can improvise locally available materials in place of ${t.resources.toLowerCase()} to demonstrate "${t.subtopicTitle}".`,
      ans: `Valid local improvisation materials identified (2 mks) + clear explanation of how they model "${t.subtopicTitle}" (2 mks).`,
      exp: `Resourcefulness and environmental responsibility are rewarded when improvising learning aids safely.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Analyze a real-world scenario in Kenya where failure to apply proper rules of "${t.subtopicTitle}" causes a problem, and propose two solutions.`,
      ans: `Clear problem analysis linked to "${t.subtopicTitle}" (2 mks) + two workable solutions (2 mks) = 4 marks.`,
      exp: `Award marks for logical cause-and-effect reasoning and practical remedies.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Write a concise three-point summary checklist that a learner can use to revise "${t.subtopicTitle}" before an assessment.`,
      ans: `Three distinct, accurate summary points capturing the essence of "${t.subtopicTitle}" (3 marks).`,
      exp: `Each bullet must state a complete, verifiable fact or rule under "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain how "${t.subtopicTitle}" connects to other sub-strands within "${t.strand}" and why it must be learned in sequence.`,
      ans: `Clear explanation of conceptual progression within "${t.strand}" involving "${t.subtopicTitle}" (4 marks).`,
      exp: `Foundational mastery of "${t.subtopicTitle}" supports advanced tasks across "${t.strand}".`,
    }),
  },
  {
    marks: 4,
    build: (t, _g, subj) => ({
      prompt: `Outline two career or enterprise opportunities in Kenya that rely directly on skills developed in "${t.subtopicTitle}" (${subj}).`,
      ans: `Two relevant careers/enterprises named (2 mks) + clear link to skills in "${t.subtopicTitle}" (2 mks) = 4 marks.`,
      exp: `Demonstrates practical career-pathway awareness grounded in "${t.substrand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `State three observable indicators that show a learner has accurately completed a practical or written task on "${t.subtopicTitle}".`,
      ans: `Three measurable quality/accuracy indicators for "${t.subtopicTitle}" (3 marks).`,
      exp: `Focus on precision, neatness, correct method, and verified results.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Formulate a worked example or short case study illustrating "${t.subtopicTitle}", showing both the setup and final conclusion.`,
      ans: `Original, accurate case study / worked illustration on "${t.subtopicTitle}" (2 mks) + verified conclusion (2 mks).`,
      exp: `Award marks for realistic data/context and logical step-by-step reasoning.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Explain two ethical, environmental, or responsible-citizenship values promoted when practising "${t.subtopicTitle}".`,
      ans: `Two relevant values (e.g. integrity, safety, conservation, respect) explained in the context of "${t.subtopicTitle}" (4 marks).`,
      exp: `Link each value concretely to actions taken during "${t.subtopicTitle}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Give three reasons why ${t.resources.toLowerCase()} are effective when studying "${t.subtopicTitle}".`,
      ans: `Three distinct pedagogical/practical advantages of using ${t.resources.toLowerCase()} for "${t.subtopicTitle}" (3 marks).`,
      exp: `Concrete aids enhance visual clarity, hands-on retention, and measurement accuracy.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Compare traditional and modern approaches to handling tasks related to "${t.subtopicTitle}" in Kenya.`,
      ans: `Two valid comparison points showing traditional vs modern methods in "${t.subtopicTitle}" (2 x 2 = 4 marks).`,
      exp: `Highlight efficiency, sustainability, cost, and accuracy across both approaches.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Outline three questions a keen learner should ask when observing a demonstration on "${t.subtopicTitle}".`,
      ans: `Three relevant inquiry questions probing how, why, and where "${t.subtopicTitle}" works (3 marks).`,
      exp: `Critical inquiry deepens conceptual understanding of "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Describe how digital technology or ICT tools can be used responsibly to research or present findings on "${t.subtopicTitle}".`,
      ans: `Two responsible digital/ICT uses for researching, recording, or presenting "${t.subtopicTitle}" (4 marks).`,
      exp: `Include data accuracy, source verification, and online safety.`,
    }),
  },
];

const KISWAHILI_STRUCTURED_STEMS: Array<{
  marks: number;
  build: (t: EnrichedSubTopic) => { prompt: string; ans: string; exp: string };
}> = [
  {
    marks: 4,
    build: (t) => ({
      prompt: `Fafanua mambo mawili makuu yanayozingatiwa katika "${t.subtopicTitle}" na utoe mfano mmoja sahihi kwa kila moja.`,
      ans: `Hoja 2 sahihi kuhusu "${t.subtopicTitle}" pamoja na mifano 2 sanifu ya Kiswahili (Alama 2 x 2 = 4).`,
      exp: `Zingatia ufasaha wa lugha, upatanisho wa kisarufi na maelezo yanayolenga "${t.substrand}".`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `${t.kiq || `Ni kwa namna gani "${t.subtopicTitle}" hutumika katika mawasiliano ya kila siku?`} Eleza kwa hoja mbili.`,
      ans: `Maelezo mawili yenye mantiki yanayojibu swali na kuhusisha mazingira halisi ya mwanafunzi (Alama 4).`,
      exp: `Kila hoja iliyofafanuliwa vizuri kwa Kiswahili sanifu ituzwe alama 2.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tunga sentensi mbili sahihi zinazodhihirisha matumizi na umilisi wa "${t.subtopicTitle}".`,
      ans: `Sentensi 2 sahihi zisizo na makosa ya sarufi wala hijai kuhusu "${t.subtopicTitle}" (Alama 4).`,
      exp: `Hakiki usahihi wa muundo, alama za uakifishaji na matumizi mwafaka ya msamiati.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Eleza umuhimu wa kutumia vifaa vifuatavyo wakati wa kujifunza "${t.subtopicTitle}": ${t.resources}.`,
      ans: `Faida 3 sahihi za kutumia (${t.resources}) katika kujifunza "${t.subtopicTitle}" (Alama 3).`,
      exp: `Tuzo ya alama 1 kwa kila faida sahihi iliyotajwa kwa ufasaha.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tambua makosa mawili ya kawaida ambayo wanafunzi hufanya katika "${t.subtopicTitle}" na uonyeshe jinsi ya kuyarekebisha.`,
      ans: `Makosa 2 yaliyotambuliwa (alama 2) + marekebisho sahihi kwa kila kosa (alama 2) = Alama 4.`,
      exp: `Kuzingatia kanuni za "${t.substrand}" huondoa utata katika maandishi na mazungumzo.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Eleza manufaa mawili ya kuzingatia stadi za "${t.subtopicTitle}" shuleni na katika jamii ya Kenya.`,
      ans: `Manufaa 2 yaliyofafanuliwa kikamilifu kuhusu "${t.subtopicTitle}" (Alama 4).`,
      exp: `Husisha stadi hiyo na mawasiliano yenye adabu, umoja na ufanisi.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Andika muhtasari wa vidokezo vitatu muhimu vya kuzingatia unapojikumbusha mada ya "${t.subtopicTitle}".`,
      ans: `Vidokezo 3 mahsusi na sahihi vinavyojumuisha kiini cha "${t.subtopicTitle}" (Alama 3).`,
      exp: `Kila kidokezo kiwe kamili na chenye maana inayojitosheleza.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Tofautisha vipengele vikuu vinavyojitokeza katika "${t.subtopicTitle}" kwa kutoa mifano miwili mwafaka.`,
      ans: `Tofauti iliyowekwa wazi kuhusu "${t.subtopicTitle}" (alama 2) + mifano 2 sahihi (alama 2) = Alama 4.`,
      exp: `Tumia viunganishi vya ulinganuzi kwa usahihi.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Bainisha maadili mawili ya kijamii yanayokuzwa kupitia mada ndogo ya "${t.subtopicTitle}".`,
      ans: `Maadili 2 (k.m. heshima, uwajibikaji, ushirikiano) yaliyofafanuliwa kulingana na "${t.subtopicTitle}" (Alama 4).`,
      exp: `Onyesha uhusiano wa moja kwa moja kati ya maadili hayo na "${t.strand}".`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Eleza hatua tatu ambazo kikundi cha wanafunzi kitafuata kinapojadili na kuwasilisha kazi kuhusu "${t.subtopicTitle}".`,
      ans: `Hatua 3 zenye mtiririko mzuri wa utafiti, mjadala na uwasilishaji kuhusu "${t.subtopicTitle}" (Alama 3).`,
      exp: `Zingatia ushirikiano, utamkaji bora na matumizi ya mifano hai.`,
    }),
  },
  {
    marks: 4,
    build: (t) => ({
      prompt: `Andika mazungumzo mafupi ya zamu nne kati ya wanafunzi wawili yakidhihirisha matumizi sahihi ya "${t.subtopicTitle}".`,
      ans: `Mazungumzo mafupi yenye lugha ya adabu na yanayotumia vipengele vya "${t.subtopicTitle}" kwa usahihi (Alama 4).`,
      exp: `Tathmini uhalisia wa muktadha, uakifishaji wa dayalojia na ufasaha.`,
    }),
  },
  {
    marks: 3,
    build: (t) => ({
      prompt: `Fafanua maana ya istilahi au maneno matatu muhimu yanayopatikana katika "${t.subtopicTitle}".`,
      ans: `Maana sahihi za maneno/istilahi 3 zinazohusiana na "${t.subtopicTitle}" (Alama 3).`,
      exp: `ufafanuzi uzingatie muktadha wa "${t.substrand}".`,
    }),
  },
];

function normalizePromptKey(prompt: string): string {
  return String(prompt || '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Generates a deterministic, STRICTLY ZERO-DUPLICATE pool of exam & sub-topic questions
 * systematically spanning EVERY Strand and Sub-strand in sequential order!
 * Supports `startOffset` so Book 1 (CBC GRADE UP: offset 120, count 170) and
 * Book 2 (MADE FAMILIAR: offset 0, count 120) have 0% overlap — making all 290 questions
 * in the 100-Page COMPLETE COMPILATION 100% unique!
 */
export function buildFullBookQuestionPool(
  gradeKey: string,
  subject: string,
  targetCount: number,
  startOffset = 0
): BookQuestionEntry[] {
  const totalNeeded = startOffset + targetCount;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const { subTopics } = collectOrderedSubTopics(gradeKey, subject);
  const domain = resolveDomainKey(subject);
  const isKis = domain === 'kiswahili' || domain === 'fasihi_kiswahili';
  const bank = DOMAIN_EXERCISE_BANKS[domain] || [];
  const usedPrompts = new Set<string>();
  const masterOut: BookQuestionEntry[] = [];

  for (let i = 0; i < totalNeeded; i++) {
    const topic = subTopics[i % Math.max(1, subTopics.length)];
    const ctx: StrandContext = {
      gradeKey,
      gradeLabel,
      subject,
      strand: topic.strand,
      substrand: topic.substrand,
    };
    const hay = `${topic.strand} ${topic.substrand} ${topic.subtopicTitle}`.toLowerCase();

    let pickedEx: ExerciseItem | null = null;

    if (i % 3 !== 2) {
      if (domain === 'mathematics') {
        for (let att = 0; att < 400; att++) {
          const cand = generateWorkedMathematicsExercise(ctx, i * 19 + att * 31 + 7);
          const norm = normalizePromptKey(cand.q);
          if (!usedPrompts.has(norm)) {
            pickedEx = cand;
            break;
          }
        }
      } else {
        // 1. Strand-matched bank item
        const matched = bank.find(
          (item) =>
            !usedPrompts.has(normalizePromptKey(item.q)) &&
            item.tags.some((t) => hay.includes(t.toLowerCase()))
        );
        if (matched) pickedEx = matched;

        // 2. Worked quantitative/parametric exercise for this subject
        if (!pickedEx && i % 2 === 1) {
          for (let att = 0; att < 200; att++) {
            const w = generateWorkedDomainExercise(domain, ctx, i * 11 + att * 17 + 5);
            if (w && !usedPrompts.has(normalizePromptKey(w.q))) {
              pickedEx = w;
              break;
            }
          }
        }

        // 3. Remaining bank / extra / deep subject exercises
        if (!pickedEx) {
          const anyBank = bank.find(
            (item) => !usedPrompts.has(normalizePromptKey(item.q))
          );
          if (anyBank) pickedEx = anyBank;
        }
        if (!pickedEx) {
          for (let p = 0; p < 160; p++) {
            const ex = generateExtraTextbookExercise(domain, ctx, i + p);
            if (ex && !usedPrompts.has(normalizePromptKey(ex.q))) {
              pickedEx = ex;
              break;
            }
          }
        }
        if (!pickedEx) {
          for (let p = 0; p < 160; p++) {
            const dp = generateDeepSubjectExercise(domain, ctx, i + p);
            if (dp && !usedPrompts.has(normalizePromptKey(dp.q))) {
              pickedEx = dp;
              break;
            }
          }
        }
        if (!pickedEx) {
          for (let att = 0; att < 250; att++) {
            const w = generateWorkedDomainExercise(domain, ctx, i * 13 + att * 23 + 9);
            if (w && !usedPrompts.has(normalizePromptKey(w.q))) {
              pickedEx = w;
              break;
            }
          }
        }
      }
    }

    if (pickedEx) {
      usedPrompts.add(normalizePromptKey(pickedEx.q));
      const corrLetter = ['A', 'B', 'C', 'D'][pickedEx.ans] || 'A';
      const corrVal = pickedEx.options[pickedEx.ans];
      masterOut.push({
        qNumber: i + 1,
        strand: topic.strand,
        substrand: topic.subtopicTitle,
        prompt: pickedEx.q,
        options: pickedEx.options,
        marks: 2,
        answerText: `${corrLetter} (${corrVal})`,
        explanation: pickedEx.exp,
      });
      continue;
    }

    // Structured Written / Practical / Application Question — guaranteed 100% unique!
    if (domain === 'mathematics') {
      let extraMath: ExerciseItem | null = null;
      for (let att = 0; att < 500; att++) {
        const cand = generateWorkedMathematicsExercise(
          ctx,
          1000 + i * 37 + att * 41
        );
        const candPrompt = `${cand.q} (Show all your working steps clearly).`;
        if (
          !usedPrompts.has(normalizePromptKey(cand.q)) &&
          !usedPrompts.has(normalizePromptKey(candPrompt))
        ) {
          extraMath = cand;
          usedPrompts.add(normalizePromptKey(cand.q));
          usedPrompts.add(normalizePromptKey(candPrompt));
          masterOut.push({
            qNumber: i + 1,
            strand: topic.strand,
            substrand: topic.subtopicTitle,
            prompt: candPrompt,
            marks: 3,
            answerText: `${cand.options[cand.ans]}`,
            explanation: `Method & Accuracy: ${cand.exp} (Award M1 for formula/setup, M1 for substitution, A1 for accuracy).`,
          });
          break;
        }
      }
      if (extraMath) continue;
    }

    let placedStructured = false;
    const stems = isKis ? KISWAHILI_STRUCTURED_STEMS : ENGLISH_STRUCTURED_STEMS;
    const basePass = Math.floor(i / Math.max(1, subTopics.length));

    for (let shift = 0; shift < stems.length * Math.max(1, subTopics.length); shift++) {
      const tCand = subTopics[(i + shift) % Math.max(1, subTopics.length)];
      const stemIdx = (basePass + shift) % stems.length;
      const built = isKis
        ? KISWAHILI_STRUCTURED_STEMS[stemIdx].build(tCand)
        : ENGLISH_STRUCTURED_STEMS[stemIdx].build(tCand, gradeLabel, subject);
      const mks = stems[stemIdx].marks;
      const norm = normalizePromptKey(built.prompt);
      if (!usedPrompts.has(norm)) {
        usedPrompts.add(norm);
        masterOut.push({
          qNumber: i + 1,
          strand: tCand.strand,
          substrand: tCand.subtopicTitle,
          prompt: built.prompt,
          marks: mks,
          answerText: built.ans,
          explanation: built.exp,
        });
        placedStructured = true;
        break;
      }
    }

    if (!placedStructured) {
      // Ultimate guaranteed-unique fallback scoped to exact strand + sub-topic + scenario index
      const uniquePrompt = isKis
        ? `Kwa kurejelea mada ya "${topic.strand}" (${topic.subtopicTitle}), jadili hoja tatu tofauti zinazoonyesha umilisi wa kipengele cha ${i + 1} katika muktadha wa shule na jamii.`
        : `With direct reference to "${topic.strand}" (${topic.subtopicTitle}), explain three distinct points demonstrating practical mastery in Case Scenario #${i + 1}.`;
      usedPrompts.add(normalizePromptKey(uniquePrompt));
      masterOut.push({
        qNumber: i + 1,
        strand: topic.strand,
        substrand: topic.subtopicTitle,
        prompt: uniquePrompt,
        marks: 3,
        answerText: isKis
          ? `Hoja 3 sahihi na zenye mifano kuhusu "${topic.subtopicTitle}" (Alama 3).`
          : `Three distinct, well-explained points on "${topic.subtopicTitle}" (3 marks).`,
        explanation: isKis
          ? `Tuzo ya alama 1 kwa kila hoja sahihi.`
          : `Award 1 mark per distinct, accurate point.`,
      });
    }
  }

  return masterOut.slice(startOffset, startOffset + targetCount).map((entry, idx) => ({
    ...entry,
    qNumber: idx + 1,
  }));
}

// ============================================================================
// PDF DRAWING HELPERS (GUARANTEES EXACT 50-PAGE LAYOUTS)
// ============================================================================

function drawPageFrame(params: {
  page: PDFPage;
  boldFont: PDFFont;
  regFont: PDFFont;
  bookTitle: string;
  gradeSubjectLabel: string;
  pageNumber: number;
  totalPages: number;
  accentRgb: [number, number, number];
}) {
  const {
    page,
    boldFont,
    regFont,
    bookTitle,
    gradeSubjectLabel,
    pageNumber,
    totalPages,
    accentRgb,
  } = params;
  const { width, height } = page.getSize();
  const [r, g, b] = accentRgb;

  // Outer clean border
  page.drawRectangle({
    x: 28,
    y: 28,
    width: width - 56,
    height: height - 56,
    borderColor: rgb(r, g, b),
    borderWidth: 1.2,
  });

  // Top running header bar
  page.drawRectangle({
    x: 28,
    y: height - 54,
    width: width - 56,
    height: 26,
    color: rgb(r, g, b),
  });

  page.drawText(toPdfSafe(`${bookTitle}  |  ${gradeSubjectLabel}`), {
    x: 38,
    y: height - 45,
    size: 9.2,
    font: boldFont,
    color: rgb(1, 1, 1),
  });

  const pgTag = `Page ${pageNumber} of ${totalPages}`;
  page.drawText(pgTag, {
    x: width - 38 - boldFont.widthOfTextAtSize(pgTag, 9),
    y: height - 45,
    size: 9,
    font: boldFont,
    color: rgb(1, 0.94, 0.65),
  });

  // Footer
  page.drawLine({
    start: { x: 36, y: 46 },
    end: { x: width - 36, y: 46 },
    thickness: 0.6,
    color: rgb(0.8, 0.84, 0.88),
  });
  page.drawText(
    toPdfSafe(
      `www.cbcmaterials.shop  *  Official 2026 ${bookTitle} Series  *  WhatsApp: 0705 759 072`
    ),
    {
      x: 38,
      y: 34,
      size: 8,
      font: regFont,
      color: rgb(0.38, 0.43, 0.5),
    }
  );
}

/**
 * BOOK 1: "CBC GRADE UP" — EXACT 50 PAGES PER SUBJECT (KSh 500)
 * - Page 1: Cover Page + Complete Strand/Sub-strand Table of Contents
 * - Pages 2..35 (34 Pages): 170 Relevant Questions (5 per page) covering ALL Strands & Sub-strands
 * - Pages 36..50 (15 Pages): Complete Marking Schemes & Worked Solutions at the end of the book
 */
export async function generateCbcGradeUpPdfBuffer(params: {
  gradeKey: string;
  subject: string;
  pageOffset?: number;
  grandTotalPages?: number;
}): Promise<Uint8Array> {
  const { gradeKey, subject, pageOffset = 0, grandTotalPages = 50 } = params;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const gradeSubject = `${gradeLabel} ${subject}`;
  const { strands, coursebookTitle, approvedBooks } = collectOrderedSubTopics(
    gradeKey,
    subject
  );
  const approvedSeriesLine =
    approvedBooks.length > 0
      ? approvedBooks
          .slice(0, 4)
          .map((b) => `${b.series} (${b.publisher})`)
          .join('; ')
      : coursebookTitle;
  // Offset 120 ensures CBC GRADE UP (170 Qs) has ZERO overlap with MADE FAMILIAR (first 120 Qs)!
  const questions = buildFullBookQuestionPool(gradeKey, subject, 170, 120); // 34 pages * 5 Qs/page = 170 Qs

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const accent: [number, number, number] = [0.03, 0.36, 0.27]; // Deep Emerald

  // ---------------- PAGE 1: COVER PAGE & TABLE OF STRANDS ----------------
  const cover = pdfDoc.addPage([595.28, 841.89]);
  drawPageFrame({
    page: cover,
    boldFont,
    regFont,
    bookTitle: 'CBC GRADE UP',
    gradeSubjectLabel: gradeSubject,
    pageNumber: 1 + pageOffset,
    totalPages: grandTotalPages,
    accentRgb: accent,
  });

  cover.drawRectangle({
    x: 44,
    y: 635,
    width: 507,
    height: 132,
    color: rgb(0.03, 0.36, 0.27),
  });
  cover.drawText('OFFICIAL 2026 EDITION  *  50-PAGE EXAM & REVISION BOOK', {
    x: 62,
    y: 742,
    size: 10.5,
    font: boldFont,
    color: rgb(0.98, 0.82, 0.25),
  });
  cover.drawText('CBC GRADE UP', {
    x: 62,
    y: 700,
    size: 34,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  cover.drawText(toPdfSafe(`${gradeLabel.toUpperCase()} - ${subject.toUpperCase()}`), {
    x: 62,
    y: 670,
    size: 16,
    font: boldFont,
    color: rgb(0.75, 0.97, 0.86),
  });
  cover.drawText(
    'Complete Strand & Sub-Strand Questions (Pages 2-35) + Marking Schemes (Pages 36-50)',
    {
      x: 62,
      y: 648,
      size: 9.8,
      font: regFont,
      color: rgb(0.92, 0.96, 0.99),
    }
  );

  let cy = 610;
  cover.drawText('BOOK STRUCTURE & SYLLABUS STRANDS COVERED (FIRST TO LAST STRAND):', {
    x: 46,
    y: cy,
    size: 10.5,
    font: boldFont,
    color: rgb(0.06, 0.12, 0.22),
  });
  cy -= 18;

  for (let sIdx = 0; sIdx < strands.length && cy > 185; sIdx++) {
    const st = strands[sIdx];
    cover.drawText(toPdfSafe(`${sIdx + 1}. ${st.strand}`), {
      x: 50,
      y: cy,
      size: 9.5,
      font: boldFont,
      color: rgb(0.03, 0.36, 0.27),
    });
    cy -= 13;
    const subPreview = st.subs.join('  |  ');
    const wrappedSubs = wrapPdfText(subPreview, 86).slice(0, 3);
    for (const ln of wrappedSubs) {
      if (cy < 180) break;
      cover.drawText(`   - ${ln}`, {
        x: 54,
        y: cy,
        size: 8.4,
        font: regFont,
        color: rgb(0.22, 0.28, 0.36),
      });
      cy -= 11.5;
    }
    cy -= 5;
  }

  // Bottom Cover Box
  cover.drawRectangle({
    x: 44,
    y: 64,
    width: 507,
    height: 98,
    color: rgb(0.95, 0.98, 0.96),
    borderColor: rgb(0.03, 0.36, 0.27),
    borderWidth: 1,
  });
  cover.drawText('HOW TO USE THIS 50-PAGE "CBC GRADE UP" BOOK:', {
    x: 58,
    y: 144,
    size: 9.8,
    font: boldFont,
    color: rgb(0.03, 0.36, 0.27),
  });
  cover.drawText(
    toPdfSafe(`1. Approved Coursebooks Covered: ${approvedSeriesLine}`).slice(0, 92),
    { x: 58, y: 128, size: 8.4, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '2. Attempt all 170 Strand & Sub-strand questions in Section A (Pages 2 to 35) independently.',
    { x: 58, y: 114, size: 8.6, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '3. Check your work using the Complete Marking Schemes at the end of this book (Pages 36 to 50).',
    { x: 58, y: 100, size: 8.6, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '4. Grading Rubric: Exceeding (80-100%) | Meeting (50-79%) | Approaching (30-49%) | Below (0-29%).',
    { x: 58, y: 86, size: 8.6, font: boldFont, color: rgb(0.1, 0.24, 0.4) }
  );

  // ---------------- PAGES 2..35 (34 PAGES): QUESTIONS ----------------
  const QUESTION_PAGES = 34; // Pages 2..35 inclusive
  const PER_Q_PAGE = 5; // 34 * 5 = 170 questions

  for (let pIdx = 0; pIdx < QUESTION_PAGES; pIdx++) {
    const pageNum = 2 + pIdx;
    const page = pdfDoc.addPage([595.28, 841.89]);
    drawPageFrame({
      page,
      boldFont,
      regFont,
      bookTitle: 'CBC GRADE UP',
      gradeSubjectLabel: `${gradeSubject} (Section A: Questions)`,
      pageNumber: pageNum + pageOffset,
      totalPages: grandTotalPages,
      accentRgb: accent,
    });

    const slice = questions.slice(pIdx * PER_Q_PAGE, (pIdx + 1) * PER_Q_PAGE);
    const firstQ = slice[0];

    // Strand banner on top of question page
    page.drawRectangle({
      x: 42,
      y: 748,
      width: 511,
      height: 28,
      color: rgb(0.93, 0.97, 0.95),
      borderColor: rgb(0.65, 0.85, 0.76),
      borderWidth: 0.8,
    });
    page.drawText(
      toPdfSafe(`ACTIVE STRAND FOCUS: ${firstQ.strand}`).slice(0, 82),
      {
        x: 50,
        y: 758,
        size: 9.2,
        font: boldFont,
        color: rgb(0.03, 0.36, 0.27),
      }
    );

    let y = 730;
    for (const q of slice) {
      if (y < 95) break;

      // Sub-strand tag
      page.drawText(
        toPdfSafe(`[Topic: ${q.substrand}] (${q.marks} Marks)`).slice(0, 92),
        {
          x: 44,
          y,
          size: 8.3,
          font: boldFont,
          color: rgb(0.2, 0.35, 0.62),
        }
      );
      y -= 13;

      const qLines = wrapPdfText(`Q${q.qNumber}. ${q.prompt}`, 85).slice(0, 4);
      for (const ln of qLines) {
        page.drawText(ln, {
          x: 44,
          y,
          size: 9.4,
          font: boldFont,
          color: rgb(0.08, 0.11, 0.16),
        });
        y -= 12.2;
      }

      if (q.options) {
        const letters = ['A', 'B', 'C', 'D'];
        for (let oi = 0; oi < 4; oi++) {
          const optLine = toPdfSafe(`   ${letters[oi]}. ${q.options[oi]}`).slice(0, 88);
          page.drawText(optLine, {
            x: 50,
            y,
            size: 8.8,
            font: regFont,
            color: rgb(0.18, 0.22, 0.28),
          });
          y -= 11.2;
        }
        y -= 8;
      } else {
        // Ruled working / answer lines for structured questions
        for (let lnIdx = 0; lnIdx < 3; lnIdx++) {
          y -= 11;
          page.drawLine({
            start: { x: 52, y },
            end: { x: 545, y },
            thickness: 0.45,
            color: rgb(0.76, 0.8, 0.85),
          });
        }
        y -= 14;
      }
    }
  }

  // ---------------- PAGES 36..50 (15 PAGES): MARKING SCHEMES ----------------
  const MARKING_PAGES = 15; // Pages 36..50 -> 1 + 34 + 15 = EXACT 50 PAGES!
  for (let mIdx = 0; mIdx < MARKING_PAGES; mIdx++) {
    const pageNum = 36 + mIdx;
    const page = pdfDoc.addPage([595.28, 841.89]);
    drawPageFrame({
      page,
      boldFont,
      regFont,
      bookTitle: 'CBC GRADE UP',
      gradeSubjectLabel: `${gradeSubject} (Section B: Marking Scheme)`,
      pageNumber: pageNum + pageOffset,
      totalPages: grandTotalPages,
      accentRgb: [0.09, 0.22, 0.48],
    });

    const startIdx = Math.floor((mIdx * questions.length) / MARKING_PAGES);
    const endIdx = Math.floor(((mIdx + 1) * questions.length) / MARKING_PAGES);
    const mSlice = questions.slice(startIdx, endIdx);

    page.drawRectangle({
      x: 42,
      y: 748,
      width: 511,
      height: 28,
      color: rgb(0.93, 0.95, 0.99),
      borderColor: rgb(0.65, 0.74, 0.92),
      borderWidth: 0.8,
    });
    page.drawText(
      `OFFICIAL MARKING SCHEME & WORKED SOLUTIONS (QUESTIONS ${
        (mSlice[0]?.qNumber ?? 1)
      } - ${mSlice[mSlice.length - 1]?.qNumber ?? questions.length})`,
      {
        x: 50,
        y: 758,
        size: 9.2,
        font: boldFont,
        color: rgb(0.09, 0.22, 0.48),
      }
    );

    let y = 732;
    for (const q of mSlice) {
      if (y < 64) break;
      const ansHeader = toPdfSafe(
        `Q${q.qNumber} (${q.marks} mks) - Answer: ${q.answerText}`
      ).slice(0, 92);
      page.drawText(ansHeader, {
        x: 44,
        y,
        size: 8.8,
        font: boldFont,
        color: rgb(0.04, 0.34, 0.22),
      });
      y -= 11.2;

      const expLines = wrapPdfText(`   Guide: ${q.explanation}`, 90).slice(0, 2);
      for (const eln of expLines) {
        if (y < 56) break;
        page.drawText(eln, {
          x: 48,
          y,
          size: 8.1,
          font: regFont,
          color: rgb(0.22, 0.26, 0.33),
        });
        y -= 10.2;
      }
      y -= 6;
    }
  }

  return pdfDoc.save();
}

/**
 * BOOK 2: "COMPETENCY BASED MADE FAMILIAR" — EXACT 50 PAGES PER SUBJECT (KSh 750)
 * - Page 1: Official Cover & Strand/Sub-strand Study Roadmap
 * - Pages 2..41 (40 Pages): Point-Form Short Notes covering EVERY Strand & Sub-strand,
 *   followed IMMEDIATELY after every sub-topic by relevant practice questions!
 * - Pages 42..50 (9 Pages): Answers & Marking Guide to all Sub-topic Practice Questions!
 */
export async function generateMadeFamiliarPdfBuffer(params: {
  gradeKey: string;
  subject: string;
  pageOffset?: number;
  grandTotalPages?: number;
  headerOverrideTitle?: string;
}): Promise<Uint8Array> {
  const {
    gradeKey,
    subject,
    pageOffset = 0,
    grandTotalPages = 50,
    headerOverrideTitle,
  } = params;
  const runningBookTitle = headerOverrideTitle || 'SUPER-LIGHT CBC COMPILATION';
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const gradeSubject = `${gradeLabel} ${subject}`;
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const gradeArg = gradeKey.toUpperCase().startsWith('PP')
    ? gradeKey.toUpperCase()
    : Number(gradeKey) || 7;
  const cb = getApprovedCoursebook(gradeArg, sylSubject);
  const { strands, subTopics, approvedBooks } = collectOrderedSubTopics(
    gradeKey,
    subject
  );
  const approvedSummary =
    approvedBooks.length > 0
      ? approvedBooks
          .slice(0, 4)
          .map((b) => `${b.series} (${b.publisher})`)
          .join('; ')
      : cb.lbTitle;
  const questionPool = buildFullBookQuestionPool(gradeKey, subject, 120); // 40 note pages * 3 Qs = 120 Qs

  const pdfDoc = await PDFDocument.create();
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const regFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const accent: [number, number, number] = [0.1, 0.24, 0.54]; // Royal Indigo/Blue

  // ---------------- PAGE 1: COVER PAGE ----------------
  const cover = pdfDoc.addPage([595.28, 841.89]);
  drawPageFrame({
    page: cover,
    boldFont,
    regFont,
    bookTitle: runningBookTitle,
    gradeSubjectLabel: gradeSubject,
    pageNumber: 1 + pageOffset,
    totalPages: grandTotalPages,
    accentRgb: accent,
  });

  cover.drawRectangle({
    x: 44,
    y: 635,
    width: 507,
    height: 132,
    color: rgb(0.1, 0.24, 0.54),
  });
  cover.drawText('OFFICIAL 2026 EDITION  *  50-PAGE POINT-FORM NOTES & TOPICAL Q&A', {
    x: 58,
    y: 742,
    size: 10,
    font: boldFont,
    color: rgb(0.98, 0.82, 0.25),
  });
  cover.drawText(headerOverrideTitle ? 'SMART CBC ALL SUBJECTS' : 'SUPER-LIGHT CBC', {
    x: 58,
    y: 710,
    size: 27,
    font: boldFont,
    color: rgb(1, 1, 1),
  });
  cover.drawText(headerOverrideTitle ? 'MASTER COMPILATION (PART 1)' : 'COMPILATION', {
    x: 58,
    y: 680,
    size: 25,
    font: boldFont,
    color: rgb(0.65, 0.95, 0.82),
  });
  cover.drawText(
    toPdfSafe(
      `${gradeLabel.toUpperCase()} ${subject.toUpperCase()}  *  Point-Form Notes + Topical Questions`
    ),
    {
      x: 58,
      y: 650,
      size: 10.5,
      font: boldFont,
      color: rgb(0.93, 0.96, 1),
    }
  );

  let cy = 610;
  cover.drawText(
    'STRANDS & SUB-STRANDS COVERED IN POINT FORM (WITH TOPICAL QUESTIONS):',
    {
      x: 46,
      y: cy,
      size: 10,
      font: boldFont,
      color: rgb(0.08, 0.14, 0.26),
    }
  );
  cy -= 18;

  for (let sIdx = 0; sIdx < strands.length && cy > 180; sIdx++) {
    const st = strands[sIdx];
    cover.drawText(toPdfSafe(`${sIdx + 1}. ${st.strand}`), {
      x: 50,
      y: cy,
      size: 9.5,
      font: boldFont,
      color: rgb(0.1, 0.24, 0.54),
    });
    cy -= 13;
    for (const ln of wrapPdfText(st.subs.join('  |  '), 86).slice(0, 3)) {
      if (cy < 175) break;
      cover.drawText(`   * ${ln}`, {
        x: 54,
        y: cy,
        size: 8.4,
        font: regFont,
        color: rgb(0.22, 0.28, 0.36),
      });
      cy -= 11.5;
    }
    cy -= 5;
  }

  cover.drawRectangle({
    x: 44,
    y: 64,
    width: 507,
    height: 94,
    color: rgb(0.95, 0.97, 1),
    borderColor: rgb(0.1, 0.24, 0.54),
    borderWidth: 1,
  });
  cover.drawText('INSIDE THIS 50-PAGE "SUPER-LIGHT CBC COMPILATION" BOOK:', {
    x: 58,
    y: 140,
    size: 9.6,
    font: boldFont,
    color: rgb(0.1, 0.24, 0.54),
  });
  cover.drawText(
    '  * Pages 2 - 41: Concise Point-Form Revision Notes on EVERY Strand & Sub-topic,',
    { x: 58, y: 123, size: 8.6, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '    followed immediately after every sub-topic by relevant Topical Practice Questions.',
    { x: 58, y: 110, size: 8.6, font: regFont, color: rgb(0.15, 0.2, 0.28) }
  );
  cover.drawText(
    '  * Pages 42 - 50: Complete Answers & Marking Guide to all Sub-Topic Practice Questions.',
    { x: 58, y: 95, size: 8.6, font: boldFont, color: rgb(0.04, 0.35, 0.25) }
  );
  cover.drawText(
    toPdfSafe(`  * Approved Coursebooks Synthesized: ${approvedSummary}`).slice(0, 92),
    {
      x: 58,
      y: 80,
      size: 8.2,
      font: regFont,
      color: rgb(0.3, 0.35, 0.44),
    }
  );

  // ---------------- PAGES 2..41 (40 PAGES): POINT-FORM NOTES + SUB-TOPIC QUESTIONS ----------------
  const NOTE_PAGES = 40;
  for (let nIdx = 0; nIdx < NOTE_PAGES; nIdx++) {
    const pageNum = 2 + nIdx;
    const page = pdfDoc.addPage([595.28, 841.89]);
    drawPageFrame({
      page,
      boldFont,
      regFont,
      bookTitle: runningBookTitle,
      gradeSubjectLabel: `${gradeSubject} (Notes & Sub-Topic Qs)`,
      pageNumber: pageNum + pageOffset,
      totalPages: grandTotalPages,
      accentRgb: accent,
    });

    const unit = subTopics[nIdx % Math.max(1, subTopics.length)];
    const passIdx = Math.floor(nIdx / Math.max(1, subTopics.length));
    const passLensLabels = [
      'Core Concepts, Definitions & Rules',
      'Practical Investigation, Apparatus & Procedure',
      'Worked Illustrations & Real-Life Application',
      'Case Synthesis & Common Assessment Watchpoints',
    ];
    const passTag = passLensLabels[passIdx % passLensLabels.length];
    const subHeaderTitle =
      passIdx === 0
        ? unit.subtopicTitle
        : `${unit.subtopicTitle} — ${passTag}`;
    const domainNotes = buildDomainLessonNotes({
      grade: gradeArg,
      subject: sylSubject,
      strand: unit.strand,
      baseSubstrand: unit.substrand,
      aspect: unit.subtopicTitle,
      phaseTag: passTag,
      kiq: unit.kiq,
      resources: unit.resources,
      lbCitation: cb.lbShort,
      tgCitation: cb.tgShort,
      isKiswahili: cb.isKiswahili,
    });

    const q1 = questionPool[nIdx * 3];
    const q2 = questionPool[nIdx * 3 + 1];
    const q3 = questionPool[nIdx * 3 + 2];

    // Sub-topic header box
    page.drawRectangle({
      x: 42,
      y: 736,
      width: 511,
      height: 40,
      color: rgb(0.93, 0.96, 1),
      borderColor: rgb(0.6, 0.72, 0.92),
      borderWidth: 0.9,
    });
    page.drawText(
      toPdfSafe(`STRAND: ${unit.strand}  (Term ${unit.term} * ${passTag})`).slice(0, 84),
      {
        x: 50,
        y: 762,
        size: 8.6,
        font: boldFont,
        color: rgb(0.1, 0.24, 0.54),
      }
    );
    page.drawText(
      toPdfSafe(`SUB-TOPIC ${nIdx + 1}: ${subHeaderTitle}`).slice(0, 84),
      {
        x: 50,
        y: 746,
        size: 9.4,
        font: boldFont,
        color: rgb(0.05, 0.1, 0.2),
      }
    );

    let y = 718;
    page.drawText('PART A: SHORT REVISION NOTES (IN POINT FORM)', {
      x: 44,
      y,
      size: 9.5,
      font: boldFont,
      color: rgb(0.03, 0.38, 0.26),
    });
    y -= 14;

    // Distinct point-form bullets per progressive pass so notes never repeat across pages!
    const bulletPoints =
      passIdx === 0
        ? [
            ...domainNotes.coreConceptNotes.map((b) => b.replace(/^\s*-\s*/, '')),
            `Key Inquiry Focus: ${
              unit.kiq || `Mastering "${unit.subtopicTitle}" in real-world problem solving.`
            }`,
            `Key Fact 1: ${q1.explanation}`,
            `Key Fact 2: ${q2.explanation}`,
          ]
        : passIdx === 1
        ? [
            `Practical Setup & Learning Aids: ${unit.resources}.`,
            domainNotes.workedIllustration,
            domainNotes.learnerPracticeTask,
            `Practical Takeaway 1: ${q1.explanation}`,
            `Practical Takeaway 2: ${q3.explanation}`,
          ]
        : [
            `Applied Summary: ${domainNotes.summaryLine}`,
            `Self-Check Criterion: ${domainNotes.checkQuestion}`,
            `Worked Application Insight: ${q1.explanation}`,
            `Accuracy & Marking Tip: ${q2.explanation}`,
            `Extended Mastery Note: ${q3.explanation}`,
          ];

    for (const bp of bulletPoints) {
      if (y < 385) break;
      const lines = wrapPdfText(`* ${bp}`, 86).slice(0, 3);
      for (const ln of lines) {
        page.drawText(ln, {
          x: 48,
          y,
          size: 8.7,
          font: regFont,
          color: rgb(0.14, 0.18, 0.24),
        });
        y -= 11.4;
      }
      y -= 4;
    }

    // Divider before Topical Questions immediately following this Sub-topic!
    y -= 4;
    page.drawRectangle({
      x: 42,
      y: y - 16,
      width: 511,
      height: 22,
      color: rgb(0.98, 0.95, 0.86),
      borderColor: rgb(0.92, 0.78, 0.38),
      borderWidth: 0.8,
    });
    page.drawText(
      toPdfSafe(
        `PART B: TOPICAL PRACTICE QUESTIONS ON "${unit.subtopicTitle.toUpperCase()}"`
      ).slice(0, 80),
      {
        x: 50,
        y: y - 9,
        size: 8.8,
        font: boldFont,
        color: rgb(0.48, 0.28, 0.02),
      }
    );
    y -= 30;

    for (const tq of [q1, q2, q3]) {
      if (!tq || y < 74) break;
      const qLines = wrapPdfText(
        `Q${tq.qNumber}. ${tq.prompt} (${tq.marks} mks)`,
        85
      ).slice(0, 3);
      for (const ln of qLines) {
        page.drawText(ln, {
          x: 46,
          y,
          size: 8.9,
          font: boldFont,
          color: rgb(0.08, 0.11, 0.16),
        });
        y -= 11.2;
      }

      if (tq.options) {
        const optStr = toPdfSafe(
          `   A) ${tq.options[0]}    B) ${tq.options[1]}    C) ${tq.options[2]}    D) ${tq.options[3]}`
        );
        for (const oln of wrapPdfText(optStr, 88).slice(0, 2)) {
          page.drawText(oln, {
            x: 50,
            y,
            size: 8.3,
            font: regFont,
            color: rgb(0.2, 0.25, 0.32),
          });
          y -= 10.5;
        }
        y -= 5;
      } else {
        y -= 10;
        page.drawLine({
          start: { x: 52, y },
          end: { x: 545, y },
          thickness: 0.45,
          color: rgb(0.76, 0.8, 0.85),
        });
        y -= 12;
      }
    }
  }

  // ---------------- PAGES 42..50 (9 PAGES): ANSWERS TO SUB-TOPIC QUESTIONS ----------------
  const ANS_PAGES = 9; // 1 + 40 + 9 = EXACT 50 PAGES!
  for (let aIdx = 0; aIdx < ANS_PAGES; aIdx++) {
    const pageNum = 42 + aIdx;
    const page = pdfDoc.addPage([595.28, 841.89]);
    drawPageFrame({
      page,
      boldFont,
      regFont,
      bookTitle: runningBookTitle,
      gradeSubjectLabel: `${gradeSubject} (Sub-Topic Answers)`,
      pageNumber: pageNum + pageOffset,
      totalPages: grandTotalPages,
      accentRgb: [0.03, 0.36, 0.27],
    });

    const startIdx = Math.floor((aIdx * questionPool.length) / ANS_PAGES);
    const endIdx = Math.floor(((aIdx + 1) * questionPool.length) / ANS_PAGES);
    const aSlice = questionPool.slice(startIdx, endIdx);

    page.drawRectangle({
      x: 42,
      y: 748,
      width: 511,
      height: 28,
      color: rgb(0.93, 0.97, 0.95),
      borderColor: rgb(0.65, 0.85, 0.76),
      borderWidth: 0.8,
    });
    page.drawText(
      `ANSWERS TO SUB-TOPIC PRACTICE QUESTIONS (Q${
        aSlice[0]?.qNumber ?? 1
      } - Q${aSlice[aSlice.length - 1]?.qNumber ?? questionPool.length})`,
      {
        x: 50,
        y: 758,
        size: 9.2,
        font: boldFont,
        color: rgb(0.03, 0.36, 0.27),
      }
    );

    let y = 730;
    for (const q of aSlice) {
      if (y < 62) break;
      page.drawText(
        toPdfSafe(`Q${q.qNumber}: ${q.answerText}`).slice(0, 92),
        {
          x: 44,
          y,
          size: 8.7,
          font: boldFont,
          color: rgb(0.05, 0.28, 0.45),
        }
      );
      y -= 11;
      for (const eln of wrapPdfText(`   Explanation: ${q.explanation}`, 90).slice(
        0,
        2
      )) {
        if (y < 54) break;
        page.drawText(eln, {
          x: 48,
          y,
          size: 8,
          font: regFont,
          color: rgb(0.24, 0.28, 0.35),
        });
        y -= 10;
      }
      y -= 5;
    }
  }

  return pdfDoc.save();
}

/**
 * BUTTON 3: MASTER COMPILATION (100 PAGES TOTAL = MADE FAMILIAR 50 PAGES + CBC GRADE UP 50 PAGES)
 */
export async function generateCompleteCompilationPdfBuffer(params: {
  gradeKey: string;
  subject: string;
}): Promise<Uint8Array> {
  const { gradeKey, subject } = params;
  const [part1Bytes, part2Bytes] = await Promise.all([
    generateMadeFamiliarPdfBuffer({
      gradeKey,
      subject,
      pageOffset: 0,
      grandTotalPages: 100,
      headerOverrideTitle: 'SMART CBC ALL SUBJECTS',
    }),
    generateCbcGradeUpPdfBuffer({
      gradeKey,
      subject,
      pageOffset: 50,
      grandTotalPages: 100,
    }),
  ]);

  const mergedPdf = await PDFDocument.create();
  const doc1 = await PDFDocument.load(part1Bytes);
  const doc2 = await PDFDocument.load(part2Bytes);

  const pages1 = await mergedPdf.copyPages(doc1, doc1.getPageIndices());
  for (const p of pages1) mergedPdf.addPage(p);

  const pages2 = await mergedPdf.copyPages(doc2, doc2.getPageIndices());
  for (const p of pages2) mergedPdf.addPage(p);

  return mergedPdf.save();
}

/**
 * Generates Editable Microsoft Word (.DOCX) Edition of CBC GRADE UP, MADE FAMILIAR, or COMPLETE COMPILATION
 */
export async function generateCbcBookDocxBuffer(params: {
  bookType: CbcBookType;
  gradeKey: string;
  subject: string;
}): Promise<Buffer> {
  const { bookType, gradeKey, subject } = params;
  const gradeLabel = formatBookGradeLabel(gradeKey);
  const titleName = BOOK_SERIES_TITLES[bookType];
  const { strands, subTopics, coursebookTitle, approvedBooks } = collectOrderedSubTopics(
    gradeKey,
    subject
  );
  const madeFamiliarQuestions =
    bookType === 'MADE_FAMILIAR' || bookType === 'COMPLETE_BUNDLE'
      ? buildFullBookQuestionPool(gradeKey, subject, 120, 0)
      : [];
  const gradeUpQuestions =
    bookType === 'GRADE_UP' || bookType === 'COMPLETE_BUNDLE'
      ? buildFullBookQuestionPool(gradeKey, subject, 170, 120)
      : [];
  const questions =
    bookType === 'MADE_FAMILIAR'
      ? madeFamiliarQuestions
      : bookType === 'GRADE_UP'
      ? gradeUpQuestions
      : [
          ...madeFamiliarQuestions,
          ...gradeUpQuestions.map((q, idx) => ({
            ...q,
            qNumber: 121 + idx,
          })),
        ];

  const children: Paragraph[] = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      heading: HeadingLevel.TITLE,
      children: [new TextRun({ text: titleName, bold: true, size: 40 })],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `${gradeLabel} — ${subject} (Official 2026 Edition • www.cbcmaterials.shop)`,
          bold: true,
          size: 24,
        }),
      ],
    }),
    new Paragraph({
      heading: HeadingLevel.HEADING_2,
      children: [
        new TextRun({
          text: 'OFFICIAL APPROVED CBC COURSE MATERIALS SYNTHESIZED IN THIS BOOK',
          bold: true,
        }),
      ],
    }),
    ...(approvedBooks.length > 0
      ? approvedBooks.map(
          (ab, idx) =>
            new Paragraph({
              spacing: { before: 40, after: 40 },
              children: [
                new TextRun({
                  text: `${idx + 1}. ${ab.series} (${ab.publisher}) — `,
                  bold: true,
                }),
                new TextRun({
                  text: `Authors: ${ab.authors}${ab.note ? ` | ${ab.note}` : ''}`,
                }),
              ],
            })
        )
      : [
          new Paragraph({
            children: [new TextRun({ text: coursebookTitle, bold: true })],
          }),
        ]),
  ];

  children.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [new TextRun({ text: 'STRANDS & SUB-STRANDS COVERED', bold: true })],
    })
  );
  for (const st of strands) {
    children.push(
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({ text: `${st.strand}: `, bold: true }),
          new TextRun({ text: st.subs.join('; ') }),
        ],
      })
    );
  }

  if (bookType === 'MADE_FAMILIAR' || bookType === 'COMPLETE_BUNDLE') {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'SUPER-LIGHT CBC COMPILATION — POINT-FORM NOTES & SUB-TOPIC QUESTIONS',
            bold: true,
          }),
        ],
      })
    );

    for (let i = 0; i < 40; i++) {
      const u = subTopics[i % Math.max(1, subTopics.length)];
      const qA = madeFamiliarQuestions[i * 3];
      const qB = madeFamiliarQuestions[i * 3 + 1];
      const qC = madeFamiliarQuestions[i * 3 + 2];
      children.push(
        new Paragraph({
          spacing: { before: 180, after: 60 },
          children: [
            new TextRun({
              text: `${u.strand} — Sub-topic ${i + 1}: ${u.subtopicTitle}`,
              bold: true,
              size: 22,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `• Core Focus: Mastery of "${u.subtopicTitle}" under ${u.substrand}.`,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `• Practical Resources & Tools: ${u.resources}.`,
            }),
          ],
        }),
        new Paragraph({
          children: [new TextRun({ text: `• Key Takeaway: ${qA.explanation}` })],
        }),
        new Paragraph({
          spacing: { before: 80 },
          children: [
            new TextRun({
              text: `Q${qA.qNumber}. ${qA.prompt}`,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Q${qB.qNumber}. ${qB.prompt}`,
              bold: true,
            }),
          ],
        }),
        new Paragraph({
          children: [
            new TextRun({
              text: `Q${qC.qNumber}. ${qC.prompt}`,
              bold: true,
            }),
          ],
        })
      );
    }
  }

  if (bookType === 'GRADE_UP' || bookType === 'COMPLETE_BUNDLE') {
    children.push(
      new Paragraph({ children: [new PageBreak()] }),
      new Paragraph({
        heading: HeadingLevel.HEADING_1,
        children: [
          new TextRun({
            text: 'CBC GRADE UP — TOPICAL & END-OF-STRAND QUESTIONS',
            bold: true,
          }),
        ],
      })
    );

    const gUpToRender =
      bookType === 'COMPLETE_BUNDLE'
        ? gradeUpQuestions.map((q, idx) => ({ ...q, qNumber: 121 + idx }))
        : gradeUpQuestions;

    for (const q of gUpToRender) {
      children.push(
        new Paragraph({
          spacing: { before: 100 },
          children: [
            new TextRun({
              text: `Q${q.qNumber}. [${q.substrand}] ${q.prompt} (${q.marks} mks)`,
              bold: true,
            }),
          ],
        })
      );
      if (q.options) {
        children.push(
          new Paragraph({
            children: [
              new TextRun({
                text: `   A) ${q.options[0]}   B) ${q.options[1]}   C) ${q.options[2]}   D) ${q.options[3]}`,
              }),
            ],
          })
        );
      }
    }
  }

  // Marking Schemes at the end of every book!
  children.push(
    new Paragraph({ children: [new PageBreak()] }),
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      children: [
        new TextRun({
          text: 'OFFICIAL MARKING SCHEMES & WORKED SOLUTIONS',
          bold: true,
        }),
      ],
    })
  );

  for (const q of questions) {
    children.push(
      new Paragraph({
        spacing: { before: 60 },
        children: [
          new TextRun({
            text: `Q${q.qNumber} (${q.marks} mks): ${q.answerText} — `,
            bold: true,
          }),
          new TextRun({ text: q.explanation }),
        ],
      })
    );
  }

  const doc = new Document({
    sections: [{ children }],
  });
  return Packer.toBuffer(doc);
}
