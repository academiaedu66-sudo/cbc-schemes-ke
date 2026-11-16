import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lightweight per-isolate rate limiter against automated bot & brute-force floods
const ipWindowMap = new Map<string, { count: number; resetAt: number }>();

const BLOCKED_HACKER_PATH_PATTERNS = [
  /^\/\.env/i,
  /^\/\.git/i,
  /^\/wp-admin/i,
  /^\/wp-login/i,
  /^\/wp-content/i,
  /^\/phpmyadmin/i,
  /^\/pma/i,
  /^\/xmlrpc\.php/i,
  /^\/vendor\/phpunit/i,
  /^\/actuator/i,
  /\.(php|asp|aspx|jsp|cgi|sql|bak|old|env)$/i,
];

const MALICIOUS_QUERY_PATTERN =
  /(union\s+select|<script|javascript:|onerror\s*=|\.\.\/|\.\.\\|\/etc\/passwd)/i;

function getClientIp(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) return xff.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

export function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  // 1. Block common vulnerability scanners & exploit probes immediately
  for (const pattern of BLOCKED_HACKER_PATH_PATTERNS) {
    if (pattern.test(pathname)) {
      return new NextResponse('Forbidden', { status: 403 });
    }
  }

  // 2. Block SQL injection / XSS / path-traversal payloads in URL query strings
  if (search && MALICIOUS_QUERY_PATTERN.test(decodeURIComponentSafe(search))) {
    return new NextResponse('Forbidden', { status: 403 });
  }

  // 3. Rate-limit sensitive API routes against brute-force & DDoS bursts
  if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/mpesa')) {
    const ip = getClientIp(request);
    const key = `${ip}:${pathname.startsWith('/api/admin') ? 'admin' : 'mpesa'}`;
    const maxPerMin = pathname.startsWith('/api/admin') ? 90 : 40;
    const now = Date.now();
    const bucket = ipWindowMap.get(key);

    if (!bucket || now > bucket.resetAt) {
      ipWindowMap.set(key, { count: 1, resetAt: now + 60_000 });
    } else {
      bucket.count += 1;
      if (bucket.count > maxPerMin) {
        return NextResponse.json(
          { error: 'Too many requests from this IP. Slow down and try again shortly.' },
          { status: 429 }
        );
      }
    }

    if (ipWindowMap.size > 2000) {
      for (const [k, v] of ipWindowMap.entries()) {
        if (now > v.resetAt) ipWindowMap.delete(k);
      }
    }
  }

  const response = NextResponse.next();
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN');
  return response;
}

function decodeURIComponentSafe(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|admin-icon.svg|admin-sw.js|pinchez-check-money.wav).*)',
  ],
};
