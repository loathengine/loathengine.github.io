// Service worker: offline support for the PWA.
//
// Strategy (deliberate, per audit 2026-07-24):
//   • HTML navigations are NETWORK-FIRST so every visit runs the latest deploy
//     (the old cache-first strategy served each visit the previous deploy).
//     Offline falls back to the cached index.html shell.
//   • Hashed build assets (/assets/*) and other same-origin GETs are CACHE-FIRST
//     with background revalidation (they're content-addressed, so staleness is
//     impossible; revalidation keeps non-hashed files like favicon fresh).
//   • NETWORK_FIRST paths are the exception: same-origin files with a STABLE name whose
//     contents change between deploys. Cache-first is justified by content-addressing,
//     and these are not content-addressed, so that justification does not cover them.
//     Background revalidation is not enough — it serves the stale copy first and only
//     refreshes for the NEXT visit, so a recalibration would take two visits to reach a
//     returning user. See docs/WORKSTREAMS.md WS28.
//   • The cache is pruned to MAX_ENTRIES so old hashed bundles can't accumulate
//     forever. Bump CACHE_NAME on strategy changes to drop everything at once.
// Bumped from v2: the caching strategy changed (NETWORK_FIRST below), and existing
// installs are holding a cache-first copy of tuning_fit.json that must be dropped.
const CACHE_NAME = 'empirical-precision-v3';
const MAX_ENTRIES = 80;

/**
 * Stable-named files that must never be served stale.
 *
 * tuning_fit.json is the fitted ballistics model — it determines every velocity and
 * pressure the app reports, including the SAAMI safety gauge, and it carries the
 * `generated_at` stamp the velocity-offset staleness check compares against. Serving a
 * previous deploy's copy would both show old numbers and make that check compare a stored
 * offset against the wrong calibration generation, producing a spurious warning.
 */
const NETWORK_FIRST = ['/tuning_fit.json'];
// Precached at install so the app works offline from the first launch.
//
// tuning_fit.json is here despite being ~980 KB. This is a range tool and internal
// ballistics is a core feature, so "offline" is a normal operating mode rather than an
// edge case. Left lazy it entered the cache only once a user had run a simulation while
// online, meaning anyone who installed the PWA and went offline without opening the
// Ignition tab got no simulations at all. See docs/WORKSTREAMS.md WS31.
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/tuning_fit.json'
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
  // FIFO prune, but never evict a precached entry. One build emits ~39 files, so two or
  // three deploys reach the cap and plain oldest-first pruning would eventually drop the
  // app shell or the fit and silently break offline use.
  const protectedPaths = new Set(ASSETS);
  const evictable = keys.filter((k) => !protectedPaths.has(new URL(k.url).pathname));
  const excess = keys.length - MAX_ENTRIES;
  for (const key of evictable.slice(0, excess)) {
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

  // Stable-named mutable data: network-first, falling back to cache when offline.
  if (NETWORK_FIRST.some((path) => new URL(e.request.url).pathname.endsWith(path))) {
    e.respondWith(
      fetch(e.request)
        .then((response) => {
          if (response.status === 200) {
            e.waitUntil(putAndTrim(e.request, response.clone()));
          }
          return response;
        })
        .catch(async () => {
          const cache = await caches.open(CACHE_NAME);
          const hit = await cache.match(e.request);
          if (hit) return hit;
          throw new Error('offline and no cached copy');
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
