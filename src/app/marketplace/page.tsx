import React, { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Marketplace page – lists teacher assets and allows purchase via M‑Pesa STK.
 */
export default async function MarketplacePage() {
  // Server‑side fetch of assets
  const { data: assets, error } = await supabase
    .from('teacher_assets')
    .select('id, title, description, price, file_url')
    .order('created_at', { ascending: false });
  if (error) {
    console.error('Failed to fetch assets', error);
    return <div className="p-4 text-red-600">Error loading marketplace.</div>;
  }

  return (
    <main className="max-w-4xl mx-auto p-4">
      <h1 className="text-3xl font-bold mb-6">Teacher Marketplace</h1>
      {assets && assets.length > 0 ? (
        <ul className="space-y-4">
          {assets.map((a) => (
            <li key={a.id} className="border rounded-lg p-4 flex flex-col md:flex-row justify-between items-start">
              <div className="flex-1">
                <h2 className="text-xl font-semibold">{a.title}</h2>
                {a.description && <p className="text-sm text-gray-600 mb-2">{a.description}</p>}
                <p className="font-bold">KES {a.price}</p>
                <a href={a.file_url} target="_blank" rel="noreferrer" className="text-blue-600 underline mt-1 block">
                  Download
                </a>
              </div>
              <PurchaseButton assetId={a.id} price={a.price} title={a.title} />
            </li>
          ))}
        </ul>
      ) : (
        <p>No assets available.</p>
      )}
    </main>
  );
}

function PurchaseButton({ assetId, price, title }: { assetId: string; price: number; title: string }) {
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const handlePurchase = async () => {
    setStatus('Initiating...');
    try {
      const res = await fetch('/api/teacher/assets/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ buyerId: 'CURRENT_USER_ID', assetId, phoneNumber: phone }),
      });
      const data = await res.json();
      if (data.success) setStatus('STK push sent – check your phone');
      else setStatus(data.message || 'Error');
    } catch (e) {
      setStatus('Network error');
    }
  };
  return (
    <div className="mt-4 md:mt-0 md:ml-4 w-full md:w-auto">
      <input
        type="tel"
        placeholder="Your phone (2547...)"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        className="border rounded px-2 py-1 mr-2 w-full md:w-auto"
      />
      <button
        onClick={handlePurchase}
        disabled={!phone}
        className="bg-emerald-600 text-white px-3 py-1 rounded hover:bg-emerald-700"
      >
        Buy KES {price}
      </button>
      {status && <p className="text-sm mt-1">{status}</p>}
    </div>
  );
}
