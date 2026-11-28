'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

const ANTHEMS = [
  {
    id: 'kenya',
    title: '🇰🇪 Kenya National Anthem (Ee Mungu Nguvu Yetu)',
    src: '/audio/kenya-national-anthem.ogg',
    lyrics:
      'Ee Mungu nguvu yetu, Ilete baraka kwetu; Haki iwe ngao na mlinzi, Natukae na undugu, Amani na uhuru, Raha tupate na ustawi.',
  },
  {
    id: 'eac',
    title: '🌍 East African Community Anthem (Jumuiya Yetu)',
    src: '/audio/east-africa-anthem.ogg',
    lyrics:
      'Ee Mungu twaomba ulinde, Jumuiya Afrika Mashariki; Tuwezeshe kuishi kwa amani, Tutimize na malengo yetu.',
  },
] as const;

export default function ContestAnthemPlayer({ autoStart = true }: { autoStart?: boolean }) {
  const [trackIndex, setTrackIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);

  const playTrack = useCallback((index: 0 | 1) => {
    setTrackIndex(index);
    const el = audioRef.current;
    if (!el) return;
    el.src = ANTHEMS[index].src;
    el.currentTime = 0;
    const promise = el.play();
    if (promise && typeof promise.then === 'function') {
      promise
        .then(() => {
          setIsPlaying(true);
          setNeedsTap(false);
        })
        .catch(() => {
          setIsPlaying(false);
          setNeedsTap(true);
        });
    }
  }, []);

  // Auto-start Kenya National Anthem immediately on mount
  useEffect(() => {
    if (!autoStart) return;
    const t = window.setTimeout(() => {
      playTrack(0);
    }, 80);

    const unlockOnGesture = () => {
      const el = audioRef.current;
      if (el && el.paused) {
        el.play()
          .then(() => {
            setIsPlaying(true);
            setNeedsTap(false);
          })
          .catch(() => {});
      }
    };
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    window.addEventListener('keydown', unlockOnGesture, { once: true });

    return () => {
      window.clearTimeout(t);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
    };
  }, [autoStart, playTrack]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlayPause = () => {
    const el = audioRef.current;
    if (!el) return;
    if (el.paused) {
      el.play()
        .then(() => {
          setIsPlaying(true);
          setNeedsTap(false);
        })
        .catch(() => setNeedsTap(true));
    } else {
      el.pause();
      setIsPlaying(false);
    }
  };

  const handleEnded = () => {
    if (trackIndex === 0) {
      // Immediately play East African Community Anthem after Kenya National Anthem finishes
      playTrack(1);
    } else {
      setIsPlaying(false);
    }
  };

  const current = ANTHEMS[trackIndex];

  return (
    <div className="mb-5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white p-4 shadow-md">
      <audio
        ref={audioRef}
        src={current.src}
        preload="auto"
        onEnded={handleEnded}
        onPlay={() => {
          setIsPlaying(true);
          setNeedsTap(false);
        }}
        onPause={() => setIsPlaying(false)}
      />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
            {isPlaying
              ? `🎵 Now Playing (${trackIndex + 1}/2)`
              : needsTap
                ? '🔊 Tap Play to Start National Anthems'
                : '🎼 Contest Ceremonial Anthems (1. Kenya → 2. East Africa)'}
          </div>
          <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">{current.title}</div>
          <p className="text-xs text-slate-200 italic mt-1 leading-snug">{current.lyrics}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={togglePlayPause}
            className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            type="button"
            onClick={() => playTrack(trackIndex === 0 ? 1 : 0)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" /> {trackIndex === 0 ? 'East Africa Anthem' : 'Kenya Anthem'}
          </button>
          <button
            type="button"
            onClick={() => playTrack(0)}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2.5 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            title="Restart from Kenya National Anthem"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setMuted((m) => !m)}
            className="bg-slate-700 hover:bg-slate-600 text-white text-xs font-bold px-2.5 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            title={muted ? 'Unmute' : 'Mute'}
          >
            {muted ? <VolumeX className="w-3.5 h-3.5 text-red-300" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-300" />}
          </button>
        </div>
      </div>
    </div>
  );
}
