import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import {
  ArrowLeft,
  ExternalLink,
  Film,
  Play,
  Rss,
  Sparkles,
  Video,
} from 'lucide-react';
import { supabaseAdmin } from '@/lib/supabase';
import { getAllOmnichannelButtonSeoPacks } from '@/lib/social-seo-engine';
import { SITE_ORIGIN } from '@/lib/whatsapp-status-autoposter';
import {
  buildTutorPeterWhiteboardLesson,
  type MaterialVideoInput,
} from '@/lib/tutor-peter-videos';
import TutorPeterWhiteboardPlayer from '@/components/TutorPeterWhiteboardPlayer';
import SiteFooter from '@/components/SiteFooter';

async function getCachedVideosHubData() {
  'use cache';
  cacheLife('hours');
  const todayIso = new Date().toISOString().slice(0, 10);
  const { data } = await supabaseAdmin
    .from('resources')
    .select('id, title, grade, level, category, subject, term, price')
    .order('created_at', { ascending: false })
    .limit(36);

  return {
    uploadDateIso: new Date().toISOString(),
    packs: getAllOmnichannelButtonSeoPacks(todayIso),
    featuredMaterials: ((data || []) as MaterialVideoInput[]).slice(0, 36),
  };
}

export const metadata: Metadata = {
  title:
    "Tutor Peter's CBC Whiteboard Class Videos (All 6,534+ Materials) | YouTube, TikTok & Reels",
  description:
    'Watch Tutor Peter teach every 2026 CBC Scheme of Work, Lesson Plan, Teachers Note, and KNEC KJSEA/KPSEA Exam on a clean studio whiteboard ("Tutor Peter here, welcome to our today\'s class!").',
  alternates: {
    canonical: `${SITE_ORIGIN}/videos`,
  },
};

export default async function SocialVideosIndexPage() {
  const { uploadDateIso, packs, featuredMaterials } =
    await getCachedVideosHubData();

  const spotlightMaterial: MaterialVideoInput = featuredMaterials[0] || {
    id: 'spotlight-class',
    title: 'Grade 8 Mathematics — KENYA NATIONAL KJSEA TEST & Worked Solutions',
    grade: 8,
    level: 'JSS',
    category: 'NATIONAL KJSEA EXAMINATION (ALL GRADES)',
    subject: 'Mathematics',
    term: 1,
    price: 50,
  };

  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: "Tutor Peter's CBC Whiteboard Class Videos Catalog",
    url: `${SITE_ORIGIN}/videos`,
    numberOfItems: featuredMaterials.length,
    itemListElement: featuredMaterials.slice(0, 20).map((m, idx) => {
      const lsn = buildTutorPeterWhiteboardLesson(m);
      return {
        '@type': 'ListItem',
        position: idx + 1,
        url: lsn.watchPageUrl,
        item: {
          '@type': 'VideoObject',
          name: lsn.youtubeTitle,
          description: lsn.spokenIntro,
          thumbnailUrl: [lsn.thumbnailUrl],
          uploadDate: uploadDateIso,
          duration: 'PT36S',
          embedUrl: lsn.watchPageUrl,
        },
      };
    }),
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
            <div className="flex flex-wrap items-center gap-2">
              <a
                href="/video-sitemap.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-400/40 text-emerald-200 text-xs font-bold"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Google Video Sitemap (/video-sitemap.xml)</span>
              </a>
              <a
                href="/social-feed.xml"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/15 border border-amber-300/40 text-amber-200 text-xs font-bold"
              >
                <Rss className="w-3.5 h-3.5" />
                <span>RSS Feed (/social-feed.xml)</span>
              </a>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tutor-peter-portrait.jpg"
              alt="Tutor Peter"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400 shadow-lg shrink-0"
            />
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-600/20 border border-red-400/40 text-red-300 text-[11px] font-black uppercase tracking-wider">
                <Video className="w-3.5 h-3.5 text-red-400" />
                <span>
                  16:9 YOUTUBE FULL HD WHITEBOARD DEMONSTRATIONS • AUTO-POST
                  READY
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
                Tutor Peter&apos;s CBC Whiteboard Class Videos (PP1–Grade 12)
              </h1>
              <p className="text-sm text-slate-300 max-w-3xl">
                &ldquo;Tutor Peter here, welcome to our today&apos;s
                class!&rdquo; — Watch live whiteboard demonstrations for every
                CBC material, download 16:9 YouTube HD videos, or auto-post
                directly to YouTube &amp; all social platforms.
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-12">
        {/* Featured Live Tutor Peter Whiteboard Studio */}
        <section className="space-y-3">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            Featured Whiteboard Demonstration with Tutor Peter
          </h2>
          <TutorPeterWhiteboardPlayer material={spotlightMaterial} />
        </section>

        {/* Individual Material Whiteboard Classes */}
        <section className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-lg sm:text-xl font-black text-slate-900">
                Material-by-Material Whiteboard Classes (6,534+ CBC Resources)
              </h2>
              <p className="text-xs text-slate-600">
                Every material on cbcmaterials.shop has its own Tutor Peter
                whiteboard video, custom 1280×720 YouTube thumbnail, and SEO
                watch page.
              </p>
            </div>
            <Link
              href="/?videos=open"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black"
            >
              <Play className="w-3.5 h-3.5 fill-white" />
              <span>Search All 6,534+ Material Videos →</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {featuredMaterials.map((mat) => {
              const lsn = buildTutorPeterWhiteboardLesson(mat);
              return (
                <article
                  key={mat.id}
                  className="rounded-2xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
                >
                  <Link
                    href={`/videos/material/${mat.id}`}
                    className="relative aspect-video bg-slate-900 block overflow-hidden"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={`/api/videos/thumbnail?materialId=${encodeURIComponent(
                        mat.id
                      )}`}
                      alt={lsn.youtubeTitle}
                      loading="lazy"
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                    />
                    <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-slate-950/90 text-white text-[10px] font-black">
                      0:36 HD
                    </span>
                  </Link>
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <span className="text-[10px] font-black uppercase text-emerald-700">
                        {lsn.gradeLabel} • {lsn.subject}
                      </span>
                      <h3 className="text-xs sm:text-sm font-black text-slate-900 line-clamp-2 mt-0.5">
                        <Link
                          href={`/videos/material/${mat.id}`}
                          className="hover:text-emerald-700"
                        >
                          {mat.title}
                        </Link>
                      </h3>
                    </div>
                    <div className="flex items-center gap-2">
                      <Link
                        href={`/videos/material/${mat.id}`}
                        className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-black"
                      >
                        <Play className="w-3.5 h-3.5 fill-white" />
                        <span>Watch Tutor Peter</span>
                      </Link>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        </section>

        {/* 18 Official Service Shorts */}
        <section className="space-y-4">
          <h2 className="text-lg sm:text-xl font-black text-slate-900">
            18 Website Button Vertical Shorts (TikTok, YouTube Shorts &amp;
            Reels)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {packs.map((pack) => (
              <article
                key={pack.buttonId}
                className="rounded-3xl bg-white border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition flex flex-col"
              >
                <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">
                      {pack.priceBadge}
                    </span>
                    <h3 className="text-sm font-black text-slate-900 mt-1">
                      {pack.buttonLabel}
                    </h3>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/videos/${pack.buttonId}`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold"
                    >
                      <Film className="w-3.5 h-3.5 text-amber-300" />
                      <span>9:16 Short Studio</span>
                    </Link>
                    <Link
                      href={pack.clickableUrl.replace(SITE_ORIGIN, '')}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                    >
                      <span>Open</span>
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
