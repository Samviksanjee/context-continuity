import { describe, it, expect } from "vitest";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const mainActivity = readFileSync(
  resolve(repoRoot, "android-contextos/app/src/main/java/ai/contextos/MainActivity.kt"),
  "utf8",
);
const workflowPath = resolve(repoRoot, ".github/workflows/accessibility.yml");

// A11Y-02/05 — Android exposes headings, selectable state, and polite announcements.
// Static guards; TalkBack/Switch Access behavior belongs to the instrumented/AT layer.
describe("A11Y-02/05 Android semantics", () => {
  it("marks section titles as headings", () => {
    expect(mainActivity).toContain("heading()");
  });

  it("announces thread cards as selectable buttons with state", () => {
    expect(mainActivity).toContain("Role.Button");
    expect(mainActivity).toContain("stateDescription");
    expect(mainActivity).toMatch(/selected\s*=\s*selected/);
  });

  it("uses polite live regions for status and answers", () => {
    expect(mainActivity).toContain("LiveRegionMode.Polite");
  });
});

// A11Y-06 — relationships are readable as a structured list on Android too.
describe("A11Y-06 Android relationships view", () => {
  it("renders saved relationships in ThreadDetail", () => {
    expect(mainActivity).toContain("RELATIONSHIPS");
    expect(mainActivity).toContain("thread.relations");
  });
});

// A11Y-14 — a CI gate runs the accessibility suite and builds automatically.
describe("A11Y-14 CI accessibility gate", () => {
  it("defines the accessibility workflow", () => {
    expect(existsSync(workflowPath)).toBe(true);
  });

  it("runs the web accessibility suite and build", () => {
    const workflow = readFileSync(workflowPath, "utf8");
    expect(workflow).toContain("corepack pnpm test");
    expect(workflow).toContain("corepack pnpm build");
  });
});
