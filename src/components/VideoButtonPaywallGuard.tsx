'use client';

import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  Smartphone,
  Sparkles,
  Unlock,
} from 'lucide-react';
import {
  TUTOR_PETER_VIDEO_PRICE_KES,
  TUTOR_PETER_VIDEO_PRICE_USD,
} from '@/lib/tutor-peter-videos';
import { ADMIN_2FA_TOKEN_KEY } from './AdminTwoFactorGate';
import { isSearchCrawlerBot } from './LuxuryWelcomeSong';

export const VIDEO_BUTTON_UNLOCK_KEY = 'cbc_video_button_pass_v1';

export default function VideoButtonPaywallGuard({
  children,
  contextTitle,
}: {
  children: React.ReactNode;
  contextTitle?: string;
}) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(true);
  const [payTab, setPayTab] = useState<'STK' | 'CODE'>('STK');
  const [phoneInput, setPhoneInput] = useState('');
  const [buyerNameInput, setBuyerNameInput] = useState('');
  const [mpesaCodeInput, setMpesaCodeInput] = useState('');
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(
    null
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState('');

  // Creator / Admin bypass
  const [showCreatorLogin, setShowCreatorLogin] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSearchCrawlerBot()) {
      setIsUnlocked(true);
      setCheckingSaved(false);
      return;
    }

    try {
      const adminToken = localStorage.getItem(ADMIN_2FA_TOKEN_KEY);
      if (adminToken) {
        setIsUnlocked(true);
        setCheckingSaved(false);
        return;
      }

      const savedId = localStorage.getItem(VIDEO_BUTTON_UNLOCK_KEY);
      if (!savedId) {
        setCheckingSaved(false);
        return;
      }

      fetch(
        `/api/resources/download?checkoutRequestId=${encodeURIComponent(
          savedId
        )}`
      )
        .then((r) => r.json())
        .then((d) => {
          if (d?.status === 'COMPLETED') {
            setIsUnlocked(true);
          }
        })
        .catch(() => {})
        .finally(() => setCheckingSaved(false));
    } catch {
      setCheckingSaved(false);
    }
  }, []);

  // Poll pending $15 M-Pesa order until COMPLETED
  useEffect(() => {
    if (!pendingCheckoutId || isUnlocked) return;
    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/resources/download?checkoutRequestId=${encodeURIComponent(
            pendingCheckoutId
          )}`
        );
        const data = await res.json();
        if (data?.status === 'COMPLETED') {
          clearInterval(timer);
          try {
            localStorage.setItem(VIDEO_BUTTON_UNLOCK_KEY, pendingCheckoutId);
            window.dispatchEvent(new CustomEvent('cbc-video-button-unlocked'));
          } catch {}
          setPendingCheckoutId(null);
          setIsSubmitting(false);
          setIsUnlocked(true);
        } else if (data?.status === 'FAILED') {
          clearInterval(timer);
          setPendingCheckoutId(null);
          setIsSubmitting(false);
          setFeedback(
            'M-Pesa prompt was cancelled or timed out. Please try again or paste your M-Pesa confirmation code.'
          );
        }
      } catch {}
    }, 2200);

    return () => clearInterval(timer);
  }, [isUnlocked, pendingCheckoutId]);

  const handleStkUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback(
      `Sending $${TUTOR_PETER_VIDEO_PRICE_USD} (KSh ${TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()}) M-Pesa STK prompt to your phone… Enter your PIN (Fuliza supported!).`
    );
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneInput.trim(),
          buyerName: buyerNameInput.trim(),
          serviceType: 'TUTOR_PETER_VIDEO',
          bookTitle: contextTitle
            ? `Videos Button Unlock ($15): ${contextTitle.slice(0, 90)}`
            : "Tutor Peter's Videos Button Unlock ($15 / KSh 1,950)",
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutRequestId) {
        setPendingCheckoutId(data.checkoutRequestId);
        setFeedback(
          'M-Pesa prompt sent! Enter your M-Pesa PIN — the VIDEOS hub unlocks automatically in 1 second!'
        );
      } else {
        setIsSubmitting(false);
        setFeedback(data.error || 'Could not send M-Pesa prompt.');
      }
    } catch {
      setIsSubmitting(false);
      setFeedback('Network error sending M-Pesa prompt.');
    }
  };

  const handleCodeUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFeedback('Verifying your M-Pesa confirmation code…');
    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode: mpesaCodeInput.trim(),
          phoneNumber: phoneInput.trim(),
          buyerName: buyerNameInput.trim(),
          serviceType: 'TUTOR_PETER_VIDEO',
          bookTitle: contextTitle
            ? `Videos Button Unlock ($15): ${contextTitle.slice(0, 90)}`
            : "Tutor Peter's Videos Button Unlock ($15 / KSh 1,950)",
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutRequestId) {
        setPendingCheckoutId(data.checkoutRequestId);
        setFeedback(
          'M-Pesa code received! Keep this window open — unlocks automatically upon verification.'
        );
      } else {
        setIsSubmitting(false);
        setFeedback(data.error || 'Invalid M-Pesa code.');
      }
    } catch {
      setIsSubmitting(false);
      setFeedback('Network error verifying M-Pesa code.');
    }
  };

  const handleCreatorUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassword.trim()) return;
    try {
      const res = await fetch('/api/social/omnichannel-autopost', {
        headers: { 'x-admin-password': adminPassword.trim() },
      });
      if (res.ok) {
        setIsUnlocked(true);
      } else {
        setFeedback('Invalid Creator/Admin Password.');
      }
    } catch {}
  };

  if (isUnlocked) {
    return <>{children}</>;
  }

  return (
    <div className="p-4 sm:p-8 flex items-center justify-center">
      <div className="max-w-xl w-full rounded-3xl bg-slate-950 text-white border-2 border-amber-400/70 shadow-2xl p-6 sm:p-8 space-y-5">
        {/* Top Locked Header with Tutor Peter Portrait */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tutor-peter-portrait.jpg"
              alt="Tutor Peter"
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover border-2 border-amber-400"
            />
            <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-red-600 border-2 border-slate-950 flex items-center justify-center">
              <Lock className="w-3.5 h-3.5 text-white" />
            </span>
          </div>

          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-300 text-[10px] font-black uppercase tracking-widest">
              <Lock className="w-3 h-3" />
              <span>LOCKED VIDEOS BUTTON • ${TUTOR_PETER_VIDEO_PRICE_USD}</span>
            </div>
            <h3 className="text-lg sm:text-2xl font-black leading-tight">
              Unlock Tutor Peter&apos;s Whiteboard Videos
            </h3>
            <p className="text-xs text-emerald-300 font-bold">
              Price: ${TUTOR_PETER_VIDEO_PRICE_USD} USD (KSh{' '}
              {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()}) • Full Access
            </p>
          </div>
        </div>

        {contextTitle && (
          <div className="rounded-2xl bg-white/5 border border-white/10 px-4 py-2.5 text-xs text-slate-200 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-300 shrink-0" />
            <span className="line-clamp-1">
              Selected Class: <strong>{contextTitle}</strong>
            </span>
          </div>
        )}

        <ul className="space-y-1.5 text-xs text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Unlocks the <strong>VIDEOS</strong> button across all 6,534+ CBC
              Materials (PP1 – Grade 12)
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Watch Tutor Peter&apos;s step-by-step Whiteboard Demonstrations +
              Worked Examples in Full HD
            </span>
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              Instant 1-Second M-Pesa STK Prompt Unlock (Works with Fuliza too!)
            </span>
          </li>
        </ul>

        {/* Payment Tabs */}
        <div className="flex items-center gap-2 bg-white/10 p-1 rounded-xl text-xs font-bold">
          <button
            type="button"
            onClick={() => setPayTab('STK')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              payTab === 'STK'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'text-slate-200'
            }`}
          >
            1. Instant M-Pesa Prompt ($15)
          </button>
          <button
            type="button"
            onClick={() => setPayTab('CODE')}
            className={`flex-1 py-2 rounded-lg transition cursor-pointer ${
              payTab === 'CODE'
                ? 'bg-amber-400 text-slate-950 font-black'
                : 'text-slate-200'
            }`}
          >
            2. Paste M-Pesa Code
          </button>
        </div>

        {checkingSaved ? (
          <div className="py-6 flex items-center justify-center gap-2 text-xs text-amber-200">
            <Loader2 className="w-4 h-4 animate-spin" />
            <span>Checking your Video Access Pass…</span>
          </div>
        ) : payTab === 'STK' ? (
          <form onSubmit={handleStkUnlock} className="space-y-3">
            <input
              type="tel"
              required
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Enter Safaricom M-Pesa Number (e.g. 0712345678)"
              className="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 text-sm font-bold"
            />
            <input
              type="text"
              value={buyerNameInput}
              onChange={(e) => setBuyerNameInput(e.target.value)}
              placeholder="Your Name (Optional)"
              className="w-full px-4 py-3 rounded-xl bg-white/95 text-slate-950 text-sm"
            />
            <button
              type="submit"
              disabled={isSubmitting && Boolean(pendingCheckoutId)}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
            >
              {pendingCheckoutId ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Waiting for M-Pesa PIN Confirmation…</span>
                </>
              ) : (
                <>
                  <Smartphone className="w-4 h-4" />
                  <span>
                    Unlock Videos Button — ${TUTOR_PETER_VIDEO_PRICE_USD} (KSh{' '}
                    {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()})
                  </span>
                </>
              )}
            </button>
          </form>
        ) : (
          <form onSubmit={handleCodeUnlock} className="space-y-3">
            <p className="text-xs text-amber-200">
              Send{' '}
              <strong>
                KSh {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()} ($
                {TUTOR_PETER_VIDEO_PRICE_USD})
              </strong>{' '}
              to M-Pesa <strong>0728595160</strong>, then paste your confirmation
              code below:
            </p>
            <input
              type="text"
              required
              value={mpesaCodeInput}
              onChange={(e) => setMpesaCodeInput(e.target.value)}
              placeholder="Paste M-Pesa Code (e.g. UKJ4D383OY) or Full SMS"
              className="w-full px-4 py-3.5 rounded-xl bg-white text-slate-950 text-sm font-mono uppercase"
            />
            <input
              type="tel"
              value={phoneInput}
              onChange={(e) => setPhoneInput(e.target.value)}
              placeholder="Your Phone Number"
              className="w-full px-4 py-3 rounded-xl bg-white/95 text-slate-950 text-sm"
            />
            <button
              type="submit"
              className="w-full py-4 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              <Unlock className="w-4 h-4" />
              <span>Verify M-Pesa Code &amp; Unlock Videos</span>
            </button>
          </form>
        )}

        {feedback && (
          <div className="rounded-xl bg-white/10 border border-amber-300/40 px-4 py-3 text-xs font-semibold text-amber-200 flex flex-wrap items-center justify-between gap-2">
            <span>{feedback}</span>
            <a
              href="https://wa.me/254705759072?text=Hello%20Tutor%20Peter%2C%20I%20need%20help%20unlocking%20the%20%2415%20Videos%20Button"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        )}

        {/* Creator / Admin Bypass Toggle for Tutor Peter */}
        <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-slate-400">
          <span>Tutor Peter / Admin Studio</span>
          <button
            type="button"
            onClick={() => setShowCreatorLogin((s) => !s)}
            className="inline-flex items-center gap-1 text-slate-300 hover:text-white font-bold cursor-pointer"
          >
            <KeyRound className="w-3 h-3" />
            <span>Creator Unlock</span>
          </button>
        </div>

        {showCreatorLogin && (
          <form onSubmit={handleCreatorUnlock} className="flex gap-2">
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Password"
              className="flex-1 px-3 py-2 rounded-xl bg-white text-slate-950 text-xs"
            />
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-black cursor-pointer"
            >
              Open
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
