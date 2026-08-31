import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

// A11Y-12 — the i18n foundation is actually wired into the running UI.
describe("A11Y-12 i18n UI wiring", () => {
  it("imports the i18n helpers", () => {
    expect(home).toContain('from "../lib/i18n"');
  });

  it("sets document language and direction from the app locale at runtime", () => {
    expect(home).toContain("document.documentElement.lang");
    expect(home).toContain("document.documentElement.dir");
    expect(home).toContain("textDirection(APP_LOCALE)");
  });

  it("renders catalog-driven labels through translate", () => {
    expect(home).toContain('translate(enMessages, "capture.note")');
    expect(home).toContain('translate(enMessages, "capture.map")');
    expect(home).toContain('translate(enMessages, "data.clearAll")');
    expect(home).toContain('translate(enMessages, "action.undo")');
  });
});
