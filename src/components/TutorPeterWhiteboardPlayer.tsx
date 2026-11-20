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
  KeyRound,
  Loader2,
  Lock,
  MessageCircle,
  Play,
  Share2,
  Smartphone,
  Sparkles,
  Square,
  Unlock,
  UploadCloud,
  Video,
} from 'lucide-react';
import {
  buildTutorPeterWhiteboardLesson,
  TUTOR_PETER_VIDEO_PRICE_KES,
  TUTOR_PETER_VIDEO_PRICE_USD,
  type MaterialVideoInput,
  type WhiteboardLessonPlan,
} from '@/lib/tutor-peter-videos';
import { ADMIN_2FA_TOKEN_KEY } from './AdminTwoFactorGate';
import { VIDEO_BUTTON_UNLOCK_KEY } from './VideoButtonPaywallGuard';

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
  elapsedSec: number,
  lockedPreview = false
) {
  const W = ctx.canvas.width; // 1280
  const H = ctx.canvas.height; // 720
  const dur = lesson.durationSeconds; // 36s

  ctx.fillStyle = '#f1f5f9';
  ctx.fillRect(0, 0, W, H);
  ctx.drawImage(studioImg, 0, 0, W, H);

  // Live Presenter Badge on Bottom-Left
  ctx.save();
  ctx.fillStyle = 'rgba(2, 44, 34, 0.92)';
  ctx.beginPath();
  ctx.roundRect(24, H - 96, 305, 72, 16);
  ctx.fill();
  ctx.strokeStyle = '#34d399';
  ctx.lineWidth = 2.5;
  ctx.stroke();

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
  ctx.fillText(`Class Access: $${TUTOR_PETER_VIDEO_PRICE_USD} • cbcmaterials.shop`, 44, H - 40);

  for (let i = 0; i < 6; i++) {
    const bh = lockedPreview
      ? 10
      : 8 + 18 * Math.abs(Math.sin(elapsedSec * 7.5 + i * 0.9));
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(275 + i * 7, H - 64 - bh / 2, 4, bh);
  }
  ctx.restore();

  const boardLeft = 404;
  const boardRight = 1192;
  const boardWidth = boardRight - boardLeft;

  // Header Badge
  ctx.save();
  ctx.fillStyle = '#065f46';
  ctx.beginPath();
  ctx.roundRect(boardLeft, 64, Math.min(boardWidth, 555), 34, 9);
  ctx.fill();

  ctx.fillStyle = '#ffffff';
  ctx.font = '800 15px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(lesson.boardHeaderBadge.slice(0, 52), boardLeft + 14, 86);

  ctx.fillStyle = '#fef3c7';
  ctx.beginPath();
  ctx.roundRect(boardRight - 215, 64, 215, 34, 9);
  ctx.fill();
  ctx.strokeStyle = '#f59e0b';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = '#92400e';
  ctx.font = '900 14px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    `CLASS VIDEO: $${TUTOR_PETER_VIDEO_PRICE_USD} (KES ${TUTOR_PETER_VIDEO_PRICE_KES})`,
    boardRight - 107,
    86
  );
  ctx.restore();

  // Topic Title
  ctx.save();
  ctx.fillStyle = '#0f172a';
  ctx.font = '900 25px sans-serif';
  ctx.textAlign = 'left';
  const titleProg = lockedPreview ? 1 : Math.min(1, Math.max(0.1, (elapsedSec - 0.5) / 3.5));
  const partialTitle = lesson.boardTopicTitle.slice(
    0,
    Math.max(1, Math.floor(lesson.boardTopicTitle.length * titleProg))
  );
  const titleLines = wrapCanvasLines(ctx, partialTitle, boardWidth - 10, 2);
  titleLines.forEach((ln, idx) => {
    ctx.fillText(ln, boardLeft, 132 + idx * 31);
  });
  const lineY = titleLines.length > 1 ? 174 : 146;
  ctx.fillStyle = '#10b981';
  ctx.fillRect(boardLeft, lineY, boardWidth * titleProg, 4);
  ctx.restore();

  // If locked preview, draw locked placeholder bars instead of revealing the lesson content!
  if (lockedPreview) {
    ctx.save();
    ctx.fillStyle = 'rgba(15, 23, 42, 0.06)';
    ctx.beginPath();
    ctx.roundRect(boardLeft, 195, boardWidth, 210, 14);
    ctx.fill();

    ctx.fillStyle = '#64748b';
    ctx.font = '800 20px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(
      `🔒WHITEBOARD DEMONSTRATION LOCKED — UNLOCK FOR $${TUTOR_PETER_VIDEO_PRICE_USD}`,
      boardLeft + boardWidth / 2,
      305
    );
    ctx.restore();
    return;
  }

  // Unlocked Scene 2: 3 Structured Syllabus Key Points (6.5s -> 19s)
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

  // Scene 3: Worked Classroom Demonstration Box (18.5s+)
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

  const activeCaption =
    elapsedSec < 7.5
      ? `"Tutor Peter here, welcome to our today's class! Topic: ${lesson.boardTopicTitle}"`
      : elapsedSec < 19.0
      ? `"Let us cover the 2026 KICD rationalized key points written on our whiteboard..."`
      : elapsedSec < 29.0
      ? `"${lesson.spokenExample.slice(0, 96)}..."`
      : `"Thank you for joining Tutor Peter's class on www.cbcmaterials.shop!"`;

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
  ctx.fillText(activeCaption.slice(0, 98), boardLeft + boardWidth / 2, 638);
  ctx.restore();

  const pct = Math.min(1, elapsedSec / dur);
  ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
  ctx.fillRect(0, H - 6, W, 6);
  ctx.fillStyle = '#dc2626';
  ctx.fillRect(0, H - 6, W * pct, 6);
}

export async function recordTutorPeterYoutubeVideo(
  lesson: WhiteboardLessonPlan,
  onProgress?: (pct: number) => void,
  authParams?: { checkoutRequestId?: string; adminPassword?: string }
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
    img.onerror = () =>
      reject(new Error('Could not load Tutor Peter studio image'));
    img.src = '/images/tutor-peter-whiteboard-studio.jpg';
  });

  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioCtx();
  await audioCtx.resume();
  const dest = audioCtx.createMediaStreamDestination();

  let voiceSrcUrl = lesson.voiceoverUrl;
  if (authParams?.checkoutRequestId) {
    voiceSrcUrl += `&checkoutRequestId=${encodeURIComponent(
      authParams.checkoutRequestId
    )}`;
  }

  let voiceObjectUrl: string | null = null;
  if (authParams?.adminPassword) {
    try {
      const r = await fetch(voiceSrcUrl, {
        headers: { 'x-admin-password': authParams.adminPassword },
      });
      if (r.ok) {
        const b = await r.blob();
        voiceObjectUrl = URL.createObjectURL(b);
        voiceSrcUrl = voiceObjectUrl;
      }
    } catch {}
  }

  const voiceAudio = new Audio(voiceSrcUrl);
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

  drawTutorPeterWhiteboardFrame(ctx, studioImg, lesson, 0, false);
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
      drawTutorPeterWhiteboardFrame(ctx, studioImg, lesson, elapsedSec, false);

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
  if (voiceObjectUrl) URL.revokeObjectURL(voiceObjectUrl);
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
  const unlockStorageKey = `cbc_video_unlocked_v1_${lesson.materialId}`;

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const studioImgRef = useRef<HTMLImageElement | null>(null);
  const voiceRef = useRef<HTMLAudioElement | null>(null);
  const bgRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef<number>(0);

  // Paywall Lock State ($15 / KES 1,950)
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [isCreatorAdmin, setIsCreatorAdmin] = useState(false);
  const [verifiedCheckoutId, setVerifiedCheckoutId] = useState<string>('');
  const [adminPassInput, setAdminPassInput] = useState('');
  const [showCreatorLogin, setShowCreatorLogin] = useState(false);

  // $15 M-Pesa Checkout State
  const [showCheckoutBox, setShowCheckoutBox] = useState(false);
  const [payTab, setPayTab] = useState<'STK' | 'CODE'>('STK');
  const [phoneInput, setPhoneInput] = useState('');
  const [buyerNameInput, setBuyerNameInput] = useState('');
  const [mpesaCodeInput, setMpesaCodeInput] = useState('');
  const [pendingCheckoutId, setPendingCheckoutId] = useState<string | null>(
    null
  );
  const [isSendingPay, setIsSendingPay] = useState(false);
  const [payFeedback, setPayFeedback] = useState('');

  // Playback & Export State
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

  // Check if previously unlocked via $15 M-Pesa order OR active Admin Creator session
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const has2fa = localStorage.getItem(ADMIN_2FA_TOKEN_KEY);
      if (has2fa) {
        setIsUnlocked(true);
        setIsCreatorAdmin(true);
        return;
      }

      const savedOrderId =
        localStorage.getItem(VIDEO_BUTTON_UNLOCK_KEY) ||
        localStorage.getItem(unlockStorageKey);
      if (savedOrderId) {
        fetch(
          `/api/resources/download?checkoutRequestId=${encodeURIComponent(
            savedOrderId
          )}`
        )
          .then((r) => r.json())
          .then((d) => {
            if (d?.status === 'COMPLETED') {
              setVerifiedCheckoutId(savedOrderId);
              setIsUnlocked(true);
            }
          })
          .catch(() => {});
      }
    } catch {}
  }, [unlockStorageKey]);

  // Poll pending $15 M-Pesa STK Push / Direct Code order until COMPLETED
  useEffect(() => {
    if (!pendingCheckoutId || isUnlocked) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `/api/resources/download?checkoutRequestId=${encodeURIComponent(
            pendingCheckoutId
          )}`
        );
        const data = await res.json();
        if (data?.status === 'COMPLETED') {
          clearInterval(interval);
          try {
            localStorage.setItem(unlockStorageKey, pendingCheckoutId);
          } catch {}
          setVerifiedCheckoutId(pendingCheckoutId);
          setIsUnlocked(true);
          setShowCheckoutBox(false);
          setPendingCheckoutId(null);
          setPayFeedback('');
          setStatusMessage(
            `Payment confirmed ($${TUTOR_PETER_VIDEO_PRICE_USD})! Welcome inside Tutor Peter's Whiteboard Class!`
          );
        } else if (data?.status === 'FAILED') {
          clearInterval(interval);
          setPendingCheckoutId(null);
          setIsSendingPay(false);
          setPayFeedback(
            'M-Pesa prompt was cancelled or timed out. Please try again or paste your M-Pesa confirmation code.'
          );
        }
      } catch {}
    }, 2200);

    return () => clearInterval(interval);
  }, [isUnlocked, pendingCheckoutId, unlockStorageKey]);

  const startLiveClassPlayback = useCallback(async () => {
    if (!isUnlocked) {
      setShowCheckoutBox(true);
      return;
    }

    const canvas = canvasRef.current;
    const img = studioImgRef.current;
    if (!canvas || !img) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    stopPlayback();

    const voiceQueryUrl = verifiedCheckoutId
      ? `${lesson.voiceoverUrl}&checkoutRequestId=${encodeURIComponent(
          verifiedCheckoutId
        )}`
      : '/audio/tutor-peter-intro.mp3';

    const voice = new Audio(voiceQueryUrl);
    voiceRef.current = voice;
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
      const fallback = new Audio('/audio/tutor-peter-intro.mp3');
      voiceRef.current = fallback;
      void fallback.play().catch(() => {});
    });

    const tick = () => {
      const sec = (performance.now() - playStartRef.current) / 1000;
      if (sec >= lesson.durationSeconds) {
        drawTutorPeterWhiteboardFrame(
          ctx,
          img,
          lesson,
          lesson.durationSeconds,
          false
        );
        setElapsedSec(lesson.durationSeconds);
        stopPlayback();
        return;
      }
      setElapsedSec(sec);
      drawTutorPeterWhiteboardFrame(ctx, img, lesson, sec, false);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, [isUnlocked, lesson, stopPlayback, verifiedCheckoutId]);

  // Draw initial whiteboard preview (locked if !isUnlocked)
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
        drawTutorPeterWhiteboardFrame(ctx, img, lesson, 4.8, !isUnlocked);
      }
      if (autoPlayOnMount && isUnlocked) {
        void startLiveClassPlayback();
      }
    };
    img.src = '/images/tutor-peter-whiteboard-studio.jpg';

    return () => {
      cancelled = true;
      stopPlayback();
    };
  }, [autoPlayOnMount, isUnlocked, lesson, startLiveClassPlayback, stopPlayback]);

  const handleStkVideoUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingPay(true);
    setPayFeedback(
      `Sending $${TUTOR_PETER_VIDEO_PRICE_USD} (KSh ${TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()}) M-Pesa STK prompt to your phone… Enter your M-Pesa PIN (works with Fuliza too!).`
    );
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phoneInput.trim(),
          buyerName: buyerNameInput.trim(),
          serviceType: 'TUTOR_PETER_VIDEO',
          bookTitle: `Video Class ($15): ${lesson.title.slice(0, 95)}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutRequestId) {
        setPendingCheckoutId(data.checkoutRequestId);
        setPayFeedback(
          'STK Prompt sent! Enter your M-Pesa PIN on your handset — this video unlocks automatically in 1 second!'
        );
      } else {
        setIsSendingPay(false);
        setPayFeedback(data.error || 'Could not initiate M-Pesa prompt.');
      }
    } catch {
      setIsSendingPay(false);
      setPayFeedback('Network error sending M-Pesa prompt.');
    }
  };

  const handleDirectCodeVideoUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingPay(true);
    setPayFeedback('Submitting M-Pesa confirmation code for verification…');
    try {
      const res = await fetch('/api/mpesa/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mpesaCode: mpesaCodeInput.trim(),
          phoneNumber: phoneInput.trim(),
          buyerName: buyerNameInput.trim(),
          serviceType: 'TUTOR_PETER_VIDEO',
          bookTitle: `Video Class ($15): ${lesson.title.slice(0, 95)}`,
        }),
      });
      const data = await res.json();
      if (res.ok && data.checkoutRequestId) {
        setPendingCheckoutId(data.checkoutRequestId);
        setPayFeedback(
          'M-Pesa code received! Keep this screen open — unlocks automatically upon verification.'
        );
      } else {
        setIsSendingPay(false);
        setPayFeedback(data.error || 'Invalid M-Pesa confirmation code.');
      }
    } catch {
      setIsSendingPay(false);
      setPayFeedback('Network error verifying M-Pesa code.');
    }
  };

  const handleVerifyCreatorAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminPassInput.trim()) return;
    try {
      const res = await fetch('/api/social/omnichannel-autopost', {
        headers: { 'x-admin-password': adminPassInput.trim() },
      });
      if (res.ok) {
        setIsUnlocked(true);
        setIsCreatorAdmin(true);
        setShowCreatorLogin(false);
        setStatusMessage(
          'Creator Studio Unlocked! You can play, download & Auto-Post to YouTube freely.'
        );
      } else {
        setStatusMessage('Invalid Admin Password.');
      }
    } catch {}
  };

  const handleDownloadYoutubeVideo = async () => {
    if (!isUnlocked) {
      setShowCheckoutBox(true);
      return;
    }
    stopPlayback();
    setIsExporting(true);
    setProgressPct(0);
    setStatusMessage(
      'Recording 16:9 YouTube HD Whiteboard Demonstration with Tutor Peter’s Voice…'
    );
    try {
      const { blob, filename } = await recordTutorPeterYoutubeVideo(
        lesson,
        (pct) => setProgressPct(pct),
        {
          checkoutRequestId: verifiedCheckoutId || undefined,
          adminPassword: adminPassInput.trim() || undefined,
        }
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMessage(`Saved ${filename} (1280×720 HD 16:9)!`);
    } catch (err: unknown) {
      setStatusMessage(
        err instanceof Error ? err.message : 'Video recording failed'
      );
    } finally {
      setIsExporting(false);
    }
  };

  const handleAutoPostToYouTubeAndAllSites = async () => {
    if (!isUnlocked) {
      setShowCheckoutBox(true);
      return;
    }
    stopPlayback();
    setIsAutoPosting(true);
    setProgressPct(0);
    setStatusMessage(
      'Step 1/2: Recording Tutor Peter’s Whiteboard Class Video (16:9 HD)…'
    );
    try {
      const { blob, filename, mimeType } = await recordTutorPeterYoutubeVideo(
        lesson,
        (pct) => setProgressPct(pct),
        {
          checkoutRequestId: verifiedCheckoutId || undefined,
          adminPassword: adminPassInput.trim() || undefined,
        }
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
          await navigator.clipboard
            ?.writeText(`${lesson.youtubeTitle}\n\n${lesson.youtubeDescription}`)
            .catch(() => {});
          setStatusMessage(
            `Hosted live on Public Video CDN + Indexed in /video-sitemap.xml & IndexNow!`
          );
        }
      } else {
        setStatusMessage(data.error || 'Upload completed with warning.');
      }
    } catch (err: unknown) {
      setStatusMessage(err instanceof Error ? err.message : 'Auto-post failed');
    } finally {
      setIsAutoPosting(false);
    }
  };

  const handleDownloadSrtCaptions = () => {
    if (!isUnlocked) {
      setShowCheckoutBox(true);
      return;
    }
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
      {/* 16:9 Full HD Whiteboard Classroom Canvas (Locked Behind $15 Paywall Until Paid!) */}
      <div className="relative rounded-2xl overflow-hidden border-2 border-emerald-500/50 bg-slate-950 shadow-2xl aspect-video w-full select-none">
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          onClick={() => {
            if (!isUnlocked) {
              setShowCheckoutBox(true);
              return;
            }
            if (isPlaying) stopPlayback();
            else void startLiveClassPlayback();
          }}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* LOCKED OVERLAY ($15 USD / KSh 1,950) */}
        {!isUnlocked && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[3px] flex flex-col items-center justify-center p-4 sm:p-6 text-center text-white">
            <div className="max-w-lg w-full rounded-3xl bg-slate-900/95 border-2 border-amber-400/70 p-5 sm:p-7 shadow-[0_20px_60px_rgba(0,0,0,0.8)] space-y-3.5">
              <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-amber-400/20 border border-amber-300/50 text-amber-300 text-[11px] font-black uppercase tracking-wider">
                <Lock className="w-3.5 h-3.5" />
                <span>
                  LOCKED WHITEBOARD CLASS • ${TUTOR_PETER_VIDEO_PRICE_USD} USD
                  (KSh {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()})
                </span>
              </div>

              <h3 className="text-base sm:text-xl font-black leading-snug">
                Unlock Tutor Peter&apos;s Full Whiteboard Demonstration
              </h3>

              <p className="text-xs text-slate-300 leading-relaxed">
                &ldquo;Tutor Peter here, welcome to our today&apos;s
                class!&rdquo; — Unlock full HD video playback &amp; download for{' '}
                <strong className="text-amber-300">
                  ${TUTOR_PETER_VIDEO_PRICE_USD} (KSh{' '}
                  {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()})
                </strong>{' '}
                via instant M-Pesa STK Prompt.
              </p>

              <button
                type="button"
                onClick={() => setShowCheckoutBox(true)}
                className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-amber-300 via-amber-400 to-emerald-400 hover:brightness-105 text-slate-950 font-black text-xs sm:text-sm shadow-lg flex items-center justify-center gap-2 transition cursor-pointer"
              >
                <Unlock className="w-4 h-4" />
                <span>
                  Unlock Video Now — ${TUTOR_PETER_VIDEO_PRICE_USD} (KSh{' '}
                  {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()})
                </span>
              </button>
            </div>
          </div>
        )}

        {/* UNLOCKED PLAY BUTTON OVERLAY */}
        {isUnlocked && !isPlaying && !isExporting && !isAutoPosting && (
          <button
            type="button"
            onClick={() => void startLiveClassPlayback()}
            className="absolute inset-0 flex items-center justify-center bg-slate-950/25 hover:bg-slate-950/15 transition group cursor-pointer"
          >
            <span className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-full bg-red-600 group-hover:bg-red-500 text-white font-black text-sm sm:text-base shadow-[0_10px_35px_rgba(220,38,38,0.65)] transition transform group-hover:scale-105">
              <Play className="w-5 h-5 fill-white" />
              <span>Play Tutor Peter&apos;s Whiteboard Class (Unlocked)</span>
            </span>
          </button>
        )}
      </div>

      {/* INSTANT $15 (KSh 1,950) M-PESA STK PUSH + DIRECT CODE CHECKOUT PANEL */}
      {!isUnlocked && showCheckoutBox && (
        <div className="rounded-3xl bg-white border-2 border-emerald-500 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3">
            <div>
              <span className="text-[11px] font-black uppercase tracking-wider text-emerald-700">
                Instant Class Video Unlock
              </span>
              <h4 className="text-base sm:text-lg font-black text-slate-900">
                Pay ${TUTOR_PETER_VIDEO_PRICE_USD} USD (KSh{' '}
                {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()}) — Unlocks in 1
                Second
              </h4>
            </div>
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl text-xs font-bold">
              <button
                type="button"
                onClick={() => setPayTab('STK')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  payTab === 'STK'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700'
                }`}
              >
                M-Pesa Express (STK)
              </button>
              <button
                type="button"
                onClick={() => setPayTab('CODE')}
                className={`px-3 py-1.5 rounded-lg cursor-pointer ${
                  payTab === 'CODE'
                    ? 'bg-emerald-600 text-white'
                    : 'text-slate-700'
                }`}
              >
                Paste M-Pesa Code
              </button>
            </div>
          </div>

          {payTab === 'STK' ? (
            <form onSubmit={handleStkVideoUnlock} className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="tel"
                  required
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Safaricom M-Pesa Phone (e.g. 0712345678)"
                  className="px-4 py-3 rounded-xl border border-slate-300 text-sm font-semibold"
                />
                <input
                  type="text"
                  value={buyerNameInput}
                  onChange={(e) => setBuyerNameInput(e.target.value)}
                  placeholder="Your Name (Optional)"
                  className="px-4 py-3 rounded-xl border border-slate-300 text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={isSendingPay && Boolean(pendingCheckoutId)}
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-md cursor-pointer"
              >
                {pendingCheckoutId ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Waiting for M-Pesa PIN Confirmation…</span>
                  </>
                ) : (
                  <>
                    <Smartphone className="w-4 h-4" />
                    <span>
                      Send ${TUTOR_PETER_VIDEO_PRICE_USD} (KSh{' '}
                      {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()}) M-Pesa
                      Prompt Now
                    </span>
                  </>
                )}
              </button>
            </form>
          ) : (
            <form onSubmit={handleDirectCodeVideoUnlock} className="space-y-3">
              <p className="text-xs text-slate-600">
                Send{' '}
                <strong>
                  KSh {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()} ($
                  {TUTOR_PETER_VIDEO_PRICE_USD})
                </strong>{' '}
                to M-Pesa <strong>0728595160</strong>, then paste your M-Pesa
                confirmation code or SMS below:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <input
                  type="text"
                  required
                  value={mpesaCodeInput}
                  onChange={(e) => setMpesaCodeInput(e.target.value)}
                  placeholder="Paste M-Pesa Code or Full SMS"
                  className="px-4 py-3 rounded-xl border border-slate-300 text-sm font-mono uppercase"
                />
                <input
                  type="tel"
                  value={phoneInput}
                  onChange={(e) => setPhoneInput(e.target.value)}
                  placeholder="Your Phone Number"
                  className="px-4 py-3 rounded-xl border border-slate-300 text-sm"
                />
              </div>
              <button
                type="submit"
                className="w-full py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm cursor-pointer"
              >
                Verify M-Pesa Code &amp; Unlock Video
              </button>
            </form>
          )}

          {payFeedback && (
            <div className="rounded-xl bg-amber-50 border border-amber-200 px-4 py-2.5 text-xs font-bold text-amber-900 flex items-center justify-between gap-2">
              <span>{payFeedback}</span>
              <a
                href={`https://wa.me/254728595160?text=${encodeURIComponent(
                  `Hello Tutor Peter, I need help unlocking the $15 class video for: ${lesson.title}`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-600 text-white shrink-0"
              >
                <MessageCircle className="w-3.5 h-3.5" />
                <span>WhatsApp Help</span>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Controls Bar (Locked for Visitors Until Paid; Full Studio for Unlocked / Creator) */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 bg-slate-900 text-white p-3.5 rounded-2xl border border-slate-800">
        {!isUnlocked ? (
          <div className="flex flex-wrap items-center justify-between gap-3 w-full">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
              <Lock className="w-4 h-4 shrink-0" />
              <span>
                Locked Class Video • Price: ${TUTOR_PETER_VIDEO_PRICE_USD} USD
                (KSh {TUTOR_PETER_VIDEO_PRICE_KES.toLocaleString()})
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowCheckoutBox(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs cursor-pointer"
              >
                <Unlock className="w-3.5 h-3.5" />
                <span>Unlock Class ($15)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowCreatorLogin((s) => !s)}
                title="Tutor Peter Creator Login (For YouTube Auto-Posting)"
                className="inline-flex items-center gap-1 px-2.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-[11px] font-bold text-slate-300 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Creator</span>
              </button>
            </div>
          </div>
        ) : (
          <>
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
                    <span>Play Full Class</span>
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
                    <span>Download HD Video</span>
                  </>
                )}
              </button>

              {isCreatorAdmin && (
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
              )}
            </div>

            {isCreatorAdmin && (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadSrtCaptions}
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
            )}
          </>
        )}
      </div>

      {/* Optional Creator Admin Unlock Form */}
      {showCreatorLogin && !isUnlocked && (
        <form
          onSubmit={handleVerifyCreatorAdmin}
          className="rounded-2xl bg-slate-900 text-white p-3.5 flex items-center gap-2 text-xs"
        >
          <input
            type="password"
            value={adminPassInput}
            onChange={(e) => setAdminPassInput(e.target.value)}
            placeholder="Enter Tutor Peter Admin Password to unlock Creator Auto-Post tools"
            className="flex-1 px-3 py-2 rounded-xl bg-white text-slate-900 text-xs"
          />
          <button
            type="submit"
            className="px-4 py-2 rounded-xl bg-emerald-600 text-white font-black cursor-pointer"
          >
            Unlock Studio
          </button>
        </form>
      )}

      {showTokenBox && isCreatorAdmin && (
        <div className="rounded-2xl bg-slate-900 text-white border border-red-500/40 p-4 space-y-2 text-xs">
          <p className="font-bold text-red-300">
            Direct 1-Click YouTube Data API v3 Upload Token:
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

      {/* Share & Material Download Strip */}
      <div className="rounded-2xl bg-white border border-slate-200 p-4 flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-black text-slate-800">
          {lesson.youtubeTitle}
        </span>
        <div className="flex flex-wrap items-center gap-1.5">
          {isCreatorAdmin && (
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
                {copiedKey === 'all' ? 'Copied!' : 'Copy Full YT SEO Pack'}
              </span>
            </button>
          )}

          <a
            href={`https://x.com/intent/tweet?text=${encodeURIComponent(
              `👨‍🏫 Tutor Peter here, welcome to our today's class! Unlock ${lesson.title} ($15 Whiteboard Class) 👉 ${lesson.watchPageUrl} #CBCKenya #TutorPeter #KJSEA2026`
            )}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-black text-white text-[11px] font-bold"
          >
            <Share2 className="w-3 h-3" />
            <span>Share Class</span>
          </a>

          <Link
            href={`/materials/${lesson.materialId}`}
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
          >
            <span>Buy Written Notes/Exam (KES {lesson.price}) →</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
