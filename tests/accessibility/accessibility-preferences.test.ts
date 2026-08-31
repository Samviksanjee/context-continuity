import { describe, it, expect } from "vitest";
import {
  defaultPreferences,
  serializePreferences,
  deserializePreferences,
  adaptPresentation,
} from "../../client/src/lib/accessibilityPreferences";

// A11Y-11 — the accessible core preferences travel with the user, not the device.
describe("accessibility preferences core", () => {
  it("round-trips through serialization", () => {
    const prefs = { largerText: true, highContrast: false, reduceMotion: true, voicePreferred: true };
    expect(deserializePreferences(serializePreferences(prefs))).toEqual(prefs);
  });

  it("falls back to defaults on a corrupt blob", () => {
    expect(deserializePreferences("{not json")).toEqual(defaultPreferences);
  });

  it("adapts presentation from preferences", () => {
    const adapted = adaptPresentation({ largerText: true, highContrast: true, reduceMotion: false, voicePreferred: true });
    expect(adapted.fontScale).toBeGreaterThan(1);
    expect(adapted.highContrast).toBe(true);
    expect(adapted.primaryInput).toBe("voice");
  });

  it("maps defaults to a neutral presentation", () => {
    const adapted = adaptPresentation(defaultPreferences);
    expect(adapted.fontScale).toBe(1);
    expect(adapted.primaryInput).toBe("pointer");
  });
});
