'use client';

import React from 'react';

export type ButtonEmblemVariant =
  | 'tuition_1on1'
  | 'holiday_tuition'
  | 'global_donate'
  | 'book_1'
  | 'book_2'
  | 'book_3'
  | 'kjsea_exam'
  | 'all_materials'
  | 'gemini_ai'
  | 'side_hustles'
  | 'tsc_services'
  | 'tutor_videos'
  | 'gaming'
  | 'counselling'
  | 'advertise'
  | 'admin_studio'
  | 'member_auth'
  | 'facebook_reels'
  | 'whatsapp_chat';

interface EmblemTheme {
  tileBg: string;
  ringColor: string;
  renderSvg: () => React.ReactNode;
}

const EMBLEM_THEMES: Record<ButtonEmblemVariant, EmblemTheme> = {
  tuition_1on1: {
    tileBg: 'from-slate-950 via-indigo-950 to-purple-900',
    ringColor: 'border-amber-300/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 2.5L14.4 7.6L20 8.3L15.9 12.1L17 17.6L12 14.9L7 17.6L8.1 12.1L4 8.3L9.6 7.6L12 2.5Z"
          fill="#FBBF24"
          stroke="#FEF3C7"
          strokeWidth="1.2"
        />
        <path d="M7 20.5H17" stroke="#34D399" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  holiday_tuition: {
    tileBg: 'from-emerald-950 via-emerald-800 to-teal-900',
    ringColor: 'border-amber-300/90',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 4L2.5 9L12 14L21.5 9L12 4Z"
          fill="#FDE047"
          stroke="#FFFFFF"
          strokeWidth="1.1"
        />
        <path
          d="M6.5 11.5V16.2C6.5 17.8 9 19.2 12 19.2C15 19.2 17.5 17.8 17.5 16.2V11.5"
          stroke="#6EE7B7"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path d="M20.5 9.5V15.5" stroke="#FBBF24" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  global_donate: {
    tileBg: 'from-rose-700 via-pink-700 to-indigo-950',
    ringColor: 'border-white/90',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="10" r="6.2" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.1" />
        <path d="M6.2 10H17.8M12 3.8C13.8 5.6 13.8 14.4 12 16.2C10.2 14.4 10.2 5.6 12 3.8Z" stroke="#0F172A" strokeWidth="1.1" />
        <path
          d="M12 21.2C12 21.2 6 17.8 6 14.3C6 12.7 7.3 11.6 8.7 11.6C9.9 11.6 11.1 12.3 12 13.4C12.9 12.3 14.1 11.6 15.3 11.6C16.7 11.6 18 12.7 18 14.3C18 17.8 12 21.2 12 21.2Z"
          fill="#FB7185"
          stroke="#FFF1F2"
          strokeWidth="1.1"
        />
      </svg>
    ),
  },
  book_1: {
    tileBg: 'from-emerald-950 via-emerald-800 to-teal-900',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <rect x="4" y="3.5" width="16" height="17" rx="3" fill="#10B981" stroke="#FEF3C7" strokeWidth="1.3" />
        <path d="M8 3.5V20.5" stroke="#064E3B" strokeWidth="1.5" />
        <text x="13.8" y="14.8" textAnchor="middle" fill="#FEF08A" fontSize="8.5" fontWeight="900">
          B1
        </text>
      </svg>
    ),
  },
  book_2: {
    tileBg: 'from-indigo-950 via-blue-900 to-slate-900',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <rect x="4" y="3.5" width="16" height="17" rx="3" fill="#38BDF8" stroke="#E0F2FE" strokeWidth="1.3" />
        <path d="M8 3.5V20.5" stroke="#1E3A8A" strokeWidth="1.5" />
        <text x="13.8" y="14.8" textAnchor="middle" fill="#0F172A" fontSize="8.5" fontWeight="900">
          B2
        </text>
      </svg>
    ),
  },
  book_3: {
    tileBg: 'from-purple-950 via-fuchsia-900 to-indigo-950',
    ringColor: 'border-amber-300',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M6.5 6.5L9.5 3.5L12 6L14.5 3.5L17.5 6.5H6.5Z" fill="#FDE047" />
        <rect x="4" y="6.5" width="16" height="14.5" rx="2.8" fill="#A855F7" stroke="#FEF08A" strokeWidth="1.3" />
        <text x="12" y="16.2" textAnchor="middle" fill="#FFFFFF" fontSize="8.2" fontWeight="900">
          B3
        </text>
      </svg>
    ),
  },
  kjsea_exam: {
    tileBg: 'from-slate-950 via-rose-950 to-amber-900',
    ringColor: 'border-amber-300',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="9.5" r="5.8" fill="#FBBF24" stroke="#FFFBEB" strokeWidth="1.3" />
        <path d="M9 14.5L7.2 20.5L12 18.2L16.8 20.5L15 14.5" fill="#F43F5E" stroke="#FFE4E6" strokeWidth="1.1" />
        <path d="M10.2 9.6L11.5 10.9L14.2 8.2" stroke="#78350F" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  all_materials: {
    tileBg: 'from-emerald-800 via-emerald-700 to-teal-900',
    ringColor: 'border-amber-300/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M12 4L3.5 8.5L12 13L20.5 8.5L12 4Z" fill="#FDE047" />
        <path d="M3.5 12.5L12 17L20.5 12.5" stroke="#A7F3D0" strokeWidth="2" strokeLinecap="round" />
        <path d="M3.5 16.5L12 21L20.5 16.5" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  gemini_ai: {
    tileBg: 'from-slate-950 via-indigo-950 to-fuchsia-950',
    ringColor: 'border-cyan-300/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 2.5C12.7 7.6 16.4 11.3 21.5 12C16.4 12.7 12.7 16.4 12 21.5C11.3 16.4 7.6 12.7 2.5 12C7.6 11.3 11.3 7.6 12 2.5Z"
          fill="url(#geminiGrad)"
          stroke="#E0F2FE"
          strokeWidth="1"
        />
        <defs>
          <linearGradient id="geminiGrad" x1="3" y1="3" x2="21" y2="21">
            <stop stopColor="#38BDF8" />
            <stop offset="0.5" stopColor="#C084FC" />
            <stop offset="1" stopColor="#FDE047" />
          </linearGradient>
        </defs>
      </svg>
    ),
  },
  side_hustles: {
    tileBg: 'from-slate-950 via-emerald-950 to-slate-900',
    ringColor: 'border-emerald-300/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <rect x="3.5" y="7.5" width="17" height="12" rx="2.5" fill="#10B981" stroke="#D1FAE5" strokeWidth="1.2" />
        <path d="M9 7.5V5.8C9 4.8 9.8 4 10.8 4H13.2C14.2 4 15 4.8 15 5.8V7.5" stroke="#FDE047" strokeWidth="1.6" />
        <circle cx="12" cy="13.5" r="2.6" fill="#FDE047" />
      </svg>
    ),
  },
  tsc_services: {
    tileBg: 'from-slate-950 via-blue-950 to-indigo-950',
    ringColor: 'border-sky-200/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M12 3L3.5 7.5H20.5L12 3Z" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.1" />
        <path d="M6.5 8.5V16.5M12 8.5V16.5M17.5 8.5V16.5" stroke="#7DD3FC" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 18.5H20" stroke="#FDE047" strokeWidth="2.2" strokeLinecap="round" />
      </svg>
    ),
  },
  tutor_videos: {
    tileBg: 'from-slate-950 via-red-950 to-rose-900',
    ringColor: 'border-amber-300',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <rect x="3" y="4.5" width="18" height="15" rx="3.5" fill="#EF4444" stroke="#FDE047" strokeWidth="1.3" />
        <path d="M10 8.8L16 12L10 15.2V8.8Z" fill="#FFFFFF" />
      </svg>
    ),
  },
  gaming: {
    tileBg: 'from-indigo-950 via-purple-900 to-slate-950',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <rect x="3" y="7" width="18" height="10.5" rx="5" fill="#8B5CF6" stroke="#FEF08A" strokeWidth="1.3" />
        <path d="M8.2 10.2V14.2M6.2 12.2H10.2" stroke="#FFFFFF" strokeWidth="1.8" strokeLinecap="round" />
        <circle cx="15.5" cy="11" r="1.2" fill="#FDE047" />
        <circle cx="17.5" cy="13.2" r="1.2" fill="#34D399" />
      </svg>
    ),
  },
  counselling: {
    tileBg: 'from-purple-950 via-rose-900 to-pink-900',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 20C12 20 4.5 15.2 4.5 9.7C4.5 7.2 6.5 5.2 9 5.2C10.5 5.2 11.5 6 12 7C12.5 6 13.5 5.2 15 5.2C17.5 5.2 19.5 7.2 19.5 9.7C19.5 15.2 12 20 12 20Z"
          fill="#FB7185"
          stroke="#FFE4E6"
          strokeWidth="1.3"
        />
      </svg>
    ),
  },
  advertise: {
    tileBg: 'from-slate-950 via-amber-950 to-slate-900',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path d="M4 10.5V14.5H7.5L15.5 18.5V6.5L7.5 10.5H4Z" fill="#FBBF24" stroke="#FEF3C7" strokeWidth="1.2" />
        <path d="M18.2 9.2C19.5 10.6 19.5 14.4 18.2 15.8" stroke="#34D399" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  admin_studio: {
    tileBg: 'from-slate-950 via-emerald-950 to-teal-950',
    ringColor: 'border-emerald-400/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 3L5 6V11.8C5 16.2 8 19.8 12 21C16 19.8 19 16.2 19 11.8V6L12 3Z"
          fill="#10B981"
          stroke="#A7F3D0"
          strokeWidth="1.3"
        />
        <path d="M9.5 12.2L11.2 13.9L14.8 10.3" stroke="#022C22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  member_auth: {
    tileBg: 'from-slate-950 via-teal-950 to-emerald-950',
    ringColor: 'border-white/80',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="10.5" cy="8.5" r="3.5" fill="#FDE047" />
        <path d="M4.5 18.5C4.5 15.5 7.2 13.5 10.5 13.5C13.8 13.5 16.5 15.5 16.5 18.5" fill="#34D399" />
        <path d="M18.5 8.5V13.5M16 11H21" stroke="#FDE047" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  facebook_reels: {
    tileBg: 'from-blue-950 via-[#1877F2] to-indigo-900',
    ringColor: 'border-white/85',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <circle cx="12" cy="12" r="8.5" fill="#FFFFFF" />
        <path
          d="M13.4 19V12.7H15.5L15.8 10.2H13.4V8.7C13.4 8 13.6 7.5 14.6 7.5H15.9V5.3C15.6 5.3 14.9 5.2 14 5.2C12.1 5.2 10.8 6.4 10.8 8.5V10.2H8.7V12.7H10.8V19H13.4Z"
          fill="#1877F2"
        />
      </svg>
    ),
  },
  whatsapp_chat: {
    tileBg: 'from-emerald-950 via-emerald-700 to-green-600',
    ringColor: 'border-white/85',
    renderSvg: () => (
      <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
        <path
          d="M12 3.8C7.5 3.8 3.9 7.3 3.9 11.7C3.9 13.2 4.3 14.6 5.1 15.8L4 20L8.4 18.9C9.5 19.5 10.7 19.8 12 19.8C16.5 19.8 20.1 16.2 20.1 11.8C20.1 7.4 16.5 3.8 12 3.8Z"
          fill="#25D366"
          stroke="#FFFFFF"
          strokeWidth="1.4"
        />
        <path
          d="M9.6 8.8C9.3 8.8 8.8 9.1 8.8 9.9C8.8 11.2 10 12.8 11.6 13.7C12.9 14.5 14.1 14.6 14.7 14.4C15.2 14.2 15.5 13.7 15.5 13.3L14.1 12.6L13.4 13.3C12.5 12.9 11.4 11.9 11 11L11.6 10.3L11 8.9C10.8 8.8 9.9 8.8 9.6 8.8Z"
          fill="#FFFFFF"
        />
      </svg>
    ),
  },
};

export default function ButtonEmblemBadge({
  variant,
  size = 'sm',
}: {
  variant: ButtonEmblemVariant;
  size?: 'sm' | 'md';
}) {
  const theme = EMBLEM_THEMES[variant];
  const boxClass = size === 'md' ? 'w-8 h-8 rounded-xl' : 'w-7 h-7 rounded-lg';

  return (
    <span
      aria-hidden="true"
      className={`relative inline-flex items-center justify-center shrink-0 overflow-hidden bg-gradient-to-br ${theme.tileBg} border ${theme.ringColor} shadow-[0_2px_6px_rgba(0,0,0,0.35)] ${boxClass}`}
    >
      {/* Top Glossy Specular Reflection */}
      <span className="pointer-events-none absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/30 to-transparent" />
      <span className="relative z-10 flex items-center justify-center">
        {theme.renderSvg()}
      </span>
    </span>
  );
}
