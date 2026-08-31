import { describe, it, expect } from "vitest";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, "../..");
const strings = readFileSync(
  resolve(repoRoot, "android-contextos/app/src/main/res/values/strings.xml"),
  "utf8",
);
const mainActivity = readFileSync(
  resolve(repoRoot, "android-contextos/app/src/main/java/ai/contextos/MainActivity.kt"),
  "utf8",
);

const ids = [
  "capture_image",
  "add_document",
  "voice_note",
  "remember_locally",
  "try_local_demo",
  "ask_locally",
  "ask_by_voice",
  "forget_local_context",
];

// A11Y-12 — Android sources its labels from localizable string resources.
describe("A11Y-12 Android resource localization", () => {
  it("defines localizable string resources", () => {
    ids.forEach((id) => {
      expect(strings).toContain(`name="${id}"`);
    });
  });

  it("renders labels from string resources rather than hardcoded literals", () => {
    expect(mainActivity).toContain("stringResource(");
    expect(mainActivity).toContain("R.string.capture_image");
    expect(mainActivity).toContain("R.string.forget_local_context");
  });
});
