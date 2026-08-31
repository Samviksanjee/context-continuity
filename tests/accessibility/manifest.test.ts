import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const manifest = JSON.parse(
  readFileSync(resolve(repoRoot, "client/public/manifest.webmanifest"), "utf8"),
) as { orientation?: string };

// A11Y-04 — visual adaptability. WCAG 2.2 SC 1.3.4 Orientation.
describe("A11Y-04 installed app does not lock orientation", () => {
  const lockedValues = [
    "portrait",
    "portrait-primary",
    "portrait-secondary",
    "landscape",
    "landscape-primary",
    "landscape-secondary",
  ];

  it("uses 'any' or leaves orientation unset", () => {
    expect(lockedValues).not.toContain(manifest.orientation);
  });
});
