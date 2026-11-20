'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Building2,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Globe2,
  HeartHandshake,
  Loader2,
  MessageCircle,
  RefreshCw,
  Settings,
  Smartphone,
} from 'lucide-react';
import {
  DONATION_METHOD_LABELS,
  type DonationGatewaySettings,
  type LearnerDonationRecord,
} from '@/lib/donations';

export default function AdminDonationsPanel({
  password,
  adminEmail = '',
  darkTheme = false,
}: {
  password: string;
  adminEmail?: string;
  darkTheme?: boolean;
}) {
  const [expanded, setExpanded] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState('');

  const [donations, setDonations] = useState<LearnerDonationRecord[]>([]);
  const [summary, setSummary] = useState({
    totalRecords: 0,
    completedCount: 0,
    completedUsd: 0,
    completedKes: 0,
    pledgedUsd: 0,
  });
  const [settings, setSettings] = useState<DonationGatewaySettings>({
    usdToKesRate: 130,
    paypalHandleOrUrl: '',
    bankName: 'Equity Bank Kenya (Connected via PayHero Bank Channel #15443)',
    bankAccountName: 'CBCMATERIALS.SHOP / Learner Support Fund',
    bankAccountNumber: '',
    bankSwiftBic: 'EQBLKENA',
    bankBranch: 'Nairobi, Kenya',
    autoTriggerBankSweepOnRemittanceConfirm: true,
  });

  const headers = useCallback(() => {
    const h: Record<string, string> = {
      'Content-Type': 'application/json',
      'x-admin-password': password.trim(),
    };
    if (adminEmail.trim()) h['x-admin-email'] = adminEmail.trim();
    return h;
  }, [password, adminEmail]);

  const fetchDonations = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/donations?admin=1', { headers: headers() });
      const data = await res.json();
      if (res.ok && data.ok) {
        if (Array.isArray(data.donations)) setDonations(data.donations);
        if (data.summary) setSummary(data.summary);
        if (data.settings) setSettings(data.settings);
      }
    } catch {
      // ignore transient error
    } finally {
      setLoading(false);
    }
  }, [password, headers]);

  useEffect(() => {
    void fetchDonations();
  }, [fetchDonations]);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback('');
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'save_settings',
          settings,
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setFeedback(data.message || 'Saved International Donation settings!');
        await fetchDonations();
      }
    } catch {
      setFeedback('Network error saving settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleSweepToBank = async (id: string) => {
    setBusyId(id);
    setFeedback('');
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'admin_sweep_to_bank',
          id,
        }),
      });
      const data = await res.json();
      setFeedback(data.message || data.error || 'Sweep request processed.');
      await fetchDonations();
    } catch {
      setFeedback('Could not trigger Bank STK Sweep.');
    } finally {
      setBusyId(null);
    }
  };

  const handleMarkCompleted = async (id: string) => {
    setBusyId(id);
    try {
      await fetch('/api/donations', {
        method: 'POST',
        headers: headers(),
        body: JSON.stringify({
          action: 'update_status',
          id,
          status: 'COMPLETED_IN_BANK',
        }),
      });
      await fetchDonations();
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section
      className={`rounded-2xl border p-5 shadow-sm space-y-4 ${
        darkTheme
          ? 'bg-slate-900 border-emerald-400/40 text-white'
          : 'bg-white border-emerald-300 text-slate-900'
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-indigo-700 text-white flex items-center justify-center shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                International Learner Donations &amp; One-Way Bank Remittance Hub
              </h2>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500 text-slate-950">
                ${summary.completedUsd.toLocaleString()} SETTLED • $
                {summary.pledgedUsd.toLocaleString()} PLEDGED
              </span>
            </div>
            <p
              className={`text-xs ${
                darkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Direct Bank STK Push ($1+) + Remitly, Sendwave, WorldRemit, PayPal &amp;
              Intl Bank Wire connected one-way to Bank
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => void fetchDonations()}
            disabled={loading}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              darkTheme
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            type="button"
            onClick={() => setShowSettings((v) => !v)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border ${
              darkTheme
                ? 'border-emerald-500/40 bg-emerald-950/60 text-emerald-300'
                : 'border-emerald-300 bg-emerald-50 text-emerald-800'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            {showSettings ? 'Hide Bank/PayPal Config' : 'Configure PayPal & Bank Wire'}
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className={`p-1.5 rounded-lg border ${
              darkTheme
                ? 'border-slate-700 text-slate-300'
                : 'border-slate-200 text-slate-600'
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
        <div className="rounded-xl bg-emerald-500/15 border border-emerald-500/40 px-3.5 py-2 text-xs font-bold text-emerald-600 dark:text-emerald-300">
          {feedback}
        </div>
      )}

      {expanded && (
        <div className="space-y-4">
          {showSettings && (
            <form
              onSubmit={handleSaveSettings}
              className={`rounded-xl p-4 border space-y-3 ${
                darkTheme
                  ? 'bg-slate-950/80 border-slate-800'
                  : 'bg-slate-50 border-slate-200'
              }`}
            >
              <p className="text-xs font-black uppercase flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-emerald-500" />
                Upon-Request PayPal &amp; International Bank Wire Coordinates
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    PayPal Email / PayPal.me Link (Shown Upon Request)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. paypal.me/yourhandle or email"
                    value={settings.paypalHandleOrUrl}
                    onChange={(e) =>
                      setSettings({ ...settings, paypalHandleOrUrl: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Bank Name &amp; SWIFT/BIC
                  </label>
                  <input
                    type="text"
                    value={settings.bankName}
                    onChange={(e) =>
                      setSettings({ ...settings, bankName: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold mb-1">
                    Bank Account Number / IBAN (Shown Upon Request)
                  </label>
                  <input
                    type="text"
                    placeholder="Optional — or share via WhatsApp on request"
                    value={settings.bankAccountNumber}
                    onChange={(e) =>
                      setSettings({ ...settings, bankAccountNumber: e.target.value })
                    }
                    className={`w-full rounded-lg border px-3 py-2 text-xs ${
                      darkTheme
                        ? 'bg-slate-900 border-slate-700 text-white'
                        : 'bg-white border-slate-300 text-slate-900'
                    }`}
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2">
                <label className="inline-flex items-center gap-2 text-xs font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.autoTriggerBankSweepOnRemittanceConfirm}
                    onChange={(e) =>
                      setSettings({
                        ...settings,
                        autoTriggerBankSweepOnRemittanceConfirm: e.target.checked,
                      })
                    }
                    className="rounded accent-emerald-600"
                  />
                  Auto-trigger One-Way Bank STK Push when donor confirms Remitly / Sendwave
                  / WorldRemit
                </label>

                <button
                  type="submit"
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs inline-flex items-center gap-1.5 cursor-pointer"
                >
                  {saving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5" />
                  )}
                  Save Donation Settings
                </button>
              </div>
            </form>
          )}

          {donations.length === 0 ? (
            <div
              className={`rounded-xl p-5 text-center text-xs border ${
                darkTheme
                  ? 'bg-slate-950/50 border-slate-800 text-slate-400'
                  : 'bg-slate-50 border-slate-200 text-slate-500'
              }`}
            >
              <Globe2 className="w-5 h-5 mx-auto mb-1 text-emerald-500" />
              International &amp; local learner donations and remittance requests will
              appear here live. Shareable page: <strong>https://www.cbcmaterials.shop/donate</strong>
            </div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {donations.slice(0, 25).map((d) => {
                const cleanWa = (d.donorPhone || '').replace(/[^\d]/g, '');
                return (
                  <div
                    key={d.id}
                    className={`rounded-xl p-3 border text-xs flex flex-wrap items-center justify-between gap-2.5 ${
                      darkTheme
                        ? 'bg-slate-950/70 border-slate-800'
                        : 'bg-slate-50 border-slate-200'
                    }`}
                  >
                    <div className="space-y-0.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-mono font-black text-emerald-600 dark:text-emerald-400">
                          {d.referenceCode}
                        </span>
                        <span className="font-black">
                          ${d.amountUsd.toLocaleString()} USD (KSh{' '}
                          {d.amountKes.toLocaleString()})
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
                          {DONATION_METHOD_LABELS[d.method] || d.method}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            d.status === 'COMPLETED_IN_BANK'
                              ? 'bg-emerald-500 text-slate-950'
                              : 'bg-amber-400 text-slate-950'
                          }`}
                        >
                          {d.status}
                        </span>
                      </div>
                      <p className="opacity-80">
                        <strong>{d.donorName}</strong> ({d.donorCountry}){' '}
                        {d.donorEmail ? `• ${d.donorEmail}` : ''}{' '}
                        {d.donorPhone ? `• ${d.donorPhone}` : ''}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {d.status !== 'COMPLETED_IN_BANK' && (
                        <>
                          <button
                            type="button"
                            disabled={busyId === d.id}
                            onClick={() => void handleSweepToBank(d.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Smartphone className="w-3 h-3" />
                            Sweep to Bank STK
                          </button>
                          <button
                            type="button"
                            disabled={busyId === d.id}
                            onClick={() => void handleMarkCompleted(d.id)}
                            className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] inline-flex items-center gap-1 cursor-pointer"
                          >
                            <CheckCircle2 className="w-3 h-3" />
                            Mark Settled
                          </button>
                        </>
                      )}
                      {cleanWa.length >= 8 && (
                        <a
                          href={`https://wa.me/${cleanWa}?text=${encodeURIComponent(
                            `Hello ${d.donorName}! Thank you from CBCMATERIALS.SHOP regarding your Learner Support Donation (${d.referenceCode} - $${d.amountUsd} USD).`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 text-white font-bold text-[11px] inline-flex items-center gap-1"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WhatsApp Donor
                        </a>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
