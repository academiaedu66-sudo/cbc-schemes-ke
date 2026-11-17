import fs from 'node:fs';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const BUCKET = 'cbc-materials';
const DATE_SLUG = new Date().toISOString().slice(0, 10);
const OUT_DIR = path.resolve(process.cwd(), 'backups', `cbc-website-backup-${DATE_SLUG}`);
const SYS_OUT_DIR = path.join(OUT_DIR, 'system-configs');

fs.mkdirSync(SYS_OUT_DIR, { recursive: true });

function toCsv(rows, columns) {
  const esc = (v) => {
    if (v === null || v === undefined) return '';
    const str = typeof v === 'object' ? JSON.stringify(v) : String(v);
    return `"${str.replace(/"/g, '""')}"`;
  };
  const header = columns.join(',');
  const lines = rows.map((r) => columns.map((c) => esc(r[c])).join(','));
  return [header, ...lines].join('\n');
}

async function main() {
  console.log(`Starting full website backup into ${OUT_DIR} ...`);

  // 1. Export all resources
  const allResources = [];
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('resources')
      .select('*')
      .order('grade', { ascending: true })
      .order('id', { ascending: true })
      .range(from, from + 999);
    if (error) throw error;
    if (!data || data.length === 0) break;
    allResources.push(...data);
    if (data.length < 1000) break;
    from += 1000;
  }
  console.log(`✓ Exported ${allResources.length} curriculum materials`);

  fs.writeFileSync(
    path.join(OUT_DIR, 'resources-catalog.json'),
    JSON.stringify(allResources, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'resources-catalog.csv'),
    toCsv(allResources, [
      'id',
      'title',
      'grade',
      'level',
      'category',
      'subject',
      'term',
      'price',
      'file_url',
      'created_at',
    ]),
    'utf-8'
  );

  // 2. Export all orders
  const { data: allOrdersRaw } = await supabase
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);
  const allOrders = allOrdersRaw || [];
  console.log(`✓ Exported ${allOrders.length} M-Pesa orders`);

  fs.writeFileSync(
    path.join(OUT_DIR, 'mpesa-orders.json'),
    JSON.stringify(allOrders, null, 2),
    'utf-8'
  );
  fs.writeFileSync(
    path.join(OUT_DIR, 'mpesa-orders.csv'),
    toCsv(allOrders, [
      'id',
      'checkout_request_id',
      'phone_number',
      'resource_id',
      'resource_title',
      'amount',
      'mpesa_receipt_number',
      'status',
      'created_at',
    ]),
    'utf-8'
  );

  // 3. Export _system JSON files
  const sysFiles = [
    'monetization-config.json',
    'monetization-stats.json',
    'tuition-registrations.json',
    'gaming-ledger.json',
    'homework-qa-ledger.json',
    'purchase-attempts.json',
    'wallet-ledger.json',
    'security-state.json',
  ];
  const systemConfigs = {};
  for (const name of sysFiles) {
    const cloudPath = `_system/${name}`;
    try {
      const { data } = await supabase.storage.from(BUCKET).download(cloudPath);
      if (data) {
        const text = await data.text();
        systemConfigs[cloudPath] = JSON.parse(text);
        fs.writeFileSync(path.join(SYS_OUT_DIR, name), text, 'utf-8');
      }
    } catch {
      // Optional file may not exist yet
    }
  }

  // 4. Storage manifest
  const storageManifest = [];
  let offset = 0;
  while (true) {
    const { data } = await supabase.storage.from(BUCKET).list('', {
      limit: 1000,
      offset,
    });
    if (!data || data.length === 0) break;
    for (const item of data) {
      storageManifest.push({
        name: item.name,
        updated_at: item.updated_at,
      });
    }
    if (data.length < 1000) break;
    offset += 1000;
  }
  console.log(`✓ Indexed ${storageManifest.length} Supabase Storage files`);

  fs.writeFileSync(
    path.join(OUT_DIR, 'storage-manifest.json'),
    JSON.stringify(storageManifest, null, 2),
    'utf-8'
  );

  const generatedAt = new Date().toISOString();
  const masterBundle = {
    generatedAt,
    siteUrl: 'https://cbcmaterials.shop',
    securityContacts: {
      otpPhonesMasked: ['0728***160', '0705***072'],
      twoFactorEmailMasked: 'aca*******55@gmail.com',
      autoBackupEnabled: true,
    },
    counts: {
      resourcesCount: allResources.length,
      ordersCount: allOrders.length,
      storageFilesCount: storageManifest.length,
    },
    database: {
      resources: allResources,
      orders: allOrders,
    },
    systemConfigs,
    storageFilesManifest: storageManifest,
  };

  const masterJson = JSON.stringify(masterBundle, null, 2);
  fs.writeFileSync(
    path.join(OUT_DIR, 'full-website-backup-bundle.json'),
    masterJson,
    'utf-8'
  );

  // 5. Upload cloud backup snapshot & create 7-day signed URL
  const cloudSnapshotPath = `_system/backups/cbc-website-backup-${generatedAt.replace(
    /[:.]/g,
    '-'
  )}.json`;
  await supabase.storage
    .from(BUCKET)
    .upload(cloudSnapshotPath, Buffer.from(masterJson, 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  const { data: signed } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(cloudSnapshotPath, 7 * 24 * 3600, { download: true });

  const signedUrl = signed?.signedUrl || '';

  // Update _system/security-state.json with lastBackupAt
  const existingSec = systemConfigs['_system/security-state.json'] || {
    require2faOnWebAdmin: true,
    securityPhones: ['0728595160', '0705759072'],
    securityEmail: 'academia.edu55@gmail.com',
    backupEmail: 'academia.edu55@gmail.com',
    sessionEpoch: 1,
    challenges: {},
    ipFailures: {},
    auditLog: [],
    deliveryConfig: {},
  };
  existingSec.lastBackupAt = generatedAt;
  existingSec.lastBackupCloudPath = cloudSnapshotPath;
  existingSec.auditLog = [
    {
      id: `sec_${Date.now()}`,
      timestamp: generatedAt,
      event: 'BACKUP_EXPORTED',
      ip: 'owner-workspace',
      detail: `Full website backup generated (${allResources.length} materials, ${allOrders.length} orders) for academia.edu55@gmail.com`,
    },
    ...(existingSec.auditLog || []),
  ].slice(0, 80);
  existingSec.updatedAt = generatedAt;

  const secBytes = Buffer.from(JSON.stringify(existingSec, null, 2), 'utf-8');
  await supabase.storage.from(BUCKET).upload('_system/security-state.json', secBytes, {
    contentType: 'application/json',
    upsert: true,
  });
  fs.writeFileSync(path.join(SYS_OUT_DIR, 'security-state.json'), secBytes);

  // 6. Write human-readable BACKUP_README.md
  const readme = `# CBC Hub Kenya — Full Website Data Backup

- **Generated At:** \`${generatedAt}\`
- **Production Website:** https://cbcmaterials.shop
- **Security OTP Phones (Masked):** \`0728***160\` or \`0705***072\`
- **2-Step Verification & Backup Email (Masked):** \`aca*******55@gmail.com\`
- **Automatic Continuous Backup:** Enabled across all website features (Curriculum Materials, M-Pesa Orders, Tuition Hub, Subject Gaming, Monetization, and Ask Gemini Q&A)

## Backup Inventory
- **Curriculum Materials (\`resources-catalog.json\` & \`.csv\`):** **${allResources.length.toLocaleString()}** items
- **M-Pesa Orders (\`mpesa-orders.json\` & \`.csv\`):** **${allOrders.length.toLocaleString()}** transactions
- **Supabase Cloud Storage Files (\`storage-manifest.json\`):** **${storageManifest.length.toLocaleString()}** files
- **System Configs (\`system-configs/\`):** Monetization settings & earnings stats, Tuition leads, Subject Gaming ledger, and Security 2FA state
- **Single-File Master Snapshot:** \`full-website-backup-bundle.json\`

## 7-Day Encrypted Cloud Snapshot Link (Save or Forward to \`academia.edu55@gmail.com\`)
${signedUrl ? signedUrl : cloudSnapshotPath}
`;

  fs.writeFileSync(path.join(OUT_DIR, 'BACKUP_README.md'), readme, 'utf-8');
  console.log(`✓ Backup folder ready: ${OUT_DIR}`);
  if (signedUrl) {
    console.log(`✓ 7-Day Signed Cloud Backup Link: ${signedUrl}`);
  }
}

main().catch((err) => {
  console.error('Backup script error:', err);
  process.exit(1);
});
