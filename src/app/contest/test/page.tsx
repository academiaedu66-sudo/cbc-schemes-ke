// src/app/contest/test/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';

/**
 * Test page shown after the contest is activated.
 * - Guards access until the contest is active (threshold met & activated).
 * - Displays remaining time (2 hours countdown).
 * - Allows participant to upload a photo of their answer sheet.
 * - Shows the auto-graded score returned by the server.
 */
export default function ContestTestPage() {
  const [participantId, setParticipantId] = useState<string>('');
  const [contestActive, setContestActive] = useState<boolean | null>(null);
  const [remaining, setRemaining] = useState<number>(2 * 60 * 60);
  const [uploadResult, setUploadResult] = useState<{ success: boolean; marks?: number; message?: string } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const pid = params.get('pid') || window.localStorage.getItem('contest_participant_id');
    if (pid) {
      queueMicrotask(() => setParticipantId(pid));
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
          The National Contest test will open soon. Keep your phone and exercise book ready!
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
      <h1 className="text-3xl font-bold mb-4">National Contest – Test</h1>
      <p className="mb-2">
        Time remaining: <strong>{formatTime(remaining)}</strong>
      </p>
      <section className="mb-6 p-4 border rounded bg-gray-50">
        <h2 className="text-xl font-semibold mb-2">Upload Answer Sheet</h2>
        <input type="file" accept="image/*" onChange={handleUpload} className="border p-2 rounded" />
        {uploadResult && (
          <div
            className="mt-3 p-2 border rounded"
            style={{ backgroundColor: uploadResult.success ? '#e6ffed' : '#ffe6e6' }}
          >
            {uploadResult.success ? (
              <p>
                ✅ Uploaded! Your score: <strong>{uploadResult.marks}</strong>
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
