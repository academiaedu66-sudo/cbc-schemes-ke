import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';
import { normalizeKenyanPhone, toLocalKenyanFormat } from '@/lib/mpesa';
import { triggerAutomaticBackup } from '@/lib/security';

const BUCKET_NAME = 'cbc-materials';
const BULK_CONTACTS_PATH = '_system/admin-bulk-contacts.json';
const BULK_CONFIG_PATH = '_system/bulk-messaging-config.json';

export interface BulkContactRecord {
  id: string;
  name: string;
  phoneIntl: string;
  phoneLocal: string;
  label: string;
  addedAt: string;
  lastMessagedAt?: string;
}

export interface BulkMessagingConfig {
  whapiToken?: string;
  metaAccessToken?: string;
  metaPhoneNumberId?: string;
  whatsappWebhookUrl?: string;
  atUsername?: string;
  atApiKey?: string;
  twilioSid?: string;
  twilioToken?: string;
  twilioFrom?: string;
  smsWebhookUrl?: string;
  updatedAt?: string;
}

async function readMessagingConfig(): Promise<BulkMessagingConfig> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(BULK_CONFIG_PATH);
    if (error || !data) return {};
    return JSON.parse(await data.text()) as BulkMessagingConfig;
  } catch {
    return {};
  }
}

async function writeMessagingConfig(cfg: BulkMessagingConfig): Promise<void> {
  const bytes = Buffer.from(JSON.stringify({ ...cfg, updatedAt: new Date().toISOString() }, null, 2), 'utf-8');
  await supabaseAdmin.storage.from(BUCKET_NAME).upload(BULK_CONFIG_PATH, bytes, {
    contentType: 'application/json',
    upsert: true,
  });
}

async function readContacts(): Promise<BulkContactRecord[]> {
  try {
    const { data, error } = await supabaseAdmin.storage.from(BUCKET_NAME).download(BULK_CONTACTS_PATH);
    if (error || !data) return [];
    const parsed = JSON.parse(await data.text());
    return Array.isArray(parsed) ? (parsed as BulkContactRecord[]) : [];
  } catch {
    return [];
  }
}

async function writeContacts(contacts: BulkContactRecord[]): Promise<void> {
  const bytes = Buffer.from(JSON.stringify(contacts, null, 2), 'utf-8');
  await supabaseAdmin.storage.from(BUCKET_NAME).upload(BULK_CONTACTS_PATH, bytes, {
    contentType: 'application/json',
    upsert: true,
  });
}

function parseContactsText(
  raw: string,
  defaultLabel: string
): Array<{ name: string; phoneIntl: string; phoneLocal: string; label: string }> {
  const results: Array<{ name: string; phoneIntl: string; phoneLocal: string; label: string }> = [];
  const seen = new Set<string>();

  if (raw.includes('BEGIN:VCARD')) {
    const cards = raw.split(/BEGIN:VCARD/i).slice(1);
    for (const card of cards) {
      const fnMatch = card.match(/^FN[^:]*:(.+)$/im);
      const telMatches = [...card.matchAll(/^TEL[^:]*:(.+)$/gim)];
      const name = (fnMatch?.[1] || 'Customer').trim();
      for (const m of telMatches) {
        const intl = normalizeKenyanPhone(m[1] || '');
        if (intl && !seen.has(intl)) {
          seen.add(intl);
          results.push({
            name,
            phoneIntl: intl,
            phoneLocal: toLocalKenyanFormat(intl) || intl,
            label: defaultLabel || 'Contact List',
          });
        }
      }
    }
    return results;
  }

  const lines = raw.split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const parts = trimmed.split(/[,;\t|]+/).map((p) => p.trim()).filter(Boolean);
    let phoneIntl: string | null = null;
    let name = '';
    let label = defaultLabel || 'Contact List';

    for (const part of parts) {
      const maybePhone = normalizeKenyanPhone(part);
      if (maybePhone && !phoneIntl) {
        phoneIntl = maybePhone;
      } else if (!name) {
        name = part;
      } else {
        label = part;
      }
    }

    if (!phoneIntl) {
      const tokens = trimmed.match(/(?:\+?254|0)[17]\d{8}/g) || [];
      for (const tok of tokens) {
        const intl = normalizeKenyanPhone(tok);
        if (intl && !seen.has(intl)) {
          seen.add(intl);
          results.push({
            name: name || 'Customer',
            phoneIntl: intl,
            phoneLocal: toLocalKenyanFormat(intl) || intl,
            label,
          });
        }
      }
      continue;
    }

    if (!seen.has(phoneIntl)) {
      seen.add(phoneIntl);
      results.push({
        name: name || 'Customer',
        phoneIntl,
        phoneLocal: toLocalKenyanFormat(phoneIntl) || phoneIntl,
        label,
      });
    }
  }

  return results;
}

async function sendViaWhatsAppApi(
  phoneIntl: string,
  text: string,
  cfg: BulkMessagingConfig
): Promise<{ ok: boolean; channel: string; error?: string }> {
  const metaToken = (cfg.metaAccessToken || process.env.WHATSAPP_ACCESS_TOKEN || '').trim();
  const metaPhoneId = (cfg.metaPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID || '').trim();
  if (metaToken && metaPhoneId) {
    try {
      const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(metaPhoneId)}/messages`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${metaToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phoneIntl,
          type: 'text',
          text: { body: text, preview_url: true },
        }),
      });
      if (res.ok) return { ok: true, channel: 'Meta WhatsApp Cloud API' };
      const errTxt = await res.text();
      return { ok: false, channel: 'Meta WhatsApp Cloud API', error: errTxt.slice(0, 120) };
    } catch (e: unknown) {
      return { ok: false, channel: 'Meta WhatsApp Cloud API', error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  const whapiToken = (cfg.whapiToken || process.env.WHAPI_API_TOKEN || '').trim();
  if (whapiToken) {
    try {
      const res = await fetch('https://gate.whapi.cloud/messages/text', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${whapiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ to: phoneIntl, body: text }),
      });
      if (res.ok) return { ok: true, channel: 'Whapi.cloud' };
      const errTxt = await res.text();
      return { ok: false, channel: 'Whapi.cloud', error: errTxt.slice(0, 120) };
    } catch (e: unknown) {
      return { ok: false, channel: 'Whapi.cloud', error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  const webhook = (cfg.whatsappWebhookUrl || process.env.WHATSAPP_AUTOREPLY_WEBHOOK_URL || '').trim();
  if (webhook) {
    try {
      const res = await fetch(webhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: phoneIntl, text }),
      });
      if (res.ok) return { ok: true, channel: 'WhatsApp Webhook' };
      return { ok: false, channel: 'WhatsApp Webhook', error: `HTTP ${res.status}` };
    } catch (e: unknown) {
      return { ok: false, channel: 'WhatsApp Webhook', error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  return { ok: false, channel: 'Manual wa.me Link (Configure API above)' };
}

async function sendViaSmsInboxApi(
  phoneIntl: string,
  text: string,
  cfg: BulkMessagingConfig
): Promise<{ ok: boolean; channel: string; error?: string }> {
  const atKey = (cfg.atApiKey || process.env.AFRICASTALKING_API_KEY || '').trim();
  const atUser = (cfg.atUsername || process.env.AFRICASTALKING_USERNAME || '').trim();
  if (atKey && atUser) {
    try {
      const params = new URLSearchParams({
        username: atUser,
        to: `+${phoneIntl}`,
        message: text,
      });
      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: {
          apiKey: atKey,
          Accept: 'application/json',
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (res.ok) return { ok: true, channel: "Africa's Talking SMS" };
      const errTxt = await res.text();
      return { ok: false, channel: "Africa's Talking SMS", error: errTxt.slice(0, 120) };
    } catch (e: unknown) {
      return { ok: false, channel: "Africa's Talking SMS", error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  const twSid = (cfg.twilioSid || process.env.TWILIO_ACCOUNT_SID || '').trim();
  const twToken = (cfg.twilioToken || process.env.TWILIO_AUTH_TOKEN || '').trim();
  const twFrom = (cfg.twilioFrom || process.env.TWILIO_PHONE_NUMBER || '').trim();
  if (twSid && twToken && twFrom) {
    try {
      const params = new URLSearchParams({
        To: `+${phoneIntl}`,
        From: twFrom,
        Body: text,
      });
      const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(twSid)}/Messages.json`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${Buffer.from(`${twSid}:${twToken}`).toString('base64')}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
      });
      if (res.ok) return { ok: true, channel: 'Twilio SMS' };
      const errTxt = await res.text();
      return { ok: false, channel: 'Twilio SMS', error: errTxt.slice(0, 120) };
    } catch (e: unknown) {
      return { ok: false, channel: 'Twilio SMS', error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  const smsWebhook = (cfg.smsWebhookUrl || process.env.SMS_WEBHOOK_URL || '').trim();
  if (smsWebhook) {
    try {
      const res = await fetch(smsWebhook, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ to: `+${phoneIntl}`, message: text }),
      });
      if (res.ok) return { ok: true, channel: 'SMS Webhook' };
      return { ok: false, channel: 'SMS Webhook', error: `HTTP ${res.status}` };
    } catch (e: unknown) {
      return { ok: false, channel: 'SMS Webhook', error: e instanceof Error ? e.message : 'Network error' };
    }
  }

  return { ok: false, channel: 'Manual sms: Link (Configure API above)' };
}

function summarizeGatewayFlags(cfg: BulkMessagingConfig) {
  const hasWhatsAppApi = Boolean(
    ((cfg.metaAccessToken || process.env.WHATSAPP_ACCESS_TOKEN) &&
      (cfg.metaPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID)) ||
      cfg.whapiToken ||
      process.env.WHAPI_API_TOKEN ||
      cfg.whatsappWebhookUrl ||
      process.env.WHATSAPP_AUTOREPLY_WEBHOOK_URL
  );
  const hasSmsApi = Boolean(
    ((cfg.atApiKey || process.env.AFRICASTALKING_API_KEY) &&
      (cfg.atUsername || process.env.AFRICASTALKING_USERNAME)) ||
      ((cfg.twilioSid || process.env.TWILIO_ACCOUNT_SID) &&
        (cfg.twilioToken || process.env.TWILIO_AUTH_TOKEN) &&
        (cfg.twilioFrom || process.env.TWILIO_PHONE_NUMBER)) ||
      cfg.smsWebhookUrl ||
      process.env.SMS_WEBHOOK_URL
  );
  return { hasWhatsAppApi, hasSmsApi };
}

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const [contacts, cfg] = await Promise.all([readContacts(), readMessagingConfig()]);
  const { hasWhatsAppApi, hasSmsApi } = summarizeGatewayFlags(cfg);
  return NextResponse.json({
    ok: true,
    contacts,
    totalCount: contacts.length,
    hasWhatsAppApi,
    hasSmsApi,
    configSummary: {
      hasWhapi: Boolean(cfg.whapiToken || process.env.WHAPI_API_TOKEN),
      hasMeta: Boolean((cfg.metaAccessToken || process.env.WHATSAPP_ACCESS_TOKEN) && (cfg.metaPhoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID)),
      hasWaWebhook: Boolean(cfg.whatsappWebhookUrl || process.env.WHATSAPP_AUTOREPLY_WEBHOOK_URL),
      hasAfricasTalking: Boolean((cfg.atApiKey || process.env.AFRICASTALKING_API_KEY) && (cfg.atUsername || process.env.AFRICASTALKING_USERNAME)),
      hasTwilio: Boolean(cfg.twilioSid || process.env.TWILIO_ACCOUNT_SID),
      hasSmsWebhook: Boolean(cfg.smsWebhookUrl || process.env.SMS_WEBHOOK_URL),
    },
  });
}

export async function POST(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const action = String(body.action || '');

    if (action === 'save_config') {
      const current = await readMessagingConfig();
      const next: BulkMessagingConfig = {
        ...current,
        whapiToken: body.whapiToken !== undefined ? String(body.whapiToken).trim() || current.whapiToken : current.whapiToken,
        metaAccessToken: body.metaAccessToken !== undefined ? String(body.metaAccessToken).trim() || current.metaAccessToken : current.metaAccessToken,
        metaPhoneNumberId: body.metaPhoneNumberId !== undefined ? String(body.metaPhoneNumberId).trim() || current.metaPhoneNumberId : current.metaPhoneNumberId,
        whatsappWebhookUrl: body.whatsappWebhookUrl !== undefined ? String(body.whatsappWebhookUrl).trim() || current.whatsappWebhookUrl : current.whatsappWebhookUrl,
        atUsername: body.atUsername !== undefined ? String(body.atUsername).trim() || current.atUsername : current.atUsername,
        atApiKey: body.atApiKey !== undefined ? String(body.atApiKey).trim() || current.atApiKey : current.atApiKey,
        twilioSid: body.twilioSid !== undefined ? String(body.twilioSid).trim() || current.twilioSid : current.twilioSid,
        twilioToken: body.twilioToken !== undefined ? String(body.twilioToken).trim() || current.twilioToken : current.twilioToken,
        twilioFrom: body.twilioFrom !== undefined ? String(body.twilioFrom).trim() || current.twilioFrom : current.twilioFrom,
        smsWebhookUrl: body.smsWebhookUrl !== undefined ? String(body.smsWebhookUrl).trim() || current.smsWebhookUrl : current.smsWebhookUrl,
      };
      await writeMessagingConfig(next);
      const flags = summarizeGatewayFlags(next);
      return NextResponse.json({ ok: true, ...flags, message: 'WhatsApp & SMS Inbox API settings saved!' });
    }

    if (action === 'import') {
      const rawText = String(body.rawText || '');
      const defaultLabel = String(body.label || 'Customer').trim();
      const parsed = parseContactsText(rawText, defaultLabel);
      if (parsed.length === 0) {
        return NextResponse.json(
          { error: 'No valid Kenyan phone numbers found (use 07XXXXXXXX, 01XXXXXXXX, or 2547XXXXXXXX).' },
          { status: 400 }
        );
      }

      const existing = await readContacts();
      const byPhone = new Map(existing.map((c) => [c.phoneIntl, c]));
      let addedCount = 0;

      for (const item of parsed) {
        if (!byPhone.has(item.phoneIntl)) {
          addedCount++;
          byPhone.set(item.phoneIntl, {
            id: `cnt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: item.name,
            phoneIntl: item.phoneIntl,
            phoneLocal: item.phoneLocal,
            label: item.label,
            addedAt: new Date().toISOString(),
          });
        } else {
          const prev = byPhone.get(item.phoneIntl)!;
          if (item.name !== 'Customer' && prev.name === 'Customer') prev.name = item.name;
          if (item.label) prev.label = item.label;
        }
      }

      const updated = Array.from(byPhone.values());
      await writeContacts(updated);
      void triggerAutomaticBackup(`Bulk contacts imported (+${addedCount})`);

      return NextResponse.json({
        ok: true,
        addedCount,
        totalCount: updated.length,
        contacts: updated,
      });
    }

    if (action === 'send_bulk') {
      const contactIds: string[] = Array.isArray(body.contactIds) ? body.contactIds : [];
      const channel = String(body.channel || 'both') as 'whatsapp' | 'inbox' | 'both';
      const template = String(body.message || '').trim();
      if (!template) {
        return NextResponse.json({ error: 'Message text is required.' }, { status: 400 });
      }

      const [contacts, cfg] = await Promise.all([readContacts(), readMessagingConfig()]);
      const targets =
        contactIds.length > 0
          ? contacts.filter((c) => contactIds.includes(c.id))
          : contacts.slice(0, 100);

      if (targets.length === 0) {
        return NextResponse.json({ error: 'No contacts selected.' }, { status: 400 });
      }

      const results: Array<{
        id: string;
        name: string;
        phoneLocal: string;
        whatsappSent: boolean;
        inboxSent: boolean;
        whatsappUrl: string;
        smsUrl: string;
        note: string;
      }> = [];

      const nowIso = new Date().toISOString();
      await Promise.all(
        targets.map(async (c) => {
          const personalized = template.replace(/\{name\}/gi, c.name || 'Friend');
          let waOk = false;
          let smsOk = false;
          const notes: string[] = [];

          if (channel === 'whatsapp' || channel === 'both') {
            const r = await sendViaWhatsAppApi(c.phoneIntl, personalized, cfg);
            waOk = r.ok;
            notes.push(`WA: ${r.ok ? `Sent (${r.channel})` : r.error || r.channel}`);
          }
          if (channel === 'inbox' || channel === 'both') {
            const r = await sendViaSmsInboxApi(c.phoneIntl, personalized, cfg);
            smsOk = r.ok;
            notes.push(`Inbox: ${r.ok ? `Sent (${r.channel})` : r.error || r.channel}`);
          }

          c.lastMessagedAt = nowIso;
          results.push({
            id: c.id,
            name: c.name,
            phoneLocal: c.phoneLocal,
            whatsappSent: waOk,
            inboxSent: smsOk,
            whatsappUrl: `https://wa.me/${c.phoneIntl}?text=${encodeURIComponent(personalized)}`,
            smsUrl: `sms:${c.phoneLocal}?body=${encodeURIComponent(personalized)}`,
            note: notes.join(' | '),
          });
        })
      );

      await writeContacts(contacts);
      return NextResponse.json({
        ok: true,
        processed: results.length,
        whatsappSentCount: results.filter((r) => r.whatsappSent).length,
        inboxSentCount: results.filter((r) => r.inboxSent).length,
        results,
      });
    }

    if (action === 'delete') {
      const id = String(body.id || '');
      const contacts = await readContacts();
      const filtered = contacts.filter((c) => c.id !== id);
      await writeContacts(filtered);
      return NextResponse.json({ ok: true, contacts: filtered });
    }

    return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : 'Server error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
