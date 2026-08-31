/* Continuity Manager: local-first orchestration that carries the user's
 * accessibility preferences between their own devices, with consent and
 * revocation. It composes the tested sync SIMULATOR and passkey flow.
 *
 * PROTOTYPE: the underlying sync is an in-memory simulator, NOT production
 * end-to-end encryption. It moves no data off the device. */

import { SyncSimulator } from "./syncSimulator";
import {
  type AccessibilityPreferences,
  defaultPreferences,
  deserializePreferences,
  serializePreferences,
} from "./accessibilityPreferences";
import { type PasskeyContext, type PasskeyEvent, initialContext, reduce } from "./passkeyFlow";

const PROFILE_RECORD = "user-accessibility-profile";

export interface ContinuityDevice {
  id: string;
  label: string;
}

export class ContinuityManager {
  private readonly sync = new SyncSimulator();
  private passkey: PasskeyContext = initialContext();
  private readonly devices: ContinuityDevice[] = [];
  private readonly revokedDevices = new Set<string>();

  enrollDevice(id: string, label: string): void {
    if (this.devices.some((device) => device.id === id)) return;
    this.sync.enroll(id, label);
    this.devices.push({ id, label });
  }

  listDevices(): ContinuityDevice[] {
    return this.devices.map((device) => ({ ...device }));
  }

  identity(): PasskeyContext {
    return this.passkey;
  }

  applyPasskeyEvent(event: PasskeyEvent): PasskeyContext {
    this.passkey = reduce(this.passkey, event);
    return this.passkey;
  }

  /** Save the user's preferences on one of their devices. */
  setPreferences(deviceId: string, preferences: AccessibilityPreferences): boolean {
    if (this.revokedDevices.has(deviceId)) return false;
    try {
      this.sync.put(deviceId, PROFILE_RECORD, serializePreferences(preferences));
      return true;
    } catch {
      return false;
    }
  }

  /** Receive the latest handed-off preferences on another of the user's devices. */
  receiveHandoff(deviceId: string): void {
    if (this.revokedDevices.has(deviceId)) return;
    this.sync.pull(deviceId);
  }

  preferencesFor(deviceId: string): AccessibilityPreferences {
    const record = this.sync.getRecord(deviceId, PROFILE_RECORD);
    return record && !record.deleted ? deserializePreferences(record.blob) : { ...defaultPreferences };
  }

  revoke(deviceId: string): void {
    this.revokedDevices.add(deviceId);
    this.sync.revoke(deviceId);
  }

  isRevoked(deviceId: string): boolean {
    return this.revokedDevices.has(deviceId);
  }

  setOnline(deviceId: string, online: boolean): void {
    this.sync.setOnline(deviceId, online);
  }

  hasConflict(): boolean {
    return this.sync.hasConflict(PROFILE_RECORD);
  }

  resolveConflict(winnerDeviceId: string): void {
    this.sync.resolveConflict(PROFILE_RECORD, winnerDeviceId);
  }
}
