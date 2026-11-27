// src/app/contest/test/page.tsx
'use client';

import React, { useState, useEffect } from 'react';

/**
 * Test page shown after the contest is activated.
 * - Displays remaining time (2 hours countdown).
 * - Allows participant to upload a photo of their answer sheet.
 * - Shows the auto‑graded score returned by the server.
 */
export default function ContestTestPage() {
  // Grab participant ID from query string (if present)
  const [participantId, setParticipantId] = useState<string>('');
  const [remaining, setRemaining] = useState<number>(2 * 60 * 60); // seconds
  const [uploadResult, setUploadResult] = useState<{ success: boolean; marks?: number; message?: string } | null>(null);

  // Extract pid query param on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const pid = params.get('pid');
      if (pid) setParticipantId(pid);
    }
  }, []);

  // Countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

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
    } catch (err) {
      setUploadResult({ success: false, message: (err as any).toString() });
    }
  };

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
          <div className="mt-3 p-2 border rounded" style={{ backgroundColor: uploadResult.success ? '#e6ffed' : '#ffe6e6' }}>
            {uploadResult.success ? (
              <p>✅ Uploaded! Your score: <strong>{uploadResult.marks}</strong></p>
            ) : (
              <p>❌ Upload failed: {uploadResult.message}</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
