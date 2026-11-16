'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  Search,
  Loader2,
  Download,
  CheckCircle,
  AlertCircle,
  UploadCloud,
  ChevronDown,
  Copy,
  Check,
  Smartphone,
  MessageCircle,
  Megaphone,
  GraduationCap,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CategoryGrid, { MATERIAL_AREAS } from '@/components/CategoryGrid';
import ResourceCard, { type ResourceItem } from '@/components/ResourceCard';
import PreviewModal from '@/components/PreviewModal';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import EducationUpdatesHub from '@/components/EducationUpdatesHub';
import HolidayTuitionCenter from '@/components/HolidayTuitionCenter';
import SiteFooter from '@/components/SiteFooter';
import {
  AdSlot,
  PartnerBonusStrip,
  StickyEarnerBar,
  useMonetization,
} from '@/components/MonetizationEngine';
import {
  ALL_GRADE_KEYS,
  formatGradeLabel,
  getGradeSortRank,
  getLevelForGrade,
  getResourceGradeKey,
  matchesExamSubFilter,
  normalizeCategory,
  type ExamSubFilter,
} from '@/lib/material-utils';

const EXAM_FILTER_OPTIONS: Array<{ key: ExamSubFilter; label: string }> = [
  { key: 'ALL', label: 'All Assessments' },
  { key: 'OPENER', label: 'Opener Exams' },
  { key: 'MIDTERM', label: 'Mid-Term Exams' },
  { key: 'ENDTERM', label: 'End-Term Exams' },
  { key: 'KPSEA', label: 'KPSEA (Grade 6 Past & Trials)' },
  { key: 'KJSEA', label: 'KJSEA (Grade 9 Past & Trials)' },
  { key: 'KEYA', label: 'KEYA (Grade 3 SBA)' },
  { key: 'SENIOR_TRIAL', label: 'Senior School Trials' },
];

const PAGE_SIZE = 36;
const DEFAULT_GROUP_PREVIEW = 8;
const FILTERED_GROUP_PREVIEW = 18;
// M-Pesa Payment Recipient: 254728595160 (0728595160)
const DEFAULT_MERCHANT_INTL = '254728595160';
const DEFAULT_MERCHANT_LOCAL = '0728595160';
// WhatsApp Notification Inbox: 254705759072 (0705759072)
const DEFAULT_WHATSAPP_INTL = '254705759072';
const DEFAULT_WHATSAPP_LOCAL = '0705759072';

function extractCodeClient(raw: string): string | null {
  const upper = raw.trim().toUpperCase();
  if (!upper) return null;
  const sms = upper.match(/\b([A-Z0-9]{10})\s+CONFIRMED\b/);
  if (sms) return sms[1];
  const tok = upper.match(/\b([A-Z][A-Z0-9]{9})\b/);
  if (tok) return tok[1];
  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  return cleaned.length >= 8 && cleaned.length <= 12 ? cleaned : null;
}

export default function HomePage() {
  const { trackInteraction } = useMonetization();
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [examSubFilter, setExamSubFilter] = useState<ExamSubFilter>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [expandedAreaCounts, setExpandedAreaCounts] = useState<Record<string, number>>({});

  // Payment & WhatsApp Configuration
  const [merchantPhone, setMerchantPhone] = useState(DEFAULT_MERCHANT_INTL);
  const [merchantLocalPhone, setMerchantLocalPhone] = useState(DEFAULT_MERCHANT_LOCAL);
  const [whatsappPhone, setWhatsappPhone] = useState(DEFAULT_WHATSAPP_INTL);
  const [whatsappLocalPhone, setWhatsappLocalPhone] = useState(DEFAULT_WHATSAPP_LOCAL);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);

  // Checkout Modal State (STK Express is ALWAYS primary & active)
  const [modalItem, setModalItem] = useState<ResourceItem | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'STK' | 'DIRECT'>('STK');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState('');
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [docxDownloadUrl, setDocxDownloadUrl] = useState<string | null>(null);
  const [pdfDownloadUrl, setPdfDownloadUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'
  >('IDLE');

  // Check active M-Pesa payout & WhatsApp inbox configuration
  useEffect(() => {
    fetch('/api/mpesa/stkpush')
      .then((r) => r.json())
      .then((cfg) => {
        if (cfg?.merchantPhone) setMerchantPhone(cfg.merchantPhone);
        if (cfg?.merchantLocalPhone) setMerchantLocalPhone(cfg.merchantLocalPhone);
        if (cfg?.whatsappPhone) setWhatsappPhone(cfg.whatsappPhone);
        if (cfg?.whatsappLocalPhone) setWhatsappLocalPhone(cfg.whatsappLocalPhone);
      })
      .catch(() => {
        // Keep safe defaults
      });
  }, []);

  // Fetch all pages of real materials from Supabase (>1,000 rows safe)
  useEffect(() => {
    async function fetchAllResources() {
      setIsLoading(true);
      const byId = new Map<string, ResourceItem>();
      let from = 0;

      while (true) {
        const { data, error } = await supabase
          .from('resources')
          .select('*')
          .order('grade', { ascending: true })
          .order('term', { ascending: true })
          .order('id', { ascending: true })
          .range(from, from + 999);

        if (error) {
          console.error('Failed to load items from Supabase:', error.message);
          break;
        }
        if (!data || data.length === 0) break;

        for (const item of data as ResourceItem[]) {
          byId.set(item.id, {
            ...item,
            category: normalizeCategory(item.category),
          });
        }

        if (data.length < 1000) break;
        from += 1000;
      }

      setResources(Array.from(byId.values()));
      setIsLoading(false);
    }

    fetchAllResources();
  }, []);

  // Reset pagination whenever filters change
  useEffect(() => {
    setVisibleCount(PAGE_SIZE);
    setExpandedAreaCounts({});
  }, [selectedGrade, selectedSubject, selectedCategory, selectedTerm, examSubFilter, searchQuery]);

  // Dynamic subject options scoped to selected Grade
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      if (selectedGrade === 'All' || getResourceGradeKey(r) === selectedGrade) {
        if (r.subject) set.add(r.subject);
      }
    }
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [resources, selectedGrade]);

  // Reset selectedSubject if switching Grade makes current subject invalid
  useEffect(() => {
    if (selectedSubject !== 'All' && !availableSubjects.includes(selectedSubject)) {
      setSelectedSubject('All');
    }
  }, [availableSubjects, selectedSubject]);

  // Poll for payment status once an STK push or Direct M-Pesa code is submitted
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (checkoutRequestId && paymentStatus === 'PENDING') {
      interval = setInterval(async () => {
        try {
          const res = await fetch('/api/resources/download', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ checkoutRequestId }),
          });

          const data = await res.json();

          if (data.status === 'COMPLETED' && data.downloadUrl) {
            setPaymentStatus('COMPLETED');
            setDownloadUrl(data.downloadUrl);
            setDocxDownloadUrl(data.docxDownloadUrl || data.downloadUrl);
            setPdfDownloadUrl(data.pdfDownloadUrl || data.downloadUrl);
            setCheckoutMessage(
              'Payment verified! Download BOTH your Editable Word (.DOCX) and Print-Ready (.PDF) copies below.'
            );
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setPaymentStatus('FAILED');
            setCheckoutMessage(
              'Payment was cancelled or timed out. Click below to resend STK prompt or enter M-Pesa code.'
            );
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [checkoutRequestId, paymentStatus]);

  // Matches grade, subject, term & search (used for per-area counts & grouped sections)
  const baseFilteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources
      .filter((item) => {
        const gKey = getResourceGradeKey(item);
        const matchGrade =
          selectedGrade === 'All' || gKey === selectedGrade;
        const matchSubj =
          selectedSubject === 'All' || item.subject === selectedSubject;
        const matchTerm =
          selectedTerm === 'All' || String(item.term ?? 1) === selectedTerm;
        const matchSearch =
          !q ||
          item.title.toLowerCase().includes(q) ||
          gKey.toLowerCase().includes(q) ||
          (item.subject || '').toLowerCase().includes(q) ||
          (item.category || '').toLowerCase().includes(q);
        return matchGrade && matchSubj && matchTerm && matchSearch;
      })
      .sort((a, b) => {
        // Keep Holiday Assignments (term 1-3) grouped together and Curriculum Designs (term 0) grouped together
        const aIsDesign = a.term === 0 ? 1 : 0;
        const bIsDesign = b.term === 0 ? 1 : 0;
        if (aIsDesign !== bIsDesign) return aIsDesign - bIsDesign;
        const rankA = getGradeSortRank(getResourceGradeKey(a));
        const rankB = getGradeSortRank(getResourceGradeKey(b));
        if (rankA !== rankB) return rankA - rankB;
        const subjCmp = (a.subject || '').localeCompare(b.subject || '');
        if (subjCmp !== 0) return subjCmp;
        return (a.term || 0) - (b.term || 0);
      });
  }, [resources, selectedGrade, selectedSubject, selectedTerm, searchQuery]);

  const filteredItems = useMemo(() => {
    return baseFilteredItems.filter((item) => {
      const matchCat =
        selectedCategory === 'All' ||
        normalizeCategory(item.category) === selectedCategory;
      const matchExam = matchesExamSubFilter(item, examSubFilter);
      return matchCat && matchExam;
    });
  }, [baseFilteredItems, selectedCategory, examSubFilter]);

  const groupedAreas = useMemo(() => {
    return MATERIAL_AREAS.map((area) => {
      const items = baseFilteredItems.filter(
        (r) =>
          normalizeCategory(r.category) === area.filterCategory &&
          (area.filterCategory !== 'Revision Papers & Exams' ||
            matchesExamSubFilter(r, examSubFilter))
      );
      return { area, items };
    });
  }, [baseFilteredItems, examSubFilter]);

  const displayedItems = filteredItems.slice(0, visibleCount);

  const singleAreaByGrade = useMemo(() => {
    const map = new Map<string, ResourceItem[]>();
    for (const item of displayedItems) {
      const gKey = getResourceGradeKey(item);
      const list = map.get(gKey) || [];
      list.push(item);
      map.set(gKey, list);
    }
    return Array.from(map.entries()).sort(
      (a, b) => getGradeSortRank(a[0]) - getGradeSortRank(b[0])
    );
  }, [displayedItems]);

  const buildOrderWhatsAppHref = (receipt: string) => {
    if (!modalItem) return `https://wa.me/${whatsappPhone}`;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const msg =
      `🔔 *NEW CBC ORDER PAID*\n` +
      `• *M-Pesa Code:* ${receipt}\n` +
      `• *Amount:* KES ${modalItem.price}\n` +
      (phoneNumber.trim() ? `• *Buyer Phone:* ${phoneNumber.trim()}\n` : '') +
      `• *Material:* ${modalItem.title}\n` +
      (origin ? `• *Approve Unlock:* ${origin}/admin` : '');
    return `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(msg)}`;
  };

  const handleMpesaStkPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('PENDING');
    setCheckoutMessage(
      'Sending M-Pesa PIN prompt to your phone... Check your handset and enter your PIN.'
    );

    try {
      const response = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber,
          resourceId: modalItem?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok)
        throw new Error(data.error || 'Failed to trigger payment');

      setCheckoutRequestId(data.checkoutRequestId);
      setCheckoutMessage(
        'M-Pesa prompt sent! Enter your PIN on your phone — your download unlocks automatically.'
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Payment error';
      setPaymentStatus('FAILED');
      setCheckoutMessage(`Error: ${message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleDirectMpesaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedCode = extractCodeClient(mpesaCode);
    if (!parsedCode) {
      setPaymentStatus('FAILED');
      setCheckoutMessage(
        'Please paste a valid 10-character M-Pesa code (e.g. UKFNHIONPV) or paste the full M-Pesa SMS.'
      );
      return;
    }

    if (notifyViaWhatsApp && typeof window !== 'undefined') {
      window.open(
        buildOrderWhatsAppHref(parsedCode),
        '_blank',
        'noopener,noreferrer'
      );
    }

    setIsProcessing(true);
    setPaymentStatus('PENDING');
    setCheckoutMessage('Submitting your M-Pesa transaction code...');

    try {
      const response = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode,
          phoneNumber,
          resourceId: modalItem?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to verify M-Pesa code');
      }

      setCheckoutRequestId(data.checkoutRequestId);
      setSubmittedReceipt(data.receiptCode || parsedCode);
      setCheckoutMessage(
        data.message ||
          `M-Pesa code ${parsedCode} submitted! Waiting for instant unlock...`
      );
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Verification error';
      setPaymentStatus('FAILED');
      setCheckoutMessage(message);
    } finally {
      setIsProcessing(false);
    }
  };

  const copyMerchantNumber = () => {
    navigator.clipboard?.writeText(merchantLocalPhone);
    setCopiedPhone(true);
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const openCheckoutFor = (res: ResourceItem) => {
    trackInteraction('checkout_modal_open');
    setModalItem(res);
    setPhoneNumber('');
    setMpesaCode('');
    setSubmittedReceipt('');
    setCheckoutMessage('');
    setCheckoutRequestId(null);
    setDownloadUrl(null);
    setDocxDownloadUrl(null);
    setPdfDownloadUrl(null);
    setPaymentStatus('IDLE');
    setCheckoutTab('STK');
  };

  const resetModal = () => {
    setModalItem(null);
    setPhoneNumber('');
    setMpesaCode('');
    setSubmittedReceipt('');
    setCheckoutMessage('');
    setCheckoutRequestId(null);
    setDownloadUrl(null);
    setDocxDownloadUrl(null);
    setPdfDownloadUrl(null);
    setPaymentStatus('IDLE');
  };

  const whatsappConfirmHref = buildOrderWhatsAppHref(
    submittedReceipt || extractCodeClient(mpesaCode) || mpesaCode.trim().toUpperCase()
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Entry Welcome Splash & Persistent Animated Welcome Ribbon */}
      <WelcomeAnimation />

      {/* Header Bar */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-300" />
              CBC Kenya Resource Hub
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Rationalized Schemes of Work, Lesson Plans, Notes, Opener/Mid/End-Term
              Exams, KPSEA/KJSEA Trials &amp; Designs (PP1–Grade 12 • Editable DOCX + PDF)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <a
              href="#holiday-tuition-hub"
              className="bg-white text-emerald-900 hover:bg-emerald-50 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs"
            >
              <GraduationCap className="w-4 h-4 text-emerald-700" />
              Personal &amp; Holiday Tuition
            </a>
            <Link
              href="/advertise"
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs"
            >
              <Megaphone className="w-4 h-4" />
              Advertise
            </Link>
            <Link
              href="/admin"
              className="bg-emerald-900/60 hover:bg-emerald-900 border border-emerald-600/60 text-emerald-100 px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <UploadCloud className="w-4 h-4" />
              Admin Studio
            </Link>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                'Hello, I need CBC curriculum materials'
              )}`}
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp {whatsappLocalPhone}
            </a>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* TOP FEATURE: PERSONAL & HOLIDAY TUITION (STUDENT KSh 1,000 | TEACHER KSh 500 -> WHATSAPP 0705759072) */}
        <HolidayTuitionCenter />

        {/* 0. 2026 MoE Term Dates & TSC / KNEC Quick Updates Strip */}
        <EducationUpdatesHub
          onQuickJump={({ grade, term, category, examSubFilter: exFilter }) => {
            if (grade !== undefined) setSelectedGrade(grade);
            if (term !== undefined) setSelectedTerm(term);
            if (category !== undefined) setSelectedCategory(category);
            if (exFilter !== undefined) setExamSubFilter(exFilter);
          }}
        />

        {/* Top Leaderboard Ad & Sponsor Unit */}
        <AdSlot placement="top_leaderboard" className="mb-6" />

        {/* 1. Category Cards Showcase with Live Counts */}
        <CategoryGrid
          resources={resources}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => {
            trackInteraction('category_card_select');
            setSelectedCategory(cat);
            if (cat !== 'Revision Papers & Exams') setExamSubFilter('ALL');
          }}
        />

        {/* Interactive Partner / Smartlink Offer Strip */}
        <PartnerBonusStrip />

        {/* 2. Quick Grade Selector Pills (PP1, PP2 & Grades 1–12) */}
        <div
          id="materials-Catalog"
          className="flex items-center gap-2 overflow-x-auto pb-2 mt-6 no-scrollbar"
        >
          <button
            type="button"
            onClick={() => {
              trackInteraction('grade_pill_select');
              setSelectedGrade('All');
            }}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedGrade === 'All'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
            }`}
          >
            All Levels (PP1–G12)
          </button>
          {ALL_GRADE_KEYS.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => {
                trackInteraction('grade_pill_select');
                setSelectedGrade(g);
              }}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedGrade === g
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
              }`}
            >
              {formatGradeLabel(g)}
            </button>
          ))}
        </div>

        {/* 3. Filter & Search Controls */}
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm my-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search Keyword
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. KPSEA, Science, CRE..."
                  value={searchQuery}
                  onChange={(e) => {
                    trackInteraction('catalog_search');
                    setSearchQuery(e.target.value);
                  }}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Grade Level
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => {
                  trackInteraction('grade_dropdown_select');
                  setSelectedGrade(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Levels (PP1 to Grade 12)</option>
                <optgroup label="Pre-Primary (ECDE)">
                  <option value="PP1">PP1 (Pre-Primary 1)</option>
                  <option value="PP2">PP2 (Pre-Primary 2)</option>
                </optgroup>
                <optgroup label="Lower Primary">
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3 (KEYA)</option>
                </optgroup>
                <optgroup label="Upper Primary">
                  <option value="4">Grade 4</option>
                  <option value="5">Grade 5</option>
                  <option value="6">Grade 6 (KPSEA)</option>
                </optgroup>
                <optgroup label="Junior School (JSS)">
                  <option value="7">Grade 7</option>
                  <option value="8">Grade 8</option>
                  <option value="9">Grade 9 (KJSEA)</option>
                </optgroup>
                <optgroup label="Senior School">
                  <option value="10">Grade 10</option>
                  <option value="11">Grade 11</option>
                  <option value="12">Grade 12</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Learning Area / Subject
              </label>
              <select
                value={selectedSubject}
                onChange={(e) => {
                  trackInteraction('subject_filter_select');
                  setSelectedSubject(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Subjects ({availableSubjects.length})</option>
                {availableSubjects.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Material Area
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => {
                  trackInteraction('area_dropdown_select');
                  setSelectedCategory(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Areas (Grouped Together)</option>
                <option value="Schemes of Work">Schemes of Work</option>
                <option value="Lesson Plans">CBC Lesson Plans</option>
                <option value="Teachers' Notes">Teachers&apos; &amp; Lesson Notes</option>
                <option value="Records of Work">
                  Records of Work &amp; Rubrics
                </option>
                <option value="Revision Papers & Exams">
                  Exams &amp; Marking Schemes
                </option>
                <option value="Holiday Assignments & Designs">
                  Holiday Packs &amp; Designs
                </option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Term
              </label>
              <select
                value={selectedTerm}
                onChange={(e) => {
                  trackInteraction('term_filter_select');
                  setSelectedTerm(e.target.value);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Terms (1, 2 &amp; 3)</option>
                <option value="1">Term 1</option>
                <option value="2">Term 2</option>
                <option value="3">Term 3</option>
                <option value="0">Terms 1, 2 &amp; 3 (Full Year)</option>
              </select>
            </div>
          </div>

          {/* Quick Material Area Tabs */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <button
              type="button"
              onClick={() => {
                setSelectedCategory('All');
                setExamSubFilter('ALL');
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                selectedCategory === 'All'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              All Areas Grouped ({baseFilteredItems.length.toLocaleString()})
            </button>
            {groupedAreas.map(({ area, items }) => {
              const isSelected = selectedCategory === area.filterCategory;
              return (
                <button
                  key={area.id}
                  type="button"
                  onClick={() => {
                    const nextCat = isSelected ? 'All' : area.filterCategory;
                    setSelectedCategory(nextCat);
                    if (nextCat !== 'Revision Papers & Exams') {
                      setExamSubFilter('ALL');
                    }
                  }}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap border transition"
                  style={
                    isSelected
                      ? {
                          backgroundColor: area.color,
                          borderColor: area.color,
                          color: '#ffffff',
                        }
                      : {
                          backgroundColor: area.bg,
                          borderColor: area.borderColor,
                          color: area.color,
                        }
                  }
                >
                  {area.shortTitle} ({items.length.toLocaleString()})
                </button>
              );
            })}
          </div>

          {/* Assessment & National Trials Sub-Filter Strip (Opener, Mid-Term, End-Term, KPSEA, KJSEA) */}
          <div className="pt-3 border-t border-slate-100 flex items-center gap-2 overflow-x-auto no-scrollbar">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-700 shrink-0">
              Exams &amp; Trials:
            </span>
            {EXAM_FILTER_OPTIONS.map((opt) => {
              const active =
                selectedCategory === 'Revision Papers & Exams' &&
                examSubFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    trackInteraction('exam_filter_select');
                    if (opt.key === 'ALL' && selectedCategory !== 'Revision Papers & Exams') {
                      setSelectedCategory('Revision Papers & Exams');
                      setExamSubFilter('ALL');
                    } else if (active && opt.key !== 'ALL') {
                      setExamSubFilter('ALL');
                    } else {
                      setSelectedCategory('Revision Papers & Exams');
                      setExamSubFilter(opt.key);
                      if (opt.key === 'KPSEA') setSelectedGrade('6');
                      if (opt.key === 'KJSEA') setSelectedGrade('9');
                      if (opt.key === 'KEYA') setSelectedGrade('3');
                    }
                  }}
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap border transition ${
                    active
                      ? 'bg-rose-600 border-rose-600 text-white shadow-xs'
                      : 'bg-rose-50/70 border-rose-200 text-rose-800 hover:bg-rose-100'
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </section>

        {/* 4. Section Divider & Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-2 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
              {selectedCategory === 'All'
                ? 'Curriculum Materials Grouped by Area'
                : `${
                    MATERIAL_AREAS.find((a) => a.filterCategory === selectedCategory)
                      ?.title || selectedCategory
                  }`}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              {selectedCategory === 'All'
                ? 'PP1, PP2 & Grades 1–12 Schemes, Lesson Plans, Notes, Records of Work, Exams & Designs — all delivered in Editable DOCX + Print PDF'
                : 'Organized sequentially from PP1 & PP2 through Grade 12 across Terms 1, 2 & 3'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            {(selectedGrade !== 'All' ||
              selectedSubject !== 'All' ||
              selectedCategory !== 'All' ||
              selectedTerm !== 'All' ||
              examSubFilter !== 'ALL' ||
              searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('All');
                  setSelectedSubject('All');
                  setSelectedCategory('All');
                  setSelectedTerm('All');
                  setExamSubFilter('ALL');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Reset All Filters
              </button>
            )}
            <span className="text-xs font-bold text-slate-500">
              {filteredItems.length.toLocaleString()} matching materials
            </span>
          </div>
        </div>

        {/* 5. Grouped Curriculum Areas Display */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">
              Loading PP1–Grade 12 CBC materials from Supabase...
            </p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200 space-y-2">
            <p className="text-slate-500 text-sm">
              No resources match your selected filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedGrade('All');
                setSelectedSubject('All');
                setSelectedCategory('All');
                setSelectedTerm('All');
                setExamSubFilter('ALL');
                setSearchQuery('');
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : selectedCategory === 'All' ? (
          <div className="space-y-8">
            {groupedAreas
              .filter(({ items }) => items.length > 0)
              .map(({ area, items }, areaIdx) => {
                const defaultSlice =
                  selectedGrade !== 'All' || selectedSubject !== 'All'
                    ? FILTERED_GROUP_PREVIEW
                    : DEFAULT_GROUP_PREVIEW;
                const currentLimit =
                  expandedAreaCounts[area.filterCategory] || defaultSlice;
                const visibleSlice = items.slice(0, currentLimit);
                const remainingInArea = items.length - visibleSlice.length;

                return (
                  <React.Fragment key={area.id}>
                  <section
                    id={area.id}
                    className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
                  >
                    {/* Area Group Header */}
                    <div
                      className="px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      style={{
                        backgroundColor: area.bg,
                        borderColor: area.borderColor,
                      }}
                    >
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="text-base font-black uppercase tracking-wide"
                            style={{ color: area.color }}
                          >
                            {area.title}
                          </h3>
                          <span
                            className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-white border"
                            style={{
                              color: area.color,
                              borderColor: area.borderColor,
                            }}
                          >
                            {items.length.toLocaleString()}{' '}
                            {items.length === 1 ? 'Material' : 'Materials'}
                          </span>
                          <span className="text-[11px] font-bold text-slate-600 bg-white/80 px-2 py-0.5 rounded">
                            {area.badgeText}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-1">
                          {area.subtitle}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedCategory(area.filterCategory)}
                        className="self-start sm:self-center px-3.5 py-2 rounded-xl text-xs font-bold bg-white border shadow-xs hover:shadow transition whitespace-nowrap"
                        style={{
                          color: area.color,
                          borderColor: area.borderColor,
                        }}
                      >
                        Open All {items.length.toLocaleString()} {area.shortTitle} →
                      </button>
                    </div>

                    {/* Grouped Cards Grid */}
                    <div className="p-5">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {visibleSlice.map((item) => (
                          <ResourceCard
                            key={item.id}
                            resource={item}
                            onPreview={(res) => setPreviewItem(res)}
                            onBuy={(res) => openCheckoutFor(res)}
                          />
                        ))}
                      </div>

                      {remainingInArea > 0 && (
                        <div className="mt-5 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() =>
                              setExpandedAreaCounts((prev) => ({
                                ...prev,
                                [area.filterCategory]: currentLimit + 18,
                              }))
                            }
                            className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold border bg-slate-50 hover:bg-slate-100 text-slate-800 border-slate-200 transition"
                          >
                            <ChevronDown className="w-4 h-4" />
                            Show More {area.shortTitle} (
                            {remainingInArea.toLocaleString()} more)
                          </button>
                          <button
                            type="button"
                            onClick={() => setSelectedCategory(area.filterCategory)}
                            className="px-4 py-2.5 rounded-xl text-xs font-bold transition hover:underline"
                            style={{ color: area.color }}
                          >
                            View Dedicated {area.shortTitle} Page →
                          </button>
                        </div>
                      )}
                    </div>
                  </section>
                  {areaIdx % 2 === 0 && (
                    <AdSlot
                      placement="infeed_grid"
                      variantIndex={areaIdx}
                    />
                  )}
                  </React.Fragment>
                );
              })}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Active Single Area Banner */}
            {(() => {
              const activeArea = MATERIAL_AREAS.find(
                (a) => a.filterCategory === selectedCategory
              );
              if (!activeArea) return null;
              return (
                <div
                  className="p-5 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  style={{
                    backgroundColor: activeArea.bg,
                    borderColor: activeArea.borderColor,
                  }}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h3
                        className="text-base font-black uppercase"
                        style={{ color: activeArea.color }}
                      >
                        {activeArea.title}
                      </h3>
                      <span className="text-xs font-bold bg-white px-2.5 py-0.5 rounded-full text-slate-700">
                        {filteredItems.length.toLocaleString()} Materials
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      {activeArea.subtitle}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('All')}
                    className="self-start sm:self-center bg-white px-4 py-2 rounded-xl border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 transition whitespace-nowrap"
                  >
                    ← Back to All Grouped Areas
                  </button>
                </div>
              );
            })()}

            {/* Grade-Grouped Sections inside the Selected Area */}
            {singleAreaByGrade.map(([gradeKey, gradeItems], gIdx) => (
              <React.Fragment key={gradeKey}>
              <section
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 space-y-4"
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="bg-emerald-700 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                      {formatGradeLabel(gradeKey)}
                    </span>
                    <span className="text-xs font-bold text-slate-600 uppercase tracking-wide">
                      {getLevelForGrade(gradeKey)} • {selectedCategory}
                    </span>
                  </div>
                  <span className="text-xs font-semibold text-slate-400">
                    {gradeItems.length}{' '}
                    {gradeItems.length === 1 ? 'document' : 'documents'}
                  </span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {gradeItems.map((item) => (
                    <ResourceCard
                      key={item.id}
                      resource={item}
                      onPreview={(res) => setPreviewItem(res)}
                      onBuy={(res) => openCheckoutFor(res)}
                    />
                  ))}
                </div>
              </section>
              {gIdx % 2 === 1 && (
                <AdSlot placement="infeed_grid" variantIndex={gIdx} />
              )}
              </React.Fragment>
            ))}

            {visibleCount < filteredItems.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE * 2)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More {selectedCategory} (
                  {(filteredItems.length - visibleCount).toLocaleString()}{' '}
                  remaining)
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* SEO & AdSense Compliance Footer */}
      <SiteFooter />

      {/* Dismissible Sticky Bottom Monetization Bar */}
      <StickyEarnerBar />

      {/* Floating WhatsApp Support Button -> 0705759072 (254705759072) */}
      <a
        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
          'Hello, I need help with CBC curriculum materials'
        )}`}
        target="_blank"
        rel="noreferrer"
        onClick={() => trackInteraction('whatsapp_help_click')}
        className="fixed bottom-5 right-5 z-40 inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-lg transition"
      >
        <MessageCircle className="w-4 h-4" />
        <span>WhatsApp Help: {whatsappLocalPhone}</span>
      </a>

      {/* Rich Material Preview Modal */}
      <PreviewModal
        resource={previewItem}
        onClose={() => setPreviewItem(null)}
        onBuy={(res) => {
          setPreviewItem(null);
          openCheckoutFor(res);
        }}
      />

      {/* Live M-Pesa Express Checkout Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative my-6">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-lg font-black text-slate-900 mb-1">
              M-Pesa Express Checkout
            </h2>
            <p className="text-xs text-slate-500 mb-4 pr-6">{modalItem.title}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center mb-4">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                Pay Safaricom M-Pesa • Unlocks DOCX + PDF
              </span>
              <p className="text-2xl font-black text-emerald-900">
                KES {modalItem.price}
              </p>
              <span className="text-[11px] font-semibold text-emerald-700">
                Includes Editable Word (.DOCX) + Print-Ready (.PDF)
              </span>
            </div>

            {paymentStatus === 'COMPLETED' && downloadUrl ? (
              <div className="space-y-3.5 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Payment Verified! Both Formats Unlocked</span>
                </div>
                <p className="text-xs text-slate-600">{checkoutMessage}</p>
                <div className="space-y-2.5 pt-1">
                  <a
                    href={docxDownloadUrl || downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-sm"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download Editable Word (.DOCX — Edit School Header)</span>
                  </a>
                  <a
                    href={pdfDownloadUrl || downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    download
                    className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm transition shadow-sm"
                  >
                    <Download className="w-4 h-4 shrink-0" />
                    <span>Download Print-Ready (.PDF — Instant Print / View)</span>
                  </a>
                </div>
              </div>
            ) : (
              <>
                {/* Payment Method Switcher (Always enabled so buyers are never stuck) */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTab('STK');
                      if (paymentStatus !== 'PENDING') setCheckoutMessage('');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      checkoutTab === 'STK'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    M-Pesa STK Prompt
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTab('DIRECT');
                      setPaymentStatus('IDLE');
                      setCheckoutMessage('');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                      checkoutTab === 'DIRECT'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Enter M-Pesa Code
                  </button>
                </div>

                {checkoutTab === 'STK' ? (
                  <form onSubmit={handleMpesaStkPay} className="space-y-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Enter Your M-Pesa Number
                      </label>
                      <input
                        type="tel"
                        placeholder="07XXXXXXXX or 01XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={isProcessing}
                        className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <p className="text-[11px] text-slate-500 mt-1">
                        An automatic M-Pesa PIN prompt for{' '}
                        <strong>KES {modalItem.price}</strong> will pop up on
                        your phone.
                      </p>
                    </div>

                    {checkoutMessage && (
                      <div
                        className={`text-xs text-center p-3 rounded-lg flex items-center justify-center gap-2 ${
                          paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {paymentStatus === 'PENDING' && (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                        )}
                        {paymentStatus === 'FAILED' && (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{checkoutMessage}</span>
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={isProcessing || paymentStatus === 'PENDING'}
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm"
                    >
                      {paymentStatus === 'PENDING'
                        ? 'Waiting for M-Pesa PIN Entry...'
                        : 'Pay & Download Now'}
                    </button>

                    {paymentStatus === 'PENDING' && (
                      <div className="text-center space-y-1 pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setPaymentStatus('IDLE');
                            setCheckoutMessage('');
                          }}
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline mr-3"
                        >
                          Resend STK Prompt
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutTab('DIRECT');
                            setPaymentStatus('IDLE');
                            setCheckoutMessage('');
                          }}
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                        >
                          Already received M-Pesa SMS? Paste code here
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleDirectMpesaSubmit} className="space-y-3.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-700">
                      <p className="font-bold text-slate-900">
                        Direct M-Pesa Payment ({merchantPhone}):
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        <li>
                          Send <strong>KES {modalItem.price}</strong> via{' '}
                          <strong>M-Pesa</strong> to{' '}
                          <strong className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {merchantLocalPhone}
                          </strong>{' '}
                          <button
                            type="button"
                            onClick={copyMerchantNumber}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline"
                          >
                            {copiedPhone ? (
                              <>
                                <Check className="w-3 h-3" /> Copied
                              </>
                            ) : (
                              <>
                                <Copy className="w-3 h-3" /> Copy
                              </>
                            )}
                          </button>
                        </li>
                        <li>
                          Or if you already paid via STK Prompt, paste your{' '}
                          <strong>M-Pesa Receipt Code</strong> (or SMS) below:
                        </li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        M-Pesa Confirmation Code or SMS
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. UKFNHIONPV (or paste full M-Pesa SMS)"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value)}
                        required
                        disabled={paymentStatus === 'PENDING'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Your Phone Number (Optional)
                      </label>
                      <input
                        type="tel"
                        placeholder="07XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        disabled={paymentStatus === 'PENDING'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    {paymentStatus !== 'PENDING' && (
                      <label className="flex items-center gap-2 text-xs text-slate-600 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={notifyViaWhatsApp}
                          onChange={(e) => setNotifyViaWhatsApp(e.target.checked)}
                          className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                        />
                        <span>
                          Notify WhatsApp inbox (<strong>{whatsappLocalPhone}</strong>)
                          for instant unlock
                        </span>
                      </label>
                    )}

                    {checkoutMessage && (
                      <div
                        className={`text-xs text-center p-3 rounded-lg flex items-center justify-center gap-2 ${
                          paymentStatus === 'FAILED'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200'
                            : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {paymentStatus === 'PENDING' && (
                          <Loader2 className="w-4 h-4 animate-spin text-emerald-600 shrink-0" />
                        )}
                        {paymentStatus === 'FAILED' && (
                          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                        )}
                        <span>{checkoutMessage}</span>
                      </div>
                    )}

                    {paymentStatus === 'PENDING' ? (
                      <div className="space-y-2.5">
                        <a
                          href={whatsappConfirmHref}
                          target="_blank"
                          rel="noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-xs transition shadow-sm"
                        >
                          <MessageCircle className="w-4 h-4" />
                          Send Payment Alert to WhatsApp ({whatsappLocalPhone})
                        </a>
                        <p className="text-[11px] text-center text-slate-500">
                          Keep this window open — your download button unlocks
                          automatically the moment approved!
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm transition"
                      >
                        {isProcessing
                          ? 'Submitting Code...'
                          : 'Verify M-Pesa Code & Download'}
                      </button>
                    )}
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
