'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  Bot,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Loader2,
  Lock,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Unlock,
  UserCheck,
  X,
} from 'lucide-react';
import { AdSlot, useMonetization } from '@/components/MonetizationEngine';
import ButtonEmblemBadge from './ButtonEmblemBadge';
import { ALL_GRADE_KEYS, formatGradeLabel } from '@/lib/material-utils';
import PurchaseThankYouBanner from './PurchaseThankYouBanner';

const STORAGE_LEARNER_PROFILE_KEY = 'cbc_gemini_qa_profile_v1';
const STORAGE_SUB_TOKEN_KEY = 'cbc_gemini_qa_sub_token_v1';
const WEEKLY_FEE_KES = 20;

const SUBJECT_CHOICES = [
  'Mathematics',
  'Integrated Science',
  'English',
  'Kiswahili',
  'Biology',
  'Chemistry',
  'Physics',
  'Social Studies',
  'Pre-Technical Studies',
  'Agriculture & Nutrition',
  'Creative Arts & Sports',
  'CRE / IRE / HRE',
  'Computer Science',
  'History & Citizenship',
  'Geography',
  'Business Studies',
];

const SAMPLE_QUESTIONS = [
  'Explain how green plants carry out photosynthesis and state its balanced equation.',
  'Calculate 48 + 36 ÷ 6 × 4 − 10 step by step using BODMAS.',
  'Eleza maana ya ngeli ya A-WA na utoe mifano miwili katika sentensi.',
  'Discuss the three arms of the Government of Kenya and their main functions.',
];

function renderFormattedAnswer(text: string) {
  return text.split(/\n{2,}/).map((block, idx) => {
    const lines = block.split('\n');
    return (
      <div key={idx} className="space-y-1.5">
        {lines.map((line, lIdx) => {
          // Simple bold (**...**) & inline code (`...`) renderer
          const parts = line.split(/(\*\*[^*]+\*\*|`[^`]+`)/g);
          return (
            <p key={lIdx} className="text-xs sm:text-sm text-slate-800 leading-relaxed">
              {parts.map((part, pIdx) => {
                if (part.startsWith('**') && part.endsWith('**')) {
                  return (
                    <strong key={pIdx} className="font-black text-slate-950">
                      {part.slice(2, -2)}
                    </strong>
                  );
                }
                if (part.startsWith('`') && part.endsWith('`')) {
                  return (
                    <code
                      key={pIdx}
                      className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-900 font-mono text-xs font-bold"
                    >
                      {part.slice(1, -1)}
                    </code>
                  );
                }
                return <React.Fragment key={pIdx}>{part}</React.Fragment>;
              })}
            </p>
          );
        })}
      </div>
    );
  });
}

export default function GeminiHomeworkHub({
  externalOpenTick = 0,
}: {
  externalOpenTick?: number;
}) {
  const { trackInteraction, trackAdClick } = useMonetization();

  const [isOpen, setIsOpen] = useState(false);
  const [profileConfirmed, setProfileConfirmed] = useState(false);

  // Authentic Learner Profile
  const [fullName, setFullName] = useState('');
  const [gradeKey, setGradeKey] = useState('7');
  const [phone, setPhone] = useState('');

  // Question & Answer State
  const [subject, setSubject] = useState('Mathematics');
  const [question, setQuestion] = useState('');
  const [generating, setGenerating] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [currentAnswerId, setCurrentAnswerId] = useState<string | null>(null);
  const [askedQuestionSnapshot, setAskedQuestionSnapshot] = useState('');
  const [visibleHalf, setVisibleHalf] = useState('');
  const [fullAnswer, setFullAnswer] = useState<string | null>(null);
  const [answerUnlocked, setAnswerUnlocked] = useState(false);
  const [copiedAnswer, setCopiedAnswer] = useState(false);

  // KSh 20 Weekly Subscription & Paywall State
  const [subToken, setSubToken] = useState('');
  const [subExpiresAt, setSubExpiresAt] = useState<number | null>(null);
  const [merchantPhone, setMerchantPhone] = useState('0728595160');
  const [whatsappPhone, setWhatsappPhone] = useState('254728595160');
  const [showPayBox, setShowPayBox] = useState(false);
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('STK');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'
  >('IDLE');
  const [paymentMsg, setPaymentMsg] = useState('');

  const gradeLabel = formatGradeLabel(gradeKey);

  // Restore saved Learner Name, Grade & active 7-Day Weekly Token
  useEffect(() => {
    try {
      const savedProf = localStorage.getItem(STORAGE_LEARNER_PROFILE_KEY);
      if (savedProf) {
        const parsed = JSON.parse(savedProf) as {
          fullName?: string;
          gradeKey?: string;
          phone?: string;
        };
        if (parsed.fullName) {
          setFullName(parsed.fullName);
          if (parsed.gradeKey) setGradeKey(parsed.gradeKey);
          if (parsed.phone) setPhone(parsed.phone);
          setProfileConfirmed(true);
        }
      }

      const savedTok = localStorage.getItem(STORAGE_SUB_TOKEN_KEY) || '';
      if (savedTok) {
        setSubToken(savedTok);
      }
    } catch { }
  }, []);

  // Verify subscription status with server when modal opens
  const checkSubscriptionStatus = useCallback(
    async (tok: string, ph: string) => {
      try {
        const params = new URLSearchParams();
        if (tok) params.set('token', tok);
        if (ph) params.set('phone', ph);
        const res = await fetch(`/api/homework?${params.toString()}`);
        const data = await res.json();
        if (data.merchantLocalPhone) setMerchantPhone(data.merchantLocalPhone);
        if (data.whatsappPhone) setWhatsappPhone(data.whatsappPhone);
        if (data.subscribed && data.subscription) {
          setSubToken(data.subscription.token);
          setSubExpiresAt(data.subscription.expiresAt);
          localStorage.setItem(STORAGE_SUB_TOKEN_KEY, data.subscription.token);
        } else if (subExpiresAt && Date.now() > subExpiresAt) {
          setSubExpiresAt(null);
        }
      } catch { }
    },
    [subExpiresAt]
  );

  const openGeminiModal = useCallback(() => {
    // Monetize every button click & modal open!
    trackInteraction('gemini_qa_btn_open');
    trackAdClick('gemini_qa_hub');
    setIsOpen(true);
    checkSubscriptionStatus(subToken, phone);
  }, [trackInteraction, trackAdClick, checkSubscriptionStatus, subToken, phone]);

  useEffect(() => {
    if (externalOpenTick > 0) {
      openGeminiModal();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenTick]);

  // Poll every 3s once learner submits their KSh 20 M-Pesa code -> auto-reveal full answer!
  useEffect(() => {
    if (paymentStatus !== 'PENDING' || !checkoutRequestId) return;

    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/homework', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'check_unlock',
            checkoutRequestId,
            answerId: currentAnswerId,
            fullName,
            gradeLabel,
            phone,
          }),
        });
        const data = await res.json();

        if (data.status === 'COMPLETED') {
          window.clearInterval(timer);
          setPaymentStatus('COMPLETED');
          setSubToken(data.subscriptionToken);
          setSubExpiresAt(data.expiresAt);
          localStorage.setItem(STORAGE_SUB_TOKEN_KEY, data.subscriptionToken);
          if (data.fullAnswer) {
            setFullAnswer(data.fullAnswer);
          }
          setAnswerUnlocked(true);
          setShowPayBox(false);
          setPaymentMsg(
            'KSh 20 Weekly Subscription verified! Full answer unlocked + 7 days of unlimited answers activated!'
          );
        } else if (data.status === 'FAILED') {
          window.clearInterval(timer);
          setPaymentStatus('FAILED');
          setPaymentMsg(
            data.error ||
            'Could not verify M-Pesa code. Please double-check your code and resubmit.'
          );
        }
      } catch { }
    }, 1200);

    return () => window.clearInterval(timer);
  }, [
    paymentStatus,
    checkoutRequestId,
    currentAnswerId,
    fullName,
    gradeLabel,
    phone,
  ]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMsg('Please enter your Full Name (e.g. Brian Kamau).');
      return;
    }
    trackInteraction('gemini_qa_profile_saved');
    try {
      localStorage.setItem(
        STORAGE_LEARNER_PROFILE_KEY,
        JSON.stringify({
          fullName: fullName.trim(),
          gradeKey,
          phone: phone.trim(),
        })
      );
    } catch { }
    setProfileConfirmed(true);
    checkSubscriptionStatus(subToken, phone.trim());
  };

  const handleAskGemini = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!question.trim() || question.trim().length < 3) {
      setErrorMsg('Please type your question first.');
      return;
    }

    setGenerating(true);
    setErrorMsg('');
    setVisibleHalf('');
    setFullAnswer(null);
    setAnswerUnlocked(false);
    setShowPayBox(false);
    setPaymentStatus('IDLE');
    setPaymentMsg('');
    setAskedQuestionSnapshot(question.trim());

    trackInteraction('gemini_qa_question_asked');

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ask',
          fullName: fullName.trim(),
          gradeLabel,
          subject,
          question: question.trim(),
          subscriptionToken: subToken,
          phone: phone.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Could not generate answer.');
      }

      setCurrentAnswerId(data.answerId);
      setVisibleHalf(data.visibleHalf || '');

      if (data.unlocked && data.fullAnswer) {
        setFullAnswer(data.fullAnswer);
        setAnswerUnlocked(true);
        if (data.subscriptionExpiresAt) {
          setSubExpiresAt(data.subscriptionExpiresAt);
        }
      } else {
        setAnswerUnlocked(false);
      }
    } catch (err: unknown) {
      setErrorMsg(
        err instanceof Error ? err.message : 'Network error contacting Gemini.'
      );
    } finally {
      setGenerating(false);
    }
  };

  const handleOpenPaywall = () => {
    trackInteraction('gemini_qa_unlock_click');
    trackAdClick('gemini_qa_hub');
    setShowPayBox(true);
    // Ping purchase-attempt so Senior Counsel Pinchez's Mobile App rings!
    fetch('/api/purchase-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'Ask Gemini (KSh 20 Weekly)',
        itemTitle: `Gemini Full Answer Unlock — ${fullName.trim()} (${gradeLabel})`,
        amountKes: WEEKLY_FEE_KES,
        buyerPhone: phone.trim() || undefined,
        stage: 'OPENED_CHECKOUT',
      }),
    }).catch(() => { });
  };

  const handleInitiateKsh20Stk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setPaymentStatus('FAILED');
      setPaymentMsg('Please enter a valid Safaricom M-Pesa phone number (e.g. 0712345678).');
      return;
    }

    setSubmittingPayment(true);
    setPaymentStatus('IDLE');
    setPaymentMsg('');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          serviceType: 'GEMINI_WEEKLY',
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPaymentStatus('FAILED');
        setPaymentMsg(
          data.error ||
          `Could not send STK prompt. Switch to "2. Send Money & Paste Code" to unlock immediately.`
        );
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setPaymentStatus('PENDING');
      setPaymentMsg(
        `Check your phone (${phone.trim()}) and enter your M-Pesa PIN to pay KSh ${WEEKLY_FEE_KES}. Your full answer unlocks automatically!`
      );
    } catch {
      setPaymentStatus('FAILED');
      setPaymentMsg('Network error initiating M-Pesa STK Push.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const handleSubmitKsh20Code = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingPayment(true);
    setPaymentMsg('');

    try {
      const res = await fetch('/api/homework', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'submit_payment',
          answerId: currentAnswerId,
          fullName: fullName.trim(),
          gradeLabel,
          phone: phone.trim(),
          mpesaCode: mpesaCode.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setPaymentStatus('FAILED');
        setPaymentMsg(data.error || 'Failed to submit M-Pesa code.');
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setPaymentStatus('PENDING');
      setPaymentMsg(
        `M-Pesa code ${data.receiptCode} submitted! Waiting for instant admin verification — this screen unlocks your full answer automatically!`
      );
    } catch {
      setPaymentStatus('FAILED');
      setPaymentMsg('Network error submitting M-Pesa code.');
    } finally {
      setSubmittingPayment(false);
    }
  };

  const isSubscribedActive = Boolean(subExpiresAt && subExpiresAt > Date.now());
  const daysRemaining = isSubscribedActive
    ? Math.max(1, Math.ceil(((subExpiresAt || 0) - Date.now()) / (24 * 3600 * 1000)))
    : 0;

  return (
    <>
      {/* HOMEPAGE SHOWCASE CARD */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-950 text-white rounded-3xl p-6 sm:p-7 shadow-lg border border-indigo-500/30 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider px-3 py-1 rounded-full">
                <Sparkles className="w-3.5 h-3.5" />
                Powered by Google Gemini AI
              </span>
              <span className="inline-flex items-center gap-1 bg-indigo-500/25 border border-indigo-400/30 text-indigo-200 text-[11px] font-bold px-3 py-1 rounded-full">
                PP1 – Grade 12 All Subjects • KSh 20 Bob / Week
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Stuck on Homework or Revision? Type Any Question &amp; Get Detailed Gemini
              Answers!
            </h2>
            <p className="text-xs sm:text-sm text-indigo-100/90 leading-relaxed">
              Enter your <strong>Full Name</strong> and <strong>Grade</strong> for
              authentic, personalized step-by-step CBC explanations across Maths,
              Sciences, Kiswahili, English, Humanities &amp; Senior School pathways.
              Preview the first half free — unlock the full answer &amp;{' '}
              <strong className="text-amber-300">
                7 days of unlimited answers for just KSh 20 Bob!
              </strong>
            </p>
          </div>

          <button
            type="button"
            onClick={openGeminiModal}
            className="w-full lg:w-auto shrink-0 bg-gradient-to-r from-amber-400 to-yellow-300 hover:from-amber-300 hover:to-yellow-200 text-slate-950 font-black text-sm px-6 py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2.5 transition cursor-pointer"
          >
            <ButtonEmblemBadge variant="gemini_ai" size="md" />
            <span>ASK GEMINI A QUESTION NOW</span>
          </button>
        </div>
      </section>

      {/* FULL INTERACTIVE MODAL */}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden border border-indigo-200">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-indigo-950 via-purple-950 to-slate-900 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
                  <Bot className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-sm sm:text-base font-black truncate">
                      Ask Gemini — CBC Homework &amp; Exam Tutor
                    </h3>
                    {isSubscribedActive ? (
                      <span className="bg-emerald-400 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full flex items-center gap-1">
                        <Unlock className="w-3 h-3" />
                        WEEKLY PASS ACTIVE ({daysRemaining}d left)
                      </span>
                    ) : (
                      <span className="bg-amber-400/20 border border-amber-300/40 text-amber-200 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                        KSh 20 Bob Weekly Pass
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-indigo-200 truncate">
                    Personalized step-by-step answers tailored to your Name &amp; Grade
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50">
              {/* Monetized Partner / Revision Ad Slot */}
              <AdSlot placement="gemini_qa_hub" />

              {/* STEP 1: AUTHENTIC LEARNER IDENTITY (FULL NAME + GRADE) */}
              {!profileConfirmed ? (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-white border-2 border-indigo-200 rounded-2xl p-5 sm:p-6 shadow-xs space-y-4"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <GraduationCap className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-black text-slate-900 text-sm sm:text-base">
                        Welcome Learner! Tell Gemini Your Name &amp; Grade
                      </h4>
                      <p className="text-xs text-slate-500">
                        Gemini uses your real name and grade level to tailor every
                        explanation authentically to your curriculum level.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Your Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Brian Kamau"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                        Your Grade Level *
                      </label>
                      <select
                        value={gradeKey}
                        onChange={(e) => setGradeKey(e.target.value)}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        {ALL_GRADE_KEYS.map((gk) => (
                          <option key={gk} value={gk}>
                            {formatGradeLabel(gk)}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      M-Pesa / WhatsApp Phone (Optional — Restores Active KSh 20 Pass)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. 0712345678"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>

                  {errorMsg && (
                    <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      {errorMsg}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full bg-indigo-700 hover:bg-indigo-800 text-white font-black text-sm py-3 rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
                  >
                    <UserCheck className="w-4 h-4" />
                    Continue as {fullName.trim() || 'Learner'} ({gradeLabel}) &rarr;
                  </button>
                </form>
              ) : (
                <>
                  {/* Verified Learner Identity Bar */}
                  <div className="bg-indigo-950 text-white rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs">
                      <UserCheck className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Learner: <strong className="text-amber-300">{fullName}</strong> •{' '}
                        <strong className="text-emerald-300">{gradeLabel}</strong>
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setProfileConfirmed(false)}
                      className="text-[11px] font-bold text-indigo-200 hover:text-white underline cursor-pointer"
                    >
                      Edit Name / Grade
                    </button>
                  </div>

                  {/* STEP 2: QUESTION INPUT COMPOSER */}
                  <form
                    onSubmit={handleAskGemini}
                    className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs space-y-3.5"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="sm:col-span-1">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Subject / Learning Area
                        </label>
                        <select
                          value={subject}
                          onChange={(e) => setSubject(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 bg-white"
                        >
                          {SUBJECT_CHOICES.map((s) => (
                            <option key={s} value={s}>
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">
                          Quick Sample Questions (Tap to Try)
                        </label>
                        <div className="flex gap-1.5 overflow-x-auto pb-1">
                          {SAMPLE_QUESTIONS.map((sq, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => setQuestion(sq)}
                              className="shrink-0 text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-900 border border-indigo-200 px-2.5 py-1.5 rounded-lg transition cursor-pointer"
                            >
                              Sample #{i + 1}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-800 uppercase mb-1">
                        Type Your Homework or Revision Question Below
                      </label>
                      <textarea
                        rows={3}
                        required
                        placeholder={`Hi ${fullName.split(' ')[0] || 'Learner'
                          }, type any ${gradeLabel} question here (e.g. Maths calculation, Science process, Kiswahili sarufi, Essay prompt)...`}
                        value={question}
                        onChange={(e) => setQuestion(e.target.value)}
                        className="w-full px-3.5 py-3 border border-slate-300 rounded-xl text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>

                    {errorMsg && (
                      <p className="text-xs font-bold text-rose-600 bg-rose-50 border border-rose-200 rounded-xl p-2.5">
                        {errorMsg}
                      </p>
                    )}

                    <button
                      type="submit"
                      disabled={generating}
                      className="w-full bg-gradient-to-r from-indigo-700 to-purple-700 hover:from-indigo-800 hover:to-purple-800 disabled:opacity-60 text-white font-black text-sm py-3 rounded-xl shadow flex items-center justify-center gap-2 transition cursor-pointer"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Gemini is writing your detailed {gradeLabel} answer...
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Generate Detailed Gemini Answer
                        </>
                      )}
                    </button>
                  </form>

                  {/* STEP 3: GENERATED ANSWER (HALFWAY HIDDEN UNTIL KSh 20 BOB PAID!) */}
                  {(visibleHalf || fullAnswer) && (
                    <div className="bg-white border-2 border-indigo-200 rounded-3xl overflow-hidden shadow-md">
                      {/* Answer Header */}
                      <div className="bg-indigo-50 border-b border-indigo-100 px-5 py-3 flex flex-wrap items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs font-black text-indigo-950">
                          <Sparkles className="w-4 h-4 text-indigo-600" />
                          <span>
                            Gemini Detailed Answer for {fullName} ({gradeLabel} •{' '}
                            {subject})
                          </span>
                        </div>

                        {answerUnlocked && fullAnswer ? (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(fullAnswer);
                              setCopiedAnswer(true);
                              setTimeout(() => setCopiedAnswer(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-600 text-white px-3 py-1 rounded-lg cursor-pointer"
                          >
                            {copiedAnswer ? (
                              <Check className="w-3.5 h-3.5" />
                            ) : (
                              <Copy className="w-3.5 h-3.5" />
                            )}
                            {copiedAnswer ? 'Copied!' : 'Copy Full Answer'}
                          </button>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-black bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                            <Lock className="w-3 h-3" />
                            50% Preview — Unlock Full Below
                          </span>
                        )}
                      </div>

                      {/* Question Echo */}
                      <div className="px-5 pt-4">
                        <div className="bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-600">
                          <strong className="text-slate-900">Question:</strong>{' '}
                          {askedQuestionSnapshot}
                        </div>
                      </div>

                      {/* FULL UNLOCKED VIEW vs HALFWAY BLURRED PAYWALL VIEW */}
                      {answerUnlocked && fullAnswer ? (
                        <div className="p-5 space-y-3">
                          {paymentStatus === 'COMPLETED' && (
                            <PurchaseThankYouBanner buyerName={fullName} compact />
                          )}
                          {renderFormattedAnswer(fullAnswer)}
                          <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-emerald-700 font-bold">
                            <span className="inline-flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4" />
                              Full Answer Unlocked • Weekly Pass Active ({daysRemaining}{' '}
                              days remaining)
                            </span>
                          </div>
                        </div>
                      ) : (
                        <div>
                          {/* Visible First Half */}
                          <div className="px-5 pt-4 pb-2 space-y-3 relative">
                            {renderFormattedAnswer(visibleHalf)}
                            <div className="h-10 bg-gradient-to-b from-transparent to-white pointer-events-none" />
                          </div>

                          {/* Blurred Hidden Second Half + KSh 20 Bob Weekly Subscription Demand */}
                          <div className="relative px-5 pb-6 pt-2 bg-gradient-to-b from-white via-amber-50/50 to-indigo-50/70 border-t border-dashed border-amber-300">
                            {/* Non-selectable Decorative Blurred Continuation Preview (real second half stays safely on server!) */}
                            <div
                              aria-hidden="true"
                              className="select-none pointer-events-none blur-[5px] opacity-45 space-y-2 text-xs text-slate-700 mb-4"
                            >
                              <p className="font-bold">
                                3. Complete Step-by-Step Worked Continuation and Verified
                                Final Answer
                              </p>
                              <p>
                                Substituting the intermediate values into the second stage
                                gives the complete worked expression and final verified
                                curriculum result with full units and KICD rubric points...
                              </p>
                              <p>
                                4. Final Verified Conclusion &amp; KNEC Marking Scheme Tip
                                to score 100% in your {gradeLabel} assessment...
                              </p>
                            </div>

                            {/* KSh 20 Weekly Paywall Card */}
                            <div className="bg-slate-950 text-white rounded-2xl p-5 shadow-xl border-2 border-amber-400 space-y-4">
                              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                <div className="space-y-1">
                                  <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                                    <Lock className="w-3 h-3" />
                                    Answer Hidden Halfway — Payment Required
                                  </span>
                                  <h4 className="text-base sm:text-lg font-black text-white">
                                    Unlock the Whole Answer for Just{' '}
                                    <span className="text-amber-400">
                                      KSh {WEEKLY_FEE_KES} Bob!
                                    </span>
                                  </h4>
                                  <p className="text-xs text-slate-300 leading-relaxed">
                                    Pay <strong>KSh {WEEKLY_FEE_KES} Weekly Subscription</strong>{' '}
                                    now to reveal the rest of{' '}
                                    <strong>{fullName.split(' ')[0]}&apos;s</strong>{' '}
                                    worked solution <strong>PLUS unlimited full Gemini answers</strong>{' '}
                                    across all subjects for the next <strong>7 days</strong>!
                                  </p>
                                </div>

                                {!showPayBox && (
                                  <button
                                    type="button"
                                    onClick={handleOpenPaywall}
                                    className="shrink-0 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
                                  >
                                    <Unlock className="w-4 h-4" />
                                    Pay KSh {WEEKLY_FEE_KES} Bob to View All
                                  </button>
                                )}
                              </div>

                              {showPayBox && (
                                <div className="bg-slate-900 border border-slate-700 rounded-2xl p-4 space-y-3.5 text-xs">
                                  {/* STK Push (Primary) vs Direct M-Pesa Code Switcher */}
                                  <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentMsg('');
                                        setPayTab('STK');
                                      }}
                                      className={`py-2 rounded-lg text-[11px] font-black transition cursor-pointer ${payTab === 'STK'
                                        ? 'bg-emerald-500 text-slate-950 shadow'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                      1. M-Pesa STK Push (KSh {WEEKLY_FEE_KES})
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setPaymentMsg('');
                                        setPayTab('DIRECT');
                                      }}
                                      className={`py-2 rounded-lg text-[11px] font-black transition cursor-pointer ${payTab === 'DIRECT'
                                        ? 'bg-amber-400 text-slate-950 shadow'
                                        : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                      2. Pochi la Biashara ({merchantPhone})
                                    </button>
                                  </div>

                                  {payTab === 'STK' ? (
                                    <form
                                      onSubmit={handleInitiateKsh20Stk}
                                      className="space-y-3.5"
                                    >
                                      <div>
                                        <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                          Enter M-Pesa Phone Number for KSh {WEEKLY_FEE_KES} Prompt *
                                        </label>
                                        <div className="relative">
                                          <Smartphone className="w-4 h-4 text-emerald-400 absolute left-3 top-2.5" />
                                          <input
                                            type="tel"
                                            required
                                            placeholder="0712345678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                                          />
                                        </div>
                                      </div>

                                      {paymentMsg && (
                                        <div
                                          className={`rounded-xl p-3 font-semibold flex items-start gap-2 ${paymentStatus === 'FAILED'
                                            ? 'bg-rose-950/80 border border-rose-700 text-rose-200'
                                            : 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
                                            }`}
                                        >
                                          {paymentStatus === 'PENDING' ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0 mt-0.5" />
                                          ) : (
                                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                          )}
                                          <span>{paymentMsg}</span>
                                        </div>
                                      )}

                                      <button
                                        type="submit"
                                        disabled={
                                          submittingPayment || paymentStatus === 'PENDING'
                                        }
                                        className="w-full bg-emerald-500 hover:bg-emerald-400 disabled:bg-slate-700 text-slate-950 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                                      >
                                        {submittingPayment || paymentStatus === 'PENDING' ? (
                                          <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                          <Unlock className="w-4 h-4" />
                                        )}
                                        {paymentStatus === 'PENDING'
                                          ? 'Waiting for M-Pesa PIN Confirmation...'
                                          : `Send KSh ${WEEKLY_FEE_KES} M-Pesa STK Prompt & Reveal All`}
                                      </button>
                                    </form>
                                  ) : (
                                    <form
                                      onSubmit={handleSubmitKsh20Code}
                                      className="space-y-3.5"
                                    >
                                      <div className="bg-slate-950 border border-emerald-500/40 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-2">
                                        <div className="space-y-0.5">
                                          <p className="text-[11px] font-bold text-emerald-300 uppercase">
                                            Step 1: Lipa na M-Pesa &rarr; Pochi la Biashara (KSh{' '}
                                            {WEEKLY_FEE_KES})
                                          </p>
                                          <p className="text-sm font-black font-mono text-white">
                                            Pochi Phone: {merchantPhone} • Amount: KSh{' '}
                                            {WEEKLY_FEE_KES}
                                          </p>
                                        </div>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            navigator.clipboard?.writeText(merchantPhone);
                                            setCopiedPhone(true);
                                            setTimeout(() => setCopiedPhone(false), 2000);
                                          }}
                                          className="bg-emerald-500 text-slate-950 font-black px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                                        >
                                          {copiedPhone ? (
                                            <Check className="w-3.5 h-3.5" />
                                          ) : (
                                            <Copy className="w-3.5 h-3.5" />
                                          )}
                                          {copiedPhone ? 'Copied!' : `Copy ${merchantPhone}`}
                                        </button>
                                      </div>

                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                            Your M-Pesa Phone Number *
                                          </label>
                                          <input
                                            type="tel"
                                            required
                                            placeholder="0712345678"
                                            value={phone}
                                            onChange={(e) => setPhone(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono"
                                          />
                                        </div>
                                        <div>
                                          <label className="block text-[10px] font-bold uppercase text-slate-400 mb-1">
                                            Paste M-Pesa Code or Full SMS *
                                          </label>
                                          <input
                                            type="text"
                                            required
                                            placeholder="e.g. SJK84M2P9Q"
                                            value={mpesaCode}
                                            onChange={(e) => setMpesaCode(e.target.value)}
                                            className="w-full px-3 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono uppercase"
                                          />
                                        </div>
                                      </div>

                                      {paymentMsg && (
                                        <div
                                          className={`rounded-xl p-3 font-semibold flex items-start gap-2 ${paymentStatus === 'FAILED'
                                            ? 'bg-rose-950/80 border border-rose-700 text-rose-200'
                                            : 'bg-emerald-950/80 border border-emerald-600 text-emerald-200'
                                            }`}
                                        >
                                          {paymentStatus === 'PENDING' ? (
                                            <Loader2 className="w-4 h-4 animate-spin text-amber-300 shrink-0 mt-0.5" />
                                          ) : (
                                            <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                                          )}
                                          <span>{paymentMsg}</span>
                                        </div>
                                      )}

                                      <div className="flex flex-wrap items-center gap-2.5">
                                        <button
                                          type="submit"
                                          disabled={
                                            submittingPayment || paymentStatus === 'PENDING'
                                          }
                                          className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:bg-slate-700 text-slate-950 font-black py-3 px-4 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
                                        >
                                          {submittingPayment ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                          ) : (
                                            <Unlock className="w-4 h-4" />
                                          )}
                                          {paymentStatus === 'PENDING'
                                            ? 'Verifying KSh 20 Payment Automatically...'
                                            : 'Verify KSh 20 & Reveal Full Answer'}
                                        </button>

                                        {paymentStatus === 'PENDING' && (
                                          <a
                                            href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                                              `Hello! I just paid KSh 20 Weekly Gemini Subscription (Code: ${mpesaCode
                                                .trim()
                                                .toUpperCase()}) for ${fullName} (${gradeLabel}). Kindly approve my full answer.`
                                            )}`}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-3.5 rounded-xl inline-flex items-center gap-1.5"
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
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
