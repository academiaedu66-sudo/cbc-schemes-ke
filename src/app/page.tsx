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
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import CategoryGrid from '@/components/CategoryGrid';
import ResourceCard, { type ResourceItem } from '@/components/ResourceCard';
import PreviewModal from '@/components/PreviewModal';
import { normalizeCategory } from '@/lib/material-utils';

const PAGE_SIZE = 24;

export default function HomePage() {
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTerm, setSelectedTerm] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

  // Preview Modal State
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);

  // Checkout Modal State
  const [modalItem, setModalItem] = useState<ResourceItem | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<
    'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'
  >('IDLE');

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

  // Poll for payment status once an STK push is triggered
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
              'Payment received! Click below to download your document.'
            );
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setPaymentStatus('FAILED');
            setCheckoutMessage(
              'Payment failed or was cancelled. Please try again.'
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

  const handleMpesaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('PENDING');
    setCheckoutMessage(
      'Sending STK Push prompt to your phone... Please enter your PIN.'
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

  const resetModal = () => {
    setModalItem(null);
    setPhoneNumber('');
    setCheckoutMessage('');
    setCheckoutRequestId(null);
    setDownloadUrl(null);
    setPaymentStatus('IDLE');
  };

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
              Admin Upload
            </Link>
            <a
              href="https://wa.me/254700000000?text=Hello%20I%20need%20CBC%20materials"
              target="_blank"
              rel="noreferrer"
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-sm font-semibold transition"
            >
              Contact on WhatsApp
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
                  onBuy={(res) => {
                    resetModal();
                    setModalItem(res);
                  }}
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

      {/* Rich Material Preview Modal */}
      <PreviewModal
        resource={previewItem}
        onClose={() => setPreviewItem(null)}
        onBuy={(res) => {
          resetModal();
          setModalItem(res);
        }}
      />

      {/* M-Pesa STK Checkout Modal */}
      {modalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">
              M-Pesa STK Express Checkout
            </h2>
            <p className="text-xs text-slate-500 mb-4">{modalItem.title}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center mb-5">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Pay Safaricom
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
              <form onSubmit={handleMpesaPay} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                    M-Pesa Number
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
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                    )}
                    {paymentStatus === 'FAILED' && (
                      <AlertCircle className="w-4 h-4 text-rose-600" />
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
                    : 'Pay & Download'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
