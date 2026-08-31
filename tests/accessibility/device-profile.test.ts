import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { deriveProfile, gestureHint, type DeviceEnvironment } from "../../client/src/lib/deviceProfile";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const home = readFileSync(resolve(repoRoot, "client/src/pages/Home.tsx"), "utf8");
const moduleSrc = readFileSync(resolve(repoRoot, "client/src/lib/deviceProfile.ts"), "utf8");

const touchEnv: DeviceEnvironment = {
  pointerCoarse: true,
  anyFinePointer: false,
  canHover: false,
  maxTouchPoints: 5,
  standalone: true,
  online: true,
  secureContext: true,
  reducedMotion: false,
  forcedColors: false,
  viewportWidth: 390,
  landscape: false,
};

const desktopEnv: DeviceEnvironment = {
  pointerCoarse: false,
  anyFinePointer: true,
  canHover: true,
  maxTouchPoints: 0,
  standalone: false,
  online: false,
  secureContext: true,
  reducedMotion: true,
  forcedColors: true,
  viewportWidth: 1440,
  landscape: true,
};

// A11Y-13 — capability profile from feature detection, not user-agent sniffing.
describe("A11Y-13 device profile", () => {
  it("derives a touch profile with installed PWA and portrait orientation", () => {
    const profile = deriveProfile(touchEnv);
    expect(profile.pointer).toBe("touch");
    expect(profile.installedPwa).toBe(true);
    expect(profile.orientation).toBe("portrait");
  });

  it("derives a fine-pointer desktop profile and preserves prefs + connectivity", () => {
    const profile = deriveProfile(desktopEnv);
    expect(profile.pointer).toBe("fine");
    expect(profile.reducedMotion).toBe(true);
    expect(profile.forcedColors).toBe(true);
    expect(profile.online).toBe(false);
    expect(profile.orientation).toBe("landscape");
  });

  it("adapts the gesture hint to input capability", () => {
    expect(gestureHint(deriveProfile(touchEnv))).toContain("PINCH");
    expect(gestureHint(deriveProfile(desktopEnv))).not.toContain("PINCH");
  });

  it("never transmits capability or preference data", () => {
    expect(moduleSrc).not.toMatch(/fetch\(|XMLHttpRequest|sendBeacon|axios|navigator\.connection/);
  });

  it("is wired into the page for progressive enhancement", () => {
    expect(home).toContain("readDeviceProfile");
    expect(home).toContain("gestureHint(deviceProfile)");
  });
});
