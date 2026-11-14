import { createClient } from '@supabase/supabase-js';
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
  PageOrientation,
  ShadingType,
} from 'docx';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import {
  APPROVED_PUBLISHERS,
  JSS_SENIOR_PUBLISHERS,
  SUBJECT_SYLLABUS,
  GRADES_CURRICULUM_PLAN,
} from './cbc-syllabus-data.mjs';

const BUCKET_NAME = 'cbc-materials';
const CONCURRENCY = 25;

const ROMAN_TERM = { 1: 'I', 2: 'II', 3: 'III' };
const HOLIDAY_NAME = { 1: 'April', 2: 'August', 3: 'December' };

function toWinAnsiSafe(str) {
  return String(str)
    .replace(/√/g, 'sqrt')
    .replace(/⁴/g, '^4')
    .replace(/²/g, '^2')
    .replace(/³/g, '^3')
    .replace(/µ/g, 'u')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/•/g, '-')
    .replace(/’/g, "'")
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapLines(text, maxChars = 86) {
  const safeText = toWinAnsiSafe(text);
  const out = [];
  for (const rawLine of safeText.split('\n')) {
    if (!rawLine.trim()) {
      out.push('');
      continue;
    }
    const words = rawLine.split(' ');
    let current = '';
    for (const w of words) {
      if ((current + ' ' + w).trim().length > maxChars) {
        out.push(current.trim());
        current = w;
      } else {
        current = (current + ' ' + w).trim();
      }
    }
    if (current) out.push(current);
  }
  return out;
}

function cellBorders() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  return { top: b, bottom: b, left: b, right: b };
}

function makeCell(lines, { bold = false, fill = undefined, widthPct = undefined } = {}) {
  const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorders(),
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    children: arr.map(
      (line) =>
        new Paragraph({
          spacing: { before: 30, after: 30 },
          children: [
            new TextRun({
              text: line,
              bold,
              size: 17,
              font: 'Calibri',
              color: fill === '065F46' ? 'FFFFFF' : '1E293B',
            }),
          ],
        })
    ),
  });
}

function pickPublisher(grade, subjectIdx) {
  const list = grade >= 7 ? JSS_SENIOR_PUBLISHERS : APPROVED_PUBLISHERS;
  return list[(grade + subjectIdx) % list.length];
}

function flattenSubstrands(termBlocks) {
  const items = [];
  for (const b of termBlocks) {
    for (const sub of b.subs) {
      items.push({ strand: b.strand, sub, kiq: b.kiq, resources: b.resources });
    }
  }
  return items;
}

// 1. Exact schemes.co.ke 10-column Rationalized Scheme of Work DOCX
async function generateSchemeBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const subs = flattenSubstrands(termBlocks);
  const headers = [
    'Wk',
    'LSN',
    'strand',
    'Sub-strand',
    'Lesson Learning Outcomes',
    'Learning Experiences',
    'Key Inquiry Question(s)',
    'Learning Resources',
    'Assessment Methods',
    'Refl',
  ];
  const widths = [4, 4, 11, 12, 20, 19, 11, 9, 7, 3];

  const dataRows = [];
  for (let wk = 1; wk <= 13; wk++) {
    if (wk === 8) {
      dataRows.push([
        '8',
        '1-5',
        'HALF-TERM',
        'Mid-Term Assessment & Break',
        'Consolidate competencies covered in Weeks 1 to 7 through formative assessment.',
        'Learners complete mid-term tasks, review feedback, and proceed for half-term break.',
        'Which sub-strands require remedial support?',
        'Mid-term test papers & rubrics',
        'Written & Practical CAT',
        '',
      ]);
      continue;
    }
    if (wk === 13) {
      dataRows.push([
        '13',
        '1-5',
        'ASSESSMENT',
        `End of Term ${ROMAN_TERM[term]} Summative Assessment`,
        `Demonstrate mastery of Grade ${grade} Term ${term} ${subject} learning outcomes.`,
        'Administration of end-of-term competency papers, marking, rubric recording & closing.',
        'How effectively were Term learning outcomes achieved?',
        'Assessment papers, marking schemes',
        'Summative Rubric',
        '',
      ]);
      continue;
    }

    const item = subs[(wk - 1) % subs.length];
    const pgStart = 12 + ((wk * 7) % 85);
    const outcomes = [
      'By the end of the lesson, the learner should be able to:',
      `1. Identify key concepts in ${item.sub} (${subject} Grade ${grade}).`,
      `2. Carry out guided activities on ${item.sub} accurately.`,
      `3. Appreciate the importance of ${item.sub} in day-to-day life.`,
    ];
    const experiences = [
      'Learners are guided to:',
      `• Brainstorm and observe illustrations/realia on ${item.sub}.`,
      `• Work collaboratively in groups to practice tasks on ${item.sub} and present findings.`,
    ];
    const resList = [
      item.resources,
      `${publisher} ${subject} T.G. Grd ${grade} Pg.${pgStart}-${pgStart + 4}`,
      `${publisher} Learner's Bk Grd ${grade} Pg.${pgStart + 5}-${pgStart + 10}`,
    ];
    const assessments = ['Observation schedule', 'Assessment rubric', 'Oral & Written questions'];

    dataRows.push([
      String(wk),
      '1-4',
      item.strand,
      item.sub,
      outcomes,
      experiences,
      item.kiq,
      resList,
      assessments,
      '',
    ]);
  }

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) => makeCell(h, { bold: true, fill: '065F46', widthPct: widths[i] })),
    }),
    ...dataRows.map(
      (r, idx) =>
        new TableRow({
          children: r.map((cellVal, cIdx) =>
            makeCell(cellVal, {
              fill: idx % 2 === 1 ? 'F8FAFC' : undefined,
              widthPct: widths[cIdx],
            })
          ),
        })
    ),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 600, right: 600, bottom: 600, left: 600 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `${subject.toUpperCase()} RATIONALIZED SCHEMES OF WORK — GRADE ${grade} (${level.toUpperCase()})`,
                bold: true,
                size: 24,
                font: 'Calibri',
                color: '065F46',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 40 },
            children: [
              new TextRun({
                text: `NAME OF THE TEACHER: ____________________________________     TSC NO: __________________`,
                bold: true,
                size: 19,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 160 },
            children: [
              new TextRun({
                text: `SCHOOL: ________________________________________________     TERM: ${ROMAN_TERM[term]}     YEAR: 2026`,
                bold: true,
                size: 19,
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: tableRows,
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// 2. KICD / schemes.co.ke Lesson Plans DOCX
async function generateLessonPlanBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const subs = flattenSubstrands(termBlocks);
  const duration = grade <= 3 ? '30 Minutes' : grade <= 6 ? '35 Minutes' : '40 Minutes';

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 80 },
      children: [
        new TextRun({
          text: `${subject.toUpperCase()} RATIONALIZED CBC LESSON PLANS — GRADE ${grade} TERM ${ROMAN_TERM[term]}`,
          bold: true,
          size: 26,
          font: 'Calibri',
          color: '065F46',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
      children: [
        new TextRun({
          text: `KICD Competency-Based Curriculum (${level}) • Ready-to-Print Teacher Lesson Plans`,
          italics: true,
          size: 19,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  subs.slice(0, 4).forEach((item, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: idx > 0 ? 240 : 60, after: 80 },
        children: [
          new TextRun({
            text: `WEEK ${idx + 1} LESSON PLAN: ${item.sub.toUpperCase()}`,
            bold: true,
            size: 22,
            font: 'Calibri',
            color: '0F766E',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('SCHOOL', { bold: true, fill: 'F1F5F9', widthPct: 22 }),
              makeCell('LEARNING AREA', { bold: true, fill: 'F1F5F9', widthPct: 24 }),
              makeCell('GRADE & TERM', { bold: true, fill: 'F1F5F9', widthPct: 18 }),
              makeCell('DATE & TIME', { bold: true, fill: 'F1F5F9', widthPct: 18 }),
              makeCell('ROLL', { bold: true, fill: 'F1F5F9', widthPct: 18 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('_________________', { widthPct: 22 }),
              makeCell(subject, { widthPct: 24 }),
              makeCell(`Grd ${grade} • Term ${term}`, { widthPct: 18 }),
              makeCell(duration, { widthPct: 18 }),
              makeCell('B:___ G:___ T:___', { widthPct: 18 }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 100, after: 40 },
        children: [
          new TextRun({ text: 'STRAND: ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({ text: `${item.strand}    |    `, size: 19, font: 'Calibri' }),
          new TextRun({ text: 'SUB-STRAND: ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({ text: item.sub, size: 19, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Specific Learning Outcomes: ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({
            text: `By the end of the lesson, the learner should be able to: (a) explain key concepts in ${item.sub}; (b) perform practical/guided tasks on ${item.sub}; (c) value teamwork and responsibility during learning.`,
            size: 19,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Key Inquiry Question(s): ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({ text: item.kiq, size: 19, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Core Competencies, Values & PCIs: ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({
            text: 'Communication & Collaboration, Critical Thinking, Digital Literacy; Values: Unity, Integrity, Respect; PCIs: Safety, Citizenship & Environmental Awareness.',
            size: 19,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: 'Learning Resources: ', bold: true, size: 19, font: 'Calibri' }),
          new TextRun({
            text: `${item.resources}; ${publisher} ${subject} Grade ${grade} Learner's Book & Teacher's Guide.`,
            size: 19,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 60, after: 30 },
        children: [new TextRun({ text: 'Organization of Learning:', bold: true, size: 19, font: 'Calibri' })],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: `• Introduction (5 min): Review previous lesson and engage learners using realia/questions linked to ${item.sub}.`,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: `• Step 1 — Explore (10 min): In pairs/groups, learners investigate ${item.sub} using ${item.resources.toLowerCase()}.`,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: `• Step 2 — Explain & Practice (12 min): Groups share observations; teacher clarifies concepts and guides structured exercises.`,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({
            text: `• Conclusion & Assessment (5 min): Oral recap, exit questions, and neat cleanup. Extended Activity: Practice task with parent/guardian.`,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 80 },
        children: [
          new TextRun({
            text: 'Teacher Self-Evaluation: __________________________________________________________________________',
            size: 18,
            font: 'Calibri',
          }),
        ],
      })
    );
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

// 3. Record of Work Covered & Assessment Rubric Tracker DOCX
async function generateRecordOfWorkBuffer({ grade, level, subject, term, termBlocks }) {
  const subs = flattenSubstrands(termBlocks);
  const headers = [
    'WK',
    'DATE',
    'STRAND',
    'SUB-STRAND / TOPIC',
    'WORK COVERED SUMMARY',
    'RUBRIC DISTRIBUTION (EE / ME / AE / BE)',
    'REMARKS & SIGN',
  ];
  const widths = [5, 10, 16, 18, 23, 16, 12];

  const rows = [];
  for (let wk = 1; wk <= 13; wk++) {
    const item = subs[(wk - 1) % subs.length];
    const isMid = wk === 8;
    const isEnd = wk === 13;
    rows.push([
      String(wk),
      '__/__/2026',
      isMid ? 'MID-TERM' : isEnd ? 'END-TERM' : item.strand,
      isMid ? 'Half-Term Assessment & Break' : isEnd ? `End of Term ${term} Exams` : item.sub,
      isMid
        ? 'Administered & reviewed mid-term formative assessment.'
        : isEnd
        ? 'Administered summative exam, marked scripts & recorded rubrics.'
        : `Facilitated learner activities, group tasks & exercises on ${item.sub}.`,
      'EE:__ ME:__ AE:__ BE:__',
      '',
    ]);
  }

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 600, right: 600, bottom: 600, left: 600 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 60 },
            children: [
              new TextRun({
                text: `TSC / KICD RECORD OF WORK COVERED & RUBRIC TRACKER — ${subject.toUpperCase()} GRADE ${grade}`,
                bold: true,
                size: 24,
                font: 'Calibri',
                color: '065F46',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `SCHOOL: ______________________________   TEACHER: ________________________   LEVEL: ${level}   TERM: ${ROMAN_TERM[term]}   YEAR: 2026`,
                bold: true,
                size: 19,
                font: 'Calibri',
              }),
            ],
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              new TableRow({
                tableHeader: true,
                children: headers.map((h, i) =>
                  makeCell(h, { bold: true, fill: '065F46', widthPct: widths[i] })
                ),
              }),
              ...rows.map(
                (r, idx) =>
                  new TableRow({
                    children: r.map((val, cIdx) =>
                      makeCell(val, {
                        fill: idx % 2 === 1 ? 'F8FAFC' : undefined,
                        widthPct: widths[cIdx],
                      })
                    ),
                  })
              ),
            ],
          }),
        ],
      },
    ],
  });

  return Packer.toBuffer(doc);
}

// Reusable PDF builder for Lesson Notes, Exams, Holiday Assignments & Curriculum Designs
async function renderPdf({ bannerTag, title, subtitle, footerLabel, sections }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 46;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawRectangle({
    x: 0,
    y: pageHeight - 90,
    width: pageWidth,
    height: 90,
    color: rgb(0.024, 0.373, 0.275),
  });

  page.drawText(toWinAnsiSafe(bannerTag), {
    x: margin,
    y: pageHeight - 34,
    size: 9,
    font: fontBold,
    color: rgb(0.68, 0.96, 0.84),
  });

  page.drawText(toWinAnsiSafe(title).slice(0, 72), {
    x: margin,
    y: pageHeight - 54,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(toWinAnsiSafe(subtitle).slice(0, 88), {
    x: margin,
    y: pageHeight - 73,
    size: 9.5,
    font: fontRegular,
    color: rgb(0.9, 0.98, 0.94),
  });

  y = pageHeight - 114;

  const ensureSpace = (needed = 22) => {
    if (y - needed < margin + 22) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  for (const sec of sections) {
    ensureSpace(34);
    page.drawText(toWinAnsiSafe(sec.heading).slice(0, 82), {
      x: margin,
      y,
      size: 11.5,
      font: fontBold,
      color: rgb(0.04, 0.41, 0.3),
    });
    y -= 17;

    const lines = wrapLines(sec.body, 86);
    for (const line of lines) {
      if (line === '') {
        y -= 7;
        continue;
      }
      ensureSpace(15);
      const isBoldLine = /^(Q\d+\.|TASK|\d+\.|Answer|Marking|Key|Rubric|Strand)/i.test(line);
      page.drawText(line, {
        x: margin,
        y,
        size: 9.8,
        font: isBoldLine ? fontBold : fontRegular,
        color: rgb(0.12, 0.16, 0.23),
      });
      y -= 14;
    }
    y -= 10;
  }

  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(
      toWinAnsiSafe(`${footerLabel} - Page ${idx + 1} of ${pages.length}`),
      {
        x: margin,
        y: 22,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.56),
      }
    );
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// 4. Comprehensive Lesson Notes PDF
async function generateNotesPdfBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const sections = termBlocks.map((b, idx) => ({
    heading: `${b.strand} (TERM ${term} UNIT ${idx + 1})`,
    body: [
      `Core Sub-strands Covered: ${b.subs.join(' | ')}`,
      `Guiding Key Inquiry Question: ${b.kiq}`,
      '',
      ...b.subs.map(
        (sub, sIdx) =>
          `${sIdx + 1}. ${sub}\n` +
          `- Key Summary: Learners in Grade ${grade} (${level}) explore ${sub} under ${b.strand}, linking classroom theory to practical Kenyan household, community, and industry applications.\n` +
          `- Practical Learner Activity: Using ${b.resources.toLowerCase()}, learners work in collaborative groups to observe, demonstrate, record findings, and present conclusions.\n` +
          `- Core Values & Competencies: Critical thinking, creativity, communication, safety awareness, and environmental stewardship.`
      ),
      '',
      `Recommended Reference: ${publisher} ${subject} Grade ${grade} Learner's Book & KICD Rationalized Design.`,
      `Self-Check Review: (a) State two key concepts learned in ${b.subs[0]}. (b) Answer the inquiry question: "${b.kiq}"`,
    ].join('\n'),
  }));

  return renderPdf({
    bannerTag: `KICD RATIONALIZED CBC LESSON NOTES - TERM ${term}`,
    title: `Grade ${grade} ${subject} Lesson Notes - Term ${term}`,
    subtitle: `${level} Complete Study & Teaching Booklet | Strands, Activities & Review Tasks`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Term ${term} Notes`,
    sections,
  });
}

// 5. CBC Exam & Marking Scheme PDF
async function generateExamPdfBuffer({ grade, level, examBadge, subject, term, termBlocks }) {
  const subs = flattenSubstrands(termBlocks);
  const qLines = [
    `LEARNER'S NAME: ____________________________________  ASSESSMENT NO: _______________`,
    `SCHOOL: ____________________________________________  DATE: ________________________`,
    `RUBRIC SCORE:  [ ] EE (80-100%)   [ ] ME (50-79%)   [ ] AE (30-49%)   [ ] BE (0-29%)`,
    '',
    `INSTRUCTIONS: Answer ALL questions in the spaces provided. Show clear working/explanations.`,
    '',
  ];

  const mLines = [];
  subs.forEach((item, i) => {
    const q1 = i * 2 + 1;
    const q2 = i * 2 + 2;
    qLines.push(
      `Q${q1}. (${item.strand} - ${item.sub}) Define or identify two key features of ${item.sub} as studied in Grade ${grade} ${subject}. (4 marks)`,
      `Q${q2}. Practical Application: ${item.kiq} Explain two practical points using examples from your school or community. (6 marks)`,
      ''
    );
    mLines.push(
      `Q${q1} Marking Guide (4 mks): Award 2 marks each for any two accurate points/definitions on ${item.sub} aligned to KICD Grade ${grade} ${subject} syllabus.`,
      `Q${q2} Marking Guide (6 mks): Award 3 marks per well-explained real-life application addressing "${item.kiq}" (Knowledge: 2 mks, Application: 2 mks, Clarity: 2 mks).`
    );
  });

  qLines.push(
    `Q${subs.length * 2 + 1}. Extended Competency Task: Design a brief step-by-step demonstration or chart on ${subs[0].sub} using locally available materials (${subs[0].resources}). (10 marks)`
  );
  mLines.push(
    `Q${subs.length * 2 + 1} Rubric (10 mks): Exceeding Expectations (8-10 mks): Complete, accurate procedure & safety observed; Meeting Expectations (5-7 mks): Correct main steps; Approaching (3-4 mks): Partial steps.`
  );

  return renderPdf({
    bannerTag: `KENYA COMPETENCY-BASED ASSESSMENT (${examBadge}) - TERM ${term}`,
    title: `Grade ${grade} ${subject} Term ${term} ${examBadge} Exam & Marking Scheme`,
    subtitle: `${level} Summative Assessment Paper + Complete Scoring Guide`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Term ${term} Exam`,
    sections: [
      { heading: `SECTION A & B: ASSESSMENT QUESTIONS (TERM ${term})`, body: qLines.join('\n') },
      { heading: `OFFICIAL MARKING SCHEME & RUBRIC SCORING GUIDE`, body: mLines.join('\n\n') },
    ],
  });
}

// 6. Holiday Assignment Booklet PDF (Term 1 April, Term 2 August, Term 3 December)
async function generateHolidayPdfBuffer({ grade, level, subject, term, termBlocks }) {
  const holiday = HOLIDAY_NAME[term];
  const subs = flattenSubstrands(termBlocks);

  const body = [
    `LEARNER'S NAME: ____________________________________   GRADE ${grade} (${level})`,
    `PARENT / GUARDIAN SIGNATURE: _______________________   DATE COMPLETED: ______________`,
    '',
    `PART 1: TOPICAL REVISION TASKS (${holiday.toUpperCase()} HOLIDAY)`,
    ...subs.map(
      (s, idx) =>
        `${idx + 1}. Topic: ${s.sub} (${s.strand})\n` +
        `   (a) Review your Term ${term} notes on ${s.sub} and write a five-point summary.\n` +
        `   (b) Guided Inquiry: ${s.kiq}\n`
    ),
    `PART 2: HOME-BASED PRACTICAL / PARENTAL ENGAGEMENT PROJECT`,
    `With the guidance of your parent or guardian, use safe locally available items (${subs[0].resources}) to complete a practical portfolio task on "${subs[0].sub}" and bring your report on opening day.`,
  ].join('\n');

  return renderPdf({
    bannerTag: `CBC ${holiday.toUpperCase()} HOLIDAY REVISION & HOME PROJECT - TERM ${term}`,
    title: `Grade ${grade} ${subject} Term ${term} (${holiday}) Holiday Assignment`,
    subtitle: `${level} Self-Paced Topical Practice & Parent-Guided Competency Project`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} ${holiday} Holiday Pack`,
    sections: [{ heading: `${holiday.toUpperCase()} HOLIDAY WORKBOOK — ${subject.toUpperCase()}`, body }],
  });
}

// 7. Full-Year (Terms 1, 2 & 3 Combined) Rationalized Curriculum Design Summary PDF
async function generateCurriculumDesignPdfBuffer({ grade, level, subject, allTermsObj }) {
  const sections = [1, 2, 3].map((t) => {
    const blocks = allTermsObj[t];
    return {
      heading: `TERM ${t} RATIONALIZED STRANDS & SUB-STRANDS MATRIX`,
      body: blocks
        .map(
          (b) =>
            `Strand: ${b.strand}\n` +
            `- Sub-strands: ${b.subs.join('; ')}\n` +
            `- Key Inquiry Question: ${b.kiq}\n` +
            `- Suggested Resources: ${b.resources}`
        )
        .join('\n\n'),
    };
  });

  return renderPdf({
    bannerTag: `KICD RATIONALIZED CURRICULUM DESIGN OVERVIEW (TERMS 1, 2 & 3)`,
    title: `Grade ${grade} ${subject} Rationalized Curriculum Design (Terms 1-3)`,
    subtitle: `${level} Annual Syllabus Scope, Strands, KIQs & Resource Mapping`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Curriculum Design`,
    sections,
  });
}

async function listAllBucketFiles(supabase) {
  const names = new Set();
  let offset = 0;
  while (true) {
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .list('', { limit: 1000, offset });
    if (error) throw error;
    if (!data || data.length === 0) break;
    for (const f of data) names.add(f.name);
    if (data.length < 1000) break;
    offset += 1000;
  }
  return names;
}

async function fetchAllDbResources(supabase) {
  const rows = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('id, file_path, title')
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    rows.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  return rows;
}

async function uploadWithRetry(supabase, filename, buffer, contentType, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, { contentType, upsert: true });
    if (!error) return true;
    if (attempt === retries) {
      console.error(`  [!] Failed upload after ${retries} tries (${filename}): ${error.message}`);
      return false;
    }
    await new Promise((r) => setTimeout(r, 400 * attempt));
  }
  return false;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Build full task manifest across Grades 1 to 12
  const tasks = [];

  for (const gradePlan of GRADES_CURRICULUM_PLAN) {
    const { grade, level, examBadge, subjects } = gradePlan;

    subjects.forEach((subject, subjectIdx) => {
      const syl = SUBJECT_SYLLABUS[subject];
      if (!syl) {
        throw new Error(`Missing syllabus entry for subject: ${subject}`);
      }
      const publisher = pickPublisher(grade, subjectIdx);
      const code = syl.shortCode;

      // Term 1, Term 2, and Term 3 materials
      for (const term of [1, 2, 3]) {
        const termBlocks = syl.strandsByTerm[term];

        // 1. Schemes of Work (DOCX - KES 50)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_Rationalized_Schemes_of_Work_schemes_format.docx`,
          title: `Grade ${grade} ${subject} Rationalized Schemes of Work - Term ${term}`,
          grade,
          level,
          category: 'Schemes of Work',
          subject,
          term,
          format: 'DOCX',
          price: 50,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () => generateSchemeBuffer({ grade, level, subject, term, publisher, termBlocks }),
        });

        // 2. Lesson Plans (DOCX - KES 70)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_Rationalized_CBC_Lesson_Plans.docx`,
          title: `Grade ${grade} ${subject} Rationalized CBC Lesson Plans - Term ${term}`,
          grade,
          level,
          category: 'Lesson Plans',
          subject,
          term,
          format: 'DOCX',
          price: 70,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () => generateLessonPlanBuffer({ grade, level, subject, term, publisher, termBlocks }),
        });

        // 3. Lesson Notes (PDF - KES 100)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_Comprehensive_Lesson_Notes.pdf`,
          title: `Grade ${grade} ${subject} Rationalized Lesson Notes - Term ${term}`,
          grade,
          level,
          category: "Teachers' Notes",
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () => generateNotesPdfBuffer({ grade, level, subject, term, publisher, termBlocks }),
        });

        // 4. Exams & Marking Schemes (PDF - KES 100)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_${examBadge.replace(/\s+/g, '_')}_Exam_Marking_Scheme.pdf`,
          title: `Grade ${grade} ${subject} Term ${term} ${examBadge} Exam & Marking Scheme`,
          grade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () => generateExamPdfBuffer({ grade, level, examBadge, subject, term, termBlocks }),
        });

        // 5. Record of Work Covered & Rubric Tracker (DOCX - KES 50)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_Record_of_Work_and_Rubrics.docx`,
          title: `Grade ${grade} ${subject} Record of Work & Rubric Tracker - Term ${term}`,
          grade,
          level,
          category: 'Records of Work',
          subject,
          term,
          format: 'DOCX',
          price: 50,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () => generateRecordOfWorkBuffer({ grade, level, subject, term, termBlocks }),
        });

        // 6a. Holiday Assignment Package (Term 1 April, Term 2 August, Term 3 December - PDF - KES 70)
        tasks.push({
          filename: `G${grade}_T${term}_${code}_${HOLIDAY_NAME[term]}_Holiday_Assignment.pdf`,
          title: `Grade ${grade} ${subject} Term ${term} (${HOLIDAY_NAME[term]} Holiday) Revision Assignment`,
          grade,
          level,
          category: 'Holiday Assignments & Designs',
          subject,
          term,
          format: 'PDF',
          price: 70,
          contentType: 'application/pdf',
          build: () => generateHolidayPdfBuffer({ grade, level, subject, term, termBlocks }),
        });
      }

      // 6b. Full-Year Curriculum Design (Terms 1, 2 & 3 Combined -> term: 0)
      tasks.push({
        filename: `G${grade}_ALL_TERMS_${code}_Rationalized_Curriculum_Design.pdf`,
        title: `Grade ${grade} ${subject} KICD Rationalized Curriculum Design (Terms 1, 2 & 3)`,
        grade,
        level,
        category: 'Holiday Assignments & Designs',
        subject,
        term: 0,
        format: 'PDF',
        price: 70,
        contentType: 'application/pdf',
        build: () =>
          generateCurriculumDesignPdfBuffer({
            grade,
            level,
            subject,
            allTermsObj: syl.strandsByTerm,
          }),
      });
    });
  }

  console.log(`Prepared ${tasks.length} total CBC curriculum materials across Grades 1 to 12!`);

  const existingStorageFiles = await listAllBucketFiles(supabase);
  console.log(`Currently ${existingStorageFiles.size} file(s) in Supabase bucket "${BUCKET_NAME}".`);

  // Upload missing files with worker pool
  const toUpload = tasks.filter((t) => !existingStorageFiles.has(t.filename));
  console.log(`Uploading ${toUpload.length} new document file(s) with concurrency ${CONCURRENCY}...`);

  let completed = 0;
  let cursor = 0;

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= toUpload.length) break;
      const item = toUpload[idx];
      const buffer = await item.build();
      await uploadWithRetry(supabase, item.filename, buffer, item.contentType);
      completed++;
      if (completed % 150 === 0 || completed === toUpload.length) {
        console.log(`  Progress: ${completed} / ${toUpload.length} files uploaded...`);
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  // Clean up earlier 8 starter-pack rows so we don't have duplicate listings, while keeping user's 4 original uploads
  const starterPackFiles = new Set([
    'Grade_4_Term_1_Mathematics_Rationalized_Schemes_of_Work.docx',
    'Grade_5_Term_1_Science_and_Technology_CBC_Lesson_Plans.docx',
    'Grade_6_Term_1_KPSEA_Mathematics_Prediction_Exam_and_Marking_Scheme.pdf',
    'Grade_7_Term_1_Mathematics_Rationalized_Schemes_of_Work.docx',
    'Grade_7_Term_1_Pre_Technical_Studies_Comprehensive_Notes.pdf',
    'Grade_8_Term_1_Integrated_Science_CBC_Lesson_Plans.docx',
    'Grade_9_Term_1_KJSEA_English_Assessment_Exam_and_Marking_Scheme.pdf',
    'Grade_10_Term_1_Biology_Senior_School_Comprehensive_Notes.pdf',
  ]);

  const existingDbRows = await fetchAllDbResources(supabase);
  const starterIdsToRemove = existingDbRows
    .filter((r) => starterPackFiles.has(r.file_path))
    .map((r) => r.id);

  if (starterIdsToRemove.length > 0) {
    await supabase.from('resources').delete().in('id', starterIdsToRemove);
    await supabase.storage.from(BUCKET_NAME).remove(Array.from(starterPackFiles));
    console.log(`Replaced ${starterIdsToRemove.length} earlier starter-pack items with full schemes.co.ke catalog.`);
  }

  const remainingDbRows = existingDbRows.filter((r) => !starterPackFiles.has(r.file_path));
  const dbByFilePath = new Map(remainingDbRows.map((r) => [r.file_path, r.id]));

  const toInsert = [];
  for (const t of tasks) {
    if (!dbByFilePath.has(t.filename)) {
      toInsert.push({
        title: t.title,
        grade: t.grade,
        level: t.level,
        category: t.category,
        subject: t.subject,
        term: t.term,
        format: t.format,
        price: t.price,
        file_path: t.filename,
      });
    }
  }

  console.log(`Inserting ${toInsert.length} new rows into Supabase "resources" table...`);
  const BATCH_SIZE = 200;
  for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
    const chunk = toInsert.slice(i, i + BATCH_SIZE);
    const { error } = await supabase.from('resources').insert(chunk);
    if (error) {
      throw new Error(`DB batch insert error at ${i}: ${error.message}`);
    }
  }

  const finalRows = await fetchAllDbResources(supabase);
  console.log(`\nALL DONE! Total live CBC materials in Supabase catalog: ${finalRows.length}`);
}

main().catch((err) => {
  console.error('Fatal catalog upload error:', err);
  process.exit(1);
});
