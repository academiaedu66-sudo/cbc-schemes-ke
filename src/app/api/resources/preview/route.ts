import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { PDFDocument } from 'pdf-lib';
import { supabaseAdmin } from '@/lib/supabase';
import {
  formatGradeLabel,
  formatTermLabel,
  getCbcLessonAllocation,
  getKicdApprovedTextbook,
  getResourceGradeKey,
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
  file_path?: string;
}) {
  const cat = normalizeCategory(resource.category);
  const gradeKey = getResourceGradeKey(resource);
  const gradeLabel = formatGradeLabel(gradeKey);
  const termText = formatTermLabel(resource.term);
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(gradeKey, resource.subject);
  const totalWeeks = getTermTotalWeeks(resource.term);
  const totalLessons = lessonsPerWeek * totalWeeks;
  const book = getKicdApprovedTextbook(gradeKey, resource.subject);

  let description = '';
  let strands: string[] = [];

  if (cat === 'CBC GRADE UP (50-Page Books)') {
    description = `Official "CBC GRADE UP" Complete Short Notes, Exam & Topical Exercise Book for ${gradeLabel} ${resource.subject}, synthesized from KICD Approved Course Materials (${book.lbTitle} — ${book.publisher}). Includes comprehensive Point-Form Short Notes (12+ points per Sub-strand, 30+ points per Strand across ALL Strands), 165 zero-repeat Strand & Sub-strand Exam Questions, and Complete Marking Schemes at the end of the book.`;
    strands = [
      `Official Approved Coursebook Alignment: ${book.lbTitle} (${book.publisher})`,
      'Section A: Complete Point-Form Short Notes (12+ pts/Sub-strand, 30+ pts/Strand across ALL Strands)',
      'Section B & C: 165 Zero-Repeat Questions + End-of-Book Marking Schemes & Worked Solutions',
      'Dual Format Included: Printable PDF + Editable Word (.DOCX)',
    ];
  } else if (cat === 'SUPER-LIGHT CBC COMPILATION (50p)') {
    description = `Official "SUPER-LIGHT CBC COMPILATION" Revision Book for ${gradeLabel} ${resource.subject}, synthesized from KICD Approved Course Materials (${book.lbTitle} — ${book.publisher}). Features In-Depth Short Point-Form Notes (12+ points per Sub-strand, 30+ points per Strand covering ALL Strands), followed immediately after every Sub-strand by relevant Topical Practice Questions + Complete Answers at the back.`;
    strands = [
      `Official Approved Coursebook Alignment: ${book.lbTitle} (${book.publisher})`,
      'Complete Point-Form Short Notes: 12+ Points per Sub-strand & 30+ Points per Strand (All Strands)',
      'Every Sub-strand Followed Immediately by Relevant Topical Practice Questions + Answers',
      'Dual Format Included: Printable PDF + Editable Word (.DOCX)',
    ];
  } else if (cat === 'SMART CBC ALL SUBJECTS (100p)') {
    description = `Complete "SMART CBC ALL SUBJECTS" Master Compilation for ${gradeLabel} ${resource.subject}, combining BOTH Books ("SUPER-LIGHT CBC COMPILATION" + "CBC GRADE UP") with complete zero-repetition Point-Form Short Notes (12+ points per Sub-strand & 30+ points per Strand in each part, covering ALL Strands), Immediate Sub-strand Questions, 165 Exam Questions, and Complete Marking Schemes (${book.lbTitle} — ${book.publisher}).`;
    strands = [
      `Official Approved Coursebook Alignment: ${book.lbTitle} (${book.publisher})`,
      'Master Compilation: SUPER-LIGHT CBC COMPILATION + CBC GRADE UP (Zero Overlap)',
      'All Strands Covered: 12+ Short Note Points/Sub-strand (30+/Strand) + 315+ Questions + Marking Schemes',
      'Dual Format Included: Printable PDF + Editable Word (.DOCX)',
    ];
  } else if (cat === 'Schemes of Work') {
    description = `KICD-rationalized ${resource.subject} Schemes of Work for ${gradeLabel} (${resource.level}), ${termText} — aligned to ${book.lbTitle} & ${book.tgTitle} (${book.publisher}). Structured with ${lessonsPerWeek} lessons/week (${minutesPerLesson} mins each, ${totalLessons} individual lessons across Weeks 1–${totalWeeks}) and delivered in BOTH Editable Word (.DOCX) and Print-Ready (.PDF) formats.`;
    strands = [
      `KICD Orange Book Reference: ${book.lbTitle} & ${book.tgTitle}`,
      `Synchronized 1-for-1 (Week, Lesson, Topic & Pages) with Lesson Plans & Teachers' Notes`,
      `Official CBC Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins each, ${totalLessons} lessons total)`,
      `Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)`,
    ];
  } else if (cat === 'Lesson Plans') {
    description = `Complete ready-to-teach CBC Lesson Plans for ${gradeLabel} ${resource.subject} (${termText}) referencing ${book.lbTitle} & ${book.tgTitle} (${book.publisher}). Covers all ${lessonsPerWeek} lessons/week (${minutesPerLesson} mins/lesson, ${totalLessons} individual lesson plans across Weeks 1–${totalWeeks}) with BOTH Editable Word (.DOCX) and Print-Ready (.PDF) downloads.`;
    strands = [
      `KICD Approved Coursebook: ${book.lbTitle} & ${book.tgTitle}`,
      `Rhymes 1:1 with the Term's Scheme of Work & Teachers' Notes (${totalLessons} lesson plans)`,
      `Exact ${minutesPerLesson}-minute CBC steps (Intro, Explore, Chalkboard Notes & Conclusion)`,
      `Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)`,
    ];
  } else if (cat === 'Records of Work') {
    description = `Official TSC & KICD Lesson-by-Lesson Record of Work Covered & Rubric Tracker for ${gradeLabel} ${resource.subject} (${termText}), pre-mapped to ${book.lbTitle} (${book.publisher}) across all ${lessonsPerWeek} lessons/week (${totalLessons} lessons, Weeks 1–${totalWeeks}) in BOTH Editable Word (.DOCX) and Print-Ready (.PDF).`;
    strands = [
      `KICD Approved Coursebook Pages: ${book.lbTitle}`,
      `Synced lesson-by-lesson (LSN 1–${lessonsPerWeek}) with Scheme of Work & Lesson Plans`,
      'Built-in CBC Rubric Tracker columns (EE, ME, AE, BE) per lesson',
      'Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)',
    ];
  } else if (cat === 'Holiday Assignments & Designs') {
    description =
      resource.term === 0
        ? `Complete KICD Rationalized Curriculum Design & Approved Orange Book Coursebook Matrix for ${gradeLabel} ${resource.subject} (${book.lbTitle} & ${book.tgTitle}, ${lessonsPerWeek} lessons/week, ${minutesPerLesson} mins each) covering Terms 1, 2, and 3 in Editable Word (.DOCX) + Print PDF.`
        : `Structured ${gradeLabel} ${resource.subject} (${termText}) Holiday Revision Workbook & Home Competency Project synced directly to ${book.lbTitle} pages and delivered in Editable Word (.DOCX) + Print PDF.`;
    strands =
      resource.term === 0
        ? [
          `KICD Orange Book Coursebook: ${book.lbTitle} (${book.publisher})`,
          `Official Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins, ${lessonsPerWeek * 36} annual lessons)`,
          'Full-year Strand, Sub-strand & Textbook Page Matrix (Terms 1, 2 & 3)',
          'Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)',
        ]
        : [
          `Synced with ${book.lbTitle} pages & ${termText} Teachers' Notes`,
          `Covers all ${termText} sub-strands taught across ${lessonsPerWeek} lessons/week`,
          'Includes parent/guardian sign-off & home practical CBC project',
          'Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)',
        ];
  } else if (
    cat === 'NATIONAL KJSEA EXAMINATION (ALL GRADES)' ||
    cat === 'Revision Papers & Exams'
  ) {
    const isJamoKjsea =
      cat === 'NATIONAL KJSEA EXAMINATION (ALL GRADES)' ||
      resource.title.toUpperCase().includes('KENYA NATIONAL KJSEA TEST');
    const isMarkingScheme = /MARKING[_\s]SCHEME|MWONGOZO WA KUSAHIHISHA/i.test(
      `${resource.title || ''} ${resource.file_path || ''}`
    );
    const isKis =
      resource.subject.toLowerCase().includes('kiswahili') ||
      resource.subject.toLowerCase().includes('fasihi');
    if (isJamoKjsea && isMarkingScheme) {
      description = isKis
        ? `Mwongozo Rasmi wa Kusahihisha na Utuzaji Alama: KENYA NATIONAL KJSEA TEST (${gradeLabel} ${resource.subject} • Alama 100 • KSh 50). Unajumuisha Nembo ya Tathmini, Viwango vya Utendaji vya CBC (KM, KUF, KUK, CH), na Majibu Kamili ya Sehemu A (Maswali 1–10) na Sehemu B (Maswali 11–20) kwa Kiswahili Sanifu.`
        : `Official Confidential Marking Scheme & Scoring Guide: KENYA NATIONAL KJSEA TEST (${gradeLabel} ${resource.subject} • 100 Marks • KSh 50). Includes the Academic Assessment Crest Seal, CBC Performance Level Rubric (EE, ME, AE, BE), and Complete Step-by-Step Worked Solutions for Section A (Q1–10) & Section B (Q11–20).`;
      strands = isKis
        ? [
          'Nyaraka Rasmi ya Mtahini: Mwongozo wa Kusahihisha Maswali 1 hadi 20 (Alama 100)',
          'Majibu na Ufafanuzi wa Sehemu A (Maswali 1–10, Alama 20)',
          'Hatua za Utuzaji Alama kwa Sehemu B (Maswali 11–20, Alama 80)',
          'Inatolewa katika miundo MIWILI: .PDF + Editable Word (.DOCX) — KSh 50',
        ]
        : [
          'Confidential Examiner Scoring Guide matching Questions 1–20 (Total: 100 Marks)',
          'Section A Complete Answer Key & Explanations (Q1–10 = 20 Marks)',
          'Section B Step-by-Step Worked Solutions & Mark Breakdown (Q11–20 = 80 Marks)',
          'Dual Format Included: Print-Ready .PDF + Editable Word (.DOCX) — KSh 50',
        ];
    } else if (isJamoKjsea) {
      description = isKis
        ? `Karatasi Rasmi ya Maswali ya Mtihani: KENYA NATIONAL KJSEA TEST (${gradeLabel} ${resource.subject} • MUDA: SAA 2 • KSh 50). Imeundwa kwa muundo kamili wa KNEC ikiwa na Nembo ya Tathmini, Maagizo kwa Watahiniwa kwenye ukurasa wa kwanza, na Maswali 20 yasiyo na urudiaji yanayofunika Mada Kuu zote za silabasi (Mwongozo wa Kusahihisha unapatikana kando kwa KSh 50).`
        : `Official Question Paper Booklet: KENYA NATIONAL KJSEA TEST (${gradeLabel} ${resource.subject} • TIME: 2 HOURS • KSh 50). Features an authentic KNEC-style First-Page Cover with Academic Assessment Seal, Instructions to Candidates, Examiner's Scoring Grid, and 20 zero-repetition questions covering ALL syllabus strands (Official Marking Scheme available separately at KSh 50).`;
      strands = isKis
        ? [
          'Ukurasa wa Kwanza (Muundo wa KNEC): Nembo Rasmi, Maagizo kwa Watahiniwa & Jedwali la Mtahini',
          'Muda wa Mtihani: SAA 2 • Maswali 20 Yenye Alama 100 (Bila Urudiaji Wowote)',
          'Inatahini Mada Kuu Zote za Silabasi kwa Lugha ya Kiswahili Sanifu',
          'Karatasi ya Maswali (.PDF + .DOCX): KSh 50 • Mwongozo wa Kusahihisha unapatikana kwa KSh 50',
        ]
        : [
          "Page 1 (KNEC Cover Format): Academic Seal, Instructions to Candidates & Examiner's Grid",
          'Duration: 2 HOURS • 20 Zero-Repetition Questions Covering ALL Strands (100 Marks)',
          'Section A (Q1–10 Multiple Choice, 20 Marks) + Section B (Q11–20 Structured, 80 Marks)',
          'Question Paper (.PDF + .DOCX): KSh 50 • Separate Official Marking Scheme: KSh 50',
        ];
    } else {
      description = `Competency-Based ${gradeLabel} ${resource.subject} (${termText}) Assessment Paper & Official Marking Scheme aligned to ${book.lbTitle} (${book.publisher}) — includes BOTH Editable Word (.DOCX to customize your school header) and Print-Ready (.PDF).`;
      strands = [
        `Aligned to ${book.lbTitle} & ${termText} Scheme of Work lesson spans`,
        'Includes official CBC Rubric Grid (EE, ME, AE, BE)',
        'Complete step-by-step Marking Scheme citing exact KICD textbook pages',
        'Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)',
      ];
    }
  } else {
    description = `Comprehensive Lesson-by-Lesson CBC Teachers' Notes for ${gradeLabel} ${resource.subject} (${resource.level}, ${termText}), aligned to ${book.lbTitle} & ${book.tgTitle} (${book.publisher}) — unlocked in BOTH Editable Word (.DOCX) and Print-Ready (.PDF).`;
    strands = [
      `KICD Approved Reference: ${book.lbTitle} & ${book.tgTitle}`,
      `Lesson-by-lesson notes (${lessonsPerWeek} Lessons/Week) synced 1:1 with Scheme & Lesson Plans`,
      'Includes Chalkboard Concept Notes, Worked Classroom Illustrations & Guided Tasks',
      'Dual Format Included: Editable Word (.DOCX) + Print-Ready (.PDF)',
    ];
  }

  return { description, strands, book, gradeLabel };
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
        `Level: ${fallback.gradeLabel} (${resource.level})  |  Learning Area: ${resource.subject}  |  ${termText}\n` +
        `KICD Approved Coursebook: ${fallback.book.lbTitle} (${fallback.book.publisher})\n` +
        `Formats Included: Editable Word (.DOCX) + Print-Ready (.PDF)${livePageCount ? ` (${livePageCount} Pages)` : ''}\n\n` +
        `Synchronized Highlights Inside:\n` +
        fallback.strands.map((s) => `• ${s}`).join('\n') +
        `\n\n[... Complete M-Pesa Express Checkout (KES ${resource.price}) for instant Editable DOCX + PDF download ...]`;
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
