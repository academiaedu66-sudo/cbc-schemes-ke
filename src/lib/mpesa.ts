// Shared M-Pesa & WhatsApp Notification Helper
// M-Pesa Collection / Instant Payout Number: 254728595160 (0728595160)
// Official Website WhatsApp Number: 254728595160 (0728595160)

import {
  formatPayHeroAuthHeader,
  getStoredPaymentConfig,
  type StoredPaymentConfig,
} from '@/lib/payment-config';

export const DEFAULT_MERCHANT_PHONE = '254728595160';
export const DEFAULT_WHATSAPP_PHONE = '254728595160';
export const DEFAULT_PRODUCTION_ORIGIN = 'https://www.cbcmaterials.shop';

export function getMerchantPhone(stored?: StoredPaymentConfig): string {
  const raw = (
    stored?.recipientMpesa ||
    process.env.NEXT_PUBLIC_MERCHANT_PHONE ||
    DEFAULT_MERCHANT_PHONE
  ).trim();
  return normalizeKenyanPhone(raw) || DEFAULT_MERCHANT_PHONE;
}

export function getWhatsAppPhone(): string {
  const raw = (
    process.env.WHATSAPP_NOTIFICATION_PHONE ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    DEFAULT_WHATSAPP_PHONE
  ).trim();
  const normalized = normalizeKenyanPhone(raw) || DEFAULT_WHATSAPP_PHONE;
  // Enforce official website WhatsApp number 254728595160 (0728595160) even if legacy env had 254705759072
  if (normalized === '254705759072') return DEFAULT_WHATSAPP_PHONE;
  return normalized;
}

export function toLocalKenyanFormat(intlPhone: string): string {
  const normalized = normalizeKenyanPhone(intlPhone) || DEFAULT_MERCHANT_PHONE;
  return `0${normalized.slice(3)}`;
}

export type ActiveProviderName =
  | 'payhero'
  | 'daraja_live'
  | 'paystack'
  | 'intasend'
  | 'daraja_sandbox';

export interface ResolvedGatewaySummary {
  provider: ActiveProviderName;
  settlesTo0728595160: boolean;
  recipientMpesa: string;
  recipientLocal: string;
  description: string;
}

export async function resolveActiveGatewaySummary(): Promise<ResolvedGatewaySummary> {
  const stored = await getStoredPaymentConfig();
  const recipientMpesa = getMerchantPhone(stored);
  const recipientLocal = toLocalKenyanFormat(recipientMpesa);

  const payheroToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
  const payheroChannel = (stored.payheroChannelId || process.env.PAYHERO_CHANNEL_ID || '').trim();
  const payheroAccount = (stored.payheroAccountId || process.env.PAYHERO_ACCOUNT_ID || '').trim();

  const darajaShortcode = (stored.mpesaShortcode || process.env.MPESA_SHORTCODE || '174379').trim();
  const darajaKey = (stored.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY || '').trim();
  const darajaSecret = (stored.mpesaConsumerSecret || process.env.MPESA_CONSUMER_SECRET || '').trim();
  const darajaPasskey = (stored.mpesaPasskey || process.env.MPESA_PASSKEY || '').trim();

  const paystackKey = (stored.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || '').trim();
  const intasendKey = (stored.intasendSecretKey || process.env.INTASEND_SECRET_KEY || '').trim();

  const pref = stored.activeGateway || 'auto';

  if ((pref === 'payhero' || pref === 'auto') && payheroToken && payheroChannel) {
    const acctNote = payheroAccount ? `Account #${payheroAccount}, ` : '';
    return {
      provider: 'payhero',
      settlesTo0728595160: true,
      recipientMpesa,
      recipientLocal,
      description: `PayHero Live STK Push (${acctNote}Channel #${payheroChannel}) -> Instant ${recipientLocal} M-Pesa`,
    };
  }

  if (
    (pref === 'daraja_live' || pref === 'auto') &&
    darajaShortcode &&
    darajaShortcode !== '174379' &&
    darajaKey &&
    darajaSecret &&
    darajaPasskey
  ) {
    return {
      provider: 'daraja_live',
      settlesTo0728595160: true,
      recipientMpesa,
      recipientLocal,
      description: `Live Safaricom Shortcode ${darajaShortcode} -> Settling to ${recipientLocal}`,
    };
  }

  if ((pref === 'paystack' || pref === 'auto') && paystackKey) {
    return {
      provider: 'paystack',
      settlesTo0728595160: true,
      recipientMpesa,
      recipientLocal,
      description: `Paystack Live M-Pesa STK -> Settling to ${recipientLocal}`,
    };
  }

  if ((pref === 'intasend' || pref === 'auto') && intasendKey) {
    return {
      provider: 'intasend',
      settlesTo0728595160: true,
      recipientMpesa,
      recipientLocal,
      description: `IntaSend Live M-Pesa STK -> Settling to ${recipientLocal}`,
    };
  }

  return {
    provider: 'daraja_sandbox',
    settlesTo0728595160: false,
    recipientMpesa,
    recipientLocal,
    description: `Safaricom Test Shortcode 174379 (No real money sent to ${recipientLocal} until PayHero or Live Till is connected in /admin)`,
  };
}

/**
 * Triggers an instant B2C withdrawal from PayHero Service Wallet straight into 0728595160's M-Pesa balance
 * when `payheroAutoWithdraw` is enabled (for merchants using PayHero Service Wallet rather than a direct Pochi/Till channel).
 */
export async function triggerInstantPayHeroPayout(
  amountKes: number,
  orderRef: string
): Promise<void> {
  try {
    const stored = await getStoredPaymentConfig();
    if (!stored.payheroAutoWithdraw) return;

    const rawToken = (stored.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim();
    if (!rawToken) return;

    const recipient = getMerchantPhone(stored); // 254728595160
    const authHeader = formatPayHeroAuthHeader(rawToken);

    await fetch('https://backend.payhero.co.ke/api/v2/withdraw', {
      method: 'POST',
      headers: {
        Authorization: authHeader,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Math.max(10, Math.floor(amountKes)),
        phone_number: recipient,
        network_code: '63902', // Safaricom M-Pesa instant B2C
        channel: 'mobile',
        external_reference: `PAYOUT_${orderRef}`,
      }),
      cache: 'no-store',
      signal: AbortSignal.timeout(4000),
    });
  } catch (err) {
    console.warn('PayHero auto-withdraw warning:', err);
  }
}

export async function sendWhatsAppAdminNotification(message: string): Promise<boolean> {
  const targetPhone = getWhatsAppPhone(); // 254705759072
  let delivered = false;

  try {
    const callMeBotKey = (process.env.CALLMEBOT_API_KEY || '').trim();
    if (callMeBotKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
        targetPhone
      )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(callMeBotKey)}`;
      const res = await fetch(url, {
        method: 'GET',
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) delivered = true;
    }

    const waToken = (process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
    const waPhoneId = (process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
    if (waToken && waPhoneId) {
      const res = await fetch(`https://graph.facebook.com/v21.0/${waPhoneId}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${waToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: targetPhone,
          type: 'text',
          text: { preview_url: true, body: message },
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) delivered = true;
    }

    const webhookUrl = (process.env.WHATSAPP_WEBHOOK_URL || '').trim();
    if (webhookUrl) {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: targetPhone,
          localPhone: toLocalKenyanFormat(targetPhone),
          message,
          timestamp: new Date().toISOString(),
        }),
        cache: 'no-store',
        signal: AbortSignal.timeout(2500),
      });
      if (res.ok) delivered = true;
    }
  } catch (err) {
    console.warn('WhatsApp notification dispatch warning:', err);
  }

  return delivered;
}

export function extractMpesaReceiptCode(rawInput: string): string | null {
  const upper = String(rawInput || '').trim().toUpperCase();
  if (!upper) return null;

  const smsMatch = upper.match(/\b([A-Z0-9]{10})\s+CONFIRMED\b/);
  if (smsMatch) {
    return smsMatch[1];
  }

  const tokenMatch = upper.match(/\b([A-Z][A-Z0-9]{9})\b/);
  if (tokenMatch) {
    return tokenMatch[1];
  }

  const cleaned = upper.replace(/[^A-Z0-9]/g, '');
  if (cleaned.length >= 8 && cleaned.length <= 12) {
    return cleaned;
  }

  return null;
}

export interface DarajaSession {
  token: string;
  baseUrl: string;
  isLiveCluster: boolean;
  shortCode: string;
  partyB: string;
  passkey: string;
}

interface CachedDarajaSession extends DarajaSession {
  expiresAt: number;
  cacheKey: string;
}

let cachedDarajaSession: CachedDarajaSession | null = null;
const lastQueryAtByCheckoutId = new Map<string, number>();

const DARAJA_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

export function getEatTimestamp(): string {
  const now = new Date();
  const eatDate = new Date(now.getTime() + (3 * 60 + now.getTimezoneOffset()) * 60000);
  const year = eatDate.getFullYear();
  const month = String(eatDate.getMonth() + 1).padStart(2, '0');
  const day = String(eatDate.getDate()).padStart(2, '0');
  const hours = String(eatDate.getHours()).padStart(2, '0');
  const minutes = String(eatDate.getMinutes()).padStart(2, '0');
  const seconds = String(eatDate.getSeconds()).padStart(2, '0');
  return `${year}${month}${day}${hours}${minutes}${seconds}`;
}

export function normalizeKenyanPhone(rawPhone: string): string | null {
  let digits = String(rawPhone || '').trim().replace(/[^0-9]/g, '');
  if (digits.startsWith('0') && digits.length === 10) {
    digits = '254' + digits.slice(1);
  } else if ((digits.startsWith('7') || digits.startsWith('1')) && digits.length === 9) {
    digits = '254' + digits;
  }
  if (!/^254[17]\d{8}$/.test(digits)) {
    return null;
  }
  return digits;
}

export async function getDarajaSession(): Promise<DarajaSession> {
  const stored = await getStoredPaymentConfig();
  const consumerKey = (stored.mpesaConsumerKey || process.env.MPESA_CONSUMER_KEY || '').trim();
  const consumerSecret = (
    stored.mpesaConsumerSecret ||
    process.env.MPESA_CONSUMER_SECRET ||
    ''
  ).trim();
  const shortCode = (stored.mpesaShortcode || process.env.MPESA_SHORTCODE || '174379').trim();
  const tillNumber = (stored.mpesaTillNumber || process.env.MPESA_TILL_NUMBER || '').trim();
  const partyB = (tillNumber || process.env.MPESA_PARTY_B || shortCode).trim();
  const passkey = (
    stored.mpesaPasskey ||
    process.env.MPESA_PASSKEY ||
    'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919'
  ).trim();

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa API keys (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) are not configured.');
  }

  const preferLive = Boolean(shortCode && shortCode !== '174379');
  const cacheKey = `${preferLive ? 'prod' : 'auto'}:${shortCode}:${consumerKey.slice(0, 10)}`;

  if (
    cachedDarajaSession &&
    cachedDarajaSession.cacheKey === cacheKey &&
    Date.now() < cachedDarajaSession.expiresAt
  ) {
    return cachedDarajaSession;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const PROD_BASE = 'https://api.safaricom.co.ke';
  const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke';
  const candidates = preferLive ? [PROD_BASE, SANDBOX_BASE] : [SANDBOX_BASE, PROD_BASE];

  let lastErr = '';
  for (const baseUrl of candidates) {
    const res = await fetch(`${baseUrl}/oauth/v1/generate?grant_type=client_credentials`, {
      method: 'GET',
      headers: {
        ...DARAJA_HEADERS,
        Authorization: `Basic ${auth}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    if (res.ok) {
      try {
        const data = JSON.parse(text);
        if (data?.access_token) {
          const isLiveCluster = baseUrl === PROD_BASE;
          const sessionObj: CachedDarajaSession = {
            token: data.access_token,
            baseUrl,
            isLiveCluster,
            shortCode,
            partyB,
            passkey,
            expiresAt: Date.now() + 50 * 60 * 1000,
            cacheKey,
          };
          cachedDarajaSession = sessionObj;
          return sessionObj;
        }
      } catch {
        // continue
      }
    }

    if (text.includes('Incapsula') || text.includes('<html')) {
      lastErr = 'Safaricom gateway is momentarily busy. Please wait 5 seconds and try again.';
    } else {
      lastErr = `M-Pesa authentication failed (${res.status}). Check Consumer Key & Consumer Secret.`;
    }
  }

  throw new Error(lastErr);
}

export function resolveCallbackUrl(req: Request): string {
  const vercelProdHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (vercelProdHost) {
    return `https://${vercelProdHost}/api/mpesa/callback`;
  }

  try {
    const reqUrl = new URL(req.url);
    const forwardedHost = (req.headers.get('x-forwarded-host') || reqUrl.host).split(',')[0].trim();
    const forwardedProto = (req.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', ''))
      .split(',')[0]
      .trim();
    const isLocalHost =
      forwardedHost.includes('localhost') ||
      forwardedHost.startsWith('127.') ||
      forwardedHost.startsWith('192.168.');

    if (!isLocalHost && forwardedProto === 'https' && !forwardedHost.includes('-git-')) {
      return `https://${forwardedHost}/api/mpesa/callback`;
    }
  } catch {
    // ignore URL parse error
  }

  const configured = (process.env.MPESA_CALLBACK_URL || '').trim();
  if (
    configured.startsWith('https://') &&
    !configured.includes('ngrok') &&
    !configured.includes('localhost') &&
    !configured.includes('127.0.0.1') &&
    !configured.includes('-git-')
  ) {
    return configured;
  }

  return `${DEFAULT_PRODUCTION_ORIGIN}/api/mpesa/callback`;
}

export function resolvePublicOrigin(req: Request): string {
  const vercelProdHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (vercelProdHost) {
    return `https://${vercelProdHost}`;
  }
  try {
    const reqUrl = new URL(req.url);
    const host = (req.headers.get('x-forwarded-host') || reqUrl.host).split(',')[0].trim();
    const proto = (req.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', ''))
      .split(',')[0]
      .trim();
    if (!host.includes('localhost') && !host.startsWith('127.')) {
      return `${proto}://${host}`;
    }
  } catch {
    // ignore
  }
  return DEFAULT_PRODUCTION_ORIGIN;
}

export function shouldThrottleQuery(checkoutRequestId: string, minIntervalMs = 5000): boolean {
  const now = Date.now();
  const prev = lastQueryAtByCheckoutId.get(checkoutRequestId) || 0;
  if (now - prev < minIntervalMs) {
    return true;
  }
  lastQueryAtByCheckoutId.set(checkoutRequestId, now);

  if (lastQueryAtByCheckoutId.size > 500) {
    const cutoff = now - 10 * 60 * 1000;
    for (const [k, ts] of lastQueryAtByCheckoutId.entries()) {
      if (ts < cutoff) lastQueryAtByCheckoutId.delete(k);
    }
  }
  return false;
}

export { DARAJA_HEADERS };
