import { describe, it, expect } from "vitest";
import { ContinuityManager } from "../../client/src/lib/continuityManager";

// A11Y-11 — preferences hand off between the user's own devices, with revocation.
describe("continuity manager", () => {
  function seeded() {
    const manager = new ContinuityManager();
    manager.enrollDevice("phone", "This phone");
    manager.enrollDevice("laptop", "Your laptop");
    return manager;
  }

  it("hands off preferences from one device to another", () => {
    const manager = seeded();
    expect(
      manager.setPreferences("phone", { largerText: true, highContrast: false, reduceMotion: false, voicePreferred: true }),
    ).toBe(true);
    manager.receiveHandoff("laptop");
    const received = manager.preferencesFor("laptop");
    expect(received.largerText).toBe(true);
    expect(received.voicePreferred).toBe(true);
  });

  it("lists the user's enrolled devices", () => {
    expect(seeded().listDevices()).toHaveLength(2);
  });

  it("blocks a revoked device from writing preferences", () => {
    const manager = seeded();
    manager.revoke("phone");
    expect(manager.isRevoked("phone")).toBe(true);
    expect(
      manager.setPreferences("phone", { largerText: true, highContrast: false, reduceMotion: false, voicePreferred: false }),
    ).toBe(false);
  });

  it("keeps local guest identity available", () => {
    expect(seeded().identity().guestAvailable).toBe(true);
  });
});
