import React from 'react';
import Link from 'next/link';
import { Compass, HelpCircle, Layers } from 'lucide-react';
import { SEO_TOPIC_PILLARS } from '@/lib/seo-topics';

const GRADE_SEO_LINKS = [
  { slug: 'pp1', label: 'PP1 CBC Schemes & Notes' },
  { slug: 'pp2', label: 'PP2 CBC Schemes & Notes' },
  { slug: 'grade-1', label: 'Grade 1 Schemes, Notes & Exams' },
  { slug: 'grade-2', label: 'Grade 2 Schemes, Notes & Exams' },
  { slug: 'grade-3', label: 'Grade 3 KEYA, Schemes & Notes' },
  { slug: 'grade-4', label: 'Grade 4 CBC Schemes & Notes' },
  { slug: 'grade-5', label: 'Grade 5 Schemes, Notes & Exams' },
  { slug: 'grade-6', label: 'Grade 6 KPSEA Exams & Notes' },
  { slug: 'grade-7', label: 'Grade 7 JSS Schemes & Notes' },
  { slug: 'grade-8', label: 'Grade 8 JSS Schemes & Notes' },
  { slug: 'grade-9', label: 'Grade 9 KJSEA Exams & Notes' },
  { slug: 'grade-10', label: 'Grade 10 Senior School CBE' },
  { slug: 'grade-11', label: 'Grade 11 Senior Pathways' },
  { slug: 'grade-12', label: 'Grade 12 Senior School CBE' },
];

const HOME_FAQS = [
  {
    q: 'Where can I download 2026 KICD Rationalized CBC Schemes of Work in Editable Word (.DOCX) and PDF?',
    a: 'All 6,534+ 2026 KICD-rationalized CBC Schemes of Work, Lesson Plans, Teachers’ Notes, Records of Work, Holiday Assignments, and Curriculum Designs from PP1 to Grade 12 are available for instant 1-second M-Pesa download at CBCMaterials (www.cbcmaterials.shop) in both Editable Microsoft Word (.DOCX) and Print-Ready (.PDF) formats.',
  },
  {
    q: 'Where can teachers download complete 2026 CBC Lesson Plans synced with Schemes of Work?',
    a: 'Inside our CBC Lesson Plans hub (/topics/cbc-lesson-plans and /topics/lesson-plans-templates), Kenyan teachers can preview and download full Term 1, Term 2, and Term 3 lesson-by-lesson plans (KSh 70) in Editable Word (.DOCX) and PDF synced 1:1 with Orange Book pages, core competencies, PCIs, and chalkboard summaries.',
  },
  {
    q: 'Does CBCMaterials (cbcmaterials.shop) have KNEC-format KJSEA, KPSEA, and KEYA Examinations with Separate Marking Schemes?',
    a: 'Yes! Our NATIONAL KJSEA EXAMINATION (ALL GRADES) hub provides 210 standalone 2-Hour KENYA NATIONAL KJSEA TEST Question Papers (KSh 50 each, with authentic KNEC-style first-page instructions and 20 zero-repetition questions covering all strands) plus 210 separate Official Marking Schemes (KSh 50 each), alongside KPSEA (Grade 6), KEYA (Grade 3), and Opener, Mid-Term & End-Term Exams.',
  },
  {
    q: 'Can I get complete CBC Teachers Notes and Short Point-Form Notes with textbook examples for every subject?',
    a: 'Yes. Every subject from PP1 & PP2 through Grade 12 has comprehensive Lesson-by-Lesson CBC Teachers’ Notes (KSh 100) as well as 50-Page & 100-Page Point-Form Short Notes Books (CBC GRADE UP, SUPER-LIGHT CBC COMPILATION, and SMART CBC ALL SUBJECTS) containing 12+ points per sub-strand and valid examples citing KICD approved textbooks.',
  },
  {
    q: 'How do I access Teachers Service Commission (TSC) TPAD 2, T-Pay Payslips, Wealth Declaration & Records of Work?',
    a: 'Click the All TSC Services button or visit /topics/tsc-services, /topics/tsc-tpad-portal, and /topics/tsc-payslips-tpay on cbcmaterials.shop for direct access to TSC TPAD 2 appraisals, T-Pay payslips & P9 forms, Wealth Declaration guides, and TPAD-ready 10-column Schemes of Work, Lesson Plans, and Records of Work Covered with EE, ME, AE, BE rubrics.',
  },
  {
    q: 'How do parents book verified Home or Online CBC Tuition Tutors in Kenya, and how can Teachers register as Tutors?',
    a: 'Parents and students across all 47 counties (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Machakos, Kajiado, and beyond) can book vetted one-on-one Home or Online CBC Tutors (PP1–Grade 12) inside our Personal & Holiday Tuition hub, while qualified TSC and CBC teachers can register in our Priority Tutor Queue (KSh 500) to receive verified tuition clients.',
  },
  {
    q: 'Does the M-Pesa STK prompt on cbcmaterials.shop work with Fuliza M-Pesa and open files immediately?',
    a: 'Yes. Enter your Safaricom phone number on checkout, confirm with your M-Pesa PIN (works seamlessly with both standard M-Pesa cash balance and active Fuliza limits), and your Editable Word (.DOCX) and Print-Ready (.PDF) downloads unlock automatically within ~1 second. WhatsApp Support: 0728595160.',
  },
  {
    q: 'Are cbcmaterials.shop CBC materials updated for 2026 KICD Rationalized Designs and Grade 10–12 Senior School?',
    a: 'Yes. All 6,534+ resources from PP1 & PP2 through Junior School (Grades 7–9) and Senior School (Grades 10–12 across all 37 pathway subjects) reflect 2026 KICD Rationalized Curriculum Designs and approved KICD Orange Book textbooks.',
  },
];

export default function SeoKnowledgeSection() {
  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CBCMATERIALS.SHOP',
      alternateName: [
        'CBCMATERIALS.SHOP',
        'WWW.CBCMATERIALS.SHOP',
        'CBCMATERIALS',
        'CBC Materials Kenya',
        'CBC Kenya Resource Hub',
      ],
      url: 'https://www.cbcmaterials.shop',
      inLanguage: 'en-KE',
      potentialAction: {
        '@type': 'SearchAction',
        target: {
          '@type': 'EntryPoint',
          urlTemplate: 'https://www.cbcmaterials.shop/?q={search_term_string}',
        },
        'query-input': 'required name=search_term_string',
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'EducationalOrganization',
      '@id': 'https://www.cbcmaterials.shop/#organization',
      name: 'CBCMATERIALS.SHOP',
      alternateName: ['CBCMaterials Kenya', 'CBC Kenya Resource Hub'],
      url: 'https://www.cbcmaterials.shop',
      email: 'academia.edu66@gmail.com',
      telephone: '+254-728-595-160',
      address: {
        '@type': 'PostalAddress',
        streetAddress: '15 Luthuli Avenue',
        addressLocality: 'Nairobi',
        addressRegion: 'Nairobi County',
        addressCountry: 'KE',
      },
      logo: {
        '@type': 'ImageObject',
        url: 'https://www.cbcmaterials.shop/images/cbcmaterials-logo.jpg',
        width: 1024,
        height: 1024,
      },
      image: 'https://www.cbcmaterials.shop/images/cbcmaterials-logo.jpg',
      sameAs: [
        'https://www.facebook.com/profile.php?id=61591027359399',
        'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
        'https://www.tiktok.com/@cbcmaterials.shop',
        'https://www.youtube.com/@cbcmaterials',
        'https://x.com/cbcmaterials_ke',
        'https://wa.me/254728595160',
      ],
      knowsAbout: [
        'Competency-Based Curriculum (CBC) Kenya',
        '2026 KICD Rationalized Schemes of Work',
        'CBC Lesson Plans and Lesson Notes',
        'CBC Teachers Notes and Point-Form Short Notes',
        'KNEC Examinations, KJSEA, KPSEA, and KEYA Trial Papers',
        'Teachers Service Commission (TSC) TPAD 2, T-Pay Payslips and Records of Work',
        'Home Tuition, Holiday Tuition, and Private CBC Tutors in Kenya',
        'Senior School Grades 10, 11, and 12 CBE Pathways',
      ],
      description:
        'Verified Kenyan Competency-Based Curriculum (CBC) educational platform (www.cbcmaterials.shop) providing 6,534+ Editable Word (.DOCX) and PDF Schemes of Work, Lesson Plans, Teachers Notes, KNEC KJSEA & KPSEA Examinations, TSC TPAD 2 & T-Pay Tools, AI Homework Q&A, and Verified Tuition Tutors across PP1 to Grade 12.',
      areaServed: {
        '@type': 'Country',
        name: 'Kenya',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+254-728-595-160',
        contactType: 'customer support',
        email: 'academia.edu66@gmail.com',
        areaServed: 'KE',
        availableLanguage: ['English', 'Swahili'],
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: '2026 Kenya CBC, KICD Schemes, Lesson Plans, Notes, Exams & TSC Catalog',
        itemListElement: [
          {
            '@type': 'Offer',
            name: '2026 KICD Rationalized CBC Schemes of Work (DOCX + PDF)',
            price: '50',
            priceCurrency: 'KES',
            url: 'https://www.cbcmaterials.shop/topics/schemes-of-work',
          },
          {
            '@type': 'Offer',
            name: '2026 CBC Lesson-by-Lesson Plans (DOCX + PDF)',
            price: '70',
            priceCurrency: 'KES',
            url: 'https://www.cbcmaterials.shop/topics/cbc-lesson-plans',
          },
          {
            '@type': 'Offer',
            name: 'CBC Teachers Notes & Point-Form Notes (DOCX + PDF)',
            price: '100',
            priceCurrency: 'KES',
            url: 'https://www.cbcmaterials.shop/topics/teachers-notes',
          },
          {
            '@type': 'Offer',
            name: 'Kenya National KJSEA & KNEC Trial Examinations + Marking Schemes',
            price: '50',
            priceCurrency: 'KES',
            url: 'https://www.cbcmaterials.shop/topics/knec-examinations',
          },
          {
            '@type': 'Offer',
            name: 'TSC TPAD 2 & KICD Records of Work Covered (DOCX + PDF)',
            price: '50',
            priceCurrency: 'KES',
            url: 'https://www.cbcmaterials.shop/topics/tsc-services',
          },
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'CBCMaterials Official Kenya Education Directories',
      itemListElement: SEO_TOPIC_PILLARS.map((tp, index) => ({
        '@type': 'SiteNavigationElement',
        position: index + 1,
        name: tp.navLabel,
        url: `https://www.cbcmaterials.shop/topics/${tp.slug}`,
      })),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: HOME_FAQS.map((f) => ({
        '@type': 'Question',
        name: f.q,
        acceptedAnswer: {
          '@type': 'Answer',
          text: f.a,
        },
      })),
    },
  ];

  return (
    <section
      aria-label="Kenya CBC, KNEC Examinations, Schemes of Work, Teachers Notes, TSC and Tuition Directory"
      className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 space-y-6"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* 1. Indexable Pillar Hubs for CBC, CBCMaterials, Schemes, Notes, KNEC Exams, TSC & Tuition Tutors */}
      <div className="bg-white rounded-2xl border border-emerald-200 shadow-xs p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center gap-2 text-emerald-800">
          <Compass className="w-5 h-5" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Official Kenya CBC, Schemes of Work, Teachers&apos; Notes, KNEC Exams, TSC &amp; Tuition Tutors Hubs
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
          Explore dedicated portals on <strong>CBCMaterials (cbcmaterials.shop)</strong> for{' '}
          <strong>CBC Schemes of Work</strong>, <strong>Teachers&apos; Notes</strong>,{' '}
          <strong>KNEC KJSEA &amp; KPSEA Examinations</strong>,{' '}
          <strong>Teachers Service Commission (TSC) Services</strong>,{' '}
          <strong>CBC Revision Books</strong>, and{' '}
          <strong>Verified Home &amp; Holiday Tuition Tutors</strong> across all 47 Counties in Kenya:
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {SEO_TOPIC_PILLARS.map((tp) => (
            <Link
              key={tp.slug}
              href={`/topics/${tp.slug}`}
              className="text-xs font-extrabold text-emerald-950 hover:text-emerald-800 bg-emerald-50/60 hover:bg-emerald-100/80 border border-emerald-200 hover:border-emerald-400 rounded-xl px-3.5 py-2.5 transition truncate"
            >
              {tp.navLabel}
            </Link>
          ))}
        </div>
      </div>

      {/* 2. Indexable Direct Grade Hub Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center gap-2 text-emerald-800">
          <Layers className="w-5 h-5" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Browse 6,534+ KICD Rationalized CBC Materials by Grade (PP1 – Grade 12)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Open any dedicated grade catalog below to download Term 1, Term 2 &amp; Term 3
          Schemes of Work, Lesson Plans, Teachers&apos; Notes, Records of Work, Holiday
          Assignments, and National KJSEA / KPSEA Examinations + Marking Schemes:
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
          {GRADE_SEO_LINKS.map((g) => (
            <Link
              key={g.slug}
              href={`/grades/${g.slug}`}
              className="text-xs font-bold text-slate-800 hover:text-emerald-800 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 rounded-xl px-3 py-2.5 transition truncate"
            >
              {g.label}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. Rich Authoritative Keyword Guide for TSC, Schemes of Work, Lesson Plans & CBC */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900">
          2026 Kenya CBC, TSC Services, Schemes of Work &amp; Lesson Plans Complete Portal
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-slate-600 leading-relaxed">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-black text-emerald-900">
              1. KICD Rationalized Schemes &amp; Lesson Plans
            </h3>
            <p>
              Download complete Term 1, Term 2, and Term 3{' '}
              <strong>2026 CBC Schemes of Work</strong> (KSh 50) and lesson-by-lesson{' '}
              <strong>CBC Lesson Plans</strong> (KSh 70) in Editable Word (.DOCX) and PDF
              from PP1 &amp; PP2 through Grade 12, citing exact KICD Orange Book pages.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/topics/schemes-of-work-free-download" className="text-emerald-700 font-bold underline">
                Schemes Download →
              </Link>
              <Link href="/topics/lesson-plans-templates" className="text-emerald-700 font-bold underline">
                Lesson Plans Format →
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-black text-emerald-900">
              2. TSC TPAD 2, T-Pay Payslips &amp; Recruitment
            </h3>
            <p>
              Streamline <strong>Teachers Service Commission (TSC)</strong> compliance with
              direct <strong>TSC TPAD 2</strong> appraisal guides, <strong>T-Pay payslips &amp; KRA P9</strong>{' '}
              steps, Wealth Declaration, Promotion prep, and ready-to-print{' '}
              <strong>Records of Work Covered</strong> with EE/ME/AE/BE rubrics.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/topics/tsc-tpad-portal" className="text-emerald-700 font-bold underline">
                TSC TPAD 2 Guide →
              </Link>
              <Link href="/topics/tsc-payslips-tpay" className="text-emerald-700 font-bold underline">
                TSC T-Pay &amp; P9 →
              </Link>
              <Link href="/topics/tsc-recruitment-interviews" className="text-emerald-700 font-bold underline">
                TSC Recruitment →
              </Link>
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
            <h3 className="text-sm font-black text-emerald-900">
              3. KNEC Exams, Teachers Notes &amp; 47-County Tutors
            </h3>
            <p>
              Prepare candidates with authentic <strong>KNEC KJSEA</strong> (Grade 9),{' '}
              <strong>KPSEA</strong> (Grade 6), <strong>KEYA</strong> (Grade 3), and{' '}
              <strong>Opener / Mid-Term / End-Term Exams</strong> + Marking Schemes,
              all-strands Teachers’ Notes, and verified home/online{' '}
              <strong>CBC Tuition Tutors</strong> across all 47 Counties.
            </p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Link href="/topics/cbc-exams-past-papers" className="text-emerald-700 font-bold underline">
                2026 CBC Exams →
              </Link>
              <Link href="/topics/kicd-curriculum-designs" className="text-emerald-700 font-bold underline">
                KICD Designs →
              </Link>
              <Link href="/topics/tuition-and-tutors" className="text-emerald-700 font-bold underline">
                Find a Tutor →
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* 4. Rich Snippet FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-800">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Frequently Asked Questions — CBCMaterials, Schemes, Notes, KNEC Exams, TSC &amp; Tutors
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {HOME_FAQS.map((item, idx) => (
            <div
              key={idx}
              className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-1.5"
            >
              <h3 className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
                {item.q}
              </h3>
              <p className="text-xs text-slate-600 leading-relaxed">{item.a}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
