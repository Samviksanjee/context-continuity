import { defineConfig } from "vitest/config";

// Dependency-free accessibility baseline harness (Phase 1).
// Tests assert accessibility-relevant contracts of static assets and source,
// so they run headless in CI without a browser. Browser/axe and Compose
// accessibility layers are added in later phases (see docs/ACCESSIBILITY.md).
export default defineConfig({
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    reporters: "default",
  },
});
