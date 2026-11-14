import fs from 'node:fs/promises';
import path from 'node:path';
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

const INBOX_DIR = path.resolve(process.cwd(), 'materials-inbox');
const META_DIR = path.join(INBOX_DIR, '_meta');

function cellBorders() {
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'CBD5E1' };
  return { top: b, bottom: b, left: b, right: b };
}

function makeCell(text, { bold = false, fill = undefined, widthPct = undefined } = {}) {
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorders(),
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    children: text.split('\n').map(
      (line) =>
        new Paragraph({
          spacing: { before: 40, after: 40 },
          children: [
            new TextRun({
              text: line,
              bold,
              size: 18,
              font: 'Calibri',
              color: fill === '065F46' ? 'FFFFFF' : '1E293B',
            }),
          ],
        })
    ),
  });
}

async function buildSchemeDocx({ filename, title, grade, level, subject, term, rows, meta }) {
  const headers = [
    'WK',
    'LSN',
    'STRAND',
    'SUB-STRAND',
    'SPECIFIC LEARNING OUTCOMES',
    'LEARNING EXPERIENCES',
    'KEY INQUIRY QUESTIONS',
    'RESOURCES & ASSESSMENT',
  ];
  const widths = [5, 5, 11, 13, 20, 20, 13, 13];

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, idx) =>
        makeCell(h, { bold: true, fill: '065F46', widthPct: widths[idx] })
      ),
    }),
    ...rows.map(
      (r, idx) =>
        new TableRow({
          children: r.map((val, cIdx) =>
            makeCell(String(val), {
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
            margin: { top: 720, right: 720, bottom: 720, left: 720 },
          },
        },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 100 },
            children: [
              new TextRun({
                text: `REPUBLIC OF KENYA — KICD RATIONALIZED CBC CURRICULUM`,
                bold: true,
                size: 22,
                font: 'Calibri',
                color: '065F46',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
            children: [
              new TextRun({
                text: title.toUpperCase(),
                bold: true,
                size: 28,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { after: 220 },
            children: [
              new TextRun({
                text: `SCHOOL: __________________________   TEACHER'S NAME: __________________________   YEAR: 2026   TERM: ${term}`,
                size: 20,
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

  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(path.join(INBOX_DIR, filename), buffer);
  await fs.writeFile(
    path.join(META_DIR, `${filename}.json`),
    JSON.stringify(
      {
        title,
        grade,
        level,
        category: 'Schemes of Work',
        subject,
        term,
        price: 50,
        pageCount: 4,
        ...meta,
      },
      null,
      2
    )
  );
}

async function buildLessonPlansDocx({ filename, title, grade, level, subject, term, lessons, meta }) {
  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 120 },
      children: [
        new TextRun({
          text: title.toUpperCase(),
          bold: true,
          size: 28,
          font: 'Calibri',
          color: '065F46',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
      children: [
        new TextRun({
          text: `CBC 5E Rationalized Lesson Plans • Grade ${grade} (${level}) • Term ${term}`,
          size: 20,
          italics: true,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  lessons.forEach((lsn, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: idx > 0 ? 300 : 80, after: 100 },
        children: [
          new TextRun({
            text: `LESSON PLAN ${idx + 1}: ${lsn.topic}`,
            bold: true,
            size: 24,
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
              makeCell('SCHOOL', { bold: true, fill: 'F1F5F9', widthPct: 20 }),
              makeCell('LEARNING AREA', { bold: true, fill: 'F1F5F9', widthPct: 25 }),
              makeCell('GRADE', { bold: true, fill: 'F1F5F9', widthPct: 15 }),
              makeCell('DATE & TIME', { bold: true, fill: 'F1F5F9', widthPct: 25 }),
              makeCell('ROLL', { bold: true, fill: 'F1F5F9', widthPct: 15 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('________________', { widthPct: 20 }),
              makeCell(subject, { widthPct: 25 }),
              makeCell(`Grade ${grade}`, { widthPct: 15 }),
              makeCell('40 Minutes', { widthPct: 25 }),
              makeCell('B: ___ G: ___', { widthPct: 15 }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 140, after: 60 },
        children: [
          new TextRun({ text: 'STRAND: ', bold: true, size: 20, font: 'Calibri' }),
          new TextRun({ text: `${lsn.strand}   |   `, size: 20, font: 'Calibri' }),
          new TextRun({ text: 'SUB-STRAND: ', bold: true, size: 20, font: 'Calibri' }),
          new TextRun({ text: lsn.substrand, size: 20, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Specific Learning Outcomes: ', bold: true, size: 20, font: 'Calibri' }),
          new TextRun({ text: lsn.outcomes, size: 20, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Key Inquiry Question(s): ', bold: true, size: 20, font: 'Calibri' }),
          new TextRun({ text: lsn.kiq, size: 20, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: 'Core Competencies & Values: ', bold: true, size: 20, font: 'Calibri' }),
          new TextRun({ text: lsn.competencies, size: 20, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { before: 80, after: 40 },
        children: [
          new TextRun({ text: 'Organization of Learning (5E Steps):', bold: true, size: 20, font: 'Calibri' }),
        ],
      }),
      ...lsn.steps.map(
        (step) =>
          new Paragraph({
            spacing: { after: 45 },
            children: [new TextRun({ text: `• ${step}`, size: 19, font: 'Calibri' })],
          })
      ),
      new Paragraph({
        spacing: { before: 60, after: 120 },
        children: [
          new TextRun({
            text: 'Extended Activity & Teacher Self-Evaluation: ',
            bold: true,
            size: 19,
            font: 'Calibri',
          }),
          new TextRun({ text: lsn.extended, size: 19, font: 'Calibri' }),
        ],
      })
    );
  });

  const doc = new Document({ sections: [{ children }] });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(path.join(INBOX_DIR, filename), buffer);
  await fs.writeFile(
    path.join(META_DIR, `${filename}.json`),
    JSON.stringify(
      {
        title,
        grade,
        level,
        category: 'Lesson Plans',
        subject,
        term,
        price: 70,
        pageCount: lessons.length,
        ...meta,
      },
      null,
      2
    )
  );
}

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
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapLines(text, maxChars = 84) {
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

async function buildStructuredPdf({ filename, title, subtitle, grade, level, category, subject, term, price, sections, meta }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 48;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  // Header Banner on Page 1
  page.drawRectangle({
    x: 0,
    y: pageHeight - 92,
    width: pageWidth,
    height: 92,
    color: rgb(0.024, 0.373, 0.275),
  });

  page.drawText('CBC KENYA RESOURCE HUB - KICD RATIONALIZED CURRICULUM', {
    x: margin,
    y: pageHeight - 36,
    size: 9,
    font: fontBold,
    color: rgb(0.65, 0.95, 0.82),
  });

  page.drawText(toWinAnsiSafe(title).slice(0, 68), {
    x: margin,
    y: pageHeight - 56,
    size: 14,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(toWinAnsiSafe(subtitle), {
    x: margin,
    y: pageHeight - 75,
    size: 10,
    font: fontRegular,
    color: rgb(0.9, 0.98, 0.94),
  });

  y = pageHeight - 118;

  const ensureSpace = (needed = 24) => {
    if (y - needed < margin + 24) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  for (const sec of sections) {
    ensureSpace(36);
    page.drawText(toWinAnsiSafe(sec.heading), {
      x: margin,
      y,
      size: 12,
      font: fontBold,
      color: rgb(0.05, 0.42, 0.31),
    });
    y -= 18;

    const lines = wrapLines(sec.body, 86);
    for (const line of lines) {
      if (line === '') {
        y -= 8;
        continue;
      }
      ensureSpace(16);
      const isSubBold = /^(\d+\.|Q\d+\.|Answer:|Marking|STRAND|Sub-strand)/i.test(line);
      page.drawText(line, {
        x: margin,
        y,
        size: 10,
        font: isSubBold ? fontBold : fontRegular,
        color: rgb(0.12, 0.16, 0.23),
      });
      y -= 14.5;
    }
    y -= 12;
  }

  // Page numbers footer
  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(
      toWinAnsiSafe(`CBC Kenya Resource Hub - ${subject} Grade ${grade} - Page ${idx + 1} of ${pages.length}`),
      {
        x: margin,
        y: 24,
        size: 8.5,
        font: fontRegular,
        color: rgb(0.45, 0.5, 0.56),
      }
    );
  });

  const pdfBytes = await pdfDoc.save();
  await fs.writeFile(path.join(INBOX_DIR, filename), Buffer.from(pdfBytes));
  await fs.writeFile(
    path.join(META_DIR, `${filename}.json`),
    JSON.stringify(
      {
        title,
        grade,
        level,
        category,
        subject,
        term,
        price,
        pageCount: pages.length,
        ...meta,
      },
      null,
      2
    )
  );
}

async function main() {
  await fs.mkdir(META_DIR, { recursive: true });

  // 1. Grade 4 Mathematics Schemes of Work Term 1 (DOCX)
  await buildSchemeDocx({
    filename: 'Grade_4_Term_1_Mathematics_Rationalized_Schemes_of_Work.docx',
    title: 'Grade 4 Mathematics Rationalized Schemes of Work Term 1',
    grade: 4,
    level: 'Upper Primary',
    subject: 'Mathematics',
    term: 1,
    rows: [
      ['1', '1-2', '1.0 Numbers', '1.1 Whole Numbers (Place Value)', 'By the end of the lesson, the learner should be able to use place value of digits up to tens of thousands in daily life.', 'Learners in pairs use abacus and place value tins to represent 5-digit numbers.', 'How do we find the place value of a digit in a number?', 'Abacus, number cards, KICD Grade 4 Math Design.\nOral questions & observation'],
      ['1', '3-5', '1.0 Numbers', '1.1 Whole Numbers (Total Value)', 'Determine total value of digits up to tens of thousands accurately.', 'Learners play digital & flashcard games matching digits with their total values.', 'Why is total value important when counting money?', 'Place value charts, Kenyan currency cutouts.\nWritten exercise'],
      ['2', '1-3', '1.0 Numbers', '1.1 Reading & Writing Numbers in Words', 'Read and write numbers up to 10,000 in symbols and words.', 'Group activity writing cheque amounts and population figures in words.', 'Where do we write numbers in words in real life?', 'Sample deposit slips, flashcards.\nChecklist & peer review'],
      ['2', '4-5', '1.0 Numbers', '1.1 Rounding Off to Nearest Ten & Hundred', 'Round off numbers up to 1,000 to the nearest ten and hundred.', 'Use a number line drawn on the playground to step toward the nearest multiple of 10.', 'When do we estimate quantities at the market?', 'Number lines, manila charts.\nWritten quiz'],
      ['3', '1-3', '1.0 Numbers', '1.1 Factors & Multiples', 'Identify factors and multiples of numbers up to 50.', 'Arrange bottle tops in equal rectangular arrays to discover factor pairs.', 'How can we share items equally without remainders?', 'Counters, multiplication grids.\nPractical task'],
      ['3', '4-5', '1.0 Numbers', '1.1 Roman Numerals (I to X)', 'Read and write Roman numerals from I to X using Hindu-Arabic equivalents.', 'Examine wall clock faces with Roman numerals and match I–X cards.', 'Where have you seen Roman numerals used?', 'Clock face models, number strips.\nShort test'],
      ['4', '1-5', '1.0 Numbers', '1.2 Addition up to 10,000', 'Add up to two 4-digit numbers with single and double regrouping.', 'Solve word problems involving harvest bags and school enrollment using place value apparatus.', 'How do we regroup when ones exceed 9?', 'Place value apparatus, textbooks.\nMarked class assignment'],
      ['5', '1-5', '1.0 Numbers', '1.3 Subtraction up to 10,000', 'Subtract up to 4-digit numbers with regrouping and estimate differences by rounding.', 'Role-play shopkeeper transactions calculating change from KES 1,000 and KES 5,000.', 'How do you verify if your subtraction answer is correct?', 'Play shop items, price tags.\nEnd-of-strand assessment'],
    ],
    meta: {
      description: 'Complete KICD Rationalized Grade 4 Mathematics Schemes of Work for Term 1 covering Whole Numbers, Place Value, Roman Numerals, Addition, and Subtraction with CBC learning experiences and assessments.',
      strands: [
        'Strand 1.1: Whole Numbers — Place Value, Total Value & Words up to 10,000',
        'Rounding Off to Nearest 10 & 100, Factors, Multiples & Roman Numerals (I–X)',
        'Strand 1.2 & 1.3: 4-Digit Addition & Subtraction with Regrouping',
        'Editable Landscape Word Table with KIQs, Resources & Assessment Rubrics',
      ],
    },
  });

  // 2. Grade 7 Mathematics Schemes of Work Term 1 (DOCX)
  await buildSchemeDocx({
    filename: 'Grade_7_Term_1_Mathematics_Rationalized_Schemes_of_Work.docx',
    title: 'Grade 7 Mathematics Rationalized Schemes of Work Term 1',
    grade: 7,
    level: 'Junior Secondary',
    subject: 'Mathematics',
    term: 1,
    rows: [
      ['1', '1-3', '1.0 Numbers', '1.1 Whole Numbers (Hundreds of Millions)', 'Identify place value and total value of digits up to hundreds of millions.', 'Analyze national census & county budget tables to read 9-digit numbers.', 'Why do governments use nine-digit figures in budgets?', 'Place value charts, newspaper budget excerpts.\nWritten exercise'],
      ['1', '4-5', '1.0 Numbers', '1.1 Rounding Off & Natural Numbers', 'Round off numbers up tonearest tens of millions; classify even, odd, and prime numbers.', 'Use Sieve of Eratosthenes chart in groups to isolate prime numbers between 1 and 100.', 'How are prime numbers applied in digital security?', 'Number grids 1-100, markers.\nGroup presentation'],
      ['2', '1-5', '1.0 Numbers', '1.2 Factors (Divisibility, GCD & LCM)', 'Test divisibility by 2, 3, 4, 5, 6, 8, 9, 10, and 11; compute GCD and LCM in real contexts.', 'Solve bell-ringing intervals (LCM) and equal parcel packaging problems (GCD).', 'How does LCM help schedule events that repeat at different intervals?', 'Factor trees, KICD Grade 7 Math textbook.\nTopical CAT 1'],
      ['3', '1-5', '1.0 Numbers', '1.3 Fractions (Combined Operations)', 'Compare fractions and perform combined operations using BODMAS.', 'Work collaboratively on recipe scaling and land subdivision fraction problems.', 'In what order do we evaluate mixed fraction operations?', 'Fraction strips, manila cards.\nWritten assignment'],
      ['4', '1-5', '1.0 Numbers', '1.4 Decimals (Place Value & Operations)', 'Multiply and divide decimals by whole numbers and by decimals accurately.', 'Measure classroom dimensions in metres to 2 decimal places and compute area.', 'Where is decimal accuracy critical in engineering and medicine?', 'Metre rules, tape measures.\nPractical & written check'],
      ['5', '1-5', '1.0 Numbers', '1.5 Squares and Square Roots', 'Find squares and square roots of whole numbers, fractions, and decimals.', 'Construct square grids on graph paper and extract square roots by prime factorization.', 'How is the side length of a square plot found from its area?', 'Graph books, mathematical tables.\nEnd-of-strand rubric'],
    ],
    meta: {
      description: 'JSS Rationalized Grade 7 Mathematics Schemes of Work (Term 1). Covers Whole Numbers up to hundreds of millions, Divisibility Tests, GCD & LCM, Fractions, Decimals, and Squares & Square Roots.',
      strands: [
        'Strand 1.1: Whole Numbers up to Hundreds of Millions & Prime Numbers',
        'Strand 1.2: Divisibility Rules (2–11), Prime Factorization, GCD & LCM',
        'Strand 1.3 & 1.4: Combined Operations on Fractions & Decimals',
        'Strand 1.5: Squares and Square Roots of Whole Numbers, Fractions & Decimals',
      ],
    },
  });

  // 3. Grade 5 Science & Technology CBC Lesson Plans Term 1 (DOCX)
  await buildLessonPlansDocx({
    filename: 'Grade_5_Term_1_Science_and_Technology_CBC_Lesson_Plans.docx',
    title: 'Grade 5 Science & Technology CBC 5E Lesson Plans Term 1',
    grade: 5,
    level: 'Upper Primary',
    subject: 'Science & Technology',
    term: 1,
    lessons: [
      {
        topic: 'Classification of Flowering and Non-Flowering Plants',
        strand: '1.0 Living Things and Their Environment',
        substrand: '1.1 Classification of Plants',
        outcomes: 'By the end of the lesson, the learner should be able to classify local plants into flowering and non-flowering plants and observe safety when handling plant specimens.',
        kiq: 'How do flowering plants differ from non-flowering plants in our school compound?',
        competencies: 'Critical Thinking, Citizenship (Environmental Conservation), Responsibility, Unity.',
        steps: [
          'Introduction (5 min): Learners brainstorm plants found around home and school and state whether they bear flowers.',
          'Step 1 — Engage (8 min): Teacher displays photos/specimens of maize, bean, fern, moss, and pine; learners wear protective gloves.',
          'Step 2 — Explore (12 min): Guided nature walk in groups around the school compound to observe, photograph/sketch, and group plants without uprooting.',
          'Step 3 — Explain & Elaborate (10 min): Groups present two-column classification charts (Flowering vs Non-Flowering) and discuss economic importance.',
          'Conclusion (5 min): Oral recap quiz and proper handwashing with soap and water.',
        ],
        extended: 'Learners list 5 flowering and 3 non-flowering plants observed on their way home with parental guidance.',
      },
      {
        topic: 'Parts and Functions of the Human Breathing System',
        strand: '1.0 Living Things and Their Environment',
        substrand: '1.3 The Human Breathing System',
        outcomes: 'Identify the main parts of the human breathing system (nose, trachea, bronchi, lungs, diaphragm) and model breathing mechanics.',
        kiq: 'What happens to our chest cavity and diaphragm when we breathe in and out?',
        competencies: 'Creativity & Imagination (Bell-jar lung model), Communication & Collaboration, Health Awareness.',
        steps: [
          'Introduction (5 min): Learners place hands on their ribs, take a deep breath in and out, and describe the movement.',
          'Step 1 — Engage (7 min): Examine a labelled wall chart / digital animation of the human respiratory tract.',
          'Step 2 — Explore (13 min): In groups, assemble a simple breathing model using a clear plastic bottle, Y-tube/straws, two small balloons (lungs), and a stretched balloon base (diaphragm).',
          'Step 3 — Explain (10 min): Learners pull and release the bottom balloon sheet, relating inflation/deflation to inhalation and exhalation.',
          'Conclusion (5 min): Label a blank diagram of the breathing system in exercise books.',
        ],
        extended: 'Discuss ways of keeping the breathing system healthy and avoiding dusty/smoky environments.',
      },
      {
        topic: 'Separating Heterogeneous Mixtures (Winnowing, Sieving & Filtering)',
        strand: '2.0 Matter',
        substrand: '2.1 Mixtures',
        outcomes: 'Demonstrate separation of solid-solid and insoluble solid-liquid mixtures using locally available materials.',
        kiq: 'How do households separate husks from grains or muddy particles from water?',
        competencies: 'Problem Solving, Learning to Learn, Integrity & Safety.',
        steps: [
          'Introduction (5 min): Review definition of homogeneous vs heterogeneous mixtures using salt-water vs sand-water.',
          'Step 1 — Engage (5 min): Inspect workstation trays containing maize + chaff, flour +rice, and muddy water.',
          'Step 2 — Explore (15 min): Rotate through 3 practical stations performing sieving, decanting, and filtration with clean cotton cloth / filter paper.',
          'Step 3 — Explain (10 min): Record observations in lab table explaining why particle size and solubility determine the method chosen.',
          'Conclusion (5 min): Clean workstations and complete 4 exit-ticket questions.',
        ],
        extended: 'Design a simple home water-straining setup with family members and report findings.',
      },
    ],
    meta: {
      description: 'Ready-to-use Grade 5 Science & Technology 5E CBC Lesson Plans for Term 1. Features practical nature-walk and improvised lab activities, Core Competencies, PCIs, and formative checks.',
      strands: [
        'Classification of Flowering & Non-Flowering Plants (Nature Walk Lesson)',
        'Human Breathing System & Plastic-Bottle Diaphragm Lung Model',
        'Mixtures & Practical Separation Techniques (Sieving, Decanting, Filtration)',
        'Editable Word Lesson Templates with Roll, Time, KIQs & Self-Evaluation',
      ],
    },
  });

  // 4. Grade 8 Integrated Science CBC Lesson Plans Term 1 (DOCX)
  await buildLessonPlansDocx({
    filename: 'Grade_8_Term_1_Integrated_Science_CBC_Lesson_Plans.docx',
    title: 'Grade 8 Integrated Science CBC 5E Lesson Plans Term 1',
    grade: 8,
    level: 'Junior Secondary',
    subject: 'Integrated Science',
    term: 1,
    lessons: [
      {
        topic: 'Elements, Compounds and Chemical Symbols',
        strand: '1.0 Mixtures, Elements and Compounds',
        substrand: '1.1 Elements and Compounds',
        outcomes: 'Distinguish between elements and compounds and write chemical symbols for the first 20 common elements using IUPAC conventions.',
        kiq: 'Why do scientists use universal chemical symbols like Na, Fe, and Cu across the world?',
        competencies: 'Communication & Collaboration, Digital Literacy, Critical Thinking.',
        steps: [
          'Introduction (5 min): Connect prior Grade 7 knowledge on pure substances vs mixtures.',
          'Step 1 — Engage (7 min): Inspect everyday items (iron nail, copper wire, aluminium foil, table salt, water) and ask what building blocks form them.',
          'Step 2 — Explore (13 min): Use Periodic Table cards in pairs to match common element names (Hydrogen to Calcium + Iron, Copper, Zinc, Silver, Gold) with symbols, noting Latin origins.',
          'Step 3 — Explain (10 min): Teacher clarifies one-letter capital (H, O, N) vs two-letter capital-lowercase rule (Na, Cl, Mg) and contrasts pure elements with compounds (H2O, NaCl, CO2).',
          'Conclusion (5 min): Rapid-fire flashcard symbol challenge.',
        ],
        extended: 'Inspect 5 household product labels (toothpaste, salt, fertilizer, mineral water) and list elements/compounds identified.',
      },
      {
        topic: 'Preparing and Observing Temporary Slides of Plant Epidermal Cells',
        strand: '2.0 Living Things and Their Environment',
        substrand: '2.1 The Cell',
        outcomes: 'Prepare a temporary wet mount of onion epidermal cells, observe under a light microscope, and draw labelled plant cell structures.',
        kiq: 'How does staining with iodine solution help reveal internal structures of an onion cell?',
        competencies: 'Learning to Learn, Laboratory Safety, Precision & Responsibility.',
        steps: [
          'Introduction (5 min): Recap parts and safe handling rules of a light microscope.',
          'Step 1 — Engage (5 min): Teacher demonstrates peeling the thin transparent inner epidermis from a fleshy onion bulb scale.',
          'Step 2 — Explore (15 min): Learners mount epidermis flat in a drop of water on a glass slide, add a drop of iodine stain, lower coverslip at 45° with a mounted needle to avoid air bubbles, and focus under low then medium power.',
          'Step 3 — Explain (10 min): Compare observed cell wall, cell membrane, cytoplasm, nucleus, and large sap vacuole against reference micrographs.',
          'Conclusion (5 min): Make biological drawings (sharp pencil, continuous lines, horizontal labels) and calculate total magnification.',
        ],
        extended: 'Compare plant cell structures observed today with prepared permanent slides of animal cheek cells.',
      },
      {
        topic: 'Classes of Fire and Fire Control Methods (The Fire Triangle)',
        strand: '1.0 Mixtures, Elements and Compounds',
        substrand: '1.4 Fire and Safety',
        outcomes: 'Classify fires (Classes A, B, C, D, E, F), explain the Fire Triangle, and match each class of fire with the correct extinguisher.',
        kiq: 'Why is pouring water on an electrical fire or burning cooking oil dangerous?',
        competencies: 'Problem Solving, Disaster Preparedness (PCI), Citizenship.',
        steps: [
          'Introduction (5 min): Learners identify fire extinguishers mounted in the school laboratory and kitchen.',
          'Step 1 — Engage (8 min): Analyze the Fire Triangle (Fuel, Heat, Oxygen) and predict what happens when any one side is removed.',
          'Step 2 — Explore (12 min): Group case-study stations matching Classes A–F fires with Water, Foam, Carbon Dioxide, Dry Powder, and Wet Chemical extinguishers / Fire Blanket.',
          'Step 3 — Explain (10 min): Demonstrate PASS technique (Pull, Aim, Squeeze, Sweep) using an inspection extinguisher model.',
          'Conclusion (5 min): Complete Fire Safety matching matrix.',
        ],
        extended: 'Create a fire-escape & emergency response poster for the school science lab.',
      },
    ],
    meta: {
      description: 'Junior Secondary Grade 8 Integrated Science 5E Lesson Plans for Term 1. Covers Elements & Chemical Symbols, Onion Cell Microscopy Practicals, and Classes of Fire & Extinguisher Safety.',
      strands: [
        'Strand 1.1: Elements, Compounds & IUPAC Chemical Symbols',
        'Strand 2.1: Onion Epidermal Cell Wet-Mount Microscopy Practical',
        'Strand 1.4: Fire Triangle, Classes of Fire (A–F) & PASS Extinguisher Drill',
        'Aligned to KICD Rationalized JSS Integrated Science Curriculum',
      ],
    },
  });

  // 5. Grade 6 KPSEA Mathematics Prediction Exam & Marking Scheme (PDF)
  await buildStructuredPdf({
    filename: 'Grade_6_Term_1_KPSEA_Mathematics_Prediction_Exam_and_Marking_Scheme.pdf',
    title: 'Grade 6 KPSEA Mathematics Prediction Exam & Marking Scheme',
    subtitle: 'Upper Primary Competency-Based Assessment • Time: 1 Hour 20 Minutes • Total: 30 Marks',
    grade: 6,
    level: 'Upper Primary',
    category: 'Revision Papers & Exams',
    subject: 'Mathematics',
    term: 1,
    price: 100,
    sections: [
      {
        heading: 'SECTION A: COMPETENCY-BASED MULTIPLE CHOICE & STRUCTURED TASKS',
        body: `Instructions: Answer ALL questions clearly showing your working steps where applicable.

Q1. A county government distributed 486,709 tree seedlings to schools during the rainy season. What is the total value of digit 8 in the number of seedlings?
A) 8,000    B) 80,000    C) 800,000    D) Tens of thousands

Q2. Write nine hundred and four thousand, and fifty-six in symbols, then round it off to the nearest thousand. (2 marks)

Q3. Three school bells ring at intervals of 15 minutes, 20 minutes, and 30 minutes respectively. If they rang together at 8:00 a.m., at what time will they next ring together? (3 marks)

Q4. Work out the combined operation:  72 ÷ 8 × 3 + 18 - 9  (2 marks)

Q5. A square kitchen garden at Bidii Primary School has an area of 324 m². Calculate:
(a) The length of one side of the garden. (2 marks)
(b) The total length of wire mesh needed to fence round it three times. (2 marks)

Q6. A farmer harvested 4 3/4 tonnes of maize in Season 1 and 2 5/6 tonnes in Season 2. If she sold 5 1/3 tonnes to a miller, how many tonnes remained in her store? (3 marks)

Q7. Convert 0.375 into a simplified fraction in its lowest form. (2 marks)

Q8. An athlete ran around a rectangular field measuring 110 m by 65 m four times. Find the total distance covered in kilometres. (3 marks)

Q9. In a Grade 6 class, 60% of the 45 learners are girls. How many boys are in the class? (2 marks)

Q10. Solve the algebraic equation:  4x + 7 = 31  (2 marks)

Q11. A matatu left Nakuru at 0945 hours and arrived in Nairobi at 1230 hours. How long did the journey take in hours and minutes? (2 marks)

Q12. A shopkeeper bought a crate of 24 sodas for KES 720 and sold each bottle at KES 40. Calculate the total profit made. (3 marks)

Q13. Find the size of the third angle of a triangle if two of its interior angles measure 58° and 74°. (2 marks)`,
      },
      {
        heading: 'SECTION B: OFFICIAL STEP-BY-STEP MARKING SCHEME',
        body: `Q1. Answer: B (80,000) — Digit 8 is in the tens of thousands position: 8 × 10,000 = 80,000. (2 mks)

Q2. Symbols: 904,056 (1 mk). Rounded to nearest thousand: 904,000 (1 mk).

Q3. LCM of 15, 20, and 30:
15 = 3 × 5;  20 = 2² × 5;  30 = 2 × 3 × 5  ->  LCM = 2² × 3 × 5 = 60 minutes (1 hour). (2 mks)
8:00 a.m. + 1 hour = 9:00 a.m. (1 mk)

Q4. BODMAS: (72 ÷ 8) × 3 + 18 - 9 = 9 × 3 + 18 - 9 = 27 + 18 - 9 = 45 - 9 = 36. (2 mks)

Q5. (a) Side = √324 = √(2² × 3⁴) = 2 × 9 = 18 m. (2 mks)
(b) Perimeter = 4 × 18 = 72 m. Three strands = 72 × 3 = 216 m. (2 mks)

Q6. Total harvested = 4 3/4 + 2 5/6 = 6 + (9 + 10)/12 = 7 7/12 tonnes. (1.5 mks)
Remaining = 7 7/12 - 5 1/3 = 2 + (7 - 4)/12 = 2 3/12 = 2 1/4 tonnes. (1.5 mks)

Q7. 0.375 = 375 / 1000. Divide by 125 -> 3/8. (2 mks)

Q8. Perimeter = 2(110 + 65) = 350 m. Four laps = 350 × 4 = 1,400 m = 1.4 km. (3 mks)

Q9. Boys percentage = 100% - 60% = 40%. Boys = (40/100) × 45 = 18 boys. (2 mks)

Q10. 4x = 31 - 7 = 24  =>  x = 24 ÷ 4 = 6. (2 mks)

Q11. 12 h 30 min - 09 h 45 min: borrow 1 hr (60 min) -> 11 h 90 min - 09 h 45 min = 2 hours 45 minutes. (2 mks)

Q12. Selling price = 24 × 40 = KES 960. Profit = 960 - 720 = KES 240. (3 mks)

Q13. Interior angles of a triangle sum to 180°. Third angle = 180° - (58° + 74°) = 180° - 132° = 48°. (2 mks)`,
      },
    ],
    meta: {
      description: 'KPSEA-standard Grade 6 Mathematics Prediction Assessment covering Whole Numbers, LCM, BODMAS, Fractions, Decimals, Percentages, Measurement, Time, Profit/Loss, and Geometry — with a complete worked Marking Scheme.',
      strands: [
        '13 Real-Life Competency Tasks Covering Core KPSEA Strands',
        'Whole Numbers, LCM, Squares/Square Roots, Fractions & Percentages',
        'Perimeter, Area, 24-Hour Clock Time, Money & Geometry',
        'Full Step-by-Step Worked Marking Scheme Included',
      ],
    },
  });

  // 6. Grade 7 Pre-Technical Studies Comprehensive Notes Term 1 (PDF)
  await buildStructuredPdf({
    filename: 'Grade_7_Term_1_Pre_Technical_Studies_Comprehensive_Notes.pdf',
    title: 'Grade 7 Pre-Technical Studies Comprehensive Notes Term 1',
    subtitle: 'Junior Secondary (JSS) Rationalized Syllabus • Foundations, Safety, Computers & Drawing',
    grade: 7,
    level: 'Junior Secondary',
    category: "Teachers' Notes",
    subject: 'Pre-Technical Studies',
    term: 1,
    price: 100,
    sections: [
      {
        heading: 'STRAND 1.0: FOUNDATIONS OF PRE-TECHNICAL STUDIES',
        body: `1. Meaning and Components of Pre-Technical Studies
Pre-Technical Studies is an integrated Junior Secondary learning area combining three practical pillars:
• Technical Studies: Practical engineering, workshop tools, materials, structures, and technical drawing.
• Computer Studies: Digital literacy, hardware, software, data safety, and visual programming.
• Business Studies: Entrepreneurship, financial literacy, ethical trade, and resource management.

2. Role of Pre-Technical Studies in Day-to-Day Life
• Equips learners with hands-on problem-solving and repair skills at home and school.
• Builds early career awareness across STEM, engineering, ICT, and enterprise pathways in Senior School.
• Promotes safe handling of tools, electricity, and digital devices.`,
      },
      {
        heading: 'Sub-strand 1.2: Safety in the Immediate Work Environment',
        body: `1. Potential Physical Threats at a Workplace or Workshop
• Wet or oily floors causing slips, trips, and falls.
• Naked electrical wires and overloaded sockets causing electric shock or Class E fires.
• Unshielded sharp edges on cutting tools (saws, chisels, dividers) causing cuts.
• Poor ventilation, excessive noise, and inadequate lighting.

2. Personal Protective Equipment (PPE) & Safety Rules
• Safety Goggles: Shield eyes from flying wood shavings, sparks, and dust.
• Overalls / Dust Coats & Closed Leather Shoes: Protect skin and feet from falling tools or spills.
• Ear Defenders & Dust Masks: Protect hearing and respiratory health.
• Workshop Dress Code: Do not run in the workshop; tie back loose clothing; report damaged tools immediately.

3. Online & Digital Safety Threats
• Phishing & Social Engineering: Fraudulent messages tricking users into revealing PINs or passwords.
• Cyberbullying: Harassment via digital platforms — report to parents/teachers and block perpetrators.
• Malware & Ransomware: Malicious software; mitigate with updated antivirus, strong passwords, and backups.`,
      },
      {
        heading: 'STRAND 2.0: COMMUNICATION IN PRE-TECHNICAL STUDIES (ICT & DRAWING)',
        body: `1. Characteristics of a Computer System
• Speed: Executes millions of instructions per second (MIPS).
• Accuracy (GIGO): Garbage In, Garbage Out — error-free output when given valid input.
• Versatility & Diligence: Performs diverse tasks continuously without fatigue.
• Storage: Retains vast data on SSDs, HDDs, and cloud storage.

2. Classification of Computers by Size and Functionality
• By Size: Supercomputers (weather forecasting), Mainframes (banking), Minicomputers, Microcomputers (Desktops, Laptops, Tablets, Smartphones).
• By Purpose & Data Handled: Digital, Analogue (thermometers, speedometers), and Hybrid computers.

3. Technical & Artistic Drawing Instruments
• T-Square & Set Squares (30°/60° and 45°): Drawing accurate horizontal, vertical, and angled lines.
• Pair of Compasses & Dividers: Constructing arcs, circles, and transferring measurements.
• Drawing Pencils: Hard leads (2H, 3H) for faint construction lines; Soft leads (HB, 2B) for outlines and shading.

TOPICAL REVISION QUESTIONS
1. State three learning areas integrated into Junior Secondary Pre-Technical Studies. (3 mks)
2. Explain four safety rules a learner must observe in a school workshop. (4 mks)
3. Differentiate between phishing and malware, giving one prevention measure for each. (4 mks)
4. Explain why a 2H pencil is preferred over a 2B pencil when drawing initial construction lines. (2 mks)`,
      },
    ],
    meta: {
      description: 'Comprehensive Grade 7 Pre-Technical Studies Term 1 Notes covering Technical, Business & Computer Studies foundations, Workshop PPE & Online Safety, Computer Classification, and Technical Drawing Instruments.',
      strands: [
        'Strand 1.1: Foundations & Career Pathways of Pre-Technical Studies',
        'Strand 1.2: Physical Workshop Safety, PPE & Online Cyber Safety',
        'Strand 2.0: Computer Characteristics, Classification & Technical Drawing Tools',
        'Includes End-of-Strand JSS Revision Questions',
      ],
    },
  });

  // 7. Grade 9 KJSEA English Assessment Exam & Marking Scheme (PDF)
  await buildStructuredPdf({
    filename: 'Grade_9_Term_1_KJSEA_English_Assessment_Exam_and_Marking_Scheme.pdf',
    title: 'Grade 9 KJSEA English End-of-Term 1 Exam & Marking Scheme',
    subtitle: 'Kenya Junior School Education Assessment Format • Time: 1 Hour 40 Minutes • 50 Marks',
    grade: 9,
    level: 'Junior Secondary',
    category: 'Revision Papers & Exams',
    subject: 'English',
    term: 1,
    price: 100,
    sections: [
      {
        heading: 'TASK 1: READING COMPREHENSION (15 MARKS)',
        body: `Read the passage below carefully and answer Questions 1 to 6.

Across Kenya's semi-arid counties, rainwater harvesting is transforming rural schools from dusty compounds into thriving green oases. Previously, learners at Mwangaza Junior School spent valuable study hours trekking to seasonal riverbeds during dry spells. Five years ago, the school board partnered with parents and local artisans to install gutters along every classroom roof, channeling runoff into three underground ferro-cement tanks holding 150,000 litres altogether.

Today, drip-irrigated vegetable beds supply spinach, kale, and amaranth for the midday meal programme, cutting food expenses by forty percent. More importantly, attendance and concentration in afternoon lessons have risen sharply, proving that sustainable climate adaptation begins right where young people learn.

Q1. What challenge did learners at Mwangaza Junior School face before rainwater harvesting was introduced? (2 mks)
Q2. How was water collected and stored at the school? (3 mks)
Q3. Explain two economic or educational benefits the project brought to the school. (4 mks)
Q4. Identify a metaphor used in the first paragraph and explain its effectiveness. (3 mks)
Q5. Give the meaning of the following words as used in the passage: (a) thriving  (b) runoff  (2 mks)
Q6. Suggest a suitable title for this passage. (1 mk)`,
      },
      {
        heading: 'TASK 2: CLOZE TEST, ORAL SKILLS & GRAMMAR (20 MARKS)',
        body: `A. Broken Passage (5 Marks) — Fill in each blank with the most appropriate single word:
Digital citizenship requires every learner (1)________ think critically before sharing information online. Rumours spread rapidly (2)________ social platforms when people forward unverified screenshots. Responsible users always check (3)________ source of an article, respect other people's privacy, (4)________ report cyberbullying whenever they witness (5)________.

B. Oral Skills & Etiquette (5 Marks)
Q7. Give a word pronounced the same way (homophone) as each of the following:
(a)flour   (b) principal   (c) stationary   (3 mks)
Q8. Mention two non-verbal cues you would use to show active listening during a group debate. (2 mks)

C. Grammar in Use (10 Marks)
Q9. Rewrite using the correct question tag:
(a) The Grade 9 learners planted two hundred indigenous trees, _______________? (1 mk)
(b) Let us revise the poetry notes together, _______________? (1 mk)
Q10. Change into Indirect (Reported) Speech:
"We will submit our science projects tomorrow," the group leader told the teacher. (2 mks)
Q11. Fill in the blanks with the correct preposition:
(a) Halima congratulated her teammate _____ winning the 800-metre race. (1 mk)
(b) The library books were shared equally _____ the four study groups. (1 mk)
Q12. Combine using 'neither...nor':
Mwangi did not litter the compound. Achieng did not litter the compound. (2 mks)
Q13. Identify the complex preposition in the sentence: "The match continued in spite of the heavy downpour." (2 mks)

TASK 3: IMAGINATIVE COMPOSITION (15 MARKS)
Write a captivating story of 250–300 words beginning with the words:
"When the headteacher called out my name during Monday morning assembly, my heart skipped a beat..."`,
      },
      {
        heading: 'OFFICIAL MARKING SCHEME & SCORING RUBRIC',
        body: `TASK 1 ANSWERS:
Q1. They lost study hours walking long distances to seasonal riverbeds during dry seasons. (2 mks)
Q2. Classroom roof gutters directed rainwater runoff into three underground ferro-cement tanks with a combined 150,000-litre capacity. (3 mks)
Q3. (i) Drip-irrigated vegetables cut school lunch food costs by 40%. (ii) Afternoon class attendance and learner concentration improved significantly. (4 mks)
Q4. Metaphor: "thriving green oases" — compares green productive school compounds in dry regions to fertile desert water-spots, vividly highlighting the contrast. (3 mks)
Q5. (a) thriving: flourishing / growing vigorously. (b) runoff: rainwater flowing off a surface/roof. (2 mks)
Q6. Harvesting Hope / Rainwater Harvesting Transforms Rural Schools (any apt 6-word max title). (1 mk)

TASK 2 ANSWERS:
Cloze Test: (1) to  (2) on / across  (3) the  (4) and  (5) it. (5 mks)
Q7. Homophones: (a) flower  (b) principle  (c) stationery. (3 mks)
Q8. Maintaining appropriate eye contact; nodding occasionally; leaning slightly forward; taking brief notes (any 2 = 2 mks).
Q9. (a) didn't they?  (b) shall we? (2 mks)
Q10. The group leader told the teacher that they would submit their science projects the following day / the next day. (2 mks)
Q11. (a) on  (b) among. (2 mks)
Q12. Neither Mwangi nor Achieng littered the compound. (2 mks)
Q13. "in spite of" (2 mks)

TASK 3 COMPOSITION RUBRIC (15 Mks): Fluency & Grammar (6 mks), Relevance to prompt & plot coherence (4 mks), Vocabulary & stylistic devices (3 mks), Neatness & punctuation (2 mks).`,
      },
    ],
    meta: {
      description: 'KJSEA-aligned Grade 9 English End-of-Term 1 Assessment covering Reading Comprehension, Cloze Test, Oral Skills (Homophones & Listening Cues), Grammar, and Imaginative Composition with full Marking Scheme.',
      strands: [
        'Task 1: Environmental Adaptation Reading Comprehension (15 Marks)',
        'Task 2: Digital Citizenship Cloze, Homophones & Grammar in Use (20 Marks)',
        'Task 3: KJSEA Imaginative Composition Prompt & Analytic Scoring Rubric',
        'Complete Answer Key & Marking Guide Included',
      ],
    },
  });

  // 8. Grade 10 Biology Senior School Comprehensive Notes Term 1 (PDF)
  await buildStructuredPdf({
    filename: 'Grade_10_Term_1_Biology_Senior_School_Comprehensive_Notes.pdf',
    title: 'Grade 10 Senior School Biology Comprehensive Notes Term 1',
    subtitle: 'STEM Pathway • Cell Ultrastructure, Microscopy Calculations & Biological Molecules',
    grade: 10,
    level: 'Senior School',
    category: "Teachers' Notes",
    subject: 'Biology',
    term: 1,
    price: 100,
    sections: [
      {
        heading: 'STRAND 1.0: CELL BIOLOGY AND MICROSCOPY',
        body: `1. Resolution vs Magnification in Microscopy
• Magnification: The number of times an image is enlarged compared to the actual size of the specimen.
• Resolution (Resolving Power): The minimum distance between two close points at which they can still be distinguished as separate entities.
  - Light Microscope: Max useful magnification ~1,500x; resolution ~200 nm (limited by wavelength of visible light).
  - Electron Microscope (TEM & SEM): Resolution ~0.1–1 nm using a beam of electrons; reveals cell ultrastructure (ribosomes, cristae, endoplasmic reticulum).

2. Formula: Magnification = Image Size ÷ Actual Size  (I = A × M)
• Unit Conversions:  1 mm = 1,000 micrometres (µm);  1 µm = 1,000 nanometres (nm).
• Worked Example: A mitochondrion measures 45 mm in an electron micrograph taken at ×15,000 magnification.
  Actual size = 45,000 µm ÷ 15,000 = 3.0 µm.

3. Organelle Ultrastructure and Functions
• Nucleus: Bounded by double nuclear envelope with nuclear pores; houses chromatin (DNA) and nucleolus (rRNA/ribosome synthesis).
• Mitochondria: Site of aerobic respiration producing ATP; inner membrane folded into cristae to maximize surface area.
• Rough Endoplasmic Reticulum (RER): Studded with 80S ribosomes; folds and transports secretory proteins.
• Golgi Apparatus: Modifies, packages, and buds off glycoproteins into secretory vesicles or lysosomes.
• Chloroplasts (Plant Cells): Double membrane + thylakoid grana (light stage) + stroma (Calvin cycle).`,
      },
      {
        heading: 'STRAND 2.0: CHEMICALS OF LIFE (BIOMOLECULES & ENZYMES)',
        body: `1. Carbohydrates (C, H, O in ratio 1:2:1)
• Monosaccharides (Reducing sugars — Glucose, Fructose, Galactose): Give brick-red precipitate when heated with Benedict's solution.
• Disaccharides: Maltose (Glucose + Glucose), Lactose (Glucose + Galactose), Sucrose (Glucose + Fructose — non-reducing sugar; hydrolyze with dilute HCl then neutralize with NaHCO3 before Benedict's test).
• Polysaccharides: Starch (amylose + amylopectin; turns blue-black with Iodine), Glycogen (animal storage in liver/muscle), Cellulose (beta-glucose structural microfibrils in plant cell walls).

2. Lipids & Proteins
• Triglycerides: 1 Glycerol + 3 Fatty Acids joined by ester bonds via condensation; Emulsion test gives milky-white suspension.
• Proteins: Polymers of amino acids linked by peptide bonds; Biuret test (NaOH + 1% CuSO4) gives purple/violet colouration.

3. Enzyme Action & Factors Affecting Rate
• Lock-and-Key vs Induced-Fit Hypothesis: Active site slightly moulds around substrate to form an Enzyme-Substrate Complex, lowering activation energy.
• Key Factors: Temperature (optimum ~37°C in mammals; high heat denatures tertiary H-bonds), pH, Substrate Concentration (Vmax plateau), Enzyme Concentration, and Competitive vs Non-Competitive Inhibitors.

SENIOR SCHOOL TOPICAL REVIEW QUESTIONS
1. Distinguish between resolution and magnification as applied in electron microscopy. (2 mks)
2. A palisade cell image measures 60 mm at ×800 magnification. Calculate its actual length in micrometres (µm). (3 mks)
3. Describe the step-by-step biochemical test to confirm the presence of a non-reducing sugar in sugarcane extract. (4 mks)
4. Explain using the active-site concept why human salivary amylase loses activity above 55°C. (3 mks)`,
      },
    ],
    meta: {
      description: 'Senior School STEM Pathway Grade 10 Biology Comprehensive Notes for Term 1. Covers Light vs Electron Microscopy, Micimetre Magnification Calculations, Organelle Ultrastructure, Biomolecules Food Tests, and Enzyme Kinetics.',
      strands: [
        'Strand 1.1: Light vs Electron Microscopy & Micimetre (µm) Calculations',
        'Strand 1.2: Eukaryotic Organelle Ultrastructure (Mitochondria, RER, Golgi, Chloroplasts)',
        'Strand 2.1: Carbohydrates, Lipids, Proteins & Biochemical Food Tests',
        'Strand 2.2: Induced-Fit Enzyme Mechanism, Denaturation & Inhibitors',
      ],
    },
  });

  // Also write a helpful README inside materials-inbox/
  const readmeContent = `# CBC Materials Inbox (Bulk Import Folder)

Drop any \`.docx\`, \`.doc\`, or \`.pdf\` CBC curriculum documents into this folder and run:

\`\`\`bash
npm run materials:sync
\`\`\`

## How Filename Auto-Detection Works
The sync script reads each filename to automatically detect:
- **Grade**: \`Grade 1\` through \`Grade 12\` (or \`Form 1\`–\`Form 4\`, \`KPSEA\` -> Grade 6, \`KJSEA\` -> Grade 9, \`KCSE\` -> Grade 12)
- **Term**: \`Term 1\`, \`Term 2\`, or \`Term 3\`
- **Category & Default Price**:
  - \`Schemes\` -> **Schemes of Work** (KES 50)
  - \`Lesson Plan\` -> **Lesson Plans** (KES 70)
  - \`Notes\` / \`Booklet\` -> **Teachers' Notes** (KES 100)
  - \`Exam\` / \`Mock\` / \`Prediction\` / \`KPSEA\` / \`KJSEA\` -> **Revision Papers & Exams** (KES 100)
- **Subject**: Mathematics, Integrated Science, Science & Technology, English, Kiswahili, Pre-Technical Studies, Agriculture & Nutrition, Creative Arts & Sports, Biology, etc.

**Example clean filenames:**
- \`Grade_7_Term_2_Integrated_Science_Schemes_of_Work.docx\`
- \`Grade_6_Term_1_Agriculture_and_Nutrition_Notes.pdf\`
- \`Grade_8_Term_3_Mathematics_End_Term_Exam.pdf\`
`;
  await fs.writeFile(path.join(INBOX_DIR, 'README.md'), readmeContent);

  console.log('Generated 8 CBC Starter Pack materials in materials-inbox/ successfully!');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
