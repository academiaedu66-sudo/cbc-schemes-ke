import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import { getSyllabusForGrade } from '../../scripts/cbc-syllabus-data.mjs';
import {
  DOMAIN_EXERCISE_BANKS,
  generateDeepSubjectExercise,
  generateExtraTextbookExercise,
  generateWorkedDomainExercise,
  generateWorkedMathematicsExercise,
  packChoices,
  type ExerciseItem,
  type StrandContext,
} from '@/lib/gaming-exercises';

interface SyllabusBlock {
  strand: string;
  subs: string[];
  kiq: string;
  resources: string;
}

const BUCKET_NAME = 'cbc-materials';
const GAMING_STORAGE_PATH = '_system/gaming-ledger.json';

export const GAMING_FEE_KES = 10; // KSh 10 ("10 bob") per 20-minute activation
export const GAMING_SESSION_MS = 20 * 60 * 1000; // Exact 20 minutes (1,200,000 ms)
export const POINTS_PER_QUESTION = 1; // 1 point per correct question
export const REDEEM_POINTS_REQUIRED = 1000; // 1,000 points
export const REDEEM_KES_VALUE = 5; // KSh 5 ("5 bob") per 1,000 points

export const ALL_GAMING_SUBJECTS = [
  'Mathematics',
  'Core Mathematics',
  'Essential Mathematics',
  'English',
  'Literature in English',
  'Kiswahili',
  'Fasihi ya Kiswahili',
  'Integrated Science',
  'Science & Technology',
  'General Science',
  'Biology',
  'Chemistry',
  'Physics',
  'Pre-Technical Studies',
  'Computer Studies',
  'Information Communication Technology (ICT)',
  'Agriculture & Nutrition',
  'Home Science',
  'Social Studies',
  'History & Citizenship',
  'Geography',
  'Community Service Learning (CSL)',
  'Business Studies',
  'Life Skills',
  'Creative Arts & Sports',
  'Music and Dance',
  'Theatre and Film',
  'Fine Arts',
  'Sports and Recreation',
  'Physical Education',
  'Christian Religious Education (CRE)',
  'Islamic Religious Education (IRE)',
  'French',
  'Arabic',
  'German',
  'Aviation',
  'Building Construction',
  'Electricity',
  'Metal Work',
  'Power Mechanics',
  'Woodwork',
  'Media Technology',
  'Marine and Fisheries Technology',
  'Language Activities',
  'Mathematical Activities',
  'Environmental Activities',
  'Indigenous Language Activities',
] as const;

export interface PublicGameQuestion {
  nonce: string;
  subject: string;
  gradeLabel: string;
  strand: string;
  substrand: string;
  strandProgress: string; // e.g. "Strand 1/4 • Sub-strand 2/14"
  prompt: string;
  options: [string, string, string, string];
  token: string; // HMAC-signed server verification token
}

export interface GamingPlayer {
  phone: string;
  playerName: string;
  gradeKey: string;
  pointsBalance: number;
  lifetimePoints: number;
  questionsAttempted: number;
  questionsCorrect: number;
  sessionsActivated: number;
  totalRedeemedKes: number;
  curriculumCursor?: Record<string, number>;
  seenQuestionKeys?: string[];
  updatedAt: string;
}

export interface GamingSession {
  sessionId: string;
  checkoutRequestId: string;
  phone: string;
  playerName: string;
  gradeKey: string;
  subject: string;
  startedAt: number; // epoch ms
  expiresAt: number; // epoch ms (startedAt + 1,200,000)
  sessionPoints: number;
  sessionAnswered: number;
  usedQuestionNonces: string[];
  usedQuestionKeys?: string[];
  subjectCursors?: Record<string, number>;
  currentQuestion?: PublicGameQuestion | null;
}

export interface GamingRedemption {
  id: string;
  referenceCode: string;
  phone: string;
  playerName: string;
  pointsDeducted: number;
  amountKes: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

export interface GamingLedger {
  players: Record<string, GamingPlayer>;
  sessions: Record<string, GamingSession>;
  redemptions: GamingRedemption[];
  updatedAt: string;
}

function getHmacSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    'cbc-gaming-secret-2026'
  );
}

export function signQuestionToken(params: {
  nonce: string;
  sessionId: string;
  correctIndex: number;
  explanation: string;
}): string {
  const payload = JSON.stringify({
    n: params.nonce,
    s: params.sessionId,
    c: params.correctIndex,
    e: params.explanation,
    iat: Date.now(),
  });
  const b64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(b64)
    .digest('base64url');
  return `${b64}.${sig}`;
}

export function verifyQuestionToken(
  token: string,
  expectedSessionId: string
): {
  nonce: string;
  correctIndex: number;
  explanation: string;
} | null {
  try {
    const [b64, sig] = String(token || '').split('.');
    if (!b64 || !sig) return null;
    const expectedSig = crypto
      .createHmac('sha256', getHmacSecret())
      .update(b64)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8')) as {
      n: string;
      s: string;
      c: number;
      e: string;
    };
    if (parsed.s !== expectedSessionId) return null;
    return {
      nonce: parsed.n,
      correctIndex: parsed.c,
      explanation: parsed.e,
    };
  } catch {
    return null;
  }
}

let cachedLedger: { data: GamingLedger; loadedAt: number } | null = null;

export async function getGamingLedger(): Promise<GamingLedger> {
  if (cachedLedger && Date.now() - cachedLedger.loadedAt < 8000) {
    return cachedLedger.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(GAMING_STORAGE_PATH);

    if (error || !data) {
      const empty: GamingLedger = {
        players: {},
        sessions: {},
        redemptions: [],
        updatedAt: new Date().toISOString(),
      };
      cachedLedger = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<GamingLedger>;
    const ledger: GamingLedger = {
      players: parsed.players || {},
      sessions: parsed.sessions || {},
      redemptions: Array.isArray(parsed.redemptions) ? parsed.redemptions : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedLedger = { data: ledger, loadedAt: Date.now() };
    return ledger;
  } catch {
    const empty: GamingLedger = {
      players: {},
      sessions: {},
      redemptions: [],
      updatedAt: new Date().toISOString(),
    };
    cachedLedger = { data: empty, loadedAt: Date.now() };
    return empty;
  }
}

export async function saveGamingLedger(ledger: GamingLedger): Promise<void> {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [sid, sess] of Object.entries(ledger.sessions)) {
    if (sess.expiresAt < cutoff) {
      delete ledger.sessions[sid];
    }
  }

  ledger.updatedAt = new Date().toISOString();
  cachedLedger = { data: ledger, loadedAt: Date.now() };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(GAMING_STORAGE_PATH, Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });
  void triggerAutomaticBackup('Subject Gaming ledger updated');
}

// ============================================================================
// SEQUENTIAL STRAND -> SUB-STRAND END-OF-STRAND EXERCISE ENGINE
// ============================================================================

interface OrderedSubStrandUnit {
  strandIndex: number; // 0-based (0 = First Strand .. S-1 = Last Strand)
  totalStrands: number;
  strand: string;
  subIndexInStrand: number;
  totalSubsInStrand: number;
  globalSubIndex: number; // 0-based across all strands (0 .. M-1)
  totalGlobalSubs: number;
  substrand: string;
}

function hashPromptKey(prompt: string): string {
  const norm = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 14);
}

function cleanScopeSuffix(text: string): string {
  return String(text || '')
    .replace(/\s*\([^)]*Scope\)/gi, '')
    .trim();
}

export function resolveSyllabusSubject(subject: string, gradeKey: string): string {
  const s = subject.toLowerCase().trim();
  const upperGrade = gradeKey.toUpperCase().trim();
  const isPP = upperGrade === 'PP1' || upperGrade === 'PP2';
  const gNum = isPP ? 0 : Number(upperGrade) || 7;

  if (s === 'essential mathematics') return 'Essential Mathematics';
  if (s === 'core mathematics') return 'Core Mathematics';
  if (s === 'mathematical activities') return 'Mathematical Activities';
  if (s.includes('math')) {
    if (isPP || gNum <= 3) return 'Mathematical Activities';
    if (gNum >= 10) return 'Core Mathematics';
    return 'Mathematics';
  }
  if (s.includes('literature in english')) return 'Literature in English';
  if (s.includes('fasihi')) return 'Fasihi ya Kiswahili';
  if (s.includes('indigenous')) return 'Indigenous Language Activities';
  if (s === 'french') return 'French';
  if (s === 'arabic') return 'Arabic';
  if (s === 'german') return 'German';
  if (s === 'language activities') return 'Language Activities';
  if (s.includes('english')) {
    if (isPP) return 'Language Activities';
    if (gNum <= 3) return 'English Language Activities';
    return 'English';
  }
  if (s.includes('kiswahili')) {
    if (gNum >= 1 && gNum <= 3) return 'Kiswahili Language Activities';
    return 'Kiswahili';
  }
  if (s.includes('environmental')) return 'Environmental Activities';
  if (s.includes('general science')) return 'General Science';
  if (s.includes('science & technology') || s.includes('science and technology')) {
    return 'Science and Technology';
  }
  if (s.includes('integrated science')) return 'Integrated Science';
  if (s.includes('biology')) return 'Biology';
  if (s.includes('chemistry')) return 'Chemistry';
  if (s.includes('physics')) return 'Physics';
  if (s.includes('home science') || s.includes('homescience')) return 'Home Science';
  if (s.includes('marine') || s.includes('fisheries')) {
    return 'Marine and Fisheries Technology';
  }
  if (s.includes('agriculture')) {
    if (gNum >= 10) return 'Agriculture';
    return 'Agriculture and Nutrition';
  }
  if (s.includes('information communication') || s === 'ict') {
    return 'Information Communication Technology (ICT)';
  }
  if (s.includes('pre-technical')) return 'Pre-Technical Studies';
  if (s.includes('computer')) {
    if (gNum >= 10 && s.includes('studies')) return 'Computer Studies';
    return 'Computer Science';
  }
  if (s.includes('aviation')) return 'Aviation';
  if (s.includes('building')) return 'Building Construction';
  if (s.includes('electricity')) return 'Electricity';
  if (s.includes('metal')) return 'Metal Work';
  if (s.includes('power mechanics')) return 'Power Mechanics';
  if (s.includes('woodwork')) return 'Woodwork';
  if (s.includes('media technology')) return 'Media Technology';
  if (s.includes('community service') || s.includes('(csl)')) {
    return 'Community Service Learning (CSL)';
  }
  if (s.includes('life skills')) return 'Life Skills';
  if (s.includes('history')) return 'History and Citizenship';
  if (s.includes('geography')) return 'Geography';
  if (s.includes('business')) return 'Business Studies';
  if (s.includes('social studies')) return 'Social Studies';
  if (s.includes('music and dance')) return 'Music and Dance';
  if (s.includes('theatre and film')) return 'Theatre and Film';
  if (s.includes('fine arts')) return 'Fine Arts';
  if (s.includes('sports and recreation')) return 'Sports and Recreation';
  if (s.includes('physical education')) return 'Physical Education';
  if (s.includes('creative') || s.includes('psychomotor')) {
    if (isPP || gNum <= 3) return 'Creative Activities';
    if (gNum <= 6) return 'Creative Arts';
    return 'Creative Arts and Sports';
  }
  if (s.includes('christian') || s.includes('(cre)')) {
    return 'Christian Religious Education (CRE)';
  }
  if (s.includes('islamic') || s.includes('(ire)')) {
    return 'Islamic Religious Education (IRE)';
  }
  return 'Mathematics';
}

function resolveExerciseDomain(subject: string): string {
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
  if (s.includes('physics') || s.includes('electricity') || s.includes('aviation') || s.includes('power mechanics')) {
    return s.includes('electricity') || s.includes('aviation') || s.includes('power mechanics')
      ? 'technical_engineering'
      : 'physics';
  }
  if (s.includes('building') || s.includes('metal') || s.includes('woodwork') || s.includes('media technology')) {
    return 'technical_engineering';
  }
  if (s.includes('home science') || s.includes('homescience')) return 'homescience';
  if (s.includes('marine') || s.includes('fisheries')) return 'agriculture';
  if (s.includes('science')) return 'science';
  if (s.includes('environmental')) return 'environmental';
  if (s.includes('agriculture')) return 'agriculture';
  if (s.includes('business')) return 'business';
  if (s.includes('pre-technical') || s.includes('computer') || s.includes('information communication') || s === 'ict') {
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

const orderedUnitsCache = new Map<string, OrderedSubStrandUnit[]>();

function getOrderedCurriculumUnits(
  gradeKey: string,
  subject: string
): OrderedSubStrandUnit[] {
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const cacheKey = `${gradeKey}::${sylSubject}`;
  const cached = orderedUnitsCache.get(cacheKey);
  if (cached) return cached;

  const gradeArg = gradeKey.startsWith('PP') ? gradeKey : Number(gradeKey) || 7;
  const syl = getSyllabusForGrade(gradeArg, sylSubject);

  // Merge Term 1 -> Term 2 -> Term 3 in exact sequential order from First Strand to Last Strand
  const rawBlocks: SyllabusBlock[] = [
    ...(syl.strandsByTerm[1] || []),
    ...(syl.strandsByTerm[2] || []),
    ...(syl.strandsByTerm[3] || []),
  ].filter((b) => b && b.strand && Array.isArray(b.subs) && b.subs.length > 0);

  const mergedStrands: Array<{ strand: string; subs: string[] }> = [];

  for (const block of rawBlocks) {
    const strandName = block.strand.trim();
    let group = mergedStrands.find((g) => g.strand === strandName);
    if (!group) {
      group = { strand: strandName, subs: [] };
      mergedStrands.push(group);
    }
    for (const rawSub of block.subs) {
      const cleaned = cleanScopeSuffix(rawSub);
      if (cleaned && !group.subs.includes(cleaned)) {
        group.subs.push(cleaned);
      }
    }
  }

  const totalGlobalSubs = mergedStrands.reduce((sum, g) => sum + g.subs.length, 0);
  const units: OrderedSubStrandUnit[] = [];
  let globalIdx = 0;

  for (let sIdx = 0; sIdx < mergedStrands.length; sIdx++) {
    const grp = mergedStrands[sIdx];
    for (let subIdx = 0; subIdx < grp.subs.length; subIdx++) {
      units.push({
        strandIndex: sIdx,
        totalStrands: mergedStrands.length,
        strand: grp.strand,
        subIndexInStrand: subIdx,
        totalSubsInStrand: grp.subs.length,
        globalSubIndex: globalIdx,
        totalGlobalSubs,
        substrand: grp.subs[subIdx],
      });
      globalIdx += 1;
    }
  }

  orderedUnitsCache.set(cacheKey, units);
  return units;
}

/**
 * Generates the next CBC Gaming question by walking STRICTLY SEQUENTIALLY
 * from First Strand -> Last Strand and Sub-strand 1 -> Last Sub-strand,
 * asking authentic End-of-Strand Learner's Book Exercise Questions with ZERO repetition!
 */
export function generateNextGameQuestion(params: {
  sessionId: string;
  subject: string;
  gradeKey: string;
  session?: GamingSession;
  player?: GamingPlayer;
}): PublicGameQuestion {
  const { sessionId, subject, gradeKey, session, player } = params;
  const gradeLabel = gradeKey.startsWith('PP') ? gradeKey : `Grade ${gradeKey}`;
  const sylSubject = resolveSyllabusSubject(subject, gradeKey);
  const cursorKey = `${gradeKey}::${sylSubject}`;

  const units = getOrderedCurriculumUnits(gradeKey, subject);
  const totalUnits = Math.max(1, units.length);

  const seenSet = new Set<string>([
    ...(player?.seenQuestionKeys || []),
    ...(session?.usedQuestionKeys || []),
  ]);

  const startCursor =
    session?.subjectCursors?.[cursorKey] ??
    player?.curriculumCursor?.[cursorKey] ??
    0;

  // Step strictly onto the current Sub-strand in First-Strand -> Last-Strand order
  const unitIdx = startCursor % totalUnits;
  const passNumber = Math.floor(startCursor / totalUnits);
  const activeUnit = units[unitIdx];

  const ctx: StrandContext = {
    gradeKey,
    gradeLabel,
    subject,
    strand: activeUnit.strand,
    substrand: activeUnit.substrand,
  };

  const domain = resolveExerciseDomain(subject);
  let chosen: ExerciseItem | null = null;

  if (domain === 'mathematics') {
    for (let attempt = 0; attempt < 300; attempt++) {
      const seed = startCursor + attempt * 7;
      const cand = generateWorkedMathematicsExercise(ctx, seed);
      if (!seenSet.has(hashPromptKey(cand.q))) {
        chosen = cand;
        break;
      }
    }
  } else {
    const bank = DOMAIN_EXERCISE_BANKS[domain] || [];
    const hay = `${activeUnit.strand} ${activeUnit.substrand}`.toLowerCase();

    // 1) Strand/Sub-strand keyword-matched end-of-strand exercise from the curated Learner's Book pool
    const strandMatched = bank.find(
      (item) =>
        !seenSet.has(hashPromptKey(item.q)) &&
        item.tags.some((t) => hay.includes(t.toLowerCase()))
    );
    if (strandMatched) {
      chosen = strandMatched;
    }

    // 2) Worked / Quantitative End-of-Strand Exercise for this domain (magnification, density, Ohm's law, accounting, binary, map scale, Zakah, rhythm beats, etc.)
    if (!chosen && passNumber % 2 === 1) {
      for (let attempt = 0; attempt < 80; attempt++) {
        const seed = startCursor + attempt * 3;
        const worked = generateWorkedDomainExercise(domain, ctx, seed);
        if (worked && !seenSet.has(hashPromptKey(worked.q))) {
          chosen = worked;
          break;
        }
      }
    }

    // 3) Any remaining unseen exercise in this subject's core end-of-strand bank
    if (!chosen) {
      const unseenInBank = bank.find((item) => !seenSet.has(hashPromptKey(item.q)));
      if (unseenInBank) {
        chosen = unseenInBank;
      }
    }

    // 4) Extended textbook grammar / scriptural / subject exercises
    if (!chosen) {
      for (let probe = 0; probe < 100; probe++) {
        const extra = generateExtraTextbookExercise(domain, ctx, probe);
        if (extra && !seenSet.has(hashPromptKey(extra.q))) {
          chosen = extra;
          break;
        }
      }
    }

    // 5) Deep subject scenario & factual exercises
    if (!chosen) {
      for (let probe = 0; probe < 100; probe++) {
        const deep = generateDeepSubjectExercise(domain, ctx, probe);
        if (deep && !seenSet.has(hashPromptKey(deep.q))) {
          chosen = deep;
          break;
        }
      }
    }

    // 6) Worked quantitative exercises across full parameter space
    if (!chosen) {
      for (let attempt = 0; attempt < 400; attempt++) {
        const seed = attempt + startCursor;
        const worked = generateWorkedDomainExercise(domain, ctx, seed);
        if (worked && !seenSet.has(hashPromptKey(worked.q))) {
          chosen = worked;
          break;
        }
      }
    }
  }

  // Final textbook quantitative exercise fallback (never asks meta-syllabus/KICD questions!)
  if (!chosen) {
    for (let attempt = 0; attempt < 300; attempt++) {
      const cand = generateWorkedMathematicsExercise(ctx, startCursor + attempt * 13);
      if (!seenSet.has(hashPromptKey(cand.q))) {
        chosen = cand;
        break;
      }
    }
    if (!chosen) {
      chosen = generateWorkedMathematicsExercise(ctx, startCursor);
    }
  }

  const qKey = hashPromptKey(chosen.q);
  const nextCursor = startCursor + 1;

  if (session) {
    session.subjectCursors = session.subjectCursors || {};
    session.subjectCursors[cursorKey] = nextCursor;
    session.usedQuestionKeys = session.usedQuestionKeys || [];
    session.usedQuestionKeys.push(qKey);
    if (session.usedQuestionKeys.length > 600) {
      session.usedQuestionKeys = session.usedQuestionKeys.slice(-600);
    }
  }

  if (player) {
    player.curriculumCursor = player.curriculumCursor || {};
    player.curriculumCursor[cursorKey] = nextCursor;
    player.seenQuestionKeys = player.seenQuestionKeys || [];
    if (!player.seenQuestionKeys.includes(qKey)) {
      player.seenQuestionKeys.push(qKey);
      if (player.seenQuestionKeys.length > 2000) {
        player.seenQuestionKeys = player.seenQuestionKeys.slice(-2000);
      }
    }
  }

  // Randomize option order cleanly per session question
  const correctText = chosen.options[chosen.ans];
  const distractors = chosen.options.filter((_, idx) => idx !== chosen!.ans);
  const packed = packChoices(
    correctText,
    distractors,
    Date.now() % 100000 + startCursor * 19
  );

  const nonce = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const token = signQuestionToken({
    nonce,
    sessionId,
    correctIndex: packed.ans,
    explanation: chosen.exp,
  });

  const publicQ: PublicGameQuestion = {
    nonce,
    subject,
    gradeLabel,
    strand: activeUnit.strand,
    substrand: activeUnit.substrand,
    strandProgress: `Strand ${activeUnit.strandIndex + 1}/${activeUnit.totalStrands} • Sub-strand ${activeUnit.globalSubIndex + 1}/${activeUnit.totalGlobalSubs}`,
    prompt: chosen.q,
    options: packed.options,
    token,
  };

  if (session) {
    session.currentQuestion = publicQ;
  }

  return publicQ;
}
