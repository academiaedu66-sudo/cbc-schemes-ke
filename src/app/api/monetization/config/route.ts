import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { triggerAutomaticBackup } from '@/lib/security';
import {
  getStoredMonetizationConfig,
  saveStoredMonetizationConfig,
  type MonetizationConfig,
} from '@/lib/monetization';

export async function GET(req: NextRequest) {
  // Access headers before try/catch so Next.js 16 cacheComponents bails out of prerendering cleanly
  const isAdmin = isAdminAuthorized(req);
  const config = await getStoredMonetizationConfig();

  if (isAdmin) {
    return NextResponse.json({ config });
  }

  // Public storefront config
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
      smartlinkUrl: config.smartlinkUrl,
      smartlinkLabel: config.smartlinkLabel,
      placements: config.placements,
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

    const updated: MonetizationConfig = {
      ...existing,
      ...body,
      placements: {
        ...existing.placements,
        ...(body.placements || {}),
      },
      ratesKes: {
        ...existing.ratesKes,
        ...(body.ratesKes || {}),
      },
      campaigns: Array.isArray(body.campaigns) ? body.campaigns : existing.campaigns,
    };

    const saved = await saveStoredMonetizationConfig(updated);
    void triggerAutomaticBackup('Monetization settings updated');
    return NextResponse.json({
      success: true,
      message: 'Monetization & Ad Revenue settings saved live.',
      config: saved,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save monetization config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
