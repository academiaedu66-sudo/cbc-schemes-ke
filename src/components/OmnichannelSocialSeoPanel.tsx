'use client';

import React, { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Download,
  ExternalLink,
  Film,
  Loader2,
  RefreshCw,
  Rss,
  Save,
  Settings2,
  Share2,
  Zap,
} from 'lucide-react';
import type {
  OmnichannelButtonSeoPack,
  OmnichannelSocialLedger,
  OmnichannelSocialProfiles,
} from '@/lib/social-seo-engine';
import { renderVerticalSocialVideoFile } from './SocialVerticalVideoStudio';

interface RedactedOmnichannelConfig {
  enabled: boolean;
  profiles: OmnichannelSocialProfiles;
  fbPageId: string;
  automationWebhookUrl: string;
  hasFbToken: boolean;
  hasXTwitterKeys: boolean;
  hasTikTokToken: boolean;
  hasYouTubeToken: boolean;
  updatedAt: string;
}

export default function OmnichannelSocialSeoPanel({
  password,
  adminEmail,
  darkTheme = false,
}: {
  password: string;
  adminEmail?: string;
  darkTheme?: boolean;
}) {
  const [config, setConfig] = useState<RedactedOmnichannelConfig | null>(null);
  const [ledger, setLedger] = useState<OmnichannelSocialLedger | null>(null);
  const [packs, setPacks] = useState<OmnichannelButtonSeoPack[]>([]);
  const [selectedButtonId, setSelectedButtonId] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [dispatching, setDispatching] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Editable Profile URLs & Optional API Credentials
  const [tiktokUrl, setTiktokUrl] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [facebookPageUrl, setFacebookPageUrl] = useState('');
  const [facebookReelsUrl, setFacebookReelsUrl] = useState('');
  const [xTwitterUrl, setXTwitterUrl] = useState('');
  const [webhookUrl, setWebhookUrl] = useState('');
  const [fbToken, setFbToken] = useState('');
  const [xBearerToken, setXBearerToken] = useState('');
  const [tiktokToken, setTiktokToken] = useState('');

  // Video Recorder State
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordPct, setRecordPct] = useState(0);

  const buildHeaders = useCallback(() => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-password': password.trim(),
    };
    if (adminEmail?.trim()) {
      h['x-admin-email'] = adminEmail.trim();
    }
    return h;
  }, [adminEmail, password]);

  const loadData = useCallback(async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/social/omnichannel-autopost', {
        headers: buildHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.config) {
        setConfig(data.config);
        setTiktokUrl(data.config.profiles?.tiktokUrl || '');
        setYoutubeUrl(data.config.profiles?.youtubeUrl || '');
        setFacebookPageUrl(data.config.profiles?.facebookPageUrl || '');
        setFacebookReelsUrl(data.config.profiles?.facebookReelsUrl || '');
        setXTwitterUrl(data.config.profiles?.xTwitterUrl || '');
        setWebhookUrl(data.config.automationWebhookUrl || '');
      }
      if (data.ledger) setLedger(data.ledger);
      if (Array.isArray(data.packs)) {
        setPacks(data.packs);
        setSelectedButtonId((prev) => prev || data.packs[0]?.buttonId || '');
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [buildHeaders, password]);

  useEffect(() => {
    void loadData();
  }, [loadData]);

  const handleDispatchNow = async (forceId?: string) => {
    setDispatching(true);
    setFeedback('');
    try {
      const res = await fetch('/api/social/omnichannel-autopost', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          action: 'dispatch_now',
          buttonId: forceId || undefined,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (data.ledger) setLedger(data.ledger);
        setFeedback(
          `Dispatched "${data.pack?.buttonLabel}" across ${
            (data.channelsTriggered || []).length
          } Social & Google SEO channel(s) (${data.postedTodayCount}/${
            data.totalButtons
          } buttons ranked today)!`
        );
      }
    } catch {
      setFeedback('Could not run omnichannel dispatch right now.');
    } finally {
      setDispatching(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/social/omnichannel-autopost', {
        method: 'POST',
        headers: buildHeaders(),
        body: JSON.stringify({
          action: 'save_config',
          config: {
            profiles: {
              tiktokUrl,
              youtubeUrl,
              facebookPageUrl,
              facebookReelsUrl,
              xTwitterUrl,
            },
            automationWebhookUrl: webhookUrl,
            fbPageAccessToken: fbToken,
            xBearerUserToken: xBearerToken,
            tiktokAccessToken: tiktokToken,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setConfig(data.config);
        setFbToken('');
        setXBearerToken('');
        setTiktokToken('');
        setFeedback(data.message || 'Saved social SEO settings!');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleQuickVideoDownload = async (pack: OmnichannelButtonSeoPack) => {
    setRecordingId(pack.buttonId);
    setRecordPct(0);
    setFeedback(`Rendering 9:16 vertical video + soft song for ${pack.buttonLabel}…`);
    try {
      const { blob, filename } = await renderVerticalSocialVideoFile(
        pack,
        12,
        (p) => setRecordPct(p)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setFeedback(`Downloaded ${filename} — ready for TikTok, YouTube Shorts & FB Reels!`);
    } catch {
      setFeedback('Could not render video in this browser tab.');
    } finally {
      setRecordingId(null);
    }
  };

  const activePack =
    packs.find((p) => p.buttonId === selectedButtonId) || packs[0];

  const cardBg = darkTheme
    ? 'bg-slate-900 border-indigo-400/40 text-white'
    : 'bg-white border-indigo-200 text-slate-900 shadow-sm';

  return (
    <section className={`rounded-3xl border p-5 sm:p-6 space-y-5 ${cardBg}`}>
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-400/30 text-indigo-500 text-[10px] font-black uppercase tracking-wider">
            <Film className="w-3.5 h-3.5" />
            <span>TikTok • YouTube Shorts • Facebook • X (Twitter) SEO</span>
          </div>
          <h2 className="text-lg sm:text-xl font-black">
            Omnichannel Social Video &amp; Google Page-1 Ranker
          </h2>
          <p
            className={`text-xs ${
              darkTheme ? 'text-slate-300' : 'text-slate-600'
            }`}
          >
            Auto-ranks all 18 website buttons through 9:16 Vertical Videos,
            Google <code className="font-mono">VideoObject</code> pages, RSS
            Syndication, and Direct Social APIs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={dispatching}
            onClick={() => void handleDispatchNow()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-sm disabled:opacity-60 transition cursor-pointer"
          >
            {dispatching ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5 text-amber-300" />
            )}
            <span>Auto-Rank Next Button Now</span>
          </button>

          <button
            type="button"
            onClick={() => setShowSettings((s) => !s)}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition cursor-pointer ${
              darkTheme
                ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
            }`}
          >
            <Settings2 className="w-3.5 h-3.5" />
            <span>{showSettings ? 'Hide Handles/APIs' : 'Connect Handles & APIs'}</span>
          </button>

          <button
            type="button"
            onClick={() => void loadData()}
            title="Refresh"
            className={`p-2 rounded-xl border cursor-pointer ${
              darkTheme
                ? 'border-slate-700 bg-slate-800 text-slate-300'
                : 'border-slate-200 bg-slate-50 text-slate-600'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Live Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div
          className={`rounded-2xl p-3 border ${
            darkTheme
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-indigo-50/60 border-indigo-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase opacity-70">
            Buttons Ranked Today
          </span>
          <p className="text-lg font-black mt-0.5">
            {ledger?.postedButtonIdsToday?.length || 0} / 18
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 border ${
            darkTheme
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-emerald-50/60 border-emerald-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase opacity-70">
            Video SEO Pages
          </span>
          <p className="text-sm font-black mt-1">
            <Link
              href="/videos"
              target="_blank"
              className="text-emerald-500 hover:underline inline-flex items-center gap-1"
            >
              <span>/videos (18 Live)</span>
              <ExternalLink className="w-3 h-3" />
            </Link>
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 border ${
            darkTheme
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-amber-50/60 border-amber-100'
          }`}
        >
          <span className="text-[10px] font-bold uppercase opacity-70">
            Auto-Syndication RSS
          </span>
          <p className="text-sm font-black mt-1">
            <a
              href="/social-feed.xml"
              target="_blank"
              rel="noreferrer"
              className="text-amber-600 hover:underline inline-flex items-center gap-1"
            >
              <Rss className="w-3.5 h-3.5" />
              <span>/social-feed.xml</span>
            </a>
          </p>
        </div>

        <div
          className={`rounded-2xl p-3 border ${
            darkTheme
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <span className="text-[10px] font-bold uppercase opacity-70">
            All-Time Dispatches
          </span>
          <p className="text-lg font-black mt-0.5">
            {ledger?.totalDispatchesAllTime || 0}
          </p>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-400/40 px-4 py-2.5 text-xs font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {/* Optional Social Handles & API Keys Form */}
      {showSettings && (
        <form
          onSubmit={handleSaveConfig}
          className={`rounded-2xl p-4 border space-y-3 ${
            darkTheme
              ? 'bg-slate-950/80 border-slate-800'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <p className="text-xs font-black">
            Official Social Handles (Synced to Google Knowledge Graph{' '}
            <code className="font-mono">sameAs</code> &amp; Website Footer)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="url"
              value={tiktokUrl}
              onChange={(e) => setTiktokUrl(e.target.value)}
              placeholder="TikTok Profile URL (https://www.tiktok.com/@...)"
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="url"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="YouTube Channel URL (https://www.youtube.com/@...)"
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="url"
              value={facebookPageUrl}
              onChange={(e) => setFacebookPageUrl(e.target.value)}
              placeholder="Facebook Page / Profile URL"
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="url"
              value={xTwitterUrl}
              onChange={(e) => setXTwitterUrl(e.target.value)}
              placeholder="X (Twitter) Profile URL (https://x.com/...)"
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
          </div>

          <p className="text-xs font-black pt-1">
            Optional Server Auto-Publish Tokens / Make-Zapier-Buffer Webhook
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="Make / Zapier / Buffer Webhook URL (optional)"
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="password"
              value={fbToken}
              onChange={(e) => setFbToken(e.target.value)}
              placeholder={
                config?.hasFbToken
                  ? 'Facebook Page Token saved (enter to replace)'
                  : 'Facebook Page Graph Token (optional)'
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="password"
              value={xBearerToken}
              onChange={(e) => setXBearerToken(e.target.value)}
              placeholder={
                config?.hasXTwitterKeys
                  ? 'X / Twitter API Token saved (enter to replace)'
                  : 'X / Twitter User OAuth2 Token (optional)'
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
            <input
              type="password"
              value={tiktokToken}
              onChange={(e) => setTiktokToken(e.target.value)}
              placeholder={
                config?.hasTikTokToken
                  ? 'TikTok API Token saved (enter to replace)'
                  : 'TikTok Content Posting Token (optional)'
              }
              className="px-3 py-2 rounded-xl border border-slate-300 text-slate-900 bg-white"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
          >
            {saving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5" />
            )}
            <span>Save Handles &amp; Automation Keys</span>
          </button>
        </form>
      )}

      {/* Quick Button Selector + 1-Click 9:16 Video & 4-Platform Share */}
      {activePack && (
        <div
          className={`rounded-2xl p-4 border space-y-3 ${
            darkTheme
              ? 'bg-slate-950/60 border-slate-800'
              : 'bg-slate-50/80 border-slate-200'
          }`}
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <select
              value={activePack.buttonId}
              onChange={(e) => setSelectedButtonId(e.target.value)}
              aria-label="Choose website button for social video & SEO"
              className="px-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-bold max-w-full"
            >
              {packs.map((p) => (
                <option key={p.buttonId} value={p.buttonId}>
                  #{p.orderIndex} — {p.buttonLabel}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={recordingId === activePack.buttonId}
                onClick={() => void handleQuickVideoDownload(activePack)}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                {recordingId === activePack.buttonId ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Video {recordPct}%…</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5" />
                    <span>Download 9:16 Video (.MP4/.WebM)</span>
                  </>
                )}
              </button>

              <Link
                href={`/videos/${activePack.buttonId}`}
                target="_blank"
                className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>Open Studio</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold">
            <a
              href={activePack.shareIntents.tiktokUploadUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(activePack.tiktokCaption)
                  .catch(() => {});
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-950 text-white hover:opacity-90"
            >
              TikTok (Copies Caption + Opens Upload) →
            </a>
            <a
              href={activePack.shareIntents.youtubeStudioUploadUrl}
              target="_blank"
              rel="noreferrer"
              onClick={() => {
                navigator.clipboard
                  ?.writeText(
                    `${activePack.youtubeTitle}\n\n${activePack.youtubeDescription}`
                  )
                  .catch(() => {});
              }}
              className="px-3 py-1.5 rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              YouTube Shorts (Copies SEO Title+Desc) →
            </a>
            <a
              href={activePack.shareIntents.facebookShareUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-[#1877F2] text-white hover:bg-[#166FE5]"
            >
              Share on Facebook →
            </a>
            <a
              href={activePack.shareIntents.xTwitterIntentUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 rounded-lg bg-black text-white hover:bg-slate-800"
            >
              Post on X (Twitter) →
            </a>
          </div>
        </div>
      )}
    </section>
  );
}
