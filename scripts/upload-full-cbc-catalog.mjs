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
  getCurriculumAllocation,
  getTermWeeksConfig,
} from './cbc-syllabus-data.mjs';

const BUCKET_NAME = 'cbc-materials';
const CONCURRENCY = 28;

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

function makeCell(lines, { bold = false, fill = undefined, widthPct = undefined, align = undefined } = {}) {
  const arr = Array.isArray(lines) ? lines : String(lines).split('\n');
  return new TableCell({
    width: widthPct ? { size: widthPct, type: WidthType.PERCENTAGE } : undefined,
    borders: cellBorders(),
    shading: fill ? { type: ShadingType.CLEAR, color: 'auto', fill } : undefined,
    children: arr.map(
      (line) =>
        new Paragraph({
          alignment: align,
          spacing: { before: 26, after: 26 },
          children: [
            new TextRun({
              text: line,
              bold,
              size: 16.5,
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

/**
 * Splits a KICD sub-strand title into distinct micro-aspects while respecting parentheses.
 * Example: "Whole Numbers: Place Value & Total Value" -> ["Place Value", "Total Value"]
 */
function extractSubstrandAspects(subTitle) {
  const raw = String(subTitle || '').trim();
  let prefix = '';
  let body = raw;
  const colonIdx = raw.indexOf(':');
  if (colonIdx > 0 && colonIdx < raw.length - 2) {
    prefix = raw.slice(0, colonIdx).trim();
    body = raw.slice(colonIdx + 1).trim();
  }

  const parts = [];
  let current = '';
  let depth = 0;
  for (let i = 0; i < body.length; i++) {
    const ch = body[i];
    if (ch === '(') depth++;
    if (ch === ')' && depth > 0) depth--;

    if (depth === 0 && (ch === ',' || ch === ';' || ch === '&')) {
      if (current.trim()) parts.push(current.trim());
      current = '';
      continue;
    }
    if (depth === 0 && body.slice(i, i + 5).toLowerCase() === ' and ') {
      if (current.trim()) parts.push(current.trim());
      current = '';
      i += 4;
      continue;
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  const cleaned = parts
    .map((p) => p.replace(/^\s*(and|&)\s+/i, '').trim())
    .filter((p) => p.length > 2);

  if (cleaned.length === 0) return [raw];
  if (prefix && cleaned.length > 1) {
    return cleaned.map((c) =>
      c.toLowerCase().includes(prefix.toLowerCase()) ? c : `${prefix} — ${c}`
    );
  }
  return cleaned;
}

function flattenSubstrands(termBlocks) {
  const items = [];
  for (const b of termBlocks) {
    for (const sub of b.subs) {
      items.push({
        strand: b.strand,
        sub,
        kiq: b.kiq,
        resources: b.resources,
        aspects: extractSubstrandAspects(sub),
      });
    }
  }
  return items;
}

const LESSON_PHASES = [
  {
    tag: 'Concept Introduction & Identification',
    buildOutcomes: (aspect, sub, subject, grade) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Identify and explain key concepts and terms in ${aspect} (${subject} Grade ${grade}).`,
      `2. Observe charts, realia, or demonstrations illustrating ${aspect}.`,
      `3. Show curiosity and active interest while exploring ${sub}.`,
    ],
    buildExperiences: (aspect, resources) => [
      'Learners are guided to:',
      `• Brainstorm prior knowledge and observe teacher demonstrations/charts on ${aspect}.`,
      `• Work in pairs using ${resources.toLowerCase()} to identify and record examples of ${aspect}.`,
    ],
    buildWorkDone: (aspect) =>
      `Introduced key concepts and guided learners to identify examples of ${aspect}.`,
    assessments: ['Oral questions', 'Observation checklist', 'Pair discussion'],
  },
  {
    tag: 'Guided Exploration & Procedure',
    buildOutcomes: (aspect, sub) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Outline the step-by-step principles and procedures involved in ${aspect}.`,
      `2. Carry out guided exploratory activities on ${aspect} in small groups.`,
      `3. Cooperate respectfully with peers during collaborative tasks on ${sub}.`,
    ],
    buildExperiences: (aspect, resources) => [
      'Learners are guided to:',
      `• Discuss step-by-step procedures on ${aspect} using ${resources.toLowerCase()}.`,
      `• Conduct guided group exploration on ${aspect} and share observations with the class.`,
    ],
    buildWorkDone: (aspect) =>
      `Guided collaborative group exploration and step-by-step procedure analysis on ${aspect}.`,
    assessments: ['Observation schedule', 'Assessment rubric', 'Group oral report'],
  },
  {
    tag: 'Worked Illustrations & Structured Practice',
    buildOutcomes: (aspect, sub) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Describe accurate methods and rules applied in ${aspect}.`,
      `2. Perform structured classroom tasks and exercises on ${aspect} accurately.`,
      `3. Demonstrate neatness, accuracy, and confidence when practicing ${sub}.`,
    ],
    buildExperiences: (aspect) => [
      'Learners are guided to:',
      `• Follow worked classroom illustrations and demonstrations on ${aspect}.`,
      `• Complete structured individual and pair practice exercises on ${aspect} and verify answers.`,
    ],
    buildWorkDone: (aspect) =>
      `Demonstrated worked examples and supervised structured learner practice on ${aspect}.`,
    assessments: ['Written exercises', 'Assessment rubric', 'Peer marking'],
  },
  {
    tag: 'Hands-On Practical & Skill Application',
    buildOutcomes: (aspect, sub) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Select appropriate tools, resources, or strategies for ${aspect}.`,
      `2. Execute hands-on practical or skill-based activities on ${aspect} safely.`,
      `3. Uphold safety, responsibility, and care for learning resources during ${sub}.`,
    ],
    buildExperiences: (aspect, resources) => [
      'Learners are guided to:',
      `• Use ${resources.toLowerCase()} safely in practical stations to demonstrate ${aspect}.`,
      `• Record practical observations, measurements, or outputs and display work for peer review.`,
    ],
    buildWorkDone: (aspect) =>
      `Facilitated hands-on practical activity and skill demonstration on ${aspect}.`,
    assessments: ['Practical rubric', 'Observation schedule', 'Portfolio check'],
  },
  {
    tag: 'Real-Life Contextual Application',
    buildOutcomes: (aspect, sub) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Relate ${aspect} to everyday home, school, and Kenyan community situations.`,
      `2. Apply concepts of ${aspect} to solve real-world tasks and contextual problems.`,
      `3. Appreciate the practical importance of ${sub} in daily life.`,
    ],
    buildExperiences: (aspect) => [
      'Learners are guided to:',
      `• Analyze real-life community scenarios and case tasks involving ${aspect}.`,
      `• Formulate practical solutions in groups and present findings to peers.`,
    ],
    buildWorkDone: (aspect) =>
      `Guided learners in applying ${aspect} to solve real-life contextual tasks.`,
    assessments: ['Problem-solving rubric', 'Written questions', 'Oral presentation'],
  },
  {
    tag: 'Extended Inquiry & Collaborative Task',
    buildOutcomes: (aspect, sub) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Analyze varied applications and common misconceptions in ${aspect}.`,
      `2. Create summary charts, models, or peer demonstrations on ${aspect}.`,
      `3. Embrace teamwork, integrity, and constructive peer feedback in ${sub}.`,
    ],
    buildExperiences: (aspect, resources) => [
      'Learners are guided to:',
      `• Consult approved reference materials and ${resources.toLowerCase()} to investigate ${aspect}.`,
      `• Prepare a concise group chart/demonstration on ${aspect} and critique peer presentations kindly.`,
    ],
    buildWorkDone: (aspect) =>
      `Supervised extended collaborative inquiry and peer presentation on ${aspect}.`,
    assessments: ['Project/chart rubric', 'Peer assessment', 'Oral questions'],
  },
];

function buildAssessmentWeekLessons({
  week,
  lessonsPerWeek,
  mode,
  term,
  grade,
  subject,
}) {
  const out = [];
  for (let lsn = 1; lsn <= lessonsPerWeek; lsn++) {
    if (mode === 'midterm') {
      const stages = [
        {
          focus: 'Mid-Term Revision of Weeks 1–7 Strands & Sub-strands',
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            `1. Recall and summarize key concepts covered in Weeks 1 to 7 of Grade ${grade} ${subject}.`,
            '2. Work through guided diagnostic revision questions accurately.',
            '3. Demonstrate readiness and confidence for the Mid-Term Assessment.',
          ],
          experiences: [
            'Learners are guided to:',
            '• Review key inquiry questions, summary notes, and worked tasks from Weeks 1–7.',
            '• Practice structured revision items in pairs and clarify challenging areas.',
          ],
          kiq: 'Which concepts from Weeks 1–7 require consolidation before assessment?',
          resources: ['Term summary charts & revision worksheets', 'Learner notebooks & approved textbook'],
          assessments: ['Oral recap', 'Diagnostic revision check'],
          workCovered: 'Conducted structured revision of Weeks 1–7 strands ahead of Mid-Term CAT.',
        },
        {
          focus: 'Mid-Term Formative Assessment — Written Paper Administration',
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            `1. Interpret structured competency questions on Weeks 1–7 ${subject} strands.`,
            '2. Write clear, accurate responses independently within the allocated time.',
            '3. Practice honesty and integrity during formal assessment.',
          ],
          experiences: [
            'Learners are guided to:',
            '• Read assessment instructions carefully and complete the Mid-Term written paper independently.',
            '• Hand in scripts neatly for competency rubric scoring.',
          ],
          kiq: 'How accurately can learners apply Weeks 1–7 competencies independently?',
          resources: ['Mid-Term Continuous Assessment Paper', 'Official scoring rubric'],
          assessments: ['Written Mid-Term CAT', 'Assessment rubric'],
          workCovered: 'Administered Mid-Term written formative assessment under exam rules.',
        },
        {
          focus: 'Mid-Term Practical / Oral Competency Evaluation',
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            `1. Demonstrate practical/oral skills acquired in Grade ${grade} ${subject}.`,
            '2. Perform hands-on or oral assessment tasks accurately.',
            '3. Exhibit self-efficacy and safety awareness during practical evaluation.',
          ],
          experiences: [
            'Learners are guided to:',
            '• Undertake practical demonstrations, oral tasks, or portfolio checks in turns/groups.',
            '• Reflect on personal skill progression with teacher guidance.',
          ],
          kiq: 'How effectively can learners demonstrate practical competencies?',
          resources: ['Practical assessment apparatus/realia', 'CBC Observation Rubric (EE/ME/AE/BE)'],
          assessments: ['Practical observation rubric', 'Portfolio review'],
          workCovered: 'Evaluated practical/oral competencies and updated formative rubric records.',
        },
        {
          focus: 'Mid-Term Script Review, Corrections & Diagnostic Feedback',
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            '1. Identify strengths and error patterns in the marked Mid-Term assessment.',
            '2. Write complete, accurate corrections for all missed items.',
            '3. Value constructive feedback as a pathway to improvement.',
          ],
          experiences: [
            'Learners are guided to:',
            '• Review marked Mid-Term scripts alongside the official marking guide.',
            '• Work out full corrections in notebooks with peer and teacher support.',
          ],
          kiq: 'How can assessment feedback help improve mastery in remaining weeks?',
          resources: ['Marked Mid-Term scripts', 'Official Marking Scheme'],
          assessments: ['Corrections check', 'Oral questioning'],
          workCovered: 'Reviewed marked Mid-Term scripts and guided full learner corrections.',
        },
        {
          focus: 'Targeted Remedial Support & Half-Term Break Briefing',
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            '1. Resolve specific learning gaps identified during the Mid-Term CAT.',
            '2. Complete targeted remedial practice tasks accurately.',
            '3. Take responsibility for safe, constructive half-term self-study.',
          ],
          experiences: [
            'Learners are guided to:',
            '• Complete targeted remedial drills on challenging sub-strands in small groups.',
            '• Record half-term practice tasks before proceeding for half-term break.',
          ],
          kiq: 'Which sub-strands need extra practice over the half-term break?',
          resources: ['Remedial task cards', 'CBC Rubric Tracker'],
          assessments: ['Remedial exercise check', 'Self-reflection'],
          workCovered: 'Conducted remedial clinic, recorded EE/ME/AE/BE rubrics & briefed for half-term.',
        },
      ];
      const st = stages[Math.min(lsn - 1, stages.length - 1)];
      out.push({
        week,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: 'MID-TERM ASSESSMENT',
        substrand: `Mid-Term Assessment & Half-Term (Lesson ${lsn} of ${lessonsPerWeek})`,
        lessonFocus: st.focus,
        outcomes: st.outcomes,
        experiences: st.experiences,
        kiq: st.kiq,
        resourcesList: st.resources,
        assessments: st.assessments,
        workCovered: st.workCovered,
        isAssessment: true,
      });
    } else if (mode === 'revision') {
      out.push({
        week,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: 'ANNUAL REVISION',
        substrand: `Term ${ROMAN_TERM[term]} & Annual Synthesis (Lesson ${lsn} of ${lessonsPerWeek})`,
        lessonFocus:
          lsn <= Math.ceil(lessonsPerWeek / 2)
            ? `Structured Topical Revision & Past Competency Practice (Part ${lsn})`
            : `Practical Portfolio Verification & Exam Readiness Drill (Part ${lsn})`,
        outcomes: [
          'By the end of the lesson, the learner should be able to:',
          `1. Synthesize core concepts across Grade ${grade} ${subject} strands.`,
          '2. Solve integrated competency-based revision questions and practical tasks.',
          '3. Approach end-of-year summative assessments with confidence and integrity.',
        ],
        experiences: [
          'Learners are guided to:',
          '• Work collaboratively through integrated revision papers and practical checklists.',
          '• Present model answers, verify learner portfolios, and clarify exam techniques.',
        ],
        kiq: `How do the strands studied in Grade ${grade} ${subject} connect in real-life applications?`,
        resourcesList: ['Revision papers & marking guides', 'Learner portfolios & KICD textbook'],
        assessments: ['Timed revision drill', 'Portfolio verification'],
        workCovered: `Facilitated Term ${term} synthesis, timed revision practice & portfolio check (Lesson ${lsn}).`,
        isAssessment: true,
      });
    } else {
      // End of Term Summative Assessment & Closing Week
      const endStages = [
        {
          focus: `Final Term ${ROMAN_TERM[term]} Recap & Summative Exam Preparation`,
          work: `Led final Term ${term} syllabus recap and examination readiness briefing.`,
          assess: ['Oral review', 'Checklist'],
        },
        {
          focus: `End of Term ${ROMAN_TERM[term]} Written Summative Assessment Paper`,
          work: `Administered End of Term ${term} summative written competency paper.`,
          assess: ['Summative Written Paper', 'Scoring Guide'],
        },
        {
          focus: `End of Term ${ROMAN_TERM[term]} Practical / Performance Assessment`,
          work: `Assessed practical/performance tasks and scored learner portfolios.`,
          assess: ['Practical Summative Rubric'],
        },
        {
          focus: 'Summative Script Review, Marking Verification & Feedback',
          work: 'Reviewed summative scripts with learners and verified rubric scores.',
          assess: ['Script review', 'Diagnostic feedback'],
        },
        {
          focus: `CBC Rubric Recording (EE/ME/AE/BE), Holiday Briefing & Term ${ROMAN_TERM[term]} Closing`,
          work: `Finalized Term ${term} EE/ME/AE/BE rubric records, issued holiday work & closed term.`,
          assess: ['Summative CBC Report Rubric'],
        },
      ];
      const st =
        lsn === lessonsPerWeek
          ? endStages[endStages.length - 1]
          : endStages[Math.min(lsn - 1, endStages.length - 2)];

      out.push({
        week,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: 'END OF TERM ASSESSMENT',
        substrand: `End of Term ${ROMAN_TERM[term]} Assessment & Closing (Lesson ${lsn} of ${lessonsPerWeek})`,
        lessonFocus: st.focus,
        outcomes: [
          'By the end of the lesson, the learner should be able to:',
          `1. Demonstrate mastery of Grade ${grade} Term ${term} ${subject} learning outcomes.`,
          `2. Complete ${st.focus.toLowerCase()} accurately and responsibly.`,
          '3. Reflect on term achievements and set goals for holiday revision.',
        ],
        experiences: [
          'Learners are guided to:',
          `• Participate in ${st.focus.toLowerCase()} following official KNEC/CBA guidelines.`,
          '• Review performance rubrics (EE, ME, AE, BE) and note holiday assignment instructions.',
        ],
        kiq: `How effectively were Grade ${grade} Term ${term} ${subject} outcomes achieved?`,
        resourcesList: [
          `End of Term ${ROMAN_TERM[term]} Assessment Papers & Marking Scheme`,
          'CBC Assessment Rubric Grid & Holiday Workbook',
        ],
        assessments: st.assess,
        workCovered: st.work,
        isAssessment: true,
      });
    }
  }
  return out;
}

/**
 * Master Term Lesson Schedule Builder:
 * Produces EVERY SINGLE LESSON (Week 1 Lesson 1 -> Week totalWeeks Lesson lessonsPerWeek)
 * strictly obeying the KICD CBC Weekly Lesson Allocation for the given Grade & Subject.
 */
function buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks }) {
  const allocation = getCurriculumAllocation(grade, subject);
  const { lessonsPerWeek, minutesPerLesson, stepTimings } = allocation;
  const weekCfg = getTermWeeksConfig(term);
  const { totalWeeks, midTermWeek, revisionWeek, endTermWeek, teachingWeeks } = weekCfg;

  const subs = flattenSubstrands(termBlocks);
  const totalTeachingLessons = teachingWeeks.length * lessonsPerWeek;

  // Proportionally distribute totalTeachingLessons across all sub-strands in chronological order
  const subCounts = subs.map((_, i) => {
    const start = Math.floor((i * totalTeachingLessons) / subs.length);
    const end = Math.floor(((i + 1) * totalTeachingLessons) / subs.length);
    return Math.max(1, end - start);
  });
  let sumCounts = subCounts.reduce((a, b) => a + b, 0);
  while (sumCounts > totalTeachingLessons) {
    const maxIdx = subCounts.indexOf(Math.max(...subCounts));
    subCounts[maxIdx]--;
    sumCounts--;
  }
  while (sumCounts < totalTeachingLessons) {
    subCounts[sumCounts % subCounts.length]++;
    sumCounts++;
  }

  // Build ordered pool of instructional lessons
  const instructionalPool = [];
  const subRanges = [];
  let runningTgPage = (term - 1) * 56 + 1;
  let runningLbPage = (term - 1) * 68 + 1;

  subs.forEach((subItem, sIdx) => {
    const count = subCounts[sIdx];
    const startPoolIdx = instructionalPool.length;

    for (let k = 0; k < count; k++) {
      const aspect = subItem.aspects[k % subItem.aspects.length];
      const isConsolidation = count >= 3 && k === count - 1;

      const tgRef = `${publisher} ${subject} T.G. Grd ${grade} Pg.${runningTgPage}-${runningTgPage + 2}`;
      const lbRef = `${publisher} Learner's Bk Grd ${grade} Pg.${runningLbPage}-${runningLbPage + 3}`;
      runningTgPage += 2;
      runningLbPage += 3;

      if (isConsolidation) {
        instructionalPool.push({
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag: 'Topical Consolidation & Formative Check',
          lessonFocus: `${subItem.sub} — Topical Consolidation & Formative Check`,
          outcomes: [
            'By the end of the lesson, the learner should be able to:',
            `1. Summarize the core concepts and procedures learned across ${subItem.sub}.`,
            `2. Solve structured topical review tasks and practical checks on ${subItem.sub} accurately.`,
            `3. Appreciate the relevance of ${subItem.sub} and reflect on personal progress.`,
          ],
          experiences: [
            'Learners are guided to:',
            `• Review key points and answer the inquiry question ("${subItem.kiq}") in collaborative groups.`,
            `• Complete a short formative mastery exercise on ${subItem.sub} and conduct peer/teacher review.`,
          ],
          kiq: subItem.kiq,
          resourcesList: [subItem.resources, tgRef, lbRef],
          assessments: ['Topical formative quiz', 'CBC Assessment rubric', 'Self & peer review'],
          workCovered: `Consolidated ${subItem.sub} and administered topical formative mastery check.`,
        });
      } else {
        const phase = LESSON_PHASES[k % LESSON_PHASES.length];
        instructionalPool.push({
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag: phase.tag,
          lessonFocus: `${subItem.sub} — ${phase.tag}: ${aspect}`,
          outcomes: phase.buildOutcomes(aspect, subItem.sub, subject, grade),
          experiences: phase.buildExperiences(aspect, subItem.resources),
          kiq: subItem.kiq,
          resourcesList: [subItem.resources, tgRef, lbRef],
          assessments: phase.assessments,
          workCovered: phase.buildWorkDone(aspect),
        });
      }
    }

    subRanges.push({
      strand: subItem.strand,
      sub: subItem.sub,
      kiq: subItem.kiq,
      resources: subItem.resources,
      lessonCount: count,
      startPoolIdx,
      endPoolIdx: instructionalPool.length - 1,
    });
  });

  // Assemble full week-by-week, lesson-by-lesson schedule
  const lessons = [];
  let poolCursor = 0;

  for (let wk = 1; wk <= totalWeeks; wk++) {
    if (wk === midTermWeek) {
      lessons.push(
        ...buildAssessmentWeekLessons({
          week: wk,
          lessonsPerWeek,
          mode: 'midterm',
          term,
          grade,
          subject,
        })
      );
      continue;
    }
    if (wk === revisionWeek) {
      lessons.push(
        ...buildAssessmentWeekLessons({
          week: wk,
          lessonsPerWeek,
          mode: 'revision',
          term,
          grade,
          subject,
        })
      );
      continue;
    }
    if (wk === endTermWeek) {
      lessons.push(
        ...buildAssessmentWeekLessons({
          week: wk,
          lessonsPerWeek,
          mode: 'endterm',
          term,
          grade,
          subject,
        })
      );
      continue;
    }

    for (let lsn = 1; lsn <= lessonsPerWeek; lsn++) {
      const item = instructionalPool[poolCursor++];
      lessons.push({
        week: wk,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: item.strand,
        substrand: `${item.baseSubstrand}\n(Lsn ${lsn}/${lessonsPerWeek}: ${item.aspect} — ${item.phaseTag})`,
        baseSubstrand: item.baseSubstrand,
        aspect: item.aspect,
        phaseTag: item.phaseTag,
        lessonFocus: item.lessonFocus,
        outcomes: item.outcomes,
        experiences: item.experiences,
        kiq: item.kiq,
        resourcesList: item.resourcesList,
        assessments: item.assessments,
        workCovered: item.workCovered,
        isAssessment: false,
      });
    }
  }

  // Enrich subRanges with exact Week/Lesson start and end coordinates
  const instructionalLessonsOnly = lessons.filter((l) => !l.isAssessment);
  for (const sr of subRanges) {
    const firstL = instructionalLessonsOnly[sr.startPoolIdx];
    const lastL = instructionalLessonsOnly[sr.endPoolIdx];
    sr.spanLabel =
      firstL && lastL
        ? `Wk ${firstL.week} Lsn ${firstL.lessonNumber} – Wk ${lastL.week} Lsn ${lastL.lessonNumber}`
        : `${sr.lessonCount} Lessons`;
    sr.lessonsSlice = instructionalLessonsOnly.slice(sr.startPoolIdx, sr.endPoolIdx + 1);
  }

  return {
    lessonsPerWeek,
    minutesPerLesson,
    stepTimings,
    totalWeeks,
    totalTeachingLessons,
    lessons,
    subRanges,
    level,
  };
}

// 1. Exact schemes.co.ke 10-column Rationalized Scheme of Work DOCX (Every Individual Lesson Clear!)
async function generateSchemeBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons } = schedule;

  const headers = [
    'Wk',
    'LSN',
    'strand',
    'Sub-strand & Lesson Focus',
    'Lesson Learning Outcomes',
    'Learning Experiences',
    'Key Inquiry Question(s)',
    'Learning Resources',
    'Assessment Methods',
    'Refl',
  ];
  const widths = [4, 4, 11, 14, 20, 19, 10, 9, 6, 3];

  const tableRows = [
    new TableRow({
      tableHeader: true,
      children: headers.map((h, i) =>
        makeCell(h, { bold: true, fill: '065F46', widthPct: widths[i] })
      ),
    }),
    ...lessons.map((l, idx) => {
      const isWeekStart = l.lessonNumber === 1;
      const rowFill = l.isAssessment
        ? 'FEF3C7'
        : isWeekStart
        ? 'ECFDF5'
        : idx % 2 === 1
        ? 'F8FAFC'
        : undefined;

      const cells = [
        makeCell(String(l.week), {
          bold: isWeekStart,
          fill: rowFill,
          widthPct: widths[0],
          align: AlignmentType.CENTER,
        }),
        makeCell(String(l.lessonNumber), {
          bold: true,
          fill: rowFill,
          widthPct: widths[1],
          align: AlignmentType.CENTER,
        }),
        makeCell(l.strand, {
          bold: isWeekStart,
          fill: rowFill,
          widthPct: widths[2],
        }),
        makeCell(l.substrand, {
          bold: isWeekStart,
          fill: rowFill,
          widthPct: widths[3],
        }),
        makeCell(l.outcomes, { fill: rowFill, widthPct: widths[4] }),
        makeCell(l.experiences, { fill: rowFill, widthPct: widths[5] }),
        makeCell(l.kiq, { fill: rowFill, widthPct: widths[6] }),
        makeCell(l.resourcesList, { fill: rowFill, widthPct: widths[7] }),
        makeCell(l.assessments, { fill: rowFill, widthPct: widths[8] }),
        makeCell('', { fill: rowFill, widthPct: widths[9] }),
      ];

      return new TableRow({ children: cells });
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 560, right: 560, bottom: 560, left: 560 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 50 },
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
            spacing: { after: 45 },
            children: [
              new TextRun({
                text: `KICD WEEKLY ALLOCATION: ${lessonsPerWeek} LESSONS PER WEEK (${minutesPerLesson} MINS EACH)   |   TERM ${ROMAN_TERM[term]} SCHEDULE: ${totalWeeks} WEEKS (${lessons.length} LESSONS)`,
                bold: true,
                size: 18,
                font: 'Calibri',
                color: '0F766E',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: `NAME OF THE TEACHER: ____________________________________     TSC NO: __________________`,
                bold: true,
                size: 18,
                font: 'Calibri',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 140 },
            children: [
              new TextRun({
                text: `SCHOOL: ________________________________________________     TERM: ${ROMAN_TERM[term]}     YEAR: 2026`,
                bold: true,
                size: 18,
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

// 2. Complete Lesson-by-Lesson KICD CBC Lesson Plans DOCX (All Lessons of Every Week Clear!)
async function generateLessonPlanBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, stepTimings, totalWeeks, lessons } = schedule;
  const durationLabel = `${minutesPerLesson} Minutes`;

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `${subject.toUpperCase()} RATIONALIZED CBC LESSON PLANS — GRADE ${grade} TERM ${ROMAN_TERM[term]}`,
          bold: true,
          size: 25,
          font: 'Calibri',
          color: '065F46',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
      children: [
        new TextRun({
          text: `KICD Official Allocation: ${lessonsPerWeek} Lessons Per Week × ${minutesPerLesson} Minutes  |  Weeks 1–${totalWeeks} (${lessons.length} Individual Lesson Plans)`,
          bold: true,
          size: 19,
          font: 'Calibri',
          color: '0F766E',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 180 },
      children: [
        new TextRun({
          text: `Competency-Based Curriculum (${level}) • Complete Ready-to-Teach Lesson-by-Lesson Plans`,
          italics: true,
          size: 18,
          font: 'Calibri',
        }),
      ],
    }),
  ];

  lessons.forEach((l, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: idx > 0 ? 220 : 40, after: 70 },
        children: [
          new TextRun({
            text: `WEEK ${l.week} • LESSON ${l.lessonNumber} OF ${lessonsPerWeek}: ${l.lessonFocus.toUpperCase()}`,
            bold: true,
            size: 20,
            font: 'Calibri',
            color: '065F46',
          }),
        ],
      }),
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            children: [
              makeCell('SCHOOL', { bold: true, fill: 'F1F5F9', widthPct: 18 }),
              makeCell('LEARNING AREA', { bold: true, fill: 'F1F5F9', widthPct: 21 }),
              makeCell('GRADE & TERM', { bold: true, fill: 'F1F5F9', widthPct: 15 }),
              makeCell('WEEK & LESSON', { bold: true, fill: 'F1F5F9', widthPct: 16 }),
              makeCell('DATE & TIME', { bold: true, fill: 'F1F5F9', widthPct: 15 }),
              makeCell('ROLL', { bold: true, fill: 'F1F5F9', widthPct: 15 }),
            ],
          }),
          new TableRow({
            children: [
              makeCell('_______________', { widthPct: 18 }),
              makeCell(subject, { widthPct: 21 }),
              makeCell(`Grd ${grade} • T${term}`, { widthPct: 15 }),
              makeCell(`Wk ${l.week}, Lsn ${l.lessonNumber}/${lessonsPerWeek}`, {
                bold: true,
                widthPct: 16,
              }),
              makeCell(`__/__/26 (${durationLabel})`, { widthPct: 15 }),
              makeCell('B:__ G:__ T:__', { widthPct: 15 }),
            ],
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 80, after: 35 },
        children: [
          new TextRun({ text: 'STRAND: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: `${l.strand}    |    `, size: 18, font: 'Calibri' }),
          new TextRun({ text: 'SUB-STRAND & FOCUS: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: l.lessonFocus, size: 18, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 35 },
        children: [
          new TextRun({ text: 'Specific Lesson Learning Outcomes: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({
            text: l.outcomes.slice(1).join('  '),
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 35 },
        children: [
          new TextRun({ text: 'Key Inquiry Question(s): ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: l.kiq, size: 18, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 35 },
        children: [
          new TextRun({ text: 'Core Competencies, Values & PCIs: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({
            text: 'Communication & Collaboration, Critical Thinking & Problem Solving, Self-Efficacy; Values: Respect, Unity, Responsibility & Integrity; PCIs: Safety, Citizenship & Environmental Stewardship.',
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 35 },
        children: [
          new TextRun({ text: 'Learning Resources: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({
            text: l.resourcesList.join('; '),
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 45, after: 25 },
        children: [
          new TextRun({
            text: `Organization of Learning (${minutesPerLesson} Minutes Total):`,
            bold: true,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 22 },
        children: [
          new TextRun({
            text: `• Introduction (${stepTimings.intro} min): Review previous lesson (Wk ${l.week}${l.lessonNumber > 1 ? ` Lsn ${l.lessonNumber - 1}` : ''}) and introduce "${l.lessonFocus}" using the Key Inquiry Question.`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 22 },
        children: [
          new TextRun({
            text: `• Step 1 — Explore & Investigate (${stepTimings.step1} min): ${l.experiences[1] ? l.experiences[1].replace(/^•\s*/, '') : `Learners explore ${l.lessonFocus} in pairs/groups.`}`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 22 },
        children: [
          new TextRun({
            text: `• Step 2 — Explain, Practice & Apply (${stepTimings.step2} min): ${l.experiences[2] ? l.experiences[2].replace(/^•\s*/, '') : `Teacher clarifies key points and guides structured practice.`}`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 28 },
        children: [
          new TextRun({
            text: `• Conclusion & Assessment (${stepTimings.conclusion} min): Check attainment of outcomes via ${l.assessments.join(', ').toLowerCase()}. Extended Activity: Real-life practice task at home/community.`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({
            text: 'Teacher Self-Evaluation / Reflection: __________________________________________________________________',
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      })
    );
  });

  const doc = new Document({ sections: [{ children }] });
  return Packer.toBuffer(doc);
}

// 3. Official TSC / KICD Lesson-by-Lesson Record of Work Covered & Rubric Tracker DOCX
async function generateRecordOfWorkBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons } = schedule;

  const headers = [
    'WK',
    'LSN',
    'DATE',
    'STRAND',
    'SUB-STRAND & LESSON TOPIC',
    'WORK COVERED (LESSON SUMMARY)',
    'RUBRIC (EE / ME / AE / BE)',
    'REMARKS & SIGN',
  ];
  const widths = [4, 5, 9, 14, 21, 23, 14, 10];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 560, right: 560, bottom: 560, left: 560 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 50 },
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
            spacing: { after: 45 },
            children: [
              new TextRun({
                text: `CBC WEEKLY LESSON ALLOCATION: ${lessonsPerWeek} LESSONS PER WEEK (${minutesPerLesson} MINS EACH)   |   TERM ${ROMAN_TERM[term]} TOTAL: ${lessons.length} LESSONS (${totalWeeks} WEEKS)`,
                bold: true,
                size: 18,
                font: 'Calibri',
                color: '0F766E',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 130 },
            children: [
              new TextRun({
                text: `SCHOOL: __________________________   TEACHER: _____________________   TSC NO: ____________   LEVEL: ${level}   TERM: ${ROMAN_TERM[term]}   YEAR: 2026`,
                bold: true,
                size: 18,
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
              ...lessons.map((l, idx) => {
                const isWeekStart = l.lessonNumber === 1;
                const fill = l.isAssessment
                  ? 'FEF3C7'
                  : isWeekStart
                  ? 'ECFDF5'
                  : idx % 2 === 1
                  ? 'F8FAFC'
                  : undefined;

                return new TableRow({
                  children: [
                    makeCell(String(l.week), {
                      bold: isWeekStart,
                      fill,
                      widthPct: widths[0],
                      align: AlignmentType.CENTER,
                    }),
                    makeCell(String(l.lessonNumber), {
                      bold: true,
                      fill,
                      widthPct: widths[1],
                      align: AlignmentType.CENTER,
                    }),
                    makeCell('__/__/26', { fill, widthPct: widths[2] }),
                    makeCell(l.strand, { bold: isWeekStart, fill, widthPct: widths[3] }),
                    makeCell(l.lessonFocus, { fill, widthPct: widths[4] }),
                    makeCell(l.workCovered, { fill, widthPct: widths[5] }),
                    makeCell('EE:__ ME:__ AE:__ BE:__', { fill, widthPct: widths[6] }),
                    makeCell('', { fill, widthPct: widths[7] }),
                  ],
                });
              }),
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
    y: pageHeight - 92,
    width: pageWidth,
    height: 92,
    color: rgb(0.024, 0.373, 0.275),
  });

  page.drawText(toWinAnsiSafe(bannerTag).slice(0, 92), {
    x: margin,
    y: pageHeight - 34,
    size: 9,
    font: fontBold,
    color: rgb(0.68, 0.96, 0.84),
  });

  page.drawText(toWinAnsiSafe(title).slice(0, 74), {
    x: margin,
    y: pageHeight - 54,
    size: 13,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(toWinAnsiSafe(subtitle).slice(0, 94), {
    x: margin,
    y: pageHeight - 74,
    size: 9.2,
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
    page.drawText(toWinAnsiSafe(sec.heading).slice(0, 84), {
      x: margin,
      y,
      size: 11.2,
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
      const isBoldLine =
        /^(Q\d+\.|TASK|\d+\.|Answer|Marking|Key|Rubric|Strand|Sub-strand|Official|Term \d|Wk \d)/i.test(
          line
        );
      page.drawText(line, {
        x: margin,
        y,
        size: 9.6,
        font: isBoldLine ? fontBold : fontRegular,
        color: rgb(0.12, 0.16, 0.23),
      });
      y -= 13.8;
    }
    y -= 10;
  }

  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(toWinAnsiSafe(`${footerLabel} - Page ${idx + 1} of ${pages.length}`), {
      x: margin,
      y: 22,
      size: 8.5,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.56),
    });
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// 4. Comprehensive Lesson-Mapped Notes PDF
async function generateNotesPdfBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons, subRanges } = schedule;

  const overviewSection = {
    heading: `TERM ${term} SYLLABUS & WEEKLY LESSON ALLOCATION OVERVIEW`,
    body: [
      `Official KICD Weekly Allocation: ${lessonsPerWeek} Lessons per Week (${minutesPerLesson} Minutes per Lesson)`,
      `Term ${term} Schedule: ${totalWeeks} Weeks (${lessons.length} Total Lessons including Formative & Summative Assessments)`,
      `Approved Primary Reference: ${publisher} ${subject} Grade ${grade} Learner's Book & Teacher's Guide`,
      '',
      ...subRanges.map(
        (sr, i) =>
          `${i + 1}. ${sr.sub} [${sr.strand}] -> ${sr.lessonCount} Lessons (${sr.spanLabel})`
      ),
    ].join('\n'),
  };

  const unitSections = subRanges.map((sr, idx) => ({
    heading: `UNIT ${idx + 1}: ${sr.sub.toUpperCase()} (${sr.spanLabel})`,
    body: [
      `Strand: ${sr.strand}  |  Allocated Time: ${sr.lessonCount} Lessons (${lessonsPerWeek} Lessons/Week, ${minutesPerLesson} mins each)`,
      `Key Inquiry Question: ${sr.kiq}`,
      `Required Teaching & Study Aids: ${sr.resources}`,
      '',
      `Lesson-by-Lesson Study & Teaching Sequence:`,
      ...sr.lessonsSlice.map(
        (l) =>
          `Wk ${l.week} Lsn ${l.lessonNumber}: ${l.aspect} (${l.phaseTag}) — ${l.outcomes[1].replace(/^1\.\s*/, '')}`
      ),
      '',
      `Key Study Summary: Learners in Grade ${grade} (${level}) master ${sr.sub} systematically across ${sr.lessonCount} structured lessons, linking concepts to practical Kenyan household, school, and community applications.`,
      `Collaborative Practical Activity: Using ${sr.resources.toLowerCase()}, learners work in groups to observe, demonstrate procedures, record findings neatly, and present conclusions.`,
      `Topical Self-Check: (a) Summarize the main concepts learned in ${sr.sub}. (b) Answer with practical examples: "${sr.kiq}"`,
    ].join('\n'),
  }));

  return renderPdf({
    bannerTag: `KICD RATIONALIZED CBC LESSON NOTES - TERM ${term} (${lessonsPerWeek} LESSONS/WEEK)`,
    title: `Grade ${grade} ${subject} Lesson Notes - Term ${term}`,
    subtitle: `${level} | ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Mins) | Lesson-by-Lesson Study & Teaching Guide`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Term ${term} Notes (${lessonsPerWeek} Lsns/Wk)`,
    sections: [overviewSection, ...unitSections],
  });
}

// 5. CBC Exam & Marking Scheme PDF (Weighted by KICD Lesson Allocation)
async function generateExamPdfBuffer({ grade, level, examBadge, subject, term, publisher, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, subRanges } = schedule;
  const examDuration =
    grade <= 3 ? '1 Hour' : grade <= 6 ? '1 Hour 20 Minutes' : grade <= 9 ? '1 Hour 40 Minutes' : '2 Hours';

  const qLines = [
    `LEARNER'S NAME: ____________________________________  ASSESSMENT NO: _______________`,
    `SCHOOL: ____________________________________________  TIME ALLOWED: ${examDuration}`,
    `SYLLABUS COVERAGE: Term ${term} (${lessonsPerWeek} Lessons/Week, ${minutesPerLesson} Mins/Lesson KICD Scope)`,
    `RUBRIC SCORE:  [ ] EE (80-100%)   [ ] ME (50-79%)   [ ] AE (30-49%)   [ ] BE (0-29%)`,
    '',
    `INSTRUCTIONS: Answer ALL questions in the spaces provided. Show clear working/explanations.`,
    '',
  ];

  const mLines = [];
  subRanges.forEach((item, i) => {
    const q1 = i * 2 + 1;
    const q2 = i * 2 + 2;
    qLines.push(
      `Q${q1}. [${item.strand} - ${item.sub} | Covered in ${item.spanLabel}] Identify and explain two key concepts studied in ${item.sub} in Grade ${grade} ${subject}. (4 marks)`,
      `Q${q2}. Practical Competency Application: ${item.kiq} Explain two practical points using examples from your school or community. (6 marks)`,
      ''
    );
    mLines.push(
      `Q${q1} Marking Guide (4 mks): Award 2 marks each for any two accurate concepts/explanations on ${item.sub} aligned to KICD Grade ${grade} ${subject} syllabus (${publisher}).`,
      `Q${q2} Marking Guide (6 mks): Award 3 marks per well-explained real-life application addressing "${item.kiq}" (Knowledge: 2 mks, Application: 2 mks, Clarity: 2 mks).`
    );
  });

  qLines.push(
    `Q${subRanges.length * 2 + 1}. Extended Practical Task: Describe a step-by-step demonstration or project on ${subRanges[0].sub} using locally available materials (${subRanges[0].resources}). (10 marks)`
  );
  mLines.push(
    `Q${subRanges.length * 2 + 1} Rubric (10 mks): Exceeding Expectations (8-10 mks): Complete, accurate procedure & safety observed; Meeting Expectations (5-7 mks): Correct main steps; Approaching (3-4 mks): Partial steps.`
  );

  return renderPdf({
    bannerTag: `KENYA COMPETENCY-BASED ASSESSMENT (${examBadge}) - TERM ${term}`,
    title: `Grade ${grade} ${subject} Term ${term} ${examBadge} Exam & Marking Scheme`,
    subtitle: `${level} Summative Assessment (${examDuration}) + Complete Rubric Scoring Guide`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Term ${term} Exam`,
    sections: [
      { heading: `SECTION A & B: ASSESSMENT QUESTIONS (TERM ${term})`, body: qLines.join('\n') },
      { heading: `OFFICIAL MARKING SCHEME & RUBRIC SCORING GUIDE`, body: mLines.join('\n\n') },
    ],
  });
}

// 6. Holiday Assignment Booklet PDF (Mapped to Term's Weekly Lessons)
async function generateHolidayPdfBuffer({ grade, level, subject, term, publisher, termBlocks }) {
  const holiday = HOLIDAY_NAME[term];
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, publisher, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, subRanges } = schedule;

  const body = [
    `LEARNER'S NAME: ____________________________________   GRADE ${grade} (${level})`,
    `PARENT / GUARDIAN SIGNATURE: _______________________   DATE COMPLETED: ______________`,
    `TERM ${term} COVERAGE RECAP: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins each)`,
    '',
    `PART 1: LESSON-ALIGNED TOPICAL REVISION TASKS (${holiday.toUpperCase()} HOLIDAY)`,
    ...subRanges.map(
      (s, idx) =>
        `${idx + 1}. Topic: ${s.sub} (${s.strand} — Studied in ${s.spanLabel}, ${s.lessonCount} Lessons)\n` +
        `   (a) Review your Term ${term} lesson notes on ${s.sub} and write a clear five-point summary.\n` +
        `   (b) Guided Inquiry Task: ${s.kiq}\n`
    ),
    `PART 2: HOME-BASED PRACTICAL / PARENTAL ENGAGEMENT PROJECT`,
    `With the guidance of your parent or guardian, use safe locally available items (${subRanges[0].resources}) to complete a practical portfolio task on "${subRanges[0].sub}" and bring your report on opening day.`,
  ].join('\n');

  return renderPdf({
    bannerTag: `CBC ${holiday.toUpperCase()} HOLIDAY REVISION & HOME PROJECT - TERM ${term}`,
    title: `Grade ${grade} ${subject} Term ${term} (${holiday}) Holiday Assignment`,
    subtitle: `${level} | Aligned to ${lessonsPerWeek} Lessons/Week Term ${term} Syllabus`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} ${holiday} Holiday Pack`,
    sections: [{ heading: `${holiday.toUpperCase()} HOLIDAY WORKBOOK — ${subject.toUpperCase()}`, body }],
  });
}

// 7. Full-Year (Terms 1, 2 & 3 Combined) Rationalized Curriculum Design & Lesson Allocation PDF
async function generateCurriculumDesignPdfBuffer({ grade, level, subject, publisher, allTermsObj }) {
  const { lessonsPerWeek, minutesPerLesson } = getCurriculumAllocation(grade, subject);
  const t1Total = 13 * lessonsPerWeek;
  const t2Total = 14 * lessonsPerWeek;
  const t3Total = 9 * lessonsPerWeek;
  const annualTotal = t1Total + t2Total + t3Total;

  const allocationOverview = {
    heading: `OFFICIAL KICD WEEKLY & ANNUAL LESSON ALLOCATION MATRIX`,
    body: [
      `Learning Area: ${subject}   |   Grade ${grade} (${level})`,
      `Official Weekly Lesson Allocation: ${lessonsPerWeek} Lessons per Week (${minutesPerLesson} Minutes per Lesson)`,
      `Term 1 Allocation (13 Weeks): ${t1Total} Total Lessons (11 Instructional Weeks = ${11 * lessonsPerWeek} Lessons + Assessment Weeks)`,
      `Term 2 Allocation (14 Weeks): ${t2Total} Total Lessons (12 Instructional Weeks = ${12 * lessonsPerWeek} Lessons + Assessment Weeks)`,
      `Term 3 Allocation (9 Weeks):  ${t3Total} Total Lessons (7 Instructional Weeks = ${7 * lessonsPerWeek} Lessons + End-Year Exams)`,
      `Full Academic Year Total (36 Weeks): ${annualTotal} Allocated Lessons`,
    ].join('\n'),
  };

  const termSections = [1, 2, 3].map((t) => {
    const sched = buildTermLessonSchedule({
      grade,
      level,
      subject,
      term: t,
      publisher,
      termBlocks: allTermsObj[t],
    });
    return {
      heading: `TERM ${t} RATIONALIZED STRANDS, SUB-STRANDS & LESSON DISTRIBUTION (${sched.totalWeeks} WEEKS | ${sched.lessons.length} LESSONS)`,
      body: sched.subRanges
        .map(
          (sr, idx) =>
            `Sub-strand ${t}.${idx + 1}: ${sr.sub} (${sr.strand})\n` +
            `- Allocated Lessons: ${sr.lessonCount} Lessons (${sr.spanLabel}, at ${lessonsPerWeek} lessons/week)\n` +
            `- Key Inquiry Question: ${sr.kiq}\n` +
            `- Suggested Resources: ${sr.resources}`
        )
        .join('\n\n'),
    };
  });

  return renderPdf({
    bannerTag: `KICD RATIONALIZED CURRICULUM DESIGN (${lessonsPerWeek} LESSONS/WEEK | TERMS 1, 2 & 3)`,
    title: `Grade ${grade} ${subject} Rationalized Curriculum Design (Terms 1-3)`,
    subtitle: `${level} | ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Mins) | ${annualTotal} Annual Lessons Mapped`,
    footerLabel: `CBC Kenya Resource Hub - Grade ${grade} ${subject} Curriculum Design`,
    sections: [allocationOverview, ...termSections],
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
  const startArg = process.argv.find((a) => a.startsWith('--start='));
  const startIndex = startArg ? Math.max(0, parseInt(startArg.split('=')[1], 10)) : 0;

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
          build: () =>
            generateLessonPlanBuffer({ grade, level, subject, term, publisher, termBlocks }),
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
          build: () =>
            generateExamPdfBuffer({
              grade,
              level,
              examBadge,
              subject,
              term,
              publisher,
              termBlocks,
            }),
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
          build: () =>
            generateRecordOfWorkBuffer({ grade, level, subject, term, publisher, termBlocks }),
        });

        // 6a. Holiday Assignment Package (PDF - KES 70)
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
          build: () =>
            generateHolidayPdfBuffer({ grade, level, subject, term, publisher, termBlocks }),
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
            publisher,
            allTermsObj: syl.strandsByTerm,
          }),
      });
    });
  }

  console.log(`Prepared ${tasks.length} total CBC curriculum materials across Grades 1 to 12!`);

  const existingStorageFiles = missingOnly ? await listAllBucketFiles(supabase) : new Set();
  const filteredTasks = missingOnly
    ? tasks.filter((t) => !existingStorageFiles.has(t.filename))
    : tasks.slice(startIndex);

  console.log(
    `${missingOnly ? 'Uploading missing' : 'Regenerating & overwriting'} ${filteredTasks.length} document file(s) with concurrency ${CONCURRENCY}...`
  );

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
        level: t.grade <= 3 ? 'Lower Primary' : t.grade <= 6 ? 'Upper Primary' : t.grade <= 9 ? 'Junior Secondary' : 'Senior School',
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
    `\nALL DONE! Regenerated ${completed - failed}/${filteredTasks.length} files. Total live CBC materials in Supabase catalog: ${finalRows.length}`
  );
  if (failed > 0) {
    process.exit(2);
  }
}

main().catch((err) => {
  console.error('Fatal catalog upload error:', err);
  process.exit(1);
});
