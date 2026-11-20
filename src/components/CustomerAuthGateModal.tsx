'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Loader2,
  LogIn,
  Mail,
  Phone,
  Sparkles,
  UserCheck,
  UserPlus,
  X,
} from 'lucide-react';
import { isSearchCrawlerBot } from './LuxuryWelcomeSong';

export const CUSTOMER_SESSION_STORAGE_KEY = 'cbc_customer_member_v1';
const TWO_MINUTES_AFTER_SONG_MS = 120 * 1000; // 2 minutes (120s) AFTER welcome song finishes

export interface CustomerSessionInfo {
  id: string;
  email: string;
  phone: string;
  fullName: string;
  role: string;
  createdAt: string;
}

declare global {
  interface Window {
    __cbcWelcomeSongCompletedAt?: number;
    __cbcLearnerTuitionModalOpen?: boolean;
  }
}

export default function CustomerAuthGateModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'signup' | 'login'>('signup');
  const [member, setMember] = useState<CustomerSessionInfo | null>(null);
  const [guestContinued, setGuestContinued] = useState(false);

  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState<'Teacher' | 'Parent' | 'Learner'>('Teacher');
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const twoMinTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const armedAfterSongRef = useRef(false);

  // Load existing signed-in member if already registered on this device
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as CustomerSessionInfo;
        if (parsed?.email) {
          setMember(parsed);
          window.dispatchEvent(
            new CustomEvent('cbc-customer-session-changed', { detail: parsed })
          );
        }
      }
    } catch {}
  }, []);

  const scheduleTwoMinutePopupAfterSong = useCallback(() => {
    if (armedAfterSongRef.current) return;
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (path.startsWith('/admin') || path.startsWith('/mobile-admin')) return;
    if (isSearchCrawlerBot()) return;

    // Don't interrupt someone who is already signed in!
    try {
      if (localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)) return;
    } catch {}

    armedAfterSongRef.current = true;
    if (twoMinTimerRef.current) clearTimeout(twoMinTimerRef.current);

    const openSafelyOrDefer = () => {
      try {
        if (localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)) return;
      } catch {}
      if (window.__cbcLearnerTuitionModalOpen) {
        twoMinTimerRef.current = setTimeout(openSafelyOrDefer, 25000);
        return;
      }
      setErrorMsg('');
      setSuccessMsg('');
      setIsOpen(true);
    };

    twoMinTimerRef.current = setTimeout(openSafelyOrDefer, TWO_MINUTES_AFTER_SONG_MS);
  }, []);

  // Listen for exact completion of the 1-Minute Mandatory Welcome Song -> then count 2 minutes of browsing!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (path.startsWith('/admin') || path.startsWith('/mobile-admin')) return;

    if (window.__cbcWelcomeSongCompletedAt) {
      const alreadyElapsed = Date.now() - window.__cbcWelcomeSongCompletedAt;
      const remaining = Math.max(1000, TWO_MINUTES_AFTER_SONG_MS - alreadyElapsed);
      armedAfterSongRef.current = true;
      twoMinTimerRef.current = setTimeout(() => {
        try {
          if (localStorage.getItem(CUSTOMER_SESSION_STORAGE_KEY)) return;
        } catch {}
        setIsOpen(true);
      }, remaining);
    }

    const onSongFinished = () => {
      scheduleTwoMinutePopupAfterSong();
    };

    const onManualOpen = (ev: Event) => {
      const custom = ev as CustomEvent<{ mode?: 'signup' | 'login' }>;
      if (custom.detail?.mode) {
        setMode(custom.detail.mode);
      }
      setErrorMsg('');
      setSuccessMsg('');
      setIsOpen(true);
    };

    window.addEventListener('cbc-compulsory-song-completed', onSongFinished);
    window.addEventListener('cbc-open-customer-auth', onManualOpen);

    return () => {
      window.removeEventListener(
        'cbc-compulsory-song-completed',
        onSongFinished
      );
      window.removeEventListener('cbc-open-customer-auth', onManualOpen);
      if (twoMinTimerRef.current) clearTimeout(twoMinTimerRef.current);
    };
  }, [scheduleTwoMinutePopupAfterSong]);

  // Lock page scroll while modal is open
  useEffect(() => {
    if (typeof document === 'undefined') return;
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleSkipOrContinueAsGuest = () => {
    setGuestContinued(true);
    setIsOpen(false);
    window.dispatchEvent(
      new CustomEvent('cbc-customer-guest-mode', { detail: { guest: true } })
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await fetch('/api/customers/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: mode,
          email: email.trim(),
          phone: phone.trim(),
          fullName: fullName.trim(),
          role,
          sourcePath:
            typeof window !== 'undefined'
              ? window.location.pathname + window.location.search
              : '/',
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.ok) {
        setErrorMsg(data.error || 'Could not complete request.');
        setSubmitting(false);
        return;
      }

      const savedCustomer = data.customer as CustomerSessionInfo;
      setMember(savedCustomer);
      setGuestContinued(false);
      try {
        localStorage.setItem(
          CUSTOMER_SESSION_STORAGE_KEY,
          JSON.stringify(savedCustomer)
        );
      } catch {}
      window.dispatchEvent(
        new CustomEvent('cbc-customer-session-changed', {
          detail: savedCustomer,
        })
      );

      setSuccessMsg(
        mode === 'signup'
          ? `Welcome, ${savedCustomer.fullName}! Your account is registered on CBCMATERIALS.SHOP.`
          : `Welcome back, ${savedCustomer.fullName}!`
      );

      setTimeout(() => {
        setIsOpen(false);
        setSubmitting(false);
      }, 950);
    } catch {
      setErrorMsg('Network error — please try again or continue as Guest.');
      setSubmitting(false);
    }
  };

  const handleSignOutMember = () => {
    try {
      localStorage.removeItem(CUSTOMER_SESSION_STORAGE_KEY);
    } catch {}
    setMember(null);
    window.dispatchEvent(
      new CustomEvent('cbc-customer-session-changed', { detail: null })
    );
    setIsOpen(false);
  };

  void guestContinued;

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign Up, Login or Continue as Guest on CBCMATERIALS.SHOP"
      className="fixed inset-0 z-[125] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
    >
      <div className="relative max-w-md w-full rounded-3xl bg-slate-900 text-white border-2 border-amber-400/60 shadow-[0_25px_80px_rgba(0,0,0,0.85)] p-6 sm:p-7 space-y-5">
        {/* Top Skip / Close Button */}
        <button
          type="button"
          onClick={handleSkipOrContinueAsGuest}
          title="Skip for now & continue as Guest"
          className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-200 transition cursor-pointer"
        >
          <span>Skip</span>
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Brand Header */}
        <div className="flex items-center gap-3 pr-14">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cbcmaterials-logo.jpg"
            alt="CBCMATERIALS.SHOP"
            className="w-12 h-12 rounded-2xl bg-white border-2 border-amber-300 object-cover shrink-0"
          />
          <div>
            <div className="inline-flex items-center gap-1 text-sm font-black uppercase tracking-tight">
              <span className="text-amber-300">CBC</span>
              <span className="text-emerald-300">MATERIALS</span>
              <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white text-xs">
                .SHOP
              </span>
            </div>
            <h2 className="text-base sm:text-lg font-black leading-snug mt-0.5">
              {member
                ? `Signed In as ${member.fullName}`
                : 'Sign Up or Login to Your Account'}
            </h2>
          </div>
        </div>

        {member ? (
          <div className="space-y-4 text-xs">
            <div className="rounded-2xl bg-emerald-950/60 border border-emerald-500/40 p-4 space-y-1.5">
              <p className="font-black text-emerald-300 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                <span>Active Member Profile</span>
              </p>
              <p className="text-slate-200">
                <strong>Email:</strong> {member.email}
              </p>
              <p className="text-slate-200">
                <strong>Phone:</strong> {member.phone}
              </p>
              <p className="text-slate-300">
                <strong>Role:</strong> {member.role}
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="flex-1 py-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black cursor-pointer"
              >
                Continue Browsing
              </button>
              <button
                type="button"
                onClick={handleSignOutMember}
                className="px-4 py-3 rounded-xl bg-white/10 hover:bg-rose-600 text-white font-bold cursor-pointer"
              >
                Sign Out
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="text-xs text-slate-300 leading-relaxed">
              Create your free member profile with your{' '}
              <strong className="text-amber-300">Email &amp; Phone Number</strong>{' '}
              for instant CBC updates &amp; faster M-Pesa downloads — or
              continue as a Guest anytime.
            </p>

            {/* Sign Up vs Login Tabs */}
            <div className="grid grid-cols-2 gap-1.5 bg-slate-950 p-1 rounded-2xl border border-slate-800 text-xs font-black">
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-gradient-to-r from-amber-300 to-emerald-300 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Sign Up</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMsg('');
                }}
                className={`py-2.5 rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer ${
                  mode === 'login'
                    ? 'bg-gradient-to-r from-amber-300 to-emerald-300 text-slate-950'
                    : 'text-slate-300 hover:text-white'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Login</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Email (Required) */}
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your Email Address (Required)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-950 text-sm font-semibold"
                />
              </div>

              {/* Phone Number (Required) */}
              <div className="relative">
                <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="Your Phone / WhatsApp Number (Required)"
                  className="w-full pl-10 pr-4 py-3 rounded-xl bg-white text-slate-950 text-sm font-semibold"
                />
              </div>

              {mode === 'signup' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your Name (Optional)"
                    className="px-3.5 py-2.5 rounded-xl bg-white/95 text-slate-950 text-xs font-medium"
                  />
                  <select
                    value={role}
                    onChange={(e) =>
                      setRole(
                        e.target.value as 'Teacher' | 'Parent' | 'Learner'
                      )
                    }
                    aria-label="Select your role"
                    className="px-3.5 py-2.5 rounded-xl bg-white/95 text-slate-950 text-xs font-bold"
                  >
                    <option value="Teacher">I am a Teacher</option>
                    <option value="Parent">I am a Parent</option>
                    <option value="Learner">I am a Learner</option>
                  </select>
                </div>
              )}

              {errorMsg && (
                <div className="rounded-xl bg-rose-500/20 border border-rose-400/50 px-3.5 py-2.5 text-xs font-semibold text-rose-200">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="rounded-xl bg-emerald-500/20 border border-emerald-400/50 px-3.5 py-2.5 text-xs font-bold text-emerald-200 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>{successMsg}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Your Account…</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>
                      {mode === 'signup'
                        ? 'Create Free Account Now'
                        : 'Login to Account'}
                    </span>
                  </>
                )}
              </button>
            </form>

            {/* Prominent Guest / Skip Option */}
            <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-2">
              <button
                type="button"
                onClick={handleSkipOrContinueAsGuest}
                className="w-full sm:w-auto flex-1 py-2.5 px-4 rounded-xl bg-white/10 hover:bg-white/15 border border-white/15 text-slate-200 font-bold text-xs transition cursor-pointer"
              >
                Continue as a Guest
              </button>
              <button
                type="button"
                onClick={handleSkipOrContinueAsGuest}
                className="w-full sm:w-auto py-2.5 px-4 rounded-xl text-slate-400 hover:text-white font-bold text-xs transition cursor-pointer"
              >
                Skip for Now →
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center leading-snug">
              Protected under the Kenya Data Protection Act (2019). By signing
              up, you agree to our{' '}
              <Link
                href="/privacy-policy"
                onClick={() => setIsOpen(false)}
                className="underline text-emerald-300 hover:text-white"
              >
                Privacy Policy
              </Link>{' '}
              &amp;{' '}
              <Link
                href="/terms"
                onClick={() => setIsOpen(false)}
                className="underline text-emerald-300 hover:text-white"
              >
                Terms
              </Link>
              .
            </p>
          </>
        )}
      </div>
    </div>
  );
}
