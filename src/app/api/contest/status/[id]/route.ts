// src/app/api/contest/status/[id]/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  // Extract participant ID from URL
  const url = new URL(req.url);
  const id = url.pathname.split('/').pop();
  if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });
  const { data, error } = await supabaseAdmin
    .from('contest_participants')
    .select('status, payment_confirmed_at, marks')
    .eq('id', id)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ status: data.status, paymentConfirmedAt: data.payment_confirmed_at, marks: data.marks });
}
