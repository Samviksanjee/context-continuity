const CACHE_NAME = "contextos-shell-v1";
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
  event.waitUntil(caches.keys().then((names) => Promise.all(names.filter((name) => name.startsWith("contextos-shell-") && name !== CACHE_NAME).map((name) => caches.delete(name)))).then(() => self.clients.claim()));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/__manus__/")) return;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request, { ignoreSearch: request.mode === "navigate" });
    if (cached) return cached;
    try {
      const response = await fetch(request);
      return cacheResponse(cache, request, response);
    } catch {
      if (request.mode === "navigate") return (await cache.match("/")) || Response.error();
      return Response.error();
    }
  })());
});
