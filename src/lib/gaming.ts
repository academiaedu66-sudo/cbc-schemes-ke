import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { getSyllabusForGrade } from '../../scripts/cbc-syllabus-data.mjs';

const BUCKET_NAME = 'cbc-materials';
const GAMING_STORAGE_PATH = '_system/gaming-ledger.json';

export const GAMING_FEE_KES = 10; // KSh 10 ("10 bob") per 20-minute activation
export const GAMING_SESSION_MS = 20 * 60 * 1000; // Exact 20 minutes (1,200,000 ms)
export const POINTS_PER_QUESTION = 1; // 1 point per correct question
export const REDEEM_POINTS_REQUIRED = 1000; // 1,000 points
export const REDEEM_KES_VALUE = 5; // KSh 5 ("5 bob") per 1,000 points

export const ALL_GAMING_SUBJECTS = [
  'Mathematics',
  'English',
  'Kiswahili',
  'Integrated Science',
  'Science & Technology',
  'Biology',
  'Chemistry',
  'Physics',
  'Pre-Technical Studies',
  'Computer Studies',
  'Agriculture & Nutrition',
  'Social Studies',
  'History & Citizenship',
  'Geography',
  'Business Studies',
  'Creative Arts & Sports',
  'Christian Religious Education (CRE)',
  'Islamic Religious Education (IRE)',
  'Language Activities',
  'Mathematical Activities',
  'Environmental Activities',
] as const;

export interface GamingPlayer {
  phone: string;
  playerName: string;
  gradeKey: string;
  pointsBalance: number;
  lifetimePoints: number;
  questionsAttempted: number;
  questionsCorrect: number;
  sessionsActivated: number;
  totalRedeemedKes: number;
  updatedAt: string;
}

export interface GamingSession {
  sessionId: string;
  checkoutRequestId: string;
  phone: string;
  playerName: string;
  gradeKey: string;
  subject: string;
  startedAt: number; // epoch ms
  expiresAt: number; // epoch ms (startedAt + 3,600,000)
  sessionPoints: number;
  sessionAnswered: number;
  usedQuestionNonces: string[];
}

export interface GamingRedemption {
  id: string;
  referenceCode: string;
  phone: string;
  playerName: string;
  pointsDeducted: number;
  amountKes: number;
  status: 'PENDING' | 'PAID';
  createdAt: string;
}

export interface GamingLedger {
  players: Record<string, GamingPlayer>;
  sessions: Record<string, GamingSession>;
  redemptions: GamingRedemption[];
  updatedAt: string;
}

export interface PublicGameQuestion {
  nonce: string;
  subject: string;
  gradeLabel: string;
  prompt: string;
  options: [string, string, string, string];
  token: string; // HMAC-signed server verification token
}

function getHmacSecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    'cbc-gaming-secret-2026'
  );
}

export function signQuestionToken(params: {
  nonce: string;
  sessionId: string;
  correctIndex: number;
  explanation: string;
}): string {
  const payload = JSON.stringify({
    n: params.nonce,
    s: params.sessionId,
    c: params.correctIndex,
    e: params.explanation,
    iat: Date.now(),
  });
  const b64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getHmacSecret())
    .update(b64)
    .digest('base64url');
  return `${b64}.${sig}`;
}

export function verifyQuestionToken(
  token: string,
  expectedSessionId: string
): {
  nonce: string;
  correctIndex: number;
  explanation: string;
} | null {
  try {
    const [b64, sig] = String(token || '').split('.');
    if (!b64 || !sig) return null;
    const expectedSig = crypto
      .createHmac('sha256', getHmacSecret())
      .update(b64)
      .digest('base64url');
    if (sig !== expectedSig) return null;
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8')) as {
      n: string;
      s: string;
      c: number;
      e: string;
    };
    if (parsed.s !== expectedSessionId) return null;
    return {
      nonce: parsed.n,
      correctIndex: parsed.c,
      explanation: parsed.e,
    };
  } catch {
    return null;
  }
}

let cachedLedger: { data: GamingLedger; loadedAt: number } | null = null;

export async function getGamingLedger(): Promise<GamingLedger> {
  if (cachedLedger && Date.now() - cachedLedger.loadedAt < 8000) {
    return cachedLedger.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(GAMING_STORAGE_PATH);

    if (error || !data) {
      const empty: GamingLedger = {
        players: {},
        sessions: {},
        redemptions: [],
        updatedAt: new Date().toISOString(),
      };
      cachedLedger = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<GamingLedger>;
    const ledger: GamingLedger = {
      players: parsed.players || {},
      sessions: parsed.sessions || {},
      redemptions: Array.isArray(parsed.redemptions) ? parsed.redemptions : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedLedger = { data: ledger, loadedAt: Date.now() };
    return ledger;
  } catch {
    const empty: GamingLedger = {
      players: {},
      sessions: {},
      redemptions: [],
      updatedAt: new Date().toISOString(),
    };
    cachedLedger = { data: empty, loadedAt: Date.now() };
    return empty;
  }
}

export async function saveGamingLedger(ledger: GamingLedger): Promise<void> {
  // Prune expired sessions older than 24 hours to keep JSON fast & compact
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  for (const [sid, sess] of Object.entries(ledger.sessions)) {
    if (sess.expiresAt < cutoff) {
      delete ledger.sessions[sid];
    }
  }

  ledger.updatedAt = new Date().toISOString();
  cachedLedger = { data: ledger, loadedAt: Date.now() };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(GAMING_STORAGE_PATH, Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });
}

interface RawQuizItem {
  q: string;
  options: [string, string, string, string];
  ans: number;
  exp: string;
}

const SUBJECT_BANKS: Record<string, RawQuizItem[]> = {
  english: [
    {
      q: 'Choose the correct question tag: "The learners have completed their CBC project, _____?"',
      options: ["haven't they", "didn't they", 'have they', "don't they"],
      ans: 0,
      exp: 'A positive statement with "have" takes the negative tag "haven\'t they?".',
    },
    {
      q: 'Which word is the ANTONYM of "diligent"?',
      options: ['Hardworking', 'Careful', 'Lazy', 'Attentive'],
      ans: 2,
      exp: '"Diligent" means hardworking and careful; its opposite is "lazy".',
    },
    {
      q: 'Identify the collective noun: "A _____ of bees flew over the school garden."',
      options: ['herd', 'swarm', 'flock', 'pack'],
      ans: 1,
      exp: 'A group of bees is called a swarm.',
    },
    {
      q: 'Choose the correctly punctuated sentence:',
      options: [
        'Where are you going, asked the teacher.',
        '"Where are you going?" asked the teacher.',
        '"Where are you going" asked the teacher?',
        'Where are you going? "asked the teacher."',
      ],
      ans: 1,
      exp: 'Spoken questions go inside quotation marks with the question mark inside.',
    },
    {
      q: 'Fill in the blank: "Neither Asha nor her brothers _____ late for assembly."',
      options: ['was', 'were', 'is', 'has been'],
      ans: 1,
      exp: 'With "neither...nor", the verb agrees with the nearer subject ("brothers" -> plural "were").',
    },
    {
      q: 'Which literary device gives human qualities to non-human things?',
      options: ['Simile', 'Alliteration', 'Personification', 'Hyperbole'],
      ans: 2,
      exp: 'Personification attributes human traits to objects, nature, or ideas.',
    },
    {
      q: 'Change to passive voice: "The prefect rang the bell."',
      options: [
        'The bell rings by the prefect.',
        'The bell was rung by the prefect.',
        'The bell was rang by the prefect.',
        'The bell is rung by the prefect.',
      ],
      ans: 1,
      exp: 'Past simple passive uses "was/were + past participle" (ring -> rang -> rung).',
    },
    {
      q: 'Choose the correct preposition: "She congratulated him _____ passing his KPSEA assessment."',
      options: ['for', 'on', 'about', 'with'],
      ans: 1,
      exp: 'The standard English collocation is "congratulate someone ON something".',
    },
  ],
  kiswahili: [
    {
      q: 'Kamilisha methali: "Asiyesikia la mkuu _____."',
      options: [
        'hupata baraka',
        'huvunjika guu',
        'huenda mbali',
        'hujenga nyumba',
      ],
      ans: 1,
      exp: 'Methali kamili ni: "Asiyesikia la mkuu huvunjika guu."',
    },
    {
      q: 'Nomino "kitabu" iko katika ngeli gani?',
      options: ['A-WA', 'KI-VI', 'LI-YA', 'U-I'],
      ans: 1,
      exp: 'Kitabu – Vitabu huangukia katika ngeli ya KI-VI.',
    },
    {
      q: 'Tegua kitendawili: "Nyumba yangu haina mlango."',
      options: ['Kobe', 'Yai', 'uyoga', 'Chupa'],
      ans: 1,
      exp: 'Jibu sahihi la "Nyumba yangu haina mlango" ni Yai.',
    },
    {
      q: 'Kinyume cha neno "furaha" ni kipi?',
      options: ['Tabasamu', 'Huzuni', 'Amani', 'Upendo'],
      ans: 1,
      exp: 'Kinyume cha furaha ni huzuni.',
    },
    {
      q: 'Chagua wingi wa sentensi: "Mwalimu amefundisha mwanafunzi."',
      options: [
        'Walimu wamefundisha mwanafunzi.',
        'Walimu wamewafundisha wanafunzi.',
        'Mwalimu wamefundisha wanafunzi.',
        'Waalimu amefundisha wanafunzi.',
      ],
      ans: 1,
      exp: 'Wingi sahihi ni: "Walimu wamewafundisha wanafunzi."',
    },
    {
      q: 'Kisawe cha neno "rununu" ni kipi?',
      options: ['Runinga', 'Simu ya mkono', 'Tarakilishi', 'Redio'],
      ans: 1,
      exp: 'Rununu ni simu ya mkono (mobile phone); runinga ni televisheni.',
    },
    {
      q: 'Ni alama ipi ya uakifishaji hutumiwa mwishoni mwa swali?',
      options: ['Kikomo (.)', 'Kiulizi (?)', 'Mkato (,)', 'Hisishi (!)'],
      ans: 1,
      exp: 'Alama ya kiulizi (?) huwekwa mwishoni mwa sentensi ya swali.',
    },
  ],
  science: [
    {
      q: 'Which organelle is known as the powerhouse of the cell because it releases energy?',
      options: ['Nucleus', 'Mitochondrion', 'Ribosome', 'Vacuole'],
      ans: 1,
      exp: 'Mitochondria carry out cellular respiration to produce energy (ATP).',
    },
    {
      q: 'Which gas do green plants absorb from the atmosphere during photosynthesis?',
      options: ['Oxygen', 'Nitrogen', 'Carbon dioxide', 'Hydrogen'],
      ans: 2,
      exp: 'Plants take in carbon dioxide and water using sunlight & chlorophyll to make glucose and oxygen.',
    },
    {
      q: 'In the human heart, which blood vessels carry oxygenated blood from the lungs to the left atrium?',
      options: ['Pulmonary artery', 'Pulmonary vein', 'Aorta', 'Vena cava'],
      ans: 1,
      exp: 'The pulmonary vein carries oxygenated blood from the lungs to the heart.',
    },
    {
      q: 'What is the chemical symbol for Sodium on the Periodic Table?',
      options: ['So', 'Sd', 'Na', 'K'],
      ans: 2,
      exp: 'Sodium has the chemical symbol Na (from Latin "Natrium"); K is Potassium.',
    },
    {
      q: 'What is the SI unit of electric current?',
      options: ['Volt (V)', 'Ohm (Ω)', 'Ampere (A)', 'Watt (W)'],
      ans: 2,
      exp: 'Electric current is measured in Amperes (A) using an ammeter.',
    },
    {
      q: 'Which change of state occurs when a solid turns directly into a gas without melting?',
      options: ['Condensation', 'Evaporation', 'Sublimation', 'Freezing'],
      ans: 2,
      exp: 'Sublimation converts a solid (such as dry ice or iodine) directly into vapour.',
    },
    {
      q: 'A solution with a pH of 2 is classified as:',
      options: ['Neutral', 'Weakly basic', 'Strongly acidic', 'Strongly alkaline'],
      ans: 2,
      exp: 'pH below 7 is acidic; pH 1–3 indicates a strong acid.',
    },
    {
      q: 'If a force of 40 N moves a box a distance of 5 m in the direction of the force, how much work is done?',
      options: ['8 J', '45 J', '200 J', '100 J'],
      ans: 2,
      exp: 'Work = Force × Distance = 40 N × 5 m = 200 Joules (J).',
    },
  ],
  pretech_ict: [
    {
      q: 'In Computer Studies, what does CPU stand for?',
      options: [
        'Central Program Utility',
        'Central Processing Unit',
        'Computer Personal Unit',
        'Control Panel Unit',
      ],
      ans: 1,
      exp: 'CPU stands for Central Processing Unit — the brain of the computer.',
    },
    {
      q: 'Which workshop safety equipment protects the eyes from flying sparks or wood chips?',
      options: ['Ear muffs', 'Safety goggles', 'Leather apron', 'Gumboots'],
      ans: 1,
      exp: 'Safety goggles protect the eyes from debris, sparks, and chemical splashes.',
    },
    {
      q: 'Which of the following is an INPUT device?',
      options: ['Monitor', 'Projector', 'Barcode scanner', 'Speaker'],
      ans: 2,
      exp: 'A barcode scanner sends data INTO the computer, making it an input device.',
    },
    {
      q: 'What is "phishing" in online cybersecurity?',
      options: [
        'Cooling down a computer processor',
        'Tricking users into revealing passwords or M-Pesa PINs via fake messages',
        'Backing up files to cloud storage',
        'Formatting a flash disk',
      ],
      ans: 1,
      exp: 'Phishing uses deceptive messages/links to steal confidential credentials or PINs.',
    },
    {
      q: 'In technical drawing, which instrument is used to draw accurate circles and arcs?',
      options: ['Set square', 'Pair of compasses', 'T-square', 'Divider'],
      ans: 1,
      exp: 'A pair of compasses holds a pencil to draw circles and arcs of a given radius.',
    },
  ],
  agriculture: [
    {
      q: 'Which irrigation method conserves the MOST water by delivering drops directly to plant roots?',
      options: [
        'Flood irrigation',
        'Drip irrigation',
        'Overhead sprinkler',
        'Furrow irrigation',
      ],
      ans: 1,
      exp: 'Drip irrigation minimizes evaporation and runoff by delivering water straight to roots.',
    },
    {
      q: 'Which nutrient deficiency causes kwashiorkor in young children?',
      options: ['Vitamin C', 'Carbohydrates', 'Proteins', 'Calcium'],
      ans: 2,
      exp: 'Kwashiorkor is caused by severe protein deficiency in the diet.',
    },
    {
      q: 'Planting trees alongside crops and pasture on the same piece of land is called:',
      options: ['Monocropping', 'Agroforestry', 'Mulching', 'Deforestation'],
      ans: 1,
      exp: 'Agroforestry integrates trees, crops, and/or livestock for soil & climate benefits.',
    },
    {
      q: 'Why do farmers apply organic mulch around crop bases?',
      options: [
        'To increase soil erosion',
        'To conserve soil moisture and suppress weeds',
        'To attract crop pests',
        'To harden the soil surface',
      ],
      ans: 1,
      exp: 'Mulching reduces water evaporation, suppresses weeds, and enriches humus as it rots.',
    },
    {
      q: 'Which dairy cattle breed is famous in Kenya for its black-and-white coat and highest milk yield?',
      options: ['Jersey', 'Friesian', 'Ayrshire', 'Guernsey'],
      ans: 1,
      exp: 'Friesian cattle have a black-and-white coat and produce the highest volume of milk.',
    },
  ],
  social_humanities: [
    {
      q: 'In which year was the current Constitution of Kenya promulgated?',
      options: ['1963', '2002', '2010', '2013'],
      ans: 2,
      exp: 'The Constitution of Kenya was promulgated on 27th August 2010.',
    },
    {
      q: 'How many County Governments are established under Kenya’s devolved system?',
      options: ['42', '47', '52', '290'],
      ans: 1,
      exp: 'Kenya has 47 County Governments and 290 Constituencies.',
    },
    {
      q: 'Which imaginary line of latitude passes right through Kenya (including Nanyuki and Maseno)?',
      options: [
        'Tropic of Cancer',
        'The Equator (0°)',
        'Tropic of Capricorn',
        'Prime Meridian',
      ],
      ans: 1,
      exp: 'The Equator (0° latitude) crosses central and western Kenya.',
    },
    {
      q: 'In Business Studies, the basic accounting equation is:',
      options: [
        'Assets = Capital + Liabilities',
        'Capital = Assets + Liabilities',
        'Liabilities = Assets + Capital',
        'Profit = Assets - Liabilities',
      ],
      ans: 0,
      exp: 'Total resources owned (Assets) equal owner equity (Capital) plus external claims (Liabilities).',
    },
    {
      q: 'Which is the highest mountain in Africa?',
      options: ['Mount Kenya', 'Mount Kilimanjaro', 'Mount Elgon', 'Mount Ruwenzori'],
      ans: 1,
      exp: 'Mount Kilimanjaro in Tanzania is the highest peak in Africa (5,895 m); Mt Kenya is second.',
    },
  ],
  cre: [
    {
      q: 'According to Genesis Chapter 1, on which day did God rest after completing Creation?',
      options: ['Fifth day', 'Sixth day', 'Seventh day', 'First day'],
      ans: 2,
      exp: 'God created humankind on the 6th day and blessed & rested on the 7th day.',
    },
    {
      q: 'In the Parable of the Good Samaritan, what lesson did Jesus teach about our "neighbour"?',
      options: [
        'Only people from our home village are neighbours',
        'We should show mercy and kindness to anyone in need',
        'Only rich people can help others',
        'Travellers should avoid Jerusalem',
      ],
      ans: 1,
      exp: 'Jesus taught compassionate action toward every person in need regardless of background.',
    },
    {
      q: 'Which of the following is a Fruit of the Holy Spirit (Galatians 5:22–23)?',
      options: ['Pride', 'Self-control', 'Jealousy', 'Boasting'],
      ans: 1,
      exp: 'The fruit of the Spirit is love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, and self-control.',
    },
    {
      q: 'Who led the Israelites out of slavery in Egypt?',
      options: ['David', 'Moses', 'Solomon', 'Samuel'],
      ans: 1,
      exp: 'God called Moses at the burning bush to lead the Israelites out of Egypt.',
    },
  ],
  ire: [
    {
      q: 'How many obligatory daily prayers (Swalah) do Muslims perform each day?',
      options: ['Three', 'Four', 'Five', 'Seven'],
      ans: 2,
      exp: 'The five daily prayers are Fajr, Dhuhr, Asr, Maghrib, and Isha.',
    },
    {
      q: 'Which Pillar of Islam involves fasting during the holy month of Ramadhan?',
      options: ['Zakah', 'Saum', 'Hajj', 'Shahadah'],
      ans: 1,
      exp: 'Saum is fasting during the month of Ramadhan.',
    },
    {
      q: 'In which city was Prophet Muhammad (P.B.U.H) born?',
      options: ['Madinah', 'Makkah', 'Jerusalem', 'Taif'],
      ans: 1,
      exp: 'Prophet Muhammad (P.B.U.H) was born in Makkah in the Year of the Elephant.',
    },
    {
      q: 'Giving obligatory charity to support the poor and needy in Islam is called:',
      options: ['Zakah', 'Umrah', 'Wudhu', 'Tawaf'],
      ans: 0,
      exp: 'Zakah is the compulsory almsgiving pillar that purifies wealth and helps those in need.',
    },
  ],
  creative: [
    {
      q: 'Which set below contains ONLY the three Primary Colours in Visual Arts?',
      options: [
        'Green, Orange, Purple',
        'Red, Yellow, Blue',
        'Black, White, Grey',
        'Red, Green, Yellow',
      ],
      ans: 1,
      exp: 'Red, Yellow, and Blue are the three primary pigment colours; mixing them creates secondary colours.',
    },
    {
      q: 'Mixing Blue and Yellow paint produces which Secondary Colour?',
      options: ['Orange', 'Purple', 'Green', 'Brown'],
      ans: 2,
      exp: 'Blue + Yellow = Green.',
    },
    {
      q: 'In Athletics, a standard outdoor running track lap measures how many metres?',
      options: ['100 m', '200 m', '400 m', '800 m'],
      ans: 2,
      exp: 'One full lap around the innermost lane of a standard athletics track is 400 metres.',
    },
    {
      q: 'How many players from ONE team are on the pitch during a standard football (soccer) match?',
      options: ['7', '9', '11', '15'],
      ans: 2,
      exp: 'A regulation football team fields 11 players including the goalkeeper.',
    },
  ],
};

function generateDynamicMathItem(gradeKey: string): RawQuizItem {
  const upper = String(gradeKey || '7').toUpperCase();
  const gradeNum = upper.startsWith('PP') ? 0 : Number(upper) || 7;
  const kind = Math.floor(Math.random() * 4);

  if (gradeNum <= 3) {
    const a = 4 + Math.floor(Math.random() * 18);
    const b = 3 + Math.floor(Math.random() * 15);
    if (kind % 2 === 0) {
      const sum = a + b;
      const opts = shuffleWithAnswer(sum, [sum + 2, sum - 1, sum + 5]);
      return {
        q: `Work out: ${a} + ${b} = ?`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `${a} plus ${b} equals ${sum}.`,
      };
    }
    const big = Math.max(a, b) + 6;
    const small = Math.min(a, b);
    const diff = big - small;
    const opts = shuffleWithAnswer(diff, [diff + 1, diff + 3, Math.max(0, diff - 2)]);
    return {
      q: `Subtract: ${big} - ${small} = ?`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `${big} minus ${small} equals ${diff}.`,
    };
  }

  if (gradeNum <= 6) {
    if (kind === 0) {
      const l = 6 + Math.floor(Math.random() * 12);
      const w = 4 + Math.floor(Math.random() * 9);
      const area = l * w;
      const perim = 2 * (l + w);
      const opts = shuffleWithAnswer(
        `${area} cm²`,
        [`${perim} cm²`, `${l + w} cm²`, `${area + w} cm²`]
      );
      return {
        q: `Find the AREA of a rectangle measuring ${l} cm by ${w} cm.`,
        options: opts.options,
        ans: opts.ansIndex,
        exp: `Area = Length × Width = ${l} × ${w} = ${area} cm².`,
      };
    }
    const pctChoices = [10, 20, 25, 50];
    const pct = pctChoices[Math.floor(Math.random() * pctChoices.length)];
    const base = (2 + Math.floor(Math.random() * 9)) * 40;
    const val = (pct * base) / 100;
    const opts = shuffleWithAnswer(val, [val + 10, val + 5, Math.max(1, val - 8)]);
    return {
      q: `Calculate ${pct}% of ${base}.`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `${pct}/100 × ${base} = ${val}.`,
    };
  }

  // JSS & Senior School (Grades 7–12): Algebra, Squares, Ratios, Speed
  if (kind === 0) {
    const x = 2 + Math.floor(Math.random() * 11);
    const m = 2 + Math.floor(Math.random() * 6);
    const c = 3 + Math.floor(Math.random() * 14);
    const rhs = m * x + c;
    const opts = shuffleWithAnswer(x, [x + 2, x - 1, x + 4]);
    return {
      q: `Solve for x: ${m}x + ${c} = ${rhs}`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `${m}x = ${rhs} - ${c} = ${rhs - c}, so x = ${rhs - c} ÷ ${m} = ${x}.`,
    };
  }

  if (kind === 1) {
    const speed = (4 + Math.floor(Math.random() * 6)) * 15; // 60..135 km/h
    const hours = 2 + Math.floor(Math.random() * 4);
    const dist = speed * hours;
    const opts = shuffleWithAnswer(`${dist} km`, [
      `${dist + 30} km`,
      `${speed + hours} km`,
      `${dist - 25} km`,
    ]);
    return {
      q: `A bus travels at an average speed of ${speed} km/h for ${hours} hours. What distance does it cover?`,
      options: opts.options,
      ans: opts.ansIndex,
      exp: `Distance = Speed × Time = ${speed} × ${hours} = ${dist} km.`,
    };
  }

  const a = 3 + Math.floor(Math.random() * 9);
  const b = 2 + Math.floor(Math.random() * 7);
  const val = a * a + b * b;
  const opts = shuffleWithAnswer(val, [val + 4, (a + b) * 2, val - 3]);
  return {
    q: `Evaluate: ${a}² + ${b}²`,
    options: opts.options,
    ans: opts.ansIndex,
    exp: `${a}² = ${a * a} and ${b}² = ${b * b}; ${a * a} + ${b * b} = ${val}.`,
  };
}

function shuffleWithAnswer<T extends string | number>(
  correct: T,
  distractors: T[]
): { options: [string, string, string, string]; ansIndex: number } {
  const corrStr = String(correct);
  const uniqueSet = new Set<string>([corrStr]);
  for (const d of distractors) {
    if (uniqueSet.size < 4 && String(d) !== corrStr) {
      uniqueSet.add(String(d));
    }
  }
  let filler = 1;
  while (uniqueSet.size < 4) {
    uniqueSet.add(`${corrStr}_${filler++}`);
  }
  const arr = Array.from(uniqueSet).slice(0, 4);
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return {
    options: [arr[0], arr[1], arr[2], arr[3]],
    ansIndex: arr.indexOf(corrStr),
  };
}

function resolveBankKey(subject: string): string {
  const s = (subject || '').toLowerCase();
  if (s.includes('math')) return 'math';
  if (s.includes('kiswahili') || s.includes('fasihi')) return 'kiswahili';
  if (s.includes('english') || s.includes('language') || s.includes('literature')) {
    return 'english';
  }
  if (
    s.includes('science') ||
    s.includes('biology') ||
    s.includes('chemistry') ||
    s.includes('physics') ||
    s.includes('environment')
  ) {
    return 'science';
  }
  if (s.includes('pre-tech') || s.includes('computer')) return 'pretech_ict';
  if (s.includes('agric')) return 'agriculture';
  if (s.includes('cre') || s.includes('christian')) return 'cre';
  if (s.includes('ire') || s.includes('islamic')) return 'ire';
  if (s.includes('creative') || s.includes('sport') || s.includes('art')) {
    return 'creative';
  }
  return 'social_humanities';
}

function generateDynamicSyllabusItem(
  subject: string,
  gradeKey: string
): RawQuizItem | null {
  try {
    const gradeArg = gradeKey.startsWith('PP') ? gradeKey : Number(gradeKey) || 7;
    const syl = getSyllabusForGrade(gradeArg, subject);
    const allBlocks = [
      ...(syl.strandsByTerm[1] || []),
      ...(syl.strandsByTerm[2] || []),
      ...(syl.strandsByTerm[3] || []),
    ].filter((b) => b.strand && Array.isArray(b.subs) && b.subs.length > 0);

    if (allBlocks.length < 3) return null;

    const chosenIdx = Math.floor(Math.random() * allBlocks.length);
    const chosen = allBlocks[chosenIdx];
    const correctSub = chosen.subs[Math.floor(Math.random() * chosen.subs.length)];

    const otherSubs: string[] = [];
    for (let i = 0; i < allBlocks.length; i++) {
      if (i === chosenIdx || allBlocks[i].strand === chosen.strand) continue;
      for (const s of allBlocks[i].subs) {
        if (s !== correctSub) otherSubs.push(s);
      }
    }
    if (otherSubs.length < 3) return null;

    // Pick 3 random distractors from other strands
    const shuffledDist = [...otherSubs].sort(() => Math.random() - 0.5).slice(0, 3);
    const packed = shuffleWithAnswer(correctSub, shuffledDist);
    const gLabel = gradeKey.startsWith('PP') ? gradeKey : `Grade ${gradeKey}`;

    return {
      q: `In ${gLabel} ${subject}, which sub-strand belongs under the KICD strand "${chosen.strand}"?`,
      options: packed.options,
      ans: packed.ansIndex,
      exp: `"${correctSub}" is an official KICD sub-strand under "${chosen.strand}" in ${gLabel} ${subject}.`,
    };
  } catch {
    return null;
  }
}

export function generateNextGameQuestion(params: {
  sessionId: string;
  subject: string;
  gradeKey: string;
}): PublicGameQuestion {
  const bankKey = resolveBankKey(params.subject);
  let item: RawQuizItem | null = null;

  if (bankKey === 'math' && Math.random() < 0.78) {
    item = generateDynamicMathItem(params.gradeKey);
  } else if (Math.random() < 0.35) {
    item = generateDynamicSyllabusItem(params.subject, params.gradeKey);
  }

  if (!item) {
    const pool = SUBJECT_BANKS[bankKey] || SUBJECT_BANKS.science;
    item = pool[Math.floor(Math.random() * pool.length)];
  }

  // Shuffle option positions every time so memorising option letters doesn't work
  const correctText = item.options[item.ans];
  const others = item.options.filter((_, idx) => idx !== item.ans);
  const shuffled = shuffleWithAnswer(correctText, others);

  const nonce = `q_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const gradeLabel = params.gradeKey.startsWith('PP')
    ? params.gradeKey
    : `Grade ${params.gradeKey}`;

  const token = signQuestionToken({
    nonce,
    sessionId: params.sessionId,
    correctIndex: shuffled.ansIndex,
    explanation: item.exp,
  });

  return {
    nonce,
    subject: params.subject,
    gradeLabel,
    prompt: item.q,
    options: shuffled.options,
    token,
  };
}
