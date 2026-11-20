'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  FileCheck2,
  FileText,
  Loader2,
  MessageCircle,
  ShieldCheck,
  Smartphone,
  X,
} from 'lucide-react';
import PurchaseThankYouBanner from './PurchaseThankYouBanner';

interface GradeCatalogEntry {
  gradeKey: string;
  gradeLabel: string;
  subjects: string[];
}

interface KjseaPreviewData {
  examTitle: string;
  paperCode: string;
  durationLabel: string;
  gradeKey: string;
  gradeLabel: string;
  kiswahiliGradeLabel: string;
  subject: string;
  availableSubjects: string[];
  isKiswahili: boolean;
  strandsCovered: string[];
  totalQuestions: number;
  totalMarks: number;
  paperPriceKes: number;
  markingSchemePriceKes: number;
  sampleMcq: Array<{
    qNumber: number;
    strand: string;
    prompt: string;
    options: [string, string, string, string];
    marks: number;
  }>;
  sampleStructured: Array<{
    qNumber: number;
    strand: string;
    substrand: string;
    partAPrompt: string;
    partAMarks: number;
    partBPrompt: string;
    partBMarks: number;
    totalMarks: number;
  }>;
}

type KjseaPurchaseMode = 'PAPER' | 'MARKING_SCHEME';

interface UnlockedKjseaItem {
  checkoutRequestId: string;
  mode: KjseaPurchaseMode;
  gradeKey: string;
  subject: string;
  buyerName?: string;
  unlockedAt: string;
}

const STORAGE_KEY = 'cbc_national_kjsea_unlocked_v1';

const FALLBACK_GRADES: GradeCatalogEntry[] = [
  {
    gradeKey: 'PP1',
    gradeLabel: 'PP1',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  },
  {
    gradeKey: 'PP2',
    gradeLabel: 'PP2',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  },
  {
    gradeKey: '9',
    gradeLabel: 'Grade 9',
    subjects: [
      'Mathematics',
      'English',
      'Kiswahili',
      'Integrated Science',
      'Agriculture and Nutrition',
      'Social Studies',
      'Pre-Technical Studies',
      'Creative Arts and Sports',
      'Christian Religious Education (CRE)',
      'Islamic Religious Education (IRE)',
    ],
  },
];

function extractMpesaReceiptClient(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (!upper) return null;
  const sms = upper.match(/\b([A-Z0-9]{10})\s+CONFIRMED\b/);
  if (sms) return sms[1];
  const tok = upper.match(/\b([A-Z][A-Z0-9]{9})\b/);
  if (tok) return tok[1];
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12 ? cleaned : null;
}

export default function NationalKjseaHub({
  externalOpenTick = 0,
  initialGradeKey = '9',
  initialSubject,
  merchantLocalPhone = '0728595160',
  whatsappPhone = '254728595160',
  onOpenCatalogCategory,
}: {
  externalOpenTick?: number;
  initialGradeKey?: string;
  initialSubject?: string;
  merchantLocalPhone?: string;
  whatsappPhone?: string;
  onOpenCatalogCategory?: () => void;
}) {
  const [grades, setGrades] = useState<GradeCatalogEntry[]>(FALLBACK_GRADES);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedGrade, setSelectedGrade] = useState<string>(initialGradeKey || '9');
  const [selectedSubject, setSelectedSubject] = useState<string>(
    initialSubject || 'Mathematics'
  );
  const [purchaseMode, setPurchaseMode] = useState<KjseaPurchaseMode>('PAPER');
  const [preview, setPreview] = useState<KjseaPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Checkout state
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('STK');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [buyerMpesaName, setBuyerMpesaName] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<
    'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'
  >('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeCheckoutId, setActiveCheckoutId] = useState<string | null>(null);
  const [unlockedItems, setUnlockedItems] = useState<UnlockedKjseaItem[]>([]);

  // Load full 14-grade (210-subject) catalog
  useEffect(() => {
    fetch('/api/books?action=catalog')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.grades) && data.grades.length > 0) {
          setGrades(data.grades);
        }
      })
      .catch(() => {});

    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) setUnlockedItems(parsed);
      }
    } catch {}
  }, []);

  // Open modal when triggered from Header button
  useEffect(() => {
    if (externalOpenTick > 0) {
      if (initialGradeKey && initialGradeKey !== 'All') {
        setSelectedGrade(initialGradeKey);
      }
      if (initialSubject && initialSubject !== 'All') {
        setSelectedSubject(initialSubject);
      }
      setModalOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalOpenTick]);

  // Keep selectedSubject valid for selectedGrade
  const currentGradeObj =
    grades.find((g) => g.gradeKey === selectedGrade) || grades[0];
  const availableSubjects = currentGradeObj?.subjects || ['Mathematics'];

  useEffect(() => {
    if (!availableSubjects.includes(selectedSubject)) {
      setSelectedSubject(availableSubjects[0] || 'Mathematics');
    }
  }, [availableSubjects, selectedSubject]);

  // Fetch live preview whenever modal is open and grade/subject changes
  useEffect(() => {
    if (!modalOpen) return;
    let cancelled = false;
    setIsLoadingPreview(true);
    fetch(
      `/api/books?action=kjsea_preview&gradeKey=${encodeURIComponent(
        selectedGrade
      )}&subject=${encodeURIComponent(selectedSubject)}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.examTitle) {
          setPreview(data);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [modalOpen, selectedGrade, selectedSubject]);

  // Reset checkout status when switching between Paper & Marking Scheme or Subject
  useEffect(() => {
    setPaymentStatus('IDLE');
    setStatusMessage('');
    setActiveCheckoutId(null);
  }, [purchaseMode, selectedGrade, selectedSubject]);

  // Poll payment verification once STK or Direct Code is submitted
  useEffect(() => {
    if (!activeCheckoutId || paymentStatus !== 'PENDING') return;
    let cancelled = false;

    const checkNow = async () => {
      try {
        const res = await fetch(
          `/api/books?action=status&checkoutRequestId=${encodeURIComponent(
            activeCheckoutId
          )}`
        );
        const data = await res.json();
        if (cancelled) return;

        if (data.status === 'COMPLETED' && Number(data.amount) >= 50) {
          const finalName =
            String(data.buyerName || '').trim() || buyerMpesaName.trim();
          const entry: UnlockedKjseaItem = {
            checkoutRequestId: activeCheckoutId,
            mode: purchaseMode,
            gradeKey: selectedGrade,
            subject: selectedSubject,
            buyerName: finalName || undefined,
            unlockedAt: new Date().toISOString(),
          };
          setUnlockedItems((prev) => {
            const next = [
              entry,
              ...prev.filter(
                (p) => p.checkoutRequestId !== activeCheckoutId
              ),
            ].slice(0, 30);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch {}
            return next;
          });
          setPaymentStatus('COMPLETED');
          setStatusMessage(
            'KSh 50 M-Pesa payment confirmed! Your PDF and Editable Word (.DOCX) downloads are unlocked below.'
          );
          clearInterval(timer);
        } else if (data.status === 'FAILED') {
          setPaymentStatus('FAILED');
          setStatusMessage(
            'M-Pesa prompt timed out or was cancelled. Resend STK prompt or submit M-Pesa code.'
          );
          clearInterval(timer);
        }
      } catch {}
    };

    const init = setTimeout(checkNow, 800);
    const timer = setInterval(checkNow, 1300);
    return () => {
      cancelled = true;
      clearTimeout(init);
      clearInterval(timer);
    };
  }, [
    activeCheckoutId,
    paymentStatus,
    purchaseMode,
    selectedGrade,
    selectedSubject,
    buyerMpesaName,
  ]);

  const matchingUnlocked = unlockedItems.find(
    (u) =>
      u.mode === purchaseMode &&
      u.gradeKey === selectedGrade &&
      u.subject === selectedSubject
  );

  const buildDownloadUrl = (
    checkoutId: string,
    mode: KjseaPurchaseMode,
    format: 'pdf' | 'docx'
  ) =>
    `/api/books?action=kjsea_authenticated_download&checkoutRequestId=${encodeURIComponent(
      checkoutId
    )}&gradeKey=${encodeURIComponent(selectedGrade)}&subject=${encodeURIComponent(
      selectedSubject
    )}&mode=${mode}&format=${format}`;

  const itemTitle =
    purchaseMode === 'MARKING_SCHEME'
      ? `${currentGradeObj?.gradeLabel || selectedGrade} ${selectedSubject} — KENYA NATIONAL KJSEA TEST — OFFICIAL MARKING SCHEME (KSh 50)`
      : `${currentGradeObj?.gradeLabel || selectedGrade} ${selectedSubject} — KENYA NATIONAL KJSEA TEST — QUESTION PAPER (20 Qs • 2 Hours • KSh 50)`;

  const handleStkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setPaymentStatus('PENDING');
    setStatusMessage(
      'Sending KSh 50 M-Pesa PIN prompt to your phone... Enter your PIN to unlock immediately.'
    );
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          buyerName: buyerMpesaName.trim() || undefined,
          serviceType:
            purchaseMode === 'MARKING_SCHEME'
              ? 'KJSEA_NATIONAL_MARKING_SCHEME'
              : 'KJSEA_NATIONAL_PAPER',
          bookTitle: itemTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to initiate M-Pesa STK');
      setActiveCheckoutId(data.checkoutRequestId);
      setStatusMessage(
        'KSh 50 M-Pesa prompt sent! Enter your PIN — your download unlocks automatically.'
      );
    } catch (err) {
      setPaymentStatus('FAILED');
      setStatusMessage(
        err instanceof Error ? err.message : 'Unable to send M-Pesa prompt.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDirectCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = extractMpesaReceiptClient(mpesaCode);
    if (!parsed) {
      setPaymentStatus('FAILED');
      setStatusMessage(
        'Paste a valid 10-character M-Pesa code (e.g. SJK84M2P9Q) or full M-Pesa SMS.'
      );
      return;
    }
    setIsSubmitting(true);
    setPaymentStatus('PENDING');
    setStatusMessage('Verifying your KSh 50 M-Pesa transaction code...');
    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode,
          phoneNumber,
          buyerName: buyerMpesaName.trim() || undefined,
          serviceType:
            purchaseMode === 'MARKING_SCHEME'
              ? 'KJSEA_NATIONAL_MARKING_SCHEME'
              : 'KJSEA_NATIONAL_PAPER',
          bookTitle: itemTitle,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to submit M-Pesa code');
      setActiveCheckoutId(data.checkoutRequestId);
      setStatusMessage(
        data.message ||
          `Code ${parsed} received! Waiting for instant unlock...`
      );
    } catch (err) {
      setPaymentStatus('FAILED');
      setStatusMessage(
        err instanceof Error ? err.message : 'Verification error.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {/* PROMINENT DEDICATED BUTTON CARD: NATIONAL KJSEA EXAMINATION (ALL GRADES) */}
      <section
        id="national-kjsea-hub"
        aria-label="National KJSEA Examination (All Grades)"
        className="mb-8 rounded-2xl bg-gradient-to-r from-rose-950 via-slate-900 to-emerald-950 border-2 border-amber-400 p-5 sm:p-6 text-white shadow-lg"
      >
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase tracking-wider">
                <Award className="w-3.5 h-3.5" />
                KENYA NATIONAL KJSEA TEST • TIME: 2 HOURS • 20 QUESTIONS
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/50 text-emerald-200 text-[11px] font-extrabold">
                EXAM PAPER: KSh 50 • MARKING SCHEME: KSh 50
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              NATIONAL KJSEA EXAMINATION (ALL GRADES)
            </h2>

            <p className="text-xs sm:text-sm text-emerald-100/95 max-w-3xl leading-relaxed">
              Authentic 2-Hour <strong>KENYA NATIONAL KJSEA TEST</strong> across{' '}
              <strong>PP1, PP2 &amp; Grades 1–12 (All 210 Subjects)</strong> featuring the
              Academic Assessment Crest Seal, KNEC-style First-Page Instructions to
              Candidates (100% Kiswahili Sanifu for Kiswahili), 20 zero-repetition
              questions covering <strong>every syllabus strand</strong> (
              <strong>KSh 50</strong>), plus separate Official Marking Schemes (
              <strong>KSh 50</strong>) in Printable <strong>.PDF</strong> + Editable{' '}
              <strong>.DOCX</strong>.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                setPurchaseMode('PAPER');
                setModalOpen(true);
              }}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs sm:text-sm uppercase px-5 py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
            >
              <Award className="w-4 h-4 text-rose-900 shrink-0" />
              <span>NATIONAL KJSEA EXAMINATION (ALL GRADES)</span>
            </button>

            {onOpenCatalogCategory && (
              <button
                type="button"
                onClick={onOpenCatalogCategory}
                className="bg-white/10 hover:bg-white/20 border border-white/30 text-white font-extrabold text-xs uppercase px-4 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <span>Browse All 420 Tests &amp; Marking Schemes (KSh 50) →</span>
              </button>
            )}
          </div>
        </div>
      </section>

      {/* INTERACTIVE MODAL FOR NATIONAL KJSEA EXAMINATION (ALL GRADES) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border-2 border-amber-400">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-rose-950 via-slate-900 to-emerald-950 text-white px-5 py-4 flex items-center justify-between gap-3 border-b border-amber-400/50">
              <div>
                <div className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  KENYA NATIONAL KJSEA TEST • ALL GRADES (PP1 – GRADE 12)
                </div>
                <h3 className="text-base sm:text-lg font-black uppercase tracking-tight">
                  NATIONAL KJSEA EXAMINATION (ALL GRADES)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 sm:p-6 space-y-5">
              {/* Step 1: Choose Grade & Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200">
                <div>
                  <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                    1. Select Grade (PP1 – Grade 12)
                  </label>
                  <select
                    value={selectedGrade}
                    onChange={(e) => setSelectedGrade(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {grades.map((g) => (
                      <option key={g.gradeKey} value={g.gradeKey}>
                        {g.gradeLabel} ({g.subjects.length} Subjects)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase text-slate-600 mb-1">
                    2. Select Subject / Learning Area
                  </label>
                  <select
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-300 bg-white text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-600"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Step 2: Choose Question Paper (KSh 50) OR Official Marking Scheme (KSh 50) */}
              <div>
                <label className="block text-xs font-black uppercase text-slate-600 mb-2">
                  3. Choose Document to Unlock (Each KSh 50 • Includes PDF + Editable DOCX)
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPurchaseMode('PAPER')}
                    className={`text-left p-4 rounded-xl border-2 transition cursor-pointer ${
                      purchaseMode === 'PAPER'
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-emerald-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-emerald-900">
                        <FileText className="w-4 h-4 text-emerald-700" />
                        QUESTION PAPER ONLY
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white text-xs font-black">
                        KSh 50
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      KNEC Cover Page + Crest Seal + Instructions + 20 Zero-Repeat Questions
                      covering ALL Strands (2 Hours • .PDF + .DOCX)
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPurchaseMode('MARKING_SCHEME')}
                    className={`text-left p-4 rounded-xl border-2 transition cursor-pointer ${
                      purchaseMode === 'MARKING_SCHEME'
                        ? 'border-rose-600 bg-rose-50/70 shadow-xs'
                        : 'border-slate-200 bg-white hover:border-rose-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase text-rose-900">
                        <FileCheck2 className="w-4 h-4 text-rose-700" />
                        OFFICIAL MARKING SCHEME
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-700 text-white text-xs font-black">
                        KSh 50
                      </span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Separate Confidential Scoring Guide &amp; Complete Answers for Q1–Q20
                      (100 Marks + CBC Rubric • .PDF + .DOCX)
                    </p>
                  </button>
                </div>
              </div>

              {/* Live Exam Paper Preview */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
                {isLoadingPreview || !preview ? (
                  <div className="flex items-center gap-2 text-xs text-slate-500 py-4">
                    <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    Loading KENYA NATIONAL KJSEA TEST preview...
                  </div>
                ) : (
                  <>
                    <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-slate-200">
                      <div>
                        <span className="text-[11px] font-black uppercase text-emerald-800">
                          {preview.examTitle} • CODE: {preview.paperCode}
                        </span>
                        <h4 className="text-sm font-black text-slate-900">
                          {preview.isKiswahili
                            ? `${preview.kiswahiliGradeLabel} — ${preview.subject}`
                            : `${preview.gradeLabel} — ${preview.subject}`}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-amber-100 text-amber-900 text-xs font-black">
                        <Clock className="w-3.5 h-3.5" />
                        {preview.isKiswahili
                          ? `MUDA: ${preview.durationLabel}`
                          : `TIME: ${preview.durationLabel}`}{' '}
                        • 20 Qs (100 Marks)
                      </span>
                    </div>

                    <div className="text-xs text-slate-700">
                      <span className="font-bold text-slate-900">
                        {preview.isKiswahili
                          ? 'Mada Kuu Zote Zilizotahiniwa:'
                          : 'All Syllabus Strands Covered (0% Repetition):'}
                      </span>{' '}
                      {preview.strandsCovered.join(' • ')}
                    </div>

                    {preview.sampleMcq[0] && (
                      <div className="bg-white rounded-lg p-3 border border-slate-200 text-xs space-y-1">
                        <div className="font-extrabold text-slate-800">
                          {preview.isKiswahili ? 'Mfano Sehemu A' : 'Sample Section A'} — Q
                          {preview.sampleMcq[0].qNumber} [{preview.sampleMcq[0].strand}]:
                        </div>
                        <div className="text-slate-700 font-medium">
                          {preview.sampleMcq[0].prompt}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Unlocked State OR Checkout Form */}
              {matchingUnlocked ? (
                <div className="space-y-4 rounded-2xl border-2 border-emerald-500 bg-emerald-50/60 p-5">
                  <PurchaseThankYouBanner buyerName={matchingUnlocked.buyerName} />

                  <div className="flex items-center gap-2 text-emerald-900 font-black text-sm">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <span>
                      UNLOCKED:{' '}
                      {purchaseMode === 'MARKING_SCHEME'
                        ? 'OFFICIAL MARKING SCHEME (KSh 50)'
                        : 'QUESTION PAPER BOOKLET (KSh 50)'}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <a
                      href={buildDownloadUrl(
                        matchingUnlocked.checkoutRequestId,
                        matchingUnlocked.mode,
                        'pdf'
                      )}
                      className="bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Print-Ready .PDF
                    </a>
                    <a
                      href={buildDownloadUrl(
                        matchingUnlocked.checkoutRequestId,
                        matchingUnlocked.mode,
                        'docx'
                      )}
                      className="bg-blue-700 hover:bg-blue-800 text-white font-black text-xs uppercase py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 shadow-sm transition"
                    >
                      <Download className="w-4 h-4" />
                      Download Editable Word (.DOCX)
                    </a>
                  </div>

                  <div className="pt-2 border-t border-emerald-200 flex items-center justify-between text-xs">
                    <span className="text-slate-700 font-medium">
                      Need the matching{' '}
                      {purchaseMode === 'PAPER'
                        ? 'Official Marking Scheme (KSh 50)'
                        : 'Question Paper (KSh 50)'}
                      ?
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setPurchaseMode(
                          purchaseMode === 'PAPER' ? 'MARKING_SCHEME' : 'PAPER'
                        )
                      }
                      className="font-black text-rose-700 hover:underline cursor-pointer"
                    >
                      Switch to{' '}
                      {purchaseMode === 'PAPER'
                        ? 'Marking Scheme (KSh 50) →'
                        : 'Question Paper (KSh 50) →'}
                    </button>
                  </div>
                </div>
              ) : (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-black uppercase text-slate-500">
                        Instant M-Pesa Express Unlock
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {itemTitle}
                      </div>
                    </div>
                    <span className="text-lg font-black text-emerald-700">
                      KES 50
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setPayTab('STK')}
                      className={`py-2 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                        payTab === 'STK'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      1. M-Pesa Express Prompt
                    </button>
                    <button
                      type="button"
                      onClick={() => setPayTab('DIRECT')}
                      className={`py-2 rounded-lg text-xs font-black uppercase transition cursor-pointer ${
                        payTab === 'DIRECT'
                          ? 'bg-emerald-700 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      2. Paste M-Pesa Code
                    </button>
                  </div>

                  {payTab === 'STK' ? (
                    <form onSubmit={handleStkSubmit} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Safaricom M-Pesa Phone Number
                          </label>
                          <div className="relative">
                            <Smartphone className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                            <input
                              type="tel"
                              required
                              placeholder="0712345678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full pl-9 pr-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-slate-700 mb-1">
                            Your M-Pesa Name (For Appreciation Card)
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Jane Wanjiku"
                            value={buyerMpesaName}
                            onChange={(e) => setBuyerMpesaName(e.target.value)}
                            className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-600"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-sm uppercase py-3.5 rounded-xl shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Smartphone className="w-4 h-4" />
                        )}
                        <span>
                          Pay KSh 50 via M-Pesa (
                          {purchaseMode === 'MARKING_SCHEME'
                            ? 'Unlock Marking Scheme'
                            : 'Unlock Question Paper'}
                          )
                        </span>
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleDirectCodeSubmit} className="space-y-3">
                      <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-2 text-xs">
                        <div>
                          Send <strong>KSh 50</strong> on M-Pesa to{' '}
                          <strong className="text-emerald-900">
                            {merchantLocalPhone}
                          </strong>{' '}
                          then paste the M-Pesa code below:
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard?.writeText(merchantLocalPhone);
                            setCopiedPhone(true);
                            setTimeout(() => setCopiedPhone(false), 2000);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-white border border-amber-300 font-bold text-amber-900 inline-flex items-center gap-1 shrink-0 cursor-pointer"
                        >
                          {copiedPhone ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                          {copiedPhone ? 'Copied' : 'Copy'}
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <input
                          type="text"
                          required
                          placeholder="M-Pesa Code e.g. SJK84M2P9Q"
                          value={mpesaCode}
                          onChange={(e) => setMpesaCode(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm uppercase font-bold"
                        />
                        <input
                          type="text"
                          placeholder="Your M-Pesa Name (Optional)"
                          value={buyerMpesaName}
                          onChange={(e) => setBuyerMpesaName(e.target.value)}
                          className="w-full px-3 py-2.5 border border-slate-300 rounded-xl text-sm"
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-sm uppercase py-3 rounded-xl shadow-sm transition cursor-pointer"
                      >
                        Verify KSh 50 M-Pesa Code &amp; Unlock
                      </button>
                    </form>
                  )}

                  {statusMessage && (
                    <div
                      className={`p-3 rounded-xl text-xs font-semibold flex items-center justify-between gap-2 ${
                        paymentStatus === 'FAILED'
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {paymentStatus === 'PENDING' && (
                          <Loader2 className="w-4 h-4 animate-spin shrink-0" />
                        )}
                        {statusMessage}
                      </span>
                      <a
                        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                          `Hello, I paid KSh 50 for ${itemTitle}`
                        )}`}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-emerald-700 font-black hover:underline shrink-0"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp Help
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
