'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import Link from 'next/link';
import { ExternalLink, Megaphone, Sparkles, TrendingUp, X } from 'lucide-react';
import {
  DEFAULT_SPONSORED_CAMPAIGNS,
  type AdPlacement,
  type SponsoredCampaign,
  type TrackEventType,
} from '@/lib/monetization';

export interface PublicMonetizationConfig {
  enabled: boolean;
  adsenseEnabled: boolean;
  adsenseClientId: string;
  adsenseAutoAds: boolean;
  adsenseTopSlotId: string;
  adsenseInFeedSlotId: string;
  adsensePreviewSlotId: string;
  adsenseStickySlotId: string;
  adNetworkEnabled: boolean;
  adNetworkProvider: 'monetag' | 'adsterra' | 'custom';
  adNetworkScriptUrl: string;
  adNetworkBannerScriptUrl: string;
  smartlinkUrl: string;
  smartlinkLabel: string;
  placements: {
    topLeaderboard: boolean;
    inFeedNative: boolean;
    previewModalAd: boolean;
    stickyBottomBar: boolean;
    partnerBonusStrip: boolean;
  };
  campaigns: SponsoredCampaign[];
}

const DEFAULT_PUBLIC_CONFIG: PublicMonetizationConfig = {
  enabled: true,
  adsenseEnabled: false,
  adsenseClientId: '',
  adsenseAutoAds: true,
  adsenseTopSlotId: '',
  adsenseInFeedSlotId: '',
  adsensePreviewSlotId: '',
  adsenseStickySlotId: '',
  adNetworkEnabled: false,
  adNetworkProvider: 'monetag',
  adNetworkScriptUrl: '',
  adNetworkBannerScriptUrl: '',
  smartlinkUrl: '',
  smartlinkLabel: 'Sponsored Teacher Offer: Free CBC Revision & EdTech Tools →',
  placements: {
    topLeaderboard: true,
    inFeedNative: true,
    previewModalAd: true,
    stickyBottomBar: true,
    partnerBonusStrip: true,
  },
  campaigns: DEFAULT_SPONSORED_CAMPAIGNS,
};

interface MonetizationContextValue {
  config: PublicMonetizationConfig;
  trackInteraction: (interactionType: string) => void;
  trackAdImpression: (placement: AdPlacement) => void;
  trackAdClick: (placement: AdPlacement) => void;
}

const MonetizationContext = createContext<MonetizationContextValue>({
  config: DEFAULT_PUBLIC_CONFIG,
  trackInteraction: () => {},
  trackAdImpression: () => {},
  trackAdClick: () => {},
});

function sendTrackBeacon(payload: {
  eventType: TrackEventType;
  placement?: string;
  interactionType?: string;
}) {
  if (typeof window === 'undefined') return;
  const body = JSON.stringify(payload);
  try {
    if (typeof navigator !== 'undefined' && typeof navigator.sendBeacon === 'function') {
      const blob = new Blob([body], { type: 'application/json' });
      const queued = navigator.sendBeacon('/api/monetization/track', blob);
      if (queued) return;
    }
  } catch {
    // Fallback to fetch below
  }

  fetch('/api/monetization/track', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    keepalive: true,
  }).catch(() => {});
}

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<PublicMonetizationConfig>(DEFAULT_PUBLIC_CONFIG);
  const viewRecordedRef = useRef(false);
  const lastInteractionTsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    let active = true;
    fetch('/api/monetization/config')
      .then((res) => res.json())
      .then((data) => {
        if (active && data?.config) {
          setConfig((prev) => ({
            ...prev,
            ...data.config,
            placements: {
              ...prev.placements,
              ...(data.config.placements || {}),
            },
            campaigns:
              Array.isArray(data.config.campaigns) && data.config.campaigns.length > 0
                ? data.config.campaigns
                : prev.campaigns,
          }));
        }
      })
      .catch(() => {});

    if (!viewRecordedRef.current) {
      viewRecordedRef.current = true;
      // Record real page view (skip /admin and /monetization routes)
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/admin') &&
        !window.location.pathname.startsWith('/monetization')
      ) {
        sendTrackBeacon({ eventType: 'view', placement: 'page' });
      }
    }

    return () => {
      active = false;
    };
  }, []);

  // Inject Google AdSense Auto Ads script dynamically when configured
  useEffect(() => {
    if (!config.enabled || !config.adsenseEnabled || !config.adsenseClientId) return;
    if (typeof document === 'undefined') return;
    if (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/monetization')
    ) {
      return;
    }

    const scriptId = 'cbc-google-adsense-js';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.crossOrigin = 'anonymous';
      s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(
        config.adsenseClientId
      )}`;
      document.head.appendChild(s);
    }

    const metaId = 'cbc-google-adsense-meta';
    if (!document.getElementById(metaId)) {
      const m = document.createElement('meta');
      m.id = metaId;
      m.name = 'google-adsense-account';
      m.content = config.adsenseClientId;
      document.head.appendChild(m);
    }
  }, [config.enabled, config.adsenseEnabled, config.adsenseClientId]);

  // Inject Monetag / Adsterra / Custom CPM & Interaction Ad Network script when configured
  useEffect(() => {
    if (!config.enabled || !config.adNetworkEnabled || !config.adNetworkScriptUrl) return;
    if (typeof document === 'undefined') return;
    if (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/monetization')
    ) {
      return;
    }

    const scriptId = 'cbc-adnetwork-global-js';
    if (!document.getElementById(scriptId)) {
      const s = document.createElement('script');
      s.id = scriptId;
      s.async = true;
      s.src = config.adNetworkScriptUrl;
      s.setAttribute('data-cfasync', 'false');
      document.body.appendChild(s);
    }
  }, [config.enabled, config.adNetworkEnabled, config.adNetworkScriptUrl]);

  const trackInteraction = useCallback((interactionType: string) => {
    const now = Date.now();
    const prev = lastInteractionTsRef.current[interactionType] || 0;
    // Light 1.2s debounce per interaction key so rapid typing doesn't spam
    if (now - prev < 1200) return;
    lastInteractionTsRef.current[interactionType] = now;
    sendTrackBeacon({ eventType: 'interaction', interactionType });
  }, []);

  const trackAdImpression = useCallback((placement: AdPlacement) => {
    sendTrackBeacon({ eventType: 'impression', placement });
  }, []);

  const trackAdClick = useCallback((placement: AdPlacement) => {
    sendTrackBeacon({ eventType: 'click', placement });
  }, []);

  const value = useMemo<MonetizationContextValue>(
    () => ({
      config,
      trackInteraction,
      trackAdImpression,
      trackAdClick,
    }),
    [config, trackInteraction, trackAdImpression, trackAdClick]
  );

  return (
    <MonetizationContext.Provider value={value}>
      {children}
    </MonetizationContext.Provider>
  );
}

export function useMonetization() {
  return useContext(MonetizationContext);
}

const ACCENT_STYLES: Record<
  SponsoredCampaign['accentColor'],
  {
    wrapper: string;
    badge: string;
    cta: string;
  }
> = {
  emerald: {
    wrapper: 'from-emerald-50/90 via-white to-teal-50/70 border-emerald-200',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    cta: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  },
  blue: {
    wrapper: 'from-blue-50/90 via-white to-indigo-50/70 border-blue-200',
    badge: 'bg-blue-100 text-blue-800 border-blue-200',
    cta: 'bg-blue-700 hover:bg-blue-800 text-white',
  },
  amber: {
    wrapper: 'from-amber-50/90 via-white to-orange-50/70 border-amber-200',
    badge: 'bg-amber-100 text-amber-900 border-amber-300',
    cta: 'bg-amber-600 hover:bg-amber-700 text-white',
  },
  purple: {
    wrapper: 'from-purple-50/90 via-white to-fuchsia-50/70 border-purple-200',
    badge: 'bg-purple-100 text-purple-800 border-purple-200',
    cta: 'bg-purple-700 hover:bg-purple-800 text-white',
  },
  rose: {
    wrapper: 'from-rose-50/90 via-white to-pink-50/70 border-rose-200',
    badge: 'bg-rose-100 text-rose-800 border-rose-200',
    cta: 'bg-rose-600 hover:bg-rose-700 text-white',
  },
};

export function AdSlot({
  placement,
  variantIndex = 0,
  className = '',
}: {
  placement: AdPlacement;
  variantIndex?: number;
  className?: string;
}) {
  const { config, trackAdImpression, trackAdClick } = useMonetization();
  const containerRef = useRef<HTMLDivElement | null>(null);
  const impressionSentRef = useRef(false);
  const adsensePushedRef = useRef(false);

  const isPlacementEnabled = useMemo(() => {
    if (!config.enabled) return false;
    if (placement === 'top_leaderboard') return config.placements.topLeaderboard;
    if (placement === 'infeed_grid') return config.placements.inFeedNative;
    if (placement === 'preview_modal') return config.placements.previewModalAd;
    if (placement === 'sticky_footer') return config.placements.stickyBottomBar;
    return true;
  }, [config, placement]);

  const slotId = useMemo(() => {
    if (!config.adsenseEnabled || !config.adsenseClientId) return '';
    if (placement === 'top_leaderboard') return config.adsenseTopSlotId;
    if (placement === 'infeed_grid') return config.adsenseInFeedSlotId;
    if (placement === 'preview_modal') return config.adsensePreviewSlotId;
    if (placement === 'sticky_footer') return config.adsenseStickySlotId;
    return '';
  }, [config, placement]);

  const campaign = useMemo<SponsoredCampaign | null>(() => {
    const matching = config.campaigns.filter(
      (c) => c.enabled && (c.placement === placement || c.placement === 'all')
    );
    const pool = matching.length > 0 ? matching : config.campaigns.filter((c) => c.enabled);
    if (pool.length === 0) return null;
    return pool[variantIndex % pool.length];
  }, [config.campaigns, placement, variantIndex]);

  // Track real viewport impression via IntersectionObserver
  useEffect(() => {
    if (!isPlacementEnabled || impressionSentRef.current) return;
    const node = containerRef.current;
    if (!node || typeof IntersectionObserver === 'undefined') return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !impressionSentRef.current) {
            impressionSentRef.current = true;
            trackAdImpression(placement);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.35 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [isPlacementEnabled, placement, trackAdImpression]);

  // Trigger AdSense unit push if slot ID is active
  useEffect(() => {
    if (!slotId || adsensePushedRef.current) return;
    try {
      adsensePushedRef.current = true;
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // AdSense script still loading or auto-handling
    }
  }, [slotId]);

  if (!isPlacementEnabled) return null;

  const destinationHref =
    config.adNetworkEnabled &&
    config.smartlinkUrl &&
    campaign?.targetUrl === '/advertise' &&
    variantIndex % 2 === 1
      ? config.smartlinkUrl
      : campaign?.targetUrl || '/advertise';

  const isExternal = /^https?:\/\//i.test(destinationHref);
  const styles = ACCENT_STYLES[campaign?.accentColor || 'emerald'];

  return (
    <div ref={containerRef} className={`w-full ${className}`}>
      {/* Google AdSense Unit (renders when Publisher ID + Slot ID are set) */}
      {config.adsenseEnabled && config.adsenseClientId && slotId && (
        <div
          onClick={() => trackAdClick(placement)}
          className="mb-3 bg-white border border-slate-200 rounded-2xl p-2 overflow-hidden text-center"
        >
          <span className="block text-[9px] font-bold uppercase tracking-widest text-slate-400 mb-1">
            Advertisement
          </span>
          <ins
            className="adsbygoogle"
            style={{ display: 'block' }}
            data-ad-client={config.adsenseClientId}
            data-ad-slot={slotId}
            data-ad-format="auto"
            data-full-width-responsive="true"
          />
        </div>
      )}

      {/* Native High-CTR Sponsored / Affiliate Card */}
      {campaign && (
        <div
          className={`bg-gradient-to-r ${styles.wrapper} border rounded-2xl px-4 py-3.5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition hover:shadow-sm`}
        >
          <div className="min-w-0 space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md border ${styles.badge}`}
              >
                <Megaphone className="w-3 h-3" />
                {campaign.badge}
              </span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                Sponsored • Partner Network
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
              {campaign.headline}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              {campaign.subtext}
            </p>
          </div>

          <div className="shrink-0 flex items-center gap-2">
            {isExternal ? (
              <a
                href={destinationHref}
                target="_blank"
                rel="noopener noreferrer sponsored"
                onClick={() => trackAdClick(placement)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition whitespace-nowrap ${styles.cta}`}
              >
                <span>{campaign.ctaText}</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            ) : (
              <Link
                href={destinationHref}
                onClick={() => trackAdClick(placement)}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-xs transition whitespace-nowrap ${styles.cta}`}
              >
                <span>{campaign.ctaText}</span>
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export function PartnerBonusStrip() {
  const { config, trackAdClick } = useMonetization();

  if (!config.enabled || !config.placements.partnerBonusStrip) return null;

  const hasSmartlink = Boolean(config.adNetworkEnabled && config.smartlinkUrl);
  const href = hasSmartlink ? config.smartlinkUrl : '/advertise';
  const label = hasSmartlink
    ? config.smartlinkLabel ||
      'Sponsored Teacher Offer: Free CBC Revision & EdTech Tools →'
    : 'Want Your School, Bookshop or Tuition Program Featured Here? View Ad Packages →';

  return (
    <div className="my-4 bg-slate-900 text-white rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 shadow-xs">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">
          <Sparkles className="w-3 h-3" />
          Partner Offer
        </span>
        <span className="font-semibold text-slate-100">{label}</span>
      </div>
      {hasSmartlink ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer sponsored"
          onClick={() => trackAdClick('smartlink')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-amber-300 hover:text-amber-200 underline underline-offset-2"
        >
          Open Offer <ExternalLink className="w-3.5 h-3.5" />
        </a>
      ) : (
        <Link
          href={href}
          onClick={() => trackAdClick('updates_hub')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
        >
          Advertise With Us <TrendingUp className="w-3.5 h-3.5" />
        </Link>
      )}
    </div>
  );
}

export function StickyEarnerBar() {
  const { config, trackAdImpression, trackAdClick } = useMonetization();
  const [dismissed, setDismissed] = useState(false);
  const sentImpression = useRef(false);

  const stickyCampaign = useMemo(() => {
    return (
      config.campaigns.find((c) => c.enabled && c.placement === 'sticky_footer') ||
      config.campaigns.find((c) => c.enabled) ||
      null
    );
  }, [config.campaigns]);

  useEffect(() => {
    if (
      dismissed ||
      !config.enabled ||
      !config.placements.stickyBottomBar ||
      !stickyCampaign ||
      sentImpression.current
    ) {
      return;
    }
    const timer = window.setTimeout(() => {
      sentImpression.current = true;
      trackAdImpression('sticky_footer');
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [config.enabled, config.placements.stickyBottomBar, dismissed, stickyCampaign, trackAdImpression]);

  if (
    dismissed ||
    !config.enabled ||
    !config.placements.stickyBottomBar ||
    !stickyCampaign
  ) {
    return null;
  }

  const href =
    config.adNetworkEnabled && config.smartlinkUrl
      ? config.smartlinkUrl
      : stickyCampaign.targetUrl;
  const isExternal = /^https?:\/\//i.test(href);

  return (
    <div className="fixed bottom-4 left-4 right-4 md:right-auto md:max-w-xl z-30 bg-slate-900/95 backdrop-blur text-white border border-slate-700 rounded-2xl px-4 py-3 shadow-xl flex items-center justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-1.5 py-0.5 rounded">
            {stickyCampaign.badge}
          </span>
          <span className="text-[10px] text-slate-400 font-medium truncate">
            {stickyCampaign.subtext}
          </span>
        </div>
        <p className="text-xs font-bold text-white truncate">
          {stickyCampaign.headline}
        </p>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {isExternal ? (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer sponsored"
            onClick={() => trackAdClick('sticky_footer')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap"
          >
            {stickyCampaign.ctaText}
          </a>
        ) : (
          <Link
            href={href}
            onClick={() => trackAdClick('sticky_footer')}
            className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3 py-1.5 rounded-lg transition whitespace-nowrap"
          >
            {stickyCampaign.ctaText}
          </Link>
        )}
        <button
          type="button"
          onClick={() => setDismissed(true)}
          aria-label="Dismiss ad banner"
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
