export type MaterialCategory =
  | 'CBC GRADE UP (50-Page Books)'
  | 'SUPER-LIGHT CBC COMPILATION (50p)'
  | 'SMART CBC ALL SUBJECTS (100p)'
  | 'Schemes of Work'
  | 'Lesson Plans'
  | "Teachers' Notes"
  | 'Revision Papers & Exams'
  | 'Records of Work'
  | 'Holiday Assignments & Designs';

export type MaterialFormat = 'DOCX' | 'PDF';

export type ExamSubFilter =
  | 'ALL'
  | 'OPENER'
  | 'MIDTERM'
  | 'ENDTERM'
  | 'KPSEA'
  | 'KJSEA'
  | 'KEYA'
  | 'SENIOR_TRIAL';

export const ALL_GRADE_KEYS = [
  'PP1',
  'PP2',
  '1',
  '2',
  '3',
  '4',
  '5',
  '6',
  '7',
  '8',
  '9',
  '10',
  '11',
  '12',
] as const;

export interface ParsedMaterialMetadata {
  title: string;
  grade: number;
  gradeKey: string;
  level: string;
  category: MaterialCategory;
  subject: string;
  term: number;
  format: MaterialFormat;
  price: number;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'CBC GRADE UP (50-Page Books)',
  'SUPER-LIGHT CBC COMPILATION (50p)',
  'SMART CBC ALL SUBJECTS (100p)',
  'Schemes of Work',
  'Lesson Plans',
  "Teachers' Notes",
  'Records of Work',
  'Revision Papers & Exams',
  'Holiday Assignments & Designs',
];

export const DEFAULT_PRICES: Record<MaterialCategory, number> = {
  'CBC GRADE UP (50-Page Books)': 500,
  'SUPER-LIGHT CBC COMPILATION (50p)': 750,
  'SMART CBC ALL SUBJECTS (100p)': 1500,
  'Schemes of Work': 50,
  'Lesson Plans': 70,
  "Teachers' Notes": 100,
  'Revision Papers & Exams': 100,
  'Records of Work': 50,
  'Holiday Assignments & Designs': 70,
};

export function formatTermLabel(term?: number | null): string {
  if (term === 0) return 'Terms 1, 2 & 3';
  if (term === 1 || term === 2 || term === 3) return `Term ${term}`;
  return 'Term 1';
}

export function getLevelForGrade(grade: number | string): string {
  const s = String(grade).toUpperCase();
  if (s === 'PP1' || s === '-1') return 'Pre-Primary 1 (PP1)';
  if (s === 'PP2' || s === '0') return 'Pre-Primary 2 (PP2)';
  const g = Number(grade);
  if (g <= 3) return 'Lower Primary';
  if (g <= 6) return 'Upper Primary';
  if (g <= 9) return 'Junior Secondary';
  return 'Senior School';
}

export function getResourceGradeKey(item: {
  grade: number;
  level?: string | null;
  title?: string | null;
  file_path?: string | null;
}): string {
  const lvl = String(item.level || '');
  const title = String(item.title || '');
  const fp = String(item.file_path || '');
  if (/\bPP1\b/i.test(lvl) || /^PP1\b/i.test(title) || /^PP1_/i.test(fp)) {
    return 'PP1';
  }
  if (/\bPP2\b/i.test(lvl) || /^PP2\b/i.test(title) || /^PP2_/i.test(fp)) {
    return 'PP2';
  }
  return String(item.grade);
}

export function getGradeSortRank(gradeKey: string): number {
  const upper = String(gradeKey).toUpperCase();
  if (upper === 'PP1') return -1;
  if (upper === 'PP2') return 0;
  const n = Number(gradeKey);
  return Number.isFinite(n) ? n : 99;
}

export function formatGradeLabel(gradeOrKey: number | string): string {
  const upper = String(gradeOrKey).toUpperCase();
  if (upper === 'PP1' || upper === '-1') return 'PP1';
  if (upper === 'PP2' || upper === '0') return 'PP2';
  return `Grade ${gradeOrKey}`;
}

export function gradeKeyToDbFields(gradeKey: string): { grade: number; level: string } {
  const upper = String(gradeKey).toUpperCase();
  if (upper === 'PP1') return { grade: 1, level: 'Pre-Primary 1 (PP1)' };
  if (upper === 'PP2') return { grade: 2, level: 'Pre-Primary 2 (PP2)' };
  const g = Math.min(12, Math.max(1, parseInt(gradeKey, 10) || 7));
  return { grade: g, level: getLevelForGrade(g) };
}

export function matchesExamSubFilter(
  item: {
    title?: string | null;
    category?: string | null;
    grade: number;
    level?: string | null;
    file_path?: string | null;
  },
  filter: ExamSubFilter
): boolean {
  if (filter === 'ALL') return true;
  if (normalizeCategory(item.category) !== 'Revision Papers & Exams') return false;
  const hay = `${item.title || ''} ${item.file_path || ''}`.toLowerCase();
  const gKey = getResourceGradeKey(item);

  switch (filter) {
    case 'OPENER':
      return hay.includes('opener');
    case 'MIDTERM':
      return hay.includes('mid-term') || hay.includes('mid_term') || hay.includes('midterm');
    case 'ENDTERM':
      return (
        !hay.includes('opener') &&
        !hay.includes('mid-term') &&
        !hay.includes('mid_term') &&
        !hay.includes('past paper') &&
        !hay.includes('past_paper') &&
        !hay.includes('prediction') &&
        !hay.includes('mock set') &&
        !hay.includes('trial set')
      );
    case 'KPSEA':
      return gKey === '6' || hay.includes('kpsea');
    case 'KJSEA':
      return gKey === '9' || hay.includes('kjsea');
    case 'KEYA':
      return gKey === '3' || hay.includes('keya');
    case 'SENIOR_TRIAL':
      return (
        (gKey === '10' || gKey === '11' || gKey === '12') &&
        (hay.includes('trial') || hay.includes('mock') || hay.includes('cbe') || hay.includes('senior'))
      );
    default:
      return true;
  }
}

export function getCbcLessonAllocation(
  grade: number | string,
  subject?: string | null
): {
  lessonsPerWeek: number;
  minutesPerLesson: number;
} {
  const s = String(subject || '').toLowerCase();
  const upperG = String(grade).toUpperCase();

  if (upperG === 'PP1' || upperG === 'PP2' || upperG === '-1' || upperG === '0') {
    let lessonsPerWeek = 5;
    if (s.includes('creative')) lessonsPerWeek = 6;
    else if (s.includes('religious') || s.includes('cre') || s.includes('ire')) lessonsPerWeek = 3;
    return { lessonsPerWeek, minutesPerLesson: 30 };
  }

  const gNum = Number(grade);

  if (gNum <= 3) {
    let lessonsPerWeek = 4;
    if (s.includes('math') || s.includes('english')) lessonsPerWeek = 5;
    else if (s.includes('creative')) lessonsPerWeek = 7;
    else if (s.includes('kiswahili') || s.includes('environmental')) lessonsPerWeek = 4;
    else if (s.includes('religious') || s.includes('cre') || s.includes('ire')) lessonsPerWeek = 3;
    else if (s.includes('indigenous')) lessonsPerWeek = 2;
    return { lessonsPerWeek, minutesPerLesson: 30 };
  }

  if (gNum <= 6) {
    let lessonsPerWeek = 4;
    if (s.includes('math') || s.includes('english')) lessonsPerWeek = 5;
    else if (s.includes('creative')) lessonsPerWeek = 6;
    else if (s.includes('kiswahili') || s.includes('science') || s.includes('agriculture')) lessonsPerWeek = 4;
    else if (s.includes('social') || s.includes('religious') || s.includes('cre') || s.includes('ire')) lessonsPerWeek = 3;
    return { lessonsPerWeek, minutesPerLesson: 35 };
  }

  const isFiveLessonCore =
    s.includes('math') ||
    s.includes('english') ||
    s.includes('integrated science') ||
    s === 'science' ||
    s.includes('biology') ||
    s.includes('chemistry') ||
    s.includes('physics');

  return {
    lessonsPerWeek: isFiveLessonCore ? 5 : 4,
    minutesPerLesson: 40,
  };
}

export function getTermTotalWeeks(term?: number | null): number {
  if (term === 2) return 14;
  if (term === 3) return 9;
  return 13;
}

export function normalizeCategory(raw?: string | null): MaterialCategory {
  if (!raw) return 'Schemes of Work';
  const lower = raw.toLowerCase();
  if (
    lower.includes('smart cbc') ||
    lower.includes('100p') ||
    lower.includes('100-page') ||
    lower.includes('complete books compilation')
  ) {
    return 'SMART CBC ALL SUBJECTS (100p)';
  }
  if (lower.includes('super-light') || lower.includes('made familiar')) {
    return 'SUPER-LIGHT CBC COMPILATION (50p)';
  }
  if (lower.includes('grade up')) {
    return 'CBC GRADE UP (50-Page Books)';
  }
  if (lower.includes('record') && lower.includes('work')) return 'Records of Work';
  if (lower.includes('holiday') || lower.includes('curriculum design') || lower.includes('designs')) {
    return 'Holiday Assignments & Designs';
  }
  if (lower.includes('lesson') && lower.includes('plan')) return 'Lesson Plans';
  if (
    lower.includes('exam') ||
    lower.includes('revision') ||
    lower.includes('mock') ||
    lower.includes('kpsea') ||
    lower.includes('kjsea') ||
    lower.includes('keya') ||
    lower.includes('kcse') ||
    lower.includes('assessment')
  ) {
    return 'Revision Papers & Exams';
  }
  if (lower.includes('note') || lower.includes('booklet')) {
    return "Teachers' Notes";
  }
  return 'Schemes of Work';
}

const KNOWN_SUBJECTS = [
  'Community Service Learning (CSL)',
  'Christian Religious Education (CRE)',
  'Islamic Religious Education (IRE)',
  'Indigenous Language Activities',
  'English Language Activities',
  'Kiswahili Language Activities',
  'Language Activities',
  'Mathematical Activities',
  'Environmental Activities',
  'Agriculture and Nutrition',
  'Agriculture & Nutrition',
  'Creative Arts and Sports',
  'Creative Arts & Sports',
  'Science and Technology',
  'Science & Technology',
  'History and Citizenship',
  'Pre-Technical Studies',
  'Integrated Science',
  'Creative Activities',
  'Core Mathematics',
  'Computer Science',
  'Business Studies',
  'Social Studies',
  'Creative Arts',
  'Mathematics',
  'Kiswahili',
  'English',
  'Biology',
  'Chemistry',
  'Physics',
  'Geography',
  'History',
  'Science',
  'CRE',
  'IRE',
];

export function parseFilenameToMetadata(filename: string): ParsedMaterialMetadata {
  const extMatch = filename.match(/\.([^.]+)$/);
  const ext = (extMatch ? extMatch[1] : 'docx').toLowerCase();
  const format: MaterialFormat = ext === 'pdf' ? 'PDF' : 'DOCX';

  const clean = filename
    .replace(/\.[^.]+$/, '')
    .replace(/www\.[a-z0-9.-]+/gi, '')
    .replace(/teacher\.co_?\.ke_?/gi, '')
    .replace(/schemes\.co\.ke/gi, '')
    .replace(/SCH\d+/gi, '')
    .replace(/202[3-9]/g, '')
    .replace(/[_-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  let grade = 7;
  let gradeKey = '7';
  const ppMatch = clean.match(/\b(pp\s*[12]|pre\s*primary\s*[12])\b/i);
  const gradeMatch = clean.match(/\b(?:grade|g)\s*(\d{1,2})\b/i);
  const formMatch = clean.match(/\bform\s*([1-4])\b/i);
  if (ppMatch) {
    const isPP1 = /1/.test(ppMatch[1]);
    gradeKey = isPP1 ? 'PP1' : 'PP2';
    grade = isPP1 ? 1 : 2;
  } else if (gradeMatch) {
    grade = Math.min(12, Math.max(1, parseInt(gradeMatch[1], 10)));
    gradeKey = String(grade);
  } else if (formMatch) {
    grade = 8 + parseInt(formMatch[1], 10);
    gradeKey = String(grade);
  } else if (/\bkpsea\b/i.test(clean)) {
    grade = 6;
    gradeKey = '6';
  } else if (/\bkjsea\b/i.test(clean)) {
    grade = 9;
    gradeKey = '9';
  } else if (/\bkcse\b/i.test(clean)) {
    grade = 12;
    gradeKey = '12';
  }

  let term = 1;
  if (/\ball\s*terms\b|\bterms\s*1\s*2\s*(?:&|and)?\s*3\b/i.test(clean)) {
    term = 0;
  } else {
    const termMatch = clean.match(/\b(?:term|t)\s*([1-3])\b/i);
    if (termMatch) {
      term = parseInt(termMatch[1], 10);
    }
  }

  let category: MaterialCategory = 'Schemes of Work';
  if (/\brecord\s*of\s*work/i.test(clean)) {
    category = 'Records of Work';
  } else if (/\b(holiday|curriculum\s*design)\b/i.test(clean)) {
    category = 'Holiday Assignments & Designs';
  } else if (/\blesson\s*plan/i.test(clean)) {
    category = 'Lesson Plans';
  } else if (/\b(exam|mock|kpsea|kjsea|keya|kcse|revision|assessment|test|prediction|trial)\b/i.test(clean)) {
    category = 'Revision Papers & Exams';
  } else if (/\b(note|notes|booklet|strand)\b/i.test(clean)) {
    category = "Teachers' Notes";
  }

  let subject = 'General CBC';
  for (const candidate of KNOWN_SUBJECTS) {
    const escaped = candidate.replace(/[()]/g, '\\$&').replace(/\s+(?:&|and)\s+/i, '\\s+(?:&|and)\\s+');
    const pattern = new RegExp(`\\b${escaped}\\b`, 'i');
    if (pattern.test(clean)) {
      subject = candidate;
      break;
    }
  }
  if (subject === 'General CBC' && /\bmath/i.test(clean)) {
    subject = grade <= 3 ? 'Mathematical Activities' : grade >= 10 ? 'Core Mathematics' : 'Mathematics';
  }

  const titleWords = clean
    .split(' ')
    .filter(Boolean)
    .map((w) => {
      const upper = w.toUpperCase();
      if (
        ['PP1', 'PP2', 'ECDE', 'CBC', 'KPSEA', 'KJSEA', 'KEYA', 'KCSE', 'JSS', 'CRE', 'IRE', 'CSL', 'STEM', 'KICD', 'SBA'].includes(
          upper
        )
      ) {
        return upper;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

  let title = titleWords.join(' ');
  const isPP = gradeKey === 'PP1' || gradeKey === 'PP2';
  if (isPP && !title.toUpperCase().includes(gradeKey)) {
    title = `${gradeKey} ${title}`;
  } else if (!isPP && !title.toLowerCase().includes('grade')) {
    title = `Grade ${grade} ${title}`;
  }

  const level = getLevelForGrade(gradeKey);
  const price = DEFAULT_PRICES[category];

  return {
    title,
    grade,
    gradeKey,
    level,
    category,
    subject,
    term,
    format,
    price,
  };
}

const KICD_ORANGE_BOOK_MAP: Record<
  'preprimary' | 'lower' | 'upper' | 'jss' | 'senior',
  Record<string, Array<{ series: string; publisher: string; isKiswahili?: boolean }>>
> = {
  preprimary: {
    'Language Activities': [
      { series: 'KLB Skillgrow Language Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn Language Activities', publisher: 'Longhorn Publishers' },
      { series: 'Oxford Little Explorers Language Activities', publisher: 'Oxford University Press (EA)' },
    ],
    'Mathematical Activities': [
      { series: 'KLB Skillgrow Mathematical Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Little Explorers Mathematical Activities', publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Mathematical Activities', publisher: 'Longhorn Publishers' },
    ],
    'Environmental Activities': [
      { series: 'KLB Skillgrow Environmental Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn Environmental Activities', publisher: 'Longhorn Publishers' },
    ],
    'Creative Activities': [
      { series: 'KLB Skillgrow Creative & Psychomotor Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Hummingbird Creative Activities', publisher: 'Hummingbird Publishers' },
    ],
    'Christian Religious Education (CRE)': [
      { series: 'KLB Skillgrow CRE Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Growing in Christ CRE Activities', publisher: 'Oxford University Press (EA)' },
    ],
    'Islamic Religious Education (IRE)': [
      { series: 'KLB Skillgrow IRE Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Atfaal IRE Activities', publisher: 'Atfaal Publishers' },
    ],
  },
  lower: {
    'Mathematical Activities': [
      { series: 'KLB Visionary Mathematical Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: "Oxford Let's Do Mathematical Activities", publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Mathematical Activities', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Mathematical Activities', publisher: 'Mentor Publishing' },
      { series: 'Spotlight Mathematics Activities', publisher: 'Spotlight Publishers (EA)' },
    ],
    'English Language Activities': [
      { series: 'Oxford New Progressive Primary English Language Activities', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Visionary English Language Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn English Language Activities', publisher: 'Longhorn Publishers' },
      { series: 'Skills in English Language Activities', publisher: 'Moran (EA) Publishers' },
      { series: 'Spotlight English Language Activities', publisher: 'Spotlight Publishers (EA)' },
    ],
    'Kiswahili Language Activities': [
      { series: 'Oxford Kiswahili Dadisi Mazoezi ya Lugha', publisher: 'Oxford University Press (EA)', isKiswahili: true },
      { series: 'KLB Visionary Mazoezi ya Kiswahili', publisher: 'Kenya Literature Bureau (KLB)', isKiswahili: true },
      { series: 'Longhorn Mwanga wa Kiswahili Mazoezi ya Lugha', publisher: 'Longhorn Publishers', isKiswahili: true },
      { series: 'Kurunzi ya Kiswahili Mazoezi ya Lugha', publisher: 'Spotlight Publishers (EA)', isKiswahili: true },
      { series: 'Kielekezi cha Kiswahili Mazoezi ya Lugha', publisher: 'Mentor Publishing', isKiswahili: true },
    ],
    'Indigenous Language Activities': [
      { series: 'KLB Visionary Indigenous Language Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'StoryMoja Know More Indigenous Language Activities', publisher: 'StoryMoja Publishers' },
      { series: 'Moran Indigenous Language Activities', publisher: 'Moran (EA) Publishers' },
    ],
    'Environmental Activities': [
      { series: 'Oxford Our Lives Today Environmental Activities', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Visionary Environmental Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Our World Environmental Activities', publisher: 'Moran (EA) Publishers' },
      { series: 'Mentor Environmental Activities', publisher: 'Mentor Publishing' },
    ],
    'Creative Activities': [
      { series: 'KLB Visionary Creative Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Hummingbird Creative Activities', publisher: 'Hummingbird Publishers' },
      { series: 'Beginning Creative Activities', publisher: 'Moran (EA) Publishers' },
      { series: 'Mentor Creative Activities', publisher: 'Mentor Publishing' },
    ],
    'Christian Religious Education (CRE)': [
      { series: 'KLB Visionary CRE Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Growing in Christ CRE Activities', publisher: 'Oxford University Press (EA)' },
      { series: 'Our Faith Christian Religious Education Activities', publisher: 'Moran (EA) Publishers' },
      { series: 'Mentor CRE Activities', publisher: 'Mentor Publishing' },
    ],
    'Islamic Religious Education (IRE)': [
      { series: 'KLB Visionary Islamic Religious Education Activities', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Atfaal IRE Activities', publisher: 'Atfaal Publishers' },
      { series: 'Spotlight Islamic Religious Education Activities', publisher: 'Spotlight Publishers (EA)' },
    ],
  },
  upper: {
    Mathematics: [
      { series: 'KLB Visionary Mathematics', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: "Oxford Let's Do Mathematics", publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Mathematics', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Mathematics', publisher: 'Mentor Publishing' },
      { series: 'Super Minds Mathematics', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    English: [
      { series: 'Oxford New Progressive Primary English', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Visionary English', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn English', publisher: 'Longhorn Publishers' },
      { series: 'Skills in English', publisher: 'Moran (EA) Publishers' },
      { series: 'SuperMinds English', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    Kiswahili: [
      { series: 'Oxford Kiswahili Dadisi', publisher: 'Oxford University Press (EA)', isKiswahili: true },
      { series: 'Longhorn Mwanga wa Kiswahili', publisher: 'Longhorn Publishers', isKiswahili: true },
      { series: 'KLB Visionary Kiswahili', publisher: 'Kenya Literature Bureau (KLB)', isKiswahili: true },
      { series: 'Kurunzi ya Kiswahili', publisher: 'Spotlight Publishers (EA)', isKiswahili: true },
      { series: 'Kielekezi cha Kiswahili', publisher: 'Mentor Publishing', isKiswahili: true },
    ],
    'Science and Technology': [
      { series: 'KLB Visionary Science and Technology', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Everyday Science and Technology', publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Science and Technology', publisher: 'Longhorn Publishers' },
      { series: 'Spotlight Science and Technology', publisher: 'Spotlight Publishers (EA)' },
      { series: 'Super Minds Science and Technology', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    'Agriculture and Nutrition': [
      { series: 'KLB Visionary Agriculture', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Modern Agriculture', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Agriculture', publisher: 'Mentor Publishing' },
      { series: 'Healthy Planet Agriculture', publisher: 'One Planet Publishing' },
      { series: 'MTP Agriculture', publisher: 'Mountain Top Publishers (MTP)' },
    ],
    'Social Studies': [
      { series: 'Oxford Our Lives Today Social Studies', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Visionary Social Studies', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Our World Social Studies', publisher: 'Moran (EA) Publishers' },
      { series: 'Spotlight Social Studies', publisher: 'Spotlight Publishers (EA)' },
      { series: 'Mentor Social Studies', publisher: 'Mentor Publishing' },
    ],
    'Creative Arts': [
      { series: 'KLB Visionary Creative Arts', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Mentor Creative Arts', publisher: 'Mentor Publishing' },
      { series: 'Spotlight Creative Arts', publisher: 'Spotlight Publishers (EA)' },
      { series: 'Hummingbird Creative Arts', publisher: 'Hummingbird Publishers' },
    ],
    'Christian Religious Education (CRE)': [
      { series: 'KLB Visionary CRE', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Growing in Christ CRE', publisher: 'Oxford University Press (EA)' },
      { series: 'Knowing God CRE', publisher: 'One Planet Publishing' },
      { series: 'Mentor CRE', publisher: 'Mentor Publishing' },
    ],
    'Islamic Religious Education (IRE)': [
      { series: 'KLB Visionary IRE', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford New Beginning IRE', publisher: 'Oxford University Press (EA)' },
      { series: 'Atfaal IRE', publisher: 'Atfaal Publishers' },
    ],
  },
  jss: {
    Mathematics: [
      { series: 'KLB Top Scholar Mathematics', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Active Mathematics', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Mathematics', publisher: 'Mentor Publishing' },
      { series: 'Longhorn Mathematics', publisher: 'Longhorn Publishers' },
      { series: 'Smart Minds Mathematics', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    English: [
      { series: 'Oxford Head Start English', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Top Scholar English', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Skills in English', publisher: 'Moran (EA) Publishers' },
      { series: 'Smart Minds English', publisher: 'East African Educational Publishers (EAEP)' },
      { series: 'Mentor English', publisher: 'Mentor Publishing' },
    ],
    Kiswahili: [
      { series: 'Oxford Kiswahili Fasaha', publisher: 'Oxford University Press (EA)', isKiswahili: true },
      { series: 'KLB Top Scholar Kiswahili', publisher: 'Kenya Literature Bureau (KLB)', isKiswahili: true },
      { series: 'Longhorn Mwanga wa Kiswahili', publisher: 'Longhorn Publishers', isKiswahili: true },
      { series: 'Kielekezi cha Kiswahili', publisher: 'Mentor Publishing', isKiswahili: true },
      { series: 'Kurunzi ya Kiswahili', publisher: 'Spotlight Publishers (EA)', isKiswahili: true },
    ],
    'Integrated Science': [
      { series: 'KLB Top Scholar Integrated Science', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Active Integrated Science', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Integrated Science', publisher: 'Mentor Publishing' },
      { series: 'Spotlight Integrated Science', publisher: 'Spotlight Publishers (EA)' },
      { series: 'MTP Integrated Science', publisher: 'Mountain Top Publishers (MTP)' },
    ],
    'Agriculture and Nutrition': [
      { series: 'KLB Top Scholar Agriculture', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Agriculture Today', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Agriculture', publisher: 'Mentor Publishing' },
      { series: 'Healthy Planet Agriculture', publisher: 'One Planet Publishing' },
      { series: 'MTP Agriculture', publisher: 'Mountain Top Publishers (MTP)' },
    ],
    'Social Studies': [
      { series: 'KLB Top Scholar Social Studies', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Evolving World Social Studies', publisher: 'Oxford University Press (EA)' },
      { series: 'Moran Social Studies', publisher: 'Moran (EA) Publishers' },
      { series: 'Mentor Social Studies', publisher: 'Mentor Publishing' },
      { series: 'Smart Minds Social Studies', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    'Pre-Technical Studies': [
      { series: 'KLB Top Scholar Pre-Technical Studies', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Pre-Technical Studies Today', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Pre-Technical Studies', publisher: 'Mentor Publishing' },
      { series: 'Longhorn Pre-Technical Studies', publisher: 'Longhorn Publishers' },
      { series: 'Spotlight Pre-Technical Studies', publisher: 'Spotlight Publishers (EA)' },
    ],
    'Creative Arts and Sports': [
      { series: 'KLB Top Scholar Creative Arts and Sports', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Hummingbird Creative Arts and Sports', publisher: 'Hummingbird Publishers' },
      { series: 'Mentor Creative Arts and Sports', publisher: 'Mentor Publishing' },
      { series: 'Moran Creative Arts and Sports', publisher: 'Moran (EA) Publishers' },
    ],
    'Christian Religious Education (CRE)': [
      { series: 'KLB Top Scholar CRE', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Alive CRE', publisher: 'Oxford University Press (EA)' },
      { series: 'Knowing God CRE', publisher: 'One Planet Publishing' },
      { series: 'Mentor CRE', publisher: 'Mentor Publishing' },
    ],
    'Islamic Religious Education (IRE)': [
      { series: 'KLB Top Scholar IRE', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Atfaal IRE', publisher: 'Atfaal Publishers' },
    ],
  },
  senior: {
    'Core Mathematics': [
      { series: 'KLB Excelling Core Mathematics', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Mathematics Today', publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Advancing in Core Mathematics', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Core Mathematics', publisher: 'Mentor Publishing' },
    ],
    English: [
      { series: 'KLB Excelling in English', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Head Start English', publisher: 'Oxford University Press (EA)' },
      { series: 'Moran Skills in English', publisher: 'Moran (EA) Publishers' },
      { series: 'Longhorn Advancing in English', publisher: 'Longhorn Publishers' },
    ],
    Kiswahili: [
      { series: 'Oxford Kiswahili Fasaha', publisher: 'Oxford University Press (EA)', isKiswahili: true },
      { series: 'Longhorn Chemchemi za Kiswahili', publisher: 'Longhorn Publishers', isKiswahili: true },
      { series: 'Kielekezi cha Kiswahili', publisher: 'Mentor Publishing', isKiswahili: true },
      { series: 'Moran Kiswahili Chanana', publisher: 'Moran (EA) Publishers', isKiswahili: true },
    ],
    'Community Service Learning (CSL)': [
      { series: 'KLB Excelling Community Service Learning', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Essential Community Service Learning (CSL)', publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Pioneer Community Service Learning', publisher: 'Longhorn Publishers' },
      { series: 'MTP Community Service Learning', publisher: 'Mountain Top Publishers (MTP)' },
    ],
    Biology: [
      { series: 'KLB Excelling Biology', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Biology Today', publisher: 'Oxford University Press (EA)' },
      { series: 'Mentor Biology', publisher: 'Mentor Publishing' },
      { series: 'Longhorn Advancing in Biology', publisher: 'Longhorn Publishers' },
    ],
    Chemistry: [
      { series: 'Oxford Chemistry Today', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Excelling Chemistry', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn Advancing in Chemistry', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Chemistry', publisher: 'Mentor Publishing' },
    ],
    Physics: [
      { series: 'KLB Excelling Physics', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Longhorn Advancing in Physics', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Physics', publisher: 'Mentor Publishing' },
      { series: 'Spotlight Physics', publisher: 'Spotlight Publishers (EA)' },
    ],
    'Computer Science': [
      { series: 'KLB Excelling Computer Studies', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Active Computer Studies', publisher: 'Oxford University Press (EA)' },
      { series: 'Longhorn Advancing in Computer Studies', publisher: 'Longhorn Publishers' },
      { series: 'Mentor Computer Studies', publisher: 'Mentor Publishing' },
    ],
    'History and Citizenship': [
      { series: 'KLB Excelling History and Citizenship', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Oxford Evolving World History and Citizenship', publisher: 'Oxford University Press (EA)' },
      { series: 'Moran History and Citizenship', publisher: 'Moran (EA) Publishers' },
      { series: 'Mentor History and Citizenship', publisher: 'Mentor Publishing' },
    ],
    Geography: [
      { series: 'Oxford Active Geography', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Excelling Geography', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Mentor Geography', publisher: 'Mentor Publishing' },
      { series: 'Moran Geography', publisher: 'Moran (EA) Publishers' },
    ],
    'Business Studies': [
      { series: 'Oxford Active Business Studies', publisher: 'Oxford University Press (EA)' },
      { series: 'KLB Excelling Business Studies', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Mentor Business Studies', publisher: 'Mentor Publishing' },
      { series: 'Smart Minds Business Studies', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    'Christian Religious Education (CRE)': [
      { series: 'Hummingbird CRE', publisher: 'Hummingbird Publishers' },
      { series: 'MTP CRE', publisher: 'Mountain Top Publishers (MTP)' },
      { series: 'Smart Minds CRE', publisher: 'East African Educational Publishers (EAEP)' },
    ],
    'Islamic Religious Education (IRE)': [
      { series: 'KLB Excelling Islamic Religious Education', publisher: 'Kenya Literature Bureau (KLB)' },
      { series: 'Atfaal IRE', publisher: 'Atfaal Publishers' },
    ],
  },
};

export function getKicdApprovedTextbook(
  grade: number | string,
  subject?: string | null
): {
  series: string;
  publisher: string;
  lbTitle: string;
  tgTitle: string;
} {
  const upperG = String(grade).toUpperCase();
  const isPP1 = upperG === 'PP1' || upperG === '-1';
  const isPP2 = upperG === 'PP2' || upperG === '0';
  const isPP = isPP1 || isPP2;
  const gNum = Number(grade);

  const band = isPP
    ? 'preprimary'
    : gNum <= 3
    ? 'lower'
    : gNum <= 6
    ? 'upper'
    : gNum <= 9
    ? 'jss'
    : 'senior';
  const subj = String(subject || '');
  const list = KICD_ORANGE_BOOK_MAP[band][subj] || [
    { series: `KLB Approved ${subj || 'CBC'}`, publisher: 'Kenya Literature Bureau (KLB)' },
  ];
  const idx = isPP1 ? 0 : isPP2 ? 1 : Math.max(0, gNum - 1);
  const item = list[idx % list.length];
  const resolvedSeries =
    !isPP && gNum === 3 && item.series === 'KLB Visionary English Language Activities'
      ? 'KLB Lower Primary English Language Activities'
      : item.series;
  const isKis = Boolean(item.isKiswahili || subj.toLowerCase().includes('kiswahili'));
  const gLabel = isPP1 ? 'PP1' : isPP2 ? 'PP2' : `Grade ${gNum}`;
  const kisLabel = isPP1 ? 'PP1' : isPP2 ? 'PP2' : `Gredi ya ${gNum}`;

  return {
    series: resolvedSeries,
    publisher: item.publisher,
    lbTitle: isKis
      ? `${resolvedSeries} Kitabu cha Mwanafunzi ${kisLabel}`
      : `${resolvedSeries} Learner's Book ${gLabel}`,
    tgTitle: isKis
      ? `${resolvedSeries} Mwongozo wa Mwalimu ${kisLabel}`
      : `${resolvedSeries} Teacher's Guide ${gLabel}`,
  };
}
