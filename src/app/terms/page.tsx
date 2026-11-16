import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service | CBC Kenya Resource Hub',
  description:
    'Terms of Service, single-teacher & school use licensing, and instant digital delivery terms for CBC Kenya Resource Hub.',
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-slate-900 text-white py-7">
        <div className="max-w-4xl mx-auto px-4 space-y-2">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Storefront
          </Link>
          <h1 className="text-2xl font-black">Terms of Service &amp; Licensing</h1>
          <p className="text-xs text-slate-400">Effective Date: January 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              1. Digital Educational Resources
            </h2>
            <p>
              CBC Kenya Resource Hub provides KICD-aligned professional teaching and
              revision documents (PP1, PP2, and Grades 1–12) in both Editable Microsoft
              Word (.DOCX) and Print-Ready (.PDF) formats. Teachers and schools may
              customize school headers, stream names, and dates for classroom and
              institutional instruction.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              2. Payments &amp; Instant Delivery
            </h2>
            <p>
              Payments are processed via <strong>M-Pesa Send Money to 0728595160</strong>{' '}
              followed by pasting your M-Pesa confirmation code (M-Pesa STK Push is
              currently under maintenance). Upon confirmation, both the Editable Word
              (.DOCX) and Print-Ready (.PDF) download links unlock immediately on screen.
              If a network interruption occurs during download, contact WhatsApp support
              at <strong>0705759072</strong> with your M-Pesa receipt for immediate
              re-issuance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              3. Sponsored Content &amp; External Links
            </h2>
            <p>
              Our portal displays clearly labeled advertisements, partner offers, and
              external shortcuts (such as official MoE, TSC, KNEC, and KICD portals). We
              are an independent educational publisher and are not an official agency of
              KICD, KNEC, or TSC.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
