import crypto from 'crypto';
import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import {
  normalizeKenyanPhone,
  sendWhatsAppAdminNotification,
  shouldThrottleQuery,
  toLocalKenyanFormat,
} from '@/lib/mpesa';
import { formatPayHeroAuthHeader, getStoredPaymentConfig } from '@/lib/payment-config';
import { COORDINATOR_WHATSAPP_INTL, COORDINATOR_WHATSAPP_LOCAL } from '@/lib/tuition';
import {
  GAMING_SESSION_MS,
  generateNextGameQuestion,
  getGamingLedger,
  POINTS_PER_QUESTION,
  REDEEM_KES_VALUE,
  REDEEM_POINTS_REQUIRED,
  saveGamingLedger,
  verifyQuestionToken,
  type GamingPlayer,
} from '@/lib/gaming';

function ensurePlayer(
  players: Record<string, GamingPlayer>,
  phone: string,
  playerName: string,
  gradeKey: string
): GamingPlayer {
  if (!players[phone]) {
    players[phone] = {
      phone,
      playerName: playerName || 'CBC Learner',
      gradeKey: gradeKey || '7',
      pointsBalance: 0,
      lifetimePoints: 0,
      questionsAttempted: 0,
      questionsCorrect: 0,
      sessionsActivated: 0,
      totalRedeemedKes: 0,
      updatedAt: new Date().toISOString(),
    };
  } else {
    if (playerName) players[phone].playerName = playerName;
    if (gradeKey) players[phone].gradeKey = gradeKey;
  }
  return players[phone];
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const isAdmin = isAdminAuthorized(req);
  const ledger = await getGamingLedger();
  const now = Date.now();

  if (isAdmin && searchParams.get('admin') === '1') {
    const playersList = Object.values(ledger.players).sort(
      (a, b) => b.pointsBalance - a.pointsBalance || b.lifetimePoints - a.lifetimePoints
    );
    const activeSessions = Object.values(ledger.sessions).filter(
      (s) => s.expiresAt > now
    );

    return NextResponse.json({
      players: playersList,
      activeSessionsCount: activeSessions.length,
      redemptions: ledger.redemptions,
    });
  }

  const sessionId = searchParams.get('sessionId');
  if (sessionId) {
    const sess = ledger.sessions[sessionId];
    if (!sess || now >= sess.expiresAt) {
      const player = sess ? ledger.players[sess.phone] || null : null;
      return NextResponse.json({
        active: false,
        expired: true,
        player,
        message: '20-minute gaming session ended — logged out automatically.',
      });
    }

    const player = ensurePlayer(
      ledger.players,
      sess.phone,
      sess.playerName,
      sess.gradeKey
    );
    const question = generateNextGameQuestion({
      sessionId: sess.sessionId,
      subject: sess.subject,
      gradeKey: sess.gradeKey,
    });

    return NextResponse.json({
      active: true,
      remainingSeconds: Math.max(0, Math.floor((sess.expiresAt - now) / 1000)),
      expiresAt: sess.expiresAt,
      session: {
        sessionId: sess.sessionId,
        subject: sess.subject,
        gradeKey: sess.gradeKey,
        sessionPoints: sess.sessionPoints,
        sessionAnswered: sess.sessionAnswered,
      },
      player,
      question,
    });
  }

  const rawPhone = searchParams.get('phone') || '';
  const phone = normalizeKenyanPhone(rawPhone);
  if (phone && ledger.players[phone]) {
    const p = ledger.players[phone];
    return NextResponse.json({
      found: true,
      playerName: p.playerName,
      pointsBalance: p.pointsBalance,
      lifetimePoints: p.lifetimePoints,
      totalRedeemedKes: p.totalRedeemedKes,
    });
  }

  return NextResponse.json({ found: false, pointsBalance: 0 });
}

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

  try {
    const body = await req.json();
    const action = String(body.action || '');
    const ledger = await getGamingLedger();
    const now = Date.now();

    // 1. ACTIVATE 1-HOUR SESSION AFTER KSh 10 STK PUSH IS AUTO-CONFIRMED
    if (action === 'activate') {
      const checkoutRequestId = String(body.checkoutRequestId || '').trim();
      const rawPhone = String(body.phone || '').trim();
      const playerName = String(body.playerName || 'CBC Learner').trim();
      const gradeKey = String(body.gradeKey || '7').trim();
      const subject = String(body.subject || 'Mathematics').trim();

      if (!checkoutRequestId) {
        return NextResponse.json(
          { error: 'Valid STK payment reference is required.' },
          { status: 400 }
        );
      }

      // Verify auto-confirmed M-Pesa payment in orders table (with live PayHero instant verification!)
      const { data: initialOrder } = await supabaseAdmin
        .from('orders')
        .select('checkout_request_id, status, amount, phone_number')
        .eq('checkout_request_id', checkoutRequestId)
        .maybeSingle();

      let order = initialOrder;

      if (
        checkoutRequestId.startsWith('PAYHERO_') &&
        (!order || order.status === 'PENDING') &&
        !shouldThrottleQuery(`gaming_${checkoutRequestId}`, 900)
      ) {
        try {
          const stored = await getStoredPaymentConfig();
          const rawToken = (
            stored.payheroAuthToken ||
            process.env.PAYHERO_AUTH_TOKEN ||
            ''
          ).trim();
          if (rawToken) {
            const reference = checkoutRequestId.replace(/^PAYHERO_/, '');
            const phRes = await fetch(
              `https://backend.payhero.co.ke/api/v2/transaction-status?reference=${encodeURIComponent(
                reference
              )}`,
              {
                headers: { Authorization: formatPayHeroAuthHeader(rawToken) },
                cache: 'no-store',
              }
            );
            const phJson = await phRes.json();
            const st = String(phJson?.status || '').toUpperCase();
            if (st === 'SUCCESS' || st === 'COMPLETED') {
              const receipt = String(
                phJson?.provider_reference ||
                  phJson?.third_party_reference ||
                  reference
              ).slice(0, 40);
              const amt = Math.max(10, Number(phJson?.amount) || Number(order?.amount) || 10);
              const phPhone = String(
                phJson?.phone_number || order?.phone_number || rawPhone || '254700000000'
              );
              await supabaseAdmin.from('orders').upsert(
                {
                  checkout_request_id: checkoutRequestId,
                  phone_number: phPhone,
                  resource_id: null,
                  amount: amt,
                  mpesa_receipt_number: receipt,
                  status: 'COMPLETED',
                },
                { onConflict: 'checkout_request_id' }
              );
              order = {
                checkout_request_id: checkoutRequestId,
                status: 'COMPLETED',
                amount: amt,
                phone_number: phPhone,
              };
            } else if (st === 'FAILED' || st === 'CANCELLED' || st === 'CANCELED') {
              if (order) {
                await supabaseAdmin
                  .from('orders')
                  .update({ status: 'FAILED', updated_at: new Date().toISOString() })
                  .eq('checkout_request_id', checkoutRequestId);
                order = { ...order, status: 'FAILED' };
              }
            }
          }
        } catch {}
      }

      if (!order) {
        return NextResponse.json(
          { status: 'PENDING', error: 'Waiting for M-Pesa confirmation...' },
          { status: 202 }
        );
      }

      if (order.status !== 'COMPLETED') {
        return NextResponse.json(
          {
            status: order.status,
            error: 'Waiting for M-Pesa STK payment auto-confirmation...',
          },
          { status: 202 }
        );
      }

      if (Number(order.amount) < 10) {
        return NextResponse.json(
          { error: 'Gaming activation requires KSh 10 payment.' },
          { status: 403 }
        );
      }

      const phone =
        normalizeKenyanPhone(rawPhone) ||
        normalizeKenyanPhone(order.phone_number) ||
        order.phone_number;

      // Check if this checkoutRequestId already created a 1-hour session
      const existingSession = Object.values(ledger.sessions).find(
        (s) => s.checkoutRequestId === checkoutRequestId
      );

      if (existingSession) {
        if (now >= existingSession.expiresAt) {
          return NextResponse.json(
            {
              expired: true,
              error:
                'This 20-minute gaming pass has already expired. Pay KSh 10 to start a new 20-minute session.',
            },
            { status: 401 }
          );
        }

        existingSession.subject = subject || existingSession.subject;
        existingSession.gradeKey = gradeKey || existingSession.gradeKey;
        const player = ensurePlayer(ledger.players, phone, playerName, gradeKey);
        await saveGamingLedger(ledger);

        const question = generateNextGameQuestion({
          sessionId: existingSession.sessionId,
          subject: existingSession.subject,
          gradeKey: existingSession.gradeKey,
        });

        return NextResponse.json({
          active: true,
          sessionId: existingSession.sessionId,
          expiresAt: existingSession.expiresAt,
          remainingSeconds: Math.max(
            0,
            Math.floor((existingSession.expiresAt - now) / 1000)
          ),
          player,
          sessionPoints: existingSession.sessionPoints,
          question,
        });
      }

      // Mint brand-new exact 20-minute (1,200s) session
      const sessionId = `gs_${crypto.randomBytes(12).toString('hex')}`;
      const startedAt = now;
      const expiresAt = startedAt + GAMING_SESSION_MS;

      const player = ensurePlayer(ledger.players, phone, playerName, gradeKey);
      player.sessionsActivated += 1;
      player.updatedAt = new Date().toISOString();

      ledger.sessions[sessionId] = {
        sessionId,
        checkoutRequestId,
        phone,
        playerName: player.playerName,
        gradeKey,
        subject,
        startedAt,
        expiresAt,
        sessionPoints: 0,
        sessionAnswered: 0,
        usedQuestionNonces: [],
      };

      await saveGamingLedger(ledger);

      const question = generateNextGameQuestion({
        sessionId,
        subject,
        gradeKey,
      });

      return NextResponse.json({
        active: true,
        sessionId,
        expiresAt,
        remainingSeconds: 1200,
        player,
        sessionPoints: 0,
        question,
      });
    }

    // 2. SUBMIT QUESTION ANSWER (+1 POINT IF CORRECT, ENFORCE 20-MINUTE AUTO-LOGOUT)
    if (action === 'answer') {
      const sessionId = String(body.sessionId || '');
      const token = String(body.token || '');
      const selectedIndex = Number(body.selectedIndex);

      const sess = ledger.sessions[sessionId];
      if (!sess || now >= sess.expiresAt) {
        const player = sess ? ledger.players[sess.phone] || null : null;
        return NextResponse.json(
          {
            expired: true,
            player,
            error:
              'Your 20-minute gaming session has expired! You have been logged out automatically. Your points are safely saved.',
          },
          { status: 401 }
        );
      }

      const verified = verifyQuestionToken(token, sessionId);
      if (!verified) {
        return NextResponse.json(
          { error: 'Invalid or expired question token.' },
          { status: 400 }
        );
      }

      if (sess.usedQuestionNonces.includes(verified.nonce)) {
        const nextQ = generateNextGameQuestion({
          sessionId,
          subject: sess.subject,
          gradeKey: sess.gradeKey,
        });
        return NextResponse.json({
          alreadyAnswered: true,
          player: ledger.players[sess.phone],
          remainingSeconds: Math.max(0, Math.floor((sess.expiresAt - now) / 1000)),
          nextQuestion: nextQ,
        });
      }

      sess.usedQuestionNonces.push(verified.nonce);
      if (sess.usedQuestionNonces.length > 120) {
        sess.usedQuestionNonces = sess.usedQuestionNonces.slice(-120);
      }

      const player = ensurePlayer(
        ledger.players,
        sess.phone,
        sess.playerName,
        sess.gradeKey
      );

      const isCorrect = selectedIndex === verified.correctIndex;
      sess.sessionAnswered += 1;
      player.questionsAttempted += 1;

      if (isCorrect) {
        sess.sessionPoints += POINTS_PER_QUESTION;
        player.pointsBalance += POINTS_PER_QUESTION;
        player.lifetimePoints += POINTS_PER_QUESTION;
        player.questionsCorrect += 1;
      }
      player.updatedAt = new Date().toISOString();

      await saveGamingLedger(ledger);

      const nextQuestion = generateNextGameQuestion({
        sessionId,
        subject: sess.subject,
        gradeKey: sess.gradeKey,
      });

      return NextResponse.json({
        correct: isCorrect,
        correctIndex: verified.correctIndex,
        explanation: verified.explanation,
        pointsAwarded: isCorrect ? POINTS_PER_QUESTION : 0,
        sessionPoints: sess.sessionPoints,
        sessionAnswered: sess.sessionAnswered,
        remainingSeconds: Math.max(0, Math.floor((sess.expiresAt - now) / 1000)),
        expiresAt: sess.expiresAt,
        player,
        nextQuestion,
      });
    }

    // 3. SWITCH SUBJECT INSIDE ACTIVE 1-HOUR SESSION
    if (action === 'switch_subject') {
      const sessionId = String(body.sessionId || '');
      const subject = String(body.subject || 'Mathematics').trim();
      const gradeKey = String(body.gradeKey || '').trim();

      const sess = ledger.sessions[sessionId];
      if (!sess || now >= sess.expiresAt) {
        return NextResponse.json(
          {
            expired: true,
            error: '20-minute session ended — logged out automatically.',
          },
          { status: 401 }
        );
      }

      sess.subject = subject;
      if (gradeKey) sess.gradeKey = gradeKey;
      await saveGamingLedger(ledger);

      const nextQuestion = generateNextGameQuestion({
        sessionId,
        subject: sess.subject,
        gradeKey: sess.gradeKey,
      });

      return NextResponse.json({
        active: true,
        subject: sess.subject,
        gradeKey: sess.gradeKey,
        remainingSeconds: Math.max(0, Math.floor((sess.expiresAt - now) / 1000)),
        nextQuestion,
      });
    }

    // 4. REDEEM 1,000 POINTS -> KSh 5 ("5 BOB")
    if (action === 'redeem') {
      const rawPhone = String(body.phone || '');
      const sessionId = String(body.sessionId || '');
      const sess = sessionId ? ledger.sessions[sessionId] : undefined;
      const phone = sess?.phone || normalizeKenyanPhone(rawPhone);

      if (!phone || !ledger.players[phone]) {
        return NextResponse.json(
          { error: 'Player account not found for that phone number.' },
          { status: 404 }
        );
      }

      const player = ledger.players[phone];
      if (player.pointsBalance < REDEEM_POINTS_REQUIRED) {
        return NextResponse.json(
          {
            error: `You need at least ${REDEEM_POINTS_REQUIRED.toLocaleString()} points to redeem KSh ${REDEEM_KES_VALUE}. Current balance: ${player.pointsBalance.toLocaleString()} points.`,
          },
          { status: 400 }
        );
      }

      const blocks = Math.floor(player.pointsBalance / REDEEM_POINTS_REQUIRED);
      const pointsDeducted = blocks * REDEEM_POINTS_REQUIRED;
      const amountKes = blocks * REDEEM_KES_VALUE;

      player.pointsBalance -= pointsDeducted;
      player.totalRedeemedKes += amountKes;
      player.updatedAt = new Date().toISOString();

      const referenceCode = `GMR-${Math.floor(10000 + Math.random() * 90000)}`;
      const redemption = {
        id: `red_${Date.now()}`,
        referenceCode,
        phone,
        playerName: player.playerName,
        pointsDeducted,
        amountKes,
        status: 'PENDING' as const,
        createdAt: new Date().toISOString(),
      };

      ledger.redemptions.unshift(redemption);
      await saveGamingLedger(ledger);

      const localPhone = toLocalKenyanFormat(phone);
      const alertMsg =
        `🏆 *CBC GAMING POINTS REDEMPTION*\n` +
        `• *Claim Ref:* ${referenceCode}\n` +
        `• *Learner:* ${player.playerName} (${localPhone})\n` +
        `• *Points Redeemed:* ${pointsDeducted.toLocaleString()} pts\n` +
        `• *M-Pesa Reward Due:* KSh ${amountKes}\n` +
        `• *Remaining Balance:* ${player.pointsBalance} pts`;

      await sendWhatsAppAdminNotification(alertMsg).catch(() => {});

      const whatsappClaimUrl = `https://wa.me/${COORDINATOR_WHATSAPP_INTL}?text=${encodeURIComponent(
        `Hello Coordinator (${COORDINATOR_WHATSAPP_LOCAL})! I just redeemed ${pointsDeducted.toLocaleString()} CBC Gaming Points (Ref: ${referenceCode}) for KSh ${amountKes} to my M-Pesa number ${localPhone}.`
      )}`;

      return NextResponse.json({
        success: true,
        redemption,
        player,
        whatsappClaimUrl,
      });
    }

    return NextResponse.json({ error: 'Unknown gaming action' }, { status: 400 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Gaming server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const { id } = await req.json();
    const ledger = await getGamingLedger();
    const target = ledger.redemptions.find((r) => r.id === id);
    if (!target) {
      return NextResponse.json({ error: 'Redemption not found' }, { status: 404 });
    }
    target.status = 'PAID';
    await saveGamingLedger(ledger);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to update redemption' }, { status: 500 });
  }
}
