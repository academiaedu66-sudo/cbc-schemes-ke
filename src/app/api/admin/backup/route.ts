import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  BACKUP_DESTINATION_EMAIL,
  compileFullWebsiteBackup,
  getSecurityState,
  sendSecurityEmailMessage,
} from '@/lib/security';
import { sendWhatsAppAdminNotification } from '@/lib/mpesa';

export async function GET(req: NextRequest) {
  const authorized = isAdminAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { bundle } = await compileFullWebsiteBackup();
    const dateSlug = bundle.generatedAt.slice(0, 10);
    const jsonText = JSON.stringify(bundle, null, 2);

    return new NextResponse(jsonText, {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Content-Disposition': `attachment; filename="cbc-website-backup-${dateSlug}.json"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backup export failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authorized = isAdminAuthorized(req);
  if (!authorized) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const [{ bundle, cloudSnapshotPath, signedDownloadUrl }, secState] =
      await Promise.all([compileFullWebsiteBackup(), getSecurityState(true)]);

    const dateLabel = new Date(bundle.generatedAt).toLocaleString('en-KE', {
      dateStyle: 'medium',
      timeStyle: 'short',
    });

    const summaryText =
      `CBC Website Full Data Backup (${dateLabel})\n` +
      `Destination Email: ${BACKUP_DESTINATION_EMAIL}\n` +
      `• Curriculum Resources: ${bundle.counts.resourcesCount.toLocaleString()}\n` +
      `• M-Pesa Orders: ${bundle.counts.ordersCount.toLocaleString()}\n` +
      `• Tuition Leads: ${bundle.counts.tuitionRegistrationsCount.toLocaleString()}\n` +
      `• Gaming Accounts: ${bundle.counts.gamingPlayersCount.toLocaleString()}\n` +
      `• Storage Files: ${bundle.counts.storageFilesCount.toLocaleString()}\n` +
      (signedDownloadUrl
        ? `\n7-Day Secure Backup Download Link:\n${signedDownloadUrl}`
        : `\nCloud Vault Path: ${cloudSnapshotPath}`);

    const summaryHtml = `<div style="font-family:Arial,sans-serif;max-width:580px;padding:22px;border:1px solid #cbd5e1;border-radius:14px;">
      <h2 style="margin:0 0 8px;color:#064e3b;">CBC Hub Full Website Backup</h2>
      <p style="font-size:13px;color:#475569;margin:0 0 16px;">Generated on <strong>${dateLabel}</strong> for <strong>${BACKUP_DESTINATION_EMAIL}</strong></p>
      <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:18px;">
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;">Curriculum Materials Catalog</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${bundle.counts.resourcesCount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;">M-Pesa Orders &amp; Receipts</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${bundle.counts.ordersCount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;">Holiday &amp; Personal Tuition Leads</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${bundle.counts.tuitionRegistrationsCount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;border-bottom:1px solid #e2e8f0;">Subject Gaming Players</td><td style="padding:8px;border-bottom:1px solid #e2e8f0;font-weight:bold;text-align:right;">${bundle.counts.gamingPlayersCount.toLocaleString()}</td></tr>
        <tr><td style="padding:8px;">Supabase Cloud Storage Files</td><td style="padding:8px;font-weight:bold;text-align:right;">${bundle.counts.storageFilesCount.toLocaleString()}</td></tr>
      </table>
      ${
        signedDownloadUrl
          ? `<div style="text-align:center;margin:20px 0;">
              <a href="${signedDownloadUrl}" style="background:#059669;color:#ffffff;text-decoration:none;font-weight:bold;padding:12px 22px;border-radius:10px;display:inline-block;font-size:14px;">Download Complete Backup Archive (.JSON)</a>
              <p style="font-size:11px;color:#64748b;margin-top:8px;">Encrypted signed link valid for 7 days.</p>
            </div>`
          : ''
      }
      <p style="font-size:11px;color:#64748b;">Cloud Vault Snapshot: <code>${cloudSnapshotPath}</code></p>
    </div>`;

    const emailDispatch = await sendSecurityEmailMessage({
      toEmail: BACKUP_DESTINATION_EMAIL,
      subject: `[CBC Website Backup] Full Database & Config Snapshot (${dateLabel})`,
      text: summaryText,
      html: summaryHtml,
      config: secState.deliveryConfig,
    });

    await sendWhatsAppAdminNotification(summaryText).catch(() => false);

    return NextResponse.json({
      success: true,
      backupEmail: BACKUP_DESTINATION_EMAIL,
      emailSent: emailDispatch.sent,
      emailChannel: emailDispatch.channel,
      cloudSnapshotPath,
      signedDownloadUrl,
      generatedAt: bundle.generatedAt,
      counts: bundle.counts,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Backup failed';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
