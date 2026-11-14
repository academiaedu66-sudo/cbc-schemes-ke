'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  UploadCloud,
  Trash2,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Eye,
  Download,
  Lock,
  Plus,
  FileText,
  RefreshCw,
  Check,
  XCircle,
  MessageCircle,
  Wallet,
} from 'lucide-react';
import {
  MATERIAL_CATEGORIES,
  DEFAULT_PRICES,
  formatTermLabel,
  getLevelForGrade,
  parseFilenameToMetadata,
  type MaterialCategory,
} from '@/lib/material-utils';
import PreviewModal from '@/components/PreviewModal';
import type { ResourceItem } from '@/components/ResourceCard';

interface QueuedUpload {
  uid: string;
  file: File;
  title: string;
  grade: number;
  level: string;
  category: MaterialCategory;
  subject: string;
  term: number;
  price: number;
  description: string;
  strands: string;
  status: 'READY' | 'UPLOADING' | 'DONE' | 'ERROR';
  errorMsg?: string;
}

interface AdminResource extends ResourceItem {
  hasStorageFile: boolean;
  created_at?: string;
}

interface OrderRow {
  id: string;
  checkout_request_id: string;
  phone_number: string;
  resource_id: string;
  resource_title: string;
  amount: number;
  mpesa_receipt_number?: string | null;
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  created_at?: string;
}

export default function AdminDashboardPage() {
  const [password, setPassword] = useState('');
  const [authenticated, setAuthenticated] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);

  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(false);
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);

  const [inventory, setInventory] = useState<AdminResource[]>([]);
  const [storageCount, setStorageCount] = useState(0);
  const [isLoadingInv, setIsLoadingInv] = useState(false);
  const [searchFilter, setSearchFilter] = useState('');
  const [adminVisibleCount, setAdminVisibleCount] = useState(60);

  const [queue, setQueue] = useState<QueuedUpload[]>([]);
  const [isUploadingAll, setIsUploadingAll] = useState(false);
  const [expandedUid, setExpandedUid] = useState<string | null>(null);
  const [previewItem, setPreviewItem] = useState<ResourceItem | null>(null);

  const fetchOrders = useCallback(async (pw: string) => {
    setIsLoadingOrders(true);
    try {
      const res = await fetch('/api/admin/orders', {
        headers: { 'x-admin-password': pw },
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.orders)) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  const fetchInventory = useCallback(
    async (pw: string) => {
      setIsLoadingInv(true);
      setAuthError('');
      try {
        const res = await fetch('/api/admin/resources', {
          headers: { 'x-admin-password': pw },
        });
        const data = await res.json();
        if (!res.ok) {
          if (res.status === 401) {
            setAuthenticated(false);
            sessionStorage.removeItem('cbc_admin_pw');
          }
          throw new Error(data.error || 'Failed to authenticate');
        }
        setAuthenticated(true);
        sessionStorage.setItem('cbc_admin_pw', pw);
        setInventory(data.resources || []);
        setStorageCount(data.storageFilesCount || 0);
        await fetchOrders(pw);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Login failed';
        setAuthError(message);
      } finally {
        setIsLoadingInv(false);
        setIsCheckingAuth(false);
      }
    },
    [fetchOrders]
  );

  useEffect(() => {
    const saved = sessionStorage.getItem('cbc_admin_pw');
    if (saved) {
      setPassword(saved);
      setIsCheckingAuth(true);
      fetchInventory(saved);
    }
  }, [fetchInventory]);

  // Auto-refresh M-Pesa orders every 10 seconds while logged in
  useEffect(() => {
    if (!authenticated || !password) return;
    const timer = setInterval(() => {
      fetchOrders(password);
    }, 10000);
    return () => clearInterval(timer);
  }, [authenticated, password, fetchOrders]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCheckingAuth(true);
    await fetchInventory(password);
  };

  const handleOrderStatus = async (
    order: OrderRow,
    newStatus: 'COMPLETED' | 'FAILED'
  ) => {
    setUpdatingOrderId(order.id);
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': password,
        },
        body: JSON.stringify({ id: order.id, status: newStatus }),
      });
      if (res.ok) {
        await fetchOrders(password);
      }
    } catch (err) {
      console.error('Order status update error:', err);
    } finally {
      setUpdatingOrderId(null);
    }
  };

  const handleSendWhatsAppDownload = async (order: OrderRow) => {
    try {
      const res = await fetch(
        `/api/admin/orders?signedResourceId=${encodeURIComponent(order.resource_id)}`,
        { headers: { 'x-admin-password': password } }
      );
      const data = await res.json();
      if (!res.ok || !data.downloadUrl) return;

      const digits = (order.phone_number || '').replace(/[^0-9]/g, '');
      const waTarget = /^254[17]\d{8}$/.test(digits) ? digits : '';
      const msg = `Thank you for your M-Pesa payment (KES ${order.amount})! Download "${order.resource_title}" here:\n${data.downloadUrl}`;
      const url = waTarget
        ? `https://wa.me/${waTarget}?text=${encodeURIComponent(msg)}`
        : `https://wa.me/?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('WhatsApp link error:', err);
    }
  };

  const handleFilesSelected = (filesList: FileList | null) => {
    if (!filesList || filesList.length === 0) return;
    const newItems: QueuedUpload[] = [];

    Array.from(filesList).forEach((file) => {
      const parsed = parseFilenameToMetadata(file.name);
      const uid = `${file.name}-${file.size}-${Math.random().toString(36).slice(2, 7)}`;
      newItems.push({
        uid,
        file,
        title: parsed.title,
        grade: parsed.grade,
        level: parsed.level,
        category: parsed.category,
        subject: parsed.subject,
        term: parsed.term,
        price: parsed.price,
        description: '',
        strands: '',
        status: 'READY',
      });
    });

    setQueue((prev) => [...prev, ...newItems]);
    if (newItems.length === 1) {
      setExpandedUid(newItems[0].uid);
    }
  };

  const updateQueuedItem = (uid: string, patch: Partial<QueuedUpload>) => {
    setQueue((prev) =>
      prev.map((item) => {
        if (item.uid !== uid) return item;
        const updated = { ...item, ...patch };
        if (patch.grade !== undefined) {
          updated.level = getLevelForGrade(patch.grade);
        }
        if (patch.category !== undefined && patch.price === undefined) {
          updated.price = DEFAULT_PRICES[patch.category];
        }
        return updated;
      })
    );
  };

  const uploadSingleItem = async (item: QueuedUpload) => {
    updateQueuedItem(item.uid, { status: 'UPLOADING', errorMsg: undefined });
    try {
      const fd = new FormData();
      fd.append('file', item.file);
      fd.append('title', item.title);
      fd.append('grade', String(item.grade));
      fd.append('level', item.level);
      fd.append('category', item.category);
      fd.append('subject', item.subject);
      fd.append('term', String(item.term));
      fd.append('price', String(item.price));
      if (item.description.trim()) fd.append('description', item.description.trim());
      if (item.strands.trim()) fd.append('strands', item.strands.trim());

      const res = await fetch('/api/admin/resources', {
        method: 'POST',
        headers: { 'x-admin-password': password },
        body: fd,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Upload failed');

      updateQueuedItem(item.uid, { status: 'DONE' });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Upload error';
      updateQueuedItem(item.uid, { status: 'ERROR', errorMsg: message });
    }
  };

  const handleUploadAll = async () => {
    setIsUploadingAll(true);
    for (const item of queue) {
      if (item.status === 'READY' || item.status === 'ERROR') {
        await uploadSingleItem(item);
      }
    }
    await fetchInventory(password);
    setIsUploadingAll(false);
  };

  const handleAdminDownload = async (resItem: AdminResource) => {
    try {
      const res = await fetch(
        `/api/admin/resources?downloadId=${encodeURIComponent(resItem.id)}`,
        { headers: { 'x-admin-password': password } }
      );
      const data = await res.json();
      if (res.ok && data.downloadUrl) {
        window.open(data.downloadUrl, '_blank', 'noopener,noreferrer');
      }
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleDelete = async (resItem: AdminResource) => {
    const confirmed = window.confirm(
      `Delete "${resItem.title}" from the catalog and Supabase Storage?`
    );
    if (!confirmed) return;

    try {
      const res = await fetch(
        `/api/admin/resources?id=${encodeURIComponent(resItem.id)}&deleteFile=true`,
        {
          method: 'DELETE',
          headers: { 'x-admin-password': password },
        }
      );
      if (res.ok) {
        await fetchInventory(password);
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white border border-slate-200 rounded-2xl shadow-lg max-w-md w-full p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Lock className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-black text-slate-900 text-lg">
                  Materials &amp; M-Pesa Admin
                </h1>
                <p className="text-xs text-slate-500">
                  Approve 0728595160 payments &amp; manage CBC documents
                </p>
              </div>
            </div>
            <Link
              href="/"
              className="text-xs font-semibold text-slate-500 hover:text-slate-800 flex items-center gap-1"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Storefront
            </Link>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase mb-1">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter ADMIN_PASSWORD..."
                required
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            {authError && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg p-2.5">
                {authError}
              </p>
            )}
            <button
              type="submit"
              disabled={isCheckingAuth}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold py-2.5 rounded-xl text-sm transition flex items-center justify-center gap-2"
            >
              {isCheckingAuth && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign In to Admin
            </button>
          </form>
        </div>
      </div>
    );
  }

  const filteredInventory = inventory.filter(
    (r) =>
      r.title.toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.subject || '').toLowerCase().includes(searchFilter.toLowerCase()) ||
      (r.category || '').toLowerCase().includes(searchFilter.toLowerCase())
  );

  const pendingQueueCount = queue.filter(
    (q) => q.status === 'READY' || q.status === 'ERROR'
  ).length;

  const pendingOrdersCount = orders.filter((o) => o.status === 'PENDING').length;
  const completedOrders = orders.filter((o) => o.status === 'COMPLETED');
  const totalRevenueKes = completedOrders.reduce(
    (sum, o) => sum + (Number(o.amount) || 0),
    0
  );

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="bg-slate-900 text-white shadow">
        <div className="max-w-6xl mx-auto px-4 py-5 flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-black tracking-tight flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-emerald-400" />
              CBC Materials Studio &amp; M-Pesa Orders
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              M-Pesa: <strong className="text-emerald-300">0728595160 (254728595160)</strong> •
              WhatsApp Inbox: <strong className="text-emerald-300">0705759072 (254705759072)</strong> •{' '}
              {inventory.length} listings
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="bg-slate-800 hover:bg-slate-700 text-white px-3.5 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              View Live Storefront
            </Link>
            <button
              type="button"
              onClick={() => {
                sessionStorage.removeItem('cbc_admin_pw');
                setAuthenticated(false);
                setPassword('');
              }}
              className="text-xs text-slate-400 hover:text-white font-semibold"
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* 0. M-Pesa Orders & Instant Payment Approvals (254728595160) */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-base font-black text-slate-900 uppercase flex items-center gap-2">
                  M-Pesa Payments &amp; Order Approvals (0728595160)
                  {pendingOrdersCount > 0 && (
                    <span className="bg-amber-500 text-white text-[11px] font-black px-2 py-0.5 rounded-full animate-pulse">
                      {pendingOrdersCount} Pending
                    </span>
                  )}
                </h2>
                <p className="text-xs text-slate-500">
                  Verify M-Pesa SMS receipts received on <strong>254728595160</strong> and click{' '}
                  <strong>Approve</strong> to unlock the buyer&apos;s download immediately.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <div className="text-[10px] font-bold uppercase text-slate-400">
                  Recent Verified Sales
                </div>
                <div className="text-sm font-black text-emerald-700">
                  KES {totalRevenueKes.toLocaleString()} ({completedOrders.length} orders)
                </div>
              </div>
              <button
                type="button"
                onClick={() => fetchOrders(password)}
                disabled={isLoadingOrders}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-bold text-slate-700 transition"
              >
                <RefreshCw
                  className={`w-3.5 h-3.5 ${isLoadingOrders ? 'animate-spin text-emerald-600' : ''}`}
                />
                Refresh
              </button>
            </div>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-8 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-500">
              No M-Pesa orders recorded yet. New direct or STK purchases will appear here automatically.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2 pr-3">Status</th>
                    <th className="py-2 px-3">M-Pesa Code / Method</th>
                    <th className="py-2 px-3">Buyer Phone</th>
                    <th className="py-2 px-3">Material</th>
                    <th className="py-2 px-3">Amount</th>
                    <th className="py-2 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.slice(0, 20).map((o) => {
                    const isDirect = (o.checkout_request_id || '').startsWith('MANUAL_');
                    const isBusy = updatingOrderId === o.id;
                    return (
                      <tr
                        key={o.id}
                        className={
                          o.status === 'PENDING' ? 'bg-amber-50/50 hover:bg-amber-50' : 'hover:bg-slate-50'
                        }
                      >
                        <td className="py-2.5 pr-3 whitespace-nowrap">
                          {o.status === 'COMPLETED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                              <CheckCircle2 className="w-3 h-3" />
                              COMPLETED
                            </span>
                          )}
                          {o.status === 'PENDING' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded">
                              <Loader2 className="w-3 h-3 animate-spin" />
                              PENDING
                            </span>
                          )}
                          {o.status === 'FAILED' && (
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded">
                              <XCircle className="w-3 h-3" />
                              FAILED
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 px-3 whitespace-nowrap">
                          <div className="font-mono font-black text-slate-900">
                            {o.mpesa_receipt_number || 'Awaiting PIN'}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            {isDirect ? 'Direct -> 0728595160' : 'STK Express'}
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-slate-700 whitespace-nowrap">
                          {o.phone_number}
                        </td>
                        <td className="py-2.5 px-3 max-w-xs">
                          <div className="font-semibold text-slate-900 line-clamp-1">
                            {o.resource_title}
                          </div>
                          {o.created_at && (
                            <div className="text-[10px] text-slate-400">
                              {new Date(o.created_at).toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-3 font-black text-emerald-800 whitespace-nowrap">
                          KES {o.amount}
                        </td>
                        <td className="py-2.5 pl-3 text-right whitespace-nowrap">
                          <div className="inline-flex items-center gap-1.5">
                            {o.status !== 'COMPLETED' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleOrderStatus(o, 'COMPLETED')}
                                className="inline-flex items-center gap-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-[11px] px-2.5 py-1 rounded-lg transition"
                              >
                                <Check className="w-3 h-3" />
                                Approve
                              </button>
                            )}
                            {o.status === 'PENDING' && (
                              <button
                                type="button"
                                disabled={isBusy}
                                onClick={() => handleOrderStatus(o, 'FAILED')}
                                className="inline-flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-[11px] px-2 py-1 rounded-lg transition"
                              >
                                Reject
                              </button>
                            )}
                            {o.resource_id && (
                              <button
                                type="button"
                                onClick={() => handleSendWhatsAppDownload(o)}
                                title="Send 24h Signed Download Link via WhatsApp"
                                className="inline-flex items-center gap-1 bg-slate-100 hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 font-semibold text-[11px] px-2 py-1 rounded-lg transition"
                              >
                                <MessageCircle className="w-3.5 h-3.5" />
                                WhatsApp Link
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* 1. Drag & Drop Single / Bulk Uploader */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-slate-900 uppercase">
                Upload New Materials (Single or Bulk)
              </h2>
              <p className="text-xs text-slate-500">
                Drop one or multiple <code>.docx</code> / <code>.pdf</code> files
                — Grade, Term, Subject, Category &amp; Price are auto-filled
                from each filename!
              </p>
            </div>
            {queue.length > 0 && (
              <button
                type="button"
                onClick={() => setQueue([])}
                className="text-xs font-semibold text-slate-500 hover:text-rose-600"
              >
                Clear Queue
              </button>
            )}
          </div>

          <label
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault();
              handleFilesSelected(e.dataTransfer.files);
            }}
            className="flex flex-col items-center justify-center border-2 border-dashed border-emerald-300 hover:border-emerald-500 bg-emerald-50/40 rounded-2xl p-8 cursor-pointer transition text-center"
          >
            <Plus className="w-8 h-8 text-emerald-600 mb-2" />
            <span className="text-sm font-bold text-slate-800">
              Click to choose files or drag &amp; drop here
            </span>
            <span className="text-xs text-slate-500 mt-1">
              Supports .DOCX, .DOC, and .PDF curriculum documents
            </span>
            <input
              type="file"
              multiple
              accept=".docx,.doc,.pdf"
              onChange={(e) => handleFilesSelected(e.target.files)}
              className="hidden"
            />
          </label>

          {/* Queued Files Editor */}
          {queue.length > 0 && (
            <div className="space-y-3">
              {queue.map((item) => {
                const isExpanded = expandedUid === item.uid;
                return (
                  <div
                    key={item.uid}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/60 space-y-3"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileText className="w-5 h-5 text-emerald-600 shrink-0" />
                        <div className="min-w-0 flex-1">
                          <input
                            type="text"
                            value={item.title}
                            onChange={(e) =>
                              updateQueuedItem(item.uid, {
                                title: e.target.value,
                              })
                            }
                            className="w-full font-bold text-sm text-slate-900 bg-white border border-slate-300 rounded-lg px-2.5 py-1"
                          />
                          <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                            File: {item.file.name} (
                            {Math.max(1, Math.round(item.file.size / 1024))} KB)
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {item.status === 'DONE' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-1 rounded-lg">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Published
                          </span>
                        )}
                        {item.status === 'UPLOADING' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 px-2.5 py-1 rounded-lg">
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Uploading...
                          </span>
                        )}
                        {item.status === 'ERROR' && (
                          <span className="inline-flex items-center gap-1 text-xs font-bold text-rose-700 bg-rose-100 px-2.5 py-1 rounded-lg">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            {item.errorMsg || 'Failed'}
                          </span>
                        )}
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedUid(isExpanded ? null : item.uid)
                          }
                          className="text-xs font-semibold text-emerald-700 hover:underline px-2 py-1"
                        >
                          {isExpanded ? 'Hide Details' : 'Edit Details'}
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setQueue((prev) =>
                              prev.filter((q) => q.uid !== item.uid)
                            )
                          }
                          className="text-slate-400 hover:text-rose-600 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Quick Metadata Row */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Grade
                        </label>
                        <select
                          value={item.grade}
                          onChange={(e) =>
                            updateQueuedItem(item.uid, {
                              grade: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          {Array.from({ length: 12 }, (_, i) => (
                            <option key={i + 1} value={i + 1}>
                              Grade {i + 1}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Term
                        </label>
                        <select
                          value={item.term}
                          onChange={(e) =>
                            updateQueuedItem(item.uid, {
                              term: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          <option value={1}>Term 1</option>
                          <option value={2}>Term 2</option>
                          <option value={3}>Term 3</option>
                          <option value={0}>Terms 1, 2 &amp; 3</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Category
                        </label>
                        <select
                          value={item.category}
                          onChange={(e) =>
                            updateQueuedItem(item.uid, {
                              category: e.target.value as MaterialCategory,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        >
                          {MATERIAL_CATEGORIES.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Subject
                        </label>
                        <input
                          type="text"
                          value={item.subject}
                          onChange={(e) =>
                            updateQueuedItem(item.uid, {
                              subject: e.target.value,
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white"
                        />
                      </div>

                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase">
                          Price (KES)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={item.price}
                          onChange={(e) =>
                            updateQueuedItem(item.uid, {
                              price: Number(e.target.value),
                            })
                          }
                          className="w-full px-2 py-1.5 border border-slate-300 rounded-lg text-xs bg-white font-bold text-emerald-800"
                        />
                      </div>
                    </div>

                    {/* Optional Rich Preview Metadata */}
                    {isExpanded && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-slate-200">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Custom Overview Description (Optional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder="Leave blank to auto-generate a KICD-aligned overview..."
                            value={item.description}
                            onChange={(e) =>
                              updateQueuedItem(item.uid, {
                                description: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">
                            Strands / Topics Covered (One per line, Optional)
                          </label>
                          <textarea
                            rows={3}
                            placeholder={
                              'e.g. Strand 1: Numbers & Whole Numbers\nStrand 2: Fractions & Decimals'
                            }
                            value={item.strands}
                            onChange={(e) =>
                              updateQueuedItem(item.uid, {
                                strands: e.target.value,
                              })
                            }
                            className="w-full px-2.5 py-2 border border-slate-300 rounded-lg text-xs bg-white"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              {pendingQueueCount > 0 && (
                <div className="flex justify-end pt-2">
                  <button
                    type="button"
                    disabled={isUploadingAll}
                    onClick={handleUploadAll}
                    className="bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white font-bold text-sm px-6 py-2.5 rounded-xl shadow transition flex items-center gap-2"
                  >
                    {isUploadingAll ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <UploadCloud className="w-4 h-4" />
                    )}
                    Upload &amp; Publish {pendingQueueCount}{' '}
                    {pendingQueueCount === 1 ? 'Material' : 'Materials'}
                  </button>
                </div>
              )}
            </div>
          )}
        </section>

        {/* 2. Live Catalog Inventory */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <h2 className="text-base font-black text-slate-900 uppercase">
              Published Catalog ({inventory.length})
            </h2>
            <input
              type="text"
              placeholder="Filter catalog..."
              value={searchFilter}
              onChange={(e) => setSearchFilter(e.target.value)}
              className="px-3 py-1.5 border border-slate-300 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500 sm:w-64"
            />
          </div>

          {isLoadingInv ? (
            <div className="py-12 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-emerald-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 uppercase text-[10px]">
                    <th className="py-2.5 pr-3">Title</th>
                    <th className="py-2.5 px-3">Grade / Term</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Price</th>
                    <th className="py-2.5 px-3">Storage File</th>
                    <th className="py-2.5 pl-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredInventory.slice(0, adminVisibleCount).map((r) => (
                    <tr key={r.id} className="hover:bg-slate-50">
                      <td className="py-3 pr-3 font-bold text-slate-900 max-w-xs">
                        <div className="line-clamp-1">{r.title}</div>
                        <div className="text-[11px] font-normal text-slate-500">
                          {r.subject} • {r.format}
                        </div>
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        Grade {r.grade} • {formatTermLabel(r.term)}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {r.category}
                      </td>
                      <td className="py-3 px-3 font-bold text-emerald-700 whitespace-nowrap">
                        KES {r.price}
                      </td>
                      <td className="py-3 px-3">
                        {r.hasStorageFile ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <CheckCircle2 className="w-3 h-3" />
                            Linked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                            <AlertTriangle className="w-3 h-3" />
                            Missing File
                          </span>
                        )}
                      </td>
                      <td className="py-3 pl-3 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleAdminDownload(r)}
                            className="p-1.5 text-slate-500 hover:text-blue-700 rounded-lg hover:bg-blue-50"
                            title="Download File Directly"
                          >
                            <Download className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setPreviewItem(r)}
                            className="p-1.5 text-slate-500 hover:text-emerald-700 rounded-lg hover:bg-slate-100"
                            title="Preview"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(r)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {adminVisibleCount < filteredInventory.length && (
                <div className="pt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={() => setAdminVisibleCount((c) => c + 100)}
                    className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    Show More ({(filteredInventory.length - adminVisibleCount).toLocaleString()} remaining)
                  </button>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <PreviewModal
        resource={previewItem}
        onClose={() => setPreviewItem(null)}
        onBuy={() => setPreviewItem(null)}
      />
    </div>
  );
}
