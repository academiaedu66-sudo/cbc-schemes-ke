'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  DatabaseBackup,
  Download,
  ExternalLink,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  event: string;
  ip: string;
  detail: string;
}

interface SecurityStatusPayload {
  require2faOnWebAdmin: boolean;
  securityPhones: [string, string];
  securityEmail: string;
  backupEmail: string;
  sessionEpoch: number;
  authenticator: { code: string; secondsRemaining: number };
  lockedIps: Array<{ ip: string; count: number; minutesLeft: number }>;
  lastBackupAt: string | null;
  lastBackupCloudPath: string | null;
  auditLog: SecurityAuditEvent[];
  deliveryStatus: {
    hasResendKey: boolean;
    resendFromEmail: string;
    hasAfricasTalkingKey: boolean;
    africasTalkingUsername: string;
    customEmailWebhookUrl: string;
    customSmsWebhookUrl: string;
  };
}

export default function AdminSecurityBackupPanel({
  password,
}: {
  password: string;
}) {
  const [status, setStatus] = useState<SecurityStatusPayload | null>(null);
  const [loading, setLoading] = useState(false);

  // Backup State
  const [backingUpEmail, setBackingUpEmail] = useState(false);
  const [downloadingBackup, setDownloadingBackup] = useState(false);
  const [backupResult, setBackupResult] = useState<{
    message: string;
    signedDownloadUrl?: string | null;
    emailSent?: boolean;
  } | null>(null);

  // Delivery Settings Form State
  const [showDeliverySettings, setShowDeliverySettings] = useState(false);
  const [showAuditLog, setShowAuditLog] = useState(false);
  const [resendApiKey, setResendApiKey] = useState('');
  const [resendFromEmail, setResendFromEmail] = useState('');
  const [africasTalkingUsername, setAfricasTalkingUsername] = useState('');
  const [africasTalkingApiKey, setAfricasTalkingApiKey] = useState('');
  const [savingConfig, setSavingConfig] = useState(false);
  const [actionMsg, setActionMsg] = useState('');

  const loadSecurityStatus = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/security', {
        headers: { 'x-admin-password': password },
      });
      if (res.ok) {
        const data = (await res.json()) as SecurityStatusPayload;
        setStatus(data);
        setResendFromEmail(
          data.deliveryStatus.resendFromEmail || 'CBC Security <onboarding@resend.dev>'
        );
        setAfricasTalkingUsername(data.deliveryStatus.africasTalkingUsername || '');
      }
    } catch {
      // Ignore transient error
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    loadSecurityStatus();
  }, [loadSecurityStatus]);

  const handleSendBackupToEmail = async () => {
    setBackingUpEmail(true);
    setBackupResult(null);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Backup failed');

      const msg = data.emailSent
        ? `Complete website backup (${data.counts.resourcesCount.toLocaleString()} materials, ${data.counts.ordersCount} orders) emailed to ${data.backupEmail}!`
        : `Cloud backup snapshot saved (${data.counts.resourcesCount.toLocaleString()} materials, ${data.counts.ordersCount} orders)! Click "Send via Gmail Compose" below or add a free Resend API key for 1-click automated delivery to ${data.backupEmail}.`;

      setBackupResult({
        message: msg,
        signedDownloadUrl: data.signedDownloadUrl,
        emailSent: data.emailSent,
      });
      await loadSecurityStatus();
    } catch (err: unknown) {
      setBackupResult({
        message: err instanceof Error ? err.message : 'Backup failed',
      });
    } finally {
      setBackingUpEmail(false);
    }
  };

  const handleDownloadBackupJson = async () => {
    setDownloadingBackup(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: { 'x-admin-password': password },
      });
      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cbc-website-backup-${new Date().toISOString().slice(0, 10)}.json`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      await loadSecurityStatus();
    } catch {
      setActionMsg('Failed to download backup file.');
    } finally {
      setDownloadingBackup(false);
    }
  };

  const handleRevokeAllSessions = async () => {
    if (
      !window.confirm(
        'Revoke ALL active admin sessions across every browser immediately?'
      )
    ) {
      return;
    }
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ action: 'revoke_sessions' }),
    });
    if (res.ok) {
      setActionMsg('All active web sessions revoked! Intruders forced out.');
      await loadSecurityStatus();
    }
  };

  const handleUnlockIps = async () => {
    await fetch('/api/admin/security', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ action: 'unlock_ips' }),
    });
    setActionMsg('Cleared IP lockouts.');
    await loadSecurityStatus();
  };

  const handleSaveDeliveryConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingConfig(true);
    setActionMsg('');
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'save_delivery_config',
          require2faOnWebAdmin: status?.require2faOnWebAdmin ?? true,
          resendApiKey,
          resendFromEmail,
          africasTalkingUsername,
          africasTalkingApiKey,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setResendApiKey('');
        setAfricasTalkingApiKey('');
        setActionMsg(data.message || 'Saved!');
        await loadSecurityStatus();
      }
    } finally {
      setSavingConfig(false);
    }
  };

  return (
    <section className="bg-slate-950 text-white border border-emerald-500/30 rounded-2xl p-6 shadow-lg space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-black uppercase tracking-tight text-white">
                Backend Anti-Hacker Shield, 2FA &amp; Auto-Backup Vault
              </h2>
              <span className="bg-emerald-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                PROTECTED
              </span>
              <span className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                AUTO-BACKUP ON
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              OTP Phones: <strong className="text-emerald-300">0728***160</strong> /{' '}
              <strong className="text-emerald-300">0705***072</strong> • 2FA &amp; Backup
              Email: <strong className="text-amber-300">aca*******55@gmail.com</strong> •
              Mobile Click Active
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowDeliverySettings((s) => !s)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            <Settings className="w-3.5 h-3.5 text-amber-400" />
            {showDeliverySettings ? 'Hide SMS/Email Keys' : 'OTP & Email Delivery Keys'}
          </button>
          <button
            type="button"
            onClick={() => setShowAuditLog((s) => !s)}
            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 px-3 py-2 rounded-xl text-xs font-bold text-slate-200 transition cursor-pointer"
          >
            <KeyRound className="w-3.5 h-3.5 text-emerald-400" />
            Audit Log ({status?.auditLog.length || 0})
          </button>
          <button
            type="button"
            onClick={loadSecurityStatus}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 cursor-pointer"
            title="Refresh Security Status"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 4 Security Pillars Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-emerald-400">
            <span>Edge Firewall</span>
            <Lock className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-black text-white">SQLi / XSS / Bot Blocker</p>
          <p className="text-[11px] text-slate-400">
            Auto-locks hacker IPs for 30 mins after 5 failed tries (
            {status?.lockedIps.length || 0} locked)
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-amber-300">
            <span>Security Phone OTP</span>
            <Phone className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-black text-white">0728***160 • 0705***072</p>
          <p className="text-[11px] text-slate-400">
            6-digit OTP + Mobile Authenticator code ({status?.authenticator.code || '------'})
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-sky-300">
            <span>2-Step &amp; Backup Email</span>
            <Mail className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-black text-white truncate">
            aca*******55@gmail.com
          </p>
          <p className="text-[11px] text-slate-400">
            {status?.deliveryStatus.hasResendKey
              ? 'Automated Email API Active ✓'
              : 'Auto-Vault + Cloud Link Active'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1">
          <div className="flex items-center justify-between text-[11px] font-bold uppercase text-purple-300">
            <span>Mobile Click 2FA</span>
            <Smartphone className="w-3.5 h-3.5" />
          </div>
          <p className="text-sm font-black text-white">1-Tap Phone Approval</p>
          <p className="text-[11px] text-slate-400">
            Approve or block sign-ins live inside <code>/mobile-admin</code>
          </p>
        </div>
      </div>

      {/* Backup & Panic Action Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2 text-xs font-black text-white uppercase">
            <DatabaseBackup className="w-4 h-4 text-amber-400" />
            Complete Website Data Backup
          </div>
          <p className="text-[11px] text-slate-400">
            Exports all 3,403+ curriculum materials, M-Pesa orders, tuition leads, gaming
            accounts &amp; monetization settings.
            {status?.lastBackupAt && (
              <span className="text-emerald-400 font-semibold">
                {' '}
                Last backup: {new Date(status.lastBackupAt).toLocaleString('en-KE')}
              </span>
            )}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            disabled={backingUpEmail}
            onClick={handleSendBackupToEmail}
            className="inline-flex items-center gap-1.5 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            {backingUpEmail ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Mail className="w-4 h-4" />
            )}
            Backup to academia.edu55@gmail.com
          </button>

          <button
            type="button"
            disabled={downloadingBackup}
            onClick={handleDownloadBackupJson}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-700 text-white font-black text-xs px-4 py-2.5 rounded-xl transition cursor-pointer"
          >
            {downloadingBackup ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            Download Backup File (.JSON)
          </button>

          <button
            type="button"
            onClick={handleRevokeAllSessions}
            className="inline-flex items-center gap-1.5 bg-rose-950 hover:bg-rose-900 border border-rose-700 text-rose-200 font-bold text-xs px-3.5 py-2.5 rounded-xl transition cursor-pointer"
          >
            <ShieldAlert className="w-4 h-4 text-rose-400" />
            Revoke All Sessions
          </button>

          {(status?.lockedIps.length || 0) > 0 && (
            <button
              type="button"
              onClick={handleUnlockIps}
              className="inline-flex items-center gap-1 bg-slate-800 hover:bg-slate-700 text-xs font-bold px-3 py-2.5 rounded-xl text-amber-300 cursor-pointer"
            >
              Unlock IPs ({status?.lockedIps.length})
            </button>
          )}
        </div>
      </div>

      {/* Backup Result Banner */}
      {backupResult && (
        <div className="bg-emerald-950/70 border border-emerald-500/40 rounded-xl p-3.5 text-xs space-y-2">
          <div className="flex items-start gap-2 text-emerald-200 font-semibold">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span>{backupResult.message}</span>
          </div>
          {backupResult.signedDownloadUrl && (
            <div className="flex flex-wrap items-center gap-3 pl-6">
              <a
                href={backupResult.signedDownloadUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-amber-300 font-black underline"
              >
                Open 7-Day Cloud Backup Download Link <ExternalLink className="w-3 h-3" />
              </a>
              <a
                href={`https://mail.google.com/mail/?view=cm&fs=1&to=academia.edu55@gmail.com&su=${encodeURIComponent(
                  'CBC Website Full Data Backup Snapshot'
                )}&body=${encodeURIComponent(
                  `Secure 7-Day Cloud Backup Download Link for CBC Hub:\n\n${backupResult.signedDownloadUrl}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 bg-white/10 hover:bg-white/20 text-white font-bold px-2.5 py-1 rounded-lg"
              >
                <Mail className="w-3 h-3" />
                Save Snapshot Link in Gmail (academia.edu55@gmail.com)
              </a>
            </div>
          )}
        </div>
      )}

      {actionMsg && (
        <div className="bg-slate-900 border border-emerald-500/40 text-emerald-300 text-xs font-bold px-3.5 py-2.5 rounded-xl">
          {actionMsg}
        </div>
      )}

      {/* Optional Automated Email / SMS Gateway Configuration */}
      {showDeliverySettings && (
        <form
          onSubmit={handleSaveDeliveryConfig}
          className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-4 text-xs"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <p className="font-black text-white text-sm">
                Automated Email (academia.edu55@gmail.com) &amp; SMS OTP (0728595160 /
                0705759072) Keys
              </p>
              <p className="text-slate-400">
                Mobile Click &amp; Mobile App Authenticator already work with zero setup!
                Add a free{' '}
                <a
                  href="https://resend.com"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-300 underline"
                >
                  Resend.com
                </a>{' '}
                or Africa&apos;s Talking key anytime for automatic inbox/SMS delivery.
              </p>
            </div>
            <label className="inline-flex items-center gap-2 bg-slate-950 border border-slate-700 px-3 py-1.5 rounded-xl font-bold text-emerald-300 cursor-pointer">
              <input
                type="checkbox"
                checked={status?.require2faOnWebAdmin ?? true}
                onChange={(e) =>
                  setStatus((prev) =>
                    prev
                      ? { ...prev, require2faOnWebAdmin: e.target.checked }
                      : prev
                  )
                }
              />
              Require 2FA on Web Admin
            </label>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Resend API Key {status?.deliveryStatus.hasResendKey ? '(Saved ✓)' : ''}
              </label>
              <input
                type="password"
                placeholder="re_xxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Sender Email Header
              </label>
              <input
                type="text"
                value={resendFromEmail}
                onChange={(e) => setResendFromEmail(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Africa&apos;s Talking Username
              </label>
              <input
                type="text"
                placeholder="e.g. sandbox or live_app"
                value={africasTalkingUsername}
                onChange={(e) => setAfricasTalkingUsername(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                Africa&apos;s Talking SMS Key{' '}
                {status?.deliveryStatus.hasAfricasTalkingKey ? '(Saved ✓)' : ''}
              </label>
              <input
                type="password"
                placeholder="atsk_xxxxxxxx"
                value={africasTalkingApiKey}
                onChange={(e) => setAfricasTalkingApiKey(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={savingConfig}
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-xl cursor-pointer"
          >
            {savingConfig ? 'Saving...' : 'Save Security & Delivery Settings'}
          </button>
        </form>
      )}

      {/* Live Security Audit Log */}
      {showAuditLog && (
        <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-2 max-h-64 overflow-y-auto text-xs">
          <p className="font-black uppercase text-slate-300">
            Recent Security &amp; Intrusion Events
          </p>
          {(status?.auditLog || []).length === 0 ? (
            <p className="text-slate-500">No security events logged yet.</p>
          ) : (
            status?.auditLog.map((ev) => (
              <div
                key={ev.id}
                className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2 last:border-0"
              >
                <div className="flex items-center gap-2">
                  {ev.event.includes('BLOCKED') ||
                  ev.event.includes('FAILED') ||
                  ev.event.includes('LOCKED') ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  )}
                  <span className="font-bold text-slate-200">{ev.detail}</span>
                </div>
                <span className="text-[11px] font-mono text-slate-400">
                  IP {ev.ip} • {new Date(ev.timestamp).toLocaleString('en-KE')}
                </span>
              </div>
            ))
          )}
        </div>
      )}
    </section>
  );
}
