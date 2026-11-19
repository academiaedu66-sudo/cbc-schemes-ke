'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Activity, RefreshCw, Sparkles, Volume2, VolumeX } from 'lucide-react';

interface SensorCustomerItem {
  id: string;
  timestamp: string;
  sourceLabel: string;
  keywordCluster: string;
  searchQuery?: string;
  landingPath: string;
  deviceSummary: string;
}

const PROFESSOR_GREETING = 'New customer is here PROFESSOR';

export default function CustomerSensorAdminBanner({
  password,
}: {
  password: string;
}) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [totalDetected, setTotalDetected] = useState(0);
  const [lastDailyRankIso, setLastDailyRankIso] = useState<string | null>(null);
  const [customers, setCustomers] = useState<SensorCustomerItem[]>([]);
  const [rankingNow, setRankingNow] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastSeenIdRef = useRef<string | null | undefined>(undefined);
  const soundEnabledRef = useRef(true);

  useEffect(() => {
    soundEnabledRef.current = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const a = new Audio('/audio/new-customer-professor.mp3');
    a.preload = 'auto';
    audioRef.current = a;
  }, []);

  const playProfessorVoice = useCallback((force = false) => {
    if (!force && !soundEnabledRef.current) return;
    if (typeof window === 'undefined') return;

    const fallbackSpeak = () => {
      try {
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(PROFESSOR_GREETING);
          u.rate = 0.96;
          u.pitch = 1.05;
          window.speechSynthesis.speak(u);
        }
      } catch {}
    };

    try {
      const a = audioRef.current || new Audio('/audio/new-customer-professor.mp3');
      audioRef.current = a;
      a.currentTime = 0;
      a.volume = 1.0;
      a.play().catch(fallbackSpeak);
    } catch {
      fallbackSpeak();
    }
  }, []);

  const pollSensor = useCallback(async () => {
    if (!password) return;
    try {
      const res = await fetch('/api/seo/sensor', {
        headers: { 'x-admin-password': password.trim() },
      });
      if (!res.ok) return;
      const data = await res.json();
      setTotalDetected(Number(data.totalCustomersDetected) || 0);
      setLastDailyRankIso(data.lastDailyAutoRankIso || null);
      if (Array.isArray(data.recentCustomers)) setCustomers(data.recentCustomers);

      const newestId = data.latestCustomer?.id || null;
      if (lastSeenIdRef.current === undefined) {
        lastSeenIdRef.current = newestId;
      } else if (newestId && newestId !== lastSeenIdRef.current) {
        lastSeenIdRef.current = newestId;
        playProfessorVoice();
      }
    } catch {}
  }, [password, playProfessorVoice]);

  useEffect(() => {
    void pollSensor();
    const timer = setInterval(() => {
      void pollSensor();
    }, 4000);
    return () => clearInterval(timer);
  }, [pollSensor]);

  const forceDailyRankNow = async () => {
    setRankingNow(true);
    try {
      await fetch('/api/seo/sensor', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password.trim(),
        },
        body: JSON.stringify({ action: 'force_daily_rank' }),
      });
      await pollSensor();
    } catch {}
    setRankingNow(false);
  };

  return (
    <section className="bg-gradient-to-r from-indigo-950 via-slate-900 to-emerald-950 text-white rounded-2xl border-2 border-indigo-400/50 p-5 shadow-md space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500 text-white flex items-center justify-center shrink-0">
            <Activity className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-sm sm:text-base font-black uppercase tracking-tight">
                Live Search &amp; Customer Arrival Sensor + Daily Google Auto-Ranker
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400 text-slate-950 text-[10px] font-black uppercase">
                {totalDetected} Customers Detected • Daily SEO Active
              </span>
            </div>
            <p className="text-xs text-indigo-200 mt-0.5">
              Voice Alert: <strong>&ldquo;New customer is here PROFESSOR&rdquo;</strong>{' '}
              • Auto-submits all 28 CBC, KNEC, TSC, Schemes, Notes &amp; Tuition hubs daily
              {lastDailyRankIso
                ? ` (Last synced: ${new Date(lastDailyRankIso).toLocaleTimeString()})`
                : ''}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setSoundEnabled((s) => !s)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold cursor-pointer"
          >
            {soundEnabled ? (
              <Volume2 className="w-4 h-4 text-emerald-300" />
            ) : (
              <VolumeX className="w-4 h-4 text-rose-300" />
            )}
            <span>{soundEnabled ? 'Alert ON' : 'Muted'}</span>
          </button>

          <button
            type="button"
            onClick={() => playProfessorVoice(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-black cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>▶ Test &ldquo;New customer is here PROFESSOR&rdquo;</span>
          </button>

          <button
            type="button"
            onClick={forceDailyRankNow}
            disabled={rankingNow}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-black cursor-pointer disabled:opacity-60"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${rankingNow ? 'animate-spin' : ''}`} />
            <span>{rankingNow ? 'Submitting URLs…' : 'Boost Daily SEO Now'}</span>
          </button>
        </div>
      </div>

      {customers.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 pt-2 border-t border-white/15">
          {customers.slice(0, 6).map((c) => (
            <div
              key={c.id}
              className="rounded-xl bg-slate-950/70 border border-white/10 px-3.5 py-2.5 text-xs space-y-0.5"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="font-black text-amber-300 truncate">
                  {c.keywordCluster}
                </span>
                <span className="text-[10px] font-bold text-emerald-400 shrink-0">
                  {c.sourceLabel}
                </span>
              </div>
              {c.searchQuery && (
                <p className="text-[11px] text-white truncate">
                  Searched: &ldquo;{c.searchQuery}&rdquo;
                </p>
              )}
              <p className="text-[10px] text-slate-400 truncate">
                {c.landingPath} • {c.deviceSummary}
              </p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
