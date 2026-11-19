'use client';

import React from 'react';
import Link from 'next/link';

export default function BrandLogoLockup({
  size = 'lg',
  showTagline = false,
  subtitle,
  asHeading = false,
}: {
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  subtitle?: string;
  asHeading?: boolean;
}) {
  const imgClass =
    size === 'sm'
      ? 'w-10 h-10 rounded-xl'
      : size === 'md'
      ? 'w-12 h-12 rounded-2xl'
      : 'w-16 h-16 sm:w-20 sm:h-20 rounded-2xl';

  const textClass =
    size === 'sm'
      ? 'text-base sm:text-lg'
      : size === 'md'
      ? 'text-lg sm:text-xl'
      : 'text-xl sm:text-3xl';

  const dotShopClass =
    size === 'sm'
      ? 'text-xs sm:text-sm px-1.5 py-0.5 ml-1 rounded-md'
      : size === 'md'
      ? 'text-sm sm:text-base px-2 py-0.5 ml-1 rounded-lg'
      : 'text-base sm:text-xl px-2.5 py-0.5 ml-1.5 rounded-xl';

  const coloredWordmark = (
    <span
      className={`font-black uppercase tracking-tight inline-flex flex-wrap items-center leading-none ${textClass}`}
    >
      <span className="bg-gradient-to-r from-amber-300 via-yellow-200 to-amber-400 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(251,191,36,0.45)]">
        CBC
      </span>
      <span className="bg-gradient-to-r from-emerald-300 via-cyan-200 to-sky-300 bg-clip-text text-transparent drop-shadow-[0_2px_8px_rgba(52,211,153,0.35)]">
        MATERIALS
      </span>
      <span
        className={`bg-gradient-to-r from-rose-500 via-pink-500 to-amber-400 text-white font-black shadow-[0_4px_14px_rgba(244,63,94,0.5)] border border-amber-200/60 ${dotShopClass}`}
      >
        .SHOP
      </span>
    </span>
  );

  return (
    <div className="flex flex-row items-center gap-3.5 sm:gap-4 text-left">
      {/* Far-Left Dedicated Crest Logo Column (Never stacked on top of writings) */}
      <Link href="/" className="relative shrink-0 group focus:outline-none">
        <div className="absolute -inset-1 rounded-2xl bg-gradient-to-tr from-amber-400 via-emerald-400 to-rose-500 opacity-75 blur-xs group-hover:opacity-100 transition" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/cbcmaterials-logo.jpg"
          alt="CBCMATERIALS.SHOP Official Crest Logo"
          className={`relative ${imgClass} object-cover bg-white border-2 border-amber-300 shadow-lg`}
        />
      </Link>

      {/* Right-Side Writings Column */}
      <div className="flex flex-col justify-center min-w-0">
        <Link href="/" className="focus:outline-none w-fit">
          {asHeading ? <h1>{coloredWordmark}</h1> : coloredWordmark}
        </Link>
        {showTagline && (
          <span className="text-[10px] sm:text-xs font-extrabold uppercase tracking-widest text-amber-200/95 mt-1">
            KENYA&apos;S #1 OFFICIAL CBC &amp; KNEC PORTAL (PP1–GRADE 12)
          </span>
        )}
        {subtitle && (
          <p className="text-emerald-100 text-xs sm:text-sm mt-1 leading-snug max-w-2xl">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}
