"use client";

import React, { useState } from "react";
import {
  Calendar,
  Bell,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  CheckCircle2,
  Award,
} from "lucide-react";
import type { ExamSubFilter } from "@/lib/material-utils";
import { useMonetization } from "@/components/MonetizationEngine";

interface EducationUpdatesHubProps {
  onQuickJump: (opts: {
    grade?: string;
    term?: string;
    category?: string;
    examSubFilter?: ExamSubFilter;
  }) => void;
}

const MOE_2026_CALENDAR = [
  {
    term: "1",
    title: "Term 1 (2026)",
    dates: "Jan 5 – Apr 2, 2026",
    weeks: "13 Weeks",
    halfTerm: "Half-Term: Feb 25 – Mar 1",
    holiday: "April Holiday: Apr 4 – Apr 26 (3 Wks)",
    accent: "border-emerald-200 bg-emerald-50/70 text-emerald-900",
    btnClass: "bg-emerald-700 hover:bg-emerald-800 text-white",
  },
  {
    term: "2",
    title: "Term 2 (2026)",
    dates: "Apr 27 – Jul 31, 2026",
    weeks: "14 Weeks",
    halfTerm: "Half-Term: Jun 24 – Jun 28",
    holiday: "August Holiday: Aug 1 – Aug 23 (3 Wks)",
    accent: "border-teal-200 bg-teal-50/70 text-teal-900",
    btnClass: "bg-teal-700 hover:bg-teal-800 text-white",
  },
  {
    term: "3",
    title: "Term 3 & KNEC CBA (2026)",
    dates: "Aug 24 – Oct 23, 2026",
    weeks: "9 Weeks",
    halfTerm: "KPSEA & KJSEA: Oct 26 – Nov 2, 2026",
    holiday: "End-Year Holiday: Oct 26 – Jan 2027",
    accent: "border-amber-200 bg-amber-50/80 text-amber-950",
    btnClass: "bg-amber-700 hover:bg-amber-800 text-white",
  },
];

export default function EducationUpdatesHub({
  onQuickJump,
}: EducationUpdatesHubProps) {
  const [expanded, setExpanded] = useState(false);
  const { trackInteraction } = useMonetization();

  const jumpAndScroll = (opts: {
    grade?: string;
    term?: string;
    category?: string;
    examSubFilter?: ExamSubFilter;
  }) => {
    trackInteraction("moe_hub_quickjump");
    onQuickJump(opts);
    document
      .getElementById("materials-Catalog")
      ?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      aria-label="2026 MoE School Calendar & TSC Quick Updates"
      className="mb-6 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden"
    >
      {/* Compact Always-Visible Top Strip */}
      <div className="px-4 py-3 bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1.5 bg-amber-400 text-slate-950 font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider text-[10px]">
            <Bell className="w-3 h-3" />
            2026 MoE &amp; TSC Desk
          </span>
          <span className="font-semibold text-emerald-200">
            Term 1: Jan 5–Apr 2 (13w) • Term 2: Apr 27–Jul 31 (14w) • Term 3:
            Aug 24–Oct 23 (9w) • KPSEA/KJSEA: Oct 26
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() =>
              jumpAndScroll({
                grade: "PP1",
                category: "All",
                examSubFilter: "ALL",
              })
            }
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-emerald-200 transition cursor-pointer"
          >
            PP1 &amp; PP2 Packs
          </button>
          <button
            type="button"
            onClick={() =>
              jumpAndScroll({
                grade: "6",
                category: "Revision Papers & Exams",
                examSubFilter: "KPSEA",
              })
            }
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 border border-rose-400/30 text-rose-200 transition cursor-pointer"
          >
            KPSEA Trials
          </button>
          <button
            type="button"
            onClick={() =>
              jumpAndScroll({
                grade: "9",
                category: "Revision Papers & Exams",
                examSubFilter: "KJSEA",
              })
            }
            className="text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/30 text-amber-200 transition cursor-pointer"
          >
            KJSEA Past &amp; Trials
          </button>
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="inline-flex items-center gap-1 text-[11px] font-extrabold px-3 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
          >
            <Calendar className="w-3.5 h-3.5" />
            {expanded ? "Hide Calendar & Portals" : "2026 Dates & TSC Portals"}
            {expanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Expandable 2026 MoE Calendar + TSC/KNEC Notices & Official Portals */}
      {expanded && (
        <div className="p-5 space-y-5 bg-slate-50/60 border-t border-slate-200">
          {/* 2026 Official MoE Term Dates Grid */}
          <div>
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-700 mb-3 flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-emerald-700" />
              Official 2026 Ministry of Education (MoE) Term Dates (PP1 – Grade
              12)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {MOE_2026_CALENDAR.map((item) => (
                <div
                  key={item.term}
                  className={`rounded-xl border p-4 flex flex-col justify-between gap-3 ${item.accent}`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-sm">{item.title}</span>
                      <span className="text-[11px] font-extrabold px-2 py-0.5 rounded bg-white/80">
                        {item.weeks}
                      </span>
                    </div>
                    <p className="text-xs font-bold">{item.dates}</p>
                    <p className="text-[11px] opacity-85">{item.halfTerm}</p>
                    <p className="text-[11px] font-semibold opacity-90">
                      {item.holiday}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      jumpAndScroll({
                        term: item.term,
                        category: "All",
                        examSubFilter: "ALL",
                      })
                    }
                    className={`w-full py-1.5 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${item.btnClass}`}
                  >
                    Open Term {item.term} Materials →
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* TSC / KICD / KNEC Teacher Updates + Quick Portal Links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 pt-2 border-t border-slate-200">
            <div className="bg-white rounded-xl border border-slate-200 p-4 space-y-2.5">
              <h4 className="text-xs font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-emerald-600" />
                TSC TPAD, KICD &amp; KNEC Compliance Briefs
              </h4>
              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>TPAD2 Classroom Observation:</strong> Schemes of
                    Work, Lesson Plans &amp; Records of Work must match KICD
                    Orange Book pages 1:1.{" "}
                    <button
                      type="button"
                      onClick={() =>
                        jumpAndScroll({
                          category: "Schemes of Work",
                          examSubFilter: "ALL",
                        })
                      }
                      className="font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Browse TPAD-Ready Schemes
                    </button>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Senior School Grade 10 Pathways:</strong> Complete
                    STEM, Social Sciences &amp; Arts/Sports packs ready in{" "}
                    <strong>Editable DOCX + PDF</strong>.{" "}
                    <button
                      type="button"
                      onClick={() =>
                        jumpAndScroll({
                          grade: "10",
                          category: "All",
                          examSubFilter: "ALL",
                        })
                      }
                      className="font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Open Grade 10 Hub
                    </button>
                  </span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>
                    <strong>Termly CBA &amp; National Trials:</strong> Opener,
                    Mid-Term, End-Term, KEYA, KPSEA &amp; KJSEA sets with
                    complete Marking Schemes.{" "}
                    <button
                      type="button"
                      onClick={() =>
                        jumpAndScroll({
                          category: "Revision Papers & Exams",
                          examSubFilter: "ALL",
                        })
                      }
                      className="font-bold text-emerald-700 underline cursor-pointer"
                    >
                      Open Exams &amp; Trials
                    </button>
                  </span>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-xl border border-slate-200 p-4 flex flex-col justify-between gap-3">
              <div>
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-2">
                  Official Kenyan Teacher Portals (Quick Links)
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Direct shortcuts to official TSC, KNEC CBA, and KICD portals
                  plus Dual-Format (`DOCX + PDF`) school header customization:
                </p>
                <div className="grid grid-cols-2 gap-2">
                  <a
                    href="https://tpad2.tsc.go.ke/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackInteraction("portal_tsc_tpad2")}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-bold text-slate-700 transition"
                  >
                    <span>TSC TPAD 2 Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a
                    href="https://tpay.tsc.go.ke/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackInteraction("portal_tsc_tpay")}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-bold text-slate-700 transition"
                  >
                    <span>TSC T-PAY Payslips</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a
                    href="https://cba.knec.ac.ke/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackInteraction("portal_knec_cba")}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-bold text-slate-700 transition"
                  >
                    <span>KNEC CBA Portal</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                  <a
                    href="https://kicd.ac.ke/cbc-materials/approved-cbc-course-materials/"
                    target="_blank"
                    rel="noreferrer"
                    onClick={() => trackInteraction("portal_kicd_orangebook")}
                    className="flex items-center justify-between px-3 py-2 rounded-lg border border-slate-200 hover:border-emerald-400 hover:bg-emerald-50/50 text-xs font-bold text-slate-700 transition"
                  >
                    <span>KICD Orange Book</span>
                    <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
                  </a>
                </div>
              </div>
              <p className="text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200/80 rounded-lg px-3 py-1.5">
                Every material below unlocks in BOTH Editable Microsoft Word
                (.DOCX) and Print-Ready (.PDF) at no extra cost!
              </p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
