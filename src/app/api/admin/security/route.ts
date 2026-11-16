import { NextRequest, NextResponse } from 'next/server';
import {
  getRequestIp,
  isAdminAuthorized,
  verifyAdminPasswordString,
} from '@/lib/admin-auth';
import {
  appendAuditEvent,
  BACKUP_DESTINATION_EMAIL,
  checkIpLockout,
  computeRollingAuthenticatorCode,
  getSecurityState,
  issueAdmin2faChallenge,
  maskSecurityEmail,
  maskSecurityPhone,
  recordFailedAuthAttempt,
  resolveChallengeByMobileClick,
  saveSecurityState,
  SECURITY_PHONE_PRIMARY,
  SECURITY_PHONE_SECONDARY,
  SECURITY_VERIFICATION_EMAIL,
  signVerified2faSessionToken,
  verifyChallengeByOtp,
  verifySigned2faSessionToken,
} from '@/lib/security';

export async function GET(req: NextRequest) {
  const authorized = isAdminAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const state = await getSecurityState(true);
    const now = Date.now();

    const pendingChallenges = Object.values(state.challenges)
      .filter((c) => c.status === 'PENDING' && c.expiresAt > now)
      .sort((a, b) => b.createdAt - a.createdAt)
      .map((c) => ({
        challengeId: c.challengeId,
        matchNumber: c.matchNumber,
        targetPhone: c.targetPhone,
        targetEmail: c.targetEmail,
        requesterIp: c.requesterIp,
        userAgent: c.userAgent,
        portal: c.portal,
        createdAt: c.createdAt,
        expiresAt: c.expiresAt,
      }));

    const lockedIps = Object.entries(state.ipFailures)
      .filter(([, b]) => b.lockedUntil > now)
      .map(([ip, b]) => ({
        ip,
        count: b.count,
        minutesLeft: Math.ceil((b.lockedUntil - now) / 60_000),
      }));

    const authenticator = computeRollingAuthenticatorCode(now);

    return NextResponse.json({
      require2faOnWebAdmin: state.require2faOnWebAdmin,
      securityPhones: [
        maskSecurityPhone(SECURITY_PHONE_PRIMARY),
        maskSecurityPhone(SECURITY_PHONE_SECONDARY),
      ],
      securityEmail: maskSecurityEmail(SECURITY_VERIFICATION_EMAIL),
      backupEmail: maskSecurityEmail(BACKUP_DESTINATION_EMAIL),
      sessionEpoch: state.sessionEpoch,
      pendingChallenges,
      authenticator,
      lockedIps,
      lastBackupAt: state.lastBackupAt || null,
      lastBackupCloudPath: state.lastBackupCloudPath || null,
      auditLog: state.auditLog.slice(0, 30),
      deliveryStatus: {
        hasResendKey: Boolean(
          (state.deliveryConfig.resendApiKey || process.env.RESEND_API_KEY || '').trim()
        ),
        resendFromEmail:
          state.deliveryConfig.resendFromEmail || 'CBC Security <onboarding@resend.dev>',
        hasAfricasTalkingKey: Boolean(
          (
            state.deliveryConfig.africasTalkingApiKey ||
            process.env.AFRICASTALKING_API_KEY ||
            ''
          ).trim()
        ),
        africasTalkingUsername: state.deliveryConfig.africasTalkingUsername || '',
        customEmailWebhookUrl: state.deliveryConfig.customEmailWebhookUrl || '',
        customSmsWebhookUrl: state.deliveryConfig.customSmsWebhookUrl || '',
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Failed to load security status' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  const ip = getRequestIp(req);
  const userAgent = req.headers.get('user-agent') || 'Browser';
  const adminHeaderAuthorized = isAdminAuthorized(req);

  try {
    const body = (await req.json()) as {
      action?: string;
      password?: string;
      selectedPhone?: string;
      portal?: string;
      challengeId?: string;
      otpCode?: string;
      sessionToken?: string;
      decision?: 'APPROVE' | 'DENY';
      require2faOnWebAdmin?: boolean;
      resendApiKey?: string;
      resendFromEmail?: string;
      africasTalkingApiKey?: string;
      africasTalkingUsername?: string;
      customEmailWebhookUrl?: string;
      customSmsWebhookUrl?: string;
    };

    const action = body.action || '';

    // 1. Validate existing 2FA session token (checks epoch & expiry)
    if (action === 'validate_session') {
      const state = await getSecurityState();
      if (!state.require2faOnWebAdmin) {
        return NextResponse.json({ valid: true, required: false });
      }
      const valid = verifySigned2faSessionToken(
        body.sessionToken || '',
        state.sessionEpoch
      );
      return NextResponse.json({ valid, required: true });
    }

    // 2. Step 1 -> Step 2: Verify admin password & trigger 2-Step Verification
    if (action === 'start_2fa') {
      const state = await getSecurityState();
      const lock = checkIpLockout(state, ip);
      if (lock.locked) {
        return NextResponse.json(
          {
            error: `IP blocked for ${Math.ceil(
              lock.retryAfterSec / 60
            )} mins after repeated failed attempts.`,
          },
          { status: 429 }
        );
      }

      const validPw = verifyAdminPasswordString(body.password || '');
      if (!validPw) {
        const fail = await recordFailedAuthAttempt(
          ip,
          `Wrong admin password on ${body.portal || '/admin'}`
        );
        return NextResponse.json(
          {
            error: fail.locked
              ? 'Too many failed attempts! Your IP is locked for 30 minutes.'
              : `Invalid admin password (${fail.attemptsLeft} attempts left before 30-min IP lockout).`,
          },
          { status: 401 }
        );
      }

      if (!state.require2faOnWebAdmin) {
        const token = signVerified2faSessionToken({
          sessionEpoch: state.sessionEpoch,
          ip,
          method: 'PASSWORD_ONLY',
        });
        return NextResponse.json({
          verifiedImmediately: true,
          sessionToken: token,
        });
      }

      const challenge = await issueAdmin2faChallenge({
        selectedPhone: body.selectedPhone,
        ip,
        userAgent,
        portal: body.portal || '/admin',
      });

      return NextResponse.json(challenge);
    }

    // 3. Verify 6-digit OTP (from 0728595160 / 0705759072, academia.edu55@gmail.com, or Mobile App Authenticator)
    if (action === 'verify_otp') {
      const state = await getSecurityState();
      const lock = checkIpLockout(state, ip);
      if (lock.locked) {
        return NextResponse.json(
          { error: 'IP temporarily locked due to failed security checks.' },
          { status: 429 }
        );
      }

      const result = await verifyChallengeByOtp({
        challengeId: body.challengeId || '',
        otpCode: body.otpCode || '',
        ip,
      });

      if (!result.verified) {
        return NextResponse.json(
          { error: result.error || 'Verification failed' },
          { status: 401 }
        );
      }

      return NextResponse.json({
        verified: true,
        sessionToken: result.sessionToken,
      });
    }

    // 4. Desktop polling for 1-Tap Mobile Click approval
    if (action === 'check_challenge') {
      const state = await getSecurityState(true);
      const ch = state.challenges[body.challengeId || ''];
      if (!ch) {
        return NextResponse.json({ status: 'EXPIRED' });
      }
      if (Date.now() > ch.expiresAt && ch.status === 'PENDING') {
        return NextResponse.json({ status: 'EXPIRED' });
      }
      if (ch.status === 'APPROVED') {
        delete state.challenges[ch.challengeId];
        await saveSecurityState(state);
        const sessionToken = signVerified2faSessionToken({
          sessionEpoch: state.sessionEpoch,
          ip,
          method: 'MOBILE_CLICK',
        });
        return NextResponse.json({
          status: 'APPROVED',
          sessionToken,
        });
      }
      return NextResponse.json({ status: ch.status });
    }

    // --- All actions below require authenticated Admin headers ---
    if (!adminHeaderAuthorized) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 5. Mobile Admin App 1-Tap Approve or Deny ("Mobile Click")
    if (action === 'mobile_click') {
      const decision = body.decision === 'APPROVE' ? 'APPROVE' : 'DENY';
      const res = await resolveChallengeByMobileClick({
        challengeId: body.challengeId || '',
        decision,
        mobileIp: ip,
      });
      return NextResponse.json(res);
    }

    // 6. Panic Button: Revoke all active web sessions immediately
    if (action === 'revoke_sessions') {
      const state = await getSecurityState(true);
      state.sessionEpoch = (state.sessionEpoch || 1) + 1;
      state.challenges = {};
      appendAuditEvent(
        state,
        'SESSIONS_REVOKED',
        ip,
        `All active admin sessions revoked (Epoch #${state.sessionEpoch})`
      );
      await saveSecurityState(state);
      return NextResponse.json({
        ok: true,
        sessionEpoch: state.sessionEpoch,
      });
    }

    // 7. Clear IP lockouts
    if (action === 'unlock_ips') {
      const state = await getSecurityState(true);
      state.ipFailures = {};
      await saveSecurityState(state);
      return NextResponse.json({ ok: true });
    }

    // 8. Save Email / SMS delivery keys & 2FA enforcement toggle
    if (action === 'save_delivery_config') {
      const state = await getSecurityState(true);
      if (typeof body.require2faOnWebAdmin === 'boolean') {
        state.require2faOnWebAdmin = body.require2faOnWebAdmin;
      }
      if (body.resendApiKey !== undefined && body.resendApiKey.trim() !== '') {
        state.deliveryConfig.resendApiKey = body.resendApiKey.trim();
      }
      if (body.resendFromEmail !== undefined) {
        state.deliveryConfig.resendFromEmail = body.resendFromEmail.trim();
      }
      if (
        body.africasTalkingApiKey !== undefined &&
        body.africasTalkingApiKey.trim() !== ''
      ) {
        state.deliveryConfig.africasTalkingApiKey = body.africasTalkingApiKey.trim();
      }
      if (body.africasTalkingUsername !== undefined) {
        state.deliveryConfig.africasTalkingUsername =
          body.africasTalkingUsername.trim();
      }
      if (body.customEmailWebhookUrl !== undefined) {
        state.deliveryConfig.customEmailWebhookUrl =
          body.customEmailWebhookUrl.trim();
      }
      if (body.customSmsWebhookUrl !== undefined) {
        state.deliveryConfig.customSmsWebhookUrl = body.customSmsWebhookUrl.trim();
      }

      await saveSecurityState(state);
      return NextResponse.json({
        ok: true,
        message: 'Security & OTP/Email delivery settings saved!',
      });
    }

    return NextResponse.json({ error: 'Unknown security action' }, { status: 400 });
  } catch {
    return NextResponse.json(
      { error: 'Security operation failed' },
      { status: 500 }
    );
  }
}
