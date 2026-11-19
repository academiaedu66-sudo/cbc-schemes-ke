'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Heart,
  Lock,
  Music2,
  Pause,
  Play,
  Sparkles,
  Unlock,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';

export const COMPULSORY_WELCOME_SONG_DONE_KEY =
  'cbc_compulsory_welcome_song_done_v3';
const SONG_DURATION_SECONDS = 60;

const LYRIC_STANZAS: Array<{ from: number; to: number; line: string }> = [
  {
    from: 0,
    to: 12.5,
    line: '♪ Welcome… take a soft, gentle breath, and feel right at home…',
  },
  {
    from: 12.5,
    to: 25.0,
    line: '♪ You have stepped into a peaceful sanctuary of wisdom, beauty, and grace…',
  },
  {
    from: 25.0,
    to: 38.0,
    line: '♪ Every dream you carry matters here… every learner & teacher shining bright…',
  },
  {
    from: 38.0,
    to: 49.5,
    line: '♪ Walk softly through these pages… let curiosity bloom in your heart today…',
  },
  {
    from: 49.5,
    to: 61.0,
    line: '♪ Be alive… you are deeply special. Welcome to CBC Materials Kenya.',
  },
];

const EQUALIZER_BAR_HEIGHTS = [
  38, 64, 86, 52, 95, 70, 44, 88, 100, 66, 82, 48, 92, 60, 40,
];

export function isSearchCrawlerBot(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent || '';
  return /googlebot|bingbot|yandexbot|baiduspider|duckduckbot|slurp|applebot|facebookexternalhit|twitterbot|linkedinbot|whatsapp|chrome-lighthouse|pagespeed/i.test(
    ua
  );
}

type GateMode =
  | 'IDLE'
  | 'COMPULSORY_WAITING_GESTURE'
  | 'COMPULSORY_PLAYING'
  | 'COMPULSORY_UNLOCKING'
  | 'OPTIONAL_PILL';

export default function LuxuryWelcomeSong({
  externalReplayTick = 0,
}: {
  externalReplayTick?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const activePlaybackTimerRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const compulsoryActiveRef = useRef(false);
  const completedCompulsoryRef = useRef(false);
  const playInFlightRef = useRef(false);
  const maxReachedTimeRef = useRef(0);
  const wallClockPlayedSecRef = useRef(0);

  const [gateMode, setGateMode] = useState<GateMode>('IDLE');
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isAdminRoute, setIsAdminRoute] = useState(false);

  const clearTimers = useCallback(() => {
    if (activePlaybackTimerRef.current) {
      clearInterval(activePlaybackTimerRef.current);
      activePlaybackTimerRef.current = null;
    }
  }, []);

  const completeCompulsoryGate = useCallback(() => {
    if (completedCompulsoryRef.current) return;
    completedCompulsoryRef.current = true;
    compulsoryActiveRef.current = false;
    clearTimers();

    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }

    setIsPlaying(false);
    setElapsedSec(SONG_DURATION_SECONDS);

    try {
      localStorage.setItem(
        COMPULSORY_WELCOME_SONG_DONE_KEY,
        new Date().toISOString()
      );
    } catch {}

    if (typeof document !== 'undefined') {
      document.body.style.overflow = '';
    }
    if (typeof window !== 'undefined') {
      (
        window as unknown as { __cbcWelcomeSongCompletedAt?: number }
      ).__cbcWelcomeSongCompletedAt = Date.now();
      window.dispatchEvent(new CustomEvent('cbc-compulsory-song-completed'));
    }

    setGateMode('COMPULSORY_UNLOCKING');
    setTimeout(() => {
      setGateMode('IDLE');
    }, 650);
  }, [clearTimers]);

  const stopOptionalSong = useCallback(() => {
    clearTimers();
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    setIsPlaying(false);
    setGateMode('IDLE');
  }, [clearTimers]);

  const ensureAudioInstance = useCallback(() => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio('/audio/luxury-hotel-welcome.mp3');
      audio.preload = 'auto';
      audio.loop = false;
      audio.volume = 0.82;
      audio.muted = false;
      audioRef.current = audio;

      audio.addEventListener('timeupdate', () => {
        if (!audio) return;
        const cur = Math.min(SONG_DURATION_SECONDS, audio.currentTime || 0);
        if (cur > maxReachedTimeRef.current) {
          maxReachedTimeRef.current = cur;
        }
        setElapsedSec((prev) => (cur > prev || !compulsoryActiveRef.current ? cur : prev));

        if (cur >= SONG_DURATION_SECONDS - 0.35) {
          if (compulsoryActiveRef.current) {
            completeCompulsoryGate();
          } else {
            stopOptionalSong();
          }
        }
      });

      audio.addEventListener('seeking', () => {
        if (!audio || !compulsoryActiveRef.current) return;
        // Prevent skipping ahead during the compulsory 1-minute welcome song
        if (audio.currentTime > maxReachedTimeRef.current + 1.25) {
          audio.currentTime = maxReachedTimeRef.current;
        }
      });

      audio.addEventListener('ratechange', () => {
        if (!audio || !compulsoryActiveRef.current) return;
        if (audio.playbackRate !== 1) {
          audio.playbackRate = 1;
        }
      });

      audio.addEventListener('volumechange', () => {
        if (!audio || !compulsoryActiveRef.current) return;
        if (audio.muted) audio.muted = false;
        if (audio.volume < 0.7) audio.volume = 0.82;
      });

      audio.addEventListener('pause', () => {
        if (!audio) return;
        // Keep playing uninterrupted if paused prematurely during compulsory mode
        if (
          compulsoryActiveRef.current &&
          !completedCompulsoryRef.current &&
          audio.currentTime > 0 &&
          audio.currentTime < SONG_DURATION_SECONDS - 0.5 &&
          typeof document !== 'undefined' &&
          !document.hidden
        ) {
          audio.play().catch(() => {});
        }
      });

      audio.addEventListener('ended', () => {
        if (compulsoryActiveRef.current) {
          completeCompulsoryGate();
        } else {
          setIsPlaying(false);
          setElapsedSec(SONG_DURATION_SECONDS);
          setTimeout(() => setGateMode('IDLE'), 1000);
        }
      });
    }
    return audio;
  }, [completeCompulsoryGate, stopOptionalSong]);

  const startWallClockTicker = useCallback(
    (isCompulsory: boolean) => {
      clearTimers();
      activePlaybackTimerRef.current = setInterval(() => {
        const audio = audioRef.current;
        if (!audio || audio.paused) return;
        wallClockPlayedSecRef.current += 0.5;
        const effectiveSec = Math.min(
          SONG_DURATION_SECONDS,
          Math.max(audio.currentTime || 0, wallClockPlayedSecRef.current)
        );
        setElapsedSec(effectiveSec);

        if (effectiveSec >= SONG_DURATION_SECONDS) {
          if (isCompulsory) {
            completeCompulsoryGate();
          } else {
            stopOptionalSong();
          }
        }
      }, 500);
    },
    [clearTimers, completeCompulsoryGate, stopOptionalSong]
  );

  const attemptCompulsoryPlay = useCallback(
    async (fromUserGesture = false): Promise<boolean> => {
      if (completedCompulsoryRef.current) return true;
      const existing = audioRef.current;
      if (existing && !existing.paused && existing.currentTime > 0) {
        setIsPlaying(true);
        setGateMode('COMPULSORY_PLAYING');
        return true;
      }
      if (playInFlightRef.current && !fromUserGesture) return false;
      playInFlightRef.current = true;

      try {
        const audio = ensureAudioInstance();
        audio.volume = 0.85;
        audio.muted = false;
        audio.playbackRate = 1;
        setIsMuted(false);

        await audio.play();
        playInFlightRef.current = false;
        setIsPlaying(true);
        setGateMode('COMPULSORY_PLAYING');
        startWallClockTicker(true);
        return true;
      } catch {
        playInFlightRef.current = false;
        setIsPlaying(false);
        setGateMode('COMPULSORY_WAITING_GESTURE');
        return false;
      }
    },
    [ensureAudioInstance, startWallClockTicker]
  );

  const startOptionalReplay = useCallback(async () => {
    if (compulsoryActiveRef.current) {
      void attemptCompulsoryPlay();
      return;
    }
    try {
      const audio = ensureAudioInstance();
      maxReachedTimeRef.current = 0;
      wallClockPlayedSecRef.current = 0;
      audio.currentTime = 0;
      audio.volume = 0.75;
      audio.muted = false;
      setIsMuted(false);
      setElapsedSec(0);
      setGateMode('OPTIONAL_PILL');

      await audio.play();
      setIsPlaying(true);
      startWallClockTicker(false);
    } catch {
      setIsPlaying(false);
    }
  }, [attemptCompulsoryPlay, ensureAudioInstance, startWallClockTicker]);

  // MANDATORY 1-Minute Welcome Song EVERY TIME a visitor enters / opens the website!
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const path = window.location.pathname || '';
    if (path.startsWith('/admin') || path.startsWith('/mobile-admin')) {
      setIsAdminRoute(true);
      return;
    }
    if (isSearchCrawlerBot()) return;

    compulsoryActiveRef.current = true;
    completedCompulsoryRef.current = false;
    maxReachedTimeRef.current = 0;
    wallClockPlayedSecRef.current = 0;
    setElapsedSec(0);
    setGateMode('COMPULSORY_WAITING_GESTURE');

    // Lock background browsing & scrolling until the full 1-minute song finishes
    document.body.style.overflow = 'hidden';

    // Preload audio immediately
    ensureAudioInstance();

    // Valid browser user-activation events ONLY
    const activationEvents: Array<keyof WindowEventMap> = [
      'pointerdown',
      'touchstart',
      'mousedown',
      'click',
      'keydown',
    ];

    const removeGestureListeners = () => {
      for (const ev of activationEvents) {
        window.removeEventListener(ev, onFirstUserActivation, { capture: true });
      }
    };

    const onFirstUserActivation = (e: Event) => {
      if (
        e.type === 'keydown' &&
        e instanceof KeyboardEvent &&
        (e.key === ' ' ||
          e.key === 'ArrowDown' ||
          e.key === 'PageDown' ||
          e.key === 'Escape')
      ) {
        e.preventDefault();
      }
      if (!compulsoryActiveRef.current || completedCompulsoryRef.current) {
        removeGestureListeners();
        return;
      }
      void attemptCompulsoryPlay(true).then((started) => {
        if (started) {
          removeGestureListeners();
        }
      });
    };

    for (const ev of activationEvents) {
      window.addEventListener(ev, onFirstUserActivation, {
        capture: true,
        passive: false,
      });
    }

    // Attempt zero-click autoplay immediately on arrival; if browser awaits first touch,
    // listeners remain armed and trigger instantaneously on first interaction!
    void attemptCompulsoryPlay(false).then((startedImmediately) => {
      if (startedImmediately) {
        removeGestureListeners();
      }
    });

    // Resume automatically when returning to visible tab
    const onVisibilityChange = () => {
      if (
        !document.hidden &&
        compulsoryActiveRef.current &&
        !completedCompulsoryRef.current
      ) {
        void attemptCompulsoryPlay();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      removeGestureListeners();
      document.removeEventListener('visibilitychange', onVisibilityChange);
      if (!completedCompulsoryRef.current) {
        document.body.style.overflow = '';
      }
    };
  }, [attemptCompulsoryPlay, ensureAudioInstance]);

  // Listen for manual replay from the top ribbon (either prop or global custom event)
  useEffect(() => {
    if (externalReplayTick > 0) {
      void startOptionalReplay();
    }
  }, [externalReplayTick, startOptionalReplay]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onCustomReplay = () => {
      void startOptionalReplay();
    };
    window.addEventListener('cbc-replay-welcome-song', onCustomReplay);
    return () => {
      window.removeEventListener('cbc-replay-welcome-song', onCustomReplay);
    };
  }, [startOptionalReplay]);

  useEffect(() => {
    return () => {
      clearTimers();
      if (audioRef.current) {
        audioRef.current.pause();
      }
      if (typeof document !== 'undefined') {
        document.body.style.overflow = '';
      }
    };
  }, [clearTimers]);

  const toggleOptionalPlayPause = () => {
    if (compulsoryActiveRef.current) return;
    const audio = audioRef.current;
    if (!audio) {
      void startOptionalReplay();
      return;
    }
    if (audio.paused) {
      void audio.play();
      setIsPlaying(true);
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  const toggleOptionalMute = () => {
    if (compulsoryActiveRef.current) return;
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  if (isAdminRoute || gateMode === 'IDLE') return null;

  const activeLyric =
    LYRIC_STANZAS.find((s) => elapsedSec >= s.from && elapsedSec < s.to)?.line ||
    LYRIC_STANZAS[0].line;

  const pct = Math.min(100, (elapsedSec / SONG_DURATION_SECONDS) * 100);
  const remSec = Math.max(0, Math.ceil(SONG_DURATION_SECONDS - elapsedSec));
  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  // ============================================================================
  // COMPULSORY FULL-SCREEN 1-MINUTE 5-STAR HOTEL CONCIERGE LOUNGE GATE
  // ============================================================================
  if (
    gateMode === 'COMPULSORY_WAITING_GESTURE' ||
    gateMode === 'COMPULSORY_PLAYING' ||
    gateMode === 'COMPULSORY_UNLOCKING'
  ) {
    const isUnlocking = gateMode === 'COMPULSORY_UNLOCKING';
    const waitingForFirstTouch =
      gateMode === 'COMPULSORY_WAITING_GESTURE' && !isPlaying;

    return (
      <div
        role="dialog"
        aria-modal="true"
        aria-label="5-Star Concierge Compulsory 1-Minute Welcome Song"
        onPointerDown={() => {
          if (waitingForFirstTouch) void attemptCompulsoryPlay(true);
        }}
        onClick={() => {
          if (waitingForFirstTouch) void attemptCompulsoryPlay(true);
        }}
        className={`fixed inset-0 z-[130] flex items-center justify-center px-5 py-8 overflow-hidden select-none transition-all duration-700 ${
          isUnlocking
            ? 'opacity-0 scale-105 pointer-events-none'
            : 'opacity-100 scale-100'
        } ${waitingForFirstTouch ? 'cursor-pointer' : 'cursor-default'}`}
        style={{
          background:
            'radial-gradient(circle at 50% 28%, #065f46 0%, #022c22 48%, #020617 100%)',
        }}
      >
        {/* Luxury Ambient Gold & Emerald Orbs */}
        <div className="absolute -top-28 -left-24 w-96 h-96 rounded-full bg-amber-400/20 blur-3xl animate-welcome-float pointer-events-none" />
        <div
          className="absolute -bottom-32 -right-24 w-[28rem] h-[28rem] rounded-full bg-emerald-400/20 blur-3xl animate-welcome-float pointer-events-none"
          style={{ animationDelay: '1.4s' }}
        />
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-amber-300/10 blur-3xl animate-pulse pointer-events-none" />

        {/* Far Top-Left Official Crest Logo (Completely Clear of Center Writings!) */}
        <div className="absolute top-4 left-4 sm:top-6 sm:left-6 z-20 flex items-center gap-2.5 pointer-events-none">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/images/cbcmaterials-logo.jpg"
            alt="CBCMATERIALS.SHOP Official Crest Logo"
            className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white border-2 border-amber-300 shadow-[0_0_25px_rgba(251,191,36,0.5)] object-cover shrink-0"
          />
          <div className="hidden sm:inline-flex items-center gap-1 text-sm font-black uppercase tracking-tight">
            <span className="text-amber-300">CBC</span>
            <span className="text-emerald-300">MATERIALS</span>
            <span className="px-1.5 py-0.5 rounded-md bg-rose-600 text-white text-xs border border-amber-200/60">
              .SHOP
            </span>
          </div>
        </div>

        {/* Center Luxury Concierge Lounge Card */}
        <div className="relative max-w-2xl w-full rounded-3xl bg-slate-950/75 border border-amber-300/40 shadow-[0_25px_90px_rgba(0,0,0,0.75)] backdrop-blur-xl px-6 py-8 sm:px-10 sm:py-10 text-center space-y-6 mt-12 sm:mt-0">
          {/* Top 5-Star Concierge Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-400/15 border border-amber-300/40 shadow-md">
            <Heart className="w-4 h-4 text-rose-400 fill-rose-400 animate-welcome-heartbeat shrink-0" />
            <span className="text-[11px] sm:text-xs font-black uppercase tracking-[0.2em] text-amber-200">
              5-Star Concierge Welcome Lounge
            </span>
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse shrink-0" />
          </div>

          {/* Signature Centerpiece Statement */}
          <div className="space-y-2">
            <h2 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight">
              <span className="block bg-gradient-to-r from-white via-amber-200 to-emerald-300 bg-clip-text text-transparent animate-welcome-shimmer">
                BE ALIVE,
              </span>
              <span className="block mt-1 bg-gradient-to-r from-emerald-300 via-amber-300 to-white bg-clip-text text-transparent animate-welcome-shimmer">
                YOU ARE SPECIAL
              </span>
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100/85 font-medium max-w-lg mx-auto">
              Welcome to <strong className="text-amber-300">CBCMATERIALS.SHOP</strong> — Please enjoy our soft 1-minute
              5-Star Welcome Song before browsing Grade 1–12 resources.
            </p>
          </div>

          {/* Animated 15-Bar Golden Soundwave Equalizer */}
          <div
            aria-hidden="true"
            className="flex items-end justify-center gap-1.5 h-12 py-1"
          >
            {EQUALIZER_BAR_HEIGHTS.map((baseH, idx) => {
              const dynamicHeight = isPlaying
                ? Math.max(
                    22,
                    Math.min(
                      100,
                      Math.round(
                        baseH *
                          (0.55 +
                            0.45 *
                              Math.abs(
                                Math.sin(elapsedSec * 3.4 + idx * 0.65)
                              ))
                      )
                    )
                  )
                : Math.round(baseH * 0.35);
              return (
                <span
                  key={idx}
                  className={`w-1.5 sm:w-2 rounded-full transition-all duration-200 ${
                    isPlaying
                      ? 'bg-gradient-to-t from-emerald-400 via-amber-300 to-amber-100 shadow-[0_0_10px_rgba(251,191,36,0.5)]'
                      : 'bg-amber-300/45 animate-pulse'
                  }`}
                  style={{
                    height: `${dynamicHeight}%`,
                    animationDelay: `${idx * 90}ms`,
                  }}
                />
              );
            })}
          </div>

          {/* Synchronized Glowing Lyric Box */}
          <div className="rounded-2xl bg-white/5 border border-emerald-300/25 px-5 py-4 min-h-[4.5rem] flex items-center justify-center">
            <p className="text-sm sm:text-lg font-semibold italic text-amber-100 leading-relaxed">
              {isUnlocking
                ? '✨ Thank you for listening — Welcome inside CBCMaterials Kenya!'
                : activeLyric}
            </p>
          </div>

          {/* Immediate Start CTA (if browser requires initial touch) OR Compulsory Countdown Progress */}
          {waitingForFirstTouch ? (
            <div className="space-y-3 pt-1">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  void attemptCompulsoryPlay(true);
                }}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-300 text-slate-950 font-black text-sm sm:text-base tracking-wide shadow-[0_0_35px_rgba(251,191,36,0.55)] hover:brightness-105 active:scale-[0.99] transition cursor-pointer animate-bounce"
              >
                <Volume2 className="w-5 h-5 shrink-0" />
                <span>Tap Anywhere to Start Your 1-Minute Welcome Song</span>
              </button>
              <p className="text-[11px] sm:text-xs font-semibold text-amber-200/85">
                Auto-plays on your very first touch • Compulsory 1:00 welcome
                experience before browsing
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-1">
              <div className="w-full h-3 rounded-full bg-white/15 overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 transition-all duration-300"
                  style={{ width: `${pct}%` }}
                />
              </div>

              <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-bold">
                <span className="inline-flex items-center gap-1.5 text-amber-200">
                  {isUnlocking ? (
                    <>
                      <Unlock className="w-3.5 h-3.5 text-emerald-300" />
                      <span>Welcome Song Complete — Entering Website…</span>
                    </>
                  ) : (
                    <>
                      <Lock className="w-3.5 h-3.5 text-amber-300" />
                      <span>
                        Compulsory Welcome Song • Browsing unlocks in {remSec}s
                      </span>
                    </>
                  )}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-white/10 text-emerald-200 tabular-nums">
                  {fmtTime(elapsedSec)} / 1:00
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // ============================================================================
  // OPTIONAL FLOATING PLAYER PILL (For Returning Visitors Clicking "1-Min Song")
  // ============================================================================
  return (
    <div
      role="region"
      aria-label="5-Star Concierge Welcome Song Player"
      className="fixed bottom-16 left-3 sm:left-5 z-[90] max-w-xs sm:max-w-sm w-[calc(100vw-1.5rem)] rounded-2xl bg-slate-950/95 text-white border border-amber-400/50 shadow-2xl backdrop-blur-md p-3.5 transition-all"
    >
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-300 to-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs">
            <Music2 className="w-3.5 h-3.5" />
          </span>
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-300">
              <Sparkles className="w-3 h-3 shrink-0" />
              <span>5-Star Concierge Welcome • {remSec}s left</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={toggleOptionalPlayPause}
            title={isPlaying ? 'Pause welcome song' : 'Resume welcome song'}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 transition cursor-pointer"
          >
            {isPlaying ? (
              <Pause className="w-3.5 h-3.5" />
            ) : (
              <Play className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={toggleOptionalMute}
            title={isMuted ? 'Unmute' : 'Mute'}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
          >
            {isMuted ? (
              <VolumeX className="w-3.5 h-3.5 text-rose-300" />
            ) : (
              <Volume2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={stopOptionalSong}
            title="Dismiss song"
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-slate-300 transition cursor-pointer"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <p className="text-[11px] text-emerald-100/95 italic leading-snug line-clamp-2 mb-2">
        {activeLyric}
      </p>

      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 rounded-full bg-white/15 overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-amber-300 via-emerald-300 to-teal-300 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <span className="text-[10px] font-bold text-amber-200/90 tabular-nums">
          {fmtTime(elapsedSec)} / 1:00
        </span>
      </div>
    </div>
  );
}
