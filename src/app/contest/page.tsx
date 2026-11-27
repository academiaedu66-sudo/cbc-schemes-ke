// src/app/contest/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

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
 * - Shows rewards + START TEST button at the very top
 * - Lists all Junior School Subject National Contest Tests (KSh 500 each)
 * - Registration form with M-Pesa STK push (Ksh 500)
 * - WhatsApp registration link after payment
 * - Admin buttons: Activate Contest, View Leaderboard
 */
export default function ContestPage() {
  const [selectedSubject, setSelectedSubject] = useState<string>('Mathematics');
  const [form, setForm] = useState({ name: '', school: '', phone: '' });
  const [message, setMessage] = useState('');
  const [participantId, setParticipantId] = useState('');
  const [paymentStatus, setPaymentStatus] = useState('');
  const [contestActive, setContestActive] = useState(false);
  const [whatsappUrl, setWhatsappUrl] = useState('');
  const [participantCount, setParticipantCount] = useState(0);

  // Read ?subject= from URL on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const subj = params.get('subject');
      if (subj && CONTEST_SUBJECTS.some((s) => s.name === subj)) {
        setSelectedSubject(subj);
      }
    }
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

  // Poll contest active flag and participant count for selected subject every 5s
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch(`/api/contest/is-active?subject=${encodeURIComponent(selectedSubject)}`);
        const data = await res.json();
        setContestActive(Boolean(data.active));
        setParticipantCount(Number(data.participants) || 0);
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [selectedSubject]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const register = async () => {
    setMessage('');
    try {
      const res = await fetch('/api/contest/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          school: form.school,
          phoneNumber: form.phone,
          subject: selectedSubject,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setParticipantId(data.participantId);
        setMessage(`✅ STK push sent for ${selectedSubject} (KSh 500)! Check your phone and enter your M-Pesa PIN.`);
        if (data.whatsappUrl) setWhatsappUrl(data.whatsappUrl);
      } else {
        setMessage(`❌ ${data.message || 'Registration failed. Please try again.'}`);
      }
    } catch {
      setMessage('❌ Network error. Please check your connection and try again.');
    }
  };

  const startContest = () => {
    const url = participantId
      ? `/contest/test?pid=${participantId}&subject=${encodeURIComponent(selectedSubject)}`
      : `/contest/test?subject=${encodeURIComponent(selectedSubject)}`;
    window.location.href = url;
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
        <h1 className="text-3xl font-extrabold mb-1 tracking-tight">NATIONAL CONTEST – JUNIOR SCHOOL</h1>
        <p className="text-blue-200 mb-4 text-sm">
          All Junior School Subjects · <strong>KSh 500 per Subject Test</strong> · 100 Marks · 2 Hours
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
            🚀 NATIONAL CONTEST – START {selectedSubject.toUpperCase()} TEST NOW
          </button>
        ) : (
          <div className="bg-blue-800 bg-opacity-60 rounded-xl py-3 px-4">
            <p className="text-blue-100 font-semibold">
              <strong>{selectedSubject}</strong> Test opens when <strong>1,000 participants</strong> have paid &amp; confirmed
            </p>
            <p className="text-blue-200 text-sm mt-1">
              {participantCount} / 1,000 participants confirmed for {selectedSubject}
            </p>
            <div className="w-full bg-blue-900 rounded-full h-3 mt-2">
              <div
                className="bg-green-400 h-3 rounded-full transition-all"
                style={{ width: `${Math.min(100, (participantCount / 1000) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* ── ALL SUBJECTS NATIONAL CONTEST TESTS (KSh 500 EACH) ── */}
      <section className="mb-6 p-4 border rounded-xl bg-white shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
          <h2 className="text-lg font-bold">📚 Select Your Subject National Contest Test</h2>
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
                <div className="text-[11px] font-semibold text-emerald-700 mt-1">KSh 500</div>
              </button>
            );
          })}
        </div>
      </section>

      {/* ── Contest Instructions ── */}
      <section className="mb-6 p-4 border rounded-xl bg-gray-50">
        <h2 className="text-lg font-bold mb-2">📋 Contest Instructions</h2>
        <ul className="list-disc ml-5 space-y-1 text-sm">
          <li>Select any Junior School subject test above and pay <strong>KSh 500</strong> via M-Pesa STK Push to become a participant.</li>
          <li>The quiz opens once at least <strong>1,000 participants</strong> have confirmed payment.</li>
          <li>Immediately after payment, you will be notified that the test will open soon once all participants are set.</li>
          <li>The test is timed at <strong>2 hours</strong> and is worth <strong>100 marks</strong>.</li>
          <li>For structured questions, write your answers clearly in your exercise book, take clear photos, and upload them for auto-marking.</li>
          <li>Public positions and marks scored by each student will be posted on the leaderboard.</li>
        </ul>
      </section>

      {/* ── Registration Form ── */}
      <section className="mb-6 p-4 border rounded-xl bg-white">
        <h2 className="text-lg font-bold mb-3">
          📝 Register &amp; Pay — <span className="text-blue-700">{selectedSubject} (KSh 500)</span>
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
          <input
            name="phone"
            placeholder="M-Pesa Phone (e.g. 0712345678)"
            className="border p-3 rounded-lg w-full"
            value={form.phone}
            onChange={handleChange}
          />
          <button
            onClick={register}
            className="w-full bg-blue-700 hover:bg-blue-800 text-white font-bold py-3 rounded-lg text-lg cursor-pointer"
          >
            💳 Register for {selectedSubject} &amp; Pay KSh 500 via M-Pesa
          </button>
        </div>

        {message && (
          <p className={`mt-3 p-3 rounded-lg text-sm font-medium ${message.startsWith('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {message}
          </p>
        )}

        {paymentStatus && (
          <p className="mt-2 text-sm">
            Payment status: <strong className={paymentStatus === 'confirmed' ? 'text-green-700' : 'text-orange-600'}>{paymentStatus}</strong>
            {paymentStatus === 'confirmed' && ' ✅ – Payment confirmed! The test will open soon once 1,000 participants are set.'}
            {paymentStatus === 'pending' && ' – Waiting for M-Pesa confirmation…'}
          </p>
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
            onClick={() => { window.location.href = '/contest/leaderboard'; }}
            className="bg-gray-800 hover:bg-gray-900 text-white text-sm py-2 px-4 rounded-lg cursor-pointer"
          >
            🏅 View Public Leaderboard
          </button>
        </div>
      </section>

    </div>
  );
}
