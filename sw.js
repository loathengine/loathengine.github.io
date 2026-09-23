// Service worker: offline support for the PWA.
//
// Strategy (deliberate, per audit 2026-07-24):
//   • HTML navigations are NETWORK-FIRST so every visit runs the latest deploy
//     (the old cache-first strategy served each visit the previous deploy).
//     Offline falls back to the cached index.html shell.
//   • Hashed build assets (/assets/*) and other same-origin GETs are CACHE-FIRST
//     with background revalidation (they're content-addressed, so staleness is
//     impossible; revalidation keeps non-hashed files like favicon fresh).
//     The current build's assets are also precached — see precacheBuild.
//   • NETWORK_FIRST paths are the exception: same-origin files with a STABLE name whose
//     contents change between deploys. Cache-first is justified by content-addressing,
//     and these are not content-addressed, so that justification does not cover them.
//     Background revalidation is not enough — it serves the stale copy first and only
//     refreshes for the NEXT visit, so a recalibration would take two visits to reach a
//     returning user. See docs/WORKSTREAMS.md WS28.
//   • The cache is pruned to MAX_ENTRIES so old hashed bundles can't accumulate
//     forever. Bump CACHE_NAME on strategy changes to drop everything at once.
// Bumped from v3: master-db.json joined ASSETS and NETWORK_FIRST (WS93), and existing
// installs have no cached copy of it at all.
// Bumped from v4: library-db.json joined the cache as an optional precached asset
// (WS98), and the trim guard now protects it.
// Bumped from v5: the two data assets were renamed — tuning_fit.json → tuning-db.json and
// library-loads.json → library-db.json. Existing installs hold the old paths, which no
// longer resolve, and neither ASSETS nor NETWORK_FIRST would ever match them again. Dropping
// the whole cache is the only thing that clears them.
const CACHE_NAME = 'empirical-precision-v6';
const MAX_ENTRIES = 80;

/**
 * Stable-named files that must never be served stale.
 *
 * tuning-db.json is the fitted ballistics model — it determines every velocity and
 * pressure the app reports, including the SAAMI safety gauge, and it carries the
 * `generated_at` stamp the velocity-offset staleness check compares against. Serving a
 * previous deploy's copy would both show old numbers and make that check compare a stored
 * offset against the wrong calibration generation, producing a spurious warning.
 *
 * master-db.json is the component library snapshot the app seeds a new install from. It is
 * read once, when the reference tables are empty, so a stale copy would not be corrected on
 * a later visit the way a stale fit would — whatever is served becomes that install's whole
 * database until the user syncs.
 */
const NETWORK_FIRST = ['/tuning-db.json', '/master-db.json'];
// Precached at install so the app works offline from the first launch.
//
// tuning-db.json is here despite being ~980 KB. This is a range tool and internal
// ballistics is a core feature, so "offline" is a normal operating mode rather than an
// edge case. Left lazy it entered the cache only once a user had run a simulation while
// online, meaning anyone who installed the PWA and went offline without opening the
// Ignition tab got no simulations at all. See docs/WORKSTREAMS.md WS31.
//
// master-db.json (~760 KB, ~73 KB over the wire) is here for the same reason and a stronger
// one: it is fetched during boot on a brand-new install. Someone who installs the PWA and
// drives to a range without opening it has never triggered a lazy fetch, and an empty
// component library is an app with nothing in it. See docs/WORKSTREAMS.md WS93.
//
// addAll is atomic — a deploy missing either file fails SW install outright and takes
// offline support for everything with it. Both are checked into public/.
const ASSETS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.json',
  '/tuning-db.json',
  '/master-db.json'
];

/**
 * Wanted offline, but not worth failing the install for.
 *
 * library-db.json (~7.4 MB, ~710 KB over the wire) is the published-load reference. It
 * is genuinely useful at a range with no signal, so it should be there. But it differs from
 * the ASSETS above in one decisive way: it is copied into public/ by hand rather than
 * produced by the build, so it is the one file a deploy can plausibly ship without.
 *
 * Because `addAll` is atomic, listing it above would mean a missing copy takes down offline
 * support for the entire app — the fit, the component database and the shell included — to
 * protect a reference tab. Best-effort instead: precache it when it is there, carry on
 * without it when it is not. If it never precaches, the tab still works online and caches
 * itself on first view through the cache-first path below.
 */
const OPTIONAL_ASSETS = ['/library-db.json'];

/**
 * Finds the hashed build in index.html and precaches all of it: the entry bundle, its
 * preloads and stylesheet, and every chunk they import, lazy pages included.
 *
 * ASSETS cannot list these because their names change every deploy, and a first visit
 * never routes them through this worker: the page fetches its bundles before the worker is
 * registered. Without this, someone who installs the PWA and opens it offline once the
 * HTTP cache has expired (GitHub Pages sends max-age=600) gets the cached index.html, a
 * failed fetch for /assets/index-*.js, and a blank page.
 *
 * index.html's <script>/<link> tags name the entry. The entry's __vite__mapDeps names
 * every lazy chunk as "assets/…", and chunks import one another as "./…". A regex match
 * that is not a real file just returns 404 and is skipped, so this is best-effort in the
 * same way OPTIONAL_ASSETS is.
 *
 * sw.js is byte-identical across deploys, so install runs once per install rather than
 * once per deploy. The navigation handler therefore re-runs this for every fresh
 * index.html.
 */
const BUILD_REF = /(?:assets\/|\.\/)([\w-]+\.(?:js|css))/g;

async function precacheBuild(html) {
  const cache = await caches.open(CACHE_NAME);
  const seen = new Set();
  let texts = [html];
  while (texts.length) {
    const paths = [];
    for (const text of texts) {
      for (const [, name] of text.matchAll(BUILD_REF)) {
        const path = `/assets/${name}`;
        if (!seen.has(path)) {
          seen.add(path);
          paths.push(path);
        }
      }
    }
    const found = await Promise.all(
      paths.map(async (path) => {
        let response = await cache.match(path);
        if (!response) {
          response = await fetch(path).catch(() => null);
          if (!response || response.status !== 200) return null;
        }
        // Put even on a hit. That moves the entry to the newest end of trimCache's FIFO.
        // A chunk carried over unchanged from an earlier deploy (usually the vendor
        // bundle) would otherwise be the oldest entry and the first one evicted.
        await cache.put(path, response.clone());
        return path.endsWith('.js') ? response.text() : null;
      })
    );
    texts = found.filter(Boolean);
  }
  await trimCache(cache);
}

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      await Promise.all(
        OPTIONAL_ASSETS.map((path) => cache.add(path).catch(() => {}))
      );
      const shell = await cache.match('/index.html');
      await precacheBuild(await shell.text()).catch(() => {});
    })
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
  // The optional assets are protected too. Nothing re-adds them after install, so evicting
  // one would silently and permanently remove it from offline use.
  const protectedPaths = new Set([...ASSETS, ...OPTIONAL_ASSETS]);
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
            const shell = response.clone();
            e.waitUntil(
              putAndTrim('/index.html', shell.clone())
                .then(async () => precacheBuild(await shell.text()))
                .catch(() => {})
            );
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
