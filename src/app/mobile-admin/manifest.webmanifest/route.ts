import { NextResponse } from 'next/server';

export async function GET() {
  const manifest = {
    name: 'CBC Kenya Admin Mobile',
    short_name: 'CBC Admin',
    description:
      'Mobile Admin App for live M-Pesa transaction verification, order approval, tuition leads & site revenue tracking.',
    start_url: '/mobile-admin',
    scope: '/mobile-admin',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#020617',
    theme_color: '#064e3b',
    icons: [
      {
        src: '/admin-icon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any maskable',
      },
    ],
  };

  return NextResponse.json(manifest, {
    headers: {
      'Content-Type': 'application/manifest+json',
      'Cache-Control': 'public, max-age=3600',
    },
  });
}
