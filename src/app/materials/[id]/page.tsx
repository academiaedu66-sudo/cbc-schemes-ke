import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Download,
  FileCheck2,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  formatGradeLabel,
  formatTermLabel,
  getLevelForGrade,
} from '@/lib/material-utils';
import {
  buildMaterialRichDescription,
  getCachedMaterialById,
  getCachedRelatedMaterials,
  getCachedSampleMaterialIds,
  gradeKeyToSlug,
  SITE_URL,
} from '@/lib/seo-catalog';
import SiteFooter from '@/components/SiteFooter';

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateStaticParams() {
  const ids = await getCachedSampleMaterialIds(28);
  if (ids.length === 0) {
    return [{ id: '00000000-0000-0000-0000-000000000000' }];
  }
  return ids.map((id) => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const item = await getCachedMaterialById(id);

  if (!item) {
    return {
      title: 'CBC Material Not Found',
      robots: { index: false, follow: true },
    };
  }

  const gKey =
    item.grade === -1 ? 'PP1' : item.grade === 0 ? 'PP2' : String(item.grade);
  const gLabel = formatGradeLabel(gKey);
  const termLabel = formatTermLabel(item.term);
  const desc = buildMaterialRichDescription(item);
  const canonicalUrl = `${SITE_URL}/materials/${item.id}`;

  return {
    title: `${item.title} — ${gLabel} ${item.subject} (${termLabel}) Word & PDF`,
    description: desc,
    keywords: [
      item.title,
      `2026 ${gLabel} ${item.subject} ${item.category}`,
      `${gLabel} ${item.subject} ${termLabel} PDF Word`,
      `KICD ${gLabel} ${item.subject} notes and schemes`,
      `CBC ${item.category} Kenya`,
    ],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${item.title} (KES ${item.price} — Editable DOCX + PDF)`,
      description: desc,
      url: canonicalUrl,
      siteName: 'CBC Kenya Resource Hub',
      locale: 'en_KE',
      type: 'article',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${item.title} | cbcmaterials.shop`,
      description: desc,
    },
  };
}

export default async function MaterialSeoDetailPage({ params }: Props) {
  const { id } = await params;
  const item = await getCachedMaterialById(id);

  if (!item) {
    notFound();
  }

  const gKey =
    item.grade === -1 ? 'PP1' : item.grade === 0 ? 'PP2' : String(item.grade);
  const gLabel = formatGradeLabel(gKey);
  const gSlug = gradeKeyToSlug(gKey);
  const levelLabel = getLevelForGrade(gKey);
  const termLabel = formatTermLabel(item.term);
  const desc = buildMaterialRichDescription(item);
  const canonicalUrl = `${SITE_URL}/materials/${item.id}`;

  const related = await getCachedRelatedMaterials(item.grade, item.subject, item.id);

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
          name: `${gLabel} CBC Materials`,
          item: `${SITE_URL}/grades/${gSlug}`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: item.title,
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: item.title,
      description: desc,
      sku: item.id,
      category: `${levelLabel} > ${gLabel} > ${item.category}`,
      brand: {
        '@type': 'Brand',
        name: 'CBC Kenya Resource Hub',
      },
      offers: {
        '@type': 'Offer',
        url: canonicalUrl,
        priceCurrency: 'KES',
        price: String(item.price),
        availability: 'https://schema.org/InStock',
        seller: {
          '@type': 'EducationalOrganization',
          name: 'CBC Kenya Resource Hub (cbcmaterials.shop)',
        },
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-emerald-900 text-white border-b border-emerald-800">
        <div className="max-w-5xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-white font-black text-lg hover:text-emerald-200 transition"
          >
            <BookOpen className="w-6 h-6 text-emerald-300" />
            <span>CBC Kenya Resource Hub</span>
          </Link>

          <Link
            href={`/grades/${gSlug}`}
            className="text-xs font-bold bg-white/10 hover:bg-white/20 px-3.5 py-2 rounded-xl transition"
          >
            Browse All {gLabel} Materials &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="text-xs text-slate-500 flex flex-wrap items-center gap-2">
          <Link href="/" className="hover:text-emerald-700 font-semibold inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Home
          </Link>
          <span>/</span>
          <Link href={`/grades/${gSlug}`} className="hover:text-emerald-700 font-semibold">
            {gLabel} ({levelLabel})
          </Link>
          <span>/</span>
          <span className="font-bold text-slate-800 truncate max-w-md">{item.title}</span>
        </nav>

        {/* Main Document Card */}
        <article className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
          <div className="flex flex-wrap items-center gap-2 text-xs font-bold">
            <span className="bg-emerald-700 text-white px-3 py-1 rounded-lg font-black">
              {gLabel}
            </span>
            <span className="bg-emerald-50 text-emerald-900 border border-emerald-200 px-3 py-1 rounded-lg">
              {item.category}
            </span>
            <span className="bg-slate-100 text-slate-700 px-3 py-1 rounded-lg">
              {item.subject}
            </span>
            <span className="bg-amber-100 text-amber-950 px-3 py-1 rounded-lg">
              {termLabel} • 2026 KICD Rationalized
            </span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
            {item.title}
          </h1>

          <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
            {desc}
          </p>

          {item.strands && (
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-1">
              <h2 className="text-xs font-black uppercase tracking-wider text-slate-500">
                Key KICD Strands &amp; Sub-Strands Covered:
              </h2>
              <p className="text-xs sm:text-sm text-slate-700">{item.strands}</p>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <FileCheck2 className="w-5 h-5 text-emerald-700 shrink-0" />
              <div>
                <p className="font-black text-emerald-950">Editable Word (.DOCX)</p>
                <p className="text-slate-600">Customize school name, teacher &amp; dates</p>
              </div>
            </div>
            <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <FileText className="w-5 h-5 text-blue-700 shrink-0" />
              <div>
                <p className="font-black text-blue-950">Print-Ready (.PDF)</p>
                <p className="text-slate-600">Included automatically with your unlock</p>
              </div>
            </div>
            <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5">
              <Sparkles className="w-5 h-5 text-amber-700 shrink-0" />
              <div>
                <p className="font-black text-amber-950">Instant M-Pesa STK Unlock</p>
                <p className="text-slate-600">Opens automatically within 1 second of PIN</p>
              </div>
            </div>
          </div>

          <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-t border-slate-100">
            <div>
              <span className="text-xs font-bold uppercase text-slate-500 block">
                Instant Download Price (Word + PDF Bundle)
              </span>
              <span className="text-3xl font-black text-emerald-800">
                KES {item.price}
              </span>
            </div>

            <div className="flex flex-wrap gap-3">
              <Link
                href={`/?preview=${encodeURIComponent(item.id)}`}
                className="inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-sm px-5 py-3.5 rounded-xl transition"
              >
                Preview Sample Pages
              </Link>
              <Link
                href={`/?buy=${encodeURIComponent(item.id)}`}
                className="inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow-md transition"
              >
                <Download className="w-4 h-4" />
                Buy &amp; Download Instantly (KES {item.price})
              </Link>
            </div>
          </div>
        </article>

        {/* Related Materials Internal SEO Links */}
        {related.length > 0 && (
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <h2 className="text-base font-black text-slate-900">
              More 2026 {gLabel} {item.subject} CBC Documents
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {related.map((rel) => (
                <Link
                  key={rel.id}
                  href={`/materials/${rel.id}`}
                  className="border border-slate-200 hover:border-emerald-400 rounded-xl p-3.5 flex items-center justify-between gap-3 transition"
                >
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-emerald-700 block">
                      {rel.category} • {formatTermLabel(rel.term)}
                    </span>
                    <span className="text-xs sm:text-sm font-bold text-slate-900 truncate block">
                      {rel.title}
                    </span>
                  </div>
                  <span className="shrink-0 text-xs font-black text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    KES {rel.price}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </main>

      <SiteFooter />
    </div>
  );
}
