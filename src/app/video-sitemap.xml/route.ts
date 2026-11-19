import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import {
  buildTutorPeterWhiteboardLesson,
  SITE_ORIGIN,
  type MaterialVideoInput,
} from '@/lib/tutor-peter-videos';
import { getPublishedVideosLedger } from '@/app/api/videos/youtube-upload/route';

function escapeXml(raw: string): string {
  return (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const [publishedLedger, { data: sampleMaterials }] = await Promise.all([
    getPublishedVideosLedger(),
    supabaseAdmin
      .from('resources')
      .select('id, title, grade, level, category, subject, term, price')
      .order('created_at', { ascending: false })
      .limit(350),
  ]);

  const publishedMap = new Map(
    publishedLedger.map((p) => [p.materialId, p] as const)
  );

  const items = ((sampleMaterials || []) as MaterialVideoInput[]).slice(0, 350);
  const nowIso = new Date().toISOString();

  const urlNodes = items
    .map((item) => {
      const lesson = buildTutorPeterWhiteboardLesson(item);
      const pub = publishedMap.get(item.id);
      const contentLocXml = pub?.publicVideoUrl
        ? `\n      <video:content_loc>${escapeXml(
            pub.publicVideoUrl
          )}</video:content_loc>`
        : '';

      return `  <url>
    <loc>${escapeXml(lesson.watchPageUrl)}</loc>
    <video:video>
      <video:thumbnail_loc>${escapeXml(lesson.thumbnailUrl)}</video:thumbnail_loc>
      <video:title>${escapeXml(lesson.youtubeTitle)}</video:title>
      <video:description>${escapeXml(
        lesson.youtubeDescription.slice(0, 950)
      )}</video:description>${contentLocXml}
      <video:player_loc>${escapeXml(
        pub?.youtubeWatchUrl || lesson.watchPageUrl
      )}</video:player_loc>
      <video:duration>${lesson.durationSeconds}</video:duration>
      <video:publication_date>${escapeXml(
        pub?.publishedAtIso || nowIso
      )}</video:publication_date>
      <video:family_friendly>yes</video:family_friendly>
      <video:live>no</video:live>
    </video:video>
  </url>`;
    })
    .join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlNodes}
</urlset>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=1800, stale-while-revalidate=7200',
    },
  });
}
