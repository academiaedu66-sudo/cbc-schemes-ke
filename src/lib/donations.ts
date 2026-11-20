import { supabaseAdmin } from '@/lib/supabase';

const BUCKET_NAME = 'cbc-materials';
export const DONATIONS_LEDGER_PATH = '_system/donations-ledger.json';

export const USD_TO_KES_DONATION_RATE = 130; // $1 USD = KSh 130
export const MIN_DONATION_USD = 1;
export const SINGLE_STK_MAX_KES = 250000; // Safaricom per-push ceiling; larger donations support multi-tranche STK or Bank Wire
export const DONATION_SUPPORT_WHATSAPP_INTL = '254728595160';
export const DONATION_SUPPORT_WHATSAPP_LOCAL = '0728595160';
export const DONATION_REMITTANCE_MPESA_E164 = '+254728595160';

// Official International Donor WhatsApp Desks (Fixed Inside & Outside Donation Button)
export const DONATION_UK_WHATSAPP_DISPLAY = '+447446315035';
export const DONATION_UK_WHATSAPP_DIGITS = '447446315035';
export const DONATION_USA_CANADA_WHATSAPP_DISPLAY = '+1(828)401-1513';
export const DONATION_USA_CANADA_WHATSAPP_DIGITS = '18284011513';

export type DonationPaymentMethod =
  | 'DIRECT_STK_BANK'
  | 'REMITLY'
  | 'SENDWAVE'
  | 'WORLDREMIT'
  | 'PAYPAL'
  | 'INTERNATIONAL_BANK_TRANSFER';

export const DONATION_METHOD_LABELS: Record<DonationPaymentMethod, string> = {
  DIRECT_STK_BANK: 'Direct M-Pesa / Global STK Push -> Bank',
  REMITLY: 'Remitly Remittance -> Connected Bank STK Push',
  SENDWAVE: 'Sendwave Remittance -> Connected Bank STK Push',
  WORLDREMIT: 'WorldRemit Remittance -> Connected Bank STK Push',
  PAYPAL: 'PayPal (Upon Request -> Connected Bank Settlement)',
  INTERNATIONAL_BANK_TRANSFER: 'International Bank Transfer / SWIFT (Upon Request)',
};

export interface LearnerDonationRecord {
  id: string;
  referenceCode: string; // e.g. DON-8421
  donorName: string;
  donorEmail: string;
  donorPhone: string;
  donorCountry: string;
  amountUsd: number;
  amountKes: number;
  method: DonationPaymentMethod;
  remittanceTxCode?: string;
  dedicatedNote?: string;
  checkoutRequestId?: string;
  bankSweepCheckoutId?: string;
  status:
    | 'REQUESTED_DETAILS'
    | 'STK_PENDING'
    | 'REMITTANCE_SENT_PENDING_BANK_SWEEP'
    | 'COMPLETED_IN_BANK';
  createdAt: string;
  updatedAt: string;
}

export interface DonationGatewaySettings {
  usdToKesRate: number;
  paypalHandleOrUrl: string; // Shown strictly upon request when configured
  bankName: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankSwiftBic: string;
  bankBranch: string;
  autoTriggerBankSweepOnRemittanceConfirm: boolean;
}

export interface DonationsLedger {
  settings: DonationGatewaySettings;
  donations: LearnerDonationRecord[];
  updatedAt: string;
}

const DEFAULT_DONATION_SETTINGS: DonationGatewaySettings = {
  usdToKesRate: USD_TO_KES_DONATION_RATE,
  paypalHandleOrUrl: '',
  bankName: 'Equity Bank Kenya (Connected via PayHero Bank Channel #15443)',
  bankAccountName: 'CBCMATERIALS.SHOP / Learner Support Fund',
  bankAccountNumber: '',
  bankSwiftBic: 'EQBLKENA',
  bankBranch: 'Nairobi, Kenya',
  autoTriggerBankSweepOnRemittanceConfirm: true,
};

export function convertUsdToKes(
  amountUsd: number,
  rate = USD_TO_KES_DONATION_RATE
): number {
  const safeUsd = Math.max(MIN_DONATION_USD, Number(amountUsd) || MIN_DONATION_USD);
  return Math.max(130, Math.round(safeUsd * rate));
}

export async function getDonationsLedger(): Promise<DonationsLedger> {
  const fallback: DonationsLedger = {
    settings: DEFAULT_DONATION_SETTINGS,
    donations: [],
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(DONATIONS_LEDGER_PATH);
    if (error || !data) return fallback;
    const parsed = JSON.parse(await data.text()) as Partial<DonationsLedger>;
    return {
      settings: {
        ...DEFAULT_DONATION_SETTINGS,
        ...(parsed.settings || {}),
      },
      donations: Array.isArray(parsed.donations)
        ? parsed.donations.slice(0, 500)
        : [],
      updatedAt: parsed.updatedAt || new Date().toISOString(),
    };
  } catch {
    return fallback;
  }
}

export async function saveDonationsLedger(
  ledger: DonationsLedger
): Promise<DonationsLedger> {
  const next: DonationsLedger = {
    settings: {
      ...DEFAULT_DONATION_SETTINGS,
      ...(ledger.settings || {}),
    },
    donations: (ledger.donations || []).slice(0, 500),
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      DONATIONS_LEDGER_PATH,
      Buffer.from(JSON.stringify(next, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );

  return next;
}
