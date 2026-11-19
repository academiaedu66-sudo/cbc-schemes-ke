import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { ArrowLeft, ExternalLink, Film, Rss, Sparkles } from 'lucide-react';
import { getAllOmnichannelButtonSeoPacks } from '@/lib/social-seo-engine';
import { SITE_ORIGIN } from '@/lib/whatsapp-status-autoposter';
import SiteFooter from '@/components/SiteFooter';

async function getCachedAllVideoSeoPacks() {
  'use cache';
  cacheLife('hours');
  const todayIso = new Date().toISOString().slice(0, 10);
  return {
    uploadDateIso: new Date().toISOString(),
    packs: getAllOmnichannelButtonSeoPacks(todayIso),
  };
}

export const metadata: Metadata = {
  title:
    'CBC Kenya Video Hub — TikTok, YouTube Shorts, Facebook Reels & X Guides (PP1–Grade 12)',
  description:
    'Watch & share official 2026 CBCMaterials Kenya vertical videos covering CBC Schemes of Work, Teachers Notes, National KJSEA & KPSEA Examinations, TSC Services, and Tuition Tutors across PP1–Grade 12.',
  alternates: {
    canonical: `${SITE_ORIGIN}/videos`,
  },
};

export default async function SocialVideosIndexPage() {
  const { uploadDateIso, packs } = await getCachedAllVideoSeoPacks();

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'CBCMaterials Kenya Official Educational Shorts & Reels Catalog',
    url: `${SITE_ORIGIN}/videos`,
    numberOfItems: packs.length,
    itemListElement: packs.map((p, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      url: p.videoWatchUrl,
      item: {
        '@type': 'VideoObject',
        name: p.youtubeTitle,
        description: p.youtubeDescription.slice(0, 280),
        thumbnailUrl: [p.posterVerticalUrl, p.posterCardUrl],
        uploadDate: uploadDateIso,
        duration: 'PT15S',
        embedUrl: p.videoWatchUrl,
        contentUrl: p.softSongUrl,
      },
    })),
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />

      <header className="bg-slate-950 text-white border-b border-emerald-500/30">
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to CBCMaterials Kenya Home</span>
            </Link>
            <a
              href="/social-feed.xml"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-bold"
            >
              <Rss className="w-3.5 h-3.5" />
              <span>RSS Social Feed (/social-feed.xml)</span>
            </a>
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 text-[11px] font-black uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>TikTok • YouTube Shorts • Facebook Reels • X (Twitter)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Official CBCMaterials Kenya Social &amp; Video Hub (2026)
            </h1>
            <p className="text-sm text-slate-300 max-w-3xl">
              Explore all 18 official 9:16 vertical guides for 2026 KICD
              Rationalized CBC Schemes of Work, Teachers&apos; Notes, KNEC KJSEA
              &amp; KPSEA Examinations, TSC Services, and Verified Tuition Tutors.
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {packs.map((pack) => (
            <article
              key={pack.buttonId}
              className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition flex flex-col"
            >
              <Link
                href={`/videos/${pack.buttonId}`}
                className="relative aspect-[16/10] bg-slate-900 overflow-hidden block"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={pack.posterCardUrl.replace(SITE_ORIGIN, '')}
                  alt={pack.youtubeTitle}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
                <span className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-slate-950/90 text-amber-300 text-[10px] font-black">
                  9:16 SHORT + SONG
                </span>
              </Link>

              <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                  <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                    {pack.priceBadge}
                  </span>
                  <h2 className="text-base font-black text-slate-900 leading-snug">
                    <Link
                      href={`/videos/${pack.buttonId}`}
                      className="hover:text-emerald-700"
                    >
                      {pack.buttonLabel}
                    </Link>
                  </h2>
                  <p className="text-xs text-slate-600 line-clamp-2">
                    {pack.youtubeTitle}
                  </p>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <Link
                    href={`/videos/${pack.buttonId}`}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold transition"
                  >
                    <Film className="w-3.5 h-3.5 text-amber-300" />
                    <span>Watch &amp; Share</span>
                  </Link>
                  <Link
                    href={pack.clickableUrl.replace(SITE_ORIGIN, '')}
                    className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition"
                  >
                    <span>Open Hub</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
