import { describe, it, expect } from "vitest";
import { initialContext, reduce, type PasskeyEvent } from "../../client/src/lib/passkeyFlow";

// A11Y-11 — optional passkeys must never block local guest use or weaken E2EE.
describe("A11Y-11 passkey flow", () => {
  it("starts in guest with guest available", () => {
    const context = initialContext();
    expect(context.state).toBe("guest");
    expect(context.guestAvailable).toBe(true);
  });

  it("keeps guest available across sampled transitions", () => {
    const events: PasskeyEvent[] = [
      { type: "START_ENROLL" },
      { type: "AUTHENTICATOR_UNAVAILABLE" },
      { type: "CANCEL" },
      { type: "START_ENROLL" },
      { type: "ENROLL_SUCCESS" },
      { type: "START_RECOVERY" },
      { type: "RECOVERY_SUCCESS" },
      { type: "ERROR", message: "x" },
    ];
    let context = initialContext();
    for (const event of events) {
      context = reduce(context, event);
      expect(context.guestAvailable).toBe(true);
    }
  });

  it("degrades to unsupported but usable when no authenticator is present", () => {
    let context = reduce(initialContext(), { type: "START_ENROLL" });
    context = reduce(context, { type: "AUTHENTICATOR_UNAVAILABLE" });
    expect(context.state).toBe("unsupported");
    expect(context.guestAvailable).toBe(true);
  });

  it("returns to guest on cancel", () => {
    let context = reduce(initialContext(), { type: "START_ENROLL" });
    context = reduce(context, { type: "CANCEL" });
    expect(context.state).toBe("guest");
  });

  it("supports a non-QR manual pairing path", () => {
    const context = reduce(initialContext(), { type: "USE_MANUAL_CODE" });
    expect(context.usedManualPairing).toBe(true);
  });

  it("never downgrades E2EE during recovery", () => {
    let context = reduce(initialContext(), { type: "START_RECOVERY" });
    context = reduce(context, { type: "RECOVERY_SUCCESS" });
    expect(context.state).toBe("recovered");
    expect(context.e2eeDowngraded).toBe(false);
  });
});
