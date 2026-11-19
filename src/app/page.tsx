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
  HeartHandshake,
  Gamepad2,
  Landmark,
  Briefcase,
  Bot,
  Award,
  Lock,
  Video,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CategoryGrid, { MATERIAL_AREAS } from '@/components/CategoryGrid';
import ResourceCard, { type ResourceItem } from '@/components/ResourceCard';
import PreviewModal from '@/components/PreviewModal';
import WelcomeAnimation from '@/components/WelcomeAnimation';
import EducationUpdatesHub from '@/components/EducationUpdatesHub';
import HolidayTuitionCenter from '@/components/HolidayTuitionCenter';
import GuidanceCounsellingHub from '@/components/GuidanceCounsellingHub';
import SubjectGamingHub, {
  type ExternalGameLaunch,
} from '@/components/SubjectGamingHub';
import TscServicesHub from '@/components/TscServicesHub';
import HolidaySideHustlesHub from '@/components/HolidaySideHustlesHub';
import GeminiHomeworkHub from '@/components/GeminiHomeworkHub';
import CbcBooksHub, {
  type ExternalBookModalLaunch,
} from '@/components/CbcBooksHub';
import NationalKjseaHub from '@/components/NationalKjseaHub';
import TutorPeterVideosHubModal from '@/components/TutorPeterVideosHubModal';
import BrandLogoLockup from '@/components/BrandLogoLockup';
import PurchaseThankYouBanner from '@/components/PurchaseThankYouBanner';
import SeoKnowledgeSection from '@/components/SeoKnowledgeSection';
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
  {
    key: 'JAMO_KJSEA',
    label: '★ NATIONAL KJSEA EXAMINATION (ALL GRADES • KSh 50)',
  },
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
  const [counsellingOpenTick, setCounsellingOpenTick] = useState(0);
  const [tscOpenTick, setTscOpenTick] = useState(0);
  const [sideHustlesOpenTick, setSideHustlesOpenTick] = useState(0);
  const [geminiOpenTick, setGeminiOpenTick] = useState(0);
  const [kjseaModalTick, setKjseaModalTick] = useState(0);
  const [gameLaunch, setGameLaunch] = useState<ExternalGameLaunch | null>(null);
  const [bookLaunch, setBookLaunch] = useState<ExternalBookModalLaunch | null>(null);

  // Payment & WhatsApp Configuration
  const [merchantPhone, setMerchantPhone] = useState(DEFAULT_MERCHANT_INTL);
  const [merchantLocalPhone, setMerchantLocalPhone] = useState(DEFAULT_MERCHANT_LOCAL);
  const [whatsappPhone, setWhatsappPhone] = useState(DEFAULT_WHATSAPP_INTL);
  const [whatsappLocalPhone, setWhatsappLocalPhone] = useState(DEFAULT_WHATSAPP_LOCAL);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);
  const [isVideosModalOpen, setIsVideosModalOpen] = useState(false);
  const [videoModalItem, setVideoModalItem] = useState<ResourceItem | null>(null);

  // Checkout Modal State (PayHero Live STK Express primary + Direct M-Pesa Code backup)
  const [modalItem, setModalItem] = useState<ResourceItem | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'STK' | 'DIRECT'>('STK');
  const [buyerMpesaName, setBuyerMpesaName] = useState('');
  const [verifiedBuyerName, setVerifiedBuyerName] = useState('');
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

  // Fetch all pages of real materials from Supabase (>1,000 rows safe, parallelized)
  useEffect(() => {
    async function fetchAllResources() {
      setIsLoading(true);
      const byId = new Map<string, ResourceItem>();
      const offsets = [0, 1000, 2000, 3000, 4000, 5000, 6000, 7000];

      const pages = await Promise.all(
        offsets.map((from) =>
          supabase
            .from('resources')
            .select('id, title, grade, level, category, subject, term, format, price, file_path')
            .order('grade', { ascending: true })
            .order('term', { ascending: true })
            .order('id', { ascending: true })
            .range(from, from + 999)
        )
      );

      for (const { data, error } of pages) {
        if (error) {
          console.error('Failed to load items from Supabase:', error.message);
          continue;
        }
        if (!data) continue;
        for (const item of data as ResourceItem[]) {
          byId.set(item.id, {
            ...item,
            category: normalizeCategory(item.category),
          });
        }
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

  // Notify Live Search Sensor whenever a visitor types a search keyword (>= 3 chars)
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 3) return;
    const t = setTimeout(() => {
      fetch('/api/seo/sensor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          landingPath: '/',
          referrer: typeof window !== 'undefined' ? window.location.href : '',
          searchQuery: q,
        }),
      }).catch(() => {});
    }, 1400);
    return () => clearTimeout(t);
  }, [searchQuery]);

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

  // Poll every 1.2s once an STK push or Pochi code is submitted -> auto-open material immediately!
  useEffect(() => {
    if (!checkoutRequestId || paymentStatus !== 'PENDING') return;

    let cancelled = false;
    let openedOnce = false;

    const checkNow = async () => {
      try {
        const res = await fetch('/api/resources/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId }),
        });

        const data = await res.json();
        if (cancelled) return;

        if (data.status === 'COMPLETED' && data.downloadUrl) {
          const primaryFileUrl = data.docxDownloadUrl || data.downloadUrl;
          if (data.buyerName) setVerifiedBuyerName(String(data.buyerName));
          setPaymentStatus('COMPLETED');
          setDownloadUrl(data.downloadUrl);
          setDocxDownloadUrl(primaryFileUrl);
          setPdfDownloadUrl(data.pdfDownloadUrl || data.downloadUrl);
          setCheckoutMessage(
            'Payment auto-confirmed! Opening your material automatically now...'
          );

          if (!openedOnce && primaryFileUrl && primaryFileUrl !== '#') {
            openedOnce = true;
            try {
              const link = document.createElement('a');
              link.href = primaryFileUrl;
              link.rel = 'noopener noreferrer';
              document.body.appendChild(link);
              link.click();
              link.remove();
            } catch {
              window.location.assign(primaryFileUrl);
            }
          }
          clearInterval(interval);
        } else if (data.status === 'FAILED') {
          setPaymentStatus('FAILED');
          setCheckoutMessage(
            'Payment was cancelled or timed out. Click below to resend STK prompt or enter Pochi code.'
          );
          clearInterval(interval);
        }
      } catch (err) {
        console.error('Polling error:', err);
      }
    };

    const initialTimer = setTimeout(checkNow, 700);
    const interval = setInterval(checkNow, 1200);

    return () => {
      cancelled = true;
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
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
        // Put KENYA NATIONAL KJSEA TEST papers first within Revision Papers & Exams!
        const aJamo = a.title.toUpperCase().includes('KENYA NATIONAL KJSEA TEST') ? 0 : 1;
        const bJamo = b.title.toUpperCase().includes('KENYA NATIONAL KJSEA TEST') ? 0 : 1;
        if (aJamo !== bJamo) return aJamo - bJamo;
        // Keep Holiday Assignments (term 1-3) grouped together and Curriculum Designs (term 0) grouped together
        const aIsDesign = a.term === 0 ? 1 : 0;
        const bIsDesign = b.term === 0 ? 1 : 0;
        if (aIsDesign !== bIsDesign) return aIsDesign - bIsDesign;
        const rankA = getGradeSortRank(getResourceGradeKey(a));
        const rankB = getGradeSortRank(getResourceGradeKey(b));
        if (rankA !== rankB) return rankA - rankB;
        const subjCmp = (a.subject || '').localeCompare(b.subject || '');
        if (subjCmp !== 0) return subjCmp;
        // Keep Question Paper immediately before its Marking Scheme
        const aIsMs = /MARKING SCHEME|MWONGOZO WA KUSAHIHISHA/i.test(a.title) ? 1 : 0;
        const bIsMs = /MARKING SCHEME|MWONGOZO WA KUSAHIHISHA/i.test(b.title) ? 1 : 0;
        if (aIsMs !== bIsMs) return aIsMs - bIsMs;
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
          buyerName: buyerMpesaName.trim() || undefined,
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
          buyerName: buyerMpesaName.trim() || undefined,
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

  const jumpToCurriculumMaterials = (targetCategory = 'All') => {
    trackInteraction('all_curriculum_materials_btn_click');
    setSelectedCategory(targetCategory);
    if (targetCategory === 'All') {
      setSelectedGrade('All');
      setSelectedSubject('All');
      setSelectedTerm('All');
      setExamSubFilter('ALL');
      setSearchQuery('');
    } else if (targetCategory !== 'Revision Papers & Exams') {
      setExamSubFilter('ALL');
    }
    document
      .getElementById('curriculum-materials-section')
      ?.scrollIntoView({ behavior: 'smooth' });
  };

  const openCheckoutFor = (res: ResourceItem) => {
    trackInteraction('checkout_modal_open');
    fetch('/api/purchase-attempt', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        channel: 'Curriculum Material',
        itemTitle: res.title,
        amountKes: res.price,
        stage: 'OPENED_CHECKOUT',
      }),
    }).catch(() => {});
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

  // Support Google Sitelinks Searchbox (?q=...), WhatsApp Status Button Deep-Links (?hub=, ?area=), & SEO Hub deep-links
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const params = new URLSearchParams(window.location.search);
    const qParam = params.get('q');
    const gradeParam = params.get('grade');
    const subjectParam = params.get('subject');
    const hubParam = (params.get('hub') || '').toLowerCase();
    const areaParam = (params.get('area') || '').toLowerCase();

    if (qParam) setSearchQuery(qParam);
    if (gradeParam) setSelectedGrade(gradeParam);
    if (subjectParam) setSelectedSubject(subjectParam);

    if (hubParam === 'gemini') {
      setGeminiOpenTick((c) => c + 1);
    } else if (hubParam === 'hustles') {
      setSideHustlesOpenTick((c) => c + 1);
    } else if (hubParam === 'tsc') {
      setTscOpenTick((c) => c + 1);
    } else if (hubParam === 'counselling') {
      setCounsellingOpenTick((c) => c + 1);
    } else if (hubParam === 'gaming') {
      setGameLaunch({
        subject: subjectParam || 'Mathematics',
        gradeKey: gradeParam || '7',
        tick: Date.now(),
      });
    }

    const areaMap: Record<string, string> = {
      all: 'All',
      kjsea: 'NATIONAL KJSEA EXAMINATION (ALL GRADES)',
      schemes: 'Schemes of Work',
      'lesson-plans': 'Lesson Plans',
      notes: "Teachers' Notes",
      records: 'Records of Work',
      exams: 'Revision Papers & Exams',
      holidays: 'Holiday Assignments & Designs',
    };
    if (areaParam && areaMap[areaParam]) {
      setSelectedCategory(areaMap[areaParam]);
      if (areaParam === 'kjsea') {
        setKjseaModalTick((c) => c + 1);
      }
      setTimeout(() => {
        document
          .getElementById('curriculum-materials-section')
          ?.scrollIntoView({ behavior: 'smooth' });
      }, 450);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined' || resources.length === 0) return;
    const params = new URLSearchParams(window.location.search);
    const buyId = params.get('buy');
    const previewId = params.get('preview');
    if (buyId) {
      const found = resources.find((r) => r.id === buyId);
      if (found) {
        openCheckoutFor(found);
        window.history.replaceState({}, '', '/');
      }
    } else if (previewId) {
      const found = resources.find((r) => r.id === previewId);
      if (found) {
        setPreviewItem(found);
        window.history.replaceState({}, '', '/');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resources]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Entry Welcome Splash & Persistent Animated Welcome Ribbon */}
      <WelcomeAnimation />

      {/* Header Bar — Logo Anchored Far Left, Writings & Buttons Strictly Beside/Right */}
      <header className="bg-gradient-to-r from-slate-950 via-emerald-900 to-indigo-950 text-white shadow-lg border-b-2 border-amber-400/50">
        <div className="w-full px-3 sm:px-6 lg:px-8 py-5 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div className="shrink-0">
            <BrandLogoLockup
              size="lg"
              showTagline
              asHeading
              subtitle="Rationalized Schemes of Work, Lesson Plans, Notes, Opener/Mid/End-Term Exams, KPSEA/KJSEA Trials & Designs (PP1–Grade 12 • Editable DOCX + PDF)"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                setBookLaunch({
                  bookType: 'GRADE_UP',
                  gradeKey: selectedGrade !== 'All' ? selectedGrade : '7',
                  subject: selectedSubject !== 'All' ? selectedSubject : undefined,
                  tick: Date.now(),
                })
              }
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 border-2 border-white/70 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span>1. CBC GRADE UP (KSh 500)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setBookLaunch({
                  bookType: 'MADE_FAMILIAR',
                  gradeKey: selectedGrade !== 'All' ? selectedGrade : '7',
                  subject: selectedSubject !== 'All' ? selectedSubject : undefined,
                  tick: Date.now(),
                })
              }
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 border-2 border-white/70 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-indigo-950" />
              <span>2. SUPER-LIGHT CBC COMPILATION (KSh 750)</span>
            </button>
            <button
              type="button"
              onClick={() =>
                setBookLaunch({
                  bookType: 'COMPLETE_BUNDLE',
                  gradeKey: selectedGrade !== 'All' ? selectedGrade : '7',
                  subject: selectedSubject !== 'All' ? selectedSubject : undefined,
                  tick: Date.now(),
                })
              }
              className="bg-gradient-to-r from-amber-300 via-yellow-200 to-emerald-300 hover:from-amber-200 hover:to-emerald-200 text-slate-950 border-2 border-amber-500 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-purple-900" />
              <span>3. SMART CBC ALL SUBJECTS (KSh 1,500)</span>
            </button>
            <button
              type="button"
              onClick={() => setKjseaModalTick((c) => c + 1)}
              className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-500 hover:from-rose-500 hover:to-amber-400 text-white border-2 border-amber-300 px-3.5 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <Award className="w-4 h-4 text-amber-200" />
              <span>NATIONAL KJSEA EXAMINATION (ALL GRADES)</span>
            </button>
            <button
              type="button"
              onClick={() => jumpToCurriculumMaterials('All')}
              className="bg-white hover:bg-amber-50 text-emerald-950 border-2 border-amber-300 px-4 py-2 rounded-xl text-xs font-black uppercase tracking-wide flex items-center gap-1.5 transition shadow-sm cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-emerald-700" />
              <strong>ALL CURRICULUM MATERIALS</strong>
            </button>
            <button
              type="button"
              onClick={() => setGeminiOpenTick((c) => c + 1)}
              className="bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white border border-amber-300/60 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Bot className="w-4 h-4 text-amber-300" />
              ASK GEMINI (Q&amp;A)
            </button>
            <button
              type="button"
              onClick={() => setSideHustlesOpenTick((c) => c + 1)}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Briefcase className="w-4 h-4" />
              HOLIDAY SIDE HUSTLES
            </button>
            <button
              type="button"
              onClick={() => setTscOpenTick((c) => c + 1)}
              className="bg-sky-400 hover:bg-sky-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Landmark className="w-4 h-4" />
              All TSC Services
            </button>
            <button
              type="button"
              onClick={() => {
                trackInteraction('tutor_peter_videos_header_click');
                setVideoModalItem(null);
                setIsVideosModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-500 text-white px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Lock className="w-3.5 h-3.5 text-amber-300" />
              <Video className="w-4 h-4" />
              VIDEOS ($15)
            </button>
            <button
              type="button"
              onClick={() =>
                setGameLaunch({
                  subject: selectedSubject !== 'All' ? selectedSubject : 'Mathematics',
                  gradeKey: selectedGrade !== 'All' ? selectedGrade : '7',
                  tick: Date.now(),
                })
              }
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <Gamepad2 className="w-4 h-4" />
              GAMING (ALL SUBJECTS)
            </button>
            <button
              type="button"
              onClick={() => setCounsellingOpenTick((c) => c + 1)}
              className="bg-gradient-to-r from-pink-400 to-amber-300 hover:from-pink-300 hover:to-amber-200 text-slate-950 px-3.5 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-xs cursor-pointer"
            >
              <HeartHandshake className="w-4 h-4 text-purple-900" />
              Guidance &amp; Counselling
            </button>
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
              href="https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('facebook_reels_header_click')}
              className="bg-[#1877F2] hover:bg-[#166FE5] text-white px-3.5 py-2 rounded-xl text-xs font-black transition flex items-center gap-1.5 shadow-xs"
            >
              <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] font-black text-[11px] inline-flex items-center justify-center leading-none">
                f
              </span>
              Facebook &amp; Reels
            </a>
            <a
              href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
                'Hello, I need CBC curriculum materials'
              )}`}
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('whatsapp_header_click')}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition flex items-center gap-1.5"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp {whatsappLocalPhone}
            </a>
          </div>
        </div>
      </header>

      {/* Ask Gemini Detailed Homework & Q&A Hub (KSh 20 Bob Weekly Subscription) */}
      <GeminiHomeworkHub externalOpenTick={geminiOpenTick} />

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* PRIMARY TOP BAR: ALL CURRICULUM MATERIALS (UPPERCASE BOLD) */}
        <section
          aria-label="Quick Jump to All Curriculum Materials"
          className="mb-6 bg-white border-2 border-emerald-600 rounded-2xl p-4 shadow-sm flex flex-col lg:flex-row lg:items-center justify-between gap-3.5"
        >
          <button
            type="button"
            onClick={() => jumpToCurriculumMaterials('All')}
            className="bg-emerald-700 hover:bg-emerald-800 text-white px-6 py-3.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-wide inline-flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer shrink-0"
          >
            <BookOpen className="w-5 h-5 text-amber-300" />
            <span>ALL CURRICULUM MATERIALS</span>
            <ChevronDown className="w-4 h-4 text-emerald-200" />
          </button>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => {
                trackInteraction('tutor_peter_videos_bar_click');
                setVideoModalItem(null);
                setIsVideosModalOpen(true);
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-5 py-3.5 rounded-xl text-sm sm:text-base font-black uppercase tracking-wide inline-flex items-center justify-center gap-2 shadow-md transition cursor-pointer shrink-0"
            >
              <Lock className="w-4 h-4 text-amber-300" />
              <Video className="w-5 h-5 text-amber-300" />
              <span>VIDEOS — TUTOR PETER ($15)</span>
            </button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {MATERIAL_AREAS.map((area) => (
              <button
                key={area.id}
                type="button"
                onClick={() => jumpToCurriculumMaterials(area.filterCategory)}
                className="px-3 py-1.5 rounded-xl text-[11px] font-black uppercase tracking-wide border transition cursor-pointer hover:shadow-xs"
                style={{
                  backgroundColor: area.bg,
                  borderColor: area.borderColor,
                  color: area.color,
                }}
              >
                {area.shortTitle}
              </button>
            ))}
          </div>
        </section>

        {/* OFFICIAL 3-BUTTON 50-PAGE & 100-PAGE CBC BOOKS SERIES (KSh 500 | KSh 750 | KSh 1,500 PROMPT BUY) */}
        <CbcBooksHub
          externalLaunch={bookLaunch}
          merchantLocalPhone={merchantLocalPhone}
          whatsappPhone={whatsappPhone}
        />

        {/* DEDICATED BUTTON & INTERACTIVE HUB: NATIONAL KJSEA EXAMINATION (ALL GRADES) */}
        <NationalKjseaHub
          externalOpenTick={kjseaModalTick}
          initialGradeKey={selectedGrade !== 'All' ? selectedGrade : '9'}
          initialSubject={selectedSubject !== 'All' ? selectedSubject : undefined}
          merchantLocalPhone={merchantLocalPhone}
          whatsappPhone={whatsappPhone}
          onOpenCatalogCategory={() => {
            trackInteraction('jamo_kjsea_banner_click');
            setSelectedCategory('NATIONAL KJSEA EXAMINATION (ALL GRADES)');
            setExamSubFilter('ALL');
            setSelectedGrade('All');
            setSelectedSubject('All');
            setSelectedTerm('All');
            document
              .getElementById('curriculum-materials-section')
              ?.scrollIntoView({ behavior: 'smooth' });
          }}
        />

        {/* TOP FEATURE 1: PERSONAL & HOLIDAY TUITION (STUDENT KSh 1,000 | TEACHER KSh 500 -> WHATSAPP 0705759072) */}
        <HolidayTuitionCenter />

        {/* TOP FEATURE 2: GEMINI AI GUIDANCE & COUNSELLING (IMMEDIATELY ASKS PARENT OR LEARNER) */}
        <GuidanceCounsellingHub externalTriggerCount={counsellingOpenTick} />

        {/* TOP FEATURE 3: ALL-SUBJECTS PLAY & EARN GAMING ARENA (KSh 10 / 1 HR • 1,000 PTS = KSh 5) */}
        <SubjectGamingHub externalLaunch={gameLaunch} />

        {/* TOP FEATURE 4: ALL TEACHERS SERVICE COMMISSION (TSC) SERVICES IN ONE MONETIZED BUTTON */}
        <TscServicesHub externalTriggerCount={tscOpenTick} />

        {/* TOP FEATURE 5: FREELANCERS HOLIDAY SIDE HUSTLES (ALL AITRAININGJOBS.IT COMPANIES + PAID SURVEY ACCOUNTS) */}
        <HolidaySideHustlesHub externalTriggerCount={sideHustlesOpenTick} />

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
        <div id="curriculum-materials-section" className="scroll-mt-6">
          <CategoryGrid
            resources={resources}
            selectedCategory={selectedCategory}
            onSelectCategory={(cat) => {
              trackInteraction('category_card_select');
              setSelectedCategory(cat);
              if (cat !== 'Revision Papers & Exams') setExamSubFilter('ALL');
            }}
          />
        </div>

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
                <option value="NATIONAL KJSEA EXAMINATION (ALL GRADES)">
                  NATIONAL KJSEA EXAMINATION (ALL GRADES)
                </option>
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
                opt.key === 'JAMO_KJSEA'
                  ? selectedCategory === 'NATIONAL KJSEA EXAMINATION (ALL GRADES)'
                  : selectedCategory === 'Revision Papers & Exams' &&
                    examSubFilter === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => {
                    trackInteraction('exam_filter_select');
                    if (opt.key === 'JAMO_KJSEA') {
                      setSelectedCategory(
                        selectedCategory === 'NATIONAL KJSEA EXAMINATION (ALL GRADES)'
                          ? 'All'
                          : 'NATIONAL KJSEA EXAMINATION (ALL GRADES)'
                      );
                      setExamSubFilter('ALL');
                      return;
                    }
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
                            onWatchVideo={(res) => {
                              setVideoModalItem(res);
                              setIsVideosModalOpen(true);
                            }}
                            onPlayGame={(res) =>
                              setGameLaunch({
                                subject: res.subject || 'Mathematics',
                                gradeKey: getResourceGradeKey(res),
                                tick: Date.now(),
                              })
                            }
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
                      onWatchVideo={(res) => {
                        setVideoModalItem(res);
                        setIsVideosModalOpen(true);
                      }}
                      onPlayGame={(res) =>
                        setGameLaunch({
                          subject: res.subject || 'Mathematics',
                          gradeKey: getResourceGradeKey(res),
                          tick: Date.now(),
                        })
                      }
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

      {/* Rich Structured Data (WebSite SearchAction, EducationalOrganization, FAQPage) & Grade Hub Directory */}
      <SeoKnowledgeSection />

      {/* SEO & AdSense Compliance Footer */}
      <SiteFooter />

      {/* Dismissible Sticky Bottom Monetization Bar */}
      <StickyEarnerBar />

      {/* Floating Facebook Reels + WhatsApp Profile Dock */}
      <div className="fixed bottom-5 right-5 z-40 flex flex-col sm:flex-row items-end sm:items-center gap-2">
        <a
          href="https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab"
          target="_blank"
          rel="noreferrer"
          onClick={() => trackInteraction('facebook_floating_click')}
          className="inline-flex items-center gap-2 bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-xs px-4 py-3 rounded-full shadow-lg transition"
        >
          <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] font-black text-[11px] inline-flex items-center justify-center leading-none">
            f
          </span>
          <span>Follow on Facebook &amp; Reels</span>
        </a>
        <a
          href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
            'Hello, I need help with CBC curriculum materials'
          )}`}
          target="_blank"
          rel="noreferrer"
          onClick={() => trackInteraction('whatsapp_help_click')}
          className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-3 rounded-full shadow-lg transition"
        >
          <MessageCircle className="w-4 h-4" />
          <span>WhatsApp: {whatsappLocalPhone}</span>
        </a>
      </div>

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
                <PurchaseThankYouBanner
                  buyerName={verifiedBuyerName || buyerMpesaName}
                  compact
                />
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
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTab('STK');
                      if (paymentStatus !== 'PENDING') setCheckoutMessage('');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 cursor-pointer ${
                      checkoutTab === 'STK'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    1. M-Pesa STK Push
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setCheckoutTab('DIRECT');
                      setPaymentStatus('IDLE');
                      setCheckoutMessage('');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      checkoutTab === 'DIRECT'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    2. Pochi la Biashara
                  </button>
                </div>

                {checkoutTab === 'STK' ? (
                  <form onSubmit={handleMpesaStkPay} className="space-y-3.5">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Your M-Pesa Name (For Official Greeting)
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. JOHN KAMAU MWANGI"
                        value={buyerMpesaName}
                        onChange={(e) => setBuyerMpesaName(e.target.value)}
                        disabled={isProcessing}
                        className="w-full px-3.5 py-2 border border-slate-300 rounded-xl text-xs font-bold uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
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
                        <strong>KES {modalItem.price}</strong> will pop up on your phone.
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700/70 text-white font-bold py-3 rounded-xl text-sm transition shadow-sm cursor-pointer"
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
                          className="text-[11px] text-slate-500 hover:text-slate-800 underline mr-3 cursor-pointer"
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
                          className="text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
                        >
                          Already received M-Pesa SMS? Paste code here
                        </button>
                      </div>
                    )}
                  </form>
                ) : (
                  <form onSubmit={handleDirectMpesaSubmit} className="space-y-3.5">
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-700">
                      <p className="font-black text-emerald-950">
                        Pay via Pochi la Biashara ({merchantLocalPhone}):
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        <li>
                          Open <strong>M-Pesa / *334#</strong> &rarr;{' '}
                          <strong>Lipa na M-Pesa</strong> &rarr;{' '}
                          <strong>Pochi la Biashara</strong>
                        </li>
                        <li>
                          Enter Phone{' '}
                          <strong className="font-mono text-emerald-900 bg-white border border-emerald-300 px-2 py-0.5 rounded">
                            {merchantLocalPhone}
                          </strong>{' '}
                          &amp; Amount <strong>KES {modalItem.price}</strong>{' '}
                          <button
                            type="button"
                            onClick={copyMerchantNumber}
                            className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:text-emerald-900 underline cursor-pointer"
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
                          Paste your <strong>M-Pesa Confirmation Code</strong> (or SMS)
                          below:
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
                          Notify WhatsApp inbox (<strong>{whatsappLocalPhone}</strong>) for
                          instant unlock
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
                          Keep this window open — your download button unlocks automatically
                          the moment approved!
                        </p>
                      </div>
                    ) : (
                      <button
                        type="submit"
                        disabled={isProcessing}
                        className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm transition cursor-pointer"
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
      <TutorPeterVideosHubModal
        isOpen={isVideosModalOpen}
        onClose={() => setIsVideosModalOpen(false)}
        resources={resources}
        initialResource={videoModalItem}
      />
    </div>
  );
}
