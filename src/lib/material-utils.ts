export type MaterialCategory =
  | 'Schemes of Work'
  | 'Lesson Plans'
  | "Teachers' Notes"
  | 'Revision Papers & Exams'
  | 'Records of Work'
  | 'Holiday Assignments & Designs';

export type MaterialFormat = 'DOCX' | 'PDF';

export interface ParsedMaterialMetadata {
  title: string;
  grade: number;
  level: string;
  category: MaterialCategory;
  subject: string;
  term: number;
  format: MaterialFormat;
  price: number;
}

export const MATERIAL_CATEGORIES: MaterialCategory[] = [
  'Schemes of Work',
  'Lesson Plans',
  "Teachers' Notes",
  'Revision Papers & Exams',
  'Records of Work',
  'Holiday Assignments & Designs',
];

export const DEFAULT_PRICES: Record<MaterialCategory, number> = {
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

export function getLevelForGrade(grade: number): string {
  if (grade <= 3) return 'Lower Primary';
  if (grade <= 6) return 'Upper Primary';
  if (grade <= 9) return 'Junior Secondary';
  return 'Senior School';
}

export function getCbcLessonAllocation(grade: number, subject?: string | null): {
  lessonsPerWeek: number;
  minutesPerLesson: number;
} {
  const s = String(subject || '').toLowerCase();

  if (grade <= 3) {
    let lessonsPerWeek = 4;
    if (s.includes('math') || s.includes('english')) lessonsPerWeek = 5;
    else if (s.includes('creative')) lessonsPerWeek = 7;
    else if (s.includes('kiswahili') || s.includes('environmental')) lessonsPerWeek = 4;
    else if (s.includes('religious') || s.includes('cre') || s.includes('ire')) lessonsPerWeek = 3;
    else if (s.includes('indigenous')) lessonsPerWeek = 2;
    return { lessonsPerWeek, minutesPerLesson: 30 };
  }

  if (grade <= 6) {
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
  const gradeMatch = clean.match(/\b(?:grade|g)\s*(\d{1,2})\b/i);
  const formMatch = clean.match(/\bform\s*([1-4])\b/i);
  if (gradeMatch) {
    grade = Math.min(12, Math.max(1, parseInt(gradeMatch[1], 10)));
  } else if (formMatch) {
    grade = 8 + parseInt(formMatch[1], 10);
  } else if (/\bkpsea\b/i.test(clean)) {
    grade = 6;
  } else if (/\bkjsea\b/i.test(clean)) {
    grade = 9;
  } else if (/\bkcse\b/i.test(clean)) {
    grade = 12;
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
      if (['CBC', 'KPSEA', 'KJSEA', 'KEYA', 'KCSE', 'JSS', 'CRE', 'IRE', 'CSL', 'STEM', 'KICD'].includes(upper)) {
        return upper;
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    });

  let title = titleWords.join(' ');
  if (!title.toLowerCase().includes('grade')) {
    title = `Grade ${grade} ${title}`;
  }

  const level = getLevelForGrade(grade);
  const price = DEFAULT_PRICES[category];

  return {
    title,
    grade,
    level,
    category,
    subject,
    term,
    format,
    price,
  };
}
