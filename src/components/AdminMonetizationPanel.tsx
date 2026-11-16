'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  BarChart3,
  CheckCircle2,
  Coins,
  ExternalLink,
  Eye,
  Loader2,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
} from 'lucide-react';
import type {
  AdPlacement,
  MonetizationConfig,
  MonetizationStats,
  SponsoredCampaign,
} from '@/lib/monetization';

interface EarningsSummary {
  impressionEarningsKes: number;
  viewRpmEarningsKes: number;
  clickEarningsKes: number;
  interactionEarningsKes: number;
  totalEstimatedKes: number;
  totalEstimatedUsd: number;
  todayEstimatedKes: number;
  todayEstimatedUsd: number;
  ctrPercent: number;
  today: {
    date: string;
    views: number;
    impressions: number;
    interactions: number;
    clicks: number;
  };
}

export default function AdminMonetizationPanel({ password }: { password: string }) {
  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<
    'networks' | 'adsense' | 'campaigns' | 'analytics'
  >('networks');

  const fetchAll = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const [cfgRes, stRes] = await Promise.all([
        fetch('/api/monetization/config', {
          headers: { 'x-admin-password': password },
        }),
        fetch('/api/monetization/track', {
          headers: { 'x-admin-password': password },
        }),
      ]);

      const cfgJson = await cfgRes.json();
      const stJson = await stRes.json();

      if (cfgRes.ok && cfgJson.config) setConfig(cfgJson.config);
      if (stRes.ok) {
        if (stJson.stats) setStats(stJson.stats);
        if (stJson.earnings) setEarnings(stJson.earnings);
      }
    } catch (err) {
      console.error('Failed to fetch monetization data:', err);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const handleSave = async () => {
    if (!config) return;
    setSaving(true);
    setSaveMsg('');
    try {
      const res = await fetch('/api/monetization/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(config),
      });
      const json = await res.json();
      if (res.ok) {
        setConfig(json.config);
        setSaveMsg('Saved! Monetization & Ad slots updated live on storefront.');
        await fetchAll();
      } else {
        setSaveMsg(`Error: ${json.error || 'Failed to save'}`);
      }
    } catch {
      setSaveMsg('Network error saving monetization settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddCampaign = () => {
    if (!config) return;
    const next: SponsoredCampaign = {
      id: `sponsor-${Date.now()}`,
      enabled: true,
      placement: 'infeed_grid',
      badge: 'SPONSORED',
      headline: 'Your Sponsored Headline or Partner Offer Here',
      subtext: 'Short compelling description seen by teachers & parents across Kenya.',
      ctaText: 'Learn More →',
      targetUrl: 'https://wa.me/254705759072',
      accentColor: 'emerald',
    };
    setConfig({
      ...config,
      campaigns: [next, ...config.campaigns],
    });
  };

  const updateCampaign = (
    id: string,
    patch: Partial<SponsoredCampaign>
  ) => {
    if (!config) return;
    setConfig({
      ...config,
      campaigns: config.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const removeCampaign = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      campaigns: config.campaigns.filter((c) => c.id !== id),
    });
  };

  const activeStreamsCount =
    (config?.adsenseEnabled && config?.adsenseClientId ? 1 : 0) +
    (config?.adNetworkEnabled && (config?.adNetworkScriptUrl || config?.smartlinkUrl)
      ? 1
      : 0) +
    (config?.campaigns?.some((c) => c.enabled) ? 1 : 0);

  return (
    <section className="bg-gradient-to-br from-amber-50/70 via-white to-emerald-50/50 border border-amber-200 rounded-2xl p-6 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
            <Coins className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black text-slate-900 uppercase tracking-tight">
                Site Monetization &amp; Click / View Earnings Center
              </h2>
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {config?.enabled === false
                  ? 'PAUSED'
                  : `${Math.max(1, activeStreamsCount)} EARNING STREAM${
                      activeStreamsCount === 1 ? '' : 'S'
                    } LIVE`}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Earn extra coin from every page view, sample preview, catalog interaction,
              smartlink click, AdSense impression &amp; direct M-Pesa sponsor slot.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/monetization"
            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black transition shadow-xs"
          >
            <Coins className="w-3.5 h-3.5" />
            Full Earnings &amp; Control Page →
          </Link>
          <button
            type="button"
            onClick={fetchAll}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-2 rounded-xl text-xs font-bold text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition"
          >
            <Settings className="w-3.5 h-3.5" />
            {expanded ? 'Hide Ad Studio' : 'Configure Ad Networks & Sponsors'}
          </button>
        </div>
      </div>

      {/* Live Views, Clicks, Interactions & Revenue KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-amber-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-800">
            <span>Est. Ad &amp; Click Revenue</span>
            <Coins className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-xl font-black text-slate-900">
            KES {(earnings?.totalEstimatedKes ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            ${(earnings?.totalEstimatedUsd ?? 0).toFixed(2)} USD • Today: KES{' '}
            {(earnings?.todayEstimatedKes ?? 0).toLocaleString()}
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Views &amp; Ad Impressions</span>
            <Eye className="w-4 h-4 text-blue-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {(
              (stats?.totalViews ?? 0) + (stats?.totalImpressions ?? 0)
            ).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            {(stats?.totalViews ?? 0).toLocaleString()} page views •{' '}
            {(stats?.totalImpressions ?? 0).toLocaleString()} ad views
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Ad &amp; Partner Clicks</span>
            <MousePointerClick className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-xl font-black text-emerald-700">
            {(stats?.totalClicks ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            CTR: {earnings?.ctrPercent ?? 0}% • KES{' '}
            {(earnings?.clickEarningsKes ?? 0).toLocaleString()} click value
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
            <span>Site Interactions</span>
            <Sparkles className="w-4 h-4 text-purple-600" />
          </div>
          <p className="text-xl font-black text-slate-900">
            {(stats?.totalInteractions ?? 0).toLocaleString()}
          </p>
          <p className="text-[11px] text-slate-500 font-medium">
            Sample previews, filter searches &amp; portal clicks
          </p>
        </div>
      </div>

      {/* Expandable Studio */}
      {expanded && config && (
        <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-5">
          {/* Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setActiveTab('networks')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'networks'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                1. Instant CPM &amp; Smartlinks (Monetag / Adsterra)
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('adsense')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'adsense'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                2. Google AdSense &amp; ads.txt
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('campaigns')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'campaigns'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                3. Direct Sponsors &amp; Affiliates ({config.campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('analytics')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                  activeTab === 'analytics'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                4. Placement Breakdown &amp; Rates
              </button>
            </div>

            <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                className="rounded border-slate-300 text-emerald-600"
              />
              Master Monetization Enabled
            </label>
          </div>

          {/* TAB 1: MONETAG / ADSTERRA INSTANT EARNINGS */}
          {activeTab === 'networks' && (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-1.5">
                <p className="font-black text-amber-950 uppercase">
                  Fastest Way to Earn From Every Click, View &amp; Interaction in Kenya (5-Minute Approval):
                </p>
                <p>
                  Sign up free as a Publisher on{' '}
                  <a
                    href="https://monetag.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    Monetag.com
                  </a>{' '}
                  or{' '}
                  <a
                    href="https://adsterra.com/"
                    target="_blank"
                    rel="noreferrer"
                    className="font-bold text-emerald-700 underline"
                  >
                    Adsterra.com
                  </a>{' '}
                  (instant approval, pays out via M-Pesa / PayPal / Airtm / USDT from $5).
                  Add <code className="bg-white px-1.5 py-0.5 rounded font-mono">cbc-schemes-ke.vercel.app</code>,
                  copy your <strong>MultiTag / Social Bar Script URL</strong> and{' '}
                  <strong>Direct Smartlink URL</strong>, and paste them below!
                </p>
              </div>

              <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.adNetworkEnabled}
                  onChange={(e) =>
                    setConfig({ ...config, adNetworkEnabled: e.target.checked })
                  }
                  className="rounded border-slate-300 text-emerald-600"
                />
                Enable CPM / Interaction Ad Network &amp; Smartlink Monetization
              </label>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Ad Network Provider
                  </label>
                  <select
                    value={config.adNetworkProvider}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        adNetworkProvider: e.target.value as
                          | 'monetag'
                          | 'adsterra'
                          | 'custom',
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                  >
                    <option value="monetag">Monetag (MultiTag + Direct Link)</option>
                    <option value="adsterra">Adsterra (Social Bar + Smartlink)</option>
                    <option value="custom">Custom CPM / CPC Ad Script</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Global CPM / In-Page Push / Vignette Script URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://.../tag.min.js"
                    value={config.adNetworkScriptUrl}
                    onChange={(e) =>
                      setConfig({ ...config, adNetworkScriptUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Direct Smartlink URL (Earns on Every Click!)
                  </label>
                  <input
                    type="url"
                    placeholder="https://... (Paste Monetag / Adsterra Direct Link or Affiliate URL)"
                    value={config.smartlinkUrl}
                    onChange={(e) =>
                      setConfig({ ...config, smartlinkUrl: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Smartlink Offer Button Label
                  </label>
                  <input
                    type="text"
                    value={config.smartlinkLabel}
                    onChange={(e) =>
                      setConfig({ ...config, smartlinkLabel: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: GOOGLE ADSENSE */}
          {activeTab === 'adsense' && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs text-slate-700 flex flex-wrap items-center justify-between gap-3">
                <div className="space-y-1">
                  <p className="font-black text-blue-950 uppercase flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    AdSense Approval Requirements Pre-Configured:
                  </p>
                  <p>
                    Your site now includes live{' '}
                    <a href="/privacy-policy" target="_blank" className="underline font-bold">
                      /privacy-policy
                    </a>
                    ,{' '}
                    <a href="/terms" target="_blank" className="underline font-bold">
                      /terms
                    </a>
                    ,{' '}
                    <a href="/advertise" target="_blank" className="underline font-bold">
                      /advertise
                    </a>
                    ,{' '}
                    <a href="/sitemap.xml" target="_blank" className="underline font-bold">
                      /sitemap.xml
                    </a>
                    , and dynamic{' '}
                    <a href="/ads.txt" target="_blank" className="underline font-bold">
                      /ads.txt
                    </a>
                    !
                  </p>
                </div>
                <a
                  href="/ads.txt"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1 bg-white border border-blue-300 text-blue-800 font-bold px-3 py-1.5 rounded-lg"
                >
                  Preview /ads.txt <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.adsenseEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, adsenseEnabled: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Enable Google AdSense Units &amp; Verification Tag
                </label>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.adsenseAutoAds}
                    onChange={(e) =>
                      setConfig({ ...config, adsenseAutoAds: e.target.checked })
                    }
                    className="rounded border-slate-300 text-blue-600"
                  />
                  Enable Google Auto Ads (Vignettes, Anchor &amp; In-Page)
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    AdSense Publisher ID
                  </label>
                  <input
                    type="text"
                    placeholder="ca-pub-1234567890123456"
                    value={config.adsenseClientId}
                    onChange={(e) =>
                      setConfig({ ...config, adsenseClientId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Top Leaderboard Ad Slot ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 4829103847"
                    value={config.adsenseTopSlotId}
                    onChange={(e) =>
                      setConfig({ ...config, adsenseTopSlotId: e.target.value })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    In-Feed / Preview Ad Slot ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9182736450"
                    value={config.adsenseInFeedSlotId}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        adsenseInFeedSlotId: e.target.value,
                        adsensePreviewSlotId: e.target.value,
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                  Additional Authorized Sellers Lines for /ads.txt (Optional — Monetag / Adsterra / Ezoic)
                </label>
                <textarea
                  rows={3}
                  placeholder="Paste any extra ads.txt seller lines here (one per line)..."
                  value={config.adsTxtCustomLines}
                  onChange={(e) =>
                    setConfig({ ...config, adsTxtCustomLines: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                />
              </div>
            </div>
          )}

          {/* TAB 3: DIRECT SPONSORED & AFFILIATE CAMPAIGNS */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap gap-4 text-xs font-semibold text-slate-700">
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.placements.topLeaderboard}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          placements: {
                            ...config.placements,
                            topLeaderboard: e.target.checked,
                          },
                        })
                      }
                    />
                    Top Leaderboard
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.placements.inFeedNative}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          placements: {
                            ...config.placements,
                            inFeedNative: e.target.checked,
                          },
                        })
                      }
                    />
                    In-Feed Catalog Ads
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.placements.previewModalAd}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          placements: {
                            ...config.placements,
                            previewModalAd: e.target.checked,
                          },
                        })
                      }
                    />
                    Free Sample Preview Ad
                  </label>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.placements.stickyBottomBar}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          placements: {
                            ...config.placements,
                            stickyBottomBar: e.target.checked,
                          },
                        })
                      }
                    />
                    Sticky Mobile/Bottom Bar
                  </label>
                </div>

                <button
                  type="button"
                  onClick={handleAddCampaign}
                  className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Sponsored Banner / Affiliate Link
                </button>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {config.campaigns.map((camp) => (
                  <div
                    key={camp.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={camp.enabled}
                          onChange={(e) =>
                            updateCampaign(camp.id, { enabled: e.target.checked })
                          }
                        />
                        <span className="text-xs font-black uppercase text-slate-800 flex items-center gap-1">
                          <Megaphone className="w-3.5 h-3.5 text-emerald-600" />
                          {camp.badge}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <select
                          value={camp.placement}
                          onChange={(e) =>
                            updateCampaign(camp.id, {
                              placement: e.target.value as AdPlacement | 'all',
                            })
                          }
                          className="px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                        >
                          <option value="all">All Placements</option>
                          <option value="top_leaderboard">Top Leaderboard</option>
                          <option value="infeed_grid">In-Feed Catalog</option>
                          <option value="preview_modal">Preview Modal</option>
                          <option value="sticky_footer">Sticky Bottom Bar</option>
                          <option value="tsc_services_hub">TSC Services Hub</option>
                          <option value="holiday_side_hustles">Holiday Side Hustles</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => removeCampaign(camp.id)}
                          className="text-rose-600 hover:text-rose-800 p-1"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        value={camp.headline}
                        onChange={(e) =>
                          updateCampaign(camp.id, { headline: e.target.value })
                        }
                        placeholder="Headline..."
                        className="md:col-span-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-semibold"
                      />
                      <input
                        type="text"
                        value={camp.ctaText}
                        onChange={(e) =>
                          updateCampaign(camp.id, { ctaText: e.target.value })
                        }
                        placeholder="Button Text"
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={camp.subtext}
                        onChange={(e) =>
                          updateCampaign(camp.id, { subtext: e.target.value })
                        }
                        placeholder="Short description..."
                        className="md:col-span-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                      />
                      <input
                        type="text"
                        value={camp.targetUrl}
                        onChange={(e) =>
                          updateCampaign(camp.id, { targetUrl: e.target.value })
                        }
                        placeholder="https://... or /advertise"
                        className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: ANALYTICS & RATE CALIBRATION */}
          {activeTab === 'analytics' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    CPM Rate (KES per 1,000 Ad Views)
                  </label>
                  <input
                    type="number"
                    step="1"
                    value={config.ratesKes.cpmImpressionsKes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ratesKes: {
                          ...config.ratesKes,
                          cpmImpressionsKes: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    CPC Rate (KES per Ad / Link Click)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    value={config.ratesKes.cpcClickKes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ratesKes: {
                          ...config.ratesKes,
                          cpcClickKes: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    Interaction Value (KES per Engaged Action)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={config.ratesKes.interactionBonusKes}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        ratesKes: {
                          ...config.ratesKes,
                          interactionBonusKes: Number(e.target.value) || 0,
                        },
                      })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                  />
                </div>
              </div>

              {stats && Object.keys(stats.byPlacement).length > 0 && (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-50 px-4 py-2.5 border-b border-slate-200 flex items-center gap-2 text-xs font-black uppercase text-slate-700">
                    <BarChart3 className="w-4 h-4 text-emerald-600" />
                    Performance by Placement Slot
                  </div>
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50/50 text-slate-500">
                      <tr>
                        <th className="text-left px-4 py-2">Slot</th>
                        <th className="text-right px-4 py-2">Impressions</th>
                        <th className="text-right px-4 py-2">Clicks</th>
                        <th className="text-right px-4 py-2">CTR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {Object.entries(stats.byPlacement).map(([slot, row]) => {
                        const ctr =
                          row.impressions > 0
                            ? ((row.clicks / row.impressions) * 100).toFixed(1)
                            : '0.0';
                        return (
                          <tr key={slot}>
                            <td className="px-4 py-2 font-mono font-semibold text-slate-800">
                              {slot}
                            </td>
                            <td className="px-4 py-2 text-right">
                              {row.impressions.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right font-bold text-emerald-700">
                              {row.clicks.toLocaleString()}
                            </td>
                            <td className="px-4 py-2 text-right text-slate-500">
                              {ctr}%
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Save Bar */}
          <div className="pt-3 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
            {saveMsg ? (
              <span className="text-xs font-bold text-emerald-700">{saveMsg}</span>
            ) : (
              <span className="text-xs text-slate-500">
                Changes apply immediately across the live site without redeploying.
              </span>
            )}
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-bold text-xs px-5 py-2.5 rounded-xl transition"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              Save Monetization Settings Live
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
