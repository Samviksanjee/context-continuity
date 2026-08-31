import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

// A11Y-10 — the web can review, delete, clear, and undo local threads.
describe("A11Y-10 web data control", () => {
  it("provides per-thread and clear-all deletion", () => {
    expect(home).toContain("function forgetMemory");
    expect(home).toContain("function clearAllMemories");
    // The clear-all control is rendered from the i18n catalog (see i18n-wiring test).
    expect(home).toContain('translate(enMessages, "data.clearAll")');
  });

  it("makes deletion reversible with undo", () => {
    expect(home).toContain("function undoDelete");
    expect(home).toContain("setUndoMemories");
  });

  it("announces governance changes politely", () => {
    expect(home).toMatch(/memory-governance-notice"\s+role="status"\s+aria-live="polite"/);
  });
});
