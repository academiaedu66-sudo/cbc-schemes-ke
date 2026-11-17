'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Loader2,
  Megaphone,
  Search,
  Settings,
  Share2,
  Sparkles,
  Zap,
} from 'lucide-react';
import type {
  PlatformLaunchIntent,
  SocialBroadcastHistoryItem,
  SocialPlatformEntry,
  SocialPlatformId,
} from '@/lib/social-broadcaster';

interface MaterialSearchItem {
  id: string;
  title: string;
  grade: number;
  subject: string;
  category: string;
  price: number;
}

interface MobileSocialAutoPosterProps {
  adminEmail: string;
  adminPassword: string;
  onToast: (msg: string) => void;
}

export default function MobileSocialAutoPoster({
  adminEmail,
  adminPassword,
  onToast,
}: MobileSocialAutoPosterProps) {
  const [expanded, setExpanded] = useState(false);
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [postingNow, setPostingNow] = useState(false);

  const [platforms, setPlatforms] = useState<SocialPlatformEntry[]>([]);
  const [metaPixelId, setMetaPixelId] = useState('');
  const [fbPageAccessToken, setFbPageAccessToken] = useState('');
  const [metaConversionsApiToken, setMetaConversionsApiToken] = useState('');
  const [telegramBotToken, setTelegramBotToken] = useState('');
  const [telegramChatId, setTelegramChatId] = useState('');
  const [automationWebhookUrl, setAutomationWebhookUrl] = useState('');

  const [hasFbToken, setHasFbToken] = useState(false);
  const [hasCapiToken, setHasCapiToken] = useState(false);
  const [hasTgToken, setHasTgToken] = useState(false);
  const [recentBroadcasts, setRecentBroadcasts] = useState<
    SocialBroadcastHistoryItem[]
  >([]);

  // Search & Content Picker
  const [searchQuery, setSearchQuery] = useState('');
  const [materials, setMaterials] = useState<MaterialSearchItem[]>([]);
  const [selectedMaterialId, setSelectedMaterialId] = useState<string>('AUTO');
  const [customCaption, setCustomCaption] = useState('');

  // Result of latest 1-Click Broadcast
  const [lastResult, setLastResult] = useState<{
    message: string;
    captionUsed: string;
    reelCommentUsed: string;
    targetUrl: string;
    materialTitle: string;
    intents: PlatformLaunchIntent[];
  } | null>(null);
  const [copiedType, setCopiedType] = useState<'caption' | 'reel' | null>(null);

  const authHeaders = useCallback(
    () => ({
      'Content-Type': 'application/json',
      'x-admin-email': adminEmail.trim(),
      'x-admin-password': adminPassword.trim(),
    }),
    [adminEmail, adminPassword]
  );

  const loadBroadcasterData = useCallback(
    async (q = '') => {
      if (!adminEmail || !adminPassword) return;
      setLoading(true);
      try {
        const res = await fetch(
          `/api/admin/social-broadcast${q ? `?q=${encodeURIComponent(q)}` : ''}`,
          { headers: authHeaders() }
        );
        const data = await res.json();
        if (res.ok && data.config) {
          setPlatforms(data.config.platforms || []);
          setMetaPixelId(data.config.metaPixelId || '');
          setTelegramChatId(data.config.telegramChatId || '');
          setAutomationWebhookUrl(data.config.automationWebhookUrl || '');
          setHasFbToken(Boolean(data.config.hasFbAccessToken));
          setHasCapiToken(Boolean(data.config.hasMetaCapiToken));
          setHasTgToken(Boolean(data.config.hasTelegramBotToken));
          setRecentBroadcasts(data.config.recentBroadcasts || []);
          if (Array.isArray(data.searchResults)) {
            setMaterials(data.searchResults);
          }
        }
      } catch {
        // silent background retry
      } finally {
        setLoading(false);
      }
    },
    [adminEmail, adminPassword, authHeaders]
  );

  useEffect(() => {
    void loadBroadcasterData('');
  }, [loadBroadcasterData]);

  const persistConfig = async (
    nextPlatforms: SocialPlatformEntry[],
    silentToast = false
  ) => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/social-broadcast', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'save_config',
          config: {
            platforms: nextPlatforms,
            metaPixelId,
            fbPageAccessToken,
            metaConversionsApiToken,
            telegramBotToken,
            telegramChatId,
            automationWebhookUrl,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.config) {
        setPlatforms(data.config.platforms || nextPlatforms);
        setHasFbToken(Boolean(data.config.hasFbAccessToken));
        setHasCapiToken(Boolean(data.config.hasMetaCapiToken));
        setHasTgToken(Boolean(data.config.hasTelegramBotToken));
        setFbPageAccessToken('');
        setMetaConversionsApiToken('');
        setTelegramBotToken('');
        if (!silentToast) {
          onToast('All social media links & ON/OFF switches saved live!');
        }
      }
    } catch {
      onToast('Could not save social config. Check connection.');
    } finally {
      setSaving(false);
    }
  };

  // Instant 1-tap ON / OFF switch ("Allow posting or not") per platform
  const handleTogglePlatform = async (id: SocialPlatformId) => {
    const updated = platforms.map((p) =>
      p.id === id ? { ...p, allowPosting: !p.allowPosting } : p
    );
    setPlatforms(updated);
    const target = updated.find((p) => p.id === id);
    onToast(
      target?.allowPosting
        ? `${target.shortBadge}: Allow Posting switched ON`
        : `${target?.shortBadge || id}: Posting switched OFF`
    );
    await persistConfig(updated, true);
  };

  const handleLinkChange = (id: SocialPlatformId, value: string) => {
    setPlatforms((prev) =>
      prev.map((p) => (p.id === id ? { ...p, profileUrl: value } : p))
    );
  };

  // ONE-CLICK MASTER POST TO ALL ENABLED PLATFORMS!
  const handleOneClickPostAll = async () => {
    const enabledList = platforms.filter((p) => p.allowPosting);
    if (enabledList.length === 0) {
      setExpanded(true);
      onToast('Switch ON at least one social platform first!');
      return;
    }

    setPostingNow(true);
    try {
      const res = await fetch('/api/admin/social-broadcast', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          action: 'broadcast_now',
          materialId: selectedMaterialId,
          customCaption,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        onToast(data.error || 'Broadcast failed');
        return;
      }

      const intents: PlatformLaunchIntent[] = data.intents || [];
      setLastResult({
        message: data.message,
        captionUsed: data.captionUsed,
        reelCommentUsed: data.reelCommentUsed,
        targetUrl: data.targetUrl,
        materialTitle: data.materialTitle,
        intents,
      });
      if (data.config?.recentBroadcasts) {
        setRecentBroadcasts(data.config.recentBroadcasts);
      }

      // Copy rich monetized caption + link straight into phone clipboard so Reels/TikTok/IG/Status paste in 1 tap!
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(data.captionUsed || '').catch(() => {});
      }

      // Automatically open composer windows for ON platforms that aren't already server-posted
      const pendingBrowserIntents = intents.filter((i) => !i.autoPostedOnServer);
      if (typeof window !== 'undefined' && pendingBrowserIntents.length > 0) {
        // Open primary ON platform immediately on the user tap gesture (never blocked by mobile browsers!)
        window.open(
          pendingBrowserIntents[0].launchUrl,
          '_blank',
          'noopener,noreferrer'
        );
        // Attempt remaining ON platforms; also show 1-tap launch pills below so mobile OS popup blockers never stop multi-posting!
        for (let idx = 1; idx < pendingBrowserIntents.length; idx++) {
          window.open(
            pendingBrowserIntents[idx].launchUrl,
            '_blank',
            'noopener,noreferrer'
          );
        }
      }

      setExpanded(true);
      onToast(
        `Posting across ${intents.length} ON platform(s)! Caption + Link copied to clipboard.`
      );
    } catch {
      onToast('Network error running social broadcast.');
    } finally {
      setPostingNow(false);
    }
  };

  const enabledPlatforms = platforms.filter((p) => p.allowPosting);

  return (
    <div className="bg-gradient-to-br from-[#1877F2]/25 via-slate-900 to-emerald-950/40 border-2 border-[#1877F2]/70 rounded-3xl p-4 space-y-3.5 shadow-xl">
      {/* Header + Enabled Badges */}
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-wider bg-[#1877F2] text-white px-2.5 py-0.5 rounded-full">
              <Share2 className="w-3 h-3" />
              All-Platforms Auto-Poster
            </span>
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              {enabledPlatforms.length} ON / {platforms.length - enabledPlatforms.length} OFF
            </span>
          </div>
          <h2 className="text-sm font-black text-white leading-snug">
            1-Click Post Website Ads to All Your Platforms
          </h2>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            All clicks &amp; views route monetization to your{' '}
            <strong className="text-blue-300">Facebook Profile &amp; Reels</strong>. Toggle
            each platform <strong>ON</strong> or <strong>OFF</strong> anytime.
          </p>
        </div>
      </div>

      {/* Active Platform Badges Strip */}
      {enabledPlatforms.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {enabledPlatforms.map((p) => (
            <span
              key={p.id}
              className="text-[10px] font-black bg-blue-500/20 border border-blue-400/40 text-blue-200 px-2 py-0.5 rounded-lg"
            >
              ✓ {p.shortBadge} ON
            </span>
          ))}
        </div>
      )}

      {/* MASTER 1-CLICK BROADCAST BUTTON + EXPAND LINKS/TOGGLES BUTTON */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          disabled={postingNow}
          onClick={handleOneClickPostAll}
          className="sm:col-span-2 bg-gradient-to-r from-[#1877F2] via-indigo-600 to-emerald-500 hover:brightness-110 active:scale-[0.98] disabled:opacity-60 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 cursor-pointer transition"
        >
          {postingNow ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Posting to {enabledPlatforms.length} Platform(s)...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              1-CLICK POST TO ALL ({enabledPlatforms.length} ON)
            </>
          )}
        </button>

        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="bg-slate-900/90 hover:bg-slate-800 border border-slate-700 text-slate-100 font-black text-xs py-3.5 px-3 rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer transition"
        >
          <Settings className="w-4 h-4 text-amber-400" />
          <span>Links &amp; ON/OFF</span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-slate-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>

      {/* LIVE MULTI-PLATFORM LAUNCH STATUS (Appears right after clicking 1-Click Post!) */}
      {lastResult && (
        <div className="bg-slate-950/90 border border-emerald-500/50 rounded-2xl p-3.5 space-y-3">
          <div className="flex items-start justify-between gap-2">
            <div className="space-y-0.5">
              <p className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                {lastResult.message}
              </p>
              <p className="text-[10px] text-slate-400 truncate">
                Ad Item: <strong className="text-slate-200">{lastResult.materialTitle}</strong>
              </p>
            </div>
          </div>

          {/* Copy Caption / Copy Reels First Comment */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(lastResult.captionUsed);
                setCopiedType('caption');
                setTimeout(() => setCopiedType(null), 2000);
                onToast('Full Post/Reels Caption copied!');
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'caption' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-blue-400" />
              )}
              Copy Full Post Ad
            </button>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(lastResult.reelCommentUsed);
                setCopiedType('reel');
                setTimeout(() => setCopiedType(null), 2000);
                onToast('Reels Clickable First-Comment Link copied!');
              }}
              className="bg-slate-900 border border-blue-500/40 text-blue-200 font-bold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'reel' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-amber-300" />
              )}
              Copy Reels Link Comment
            </button>
          </div>

          {/* Per-Platform Direct Launch Buttons (for mobile popup-blocker bypass) */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Enabled Platforms Dispatch ({lastResult.intents.length} ON):
            </p>
            <div className="grid grid-cols-1 gap-1.5">
              {lastResult.intents.map((item) => (
                <a
                  key={item.id}
                  href={item.launchUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold flex items-center justify-between gap-2 transition ${
                    item.autoPostedOnServer
                      ? 'bg-emerald-950/60 border-emerald-500/50 text-emerald-200'
                      : 'bg-slate-900 hover:bg-slate-800 border-slate-700 text-white'
                  }`}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-black bg-blue-600 text-white px-1.5 py-0.5 rounded">
                        {item.shortBadge}
                      </span>
                      <span className="truncate">{item.name}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-normal mt-0.5 truncate">
                      {item.statusNote}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-300 shrink-0">
                    {item.autoPostedOnServer ? 'Posted ✓' : 'Post →'}
                    <ExternalLink className="w-3.5 h-3.5" />
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===================================================================== */}
      {/* EXPANDED ALL-PLATFORMS SOCIAL LINKS + ON/OFF SWITCHES + SEARCH STUDIO */}
      {/* ===================================================================== */}
      {expanded && (
        <div className="pt-2 border-t border-slate-800/90 space-y-4">
          {/* 1. Search / Choose Website Material to Advertise */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
              1. Automated Content Search (What to Post)
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      void loadBroadcasterData(searchQuery);
                    }
                  }}
                  placeholder="Search e.g. Grade 7 Science, KPSEA, KJSEA..."
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white placeholder:text-slate-500"
                />
              </div>
              <button
                type="button"
                onClick={() => loadBroadcasterData(searchQuery)}
                className="bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold px-3 py-2 rounded-xl cursor-pointer"
              >
                {loading ? '...' : 'Find'}
              </button>
            </div>

            <select
              value={selectedMaterialId}
              onChange={(e) => setSelectedMaterialId(e.target.value)}
              className="w-full px-3 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-xs font-bold text-emerald-300"
            >
              <option value="AUTO">
                ⚡ AUTO-ROTATE (Automatically picks fresh CBC materials on every click)
              </option>
              {materials.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.title} (KES {m.price})
                </option>
              ))}
            </select>

            <textarea
              rows={2}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Optional custom message (leave blank to auto-generate high-converting CBC Link Ad with your Facebook & WhatsApp links!)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* 2. All Social Media Platforms — Links + Individual Allow Posting (ON / OFF) Buttons */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                2. Your Social Media Links &amp; Allow Posting (ON / OFF)
              </label>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const allOn = platforms.map((p) => ({ ...p, allowPosting: true }));
                    setPlatforms(allOn);
                    void persistConfig(allOn);
                  }}
                  className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg cursor-pointer"
                >
                  All ON
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const onlyFbWa = platforms.map((p) => ({
                      ...p,
                      allowPosting:
                        p.id === 'facebook_feed' ||
                        p.id === 'facebook_reels' ||
                        p.id === 'whatsapp',
                    }));
                    setPlatforms(onlyFbWa);
                    void persistConfig(onlyFbWa);
                  }}
                  className="text-[10px] font-black bg-slate-800 text-slate-300 px-2 py-1 rounded-lg cursor-pointer"
                >
                  FB+WA Only
                </button>
              </div>
            </div>

            <div className="space-y-2.5">
              {platforms.map((plat) => (
                <div
                  key={plat.id}
                  className={`p-3 rounded-2xl border transition space-y-2 ${
                    plat.allowPosting
                      ? 'bg-slate-900/95 border-emerald-500/50'
                      : 'bg-slate-950/60 border-slate-800 opacity-75'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`text-[10px] font-black px-2 py-0.5 rounded-md shrink-0 ${
                          plat.allowPosting
                            ? 'bg-emerald-500 text-slate-950'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {plat.shortBadge}
                      </span>
                      <span className="text-xs font-bold text-white truncate">
                        {plat.name}
                      </span>
                    </div>

                    {/* ON / OFF ALLOW POSTING BUTTON */}
                    <button
                      type="button"
                      onClick={() => handleTogglePlatform(plat.id)}
                      className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-wider shrink-0 transition cursor-pointer ${
                        plat.allowPosting
                          ? 'bg-emerald-500 text-slate-950 shadow-sm'
                          : 'bg-slate-800 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {plat.allowPosting ? 'ON • Allowed' : 'OFF • Blocked'}
                    </button>
                  </div>

                  <input
                    type="url"
                    value={plat.profileUrl}
                    onChange={(e) => handleLinkChange(plat.id, e.target.value)}
                    placeholder={plat.placeholder}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-blue-500"
                  />
                </div>
              ))}
            </div>

            <button
              type="button"
              disabled={saving}
              onClick={() => persistConfig(platforms)}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow cursor-pointer"
            >
              <Check className="w-4 h-4" />
              {saving ? 'Saving All Links...' : 'Save All Social Media Links & Switches'}
            </button>
          </div>

          {/* 3. Facebook Monetization Pixel & Zero-Touch Auto-API Keys (Optional) */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <button
              type="button"
              onClick={() => setShowApiKeys((v) => !v)}
              className="w-full flex items-center justify-between text-left text-xs font-black text-indigo-300 cursor-pointer"
            >
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                3. Facebook Monetization Pixel &amp; Background Auto-Post API
              </span>
              {showApiKeys ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>

            {showApiKeys && (
              <div className="space-y-2.5 pt-2 border-t border-slate-800 text-xs">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Meta (Facebook) Pixel ID — Tracks All Website Views, Clicks &amp; Sales in Facebook
                  </label>
                  <input
                    type="text"
                    value={metaPixelId}
                    onChange={(e) => setMetaPixelId(e.target.value)}
                    placeholder="e.g. 1234567890123456"
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Facebook Page / Reels Graph Access Token{' '}
                    {hasFbToken && (
                      <span className="text-emerald-400">(Saved ✓)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={fbPageAccessToken}
                    onChange={(e) => setFbPageAccessToken(e.target.value)}
                    placeholder={
                      hasFbToken
                        ? 'Token saved — paste new token only to replace'
                        : 'Paste Meta Graph Page Access Token for 24/7 background Reels auto-comments'
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Meta Conversions API Token{' '}
                    {hasCapiToken && (
                      <span className="text-emerald-400">(Saved ✓)</span>
                    )}
                  </label>
                  <input
                    type="password"
                    value={metaConversionsApiToken}
                    onChange={(e) => setMetaConversionsApiToken(e.target.value)}
                    placeholder={
                      hasCapiToken
                        ? 'CAPI Token saved ✓'
                        : 'Optional Server Conversions API Token'
                    }
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Telegram Bot Token {hasTgToken && '(Saved ✓)'}
                    </label>
                    <input
                      type="password"
                      value={telegramBotToken}
                      onChange={(e) => setTelegramBotToken(e.target.value)}
                      placeholder="Optional BotFather Token"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Telegram Channel @ChatID
                    </label>
                    <input
                      type="text"
                      value={telegramChatId}
                      onChange={(e) => setTelegramChatId(e.target.value)}
                      placeholder="@yourchannel"
                      className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                    Multi-Social Webhook URL (Make.com / Zapier / Buffer — Optional)
                  </label>
                  <input
                    type="url"
                    value={automationWebhookUrl}
                    onChange={(e) => setAutomationWebhookUrl(e.target.value)}
                    placeholder="https://hook.eu1.make.com/..."
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-700 rounded-xl text-xs text-white"
                  />
                </div>

                <button
                  type="button"
                  disabled={saving}
                  onClick={() => persistConfig(platforms)}
                  className="w-full bg-indigo-500 hover:bg-indigo-400 text-white font-black text-xs py-2.5 rounded-xl cursor-pointer"
                >
                  Save API &amp; Facebook Monetization Settings
                </button>
              </div>
            )}
          </div>

          {/* Recent Broadcast Log */}
          {recentBroadcasts.length > 0 && (
            <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3 space-y-1.5">
              <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                Recent Multi-Platform Posts ({recentBroadcasts.length})
              </p>
              {recentBroadcasts.slice(0, 3).map((b) => (
                <div
                  key={b.id}
                  className="text-[11px] border-b border-slate-800/70 pb-1.5 last:border-0"
                >
                  <p className="text-slate-200 font-bold truncate">{b.materialTitle}</p>
                  <p className="text-[10px] text-slate-400">
                    Posted to: {b.platformsPosted.join(', ')}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
