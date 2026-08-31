---
name: verify-changes
description: Run the ContextOS verification workflow (web type-check, accessibility tests, production build, and Android unit tests) and require every step to pass before treating a change as done. Use whenever code in client/, server/, android-contextos/, or tests/ changed.
---

# Verify changes

Run the project's own verification. Do not guess commands. On Windows, pnpm is invoked through corepack.

## Web (from repo root)

```bash
corepack pnpm check      # tsc --noEmit
corepack pnpm test       # full Vitest suite (includes tests/accessibility + tests/tooling)
corepack pnpm test:a11y  # accessibility subset
corepack pnpm build      # production build (vite + esbuild)
```

## Android (only if android-contextos/ changed)

Requires JDK 17 and `android-contextos/local.properties` (gitignored) pointing at the SDK.

```bash
# PowerShell:
cd android-contextos
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
```

## Rules

- Never start long-lived processes (`corepack pnpm dev`, watchers) as blocking commands.
- If any step fails, fix the cause and re-run — do not report success on a red step.
- A command exiting 0 is necessary but not sufficient: confirm the specific result the task required.
- Clean up any temporary files created during verification.
