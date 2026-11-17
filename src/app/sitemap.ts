import type { MetadataRoute } from 'next';

const BASE_URL = 'https://www.cbcmaterials.shop';
const LAST_MODIFIED = '2026-01-15T00:00:00.000Z';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE_URL,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/advertise`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE_URL}/privacy-policy`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${BASE_URL}/terms`,
      lastModified: LAST_MODIFIED,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
  ];
}
