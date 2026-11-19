import { cacheLife } from 'next/cache';
import { supabaseAdmin } from '@/lib/supabase';
import {
  ALL_GRADE_KEYS,
  formatGradeLabel,
  formatTermLabel,
  getLevelForGrade,
} from '@/lib/material-utils';

export const SITE_URL = 'https://www.cbcmaterials.shop';
export const INDEXNOW_KEY = 'cbcmaterials2026indexnow';

export interface SeoResourceRow {
  id: string;
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  price: number;
  format?: string | null;
  description?: string | null;
  strands?: string | null;
  created_at?: string | null;
}

export interface GradeSeoInfo {
  slug: string;
  gradeKey: string;
  dbGrade: number;
  label: string;
  levelName: string;
  examFocus: string;
  headline: string;
  metaDescription: string;
  keywords: string[];
}

export function gradeKeyToSlug(gradeKey: string): string {
  const upper = gradeKey.toUpperCase().trim();
  if (upper === 'PP1') return 'pp1';
  if (upper === 'PP2') return 'pp2';
  return `grade-${upper.toLowerCase()}`;
}

export function slugToGradeInfo(slug: string): GradeSeoInfo | null {
  const clean = slug.toLowerCase().trim();
  let gradeKey = '';
  let dbGrade = 1;

  if (clean === 'pp1') {
    gradeKey = 'PP1';
    dbGrade = -1;
  } else if (clean === 'pp2') {
    gradeKey = 'PP2';
    dbGrade = 0;
  } else if (/^grade-([1-9]|1[0-2])$/.test(clean)) {
    gradeKey = clean.replace('grade-', '');
    dbGrade = Number(gradeKey);
  } else {
    return null;
  }

  const label = formatGradeLabel(gradeKey);
  const levelName = getLevelForGrade(gradeKey);

  let examFocus = 'Opener, Mid-Term & End-Term CBC Assessments';
  if (gradeKey === 'PP1' || gradeKey === 'PP2') {
    examFocus = 'ECDE Play-Based Assessments, Activity Sheets & Termly Progress Reports';
  } else if (dbGrade >= 1 && dbGrade <= 3) {
    examFocus = 'KEYA School-Based Assessments, Opener, Mid-Term & End-Term Exams';
  } else if (dbGrade >= 4 && dbGrade <= 6) {
    examFocus = 'KPSEA Trial Papers, Prediction Exams & Marking Schemes';
  } else if (dbGrade >= 7 && dbGrade <= 9) {
    examFocus = 'KJSEA Junior School Trial Papers, Top-School Mocks & Marking Schemes';
  } else if (dbGrade >= 10) {
    examFocus = 'Senior School STEM, Social Sciences & Arts Pathway Assessments';
  }

  return {
    slug: clean,
    gradeKey,
    dbGrade,
    label,
    levelName,
    examFocus,
    headline: `2026 ${label} CBC Schemes of Work, Lesson Plans, Notes & Revision Exams`,
    metaDescription: `Download 2026 KICD-rationalized ${label} (${levelName}) CBC Schemes of Work, Lesson Plans, Teachers' Notes, Records of Work, Holiday Assignments, and ${examFocus} in Editable Word (.DOCX) and Print-Ready (.PDF) in Kenya.`,
    keywords: [
      `2026 ${label} Schemes of Work Kenya`,
      `${label} CBC Notes PDF Download`,
      `${label} Lesson Plans Word DOCX`,
      `${label} Term 1 Term 2 Term 3 Exams and Marking Schemes`,
      `${label} Holiday Assignments 2026`,
      `KICD ${label} Curriculum Designs`,
      `${label} Records of Work TSC TPAD`,
    ],
  };
}

export function getAllGradeSeoInfos(): GradeSeoInfo[] {
  return ALL_GRADE_KEYS.map((gk) => slugToGradeInfo(gradeKeyToSlug(gk))!).filter(Boolean);
}

export async function getCachedGradeCatalog(gradeSlug: string): Promise<SeoResourceRow[]> {
  'use cache';
  cacheLife('hours');

  const info = slugToGradeInfo(gradeSlug);
  if (!info) return [];

  try {
    const pages = await Promise.all(
      [0, 1000].map((from) =>
        supabaseAdmin
          .from('resources')
          .select(
            'id, title, grade, level, category, subject, term, price, format, file_path, created_at'
          )
          .eq('grade', info.dbGrade)
          .order('category', { ascending: true })
          .order('subject', { ascending: true })
          .order('term', { ascending: true })
          .range(from, from + 999)
          .abortSignal(AbortSignal.timeout(10000))
      )
    );
    const rows: SeoResourceRow[] = [];
    for (const p of pages) {
      if (p.data && p.data.length > 0) {
        rows.push(...(p.data as SeoResourceRow[]));
      }
    }
    return rows;
  } catch {
    return [];
  }
}

export async function getCachedMaterialById(rawId: string): Promise<SeoResourceRow | null> {
  'use cache';
  cacheLife('hours');

  let decoded = rawId;
  try {
    decoded = decodeURIComponent(rawId);
  } catch {}

  const uuidMatch = decoded.match(
    /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i
  );
  const cleanId = uuidMatch ? uuidMatch[0] : decoded.trim();
  if (!/^[0-9a-f-]{20,}$/i.test(cleanId)) return null;

  const { data, error } = await supabaseAdmin
    .from('resources')
    .select('id, title, grade, level, category, subject, term, price, format, file_path, created_at')
    .eq('id', cleanId)
    .maybeSingle();

  if (error || !data) return null;
  return data as SeoResourceRow;
}

export async function getCachedRelatedMaterials(
  dbGrade: number,
  subject: string,
  excludeId: string
): Promise<SeoResourceRow[]> {
  'use cache';
  cacheLife('hours');

  const { data } = await supabaseAdmin
    .from('resources')
    .select('id, title, grade, level, category, subject, term, price, format, file_path, created_at')
    .eq('grade', dbGrade)
    .eq('subject', subject)
    .neq('id', excludeId)
    .limit(8);

  return (data as SeoResourceRow[]) || [];
}

export async function getCachedSampleMaterialIds(limit = 28): Promise<string[]> {
  'use cache';
  cacheLife('days');

  const { data } = await supabaseAdmin
    .from('resources')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(limit);

  return (data || []).map((r) => String(r.id));
}

export async function getCachedAllSitemapResources(): Promise<
  Array<{ id: string; created_at: string | null }>
> {
  'use cache';
  cacheLife('hours');

  const all: Array<{ id: string; created_at: string | null }> = [];
  let from = 0;

  while (true) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('id, created_at')
      .order('id', { ascending: true })
      .range(from, from + 999);

    if (error || !data || data.length === 0) break;
    all.push(...(data as Array<{ id: string; created_at: string | null }>));
    if (data.length < 1000) break;
    from += 1000;
  }

  return all;
}

export function buildMaterialRichDescription(item: SeoResourceRow): string {
  const gKey =
    item.grade === -1 ? 'PP1' : item.grade === 0 ? 'PP2' : String(item.grade);
  const gLabel = formatGradeLabel(gKey);
  const termLabel = formatTermLabel(item.term);
  const levelLabel = getLevelForGrade(gKey);

  if (item.description && item.description.trim().length > 40) {
    return item.description.trim();
  }

  return `Download 2026 KICD-rationalized ${item.title} for ${gLabel} (${levelLabel}) — ${item.subject}, ${termLabel}. Instant M-Pesa unlock includes both Editable Microsoft Word (.DOCX) and Print-Ready (.PDF) copies for Kenyan teachers, parents, and learners.`;
}
