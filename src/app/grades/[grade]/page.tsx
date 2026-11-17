import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  FileText,
  GraduationCap,
} from 'lucide-react';
import { formatTermLabel, MATERIAL_CATEGORIES } from '@/lib/material-utils';
import {
  getAllGradeSeoInfos,
  getCachedGradeCatalog,
  SITE_URL,
  slugToGradeInfo,
} from '@/lib/seo-catalog';
import SiteFooter from '@/components/SiteFooter';

type Props = {
  params: Promise<{ grade: string }>;
};

export function generateStaticParams() {
  return getAllGradeSeoInfos().map((g) => ({ grade: g.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { grade } = await params;
  const info = slugToGradeInfo(grade);

  if (!info) {
    return { title: 'CBC Materials Not Found' };
  }

  const canonicalUrl = `${SITE_URL}/grades/${info.slug}`;

  return {
    title: `${info.headline} (Word & PDF)`,
    description: info.metaDescription,
    keywords: info.keywords,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${info.headline} | CBC Kenya Resource Hub`,
      description: info.metaDescription,
      url: canonicalUrl,
      siteName: 'CBC Kenya Resource Hub',
      locale: 'en_KE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${info.headline} | cbcmaterials.shop`,
      description: info.metaDescription,
    },
  };
}

export default async function GradeSeoHubPage({ params }: Props) {
  const { grade } = await params;
  const info = slugToGradeInfo(grade);

  if (!info) {
    redirect('/');
  }

  const items = await getCachedGradeCatalog(info.slug);
  const allGrades = getAllGradeSeoInfos();

  const subjects = Array.from(
    new Set(items.map((r) => r.subject).filter(Boolean))
  ).sort((a, b) => a.localeCompare(b));

  const byCategory = MATERIAL_CATEGORIES.map((cat) => ({
    category: cat,
    list: items.filter((r) => r.category === cat),
  })).filter((group) => group.list.length > 0);

  const canonicalUrl = `${SITE_URL}/grades/${info.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'CBC Kenya Resource Hub',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: `${info.label} CBC Materials (${info.levelName})`,
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: info.headline,
      description: info.metaDescription,
      url: canonicalUrl,
      inLanguage: 'en-KE',
      numberOfItems: items.length,
      mainEntity: {
        '@type': 'ItemList',
        numberOfItems: Math.min(items.length, 40),
        itemListElement: items.slice(0, 40).map((item, idx) => ({
          '@type': 'ListItem',
          position: idx + 1,
          url: `${SITE_URL}/materials/${item.id}`,
          name: item.title,
        })),
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: `Where can I download 2026 ${info.label} CBC Schemes of Work and Notes in Kenya?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `You can preview and download all ${items.length}+ KICD-rationalized 2026 ${info.label} (${info.levelName}) Schemes of Work, Lesson Plans, Teachers' Notes, Records of Work, Holiday Assignments, and Revision Exams in both Editable Word (.DOCX) and Print-Ready (.PDF) formats instantly at ${canonicalUrl}.`,
          },
        },
        {
          '@type': 'Question',
          name: `Are ${info.label} CBC materials editable and aligned with 2026 KICD Rationalized Curriculum Designs?`,
          acceptedAnswer: {
            '@type': 'Answer',
            text: `Yes. Every ${info.label} document on cbcmaterials.shop follows the official 2026 KICD Rationalized Curriculum Designs across Terms 1, 2, and 3 (${subjects.slice(0, 8).join(', ')}) and unlocks both Editable Microsoft Word (.DOCX) and PDF copies immediately upon M-Pesa payment.`,
          },
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Top SEO Navigation Header */}
      <header className="bg-emerald-900 text-white border-b border-emerald-800">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white font-black text-lg hover:text-emerald-200 transition"
          >
            <BookOpen className="w-6 h-6 text-emerald-300" />
            <span>CBC Kenya Resource Hub</span>
          </Link>

          <div className="flex flex-wrap items-center gap-2.5">
            <Link
              href={`/?grade=${encodeURIComponent(info.gradeKey)}`}
              className="inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-4 py-2.5 rounded-xl shadow transition"
            >
              <Download className="w-4 h-4" />
              Open Interactive {info.label} Storefront &amp; M-Pesa Checkout
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex items-center gap-2">
          <Link href="/" className="hover:text-emerald-700 font-semibold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home (All Grades)
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800">{info.label} CBC Materials</span>
        </nav>

        {/* Hero SEO Banner */}
        <section className="bg-white rounded-3xl border border-slate-200 shadow-xs p-6 sm:p-8 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 bg-emerald-100 text-emerald-900 text-xs font-black uppercase px-3 py-1 rounded-full">
              <GraduationCap className="w-4 h-4" />
              {info.levelName} • {info.label}
            </span>
            <span className="text-xs font-bold text-slate-500">
              {items.length.toLocaleString()} KICD-Aligned Documents Available (DOCX + PDF)
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            {info.headline}
          </h1>

          <p className="text-sm text-slate-600 leading-relaxed max-w-4xl">
            {info.metaDescription} Every download unlocks{' '}
            <strong>both Editable Microsoft Word (.DOCX)</strong> (to customize your school
            name, teacher details, and dates for TSC TPAD 2) and{' '}
            <strong>Print-Ready (.PDF)</strong> formats instantly via M-Pesa STK Push.
          </p>

          {/* Subjects Covered Pills */}
          {subjects.length > 0 && (
            <div className="pt-2">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                {info.label} KICD Learning Areas / Subjects Covered ({subjects.length}):
              </h2>
              <div className="flex flex-wrap gap-1.5">
                {subjects.map((subj) => (
                  <Link
                    key={subj}
                    href={`/?grade=${encodeURIComponent(info.gradeKey)}&subject=${encodeURIComponent(subj)}`}
                    className="text-xs font-semibold bg-slate-100 hover:bg-emerald-50 hover:text-emerald-800 text-slate-700 px-3 py-1 rounded-lg border border-slate-200 transition"
                  >
                    {info.label} {subj}
                  </Link>
                ))}
              </div>
            </div>
          )}
        </section>

        {/* Quick Grade Switcher for Crawlers & Teachers */}
        <section aria-label="Browse Other CBC Grades" className="bg-emerald-950 text-white rounded-2xl p-4">
          <p className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-300 mb-2.5">
            Jump to Any CBC Grade Level (PP1 – Grade 12):
          </p>
          <div className="flex flex-wrap gap-1.5">
            {allGrades.map((g) => (
              <Link
                key={g.slug}
                href={`/grades/${g.slug}`}
                className={`text-xs font-bold px-3 py-1.5 rounded-lg transition ${
                  g.slug === info.slug
                    ? 'bg-amber-400 text-slate-950 font-black'
                    : 'bg-white/10 hover:bg-white/20 text-white'
                }`}
              >
                {g.label}
              </Link>
            ))}
          </div>
        </section>

        {/* Categorized Indexable Document Lists */}
        {byCategory.map((group) => (
          <section
            key={group.category}
            className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5 sm:p-6 space-y-4"
          >
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-lg font-black text-slate-900">
                  2026 {info.label} {group.category}
                </h2>
                <p className="text-xs text-slate-500">
                  Editable Word (.DOCX) + Print-Ready (.PDF) • Terms 1, 2 &amp; 3
                </p>
              </div>
              <Link
                href={`/?grade=${encodeURIComponent(info.gradeKey)}`}
                className="text-xs font-extrabold text-emerald-700 hover:text-emerald-900 underline"
              >
                Filter &amp; Preview All {group.list.length} Files &rarr;
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {group.list.map((doc) => (
                <article
                  key={doc.id}
                  className="border border-slate-200 hover:border-emerald-300 rounded-xl p-3.5 flex items-start justify-between gap-3 transition bg-slate-50/40"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold text-emerald-800">
                      <FileText className="w-3.5 h-3.5 shrink-0 text-emerald-600" />
                      <span>{doc.subject}</span>
                      <span>•</span>
                      <span>{formatTermLabel(doc.term)}</span>
                    </div>
                    <h3 className="text-xs sm:text-sm font-bold text-slate-900 leading-snug">
                      <Link
                        href={`/materials/${doc.id}`}
                        className="hover:text-emerald-700 hover:underline"
                      >
                        {doc.title}
                      </Link>
                    </h3>
                  </div>

                  <div className="shrink-0 text-right space-y-1.5">
                    <span className="block text-xs font-black text-emerald-800">
                      KES {doc.price}
                    </span>
                    <Link
                      href={`/?buy=${encodeURIComponent(doc.id)}`}
                      className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-extrabold px-2.5 py-1.5 rounded-lg transition whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-3 h-3" />
                      Download
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        ))}
      </main>

      <SiteFooter />
    </div>
  );
}
