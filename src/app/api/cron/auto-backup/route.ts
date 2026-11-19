import { NextRequest, NextResponse } from 'next/server';
import { runContinuousNonStopBackup } from '@/lib/security';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const source = searchParams.get('source') || 'Continuous 24/7 Cron Heartbeat';

  try {
    const res = await runContinuousNonStopBackup(source);
    return NextResponse.json({
      ok: true,
      mode: 'NON_STOP_AUTOMATIC_BACKEND_BACKUP',
      generatedAt: res.generatedAt,
      cloudSnapshotPath: res.cloudSnapshotPath,
      counts: res.counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Auto-backup failed';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
