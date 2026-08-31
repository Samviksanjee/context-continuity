import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");
const panel = readFileSync(resolve(repoRoot, "client/src/components/ContinuityPanel.tsx"), "utf8");
const catalog = readFileSync(resolve(repoRoot, "client/src/lib/i18n.ts"), "utf8");

// A11Y-11 / A11Y-12 — continuity surface is rendered, accessible, catalog-driven.
describe("continuity UI surface", () => {
  it("is rendered on the page", () => {
    expect(home).toContain("import ContinuityPanel");
    expect(home).toContain("<ContinuityPanel");
  });

  it("wires the tested foundations and the i18n catalog", () => {
    expect(panel).toContain("ContinuityManager");
    expect(panel).toContain("adaptPresentation");
    expect(panel).toContain("translate");
  });

  it("is accessibly structured with a status region and grouped preferences", () => {
    expect(panel).toContain('role="status"');
    expect(panel).toContain("<fieldset");
    expect(panel).toContain("<legend");
  });

  it("clearly marks the sync as a non-production prototype (in the catalog)", () => {
    expect(catalog).toMatch(/simulator/i);
    expect(catalog).toMatch(/not production end-to-end encryption/i);
    expect(panel).toContain("continuity.prototypeNote");
  });
});
