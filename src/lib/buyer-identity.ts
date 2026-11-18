import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const BUYER_NAMES_PATH = '_system/buyer-names.json';

interface BuyerIdentityStore {
  byCheckoutId: Record<string, string>;
  byPhone: Record<string, string>;
  updatedAt: string;
}

const memByCheckout = new Map<string, string>();
const memByPhone = new Map<string, string>();
let loadedOnce = false;

function normalizePhoneKey(raw?: string | null): string {
  const digits = String(raw || '').replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('254') && digits.length === 12) return digits;
  if ((digits.startsWith('07') || digits.startsWith('01')) && digits.length === 10) {
    return `254${digits.slice(1)}`;
  }
  if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    return `254${digits}`;
  }
  return digits;
}

export function cleanMpesaDisplayName(raw?: string | null): string {
  if (!raw) return '';
  const cleaned = String(raw)
    .replace(/[^a-zA-Z\s'.-]/g, ' ')
    .replace(/\b(CONFIRMED|MPESA|SAFARICOM|SENT|PAID|TO|FROM|KSH|KES|ACCOUNT|NUMBER|NULL|UNDEFINED|DIRECT|CUSTOMER)\b/gi, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();
  if (cleaned.length < 2) return '';
  return cleaned.slice(0, 60).toUpperCase();
}

/**
 * Extracts the payer's registered M-Pesa name from PayHero, Safaricom Daraja,
 * Paystack, IntaSend, or a pasted M-Pesa confirmation SMS.
 */
export function extractMpesaNameFromPayload(payload: unknown): string {
  if (!payload) return '';

  if (typeof payload === 'string') {
    // Parse standard Safaricom M-Pesa SMS if pasted, e.g.:
    // "SJK84M2P9Q Confirmed. Ksh500.00 sent to ... or received from JOHN KAMAU MWANGI 0712..."
    const fromMatch = payload.match(
      /(?:received\s+from|paid\s+by|name\s*[:\-])\s+([A-Za-z][A-Za-z\s'.-]{2,45}?)(?:\s+0[17]\d|\s+254|\s+on\b|\.|,|$)/i
    );
    if (fromMatch?.[1]) {
      return cleanMpesaDisplayName(fromMatch[1]);
    }
    return '';
  }

  if (typeof payload !== 'object') return '';
  const obj = payload as Record<string, any>;
  const resp = (obj.response && typeof obj.response === 'object' ? obj.response : {}) as Record<
    string,
    any
  >;
  const data = (obj.data && typeof obj.data === 'object' ? obj.data : {}) as Record<
    string,
    any
  >;

  const directCandidates: Array<unknown> = [
    obj.customer_name,
    obj.customerName,
    obj.payer_name,
    obj.payerName,
    obj.sender_name,
    obj.senderName,
    obj.third_party_name,
    obj.account_name,
    obj.full_name,
    obj.name,
    resp.CustomerName,
    resp.customer_name,
    resp.PayerName,
    resp.payer_name,
    resp.Name,
    [resp.FirstName, resp.MiddleName, resp.LastName].filter(Boolean).join(' '),
    [obj.FirstName, obj.MiddleName, obj.LastName].filter(Boolean).join(' '),
    [data?.customer?.first_name, data?.customer?.last_name].filter(Boolean).join(' '),
    data?.authorization?.account_name,
    [obj?.invoice?.customer?.first_name, obj?.invoice?.customer?.last_name]
      .filter(Boolean)
      .join(' '),
  ];

  // Check Daraja CallbackMetadata.Item array if present
  const cbItems = obj?.Body?.stkCallback?.CallbackMetadata?.Item;
  if (Array.isArray(cbItems)) {
    const parts: string[] = [];
    for (const it of cbItems) {
      const nm = String(it?.Name || '');
      if (
        (nm === 'CustomerName' ||
          nm === 'FirstName' ||
          nm === 'MiddleName' ||
          nm === 'LastName' ||
          nm === 'PayerName') &&
        it?.Value
      ) {
        parts.push(String(it.Value));
      }
    }
    if (parts.length > 0) directCandidates.unshift(parts.join(' '));
  }

  for (const cand of directCandidates) {
    if (typeof cand === 'string' && cand.trim().length >= 2) {
      const formatted = cleanMpesaDisplayName(cand);
      if (formatted) return formatted;
    }
  }

  return '';
}

async function ensureStoreLoaded(): Promise<void> {
  if (loadedOnce) return;
  loadedOnce = true;
  try {
    const { data } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(BUYER_NAMES_PATH);
    if (!data) return;
    const parsed = JSON.parse(await data.text()) as Partial<BuyerIdentityStore>;
    if (parsed.byCheckoutId) {
      for (const [k, v] of Object.entries(parsed.byCheckoutId)) {
        if (k && v) memByCheckout.set(k, v);
      }
    }
    if (parsed.byPhone) {
      for (const [k, v] of Object.entries(parsed.byPhone)) {
        if (k && v) memByPhone.set(k, v);
      }
    }
  } catch {
    // Non-fatal if file does not exist yet
  }
}

export async function recordBuyerMpesaName(params: {
  checkoutRequestId?: string | null;
  phone?: string | null;
  buyerName?: string | null;
}): Promise<string> {
  const cleanName = cleanMpesaDisplayName(params.buyerName);
  if (!cleanName) return '';

  await ensureStoreLoaded();

  const cid = String(params.checkoutRequestId || '').trim();
  const ph = normalizePhoneKey(params.phone);

  if (cid) memByCheckout.set(cid, cleanName);
  if (ph) memByPhone.set(ph, cleanName);

  // Trim maps to most recent 1,500 entries and persist asynchronously
  try {
    const byCheckoutId = Object.fromEntries(Array.from(memByCheckout.entries()).slice(-1500));
    const byPhone = Object.fromEntries(Array.from(memByPhone.entries()).slice(-1500));
    const store: BuyerIdentityStore = {
      byCheckoutId,
      byPhone,
      updatedAt: new Date().toISOString(),
    };
    await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .upload(BUYER_NAMES_PATH, Buffer.from(JSON.stringify(store), 'utf-8'), {
        contentType: 'application/json',
        upsert: true,
      });
  } catch {
    // Non-fatal
  }

  return cleanName;
}

export async function resolveBuyerMpesaName(params: {
  checkoutRequestId?: string | null;
  phone?: string | null;
  fallbackName?: string | null;
}): Promise<string> {
  await ensureStoreLoaded();

  const cid = String(params.checkoutRequestId || '').trim();
  if (cid && memByCheckout.has(cid)) {
    return memByCheckout.get(cid) || '';
  }

  const ph = normalizePhoneKey(params.phone);
  if (ph && memByPhone.has(ph)) {
    return memByPhone.get(ph) || '';
  }

  return cleanMpesaDisplayName(params.fallbackName);
}
