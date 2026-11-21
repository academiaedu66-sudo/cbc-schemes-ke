'use client';

import React, { useState } from 'react';
import { CheckCircle2, Loader2, MessageCircle, ShieldCheck, Smartphone, X } from 'lucide-react';

interface AdvertiseCheckoutButtonProps {
  packageName: string;
  priceKesNumber: number;
  priceKesDisplay: string;
  period: string;
  serviceType: 'AD_PACKAGE_INFEED' | 'AD_PACKAGE_LEADERBOARD' | 'AD_PACKAGE_PREVIEW';
}

export default function AdvertiseCheckoutButton({
  packageName,
  priceKesNumber,
  priceKesDisplay,
  period,
  serviceType,
}: AdvertiseCheckoutButtonProps) {
  const [open, setOpen] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const waHref = `https://wa.me/254728595160?text=${encodeURIComponent(
    `Hello! I want to request owner approval to book the "${packageName}" (KES ${priceKesDisplay} ${period}) slot on CBCMATERIALS.SHOP${orgName.trim() ? ` for ${orgName.trim()}` : ''}.`
  )}`;

  const handleStkCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setStatusMsg(null);
    try {
      const res = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: phone.trim(),
          serviceType,
          buyerName: orgName.trim(),
          bookTitle: `${packageName}${orgName.trim() ? ` — ${orgName.trim()}` : ''} (Owner Approval Required • KES ${priceKesDisplay})`,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setStatusMsg({
          ok: false,
          text: data.error || 'Could not initiate M-Pesa prompt. Please check your phone number.',
        });
        return;
      }
      setStatusMsg({
        ok: true,
        text: `M-Pesa STK prompt of KES ${priceKesNumber.toLocaleString()} sent to ${phone.trim()}! Enter your M-Pesa PIN, then send your school/tutor details on WhatsApp (0728595160) for owner review & approval.`,
      });
    } catch {
      setStatusMsg({
        ok: false,
        text: 'Network error. Please try again or contact WhatsApp 0728595160.',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-2 pt-2">
      <button
        type="button"
        onClick={() => {
          setStatusMsg(null);
          setOpen(true);
        }}
        className="w-full inline-flex items-center justify-center gap-2 bg-emerald-700 hover:bg-emerald-800 text-white font-black text-xs py-3 px-4 rounded-xl shadow-xs transition cursor-pointer"
      >
        <Smartphone className="w-4 h-4" />
        <span>Pay KES {priceKesDisplay} via M-Pesa STK Push</span>
      </button>

      <a
        href={waHref}
        target="_blank"
        rel="noreferrer"
        className="w-full inline-flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl transition"
      >
        <MessageCircle className="w-4 h-4 text-emerald-700" />
        <span>Request Approval on WhatsApp (0728595160)</span>
      </a>

      {open && (
        <div className="fixed inset-0 z-[10020] bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between gap-3">
              <div>
                <span className="inline-flex items-center gap-1 text-[10px] font-black uppercase bg-emerald-100 text-emerald-900 px-2.5 py-0.5 rounded-full">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Direct M-Pesa • Owner Approval Required
                </span>
                <h4 className="text-base font-black text-slate-900 mt-1">{packageName}</h4>
                <p className="text-xs text-slate-600">
                  KES {priceKesDisplay} {period} • No third-party ad goes live without direct owner review &amp; permission.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStkCheckout} className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  School / Tutor / Bookshop Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Sunrise Junior Academy"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Safaricom M-Pesa Phone Number
                </label>
                <input
                  type="tel"
                  required
                  placeholder="0712345678"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm font-mono font-bold text-slate-900 focus:outline-none focus:border-emerald-600"
                />
              </div>

              {statusMsg && (
                <div
                  className={`rounded-xl p-3 text-xs font-semibold flex items-start gap-2 ${
                    statusMsg.ok
                      ? 'bg-emerald-50 border border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border border-rose-300 text-rose-900'
                  }`}
                >
                  {statusMsg.ok && <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
                  <span>{statusMsg.text}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-emerald-700 hover:bg-emerald-800 disabled:bg-slate-400 text-white font-black text-sm py-3 rounded-xl flex items-center justify-center gap-2 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Sending M-Pesa Prompt...</span>
                  </>
                ) : (
                  <span>Send M-Pesa Prompt (KES {priceKesDisplay})</span>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
