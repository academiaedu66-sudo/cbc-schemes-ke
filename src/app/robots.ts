import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ads.txt', '/advertise', '/privacy-policy', '/terms'],
        disallow: ['/admin', '/mobile-admin', '/monetization', '/api/admin/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: 'https://www.cbcmaterials.shop/sitemap.xml',
  };
}
