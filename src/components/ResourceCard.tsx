"use client";

import { Eye } from "lucide-react";
import { formatTermLabel } from "@/lib/material-utils";

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
  const termText = formatTermLabel(resource.term);

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-emerald-300 hover:shadow-md transition">
      {/* File Badge Icon */}
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center font-extrabold text-[11px] text-white shrink-0 ${
          isDocx ? "bg-blue-600" : "bg-red-600"
        }`}
      >
        {isDocx ? "DOCX" : "PDF"}
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
          <span className="bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded font-semibold">
            Grade {resource.grade}
          </span>
          <span className="bg-amber-50 text-amber-800 border border-amber-200/70 px-2 py-0.5 rounded font-semibold">
            {termText}
          </span>
          {resource.subject && (
            <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
              {resource.subject}
            </span>
          )}
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-600">
            {resource.category === "Teachers' Notes"
              ? "Lesson Notes"
              : resource.category}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
              isDocx ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isDocx ? "DOCX" : "PDF"}
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
