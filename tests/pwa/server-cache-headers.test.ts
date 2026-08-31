import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import type { AddressInfo } from "node:net";
import type { Server } from "node:http";
import { cacheControlFor, createApp } from "../../server/app";

// The service worker is network-first for navigations, so the *HTTP* layer must
// not trap redeploys: entry points are no-cache, hashed assets are immutable.
describe("static server cache policy", () => {
  it("marks entry points no-cache so a redeploy is picked up immediately", () => {
    expect(cacheControlFor("/srv/public/sw.js")).toBe("no-cache");
    expect(cacheControlFor("/srv/public/index.html")).toBe("no-cache");
    expect(cacheControlFor("/srv/public/manifest.webmanifest")).toBe("no-cache");
  });

  it("marks content-hashed assets immutable for a year", () => {
    expect(cacheControlFor("/srv/public/assets/index-B7tiBURu.js")).toBe("public, max-age=31536000, immutable");
    expect(cacheControlFor("/srv/public/assets/index-DnDWCwUe.css")).toBe("public, max-age=31536000, immutable");
  });

  it("gives other static files a short shared cache", () => {
    expect(cacheControlFor("/srv/public/icon-192.png")).toBe("public, max-age=86400");
  });
});

describe("static server behaviour", () => {
  let server: Server;
  let base: string;
  let dir: string;

  beforeAll(async () => {
    dir = mkdtempSync(join(tmpdir(), "ctxos-static-"));
    writeFileSync(join(dir, "sw.js"), "// service worker\n");
    writeFileSync(join(dir, "index.html"), "<!doctype html><title>ContextOS</title>");
    writeFileSync(join(dir, "manifest.webmanifest"), "{}");
    mkdirSync(join(dir, "assets"));
    writeFileSync(join(dir, "assets", "index-abc123.js"), "console.log(0);\n");
    writeFileSync(join(dir, "icon-192.png"), "png");

    await new Promise<void>((resolve) => {
      server = createApp(dir).listen(0, "127.0.0.1", resolve);
    });
    base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    rmSync(dir, { recursive: true, force: true });
  });

  it("serves sw.js with no-cache", async () => {
    const res = await fetch(`${base}/sw.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-cache");
  });

  it("serves hashed assets as immutable", async () => {
    const res = await fetch(`${base}/assets/index-abc123.js`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("public, max-age=31536000, immutable");
  });

  it("serves the app shell (no-cache) for client-side routes", async () => {
    const res = await fetch(`${base}/continuity`);
    expect(res.status).toBe(200);
    expect(res.headers.get("cache-control")).toBe("no-cache");
    expect(await res.text()).toContain("ContextOS");
  });

  it("returns 404 for a missing asset instead of the HTML shell", async () => {
    const res = await fetch(`${base}/assets/missing-xyz.js`);
    expect(res.status).toBe(404);
  });
});
