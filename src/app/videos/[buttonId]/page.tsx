import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, Sparkles } from 'lucide-react';
import {
  buildOmnichannelButtonSeoPack,
  DEFAULT_OMNICHANNEL_PROFILES,
} from '@/lib/social-seo-engine';
import {
  SITE_ORIGIN,
  WEBSITE_BUTTONS_FOR_DAILY_STATUS,
} from '@/lib/whatsapp-status-autoposter';
import SocialVerticalVideoStudio from '@/components/SocialVerticalVideoStudio';
import SiteFooter from '@/components/SiteFooter';

type Props = {
  params: Promise<{ buttonId: string }>;
};

async function getCachedVideoSeoPack(buttonId: string) {
  'use cache';
  cacheLife('hours');
  const spec = WEBSITE_BUTTONS_FOR_DAILY_STATUS.find(
    (b) => b.buttonId === buttonId
  );
  if (!spec) return null;
  const now = new Date();
  return {
    uploadDateIso: now.toISOString(),
    pack: buildOmnichannelButtonSeoPack(spec, now.toISOString().slice(0, 10)),
  };
}

export function generateStaticParams() {
  return WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((b) => ({
    buttonId: b.buttonId,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { buttonId } = await params;
  const res =
    (await getCachedVideoSeoPack(buttonId)) ||
    (await getCachedVideoSeoPack(
      WEBSITE_BUTTONS_FOR_DAILY_STATUS[0].buttonId
    ))!;
  const { pack } = res;

  return {
    title: pack.youtubeTitle,
    description: pack.youtubeDescription.slice(0, 165),
    alternates: {
      canonical: pack.videoWatchUrl,
    },
    openGraph: {
      title: pack.youtubeTitle,
      description: pack.tiktokCaption.slice(0, 200),
      url: pack.videoWatchUrl,
      siteName: 'CBCMaterials Kenya (cbcmaterials.shop)',
      type: 'video.other',
      images: [
        {
          url: pack.posterCardUrl,
          width: 1200,
          height: 630,
          alt: pack.youtubeTitle,
        },
        {
          url: pack.posterVerticalUrl,
          width: 1080,
          height: 1920,
          alt: pack.youtubeTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: pack.youtubeTitle,
      description: pack.xTweetText,
      images: [pack.posterCardUrl],
    },
  };
}

export default async function VideoWatchPage({ params }: Props) {
  const { buttonId } = await params;
  const data = await getCachedVideoSeoPack(buttonId);
  if (!data) {
    redirect('/videos');
  }
  const { pack, uploadDateIso } = data;

  const videoSchemaJsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: pack.youtubeTitle,
      description: pack.youtubeDescription,
      thumbnailUrl: [pack.posterVerticalUrl, pack.posterCardUrl],
      uploadDate: uploadDateIso,
      duration: 'PT15S',
      embedUrl: pack.videoWatchUrl,
      contentUrl: pack.softSongUrl,
      inLanguage: 'en-KE',
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'CBCMaterials Kenya (cbcmaterials.shop)',
        url: SITE_ORIGIN,
        sameAs: [
          DEFAULT_OMNICHANNEL_PROFILES.facebookPageUrl,
          DEFAULT_OMNICHANNEL_PROFILES.facebookReelsUrl,
          DEFAULT_OMNICHANNEL_PROFILES.tiktokUrl,
          DEFAULT_OMNICHANNEL_PROFILES.youtubeUrl,
          DEFAULT_OMNICHANNEL_PROFILES.xTwitterUrl,
        ],
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'SocialMediaPosting',
      headline: pack.youtubeTitle,
      articleBody: pack.facebookPost,
      datePublished: uploadDateIso,
      url: pack.videoWatchUrl,
      sharedContent: {
        '@type': 'WebPage',
        url: pack.topicHubUrl,
      },
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(videoSchemaJsonLd) }}
      />

      <header className="bg-slate-950 text-white border-b border-emerald-500/30">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All 18 Official CBC Videos</span>
            </Link>
            <Link
              href={`/topics/${pack.topicSlug}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>View Full SEO Topic Catalog →</span>
            </Link>
          </div>

          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1 text-[11px] font-black uppercase tracking-wider text-amber-300">
              <Sparkles className="w-3.5 h-3.5" />
              <span>{pack.priceBadge}</span>
            </span>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight">
              {pack.youtubeTitle}
            </h1>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <SocialVerticalVideoStudio pack={pack} />

        <section className="rounded-3xl bg-white border border-slate-200 p-6 space-y-3 shadow-xs">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            About {pack.buttonLabel} on CBCMaterials Kenya
          </h2>
          <p className="text-xs sm:text-sm text-slate-700 whitespace-pre-line leading-relaxed">
            {pack.youtubeDescription}
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <Link
              href={pack.clickableUrl.replace(SITE_ORIGIN, '')}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md transition"
            >
              <span>Open {pack.buttonLabel} &amp; Download Instantly →</span>
            </Link>
            <Link
              href={`/topics/${pack.topicSlug}`}
              className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-900 font-bold text-xs sm:text-sm transition"
            >
              <span>Browse Related CBC Materials →</span>
            </Link>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
