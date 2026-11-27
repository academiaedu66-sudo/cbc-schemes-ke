// src/app/api/contest/activate/route.ts
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { triggerAutomaticBackup } from '@/lib/security';

/**
 * Admin endpoint to activate the contest when 1000+ participants have confirmed payment.
 */
export async function POST() {
  // Count confirmed participants
  const { count, error } = await supabaseAdmin
    .from('contest_participants')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'confirmed');
  if (error) return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  if ((count ?? 0) < 1000) {
    return NextResponse.json({ success: false, message: 'Not enough participants yet' }, { status: 400 });
  }
  // Upsert a config row indicating the contest is active
  await supabaseAdmin.from('contest_config').upsert({ id: 'active', active: true }, { onConflict: 'id' });
  void triggerAutomaticBackup('National Contest activated');
  return NextResponse.json({ success: true, message: 'Contest activated' });
}
