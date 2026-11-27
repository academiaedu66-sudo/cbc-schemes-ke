// src/lib/mpesa.ts
// Centralized M‑Pesa utilities for CBCMaterials.shop

import { formatPayHeroAuthHeader, getStoredPaymentConfig, type StoredPaymentConfig } from '@/lib/payment-config';
import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

/** Default constants – can be overridden via environment variables. */
export const DEFAULT_MERCHANT_PHONE = '254728595160';
export const DEFAULT_WHATSAPP_PHONE = '254728595160';
export const DEFAULT_PRODUCTION_ORIGIN = 'https://www.cbcmaterials.shop';

/** Header used for Daraja JSON requests. */
export const DARAJA_HEADERS = { 'Content-Type': 'application/json' };

/** Helper to normalise Kenyan phone numbers to the E.164 format (2547XXXXXXXX). */
export function normalizeKenyanPhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, '');
  if (digits.length === 9 && digits.startsWith('7')) {
    return '254' + digits;
  }
  if (digits.length === 10 && digits.startsWith('0')) {
    return '254' + digits.slice(1);
  }
  if (digits.length === 12 && digits.startsWith('254')) {
    return digits;
  }
  return null;
}

export function getMerchantPhone(stored?: StoredPaymentConfig): string {
  const raw = (stored?.recipientMpesa || process.env.NEXT_PUBLIC_MERCHANT_PHONE || DEFAULT_MERCHANT_PHONE).trim();
  return normalizeKenyanPhone(raw) || DEFAULT_MERCHANT_PHONE;
}

export function getWhatsAppPhone(): string {
  const raw = (process.env.WHATSAPP_NOTIFICATION_PHONE || DEFAULT_WHATSAPP_PHONE).trim();
  return normalizeKenyanPhone(raw) || DEFAULT_WHATSAPP_PHONE;
}

export interface DarajaSession {
  token: string;
  shortCode: string;
  partyB: string;
  passkey: string;
  baseUrl: string;
}

/** Obtain a full Daraja session object (token + credentials). */
export async function getDarajaSession(): Promise<DarajaSession> {
  const cfg = await getStoredPaymentConfig();
  const consumerKey = cfg?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY || '';
  const consumerSecret = cfg?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET || '';
  const shortCode = cfg?.mpesaShortcode || process.env.MPESA_SHORTCODE || '';
  const passkey = cfg?.mpesaPasskey || process.env.MPESA_PASSKEY || '';
  const env = cfg?.environment || process.env.MPESA_ENVIRONMENT || 'sandbox';
  const baseUrl = env === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';

  if (!consumerKey || !consumerSecret) {
    throw new Error('Missing M‑Pesa consumer credentials');
  }
  const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
    },
  });
  const { access_token } = await tokenResponse.json();
  if (!access_token) {
    throw new Error('Failed to obtain M‑Pesa access token');
  }
  return {
    token: access_token,
    shortCode,
    partyB: cfg?.mpesaShortcode || process.env.MPESA_PARTY_B || shortCode,
    passkey,
    baseUrl,
  };
}

/** Helper to generate the timestamp used in Daraja requests (YYYYMMDDHHmmss). */
export function getEatTimestamp(): string {
  return new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
}

/** Resolve a summary of the active payment gateway configuration. */
export async function resolveActiveGatewaySummary() {
  const cfg = await getStoredPaymentConfig();
  const recipientMpesa = cfg?.recipientMpesa || process.env.NEXT_PUBLIC_MERCHANT_PHONE || DEFAULT_MERCHANT_PHONE;
  const recipientLocal = toLocalKenyanFormatSync(recipientMpesa);
  return {
    provider: cfg?.provider ?? 'daraja',
    shortcode: cfg?.mpesaShortcode ?? process.env.MPESA_SHORTCODE,
    environment: cfg?.environment ?? process.env.MPESA_ENVIRONMENT ?? 'sandbox',
    recipientMpesa,
    recipientLocal,
    settlesTo0728595160: cfg?.settlesTo0728595160 ?? '',
  };
}

/** Synchronous local format helper (no async). */
function toLocalKenyanFormatSync(intl: string): string {
  const digits = intl.replace(/\D/g, '');
  if (digits.startsWith('254') && digits.length === 12) return '0' + digits.slice(3);
  return intl;
}

/** Resolve the callback URL for M‑Pesa notifications (accepts optional req for compat). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function resolveCallbackUrl(_req?: any): string {
  return process.env.MPESA_CALLBACK_URL ?? '';
}

/** Alias for public origin – kept for backward compatibility. */
export function resolvePublicOrigin(req?: any): string {
  if (req && typeof req === 'object') {
    const host = req.headers?.get?.('x-forwarded-host') || req.headers?.get?.('host') || '';
    const proto = req.headers?.get?.('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
    if (host) return `${proto}://${host}`;
  }
  return process.env.NEXT_PUBLIC_PRODUCTION_URL ?? DEFAULT_PRODUCTION_ORIGIN;
}

/** Stub for sending a WhatsApp admin notification. */
export async function sendWhatsAppAdminNotification(message: string): Promise<void> {
  console.log('[WhatsApp Admin] ', message);
}

/** Convert an international Kenyan phone (2547XXXXXXXX) to local format (07XXXXXXXX). */
export function toLocalKenyanFormat(international: string): string | null {
  const normalized = normalizeKenyanPhone(international);
  if (!normalized) return null;
  return '0' + normalized.slice(3);
}

/** Extract the MPESA receipt code from a successful STK push response. */
export function extractMpesaReceiptCode(stkResponse: any): string | null {
  return stkResponse?.CheckoutRequestID ?? null;
}

/** Extract the payer's name from a payload (placeholder). */
export function extractMpesaNameFromPayload(payload: any): string | null {
  return payload?.payerName ?? null;
}

/** Trigger an instant PayHero payout (stub implementation). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function triggerInstantPayHeroPayout(params: any): Promise<any> {
  console.log('Triggering PayHero payout with', params);
  return { success: true, details: 'Payout simulated' };
}

/** Initiates an STK push request via PayHero (if configured) or Safaricom Daraja. */
export async function initiateStkPush(params: {
  phoneNumber: string;
  amount: number;
  accountReference: string;
  transactionDesc: string;
  callbackUrl?: string;
}): Promise<any> {
  const { phoneNumber, amount, accountReference, transactionDesc } = params;
  const normalizedPhone = normalizeKenyanPhone(phoneNumber);
  if (!normalizedPhone) {
    throw new Error('Enter a valid Safaricom number (e.g. 0712345678 or 254712345678).');
  }

  const cfg = await getStoredPaymentConfig();
  const origin = resolvePublicOrigin();
  const effectiveCallbackUrl =
    params.callbackUrl ||
    cfg?.mpesaCallbackUrl ||
    process.env.MPESA_CALLBACK_URL ||
    `${origin}/api/contest/callback`;

  // 1. Try PayHero Kenya if configured (primary live gateway on cbcmaterials.shop)
  const rawPayheroToken = (cfg?.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
  const payheroChannelId = Number((cfg?.payheroChannelId || process.env.PAYHERO_CHANNEL_ID || '').trim());
  if (rawPayheroToken && payheroChannelId) {
    const authHeader = formatPayHeroAuthHeader(rawPayheroToken);
    const phRes = await fetch('https://backend.payhero.co.ke/api/v2/payments', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.max(1, Math.round(amount)),
        phone_number: normalizedPhone,
        channel_id: payheroChannelId,
        provider: 'm-pesa',
        external_reference: accountReference,
        customer_name: transactionDesc.slice(0, 40),
        callback_url: effectiveCallbackUrl,
      }),
      cache: 'no-store',
    });
    const phData = await phRes.json();
    if (!phRes.ok || phData?.success === false) {
      throw new Error(phData?.error_message || phData?.message || 'PayHero STK push failed');
    }
    return {
      ...phData,
      CheckoutRequestID: phData?.reference
        ? `PAYHERO_${phData.reference}`
        : phData?.CheckoutRequestID || accountReference,
    };
  }

  // 2. Fallback to Safaricom Daraja
  const shortcode = cfg?.mpesaShortcode || process.env.MPESA_SHORTCODE;
  const passkey = cfg?.mpesaPasskey || process.env.MPESA_PASSKEY;
  const consumerKey = cfg?.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY;
  const consumerSecret = cfg?.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET;
  const env = cfg?.environment || process.env.MPESA_ENVIRONMENT || 'sandbox';
  const baseUrl = env === 'production' ? 'https://api.safaricom.co.ke' : 'https://sandbox.safaricom.co.ke';

  if (!shortcode || !passkey || !consumerKey || !consumerSecret || !effectiveCallbackUrl) {
    throw new Error('Missing M-Pesa credentials/configuration');
  }
  const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
  const password = Buffer.from(shortcode + passkey + timestamp).toString('base64');

  const tokenResponse = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
    headers: {
      Authorization: `Basic ${Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64')}`,
    },
  });
  const { access_token } = await tokenResponse.json();

  const payload = {
    BusinessShortCode: shortcode,
    Password: password,
    Timestamp: timestamp,
    TransactionType: 'CustomerPayBillOnline',
    Amount: Math.max(1, Math.round(amount)),
    PartyA: normalizedPhone,
    PartyB: shortcode,
    PhoneNumber: normalizedPhone,
    CallBackURL: effectiveCallbackUrl,
    AccountReference: accountReference,
    TransactionDesc: transactionDesc,
  };

  const stkResponse = await fetch(`${baseUrl}/mpesa/stkpush/v1/processrequest`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  if (!stkResponse.ok) {
    const errorBody = await stkResponse.text();
    throw new Error(`STK push failed: ${stkResponse.status} ${errorBody}`);
  }
  return stkResponse.json();
}

/** Throttling helper (preserved from original file). */
const lastQueryAtByCheckoutId = new Map<string, number>();
export function shouldThrottleQuery(checkoutRequestId: string, minIntervalMs = 5000): boolean {
  const now = Date.now();
  const prev = lastQueryAtByCheckoutId.get(checkoutRequestId) || 0;
  if (now - prev < minIntervalMs) return true;
  lastQueryAtByCheckoutId.set(checkoutRequestId, now);
  if (lastQueryAtByCheckoutId.size > 500) {
    const cutoff = now - 10 * 60 * 1000;
    for (const [k, ts] of lastQueryAtByCheckoutId.entries()) {
      if (ts < cutoff) lastQueryAtByCheckoutId.delete(k);
    }
  }
  return false;
}

/** Return the production origin URL, fallback to default. */
export function getProductionOrigin(): string {
  try {
    return process.env.NEXT_PUBLIC_PRODUCTION_URL ?? DEFAULT_PRODUCTION_ORIGIN;
  } catch {}
  return DEFAULT_PRODUCTION_ORIGIN;
}
