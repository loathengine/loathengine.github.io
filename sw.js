const CACHE_NAME = "empirical-precision-v6";
const MAX_ENTRIES = 100;
const NETWORK_FIRST = ["/tuning-db.json", "/master-db.json"];
const ASSETS = [
  "/",
  "/index.html",
  "/favicon.svg",
  "/manifest.json",
  "/tuning-db.json",
  "/master-db.json"
];
const OPTIONAL_ASSETS = ["/library-db.json"];
const BUILD_MANIFEST = "/build-manifest.json";
self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(async (cache) => {
      await cache.addAll(ASSETS);
      await Promise.all(
        OPTIONAL_ASSETS.map((path) => cache.add(path).catch(() => {
        }))
      );
      await precacheBuild(cache);
    })
  );
  self.skipWaiting();
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then(
      (keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : void 0))
    )
  );
  self.clients.claim();
});
async function trimCache(cache) {
  const keys = await cache.keys();
  if (keys.length <= MAX_ENTRIES) return;
  const protectedPaths = /* @__PURE__ */ new Set([...ASSETS, ...OPTIONAL_ASSETS]);
  const evictable = keys.filter((k) => !protectedPaths.has(new URL(k.url).pathname));
  const excess = keys.length - MAX_ENTRIES;
  for (const key of evictable.slice(0, excess)) {
    await cache.delete(key);
  }
}
async function precacheBuild(cache) {
  const res = await fetch(BUILD_MANIFEST, { cache: "no-store" });
  if (!res.ok) throw new Error(`${BUILD_MANIFEST}: HTTP ${res.status}`);
  const { assets } = await res.json();
  if (!Array.isArray(assets)) throw new Error(`${BUILD_MANIFEST}: no assets list`);
  await Promise.all(
    assets.map(async (path) => {
      let response = await cache.match(path);
      if (!response) {
        response = await fetch(path);
        if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
      }
      await cache.put(path, response);
    })
  );
  await trimCache(cache);
}
async function putAndTrim(request, response) {
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response);
  await trimCache(cache);
}
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  if (!e.request.url.startsWith(self.location.origin)) return;
  if (e.request.mode === "navigate") {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response.status === 200) {
          e.waitUntil(
            putAndTrim("/index.html", response.clone()).then(() => caches.open(CACHE_NAME)).then(precacheBuild).catch((err) => console.warn("Precaching the build failed:", err))
          );
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return await cache.match("/index.html") || await cache.match("/");
      })
    );
    return;
  }
  if (NETWORK_FIRST.some((path) => new URL(e.request.url).pathname.endsWith(path))) {
    e.respondWith(
      fetch(e.request).then((response) => {
        if (response.status === 200) {
          e.waitUntil(putAndTrim(e.request, response.clone()));
        }
        return response;
      }).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        const hit = await cache.match(e.request);
        if (hit) return hit;
        throw new Error("offline and no cached copy");
      })
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        e.waitUntil(
          fetch(e.request).then((response) => {
            if (response.status === 200) return putAndTrim(e.request, response);
          }).catch(() => {
          })
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
