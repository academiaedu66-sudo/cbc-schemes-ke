import Link from "next/link";

interface Category {
  title: string;
  href: string;
  count: number;
  color: string;
  bg: string;
  points: string[];
}

const CATEGORIES: Category[] = [
  {
    title: "SCHEMES OF WORK",
    href: "#",
    count: 764,
    color: "#10b981",
    bg: "#ecfdf5",
    points: [
      "Grade 1 to 9 & Form 1 to 4",
      "Term 1, Term 2 & Term 3 schemes",
      "Editable Word & PDF downloads",
    ],
  },
  {
    title: "LESSON PLANS",
    href: "#",
    count: 534,
    color: "#14b8a6",
    bg: "#f0fdfa",
    points: [
      "CBC-aligned 5E lesson designs",
      "Detailed learning activities",
      "Ready to print & customize",
    ],
  },
  {
    title: "EXAMS & ASSESSMENTS",
    href: "#",
    count: 493,
    color: "#e11d48",
    bg: "#fff1f2",
    points: [
      "Top national school mocks",
      "Question papers with answers",
      "All education levels covered",
    ],
  },
  {
    title: "PRIMARY NOTES",
    href: "#",
    count: 104,
    color: "#2563eb",
    bg: "#eff6ff",
    points: [
      "Grade 1 to 6 CBC syllabus",
      "Clear summaries & illustrations",
      "Topical revision questions",
    ],
  },
  {
    title: "JSS NOTES & BOOKLETS",
    href: "#",
    count: 68,
    color: "#d97706",
    bg: "#fffbeb",
    points: [
      "Grade 7, 8 & 9 learning areas",
      "Comprehensive subject booklets",
      "Key terms & quick summaries",
    ],
  },
  {
    title: "KCSE REVISION EXAMS",
    href: "#",
    count: 482,
    color: "#dc2626",
    bg: "#fef2f2",
    points: [
      "National schools joint mock trials",
      "KCSE prediction papers with answers",
      "Topic-by-topic revision booklets",
    ],
  },
];

export default function CategoryGrid() {
  return (
    <section className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 pb-2 border-b border-slate-200">
        <h2 className="text-lg font-black tracking-tight text-slate-900 uppercase">
          Browse by Category
        </h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
        {CATEGORIES.map((cat) => (
          <div
            key={cat.title}
            className="group relative flex flex-col justify-between p-5 bg-white border border-slate-200 rounded-2xl shadow-sm hover:shadow-md hover:-translate-y-0.5 transition duration-150"
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

            <div className="flex items-center justify-between pt-3 border-t border-slate-100">
              <span
                className="text-[10px] font-bold px-2 py-0.5 rounded uppercase"
                style={{ backgroundColor: cat.bg, color: cat.color }}
              >
                {cat.count} Resources
              </span>
              <span
                className="text-xs font-bold flex items-center gap-1 group-hover:translate-x-1 transition-transform"
                style={{ color: cat.color }}
              >
                Explore &rarr;
              </span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}