import { describe, it, expect } from "vitest";
import { SyncSimulator } from "../../client/src/lib/syncSimulator";

// A11Y-11 — local, consent-driven continuity modeled without network or real crypto.
describe("A11Y-11 local sync simulator", () => {
  it("syncs an edit from one device to another", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "Phone");
    sim.enroll("B", "Laptop");
    sim.put("A", "r1", "a1");
    sim.pull("B");
    expect(sim.getRecord("B", "r1")?.blob).toBe("a1");
  });

  it("surfaces and resolves a concurrent conflict", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "A");
    sim.enroll("B", "B");
    sim.put("A", "r1", "a1");
    sim.setOnline("B", false);
    sim.put("B", "r1", "b1");
    sim.setOnline("B", true);
    expect(sim.hasConflict("r1")).toBe(true);
    sim.resolveConflict("r1", "B");
    sim.pull("A");
    expect(sim.getRecord("A", "r1")?.blob).toBe("b1");
    expect(sim.hasConflict("r1")).toBe(false);
  });

  it("queues offline edits and drains on reconnect", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "A");
    sim.enroll("B", "B");
    sim.setOnline("A", false);
    sim.put("A", "r1", "a1");
    expect(sim.hubRecord("r1")).toBeUndefined();
    sim.setOnline("A", true);
    expect(sim.hubRecord("r1")?.blob).toBe("a1");
  });

  it("rejects a revoked device push", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "A");
    sim.revoke("A");
    expect(() => sim.put("A", "r1", "x")).toThrow();
  });

  it("propagates deletion as a tombstone", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "A");
    sim.enroll("B", "B");
    sim.put("A", "r1", "a1");
    sim.pull("B");
    sim.delete("A", "r1");
    sim.pull("B");
    expect(sim.getRecord("B", "r1")?.deleted).toBe(true);
  });

  it("rejects a stale or replayed envelope", () => {
    const sim = new SyncSimulator();
    sim.enroll("A", "A");
    sim.put("A", "r1", "a1");
    sim.put("A", "r1", "a2");
    const applied = sim.applyEnvelope({ recordId: "r1", version: 1, blob: "old", originDeviceId: "A" });
    expect(applied).toBe(false);
    expect(sim.hubRecord("r1")?.version).toBe(2);
    expect(sim.hubRecord("r1")?.blob).toBe("a2");
  });
});
