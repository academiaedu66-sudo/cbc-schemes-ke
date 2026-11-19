import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';

const BUCKET_NAME = 'cbc-materials';
const CUSTOMERS_LEDGER_PATH = '_system/registered-customers.json';

export type CustomerRole = 'Teacher' | 'Parent' | 'Learner' | 'Member';

export interface RegisteredCustomer {
  id: string;
  email: string;
  phone: string;
  phoneIntl: string;
  fullName: string;
  role: CustomerRole;
  passwordHash?: string;
  sourcePath: string;
  createdAt: string;
  lastLoginAt: string;
  loginCount: number;
}

interface CustomersStore {
  customers: RegisteredCustomer[];
  updatedAt: string;
}

function hashOptionalPassword(raw?: string): string | undefined {
  const clean = (raw || '').trim();
  if (!clean) return undefined;
  return crypto.createHash('sha256').update(`cbc_cust_${clean}`).digest('hex');
}

export function normalizeCustomerPhone(raw: string): {
  displayPhone: string;
  intlPhone: string;
  digitsOnly: string;
} {
  const trimmed = (raw || '').trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    return {
      displayPhone: digits,
      intlPhone: `254${digits.slice(1)}`,
      digitsOnly: digits,
    };
  }
  if (digits.startsWith('254') && digits.length === 12) {
    return {
      displayPhone: `0${digits.slice(3)}`,
      intlPhone: digits,
      digitsOnly: digits,
    };
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return {
      displayPhone: `0${digits}`,
      intlPhone: `254${digits}`,
      digitsOnly: `0${digits}`,
    };
  }
  return {
    displayPhone: trimmed,
    intlPhone: digits,
    digitsOnly: digits,
  };
}

async function readCustomersStore(): Promise<CustomersStore> {
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(CUSTOMERS_LEDGER_PATH);
    if (error || !data) {
      return { customers: [], updatedAt: new Date().toISOString() };
    }
    const parsed = JSON.parse(await data.text()) as Partial<CustomersStore>;
    return {
      customers: Array.isArray(parsed.customers) ? parsed.customers : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return { customers: [], updatedAt: new Date().toISOString() };
  }
}

async function writeCustomersStore(customers: RegisteredCustomer[]): Promise<void> {
  const payload: CustomersStore = {
    customers,
    updatedAt: new Date().toISOString(),
  };
  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      CUSTOMERS_LEDGER_PATH,
      Buffer.from(JSON.stringify(payload, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );
}

export async function getAllRegisteredCustomers(): Promise<RegisteredCustomer[]> {
  const store = await readCustomersStore();
  return store.customers.sort((a, b) =>
    (b.createdAt || '').localeCompare(a.createdAt || '')
  );
}

export async function registerOrUpdateCustomer(params: {
  email: string;
  phone: string;
  fullName?: string;
  role?: CustomerRole;
  password?: string;
  sourcePath?: string;
}): Promise<RegisteredCustomer> {
  const cleanEmail = params.email.trim().toLowerCase();
  const normPhone = normalizeCustomerPhone(params.phone);
  const nowIso = new Date().toISOString();
  const store = await readCustomersStore();

  const existingIdx = store.customers.findIndex(
    (c) => c.email.toLowerCase() === cleanEmail
  );

  let saved: RegisteredCustomer;
  if (existingIdx >= 0) {
    const prev = store.customers[existingIdx];
    saved = {
      ...prev,
      phone: normPhone.displayPhone || prev.phone,
      phoneIntl: normPhone.intlPhone || prev.phoneIntl,
      fullName: params.fullName?.trim() || prev.fullName,
      role: params.role || prev.role,
      passwordHash:
        hashOptionalPassword(params.password) || prev.passwordHash,
      lastLoginAt: nowIso,
      loginCount: (prev.loginCount || 1) + 1,
    };
    store.customers[existingIdx] = saved;
  } else {
    saved = {
      id: `cust_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      email: cleanEmail,
      phone: normPhone.displayPhone,
      phoneIntl: normPhone.intlPhone,
      fullName: (params.fullName || '').trim() || cleanEmail.split('@')[0],
      role: params.role || 'Member',
      passwordHash: hashOptionalPassword(params.password),
      sourcePath: (params.sourcePath || '/').slice(0, 140),
      createdAt: nowIso,
      lastLoginAt: nowIso,
      loginCount: 1,
    };
    store.customers.unshift(saved);
  }

  await writeCustomersStore(store.customers);
  await Promise.race([
    triggerAutomaticBackup(`Customer registered: ${cleanEmail}`),
    new Promise<void>((r) => setTimeout(r, 3500)),
  ]);
  return saved;
}

export async function loginExistingCustomer(params: {
  email: string;
  phone?: string;
  password?: string;
}): Promise<RegisteredCustomer | null> {
  const cleanEmail = params.email.trim().toLowerCase();
  const store = await readCustomersStore();
  const idx = store.customers.findIndex(
    (c) => c.email.toLowerCase() === cleanEmail
  );
  if (idx < 0) return null;

  const cust = store.customers[idx];

  // Verify either matching phone digits (last 6+ digits) OR matching password hash if set
  const inputDigits = (params.phone || '').replace(/\D/g, '');
  const storedDigits = (cust.phoneIntl || cust.phone || '').replace(/\D/g, '');
  const phoneMatches =
    inputDigits.length >= 6 &&
    storedDigits.length >= 6 &&
    storedDigits.slice(-6) === inputDigits.slice(-6);

  const pwHash = hashOptionalPassword(params.password);
  const passwordMatches = Boolean(
    cust.passwordHash && pwHash && cust.passwordHash === pwHash
  );

  if (!phoneMatches && !passwordMatches) {
    return null;
  }

  const updated: RegisteredCustomer = {
    ...cust,
    lastLoginAt: new Date().toISOString(),
    loginCount: (cust.loginCount || 1) + 1,
  };
  store.customers[idx] = updated;
  await writeCustomersStore(store.customers);
  return updated;
}

export async function deleteRegisteredCustomerById(id: string): Promise<boolean> {
  const store = await readCustomersStore();
  const next = store.customers.filter((c) => c.id !== id);
  if (next.length === store.customers.length) return false;
  await writeCustomersStore(next);
  return true;
}
