import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import { supabaseAdmin } from '@/lib/supabase';
import {
  formatTermLabel,
  getCbcLessonAllocation,
  getKicdApprovedTextbook,
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
  const book = getKicdApprovedTextbook(resource.grade, resource.subject);

  let description = '';
  let strands: string[] = [];

  if (cat === 'Schemes of Work') {
    description = `KICD-rationalized ${resource.subject} Schemes of Work for Grade ${resource.grade} (${resource.level}), ${termText} — aligned to ${book.lbTitle} & ${book.tgTitle} (${book.publisher}). Structured with ${lessonsPerWeek} lessons/week (${minutesPerLesson} mins each, ${totalLessons} individual lessons across Weeks 1–${totalWeeks}) and synchronized 1:1 with the CBC Lesson Plans, Teachers' Notes, and Record of Work.`;
    strands = [
      `KICD Orange Book Reference: ${book.lbTitle} & ${book.tgTitle}`,
      `Synchronized 1-for-1 (Week, Lesson, Topic & Pages) with Lesson Plans & Teachers' Notes`,
      `Official CBC Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins each, ${totalLessons} lessons total)`,
      `Editable 10-column schemes.co.ke ${resource.format} layout`,
    ];
  } else if (cat === 'Lesson Plans') {
    description = `Complete ready-to-teach CBC Lesson Plans for Grade ${resource.grade} ${resource.subject} (${termText}) referencing ${book.lbTitle} & ${book.tgTitle} (${book.publisher}). Covers all ${lessonsPerWeek} lessons/week (${minutesPerLesson} mins/lesson, ${totalLessons} individual lesson plans across Weeks 1–${totalWeeks}) and rhymes lesson-for-lesson with the Scheme of Work and Teachers' Notes.`;
    strands = [
      `KICD Approved Coursebook: ${book.lbTitle} & ${book.tgTitle}`,
      `Rhymes 1:1 with the Term's Scheme of Work & Teachers' Notes (${totalLessons} lesson plans)`,
      `Exact ${minutesPerLesson}-minute CBC steps (Intro, Explore, Chalkboard Notes & Conclusion)`,
      `Editable & printable ${resource.format} teacher booklet`,
    ];
  } else if (cat === 'Records of Work') {
    description = `Official TSC & KICD Lesson-by-Lesson Record of Work Covered & Rubric Tracker for Grade ${resource.grade} ${resource.subject} (${termText}), pre-mapped to ${book.lbTitle} (${book.publisher}) across all ${lessonsPerWeek} lessons/week (${totalLessons} lessons, Weeks 1–${totalWeeks}) and synced 1:1 with the Scheme of Work and Lesson Plans.`;
    strands = [
      `KICD Approved Coursebook Pages: ${book.lbTitle}`,
      `Synced lesson-by-lesson (LSN 1–${lessonsPerWeek}) with Scheme of Work & Lesson Plans`,
      'Built-in CBC Rubric Tracker columns (EE, ME, AE, BE) per lesson',
      `Landscape editable ${resource.format} professional document`,
    ];
  } else if (cat === 'Holiday Assignments & Designs') {
    description =
      resource.term === 0
        ? `Complete KICD Rationalized Curriculum Design & Approved Orange Book Coursebook Matrix for Grade ${resource.grade} ${resource.subject} (${book.lbTitle} & ${book.tgTitle}, ${lessonsPerWeek} lessons/week, ${minutesPerLesson} mins each) covering Terms 1, 2, and 3.`
        : `Structured Grade ${resource.grade} ${resource.subject} (${termText}) Holiday Revision Workbook & Home Competency Project synced directly to ${book.lbTitle} pages and the ${lessonsPerWeek}-lesson/week Scheme of Work & Notes.`;
    strands =
      resource.term === 0
        ? [
            `KICD Orange Book Coursebook: ${book.lbTitle} (${book.publisher})`,
            `Official Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins, ${lessonsPerWeek * 36} annual lessons)`,
            'Full-year Strand, Sub-strand & Textbook Page Matrix (Terms 1, 2 & 3)',
            `Clean printable ${resource.format} curriculum reference guide`,
          ]
        : [
            `Synced with ${book.lbTitle} pages & ${termText} Teachers' Notes`,
            `Covers all ${termText} sub-strands taught across ${lessonsPerWeek} lessons/week`,
            'Includes parent/guardian sign-off & home practical CBC project',
            `Ready-to-print ${resource.format} learner workbook`,
          ];
  } else if (cat === 'Revision Papers & Exams') {
    description = `Competency-Based Grade ${resource.grade} ${resource.subject} (${termText}) Summative Assessment Paper & Marking Scheme aligned to ${book.lbTitle} (${book.publisher}) and weighted across the exact ${lessonsPerWeek}-lesson/week Scheme of Work and Teachers' Notes.`;
    strands = [
      `Aligned to ${book.lbTitle} & ${termText} Scheme of Work lesson spans`,
      'Includes official CBC Rubric Grid (EE, ME, AE, BE)',
      'Complete step-by-step Marking Scheme citing exact KICD textbook pages',
      'Ready to print for Mid-Term or End-of-Term summative assessment',
    ];
  } else {
    description = `Comprehensive Lesson-by-Lesson CBC Teachers' Notes for Grade ${resource.grade} ${resource.subject} (${resource.level}, ${termText}), aligned to ${book.lbTitle} & ${book.tgTitle} (${book.publisher}). Every single lesson (Week & Lesson Number, Topic, Chalkboard Concept Notes, Worked Illustration & Learner Activity) rhymes 1:1 with the Term's Scheme of Work and CBC Lesson Plans.`;
    strands = [
      `KICD Approved Reference: ${book.lbTitle} & ${book.tgTitle}`,
      `Lesson-by-lesson notes (${lessonsPerWeek} Lessons/Week) synced 1:1 with Scheme & Lesson Plans`,
      'Includes Chalkboard Concept Notes, Worked Classroom Illustrations & Guided Tasks',
      `Multi-page printable ${resource.format} teaching & revision booklet`,
    ];
  }

  return { description, strands, book };
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

    // Extract live excerpt, size & page count from Storage file
    let sampleExcerpt = '';
    let fileSizeKb: number | null = null;
    let livePageCount: number | null = null;

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
                cleaned.slice(0, 740) +
                (cleaned.length > 740 ? '\n\n[... Purchase via M-Pesa to unlock full editable Word document ...]' : '');
            }
          } catch {
            // ignore extraction error
          }
        } else if (resource.file_path.toLowerCase().endsWith('.pdf')) {
          try {
            const pdfDoc = await PDFDocument.load(buffer, { ignoreEncryption: true });
            livePageCount = pdfDoc.getPageCount();
          } catch {
            // ignore pdf load error
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
        `KICD Approved Coursebook: ${fallback.book.lbTitle} (${fallback.book.publisher})\n` +
        `Format: Printable ${resource.format} Document${livePageCount ? ` (${livePageCount} Pages)` : ''}\n\n` +
        `Synchronized Highlights Inside:\n` +
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
      pageCount: livePageCount || meta.pageCount || null,
      description: meta.description || fallback.description,
      strands: meta.strands && meta.strands.length > 0 ? meta.strands : fallback.strands,
      sampleExcerpt,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Preview error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
