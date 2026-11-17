'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  Award,
  Check,
  CheckCircle2,
  Clock,
  Coins,
  Copy,
  Gamepad2,
  Loader2,
  LogOut,
  MessageCircle,
  Smartphone,
  Sparkles,
  Trophy,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { ALL_GRADE_KEYS, formatGradeLabel } from '@/lib/material-utils';
import { AdSlot, useMonetization } from '@/components/MonetizationEngine';
import {
  COORDINATOR_MPESA_LOCAL,
  COORDINATOR_WHATSAPP_LOCAL,
} from '@/lib/tuition';
import {
  ALL_GAMING_SUBJECTS,
  GAMING_FEE_KES,
  POINTS_PER_QUESTION,
  REDEEM_KES_VALUE,
  REDEEM_POINTS_REQUIRED,
  type GamingPlayer,
  type PublicGameQuestion,
} from '@/lib/gaming';

const STORAGE_SESSION_KEY = 'cbc_gaming_session_v1';

function formatCountdown(totalSec: number): string {
  const clamped = Math.max(0, Math.floor(totalSec));
  const mins = Math.floor(clamped / 60);
  const secs = clamped % 60;
  return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
}

export interface ExternalGameLaunch {
  subject: string;
  gradeKey: string;
  tick: number;
}

export default function SubjectGamingHub({
  externalLaunch,
}: {
  externalLaunch?: ExternalGameLaunch | null;
}) {
  const { trackInteraction } = useMonetization();

  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'ACTIVATE' | 'PLAYING' | 'LOGGED_OUT'>('ACTIVATE');

  // Player & Subject Setup
  const [playerName, setPlayerName] = useState('');
  const [phone, setPhone] = useState('');
  const [gradeKey, setGradeKey] = useState('7');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [savedPointsLookup, setSavedPointsLookup] = useState<number | null>(null);

  // KSh 10 M-Pesa STK Push (Primary) + Direct M-Pesa Code Activation State
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('STK');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedMpesa, setCopiedMpesa] = useState(false);
  const [whatsappNotifyUrl, setWhatsappNotifyUrl] = useState('');
  const [stkProcessing, setStkProcessing] = useState(false);
  const [stkWaitingPin, setStkWaitingPin] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Live 1-Hour Gaming Session State
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [expiresAt, setExpiresAt] = useState<number>(0);
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);
  const [player, setPlayer] = useState<GamingPlayer | null>(null);
  const [sessionPoints, setSessionPoints] = useState<number>(0);
  const [question, setQuestion] = useState<PublicGameQuestion | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [answerResult, setAnswerResult] = useState<{
    correct: boolean;
    correctIndex: number;
    explanation: string;
  } | null>(null);
  const [pendingNextQuestion, setPendingNextQuestion] =
    useState<PublicGameQuestion | null>(null);
  const [submittingAnswer, setSubmittingAnswer] = useState(false);

  // Redemption State (1,000 pts -> KSh 5)
  const [redeeming, setRedeeming] = useState(false);
  const [redeemSuccess, setRedeemSuccess] = useState<{
    referenceCode: string;
    amountKes: number;
    whatsappClaimUrl: string;
  } | null>(null);

  const performAutoLogout = useCallback(() => {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch {}
    setSessionId(null);
    setExpiresAt(0);
    setRemainingSeconds(0);
    setQuestion(null);
    setPendingNextQuestion(null);
    setSelectedOpt(null);
    setAnswerResult(null);
    setView('LOGGED_OUT');
  }, []);

  // Check if an active (< 1 hour) session exists when opening modal
  const tryResumeActiveSession = useCallback(
    async (targetSubject?: string, targetGrade?: string) => {
      try {
        const raw = localStorage.getItem(STORAGE_SESSION_KEY);
        if (!raw) return false;
        const parsed = JSON.parse(raw) as {
          sessionId: string;
          expiresAt: number;
          phone: string;
          playerName: string;
        };
        if (!parsed.sessionId || Date.now() >= parsed.expiresAt) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          return false;
        }

        const res = await fetch(
          `/api/gaming?sessionId=${encodeURIComponent(parsed.sessionId)}`
        );
        const data = await res.json();
        if (!res.ok || !data.active || data.expired) {
          localStorage.removeItem(STORAGE_SESSION_KEY);
          return false;
        }

        setSessionId(parsed.sessionId);
        setExpiresAt(data.expiresAt);
        setRemainingSeconds(data.remainingSeconds);
        setPlayer(data.player);
        setPhone(parsed.phone || data.player?.phone || '');
        setPlayerName(parsed.playerName || data.player?.playerName || '');
        setSessionPoints(data.session?.sessionPoints || 0);
        setQuestion(data.question);
        setSelectedOpt(null);
        setAnswerResult(null);
        setPendingNextQuestion(null);
        setView('PLAYING');

        // If user clicked a specific subject card, switch active session to that subject!
        if (targetSubject && targetSubject !== data.session?.subject) {
          const swRes = await fetch('/api/gaming', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'switch_subject',
              sessionId: parsed.sessionId,
              subject: targetSubject,
              gradeKey: targetGrade || data.session?.gradeKey,
            }),
          });
          const swData = await swRes.json();
          if (swRes.ok && swData.nextQuestion) {
            setSubject(swData.subject);
            if (swData.gradeKey) setGradeKey(swData.gradeKey);
            setQuestion(swData.nextQuestion);
          }
        } else {
          setSubject(data.session?.subject || 'Mathematics');
          setGradeKey(data.session?.gradeKey || '7');
        }
        return true;
      } catch {
        return false;
      }
    },
    []
  );

  const openGamingForSubject = useCallback(
    async (chosenSubject: string, chosenGrade?: string) => {
      trackInteraction('gaming_arena_open');
      setSubject(chosenSubject || 'Mathematics');
      if (chosenGrade) setGradeKey(chosenGrade);
      setErrorMessage('');
      setStatusMessage('');
      setRedeemSuccess(null);
      setIsOpen(true);

      const resumed = await tryResumeActiveSession(chosenSubject, chosenGrade);
      if (!resumed) {
        fetch('/api/purchase-attempt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            channel: 'Gaming Pass',
            itemTitle: `20-Min Gaming Pass (${chosenSubject || 'All Subjects'})`,
            amountKes: 10,
            stage: 'OPENED_CHECKOUT',
          }),
        }).catch(() => {});
        setView('ACTIVATE');
      }
    },
    [trackInteraction, tryResumeActiveSession]
  );

  useEffect(() => {
    if (externalLaunch && externalLaunch.tick > 0) {
      openGamingForSubject(externalLaunch.subject, externalLaunch.gradeKey);
    }
  }, [externalLaunch, openGamingForSubject]);

  // Lookup saved points balance as learner types their phone number
  useEffect(() => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setSavedPointsLookup(null);
      return;
    }
    const timer = window.setTimeout(() => {
      fetch(`/api/gaming?phone=${encodeURIComponent(phone)}`)
        .then((r) => r.json())
        .then((d) => {
          if (d?.found) {
            setSavedPointsLookup(d.pointsBalance || 0);
            if (!playerName && d.playerName) setPlayerName(d.playerName);
          } else {
            setSavedPointsLookup(0);
          }
        })
        .catch(() => {});
    }, 450);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phone]);

  // STRICT 1-SECOND COUNTDOWN TIMER -> AUTOMATIC LOGOUT AT 1 HOUR (00:00)
  useEffect(() => {
    if (view !== 'PLAYING' || !expiresAt) return;

    const tick = () => {
      const diffSec = Math.floor((expiresAt - Date.now()) / 1000);
      if (diffSec <= 0) {
        performAutoLogout();
      } else {
        setRemainingSeconds(diffSec);
      }
    };

    tick();
    const timer = window.setInterval(tick, 1000);
    return () => window.clearInterval(timer);
  }, [view, expiresAt, performAutoLogout]);

  // Poll every 1.2s in a SINGLE atomic call -> instantly open 20-minute session on PIN confirmation!
  useEffect(() => {
    if (!stkWaitingPin || !checkoutRequestId) return;

    let cancelled = false;
    let inFlight = false;

    const checkAndOpenArena = async () => {
      if (inFlight || cancelled) return;
      inFlight = true;
      try {
        const actRes = await fetch('/api/gaming', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'activate',
            checkoutRequestId,
            phone,
            playerName: playerName || 'CBC Learner',
            gradeKey,
            subject,
          }),
        });
        const actData = await actRes.json();
        if (cancelled) return;

        if (actRes.ok && actData.active) {
          window.clearInterval(timer);
          setStkWaitingPin(false);
          setStatusMessage('');
          setSessionId(actData.sessionId);
          setExpiresAt(actData.expiresAt);
          setRemainingSeconds(actData.remainingSeconds);
          setPlayer(actData.player);
          setSessionPoints(actData.sessionPoints || 0);
          setQuestion(actData.question);
          setSelectedOpt(null);
          setAnswerResult(null);
          setPendingNextQuestion(null);
          try {
            localStorage.setItem(
              STORAGE_SESSION_KEY,
              JSON.stringify({
                sessionId: actData.sessionId,
                expiresAt: actData.expiresAt,
                phone,
                playerName: playerName || 'CBC Learner',
              })
            );
          } catch {}
          setView('PLAYING');
        } else if (actData.status === 'FAILED') {
          window.clearInterval(timer);
          setStkWaitingPin(false);
          setStatusMessage('');
          setErrorMessage(
            'M-Pesa STK prompt was cancelled or timed out. Click Activate to retry KSh 10 prompt.'
          );
        }
      } catch {
        // Continue polling
      } finally {
        inFlight = false;
      }
    };

    const initialTimer = window.setTimeout(checkAndOpenArena, 700);
    const timer = window.setInterval(checkAndOpenArena, 1200);

    return () => {
      cancelled = true;
      window.clearTimeout(initialTimer);
      window.clearInterval(timer);
    };
  }, [stkWaitingPin, checkoutRequestId, phone, playerName, gradeKey, subject]);

  const handleStartStkActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!playerName.trim()) {
      setErrorMessage('Please enter Learner Name first.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Enter a valid Safaricom M-Pesa number (e.g. 0712345678).');
      return;
    }

    setStkProcessing(true);
    trackInteraction('gaming_stk_initiate');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          serviceType: 'SUBJECT_GAMING',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(
          data.error ||
            `Could not send STK prompt. Switch to "2. Send to ${COORDINATOR_MPESA_LOCAL} & Paste Code" to activate right away.`
        );
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setStkWaitingPin(true);
      setStatusMessage(
        `Check your phone (${phone}) and enter your M-Pesa PIN to pay KSh ${GAMING_FEE_KES}. Your 20-minute session unlocks automatically!`
      );
    } catch {
      setErrorMessage('Network error initiating M-Pesa STK Push. Please try again.');
    } finally {
      setStkProcessing(false);
    }
  };

  const handleDirectMpesaActivation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setStatusMessage('');

    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setErrorMessage('Enter a valid Safaricom M-Pesa number (e.g. 0712345678).');
      return;
    }

    setStkProcessing(true);
    trackInteraction('gaming_stk_initiate');

    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode,
          phoneNumber: phone,
          serviceType: 'SUBJECT_GAMING',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setErrorMessage(data.error || 'Please paste a valid M-Pesa transaction code.');
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setWhatsappNotifyUrl(data.whatsappNotificationUrl || '');
      setStkWaitingPin(true);
      setStatusMessage(
        `M-Pesa code ${data.receiptCode || ''} received! Verifying your KSh ${GAMING_FEE_KES} payment to ${COORDINATOR_MPESA_LOCAL} — your 20-minute session opens automatically as soon as confirmed.`
      );
    } catch {
      setErrorMessage('Network error submitting M-Pesa code. Please try again.');
    } finally {
      setStkProcessing(false);
    }
  };

  const handleSelectOption = async (idx: number) => {
    if (!sessionId || !question || selectedOpt !== null || submittingAnswer) return;
    if (Date.now() >= expiresAt) {
      performAutoLogout();
      return;
    }

    setSelectedOpt(idx);
    setSubmittingAnswer(true);
    trackInteraction('gaming_question_answered');

    try {
      const res = await fetch('/api/gaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'answer',
          sessionId,
          token: question.token,
          selectedIndex: idx,
        }),
      });
      const data = await res.json();

      if (res.status === 401 || data.expired) {
        if (data.player) setPlayer(data.player);
        performAutoLogout();
        return;
      }

      if (res.ok) {
        if (data.player) setPlayer(data.player);
        if (typeof data.sessionPoints === 'number') setSessionPoints(data.sessionPoints);
        if (typeof data.remainingSeconds === 'number') {
          setRemainingSeconds(data.remainingSeconds);
        }
        setAnswerResult({
          correct: Boolean(data.correct),
          correctIndex: data.correctIndex,
          explanation: data.explanation || '',
        });
        setPendingNextQuestion(data.nextQuestion || null);
      }
    } catch {
      setSelectedOpt(null);
    } finally {
      setSubmittingAnswer(false);
    }
  };

  const handleNextQuestion = () => {
    if (Date.now() >= expiresAt) {
      performAutoLogout();
      return;
    }
    if (pendingNextQuestion) {
      setQuestion(pendingNextQuestion);
      setPendingNextQuestion(null);
      setSelectedOpt(null);
      setAnswerResult(null);
    }
  };

  const handleLiveSubjectSwitch = async (nextSubj: string) => {
    setSubject(nextSubj);
    if (!sessionId || view !== 'PLAYING') return;

    const res = await fetch('/api/gaming', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'switch_subject',
        sessionId,
        subject: nextSubj,
        gradeKey,
      }),
    });
    const data = await res.json();
    if (res.status === 401 || data.expired) {
      performAutoLogout();
      return;
    }
    if (res.ok && data.nextQuestion) {
      setQuestion(data.nextQuestion);
      setSelectedOpt(null);
      setAnswerResult(null);
      setPendingNextQuestion(null);
    }
  };

  const handleRedeemPoints = async () => {
    setRedeeming(true);
    setErrorMessage('');
    try {
      const res = await fetch('/api/gaming', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'redeem',
          sessionId: sessionId || '',
          phone,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setPlayer(data.player);
        setSavedPointsLookup(data.player.pointsBalance);
        setRedeemSuccess({
          referenceCode: data.redemption.referenceCode,
          amountKes: data.redemption.amountKes,
          whatsappClaimUrl: data.whatsappClaimUrl,
        });
      } else {
        setErrorMessage(data.error || 'Could not redeem points.');
      }
    } catch {
      setErrorMessage('Network error redeeming points.');
    } finally {
      setRedeeming(false);
    }
  };

  const currentPoints =
    player?.pointsBalance ?? (savedPointsLookup !== null ? savedPointsLookup : 0);
  const progressPct = Math.min(
    100,
    Math.round(((currentPoints % REDEEM_POINTS_REQUIRED) / REDEEM_POINTS_REQUIRED) * 100)
  );

  return (
    <>
      {/* ALL-SUBJECTS CBC PLAY & EARN GAMING ARENA BANNER */}
      <section
        id="cbc-subject-gaming-hub"
        aria-label="CBC All-Subjects Play & Earn Gaming Arena"
        className="mb-6 bg-gradient-to-br from-slate-950 via-indigo-950 to-emerald-950 text-white rounded-2xl p-5 shadow-md border border-amber-400/40 space-y-4"
      >
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow-lg">
              <Gamepad2 className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                  <Trophy className="w-3 h-3" />
                  Play &amp; Earn CBC Quiz Arena
                </span>
                <span className="text-[11px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-500/40 px-2.5 py-0.5 rounded-full">
                  1 Question = 1 Point • 1,000 Pts = KSh 5 • KSh 10 / 20-Min Pass
                </span>
              </div>
              <h2 className="text-base md:text-lg font-black tracking-tight text-white">
                CBC Subject Gaming — Answer Questions Across Any Subject &amp; Earn Real M-Pesa Rewards!
              </h2>
              <p className="text-xs text-slate-300">
                Earn <strong>1 point</strong> per correct question &amp; redeem{' '}
                <strong>1,000 points for KSh 5</strong>! Activate a{' '}
                <strong className="text-amber-300">
                  20-minute unlimited pass for just KSh 10 via instant M-Pesa STK Push!
                </strong>
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => openGamingForSubject(subject, gradeKey)}
            className="shrink-0 inline-flex items-center justify-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg transition cursor-pointer"
          >
            <Gamepad2 className="w-4 h-4" />
            <span>GAMING (ALL SUBJECTS)</span>
          </button>
        </div>

        {/* ALL SUBJECTS GAMING BUTTONS STRIP */}
        <div className="pt-3 border-t border-white/10">
          <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-300 mb-2">
            Choose Any CBC Subject to Start Playing (PP1 – Grade 12):
          </p>
          <div className="flex items-center gap-2 overflow-x-auto pb-1.5 no-scrollbar">
            {ALL_GAMING_SUBJECTS.map((subj) => (
              <button
                key={subj}
                type="button"
                onClick={() => openGamingForSubject(subj, gradeKey)}
                className="inline-flex items-center gap-1.5 bg-white/10 hover:bg-amber-400 hover:text-slate-950 border border-white/15 text-white text-xs font-bold px-3 py-1.5 rounded-xl whitespace-nowrap transition cursor-pointer"
              >
                <Gamepad2 className="w-3.5 h-3.5 text-amber-300" />
                <span>{subj}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* GAMING MODAL */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Top Header with Live Timer & Points Counter */}
            <div className="px-5 py-4 bg-slate-950 text-white flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Gamepad2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm sm:text-base font-black leading-tight">
                    CBC Subject Gaming Arena
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    1 Question = 1 Point • 1,000 Points = KSh 5
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                {/* Points Badge */}
                <div className="bg-slate-900 border border-amber-400/40 px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-black text-amber-300">
                  <Coins className="w-3.5 h-3.5" />
                  <span>{currentPoints.toLocaleString()} pts</span>
                </div>

                {/* Live 20-Minute Countdown Badge (when playing) */}
                {view === 'PLAYING' && (
                  <div
                    className={`px-3 py-1.5 rounded-xl flex items-center gap-1.5 text-xs font-mono font-black ${
                      remainingSeconds <= 120
                        ? 'bg-rose-600 text-white animate-pulse'
                        : 'bg-emerald-600 text-white'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" />
                    <span>{formatCountdown(remainingSeconds)}</span>
                  </div>
                )}

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* Redemption Banner Whenever Balance >= 1,000 Points */}
              {currentPoints >= REDEEM_POINTS_REQUIRED && (
                <div className="bg-gradient-to-r from-amber-100 via-yellow-50 to-emerald-50 border-2 border-amber-400 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <p className="text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
                      <Trophy className="w-4 h-4 text-amber-600" />
                      Reward Unlocked! You Have {currentPoints.toLocaleString()} Points!
                    </p>
                    <p className="text-xs text-slate-700">
                      Redeem{' '}
                      <strong>
                        {(
                          Math.floor(currentPoints / REDEEM_POINTS_REQUIRED) *
                          REDEEM_POINTS_REQUIRED
                        ).toLocaleString()}{' '}
                        points
                      </strong>{' '}
                      now for{' '}
                      <strong>
                        KSh{' '}
                        {Math.floor(currentPoints / REDEEM_POINTS_REQUIRED) *
                          REDEEM_KES_VALUE}
                      </strong>{' '}
                      M-Pesa cash reward!
                    </p>
                  </div>
                  <button
                    type="button"
                    disabled={redeeming}
                    onClick={handleRedeemPoints}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs px-4 py-2.5 rounded-xl shadow transition cursor-pointer"
                  >
                    {redeeming ? 'Redeeming...' : 'Redeem for KSh 5 Now →'}
                  </button>
                </div>
              )}

              {redeemSuccess && (
                <div className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-2.5 text-xs">
                  <p className="font-black text-emerald-950 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Points Redeemed! Claim Ref: {redeemSuccess.referenceCode} (KSh{' '}
                    {redeemSuccess.amountKes})
                  </p>
                  <p className="text-slate-700">
                    Click below to confirm your KSh {redeemSuccess.amountKes} payout on
                    Coordinator WhatsApp:
                  </p>
                  <a
                    href={redeemSuccess.whatsappClaimUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black px-4 py-2.5 rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Claim KSh {redeemSuccess.amountKes} via WhatsApp (0705759072)
                  </a>
                </div>
              )}

              {/* VIEW 1: KSh 10 LIVE M-PESA STK + DIRECT CODE ACTIVATION SCREEN */}
              {view === 'ACTIVATE' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-4 space-y-1.5 text-xs text-slate-700">
                    <p className="font-black text-indigo-950 uppercase flex items-center gap-1.5">
                      <Zap className="w-4 h-4 text-amber-500" />
                      How CBC Subject Gaming Works:
                    </p>
                    <ul className="space-y-1 pl-1">
                      <li>
                        • <strong>Activation:</strong> Pay <strong>KSh {GAMING_FEE_KES}</strong>{' '}
                        via M-Pesa STK Prompt — unlocks immediately once payment is
                        auto-confirmed.
                      </li>
                      <li>
                        • <strong>20-Minute Session:</strong> Play unlimited CBC questions
                        across all subjects for <strong>20 minutes</strong> (auto-logs out
                        after 20 minutes; your points stay saved!).
                      </li>
                      <li>
                        • <strong>Earn &amp; Redeem:</strong> Every correct question ={' '}
                        <strong>1 Point</strong>. Reach <strong>1,000 Points</strong> to
                        redeem <strong>KSh 5</strong>!
                      </li>
                    </ul>
                  </div>

                  {/* Shared Learner Profile + Subject Selection */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Learner Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Kevin Otieno"
                        value={playerName}
                        onChange={(e) => setPlayerName(e.target.value)}
                        disabled={stkWaitingPin}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        M-Pesa Phone Number (Saves Your Points) *
                      </label>
                      <div className="relative">
                        <Smartphone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="tel"
                          required
                          placeholder="07XXXXXXXX"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          disabled={stkWaitingPin}
                          className="w-full pl-10 pr-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-semibold"
                        />
                      </div>
                      {savedPointsLookup !== null && savedPointsLookup > 0 && (
                        <p className="text-[11px] font-bold text-emerald-700 mt-1">
                          Welcome back! Saved balance: {savedPointsLookup.toLocaleString()}{' '}
                          / 1,000 pts
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Grade Level
                      </label>
                      <select
                        value={gradeKey}
                        onChange={(e) => setGradeKey(e.target.value)}
                        disabled={stkWaitingPin}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                      >
                        {ALL_GRADE_KEYS.map((g) => (
                          <option key={g} value={g}>
                            {formatGradeLabel(g)}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Starting CBC Subject
                      </label>
                      <select
                        value={subject}
                        onChange={(e) => setSubject(e.target.value)}
                        disabled={stkWaitingPin}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                      >
                        {ALL_GAMING_SUBJECTS.map((s) => (
                          <option key={s} value={s}>
                            {s}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Payment Method Switcher */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setPayTab('STK');
                      }}
                      className={`py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                        payTab === 'STK'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      1. M-Pesa STK Push (KSh {GAMING_FEE_KES})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setErrorMessage('');
                        setPayTab('DIRECT');
                      }}
                      className={`py-2 rounded-lg text-xs font-black transition cursor-pointer ${
                        payTab === 'DIRECT'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      2. Pochi la Biashara ({COORDINATOR_MPESA_LOCAL})
                    </button>
                  </div>

                  {statusMessage && (
                    <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-900 flex items-center gap-2.5">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  {errorMessage && (
                    <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs font-semibold text-rose-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 shrink-0" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {payTab === 'STK' ? (
                    <form onSubmit={handleStartStkActivation} className="space-y-3">
                      <button
                        type="submit"
                        disabled={stkProcessing || stkWaitingPin}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-sm py-4 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {(stkProcessing || stkWaitingPin) && (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        )}
                        {stkWaitingPin
                          ? 'Waiting for M-Pesa PIN Auto-Confirmation...'
                          : `Activate 20-Minute Gaming Pass (KSh ${GAMING_FEE_KES} STK Push)`}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleDirectMpesaActivation} className="space-y-3">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3.5 flex items-center justify-between gap-2 text-xs">
                        <div>
                          <p className="font-bold text-emerald-950">
                            Lipa na M-Pesa &rarr; Pochi la Biashara (KSh {GAMING_FEE_KES}):
                          </p>
                          <p className="font-mono font-black text-sm text-slate-900">
                            Phone: {COORDINATOR_MPESA_LOCAL}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(COORDINATOR_MPESA_LOCAL);
                            setCopiedMpesa(true);
                            setTimeout(() => setCopiedMpesa(false), 2000);
                          }}
                          className="inline-flex items-center gap-1 bg-white border border-emerald-300 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-800 cursor-pointer"
                        >
                          {copiedMpesa ? (
                            <>
                              <Check className="w-3.5 h-3.5" /> Copied
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5" /> Copy
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="Paste M-Pesa Code (e.g. SJK84M2P9Q) or SMS"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono uppercase"
                      />

                      <div className="flex flex-wrap gap-2">
                        <button
                          type="submit"
                          disabled={stkProcessing || stkWaitingPin}
                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow transition cursor-pointer"
                        >
                          {stkProcessing
                            ? 'Submitting Code...'
                            : stkWaitingPin
                              ? 'Verifying Payment Automatically...'
                              : `Submit M-Pesa Code & Unlock 20-Min Pass`}
                        </button>

                        {stkWaitingPin && whatsappNotifyUrl && (
                          <a
                            href={whatsappNotifyUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs px-3.5 py-3.5 rounded-xl"
                          >
                            <MessageCircle className="w-4 h-4" />
                            WhatsApp Fast-Approve
                          </a>
                        )}
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* VIEW 2: ACTIVE 20-MINUTE LIVE GAMING ARENA */}
              {view === 'PLAYING' && question && (
                <div className="space-y-5">
                  {/* Subject Switcher + Progress Toward 1,000 Pts = KSh 5 */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black uppercase text-slate-500">
                          Playing Subject:
                        </span>
                        <select
                          value={subject}
                          onChange={(e) => handleLiveSubjectSwitch(e.target.value)}
                          className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-black bg-white text-emerald-900"
                        >
                          {ALL_GAMING_SUBJECTS.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <span className="text-xs font-bold text-slate-600">
                        This Session: <strong className="text-emerald-700">+{sessionPoints} pts</strong>
                      </span>
                    </div>

                    {/* Progress bar toward 1,000 points */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold">
                        <span className="text-slate-600">
                          Progress to Next KSh {REDEEM_KES_VALUE} Reward:
                        </span>
                        <span className="text-amber-700">
                          {currentPoints.toLocaleString()} / {REDEEM_POINTS_REQUIRED.toLocaleString()} pts
                        </span>
                      </div>
                      <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-400 to-emerald-500 transition-all duration-300"
                          style={{
                            width: `${
                              currentPoints >= REDEEM_POINTS_REQUIRED ? 100 : progressPct
                            }%`,
                          }}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Question Card */}
                  <div className="bg-white border-2 border-slate-200 rounded-2xl p-5 space-y-4 shadow-xs">
                    <div className="flex items-center justify-between text-[11px] font-bold uppercase tracking-wider text-indigo-700">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        {question.gradeLabel} • {question.subject}
                      </span>
                      <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded">
                        +{POINTS_PER_QUESTION} Point
                      </span>
                    </div>

                    <p className="text-sm sm:text-base font-black text-slate-900 leading-snug">
                      {question.prompt}
                    </p>

                    <div className="grid grid-cols-1 gap-2.5">
                      {question.options.map((opt, idx) => {
                        const letter = ['A', 'B', 'C', 'D'][idx];
                        let styleClass =
                          'border-slate-200 bg-slate-50/70 hover:border-indigo-400 hover:bg-indigo-50/50 text-slate-800';

                        if (answerResult) {
                          if (idx === answerResult.correctIndex) {
                            styleClass =
                              'border-emerald-500 bg-emerald-50 text-emerald-950 font-black';
                          } else if (idx === selectedOpt && !answerResult.correct) {
                            styleClass =
                              'border-rose-400 bg-rose-50 text-rose-900';
                          } else {
                            styleClass = 'border-slate-200 bg-slate-50 opacity-60';
                          }
                        } else if (selectedOpt === idx) {
                          styleClass = 'border-indigo-500 bg-indigo-50 text-indigo-950';
                        }

                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={selectedOpt !== null || submittingAnswer}
                            onClick={() => handleSelectOption(idx)}
                            className={`w-full text-left px-4 py-3 rounded-xl border-2 text-xs sm:text-sm font-semibold flex items-center justify-between gap-3 transition cursor-pointer ${styleClass}`}
                          >
                            <span className="flex items-center gap-3">
                              <span className="w-6 h-6 rounded-lg bg-white border border-slate-300 text-xs font-black flex items-center justify-center shrink-0">
                                {letter}
                              </span>
                              <span>{opt}</span>
                            </span>
                            {answerResult && idx === answerResult.correctIndex && (
                              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                            )}
                            {answerResult &&
                              idx === selectedOpt &&
                              !answerResult.correct && (
                                <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                              )}
                          </button>
                        );
                      })}
                    </div>

                    {/* Instant Answer Feedback + Next Question */}
                    {answerResult && (
                      <div
                        className={`rounded-xl p-3.5 text-xs space-y-2 ${
                          answerResult.correct
                            ? 'bg-emerald-50 border border-emerald-200 text-emerald-950'
                            : 'bg-amber-50 border border-amber-200 text-amber-950'
                        }`}
                      >
                        <p className="font-black flex items-center gap-1.5">
                          {answerResult.correct ? (
                            <>
                              <Award className="w-4 h-4 text-emerald-600" />
                              Correct! +1 Point Added to Your Balance!
                            </>
                          ) : (
                            <>Keep Going! Look at the explanation below:</>
                          )}
                        </p>
                        {answerResult.explanation && (
                          <p className="text-slate-700 leading-relaxed">
                            {answerResult.explanation}
                          </p>
                        )}
                        <button
                          type="button"
                          onClick={handleNextQuestion}
                          className="w-full bg-slate-900 hover:bg-slate-800 text-white font-black py-2.5 rounded-xl text-xs transition cursor-pointer mt-1"
                        >
                          Next Question (+1 Point) →
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Monetization Ad Unit Inside Arena */}
                  <AdSlot placement="preview_modal" />
                </div>
              )}

              {/* VIEW 3: AUTOMATICALLY LOGGED OUT AFTER 20 MINUTES */}
              {view === 'LOGGED_OUT' && (
                <div className="text-center py-6 space-y-5">
                  <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                    <LogOut className="w-7 h-7" />
                  </div>
                  <div className="space-y-1.5">
                    <h4 className="text-lg font-black text-slate-900">
                      20-Minute Gaming Session Complete — Automatically Logged Out
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
                      Your 20-minute gaming pass has ended and you have been logged out
                      automatically. Your total balance of{' '}
                      <strong>{currentPoints.toLocaleString()} points</strong> is safely
                      saved under your phone number!
                    </p>
                  </div>

                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 max-w-sm mx-auto space-y-1 text-xs">
                    <p className="font-bold text-slate-700">
                      Points Earned This Session:{' '}
                      <strong className="text-emerald-700">+{sessionPoints} pts</strong>
                    </p>
                    <p className="font-bold text-slate-700">
                      Total Saved Wallet:{' '}
                      <strong className="text-amber-700">
                        {currentPoints.toLocaleString()} / 1,000 pts (= KSh 5)
                      </strong>
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutRequestId(null);
                      setStkWaitingPin(false);
                      setMpesaCode('');
                      setStatusMessage('');
                      setErrorMessage('');
                      setPayTab('STK');
                      setView('ACTIVATE');
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm px-6 py-3.5 rounded-xl shadow transition cursor-pointer"
                  >
                    Activate Another 20-Minute Session (KSh {GAMING_FEE_KES}) &rarr;
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
