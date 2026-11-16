import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  computeEstimatedEarnings,
  getStoredMonetizationConfig,
  getStoredMonetizationStats,
  recordMonetizationEvent,
  resetStoredMonetizationStats,
  type TrackEventType,
} from '@/lib/monetization';

const VALID_EVENTS = new Set<TrackEventType>([
  'view',
  'impression',
  'interaction',
  'click',
]);

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const [stats, config] = await Promise.all([
    getStoredMonetizationStats(),
    getStoredMonetizationConfig(),
  ]);
  const earnings = computeEstimatedEarnings(stats, config);

  return NextResponse.json({
    stats,
    earnings,
    ratesKes: config.ratesKes,
  });
}

export async function POST(req: NextRequest) {
  // Read headers upfront for clean Next.js 16 dynamic bailout
  void req.headers.get('user-agent');

  try {
    const body = (await req.json().catch(() => ({}))) as {
      eventType?: string;
      placement?: string;
      interactionType?: string;
    };

    const eventType = (body.eventType || '') as TrackEventType;
    if (!VALID_EVENTS.has(eventType)) {
      return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
    }

    await recordMonetizationEvent({
      eventType,
      placement: body.placement,
      interactionType: body.interactionType,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const stats = await resetStoredMonetizationStats();
  const config = await getStoredMonetizationConfig();
  const earnings = computeEstimatedEarnings(stats, config);

  return NextResponse.json({
    success: true,
    stats,
    earnings,
  });
}
