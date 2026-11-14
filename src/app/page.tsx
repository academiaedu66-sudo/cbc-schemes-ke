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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CategoryGrid from '@/components/CategoryGrid';
import ResourceCard, { type ResourceItem } from '@/components/ResourceCard';
import PreviewModal from '@/components/PreviewModal';
import { normalizeCategory } from '@/lib/material-utils';

const PAGE_SIZE = 24;
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
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Payment & WhatsApp Configuration
  const [liveStkReady, setLiveStkReady] = useState(false);
  const [merchantPhone, setMerchantPhone] = useState(DEFAULT_MERCHANT_INTL);
  const [merchantLocalPhone, setMerchantLocalPhone] = useState(DEFAULT_MERCHANT_LOCAL);
  const [whatsappPhone, setWhatsappPhone] = useState(DEFAULT_WHATSAPP_INTL);
  const [whatsappLocalPhone, setWhatsappLocalPhone] = useState(DEFAULT_WHATSAPP_LOCAL);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);

  // Checkout Modal State
  const [modalItem, setModalItem] = useState<ResourceItem | null>(null);
  const [checkoutTab, setCheckoutTab] = useState<'DIRECT' | 'STK'>('DIRECT');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [mpesaCode, setMpesaCode] = useState('');
  const [submittedReceipt, setSubmittedReceipt] = useState('');
  const [notifyViaWhatsApp, setNotifyViaWhatsApp] = useState(true);
  const [copiedPhone, setCopiedPhone] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
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
        if (typeof cfg?.liveStkReady === 'boolean') {
          setLiveStkReady(cfg.liveStkReady);
          setCheckoutTab(cfg.liveStkReady ? 'STK' : 'DIRECT');
        }
      })
      .catch(() => {
        // Keep safe defaults: M-Pesa -> 254728595160, WhatsApp -> 254705759072
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
  }, [selectedGrade, selectedSubject, selectedCategory, selectedTerm, searchQuery]);

  // Dynamic subject options scoped to selected Grade
  const availableSubjects = useMemo(() => {
    const set = new Set<string>();
    for (const r of resources) {
      if (selectedGrade === 'All' || r.grade.toString() === selectedGrade) {
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
            setCheckoutMessage(
              'Payment verified! Click below to download your curriculum document.'
            );
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setPaymentStatus('FAILED');
            setCheckoutMessage(
              'Payment could not be verified or was cancelled. Please check and try again.'
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

  const filteredItems = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return resources.filter((item) => {
      const matchGrade =
        selectedGrade === 'All' || item.grade.toString() === selectedGrade;
      const matchSubj =
        selectedSubject === 'All' || item.subject === selectedSubject;
      const matchCat =
        selectedCategory === 'All' ||
        normalizeCategory(item.category) === selectedCategory;
      const matchTerm =
        selectedTerm === 'All' || String(item.term ?? 1) === selectedTerm;
      const matchSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.subject || '').toLowerCase().includes(q) ||
        (item.category || '').toLowerCase().includes(q);
      return matchGrade && matchSubj && matchCat && matchTerm && matchSearch;
    });
  }, [
    resources,
    selectedGrade,
    selectedSubject,
    selectedCategory,
    selectedTerm,
    searchQuery,
  ]);

  const displayedItems = filteredItems.slice(0, visibleCount);

  const buildOrderWhatsAppHref = (receipt: string) => {
    if (!modalItem) return `https://wa.me/${whatsappPhone}`;
    const origin =
      typeof window !== 'undefined' ? window.location.origin : '';
    const msg =
      `🔔 *NEW CBC ORDER PAID*\n` +
      `• *M-Pesa Code:* ${receipt}\n` +
      `• *Amount Sent (to ${merchantLocalPhone}):* KES ${modalItem.price}\n` +
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
      'Sending STK Push prompt to your phone... Please enter your M-Pesa PIN.'
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
        'PIN prompt sent! Waiting for M-Pesa payment confirmation...'
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
        'Please paste a valid 10-character M-Pesa code (e.g. SJK84M2P9Q) or paste the full M-Pesa SMS.'
      );
      return;
    }

    // Open WhatsApp notification to 0705759072 synchronously inside user click gesture so browsers don't block it
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
          `Code received! Waiting for confirmation of KES ${modalItem?.price} sent to ${merchantLocalPhone}...`
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
    setModalItem(res);
    setPhoneNumber('');
    setMpesaCode('');
    setSubmittedReceipt('');
    setCheckoutMessage('');
    setCheckoutRequestId(null);
    setDownloadUrl(null);
    setPaymentStatus('IDLE');
    setCheckoutTab(liveStkReady ? 'STK' : 'DIRECT');
  };

  const resetModal = () => {
    setModalItem(null);
    setPhoneNumber('');
    setMpesaCode('');
    setSubmittedReceipt('');
    setCheckoutMessage('');
    setCheckoutRequestId(null);
    setDownloadUrl(null);
    setPaymentStatus('IDLE');
  };

  const whatsappConfirmHref = buildOrderWhatsAppHref(
    submittedReceipt || extractCodeClient(mpesaCode) || mpesaCode.trim().toUpperCase()
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      {/* Header Bar */}
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-300" />
              CBC Kenya Resource Hub
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Rationalized Schemes of Work, Lesson Plans, Notes, Exams, Records
              of Work &amp; Designs (Grade 1–12 • Terms 1, 2 &amp; 3)
            </p>
          </div>
          <div className="flex items-center gap-2.5">
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
        {/* 1. Category Cards Showcase with Live Counts */}
        <CategoryGrid
          resources={resources}
          selectedCategory={selectedCategory}
          onSelectCategory={(cat) => setSelectedCategory(cat)}
        />

        {/* 2. Quick Grade Selector Pills (Schemes.co.ke style) */}
        <div
          id="materials-Catalog"
          className="flex items-center gap-2 overflow-x-auto pb-2 mt-6 no-scrollbar"
        >
          <button
            type="button"
            onClick={() => setSelectedGrade('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
              selectedGrade === 'All'
                ? 'bg-emerald-700 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
            }`}
          >
            All Grades (1–12)
          </button>
          {Array.from({ length: 12 }, (_, i) => String(i + 1)).map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => setSelectedGrade(g)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition ${
                selectedGrade === g
                  ? 'bg-emerald-700 text-white shadow-sm'
                  : 'bg-white border border-slate-200 text-slate-700 hover:border-emerald-400'
              }`}
            >
              Grade {g}
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
                  onChange={(e) => setSearchQuery(e.target.value)}
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
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Grades (1 to 12)</option>
                <optgroup label="Lower Primary">
                  <option value="1">Grade 1</option>
                  <option value="2">Grade 2</option>
                  <option value="3">Grade 3</option>
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
                onChange={(e) => setSelectedSubject(e.target.value)}
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
                Material Type
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Categories</option>
                <option value="Schemes of Work">Schemes of Work</option>
                <option value="Lesson Plans">Lesson Plans</option>
                <option value="Teachers' Notes">Lesson Notes &amp; Booklets</option>
                <option value="Revision Papers & Exams">
                  Exams &amp; Marking Schemes
                </option>
                <option value="Records of Work">
                  Records of Work &amp; Rubrics
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
                onChange={(e) => setSelectedTerm(e.target.value)}
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
        </section>

        {/* 4. Section Divider & Header */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-6 pb-2 border-b border-slate-200">
          <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
            Available Curriculum Materials
          </h2>
          <div className="flex items-center gap-3">
            {(selectedGrade !== 'All' ||
              selectedSubject !== 'All' ||
              selectedCategory !== 'All' ||
              selectedTerm !== 'All' ||
              searchQuery !== '') && (
              <button
                type="button"
                onClick={() => {
                  setSelectedGrade('All');
                  setSelectedSubject('All');
                  setSelectedCategory('All');
                  setSelectedTerm('All');
                  setSearchQuery('');
                }}
                className="text-xs font-bold text-emerald-700 hover:underline"
              >
                Reset All Filters
              </button>
            )}
            <span className="text-xs font-bold text-slate-500">
              Showing {displayedItems.length.toLocaleString()} of{' '}
              {filteredItems.length.toLocaleString()} resources
            </span>
          </div>
        </div>

        {/* 5. Paginated Dynamic Resource Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">
              Loading Grade 1–12 CBC materials from Supabase...
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
                setSearchQuery('');
              }}
              className="text-xs font-bold text-emerald-700 hover:underline"
            >
              Clear all filters
            </button>
          </div>
        ) : (
          <>
            <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {displayedItems.map((item) => (
                <ResourceCard
                  key={item.id}
                  resource={item}
                  onPreview={(res) => setPreviewItem(res)}
                  onBuy={(res) => openCheckoutFor(res)}
                />
              ))}
            </section>

            {visibleCount < filteredItems.length && (
              <div className="mt-8 flex justify-center">
                <button
                  type="button"
                  onClick={() => setVisibleCount((prev) => prev + PAGE_SIZE * 2)}
                  className="inline-flex items-center gap-2 bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 font-bold text-sm px-6 py-3 rounded-xl shadow-sm transition"
                >
                  <ChevronDown className="w-4 h-4" />
                  Load More Materials (
                  {(filteredItems.length - visibleCount).toLocaleString()}{' '}
                  remaining)
                </button>
              </div>
            )}
          </>
        )}
      </main>

      {/* Floating WhatsApp Support Button -> 0705759072 (254705759072) */}
      <a
        href={`https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
          'Hello, I need help with CBC curriculum materials'
        )}`}
        target="_blank"
        rel="noreferrer"
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

      {/* M-Pesa Checkout Modal (M-Pesa -> 254728595160 | WhatsApp Alerts -> 254705759072) */}
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
              M-Pesa Instant Checkout
            </h2>
            <p className="text-xs text-slate-500 mb-4 pr-6">{modalItem.title}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center mb-4">
              <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wide">
                Amount Payable via M-Pesa
              </span>
              <p className="text-2xl font-black text-emerald-900">
                KES {modalItem.price}
              </p>
            </div>

            {paymentStatus === 'COMPLETED' && downloadUrl ? (
              <div className="space-y-4 text-center">
                <div className="flex items-center justify-center gap-2 text-emerald-600 font-bold text-sm">
                  <CheckCircle className="w-5 h-5" />
                  <span>Payment Verified!</span>
                </div>
                <p className="text-xs text-slate-600">{checkoutMessage}</p>
                <a
                  href={downloadUrl}
                  target="_blank"
                  rel="noreferrer"
                  download
                  className="w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  <Download className="w-4 h-4" />
                  Download {modalItem.format} Document
                </a>
              </div>
            ) : (
              <>
                {/* Payment Method Switcher */}
                <div className="grid grid-cols-2 gap-1.5 bg-slate-100 p-1 rounded-xl mb-4">
                  <button
                    type="button"
                    disabled={paymentStatus === 'PENDING'}
                    onClick={() => {
                      setCheckoutTab('DIRECT');
                      setCheckoutMessage('');
                      setPaymentStatus('IDLE');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition ${
                      checkoutTab === 'DIRECT'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Send to {merchantLocalPhone}
                  </button>
                  <button
                    type="button"
                    disabled={paymentStatus === 'PENDING'}
                    onClick={() => {
                      setCheckoutTab('STK');
                      setCheckoutMessage('');
                      setPaymentStatus('IDLE');
                    }}
                    className={`py-2 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                      checkoutTab === 'STK'
                        ? 'bg-white text-emerald-800 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    STK Prompt
                  </button>
                </div>

                {checkoutTab === 'DIRECT' ? (
                  <form onSubmit={handleDirectMpesaSubmit} className="space-y-3.5">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 text-xs space-y-2 text-slate-700">
                      <p className="font-bold text-slate-900">
                        Pay Directly to M-Pesa ({merchantPhone}):
                      </p>
                      <ol className="list-decimal list-inside space-y-1.5">
                        <li>
                          Go to <strong>M-Pesa</strong> &rarr;{' '}
                          <strong>Send Money</strong> (or{' '}
                          <strong>Pochi la Biashara</strong>)
                        </li>
                        <li className="flex flex-wrap items-center gap-1.5">
                          <span>Enter M-Pesa Phone:</span>
                          <strong className="font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded">
                            {merchantLocalPhone}
                          </strong>
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
                          Enter Amount: <strong>KES {modalItem.price}</strong> &amp;
                          enter your M-Pesa PIN
                        </li>
                        <li>
                          Paste the <strong>M-Pesa Code</strong> (or full M-Pesa
                          SMS) below:
                        </li>
                      </ol>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        M-Pesa Confirmation Code or SMS
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SJK84M2P9Q (or paste full M-Pesa SMS)"
                        value={mpesaCode}
                        onChange={(e) => setMpesaCode(e.target.value)}
                        required
                        disabled={paymentStatus === 'PENDING'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Your Phone Number (Optional, for WhatsApp delivery)
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
                          Send instant payment alert to WhatsApp inbox (
                          <strong>{whatsappLocalPhone}</strong>)
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
                ) : (
                  <form onSubmit={handleMpesaStkPay} className="space-y-4">
                    {!liveStkReady && (
                      <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-xl p-3 text-xs space-y-1.5">
                        <p className="font-bold">
                          STK Prompt is currently in Sandbox Test Mode
                        </p>
                        <p>
                          Sandbox prompts do not transfer real money to{' '}
                          <strong>{merchantLocalPhone}</strong>. To pay directly to{' '}
                          <strong>{merchantLocalPhone}</strong>,{' '}
                          <button
                            type="button"
                            onClick={() => setCheckoutTab('DIRECT')}
                            className="font-bold underline text-emerald-800"
                          >
                            switch to Send to {merchantLocalPhone}
                          </button>
                          .
                        </p>
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                        Your M-Pesa Phone Number
                      </label>
                      <input
                        type="tel"
                        placeholder="07XXXXXXXX or 2547XXXXXXXX"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required
                        disabled={paymentStatus === 'PENDING'}
                        className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
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
                      className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm transition"
                    >
                      {paymentStatus === 'PENDING'
                        ? 'Waiting for M-Pesa PIN...'
                        : 'Send STK Prompt & Download'}
                    </button>
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
