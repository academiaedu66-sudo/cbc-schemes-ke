import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import BrandLogoLockup from '@/components/BrandLogoLockup';
import SiteFooter from '@/components/SiteFooter';

export const metadata: Metadata = {
  title: 'Privacy & Data Protection Policy',
  description:
    'Official Privacy Policy, Kenya Data Protection Act (2019) compliance, customer email & phone protection, Google AdSense cookie disclosure, and M-Pesa transaction policy for CBCMATERIALS.SHOP.',
  alternates: {
    canonical: 'https://www.cbcmaterials.shop/privacy-policy',
  },
};

export default function PrivacyPolicyPage() {
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
            Privacy, Cookie &amp; Data Protection Policy
          </h1>
          <p className="text-xs text-slate-400">
            Last Updated: November 2026 • Compliant with the Kenya Data
            Protection Act, 2019 (ODPC)
          </p>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-10 flex-1 w-full">
        <div className="bg-white border border-slate-200 rounded-2xl p-6 md:p-8 space-y-6 text-sm leading-relaxed text-slate-700 shadow-xs">
          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              1. Information We Collect (Member Sign-Up, Guest Mode &amp;
              M-Pesa)
            </h2>
            <p>
              <strong>CBCMATERIALS.SHOP</strong> collects minimal personal data
              required to deliver digital curriculum documents, video classes,
              and tuition matching:
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                <strong>Optional Member Sign-Up:</strong> Visitors may browse
                freely via <em>Continue as a Guest / Skip</em>, or voluntarily
                create a member profile using their{' '}
                <strong>Email Address</strong> and{' '}
                <strong>Phone Number</strong> (plus optional Name and Role) to
                receive curriculum updates and faster checkout support.
              </li>
              <li>
                <strong>M-Pesa Checkout &amp; Fulfillment:</strong> When
                purchasing materials, books, exams, or video classes via
                Safaricom M-Pesa (STK Express or confirmation code), we process
                your mobile number and M-Pesa receipt reference strictly to
                verify payment and unlock your instant downloads. We never see
                or store your M-Pesa PIN.
              </li>
              <li>
                <strong>Tuition &amp; Gaming Registrations:</strong> Parent,
                learner, and teacher tuition matching forms store contact and
                county/subject preferences solely to connect verified tutors and
                students.
              </li>
            </ul>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              2. Kenya Data Protection Act (2019) &amp; Your Rights
            </h2>
            <p>
              In accordance with the{' '}
              <strong>Kenya Data Protection Act, 2019</strong>, your registered
              email address and phone number are stored in encrypted access-controlled
              cloud storage and are never sold or rented to third-party data
              brokers. You have the right at any time to request access to,
              correction of, or permanent deletion of your registered email and
              phone record by contacting our Data Protection Desk on WhatsApp at{' '}
              <strong>0705759072</strong>.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              3. Google AdSense, Cookies &amp; Third-Party Advertising
            </h2>
            <p>
              We work with reputable advertising and analytics partners —
              including Google AdSense, Monetag, Meta (Facebook), and direct
              educational sponsors — to display clearly labeled advertisements.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs sm:text-sm">
              <li>
                Third-party vendors, including Google, use cookies (such as the
                DoubleClick DART cookie) to serve ads based on a user&apos;s
                prior visits to this website or other websites on the internet.
              </li>
              <li>
                Visitors may opt out of personalized advertising at any time at{' '}
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
              4. AI Study Tools &amp; Guidance Disclaimer
            </h2>
            <p>
              Our Ask Gemini Homework Hub and AI Guidance &amp; Counselling Hub
              provide educational study explanations and general supportive
              guidance for learners and parents; they do not replace licensed
              medical, clinical, or emergency professional care.
            </p>
          </section>

          <section className="space-y-2">
            <h2 className="text-base font-black text-slate-900">
              5. Contact &amp; Support Desk
            </h2>
            <p>
              For privacy requests, account deletion, or instant download
              assistance on <strong>CBCMATERIALS.SHOP</strong>, reach us via
              WhatsApp on <strong>0705759072</strong> or M-Pesa support desk{' '}
              <strong>0728595160</strong>.
            </p>
          </section>
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
