import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import { supabaseAdmin } from '@/lib/supabase';
import { formatTermLabel, normalizeCategory } from '@/lib/material-utils';

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
  let description = '';
  let strands: string[] = [];

  if (cat === 'Schemes of Work') {
    description = `KICD-rationalized ${resource.subject} Schemes of Work for Grade ${resource.grade} (${resource.level}), ${termText}. Formatted in the standard 10-column Kenyan teacher layout (Wk, LSN, Strand, Sub-strand, Lesson Learning Outcomes, Learning Experiences, Key Inquiry Questions, Approved Resources, Assessment Methods, and Reflection).`;
    strands = [
      '10-column schemes.co.ke layout (Weeks 1 to 13 including Half-Term & End-Term)',
      'Numbered Cognitive, Psychomotor & Affective Lesson Learning Outcomes',
      'KICD-approved textbook page references (KLB, Longhorn, Oxford, Moran, Mentor)',
      `Editable ${resource.format} document ready for teacher name, TSC No. & school stamp`,
    ];
  } else if (cat === 'Lesson Plans') {
    description = `Ready-to-teach CBC Lesson Plans for Grade ${resource.grade} ${resource.subject} (${termText}). Includes administrative roll table, Core Competencies, Pertinent & Contemporary Issues (PCIs), Values, step-by-step lesson development, and teacher self-evaluation.`;
    strands = [
      'Administrative header table (School, Learning Area, Grade, Term, Date, Time, Roll)',
      'Introduction, Explore, Explain/Practice & Conclusion lesson steps',
      'Core Competencies, Values & PCIs mapped to rationalized syllabus',
      `Editable & printable ${resource.format} format`,
    ];
  } else if (cat === 'Records of Work') {
    description = `Official TSC & KICD compliant Weekly Record of Work Covered and CBC Assessment Rubric Tracker for Grade ${resource.grade} ${resource.subject} (${termText}). Pre-mapped across Weeks 1–13 with EE / ME / AE / BE learner achievement columns.`;
    strands = [
      'Pre-populated Week 1 to Week 13 rationalized strands & sub-strands',
      'Built-in CBC Rubric Tracker columns (EE, ME, AE, BE)',
      'Dedicated Teacher Remarks & HOD / Headteacher Sign-off column',
      `Landscape editable ${resource.format} template`,
    ];
  } else if (cat === 'Holiday Assignments & Designs') {
    description =
      resource.term === 0
        ? `Complete KICD Rationalized Curriculum Design & Annual Syllabus Matrix for Grade ${resource.grade} ${resource.subject} covering Term 1, Term 2, and Term 3 strands, sub-strands, key inquiry questions, and suggested learning resources.`
        : `Structured Grade ${resource.grade} ${resource.subject} (${termText}) Holiday Revision Workbook & Parent-Guided Home Competency Project designed to keep learners engaged over the school break.`;
    strands =
      resource.term === 0
        ? [
            'Full-year syllabus overview across Term 1, Term 2 & Term 3',
            'All rationalized KICD strands, sub-strands & Key Inquiry Questions',
            'Suggested locally available teaching aids & resources per strand',
            `Clean printable ${resource.format} reference guide`,
          ]
        : [
            `Self-paced ${termText} topical revision questions`,
            'Parent/guardian sign-off & home-based practical CBC project',
            'Reinforces core term competencies before next term opens',
            `Ready-to-print ${resource.format} learner workbook`,
          ];
  } else if (cat === 'Revision Papers & Exams') {
    description = `Competency-Based Grade ${resource.grade} ${resource.subject} (${termText}) Summative Assessment Paper modeled on KNEC / CBA assessment standards, complete with an official Marking Scheme and EE/ME/AE/BE scoring rubric.`;
    strands = [
      `Covers ${termText} rationalized KICD strands & application tasks`,
      'Includes official CBC Rubric Grid (EE, ME, AE, BE)',
      'Complete step-by-step Marking Scheme & Scoring Guide included',
      'Ready to print for Opener, Mid-Term, or End-of-Term exams',
    ];
  } else {
    description = `Comprehensive CBC Lesson Notes & Study Booklet for Grade ${resource.grade} ${resource.subject} (${resource.level}, ${termText}). Features clear strand summaries, practical group activities, real-life Kenyan applications, and topical review exercises.`;
    strands = [
      `Complete ${termText} rationalized strands & sub-strands notes`,
      'Clear key concepts, definitions & practical learner activities',
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
