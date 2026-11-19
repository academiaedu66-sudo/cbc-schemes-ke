'use client';

import React from 'react';
import Link from 'next/link';
import { BookOpen, Megaphone, MessageCircle, ShieldCheck } from 'lucide-react';
import { useMonetization } from '@/components/MonetizationEngine';

const FOOTER_GRADE_SLUGS = [
  { slug: 'pp1', label: 'PP1' },
  { slug: 'pp2', label: 'PP2' },
  { slug: 'grade-1', label: 'Grade 1' },
  { slug: 'grade-2', label: 'Grade 2' },
  { slug: 'grade-3', label: 'Grade 3' },
  { slug: 'grade-4', label: 'Grade 4' },
  { slug: 'grade-5', label: 'Grade 5' },
  { slug: 'grade-6', label: 'Grade 6 (KPSEA)' },
  { slug: 'grade-7', label: 'Grade 7 (JSS)' },
  { slug: 'grade-8', label: 'Grade 8 (JSS)' },
  { slug: 'grade-9', label: 'Grade 9 (KJSEA)' },
  { slug: 'grade-10', label: 'Grade 10' },
  { slug: 'grade-11', label: 'Grade 11' },
  { slug: 'grade-12', label: 'Grade 12' },
];

export default function SiteFooter() {
  const { config, trackInteraction } = useMonetization();
  const extraSocials = (config.connectedSocialLinks || []).filter(
    (s) =>
      s.id !== 'facebook_feed' &&
      s.id !== 'facebook_reels' &&
      s.id !== 'whatsapp'
  );

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
            Kenya&apos;s #1 KICD-aligned CBCMaterials portal (www.cbcmaterials.shop) providing
            6,534+ Editable Word (.DOCX) and Print-Ready (.PDF) CBC Schemes of Work, Lesson Plans,
            Teachers&apos; Notes, Records of Work, National KJSEA &amp; KPSEA Examinations + Marking
            Schemes, All TSC Services, and Verified Home &amp; Online Tuition Tutors (PP1–Grade 12).
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
            <span className="inline-flex items-center gap-1.5 bg-slate-800 text-emerald-300 px-3 py-1.5 rounded-lg font-semibold">
              <ShieldCheck className="w-4 h-4" />
              Pochi / M-Pesa: 0728595160
            </span>
            <a
              href={
                config.facebookPublic?.profileUrl ||
                'https://www.facebook.com/profile.php?id=61591027359399'
              }
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('facebook_footer_profile_click')}
              className="inline-flex items-center gap-1.5 bg-[#1877F2] hover:bg-[#166FE5] text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <span className="w-4 h-4 rounded-full bg-white text-[#1877F2] font-black text-[11px] inline-flex items-center justify-center leading-none">
                f
              </span>
              Official Facebook Profile
            </a>
            <a
              href={
                config.facebookPublic?.reelsUrl ||
                'https://www.facebook.com/profile.php?id=61591027359399&sk=reels_tab'
              }
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('facebook_footer_reels_click')}
              className="inline-flex items-center gap-1.5 bg-blue-900/80 hover:bg-blue-800 border border-blue-700 text-blue-100 px-3 py-1.5 rounded-lg font-semibold transition"
            >
              Watch Facebook Reels
            </a>
            <a
              href={
                config.facebookPublic?.whatsappUrl ||
                'https://wa.me/254705759072?text=Hello%2C%20I%20have%20an%20inquiry%20on%20CBC%20Kenya%20Resource%20Hub'
              }
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('whatsapp_footer_click')}
              className="inline-flex items-center gap-1.5 bg-emerald-700 hover:bg-emerald-600 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <MessageCircle className="w-4 h-4" />
              WhatsApp: 0705759072
            </a>
            <a
              href="https://www.tiktok.com/@cbcmaterials.shop"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('tiktok_footer_click')}
              className="inline-flex items-center gap-1.5 bg-slate-950 hover:bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <span className="text-[10px] font-black bg-pink-600 text-white px-1.5 py-0.5 rounded">
                TT
              </span>
              <span>TikTok</span>
            </a>
            <a
              href="https://www.youtube.com/@cbcmaterials"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('youtube_footer_click')}
              className="inline-flex items-center gap-1.5 bg-red-600 hover:bg-red-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <span className="text-[10px] font-black bg-white text-red-600 px-1.5 py-0.5 rounded">
                YT
              </span>
              <span>YouTube Shorts</span>
            </a>
            <a
              href="https://x.com/cbcmaterials_ke"
              target="_blank"
              rel="noreferrer"
              onClick={() => trackInteraction('x_twitter_footer_click')}
              className="inline-flex items-center gap-1.5 bg-black hover:bg-slate-800 border border-slate-700 text-white px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <span className="text-[10px] font-black bg-slate-800 text-white px-1.5 py-0.5 rounded">
                X
              </span>
              <span>X (Twitter)</span>
            </a>
            <Link
              href="/videos"
              onClick={() => trackInteraction('videos_hub_footer_click')}
              className="inline-flex items-center gap-1.5 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/40 text-amber-200 px-3 py-1.5 rounded-lg font-semibold transition"
            >
              <span>18 Social Videos</span>
            </Link>
            {extraSocials.map((soc) => (
              <a
                key={soc.id}
                href={soc.url}
                target="_blank"
                rel="noreferrer"
                onClick={() => trackInteraction(`social_footer_${soc.id}`)}
                className="inline-flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 px-3 py-1.5 rounded-lg font-semibold transition"
              >
                <span className="text-[10px] font-black bg-indigo-600 text-white px-1.5 py-0.5 rounded">
                  {soc.shortBadge}
                </span>
                <span>{soc.name.split(' ')[0]}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Grade Catalog Quick Links */}
        <div className="space-y-2.5">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
            CBC Grade Catalogs
          </h4>
          <div className="flex flex-wrap gap-1.5 text-xs">
            {FOOTER_GRADE_SLUGS.map((g) => (
              <Link
                key={g.slug}
                href={`/grades/${g.slug}`}
                className="bg-slate-800/80 hover:bg-emerald-800 text-slate-300 hover:text-white px-2 py-1 rounded transition"
              >
                {g.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Legal, Sitemap & Advertising Links */}
        <div className="space-y-2">
          <h4 className="text-xs font-extrabold uppercase tracking-wider text-white">
            Portal &amp; Policies
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
              <Link href="/topics/schemes-of-work" className="text-slate-300 hover:text-emerald-300 font-semibold transition">
                2026 CBC Schemes of Work
              </Link>
            </li>
            <li>
              <Link href="/topics/teachers-notes" className="text-slate-300 hover:text-emerald-300 font-semibold transition">
                CBC Teachers&apos; &amp; Short Notes
              </Link>
            </li>
            <li>
              <Link href="/topics/knec-examinations" className="text-slate-300 hover:text-emerald-300 font-semibold transition">
                KNEC, KJSEA &amp; KPSEA Examinations
              </Link>
            </li>
            <li>
              <Link href="/topics/tsc-services" className="text-slate-300 hover:text-emerald-300 font-semibold transition">
                TSC Services, TPAD &amp; T-Pay
              </Link>
            </li>
            <li>
              <Link href="/topics/tuition-and-tutors" className="text-slate-300 hover:text-emerald-300 font-semibold transition">
                CBC Tuition &amp; Private Tutors Kenya
              </Link>
            </li>
            <li>
              <a href="/sitemap.xml" className="text-slate-400 hover:text-white transition">
                XML Sitemap (6,534+ CBC Files)
              </a>
            </li>
            <li>
              <a href="/ads.txt" className="text-slate-400 hover:text-white transition">
                Authorized Sellers (ads.txt)
              </a>
            </li>
            <li>
              <Link
                href="/mobile-admin"
                rel="nofollow"
                className="text-slate-500 hover:text-slate-300 transition"
              >
                Admin Mobile App
              </Link>
            </li>
            <li>
              <Link
                href="/admin"
                rel="nofollow"
                className="text-slate-500 hover:text-slate-300 transition"
              >
                Publisher Studio
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-slate-800/80 py-4 text-center text-[11px] text-slate-500 px-4">
        &copy; 2026 CBC Kenya Resource Hub (www.cbcmaterials.shop). Aligned with KICD
        Rationalized Designs. All rights reserved.
      </div>
    </footer>
  );
}
