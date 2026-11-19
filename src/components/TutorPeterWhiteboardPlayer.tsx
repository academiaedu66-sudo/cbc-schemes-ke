'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import {
  Check,
  CheckCircle2,
  Copy,
  Download,
  ExternalLink,
  FileText,
  Loader2,
  Play,
  Share2,
  Sparkles,
  Square,
  UploadCloud,
  Video,
} from 'lucide-react';
import {
  buildTutorPeterWhiteboardLesson,
  type MaterialVideoInput,
  type WhiteboardLessonPlan,
} from '@/lib/tutor-peter-videos';

function wrapCanvasLines(
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  maxLines = 2
): string[] {
  const words = (text || '').split(/\s+/);
  const lines: string[] = [];
  let current = '';

  for (const w of words) {
    const test = current ? `${current} ${w}` : w;
    if (ctx.measureText(test).width <= maxWidth) {
      current = test;
    } else {
      if (current) lines.push(current);
      current = w;
      if (lines.length >= maxLines - 1) break;
    }
  }
  if (current && lines.length < maxLines) {
    lines.push(current);
  }
  return lines;
}

export function drawTutorPeterWhiteboardFrame(
  ctx: CanvasRenderingContext2D,
  studioImg: HTMLImageElement,
  lesson: WhiteboardLessonPlan,
  elapsedSec: number
) {
  const W = ctx.canvas.width; // 1280
  const H = ctx.canvas.height; // 720
  const dur = lesson.durationSeconds; // 36s

  // 1. Draw clean studio background with Tutor Peter on left & blank silver-framed whiteboard on right
  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(studioImg, 0, 0, W, H);

  // Subtle live presenter badge + animated voice waveform on bottom-left over Tutor Peter's podium area
  ctx.save();
  ctx.fillStyle = 'rgba(2, 44, 34, 0.92)';
  ctx.beginPath();
  ctx.roundRect(24, H - 96, 305, 72, 16);
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.stroke();

  // Live Red Dot
  ctx.fillStyle = '#ef4444';
  ctx.beginPath();
  ctx.arc(46, H - 70, 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = '#fde68a';
  ctx.font = '900 17px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('TUTOR PETER • LIVE CLASS', 60, H - 64);

  ctx.fillStyle = '#d1fae5';
  ctx.font = '700 13px sans-serif';
  ctx.fillText('www.cbcmaterials.shop', 44, H - 40);

  // Speaking audio wave bars on badge right
  for (let i = 0; i < 6; i++) {
    const bh = 8 + 18 * Math.abs(Math.sin(elapsedSec * 7.5 + i * 0.9));
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(275 + i * 7, H - 56 - bh / 2, 4, bh);
  }
  ctx.restore();

  // =========================================================================
  // WHITEBOARD SAFE DRAWING COORDINATES (Inside silver frame: x=395..1205, y=54..655)
  // Upper full-width board: x=402..1195, y=62..410
  // Lower-right board (right beside Tutor Peter's gesturing palm!): x=700..1195, y=420..642
  // =========================================================================
  const boardLeft = 404;
  const boardRight = 1192;
  const boardWidth = boardRight - boardLeft;

  // Header Badge (0.2s+)
  if (elapsedSec >= 0.2) {
    ctx.save();
    ctx.fillStyle = '#065f46';
    ctx.beginPath();
    ctx.roundRect(boardLeft, 64, Math.min(boardWidth, 560), 34, 9);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '800 15px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(lesson.boardHeaderBadge.slice(0, 52), boardLeft + 14, 86);

    // Price / KICD Tag on top-right of whiteboard
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.roundRect(boardRight - 205, 64, 205, 34, 9);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#92400e';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`2026 KICD • KES ${lesson.price}`, boardRight - 102, 86);
    ctx.restore();
  }

  // Topic Title written with typewriter marker effect (0.6s -> 4.5s)
  if (elapsedSec >= 0.6) {
    const titleProg = Math.min(1, (elapsedSec - 0.6) / 3.6);
    const visibleChars = Math.max(
      1,
      Math.floor(lesson.boardTopicTitle.length * titleProg)
    );
    const partialTitle = lesson.boardTopicTitle.slice(0, visibleChars);

    ctx.save();
    ctx.fillStyle = '#0f172a';
    ctx.font = '900 25px sans-serif';
    ctx.textAlign = 'left';
    const titleLines = wrapCanvasLines(ctx, partialTitle, boardWidth - 10, 2);
    titleLines.forEach((ln, idx) => {
      ctx.fillText(ln, boardLeft, 132 + idx * 31);
    });

    // Emerald underline sweeping across under title
    const lineY = titleLines.length > 1 ? 174 : 146;
    ctx.fillStyle = '#10b981';
    ctx.fillRect(boardLeft, lineY, boardWidth * titleProg, 4);
    ctx.restore();
  }

  // Scene 2: 3 Structured Syllabus Key Points written on the whiteboard (6.5s -> 19s)
  const pointStartTimes = [6.5, 10.5, 14.5];
  pointStartTimes.forEach((startT, idx) => {
    if (elapsedSec < startT) return;
    const pProg = Math.min(1, (elapsedSec - startT) / 3.2);
    const fullPt = lesson.boardKeyPoints[idx];
    const shownText = fullPt.slice(
      0,
      Math.max(1, Math.floor(fullPt.length * pProg))
    );
    const boxY = 192 + idx * 70;

    ctx.save();
    ctx.fillStyle = idx % 2 === 0 ? '#f8fafc' : '#f0fdf4';
    ctx.beginPath();
    ctx.roundRect(boardLeft, boxY, boardWidth, 58, 10);
    ctx.fill();
    ctx.fillStyle = idx === 0 ? '#2563eb' : idx === 1 ? '#059669' : '#7c3aed';
    ctx.fillRect(boardLeft, boxY, 6, 58);

    ctx.fillStyle = '#1e293b';
    ctx.font = '700 18px sans-serif';
    ctx.textAlign = 'left';
    const ptLines = wrapCanvasLines(ctx, shownText, boardWidth - 58, 2);
    ptLines.forEach((ln, lIdx) => {
      ctx.fillText(
        ln,
        boardLeft + 16,
        boxY + (ptLines.length > 1 ? 24 : 35) + lIdx * 22
      );
    });

    // Green summary checkmark in Scene 4 (29s+)
    if (elapsedSec >= 29 + idx * 0.6) {
      ctx.fillStyle = '#059669';
      ctx.beginPath();
      ctx.arc(boardRight - 24, boxY + 29, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ffffff';
      ctx.font = '900 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('✓', boardRight - 24, boxY + 34);
    }
    ctx.restore();
  });

  // Scene 3: Worked Classroom Demonstration Box right beside Tutor Peter's gesturing hand! (18.5s+)
  if (elapsedSec >= 18.5) {
    const demoLeft = 696;
    const demoWidth = boardRight - demoLeft;
    const demoTop = 414;
    const demoHeight = 186;

    ctx.save();
    ctx.fillStyle = '#fffbeb';
    ctx.beginPath();
    ctx.roundRect(demoLeft, demoTop, demoWidth, demoHeight, 14);
    ctx.fill();
    ctx.strokeStyle = '#f59e0b';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Top bar of worked example box
    ctx.fillStyle = '#b45309';
    ctx.beginPath();
    ctx.roundRect(demoLeft, demoTop, demoWidth, 34, [14, 14, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 14px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(`✎ ${lesson.workedBoxTitle}`, demoLeft + 14, demoTop + 22);

    lesson.workedBoxLines.forEach((line, lIdx) => {
      const lineAppear = 19.2 + lIdx * 2.6;
      if (elapsedSec < lineAppear) return;
      const lProg = Math.min(1, (elapsedSec - lineAppear) / 2.2);
      const txt = line.slice(0, Math.max(1, Math.floor(line.length * lProg)));

      ctx.fillStyle = lIdx === 2 ? '#065f46' : '#0f172a';
      ctx.font = lIdx === 2 ? '800 15px sans-serif' : '700 15px monospace';
      const wrapped = wrapCanvasLines(ctx, txt, demoWidth - 26, 2);
      ctx.fillText(wrapped[0] || '', demoLeft + 14, demoTop + 64 + lIdx * 42);
      if (wrapped[1]) {
        ctx.fillText(wrapped[1], demoLeft + 14, demoTop + 82 + lIdx * 42);
      }
    });
    ctx.restore();
  }

  // Live Synchronized Closed-Caption Bar at bottom of Whiteboard (Helps YouTube Retention & Accessibility)
  const activeCaption =
    elapsedSec < 7.5
      ? `"Tutor Peter here, welcome to our today's class! Topic: ${lesson.boardTopicTitle}"`
      : elapsedSec < 19.0
      ? `"Let us cover the 2026 KICD rationalized key points written on our whiteboard..."`
      : elapsedSec < 29.0
      ? `"${lesson.spokenExample.slice(0, 96)}..."`
      : `"Download the full Editable Word + PDF instantly at www.cbcmaterials.shop (M-Pesa: 0728595160)!"`;

  ctx.save();
  ctx.fillStyle =
    elapsedSec >= 29
      ? 'rgba(6, 78, 59, 0.96)'
      : 'rgba(15, 23, 42, 0.90)';
  ctx.beginPath();
  ctx.roundRect(boardLeft, 612, boardWidth, 42, 10);
  ctx.fill();

  ctx.fillStyle = elapsedSec >= 29 ? '#fde68a' : '#f8fafc';
  ctx.font = '700 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    activeCaption.slice(0, 98),
    boardLeft + boardWidth / 2,
    638
  );
  ctx.restore();

  // Bottom YouTube Progress Bar
  const pct = Math.min(1, elapsedSec / dur);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, H - 6, W * pct, 6);
}

export async function recordTutorPeterYoutubeVideo(
  lesson: WhiteboardLessonPlan,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const canvas = document.createElement('canvas');
  canvas.width = 1280;
  canvas.height = 720;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  const studioImg = await new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Could not load Tutor Peter studio image'));
    img.src = '/images/tutor-peter-whiteboard-studio.jpg';
  });

  // Set up WebAudio mixing: Tutor Peter's Kenyan Voiceover + gentle -22dB background piano
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioCtx();
  await audioCtx.resume();
  const dest = audioCtx.createMediaStreamDestination();

  const voiceAudio = new Audio(lesson.voiceoverUrl);
  voiceAudio.crossOrigin = 'anonymous';
  voiceAudio.preload = 'auto';

  const bgMusic = new Audio('/audio/whatsapp-status-soft-song.mp3');
  bgMusic.crossOrigin = 'anonymous';
  bgMusic.loop = true;
  bgMusic.preload = 'auto';

  const voiceSrc = audioCtx.createMediaElementSource(voiceAudio);
  const voiceGain = audioCtx.createGain();
  voiceGain.gain.value = 1.0;
  voiceSrc.connect(voiceGain);
  voiceGain.connect(dest);
  voiceGain.connect(audioCtx.destination);

  const bgSrc = audioCtx.createMediaElementSource(bgMusic);
  const bgGain = audioCtx.createGain();
  bgGain.gain.value = 0.12;
  bgSrc.connect(bgGain);
  bgGain.connect(dest);
  bgGain.connect(audioCtx.destination);

  const videoStream = canvas.captureStream(30);
  const combined = new MediaStream([
    ...videoStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ]);

  const mimeCandidates = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const mimeType =
    mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) ||
    'video/webm';
  const ext = mimeType.includes('mp4') ? 'mp4' : 'webm';

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(combined, {
    mimeType,
    videoBitsPerSecond: 4_000_000,
  });
  recorder.ondataavailable = (e) => {
    if (e.data && e.data.size > 0) chunks.push(e.data);
  };
  const stopPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => resolve(new Blob(chunks, { type: mimeType }));
  });

  drawTutorPeterWhiteboardFrame(ctx, studioImg, lesson, 0);
  recorder.start(250);

  await bgMusic.play().catch(() => {});
  await voiceAudio.play().catch(() => {});

  const totalMs = lesson.durationSeconds * 1000;
  const startMs = performance.now();

  await new Promise<void>((resolve) => {
    const step = () => {
      const elapsedMs = performance.now() - startMs;
      const elapsedSec = Math.min(lesson.durationSeconds, elapsedMs / 1000);
      if (onProgress) {
        onProgress(Math.min(100, Math.round((elapsedMs / totalMs) * 100)));
      }
      drawTutorPeterWhiteboardFrame(ctx, studioImg, lesson, elapsedSec);

      if (elapsedMs < totalMs) {
        requestAnimationFrame(step);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(step);
  });

  recorder.stop();
  voiceAudio.pause();
  bgMusic.pause();
  const blob = await stopPromise;
  await audioCtx.close().catch(() => {});

  const safeSlug = lesson.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .slice(0, 48);
  return {
    blob,
    filename: `tutor-peter-${safeSlug}.${ext}`,
    mimeType,
  };
}

export default function TutorPeterWhiteboardPlayer({
  material,
  autoPlayOnMount = false,
}: {
  material: MaterialVideoInput;
  autoPlayOnMount?: boolean;
}) {
  const lesson = buildTutorPeterWhiteboardLesson(material);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioImgRef = useRef<HTMLImageElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef<number>(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isAutoPosting, setIsAutoPosting] = useState(false);
  const [progressPct, setProgressPct] = useState(0);
  const [statusMessage, setStatusMessage] = useState('');
  const [youtubeAccessToken, setYoutubeAccessToken] = useState('');
  const [showTokenBox, setShowTokenBox] = useState(false);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const stopPlayback = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    voiceRef.current?.pause();
    bgRef.current?.pause();
    setIsPlaying(false);
  }, []);

  const startLiveClassPlayback = useCallback(async () => {
    const canvas = canvasRef.current;
    const img = studioImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopPlayback();

    let voice = voiceRef.current;
    if (!voice || voice.src !== new URL(lesson.voiceoverUrl, window.location.origin).href) {
      voice = new Audio(lesson.voiceoverUrl);
      voiceRef.current = voice;
    }
    voice.currentTime = 0;
    voice.volume = 1.0;

    let bg = bgRef.current;
    if (!bg) {
      bg = new Audio('/audio/whatsapp-status-soft-song.mp3');
      bg.loop = true;
      bgRef.current = bg;
    }
    bg.currentTime = 0;
    bg.volume = 0.12;

    setIsPlaying(true);
    setElapsedSec(0);
    playStartRef.current = performance.now();

    void bg.play().catch(() => {});
    void voice.play().catch(() => {
      // Fallback to intro MP3 if dynamic voiceover is still warming up
      const fallback = new Audio('/audio/tutor-peter-intro.mp3');
      voiceRef.current = fallback;
      void fallback.play().catch(() => {});
    });

    const tick = () => {
      const sec = (performance.now() - playStartRef.current) / 1000;
      if (sec >= lesson.durationSeconds) {
        drawTutorPeterWhiteboardFrame(ctx, img, lesson, lesson.durationSeconds);
        setElapsedSec(lesson.durationSeconds);
        stopPlayback();
        return;
      }
      setElapsedSec(sec);
      drawTutorPeterWhiteboardFrame(ctx, img, lesson, sec);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [lesson, stopPlayback]);

  // Load Tutor Peter's clean studio whiteboard classroom image & draw preview frame
  useEffect(() => {
    let cancelled = false;
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      if (cancelled) return;
      studioImgRef.current = img;
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx) {
        drawTutorPeterWhiteboardFrame(ctx, img, lesson, 4.8);
      }
      if (autoPlayOnMount) {
        void startLiveClassPlayback();
      }
    };
    img.src = '/images/tutor-peter-whiteboard-studio.jpg';

    return () => {
      cancelled = true;
      stopPlayback();
    };
  }, [autoPlayOnMount, lesson, startLiveClassPlayback, stopPlayback]);

  const handleDownloadYoutubeVideo = async () => {
    stopPlayback();
    setIsExporting(true);
    setProgressPct(0);
    setStatusMessage(
      'Recording 16:9 YouTube HD Whiteboard Demonstration with Tutor Peter’s Voice…'
    );
    try {
      const { blob, filename } = await recordTutorPeterYoutubeVideo(
        lesson,
        (pct) => setProgressPct(pct)
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMessage(
        `Saved ${filename} (1280×720 HD 16:9 • Ready for YouTube & Any Site)!`
      );
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Video recording failed'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleAutoPostToYouTubeAndAllSites = async () => {
    stopPlayback();
    setIsAutoPosting(true);
    setProgressPct(0);
    setStatusMessage(
      'Step 1/2: Recording Tutor Peter’s Whiteboard Class Video (16:9 HD)…'
    );
    try {
      const { blob, filename, mimeType } = await recordTutorPeterYoutubeVideo(
        lesson,
        (pct) => setProgressPct(pct)
      );

      setStatusMessage(
        'Step 2/2: Uploading to YouTube Data API v3, Public Video CDN, Video Sitemap & Connected Social Sites…'
      );
      const fd = new FormData();
      fd.append('video', new File([blob], filename, { type: mimeType }));
      fd.append('materialId', lesson.materialId);
      fd.append('title', lesson.title);
      fd.append('grade', String(material.grade || 8));
      fd.append('category', lesson.category);
      fd.append('subject', lesson.subject);
      fd.append('term', String(material.term || 1));
      fd.append('price', String(lesson.price));
      if (youtubeAccessToken.trim()) {
        fd.append('youtubeAccessToken', youtubeAccessToken.trim());
      }

      const res = await fetch('/api/videos/youtube-upload', {
        method: 'POST',
        body: fd,
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setPublishedUrl(data.youtubeWatchUrl || data.publicVideoUrl);
        if (data.youtubeWatchUrl) {
          setStatusMessage(
            `LIVE ON YOUTUBE (${data.youtubeWatchUrl}) + Syndicated across ${(
              data.syndicatedSites || []
            ).join(', ')}!`
          );
        } else {
          // Also copy SEO metadata & download local copy if YouTube OAuth token wasn't pasted yet
          await navigator.clipboard
            ?.writeText(`${lesson.youtubeTitle}\n\n${lesson.youtubeDescription}`)
            .catch(() => {});
          setStatusMessage(
            `Hosted live on Public Video CDN + Indexed in /video-sitemap.xml & IndexNow! (YouTube SEO Title & Chapters copied — paste a YouTube OAuth token below for zero-click direct YouTube API upload, or drop into YouTube Studio!)`
          );
        }
      } else {
        setStatusMessage(data.error || 'Upload completed with warning.');
      }
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Auto-post failed'
      );
    } finally {
      setIsAutoPosting(false);
    }
  };

  const handleDownloadSrtCaptions = () => {
    const blob = new Blob([lesson.captionsSrt], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tutor-peter-${lesson.materialId}.srt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const copyField = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {}
  };

  return (
    <div className="space-y-4">
      {/* 16:9 Full HD Interactive Whiteboard Classroom Canvas */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-2xl aspect-video w-full">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={() =>
            isPlaying ? stopPlayback() : void startLiveClassPlayback()
          }
          className="w-full h-full object-contain cursor-pointer"
        />

        {!isPlaying && !isExporting && !isAutoPosting && (
          <button
            type="button"
            onClick={() => void startLiveClassPlayback()}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/25 hover:bg-slate-950/15 transition group cursor-pointer"
          >
            <span className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-red-600 group-hover:bg-red-500 text-white font-black text-sm sm:text-base shadow-[0_10px_35px_rgba(220,38,38,0.65)] transition transform group-hover:scale-105">
              <Play className="w-5 h-5 fill-white" />
              <span>Play Tutor Peter&apos;s Whiteboard Class (0:36 HD)</span>
            </span>
          </button>
        )}
      </div>

      {/* Controls & Auto-Post Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              isPlaying ? stopPlayback() : void startLiveClassPlayback()
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Square className="w-3.5 h-3.5 fill-white" />
                <span>Stop ({Math.ceil(elapsedSec)}s / 36s)</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Play Class</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isExporting || isAutoPosting}
            onClick={() => void handleDownloadYoutubeVideo()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs disabled:opacity-60 transition cursor-pointer"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Recording {progressPct}%…</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>Download YouTube HD Video</span>
              </>
            )}
          </button>

          <button
            type="button"
            disabled={isExporting || isAutoPosting}
            onClick={() => void handleAutoPostToYouTubeAndAllSites()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md disabled:opacity-60 transition cursor-pointer"
          >
            {isAutoPosting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Auto-Posting ({progressPct}%)…</span>
              </>
            ) : (
              <>
                <UploadCloud className="w-3.5 h-3.5" />
                <span>Auto-Post to YouTube &amp; All Sites</span>
              </>
            )}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSrtCaptions}
            title="Download .SRT Closed Captions for YouTube SEO Ranking"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            <FileText className="w-3.5 h-3.5 text-amber-300" />
            <span>.SRT Captions</span>
          </button>

          <a
            href={lesson.thumbnailUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
            <span>1280×720 Thumbnail</span>
          </a>

          <button
            type="button"
            onClick={() => setShowTokenBox((s) => !s)}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            <Video className="w-3.5 h-3.5 text-red-400" />
            <span>YT API Token</span>
          </button>
        </div>
      </div>

      {showTokenBox && (
        <div className="rounded-2xl bg-slate-900 text-white border border-red-500/40 p-4 space-y-2 text-xs">
          <p className="font-bold text-red-300">
            Direct 1-Click YouTube Data API v3 Upload Token (Optional — or save
            permanently in Admin Studio):
          </p>
          <input
            type="password"
            value={youtubeAccessToken}
            onChange={(e) => setYoutubeAccessToken(e.target.value)}
            placeholder="Paste Google OAuth2 Access Token with youtube.upload scope (ya29....)"
            className="w-full px-3 py-2 rounded-xl bg-white text-slate-900 text-xs font-mono"
          />
        </div>
      )}

      {statusMessage && (
        <div className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 text-xs font-bold text-emerald-900 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{statusMessage}</span>
          </div>
          {publishedUrl && (
            <a
              href={publishedUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-emerald-700 text-white font-black"
            >
              <span>Open Published Video</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}

      {/* YouTube SEO Metadata + Cross-Site Quick Share */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="text-xs font-black uppercase tracking-wider text-slate-800">
            YouTube #1 Ranking SEO Pack (Title + Key-Moments Chapters + 15 Tags)
          </span>
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() =>
                void copyField(
                  'all',
                  `${lesson.youtubeTitle}\n\n${lesson.youtubeDescription}\n\nTags: ${lesson.youtubeTags.join(
                    ', '
                  )}`
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-[11px] font-bold cursor-pointer"
            >
              {copiedKey === 'all' ? (
                <Check className="w-3.5 h-3.5 text-emerald-400" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
              <span>
                {copiedKey === 'all' ? 'Copied SEO Pack!' : 'Copy Full YT SEO Pack'}
              </span>
            </button>

            <a
              href="https://studio.youtube.com/"
              target="_blank"
              rel="noreferrer"
              onClick={() =>
                void copyField(
                  'all',
                  `${lesson.youtubeTitle}\n\n${lesson.youtubeDescription}`
                )
              }
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-[11px] font-bold"
            >
              <span>Open YouTube Studio</span>
              <ExternalLink className="w-3 h-3" />
            </a>

            <a
              href={`https://x.com/intent/tweet?text=${encodeURIComponent(
                `👨‍🏫 Tutor Peter here, welcome to our today's class! Watch ${lesson.title} (${lesson.gradeLabel} ${lesson.subject}) 👉 ${lesson.watchPageUrl} #CBCKenya #TutorPeter #KJSEA2026`
              )}`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold"
            >
              <Share2 className="w-3 h-3" />
              <span>Post to X</span>
            </a>

            <Link
              href={`/materials/${lesson.materialId}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
            >
              <span>Download Material (KES {lesson.price}) →</span>
            </Link>
          </div>
        </div>

        <div className="rounded-xl bg-slate-50 border border-slate-200 p-3 text-xs space-y-1.5">
          <p className="font-black text-slate-900">{lesson.youtubeTitle}</p>
          <p className="text-slate-600 whitespace-pre-line line-clamp-4">
            {lesson.youtubeDescription}
          </p>
        </div>
      </div>
    </div>
  );
}
