import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

// A11Y-05/07 — camera capture is an accessible dialog with focus management.
// Static guards; behavioral focus/AT checks belong to the browser/participant layer.
describe("Web camera capture is an accessible dialog", () => {
  it("exposes dialog semantics", () => {
    expect(home).toContain('role="dialog"');
    expect(home).toContain('aria-modal="true"');
  });

  it("manages focus for open (capture control) and close (trigger)", () => {
    expect(home).toContain("captureFrameButtonRef");
    expect(home).toContain("cameraButtonRef");
    expect(home).toContain("cameraButtonRef.current?.focus()");
  });

  it("keeps the capture status as a live region", () => {
    expect(home).toMatch(/capture-status"\s+role="status"\s+aria-live="polite"/);
  });
});
