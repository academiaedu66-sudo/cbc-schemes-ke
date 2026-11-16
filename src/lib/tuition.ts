import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const TUITION_STORAGE_PATH = '_system/tuition-registrations.json';

export const LEARNER_FEE_KES = 1000;
export const TEACHER_FEE_KES = 500;
export const COORDINATOR_WHATSAPP_INTL = '254705759072';
export const COORDINATOR_WHATSAPP_LOCAL = '0705759072';
export const COORDINATOR_MPESA_LOCAL = '0728595160';

export type TuitionRole = 'LEARNER' | 'TEACHER';

export type GradeBandKey =
  | 'PRE_PRIMARY'
  | 'LOWER_PRIMARY'
  | 'UPPER_PRIMARY'
  | 'JUNIOR_SCHOOL'
  | 'SENIOR_SCHOOL';

export const GRADE_BAND_LABELS: Record<GradeBandKey, string> = {
  PRE_PRIMARY: 'Pre-Primary (PP1 & PP2)',
  LOWER_PRIMARY: 'Lower Primary (Grades 1–3)',
  UPPER_PRIMARY: 'Upper Primary (Grades 4–6 / KPSEA)',
  JUNIOR_SCHOOL: 'Junior School (Grades 7–9 / KJSEA)',
  SENIOR_SCHOOL: 'Senior School (Grades 10–12)',
};

export const SUBJECTS_BY_BAND: Record<GradeBandKey, string[]> = {
  PRE_PRIMARY: [
    'Language Activities',
    'Mathematical Activities',
    'Environmental Activities',
    'Creative Activities',
    'Christian Religious Education (CRE)',
    'Islamic Religious Education (IRE)',
  ],
  LOWER_PRIMARY: [
    'Mathematics',
    'English',
    'Kiswahili',
    'Environmental Activities',
    'Creative Activities',
    'Christian Religious Education (CRE)',
    'Islamic Religious Education (IRE)',
  ],
  UPPER_PRIMARY: [
    'Mathematics',
    'English',
    'Kiswahili',
    'Science & Technology',
    'Agriculture & Nutrition',
    'Social Studies',
    'Creative Arts',
    'Christian Religious Education (CRE)',
    'Islamic Religious Education (IRE)',
  ],
  JUNIOR_SCHOOL: [
    'Mathematics',
    'English',
    'Kiswahili',
    'Integrated Science',
    'Pre-Technical Studies',
    'Agriculture & Nutrition',
    'Social Studies',
    'Creative Arts & Sports',
    'Christian Religious Education (CRE)',
    'Islamic Religious Education (IRE)',
  ],
  SENIOR_SCHOOL: [
    'Core Mathematics',
    'Essential Mathematics',
    'English',
    'Kiswahili',
    'Biology',
    'Chemistry',
    'Physics',
    'Computer Studies',
    'General Science',
    'Agriculture',
    'History & Citizenship',
    'Geography',
    'Business Studies',
    'Literature in English',
    'Fasihi ya Kiswahili',
    'Christian Religious Education (CRE)',
    'Islamic Religious Education (IRE)',
  ],
};

export function gradeToBand(gradeKey: string): GradeBandKey {
  const upper = String(gradeKey || '').toUpperCase().trim();
  if (upper === 'PP1' || upper === 'PP2') return 'PRE_PRIMARY';
  const num = Number(upper);
  if (num >= 1 && num <= 3) return 'LOWER_PRIMARY';
  if (num >= 4 && num <= 6) return 'UPPER_PRIMARY';
  if (num >= 7 && num <= 9) return 'JUNIOR_SCHOOL';
  return 'SENIOR_SCHOOL';
}

export function getAllUniqueCbcSubjects(): string[] {
  const set = new Set<string>();
  for (const list of Object.values(SUBJECTS_BY_BAND)) {
    for (const s of list) set.add(s);
  }
  return Array.from(set);
}

export interface TuitionRegistration {
  id: string;
  referenceCode: string; // e.g. STU-4821 or TCH-9104
  role: TuitionRole;
  fullName: string;
  phone: string;
  county: string;
  // For Learner: specific grade ('PP1', 'PP2', '1'..'12'); For Teacher: primary band
  learnerGrade?: string;
  gradeBands: GradeBandKey[];
  subjects: string[];
  mode: 'Home Tuition' | 'Online Tuition' | 'Home or Online';
  schedule:
    | 'School Holidays (April / Aug / Dec)'
    | 'Evenings & Weekends'
    | 'Any Convenient Time (Personal Teacher)';
  tscOrQualification?: string;
  notes?: string;
  feeKes: number;
  checkoutRequestId?: string;
  mpesaReceipt?: string;
  paymentStatus: 'PENDING' | 'COMPLETED';
  createdAt: string;
}

export interface PublicTuitionMatch {
  referenceCode: string;
  role: TuitionRole;
  maskedName: string;
  county: string;
  gradeSummary: string;
  matchedSubjects: string[];
  allSubjectsCount: number;
  mode: string;
  schedule: string;
  qualification?: string;
  score: number;
}

// Starter pool of verified CBC Personal & Holiday Teachers across Kenya
// (Phone numbers are kept private — all connections go strictly through 0705759072)
const SEEDED_VERIFIED_TEACHERS: TuitionRegistration[] = [
  {
    id: 'seed-tch-1',
    referenceCode: 'TCH-104',
    role: 'TEACHER',
    fullName: 'Tr. Kelvin Mwangi',
    phone: 'COORDINATOR_MANAGED',
    county: 'Nairobi / Kiambu',
    gradeBands: ['JUNIOR_SCHOOL', 'SENIOR_SCHOOL'],
    subjects: [
      'Mathematics',
      'Core Mathematics',
      'Integrated Science',
      'Physics',
      'Chemistry',
      'Pre-Technical Studies',
    ],
    mode: 'Home or Online',
    schedule: 'Any Convenient Time (Personal Teacher)',
    tscOrQualification: 'TSC Registered • B.Ed (Science)',
    feeKes: TEACHER_FEE_KES,
    paymentStatus: 'COMPLETED',
    createdAt: '2026-01-10T08:00:00.000Z',
  },
  {
    id: 'seed-tch-2',
    referenceCode: 'TCH-112',
    role: 'TEACHER',
    fullName: 'Tr. Faith Chebet',
    phone: 'COORDINATOR_MANAGED',
    county: 'Nakuru / Eldoret / Online',
    gradeBands: ['UPPER_PRIMARY', 'JUNIOR_SCHOOL'],
    subjects: [
      'English',
      'Kiswahili',
      'Social Studies',
      'Christian Religious Education (CRE)',
      'Creative Arts & Sports',
    ],
    mode: 'Home or Online',
    schedule: 'School Holidays (April / Aug / Dec)',
    tscOrQualification: 'TSC Registered • B.Ed (Arts) • KJSEA Examiner',
    feeKes: TEACHER_FEE_KES,
    paymentStatus: 'COMPLETED',
    createdAt: '2026-01-11T09:00:00.000Z',
  },
  {
    id: 'seed-tch-3',
    referenceCode: 'TCH-119',
    role: 'TEACHER',
    fullName: 'Tr. Mercy Wanjiku',
    phone: 'COORDINATOR_MANAGED',
    county: 'Nairobi / Machakos / Kajiado',
    gradeBands: ['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY'],
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Creative Activities',
      'Mathematics',
      'English',
      'Kiswahili',
      'Science & Technology',
    ],
    mode: 'Home or Online',
    schedule: 'Any Convenient Time (Personal Teacher)',
    tscOrQualification: 'ECDE & Primary CBC Specialist (TSC)',
    feeKes: TEACHER_FEE_KES,
    paymentStatus: 'COMPLETED',
    createdAt: '2026-01-12T10:00:00.000Z',
  },
  {
    id: 'seed-tch-4',
    referenceCode: 'TCH-127',
    role: 'TEACHER',
    fullName: 'Tr. Brian Otieno',
    phone: 'COORDINATOR_MANAGED',
    county: 'Kisumu / Mombasa / Online Nationwide',
    gradeBands: ['JUNIOR_SCHOOL', 'SENIOR_SCHOOL'],
    subjects: [
      'Biology',
      'Chemistry',
      'Integrated Science',
      'Agriculture',
      'Agriculture & Nutrition',
      'General Science',
      'Computer Studies',
    ],
    mode: 'Home or Online',
    schedule: 'Evenings & Weekends',
    tscOrQualification: 'TSC Registered • STEM Pathway Specialist',
    feeKes: TEACHER_FEE_KES,
    paymentStatus: 'COMPLETED',
    createdAt: '2026-01-13T11:00:00.000Z',
  },
  {
    id: 'seed-tch-5',
    referenceCode: 'TCH-135',
    role: 'TEACHER',
    fullName: 'Tr. Amina Hassan',
    phone: 'COORDINATOR_MANAGED',
    county: 'Mombasa / Nairobi / Online',
    gradeBands: ['PRE_PRIMARY', 'LOWER_PRIMARY', 'UPPER_PRIMARY', 'JUNIOR_SCHOOL', 'SENIOR_SCHOOL'],
    subjects: [
      'Islamic Religious Education (IRE)',
      'Kiswahili',
      'Fasihi ya Kiswahili',
      'English',
      'Literature in English',
      'History & Citizenship',
      'Geography',
      'Business Studies',
    ],
    mode: 'Home or Online',
    schedule: 'Any Convenient Time (Personal Teacher)',
    tscOrQualification: 'TSC Registered • Languages & Humanities Tutor',
    feeKes: TEACHER_FEE_KES,
    paymentStatus: 'COMPLETED',
    createdAt: '2026-01-14T12:00:00.000Z',
  },
];

let cachedRegistrations: { data: TuitionRegistration[]; expiresAt: number } | null = null;

export async function getStoredTuitionRegistrations(): Promise<TuitionRegistration[]> {
  if (cachedRegistrations && Date.now() < cachedRegistrations.expiresAt) {
    return cachedRegistrations.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(TUITION_STORAGE_PATH);

    if (error || !data) {
      cachedRegistrations = {
        data: [...SEEDED_VERIFIED_TEACHERS],
        expiresAt: Date.now() + 10000,
      };
      return cachedRegistrations.data;
    }

    const parsed = JSON.parse(await data.text()) as TuitionRegistration[];
    const savedIds = new Set(parsed.map((r) => r.id));
    const merged = [
      ...parsed,
      ...SEEDED_VERIFIED_TEACHERS.filter((s) => !savedIds.has(s.id)),
    ];
    cachedRegistrations = { data: merged, expiresAt: Date.now() + 10000 };
    return merged;
  } catch {
    return [...SEEDED_VERIFIED_TEACHERS];
  }
}

export async function saveTuitionRegistration(
  entry: TuitionRegistration
): Promise<TuitionRegistration[]> {
  const existing = await getStoredTuitionRegistrations();
  const withoutSame = existing.filter(
    (r) =>
      r.id !== entry.id &&
      !(entry.checkoutRequestId && r.checkoutRequestId === entry.checkoutRequestId)
  );
  const next = [entry, ...withoutSame];

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(TUITION_STORAGE_PATH, Buffer.from(JSON.stringify(next, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  cachedRegistrations = { data: next, expiresAt: Date.now() + 10000 };
  return next;
}

function normalizeSubjectToken(subj: string): string {
  const s = subj.toLowerCase().trim();
  if (s.includes('math')) return 'mathematics';
  if (s.includes('english') || s === 'language activities') return 'english_lang';
  if (s.includes('kiswahili') || s.includes('fasihi')) return 'kiswahili';
  if (s.includes('cre') || s.includes('christian')) return 'cre';
  if (s.includes('ire') || s.includes('islamic')) return 'ire';
  if (s.includes('agric')) return 'agriculture';
  if (s.includes('science')) return 'science';
  if (s.includes('creative')) return 'creative_arts';
  return s;
}

export function maskDisplayName(fullName: string, role: TuitionRole): string {
  const parts = String(fullName || '')
    .replace(/^tr\.?\s+/i, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return role === 'TEACHER' ? 'Verified Teacher' : 'Registered Learner';
  const first = parts[0];
  const initial = parts.length > 1 ? ` ${parts[1][0].toUpperCase()}.` : '';
  return role === 'TEACHER' ? `Tr. ${first}${initial}` : `${first}${initial}`;
}

export function findSubjectMatches(params: {
  targetRole: TuitionRole; // Role to search FOR ('TEACHER' when learner is booking; 'LEARNER' when teacher registers)
  subjects: string[];
  gradeBands: GradeBandKey[];
  county?: string;
  pool: TuitionRegistration[];
}): PublicTuitionMatch[] {
  const wantedExact = new Set(params.subjects.map((s) => s.toLowerCase().trim()));
  const wantedNorm = new Set(params.subjects.map(normalizeSubjectToken));
  const wantedBands = new Set(params.gradeBands);
  const cleanCounty = (params.county || '').toLowerCase().trim();

  const candidates = params.pool.filter((c) => c.role === params.targetRole);
  const scored: PublicTuitionMatch[] = [];

  for (const cand of candidates) {
    const matchedSubjects = cand.subjects.filter(
      (cs) =>
        wantedExact.has(cs.toLowerCase().trim()) ||
        wantedNorm.has(normalizeSubjectToken(cs))
    );

    if (matchedSubjects.length === 0) continue;

    const bandOverlap = cand.gradeBands.some((b) => wantedBands.has(b));
    let score = matchedSubjects.length * 15;
    if (bandOverlap) score += 25;
    if (
      cleanCounty &&
      cand.county.toLowerCase().includes(cleanCounty)
    ) {
      score += 15;
    }
    if (cand.mode !== 'Home Tuition') {
      score += 5;
    }

    const gradeSummary =
      cand.role === 'LEARNER' && cand.learnerGrade
        ? cand.learnerGrade.startsWith('PP')
          ? cand.learnerGrade
          : `Grade ${cand.learnerGrade}`
        : cand.gradeBands.map((b) => GRADE_BAND_LABELS[b].split(' (')[0]).join(', ');

    scored.push({
      referenceCode: cand.referenceCode,
      role: cand.role,
      maskedName: maskDisplayName(cand.fullName, cand.role),
      county: cand.county,
      gradeSummary,
      matchedSubjects,
      allSubjectsCount: cand.subjects.length,
      mode: cand.mode,
      schedule: cand.schedule,
      qualification: cand.tscOrQualification,
      score,
    });
  }

  return scored.sort((a, b) => b.score - a.score).slice(0, 8);
}
