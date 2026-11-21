'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  CheckCircle2,
  Copy,
  Flame,
  GraduationCap,
  Loader2,
  MessageCircle,
  Smartphone,
  Sparkles,
  UserCheck,
  X,
} from 'lucide-react';
import { ALL_GRADE_KEYS, formatGradeLabel } from '@/lib/material-utils';
import {
  COORDINATOR_MPESA_LOCAL,
  COORDINATOR_WHATSAPP_LOCAL,
  gradeToBand,
  LEARNER_FEE_KES,
  SUBJECTS_BY_BAND,
  type PublicTuitionMatch,
} from '@/lib/tuition';
import { isSearchCrawlerBot } from './LuxuryWelcomeSong';

export const LEARNER_TUITION_REGISTERED_KEY = 'cbc_learner_tuition_registered_v1';

declare global {
  interface Window {
    __cbcWelcomeSongCompletedAt?: number;
    __cbcLearnerTuitionModalOpen?: boolean;
  }
}

export default function LearnerTuitionPostSongGate() {
  const [songFinished, setSongFinished] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBlockedRoute, setIsBlockedRoute] = useState(false);
  const [alreadyRegisteredRef, setAlreadyRegisteredRef] = useState<string>('');

  // Step state: FORM -> PAYMENT -> COMPLETED
  const [step, setStep] = useState<'FORM' | 'PAYMENT' | 'COMPLETED'>('FORM');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [county, setCounty] = useState('');
  const [learnerGrade, setLearnerGrade] = useState('7');
  const [mode, setMode] = useState<'Home or Online' | 'Home Tuition' | 'Online Tuition'>(
    'Home or Online'
  );
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(['Mathematics']);
  const [formError, setFormError] = useState('');

  // Payment State — strictly KSh 1,000 Learner Subscription (NEVER teachers fee)
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('STK');
  const [submitting, setSubmitting] = useState(false);
  const [payStatus, setPayStatus] = useState<'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'>(
    'IDLE'
  );
  const [payMsg, setPayMsg] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedMpesa, setCopiedMpesa] = useState(false);

  // Saved Learner Record & Matched Teachers
  const [savedRecordId, setSavedRecordId] = useState('');
  const [savedRefCode, setSavedRefCode] = useState('');
  const [matches, setMatches] = useState<PublicTuitionMatch[]>([]);
  const [whatsappConnectUrl, setWhatsappConnectUrl] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.__cbcLearnerTuitionModalOpen = isModalOpen;
  }, [isModalOpen]);

  const availableSubjects = useMemo(() => {
    const band = gradeToBand(learnerGrade);
    return SUBJECTS_BY_BAND[band] || SUBJECTS_BY_BAND.JUNIOR_SCHOOL;
  }, [learnerGrade]);

  // Keep at least valid subjects selected when grade changes
  useEffect(() => {
    setSelectedSubjects((prev) => {
      const valid = prev.filter((s) => availableSubjects.includes(s));
      return valid.length > 0 ? valid : [availableSubjects[0] || 'Mathematics'];
    });
  }, [availableSubjects]);

  const openLearnerOfferModal = useCallback(() => {
    setFormError('');
    setPayMsg('');
    if (payStatus !== 'COMPLETED') {
      setStep('FORM');
      setPayStatus('IDLE');
    }
    setIsModalOpen(true);
  }, [payStatus]);

  const handleSkipModal = () => {
    setIsModalOpen(false);
  };

  // Detect route & trigger IMMEDIATELY after listening to the 1-minute opening music!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (
      path.startsWith('/admin') ||
      path.startsWith('/mobile-admin') ||
      path.startsWith('/monetization') ||
      isSearchCrawlerBot()
    ) {
      setIsBlockedRoute(true);
      return;
    }

    try {
      const savedRef = localStorage.getItem(LEARNER_TUITION_REGISTERED_KEY) || '';
      if (savedRef) setAlreadyRegisteredRef(savedRef);
    } catch {}

    const triggerRightAfterOpeningMusic = () => {
      setSongFinished(true);
      try {
        // Still show the button to everyone; auto-pop modal unless they already completed registration
        const existingPaid = localStorage.getItem(LEARNER_TUITION_REGISTERED_KEY);
        if (!existingPaid) {
          setIsModalOpen(true);
        }
      } catch {
        setIsModalOpen(true);
      }
    };

    if (window.__cbcWelcomeSongCompletedAt) {
      triggerRightAfterOpeningMusic();
    }

    const onSongCompleted = () => {
      triggerRightAfterOpeningMusic();
    };

    const onManualOpenEvent = () => {
      setSongFinished(true);
      openLearnerOfferModal();
    };

    window.addEventListener('cbc-compulsory-song-completed', onSongCompleted);
    window.addEventListener('cbc-open-learner-tuition-offer', onManualOpenEvent);
    return () => {
      window.removeEventListener('cbc-compulsory-song-completed', onSongCompleted);
      window.removeEventListener('cbc-open-learner-tuition-offer', onManualOpenEvent);
    };
  }, [openLearnerOfferModal]);

  const toggleSubject = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((x) => x !== subj) : [...prev, subj]
    );
  };

  const saveLearnerToBackend = useCallback(
    async (opts: {
      reqId?: string;
      paymentState: 'PENDING' | 'COMPLETED';
      mpesaRef?: string;
      existingId?: string;
      existingRefCode?: string;
    }) => {
      const res = await fetch('/api/tuition', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: opts.existingId || undefined,
          referenceCode: opts.existingRefCode || undefined,
          role: 'LEARNER', // Strictly LEARNER (KSh 1,000 subscription — never Teacher fee!)
          fullName: fullName.trim(),
          phone: phone.trim(),
          county: county.trim(),
          learnerGrade,
          gradeBands: [gradeToBand(learnerGrade)],
          subjects: selectedSubjects,
          mode,
          schedule: 'Any Convenient Time (Personal Teacher)',
          notes: 'Registered via Post-Welcome-Song Learner Tuition Active Offer (KSh 1,000)',
          checkoutRequestId: opts.reqId,
          mpesaReceipt: opts.mpesaRef,
          paymentStatus: opts.paymentState,
        }),
      });
      const data = await res.json();
      if (res.ok && data.success && data.registration) {
        setSavedRecordId(data.registration.id);
        setSavedRefCode(data.registration.referenceCode);
        if (Array.isArray(data.matches)) setMatches(data.matches);
        if (data.whatsappCoordinatorUrl) {
          setWhatsappConnectUrl(data.whatsappCoordinatorUrl);
        }
        if (opts.paymentState === 'COMPLETED') {
          try {
            localStorage.setItem(
              LEARNER_TUITION_REGISTERED_KEY,
              data.registration.referenceCode
            );
            setAlreadyRegisteredRef(data.registration.referenceCode);
          } catch {}
        }
        return data.registration as { id: string; referenceCode: string };
      }
      return null;
    },
    [fullName, phone, county, learnerGrade, selectedSubjects, mode]
  );

  // Step 1 Submit -> Immediately save interested learner in backend AND fire KSh 1,000 M-Pesa STK prompt!
  const handleRegisterAndPrompt1000 = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!fullName.trim()) {
      setFormError('PLEASE ENTER LEARNER OR PARENT FULL NAME.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setFormError('PLEASE ENTER A VALID SAFARICOM M-PESA / WHATSAPP NUMBER.');
      return;
    }
    if (!county.trim()) {
      setFormError('PLEASE ENTER YOUR COUNTY OR TOWN (E.G. NAIROBI, NAKURU, KISUMU).');
      return;
    }
    if (selectedSubjects.length === 0) {
      setFormError('PLEASE SELECT AT LEAST ONE CBC SUBJECT.');
      return;
    }

    setSubmitting(true);
    setPayMsg('');

    try {
      // Log checkout intent
      fetch('/api/purchase-attempt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          channel: 'Post-Song Learner Tuition Offer',
          itemTitle: `Learner Tuition Subscription — ${fullName.trim()} (${formatGradeLabel(
            learnerGrade
          )})`,
          amountKes: LEARNER_FEE_KES,
          buyerPhone: phone.trim(),
          stage: 'OPENED_CHECKOUT',
        }),
      }).catch(() => {});

      // Trigger Live KSh 1,000 M-Pesa STK Push strictly for LEARNER_TUITION (KSh 1,000)
      const stkRes = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          serviceType: 'LEARNER_TUITION',
        }),
      });
      const stkData = await stkRes.json();

      const reqId = stkRes.ok ? String(stkData.checkoutRequestId || '') : undefined;
      await saveLearnerToBackend({
        reqId,
        paymentState: 'PENDING',
        existingId: savedRecordId || undefined,
        existingRefCode: savedRefCode || undefined,
      });

      setStep('PAYMENT');

      if (stkRes.ok && reqId) {
        setCheckoutRequestId(reqId);
        setPayTab('STK');
        setPayStatus('PENDING');
        setPayMsg(
          `KSH ${LEARNER_FEE_KES.toLocaleString()} M-PESA SUBSCRIPTION PROMPT SENT TO ${phone.trim().toUpperCase()}! ENTER YOUR M-PESA PIN ON YOUR PHONE NOW.`
        );
      } else {
        setPayTab('DIRECT');
        setPayStatus('FAILED');
        setPayMsg(
          (
            stkData.error ||
            `COULD NOT AUTO-POP STK ON THIS LINE. PAY KSH ${LEARNER_FEE_KES.toLocaleString()} TO ${COORDINATOR_MPESA_LOCAL} AND PASTE YOUR M-PESA CODE BELOW.`
          ).toUpperCase()
        );
      }
    } catch {
      await saveLearnerToBackend({
        paymentState: 'PENDING',
        existingId: savedRecordId || undefined,
        existingRefCode: savedRefCode || undefined,
      }).catch(() => {});
      setStep('PAYMENT');
      setPayStatus('FAILED');
      setPayMsg(
        'NETWORK BUSY INITIATING STK PROMPT. CLICK RETRY KSH 1,000 STK PROMPT OR USE DIRECT M-PESA CODE.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetryStk1000 = async () => {
    setSubmitting(true);
    setPayMsg('');
    try {
      const stkRes = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          serviceType: 'LEARNER_TUITION',
        }),
      });
      const stkData = await stkRes.json();
      if (stkRes.ok && stkData.checkoutRequestId) {
        setCheckoutRequestId(stkData.checkoutRequestId);
        setPayStatus('PENDING');
        setPayMsg(
          `CHECK YOUR PHONE (${phone.trim().toUpperCase()}) AND ENTER YOUR M-PESA PIN TO COMPLETE KSH ${LEARNER_FEE_KES.toLocaleString()} SUBSCRIPTION!`
        );
      } else {
        setPayStatus('FAILED');
        setPayMsg(
          (
            stkData.error ||
            `COULD NOT SEND STK PUSH. SWITCH TO DIRECT M-PESA CODE (${COORDINATOR_MPESA_LOCAL}).`
          ).toUpperCase()
        );
      }
    } catch {
      setPayStatus('FAILED');
      setPayMsg('NETWORK ERROR SENDING STK PUSH. PLEASE RETRY.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifyDirectCode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaCode.trim()) return;
    setSubmitting(true);
    setPayMsg('');
    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode: mpesaCode.trim(),
          phoneNumber: phone.trim(),
          serviceType: 'LEARNER_TUITION',
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutRequestId) {
        setPayStatus('COMPLETED');
        await saveLearnerToBackend({
          reqId: data.checkoutRequestId,
          paymentState: 'COMPLETED',
          mpesaRef: data.receiptNumber || mpesaCode.trim().toUpperCase(),
          existingId: savedRecordId || undefined,
          existingRefCode: savedRefCode || undefined,
        });
        setStep('COMPLETED');
      } else {
        setPayStatus('FAILED');
        setPayMsg(
          (data.error || 'INVALID M-PESA CODE. PLEASE CHECK AND TRY AGAIN.').toUpperCase()
        );
      }
    } catch {
      setPayStatus('FAILED');
      setPayMsg('NETWORK ERROR VERIFYING M-PESA CODE.');
    } finally {
      setSubmitting(false);
    }
  };

  // Poll STK payment completion every 1.2s while waiting for PIN
  useEffect(() => {
    if (step !== 'PAYMENT' || payStatus !== 'PENDING' || !checkoutRequestId) return;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/resources/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId }),
        });
        const data = await res.json();
        if (data.status === 'COMPLETED') {
          window.clearInterval(timer);
          setPayStatus('COMPLETED');
          await saveLearnerToBackend({
            reqId: checkoutRequestId,
            paymentState: 'COMPLETED',
            existingId: savedRecordId || undefined,
            existingRefCode: savedRefCode || undefined,
          });
          setStep('COMPLETED');
        } else if (data.status === 'FAILED') {
          window.clearInterval(timer);
          setPayStatus('FAILED');
          setPayMsg(
            'M-PESA PROMPT CANCELLED OR TIMED OUT. TAP RETRY KSH 1,000 PROMPT OR ENTER DIRECT M-PESA CODE.'
          );
        }
      } catch {
        // continue polling
      }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [step, payStatus, checkoutRequestId, saveLearnerToBackend, savedRecordId, savedRefCode]);

  if (isBlockedRoute || !songFinished) return null;

  return (
    <>
      {/* PERSISTENT HIGH-VISIBILITY BUTTON APPEARING TO EVERYONE IMMEDIATELY AFTER LISTENING TO OPENING MUSIC */}
      <div className="w-full bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 border-b-2 border-slate-950 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2.5 flex flex-col lg:flex-row lg:items-center justify-between gap-2.5">
          <div className="flex flex-wrap items-center gap-2 text-slate-950 font-black text-xs sm:text-sm uppercase tracking-wide">
            <span className="inline-flex items-center gap-1 bg-rose-600 text-white px-2.5 py-0.5 rounded-full text-[11px] font-black uppercase shadow-xs animate-pulse shrink-0">
              <Flame className="w-3.5 h-3.5" />
              OFFER ACTIVE NOW
            </span>
            <span>
              TURN WEAK SUBJECTS INTO TOP SCORES! GET YOUR OWN 1-ON-1 HOME OR ONLINE CBC
              TUTOR (PP1 – GRADE 12 • ALL 47 COUNTIES) — KSH 1,000 ONLY!
            </span>
          </div>

          <button
            type="button"
            onClick={openLearnerOfferModal}
            className="min-h-[40px] bg-slate-950 hover:bg-emerald-950 text-amber-300 border-2 border-white px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-md transition cursor-pointer shrink-0"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>
              {alreadyRegisteredRef
                ? `MY LESSONS BOOKED (${alreadyRegisteredRef})`
                : 'START 1-ON-1 LESSONS NOW (KSH 1,000 ONLY)'}
            </span>
          </button>
        </div>
      </div>

      {/* HIGH-VISIBILITY BOLD UPPERCASE POP-UP IMMEDIATELY AFTER OPENING MUSIC */}
      {isModalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="learner-tuition-offer-title"
          className="fixed inset-0 z-[9990] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
        >
          <div className="w-full max-w-2xl bg-white rounded-3xl border-4 border-amber-400 shadow-[0_0_60px_rgba(251,191,36,0.55)] overflow-hidden my-auto">
            {/* TOP FLASHING ACTIVE OFFER BANNER — ALL UPPER CASE */}
            <div className="bg-gradient-to-r from-rose-700 via-red-600 to-amber-600 text-white px-4 py-2.5 flex items-center justify-between gap-2 border-b-2 border-amber-300">
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-black uppercase tracking-wider">
                <Sparkles className="w-4 h-4 text-amber-200 shrink-0" />
                <span>
                  LIMITED-TIME TUITION OFFER IS STILL ACTIVE — REGISTER YOUR LEARNER NOW!
                </span>
              </div>
              <button
                type="button"
                onClick={handleSkipModal}
                className="bg-black/35 hover:bg-black/55 text-white border border-white/50 px-3 py-1 rounded-lg text-[11px] font-black uppercase inline-flex items-center gap-1 transition cursor-pointer shrink-0"
              >
                <span>SKIP</span>
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* BOLD UPPERCASE HERO HEADER */}
            <div className="bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 text-white px-5 sm:px-7 py-5 border-b border-emerald-500/40 space-y-2.5">
              <div className="inline-flex items-center gap-2 bg-amber-400 text-slate-950 px-3.5 py-1 rounded-full text-[11px] sm:text-xs font-black uppercase tracking-wider shadow">
                <GraduationCap className="w-4 h-4 shrink-0" />
                <span>
                  UNLOCK YOUR BEST GRADES • FULL ACCESS &amp; TUTOR MATCH AT KSH 1,000 ONLY
                </span>
              </div>
              <h2
                id="learner-tuition-offer-title"
                className="text-base sm:text-xl font-black uppercase leading-snug tracking-wide text-amber-300"
              >
                DON&apos;T STRUGGLE ALONE — REGISTER NOW FOR 1-ON-1 PERSONALIZED LESSONS
                WHILE THIS OFFER IS STILL ACTIVE!
              </h2>
              <p className="text-xs sm:text-sm font-extrabold uppercase text-emerald-100 leading-relaxed">
                TURN TOUGH TOPICS INTO EASY MARKS, BUILD UNSTOPPABLE EXAM CONFIDENCE &amp;
                GET A HANDPICKED HOME OR ONLINE CBC TUTOR NEAR YOU (PP1 – GRADE 12 • ALL
                47 COUNTIES) — ALL FOR KSH 1,000 ONLY!
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 pt-1">
                <span className="rounded-lg bg-white/10 border border-emerald-400/40 px-2.5 py-1 text-[10px] font-black uppercase text-emerald-200">
                  ✓ 1-ON-1 MENTOR FOR YOUR WEAKEST SUBJECTS
                </span>
                <span className="rounded-lg bg-white/10 border border-amber-300/40 px-2.5 py-1 text-[10px] font-black uppercase text-amber-200">
                  ✓ HOME OR ONLINE LESSONS AT YOUR PACE
                </span>
                <span className="rounded-lg bg-white/10 border border-sky-300/40 px-2.5 py-1 text-[10px] font-black uppercase text-sky-200">
                  ✓ KSH 1,000 ONLY — ZERO EXTRA MATCH FEES
                </span>
              </div>
            </div>

            {/* BODY */}
            <div className="p-5 sm:p-6 max-h-[72vh] overflow-y-auto space-y-4">
              {step === 'FORM' && (
                <form onSubmit={handleRegisterAndPrompt1000} className="space-y-4">
                  {formError && (
                    <div className="rounded-xl bg-rose-50 border-2 border-rose-300 px-3.5 py-2.5 text-xs font-black uppercase text-rose-800">
                      {formError}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                        LEARNER / PARENT FULL NAME *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.G. BRIAN OTIENO / MARY WANJIKU"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                        M-PESA &amp; WHATSAPP PHONE (KSH 1,000 PROMPT) *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="E.G. 0712345678"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                        COUNTY / ESTATE / TOWN *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="E.G. NAIROBI - WESTLANDS"
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                        LEARNER GRADE *
                      </label>
                      <select
                        value={learnerGrade}
                        onChange={(e) => setLearnerGrade(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3 py-2.5 text-xs font-black uppercase text-slate-900 bg-white outline-none"
                      >
                        {ALL_GRADE_KEYS.map((gk) => (
                          <option key={gk} value={gk}>
                            {formatGradeLabel(gk).toUpperCase()}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                        PREFERRED TUITION MODE
                      </label>
                      <select
                        value={mode}
                        onChange={(e) =>
                          setMode(
                            e.target.value as
                              | 'Home or Online'
                              | 'Home Tuition'
                              | 'Online Tuition'
                          )
                        }
                        className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3 py-2.5 text-xs font-black uppercase text-slate-900 bg-white outline-none"
                      >
                        <option value="Home or Online">HOME OR ONLINE</option>
                        <option value="Home Tuition">HOME TUITION (1-ON-1)</option>
                        <option value="Online Tuition">ONLINE TUITION (ZOOM/MEET)</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-800 mb-1.5">
                      SELECT CBC SUBJECTS NEEDED ({selectedSubjects.length} SELECTED) *
                    </label>
                    <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2.5 rounded-xl bg-slate-50 border border-slate-200">
                      {availableSubjects.map((subj) => {
                        const active = selectedSubjects.includes(subj);
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => toggleSubject(subj)}
                            className={`px-2.5 py-1.5 rounded-lg text-[11px] font-black uppercase transition cursor-pointer ${
                              active
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-white border border-slate-300 text-slate-700 hover:bg-emerald-50'
                            }`}
                          >
                            {active ? `✓ ${subj}` : subj}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* ACTION BUTTONS: REGISTER NOW (KSH 1,000) + SKIP OPTION */}
                  <div className="pt-1 space-y-2.5">
                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>
                            SAVING LEARNER &amp; SENDING KSH{' '}
                            {LEARNER_FEE_KES.toLocaleString()} M-PESA PROMPT...
                          </span>
                        </>
                      ) : (
                        <>
                          <Smartphone className="w-4 h-4 text-amber-300 shrink-0" />
                          <span>
                            CLAIM MY 1-ON-1 TUTOR &amp; START LESSONS NOW — KSH 1,000 ONLY
                          </span>
                        </>
                      )}
                    </button>

                    <button
                      type="button"
                      onClick={handleSkipModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-black text-xs uppercase tracking-wider transition cursor-pointer"
                    >
                      SKIP FOR NOW — CONTINUE TO CBCMATERIALS.SHOP
                    </button>
                  </div>
                </form>
              )}

              {step === 'PAYMENT' && (
                <div className="space-y-4">
                  <div className="rounded-2xl bg-emerald-50 border-2 border-emerald-300 p-4 space-y-1.5">
                    <p className="text-xs font-black uppercase text-emerald-950">
                      LEARNER DETAILS SAVED ({savedRefCode || 'PENDING'}) • KSH 1000 ONLY
                      FOR SUBSCRIPTION AND TEACHER MATCHING
                    </p>
                    <p className="text-[11px] font-bold uppercase text-emerald-800">
                      LEARNER: {fullName} • {formatGradeLabel(learnerGrade)} •{' '}
                      {selectedSubjects.join(', ')}
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setPayTab('STK')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                        payTab === 'STK'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      1. M-PESA STK PROMPT (KSH {LEARNER_FEE_KES.toLocaleString()})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayTab('DIRECT')}
                      className={`py-2.5 px-3 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                        payTab === 'DIRECT'
                          ? 'bg-emerald-700 text-white'
                          : 'bg-slate-100 text-slate-700'
                      }`}
                    >
                      2. PASTE M-PESA CODE ({COORDINATOR_MPESA_LOCAL})
                    </button>
                  </div>

                  {payMsg && (
                    <div
                      className={`rounded-xl p-3.5 text-xs font-black uppercase border ${
                        payStatus === 'PENDING'
                          ? 'bg-amber-50 border-amber-300 text-amber-950'
                          : 'bg-rose-50 border-rose-300 text-rose-900'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {payStatus === 'PENDING' && (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
                        )}
                        <span>{payMsg}</span>
                      </div>
                    </div>
                  )}

                  {payTab === 'STK' ? (
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleRetryStk1000}
                        disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                        <span>
                          SEND KSH {LEARNER_FEE_KES.toLocaleString()} M-PESA PROMPT TO{' '}
                          {phone.toUpperCase()}
                        </span>
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleVerifyDirectCode} className="space-y-3">
                      <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 flex flex-wrap items-center justify-between gap-2 text-xs font-bold uppercase text-slate-800">
                        <span>
                          SEND KSH {LEARNER_FEE_KES.toLocaleString()} TO M-PESA:{' '}
                          <strong className="text-emerald-700">
                            {COORDINATOR_MPESA_LOCAL}
                          </strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(COORDINATOR_MPESA_LOCAL);
                            setCopiedMpesa(true);
                            setTimeout(() => setCopiedMpesa(false), 2000);
                          }}
                          className="px-2.5 py-1 rounded-lg bg-emerald-100 text-emerald-900 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                        >
                          {copiedMpesa ? (
                            <>
                              <Check className="w-3 h-3" /> COPIED
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" /> COPY NUMBER
                            </>
                          )}
                        </button>
                      </div>

                      <input
                        type="text"
                        required
                        placeholder="PASTE M-PESA CODE OR SMS HERE (E.G. SJK8912ABC)"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value)}
                        className="w-full rounded-xl border-2 border-slate-300 px-3.5 py-2.5 text-xs font-black uppercase text-slate-900"
                      />

                      <button
                        type="submit"
                        disabled={submitting}
                        className="w-full py-3.5 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {submitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <UserCheck className="w-4 h-4" />
                        )}
                        <span>
                          VERIFY KSH {LEARNER_FEE_KES.toLocaleString()} M-PESA CODE &amp;
                          COMPLETE REGISTRATION
                        </span>
                      </button>
                    </form>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setStep('FORM')}
                      className="text-xs font-black uppercase text-slate-600 hover:underline cursor-pointer"
                    >
                      &larr; EDIT LEARNER DETAILS
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipModal}
                      className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 font-black text-xs uppercase cursor-pointer"
                    >
                      SKIP FOR NOW
                    </button>
                  </div>
                </div>
              )}

              {step === 'COMPLETED' && (
                <div className="space-y-4 text-center py-2">
                  <div className="w-14 h-14 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto shadow">
                    <CheckCircle2 className="w-8 h-8" />
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 font-mono text-xs font-black uppercase">
                    REFERENCE ID: {savedRefCode} • KSH {LEARNER_FEE_KES.toLocaleString()}{' '}
                    PAID
                  </span>
                  <h3 className="text-base sm:text-lg font-black uppercase text-slate-950">
                    LEARNER TUITION SUBSCRIPTION CONFIRMED! ({matches.length || 3}+ VERIFIED
                    SUBJECT TEACHERS READY)
                  </h3>
                  <p className="text-xs font-bold uppercase text-slate-700 max-w-lg mx-auto">
                    TAP BELOW TO CONNECT DIRECTLY ON WHATSAPP ({COORDINATOR_WHATSAPP_LOCAL}
                    ) FOR IMMEDIATE TEACHER INTRODUCTION!
                  </p>

                  <div className="space-y-2.5 pt-1">
                    <a
                      href={
                        whatsappConnectUrl ||
                        `https://wa.me/254728595160?text=${encodeURIComponent(
                          `Hello CBCMATERIALS.SHOP! I have completed Learner Tuition Registration (${savedRefCode}) for ${fullName} (${formatGradeLabel(
                            learnerGrade
                          )} - ${selectedSubjects.join(', ')}).`
                        )}`
                      }
                      target="_blank"
                      rel="noreferrer"
                      className="w-full py-3.5 px-5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider inline-flex items-center justify-center gap-2 shadow-lg"
                    >
                      <MessageCircle className="w-5 h-5" />
                      <span>
                        CONNECT WITH YOUR TEACHER ON WHATSAPP ({COORDINATOR_WHATSAPP_LOCAL}
                        )
                      </span>
                    </a>

                    <button
                      type="button"
                      onClick={handleSkipModal}
                      className="w-full py-2.5 px-4 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-black text-xs uppercase cursor-pointer"
                    >
                      CONTINUE TO CBCMATERIALS.SHOP
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
