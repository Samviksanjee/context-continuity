import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");

// A11Y-10 — privacy and data control: storage messaging must be truthful.
// Mapped threads persist to localStorage, so they are not "session only".
describe("A11Y-10 truthful local retention copy", () => {
  it("does not claim persisted context lasts only for the browser session", () => {
    expect(home).not.toMatch(/this browser session only/i);
    expect(home).not.toMatch(/remain in this browser session/i);
  });
});
