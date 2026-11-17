import { supabaseAdmin } from '@/lib/supabase';
import {
  computeEstimatedEarnings,
  getStoredMonetizationConfig,
  getStoredMonetizationStats,
} from '@/lib/monetization';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import { normalizeKenyanPhone, toLocalKenyanFormat } from '@/lib/mpesa';
import { triggerAutomaticBackup } from '@/lib/security';

const BUCKET_NAME = 'cbc-materials';
const WALLET_LEDGER_PATH = '_system/wallet-ledger.json';

export type WithdrawalSource = 'COMBINED' | 'CLIENT_PAYMENTS' | 'MONETIZATION';
export type WithdrawalMethod = 'MPESA' | 'BANK';

export interface WalletWithdrawalRecord {
  id: string;
  referenceCode: string;
  amountKes: number;
  fromClientPaymentsKes: number;
  fromMonetizationKes: number;
  source: WithdrawalSource;
  method: WithdrawalMethod;
  destination: string; // e.g. 0728595160 or Bank Acc
  status: 'COMPLETED' | 'PENDING_SETTLEMENT' | 'CANCELLED';
  gatewayDisbursed: boolean;
  mpesaReceipt?: string;
  gatewayMessage: string;
  createdAt: string;
}

export interface WalletLedger {
  withdrawals: WalletWithdrawalRecord[];
  updatedAt: string;
}

export interface WalletOverview {
  clientPaymentsGrossKes: number;
  monetizationGrossKes: number;
  totalGrossEarnedKes: number;
  clientPaymentsWithdrawnKes: number;
  monetizationWithdrawnKes: number;
  totalWithdrawnKes: number;
  availableClientPaymentsKes: number;
  availableMonetizationKes: number;
  availableTotalKes: number;
  completedOrdersCount: number;
  liveB2cReady: boolean;
  hasPaystackKey: boolean;
  payheroChannelId: string;
  adNetworkConnected: boolean;
  adNetworkProvider: 'monetag' | 'adsterra' | 'custom';
  adNetworkScriptUrl: string;
  smartlinkUrl: string;
  adsenseClientId: string;
  defaultMpesaPhone: string;
  withdrawals: WalletWithdrawalRecord[];
}

let cachedWalletLedger: { data: WalletLedger; loadedAt: number } | null = null;

export async function getWalletLedger(forceFresh = false): Promise<WalletLedger> {
  if (
    !forceFresh &&
    cachedWalletLedger &&
    Date.now() - cachedWalletLedger.loadedAt < 3000
  ) {
    return cachedWalletLedger.data;
  }

  const empty: WalletLedger = {
    withdrawals: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(WALLET_LEDGER_PATH);

    if (error || !data) {
      cachedWalletLedger = { data: empty, loadedAt: Date.now() };
      return empty;
    }

    const parsed = JSON.parse(await data.text()) as Partial<WalletLedger>;
    const normalized: WalletLedger = {
      withdrawals: Array.isArray(parsed.withdrawals) ? parsed.withdrawals : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
    cachedWalletLedger = { data: normalized, loadedAt: Date.now() };
    return normalized;
  } catch {
    return empty;
  }
}

export async function saveWalletLedger(ledger: WalletLedger): Promise<void> {
  ledger.updatedAt = new Date().toISOString();
  cachedWalletLedger = { data: ledger, loadedAt: Date.now() };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      WALLET_LEDGER_PATH,
      Buffer.from(JSON.stringify(ledger, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );

  void triggerAutomaticBackup('Wallet withdrawal ledger updated');
}

export async function computeWalletOverview(): Promise<WalletOverview> {
  const [{ data: orders }, monStats, monConfig, ledger, payConfig] =
    await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('amount, status')
        .eq('status', 'COMPLETED')
        .limit(5000),
      getStoredMonetizationStats(),
      getStoredMonetizationConfig(),
      getWalletLedger(true),
      getStoredPaymentConfig(),
    ]);

  const completedList = orders || [];
  const clientPaymentsGrossKes = Number(
    completedList
      .reduce((sum, o) => sum + (Number(o.amount) || 0), 0)
      .toFixed(2)
  );

  const earnings = computeEstimatedEarnings(monStats, monConfig);
  const monetizationGrossKes = Number(
    (earnings.totalEstimatedKes || 0).toFixed(2)
  );
  const totalGrossEarnedKes = Number(
    (clientPaymentsGrossKes + monetizationGrossKes).toFixed(2)
  );

  const activeWithdrawals = ledger.withdrawals.filter(
    (w) => w.status !== 'CANCELLED'
  );

  const clientPaymentsWithdrawnKes = Number(
    activeWithdrawals
      .reduce((sum, w) => sum + (Number(w.fromClientPaymentsKes) || 0), 0)
      .toFixed(2)
  );
  const monetizationWithdrawnKes = Number(
    activeWithdrawals
      .reduce((sum, w) => sum + (Number(w.fromMonetizationKes) || 0), 0)
      .toFixed(2)
  );
  const totalWithdrawnKes = Number(
    activeWithdrawals
      .reduce((sum, w) => sum + (Number(w.amountKes) || 0), 0)
      .toFixed(2)
  );

  const availableClientPaymentsKes = Number(
    Math.max(0, clientPaymentsGrossKes - clientPaymentsWithdrawnKes).toFixed(2)
  );
  const availableMonetizationKes = Number(
    Math.max(0, monetizationGrossKes - monetizationWithdrawnKes).toFixed(2)
  );
  const availableTotalKes = Number(
    Math.max(0, availableClientPaymentsKes + availableMonetizationKes).toFixed(2)
  );

  const hasPaystackKey = Boolean(
    (payConfig.paystackSecretKey || process.env.PAYSTACK_SECRET_KEY || '').trim()
  );
  const hasPayheroToken = Boolean(
    (payConfig.payheroAuthToken || process.env.PAYHERO_AUTH_TOKEN || '').trim()
  );
  const liveB2cReady = hasPaystackKey || hasPayheroToken;

  const adNetworkConnected = Boolean(
    (monConfig.adNetworkScriptUrl || '').trim() ||
      (monConfig.smartlinkUrl || '').trim() ||
      (monConfig.adsenseClientId || '').trim()
  );

  const defaultMpesaPhone = toLocalKenyanFormat(
    payConfig.recipientMpesa || '254728595160'
  );

  return {
    clientPaymentsGrossKes,
    monetizationGrossKes,
    totalGrossEarnedKes,
    clientPaymentsWithdrawnKes,
    monetizationWithdrawnKes,
    totalWithdrawnKes,
    availableClientPaymentsKes,
    availableMonetizationKes,
    availableTotalKes,
    completedOrdersCount: completedList.length,
    liveB2cReady,
    hasPaystackKey,
    payheroChannelId: payConfig.payheroChannelId || '',
    adNetworkConnected,
    adNetworkProvider: monConfig.adNetworkProvider || 'monetag',
    adNetworkScriptUrl: monConfig.adNetworkScriptUrl || '',
    smartlinkUrl: monConfig.smartlinkUrl || '',
    adsenseClientId: monConfig.adsenseClientId || '',
    defaultMpesaPhone,
    withdrawals: ledger.withdrawals,
  };
}

export async function createWalletWithdrawal(params: {
  amountKes: number;
  source: WithdrawalSource;
  method: WithdrawalMethod;
  destination: string;
}): Promise<{
  ok: boolean;
  error?: string;
  withdrawal?: WalletWithdrawalRecord;
  overview?: WalletOverview;
}> {
  const overview = await computeWalletOverview();
  const reqAmount = Number(Number(params.amountKes || 0).toFixed(2));

  if (!Number.isFinite(reqAmount) || reqAmount < 10) {
    return {
      ok: false,
      error: 'Minimum withdrawal amount is KES 10.',
    };
  }

  let maxAllowed = overview.availableTotalKes;
  if (params.source === 'CLIENT_PAYMENTS') {
    maxAllowed = overview.availableClientPaymentsKes;
  } else if (params.source === 'MONETIZATION') {
    maxAllowed = overview.availableMonetizationKes;
  }

  if (reqAmount > maxAllowed + 0.01) {
    return {
      ok: false,
      error: `Requested KES ${reqAmount.toLocaleString()} exceeds your available ${
        params.source === 'CLIENT_PAYMENTS'
          ? 'Client Payments'
          : params.source === 'MONETIZATION'
          ? 'Monetization'
          : 'Combined Wallet'
      } balance of KES ${maxAllowed.toLocaleString()}.`,
    };
  }

  let fromClientPaymentsKes = 0;
  let fromMonetizationKes = 0;

  if (params.source === 'CLIENT_PAYMENTS') {
    fromClientPaymentsKes = reqAmount;
  } else if (params.source === 'MONETIZATION') {
    fromMonetizationKes = reqAmount;
  } else {
    // COMBINED: draw from Client Payments first, then Monetization Earnings
    fromClientPaymentsKes = Number(
      Math.min(reqAmount, overview.availableClientPaymentsKes).toFixed(2)
    );
    fromMonetizationKes = Number(
      Math.max(0, reqAmount - fromClientPaymentsKes).toFixed(2)
    );
  }

  const cleanDest = params.destination.trim();
  const intlMpesa =
    params.method === 'MPESA' ? normalizeKenyanPhone(cleanDest) : null;

  if (params.method === 'MPESA' && !intlMpesa) {
    return {
      ok: false,
      error: 'Please enter a valid Safaricom M-Pesa number (e.g. 0728595160).',
    };
  }
  if (!cleanDest) {
    return {
      ok: false,
      error: 'Please enter your withdrawal destination.',
    };
  }

  const refCode = `WD-${Math.floor(100000 + Math.random() * 900000)}`;
  let gatewayDisbursed = false;
  let gatewayMessage =
    params.method === 'MPESA'
      ? `Withdrawal recorded to M-Pesa ${toLocalKenyanFormat(intlMpesa || cleanDest)}`
      : `Bank payout queued (${cleanDest})`;
  let status: WalletWithdrawalRecord['status'] = 'COMPLETED';

  // Attempt live Paystack Kenya M-Pesa Transfer (Primary) or PayHero B2C (Fallback)
  if (params.method === 'MPESA' && intlMpesa) {
    const payCfg = await getStoredPaymentConfig();
    const paystackKey = (
      payCfg.paystackSecretKey ||
      process.env.PAYSTACK_SECRET_KEY ||
      ''
    ).trim();
    const rawToken = (
      payCfg.payheroAuthToken ||
      process.env.PAYHERO_AUTH_TOKEN ||
      ''
    ).trim();

    if (paystackKey) {
      try {
        const localMpesa = toLocalKenyanFormat(intlMpesa);
        // 1. Create or resolve M-Pesa Transfer Recipient on Paystack Kenya
        let recipientCode = '';
        for (const acctCandidate of [localMpesa, intlMpesa, `+${intlMpesa}`]) {
          const recRes = await fetch('https://api.paystack.co/transferrecipient', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              type: 'mobile_money',
              name: 'cbckenya Admin Payout',
              account_number: acctCandidate,
              bank_code: 'MPESA',
              currency: 'KES',
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(7000),
          });
          const recJson = (await recRes.json().catch(() => ({}))) as {
            status?: boolean;
            data?: { recipient_code?: string };
          };
          if (recRes.ok && recJson.data?.recipient_code) {
            recipientCode = recJson.data.recipient_code;
            break;
          }
        }

        if (!recipientCode) {
          status = 'PENDING_SETTLEMENT';
          gatewayMessage = `Paystack recipient setup pending (${refCode}) — verify your Paystack Kenya account is in Live Mode with M-Pesa Transfers enabled.`;
        } else {
          // 2. Initiate Instant M-Pesa Transfer (Paystack amounts are in cents: KES * 100)
          const trRes = await fetch('https://api.paystack.co/transfer', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${paystackKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              source: 'balance',
              amount: Math.max(1000, Math.round(reqAmount * 100)),
              recipient: recipientCode,
              reason: `cbckenya Wallet Withdrawal ${refCode}`,
              reference: refCode.toLowerCase(),
            }),
            cache: 'no-store',
            signal: AbortSignal.timeout(8000),
          });
          const trJson = (await trRes.json().catch(() => ({}))) as {
            status?: boolean;
            message?: string;
            data?: { status?: string; transfer_code?: string };
          };

          if (trRes.ok && trJson.status) {
            gatewayDisbursed = true;
            status =
              trJson.data?.status === 'otp' ? 'PENDING_SETTLEMENT' : 'COMPLETED';
            gatewayMessage =
              trJson.data?.status === 'otp'
                ? `Paystack sent an OTP to confirm transfer ${refCode} (disable Transfer OTP in Paystack -> Settings -> Preferences for instant 1-tap M-Pesa SMS!).`
                : `Paystack M-Pesa Transfer Sent to ${localMpesa}! Check your phone for the Safaricom M-Pesa SMS (${
                    trJson.data?.transfer_code || refCode
                  }).`;
          } else {
            status = 'PENDING_SETTLEMENT';
            gatewayMessage = `Paystack response (${refCode}): ${
              trJson.message ||
              'Ensure your Paystack KES Balance has settled funds for transfer.'
            }`;
          }
        }
      } catch {
        status = 'PENDING_SETTLEMENT';
        gatewayMessage = `Logged (${refCode}) — network timeout reaching Paystack Transfer API.`;
      }
    } else if (rawToken) {
      try {
        const res = await fetch('https://backend.payhero.co.ke/api/v2/withdraw', {
          method: 'POST',
          headers: {
            Authorization: formatPayHeroAuthHeader(rawToken),
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            amount: Math.max(10, Math.floor(reqAmount)),
            phone_number: intlMpesa,
            network_code: '63902',
            channel: 'mobile',
            external_reference: refCode,
            callback_url: 'https://www.cbcmaterials.shop/api/mpesa/callback',
          }),
          cache: 'no-store',
          signal: AbortSignal.timeout(8000),
        });

        const resJson = (await res.json().catch(() => ({}))) as {
          reference?: string;
          message?: string;
          error_message?: string;
        };

        if (res.ok) {
          gatewayDisbursed = true;
          status = 'COMPLETED';
          gatewayMessage = `Safaricom M-Pesa B2C Disbursed to ${toLocalKenyanFormat(
            intlMpesa
          )}! Check your phone for the M-Pesa SMS notification (${
            resJson.reference || refCode
          }).`;
        } else {
          status = 'PENDING_SETTLEMENT';
          gatewayMessage = `PayHero B2C response (${refCode}): ${
            resJson.error_message ||
            resJson.message ||
            'Ensure your PayHero Service Wallet has sufficient KES balance to send M-Pesa.'
          }`;
        }
      } catch {
        status = 'PENDING_SETTLEMENT';
        gatewayMessage = `Logged (${refCode}) — queued for M-Pesa settlement to ${toLocalKenyanFormat(
          intlMpesa
        )}.`;
      }
    } else {
      status = 'PENDING_SETTLEMENT';
      gatewayMessage = `Queued (${refCode}) — Paste your Paystack Secret Key (sk_live_...) in "Link Real M-Pesa B2C & Ad Networks" below to send real KES automatically to ${toLocalKenyanFormat(
        intlMpesa
      )}!`;
    }
  } else {
    status = 'PENDING_SETTLEMENT';
  }

  const record: WalletWithdrawalRecord = {
    id: `wd_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    referenceCode: refCode,
    amountKes: reqAmount,
    fromClientPaymentsKes,
    fromMonetizationKes,
    source: params.source,
    method: params.method,
    destination:
      params.method === 'MPESA' && intlMpesa
        ? toLocalKenyanFormat(intlMpesa)
        : cleanDest,
    status,
    gatewayDisbursed,
    gatewayMessage,
    createdAt: new Date().toISOString(),
  };

  const ledger = await getWalletLedger(true);
  ledger.withdrawals = [record, ...ledger.withdrawals].slice(0, 150);
  await saveWalletLedger(ledger);

  const nextOverview = await computeWalletOverview();
  return {
    ok: true,
    withdrawal: record,
    overview: nextOverview,
  };
}

export async function updateWithdrawalStatus(
  id: string,
  status: WalletWithdrawalRecord['status']
): Promise<WalletOverview> {
  const ledger = await getWalletLedger(true);
  ledger.withdrawals = ledger.withdrawals.map((w) =>
    w.id === id ? { ...w, status } : w
  );
  await saveWalletLedger(ledger);
  return computeWalletOverview();
}

export async function confirmWithdrawalCallback(params: {
  referenceCode: string;
  mpesaReceipt: string;
  success: boolean;
}): Promise<boolean> {
  const cleanRef = params.referenceCode.replace(/^PAYOUT_/, '').trim();
  const ledger = await getWalletLedger(true);
  const idx = ledger.withdrawals.findIndex((w) => w.referenceCode === cleanRef);
  if (idx === -1) return false;

  if (params.success) {
    ledger.withdrawals[idx] = {
      ...ledger.withdrawals[idx],
      status: 'COMPLETED',
      gatewayDisbursed: true,
      mpesaReceipt: params.mpesaReceipt,
      gatewayMessage: `M-Pesa Confirmed! Safaricom Receipt: ${params.mpesaReceipt}`,
    };
  } else {
    ledger.withdrawals[idx] = {
      ...ledger.withdrawals[idx],
      status: 'CANCELLED',
      gatewayMessage: `M-Pesa B2C failed — amount refunded back to Wallet.`,
    };
  }

  await saveWalletLedger(ledger);
  return true;
}
