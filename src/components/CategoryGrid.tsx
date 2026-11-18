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
    id: "area-book-grade-up",
    title: "1. CBC GRADE UP (50-PAGE BOOKS)",
    shortTitle: "1. CBC Grade Up (KSh 500)",
    subtitle: "Complete Short Point-Form Notes (12+ pts/Sub-strand, 30+ pts/Strand across ALL Strands) + Exam Questions + End-of-Book Marking Schemes",
    filterCategory: "CBC GRADE UP (50-Page Books)",
    color: "#047857",
    bg: "#ecfdf5",
    borderColor: "#34d399",
    badgeText: "TERM: KES 500 • ALL: KES 600",
    points: [
      "Term 1, 2, 3 (KSh 500) or All Terms (+20% = KSh 600)",
      "12+ Detailed Points/Sub-strand + Valid Examples",
      "Auto-Generated Questions + Marking Schemes",
    ],
  },
  {
    id: "area-book-made-familiar",
    title: "2. SUPER-LIGHT CBC COMPILATION",
    shortTitle: "2. Super-Light CBC (KSh 750)",
    subtitle: "In-Depth Point-Form Short Notes (12+ pts/Sub-strand, 30+ pts/Strand across ALL Strands) + Immediate Topical Questions after every Sub-strand",
    filterCategory: "SUPER-LIGHT CBC COMPILATION (50p)",
    color: "#1d4ed8",
    bg: "#eff6ff",
    borderColor: "#60a5fa",
    badgeText: "TERM: KES 750 • ALL: KES 900",
    points: [
      "Term 1, 2, 3 (KSh 750) or All Terms (+20% = KSh 900)",
      "Detailed Point-Form Scope + Valid Examples on Each Point",
      "Topical Questions right after every Sub-strand",
    ],
  },
  {
    id: "area-book-compilation",
    title: "3. SMART CBC ALL SUBJECTS",
    shortTitle: "3. Smart CBC All Subjects (KSh 1,500)",
    subtitle: "Master Compilation combining SUPER-LIGHT CBC COMPILATION + CBC GRADE UP (All Strands Short Notes, 300+ Zero-Repeat Qs & Marking Schemes)",
    filterCategory: "SMART CBC ALL SUBJECTS (100p)",
    color: "#7e22ce",
    bg: "#faf5ff",
    borderColor: "#c084fc",
    badgeText: "TERM: KES 1,500 • ALL: KES 1,800",
    points: [
      "Term 1, 2, 3 (KSh 1,500) or All Terms (+20% = KSh 1,800)",
      "Zero-repeat Detailed Notes, Valid Examples & Qs",
      "Unlocks ALL subjects in Grade (.PDF + .DOCX)",
    ],
  },
  {
    id: "area-national-kjsea",
    title: "NATIONAL KJSEA EXAMINATION (ALL GRADES)",
    shortTitle: "NATIONAL KJSEA EXAMINATION (ALL GRADES)",
    subtitle: "KENYA NATIONAL KJSEA TEST across PP1–Grade 12: 20 Zero-Repeat Questions covering ALL Strands (2 Hours, KNEC Cover) + Separate Marking Schemes",
    filterCategory: "NATIONAL KJSEA EXAMINATION (ALL GRADES)",
    color: "#be123c",
    bg: "#fff1f2",
    borderColor: "#fb7185",
    badgeText: "EXAM: KES 50 • MARKING SCHEME: KES 50",
    points: [
      "KENYA NATIONAL KJSEA TEST (20 Qs • 2 Hours • KNEC Cover)",
      "Exam Paper: KSh 50 • Official Marking Scheme: KSh 50",
      "All Grades (PP1–G12) + Pure Kiswahili Sanifu Papers",
    ],
  },
  {
    id: "area-schemes",
    title: "SCHEMES OF WORK",
    shortTitle: "Schemes of Work",
    subtitle: "Editable 10-column KICD rationalized schemes (PP1–Grade 12) synced with Orange Book textbooks in DOCX + PDF",
    filterCategory: "Schemes of Work",
    color: "#059669",
    bg: "#ecfdf5",
    borderColor: "#a7f3d0",
    badgeText: "DOCX + PDF • KES 50",
    points: [
      "PP1, PP2 & Grade 1–12 KICD rationalized",
      "Term 1, Term 2 & Term 3 schemes",
      "Editable Word (.DOCX) + Print PDF",
    ],
  },
  {
    id: "area-lesson-plans",
    title: "CBC LESSON PLANS",
    shortTitle: "Lesson Plans",
    subtitle: "Complete lesson-by-lesson ready-to-teach plans (PP1–Grade 12) rhyming 1:1 with the Schemes of Work",
    filterCategory: "Lesson Plans",
    color: "#0d9488",
    bg: "#f0fdfa",
    borderColor: "#99f6e4",
    badgeText: "DOCX + PDF • KES 70",
    points: [
      "Every lesson of every week (PP1–G12)",
      "Synced 1:1 with Schemes & Notes",
      "Editable Word (.DOCX) + Print PDF",
    ],
  },
  {
    id: "area-notes",
    title: "TEACHERS' & LESSON NOTES",
    shortTitle: "Teachers' Notes",
    subtitle: "Comprehensive lesson-by-lesson chalkboard concept notes, worked examples & play/learner tasks in DOCX + PDF",
    filterCategory: "Teachers' Notes",
    color: "#2563eb",
    bg: "#eff6ff",
    borderColor: "#bfdbfe",
    badgeText: "DOCX + PDF • KES 100",
    points: [
      "PP1–Grade 12 lesson-by-lesson notes",
      "Aligned to KICD Orange Book pages",
      "Editable Word (.DOCX) + Print PDF",
    ],
  },
  {
    id: "area-records",
    title: "RECORDS OF WORK & RUBRICS",
    shortTitle: "Records of Work",
    subtitle: "Official TSC & KICD weekly and lesson-by-lesson work covered & EE/ME/AE/BE rubric trackers in DOCX + PDF",
    filterCategory: "Records of Work",
    color: "#d97706",
    bg: "#fffbeb",
    borderColor: "#fde68a",
    badgeText: "DOCX + PDF • KES 50",
    points: [
      "TSC TPAD lesson-by-lesson trackers",
      "EE / ME / AE / BE rubric columns",
      "Editable Word (.DOCX) + Print PDF",
    ],
  },
  {
    id: "area-exams",
    title: "EXAMS, KPSEA & KJSEA TRIALS",
    shortTitle: "Exams & Trials",
    subtitle: "Opener, Mid-Term & End-Term Exams plus KEYA, KPSEA, KJSEA & Senior School Past/Trial Papers with Marking Schemes",
    filterCategory: "Revision Papers & Exams",
    color: "#e11d48",
    bg: "#fff1f2",
    borderColor: "#fecdd3",
    badgeText: "DOCX + PDF • KES 100",
    points: [
      "Opener, Mid-Term & End-Term sets",
      "KPSEA, KJSEA & KEYA Past/Trial papers",
      "Editable Word (.DOCX) + Print PDF",
    ],
  },
  {
    id: "area-holidays",
    title: "HOLIDAY PACKS & CURRICULUM DESIGNS",
    shortTitle: "Holiday Packs & Designs",
    subtitle: "April, August & December holiday revision workbooks plus Full-Year (Terms 1–3) KICD Curriculum Designs (PP1–G12)",
    filterCategory: "Holiday Assignments & Designs",
    color: "#7c3aed",
    bg: "#f5f3ff",
    borderColor: "#ddd6fe",
    badgeText: "DOCX + PDF • KES 70",
    points: [
      "April, August & December packages",
      "Full-Year (Terms 1–3) KICD Designs",
      "Editable Word (.DOCX) + Print PDF",
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
