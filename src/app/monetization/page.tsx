'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  ArrowLeft,
  BarChart3,
  Calendar,
  CheckCircle2,
  Coins,
  ExternalLink,
  Eye,
  Layers,
  Loader2,
  Lock,
  Megaphone,
  MousePointerClick,
  Plus,
  RefreshCw,
  Settings,
  Sparkles,
  Trash2,
  TrendingUp,
  Wallet,
  Zap,
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

interface OrderRow {
  id: string;
  amount: number;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
}

const INTERACTION_LABELS: Record<string, string> = {
  all_curriculum_materials_btn_click: 'ALL CURRICULUM MATERIALS Top Button Clicks',
  holiday_side_hustles_open: 'HOLIDAY SIDE HUSTLES Button Opens',
  side_hustle_ai_training_click: 'AI Training Company Clicks (AITrainingJobs.it)',
  side_hustle_survey_click: 'Paid Survey Account Clicks',
  tsc_all_services_btn_click: 'TSC All-Services Button Clicks (Monetized)',
  tsc_service_tpay: 'TSC T-PAY Payslip & P9 Clicks',
  tsc_service_tpad2: 'TSC TPAD 2 Appraisal Clicks',
  tsc_service_registration: 'TSC Teacher Registration Clicks',
  tsc_service_recruitment: 'TSC Vacancies & Promotions Clicks',
  tsc_service_leave: 'TSC Online Leave Portal Clicks',
  tsc_service_transfers: 'TSC Transfers & Swaps Clicks',
  tsc_service_wealth: 'TSC Wealth Declaration Clicks',
  tsc_service_tmis: 'TSC TMIS Institutional Clicks',
  tsc_service_medical: 'TSC Medical Scheme Clicks',
  tsc_service_circulars: 'TSC Circulars & CBA Downloads Clicks',
  gaming_arena_open: 'CBC Subject Gaming Arena Opens',
  gaming_stk_initiate: 'Gaming KSh 10 Pass STK Initiations',
  gaming_question_answered: 'Gaming Subject Questions Answered',
  counselling_button_open: 'Guidance & Counselling Desk Opens',
  counselling_role_parent: 'Guidance Chosen: Parent / Guardian',
  counselling_role_learner: 'Guidance Chosen: Learner / Student',
  counselling_message_sent: 'Gemini Guidance Questions Asked',
  tuition_student_btn_click: 'Student Holiday/Personal Teacher Button Clicks',
  tuition_teacher_btn_click: 'Teacher Tuition Registration Button Clicks',
  preview_sample_open: 'Free Sample Previews Opened',
  checkout_modal_open: 'Buy / M-Pesa Checkout Opens',
  catalog_search: 'Catalog Keyword Searches',
  category_card_select: 'Curriculum Area Card Clicks',
  area_dropdown_select: 'Material Area Dropdown Filters',
  grade_pill_select: 'PP1–Grade 12 Quick Pill Clicks',
  grade_dropdown_select: 'Grade Level Dropdown Filters',
  subject_filter_select: 'Subject / Learning Area Filters',
  term_filter_select: 'Term 1 / 2 / 3 Filter Clicks',
  exam_filter_select: 'KPSEA / KJSEA / Opener / Mid-Term Clicks',
  moe_hub_quickjump: '2026 MoE Calendar Quick Jumps',
  portal_tsc_tpad2: 'TSC TPAD 2 Portal Clicks',
  portal_tsc_tpay: 'TSC T-PAY Payslip Portal Clicks',
  portal_knec_cba: 'KNEC CBA Portal Clicks',
  portal_kicd_orangebook: 'KICD Orange Book Link Clicks',
  whatsapp_help_click: 'WhatsApp Support Button Clicks',
};

const PLACEMENT_LABELS: Record<string, string> = {
  holiday_side_hustles: 'HOLIDAY SIDE HUSTLES Hub (AI & Survey Clicks)',
  tsc_services_hub: 'All-in-One TSC Services Hub (Monetized Clicks)',
  top_leaderboard: 'Top Homepage Leaderboard Banner',
  infeed_grid: 'In-Feed Catalog Native Ad Cards',
  preview_modal: 'Free Document Preview Modal Ad',
  sticky_footer: 'Sticky Bottom Mobile/Desktop Bar',
  smartlink: 'Direct Smartlink / Partner Offer Strip',
  updates_hub: 'MoE & TSC Desk Sponsor Link',
  general: 'General / Auto Ad Placement',
};

function formatInteractionName(key: string): string {
  if (INTERACTION_LABELS[key]) return INTERACTION_LABELS[key];
  return key
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MonetizationControlPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [checkingAuth, setCheckingAuth] = useState(false);

  const [config, setConfig] = useState<MonetizationConfig | null>(null);
  const [stats, setStats] = useState<MonetizationStats | null>(null);
  const [earnings, setEarnings] = useState<EarningsSummary | null>(null);
  const [mpesaRevenueKes, setMpesaRevenueKes] = useState(0);
  const [mpesaCompletedCount, setMpesaCompletedCount] = useState(0);

  const [loadingData, setLoadingData] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [controlTab, setControlTab] = useState<
    'placements' | 'networks' | 'adsense' | 'campaigns' | 'rates'
  >('placements');

  const loadDashboard = useCallback(async (pw: string, includeConfig = true) => {
    setLoadingData(true);
    setAuthError('');
    try {
      const requests: Promise<Response>[] = [
        fetch('/api/monetization/track', {
          headers: { 'x-admin-password': pw },
        }),
        fetch('/api/admin/orders', {
          headers: { 'x-admin-password': pw },
        }),
      ];
      if (includeConfig) {
        requests.push(
          fetch('/api/monetization/config', {
            headers: { 'x-admin-password': pw },
          })
        );
      }

      const responses = await Promise.all(requests);
      const trackRes = responses[0];
      const ordersRes = responses[1];
      const cfgRes = includeConfig ? responses[2] : null;

      if (trackRes.status === 401) {
        setAuthenticated(false);
        sessionStorage.removeItem('cbc_admin_pw');
        setAuthError('Invalid admin password.');
        return;
      }

      const trackJson = await trackRes.json();
      if (trackRes.ok) {
        setAuthenticated(true);
        sessionStorage.setItem('cbc_admin_pw', pw);
        if (trackJson.stats) setStats(trackJson.stats);
        if (trackJson.earnings) setEarnings(trackJson.earnings);
      }

      if (ordersRes.ok) {
        const ordersJson = await ordersRes.json();
        const completed = ((ordersJson.orders || []) as OrderRow[]).filter(
          (o) => o.status === 'COMPLETED'
        );
        setMpesaCompletedCount(completed.length);
        setMpesaRevenueKes(
          completed.reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
        );
      }

      if (cfgRes && cfgRes.ok) {
        const cfgJson = await cfgRes.json();
        if (cfgJson.config) setConfig(cfgJson.config);
      }
    } catch {
      setAuthError('Network error loading monetization dashboard.');
    } finally {
      setLoadingData(false);
      setCheckingAuth(false);
    }
  }, []);

  useEffect(() => {
    const saved = sessionStorage.getItem('cbc_admin_pw');
    if (saved) {
      setPassword(saved);
      setCheckingAuth(true);
      loadDashboard(saved, true);
    }
  }, [loadDashboard]);

  // Live auto-refresh stats & earnings without overwriting unsaved form edits
  useEffect(() => {
    if (!authenticated || !password || !autoRefresh) return;
    const timer = window.setInterval(() => {
      loadDashboard(password, false);
    }, 8000);
    return () => window.clearInterval(timer);
  }, [authenticated, password, autoRefresh, loadDashboard]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setCheckingAuth(true);
    await loadDashboard(password, true);
  };

  const saveConfigLive = async (overrideCfg?: MonetizationConfig) => {
    const payload = overrideCfg || config;
    if (!payload) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const res = await fetch('/api/monetization/config', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (res.ok) {
        setConfig(json.config);
        setSaveMessage('All monetization controls saved live!');
        await loadDashboard(password, false);
      } else {
        setSaveMessage(`Error: ${json.error || 'Could not save'}`);
      }
    } catch {
      setSaveMessage('Failed to connect while saving.');
    } finally {
      setSaving(false);
    }
  };

  const triggerTestEvent = async (
    eventType: 'view' | 'impression' | 'interaction' | 'click'
  ) => {
    await fetch('/api/monetization/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        eventType,
        placement: eventType === 'click' ? 'smartlink' : 'top_leaderboard',
        interactionType: 'preview_sample_open',
      }),
    });
    await loadDashboard(password, false);
  };

  const handleResetStats = async () => {
    if (
      !window.confirm(
        'Reset all tracked views, clicks, interactions, and estimated ad earnings to zero?'
      )
    ) {
      return;
    }
    const res = await fetch('/api/monetization/track', {
      method: 'DELETE',
      headers: { 'x-admin-password': password },
    });
    if (res.ok) {
      await loadDashboard(password, false);
      setSaveMessage('Counters reset to zero.');
    }
  };

  const addCampaign = () => {
    if (!config) return;
    const item: SponsoredCampaign = {
      id: `sponsor-${Date.now()}`,
      enabled: true,
      placement: 'infeed_grid',
      badge: 'SPONSORED',
      headline: 'New Sponsored School / Bookshop / Affiliate Offer',
      subtext: 'Reach thousands of Kenyan teachers & parents browsing CBC resources.',
      ctaText: 'Open Offer →',
      targetUrl: 'https://wa.me/254705759072',
      accentColor: 'emerald',
    };
    setConfig({ ...config, campaigns: [item, ...config.campaigns] });
  };

  const updateCampaign = (id: string, patch: Partial<SponsoredCampaign>) => {
    if (!config) return;
    setConfig({
      ...config,
      campaigns: config.campaigns.map((c) => (c.id === id ? { ...c, ...patch } : c)),
    });
  };

  const deleteCampaign = (id: string) => {
    if (!config) return;
    setConfig({
      ...config,
      campaigns: config.campaigns.filter((c) => c.id !== id),
    });
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                <Coins className="w-6 h-6" />
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-lg">
                  Monetization &amp; Earnings Hub
                </h1>
                <p className="text-xs text-slate-500">
                  Views, Clicks, Interactions &amp; Ad Revenue Control
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Storefront
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter ADMIN_PASSWORD..."
                  required
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>
            </div>
            {authError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={checkingAuth}
              className="w-full bg-amber-500 hover:bg-amber-400 disabled:bg-slate-300 text-slate-950 font-black py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              {checkingAuth && <Loader2 className="w-4 h-4 animate-spin" />}
              Open Earnings &amp; Control Center
            </button>
          </form>
        </div>
      </div>
    );
  }

  const cpmRate = Number(config?.ratesKes.cpmImpressionsKes) || 240;
  const cpcRate = Number(config?.ratesKes.cpcClickKes) || 18;
  const interRate = Number(config?.ratesKes.interactionBonusKes) || 0.75;
  const usdRate = Number(config?.ratesKes.usdToKesRate) || 129.5;

  const adCoinKes = earnings?.totalEstimatedKes ?? 0;
  const combinedTotalKes = Number((adCoinKes + mpesaRevenueKes).toFixed(2));
  const combinedTotalUsd = Number((combinedTotalKes / usdRate).toFixed(2));

  const interactionEntries = Object.entries(stats?.byInteractionType || {}).sort(
    (a, b) => b[1] - a[1]
  );
  const maxInteractionCount =
    interactionEntries.length > 0 ? Math.max(...interactionEntries.map((e) => e[1])) : 1;

  const placementEntries = Object.entries(stats?.byPlacement || {}).sort(
    (a, b) => b[1].clicks * cpcRate + (b[1].impressions / 1000) * cpmRate -
      (a[1].clicks * cpcRate + (a[1].impressions / 1000) * cpmRate)
  );

  const dailyEntries = Object.values(stats?.daily || {})
    .sort((a, b) => b.date.localeCompare(a.date))
    .slice(0, 14);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 pb-16">
      {/* Top Dark Command Header */}
      <header className="bg-slate-950 text-white border-b border-slate-800 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shadow">
              <Coins className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-black tracking-tight">
                  Monetization, Views, Clicks &amp; Earnings Studio
                </h1>
                <span
                  className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                    config?.enabled === false
                      ? 'bg-rose-600 text-white'
                      : 'bg-emerald-500 text-slate-950'
                  }`}
                >
                  {config?.enabled === false ? 'PAUSED' : 'LIVE EARNING'}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Real-time clicks, viewport ad impressions, site interactions &amp; revenue
                control
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <label className="inline-flex items-center gap-1.5 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-xl text-xs text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-slate-600 text-emerald-500"
              />
              Live Pulse (8s)
            </label>

            <button
              type="button"
              onClick={() => loadDashboard(password, true)}
              className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white px-3 py-2 rounded-xl text-xs font-bold transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
              Refresh
            </button>

            <Link
              href="/admin"
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <Wallet className="w-3.5 h-3.5" />
              M-Pesa &amp; Materials Admin
            </Link>

            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Storefront
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 1. TOP EARNINGS & TRAFFIC SCOREBOARD */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-gradient-to-br from-amber-400 via-amber-300 to-yellow-200 text-slate-950 rounded-2xl p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <span>Ad &amp; Interaction Coin</span>
              <Coins className="w-4 h-4" />
            </div>
            <p className="text-2xl font-black">
              KES {adCoinKes.toLocaleString()}
            </p>
            <p className="text-xs font-bold text-slate-800">
              ${(earnings?.totalEstimatedUsd ?? 0).toFixed(2)} USD • Today: KES{' '}
              {(earnings?.todayEstimatedKes ?? 0).toLocaleString()}
            </p>
          </div>

          <div className="bg-slate-900 text-white rounded-2xl p-5 shadow-sm space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider text-emerald-300">
              <span>Combined Total Earned</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <p className="text-2xl font-black text-white">
              KES {combinedTotalKes.toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-300 font-medium">
              ${combinedTotalUsd.toFixed(2)} USD (Ads + {mpesaCompletedCount} M-Pesa sales)
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
              <span>Page &amp; Ad Views</span>
              <Eye className="w-4 h-4 text-blue-600" />
            </div>
            <p className="text-2xl font-black text-slate-900">
              {(
                (stats?.totalViews ?? 0) + (stats?.totalImpressions ?? 0)
              ).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              {(stats?.totalViews ?? 0).toLocaleString()} visits •{' '}
              {(stats?.totalImpressions ?? 0).toLocaleString()} ad views
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
              <span>Ad &amp; Offer Clicks</span>
              <MousePointerClick className="w-4 h-4 text-emerald-600" />
            </div>
            <p className="text-2xl font-black text-emerald-700">
              {(stats?.totalClicks ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              CTR: {earnings?.ctrPercent ?? 0}% • Today:{' '}
              {(earnings?.today.clicks ?? 0).toLocaleString()} clicks
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold uppercase text-slate-500">
              <span>Site Interactions</span>
              <Activity className="w-4 h-4 text-purple-600" />
            </div>
            <p className="text-2xl font-black text-purple-700">
              {(stats?.totalInteractions ?? 0).toLocaleString()}
            </p>
            <p className="text-[11px] text-slate-500 font-medium">
              Today: {(earnings?.today.interactions ?? 0).toLocaleString()} engaged actions
            </p>
          </div>
        </section>

        {/* 2. EXACT AMOUNT EARNED BY REVENUE ACTIVITY */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                Amount Earned Breakdown (Views vs Ad Impressions vs Clicks vs Interactions)
              </h2>
              <p className="text-xs text-slate-500">
                Live breakdown of how every visitor action contributes to your balance
              </p>
            </div>
            <Link
              href="/advertise"
              target="_blank"
              className="text-xs font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
            >
              View Public /advertise Rate Card <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-blue-800">
                1. Page Views Revenue
              </span>
              <p className="text-lg font-black text-slate-900">
                KES {(earnings?.viewRpmEarningsKes ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-600">
                From {(stats?.totalViews ?? 0).toLocaleString()} page loads
              </p>
            </div>

            <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-indigo-800">
                2. Ad Viewport Impressions
              </span>
              <p className="text-lg font-black text-slate-900">
                KES {(earnings?.impressionEarningsKes ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-600">
                From {(stats?.totalImpressions ?? 0).toLocaleString()} verified ad views (@ KES{' '}
                {cpmRate}/1k)
              </p>
            </div>

            <div className="rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-emerald-800">
                3. Ad &amp; Smartlink Clicks
              </span>
              <p className="text-lg font-black text-emerald-800">
                KES {(earnings?.clickEarningsKes ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-600">
                From {(stats?.totalClicks ?? 0).toLocaleString()} clicks (@ KES {cpcRate}/click)
              </p>
            </div>

            <div className="rounded-xl border border-purple-100 bg-purple-50/50 p-4 space-y-1">
              <span className="text-[11px] font-extrabold uppercase text-purple-800">
                4. Site Interactions Value
              </span>
              <p className="text-lg font-black text-purple-900">
                KES {(earnings?.interactionEarningsKes ?? 0).toLocaleString()}
              </p>
              <p className="text-[11px] text-slate-600">
                From {(stats?.totalInteractions ?? 0).toLocaleString()} interactions (@ KES{' '}
                {interRate}/action)
              </p>
            </div>
          </div>
        </section>

        {/* 3. ALL INTERACTIONS & AD PLACEMENTS LIVE BREAKDOWN */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Every Interaction Type */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-purple-600" />
                  All Site Interactions by Type
                </h3>
                <p className="text-xs text-slate-500">
                  Every preview, filter, search, checkout open &amp; portal click
                </p>
              </div>
              <span className="text-xs font-extrabold bg-purple-50 text-purple-800 px-2.5 py-1 rounded-full">
                {(stats?.totalInteractions ?? 0).toLocaleString()} total
              </span>
            </div>

            {interactionEntries.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <p>No interactions recorded yet.</p>
                <button
                  type="button"
                  onClick={() => triggerTestEvent('interaction')}
                  className="text-purple-700 font-bold underline"
                >
                  Simulate a Test Interaction Now
                </button>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {interactionEntries.map(([key, count]) => {
                  const pct = Math.max(4, Math.round((count / maxInteractionCount) * 100));
                  const earnedKes = (count * interRate).toFixed(2);
                  return (
                    <div key={key} className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-800">
                          {formatInteractionName(key)}
                        </span>
                        <span className="font-mono text-slate-600">
                          <strong>{count.toLocaleString()}</strong> •{' '}
                          <span className="text-emerald-700 font-bold">
                            KES {earnedKes}
                          </span>
                        </span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-600 to-emerald-500 rounded-full"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Ad Slot / Placement Performance */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-900 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-emerald-600" />
                  Views, Clicks &amp; Earnings by Ad Slot
                </h3>
                <p className="text-xs text-slate-500">
                  Performance of each banner, modal, sticky bar &amp; smartlink slot
                </p>
              </div>
              <span className="text-xs font-extrabold bg-emerald-50 text-emerald-800 px-2.5 py-1 rounded-full">
                {(stats?.totalClicks ?? 0).toLocaleString()} clicks
              </span>
            </div>

            {placementEntries.length === 0 ? (
              <div className="py-10 text-center text-xs text-slate-400 space-y-2">
                <p>No ad slot impressions or clicks recorded yet.</p>
                <button
                  type="button"
                  onClick={() => triggerTestEvent('click')}
                  className="text-emerald-700 font-bold underline"
                >
                  Simulate a Test Ad Click Now
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                    <tr>
                      <th className="text-left px-3 py-2.5 rounded-l-lg">Placement</th>
                      <th className="text-right px-3 py-2.5">Ad Views</th>
                      <th className="text-right px-3 py-2.5">Clicks</th>
                      <th className="text-right px-3 py-2.5">CTR</th>
                      <th className="text-right px-3 py-2.5 rounded-r-lg">Earned</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {placementEntries.map(([slot, row]) => {
                      const ctr =
                        row.impressions > 0
                          ? ((row.clicks / row.impressions) * 100).toFixed(1)
                          : '0.0';
                      const slotKes =
                        (row.impressions / 1000) * cpmRate + row.clicks * cpcRate;
                      return (
                        <tr key={slot}>
                          <td className="px-3 py-2.5 font-bold text-slate-800">
                            {PLACEMENT_LABELS[slot] || slot}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono">
                            {row.impressions.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-bold text-emerald-700">
                            {row.clicks.toLocaleString()}
                          </td>
                          <td className="px-3 py-2.5 text-right text-slate-500">
                            {ctr}%
                          </td>
                          <td className="px-3 py-2.5 text-right font-mono font-black text-slate-900">
                            KES {slotKes.toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        {/* 4. FULL MONETIZATION CONTROL STUDIO */}
        {config && (
          <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div className="flex items-center gap-2.5">
                <Settings className="w-5 h-5 text-amber-500" />
                <div>
                  <h2 className="text-base font-black uppercase tracking-tight text-slate-900">
                    Full Monetization Control Panel
                  </h2>
                  <p className="text-xs text-slate-500">
                    Turn ad zones on/off, connect Monetag / Adsterra / Google AdSense,
                    manage sponsored banners &amp; calibrate payout rates
                  </p>
                </div>
              </div>

              <label className="inline-flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-xl text-xs font-black cursor-pointer">
                <input
                  type="checkbox"
                  checked={config.enabled}
                  onChange={(e) => {
                    const next = { ...config, enabled: e.target.checked };
                    setConfig(next);
                    saveConfigLive(next);
                  }}
                  className="rounded border-slate-500 text-emerald-400"
                />
                Master Monetization Switch ({config.enabled ? 'ACTIVE' : 'OFF'})
              </label>
            </div>

            {/* Control Tabs */}
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setControlTab('placements')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  controlTab === 'placements'
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                1. Ad Zones &amp; Placements
              </button>
              <button
                type="button"
                onClick={() => setControlTab('networks')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  controlTab === 'networks'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                2. Monetag / Adsterra / Smartlinks
              </button>
              <button
                type="button"
                onClick={() => setControlTab('adsense')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  controlTab === 'adsense'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                3. Google AdSense &amp; ads.txt
              </button>
              <button
                type="button"
                onClick={() => setControlTab('campaigns')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  controlTab === 'campaigns'
                    ? 'bg-emerald-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Megaphone className="w-3.5 h-3.5" />
                4. Sponsored Banners ({config.campaigns.length})
              </button>
              <button
                type="button"
                onClick={() => setControlTab('rates')}
                className={`px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  controlTab === 'rates'
                    ? 'bg-purple-700 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Coins className="w-3.5 h-3.5" />
                5. Rates &amp; Live Simulator
              </button>
            </div>

            {/* TAB 1: PLACEMENT SWITCHES */}
            {controlTab === 'placements' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  {
                    key: 'topLeaderboard' as const,
                    title: 'Top Homepage Leaderboard',
                    desc: 'High-visibility banner right below the 2026 MoE & TSC Desk.',
                  },
                  {
                    key: 'inFeedNative' as const,
                    title: 'In-Feed Catalog Ad Units',
                    desc: 'Native cards placed between PP1–Grade 12 curriculum areas.',
                  },
                  {
                    key: 'previewModalAd' as const,
                    title: 'Free Sample Preview Modal Ad',
                    desc: 'Earns impressions & clicks every time a teacher previews a file.',
                  },
                  {
                    key: 'stickyBottomBar' as const,
                    title: 'Sticky Bottom Earner Bar',
                    desc: 'Dismissible floating CTA bar on mobile and desktop.',
                  },
                  {
                    key: 'partnerBonusStrip' as const,
                    title: 'Partner Offer / Smartlink Strip',
                    desc: 'Interactive horizontal bar above the grade selector pills.',
                  },
                ].map((item) => (
                  <label
                    key={item.key}
                    className={`border rounded-xl p-4 cursor-pointer transition flex items-start gap-3 ${
                      config.placements[item.key]
                        ? 'border-emerald-300 bg-emerald-50/50'
                        : 'border-slate-200 bg-slate-50/50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={config.placements[item.key]}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          placements: {
                            ...config.placements,
                            [item.key]: e.target.checked,
                          },
                        })
                      }
                      className="mt-1 rounded border-slate-300 text-emerald-600"
                    />
                    <div className="space-y-0.5">
                      <p className="text-xs font-black text-slate-900">{item.title}</p>
                      <p className="text-[11px] text-slate-600 leading-relaxed">
                        {item.desc}
                      </p>
                    </div>
                  </label>
                ))}
              </div>
            )}

            {/* TAB 2: MONETAG / ADSTERRA */}
            {controlTab === 'networks' && (
              <div className="space-y-4">
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-xs text-slate-700 space-y-1">
                  <p className="font-black text-amber-950 uppercase">
                    Instant CPM + Click Network Setup (Monetag or Adsterra — Pays via M-Pesa / PayPal / USDT):
                  </p>
                  <p>
                    Create a free publisher account on{' '}
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
                    </a>
                    , paste your Script URL and Direct Smartlink URL below, and save.
                  </p>
                </div>

                <label className="inline-flex items-center gap-2 text-xs font-bold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={config.adNetworkEnabled}
                    onChange={(e) =>
                      setConfig({ ...config, adNetworkEnabled: e.target.checked })
                    }
                  />
                  Enable CPM Script &amp; Direct Smartlink Monetization
                </label>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Network
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
                      <option value="monetag">Monetag</option>
                      <option value="adsterra">Adsterra</option>
                      <option value="custom">Custom Network</option>
                    </select>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      MultiTag / Social Bar / In-Page Push Script URL
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
                      Direct Smartlink URL (Earns Every Time Clicked)
                    </label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={config.smartlinkUrl}
                      onChange={(e) =>
                        setConfig({ ...config, smartlinkUrl: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Smartlink CTA Label
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

            {/* TAB 3: GOOGLE ADSENSE */}
            {controlTab === 'adsense' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-xs">
                  <span className="font-semibold text-blue-950">
                    Google AdSense Publisher ID automatically updates both your live ad
                    tags and <code className="font-mono font-bold">/ads.txt</code>.
                  </span>
                  <a
                    href="/ads.txt"
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 bg-white border border-blue-300 px-3 py-1.5 rounded-lg font-bold text-blue-800"
                  >
                    Open /ads.txt <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>

                <div className="flex flex-wrap gap-6 text-xs font-bold text-slate-800">
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.adsenseEnabled}
                      onChange={(e) =>
                        setConfig({ ...config, adsenseEnabled: e.target.checked })
                      }
                    />
                    Enable Google AdSense
                  </label>
                  <label className="inline-flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={config.adsenseAutoAds}
                      onChange={(e) =>
                        setConfig({ ...config, adsenseAutoAds: e.target.checked })
                      }
                    />
                    Enable AdSense Auto Ads
                  </label>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Publisher ID (ca-pub-...)
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
                      Top Leaderboard Slot ID
                    </label>
                    <input
                      type="text"
                      placeholder="Optional unit ID"
                      value={config.adsenseTopSlotId}
                      onChange={(e) =>
                        setConfig({ ...config, adsenseTopSlotId: e.target.value })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      In-Feed / Preview Slot ID
                    </label>
                    <input
                      type="text"
                      placeholder="Optional unit ID"
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
                    Custom /ads.txt Lines
                  </label>
                  <textarea
                    rows={3}
                    value={config.adsTxtCustomLines}
                    onChange={(e) =>
                      setConfig({ ...config, adsTxtCustomLines: e.target.value })
                    }
                    placeholder="Optional extra authorized seller lines..."
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl text-xs font-mono"
                  />
                </div>
              </div>
            )}

            {/* TAB 4: SPONSORED CAMPAIGNS */}
            {controlTab === 'campaigns' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-600">
                    Manage direct M-Pesa sponsor banners, school ads &amp; affiliate links:
                  </p>
                  <button
                    type="button"
                    onClick={addCampaign}
                    className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-800 text-white px-3.5 py-2 rounded-xl text-xs font-bold transition"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Add Sponsor Banner
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {config.campaigns.map((camp) => (
                    <div
                      key={camp.id}
                      className="border border-slate-200 rounded-xl p-4 bg-slate-50/70 space-y-3"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <label className="inline-flex items-center gap-2 text-xs font-black uppercase text-slate-800 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={camp.enabled}
                            onChange={(e) =>
                              updateCampaign(camp.id, { enabled: e.target.checked })
                            }
                          />
                          {camp.badge}
                        </label>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={camp.badge}
                            onChange={(e) =>
                              updateCampaign(camp.id, { badge: e.target.value })
                            }
                            placeholder="Badge"
                            className="w-36 px-2.5 py-1 border border-slate-300 rounded-lg text-xs bg-white font-bold"
                          />
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
                            onClick={() => deleteCampaign(camp.id)}
                            className="text-rose-600 hover:text-rose-800 p-1"
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
                          placeholder="CTA Text"
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={camp.subtext}
                          onChange={(e) =>
                            updateCampaign(camp.id, { subtext: e.target.value })
                          }
                          placeholder="Description..."
                          className="md:col-span-2 px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                        <input
                          type="text"
                          value={camp.targetUrl}
                          onChange={(e) =>
                            updateCampaign(camp.id, { targetUrl: e.target.value })
                          }
                          placeholder="Destination URL"
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* TAB 5: RATES & LIVE SIMULATOR */}
            {controlTab === 'rates' && (
              <div className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      CPM (KES per 1,000 Ad Views)
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
                      CPC (KES per Click)
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
                      Interaction Rate (KES)
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
                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      USD to KES Exchange Rate
                    </label>
                    <input
                      type="number"
                      step="0.5"
                      value={config.ratesKes.usdToKesRate}
                      onChange={(e) =>
                        setConfig({
                          ...config,
                          ratesKes: {
                            ...config.ratesKes,
                            usdToKesRate: Number(e.target.value) || 129.5,
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase text-slate-800">
                      Live Tracking Verification Tools
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Test that views, impressions, interactions, and clicks increment your
                      earnings ledger immediately:
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => triggerTestEvent('view')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold"
                    >
                      +1 Test View
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerTestEvent('impression')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold"
                    >
                      +1 Ad Impression
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerTestEvent('interaction')}
                      className="px-3 py-1.5 rounded-lg bg-white border border-slate-300 hover:bg-slate-100 text-xs font-bold"
                    >
                      +1 Interaction
                    </button>
                    <button
                      type="button"
                      onClick={() => triggerTestEvent('click')}
                      className="px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-300 text-emerald-800 hover:bg-emerald-100 text-xs font-bold"
                    >
                      +1 Ad Click
                    </button>
                    <button
                      type="button"
                      onClick={handleResetStats}
                      className="px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 hover:bg-rose-100 text-xs font-bold"
                    >
                      Reset Counters
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Save Bar */}
            <div className="pt-4 border-t border-slate-200 flex flex-wrap items-center justify-between gap-3">
              {saveMessage ? (
                <span className="text-xs font-bold text-emerald-700">
                  {saveMessage}
                </span>
              ) : (
                <span className="text-xs text-slate-500">
                  All settings persist in cloud storage and apply immediately across the
                  site.
                </span>
              )}
              <button
                type="button"
                onClick={() => saveConfigLive()}
                disabled={saving}
                className="inline-flex items-center gap-2 bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-black text-xs px-6 py-3 rounded-xl transition shadow-xs"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Save All Monetization Controls
              </button>
            </div>
          </section>
        )}

        {/* 5. 14-DAY DAILY EARNINGS, VIEWS, CLICKS & INTERACTIONS HISTORY */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xs space-y-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Daily Views, Clicks, Interactions &amp; Amount Earned (Last 14 Days)
            </h3>
          </div>

          {dailyEntries.length === 0 ? (
            <p className="text-xs text-slate-400 py-6 text-center">
              Daily breakdown will populate automatically as visitors browse and interact
              with the portal.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
                  <tr>
                    <th className="text-left px-4 py-2.5 rounded-l-lg">Date</th>
                    <th className="text-right px-4 py-2.5">Page Views</th>
                    <th className="text-right px-4 py-2.5">Ad Views</th>
                    <th className="text-right px-4 py-2.5">Interactions</th>
                    <th className="text-right px-4 py-2.5">Ad Clicks</th>
                    <th className="text-right px-4 py-2.5 rounded-r-lg">Amount Earned</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {dailyEntries.map((d) => {
                    const dayKes =
                      (d.impressions / 1000) * cpmRate +
                      (d.views / 1000) * (cpmRate * 0.65) +
                      d.clicks * cpcRate +
                      d.interactions * interRate;
                    return (
                      <tr key={d.date}>
                        <td className="px-4 py-2.5 font-mono font-bold text-slate-800">
                          {d.date}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {d.views.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono">
                          {d.impressions.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-purple-700 font-semibold">
                          {d.interactions.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono text-emerald-700 font-bold">
                          {d.clicks.toLocaleString()}
                        </td>
                        <td className="px-4 py-2.5 text-right font-mono font-black text-slate-900">
                          KES {dayKes.toFixed(2)} (${(dayKes / usdRate).toFixed(2)})
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
