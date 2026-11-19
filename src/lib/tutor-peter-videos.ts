import {
  formatGradeLabel,
  formatTermLabel,
  getResourceGradeKey,
} from '@/lib/material-utils';

export const SITE_ORIGIN = 'https://www.cbcmaterials.shop';
export const TUTOR_PETER_VIDEO_PRICE_USD = 15;
export const TUTOR_PETER_VIDEO_PRICE_KES = 1950; // $15 USD (~130 KES/USD)

export interface MaterialVideoInput {
  id: string;
  title: string;
  grade: number;
  level?: string;
  category: string;
  subject: string;
  term: number;
  price: number;
  description?: string | null;
  strands?: string | null;
}

export interface WhiteboardLessonPlan {
  materialId: string;
  title: string;
  gradeLabel: string;
  subject: string;
  category: string;
  termLabel: string;
  price: number;
  durationSeconds: number;
  // Exact spoken narration starting with Tutor Peter's signature greeting
  spokenIntro: string;
  spokenBody: string;
  spokenExample: string;
  spokenOutro: string;
  fullVoiceoverText: string;
  // Structured text drawn onto the blank classroom whiteboard
  boardHeaderBadge: string;
  boardTopicTitle: string;
  boardSubtitle: string;
  boardKeyPoints: [string, string, string];
  workedBoxTitle: string;
  workedBoxLines: [string, string, string];
  // YouTube & Multi-Site SEO Ranking Pack
  youtubeTitle: string;
  youtubeDescription: string;
  youtubePinnedComment: string;
  youtubeTags: string[];
  captionsSrt: string;
  watchPageUrl: string;
  materialPageUrl: string;
  thumbnailUrl: string;
  voiceoverUrl: string;
}

interface SubjectBoardDemo {
  points: [string, string, string];
  exampleTitle: string;
  exampleLines: [string, string, string];
  spokenDemo: string;
}

function getSubjectSpecificDemo(
  subjectRaw: string,
  gradeLabel: string,
  categoryRaw: string
): SubjectBoardDemo {
  const s = (subjectRaw || '').toLowerCase();
  const c = (categoryRaw || '').toLowerCase();

  if (s.includes('math')) {
    return {
      points: [
        '1. Identify given values, place value & KICD Competency Formula',
        '2. Show clear step-by-step substitution on every line (M1, M1)',
        '3. State final simplified answer with correct SI units (A1 = EE)',
      ],
      exampleTitle: 'WHITEBOARD WORKED EXAMPLE (MATHS)',
      exampleLines: [
        'Solve: 3x + 7 = 22  =>  3x = 22 - 7 = 15',
        'Divide both sides by 3:  x = 15 ÷ 3 = 5',
        '✓ Check: 3(5) + 7 = 22 (Full Method + Accuracy Marks!)',
      ],
      spokenDemo:
        'Look at my worked example on the whiteboard: write the equation clearly, isolate the unknown step by step to earn every method mark, and verify your final answer.',
    };
  }

  if (s.includes('kiswahili') || s.includes('fasihi')) {
    return {
      points: [
        '1. Matumizi sahihi ya Sarufi, Ngeli za Nomino na Nyakati',
        '2. Kusoma kwa Ufahamu, Ufupisho na Insha yenye Mtiririko',
        '3. Fasihi Simulizi na Andishi: Maudhui, Wahusika na Mbinu za Lugha',
      ],
      exampleTitle: 'MFANO UBAONI (KISWAHILI SANIFU)',
      exampleLines: [
        'Ngeli ya A-WA: Mtoto mzuri anasoma -> Watoto wazuri wanasoma',
        'Methali: Haba na haba hujaza kibaba (Bidii huleta ufanisi)',
        '✓ Tuzo: Hoja kamili + Mfano sahihi = Kuzidisha Matarajio (EE)',
      ],
      spokenDemo:
        'Tazama mfano wetu hapa ubaoni: zingatia upatanisho sahihi wa kisarufi katika ngeli, na ueleze maana pamoja na matumizi ili kupata alama zote.',
    };
  }

  if (s.includes('english') || s.includes('literacy')) {
    return {
      points: [
        '1. Grammar in Use: Parts of Speech, Tenses & Sentence Clauses',
        '2. Reading Comprehension, Summary Writing & Oral Literature',
        '3. Functional & Creative Writing: Format, Tone & Rich Vocabulary',
      ],
      exampleTitle: 'WHITEBOARD WORKED EXAMPLE (ENGLISH)',
      exampleLines: [
        'Active: The learners planted fifty indigenous trees.',
        'Passive: Fifty indigenous trees were planted by the learners.',
        '✓ Rubric: Correct auxiliary verb + past participle (EE 4/4)',
      ],
      spokenDemo:
        'Look right here on the whiteboard as we transform active voice into passive voice accurately while maintaining the exact tense and subject-verb agreement.',
    };
  }

  if (
    s.includes('science') ||
    s.includes('biology') ||
    s.includes('chemistry') ||
    s.includes('physics')
  ) {
    return {
      points: [
        '1. Core Scientific Concepts, Definitions & Real-Life Applications',
        '2. Practical Investigation Setup, Observation & Fair Testing',
        '3. Accurate Diagrams, Chemical/Physical Equations & Safety Rules',
      ],
      exampleTitle: 'WHITEBOARD LAB DEMONSTRATION',
      exampleLines: [
        'Photosynthesis: Carbon(IV) oxide + Water -> Glucose + Oxygen',
        'Conditions Needed: Sunlight Energy + Chlorophyll in Leaves',
        '✓ Exam Tip: State observation AND scientific explanation!',
      ],
      spokenDemo:
        'Follow my diagram and equation on the whiteboard: always link your practical observation directly to the underlying scientific principle for full KNEC marks.',
    };
  }

  if (s.includes('agric') || s.includes('nutrition') || s.includes('home')) {
    return {
      points: [
        '1. Soil & Water Conservation: Mulching, Drip & Trap Cropping',
        '2. Crop & Livestock Management + Value Addition Practices',
        '3. Balanced Diet, Food Preservation & Kitchen Hygiene Skills',
      ],
      exampleTitle: 'WHITEBOARD PRACTICAL DEMO',
      exampleLines: [
        'Mulching Benefit 1: Reduces evaporation & conserves moisture',
        'Mulching Benefit 2: Suppresses weeds & adds organic humus',
        '✓ Competency: Practical project + clear record keeping (EE)',
      ],
      spokenDemo:
        'Right here on the whiteboard, notice how we connect practical school-farm conservation steps with clear nutritional and economic benefits.',
    };
  }

  if (
    s.includes('social') ||
    s.includes('history') ||
    s.includes('geog') ||
    s.includes('citizenship')
  ) {
    return {
      points: [
        '1. Map Reading, Compass Bearing, Scale & Physical Landforms',
        '2. Kenyan & African Heritage, Governance & Constitutional Values',
        '3. Population, Resources, Climate Action & Economic Growth',
      ],
      exampleTitle: 'WHITEBOARD MAP & CIVICS EXAMPLE',
      exampleLines: [
        'Linear Scale 1:50,000 => 1 cm on map represents 0.5 km on ground',
        'If map distance = 8 cm => Actual Ground Distance = 8 × 0.5 = 4 km',
        '✓ Always include units (km) & show multiplication step!',
      ],
      spokenDemo:
        'Check our map-work calculation on the whiteboard: convert the scale first, multiply accurately, and state your answer in kilometres.',
    };
  }

  if (s.includes('cre') || s.includes('christian') || s.includes('ire') || s.includes('religious')) {
    return {
      points: [
        '1. Scriptural / Sacred Text Teachings & Moral Lessons',
        '2. Application of Values in Family, School & Kenyan Society',
        '3. Responsible Decision-Making, Integrity & Servant Leadership',
      ],
      exampleTitle: 'WHITEBOARD VALUE APPLICATION',
      exampleLines: [
        'Step 1: State the Biblical / Moral Teaching clearly',
        'Step 2: Give a concrete modern example for learners today',
        '✓ Earns Exceeding Expectations (EE) in CBC & KJSEA!',
      ],
      spokenDemo:
        'As written on our whiteboard, always pair the scriptural teaching with a practical daily-life application for learners and society.',
    };
  }

  if (
    s.includes('pre-tech') ||
    s.includes('computer') ||
    s.includes('business') ||
    s.includes('technical')
  ) {
    return {
      points: [
        '1. Workshop & Digital Safety, Tools, Materials & Technical Drawing',
        '2. Coding, Digital Literacy, Algorithms & Data Protection',
        '3. Entrepreneurship, Bookkeeping, M-Pesa Commerce & Ethics',
      ],
      exampleTitle: 'WHITEBOARD APPLIED SKILL',
      exampleLines: [
        'Accounting Equation: Assets = Capital + Liabilities',
        'If Capital = KSh 80,000 & Liabilities = KSh 20,000 => Assets = 100,000',
        '✓ Practical Competency + Accurate Calculation = Full Marks',
      ],
      spokenDemo:
        'Look at the practical formula on the whiteboard: verify both sides balance and apply safe, ethical technical procedures.',
    };
  }

  if (c.includes('scheme')) {
    return {
      points: [
        '1. 10-Column KICD Rationalized Weekly & Lesson Breakdown',
        '2. Specific Learning Outcomes (Knowledge, Skills & Attitudes)',
        '3. Key Inquiry Questions, Orange Book Refs & Assessment Rubrics',
      ],
      exampleTitle: 'WHITEBOARD 10-COLUMN STRUCTURE',
      exampleLines: [
        'Wk | Lsn | Strand | Sub-strand | Specific Learning Outcomes',
        'Learning Experiences | KIQ | Resources | Assessment | Reflection',
        `✓ 100% TPAD-Ready for ${gradeLabel} (Editable Word + PDF)`,
      ],
      spokenDemo:
        'On the whiteboard you can see all ten official KICD and TSC TPAD columns structured lesson by lesson for effortless term preparation.',
    };
  }

  return {
    points: [
      `1. Full 2026 KICD Rationalized ${gradeLabel} Syllabus Coverage`,
      '2. Clear Point-Form Concepts + Approved Textbook Examples',
      '3. Competency Assessment Questions + Official Marking Rubric',
    ],
    exampleTitle: 'WHITEBOARD CLASSROOM MASTERY',
    exampleLines: [
      'Step 1: Master core sub-strand definitions & key terms',
      'Step 2: Practice worked examples without question repetition',
      '✓ Step 3: Self-check with EE / ME / AE / BE Marking Scheme!',
    ],
    spokenDemo:
      'Follow the three mastery steps on my whiteboard: understand every sub-strand concept, apply valid textbook examples, and verify with our official marking scheme.',
  };
}

function parseMaterialCustomPoints(
  item: MaterialVideoInput,
  fallbackPoints: [string, string, string]
): [string, string, string] {
  if (item.strands && item.strands.trim().length > 10) {
    const parts = item.strands
      .split(/[,;|•\n]+/)
      .map((x) => x.trim())
      .filter((x) => x.length > 3);
    if (parts.length >= 3) {
      return [
        `1. Strand Focus: ${parts[0].slice(0, 62)}`,
        `2. Core Sub-strand: ${parts[1].slice(0, 62)}`,
        `3. Applied Mastery: ${parts[2].slice(0, 62)}`,
      ];
    }
  }
  return fallbackPoints;
}

function formatSrtTimestamp(sec: number): string {
  const hrs = Math.floor(sec / 3600);
  const mins = Math.floor((sec % 3600) / 60);
  const s = Math.floor(sec % 60);
  const ms = Math.round((sec - Math.floor(sec)) * 1000);
  return `${String(hrs).padStart(2, '0')}:${String(mins).padStart(
    2,
    '0'
  )}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

export function buildTutorPeterWhiteboardLesson(
  item: MaterialVideoInput
): WhiteboardLessonPlan {
  const gradeKey = getResourceGradeKey({
    grade: item.grade,
    level: item.level || '',
    title: item.title,
  });
  const gradeLabel = formatGradeLabel(gradeKey);
  const termLabel = formatTermLabel(item.term);
  const cleanSubject = item.subject || 'CBC Curriculum';
  const cleanTitle = item.title.replace(/\s+/g, ' ').trim();

  const demo = getSubjectSpecificDemo(cleanSubject, gradeLabel, item.category);
  const boardKeyPoints = parseMaterialCustomPoints(item, demo.points);

  // Signature required introduction from Tutor Peter
  const spokenIntro = `Tutor Peter here, welcome to our today's class! Today on our whiteboard, we are covering ${gradeLabel} ${cleanSubject}: ${cleanTitle}.`;
  const spokenBody = `Let us walk through the key syllabus areas on the board: ${boardKeyPoints[0].replace(
    /^1\.\s*/,
    'First, '
  )}. ${boardKeyPoints[1].replace(
    /^2\.\s*/,
    'Second, '
  )}. And ${boardKeyPoints[2].replace(/^3\.\s*/, 'third, ')}.`;
  const spokenExample = demo.spokenDemo;
  const spokenOutro = `To download the complete editable Word and printable PDF for this ${gradeLabel} ${cleanSubject} material instantly via M-Pesa, click the link below at www.cbcmaterials.shop. Subscribe and see you in our next class!`;

  const fullVoiceoverText = `${spokenIntro} ${spokenBody} ${spokenExample} ${spokenOutro}`;

  const watchPageUrl = `${SITE_ORIGIN}/videos/material/${encodeURIComponent(
    item.id
  )}`;
  const materialPageUrl = `${SITE_ORIGIN}/materials/${encodeURIComponent(
    item.id
  )}`;
  const thumbnailUrl = `${SITE_ORIGIN}/api/videos/thumbnail?materialId=${encodeURIComponent(
    item.id
  )}`;
  const voiceoverUrl = `/api/videos/voiceover?materialId=${encodeURIComponent(
    item.id
  )}`;

  const rawYtTitle = `${cleanTitle} | Tutor Peter Whiteboard Class (${gradeLabel} ${cleanSubject})`;
  const youtubeTitle =
    rawYtTitle.length <= 100 ? rawYtTitle : `${rawYtTitle.slice(0, 97)}...`;

  const youtubeDescription =
    `👉 Download Full ${cleanTitle} (Word + PDF) Instantly: ${materialPageUrl}\n` +
    `🎬 Watch All Tutor Peter Whiteboard Classes: ${SITE_ORIGIN}/videos\n` +
    `🌐 Official CBCMaterials Kenya Portal: ${SITE_ORIGIN}\n\n` +
    `👨‍🏫 Tutor Peter here, welcome to our today's class! In this step-by-step whiteboard demonstration, we break down ${cleanTitle} for ${gradeLabel} ${cleanSubject} (${termLabel}) aligned 100% with the 2026 KICD Rationalized Competency-Based Curriculum (CBC) and KNEC assessment standards.\n\n` +
    `⏱️ YOUTUBE CHAPTER TIMESTAMPS (KEY MOMENTS):\n` +
    `00:00 — Tutor Peter Welcome & ${gradeLabel} ${cleanSubject} Lesson Overview\n` +
    `00:07 — Core KICD Rationalized Strands & Key Points on the Whiteboard\n` +
    `00:19 — ${demo.exampleTitle} & Marking Rubric Breakdown\n` +
    `00:29 — Class Summary & Instant Word/PDF Download on cbcmaterials.shop\n\n` +
    `📌 WHAT YOU GET IN THE FULL MATERIAL (KES ${item.price || 50}):\n` +
    `✅ ${boardKeyPoints[0]}\n` +
    `✅ ${boardKeyPoints[1]}\n` +
    `✅ ${boardKeyPoints[2]}\n` +
    `✅ Both Editable Microsoft Word (.DOCX) & Print-Ready (.PDF) • Instant 1-Second M-Pesa Unlock (0728595160)\n\n` +
    `🔎 Search "cbcmaterials.shop" on Google for 6,534+ CBC Schemes of Work, Teachers Notes, Lesson Plans, Records of Work, KNEC KJSEA & KPSEA Examinations + Official Marking Schemes, TSC Services & Verified Tuition Tutors in Kenya!\n\n` +
    `#TutorPeter #CBCKenya #CBCMaterials #${cleanSubject.replace(
      /[^a-zA-Z0-9]/g,
      ''
    )} #${gradeLabel.replace(/\s+/g, '')} #KJSEA2026 #KPSEA2026 #SchemesOfWork #TeachersNotes #KNEC #TSC`;

  const youtubePinnedComment =
    `👨‍🏫 Tutor Peter here! Download today's full ${gradeLabel} ${cleanSubject} material (${cleanTitle}) in Word & PDF right here 👉 ${materialPageUrl} | Need a Personal Tutor or Help? WhatsApp: 0728595160`;

  const captionsSrt = [
    `1\n${formatSrtTimestamp(0)} --> ${formatSrtTimestamp(7.5)}\n${spokenIntro}\n`,
    `2\n${formatSrtTimestamp(7.5)} --> ${formatSrtTimestamp(19.5)}\n${spokenBody}\n`,
    `3\n${formatSrtTimestamp(19.5)} --> ${formatSrtTimestamp(29.0)}\n${spokenExample}\n`,
    `4\n${formatSrtTimestamp(29.0)} --> ${formatSrtTimestamp(36.0)}\n${spokenOutro}\n`,
  ].join('\n');

  return {
    materialId: item.id,
    title: cleanTitle,
    gradeLabel,
    subject: cleanSubject,
    category: item.category || 'CBC Material',
    termLabel,
    price: Number(item.price) || 50,
    durationSeconds: 36,
    spokenIntro,
    spokenBody,
    spokenExample,
    spokenOutro,
    fullVoiceoverText,
    boardHeaderBadge: `${gradeLabel.toUpperCase()} • ${cleanSubject.toUpperCase()} • ${termLabel.toUpperCase()}`,
    boardTopicTitle:
      cleanTitle.length > 68 ? `${cleanTitle.slice(0, 65)}...` : cleanTitle,
    boardSubtitle: "TUTOR PETER'S LIVE WHITEBOARD DEMONSTRATION",
    boardKeyPoints,
    workedBoxTitle: demo.exampleTitle,
    workedBoxLines: demo.exampleLines,
    youtubeTitle,
    youtubeDescription,
    youtubePinnedComment,
    youtubeTags: [
      'Tutor Peter',
      'CBCMaterials',
      'cbcmaterials.shop',
      'CBC Kenya',
      `${gradeLabel} ${cleanSubject}`,
      `2026 ${item.category}`,
      'CBC Schemes of Work',
      'CBC Teachers Notes',
      'KNEC KJSEA 2026',
      'KPSEA 2026',
      'Kenya Online Tuition',
      cleanSubject,
      gradeLabel,
    ],
    captionsSrt,
    watchPageUrl,
    materialPageUrl,
    thumbnailUrl,
    voiceoverUrl,
  };
}
