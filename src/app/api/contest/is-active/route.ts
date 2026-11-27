// src/app/api/contest/is-active/route.ts
import { NextResponse } from 'next/server';
import { getContestActiveFlag, listContestParticipants } from '@/lib/contest-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  const participants = await listContestParticipants(subject);
  const confirmedCount = participants.filter((p) => p.status === 'confirmed').length;
  const adminActive = await getContestActiveFlag();

  const active = adminActive || confirmedCount >= 1000;
  return NextResponse.json({
    active,
    participants: confirmedCount,
    subject: subject || 'ALL',
  });
}
