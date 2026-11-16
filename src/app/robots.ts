import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/ads.txt', '/advertise', '/privacy-policy', '/terms'],
        disallow: ['/admin', '/monetization', '/api/admin/'],
      },
      {
        userAgent: 'Mediapartners-Google',
        allow: '/',
      },
    ],
    sitemap: 'https://cbc-schemes-ke.vercel.app/sitemap.xml',
  };
}
