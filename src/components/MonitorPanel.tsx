// src/components/MonitorPanel.tsx
'use client';

import React, { useState } from 'react';

/**
 * Simple admin monitor panel with buttons for common actions.
 * Each button calls a corresponding API route and displays the result.
 */
export default function MonitorPanel() {
  const [output, setOutput] = useState<string>('');
  const callApi = async (path: string, label: string) => {
    setOutput(`⏳ ${label}...`);
    try {
      const res = await fetch(path, { method: 'POST' });
      const data = await res.json();
      setOutput(JSON.stringify(data, null, 2));
    } catch (e) {
      setOutput(`❌ ${label} failed: ${e}`);
    }
  };

  return (
    <div className="p-4 border rounded bg-white">
      <h2 className="text-xl font-bold mb-4">Admin Monitor Panel</h2>
      <div className="grid grid-cols-2 gap-4 mb-4">
        <button
          className="px-4 py-2 bg-blue-600 text-white rounded"
          onClick={() => callApi('/api/admin/run-build', 'Run Build')}
        >
          Run Build
        </button>
        <button
          className="px-4 py-2 bg-green-600 text-white rounded"
          onClick={() => callApi('/api/admin/start-dev', 'Start Dev Server')}
        >
          Start Dev Server
        </button>
        <button
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          onClick={() => callApi('/api/admin/check-vip', 'Check VIP Endpoint')}
        >
          Check VIP Endpoint
        </button>
        <button
          className="px-4 py-2 bg-gray-600 text-white rounded"
          onClick={() => callApi('/api/admin/view-logs', 'View Logs')}
        >
          View Logs
        </button>
      </div>
      <pre className="bg-gray-100 p-2 rounded overflow-auto" style={{ maxHeight: '300px' }}>
{output}
      </pre>
    </div>
  );
}
