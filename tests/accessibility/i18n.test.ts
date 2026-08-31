import { describe, it, expect } from "vitest";
import { translate, textDirection, formatNumber, formatDate, pseudolocalize, enMessages } from "../../client/src/lib/i18n";

// A11Y-12 — localization foundation: interpolation, RTL, formatting, pseudolocale.
describe("A11Y-12 i18n foundation", () => {
  it("interpolates named placeholders", () => {
    expect(translate({ greet: "Hi {name}" }, "greet", { name: "Sam" })).toBe("Hi Sam");
  });

  it("falls back to the id for a missing key", () => {
    expect(translate(enMessages, "does.not.exist")).toBe("does.not.exist");
  });

  it("detects RTL by primary language subtag", () => {
    expect(textDirection("ar")).toBe("rtl");
    expect(textDirection("he-IL")).toBe("rtl");
    expect(textDirection("en")).toBe("ltr");
    expect(textDirection("hi-IN")).toBe("ltr");
  });

  it("pseudolocalizes: brackets, lengthens, preserves placeholders", () => {
    const out = pseudolocalize("Save {count}");
    expect(out.startsWith("[!")).toBe(true);
    expect(out.endsWith("!]")).toBe(true);
    expect(out).toContain("{count}");
    expect(out.length).toBeGreaterThan("Save {count}".length);
  });

  it("formats numbers and dates without throwing on an unknown locale", () => {
    expect(formatNumber(1234.5, "en").length).toBeGreaterThan(0);
    expect(formatDate(0, "en").length).toBeGreaterThan(0);
    expect(() => formatNumber(1, "zz")).not.toThrow();
    expect(() => formatDate(0, "zz")).not.toThrow();
  });
});
