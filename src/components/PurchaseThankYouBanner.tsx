'use client';

import React from 'react';

interface PurchaseThankYouBannerProps {
  buyerName?: string | null;
  compact?: boolean;
}

export default function PurchaseThankYouBanner({
  buyerName,
  compact = false,
}: PurchaseThankYouBannerProps) {
  const formattedName = String(buyerName || '')
    .replace(/[^a-zA-Z\s'.-]/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim()
    .toUpperCase();

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border-2 border-amber-300 bg-gradient-to-br from-emerald-950 via-teal-900 to-indigo-950 text-white shadow-lg ${
        compact ? 'p-3.5' : 'p-4 sm:p-5'
      }`}
    >
      <style>{`
        @keyframes cbcFlowerBloom {
          0% { transform: scale(0.35) rotate(-25deg); opacity: 0.2; }
          60% { transform: scale(1.1) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes cbcFlowerGentleSway {
          0%, 100% { transform: rotate(-5deg) scale(1); }
          50% { transform: rotate(6deg) scale(1.06); }
        }
        @keyframes cbcPetalPulse {
          0%, 100% { opacity: 0.92; }
          50% { opacity: 1; filter: drop-shadow(0 0 8px rgba(251, 191, 36, 0.65)); }
        }
        @keyframes cbcSparkleFloat {
          0%, 100% { transform: translateY(0px) scale(0.85); opacity: 0.45; }
          50% { transform: translateY(-6px) scale(1.2); opacity: 1; }
        }
        .cbc-flower-bloom {
          animation: cbcFlowerBloom 0.85s cubic-bezier(0.22, 1, 0.36, 1) forwards,
                     cbcFlowerGentleSway 3.6s ease-in-out 0.85s infinite;
          transform-origin: center center;
        }
        .cbc-flower-petals {
          animation: cbcPetalPulse 2.4s ease-in-out infinite;
        }
        .cbc-sparkle-1 { animation: cbcSparkleFloat 2.1s ease-in-out infinite; }
        .cbc-sparkle-2 { animation: cbcSparkleFloat 2.7s ease-in-out 0.5s infinite; }
        .cbc-sparkle-3 { animation: cbcSparkleFloat 2.4s ease-in-out 1.0s infinite; }
      `}</style>

      {/* Subtle golden glow backdrop */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-10 -right-10 h-32 w-32 rounded-full bg-amber-400/20 blur-2xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-10 -left-10 h-28 w-28 rounded-full bg-pink-400/15 blur-2xl"
      />

      <div className="relative flex flex-col sm:flex-row items-center gap-3.5 text-center sm:text-left">
        {/* Animated Blooming Multi-Petal Flower */}
        <div className="relative shrink-0 flex items-center justify-center w-16 h-16 rounded-2xl bg-white/10 border border-amber-300/40 shadow-inner">
          <svg
            viewBox="0 0 100 100"
            className="w-14 h-14 cbc-flower-bloom"
            aria-label="Blooming Appreciation Flower"
          >
            {/* Stem & Leaves */}
            <path
              d="M50 56 Q48 76 50 93"
              stroke="#34d399"
              strokeWidth="4.5"
              strokeLinecap="round"
              fill="none"
            />
            <path
              d="M50 76 Q34 70 30 80 Q40 86 50 78 Z"
              fill="#10b981"
            />
            <path
              d="M50 73 Q66 67 70 77 Q60 83 50 75 Z"
              fill="#34d399"
            />

            {/* 8 Radiant Blooming Petals */}
            <g className="cbc-flower-petals">
              {[0, 45, 90, 135, 180, 225, 270, 315].map((deg, idx) => (
                <ellipse
                  key={deg}
                  cx="50"
                  cy="24"
                  rx="10"
                  ry="18"
                  fill={idx % 2 === 0 ? '#fb7185' : '#f472b6'}
                  stroke="#fda4af"
                  strokeWidth="1"
                  transform={`rotate(${deg} 50 44)`}
                />
              ))}
              {/* Inner Golden-Warm Corolla */}
              {[22.5, 67.5, 112.5, 157.5, 202.5, 247.5, 292.5, 337.5].map((deg) => (
                <ellipse
                  key={deg}
                  cx="50"
                  cy="31"
                  rx="6"
                  ry="11"
                  fill="#fde047"
                  opacity="0.88"
                  transform={`rotate(${deg} 50 44)`}
                />
              ))}
              {/* Flower Center */}
              <circle
                cx="50"
                cy="44"
                r="10.5"
                fill="#f59e0b"
                stroke="#fef08a"
                strokeWidth="2"
              />
            </g>

            {/* Floating Golden Sparkles */}
            <circle cx="18" cy="20" r="2.6" fill="#fde047" className="cbc-sparkle-1" />
            <circle cx="83" cy="18" r="2.8" fill="#fef08a" className="cbc-sparkle-2" />
            <circle cx="84" cy="52" r="2.2" fill="#fbcfe8" className="cbc-sparkle-3" />
          </svg>
        </div>

        {/* Warm Personalized Appreciation Message */}
        <div className="flex-1 space-y-1">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-400/25 border border-amber-300/50 text-amber-200 text-[10px] font-black uppercase tracking-wider">
            🌸 Official Appreciation • Verified M-Pesa Purchase
          </div>
          <h4 className="text-sm sm:text-base font-black tracking-wide text-amber-300 leading-snug">
            THANK YOU, YOU CHOSE THE RIGHT PATH
            {formattedName ? `, ${formattedName}` : ''}!
          </h4>
          <p className="text-xs text-emerald-100/95 leading-relaxed">
            {formattedName ? (
              <>
                Dear <strong>{formattedName}</strong>, we warmly celebrate your investment in
                quality education! Wishing you outstanding success, confidence, and top mastery in
                every strand and assessment.
              </>
            ) : (
              <>
                We warmly celebrate your investment in quality education! Wishing you outstanding
                success, confidence, and top mastery in every strand and assessment.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
