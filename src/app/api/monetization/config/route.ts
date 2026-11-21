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

  const externalAdsPermitted =
    Boolean(config.allowExternalCompanyAds) &&
    config.monetagMode !== 'ad_free_site';

  const isFirstPartyCampaignUrl = (url?: string) => {
    const u = String(url || '').trim();
    if (!u || u.startsWith('/')) return true;
    return /cbcmaterials\.shop|facebook\.com\/profile\.php\?id=61591027359399|wa\.me\/254728595160/i.test(
      u
    );
  };

  // Public storefront config (never exposes secret tokens, and blocks all third-party company ads unless explicitly permitted)
  return NextResponse.json({
    config: {
      enabled: config.enabled,
      allowExternalCompanyAds: externalAdsPermitted,
      adsenseEnabled: externalAdsPermitted ? config.adsenseEnabled : false,
      adsenseClientId: externalAdsPermitted ? config.adsenseClientId : '',
      adsenseAutoAds: externalAdsPermitted ? config.adsenseAutoAds : false,
      adsenseTopSlotId: externalAdsPermitted ? config.adsenseTopSlotId : '',
      adsenseInFeedSlotId: externalAdsPermitted ? config.adsenseInFeedSlotId : '',
      adsensePreviewSlotId: externalAdsPermitted ? config.adsensePreviewSlotId : '',
      adsenseStickySlotId: externalAdsPermitted ? config.adsenseStickySlotId : '',
      adNetworkEnabled: externalAdsPermitted ? config.adNetworkEnabled : false,
      adNetworkProvider: config.adNetworkProvider,
      adNetworkScriptUrl: externalAdsPermitted ? config.adNetworkScriptUrl : '',
      adNetworkBannerScriptUrl: externalAdsPermitted
        ? config.adNetworkBannerScriptUrl
        : '',
      monetagDirectLinkUrl: externalAdsPermitted
        ? config.smartlinkUrl && !config.smartlinkUrl.includes('facebook.com')
          ? config.smartlinkUrl
          : DEFAULT_MONETAG_DIRECT_SMARTLINK
        : '',
      monetagMode: externalAdsPermitted
        ? config.monetagMode || 'clean_banners'
        : 'ad_free_site',
      monetagVignetteZoneId:
        config.monetagVignetteZoneId || DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
      monetagInPagePushZoneId:
        config.monetagInPagePushZoneId || DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
      monetagMultiTagZoneId:
        config.monetagMultiTagZoneId || DEFAULT_MONETAG_MULTITAG_ZONE_ID,
      smartlinkUrl:
        config.facebookMonetization.reelsUrl ||
        config.facebookMonetization.profileUrl,
      smartlinkLabel:
        'Follow Our Official Facebook Profile & Watch Daily CBC Revision Reels →',
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
      campaigns: config.campaigns.filter(
        (c) =>
          c.enabled &&
          (externalAdsPermitted || isFirstPartyCampaignUrl(c.targetUrl))
      ),
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
