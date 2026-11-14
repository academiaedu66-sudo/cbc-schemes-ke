// Shared M-Pesa & WhatsApp Notification Helper
// M-Pesa Collection Number: 254728595160 (0728595160)
// WhatsApp Notification Inbox: 254705759072 (0705759072)

export const DEFAULT_MERCHANT_PHONE = '254728595160';
export const DEFAULT_WHATSAPP_PHONE = '254705759072';
export const DEFAULT_PRODUCTION_ORIGIN = 'https://cbc-schemes-ke.vercel.app';

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
 * Bounded by a 2.5s timeout and never throws so checkout/webhooks never hang.
 */
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

export type PaymentProvider = 'paystack' | 'intasend' | 'daraja';

export function getActivePaymentProvider(): PaymentProvider {
  if ((process.env.PAYSTACK_SECRET_KEY || '').trim()) {
    return 'paystack';
  }
  if ((process.env.INTASEND_SECRET_KEY || '').trim()) {
    return 'intasend';
  }
  return 'daraja';
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

export function isMpesaProduction(): boolean {
  const env = (process.env.MPESA_ENVIRONMENT || '').trim().toLowerCase();
  if (env === 'production' || env === 'live' || env === 'prod') return true;
  const shortCode = (process.env.MPESA_SHORTCODE || '174379').trim();
  return Boolean(shortCode && shortCode !== '174379');
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

/**
 * Authenticates against Safaricom Daraja and automatically resolves the matching
 * cluster (https://api.safaricom.co.ke vs https://sandbox.safaricom.co.ke) so OAuth
 * and STK Push always hit the exact cluster that issued the consumer keys.
 */
export async function getDarajaSession(): Promise<DarajaSession> {
  const consumerKey = (process.env.MPESA_CONSUMER_KEY || '').trim();
  const consumerSecret = (process.env.MPESA_CONSUMER_SECRET || '').trim();

  if (!consumerKey || !consumerSecret) {
    throw new Error('M-Pesa API keys (MPESA_CONSUMER_KEY / MPESA_CONSUMER_SECRET) are not configured.');
  }

  const preferLive = isMpesaProduction();
  const cacheKey = `${preferLive ? 'prod' : 'auto'}:${consumerKey.slice(0, 10)}`;

  if (
    cachedDarajaSession &&
    cachedDarajaSession.cacheKey === cacheKey &&
    Date.now() < cachedDarajaSession.expiresAt
  ) {
    return {
      token: cachedDarajaSession.token,
      baseUrl: cachedDarajaSession.baseUrl,
      isLiveCluster: cachedDarajaSession.isLiveCluster,
    };
  }

  const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString('base64');
  const PROD_BASE = 'https://api.safaricom.co.ke';
  const SANDBOX_BASE = 'https://sandbox.safaricom.co.ke';

  // Try preferred cluster first, then fallback cluster if credentials belong to the other
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
          cachedDarajaSession = {
            token: data.access_token,
            baseUrl,
            isLiveCluster,
            expiresAt: Date.now() + 50 * 60 * 1000,
            cacheKey,
          };
          return {
            token: data.access_token,
            baseUrl,
            isLiveCluster,
          };
        }
      } catch {
        // continue
      }
    }

    if (text.includes('Incapsula') || text.includes('<html')) {
      lastErr = 'Safaricom gateway is momentarily busy. Please wait 5 seconds and try again.';
    } else {
      lastErr = `M-Pesa authentication failed (${res.status}). Check MPESA_CONSUMER_KEY & MPESA_CONSUMER_SECRET.`;
    }
  }

  throw new Error(lastErr);
}

export async function getDarajaAccessToken(): Promise<string> {
  const session = await getDarajaSession();
  return session.token;
}

/**
 * Guarantees a publicly reachable HTTPS callback URL that writes directly to our
 * shared Supabase `orders` table (avoiding dead ngrok tunnels and protected Vercel preview URLs).
 */
export function resolveCallbackUrl(req: Request): string {
  // 1. On Vercel, ALWAYS use the public production domain so callbacks never hit dead/old env placeholders or protected preview URLs
  const vercelProdHost = (process.env.VERCEL_PROJECT_PRODUCTION_URL || '').trim();
  if (vercelProdHost) {
    return `https://${vercelProdHost}/api/mpesa/callback`;
  }

  // 2. Inspect incoming request host if public HTTPS
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

  // 3. Honor custom live domain if explicitly set on non-Vercel host
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

  // 4. Safe live production fallback (shares the exact same Supabase `orders` table)
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

export function shouldThrottleQuery(checkoutRequestId: string, minIntervalMs = 6000): boolean {
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
