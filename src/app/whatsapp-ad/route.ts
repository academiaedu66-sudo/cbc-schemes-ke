import { NextRequest, NextResponse } from 'next/server';
import {
  AUTOREPLY_WHATSAPP_E164,
  isLinkPreviewBot,
  recordWhatsAppRedirectClick,
  resolveCampaignBySlug,
  SITE_ORIGIN,
} from '@/lib/whatsapp-autoreply';

/**
 * Paid-Ads Click-to-WhatsApp Entry URL (`https://www.cbcmaterials.shop/whatsapp-ad`)
 * When placed as the destination URL in Facebook, Instagram, TikTok, Google, or YouTube Paid Ads:
 *  - Opens WhatsApp chat directly with +254728595160 with a pre-filled Paid-Ad prompt
 *  - Tracks Paid-Ad entry clicks in `_system/whatsapp-autoreply-ledger.json`
 *  - As soon as the customer hits Send in WhatsApp, +254728595160 auto-replies with `https://www.cbcmaterials.shop/go/...`!
 */
export async function GET(req: NextRequest) {
  const { searchParams } = req.nextUrl;
  const campaignSlug =
    searchParams.get('ad') || searchParams.get('c') || 'whatsapp';
  const customPrompt = (searchParams.get('text') || '').trim();
  const spec = resolveCampaignBySlug(campaignSlug);
  const ua = req.headers.get('user-agent') || '';

  const targetWaLink = customPrompt
    ? `https://wa.me/254728595160?text=${encodeURIComponent(customPrompt)}`
    : spec.paidAdWaLink;

  if (isLinkPreviewBot(ua)) {
    const ogImage = `${SITE_ORIGIN}/opengraph-image`;
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Chat on WhatsApp (${AUTOREPLY_WHATSAPP_E164}) — CBCMATERIALS.SHOP</title>
  <meta property="og:title" content="Message CBCMATERIALS.SHOP on WhatsApp (${AUTOREPLY_WHATSAPP_E164})" />
  <meta property="og:description" content="${spec.ogDescription}" />
  <meta property="og:image" content="${ogImage}" />
  <meta http-equiv="refresh" content="0;url=${targetWaLink}" />
</head>
<body>Redirecting to WhatsApp ${AUTOREPLY_WHATSAPP_E164}...</body>
</html>`;
    return new NextResponse(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    });
  }

  void recordWhatsAppRedirectClick({
    campaignSlug: spec.slug,
    eventType: 'PAID_AD_ENTRY_CLICK',
    userAgent: ua,
  });

  return NextResponse.redirect(targetWaLink, 302);
}
