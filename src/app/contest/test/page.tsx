// src/app/contest/test/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Test page shown after the contest is activated.
 * - Places the learner in their registered Grade (6, 7, 8, or 9) and Subject test.
 * - Guards access until the contest is active (threshold met & activated).
 * - Displays remaining time (2 hours countdown).
 * - Allows participant to upload a photo of their answer sheet.
 */
export default function ContestTestPage() {
  const [participantId, setParticipantId] = useState<string>('');
  const [grade, setGrade] = useState<string>('Grade 7');
  const [subject, setSubject] = useState<string>('Mathematics');
  const [contestActive, setContestActive] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number>(2 * 60 * 60);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; marks?: number; message?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid') || window.localStorage.getItem('contest_participant_id');
    const urlGrade = params.get('grade');
    const urlSubject = params.get('subject');

    queueMicrotask(() => {
      if (pid) setParticipantId(pid);
      if (urlGrade) setGrade(urlGrade);
      if (urlSubject) setSubject(urlSubject);
    });

    if (pid) {
      fetch(`/api/contest/status/${pid}`)
        .then((r) => r.json())
        .then((d) => {
          if (d.grade) setGrade(d.grade);
          if (d.subject) setSubject(d.subject);
        })
        .catch(() => {});
    }

    fetch('/api/contest/is-active')
      .then((r) => r.json())
      .then((d) => setContestActive(Boolean(d.active)))
      .catch(() => setContestActive(false));
  }, []);

  useEffect(() => {
    if (!contestActive) return;
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [contestActive]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !participantId) return;
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch(`/api/contest/upload-answer/${participantId}`, {
        method: 'POST',
        headers: {
          'x-participant-id': participantId,
        },
        body: formData,
      });
      const data = await res.json();
      setUploadResult(data);
    } catch (err: unknown) {
      setUploadResult({ success: false, message: err instanceof Error ? err.message : String(err) });
    }
  };

  if (contestActive === null) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center">
        <p className="text-gray-600">Checking contest status…</p>
      </div>
    );
  }

  if (!contestActive) {
    return (
      <div className="max-w-2xl mx-auto p-6 text-center border rounded-2xl mt-8 bg-blue-50">
        <h1 className="text-2xl font-bold mb-2">⏳ The Test Is Almost Here!</h1>
        <p className="text-gray-700 mb-4">
          Your <strong>{grade} {subject}</strong> National Contest test will open soon. Keep your phone and exercise book ready!
        </p>
        <Link
          href="/contest"
          className="inline-block bg-blue-700 text-white font-semibold px-5 py-2.5 rounded-lg"
        >
          ← Back to Contest Page
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-2">National Contest – {grade} {subject}</h1>
      <p className="mb-4 text-sm text-gray-700">
        Total Marks: <strong>100 Marks</strong> · Time remaining: <strong>{formatTime(remaining)}</strong>
      </p>
      <section className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Upload Structured Answer Sheet Photo</h2>
        <p className="text-sm text-gray-600 mb-3">
          Write your answers clearly in your exercise book, take a clear photo, and upload it below for auto-marking.
        </p>
        <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 rounded" />
        {uploadResult && (
          <div
            className="mt-3 p-2 border rounded"
            style={{ backgroundColor: uploadResult.success ? '#e6ffed' : '#ffe6e6' }}
          >
            {uploadResult.success ? (
              <p>
                ✅ Uploaded! Your score: <strong>{uploadResult.marks} / 100</strong>
              </p>
            ) : (
              <p>❌ Upload failed: {uploadResult.message}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
