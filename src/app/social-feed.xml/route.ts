import { NextResponse } from 'next/server';
import { getAllOmnichannelButtonSeoPacks } from '@/lib/social-seo-engine';
import { SEO_TOPIC_PILLARS } from '@/lib/seo-topics';
import { SITE_ORIGIN, getEatDateAndHour } from '@/lib/whatsapp-status-autoposter';

function escapeXml(raw: string): string {
  return (raw || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export async function GET() {
  const { dateEat } = getEatDateAndHour();
  const packs = getAllOmnichannelButtonSeoPacks(dateEat);
  const nowRfc822 = new Date().toUTCString();

  const buttonItemsXml = packs
    .map((pack, idx) => {
      const itemPubDate = new Date(Date.now() - idx * 1800_000).toUTCString();
      return `    <item>
      <title>${escapeXml(pack.youtubeTitle)}</title>
      <link>${escapeXml(pack.videoWatchUrl)}</link>
      <guid isPermaLink="false">${escapeXml(
        `cbcmaterials-${dateEat}-${pack.buttonId}`
      )}</guid>
      <pubDate>${itemPubDate}</pubDate>
      <description>${escapeXml(pack.youtubeDescription)}</description>
      <enclosure url="${escapeXml(pack.posterVerticalUrl)}" type="image/png" length="245000" />
      <media:content url="${escapeXml(
        pack.posterVerticalUrl
      )}" medium="image" type="image/png" width="1080" height="1920" />
      <media:thumbnail url="${escapeXml(pack.posterCardUrl)}" width="1200" height="630" />
    </item>`;
    })
    .join('\n');

  const topicItemsXml = SEO_TOPIC_PILLARS.map((tp, idx) => {
    const url = `${SITE_ORIGIN}/topics/${tp.slug}`;
    const itemPubDate = new Date(
      Date.now() - (packs.length + idx) * 1800_000
    ).toUTCString();
    return `    <item>
      <title>${escapeXml(tp.h1Title)} | CBCMaterials Kenya</title>
      <link>${escapeXml(url)}</link>
      <guid isPermaLink="true">${escapeXml(url)}</guid>
      <pubDate>${itemPubDate}</pubDate>
      <description>${escapeXml(tp.metaDescription)}</description>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>CBCMaterials Kenya (cbcmaterials.shop) — Official Social &amp; Video SEO Feed</title>
    <link>${SITE_ORIGIN}</link>
    <atom:link href="${SITE_ORIGIN}/social-feed.xml" rel="self" type="application/rss+xml" />
    <description>Daily 2026 KICD Rationalized CBC Schemes of Work, Teachers Notes, KNEC KJSEA &amp; KPSEA Examinations, TSC Services &amp; Verified Tuition Tutors in Kenya — Optimized for TikTok, YouTube Shorts, Facebook Reels &amp; X (Twitter).</description>
    <language>en-ke</language>
    <lastBuildDate>${nowRfc822}</lastBuildDate>
    <item>
      <title>${escapeXml('NATIONAL CONTEST (Grades 6, 7, 8 & 9) — Win Brand New Laptop, KSh 20,000 School Fee & School Uniforms | cbcmaterials.shop')}</title>
      <link>${SITE_ORIGIN}/contest</link>
      <guid isPermaLink="false">${escapeXml(`cbcmaterials-${dateEat}-national-contest`)}</guid>
      <pubDate>${nowRfc822}</pubDate>
      <description>${escapeXml('Join the National CBC Contest for Grades 6, 7, 8 & 9 across all subjects (KSh 500 per subject test, 100 marks, 2 hours). 1st Place: Brand New Laptop + KSh 20,000 School Fee + New School Uniform. 2nd: KSh 10,000 + School Uniform. 3rd: KSh 5,000 + School Uniform. Register now at https://www.cbcmaterials.shop/contest')}</description>
    </item>
${buttonItemsXml}
${topicItemsXml}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600',
    },
  });
}
