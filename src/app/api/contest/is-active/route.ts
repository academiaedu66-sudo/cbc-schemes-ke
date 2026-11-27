// src/app/api/contest/is-active/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  let query = supabaseAdmin
    .from('contest_participants')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');

  if (subject) {
    query = query.eq('subject', subject);
  }

  const { count, error } = await query;
  if (error) {
    if (error.code === 'PGRST205' || error.message?.includes('schema cache')) {
      return NextResponse.json({ active: false, participants: 0, subject: subject || 'ALL', setupRequired: true });
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Also check if admin manually activated contest in contest_config
  const { data: cfg } = await supabaseAdmin
    .from('contest_config')
    .select('active')
    .eq('id', 'active')
    .maybeSingle();

  const active = Boolean(cfg?.active) || (count ?? 0) >= 1000;
  return NextResponse.json({ active, participants: count ?? 0, subject: subject || 'ALL' });
}
