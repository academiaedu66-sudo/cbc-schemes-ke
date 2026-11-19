import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { cacheLife } from 'next/cache';
import { redirect } from 'next/navigation';
import { ArrowLeft, BookOpen, Video } from 'lucide-react';
import {
  getCachedMaterialById,
  getCachedRelatedMaterials,
  getCachedSampleMaterialIds,
  gradeKeyToSlug,
} from '@/lib/seo-catalog';
import { getResourceGradeKey } from '@/lib/material-utils';
import {
  buildTutorPeterWhiteboardLesson,
  SITE_ORIGIN,
} from '@/lib/tutor-peter-videos';
import TutorPeterWhiteboardPlayer from '@/components/TutorPeterWhiteboardPlayer';
import SiteFooter from '@/components/SiteFooter';

type Props = {
  params: Promise<{ id: string }>;
};

async function getCachedUploadDateIso() {
  'use cache';
  cacheLife('days');
  return new Date().toISOString();
}

export async function generateStaticParams() {
  const ids = await getCachedSampleMaterialIds(24);
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
      title: 'Tutor Peter Whiteboard Class | CBCMaterials Kenya',
    };
  }

  const lesson = buildTutorPeterWhiteboardLesson(item);
  return {
    title: lesson.youtubeTitle,
    description: lesson.youtubeDescription.slice(0, 165),
    alternates: {
      canonical: lesson.watchPageUrl,
    },
    openGraph: {
      title: lesson.youtubeTitle,
      description: lesson.spokenIntro,
      url: lesson.watchPageUrl,
      siteName: 'CBCMaterials Kenya — Tutor Peter Classroom',
      type: 'video.other',
      images: [
        {
          url: lesson.thumbnailUrl,
          width: 1280,
          height: 720,
          alt: lesson.youtubeTitle,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: lesson.youtubeTitle,
      description: lesson.spokenIntro,
      images: [lesson.thumbnailUrl],
    },
  };
}

export default async function MaterialWhiteboardVideoPage({ params }: Props) {
  const { id } = await params;
  const item = await getCachedMaterialById(id);
  if (!item) {
    redirect('/videos');
  }

  const [related, uploadDateIso] = await Promise.all([
    getCachedRelatedMaterials(item.grade, item.subject, item.id),
    getCachedUploadDateIso(),
  ]);

  const lesson = buildTutorPeterWhiteboardLesson(item);
  const gradeSlug = gradeKeyToSlug(getResourceGradeKey(item));

  // Google VideoObject + Key Moments (Clip) + LearningResource Structured Data
  const jsonLd = [
    {
      '@context': 'https://schema.org',
      '@type': 'VideoObject',
      name: lesson.youtubeTitle,
      description: lesson.youtubeDescription,
      thumbnailUrl: [lesson.thumbnailUrl],
      uploadDate: item.created_at || uploadDateIso,
      duration: 'PT36S',
      embedUrl: lesson.watchPageUrl,
      contentUrl: `${SITE_ORIGIN}${lesson.voiceoverUrl}`,
      inLanguage: 'en-KE',
      educationalLevel: lesson.gradeLabel,
      author: {
        '@type': 'Person',
        name: 'Tutor Peter',
        jobTitle: 'CBC Curriculum Educator & Tutor',
        url: `${SITE_ORIGIN}/videos`,
      },
      publisher: {
        '@type': 'EducationalOrganization',
        name: 'CBCMaterials Kenya (cbcmaterials.shop)',
        url: SITE_ORIGIN,
      },
      hasPart: [
        {
          '@type': 'Clip',
          name: 'Tutor Peter Welcome & Lesson Overview',
          startOffset: 0,
          endOffset: 7,
          url: `${lesson.watchPageUrl}#t=0`,
        },
        {
          '@type': 'Clip',
          name: 'Core KICD Strands on the Whiteboard',
          startOffset: 7,
          endOffset: 19,
          url: `${lesson.watchPageUrl}#t=7`,
        },
        {
          '@type': 'Clip',
          name: lesson.workedBoxTitle,
          startOffset: 19,
          endOffset: 29,
          url: `${lesson.watchPageUrl}#t=19`,
        },
        {
          '@type': 'Clip',
          name: 'Summary & Word/PDF Download',
          startOffset: 29,
          endOffset: 36,
          url: `${lesson.watchPageUrl}#t=29`,
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <header className="bg-slate-950 text-white border-b border-emerald-500/30">
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href="/videos"
              className="inline-flex items-center gap-2 text-xs font-bold text-emerald-300 hover:text-emerald-200"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>All Tutor Peter Whiteboard Classes</span>
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href={`/grades/${gradeSlug}`}
                className="px-3 py-1.5 rounded-full bg-white/10 text-xs font-bold text-slate-200 hover:bg-white/20"
              >
                {lesson.gradeLabel} Hub
              </Link>
              <Link
                href={`/materials/${item.id}`}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>Download Word + PDF (KES {lesson.price}) →</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tutor-peter-portrait.jpg"
              alt="Tutor Peter"
              className="w-12 h-12 rounded-full object-cover border-2 border-amber-400 shrink-0"
            />
            <div>
              <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-amber-300">
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span>
                  TUTOR PETER WHITEBOARD DEMONSTRATION • {lesson.gradeLabel} •{' '}
                  {lesson.subject}
                </span>
              </span>
              <h1 className="text-xl sm:text-3xl font-black tracking-tight">
                {lesson.youtubeTitle}
              </h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 flex-1 w-full space-y-8">
        <TutorPeterWhiteboardPlayer material={item} />

        {/* Spoken Transcript (Indexed by Google & YouTube Search!) */}
        <section className="rounded-3xl bg-white border border-slate-200 p-6 space-y-3 shadow-xs">
          <h2 className="text-base sm:text-lg font-black text-slate-900">
            Full Whiteboard Lesson Transcript — Tutor Peter
          </h2>
          <p className="text-sm text-slate-700 leading-relaxed">
            {lesson.fullVoiceoverText}
          </p>
        </section>

        {/* Related Material Whiteboard Classes */}
        {related.length > 0 && (
          <section className="space-y-3">
            <h2 className="text-base font-black text-slate-900">
              More {lesson.gradeLabel} {lesson.subject} Whiteboard Classes by
              Tutor Peter
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {related.slice(0, 6).map((rel) => (
                <Link
                  key={rel.id}
                  href={`/videos/material/${rel.id}`}
                  className="rounded-2xl bg-white border border-slate-200 p-4 hover:border-emerald-400 hover:shadow-sm transition space-y-1.5"
                >
                  <span className="text-[10px] font-black uppercase text-red-600">
                    ▶ Watch Whiteboard Class
                  </span>
                  <h3 className="text-xs font-bold text-slate-900 line-clamp-2">
                    {rel.title}
                  </h3>
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
