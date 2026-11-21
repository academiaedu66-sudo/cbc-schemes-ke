'use client';

import React, { useEffect, useState } from 'react';
import {
  Building2,
  Check,
  CheckCircle2,
  Copy,
  CreditCard,
  Globe2,
  HeartHandshake,
  Loader2,
  MessageCircle,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  X,
} from 'lucide-react';
import {
  convertUsdToKes,
  DONATION_METHOD_LABELS,
  DONATION_UK_WHATSAPP_DIGITS,
  DONATION_UK_WHATSAPP_DISPLAY,
  DONATION_USA_CANADA_WHATSAPP_DIGITS,
  DONATION_USA_CANADA_WHATSAPP_DISPLAY,
  MIN_DONATION_USD,
  SINGLE_STK_MAX_KES,
  USD_TO_KES_DONATION_RATE,
  type DonationPaymentMethod,
} from '@/lib/donations';
import ButtonEmblemBadge from './ButtonEmblemBadge';

const PRESET_USD_AMOUNTS = [1, 5, 10, 25, 50, 100, 250, 500, 1000];

const DEFAULT_INTL_WA_TEXT = encodeURIComponent(
  'Hello CBCMATERIALS.SHOP! I would like to donate to help needy learners continue their education.'
);
const DIRECT_UK_WA_URL = `https://wa.me/${DONATION_UK_WHATSAPP_DIGITS}?text=${DEFAULT_INTL_WA_TEXT}`;
const DIRECT_USA_CANADA_WA_URL = `https://wa.me/${DONATION_USA_CANADA_WHATSAPP_DIGITS}?text=${DEFAULT_INTL_WA_TEXT}`;

interface UponRequestDetails {
  remittanceMpesaE164: string;
  remittanceMpesaLocal: string;
  ukWhatsappDisplay?: string;
  usaCanadaWhatsappDisplay?: string;
  recipientAccountName: string;
  paypalHandleOrUrl: string | null;
  bankName: string;
  bankAccountNumber: string | null;
  bankSwiftBic: string;
  bankBranch: string;
}

export function InternationalDonationTopBanner({
  onOpenModal,
}: {
  onOpenModal: () => void;
}) {
  return (
    <div className="w-full rounded-2xl bg-gradient-to-r from-sky-950/95 via-emerald-950/95 to-indigo-950/95 border border-emerald-400/60 p-4 sm:p-5 shadow-lg flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
      <div className="space-y-2 min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="inline-flex items-center gap-1 bg-emerald-400 text-slate-950 text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full">
            <Globe2 className="w-3.5 h-3.5" />
            INTERNATIONAL &amp; GLOBAL EDUCATION FUND
          </span>
          <span className="text-[11px] font-bold text-amber-300 uppercase tracking-wide">
            $1 TO MAXIMUM &bull; REMITLY &bull; SENDWAVE &bull; WORLDREMIT &bull; PAYPAL &bull; BANK WIRE &bull; STK PUSH
          </span>
        </div>
        <p className="text-xs sm:text-sm text-emerald-50/95 font-medium leading-relaxed max-w-4xl">
          <strong className="text-white font-extrabold">
            Help Weak &amp; Poor Learners Continue Their Education:
          </strong>{' '}
          Donate any amount from <strong className="text-amber-300">$1 USD upward</strong> so
          underprivileged children in Kenya stay in school with books, revision materials, and
          tuition. Instant Bank-Settling STK Push, plus Remitly, Sendwave, WorldRemit, PayPal
          &amp; International Bank Transfer upon request — all routed one-way directly to the
          bank.
        </p>

        {/* OUTSIDE INTERNATIONAL WHATSAPP NUMBERS (U.K. & U.S.A./CANADA) */}
        <div className="flex flex-wrap items-center gap-2 pt-0.5">
          <a
            href={DIRECT_UK_WA_URL}
            target="_blank"
            rel="noreferrer"
            className="h-9 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-emerald-300/50 text-white px-3.5 rounded-xl text-xs font-black tracking-wide transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>U.K. WHATSAPP: {DONATION_UK_WHATSAPP_DISPLAY}</span>
          </a>

          <a
            href={DIRECT_USA_CANADA_WA_URL}
            target="_blank"
            rel="noreferrer"
            className="h-9 inline-flex items-center gap-1.5 bg-white/10 hover:bg-white/20 border border-amber-300/50 text-amber-200 px-3.5 rounded-xl text-xs font-black tracking-wide transition"
          >
            <MessageCircle className="w-3.5 h-3.5 text-amber-300 shrink-0" />
            <span>U.S.A. / CANADA WHATSAPP: {DONATION_USA_CANADA_WHATSAPP_DISPLAY}</span>
          </a>
        </div>
      </div>

      <div className="w-full xl:w-auto shrink-0 flex flex-col items-stretch xl:items-end justify-center gap-1.5">
        <button
          type="button"
          onClick={onOpenModal}
          style={{ fontSize: '15px' }}
          className="min-h-[50px] w-full xl:w-auto bg-gradient-to-r from-emerald-400 via-teal-300 to-amber-300 hover:brightness-105 text-slate-950 border-2 border-white px-5 py-2.5 rounded-xl font-black uppercase tracking-wider inline-flex items-center justify-center gap-2.5 shadow-md transition cursor-pointer"
        >
          <ButtonEmblemBadge variant="global_donate" size="md" />
          <span>DONATE TO HELP NEEDY LEARNERS ($1+)</span>
        </button>
        <span className="text-[11px] font-bold text-emerald-200/95 text-center xl:text-right">
          U.K.: {DONATION_UK_WHATSAPP_DISPLAY} &bull; U.S.A./CANADA:{' '}
          {DONATION_USA_CANADA_WHATSAPP_DISPLAY}
        </span>
      </div>
    </div>
  );
}

export default function InternationalDonationModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [rate, setRate] = useState(USD_TO_KES_DONATION_RATE);
  const [amountUsdInput, setAmountUsdInput] = useState<string>('25');
  const [tab, setTab] = useState<'STK_DIRECT' | 'REMITTANCE_STK' | 'PAYPAL_BANK'>(
    'STK_DIRECT'
  );
  const [remittanceMethod, setRemittanceMethod] = useState<
    'REMITLY' | 'SENDWAVE' | 'WORLDREMIT'
  >('REMITLY');
  const [intlRequestMethod, setIntlRequestMethod] = useState<
    'PAYPAL' | 'INTERNATIONAL_BANK_TRANSFER'
  >('PAYPAL');

  const [donorName, setDonorName] = useState('');
  const [donorCountry, setDonorCountry] = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [donorPhone, setDonorPhone] = useState('');
  const [dedicatedNote, setDedicatedNote] = useState('');

  const [submitting, setSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Direct STK state
  const [checkoutRequestId, setCheckoutRequestId] = useState<string | null>(null);
  const [stkStatus, setStkStatus] = useState<'IDLE' | 'PENDING' | 'COMPLETED' | 'FAILED'>(
    'IDLE'
  );

  // Upon-request & Remittance-to-Bank Bridge state
  const [donationRef, setDonationRef] = useState('');
  const [uponRequestDetails, setUponRequestDetails] =
    useState<UponRequestDetails | null>(null);
  const [whatsappUkUrl, setWhatsappUkUrl] = useState(DIRECT_UK_WA_URL);
  const [whatsappUsaCanadaUrl, setWhatsappUsaCanadaUrl] = useState(
    DIRECT_USA_CANADA_WA_URL
  );
  const [remittanceTxCode, setRemittanceTxCode] = useState('');
  const [toppedUpSafaricomPhone, setToppedUpSafaricomPhone] = useState('');
  const [sweepDoneMsg, setSweepDoneMsg] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    fetch('/api/donations')
      .then((r) => r.json())
      .then((d) => {
        if (d?.usdToKesRate) setRate(Number(d.usdToKesRate));
      })
      .catch(() => {});
  }, [isOpen]);

  const parsedUsd = Math.max(
    MIN_DONATION_USD,
    Math.round((Number(amountUsdInput) || MIN_DONATION_USD) * 100) / 100
  );
  const computedKes = convertUsdToKes(parsedUsd, rate);
  const exceedsSingleStk = computedKes > SINGLE_STK_MAX_KES;

  // Poll Direct STK Push completion
  useEffect(() => {
    if (!isOpen || stkStatus !== 'PENDING' || !checkoutRequestId) return;
    const timer = window.setInterval(async () => {
      try {
        const res = await fetch('/api/resources/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ checkoutRequestId }),
        });
        const data = await res.json();
        if (data.status === 'COMPLETED') {
          window.clearInterval(timer);
          setStkStatus('COMPLETED');
          setStatusMsg(
            `Thank you ${
              donorName || 'kind supporter'
            }! Your $${parsedUsd.toLocaleString()} USD donation has settled directly into the Learner Support Bank Account!`
          );
        } else if (data.status === 'FAILED') {
          window.clearInterval(timer);
          setStkStatus('FAILED');
          setErrorMsg(
            'STK prompt was cancelled or timed out. You can retry STK Push or use Remitly / Sendwave / WorldRemit / PayPal / Bank Transfer.'
          );
        }
      } catch {}
    }, 1400);
    return () => window.clearInterval(timer);
  }, [isOpen, stkStatus, checkoutRequestId, donorName, parsedUsd]);

  const copyText = (key: string, val: string) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // TAB 1: Direct Bank-Settling STK Push ($1 to Maximum)
  const handleDirectBankStkPush = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');

    if (Number(amountUsdInput) < 1 || Number.isNaN(Number(amountUsdInput))) {
      setErrorMsg('Please enter a donation amount of $1 USD or more.');
      return;
    }
    if (!donorPhone.trim() || donorPhone.replace(/\D/g, '').length < 9) {
      setErrorMsg(
        'Enter a valid M-Pesa / M-Pesa Global / Safaricom number (or switch to Remitly / Sendwave / WorldRemit / PayPal).'
      );
      return;
    }

    setSubmitting(true);
    try {
      const stkRes = await fetch('/api/mpesa/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phoneNumber: donorPhone.trim(),
          serviceType: 'LEARNER_DONATION',
          donationAmountUsd: parsedUsd,
          donationAmountKes: computedKes,
          buyerName: donorName.trim() || 'International Donor',
          bookTitle: `Learner Support Donation ($${parsedUsd.toLocaleString()} USD)`,
        }),
      });
      const stkData = await stkRes.json();
      if (!stkRes.ok || !stkData.checkoutRequestId) {
        setStkStatus('FAILED');
        setErrorMsg(
          stkData.error ||
            'Could not initiate STK on this number. If donating from abroad without a Safaricom roaming SIM, select Remitly, Sendwave, WorldRemit, PayPal, or Bank Transfer above!'
        );
        return;
      }

      // Also record in Donations Ledger
      const reqRes = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_donation_request',
          method: 'DIRECT_STK_BANK',
          amountUsd: parsedUsd,
          donorName: donorName.trim() || 'International Supporter',
          donorCountry: donorCountry.trim() || 'International',
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim(),
          dedicatedNote: dedicatedNote.trim(),
          checkoutRequestId: stkData.checkoutRequestId,
        }),
      });
      const reqData = await reqRes.json();
      if (reqData?.donation?.referenceCode) {
        setDonationRef(reqData.donation.referenceCode);
      }

      setCheckoutRequestId(stkData.checkoutRequestId);
      setStkStatus('PENDING');
      setStatusMsg(
        `Bank-Routed STK Push for KSh ${Math.min(
          SINGLE_STK_MAX_KES,
          computedKes
        ).toLocaleString()} ($${parsedUsd.toLocaleString()} USD) sent to ${donorPhone.trim()}! Enter PIN on your phone to settle directly to the Bank.`
      );
    } catch {
      setErrorMsg('Network error starting Bank STK Push. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // TAB 2 & TAB 3: Request Remittance (Remitly/Sendwave/WorldRemit) or PayPal / International Bank Transfer
  const handleRequestInternationalMethod = async (
    method: DonationPaymentMethod,
    e: React.FormEvent
  ) => {
    e.preventDefault();
    setErrorMsg('');
    setStatusMsg('');
    setSweepDoneMsg('');

    if (Number(amountUsdInput) < 1 || Number.isNaN(Number(amountUsdInput))) {
      setErrorMsg('Please enter a donation amount of $1 USD or more.');
      return;
    }
    if (!donorName.trim()) {
      setErrorMsg('Please enter your name (or organization name).');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'create_donation_request',
          method,
          amountUsd: parsedUsd,
          donorName: donorName.trim(),
          donorCountry: donorCountry.trim() || 'International',
          donorEmail: donorEmail.trim(),
          donorPhone: donorPhone.trim(),
          dedicatedNote: dedicatedNote.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setDonationRef(data.donation.referenceCode);
        setUponRequestDetails(data.uponRequestDetails);
        if (data.whatsappUkRequestUrl) setWhatsappUkUrl(data.whatsappUkRequestUrl);
        if (data.whatsappUsaCanadaRequestUrl) {
          setWhatsappUsaCanadaUrl(data.whatsappUsaCanadaRequestUrl);
        }
        setStatusMsg(
          `Official Donation Request ${data.donation.referenceCode} approved for $${parsedUsd.toLocaleString()} USD (KSh ${computedKes.toLocaleString()})!`
        );
      } else {
        setErrorMsg(data.error || 'Could not create request.');
      }
    } catch {
      setErrorMsg('Network error submitting request.');
    } finally {
      setSubmitting(false);
    }
  };

  // Connect Remitly / Sendwave / WorldRemit / PayPal-M-Pesa directly with One-Way Bank STK Push!
  const handleConnectRemittanceToBankStk = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!donationRef) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await fetch('/api/donations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'confirm_remittance_and_trigger_bank_stk',
          referenceCode: donationRef,
          remittanceTxCode: remittanceTxCode.trim(),
          stkPhone: toppedUpSafaricomPhone.trim(),
        }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setSweepDoneMsg(data.message);
        if (data.checkoutRequestId && toppedUpSafaricomPhone.trim()) {
          setCheckoutRequestId(data.checkoutRequestId);
          setStkStatus('PENDING');
        }
      } else {
        setErrorMsg(data.error || 'Could not trigger connected Bank STK settlement.');
      }
    } catch {
      setErrorMsg('Network error triggering connected Bank STK settlement.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="intl-donation-modal-title"
      className="fixed inset-0 z-[9995] bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 overflow-y-auto"
    >
      <div className="w-full max-w-3xl bg-white rounded-3xl border-2 border-emerald-400 shadow-2xl overflow-hidden my-auto">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-950 via-emerald-950 to-indigo-950 text-white px-5 sm:px-7 py-5 border-b border-emerald-500/40 flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <span className="inline-flex items-center gap-1.5 bg-emerald-400 text-slate-950 text-[11px] font-black uppercase px-3 py-0.5 rounded-full">
              <Globe2 className="w-3.5 h-3.5" />
              INTERNATIONAL &amp; LOCAL LEARNER SUPPORT FUND
            </span>
            <h2
              id="intl-donation-modal-title"
              className="text-lg sm:text-xl font-black uppercase tracking-wide text-amber-300"
            >
              Donate to Help Weak &amp; Poor Learners Continue Their Education
            </h2>
            <p className="text-xs text-emerald-100 leading-relaxed max-w-2xl">
              Every contribution from <strong>$1 USD to any amount</strong> sponsors
              textbooks, curriculum materials, national exam preparation, and personal
              tuition for vulnerable learners across Kenya. All local STK &amp; international
              remittance channels settle <strong>one-way directly to our Bank Account</strong>.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition cursor-pointer shrink-0"
            aria-label="Close Donation Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 sm:p-6 max-h-[78vh] overflow-y-auto space-y-5">
          {/* INSIDE MODAL INTERNATIONAL DONATION WHATSAPP DESKS (U.K. & U.S.A./CANADA) */}
          <div className="rounded-2xl bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 text-white p-3.5 sm:p-4 border border-emerald-400/50 space-y-2">
            <p className="text-[11px] font-black uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              <span>Official International Donation WhatsApp Desks (Direct Support &amp; Remittance Assistance)</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              <div className="rounded-xl bg-white/10 border border-emerald-400/40 px-3 py-2 flex items-center justify-between gap-2">
                <a
                  href={whatsappUkUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-white hover:text-emerald-300 inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>U.K. WhatsApp: {DONATION_UK_WHATSAPP_DISPLAY}</span>
                </a>
                <button
                  type="button"
                  onClick={() => copyText('uk_wa', DONATION_UK_WHATSAPP_DISPLAY)}
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'uk_wa' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>

              <div className="rounded-xl bg-white/10 border border-amber-300/40 px-3 py-2 flex items-center justify-between gap-2">
                <a
                  href={whatsappUsaCanadaUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-black text-amber-200 hover:text-amber-100 inline-flex items-center gap-1.5"
                >
                  <MessageCircle className="w-4 h-4 text-amber-300 shrink-0" />
                  <span>U.S.A. / CANADA: {DONATION_USA_CANADA_WHATSAPP_DISPLAY}</span>
                </a>
                <button
                  type="button"
                  onClick={() =>
                    copyText('us_ca_wa', DONATION_USA_CANADA_WHATSAPP_DISPLAY)
                  }
                  className="px-2 py-1 rounded-lg bg-white/15 hover:bg-white/25 text-[10px] font-black uppercase inline-flex items-center gap-1 cursor-pointer shrink-0"
                >
                  {copiedKey === 'us_ca_wa' ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-300" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* 1. Amount Picker ($1 to Maximum) */}
          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <label className="text-xs font-black uppercase text-slate-900">
                1. Choose or Enter Any Donation Amount ($1 USD to Maximum — No Limit)
              </label>
              <span className="text-xs font-black text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                ${parsedUsd.toLocaleString()} USD &asymp; KSh {computedKes.toLocaleString()}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {PRESET_USD_AMOUNTS.map((amt) => {
                const active = Number(amountUsdInput) === amt;
                return (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setAmountUsdInput(String(amt))}
                    className={`px-3 py-1.5 rounded-xl text-xs font-black transition cursor-pointer ${
                      active
                        ? 'bg-emerald-600 text-white shadow'
                        : 'bg-white border border-slate-300 text-slate-800 hover:bg-emerald-50'
                    }`}
                  >
                    ${amt.toLocaleString()}
                  </button>
                );
              })}
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
              <div className="relative flex-1">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-black text-slate-500">
                  $
                </span>
                <input
                  type="number"
                  min={1}
                  step="any"
                  value={amountUsdInput}
                  onChange={(e) => setAmountUsdInput(e.target.value)}
                  placeholder="Enter any USD amount from 1 upward (e.g. 1, 35, 500, 5000)"
                  className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 pl-8 pr-16 py-2.5 text-sm font-black text-slate-900 outline-none bg-white"
                />
                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-black text-slate-500">
                  USD
                </span>
              </div>
              <div className="text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 shrink-0">
                Bank Settlement: <strong className="text-slate-900">KSh {computedKes.toLocaleString()}</strong>
              </div>
            </div>

            {exceedsSingleStk && (
              <p className="text-[11px] font-semibold text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-1.5">
                Note: Amounts above KSh {SINGLE_STK_MAX_KES.toLocaleString()} (~$1,923) settle
                in KSh {SINGLE_STK_MAX_KES.toLocaleString()} STK tranches or in a single
                International Bank Wire / Remittance transfer directly to the bank.
              </p>
            )}
          </div>

          {/* 2. Donor Info */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Your Name / Organization
              </label>
              <input
                type="text"
                placeholder="e.g. Sarah Jenkins / Grace Foundation"
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Country
              </label>
              <input
                type="text"
                placeholder="e.g. USA, UK, Canada, Germany, Kenya"
                value={donorCountry}
                onChange={(e) => setDonorCountry(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
            <div>
              <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                Email (For Receipt / Updates)
              </label>
              <input
                type="email"
                placeholder="you@example.com"
                value={donorEmail}
                onChange={(e) => setDonorEmail(e.target.value)}
                className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
              Optional Encouragement Message for Learners
            </label>
            <input
              type="text"
              placeholder="e.g. Keep studying hard — wishing every learner a bright future!"
              value={dedicatedNote}
              onChange={(e) => setDedicatedNote(e.target.value)}
              className="w-full rounded-xl border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-900"
            />
          </div>

          {/* 3. Payment Method Tabs */}
          <div className="space-y-3">
            <label className="block text-xs font-black uppercase text-slate-900">
              2. Select Payment Channel (All Settle One-Way Directly to the Bank)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => {
                  setTab('STK_DIRECT');
                  setUponRequestDetails(null);
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  tab === 'STK_DIRECT'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                  <Smartphone className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Direct STK Push ($1+)</span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Instant M-Pesa / Global STK &rarr; Direct to Bank
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('REMITTANCE_STK');
                  setUponRequestDetails(null);
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  tab === 'REMITTANCE_STK'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                  <Send className="w-4 h-4 text-indigo-600 shrink-0" />
                  <span>Remitly • Sendwave • WorldRemit</span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Upon Request &bull; Connected with STK &rarr; Bank
                </p>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTab('PAYPAL_BANK');
                  setUponRequestDetails(null);
                  setErrorMsg('');
                  setStatusMsg('');
                }}
                className={`p-3 rounded-xl border-2 text-left transition cursor-pointer ${
                  tab === 'PAYPAL_BANK'
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-950'
                    : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-black uppercase">
                  <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>PayPal &amp; Intl Bank Wire</span>
                </div>
                <p className="text-[11px] opacity-80 mt-0.5">
                  Upon Request &bull; Direct Bank Settlement
                </p>
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="rounded-xl bg-rose-50 border border-rose-300 px-4 py-3 text-xs font-bold text-rose-800">
              {errorMsg}
            </div>
          )}

          {statusMsg && (
            <div className="rounded-xl bg-emerald-50 border border-emerald-300 px-4 py-3 text-xs font-bold text-emerald-900 flex items-center gap-2">
              {stkStatus === 'PENDING' ? (
                <Loader2 className="w-4 h-4 animate-spin text-emerald-700 shrink-0" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              )}
              <span>{statusMsg}</span>
            </div>
          )}

          {/* TAB 1 CONTENT: DIRECT BANK STK PUSH */}
          {tab === 'STK_DIRECT' && (
            <form onSubmit={handleDirectBankStkPush} className="space-y-3">
              <div>
                <label className="block text-[11px] font-black uppercase text-slate-800 mb-1">
                  Safaricom / M-Pesa Global / Roaming Phone Number *
                </label>
                <input
                  type="tel"
                  required
                  placeholder="e.g. 0712345678 or +254712345678"
                  value={donorPhone}
                  onChange={(e) => setDonorPhone(e.target.value)}
                  className="w-full rounded-xl border-2 border-slate-300 focus:border-emerald-600 px-3.5 py-2.5 text-xs font-bold text-slate-900 outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Initiating Direct Bank STK Push...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>
                      Donate ${parsedUsd.toLocaleString()} USD (KSh{' '}
                      {Math.min(SINGLE_STK_MAX_KES, computedKes).toLocaleString()}) via
                      Direct Bank STK Push
                    </span>
                  </>
                )}
              </button>
            </form>
          )}

          {/* TAB 2 CONTENT: REMITLY / SENDWAVE / WORLDREMIT CONNECTED WITH STK PUSH TO BANK */}
          {tab === 'REMITTANCE_STK' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                {(['REMITLY', 'SENDWAVE', 'WORLDREMIT'] as const).map((rm) => (
                  <button
                    key={rm}
                    type="button"
                    onClick={() => {
                      setRemittanceMethod(rm);
                      setUponRequestDetails(null);
                    }}
                    className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase transition cursor-pointer ${
                      remittanceMethod === rm
                        ? 'bg-indigo-600 text-white shadow'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    {rm}
                  </button>
                ))}
              </div>

              {!uponRequestDetails ? (
                <form
                  onSubmit={(e) => handleRequestInternationalMethod(remittanceMethod, e)}
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Your WhatsApp / International Phone (Optional)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 555 234 5678 / +44 7700 900077"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <ShieldCheck className="w-4 h-4 text-amber-300" />
                    )}
                    <span>
                      Request {remittanceMethod} Payment &amp; Connect With Bank STK Push ($
                      {parsedUsd.toLocaleString()} USD)
                    </span>
                  </button>
                </form>
              ) : (
                <div className="rounded-2xl bg-indigo-50/70 border-2 border-indigo-300 p-4 space-y-3.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-black uppercase text-indigo-950">
                      {remittanceMethod} Connected Bank Bridge • Ref: {donationRef}
                    </span>
                    <span className="text-[11px] font-black bg-emerald-600 text-white px-2.5 py-0.5 rounded-full">
                      ONE-WAY TO BANK
                    </span>
                  </div>

                  <ol className="list-decimal list-inside space-y-1.5 text-xs text-slate-800 font-medium">
                    <li>
                      Open your <strong>{remittanceMethod}</strong> app and choose{' '}
                      <strong>Kenya &rarr; M-Pesa Mobile Money</strong> (or{' '}
                      <em>{uponRequestDetails.bankName}</em> upon request).
                    </li>
                    <li className="flex flex-wrap items-center gap-2">
                      <span>
                        Send <strong>${parsedUsd.toLocaleString()} USD</strong> (KSh{' '}
                        {computedKes.toLocaleString()}) to Connected STK Bridge Number:{' '}
                        <strong className="font-mono text-emerald-800">
                          {uponRequestDetails.remittanceMpesaE164}
                        </strong>
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          copyText('remit_num', uponRequestDetails.remittanceMpesaE164)
                        }
                        className="px-2 py-0.5 rounded bg-white border border-indigo-300 text-[11px] font-black inline-flex items-center gap-1 cursor-pointer"
                      >
                        {copiedKey === 'remit_num' ? (
                          <>
                            <Check className="w-3 h-3" /> Copied
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" /> Copy
                          </>
                        )}
                      </button>
                    </li>
                    <li>
                      Click <strong>Trigger Connected Bank STK Settlement</strong> below —
                      this immediately routes the exact remittance through our{' '}
                      <strong>Bank STK Push Gateway</strong> straight into the Bank Account!
                    </li>
                  </ol>

                  <form
                    onSubmit={handleConnectRemittanceToBankStk}
                    className="space-y-2.5 pt-2 border-t border-indigo-200"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      <input
                        type="text"
                        placeholder={`${remittanceMethod} Transfer / Receipt ID (Optional)`}
                        value={remittanceTxCode}
                        onChange={(e) => setRemittanceTxCode(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      />
                      <input
                        type="tel"
                        placeholder="Optional: Your Kenyan line if you topped up your own SIM"
                        value={toppedUpSafaricomPhone}
                        onChange={(e) => setToppedUpSafaricomPhone(e.target.value)}
                        className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-900"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {submitting ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Smartphone className="w-4 h-4" />
                      )}
                      <span>
                        Confirm {remittanceMethod} Sent &rarr; Trigger Connected Bank STK
                        Settlement
                      </span>
                    </button>
                  </form>

                  {sweepDoneMsg && (
                    <div className="rounded-xl bg-emerald-100 border border-emerald-300 px-3.5 py-2.5 text-xs font-black text-emerald-950">
                      {sweepDoneMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={whatsappUkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-emerald-400 text-emerald-800 font-black text-[11px] uppercase inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>U.K. WhatsApp ({DONATION_UK_WHATSAPP_DISPLAY})</span>
                    </a>
                    <a
                      href={whatsappUsaCanadaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 border border-indigo-400 text-indigo-800 font-black text-[11px] uppercase inline-flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>U.S.A./CANADA ({DONATION_USA_CANADA_WHATSAPP_DISPLAY})</span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 3 CONTENT: PAYPAL & INTERNATIONAL BANK WIRE (UPON REQUEST) */}
          {tab === 'PAYPAL_BANK' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIntlRequestMethod('PAYPAL');
                    setUponRequestDetails(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase inline-flex items-center gap-1.5 cursor-pointer ${
                    intlRequestMethod === 'PAYPAL'
                      ? 'bg-sky-700 text-white shadow'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <CreditCard className="w-3.5 h-3.5" />
                  <span>PayPal (Upon Request)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIntlRequestMethod('INTERNATIONAL_BANK_TRANSFER');
                    setUponRequestDetails(null);
                  }}
                  className={`px-3.5 py-2 rounded-xl text-xs font-black uppercase inline-flex items-center gap-1.5 cursor-pointer ${
                    intlRequestMethod === 'INTERNATIONAL_BANK_TRANSFER'
                      ? 'bg-amber-600 text-white shadow'
                      : 'bg-slate-100 text-slate-700'
                  }`}
                >
                  <Building2 className="w-3.5 h-3.5" />
                  <span>International Bank Transfer / SWIFT (Upon Request)</span>
                </button>
              </div>

              {!uponRequestDetails ? (
                <form
                  onSubmit={(e) =>
                    handleRequestInternationalMethod(intlRequestMethod, e)
                  }
                  className="space-y-3"
                >
                  <div>
                    <label className="block text-[11px] font-black uppercase text-slate-700 mb-1">
                      Your WhatsApp / Phone Number (For Instant Dispatch)
                    </label>
                    <input
                      type="tel"
                      placeholder="e.g. +1 555 234 5678"
                      value={donorPhone}
                      onChange={(e) => setDonorPhone(e.target.value)}
                      className="w-full rounded-xl border border-slate-300 px-3.5 py-2 text-xs font-semibold text-slate-900"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3.5 px-5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-black text-xs sm:text-sm uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Globe2 className="w-4 h-4" />
                    )}
                    <span>
                      Request {DONATION_METHOD_LABELS[intlRequestMethod]} ($
                      {parsedUsd.toLocaleString()} USD)
                    </span>
                  </button>
                </form>
              ) : (
                <div className="rounded-2xl bg-amber-50/80 border-2 border-amber-300 p-4 space-y-3">
                  <p className="text-xs font-black uppercase text-slate-950">
                    Approved Request Ref: {donationRef} (${parsedUsd.toLocaleString()} USD /
                    KSh {computedKes.toLocaleString()})
                  </p>

                  {intlRequestMethod === 'PAYPAL' && uponRequestDetails.paypalHandleOrUrl && (
                    <div className="rounded-xl bg-white border border-amber-200 p-3 text-xs space-y-1">
                      <span className="font-black uppercase text-sky-800 block">
                        Official PayPal Destination:
                      </span>
                      <p className="font-mono font-bold text-slate-900 break-all">
                        {uponRequestDetails.paypalHandleOrUrl}
                      </p>
                    </div>
                  )}

                  {intlRequestMethod === 'INTERNATIONAL_BANK_TRANSFER' && (
                    <div className="rounded-xl bg-white border border-amber-200 p-3 text-xs space-y-1">
                      <span className="font-black uppercase text-emerald-900 block">
                        Direct Bank Settlement Institution:
                      </span>
                      <p className="font-semibold text-slate-800">
                        Bank: <strong>{uponRequestDetails.bankName}</strong> • SWIFT/BIC:{' '}
                        <strong>{uponRequestDetails.bankSwiftBic}</strong> (
                        {uponRequestDetails.bankBranch})
                      </p>
                      {uponRequestDetails.bankAccountNumber ? (
                        <p className="font-mono font-black text-slate-950">
                          Account Name: {uponRequestDetails.recipientAccountName} | Account
                          No: {uponRequestDetails.bankAccountNumber}
                        </p>
                      ) : (
                        <p className="text-slate-700">
                          Tap the official WhatsApp Desk button below to receive the verified
                          direct bank wire / IBAN slip for Reference{' '}
                          <strong>{donationRef}</strong> immediately.
                        </p>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <a
                      href={whatsappUkUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Complete ({donationRef}) via U.K. WA: {DONATION_UK_WHATSAPP_DISPLAY}
                      </span>
                    </a>
                    <a
                      href={whatsappUsaCanadaUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="py-3 px-3 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white font-black text-[11px] uppercase tracking-wider inline-flex items-center justify-center gap-1.5 shadow"
                    >
                      <MessageCircle className="w-4 h-4 shrink-0" />
                      <span>
                        Complete ({donationRef}) via U.S.A./CANADA:{' '}
                        {DONATION_USA_CANADA_WHATSAPP_DISPLAY}
                      </span>
                    </a>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
