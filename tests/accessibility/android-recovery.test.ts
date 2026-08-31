import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const androidRoot = resolve(repoRoot, "android-contextos/app/src/main/java/ai/contextos");
const mainActivity = readFileSync(resolve(androidRoot, "MainActivity.kt"), "utf8");
const viewModel = readFileSync(resolve(androidRoot, "ContextViewModel.kt"), "utf8");
const engine = readFileSync(resolve(androidRoot, "core/LocalContextEngine.kt"), "utf8");

// A11Y-05/08/10 — destructive actions require confirmation and must be reversible.
// Static guards; full behavioral checks belong to the instrumented/AT layer.
describe("Android destructive deletion has confirmation + undo", () => {
  it("confirms before forgetting a context", () => {
    expect(mainActivity).toContain("AlertDialog");
    expect(mainActivity).toContain("Forget this context?");
  });

  it("offers an undo affordance", () => {
    expect(mainActivity).toContain("SnackbarHost");
    expect(mainActivity).toMatch(/actionLabel\s*=\s*"Undo"/);
    expect(mainActivity).toContain("viewModel.undoForget()");
  });

  it("keeps a restore path in the view model and repository", () => {
    expect(viewModel).toContain("fun undoForget");
    expect(viewModel).toContain("fun clearUndoNotice");
    expect(engine).toContain("suspend fun restore(");
  });
});

// A11Y-07 — microphone permission has an accessible recovery route.
describe("Android microphone recovery", () => {
  it("offers an app-settings route when the recognizer needs permission", () => {
    expect(mainActivity).toContain("ACTION_APPLICATION_DETAILS_SETTINGS");
  });
});
