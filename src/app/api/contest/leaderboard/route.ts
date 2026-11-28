// src/app/api/contest/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { listContestParticipants } from '@/lib/contest-store';

/**
 * Public leaderboard – returns confirmed participants sorted by marks descending.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');
  const grade = searchParams.get('grade');

  const participants = await listContestParticipants(subject, grade);
  const leaderboard = participants
    .filter((p) => p.status === 'confirmed')
    .sort((a, b) => (b.marks ?? -1) - (a.marks ?? -1))
    .map((p) => ({
      name: p.name,
      school: p.school,
      grade: p.grade || 'Grade 7',
      subject: p.subject,
      marks: p.marks ?? null,
    }));

  return NextResponse.json({ leaderboard });
}
