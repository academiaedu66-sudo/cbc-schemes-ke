import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/grades/',
          '/materials/',
          '/ads.txt',
          '/advertise',
          '/privacy-policy',
          '/terms',
        ],
        disallow: ['/admin', '/mobile-admin', '/monetization', '/api/admin/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    host: 'https://www.cbcmaterials.shop',
    sitemap: 'https://www.cbcmaterials.shop/sitemap.xml',
  };
}
