import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const sw = readFileSync(resolve(repoRoot, "client/public/sw.js"), "utf8");

// PWA lifecycle: updates must not be trapped behind a stale service-worker cache.
describe("service worker freshness + versioning", () => {
  it("uses a versioned cache name", () => {
    expect(sw).toMatch(/CACHE_VERSION\s*=/);
    expect(sw).toContain("contextos-shell-${CACHE_VERSION}");
  });

  it("cleans old caches and takes control on activate", () => {
    expect(sw).toContain("caches.delete");
    expect(sw).toContain("clients.claim");
    expect(sw).toContain("skipWaiting");
  });

  it("serves navigations network-first so redeploys are not cache-trapped", () => {
    expect(sw).toMatch(/network-first/i);
    expect(sw).toContain("handleNavigation");
    expect(sw).toContain('request.mode === "navigate"');
  });

  it("caches only same-origin GET requests", () => {
    expect(sw).toContain('request.method !== "GET"');
    expect(sw).toContain("url.origin !== self.location.origin");
  });
});
