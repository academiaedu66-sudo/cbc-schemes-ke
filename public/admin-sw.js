// CBC Admin Mobile PWA Service Worker
const CACHE_NAME = 'cbc-admin-mobile-v1';

self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', (event) => {
  // Always use live network for real-time M-Pesa & analytics APIs
  if (event.request.method !== 'GET') return;
  event.respondWith(fetch(event.request));
});
