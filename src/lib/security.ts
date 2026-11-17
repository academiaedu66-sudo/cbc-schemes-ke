import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabase';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';

const BUCKET_NAME = 'cbc-materials';
const SECURITY_STATE_PATH = '_system/security-state.json';

export const SECURITY_PHONE_PRIMARY = '0728595160';
export const SECURITY_PHONE_PRIMARY_INTL = '254728595160';
export const SECURITY_PHONE_SECONDARY = '0705759072';
export const SECURITY_PHONE_SECONDARY_INTL = '254705759072';
export const SECURITY_VERIFICATION_EMAIL = 'academia.edu55@gmail.com';
export const BACKUP_DESTINATION_EMAIL = 'academia.edu55@gmail.com';

export function maskSecurityPhone(phone: string): string {
  const clean = (phone || '').trim();
  if (clean.length < 7) return '***';
  return `${clean.slice(0, 4)}***${clean.slice(-3)}`;
}

export function maskSecurityEmail(email: string): string {
  const clean = (email || '').trim();
  const [local, domain] = clean.split('@');
  if (!local || !domain) return '***@***';
  if (local.length <= 4) return `${local[0]}***@${domain}`;
  return `${local.slice(0, 3)}*******${local.slice(-2)}@${domain}`;
}

export interface SecurityChallenge {
  challengeId: string;
  otpHash: string;
  matchNumber: number; // 2-digit number shown on desktop & mobile click prompt
  targetPhone: string; // '0728595160' | '0705759072'
  targetEmail: string; // 'academia.edu55@gmail.com'
  requesterIp: string;
  userAgent: string;
  portal: string; // '/admin' | '/monetization'
  status: 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED';
  createdAt: number;
  expiresAt: number;
  attempts: number;
}

export interface SecurityAuditEvent {
  id: string;
  timestamp: string;
  event:
    | 'LOGIN_CHALLENGE'
    | '2FA_APPROVED_OTP'
    | '2FA_APPROVED_MOBILE_CLICK'
    | '2FA_BLOCKED_INTRUDER'
    | 'FAILED_AUTH'
    | 'IP_LOCKED_OUT'
    | 'BACKUP_EXPORTED'
    | 'SESSIONS_REVOKED';
  ip: string;
  detail: string;
}

export interface IpFailureBucket {
  count: number;
  firstFailedAt: number;
  lockedUntil: number;
}

export interface DeliveryChannelConfig {
  resendApiKey?: string; // Free 3,000 emails/mo at resend.com -> emails academia.edu55@gmail.com
  resendFromEmail?: string; // defaults to onboarding@resend.dev
  africasTalkingApiKey?: string; // Optional SMS OTP to 0728595160 / 0705759072
  africasTalkingUsername?: string;
  customEmailWebhookUrl?: string;
  customSmsWebhookUrl?: string;
}

export interface SecurityState {
  require2faOnWebAdmin: boolean;
  securityPhones: [string, string];
  securityEmail: string;
  backupEmail: string;
  sessionEpoch: number; // Incrementing revokes all existing tokens immediately
  challenges: Record<string, SecurityChallenge>;
  ipFailures: Record<string, IpFailureBucket>;
  auditLog: SecurityAuditEvent[];
  deliveryConfig: DeliveryChannelConfig;
  lastBackupAt?: string;
  lastBackupCloudPath?: string;
  updatedAt: string;
}

function getSecuritySecret(): string {
  return (
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.ADMIN_PASSWORD ||
    'cbc-security-vault-2026'
  );
}

function hashOtp(otp: string, challengeId: string): string {
  return crypto
    .createHmac('sha256', getSecuritySecret())
    .update(`${challengeId}:${otp.trim()}`)
    .digest('hex');
}

export function computeRollingAuthenticatorCode(timestampMs = Date.now()): {
  code: string;
  secondsRemaining: number;
} {
  const windowIndex = Math.floor(timestampMs / 60_000);
  const digest = crypto
    .createHmac('sha256', getSecuritySecret())
    .update(`totp_v1:${windowIndex}`)
    .digest();
  const num = digest.readUInt32BE(0) % 1_000_000;
  const code = String(num).padStart(6, '0');
  const secondsRemaining = 60 - Math.floor((timestampMs % 60_000) / 1000);
  return { code, secondsRemaining };
}

function verifyRollingAuthenticatorCode(inputCode: string): boolean {
  const clean = inputCode.trim();
  if (!/^\d{6}$/.test(clean)) return false;
  const now = Date.now();
  // Accept current 60s window and previous 60s window to prevent clock-skew friction
  const curr = computeRollingAuthenticatorCode(now).code;
  const prev = computeRollingAuthenticatorCode(now - 60_000).code;
  return clean === curr || clean === prev;
}

export function signVerified2faSessionToken(params: {
  sessionEpoch: number;
  ip: string;
  method: string;
}): string {
  const payload = JSON.stringify({
    ep: params.sessionEpoch,
    ip: params.ip,
    m: params.method,
    exp: Date.now() + 12 * 60 * 60 * 1000, // 12-hour verified admin session
  });
  const b64 = Buffer.from(payload, 'utf-8').toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSecuritySecret())
    .update(`2fa_session:${b64}`)
    .digest('base64url');
  return `${b64}.${sig}`;
}

export function verifySigned2faSessionToken(
  token: string,
  expectedEpoch: number
): boolean {
  try {
    const [b64, sig] = String(token || '').split('.');
    if (!b64 || !sig) return false;
    const expectedSig = crypto
      .createHmac('sha256', getSecuritySecret())
      .update(`2fa_session:${b64}`)
      .digest('base64url');
    if (sig !== expectedSig) return false;
    const parsed = JSON.parse(Buffer.from(b64, 'base64url').toString('utf-8')) as {
      ep: number;
      exp: number;
    };
    if (parsed.ep !== expectedEpoch) return false;
    if (Date.now() > parsed.exp) return false;
    return true;
  } catch {
    return false;
  }
}

export function getDefaultSecurityState(): SecurityState {
  return {
    require2faOnWebAdmin: true,
    securityPhones: [SECURITY_PHONE_PRIMARY, SECURITY_PHONE_SECONDARY],
    securityEmail: SECURITY_VERIFICATION_EMAIL,
    backupEmail: BACKUP_DESTINATION_EMAIL,
    sessionEpoch: 1,
    challenges: {},
    ipFailures: {},
    auditLog: [],
    deliveryConfig: {
      resendApiKey: (process.env.RESEND_API_KEY || '').trim(),
      resendFromEmail:
        (process.env.RESEND_FROM_EMAIL || '').trim() ||
        'CBC Security <onboarding@resend.dev>',
      africasTalkingApiKey: (process.env.AFRICASTALKING_API_KEY || '').trim(),
      africasTalkingUsername: (process.env.AFRICASTALKING_USERNAME || '').trim(),
      customEmailWebhookUrl: (process.env.EMAIL_WEBHOOK_URL || '').trim(),
      customSmsWebhookUrl: (process.env.SMS_OTP_WEBHOOK_URL || '').trim(),
    },
    updatedAt: new Date().toISOString(),
  };
}

let cachedSecurityState: { data: SecurityState; loadedAt: number } | null = null;

export async function getSecurityState(forceFresh = false): Promise<SecurityState> {
  if (
    !forceFresh &&
    cachedSecurityState &&
    Date.now() - cachedSecurityState.loadedAt < 5000
  ) {
    return cachedSecurityState.data;
  }

  const defaults = getDefaultSecurityState();
  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(SECURITY_STATE_PATH);

    if (error || !data) {
      cachedSecurityState = { data: defaults, loadedAt: Date.now() };
      return defaults;
    }

    const parsed = JSON.parse(await data.text()) as Partial<SecurityState>;
    const merged: SecurityState = {
      ...defaults,
      ...parsed,
      securityPhones: [SECURITY_PHONE_PRIMARY, SECURITY_PHONE_SECONDARY],
      securityEmail: SECURITY_VERIFICATION_EMAIL,
      backupEmail: BACKUP_DESTINATION_EMAIL,
      deliveryConfig: {
        ...defaults.deliveryConfig,
        ...(parsed.deliveryConfig || {}),
      },
      challenges: parsed.challenges || {},
      ipFailures: parsed.ipFailures || {},
      auditLog: Array.isArray(parsed.auditLog) ? parsed.auditLog : [],
    };
    cachedSecurityState = { data: merged, loadedAt: Date.now() };
    return merged;
  } catch {
    return defaults;
  }
}

export async function saveSecurityState(state: SecurityState): Promise<void> {
  const now = Date.now();
  // Prune expired challenges older than 30 minutes
  for (const [cid, ch] of Object.entries(state.challenges)) {
    if (now - ch.createdAt > 30 * 60 * 1000) {
      delete state.challenges[cid];
    }
  }
  // Keep latest 80 audit log events
  if (state.auditLog.length > 80) {
    state.auditLog = state.auditLog.slice(0, 80);
  }

  state.updatedAt = new Date().toISOString();
  cachedSecurityState = { data: state, loadedAt: now };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(
      SECURITY_STATE_PATH,
      Buffer.from(JSON.stringify(state, null, 2), 'utf-8'),
      {
        contentType: 'application/json',
        upsert: true,
      }
    );
}

export function appendAuditEvent(
  state: SecurityState,
  event: SecurityAuditEvent['event'],
  ip: string,
  detail: string
) {
  state.auditLog.unshift({
    id: `sec_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    event,
    ip,
    detail,
  });
}

export function checkIpLockout(
  state: SecurityState,
  ip: string
): { locked: boolean; retryAfterSec: number } {
  const rec = state.ipFailures[ip];
  if (!rec) return { locked: false, retryAfterSec: 0 };
  const now = Date.now();
  if (rec.lockedUntil > now) {
    return {
      locked: true,
      retryAfterSec: Math.ceil((rec.lockedUntil - now) / 1000),
    };
  }
  return { locked: false, retryAfterSec: 0 };
}

export async function recordFailedAuthAttempt(
  ip: string,
  reason: string
): Promise<{ locked: boolean; attemptsLeft: number }> {
  const state = await getSecurityState(true);
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const lockDurationMs = 30 * 60 * 1000;

  let bucket = state.ipFailures[ip];
  if (!bucket || now - bucket.firstFailedAt > windowMs) {
    bucket = { count: 1, firstFailedAt: now, lockedUntil: 0 };
  } else {
    bucket.count += 1;
  }

  let locked = false;
  if (bucket.count >= 5) {
    bucket.lockedUntil = now + lockDurationMs;
    locked = true;
    appendAuditEvent(
      state,
      'IP_LOCKED_OUT',
      ip,
      `Blocked IP for 30 mins after ${bucket.count} failed attempts (${reason})`
    );
  } else {
    appendAuditEvent(state, 'FAILED_AUTH', ip, reason);
  }

  state.ipFailures[ip] = bucket;
  await saveSecurityState(state);

  return {
    locked,
    attemptsLeft: Math.max(0, 5 - bucket.count),
  };
}

export async function sendSecurityEmailMessage(params: {
  toEmail: string;
  subject: string;
  html: string;
  text: string;
  config: DeliveryChannelConfig;
}): Promise<{ sent: boolean; channel: string }> {
  const resendKey = (
    params.config.resendApiKey ||
    process.env.RESEND_API_KEY ||
    ''
  ).trim();

  if (resendKey) {
    try {
      const fromAddr =
        params.config.resendFromEmail || 'CBC Security <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [params.toEmail],
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        cache: 'no-store',
      });
      if (res.ok) {
        return { sent: true, channel: 'Resend Email API' };
      }
    } catch {
      // Try webhook fallback
    }
  }

  const webhook = (
    params.config.customEmailWebhookUrl ||
    process.env.EMAIL_WEBHOOK_URL ||
    ''
  ).trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: params.toEmail,
          subject: params.subject,
          html: params.html,
          text: params.text,
        }),
        cache: 'no-store',
      });
      if (res.ok) {
        return { sent: true, channel: 'Email Webhook' };
      }
    } catch {}
  }

  return { sent: false, channel: 'Mobile App Authenticator Active' };
}

export async function sendSecurityPhoneOtp(params: {
  localPhone: string; // '0728595160' | '0705759072'
  message: string;
  config: DeliveryChannelConfig;
}): Promise<{ sent: boolean; channel: string }> {
  const cleanDigits = params.localPhone.replace(/\D/g, '');
  const intl = cleanDigits.startsWith('0')
    ? `+254${cleanDigits.slice(1)}`
    : `+${cleanDigits}`;

  // 1. Africa's Talking SMS (if configured)
  const atKey = (
    params.config.africasTalkingApiKey ||
    process.env.AFRICASTALKING_API_KEY ||
    ''
  ).trim();
  const atUser = (
    params.config.africasTalkingUsername ||
    process.env.AFRICASTALKING_USERNAME ||
    ''
  ).trim();

  if (atKey && atUser) {
    try {
      const body = new URLSearchParams({
        username: atUser,
        to: intl,
        message: params.message,
      });
      const res = await fetch(
        'https://api.africastalking.com/version1/messaging',
        {
          method: 'POST',
          headers: {
            apiKey: atKey,
            Accept: 'application/json',
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: body.toString(),
          cache: 'no-store',
        }
      );
      if (res.ok) return { sent: true, channel: "Africa's Talking SMS" };
    } catch {}
  }

  // 2. Custom SMS Webhook (if configured)
  const smsWebhook = (
    params.config.customSmsWebhookUrl ||
    process.env.SMS_OTP_WEBHOOK_URL ||
    ''
  ).trim();
  if (smsWebhook) {
    try {
      const res = await fetch(smsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: intl,
          localPhone: params.localPhone,
          message: params.message,
        }),
        cache: 'no-store',
      });
      if (res.ok) return { sent: true, channel: 'SMS Webhook' };
    } catch {}
  }

  // 3. WhatsApp Bot / CallMeBot / Cloud API notification to 0705759072
  const waSent = await sendWhatsAppAdminNotification(params.message).catch(
    () => false
  );
  if (waSent) {
    return { sent: true, channel: 'WhatsApp Security Alert' };
  }

  return { sent: false, channel: 'Mobile App Live Prompt & OTP Active' };
}

export async function issueAdmin2faChallenge(params: {
  selectedPhone?: string;
  ip: string;
  userAgent: string;
  portal: string;
}): Promise<{
  challengeId: string;
  matchNumber: number;
  targetPhone: string;
  targetEmail: string;
  phoneDispatched: boolean;
  emailDispatched: boolean;
  expiresAt: number;
}> {
  const state = await getSecurityState(true);
  const chosenPhone =
    params.selectedPhone === 'SECONDARY' ||
    params.selectedPhone === SECURITY_PHONE_SECONDARY ||
    params.selectedPhone === maskSecurityPhone(SECURITY_PHONE_SECONDARY)
      ? SECURITY_PHONE_SECONDARY
      : SECURITY_PHONE_PRIMARY;

  const maskedPhone = maskSecurityPhone(chosenPhone);
  const maskedEmail = maskSecurityEmail(SECURITY_VERIFICATION_EMAIL);

  const challengeId = `ch_${crypto.randomBytes(12).toString('hex')}`;
  const rawOtp = String(crypto.randomInt(100000, 999999));
  const matchNumber = crypto.randomInt(11, 99);
  const now = Date.now();
  const expiresAt = now + 10 * 60 * 1000;

  state.challenges[challengeId] = {
    challengeId,
    otpHash: hashOtp(rawOtp, challengeId),
    matchNumber,
    targetPhone: maskedPhone,
    targetEmail: maskedEmail,
    requesterIp: params.ip,
    userAgent: (params.userAgent || 'Browser').slice(0, 120),
    portal: params.portal || '/admin',
    status: 'PENDING',
    createdAt: now,
    expiresAt,
    attempts: 0,
  };

  appendAuditEvent(
    state,
    'LOGIN_CHALLENGE',
    params.ip,
    `2-Step Verification initiated for ${params.portal} (Match #${matchNumber}, Phone ${maskedPhone}, Email ${maskedEmail})`
  );

  await saveSecurityState(state);

  const otpText =
    `🔐 CBC Hub Security 2-Step Verification\n` +
    `• One-Time Code (OTP): ${rawOtp}\n` +
    `• Mobile Click Match #: ${matchNumber}\n` +
    `• Portal: ${params.portal} (IP: ${params.ip})\n` +
    `If this wasn't you, open your CBC Admin Mobile App and tap BLOCK INTRUDER immediately.`;

  const [phoneDelivery, emailDelivery] = await Promise.all([
    sendSecurityPhoneOtp({
      localPhone: chosenPhone,
      message: otpText,
      config: state.deliveryConfig,
    }),
    sendSecurityEmailMessage({
      toEmail: SECURITY_VERIFICATION_EMAIL,
      subject: `[CBC Security] Your 2-Step Verification Code: ${rawOtp} (Match #${matchNumber})`,
      text: otpText,
      html: `<div style="font-family:Arial,sans-serif;max-width:520px;padding:20px;border:1px solid #e2e8f0;border-radius:12px;">
        <h2 style="margin:0 0 10px;color:#064e3b;">CBC Hub Backend 2-Step Verification</h2>
        <p style="font-size:14px;color:#334155;">A sign-in attempt was made to <strong>${params.portal}</strong> from IP <code>${params.ip}</code>.</p>
        <div style="background:#f8fafc;border:1px solid #cbd5e1;padding:16px;border-radius:10px;text-align:center;margin:16px 0;">
          <div style="font-size:11px;text-transform:uppercase;color:#64748b;font-weight:bold;">6-Digit Security OTP</div>
          <div style="font-size:32px;font-weight:900;letter-spacing:6px;color:#0f172a;margin-top:4px;">${rawOtp}</div>
          <div style="font-size:12px;color:#059669;margin-top:8px;">Or tap <strong>Approve #${matchNumber}</strong> inside your CBC Admin Mobile App</div>
        </div>
        <p style="font-size:12px;color:#dc2626;">If you did not initiate this sign-in, tap <strong>Block Hacker</strong> in your Mobile Admin App immediately.</p>
      </div>`,
      config: state.deliveryConfig,
    }),
  ]);

  return {
    challengeId,
    matchNumber,
    targetPhone: maskedPhone,
    targetEmail: maskedEmail,
    phoneDispatched: phoneDelivery.sent,
    emailDispatched: emailDelivery.sent,
    expiresAt,
  };
}

export async function verifyChallengeByOtp(params: {
  challengeId: string;
  otpCode: string;
  ip: string;
}): Promise<{
  verified: boolean;
  sessionToken?: string;
  error?: string;
}> {
  const state = await getSecurityState(true);
  const ch = state.challenges[params.challengeId];
  const now = Date.now();

  if (!ch || now > ch.expiresAt || ch.status === 'EXPIRED') {
    return { verified: false, error: 'Verification challenge expired. Request a new code.' };
  }
  if (ch.status === 'DENIED') {
    return {
      verified: false,
      error: 'This sign-in was blocked by Mobile Click security!',
    };
  }
  if (ch.attempts >= 5) {
    ch.status = 'EXPIRED';
    await saveSecurityState(state);
    return { verified: false, error: 'Too many wrong OTP guesses. Request a new code.' };
  }

  const candidateHash = hashOtp(params.otpCode, ch.challengeId);
  const matchesChallengeOtp = candidateHash === ch.otpHash;
  const matchesMobileAuthenticator = verifyRollingAuthenticatorCode(params.otpCode);

  if (!matchesChallengeOtp && !matchesMobileAuthenticator) {
    ch.attempts += 1;
    await saveSecurityState(state);
    await recordFailedAuthAttempt(params.ip, 'Invalid 2FA OTP code');
    return {
      verified: false,
      error: `Incorrect 6-digit code (${5 - ch.attempts} attempts left).`,
    };
  }

  ch.status = 'APPROVED';
  appendAuditEvent(
    state,
    '2FA_APPROVED_OTP',
    params.ip,
    `Admin 2FA verified via ${
      matchesMobileAuthenticator ? 'Mobile Authenticator OTP' : 'Sent OTP'
    } for ${ch.portal}`
  );
  await saveSecurityState(state);

  const sessionToken = signVerified2faSessionToken({
    sessionEpoch: state.sessionEpoch,
    ip: params.ip,
    method: 'OTP',
  });

  return { verified: true, sessionToken };
}

export async function resolveChallengeByMobileClick(params: {
  challengeId: string;
  decision: 'APPROVE' | 'DENY';
  mobileIp: string;
}): Promise<{ ok: boolean; status: string }> {
  const state = await getSecurityState(true);
  const ch = state.challenges[params.challengeId];
  if (!ch) {
    return { ok: false, status: 'NOT_FOUND' };
  }

  if (params.decision === 'APPROVE') {
    ch.status = 'APPROVED';
    appendAuditEvent(
      state,
      '2FA_APPROVED_MOBILE_CLICK',
      params.mobileIp,
      `Approved sign-in #${ch.matchNumber} (${ch.portal}, requester IP ${ch.requesterIp}) via Mobile Click`
    );
  } else {
    ch.status = 'DENIED';
    // Lock out external intruder IP (never lock out the owner's own mobile device IP!)
    if (ch.requesterIp && ch.requesterIp !== params.mobileIp) {
      state.ipFailures[ch.requesterIp] = {
        count: 10,
        firstFailedAt: Date.now(),
        lockedUntil: Date.now() + 60 * 60 * 1000, // 1-hour immediate hacker block
      };
      appendAuditEvent(
        state,
        '2FA_BLOCKED_INTRUDER',
        ch.requesterIp,
        `BLOCKED intruder IP ${ch.requesterIp} for 1 hour via Mobile Click Deny (#${ch.matchNumber})`
      );
    } else {
      appendAuditEvent(
        state,
        '2FA_BLOCKED_INTRUDER',
        ch.requesterIp,
        `Denied sign-in #${ch.matchNumber} via Mobile Click (kept owner device IP unlocked)`
      );
    }
  }

  await saveSecurityState(state);
  return { ok: true, status: ch.status };
}

export interface FullWebsiteBackupBundle {
  generatedAt: string;
  siteUrl: string;
  securityContacts: {
    otpPhones: string[];
    twoFactorEmail: string;
    backupEmail: string;
  };
  counts: {
    resourcesCount: number;
    ordersCount: number;
    tuitionRegistrationsCount: number;
    gamingPlayersCount: number;
    storageFilesCount: number;
  };
  database: {
    resources: unknown[];
    orders: unknown[];
  };
  systemConfigs: Record<string, unknown>;
  storageFilesManifest: Array<{ name: string; updated_at?: string }>;
}

export async function compileFullWebsiteBackup(): Promise<{
  bundle: FullWebsiteBackupBundle;
  cloudSnapshotPath: string;
  signedDownloadUrl: string | null;
}> {
  // 1. Export all resources (paginated across >3,400 rows)
  const allResources: unknown[] = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('resources')
      .select('*')
      .order('grade', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error || !data || data.length === 0) break;
    allResources.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }

  // 2. Export all M-Pesa orders
  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  // 3. Export _system JSON configs (redacting raw gateway secret keys in exported JSON if needed, while keeping full operational data)
  const systemPaths = [
    '_system/monetization-config.json',
    '_system/monetization-stats.json',
    '_system/tuition-registrations.json',
    '_system/gaming-ledger.json',
    '_system/homework-qa-ledger.json',
    '_system/purchase-attempts.json',
    '_system/wallet-ledger.json',
  ];
  const systemConfigs: Record<string, unknown> = {};

  for (const p of systemPaths) {
    try {
      const { data } = await supabaseAdmin.storage.from(BUCKET_NAME).download(p);
      if (data) {
        systemConfigs[p] = JSON.parse(await data.text());
      }
    } catch {}
  }

  // 4. Storage manifest
  const storageFilesManifest: Array<{ name: string; updated_at?: string }> = [];
  let offset = 0;
  while (true) {
    const { data } = await supabaseAdmin.storage.from(BUCKET_NAME).list('', {
      limit: 1000,
      offset,
    });
    if (!data || data.length === 0) break;
    for (const f of data) {
      storageFilesManifest.push({
        name: f.name,
        updated_at: f.updated_at || undefined,
      });
    }
    if (data.length < 1000) break;
    offset += 1000;
  }

  const tuitionList = Array.isArray(
    systemConfigs['_system/tuition-registrations.json']
  )
    ? (systemConfigs['_system/tuition-registrations.json'] as unknown[])
    : [];
  const gamingObj = (systemConfigs['_system/gaming-ledger.json'] || {}) as {
    players?: Record<string, unknown>;
  };

  const generatedAt = new Date().toISOString();
  const bundle: FullWebsiteBackupBundle = {
    generatedAt,
    siteUrl: 'https://cbcmaterials.shop',
    securityContacts: {
      otpPhones: [SECURITY_PHONE_PRIMARY, SECURITY_PHONE_SECONDARY],
      twoFactorEmail: SECURITY_VERIFICATION_EMAIL,
      backupEmail: BACKUP_DESTINATION_EMAIL,
    },
    counts: {
      resourcesCount: allResources.length,
      ordersCount: (allOrders || []).length,
      tuitionRegistrationsCount: tuitionList.length,
      gamingPlayersCount: Object.keys(gamingObj.players || {}).length,
      storageFilesCount: storageFilesManifest.length,
    },
    database: {
      resources: allResources,
      orders: allOrders || [],
    },
    systemConfigs,
    storageFilesManifest,
  };

  const stamp = generatedAt.replace(/[:.]/g, '-');
  const cloudSnapshotPath = `_system/backups/cbc-website-backup-${stamp}.json`;
  const latestAutoPath = `_system/backups/cbc-auto-backup-latest.json`;
  const jsonBytes = Buffer.from(JSON.stringify(bundle, null, 2), 'utf-8');

  await Promise.all([
    supabaseAdmin.storage.from(BUCKET_NAME).upload(cloudSnapshotPath, jsonBytes, {
      contentType: 'application/json',
      upsert: true,
    }),
    supabaseAdmin.storage.from(BUCKET_NAME).upload(latestAutoPath, jsonBytes, {
      contentType: 'application/json',
      upsert: true,
    }),
  ]);

  const { data: signed } = await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .createSignedUrl(cloudSnapshotPath, 7 * 24 * 3600, { download: true });

  const secState = await getSecurityState(true);
  secState.lastBackupAt = generatedAt;
  secState.lastBackupCloudPath = cloudSnapshotPath;
  appendAuditEvent(
    secState,
    'BACKUP_EXPORTED',
    'auto-vault',
    `Full website backup saved (${allResources.length} resources, ${(allOrders || []).length} orders)`
  );
  await saveSecurityState(secState);

  return {
    bundle,
    cloudSnapshotPath,
    signedDownloadUrl: signed?.signedUrl || null,
  };
}

let lastAutoBackupStartedAt = 0;

/**
 * Automatically backs up all live website data into Supabase Cloud Vault
 * (and emails academia.edu55@gmail.com when email API key is configured)
 * whenever new materials, orders, tuition leads, gaming data, or Gemini Q&A
 * records are added to the website.
 */
export async function triggerAutomaticBackup(reason: string): Promise<void> {
  const now = Date.now();
  // Coalesce rapid consecutive writes within 45 seconds
  if (now - lastAutoBackupStartedAt < 45_000) {
    return;
  }
  lastAutoBackupStartedAt = now;

  try {
    const [{ bundle, signedDownloadUrl, cloudSnapshotPath }, secState] =
      await Promise.all([compileFullWebsiteBackup(), getSecurityState()]);

    const hasEmailChannel = Boolean(
      (
        secState.deliveryConfig.resendApiKey ||
        process.env.RESEND_API_KEY ||
        secState.deliveryConfig.customEmailWebhookUrl ||
        process.env.EMAIL_WEBHOOK_URL ||
        ''
      ).trim()
    );

    if (hasEmailChannel) {
      const text =
        `Automatic Website Backup Triggered (${reason})\n` +
        `• Materials: ${bundle.counts.resourcesCount}\n` +
        `• Orders: ${bundle.counts.ordersCount}\n` +
        (signedDownloadUrl
          ? `Download Link: ${signedDownloadUrl}`
          : `Vault Path: ${cloudSnapshotPath}`);

      await sendSecurityEmailMessage({
        toEmail: BACKUP_DESTINATION_EMAIL,
        subject: `[CBC Auto-Backup] Website Updated: ${reason}`,
        text,
        html: `<p><strong>Automatic Website Backup Completed</strong> (${reason})</p><p>Materials: <strong>${bundle.counts.resourcesCount}</strong> • Orders: <strong>${bundle.counts.ordersCount}</strong></p>${
          signedDownloadUrl
            ? `<p><a href="${signedDownloadUrl}">Download Updated Backup Snapshot</a></p>`
            : ''
        }`,
        config: secState.deliveryConfig,
      }).catch(() => {});
    }
  } catch {
    // Never fail primary user request if background auto-backup encounters a transient network hiccup
  }
}
