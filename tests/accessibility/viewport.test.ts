import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const html = readFileSync(resolve(repoRoot, "client/index.html"), "utf8");
const viewport = html.match(/<meta[^>]*name=["']viewport["'][^>]*>/i)?.[0] ?? "";

// A11Y-04 — visual adaptability. WCAG 2.2 SC 1.4.4 Resize Text and 1.4.10 Reflow.
describe("A11Y-04 viewport allows user zoom", () => {
  it("declares a viewport meta tag", () => {
    expect(viewport).not.toEqual("");
  });

  it("does not cap zoom with maximum-scale", () => {
    expect(viewport).not.toMatch(/maximum-scale/i);
  });

  it("does not disable user scaling", () => {
    expect(viewport).not.toMatch(/user-scalable\s*=\s*(no|0)/i);
  });
});
