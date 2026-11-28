'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, SkipForward, RotateCcw } from 'lucide-react';

const KENYA_YOUTUBE_VIDEO_ID = 'F2Ik_VqpObM';
const EAC_ANTHEM_SRC = '/audio/east-africa-anthem.ogg';

interface YTPlayerInstance {
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  mute: () => void;
  unMute: () => void;
  destroy: () => void;
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        element: HTMLElement | string,
        options: {
          videoId: string;
          playerVars?: Record<string, number | string>;
          events?: {
            onReady?: (e: { target: YTPlayerInstance }) => void;
            onStateChange?: (e: { data: number }) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState?: { ENDED: number; PLAYING: number; PAUSED: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

export default function ContestAnthemPlayer({ autoStart = true }: { autoStart?: boolean }) {
  const [trackIndex, setTrackIndex] = useState<0 | 1>(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [muted, setMuted] = useState(false);

  const ytContainerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<YTPlayerInstance | null>(null);
  const eacAudioRef = useRef<HTMLAudioElement | null>(null);
  const trackIndexRef = useRef<0 | 1>(0);

  useEffect(() => {
    trackIndexRef.current = trackIndex;
  }, [trackIndex]);

  const startEastAfricaAnthem = useCallback(() => {
    try {
      ytPlayerRef.current?.pauseVideo();
    } catch {}
    setTrackIndex(1);
    const el = eacAudioRef.current;
    if (!el) return;
    el.currentTime = 0;
    el.play()
      .then(() => setIsPlaying(true))
      .catch(() => setIsPlaying(false));
  }, []);

  const startKenyaAnthem = useCallback(() => {
    const el = eacAudioRef.current;
    if (el) {
      el.pause();
      el.currentTime = 0;
    }
    setTrackIndex(0);
    try {
      ytPlayerRef.current?.seekTo(0, true);
      ytPlayerRef.current?.playVideo();
      setIsPlaying(true);
    } catch {}
  }, []);

  useEffect(() => {
    let destroyed = false;

    const initPlayer = () => {
      if (destroyed || !ytContainerRef.current || !window.YT?.Player) return;
      ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
        videoId: KENYA_YOUTUBE_VIDEO_ID,
        playerVars: {
          autoplay: autoStart ? 1 : 0,
          rel: 0,
          modestbranding: 1,
          playsinline: 1,
        },
        events: {
          onReady: (e) => {
            if (autoStart) {
              try {
                e.target.playVideo();
                setIsPlaying(true);
              } catch {}
            }
          },
          onStateChange: (e) => {
            // YT.PlayerState: 1 = PLAYING, 2 = PAUSED, 0 = ENDED
            if (e.data === 1) {
              setIsPlaying(true);
            } else if (e.data === 2) {
              if (trackIndexRef.current === 0) setIsPlaying(false);
            } else if (e.data === 0) {
              // Kenya National Anthem ended -> immediately start East African Community Anthem
              startEastAfricaAnthem();
            }
          },
        },
      });
    };

    if (window.YT?.Player) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
      if (!document.querySelector('script[src="https://www.youtube.com/iframe_api"]')) {
        const tag = document.createElement('script');
        tag.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(tag);
      }
    }

    return () => {
      destroyed = true;
      try {
        ytPlayerRef.current?.destroy();
      } catch {}
    };
  }, [autoStart, startEastAfricaAnthem]);

  useEffect(() => {
    try {
      if (muted) ytPlayerRef.current?.mute();
      else ytPlayerRef.current?.unMute();
    } catch {}
    if (eacAudioRef.current) {
      eacAudioRef.current.muted = muted;
    }
  }, [muted]);

  const togglePlayPause = () => {
    if (trackIndex === 0) {
      try {
        if (isPlaying) {
          ytPlayerRef.current?.pauseVideo();
          setIsPlaying(false);
        } else {
          ytPlayerRef.current?.playVideo();
          setIsPlaying(true);
        }
      } catch {}
    } else {
      const el = eacAudioRef.current;
      if (!el) return;
      if (el.paused) {
        el.play().then(() => setIsPlaying(true)).catch(() => {});
      } else {
        el.pause();
        setIsPlaying(false);
      }
    }
  };

  return (
    <div className="mb-5 rounded-2xl border-2 border-emerald-400 bg-gradient-to-r from-emerald-950 via-slate-900 to-blue-950 text-white p-4 shadow-md">
      <audio
        ref={eacAudioRef}
        src={EAC_ANTHEM_SRC}
        preload="auto"
        onPlay={() => setIsPlaying(true)}
        onPause={() => {
          if (trackIndexRef.current === 1) setIsPlaying(false);
        }}
        onEnded={() => setIsPlaying(false)}
      />

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="w-full md:w-56 shrink-0 overflow-hidden rounded-xl border border-white/20 bg-black">
          <div className={trackIndex === 0 ? 'block aspect-video w-full' : 'hidden'}>
            <div ref={ytContainerRef} className="w-full h-full" />
          </div>
          {trackIndex === 1 && (
            <div className="aspect-video w-full flex flex-col items-center justify-center bg-blue-950 text-center p-2">
              <div className="text-2xl">🌍</div>
              <div className="text-xs font-extrabold text-emerald-300 mt-1">
                East African Community Anthem
              </div>
            </div>
          )}
        </div>

        <div className="flex-1 space-y-2">
          <div>
            <div className="text-[11px] font-black uppercase tracking-wider text-emerald-300">
              {isPlaying
                ? `🎵 Now Playing (${trackIndex + 1}/2)`
                : '🎼 Contest Ceremonial Anthems (1. Kenya → 2. East Africa)'}
            </div>
            <div className="text-sm sm:text-base font-extrabold text-white mt-0.5">
              {trackIndex === 0
                ? '🇰🇪 Kenya National Anthem (Ee Mungu Nguvu Yetu)'
                : '🌍 East African Community Anthem (Jumuiya Yetu)'}
            </div>
            <p className="text-xs text-slate-200 italic mt-1 leading-snug">
              {trackIndex === 0
                ? 'Ee Mungu nguvu yetu, Ilete baraka kwetu; Haki iwe ngao na mlinzi, Natukae na undugu, Amani na uhuru, Raha tupate na ustawi.'
                : 'Ee Mungu twaomba ulinde, Jumuiya Afrika Mashariki; Tuwezeshe kuishi kwa amani, Tutimize na malengo yetu.'}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => (trackIndex === 0 ? startEastAfricaAnthem() : startKenyaAnthem())}
              className="bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
            >
              <SkipForward className="w-3.5 h-3.5" />
              {trackIndex === 0 ? 'East Africa Anthem' : 'Kenya Anthem'}
            </button>
            <button
              type="button"
              onClick={startKenyaAnthem}
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
    </div>
  );
}
