'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Music2, Pause, Play, Sparkles, Volume2, VolumeX, X } from 'lucide-react';

const FIRST_INTERACTION_STORAGE_KEY = 'cbc_luxury_hotel_song_played_v1';
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
    to: 60.5,
    line: '♪ Be alive… you are deeply special. Welcome to CBC Materials Kenya.',
  },
];

export default function LuxuryWelcomeSong({
  externalReplayTick = 0,
}: {
  externalReplayTick?: number;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const stopTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startedOnceRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showPlayerPill, setShowPlayerPill] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);

  const stopSongCleanly = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      audio.currentTime = 0;
    }
    if (stopTimeoutRef.current) {
      clearTimeout(stopTimeoutRef.current);
      stopTimeoutRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startOneMinuteLuxurySong = useCallback(
    async (markVisited = true) => {
      try {
        let audio = audioRef.current;
        if (!audio) {
          audio = new Audio('/audio/luxury-hotel-welcome.mp3');
          audio.preload = 'auto';
          audio.loop = false;
          audioRef.current = audio;

          audio.addEventListener('timeupdate', () => {
            if (!audio) return;
            const cur = Math.min(SONG_DURATION_SECONDS, audio.currentTime || 0);
            setElapsedSec(cur);
            if (cur >= SONG_DURATION_SECONDS) {
              stopSongCleanly();
              setShowPlayerPill(false);
            }
          });

          audio.addEventListener('ended', () => {
            setIsPlaying(false);
            setElapsedSec(SONG_DURATION_SECONDS);
            setTimeout(() => setShowPlayerPill(false), 1200);
          });
        }

        audio.currentTime = 0;
        audio.volume = 0.56;
        audio.muted = false;
        setIsMuted(false);
        setElapsedSec(0);

        await audio.play();
        setIsPlaying(true);
        setShowPlayerPill(true);

        if (markVisited) {
          try {
            localStorage.setItem(
              FIRST_INTERACTION_STORAGE_KEY,
              new Date().toISOString()
            );
          } catch {}
        }

        if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
        stopTimeoutRef.current = setTimeout(() => {
          stopSongCleanly();
          setShowPlayerPill(false);
        }, (SONG_DURATION_SECONDS + 0.5) * 1000);
      } catch {
        // Browser still waiting for an explicit user gesture; listener stays armed
        startedOnceRef.current = false;
      }
    },
    [stopSongCleanly]
  );

  // Start singing for 1 minute when a visitor interacts with the website for the VERY FIRST TIME
  // (or when arriving from a WhatsApp Status ad with ?autoplay_song=1)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    let shouldArmFirstTime = false;
    try {
      const params = new URLSearchParams(window.location.search);
      const forcedFromStatus = params.get('autoplay_song') === '1';
      const alreadyPlayed = localStorage.getItem(FIRST_INTERACTION_STORAGE_KEY);
      shouldArmFirstTime = forcedFromStatus || !alreadyPlayed;
    } catch {
      shouldArmFirstTime = true;
    }

    if (!shouldArmFirstTime) return;

    const handleFirstInteraction = () => {
      if (startedOnceRef.current) return;
      startedOnceRef.current = true;
      void startOneMinuteLuxurySong(true);
      cleanupListeners();
    };

    const events: Array<keyof WindowEventMap> = [
      'pointerdown',
      'click',
      'touchstart',
      'keydown',
    ];

    const cleanupListeners = () => {
      for (const ev of events) {
        window.removeEventListener(ev, handleFirstInteraction, { capture: true });
      }
    };

    for (const ev of events) {
      window.addEventListener(ev, handleFirstInteraction, {
        capture: true,
        passive: true,
      });
    }

    return () => {
      cleanupListeners();
    };
  }, [startOneMinuteLuxurySong]);

  // Allow manual replay from the top ribbon
  useEffect(() => {
    if (externalReplayTick > 0) {
      startedOnceRef.current = true;
      void startOneMinuteLuxurySong(true);
    }
  }, [externalReplayTick, startOneMinuteLuxurySong]);

  useEffect(() => {
    return () => {
      if (stopTimeoutRef.current) clearTimeout(stopTimeoutRef.current);
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  const togglePlayPause = () => {
    const audio = audioRef.current;
    if (!audio) {
      void startOneMinuteLuxurySong(true);
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

  const toggleMute = () => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.muted = !audio.muted;
    setIsMuted(audio.muted);
  };

  if (!showPlayerPill) return null;

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
            onClick={togglePlayPause}
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
            onClick={toggleMute}
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
            onClick={() => {
              stopSongCleanly();
              setShowPlayerPill(false);
            }}
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
