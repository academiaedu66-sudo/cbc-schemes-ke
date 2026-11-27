// src/app/api/contest/leaderboard/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

/**
 * Public leaderboard – returns participants sorted by marks descending.
 * Only participants with a confirmed payment and a score are listed.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const subject = searchParams.get('subject');

  let query = supabaseAdmin
    .from('contest_participants')
    .select('name, school, subject, marks')
    .eq('status', 'confirmed')
    .order('marks', { ascending: false });

  if (subject && subject !== 'ALL') {
    query = query.eq('subject', subject);
  }

  const { data, error } = await query;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ leaderboard: data });
}
