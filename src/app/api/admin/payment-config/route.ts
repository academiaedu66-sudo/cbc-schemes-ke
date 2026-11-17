import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  getStoredPaymentConfig,
  saveStoredPaymentConfig,
  type StoredPaymentConfig,
} from '@/lib/payment-config';
import { resolveActiveGatewaySummary } from '@/lib/mpesa';
import { triggerAutomaticBackup } from '@/lib/security';

function maskSecret(val?: string): string {
  if (!val || val.trim().length < 6) return val ? '••••••' : '';
  const clean = val.trim();
  return `••••••••${clean.slice(-4)}`;
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const stored = await getStoredPaymentConfig();
  const summary = await resolveActiveGatewaySummary();

  return NextResponse.json({
    summary,
    config: {
      activeGateway: stored.activeGateway || 'auto',
      recipientMpesa: stored.recipientMpesa || '254728595160',
      payheroAccountId: stored.payheroAccountId || '',
      payheroChannelId: stored.payheroChannelId || '',
      payheroAuthTokenMasked: maskSecret(stored.payheroAuthToken),
      hasPayheroToken: Boolean(stored.payheroAuthToken?.trim()),
      payheroAutoWithdraw: Boolean(stored.payheroAutoWithdraw),
      mpesaShortcode: stored.mpesaShortcode || '',
      mpesaTillNumber: stored.mpesaTillNumber || '',
      hasDarajaLiveKeys: Boolean(
        stored.mpesaConsumerKey?.trim() &&
          stored.mpesaConsumerSecret?.trim() &&
          stored.mpesaPasskey?.trim()
      ),
      hasPaystackKey: Boolean(stored.paystackSecretKey?.trim()),
      hasIntasendKey: Boolean(stored.intasendSecretKey?.trim()),
      updatedAt: stored.updatedAt || null,
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const current = await getStoredPaymentConfig();

    const updated: StoredPaymentConfig = {
      ...current,
      activeGateway: body.activeGateway || current.activeGateway || 'auto',
      recipientMpesa: (body.recipientMpesa || current.recipientMpesa || '254728595160').trim(),
      payheroAccountId:
        body.payheroAccountId !== undefined
          ? String(body.payheroAccountId).trim()
          : current.payheroAccountId,
      payheroChannelId:
        body.payheroChannelId !== undefined
          ? String(body.payheroChannelId).trim()
          : current.payheroChannelId,
      payheroAutoWithdraw:
        body.payheroAutoWithdraw !== undefined
          ? Boolean(body.payheroAutoWithdraw)
          : current.payheroAutoWithdraw,
      mpesaShortcode:
        body.mpesaShortcode !== undefined
          ? String(body.mpesaShortcode).trim()
          : current.mpesaShortcode,
      mpesaTillNumber:
        body.mpesaTillNumber !== undefined
          ? String(body.mpesaTillNumber).trim()
          : current.mpesaTillNumber,
    };

    // Only overwrite secret tokens when non-empty new values are submitted
    if (typeof body.payheroAuthToken === 'string' && body.payheroAuthToken.trim()) {
      updated.payheroAuthToken = body.payheroAuthToken.trim();
    }
    if (typeof body.mpesaPasskey === 'string' && body.mpesaPasskey.trim()) {
      updated.mpesaPasskey = body.mpesaPasskey.trim();
    }
    if (typeof body.mpesaConsumerKey === 'string' && body.mpesaConsumerKey.trim()) {
      updated.mpesaConsumerKey = body.mpesaConsumerKey.trim();
    }
    if (typeof body.mpesaConsumerSecret === 'string' && body.mpesaConsumerSecret.trim()) {
      updated.mpesaConsumerSecret = body.mpesaConsumerSecret.trim();
    }
    if (typeof body.paystackSecretKey === 'string' && body.paystackSecretKey.trim()) {
      updated.paystackSecretKey = body.paystackSecretKey.trim();
    }
    if (typeof body.intasendSecretKey === 'string' && body.intasendSecretKey.trim()) {
      updated.intasendSecretKey = body.intasendSecretKey.trim();
    }

    await saveStoredPaymentConfig(updated);
    void triggerAutomaticBackup('Live M-Pesa gateway config updated');
    const summary = await resolveActiveGatewaySummary();

    return NextResponse.json({
      message: 'Live M-Pesa payout configuration saved and activated!',
      summary,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to save configuration';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
