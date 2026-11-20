import { NextRequest, NextResponse } from 'next/server';
import {
  buildRichPreviewRedirectHtml,
  isLinkPreviewBot,
  recordWhatsAppRedirectClick,
  resolveCampaignBySlug,
} from '@/lib/whatsapp-autoreply';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ campaign: string }> }
) {
  const { campaign } = await params;
  const spec = resolveCampaignBySlug(campaign);
  const ua = req.headers.get('user-agent') || '';

  if (isLinkPreviewBot(ua)) {
    return new NextResponse(buildRichPreviewRedirectHtml(spec), {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'public, max-age=300',
      },
    });
  }

  void recordWhatsAppRedirectClick({
    campaignSlug: spec.slug,
    eventType: 'WEBSITE_REDIRECT_CLICK',
    userAgent: ua,
  });

  return NextResponse.redirect(spec.destinationUrl, 302);
}
