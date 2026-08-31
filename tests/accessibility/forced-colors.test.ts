import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const css = readFileSync(resolve(repoRoot, "client/src/index.css"), "utf8");

// A11Y-04 — forced-colors / Windows High Contrast keeps focus + selection visible.
describe("A11Y-04 forced-colors support", () => {
  it("declares a forced-colors media block", () => {
    expect(css).toContain("@media (forced-colors: active)");
  });

  it("uses system colors so focus and selection are not lost", () => {
    expect(css).toMatch(/forced-colors: active[\s\S]*Highlight/);
  });
});
