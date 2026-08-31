import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

// A11Y-02/03 — the context selector follows the ARIA-APG tabs pattern.
describe("A11Y-02/03 context selector tabs pattern", () => {
  it("declares an orientation and a keyboard handler on the tablist", () => {
    expect(home).toContain('role="tablist"');
    expect(home).toContain('aria-orientation="vertical"');
    expect(home).toContain("onKeyDown={onTabKeyDown}");
  });

  it("uses roving tabindex on the tabs", () => {
    expect(home).toContain("tabIndex={activeMemory.key === memory.key ? 0 : -1}");
  });

  it("links tabs to the panel via aria-controls and id", () => {
    expect(home).toContain('aria-controls="memory-stage-panel"');
    expect(home).toContain('id="memory-stage-panel"');
  });

  it("handles Arrow/Home/End keys", () => {
    expect(home).toContain('"ArrowDown"');
    expect(home).toContain('"Home"');
    expect(home).toContain('"End"');
  });
});
