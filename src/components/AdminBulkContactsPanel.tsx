'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { UploadCloud, Send, Users, Search, MessageCircle, Smartphone, Trash2, CheckSquare } from 'lucide-react';

interface BulkContact {
  id: string;
  name: string;
  phoneIntl: string;
  phoneLocal: string;
  label: string;
  addedAt: string;
  lastMessagedAt?: string;
}

interface BulkSendResult {
  id: string;
  name: string;
  phoneLocal: string;
  whatsappSent: boolean;
  inboxSent: boolean;
  whatsappUrl: string;
  smsUrl: string;
  note: string;
}

const DEFAULT_BULK_AD =
  'Hello {name}! 🏆 NATIONAL CONTEST (Grades 6, 7, 8 & 9) is on cbcmaterials.shop! Win a Brand New Laptop, KSh 20,000 School Fee & School Uniform. Register for any subject (KSh 500): https://www.cbcmaterials.shop/contest';

export default function AdminBulkContactsPanel({ password }: { password: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState<BulkContact[]>([]);
  const [hasWhatsAppApi, setHasWhatsAppApi] = useState(false);
  const [hasSmsApi, setHasSmsApi] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [labelInput, setLabelInput] = useState('National Contest Lead');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [channel, setChannel] = useState<'both' | 'whatsapp' | 'inbox'>('both');
  const [messageText, setMessageText] = useState(DEFAULT_BULK_AD);
  const [statusMsg, setStatusMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [sendResults, setSendResults] = useState<BulkSendResult[]>([]);
  const [showApiSetup, setShowApiSetup] = useState(false);
  const [apiForm, setApiForm] = useState({
    whapiToken: '',
    metaAccessToken: '',
    metaPhoneNumberId: '',
    whatsappWebhookUrl: '',
    atUsername: '',
    atApiKey: '',
    twilioSid: '',
    twilioToken: '',
    twilioFrom: '',
    smsWebhookUrl: '',
  });

  const loadContacts = async () => {
    try {
      const res = await fetch('/api/admin/bulk-contacts', {
        headers: { 'x-admin-password': password },
      });
      const data = await res.json();
      if (data.ok) {
        setContacts(data.contacts || []);
        setHasWhatsAppApi(Boolean(data.hasWhatsAppApi));
        setHasSmsApi(Boolean(data.hasSmsApi));
      }
    } catch {}
  };

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-bulk-contacts', handler);
    return () => window.removeEventListener('open-bulk-contacts', handler);
  }, []);

  useEffect(() => {
    if (!isOpen || !password) return;
    let active = true;
    fetch('/api/admin/bulk-contacts', {
      headers: { 'x-admin-password': password },
    })
      .then((res) => res.json())
      .then((data) => {
        if (!active || !data.ok) return;
        setContacts(data.contacts || []);
        setHasWhatsAppApi(Boolean(data.hasWhatsAppApi));
        setHasSmsApi(Boolean(data.hasSmsApi));
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [isOpen, password]);

  const filteredContacts = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    if (!q) return contacts;
    return contacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phoneLocal.includes(q) ||
        c.phoneIntl.includes(q) ||
        c.label.toLowerCase().includes(q)
    );
  }, [contacts, searchTerm]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    setRawInput(text);
    setStatusMsg(`Loaded ${file.name}. Click "Save & Import Contacts" below.`);
  };

  const handleImport = async () => {
    if (!rawInput.trim()) {
      setStatusMsg('❌ Please upload a contact file (.vcf / .csv / .txt) or paste phone numbers first.');
      return;
    }
    setBusy(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/admin/bulk-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'import',
          rawText: rawInput,
          label: labelInput,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setContacts(data.contacts || []);
        setRawInput('');
        setStatusMsg(`✅ Imported ${data.addedCount} new contacts (Total saved: ${data.totalCount}).`);
      } else {
        setStatusMsg(`❌ ${data.error || 'Import failed'}`);
      }
    } catch {
      setStatusMsg('❌ Network error importing contacts.');
    } finally {
      setBusy(false);
    }
  };

  const selectFirst100 = () => {
    setSelectedIds(filteredContacts.slice(0, 100).map((c) => c.id));
  };

  const selectAllFiltered = () => {
    setSelectedIds(filteredContacts.map((c) => c.id));
  };

  const toggleId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const handleBulkSend = async () => {
    if (selectedIds.length === 0) {
      setStatusMsg('❌ Select at least 1 customer (or click "Select 100 Contacts").');
      return;
    }
    setBusy(true);
    setStatusMsg('');
    setSendResults([]);
    try {
      const res = await fetch('/api/admin/bulk-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'send_bulk',
          contactIds: selectedIds,
          channel,
          message: messageText,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setSendResults(data.results || []);
        setStatusMsg(
          `✅ Processed ${data.processed} contacts — WhatsApp API Sent: ${data.whatsappSentCount}, SMS Inbox API Sent: ${data.inboxSentCount}.`
        );
        await loadContacts();
      } else {
        setStatusMsg(`❌ ${data.error || 'Bulk send failed'}`);
      }
    } catch {
      setStatusMsg('❌ Network error sending bulk messages.');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveApiConfig = async () => {
    setBusy(true);
    setStatusMsg('');
    try {
      const res = await fetch('/api/admin/bulk-contacts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({
          action: 'save_config',
          ...apiForm,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setHasWhatsAppApi(Boolean(data.hasWhatsAppApi));
        setHasSmsApi(Boolean(data.hasSmsApi));
        setShowApiSetup(false);
        setStatusMsg(`✅ ${data.message}`);
      } else {
        setStatusMsg(`❌ ${data.error || 'Failed to save API settings'}`);
      }
    } catch {
      setStatusMsg('❌ Network error saving API settings.');
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (id: string) => {
    const res = await fetch('/api/admin/bulk-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-admin-password': password },
      body: JSON.stringify({ action: 'delete', id }),
    });
    const data = await res.json();
    if (data.ok) {
      setContacts(data.contacts || []);
      setSelectedIds((prev) => prev.filter((x) => x !== id));
    }
  };

  return (
    <section id="bulk-contacts-panel" className="bg-white border-2 border-emerald-500 rounded-2xl p-6 shadow-sm space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-extrabold text-slate-900">
              Bulk Contacts Upload &amp; Messaging (100+ Numbers: WhatsApp &amp; Inbox)
            </h2>
            <p className="text-xs text-slate-600">
              Upload phone numbers from your contact list (.vcf, .csv, .txt or paste), identify customers by Name &amp; Tag, and send bulk WhatsApp + SMS Inbox messages.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setIsOpen((v) => !v)}
          className="bg-emerald-700 hover:bg-emerald-800 text-white font-bold px-4 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer"
        >
          <UploadCloud className="w-4 h-4" />
          <span>{isOpen ? 'Hide Bulk Contacts Panel' : 'Upload Contacts & Send Bulk (100+)'}</span>
        </button>
      </div>

      {isOpen && (
        <div className="pt-4 border-t border-slate-200 space-y-6">
          {/* API Readiness Badges + Setup Toggle */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className={`px-3 py-1 rounded-full font-bold ${hasWhatsAppApi ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
              {hasWhatsAppApi ? '✅ WhatsApp API Connected' : '⚠️ WhatsApp API Not Connected'}
            </span>
            <span className={`px-3 py-1 rounded-full font-bold ${hasSmsApi ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'}`}>
              {hasSmsApi ? '✅ SMS Inbox API Connected' : '⚠️ SMS Inbox API Not Connected'}
            </span>
            <button
              type="button"
              onClick={() => setShowApiSetup((v) => !v)}
              className="bg-slate-800 hover:bg-slate-900 text-white px-3 py-1 rounded-full font-bold cursor-pointer"
            >
              {showApiSetup ? 'Close API Setup' : '⚙️ Connect WhatsApp & SMS APIs'}
            </button>
          </div>

          {showApiSetup && (
            <div className="bg-slate-900 text-white rounded-xl p-4 space-y-3 text-xs">
              <div className="font-bold text-sm text-emerald-300">
                ⚙️ Connect Automated Bulk WhatsApp &amp; SMS Inbox APIs (Saved Securely in Cloud Vault)
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-2 bg-slate-800 p-3 rounded-lg">
                  <div className="font-bold text-emerald-300">WhatsApp API (Whapi.cloud, Meta Cloud, or Webhook)</div>
                  <input
                    type="password"
                    placeholder="Whapi.cloud API Token (recommended)"
                    value={apiForm.whapiToken}
                    onChange={(e) => setApiForm({ ...apiForm, whapiToken: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="password"
                    placeholder="Meta WhatsApp Access Token (optional)"
                    value={apiForm.metaAccessToken}
                    onChange={(e) => setApiForm({ ...apiForm, metaAccessToken: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Meta Phone Number ID (optional)"
                    value={apiForm.metaPhoneNumberId}
                    onChange={(e) => setApiForm({ ...apiForm, metaPhoneNumberId: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Custom WhatsApp Webhook URL (optional)"
                    value={apiForm.whatsappWebhookUrl}
                    onChange={(e) => setApiForm({ ...apiForm, whatsappWebhookUrl: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
                <div className="space-y-2 bg-slate-800 p-3 rounded-lg">
                  <div className="font-bold text-sky-300">SMS Inbox API (Africa&apos;s Talking, Twilio, or Webhook)</div>
                  <input
                    type="text"
                    placeholder="Africa's Talking Username (e.g. cbcmaterials)"
                    value={apiForm.atUsername}
                    onChange={(e) => setApiForm({ ...apiForm, atUsername: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="password"
                    placeholder="Africa's Talking API Key"
                    value={apiForm.atApiKey}
                    onChange={(e) => setApiForm({ ...apiForm, atApiKey: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Twilio Account SID (optional)"
                    value={apiForm.twilioSid}
                    onChange={(e) => setApiForm({ ...apiForm, twilioSid: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                  <input
                    type="text"
                    placeholder="Custom SMS Webhook URL (optional)"
                    value={apiForm.smsWebhookUrl}
                    onChange={(e) => setApiForm({ ...apiForm, smsWebhookUrl: e.target.value })}
                    className="w-full rounded px-2.5 py-1.5 bg-slate-950 border border-slate-700 text-white"
                  />
                </div>
              </div>
              <button
                type="button"
                onClick={handleSaveApiConfig}
                disabled={busy}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black px-4 py-2 rounded-lg cursor-pointer"
              >
                {busy ? 'Saving…' : '💾 Save & Activate WhatsApp + SMS APIs'}
              </button>
            </div>
          )}

          {/* Step 1: Upload / Paste Contacts */}
          <div className="bg-slate-50 border rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-slate-900">1. Upload Contact List (.vcf, .csv, .txt) or Paste 100+ Numbers</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="block border-2 border-dashed border-emerald-400 rounded-xl p-3 bg-white cursor-pointer text-xs font-semibold text-emerald-800 hover:bg-emerald-50">
                <span>📁 Choose Contact File (.vcf, .csv, .txt)</span>
                <input type="file" accept=".vcf,.csv,.txt" onChange={handleFileUpload} className="hidden" />
              </label>
              <input
                type="text"
                value={labelInput}
                onChange={(e) => setLabelInput(e.target.value)}
                placeholder="Customer Tag / Group (e.g. Grade 7 Parents)"
                className="border rounded-xl px-3 py-2 text-sm bg-white"
              />
            </div>
            <textarea
              rows={4}
              value={rawInput}
              onChange={(e) => setRawInput(e.target.value)}
              placeholder={"Paste 100+ numbers or Name, Phone, Tag (one per line):\nJohn Kamau, 0705759072, Grade 7 Parent\nMary Wanjiku, 0712345678, Teacher"}
              className="w-full border rounded-xl p-3 text-xs font-mono bg-white"
            />
            <button
              type="button"
              onClick={handleImport}
              disabled={busy}
              className="bg-blue-700 hover:bg-blue-800 text-white font-bold px-4 py-2 rounded-xl text-sm cursor-pointer disabled:opacity-60"
            >
              {busy ? 'Saving…' : '💾 Save & Import Contacts'}
            </button>
          </div>

          {/* Step 2: Identify Customers & Select 100+ */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Identify customer by Name, Phone (07...), or Tag..."
                  className="w-full border rounded-xl pl-9 pr-3 py-2 text-sm"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={selectFirst100}
                  className="bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold px-3 py-2 rounded-lg inline-flex items-center gap-1 cursor-pointer"
                >
                  <CheckSquare className="w-3.5 h-3.5" /> Select First 100 ({Math.min(100, filteredContacts.length)})
                </button>
                <button
                  type="button"
                  onClick={selectAllFiltered}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-900 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
                >
                  Select All ({filteredContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer"
                >
                  Clear ({selectedIds.length})
                </button>
              </div>
            </div>

            <div className="max-h-60 overflow-y-auto border rounded-xl">
              <table className="w-full text-xs">
                <thead className="bg-slate-100 sticky top-0">
                  <tr>
                    <th className="p-2 text-left">Pick</th>
                    <th className="p-2 text-left">Customer Name</th>
                    <th className="p-2 text-left">Phone</th>
                    <th className="p-2 text-left">Tag / Label</th>
                    <th className="p-2 text-left">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredContacts.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-4 text-center text-slate-500">
                        No contacts uploaded yet. Upload your contact list above!
                      </td>
                    </tr>
                  ) : (
                    filteredContacts.map((c) => (
                      <tr key={c.id} className="border-t hover:bg-slate-50">
                        <td className="p-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(c.id)}
                            onChange={() => toggleId(c.id)}
                          />
                        </td>
                        <td className="p-2 font-bold text-slate-900">{c.name}</td>
                        <td className="p-2 font-mono">{c.phoneLocal}</td>
                        <td className="p-2">
                          <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full font-semibold">
                            {c.label}
                          </span>
                        </td>
                        <td className="p-2">
                          <button
                            type="button"
                            onClick={() => handleDelete(c.id)}
                            className="text-red-600 hover:text-red-800 cursor-pointer"
                            title="Remove contact"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Step 3: Compose & Send Bulk WhatsApp + Inbox */}
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
            <h3 className="font-bold text-sm text-emerald-950">
              3. Send Bulk Message ({selectedIds.length} Selected) — Use {'{name}'} to personalize
            </h3>
            <div className="flex flex-wrap gap-2">
              {(['both', 'whatsapp', 'inbox'] as const).map((ch) => (
                <button
                  key={ch}
                  type="button"
                  onClick={() => setChannel(ch)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer ${
                    channel === ch ? 'bg-emerald-700 text-white' : 'bg-white border text-slate-800'
                  }`}
                >
                  {ch === 'both' ? '📲 Both WhatsApp & Inbox (SMS)' : ch === 'whatsapp' ? '💬 WhatsApp Only' : '📩 Inbox (SMS) Only'}
                </button>
              ))}
            </div>
            <textarea
              rows={3}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              className="w-full border rounded-xl p-3 text-xs bg-white"
            />
            <button
              type="button"
              onClick={handleBulkSend}
              disabled={busy || selectedIds.length === 0}
              className="bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>{busy ? 'Sending…' : `🚀 Send Bulk Message to ${selectedIds.length} Customers`}</span>
            </button>
          </div>

          {statusMsg && (
            <p className="text-sm font-semibold p-3 rounded-xl bg-slate-100 text-slate-900">{statusMsg}</p>
          )}

          {sendResults.length > 0 && (
            <div className="max-h-56 overflow-y-auto border rounded-xl p-3 space-y-2 bg-white">
              <div className="text-xs font-bold text-slate-700">Bulk Dispatch Results ({sendResults.length}):</div>
              {sendResults.map((r) => (
                <div key={r.id} className="flex flex-wrap items-center justify-between gap-2 text-xs border-t pt-2">
                  <div>
                    <span className="font-bold">{r.name}</span> ({r.phoneLocal}) — <span className="text-slate-600">{r.note}</span>
                  </div>
                  <div className="flex gap-2">
                    <a
                      href={r.whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-green-600 text-white px-2.5 py-1 rounded font-bold inline-flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" /> WA
                    </a>
                    <a
                      href={r.smsUrl}
                      className="bg-blue-600 text-white px-2.5 py-1 rounded font-bold inline-flex items-center gap-1"
                    >
                      <Smartphone className="w-3 h-3" /> Inbox
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
