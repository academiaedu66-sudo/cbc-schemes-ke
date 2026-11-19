'use client';

import React, { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Film,
  Loader2,
  Music2,
  Play,
  Share2,
  Square,
} from 'lucide-react';
import type { OmnichannelButtonSeoPack } from '@/lib/social-seo-engine';

export async function renderVerticalSocialVideoFile(
  pack: OmnichannelButtonSeoPack,
  durationSeconds = 12,
  onProgress?: (pct: number) => void
): Promise<{ blob: Blob; filename: string; mimeType: string }> {
  const width = 720;
  const height = 1280;
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context unavailable');
  }

  // Load same-origin HD vertical poster image
  const localPosterSrc = pack.posterVerticalUrl.replace(
    'https://www.cbcmaterials.shop',
    ''
  );
  const img = await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Failed to load poster image'));
    image.src = localPosterSrc;
  });

  // Setup WebAudio mixing for the 5-star hotel soft song
  const AudioCtx =
    window.AudioContext ||
    (window as unknown as { webkitAudioContext: typeof AudioContext })
      .webkitAudioContext;
  const audioCtx = new AudioCtx();
  await audioCtx.resume();

  const audioEl = new Audio('/audio/whatsapp-status-soft-song.mp3');
  audioEl.crossOrigin = 'anonymous';
  audioEl.preload = 'auto';

  const dest = audioCtx.createMediaStreamDestination();
  const srcNode = audioCtx.createMediaElementSource(audioEl);
  const gainNode = audioCtx.createGain();
  gainNode.gain.value = 0.85;
  srcNode.connect(gainNode);
  gainNode.connect(dest);
  // Also play softly so the creator hears progress
  const monitorGain = audioCtx.createGain();
  monitorGain.gain.value = 0.25;
  srcNode.connect(monitorGain);
  monitorGain.connect(audioCtx.destination);

  const canvasStream = canvas.captureStream(30);
  const combinedTracks = [
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ];
  const combinedStream = new MediaStream(combinedTracks);

  const candidateTypes = [
    'video/mp4;codecs=avc1.42E01E,mp4a.40.2',
    'video/mp4',
    'video/webm;codecs=vp9,opus',
    'video/webm;codecs=vp8,opus',
    'video/webm',
  ];
  const chosenMime =
    candidateTypes.find((t) => MediaRecorder.isTypeSupported(t)) ||
    'video/webm';
  const ext = chosenMime.includes('mp4') ? 'mp4' : 'webm';

  const chunks: BlobPart[] = [];
  const recorder = new MediaRecorder(combinedStream, {
    mimeType: chosenMime,
    videoBitsPerSecond: 3_200_000,
  });

  recorder.ondataavailable = (ev) => {
    if (ev.data && ev.data.size > 0) {
      chunks.push(ev.data);
    }
  };

  const finishedPromise = new Promise<Blob>((resolve) => {
    recorder.onstop = () => {
      resolve(new Blob(chunks, { type: chosenMime }));
    };
  });

  await audioEl.play();
  recorder.start(250);

  const startMs = performance.now();
  const totalMs = durationSeconds * 1000;

  await new Promise<void>((resolve) => {
    const drawFrame = () => {
      const elapsed = performance.now() - startMs;
      const t = Math.min(1, elapsed / totalMs);
      if (onProgress) onProgress(Math.round(t * 100));

      // Subtle luxury Ken Burns zoom (1.0 -> 1.07)
      const zoom = 1 + 0.07 * t;
      const drawW = width * zoom;
      const drawH = height * zoom;
      const dx = (width - drawW) / 2;
      const dy = (height - drawH) / 2;

      ctx.fillStyle = '#020617';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, dx, dy, drawW, drawH);

      // Top High-Contrast OCR Search Pill (Indexed by TikTok OCR & Google Short Videos)
      ctx.fillStyle = 'rgba(2, 6, 23, 0.88)';
      ctx.beginPath();
      ctx.roundRect(36, 34, width - 72, 68, 34);
      ctx.fill();
      ctx.strokeStyle = '#fbbf24';
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.fillStyle = '#fef3c7';
      ctx.font = 'bold 23px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pack.ocrTopBanner, width / 2, 76);

      // Animated Golden Soundwave Equalizer Strip near bottom
      const eqY = height - 135;
      const barCount = 19;
      const barGap = 14;
      const totalBarWidth = barCount * barGap;
      const startX = (width - totalBarWidth) / 2;

      for (let i = 0; i < barCount; i++) {
        const amp =
          12 +
          26 * Math.abs(Math.sin(elapsed * 0.008 + i * 0.55)) *
            (0.6 + 0.4 * Math.cos(i * 0.3));
        ctx.fillStyle = i % 2 === 0 ? '#fbbf24' : '#34d399';
        ctx.fillRect(startX + i * barGap, eqY - amp / 2, 8, amp);
      }

      // Bottom Callout Ribbon
      ctx.fillStyle = 'rgba(6, 78, 59, 0.94)';
      ctx.beginPath();
      ctx.roundRect(28, height - 92, width - 56, 62, 18);
      ctx.fill();
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 21px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(pack.ocrBottomCta, width / 2, height - 53);

      if (elapsed < totalMs) {
        requestAnimationFrame(drawFrame);
      } else {
        resolve();
      }
    };
    requestAnimationFrame(drawFrame);
  });

  recorder.stop();
  audioEl.pause();
  const blob = await finishedPromise;
  await audioCtx.close().catch(() => {});

  const filename = `cbcmaterials-${pack.buttonId}-short.${ext}`;
  return { blob, filename, mimeType: chosenMime };
}

export default function SocialVerticalVideoStudio({
  pack,
}: {
  pack: OmnichannelButtonSeoPack;
}) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState(false);
  const [recordPct, setRecordPct] = useState(0);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState('');

  const toggleAudioPreview = () => {
    let audio = audioRef.current;
    if (!audio) {
      audio = new Audio('/audio/whatsapp-status-soft-song.mp3');
      audio.onended = () => setIsPlayingPreview(false);
      audioRef.current = audio;
    }
    if (isPlayingPreview) {
      audio.pause();
      setIsPlayingPreview(false);
    } else {
      audio.currentTime = 0;
      void audio.play();
      setIsPlayingPreview(true);
    }
  };

  const copyText = async (key: string, value: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2200);
    } catch {}
  };

  const handleGenerateAndDownloadVideo = async (shareNatively = false) => {
    setIsRecordingVideo(true);
    setRecordPct(0);
    setStatusMsg(
      'Rendering 12-second 9:16 HD Video + 5-Star Soft Song for TikTok, YouTube Shorts & Facebook Reels…'
    );
    try {
      const { blob, filename, mimeType } = await renderVerticalSocialVideoFile(
        pack,
        12,
        (pct) => setRecordPct(pct)
      );

      if (
        shareNatively &&
        typeof navigator !== 'undefined' &&
        typeof navigator.canShare === 'function'
      ) {
        const file = new File([blob], filename, { type: mimeType });
        if (navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: pack.youtubeTitle,
            text: pack.tiktokCaption,
            url: pack.clickableUrl,
            files: [file],
          });
          setStatusMsg('Video shared directly to your chosen social app!');
          return;
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
      setStatusMsg(
        `Saved ${filename}! Ready to upload to TikTok, YouTube Shorts, Facebook Reels & X.`
      );
    } catch (err: unknown) {
      setStatusMsg(
        err instanceof Error ? err.message : 'Video rendering failed'
      );
    } finally {
      setIsRecordingVideo(false);
    }
  };

  const localPosterUrl = pack.posterVerticalUrl.replace(
    'https://www.cbcmaterials.shop',
    ''
  );

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      {/* 9:16 Vertical Preview Frame */}
      <div className="lg:col-span-5 flex flex-col items-center">
        <div className="relative w-full max-w-[310px] aspect-[9/16] rounded-3xl overflow-hidden border-2 border-amber-400/60 bg-slate-950 shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={localPosterUrl}
            alt={pack.youtubeTitle}
            className={`w-full h-full object-cover transition-transform duration-[12000ms] ${
              isPlayingPreview ? 'scale-105' : 'scale-100'
            }`}
          />

          <div className="absolute top-3 inset-x-3 px-3 py-1.5 rounded-full bg-slate-950/90 border border-amber-300/60 text-[10px] font-black uppercase tracking-wider text-amber-200 text-center shadow-md">
            {pack.ocrTopBanner}
          </div>

          <div className="absolute bottom-3 inset-x-3 space-y-2">
            <button
              type="button"
              onClick={toggleAudioPreview}
              className="w-full py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
            >
              {isPlayingPreview ? (
                <>
                  <Square className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Stop 5-Star Song Preview</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5 fill-slate-950" />
                  <span>Play 9:16 Short + Soft Song</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Download Video + 4-Platform SEO Copy & Instant Launchers */}
      <div className="lg:col-span-7 space-y-4">
        <div className="rounded-2xl bg-slate-900 text-white border border-emerald-500/30 p-4 sm:p-5 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <Film className="w-5 h-5 text-amber-300" />
              <h3 className="font-black text-sm sm:text-base">
                9:16 Vertical Video + 5-Star Hotel Song Generator
              </h3>
            </div>
            <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
              TikTok • YouTube Shorts • FB Reels • X
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            Generates a ready-to-post vertical video combining this button&apos;s
            HD poster, Google OCR search banner, animated golden soundwave, and
            soft concierge music.
          </p>

          <div className="flex flex-wrap gap-2.5 pt-1">
            <button
              type="button"
              disabled={isRecordingVideo}
              onClick={() => void handleGenerateAndDownloadVideo(false)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-300 to-emerald-300 text-slate-950 font-black text-xs hover:brightness-105 disabled:opacity-60 transition cursor-pointer"
            >
              {isRecordingVideo ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Rendering Video ({recordPct}%)…</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>Download 9:16 Video + Song</span>
                </>
              )}
            </button>

            <button
              type="button"
              disabled={isRecordingVideo}
              onClick={() => void handleGenerateAndDownloadVideo(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 text-white font-bold text-xs disabled:opacity-60 transition cursor-pointer"
            >
              <Share2 className="w-4 h-4 text-amber-300" />
              <span>Share Video to Phone Apps</span>
            </button>
          </div>

          {statusMsg && (
            <p className="text-xs font-semibold text-amber-200 bg-white/5 rounded-lg px-3 py-2">
              {statusMsg}
            </p>
          )}
        </div>

        {/* 4 Platform Launch Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* TikTok */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">
                1. TikTok SEO Caption
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-slate-900 text-white">
                TIKTOK
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-3">
              {pack.tiktokCaption}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => void copyText('tt', pack.tiktokCaption)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
              >
                {copiedKey === 'tt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'tt' ? 'Copied!' : 'Copy Caption'}</span>
              </button>
              <a
                href={pack.shareIntents.tiktokUploadUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => void copyText('tt', pack.tiktokCaption)}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-950 hover:bg-slate-800 text-white font-bold text-[11px]"
              >
                <span>Upload</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* YouTube Shorts */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">
                2. YouTube Shorts SEO
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-red-600 text-white">
                YOUTUBE
              </span>
            </div>
            <p className="text-[11px] font-semibold text-slate-800 line-clamp-1">
              {pack.youtubeTitle}
            </p>
            <p className="text-[11px] text-slate-600 line-clamp-2">
              {pack.youtubeDescription}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  void copyText(
                    'yt',
                    `${pack.youtubeTitle}\n\n${pack.youtubeDescription}`
                  )
                }
                className="flex-1 inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] cursor-pointer"
              >
                {copiedKey === 'yt' ? (
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>{copiedKey === 'yt' ? 'Copied!' : 'Copy Title+Desc'}</span>
              </button>
              <a
                href={pack.shareIntents.youtubeStudioUploadUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() =>
                  void copyText(
                    'yt',
                    `${pack.youtubeTitle}\n\n${pack.youtubeDescription}`
                  )
                }
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-[11px]"
              >
                <span>YT Studio</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Facebook Reels & Feed */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">
                3. Facebook Reel &amp; Feed
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-[#1877F2] text-white">
                FACEBOOK
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-3">
              {pack.facebookPost}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={pack.shareIntents.facebookShareUrl}
                target="_blank"
                rel="noreferrer"
                onClick={() => void copyText('fb', pack.facebookPost)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-[#1877F2] hover:bg-[#166FE5] text-white font-bold text-[11px]"
              >
                <span>Share on Facebook</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* X / Twitter */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 space-y-2 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900">
                4. X (Twitter) Instant Post
              </span>
              <span className="text-[10px] font-black px-2 py-0.5 rounded bg-black text-white">
                X / TWITTER
              </span>
            </div>
            <p className="text-[11px] text-slate-600 line-clamp-3">
              {pack.xTweetText}
            </p>
            <div className="flex items-center gap-2 pt-1">
              <a
                href={pack.shareIntents.xTwitterIntentUrl}
                target="_blank"
                rel="noreferrer"
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 rounded-lg bg-black hover:bg-slate-800 text-white font-bold text-[11px]"
              >
                <Music2 className="w-3 h-3 text-amber-300" />
                <span>Post on X Now</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
