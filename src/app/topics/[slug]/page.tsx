import React from 'react';
import type { Metadata } from 'next';
import { cacheLife } from 'next/cache';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  FileText,
  HelpCircle,
  Layers,
  Sparkles,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { formatGradeLabel, formatTermLabel } from '@/lib/material-utils';
import {
  getAllGradeSeoInfos,
  SITE_URL,
  type SeoResourceRow,
} from '@/lib/seo-catalog';
import {
  getTopicPillarBySlug,
  SEO_TOPIC_PILLARS,
} from '@/lib/seo-topics';
import SiteFooter from '@/components/SiteFooter';

async function getCachedTopicSampleMaterials(
  slug: string
): Promise<SeoResourceRow[]> {
  'use cache';
  cacheLife('hours');

  const pillar = getTopicPillarBySlug(slug);
  if (!pillar) return [];

  try {
    let query = supabaseAdmin
      .from('resources')
      .select(
        'id, title, grade, level, category, subject, term, price, format, file_path, created_at'
      );

    if (pillar.dbCategoryFilter) {
      query = query.eq('category', pillar.dbCategoryFilter);
    }
    if (pillar.dbSearchKeyword) {
      query = query.ilike('title', `%${pillar.dbSearchKeyword}%`);
    }

    const { data } = await query
      .order('grade', { ascending: true })
      .limit(36)
      .abortSignal(AbortSignal.timeout(8000));

    return (data as SeoResourceRow[]) || [];
  } catch {
    return [];
  }
}

type Props = {
  params: Promise<{ slug: string }>;
};

export function generateStaticParams() {
  return SEO_TOPIC_PILLARS.map((t) => ({ slug: t.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pillar = getTopicPillarBySlug(slug);
  if (!pillar) {
    return { title: 'CBC Topic Not Found' };
  }

  const canonicalUrl = `${SITE_URL}/topics/${pillar.slug}`;

  return {
    title: pillar.metaTitle,
    description: pillar.metaDescription,
    keywords: pillar.keywords,
    alternates: {
      canonical: canonicalUrl,
      languages: {
        'en-KE': canonicalUrl,
        en: canonicalUrl,
      },
    },
    openGraph: {
      title: `${pillar.metaTitle} | CBCMaterials Kenya`,
      description: pillar.metaDescription,
      url: canonicalUrl,
      siteName: 'CBC Kenya Resource Hub (cbcmaterials.shop)',
      locale: 'en_KE',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: pillar.metaTitle,
      description: pillar.metaDescription,
    },
  };
}

export default async function TopicPillarSeoPage({ params }: Props) {
  const { slug } = await params;
  const pillar = getTopicPillarBySlug(slug);
  if (!pillar) {
    redirect('/');
  }

  const sampleItems = await getCachedTopicSampleMaterials(pillar.slug);
  const allGrades = getAllGradeSeoInfos();
  const canonicalUrl = `${SITE_URL}/topics/${pillar.slug}`;

  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: 'CBCMaterials Kenya',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: pillar.navLabel,
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: pillar.h1Title,
      description: pillar.metaDescription,
      url: canonicalUrl,
      inLanguage: 'en-KE',
      isPartOf: {
        '@type': 'WebSite',
        name: 'CBC Kenya Resource Hub (cbcmaterials.shop)',
        url: SITE_URL,
      },
      ...(sampleItems.length > 0
        ? {
            mainEntity: {
              '@type': 'ItemList',
              numberOfItems: sampleItems.length,
              itemListElement: sampleItems.slice(0, 24).map((item, idx) => ({
                '@type': 'ListItem',
                position: idx + 1,
                url: `${SITE_URL}/materials/${item.id}`,
                name: item.title,
              })),
            },
          }
        : {}),
    },
    {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: pillar.faqs.map((f) => ({
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
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col justify-between">
      <div>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />

        {/* Top Bar */}
        <header className="bg-emerald-900 text-white border-b border-emerald-700">
          <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-black hover:text-amber-300 transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>CBCMaterials Kenya (www.cbcmaterials.shop)</span>
            </Link>
            <Link
              href={pillar.ctaHref}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black uppercase px-4 py-2 rounded-xl transition"
            >
              {pillar.ctaLabel}
            </Link>
          </div>
        </header>

        {/* Hero Section */}
        <section className="bg-gradient-to-br from-emerald-950 via-slate-900 to-slate-950 text-white py-10 sm:py-14 px-4 border-b border-emerald-800/60">
          <div className="max-w-5xl mx-auto space-y-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              {pillar.badgeText}
            </span>

            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight">
              {pillar.h1Title}
            </h1>

            <div className="space-y-3 text-sm sm:text-base text-emerald-100/95 leading-relaxed max-w-4xl">
              {pillar.introParagraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {pillar.highlights.map((h, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2.5 bg-white/10 border border-white/15 rounded-xl p-3 text-xs sm:text-sm font-semibold text-white"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{h}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <Link
                href={pillar.ctaHref}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm uppercase px-6 py-3.5 rounded-xl shadow-lg inline-flex items-center gap-2 transition"
              >
                <BookOpen className="w-4 h-4" />
                <span>{pillar.ctaLabel}</span>
              </Link>
              <Link
                href="/?area=kjsea"
                className="bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs sm:text-sm px-5 py-3.5 rounded-xl transition"
              >
                National KJSEA Examination (All Grades • KSh 50)
              </Link>
            </div>
          </div>
        </section>

        {/* Main Content */}
        <main className="max-w-6xl mx-auto px-4 py-10 space-y-10">
          {/* Featured Live Downloads in This Topic */}
          {sampleItems.length > 0 && (
            <section className="space-y-4">
              <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <h2 className="text-lg sm:text-xl font-black text-slate-900 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-emerald-700" />
                  <span>Featured Verified Downloads — {pillar.navLabel}</span>
                </h2>
                <Link
                  href={pillar.ctaHref}
                  className="text-xs font-black text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  View Full Catalog <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                {sampleItems.map((item) => {
                  const gKey =
                    item.grade === -1
                      ? 'PP1'
                      : item.grade === 0
                      ? 'PP2'
                      : String(item.grade);
                  return (
                    <Link
                      key={item.id}
                      href={`/materials/${item.id}`}
                      className="bg-white border border-slate-200 hover:border-emerald-400 rounded-xl p-4 shadow-xs hover:shadow-md transition flex flex-col justify-between gap-3"
                    >
                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-bold">
                          <span className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-800">
                            {formatGradeLabel(gKey)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-900">
                            {formatTermLabel(item.term)}
                          </span>
                          <span className="px-2 py-0.5 rounded bg-blue-50 text-blue-800">
                            DOCX + PDF
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug">
                          {item.title}
                        </h3>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                        <span className="font-black text-emerald-700">
                          KES {item.price}
                        </span>
                        <span className="font-bold text-slate-700">
                          Preview &amp; Download →
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </section>
          )}

          {/* Direct Grade Hubs (PP1 – Grade 12) */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-emerald-800">
              <Layers className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Select Your Grade Level (PP1, PP2 &amp; Grades 1–12)
              </h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-2">
              {allGrades.map((g) => (
                <Link
                  key={g.slug}
                  href={`/grades/${g.slug}`}
                  className="text-center text-xs font-black text-slate-800 hover:text-emerald-900 bg-slate-50 hover:bg-emerald-50 border border-slate-200 hover:border-emerald-400 rounded-xl px-3 py-2.5 transition"
                >
                  {g.label}
                </Link>
              ))}
            </div>
          </section>

          {/* Topic FAQs */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-800">
              <HelpCircle className="w-5 h-5" />
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Frequently Asked Questions — {pillar.navLabel}
              </h2>
            </div>
            <div className="space-y-3">
              {pillar.faqs.map((faq, idx) => (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5"
                >
                  <h3 className="text-sm font-extrabold text-slate-900">
                    {faq.q}
                  </h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                    {faq.a}
                  </p>
                </div>
              ))}
            </div>
          </section>

          {/* All Related Kenya Education Topic Hubs */}
          <section className="bg-white rounded-2xl border border-slate-200 p-6 space-y-3.5">
            <h2 className="text-base font-black text-slate-900 uppercase">
              Explore All Official CBC, KNEC, TSC, Notes &amp; Tuition Hubs
            </h2>
            <div className="flex flex-wrap gap-2">
              {SEO_TOPIC_PILLARS.map((tp) => (
                <Link
                  key={tp.slug}
                  href={`/topics/${tp.slug}`}
                  className={`px-3 py-2 rounded-xl text-xs font-bold border transition ${
                    tp.slug === pillar.slug
                      ? 'bg-emerald-700 text-white border-emerald-700'
                      : 'bg-slate-50 hover:bg-emerald-50 text-slate-800 border-slate-200 hover:border-emerald-300'
                  }`}
                >
                  {tp.navLabel}
                </Link>
              ))}
            </div>
          </section>
        </main>
      </div>

      <SiteFooter />
    </div>
  );
}
