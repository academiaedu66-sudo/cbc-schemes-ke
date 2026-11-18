import { NextRequest, NextResponse } from 'next/server';
import mammoth from 'mammoth';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  AlignmentType,
  ShadingType,
} from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
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
import {
  getSyllabusForGrade,
  getApprovedCoursebook,
  buildDomainLessonNotes,
} from '../../../../../scripts/cbc-syllabus-data.mjs';
import { generateCbcBookDocxBuffer } from '@/lib/cbc-books-engine';

const BUCKET_NAME = 'cbc-materials';

function toWinAnsiSafe(str: string): string {
  return String(str || '')
    .replace(/√/g, 'sqrt')
    .replace(/⁴/g, '^4')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/÷/g, '/')
    .replace(/×/g, 'x')
    .replace(/µ/g, 'u')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/•/g, '-')
    .replace(/\s{2,}/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapPdfLines(text: string, maxChars = 92): string[] {
  const safeText = text
    .split('\n')
    .map((ln) => toWinAnsiSafe(ln))
    .join('\n');
  const out: string[] = [];
  for (const rawLine of safeText.split('\n')) {
    if (!rawLine.trim()) {
      out.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxChars) {
        if (current) out.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function makeDocxCell(
  text: string,
  opts: { bold?: boolean; fill?: string; widthPct?: number } = {}
): TableCell {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  return new TableCell({
    width: opts.widthPct ? { size: opts.widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders: { top: b, bottom: b, left: b, right: b },
    shading: opts.fill
      ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill }
      : undefined,
    children: text.split('\n').map(
      (line) =>
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text: line,
              bold: opts.bold,
              size: 19,
              font: 'Calibri',
              color: opts.fill === '065F46' ? 'FFFFFF' : '1E293B',
            }),
          ],
        })
    ),
  });
}

/**
 * Converts a stored DOCX buffer into a clean, multi-page Print-Ready PDF
 */
async function buildPrintPdfFromDocx(
  docxBuffer: Buffer | null,
  resource: {
    title: string;
    grade: number;
    level: string;
    category: string;
    subject: string;
    term: number;
    file_path?: string;
  }
): Promise<Buffer> {
  const gradeKey = getResourceGradeKey(resource);
  const gradeLabel = formatGradeLabel(gradeKey);
  const termLabel = formatTermLabel(resource.term);
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(
    gradeKey,
    resource.subject
  );
  const book = getKicdApprovedTextbook(gradeKey, resource.subject);

  let rawText = '';
  if (docxBuffer) {
    try {
      const htmlRes = await mammoth.convertToHtml({ buffer: docxBuffer });
      rawText = htmlRes.value
        .replace(/<\/tr>/gi, '\n--------------------------------------------------------------------------------\n')
        .replace(/<\/t[dh]>/gi, '  |  ')
        .replace(/<\/p>|<\/li>|<\/h[1-6]>|<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/\n{3,}/g, '\n\n')
        .trim();
    } catch {
      try {
        const plain = await mammoth.extractRawText({ buffer: docxBuffer });
        rawText = plain.value.trim();
      } catch {
        rawText = '';
      }
    }
  }

  if (!rawText) {
    rawText = [
      `${resource.title}`,
      `Level: ${gradeLabel} (${resource.level}) | Learning Area: ${resource.subject} | ${termLabel}`,
      `KICD Approved Reference: ${book.lbTitle} & ${book.tgTitle} (${book.publisher})`,
      `Official Weekly Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Minutes/Lesson)`,
    ].join('\n\n');
  }

  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const isLandscapeCat =
    normalizeCategory(resource.category) === 'Schemes of Work' ||
    normalizeCategory(resource.category) === 'Records of Work';
  const pageWidth = isLandscapeCat ? 841.89 : 595.28;
  const pageHeight = isLandscapeCat ? 595.28 : 841.89;
  const margin = 40;
  const maxChars = isLandscapeCat ? 132 : 90;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  page.drawRectangle({
    x: 0,
    y: pageHeight - 86,
    width: pageWidth,
    height: 86,
    color: rgb(0.024, 0.373, 0.275),
  });

  page.drawText(
    toWinAnsiSafe(`KICD RATIONALIZED PRINT-READY PDF EDITION — ${termLabel.toUpperCase()}`).slice(
      0,
      110
    ),
    {
      x: margin,
      y: pageHeight - 30,
      size: 8.8,
      font: fontBold,
      color: rgb(0.68, 0.96, 0.84),
    }
  );
  page.drawText(toWinAnsiSafe(resource.title).slice(0, 95), {
    x: margin,
    y: pageHeight - 50,
    size: 12.2,
    font: fontBold,
    color: rgb(1, 1, 1),
  });
  page.drawText(
    toWinAnsiSafe(
      `${gradeLabel} (${resource.level}) | ${lessonsPerWeek} Lessons/Wk (${minutesPerLesson}m) | ${book.lbTitle}`
    ).slice(0, 120),
    {
      x: margin,
      y: pageHeight - 69,
      size: 8.8,
      font: fontRegular,
      color: rgb(0.9, 0.98, 0.94),
    }
  );

  let y = pageHeight - 104;
  const lines = wrapPdfLines(rawText, maxChars);

  for (const line of lines) {
    if (!line) {
      y -= 5;
      continue;
    }
    if (y < margin + 26) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
    const isDivider = line.startsWith('----------------');
    const isHighlight =
      !isDivider &&
      /^(WEEK \d+|Wk\s+\|?\s*LSN|STRAND|SCHOOL:|APPROVED KICD|TSC \/ KICD)/i.test(line);

    page.drawText(isDivider ? '-'.repeat(Math.min(maxChars, 110)) : line, {
      x: margin,
      y,
      size: isDivider ? 7.5 : isHighlight ? 9.2 : 8.5,
      font: isHighlight ? fontBold : fontRegular,
      color: isDivider
        ? rgb(0.75, 0.8, 0.85)
        : isHighlight
          ? rgb(0.03, 0.36, 0.26)
          : rgb(0.12, 0.16, 0.23),
    });
    y -= isDivider ? 9.5 : 12.2;
  }

  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(
      toWinAnsiSafe(
        `CBC Kenya Resource Hub — ${gradeLabel} ${resource.subject} (${termLabel}) — Page ${idx + 1} of ${pages.length}`
      ),
      {
        x: margin,
        y: 18,
        size: 8,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.56),
      }
    );
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

/**
 * Generates an Editable Microsoft Word (.DOCX) edition (with customizable School Header Table)
 * for Teachers' Notes, Exams & Marking Schemes, KPSEA/KJSEA Trials, Holiday Packs, and Curriculum Designs
 */
async function buildEditableDocxForResource(resource: {
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  file_path?: string;
}): Promise<Buffer> {
  const gradeKey = getResourceGradeKey(resource);
  const gradeLabel = formatGradeLabel(gradeKey);
  const termLabel = formatTermLabel(resource.term);
  const cat = normalizeCategory(resource.category);
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(
    gradeKey,
    resource.subject
  );
  const totalWeeks = getTermTotalWeeks(resource.term);

  let coursebook: {
    series: string;
    publisher: string;
    lbTitle: string;
    tgTitle: string;
    lbShort: string;
    tgShort: string;
    isKiswahili: boolean;
  };
  try {
    coursebook = getApprovedCoursebook(
      gradeKey === 'PP1' || gradeKey === 'PP2' ? gradeKey : resource.grade,
      resource.subject
    );
  } catch {
    const fb = getKicdApprovedTextbook(gradeKey, resource.subject);
    coursebook = {
      ...fb,
      lbShort: fb.lbTitle,
      tgShort: fb.tgTitle,
      isKiswahili: resource.subject.toLowerCase().includes('kiswahili'),
    };
  }

  let allTermsBlocks: Record<
    number,
    Array<{ strand: string; subs: string[]; kiq: string; resources: string }>
  > = { 1: [], 2: [], 3: [] };
  try {
    const syl = getSyllabusForGrade(
      gradeKey === 'PP1' || gradeKey === 'PP2' ? gradeKey : resource.grade,
      resource.subject
    );
    allTermsBlocks = syl.strandsByTerm;
  } catch {
    const fallbackBlock = {
      strand: '1.0 CORE KICD RATIONALIZED STRANDS',
      subs: [
        `Foundational Concepts in ${resource.subject}`,
        `Practical Skills & Guided Classroom Inquiry in ${resource.subject}`,
        `Real-Life Kenyan Contextual Applications of ${resource.subject}`,
      ],
      kiq: `How do learners apply ${resource.subject} competencies in daily life?`,
      resources: `${coursebook.lbTitle}, charts, classroom realia`,
    };
    allTermsBlocks = { 1: [fallbackBlock], 2: [fallbackBlock], 3: [fallbackBlock] };
  }

  const activeTerm = resource.term >= 1 && resource.term <= 3 ? resource.term : 1;
  const termBlocks =
    resource.term === 0
      ? [...(allTermsBlocks[1] || []), ...(allTermsBlocks[2] || []), ...(allTermsBlocks[3] || [])]
      : allTermsBlocks[activeTerm] || [];

  const children: Array<Paragraph | Table> = [
    // Editable School Customization Header Banner
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: '[CLICK HERE TO TYPE YOUR SCHOOL NAME, P.O. BOX & MOTTO]',
          bold: true,
          size: 26,
          font: 'Calibri',
          color: '065F46',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
      children: [
        new TextRun({
          text: resource.title.toUpperCase(),
          bold: true,
          size: 23,
          font: 'Calibri',
          color: '1E293B',
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [
        new TableRow({
          children: [
            makeDocxCell('LEVEL / GRADE', { bold: true, fill: '065F46', widthPct: 20 }),
            makeDocxCell('LEARNING AREA', { bold: true, fill: '065F46', widthPct: 25 }),
            makeDocxCell('TERM & YEAR', { bold: true, fill: '065F46', widthPct: 18 }),
            makeDocxCell('TEACHER / TSC NO.', { bold: true, fill: '065F46', widthPct: 22 }),
            makeDocxCell('ALLOCATION', { bold: true, fill: '065F46', widthPct: 15 }),
          ],
        }),
        new TableRow({
          children: [
            makeDocxCell(`${gradeLabel} (${resource.level})`, { bold: true, widthPct: 20 }),
            makeDocxCell(resource.subject, { widthPct: 25 }),
            makeDocxCell(`${termLabel} • 2026`, { widthPct: 18 }),
            makeDocxCell('Name: ____________\nTSC: _____________', { widthPct: 22 }),
            makeDocxCell(`${lessonsPerWeek} Lsns/Wk\n(${minutesPerLesson} mins)`, {
              widthPct: 15,
            }),
          ],
        }),
      ],
    }),
    new Paragraph({
      spacing: { before: 100, after: 120 },
      children: [
        new TextRun({
          text: 'KICD Orange Book Approved Reference: ',
          bold: true,
          size: 19,
          font: 'Calibri',
          color: '065F46',
        }),
        new TextRun({
          text: `${coursebook.lbTitle} & ${coursebook.tgTitle} (${coursebook.publisher})`,
          bold: true,
          size: 19,
          font: 'Calibri',
          color: '334155',
        }),
      ],
    }),
  ];

  if (cat === 'Revision Papers & Exams') {
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeDocxCell("LEARNER'S FULL NAME: ____________________________________", {
                bold: true,
                fill: 'F8FAFC',
                widthPct: 55,
              }),
              makeDocxCell('ADM / KNEC NO: ___________________', {
                bold: true,
                fill: 'F8FAFC',
                widthPct: 45,
              }),
            ],
          }),
          new TableRow({
            children: [
              makeDocxCell('STREAM / CLASS: ________________________________________', {
                widthPct: 55,
              }),
              makeDocxCell('RUBRIC: [ ] EE  [ ] ME  [ ] AE  [ ] BE', {
                bold: true,
                widthPct: 45,
              }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 140, after: 80 },
        children: [
          new TextRun({
            text: 'SECTION A & B: COMPETENCY-BASED ASSESSMENT QUESTIONS (EDITABLE)',
            bold: true,
            size: 21,
            font: 'Calibri',
            color: '065F46',
          }),
        ],
      })
    );

    const markingRows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          makeDocxCell('ITEM', { bold: true, fill: '065F46', widthPct: 10 }),
          makeDocxCell('STRAND & SUB-STRAND', { bold: true, fill: '065F46', widthPct: 28 }),
          makeDocxCell('EXPECTED MARKING POINTS & RUBRIC GUIDE', {
            bold: true,
            fill: '065F46',
            widthPct: 47,
          }),
          makeDocxCell('MARKS', { bold: true, fill: '065F46', widthPct: 15 }),
        ],
      }),
    ];

    let qIdx = 1;
    for (const blk of termBlocks) {
      for (const sub of blk.subs) {
        const qA = qIdx++;
        const qB = qIdx++;
        children.push(
          new Paragraph({
            spacing: { before: 90, after: 40 },
            children: [
              new TextRun({
                text: `Question ${qA}. [${blk.strand} — ${sub}] `,
                bold: true,
                size: 19.5,
                font: 'Calibri',
              }),
              new TextRun({
                text: `Identify and explain two key principles or concepts studied under "${sub}" in ${gradeLabel} ${resource.subject}. (4 Marks)`,
                size: 19.5,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: '__________________________________________________________________________________________\n__________________________________________________________________________________________',
                size: 18,
                font: 'Calibri',
                color: '64748B',
              }),
            ],
          }),
          new Paragraph({
            spacing: { before: 70, after: 40 },
            children: [
              new TextRun({
                text: `Question ${qB}. Practical Competency Task: `,
                bold: true,
                size: 19.5,
                font: 'Calibri',
              }),
              new TextRun({
                text: `"${blk.kiq}" Using ${blk.resources.toLowerCase()}, describe two practical applications from your school or community. (6 Marks)`,
                size: 19.5,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: '__________________________________________________________________________________________\n__________________________________________________________________________________________',
                size: 18,
                font: 'Calibri',
                color: '64748B',
              }),
            ],
          })
        );

        markingRows.push(
          new TableRow({
            children: [
              makeDocxCell(`Q${qA}`, { bold: true, widthPct: 10 }),
              makeDocxCell(`${blk.strand}\n${sub}`, { widthPct: 28 }),
              makeDocxCell(
                `Award 2 marks each for any two accurate explanations/concepts on "${sub}" aligned to ${coursebook.lbShort}.`,
                { widthPct: 47 }
              ),
              makeDocxCell('4 Marks', { bold: true, widthPct: 15 }),
            ],
          }),
          new TableRow({
            children: [
              makeDocxCell(`Q${qB}`, { bold: true, fill: 'F8FAFC', widthPct: 10 }),
              makeDocxCell(`${blk.strand}\n${sub}`, { fill: 'F8FAFC', widthPct: 28 }),
              makeDocxCell(
                `Award 3 marks per contextual Kenyan application addressing "${blk.kiq}" using ${blk.resources.toLowerCase()} (EE: 5-6; ME: 3-4; AE: 2; BE: 0-1).`,
                { fill: 'F8FAFC', widthPct: 47 }
              ),
              makeDocxCell('6 Marks', { bold: true, fill: 'F8FAFC', widthPct: 15 }),
            ],
          })
        );
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 180, after: 80 },
        children: [
          new TextRun({
            text: 'OFFICIAL MARKING SCHEME & CBC RUBRIC SCORING GUIDE',
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '065F46',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: markingRows,
      })
    );
  } else if (cat === "Teachers' Notes") {
    let unitNum = 1;
    for (const blk of termBlocks) {
      for (const sub of blk.subs) {
        const notes = buildDomainLessonNotes({
          grade: gradeKey === 'PP1' || gradeKey === 'PP2' ? gradeKey : resource.grade,
          subject: resource.subject,
          strand: blk.strand,
          baseSubstrand: sub,
          aspect: sub,
          phaseTag: 'Core Concept & Classroom Practice',
          kiq: blk.kiq,
          resources: blk.resources,
          lbCitation: coursebook.lbShort,
          tgCitation: coursebook.tgShort,
          isKiswahili: coursebook.isKiswahili,
        });

        children.push(
          new Paragraph({
            spacing: { before: 130, after: 45 },
            children: [
              new TextRun({
                text: `UNIT ${unitNum++}: ${sub.toUpperCase()} (${blk.strand})`,
                bold: true,
                size: 21,
                font: 'Calibri',
                color: '065F46',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 35 },
            children: [
              new TextRun({ text: 'Key Inquiry Question: ', bold: true, size: 19, font: 'Calibri' }),
              new TextRun({ text: `${blk.kiq}  |  `, size: 19, font: 'Calibri' }),
              new TextRun({ text: 'Teaching Aids: ', bold: true, size: 19, font: 'Calibri' }),
              new TextRun({ text: blk.resources, size: 19, font: 'Calibri' }),
            ],
          }),
          ...notes.coreConceptNotes.map(
            (line) =>
              new Paragraph({
                spacing: { after: 30 },
                children: [new TextRun({ text: line, size: 19, font: 'Calibri' })],
              })
          ),
          new Paragraph({
            spacing: { before: 30, after: 30 },
            children: [
              new TextRun({
                text: 'Worked Classroom Illustration: ',
                bold: true,
                size: 19,
                font: 'Calibri',
                color: '0F766E',
              }),
              new TextRun({ text: notes.workedIllustration, size: 19, font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 30 },
            children: [
              new TextRun({
                text: 'Guided Learner Activity: ',
                bold: true,
                size: 19,
                font: 'Calibri',
              }),
              new TextRun({ text: notes.learnerPracticeTask, size: 19, font: 'Calibri' }),
            ],
          }),
          new Paragraph({
            spacing: { after: 65 },
            children: [
              new TextRun({
                text: 'Formative Check Question: ',
                bold: true,
                size: 19,
                font: 'Calibri',
              }),
              new TextRun({ text: notes.checkQuestion, italics: true, size: 19, font: 'Calibri' }),
            ],
          })
        );
      }
    }
  } else {
    // Holiday Assignments & Full-Year Curriculum Designs Editable Table
    const rows: TableRow[] = [
      new TableRow({
        tableHeader: true,
        children: [
          makeDocxCell('STRAND', { bold: true, fill: '065F46', widthPct: 22 }),
          makeDocxCell('SUB-STRAND / TOPIC', { bold: true, fill: '065F46', widthPct: 28 }),
          makeDocxCell('KEY INQUIRY QUESTION & LEARNER TASK', {
            bold: true,
            fill: '065F46',
            widthPct: 32,
          }),
          makeDocxCell('KICD RESOURCES', { bold: true, fill: '065F46', widthPct: 18 }),
        ],
      }),
    ];

    for (const blk of termBlocks) {
      for (const sub of blk.subs) {
        rows.push(
          new TableRow({
            children: [
              makeDocxCell(blk.strand, { bold: true, widthPct: 22 }),
              makeDocxCell(sub, { widthPct: 28 }),
              makeDocxCell(
                `Inquiry: ${blk.kiq}\nTask: Summarize key points from ${coursebook.lbShort} across ${totalWeeks} weeks and complete practical portfolio check.`,
                { widthPct: 32 }
              ),
              makeDocxCell(`${blk.resources}\n(${coursebook.lbShort})`, { widthPct: 18 }),
            ],
          })
        );
      }
    }

    children.push(
      new Paragraph({
        spacing: { before: 100, after: 70 },
        children: [
          new TextRun({
            text:
              resource.term === 0
                ? 'EDITABLE FULL-YEAR KICD RATIONALIZED CURRICULUM MATRIX (TERMS 1, 2 & 3)'
                : `EDITABLE ${termLabel.toUpperCase()} HOLIDAY REVISION WORKBOOK & HOME PROJECT`,
            bold: true,
            size: 21,
            font: 'Calibri',
            color: '065F46',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows,
      })
    );
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: { margin: { top: 720, right: 720, bottom: 720, left: 720 } },
        },
        children,
      },
    ],
  });

  return Buffer.from(await Packer.toBuffer(doc));
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const checkoutRequestId = searchParams.get('checkoutRequestId');
  const targetFormat = (searchParams.get('format') || 'docx').toLowerCase();

  try {

    if (!checkoutRequestId) {
      return NextResponse.json(
        { error: 'checkoutRequestId is required' },
        { status: 400 }
      );
    }

    const { data: order, error: orderErr } = await supabaseAdmin
      .from('orders')
      .select('status, resource_id')
      .eq('checkout_request_id', checkoutRequestId)
      .single();

    if (orderErr || !order || order.status !== 'COMPLETED' || !order.resource_id) {
      return NextResponse.json(
        { error: 'Valid completed order required to download' },
        { status: 403 }
      );
    }

    const { data: resource, error: resErr } = await supabaseAdmin
      .from('resources')
      .select('*')
      .eq('id', order.resource_id)
      .single();

    if (resErr || !resource) {
      return NextResponse.json({ error: 'Resource not found' }, { status: 404 });
    }

    const safeBaseName = String(resource.file_path || resource.title || 'CBC_Material')
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-zA-Z0-9_-]+/g, '_');

    if (targetFormat === 'pdf') {
      // If stored file is already PDF, sign and redirect
      if (resource.file_path && resource.file_path.toLowerCase().endsWith('.pdf')) {
        const { data: signed } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .createSignedUrl(resource.file_path, 3600, { download: true });
        if (signed?.signedUrl) {
          return NextResponse.redirect(signed.signedUrl);
        }
      }

      // Download DOCX from storage and convert to Print-Ready PDF
      let docxBuf: Buffer | null = null;
      if (resource.file_path && !resource.file_path.startsWith('http')) {
        const { data: blob } = await supabaseAdmin.storage
          .from(BUCKET_NAME)
          .download(resource.file_path);
        if (blob) {
          docxBuf = Buffer.from(await blob.arrayBuffer());
        }
      }

      const pdfBuffer = await buildPrintPdfFromDocx(docxBuf, resource);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeBaseName}_Print_Ready.pdf"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    // Target format === 'docx'
    const normCat = normalizeCategory(resource.category);
    if (
      normCat === 'CBC GRADE UP (50-Page Books)' ||
      normCat === 'SUPER-LIGHT CBC COMPILATION (50p)' ||
      normCat === 'SMART CBC ALL SUBJECTS (100p)'
    ) {
      const gKey = getResourceGradeKey(resource);
      const bookType =
        normCat === 'SUPER-LIGHT CBC COMPILATION (50p)'
          ? 'MADE_FAMILIAR'
          : normCat === 'SMART CBC ALL SUBJECTS (100p)'
            ? 'COMPLETE_BUNDLE'
            : 'GRADE_UP';
      const bookDocx = await generateCbcBookDocxBuffer({
        bookType,
        gradeKey: gKey,
        subject: resource.subject || 'Mathematics',
      });
      return new NextResponse(new Uint8Array(bookDocx), {
        status: 200,
        headers: {
          'Content-Type':
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          'Content-Disposition': `attachment; filename="${safeBaseName}_Editable.docx"`,
          'Cache-Control': 'no-store',
        },
      });
    }

    if (resource.file_path && resource.file_path.toLowerCase().endsWith('.docx')) {
      const { data: signed } = await supabaseAdmin.storage
        .from(BUCKET_NAME)
        .createSignedUrl(resource.file_path, 3600, { download: true });
      if (signed?.signedUrl) {
        return NextResponse.redirect(signed.signedUrl);
      }
    }

    const docxBuffer = await buildEditableDocxForResource(resource);
    return new NextResponse(new Uint8Array(docxBuffer), {
      status: 200,
      headers: {
        'Content-Type':
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeBaseName}_Editable.docx"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Companion download error';
    console.error('Companion download error:', message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
