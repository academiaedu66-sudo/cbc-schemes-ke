'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Globe2, HeartHandshake, MessageCircle } from 'lucide-react';
import BrandLogoLockup from '@/components/BrandLogoLockup';
import SiteFooter from '@/components/SiteFooter';
import InternationalDonationModal, {
  InternationalDonationTopBanner,
} from '@/components/InternationalDonationModal';
import {
  DONATION_UK_WHATSAPP_DIGITS,
  DONATION_UK_WHATSAPP_DISPLAY,
  DONATION_USA_CANADA_WHATSAPP_DIGITS,
  DONATION_USA_CANADA_WHATSAPP_DISPLAY,
} from '@/lib/donations';

export default function DonatePageClient() {
  const [modalOpen, setModalOpen] = useState(true);

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      <div>
        <header className="bg-gradient-to-r from-slate-950 via-emerald-950 to-indigo-950 text-white border-b-2 border-amber-400/50">
          <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
            <BrandLogoLockup
              size="md"
              showTagline
              subtitle="International & Global Community Learner Education Support Fund"
            />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-black uppercase tracking-wider text-white transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to CBCMATERIALS.SHOP</span>
            </Link>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-4 py-8 space-y-6">
          <InternationalDonationTopBanner onOpenModal={() => setModalOpen(true)} />

          <section className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm space-y-4">
            <div className="inline-flex items-center gap-2 bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-xs font-black uppercase">
              <Globe2 className="w-4 h-4" />
              <span>Why Your Support Matters</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black text-slate-950 uppercase">
              Keep Vulnerable, Weak &amp; Poor Learners in School Across Kenya
            </h1>
            <p className="text-sm text-slate-700 leading-relaxed">
              Many bright and determined learners in rural and low-income communities
              struggle to afford basic revision books, curriculum workbooks, national
              assessment papers, and remedial tuition. Contributions from{' '}
              <strong>$1 USD upward</strong> directly sponsor learning materials, personal
              coaching, and school continuation for learners in need.
            </p>
            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setModalOpen(true)}
                className="px-6 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm uppercase tracking-wider inline-flex items-center gap-2 shadow-lg cursor-pointer"
              >
                <HeartHandshake className="w-5 h-5" />
                <span>Open Donation &amp; International Remittance Window ($1+)</span>
              </button>

              <a
                href={`https://wa.me/${DONATION_UK_WHATSAPP_DIGITS}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-emerald-300 font-black text-xs uppercase inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>U.K. WhatsApp: {DONATION_UK_WHATSAPP_DISPLAY}</span>
              </a>

              <a
                href={`https://wa.me/${DONATION_USA_CANADA_WHATSAPP_DIGITS}`}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-3 rounded-2xl bg-indigo-950 hover:bg-indigo-900 text-amber-300 font-black text-xs uppercase inline-flex items-center gap-1.5"
              >
                <MessageCircle className="w-4 h-4" />
                <span>U.S.A. / CANADA: {DONATION_USA_CANADA_WHATSAPP_DISPLAY}</span>
              </a>
            </div>
          </section>
        </main>
      </div>

      <InternationalDonationModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />

      <SiteFooter />
    </div>
  );
}
