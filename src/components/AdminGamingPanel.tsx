'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Check, Gamepad2, MessageCircle, RefreshCw, Trophy } from 'lucide-react';
import type { GamingPlayer, GamingRedemption } from '@/lib/gaming';

export default function AdminGamingPanel({ password }: { password: string }) {
  const [players, setPlayers] = useState<GamingPlayer[]>([]);
  const [redemptions, setRedemptions] = useState<GamingRedemption[]>([]);
  const [activeSessionsCount, setActiveSessionsCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchGaming = useCallback(async () => {
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/gaming?admin=1', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (res.ok) {
        setPlayers(data.players || []);
        setRedemptions(data.redemptions || []);
        setActiveSessionsCount(data.activeSessionsCount || 0);
      }
    } catch (err) {
      console.error('Failed to load gaming ledger:', err);
    } finally {
      setLoading(false);
    }
  }, [password]);

  useEffect(() => {
    fetchGaming();
  }, [fetchGaming]);

  const markPaid = async (id: string) => {
    await fetch('/api/gaming', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-password': password,
      },
      body: JSON.stringify({ id }),
    });
    await fetchGaming();
  };

  const pendingRedemptions = redemptions.filter((r) => r.status === 'PENDING');
  const totalSessionsSold = players.reduce(
    (sum, p) => sum + (Number(p.sessionsActivated) || 0),
    0
  );

  return (
    <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
            <Gamepad2 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-black text-slate-900 uppercase flex flex-wrap items-center gap-2">
              CBC Subject Gaming Arena (KSh 10 / 20 Mins • 1,000 Pts = KSh 5)
              <span className="bg-emerald-600 text-white text-[10px] font-black px-2.5 py-0.5 rounded-full">
                {activeSessionsCount} Live Now • {totalSessionsSold} Total Passes (KSh{' '}
                {(totalSessionsSold * 10).toLocaleString()})
              </span>
              {pendingRedemptions.length > 0 && (
                <span className="bg-amber-500 text-slate-950 text-[10px] font-black px-2.5 py-0.5 rounded-full">
                  {pendingRedemptions.length} KSh 5 Claim
                  {pendingRedemptions.length === 1 ? '' : 's'} Pending
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              20-minute auto-logout sessions, learner point balances &amp; 1,000-point (KSh
              5) reward redemptions.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={fetchGaming}
          className="inline-flex items-center gap-1.5 bg-white hover:bg-slate-50 border border-slate-300 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-700 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Redemptions Table */}
      {redemptions.length > 0 && (
        <div className="border border-amber-200 rounded-xl overflow-hidden">
          <div className="bg-amber-50 px-4 py-2 text-xs font-black uppercase text-amber-950 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-600" />
            1,000 Points &rarr; KSh 5 Redemptions
          </div>
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px]">
              <tr>
                <th className="text-left px-4 py-2">Ref</th>
                <th className="text-left px-4 py-2">Learner &amp; Phone</th>
                <th className="text-right px-4 py-2">Points</th>
                <th className="text-right px-4 py-2">Reward</th>
                <th className="text-right px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {redemptions.slice(0, 20).map((r) => (
                <tr key={r.id}>
                  <td className="px-4 py-2 font-mono font-bold">{r.referenceCode}</td>
                  <td className="px-4 py-2">
                    <span className="font-bold text-slate-900">{r.playerName}</span>{' '}
                    <span className="font-mono text-slate-500">({r.phone})</span>
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {r.pointsDeducted.toLocaleString()} pts
                  </td>
                  <td className="px-4 py-2 text-right font-black text-emerald-700">
                    KSh {r.amountKes}
                  </td>
                  <td className="px-4 py-2 text-right">
                    {r.status === 'PAID' ? (
                      <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded">
                        PAID
                      </span>
                    ) : (
                      <div className="inline-flex items-center gap-1.5">
                        <a
                          href={`https://wa.me/${r.phone.replace(/^\+/, '')}?text=${encodeURIComponent(
                            `Congrats ${r.playerName}! Your KSh ${r.amountKes} CBC Gaming reward (${r.referenceCode}) has been sent!`
                          )}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1 rounded-lg"
                        >
                          <MessageCircle className="w-3 h-3" />
                          WA
                        </a>
                        <button
                          type="button"
                          onClick={() => markPaid(r.id)}
                          className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-2.5 py-1 rounded-lg"
                        >
                          <Check className="w-3 h-3" />
                          Mark Paid
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Top Players Leaderboard */}
      {players.length > 0 && (
        <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64">
          <table className="w-full text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] sticky top-0">
              <tr>
                <th className="text-left px-4 py-2">Learner</th>
                <th className="text-left px-4 py-2">Phone</th>
                <th className="text-right px-4 py-2">Current Points</th>
                <th className="text-right px-4 py-2">Lifetime Pts</th>
                <th className="text-right px-4 py-2">20-Min Passes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {players.slice(0, 25).map((p) => (
                <tr key={p.phone}>
                  <td className="px-4 py-2 font-bold text-slate-900">
                    {p.playerName} (G{p.gradeKey})
                  </td>
                  <td className="px-4 py-2 font-mono text-slate-600">{p.phone}</td>
                  <td className="px-4 py-2 text-right font-mono font-black text-amber-700">
                    {p.pointsBalance.toLocaleString()} / 1,000
                  </td>
                  <td className="px-4 py-2 text-right font-mono">
                    {p.lifetimePoints.toLocaleString()}
                  </td>
                  <td className="px-4 py-2 text-right font-mono font-bold text-emerald-700">
                    {p.sessionsActivated}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
