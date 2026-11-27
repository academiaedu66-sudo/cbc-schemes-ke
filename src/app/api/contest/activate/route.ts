// src/app/api/contest/activate/route.ts
import { NextResponse } from 'next/server';
import { listContestParticipants, setContestActiveFlag } from '@/lib/contest-store';
import { triggerAutomaticBackup } from '@/lib/security';

/**
 * Admin endpoint to activate the contest once 1,000+ confirmed participants are reached.
 */
export async function POST() {
  const participants = await listContestParticipants();
  const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;

  if (confirmedCount < 1000) {
    return NextResponse.json(
      {
        success: false,
        message: `Threshold not met yet (${confirmedCount}/1000 confirmed participants).`,
      },
      { status: 400 }
    );
  }

  await setContestActiveFlag(true);
  void triggerAutomaticBackup(`National Contest activated (${confirmedCount} confirmed)`);
  return NextResponse.json({
    success: true,
    message: `Contest activated (${confirmedCount} confirmed participants)`,
  });
}
