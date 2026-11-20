import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/topics/',
          '/grades/',
          '/materials/',
          '/videos/',
          '/videos',
          '/go',
          '/go/',
          '/whatsapp-ad',
          '/status-ad/',
          '/social-feed.xml',
          '/video-sitemap.xml',
          '/opensearch.xml',
          '/ads.txt',
          '/advertise',
          '/privacy-policy',
          '/terms',
        ],
        disallow: ['/admin', '/mobile-admin', '/monetization', '/api/admin/'],
      },
      {
        userAgent: 'Googlebot',
        allow: [
          '/',
          '/topics/',
          '/grades/',
          '/materials/',
          '/videos/',
          '/videos',
          '/social-feed.xml',
          '/video-sitemap.xml',
          '/opensearch.xml',
        ],
        disallow: ['/admin', '/mobile-admin', '/api/admin/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    host: 'https://www.cbcmaterials.shop',
    sitemap: [
      'https://www.cbcmaterials.shop/sitemap.xml',
      'https://www.cbcmaterials.shop/video-sitemap.xml',
    ],
  };
}
