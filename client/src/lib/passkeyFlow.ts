/* Optional passkey identity as a PURE state machine (A11Y-11 / Task 14).
 * Invariants: local guest use is never blocked; an unavailable authenticator
 * degrades gracefully; cancellation is always safe; a non-QR manual pairing
 * path exists; and recovery never silently downgrades E2EE. No WebAuthn/DOM. */

export type PasskeyState =
  | "guest"
  | "unsupported"
  | "enrolling"
  | "enrolled"
  | "cancelled"
  | "recovering"
  | "recovered"
  | "error";

export type PasskeyEvent =
  | { type: "START_ENROLL" }
  | { type: "AUTHENTICATOR_UNAVAILABLE" }
  | { type: "CANCEL" }
  | { type: "ENROLL_SUCCESS" }
  | { type: "START_RECOVERY" }
  | { type: "RECOVERY_SUCCESS" }
  | { type: "USE_MANUAL_CODE" }
  | { type: "ERROR"; message?: string }
  | { type: "RESET_TO_GUEST" };

export interface PasskeyContext {
  state: PasskeyState;
  guestAvailable: boolean;
  e2eeDowngraded: boolean;
  usedManualPairing: boolean;
  error?: string;
}

export function initialContext(): PasskeyContext {
  return { state: "guest", guestAvailable: true, e2eeDowngraded: false, usedManualPairing: false };
}

export function reduce(context: PasskeyContext, event: PasskeyEvent): PasskeyContext {
  // Local guest access is never blocked, in any state.
  const base: PasskeyContext = { ...context, guestAvailable: true };
  switch (event.type) {
    case "START_ENROLL":
      return { ...base, state: "enrolling", error: undefined };
    case "AUTHENTICATOR_UNAVAILABLE":
      return { ...base, state: "unsupported" };
    case "CANCEL":
      return { ...base, state: "guest", error: undefined };
    case "ENROLL_SUCCESS":
      return { ...base, state: "enrolled" };
    case "USE_MANUAL_CODE":
      // Non-QR pairing path; keep enrolling if we were in guest.
      return { ...base, usedManualPairing: true, state: context.state === "guest" ? "enrolling" : context.state };
    case "START_RECOVERY":
      return { ...base, state: "recovering" };
    case "RECOVERY_SUCCESS":
      // Recovery must never silently weaken end-to-end encryption.
      return { ...base, state: "recovered", e2eeDowngraded: false };
    case "ERROR":
      return { ...base, state: "error", error: event.message };
    case "RESET_TO_GUEST":
      return { ...base, state: "guest", error: undefined };
    default: {
      const exhaustive: never = event;
      return exhaustive;
    }
  }
}
