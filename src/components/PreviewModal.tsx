"use client";

import React, { useEffect, useState } from "react";
import { Loader2, CheckCircle2, FileText, Lock, X } from "lucide-react";
import { formatTermLabel, getCbcLessonAllocation } from "@/lib/material-utils";
import type { ResourceItem } from "./ResourceCard";

interface PreviewData {
  id: string;
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  format: string;
  price: number;
  fileSizeKb: number | null;
  pageCount: number | null;
  description: string;
  strands: string[];
  sampleExcerpt: string;
}

interface PreviewModalProps {
  resource: ResourceItem | null;
  onClose: () => void;
  onBuy: (resource: ResourceItem) => void;
}

export default function PreviewModal({
  resource,
  onClose,
  onBuy,
}: PreviewModalProps) {
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!resource) {
      setPreview(null);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch(`/api/resources/preview?id=${encodeURIComponent(resource.id)}`)
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && !data.error) {
          setPreview(data as PreviewData);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch preview:", err);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [resource]);

  if (!resource) return null;

  const isDocx = resource.format.toLowerCase().includes("doc");
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(
    resource.grade,
    resource.subject
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-1.5">
              <span
                className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded ${
                  isDocx ? "bg-blue-600 text-white" : "bg-red-600 text-white"
                }`}
              >
                {resource.format}
              </span>
              <span className="text-xs text-emerald-300 font-semibold">
                Grade {resource.grade} ({resource.level}) • {formatTermLabel(resource.term)} • {lessonsPerWeek} Lessons/Wk ({minutesPerLesson}m)
              </span>
              {preview?.fileSizeKb && (
                <span className="text-xs text-slate-400">
                  • {preview.fileSizeKb} KB
                </span>
              )}
              {preview?.pageCount && (
                <span className="text-xs text-slate-400">
                  • {preview.pageCount} pages
                </span>
              )}
            </div>
            <h3 className="text-base md:text-lg font-bold leading-snug">
              {resource.title}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg transition shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 flex flex-col items-center justify-center text-slate-500 gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-emerald-600" />
              <p className="text-xs font-medium">Loading curriculum preview...</p>
            </div>
          ) : (
            <>
              {/* Overview */}
              <div>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 mb-1.5">
                  Material Overview
                </h4>
                <p className="text-sm text-slate-700 leading-relaxed">
                  {preview?.description ||
                    `Curriculum-aligned ${resource.category} for Grade ${resource.grade} ${resource.subject} (Term ${resource.term}).`}
                </p>
              </div>

              {/* Strands / Highlights */}
              {preview?.strands && preview.strands.length > 0 && (
                <div className="bg-emerald-50/70 border border-emerald-100 rounded-xl p-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-emerald-900 mb-2.5">
                    Strands &amp; What&apos;s Inside
                  </h4>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {preview.strands.map((item, idx) => (
                      <li
                        key={idx}
                        className="flex items-start gap-2 text-xs text-slate-700 font-medium"
                      >
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Watermarked Sample Excerpt */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                    Document Sample Excerpt
                  </h4>
                  <span className="text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-semibold flex items-center gap-1">
                    <Lock className="w-3 h-3" />
                    Preview Sample
                  </span>
                </div>
                <div className="relative bg-slate-50 border border-slate-200 rounded-xl p-4 font-mono text-xs text-slate-700 whitespace-pre-wrap leading-relaxed max-h-56 overflow-hidden select-none">
                  {preview?.sampleExcerpt}
                  <div className="absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-slate-50 via-slate-50/90 to-transparent flex items-end justify-center pb-2">
                    <span className="text-[11px] font-bold text-slate-500">
                      Full {resource.format} unlocked immediately after M-Pesa payment
                    </span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Footer CTA */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <span className="text-xs text-slate-500 block">
              Instant M-Pesa Express Download
            </span>
            <span className="text-xl font-black text-emerald-800">
              KES {resource.price}
            </span>
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-600 hover:bg-slate-100 transition"
            >
              Close
            </button>
            <button
              type="button"
              onClick={() => {
                onClose();
                onBuy(resource);
              }}
              className="flex-1 sm:flex-initial bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow-sm transition"
            >
              Buy &amp; Download Full {resource.format} (KES {resource.price})
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
