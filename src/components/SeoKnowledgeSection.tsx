import React from 'react';
import Link from 'next/link';
import { HelpCircle, Layers } from 'lucide-react';

const GRADE_SEO_LINKS = [
  { slug: 'pp1', label: 'PP1 CBC Materials' },
  { slug: 'pp2', label: 'PP2 CBC Materials' },
  { slug: 'grade-1', label: 'Grade 1 Schemes & Notes' },
  { slug: 'grade-2', label: 'Grade 2 Schemes & Notes' },
  { slug: 'grade-3', label: 'Grade 3 KEYA & Notes' },
  { slug: 'grade-4', label: 'Grade 4 CBC Materials' },
  { slug: 'grade-5', label: 'Grade 5 Schemes & Exams' },
  { slug: 'grade-6', label: 'Grade 6 KPSEA Trials' },
  { slug: 'grade-7', label: 'Grade 7 Junior School' },
  { slug: 'grade-8', label: 'Grade 8 JSS Schemes' },
  { slug: 'grade-9', label: 'Grade 9 KJSEA Trials' },
  { slug: 'grade-10', label: 'Grade 10 Senior School' },
  { slug: 'grade-11', label: 'Grade 11 Pathways' },
  { slug: 'grade-12', label: 'Grade 12 Senior School' },
];

const HOME_FAQS = [
  {
    q: 'Where can I download 2026 KICD Rationalized CBC Schemes of Work in Editable Word (.DOCX) and PDF?',
    a: 'All 3,400+ 2026 KICD-rationalized CBC Schemes of Work, Lesson Plans, Teachers’ Notes, Records of Work, Holiday Assignments, and Curriculum Designs from PP1 to Grade 12 are available for instant M-Pesa download at cbcmaterials.shop in both Editable Microsoft Word (.DOCX) and Print-Ready (.PDF) formats.',
  },
  {
    q: 'Does cbcmaterials.shop include KPSEA (Grade 6) and KJSEA (Grade 9) Revision Papers with Marking Schemes?',
    a: 'Yes. Our Revision Papers & Exams catalog covers Opener, Mid-Term, and End-Term Assessments for Terms 1, 2, and 3 alongside KEYA (Grade 3), KPSEA (Grade 6), KJSEA (Grade 9), and Grade 10–12 Senior School Trial Papers complete with verified KNEC-style marking schemes.',
  },
  {
    q: 'How fast do CBC materials open after paying via M-Pesa STK Push?',
    a: 'Once you enter your M-Pesa PIN on the automatic Safaricom STK prompt, payment is auto-confirmed and your Editable Word (.DOCX) and Print-Ready (.PDF) copies open automatically within ~1 second.',
  },
  {
    q: 'Can parents book verified Holiday or Personal Tuition Teachers and can CBC Teachers register?',
    a: 'Yes. Parents and learners can book subject-matched holiday or personal teachers (PP1–Grade 12, home or online), and qualified CBC teachers can register in our Priority Queue to get matched with students across all 47 counties in Kenya.',
  },
  {
    q: 'Are the 50-Page "CBC GRADE UP" and "COMPETENCY BASED MADE FAMILIAR" books aligned with Official Approved CBC Course Materials?',
    a: 'Yes! Every 50-page CBC GRADE UP book (KSh 500), 50-page COMPETENCY BASED MADE FAMILIAR point-form notes & topical Q&A book (KSh 750), and 100-page Complete Compilation (KSh 1,500) is built directly from the Official Approved CBC Course Materials across PP1, PP2, Grades 1–9, and all 37 Senior School (Grades 10–12) STEM, Social Sciences, and Arts & Sports Science Pathway subjects, complete with end-of-book marking schemes.',
  },
];

export default function SeoKnowledgeSection() {
  const homeJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'CBC Kenya Resource Hub',
      alternateName: ['CBC Materials Kenya', 'cbcmaterials.shop'],
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
      name: 'CBC Kenya Resource Hub',
      url: 'https://www.cbcmaterials.shop',
      sameAs: [
        'https://www.facebook.com/profile.php?id=61591027359399',
        'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
        'https://wa.me/254705759072',
      ],
      description:
        'Kenya’s KICD-rationalized Competency-Based Curriculum (CBC) portal providing 3,400+ Editable Word (.DOCX) and PDF Schemes of Work, Lesson Plans, Notes, KPSEA & KJSEA Exams, Holiday Tuition matching, and AI Homework support across PP1 to Grade 12.',
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
      aria-label="CBC Grade Directory and Frequently Asked Questions"
      className="max-w-6xl mx-auto px-4 pt-10 space-y-6"
    >
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(homeJsonLd) }}
      />

      {/* Indexable Direct Grade Hub Directory */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-3.5">
        <div className="flex items-center gap-2 text-emerald-800">
          <Layers className="w-5 h-5" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Browse 2026 KICD Rationalized CBC Materials by Grade (PP1 – Grade 12)
          </h2>
        </div>
        <p className="text-xs sm:text-sm text-slate-600">
          Open any dedicated grade catalog below to view all KICD subjects, Term 1, 2 &amp; 3
          Schemes of Work, Lesson Plans, Notes, Records of Work, Holiday Assignments, and
          KPSEA / KJSEA Trial Exams:
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

      {/* Rich Snippet FAQ Accordion */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2 text-indigo-800">
          <HelpCircle className="w-5 h-5" />
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Frequently Asked Questions — Kenya CBC Curriculum Materials (2026)
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
