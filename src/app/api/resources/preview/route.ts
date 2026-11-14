import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  formatTermLabel,
  getCbcLessonAllocation,
  getTermTotalWeeks,
  normalizeCategory,
} from '@/lib/material-utils';

const BUCKET_NAME = 'cbc-materials';

interface StoredMeta {
  description?: string;
  strands?: string[];
  pageCount?: number;
  fileSizeKb?: number;
  sampleExcerpt?: string;
}

function buildFallbackDetails(resource: {
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  format: string;
}) {
  const cat = normalizeCategory(resource.category);
  const termText = formatTermLabel(resource.term);
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(resource.grade, resource.subject);
  const totalWeeks = getTermTotalWeeks(resource.term);
  const totalLessons = lessonsPerWeek * totalWeeks;

  let description = '';
  let strands: string[] = [];

  if (cat === 'Schemes of Work') {
    description = `KICD-rationalized ${resource.subject} Schemes of Work for Grade ${resource.grade} (${resource.level}), ${termText} — structured with ${lessonsPerWeek} lessons per week (${minutesPerLesson} mins each, ${totalLessons} individual lessons across Weeks 1–${totalWeeks}). Every single lesson (LSN 1 to LSN ${lessonsPerWeek}) is clearly itemized in the 10-column Kenyan teacher layout.`;
    strands = [
      `Official CBC Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins each) — every lesson (LSN 1–${lessonsPerWeek}) on its own clear row`,
      `10-column schemes.co.ke layout across Weeks 1 to ${totalWeeks} (${totalLessons} total lessons)`,
      'Numbered Cognitive, Psychomotor & Affective Lesson Learning Outcomes per lesson',
      `Editable ${resource.format} document with progressive KICD textbook page references`,
    ];
  } else if (cat === 'Lesson Plans') {
    description = `Complete ready-to-teach CBC Lesson Plans for Grade ${resource.grade} ${resource.subject} (${termText}) covering all ${lessonsPerWeek} lessons per week (${minutesPerLesson} mins per lesson, ${totalLessons} individual lesson plans across Weeks 1–${totalWeeks}). Includes administrative roll header, Core Competencies, PCIs, Values, timed lesson steps, and self-evaluation.`;
    strands = [
      `Complete lesson-by-lesson plans: Lesson 1 to Lesson ${lessonsPerWeek} for every week (${totalLessons} plans total)`,
      `Exact ${minutesPerLesson}-minute CBC step breakdown (Introduction, Explore, Practice & Conclusion)`,
      'Administrative header table (School, Learning Area, Grade, Week & Lesson, Time, Roll)',
      `Editable & printable ${resource.format} teacher booklet`,
    ];
  } else if (cat === 'Records of Work') {
    description = `Official TSC & KICD Weekly and Lesson-by-Lesson Record of Work Covered & Rubric Tracker for Grade ${resource.grade} ${resource.subject} (${termText}). Pre-mapped with ${lessonsPerWeek} lessons per week (LSN 1–${lessonsPerWeek} across Weeks 1–${totalWeeks}) and EE / ME / AE / BE learner achievement columns.`;
    strands = [
      `Individual lesson tracking rows: LSN 1 to LSN ${lessonsPerWeek} per week (${totalLessons} lessons across Weeks 1–${totalWeeks})`,
      'Built-in CBC Rubric Tracker columns (EE, ME, AE, BE) for every lesson',
      'Dedicated Date Taught, Work Covered Summary & HOD/Headteacher Sign-off columns',
      `Landscape editable ${resource.format} professional document`,
    ];
  } else if (cat === 'Holiday Assignments & Designs') {
    description =
      resource.term === 0
        ? `Complete KICD Rationalized Curriculum Design & Annual Lesson Allocation Matrix for Grade ${resource.grade} ${resource.subject} (${lessonsPerWeek} lessons/week, ${minutesPerLesson} mins each) covering Term 1, Term 2, and Term 3 strands, sub-strands, lesson counts, KIQs, and learning resources.`
        : `Structured Grade ${resource.grade} ${resource.subject} (${termText}) Holiday Revision Workbook & Parent-Guided Home Competency Project aligned to the ${lessonsPerWeek}-lesson/week term syllabus.`;
    strands =
      resource.term === 0
        ? [
            `Official KICD Lesson Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins/lesson, ${lessonsPerWeek * 36} annual lessons)`,
            'Full-year syllabus overview across Term 1 (13 wks), Term 2 (14 wks) & Term 3 (9 wks)',
            'Exact lesson distribution per strand & sub-strand + Key Inquiry Questions',
            `Clean printable ${resource.format} curriculum reference guide`,
          ]
        : [
            `Self-paced ${termText} topical revision mapped to weekly lessons`,
            'Parent/guardian sign-off & home-based practical CBC project',
            'Reinforces core term competencies before next term opens',
            `Ready-to-print ${resource.format} learner workbook`,
          ];
  } else if (cat === 'Revision Papers & Exams') {
    description = `Competency-Based Grade ${resource.grade} ${resource.subject} (${termText}) Summative Assessment Paper weighted according to the KICD ${lessonsPerWeek}-lesson/week syllabus, complete with an official Marking Scheme and EE/ME/AE/BE scoring rubric.`;
    strands = [
      `Weighted across ${termText} KICD strands (${lessonsPerWeek} lessons/week syllabus scope)`,
      'Includes official CBC Rubric Grid (EE, ME, AE, BE)',
      'Complete step-by-step Marking Scheme & Scoring Guide included',
      'Ready to print for Opener, Mid-Term, or End-of-Term exams',
    ];
  } else {
    description = `Comprehensive CBC Lesson Notes & Teaching Guide for Grade ${resource.grade} ${resource.subject} (${resource.level}, ${termText}), structured around the official ${lessonsPerWeek} lessons per week (${minutesPerLesson} mins each) with clear lesson-by-lesson sub-strand notes, practical activities, and topical review exercises.`;
    strands = [
      `Aligned to ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins/lesson) across Weeks 1–${totalWeeks}`,
      'Clear lesson-by-lesson concepts, definitions & practical learner activities',
      'End-of-unit self-check & revision questions',
      `Clean ${resource.format} booklet for classroom teaching or learner revision`,
    ];
  }

  return { description, strands };
}

export async function GET(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Resource id is required' }, { status: 400 });
    }

    const { data: resource, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const fallback = buildFallbackDetails(resource);
    let meta: StoredMeta = {};

    // Extract live excerpt & size from Storage file
    let sampleExcerpt = '';
    let fileSizeKb: number | null = null;

    if (resource.file_path) {
      const { data: fileBlob } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(resource.file_path);

      if (fileBlob) {
        const arrayBuf = await fileBlob.arrayBuffer();
        const buffer = Buffer.from(arrayBuf);
        fileSizeKb = Math.max(1, Math.round(buffer.byteLength / 1024));

        if (resource.file_path.toLowerCase().endsWith('.docx')) {
          try {
            const extracted = await mammoth.extractRawText({ buffer });
            const cleaned = extracted.value
              .replace(/\r/g, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
            if (cleaned.length > 0) {
              sampleExcerpt =
                cleaned.slice(0, 680) +
                (cleaned.length > 680 ? '\n\n[... Purchase via M-Pesa to unlock full editable Word document ...]' : '');
            }
          } catch {
            // ignore extraction error
          }
        }
      }
    }

    // Optional _meta override if uploaded via Admin with custom description
    if (resource.file_path && !sampleExcerpt) {
      const { data: metaBlob } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .download(`_meta/${resource.file_path}.json`);
      if (metaBlob) {
        try {
          meta = JSON.parse(await metaBlob.text()) as StoredMeta;
          if (meta.sampleExcerpt) sampleExcerpt = meta.sampleExcerpt;
        } catch {
          // ignore
        }
      }
    }

    const termText = formatTermLabel(resource.term);
    if (!sampleExcerpt) {
      sampleExcerpt =
        `${resource.title.toUpperCase()}\n` +
        `Level: ${resource.level} (Grade ${resource.grade})  |  Learning Area: ${resource.subject}  |  ${termText}\n` +
        `Format: Printable ${resource.format} Document\n\n` +
        `Included Inside:\n` +
        fallback.strands.map((s) => `• ${s}`).join('\n') +
        `\n\n[... Complete M-Pesa Express Checkout (KES ${resource.price}) for instant full ${resource.format} download ...]`;
    }

    return NextResponse.json({
      id: resource.id,
      title: resource.title,
      grade: resource.grade,
      level: resource.level,
      category: normalizeCategory(resource.category),
      subject: resource.subject,
      term: resource.term,
      format: resource.format,
      price: resource.price,
      fileSizeKb: fileSizeKb || meta.fileSizeKb || null,
      pageCount: meta.pageCount || null,
      description: meta.description || fallback.description,
      strands: meta.strands && meta.strands.length > 0 ? meta.strands : fallback.strands,
      sampleExcerpt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Preview error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
