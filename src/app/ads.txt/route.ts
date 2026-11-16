import { NextRequest, NextResponse } from 'next/server';
import { getStoredMonetizationConfig } from '@/lib/monetization';

export async function GET(req: NextRequest) {
  void req.headers.get('host');
  const config = await getStoredMonetizationConfig();

  const lines: string[] = [
    '# CBC Kenya Resource Hub — Authorized Digital Sellers (ads.txt)',
  ];

  const clientId = (config.adsenseClientId || '').trim();
  if (clientId) {
    const pubId = clientId.replace(/^ca-/, '');
    if (pubId.startsWith('pub-')) {
      lines.push(`google.com, ${pubId}, DIRECT, f08c47fec0942fa0`);
    }
  }

  if (config.adsTxtCustomLines?.trim()) {
    for (const rawLine of config.adsTxtCustomLines.split(/\r?\n/)) {
      const trimmed = rawLine.trim();
      if (trimmed) lines.push(trimmed);
    }
  }

  if (lines.length === 1) {
    lines.push(
      '# Configure your Google AdSense Publisher ID or Ad Network lines in /admin -> Monetization Studio'
    );
  }

  return new NextResponse(lines.join('\n') + '\n', {
    status: 200,
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=300, s-maxage=300',
    },
  });
}
