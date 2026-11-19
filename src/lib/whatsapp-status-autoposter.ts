import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';

const BUCKET_NAME = 'cbc-materials';
const WA_STATUS_LEDGER_PATH = '_system/whatsapp-status-autopost-ledger.json';

export const CONNECTED_WHATSAPP_STATUS_INTL = '254728595160';
export const CONNECTED_WHATSAPP_STATUS_LOCAL = '0728595160';
export const SITE_ORIGIN = 'https://www.cbcmaterials.shop';

export interface WebsiteButtonStatusSpec {
  buttonId: string;
  orderIndex: number;
  buttonLabel: string;
  posterServiceCode: string;
  priceBadge: string;
  clickableUrl: string;
  musicalStoryUrl: string;
  softSongUrl: string;
  headlines: [string, string, string];
  subheadline: string;
  hashtags: string;
}

/**
 * Complete catalog of EVERY button on https://www.cbcmaterials.shop (18 buttons total).
 * Automated hourly cron posts 1 button every hour so EVERY button gets 1 unique ad daily!
 */
export const WEBSITE_BUTTONS_FOR_DAILY_STATUS: WebsiteButtonStatusSpec[] = [
  {
    buttonId: 'btn-book-1',
    orderIndex: 1,
    buttonLabel: '1. CBC GRADE UP (KSh 500)',
    posterServiceCode: 'BOOK_1',
    priceBadge: 'TERM: KSH 500 • ALL TERMS: KSH 600',
    clickableUrl: `${SITE_ORIGIN}/?book=1&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-book-1`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'CBC GRADE UP — Complete Point-Form Short Notes + 165 Questions & Marking Schemes!',
      'Boost Every Subject Score with CBC GRADE UP (PP1 – Grade 12 • Approved Examples)!',
      'Download CBC GRADE UP Instantly via M-Pesa (Term 1, 2, 3 or All Terms Together)!',
    ],
    subheadline:
      '12+ Detailed Points per Sub-strand with Valid Textbook Examples + Full Marking Schemes (.PDF + .DOCX)',
    hashtags: '#CBCGradeUp #CBCKenya #KPSEA2026 #KJSEA2026',
  },
  {
    buttonId: 'btn-book-2',
    orderIndex: 2,
    buttonLabel: '2. SUPER-LIGHT CBC COMPILATION (KSh 750)',
    posterServiceCode: 'BOOK_2',
    priceBadge: 'TERM: KSH 750 • ALL TERMS: KSH 900',
    clickableUrl: `${SITE_ORIGIN}/?book=2&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-book-2`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'SUPER-LIGHT CBC COMPILATION — Point-Form Notes + Topical Questions Right After Each Sub-strand!',
      'Revise Smarter: Every Sub-strand Explained in Point Form + Immediate Practice Questions!',
      'Get SUPER-LIGHT CBC COMPILATION (PP1 – Grade 12) in PDF & Editable Word!',
    ],
    subheadline:
      'Complete Syllabus Scope in Enjoyable Point Form + Valid Approved Examples + Answers at the Back!',
    hashtags: '#SuperLightCBC #CBCNotes #KJSEA #KPSEA',
  },
  {
    buttonId: 'btn-book-3',
    orderIndex: 3,
    buttonLabel: '3. SMART CBC ALL SUBJECTS (KSh 1,500)',
    posterServiceCode: 'BOOK_3',
    priceBadge: 'TERM: KSH 1,500 • ALL TERMS: KSH 1,800',
    clickableUrl: `${SITE_ORIGIN}/?book=3&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-book-3`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'SMART CBC ALL SUBJECTS — 100-Page Master Book Unlocking Every Subject in Your Grade!',
      'Best Value Pack: Combines SUPER-LIGHT CBC + CBC GRADE UP Across All Subjects!',
      'One M-Pesa Tap Unlocks All Subjects in Your Grade (300+ Zero-Repeat Qs & Notes)!',
    ],
    subheadline:
      'Zero-Overlap Detailed Notes, Approved Examples, 300+ Questions & Marking Schemes for the Whole Grade!',
    hashtags: '#SmartCBC #AllSubjectsPack #CBCKenya #ParentsKenya',
  },
  {
    buttonId: 'btn-national-kjsea',
    orderIndex: 4,
    buttonLabel: 'NATIONAL KJSEA EXAMINATION (ALL GRADES)',
    posterServiceCode: 'KJSEA_NATIONAL',
    priceBadge: 'EXAM: KSH 50 • MARKING SCHEME: KSH 50',
    clickableUrl: `${SITE_ORIGIN}/?area=kjsea&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-national-kjsea`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'KENYA NATIONAL KJSEA TEST (All Grades PP1–G12) — 20 Zero-Repeat Questions • 2 Hours!',
      'Authentic KNEC-Format Cover Page, Instructions & Crest Seal — Exam KSh 50 | Marking Scheme KSh 50!',
      'Test Every Syllabus Strand Today: KENYA NATIONAL KJSEA TEST + Separate Official Marking Schemes!',
    ],
    subheadline:
      'Covers All 210 Subjects (Pure Kiswahili Sanifu for Kiswahili) • Printable PDF + Editable DOCX!',
    hashtags: '#KenyaNationalKJSEATest #KJSEA2026 #KNECFormat #CBCExams',
  },
  {
    buttonId: 'btn-all-materials',
    orderIndex: 5,
    buttonLabel: 'ALL CURRICULUM MATERIALS (6,534+ FILES)',
    posterServiceCode: 'ALL_MATERIALS',
    priceBadge: '6,534+ FILES • FROM KSH 50',
    clickableUrl: `${SITE_ORIGIN}/?area=all&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-all-materials`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Explore All 6,534+ Rationalized 2026 CBC Materials (PP1, PP2 & Grades 1–12)!',
      'Instant 1-Second M-Pesa Auto-Download: Editable MS Word (.DOCX) + Print-Ready (.PDF)!',
      'Everything Teachers, Parents & Learners Need in One Official CBC Kenya Hub!',
    ],
    subheadline:
      'Schemes of Work, Lesson Plans, Notes, Records of Work, National Tests & Revision Books!',
    hashtags: '#CBCMaterials #TSCTeachers #KenyaEducation #CBC2026',
  },
  {
    buttonId: 'btn-ask-gemini',
    orderIndex: 6,
    buttonLabel: 'ASK GEMINI (Q&A HOMEWORK HUB)',
    posterServiceCode: 'GEMINI',
    priceBadge: 'ONLY KSH 20 WEEKLY PASS',
    clickableUrl: `${SITE_ORIGIN}/?hub=gemini&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-ask-gemini`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Stuck on Any CBC Homework Question? Ask Gemini AI for Step-by-Step Worked Solutions!',
      '7-Day Unlimited Homework & Revision Q&A Pass for Only KSh 20 Bob!',
      'Instant Worked Answers for Maths, Sciences, Languages & All CBC Subjects (PP1–G12)!',
    ],
    subheadline:
      'Clear Explanations Aligned to KICD Approved Textbooks • Preview Half Free Instantly!',
    hashtags: '#AskGemini #HomeworkHelpKenya #CBCRevision #StudentsKenya',
  },
  {
    buttonId: 'btn-side-hustles',
    orderIndex: 7,
    buttonLabel: 'HOLIDAY SIDE HUSTLES',
    posterServiceCode: 'SIDE_HUSTLES',
    priceBadge: 'VERIFIED REMOTE AI & SURVEY JOBS',
    clickableUrl: `${SITE_ORIGIN}/?hub=hustles&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-side-hustles`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Holiday Side Hustles for Teachers & Youth: Verified AI Training Jobs & Paid Surveys!',
      'Earn Extra Income Online This Term & Holiday — Direct Application Links Inside!',
      'Explore Global AI Tutoring, Academic Rating & Verified Survey Platforms from Kenya!',
    ],
    subheadline:
      'Curated Remote Opportunities for Kenyan Educators, Graduates & Freelancers!',
    hashtags: '#HolidaySideHustles #OnlineJobsKenya #TeachersHustle #RemoteWorkKE',
  },
  {
    buttonId: 'btn-tsc-services',
    orderIndex: 8,
    buttonLabel: 'ALL TSC SERVICES',
    posterServiceCode: 'TSC_SERVICES',
    priceBadge: 'TPAD • T-PAY • WEALTH • TRANSFERS',
    clickableUrl: `${SITE_ORIGIN}/?hub=tsc&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-tsc-services`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'All Teachers Service Commission (TSC) Portals & Quick Guides in One Button!',
      'Fast Access to TPAD 2, T-Pay Payslips, Wealth Declaration, Promotions & Transfers!',
      'Save Time Every Term: Direct TSC Teacher Services & Compliance Checklist!',
    ],
    subheadline:
      'Built Specifically for Kenyan TSC & BOM Teachers Across Primary, JSS & Senior School!',
    hashtags: '#TSCServices #TPAD2 #KenyanTeachers #TSCPayslips',
  },
  {
    buttonId: 'btn-gaming-all',
    orderIndex: 9,
    buttonLabel: 'GAMING (ALL SUBJECTS)',
    posterServiceCode: 'GAMING',
    priceBadge: 'KSH 10 TO PLAY • EARN CASH REWARDS',
    clickableUrl: `${SITE_ORIGIN}/?hub=gaming&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-gaming-all`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Play All-Subjects CBC Quiz Games (PP1 – Grade 12) & Redeem Real M-Pesa Rewards!',
      '1 Correct Answer = 1 Point • 1,000 Points = KSh 5 Cash Payout • Only KSh 10 Pass!',
      'Turn Screen Time into Top Grades: Zero-Repeat Curriculum Gaming Across Every Subject!',
    ],
    subheadline:
      'Fun, Timed Competency Quizzes Covering Every Strand from Pre-Primary to Grade 12!',
    hashtags: '#CBCGaming #PlayAndLearnKE #KenyanLearners #KJSEAQuiz',
  },
  {
    buttonId: 'btn-counselling',
    orderIndex: 10,
    buttonLabel: 'GUIDANCE & COUNSELLING',
    posterServiceCode: 'COUNSELLING',
    priceBadge: 'PARENT & LEARNER SUPPORT HUB',
    clickableUrl: `${SITE_ORIGIN}/?hub=counselling&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-counselling`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Confidential AI Guidance & Counselling for Both Parents and Learners!',
      'Support Study Habits, Exam Confidence, Career Pathways & Emotional Wellbeing!',
      'Dedicated Parent & Student Mentorship Space on CBC Kenya Resource Hub!',
    ],
    subheadline:
      'Warm, Constructive Guidance Tailored to Kenyan Learners & Families (PP1 – Grade 12)!',
    hashtags: '#GuidanceAndCounselling #ParentingKenya #StudentWellbeing #CBCPathways',
  },
  {
    buttonId: 'btn-holiday-tuition',
    orderIndex: 11,
    buttonLabel: 'PERSONAL & HOLIDAY TUITION',
    posterServiceCode: 'TUITION',
    priceBadge: 'LEARNER KSH 1,000 • TEACHER KSH 500',
    clickableUrl: `${SITE_ORIGIN}/#holiday-tuition-hub`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-holiday-tuition`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Book a Verified Home or Online CBC Tuition Teacher Across All 47 Counties!',
      'Parents: Get Matched with Top Teachers • Teachers: Register (KSh 500) for Tuition Clients!',
      'Personalized One-on-One Holiday & Weekend Coaching for PP1 to Grade 12!',
    ],
    subheadline:
      'Instant Subject & County Matching Coordinated Safely via Our Tuition Desk!',
    hashtags: '#HolidayTuitionKE #HomeTuitionKenya #CBCTutors #NairobiMoms',
  },
  {
    buttonId: 'btn-schemes',
    orderIndex: 12,
    buttonLabel: 'SCHEMES OF WORK (KSh 50)',
    posterServiceCode: 'SCHEMES',
    priceBadge: 'DOCX + PDF • ONLY KSH 50',
    clickableUrl: `${SITE_ORIGIN}/?area=schemes&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-schemes`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      '2026 KICD Rationalized Schemes of Work (PP1 – Grade 12) — Only KSh 50!',
      '10-Column Editable Word (.DOCX) + Print PDF Schemes Synced to Approved Textbooks!',
      'Term 1, Term 2 & Term 3 Schemes Ready to Customize with Your School Header!',
    ],
    subheadline:
      'Aligned 1-for-1 with KICD Orange Book Page Numbers, Strands, Sub-strands & Lessons!',
    hashtags: '#SchemesOfWork #KICD2026 #TSCTeachers #CBCMaterials',
  },
  {
    buttonId: 'btn-lesson-plans',
    orderIndex: 13,
    buttonLabel: 'CBC LESSON PLANS (KSh 70)',
    posterServiceCode: 'LESSON_PLANS',
    priceBadge: 'DOCX + PDF • ONLY KSH 70',
    clickableUrl: `${SITE_ORIGIN}/?area=lesson-plans&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-lesson-plans`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Ready-to-Teach Lesson-by-Lesson CBC Lesson Plans (PP1 – Grade 12) — KSh 70!',
      'Synced 1:1 with Your Term Scheme of Work & Approved Coursebook Pages!',
      'Download Complete Term Lesson Plans in Editable Word (.DOCX) + Print PDF!',
    ],
    subheadline:
      'Includes Exact Lesson Steps, Key Inquiry Questions, Core Competencies & Reflections!',
    hashtags: '#CBCLessonPlans #ReadyToTeach #KenyaTeachers #TPADReady',
  },
  {
    buttonId: 'btn-notes',
    orderIndex: 14,
    buttonLabel: "TEACHERS' & LESSON NOTES (KSh 100)",
    posterServiceCode: 'NOTES',
    priceBadge: 'DOCX + PDF • ONLY KSH 100',
    clickableUrl: `${SITE_ORIGIN}/?area=notes&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-notes`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      "Comprehensive CBC Teachers' & Lesson Notes (PP1 – Grade 12) — Only KSh 100!",
      'Detailed Chalkboard Notes, Worked Examples & Learner Activities for Every Sub-strand!',
      'Save Hours of Lesson Prep with Editable Word (.DOCX) & PDF Subject Notes!',
    ],
    subheadline:
      'Synthesized from KICD Approved Textbooks Across All Primary, JSS & Senior School Subjects!',
    hashtags: '#LessonNotesKE #CBCTeachers #JSSNotes #SeniorSchoolKE',
  },
  {
    buttonId: 'btn-records',
    orderIndex: 15,
    buttonLabel: 'RECORDS OF WORK & RUBRICS (KSh 50)',
    posterServiceCode: 'RECORDS',
    priceBadge: 'DOCX + PDF • ONLY KSH 50',
    clickableUrl: `${SITE_ORIGIN}/?area=records&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-records`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Official TSC & KICD Records of Work Covered + EE/ME/AE/BE Rubric Trackers (KSh 50)!',
      'Pre-Mapped Lesson-by-Lesson Trackers Ready for TPAD Appraisal & HOD Sign-Off!',
      'Editable Word (.DOCX) + Print PDF Records of Work for PP1 through Grade 12!',
    ],
    subheadline:
      'Matches Your Scheme of Work Week-by-Week with Built-In CBC Assessment Rubric Columns!',
    hashtags: '#RecordsOfWork #TPADCompliance #CBCRubrics #TeachersKE',
  },
  {
    buttonId: 'btn-exams',
    orderIndex: 16,
    buttonLabel: 'EXAMS, KPSEA & KJSEA TRIALS (KSh 100)',
    posterServiceCode: 'EXAMS',
    priceBadge: 'WITH MARKING SCHEMES • KSH 100',
    clickableUrl: `${SITE_ORIGIN}/?area=exams&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-exams`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Opener, Mid-Term & End-Term Exams + KPSEA, KEYA & KJSEA Trial Sets (KSh 100)!',
      'Complete Assessment Papers + Step-by-Step Marking Schemes in Word & PDF!',
      'Prepare Candidates Confidently Across PP1, Primary, JSS & Senior School!',
    ],
    subheadline:
      'Editable MS Word (.DOCX) to Insert Your School Name + Print-Ready PDF & Marking Guides!',
    hashtags: '#KPSEATrials #KJSEATrials #TermExamsKE #CBCAssessments',
  },
  {
    buttonId: 'btn-holidays',
    orderIndex: 17,
    buttonLabel: 'HOLIDAY PACKS & CURRICULUM DESIGNS (KSh 70)',
    posterServiceCode: 'HOLIDAYS',
    priceBadge: 'DOCX + PDF • ONLY KSH 70',
    clickableUrl: `${SITE_ORIGIN}/?area=holidays&autoplay_song=1`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-holidays`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'April, August & December Holiday Revision Workbooks + Full-Year KICD Designs (KSh 70)!',
      'Keep Learners Engaged at Home with Structured Holiday Assignments & Projects!',
      'Includes Full-Year (Terms 1, 2 & 3) Rationalized Curriculum Matrices in DOCX + PDF!',
    ],
    subheadline:
      'Complete with Parent Sign-Off Trackers & Practical Home Competency Tasks (PP1–G12)!',
    hashtags: '#HolidayAssignmentsKE #KICDDesigns #CBCWorkbooks #KenyaSchools',
  },
  {
    buttonId: 'btn-advertise',
    orderIndex: 18,
    buttonLabel: 'ADVERTISE ON CBC KENYA HUB',
    posterServiceCode: 'ADVERTISE',
    priceBadge: 'REACH THOUSANDS OF TEACHERS & PARENTS',
    clickableUrl: `${SITE_ORIGIN}/advertise`,
    musicalStoryUrl: `${SITE_ORIGIN}/status-ad/btn-advertise`,
    softSongUrl: `${SITE_ORIGIN}/audio/whatsapp-status-soft-song.mp3`,
    headlines: [
      'Promote Your School, Bookshop, EdTech App or Tutoring Business on CBCMaterials.shop!',
      'Reach Thousands of Kenyan Teachers, Parents & Students Visiting Daily!',
      'Book Featured Banner Placement on CBC Kenya Resource Hub Today!',
    ],
    subheadline:
      'High-Visibility Sponsored Placements Across All PP1–Grade 12 Subject & Exam Pages!',
    hashtags: '#AdvertiseKenya #KenyaSchools #EdTechKenya #BusinessKenya',
  },
];

export interface WhatsAppStatusGeneratedAd {
  buttonId: string;
  orderIndex: number;
  buttonLabel: string;
  dateEat: string;
  hourEat: number;
  headline: string;
  subheadline: string;
  priceBadge: string;
  posterImageUrl: string;
  posterCardUrl: string;
  clickableUrl: string;
  musicalStoryUrl: string;
  softSongUrl: string;
  statusCaption: string;
}

export interface WhatsAppStatusHistoryEntry {
  id: string;
  postedAtIso: string;
  dateEat: string;
  hourEat: number;
  buttonId: string;
  buttonLabel: string;
  clickableUrl: string;
  posterImageUrl: string;
  softSongUrl: string;
  deliveryChannels: string[];
  deliveredToStatusApi: boolean;
}

export interface WhatsAppStatusAutopostLedger {
  enabled: boolean;
  whatsappNumberIntl: string; // 254728595160
  whatsappNumberLocal: string; // 0728595160
  intervalMinutes: number; // 60 (every 1 hour)
  // Optional Cloud Linked-Device Status API credentials for 100% unattended status@broadcast
  whapiApiToken?: string;
  greenApiUrl?: string;
  greenApiInstanceId?: string;
  greenApiToken?: string;
  evolutionApiUrl?: string;
  evolutionApiInstance?: string;
  evolutionApiKey?: string;
  customStatusWebhookUrl?: string;
  // Tracks which buttonIds have already been posted on each YYYY-MM-DD (EAT)
  postedByDateEat: Record<string, string[]>;
  // Queue of pending status posts for local Baileys Linked-Device daemon (`0728595160`)
  pendingDaemonQueue: WhatsAppStatusGeneratedAd[];
  history: WhatsAppStatusHistoryEntry[];
  updatedAt: string;
}

export function getEatDateAndHour(now = new Date()): {
  dateEat: string;
  hourEat: number;
  daySeed: number;
} {
  // Africa/Nairobi is UTC+3 year-round
  const eatMs = now.getTime() + 3 * 60 * 60 * 1000;
  const eat = new Date(eatMs);
  const yyyy = eat.getUTCFullYear();
  const mm = String(eat.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(eat.getUTCDate()).padStart(2, '0');
  const dateEat = `${yyyy}-${mm}-${dd}`;
  const hourEat = eat.getUTCHours();
  const daySeed = yyyy * 372 + (eat.getUTCMonth() + 1) * 31 + eat.getUTCDate();
  return { dateEat, hourEat, daySeed };
}

export function buildDailyButtonStatusAd(
  spec: WebsiteButtonStatusSpec,
  now = new Date()
): WhatsAppStatusGeneratedAd {
  const { dateEat, hourEat, daySeed } = getEatDateAndHour(now);
  const headline = spec.headlines[(daySeed + spec.orderIndex) % spec.headlines.length];

  const posterQuery = `service=${encodeURIComponent(
    spec.posterServiceCode
  )}&day=${encodeURIComponent(dateEat)}`;
  const posterImageUrl = `${SITE_ORIGIN}/api/social/poster-image?${posterQuery}&format=vertical`;
  const posterCardUrl = `${SITE_ORIGIN}/api/social/poster-image?${posterQuery}&format=card`;

  const statusCaption =
    `✨ *${spec.buttonLabel}*\n` +
    `${headline}\n\n` +
    `✅ ${spec.subheadline}\n` +
    `💳 *${spec.priceBadge}*\n\n` +
    `👉 *Tap Clickable Link to Open Now:*\n${spec.clickableUrl}\n\n` +
    `🎵 *Listen with Soft Song Card:*\n${spec.musicalStoryUrl}\n\n` +
    `📲 WhatsApp / M-Pesa: ${CONNECTED_WHATSAPP_STATUS_LOCAL}\n` +
    `${spec.hashtags}`;

  return {
    buttonId: spec.buttonId,
    orderIndex: spec.orderIndex,
    buttonLabel: spec.buttonLabel,
    dateEat,
    hourEat,
    headline,
    subheadline: spec.subheadline,
    priceBadge: spec.priceBadge,
    posterImageUrl,
    posterCardUrl,
    clickableUrl: spec.clickableUrl,
    musicalStoryUrl: spec.musicalStoryUrl,
    softSongUrl: spec.softSongUrl,
    statusCaption,
  };
}

export async function getWhatsAppStatusLedger(): Promise<WhatsAppStatusAutopostLedger> {
  const defaults: WhatsAppStatusAutopostLedger = {
    enabled: true,
    whatsappNumberIntl: CONNECTED_WHATSAPP_STATUS_INTL,
    whatsappNumberLocal: CONNECTED_WHATSAPP_STATUS_LOCAL,
    intervalMinutes: 60,
    whapiApiToken: (process.env.WHAPI_API_TOKEN || '').trim(),
    greenApiUrl: (process.env.GREEN_API_URL || 'https://api.green-api.com').trim(),
    greenApiInstanceId: (process.env.GREEN_API_INSTANCE_ID || '').trim(),
    greenApiToken: (process.env.GREEN_API_TOKEN || '').trim(),
    evolutionApiUrl: (process.env.EVOLUTION_API_URL || '').trim(),
    evolutionApiInstance: (process.env.EVOLUTION_API_INSTANCE || '').trim(),
    evolutionApiKey: (process.env.EVOLUTION_API_KEY || '').trim(),
    customStatusWebhookUrl: (process.env.WHATSAPP_STATUS_WEBHOOK_URL || '').trim(),
    postedByDateEat: {},
    pendingDaemonQueue: [],
    history: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(WA_STATUS_LEDGER_PATH);
    if (error || !data) return defaults;
    const parsed = JSON.parse(await data.text()) as Partial<WhatsAppStatusAutopostLedger>;
    return {
      ...defaults,
      ...parsed,
      whatsappNumberIntl: CONNECTED_WHATSAPP_STATUS_INTL,
      whatsappNumberLocal: CONNECTED_WHATSAPP_STATUS_LOCAL,
      whapiApiToken: parsed.whapiApiToken?.trim() || defaults.whapiApiToken,
      greenApiInstanceId:
        parsed.greenApiInstanceId?.trim() || defaults.greenApiInstanceId,
      greenApiToken: parsed.greenApiToken?.trim() || defaults.greenApiToken,
      evolutionApiUrl: parsed.evolutionApiUrl?.trim() || defaults.evolutionApiUrl,
      evolutionApiInstance:
        parsed.evolutionApiInstance?.trim() || defaults.evolutionApiInstance,
      evolutionApiKey: parsed.evolutionApiKey?.trim() || defaults.evolutionApiKey,
      customStatusWebhookUrl:
        parsed.customStatusWebhookUrl?.trim() || defaults.customStatusWebhookUrl,
      postedByDateEat: parsed.postedByDateEat || {},
      pendingDaemonQueue: Array.isArray(parsed.pendingDaemonQueue)
        ? parsed.pendingDaemonQueue.slice(0, 24)
        : [],
      history: Array.isArray(parsed.history) ? parsed.history.slice(0, 40) : [],
    };
  } catch {
    return defaults;
  }
}

export async function saveWhatsAppStatusLedger(
  ledger: WhatsAppStatusAutopostLedger
): Promise<WhatsAppStatusAutopostLedger> {
  // Keep only last 7 days in postedByDateEat so JSON stays tiny
  const dates = Object.keys(ledger.postedByDateEat || {}).sort().slice(-7);
  const trimmedPosted: Record<string, string[]> = {};
  for (const d of dates) {
    trimmedPosted[d] = ledger.postedByDateEat[d];
  }

  const next: WhatsAppStatusAutopostLedger = {
    ...ledger,
    whatsappNumberIntl: CONNECTED_WHATSAPP_STATUS_INTL,
    whatsappNumberLocal: CONNECTED_WHATSAPP_STATUS_LOCAL,
    postedByDateEat: trimmedPosted,
    pendingDaemonQueue: (ledger.pendingDaemonQueue || []).slice(0, 24),
    history: (ledger.history || []).slice(0, 40),
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(WA_STATUS_LEDGER_PATH, Buffer.from(JSON.stringify(next, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  return next;
}

/**
 * Publishes an auto-generated Website Button Status Ad (HD Image + Clickable Link + Soft Song)
 * directly to WhatsApp Status (`status@broadcast` on 0728595160) across all configured bridges.
 */
async function dispatchAdToWhatsAppStatus(
  ad: WhatsAppStatusGeneratedAd,
  ledger: WhatsAppStatusAutopostLedger
): Promise<{ deliveredToStatusApi: boolean; channels: string[] }> {
  const channels: string[] = [];
  let deliveredToStatusApi = false;

  // 1. Whapi.Cloud Direct WhatsApp Stories API (0728595160 Linked Device -> status@broadcast)
  const whapiToken = (ledger.whapiApiToken || process.env.WHAPI_API_TOKEN || '').trim();
  if (whapiToken) {
    try {
      const storyRes = await fetch('https://gate.whapi.cloud/stories/media', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whapiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          media: ad.posterImageUrl,
          caption: ad.statusCaption,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (storyRes.ok) {
        deliveredToStatusApi = true;
        channels.push('Whapi.Cloud Status Image+Link (0728595160)');
        // Also post companion soft-song audio story clip so viewers hear the soft song on Status
        await fetch('https://gate.whapi.cloud/stories/audio', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${whapiToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            media: ad.softSongUrl,
            background_color: '#064E3B',
          }),
          signal: AbortSignal.timeout(10000),
        }).catch(() => {});
      }
    } catch {}
  }

  // 2. Green-API Direct status@broadcast
  if (ledger.greenApiInstanceId && ledger.greenApiToken) {
    try {
      const base = (ledger.greenApiUrl || 'https://api.green-api.com').replace(/\/$/, '');
      const gaUrl = `${base}/waInstance${encodeURIComponent(
        ledger.greenApiInstanceId
      )}/sendFileByUrl/${encodeURIComponent(ledger.greenApiToken)}`;
      const gaRes = await fetch(gaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId: 'status@broadcast',
          urlFile: ad.posterImageUrl,
          fileName: `${ad.buttonId}-${ad.dateEat}.png`,
          caption: ad.statusCaption,
        }),
        signal: AbortSignal.timeout(12000),
      });
      if (gaRes.ok) {
        deliveredToStatusApi = true;
        channels.push('Green-API status@broadcast (0728595160)');
      }
    } catch {}
  }

  // 3. Evolution API Direct sendStatus
  if (ledger.evolutionApiUrl && ledger.evolutionApiInstance && ledger.evolutionApiKey) {
    try {
      const evoBase = ledger.evolutionApiUrl.replace(/\/$/, '');
      const evoRes = await fetch(
        `${evoBase}/message/sendStatus/${encodeURIComponent(ledger.evolutionApiInstance)}`,
        {
          method: 'POST',
          headers: {
            apikey: ledger.evolutionApiKey,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            type: 'image',
            content: ad.posterImageUrl,
            caption: ad.statusCaption,
            allContacts: true,
          }),
          signal: AbortSignal.timeout(12000),
        }
      );
      if (evoRes.ok) {
        deliveredToStatusApi = true;
        channels.push('Evolution API Status (0728595160)');
      }
    } catch {}
  }

  // 4. Custom Automation Webhook (Make / Zapier / n8n / Wassenger)
  if (ledger.customStatusWebhookUrl) {
    try {
      const whRes = await fetch(ledger.customStatusWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetWhatsApp: CONNECTED_WHATSAPP_STATUS_INTL,
          targetWhatsAppLocal: CONNECTED_WHATSAPP_STATUS_LOCAL,
          chatId: 'status@broadcast',
          ...ad,
        }),
        signal: AbortSignal.timeout(10000),
      });
      if (whRes.ok) {
        deliveredToStatusApi = true;
        channels.push('Status Webhook Bridge');
      }
    } catch {}
  }

  // 5. Enqueue for the Local / VPS Linked-Device Baileys Daemon (scripts/whatsapp-0728595160-status-daemon.mjs)
  channels.push('Linked-Device Status Queue (0728595160)');

  // 6. Send WhatsApp Admin Notification with clickable preview
  await sendWhatsAppAdminNotification(
    `🟢 *HOURLY WHATSAPP STATUS AD (${ad.orderIndex}/${WEBSITE_BUTTONS_FOR_DAILY_STATUS.length} TODAY)*\n` +
      `• *Account:* ${CONNECTED_WHATSAPP_STATUS_LOCAL}\n` +
      `• *Button:* ${ad.buttonLabel}\n` +
      `• *Link:* ${ad.clickableUrl}\n` +
      `• *Musical Card:* ${ad.musicalStoryUrl}`
  ).catch(() => {});

  return { deliveredToStatusApi, channels };
}

/**
 * Executes the hourly WhatsApp Status rotation:
 * - Picks the next Website Button that has NOT yet had its daily ad posted today (EAT).
 * - Guarantees EVERY button gets 1 unique ad daily (1 per hour) with zero duplicate buttons on the same day!
 */
export async function runHourlyWhatsAppStatusAutopost(options?: {
  forceButtonId?: string;
}): Promise<{
  posted: boolean;
  reason?: string;
  ad?: WhatsAppStatusGeneratedAd;
  postedTodayCount: number;
  totalButtons: number;
  deliveredToStatusApi?: boolean;
  channels?: string[];
  ledger: WhatsAppStatusAutopostLedger;
}> {
  const ledger = await getWhatsAppStatusLedger();
  const now = new Date();
  const { dateEat, hourEat } = getEatDateAndHour(now);
  const postedToday = new Set(ledger.postedByDateEat[dateEat] || []);

  if (!ledger.enabled && !options?.forceButtonId) {
    return {
      posted: false,
      reason: 'WhatsApp Status hourly automation is paused.',
      postedTodayCount: postedToday.size,
      totalButtons: WEBSITE_BUTTONS_FOR_DAILY_STATUS.length,
      ledger,
    };
  }

  let chosenSpec: WebsiteButtonStatusSpec | undefined;
  if (options?.forceButtonId) {
    chosenSpec = WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
      (b) => b.buttonId === options.forceButtonId
    );
  } else {
    chosenSpec = WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
      (b) => !postedToday.has(b.buttonId)
    );
  }

  if (!chosenSpec) {
    return {
      posted: false,
      reason: `All ${WEBSITE_BUTTONS_FOR_DAILY_STATUS.length} website buttons have already had their 1 daily Status ad posted today (${dateEat}). Next cycle starts automatically tomorrow!`,
      postedTodayCount: postedToday.size,
      totalButtons: WEBSITE_BUTTONS_FOR_DAILY_STATUS.length,
      ledger,
    };
  }

  const ad = buildDailyButtonStatusAd(chosenSpec, now);
  const { deliveredToStatusApi, channels } = await dispatchAdToWhatsAppStatus(
    ad,
    ledger
  );

  postedToday.add(chosenSpec.buttonId);
  ledger.postedByDateEat[dateEat] = Array.from(postedToday);
  ledger.pendingDaemonQueue = [
    ad,
    ...ledger.pendingDaemonQueue.filter((q) => q.buttonId !== ad.buttonId),
  ].slice(0, 24);

  ledger.history.unshift({
    id: `wastatus_${Date.now()}`,
    postedAtIso: now.toISOString(),
    dateEat,
    hourEat,
    buttonId: ad.buttonId,
    buttonLabel: ad.buttonLabel,
    clickableUrl: ad.clickableUrl,
    posterImageUrl: ad.posterImageUrl,
    softSongUrl: ad.softSongUrl,
    deliveryChannels: channels,
    deliveredToStatusApi,
  });

  const saved = await saveWhatsAppStatusLedger(ledger);

  return {
    posted: true,
    ad,
    postedTodayCount: postedToday.size,
    totalButtons: WEBSITE_BUTTONS_FOR_DAILY_STATUS.length,
    deliveredToStatusApi,
    channels,
    ledger: saved,
  };
}
