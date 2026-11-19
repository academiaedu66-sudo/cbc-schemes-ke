import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  buildDailyButtonStatusAd,
  CONNECTED_WHATSAPP_STATUS_INTL,
  CONNECTED_WHATSAPP_STATUS_LOCAL,
  getEatDateAndHour,
  getWhatsAppStatusLedger,
  runHourlyWhatsAppStatusAutopost,
  saveWhatsAppStatusLedger,
  WEBSITE_BUTTONS_FOR_DAILY_STATUS,
  type WhatsAppStatusAutopostLedger,
} from '@/lib/whatsapp-status-autoposter';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cronHeader = req.headers.get('x-vercel-cron');
  const authHeader = req.headers.get('authorization') || '';
  const cronSecret = (process.env.CRON_SECRET || '').trim();
  const isHourlyCronTrigger =
    cronHeader === '1' ||
    searchParams.get('cron') === 'hourly' ||
    (Boolean(cronSecret) && authHeader === `Bearer ${cronSecret}`);

  // 1. Automated Hourly Execution (posts the next unposted Website Button to 0728595160 Status!)
  if (isHourlyCronTrigger) {
    // Guard against duplicate execution within the same 45-minute window unless forced
    const currentLedger = await getWhatsAppStatusLedger();
    const lastEntry = currentLedger.history[0];
    if (lastEntry && searchParams.get('force') !== '1') {
      const minsSinceLast =
        (Date.now() - new Date(lastEntry.postedAtIso).getTime()) / 60000;
      if (minsSinceLast < 48) {
        return NextResponse.json({
          ok: true,
          skipped: `Last Status ad was posted ${Math.round(minsSinceLast)} minutes ago (${lastEntry.buttonLabel}). Next button posts on the next hour.`,
          whatsappConnected: CONNECTED_WHATSAPP_STATUS_LOCAL,
        });
      }
    }

    const result = await runHourlyWhatsAppStatusAutopost();
    return NextResponse.json({
      ok: true,
      trigger: 'hourly_cron',
      whatsappConnected: CONNECTED_WHATSAPP_STATUS_LOCAL,
      posted: result.posted,
      reason: result.reason,
      postedTodayCount: result.postedTodayCount,
      totalButtons: result.totalButtons,
      deliveredToStatusApi: result.deliveredToStatusApi,
      channels: result.channels,
      ad: result.ad || null,
    });
  }

  // 2. Local Linked-Device Daemon Queue Poll (for scripts/whatsapp-0728595160-status-daemon.mjs)
  const daemonKey = searchParams.get('daemonKey') || '';
  const adminPw = (process.env.ADMIN_PASSWORD || '').trim();
  if (daemonKey && adminPw && daemonKey === adminPw) {
    const ledger = await getWhatsAppStatusLedger();
    return NextResponse.json({
      ok: true,
      whatsappNumberIntl: CONNECTED_WHATSAPP_STATUS_INTL,
      pendingDaemonQueue: ledger.pendingDaemonQueue,
    });
  }

  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ledger = await getWhatsAppStatusLedger();
  const now = new Date();
  const { dateEat, hourEat } = getEatDateAndHour(now);
  const postedTodaySet = new Set(ledger.postedByDateEat[dateEat] || []);

  const dailyButtonsPlan = WEBSITE_BUTTONS_FOR_DAILY_STATUS.map((spec) => {
    const generated = buildDailyButtonStatusAd(spec, now);
    return {
      ...generated,
      postedToday: postedTodaySet.has(spec.buttonId),
    };
  });

  return NextResponse.json({
    ok: true,
    whatsappNumberLocal: CONNECTED_WHATSAPP_STATUS_LOCAL,
    whatsappNumberIntl: CONNECTED_WHATSAPP_STATUS_INTL,
    dateEat,
    hourEat,
    enabled: ledger.enabled,
    intervalMinutes: 60,
    postedTodayCount: postedTodaySet.size,
    totalButtons: WEBSITE_BUTTONS_FOR_DAILY_STATUS.length,
    hasWhapiToken: Boolean(ledger.whapiApiToken),
    hasGreenApi: Boolean(ledger.greenApiInstanceId && ledger.greenApiToken),
    hasEvolutionApi: Boolean(
      ledger.evolutionApiUrl && ledger.evolutionApiInstance && ledger.evolutionApiKey
    ),
    customStatusWebhookUrl: ledger.customStatusWebhookUrl || '',
    greenApiUrl: ledger.greenApiUrl || 'https://api.green-api.com',
    greenApiInstanceId: ledger.greenApiInstanceId || '',
    evolutionApiUrl: ledger.evolutionApiUrl || '',
    evolutionApiInstance: ledger.evolutionApiInstance || '',
    dailyButtonsPlan,
    history: ledger.history.slice(0, 25),
  });
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));

  // Allow Linked-Device Daemon to acknowledge posted status items
  const adminPw = (process.env.ADMIN_PASSWORD || '').trim();
  if (body.action === 'ack_daemon' && body.daemonKey && body.daemonKey === adminPw) {
    const ledger = await getWhatsAppStatusLedger();
    const ackId = String(body.buttonId || '');
    ledger.pendingDaemonQueue = ledger.pendingDaemonQueue.filter(
      (q) => q.buttonId !== ackId
    );
    await saveWhatsAppStatusLedger(ledger);
    return NextResponse.json({ ok: true });
  }

  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const action = String(body.action || 'post_next_hourly');

    if (action === 'save_config') {
      const ledger = await getWhatsAppStatusLedger();
      const incoming = (body.config || {}) as Partial<WhatsAppStatusAutopostLedger>;

      if (typeof incoming.enabled === 'boolean') {
        ledger.enabled = incoming.enabled;
      }
      if (incoming.whapiApiToken && incoming.whapiApiToken.trim()) {
        ledger.whapiApiToken = incoming.whapiApiToken.trim();
      }
      if (incoming.greenApiUrl !== undefined) {
        ledger.greenApiUrl = incoming.greenApiUrl.trim();
      }
      if (incoming.greenApiInstanceId !== undefined) {
        ledger.greenApiInstanceId = incoming.greenApiInstanceId.trim();
      }
      if (incoming.greenApiToken && incoming.greenApiToken.trim()) {
        ledger.greenApiToken = incoming.greenApiToken.trim();
      }
      if (incoming.evolutionApiUrl !== undefined) {
        ledger.evolutionApiUrl = incoming.evolutionApiUrl.trim();
      }
      if (incoming.evolutionApiInstance !== undefined) {
        ledger.evolutionApiInstance = incoming.evolutionApiInstance.trim();
      }
      if (incoming.evolutionApiKey && incoming.evolutionApiKey.trim()) {
        ledger.evolutionApiKey = incoming.evolutionApiKey.trim();
      }
      if (incoming.customStatusWebhookUrl !== undefined) {
        ledger.customStatusWebhookUrl = incoming.customStatusWebhookUrl.trim();
      }

      const saved = await saveWhatsAppStatusLedger(ledger);
      return NextResponse.json({
        ok: true,
        message: `WhatsApp (${CONNECTED_WHATSAPP_STATUS_LOCAL}) hourly Status settings saved!`,
        enabled: saved.enabled,
        hasWhapiToken: Boolean(saved.whapiApiToken),
        hasGreenApi: Boolean(saved.greenApiInstanceId && saved.greenApiToken),
        hasEvolutionApi: Boolean(
          saved.evolutionApiUrl && saved.evolutionApiInstance && saved.evolutionApiKey
        ),
      });
    }

    // Default: Trigger next unposted button (or a specific chosen button) right now!
    const forceButtonId = body.buttonId ? String(body.buttonId).trim() : undefined;
    const result = await runHourlyWhatsAppStatusAutopost({ forceButtonId });
    return NextResponse.json({
      ok: true,
      ...result,
    });
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'WhatsApp Status auto-post failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
