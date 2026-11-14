// Shared M-Pesa & WhatsApp Notification Helper
// M-Pesa Collection Number: 254728595160 (0728595160)
// WhatsApp Notification Inbox: 254705759072 (0705759072)

export const DEFAULT_MERCHANT_PHONE = '254728595160';
export const DEFAULT_WHATSAPP_PHONE = '254705759072';

export function getMerchantPhone(): string {
  const raw = (process.env.NEXT_PUBLIC_MERCHANT_PHONE || DEFAULT_MERCHANT_PHONE).trim();
  return normalizeKenyanPhone(raw) || DEFAULT_MERCHANT_PHONE;
}

export function getWhatsAppPhone(): string {
  const raw = (
    process.env.WHATSAPP_NOTIFICATION_PHONE ||
    process.env.NEXT_PUBLIC_WHATSAPP_PHONE ||
    DEFAULT_WHATSAPP_PHONE
  ).trim();
  return normalizeKenyanPhone(raw) || DEFAULT_WHATSAPP_PHONE;
}

export function toLocalKenyanFormat(intlPhone: string): string {
  const normalized = normalizeKenyanPhone(intlPhone) || DEFAULT_MERCHANT_PHONE;
  return `0${normalized.slice(3)}`;
}

/**
 * Sends a real-time server-side WhatsApp notification straight into 254705759072 (0705759072)
 * when CALLMEBOT_API_KEY, Meta WhatsApp Cloud API, or WHATSAPP_WEBHOOK_URL is configured.
 * Never throws so checkout never blocks if a notification provider is offline.
 */
export async function sendWhatsAppAdminNotification(message: string): Promise<boolean> {
  const targetPhone = getWhatsAppPhone(); // 254705759072
  let delivered = false;

  try {
    // 1. CallMeBot Personal WhatsApp Inbox API (Free, sends straight to 254705759072)
    const callMeBotKey = (process.env.CALLMEBOT_API_KEY || '').trim();
    if (callMeBotKey) {
      const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(
        targetPhone
      )}&text=${encodeURIComponent(message)}&apikey=${encodeURIComponent(callMeBotKey)}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      if (res.ok) delivered = true;
    }

    // 2. Meta Official WhatsApp Cloud API
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
      });
      if (res.ok) delivered = true;
    }

    // 3. Optional Custom WhatsApp Webhook (GreenAPI / Evolution / Make / Zapier)
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
      });
      if (res.ok) delivered = true;
    }
  } catch (err) {
    console.warn('WhatsApp notification dispatch warning:', err);
  }

  return delivered;
}

export type PaymentProvider = 'paystack' | 'intasend' | 'daraja_live' | 'daraja_sandbox';

export function getActivePaymentProvider(): PaymentProvider {
  if ((process.env.PAYSTACK_SECRET_KEY || '').trim()) {
    return 'paystack';
  }
  if ((process.env.INTASEND_SECRET_KEY || '').trim()) {
    return 'intasend';
  }
  const isProd = isMpesaProduction();
  const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
  if (isProd && shortCode && shortCode !== '174379') {
    return 'daraja_live';
  }
  return 'daraja_sandbox';
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

interface CachedToken {
  token: string;
  expiresAt: number;
  envKey: string;
}

let cachedDarajaToken: CachedToken | null = null;
const lastQueryAtByCheckoutId = new Map<string, number>();

const DARAJA_HEADERS = {
  Accept: 'application/json',
  'Accept-Language': 'en-US,en;q=0.9',
  'User-Agent':
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
};

export function isMpesaProduction(): boolean {
  return (process.env.MPESA_ENVIRONMENT || '').trim().toLowerCase() === 'production';
}

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

export async function getDarajaAccessToken(): Promise<string> {
  const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa API keys (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) are not configured.');
  }

  const isProd = isMpesaProduction();
  const envKey = `${isProd ? 'prod' : 'sandbox'}:${consumerKey.slice(0, 8)}`;

  if (cachedDarajaToken && cachedDarajaToken.envKey === envKey && Date.now() < cachedDarajaToken.expiresAt) {
    return cachedDarajaToken.token;
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const tokenUrl = isProd
    ? 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
    : 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

  let lastErr = '';
  for (let attempt = 1; attempt <= 2; attempt++) {
    const res = await fetch(tokenUrl, {
      method: 'GET',
      headers: {
        ...DARAJA_HEADERS,
        Authorization: `Basic ${auth}`,
      },
      cache: 'no-store',
    });

    const text = await res.text();
    if (res.ok) {
      const data = JSON.parse(text);
      if (data?.access_token) {
        cachedDarajaToken = {
          token: data.access_token,
          expiresAt: Date.now() + 50 * 60 * 1000,
          envKey,
        };
        return data.access_token;
      }
    }

    if (text.includes('Incapsula') || text.includes('<html')) {
      lastErr = 'Safaricom gateway is momentarily busy. Please wait 10 seconds and click Pay & Download again.';
    } else {
      lastErr = `M-Pesa authentication failed (${res.status}). Check MPESA_CONSUMER_KEY & MPESA_CONSUMER_SECRET.`;
    }

    if (attempt < 2) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  throw new Error(lastErr);
}

export function resolveCallbackUrl(req: Request): string {
  const configured = (process.env.MPESA_CALLBACK_URL || '').trim();

  try {
    const reqUrl = new URL(req.url);
    const forwardedHost = req.headers.get('x-forwarded-host') || reqUrl.host;
    const forwardedProto = req.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', '');
    const isLocalHost =
      forwardedHost.includes('localhost') ||
      forwardedHost.startsWith('127.') ||
      forwardedHost.startsWith('192.168.');

    if (!isLocalHost && forwardedProto === 'https') {
      if (!configured || configured.includes('ngrok') || configured.includes('localhost')) {
        return `https://${forwardedHost}/api/mpesa/callback`;
      }
    }
  } catch {
    // ignore URL parse error
  }

  return configured;
}

export function resolvePublicOrigin(req: Request): string {
  try {
    const reqUrl = new URL(req.url);
    const host = req.headers.get('x-forwarded-host') || reqUrl.host;
    const proto = req.headers.get('x-forwarded-proto') || reqUrl.protocol.replace(':', '');
    return `${proto}://${host}`;
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
  }
}

export function shouldThrottleQuery(checkoutRequestId: string, minIntervalMs = 12000): boolean {
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
