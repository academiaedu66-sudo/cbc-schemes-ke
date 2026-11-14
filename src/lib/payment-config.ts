import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
const CONFIG_STORAGE_PATH = '_system/payment-gateway-config.json';

export interface StoredPaymentConfig {
  activeGateway: 'auto' | 'payhero' | 'daraja_live' | 'paystack' | 'intasend';
  recipientMpesa?: string; // defaults to 254728595160
  // PayHero Kenya (supports Pochi la Biashara / Till / Service Wallet + Instant M-Pesa Withdraw)
  payheroAuthToken?: string;
  payheroChannelId?: string;
  payheroAutoWithdraw?: boolean;
  // Live Safaricom Daraja (Till / Paybill linked to 0728595160)
  mpesaShortcode?: string;
  mpesaTillNumber?: string;
  mpesaPasskey?: string;
  mpesaConsumerKey?: string;
  mpesaConsumerSecret?: string;
  // Paystack / IntaSend
  paystackSecretKey?: string;
  intasendSecretKey?: string;
  updatedAt?: string;
}

let cachedConfig: { data: StoredPaymentConfig; expiresAt: number } | null = null;

export function invalidatePaymentConfigCache() {
  cachedConfig = null;
}

export async function getStoredPaymentConfig(): Promise<StoredPaymentConfig> {
  if (cachedConfig && Date.now() < cachedConfig.expiresAt) {
    return cachedConfig.data;
  }

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(CONFIG_STORAGE_PATH);

    if (error || !data) {
      const empty: StoredPaymentConfig = { activeGateway: 'auto' };
      cachedConfig = { data: empty, expiresAt: Date.now() + 15000 };
      return empty;
    }

    const text = await data.text();
    const parsed = JSON.parse(text) as StoredPaymentConfig;
    cachedConfig = { data: parsed, expiresAt: Date.now() + 15000 };
    return parsed;
  } catch {
    return { activeGateway: 'auto' };
  }
}

export async function saveStoredPaymentConfig(
  nextConfig: StoredPaymentConfig
): Promise<void> {
  const payload = JSON.stringify(
    {
      ...nextConfig,
      updatedAt: new Date().toISOString(),
    },
    null,
    2
  );

  const { error } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(CONFIG_STORAGE_PATH, Buffer.from(payload, 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  if (error) {
    throw new Error(`Failed to save gateway config: ${error.message}`);
  }

  cachedConfig = { data: nextConfig, expiresAt: Date.now() + 15000 };
}

export function formatPayHeroAuthHeader(rawToken: string): string {
  const trimmed = rawToken.trim();
  if (!trimmed) return '';
  if (/^basic\s+/i.test(trimmed)) {
    return `Basic ${trimmed.replace(/^basic\s+/i, '').trim()}`;
  }
  // If user pasted api_username:api_password, base64 encode it
  if (trimmed.includes(':')) {
    return `Basic ${Buffer.from(trimmed).toString('base64')}`;
  }
  return `Basic ${trimmed}`;
}
