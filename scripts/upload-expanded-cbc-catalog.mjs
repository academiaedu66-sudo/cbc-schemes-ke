import { createClient } from '@supabase/supabase-js';
import {
  PREPRIMARY_CURRICULUM_PLAN,
  GRADES_CURRICULUM_PLAN,
  getApprovedCoursebook,
  getSyllabusForGrade,
} from './cbc-syllabus-data.mjs';
import {
  buildTermLessonSchedule,
  generateSchemeBuffer,
  generateLessonPlanBuffer,
  generateRecordOfWorkBuffer,
  generateNotesPdfBuffer,
  generateExamPdfBuffer,
  generateHolidayPdfBuffer,
  generateCurriculumDesignPdfBuffer,
  renderPdf,
} from './upload-full-cbc-catalog.mjs';

const BUCKET_NAME = 'cbc-materials';
const CONCURRENCY = 28;
const HOLIDAY_NAME = { 1: 'April', 2: 'August', 3: 'December' };

function fmtGradeLabel(gradeOrCode) {
  const s = String(gradeOrCode);
  return s === 'PP1' || s === 'PP2' ? s : `Grade ${s}`;
}

/**
 * Generates dedicated Opener Assessment or Mid-Term Assessment PDF with Official Marking Scheme & Rubric
 */
async function generateSpecializedAssessmentPdfBuffer({
  grade,
  level,
  subject,
  term,
  examKind, // 'OPENER' | 'MIDTERM'
  coursebook,
  termBlocks,
}) {
  const schedule = buildTermLessonSchedule({
    grade,
    level,
    subject,
    term,
    coursebook,
    termBlocks,
  });
  const { lessonsPerWeek, minutesPerLesson, subRanges, termLbSpan } = schedule;
  const gradeLabel = fmtGradeLabel(grade);
  const isPP = grade === 'PP1' || grade === 'PP2';
  const duration = isPP
    ? '40 Minutes (Play & Oral Check)'
    : Number(grade) <= 3
    ? '1 Hour'
    : Number(grade) <= 6
    ? '1 Hour 15 Minutes'
    : Number(grade) <= 9
    ? '1 Hour 30 Minutes'
    : '2 Hours';

  const isOpener = examKind === 'OPENER';
  const kindLabel = isOpener ? 'Opener (Entry Diagnostic) Assessment' : 'Mid-Term Assessment';
  const targetSubRanges = isOpener
    ? subRanges.slice(0, Math.max(2, Math.ceil(subRanges.length / 2)))
    : subRanges.slice(0, Math.max(3, Math.ceil((subRanges.length * 2) / 3)));

  const scopeNote = isOpener
    ? `Entry Readiness & Early Term ${term} Strands (${targetSubRanges[0].lbRangeLabel})`
    : `Weeks 1-7 Covered Strands (${targetSubRanges[0].lbRangeLabel} to ${targetSubRanges[targetSubRanges.length - 1].lbRangeLabel})`;

  const qLines = [
    `LEARNER'S NAME: ____________________________________  ASSESSMENT NO: _______________`,
    `SCHOOL: ____________________________________________  TIME ALLOWED: ${duration}`,
    `ASSESSMENT TYPE: ${kindLabel.toUpperCase()} — TERM ${term} (2026)`,
    `KICD APPROVED COURSEBOOK SCOPE: ${coursebook.lbTitle} (${scopeNote || termLbSpan})`,
    `OFFICIAL WEEKLY ALLOCATION: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Mins/Lesson)`,
    `RUBRIC LEVEL:  [ ] EE (80-100%)   [ ] ME (50-79%)   [ ] AE (30-49%)   [ ] BE (0-29%)`,
    '',
    `INSTRUCTIONS TO LEARNERS: Answer ALL questions clearly in the spaces provided.`,
    '',
  ];

  const mLines = [];
  let qCounter = 1;

  targetSubRanges.forEach((sr) => {
    const qA = qCounter++;
    const qB = qCounter++;
    const qC = qCounter++;

    qLines.push(
      `Q${qA}. [${sr.strand} — ${sr.sub} | Ref: ${sr.lbRangeLabel}] State and explain two foundational concepts or rules learned under "${sr.sub}" in ${gradeLabel} ${subject}. (4 marks)`,
      `Q${qB}. Guided Classroom Application (${sr.sub}): Describe step-by-step how "${sr.sub}" is demonstrated or practiced using ${sr.resources.toLowerCase()}. (4 marks)`,
      `Q${qC}. Competency Inquiry Task: "${sr.kiq}" Give two practical examples from your home, school, or community. (6 marks)`,
      ''
    );

    mLines.push(
      `Q${qA} Marking Scheme (4 mks): Award 2 marks each for any two accurate definitions/principles on "${sr.sub}" aligned to ${sr.lbRangeLabel} & ${sr.tgRangeLabel}.`,
      `Q${qB} Marking Scheme (4 mks): Award 1 mark for naming appropriate materials (${sr.resources.toLowerCase()}) and 3 marks for logical, safe procedural steps.`,
      `Q${qC} Marking Scheme (6 mks): Award 3 marks per well-explained real-life Kenyan example answering "${sr.kiq}" (EE: 5-6 mks; ME: 3-4 mks; AE: 2 mks; BE: 0-1 mk).`
    );
  });

  const bonusQ = qCounter++;
  qLines.push(
    `Q${bonusQ}. Structured Practical / Problem-Solving Task: Using knowledge from ${coursebook.lbShort}, design or solve a practical classroom task on "${targetSubRanges[0].sub}" and state two safety/quality precautions observed. (6 marks)`
  );
  mLines.push(
    `Q${bonusQ} Rubric Guide (6 mks — ${targetSubRanges[0].tgRangeLabel}): Award 4 marks for accurate worked demonstration/solution on "${targetSubRanges[0].sub}" + 2 marks for two valid safety/accuracy checks.`
  );

  return renderPdf({
    bannerTag: `KICD ALIGNED ${kindLabel.toUpperCase()} & MARKING SCHEME - TERM ${term}`,
    title: `${gradeLabel} ${subject} Term ${term} ${isOpener ? 'Opener' : 'Mid-Term'} Exam & Marking Scheme`,
    subtitle: `${level} (${duration}) | Synced with Term ${term} Scheme of Work & ${coursebook.lbShort}`,
    footerLabel: `CBC Kenya Hub - ${gradeLabel} ${subject} T${term} ${isOpener ? 'Opener' : 'Mid-Term'} Exam`,
    sections: [
      {
        heading: `SECTION A & B: ${kindLabel.toUpperCase()} QUESTIONS (TERM ${term})`,
        body: qLines.join('\n'),
      },
      {
        heading: `OFFICIAL STEP-BY-STEP MARKING SCHEME & CBC RUBRIC GRID`,
        body: mLines.join('\n\n'),
      },
    ],
  });
}

/**
 * Generates National KNEC Past Paper / Prediction Trial / Mock Exam + Official Marking Scheme PDF
 * (KEYA Grade 3, KPSEA Grade 6, KJSEA Grade 9, Senior School Grade 10 CBE Pathway Trials)
 */
async function generateNationalTrialOrPastPaperPdfBuffer({
  grade,
  level,
  subject,
  paperTitle,
  bannerCode,
  coursebook,
  allTermsObj,
}) {
  const s1 = buildTermLessonSchedule({
    grade,
    level,
    subject,
    term: 1,
    coursebook,
    termBlocks: allTermsObj[1],
  });
  const s2 = buildTermLessonSchedule({
    grade,
    level,
    subject,
    term: 2,
    coursebook,
    termBlocks: allTermsObj[2],
  });
  const s3 = buildTermLessonSchedule({
    grade,
    level,
    subject,
    term: 3,
    coursebook,
    termBlocks: allTermsObj[3],
  });

  const combinedRanges = [
    ...s1.subRanges.slice(0, 2),
    ...s2.subRanges.slice(0, 2),
    ...s3.subRanges.slice(0, 2),
  ];

  const duration =
    grade <= 3 ? '1 Hour 15 Minutes' : grade <= 6 ? '1 Hour 40 Minutes' : grade <= 9 ? '2 Hours' : '2 Hours 30 Minutes';

  const sectionALines = [
    `CANDIDATE'S NAME: _________________________________  KNEC ASSESSMENT NO: ______________`,
    `SCHOOL NAME & CODE: _______________________________  DURATION: ${duration}`,
    `KICD ORANGE BOOK REFERENCE: ${coursebook.lbTitle} & ${coursebook.tgTitle} (${coursebook.publisher})`,
    `PERFORMANCE LEVEL: [ ] EE1/EE2 (75-100%)  [ ] ME1/ME2 (50-74%)  [ ] AE1/AE2 (25-49%)  [ ] BE1/BE2 (0-24%)`,
    '',
    `SECTION A: COMPETENCY MULTIPLE-CHOICE & SHORT STRUCTURED ITEMS (30 MARKS)`,
    `Answer ALL items in Section A and Section B.`,
    '',
  ];

  const sectionBLines = [
    `SECTION B: STRUCTURED & EXTENDED PRACTICAL COMPETENCY TASKS (70 MARKS)`,
    '',
  ];

  const markingLines = [
    `OFFICIAL KNEC-STYLE MARKING SCHEME, POINT ALLOCATION & RUBRIC DESCRIPTORS`,
    `Reference Coursebook: ${coursebook.lbTitle} (${coursebook.publisher})`,
    '',
  ];

  combinedRanges.forEach((sr, idx) => {
    const mcNum = idx + 1;
    const structNum = idx + 7;
    sectionALines.push(
      `Item ${mcNum}. [${sr.strand} — ${sr.sub}] A Grade ${grade} learner studying "${sr.sub}" (${sr.lbRangeLabel}) investigated the inquiry question: "${sr.kiq}"`,
      `   (a) Identify two accurate principles or observations recorded during this activity. (3 marks)`,
      `   (b) State one common mistake learners must avoid when handling ${sr.resources.toLowerCase()}. (2 marks)`,
      ''
    );

    sectionBLines.push(
      `Task ${structNum}. [${sr.strand}: ${sr.sub} — Ref: ${sr.lbRangeLabel}]`,
      `   (a) Explain step-by-step how concepts in "${sr.sub}" apply to real-life situations in Kenya. (6 marks)`,
      `   (b) Using clear illustrations/examples from ${coursebook.lbShort}, solve/demonstrate an applied task on "${sr.sub}". (6 marks)`,
      ''
    );

    markingLines.push(
      `Item ${mcNum} Key (5 mks — ${sr.lbRangeLabel}): (a) 3 marks for two accurate points on "${sr.sub}" (1.5 mks each); (b) 2 marks for valid safety/procedural precaution with ${sr.resources.toLowerCase()}.`,
      `Task ${structNum} Marking Guide (12 mks — ${sr.tgRangeLabel}): (a) 6 marks (2 mks identification + 4 mks contextual Kenyan explanation); (b) 6 marks (EE: Clear method, working & conclusion; ME: Minor omission; AE: Partial setup).`,
      ''
    );
  });

  return renderPdf({
    bannerTag: `${bannerCode} NATIONAL ASSESSMENT SERIES — FULL PAPER & MARKING SCHEME`,
    title: paperTitle,
    subtitle: `Grade ${grade} (${level}) | ${duration} | Includes Section A, Section B & Complete Marking Scheme`,
    footerLabel: `CBC Kenya Hub - ${paperTitle}`,
    sections: [
      { heading: `SECTION A: CORE COMPETENCY ASSESSMENT ITEMS`, body: sectionALines.join('\n') },
      { heading: `SECTION B: STRUCTURED & PRACTICAL APPLICATION TASKS`, body: sectionBLines.join('\n') },
      { heading: `OFFICIAL MARKING SCHEME & KNEC RUBRIC SCORING MATRIX`, body: markingLines.join('\n') },
    ],
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

async function uploadWithRetry(supabase, filename, buffer, contentType, retries = 4) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filename, buffer, { contentType, upsert: true });
    if (!error) return true;
    if (attempt === retries) {
      console.error(`  [!] Failed upload after ${retries} tries (${filename}): ${error.message}`);
      return false;
    }
    await new Promise((r) => setTimeout(r, 450 * attempt));
  }
  return false;
}

async function main() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  }

  const missingOnly = process.argv.includes('--missing-only');
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const tasks = [];

  // ============================================================================
  // PART 1: PRE-PRIMARY (PP1 & PP2) COMPLETE KICD CATALOG (300 FILES)
  // ============================================================================
  for (const ppPlan of PREPRIMARY_CURRICULUM_PLAN) {
    const { gradeCode, dbGrade, level, examBadge, subjects } = ppPlan;

    for (const subject of subjects) {
      const syl = getSyllabusForGrade(gradeCode, subject);
      const coursebook = getApprovedCoursebook(gradeCode, subject);
      const code = syl.shortCode;

      for (const term of [1, 2, 3]) {
        const termBlocks = syl.strandsByTerm[term];

        // 1. Schemes of Work (DOCX - KES 50)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Rationalized_Schemes_of_Work_schemes_format.docx`,
          title: `${gradeCode} ${subject} Rationalized Schemes of Work - Term ${term}`,
          grade: dbGrade,
          level,
          category: 'Schemes of Work',
          subject,
          term,
          format: 'DOCX',
          price: 50,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () =>
            generateSchemeBuffer({ grade: gradeCode, level, subject, term, coursebook, termBlocks }),
        });

        // 2. Lesson Plans (DOCX - KES 70)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Rationalized_CBC_Lesson_Plans.docx`,
          title: `${gradeCode} ${subject} Rationalized CBC Lesson Plans - Term ${term}`,
          grade: dbGrade,
          level,
          category: 'Lesson Plans',
          subject,
          term,
          format: 'DOCX',
          price: 70,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () =>
            generateLessonPlanBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              coursebook,
              termBlocks,
            }),
        });

        // 3. Teachers' & Activity Notes (PDF - KES 100)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Comprehensive_Lesson_Notes.pdf`,
          title: `${gradeCode} ${subject} Rationalized Activity & Lesson Notes - Term ${term}`,
          grade: dbGrade,
          level,
          category: "Teachers' Notes",
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateNotesPdfBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              coursebook,
              termBlocks,
            }),
        });

        // 4. Record of Work & Rubrics (DOCX - KES 50)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Record_of_Work_and_Rubrics.docx`,
          title: `${gradeCode} ${subject} Record of Work & Rubric Tracker - Term ${term}`,
          grade: dbGrade,
          level,
          category: 'Records of Work',
          subject,
          term,
          format: 'DOCX',
          price: 50,
          contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          build: () =>
            generateRecordOfWorkBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              coursebook,
              termBlocks,
            }),
        });

        // 5a. Opener Exam & Marking Scheme (PDF - KES 100)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Opener_Assessment_Exam_Marking_Scheme.pdf`,
          title: `${gradeCode} ${subject} Term ${term} Opener Assessment & Marking Guide`,
          grade: dbGrade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateSpecializedAssessmentPdfBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              examKind: 'OPENER',
              coursebook,
              termBlocks,
            }),
        });

        // 5b. Mid-Term Exam & Marking Scheme (PDF - KES 100)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_Mid_Term_Assessment_Exam_Marking_Scheme.pdf`,
          title: `${gradeCode} ${subject} Term ${term} Mid-Term Assessment & Marking Guide`,
          grade: dbGrade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateSpecializedAssessmentPdfBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              examKind: 'MIDTERM',
              coursebook,
              termBlocks,
            }),
        });

        // 5c. End-Term Exam & Marking Scheme (PDF - KES 100)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_End_Term_Assessment_Exam_Marking_Scheme.pdf`,
          title: `${gradeCode} ${subject} Term ${term} End-Term ${examBadge} & Marking Guide`,
          grade: dbGrade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateExamPdfBuffer({
              grade: gradeCode,
              level,
              examBadge,
              subject,
              term,
              coursebook,
              termBlocks,
            }),
        });

        // 6a. Holiday Activity Workbook (PDF - KES 70)
        tasks.push({
          filename: `${gradeCode}_T${term}_${code}_${HOLIDAY_NAME[term]}_Holiday_Assignment.pdf`,
          title: `${gradeCode} ${subject} Term ${term} (${HOLIDAY_NAME[term]} Holiday) Activity Workbook`,
          grade: dbGrade,
          level,
          category: 'Holiday Assignments & Designs',
          subject,
          term,
          format: 'PDF',
          price: 70,
          contentType: 'application/pdf',
          build: () =>
            generateHolidayPdfBuffer({
              grade: gradeCode,
              level,
              subject,
              term,
              coursebook,
              termBlocks,
            }),
        });
      }

      // 6b. Full-Year Curriculum Design (Terms 1, 2 & 3 -> term: 0)
      tasks.push({
        filename: `${gradeCode}_ALL_TERMS_${code}_Rationalized_Curriculum_Design.pdf`,
        title: `${gradeCode} ${subject} KICD Rationalized Curriculum Design (Terms 1, 2 & 3)`,
        grade: dbGrade,
        level,
        category: 'Holiday Assignments & Designs',
        subject,
        term: 0,
        format: 'PDF',
        price: 70,
        contentType: 'application/pdf',
        build: () =>
          generateCurriculumDesignPdfBuffer({
            grade: gradeCode,
            level,
            subject,
            coursebook,
            allTermsObj: syl.strandsByTerm,
          }),
      });
    }
  }

  // ============================================================================
  // PART 2: GRADES 1-12 OPENER & MID-TERM ASSESSMENT SETS (720 FILES)
  // ============================================================================
  for (const gradePlan of GRADES_CURRICULUM_PLAN) {
    const { grade, level, subjects } = gradePlan;

    for (const subject of subjects) {
      const syl = getSyllabusForGrade(grade, subject);
      const coursebook = getApprovedCoursebook(grade, subject);
      const code = syl.shortCode;

      for (const term of [1, 2, 3]) {
        const termBlocks = syl.strandsByTerm[term];

        tasks.push({
          filename: `G${grade}_T${term}_${code}_Opener_Assessment_Exam_Marking_Scheme.pdf`,
          title: `Grade ${grade} ${subject} Term ${term} Opener Assessment Exam & Marking Scheme`,
          grade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateSpecializedAssessmentPdfBuffer({
              grade,
              level,
              subject,
              term,
              examKind: 'OPENER',
              coursebook,
              termBlocks,
            }),
        });

        tasks.push({
          filename: `G${grade}_T${term}_${code}_Mid_Term_Assessment_Exam_Marking_Scheme.pdf`,
          title: `Grade ${grade} ${subject} Term ${term} Mid-Term Assessment Exam & Marking Scheme`,
          grade,
          level,
          category: 'Revision Papers & Exams',
          subject,
          term,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateSpecializedAssessmentPdfBuffer({
              grade,
              level,
              subject,
              term,
              examKind: 'MIDTERM',
              coursebook,
              termBlocks,
            }),
        });
      }
    }
  }

  // ============================================================================
  // PART 3: KPSEA (GRADE 6), KJSEA (GRADE 9), KEYA (GRADE 3) & GRADE 10
  // NATIONAL PAST PAPERS, PREDICTION TRIALS & MOCK PACKS (99 FILES)
  // ============================================================================
  const nationalSeriesConfigs = [
    {
      grade: 3,
      level: 'Lower Primary',
      bannerCode: 'KNEC KEYA (GRADE 3 SBA)',
      sets: [
        { slug: 'KEYA_KNEC_SBA_Trial_Set_1', label: '2026 KEYA KNEC SBA Trial Paper & Scoring Rubric' },
        { slug: 'KEYA_Past_Assessment_Compilation', label: 'KEYA Past Assessment Compilation & Marking Guide' },
      ],
    },
    {
      grade: 6,
      level: 'Upper Primary',
      bannerCode: 'KNEC KPSEA (GRADE 6 NATIONAL)',
      sets: [
        { slug: 'KPSEA_KNEC_Past_Paper_With_Marking_Scheme', label: 'KPSEA KNEC Past Paper & Official Marking Scheme' },
        { slug: '2026_KPSEA_Prediction_Trial_Set_1', label: '2026 KPSEA Prediction Trial Set 1 & Marking Scheme' },
        { slug: '2026_KPSEA_National_Mock_Set_2', label: '2026 KPSEA National Mock Set 2 & Marking Scheme' },
      ],
    },
    {
      grade: 9,
      level: 'Junior Secondary',
      bannerCode: 'KNEC KJSEA (GRADE 9 NATIONAL)',
      sets: [
        { slug: 'KJSEA_KNEC_Past_Paper_With_Marking_Scheme', label: 'KJSEA KNEC Past Paper & Official Marking Scheme' },
        { slug: '2026_KJSEA_Prediction_Trial_Set_1', label: '2026 KJSEA Prediction Trial Set 1 & Marking Scheme' },
        { slug: '2026_KJSEA_National_Mock_Set_2', label: '2026 KJSEA National Mock Set 2 & Marking Scheme' },
      ],
    },
    {
      grade: 10,
      level: 'Senior School',
      bannerCode: 'SENIOR SCHOOL CBE PATHWAY',
      sets: [
        { slug: '2026_Grade10_CBE_Pathway_Trial_Set_1', label: '2026 CBE Pathway National Trial Set 1 & Marking Scheme' },
        { slug: '2026_Grade10_CBE_Pathway_Mock_Set_2', label: '2026 CBE Pathway Mock Set 2 & Marking Scheme' },
      ],
    },
  ];

  for (const cfg of nationalSeriesConfigs) {
    const plan = GRADES_CURRICULUM_PLAN.find((p) => p.grade === cfg.grade);
    if (!plan) continue;
    for (const subject of plan.subjects) {
      const syl = getSyllabusForGrade(cfg.grade, subject);
      const coursebook = getApprovedCoursebook(cfg.grade, subject);
      const code = syl.shortCode;

      for (const s of cfg.sets) {
        const paperTitle = `Grade ${cfg.grade} ${subject} — ${s.label}`;
        tasks.push({
          filename: `G${cfg.grade}_${code}_${s.slug}.pdf`,
          title: paperTitle,
          grade: cfg.grade,
          level: cfg.level,
          category: 'Revision Papers & Exams',
          subject,
          term: 3,
          format: 'PDF',
          price: 100,
          contentType: 'application/pdf',
          build: () =>
            generateNationalTrialOrPastPaperPdfBuffer({
              grade: cfg.grade,
              level: cfg.level,
              subject,
              paperTitle,
              bannerCode: cfg.bannerCode,
              coursebook,
              allTermsObj: syl.strandsByTerm,
            }),
        });
      }
    }
  }

  console.log(
    `Prepared ${tasks.length} expanded KICD materials (PP1-PP2, Opener/Mid-Term Exams, KPSEA/KJSEA/KEYA/Senior Trials)!`
  );

  const existingStorageFiles = missingOnly ? await listAllBucketFiles(supabase) : new Set();
  const filteredTasks = missingOnly
    ? tasks.filter((t) => !existingStorageFiles.has(t.filename))
    : tasks;

  console.log(`Uploading ${filteredTasks.length} document file(s) with concurrency ${CONCURRENCY}...`);

  let completed = 0;
  let failed = 0;
  let cursor = 0;
  const t0 = Date.now();

  async function worker() {
    while (true) {
      const idx = cursor++;
      if (idx >= filteredTasks.length) break;
      const item = filteredTasks[idx];
      const buffer = await item.build();
      const ok = await uploadWithRetry(supabase, item.filename, buffer, item.contentType);
      if (!ok) failed++;
      completed++;
      if (completed % 150 === 0 || completed === filteredTasks.length) {
        const elapsedSec = ((Date.now() - t0) / 1000).toFixed(1);
        console.log(
          `  Progress: ${completed} / ${filteredTasks.length} files uploaded (${elapsedSec}s, failed=${failed})...`
        );
      }
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));

  const existingDbRows = await fetchAllDbResources(supabase);
  const dbByFilePath = new Map(existingDbRows.map((r) => [r.file_path, r.id]));

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

  if (toInsert.length > 0) {
    console.log(`Inserting ${toInsert.length} new rows into Supabase "resources" table...`);
    const BATCH_SIZE = 200;
    for (let i = 0; i < toInsert.length; i += BATCH_SIZE) {
      const chunk = toInsert.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('resources').insert(chunk);
      if (error) {
        throw new Error(`DB batch insert error at ${i}: ${error.message}`);
      }
    }
  }

  const finalRows = await fetchAllDbResources(supabase);
  console.log(
    `\nEXPANDED UPLOAD COMPLETE! Uploaded ${completed - failed}/${filteredTasks.length} files (failed=${failed}). Total live CBC materials in Supabase: ${finalRows.length}`
  );
  if (failed > 0) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Fatal expanded catalog upload error:', err);
  process.exit(1);
});
