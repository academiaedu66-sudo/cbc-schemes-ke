'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  BookOpen,
  CheckCircle2,
  Copy,
  Check,
  Download,
  FileText,
  Layers,
  ListChecks,
  Loader2,
  Lock,
  MessageCircle,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';

export type BookButtonType = 'GRADE_UP' | 'MADE_FAMILIAR' | 'COMPLETE_BUNDLE';

interface GradeCatalogEntry {
  gradeKey: string;
  gradeLabel: string;
  subjects: string[];
}

interface BookPreviewData {
  bookType: BookButtonType;
  seriesTitle: string;
  gradeKey: string;
  gradeLabel: string;
  subject: string;
  availableSubjects: string[];
  priceKes: number;
  totalPages: number;
  coursebookTitle: string;
  approvedBooks?: Array<{
    series: string;
    publisher: string;
    authors: string;
    note?: string;
  }>;
  officialPortalUrl?: string;
  totalStrands: number;
  totalSubTopics: number;
  totalNotePoints?: number;
  minPointsPerSubstrand?: number;
  minPointsPerStrand?: number;
  strands: Array<{
    strand: string;
    subsCount: number;
    totalPoints?: number;
    subsPreview: string[];
  }>;
  sampleSubTopic: {
    strand: string;
    subtopicTitle: string;
    pointNotes: string[];
  };
  sampleQuestions: Array<{
    qNumber: number;
    strand: string;
    substrand: string;
    prompt: string;
    options: [string, string, string, string] | null;
    marks: number;
    answerText: string;
    explanation: string;
  }>;
}

interface UnlockedBookOrder {
  checkoutRequestId: string;
  amount: number;
  bookType: BookButtonType;
  gradeKey: string;
  subject: string;
  unlockedAt: string;
}

const STORAGE_KEY = 'cbc_books_unlocked_orders_v1';

const FALLBACK_GRADES: GradeCatalogEntry[] = [
  {
    gradeKey: 'PP1',
    gradeLabel: 'PP1',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Psychomotor and Creative Activities',
      'Christian Religious Education',
      'Islamic Religious Education',
    ],
  },
  {
    gradeKey: 'PP2',
    gradeLabel: 'PP2',
    subjects: [
      'Language Activities',
      'Mathematical Activities',
      'Environmental Activities',
      'Psychomotor and Creative Activities',
      'Christian Religious Education',
      'Islamic Religious Education',
    ],
  },
  ...['1', '2', '3'].map((g) => ({
    gradeKey: g,
    gradeLabel: `Grade ${g}`,
    subjects: [
      'English',
      'Kiswahili',
      'Mathematics',
      'Environmental Activities',
      'Creative Activities',
      'Christian Religious Education',
      'Islamic Religious Education',
    ],
  })),
  ...['4', '5', '6'].map((g) => ({
    gradeKey: g,
    gradeLabel: `Grade ${g}`,
    subjects: [
      'English',
      'Kiswahili',
      'Mathematics',
      'Science & Technology',
      'Agriculture & Nutrition',
      'Social Studies',
      'Creative Arts',
      'Christian Religious Education',
      'Islamic Religious Education',
    ],
  })),
  ...['7', '8', '9'].map((g) => ({
    gradeKey: g,
    gradeLabel: `Grade ${g}`,
    subjects: [
      'English',
      'Kiswahili',
      'Mathematics',
      'Integrated Science',
      'Agriculture & Nutrition',
      'Social Studies',
      'Pre-Technical Studies',
      'Creative Arts & Sports',
      'Christian Religious Education',
      'Islamic Religious Education',
    ],
  })),
  ...['10', '11', '12'].map((g) => ({
    gradeKey: g,
    gradeLabel: `Grade ${g}`,
    subjects: [
      'English',
      'Kiswahili',
      'Mathematics',
      'Biology',
      'Chemistry',
      'Physics',
      'Computer Studies',
      'Business Studies',
      'History & Citizenship',
      'Geography',
      'Christian Religious Education',
    ],
  })),
];

const BOOK_BUTTONS_META: Array<{
  type: BookButtonType;
  buttonNum: number;
  serviceType: 'BOOK_GRADE_UP' | 'BOOK_MADE_FAMILIAR' | 'BOOK_COMPLETE_BUNDLE';
  priceKes: number;
  pagesLabel: string;
  title: string;
  subtitle: string;
  bullets: string[];
  accentBg: string;
  accentBorder: string;
  btnClass: string;
  badgeClass: string;
}> = [
    {
      type: 'GRADE_UP',
      buttonNum: 1,
      serviceType: 'BOOK_GRADE_UP',
      priceKes: 500,
      pagesLabel: '50+ Page Complete Subject Book',
      title: 'CBC GRADE UP',
      subtitle:
        'Complete Short Point-Form Notes (12+ Points/Sub-strand, 30+ Points/Strand Across ALL Strands) + 165 Exam Questions + End-of-Book Marking Schemes',
      bullets: [
        'Every Sub-strand has 12+ Point-Form Short Notes (30+ Points per Strand)',
        'Covers ALL Strands of the subject + 165 Zero-Repeat Questions',
        'Complete Marking Schemes & Worked Solutions at the end of the book',
        'Includes Printable PDF + Editable Word (.DOCX) copy',
      ],
      accentBg: 'from-emerald-900 via-emerald-800 to-teal-900',
      accentBorder: 'border-emerald-400',
      btnClass:
        'bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-lg shadow-amber-950/30',
      badgeClass: 'bg-emerald-400/20 text-emerald-200 border-emerald-300/40',
    },
    {
      type: 'MADE_FAMILIAR',
      buttonNum: 2,
      serviceType: 'BOOK_MADE_FAMILIAR',
      priceKes: 750,
      pagesLabel: '50+ Page Notes + Q&A Compilation',
      title: 'SUPER-LIGHT CBC COMPILATION',
      subtitle:
        'In-Depth Point-Form Short Notes (12+ Points/Sub-strand, 30+ Points/Strand Across ALL Strands) + Immediate Topical Questions After Every Sub-strand',
      bullets: [
        'Every Sub-strand has 12+ Point-Form Notes & every Strand 30+ Points',
        'Covers ALL Strands with key definitions, formulas, rules & worked examples',
        'Every Sub-strand is followed immediately by relevant practice questions',
        'Includes Complete Sub-strand Marking Guide at the back + Editable DOCX',
      ],
      accentBg: 'from-indigo-950 via-blue-900 to-indigo-900',
      accentBorder: 'border-sky-400',
      btnClass:
        'bg-sky-400 hover:bg-sky-300 text-slate-950 shadow-lg shadow-sky-950/30',
      badgeClass: 'bg-sky-400/20 text-sky-200 border-sky-300/40',
    },
    {
      type: 'COMPLETE_BUNDLE',
      buttonNum: 3,
      serviceType: 'BOOK_COMPLETE_BUNDLE',
      priceKes: 1500,
      pagesLabel: '100+ Page Master Book + All Subjects',
      title: 'SMART CBC ALL SUBJECTS',
      subtitle:
        'Everything Compiled Together: SUPER-LIGHT CBC COMPILATION + CBC GRADE UP (All Strands Short Notes, Zero-Repeat Qs & Marking Schemes) + All Subjects in Grade!',
      bullets: [
        'Compiles BOTH Books into one Master Book (24+ combined Notes/Sub-strand, 60+/Strand)',
        'Unlocks separate downloads for CBC GRADE UP & SUPER-LIGHT CBC COMPILATION',
        'Switch across ALL subjects in your selected Grade at zero extra cost!',
        'Best Value Prompt Buy — Instant M-Pesa STK Auto-Download (.PDF + .DOCX)',
      ],
      accentBg: 'from-purple-950 via-fuchsia-950 to-amber-950',
      accentBorder: 'border-amber-400',
      btnClass:
        'bg-gradient-to-r from-amber-400 via-yellow-300 to-emerald-400 hover:from-amber-300 hover:to-emerald-300 text-slate-950 shadow-lg shadow-amber-950/40',
      badgeClass: 'bg-amber-400/20 text-amber-200 border-amber-300/50',
    },
  ];

export interface ExternalBookModalLaunch {
  bookType: BookButtonType;
  gradeKey?: string;
  subject?: string;
  tick: number;
}

export default function CbcBooksHub({
  externalLaunch,
  merchantLocalPhone = '0728595160',
  whatsappPhone = '254705759072',
}: {
  externalLaunch?: ExternalBookModalLaunch | null;
  merchantLocalPhone?: string;
  whatsappPhone?: string;
}) {
  const [catalog, setCatalog] = useState<GradeCatalogEntry[]>(FALLBACK_GRADES);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeBookType, setActiveBookType] = useState<BookButtonType>('GRADE_UP');
  const [selectedGradeKey, setSelectedGradeKey] = useState<string>('7');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');

  const [preview, setPreview] = useState<BookPreviewData | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);

  // Prompt Buying (M-Pesa STK Primary + Pochi Direct Code Backup)
  const [payTab, setPayTab] = useState<'STK' | 'DIRECT'>('STK');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'
  >('IDLE');
  const [statusMessage, setStatusMessage] = useState('');
  const [unlockedOrders, setUnlockedOrders] = useState<UnlockedBookOrder[]>([]);

  const autoDownloadedRef = useRef<string | null>(null);

  // Load catalog + saved unlocked orders + check URL ?book=1|2|3 deep link
  useEffect(() => {
    fetch('/api/books?action=catalog')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data?.grades) && data.grades.length > 0) {
          setCatalog(data.grades);
        }
      })
      .catch(() => { });

    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setUnlockedOrders(parsed);
      }
    } catch { }

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const bookParam = params.get('book');
      const gParam = params.get('grade');
      const sParam = params.get('subject');
      if (gParam) setSelectedGradeKey(gParam);
      if (sParam) setSelectedSubject(sParam);
      if (bookParam === '1' || bookParam?.toUpperCase() === 'GRADE_UP') {
        setActiveBookType('GRADE_UP');
        setIsModalOpen(true);
      } else if (bookParam === '2' || bookParam?.toUpperCase() === 'MADE_FAMILIAR') {
        setActiveBookType('MADE_FAMILIAR');
        setIsModalOpen(true);
      } else if (bookParam === '3' || bookParam?.toUpperCase() === 'COMPLETE_BUNDLE') {
        setActiveBookType('COMPLETE_BUNDLE');
        setIsModalOpen(true);
      }
    }
  }, []);

  // Respond to header button triggers
  useEffect(() => {
    if (!externalLaunch) return;
    setActiveBookType(externalLaunch.bookType);
    if (externalLaunch.gradeKey) setSelectedGradeKey(externalLaunch.gradeKey);
    if (externalLaunch.subject) setSelectedSubject(externalLaunch.subject);
    setIsModalOpen(true);
  }, [externalLaunch]);

  // Keep selectedSubject valid when selectedGradeKey changes
  const activeGradeObj = useMemo(
    () =>
      catalog.find((g) => g.gradeKey === selectedGradeKey) ||
      catalog[8] ||
      FALLBACK_GRADES[8],
    [catalog, selectedGradeKey]
  );

  useEffect(() => {
    if (!activeGradeObj.subjects.includes(selectedSubject)) {
      setSelectedSubject(activeGradeObj.subjects[0] || 'Mathematics');
    }
  }, [activeGradeObj, selectedSubject]);

  // Load live Strand/Notes/Questions preview whenever modal is open & selection changes
  useEffect(() => {
    if (!isModalOpen) return;
    let cancelled = false;
    setIsLoadingPreview(true);
    fetch(
      `/api/books?action=preview&bookType=${encodeURIComponent(
        activeBookType
      )}&gradeKey=${encodeURIComponent(selectedGradeKey)}&subject=${encodeURIComponent(
        selectedSubject
      )}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.seriesTitle) {
          setPreview(data);
        }
      })
      .catch(() => { })
      .finally(() => {
        if (!cancelled) setIsLoadingPreview(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isModalOpen, activeBookType, selectedGradeKey, selectedSubject]);

  const currentMeta = useMemo(
    () =>
      BOOK_BUTTONS_META.find((b) => b.type === activeBookType) || BOOK_BUTTONS_META[0],
    [activeBookType]
  );

  // Check if user already has an unlocked order covering the current selection
  const matchingUnlockedOrder = useMemo(() => {
    // 1. A KSh 1,500 COMPLETE_BUNDLE order unlocks ALL books & subjects in that grade (or any 500/750/1500 tier)
    const bundleMatch = unlockedOrders.find(
      (o) => o.amount >= 1500 && o.gradeKey === selectedGradeKey
    );
    if (bundleMatch) return bundleMatch;

    // 2. Exact bookType + grade + subject match
    const exactMatch = unlockedOrders.find(
      (o) =>
        o.amount >= currentMeta.priceKes &&
        o.gradeKey === selectedGradeKey &&
        o.subject === selectedSubject
    );
    return exactMatch || null;
  }, [unlockedOrders, selectedGradeKey, selectedSubject, currentMeta.priceKes]);

  const activeVerifiedId =
    paymentStatus === 'COMPLETED' && checkoutRequestId
      ? checkoutRequestId
      : matchingUnlockedOrder?.checkoutRequestId || null;

  const buildBookDownloadUrl = (
    reqId: string,
    bType: BookButtonType,
    fmt: 'pdf' | 'docx'
  ) =>
    `/api/books?action=download&checkoutRequestId=${encodeURIComponent(
      reqId
    )}&bookType=${encodeURIComponent(bType)}&gradeKey=${encodeURIComponent(
      selectedGradeKey
    )}&subject=${encodeURIComponent(selectedSubject)}&format=${fmt}`;

  // Poll payment status every 1,200ms after STK prompt is sent -> 0-click auto-download on COMPLETED!
  useEffect(() => {
    if (!checkoutRequestId || paymentStatus !== 'PENDING') return;

    const timer = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/books?action=status&checkoutRequestId=${encodeURIComponent(
            checkoutRequestId
          )}`
        );
        const data = await res.json();
        if (data?.status === 'COMPLETED') {
          clearInterval(timer);
          setPaymentStatus('COMPLETED');
          setStatusMessage(
            'M-Pesa Payment Confirmed! Automatically downloading your book now...'
          );

          const newUnlocked: UnlockedBookOrder = {
            checkoutRequestId,
            amount: Number(data.amount) || currentMeta.priceKes,
            bookType: activeBookType,
            gradeKey: selectedGradeKey,
            subject: selectedSubject,
            unlockedAt: new Date().toISOString(),
          };
          setUnlockedOrders((prev) => {
            const filtered = prev.filter(
              (x) => x.checkoutRequestId !== checkoutRequestId
            );
            const next = [newUnlocked, ...filtered].slice(0, 30);
            try {
              localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
            } catch { }
            return next;
          });

          // Trigger automatic 0-click PDF download once per checkoutRequestId
          if (autoDownloadedRef.current !== checkoutRequestId) {
            autoDownloadedRef.current = checkoutRequestId;
            const dlUrl = buildBookDownloadUrl(checkoutRequestId, activeBookType, 'pdf');
            const a = document.createElement('a');
            a.href = dlUrl;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
          }
        } else if (data?.status === 'FAILED') {
          clearInterval(timer);
          setPaymentStatus('FAILED');
          setStatusMessage(
            'M-Pesa prompt was cancelled or timed out. Click below to send a fresh STK prompt or use Pochi la Biashara.'
          );
        }
      } catch {
        // Keep polling quietly
      }
    }, 1200);

    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkoutRequestId, paymentStatus, activeBookType, selectedGradeKey, selectedSubject]);

  const openButtonModal = (bType: BookButtonType) => {
    setActiveBookType(bType);
    setPaymentStatus('IDLE');
    setCheckoutRequestId(null);
    setStatusMessage('');
    setIsModalOpen(true);

    const meta = BOOK_BUTTONS_META.find((m) => m.type === bType) || BOOK_BUTTONS_META[0];
    fetch('/api/purchase-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: `CBC Book Button ${meta.buttonNum}`,
        itemTitle: `${meta.title} (${activeGradeObj.gradeLabel} ${selectedSubject})`,
        amountKes: meta.priceKes,
        stage: 'OPENED_CHECKOUT',
      }),
    }).catch(() => { });
  };

  const handleStkPromptBuy = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phoneNumber.trim()) return;
    setIsSubmitting(true);
    setStatusMessage('');
    setPaymentStatus('IDLE');

    const bookLabel = `${currentMeta.title} — ${activeGradeObj.gradeLabel} ${selectedSubject} (KSh ${currentMeta.priceKes})`;

    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneNumber.trim(),
          serviceType: currentMeta.serviceType,
          bookTitle: bookLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutRequestId) {
        setPaymentStatus('FAILED');
        setStatusMessage(
          data?.error ||
          'Could not send M-Pesa STK prompt. Check your Safaricom phone number or use Option 2 (Pochi la Biashara).'
        );
      } else {
        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStatus('PENDING');
        setStatusMessage(
          data.customerMessage ||
          `M-Pesa STK Prompt for KSh ${currentMeta.priceKes} sent to ${phoneNumber}! Enter your M-Pesa PIN on your phone — your book will download automatically.`
        );
      }
    } catch {
      setPaymentStatus('FAILED');
      setStatusMessage('Network error sending STK prompt. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleManualCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mpesaCode.trim()) return;
    setIsSubmitting(true);
    setStatusMessage('');

    const bookLabel = `${currentMeta.title} — ${activeGradeObj.gradeLabel} ${selectedSubject} (KSh ${currentMeta.priceKes})`;

    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode: mpesaCode.trim(),
          phoneNumber: phoneNumber.trim(),
          serviceType: currentMeta.serviceType,
          bookTitle: bookLabel,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data?.checkoutRequestId) {
        setPaymentStatus('FAILED');
        setStatusMessage(
          data?.error || 'Please paste a valid 10-character M-Pesa confirmation code.'
        );
      } else {
        setCheckoutRequestId(data.checkoutRequestId);
        setPaymentStatus('PENDING');
        setStatusMessage(
          'M-Pesa code received! Verifying payment — your book will unlock automatically the moment approved.'
        );
      }
    } catch {
      setPaymentStatus('FAILED');
      setStatusMessage('Network error submitting M-Pesa code. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section id="cbc-books-hub" className="mb-8 scroll-mt-6">
      {/* MAIN 3-BUTTON SHOWCASE BANNER */}
      <div className="rounded-3xl bg-gradient-to-br from-slate-950 via-emerald-950 to-slate-900 border-2 border-amber-400/80 p-5 sm:p-7 text-white shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-5 border-b border-white/15">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400/20 border border-amber-300/40 text-amber-200 text-xs font-black uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-amber-300" />
              NEW 2026 OFFICIAL 50-PAGE &amp; 100-PAGE CBC BOOKS SERIES (PP1–GRADE 12)
            </div>
            <h2 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-white">
              Complete 50-Page Subject Books &amp; Master Compilations (Instant M-Pesa Prompt Buy)
            </h2>
            <p className="text-emerald-100/90 text-xs sm:text-sm mt-1 max-w-3xl">
              Choose any Grade (PP1–Grade 12) and any Subject. Every book covers{' '}
              <strong>all Strands &amp; Sub-strands</strong> from First Strand to Last Strand with{' '}
              <strong>Complete Marking Schemes</strong> at the end — delivered immediately in{' '}
              <strong>.PDF + Editable .DOCX</strong> upon entering your M-Pesa PIN!
            </p>
          </div>

          {/* Quick Grade & Subject Pre-Selector right on the banner */}
          <div className="flex flex-wrap sm:flex-nowrap items-center gap-2 bg-white/10 p-2.5 rounded-2xl border border-white/15 shrink-0">
            <select
              aria-label="Select Grade for Book"
              value={selectedGradeKey}
              onChange={(e) => setSelectedGradeKey(e.target.value)}
              className="bg-slate-900 text-white border border-emerald-400/50 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              {catalog.map((g) => (
                <option key={g.gradeKey} value={g.gradeKey}>
                  {g.gradeLabel}
                </option>
              ))}
            </select>
            <select
              aria-label="Select Subject for Book"
              value={selectedSubject}
              onChange={(e) => setSelectedSubject(e.target.value)}
              className="bg-slate-900 text-white border border-amber-400/50 rounded-xl px-3 py-2 text-xs font-bold max-w-[200px] focus:outline-none"
            >
              {activeGradeObj.subjects.map((subj) => (
                <option key={subj} value={subj}>
                  {subj}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* THE THREE OFFICIAL BOOK BUTTON CARDS */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 mt-6">
          {BOOK_BUTTONS_META.map((b) => (
            <div
              key={b.type}
              className={`rounded-2xl bg-gradient-to-br ${b.accentBg} border-2 ${b.accentBorder} p-5 flex flex-col justify-between shadow-lg relative overflow-hidden`}
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider border ${b.badgeClass}`}
                  >
                    BUTTON {b.buttonNum} • {b.pagesLabel}
                  </span>
                  <span className="px-3 py-1 rounded-xl bg-white text-slate-950 font-black text-sm shadow-sm">
                    KSh {b.priceKes.toLocaleString()}
                  </span>
                </div>

                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white leading-snug">
                  {b.title}
                </h3>
                <p className="text-xs text-white/85 mt-1.5 leading-relaxed">{b.subtitle}</p>

                <ul className="mt-4 space-y-1.5 text-xs text-white/90">
                  {b.bullets.map((line, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" />
                      <span>{line}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-5 pt-4 border-t border-white/15">
                <div className="text-[11px] text-amber-200 font-bold mb-2 flex items-center justify-between">
                  <span>
                    Selected: {activeGradeObj.gradeLabel} • {selectedSubject}
                  </span>
                  <span>PDF + DOCX</span>
                </div>
                <button
                  type="button"
                  onClick={() => openButtonModal(b.type)}
                  className={`w-full py-3.5 px-4 rounded-xl font-black text-xs sm:text-sm uppercase tracking-wide flex items-center justify-center gap-2 transition cursor-pointer ${b.btnClass}`}
                >
                  <Smartphone className="w-4 h-4 shrink-0" />
                  <span>
                    BUTTON {b.buttonNum}: BUY @ KSh {b.priceKes.toLocaleString()} (M-PESA PROMPT)
                  </span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* PROMPT BUYING + BOOK PREVIEW + INSTANT DOWNLOAD MODAL */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-5xl w-full shadow-2xl border-2 border-emerald-600 overflow-hidden my-auto max-h-[94vh] flex flex-col">
            {/* Modal Top Header */}
            <div className="bg-gradient-to-r from-emerald-900 via-slate-900 to-indigo-950 text-white px-5 py-4 flex items-center justify-between gap-3 shrink-0">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase">
                    BUTTON {currentMeta.buttonNum} • KSh {currentMeta.priceKes.toLocaleString()}
                  </span>
                  <span className="text-xs text-emerald-200 font-bold">
                    {currentMeta.type === 'COMPLETE_BUNDLE'
                      ? '100-Page Compiled Book + Full Grade Subject Pack'
                      : 'Exact 50-Page Subject Book + End-of-Book Marking Schemes'}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-black mt-1">{currentMeta.title}</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
                aria-label="Close Book Modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
              {/* LEFT 7 COLUMNS: SWITCH BOOK BUTTON, GRADE/SUBJECT & LIVE SAMPLE INSIDE BOOK */}
              <div className="lg:col-span-7 space-y-4">
                {/* Switch between Button 1, Button 2, Button 3 */}
                <div>
                  <label className="block text-[11px] font-black uppercase tracking-wider text-slate-500 mb-1.5">
                    1. Choose Book Edition (Button 1, Button 2, or Button 3 Compilation)
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {BOOK_BUTTONS_META.map((b) => {
                      const active = activeBookType === b.type;
                      return (
                        <button
                          key={b.type}
                          type="button"
                          onClick={() => {
                            setActiveBookType(b.type);
                            if (paymentStatus === 'FAILED') setPaymentStatus('IDLE');
                          }}
                          className={`p-2.5 rounded-xl border-2 text-left transition cursor-pointer ${active
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-950 shadow-xs'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                            }`}
                        >
                          <div className="text-[10px] font-black uppercase text-emerald-700">
                            Button {b.buttonNum} • KSh {b.priceKes}
                          </div>
                          <div className="text-xs font-black leading-tight mt-0.5 line-clamp-2">
                            {b.type === 'GRADE_UP'
                              ? 'CBC GRADE UP (50p)'
                              : b.type === 'MADE_FAMILIAR'
                                ? 'SUPER-LIGHT CBC COMPILATION'
                                : 'SMART CBC ALL SUBJECTS'}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Grade & Subject Selectors */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      2. Select Grade (PP1–Grade 12)
                    </label>
                    <select
                      value={selectedGradeKey}
                      onChange={(e) => setSelectedGradeKey(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    >
                      {catalog.map((g) => (
                        <option key={g.gradeKey} value={g.gradeKey}>
                          {g.gradeLabel}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-600 mb-1">
                      3. Select Subject ({activeGradeObj.subjects.length} Subjects)
                    </label>
                    <select
                      value={selectedSubject}
                      onChange={(e) => setSelectedSubject(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900"
                    >
                      {activeGradeObj.subjects.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Live Inside-Book Preview */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-emerald-700" />
                      <span className="text-xs font-black uppercase text-slate-800">
                        Inside Look: {activeGradeObj.gradeLabel} {selectedSubject}
                      </span>
                    </div>
                    <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 text-[11px] font-black">
                      {currentMeta.type === 'COMPLETE_BUNDLE'
                        ? 'Exact 100 Pages (PDF + DOCX)'
                        : 'Exact 50 Pages (PDF + DOCX)'}
                    </span>
                  </div>

                  {isLoadingPreview || !preview ? (
                    <div className="py-8 flex items-center justify-center gap-2 text-slate-500 text-xs font-semibold">
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                      Loading strands, sub-strands &amp; sample pages...
                    </div>
                  ) : (
                    <>
                      {/* Official Approved CBC Coursebooks & Authors Synthesized */}
                      {preview.approvedBooks && preview.approvedBooks.length > 0 && (
                        <div className="rounded-xl bg-amber-50/80 border border-amber-200 p-3">
                          <div className="text-[11px] font-black uppercase text-amber-950 mb-1.5 flex items-center justify-between gap-2">
                            <span>
                              ✓ Official Approved CBC Course Materials Synthesized ({preview.approvedBooks.length} Approved Series):
                            </span>
                          </div>
                          <ul className="space-y-1 text-[11px] text-slate-800">
                            {preview.approvedBooks.slice(0, 5).map((ab, idx) => (
                              <li key={idx}>
                                <strong>{ab.series}</strong> ({ab.publisher}) —{' '}
                                <span className="text-slate-600">{ab.authors}</span>
                                {ab.note ? (
                                  <span className="block text-[10px] text-emerald-800 font-semibold mt-0.5">
                                    • {ab.note}
                                  </span>
                                ) : null}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Strands Covered */}
                      <div>
                        <div className="text-[11px] font-black uppercase text-slate-500 mb-1.5 flex items-center gap-1.5">
                          <Layers className="w-3.5 h-3.5 text-emerald-600" />
                          All {preview.totalStrands} Strands &amp; {preview.totalSubTopics}{' '}
                          Sub-strands Covered ({preview.totalNotePoints || '140+'}{' '}
                          Short Note Points):
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {preview.strands.map((st, idx) => (
                            <span
                              key={idx}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 text-[11px] font-bold"
                            >
                              {idx + 1}. {st.strand} ({st.subsCount} subs •{' '}
                              {st.totalPoints || 36} pts)
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Point-Form Short Notes Preview (Shown Across ALL THREE BUTTONS!) */}
                      <div className="rounded-xl bg-indigo-50/70 border border-indigo-200 p-3">
                        <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                          <span className="text-[11px] font-black uppercase text-indigo-950">
                            Sample Sub-strand Short Notes ({preview.sampleSubTopic.subtopicTitle}):
                          </span>
                          <span className="px-2 py-0.5 rounded-full bg-indigo-200/80 text-indigo-950 text-[10px] font-black">
                            {preview.sampleSubTopic.pointNotes.length} Points/Sub-strand •{' '}
                            {preview.minPointsPerStrand || 32}+ Points/Strand
                          </span>
                        </div>
                        <ul className="space-y-1 text-xs text-slate-700 max-h-48 overflow-y-auto pr-1">
                          {preview.sampleSubTopic.pointNotes.map((pt, i) => (
                            <li key={i} className="leading-snug">
                              {pt}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* Sample Questions + End-of-Book Marking Scheme Snippet */}
                      <div className="rounded-xl bg-emerald-50/60 border border-emerald-200 p-3 space-y-2">
                        <div className="text-[11px] font-black uppercase text-emerald-900 flex items-center gap-1.5">
                          <ListChecks className="w-3.5 h-3.5 text-emerald-700" />
                          Sample Topical Questions + End-of-Book Marking Scheme:
                        </div>
                        {preview.sampleQuestions.slice(0, 2).map((q) => (
                          <div
                            key={q.qNumber}
                            className="bg-white rounded-lg p-2.5 border border-emerald-100 text-xs"
                          >
                            <div className="font-bold text-slate-900">
                              Q{q.qNumber} [{q.substrand}]: {q.prompt}{' '}
                              <span className="text-emerald-700">({q.marks} Marks)</span>
                            </div>
                            <div className="text-[11px] text-emerald-800 font-semibold mt-1">
                              ✓ Marking Scheme (Back of Book): {q.answerText}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* RIGHT 5 COLUMNS: PROMPT BUYING (M-PESA STK PUSH) & INSTANT DOWNLOAD */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border-2 border-emerald-600 bg-emerald-50/40 p-4 sm:p-5 space-y-4">
                  <div className="flex items-center justify-between border-b border-emerald-200 pb-3">
                    <div>
                      <div className="text-[11px] font-black uppercase text-emerald-800">
                        Instant M-Pesa Prompt Checkout
                      </div>
                      <div className="text-sm font-black text-slate-900">
                        {activeGradeObj.gradeLabel} • {selectedSubject}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-black text-emerald-800">
                        KSh {currentMeta.priceKes.toLocaleString()}
                      </div>
                      <div className="text-[10px] font-bold text-slate-500">
                        One-Time Prompt Buy
                      </div>
                    </div>
                  </div>

                  {/* IF ALREADY PAID / UNLOCKED -> SHOW IMMEDIATE DOWNLOAD BUTTONS */}
                  {activeVerifiedId ? (
                    <div className="rounded-2xl bg-emerald-900 text-white p-4 space-y-3 shadow-md">
                      <div className="flex items-center gap-2 text-amber-300 font-black text-sm">
                        <CheckCircle2 className="w-5 h-5 shrink-0" />
                        <span>PAYMENT VERIFIED — YOUR BOOK IS UNLOCKED!</span>
                      </div>
                      <p className="text-xs text-emerald-100">
                        Click below to download your{' '}
                        <strong>
                          {activeGradeObj.gradeLabel} {selectedSubject}
                        </strong>{' '}
                        book in Printable PDF or Editable Word (.DOCX).
                        {(matchingUnlockedOrder?.amount || currentMeta.priceKes) >= 1500 &&
                          ' Because you unlocked Button 3 (KSh 1,500 Compilation), you can also switch the Subject dropdown on the left to download any other subject in this Grade!'}
                      </p>

                      <div className="space-y-2 pt-1">
                        <a
                          href={buildBookDownloadUrl(activeVerifiedId, activeBookType, 'pdf')}
                          className="w-full py-3 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs uppercase flex items-center justify-center gap-2 transition shadow-sm"
                        >
                          <Download className="w-4 h-4" />
                          Download {currentMeta.title} (
                          {activeBookType === 'COMPLETE_BUNDLE' ? '100-Page PDF' : '50-Page PDF'}
                          )
                        </a>

                        <a
                          href={buildBookDownloadUrl(activeVerifiedId, activeBookType, 'docx')}
                          className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-emerald-50 text-emerald-950 font-black text-xs uppercase flex items-center justify-center gap-2 transition"
                        >
                          <FileText className="w-4 h-4 text-emerald-700" />
                          Download Editable Word (.DOCX) Edition
                        </a>

                        {/* Extra separate 50-page book buttons when Complete Compilation (KSh 1,500) is unlocked */}
                        {(activeBookType === 'COMPLETE_BUNDLE' ||
                          (matchingUnlockedOrder?.amount || 0) >= 1500) && (
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/15">
                              <a
                                href={buildBookDownloadUrl(
                                  activeVerifiedId,
                                  'GRADE_UP',
                                  'pdf'
                                )}
                                className="py-2 px-2.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-[11px] text-center transition"
                              >
                                ↓ CBC GRADE UP (50p PDF)
                              </a>
                              <a
                                href={buildBookDownloadUrl(
                                  activeVerifiedId,
                                  'MADE_FAMILIAR',
                                  'pdf'
                                )}
                                className="py-2 px-2.5 rounded-lg bg-indigo-700 hover:bg-indigo-600 text-white font-bold text-[11px] text-center transition"
                              >
                                ↓ SUPER-LIGHT CBC (50p PDF)
                              </a>
                            </div>
                          )}
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Payment Method Tabs */}
                      <div className="grid grid-cols-2 gap-2 bg-white p-1 rounded-xl border border-slate-200">
                        <button
                          type="button"
                          onClick={() => setPayTab('STK')}
                          className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer ${payTab === 'STK'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          1. M-Pesa STK Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => setPayTab('DIRECT')}
                          className={`py-2 px-3 rounded-lg text-xs font-black transition cursor-pointer ${payTab === 'DIRECT'
                            ? 'bg-emerald-700 text-white shadow-xs'
                            : 'text-slate-600 hover:bg-slate-50'
                            }`}
                        >
                          2. Pochi la Biashara
                        </button>
                      </div>

                      {payTab === 'STK' ? (
                        <form onSubmit={handleStkPromptBuy} className="space-y-3">
                          <div>
                            <label className="block text-xs font-black text-slate-800 mb-1">
                              Enter Safaricom M-Pesa Number (For Instant PIN Prompt)
                            </label>
                            <input
                              type="tel"
                              required
                              placeholder="e.g. 0712345678 or 0112345678"
                              value={phoneNumber}
                              onChange={(e) => setPhoneNumber(e.target.value)}
                              className="w-full rounded-xl border-2 border-emerald-500 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 focus:outline-none"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={isSubmitting || paymentStatus === 'PENDING'}
                            className="w-full py-3.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 text-white font-black text-sm uppercase tracking-wide flex items-center justify-center gap-2 shadow-md transition cursor-pointer"
                          >
                            {isSubmitting || paymentStatus === 'PENDING' ? (
                              <>
                                <Loader2 className="w-4 h-4 animate-spin" />
                                <span>
                                  {paymentStatus === 'PENDING'
                                    ? 'Waiting for M-Pesa PIN...'
                                    : 'Sending M-Pesa Prompt...'}
                                </span>
                              </>
                            ) : (
                              <>
                                <Smartphone className="w-4 h-4 text-amber-300" />
                                <span>
                                  PROMPT BUY NOW — KSh {currentMeta.priceKes.toLocaleString()}
                                </span>
                              </>
                            )}
                          </button>
                        </form>
                      ) : (
                        <form onSubmit={handleManualCodeSubmit} className="space-y-3">
                          <div className="rounded-xl bg-white border border-slate-200 p-3 text-xs space-y-1.5">
                            <div className="font-bold text-slate-800">
                              Lipa na M-Pesa → Pochi la Biashara:
                            </div>
                            <div className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg border border-slate-200">
                              <span className="font-black text-base text-emerald-800">
                                {merchantLocalPhone}
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  navigator.clipboard?.writeText(merchantLocalPhone);
                                  setCopiedPhone(true);
                                  setTimeout(() => setCopiedPhone(false), 2000);
                                }}
                                className="text-xs font-bold text-emerald-700 flex items-center gap-1 cursor-pointer"
                              >
                                {copiedPhone ? (
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
                            <div className="text-[11px] text-slate-600">
                              Amount: <strong>KSh {currentMeta.priceKes.toLocaleString()}</strong>{' '}
                              • Paste M-Pesa SMS / Code below:
                            </div>
                          </div>

                          <input
                            type="text"
                            required
                            placeholder="Paste M-Pesa Code e.g. SJK84M2P9Q"
                            value={mpesaCode}
                            onChange={(e) => setMpesaCode(e.target.value)}
                            className="w-full rounded-xl border-2 border-emerald-500 bg-white px-3.5 py-2.5 text-sm font-bold text-slate-900 uppercase"
                          />

                          <button
                            type="submit"
                            disabled={isSubmitting}
                            className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs uppercase tracking-wide flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            {isSubmitting ? (
                              <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                              <Lock className="w-4 h-4 text-amber-300" />
                            )}
                            <span>Verify M-Pesa Code &amp; Unlock Book</span>
                          </button>
                        </form>
                      )}

                      {statusMessage && (
                        <div
                          className={`rounded-xl p-3 text-xs font-semibold ${paymentStatus === 'FAILED'
                            ? 'bg-red-50 text-red-800 border border-red-200'
                            : 'bg-amber-50 text-amber-950 border border-amber-300'
                            }`}
                        >
                          {statusMessage}
                          {paymentStatus === 'PENDING' && (
                            <button
                              type="button"
                              onClick={() => {
                                setPaymentStatus('IDLE');
                                setCheckoutRequestId(null);
                                setStatusMessage('');
                              }}
                              className="block mt-2 underline font-black text-emerald-800 cursor-pointer"
                            >
                              Entered wrong number? Click here to resend prompt
                            </button>
                          )}
                        </div>
                      )}

                      <div className="pt-2 border-t border-emerald-200/70 flex items-center justify-between text-[11px] text-slate-600">
                        <span>Auto-downloads immediately on PIN entry</span>
                        <a
                          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                            `Hello, I am buying ${currentMeta.title} (${activeGradeObj.gradeLabel} ${selectedSubject} - KSh ${currentMeta.priceKes}) on cbcmaterials.shop`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-emerald-700 font-bold inline-flex items-center gap-1 hover:underline"
                        >
                          <MessageCircle className="w-3.5 h-3.5" />
                          Need Help?
                        </a>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
