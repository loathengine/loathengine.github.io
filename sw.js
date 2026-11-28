const CACHE_NAME = "empirical-precision-v10";
const MAX_ENTRIES = 100;
const API_ORIGIN = "https://db.empiricalprecision.com";
const API_CACHEABLE_PREFIXES = [
	"/api/v1/calibration",
	"/api/v1/burn-chart",
	"/api/v1/snapshot/library"
];
const ASSETS = [
	"/",
	"/index.html",
	"/favicon.svg",
	"/manifest.json"
];
const BUILD_MANIFEST = "/build-manifest.json";
let activeBuildAssets = new Set();
function isCacheableApiUrl(url) {
	return url.origin === API_ORIGIN && API_CACHEABLE_PREFIXES.some((prefix) => url.pathname === prefix || url.pathname.startsWith(`${prefix}/`));
}
self.addEventListener("install", (e) => {
	e.waitUntil(caches.open(CACHE_NAME).then(async (cache) => {
		await Promise.all(ASSETS.map(async (path) => {
			const res = await fetch(path, { cache: "no-store" });
			if (!res.ok) throw new Error(`${path}: HTTP ${res.status}`);
			await cache.put(path, res);
		}));
		await precacheBuild(cache);
	}));
	self.skipWaiting();
});
self.addEventListener("activate", (e) => {
	e.waitUntil(caches.keys().then((keys) => Promise.all(keys.map((key) => key !== CACHE_NAME ? caches.delete(key) : undefined))).then(() => self.clients.claim()));
});
async function getProtectedBuildAssets(cache) {
	if (activeBuildAssets.size > 0) return activeBuildAssets;
	try {
		const manifestRes = await cache.match(BUILD_MANIFEST);
		if (manifestRes) {
			const parsed = await manifestRes.json();
			if (Array.isArray(parsed?.assets)) {
				activeBuildAssets = new Set(parsed.assets.filter((p) => typeof p === "string"));
			}
		}
	} catch {}
	return activeBuildAssets;
}
async function trimCache(cache, knownBuildAssets) {
	const keys = await cache.keys();
	if (keys.length <= MAX_ENTRIES) return;
	const buildAssets = knownBuildAssets || await getProtectedBuildAssets(cache);
	const protectedPaths = new Set([
		...ASSETS,
		BUILD_MANIFEST,
		...buildAssets
	]);
	const evictable = keys.filter((k) => {
		const parsed = new URL(k.url);
		if (isCacheableApiUrl(parsed)) return false;
		return !protectedPaths.has(parsed.pathname);
	});
	const excess = keys.length - MAX_ENTRIES;
	for (const key of evictable.slice(0, excess)) {
		await cache.delete(key);
	}
}
async function precacheBuild(cache, { trim = true } = {}) {
	const res = await fetch(BUILD_MANIFEST, { cache: "no-store" });
	if (!res.ok) throw new Error(`${BUILD_MANIFEST}: HTTP ${res.status}`);
	const manifestCopy = res.clone();
	const { assets } = await res.json();
	if (!Array.isArray(assets)) throw new Error(`${BUILD_MANIFEST}: no assets list`);
	const validAssets = assets.filter((p) => typeof p === "string");
	await Promise.all(validAssets.map(async (path) => {
		if (await cache.match(path)) return;
		const response = await fetch(path);
		if (!response.ok) throw new Error(`${path}: HTTP ${response.status}`);
		await cache.put(path, response);
	}));
	await cache.put(BUILD_MANIFEST, manifestCopy);
	activeBuildAssets = new Set(validAssets);
	if (trim) await trimCache(cache, activeBuildAssets);
	return activeBuildAssets;
}
async function updateShellAndBuild() {
	const cache = await caches.open(CACHE_NAME);
	const rootRes = await fetch("/index.html", { cache: "no-store" });
	if (rootRes.status !== 200 || rootRes.redirected) return;
	const currentAssets = await precacheBuild(cache, { trim: false });
	await Promise.all([cache.put("/index.html", rootRes.clone()), cache.put("/", rootRes)]);
	await trimCache(cache, currentAssets);
}
async function putAndTrim(request, response) {
	const cache = await caches.open(CACHE_NAME);
	await cache.put(request, response);
	await trimCache(cache);
}
self.addEventListener("fetch", (e) => {
	if (e.request.method !== "GET") return;
	const url = new URL(e.request.url);
	if (isCacheableApiUrl(url)) {
		e.respondWith(fetch(e.request).then((response) => {
			if (response.status === 200) {
				e.waitUntil(putAndTrim(e.request, response.clone()));
			}
			return response;
		}).catch(async () => {
			const cache = await caches.open(CACHE_NAME);
			const hit = await cache.match(e.request);
			if (hit) return hit;
			throw new Error("offline and no cached API snapshot");
		}));
		return;
	}
	if (url.origin !== self.location.origin) return;
	const { pathname } = url;
	if (pathname === "/load-data" || pathname.startsWith("/load-data/") || pathname === "/books" || pathname.startsWith("/books/") || pathname === "/sitemap.xml" || pathname === "/robots.txt") {
		return;
	}
	if (e.request.mode === "navigate") {
		e.respondWith(fetch(e.request).then((response) => {
			const responseOrigin = response.url ? new URL(response.url).origin : self.location.origin;
			if (response.status === 200 && responseOrigin === self.location.origin) {
				e.waitUntil(updateShellAndBuild().catch((err) => console.warn("Precaching the build failed:", err)));
			}
			return response;
		}).catch(async () => {
			const cache = await caches.open(CACHE_NAME);
			const cached = await cache.match("/index.html") || await cache.match("/");
			if (cached) return cached;
			throw new Error("offline and no cached app shell");
		}));
		return;
	}
	if (pathname.startsWith("/assets/")) {
		e.respondWith(caches.open(CACHE_NAME).then((cache) => cache.match(e.request).then((cachedResponse) => {
			if (cachedResponse) return cachedResponse;
			return fetch(e.request).then((response) => {
				if (response.status === 200) {
					e.waitUntil(putAndTrim(e.request, response.clone()));
				}
				return response;
			});
		})));
		return;
	}
	e.respondWith(caches.open(CACHE_NAME).then((cache) => cache.match(e.request).then((cachedResponse) => {
		if (cachedResponse) {
			e.waitUntil(fetch(e.request).then((response) => {
				if (response.status === 200) return putAndTrim(e.request, response);
			}).catch(() => {}));
			return cachedResponse;
		}
		return fetch(e.request).then((response) => {
			if (response.status === 200) {
				e.waitUntil(putAndTrim(e.request, response.clone()));
			}
			return response;
		});
	})));
});
