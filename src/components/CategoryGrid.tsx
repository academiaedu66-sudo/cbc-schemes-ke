"use client";

import type { ResourceItem } from "./ResourceCard";
import { normalizeCategory } from "@/lib/material-utils";

interface CategoryCardConfig {
  title: string;
  filterCategory: string;
  color: string;
  bg: string;
  points: string[];
}

const CATEGORIES: CategoryCardConfig[] = [
  {
    title: "SCHEMES OF WORK",
    filterCategory: "Schemes of Work",
    color: "#10b981",
    bg: "#ecfdf5",
    points: [
      "Grade 1 to 12 KICD rationalized",
      "Term 1, Term 2 & Term 3 schemes",
      "Editable 10-column Word downloads",
    ],
  },
  {
    title: "LESSON PLANS",
    filterCategory: "Lesson Plans",
    color: "#14b8a6",
    bg: "#f0fdfa",
    points: [
      "CBC-aligned daily & weekly plans",
      "Term 1, Term 2 & Term 3 sub-strands",
      "Editable Word ready to print",
    ],
  },
  {
    title: "LESSON NOTES & BOOKLETS",
    filterCategory: "Teachers' Notes",
    color: "#2563eb",
    bg: "#eff6ff",
    points: [
      "Grade 1–12 comprehensive notes",
      "All 3 Terms strands & activities",
      "Topical review questions included",
    ],
  },
  {
    title: "EXAMS & MARKING SCHEMES",
    filterCategory: "Revision Papers & Exams",
    color: "#e11d48",
    bg: "#fff1f2",
    points: [
      "KEYA, KPSEA, KJSEA & Senior School",
      "Term 1, Term 2 & Term 3 exams",
      "Complete rubric marking guides",
    ],
  },
  {
    title: "RECORDS OF WORK & RUBRICS",
    filterCategory: "Records of Work",
    color: "#d97706",
    bg: "#fffbeb",
    points: [
      "TSC & KICD weekly trackers",
      "EE / ME / AE / BE rubric columns",
      "Term 1, Term 2 & Term 3 Word docs",
    ],
  },
  {
    title: "HOLIDAY PACKS & DESIGNS",
    filterCategory: "Holiday Assignments & Designs",
    color: "#7c3aed",
    bg: "#f5f3ff",
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
  function countMatching(cat: CategoryCardConfig): number {
    return resources.filter(
      (r) => normalizeCategory(r.category) === cat.filterCategory
    ).length;
  }

  return (
    <section className="py-4">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
          Browse by Category ({resources.length.toLocaleString()} Total Materials)
        </h2>
        {selectedCategory !== "All" && (
          <button
            type="button"
            onClick={() => onSelectCategory("All")}
            className="text-xs font-bold text-emerald-700 hover:underline"
          >
            Show All Categories
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => {
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
                    className="w-10 h-10 rounded-xl flex items-center justify-center font-bold text-base"
                    style={{ backgroundColor: cat.bg, color: cat.color }}
                  >
                    ✓
                  </div>
                  <h3 className="font-extrabold text-sm uppercase text-slate-800 tracking-wide">
                    {cat.title}
                  </h3>
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
                  {count.toLocaleString()} Resources
                </span>
                <span
                  className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                  style={{ color: cat.color }}
                >
                  {isActive ? "Selected ✓" : "Explore →"}
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}
