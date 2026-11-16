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

export const metadata: Metadata = {
  title: 'Advertise With Us | CBC Kenya Resource Hub',
  description:
    'Promote your school, college, bookshop, EdTech platform, or tuition service to Kenyan teachers, principals, and parents across PP1 to Grade 12.',
};

const PACKAGES = [
  {
    name: 'In-Feed Subject & Grade Card',
    priceKes: '1,500',
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
              text/link on WhatsApp <strong>0705759072</strong> to go live immediately.
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
              const waHref = `https://wa.me/254705759072?text=${encodeURIComponent(
                `Hello! I want to book the "${pkg.name}" (KES ${pkg.priceKes} ${pkg.period}) ad slot on CBC Kenya Resource Hub.`
              )}`;
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

                  <a
                    href={waHref}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs py-3 px-4 rounded-xl transition"
                  >
                    <MessageCircle className="w-4 h-4" />
                    Book via WhatsApp (0705759072)
                  </a>
                </div>
              );
            })}
          </div>
        </section>

        {/* Direct M-Pesa Payment Box */}
        <section className="bg-slate-900 text-white rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 text-amber-300 text-xs font-extrabold uppercase">
              <Smartphone className="w-4 h-4" />
              Temporary Payment Maintenance Notice
            </div>
            <h3 className="text-lg font-black">
              We Are Sorry — Payment Channels Resume in 72 Hours or Less!
            </h3>
            <p className="text-xs text-slate-300 max-w-xl leading-relaxed">
              All M-Pesa payment methods are currently undergoing scheduled maintenance
              and will be back online shortly within the next{' '}
              <strong className="text-amber-300">72 hours or less</strong>. You can still
              reserve your sponsored slot right now via WhatsApp{' '}
              <strong className="text-emerald-300">0705759072</strong>!
            </p>
          </div>
          <a
            href="https://wa.me/254705759072?text=Hello%2C%20I%20would%20like%20to%20place%20an%20ad%20on%20CBC%20Kenya%20Resource%20Hub"
            target="_blank"
            rel="noreferrer"
            className="shrink-0 inline-flex items-center gap-2 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs px-5 py-3.5 rounded-xl transition"
          >
            <MessageCircle className="w-4 h-4" />
            Chat with Ad Desk: 0705759072
          </a>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
