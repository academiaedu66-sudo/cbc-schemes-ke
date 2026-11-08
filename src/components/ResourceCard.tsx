"use client";

interface ResourceProps {
  id: string | number;
  title: string;
  category: string;
  grade: string;
  fileExt?: string;
  price: number;
  onBuy: (resource: any) => void;
}

export default function ResourceCard({
  id,
  title,
  category,
  grade,
  fileExt = "docx",
  price,
  onBuy,
}: ResourceProps) {
  const isDocx = fileExt.toLowerCase().includes("doc");

  return (
    <div className="flex items-start gap-4 p-4 bg-white border border-slate-200 rounded-xl shadow-sm hover:border-slate-300 transition">
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
        <h4 className="font-bold text-slate-900 text-sm leading-snug line-clamp-2 mb-1.5">
          {title}
        </h4>

        <div className="flex flex-wrap items-center gap-1.5 mb-3 text-[11px] font-medium text-slate-600">
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {category || "Schemes"}
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded text-slate-700">
            {grade || "Grade 7"}
          </span>
          <span
            className={`px-1.5 py-0.5 rounded font-bold uppercase text-[10px] ${
              isDocx ? "bg-blue-50 text-blue-700" : "bg-red-50 text-red-700"
            }`}
          >
            {isDocx ? "DOCX" : "PDF"}
          </span>
        </div>

        {/* Price & Buy Button */}
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-black text-emerald-700">
            KES {price}
          </span>
          <button
            onClick={() => onBuy({ id, title, price, fileExt })}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-3.5 py-1.5 rounded-lg shadow-sm transition"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}