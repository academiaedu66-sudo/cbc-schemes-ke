'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, Gamepad2, MessageCircle } from 'lucide-react';

export default function GlobalNotFoundPage() {
  // Automatically forward mistyped / truncated social media links straight to the live catalog
  useEffect(() => {
    const timer = window.setTimeout(() => {
      window.location.replace('/');
    }, 1200);
    return () => window.clearTimeout(timer);
  }, []);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-5 text-center">
      <div className="max-w-md w-full bg-white border border-emerald-200 rounded-3xl p-7 shadow-lg space-y-5">
        <div className="w-14 h-14 rounded-2xl bg-emerald-700 text-white flex items-center justify-center mx-auto shadow">
          <BookOpen className="w-7 h-7" />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-xl font-black text-slate-900">
            Opening CBC Kenya Resource Hub...
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
            Taking you directly to all 3,400+ 2026 CBC Schemes of Work, Lesson Plans,
            Notes, KPSEA/KJSEA Exams &amp; All-Subjects Gaming Arena.
          </p>
        </div>

        <div className="space-y-2.5">
          <Link
            href="/"
            className="w-full inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 px-5 rounded-2xl shadow transition"
          >
            <span>Open All CBC Materials Now</span>
            <ArrowRight className="w-4 h-4" />
          </Link>

          <div className="grid grid-cols-2 gap-2">
            <a
              href="https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-[#1877F2] text-white font-bold text-xs py-2.5 px-3 rounded-xl"
            >
              <Gamepad2 className="w-3.5 h-3.5" />
              Facebook Reels
            </a>
            <a
              href="https://wa.me/254728595160"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 bg-emerald-700 text-white font-bold text-xs py-2.5 px-3 rounded-xl"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              WhatsApp Help
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
