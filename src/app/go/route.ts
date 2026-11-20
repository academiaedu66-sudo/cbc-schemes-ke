import { NextRequest, NextResponse } from 'next/server';
import {
  buildRichPreviewRedirectHtml,
  isLinkPreviewBot,
  recordWhatsAppRedirectClick,
  resolveCampaignBySlug,
} from '@/lib/whatsapp-autoreply';

export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignSlug =
    searchParams.get('c') ||
    searchParams.get('campaign') ||
    searchParams.get('ad') ||
    'whatsapp';
  const spec = resolveCampaignBySlug(campaignSlug);
  const ua = req.headers.get('user-agent') || '';

  // Serve rich OpenGraph preview card to WhatsApp / Meta / Social link-preview crawlers
  if (isLinkPreviewBot(ua)) {
    return new NextResponse(buildRichPreviewRedirectHtml(spec), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  // Real customer tapping the auto-reply link inside WhatsApp -> log click & redirect immediately
  void recordWhatsAppRedirectClick({
    campaignSlug: spec.slug,
    eventType: 'WEBSITE_REDIRECT_CLICK',
    userAgent: ua,
  });

  return NextResponse.redirect(spec.destinationUrl, 302);
}
