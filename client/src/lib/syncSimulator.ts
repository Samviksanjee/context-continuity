/* DEVELOPMENT-ONLY, in-memory local sync SIMULATOR (A11Y-11 / Task 13).
 * This is NOT production cryptography: an "envelope" carries an opaque blob and
 * a version counter, not real ciphertext. Real end-to-end encryption requires
 * vetted libraries and an independent security review before any deployment.
 * There is no network here; it models two of the user's own devices locally. */

export interface Envelope {
  recordId: string;
  version: number;
  blob: string;
  deleted?: boolean;
  originDeviceId: string;
}

export interface SyncRecord {
  recordId: string;
  version: number;
  blob: string;
  deleted: boolean;
}

export interface Conflict {
  recordId: string;
  incoming: Envelope;
  current: SyncRecord;
}

interface DeviceState {
  id: string;
  label: string;
  revoked: boolean;
  online: boolean;
  store: Map<string, SyncRecord>;
  outbox: Envelope[];
}

export class SyncSimulator {
  private devices = new Map<string, DeviceState>();
  private hub = new Map<string, SyncRecord>();
  private conflicts: Conflict[] = [];

  enroll(id: string, label: string): void {
    if (this.devices.has(id)) return;
    this.devices.set(id, { id, label, revoked: false, online: true, store: new Map(), outbox: [] });
  }

  revoke(id: string): void {
    const device = this.devices.get(id);
    if (device) device.revoked = true;
  }

  setOnline(id: string, online: boolean): void {
    const device = this.requireDevice(id);
    device.online = online;
    if (online) this.flush(id);
  }

  put(deviceId: string, recordId: string, blob: string): void {
    this.enqueue(deviceId, recordId, blob, false);
  }

  delete(deviceId: string, recordId: string): void {
    this.enqueue(deviceId, recordId, "", true);
  }

  pull(deviceId: string): void {
    const device = this.requireDevice(deviceId);
    if (device.revoked) return;
    this.hub.forEach((record, recordId) => {
      const local = device.store.get(recordId);
      if (!local || record.version > local.version) {
        device.store.set(recordId, { ...record });
      }
    });
  }

  resolveConflict(recordId: string, winnerDeviceId: string): void {
    const index = this.conflicts.findIndex((conflict) => conflict.recordId === recordId);
    if (index < 0) return;
    const winner = this.requireDevice(winnerDeviceId);
    const winning = winner.store.get(recordId);
    if (!winning) return;
    const current = this.hub.get(recordId);
    const version = (current?.version ?? 0) + 1;
    this.hub.set(recordId, { recordId, version, blob: winning.blob, deleted: winning.deleted });
    this.conflicts.splice(index, 1);
  }

  applyEnvelope(envelope: Envelope): boolean {
    return this.ingest(envelope);
  }

  getRecord(deviceId: string, recordId: string): SyncRecord | undefined {
    return this.requireDevice(deviceId).store.get(recordId);
  }

  hubRecord(recordId: string): SyncRecord | undefined {
    return this.hub.get(recordId);
  }

  hasConflict(recordId: string): boolean {
    return this.conflicts.some((conflict) => conflict.recordId === recordId);
  }

  listConflicts(): Conflict[] {
    return [...this.conflicts];
  }

  private enqueue(deviceId: string, recordId: string, blob: string, deleted: boolean): void {
    const device = this.requireDevice(deviceId);
    if (device.revoked) throw new Error("A revoked device cannot push changes.");
    const base = device.store.get(recordId)?.version ?? 0;
    const version = base + 1;
    device.store.set(recordId, { recordId, version, blob, deleted });
    device.outbox.push({ recordId, version, blob, deleted, originDeviceId: deviceId });
    if (device.online) this.flush(deviceId);
  }

  private flush(deviceId: string): void {
    const device = this.requireDevice(deviceId);
    if (device.revoked || !device.online) return;
    const pending = device.outbox;
    device.outbox = [];
    pending.forEach((envelope) => {
      this.ingest(envelope);
    });
  }

  private ingest(envelope: Envelope): boolean {
    const current = this.hub.get(envelope.recordId);
    if (current) {
      if (envelope.version < current.version) return false; // stale
      if (envelope.version === current.version) {
        const differs = envelope.blob !== current.blob || Boolean(envelope.deleted) !== current.deleted;
        if (differs && !envelope.deleted && !current.deleted) {
          this.conflicts.push({ recordId: envelope.recordId, incoming: envelope, current: { ...current } });
        }
        return false; // replay or concurrent edit -> surfaced, not applied directly
      }
    }
    this.hub.set(envelope.recordId, {
      recordId: envelope.recordId,
      version: envelope.version,
      blob: envelope.blob,
      deleted: Boolean(envelope.deleted),
    });
    return true;
  }

  private requireDevice(id: string): DeviceState {
    const device = this.devices.get(id);
    if (!device) throw new Error(`Unknown device: ${id}`);
    return device;
  }
}
