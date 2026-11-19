import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BrandLogoLockup from '@/components/BrandLogoLockup';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Terms of Service, Pricing & Licensing',
  description:
    'Official Terms of Service, instant M-Pesa digital delivery, video class access, single-teacher & school licensing, and publisher disclosures for CBCMATERIALS.SHOP.',
  alternates: {
    canonical: 'https://www.cbcmaterials.shop/terms',
  },
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-slate-950 text-white py-6 border-b border-emerald-500/30">
        <div className="max-w-4xl mx-auto px-4 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <BrandLogoLockup size="sm" />
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-300 hover:text-white"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to Storefront
            </Link>
          </div>
          <h1 className="text-2xl font-black">
            Terms of Service, Pricing &amp; Licensing
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: November 2026 • Official Terms for CBCMATERIALS.SHOP
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              1. Digital Educational Resources &amp; Classroom License
            </h2>
            <p>
              <strong>CBCMATERIALS.SHOP</strong> provides 6,534+ KICD-aligned
              teaching and revision documents across PP1, PP2, and Grades 1–12
              in both Editable Microsoft Word (.DOCX) and Print-Ready (.PDF)
              formats, alongside Tutor Peter Whiteboard Class Videos, Interactive
              Subject Gaming, Homework Q&amp;A, and Verified Tuition Matching.
              Teachers, parents, and schools may customize school headers,
              stream names, and dates for classroom and home instruction; bulk
              commercial resale or re-uploading to competing websites is
              prohibited.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              2. Transparent Pricing &amp; Instant M-Pesa Delivery
            </h2>
            <p>
              All prices are clearly displayed prior to checkout (including
              individual Schemes, Lesson Plans, Notes, Records &amp; National
              KJSEA Papers/Marking Schemes from <strong>KES 50–100</strong>;
              50-page &amp; 100-page CBC Revision Books from{' '}
              <strong>KES 500–1,800</strong>; Tutor Peter Whiteboard Videos Pass
              at <strong>$15 USD / KES 1,950</strong>; Ask Gemini 7-Day Pass at{' '}
              <strong>KES 20</strong>; and Gaming 20-Minute Pass at{' '}
              <strong>KES 10</strong>). Payments made via live Safaricom M-Pesa
              STK Express (including Fuliza) or verified M-Pesa receipt code
              unlock digital access automatically on screen within seconds. If a
              browser closes mid-download, instant re-delivery is guaranteed via
              WhatsApp support at <strong>0705759072</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              3. Independent Educational Publisher Disclosure
            </h2>
            <p>
              <strong>CBCMATERIALS.SHOP</strong> is an independent Kenyan
              educational publisher authoring original schemes of work, lesson
              notes, practice trial assessments, and whiteboard video classes
              aligned with rationalized curriculum designs. External convenience
              links to official government portals (MoE, KICD, KNEC, and TSC)
              open their respective official domains; we are an independent
              private platform and not a government agency.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
