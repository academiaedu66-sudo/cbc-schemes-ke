'use client';

import React, { useEffect, useState } from 'react';
import {
  Award,
  Briefcase,
  Building2,
  CalendarCheck,
  ExternalLink,
  FileSpreadsheet,
  HeartPulse,
  Landmark,
  RefreshCcw,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Wallet,
  X,
} from 'lucide-react';
import { AdSlot, useMonetization } from '@/components/MonetizationEngine';

interface TscServiceItem {
  id: string;
  name: string;
  shortName: string;
  description: string;
  url: string;
  badge: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}

const TSC_SERVICES: TscServiceItem[] = [
  {
    id: 'tpay',
    name: 'TSC T-PAY (Payslips & P9 Tax Forms)',
    shortName: 'TSC T-PAY Portal',
    description:
      'View and download monthly teacher payslips, annual KRA P9 tax cards, and third-party Sacco/bank loan deductions.',
    url: 'https://tpay.tsc.go.ke/',
    badge: 'MOST VISITED',
    icon: Wallet,
    colorClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  },
  {
    id: 'tpad2',
    name: 'TSC TPAD 2 (Teacher Appraisal)',
    shortName: 'TSC TPAD 2 Portal',
    description:
      'Complete termly self-appraisals, lesson observation uploads, professional development gaps, and learner progress records.',
    url: 'https://tpad2.tsc.go.ke/',
    badge: 'TERMLY MANDATORY',
    icon: Award,
    colorClass: 'bg-blue-100 text-blue-800 border-blue-200',
  },
  {
    id: 'registration',
    name: 'TSC Teacher Registration & Certificate',
    shortName: 'TSC Registration',
    description:
      'Apply online for a new TSC Number, verify registration status, or download your digital TSC Registration Certificate.',
    url: 'https://teachersonline.tsc.go.ke/',
    badge: 'NEW & EXISTING',
    icon: UserPlus,
    colorClass: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  },
  {
    id: 'recruitment',
    name: 'TSC Recruitment, Internships & Promotions',
    shortName: 'TSC Vacancies & Promotions',
    description:
      'Apply for advertised Primary, JSS & Senior School teaching vacancies, teacher internships, and career progression promotions.',
    url: 'https://teachersonline.tsc.go.ke/',
    badge: 'CAREERS',
    icon: Briefcase,
    colorClass: 'bg-amber-100 text-amber-900 border-amber-300',
  },
  {
    id: 'leave',
    name: 'TSC Online Leave Application (HRMIS)',
    shortName: 'TSC Leave Portal',
    description:
      'Submit and track online applications for annual leave, study leave, maternity/paternity leave, and sick leave.',
    url: 'https://hr.tsc.go.ke/',
    badge: 'HR SERVICES',
    icon: CalendarCheck,
    colorClass: 'bg-teal-100 text-teal-800 border-teal-200',
  },
  {
    id: 'transfers',
    name: 'TSC Teacher Transfers & Swaps',
    shortName: 'TSC Transfers Portal',
    description:
      'Apply online for intra-county or inter-county teacher transfers and monitor transfer approval status.',
    url: 'https://teachersonline.tsc.go.ke/',
    badge: 'TRANSFERS',
    icon: RefreshCcw,
    colorClass: 'bg-purple-100 text-purple-800 border-purple-200',
  },
  {
    id: 'wealth',
    name: 'TSC Wealth Declaration Portal',
    shortName: 'Wealth Declaration',
    description:
      'File biennial Declaration of Income, Assets and Liabilities (DIALs) online and print your official acknowledgement slip.',
    url: 'https://teachersonline.tsc.go.ke/',
    badge: 'COMPLIANCE',
    icon: ShieldCheck,
    colorClass: 'bg-slate-100 text-slate-800 border-slate-300',
  },
  {
    id: 'tmis',
    name: 'TSC TMIS (Institutional Returns)',
    shortName: 'TSC TMIS Portal',
    description:
      'Headteachers & Principals portal for updating school enrolment, subject staffing returns, and teacher casualty returns.',
    url: 'https://tmis.tsc.go.ke/',
    badge: 'HEADS OF SCHOOL',
    icon: Building2,
    colorClass: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  },
  {
    id: 'medical',
    name: 'Teachers Medical Scheme & Benefits',
    shortName: 'TSC Medical Cover',
    description:
      'Access teacher medical cover details, dependant registration, accredited hospital panels, and wellness support.',
    url: 'https://www.tsc.go.ke/',
    badge: 'WELFARE',
    icon: HeartPulse,
    colorClass: 'bg-rose-100 text-rose-800 border-rose-200',
  },
  {
    id: 'circulars',
    name: 'TSC Circulars, CBA Scales & Downloads',
    shortName: 'TSC Official Website',
    description:
      'Download official TSC circulars, Code of Regulations for Teachers (CORT), Career Progression Guidelines, and HR forms.',
    url: 'https://www.tsc.go.ke/',
    badge: 'OFFICIAL DESK',
    icon: FileSpreadsheet,
    colorClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
  },
];

export default function TscServicesHub({
  externalTriggerCount = 0,
}: {
  externalTriggerCount?: number;
}) {
  const { config, trackAdClick, trackAdImpression, trackInteraction } =
    useMonetization();
  const [isOpen, setIsOpen] = useState(false);
  const [launchingService, setLaunchingService] = useState<TscServiceItem | null>(
    null
  );

  // Clicking the main TSC Services button immediately earns via monetization!
  const handleOpenHub = () => {
    trackAdClick('tsc_services_hub');
    trackAdImpression('tsc_services_hub');
    trackInteraction('tsc_all_services_btn_click');
    setLaunchingService(null);
    setIsOpen(true);
  };

  useEffect(() => {
    if (externalTriggerCount > 0) {
      handleOpenHub();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalTriggerCount]);

  const handleSelectService = (svc: TscServiceItem) => {
    trackAdClick('tsc_services_hub');
    trackInteraction(`tsc_service_${svc.id}`);
    setLaunchingService(svc);
  };

  return (
    <>
      {/* VISIBLE TOP ONE-BUTTON TSC SERVICES BANNER WITH BRIEF DESCRIPTION */}
      <section
        id="tsc-services-hub"
        aria-label="All Teachers Service Commission (TSC) Online Services"
        className="mb-6 bg-gradient-to-r from-sky-950 via-blue-950 to-slate-900 text-white rounded-2xl px-5 py-4 shadow-md border border-sky-500/40 flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div className="flex items-start gap-3.5">
          <div className="w-11 h-11 rounded-2xl bg-sky-400 text-slate-950 flex items-center justify-center shrink-0 shadow">
            <Landmark className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1 bg-sky-400/20 border border-sky-300/40 text-sky-200 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full">
                <Sparkles className="w-3 h-3 text-amber-300" />
                10-in-1 Kenyan Teacher Desk
              </span>
              <span className="text-[11px] font-semibold text-emerald-300">
                T-PAY • TPAD 2 • Registration • Vacancies • Leave • Transfers • TMIS
              </span>
            </div>
            <h2 className="text-base md:text-lg font-black tracking-tight text-white">
              Teachers Service Commission (TSC) All-in-One Services Hub
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-2xl">
              Quick one-button access to all official TSC online services — download
              T-PAY payslips &amp; P9 forms, update TPAD 2 appraisals, apply for TSC
              registration, recruitment/promotions, leave, transfers, wealth
              declaration, and TMIS.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleOpenHub}
          className="shrink-0 inline-flex items-center justify-center gap-2 bg-sky-400 hover:bg-sky-300 text-slate-950 font-black text-xs sm:text-sm px-5 py-3.5 rounded-xl shadow-lg transition cursor-pointer"
        >
          <Landmark className="w-4 h-4" />
          <span>Open All TSC Services</span>
        </button>
      </section>

      {/* MODAL: ALL 10 TSC SERVICES + MONETIZED AD UNITS & GATEWAY */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 bg-gradient-to-r from-sky-950 via-blue-950 to-slate-900 text-white flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-sky-400 text-slate-950 flex items-center justify-center shrink-0">
                  <Landmark className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black leading-tight">
                    Teachers Service Commission (TSC) Online Services
                  </h3>
                  <p className="text-xs text-sky-200">
                    Select any official TSC service below to launch directly
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-300 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-5 bg-slate-50/60">
              {/* Top Monetized Ad Slot Inside TSC Hub */}
              <AdSlot placement="tsc_services_hub" variantIndex={0} />

              {/* If a teacher clicked a specific TSC portal -> Monetized Interstitial Launch Card */}
              {launchingService ? (
                <div className="bg-white border-2 border-sky-300 rounded-2xl p-6 space-y-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="inline-block text-[10px] font-black uppercase px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        Portal Ready to Launch
                      </span>
                      <h4 className="text-lg font-black text-slate-900">
                        {launchingService.name}
                      </h4>
                      <p className="text-xs text-slate-600 leading-relaxed">
                        {launchingService.description}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setLaunchingService(null)}
                      className="text-xs font-bold text-slate-500 hover:text-slate-900 whitespace-nowrap"
                    >
                      ← All 10 Services
                    </button>
                  </div>

                  <a
                    href={launchingService.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => trackAdClick('tsc_services_hub')}
                    className="w-full inline-flex items-center justify-center gap-2 bg-sky-600 hover:bg-sky-700 text-white font-black text-sm py-4 px-5 rounded-xl shadow transition"
                  >
                    <span>Continue to Official {launchingService.shortName}</span>
                    <ExternalLink className="w-4 h-4" />
                  </a>

                  {/* Extra High-CTR Sponsor Unit Inside Interstitial */}
                  <AdSlot placement="preview_modal" variantIndex={1} />
                </div>
              ) : (
                /* Grid of All 10 Official TSC Services */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {TSC_SERVICES.map((svc) => {
                    const Icon = svc.icon;
                    return (
                      <button
                        key={svc.id}
                        type="button"
                        onClick={() => handleSelectService(svc)}
                        className="text-left bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-400 rounded-2xl p-4 shadow-2xs hover:shadow-sm transition flex items-start gap-3.5 cursor-pointer group"
                      >
                        <div
                          className={`w-10 h-10 rounded-xl border flex items-center justify-center shrink-0 ${svc.colorClass}`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1 space-y-1">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-black uppercase tracking-wider text-sky-700">
                              {svc.badge}
                            </span>
                            <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-sky-600 transition shrink-0" />
                          </div>
                          <h4 className="text-xs sm:text-sm font-black text-slate-900 group-hover:text-sky-800 transition">
                            {svc.name}
                          </h4>
                          <p className="text-[11px] text-slate-600 leading-relaxed">
                            {svc.description}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Bottom Monetized Ad Slot */}
              {!launchingService && (
                <AdSlot placement="preview_modal" variantIndex={2} />
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
