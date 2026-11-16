'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Mail,
  Phone,
  RefreshCw,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';

interface AdminTwoFactorGateProps {
  portalName: string;
  portalSubtitle: string;
  portalPath: string;
  accent?: 'emerald' | 'amber';
  onVerified: (verifiedPassword: string) => Promise<void> | void;
}

export const ADMIN_2FA_TOKEN_KEY = 'cbc_admin_2fa_token_v1';

export default function AdminTwoFactorGate({
  portalName,
  portalSubtitle,
  portalPath,
  accent = 'emerald',
  onVerified,
}: AdminTwoFactorGateProps) {
  const [step, setStep] = useState<'CHECKING' | 'PASSWORD' | 'CHALLENGE' | 'BLOCKED'>(
    'CHECKING'
  );
  const [password, setPassword] = useState('');
  const [selectedPhone, setSelectedPhone] = useState<'PRIMARY' | 'SECONDARY'>(
    'PRIMARY'
  );
  const maskedPhoneDisplay =
    selectedPhone === 'SECONDARY' ? '0705***072' : '0728***160';
  const maskedEmailDisplay = 'aca*******55@gmail.com';

  const [challengeId, setChallengeId] = useState('');
  const [matchNumber, setMatchNumber] = useState<number | null>(null);
  const [phoneDispatched, setPhoneDispatched] = useState(false);
  const [emailDispatched, setEmailDispatched] = useState(false);
  const [otpCode, setOtpCode] = useState('');

  const [busy, setBusy] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // On mount: check if current browser tab already holds a valid 2FA session token + password
  useEffect(() => {
    const savedPw = sessionStorage.getItem('cbc_admin_pw') || '';
    const savedToken = sessionStorage.getItem(ADMIN_2FA_TOKEN_KEY) || '';
    if (!savedPw || !savedToken) {
      setStep('PASSWORD');
      return;
    }

    fetch('/api/admin/security', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'validate_session',
        sessionToken: savedToken,
      }),
    })
      .then((r) => r.json())
      .then(async (data) => {
        if (data?.valid) {
          setPassword(savedPw);
          await onVerified(savedPw);
        } else {
          sessionStorage.removeItem(ADMIN_2FA_TOKEN_KEY);
          setStep('PASSWORD');
        }
      })
      .catch(() => {
        setStep('PASSWORD');
      });
  }, [onVerified]);

  // Poll every 2s during CHALLENGE step for 1-Tap Mobile Click approval!
  useEffect(() => {
    if (step !== 'CHALLENGE' || !challengeId || !password) return;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/admin/security', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_challenge',
            challengeId,
          }),
        });
        const data = await res.json();

        if (data.status === 'APPROVED' && data.sessionToken) {
          window.clearInterval(timer);
          sessionStorage.setItem('cbc_admin_pw', password);
          sessionStorage.setItem(ADMIN_2FA_TOKEN_KEY, data.sessionToken);
          await onVerified(password);
        } else if (data.status === 'DENIED') {
          window.clearInterval(timer);
          setStep('BLOCKED');
          setErrorMsg(
            'Sign-in was BLOCKED from your CBC Admin Mobile App! Your IP has been locked out for security.'
          );
        } else if (data.status === 'EXPIRED') {
          window.clearInterval(timer);
          setStep('PASSWORD');
          setErrorMsg('2-Step verification challenge expired. Sign in again.');
        }
      } catch {
        // Ignore transient network hiccups during polling
      }
    }, 2000);

    return () => window.clearInterval(timer);
  }, [step, challengeId, password, onVerified]);

  const handleStart2fa = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setBusy(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'start_2fa',
          password: password.trim(),
          selectedPhone,
          portal: portalPath,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data.error || 'Authentication failed.');
        return;
      }

      if (data.verifiedImmediately && data.sessionToken) {
        sessionStorage.setItem('cbc_admin_pw', password.trim());
        sessionStorage.setItem(ADMIN_2FA_TOKEN_KEY, data.sessionToken);
        await onVerified(password.trim());
        return;
      }

      setChallengeId(data.challengeId);
      setMatchNumber(data.matchNumber);
      setPhoneDispatched(Boolean(data.phoneDispatched));
      setEmailDispatched(Boolean(data.emailDispatched));
      setOtpCode('');
      setStep('CHALLENGE');
    } catch {
      setErrorMsg('Network error starting 2-Step Verification.');
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) return;
    setBusy(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/admin/security', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'verify_otp',
          challengeId,
          otpCode: otpCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok || !data.verified) {
        setErrorMsg(data.error || 'Incorrect OTP code.');
        return;
      }

      sessionStorage.setItem('cbc_admin_pw', password.trim());
      sessionStorage.setItem(ADMIN_2FA_TOKEN_KEY, data.sessionToken);
      await onVerified(password.trim());
    } catch {
      setErrorMsg('Network error verifying OTP.');
    } finally {
      setBusy(false);
    }
  };

  const isAmber = accent === 'amber';

  if (step === 'CHECKING') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
        <div className="flex items-center gap-3 text-slate-300 text-sm font-bold">
          <Loader2 className="w-5 h-5 animate-spin text-emerald-400" />
          Verifying encrypted security session...
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-2xl max-w-md w-full p-6 space-y-5">
        {/* Top Brand Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-11 h-11 rounded-2xl flex items-center justify-center ${
                isAmber
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-emerald-100 text-emerald-700'
              }`}
            >
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h1 className="font-black text-slate-900 text-base sm:text-lg leading-tight">
                {portalName}
              </h1>
              <p className="text-xs text-slate-500">{portalSubtitle}</p>
            </div>
          </div>
          <Link
            href="/"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1 shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Storefront
          </Link>
        </div>

        {/* Anti-Hacker Security Badge */}
        <div className="bg-slate-900 text-white rounded-2xl p-3.5 flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-bold">2-Step Anti-Hacker Shield Active</span>
          </div>
          <span className="text-[10px] font-mono text-emerald-300">
            OTP + Email + Mobile Click
          </span>
        </div>

        {step === 'BLOCKED' ? (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-2xl p-5 text-center space-y-3">
            <ShieldAlert className="w-10 h-10 text-rose-600 mx-auto" />
            <h2 className="text-sm font-black text-rose-900 uppercase">
              Sign-In Blocked by Mobile Click!
            </h2>
            <p className="text-xs text-rose-700 leading-relaxed">{errorMsg}</p>
          </div>
        ) : step === 'PASSWORD' ? (
          <form onSubmit={handleStart2fa} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Step 1: Admin Password
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter ADMIN_PASSWORD..."
                  className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase mb-1.5">
                Select Security Phone for OTP
              </label>
              <div className="grid grid-cols-2 gap-2">
                {(
                  [
                    { slot: 'PRIMARY', label: '0728***160' },
                    { slot: 'SECONDARY', label: '0705***072' },
                  ] as const
                ).map((ph) => (
                  <button
                    key={ph.slot}
                    type="button"
                    onClick={() => setSelectedPhone(ph.slot)}
                    className={`py-2.5 px-3 rounded-xl border text-xs font-black flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      selectedPhone === ph.slot
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-900'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-600" />
                    {ph.label}
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>
                  2-Step Email:{' '}
                  <strong className="text-slate-700">{maskedEmailDisplay}</strong> +
                  Mobile Click
                </span>
              </p>
            </div>

            {errorMsg && (
              <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3 font-semibold">
                {errorMsg}
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className={`w-full font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer ${
                isAmber
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Continue to 2-Step Verification &rarr;
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            {/* OPTION A: 1-TAP MOBILE CLICK LIVE PROMPT */}
            <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase text-emerald-900">
                  <Smartphone className="w-4 h-4 text-emerald-700" />
                  Fastest: Mobile Click Approval
                </span>
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Waiting for tap...
                </span>
              </div>

              <div className="flex items-center gap-3 bg-white border border-emerald-200 rounded-xl p-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 text-amber-300 font-black text-xl flex items-center justify-center shrink-0">
                  #{matchNumber}
                </div>
                <div className="text-xs text-slate-700 leading-snug">
                  Open your{' '}
                  <Link
                    href="/mobile-admin"
                    target="_blank"
                    className="font-black text-emerald-700 underline"
                  >
                    CBC Admin Mobile App
                  </Link>{' '}
                  on your phone and tap{' '}
                  <strong className="text-emerald-800">
                    Allow Login #{matchNumber}
                  </strong>{' '}
                  — this screen unlocks automatically!
                </div>
              </div>
            </div>

            {/* OPTION B: 6-DIGIT SECURITY OTP */}
            <form onSubmit={handleVerifyOtp} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Or Enter 6-Digit Security OTP Code
                </label>
                <p className="text-[11px] text-slate-500 mb-2 leading-relaxed">
                  {phoneDispatched ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Sent to {maskedPhoneDisplay}.{' '}
                    </span>
                  ) : (
                    <span>Phone target: {maskedPhoneDisplay}. </span>
                  )}
                  {emailDispatched ? (
                    <span className="text-emerald-700 font-semibold">
                      ✓ Emailed to {maskedEmailDisplay}.{' '}
                    </span>
                  ) : (
                    <span>Email: {maskedEmailDisplay}. </span>
                  )}
                  You can also enter the live 6-digit{' '}
                  <strong>Mobile App Authenticator code</strong>!
                </p>

                <div className="relative">
                  <KeyRound className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                  <input
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="000000"
                    value={otpCode}
                    onChange={(e) =>
                      setOtpCode(e.target.value.replace(/\D/g, '').slice(0, 6))
                    }
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-xl text-center font-mono text-lg font-black tracking-[0.35em] text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {errorMsg && (
                <div className="text-xs text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-2.5 font-semibold">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={busy || otpCode.length !== 6}
                className="w-full bg-slate-900 hover:bg-slate-800 disabled:bg-slate-300 text-white font-black py-3 rounded-xl text-sm transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {busy ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                )}
                Verify 6-Digit Code &amp; Unlock
              </button>
            </form>

            <div className="flex items-center justify-between pt-1 text-xs">
              <button
                type="button"
                onClick={() => handleStart2fa()}
                disabled={busy}
                className="text-emerald-700 font-bold hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <RefreshCw className="w-3 h-3" />
                Resend Code
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep('PASSWORD');
                  setErrorMsg('');
                }}
                className="text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
              >
                Change Phone ({selectedPhone === 'PRIMARY' ? '0705***072' : '0728***160'})
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
