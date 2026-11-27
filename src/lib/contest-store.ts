// src/lib/contest-store.ts
import { supabaseAdmin } from '@/lib/supabase';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import { shouldThrottleQuery } from '@/lib/mpesa';
import { triggerAutomaticBackup } from '@/lib/security';

const BUCKET_NAME = 'cbc-materials';
const PARTICIPANTS_PATH = '_system/contest-participants.json';
const CONFIG_PATH = '_system/contest-config.json';

export interface ContestParticipant {
  id: string;
  name: string;
  school: string;
  phone: string;
  subject: string;
  status: 'pending' | 'confirmed' | 'failed';
  checkout_request_id?: string | null;
  payment_confirmed_at?: string | null;
  marks?: number | null;
  answer_url?: string | null;
  created_at: string;
}

interface ContestConfig {
  active: boolean;
  updated_at?: string;
}

function isMissingTableErr(err: { code?: string; message?: string } | null | undefined): boolean {
  if (!err) return false;
  return err.code === 'PGRST205' || Boolean(err.message?.includes('schema cache'));
}

async function readParticipantsFromStorage(): Promise<ContestParticipant[]> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(PARTICIPANTS_PATH);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as ContestParticipant[]) : [];
  } catch {
    return [];
  }
}

async function writeParticipantsToStorage(list: ContestParticipant[]): Promise<void> {
  const bytes = Buffer.from(JSON.stringify(list, null, 2), 'utf-8');
  await supabaseAdmin.storage.from(BUCKET_NAME).upload(PARTICIPANTS_PATH, bytes, {
    contentType: 'application/json',
    upsert: true,
  });
}

async function readConfigFromStorage(): Promise<ContestConfig> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(CONFIG_PATH);
    if (error || !data) return { active: false };
    return JSON.parse(await data.text()) as ContestConfig;
  } catch {
    return { active: false };
  }
}

async function writeConfigToStorage(cfg: ContestConfig): Promise<void> {
  const bytes = Buffer.from(JSON.stringify(cfg, null, 2), 'utf-8');
  await supabaseAdmin.storage.from(BUCKET_NAME).upload(CONFIG_PATH, bytes, {
    contentType: 'application/json',
    upsert: true,
  });
}

export async function createContestParticipant(participant: ContestParticipant): Promise<void> {
  const { error } = await supabaseAdmin.from('contest_participants').insert(participant);
  if (error && !isMissingTableErr(error)) {
    throw error;
  }
  // Always mirror in storage so participants are never lost
  const list = await readParticipantsFromStorage();
  const idx = list.findIndex((p) => p.id === participant.id);
  if (idx >= 0) list[idx] = participant;
  else list.unshift(participant);
  await writeParticipantsToStorage(list);
}

export async function updateContestParticipant(
  id: string,
  patch: Partial<ContestParticipant>
): Promise<ContestParticipant | null> {
  const { data, error } = await supabaseAdmin
    .from('contest_participants')
    .update(patch)
    .eq('id', id)
    .select('*')
    .maybeSingle();

  if (error && !isMissingTableErr(error)) {
    throw error;
  }

  const list = await readParticipantsFromStorage();
  const idx = list.findIndex((p) => p.id === id);
  if (idx >= 0) {
    list[idx] = { ...list[idx], ...patch };
    await writeParticipantsToStorage(list);
    return (data as ContestParticipant | null) || list[idx];
  }
  return (data as ContestParticipant | null) || null;
}

export async function getContestParticipantById(id: string): Promise<ContestParticipant | null> {
  const { data, error } = await supabaseAdmin
    .from('contest_participants')
    .select('*')
    .eq('id', id)
    .maybeSingle();

  if (!error && data) {
    return data as ContestParticipant;
  }
  const list = await readParticipantsFromStorage();
  return list.find((p) => p.id === id) || null;
}

export async function findContestParticipantByCheckoutOrRef(
  checkoutId: string | null,
  externalRef: string | null
): Promise<ContestParticipant | null> {
  if (checkoutId) {
    const { data, error } = await supabaseAdmin
      .from('contest_participants')
      .select('*')
      .eq('checkout_request_id', checkoutId)
      .maybeSingle();
    if (!error && data) return data as ContestParticipant;
  }

  if (externalRef && externalRef.startsWith('CONTEST-')) {
    const prefix = externalRef.replace('CONTEST-', '');
    const { data, error } = await supabaseAdmin
      .from('contest_participants')
      .select('*')
      .ilike('id', `${prefix}%`)
      .maybeSingle();
    if (!error && data) return data as ContestParticipant;
  }

  const list = await readParticipantsFromStorage();
  if (checkoutId) {
    const byCheckout = list.find((p) => p.checkout_request_id === checkoutId);
    if (byCheckout) return byCheckout;
  }
  if (externalRef && externalRef.startsWith('CONTEST-')) {
    const prefix = externalRef.replace('CONTEST-', '');
    const byPrefix = list.find((p) => p.id.startsWith(prefix));
    if (byPrefix) return byPrefix;
  }
  return null;
}

export async function listContestParticipants(subject?: string | null): Promise<ContestParticipant[]> {
  let query = supabaseAdmin
    .from('contest_participants')
    .select('*')
    .order('created_at', { ascending: false });

  if (subject && subject !== 'ALL') {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;
  if (!error && Array.isArray(data)) {
    return data as ContestParticipant[];
  }

  const list = await readParticipantsFromStorage();
  if (subject && subject !== 'ALL') {
    return list.filter((p) => p.subject === subject);
  }
  return list;
}

export async function getContestActiveFlag(): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from('contest_config')
    .select('active')
    .eq('id', 'active')
    .maybeSingle();

  if (!error && data) {
    return Boolean(data.active);
  }
  const cfg = await readConfigFromStorage();
  return Boolean(cfg.active);
}

export async function setContestActiveFlag(active: boolean): Promise<void> {
  const { error } = await supabaseAdmin
    .from('contest_config')
    .upsert({ id: 'active', active, updated_at: new Date().toISOString() }, { onConflict: 'id' });
  if (error && !isMissingTableErr(error)) {
    throw error;
  }
  await writeConfigToStorage({ active, updated_at: new Date().toISOString() });
}

/**
 * Actively verify a pending participant's PayHero payment status so polling
 * confirms immediately even if the webhook callback is delayed.
 */
export async function syncPendingContestPayment(
  participant: ContestParticipant
): Promise<ContestParticipant> {
  if (participant.status !== 'pending' || !participant.checkout_request_id) {
    return participant;
  }

  const checkoutId = participant.checkout_request_id;
  if (shouldThrottleQuery(`contest_${checkoutId}`, 4000)) {
    return participant;
  }

  const stored = await getStoredPaymentConfig();
  const rawToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
  if (!rawToken) return participant;

  const reference = checkoutId.replace(/^PAYHERO_/, '');
  try {
    const res = await fetch(
      `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(reference)}`,
      {
        headers: { Authorization: formatPayHeroAuthHeader(rawToken) },
        cache: 'no-store',
        signal: AbortSignal.timeout(4000),
      }
    );
    if (!res.ok) return participant;
    const json = (await res.json()) as { status?: string };
    const st = String(json?.status || '').toUpperCase();

    if (st === 'SUCCESS' || st === 'COMPLETED') {
      const updated = await updateContestParticipant(participant.id, {
        status: 'confirmed',
        payment_confirmed_at: new Date().toISOString(),
      });
      void triggerAutomaticBackup(`Contest payment confirmed via status sync: ${participant.id}`);
      return updated || { ...participant, status: 'confirmed' };
    }

    if (st === 'FAILED' || st === 'CANCELLED' || st === 'CANCELED') {
      const updated = await updateContestParticipant(participant.id, { status: 'failed' });
      return updated || { ...participant, status: 'failed' };
    }
  } catch {
    // Keep pending on transient network error
  }
  return participant;
}
