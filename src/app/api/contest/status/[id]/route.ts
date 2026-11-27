// src/app/api/contest/status/[id]/route.ts
import { NextResponse } from 'next/server';
import { getContestParticipantById, syncPendingContestPayment } from '@/lib/contest-store';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

  const participant = await getContestParticipantById(id);
  if (!participant) {
    return NextResponse.json({ status: 'pending', paymentConfirmedAt: null, marks: null });
  }

  // Actively check PayHero status if still pending so confirmation is instant
  const synced = await syncPendingContestPayment(participant);

  return NextResponse.json({
    status: synced.status,
    paymentConfirmedAt: synced.payment_confirmed_at ?? null,
    marks: synced.marks ?? null,
  });
}
