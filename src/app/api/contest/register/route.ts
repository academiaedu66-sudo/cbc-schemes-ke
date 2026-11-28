import { NextResponse } from 'next/server';
import { getWhatsAppPhone, initiateStkPush } from '@/lib/mpesa';
import { createContestParticipant, updateContestParticipant } from '@/lib/contest-store';
import { triggerAutomaticBackup } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_GRADES = ['Grade 6', 'Grade 7', 'Grade 8', 'Grade 9'];

/**
 * Register a learner (Grade 6, 7, 8, or 9) for a National Contest subject test.
 * Body: { name:string, school:string, phoneNumber:string, grade?:string, subject?:string }
 * Initiates a Ksh 500 STK push. Participant is created with status 'pending'.
 */
export async function POST(req: Request) {
  try {
    const { name, school, phoneNumber, grade, subject } = await req.json();
    if (!name || !school || !phoneNumber || !grade) {
      return NextResponse.json(
        { success: false, message: 'Please provide name, school, grade, and phone number' },
        { status: 400 }
      );
    }
    const chosenGrade = ALLOWED_GRADES.includes(String(grade).trim())
      ? String(grade).trim()
      : 'Grade 7';
    const chosenSubject = String(subject || 'Mathematics').trim();
    const participantId = uuidv4();

    await createContestParticipant({
      id: participantId,
      name: String(name).trim(),
      school: String(school).trim(),
      phone: String(phoneNumber).trim(),
      grade: chosenGrade,
      subject: chosenSubject,
      status: 'pending',
      created_at: new Date().toISOString(),
    });

    // Initiate STK push for Ksh 500
    const stkResult = await initiateStkPush({
      phoneNumber,
      amount: 500,
      accountReference: `CONTEST-${participantId.slice(0, 8)}`,
      transactionDesc: `${chosenGrade} ${chosenSubject}`.slice(0, 24),
    });

    const checkoutId = stkResult?.CheckoutRequestID ?? null;
    if (checkoutId) {
      await updateContestParticipant(participantId, { checkout_request_id: checkoutId });
    }

    const whatsappPhone = getWhatsAppPhone();
    void triggerAutomaticBackup(`Contest registration: ${chosenGrade} ${chosenSubject}`);
    return NextResponse.json({
      success: true,
      message: `STK push sent for ${chosenGrade} ${chosenSubject} (KSh 500) – please complete payment`,
      participantId,
      grade: chosenGrade,
      subject: chosenSubject,
      stkResult,
      whatsappUrl: `https://wa.me/${whatsappPhone}?text=${encodeURIComponent(
        `I am registered for the National Contest (${chosenGrade} - ${chosenSubject}) #${participantId}`
      )}`,
    });
  } catch (e: unknown) {
    console.error('Contest registration error', e);
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ success: false, message: msg }, { status: 500 });
  }
}
