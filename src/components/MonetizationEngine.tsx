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
import { usePathname } from 'next/navigation';
import { ExternalLink, Megaphone, Sparkles, TrendingUp } from 'lucide-react';
import LuxuryWelcomeSong from './LuxuryWelcomeSong';
import LearnerTuitionPostSongGate from './LearnerTuitionPostSongGate';
import CustomerAuthGateModal from './CustomerAuthGateModal';
import {
  DEFAULT_ADSTERRA_SMARTLINK_URL,
  DEFAULT_ADSTERRA_UNIT_SRC,
  DEFAULT_MONETAG_DIRECT_SMARTLINK,
  DEFAULT_MONETAG_INPAGE_PUSH_SRC,
  DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
  DEFAULT_MONETAG_MULTITAG_SRC,
  DEFAULT_MONETAG_MULTITAG_ZONE_ID,
  DEFAULT_MONETAG_VIGNETTE_SRC,
  DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
  DEFAULT_SPONSORED_CAMPAIGNS,
  extractScriptUrlIfTag,
  type AdPlacement,
  type SponsoredCampaign,
  type TrackEventType,
} from '@/lib/monetization';

export interface PublicMonetizationConfig {
  enabled: boolean;
  allowExternalCompanyAds?: boolean;
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
  monetagDirectLinkUrl?: string;
  monetagMode?: 'ad_free_site' | 'clean_banners' | 'multitag_all';
  monetagVignetteZoneId?: string;
  monetagInPagePushZoneId?: string;
  monetagMultiTagZoneId?: string;
  smartlinkUrl: string;
  smartlinkLabel: string;
  placements: {
    topLeaderboard: boolean;
    inFeedNative: boolean;
    previewModalAd: boolean;
    stickyBottomBar: boolean;
    partnerBonusStrip: boolean;
  };
  facebookPublic?: {
    enabled: boolean;
    profileId: string;
    profileUrl: string;
    reelsUrl: string;
    whatsappUrl: string;
    metaPixelId: string;
  };
  connectedSocialLinks?: Array<{
    id: string;
    name: string;
    shortBadge: string;
    url: string;
  }>;
  campaigns: SponsoredCampaign[];
}

const DEFAULT_PUBLIC_CONFIG: PublicMonetizationConfig = {
  enabled: true,
  allowExternalCompanyAds: false,
  adsenseEnabled: false,
  adsenseClientId: '',
  adsenseAutoAds: false,
  adsenseTopSlotId: '',
  adsenseInFeedSlotId: '',
  adsensePreviewSlotId: '',
  adsenseStickySlotId: '',
  adNetworkEnabled: false,
  adNetworkProvider: 'monetag',
  adNetworkScriptUrl: '',
  adNetworkBannerScriptUrl: '',
  monetagDirectLinkUrl: '',
  monetagMode: 'ad_free_site',
  monetagVignetteZoneId: DEFAULT_MONETAG_VIGNETTE_ZONE_ID,
  monetagInPagePushZoneId: DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID,
  monetagMultiTagZoneId: DEFAULT_MONETAG_MULTITAG_ZONE_ID,
  smartlinkUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
  smartlinkLabel: 'Follow Our Official Facebook Profile & Watch Daily CBC Revision Reels →',
  placements: {
    topLeaderboard: true,
    inFeedNative: true,
    previewModalAd: false,
    stickyBottomBar: false,
    partnerBonusStrip: true,
  },
  facebookPublic: {
    enabled: true,
    profileId: '61591027359399',
    profileUrl: 'https://www.facebook.com/profile.php?id=61591027359399',
    reelsUrl: 'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab',
    whatsappUrl:
      'https://wa.me/254728595160?text=Hello%2C%20I%20visited%20cbcmaterials.shop%20and%20need%20CBC%20materials',
    metaPixelId: '',
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
    fbq?: (...args: unknown[]) => void;
    _fbq?: unknown;
  }
}

export function MonetizationProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '';
  const isProtectedAdminRoute =
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mobile-admin') ||
    pathname.startsWith('/monetization');

  const [config, setConfig] = useState<PublicMonetizationConfig>(DEFAULT_PUBLIC_CONFIG);
  const viewRecordedRef = useRef(false);
  const lastInteractionTsRef = useRef<Record<string, number>>({});

  // STRICT ANTI-THIRD-PARTY-ADS FIREWALL: Block & immediately strip ALL unauthorized ads from other companies!
  useEffect(() => {
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (config.allowExternalCompanyAds) return;

    // 1. Unregister any root third-party push Service Worker (/sw.js) while preserving /admin-sw.js
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((reg) => {
            const scriptUrl =
              reg.active?.scriptURL ||
              reg.waiting?.scriptURL ||
              reg.installing?.scriptURL ||
              '';
            if (
              scriptUrl &&
              !scriptUrl.includes('admin-sw.js') &&
              (scriptUrl.endsWith('/sw.js') || /3nbf4|monetag|nap5k|n6wxm|quge5/i.test(scriptUrl))
            ) {
              reg.unregister().catch(() => {});
            }
          });
        })
        .catch(() => {});
    }

    // 2. Actively purge any external third-party company ad scripts, iframes, or high-z-index injected overlays
    const purgeExternalCompanyAds = () => {
      const unauthorizedNodes = document.querySelectorAll(
        '#adsterra-main-unit, #cbc-monetag-vignette-js, #cbc-monetag-inpagepush-js, #cbc-monetag-multitag-js, #cbc-custom-adnetwork-js, #cbc-adsense-script, #cbc-google-adsense-js, ins.adsbygoogle, ' +
          'script[src*="afders.org"], script[src*="asiafilm.org"], script[src*="n6wxm.com"], script[src*="nap5k.com"], script[src*="quge5.com"], script[src*="3nbf4.com"], script[src*="uplcm.com"], script[src*="googlesyndication.com"], script[src*="doubleclick.net"], script[src*="onclickads"], ' +
          'iframe[src*="n6wxm"], iframe[src*="nap5k"], iframe[src*="quge5"], iframe[src*="3nbf4"], iframe[src*="afders"], iframe[src*="asiafilm"], iframe[src*="doubleclick"], iframe[src*="googlesyndication"]'
      );
      unauthorizedNodes.forEach((el) => el.remove());

      // Strip unauthorized external ad overlays injected directly onto document.body/html with ultra-high z-index (>= 999999)
      const bodyChildren = Array.from(document.body.children);
      for (const el of bodyChildren) {
        if (!(el instanceof HTMLElement)) continue;
        if (el.tagName === 'MAIN' || el.tagName === 'HEADER' || el.tagName === 'FOOTER') continue;
        if (el.dataset.nextjsScrollFocusBoundary !== undefined) continue;
        const style = window.getComputedStyle(el);
        const z = parseInt(style.zIndex || '0', 10);
        if (
          (style.position === 'fixed' || style.position === 'absolute') &&
          Number.isFinite(z) &&
          z >= 999999
        ) {
          el.remove();
        }
      }
    };

    purgeExternalCompanyAds();
    const observer = new MutationObserver(() => {
      purgeExternalCompanyAds();
    });
    observer.observe(document.documentElement, {
      childList: true,
      subtree: true,
    });

    return () => observer.disconnect();
  }, [pathname, config.allowExternalCompanyAds]);

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
      // Record real page view & fire Live Search/Customer Arrival Sensor (skip /admin, /mobile-admin and /monetization routes)
      if (
        typeof window !== 'undefined' &&
        !window.location.pathname.startsWith('/admin') &&
        !window.location.pathname.startsWith('/mobile-admin') &&
        !window.location.pathname.startsWith('/monetization')
      ) {
        sendTrackBeacon({ eventType: 'view', placement: 'page' });

        let detectedQuery = '';
        try {
          const sp = new URLSearchParams(window.location.search);
          detectedQuery = sp.get('q') || sp.get('hub') || sp.get('area') || '';
        } catch {}

        fetch('/api/seo/sensor', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            landingPath: window.location.pathname + window.location.search,
            referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
            searchQuery: detectedQuery,
          }),
          keepalive: true,
        }).catch(() => {});
      }
    }

    return () => {
      active = false;
    };
  }, []);

  // Inject Google AdSense Auto Ads script dynamically ONLY when owner permits external ads
  useEffect(() => {
    if (
      !config.enabled ||
      !config.allowExternalCompanyAds ||
      !config.adsenseEnabled ||
      !config.adsenseClientId
    ) {
      return;
    }
    if (typeof document === 'undefined') return;
    if (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/mobile-admin') ||
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

  // Inject Official Meta (Facebook) Pixel dynamically when configured so all website views, clicks & purchases attribute to Facebook
  useEffect(() => {
    const pixelId = config.facebookPublic?.metaPixelId?.trim();
    if (!config.enabled || !config.facebookPublic?.enabled || !pixelId) return;
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (
      window.location.pathname.startsWith('/admin') ||
      window.location.pathname.startsWith('/mobile-admin') ||
      window.location.pathname.startsWith('/monetization')
    ) {
      return;
    }

    const fbScriptId = 'cbc-facebook-pixel-js';
    if (!document.getElementById(fbScriptId)) {
      const inlineInit = document.createElement('script');
      inlineInit.id = fbScriptId;
      inlineInit.text = `!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init',${JSON.stringify(
        pixelId
      )});fbq('track','PageView');`;
      document.head.appendChild(inlineInit);
    }
  }, [
    config.enabled,
    config.facebookPublic?.enabled,
    config.facebookPublic?.metaPixelId,
  ]);

  // External ad network scripts ONLY run if owner explicitly unlocks allowExternalCompanyAds === true
  useEffect(() => {
    if (
      !config.enabled ||
      !config.allowExternalCompanyAds ||
      !config.adNetworkEnabled ||
      config.monetagMode === 'ad_free_site'
    ) {
      return;
    }
    if (typeof window === 'undefined' || typeof document === 'undefined') return;
    if (isProtectedAdminRoute) return;

    // 1. Register Monetag Push Service Worker (/sw.js -> Zone #12288320) immediately (0ms, zero UI obstruction)
    if (config.adNetworkProvider === 'monetag' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    const injectInPagePushOrCustom = () => {
      if (isProtectedAdminRoute) return;
      if (config.adNetworkProvider === 'monetag') {
        const mode = config.monetagMode || 'clean_banners';
        if (mode === 'multitag_all') return; // handled by multitag injector below

        // In-Page Push (#12318967) is a non-blocking corner toast — load after 2.5s so 100% of visits monetize!
        const ippId = 'cbc-monetag-inpagepush-js';
        if (!document.getElementById(ippId)) {
          const p = document.createElement('script');
          p.id = ippId;
          p.async = true;
          p.dataset.zone =
            config.monetagInPagePushZoneId || DEFAULT_MONETAG_INPAGE_PUSH_ZONE_ID;
          p.src = config.adNetworkScriptUrl || DEFAULT_MONETAG_INPAGE_PUSH_SRC;
          document.body.appendChild(p);
        }
      } else if (config.adNetworkScriptUrl) {
        const cleanSrc = extractScriptUrlIfTag(config.adNetworkScriptUrl);
        if (cleanSrc && !document.getElementById('cbc-custom-adnetwork-js')) {
          const cs = document.createElement('script');
          cs.id = 'cbc-custom-adnetwork-js';
          cs.async = true;
          cs.src = cleanSrc;
          document.body.appendChild(cs);
        }
      }
    };

    const injectVignetteOrMultiTag = () => {
      if (isProtectedAdminRoute) return;
      if (config.adNetworkProvider !== 'monetag') return;

      const mode = config.monetagMode || 'clean_banners';
      if (mode === 'multitag_all') {
        const mtId = 'cbc-monetag-multitag-js';
        if (!document.getElementById(mtId)) {
          const s = document.createElement('script');
          s.id = mtId;
          s.async = true;
          s.setAttribute('data-cfasync', 'false');
          s.dataset.zone =
            config.monetagMultiTagZoneId || DEFAULT_MONETAG_MULTITAG_ZONE_ID;
          s.src = DEFAULT_MONETAG_MULTITAG_SRC;
          document.body.appendChild(s);
        }
        return;
      }

      const vigId = 'cbc-monetag-vignette-js';
      if (!document.getElementById(vigId)) {
        const v = document.createElement('script');
        v.id = vigId;
        v.async = true;
        v.dataset.zone =
          config.monetagVignetteZoneId || DEFAULT_MONETAG_VIGNETTE_ZONE_ID;
        v.src = config.adNetworkBannerScriptUrl || DEFAULT_MONETAG_VIGNETTE_SRC;
        document.body.appendChild(v);
      }
    };

    // Always fire non-blocking In-Page Push after 2.5s so short visits still earn USD
    const ippTimer = window.setTimeout(injectInPagePushOrCustom, 2500);

    const win = window as unknown as { __cbcWelcomeSongCompletedAt?: number };
    let alreadyCompletedSong = Boolean(win.__cbcWelcomeSongCompletedAt);
    try {
      if (
        window.location.pathname !== '/' ||
        sessionStorage.getItem('cbc_compulsory_welcome_song_done_v3') === 'true'
      ) {
        alreadyCompletedSong = true;
      }
    } catch {}

    if (alreadyCompletedSong) {
      injectInPagePushOrCustom();
      injectVignetteOrMultiTag();
      return () => window.clearTimeout(ippTimer);
    }

    // Fallback timer (12s) + instant trigger on double-click / song completion so Vignette never misses a visitor
    const vigFallbackTimer = window.setTimeout(injectVignetteOrMultiTag, 12000);
    const onSongDone = () => {
      injectVignetteOrMultiTag();
    };
    window.addEventListener('cbc-compulsory-song-completed', onSongDone);
    window.addEventListener('dblclick', onSongDone, { once: true });
    return () => {
      window.clearTimeout(ippTimer);
      window.clearTimeout(vigFallbackTimer);
      window.removeEventListener('cbc-compulsory-song-completed', onSongDone);
      window.removeEventListener('dblclick', onSongDone);
    };
  }, [
    isProtectedAdminRoute,
    pathname,
    config.enabled,
    config.adNetworkEnabled,
    config.adNetworkProvider,
    config.adNetworkScriptUrl,
    config.adNetworkBannerScriptUrl,
    config.monetagMode,
    config.monetagVignetteZoneId,
    config.monetagInPagePushZoneId,
    config.monetagMultiTagZoneId,
  ]);

  const trackInteraction = useCallback((interactionType: string) => {
    const now = Date.now();
    const prev = lastInteractionTsRef.current[interactionType] || 0;
    // Light 1.2s debounce per interaction key so rapid typing doesn't spam
    if (now - prev < 1200) return;
    lastInteractionTsRef.current[interactionType] = now;
    sendTrackBeacon({ eventType: 'interaction', interactionType });
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      try {
        window.fbq('track', 'ViewContent', { content_name: interactionType });
      } catch {}
    }
  }, []);

  const trackAdImpression = useCallback((placement: AdPlacement) => {
    sendTrackBeacon({ eventType: 'impression', placement });
  }, []);

  const trackAdClick = useCallback((placement: AdPlacement) => {
    sendTrackBeacon({ eventType: 'click', placement });
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      try {
        window.fbq('track', 'Lead', { content_name: placement });
      } catch {}
    }
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
      <LuxuryWelcomeSong />
      <LearnerTuitionPostSongGate />
      <CustomerAuthGateModal />
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

  const destinationHref = campaign?.targetUrl || '/advertise';

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
                Official CBCMATERIALS.SHOP Spotlight
              </span>
            </div>
            <p className="text-xs sm:text-sm font-extrabold text-slate-900 leading-snug">
              {campaign.headline}
            </p>
            <p className="text-[11px] sm:text-xs text-slate-600 leading-relaxed">
              {campaign.subtext}
            </p>
          </div>

          <div className="shrink-0 flex flex-wrap items-center gap-2">
            {config.allowExternalCompanyAds &&
              config.adNetworkEnabled &&
              config.monetagDirectLinkUrl && (
                <a
                  href={config.monetagDirectLinkUrl}
                  target="_blank"
                  rel="noopener noreferrer sponsored"
                  onClick={() => trackAdClick('smartlink')}
                  className="inline-flex items-center gap-1 px-3 py-2.5 rounded-xl text-xs font-extrabold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-xs transition whitespace-nowrap"
                >
                  <span>Partner Offer</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              )}
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

  const fbReelsHref =
    config.facebookPublic?.reelsUrl ||
    'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab';

  return (
    <div className="my-4 bg-slate-900 text-white rounded-xl px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 bg-emerald-500 text-slate-950 font-black text-[10px] uppercase px-2 py-0.5 rounded">
          <Sparkles className="w-3 h-3" />
          CBCMATERIALS.SHOP Official
        </span>
        <span className="font-semibold text-slate-100">
          100% Ad-Free Official CBC Portal • Watch Daily Revision Reels or Book an Approved School Spotlight &rarr;
        </span>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <a
          href={fbReelsHref}
          target="_blank"
          rel="noopener noreferrer"
          onClick={() => trackAdClick('updates_hub')}
          className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-3.5 py-1.5 rounded-lg transition"
        >
          <span>Watch Official CBC Reels</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </a>
        <Link
          href="/advertise"
          onClick={() => trackAdClick('updates_hub')}
          className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300 hover:text-emerald-200 underline underline-offset-2"
        >
          List Your School (Owner Approval) <TrendingUp className="w-3.5 h-3.5" />
        </Link>
      </div>
    </div>
  );
}

export function StickyEarnerBar() {
  // Disabled permanently so no floating ad bar ever overlaps or blocks mobile buttons
  return null;
}
