import express, { type Express } from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Location of the built PWA.
 *
 * In production the server is bundled to `dist/index.js` (see the `build`
 * script) and serves its sibling `dist/public`. In dev/test the source module
 * lives in `server/`, so it resolves the repo's `dist/public`.
 */
export function resolveStaticPath(): string {
  return process.env.NODE_ENV === "production"
    ? path.resolve(__dirname, "public")
    : path.resolve(__dirname, "..", "dist", "public");
}

/**
 * Cache policy that keeps PWA + accessibility updates fresh end-to-end.
 *
 * The service worker is network-first for navigations, but the browser HTTP
 * cache sits between the worker and the network — so the entry points must not
 * be HTTP-cached or a redeploy can still be served stale:
 *  - `sw.js` / `index.html` / `manifest.webmanifest`: `no-cache` (always
 *    revalidate; the service-worker update check depends on `sw.js` being
 *    revalidated on every navigation).
 *  - `/assets/*`: content-hashed by the build, so they are safe to cache
 *    immutably for a year.
 *  - everything else (icons, etc.): a short shared cache.
 */
export function cacheControlFor(filePath: string): string {
  const base = path.basename(filePath);
  const parent = path.basename(path.dirname(filePath));
  if (base === "sw.js" || base === "index.html" || base === "manifest.webmanifest") {
    return "no-cache";
  }
  if (parent === "assets") {
    return "public, max-age=31536000, immutable";
  }
  return "public, max-age=86400";
}

/**
 * Build the static-file Express app. Exported (rather than started inline) so
 * tests can exercise it against a fixture directory without opening a socket,
 * and so importing this module has no side effects.
 */
export function createApp(staticPath: string = resolveStaticPath()): Express {
  const app = express();

  app.use(
    express.static(staticPath, {
      setHeaders: (res, filePath) => {
        res.setHeader("Cache-Control", cacheControlFor(filePath));
      },
    }),
  );

  // Client-side routing: serve the app shell for real navigations only. A
  // request that looks like a missing static asset (it has a file extension)
  // gets a genuine 404 instead of the HTML shell, so a renamed/stale bundle is
  // never silently served as HTML (which would break as a script/style load).
  app.get("*", (req, res) => {
    if (path.extname(req.path)) {
      res.status(404).end();
      return;
    }
    res.sendFile(path.join(staticPath, "index.html"), {
      headers: { "Cache-Control": "no-cache" },
    });
  });

  return app;
}
