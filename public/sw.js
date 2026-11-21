// CBCMATERIALS.SHOP — Clean Zero-Third-Party-Ad Service Worker
// Automatically clears any third-party ad push worker so no external company ads ever appear.
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    self.registration
      .unregister()
      .then(() => self.clients.matchAll())
      .then((clients) => {
        clients.forEach((client) => {
          // Worker cleanly unregistered; no reload needed
          void client;
        });
      })
  );
});
