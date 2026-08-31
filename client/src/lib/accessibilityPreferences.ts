/* The accessible core: the user's accessibility preferences belong to the user,
 * not a device. Pure and framework-free so the same model drives every platform
 * and can be handed off between the user's own devices. */

export interface AccessibilityPreferences {
  largerText: boolean;
  highContrast: boolean;
  reduceMotion: boolean;
  voicePreferred: boolean;
}

export const defaultPreferences: AccessibilityPreferences = {
  largerText: false,
  highContrast: false,
  reduceMotion: false,
  voicePreferred: false,
};

export function serializePreferences(preferences: AccessibilityPreferences): string {
  return JSON.stringify(preferences);
}

export function deserializePreferences(blob: string): AccessibilityPreferences {
  try {
    const parsed = JSON.parse(blob) as Partial<AccessibilityPreferences>;
    return { ...defaultPreferences, ...parsed };
  } catch {
    return { ...defaultPreferences };
  }
}

export interface PresentationAdaptation {
  fontScale: number;
  highContrast: boolean;
  reduceMotion: boolean;
  primaryInput: "voice" | "pointer";
}

/** Maps preferences to a platform-neutral presentation any device can apply. */
export function adaptPresentation(preferences: AccessibilityPreferences): PresentationAdaptation {
  return {
    fontScale: preferences.largerText ? 1.35 : 1,
    highContrast: preferences.highContrast,
    reduceMotion: preferences.reduceMotion,
    primaryInput: preferences.voicePreferred ? "voice" : "pointer",
  };
}
