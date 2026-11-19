export interface SeoTopicPillar {
  slug: string;
  navLabel: string;
  h1Title: string;
  metaTitle: string;
  metaDescription: string;
  badgeText: string;
  ctaHref: string;
  ctaLabel: string;
  dbCategoryFilter?: string;
  dbSearchKeyword?: string;
  keywords: string[];
  introParagraphs: string[];
  highlights: string[];
  faqs: Array<{ q: string; a: string }>;
}

export const SEO_TOPIC_PILLARS: SeoTopicPillar[] = [
  {
    slug: 'cbc',
    navLabel: 'CBC Kenya Portal (PP1–G12)',
    h1Title:
      'CBC Kenya (2026) — Competency-Based Curriculum Schemes, Notes, KNEC Exams & Revision Books (PP1 to Grade 12)',
    metaTitle:
      'CBC Kenya 2026 | Complete PP1–Grade 12 Schemes of Work, Notes, Exams & Books',
    metaDescription:
      'Number #1 CBC Kenya resource portal (cbcmaterials.shop). Download 6,534+ KICD-rationalized CBC Schemes of Work, Teachers Notes, Lesson Plans, Records of Work, KNEC KPSEA/KJSEA Examinations, TSC tools & Tuition Tutors (PP1–Grade 12).',
    badgeText: 'OFFICIAL KENYA CBC CURRICULUM HUB • PP1 – GRADE 12',
    ctaHref: '/?area=all',
    ctaLabel: 'Browse All 6,534+ CBC Materials Now →',
    keywords: [
      'CBC',
      'CBC Kenya',
      'Competency Based Curriculum Kenya 2026',
      'KICD rationalized CBC syllabus',
      'CBC materials PP1 to Grade 12',
      'Junior School CBC notes and exams',
      'Senior School CBE pathways Kenya',
      'cbcmaterials.shop',
    ],
    introParagraphs: [
      'Welcome to CBC Kenya Resource Hub (cbcmaterials.shop), Kenya’s comprehensive Competency-Based Curriculum (CBC) digital library serving Pre-Primary (PP1 & PP2), Lower Primary (Grades 1–3), Upper Primary (Grades 4–6), Junior School (Grades 7–9), and Senior School Competency-Based Education (Grades 10–12).',
      'Every teaching and revision document is aligned with the rationalized Kenya Institute of Curriculum Development (KICD) designs and approved Orange Book textbooks, delivered instantly in both Editable Microsoft Word (.DOCX) and Print-Ready (.PDF) formats via M-Pesa.',
    ],
    highlights: [
      '6,534+ Verified Files across all 210 Grade-Subject pairs from PP1 to Grade 12',
      'Term 1, Term 2, Term 3 & Full-Year KICD Rationalized Schemes, Lesson Plans & Notes',
      '420 National KJSEA Examinations & Separate Official Marking Schemes (KSh 50 each)',
      '50-Page & 100-Page Point-Form Short Notes + Topical Questions Books with Approved Examples',
    ],
    faqs: [
      {
        q: 'What levels of the Competency-Based Curriculum (CBC) are covered on cbcmaterials.shop?',
        a: 'We cover every single level of Kenya’s 2-6-3-3-3 CBC structure: Pre-Primary (PP1 and PP2), Lower Primary (Grades 1, 2, and 3 KEYA), Upper Primary (Grades 4, 5, and 6 KPSEA), Junior School (Grades 7, 8, and 9 KJSEA), and Senior School Pathways (Grades 10, 11, and 12 STEM, Social Sciences, and Arts & Sports Science).',
      },
      {
        q: 'Are all CBC materials editable so teachers can add their school name?',
        a: 'Yes. Every purchase unlocks both an Editable Microsoft Word (.DOCX) file—allowing teachers to customize school headers, dates, and teacher names—and a Print-Ready (.PDF) version.',
      },
    ],
  },
  {
    slug: 'cbcmaterials',
    navLabel: 'CBCMaterials Official Hub',
    h1Title:
      'CBCMaterials (cbcmaterials.shop) — Official Kenya CBC Materials, Books, Exams, TSC & Tuition Platform',
    metaTitle:
      'CBCMaterials (cbcmaterials.shop) | Official Kenya CBC Teaching & Revision Materials',
    metaDescription:
      'Visit CBCMaterials (www.cbcmaterials.shop) for instant 1-second M-Pesa downloads of 6,534+ CBC Schemes of Work, Teachers Notes, Lesson Plans, National KJSEA Tests, TSC Services, AI Homework Help & Verified Tuition Tutors.',
    badgeText: 'WWW.CBCMATERIALS.SHOP • INSTANT 1-SECOND M-PESA UNLOCK',
    ctaHref: '/',
    ctaLabel: 'Open CBCMaterials Main Catalog →',
    keywords: [
      'CBCMATERIALS',
      'cbcmaterials',
      'cbcmaterials.shop',
      'www.cbcmaterials.shop',
      'CBC Materials Kenya download',
      'CBC Materials PDF and Word',
      'Kenya CBC online shop',
    ],
    introParagraphs: [
      'CBCMaterials (www.cbcmaterials.shop) is built for Kenyan teachers, school heads, parents, and learners who want reliable, KICD-aligned teaching and revision resources that open automatically within 1 second of M-Pesa payment.',
      'Beyond downloadable DOCX and PDF documents, CBCMaterials integrates the National KJSEA Examination (All Grades) hub, 50-page & 100-page revision books, Ask Gemini step-by-step homework Q&A, All-Subjects Educational Gaming, All TSC Services, and Nationwide Tuition Tutor matching.',
    ],
    highlights: [
      'Automatic M-Pesa Express STK Push (works seamlessly with standard M-Pesa & Fuliza)',
      'Dual Format Guarantee: Editable Word (.DOCX) + Print-Ready (.PDF) on every item',
      'Dedicated Teacher, Parent & Student hubs in one fast mobile-friendly platform',
      'Direct WhatsApp customer support and instant re-download access',
    ],
    faqs: [
      {
        q: 'How do I download materials on CBCMaterials (cbcmaterials.shop)?',
        a: 'Click Preview or Buy Now on any scheme, note, book, or exam paper, enter your Safaricom M-Pesa number on the STK prompt, input your PIN, and your DOCX + PDF files unlock and download automatically.',
      },
      {
        q: 'Can I pay on CBCMaterials using Fuliza M-Pesa?',
        a: 'Yes. Our live M-Pesa Express checkout supports standard M-Pesa wallet balances as well as active Safaricom Fuliza overdraft limits.',
      },
    ],
  },
  {
    slug: 'schemes-of-work',
    navLabel: '2026 Schemes of Work',
    h1Title:
      '2026 CBC Schemes of Work Kenya (PP1–Grade 12) — KICD Rationalized Term 1, Term 2 & Term 3 (Editable Word & PDF)',
    metaTitle:
      '2026 CBC Schemes of Work Kenya (PP1–Grade 12) | Editable Word DOCX & PDF (KSh 50)',
    metaDescription:
      'Download 2026 KICD Rationalized CBC Schemes of Work for PP1, PP2, Grades 1–6 Primary, Grades 7–9 Junior School (JSS) & Grades 10–12 Senior School across Term 1, Term 2 & Term 3 in Editable Word (.DOCX) and PDF for only KSh 50.',
    badgeText: '10-COLUMN KICD RATIONALIZED SCHEMES • KES 50',
    ctaHref: '/?area=schemes',
    ctaLabel: 'Download 2026 Schemes of Work (KSh 50) →',
    dbCategoryFilter: 'Schemes of Work',
    keywords: [
      'Schemes of Work',
      '2026 CBC Schemes of Work',
      'KICD Rationalized Schemes of Work 2026',
      'Editable Schemes of Work Word DOCX Kenya',
      'Term 1 Term 2 Term 3 Schemes of Work PDF',
      'Grade 7 8 9 JSS Schemes of Work 2026',
      'Grade 10 11 12 Senior School Schemes of Work',
      'PP1 PP2 Lower Upper Primary Schemes of Work',
    ],
    introParagraphs: [
      'Our 2026 CBC Schemes of Work are structured in the official 10-column TSC & KICD format (Week, Lesson, Strand, Sub-strand, Specific Learning Outcomes, Learning Experiences, Key Inquiry Questions, Learning Resources citing exact KICD Orange Book pages, Assessment Methods, and Reflection).',
      'Every Scheme of Work rhymes lesson-for-lesson with our CBC Lesson Plans, Teachers’ Notes, and Records of Work across Term 1 (13 weeks), Term 2 (14 weeks), and Term 3 (9 weeks) for only KSh 50.',
    ],
    highlights: [
      'Exact KICD lesson allocations per week (30m ECDE/Lower, 35m Upper, 40m JSS & Senior School)',
      'Pre-mapped to KICD Approved Coursebooks (Mentor, KLB Top Scholar, Moran, Oxford, Longhorn)',
      '100% Editable MS Word (.DOCX) table layout + crisp landscape/portrait Print PDF',
      'Available for all 210 subjects from PP1 & PP2 to Grade 12',
    ],
    faqs: [
      {
        q: 'Which textbooks are referenced inside the 2026 CBC Schemes of Work?',
        a: 'Each scheme cites official KICD Orange Book Learner’s Books and Teacher’s Guides (including KLB Top Scholar, Mentor, Oxford Head Start / Active, Longhorn, Moran, and Spotlight series) with exact page ranges per lesson.',
      },
      {
        q: 'How much does a complete Term Scheme of Work cost?',
        a: 'Every complete single-subject Term 1, Term 2, or Term 3 Scheme of Work is KSh 50 and includes both Editable Word (.DOCX) and PDF.',
      },
    ],
  },
  {
    slug: 'teachers-notes',
    navLabel: 'Teachers & Lesson Notes',
    h1Title:
      'CBC Teachers Notes & Lesson Notes PDF / Word Download (PP1–Grade 12 All Subjects + Short Point-Form Notes)',
    metaTitle:
      'CBC Teachers Notes & Lesson Notes PDF / Word (PP1–Grade 12 All Strands)',
    metaDescription:
      'Download complete CBC Teachers Notes, Chalkboard Lesson Notes & Detailed Point-Form Short Notes with Valid Textbook Examples covering ALL Strands and Sub-strands (PP1–Grade 12) in Editable Word (.DOCX) & PDF.',
    badgeText: 'COMPLETE ALL-STRANDS LESSON & SHORT NOTES • DOCX + PDF',
    ctaHref: '/?area=notes',
    ctaLabel: "Open CBC Teachers' & Lesson Notes →",
    dbCategoryFilter: "Teachers' Notes",
    keywords: [
      'Teachers Notes',
      'CBC Teachers Notes',
      'CBC Lesson Notes PDF free preview',
      'Junior School Grade 7 8 9 Notes PDF',
      'Grade 4 5 6 Upper Primary Notes Kenya',
      'Senior School Grade 10 11 12 Notes',
      'Short Point Form CBC Notes with Examples',
      'teacher.co.ke style lesson notes',
    ],
    introParagraphs: [
      'Whether you are preparing daily chalkboard concepts or revising an entire syllabus before national assessments, our CBC Teachers’ Notes and Short Point-Form Notes cover every single Strand and Sub-strand without skipping any topic.',
      'Each sub-strand breaks down full syllabus concepts into clear, memorable points accompanied by valid, Kenyan-context worked examples from KICD approved coursebooks.',
    ],
    highlights: [
      'Lesson-by-lesson Teachers’ Notes (KSh 100) + 50-Page Point-Form Books (KSh 500 / KSh 750)',
      '12+ detailed points per Sub-strand and 30+ points per Strand with valid approved examples',
      'Pure Kiswahili Sanifu notes ("Maelezo Mafupi ya Mada") for Kiswahili & Fasihi subjects',
      'Delivered in both Printable PDF and Editable Word (.DOCX)',
    ],
    faqs: [
      {
        q: 'Do the CBC Teachers Notes cover all strands and sub-strands of the syllabus?',
        a: 'Yes. Every subject note booklet covers 100% of the KICD rationalized strands and sub-strands for Term 1, Term 2, and Term 3, complete with worked classroom examples and learner practice tasks.',
      },
    ],
  },
  {
    slug: 'knec-examinations',
    navLabel: 'KNEC & CBC Examinations',
    h1Title:
      'KNEC Examinations, National KJSEA Tests, KPSEA, KEYA & Term Exams with Official Marking Schemes',
    metaTitle:
      'KNEC Examinations, KJSEA, KPSEA & CBC Exams + Marking Schemes (2026)',
    metaDescription:
      'Download authentic KNEC-format Examinations, KENYA NATIONAL KJSEA TEST (Question Paper KSh 50 • Official Marking Scheme KSh 50), KPSEA Grade 6 Trials, KEYA Grade 3 SBA, and Term 1, 2 & 3 Opener/Mid/End-Term Exams.',
    badgeText: 'KNEC COVER FORMAT • EXAM KSH 50 | MARKING SCHEME KSH 50',
    ctaHref: '/?area=kjsea',
    ctaLabel: 'Open National KJSEA & KNEC-Style Examinations →',
    dbCategoryFilter: 'NATIONAL KJSEA EXAMINATION (ALL GRADES)',
    keywords: [
      'KNEC',
      'KNEC Examinations',
      'Examinations Kenya',
      'KJSEA Examinations 2026',
      'KPSEA Past Papers and Trials',
      'KEYA Grade 3 Assessment',
      'Kenya National KJSEA Test',
      'CBC Exams and Marking Schemes PDF Word',
      'Opener Mid-Term End-Term Exams 2026',
    ],
    introParagraphs: [
      'Prepare learners under real national examination conditions with our KNEC-styled assessment series, featuring the flagship KENYA NATIONAL KJSEA TEST across PP1, PP2, and Grades 1–12 alongside Opener, Mid-Term, and End-Term examination sets.',
      'Every KENYA NATIONAL KJSEA TEST features an authentic first-page cover with Paper Code, Candidate Identification Box, Instructions to Candidates (or Maagizo kwa Watahiniwa in pure Kiswahili Sanifu), Examiner’s Scoring Rubric Grid (EE, ME, AE, BE), and 20 zero-repetition questions covering all syllabus strands in 2 Hours.',
    ],
    highlights: [
      '210 Standalone Question Papers (KSh 50 each) + 210 Separate Official Marking Schemes (KSh 50 each)',
      'Section A (Q1–10 Multiple Choice, 20 Marks) + Section B (Q11–20 Structured, 80 Marks = 100 Marks)',
      'Opener, Mid-Term & End-Term Exams + KPSEA, KEYA & Senior School Trials also available',
      'Instant PDF + Editable MS Word (.DOCX) download via M-Pesa',
    ],
    faqs: [
      {
        q: 'Are the Question Paper and Official Marking Scheme sold separately at KSh 50 each?',
        a: 'Yes! Each KENYA NATIONAL KJSEA TEST Question Paper is KSh 50 (containing the KNEC-style cover page and Questions 1–20 with zero answers attached), and its matching Official Confidential Marking Scheme (100 Marks) is KSh 50.',
      },
    ],
  },
  {
    slug: 'kjsea-exams',
    navLabel: 'KJSEA Exams (All Grades)',
    h1Title:
      'National KJSEA Examination (All Grades) & Grade 9 KJSEA Trial Papers + Marking Schemes',
    metaTitle:
      'KJSEA Exams 2026 | National KJSEA Examination (All Grades) & Marking Schemes',
    metaDescription:
      'Get 2026 KJSEA Examinations, Grade 9 Kenya Junior School Education Assessment trial papers, and KENYA NATIONAL KJSEA TEST booklets across all grades (20 Questions • 2 Hours • KSh 50) with separate Marking Schemes (KSh 50).',
    badgeText: '20 ZERO-REPEAT QUESTIONS • TIME: 2 HOURS • ALL STRANDS',
    ctaHref: '/?area=kjsea',
    ctaLabel: 'Launch National KJSEA Examination Hub →',
    dbCategoryFilter: 'NATIONAL KJSEA EXAMINATION (ALL GRADES)',
    keywords: [
      'KJSEA',
      'KJSEA 2026',
      'KJSEA Past Papers and Marking Schemes',
      'Grade 9 KJSEA Trial Exams',
      'National KJSEA Examination All Grades',
      'Kenya Junior School Education Assessment PDF',
    ],
    introParagraphs: [
      'The Kenya Junior School Education Assessment (KJSEA) evaluates learners across Multiple Choice and Structured Competency tasks. Our NATIONAL KJSEA EXAMINATION (ALL GRADES) hub provides 2-hour, 20-question papers covering every strand with zero question repetition.',
      'Kiswahili and Fasihi ya Kiswahili assessments are authored in 100% pure Kiswahili Sanifu with Muda: Saa 2, Maagizo kwa Watahiniwa, and Mwongozo Rasmi wa Kusahihisha.',
    ],
    highlights: [
      'Covers all 12 Junior School (Grades 7, 8 & 9) learning areas plus Primary & Senior School grades',
      'Authentic 2-Hour paper layout with dotted candidate working lines and mark allocations',
      'CBC Performance Level conversion rubric: EE (80–100%), ME (50–79%), AE (30–49%), BE (0–29%)',
      'Question Paper: KSh 50 • Official Marking Scheme: KSh 50',
    ],
    faqs: [
      {
        q: 'Which Junior School subjects have KJSEA Examinations and Marking Schemes?',
        a: 'All JSS subjects are included: Mathematics, English, Kiswahili, Integrated Science, Agriculture & Nutrition, Social Studies, Pre-Technical Studies, Creative Arts & Sports, Christian Religious Education (CRE), and Islamic Religious Education (IRE).',
      },
    ],
  },
  {
    slug: 'kpsea-exams',
    navLabel: 'KPSEA Grade 6 Exams',
    h1Title:
      'KPSEA Examinations 2026 — Grade 6 Kenya Primary School Education Assessment Trials & Marking Schemes',
    metaTitle:
      'KPSEA Exams & Past Papers 2026 | Grade 6 Trial Papers + Marking Schemes',
    metaDescription:
      'Download 2026 Grade 6 KPSEA Trial Examinations, Revision Papers, Point-Form Short Notes & Complete Marking Schemes for Mathematics, English, Kiswahili, Science & Technology, Agriculture, Social Studies, Creative Arts & CRE/IRE.',
    badgeText: 'GRADE 6 KPSEA NATIONAL REVISION • WORD + PDF',
    ctaHref: '/grades/grade-6',
    ctaLabel: 'Open Complete Grade 6 KPSEA Catalog →',
    dbCategoryFilter: 'Revision Papers & Exams',
    dbSearchKeyword: 'Grade 6',
    keywords: [
      'KPSEA',
      'KPSEA 2026',
      'KPSEA Past Papers PDF with Answers',
      'Grade 6 KPSEA Trial Exams',
      'Kenya Primary School Education Assessment',
      'KPSEA Prediction Questions and Marking Schemes',
    ],
    introParagraphs: [
      'Give Grade 6 candidates thorough preparation for the Kenya Primary School Education Assessment (KPSEA) with strand-balanced trial papers, opener/mid/end-term assessments, and 50-page Grade 6 revision books.',
    ],
    highlights: [
      'All Grade 6 KPSEA subjects covered with step-by-step marking schemes',
      'Editable Word (.DOCX) + Print-Ready (.PDF) formats',
      'Paired with Grade 6 Schemes of Work, Lesson Plans & Short Notes',
    ],
    faqs: [
      {
        q: 'Do Grade 6 KPSEA papers include complete marking schemes?',
        a: 'Yes. Every Grade 6 KPSEA trial paper on cbcmaterials.shop comes with complete answers and scoring rubrics.',
      },
    ],
  },
  {
    slug: 'tsc-services',
    navLabel: 'TSC Services & TPAD',
    h1Title:
      'TSC Services Kenya — Teachers Service Commission TPAD 2, T-Pay Payslips, Wealth Declaration & Compliance Tools',
    metaTitle:
      'TSC Services Kenya (2026) | TPAD 2, T-Pay Payslips, Records of Work & Transfers',
    metaDescription:
      'Access all Teachers Service Commission (TSC) online services, TPAD 2 appraisal guides, T-Pay payslips portal links, Wealth Declaration, Teacher Registration, Promotions, Transfers & TPAD-ready Records of Work and Schemes of Work.',
    badgeText: 'ALL TEACHERS SERVICE COMMISSION (TSC) PORTALS & TPAD TOOLS',
    ctaHref: '/?hub=tsc',
    ctaLabel: 'Open All TSC Services Hub Now →',
    dbCategoryFilter: 'Records of Work',
    keywords: [
      'TSC',
      'Teachers Service Commission Kenya',
      'TSC TPAD 2 portal login',
      'TSC T-Pay payslips online',
      'TSC Wealth Declaration Kenya',
      'TSC Teacher Registration and Transfers',
      'TSC TPAD Lesson Observation and Records of Work',
    ],
    introParagraphs: [
      'Kenyan teachers rely on quick, accurate access to Teachers Service Commission (TSC) portals alongside TPAD-compliant professional documents. Our All TSC Services hub consolidates direct portal access and step-by-step teacher guides for TPAD 2 appraisals, T-Pay payslips and P9 tax forms, biennial Wealth Declaration, teacher registration, promotions, and transfers.',
      'To make termly TPAD 2 appraisal effortless, pair your portal checklist with our KICD-rationalized Schemes of Work (KSh 50), Lesson Plans (KSh 70), and Records of Work Covered with EE/ME/AE/BE rubrics (KSh 50).',
    ],
    highlights: [
      'One-button access to TPAD 2, T-Pay, TSC Online Services, Wealth Declaration & Sick Leave guides',
      'TPAD-compliant 10-column Schemes of Work, Lesson Plans & Records of Work (PP1–Grade 12)',
      'Saves hours of administrative preparation for Classroom Teachers, Senior Masters & Deputies',
    ],
    faqs: [
      {
        q: 'Which professional documents on cbcmaterials.shop are required for TSC TPAD 2 appraisal?',
        a: 'TSC TPAD 2 requires updated KICD-rationalized Schemes of Work, Lesson Plans, Lesson Notes, Records of Work Covered, and Learner Assessment Progress Rubrics (EE, ME, AE, BE)—all available in Editable Word and PDF on cbcmaterials.shop.',
      },
    ],
  },
  {
    slug: 'tuition-and-tutors',
    navLabel: 'CBC Tuition & Tutors Kenya',
    h1Title:
      'CBC Tuition & Private Tutors in Kenya — Book Verified Home or Online Holiday & Weekend Teachers (All 47 Counties)',
    metaTitle:
      'CBC Tuition & Tutors Kenya | Verified Home & Online Teachers (All 47 Counties)',
    metaDescription:
      'Looking for a qualified CBC Tutor or Holiday Tuition Teacher in Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu or anywhere across all 47 Kenyan Counties? Book verified home/online tutors (PP1–Grade 12) or register as a CBC Teacher!',
    badgeText: 'HOME & ONLINE CBC TUTORS • ALL 47 KENYAN COUNTIES',
    ctaHref: '/#holiday-tuition-hub',
    ctaLabel: 'Book a CBC Tutor or Register as a Teacher →',
    keywords: [
      'Tuition',
      'Tutors',
      'CBC Tuition Kenya',
      'CBC Tutors Nairobi',
      'Home Tuition Kenya',
      'Holiday Tuition Teachers Kenya',
      'Private Tutors for KPSEA KJSEA KCSE',
      'Online Maths Science English Kiswahili Tutor Kenya',
      'Register as a Tuition Teacher in Kenya',
    ],
    introParagraphs: [
      'Finding a trustworthy, TSC-qualified private tutor for personalized one-on-one home tuition or interactive online coaching makes a transformative difference in a learner’s confidence and assessment mastery.',
      'Our Personal & Holiday Tuition Matchmaker connects parents and learners (PP1, Primary, Junior School Grades 7–9, and Senior School Grades 10–12) with vetted subject specialists across Nairobi, Kiambu, Mombasa, Nakuru, Kisumu, Uasin Gishu, Machakos, Kajiado, and all 47 Counties in Kenya. Qualified teachers can also join our Priority Tutor Queue (KSh 500) to get matched directly with families.',
    ],
    highlights: [
      'One-on-One Home Tuition & Flexible Online Zoom/Google Meet Coaching (PP1 – Grade 12)',
      'Specialized KPSEA (Grade 6), KJSEA (Grade 9) & Senior School STEM/Languages Tutors',
      'Instant County & Subject Matching coordinated safely via our Tuition Desk',
      'Qualified CBC & TSC Teachers can register online to receive verified tuition clients',
    ],
    faqs: [
      {
        q: 'How do parents book a Home or Online CBC Tutor on cbcmaterials.shop?',
        a: 'Open the Personal & Holiday Tuition section on cbcmaterials.shop, select Learner/Parent, choose your child’s grade, subjects, county, and preferred mode (Home or Online), complete the KSh 1,000 booking, and our coordinator matches you immediately with verified tutors.',
      },
      {
        q: 'How can a qualified teacher register as a private or holiday tutor?',
        a: 'Switch to the Teacher Registration tab inside our Holiday Tuition Center, list your teaching subjects, grade bands, TSC/qualification details, and county, and submit the KSh 500 registration to enter our active parent-matching pool.',
      },
    ],
  },
  {
    slug: 'cbc-lesson-plans',
    navLabel: 'CBC Lesson Plans',
    h1Title:
      'CBC Lesson Plans Kenya (PP1–Grade 12) — Ready-to-Teach Lesson-by-Lesson Word & PDF Plans',
    metaTitle:
      '2026 CBC Lesson Plans Kenya (PP1–Grade 12) | Editable Word & PDF (KSh 70)',
    metaDescription:
      'Download complete lesson-by-lesson 2026 CBC Lesson Plans for PP1, PP2 & Grades 1–12 across Term 1, Term 2 & Term 3, synchronized 1:1 with KICD Schemes of Work and Orange Book textbooks (KSh 70).',
    badgeText: 'LESSON-BY-LESSON READY-TO-TEACH PLANS • KES 70',
    ctaHref: '/?area=lesson-plans',
    ctaLabel: 'Download CBC Lesson Plans (KSh 70) →',
    dbCategoryFilter: 'Lesson Plans',
    keywords: [
      'CBC Lesson Plans',
      '2026 CBC Lesson Plans Word DOCX',
      'KICD Lesson Plan Format Kenya',
      'Grade 7 8 9 JSS Lesson Plans',
      'PP1 to Grade 6 Lesson Plans PDF',
    ],
    introParagraphs: [
      'Every CBC Lesson Plan booklet contains individual lesson plans for every lesson of every week across the term, complete with Strand, Sub-strand, Specific Learning Outcomes, Key Inquiry Questions, Core Competencies, Values, PCIs, Introduction, Lesson Development steps, Chalkboard Summary, and Extended Activity.',
    ],
    highlights: [
      'Synced 1:1 with our 2026 KICD Schemes of Work and Teachers’ Notes',
      'Exact 30-minute, 35-minute, and 40-minute lesson pacing by grade band',
      'Editable Word (.DOCX) + Print-Ready (.PDF) for only KSh 70',
    ],
    faqs: [
      {
        q: 'Do the CBC Lesson Plans match the Schemes of Work week by week?',
        a: 'Yes. Every single week and lesson number in our CBC Lesson Plans matches the corresponding week, lesson, sub-strand, and textbook pages in our Schemes of Work.',
      },
    ],
  },
  {
    slug: 'records-of-work',
    navLabel: 'Records of Work & Rubrics',
    h1Title:
      'TSC & KICD Records of Work Covered + CBC Assessment Rubric Trackers (EE, ME, AE, BE)',
    metaTitle:
      'CBC Records of Work Covered & Rubric Trackers (PP1–Grade 12) | KSh 50',
    metaDescription:
      'Download official TSC & KICD Records of Work Covered with built-in EE, ME, AE, BE rubric tracking columns for PP1, PP2, and Grades 1–12 in Editable Word (.DOCX) and PDF (KSh 50).',
    badgeText: 'TSC TPAD RECORDS OF WORK + RUBRICS • KES 50',
    ctaHref: '/?area=records',
    ctaLabel: 'Download Records of Work (KSh 50) →',
    dbCategoryFilter: 'Records of Work',
    keywords: [
      'Records of Work Covered Kenya',
      'CBC Records of Work Word DOCX',
      'TSC TPAD Records of Work',
      'CBC Rubric Assessment Tracker EE ME AE BE',
    ],
    introParagraphs: [
      'Track syllabus coverage effortlessly with pre-filled weekly and lesson-by-lesson Records of Work Covered aligned to KICD rationalized designs and approved textbooks, complete with HOD/Principal sign-off blocks and CBC rubric columns.',
    ],
    highlights: [
      'Pre-mapped lesson-by-lesson to save teachers hours of manual typing',
      'Includes EE, ME, AE, BE competency rubric columns',
      'Editable MS Word (.DOCX) + Print PDF for only KSh 50',
    ],
    faqs: [
      {
        q: 'Can I fill in dates and remarks digitally in the Record of Work?',
        a: 'Yes, the Editable MS Word (.DOCX) file lets you type dates taught and teacher reflections digitally or print a clean PDF copy for handwritten sign-offs.',
      },
    ],
  },
  {
    slug: 'cbc-revision-books',
    navLabel: 'CBC Revision Books (50p–100p)',
    h1Title:
      'CBC Revision Books Kenya — CBC Grade Up, Super-Light CBC Compilation & Smart CBC All Subjects',
    metaTitle:
      'CBC Revision Books (PP1–Grade 12) | Short Point-Form Notes, Examples & Q&A',
    metaDescription:
      'Unlock 50-Page & 100-Page CBC Revision Books (Term 1, Term 2, Term 3 or All Terms): 1. CBC GRADE UP (KSh 500), 2. SUPER-LIGHT CBC COMPILATION (KSh 750) & 3. SMART CBC ALL SUBJECTS (KSh 1,500) with Point-Form Notes, Approved Examples & Marking Schemes.',
    badgeText: '50-PAGE & 100-PAGE COMPLETE SUBJECT BOOKS • PDF + DOCX',
    ctaHref: '/?book=1',
    ctaLabel: 'Preview & Unlock CBC Revision Books →',
    dbCategoryFilter: 'CBC GRADE UP (50-Page Books)',
    keywords: [
      'CBC Revision Books Kenya',
      'CBC Grade Up Book',
      'Super-Light CBC Compilation',
      'Smart CBC All Subjects',
      'CBC Made Familiar style topical questions and short notes',
      'Point form CBC notes with examples',
    ],
    introParagraphs: [
      'Our three flagship CBC Book series cover every single subject from PP1 & PP2 through Grade 12 (210 subjects total). Choose a single term (Term 1, Term 2, or Term 3) or unlock All Terms Together (+20%) with zero duplicate notes or questions.',
    ],
    highlights: [
      '1. CBC GRADE UP (KSh 500/Term • KSh 600 All Terms): Point-Form Short Notes + 165 Questions + Marking Schemes',
      '2. SUPER-LIGHT CBC COMPILATION (KSh 750/Term • KSh 900 All Terms): Detailed Point-Form Scope + Valid Examples + Immediate Sub-strand Questions',
      '3. SMART CBC ALL SUBJECTS (KSh 1,500/Term • KSh 1,800 All Terms): Combines BOTH books + Unlocks ALL subjects in your selected Grade!',
    ],
    faqs: [
      {
        q: 'Do the Short Notes in these CBC Books include valid textbook examples on every point?',
        a: 'Yes! Every point across every sub-strand and strand is written in clear point form and includes two valid examples citing official KICD approved textbooks.',
      },
    ],
  },
  {
    slug: 'senior-school-pathways',
    navLabel: 'Senior School (Grades 10–12)',
    h1Title:
      'Senior School Kenya (Grades 10, 11 & 12) — STEM, Social Sciences & Arts/Sports CBE Schemes, Notes & Exams',
    metaTitle:
      'Grade 10, 11 & 12 Senior School Schemes, Notes & Exams (All 37 Subjects)',
    metaDescription:
      'Complete Kenya Senior School (Grades 10, 11 & 12) Competency-Based Education (CBE) Schemes of Work, Lesson Plans, Teachers Notes, Revision Books & National Assessments across all 37 STEM, Social Sciences & Arts/Sports subjects.',
    badgeText: 'ALL 37 SENIOR SCHOOL PATHWAY SUBJECTS • GRADES 10–12',
    ctaHref: '/grades/grade-10',
    ctaLabel: 'Explore Grade 10, 11 & 12 Senior School Materials →',
    keywords: [
      'Grade 10 Schemes of Work 2026',
      'Grade 10 Notes PDF Kenya',
      'Senior School Pathways Kenya STEM Social Sciences Arts Sports',
      'Grade 11 and Grade 12 CBE Materials Kenya',
      'Core Mathematics Biology Chemistry Physics Computer Science Grade 10',
    ],
    introParagraphs: [
      'As learners transition into Senior School (Grades 10, 11, and 12) under Kenya’s Competency-Based Education (CBE) pathways, cbcmaterials.shop provides complete Schemes of Work, Lesson Plans, Teachers’ Notes, 50-page Revision Books, and 2-Hour Assessments for all 37 Senior School subjects.',
    ],
    highlights: [
      'Covers Core & Extended Mathematics, Biology, Chemistry, Physics, Computer Studies, Aviation, Electricity, Woodwork, Metalwork & Building Construction',
      'Covers Literature in English, Fasihi ya Kiswahili, History & Citizenship, Geography, Business Studies, CRE, IRE & HRE',
      'Covers Fine Arts, Music & Dance, Theatre & Film, and Sports & Recreation',
    ],
    faqs: [
      {
        q: 'Are Grade 10, Grade 11, and Grade 12 materials aligned with KICD Senior School designs?',
        a: 'Yes. All 37 Senior School pathway subjects are structured according to the official 40-minute KICD Senior School curriculum designs in Editable DOCX and PDF.',
      },
    ],
  },
  {
    slug: 'holiday-assignments',
    navLabel: 'Holiday Packs & KICD Designs',
    h1Title:
      '2026 CBC Holiday Assignments (April, August & December) & Full-Year KICD Curriculum Designs',
    metaTitle:
      'CBC Holiday Assignments & KICD Curriculum Designs PDF / Word (PP1–Grade 12)',
    metaDescription:
      'Download structured April, August & December CBC Holiday Revision Workbooks and Full-Year (Terms 1, 2 & 3) KICD Rationalized Curriculum Designs for PP1 to Grade 12 in Editable Word (.DOCX) and PDF (KSh 70).',
    badgeText: 'APRIL • AUGUST • DECEMBER PACKS + FULL-YEAR KICD DESIGNS',
    ctaHref: '/?area=holidays',
    ctaLabel: 'Open Holiday Packs & Curriculum Designs (KSh 70) →',
    dbCategoryFilter: 'Holiday Assignments & Designs',
    keywords: [
      'CBC Holiday Assignments 2026',
      'April August December Holiday Revision Packages Kenya',
      'KICD Rationalized Curriculum Designs PDF Word',
      'Home Competency Projects CBC',
    ],
    introParagraphs: [
      'Keep learners productively engaged during April, August, and December school holidays with structured, textbook-synced Holiday Revision Workbooks featuring parent sign-off trackers and home practical CBC projects, plus Full-Year KICD Curriculum Design matrices.',
    ],
    highlights: [
      'Covers every sub-strand taught during the term across PP1 to Grade 12',
      'Includes Full-Year (Terms 1–3) KICD Rationalized Curriculum Design matrices',
      'Editable MS Word (.DOCX) + Print-Ready (.PDF) for KSh 70',
    ],
    faqs: [
      {
        q: 'Do the CBC Holiday Assignments cover all subjects in a grade?',
        a: 'Yes, individual holiday assignment workbooks and full-year curriculum design matrices are available for every subject from PP1 through Grade 12.',
      },
    ],
  },
];

export function getTopicPillarBySlug(slug: string): SeoTopicPillar | undefined {
  const clean = slug.toLowerCase().trim();
  return SEO_TOPIC_PILLARS.find((t) => t.slug === clean);
}
