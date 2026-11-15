"use client";

import { Eye } from "lucide-react";
import {
  formatGradeLabel,
  formatTermLabel,
  getCbcLessonAllocation,
  getResourceGradeKey,
} from "@/lib/material-utils";

export interface ResourceItem {
  id: string;
  title: string;
  grade: number;
  level: string;
  category: string;
  subject: string;
  term: number;
  format: "DOCX" | "PDF";
  price: number;
  file_path?: string;
}

interface ResourceProps {
  resource: ResourceItem;
  onBuy: (resource: ResourceItem) => void;
  onPreview: (resource: ResourceItem) => void;
}

export default function ResourceCard({
  resource,
  onBuy,
  onPreview,
}: ResourceProps) {
  const isDocx = resource.format.toLowerCase().includes("doc");
  const gradeKey = getResourceGradeKey(resource);
  const gradeBadge = formatGradeLabel(gradeKey);
  const isPP = gradeKey === "PP1" || gradeKey === "PP2";
  const termText = formatTermLabel(resource.term);
  const { lessonsPerWeek, minutesPerLesson } = getCbcLessonAllocation(
    gradeKey,
    resource.subject
  );

  const lowerTitle = resource.title.toLowerCase();
  const examTag = lowerTitle.includes("opener")
    ? "Opener Exam"
    : lowerTitle.includes("mid-term")
    ? "Mid-Term Exam"
    : lowerTitle.includes("kpsea") &&
      (lowerTitle.includes("past") ||
        lowerTitle.includes("trial") ||
        lowerTitle.includes("mock"))
    ? "KPSEA National"
    : lowerTitle.includes("kjsea") &&
      (lowerTitle.includes("past") ||
        lowerTitle.includes("trial") ||
        lowerTitle.includes("mock"))
    ? "KJSEA National"
    : null;

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md transition">
      {/* Dual-Format File Badge Icon */}
      <div
        className={`w-12 h-12 rounded-lg flex flex-col items-center justify-center font-extrabold leading-tight text-white shrink-0 ${
          isDocx
            ? "bg-gradient-to-br from-blue-600 to-emerald-600"
            : "bg-gradient-to-br from-red-600 to-blue-700"
        }`}
      >
        <span className="text-[10px]">{isDocx ? "DOCX" : "PDF"}</span>
        <span className="text-[8px] opacity-90 border-t border-white/30 pt-0.5 mt-0.5">
          +{isDocx ? "PDF" : "DOCX"}
        </span>
      </div>

      {/* Details */}
      <div className="flex-1 min-w-0">
        <h4
          onClick={() => onPreview(resource)}
          className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1.5 cursor-pointer hover:text-emerald-700 transition-colors"
        >
          {resource.title}
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-medium text-slate-600">
          <span
            className={`px-2 py-0.5 rounded font-bold ${
              isPP
                ? "bg-purple-50 text-purple-800 border border-purple-200/80"
                : "bg-emerald-50 text-emerald-800"
            }`}
          >
            {gradeBadge}
          </span>
          <span className="bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded font-semibold">
            {termText}
          </span>
          {examTag && (
            <span className="bg-rose-50 text-rose-700 border border-rose-200 px-2 py-0.5 rounded font-bold">
              {examTag}
            </span>
          )}
          {resource.subject && (
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {resource.subject}
            </span>
          )}
          <span className="bg-teal-50 text-teal-800 border border-teal-200/70 px-2 py-0.5 rounded font-semibold">
            {lessonsPerWeek} Lessons/Wk ({minutesPerLesson}m)
          </span>
          <span className="px-1.5 py-0.5 rounded font-bold uppercase text-[10px] bg-blue-50 text-blue-700 border border-blue-200/70">
            DOCX + PDF
          </span>
        </div>

        {/* Price, Preview & Buy Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
          <span className="text-sm font-black text-emerald-700">
            KES {resource.price}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onPreview(resource)}
              className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs px-3 py-1.5 rounded-lg transition"
            >
              <Eye className="w-3.5 h-3.5" />
              Preview
            </button>
            <button
              type="button"
              onClick={() => onBuy(resource)}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition"
            >
              Buy Now
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
