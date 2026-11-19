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
    q: 'Does CBCMaterials (cbcmaterials.shop) have KNEC-format KJSEA, KPSEA, and KEYA Examinations with Separate Marking Schemes?',
    a: 'Yes! Our NATIONAL KJSEA EXAMINATION (ALL GRADES) hub provides 210 standalone 2-Hour KENYA NATIONAL KJSEA TEST Question Papers (KSh 50 each, with authentic KNEC-style first-page instructions and 20 zero-repetition questions covering all strands) plus 210 separate Official Marking Schemes (KSh 50 each), alongside KPSEA (Grade 6), KEYA (Grade 3), and Opener, Mid-Term & End-Term Exams.',
  },
  {
    q: 'Can I get complete CBC Teachers Notes and Short Point-Form Notes with textbook examples for every subject?',
    a: 'Yes. Every subject from PP1 & PP2 through Grade 12 has comprehensive Lesson-by-Lesson CBC Teachers’ Notes (KSh 100) as well as 50-Page & 100-Page Point-Form Short Notes Books (CBC GRADE UP, SUPER-LIGHT CBC COMPILATION, and SMART CBC ALL SUBJECTS) containing 12+ points per sub-strand and valid examples citing KICD approved textbooks.',
  },
  {
    q: 'How do I access Teachers Service Commission (TSC) TPAD 2, T-Pay Payslips, and Records of Work?',
    a: 'Click the All TSC Services button or visit /topics/tsc-services on cbcmaterials.shop for direct access to TSC TPAD 2 appraisals, T-Pay payslips, Wealth Declaration, and TPAD-ready 10-column Schemes of Work, Lesson Plans, and Records of Work Covered with EE, ME, AE, BE rubrics.',
  },
  {
    q: 'How do parents book verified Home or Online CBC Tuition Tutors in Kenya, and how can Teachers register as Tutors?',
    a: 'Parents and students across all 47 counties (Nairobi, Mombasa, Kisumu, Nakuru, Eldoret, Kiambu, Machakos, Kajiado, and beyond) can book vetted one-on-one Home or Online CBC Tutors (PP1–Grade 12) inside our Personal & Holiday Tuition hub, while qualified TSC and CBC teachers can register in our Priority Tutor Queue (KSh 500) to receive verified tuition clients.',
  },
  {
    q: 'Does the M-Pesa STK prompt on cbcmaterials.shop work with Fuliza M-Pesa and open files immediately?',
    a: 'Yes. Enter your Safaricom phone number on checkout, confirm with your M-Pesa PIN (works seamlessly with both standard M-Pesa cash balance and active Fuliza limits), and your Editable Word (.DOCX) and Print-Ready (.PDF) downloads unlock automatically within ~1 second.',
  },
];

export default function SeoKnowledgeSection() {
  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CBCMaterials Kenya — CBC Kenya Resource Hub',
      alternateName: [
        'CBCMaterials',
        'CBC Materials Kenya',
        'CBC Kenya Resource Hub',
        'cbcmaterials.shop',
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
      name: 'CBCMaterials Kenya (CBC Kenya Resource Hub)',
      url: 'https://www.cbcmaterials.shop',
      sameAs: [
        'https://www.facebook.com/profile.php?id=61591027359399',
        'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
        'https://wa.me/254728595160',
      ],
      knowsAbout: [
        'Competency-Based Curriculum (CBC) Kenya',
        '2026 KICD Rationalized Schemes of Work',
        'CBC Teachers Notes and Point-Form Short Notes',
        'KNEC Examinations, KJSEA, KPSEA, and KEYA Trial Papers',
        'Teachers Service Commission (TSC) TPAD 2 and Records of Work',
        'Home Tuition, Holiday Tuition, and Private CBC Tutors in Kenya',
        'Senior School Grades 10, 11, and 12 CBE Pathways',
      ],
      description:
        'Kenya’s #1 Competency-Based Curriculum (CBC) portal (cbcmaterials.shop) providing 6,534+ Editable Word (.DOCX) and PDF Schemes of Work, Teachers Notes, Lesson Plans, KNEC KJSEA & KPSEA Examinations, TSC TPAD Tools, AI Homework Q&A, and Verified Tuition Tutors across PP1 to Grade 12.',
      areaServed: {
        '@type': 'Country',
        name: 'Kenya',
      },
      contactPoint: {
        '@type': 'ContactPoint',
        telephone: '+254-705-759-072',
        contactType: 'customer support',
        areaServed: 'KE',
        availableLanguage: ['English', 'Swahili'],
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
      className="max-w-6xl mx-auto px-4 pt-10 space-y-6"
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

      {/* 3. Rich Snippet FAQ Accordion */}
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
