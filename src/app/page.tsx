'use client';

import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Loader2, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Resource {
  id: string;
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  format: 'DOCX' | 'PDF';
  price: number;
}

export default function HomePage() {
  const [resources, setResources] = useState<Resource[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedGrade, setSelectedGrade] = useState('All');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  
  // Checkout Modal State
  const [modalItem, setModalItem] = useState<Resource | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [checkoutMessage, setCheckoutMessage] = useState('');
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'>('IDLE');

  // Fetch real materials from Supabase
  useEffect(() => {
    async function fetchResources() {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('resources')
        .select('*')
        .order('grade', { ascending: true });

      if (error) {
        console.error('Failed to load items from Supabase:', error.message);
      } else if (data) {
        setResources(data as Resource[]);
      }
      setIsLoading(false);
    }

    fetchResources();
  }, []);

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
            setCheckoutMessage('Payment received! Click below to download your document.');
            clearInterval(interval);
          } else if (data.status === 'FAILED') {
            setPaymentStatus('FAILED');
            setCheckoutMessage('Payment failed or was cancelled. Please try again.');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Polling error:', err);
        }
      }, 3000);
    }

    return () => clearInterval(interval);
  }, [checkoutRequestId, paymentStatus]);

  const filteredItems = resources.filter((item) => {
    const matchGrade = selectedGrade === 'All' || item.grade.toString() === selectedGrade;
    const matchCat = selectedCategory === 'All' || item.category === selectedCategory;
    const matchSearch =
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.subject.toLowerCase().includes(searchQuery.toLowerCase());
    return matchGrade && matchCat && matchSearch;
  });

  const handleMpesaPay = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);
    setPaymentStatus('PENDING');
    setCheckoutMessage('Sending STK Push prompt to your phone... Please enter your PIN.');

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
      if (!response.ok) throw new Error(data.error || 'Failed to trigger payment');

      setCheckoutRequestId(data.checkoutRequestId);
      setCheckoutMessage('PIN prompt sent! Waiting for M-Pesa payment confirmation...');
    } catch (err: any) {
      setPaymentStatus('FAILED');
      setCheckoutMessage(`Error: ${err.message}`);
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
      <header className="bg-emerald-800 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <BookOpen className="w-7 h-7 text-emerald-300" />
              CBC Kenya Resource Hub
            </h1>
            <p className="text-emerald-100 text-sm mt-1">
              Curriculum-aligned Schemes of Work, Lesson Plans, Notes & Exams (Grade 1–12)
            </p>
          </div>
          <div className="flex items-center gap-3">
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <section className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm mb-8 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Search Title / Subject
              </label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="e.g. Mathematics, Science..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Grade
              </label>
              <select
                value={selectedGrade}
                onChange={(e) => setSelectedGrade(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Grades (1 to 12)</option>
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    Grade {i + 1}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                Category
              </label>
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                <option value="All">All Categories</option>
                <option value="Schemes of Work">Schemes of Work</option>
                <option value="Lesson Plans">Lesson Plans</option>
                <option value="Teachers' Notes">Teachers' Notes</option>
                <option value="Revision Papers & Exams">Revision Papers & Exams</option>
              </select>
            </div>
          </div>
        </section>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-500 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
            <p className="text-sm font-medium">Fetching curriculum resources from Supabase...</p>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
            <p className="text-slate-500 text-sm">No resources match your selected filters.</p>
          </div>
        ) : (
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-xs font-bold bg-emerald-100 text-emerald-800 px-2.5 py-1 rounded-full">
                      Grade {item.grade} • Term {item.term}
                    </span>
                    <span className="text-xs font-semibold uppercase px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                      {item.format}
                    </span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-base leading-snug mb-1">{item.title}</h3>
                  <p className="text-xs text-slate-500 mb-3">{item.level} • {item.subject}</p>
                </div>

                <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-slate-400 block">Copy Price</span>
                    <span className="text-lg font-black text-slate-900">KES {item.price}</span>
                  </div>
                  <button
                    onClick={() => {
                      resetModal();
                      setModalItem(item);
                    }}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-xl transition"
                  >
                    Buy via M-Pesa
                  </button>
                </div>
              </div>
            ))}
          </section>
        )}
      </main>

      {modalItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={resetModal}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-xl font-bold"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-1">M-Pesa STK Express Checkout</h2>
            <p className="text-xs text-slate-500 mb-4">{modalItem.title}</p>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-center mb-5">
              <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wide">
                Pay Safaricom
              </span>
              <p className="text-2xl font-black text-emerald-900">KES {modalItem.price}</p>
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
                    {paymentStatus === 'PENDING' && <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />}
                    {paymentStatus === 'FAILED' && <AlertCircle className="w-4 h-4 text-rose-600" />}
                    <span>{checkoutMessage}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isProcessing || paymentStatus === 'PENDING'}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-3 rounded-xl text-sm transition"
                >
                  {paymentStatus === 'PENDING' ? 'Waiting for M-Pesa PIN...' : 'Pay & Download'}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}