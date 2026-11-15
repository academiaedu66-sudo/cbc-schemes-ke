"use client";

import type { ResourceItem } from "./ResourceCard";
import { normalizeCategory, type MaterialCategory } from "@/lib/material-utils";

export interface MaterialAreaConfig {
  id: string;
  title: string;
  shortTitle: string;
  subtitle: string;
  filterCategory: MaterialCategory;
  color: string;
  bg: string;
  borderColor: string;
  badgeText: string;
  points: string[];
}

export const MATERIAL_AREAS: MaterialAreaConfig[] = [
  {
    id: "area-schemes",
    title: "SCHEMES OF WORK",
    shortTitle: "Schemes of Work",
    subtitle: "Editable 10-column KICD rationalized Word (.DOCX) schemes synced with approved Orange Book textbooks",
    filterCategory: "Schemes of Work",
    color: "#059669",
    bg: "#ecfdf5",
    borderColor: "#a7f3d0",
    badgeText: "DOCX • KES 50",
    points: [
      "Grade 1 to 12 KICD rationalized",
      "Term 1, Term 2 & Term 3 schemes",
      "Editable 10-column Word downloads",
    ],
  },
  {
    id: "area-lesson-plans",
    title: "CBC LESSON PLANS",
    shortTitle: "Lesson Plans",
    subtitle: "Complete lesson-by-lesson ready-to-teach Word (.DOCX) plans rhyming 1:1 with the Schemes of Work",
    filterCategory: "Lesson Plans",
    color: "#0d9488",
    bg: "#f0fdfa",
    borderColor: "#99f6e4",
    badgeText: "DOCX • KES 70",
    points: [
      "Every lesson of every week covered",
      "Synced 1:1 with Schemes & Notes",
      "Editable Word ready to print",
    ],
  },
  {
    id: "area-notes",
    title: "TEACHERS' & LESSON NOTES",
    shortTitle: "Teachers' Notes",
    subtitle: "Comprehensive lesson-by-lesson chalkboard concept notes, worked examples & learner tasks (.PDF)",
    filterCategory: "Teachers' Notes",
    color: "#2563eb",
    bg: "#eff6ff",
    borderColor: "#bfdbfe",
    badgeText: "PDF • KES 100",
    points: [
      "Grade 1–12 lesson-by-lesson notes",
      "Aligned to KICD Orange Book pages",
      "Worked illustrations & activities",
    ],
  },
  {
    id: "area-records",
    title: "RECORDS OF WORK & RUBRICS",
    shortTitle: "Records of Work",
    subtitle: "Official TSC & KICD weekly and lesson-by-lesson work covered & EE/ME/AE/BE rubric trackers (.DOCX)",
    filterCategory: "Records of Work",
    color: "#d97706",
    bg: "#fffbeb",
    borderColor: "#fde68a",
    badgeText: "DOCX • KES 50",
    points: [
      "TSC & KICD lesson-by-lesson trackers",
      "EE / ME / AE / BE rubric columns",
      "Term 1, Term 2 & Term 3 Word docs",
    ],
  },
  {
    id: "area-exams",
    title: "EXAMS & MARKING SCHEMES",
    shortTitle: "Exams & Marking Schemes",
    subtitle: "Competency-based summative assessment papers with complete marking guides & scoring rubrics (.PDF)",
    filterCategory: "Revision Papers & Exams",
    color: "#e11d48",
    bg: "#fff1f2",
    borderColor: "#fecdd3",
    badgeText: "PDF • KES 100",
    points: [
      "KEYA, KPSEA, KJSEA & Senior School",
      "Term 1, Term 2 & Term 3 exams",
      "Complete rubric marking guides",
    ],
  },
  {
    id: "area-holidays",
    title: "HOLIDAY PACKS & CURRICULUM DESIGNS",
    shortTitle: "Holiday Packs & Designs",
    subtitle: "April, August & December holiday revision workbooks plus Full-Year (Terms 1–3) KICD Curriculum Designs (.PDF)",
    filterCategory: "Holiday Assignments & Designs",
    color: "#7c3aed",
    bg: "#f5f3ff",
    borderColor: "#ddd6fe",
    badgeText: "PDF • KES 70",
    points: [
      "April, August & December packages",
      "Full-Year (Terms 1–3) KICD Designs",
      "Parent-guided competency tasks",
    ],
  },
];

interface CategoryGridProps {
  resources: ResourceItem[];
  selectedCategory: string;
  onSelectCategory: (category: string) => void;
}

export default function CategoryGrid({
  resources,
  selectedCategory,
  onSelectCategory,
}: CategoryGridProps) {
  function countMatching(cat: MaterialAreaConfig): number {
    return resources.filter(
      (r) => normalizeCategory(r.category) === cat.filterCategory
    ).length;
  }

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
          Curriculum Material Areas ({resources.length.toLocaleString()} Total Materials)
        </h2>
        {selectedCategory !== "All" && (
          <button
            type="button"
            onClick={() => onSelectCategory("All")}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Show All Grouped Areas
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {MATERIAL_AREAS.map((cat) => {
          const count = countMatching(cat);
          const isActive = selectedCategory === cat.filterCategory;

          return (
            <button
              key={cat.title}
              type="button"
              onClick={() => {
                onSelectCategory(isActive ? "All" : cat.filterCategory);
                document
                  .getElementById("materials-Catalog")
                  ?.scrollIntoView({ behavior: "smooth" });
              }}
              className={`text-left group relative flex flex-col justify-between p-5 bg-white border rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-150 ${
                isActive
                  ? "border-emerald-500 ring-2 ring-emerald-500/20"
                  : "border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center gap-3 mb-3">
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base shrink-0"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    ✓
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wide">
                      {cat.title}
                    </h3>
                    <span className="text-[11px] font-bold text-slate-400">
                      {cat.badgeText}
                    </span>
                  </div>
                </div>

                <ul className="space-y-1.5 mb-4 text-xs font-medium text-slate-600">
                  {cat.points.map((point, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <span style={{ color: cat.color }}>•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full flex items-center justify-between pt-3 border-t border-slate-100">
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                  style={{ backgroundColor: cat.bg, color: cat.color }}
                >
                  {count.toLocaleString()} Materials
                </span>
                <span
                  className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  style={{ color: cat.color }}
                >
                  {isActive ? "Viewing Area ✓" : "Open Area →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
