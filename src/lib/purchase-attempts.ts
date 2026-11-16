import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const ATTEMPTS_PATH = '_system/purchase-attempts.json';

export interface PurchaseAttemptEvent {
  id: string;
  timestamp: string;
  channel: string;
  itemTitle: string;
  amountKes: number;
  buyerPhone?: string;
  stage: 'OPENED_CHECKOUT' | 'SUBMITTED_PAYMENT';
}

export interface PurchaseAttemptLedger {
  totalAttempts: number;
  attempts: PurchaseAttemptEvent[];
  updatedAt: string;
}

let cachedLedger: { data: PurchaseAttemptLedger; loadedAt: number } | null = null;

export async function getPurchaseAttemptLedger(
  forceFresh = false
): Promise<PurchaseAttemptLedger> {
  if (
    !forceFresh &&
    cachedLedger &&
    Date.now() - cachedLedger.loadedAt < 2500
  ) {
    return cachedLedger.data;
  }

  const empty: PurchaseAttemptLedger = {
    totalAttempts: 0,
    attempts: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(ATTEMPTS_PATH);

    if (error || !data) {
      cachedLedger = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<PurchaseAttemptLedger>;
    const normalized: PurchaseAttemptLedger = {
      totalAttempts: Number(parsed.totalAttempts) || 0,
      attempts: Array.isArray(parsed.attempts) ? parsed.attempts : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedLedger = { data: normalized, loadedAt: Date.now() };
    return normalized;
  } catch {
    return empty;
  }
}

export async function recordPurchaseAttempt(params: {
  channel: string;
  itemTitle: string;
  amountKes?: number;
  buyerPhone?: string;
  stage?: 'OPENED_CHECKOUT' | 'SUBMITTED_PAYMENT';
}): Promise<PurchaseAttemptEvent> {
  const ledger = await getPurchaseAttemptLedger(true);
  const nowIso = new Date().toISOString();

  const event: PurchaseAttemptEvent = {
    id: `pa_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    timestamp: nowIso,
    channel: (params.channel || 'Storefront').slice(0, 60),
    itemTitle: (params.itemTitle || 'CBC Material / Service').slice(0, 140),
    amountKes: Math.max(0, Number(params.amountKes) || 0),
    buyerPhone: params.buyerPhone ? params.buyerPhone.trim().slice(0, 20) : undefined,
    stage: params.stage || 'OPENED_CHECKOUT',
  };

  ledger.totalAttempts = (ledger.totalAttempts || 0) + 1;
  ledger.attempts = [event, ...ledger.attempts].slice(0, 40);
  ledger.updatedAt = nowIso;

  cachedLedger = { data: ledger, loadedAt: Date.now() };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      ATTEMPTS_PATH,
      Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    )
    .catch(() => {});

  return event;
}
