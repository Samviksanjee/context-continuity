/* Tier-2 device reference profiles with safety constraints (Task 16).
 * Logic + data only: how shared intents adapt to constrained devices. Voice may
 * accelerate but is never the sole route, and the vehicle profile locks out
 * capture/graph manipulation while moving. The vehicle profile is a reference
 * model pending human safety sign-off. No DOM/network. */

export type TierTwoId = "tv" | "smartDisplay" | "wearable" | "kiosk" | "vehicle";
export type FocusModel = "directional" | "pointer" | "remote";

export interface TierTwoProfile {
  id: TierTwoId;
  label: string;
  primaryInputs: string[];
  focusModel: FocusModel;
  voiceOptional: boolean;
  timeoutWarning: boolean;
  inMotionLockout: boolean;
  handoffFallback: string;
}

export const tierTwoProfiles: Record<TierTwoId, TierTwoProfile> = {
  tv: {
    id: "tv",
    label: "TV / remote display",
    primaryInputs: ["remote", "dpad", "voice"],
    focusModel: "remote",
    voiceOptional: true,
    timeoutWarning: false,
    inMotionLockout: false,
    handoffFallback: "Continue on an approved phone or keyboard",
  },
  smartDisplay: {
    id: "smartDisplay",
    label: "Smart display",
    primaryInputs: ["touch", "voice", "dpad"],
    focusModel: "directional",
    voiceOptional: true,
    timeoutWarning: false,
    inMotionLockout: false,
    handoffFallback: "On-screen text with touch and remote controls",
  },
  wearable: {
    id: "wearable",
    label: "Wearable",
    primaryInputs: ["touch", "crown", "voice"],
    focusModel: "directional",
    voiceOptional: true,
    timeoutWarning: false,
    inMotionLockout: false,
    handoffFallback: "Hand off to a larger approved device",
  },
  kiosk: {
    id: "kiosk",
    label: "Kiosk / appliance",
    primaryInputs: ["touch", "hardware"],
    focusModel: "pointer",
    voiceOptional: true,
    timeoutWarning: true,
    inMotionLockout: false,
    handoffFallback: "Staff/help path that does not expose user data",
  },
  vehicle: {
    id: "vehicle",
    label: "Vehicle display",
    primaryInputs: ["hardware", "dpad", "voice"],
    focusModel: "directional",
    voiceOptional: true,
    timeoutWarning: false,
    inMotionLockout: true,
    handoffFallback: "Defer safely or hand off to a phone",
  },
};

export type DeviceAction = "capture" | "manipulateGraph" | "review" | "confirmAction";

export interface ActionContext {
  inMotion?: boolean;
}

/** While a vehicle is moving, only passive review is allowed. */
export function isActionAllowed(id: TierTwoId, action: DeviceAction, context: ActionContext = {}): boolean {
  const profile = tierTwoProfiles[id];
  if (profile.inMotionLockout && context.inMotion === true) {
    return action === "review";
  }
  return true;
}

/** Voice may accelerate interaction but is never the sole route on any profile. */
export function requiresVoice(_id: TierTwoId): boolean {
  return false;
}
