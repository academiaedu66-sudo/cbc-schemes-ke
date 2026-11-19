'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Mail,
  MessageCircle,
  Phone,
  RefreshCw,
  Search,
  Trash2,
  Users,
} from 'lucide-react';

interface CustomerRecord {
  id: string;
  email: string;
  phone: string;
  phoneIntl: string;
  fullName: string;
  role: string;
  sourcePath: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
}

export default function AdminCustomersVaultPanel({
  password,
  adminEmail,
  darkTheme = false,
  defaultExpanded = true,
}: {
  password: string;
  adminEmail?: string;
  darkTheme?: boolean;
  defaultExpanded?: boolean;
}) {
  const [customers, setCustomers] = useState<CustomerRecord[]>([]);
  const [todayCount, setTodayCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const [search, setSearch] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const buildHeaders = useCallback(() => {
    const h: Record<string, string> = {
      'x-admin-password': password.trim(),
    };
    if (adminEmail?.trim()) {
      h['x-admin-email'] = adminEmail.trim();
    }
    return h;
  }, [adminEmail, password]);

  const fetchCustomers = useCallback(async () => {
    if (!password.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/admin/customers', {
        headers: buildHeaders(),
      });
      if (!res.ok) return;
      const data = await res.json();
      if (Array.isArray(data.customers)) {
        setCustomers(data.customers);
        setTodayCount(Number(data.todayCount) || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [buildHeaders, password]);

  useEffect(() => {
    void fetchCustomers();
    const interval = setInterval(() => {
      void fetchCustomers();
    }, 15000);
    return () => clearInterval(interval);
  }, [fetchCustomers]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter(
      (c) =>
        c.email.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.fullName.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q)
    );
  }, [customers, search]);

  const copyText = async (key: string, val: string) => {
    try {
      await navigator.clipboard.writeText(val);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {}
  };

  const handleExportCsv = () => {
    const header = [
      'Full Name',
      'Email Address',
      'Phone Number',
      'WhatsApp Intl',
      'Role',
      'Registered At',
      'Last Login At',
      'Logins',
    ];
    const rows = customers.map((c) => [
      `"${(c.fullName || '').replace(/"/g, '""')}"`,
      `"${c.email}"`,
      `"${c.phone}"`,
      `"${c.phoneIntl}"`,
      `"${c.role}"`,
      `"${c.createdAt}"`,
      `"${c.lastLoginAt}"`,
      String(c.loginCount || 1),
    ]);
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cbcmaterials-registered-customers-${new Date()
      .toISOString()
      .slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleDeleteCustomer = async (id: string) => {
    try {
      const res = await fetch(
        `/api/admin/customers?id=${encodeURIComponent(id)}`,
        {
          method: 'DELETE',
          headers: buildHeaders(),
        }
      );
      if (res.ok) {
        setCustomers((prev) => prev.filter((c) => c.id !== id));
      }
    } catch {}
  };

  const cardBg = darkTheme
    ? 'bg-slate-900 border-emerald-400/40 text-white'
    : 'bg-white border-emerald-200 text-slate-900 shadow-sm';

  return (
    <section
      id="registered-customers-vault"
      className={`rounded-3xl border p-5 sm:p-6 space-y-4 ${cardBg}`}
    >
      {/* Prominent Backend Button Header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-sm">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-black uppercase tracking-tight">
                Registered Customers Vault (Emails &amp; Phone Numbers)
              </h2>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-600 dark:text-emerald-300 text-[11px] font-black">
                {customers.length} Saved ({todayCount} Today)
              </span>
            </div>
            <p
              className={`text-xs ${
                darkTheme ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              Automatically preserves every customer&apos;s Email Address and
              Phone Number whenever they sign up on the frontend.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black cursor-pointer"
          >
            {expanded ? 'Hide Customer List' : `Open Saved Customers (${customers.length})`}
          </button>

          <button
            type="button"
            onClick={() => void fetchCustomers()}
            title="Refresh customers"
            className={`p-2 rounded-xl border cursor-pointer ${
              darkTheme
                ? 'border-slate-700 bg-slate-800 text-slate-200'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {expanded && (
        <div className="space-y-4 pt-2 border-t border-slate-200/20">
          {/* Bulk Copy & CSV Export Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-2.5">
            <div className="relative flex-1 min-w-[210px]">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search customer email, phone or name…"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-white text-slate-900 text-xs font-medium"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                disabled={customers.length === 0}
                onClick={() =>
                  void copyText(
                    'emails',
                    customers.map((c) => c.email).join(', ')
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                {copiedKey === 'emails' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedKey === 'emails' ? 'Emails Copied!' : 'Copy All Emails'}
                </span>
              </button>

              <button
                type="button"
                disabled={customers.length === 0}
                onClick={() =>
                  void copyText(
                    'phones',
                    customers.map((c) => c.phone).join(', ')
                  )
                }
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-50 text-slate-950 text-xs font-black cursor-pointer"
              >
                {copiedKey === 'phones' ? (
                  <Check className="w-3.5 h-3.5" />
                ) : (
                  <Phone className="w-3.5 h-3.5" />
                )}
                <span>
                  {copiedKey === 'phones' ? 'Phones Copied!' : 'Copy All Phones'}
                </span>
              </button>

              <button
                type="button"
                disabled={customers.length === 0}
                onClick={handleExportCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>
          </div>

          {/* Customers Table / Cards */}
          {filtered.length === 0 ? (
            <div
              className={`rounded-2xl p-6 text-center text-xs ${
                darkTheme
                  ? 'bg-slate-950/60 text-slate-400'
                  : 'bg-slate-50 text-slate-500'
              }`}
            >
              No customer sign-ups recorded yet — as soon as any visitor signs up
              with their Email &amp; Phone Number, they appear here automatically!
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[420px] overflow-y-auto pr-1">
              {filtered.map((cust) => (
                <div
                  key={cust.id}
                  className={`rounded-2xl border p-3.5 flex flex-wrap items-center justify-between gap-3 ${
                    darkTheme
                      ? 'bg-slate-950/70 border-slate-800'
                      : 'bg-slate-50/80 border-slate-200'
                  }`}
                >
                  <div className="space-y-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-xs sm:text-sm font-black">
                        {cust.fullName}
                      </span>
                      <span className="px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-500 text-[10px] font-black uppercase">
                        {cust.role}
                      </span>
                      <span className="text-[10px] opacity-65">
                        {new Date(cust.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                      <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-300">
                        <Mail className="w-3.5 h-3.5" />
                        <span>{cust.email}</span>
                      </span>
                      <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-300">
                        <Phone className="w-3.5 h-3.5" />
                        <span>{cust.phone}</span>
                      </span>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    <a
                      href={`https://wa.me/${cust.phoneIntl}?text=${encodeURIComponent(
                        `Hello ${cust.fullName}, thank you for registering on CBCMATERIALS.SHOP! How can we assist you today?`
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href={`mailto:${cust.email}?subject=${encodeURIComponent(
                        'Welcome to CBCMATERIALS.SHOP'
                      )}`}
                      className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-bold"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email</span>
                    </a>
                    <button
                      type="button"
                      onClick={() => void handleDeleteCustomer(cust.id)}
                      title="Remove record"
                      className="p-1.5 rounded-lg bg-rose-500/15 hover:bg-rose-600 text-rose-500 hover:text-white transition cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
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
