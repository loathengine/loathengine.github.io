// Service worker: offline support for the PWA.
//
// Strategy (deliberate, per audit 2026-07-24):
//   • HTML navigations are NETWORK-FIRST so every visit runs the latest deploy
//     (the old cache-first strategy served each visit the previous deploy).
//     Offline falls back to the cached index.html shell.
//   • Hashed build assets (/assets/*) and other same-origin GETs are CACHE-FIRST
//     with background revalidation (they're content-addressed, so staleness is
//     impossible; revalidation keeps non-hashed files like favicon fresh).
//   • The cache is pruned to MAX_ENTRIES so old hashed bundles can't accumulate
//     forever. Bump CACHE_NAME on strategy changes to drop everything at once.
const CACHE_NAME = 'empirical-precision-v2';
const MAX_ENTRIES = 80;
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.map((key) => (key !== CACHE_NAME ? caches.delete(key) : undefined)))
    )
  );
  self.clients.claim();
});

async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  // FIFO prune: delete oldest entries beyond the cap.
  for (const key of keys.slice(0, keys.length - MAX_ENTRIES)) {
    await cache.delete(key);
  }
}

async function putAndTrim(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  await trimCache(cache);
}

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  if (!e.request.url.startsWith(self.location.origin)) return;

  // HTML navigations: network-first so deploys are picked up immediately.
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            e.waitUntil(putAndTrim('/index.html', response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          return (await cache.match('/index.html')) || (await cache.match('/'));
        })
    );
    return;
  }

  // Everything else: cache-first with background revalidation.
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Revalidate in the background — wrapped in waitUntil so the SW isn't
        // terminated before cache.put completes.
        e.waitUntil(
          fetch(e.request)
            .then((response) => {
              if (response.status === 200) return putAndTrim(e.request, response);
            })
            .catch(() => {/* offline — keep serving cache */})
        );
        return cachedResponse;
      }

      return fetch(e.request).then((response) => {
        if (response.status === 200) {
          e.waitUntil(putAndTrim(e.request, response.clone()));
        }
        return response;
      });
    })
  );
});
