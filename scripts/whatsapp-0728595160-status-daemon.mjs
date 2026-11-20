/**
 * Direct Linked-Device WhatsApp Status Daemon for 0728595160 (254728595160)
 *
 * Links your WhatsApp (0728595160) via an 8-digit WhatsApp Pairing Code (no QR camera needed!)
 * and automatically posts every hourly website button's:
 *   1. Auto-Generated Full-HD Poster Image (1080x1920) + Clickable Website Link Caption
 *   2. Soft 5-Star Lounge Song Audio Story
 * straight onto your WhatsApp Status (`status@broadcast`) every 1 hour daily!
 *
 * One-time setup & run:
 *   npm install --no-save @whiskeysockets/baileys pino
 *   node --env-file=.env.local scripts/whatsapp-0728595160-status-daemon.mjs
 */

import fs from 'node:fs';
import path from 'node:path';

const TARGET_PHONE = '254728595160';
const SITE_ORIGIN = process.env.NEXT_PUBLIC_APP_URL || 'https://www.cbcmaterials.shop';
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();
const AUTH_DIR = path.resolve(process.cwd(), '.whatsapp-status-auth-0728595160');

async function main() {
  let baileys;
  try {
    baileys = await import('@whiskeysockets/baileys');
  } catch {
    console.log(
      'Installing @whiskeysockets/baileys first: run `npm install --no-save @whiskeysockets/baileys pino` then re-run this script.'
    );
    process.exit(1);
  }

  const {
    default: makeWASocket,
    useMultiFileAuthState,
    DisconnectReason,
    fetchLatestBaileysVersion,
  } = baileys;

  fs.mkdirSync(AUTH_DIR, { recursive: true });
  const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: state,
    printQRInTerminal: false,
  });

  sock.ev.on('creds.update', saveCreds);

  if (!sock.authState.creds.registered) {
    setTimeout(async () => {
      try {
        const code = await sock.requestPairingCode(TARGET_PHONE);
        console.log('\n=======================================================');
        console.log(`WHATSAPP 0728595160 8-DIGIT PAIRING CODE:  ${code}`);
        console.log('Open WhatsApp on 0728595160 -> Linked Devices -> Link with phone number instead -> Enter code above!');
        console.log('=======================================================\n');
      } catch (err) {
        console.error('Pairing code request error:', err.message);
      }
    }, 3000);
  }

  sock.ev.on('connection.update', (update) => {
    const { connection, lastDisconnect } = update;
    if (connection === 'open') {
      console.log('✅ Connected to WhatsApp +254728595160! Hourly Status Auto-Poster + Paid-Ads Customer Auto-Reply are LIVE.');
      void pollAndPublishStatusQueue(sock);
      setInterval(() => void pollAndPublishStatusQueue(sock), 5 * 60 * 1000);
    } else if (connection === 'close') {
      const statusCode = lastDisconnect?.error?.output?.statusCode;
      if (statusCode !== DisconnectReason.loggedOut) {
        console.log('Reconnecting to WhatsApp +254728595160...');
        setTimeout(() => void main(), 5000);
      }
    }
  });

  // Automatically reply to incoming Paid-Ads customer messages on +254728595160 with website redirect link!
  sock.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !Array.isArray(messages)) return;
    for (const msg of messages) {
      try {
        const remoteJid = msg?.key?.remoteJid || '';
        if (
          !remoteJid ||
          msg?.key?.fromMe ||
          remoteJid === 'status@broadcast' ||
          remoteJid.endsWith('@g.us') ||
          remoteJid.endsWith('@newsletter')
        ) {
          continue;
        }

        const m = msg.message || {};
        const incomingText =
          m.conversation ||
          m?.extendedTextMessage?.text ||
          m?.buttonsResponseMessage?.selectedDisplayText ||
          m?.listResponseMessage?.title ||
          '';
        if (!incomingText) continue;

        const adReplyInfo =
          m?.extendedTextMessage?.contextInfo?.externalAdReply || null;

        const apiRes = await fetch(`${SITE_ORIGIN}/api/social/whatsapp-autoreply`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'daemon_incoming',
            daemonKey: ADMIN_PASSWORD,
            senderPhone: remoteJid,
            senderName: msg.pushName || '',
            incomingMessage: incomingText,
            referralHeadline: adReplyInfo?.title || '',
            isPaidAdReferral: Boolean(adReplyInfo),
          }),
        });
        if (!apiRes.ok) continue;
        const payload = await apiRes.json();
        if (payload?.replied && payload?.replyText) {
          await sock.sendMessage(remoteJid, {
            text: payload.replyText,
          });
          console.log(
            `💬 Auto-replied on +254728595160 to ${remoteJid} -> ${payload.primaryRedirectUrl}`
          );
        }
      } catch (err) {
        console.warn('Incoming message auto-reply warning:', err.message);
      }
    }
  });
}

async function pollAndPublishStatusQueue(sock) {
  try {
    // Also trigger hourly rotation check on the website
    await fetch(`${SITE_ORIGIN}/api/social/whatsapp-status-autopost?cron=hourly`).catch(
      () => {}
    );

    const res = await fetch(
      `${SITE_ORIGIN}/api/social/whatsapp-status-autopost?daemonKey=${encodeURIComponent(
        ADMIN_PASSWORD
      )}`
    );
    if (!res.ok) return;
    const data = await res.json();
    const queue = Array.isArray(data?.pendingDaemonQueue) ? data.pendingDaemonQueue : [];
    if (queue.length === 0) return;

    // Collect contact JIDs stored in session for statusJidList broadcast
    const item = queue[0];
    console.log(`Posting Button #${item.orderIndex} (${item.buttonLabel}) to Status...`);

    const imgBuf = Buffer.from(
      await (await fetch(item.posterImageUrl)).arrayBuffer()
    );
    await sock.sendMessage('status@broadcast', {
      image: imgBuf,
      caption: item.statusCaption,
    });

    const songBuf = Buffer.from(
      await (await fetch(item.softSongUrl)).arrayBuffer()
    );
    await sock.sendMessage('status@broadcast', {
      audio: songBuf,
      mimetype: 'audio/mp4',
      ptt: false,
    });

    await fetch(`${SITE_ORIGIN}/api/social/whatsapp-status-autopost`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'ack_daemon',
        daemonKey: ADMIN_PASSWORD,
        buttonId: item.buttonId,
      }),
    });
    console.log(`✅ Posted ${item.buttonLabel} + Soft Song to 0728595160 Status!`);
  } catch (err) {
    console.warn('Status queue poll warning:', err.message);
  }
}

main().catch(console.error);
