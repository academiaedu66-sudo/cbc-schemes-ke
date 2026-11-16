import React from 'react';
import Link from 'next/link';
import { BookOpen, Megaphone, MessageCircle, ShieldCheck } from 'lucide-react';

export default function SiteFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800 mt-16 pb-20 md:pb-10">
      <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Mission */}
        <div className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2 text-white font-black text-lg">
            <BookOpen className="w-5 h-5 text-emerald-400" />
            <span>CBC Kenya Resource Hub</span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-md">
            Kenya&apos;s trusted KICD-aligned curriculum portal providing Editable Word
            (.DOCX) and Print-Ready (.PDF) Schemes of Work, Lesson Plans, Lesson Notes,
            Records of Work, Opener/Mid/End-Term Assessments, and KPSEA &amp; KJSEA
            Trial Papers for PP1, PP2, and Grades 1–12.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold">
              <ShieldCheck className="w-4 h-4" />
              M-Pesa Direct: 0728595160
            </span>
            <a
              href="https://wa.me/254705759072?text=Hello%2C%20I%20have%20an%20inquiry%20on%20CBC%20Kenya%20Resource%20Hub"
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: 0705759072
            </a>
          </div>
        </div>

        {/* Curriculum Levels */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
            Curriculum Coverage
          </h4>
          <ul className="space-y-1.5 text-xs text-slate-400">
            <li>Pre-Primary: PP1 &amp; PP2 (ECDE)</li>
            <li>Lower Primary: Grades 1–3 (KEYA)</li>
            <li>Upper Primary: Grades 4–6 (KPSEA)</li>
            <li>Junior School (JSS): Grades 7–9 (KJSEA)</li>
            <li>Senior School Pathways: Grades 10–12</li>
          </ul>
        </div>

        {/* Legal, Advertising & Monetization Compliance Links */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
            Advertising &amp; Policies
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link
                href="/advertise"
                className="inline-flex items-center gap-1.5 text-amber-300 hover:text-amber-200 font-bold"
              >
                <Megaphone className="w-3.5 h-3.5" />
                Advertise With Us (Rate Card)
              </Link>
            </li>
            <li>
              <Link href="/privacy-policy" className="text-slate-400 hover:text-white transition">
                Privacy &amp; Cookie Policy
              </Link>
            </li>
            <li>
              <Link href="/terms" className="text-slate-400 hover:text-white transition">
                Terms of Service &amp; Licensing
              </Link>
            </li>
            <li>
              <a href="/ads.txt" className="text-slate-400 hover:text-white transition">
                Authorized Sellers (ads.txt)
              </a>
            </li>
            <li>
              <Link href="/mobile-admin" className="text-slate-400 hover:text-white transition">
                Admin Mobile App
              </Link>
            </li>
            <li>
              <Link href="/monetization" className="text-slate-400 hover:text-white transition">
                Monetization &amp; Earnings Studio
              </Link>
            </li>
            <li>
              <Link href="/admin" className="text-slate-400 hover:text-white transition">
                Publisher &amp; Admin Studio
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-[11px] text-slate-500 px-4">
        &copy; 2026 CBC Kenya Resource Hub. Aligned with KICD Rationalized Designs. All
        rights reserved.
      </div>
    </footer>
  );
}
