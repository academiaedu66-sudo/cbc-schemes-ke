import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  computeEstimatedEarnings,
  getStoredMonetizationConfig,
  getStoredMonetizationStats,
  recordMonetizationEvent,
  resetStoredMonetizationStats,
  type TrackEventType,
} from '@/lib/monetization';
import {
  runAutomaticFacebookLinkAdSync,
  sendMetaConversionsEvent,
} from '@/lib/facebook-monetization';

const VALID_EVENTS = new Set<TrackEventType>([
  'view',
  'impression',
  'interaction',
  'click',
]);

let lastAutoReelsSyncTs = 0;

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const [stats, config] = await Promise.all([
    getStoredMonetizationStats(),
    getStoredMonetizationConfig(),
  ]);
  const earnings = computeEstimatedEarnings(stats, config);

  return NextResponse.json({
    stats,
    earnings,
    ratesKes: config.ratesKes,
  });
}

export async function POST(req: NextRequest) {
  // Read headers upfront for clean Next.js 16 dynamic bailout
  const ua = req.headers.get('user-agent') || '';
  const referer = req.headers.get('referer') || 'https://www.cbcmaterials.shop';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    undefined;

  try {
    const body = (await req.json().catch(() => ({}))) as {
      eventType?: string;
      placement?: string;
      interactionType?: string;
    };

    const eventType = (body.eventType || '') as TrackEventType;
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    const [, config] = await Promise.all([
      recordMonetizationEvent({
        eventType,
        placement: body.placement,
        interactionType: body.interactionType,
      }),
      getStoredMonetizationConfig(),
    ]);

    // Forward every website view, interaction & click straight to Facebook Conversions API (non-blocking)
    if (config.facebookMonetization?.enabled) {
      const fbEventName =
        eventType === 'view'
          ? 'PageView'
          : eventType === 'click'
            ? 'Lead'
            : 'ViewContent';
      void sendMetaConversionsEvent({
        pixelId: config.facebookMonetization.metaPixelId,
        capiAccessToken: config.facebookMonetization.metaConversionsApiToken,
        eventName: fbEventName,
        sourceUrl: referer,
        userAgent: ua,
        clientIp: ip,
        contentName: body.interactionType || body.placement || 'CBC Website Activity',
      });

      // Opportunistic 30-minute background auto-sync: automatically pastes website link ads into any newly uploaded Facebook Reels!
      const now = Date.now();
      if (
        eventType === 'view' &&
        config.facebookMonetization.autoPostReelsComments &&
        config.facebookMonetization.fbPageAccessToken &&
        now - lastAutoReelsSyncTs > 30 * 60 * 1000
      ) {
        lastAutoReelsSyncTs = now;
        void runAutomaticFacebookLinkAdSync({
          fbActorId:
            config.facebookMonetization.profileId ||
            config.facebookMonetization.profileUrl,
          fbAccessToken: config.facebookMonetization.fbPageAccessToken,
          publishFeedPost: false,
          injectReelsLinks: true,
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const stats = await resetStoredMonetizationStats();
  const config = await getStoredMonetizationConfig();
  const earnings = computeEstimatedEarnings(stats, config);

  return NextResponse.json({
    success: true,
    stats,
    earnings,
  });
}
