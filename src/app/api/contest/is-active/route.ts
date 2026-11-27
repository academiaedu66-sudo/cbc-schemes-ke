// src/app/api/contest/is-active/route.ts
import { NextResponse } from 'next/server';
import { getContestActiveFlag, listContestParticipants } from '@/lib/contest-store';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  // Enforce the 1,000 confirmed-student threshold before opening the test
  const allParticipants = await listContestParticipants();
  const totalConfirmed = allParticipants.filter((p) => p.status === 'confirmed').length;
  const adminActive = await getContestActiveFlag();

  const active = totalConfirmed >= 1000 && adminActive;
  return NextResponse.json({
    active,
    subject: subject || 'ALL',
  });
}
