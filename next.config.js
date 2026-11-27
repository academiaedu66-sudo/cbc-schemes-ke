/**
 * Next.js configuration with security headers to block unwanted third‑party scripts (ads).
 * This file ensures the site is served with a strict Content‑Security‑Policy allowing only
 * resources from the same origin and trusted CDNs. Adjust the `script-src` directive if you
 * add legitimate external scripts later.
 */
module.exports = {
  // Enable Vercel Pro features – already present in vercel.json but required here for local dev.
  output: "standalone",
  // Enable caching of components for `'use cache'` directives.
  cacheComponents: true,
  partialPrefetching: true,
  // Security headers applied to all routes.
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; font-src 'self'; frame-src 'self'; object-src 'none';",
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
  // Enable the Image Optimization API (optional) and other Next.js flags.
  images: {
    remotePatterns: [],
  },
  reactStrictMode: true,
};
