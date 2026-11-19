'use client';

import React, { useEffect, useRef, useState } from 'react';
import { ExternalLink, Music2, Pause, Play, Sparkles, Volume2, VolumeX } from 'lucide-react';

export default function StatusAdClient({
  buttonLabel,
  headline,
  subheadline,
  priceBadge,
  posterImageUrl,
  clickableUrl,
  softSongUrl,
  whatsappLocal,
}: {
  buttonLabel: string;
  headline: string;
  subheadline: string;
  priceBadge: string;
  posterImageUrl: string;
  clickableUrl: string;
  softSongUrl: string;
  whatsappLocal: string;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  useEffect(() => {
    const audio = new Audio(softSongUrl);
    audio.preload = 'auto';
    audio.volume = 0.6;
    audioRef.current = audio;

    const onEnd = () => setPlaying(false);
    audio.addEventListener('ended', onEnd);

    // Attempt immediate play; if browser requires tap, start on first tap anywhere
    audio
      .play()
      .then(() => setPlaying(true))
      .catch(() => {
        const unlock = () => {
          audio
            .play()
            .then(() => setPlaying(true))
            .catch(() => {});
          window.removeEventListener('pointerdown', unlock, true);
          window.removeEventListener('touchstart', unlock, true);
        };
        window.addEventListener('pointerdown', unlock, true);
        window.addEventListener('touchstart', unlock, true);
      });

    return () => {
      audio.removeEventListener('ended', onEnd);
      audio.pause();
    };
  }, [softSongUrl]);

  const togglePlay = () => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      void a.play();
      setPlaying(true);
    } else {
      a.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    const a = audioRef.current;
    if (!a) return;
    a.muted = !a.muted;
    setMuted(a.muted);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-emerald-950 via-slate-950 to-slate-900 text-white flex flex-col items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-slate-900/90 border-2 border-amber-400/70 rounded-3xl overflow-hidden shadow-2xl">
        {/* Top Musical Bar */}
        <div className="bg-slate-950/90 px-4 py-3 flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-amber-300">
            <Music2 className="w-4 h-4 animate-pulse" />
            <span>{playing ? 'Playing Soft Lounge Song…' : 'Tap to Hear Soft Song'}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={togglePlay}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-amber-200 cursor-pointer"
            >
              {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
            </button>
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 cursor-pointer"
            >
              {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Auto-Generated Status Poster Image (Clickable) */}
        <a href={clickableUrl} className="block relative group">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={posterImageUrl}
            alt={buttonLabel}
            className="w-full h-auto object-cover"
          />
        </a>

        {/* Details & Clickable CTA */}
        <div className="p-5 space-y-3.5 text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-[11px] font-black uppercase">
            <Sparkles className="w-3.5 h-3.5" />
            {priceBadge}
          </div>
          <h1 className="text-lg font-black leading-snug text-white">{headline}</h1>
          <p className="text-xs text-emerald-100/90">{subheadline}</p>

          <a
            href={clickableUrl}
            className="w-full bg-gradient-to-r from-emerald-500 to-teal-400 hover:from-emerald-400 hover:to-teal-300 text-slate-950 font-black text-sm uppercase py-3.5 px-5 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition"
          >
            <span>OPEN {buttonLabel}</span>
            <ExternalLink className="w-4 h-4 shrink-0" />
          </a>

          <p className="text-[11px] text-slate-400 font-semibold">
            WhatsApp &amp; M-Pesa Express: {whatsappLocal} • www.cbcmaterials.shop
          </p>
        </div>
      </div>
    </div>
  );
}
