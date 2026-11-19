'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import MobileSocialAutoPoster from '@/components/MobileSocialAutoPoster';
import WhatsAppStatusAutoPanel from '@/components/WhatsAppStatusAutoPanel';
import OmnichannelSocialSeoPanel from '@/components/OmnichannelSocialSeoPanel';
import AdminCustomersVaultPanel from '@/components/AdminCustomersVaultPanel';
import {
  Activity,
  ArrowUpRight,
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
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Trophy,
  UserCheck,
  Users,
  Volume2,
  VolumeX,
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

interface MobileChallengePrompt {
  challengeId: string;
  matchNumber: number;
  targetPhone: string;
  targetEmail: string;
  requesterIp: string;
  userAgent: string;
  portal: string;
  createdAt: number;
  expiresAt: number;
}

interface MobileSecurityPayload {
  securityPhones: [string, string];
  securityEmail: string;
  backupEmail: string;
  pendingChallenges: MobileChallengePrompt[];
  authenticator: { code: string; secondsRemaining: number };
  lockedIps: Array<{ ip: string; count: number; minutesLeft: number }>;
  lastBackupAt: string | null;
  auditLog: Array<{
    id: string;
    timestamp: string;
    event: string;
    ip: string;
    detail: string;
  }>;
}

interface MobilePurchaseAttempt {
  id: string;
  timestamp: string;
  channel: string;
  itemTitle: string;
  amountKes: number;
  buyerPhone?: string;
  stage: 'OPENED_CHECKOUT' | 'SUBMITTED_PAYMENT';
}

interface MobileWithdrawalRecord {
  id: string;
  referenceCode: string;
  amountKes: number;
  fromClientPaymentsKes: number;
  fromMonetizationKes: number;
  source: 'COMBINED' | 'CLIENT_PAYMENTS' | 'MONETIZATION';
  method: 'MPESA' | 'BANK';
  destination: string;
  status: 'COMPLETED' | 'PENDING_SETTLEMENT' | 'CANCELLED';
  gatewayDisbursed: boolean;
  gatewayMessage: string;
  createdAt: string;
}

interface MobileWalletOverview {
  clientPaymentsGrossKes: number;
  monetizationGrossKes: number;
  totalGrossEarnedKes: number;
  clientPaymentsWithdrawnKes: number;
  monetizationWithdrawnKes: number;
  totalWithdrawnKes: number;
  availableClientPaymentsKes: number;
  availableMonetizationKes: number;
  availableTotalKes: number;
  completedOrdersCount: number;
  liveB2cReady: boolean;
  hasPaystackKey?: boolean;
  hasPayheroToken?: boolean;
  payheroAccountId?: string;
  payheroChannelId: string;
  adNetworkConnected: boolean;
  adNetworkProvider: 'monetag' | 'adsterra' | 'custom';
  adNetworkScriptUrl: string;
  smartlinkUrl: string;
  adsenseClientId: string;
  defaultMpesaPhone: string;
  withdrawals: MobileWithdrawalRecord[];
}

interface MobileCustomerSensorEvent {
  id: string;
  timestamp: string;
  sourceLabel: string;
  keywordCluster: string;
  searchQuery?: string;
  landingPath: string;
  deviceSummary: string;
}

const PINCHEZ_SPOKEN_GREETING =
  'Hello senior counsel Pinchez. Please check money.';

const PROFESSOR_CUSTOMER_GREETING = 'New customer is here PROFESSOR';

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
    'APPROVE' | 'WALLET' | 'LEADS' | 'TRAFFIC' | 'SECURITY'
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
  const [securityData, setSecurityData] =
    useState<MobileSecurityPayload | null>(null);
  const [purchaseAttempts, setPurchaseAttempts] = useState<
    MobilePurchaseAttempt[]
  >([]);
  const [totalPurchaseAttempts, setTotalPurchaseAttempts] = useState(0);
  const [customerSensorFeed, setCustomerSensorFeed] = useState<
    MobileCustomerSensorEvent[]
  >([]);
  const [totalCustomersDetected, setTotalCustomersDetected] = useState(0);
  const [walletOverview, setWalletOverview] =
    useState<MobileWalletOverview | null>(null);
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [withdrawSource, setWithdrawSource] = useState<
    'COMBINED' | 'CLIENT_PAYMENTS' | 'MONETIZATION'
  >('COMBINED');
  const [withdrawMethod, setWithdrawMethod] = useState<'MPESA' | 'BANK'>(
    'MPESA'
  );
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [withdrawDest, setWithdrawDest] = useState('0728595160');
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawFeedback, setWithdrawFeedback] = useState<{
    ok: boolean;
    text: string;
  } | null>(null);
  // In-App Real Money Linker (PayHero B2C + Monetag/Adsterra/AdSense)
  const [showRealMoneyLinker, setShowRealMoneyLinker] = useState(false);
  const [linkPaystackSecret, setLinkPaystackSecret] = useState('');
  const [linkPayheroAccountId, setLinkPayheroAccountId] = useState('');
  const [linkPayheroChannelId, setLinkPayheroChannelId] = useState('');
  const [linkPayheroToken, setLinkPayheroToken] = useState('');
  const [linkAdProvider, setLinkAdProvider] = useState<
    'monetag' | 'adsterra' | 'custom'
  >('monetag');
  const [linkAdScriptUrl, setLinkAdScriptUrl] = useState('');
  const [linkSmartlinkUrl, setLinkSmartlinkUrl] = useState('');
  const [linkAdsenseId, setLinkAdsenseId] = useState('');
  const [savingRealLinks, setSavingRealLinks] = useState(false);
  const linkerHydratedRef = useRef<boolean>(false);
  const [voiceAlertEnabled, setVoiceAlertEnabled] = useState(true);
  const [resolvingChallengeId, setResolvingChallengeId] = useState<string | null>(
    null
  );
  const [backingUpMobile, setBackingUpMobile] = useState(false);

  const [syncing, setSyncing] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [toastMsg, setToastMsg] = useState('');
  const prevPendingCountRef = useRef<number | null>(null);
  const prevChallengeCountRef = useRef<number | null>(null);
  const lastSeenAttemptIdRef = useRef<string | null | undefined>(undefined);
  const lastSeenCustomerIdRef = useRef<string | null | undefined>(undefined);
  const voiceEnabledRef = useRef<boolean>(true);
  const alertAudioRef = useRef<HTMLAudioElement | null>(null);
  const professorAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioUnlockedRef = useRef<boolean>(false);

  useEffect(() => {
    voiceEnabledRef.current = voiceAlertEnabled;
  }, [voiceAlertEnabled]);

  // Preload "/pinchez-check-money.wav" & unlock mobile audio on first screen tap
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const audio = new Audio('/pinchez-check-money.wav');
    audio.preload = 'auto';
    audio.volume = 1.0;
    alertAudioRef.current = audio;

    const profAudio = new Audio('/audio/new-customer-professor.mp3');
    profAudio.preload = 'auto';
    profAudio.volume = 1.0;
    professorAudioRef.current = profAudio;

    const unlockOnGesture = () => {
      if (audioUnlockedRef.current) return;
      audioUnlockedRef.current = true;
      try {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (AudioCtx) {
          const ctx = new AudioCtx();
          ctx.resume().catch(() => { });
        }
        // Prime speechSynthesis & audio element silently
        if ('speechSynthesis' in window) {
          window.speechSynthesis.getVoices();
        }
        if (alertAudioRef.current) {
          alertAudioRef.current.load();
        }
      } catch { }
    };

    window.addEventListener('pointerdown', unlockOnGesture, { passive: true });
    window.addEventListener('touchstart', unlockOnGesture, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('touchstart', unlockOnGesture);
    };
  }, []);

  const playPinchezVoiceAlert = useCallback((forcePlay = false) => {
    if (!forcePlay && !voiceEnabledRef.current) return;
    if (typeof window === 'undefined') return;

    if (navigator.vibrate) {
      navigator.vibrate([260, 100, 260, 100, 380]);
    }

    const speakFallback = () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(PINCHEZ_SPOKEN_GREETING);
          utter.rate = 0.95;
          utter.pitch = 1.0;
          utter.volume = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch { }
    };

    try {
      const audio =
        alertAudioRef.current || new Audio('/pinchez-check-money.wav');
      alertAudioRef.current = audio;
      audio.currentTime = 0;
      audio.volume = 1.0;
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          speakFallback();
        });
      }
    } catch {
      speakFallback();
    }
  }, []);

  const playProfessorCustomerAlert = useCallback((forcePlay = false) => {
    if (!forcePlay && !voiceEnabledRef.current) return;
    if (typeof window === 'undefined') return;

    if (navigator.vibrate) {
      navigator.vibrate([180, 80, 220]);
    }

    const speakProfessorFallback = () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utter = new SpeechSynthesisUtterance(PROFESSOR_CUSTOMER_GREETING);
          utter.rate = 0.96;
          utter.pitch = 1.05;
          utter.volume = 1.0;
          window.speechSynthesis.speak(utter);
        }
      } catch { }
    };

    try {
      const pAudio =
        professorAudioRef.current ||
        new Audio('/audio/new-customer-professor.mp3');
      professorAudioRef.current = pAudio;
      pAudio.currentTime = 0;
      pAudio.volume = 1.0;
      const p = pAudio.play();
      if (p !== undefined) {
        p.catch(() => {
          speakProfessorFallback();
        });
      }
    } catch {
      speakProfessorFallback();
    }
  }, []);

  // Register PWA Service Worker & Capture Install Prompt
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker
        .register('/admin-sw.js', { scope: '/mobile-admin' })
        .catch(() => { });
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
        const [ordRes, monRes, tuiRes, gamRes, secRes, attRes, walRes, senRes] =
          await Promise.all([
            fetch('/api/admin/orders', { headers }),
            fetch('/api/monetization/track', { headers }),
            fetch('/api/tuition?admin=1', { headers }),
            fetch('/api/gaming?admin=1', { headers }),
            fetch('/api/admin/security', { headers }),
            fetch('/api/purchase-attempt', { headers }),
            fetch('/api/admin/wallet', { headers }),
            fetch('/api/seo/sensor', { headers }),
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
          let playedOrderAlert = false;
          if (
            prevPendingCountRef.current !== null &&
            pendingCount > prevPendingCountRef.current
          ) {
            playPinchezVoiceAlert();
            playedOrderAlert = true;
            showToast(
              `Hello Senior Counsel Pinchez! New M-Pesa order (${pendingCount} pending)`
            );
          }
          prevPendingCountRef.current = pendingCount;

          if (attRes.ok) {
            const attJson = (await attRes.json()) as {
              totalAttempts: number;
              latestAttempt: MobilePurchaseAttempt | null;
              recentAttempts: MobilePurchaseAttempt[];
            };
            setTotalPurchaseAttempts(attJson.totalAttempts || 0);
            setPurchaseAttempts(attJson.recentAttempts || []);

            const newestId = attJson.latestAttempt?.id || null;
            if (lastSeenAttemptIdRef.current === undefined) {
              // First baseline snapshot on app load
              lastSeenAttemptIdRef.current = newestId;
            } else if (
              newestId &&
              newestId !== lastSeenAttemptIdRef.current
            ) {
              lastSeenAttemptIdRef.current = newestId;
              if (!playedOrderAlert) {
                playPinchezVoiceAlert();
              }
              const latest = attJson.latestAttempt;
              if (latest) {
                showToast(
                  `Purchase Attempt: ${latest.itemTitle}${latest.amountKes ? ` (KES ${latest.amountKes})` : ''
                  }`
                );
              }
            }
          }

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

        if (secRes.ok) {
          const secJson = (await secRes.json()) as MobileSecurityPayload;
          setSecurityData(secJson);
          const chCount = (secJson.pendingChallenges || []).length;
          if (
            prevChallengeCountRef.current !== null &&
            chCount > prevChallengeCountRef.current
          ) {
            if (typeof navigator !== 'undefined' && navigator.vibrate) {
              navigator.vibrate([250, 100, 250, 100, 250]);
            }
            showToast(
              `Security Alert: Sign-in waiting for your Mobile Click approval!`
            );
          }
          prevChallengeCountRef.current = chCount;
        }

        if (walRes.ok) {
          const walJson = (await walRes.json()) as {
            overview?: MobileWalletOverview;
          };
          if (walJson.overview) {
            setWalletOverview(walJson.overview);
            if (!linkerHydratedRef.current) {
              setLinkPayheroAccountId(walJson.overview.payheroAccountId || '');
              setLinkPayheroChannelId(walJson.overview.payheroChannelId || '');
              setLinkAdProvider(walJson.overview.adNetworkProvider || 'monetag');
              setLinkAdScriptUrl(walJson.overview.adNetworkScriptUrl || '');
              setLinkSmartlinkUrl(walJson.overview.smartlinkUrl || '');
              setLinkAdsenseId(walJson.overview.adsenseClientId || '');
              linkerHydratedRef.current = true;
            }
          }
        }

        if (senRes.ok) {
          const senJson = (await senRes.json()) as {
            totalCustomersDetected?: number;
            latestCustomer?: MobileCustomerSensorEvent | null;
            recentCustomers?: MobileCustomerSensorEvent[];
          };
          setTotalCustomersDetected(senJson.totalCustomersDetected || 0);
          setCustomerSensorFeed(senJson.recentCustomers || []);

          const newestCustId = senJson.latestCustomer?.id || null;
          if (lastSeenCustomerIdRef.current === undefined) {
            lastSeenCustomerIdRef.current = newestCustId;
          } else if (
            newestCustId &&
            newestCustId !== lastSeenCustomerIdRef.current
          ) {
            lastSeenCustomerIdRef.current = newestCustId;
            playProfessorCustomerAlert();
            const c = senJson.latestCustomer;
            if (c) {
              showToast(
                `New customer is here PROFESSOR! (${c.sourceLabel} → ${c.keywordCluster})`
              );
            }
          }
        }

        return true;
      } catch {
        return false;
      } finally {
        setSyncing(false);
      }
    },
    [playPinchezVoiceAlert, playProfessorCustomerAlert]
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
          .catch(() => { })
          .finally(() => setCheckingAuth(false));
      }
    } catch { }
  }, [fetchAllMobileData]);

  // Live 4-second auto-sync while authenticated (triggers Senior Counsel Pinchez voice alert!)
  useEffect(() => {
    if (!authenticated || !email || !password) return;
    const timer = window.setInterval(() => {
      fetchAllMobileData(email, password);
    }, 4000);
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
      } catch { }
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

  const handleMobileClickDecision = async (
    challengeId: string,
    decision: 'APPROVE' | 'DENY'
  ) => {
    setResolvingChallengeId(challengeId);
    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email.trim(),
          'x-admin-password': password.trim(),
        },
        body: JSON.stringify({
          action: 'mobile_click',
          challengeId,
          decision,
        }),
      });
      if (res.ok) {
        showToast(
          decision === 'APPROVE'
            ? 'Mobile Click Approved! Desktop unlocked.'
            : 'Blocked! Intruder IP locked out for 1 hour.'
        );
        await fetchAllMobileData(email, password);
      }
    } finally {
      setResolvingChallengeId(null);
    }
  };

  const handleMobileBackupToEmail = async () => {
    setBackingUpMobile(true);
    try {
      const res = await fetch('/api/admin/backup', {
        method: 'POST',
        headers: {
          'x-admin-email': email.trim(),
          'x-admin-password': password.trim(),
        },
      });
      const data = await res.json();
      if (res.ok) {
        showToast(
          data.emailSent
            ? `Backup emailed to ${data.backupEmail}!`
            : `Cloud backup saved (${data.counts?.resourcesCount || 0} items)!`
        );
        if (!data.emailSent && data.signedDownloadUrl) {
          window.open(
            `https://mail.google.com/mail/?view=cm&fs=1&to=academia.edu55@gmail.com&su=${encodeURIComponent(
              'CBC Website Full Data Backup'
            )}&body=${encodeURIComponent(
              `Secure 7-Day Cloud Backup Download Link:\n\n${data.signedDownloadUrl}`
            )}`,
            '_blank'
          );
        }
        await fetchAllMobileData(email, password);
      }
    } finally {
      setBackingUpMobile(false);
    }
  };

  const handleMobileDownloadBackup = async () => {
    setBackingUpMobile(true);
    try {
      const res = await fetch('/api/admin/backup', {
        headers: {
          'x-admin-email': email.trim(),
          'x-admin-password': password.trim(),
        },
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cbc-website-backup-${new Date().toISOString().slice(0, 10)}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        showToast('Backup file downloaded to your phone!');
      }
    } finally {
      setBackingUpMobile(false);
    }
  };

  const handleMobileRevokeSessions = async () => {
    const res = await fetch('/api/admin/security', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': email.trim(),
        'x-admin-password': password.trim(),
      },
      body: JSON.stringify({ action: 'revoke_sessions' }),
    });
    if (res.ok) {
      showToast('All active web sessions revoked!');
      await fetchAllMobileData(email, password);
    }
  };

  const handleSubmitWithdrawal = async (e: React.FormEvent) => {
    e.preventDefault();
    setWithdrawing(true);
    setWithdrawFeedback(null);

    try {
      const res = await fetch('/api/admin/wallet', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-email': email.trim(),
          'x-admin-password': password.trim(),
        },
        body: JSON.stringify({
          amountKes: Number(withdrawAmount),
          source: withdrawSource,
          method: withdrawMethod,
          destination: withdrawDest.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setWithdrawFeedback({
          ok: false,
          text: data.error || 'Withdrawal failed.',
        });
        return;
      }

      if (data.overview) {
        setWalletOverview(data.overview);
      }
      setWithdrawAmount('');
      setWithdrawFeedback({
        ok: true,
        text:
          data.withdrawal?.gatewayMessage ||
          `Withdrawal ${data.withdrawal?.referenceCode} of KES ${data.withdrawal?.amountKes?.toLocaleString()} completed!`,
      });
      showToast(
        `Withdrawn KES ${data.withdrawal?.amountKes?.toLocaleString()} (${data.withdrawal?.referenceCode})!`
      );
      await fetchAllMobileData(email, password);
    } catch {
      setWithdrawFeedback({
        ok: false,
        text: 'Network error submitting withdrawal.',
      });
    } finally {
      setWithdrawing(false);
    }
  };

  const handleWithdrawalStatusUpdate = async (
    id: string,
    status: 'COMPLETED' | 'CANCELLED'
  ) => {
    const res = await fetch('/api/admin/wallet', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-email': email.trim(),
        'x-admin-password': password.trim(),
      },
      body: JSON.stringify({ id, status }),
    });
    if (res.ok) {
      const data = await res.json();
      if (data.overview) setWalletOverview(data.overview);
      showToast(
        status === 'CANCELLED'
          ? 'Withdrawal cancelled & refunded back to Wallet!'
          : 'Withdrawal marked settled!'
      );
    }
  };

  const handleSaveRealMoneyLinks = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingRealLinks(true);
    const headers = {
      'Content-Type': 'application/json',
      'x-admin-email': email.trim(),
      'x-admin-password': password.trim(),
    };

    try {
      const promises: Promise<Response>[] = [];

      // 1. Save PayHero Kenya (Primary) or Paystack credentials if entered
      if (
        linkPayheroAccountId.trim() ||
        linkPayheroChannelId.trim() ||
        linkPayheroToken.trim() ||
        linkPaystackSecret.trim()
      ) {
        promises.push(
          fetch('/api/admin/payment-config', {
            method: 'POST',
            headers,
            body: JSON.stringify({
              activeGateway:
                linkPayheroToken.trim() ||
                linkPayheroChannelId.trim() ||
                linkPayheroAccountId.trim()
                  ? 'payhero'
                  : 'paystack',
              recipientMpesa: '254728595160',
              payheroAccountId: linkPayheroAccountId.trim(),
              payheroChannelId: linkPayheroChannelId.trim(),
              payheroAuthToken: linkPayheroToken.trim(),
              paystackSecretKey: linkPaystackSecret.trim(),
              payheroAutoWithdraw: false,
            }),
          })
        );
      }

      // 2. Save Monetag / Adsterra / AdSense real paid ad links
      promises.push(
        fetch('/api/monetization/config', {
          method: 'POST',
          headers,
          body: JSON.stringify({
            enabled: true,
            adNetworkEnabled: Boolean(
              linkAdScriptUrl.trim() || linkSmartlinkUrl.trim()
            ),
            adNetworkProvider: linkAdProvider,
            adNetworkScriptUrl: linkAdScriptUrl.trim(),
            smartlinkUrl: linkSmartlinkUrl.trim(),
            adsenseEnabled: Boolean(linkAdsenseId.trim()),
            adsenseClientId: linkAdsenseId.trim(),
          }),
        })
      );

      await Promise.all(promises);
      setLinkPaystackSecret('');
      setLinkPayheroToken('');
      showToast('Real M-Pesa B2C & Paid Ad Network links saved live!');
      await fetchAllMobileData(email, password);
    } catch {
      showToast('Failed to save links. Check your connection.');
    } finally {
      setSavingRealLinks(false);
    }
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
                  placeholder="Enter admin email"
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
              onClick={() => {
                const next = !voiceAlertEnabled;
                setVoiceAlertEnabled(next);
                showToast(
                  next
                    ? 'Voice Alert ON: "Hello senior counsel Pinchez. Please check money."'
                    : 'Voice Alert muted'
                );
                if (next) {
                  playPinchezVoiceAlert(true);
                }
              }}
              aria-label="Toggle voice alert"
              className={`p-2 rounded-xl border active:scale-95 transition ${voiceAlertEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500'
                }`}
            >
              {voiceAlertEnabled ? (
                <Volume2 className="w-4 h-4" />
              ) : (
                <VolumeX className="w-4 h-4" />
              )}
            </button>
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
        {/* 1-CLICK MULTI-PLATFORM SOCIAL AUTO-POSTER + ALL SOCIAL LINKS & ON/OFF SWITCHES */}
        <MobileSocialAutoPoster
          adminEmail={email}
          adminPassword={password}
          onToast={showToast}
        />

        {/* ================================================================= */}
        {/* GLOBAL LIVE "MOBILE CLICK" 2-STEP VERIFICATION PROMPT             */}
        {/* ================================================================= */}
        {(securityData?.pendingChallenges || []).length > 0 && (
          <div className="space-y-3">
            {securityData?.pendingChallenges.map((ch) => {
              const busyCh = resolvingChallengeId === ch.challengeId;
              return (
                <div
                  key={ch.challengeId}
                  className="bg-gradient-to-br from-amber-500/20 via-slate-900 to-rose-950/40 border-2 border-amber-400 rounded-3xl p-4 space-y-3 shadow-2xl"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className="w-11 h-11 rounded-2xl bg-amber-400 text-slate-950 font-black text-lg flex items-center justify-center shrink-0">
                        #{ch.matchNumber}
                      </div>
                      <div>
                        <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                          Mobile Click 2FA Request
                        </span>
                        <p className="text-xs font-black text-white mt-0.5">
                          Sign-in to <code>{ch.portal}</code>
                        </p>
                        <p className="text-[11px] text-slate-300">
                          IP: <span className="font-mono">{ch.requesterIp}</span> • OTP:{' '}
                          {ch.targetPhone}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={busyCh}
                      onClick={() =>
                        handleMobileClickDecision(ch.challengeId, 'APPROVE')
                      }
                      className="bg-emerald-500 hover:bg-emerald-400 active:scale-95 text-slate-950 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <Check className="w-4 h-4" />
                      Allow Login #{ch.matchNumber}
                    </button>
                    <button
                      type="button"
                      disabled={busyCh}
                      onClick={() =>
                        handleMobileClickDecision(ch.challengeId, 'DENY')
                      }
                      className="bg-rose-600 hover:bg-rose-500 active:scale-95 text-white font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-1.5 shadow cursor-pointer"
                    >
                      <XCircle className="w-4 h-4" />
                      Block Hacker
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ================================================================= */}
        {/* TAB 1: VERIFY & APPROVE TRANSACTIONS                              */}
        {/* ================================================================= */}
        {activeTab === 'APPROVE' && (
          <div className="space-y-4">
            {/* Senior Counsel Pinchez Voice Alert Strip */}
            <div className="bg-gradient-to-r from-emerald-950/90 via-slate-900 to-amber-950/40 border border-emerald-500/40 rounded-2xl p-3.5 flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${voiceAlertEnabled
                      ? 'bg-emerald-500 text-slate-950'
                      : 'bg-slate-800 text-slate-400'
                    }`}
                >
                  {voiceAlertEnabled ? (
                    <Volume2 className="w-4 h-4" />
                  ) : (
                    <VolumeX className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase text-emerald-300 truncate">
                    Purchase Voice Alert ({voiceAlertEnabled ? 'ACTIVE' : 'MUTED'})
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    &ldquo;Hello senior counsel Pinchez. Please check money.&rdquo;
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  playPinchezVoiceAlert(true);
                  showToast('Playing: "Hello senior counsel Pinchez. Please check money."');
                }}
                className="bg-amber-400 hover:bg-amber-300 active:scale-95 text-slate-950 font-black text-[11px] px-3 py-2 rounded-xl shrink-0 cursor-pointer"
              >
                ▶ Test Sound
              </button>
            </div>

            {/* Live Search & Customer Arrival Sensor Strip ("New customer is here PROFESSOR") */}
            <div className="bg-gradient-to-r from-indigo-950/90 via-slate-900 to-emerald-950/60 border border-indigo-400/40 rounded-2xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-[11px] font-black uppercase text-indigo-300 truncate">
                    Live Search &amp; Customer Sensor ({totalCustomersDetected} Detected)
                  </p>
                  <p className="text-[11px] text-slate-300 truncate">
                    Rings: &ldquo;New customer is here PROFESSOR&rdquo;
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    playProfessorCustomerAlert(true);
                    showToast('Playing: "New customer is here PROFESSOR"');
                  }}
                  className="bg-indigo-500 hover:bg-indigo-400 active:scale-95 text-white font-black text-[11px] px-3 py-2 rounded-xl shrink-0 cursor-pointer"
                >
                  ▶ Test Professor
                </button>
              </div>

              {customerSensorFeed.length > 0 && (
                <div className="space-y-1.5 max-h-32 overflow-y-auto pt-1 border-t border-slate-800">
                  {customerSensorFeed.slice(0, 4).map((cust) => (
                    <div
                      key={cust.id}
                      className="flex items-center justify-between gap-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-1.5"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {cust.keywordCluster}
                          {cust.searchQuery ? ` (“${cust.searchQuery}”)` : ''}
                        </p>
                        <p className="text-[10px] text-slate-400 truncate">
                          {cust.sourceLabel} • {cust.deviceSummary} •{' '}
                          {formatShortTime(cust.timestamp)}
                        </p>
                      </div>
                      <span className="text-[10px] font-black text-emerald-400 shrink-0">
                        LIVE
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Live Real-Time Purchase Attempts Feed */}
            {purchaseAttempts.length > 0 && (
              <div className="bg-slate-900 border border-amber-400/30 rounded-2xl p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-300">
                    Live Purchase Attempts ({totalPurchaseAttempts})
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Auto-rings voice alert
                  </span>
                </div>
                <div className="space-y-1.5 max-h-36 overflow-y-auto">
                  {purchaseAttempts.slice(0, 4).map((att) => (
                    <div
                      key={att.id}
                      className="flex items-center justify-between gap-2 text-xs bg-slate-950/70 border border-slate-800 rounded-xl px-3 py-2"
                    >
                      <div className="min-w-0">
                        <p className="font-bold text-white truncate">
                          {att.itemTitle}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {att.channel}
                          {att.buyerPhone ? ` • ${att.buyerPhone}` : ''} •{' '}
                          {formatShortTime(att.timestamp)}
                        </p>
                      </div>
                      {att.amountKes > 0 && (
                        <span className="font-mono font-black text-emerald-400 shrink-0">
                          KES {att.amountKes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                  className={`py-2 rounded-xl text-[11px] font-black transition ${orderFilter === tabItem.key
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
                      className={`rounded-3xl border p-4 space-y-3 ${order.status === 'PENDING'
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
                              className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${order.status === 'PENDING'
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
        {/* TAB 2: UNIFIED WALLET & WITHDRAWALS (CLIENT PAYMENTS + MONETIZE)  */}
        {/* ================================================================= */}
        {activeTab === 'WALLET' && (
          <div className="space-y-4">
            {/* Master Unified Wallet Card + Withdraw Button */}
            <div className="bg-gradient-to-br from-emerald-600 via-emerald-800 to-slate-900 rounded-3xl p-5 space-y-4 shadow-xl border border-emerald-400/40">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-black uppercase tracking-wider text-emerald-200">
                    Available Wallet Balance
                  </span>
                  <p className="text-3xl font-black text-white mt-0.5">
                    KES{' '}
                    {(
                      walletOverview?.availableTotalKes ?? combinedTotalKes
                    ).toLocaleString()}
                  </p>
                </div>
                <span className="bg-amber-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-1 rounded-full shrink-0">
                  All Revenue Streams
                </span>
              </div>

              {/* Exact 2-Stream Breakdown Inside Wallet */}
              <div className="grid grid-cols-2 gap-2.5 bg-slate-950/45 border border-white/10 rounded-2xl p-3 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-emerald-200 block">
                    Client Payments
                  </span>
                  <span className="text-sm font-black text-white">
                    KES{' '}
                    {(
                      walletOverview?.availableClientPaymentsKes ?? totalMpesaKes
                    ).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-200/80">
                    Gross: KES{' '}
                    {(
                      walletOverview?.clientPaymentsGrossKes ?? totalMpesaKes
                    ).toLocaleString()}
                  </span>
                </div>
                <div className="border-l border-white/15 pl-2.5">
                  <span className="text-[10px] font-bold uppercase text-amber-300 block">
                    Monetization Coin
                  </span>
                  <span className="text-sm font-black text-amber-300">
                    KES{' '}
                    {(
                      walletOverview?.availableMonetizationKes ??
                      (monetization?.totalEstimatedKes || 0)
                    ).toLocaleString()}
                  </span>
                  <span className="block text-[10px] text-emerald-200/80">
                    Gross: KES{' '}
                    {(
                      walletOverview?.monetizationGrossKes ??
                      (monetization?.totalEstimatedKes || 0)
                    ).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-emerald-100">
                <span>
                  Lifetime Earned:{' '}
                  <strong>
                    KES{' '}
                    {(
                      walletOverview?.totalGrossEarnedKes ?? combinedTotalKes
                    ).toLocaleString()}
                  </strong>
                </span>
                <span>
                  Withdrawn:{' '}
                  <strong>
                    KES {(walletOverview?.totalWithdrawnKes || 0).toLocaleString()}
                  </strong>
                </span>
              </div>

              {/* PRIMARY WITHDRAWAL BUTTON */}
              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setWithdrawFeedback(null);
                    setShowWithdrawForm((s) => !s);
                  }}
                  className="w-full bg-amber-400 hover:bg-amber-300 active:scale-[0.99] text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
                  <span>
                    {showWithdrawForm
                      ? 'Hide Withdrawal Panel'
                      : 'Withdraw Money from Wallet'}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowRealMoneyLinker((v) => !v)}
                  className="w-full bg-slate-950/70 hover:bg-slate-950 border border-white/20 text-white font-bold text-xs py-2.5 px-3 rounded-2xl flex items-center justify-between gap-2 transition cursor-pointer"
                >
                  <span className="truncate">
                    🔗 Link Real M-Pesa B2C &amp; Ad Networks
                  </span>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-white/15 shrink-0">
                    {walletOverview?.liveB2cReady &&
                      walletOverview?.adNetworkConnected
                      ? 'ALL LINKED ✓'
                      : 'SETUP'}
                  </span>
                </button>
              </div>
            </div>

            {/* IN-APP REAL MONEY M-PESA & AD NETWORK LINKER WIZARD */}
            {showRealMoneyLinker && (
              <form
                onSubmit={handleSaveRealMoneyLinks}
                className="bg-slate-900 border-2 border-emerald-500/50 rounded-3xl p-4 space-y-4 shadow-2xl text-xs"
              >
                <div className="space-y-1">
                  <span className="inline-block text-[10px] font-black uppercase bg-emerald-500 text-slate-950 px-2.5 py-0.5 rounded-full">
                    Real Money M-Pesa Linker
                  </span>
                  <h3 className="text-sm font-black text-white">
                    Connect Both Streams Directly on Your Phone
                  </h3>
                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    1) Link <strong>Monetag / Adsterra</strong> so real advertisers pay
                    USD/KES for your views &amp; clicks, and 2) Link{' '}
                    <strong>PayHero Kenya</strong> so tapping Withdraw sends real cash
                    into your M-Pesa (<code>0728***160</code>).
                  </p>
                </div>

                {/* PART A: MONETIZED COINS -> REAL PAID AD NETWORK */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-amber-300 uppercase text-[11px]">
                      Step A: Turn Ad Coins into Real Paid Cash
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${walletOverview?.adNetworkConnected
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                        }`}
                    >
                      {walletOverview?.adNetworkConnected ? 'LINKED ✓' : 'NOT LINKED'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Sign up free (5 mins, instant approval) and add{' '}
                    <code className="text-slate-200">cbcmaterials.shop</code>:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href="https://monetag.com/?utm_source=cbc_admin"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-amber-400/15 border border-amber-400/40 text-amber-300 font-black py-2 px-2.5 rounded-xl flex items-center justify-between"
                    >
                      <span>1. Monetag.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                    <a
                      href="https://adsterra.com/"
                      target="_blank"
                      rel="noreferrer"
                      className="bg-purple-500/15 border border-purple-400/40 text-purple-300 font-black py-2 px-2.5 rounded-xl flex items-center justify-between"
                    >
                      <span>2. Adsterra.com</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Paste MultiTag / Banner Script URL (Monetag or Adsterra)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (from Monetag -> MultiTag)"
                      value={linkAdScriptUrl}
                      onChange={(e) => setLinkAdScriptUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Paste Direct Smartlink URL (Pays per Click!)
                    </label>
                    <input
                      type="url"
                      placeholder="https://... (from Monetag -> Smartlink / Direct Link)"
                      value={linkSmartlinkUrl}
                      onChange={(e) => setLinkSmartlinkUrl(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                      Google AdSense Publisher ID (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="ca-pub-XXXXXXXXXXXXXXXX"
                      value={linkAdsenseId}
                      onChange={(e) => setLinkAdsenseId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white font-mono text-[11px]"
                    />
                  </div>
                </div>

                {/* PART B: PAYHERO KENYA LIVE M-PESA STK & B2C DISBURSEMENT */}
                <div className="bg-slate-950 border border-slate-800 rounded-2xl p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-black text-emerald-300 uppercase text-[11px]">
                      Step B: PayHero Kenya Live M-Pesa (Primary)
                    </span>
                    <span
                      className={`text-[10px] font-black px-2 py-0.5 rounded-full ${walletOverview?.liveB2cReady
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-amber-500/20 text-amber-300'
                        }`}
                    >
                      {walletOverview?.liveB2cReady ? 'LIVE B2C ✓' : 'PASTE TOKEN'}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-snug">
                    Connected to{' '}
                    <a
                      href="https://app.payhero.co.ke"
                      target="_blank"
                      rel="noreferrer"
                      className="text-emerald-400 font-black underline"
                    >
                      PayHero Kenya
                    </a>{' '}
                    for instant M-Pesa STK Push &amp; B2C Wallet Withdrawals into{' '}
                    <code>0728***160</code>:
                  </p>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Account ID (e.g. 14023)"
                      value={linkPayheroAccountId}
                      onChange={(e) => setLinkPayheroAccountId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono text-[11px]"
                    />
                    <input
                      type="text"
                      placeholder="Channel ID (e.g. 15436)"
                      value={linkPayheroChannelId}
                      onChange={(e) => setLinkPayheroChannelId(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono text-[11px]"
                    />
                  </div>
                  <input
                    type="password"
                    placeholder={
                      walletOverview?.hasPayheroToken
                        ? 'PayHero Basic Auth Token Saved ✓ (Paste new to update)'
                        : 'Paste PayHero Basic Auth Token'
                    }
                    value={linkPayheroToken}
                    onChange={(e) => setLinkPayheroToken(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-slate-900 border border-emerald-500/40 text-white font-mono text-[11px]"
                  />
                </div>

                <button
                  type="submit"
                  disabled={savingRealLinks}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs py-3.5 rounded-2xl shadow-lg cursor-pointer"
                >
                  {savingRealLinks
                    ? 'Saving Live Connections...'
                    : 'Save & Activate Real M-Pesa Payouts'}
                </button>
              </form>
            )}

            {/* INTERACTIVE WITHDRAWAL DRAWER */}
            {showWithdrawForm && (
              <form
                onSubmit={handleSubmitWithdrawal}
                className="bg-slate-900 border-2 border-amber-400/60 rounded-3xl p-4 space-y-4 shadow-2xl"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-black uppercase tracking-wider text-amber-300">
                    Withdraw Funds to M-Pesa / Bank
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Min KES 10
                  </span>
                </div>

                {!walletOverview?.liveB2cReady && (
                  <div className="bg-amber-500/15 border border-amber-400/50 rounded-2xl p-3 text-[11px] text-amber-200 space-y-1.5">
                    <p className="font-black text-amber-300">
                      ⚡ 1-Time Link Needed for Real Safaricom M-Pesa SMS:
                    </p>
                    <p className="text-slate-300 leading-snug">
                      To receive the real Safaricom M-Pesa SMS notification on your
                      phone when withdrawing, tap below to paste your{' '}
                      <strong>PayHero Basic Auth Token</strong> +{' '}
                      <strong>Monetag / Adsterra</strong> ad links!
                    </p>
                    <button
                      type="button"
                      onClick={() => setShowRealMoneyLinker(true)}
                      className="bg-amber-400 text-slate-950 font-black text-[11px] px-3 py-1.5 rounded-xl cursor-pointer"
                    >
                      Open Real M-Pesa &amp; Ad Linker Now &rarr;
                    </button>
                  </div>
                )}

                {/* 1. Select Wallet Source */}
                <div>
                  <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1.5">
                    1. Withdraw From
                  </label>
                  <div className="grid grid-cols-3 gap-1.5">
                    {(
                      [
                        {
                          key: 'COMBINED',
                          label: 'All Money',
                          avail:
                            walletOverview?.availableTotalKes ?? combinedTotalKes,
                        },
                        {
                          key: 'CLIENT_PAYMENTS',
                          label: 'Client Sales',
                          avail:
                            walletOverview?.availableClientPaymentsKes ??
                            totalMpesaKes,
                        },
                        {
                          key: 'MONETIZATION',
                          label: 'Monetization',
                          avail:
                            walletOverview?.availableMonetizationKes ??
                            (monetization?.totalEstimatedKes || 0),
                        },
                      ] as const
                    ).map((src) => (
                      <button
                        key={src.key}
                        type="button"
                        onClick={() => setWithdrawSource(src.key)}
                        className={`p-2 rounded-xl border text-left transition cursor-pointer ${withdrawSource === src.key
                            ? 'border-emerald-400 bg-emerald-500/15 text-white'
                            : 'border-slate-800 bg-slate-950 text-slate-400'
                          }`}
                      >
                        <span className="block text-[10px] font-black truncate">
                          {src.label}
                        </span>
                        <span className="block text-[10px] font-mono text-emerald-300">
                          KES {src.avail.toLocaleString()}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 2. Amount + Quick Percentage Pills */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-[10px] font-bold uppercase text-slate-400">
                      2. Amount to Withdraw (KES)
                    </label>
                    <div className="flex items-center gap-1">
                      {[0.25, 0.5, 1].map((pct) => {
                        const pool =
                          withdrawSource === 'CLIENT_PAYMENTS'
                            ? walletOverview?.availableClientPaymentsKes ??
                            totalMpesaKes
                            : withdrawSource === 'MONETIZATION'
                              ? walletOverview?.availableMonetizationKes ??
                              (monetization?.totalEstimatedKes || 0)
                              : walletOverview?.availableTotalKes ?? combinedTotalKes;
                        return (
                          <button
                            key={pct}
                            type="button"
                            onClick={() =>
                              setWithdrawAmount(
                                String(Math.max(0, Math.floor(pool * pct)))
                              )
                            }
                            className="text-[10px] font-black bg-slate-800 hover:bg-slate-700 text-amber-300 px-2 py-0.5 rounded-lg cursor-pointer"
                          >
                            {pct === 1 ? 'MAX' : `${pct * 100}%`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <input
                    type="number"
                    min={10}
                    step="any"
                    required
                    placeholder="Enter amount in KES..."
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-2xl bg-slate-950 border border-slate-700 text-base font-mono font-black text-white focus:outline-none focus:border-amber-400"
                  />
                </div>

                {/* 3. Payout Method & Destination */}
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold uppercase text-slate-400">
                    3. Payout Destination
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawMethod('MPESA');
                        if (!withdrawDest || !withdrawDest.startsWith('0')) {
                          setWithdrawDest('0728595160');
                        }
                      }}
                      className={`py-2 rounded-xl border text-xs font-black cursor-pointer ${withdrawMethod === 'MPESA'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                    >
                      M-Pesa Instant
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setWithdrawMethod('BANK');
                        if (
                          withdrawDest === '0728595160' ||
                          withdrawDest === '0705759072'
                        ) {
                          setWithdrawDest('');
                        }
                      }}
                      className={`py-2 rounded-xl border text-xs font-black cursor-pointer ${withdrawMethod === 'BANK'
                          ? 'border-emerald-400 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-950 text-slate-400'
                        }`}
                    >
                      Bank / Paybill
                    </button>
                  </div>

                  {withdrawMethod === 'MPESA' && (
                    <div className="flex items-center gap-1.5">
                      {(['0728595160', '0705759072'] as const).map((ph) => (
                        <button
                          key={ph}
                          type="button"
                          onClick={() => setWithdrawDest(ph)}
                          className={`text-[10px] font-mono font-bold px-2.5 py-1 rounded-lg border cursor-pointer ${withdrawDest === ph
                              ? 'border-amber-400 bg-amber-400/20 text-amber-300'
                              : 'border-slate-800 bg-slate-950 text-slate-400'
                            }`}
                        >
                          Use {ph.slice(0, 4)}***{ph.slice(-3)}
                        </button>
                      ))}
                    </div>
                  )}

                  <input
                    type="text"
                    required
                    placeholder={
                      withdrawMethod === 'MPESA'
                        ? 'Enter M-Pesa phone (e.g. 0728595160)'
                        : 'Enter Bank Name & Account / Paybill...'
                    }
                    value={withdrawDest}
                    onChange={(e) => setWithdrawDest(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-2xl bg-slate-950 border border-slate-700 text-xs font-mono font-bold text-white focus:outline-none focus:border-emerald-400"
                  />
                </div>

                {withdrawFeedback && (
                  <div
                    className={`rounded-2xl p-3 text-xs font-bold ${withdrawFeedback.ok
                        ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200'
                        : 'bg-rose-950/80 border border-rose-600 text-rose-200'
                      }`}
                  >
                    {withdrawFeedback.text}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={withdrawing}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black text-sm py-3.5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  {withdrawing
                    ? 'Processing Withdrawal...'
                    : `Confirm Withdrawal${Number(withdrawAmount) > 0
                      ? ` (KES ${Number(withdrawAmount).toLocaleString()})`
                      : ''
                    }`}
                </button>
              </form>
            )}

            {/* Quick Stats Grid */}
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

            {/* RECENT WALLET WITHDRAWALS LEDGER */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs font-black uppercase text-slate-300">
                  Recent Withdrawals ({walletOverview?.withdrawals.length || 0})
                </p>
                <span className="text-[10px] text-emerald-400 font-bold">
                  Auto-Backed Up
                </span>
              </div>

              {(walletOverview?.withdrawals || []).length === 0 ? (
                <p className="text-xs text-slate-500 py-3 text-center">
                  No withdrawals made yet. Tap &ldquo;Withdraw Money from
                  Wallet&rdquo; above anytime.
                </p>
              ) : (
                <div className="space-y-2.5 max-h-72 overflow-y-auto">
                  {walletOverview?.withdrawals.slice(0, 15).map((w) => (
                    <div
                      key={w.id}
                      className="bg-slate-950 border border-slate-800 rounded-2xl p-3 space-y-1.5 text-xs"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono font-black text-amber-300">
                          {w.referenceCode} • KES {w.amountKes.toLocaleString()}
                        </span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded-full ${w.status === 'COMPLETED'
                              ? 'bg-emerald-500/20 text-emerald-300'
                              : w.status === 'CANCELLED'
                                ? 'bg-slate-800 text-slate-400 line-through'
                                : 'bg-amber-400/20 text-amber-300'
                            }`}
                        >
                          {w.status === 'PENDING_SETTLEMENT'
                            ? 'QUEUED'
                            : w.status}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-300">
                        To <strong>{w.method}</strong> ({w.destination}) • Client: KES{' '}
                        {w.fromClientPaymentsKes.toLocaleString()} | Monetization: KES{' '}
                        {w.fromMonetizationKes.toLocaleString()}
                      </p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-slate-500">
                          {formatShortTime(w.createdAt)}
                        </span>
                        {w.status !== 'CANCELLED' && (
                          <div className="flex items-center gap-2">
                            {w.status === 'PENDING_SETTLEMENT' && (
                              <button
                                type="button"
                                onClick={() =>
                                  handleWithdrawalStatusUpdate(w.id, 'COMPLETED')
                                }
                                className="text-[10px] font-black text-emerald-400 underline cursor-pointer"
                              >
                                Mark Settled
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() =>
                                handleWithdrawalStatusUpdate(w.id, 'CANCELLED')
                              }
                              className="text-[10px] font-bold text-rose-400 underline cursor-pointer"
                            >
                              Refund to Wallet
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
            <AdminCustomersVaultPanel
              password={password}
              adminEmail={email}
              darkTheme
            />
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
                          className={`inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full ${t.role === 'LEARNER'
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
            <WhatsAppStatusAutoPanel
              password={password}
              adminEmail={email}
              darkTheme
            />
            <OmnichannelSocialSeoPanel
              password={password}
              adminEmail={email}
              darkTheme
            />
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

        {/* ================================================================= */}
        {/* TAB 5: SECURITY, AUTHENTICATOR OTP & WEBSITE BACKUP               */}
        {/* ================================================================= */}
        {activeTab === 'SECURITY' && (
          <div className="space-y-4">
            {/* Live 6-Digit Authenticator OTP Card */}
            <div className="bg-gradient-to-br from-emerald-900/70 via-slate-900 to-slate-900 border border-emerald-500/40 rounded-3xl p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-widest text-emerald-300">
                  Live 2-Step Authenticator Code
                </span>
                <span className="text-[10px] font-mono text-amber-300">
                  Refreshes every 60s
                </span>
              </div>

              <div className="flex items-center justify-between bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3.5">
                <span className="font-mono text-3xl font-black tracking-[0.28em] text-white">
                  {securityData?.authenticator.code || '------'}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    if (!securityData?.authenticator.code) return;
                    navigator.clipboard
                      ?.writeText(securityData.authenticator.code)
                      .catch(() => { });
                    setCopiedId('totp');
                    showToast('6-digit OTP copied!');
                  }}
                  className="bg-emerald-500 text-slate-950 font-black text-xs px-3 py-2 rounded-xl flex items-center gap-1"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedId === 'totp' ? 'Copied' : 'Copy'}
                </button>
              </div>

              <div className="text-[11px] text-slate-300 space-y-1">
                <p>
                  • <strong>OTP Phones:</strong> 0728***160 or 0705***072
                </p>
                <p>
                  • <strong>2FA &amp; Backup Email:</strong> aca*******55@gmail.com
                </p>
                <p className="text-slate-400">
                  Use this 6-digit code OR tap <strong>Allow Login</strong> whenever signing
                  in on computer.
                </p>
              </div>
            </div>

            {/* 1-Tap Full Website Data Backup */}
            <div className="bg-slate-900 border border-amber-400/30 rounded-3xl p-4 space-y-3">
              <div>
                <h3 className="text-xs font-black uppercase text-amber-300">
                  Website Data Backup (academia.edu55@gmail.com)
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Exports all 3,403+ CBC materials, M-Pesa orders, tuition leads, gaming
                  players &amp; monetization data.
                </p>
                {securityData?.lastBackupAt && (
                  <p className="text-[11px] text-emerald-400 font-semibold mt-1">
                    Last Backup: {formatShortTime(securityData.lastBackupAt)}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 gap-2">
                <button
                  type="button"
                  disabled={backingUpMobile}
                  onClick={handleMobileBackupToEmail}
                  className="w-full bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Mail className="w-4 h-4" />
                  {backingUpMobile
                    ? 'Backing up website...'
                    : 'Backup to academia.edu55@gmail.com'}
                </button>
                <button
                  type="button"
                  disabled={backingUpMobile}
                  onClick={handleMobileDownloadBackup}
                  className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs py-3 rounded-2xl flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4 text-emerald-400" />
                  Download Full Backup File (.JSON)
                </button>
              </div>
            </div>

            {/* Emergency Session Panic Button & Intrusion Log */}
            <div className="bg-slate-900 border border-slate-800 rounded-3xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-black uppercase text-rose-400">
                    Emergency Hacker Lockout
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    {securityData?.lockedIps.length || 0} hacker IPs currently blocked
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleMobileRevokeSessions}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-black text-[11px] px-3 py-2 rounded-xl flex items-center gap-1 cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  Logout All Browsers
                </button>
              </div>

              {(securityData?.auditLog || []).length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-800 max-h-56 overflow-y-auto">
                  {securityData?.auditLog.slice(0, 8).map((ev) => (
                    <div
                      key={ev.id}
                      className="text-[11px] border-b border-slate-800/70 pb-1.5 last:border-0"
                    >
                      <p className="text-slate-200 font-semibold">{ev.detail}</p>
                      <p className="text-slate-500 font-mono text-[10px]">
                        IP {ev.ip} • {formatShortTime(ev.timestamp)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Native-Style Bottom Navigation Bar */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-slate-950/95 backdrop-blur border-t border-slate-800 px-1.5 py-2">
        <div className="max-w-lg mx-auto grid grid-cols-5 gap-1">
          <button
            type="button"
            onClick={() => setActiveTab('APPROVE')}
            className={`relative py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${activeTab === 'APPROVE'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
              }`}
          >
            <CheckCircle2 className="w-5 h-5" />
            <span className="text-[10px] font-black">Approve</span>
            {pendingOrders.length > 0 && (
              <span className="absolute top-1 right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 rounded-full">
                {pendingOrders.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('WALLET')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${activeTab === 'WALLET'
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
            className={`relative py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${activeTab === 'LEADS'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
              }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[10px] font-black">Leads</span>
            {totalLeadsBadge > 0 && (
              <span className="absolute top-1 right-2 bg-amber-400 text-slate-950 text-[9px] font-black px-1.5 rounded-full">
                {totalLeadsBadge}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('TRAFFIC')}
            className={`py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${activeTab === 'TRAFFIC'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
              }`}
          >
            <Coins className="w-5 h-5" />
            <span className="text-[10px] font-black">Traffic</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('SECURITY')}
            className={`relative py-2 rounded-2xl flex flex-col items-center justify-center gap-0.5 transition ${activeTab === 'SECURITY'
                ? 'bg-emerald-500/15 text-emerald-400'
                : 'text-slate-400'
              }`}
          >
            <ShieldCheck className="w-5 h-5" />
            <span className="text-[10px] font-black">Security</span>
            {(securityData?.pendingChallenges.length || 0) > 0 && (
              <span className="absolute top-1 right-2 bg-rose-500 text-white text-[9px] font-black px-1.5 rounded-full animate-pulse">
                {securityData?.pendingChallenges.length}
              </span>
            )}
          </button>
        </div>
      </nav>
    </div>
  );
}
