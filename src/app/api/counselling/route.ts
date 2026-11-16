import { NextRequest, NextResponse } from 'next/server';
import { isAdminAuthorized } from '@/lib/admin-auth';
import {
  generateGuidanceCounsellingReply,
  getStoredAiConfig,
  resolveGeminiApiKey,
  saveStoredAiConfig,
  type CounsellingMessage,
  type CounsellingRole,
} from '@/lib/counselling';

export async function GET(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  const [stored, resolvedKey] = await Promise.all([
    getStoredAiConfig(),
    resolveGeminiApiKey(),
  ]);

  const masked =
    resolvedKey.length > 8
      ? `••••••••${resolvedKey.slice(-4)}`
      : resolvedKey
      ? '••••••'
      : '';

  return NextResponse.json({
    hasGeminiKey: Boolean(resolvedKey),
    geminiKeyMasked: masked,
    updatedAt: stored.updatedAt || null,
  });
}

export async function PUT(req: NextRequest) {
  if (!isAdminAuthorized(req)) {
    return NextResponse.json({ error: 'Invalid admin password' }, { status: 401 });
  }

  try {
    const body = (await req.json()) as { geminiApiKey?: string };
    const cleanKey = (body.geminiApiKey || '').trim();
    const existing = await getStoredAiConfig();

    const saved = await saveStoredAiConfig({
      ...existing,
      geminiApiKey: cleanKey,
    });

    return NextResponse.json({
      success: true,
      hasGeminiKey: Boolean(cleanKey),
      updatedAt: saved.updatedAt,
      message: cleanKey
        ? 'Gemini API key saved live! Guidance & Counselling is now using live Gemini.'
        : 'Cleared custom Gemini key.',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Failed to save Gemini config';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  void req.headers.get('user-agent');

  try {
    const body = (await req.json()) as {
      role?: string;
      gradeLabel?: string;
      messages?: CounsellingMessage[];
    };

    const role: CounsellingRole = body.role === 'PARENT' ? 'PARENT' : 'LEARNER';
    const messages = Array.isArray(body.messages) ? body.messages : [];

    if (messages.length === 0) {
      return NextResponse.json(
        { error: 'Please enter your question or select a topic.' },
        { status: 400 }
      );
    }

    const result = await generateGuidanceCounsellingReply({
      role,
      gradeLabel: body.gradeLabel,
      messages,
    });

    return NextResponse.json(result);
  } catch (err: unknown) {
    const msg =
      err instanceof Error ? err.message : 'Guidance counsellor temporarily busy';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
