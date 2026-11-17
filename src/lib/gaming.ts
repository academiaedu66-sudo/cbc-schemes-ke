import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';
import { getSyllabusForGrade } from '../../scripts/cbc-syllabus-data.mjs';

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
  'English',
  'Kiswahili',
  'Integrated Science',
  'Science & Technology',
  'Biology',
  'Chemistry',
  'Physics',
  'Pre-Technical Studies',
  'Computer Studies',
  'Agriculture & Nutrition',
  'Social Studies',
  'History & Citizenship',
  'Geography',
  'Business Studies',
  'Creative Arts & Sports',
  'Christian Religious Education (CRE)',
  'Islamic Religious Education (IRE)',
  'Language Activities',
  'Mathematical Activities',
  'Environmental Activities',
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
// SEQUENTIAL KICD STRAND -> SUB-STRAND ENGINE (FIRST STRAND TO LAST STRAND)
// ============================================================================

interface RawQuizItem {
  q: string;
  options: [string, string, string, string];
  ans: number;
  exp: string;
  tags?: string[]; // keywords linking curated items to matching KICD Strands/Sub-strands
}

interface OrderedSubStrandUnit {
  strandIndex: number; // 0-based (0 = First Strand .. S-1 = Last Strand)
  totalStrands: number;
  strand: string;
  subIndexInStrand: number; // 0-based inside this strand
  totalSubsInStrand: number;
  globalSubIndex: number; // 0-based across all strands (0 .. M-1)
  totalGlobalSubs: number;
  substrand: string;
  kiq: string;
  resourcesList: string[];
  siblingSubstrands: string[];
  otherStrands: string[];
  otherSubstrands: string[];
  otherResources: string[];
}

function hashPromptKey(prompt: string): string {
  const norm = prompt.toLowerCase().replace(/\s+/g, ' ').trim();
  return crypto.createHash('sha1').update(norm).digest('hex').slice(0, 14);
}

function cleanScopeSuffix(raw: string): string {
  return String(raw || '')
    .replace(/\s*\((?:Foundational|Intermediate|Advanced)\s+Grade\s+\d+\s+Scope\)/gi, '')
    .replace(/\s*\((?:PP1 Foundational Play|PP2 School-Readiness)\s+Scope\)/gi, '')
    .trim();
}

function splitCleanItems(raw: string): string[] {
  return String(raw || '')
    .split(/[,;&]+/)
    .map((p) => p.replace(/^\s*(?:and|or)\s+/i, '').trim())
    .filter((p) => p.length >= 3);
}

export function resolveSyllabusSubject(subject: string, gradeKey: string): string {
  const upperG = String(gradeKey || '7').toUpperCase().trim();
  const isPP = upperG === 'PP1' || upperG === 'PP2';
  const gNum = isPP ? 0 : Number(upperG) || 7;
  const s = String(subject || 'Mathematics').toLowerCase().trim();

  if (s.includes('math')) {
    if (isPP || gNum <= 3) return 'Mathematical Activities';
    if (gNum >= 10) return 'Core Mathematics';
    return 'Mathematics';
  }
  if (s === 'language activities') {
    if (isPP) return 'Language Activities';
    if (gNum <= 3) return 'English Language Activities';
    return 'English';
  }
  if (s.includes('english')) {
    if (isPP) return 'Language Activities';
    if (gNum <= 3) return 'English Language Activities';
    return 'English';
  }
  if (s.includes('kiswahili')) {
    if (isPP || gNum <= 3) return 'Kiswahili Language Activities';
    return 'Kiswahili';
  }
  if (s.includes('indigenous')) return 'Indigenous Language Activities';
  if (s.includes('environmental')) return 'Environmental Activities';
  if (s.includes('science & tech') || s.includes('science and tech')) {
    return 'Science and Technology';
  }
  if (s.includes('integrated science')) {
    if (isPP || gNum <= 3) return 'Environmental Activities';
    if (gNum <= 6) return 'Science and Technology';
    return 'Integrated Science';
  }
  if (s.includes('biology')) return 'Biology';
  if (s.includes('chemistry')) return 'Chemistry';
  if (s.includes('physics')) return 'Physics';
  if (s.includes('pre-tech')) return 'Pre-Technical Studies';
  if (s.includes('computer')) return 'Computer Science';
  if (s.includes('agric')) return 'Agriculture and Nutrition';
  if (s.includes('history')) return 'History and Citizenship';
  if (s.includes('geography')) return 'Geography';
  if (s.includes('business')) return 'Business Studies';
  if (s.includes('social')) return 'Social Studies';
  if (s.includes('creative')) {
    if (isPP || gNum <= 3) return 'Creative Activities';
    if (gNum <= 6) return 'Creative Arts';
    return 'Creative Arts and Sports';
  }
  if (s.includes('cre') || s.includes('christian')) {
    return 'Christian Religious Education (CRE)';
  }
  if (s.includes('ire') || s.includes('islamic')) {
    return 'Islamic Religious Education (IRE)';
  }
  if (s.includes('community service') || s.includes('csl')) {
    return 'Community Service Learning (CSL)';
  }
  return 'Integrated Science';
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

  // Merge Term 1 -> Term 2 -> Term 3 in exact KICD order from First Strand to Last Strand
  const rawBlocks: SyllabusBlock[] = [
    ...(syl.strandsByTerm[1] || []),
    ...(syl.strandsByTerm[2] || []),
    ...(syl.strandsByTerm[3] || []),
  ].filter((b) => b && b.strand && Array.isArray(b.subs) && b.subs.length > 0);

  const mergedStrands: Array<{
    strand: string;
    entries: Array<{ substrand: string; kiq: string; resourcesList: string[] }>;
  }> = [];

  for (const block of rawBlocks) {
    const strandName = block.strand.trim();
    let group = mergedStrands.find((g) => g.strand === strandName);
    if (!group) {
      group = { strand: strandName, entries: [] };
      mergedStrands.push(group);
    }
    const resList = splitCleanItems(block.resources || '');
    for (const rawSub of block.subs) {
      const cleaned = cleanScopeSuffix(rawSub);
      if (cleaned && !group.entries.some((e) => e.substrand === cleaned)) {
        group.entries.push({
          substrand: cleaned,
          kiq: (block.kiq || '').trim(),
          resourcesList: resList,
        });
      }
    }
  }

  const allStrandNames = mergedStrands.map((g) => g.strand);
  const totalGlobalSubs = mergedStrands.reduce((sum, g) => sum + g.entries.length, 0);

  const units: OrderedSubStrandUnit[] = [];
  let globalIdx = 0;

  for (let sIdx = 0; sIdx < mergedStrands.length; sIdx++) {
    const grp = mergedStrands[sIdx];
    const otherStrands = allStrandNames.filter((n) => n !== grp.strand);
    const otherSubstrands: string[] = [];
    const otherResources: string[] = [];

    for (let oIdx = 0; oIdx < mergedStrands.length; oIdx++) {
      if (oIdx === sIdx) continue;
      for (const e of mergedStrands[oIdx].entries) {
        if (!otherSubstrands.includes(e.substrand)) {
          otherSubstrands.push(e.substrand);
        }
        for (const r of e.resourcesList) {
          if (!otherResources.includes(r)) {
            otherResources.push(r);
          }
        }
      }
    }

    for (let subIdx = 0; subIdx < grp.entries.length; subIdx++) {
      const entry = grp.entries[subIdx];
      const siblings = grp.entries
        .filter((_, idx) => idx !== subIdx)
        .map((e) => e.substrand);

      units.push({
        strandIndex: sIdx,
        totalStrands: mergedStrands.length,
        strand: grp.strand,
        subIndexInStrand: subIdx,
        totalSubsInStrand: grp.entries.length,
        globalSubIndex: globalIdx,
        totalGlobalSubs,
        substrand: entry.substrand,
        kiq: entry.kiq,
        resourcesList: entry.resourcesList,
        siblingSubstrands: siblings,
        otherStrands,
        otherSubstrands,
        otherResources,
      });
      globalIdx += 1;
    }
  }

  orderedUnitsCache.set(cacheKey, units);
  return units;
}

// Deterministic Fisher-Yates shuffle seeded by integer so distractors vary cleanly
function seededPickThree(pool: string[], seed: number, avoid: string): [string, string, string] | null {
  const filtered = pool.filter(
    (x) => x && x.toLowerCase().trim() !== avoid.toLowerCase().trim()
  );
  if (filtered.length < 3) return null;
  const copy = [...filtered];
  let s = Math.abs(seed) + 1;
  for (let i = copy.length - 1; i > 0; i--) {
    s = (s * 1664525 + 1013904223) >>> 0;
    const j = s % (i + 1);
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return [copy[0], copy[1], copy[2]];
}

function shuffleWithAnswer<T extends string | number>(
  correct: T,
  distractors: T[]
): { options: [string, string, string, string]; ansIndex: number } {
  const corrStr = String(correct);
  const uniqueSet = new Set<string>([corrStr]);
  for (const d of distractors) {
    if (uniqueSet.size < 4 && String(d) !== corrStr) {
      uniqueSet.add(String(d));
    }
  }
  let filler = 1;
  while (uniqueSet.size < 4) {
    uniqueSet.add(`Option ${filler++}`);
  }
  const arr = Array.from(uniqueSet).slice(0, 4);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return {
    options: [arr[0], arr[1], arr[2], arr[3]],
    ansIndex: arr.indexOf(corrStr),
  };
}

function gcd(a: number, b: number): number {
  let x = Math.abs(a);
  let y = Math.abs(b);
  while (y !== 0) {
    const t = y;
    y = x % y;
    x = t;
  }
  return x || 1;
}

// Strand-specific deterministic worked Mathematics problem generator (zero repetition!)
function generateStrandMathQuestion(
  gradeKey: string,
  unit: OrderedSubStrandUnit,
  variantSeed: number
): RawQuizItem {
  const upperG = gradeKey.toUpperCase();
  const isPP = upperG === 'PP1' || upperG === 'PP2';
  const gNum = isPP ? 0 : Number(upperG) || 7;
  const tagText = `${unit.strand} ${unit.substrand}`.toLowerCase();
  const v = Math.abs(variantSeed);

  // Early Years (PP1, PP2, Grades 1–3)
  if (isPP || gNum <= 3) {
    if (tagText.includes('geometry') || tagText.includes('shape') || tagText.includes('line')) {
      const shapes = [
        { name: 'triangle', sides: 3 },
        { name: 'square', sides: 4 },
        { name: 'rectangle', sides: 4 },
        { name: 'pentagon', sides: 5 },
        { name: 'hexagon', sides: 6 },
      ];
      const sh = shapes[v % shapes.length];
      const count = 2 + (v % 4);
      const total = sh.sides * count;
      const opts = shuffleWithAnswer(total, [total + 2, total - 1, total + 3]);
      return {
        q: `One ${sh.name} has ${sh.sides} sides. How many sides do ${count} separate ${sh.name}s have altogether?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `${count} × ${sh.sides} sides = ${total} sides.`,
      };
    }

    if (tagText.includes('money') || tagText.includes('currency') || tagText.includes('change')) {
      const paidChoices = [50, 100, 200, 500];
      const paid = paidChoices[v % paidChoices.length];
      const itemCost = Math.max(10, paid - (15 + ((v * 5) % Math.max(20, paid - 20))));
      const bal = paid - itemCost;
      const opts = shuffleWithAnswer(`KSh ${bal}`, [
        `KSh ${bal + 10}`,
        `KSh ${Math.max(5, bal - 5)}`,
        `KSh ${bal + 20}`,
      ]);
      return {
        q: `Amina buys an exercise book for KSh ${itemCost} and pays with a KSh ${paid} note. How much balance (change) should she receive?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Change = KSh ${paid} - KSh ${itemCost} = KSh ${bal}.`,
      };
    }

    if (tagText.includes('measure') || tagText.includes('length') || tagText.includes('mass') || tagText.includes('capacity')) {
      const m1 = 12 + ((v * 3) % 35);
      const m2 = 9 + ((v * 7) % 28);
      const unitSym = v % 3 === 0 ? 'm' : v % 3 === 1 ? 'kg' : 'litres';
      const total = m1 + m2;
      const opts = shuffleWithAnswer(`${total} ${unitSym}`, [
        `${total + 4} ${unitSym}`,
        `${Math.abs(m1 - m2)} ${unitSym}`,
        `${total - 2} ${unitSym}`,
      ]);
      return {
        q: `Work out: ${m1} ${unitSym} + ${m2} ${unitSym} = ?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `${m1} + ${m2} = ${total} ${unitSym}.`,
      };
    }

    if (v % 2 === 0) {
      const a = 7 + ((v * 5) % 42);
      const b = 6 + ((v * 9) % 37);
      const sum = a + b;
      const opts = shuffleWithAnswer(sum, [sum + 2, sum - 1, sum + 10]);
      return {
        q: `Under ${unit.substrand}: work out ${a} + ${b} = ?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `${a} + ${b} = ${sum}.`,
      };
    } else {
      const small = 8 + ((v * 4) % 29);
      const diff = 9 + ((v * 6) % 34);
      const big = small + diff;
      const opts = shuffleWithAnswer(diff, [diff + 2, Math.max(1, diff - 3), diff + 5]);
      return {
        q: `Under ${unit.substrand}: subtract ${big} - ${small} = ?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `${big} - ${small} = ${diff}.`,
      };
    }
  }

  // Strand: ALGEBRA / MATRICES / CALCULUS (Grades 4–12)
  if (tagText.includes('calculus') || tagText.includes('differentiat')) {
    const a = 2 + (v % 6);
    const n = 2 + ((v >> 1) % 3);
    const xVal = 1 + (v % 4);
    const coeff = a * n;
    const grad = coeff * Math.pow(xVal, n - 1);
    const opts = shuffleWithAnswer(grad, [grad + a, grad * 2, Math.max(1, grad - n)]);
    return {
      q: `Find the gradient dy/dx of the curve y = ${a}x^${n} at the point where x = ${xVal}.`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `dy/dx = ${coeff}x^${n - 1}. At x = ${xVal}, gradient = ${coeff} × ${Math.pow(xVal, n - 1)} = ${grad}.`,
    };
  }

  if (tagText.includes('matrix') || tagText.includes('matrices')) {
    const a = 2 + (v % 7);
    const d = 3 + ((v * 3) % 6);
    const b = 1 + ((v * 2) % 5);
    const c = 2 + ((v * 5) % 4);
    const det = a * d - b * c;
    const opts = shuffleWithAnswer(det, [a * d + b * c, det + 3, det - 4]);
    return {
      q: `Calculate the determinant of the 2×2 matrix [[${a}, ${b}], [${c}, ${d}]].`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `Determinant = ad - bc = (${a} × ${d}) - (${b} × ${c}) = ${a * d} - ${b * c} = ${det}.`,
    };
  }

  if (tagText.includes('algebra') || tagText.includes('equation') || tagText.includes('inequalit')) {
    const x = 3 + ((v * 3) % 14);
    const m = 2 + (v % 7);
    const c = 4 + ((v * 5) % 19);
    const rhs = m * x + c;
    const opts = shuffleWithAnswer(`x = ${x}`, [
      `x = ${x + 2}`,
      `x = ${Math.max(1, x - 1)}`,
      `x = ${x + 4}`,
    ]);
    return {
      q: `Solve the linear equation: ${m}x + ${c} = ${rhs}`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `${m}x = ${rhs} - ${c} = ${rhs - c}; dividing by ${m} gives x = ${x}.`,
    };
  }

  // Strand: GEOMETRY / TRIGONOMETRY / ANGLES / PYTHAGORAS
  if (tagText.includes('geometry') || tagText.includes('angle') || tagText.includes('trigonometr') || tagText.includes('loci')) {
    if (v % 2 === 0) {
      const a1 = 35 + ((v * 7) % 50);
      const a2 = 40 + ((v * 5) % 45);
      const a3 = 180 - a1 - a2;
      const opts = shuffleWithAnswer(`${a3}°`, [
        `${a3 + 10}°`,
        `${Math.max(15, a3 - 10)}°`,
        `${360 - a1 - a2}°`,
      ]);
      return {
        q: `Two interior angles of a triangle measure ${a1}° and ${a2}°. Find the size of the third angle.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Interior angles of a triangle add up to 180°: 180° - (${a1}° + ${a2}°) = ${a3}°.`,
      };
    } else {
      const sides = 5 + (v % 6); // 5..10-gon
      const sumInterior = (sides - 2) * 180;
      const opts = shuffleWithAnswer(`${sumInterior}°`, [
        `${sides * 180}°`,
        `${sumInterior - 180}°`,
        `${sumInterior + 90}°`,
      ]);
      return {
        q: `Find the sum of the interior angles of a regular ${sides}-sided polygon.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Sum of interior angles = (n - 2) × 180° = (${sides} - 2) × 180° = ${sumInterior}°.`,
      };
    }
  }

  // Strand: DATA HANDLING / STATISTICS / PROBABILITY
  if (tagText.includes('data') || tagText.includes('statistic') || tagText.includes('probabilit')) {
    if (v % 2 === 0) {
      const base = 10 + ((v * 3) % 18);
      const nums = [base - 3, base - 1, base, base + 1, base + 3];
      const opts = shuffleWithAnswer(base, [base + 2, base - 2, base * 5]);
      return {
        q: `Calculate the arithmetic MEAN of the dataset: ${nums.join(', ')}.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Sum = ${base * 5}; Mean = ${base * 5} ÷ 5 = ${base}.`,
      };
    } else {
      const red = 3 + (v % 5);
      const blue = 4 + ((v * 2) % 6);
      const green = 2 + ((v * 3) % 4);
      const total = red + blue + green;
      const g = gcd(red, total);
      const ansFrac = `${red / g}/${total / g}`;
      const w1 = `${blue}/${total}`;
      const w2 = `${red}/${blue + green}`;
      const w3 = `${(red + 1)}/${total + 1}`;
      const opts = shuffleWithAnswer(ansFrac, [w1, w2, w3]);
      return {
        q: `A bag contains ${red} red, ${blue} blue, and ${green} green marbles. If one marble is picked at random, what is the probability of picking a RED marble (in simplest form)?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Total marbles = ${total}. P(Red) = ${red}/${total} = ${ansFrac}.`,
      };
    }
  }

  // Strand: MEASUREMENT / COMMERCIAL ARITHMETIC / SPEED / AREA / VOLUME
  if (
    tagText.includes('measure') ||
    tagText.includes('money') ||
    tagText.includes('commercial') ||
    tagText.includes('area') ||
    tagText.includes('volume')
  ) {
    const mode = v % 3;
    if (mode === 0) {
      const l = 8 + ((v * 3) % 15);
      const w = 5 + ((v * 2) % 11);
      const area = l * w;
      const perim = 2 * (l + w);
      const opts = shuffleWithAnswer(`${area} m²`, [
        `${perim} m²`,
        `${area + l} m²`,
        `${l + w} m²`,
      ]);
      return {
        q: `A rectangular school garden measures ${l} m long by ${w} m wide. Calculate its AREA.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Area = Length × Width = ${l} m × ${w} m = ${area} m².`,
      };
    }
    if (mode === 1) {
      const speed = 45 + ((v * 5) % 50);
      const hrs = 2 + (v % 4);
      const dist = speed * hrs;
      const opts = shuffleWithAnswer(`${dist} km`, [
        `${dist + 25} km`,
        `${Math.max(20, dist - 20)} km`,
        `${speed + hrs} km`,
      ]);
      return {
        q: `A vehicle travels at an average speed of ${speed} km/h for ${hrs} hours. Find the total distance covered.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Distance = Speed × Time = ${speed} km/h × ${hrs} h = ${dist} km.`,
      };
    }
    const costPrice = (4 + (v % 12)) * 200;
    const profitPct = [10, 15, 20, 25][v % 4];
    const sellPrice = costPrice + (costPrice * profitPct) / 100;
    const opts = shuffleWithAnswer(`KSh ${sellPrice}`, [
      `KSh ${costPrice - (costPrice * profitPct) / 100}`,
      `KSh ${sellPrice + 100}`,
      `KSh ${costPrice + profitPct}`,
    ]);
    return {
      q: `A trader bought goods for KSh ${costPrice} and sold them at a ${profitPct}% profit. Find the selling price.`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `Profit = ${profitPct}% of ${costPrice} = KSh ${(costPrice * profitPct) / 100}; Selling price = KSh ${sellPrice}.`,
    };
  }

  // Strand: NUMBERS / FRACTIONS / DECIMALS / SQUARES / GCD & LCM
  if (tagText.includes('gcd') || tagText.includes('lcm') || tagText.includes('factor')) {
    const base = 3 + (v % 7);
    const n1 = base * 4;
    const n2 = base * 6;
    const gVal = gcd(n1, n2);
    const lcmVal = (n1 * n2) / gVal;
    const opts = shuffleWithAnswer(lcmVal, [gVal, n1 * n2, lcmVal + base]);
    return {
      q: `Find the Least Common Multiple (LCM) of ${n1} and ${n2}.`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `Multiples of ${n1} and ${n2} first meet at LCM = ${lcmVal} (GCD = ${gVal}).`,
    };
  }

  if (tagText.includes('percent') || tagText.includes('decimal') || tagText.includes('fraction')) {
    const pct = [15, 20, 25, 30, 40][v % 5];
    const qty = (3 + ((v * 3) % 14)) * 20;
    const res = (pct * qty) / 100;
    const opts = shuffleWithAnswer(res, [res + 6, Math.max(2, res - 4), res + 12]);
    return {
      q: `Evaluate ${pct}% of ${qty}.`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `(${pct} ÷ 100) × ${qty} = ${res}.`,
    };
  }

  const a = 4 + ((v * 3) % 13);
  const b = 3 + ((v * 5) % 11);
  const sqSum = a * a + b * b;
  const opts = shuffleWithAnswer(sqSum, [
    (a + b) * (a + b),
    2 * (a + b),
    sqSum + 5,
  ]);
  return {
    q: `Evaluate: ${a}² + ${b}²`,
    options: opts.options,
    ans: opts.ansIndex,
    exp: `${a}² = ${a * a} and ${b}² = ${b * b}; ${a * a} + ${b * b} = ${sqSum}.`,
  };
}

// Curated concept questions tagged by strand/sub-strand keywords so they align with KICD progression
const CURATED_SUBJECT_BANKS: Record<string, RawQuizItem[]> = {
  english: [
    {
      tags: ['noun', 'word class', 'grammar'],
      q: 'Identify the collective noun: "A _____ of bees flew over the school garden."',
      options: ['herd', 'swarm', 'flock', 'pack'],
      ans: 1,
      exp: 'A group of bees is called a swarm.',
    },
    {
      tags: ['pronoun', 'verb', 'tense', 'agreement'],
      q: 'Fill in the blank: "Neither Asha nor her brothers _____ late for assembly."',
      options: ['was', 'were', 'is', 'has been'],
      ans: 1,
      exp: 'With "neither...nor", the verb agrees with the nearer subject ("brothers" -> plural "were").',
    },
    {
      tags: ['adjective', 'adverb', 'preposition'],
      q: 'Choose the correct preposition: "She congratulated him _____ passing his CBC assessment."',
      options: ['for', 'on', 'about', 'with'],
      ans: 1,
      exp: 'The standard English collocation is "congratulate someone ON something".',
    },
    {
      tags: ['passive', 'speech', 'punctuation', 'letter'],
      q: 'Change to passive voice: "The prefect rang the school bell."',
      options: [
        'The bell rings by the prefect.',
        'The bell was rung by the prefect.',
        'The bell was rang by the prefect.',
        'The bell is rung by the prefect.',
      ],
      ans: 1,
      exp: 'Past simple passive uses "was/were + past participle" (ring -> rang -> rung).',
    },
    {
      tags: ['punctuation', 'direct', 'writing'],
      q: 'Choose the correctly punctuated sentence:',
      options: [
        'Where are you going, asked the teacher.',
        '"Where are you going?" asked the teacher.',
        '"Where are you going" asked the teacher?',
        'Where are you going? "asked the teacher."',
      ],
      ans: 1,
      exp: 'Spoken questions go inside quotation marks with the question mark inside.',
    },
    {
      tags: ['question tag', 'conditional', 'phrasal'],
      q: 'Choose the correct question tag: "The learners have completed their project, _____?"',
      options: ["haven't they", "didn't they", 'have they', "don't they"],
      ans: 0,
      exp: 'A positive statement with "have" takes the negative tag "haven\'t they?".',
    },
    {
      tags: ['poem', 'poetry', 'imagery', 'oral'],
      q: 'Which literary device gives human qualities to non-human things in poetry and narratives?',
      options: ['Simile', 'Alliteration', 'Personification', 'Hyperbole'],
      ans: 2,
      exp: 'Personification attributes human traits to objects, nature, or ideas.',
    },
    {
      tags: ['synonym', 'antonym', 'vocabulary'],
      q: 'Which word is the ANTONYM of "diligent"?',
      options: ['Hardworking', 'Careful', 'Lazy', 'Attentive'],
      ans: 2,
      exp: '"Diligent" means hardworking and careful; its opposite is "lazy".',
    },
  ],
  kiswahili: [
    {
      tags: ['maamkizi', 'kusikiliza', 'adabu'],
      q: 'Jibu sahihi la maamkizi "Shikamoo" ni lipi?',
      options: ['Sijambo', 'Marahaba', 'Salama', 'Sabalkheri'],
      ans: 1,
      exp: 'Mtu anapoambiwa "Shikamoo" hujibu "Marahaba".',
    },
    {
      tags: ['ngeli', 'nomino', 'umoja', 'wingi'],
      q: 'Nomino "kitabu" na wingi wake "vitabu" ziko katika ngeli gani?',
      options: ['A-WA', 'KI-VI', 'LI-YA', 'U-I'],
      ans: 1,
      exp: 'Kitabu – Vitabu huangukia katika ngeli ya KI-VI.',
    },
    {
      tags: ['methali', 'kitendawili', 'fasihi'],
      q: 'Kamilisha methali: "Asiyesikia la mkuu _____."',
      options: ['hupata baraka', 'huvunjika guu', 'huenda mbali', 'hujenga nyumba'],
      ans: 1,
      exp: 'Methali kamili ni: "Asiyesikia la mkuu huvunjika guu."',
    },
    {
      tags: ['wingi', 'sarufi', 'sentensi'],
      q: 'Chagua wingi sahihi wa sentensi: "Mwalimu amefundisha mwanafunzi."',
      options: [
        'Walimu wamefundisha mwanafunzi.',
        'Walimu wamewafundisha wanafunzi.',
        'Mwalimu wamefundisha wanafunzi.',
        'Waalimu amefundisha wanafunzi.',
      ],
      ans: 1,
      exp: 'Wingi sahihi ni: "Walimu wamewafundisha wanafunzi."',
    },
    {
      tags: ['uakifishaji', 'kuandika', 'alama'],
      q: 'Ni alama ipi ya uakifishaji hutumiwa mwishoni mwa sentensi ya kuuliza swali?',
      options: ['Kikomo (.)', 'Kiulizi (?)', 'Mkato (,)', 'Hisishi (!)'],
      ans: 1,
      exp: 'Alama ya kiulizi (?) huwekwa mwishoni mwa swali.',
    },
    {
      tags: ['msamiati', 'kisawe', 'kidijitali'],
      q: 'Kisawe cha neno "rununu" katika Kiswahili sanifu ni kipi?',
      options: ['Runinga', 'Simu ya mkono', 'Tarakilishi', 'Redio'],
      ans: 1,
      exp: 'Rununu ni simu ya mkono; tarakilishi ni kompyuta na runinga ni televisheni.',
    },
  ],
  science: [
    {
      tags: ['laboratory', 'apparatus', 'bunsen', 'investigation'],
      q: 'Why is a non-luminous Bunsen burner flame preferred over a luminous flame for heating in the laboratory?',
      options: [
        'It is cooler and produces black soot',
        'It is hotter and does not deposit soot on apparatus',
        'It is bright yellow for lighting the room',
        'It uses closed air holes only',
      ],
      ans: 1,
      exp: 'Opening the air hole admits oxygen for complete combustion, giving a hotter, clean non-luminous flame.',
    },
    {
      tags: ['mixture', 'sublimation', 'chromatography', 'element', 'sodium'],
      q: 'Which separation method occurs when solid iodine or ammonium chloride turns directly into vapour on heating?',
      options: ['Filtration', 'Sublimation', 'Decantation', 'Simple distillation'],
      ans: 1,
      exp: 'Sublimation converts a solid directly into gas without passing through the liquid state.',
    },
    {
      tags: ['acid', 'base', 'ph', 'indicator'],
      q: 'A solution tested with universal indicator gives a pH of 2. This solution is:',
      options: ['Neutral', 'Weakly alkaline', 'Strongly acidic', 'Strongly basic'],
      ans: 2,
      exp: 'On the pH scale (0–14), pH 0–3 indicates a strong acid, pH 7 is neutral, and pH 11–14 is a strong alkali.',
    },
    {
      tags: ['cell', 'microscope', 'living', 'organelle'],
      q: 'Which cell organelle is called the powerhouse of the cell because it releases energy through respiration?',
      options: ['Nucleus', 'Mitochondrion', 'Ribosome', 'Golgi body'],
      ans: 1,
      exp: 'Mitochondria carry out aerobic respiration to generate ATP energy.',
    },
    {
      tags: ['photosynthesis', 'plant', 'nutrition'],
      q: 'Which raw gas do green plants absorb through stomata during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Argon'],
      ans: 2,
      exp: 'Green plants combine carbon dioxide and water using light absorbed by chlorophyll to make glucose and oxygen.',
    },
    {
      tags: ['electric', 'circuit', 'current', 'force', 'energy'],
      q: 'What is the SI unit of electric current measured using an ammeter?',
      options: ['Volt (V)', 'Ohm (Ω)', 'Ampere (A)', 'Watt (W)'],
      ans: 2,
      exp: 'Electric current is measured in Amperes (A).',
    },
  ],
  pretech_ict: [
    {
      tags: ['safety', 'ppe', 'workshop', 'foundation'],
      q: 'Which Personal Protective Equipment (PPE) protects a learner’s eyes from flying sparks or wood chips in a workshop?',
      options: ['Ear defenders', 'Safety goggles', 'Dust coat', 'Leather boots'],
      ans: 1,
      exp: 'Safety goggles shield the eyes from flying particles, sparks, and splashes.',
    },
    {
      tags: ['hardware', 'cpu', 'computer', 'input'],
      q: 'In Computer Science and Pre-Technical Studies, which component executes instructions via the Fetch-Decode-Execute cycle?',
      options: ['Hard Disk Drive', 'Central Processing Unit (CPU)', 'Power Supply Unit', 'Plotter'],
      ans: 1,
      exp: 'The CPU fetches instructions from memory, decodes them, and executes operations.',
    },
    {
      tags: ['drawing', 'compass', 'geometry', 'communication'],
      q: 'In technical drawing, which instrument is specifically designed to construct accurate circles and arcs?',
      options: ['T-square', 'Pair of compasses', 'Protractor', 'French curve'],
      ans: 1,
      exp: 'A pair of compasses draws circles and arcs of an exact set radius.',
    },
    {
      tags: ['online', 'cyber', 'phishing', 'security'],
      q: 'In cybersecurity, tricking people via fake SMS or emails into revealing M-Pesa PINs or passwords is known as:',
      options: ['Defragmentation', 'Phishing', 'Cloud syncing', 'Compiling'],
      ans: 1,
      exp: 'Phishing is social-engineering fraud aimed at stealing sensitive credentials.',
    },
    {
      tags: ['bookkeeping', 'entrepreneur', 'accounting', 'financial'],
      q: 'Which fundamental accounting equation always holds true on a Statement of Financial Position?',
      options: [
        'Assets = Capital + Liabilities',
        'Capital = Assets + Liabilities',
        'Liabilities = Assets + Capital',
        'Assets = Profit - Expenses',
      ],
      ans: 0,
      exp: 'Business resources (Assets) equal owner’s equity (Capital) plus external obligations (Liabilities).',
    },
  ],
  agriculture: [
    {
      tags: ['water', 'irrigation', 'soil', 'conservation'],
      q: 'Which irrigation method conserves the MOST water in dryland farming by delivering drops straight to crop roots?',
      options: ['Flood irrigation', 'Drip irrigation', 'Basin irrigation', 'Furrow irrigation'],
      ans: 1,
      exp: 'Drip irrigation minimizes evaporation and weed growth by applying water directly at the root zone.',
    },
    {
      tags: ['mulch', 'crop', 'weed', 'moisture'],
      q: 'What is the primary benefit of spreading organic mulch around young garden crops?',
      options: [
        'Increasing surface runoff',
        'Conserving soil moisture and suppressing weeds',
        'Compacting plant roots',
        'Attracting leaf-eating pests',
      ],
      ans: 1,
      exp: 'Mulch reduces soil water evaporation, smothers weeds, and decomposes into humus.',
    },
    {
      tags: ['nutrition', 'food', 'diet', 'protein'],
      q: 'Severe deficiency of proteins in a young child’s diet leads to which nutritional disorder?',
      options: ['Scurvy', 'Kwashiorkor', 'Rickets', 'Goitre'],
      ans: 1,
      exp: 'Kwashiorkor results from inadequate protein intake; scurvy is Vitamin C deficiency and rickets is Vitamin D/Calcium deficiency.',
    },
    {
      tags: ['livestock', 'dairy', 'animal', 'tree', 'agroforestry'],
      q: 'Growing useful trees together with food crops and/or livestock on the same farm is called:',
      options: ['Monocropping', 'Agroforestry', 'Overgrazing', 'Bush fallowing'],
      ans: 1,
      exp: 'Agroforestry combines trees with crops or pasture to improve soil fertility, shade, and farm income.',
    },
  ],
  social_humanities: [
    {
      tags: ['map', 'compass', 'environment', 'equator', 'latitude'],
      q: 'Which major line of latitude (0°) passes directly through central and western Kenya?',
      options: ['Tropic of Cancer', 'The Equator', 'Tropic of Capricorn', 'Greenwich Meridian'],
      ans: 1,
      exp: 'The Equator (0° latitude) crosses Kenya through counties including Meru, Laikipia, Baringo, and Kisumu.',
    },
    {
      tags: ['constitution', 'governance', 'county', 'government', 'political'],
      q: 'How many County Governments are established under Kenya’s 2010 devolved Constitution?',
      options: ['42', '47', '52', '290'],
      ans: 1,
      exp: 'The First Schedule of the Constitution of Kenya (2010) establishes 47 Counties.',
    },
    {
      tags: ['eac', 'trade', 'economic', 'business', 'sacco'],
      q: 'What is the main advantage of regional economic blocs such as the East African Community (EAC)?',
      options: [
        'Increasing border tariffs between neighbours',
        'Expanding market size and easing movement of goods and people',
        'Stopping cross-border transport networks',
        'Eliminating local agriculture',
      ],
      ans: 1,
      exp: 'Regional integration reduces trade barriers and expands markets for member countries.',
    },
  ],
  cre: [
    {
      tags: ['creation', 'bible', 'genesis'],
      q: 'According to Genesis Chapter 1, how do Christians best show stewardship over God’s creation?',
      options: [
        'Polluting rivers and cutting down forests',
        'Conserving trees, water, soil, and caring for animals responsibly',
        'Ignoring environmental clean-up activities',
        'Wasting food and natural resources',
      ],
      ans: 1,
      exp: 'God placed human beings in charge of creation to care for, cultivate, and protect the environment.',
    },
    {
      tags: ['jesus', 'parable', 'miracle', 'ministry'],
      q: 'In the Parable of the Good Samaritan (Luke 10), what key Christian value did Jesus teach?',
      options: [
        'Helping only people from one’s own community',
        'Showing practical mercy and compassion to anyone in need',
        'Passing by injured travellers quickly',
        'Seeking praise before helping others',
      ],
      ans: 1,
      exp: 'Jesus taught that a true neighbour shows active compassion to every person in need.',
    },
    {
      tags: ['church', 'holy spirit', 'pentecost', 'living'],
      q: 'Which of the following is listed in Galatians 5:22–23 as a Fruit of the Holy Spirit?',
      options: ['Envy', 'Self-control', 'Arrogance', 'Revenge'],
      ans: 1,
      exp: 'The fruit of the Holy Spirit includes love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.',
    },
  ],
  ire: [
    {
      tags: ['quran', 'hadith', 'surah', 'revelation'],
      q: 'Through which Angel did Allah (S.W.T.) reveal the Holy Qur’an to Prophet Muhammad (P.B.U.H.)?',
      options: ['Angel Mikail', 'Angel Jibril (A.S.)', 'Angel Israfil', 'Angel Malik'],
      ans: 1,
      exp: 'Angel Jibril (A.S.) conveyed the revelations of the Holy Qur’an to Prophet Muhammad (P.B.U.H.) over 23 years.',
    },
    {
      tags: ['iman', 'ibadah', 'swalah', 'zakah', 'pillar'],
      q: 'Which Pillar of Islam requires a Muslim who meets the Nisab threshold to give obligatory charity to the needy?',
      options: ['Swawm', 'Zakah', 'Hajj', 'Taharah'],
      ans: 1,
      exp: 'Zakah purifies a believer’s wealth and uplifts the poor and vulnerable in society.',
    },
    {
      tags: ['akhlaq', 'moral', 'muamalat', 'sidq'],
      q: 'In Islamic Akhlaq (morals), the virtue of "Sidq" refers to:',
      options: ['Extravagance', 'Truthfulness and honesty', 'Backbiting', 'Impatience'],
      ans: 1,
      exp: 'Sidq means truthfulness in speech, intentions, and actions.',
    },
  ],
  creative: [
    {
      tags: ['draw', 'colour', 'paint', 'creating'],
      q: 'Which set below contains ONLY the three Primary Colours in Visual Arts?',
      options: [
        'Green, Orange, Purple',
        'Red, Yellow, Blue',
        'Black, White, Grey',
        'Orange, Yellow, Green',
      ],
      ans: 1,
      exp: 'Red, Yellow, and Blue are primary pigment colours that cannot be mixed from other colours.',
    },
    {
      tags: ['athletic', 'perform', 'sport', 'track', 'game'],
      q: 'One complete lap in the innermost lane of a standard outdoor athletics track measures:',
      options: ['100 metres', '200 metres', '400 metres', '800 metres'],
      ans: 2,
      exp: 'A standard outdoor running track measures 400 metres per lap.',
    },
    {
      tags: ['appreciation', 'sportsmanship', 'exhibition', 'first aid'],
      q: 'In Sports First Aid for sprains and strains, what does the "R.I.C.E." procedure stand for?',
      options: [
        'Run, Inhale, Climb, Exercise',
        'Rest, Ice, Compression, Elevation',
        'Rotate, Inspect, Clean, Extend',
        'Relax, Ignore, Cover, Eat',
      ],
      ans: 1,
      exp: 'R.I.C.E. stands for Rest, Ice, Compression, and Elevation to reduce swelling and tissue injury.',
    },
  ],
};

function resolveBankCategory(subject: string): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('math')) return 'math';
  if (s.includes('kiswahili')) return 'kiswahili';
  if (s.includes('english') || s === 'language activities') return 'english';
  if (
    s.includes('science') ||
    s.includes('biology') ||
    s.includes('chemistry') ||
    s.includes('physics')
  ) {
    return 'science';
  }
  if (s.includes('pre-tech') || s.includes('computer')) return 'pretech_ict';
  if (s.includes('agric') || s.includes('environment')) return 'agriculture';
  if (s.includes('cre') || s.includes('christian')) return 'cre';
  if (s.includes('ire') || s.includes('islamic')) return 'ire';
  if (s.includes('creative') || s.includes('sport')) return 'creative';
  return 'social_humanities';
}

// Multi-angle dynamic KICD Sub-strand question builder (Angles 0..7) so every strand & sub-strand has rich non-repeating questions
function buildDynamicSubStrandAngle(params: {
  gradeLabel: string;
  subject: string;
  unit: OrderedSubStrandUnit;
  angle: number;
  seed: number;
}): RawQuizItem | null {
  const { gradeLabel, subject, unit, angle, seed } = params;
  const isKis = subject.toLowerCase().includes('kiswahili');
  const concepts = splitCleanItems(unit.substrand);
  const mainConcept = concepts[0] || unit.substrand;

  const angleSlot = ((angle % 9) + 9) % 9;

  // ANGLE 0:Strand -> Sub-strand identification
  if (angleSlot === 0) {
    const dist = seededPickThree(unit.otherSubstrands, seed + 11, unit.substrand);
    if (!dist) return null;
    const packed = shuffleWithAnswer(unit.substrand, dist);
    if (isKis) {
      return {
        q: `Katika ${gradeLabel} ${subject}, ni mada ndogo (sub-strand) ipi iliyo chini ya mada kuu "${unit.strand}"?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `"${unit.substrand}" ni mada ndogo rasmi ya KICD chini ya mada kuu "${unit.strand}" katika ${gradeLabel} ${subject}.`,
      };
    }
    return {
      q: `In ${gradeLabel} ${subject}, which sub-strand is taught under the KICD Strand "${unit.strand}"?`,
      options: packed.options,
      ans: packed.ansIndex,
      exp: `Under the KICD rationalized curriculum for ${gradeLabel} ${subject}, "${unit.substrand}" belongs to Strand "${unit.strand}".`,
    };
  }

  // ANGLE 1: Sub-strand -> Strand classification
  if (angleSlot === 1 && unit.otherStrands.length >= 2) {
    const fallbackStrands = [
      ...unit.otherStrands,
      '9.0 CAPSTONE ASSESSMENT & SYNTHESIS',
      '8.0 EXTENDED PRACTICAL APPLICATION',
    ];
    const dist = seededPickThree(fallbackStrands, seed + 23, unit.strand);
    if (!dist) return null;
    const packed = shuffleWithAnswer(unit.strand, dist);
    if (isKis) {
      return {
        q: `Mada ndogo "${unit.substrand}" hufundishwa chini ya mada kuu (Strand) ipi katika ${gradeLabel} ${subject}?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `Mada ndogo "${unit.substrand}" iko chini ya mada kuu "${unit.strand}".`,
      };
    }
    return {
      q: `The sub-strand "${unit.substrand}" in ${gradeLabel} ${subject} falls under which official KICD Strand?`,
      options: packed.options,
      ans: packed.ansIndex,
      exp: `"${unit.substrand}" is classified under Strand "${unit.strand}" in ${gradeLabel} ${subject}.`,
    };
  }

  // ANGLE 2: Practical Learning Resource / Lab Apparatus selection for this Sub-strand
  if (angleSlot === 2 && unit.resourcesList.length > 0) {
    const chosenRes = unit.resourcesList[seed % unit.resourcesList.length];
    const distractorPool = [
      ...unit.otherResources,
      'Musical staff manuscript & tuning fork',
      '1:50,000 Survey topographical sheet',
      'Volumetric titration burette & pipette',
      'Three-column accounting cashbook ledger',
    ];
    const dist = seededPickThree(distractorPool, seed + 37, chosenRes);
    if (!dist) return null;
    const packed = shuffleWithAnswer(chosenRes, dist);
    if (isKis) {
      return {
        q: `Ni nyenzo au kifaa kipi cha kujifunzia kinachofaa zaidi wakati wa kusoma "${mainConcept}" (${unit.strand}) katika ${gradeLabel} ${subject}?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `"${chosenRes}" ni nyenzo rasmi inayopendekezwa na KICD kufundishia "${unit.substrand}".`,
      };
    }
    return {
      q: `Which learning resource or apparatus is MOST appropriate for a practical lesson on "${mainConcept}" (${unit.strand}) in ${gradeLabel} ${subject}?`,
      options: packed.options,
      ans: packed.ansIndex,
      exp: `KICD recommends "${chosenRes}" for hands-on learning in "${unit.substrand}" (${unit.strand}).`,
    };
  }

  // ANGLE 3: Key Inquiry Question -> Sub-strand Application
  if (angleSlot === 3 && unit.kiq) {
    const dist = seededPickThree(unit.otherSubstrands, seed + 53, unit.substrand);
    if (!dist) return null;
    const packed = shuffleWithAnswer(unit.substrand, dist);
    if (isKis) {
      return {
        q: `Swali dadisi (Key Inquiry Question): "${unit.kiq}" linachunguzwa moja kwa moja katika mada ndogo ipi ya ${gradeLabel} ${subject}?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `Swali hilo dadisi linaongoza ujifunzaji wa mada ndogo "${unit.substrand}" (${unit.strand}).`,
      };
    }
    return {
      q: `Which ${gradeLabel} ${subject} sub-strand directly investigates the KICD Key Inquiry Question: "${unit.kiq}"?`,
      options: packed.options,
      ans: packed.ansIndex,
      exp: `That Key Inquiry Question guides learner inquiry in "${unit.substrand}" under Strand "${unit.strand}".`,
    };
  }

  // ANGLE 4: "ALL EXCEPT" Higher-Order Strand Scope Question (when strand has >= 3 sub-strands)
  if (angleSlot === 4 && unit.siblingSubstrands.length >= 2 && unit.otherSubstrands.length >= 1) {
    const intruder = unit.otherSubstrands[seed % unit.otherSubstrands.length];
    const validThree: string[] = [
      unit.substrand,
      unit.siblingSubstrands[seed % unit.siblingSubstrands.length],
      unit.siblingSubstrands[(seed + 1) % unit.siblingSubstrands.length],
    ];
    if (new Set(validThree).size === 3) {
      const packed = shuffleWithAnswer(intruder, validThree);
      if (isKis) {
        return {
          q: `Mada ndogo zifuatazo ZOTE ziko chini ya mada kuu "${unit.strand}" (${gradeLabel} ${subject}) ISIPOKUWA:`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${intruder}" HAIKO chini ya "${unit.strand}" — iko katika mada kuu tofauti ya ${gradeLabel} ${subject}.`,
        };
      }
      return {
        q: `All of the following sub-strands belong to "${unit.strand}" in ${gradeLabel} ${subject} EXCEPT:`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `"${intruder}" belongs to a different strand, whereas the other three are all part of "${unit.strand}".`,
      };
    }
  }

  // ANGLE 5: Paired Concept Mastery within the Sub-strand
  if (angleSlot === 5 && concepts.length >= 2) {
    const firstC = concepts[0];
    const partnerC = concepts[1 + (seed % (concepts.length - 1))];
    const otherConcepts = unit.otherSubstrands
      .flatMap((os) => splitCleanItems(os))
      .filter((c) => !unit.substrand.toLowerCase().includes(c.toLowerCase()));
    const dist = seededPickThree(otherConcepts, seed + 71, partnerC);
    if (dist) {
      const packed = shuffleWithAnswer(partnerC, dist);
      if (isKis) {
        return {
          q: `Katika mada ndogo ya ${gradeLabel} ${subject} chini ya "${unit.strand}", dhana ya "${firstC}" inafundishwa pamoja na dhana ipi?`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `Mada ndogo kamili ni "${unit.substrand}", inayounganisha "${firstC}" na "${partnerC}".`,
        };
      }
      return {
        q: `In ${gradeLabel} ${subject} (${unit.strand}), "${firstC}" is studied together in the same KICD sub-strand with:`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `The KICD sub-strand "${unit.substrand}" pairs "${firstC}" directly with "${partnerC}".`,
      };
    }
  }

  // ANGLE 6: Reverse Resource -> Sub-strand Practical Identification
  if (angleSlot === 6 && unit.resourcesList.length > 0) {
    const resItem = unit.resourcesList[(seed + 1) % unit.resourcesList.length];
    const dist = seededPickThree(unit.otherSubstrands, seed + 89, unit.substrand);
    if (dist) {
      const packed = shuffleWithAnswer(unit.substrand, dist);
      if (isKis) {
        return {
          q: `Katika somo la ${gradeLabel} ${subject}, vifaa kama "${resItem}" hutumiwa hasa kufundishia mada ndogo ipi?`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${resItem}" hutumiwa kwa vitendo katika mada ndogo "${unit.substrand}" (${unit.strand}).`,
        };
      }
      return {
        q: `During ${gradeLabel} ${subject} practical activities, "${resItem}" is primarily used when learning which sub-strand?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `"${resItem}" is a key teaching & practical aid for "${unit.substrand}" under "${unit.strand}".`,
      };
    }
  }

  // ANGLE 7: Sequential Position within the Official KICD Strand
  if (angleSlot === 7) {
    const pool = [...unit.siblingSubstrands, ...unit.otherSubstrands];
    const dist = seededPickThree(pool, seed + 103, unit.substrand);
    if (dist) {
      const packed = shuffleWithAnswer(unit.substrand, dist);
      if (isKis) {
        return {
          q: `Katika mpangilio rasmi wa KICD wa ${gradeLabel} ${subject} chini ya "${unit.strand}", ni ipi mada ndogo ya ${unit.subIndexInStrand + 1} kati ya ${unit.totalSubsInStrand}?`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${unit.substrand}" ni mada ndogo ya ${unit.subIndexInStrand + 1}/${unit.totalSubsInStrand} chini ya "${unit.strand}".`,
        };
      }
      return {
        q: `Following the sequential KICD syllabus order for ${gradeLabel} ${subject} under "${unit.strand}", which topic is Sub-strand ${unit.subIndexInStrand + 1} of ${unit.totalSubsInStrand}?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `In KICD sequential order under "${unit.strand}", Sub-strand ${unit.subIndexInStrand + 1} of ${unit.totalSubsInStrand} is "${unit.substrand}".`,
      };
    }
  }

  // ANGLE 8: Curriculum Strand & Sub-strand Competency Focus
  if (angleSlot === 8) {
    const correctFocus = `${unit.strand} (Strand ${unit.strandIndex + 1}/${unit.totalStrands})`;
    const otherFocuses = [
      ...unit.otherStrands.map((os) => `${os} (Different Strand)`),
      '9.0 CAPSTONE ASSESSMENT & SYNTHESIS (Different Strand)',
      '8.0 EXTENDED PRACTICAL APPLICATION (Different Strand)',
    ];
    const dist = seededPickThree(otherFocuses, seed + 127, correctFocus);
    if (dist) {
      const packed = shuffleWithAnswer(correctFocus, dist);
      if (isKis) {
        return {
          q: `Mwanafunzi wa ${gradeLabel} ${subject} anayesoma "${unit.substrand}" yuko katika mada kuu ipi ya mtaala wa KICD?`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${unit.substrand}" iko katika ${correctFocus}.`,
        };
      }
      return {
        q: `A ${gradeLabel} ${subject} learner revising "${unit.substrand}" is studying which KICD curriculum strand?`,
        options: packed.options,
        ans: packed.ansIndex,
        exp: `"${unit.substrand}" is taught under ${correctFocus}.`,
      };
    }
  }

  return null;
}

/**
 * Generates the next CBC Gaming question by walking STRICTLY SEQUENTIALLY
 * through every Strand (First Strand -> Last Strand) and every Sub-strand,
 * while guaranteeing ZERO question repetition for the learner!
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

  // Step strictly onto the current Sub-strand in First-Strand -> Last-Strand order!
  const unitIdx = startCursor % totalUnits;
  const passNumber = Math.floor(startCursor / totalUnits);
  const activeUnit = units[unitIdx];

  const bankCat = resolveBankCategory(subject);
  let chosenRaw: RawQuizItem | null = null;

  if (bankCat === 'math') {
    // Alternate worked strand-specific calculations & KICD sub-strand mastery (every 4th pass), never repeating!
    for (let attempt = 0; attempt < 28; attempt++) {
      const seed = passNumber * 29 + unitIdx * 7 + attempt * 53 + 1;
      const cand =
        (passNumber + attempt) % 4 === 3
          ? buildDynamicSubStrandAngle({
              gradeLabel,
              subject,
              unit: activeUnit,
              angle: passNumber + attempt,
              seed,
            }) || generateStrandMathQuestion(gradeKey, activeUnit, seed)
          : generateStrandMathQuestion(gradeKey, activeUnit, seed);

      if (!seenSet.has(hashPromptKey(cand.q))) {
        chosenRaw = cand;
        break;
      }
    }
  } else {
    // 1) First check if there is an UNSEEN curated question matching this exact Strand/Sub-strand's topic tags!
    const curatedPool = CURATED_SUBJECT_BANKS[bankCat] || [];
    const hay = `${activeUnit.strand} ${activeUnit.substrand}`.toLowerCase();
    const matchingCurated = curatedPool.find(
      (item) =>
        !seenSet.has(hashPromptKey(item.q)) &&
        (item.tags || []).some((t) => hay.includes(t.toLowerCase()))
    );

    if (matchingCurated && passNumber === 0) {
      chosenRaw = matchingCurated;
    }

    // 2) Walk through all 9 dynamic KICD Sub-strand question angles for this exact Sub-strand
    if (!chosenRaw) {
      for (let offset = 0; offset < 18; offset++) {
        const angleToTry = passNumber + offset;
        const seed = passNumber * 31 + unitIdx * 17 + offset * 41 + 3;
        const cand = buildDynamicSubStrandAngle({
          gradeLabel,
          subject,
          unit: activeUnit,
          angle: angleToTry,
          seed,
        });
        if (cand && !seenSet.has(hashPromptKey(cand.q))) {
          chosenRaw = cand;
          break;
        }
      }
    }

    // 3) Any remaining unseen curated item in this subject
    if (!chosenRaw) {
      const anyUnseenCurated = curatedPool.find(
        (item) => !seenSet.has(hashPromptKey(item.q))
      );
      if (anyUnseenCurated) {
        chosenRaw = anyUnseenCurated;
      }
    }
  }

  // Final guaranteed-unique numbered mastery fallback tied to activeUnit's exact Sub-strand index
  if (!chosenRaw) {
    const dist =
      seededPickThree(
        [...activeUnit.siblingSubstrands, ...activeUnit.otherSubstrands],
        startCursor + 99,
        activeUnit.substrand
      ) || ['General Review A', 'General Review B', 'General Review C'];
    const packed = shuffleWithAnswer(activeUnit.substrand, dist);
    const isKis = subject.toLowerCase().includes('kiswahili');
    chosenRaw = isKis
      ? {
          q: `[Marudio #${passNumber + 1} • Mada Ndogo ${activeUnit.globalSubIndex + 1}/${activeUnit.totalGlobalSubs}] Chini ya "${activeUnit.strand}" (${gradeLabel} ${subject}), tambua mada ndogo ya ${activeUnit.subIndexInStrand + 1} kati ya ${activeUnit.totalSubsInStrand}:`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${activeUnit.substrand}" ni mada ndogo ya ${activeUnit.subIndexInStrand + 1}/${activeUnit.totalSubsInStrand} chini ya "${activeUnit.strand}".`,
        }
      : {
          q: `[Mastery Round #${passNumber + 1} • Sub-strand ${activeUnit.globalSubIndex + 1}/${activeUnit.totalGlobalSubs}] Under "${activeUnit.strand}" in ${gradeLabel} ${subject}, identify Sub-strand ${activeUnit.subIndexInStrand + 1} of ${activeUnit.totalSubsInStrand}:`,
          options: packed.options,
          ans: packed.ansIndex,
          exp: `"${activeUnit.substrand}" is Sub-strand ${activeUnit.subIndexInStrand + 1}/${activeUnit.totalSubsInStrand} under "${activeUnit.strand}" in ${gradeLabel} ${subject}.`,
        };
  }

  // Advance sequential cursor (+1 -> next Sub-strand, moving First Strand -> Last Strand!) & record question key
  const qKey = hashPromptKey(chosenRaw.q);
  const nextCursor = startCursor + 1;

  if (session) {
    session.subjectCursors = session.subjectCursors || {};
    session.subjectCursors[cursorKey] = nextCursor;
    session.usedQuestionKeys = session.usedQuestionKeys || [];
    session.usedQuestionKeys.push(qKey);
    if (session.usedQuestionKeys.length > 500) {
      session.usedQuestionKeys = session.usedQuestionKeys.slice(-500);
    }
  }

  if (player) {
    player.curriculumCursor = player.curriculumCursor || {};
    player.curriculumCursor[cursorKey] = nextCursor;
    player.seenQuestionKeys = player.seenQuestionKeys || [];
    if (!player.seenQuestionKeys.includes(qKey)) {
      player.seenQuestionKeys.push(qKey);
      if (player.seenQuestionKeys.length > 1800) {
        player.seenQuestionKeys = player.seenQuestionKeys.slice(-1800);
      }
    }
  }

  // Shuffle option positions so answer letter varies randomly
  const correctText = chosenRaw.options[chosenRaw.ans];
  const others = chosenRaw.options.filter((_, idx) => idx !== chosenRaw!.ans);
  const shuffled = shuffleWithAnswer(correctText, others);

  const nonce = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const token = signQuestionToken({
    nonce,
    sessionId,
    correctIndex: shuffled.ansIndex,
    explanation: chosenRaw.exp,
  });

  const publicQ: PublicGameQuestion = {
    nonce,
    subject,
    gradeLabel,
    strand: activeUnit.strand,
    substrand: activeUnit.substrand,
    strandProgress: `Strand ${activeUnit.strandIndex + 1}/${activeUnit.totalStrands} • Sub-strand ${activeUnit.globalSubIndex + 1}/${activeUnit.totalGlobalSubs}`,
    prompt: chosenRaw.q,
    options: shuffled.options,
    token,
  };

  if (session) {
    session.currentQuestion = publicQ;
  }

  return publicQ;
}
