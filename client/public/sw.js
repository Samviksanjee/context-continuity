/* ContextOS service worker (local-first PWA).
 *
 * Freshness/versioning strategy so product + accessibility updates are not
 * trapped behind a stale cache:
 *  - Navigations are NETWORK-FIRST: a new deploy's HTML is fetched when online
 *    (and the cached shell is refreshed), falling back to the cached shell when
 *    offline. This is what lets redeploys appear without a manual cache bump.
 *  - Hashed build assets are CACHE-FIRST: their filenames change every build,
 *    so serving a cached copy is always correct and fast.
 *  - Bump CACHE_VERSION on release to evict stale asset caches on activate.
 *  - Only same-origin GET is cached; no cross-origin, no non-GET, no dev logs. */
const CACHE_VERSION = "v2";
const CACHE_NAME = `contextos-shell-${CACHE_VERSION}`;
const CORE_PATHS = ["/", "/manifest.webmanifest", "/icon-192.png", "/icon-512.png"];

async function cacheResponse(cache, request, response) {
  if (response && (response.ok || response.type === "opaque")) await cache.put(request, response.clone());
  return response;
}

async function cacheShell() {
  const cache = await caches.open(CACHE_NAME);
  const rootResponse = await fetch("/", { cache: "reload" });
  await cacheResponse(cache, "/", rootResponse);
  const html = await rootResponse.clone().text();
  const assets = [...html.matchAll(/(?:src|href)=["'](\/(?:assets\/[^"']+|manifest\.webmanifest|icon-[^"']+))["']/g)].map((match) => match[1]);
  await Promise.all([...new Set([...CORE_PATHS, ...assets])].map(async (path) => {
    try { await cacheResponse(cache, path, await fetch(path, { cache: "reload" })); } catch { /* A missing optional asset must not block installation. */ }
  }));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheShell().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) => Promise.all(names.filter((name) => name.startsWith("contextos-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name))))
      .then(() => self.clients.claim()),
  );
});

// Network-first for navigations: fresh HTML online, cached shell offline.
async function handleNavigation(request, cache) {
  try {
    const response = await fetch(request);
    await cacheResponse(cache, "/", response.clone());
    return response;
  } catch {
    return (await cache.match("/", { ignoreSearch: true })) || Response.error();
  }
}

// Cache-first for hashed static assets: fast, and safe because names change per build.
async function handleAsset(request, cache) {
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    return await cacheResponse(cache, request, await fetch(request));
  } catch {
    return Response.error();
  }
}

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/__manus__/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    return request.mode === "navigate" ? handleNavigation(request, cache) : handleAsset(request, cache);
  })());
});
