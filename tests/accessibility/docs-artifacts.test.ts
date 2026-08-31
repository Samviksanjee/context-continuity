import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const read = (relative: string) => readFileSync(resolve(repoRoot, relative), "utf8");

const artifacts = [
  "docs/E2EE_THREAT_MODEL.md",
  "docs/VPAT_ACR_SKELETON.md",
  "docs/PARTICIPANT_RESEARCH_PROTOCOL.md",
  "docs/RELEASE_EVIDENCE_MATRIX.md",
  "docs/VEHICLE_SAFETY_SIGNOFF.md",
];

const ladderStages = [
  "Implemented",
  "Automated-tested",
  "Manually-tested",
  "Human-validated",
  "Security-reviewed",
  "Production-approved",
];

// Prevents unsupported accessibility/security claims by requiring the maturity ladder.
describe("release-readiness artifacts", () => {
  it("all human-gated artifacts exist", () => {
    artifacts.forEach((file) => expect(existsSync(resolve(repoRoot, file))).toBe(true));
  });

  it("the release-evidence matrix encodes the full maturity ladder", () => {
    const matrix = read("docs/RELEASE_EVIDENCE_MATRIX.md");
    ladderStages.forEach((stage) => expect(matrix).toContain(stage));
  });

  it("the threat model distinguishes prototype from production", () => {
    const threat = read("docs/E2EE_THREAT_MODEL.md");
    expect(threat).toMatch(/prototype/i);
    expect(threat).toMatch(/not security-reviewed|not production-approved/i);
  });

  it("the vehicle checklist refuses an unsupported safety claim", () => {
    const vehicle = read("docs/VEHICLE_SAFETY_SIGNOFF.md");
    expect(vehicle).toMatch(/reference model/i);
    expect(vehicle).toMatch(/not safety-reviewed|not.*approved/i);
  });
});
