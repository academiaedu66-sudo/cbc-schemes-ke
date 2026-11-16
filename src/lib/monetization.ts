import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const MONETIZATION_CONFIG_PATH = '_system/monetization-config.json';
const MONETIZATION_STATS_PATH = '_system/monetization-stats.json';

export type AdPlacement =
  | 'top_leaderboard'
  | 'infeed_grid'
  | 'preview_modal'
  | 'sticky_footer'
  | 'updates_hub'
  | 'smartlink';

export type TrackEventType = 'view' | 'impression' | 'interaction' | 'click';

export interface SponsoredCampaign {
  id: string;
  enabled: boolean;
  placement: AdPlacement | 'all';
  badge: string;
  headline: string;
  subtext: string;
  ctaText: string;
  targetUrl: string;
  accentColor: 'emerald' | 'blue' | 'amber' | 'purple' | 'rose';
}

export interface MonetizationConfig {
  enabled: boolean;
  // 1. Google AdSense (CPC + CPM)
  adsenseEnabled: boolean;
  adsenseClientId: string; // e.g. ca-pub-1234567890123456
  adsenseAutoAds: boolean;
  adsenseTopSlotId: string;
  adsenseInFeedSlotId: string;
  adsensePreviewSlotId: string;
  adsenseStickySlotId: string;
  adsTxtCustomLines: string;

  // 2. Instant-Approval CPM / Click / Interaction Networks (Monetag / Adsterra / Custom)
  adNetworkEnabled: boolean;
  adNetworkProvider: 'monetag' | 'adsterra' | 'custom';
  adNetworkScriptUrl: string; // External multitag / social bar / vignette script URL
  adNetworkBannerScriptUrl: string; // Optional native banner script URL
  smartlinkUrl: string; // Direct link / smartlink URL for high-value reward/partner clicks
  smartlinkLabel: string; // Button CTA shown on free bonus/partner click bar

  // 3. Placement Toggles
  placements: {
    topLeaderboard: boolean;
    inFeedNative: boolean;
    previewModalAd: boolean;
    stickyBottomBar: boolean;
    partnerBonusStrip: boolean;
  };

  // 4. Revenue Estimator Rates (KES) — adjustable to match live network RPM/CPC
  ratesKes: {
    cpmImpressionsKes: number; // KES per 1,000 ad impressions
    cpcClickKes: number; // KES per ad/partner click
    interactionBonusKes: number; // Micro-earnings weight per engaged preview/filter/portal interaction
    usdToKesRate: number;
  };

  // 5. Direct Sponsored & Affiliate Campaigns
  campaigns: SponsoredCampaign[];
  updatedAt?: string;
}

export interface DailyMonetizationBucket {
  date: string; // YYYY-MM-DD
  views: number;
  impressions: number;
  interactions: number;
  clicks: number;
}

export interface MonetizationStats {
  totalViews: number;
  totalImpressions: number;
  totalInteractions: number;
  totalClicks: number;
  byPlacement: Record<
    string,
    {
      impressions: number;
      clicks: number;
    }
  >;
  byInteractionType: Record<string, number>;
  daily: Record<string, DailyMonetizationBucket>;
  updatedAt: string;
}

export const DEFAULT_SPONSORED_CAMPAIGNS: SponsoredCampaign[] = [
  {
    id: 'sponsor-top-advertise',
    enabled: true,
    placement: 'top_leaderboard',
    badge: 'SPONSORED SPOTLIGHT',
    headline:
      'Promote Your School, Bookshop, College or Tuition Program to 50,000+ Kenyan Teachers & Parents',
    subtext:
      'High-visibility banner & native catalog placements starting from KES 1,500/week • Instant activation via M-Pesa 0728595160.',
    ctaText: 'Book Ad Slot →',
    targetUrl: '/advertise',
    accentColor: 'emerald',
  },
  {
    id: 'sponsor-infeed-kicd-books',
    enabled: true,
    placement: 'infeed_grid',
    badge: 'FEATURED PARTNER',
    headline:
      'Order Approved KICD Orange Book Textbooks, Lab Apparatus & KPSEA/KJSEA Revision Kits',
    subtext:
      'Wholesale school & parent discounts across PP1–Grade 12 coursebooks (KLB, Longhorn, Oxford, Moran, Spotlight). Partner inquiries welcome.',
    ctaText: 'Inquire / Partner →',
    targetUrl:
      'https://wa.me/254705759072?text=Hello%2C%20I%20saw%20the%20Featured%20Partner%20slot%20on%20CBC%20Kenya%20Resource%20Hub%20and%20would%20like%20to%20inquire',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-infeed-advertise-2',
    enabled: true,
    placement: 'infeed_grid',
    badge: 'ADVERTISE HERE',
    headline:
      'Reach Principals, HODs & Subject Teachers Searching for 2026 CBC Materials Daily',
    subtext:
      'Place your EdTech app, school admissions banner, or stationery shop right inside subject feeds. Pay via M-Pesa 0728595160.',
    ctaText: 'View Ad Rates →',
    targetUrl: '/advertise',
    accentColor: 'purple',
  },
  {
    id: 'sponsor-preview-modal',
    enabled: true,
    placement: 'preview_modal',
    badge: 'TEACHER RESOURCE PARTNER',
    headline:
      'Need Custom School-Branded Schemes, Bulk School Licenses or Advertising on This Portal?',
    subtext:
      'Get your school logo pre-filled across all PP1–Grade 12 documents or feature your institution to thousands of educators.',
    ctaText: 'Chat on WhatsApp →',
    targetUrl:
      'https://wa.me/254705759072?text=Hello%2C%20I%20need%20school%20bulk%20CBC%20materials%20or%20ad%20placement%20info',
    accentColor: 'amber',
  },
  {
    id: 'sponsor-sticky-bar',
    enabled: true,
    placement: 'sticky_footer',
    badge: 'AD SLOT',
    headline:
      'Own a School, Bookshop or Tutor Service? Advertise on CBC Resource Hub from KES 250/day!',
    subtext: 'Instant live banner activation via M-Pesa 0728595160',
    ctaText: 'Advertise Now',
    targetUrl: '/advertise',
    accentColor: 'emerald',
  },
];

export function getDefaultMonetizationConfig(): MonetizationConfig {
  const envAdsense = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '').trim();
  const envMonetagScript = (process.env.NEXT_PUBLIC_AD_NETWORK_SCRIPT_URL || '').trim();
  const envSmartlink = (process.env.NEXT_PUBLIC_SMARTLINK_URL || '').trim();

  return {
    enabled: true,
    adsenseEnabled: Boolean(envAdsense),
    adsenseClientId: envAdsense,
    adsenseAutoAds: true,
    adsenseTopSlotId: '',
    adsenseInFeedSlotId: '',
    adsensePreviewSlotId: '',
    adsenseStickySlotId: '',
    adsTxtCustomLines: '',

    adNetworkEnabled: Boolean(envMonetagScript || envSmartlink),
    adNetworkProvider: 'monetag',
    adNetworkScriptUrl: envMonetagScript,
    adNetworkBannerScriptUrl: '',
    smartlinkUrl: envSmartlink,
    smartlinkLabel: 'Sponsored Teacher Offer: Free CBC Revision & EdTech Tools →',

    placements: {
      topLeaderboard: true,
      inFeedNative: true,
      previewModalAd: true,
      stickyBottomBar: true,
      partnerBonusStrip: true,
    },

    ratesKes: {
      cpmImpressionsKes: 240, // ~USD $1.85 RPM across Kenyan Edu / Teacher CPC+CPM traffic
      cpcClickKes: 18, // ~USD $0.14 per click
      interactionBonusKes: 0.75, // Engagement value per high-intent preview/search/filter interaction
      usdToKesRate: 129.5,
    },

    campaigns: DEFAULT_SPONSORED_CAMPAIGNS,
  };
}

export function getEmptyMonetizationStats(): MonetizationStats {
  return {
    totalViews: 0,
    totalImpressions: 0,
    totalInteractions: 0,
    totalClicks: 0,
    byPlacement: {},
    byInteractionType: {},
    daily: {},
    updatedAt: new Date().toISOString(),
  };
}

let cachedConfig: { data: MonetizationConfig; expiresAt: number } | null = null;
let cachedStats: { data: MonetizationStats; loadedAt: number } | null = null;
let pendingFlushPromise: Promise<void> | null = null;
let dirtyStats = false;
let lastFlushTime = 0;

export function normalizeAdsensePublisherId(raw: string): string {
  const trimmed = (raw || '').trim();
  if (!trimmed) return '';
  if (trimmed.startsWith('ca-pub-')) return trimmed;
  if (trimmed.startsWith('pub-')) return `ca-${trimmed}`;
  if (/^\d{10,20}$/.test(trimmed)) return `ca-pub-${trimmed}`;
  return trimmed;
}

export async function getStoredMonetizationConfig(): Promise<MonetizationConfig> {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.data;
  }

  const defaults = getDefaultMonetizationConfig();
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(MONETIZATION_CONFIG_PATH);

    if (error || !data) {
      cachedConfig = { data: defaults, expiresAt: Date.now() + 15000 };
      return defaults;
    }

    const parsed = JSON.parse(await data.text()) as Partial<MonetizationConfig>;
    const merged: MonetizationConfig = {
      ...defaults,
      ...parsed,
      placements: {
        ...defaults.placements,
        ...(parsed.placements || {}),
      },
      ratesKes: {
        ...defaults.ratesKes,
        ...(parsed.ratesKes || {}),
      },
      campaigns:
        Array.isArray(parsed.campaigns) && parsed.campaigns.length > 0
          ? parsed.campaigns
          : defaults.campaigns,
    };

    merged.adsenseClientId = normalizeAdsensePublisherId(merged.adsenseClientId);
    cachedConfig = { data: merged, expiresAt: Date.now() + 15000 };
    return merged;
  } catch {
    return defaults;
  }
}

export async function saveStoredMonetizationConfig(
  nextConfig: MonetizationConfig
): Promise<MonetizationConfig> {
  const normalized: MonetizationConfig = {
    ...nextConfig,
    adsenseClientId: normalizeAdsensePublisherId(nextConfig.adsenseClientId),
    updatedAt: new Date().toISOString(),
  };

  const payload = JSON.stringify(normalized, null, 2);
  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(MONETIZATION_CONFIG_PATH, Buffer.from(payload, 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to save monetization config: ${error.message}`);
  }

  cachedConfig = { data: normalized, expiresAt: Date.now() + 15000 };
  return normalized;
}

export async function getStoredMonetizationStats(): Promise<MonetizationStats> {
  if (cachedStats && Date.now() - cachedStats.loadedAt < 12000) {
    return cachedStats.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(MONETIZATION_STATS_PATH);

    if (error || !data) {
      const empty = getEmptyMonetizationStats();
      cachedStats = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<MonetizationStats>;
    const stats: MonetizationStats = {
      totalViews: Number(parsed.totalViews) || 0,
      totalImpressions: Number(parsed.totalImpressions) || 0,
      totalInteractions: Number(parsed.totalInteractions) || 0,
      totalClicks: Number(parsed.totalClicks) || 0,
      byPlacement: parsed.byPlacement || {},
      byInteractionType: parsed.byInteractionType || {},
      daily: parsed.daily || {},
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedStats = { data: stats, loadedAt: Date.now() };
    return stats;
  } catch {
    const empty = getEmptyMonetizationStats();
    cachedStats = { data: empty, loadedAt: Date.now() };
    return empty;
  }
}

async function flushStatsToStorage(stats: MonetizationStats): Promise<void> {
  const payload = JSON.stringify(stats, null, 2);
  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(MONETIZATION_STATS_PATH, Buffer.from(payload, 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });
  dirtyStats = false;
  lastFlushTime = Date.now();
}

export async function recordMonetizationEvent(params: {
  eventType: TrackEventType;
  placement?: string;
  interactionType?: string;
  forceFlush?: boolean;
}): Promise<MonetizationStats> {
  const stats = await getStoredMonetizationStats();
  const todayKey = new Date().toISOString().slice(0, 10);

  if (!stats.daily[todayKey]) {
    stats.daily[todayKey] = {
      date: todayKey,
      views: 0,
      impressions: 0,
      interactions: 0,
      clicks: 0,
    };
  }

  const dayBucket = stats.daily[todayKey];
  const placementKey = (params.placement || 'general').slice(0, 48);
  const interactionKey = (params.interactionType || 'engage').slice(0, 48);

  if (params.eventType === 'view') {
    stats.totalViews += 1;
    dayBucket.views += 1;
  } else if (params.eventType === 'impression') {
    stats.totalImpressions += 1;
    dayBucket.impressions += 1;
    if (!stats.byPlacement[placementKey]) {
      stats.byPlacement[placementKey] = { impressions: 0, clicks: 0 };
    }
    stats.byPlacement[placementKey].impressions += 1;
  } else if (params.eventType === 'interaction') {
    stats.totalInteractions += 1;
    dayBucket.interactions += 1;
    stats.byInteractionType[interactionKey] =
      (stats.byInteractionType[interactionKey] || 0) + 1;
  } else if (params.eventType === 'click') {
    stats.totalClicks += 1;
    dayBucket.clicks += 1;
    if (!stats.byPlacement[placementKey]) {
      stats.byPlacement[placementKey] = { impressions: 0, clicks: 0 };
    }
    stats.byPlacement[placementKey].clicks += 1;
  }

  // Keep only most recent 30 days in daily ledger
  const sortedDates = Object.keys(stats.daily).sort();
  if (sortedDates.length > 30) {
    for (const oldDate of sortedDates.slice(0, sortedDates.length - 30)) {
      delete stats.daily[oldDate];
    }
  }

  stats.updatedAt = new Date().toISOString();
  cachedStats = { data: stats, loadedAt: Date.now() };
  dirtyStats = true;

  // Coalesce storage writes: flush immediately on clicks/views or every 4 seconds under burst impressions
  const shouldFlushNow =
    params.forceFlush ||
    params.eventType === 'click' ||
    params.eventType === 'view' ||
    Date.now() - lastFlushTime >= 4000;

  if (shouldFlushNow && dirtyStats && !pendingFlushPromise) {
    pendingFlushPromise = flushStatsToStorage(stats)
      .catch(() => {
        // Ignore transient storage hiccup; in-memory state preserves counts for next flush
      })
      .finally(() => {
        pendingFlushPromise = null;
      });
    await pendingFlushPromise;
  }

  return stats;
}

export async function resetStoredMonetizationStats(): Promise<MonetizationStats> {
  const empty = getEmptyMonetizationStats();
  cachedStats = { data: empty, loadedAt: Date.now() };
  await flushStatsToStorage(empty);
  return empty;
}

export function computeEstimatedEarnings(
  stats: MonetizationStats,
  config: MonetizationConfig
) {
  const cpmKes = Number(config.ratesKes.cpmImpressionsKes) || 240;
  const cpcKes = Number(config.ratesKes.cpcClickKes) || 18;
  const interactionKes = Number(config.ratesKes.interactionBonusKes) || 0.75;
  const usdRate = Number(config.ratesKes.usdToKesRate) || 129.5;

  const impressionEarningsKes = (stats.totalImpressions / 1000) * cpmKes;
  const viewRpmEarningsKes = (stats.totalViews / 1000) * (cpmKes * 0.65);
  const clickEarningsKes = stats.totalClicks * cpcKes;
  const interactionEarningsKes = stats.totalInteractions * interactionKes;

  const totalEstimatedKes =
    impressionEarningsKes +
    viewRpmEarningsKes +
    clickEarningsKes +
    interactionEarningsKes;
  const totalEstimatedUsd = totalEstimatedKes / usdRate;

  const ctrPercent =
    stats.totalImpressions > 0
      ? (stats.totalClicks / stats.totalImpressions) * 100
      : 0;

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayBucket = stats.daily[todayKey] || {
    date: todayKey,
    views: 0,
    impressions: 0,
    interactions: 0,
    clicks: 0,
  };

  const todayKes =
    (todayBucket.impressions / 1000) * cpmKes +
    (todayBucket.views / 1000) * (cpmKes * 0.65) +
    todayBucket.clicks * cpcKes +
    todayBucket.interactions * interactionKes;

  return {
    impressionEarningsKes: Number(impressionEarningsKes.toFixed(2)),
    viewRpmEarningsKes: Number(viewRpmEarningsKes.toFixed(2)),
    clickEarningsKes: Number(clickEarningsKes.toFixed(2)),
    interactionEarningsKes: Number(interactionEarningsKes.toFixed(2)),
    totalEstimatedKes: Number(totalEstimatedKes.toFixed(2)),
    totalEstimatedUsd: Number(totalEstimatedUsd.toFixed(2)),
    todayEstimatedKes: Number(todayKes.toFixed(2)),
    todayEstimatedUsd: Number((todayKes / usdRate).toFixed(2)),
    ctrPercent: Number(ctrPercent.toFixed(2)),
    today: todayBucket,
  };
}
