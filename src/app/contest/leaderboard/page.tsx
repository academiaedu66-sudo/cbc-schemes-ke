// src/app/contest/leaderboard/page.tsx
"use client";

import React, { useEffect, useState } from "react";

const GRADES = ["ALL", "Grade 6", "Grade 7", "Grade 8", "Grade 9"];

const SUBJECTS = [
  "ALL",
  "Mathematics",
  "English",
  "Kiswahili",
  "Integrated Science",
  "Social Studies",
  "Pre-Technical Studies",
  "Agriculture & Nutrition",
  "Creative Arts & Sports",
  "CRE",
  "IRE",
];

/**
 * Public leaderboard page – shows confirmed participants filtered by Grade & Subject.
 */
export default function LeaderboardPage() {
  const [grade, setGrade] = useState("ALL");
  const [subject, setSubject] = useState("ALL");
  const [leaderboard, setLeaderboard] = useState<
    Array<{ name: string; school: string; grade?: string; subject?: string; marks: number | null }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/contest/leaderboard?subject=${encodeURIComponent(subject)}&grade=${encodeURIComponent(grade)}`
        );
        const data = await res.json();
        if (data.error) throw new Error(data.error);
        setLeaderboard(data.leaderboard ?? []);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : "Failed to load leaderboard");
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, [subject, grade]);

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h1 className="text-3xl font-bold">National Contest – Public Leaderboard</h1>
        <div className="flex gap-2">
          <select
            value={grade}
            onChange={(e) => setGrade(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {GRADES.map((g) => (
              <option key={g} value={g}>
                {g === "ALL" ? "All Grades (6–9)" : g}
              </option>
            ))}
          </select>
          <select
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            className="border rounded-lg px-3 py-2 text-sm bg-white"
          >
            {SUBJECTS.map((s) => (
              <option key={s} value={s}>
                {s === "ALL" ? "All Subjects" : s}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <p className="p-4">Loading leaderboard…</p>
      ) : error ? (
        <p className="p-4 text-red-600">{error}</p>
      ) : leaderboard.length === 0 ? (
        <p>No participants have been scored yet.</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-200">
              <th className="border p-2 text-left">Position</th>
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">School</th>
              <th className="border p-2 text-left">Grade</th>
              <th className="border p-2 text-left">Subject</th>
              <th className="border p-2 text-left">Marks (/100)</th>
            </tr>
          </thead>
          <tbody>
            {leaderboard.map((p, idx) => (
              <tr key={p.name + idx} className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                <td className="border p-2 font-bold">#{idx + 1}</td>
                <td className="border p-2">{p.name}</td>
                <td className="border p-2">{p.school}</td>
                <td className="border p-2">{p.grade || "Grade 7"}</td>
                <td className="border p-2">{p.subject || "Mathematics"}</td>
                <td className="border p-2 font-semibold">{p.marks ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
