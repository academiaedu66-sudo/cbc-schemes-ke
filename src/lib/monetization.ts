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
  | 'smartlink'
  | 'tsc_services_hub'
  | 'holiday_side_hustles'
  | 'gemini_qa_hub';

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
  adNetworkScriptUrl: string; // External multitag / in-page push script URL
  adNetworkBannerScriptUrl: string; // Optional vignette / native banner script URL
  smartlinkUrl: string; // Direct link / smartlink URL for high-value reward/partner clicks
  smartlinkLabel: string; // Button CTA shown on free bonus/partner click bar
  allowExternalCompanyAds?: boolean; // STRICT OWNER LOCK: false = ZERO other companies' ads allowed on website
  monetagMode?: 'ad_free_site' | 'clean_banners' | 'multitag_all';
  monetagSiteId?: string;
  monetagVignetteZoneId?: string;
  monetagInPagePushZoneId?: string;
  monetagMultiTagZoneId?: string;
  monetagPushSwZoneId?: string;
  monetagPayoutMethod?:
    | 'PAYPAL_MPESA'
    | 'SKRILL_MPESA'
    | 'WEBMONEY'
    | 'PAYONEER'
    | 'USDT';
  monetagPayoutAccount?: string;
  monetagSspApiToken?: string;

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

  // 5. Facebook & WhatsApp Profile Monetization + Automatic Reels/Feed Link Ads
  facebookMonetization: {
    enabled: boolean;
    profileId: string;
    profileUrl: string;
    reelsUrl: string;
    whatsappUrl: string;
    metaPixelId: string;
    metaConversionsApiToken: string; // Server-only secret
    fbPageAccessToken: string; // Server-only Graph API token for auto-pasting links into Reels & Feed
    autoPostReelsComments: boolean;
    autoPostFeedAds: boolean;
    routeAdClicksToFacebook: boolean;
  };

  // 6. Direct Sponsored & Affiliate Campaigns
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
    id: 'sponsor-top-facebook-reels',
    enabled: true,
    placement: 'top_leaderboard',
    badge: 'OFFICIAL FACEBOOK & REELS HUB',
    headline:
      'Follow Our Official Facebook Profile & Watch Daily CBC Revision Reels, Exam Tips & Free Teacher Updates!',
    subtext:
      'Join thousands of Kenyan Teachers, Parents & Learners on Facebook + Chat directly on WhatsApp (0728595160) for instant CBC Schemes, Notes & KPSEA/KJSEA Trials.',
    ctaText: 'Follow & Watch on Facebook →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-infeed-facebook-follow',
    enabled: true,
    placement: 'infeed_grid',
    badge: 'FACEBOOK COMMUNITY',
    headline:
      'Watch Quick CBC Lesson Breakdowns, Exam Predictions & Teaching Tips on Our Facebook Reels!',
    subtext:
      'Follow our official Facebook profile for daily PP1–Grade 12 updates, share with fellow teachers, or message us on WhatsApp.',
    ctaText: 'Open Facebook Reels →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-infeed-kicd-books',
    enabled: true,
    placement: 'infeed_grid',
    badge: 'WHATSAPP DIRECT DESK',
    headline:
      'Need Custom School-Branded Schemes, Bulk School Licenses or Holiday Tuition Teachers?',
    subtext:
      'Connect directly with our Coordinator on WhatsApp or follow our Facebook Page for instant 2026 CBC support across all 47 counties.',
    ctaText: 'Chat on WhatsApp →',
    targetUrl:
      'https://wa.me/254728595160?text=Hello%2C%20I%20visited%20cbcmaterials.shop%20and%20would%20like%20assistance',
    accentColor: 'emerald',
  },
  {
    id: 'sponsor-preview-modal',
    enabled: true,
    placement: 'preview_modal',
    badge: 'FOLLOW ON FACEBOOK',
    headline:
      'Enjoying This Sample Preview? Follow Our Official Facebook Profile for Daily CBC Revision Reels & Updates!',
    subtext:
      'Tap to follow us on Facebook or chat on WhatsApp for school-branded Word (.DOCX) + PDF bundles.',
    ctaText: 'Visit Our Facebook →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-sticky-bar',
    enabled: true,
    placement: 'sticky_footer',
    badge: 'FACEBOOK & WHATSAPP',
    headline:
      'Follow Our Official Facebook Reels & WhatsApp Hub for Daily 2026 CBC Exam & Teaching Updates!',
    subtext: 'Official Facebook Profile connected live to cbcmaterials.shop',
    ctaText: 'Open Facebook →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-tsc-hub',
    enabled: true,
    placement: 'tsc_services_hub',
    badge: 'TSC TEACHERS FACEBOOK HUB',
    headline:
      'Follow Our Official Facebook Profile for Instant TSC Circular Alerts, TPAD 2 Tips & Recruitment Updates!',
    subtext:
      'Watch daily teacher updates on our Facebook Reels & connect with fellow Kenyan educators.',
    ctaText: 'Follow on Facebook →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
    accentColor: 'blue',
  },
  {
    id: 'sponsor-side-hustles',
    enabled: true,
    placement: 'holiday_side_hustles',
    badge: 'TEACHER EARNINGS & FACEBOOK',
    headline:
      'Follow Our Facebook Reels for Weekly Teacher Side-Hustle Walkthroughs & Holiday Tuition Priority Alerts!',
    subtext:
      'Stay updated on Facebook + register as a verified CBC Holiday / Personal Tutor (KSh 500).',
    ctaText: 'Watch on Facebook Reels →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
    accentColor: 'emerald',
  },
  {
    id: 'sponsor-gemini-qa-hub',
    enabled: true,
    placement: 'gemini_qa_hub',
    badge: 'STUDENT FACEBOOK REELS',
    headline:
      'Watch Worked Mathematics, Science & English Exam Solutions on Our Official Facebook Reels!',
    subtext:
      'Follow our Facebook profile for step-by-step KPSEA, KJSEA & Senior School revision clips.',
    ctaText: 'Watch Revision Reels →',
    targetUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
    accentColor: 'purple',
  },
];

export const DEFAULT_ADSTERRA_UNIT_SRC = '';
export const DEFAULT_ADSTERRA_SMARTLINK_URL = '';

// Verified Monetag Zones for www.cbcmaterials.shop (Site ID: 3582026)
export const DEFAULT_MONETAG_SITE_ID = '3582026';
export const DEFAULT_MONETAG_VIGNETTE_ZONE_ID = '12318961';
export const DEFAULT_MONETAG_VIGNETTE_SRC = 'https://n6wxm.com/vignette.min.js';
export const DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID = '12318967';
export const DEFAULT_MONETAG_INPAGE_PUSH_SRC = 'https://nap5k.com/tag.min.js';
export const DEFAULT_MONETAG_MULTITAG_ZONE_ID = '311785';
export const DEFAULT_MONETAG_MULTITAG_SRC = 'https://quge5.com/88/tag.min.js';
export const DEFAULT_MONETAG_PUSH_SW_ZONE_ID = '12288320';
export const DEFAULT_MONETAG_DIRECT_SMARTLINK = 'https://uplcm.com/4/12318973';

const BLOCKED_HIJACK_AD_PATTERNS = /afders\.org|asiafilm\.org|onclickads/i;

export function sanitizeAdUrl(rawInput?: string): string {
  const clean = extractScriptUrlIfTag(rawInput);
  if (!clean || BLOCKED_HIJACK_AD_PATTERNS.test(clean)) return '';
  return clean;
}

export function extractScriptUrlIfTag(rawInput?: string): string {
  const clean = (rawInput || '').trim();
  if (!clean) return '';
  const match = clean.match(/src=["']([^"']+)["']/i);
  if (match && match[1]) return match[1].trim();
  return clean;
}

export function getDefaultMonetizationConfig(): MonetizationConfig {
  const envAdsense = (process.env.NEXT_PUBLIC_ADSENSE_CLIENT_ID || '').trim();

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

    adNetworkEnabled: true,
    adNetworkProvider: 'monetag',
    adNetworkScriptUrl: DEFAULT_MONETAG_INPAGE_PUSH_SRC,
    adNetworkBannerScriptUrl: DEFAULT_MONETAG_VIGNETTE_SRC,
    smartlinkUrl: DEFAULT_MONETAG_DIRECT_SMARTLINK,
    smartlinkLabel: 'Follow Official CBCMATERIALS.SHOP Updates →',
    allowExternalCompanyAds: false,
    monetagMode: 'ad_free_site',
    monetagSiteId: DEFAULT_MONETAG_SITE_ID,
    monetagVignetteZoneId: DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
    monetagInPagePushZoneId: DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
    monetagMultiTagZoneId: DEFAULT_MONETAG_MULTITAG_ZONE_ID,
    monetagPushSwZoneId: DEFAULT_MONETAG_PUSH_SW_ZONE_ID,
    monetagPayoutMethod: 'SKRILL_MPESA',
    monetagPayoutAccount: 'academia.edu55@gmail.com',
    monetagSspApiToken: (process.env.MONETAG_SSP_API_TOKEN || '').trim(),

    placements: {
      topLeaderboard: true,
      inFeedNative: true,
      previewModalAd: false,
      stickyBottomBar: false,
      partnerBonusStrip: true,
    },

    ratesKes: {
      cpmImpressionsKes: 240, // ~USD $1.85 RPM across Kenyan Edu / Teacher CPC+CPM traffic
      cpcClickKes: 18, // ~USD $0.14 per click
      interactionBonusKes: 0.75, // Engagement value per high-intent preview/search/filter interaction
      usdToKesRate: 129.5,
    },

    facebookMonetization: {
      enabled: true,
      profileId: '61591027359399',
      profileUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
      reelsUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
      whatsappUrl:
        'https://wa.me/254728595160?text=Hello%2C%20I%20visited%20cbcmaterials.shop%20and%20need%20CBC%20materials',
      metaPixelId: (process.env.NEXT_PUBLIC_META_PIXEL_ID || '').trim(),
      metaConversionsApiToken: (process.env.META_CONVERSIONS_API_TOKEN || '').trim(),
      fbPageAccessToken: (process.env.FACEBOOK_PAGE_ACCESS_TOKEN || '').trim(),
      autoPostReelsComments: true,
      autoPostFeedAds: true,
      routeAdClicksToFacebook: true,
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
    const fbMerged = {
      ...defaults.facebookMonetization,
      ...(parsed.facebookMonetization || {}),
    };
    if (!fbMerged.profileUrl) {
      fbMerged.profileUrl = defaults.facebookMonetization.profileUrl;
    }
    if (!fbMerged.reelsUrl) {
      fbMerged.reelsUrl = defaults.facebookMonetization.reelsUrl;
    }
    if (!fbMerged.profileId) {
      fbMerged.profileId = defaults.facebookMonetization.profileId;
    }
    if (fbMerged.whatsappUrl) {
      fbMerged.whatsappUrl = fbMerged.whatsappUrl
        .replace(/254705759072/g, '254728595160')
        .replace(/0705759072/g, '0728595160');
    }

    let mergedCampaigns =
      Array.isArray(parsed.campaigns) && parsed.campaigns.length > 0
        ? parsed.campaigns.map((c) => ({
            ...c,
            headline: String(c.headline || '').replace(/0705759072/g, '0728595160'),
            subtext: String(c.subtext || '').replace(/0705759072/g, '0728595160'),
            targetUrl: String(c.targetUrl || '')
              .replace(/254705759072/g, '254728595160')
              .replace(/0705759072/g, '0728595160'),
          }))
        : defaults.campaigns;

    // Ensure Facebook Reels spotlight campaigns are present when Facebook routing is enabled
    if (fbMerged.enabled && fbMerged.routeAdClicksToFacebook) {
      const hasFbCampaign = mergedCampaigns.some((c) =>
        String(c.targetUrl || '').includes('facebook.com')
      );
      if (!hasFbCampaign) {
        mergedCampaigns = defaults.campaigns;
      }
    }

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
      facebookMonetization: fbMerged,
      campaigns: mergedCampaigns,
    };

    merged.adsenseClientId = normalizeAdsensePublisherId(merged.adsenseClientId);
    merged.adNetworkScriptUrl = sanitizeAdUrl(merged.adNetworkScriptUrl);
    merged.adNetworkBannerScriptUrl = sanitizeAdUrl(merged.adNetworkBannerScriptUrl);
    merged.smartlinkUrl = sanitizeAdUrl(merged.smartlinkUrl);

    // Auto-upgrade legacy empty Adsterra/custom config to verified Monetag Site #3582026 while keeping website 100% free of other companies' ads
    if (
      !merged.monetagVignetteZoneId ||
      (merged.adNetworkProvider === 'adsterra' && !merged.adNetworkScriptUrl)
    ) {
      merged.adNetworkEnabled = true;
      merged.adNetworkProvider = 'monetag';
      merged.adNetworkScriptUrl = DEFAULT_MONETAG_INPAGE_PUSH_SRC;
      merged.adNetworkBannerScriptUrl = DEFAULT_MONETAG_VIGNETTE_SRC;
      if (!merged.smartlinkUrl || merged.smartlinkUrl.includes('facebook.com')) {
        merged.smartlinkUrl = DEFAULT_MONETAG_DIRECT_SMARTLINK;
      }
      merged.allowExternalCompanyAds = false;
      merged.monetagMode = 'ad_free_site';
      merged.monetagSiteId = DEFAULT_MONETAG_SITE_ID;
      merged.monetagVignetteZoneId = DEFAULT_MONETAG_VIGNETTE_ZONE_ID;
      merged.monetagInPagePushZoneId = DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID;
      merged.monetagMultiTagZoneId = DEFAULT_MONETAG_MULTITAG_ZONE_ID;
      merged.monetagPushSwZoneId = DEFAULT_MONETAG_PUSH_SW_ZONE_ID;
    }

    // Enforce strict owner lock: unless allowExternalCompanyAds is explicitly true, force ad_free_site mode
    if (!merged.allowExternalCompanyAds) {
      merged.monetagMode = 'ad_free_site';
    }

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
