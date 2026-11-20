'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  ArrowUpRight,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink,
  Link2,
  Loader2,
  MessageCircle,
  RefreshCw,
  Send,
  Settings,
  Sparkles,
} from 'lucide-react';

interface CampaignItem {
  slug: string;
  label: string;
  badge: string;
  shortRedirectUrl: string;
  destinationUrl: string;
  paidAdWaLink: string;
  paidAdEntryUrl: string;
}

interface LeadItem {
  id: string;
  repliedAtIso: string;
  senderPhone: string;
  senderName: string;
  incomingMessage: string;
  detectedCampaignSlug: string;
  detectedCampaignLabel: string;
  redirectUrlSent: string;
  deliveryChannels: string[];
  deliveredViaApi: boolean;
  isPaidAdReferral: boolean;
}

export default function WhatsAppAutoReplyPanel({
  password,
  adminEmail = '',
  darkTheme = false,
}: {
  password: string;
  adminEmail?: string;
  darkTheme?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const [enabled, setEnabled] = useState(true);
  const [whatsappE164, setWhatsappE164] = useState('+254728595160');
  const [cooldownMinutes, setCooldownMinutes] = useState(30);
  const [verifyToken, setVerifyToken] = useState('cbcmaterials_autoreply_254728595160');
  const [greetingHeader, setGreetingHeader] = useState('');
  const [closingNote, setClosingNote] = useState('');
  const [includeCategoryLinks, setIncludeCategoryLinks] = useState(true);
  const [metaPhoneNumberId, setMetaPhoneNumberId] = useState('');
  const [metaAccessToken, setMetaAccessToken] = useState('');
  const [hasMetaCloudApi, setHasMetaCloudApi] = useState(false);
  const [customReplyWebhookUrl, setCustomReplyWebhookUrl] = useState('');

  const [webhookUrl, setWebhookUrl] = useState(
    'https://www.cbcmaterials.shop/api/social/whatsapp-autoreply'
  );
  const [masterRedirectUrl, setMasterRedirectUrl] = useState(
    'https://www.cbcmaterials.shop/go'
  );
  const [paidAdEntryUrl, setPaidAdEntryUrl] = useState(
    'https://www.cbcmaterials.shop/whatsapp-ad'
  );
  const [sampleReplyText, setSampleReplyText] = useState('');
  const [campaigns, setCampaigns] = useState<CampaignItem[]>([]);
  const [leads, setLeads] = useState<LeadItem[]>([]);
  const [stats, setStats] = useState({
    totalIncomingMessages: 0,
    totalAutoRepliesSent: 0,
    totalWebsiteRedirectClicks: 0,
    totalPaidAdEntryClicks: 0,
  });

  const [testCustomerMessage, setTestCustomerMessage] = useState(
    'Hello CBCMATERIALS.SHOP! I saw your advert — please send me the website link.'
  );
  const [simulatedPreview, setSimulatedPreview] = useState('');

  const headers = useCallback(() => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-password': password.trim(),
    };
    if (adminEmail.trim()) h['x-admin-email'] = adminEmail.trim();
    return h;
  }, [password, adminEmail]);

  const fetchState = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/social/whatsapp-autoreply', {
        headers: headers(),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEnabled(Boolean(data.enabled));
        setWhatsappE164(data.fixedWhatsAppE164 || '+254728595160');
        setCooldownMinutes(Number(data.cooldownMinutes) || 30);
        setVerifyToken(data.verifyToken || 'cbcmaterials_autoreply_254728595160');
        setGreetingHeader(data.customGreetingHeader || '');
        setClosingNote(data.customClosingNote || '');
        setIncludeCategoryLinks(Boolean(data.includeQuickCategoryLinks));
        setHasMetaCloudApi(Boolean(data.hasMetaCloudApi));
        setMetaPhoneNumberId(data.metaPhoneNumberId || '');
        setCustomReplyWebhookUrl(data.customReplyWebhookUrl || '');
        if (data.webhookUrl) setWebhookUrl(data.webhookUrl);
        if (data.masterRedirectUrl) setMasterRedirectUrl(data.masterRedirectUrl);
        if (data.paidAdEntryUrl) setPaidAdEntryUrl(data.paidAdEntryUrl);
        if (data.sampleReplyText) setSampleReplyText(data.sampleReplyText);
        if (Array.isArray(data.campaigns)) setCampaigns(data.campaigns);
        if (Array.isArray(data.recentLeads)) setLeads(data.recentLeads);
        if (data.stats) {
          setStats({
            totalIncomingMessages: Number(data.stats.totalIncomingMessages) || 0,
            totalAutoRepliesSent: Number(data.stats.totalAutoRepliesSent) || 0,
            totalWebsiteRedirectClicks:
              Number(data.stats.totalWebsiteRedirectClicks) || 0,
            totalPaidAdEntryClicks: Number(data.stats.totalPaidAdEntryClicks) || 0,
          });
        }
      }
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, [password, headers]);

  useEffect(() => {
    void fetchState();
  }, [fetchState]);

  const copyText = (key: string, value: string) => {
    navigator.clipboard.writeText(value);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2200);
  };

  const handleSaveConfig = async (nextEnabled = enabled) => {
    setSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/social/whatsapp-autoreply', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'save_config',
          config: {
            enabled: nextEnabled,
            cooldownMinutes,
            verifyToken,
            customGreetingHeader: greetingHeader,
            customClosingNote: closingNote,
            includeQuickCategoryLinks: includeCategoryLinks,
            metaPhoneNumberId,
            metaAccessToken,
            customReplyWebhookUrl,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setEnabled(Boolean(data.enabled));
        setMetaAccessToken('');
        if (data.sampleReplyText) setSampleReplyText(data.sampleReplyText);
        setFeedback(data.message || 'Saved +254728595160 Auto-Reply settings!');
        await fetchState();
      } else {
        setFeedback(data.error || 'Failed to save settings.');
      }
    } catch {
      setFeedback('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSimulateReply = async () => {
    setSimulating(true);
    try {
      const res = await fetch('/api/social/whatsapp-autoreply', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'simulate_reply',
          incomingMessage: testCustomerMessage,
          senderName: 'Ad Customer',
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSimulatedPreview(data.replyText || '');
      }
    } catch {
      // ignore
    } finally {
      setSimulating(false);
    }
  };

  const primaryDirectWaUrl =
    campaigns[0]?.paidAdWaLink ||
    'https://wa.me/254728595160?text=Hello%20CBCMATERIALS.SHOP!%20I%20saw%20your%20advert%20%E2%80%94%20please%20send%20me%20the%20website%20link%20to%20download%20CBC%20materials.';

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
        darkTheme
          ? 'bg-slate-900 border-emerald-400/40 text-white'
          : 'bg-white border-emerald-300 text-slate-900'
      }`}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center shrink-0 shadow">
            <MessageCircle className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                Paid-Ads WhatsApp Auto-Reply &rarr; Website ({whatsappE164})
              </h2>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                  enabled
                    ? 'bg-emerald-500 text-slate-950'
                    : 'bg-slate-400 text-slate-950'
                }`}
              >
                {enabled ? '24/7 AUTO-REPLY ACTIVE' : 'PAUSED'}
              </span>
            </div>
            <p
              className={`text-xs ${
                darkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Fixed on <strong>{whatsappE164}</strong> • Automatically replies to Paid-Ad
              WhatsApp customers with clickable redirect link to{' '}
              <strong>CBCMATERIALS.SHOP</strong>
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchState()}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              darkTheme
                ? 'border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200'
                : 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowEditor((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
              darkTheme
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900/60'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {showEditor ? 'Hide Settings' : 'Customize Reply & API'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`p-1.5 rounded-lg border ${
              darkTheme
                ? 'border-slate-700 text-slate-300'
                : 'border-slate-200 text-slate-600'
            }`}
            aria-label="Toggle Auto-Reply Panel"
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
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{feedback}</span>
        </div>
      )}

      {expanded && (
        <div className="space-y-4">
          {/* Live Funnel Counters */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div
              className={`rounded-xl p-3 border ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase opacity-70 block">
                Paid-Ad Clicks &rarr; WA
              </span>
              <span className="text-lg font-black text-emerald-500">
                {stats.totalPaidAdEntryClicks.toLocaleString()}
              </span>
            </div>
            <div
              className={`rounded-xl p-3 border ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase opacity-70 block">
                WA Texts ({whatsappE164})
              </span>
              <span className="text-lg font-black">
                {stats.totalIncomingMessages.toLocaleString()}
              </span>
            </div>
            <div
              className={`rounded-xl p-3 border ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase opacity-70 block">
                Auto-Replies Sent
              </span>
              <span className="text-lg font-black text-teal-500">
                {stats.totalAutoRepliesSent.toLocaleString()}
              </span>
            </div>
            <div
              className={`rounded-xl p-3 border ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <span className="text-[10px] font-bold uppercase opacity-70 block">
                Website Redirect Clicks
              </span>
              <span className="text-lg font-black text-amber-500">
                {stats.totalWebsiteRedirectClicks.toLocaleString()}
              </span>
            </div>
          </div>

          {/* Primary Ready-to-Use Links */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
            {/* 1. Website Redirect Link sent inside WhatsApp Auto-Reply */}
            <div
              className={`rounded-xl p-3.5 border space-y-2 ${
                darkTheme
                  ? 'bg-emerald-950/35 border-emerald-500/40'
                  : 'bg-emerald-50/80 border-emerald-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase text-emerald-600 dark:text-emerald-300 flex items-center gap-1">
                  <Link2 className="w-3.5 h-3.5" />
                  1. Auto-Reply Redirect Link (WA &rarr; Site)
                </span>
                <a
                  href={masterRedirectUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-700 dark:text-emerald-300 inline-flex items-center gap-0.5 hover:underline"
                >
                  Test <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs font-mono break-all font-bold">
                {masterRedirectUrl}
              </p>
              <button
                type="button"
                onClick={() => copyText('master_redirect', masterRedirectUrl)}
                className="w-full py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'master_redirect' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied Redirect Link!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Website Redirect Link
                  </>
                )}
              </button>
            </div>

            {/* 2. Paid-Ads Click-to-WhatsApp Link (+254728595160) */}
            <div
              className={`rounded-xl p-3.5 border space-y-2 ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase flex items-center gap-1">
                  <ArrowUpRight className="w-3.5 h-3.5 text-emerald-500" />
                  2. Paid-Ads Link &rarr; {whatsappE164}
                </span>
                <a
                  href={paidAdEntryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-[11px] font-bold text-emerald-600 inline-flex items-center gap-0.5 hover:underline"
                >
                  Open WA <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <p className="text-xs font-mono break-all font-bold">{paidAdEntryUrl}</p>
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => copyText('paid_ad_entry', paidAdEntryUrl)}
                  className="py-2 px-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'paid_ad_entry' ? (
                    <>
                      <Check className="w-3 h-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Ad Track URL
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => copyText('paid_ad_wame', primaryDirectWaUrl)}
                  className="py-2 px-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] inline-flex items-center justify-center gap-1 transition cursor-pointer"
                >
                  {copiedKey === 'paid_ad_wame' ? (
                    <>
                      <Check className="w-3 h-3" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Direct wa.me
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* 3. Live Webhook Server URL for +254728595160 */}
            <div
              className={`rounded-xl p-3.5 border space-y-2 ${
                darkTheme
                  ? 'bg-slate-950/70 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-black uppercase flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  3. Auto-Reply Webhook ({whatsappE164})
                </span>
                <span className="text-[10px] font-bold text-emerald-500">
                  Meta / Whapi / WhatsAuto
                </span>
              </div>
              <p className="text-xs font-mono break-all font-bold">{webhookUrl}</p>
              <button
                type="button"
                onClick={() => copyText('webhook_url', webhookUrl)}
                className="w-full py-2 px-3 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs inline-flex items-center justify-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'webhook_url' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied Webhook URL!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Live Auto-Reply Webhook
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Ready-to-Paste Auto-Reply Message Preview */}
          <div
            className={`rounded-xl p-4 border space-y-2.5 ${
              darkTheme
                ? 'bg-slate-950/80 border-slate-800'
                : 'bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wide">
                  Active Auto-Reply Message Sent From {whatsappE164}
                </h3>
                <p className="text-[11px] opacity-75">
                  Sent automatically via Webhook / Linked Daemon, OR paste directly into{' '}
                  <strong>WhatsApp Business &rarr; Greeting &amp; Away Message</strong> on{' '}
                  {whatsappE164}
                </p>
              </div>
              <button
                type="button"
                onClick={() => copyText('full_reply_msg', sampleReplyText)}
                className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1.5 transition cursor-pointer"
              >
                {copiedKey === 'full_reply_msg' ? (
                  <>
                    <Check className="w-3.5 h-3.5" /> Copied Auto-Reply Message!
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" /> Copy Full Auto-Reply Message
                  </>
                )}
              </button>
            </div>
            <pre
              className={`text-xs whitespace-pre-wrap font-sans rounded-xl p-3.5 border leading-relaxed ${
                darkTheme
                  ? 'bg-emerald-950/40 border-emerald-500/30 text-emerald-100'
                  : 'bg-white border-emerald-200 text-slate-800'
              }`}
            >
              {sampleReplyText ||
                '👋 Welcome to *CBCMATERIALS.SHOP*!\n\n👉 Tap this link to open our official website & download instantly:\nhttps://www.cbcmaterials.shop/go'}
            </pre>
          </div>

          {/* Campaign-Specific Paid-Ad Links Table */}
          {campaigns.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wide">
                Campaign-Specific Paid-Ad &amp; Redirect Links ({whatsappE164})
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {campaigns.map((c) => (
                  <div
                    key={c.slug}
                    className={`rounded-xl p-3 border flex flex-col justify-between gap-2 ${
                      darkTheme
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div>
                      <span className="inline-block text-[10px] font-black uppercase px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-600 dark:text-emerald-300 mb-1">
                        {c.badge}
                      </span>
                      <p className="text-xs font-bold">{c.label}</p>
                      <p className="text-[11px] font-mono opacity-80 truncate mt-0.5">
                        Redirect: {c.shortRedirectUrl}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => copyText(`wa_${c.slug}`, c.paidAdWaLink)}
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === `wa_${c.slug}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy Paid-Ad WA Link
                      </button>
                      <button
                        type="button"
                        onClick={() => copyText(`go_${c.slug}`, c.shortRedirectUrl)}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold inline-flex items-center gap-1 border cursor-pointer ${
                          darkTheme
                            ? 'border-slate-700 bg-slate-800 text-slate-200'
                            : 'border-slate-300 bg-white text-slate-700'
                        }`}
                      >
                        {copiedKey === `go_${c.slug}` ? (
                          <Check className="w-3 h-3" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        Copy /go/{c.slug}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Optional Customizer + Test Simulator */}
          {showEditor && (
            <div
              className={`rounded-xl p-4 border space-y-4 ${
                darkTheme
                  ? 'bg-slate-950/90 border-emerald-500/40'
                  : 'bg-emerald-50/50 border-emerald-200'
              }`}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-xs font-black uppercase">
                  Customize {whatsappE164} Auto-Reply Message &amp; Cloud Webhook
                </h3>
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enabled}
                    onChange={(e) => {
                      setEnabled(e.target.checked);
                      void handleSaveConfig(e.target.checked);
                    }}
                    className="rounded accent-emerald-600"
                  />
                  Enable 24/7 Auto-Responder
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Greeting Header
                  </label>
                  <textarea
                    rows={2}
                    value={greetingHeader}
                    onChange={(e) => setGreetingHeader(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Closing Instruction Note
                  </label>
                  <textarea
                    rows={2}
                    value={closingNote}
                    onChange={(e) => setClosingNote(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Per-Customer Cooldown (Minutes)
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={1440}
                    value={cooldownMinutes}
                    onChange={(e) => setCooldownMinutes(Number(e.target.value) || 0)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Meta Phone Number ID (Optional {hasMetaCloudApi ? '• Saved' : ''})
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 10492837465..."
                    value={metaPhoneNumberId}
                    onChange={(e) => setMetaPhoneNumberId(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Meta Cloud Access Token (Optional)
                  </label>
                  <input
                    type="password"
                    placeholder="EAAG..."
                    value={metaAccessToken}
                    onChange={(e) => setMetaAccessToken(e.target.value)}
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includeCategoryLinks}
                    onChange={(e) => setIncludeCategoryLinks(e.target.checked)}
                    className="rounded accent-emerald-600"
                  />
                  Include Quick Section Links (Schemes, Exams, Books, Videos, Tuition)
                </label>

                <button
                  type="button"
                  onClick={() => void handleSaveConfig(enabled)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save Auto-Reply Settings
                </button>
              </div>

              {/* Instant Smart Simulator */}
              <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2">
                <label className="block text-[11px] font-black uppercase">
                  Test Smart Paid-Ad Intent Detection
                </label>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={testCustomerMessage}
                    onChange={(e) => setTestCustomerMessage(e.target.value)}
                    placeholder="Type a sample customer WhatsApp message..."
                    className={`flex-1 rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                  <button
                    type="button"
                    onClick={() => void handleSimulateReply()}
                    disabled={simulating}
                    className="px-3.5 py-2 rounded-lg bg-slate-900 dark:bg-emerald-600 text-white font-bold text-xs inline-flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    {simulating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    Simulate Auto-Reply
                  </button>
                </div>
                {simulatedPreview && (
                  <pre
                    className={`text-xs whitespace-pre-wrap font-sans rounded-lg p-3 border ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-emerald-200'
                        : 'bg-white border-slate-200 text-slate-800'
                    }`}
                  >
                    {simulatedPreview}
                  </pre>
                )}
              </div>
            </div>
          )}

          {/* Recent Paid-Ad WhatsApp Leads */}
          {leads.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-black uppercase tracking-wide">
                Recent Paid-Ad Customers Auto-Replied on {whatsappE164} ({leads.length})
              </h3>
              <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1">
                {leads.slice(0, 10).map((lead) => (
                  <div
                    key={lead.id}
                    className={`rounded-lg px-3 py-2 border text-xs flex flex-wrap items-center justify-between gap-2 ${
                      darkTheme
                        ? 'bg-slate-950/60 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="min-w-0">
                      <span className="font-black">+{lead.senderPhone}</span>{' '}
                      <span className="opacity-75">({lead.senderName})</span>
                      <p className="text-[11px] opacity-80 truncate max-w-md">
                        &ldquo;{lead.incomingMessage}&rdquo; &rarr;{' '}
                        <span className="text-emerald-500 font-semibold">
                          {lead.redirectUrlSent}
                        </span>
                      </p>
                    </div>
                    <span className="text-[10px] opacity-70 shrink-0">
                      {new Date(lead.repliedAtIso).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
