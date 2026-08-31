import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const spec = readFileSync(resolve(repoRoot, "docs/ACCESSIBILITY.md"), "utf8");

// The executable acceptance matrix must document every requirement id it governs.
describe("Accessibility acceptance matrix is complete", () => {
  for (let n = 1; n <= 14; n += 1) {
    const id = `A11Y-${String(n).padStart(2, "0")}`;
    it(`documents ${id}`, () => {
      expect(spec).toContain(id);
    });
  }

  it("states the WCAG 2.2 AA conformance target", () => {
    expect(spec).toMatch(/WCAG 2\.2/i);
    expect(spec).toMatch(/\bAA\b/);
  });
});
