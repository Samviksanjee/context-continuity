/* Web device-capability layer (A11Y-13). Progressive enhancement from feature
 * detection, never user-agent sniffing. Accessibility preferences (reduced
 * motion, forced colors) are read locally for adaptation only and are never
 * serialized or transmitted, mirroring the Android capability detector. */

export type PointerKind = "touch" | "fine" | "unknown";
export type Orientation = "portrait" | "landscape";

export interface DeviceEnvironment {
  pointerCoarse: boolean;
  anyFinePointer: boolean;
  canHover: boolean;
  maxTouchPoints: number;
  standalone: boolean;
  online: boolean;
  secureContext: boolean;
  reducedMotion: boolean;
  forcedColors: boolean;
  viewportWidth: number;
  landscape: boolean;
}

export interface DeviceProfile {
  pointer: PointerKind;
  hasHover: boolean;
  touchPoints: number;
  installedPwa: boolean;
  online: boolean;
  secureContext: boolean;
  orientation: Orientation;
  viewportWidth: number;
  reducedMotion: boolean;
  forcedColors: boolean;
}

/** Pure: derive a normalized profile from an environment snapshot. */
export function deriveProfile(env: DeviceEnvironment): DeviceProfile {
  const pointer: PointerKind = env.pointerCoarse
    ? "touch"
    : env.anyFinePointer
      ? "fine"
      : env.maxTouchPoints > 0
        ? "touch"
        : "unknown";
  return {
    pointer,
    hasHover: env.canHover,
    touchPoints: Math.max(0, Math.floor(env.maxTouchPoints)),
    installedPwa: env.standalone,
    online: env.online,
    secureContext: env.secureContext,
    orientation: env.landscape ? "landscape" : "portrait",
    viewportWidth: Math.max(0, Math.floor(env.viewportWidth)),
    reducedMotion: env.reducedMotion,
    forcedColors: env.forcedColors,
  };
}

/** Progressive-enhancement hint: adapt spatial interaction guidance to input. */
export function gestureHint(profile: DeviceProfile): string {
  switch (profile.pointer) {
    case "touch":
      return "PINCH TO ZOOM · DRAG TO PAN";
    case "fine":
      return "SCROLL OR + / − TO ZOOM · DRAG TO PAN";
    default:
      return "USE + / − TO ZOOM · DRAG TO PAN";
  }
}

function matchesMedia(query: string): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia(query).matches;
  } catch {
    return false;
  }
}

/** Browser adapter: read the environment via feature detection (no UA sniffing). */
export function readEnvironment(): DeviceEnvironment {
  if (typeof window === "undefined") {
    return {
      pointerCoarse: false,
      anyFinePointer: true,
      canHover: true,
      maxTouchPoints: 0,
      standalone: false,
      online: true,
      secureContext: true,
      reducedMotion: false,
      forcedColors: false,
      viewportWidth: 1024,
      landscape: true,
    };
  }
  const nav = window.navigator;
  const standalone =
    matchesMedia("(display-mode: standalone)") ||
    (nav as unknown as { standalone?: boolean }).standalone === true;
  const width = window.innerWidth || 0;
  const height = window.innerHeight || 0;
  return {
    pointerCoarse: matchesMedia("(pointer: coarse)"),
    anyFinePointer: matchesMedia("(any-pointer: fine)"),
    canHover: matchesMedia("(hover: hover)"),
    maxTouchPoints: nav?.maxTouchPoints ?? 0,
    standalone,
    online: nav?.onLine ?? true,
    secureContext: typeof window.isSecureContext === "boolean" ? window.isSecureContext : true,
    reducedMotion: matchesMedia("(prefers-reduced-motion: reduce)"),
    forcedColors: matchesMedia("(forced-colors: active)"),
    viewportWidth: width,
    landscape: width >= height,
  };
}

export function readDeviceProfile(): DeviceProfile {
  return deriveProfile(readEnvironment());
}
