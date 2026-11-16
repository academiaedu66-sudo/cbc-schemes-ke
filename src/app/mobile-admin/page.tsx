'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Activity,
  Check,
  CheckCircle2,
  Coins,
  Copy,
  Download,
  ExternalLink,
  Eye,
  EyeOff,
  GraduationCap,
  Lock,
  LogOut,
  Mail,
  MessageCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCheck,
  Users,
  Wallet,
  X,
  XCircle,
} from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

interface MobileOrderRow {
  id: string;
  checkout_request_id: string;
  phone_number: string;
  resource_id: string | null;
  resource_title: string;
  amount: number;
  mpesa_receipt_number?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}

interface MobileTuitionRow {
  id: string;
  referenceCode: string;
  role: 'LEARNER' | 'TEACHER';
  fullName: string;
  phone: string;
  county: string;
  learnerGrade?: string;
  subjects: string[];
  feeKes: number;
  paymentStatus: 'PENDING' | 'COMPLETED';
  mpesaReceipt?: string;
}

interface MobileGamingRedemption {
  id: string;
  referenceCode: string;
  phone: string;
  playerName: string;
  pointsDeducted: number;
  amountKes: number;
  status: 'PENDING' | 'PAID';
}

interface MobileMonetizationSummary {
  totalViews: number;
  totalImpressions: number;
  totalInteractions: number;
  totalClicks: number;
  byInteractionType: Record<string, number>;
  totalEstimatedKes: number;
  totalEstimatedUsd: number;
  todayEstimatedKes: number;
  ctrPercent: number;
}

const STORAGE_AUTH_KEY = 'cbc_mobile_admin_credentials_v1';

function formatShortTime(iso?: string): string {
  if (!iso) return '';
  try {
    const d = new Date(iso);
    return d.toLocaleString('en-KE', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return '';
  }
}

export default function MobileAdminAppPage() {
  // Auth State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [authenticated, setAuthenticated] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(false);
  const [authError, setAuthError] = useState('');

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [showIosGuide, setShowIosGuide] = useState(false);

  // App Navigation & Data State
  const [activeTab, setActiveTab] = useState<
    'APPROVE' | 'WALLET' | 'LEADS' | 'TRAFFIC'
  >('APPROVE');
  const [orderFilter, setOrderFilter] = useState<
    'PENDING' | 'COMPLETED' | 'ALL' | 'FAILED'
  >('PENDING');
  const [verifySearch, setVerifySearch] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const [orders, setOrders] = useState<MobileOrderRow[]>([]);
  const [tuitionLeads, setTuitionLeads] = useState<MobileTuitionRow[]>([]);
  const [redemptions, setRedemptions] = useState<MobileGamingRedemption[]>([]);
  const [monetization, setMonetization] =
    useState<MobileMonetizationSummary | null>(null);

  const [syncing, setSyncing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const prevPendingCountRef = useRef<number | null>(null);

  // Register PWA Service Worker & Capture Install Prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/admin-sw.js', { scope: '/mobile-admin' })
        .catch(() => {});
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((curr) => (curr === msg ? '' : curr));
    }, 3200);
  };

  const fetchAllMobileData = useCallback(
    async (authEmail: string, authPw: string) => {
      if (!authEmail || !authPw) return false;
      setSyncing(true);
      const headers = {
        'x-admin-email': authEmail.trim(),
        'x-admin-password': authPw.trim(),
      };

      try {
        const [ordRes, monRes, tuiRes, gamRes] = await Promise.all([
          fetch('/api/admin/orders', { headers }),
          fetch('/api/monetization/track', { headers }),
          fetch('/api/tuition?admin=1', { headers }),
          fetch('/api/gaming?admin=1', { headers }),
        ]);

        if (ordRes.status === 401) {
          setAuthenticated(false);
          localStorage.removeItem(STORAGE_AUTH_KEY);
          return false;
        }

        if (ordRes.ok) {
          const ordJson = await ordRes.json();
          const list: MobileOrderRow[] = ordJson.orders || [];
          setOrders(list);

          const pendingCount = list.filter((o) => o.status === 'PENDING').length;
          if (
            prevPendingCountRef.current !== null &&
            pendingCount > prevPendingCountRef.current
          ) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([180, 90, 180]);
            }
            showToast(
              `New pending M-Pesa transaction! (${pendingCount} awaiting approval)`
            );
          }
          prevPendingCountRef.current = pendingCount;

          // Auto-switch to ALL if 0 pending on very first load so screen isn't empty
          if (prevPendingCountRef.current === 0 && list.length > 0 && pendingCount === 0) {
            // Keep filter user-controlled after initial check
          }
        }

        if (monRes.ok) {
          const monJson = await monRes.json();
          if (monJson.stats && monJson.earnings) {
            setMonetization({
              totalViews: monJson.stats.totalViews || 0,
              totalImpressions: monJson.stats.totalImpressions || 0,
              totalInteractions: monJson.stats.totalInteractions || 0,
              totalClicks: monJson.stats.totalClicks || 0,
              byInteractionType: monJson.stats.byInteractionType || {},
              totalEstimatedKes: monJson.earnings.totalEstimatedKes || 0,
              totalEstimatedUsd: monJson.earnings.totalEstimatedUsd || 0,
              todayEstimatedKes: monJson.earnings.todayEstimatedKes || 0,
              ctrPercent: monJson.earnings.ctrPercent || 0,
            });
          }
        }

        if (tuiRes.ok) {
          const tuiJson = await tuiRes.json();
          const liveRegs = ((tuiJson.registrations || []) as MobileTuitionRow[]).filter(
            (r) => !r.id.startsWith('seed-')
          );
          setTuitionLeads(liveRegs);
        }

        if (gamRes.ok) {
          const gamJson = await gamRes.json();
          setRedemptions(gamJson.redemptions || []);
        }

        return true;
      } catch {
        return false;
      } finally {
        setSyncing(false);
      }
    },
    []
  );

  // Restore saved mobile session if present
  useEffect(() => {
    try {
      const savedRaw =
        localStorage.getItem(STORAGE_AUTH_KEY) ||
        sessionStorage.getItem(STORAGE_AUTH_KEY);
      if (!savedRaw) return;
      const saved = JSON.parse(savedRaw) as { email: string; password: string };
      if (saved.email && saved.password) {
        setEmail(saved.email);
        setPassword(saved.password);
        setCheckingAuth(true);
        fetch('/api/admin/mobile-auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(saved),
        })
          .then((r) => r.json().then((d) => ({ ok: r.ok, d })))
          .then(async ({ ok }) => {
            if (ok) {
              setAuthenticated(true);
              sessionStorage.setItem('cbc_admin_pw', saved.password);
              await fetchAllMobileData(saved.email, saved.password);
            } else {
              localStorage.removeItem(STORAGE_AUTH_KEY);
              sessionStorage.removeItem(STORAGE_AUTH_KEY);
            }
          })
          .catch(() => {})
          .finally(() => setCheckingAuth(false));
      }
    } catch {}
  }, [fetchAllMobileData]);

  // Live 6-second auto-sync while authenticated
  useEffect(() => {
    if (!authenticated || !email || !password) return;
    const timer = window.setInterval(() => {
      fetchAllMobileData(email, password);
    }, 6000);
    return () => window.clearInterval(timer);
  }, [authenticated, email, password, fetchAllMobileData]);

  const handleMobileLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');
    setCheckingAuth(true);

    try {
      const res = await fetch('/api/admin/mobile-auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAuthError(data.error || 'Invalid email or password.');
        return;
      }

      const payload = JSON.stringify({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      });
      if (rememberDevice) {
        localStorage.setItem(STORAGE_AUTH_KEY, payload);
      } else {
        sessionStorage.setItem(STORAGE_AUTH_KEY, payload);
      }
      sessionStorage.setItem('cbc_admin_pw', password.trim());

      setAuthenticated(true);
      await fetchAllMobileData(email.trim().toLowerCase(), password.trim());
    } catch {
      setAuthError('Network error signing in. Check your connection.');
    } finally {
      setCheckingAuth(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem(STORAGE_AUTH_KEY);
    sessionStorage.removeItem(STORAGE_AUTH_KEY);
    sessionStorage.removeItem('cbc_admin_pw');
    setAuthenticated(false);
    setPassword('');
  };

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      await deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setDeferredPrompt(null);
      }
    } else {
      setShowIosGuide(true);
    }
  };

  const handleOrderDecision = async (
    orderId: string,
    status: 'COMPLETED' | 'FAILED'
  ) => {
    setUpdatingOrderId(orderId);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email.trim(),
          'x-admin-password': password.trim(),
        },
        body: JSON.stringify({ id: orderId, status }),
      });

      if (res.ok) {
        showToast(
          status === 'COMPLETED'
            ? 'Approved! Customer download/service unlocked.'
            : 'Transaction marked as rejected.'
        );
        await fetchAllMobileData(email, password);
      }
    } catch {
      showToast('Failed to update transaction.');
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSendWhatsAppToCustomer = async (order: MobileOrderRow) => {
    const cleanPhone = order.phone_number.replace(/^\+/, '').replace(/\D/g, '');
    const intlPhone = cleanPhone.startsWith('0')
      ? `254${cleanPhone.slice(1)}`
      : cleanPhone;

    if (order.resource_id) {
      try {
        const res = await fetch(
          `/api/admin/orders?signedResourceId=${encodeURIComponent(order.resource_id)}`,
          {
            headers: {
              'x-admin-email': email.trim(),
              'x-admin-password': password.trim(),
            },
          }
        );
        const data = await res.json();
        if (res.ok && data.downloadUrl) {
          const msg = `Hello! Your M-Pesa payment (KES ${order.amount}) for "${order.resource_title}" is verified ✅.\n\nDownload your file directly here:\n${data.downloadUrl}`;
          window.open(
            `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`,
            '_blank'
          );
          return;
        }
      } catch {}
    }

    const msg = `Hello! Your M-Pesa payment (KES ${order.amount}) for "${order.resource_title}" (${order.mpesa_receipt_number || 'Confirmed'}) has been verified and approved ✅.`;
    window.open(
      `https://wa.me/${intlPhone}?text=${encodeURIComponent(msg)}`,
      '_blank'
    );
  };

  const handleMarkGamingRedemptionPaid = async (id: string) => {
    await fetch('/api/gaming', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': email.trim(),
        'x-admin-password': password.trim(),
      },
      body: JSON.stringify({ id }),
    });
    showToast('Gaming reward marked PAID.');
    await fetchAllMobileData(email, password);
  };

  const pendingOrders = useMemo(
    () => orders.filter((o) => o.status === 'PENDING'),
    [orders]
  );
  const completedOrders = useMemo(
    () => orders.filter((o) => o.status === 'COMPLETED'),
    [orders]
  );
  const totalMpesaKes = useMemo(
    () =>
      completedOrders.reduce((sum, o) => sum + (Number(o.amount) || 0), 0),
    [completedOrders]
  );

  const visibleOrders = useMemo(() => {
    const q = verifySearch.trim().toLowerCase();
    return orders.filter((o) => {
      if (!q && orderFilter !== 'ALL' && o.status !== orderFilter) return false;
      if (!q) return true;
      return (
        (o.mpesa_receipt_number || '').toLowerCase().includes(q) ||
        (o.phone_number || '').toLowerCase().includes(q) ||
        (o.resource_title || '').toLowerCase().includes(q) ||
        (o.checkout_request_id || '').toLowerCase().includes(q)
      );
    });
  }, [orders, orderFilter, verifySearch]);

  const pendingGamingClaims = redemptions.filter((r) => r.status === 'PENDING');
  const totalLeadsBadge = tuitionLeads.length + pendingGamingClaims.length;

  // =========================================================================
  // MOBILE LOGIN SCREEN (EMAIL + PASSWORD)
  // =========================================================================
  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-5 select-none">
        <div className="max-w-sm w-full mx-auto pt-8 space-y-6">
          {/* App Icon & Brand */}
          <div className="text-center space-y-2">
            <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-emerald-500 to-emerald-800 border-2 border-amber-400/60 flex items-center justify-center mx-auto shadow-xl">
              <ShieldCheck className="w-9 h-9 text-white" />
            </div>
            <span className="inline-block text-[10px] font-black uppercase tracking-widest bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-0.5 rounded-full">
              Admin Mobile App
            </span>
            <h1 className="text-2xl font-black tracking-tight">
              CBC Hub Mobile Admin
            </h1>
            <p className="text-xs text-slate-400">
              Fast M-Pesa transaction verification, 1-tap approvals &amp; live site
              revenue tracking
            </p>
          </div>

          {/* Login Card */}
          <form
            onSubmit={handleMobileLogin}
            className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-2xl"
          >
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="academia.edu66@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3.5" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="Enter admin password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-11 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-white p-0.5"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <label className="flex items-center gap-2.5 text-xs text-slate-300 cursor-pointer pt-0.5">
              <input
                type="checkbox"
                checked={rememberDevice}
                onChange={(e) => setRememberDevice(e.target.checked)}
                className="rounded border-slate-600 bg-slate-950 text-emerald-500"
              />
              <span>Keep me signed in on this phone</span>
            </label>

            {authError && (
              <div className="bg-rose-950/80 border border-rose-700 text-rose-200 text-xs font-semibold rounded-xl p-3">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={checkingAuth}
              className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
            >
              {checkingAuth ? 'Signing In...' : 'Sign In to Mobile App'}
            </button>
          </form>

          {/* Install to Home Screen Card */}
          <button
            type="button"
            onClick={handleInstallApp}
            className="w-full bg-slate-900/80 hover:bg-slate-900 border border-amber-400/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-left transition cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-black text-white">
                  Install App on Phone Home Screen
                </p>
                <p className="text-[11px] text-slate-400">
                  Works like a native Android &amp; iPhone app
                </p>
              </div>
            </div>
            <Smartphone className="w-4 h-4 text-amber-300 shrink-0" />
          </button>

          {showIosGuide && (
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
              <div className="flex items-center justify-between">
                <strong className="text-amber-300">How to Add to Home Screen:</strong>
                <button
                  type="button"
                  onClick={() => setShowIosGuide(false)}
                  className="text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p>
                • <strong>Android (Chrome):</strong> Tap the <strong>⋮ Menu</strong>{' '}
                (top-right) &rarr; tap <strong>Install App</strong> or{' '}
                <strong>Add to Home screen</strong>.
              </p>
              <p>
                • <strong>iPhone (Safari):</strong> Tap the <strong>Share</strong> icon
                (bottom) &rarr; tap <strong>Add to Home Screen</strong>.
              </p>
            </div>
          )}
        </div>

        <div className="text-center pb-4">
          <Link href="/" className="text-xs text-slate-500 hover:text-slate-300">
            ← Back to Public Storefront
          </Link>
        </div>
      </div>
    );
  }

  // =========================================================================
  // AUTHENTICATED MOBILE ADMIN APP SHELL
  // =========================================================================
  const combinedTotalKes =
    totalMpesaKes + (monetization?.totalEstimatedKes || 0);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 pb-24">
      {/* Sticky Mobile App Top Bar */}
      <header className="sticky top-0 z-30 bg-slate-950/95 backdrop-blur border-b border-slate-800 px-4 py-3.5">
        <div className="max-w-lg mx-auto flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-black tracking-tight text-white truncate">
                  CBC Admin Mobile
                </h1>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              </div>
              <p className="text-[10px] text-slate-400 truncate">{email}</p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {deferredPrompt && (
              <button
                type="button"
                onClick={handleInstallApp}
                className="bg-amber-400 text-slate-950 text-[10px] font-black px-2.5 py-1.5 rounded-xl flex items-center gap-1"
              >
                <Download className="w-3 h-3" />
                Install
              </button>
            )}
            <button
              type="button"
              onClick={() => fetchAllMobileData(email, password)}
              aria-label="Sync now"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 active:scale-95 transition"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin text-emerald-400' : ''}`} />
            </button>
            <button
              type="button"
              onClick={handleSignOut}
              aria-label="Sign out"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-rose-400 active:scale-95 transition"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast Notification */}
      {toastMsg && (
        <div className="fixed top-16 inset-x-4 max-w-md mx-auto z-40 bg-emerald-500 text-slate-950 font-black text-xs px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Main Mobile Container */}
      <main className="max-w-lg mx-auto px-4 py-4 space-y-4">
        {/* ================================================================= */}
        {/* TAB 1: VERIFY & APPROVE TRANSACTIONS                              */}
        {/* ================================================================= */}
        {activeTab === 'APPROVE' && (
          <div className="space-y-4">
            {/* Quick Summary Banner */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-amber-500/30 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-amber-300">
                  Awaiting Approval
                </span>
                <p className="text-2xl font-black text-white mt-0.5">
                  {pendingOrders.length}
                </p>
              </div>
              <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-3.5">
                <span className="text-[10px] font-bold uppercase text-emerald-300">
                  Verified M-Pesa Sales
                </span>
                <p className="text-2xl font-black text-emerald-400 mt-0.5">
                  KES {totalMpesaKes.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Instant M-Pesa Code / Phone Verifier Search */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
              <input
                type="text"
                placeholder="Verify M-Pesa code (e.g. SJK84M2P9Q) or 07XX..."
                value={verifySearch}
                onChange={(e) => setVerifySearch(e.target.value)}
                className="w-full pl-10 pr-9 py-3 rounded-2xl bg-slate-900 border border-slate-700 text-xs sm:text-sm text-white font-mono placeholder:font-sans placeholder:text-slate-500 focus:outline-none focus:border-amber-400"
              />
              {verifySearch && (
                <button
                  type="button"
                  onClick={() => setVerifySearch('')}
                  className="absolute right-3 top-3 text-slate-400"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filter Chips */}
            <div className="grid grid-cols-4 gap-1.5 bg-slate-900 p-1 rounded-2xl border border-slate-800">
              {(
                [
                  { key: 'PENDING', label: `Pending (${pendingOrders.length})` },
                  { key: 'COMPLETED', label: `Approved` },
                  { key: 'ALL', label: `All (${orders.length})` },
                  { key: 'FAILED', label: `Rejected` },
                ] as const
              ).map((tabItem) => (
                <button
                  key={tabItem.key}
                  type="button"
                  onClick={() => setOrderFilter(tabItem.key)}
                  className={`py-2 rounded-xl text-[11px] font-black transition ${
                    orderFilter === tabItem.key
                      ? 'bg-emerald-500 text-slate-950'
                      : 'text-slate-400'
                  }`}
                >
                  {tabItem.label}
                </button>
              ))}
            </div>

            {/* Transaction Cards */}
            {visibleOrders.length === 0 ? (
              <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-emerald-500/70 mx-auto" />
                <p className="text-sm font-bold text-slate-200">
                  {verifySearch
                    ? `No transaction matches "${verifySearch.toUpperCase()}"`
                    : orderFilter === 'PENDING'
                    ? 'All caught up! Zero pending approvals.'
                    : 'No transactions in this tab yet.'}
                </p>
                {orderFilter === 'PENDING' && orders.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setOrderFilter('ALL')}
                    className="text-xs font-bold text-amber-300 underline"
                  >
                    View all {orders.length} past transactions
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {visibleOrders.map((order) => {
                  const isBusy = updatingOrderId === order.id;
                  const code =
                    order.mpesa_receipt_number ||
                    order.checkout_request_id.replace(/^MANUAL_/, '').slice(0, 12);

                  return (
                    <div
                      key={order.id}
                      className={`rounded-3xl border p-4 space-y-3 ${
                        order.status === 'PENDING'
                          ? 'bg-slate-900 border-amber-400/50 shadow-lg'
                          : order.status === 'COMPLETED'
                          ? 'bg-slate-900/70 border-emerald-500/30'
                          : 'bg-slate-900/40 border-slate-800 opacity-75'
                      }`}
                    >
                      {/* Top Row: Receipt + Amount */}
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                                order.status === 'PENDING'
                                  ? 'bg-amber-400 text-slate-950'
                                  : order.status === 'COMPLETED'
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                  : 'bg-rose-500/20 text-rose-300'
                              }`}
                            >
                              {order.status}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {formatShortTime(order.created_at)}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 pt-0.5">
                            <span className="font-mono font-black text-base tracking-wider text-amber-300">
                              {code}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard?.writeText(code);
                                setCopiedId(order.id);
                                setTimeout(() => setCopiedId(null), 1500);
                              }}
                              className="text-slate-400 hover:text-white"
                            >
                              {copiedId === order.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className="text-lg font-black text-white">
                            KES {order.amount}
                          </span>
                          <p className="font-mono text-xs text-emerald-300">
                            {order.phone_number}
                          </p>
                        </div>
                      </div>

                      {/* Item Title */}
                      <p className="text-xs text-slate-300 font-medium leading-snug bg-slate-950/70 rounded-xl px-3 py-2 border border-slate-800/80">
                        {order.resource_title}
                      </p>

                      {/* Thumb Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        {order.status !== 'COMPLETED' ? (
                          <>
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleOrderDecision(order.id, 'COMPLETED')
                              }
                              className="bg-emerald-500 hover:bg-emerald-400 active:scale-[0.98] disabled:bg-slate-700 text-slate-950 font-black text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <Check className="w-4 h-4 stroke-[3]" />
                              <span>Approve &amp; Unlock</span>
                            </button>

                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() =>
                                handleOrderDecision(order.id, 'FAILED')
                              }
                              className="bg-rose-950 hover:bg-rose-900 border border-rose-700/60 text-rose-200 font-bold text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                            >
                              <XCircle className="w-4 h-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleSendWhatsAppToCustomer(order)}
                            className="col-span-2 bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs py-3 px-3 rounded-2xl flex items-center justify-center gap-1.5 transition cursor-pointer"
                          >
                            <MessageCircle className="w-4 h-4" />
                            <span>Send Download / Receipt on WhatsApp</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 2: WALLET & OVERVIEW                                          */}
        {/* ================================================================= */}
        {activeTab === 'WALLET' && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-900 rounded-3xl p-5 space-y-2 shadow-xl border border-emerald-400/30">
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                Total Combined Site Earnings
              </span>
              <p className="text-3xl font-black text-white">
                KES {combinedTotalKes.toLocaleString()}
              </p>
              <p className="text-xs text-emerald-100">
                M-Pesa Sales (0728595160):{' '}
                <strong>KES {totalMpesaKes.toLocaleString()}</strong> • Ad/Click Coin:{' '}
                <strong>
                  KES {(monetization?.totalEstimatedKes || 0).toLocaleString()}
                </strong>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Completed Orders
                </span>
                <p className="text-xl font-black text-white">
                  {completedOrders.length}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Today&apos;s Ad Coin
                </span>
                <p className="text-xl font-black text-amber-300">
                  KES {(monetization?.todayEstimatedKes || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Tuition Registrations
                </span>
                <p className="text-xl font-black text-sky-300">
                  {tuitionLeads.length}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-1">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Gaming Claims Pending
                </span>
                <p className="text-xl font-black text-amber-400">
                  {pendingGamingClaims.length}
                </p>
              </div>
            </div>

            {/* Quick Links to Full Desktop Studios */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
              <p className="text-xs font-black uppercase text-slate-400">
                Quick Portal Shortcuts
              </p>
              <Link
                href="/monetization"
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-amber-300"
              >
                <span>Open Full Monetization Control Studio</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href="/admin"
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-emerald-300"
              >
                <span>Open Desktop Materials Upload Studio</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
              <Link
                href="/"
                className="flex items-center justify-between bg-slate-950 border border-slate-800 rounded-2xl px-4 py-3 text-xs font-bold text-slate-300"
              >
                <span>View Public Storefront</span>
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 3: LEADS (TUITION MATCHING + GAMING KSh 5 CLAIMS)             */}
        {/* ================================================================= */}
        {activeTab === 'LEADS' && (
          <div className="space-y-5">
            {/* Gaming 1,000 Pts -> KSh 5 Claims */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                <Trophy className="w-4 h-4" />
                Gaming KSh 5 Reward Claims ({pendingGamingClaims.length} Pending)
              </h2>

              {redemptions.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 text-center">
                  No 1,000-point gaming claims submitted yet.
                </div>
              ) : (
                redemptions.slice(0, 15).map((r) => (
                  <div
                    key={r.id}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex items-center justify-between gap-3"
                  >
                    <div>
                      <span className="font-mono text-xs font-black text-amber-300">
                        {r.referenceCode} • KSh {r.amountKes}
                      </span>
                      <p className="text-xs font-bold text-white mt-0.5">
                        {r.playerName} ({r.phone})
                      </p>
                      <p className="text-[11px] text-slate-400">
                        {r.pointsDeducted.toLocaleString()} pts redeemed
                      </p>
                    </div>
                    {r.status === 'PAID' ? (
                      <span className="text-[10px] font-black bg-emerald-500/20 text-emerald-300 px-2.5 py-1 rounded-full">
                        PAID
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => handleMarkGamingRedemptionPaid(r.id)}
                        className="bg-emerald-500 text-slate-950 font-black text-xs px-3.5 py-2 rounded-xl"
                      >
                        Mark Paid
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Personal & Holiday Tuition Registrations */}
            <div className="space-y-2.5">
              <h2 className="text-xs font-black uppercase tracking-wider text-sky-300 flex items-center gap-1.5">
                <Users className="w-4 h-4" />
                Holiday &amp; Personal Tuition Registrations ({tuitionLeads.length})
              </h2>

              {tuitionLeads.length === 0 ? (
                <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-5 text-xs text-slate-400 text-center">
                  New student (KSh 1,000) &amp; teacher (KSh 500) registrations appear
                  here automatically.
                </div>
              ) : (
                tuitionLeads.map((t) => {
                  const cleanIntl = t.phone.replace(/^\+/, '');
                  return (
                    <div
                      key={t.id}
                      className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${
                            t.role === 'LEARNER'
                              ? 'bg-amber-400 text-slate-950'
                              : 'bg-sky-400 text-slate-950'
                          }`}
                        >
                          {t.role === 'LEARNER' ? (
                            <GraduationCap className="w-3 h-3" />
                          ) : (
                            <UserCheck className="w-3 h-3" />
                          )}
                          {t.role === 'LEARNER'
                            ? `STUDENT (G${t.learnerGrade || ''})`
                            : 'TEACHER'}{' '}
                          • {t.referenceCode}
                        </span>
                        <span className="text-xs font-black text-emerald-400">
                          KSh {t.feeKes} ({t.mpesaReceipt || t.paymentStatus})
                        </span>
                      </div>
                      <p className="text-sm font-black text-white">
                        {t.fullName} • <span className="font-mono text-xs text-slate-300">{t.phone}</span>
                      </p>
                      <p className="text-xs text-slate-400">
                        <strong>{t.county}</strong> — {t.subjects.join(', ')}
                      </p>
                      <a
                        href={`https://wa.me/${cleanIntl}?text=${encodeURIComponent(
                          `Hello ${t.fullName}! Messaging from CBC Hub Tuition Coordinator (0705759072) regarding your ${t.referenceCode} registration.`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-full inline-flex items-center justify-center gap-1.5 bg-emerald-600 text-white font-black text-xs py-2.5 rounded-xl"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        Chat on WhatsApp
                      </a>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 4: TRAFFIC & MONETIZATION                                     */}
        {/* ================================================================= */}
        {activeTab === 'TRAFFIC' && (
          <div className="space-y-4">
            <div className="bg-slate-900 border border-amber-400/40 rounded-3xl p-5 space-y-1">
              <span className="text-[10px] font-black uppercase text-amber-300">
                Monetization Coin Earned (Clicks + Views + Interactions)
              </span>
              <p className="text-2xl font-black text-white">
                KES {(monetization?.totalEstimatedKes || 0).toLocaleString()}
              </p>
              <p className="text-xs text-slate-400">
                ${(monetization?.totalEstimatedUsd || 0).toFixed(2)} USD • CTR:{' '}
                {monetization?.ctrPercent || 0}%
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Page Views
                </span>
                <p className="text-xl font-black text-white mt-0.5">
                  {(monetization?.totalViews || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Ad Views
                </span>
                <p className="text-xl font-black text-blue-400 mt-0.5">
                  {(monetization?.totalImpressions || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Ad &amp; Hub Clicks
                </span>
                <p className="text-xl font-black text-emerald-400 mt-0.5">
                  {(monetization?.totalClicks || 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4">
                <span className="text-[10px] font-bold uppercase text-slate-400">
                  Interactions
                </span>
                <p className="text-xl font-black text-purple-400 mt-0.5">
                  {(monetization?.totalInteractions || 0).toLocaleString()}
                </p>
              </div>
            </div>

            {monetization &&
              Object.keys(monetization.byInteractionType).length > 0 && (
                <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-2.5">
                  <p className="text-xs font-black uppercase text-slate-400">
                    Top Site Interactions
                  </p>
                  {Object.entries(monetization.byInteractionType)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 8)
                    .map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between text-xs border-b border-slate-800/70 pb-1.5 last:border-0"
                      >
                        <span className="text-slate-300 truncate pr-2">
                          {k.replace(/_/g, ' ')}
                        </span>
                        <span className="font-mono font-black text-emerald-400">
                          {v.toLocaleString()}
                        </span>
                      </div>
                    ))}
                </div>
              )}
          </div>
        )}
      </main>

      {/* Fixed Native-Style Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-2 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-4 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('APPROVE')}
            className={`relative py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'APPROVE'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-black">Approve</span>
            {pendingOrders.length > 0 && (
              <span className="absolute top-1 right-4 bg-rose-500 text-white text-[9px] font-black px-1.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WALLET')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'WALLET'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[10px] font-black">Wallet</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('LEADS')}
            className={`relative py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'LEADS'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-black">Leads</span>
            {totalLeadsBadge > 0 && (
              <span className="absolute top-1 right-4 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 rounded-full">
                {totalLeadsBadge}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRAFFIC')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${
              activeTab === 'TRAFFIC'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
            }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[10px] font-black">Traffic</span>
          </button>
        </div>
      </nav>
    </div>
  );
}
