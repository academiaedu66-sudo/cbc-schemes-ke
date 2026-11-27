import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getWhatsAppPhone, initiateStkPush } from '@/lib/mpesa';
import { triggerAutomaticBackup } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';

/**
 * Register a learner for a National Contest subject test.
 * Body: { name:string, school:string, phoneNumber:string, subject?:string }
 * Initiates a Ksh 500 STK push. Participant is created with status 'pending'.
 */
export async function POST(req: Request) {
  try {
    const { name, school, phoneNumber, subject } = await req.json();
    if (!name || !school || !phoneNumber) {
      return NextResponse.json({ success: false, message: 'Missing fields' }, { status: 400 });
    }
    const chosenSubject = String(subject || 'Mathematics').trim();

    // Create a participant record with a generated UUID
    const participantId = uuidv4();
    const { error: insertErr } = await supabaseAdmin
      .from('contest_participants')
      .insert({
        id: participantId,
        name,
        school,
        phone: phoneNumber,
        subject: chosenSubject,
        status: 'pending',
        created_at: new Date().toISOString(),
      });
    if (insertErr) throw insertErr;

    // Initiate STK push for Ksh 500
    const stkResult = await initiateStkPush({
      phoneNumber,
      amount: 500,
      accountReference: `CONTEST-${participantId.slice(0, 8)}`,
      transactionDesc: `National Contest: ${chosenSubject}`.slice(0, 24),
    });

    // Update participant with checkout request ID for later verification
    const checkoutId = stkResult?.CheckoutRequestID ?? null;
    if (checkoutId) {
      await supabaseAdmin
        .from('contest_participants')
        .update({ checkout_request_id: checkoutId })
        .eq('id', participantId);
    }

    const whatsappPhone = getWhatsAppPhone();
    void triggerAutomaticBackup(`Contest registration: ${chosenSubject}`);
    return NextResponse.json({
      success: true,
      message: `STK push sent for ${chosenSubject} (KSh 500) – please complete payment`,
      participantId,
      subject: chosenSubject,
      stkResult,
      whatsappUrl: `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `I am registered for the National Contest (${chosenSubject}) #${participantId}`
      )}`,
    });
  } catch (e: any) {
    console.error('Contest registration error', e);
    return NextResponse.json({ success: false, message: e?.message || 'Server error' }, { status: 500 });
  }
}
