export interface SyllabusBlock {
  strand: string;
  subs: string[];
  kiq: string;
  resources: string;
}

export interface CoursebookInfo {
  series: string;
  publisher: string;
  authors: string;
  lbTitle: string;
  tgTitle: string;
  lbShort: string;
  tgShort: string;
  isKiswahili: boolean;
  note: string | null;
  alternates: string[];
}

export interface SyllabusResult {
  shortCode: string;
  strandsByTerm: Record<number, SyllabusBlock[]>;
}

export interface DomainLessonNotes {
  summaryLine: string;
  coreConceptNotes: string[];
  workedIllustration: string;
  learnerPracticeTask: string;
  checkQuestion: string;
}

export function getApprovedCoursebook(grade: number | string, subject: string): CoursebookInfo;
export function getSyllabusForGrade(grade: number | string, subject: string): SyllabusResult;
export function buildDomainLessonNotes(params: {
  grade: number | string;
  subject: string;
  strand: string;
  baseSubstrand: string;
  aspect: string;
  phaseTag: string;
  kiq: string;
  resources: string;
  lbCitation: string;
  tgCitation: string;
  isKiswahili?: boolean;
}): DomainLessonNotes;
export function getCurriculumAllocation(
  grade: number | string,
  subject: string
): {
  lessonsPerWeek: number;
  minutesPerLesson: number;
  stepTimings: { intro: number; step1: number; step2: number; conclusion: number };
};
export function getTermWeeksConfig(term: number): {
  totalWeeks: number;
  midTermWeek: number | null;
  revisionWeek: number | null;
  endTermWeek: number;
  teachingWeeks: number[];
};
