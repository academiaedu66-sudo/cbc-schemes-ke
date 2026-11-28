'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

interface NoteStep {
  freq: number;
  beats: number;
}

// Ceremonial melody sequences (Hz, beats at ~84 BPM)
// 1. Kenya National Anthem ("Ee Mungu Nguvu Yetu" — Verse 1 phrase)
const KENYA_ANTHEM_NOTES: NoteStep[] = [
  { freq: 293.66, beats: 1 }, // D4
  { freq: 329.63, beats: 1 }, // E4
  { freq: 392.0, beats: 1.5 }, // G4
  { freq: 392.0, beats: 0.5 }, // G4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 392.0, beats: 1 }, // G4
  { freq: 329.63, beats: 2 }, // E4
  { freq: 293.66, beats: 1 }, // D4
  { freq: 329.63, beats: 1 }, // E4
  { freq: 392.0, beats: 1 }, // G4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 493.88, beats: 2 }, // B4
  { freq: 440.0, beats: 2 }, // A4
  { freq: 587.33, beats: 1.5 }, // D5
  { freq: 523.25, beats: 0.5 }, // C5
  { freq: 493.88, beats: 1 }, // B4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 392.0, beats: 1.5 }, // G4
  { freq: 329.63, beats: 0.5 }, // E4
  { freq: 293.66, beats: 1 }, // D4
  { freq: 329.63, beats: 1 }, // E4
  { freq: 392.0, beats: 2 }, // G4
  { freq: 392.0, beats: 2 }, // G4
];

// 2. East African Community Anthem ("Jumuiya Yetu" — Chorus phrase)
const EAC_ANTHEM_NOTES: NoteStep[] = [
  { freq: 349.23, beats: 1 }, // F4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 523.25, beats: 1.5 }, // C5
  { freq: 523.25, beats: 0.5 }, // C5
  { freq: 587.33, beats: 1 }, // D5
  { freq: 523.25, beats: 1 }, // C5
  { freq: 440.0, beats: 2 }, // A4
  { freq: 466.16, beats: 1 }, // Bb4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 392.0, beats: 1 }, // G4
  { freq: 349.23, beats: 1 }, // F4
  { freq: 392.0, beats: 2 }, // G4
  { freq: 440.0, beats: 2 }, // A4
  { freq: 523.25, beats: 1.5 }, // C5
  { freq: 466.16, beats: 0.5 }, // Bb4
  { freq: 440.0, beats: 1 }, // A4
  { freq: 392.0, beats: 1 }, // G4
  { freq: 349.23, beats: 2 }, // F4
  { freq: 349.23, beats: 2 }, // F4
];

const ANTHEMS = [
  {
    id: 'kenya',
    title: '🇰🇪 Kenya National Anthem (Ee Mungu Nguvu Yetu)',
    lyrics:
      'Ee Mungu nguvu yetu, Ilete baraka kwetu; Haki iwe ngao na mlinzi, Natukae na undugu, Amani na uhuru, Raha tupate na ustawi.',
    notes: KENYA_ANTHEM_NOTES,
  },
  {
    id: 'eac',
    title: '🌍 East African Community Anthem (Jumuiya Yetu)',
    lyrics:
      'Ee Mungu twaomba ulinde, Jumuiya Afrika Mashariki; Tuwezeshe kuishi kwa amani, Tutimize na malengo yetu.',
    notes: EAC_ANTHEM_NOTES,
  },
] as const;

export default function ContestAnthemPlayer({ autoStart = true }: { autoStart?: boolean }) {
  const [trackIndex, setTrackIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [needsTap, setNeedsTap] = useState(false);

  const ctxRef = useRef<AudioContext | null>(null);
  const timersRef = useRef<number[]>([]);
  const mutedRef = useRef(false);
  const playAnthemRef = useRef<(index: 0 | 1) => Promise<void>>(async () => {});

  useEffect(() => {
    mutedRef.current = muted;
  }, [muted]);

  const stopPlayback = useCallback(() => {
    for (const id of timersRef.current) {
      window.clearTimeout(id);
    }
    timersRef.current = [];
    if (ctxRef.current) {
      try {
        ctxRef.current.close();
      } catch {}
      ctxRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const playAnthem = useCallback(
    async (index: 0 | 1) => {
      stopPlayback();
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;

      const ctx = new AudioCtx();
      ctxRef.current = ctx;

      if (ctx.state === 'suspended') {
        try {
          await ctx.resume();
        } catch {}
      }

      if (ctx.state === 'suspended') {
        setNeedsTap(true);
        setIsPlaying(false);
        return;
      }

      setNeedsTap(false);
      setTrackIndex(index);
      setIsPlaying(true);

      const anthem = ANTHEMS[index];
      const beatSec = 0.56;
      let cursor = ctx.currentTime + 0.05;

      const master = ctx.createGain();
      master.gain.value = mutedRef.current ? 0 : 0.22;
      master.connect(ctx.destination);

      for (const step of anthem.notes) {
        const dur = step.beats * beatSec;
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const env = ctx.createGain();

        osc1.type = 'triangle';
        osc1.frequency.setValueAtTime(step.freq, cursor);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(step.freq * 2, cursor);

        env.gain.setValueAtTime(0.001, cursor);
        env.gain.linearRampToValueAtTime(0.8, cursor + 0.04);
        env.gain.exponentialRampToValueAtTime(0.001, cursor + dur * 0.94);

        osc1.connect(env);
        osc2.connect(env);
        env.connect(master);

        osc1.start(cursor);
        osc2.start(cursor);
        osc1.stop(cursor + dur);
        osc2.stop(cursor + dur);

        cursor += dur;
      }

      const totalMs = Math.ceil((cursor - ctx.currentTime) * 1000) + 250;
      const nextTimer = window.setTimeout(() => {
        if (index === 0) {
          // Immediately transition to East African Community Anthem
          void playAnthemRef.current(1);
        } else {
          setIsPlaying(false);
        }
      }, totalMs);
      timersRef.current.push(nextTimer);
    },
    [stopPlayback]
  );

  useEffect(() => {
    playAnthemRef.current = playAnthem;
  }, [playAnthem]);

  // Auto-start Kenya National Anthem immediately on mount, then East Africa Anthem
  useEffect(() => {
    if (!autoStart) return;
    const startTimer = window.setTimeout(() => {
      void playAnthem(0);
    }, 120);

    const unlockOnGesture = () => {
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        void playAnthem(trackIndex);
      }
    };
    window.addEventListener('pointerdown', unlockOnGesture, { once: true });
    window.addEventListener('keydown', unlockOnGesture, { once: true });

    return () => {
      window.clearTimeout(startTimer);
      window.removeEventListener('pointerdown', unlockOnGesture);
      window.removeEventListener('keydown', unlockOnGesture);
      stopPlayback();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  const current = ANTHEMS[trackIndex];

  return (
    <div className="mb-5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white p-4 shadow-md">
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
          {isPlaying ? (
            <button
              type="button"
              onClick={stopPlayback}
              className="bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Pause className="w-3.5 h-3.5" /> Pause
            </button>
          ) : (
            <button
              type="button"
              onClick={() => void playAnthem(trackIndex)}
              className="bg-emerald-400 hover:bg-emerald-300 text-slate-950 text-xs font-black px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5" /> Play
            </button>
          )}
          <button
            type="button"
            onClick={() => void playAnthem(trackIndex === 0 ? 1 : 0)}
            className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
          >
            <SkipForward className="w-3.5 h-3.5" /> {trackIndex === 0 ? 'East Africa Anthem' : 'Kenya Anthem'}
          </button>
          <button
            type="button"
            onClick={() => void playAnthem(0)}
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
