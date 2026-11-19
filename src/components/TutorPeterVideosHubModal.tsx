'use client';

import React, { useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  ExternalLink,
  Film,
  Loader2,
  Play,
  Search,
  Sparkles,
  UploadCloud,
  Video,
  X,
} from 'lucide-react';
import type { ResourceItem } from './ResourceCard';
import TutorPeterWhiteboardPlayer, {
  recordTutorPeterYoutubeVideo,
} from './TutorPeterWhiteboardPlayer';
import { buildTutorPeterWhiteboardLesson } from '@/lib/tutor-peter-videos';
import { formatGradeLabel, getResourceGradeKey } from '@/lib/material-utils';

export default function TutorPeterVideosHubModal({
  isOpen,
  onClose,
  resources,
  initialResource,
}: {
  isOpen: boolean;
  onClose: () => void;
  resources: ResourceItem[];
  initialResource?: ResourceItem | null;
}) {
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('All');
  const [selectedItem, setSelectedItem] = useState<ResourceItem | null>(
    initialResource || null
  );

  // Batch Auto-Post Queue State (Automatically renders & uploads videos for multiple materials!)
  const [isBatchRunning, setIsBatchRunning] = useState(false);
  const [batchStatus, setBatchStatus] = useState('');
  const [batchDoneCount, setBatchDoneCount] = useState(0);
  const stopBatchRef = useRef(false);

  const activeResource =
    initialResource && (!selectedItem || selectedItem.id !== initialResource.id)
      ? selectedItem || initialResource
      : selectedItem || resources[0] || null;

  const filteredList = useMemo(() => {
    const q = search.trim().toLowerCase();
    return resources
      .filter((r) => {
        if (gradeFilter !== 'All' && getResourceGradeKey(r) !== gradeFilter) {
          return false;
        }
        if (
          q &&
          !r.title.toLowerCase().includes(q) &&
          !(r.subject || '').toLowerCase().includes(q) &&
          !(r.category || '').toLowerCase().includes(q)
        ) {
          return false;
        }
        return true;
      })
      .slice(0, 60);
  }, [gradeFilter, resources, search]);

  const handleBatchAutoPostFiltered = async (count = 5) => {
    if (filteredList.length === 0) return;
    stopBatchRef.current = false;
    setIsBatchRunning(true);
    setBatchDoneCount(0);

    const targets = filteredList.slice(0, count);
    for (let i = 0; i < targets.length; i++) {
      if (stopBatchRef.current) break;
      const item = targets[i];
      setSelectedItem(item);
      const lesson = buildTutorPeterWhiteboardLesson(item);
      setBatchStatus(
        `Auto-Batch (${i + 1}/${targets.length}): Recording Tutor Peter Whiteboard Class for "${item.title.slice(
          0,
          45
        )}…" `
      );
      try {
        const { blob, filename, mimeType } = await recordTutorPeterYoutubeVideo(
          lesson
        );
        setBatchStatus(
          `Auto-Batch (${i + 1}/${targets.length}): Auto-Posting "${item.title.slice(
            0,
            40
          )}…" to YouTube, Video CDN, Video Sitemap & Social Sites…`
        );
        const fd = new FormData();
        fd.append('video', new File([blob], filename, { type: mimeType }));
        fd.append('materialId', item.id);
        fd.append('title', item.title);
        fd.append('grade', String(item.grade));
        fd.append('category', item.category);
        fd.append('subject', item.subject);
        fd.append('term', String(item.term));
        fd.append('price', String(item.price));

        await fetch('/api/videos/youtube-upload', {
          method: 'POST',
          body: fd,
        });
        setBatchDoneCount(i + 1);
      } catch {}
    }

    setIsBatchRunning(false);
    setBatchStatus(
      `Batch complete! Published & indexed ${targets.length} Tutor Peter Whiteboard Videos in /video-sitemap.xml & connected channels!`
    );
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Tutor Peter Whiteboard Class Videos Hub"
      className="fixed inset-0 z-[115] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-2 sm:p-5 overflow-y-auto"
    >
      <div className="bg-slate-50 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-y-auto border-2 border-red-500/40 shadow-2xl">
        {/* Top Classroom Header */}
        <div className="sticky top-0 z-20 bg-slate-950 text-white px-4 sm:px-6 py-4 border-b border-emerald-500/30 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/images/tutor-peter-portrait.jpg"
              alt="Tutor Peter"
              className="w-11 h-11 rounded-full object-cover border-2 border-amber-400 shrink-0"
            />
            <div>
              <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-amber-300">
                <Video className="w-3.5 h-3.5 text-red-500" />
                <span>
                  TUTOR PETER&apos;S WHITEBOARD CLASSROOM • ALL{' '}
                  {resources.length.toLocaleString()}+ MATERIALS
                </span>
              </div>
              <h2 className="text-sm sm:text-lg font-black">
                &ldquo;Tutor Peter here, welcome to our today&apos;s
                class!&rdquo;
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/videos"
              target="_blank"
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold"
            >
              <span>Public Video SEO Hub</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
            <a
              href="/video-sitemap.xml"
              target="_blank"
              rel="noreferrer"
              className="hidden md:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/30 text-emerald-200 text-xs font-bold"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Video Sitemap</span>
            </a>
            <button
              type="button"
              onClick={() => {
                stopBatchRef.current = true;
                onClose();
              }}
              className="p-2 rounded-xl bg-white/10 hover:bg-red-600 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main 2-Column Body: Active Whiteboard Player + All-Materials Selector */}
        <div className="p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left 8 Cols: Active Tutor Peter Whiteboard Player */}
          <div className="lg:col-span-8 space-y-4">
            {activeResource ? (
              <TutorPeterWhiteboardPlayer
                key={activeResource.id}
                material={activeResource}
                autoPlayOnMount={Boolean(initialResource)}
              />
            ) : (
              <div className="p-10 text-center text-sm text-slate-500">
                Select any material on the right to start Tutor Peter&apos;s
                whiteboard demonstration.
              </div>
            )}
          </div>

          {/* Right 4 Cols: All 6,534+ Materials Video Selector + Auto-Batch Uploader */}
          <div className="lg:col-span-4 space-y-3">
            <div className="rounded-2xl bg-slate-900 text-white p-3.5 space-y-2.5 border border-red-500/30">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <UploadCloud className="w-4 h-4 text-red-400" />
                  <span>Auto-Post Batch Queue (YouTube + All Sites)</span>
                </span>
                <span className="text-[10px] font-bold bg-white/10 px-2 py-0.5 rounded">
                  {batchDoneCount} Done
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Automatically renders &amp; publishes Tutor Peter&apos;s 16:9 HD
                whiteboard videos for the filtered materials below.
              </p>
              {isBatchRunning ? (
                <button
                  type="button"
                  onClick={() => {
                    stopBatchRef.current = true;
                    setIsBatchRunning(false);
                  }}
                  className="w-full py-2 rounded-xl bg-rose-600 text-white text-xs font-black flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Stop Batch Queue</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handleBatchAutoPostFiltered(5)}
                  className="w-full py-2 rounded-xl bg-gradient-to-r from-red-600 to-amber-500 hover:brightness-105 text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Video className="w-4 h-4" />
                  <span>Auto-Render &amp; Post Next 5 Videos</span>
                </button>
              )}
              {batchStatus && (
                <p className="text-[11px] text-emerald-300 font-semibold flex items-start gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  <span>{batchStatus}</span>
                </p>
              )}
            </div>

            {/* Search & Grade Filter */}
            <div className="rounded-2xl bg-white border border-slate-200 p-3 space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search any CBC material, subject or exam…"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 text-xs"
                />
              </div>
              <select
                value={gradeFilter}
                onChange={(e) => setGradeFilter(e.target.value)}
                aria-label="Filter videos by grade"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-bold bg-slate-50"
              >
                <option value="All">All Grades (PP1 – Grade 12)</option>
                <option value="PP1">PP1</option>
                <option value="PP2">PP2</option>
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((g) => (
                  <option key={g} value={String(g)}>
                    Grade {g}
                  </option>
                ))}
              </select>
            </div>

            {/* Scrollable Material Video Playlist */}
            <div className="space-y-2 max-h-[430px] overflow-y-auto pr-1">
              {filteredList.map((item) => {
                const active = activeResource?.id === item.id;
                const gBadge = formatGradeLabel(getResourceGradeKey(item));
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedItem(item)}
                    className={`w-full text-left p-3 rounded-2xl border transition flex items-start gap-2.5 cursor-pointer ${
                      active
                        ? 'bg-emerald-950 text-white border-emerald-500 shadow-md'
                        : 'bg-white hover:bg-emerald-50/60 text-slate-900 border-slate-200'
                    }`}
                  >
                    <span
                      className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                        active
                          ? 'bg-red-600 text-white'
                          : 'bg-red-50 text-red-600 border border-red-200'
                      }`}
                    >
                      {active ? (
                        <Play className="w-3.5 h-3.5 fill-current" />
                      ) : (
                        <Film className="w-3.5 h-3.5" />
                      )}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-bold line-clamp-2 leading-snug">
                        {item.title}
                      </p>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1 text-[10px] font-semibold opacity-80">
                        <span>{gBadge}</span>
                        <span>•</span>
                        <span>{item.subject}</span>
                        <span>•</span>
                        <span>0:36 Whiteboard</span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
