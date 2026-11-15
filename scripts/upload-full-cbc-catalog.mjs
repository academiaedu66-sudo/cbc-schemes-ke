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
  GRADES_CURRICULUM_PLAN,
  getApprovedCoursebook,
  getSyllabusForGrade,
  buildDomainLessonNotes,
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
    .replace(/÷/g, '/')
    .replace(/×/g, 'x')
    .replace(/µ/g, 'u')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/—/g, ' - ')
    .replace(/–/g, '-')
    .replace(/•/g, '-')
    .replace(/’/g, "'")
    .replace(/\s{2,}/g, ' ')
    .replace(/[^\x20-\x7E\xA0-\xFF\n]/g, '');
}

function wrapLines(text, maxChars = 88) {
  const safeText = String(text || '')
    .split('\n')
    .map((ln) => toWinAnsiSafe(ln))
    .join('\n');
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

/**
 * Splits a KICD sub-strand title into distinct micro-aspects while respecting parentheses.
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
    if (depth === 0 && body.slice(i, i + 4).toLowerCase() === ' na ') {
      const rightSide = body.slice(i + 4).trim();
      if (current.trim().split(/\s+/).length >= 2 && rightSide.split(/\s+/).length >= 2) {
        parts.push(current.trim());
        current = '';
        i += 3;
        continue;
      }
    }
    current += ch;
  }
  if (current.trim()) parts.push(current.trim());

  const cleaned = parts
    .map((p) => p.replace(/^\s*(and|&|na)\s+/i, '').trim())
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

const LESSON_PHASES_EN = [
  {
    tag: 'Concept Introduction & Identification',
    buildOutcomes: (aspect, sub, subject, grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Identify and explain key concepts and terms in ${aspect} (${lbCitation}).`,
      `2. Observe charts, realia, or demonstrations illustrating ${aspect}.`,
      `3. Show curiosity and active interest while exploring ${sub} in Grade ${grade} ${subject}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Learners are guided to:',
      `• Brainstorm prior knowledge and observe teacher demonstrations/charts on ${aspect} using ${resources.toLowerCase()}.`,
      `• Work in pairs with ${lbCitation} to identify, discuss, and record accurate examples of ${aspect}.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Introduced key concepts and guided learners to identify examples of ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Oral questions', 'Observation checklist', 'Pair discussion'],
  },
  {
    tag: 'Guided Exploration & Procedure',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Outline the step-by-step principles and procedures involved in ${aspect} (${lbCitation}).`,
      `2. Carry out guided exploratory activities on ${aspect} in small groups.`,
      `3. Cooperate respectfully with peers during collaborative tasks on ${sub}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Learners are guided to:',
      `• Discuss step-by-step procedures on ${aspect} using ${resources.toLowerCase()} and ${lbCitation}.`,
      `• Conduct guided group exploration on ${aspect}, record findings, and share observations with the class.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Guided collaborative exploration and step-by-step procedure analysis on ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Observation schedule', 'Assessment rubric', 'Group oral report'],
  },
  {
    tag: 'Worked Illustrations & Structured Practice',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Describe accurate methods and rules applied in ${aspect}.`,
      `2. Complete structured classroom exercises on ${aspect} from ${lbCitation} accurately.`,
      `3. Demonstrate neatness, accuracy, and confidence when practicing ${sub}.`,
    ],
    buildExperiences: (aspect, _resources, lbCitation) => [
      'Learners are guided to:',
      `• Follow worked classroom illustrations and chalkboard demonstrations on ${aspect}.`,
      `• Complete structured individual and pair practice tasks on ${aspect} in ${lbCitation} and verify answers.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Demonstrated worked examples and supervised structured learner exercises on ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Written exercises', 'Assessment rubric', 'Peer marking'],
  },
  {
    tag: 'Hands-On Practical & Skill Application',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Select appropriate tools, resources, or strategies for ${aspect} (${lbCitation}).`,
      `2. Execute hands-on practical or skill-based activities on ${aspect} safely.`,
      `3. Uphold safety, responsibility, and care for learning resources during ${sub}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Learners are guided to:',
      `• Use ${resources.toLowerCase()} safely in practical stations to demonstrate ${aspect}.`,
      `• Record practical observations or outputs guided by ${lbCitation} and display work for peer review.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Facilitated hands-on practical activity and skill demonstration on ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Practical rubric', 'Observation schedule', 'Portfolio check'],
  },
  {
    tag: 'Real-Life Contextual Application',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Relate ${aspect} to everyday home, school, and Kenyan community situations.`,
      `2. Apply concepts of ${aspect} (${lbCitation}) to solve real-world contextual tasks.`,
      `3. Appreciate the practical importance of ${sub} in daily life.`,
    ],
    buildExperiences: (aspect, _resources, lbCitation) => [
      'Learners are guided to:',
      `• Analyze real-life Kenyan community scenarios and case tasks involving ${aspect} in ${lbCitation}.`,
      `• Formulate practical solutions in groups and present findings to peers.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Guided learners in applying ${aspect} to real-life contextual tasks (${lbCitation}; ${tgCitation}).`,
    assessments: ['Problem-solving rubric', 'Written questions', 'Oral presentation'],
  },
  {
    tag: 'Extended Inquiry & Collaborative Task',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'By the end of the lesson, the learner should be able to:',
      `1. Analyze varied applications and address common misconceptions in ${aspect}.`,
      `2. Create summary charts, models, or peer demonstrations on ${aspect} (${lbCitation}).`,
      `3. Embrace teamwork, integrity, and constructive peer feedback in ${sub}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Learners are guided to:',
      `• Consult ${lbCitation} and ${resources.toLowerCase()} to investigate extended tasks on ${aspect}.`,
      `• Prepare a concise group chart/demonstration on ${aspect} and critique peer presentations kindly.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Supervised extended collaborative inquiry and peer presentation on ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Project/chart rubric', 'Peer assessment', 'Oral questions'],
  },
];

const LESSON_PHASES_KIS = [
  {
    tag: 'Utangulizi na Utambuzi wa Dhana',
    buildOutcomes: (aspect, sub, _subject, grade, lbCitation) => [
      'Kufikia mwisho wa somo, mwanafunzi aweze:',
      `1. Kutambua na kueleza vipengele vikuu vya ${aspect} (${lbCitation}).`,
      `2. Kutumia mifano halisi na chati kubainisha ${aspect} katika matini.`,
      `3. Kuchangamkia umuhimu wa ${sub} katika Kiswahili Gredi ya ${grade}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Mwanafunzi aelekezwe:',
      `• Kujadili maarifa ya awali na kutazama mifano ya ${aspect} kwa kutumia ${resources.toLowerCase()}.`,
      `• Kushirikiana na mwenzake kusoma na kunakili mifano ya ${aspect} katika ${lbCitation}.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Kufafanua dhana na kuongoza wanafunzi kutambua mifano ya ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Maswali ya mdomo', 'Orodha hakiki', 'Majadiliano ya wawili'],
  },
  {
    tag: 'Uchunguzi na Kanuni za Matumizi',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'Kufikia mwisho wa somo, mwanafunzi aweze:',
      `1. Kufafanua kanuni na hatua zinazozingatiwa katika ${aspect} (${lbCitation}).`,
      `2. Kushiriki kikamilifu katika shughuli za vikundi kuhusu ${aspect}.`,
      `3. Kuheshimu maoni ya wenzake wakati wa kujadili ${sub}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Mwanafunzi aelekezwe:',
      `• Kuchunguza na kujadili kanuni za ${aspect} kwa kurejelea ${lbCitation} na ${resources.toLowerCase()}.`,
      `• Kufanya mazoezi ya uchunguzi katika vikundi na kuwasilisha matokeo darasani.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Kuongoza uchunguzi wa vikundi na uchambuzi wa kanuni za ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Ratiba ya uchunguzi', 'Rubrika ya tathmini', 'Uwasilishaji wa vikundi'],
  },
  {
    tag: 'Mifano Ubaoni na Mazoezi ya Kuandika',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'Kufikia mwisho wa somo, mwanafunzi aweze:',
      `1. Kueleza matumizi sahihi ya ${aspect} katika sentensi au vifungu.`,
      `2. Kukamilisha mazoezi ya kuandika kuhusu ${aspect} kutoka ${lbCitation} kwa usahihi.`,
      `3. Kuonyesha unadhifu na kujiamini anapotumia maarifa ya ${sub}.`,
    ],
    buildExperiences: (aspect, _resources, lbCitation) => [
      'Mwanafunzi aelekezwe:',
      `• Kufuatilia mifano iliyofafanuliwa na mwalimu ubaoni kuhusu ${aspect}.`,
      `• Kufanya zoezi la kuandika kuhusu ${aspect} katika ${lbCitation} na kuhakiki majibu.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Kuonyesha mifano ubaoni na kusimamia zoezi la kuandika kuhusu ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Zoezi la kuandika', 'Rubrika ya tathmini', 'Usahihishaji wa rika'],
  },
  {
    tag: 'Matumizi ya Kivitendo na Ubunifu',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'Kufikia mwisho wa somo, mwanafunzi aweze:',
      `1. Kuchagua vipengele na msamiati mwafaka wa ${aspect} (${lbCitation}).`,
      `2. Kuigiza, kusoma kwa sauti au kutunga kazi fupi inayoonyesha ${aspect}.`,
      `3. Kuthamini matumizi ya Kiswahili fasaha katika ${sub}.`,
    ],
    buildExperiences: (aspect, resources, lbCitation) => [
      'Mwanafunzi aelekezwe:',
      `• Kutumia ${resources.toLowerCase()} kushiriki maigizo, usomaji au utunzi kuhusu ${aspect}.`,
      `• Kuwasilisha kazi yao kwa kuzingatia mwongozo wa ${lbCitation} na kutoa maoni ya kujenga.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Kusimamia shughuli za kivitendo na utunzi kuhusu ${aspect} (${lbCitation}; ${tgCitation}).`,
    assessments: ['Rubrika ya vitendo', 'Uchunguzi wa mwalimu', 'Mkoba wa kazi'],
  },
  {
    tag: 'Matumizi katika Miktadha ya Kila Siku',
    buildOutcomes: (aspect, sub, _subject, _grade, lbCitation) => [
      'Kufikia mwisho wa somo, mwanafunzi aweze:',
      `1. Kuhusisha ${aspect} na mawasiliano ya kila siku nyumbani, shuleni na katika jamii.`,
      `2. Kutumia ${aspect} (${lbCitation}) kutatua changamoto za kimawasiliano.`,
      `3. Kuonea fahari lugha ya Kiswahili kupitia mada ya ${sub}.`,
    ],
    buildExperiences: (aspect, _resources, lbCitation) => [
      'Mwanafunzi aelekezwe:',
      `• Kuchambua miktadha halisi ya kijamii inayohusisha ${aspect} katika ${lbCitation}.`,
      `• Kutunga mazungumzo au vifungu vinavyoakisi maadili na kuwasilisha darasani.`,
    ],
    buildWorkDone: (aspect, lbCitation, tgCitation) =>
      `Kuwaelekeza wanafunzi kutumia ${aspect} katika miktadha halisi ya kila siku (${lbCitation}; ${tgCitation}).`,
    assessments: ['Maswali ya kuandika', 'Uwasilishaji wa mdomo', 'Rubrika'],
  },
];

function buildAssessmentWeekLessons({
  week,
  lessonsPerWeek,
  mode,
  term,
  grade,
  subject,
  coursebook,
  termLbSpan,
  termTgSpan,
}) {
  const out = [];
  const lbRef = `${coursebook.lbShort} ${termLbSpan}`;
  const tgRef = `${coursebook.tgShort} ${termTgSpan}`;

  for (let lsn = 1; lsn <= lessonsPerWeek; lsn++) {
    if (mode === 'midterm') {
      const stages = [
        {
          topic: 'Mid-Term Revision of Weeks 1-7 Strands & Sub-strands',
          work: `Conducted structured revision of Weeks 1-7 strands using ${lbRef}.`,
          assess: ['Oral recap', 'Diagnostic revision check'],
        },
        {
          topic: 'Mid-Term Formative Assessment — Written Paper Administration',
          work: `Administered Mid-Term written formative assessment covering ${lbRef}.`,
          assess: ['Written Mid-Term CAT', 'Assessment rubric'],
        },
        {
          topic: 'Mid-Term Practical / Oral Competency Evaluation',
          work: `Evaluated practical/oral competencies (${tgRef}) and updated rubric records.`,
          assess: ['Practical observation rubric', 'Portfolio review'],
        },
        {
          topic: 'Mid-Term Script Review, Corrections & Diagnostic Feedback',
          work: `Reviewed marked Mid-Term scripts and guided full learner corrections (${lbRef}).`,
          assess: ['Corrections check', 'Oral questioning'],
        },
        {
          topic: 'Targeted Remedial Clinic & Half-Term Study Briefing',
          work: `Conducted remedial clinic on challenging sub-strands (${lbRef}) & recorded EE/ME/AE/BE rubrics.`,
          assess: ['Remedial exercise check', 'Self-reflection'],
        },
      ];
      const st = stages[Math.min(lsn - 1, stages.length - 1)];
      out.push({
        week,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: 'MID-TERM ASSESSMENT',
        baseSubstrand: 'Mid-Term Continuous Assessment & Remediation',
        lessonTopic: st.topic,
        substrand: `Mid-Term Continuous Assessment\nLesson ${lsn}/${lessonsPerWeek}: ${st.topic}`,
        lessonFocus: `Mid-Term Assessment — ${st.topic}`,
        lbCitation: lbRef,
        tgCitation: tgRef,
        outcomes: [
          'By the end of the lesson, the learner should be able to:',
          `1. Consolidate and apply Weeks 1-7 concepts in Grade ${grade} ${subject} (${lbRef}).`,
          `2. Complete ${st.topic.toLowerCase()} accurately and honestly.`,
          '3. Value constructive assessment feedback for continuous improvement.',
        ],
        experiences: [
          'Learners are guided to:',
          `• Undertake ${st.topic.toLowerCase()} referencing Weeks 1-7 coverage (${lbRef}).`,
          `• Review performance against KICD CBC rubric criteria (${tgRef}) and record corrections.`,
        ],
        kiq: `Which Weeks 1-7 competencies in Grade ${grade} ${subject} require reinforcement?`,
        resourcesList: ['Mid-Term Assessment Paper & Marking Guide', lbRef, tgRef],
        assessments: st.assess,
        teacherNotes: {
          summaryLine: `Facilitate ${st.topic} aligned to Weeks 1-7 KICD syllabus coverage (${lbRef}).`,
          coreConceptNotes: [
            `- Assessment Scope: Covers all strands and sub-strands taught in Weeks 1 to 7 (${lbRef}).`,
            `- Competency Rubric Scoring: Rate learner attainment using Exceeding (EE), Meeting (ME), Approaching (AE), and Below Expectations (BE) (${tgRef}).`,
          ],
          workedIllustration: `Teacher reviews high-frequency diagnostic items on the chalkboard and models complete rubric-level responses.`,
          learnerPracticeTask: `Learners complete ${st.topic.toLowerCase()} and verify all corrections neatly in exercise books.`,
          checkQuestion: `Verify that every learner has recorded complete corrections and remedial targets.`,
        },
        workCovered: st.work,
        isAssessment: true,
      });
    } else if (mode === 'revision') {
      const topic =
        lsn <= Math.ceil(lessonsPerWeek / 2)
          ? `Structured Term ${ROMAN_TERM[term]} Topical Revision & Past Competency Drill (Part ${lsn})`
          : `Practical Portfolio Verification & Summative Exam Readiness (Part ${lsn})`;
      out.push({
        week,
        lessonNumber: lsn,
        lessonsPerWeek,
        strand: 'ANNUAL REVISION',
        baseSubstrand: `Term ${ROMAN_TERM[term]} & Annual Syllabus Synthesis`,
        lessonTopic: topic,
        substrand: `Term ${ROMAN_TERM[term]} & Annual Synthesis\nLesson ${lsn}/${lessonsPerWeek}: ${topic}`,
        lessonFocus: `Annual Synthesis — ${topic}`,
        lbCitation: lbRef,
        tgCitation: tgRef,
        outcomes: [
          'By the end of the lesson, the learner should be able to:',
          `1. Synthesize core concepts across Grade ${grade} ${subject} strands (${lbRef}).`,
          '2. Solve integrated competency-based revision questions and practical tasks accurately.',
          '3. Approach end-of-year summative assessments with confidence and integrity.',
        ],
        experiences: [
          'Learners are guided to:',
          `• Work collaboratively through integrated revision papers covering ${lbRef}.`,
          `• Present model answers, verify learner portfolios (${tgRef}), and clarify exam techniques.`,
        ],
        kiq: `How do the strands studied in Grade ${grade} ${subject} connect in real-life applications?`,
        resourcesList: ['Revision papers & marking guides', lbRef, tgRef],
        assessments: ['Timed revision drill', 'Portfolio verification'],
        teacherNotes: {
          summaryLine: `Lead ${topic} across full Grade ${grade} ${subject} syllabus (${lbRef}).`,
          coreConceptNotes: [
            `- Integrated Synthesis: Connects Term ${term} sub-strands (${lbRef}) with earlier term competencies.`,
            `- Exam Technique: Emphasize careful reading of command words, clear working/explanations, and time management.`,
          ],
          workedIllustration: `Teacher works through multi-strand synthesis questions on the chalkboard using official KNEC/KICD rubrics.`,
          learnerPracticeTask: `Learners attempt timed revision drills and audit their practical portfolios.`,
          checkQuestion: `Check accuracy of timed responses and completeness of learner portfolios.`,
        },
        workCovered: `Facilitated ${topic} (${lbRef}; ${tgRef}).`,
        isAssessment: true,
      });
    } else {
      const endStages = [
        {
          topic: `Final Term ${ROMAN_TERM[term]} Syllabus Recap & Exam Briefing`,
          work: `Led final Term ${term} syllabus recap (${lbRef}) and examination readiness briefing.`,
          assess: ['Oral review', 'Readiness checklist'],
        },
        {
          topic: `End of Term ${ROMAN_TERM[term]} Written Summative Assessment Paper`,
          work: `Administered End of Term ${term} summative written paper covering ${lbRef}.`,
          assess: ['Summative Written Paper', 'Scoring Guide'],
        },
        {
          topic: `End of Term ${ROMAN_TERM[term]} Practical / Performance Assessment`,
          work: `Assessed practical/performance tasks (${tgRef}) and scored learner portfolios.`,
          assess: ['Practical Summative Rubric'],
        },
        {
          topic: 'Summative Script Review, Marking Verification & Diagnostic Feedback',
          work: `Reviewed marked summative scripts with learners (${lbRef}) and verified rubric scores.`,
          assess: ['Script review', 'Diagnostic feedback'],
        },
        {
          topic: `CBC Rubric Recording (EE/ME/AE/BE), Holiday Assignment Issue & Closing`,
          work: `Finalized Term ${term} EE/ME/AE/BE rubric records, issued holiday assignment (${lbRef}) & closed term.`,
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
        baseSubstrand: `End of Term ${ROMAN_TERM[term]} Summative Assessment & Closing`,
        lessonTopic: st.topic,
        substrand: `End of Term ${ROMAN_TERM[term]} Assessment\nLesson ${lsn}/${lessonsPerWeek}: ${st.topic}`,
        lessonFocus: `End of Term ${ROMAN_TERM[term]} — ${st.topic}`,
        lbCitation: lbRef,
        tgCitation: tgRef,
        outcomes: [
          'By the end of the lesson, the learner should be able to:',
          `1. Demonstrate mastery of Grade ${grade} Term ${term} ${subject} outcomes (${lbRef}).`,
          `2. Complete ${st.topic.toLowerCase()} accurately and responsibly.`,
          '3. Reflect on term achievements and note holiday revision tasks.',
        ],
        experiences: [
          'Learners are guided to:',
          `• Participate in ${st.topic.toLowerCase()} following official KNEC/CBA guidelines.`,
          `• Review performance rubrics (EE, ME, AE, BE) and record holiday assignment pages (${lbRef}).`,
        ],
        kiq: `How effectively were Grade ${grade} Term ${term} ${subject} outcomes achieved?`,
        resourcesList: [`End of Term ${ROMAN_TERM[term]} Exam & Marking Scheme`, lbRef, tgRef],
        assessments: st.assess,
        teacherNotes: {
          summaryLine: `Conduct ${st.topic} for Grade ${grade} ${subject} Term ${term} (${lbRef}).`,
          coreConceptNotes: [
            `- Summative Evaluation: Measures learner achievement across ${lbRef}.`,
            `- Official CBC Recording: Enter final EE, ME, AE, and BE learner counts in the Record of Work & school CBA portal (${tgRef}).`,
          ],
          workedIllustration: `Teacher reviews key marking scheme points and briefs learners on the ${HOLIDAY_NAME[term]} Holiday Assignment.`,
          learnerPracticeTask: `Learners complete summative tasks, verify script corrections, and note holiday project instructions.`,
          checkQuestion: `Confirm all scripts are marked, rubrics recorded, and holiday tasks assigned.`,
        },
        workCovered: st.work,
        isAssessment: true,
      });
    }
  }
  return out;
}

/**
 * Single Source of Truth Schedule Builder:
 * Used identically by Schemes of Work, Lesson Plans, Teachers' Notes, Records of Work,
 * Holiday Assignments, Exams & Marking Schemes, and Full-Year Curriculum Designs!
 */
function buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks }) {
  const allocation = getCurriculumAllocation(grade, subject);
  const { lessonsPerWeek, minutesPerLesson, stepTimings } = allocation;
  const weekCfg = getTermWeeksConfig(term);
  const { totalWeeks, midTermWeek, revisionWeek, endTermWeek, teachingWeeks } = weekCfg;

  const subs = flattenSubstrands(termBlocks);
  const totalTeachingLessons = teachingWeeks.length * lessonsPerWeek;
  const isKis = Boolean(coursebook.isKiswahili);
  const pageWord = isKis ? 'Uk.' : 'Pg.';
  const phases = isKis ? LESSON_PHASES_KIS : LESSON_PHASES_EN;

  // Proportionally distribute totalTeachingLessons across all sub-strands
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

  const termStartTgPage = (term - 1) * 56 + 1;
  const termStartLbPage = (term - 1) * 72 + 1;
  let runningTgPage = termStartTgPage;
  let runningLbPage = termStartLbPage;

  const instructionalPool = [];
  const subRanges = [];

  subs.forEach((subItem, sIdx) => {
    const count = subCounts[sIdx];
    const startPoolIdx = instructionalPool.length;
    const subStartLb = runningLbPage;
    const subStartTg = runningTgPage;

    for (let k = 0; k < count; k++) {
      const aspect = subItem.aspects[k % subItem.aspects.length];
      const isConsolidation = count >= 3 && k === count - 1;

      const lbStart = runningLbPage;
      const lbEnd = runningLbPage + 2;
      const tgStart = runningTgPage;
      const tgEnd = runningTgPage + 1;
      runningLbPage += 2;
      runningTgPage += 2;

      const lbCitation = `${coursebook.lbShort} ${pageWord} ${lbStart}-${lbEnd}`;
      const tgCitation = `${coursebook.tgShort} ${pageWord} ${tgStart}-${tgEnd}`;

      if (isConsolidation) {
        const phaseTag = isKis ? 'Marudio ya Mada Ndogo na Tathmini' : 'Topical Consolidation & Formative Check';
        const lessonTopic = `${aspect} — ${phaseTag}`;
        const outcomes = isKis
          ? [
              'Kufikia mwisho wa somo, mwanafunzi aweze:',
              `1. Kufupisha dhana na kanuni kuu zilizosomwa katika ${subItem.sub} (${lbCitation}).`,
              `2. Kujibu maswali ya marudio na tathmini fupi kuhusu ${subItem.sub} kwa usahihi.`,
              `3. Kutathmini hatua alizopiga katika umilisi wa ${subItem.sub}.`,
            ]
          : [
              'By the end of the lesson, the learner should be able to:',
              `1. Summarize the core concepts and procedures learned across ${subItem.sub} (${lbCitation}).`,
              `2. Solve structured topical review tasks and practical checks on ${subItem.sub} accurately.`,
              `3. Appreciate the relevance of ${subItem.sub} and reflect on personal progress.`,
            ];
        const experiences = isKis
          ? [
              'Mwanafunzi aelekezwe:',
              `• Kurejelea vidokezo vikuu na kujadili swali dadisi ("${subItem.kiq}") katika vikundi.`,
              `• Kukamilisha zoezi la marudio ya mada ndogo katika ${lbCitation} na kuhakiki majibu (${tgCitation}).`,
            ]
          : [
              'Learners are guided to:',
              `• Review key points and answer the inquiry question ("${subItem.kiq}") in collaborative groups.`,
              `• Complete the topical mastery exercise in ${lbCitation} and conduct peer/teacher review (${tgCitation}).`,
            ];
        const assessments = isKis
          ? ['Jaribio fupi la mada', 'Rubrika ya CBC', 'Tathmini ya rika']
          : ['Topical formative quiz', 'CBC Assessment rubric', 'Self & peer review'];
        const workCovered = isKis
          ? `Kuongoza marudio ya ${subItem.sub} na kutoa jaribio fupi la umilisi (${lbCitation}; ${tgCitation}).`
          : `Consolidated ${subItem.sub} and administered topical formative check (${lbCitation}; ${tgCitation}).`;

        const teacherNotes = buildDomainLessonNotes({
          grade,
          subject,
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag,
          kiq: subItem.kiq,
          resources: subItem.resources,
          lbCitation,
          tgCitation,
          isKiswahili: isKis,
        });

        instructionalPool.push({
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag,
          lessonTopic,
          lessonFocus: `${subItem.sub} — ${lessonTopic}`,
          lbCitation,
          tgCitation,
          outcomes,
          experiences,
          kiq: subItem.kiq,
          resourcesList: [subItem.resources, lbCitation, tgCitation],
          assessments,
          teacherNotes,
          workCovered,
        });
      } else {
        const phase = phases[k % phases.length];
        const lessonTopic = `${aspect} (${phase.tag})`;
        const teacherNotes = buildDomainLessonNotes({
          grade,
          subject,
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag: phase.tag,
          kiq: subItem.kiq,
          resources: subItem.resources,
          lbCitation,
          tgCitation,
          isKiswahili: isKis,
        });

        instructionalPool.push({
          strand: subItem.strand,
          baseSubstrand: subItem.sub,
          aspect,
          phaseTag: phase.tag,
          lessonTopic,
          lessonFocus: `${subItem.sub} — ${lessonTopic}`,
          lbCitation,
          tgCitation,
          outcomes: phase.buildOutcomes(aspect, subItem.sub, subject, grade, lbCitation),
          experiences: phase.buildExperiences(aspect, subItem.resources, lbCitation),
          kiq: subItem.kiq,
          resourcesList: [subItem.resources, lbCitation, tgCitation],
          assessments: phase.assessments,
          teacherNotes,
          workCovered: phase.buildWorkDone(aspect, lbCitation, tgCitation),
        });
      }
    }

    const subEndLb = runningLbPage - 1;
    const subEndTg = runningTgPage - 1;

    subRanges.push({
      strand: subItem.strand,
      sub: subItem.sub,
      kiq: subItem.kiq,
      resources: subItem.resources,
      lessonCount: count,
      startPoolIdx,
      endPoolIdx: instructionalPool.length - 1,
      lbRangeLabel: `${coursebook.lbShort} ${pageWord} ${subStartLb}-${subEndLb}`,
      tgRangeLabel: `${coursebook.tgShort} ${pageWord} ${subStartTg}-${subEndTg}`,
    });
  });

  const termLbSpan = `${pageWord} ${termStartLbPage}-${runningLbPage - 1}`;
  const termTgSpan = `${pageWord} ${termStartTgPage}-${runningTgPage - 1}`;

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
          coursebook,
          termLbSpan,
          termTgSpan,
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
          coursebook,
          termLbSpan,
          termTgSpan,
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
          coursebook,
          termLbSpan,
          termTgSpan,
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
        baseSubstrand: item.baseSubstrand,
        aspect: item.aspect,
        phaseTag: item.phaseTag,
        lessonTopic: item.lessonTopic,
        substrand: `${item.baseSubstrand}\nLesson ${lsn}/${lessonsPerWeek}: ${item.lessonTopic}`,
        lessonFocus: item.lessonFocus,
        lbCitation: item.lbCitation,
        tgCitation: item.tgCitation,
        outcomes: item.outcomes,
        experiences: item.experiences,
        kiq: item.kiq,
        resourcesList: item.resourcesList,
        assessments: item.assessments,
        teacherNotes: item.teacherNotes,
        workCovered: item.workCovered,
        isAssessment: false,
      });
    }
  }

  // Enrich subRanges with exact Week/Lesson coordinates
  const instructionalLessonsOnly = lessons.filter((l) => !l.isAssessment);
  for (const sr of subRanges) {
    const firstL = instructionalLessonsOnly[sr.startPoolIdx];
    const lastL = instructionalLessonsOnly[sr.endPoolIdx];
    sr.spanLabel =
      firstL && lastL
        ? `Wk ${firstL.week} Lsn ${firstL.lessonNumber} - Wk ${lastL.week} Lsn ${lastL.lessonNumber}`
        : `${sr.lessonCount} Lessons`;
    sr.lessonsSlice = instructionalLessonsOnly.slice(sr.startPoolIdx, sr.endPoolIdx + 1);
  }

  return {
    lessonsPerWeek,
    minutesPerLesson,
    stepTimings,
    totalWeeks,
    totalTeachingLessons,
    termLbSpan,
    termTgSpan,
    lessons,
    subRanges,
    level,
    coursebook,
  };
}

// 1. Exact schemes.co.ke 10-Column Rationalized Scheme of Work DOCX (Synced 1:1 with Lesson Plans & Notes!)
async function generateSchemeBuffer({ grade, level, subject, term, coursebook, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons } = schedule;

  const headers = [
    'Wk',
    'LSN',
    'strand',
    'Sub-strand & Lesson Topic',
    'Lesson Learning Outcomes',
    'Learning Experiences',
    'Key Inquiry Question(s)',
    'KICD Learning Resources',
    'Assessment Methods',
    'Refl',
  ];
  const widths = [4, 4, 11, 15, 20, 18, 10, 9, 6, 3];

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

      return new TableRow({
        children: [
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
          makeCell(l.strand, { bold: isWeekStart, fill: rowFill, widthPct: widths[2] }),
          makeCell(l.substrand, { bold: isWeekStart, fill: rowFill, widthPct: widths[3] }),
          makeCell(l.outcomes, { fill: rowFill, widthPct: widths[4] }),
          makeCell(l.experiences, { fill: rowFill, widthPct: widths[5] }),
          makeCell(l.kiq, { fill: rowFill, widthPct: widths[6] }),
          makeCell(l.resourcesList, { fill: rowFill, widthPct: widths[7] }),
          makeCell(l.assessments, { fill: rowFill, widthPct: widths[8] }),
          makeCell('', { fill: rowFill, widthPct: widths[9] }),
        ],
      });
    }),
  ];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 540, right: 540, bottom: 540, left: 540 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 45 },
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
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: `KICD WEEKLY ALLOCATION: ${lessonsPerWeek} LESSONS/WEEK (${minutesPerLesson} MINS EACH)   |   TERM ${ROMAN_TERM[term]}: ${totalWeeks} WEEKS (${lessons.length} INDIVIDUAL LESSONS)`,
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
                text: `APPROVED KICD COURSEBOOK: `,
                bold: true,
                size: 17.5,
                font: 'Calibri',
                color: '065F46',
              }),
              new TextRun({
                text: `${coursebook.lbTitle} & ${coursebook.tgTitle} (${coursebook.publisher} — ${coursebook.authors})`,
                bold: true,
                size: 17.5,
                font: 'Calibri',
                color: '1E293B',
              }),
            ],
          }),
          ...(coursebook.alternates.length > 0
            ? [
                new Paragraph({
                  spacing: { after: 35 },
                  children: [
                    new TextRun({
                      text: `OTHER KICD ORANGE BOOK APPROVED REFERENCES: ${coursebook.alternates.join('  |  ')}  •  Synced 1:1 with CBC Lesson Plans, Teachers' Notes & Record of Work`,
                      italics: true,
                      size: 16,
                      font: 'Calibri',
                      color: '475569',
                    }),
                  ],
                }),
              ]
            : []),
          new Paragraph({
            spacing: { after: 110 },
            children: [
              new TextRun({
                text: `SCHOOL: _____________________________________   TEACHER: _____________________________   TSC NO: _____________   TERM: ${ROMAN_TERM[term]}   YEAR: 2026`,
                bold: true,
                size: 17.5,
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

// 2. Complete Lesson-by-Lesson KICD CBC Lesson Plans DOCX (Rhymes 1:1 with Scheme of Work & Teachers' Notes!)
async function generateLessonPlanBuffer({ grade, level, subject, term, coursebook, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, stepTimings, totalWeeks, lessons } = schedule;
  const durationLabel = `${minutesPerLesson} Minutes`;

  const children = [
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 55 },
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
      spacing: { after: 45 },
      children: [
        new TextRun({
          text: `KICD Allocation: ${lessonsPerWeek} Lessons/Week × ${minutesPerLesson} Minutes  |  Weeks 1-${totalWeeks} (${lessons.length} Individual Lesson Plans)`,
          bold: true,
          size: 18.5,
          font: 'Calibri',
          color: '0F766E',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 45 },
      children: [
        new TextRun({
          text: `KICD Approved Coursebook: ${coursebook.lbTitle} & ${coursebook.tgTitle} (${coursebook.publisher})`,
          bold: true,
          size: 17.5,
          font: 'Calibri',
          color: '1E293B',
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      children: [
        new TextRun({
          text: `Synchronized 1-for-1 (Week, Lesson, Topic, Outcomes & Textbook Pages) with Grade ${grade} ${subject} Term ${term} Scheme of Work & Teachers' Notes`,
          italics: true,
          size: 16.5,
          font: 'Calibri',
          color: '475569',
        }),
      ],
    }),
  ];

  lessons.forEach((l, idx) => {
    children.push(
      new Paragraph({
        spacing: { before: idx > 0 ? 220 : 40, after: 65 },
        children: [
          new TextRun({
            text: `WEEK ${l.week} • LESSON ${l.lessonNumber} OF ${lessonsPerWeek}: ${l.lessonFocus.toUpperCase()}`,
            bold: true,
            size: 19.5,
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
        spacing: { before: 75, after: 30 },
        children: [
          new TextRun({ text: 'STRAND: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: `${l.strand}    |    `, size: 18, font: 'Calibri' }),
          new TextRun({ text: 'SUB-STRAND: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: l.baseSubstrand, size: 18, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({ text: 'SPECIFIC LESSON TOPIC: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: `${l.lessonTopic}    |    `, size: 18, font: 'Calibri' }),
          new TextRun({ text: 'KICD TEXTBOOK PAGES: ', bold: true, size: 18, font: 'Calibri', color: '065F46' }),
          new TextRun({ text: `${l.lbCitation}; ${l.tgCitation}`, bold: true, size: 18, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
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
        spacing: { after: 30 },
        children: [
          new TextRun({ text: 'Key Inquiry Question(s): ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({ text: l.kiq, size: 18, font: 'Calibri' }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({ text: 'Core Competencies, Values & PCIs: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({
            text: 'Communication & Collaboration, Critical Thinking & Problem Solving, Self-Efficacy; Values: Respect, Unity, Responsibility & Integrity; PCIs: Safety, Citizenship & Environmental Stewardship.',
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 30 },
        children: [
          new TextRun({ text: 'Learning Resources & KICD References: ', bold: true, size: 18, font: 'Calibri' }),
          new TextRun({
            text: l.resourcesList.join('; '),
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 40, after: 22 },
        children: [
          new TextRun({
            text: `Organization of Learning (${minutesPerLesson} Minutes Total — Synced with Scheme & Teachers' Notes):`,
            bold: true,
            size: 18,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `• Introduction (${stepTimings.intro} min): Recap previous lesson and introduce "${l.lessonTopic}" using the Key Inquiry Question ("${l.kiq}").`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `• Step 1 — Explore & Investigate (${stepTimings.step1} min): ${l.experiences[1] ? l.experiences[1].replace(/^•\s*/, '') : `Learners explore ${l.lessonTopic} in pairs/groups.`}`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 20 },
        children: [
          new TextRun({
            text: `• Step 2 — Teacher Chalkboard Notes & Guided Practice (${stepTimings.step2} min): ${l.teacherNotes.summaryLine} ${l.experiences[2] ? l.experiences[2].replace(/^•\s*/, '') : ''}`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 26 },
        children: [
          new TextRun({
            text: `• Conclusion & Formative Check (${stepTimings.conclusion} min): Assess via ${l.assessments.join(', ').toLowerCase()}. ${l.teacherNotes.checkQuestion}`,
            size: 17.5,
            font: 'Calibri',
          }),
        ],
      }),
      new Paragraph({
        spacing: { after: 55 },
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
async function generateRecordOfWorkBuffer({ grade, level, subject, term, coursebook, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons } = schedule;

  const headers = [
    'WK',
    'LSN',
    'DATE',
    'STRAND',
    'SUB-STRAND & LESSON TOPIC',
    'WORK COVERED & KICD TEXTBOOK PAGES',
    'RUBRIC (EE / ME / AE / BE)',
    'REMARKS & SIGN',
  ];
  const widths = [4, 5, 8, 13, 21, 25, 14, 10];

  const doc = new Document({
    sections: [
      {
        properties: {
          page: {
            size: { orientation: PageOrientation.LANDSCAPE },
            margin: { top: 540, right: 540, bottom: 540, left: 540 },
          },
        },
        children: [
          new Paragraph({
            spacing: { after: 45 },
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
            spacing: { after: 35 },
            children: [
              new TextRun({
                text: `CBC ALLOCATION: ${lessonsPerWeek} LESSONS/WEEK (${minutesPerLesson} MINS EACH)   |   TERM ${ROMAN_TERM[term]} TOTAL: ${lessons.length} LESSONS (${totalWeeks} WEEKS)`,
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
                text: `APPROVED KICD COURSEBOOK: ${coursebook.lbTitle} & ${coursebook.tgTitle} (${coursebook.publisher}) — Synced 1:1 with Scheme of Work & Lesson Plans`,
                bold: true,
                size: 17,
                font: 'Calibri',
                color: '1E293B',
              }),
            ],
          }),
          new Paragraph({
            spacing: { after: 110 },
            children: [
              new TextRun({
                text: `SCHOOL: __________________________   TEACHER: _____________________   TSC NO: ____________   LEVEL: ${level}   TERM: ${ROMAN_TERM[term]}   YEAR: 2026`,
                bold: true,
                size: 17.5,
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
                    makeCell(`${l.baseSubstrand} — ${l.lessonTopic}`, { fill, widthPct: widths[4] }),
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

// Reusable PDF builder for Lesson-by-Lesson Teachers' Notes, Exams, Holiday Assignments & Curriculum Designs
async function renderPdf({ bannerTag, title, subtitle, footerLabel, sections }) {
  const pdfDoc = await PDFDocument.create();
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const margin = 44;

  let page = pdfDoc.addPage([pageWidth, pageHeight]);
  let y = pageHeight - margin;

  page.drawRectangle({
    x: 0,
    y: pageHeight - 92,
    width: pageWidth,
    height: 92,
    color: rgb(0.024, 0.373, 0.275),
  });

  page.drawText(toWinAnsiSafe(bannerTag).slice(0, 96), {
    x: margin,
    y: pageHeight - 33,
    size: 8.8,
    font: fontBold,
    color: rgb(0.68, 0.96, 0.84),
  });

  page.drawText(toWinAnsiSafe(title).slice(0, 76), {
    x: margin,
    y: pageHeight - 53,
    size: 12.6,
    font: fontBold,
    color: rgb(1, 1, 1),
  });

  page.drawText(toWinAnsiSafe(subtitle).slice(0, 98), {
    x: margin,
    y: pageHeight - 73,
    size: 9.0,
    font: fontRegular,
    color: rgb(0.9, 0.98, 0.94),
  });

  y = pageHeight - 112;

  const ensureSpace = (needed = 22) => {
    if (y - needed < margin + 22) {
      page = pdfDoc.addPage([pageWidth, pageHeight]);
      y = pageHeight - margin;
    }
  };

  for (const sec of sections) {
    ensureSpace(34);
    page.drawText(toWinAnsiSafe(sec.heading).slice(0, 88), {
      x: margin,
      y,
      size: 10.8,
      font: fontBold,
      color: rgb(0.04, 0.41, 0.3),
    });
    y -= 16;

    const lines = wrapLines(sec.body, 90);
    for (const line of lines) {
      if (line === '') {
        y -= 6;
        continue;
      }
      const isLessonHeader = /^(WEEK \d+, LESSON \d+|JUMA LA \d+, SOMO LA \d+)/i.test(line);
      if (isLessonHeader) {
        ensureSpace(26);
        y -= 3;
      } else {
        ensureSpace(14);
      }

      const isBoldLine =
        isLessonHeader ||
        /^(Q\d+\.|TASK|\d+\.|Answer|Marking|Key|Rubric|Strand|Sub-strand|KICD|Approved|Official|Term \d|Teacher's Chalkboard|Worked Classroom|Guided Learner|Formative Check|Maelezo ya Mwalimu|Mfano Ubaoni|Kazi ya Vikundi|Swali la Tathmini)/i.test(
          line
        );

      page.drawText(line, {
        x: margin,
        y,
        size: isLessonHeader ? 9.8 : 9.2,
        font: isBoldLine ? fontBold : fontRegular,
        color: isLessonHeader ? rgb(0.03, 0.35, 0.26) : rgb(0.12, 0.16, 0.23),
      });
      y -= 13.2;
    }
    y -= 9;
  }

  const pages = pdfDoc.getPages();
  pages.forEach((p, idx) => {
    p.drawText(toWinAnsiSafe(`${footerLabel} - Page ${idx + 1} of ${pages.length}`), {
      x: margin,
      y: 20,
      size: 8.3,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.56),
    });
  });

  const bytes = await pdfDoc.save();
  return Buffer.from(bytes);
}

// 4. Comprehensive Lesson-by-Lesson Teachers' Notes PDF (Rhymes 1:1 with Scheme of Work & Lesson Plans!)
async function generateNotesPdfBuffer({ grade, level, subject, term, coursebook, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, totalWeeks, lessons, subRanges } = schedule;
  const isKis = Boolean(coursebook.isKiswahili);

  const overviewSection = {
    heading: `TERM ${term} KICD APPROVED COURSEBOOK & LESSON SYNCHRONIZATION MATRIX`,
    body: [
      `KICD Approved Primary Textbook: ${coursebook.lbTitle} (${coursebook.publisher})`,
      `KICD Approved Teacher's Guide: ${coursebook.tgTitle} — Authors: ${coursebook.authors}`,
      ...(coursebook.alternates.length > 0
        ? [`Supplementary KICD Approved Coursebooks: ${coursebook.alternates.join(' | ')}`]
        : []),
      `Official Weekly Allocation: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Minutes/Lesson) across ${totalWeeks} Weeks (${lessons.length} Total Lessons)`,
      `1-to-1 Synchronization: Every lesson below (Week & Lesson Number, Topic, Outcomes & Textbook Pages) matches your Term ${term} Scheme of Work, CBC Lesson Plans, and Record of Work word-for-word.`,
      '',
      `Term ${term} Sub-strand & Textbook Page Coverage Summary:`,
      ...subRanges.map(
        (sr, i) =>
          `${i + 1}. ${sr.sub} [${sr.strand}] -> ${sr.spanLabel} (${sr.lessonCount} Lessons | ${sr.lbRangeLabel})`
      ),
    ].join('\n'),
  };

  const unitSections = subRanges.map((sr, idx) => ({
    heading: `UNIT ${idx + 1}: ${sr.sub.toUpperCase()} (${sr.spanLabel})`,
    body: [
      `Strand: ${sr.strand}  |  KICD Textbook Scope: ${sr.lbRangeLabel} & ${sr.tgRangeLabel}`,
      `Key Inquiry Question: ${sr.kiq}  |  Teaching Aids: ${sr.resources}`,
      '',
      ...sr.lessonsSlice.flatMap((l) => {
        if (isKis) {
          return [
            `JUMA LA ${l.week}, SOMO LA ${l.lessonNumber} KATI YA ${lessonsPerWeek}: ${l.lessonTopic}`,
            `KICD Marejeleo: ${l.lbCitation} | ${l.tgCitation}`,
            `Shabaha ya Somo: ${l.outcomes[1].replace(/^1\.\s*/, '')}`,
            ...l.teacherNotes.coreConceptNotes,
            `Mfano Ubaoni: ${l.teacherNotes.workedIllustration}`,
            `Kazi ya Vikundi na Binafsi: ${l.teacherNotes.learnerPracticeTask}`,
            `Swali la Tathmini (${l.assessments.join(', ')}): ${l.teacherNotes.checkQuestion}`,
            '',
          ];
        }
        return [
          `WEEK ${l.week}, LESSON ${l.lessonNumber} OF ${lessonsPerWeek}: ${l.lessonTopic}`,
          `KICD Textbook Reference: ${l.lbCitation} | ${l.tgCitation}`,
          `Target Lesson Outcome: ${l.outcomes[1].replace(/^1\.\s*/, '')}`,
          `Teacher's Chalkboard & Concept Notes:`,
          ...l.teacherNotes.coreConceptNotes,
          `Worked Classroom Illustration: ${l.teacherNotes.workedIllustration}`,
          `Guided Learner Activity: ${l.teacherNotes.learnerPracticeTask}`,
          `Formative Check (${l.assessments.join(', ')}): ${l.teacherNotes.checkQuestion}`,
          '',
        ];
      }),
    ].join('\n'),
  }));

  const assessmentWeeks = [];
  const seenAssessWks = new Set();
  for (const l of lessons) {
    if (l.isAssessment && !seenAssessWks.has(l.week)) {
      seenAssessWks.add(l.week);
      const wkLessons = lessons.filter((x) => x.week === l.week);
      assessmentWeeks.push(
        `Week ${l.week} (${l.strand} — Ref: ${l.lbCitation}):`,
        ...wkLessons.map((wl) => `- Lesson ${wl.lessonNumber}/${lessonsPerWeek}: ${wl.lessonTopic} (${wl.assessments.join(', ')})`),
        ''
      );
    }
  }

  const assessmentSection = {
    heading: `TERM ${term} ASSESSMENT & REVISION WEEKS TEACHING GUIDE`,
    body: assessmentWeeks.join('\n'),
  };

  return renderPdf({
    bannerTag: `KICD APPROVED TEACHERS' NOTES - TERM ${term} (${coursebook.series.toUpperCase()})`,
    title: `Grade ${grade} ${subject} Teachers' Notes - Term ${term}`,
    subtitle: `${level} | ${lessonsPerWeek} Lessons/Wk (${minutesPerLesson}m) | Synced 1:1 with Scheme of Work & Lesson Plans`,
    footerLabel: `CBC Kenya Hub - Grade ${grade} ${subject} T${term} Notes (${coursebook.series})`,
    sections: [overviewSection, ...unitSections, assessmentSection],
  });
}

// 5. CBC Exam & Marking Scheme PDF (Synced to Term's KICD Approved Coursebook & Lesson Spans)
async function generateExamPdfBuffer({ grade, level, examBadge, subject, term, coursebook, termBlocks }) {
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, subRanges, termLbSpan } = schedule;
  const examDuration =
    grade <= 3 ? '1 Hour' : grade <= 6 ? '1 Hour 20 Minutes' : grade <= 9 ? '1 Hour 40 Minutes' : '2 Hours';

  const qLines = [
    `LEARNER'S NAME: ____________________________________  ASSESSMENT NO: _______________`,
    `SCHOOL: ____________________________________________  TIME ALLOWED: ${examDuration}`,
    `KICD SYLLABUS & COURSEBOOK SCOPE: Term ${term} (${coursebook.lbTitle}, ${termLbSpan})`,
    `WEEKLY LESSON WEIGHTING: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} Mins/Lesson)`,
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
      `Q${q1}. [${item.strand} - ${item.sub} | Taught in ${item.spanLabel}, ${item.lbRangeLabel}] Identify and explain two key concepts studied in ${item.sub} in Grade ${grade} ${subject}. (4 marks)`,
      `Q${q2}. Practical Competency Application (${item.sub}): "${item.kiq}" Explain two practical points using examples from your school or community. (6 marks)`,
      ''
    );
    mLines.push(
      `Q${q1} Marking Guide (4 mks): Award 2 marks each for any two accurate concepts/explanations on ${item.sub} as covered in ${item.spanLabel} (${item.lbRangeLabel}; ${item.tgRangeLabel}).`,
      `Q${q2} Marking Guide (6 mks): Award 3 marks per well-explained real-life application addressing "${item.kiq}" (Knowledge: 2 mks, Application: 2 mks, Clarity: 2 mks).`
    );
  });

  qLines.push(
    `Q${subRanges.length * 2 + 1}. Extended Practical Task: Describe a step-by-step demonstration or project on "${subRanges[0].sub}" using locally available materials (${subRanges[0].resources}). (10 marks)`
  );
  mLines.push(
    `Q${subRanges.length * 2 + 1} Rubric (10 mks — Ref: ${subRanges[0].tgRangeLabel}): Exceeding Expectations (8-10 mks): Complete, accurate procedure & safety observed; Meeting Expectations (5-7 mks): Correct main steps; Approaching (3-4 mks): Partial steps.`
  );

  return renderPdf({
    bannerTag: `KENYA COMPETENCY-BASED ASSESSMENT (${examBadge}) - TERM ${term} (${coursebook.series.toUpperCase()})`,
    title: `Grade ${grade} ${subject} Term ${term} ${examBadge} Exam & Marking Scheme`,
    subtitle: `${level} (${examDuration}) | Aligned to Term ${term} Scheme of Work, Lesson Plans & Notes`,
    footerLabel: `CBC Kenya Hub - Grade ${grade} ${subject} Term ${term} Exam (${coursebook.series})`,
    sections: [
      { heading: `SECTION A & B: ASSESSMENT QUESTIONS (TERM ${term})`, body: qLines.join('\n') },
      { heading: `OFFICIAL MARKING SCHEME & RUBRIC SCORING GUIDE`, body: mLines.join('\n\n') },
    ],
  });
}

// 6. Holiday Assignment Booklet PDF (Synced to Term's KICD Approved Coursebook Pages & Lessons)
async function generateHolidayPdfBuffer({ grade, level, subject, term, coursebook, termBlocks }) {
  const holiday = HOLIDAY_NAME[term];
  const schedule = buildTermLessonSchedule({ grade, level, subject, term, coursebook, termBlocks });
  const { lessonsPerWeek, minutesPerLesson, subRanges, termLbSpan } = schedule;

  const body = [
    `LEARNER'S NAME: ____________________________________   GRADE ${grade} (${level})`,
    `PARENT / GUARDIAN SIGNATURE: _______________________   DATE COMPLETED: ______________`,
    `KICD APPROVED TEXTBOOK REFERENCE: ${coursebook.lbTitle} (${termLbSpan})`,
    `TERM ${term} COVERAGE RECAP: ${lessonsPerWeek} Lessons/Week (${minutesPerLesson} mins each)`,
    '',
    `PART 1: LESSON- & TEXTBOOK-ALIGNED TOPICAL REVISION (${holiday.toUpperCase()} HOLIDAY)`,
    ...subRanges.map(
      (s, idx) =>
        `${idx + 1}. Topic: ${s.sub} (${s.strand} — Covered in ${s.spanLabel}, ${s.lbRangeLabel})\n` +
        `   (a) Review your Term ${term} Teachers'/Class Notes and ${s.lbRangeLabel} on "${s.sub}", then write a clear five-point summary.\n` +
        `   (b) Guided Inquiry Task: ${s.kiq}\n`
    ),
    `PART 2: HOME-BASED PRACTICAL / PARENTAL ENGAGEMENT PROJECT`,
    `With the guidance of your parent or guardian, use safe locally available items (${subRanges[0].resources}) to complete the practical portfolio activity on "${subRanges[0].sub}" (${subRanges[0].lbRangeLabel}) and bring your report on opening day.`,
  ].join('\n');

  return renderPdf({
    bannerTag: `CBC ${holiday.toUpperCase()} HOLIDAY REVISION - TERM ${term} (${coursebook.series.toUpperCase()})`,
    title: `Grade ${grade} ${subject} Term ${term} (${holiday}) Holiday Assignment`,
    subtitle: `${level} | Synced with Term ${term} Scheme of Work, Notes & ${coursebook.lbShort}`,
    footerLabel: `CBC Kenya Hub - Grade ${grade} ${subject} ${holiday} Holiday Pack`,
    sections: [{ heading: `${holiday.toUpperCase()} HOLIDAY WORKBOOK — ${subject.toUpperCase()}`, body }],
  });
}

// 7. Full-Year (Terms 1, 2 & 3 Combined) Rationalized Curriculum Design & KICD Coursebook Matrix PDF
async function generateCurriculumDesignPdfBuffer({ grade, level, subject, coursebook, allTermsObj }) {
  const { lessonsPerWeek, minutesPerLesson } = getCurriculumAllocation(grade, subject);
  const t1Total = 13 * lessonsPerWeek;
  const t2Total = 14 * lessonsPerWeek;
  const t3Total = 9 * lessonsPerWeek;
  const annualTotal = t1Total + t2Total + t3Total;

  const allocationOverview = {
    heading: `OFFICIAL KICD WEEKLY LESSON ALLOCATION & APPROVED ORANGE BOOK TEXTBOOKS`,
    body: [
      `Learning Area: ${subject}   |   Grade ${grade} (${level})`,
      `Primary KICD Approved Learner's Book: ${coursebook.lbTitle} (${coursebook.publisher})`,
      `Primary KICD Approved Teacher's Guide: ${coursebook.tgTitle} (${coursebook.authors})`,
      ...(coursebook.alternates.length > 0
        ? [`Additional KICD Approved Coursebooks: ${coursebook.alternates.join(' | ')}`]
        : []),
      ...(coursebook.note ? [`KICD Orange Book Note: ${coursebook.note}`] : []),
      '',
      `Official Weekly Lesson Allocation: ${lessonsPerWeek} Lessons per Week (${minutesPerLesson} Minutes per Lesson)`,
      `Term 1 Allocation (13 Weeks): ${t1Total} Total Lessons (11 Instructional Weeks = ${11 * lessonsPerWeek} Lessons + Assessment Weeks)`,
      `Term 2 Allocation (14 Weeks): ${t2Total} Total Lessons (12 Instructional Weeks = ${12 * lessonsPerWeek} Lessons + Assessment Weeks)`,
      `Term 3 Allocation (9 Weeks):  ${t3Total} Total Lessons (7 Instructional Weeks = ${7 * lessonsPerWeek} Lessons + End-Year Exams)`,
      `Full Academic Year Total (36 Weeks): ${annualTotal} Synchronized Lessons across Schemes, Lesson Plans & Notes`,
    ].join('\n'),
  };

  const termSections = [1, 2, 3].map((t) => {
    const sched = buildTermLessonSchedule({
      grade,
      level,
      subject,
      term: t,
      coursebook,
      termBlocks: allTermsObj[t],
    });
    return {
      heading: `TERM ${t} RATIONALIZED STRANDS, SUB-STRANDS & TEXTBOOK MATRIX (${sched.totalWeeks} WEEKS | ${sched.lessons.length} LESSONS)`,
      body: sched.subRanges
        .map(
          (sr, idx) =>
            `Sub-strand ${t}.${idx + 1}: ${sr.sub} (${sr.strand})\n` +
            `- Allocated Lessons: ${sr.lessonCount} Lessons (${sr.spanLabel}, at ${lessonsPerWeek} lessons/week)\n` +
            `- KICD Coursebook Pages: ${sr.lbRangeLabel} | ${sr.tgRangeLabel}\n` +
            `- Key Inquiry Question: ${sr.kiq}\n` +
            `- Suggested Resources: ${sr.resources}`
        )
        .join('\n\n'),
    };
  });

  return renderPdf({
    bannerTag: `KICD RATIONALIZED CURRICULUM DESIGN & ORANGE BOOK GUIDE (TERMS 1, 2 & 3)`,
    title: `Grade ${grade} ${subject} Curriculum Design & Coursebook Matrix`,
    subtitle: `${level} | ${lessonsPerWeek} Lessons/Wk (${minutesPerLesson}m) | ${coursebook.series}`,
    footerLabel: `CBC Kenya Hub - Grade ${grade} ${subject} Curriculum Design (${coursebook.series})`,
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

    subjects.forEach((subject) => {
      const syl = getSyllabusForGrade(grade, subject);
      const coursebook = getApprovedCoursebook(grade, subject);
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
          build: () => generateSchemeBuffer({ grade, level, subject, term, coursebook, termBlocks }),
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
            generateLessonPlanBuffer({ grade, level, subject, term, coursebook, termBlocks }),
        });

        // 3. Teachers' Notes (PDF - KES 100)
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
          build: () => generateNotesPdfBuffer({ grade, level, subject, term, coursebook, termBlocks }),
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
              coursebook,
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
            generateRecordOfWorkBuffer({ grade, level, subject, term, coursebook, termBlocks }),
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
            generateHolidayPdfBuffer({ grade, level, subject, term, coursebook, termBlocks }),
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
            coursebook,
            allTermsObj: syl.strandsByTerm,
          }),
      });
    });
  }

  console.log(`Prepared ${tasks.length} total KICD-synchronized CBC materials across Grades 1 to 12!`);

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
        level:
          t.grade <= 3
            ? 'Lower Primary'
            : t.grade <= 6
            ? 'Upper Primary'
            : t.grade <= 9
            ? 'Junior Secondary'
            : 'Senior School',
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
