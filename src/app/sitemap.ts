import type { MetadataRoute } from 'next';
import {
  getAllGradeSeoInfos,
  getCachedAllSitemapResources,
  SITE_URL,
} from '@/lib/seo-catalog';
import { SEO_TOPIC_PILLARS } from '@/lib/seo-topics';
import { WEBSITE_BUTTONS_FOR_DAILY_STATUS } from '@/lib/whatsapp-status-autoposter';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const nowIso = new Date().toISOString();
  const gradeHubs = getAllGradeSeoInfos();
  const materials = await getCachedAllSitemapResources();

  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: SITE_URL,
      lastModified: nowIso,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${SITE_URL}/videos`,
      lastModified: nowIso,
      changeFrequency: 'daily',
      priority: 0.97,
    },
    ...SEO_TOPIC_PILLARS.map((tp) => ({
      url: `${SITE_URL}/topics/${tp.slug}`,
      lastModified: nowIso,
      changeFrequency: 'daily' as const,
      priority: 0.98,
    })),
    ...WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((btn) => ({
      url: `${SITE_URL}/videos/${btn.buttonId}`,
      lastModified: nowIso,
      changeFrequency: 'daily' as const,
      priority: 0.94,
    })),
    ...WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((btn) => ({
      url: `${SITE_URL}/status-ad/${btn.buttonId}`,
      lastModified: nowIso,
      changeFrequency: 'daily' as const,
      priority: 0.9,
    })),
    ...gradeHubs.map((g) => ({
      url: `${SITE_URL}/grades/${g.slug}`,
      lastModified: nowIso,
      changeFrequency: 'daily' as const,
      priority: 0.95,
    })),
    {
      url: `${SITE_URL}/advertise`,
      lastModified: nowIso,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: `${SITE_URL}/privacy-policy`,
      lastModified: '2026-01-15T00:00:00.000Z',
      changeFrequency: 'monthly',
      priority: 0.4,
    },
    {
      url: `${SITE_URL}/terms`,
      lastModified: '2026-01-15T00:00:00.000Z',
      changeFrequency: 'monthly',
      priority: 0.4,
    },
  ];

  const materialEntries: MetadataRoute.Sitemap = materials.map((m) => ({
    url: `${SITE_URL}/materials/${m.id}`,
    lastModified: m.created_at || nowIso,
    changeFrequency: 'weekly',
    priority: 0.85,
  }));

  return [...staticEntries, ...materialEntries];
}
