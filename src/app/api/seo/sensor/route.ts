import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  classifyKeywordCluster,
  detectTrafficSource,
  getSeoCustomerSensorLedger,
  runDailyAutomatedSeoRankSync,
  saveSeoCustomerSensorLedger,
} from '@/lib/seo-visitor-sensor';

const BOT_UA_REGEX =
  /bot|crawler|spider|slurp|mediapartners|facebookexternalhit|whatsapp|headless|lighthouse|uptime|curl|python/i;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const cronHeader = req.headers.get('x-vercel-cron');
  const isDailyCron =
    cronHeader === '1' || searchParams.get('cron') === 'daily';

  if (isDailyCron) {
    const syncRes = await runDailyAutomatedSeoRankSync();
    return NextResponse.json({
      trigger: 'daily_auto_seo_rank',
      ...syncRes,
    });
  }

  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ledger = await getSeoCustomerSensorLedger(true);
  return NextResponse.json({
    ok: true,
    totalCustomersDetected: ledger.totalCustomersDetected,
    lastDailyAutoRankIso: ledger.lastDailyAutoRankIso,
    lastIndexNowStatus: ledger.lastIndexNowStatus,
    trendingQueries: ledger.trendingQueries,
    latestCustomer: ledger.recentCustomers[0] || null,
    recentCustomers: ledger.recentCustomers.slice(0, 15),
  });
}

export async function POST(req: NextRequest) {
  const ua = req.headers.get('user-agent') || '';
  const ip =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'visitor';

  // Ignore automated search engine bots so ONLY real human customers ring "New customer is here PROFESSOR"
  if (!ua || BOT_UA_REGEX.test(ua)) {
    return NextResponse.json({ ok: true, ignored: 'bot' });
  }

  try {
    const body = (await req.json().catch(() => ({}))) as {
      landingPath?: string;
      referrer?: string;
      searchQuery?: string;
      action?: string;
    };

    if (body.action === 'force_daily_rank' && isAdminAuthorized(req)) {
      const syncRes = await runDailyAutomatedSeoRankSync();
      return NextResponse.json(syncRes);
    }

    const landingPath = String(body.landingPath || '/').slice(0, 160);
    if (
      landingPath.startsWith('/admin') ||
      landingPath.startsWith('/mobile-admin') ||
      landingPath.startsWith('/monetization')
    ) {
      return NextResponse.json({ ok: true, ignored: 'admin' });
    }

    const referrer = String(body.referrer || '').slice(0, 240);
    const cleanQuery = String(body.searchQuery || '').trim().slice(0, 90);

    const ledger = await getSeoCustomerSensorLedger();
    const nowMs = Date.now();
    const dedupeKey = cleanQuery ? `${ip}:q:${cleanQuery.toLowerCase()}` : ip;
    const prevTs = ledger.recentIpTimestamps[dedupeKey] || 0;

    // Deduplicate rapid page reloads from same IP within 2.5 minutes (unless they type a new search query)
    if (nowMs - prevTs < 150_000) {
      return NextResponse.json({ ok: true, deduplicated: true });
    }

    ledger.recentIpTimestamps[dedupeKey] = nowMs;
    ledger.totalCustomersDetected = (ledger.totalCustomersDetected || 0) + 1;

    const sourceLabel = detectTrafficSource(referrer, ua, Boolean(cleanQuery));
    const keywordCluster = classifyKeywordCluster(landingPath, cleanQuery);
    const isMobile = /android|iphone|ipad|mobile/i.test(ua);
    const deviceSummary = isMobile ? 'Mobile Phone' : 'Computer';

    if (cleanQuery.length >= 3) {
      const existingLower = new Set(ledger.trendingQueries.map((q) => q.toLowerCase()));
      if (!existingLower.has(cleanQuery.toLowerCase())) {
        ledger.trendingQueries.unshift(cleanQuery);
      }
    }

    ledger.recentCustomers.unshift({
      id: `cust_${nowMs}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date(nowMs).toISOString(),
      sourceLabel,
      keywordCluster,
      searchQuery: cleanQuery || undefined,
      landingPath,
      deviceSummary,
    });

    await saveSeoCustomerSensorLedger(ledger);

    // Opportunistically trigger the 24-hour Auto-Rank IndexNow booster if >20 hours since last run
    const lastSyncMs = ledger.lastDailyAutoRankIso
      ? new Date(ledger.lastDailyAutoRankIso).getTime()
      : 0;
    if (nowMs - lastSyncMs > 20 * 60 * 60 * 1000) {
      void runDailyAutomatedSeoRankSync().catch(() => {});
    }

    return NextResponse.json({ ok: true, recorded: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
