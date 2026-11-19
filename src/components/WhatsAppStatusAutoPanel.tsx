'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock,
  Copy,
  ExternalLink,
  Loader2,
  MessageCircle,
  Music2,
  Pause,
  Play,
  RefreshCw,
  Settings,
  Share2,
  Zap,
} from 'lucide-react';

interface DailyButtonPlanItem {
  buttonId: string;
  orderIndex: number;
  buttonLabel: string;
  headline: string;
  subheadline: string;
  priceBadge: string;
  posterImageUrl: string;
  clickableUrl: string;
  musicalStoryUrl: string;
  softSongUrl: string;
  statusCaption: string;
  postedToday: boolean;
}

interface StatusHistoryItem {
  id: string;
  postedAtIso: string;
  dateEat: string;
  hourEat: number;
  buttonId: string;
  buttonLabel: string;
  clickableUrl: string;
  deliveryChannels: string[];
  deliveredToStatusApi: boolean;
}

export default function WhatsAppStatusAutoPanel({
  password,
  adminEmail = '',
  darkTheme = false,
}: {
  password: string;
  adminEmail?: string;
  darkTheme?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showBridgeSetup, setShowBridgeSetup] = useState(false);
  const [loading, setLoading] = useState(false);
  const [postingId, setPostingId] = useState<string | null>(null);
  const [savingCfg, setSavingCfg] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [enabled, setEnabled] = useState(true);
  const [whatsappLocal, setWhatsappLocal] = useState('0728595160');
  const [postedTodayCount, setPostedTodayCount] = useState(0);
  const [totalButtons, setTotalButtons] = useState(18);
  const [hasWhapi, setHasWhapi] = useState(false);
  const [hasGreenApi, setHasGreenApi] = useState(false);
  const [hasEvolution, setHasEvolution] = useState(false);

  const [whapiToken, setWhapiToken] = useState('');
  const [greenInstanceId, setGreenInstanceId] = useState('');
  const [greenToken, setGreenToken] = useState('');
  const [customWebhook, setCustomWebhook] = useState('');

  const [plan, setPlan] = useState<DailyButtonPlanItem[]>([]);
  const [history, setHistory] = useState<StatusHistoryItem[]>([]);

  const songAudioRef = useRef<HTMLAudioElement | null>(null);
  const [playingSong, setPlayingSong] = useState(false);

  const headers = useCallback(() => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-password': password.trim(),
    };
    if (adminEmail.trim()) h['x-admin-email'] = adminEmail.trim();
    return h;
  }, [password, adminEmail]);

  const fetchStatusState = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/social/whatsapp-status-autopost', {
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEnabled(Boolean(data.enabled));
        setWhatsappLocal(data.whatsappNumberLocal || '0728595160');
        setPostedTodayCount(Number(data.postedTodayCount) || 0);
        setTotalButtons(Number(data.totalButtons) || 18);
        setHasWhapi(Boolean(data.hasWhapiToken));
        setHasGreenApi(Boolean(data.hasGreenApi));
        setHasEvolution(Boolean(data.hasEvolutionApi));
        setGreenInstanceId(data.greenApiInstanceId || '');
        setCustomWebhook(data.customStatusWebhookUrl || '');
        if (Array.isArray(data.dailyButtonsPlan)) setPlan(data.dailyButtonsPlan);
        if (Array.isArray(data.history)) setHistory(data.history);
      }
    } catch {
      // ignore transient network error
    } finally {
      setLoading(false);
    }
  }, [password, headers]);

  useEffect(() => {
    void fetchStatusState();
  }, [fetchStatusState]);

  useEffect(() => {
    return () => {
      if (songAudioRef.current) songAudioRef.current.pause();
    };
  }, []);

  const togglePreviewSong = () => {
    let audio = songAudioRef.current;
    if (!audio) {
      audio = new Audio('/audio/whatsapp-status-soft-song.mp3');
      audio.addEventListener('ended', () => setPlayingSong(false));
      songAudioRef.current = audio;
    }
    if (audio.paused) {
      void audio.play();
      setPlayingSong(true);
    } else {
      audio.pause();
      setPlayingSong(false);
    }
  };

  const triggerHourlyPost = async (buttonId?: string) => {
    setPostingId(buttonId || 'NEXT');
    setFeedback('');
    try {
      const res = await fetch('/api/social/whatsapp-status-autopost', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'post_next_hourly',
          buttonId,
        }),
      });
      const data = await res.json();
      if (res.ok && data.posted && data.ad) {
        setFeedback(
          `Posted Button #${data.ad.orderIndex} (${data.ad.buttonLabel}) to ${whatsappLocal} Status queue (${data.postedTodayCount}/${data.totalButtons} today)!`
        );
        await fetchStatusState();
      } else {
        setFeedback(data.reason || data.error || 'Could not trigger Status post.');
      }
    } catch {
      setFeedback('Network error triggering Status post.');
    } finally {
      setPostingId(null);
    }
  };

  const shareButtonAdToMobileStatus = async (item: DailyButtonPlanItem) => {
    try {
      if (typeof navigator !== 'undefined' && navigator.share) {
        const imgRes = await fetch(item.posterImageUrl);
        const imgBlob = await imgRes.blob();
        const imgFile = new File([imgBlob], `${item.buttonId}-status.png`, {
          type: 'image/png',
        });
        if (navigator.canShare && navigator.canShare({ files: [imgFile] })) {
          await navigator.share({
            title: item.buttonLabel,
            text: item.statusCaption,
            files: [imgFile],
          });
          return;
        }
      }
    } catch {
      // Fallback to direct WhatsApp composer
    }
    window.open(
      `https://wa.me/?text=${encodeURIComponent(item.statusCaption)}`,
      '_blank',
      'noopener,noreferrer'
    );
  };

  const saveBridgeSettings = async (nextEnabled = enabled) => {
    setSavingCfg(true);
    setFeedback('');
    try {
      const res = await fetch('/api/social/whatsapp-status-autopost', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'save_config',
          config: {
            enabled: nextEnabled,
            whapiApiToken: whapiToken,
            greenApiInstanceId: greenInstanceId,
            greenApiToken: greenToken,
            customStatusWebhookUrl: customWebhook,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEnabled(nextEnabled);
        setWhapiToken('');
        setGreenToken('');
        setFeedback(data.message || 'Saved WhatsApp Status settings!');
        await fetchStatusState();
      }
    } catch {
      setFeedback('Could not save settings.');
    } finally {
      setSavingCfg(false);
    }
  };

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
        darkTheme
          ? 'bg-slate-900 border-emerald-500/40 text-white'
          : 'bg-white border-emerald-300 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                WhatsApp Status Hourly Auto-Poster ({whatsappLocal})
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  enabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-400 text-slate-950'
                }`}
              >
                {enabled ? 'EVERY 1 HOUR • DAILY ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p
              className={`text-xs ${
                darkTheme ? 'text-slate-300' : 'text-slate-500'
              }`}
            >
              Connected to <strong>{whatsappLocal}</strong> • Automatically posts{' '}
              <strong>1 Website Button per hour</strong> ({postedTodayCount}/
              {totalButtons} buttons posted today — Image + Clickable Link + Soft Song)
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={togglePreviewSong}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
          >
            {playingSong ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
            <span>{playingSong ? 'Pause Soft Song' : 'Preview Status Song'}</span>
          </button>

          <button
            type="button"
            onClick={() => triggerHourlyPost()}
            disabled={postingId !== null}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer disabled:opacity-60"
          >
            {postingId === 'NEXT' ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Zap className="w-3.5 h-3.5" />
            )}
            <span>Post Next Hourly Button Now</span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded((e) => !e)}
            className={`p-2 rounded-xl border text-xs cursor-pointer ${
              darkTheme
                ? 'border-slate-700 hover:bg-slate-800'
                : 'border-slate-200 hover:bg-slate-50'
            }`}
          >
            {expanded ? (
              <ChevronUp className="w-4 h-4" />
            ) : (
              <ChevronDown className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2.5 text-xs font-bold text-emerald-700 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-slate-200/30">
          {/* Controls Strip */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => saveBridgeSettings(!enabled)}
                className={`px-3 py-1.5 rounded-lg font-black uppercase cursor-pointer ${
                  enabled
                    ? 'bg-emerald-100 text-emerald-900 border border-emerald-300'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                Hourly Schedule: {enabled ? 'ON (1 Hr Interval)' : 'OFF'}
              </button>
              <span className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-amber-500/15 text-amber-700 font-bold">
                <Clock className="w-3.5 h-3.5" />
                Today&apos;s Coverage: {postedTodayCount} / {totalButtons} Buttons
              </span>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowBridgeSetup((s) => !s)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-slate-300 font-bold text-xs cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                {hasWhapi || hasGreenApi || hasEvolution
                  ? 'Direct Status API Connected ✓'
                  : 'Connect Hands-Free Status API / Linked Device'}
              </button>
              <button
                type="button"
                onClick={fetchStatusState}
                className="p-1.5 rounded-lg border border-slate-300 cursor-pointer"
                title="Refresh"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`}
                />
              </button>
            </div>
          </div>

          {/* Optional Direct status@broadcast Bridge Setup */}
          {showBridgeSetup && (
            <div
              className={`rounded-xl p-4 border space-y-3 text-xs ${
                darkTheme
                  ? 'bg-slate-950 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="font-bold">
                Link <strong>{whatsappLocal}</strong> once for 100% hands-free{' '}
                <code>status@broadcast</code> Stories (choose Whapi.Cloud Token,
                Green-API, Webhook, or run{' '}
                <code>node --env-file=.env.local scripts/whatsapp-0728595160-status-daemon.mjs</code>{' '}
                with your 8-digit WhatsApp Pairing Code):
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold mb-1">
                    Whapi.Cloud Channel Token {hasWhapi ? '(Saved ✓)' : ''}
                  </label>
                  <input
                    type="password"
                    placeholder="Paste Whapi.Cloud token (posts Image + Link + Song Story)"
                    value={whapiToken}
                    onChange={(e) => setWhapiToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    Custom Status Webhook URL (Make / Zapier / n8n)
                  </label>
                  <input
                    type="url"
                    placeholder="https://hook.eu2.make.com/..."
                    value={customWebhook}
                    onChange={(e) => setCustomWebhook(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    Green-API Instance ID {hasGreenApi ? '(Saved ✓)' : ''}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 7103948571"
                    value={greenInstanceId}
                    onChange={(e) => setGreenInstanceId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
                <div>
                  <label className="block font-bold mb-1">
                    Green-API Token
                  </label>
                  <input
                    type="password"
                    placeholder="Paste Green-API token"
                    value={greenToken}
                    onChange={(e) => setGreenToken(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-slate-300 text-slate-900 bg-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={() => saveBridgeSettings(enabled)}
                disabled={savingCfg}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase cursor-pointer"
              >
                {savingCfg ? 'Saving…' : 'Save 0728595160 Status Bridge'}
              </button>
            </div>
          )}

          {/* Grid of All 18 Daily Website Button Status Ads */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 max-h-[420px] overflow-y-auto pr-1">
            {plan.map((item) => (
              <div
                key={item.buttonId}
                className={`rounded-xl border p-3 flex flex-col justify-between gap-2.5 text-xs ${
                  darkTheme
                    ? 'bg-slate-950/80 border-slate-800'
                    : 'bg-slate-50/80 border-slate-200'
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-black text-[11px] uppercase text-emerald-600">
                      Hour #{item.orderIndex}
                    </span>
                    {item.postedToday ? (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-black text-[10px]">
                        <CheckCircle2 className="w-3 h-3" />
                        Posted Today
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-600 font-bold text-[10px]">
                        Queued Today
                      </span>
                    )}
                  </div>
                  <div className="font-black text-xs leading-snug">
                    {item.buttonLabel}
                  </div>
                  <p className="text-[11px] opacity-80 line-clamp-2">
                    {item.headline}
                  </p>
                  <div className="flex items-center gap-1.5 text-[10px] font-bold text-amber-600">
                    <Music2 className="w-3 h-3" />
                    <span>Auto-Image + Clickable Link + Soft Song</span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/30">
                  <button
                    type="button"
                    onClick={() => triggerHourlyPost(item.buttonId)}
                    disabled={postingId !== null}
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-[11px] py-1.5 px-2.5 rounded-lg cursor-pointer"
                  >
                    {postingId === item.buttonId ? 'Posting…' : 'Auto-Post'}
                  </button>
                  <button
                    type="button"
                    onClick={() => shareButtonAdToMobileStatus(item)}
                    title="Share Image + Caption Link directly to WhatsApp Status"
                    className="bg-teal-600 hover:bg-teal-700 text-white font-black text-[11px] py-1.5 px-2.5 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Share2 className="w-3 h-3" />
                    Status
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigator.clipboard?.writeText(item.statusCaption);
                      setCopiedId(item.buttonId);
                      setTimeout(() => setCopiedId(null), 1800);
                    }}
                    title="Copy Status Caption + Clickable Link"
                    className="p-1.5 rounded-lg border border-slate-300 cursor-pointer"
                  >
                    {copiedId === item.buttonId ? (
                      <Check className="w-3.5 h-3.5 text-emerald-500" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <a
                    href={item.musicalStoryUrl}
                    target="_blank"
                    rel="noreferrer"
                    title="Preview Musical Status Card"
                    className="p-1.5 rounded-lg border border-slate-300"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            ))}
          </div>

          {history.length > 0 && (
            <div className="text-[11px] opacity-80">
              Latest Hourly Status Dispatch:{' '}
              <strong>{history[0].buttonLabel}</strong> ({history[0].dateEat} •{' '}
              {history[0].deliveryChannels.join(', ')})
            </div>
          )}
        </div>
      )}
    </section>
  );
}
