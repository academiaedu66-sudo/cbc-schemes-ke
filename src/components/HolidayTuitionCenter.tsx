'use client';

import React, { useEffect, useMemo, useState } from 'react';
import {
  Award,
  BookOpen,
  Check,
  CheckCircle2,
  Copy,
  GraduationCap,
  Loader2,
  Lock,
  MapPin,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { ALL_GRADE_KEYS, formatGradeLabel } from '@/lib/material-utils';
import { useMonetization } from '@/components/MonetizationEngine';
import {
  COORDINATOR_MPESA_LOCAL,
  COORDINATOR_WHATSAPP_LOCAL,
  GRADE_BAND_LABELS,
  gradeToBand,
  LEARNER_FEE_KES,
  SUBJECTS_BY_BAND,
  TEACHER_FEE_KES,
  type GradeBandKey,
  type PublicTuitionMatch,
  type TuitionRole,
} from '@/lib/tuition';

const ALL_BANDS: GradeBandKey[] = [
  'PRE_PRIMARY',
  'LOWER_PRIMARY',
  'UPPER_PRIMARY',
  'JUNIOR_SCHOOL',
  'SENIOR_SCHOOL',
];

export default function HolidayTuitionCenter({
  externalOpenRole,
  onClearExternalRole,
}: {
  externalOpenRole?: TuitionRole | null;
  onClearExternalRole?: () => void;
}) {
  const { trackInteraction } = useMonetization();
  const [activeModalRole, setActiveModalRole] = useState<TuitionRole | null>(null);
  const [step, setStep] = useState<'FORM' | 'PAYMENT' | 'MATCHED'>('FORM');

  // Form Fields
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [county, setCounty] = useState('');
  const [learnerGrade, setLearnerGrade] = useState('7');
  const [teacherBands, setTeacherBands] = useState<GradeBandKey[]>(['JUNIOR_SCHOOL']);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);
  const [mode, setMode] = useState<'Home Tuition' | 'Online Tuition' | 'Home or Online'>(
    'Home or Online'
  );
  const [schedule, setSchedule] = useState<
    | 'School Holidays (April / Aug / Dec)'
    | 'Evenings & Weekends'
    | 'Any Convenient Time (Personal Teacher)'
  >('School Holidays (April / Aug / Dec)');
  const [tscOrQualification, setTscOrQualification] = useState('');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Live Subject Match Preview while selecting subjects
  const [previewMatches, setPreviewMatches] = useState<PublicTuitionMatch[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);

  // Payment State (KSh 1,000 for Learner | KSh 500 for Teacher)
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('DIRECT');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedMpesa, setCopiedMpesa] = useState(false);
  const [payProcessing, setPayProcessing] = useState(false);
  const [payStatus, setPayStatus] = useState<'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'>(
    'IDLE'
  );
  const [payMsg, setPayMsg] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [receiptCode, setReceiptCode] = useState<string>('');

  // Final Registration & WhatsApp 0705759072 Match Result
  const [finalRefCode, setFinalRefCode] = useState('');
  const [finalMatches, setFinalMatches] = useState<PublicTuitionMatch[]>([]);
  const [whatsappConnectUrl, setWhatsappConnectUrl] = useState('');

  useEffect(() => {
    if (externalOpenRole) {
      openModalForRole(externalOpenRole);
      onClearExternalRole?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenRole]);

  const openModalForRole = (role: TuitionRole) => {
    trackInteraction(
      role === 'LEARNER' ? 'tuition_student_btn_click' : 'tuition_teacher_btn_click'
    );
    setActiveModalRole(role);
    setStep('FORM');
    setFormError('');
    setPayStatus('IDLE');
    setPayTab('DIRECT');
    setPayMsg('');
    setCheckoutRequestId(null);
    setReceiptCode('');
    setMpesaCode('');
    setSelectedSubjects([]);
  };

  const closeModal = () => {
    setActiveModalRole(null);
  };

  // Available subjects based on selected grade (for Learner) or selected bands (for Teacher)
  const availableSubjects = useMemo(() => {
    if (activeModalRole === 'LEARNER') {
      const band = gradeToBand(learnerGrade);
      return SUBJECTS_BY_BAND[band] || SUBJECTS_BY_BAND.JUNIOR_SCHOOL;
    }
    const set = new Set<string>();
    const bands = teacherBands.length > 0 ? teacherBands : ['JUNIOR_SCHOOL' as const];
    for (const b of bands) {
      for (const s of SUBJECTS_BY_BAND[b] || []) set.add(s);
    }
    return Array.from(set);
  }, [activeModalRole, learnerGrade, teacherBands]);

  // Keep selected subjects valid if grade changes, or allow keeping cross-band selections
  const toggleSubject = (subj: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(subj) ? prev.filter((x) => x !== subj) : [...prev, subj]
    );
  };

  const toggleTeacherBand = (band: GradeBandKey) => {
    setTeacherBands((prev) => {
      if (prev.includes(band)) {
        return prev.length > 1 ? prev.filter((b) => b !== band) : prev;
      }
      return [...prev, band];
    });
  };

  // Fetch live subject match preview whenever subjects/grade change
  useEffect(() => {
    if (!activeModalRole || selectedSubjects.length === 0) {
      setPreviewMatches([]);
      return;
    }

    const bands =
      activeModalRole === 'LEARNER'
        ? [gradeToBand(learnerGrade)]
        : teacherBands;

    let cancelled = false;
    setLoadingPreview(true);
    const params = new URLSearchParams({
      role: activeModalRole,
      subjects: selectedSubjects.join('|'),
      bands: bands.join('|'),
      county,
    });

    fetch(`/api/tuition?${params.toString()}`)
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && Array.isArray(data.matches)) {
          setPreviewMatches(data.matches);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoadingPreview(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeModalRole, selectedSubjects, learnerGrade, teacherBands, county]);

  const feeKes = activeModalRole === 'LEARNER' ? LEARNER_FEE_KES : TEACHER_FEE_KES;
  const serviceType =
    activeModalRole === 'LEARNER' ? 'LEARNER_TUITION' : 'TEACHER_TUITION';

  const handleProceedToPayment = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!fullName.trim()) {
      setFormError('Please enter your full name.');
      return;
    }
    if (!phone.trim() || phone.replace(/\D/g, '').length < 9) {
      setFormError('Please enter a valid Safaricom / WhatsApp phone number.');
      return;
    }
    if (!county.trim()) {
      setFormError('Please enter your County or Town (e.g. Nairobi, Nakuru, Kisumu).');
      return;
    }
    if (selectedSubjects.length === 0) {
      setFormError(
        activeModalRole === 'LEARNER'
          ? 'Please select ALL the subjects you need a teacher for.'
          : 'Please select at least one subject you teach.'
      );
      return;
    }
    setStep('PAYMENT');
  };

  const finalizeRegistrationRecord = async (opts: {
    reqId: string;
    paymentState: 'PENDING' | 'COMPLETED';
    mpesaRef?: string;
  }) => {
    const res = await fetch('/api/tuition', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        role: activeModalRole,
        fullName,
        phone,
        county,
        learnerGrade,
        gradeBands:
          activeModalRole === 'LEARNER'
            ? [gradeToBand(learnerGrade)]
            : teacherBands,
        subjects: selectedSubjects,
        mode,
        schedule,
        tscOrQualification,
        notes,
        checkoutRequestId: opts.reqId,
        mpesaReceipt: opts.mpesaRef,
        paymentStatus: opts.paymentState,
      }),
    });

    const data = await res.json();
    if (res.ok && data.success) {
      setFinalRefCode(data.registration.referenceCode);
      setFinalMatches(data.matches || previewMatches);
      setWhatsappConnectUrl(data.whatsappCoordinatorUrl);
      setStep('MATCHED');
    } else {
      setPayStatus('FAILED');
      setPayMsg(data.error || 'Could not finalize registration.');
    }
  };

  // Poll STK payment status when waiting for PIN confirmation
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
          await finalizeRegistrationRecord({
            reqId: checkoutRequestId,
            paymentState: 'COMPLETED',
          });
        } else if (data.status === 'FAILED') {
          window.clearInterval(timer);
          setPayStatus('FAILED');
          setPayMsg(
            'M-Pesa prompt was cancelled or timed out. Retry STK Push or use the Direct M-Pesa Code tab.'
          );
        }
      } catch {
        // Keep polling
      }
    }, 3200);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, payStatus, checkoutRequestId]);

  const handleInitiateStk = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayProcessing(true);
    setPayStatus('IDLE');
    setPayTab('DIRECT');
    setPayMsg('');

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone,
          serviceType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayStatus('FAILED');
        setPayMsg(
          data.error ||
            `Could not trigger STK Push. Switch to the Direct M-Pesa (${COORDINATOR_MPESA_LOCAL}) tab to complete right away.`
        );
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setPayStatus('PENDING');
      setPayMsg(
        `Check your phone (${phone}) and enter your M-Pesa PIN to pay KSh ${feeKes.toLocaleString()}...`
      );
    } catch {
      setPayStatus('FAILED');
      setPayMsg('Network error initiating STK Push. Try again or use Direct M-Pesa Code.');
    } finally {
      setPayProcessing(false);
    }
  };

  const handleDirectMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPayProcessing(true);
    setPayStatus('IDLE');
    setPayTab('DIRECT');
    setPayMsg('');

    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode,
          phoneNumber: phone,
          serviceType,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setPayStatus('FAILED');
        setPayMsg(data.error || 'Invalid M-Pesa transaction code.');
        return;
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setReceiptCode(data.receiptCode || mpesaCode.trim().toUpperCase());
      await finalizeRegistrationRecord({
        reqId: data.checkoutRequestId,
        paymentState: 'PENDING',
        mpesaRef: data.receiptCode || mpesaCode.trim().toUpperCase(),
      });
    } catch {
      setPayStatus('FAILED');
      setPayMsg('Network error verifying M-Pesa code.');
    } finally {
      setPayProcessing(false);
    }
  };

  return (
    <>
      {/* HIGH-VISIBILITY TOP SECTION WITH 2 DISTINCT BUTTONS & BRIEF DESCRIPTIONS */}
      <section
        id="holiday-tuition-hub"
        aria-label="Personal & Holiday Tuition Teacher-Learner Matching Hub"
        className="mb-6 bg-gradient-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white rounded-2xl p-5 md:p-6 shadow-md border border-emerald-700/50"
      >
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-3 border-b border-white/10">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3" />
                Holiday &amp; Personal Teacher Matching Hub
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-300 bg-emerald-900/60 border border-emerald-600/40 px-2.5 py-0.5 rounded-full">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Connection via WhatsApp {COORDINATOR_WHATSAPP_LOCAL}
              </span>
            </div>
            <h2 className="text-base md:text-xl font-black tracking-tight text-white">
              Need a Personal Teacher for Holiday / Convenient Tuition — or Looking for Learners to Teach?
            </h2>
          </div>
          <span className="text-xs text-slate-300 font-medium">
            Smart Subject-by-Subject Matching (PP1 – Grade 12)
          </span>
        </div>

        {/* TWO SIDE-BY-SIDE CARDS: BUTTON 1 (STUDENTS) & BUTTON 2 (TEACHERS) WITH BRIEF DESCRIPTIONS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* BUTTON 1: FOR STUDENTS / LEARNERS (KSh 1,000) */}
          <div className="bg-white/10 hover:bg-white/[0.13] backdrop-blur-xs border border-emerald-400/30 rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-4 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-amber-300">
                  <GraduationCap className="w-4 h-4" />
                  For Students &amp; Parents
                </span>
                <span className="bg-emerald-500 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-lg">
                  Registration: KSh 1,000
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                <strong>Book a Personal or Holiday Tuition Teacher:</strong> Select your
                grade level and <strong>all the CBC subjects</strong> you need a teacher
                for during school holidays, weekends, or at your convenient time. We
                match your subjects to verified teachers and connect you through
                Coordinator WhatsApp <strong>{COORDINATOR_WHATSAPP_LOCAL}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openModalForRole('LEARNER')}
              className="w-full bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <GraduationCap className="w-4 h-4 shrink-0" />
              <span>Book Personal / Holiday Teacher (Student — KSh 1,000)</span>
            </button>
          </div>

          {/* BUTTON 2: FOR TEACHERS / TUTORS (KSh 500) */}
          <div className="bg-white/10 hover:bg-white/[0.13] backdrop-blur-xs border border-sky-400/30 rounded-2xl p-4 md:p-5 flex flex-col justify-between gap-4 transition">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-300">
                  <UserCheck className="w-4 h-4" />
                  For CBC Teachers &amp; Tutors
                </span>
                <span className="bg-sky-400 text-slate-950 text-xs font-black px-2.5 py-0.5 rounded-lg">
                  Registration: KSh 500
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-100 leading-relaxed">
                <strong>Register to Get Learners to Teach:</strong> List the CBC subjects
                and grade levels you teach during school holidays or at your convenient
                time (home or online). Get matched with paying learners requesting your
                subjects and connect via Coordinator WhatsApp{' '}
                <strong>{COORDINATOR_WHATSAPP_LOCAL}</strong>.
              </p>
            </div>

            <button
              type="button"
              onClick={() => openModalForRole('TEACHER')}
              className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs sm:text-sm py-3.5 px-4 rounded-xl shadow transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-4 h-4 shrink-0" />
              <span>Register to Teach Learners (Teacher — KSh 500)</span>
            </button>
          </div>
        </div>
      </section>

      {/* INTERACTIVE REGISTRATION, MULTI-SUBJECT MATCHING & M-PESA MODAL */}
      {activeModalRole && (
        <div className="fixed inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 'FORM') {
                        setActiveModalRole('LEARNER');
                        setSelectedSubjects([]);
                      }
                    }}
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg transition ${
                      activeModalRole === 'LEARNER'
                        ? 'bg-amber-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Student Booking (KSh 1,000)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (step === 'FORM') {
                        setActiveModalRole('TEACHER');
                        setSelectedSubjects([]);
                      }
                    }}
                    className={`text-[11px] font-black uppercase px-2.5 py-1 rounded-lg transition ${
                      activeModalRole === 'TEACHER'
                        ? 'bg-emerald-400 text-slate-950'
                        : 'bg-slate-800 text-slate-300 hover:text-white'
                    }`}
                  >
                    Teacher Registration (KSh 500)
                  </button>
                </div>
                <h3 className="text-base md:text-lg font-black">
                  {activeModalRole === 'LEARNER'
                    ? 'Book a Personal / Holiday Tuition Teacher (KSh 1,000)'
                    : 'Register as a Holiday / Personal Tuition Teacher (KSh 500)'}
                </h3>
                <p className="text-xs text-emerald-300 font-medium">
                  All connections are coordinated &amp; verified through WhatsApp:{' '}
                  <strong>{COORDINATOR_WHATSAPP_LOCAL}</strong>
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5">
              {/* STEP 1: REGISTRATION & SUBJECT MATCHING FORM */}
              {step === 'FORM' && (
                <form onSubmit={handleProceedToPayment} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        {activeModalRole === 'LEARNER'
                          ? 'Learner or Parent Full Name *'
                          : 'Teacher Full Name *'}
                      </label>
                      <input
                        type="text"
                        required
                        placeholder={
                          activeModalRole === 'LEARNER'
                            ? 'e.g. Mary Kamau'
                            : 'e.g. Tr. Peter Njoroge'
                        }
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Safaricom / WhatsApp Phone *
                      </label>
                      <input
                        type="tel"
                        required
                        placeholder="07XXXXXXXX"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        County / Town / Estate *
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Nairobi, Nakuru..."
                        value={county}
                        onChange={(e) => setCounty(e.target.value)}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Tuition Mode
                      </label>
                      <select
                        value={mode}
                        onChange={(e) =>
                          setMode(
                            e.target.value as
                              | 'Home Tuition'
                              | 'Online Tuition'
                              | 'Home or Online'
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      >
                        <option value="Home or Online">Home or Online</option>
                        <option value="Home Tuition">Home Tuition (In-Person)</option>
                        <option value="Online Tuition">Online (Zoom / Google Meet)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Preferred Schedule
                      </label>
                      <select
                        value={schedule}
                        onChange={(e) =>
                          setSchedule(
                            e.target.value as
                              | 'School Holidays (April / Aug / Dec)'
                              | 'Evenings & Weekends'
                              | 'Any Convenient Time (Personal Teacher)'
                          )
                        }
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white"
                      >
                        <option value="School Holidays (April / Aug / Dec)">
                          School Holidays (Apr/Aug/Dec)
                        </option>
                        <option value="Evenings & Weekends">Evenings &amp; Weekends</option>
                        <option value="Any Convenient Time (Personal Teacher)">
                          Flexible / Personal Teacher
                        </option>
                      </select>
                    </div>
                  </div>

                  {/* LEARNER GRADE OR TEACHER BANDS */}
                  {activeModalRole === 'LEARNER' ? (
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Learner&apos;s Current Grade Level *
                      </label>
                      <select
                        value={learnerGrade}
                        onChange={(e) => {
                          setLearnerGrade(e.target.value);
                          setSelectedSubjects([]);
                        }}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm bg-white font-semibold"
                      >
                        {ALL_GRADE_KEYS.map((g) => (
                          <option key={g} value={g}>
                            {formatGradeLabel(g)} ({GRADE_BAND_LABELS[gradeToBand(g)]})
                          </option>
                        ))}
                      </select>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                          TSC Status / Qualification
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. TSC Registered • B.Ed Science / Diploma ECDE"
                          value={tscOrQualification}
                          onChange={(e) => setTscOrQualification(e.target.value)}
                          className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5">
                          Select Grade Levels You Teach *
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {ALL_BANDS.map((b) => {
                            const active = teacherBands.includes(b);
                            return (
                              <button
                                key={b}
                                type="button"
                                onClick={() => toggleTeacherBand(b)}
                                className={`px-3 py-1.5 rounded-xl text-xs font-bold border transition ${
                                  active
                                    ? 'bg-emerald-700 border-emerald-700 text-white'
                                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:border-emerald-400'
                                }`}
                              >
                                {GRADE_BAND_LABELS[b]}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* MULTI-SUBJECT PICKER */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div>
                        <label className="block text-xs font-black text-slate-900 uppercase">
                          {activeModalRole === 'LEARNER'
                            ? 'Select ALL Subjects You Need a Teacher For *'
                            : 'Select ALL Subjects You Teach *'}
                        </label>
                        <p className="text-[11px] text-slate-500">
                          Click each subject below ({selectedSubjects.length} selected)
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setSelectedSubjects([...availableSubjects])}
                          className="text-[11px] font-bold text-emerald-700 hover:underline"
                        >
                          Select All ({availableSubjects.length})
                        </button>
                        {selectedSubjects.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedSubjects([])}
                            className="text-[11px] font-bold text-slate-500 hover:underline"
                          >
                            Clear
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {availableSubjects.map((subj) => {
                        const checked = selectedSubjects.includes(subj);
                        return (
                          <button
                            key={subj}
                            type="button"
                            onClick={() => toggleSubject(subj)}
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition cursor-pointer ${
                              checked
                                ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
                                : 'bg-white border-slate-300 text-slate-700 hover:border-emerald-400'
                            }`}
                          >
                            {checked && <Check className="w-3.5 h-3.5" />}
                            <span>{subj}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* LIVE SUBJECT MATCH PREVIEW BOX */}
                  {selectedSubjects.length > 0 && (
                    <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-3.5 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-black text-emerald-900 flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-emerald-600" />
                          {loadingPreview
                            ? 'Checking subject matches...'
                            : activeModalRole === 'LEARNER'
                            ? `${previewMatches.length} Verified Teacher${
                                previewMatches.length === 1 ? '' : 's'
                              } Match Your Selected Subjects!`
                            : previewMatches.length > 0
                            ? `${previewMatches.length} Active Learner Request${
                                previewMatches.length === 1 ? '' : 's'
                              } Match Your Subjects!`
                            : 'Priority Subject Pool: Your profile will match incoming learners immediately!'}
                        </span>
                        <span className="text-[10px] font-extrabold uppercase bg-white border border-emerald-200 text-emerald-800 px-2 py-0.5 rounded">
                          Via WhatsApp {COORDINATOR_WHATSAPP_LOCAL}
                        </span>
                      </div>

                      {previewMatches.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                          {previewMatches.slice(0, 4).map((m) => (
                            <div
                              key={m.referenceCode}
                              className="bg-white border border-emerald-100 rounded-lg p-2.5 text-[11px] space-y-1"
                            >
                              <div className="flex items-center justify-between font-bold text-slate-900">
                                <span>
                                  {m.maskedName} ({m.referenceCode})
                                </span>
                                <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                                  {m.mode}
                                </span>
                              </div>
                              <p className="text-slate-600 truncate">
                                <strong>Matches:</strong> {m.matchedSubjects.join(', ')}
                              </p>
                              <p className="text-slate-400 flex items-center gap-1">
                                <Lock className="w-3 h-3 text-amber-600" />
                                Connect via Coordinator {COORDINATOR_WHATSAPP_LOCAL}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div>
                    <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                      Additional Notes (Optional — e.g. Days/Hours or Exam Target)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Preparing for KJSEA 2026, prefers mornings 9am–12pm..."
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-sm"
                    />
                  </div>

                  {formError && (
                    <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                      {formError}
                    </p>
                  )}

                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950 flex items-start gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                    <span>
                      <strong>How Connection Works:</strong> Registration is{' '}
                      <strong>KSh {feeKes.toLocaleString()}</strong> (one-time). Before
                      any learner and teacher connect, both connect directly through
                      Coordinator WhatsApp <strong>{COORDINATOR_WHATSAPP_LOCAL}</strong>{' '}
                      for safety and subject verification.
                    </span>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-emerald-700 hover:bg-emerald-800 text-white font-black text-sm py-3.5 rounded-xl transition shadow-sm cursor-pointer"
                  >
                    Continue to M-Pesa Registration (KSh {feeKes.toLocaleString()}) →
                  </button>
                </form>
              )}

              {/* STEP 2: M-PESA PAYMENT (KSh 1,000 STUDENT / KSh 500 TEACHER) */}
              {step === 'PAYMENT' && (
                <div className="space-y-4">
                  <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-3">
                    <div className="space-y-0.5">
                      <p className="text-xs font-black uppercase text-slate-800">
                        {activeModalRole === 'LEARNER'
                          ? `Student Booking (${formatGradeLabel(learnerGrade)})`
                          : 'Teacher Tuition Registration'}
                      </p>
                      <p className="text-xs text-slate-600">
                        <strong>{fullName}</strong> • {selectedSubjects.length} subject
                        {selectedSubjects.length === 1 ? '' : 's'}:{' '}
                        {selectedSubjects.slice(0, 4).join(', ')}
                        {selectedSubjects.length > 4
                          ? ` +${selectedSubjects.length - 4} more`
                          : ''}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-black text-emerald-700">
                        KSh {feeKes.toLocaleString()}
                      </span>
                      <button
                        type="button"
                        onClick={() => setStep('FORM')}
                        className="block text-[11px] font-bold text-slate-500 hover:underline"
                      >
                        ← Edit Subjects / Details
                      </button>
                    </div>
                  </div>

                  {/* Maintenance Notice */}
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-950">
                    <strong>Payment Notice:</strong> M-Pesa STK Push is currently{' '}
                    <strong>under maintenance</strong>. Please pay{' '}
                    <strong>KSh {feeKes.toLocaleString()}</strong> via{' '}
                    <strong>M-Pesa Send Money to {COORDINATOR_MPESA_LOCAL}</strong> and
                    paste your confirmation code below.
                  </div>

                  {/* Send Money (Primary) vs STK Push (Maintenance) Tabs */}
                  <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPayTab('DIRECT')}
                      className={`py-2 rounded-lg text-xs font-black transition ${
                        payTab === 'DIRECT'
                          ? 'bg-white text-emerald-800 shadow-xs'
                          : 'text-slate-600'
                      }`}
                    >
                      M-Pesa Send Money ({COORDINATOR_MPESA_LOCAL})
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayTab('STK')}
                      className={`py-2 rounded-lg text-[11px] font-black transition ${
                        payTab === 'STK'
                          ? 'bg-white text-amber-800 shadow-xs'
                          : 'text-slate-500'
                      }`}
                    >
                      STK Push (Maintenance)
                    </button>
                  </div>

                  {payTab === 'STK' ? (
                    <div className="bg-amber-50 border border-amber-300 rounded-2xl p-5 text-center space-y-3">
                      <span className="inline-block text-[10px] font-black uppercase tracking-wider bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-full">
                        Under Maintenance
                      </span>
                      <h4 className="text-sm font-black text-slate-900">
                        M-Pesa STK Push is Under Maintenance
                      </h4>
                      <p className="text-xs text-slate-700 leading-relaxed">
                        Please use <strong>M-Pesa Send Money</strong> to send{' '}
                        <strong>KSh {feeKes.toLocaleString()}</strong> to{' '}
                        <strong className="font-mono">{COORDINATOR_MPESA_LOCAL}</strong>{' '}
                        and paste your confirmation code to complete registration right
                        away.
                      </p>
                      <button
                        type="button"
                        onClick={() => setPayTab('DIRECT')}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl transition cursor-pointer"
                      >
                        Use M-Pesa Send Money ({COORDINATOR_MPESA_LOCAL}) →
                      </button>
                    </div>
                  ) : (
                    <form onSubmit={handleDirectMpesaSubmit} className="space-y-4">
                      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
                        <p className="font-bold text-emerald-950">
                          Send KSh {feeKes.toLocaleString()} via M-Pesa Send Money to:
                        </p>
                        <div className="flex items-center justify-between bg-white border border-emerald-200 rounded-lg px-3 py-2">
                          <span className="font-mono font-black text-base text-slate-900">
                            {COORDINATOR_MPESA_LOCAL}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard?.writeText(COORDINATOR_MPESA_LOCAL);
                              setCopiedMpesa(true);
                              setTimeout(() => setCopiedMpesa(false), 2000);
                            }}
                            className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                          >
                            {copiedMpesa ? (
                              <>
                                <Check className="w-3.5 h-3.5" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" /> Copy Number
                              </>
                            )}
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                          Paste M-Pesa Transaction Code or SMS *
                        </label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. SJK84M2P9Q"
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value)}
                          className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm font-mono uppercase"
                        />
                      </div>

                      {payMsg && (
                        <p className="text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl p-3">
                          {payMsg}
                        </p>
                      )}

                      <button
                        type="submit"
                        disabled={payProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-black py-3.5 rounded-xl text-sm transition"
                      >
                        {payProcessing
                          ? 'Verifying & Matching Subjects...'
                          : `Submit M-Pesa Code & Connect via WhatsApp ${COORDINATOR_WHATSAPP_LOCAL}`}
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* STEP 3: SUBJECT MATCHES READY -> MANDATORY WHATSAPP 0705759072 CONNECTION */}
              {step === 'MATCHED' && (
                <div className="space-y-5">
                  <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-5 text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <span className="inline-block text-[11px] font-mono font-black bg-white border border-emerald-200 text-emerald-800 px-3 py-0.5 rounded-full">
                      Reference ID: {finalRefCode}
                      {receiptCode ? ` • M-Pesa: ${receiptCode}` : ''}
                    </span>
                    <h4 className="text-lg font-black text-slate-900">
                      {activeModalRole === 'LEARNER'
                        ? 'Registration Saved & Subject Teachers Matched!'
                        : 'Teacher Profile Registered & Subject Pool Activated!'}
                    </h4>
                    <p className="text-xs text-slate-700 max-w-lg mx-auto leading-relaxed">
                      <strong>Final Mandatory Step:</strong> Click the green WhatsApp
                      button below to message Coordinator{' '}
                      <strong>{COORDINATOR_WHATSAPP_LOCAL}</strong> so we verify and
                      connect you directly with your matched{' '}
                      {activeModalRole === 'LEARNER' ? 'teacher(s)' : 'learner(s)'}.
                    </p>
                  </div>

                  {/* Matched List */}
                  {finalMatches.length > 0 && (
                    <div className="space-y-2.5">
                      <h5 className="text-xs font-black uppercase tracking-wider text-slate-600">
                        {activeModalRole === 'LEARNER'
                          ? `Your Subject-Matched Teachers (${finalMatches.length})`
                          : `Matching Learner Requests (${finalMatches.length})`}
                      </h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {finalMatches.slice(0, 6).map((m) => (
                          <div
                            key={m.referenceCode}
                            className="border border-slate-200 rounded-xl p-3.5 bg-slate-50/70 space-y-1.5 text-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-black text-slate-900 flex items-center gap-1">
                                <Award className="w-3.5 h-3.5 text-emerald-600" />
                                {m.maskedName}
                              </span>
                              <span className="font-mono text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                                {m.referenceCode}
                              </span>
                            </div>
                            {m.qualification && (
                              <p className="text-[11px] text-slate-500 font-medium">
                                {m.qualification}
                              </p>
                            )}
                            <p className="text-[11px] text-emerald-800 font-semibold flex items-start gap-1">
                              <BookOpen className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                              <span>Matched: {m.matchedSubjects.join(', ')}</span>
                            </p>
                            <p className="text-[11px] text-slate-500 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {m.county} • {m.mode}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <a
                    href={whatsappConnectUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-4 px-5 rounded-xl shadow-lg transition"
                  >
                    <MessageCircle className="w-5 h-5" />
                    Connect Now via Coordinator WhatsApp ({COORDINATOR_WHATSAPP_LOCAL})
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
