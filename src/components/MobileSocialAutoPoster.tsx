'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  Download,
  ExternalLink,
  Image as ImageIcon,
  Loader2,
  Megaphone,
  RefreshCw,
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
  const [posterTick, setPosterTick] = useState<number>(1);

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

  // Search & Content / Service Picker
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
    posterVerticalUrl: string;
    posterCardUrl: string;
    localPosterPath: string;
    materialTitle: string;
    intents: PlatformLaunchIntent[];
  } | null>(null);
  const [copiedType, setCopiedType] = useState<'caption' | 'reel' | 'link' | null>(
    null
  );

  // Live Poster Preview URL + Working Clickable Destination Link
  const livePosterPreviewSrc = useMemo(() => {
    if (selectedMaterialId === 'SERVICE_GAMING') {
      return `/api/social/poster-image?service=GAMING&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_TUITION') {
      return `/api/social/poster-image?service=TUITION&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_GEMINI') {
      return `/api/social/poster-image?service=GEMINI&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_BOOK_1') {
      return `/api/social/poster-image?service=BOOK_1&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_BOOK_2') {
      return `/api/social/poster-image?service=BOOK_2&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_BOOK_3') {
      return `/api/social/poster-image?service=BOOK_3&format=vertical&t=${posterTick}`;
    }
    if (selectedMaterialId === 'SERVICE_PORTAL') {
      return `/api/social/poster-image?materialId=PORTAL&format=vertical&t=${posterTick}`;
    }
    return `/api/social/poster-image?materialId=${encodeURIComponent(
      selectedMaterialId
    )}&format=vertical&t=${posterTick}`;
  }, [selectedMaterialId, posterTick]);

  const liveClickableLink = useMemo(() => {
    if (lastResult?.targetUrl) return lastResult.targetUrl;
    if (
      selectedMaterialId &&
      selectedMaterialId !== 'AUTO' &&
      !selectedMaterialId.startsWith('SERVICE_')
    ) {
      return `https://www.cbcmaterials.shop/materials/${selectedMaterialId}`;
    }
    return 'https://www.cbcmaterials.shop';
  }, [lastResult?.targetUrl, selectedMaterialId]);

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

  /**
   * Generates the HD Poster PNG file in memory and invokes native mobile Reels / Status sharing
   * (`navigator.share({ files: [posterFile], title, text, url })`) with clickable cbcmaterials.shop link!
   */
  const shareGeneratedImageToReelsOrStatus = async (params: {
    posterPath: string;
    title: string;
    caption: string;
    targetUrl: string;
  }): Promise<boolean> => {
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return false;
    }

    try {
      const imgRes = await fetch(params.posterPath, { cache: 'no-store' });
      if (!imgRes.ok) return false;
      const blob = await imgRes.blob();
      const file = new File([blob], 'cbcmaterials-shop-reel-status.png', {
        type: 'image/png',
      });

      const navAny = navigator as Navigator & {
        canShare?: (data?: ShareData) => boolean;
      };

      if (
        typeof navigator.share === 'function' &&
        typeof navAny.canShare === 'function' &&
        navAny.canShare({ files: [file] })
      ) {
        await navigator.share({
          files: [file],
          title: params.title,
          text: `${params.caption}\n\n👉 Click Here: ${params.targetUrl}`,
        });
        return true;
      }

      if (typeof navigator.share === 'function') {
        await navigator.share({
          title: params.title,
          text: params.caption,
          url: params.targetUrl,
        });
        return true;
      }
    } catch {
      // User dismissed native share sheet or browser fallback needed
    }
    return false;
  };

  const handleDownloadPoster = async (posterPath: string) => {
    try {
      const res = await fetch(posterPath, { cache: 'no-store' });
      if (!res.ok) return;
      const blob = await res.blob();
      const objUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = objUrl;
      a.download = `cbcmaterials-shop-poster-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(objUrl);
      onToast('HD Poster Image downloaded to your gallery!');
    } catch {
      onToast('Could not download poster image.');
    }
  };

  // ONE-CLICK MASTER AUTO-GENERATE HD IMAGE + POST TO REELS / STATUS / ALL ON PLATFORMS!
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
      const resultObj = {
        message: data.message,
        captionUsed: data.captionUsed,
        reelCommentUsed: data.reelCommentUsed,
        targetUrl: data.targetUrl,
        posterVerticalUrl: data.posterVerticalUrl,
        posterCardUrl: data.posterCardUrl,
        localPosterPath: data.localPosterPath || livePosterPreviewSrc,
        materialTitle: data.materialTitle,
        intents,
      };
      setLastResult(resultObj);
      setPosterTick((t) => t + 1);

      if (data.config?.recentBroadcasts) {
        setRecentBroadcasts(data.config.recentBroadcasts);
      }

      // 1. Copy full clickable link caption to clipboard immediately
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard
          .writeText(data.captionUsed || data.targetUrl)
          .catch(() => {});
      }

      // 2. Auto-generate & push the HD Poster Image + Clickable Link straight into Phone Reels / Status Share Sheet!
      const sharedNatively = await shareGeneratedImageToReelsOrStatus({
        posterPath: resultObj.localPosterPath,
        title: resultObj.materialTitle,
        caption: resultObj.captionUsed,
        targetUrl: resultObj.targetUrl,
      });

      // 3. On desktop / browsers without native file share, open enabled platform composers (which auto-pull the clickable OpenGraph HD card!)
      if (!sharedNatively && typeof window !== 'undefined') {
        const pendingBrowserIntents = intents.filter((i) => !i.autoPostedOnServer);
        for (let idx = 0; idx < pendingBrowserIntents.length; idx++) {
          window.open(
            pendingBrowserIntents[idx].launchUrl,
            '_blank',
            'noopener,noreferrer'
          );
        }
      }

      setExpanded(true);
      onToast(
        'HD Poster Image + Clickable cbcmaterials.shop Link ready & dispatched!'
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
              HD Image + Link Auto-Poster
            </span>
            <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2 py-0.5 rounded-full">
              {enabledPlatforms.length} ON / {platforms.length - enabledPlatforms.length} OFF
            </span>
          </div>
          <h2 className="text-sm font-black text-white leading-snug">
            Auto-Generate Poster Image &amp; Post to Reels, Status &amp; All Platforms
          </h2>
          <p className="text-[11px] text-slate-300 leading-relaxed">
            Auto-generates a clear HD image with working clickable{' '}
            <a
              href={liveClickableLink}
              target="_blank"
              rel="noreferrer"
              className="text-amber-300 underline font-black"
            >
              cbcmaterials.shop
            </a>{' '}
            links for your Facebook Reels, WhatsApp Status &amp; enabled platforms.
          </p>
        </div>
      </div>

      {/* Quick Service / Material Selector Bar */}
      <div className="space-y-1.5">
        <select
          value={selectedMaterialId}
          onChange={(e) => {
            setSelectedMaterialId(e.target.value);
            setPosterTick((t) => t + 1);
          }}
          className="w-full px-3 py-2.5 bg-slate-950/90 border border-slate-700 rounded-2xl text-xs font-black text-emerald-300"
        >
          <option value="AUTO">
            ⚡ AUTO-ROTATE: Fresh CBC Material + All Services (cbcmaterials.shop)
          </option>
          <option value="SERVICE_PORTAL">
            🌐 FULL PORTAL AD: 3,400+ Schemes, Notes &amp; Exams (cbcmaterials.shop)
          </option>
          <option value="SERVICE_BOOK_1">
            📘 BUTTON 1 BOOK: CBC GRADE UP (50 Pages + Marking Schemes — KSh 500)
          </option>
          <option value="SERVICE_BOOK_2">
            📗 BUTTON 2 BOOK: COMPETENCY BASED MADE FAMILIAR (50 Pages Notes + Q&amp;A — KSh 750)
          </option>
          <option value="SERVICE_BOOK_3">
            🏆 BUTTON 3 COMPILATION: CBC GRADE UP + MADE FAMILIAR (100 Pages — KSh 1,500)
          </option>
          <option value="SERVICE_GAMING">
            🎮 GAMING ARENA AD: Play All 21 CBC Subjects &amp; Earn Cash
          </option>
          <option value="SERVICE_TUITION">
            🎓 TUITION AD: Book Home/Online CBC Teachers (All 47 Counties)
          </option>
          <option value="SERVICE_GEMINI">
            🤖 ASK GEMINI AD: Step-by-Step AI CBC Homework Solutions
          </option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>
              📄 {m.title} (KES {m.price})
            </option>
          ))}
        </select>
      </div>

      {/* LIVE AUTO-GENERATED HD REELS / STATUS POSTER PREVIEW + WORKING CLICKABLE LINK */}
      <div className="bg-slate-950/85 border border-slate-800 rounded-2xl p-3 flex flex-col sm:flex-row items-center gap-3">
        <a
          href={lastResult?.targetUrl || liveClickableLink}
          target="_blank"
          rel="noreferrer"
          title="Click to test live destination on cbcmaterials.shop"
          className="relative w-32 sm:w-28 aspect-[9/16] rounded-xl overflow-hidden border-2 border-emerald-400 shadow-lg shrink-0 group block bg-slate-900"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={lastResult?.localPosterPath || livePosterPreviewSrc}
            alt="Auto-generated CBC Materials Reels & Status Poster"
            className="w-full h-full object-cover"
          />
          <span className="absolute bottom-1 inset-x-1 bg-black/80 text-[9px] font-black text-emerald-300 text-center py-0.5 rounded">
            TAP TO TEST LINK ↗
          </span>
        </a>

        <div className="flex-1 min-w-0 space-y-2 w-full">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400 flex items-center gap-1">
              <ImageIcon className="w-3.5 h-3.5" />
              Auto-Generated HD Reels &amp; Status Image
            </span>
            <button
              type="button"
              onClick={() => setPosterTick((t) => t + 1)}
              className="text-[10px] font-bold text-slate-300 hover:text-white inline-flex items-center gap-1 bg-slate-800 px-2 py-1 rounded-lg cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Refresh Image
            </button>
          </div>

          {/* Clickable Working Link Verification Box */}
          <div className="bg-slate-900 border border-blue-500/40 rounded-xl p-2 space-y-1">
            <span className="block text-[9px] font-black uppercase text-blue-300">
              Working Clickable Destination Link:
            </span>
            <a
              href={lastResult?.targetUrl || liveClickableLink}
              target="_blank"
              rel="noreferrer"
              className="text-[11px] font-black text-amber-300 hover:underline break-all flex items-center gap-1"
            >
              <span>{lastResult?.targetUrl || liveClickableLink}</span>
              <ExternalLink className="w-3 h-3 shrink-0" />
            </a>
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() =>
                handleDownloadPoster(
                  lastResult?.localPosterPath || livePosterPreviewSrc
                )
              }
              className="bg-slate-800 hover:bg-slate-700 text-white font-bold text-[10px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-emerald-400" />
              Save HD Image
            </button>
            <button
              type="button"
              onClick={() => {
                const linkToCopy = lastResult?.targetUrl || liveClickableLink;
                navigator.clipboard?.writeText(linkToCopy);
                setCopiedType('link');
                setTimeout(() => setCopiedType(null), 2000);
                onToast('Clickable cbcmaterials.shop link copied!');
              }}
              className="bg-slate-800 hover:bg-slate-700 text-amber-300 font-bold text-[10px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1 cursor-pointer"
            >
              {copiedType === 'link' ? (
                <Check className="w-3 h-3 text-emerald-400" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
              Copy Link
            </button>
          </div>
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
              Generating HD Image &amp; Posting...
            </>
          ) : (
            <>
              <Zap className="w-4 h-4 text-amber-300" />
              POST IMAGE + LINK TO REELS / STATUS ({enabledPlatforms.length} ON)
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

      {/* LIVE MULTI-PLATFORM LAUNCH STATUS (Appears right after clicking Post!) */}
      {lastResult && (
        <div className="bg-slate-950/90 border border-emerald-500/50 rounded-2xl p-3.5 space-y-3">
          <div className="space-y-1">
            <p className="text-[11px] font-black text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
              {lastResult.message}
            </p>
            <p className="text-[10px] text-slate-300">
              Clickable Link:{' '}
              <a
                href={lastResult.targetUrl}
                target="_blank"
                rel="noreferrer"
                className="text-amber-300 underline font-black break-all"
              >
                {lastResult.targetUrl}
              </a>
            </p>
          </div>

          {/* Direct Re-Trigger Image + Link to Phone Reels / WhatsApp Status Share Sheet */}
          <button
            type="button"
            onClick={() =>
              shareGeneratedImageToReelsOrStatus({
                posterPath: lastResult.localPosterPath,
                title: lastResult.materialTitle,
                caption: lastResult.captionUsed,
                targetUrl: lastResult.targetUrl,
              })
            }
            className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3 px-3 rounded-xl flex items-center justify-center gap-2 shadow cursor-pointer"
          >
            <Share2 className="w-4 h-4" />
            Send HD Image + Clickable Link to Facebook Reels / WhatsApp Status
          </button>

          {/* Copy Caption / Copy Reels First Comment */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(lastResult.captionUsed);
                setCopiedType('caption');
                setTimeout(() => setCopiedType(null), 2000);
                onToast('Full Post/Status Caption + Link copied!');
              }}
              className="bg-slate-900 border border-slate-700 text-slate-200 font-bold text-[11px] py-2 px-2.5 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copiedType === 'caption' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-blue-400" />
              )}
              Copy Caption + Link
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

          {/* Per-Platform Clickable Image Card / Composer Buttons */}
          <div className="space-y-1.5">
            <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Post Clickable Image Card Across Enabled Platforms ({lastResult.intents.length} ON):
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
                    {item.autoPostedOnServer ? 'Auto-Posted ✓' : 'Post Now →'}
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
          {/* 1. Search Specific Material */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
            <label className="block text-[11px] font-black uppercase tracking-wider text-amber-300">
              1. Search Specific Material or Customize Caption
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

            <textarea
              rows={2}
              value={customCaption}
              onChange={(e) => setCustomCaption(e.target.value)}
              placeholder="Optional custom message (leave blank to auto-generate high-converting CBC Link Ad with clickable https://www.cbcmaterials.shop link!)"
              className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder:text-slate-500"
            />
          </div>

          {/* 2. All Social Media Platforms — Links + Individual Allow Posting (ON / OFF) Buttons */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-2xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black uppercase tracking-wider text-blue-300 flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5" />
                2. Social Media Links &amp; Allow Posting (ON / OFF)
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

          {/* 3. Facebook Monetization Pixel & Zero-Touch Auto-API Keys */}
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
                        : 'Paste Meta Graph Page Access Token for 24/7 background HD Photo + Reels auto-posting'
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
