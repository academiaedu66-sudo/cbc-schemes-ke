// src/app/contest/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const CONTEST_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'] as const;

const CONTEST_SUBJECTS = [
  { name: 'Mathematics', icon: '📐' },
  { name: 'English', icon: '📖' },
  { name: 'Kiswahili', icon: '🗣️' },
  { name: 'Integrated Science', icon: '🔬' },
  { name: 'Social Studies', icon: '🌍' },
  { name: 'Pre-Technical Studies', icon: '🛠️' },
  { name: 'Agriculture & Nutrition', icon: '🌱' },
  { name: 'Creative Arts & Sports', icon: '🎨' },
  { name: 'CRE', icon: '✝️' },
  { name: 'IRE', icon: '☪️' },
];

/**
 * National Contest landing page for cbcmaterials.shop
 * - Supports Grade 6, 7, 8, and 9 across every subject (KSh 500 each)
 * - Shows rewards + START TEST button at the very top when active
 * - Registration form requires Grade so learners are placed in the right test
 * - Enforces silent threshold gate ("the test is almost here")
 */
export default function ContestPage() {
  const router = useRouter();
  const [selectedGrade, setSelectedGrade] = useState<string>('Grade 7');
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [form, setForm] = useState({ name: '', school: '', phone: '' });
  const [message, setMessage] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [contestActive, setContestActive] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);

  const shareText = `🏆 NATIONAL CONTEST (Grades 6, 7, 8 & 9) on CBCMaterials.shop!\n🥇 1st: Brand New Laptop + KSh 20,000 School Fee + Uniform\n🥈 2nd: KSh 10,000 + Uniform\n🥉 3rd: KSh 5,000 + Uniform\nRegister for ${selectedGrade} ${selectedSubject} (KSh 500) here:`;
  const shareUrl = 'https://www.cbcmaterials.shop/contest';

  // Read ?subject=, ?grade=, and saved participantId on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const subj = params.get('subject');
    const grd = params.get('grade');
    const savedPid = window.localStorage.getItem('contest_participant_id');
    queueMicrotask(() => {
      if (subj && CONTEST_SUBJECTS.some((s) => s.name === subj)) {
        setSelectedSubject(subj);
      }
      if (grd && CONTEST_GRADES.includes(grd as (typeof CONTEST_GRADES)[number])) {
        setSelectedGrade(grd);
      }
      if (savedPid) {
        setParticipantId(savedPid);
      }
    });
  }, []);

  // Poll participant payment status every 5s after registration
  useEffect(() => {
    if (!participantId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/contest/status/${participantId}`);
        const data = await res.json();
        setPaymentStatus(data.status || '');
      } catch {}
    }, 5000);
    return () => clearInterval(interval);
  }, [participantId]);

  // Poll contest active flag every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(
          `/api/contest/is-active?subject=${encodeURIComponent(selectedSubject)}&grade=${encodeURIComponent(selectedGrade)}`
        );
        const data = await res.json();
        setContestActive(Boolean(data.active));
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedSubject, selectedGrade]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    if (!form.name.trim() || !form.school.trim() || !form.phone.trim() || !selectedGrade) {
      setMessage('❌ Please enter your full name, school name, grade (6–9), and M-Pesa phone number.');
      return;
    }
    setIsSubmitting(true);
    setMessage('');
    try {
      const res = await fetch('/api/contest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          school: form.school.trim(),
          phoneNumber: form.phone.trim(),
          grade: selectedGrade,
          subject: selectedSubject,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setParticipantId(data.participantId);
        window.localStorage.setItem('contest_participant_id', data.participantId);
        setPaymentStatus('pending');
        setMessage(
          `✅ STK push sent for ${selectedGrade} ${selectedSubject} (KSh 500)! Check your phone, enter your M-Pesa PIN, and wait for confirmation.`
        );
        if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
      } else {
        setMessage(`❌ ${data.message || 'Registration failed. Please try again.'}`);
      }
    } catch {
      setMessage('❌ Network error. Please check your connection and try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startContest = () => {
    const query = `subject=${encodeURIComponent(selectedSubject)}&grade=${encodeURIComponent(selectedGrade)}`;
    const url = participantId ? `/contest/test?pid=${participantId}&${query}` : `/contest/test?${query}`;
    router.push(url);
  };

  const activateContest = async () => {
    const res = await fetch('/api/contest/activate', { method: 'POST' });
    const r = await res.json();
    alert(r.message || r.error || 'Done');
  };

  return (
    <div className="max-w-4xl mx-auto p-4">

      {/* ── TOP HERO: Always visible contest button + rewards ── */}
      <div
        className="mb-6 rounded-2xl text-white text-center p-6"
        style={{ background: 'linear-gradient(135deg, #1a237e 0%, #0d47a1 50%, #1565c0 100%)' }}
      >
        <div className="text-4xl mb-2">🏆</div>
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">NATIONAL CONTEST – GRADES 6, 7, 8 &amp; 9</h1>
        <p className="text-blue-200 mb-4 text-sm">
          All Subjects (Grade 6, 7, 8 &amp; 9 Levels) · <strong>KSh 500 per Subject Test</strong> · 100 Marks · 2 Hours
        </p>

        {/* Rewards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5 text-sm">
          <div className="bg-yellow-400 text-gray-900 rounded-xl p-3">
            <div className="text-2xl">🥇</div>
            <div className="font-bold">1st Place</div>
            <div>Brand-new Laptop</div>
            <div>KSh 20,000 School Fee</div>
            <div>New School Uniform</div>
          </div>
          <div className="bg-gray-200 text-gray-900 rounded-xl p-3">
            <div className="text-2xl">🥈</div>
            <div className="font-bold">2nd Place</div>
            <div>KSh 10,000</div>
            <div>School Uniform</div>
          </div>
          <div className="bg-orange-300 text-gray-900 rounded-xl p-3">
            <div className="text-2xl">🥉</div>
            <div className="font-bold">3rd Place</div>
            <div>KSh 5,000</div>
            <div>School Uniform</div>
          </div>
        </div>

        {/* START TEST button – shown when contest is active */}
        {contestActive ? (
          <button
            onClick={startContest}
            className="w-full text-xl font-extrabold py-4 px-8 rounded-xl cursor-pointer"
            style={{ background: '#00e676', color: '#000' }}
          >
            🚀 NATIONAL CONTEST – START {selectedGrade.toUpperCase()} {selectedSubject.toUpperCase()} TEST NOW
          </button>
        ) : (
          <div className="bg-blue-800 bg-opacity-60 rounded-xl py-3 px-4">
            <p className="text-blue-100 font-semibold">
              ⏳ The <strong>{selectedGrade} {selectedSubject}</strong> National Contest test is almost here!
            </p>
            <p className="text-blue-200 text-sm mt-1">
              Register and complete your KSh 500 payment below — the test will open soon.
            </p>
          </div>
        )}
      </div>

      {/* ── GRADE & SUBJECT SELECTION (GRADES 6, 7, 8, 9 FOR EVERY SUBJECT) ── */}
      <section className="mb-6 p-4 border rounded-xl bg-white shadow-sm space-y-4">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
            <h2 className="text-lg font-bold">🎓 Step 1: Select Your Grade Level</h2>
            <span className="inline-block bg-blue-100 text-blue-800 text-xs font-bold px-3 py-1 rounded-full">
              Grades 6, 7, 8 &amp; 9 Supported
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {CONTEST_GRADES.map((g) => {
              const active = selectedGrade === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setSelectedGrade(g)}
                  className={`py-2.5 px-3 rounded-xl border font-bold text-sm transition cursor-pointer ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white shadow-sm'
                      : 'border-gray-200 bg-gray-50 text-gray-800 hover:border-blue-400'
                  }`}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
            <h2 className="text-lg font-bold">📚 Step 2: Select Subject National Contest Test ({selectedGrade})</h2>
            <span className="inline-block bg-emerald-100 text-emerald-800 text-xs font-bold px-3 py-1 rounded-full">
              Each Subject Test: KSh 500
            </span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2.5">
            {CONTEST_SUBJECTS.map((subj) => {
              const isSelected = selectedSubject === subj.name;
              return (
                <button
                  key={subj.name}
                  type="button"
                  onClick={() => setSelectedSubject(subj.name)}
                  className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                    isSelected
                      ? 'border-blue-700 bg-blue-50 ring-2 ring-blue-600'
                      : 'border-gray-200 hover:border-blue-400 bg-gray-50'
                  }`}
                >
                  <div className="text-xl mb-1">{subj.icon}</div>
                  <div className="font-bold text-xs sm:text-sm leading-tight text-gray-900">{subj.name}</div>
                  <div className="text-[11px] font-semibold text-emerald-700 mt-1">
                    {selectedGrade} • KSh 500
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Contest Instructions ── */}
      <section className="mb-6 p-4 border rounded-xl bg-gray-50">
        <h2 className="text-lg font-bold mb-2">📋 Contest Instructions</h2>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          <li>Select your <strong>Grade (6, 7, 8, or 9)</strong> and subject test above and pay <strong>KSh 500</strong> via M-Pesa STK Push to be placed into the right test.</li>
          <li>Immediately after payment, you will be notified that the test is almost here and will open soon.</li>
          <li>The test is timed at <strong>2 hours</strong> and is worth <strong>100 marks</strong>.</li>
          <li>For structured questions, write your answers clearly in your exercise book, take clear photos, and upload them for auto-marking.</li>
          <li>Public positions and marks scored by each student will be posted on the leaderboard.</li>
        </ul>
      </section>

      {/* ── Registration Form ── */}
      <section className="mb-6 p-4 border rounded-xl bg-white">
        <h2 className="text-lg font-bold mb-3">
          📝 Register &amp; Pay — <span className="text-blue-700">{selectedGrade} {selectedSubject} (KSh 500)</span>
        </h2>
        <div className="grid gap-3">
          <input
            name="name"
            placeholder="Full Learner Name"
            className="border p-3 rounded-lg w-full"
            value={form.name}
            onChange={handleChange}
          />
          <input
            name="school"
            placeholder="School Name"
            className="border p-3 rounded-lg w-full"
            value={form.school}
            onChange={handleChange}
          />
          <select
            name="grade"
            value={selectedGrade}
            onChange={(e) => setSelectedGrade(e.target.value)}
            className="border p-3 rounded-lg w-full bg-white"
          >
            {CONTEST_GRADES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
          <input
            name="phone"
            placeholder="M-Pesa Phone (e.g. 0712345678)"
            className="border p-3 rounded-lg w-full"
            value={form.phone}
            onChange={handleChange}
          />
          <button
            onClick={register}
            disabled={isSubmitting}
            className="w-full bg-blue-700 hover:bg-blue-800 disabled:opacity-60 text-white font-bold py-3 rounded-lg text-lg cursor-pointer"
          >
            {isSubmitting
              ? `⏳ Sending M-Pesa STK Push for ${selectedGrade} ${selectedSubject}...`
              : `💳 Register for ${selectedGrade} ${selectedSubject} & Pay KSh 500 via M-Pesa`}
          </button>
        </div>

        {message && (
          <p className={`mt-3 p-3 rounded-lg text-sm font-medium ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </p>
        )}

        {paymentStatus && (
          <div className="mt-2 p-3 rounded-lg border bg-amber-50 text-sm">
            Payment status: <strong className={paymentStatus === 'confirmed' ? 'text-green-700' : 'text-orange-600'}>{paymentStatus}</strong>
            {paymentStatus === 'confirmed' && ` ✅ – Payment confirmed for ${selectedGrade} ${selectedSubject}! The test is almost here — stay ready, it will open soon.`}
            {paymentStatus === 'pending' && ' – ⏳ Waiting for M-Pesa confirmation… Please enter your M-Pesa PIN on your phone and wait.'}
            {paymentStatus === 'failed' && ' ❌ – Payment was not completed. Please try again.'}
          </div>
        )}

        {whatsappUrl && (
          <div className="mt-3 p-3 bg-green-50 rounded-lg">
            <p className="text-sm font-medium text-green-800 mb-1">After payment, send your WhatsApp registration message:</p>
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-semibold"
            >
              📱 Send WhatsApp Registration
            </a>
          </div>
        )}

        {/* Admin actions */}
        <div className="mt-4 pt-3 border-t flex flex-wrap gap-2">
          <button
            onClick={activateContest}
            className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm py-2 px-4 rounded-lg cursor-pointer"
          >
            ⚡ Activate Contest (Admin)
          </button>
          <button
            onClick={() => router.push('/contest/leaderboard')}
            className="bg-gray-800 hover:bg-gray-900 text-white text-sm py-2 px-4 rounded-lg cursor-pointer"
          >
            🏅 View Public Leaderboard
          </button>
        </div>
      </section>

      {/* ── VIRAL INVITE & SHARE SECTION (ALL PLATFORMS) ── */}
      <section className="mb-6 p-4 border-2 border-emerald-500 rounded-xl bg-emerald-50">
        <h2 className="text-lg font-bold text-emerald-950 mb-1">
          📣 Invite Classmates, Friends &amp; School Groups!
        </h2>
        <p className="text-sm text-emerald-900 mb-3">
          Share the National Contest across WhatsApp, Facebook, X, TikTok &amp; Instagram so learners everywhere can join!
        </p>
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://wa.me/?text=${encodeURIComponent(`${shareText} ${shareUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-600 hover:bg-green-700 text-white text-sm font-bold py-2 px-4 rounded-lg"
          >
            💬 Share on WhatsApp
          </a>
          <a
            href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold py-2 px-4 rounded-lg"
          >
            📘 Share on Facebook
          </a>
          <a
            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-black hover:bg-gray-800 text-white text-sm font-bold py-2 px-4 rounded-lg"
          >
            𝕏 Share on X
          </a>
          <button
            type="button"
            onClick={() => {
              navigator.clipboard?.writeText(shareUrl);
              setCopiedInvite(true);
              setTimeout(() => setCopiedInvite(false), 3000);
            }}
            className="bg-amber-500 hover:bg-amber-600 text-slate-950 text-sm font-bold py-2 px-4 rounded-lg cursor-pointer"
          >
            {copiedInvite ? '✅ Invite Link Copied!' : '🔗 Copy Invite Link'}
          </button>
        </div>
      </section>

    </div>
  );
}
