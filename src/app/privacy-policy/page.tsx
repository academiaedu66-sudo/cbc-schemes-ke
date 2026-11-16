import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy & Cookie Policy | CBC Kenya Resource Hub',
  description:
    'Privacy Policy, Google AdSense DART cookie disclosure, and M-Pesa transaction data policy for CBC Kenya Resource Hub.',
};

export default function PrivacyPolicyPage() {
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
          <h1 className="text-2xl font-black">Privacy &amp; Cookie Policy</h1>
          <p className="text-xs text-slate-400">Effective Date: January 2026</p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-sm leading-relaxed text-slate-700">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              1. Information We Collect
            </h2>
            <p>
              CBC Kenya Resource Hub (&ldquo;we&rdquo;, &ldquo;our&rdquo;, or
              &ldquo;the Portal&rdquo;) collects minimal information required to deliver
              digital curriculum documents and improve site experience. When purchasing a
              material via M-Pesa, we process your mobile phone number and M-Pesa
              transaction reference solely to verify payment and unlock your Editable
              Word (.DOCX) and Print-Ready (.PDF) downloads.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              2. Google AdSense &amp; Third-Party Advertising Cookies
            </h2>
            <p>
              We use third-party advertising partners—including Google AdSense, Monetag,
              Adsterra, and direct education sponsors—to serve advertisements and
              sponsored links when you visit our website.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                Third-party vendors, including Google, use cookies (such as the
                DoubleClick DART cookie) to serve ads based on a user&apos;s prior
                visits to this website or other websites on the internet.
              </li>
              <li>
                Google&apos;s use of advertising cookies enables it and its partners to
                serve ads to our visitors based on their visit to CBC Kenya Resource Hub
                and/or other sites on the internet.
              </li>
              <li>
                Users may opt out of personalized advertising by visiting{' '}
                <a
                  href="https://www.google.com/settings/ads"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold underline"
                >
                  Google Ads Settings
                </a>{' '}
                or{' '}
                <a
                  href="https://www.aboutads.info/choices/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-emerald-700 font-semibold underline"
                >
                  www.aboutads.info
                </a>
                .
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              3. Site Analytics, Views &amp; Interaction Measurement
            </h2>
            <p>
              We record aggregated, non-personally-identifiable engagement metrics
              including page views, ad viewport impressions, search/filter interactions,
              and outbound sponsor clicks in order to measure content usefulness and
              advertising performance.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              4. Data Security &amp; Contact
            </h2>
            <p>
              We never sell personal phone numbers to third-party marketers. For privacy
              inquiries, document support, or advertising questions, contact us via
              WhatsApp on <strong>0705759072</strong>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
