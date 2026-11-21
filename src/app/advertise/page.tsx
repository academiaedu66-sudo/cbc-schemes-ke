import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowLeft,
  CheckCircle2,
  Megaphone,
  MessageCircle,
  Smartphone,
  Sparkles,
  TrendingUp,
  Users,
} from 'lucide-react';
import SiteFooter from '@/components/SiteFooter';
import AdvertiseCheckoutButton from '@/components/AdvertiseCheckoutButton';

export const metadata: Metadata = {
  title: 'List Your School or Education Service | CBCMATERIALS.SHOP',
  description:
    'Request owner-approved placement for your Kenyan school, college, bookshop, or tuition service on CBCMATERIALS.SHOP with instant M-Pesa STK Push.',
};

const PACKAGES: Array<{
  name: string;
  priceKes: string;
  priceKesNumber: number;
  serviceType: 'AD_PACKAGE_INFEED' | 'AD_PACKAGE_LEADERBOARD' | 'AD_PACKAGE_PREVIEW';
  period: string;
  badge: string;
  highlights: string[];
}> = [
  {
    name: 'In-Feed Subject & Grade Card',
    priceKes: '1,500',
    priceKesNumber: 1500,
    serviceType: 'AD_PACKAGE_INFEED',
    period: 'per week',
    badge: 'POPULAR FOR BOOKSHOPS & TUTORS',
    highlights: [
      'Appears natively inside PP1–Grade 12 curriculum subject listings',
      'Direct click-through to your WhatsApp, website, or shop',
      'Tracked impressions & verified click reporting',
      'Custom headline, badge & call-to-action button',
    ],
  },
  {
    name: 'Top Homepage Leaderboard Spotlight',
    priceKes: '3,500',
    priceKesNumber: 3500,
    serviceType: 'AD_PACKAGE_LEADERBOARD',
    period: 'per week',
    badge: 'HIGHEST VISIBILITY',
    highlights: [
      'Prime banner above the 3,400+ CBC curriculum catalog',
      'Seen first by every visiting teacher, HOD, principal & parent',
      'Includes bonus placement on the Sticky Mobile Earner Bar',
      'Instant activation within 10 minutes of M-Pesa confirmation',
    ],
  },
  {
    name: 'Preview Modal Exclusive Sponsor',
    priceKes: '5,000',
    priceKesNumber: 5000,
    serviceType: 'AD_PACKAGE_PREVIEW',
    period: 'per 2 weeks',
    badge: 'MAXIMUM ENGAGEMENT & CLICKS',
    highlights: [
      'Displayed inside every Free Sample Preview window opened by teachers',
      'Captures 100% high-intent educators actively reviewing KICD materials',
      'Includes Top Leaderboard + In-Feed rotation across all 6 areas',
      'Dedicated WhatsApp lead routing or custom landing link',
    ],
  },
];

export default function AdvertisePage() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <header className="bg-emerald-800 text-white py-8 shadow">
        <div className="max-w-5xl mx-auto px-4 space-y-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-200 hover:text-white"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to CBC Resource Catalog
          </Link>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 bg-amber-400 text-slate-950 text-[11px] font-black uppercase px-2.5 py-0.5 rounded-full">
              <Megaphone className="w-3.5 h-3.5" />
              Direct Education Advertising
            </span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">
            Reach Thousands of Kenyan Teachers, Principals &amp; Parents Daily
          </h1>
          <p className="text-sm text-emerald-100 max-w-2xl">
            Showcase your private school admissions, KICD-approved bookshop, college
            intake, stationery business, or EdTech app right where educators download
            PP1–Grade 12 materials.
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-10 space-y-10 flex-1">
        {/* Audience Highlights */}
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-xs">
            <Users className="w-6 h-6 text-emerald-600" />
            <h2 className="text-sm font-black text-slate-900">
              100% Kenyan Education Audience
            </h2>
            <p className="text-xs text-slate-600">
              ECDE, Primary, Junior School (JSS) &amp; Senior School teachers, HODs,
              school directors, and parents nationwide.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-xs">
            <TrendingUp className="w-6 h-6 text-blue-600" />
            <h2 className="text-sm font-black text-slate-900">
              Verified Views &amp; Click Tracking
            </h2>
            <p className="text-xs text-slate-600">
              Every viewport impression and CTA click is tracked in real time across
              desktop and mobile devices.
            </p>
          </div>
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-1.5 shadow-xs">
            <Sparkles className="w-6 h-6 text-amber-500" />
            <h2 className="text-sm font-black text-slate-900">
              Instant Live Activation
            </h2>
            <p className="text-xs text-slate-600">
              Pay directly via M-Pesa <strong>0728595160</strong> and send your banner
              text/link on WhatsApp <strong>0728595160</strong> to go live immediately.
            </p>
          </div>
        </section>

        {/* Ad Packages */}
        <section className="space-y-4">
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900">
            Sponsored Placement Packages
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {PACKAGES.map((pkg) => {
              return (
                <div
                  key={pkg.name}
                  className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col justify-between space-y-5"
                >
                  <div className="space-y-3">
                    <span className="inline-block text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {pkg.badge}
                    </span>
                    <h3 className="text-base font-black text-slate-900">{pkg.name}</h3>
                    <div className="flex items-baseline gap-1">
                      <span className="text-2xl font-black text-emerald-700">
                        KES {pkg.priceKes}
                      </span>
                      <span className="text-xs text-slate-500 font-semibold">
                        {pkg.period}
                      </span>
                    </div>
                    <ul className="space-y-2 pt-2 border-t border-slate-100">
                      {pkg.highlights.map((h) => (
                        <li
                          key={h}
                          className="flex items-start gap-2 text-xs text-slate-600"
                        >
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <AdvertiseCheckoutButton
                    packageName={pkg.name}
                    priceKesNumber={pkg.priceKesNumber}
                    priceKesDisplay={pkg.priceKes}
                    period={pkg.period}
                    serviceType={pkg.serviceType}
                  />
                </div>
              );
            })}
          </div>
        </section>

        {/* Direct M-Pesa STK Push & Strict Owner-Permission Notice */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-emerald-400 text-xs font-extrabold uppercase">
              <Smartphone className="w-4 h-4" />
              Live Instant M-Pesa Settlement • Strict Owner Permission Required
            </div>
            <h3 className="text-lg font-black">
              100% Clean Education Portal — Zero Unauthorized Third-Party Ads
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              No external ad networks or unapproved company ads ever appear on{' '}
              <strong className="text-amber-300">CBCMATERIALS.SHOP</strong>. Every school,
              bookshop, or tutor spotlight is paid directly via live M-Pesa STK Push and
              personally reviewed and approved by management via{' '}
              <strong className="text-emerald-300">WhatsApp 0728595160</strong>.
            </p>
          </div>
          <a
            href="https://wa.me/254728595160?text=Hello%2C%20I%20would%20like%20to%20request%20owner%20approval%20for%20a%20school%20listing%20on%20CBCMATERIALS.SHOP"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-3.5 rounded-xl transition"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Owner Desk: 0728595160
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
