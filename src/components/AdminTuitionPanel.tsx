'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  GraduationCap,
  HeartHandshake,
  MessageCircle,
  RefreshCw,
  Sparkles,
  UserCheck,
  Users,
} from 'lucide-react';
import type { PublicTuitionMatch, TuitionRegistration } from '@/lib/tuition';

interface AdminTuitionEntry extends TuitionRegistration {
  matches: PublicTuitionMatch[];
}

export default function AdminTuitionPanel({ password }: { password: string }) {
  const [entries, setEntries] = useState<AdminTuitionEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterRole, setFilterRole] = useState<'ALL' | 'LEARNER' | 'TEACHER'>('ALL');
  const [showGeminiBox, setShowGeminiBox] = useState(false);
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [geminiMasked, setGeminiMasked] = useState('');
  const [geminiMsg, setGeminiMsg] = useState('');
  const [savingGemini, setSavingGemini] = useState(false);

  const fetchTuition = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const [res, aiRes] = await Promise.all([
        fetch('/api/tuition?admin=1', {
          headers: { 'x-admin-password': password },
        }),
        fetch('/api/counselling', {
          headers: { 'x-admin-password': password },
        }),
      ]);
      const data = await res.json();
      if (res.ok && Array.isArray(data.registrations)) {
        setEntries(data.registrations);
      }
      if (aiRes.ok) {
        const aiData = await aiRes.json();
        setHasGeminiKey(Boolean(aiData.hasGeminiKey));
        setGeminiMasked(aiData.geminiKeyMasked || '');
      }
    } catch (err) {
      console.error('Failed to fetch tuition registrations:', err);
    } finally {
      setLoading(false);
    }
  }, [password]);

  const handleSaveGeminiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingGemini(true);
    setGeminiMsg('');
    try {
      const res = await fetch('/api/counselling', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ geminiApiKey: geminiKeyInput }),
      });
      const data = await res.json();
      if (res.ok) {
        setGeminiMsg(data.message || 'Saved!');
        setGeminiKeyInput('');
        await fetchTuition();
      } else {
        setGeminiMsg(data.error || 'Could not save key');
      }
    } catch {
      setGeminiMsg('Network error saving Gemini key');
    } finally {
      setSavingGemini(false);
    }
  };

  useEffect(() => {
    fetchTuition();
  }, [fetchTuition]);

  const liveEntries = entries.filter((e) => !e.id.startsWith('seed-'));
  const learners = liveEntries.filter((e) => e.role === 'LEARNER');
  const teachers = liveEntries.filter((e) => e.role === 'TEACHER');

  const visibleEntries = entries.filter((e) =>
    filterRole === 'ALL' ? true : e.role === filterRole
  );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase flex flex-wrap items-center gap-2">
              Holiday &amp; Personal Tuition Hub (WhatsApp 0728595160 Matchmaker)
              <span className="bg-indigo-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {learners.length} Learners (KSh 1,000) • {teachers.length} Live Teachers (KSh 500)
              </span>
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              All student &amp; teacher registrations, subject requests, and 1-click
              WhatsApp introductions from your coordinator desk.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {(['ALL', 'LEARNER', 'TEACHER'] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setFilterRole(r)}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                filterRole === r
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {r === 'ALL'
                ? `All (${entries.length})`
                : r === 'LEARNER'
                ? `Students (${learners.length})`
                : `Teachers (${entries.filter((x) => x.role === 'TEACHER').length})`}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setShowGeminiBox((v) => !v)}
            className="inline-flex items-center gap-1.5 bg-purple-100 hover:bg-purple-200 text-purple-900 px-3 py-1.5 rounded-xl text-xs font-bold transition"
          >
            <HeartHandshake className="w-3.5 h-3.5" />
            Gemini AI Key {hasGeminiKey ? '(Active)' : '(Optional)'}
          </button>
          <button
            type="button"
            onClick={fetchTuition}
            className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {showGeminiBox && (
        <form
          onSubmit={handleSaveGeminiKey}
          className="bg-purple-50/70 border border-purple-200 rounded-xl p-4 space-y-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-black text-purple-950 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-purple-600" />
              Google Gemini API Key for Guidance &amp; Counselling (Parents &amp; Learners)
            </span>
            {hasGeminiKey && (
              <span className="font-mono bg-white border border-purple-200 px-2 py-0.5 rounded text-purple-800">
                Current: {geminiMasked}
              </span>
            )}
          </div>
          <p className="text-xs text-slate-600">
            Guidance &amp; Counselling works immediately out-of-the-box with our built-in
            CBC Counselling AI, and upgrades automatically to live Google{' '}
            <code>gemini-2.5-flash</code> whenever a free Google AI Studio API key (
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noreferrer"
              className="underline font-bold text-purple-700"
            >
              aistudio.google.com/app/apikey
            </a>
            ) is saved below:
          </p>
          <div className="flex flex-wrap gap-2">
            <input
              type="password"
              value={geminiKeyInput}
              onChange={(e) => setGeminiKeyInput(e.target.value)}
              placeholder="Paste AIzaSy... Google Gemini API Key"
              className="flex-1 min-w-[240px] px-3 py-2 border border-purple-300 rounded-xl text-xs font-mono bg-white"
            />
            <button
              type="submit"
              disabled={savingGemini}
              className="bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs px-4 py-2 rounded-xl transition"
            >
              {savingGemini ? 'Saving...' : 'Save Gemini Key'}
            </button>
          </div>
          {geminiMsg && (
            <p className="text-xs font-bold text-emerald-700">{geminiMsg}</p>
          )}
        </form>
      )}

      <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-96">
        <table className="w-full text-xs">
          <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sticky top-0">
            <tr>
              <th className="text-left px-4 py-2.5">Ref &amp; Role</th>
              <th className="text-left px-4 py-2.5">Name &amp; Phone</th>
              <th className="text-left px-4 py-2.5">Level, Location &amp; Subjects</th>
              <th className="text-left px-4 py-2.5">Fee &amp; Status</th>
              <th className="text-left px-4 py-2.5">Top Subject Matches</th>
              <th className="text-right px-4 py-2.5">Connect</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {visibleEntries.map((item) => {
              const isSeed = item.id.startsWith('seed-');
              const cleanIntlPhone = item.phone.replace(/^\+/, '');
              const waHref = !isSeed
                ? `https://wa.me/${cleanIntlPhone}?text=${encodeURIComponent(
                    `Hello ${item.fullName}! Calling/messaging from CBC Kenya Resource Hub Tuition Desk (0728595160) regarding your ${item.referenceCode} registration for: ${item.subjects.join(', ')}.`
                  )}`
                : undefined;

              return (
                <tr key={item.id} className="hover:bg-slate-50/70">
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="font-mono font-black text-slate-900 block">
                      {item.referenceCode}
                    </span>
                    <span
                      className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded mt-1 ${
                        item.role === 'LEARNER'
                          ? 'bg-amber-100 text-amber-900'
                          : 'bg-emerald-100 text-emerald-900'
                      }`}
                    >
                      {item.role === 'LEARNER' ? (
                        <GraduationCap className="w-3 h-3" />
                      ) : (
                        <UserCheck className="w-3 h-3" />
                      )}
                      {item.role === 'LEARNER' ? 'STUDENT' : isSeed ? 'POOL TEACHER' : 'TEACHER'}
                    </span>
                  </td>

                  <td className="px-4 py-3">
                    <p className="font-bold text-slate-900">{item.fullName}</p>
                    <p className="font-mono text-slate-500">
                      {isSeed ? 'Coordinator Pool' : item.phone}
                    </p>
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-semibold text-slate-700">
                      {item.role === 'LEARNER' && item.learnerGrade
                        ? `Grade: ${item.learnerGrade}`
                        : item.gradeBands.join(', ')}{' '}
                      • {item.county} ({item.mode})
                    </p>
                    <p className="text-slate-500 mt-0.5">
                      <strong>Subjects ({item.subjects.length}):</strong>{' '}
                      {item.subjects.join(', ')}
                    </p>
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap">
                    <p className="font-bold text-slate-900">
                      KSh {item.feeKes.toLocaleString()}
                    </p>
                    <span
                      className={`inline-block text-[10px] font-black px-2 py-0.5 rounded mt-0.5 ${
                        item.paymentStatus === 'COMPLETED'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      {item.mpesaReceipt || item.paymentStatus}
                    </span>
                  </td>

                  <td className="px-4 py-3 max-w-xs">
                    {item.matches.length === 0 ? (
                      <span className="text-slate-400">Awaiting match</span>
                    ) : (
                      <div className="space-y-1">
                        {item.matches.slice(0, 2).map((m) => (
                          <div key={m.referenceCode} className="text-[11px] text-slate-700">
                            <strong>{m.referenceCode}</strong> ({m.maskedName}):{' '}
                            {m.matchedSubjects.slice(0, 3).join(', ')}
                          </div>
                        ))}
                      </div>
                    )}
                  </td>

                  <td className="px-4 py-3 text-right whitespace-nowrap">
                    {waHref ? (
                      <a
                        href={waHref}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-lg transition"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        WhatsApp
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">Built-in</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
