// src/app/api/contest/activate/route.ts
import { NextResponse } from 'next/server';
import { listContestParticipants, setContestActiveFlag } from '@/lib/contest-store';
import { triggerAutomaticBackup } from '@/lib/security';

/**
 * Admin endpoint to activate the contest.
 */
export async function POST() {
  const participants = await listContestParticipants();
  const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;

  await setContestActiveFlag(true);
  void triggerAutomaticBackup(`National Contest activated (${confirmedCount} confirmed)`);
  return NextResponse.json({
    success: true,
    message: `Contest activated (${confirmedCount} confirmed participants)`,
  });
}
