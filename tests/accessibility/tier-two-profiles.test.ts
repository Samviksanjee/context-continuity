import { describe, it, expect } from "vitest";
import { tierTwoProfiles, isActionAllowed, requiresVoice, type TierTwoId } from "../../client/src/lib/tierTwoProfiles";

// Task 16 — Tier-2 profiles adapt shared intents with safety constraints.
describe("Tier-2 device profiles", () => {
  it("locks out capture and graph manipulation on a moving vehicle", () => {
    expect(isActionAllowed("vehicle", "capture", { inMotion: true })).toBe(false);
    expect(isActionAllowed("vehicle", "manipulateGraph", { inMotion: true })).toBe(false);
    expect(isActionAllowed("vehicle", "review", { inMotion: true })).toBe(true);
  });

  it("allows capture on a stationary vehicle", () => {
    expect(isActionAllowed("vehicle", "capture", { inMotion: false })).toBe(true);
  });

  it("gives the kiosk a timeout warning", () => {
    expect(tierTwoProfiles.kiosk.timeoutWarning).toBe(true);
  });

  it("never requires voice on any profile", () => {
    (Object.keys(tierTwoProfiles) as TierTwoId[]).forEach((id) => {
      expect(requiresVoice(id)).toBe(false);
      expect(tierTwoProfiles[id].voiceOptional).toBe(true);
    });
  });

  it("defines the expected focus and lockout models", () => {
    expect(tierTwoProfiles.tv.focusModel).toBe("remote");
    expect(tierTwoProfiles.vehicle.inMotionLockout).toBe(true);
  });
});
