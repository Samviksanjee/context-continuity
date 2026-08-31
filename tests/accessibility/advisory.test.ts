import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseConfidence, confidenceBand, uncertaintyPhrase } from "../../client/src/lib/advisory";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");
const mainActivity = readFileSync(
  resolve(repoRoot, "android-contextos/app/src/main/java/ai/contextos/MainActivity.kt"),
  "utf8",
);

// A11Y-09 — uncertainty is derived in plain language without false precision.
describe("A11Y-09 advisory model", () => {
  it("parses varied confidence encodings", () => {
    expect(parseConfidence("94%")).toBe(94);
    expect(parseConfidence(0.9)).toBe(90);
    expect(parseConfidence(87)).toBe(87);
    expect(parseConfidence("")).toBeUndefined();
    expect(parseConfidence(undefined)).toBeUndefined();
  });

  it("bands confidence sensibly", () => {
    expect(confidenceBand(90)).toBe("high");
    expect(confidenceBand(70)).toBe("moderate");
    expect(confidenceBand(40)).toBe("low");
    expect(confidenceBand(undefined)).toBe("unknown");
  });

  it("produces plain-language uncertainty without a raw percentage", () => {
    for (const value of [95, 70, 30, undefined]) {
      const phrase = uncertaintyPhrase(value);
      expect(phrase.length).toBeGreaterThan(0);
      expect(phrase).not.toMatch(/\d/);
    }
  });
});

// A11Y-09 — both platforms present suggestions as advisory, never auto-executed.
describe("A11Y-09 advisory presentation", () => {
  it("web frames the suggestion as advisory with a dismiss control", () => {
    expect(home).toContain("uncertaintyPhrase");
    expect(home).toContain("No action is taken automatically");
    expect(home).toContain("function dismissSuggestion");
  });

  it("android shows an advisory caption", () => {
    expect(mainActivity).toContain("No action is taken automatically");
  });
});
