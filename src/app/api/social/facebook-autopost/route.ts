import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { getStoredMonetizationConfig } from '@/lib/monetization';
import {
  generateRotatingFacebookLinkAds,
  getFacebookAutopostLedger,
  runAutomaticFacebookLinkAdSync,
} from '@/lib/facebook-monetization';

export async function GET(req: NextRequest) {
  const cronHeader = req.headers.get('x-vercel-cron');
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = (process.env.CRON_SECRET || '').trim();
  const isCron =
    cronHeader === '1' ||
    (Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`);
  const isAdmin = isAdminAuthorized(req);

  const config = await getStoredMonetizationConfig();
  const fb = config.facebookMonetization;

  // Automatic scheduled Vercel Cron execution -> pastes website link ads in Reels & publishes Feed ad!
  if (isCron) {
    if (!fb.enabled) {
      return NextResponse.json({ ok: true, skipped: 'Facebook monetization disabled' });
    }
    const result = await runAutomaticFacebookLinkAdSync({
      fbActorId: fb.profileId || fb.profileUrl,
      fbAccessToken: fb.fbPageAccessToken,
      publishFeedPost: fb.autoPostFeedAds,
      injectReelsLinks: fb.autoPostReelsComments,
    });
    return NextResponse.json({ ok: true, trigger: 'cron', ...result });
  }

  if (!isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ledger = await getFacebookAutopostLedger();
  const generatedAds = await generateRotatingFacebookLinkAds(
    6,
    ledger.lastPublishedMaterialIds
  );

  return NextResponse.json({
    ok: true,
    profileUrl: fb.profileUrl,
    reelsUrl: fb.reelsUrl,
    whatsappUrl: fb.whatsappUrl,
    hasGraphToken: Boolean(
      (fb.fbPageAccessToken || process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim()
    ),
    ledger,
    generatedAds,
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      publishFeedPost?: boolean;
      injectReelsLinks?: boolean;
    };
    const config = await getStoredMonetizationConfig();
    const fb = config.facebookMonetization;

    const result = await runAutomaticFacebookLinkAdSync({
      fbActorId: fb.profileId || fb.profileUrl,
      fbAccessToken: fb.fbPageAccessToken,
      publishFeedPost: body.publishFeedPost ?? fb.autoPostFeedAds,
      injectReelsLinks: body.injectReelsLinks ?? fb.autoPostReelsComments,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Facebook auto-post sync failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
