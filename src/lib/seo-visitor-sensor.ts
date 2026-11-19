import { supabaseAdmin } from '@/lib/supabase';
import { INDEXNOW_KEY, SITE_URL } from '@/lib/seo-catalog';
import { SEO_TOPIC_PILLARS } from '@/lib/seo-topics';

const BUCKET_NAME = 'cbc-materials';
const SENSOR_LEDGER_PATH = '_system/seo-customer-sensor-ledger.json';

export interface CustomerSensorEvent {
  id: string;
  timestamp: string;
  sourceLabel: string; // e.g. 'Google Search', 'Chrome Web Search', 'WhatsApp', 'Direct Visit', 'Site Keyword Search'
  keywordCluster: string; // e.g. 'CBC Schemes of Work', 'KNEC & KJSEA Exams', 'TSC Services', 'CBC Tuition & Tutors'
  searchQuery?: string;
  landingPath: string;
  deviceSummary: string;
}

export interface SeoCustomerSensorLedger {
  totalCustomersDetected: number;
  lastDailyAutoRankIso: string | null;
  lastIndexNowStatus: string;
  trendingQueries: string[];
  recentCustomers: CustomerSensorEvent[];
  recentIpTimestamps: Record<string, number>;
  updatedAt: string;
}

const DEFAULT_TRENDING_QUERIES = [
  '2026 CBC Schemes of Work PDF Word',
  'CBCMaterials Kenya cbcmaterials.shop',
  'Kenya National KJSEA Test and Marking Schemes',
  'KNEC KPSEA KJSEA Past and Trial Papers',
  'CBC Teachers Notes All Strands Short Notes',
  'TSC TPAD 2 Records of Work and Payslips',
  'Verified Home and Holiday CBC Tuition Tutors Kenya',
];

let cachedLedger: { data: SeoCustomerSensorLedger; loadedAt: number } | null = null;

export async function getSeoCustomerSensorLedger(
  forceFresh = false
): Promise<SeoCustomerSensorLedger> {
  if (!forceFresh && cachedLedger && Date.now() - cachedLedger.loadedAt < 2500) {
    return cachedLedger.data;
  }

  const defaults: SeoCustomerSensorLedger = {
    totalCustomersDetected: 0,
    lastDailyAutoRankIso: null,
    lastIndexNowStatus: 'Ready',
    trendingQueries: DEFAULT_TRENDING_QUERIES,
    recentCustomers: [],
    recentIpTimestamps: {},
    updatedAt: new Date().toISOString(),
  };

  try {
    const { data, error } = await supabaseAdmin.storage
      .from(BUCKET_NAME)
      .download(SENSOR_LEDGER_PATH);
    if (error || !data) return defaults;
    const parsed = JSON.parse(await data.text()) as Partial<SeoCustomerSensorLedger>;
    const merged: SeoCustomerSensorLedger = {
      ...defaults,
      ...parsed,
      trendingQueries:
        Array.isArray(parsed.trendingQueries) && parsed.trendingQueries.length > 0
          ? parsed.trendingQueries.slice(0, 30)
          : DEFAULT_TRENDING_QUERIES,
      recentCustomers: Array.isArray(parsed.recentCustomers)
        ? parsed.recentCustomers.slice(0, 35)
        : [],
      recentIpTimestamps: parsed.recentIpTimestamps || {},
    };
    cachedLedger = { data: merged, loadedAt: Date.now() };
    return merged;
  } catch {
    return defaults;
  }
}

export async function saveSeoCustomerSensorLedger(
  ledger: SeoCustomerSensorLedger
): Promise<SeoCustomerSensorLedger> {
  const nowMs = Date.now();
  const prunedIps: Record<string, number> = {};
  for (const [k, ts] of Object.entries(ledger.recentIpTimestamps || {})) {
    if (nowMs - ts < 15 * 60 * 1000) {
      prunedIps[k] = ts;
    }
  }

  const cleaned: SeoCustomerSensorLedger = {
    ...ledger,
    trendingQueries: (ledger.trendingQueries || DEFAULT_TRENDING_QUERIES).slice(0, 30),
    recentCustomers: (ledger.recentCustomers || []).slice(0, 35),
    recentIpTimestamps: prunedIps,
    updatedAt: new Date().toISOString(),
  };

  await supabaseAdmin.storage
    .from(BUCKET_NAME)
    .upload(SENSOR_LEDGER_PATH, Buffer.from(JSON.stringify(cleaned, null, 2), 'utf-8'), {
      contentType: 'application/json',
      upsert: true,
    });

  cachedLedger = { data: cleaned, loadedAt: nowMs };
  return cleaned;
}

export function classifyKeywordCluster(pathStr: string, queryStr: string): string {
  const hay = `${pathStr} ${queryStr}`.toLowerCase();
  if (hay.includes('tsc') || hay.includes('tpad') || hay.includes('payslip')) {
    return 'TSC Services & TPAD';
  }
  if (
    hay.includes('kjsea') ||
    hay.includes('kpsea') ||
    hay.includes('keya') ||
    hay.includes('knec') ||
    hay.includes('exam')
  ) {
    return 'KNEC, KJSEA & KPSEA Examinations';
  }
  if (hay.includes('scheme')) {
    return '2026 CBC Schemes of Work';
  }
  if (hay.includes('note') || hay.includes('book') || hay.includes('grade up')) {
    return "CBC Teachers' Notes & Books";
  }
  if (hay.includes('tuition') || hay.includes('tutor')) {
    return 'CBC Tuition & Tutors';
  }
  if (hay.includes('lesson-plan') || hay.includes('plan')) {
    return 'CBC Lesson Plans';
  }
  if (hay.includes('record')) {
    return 'Records of Work & Rubrics';
  }
  if (hay.includes('gaming') || hay.includes('game')) {
    return 'CBC Subject Gaming';
  }
  if (hay.includes('gemini') || hay.includes('homework')) {
    return 'Ask Gemini Homework Q&A';
  }
  return 'CBC & CBCMaterials Portal';
}

export function detectTrafficSource(referrer: string, ua: string, hasSearchQuery: boolean): string {
  const ref = (referrer || '').toLowerCase();
  if (hasSearchQuery && ref.includes('cbcmaterials.shop')) {
    return 'Website Keyword Search';
  }
  if (ref.includes('google.') || ref.includes('com.google.android.googlequicksearchbox')) {
    return 'Google / Chrome Search';
  }
  if (ref.includes('bing.com')) return 'Bing Search';
  if (ref.includes('duckduckgo.com') || ref.includes('yahoo.com')) return 'Web Search';
  if (ref.includes('facebook.com') || ref.includes('fb.')) return 'Facebook / Reels';
  if (ref.includes('whatsapp') || ref.includes('wa.me')) return 'WhatsApp Status / Link';
  if (/chrome\//i.test(ua) && !ref) return 'Chrome Direct / Omnibox';
  return 'Direct Customer Arrival';
}

/**
 * Runs the Daily Automated Search Engine Ranking & IndexNow Submission across all
 * 14 Topic Hubs, 14 Grade Hubs, Sitemap, and OpenSearch endpoints.
 */
export async function runDailyAutomatedSeoRankSync(): Promise<{
  ok: boolean;
  submittedUrlsCount: number;
  statuses: Record<string, number | string>;
}> {
  const urls = [
    `${SITE_URL}/`,
    ...SEO_TOPIC_PILLARS.map((t) => `${SITE_URL}/topics/${t.slug}`),
    `${SITE_URL}/grades/pp1`,
    `${SITE_URL}/grades/pp2`,
    ...Array.from({ length: 12 }, (_, i) => `${SITE_URL}/grades/grade-${i + 1}`),
    `${SITE_URL}/advertise`,
  ];

  const statuses: Record<string, number | string> = {};

  // Warm sitemap.xml so Googlebot always receives an instant hot edge response
  await fetch(`${SITE_URL}/sitemap.xml`, { cache: 'no-store' })
    .then((r) => {
      statuses['sitemap_warm'] = r.status;
    })
    .catch(() => {
      statuses['sitemap_warm'] = 'skipped';
    });

  for (const endpoint of [
    'https://api.indexnow.org/indexnow',
    'https://www.bing.com/indexnow',
    'https://yandex.com/indexnow',
  ]) {
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json; charset=utf-8' },
        body: JSON.stringify({
          host: 'www.cbcmaterials.shop',
          key: INDEXNOW_KEY,
          keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
          urlList: urls,
        }),
        signal: AbortSignal.timeout(8000),
      });
      statuses[endpoint] = res.status;
    } catch (e) {
      statuses[endpoint] = e instanceof Error ? e.message : 'err';
    }
  }

  const ledger = await getSeoCustomerSensorLedger(true);
  ledger.lastDailyAutoRankIso = new Date().toISOString();
  ledger.lastIndexNowStatus = JSON.stringify(statuses);
  await saveSeoCustomerSensorLedger(ledger);

  return {
    ok: true,
    submittedUrlsCount: urls.length,
    statuses,
  };
}
