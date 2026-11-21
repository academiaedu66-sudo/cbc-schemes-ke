import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { triggerAutomaticBackup } from '@/lib/security';
import {
  DEFAULT_MONETAG_DIRECT_SMARTLINK,
  DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
  DEFAULT_MONETAG_MULTITAG_ZONE_ID,
  DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
  getStoredMonetizationConfig,
  saveStoredMonetizationConfig,
  type MonetizationConfig,
} from '@/lib/monetization';
import { getSocialBroadcasterConfig } from '@/lib/social-broadcaster';

export async function GET(req: NextRequest) {
  // Access headers before try/catch so Next.js 16 cacheComponents bails out of prerendering cleanly
  const isAdmin = isAdminAuthorized(req);
  const [config, socialCfg] = await Promise.all([
    getStoredMonetizationConfig(),
    getSocialBroadcasterConfig(),
  ]);

  if (isAdmin) {
    return NextResponse.json({
      config: {
        ...config,
        monetagSspApiToken: config.monetagSspApiToken ? '••••••••' : '',
        hasMonetagSspApiToken: Boolean(config.monetagSspApiToken?.trim()),
      },
    });
  }

  // Public storefront config (never exposes secret CAPI or Graph access tokens)
  return NextResponse.json({
    config: {
      enabled: config.enabled,
      adsenseEnabled: config.adsenseEnabled,
      adsenseClientId: config.adsenseClientId,
      adsenseAutoAds: config.adsenseAutoAds,
      adsenseTopSlotId: config.adsenseTopSlotId,
      adsenseInFeedSlotId: config.adsenseInFeedSlotId,
      adsensePreviewSlotId: config.adsensePreviewSlotId,
      adsenseStickySlotId: config.adsenseStickySlotId,
      adNetworkEnabled: config.adNetworkEnabled,
      adNetworkProvider: config.adNetworkProvider,
      adNetworkScriptUrl: config.adNetworkScriptUrl,
      adNetworkBannerScriptUrl: config.adNetworkBannerScriptUrl,
      monetagDirectLinkUrl:
        config.smartlinkUrl && !config.smartlinkUrl.includes('facebook.com')
          ? config.smartlinkUrl
          : DEFAULT_MONETAG_DIRECT_SMARTLINK,
      monetagMode: config.monetagMode || 'clean_banners',
      monetagVignetteZoneId:
        config.monetagVignetteZoneId || DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
      monetagInPagePushZoneId:
        config.monetagInPagePushZoneId || DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
      monetagMultiTagZoneId:
        config.monetagMultiTagZoneId || DEFAULT_MONETAG_MULTITAG_ZONE_ID,
      smartlinkUrl:
        config.facebookMonetization?.enabled &&
        config.facebookMonetization?.routeAdClicksToFacebook
          ? config.facebookMonetization.reelsUrl || config.facebookMonetization.profileUrl
          : config.smartlinkUrl,
      smartlinkLabel:
        config.facebookMonetization?.enabled &&
        config.facebookMonetization?.routeAdClicksToFacebook
          ? 'Follow Our Official Facebook Profile & Watch Daily CBC Revision Reels →'
          : config.smartlinkLabel,
      placements: config.placements,
      facebookPublic: {
        enabled: config.facebookMonetization.enabled,
        profileId: config.facebookMonetization.profileId,
        profileUrl: config.facebookMonetization.profileUrl,
        reelsUrl: config.facebookMonetization.reelsUrl,
        whatsappUrl: config.facebookMonetization.whatsappUrl,
        metaPixelId: config.facebookMonetization.metaPixelId,
      },
      connectedSocialLinks: socialCfg.platforms
        .filter((p) => p.allowPosting && Boolean(p.profileUrl?.trim()))
        .map((p) => ({
          id: p.id,
          name: p.name,
          shortBadge: p.shortBadge,
          url: p.profileUrl.trim(),
        })),
      campaigns: config.campaigns.filter((c) => c.enabled),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as Partial<MonetizationConfig>;
    const existing = await getStoredMonetizationConfig();

    const incomingToken =
      typeof body.monetagSspApiToken === 'string' &&
      body.monetagSspApiToken.trim() &&
      !body.monetagSspApiToken.includes('••••')
        ? body.monetagSspApiToken.trim()
        : existing.monetagSspApiToken || '';

    const updated: MonetizationConfig = {
      ...existing,
      ...body,
      adNetworkScriptUrl:
        typeof body.adNetworkScriptUrl === 'string' && body.adNetworkScriptUrl.trim()
          ? body.adNetworkScriptUrl.trim()
          : existing.adNetworkScriptUrl,
      smartlinkUrl:
        typeof body.smartlinkUrl === 'string' && body.smartlinkUrl.trim()
          ? body.smartlinkUrl.trim()
          : existing.smartlinkUrl,
      monetagSspApiToken: incomingToken,
      placements: {
        ...existing.placements,
        ...(body.placements || {}),
      },
      ratesKes: {
        ...existing.ratesKes,
        ...(body.ratesKes || {}),
      },
      facebookMonetization: {
        ...existing.facebookMonetization,
        ...(body.facebookMonetization || {}),
      },
      campaigns: Array.isArray(body.campaigns) ? body.campaigns : existing.campaigns,
    };

    const saved = await saveStoredMonetizationConfig(updated);
    void triggerAutomaticBackup('Monetization & Facebook Reels settings updated');
    return NextResponse.json({
      success: true,
      message: 'Facebook Monetization, WhatsApp & Ad Revenue settings saved live.',
      config: saved,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save monetization config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
