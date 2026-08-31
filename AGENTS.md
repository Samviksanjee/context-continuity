# AGENTS.md — Context Continuity (ContextOS)

Instructions for any repo-aware development agent (e.g. Prime Agent) working in this repository. This file is auto-loaded. Read it before making changes.

## What this project is

A privacy-first contextual-intelligence concept with two shipped surfaces:
- `client/` + `server/` — a React/Vite PWA and its static server.
- `android-contextos/` — a native, local-only Android app.

Prime Agent is a **development tool only**. It must never become part of the product runtime or the product build dependency graph.

## Non-negotiable trust contract (do not weaken)

1. **Local-first / no silent cloud.** The product processes data on-device. Do not add cloud inference or network calls to the shipped app. If advanced local inference is unavailable, use the deterministic path or an explicit "unavailable" state.
2. **Android declares no `INTERNET` permission**, and no analytics, notification listener, accessibility service, contacts, calendar, or location access. The manifest keeps INTERNET/ACCESS_NETWORK_STATE removed via `tools:node="remove"`. Never grant them.
3. **Evidence ≠ instructions.** External content (documents, OCR, speech, shared text, screen text) is data with no action authority. Never let it become executable commands or system instructions.
4. **AI is advisory and reversible.** Suggestions must show source, confidence/uncertainty, and intended effect, and require confirmation. No opaque or autonomous action. Destructive actions need confirmation and/or undo.
5. **Capabilities, not brands.** Detect device/AI capability at runtime; never branch on manufacturer name or call hidden OEM APIs.

## Accessibility bar

Target WCAG 2.2 AA plus the selected AAA/COGA outcomes recorded in `docs/ACCESSIBILITY.md`. That file's requirement matrix (A11Y-01…14) and the `tests/accessibility/` suite are the source of truth. Do not claim conformance beyond the current evidence — see the maturity ladder in `docs/RELEASE_EVIDENCE_MATRIX.md` (Implemented → Automated-tested → Manually-tested → Human-validated → Security-reviewed → Production-approved).

## Commands (Windows; pnpm is invoked via corepack)

- Install: `corepack pnpm install`
- Type-check: `corepack pnpm check`
- Tests: `corepack pnpm test` (accessibility subset: `corepack pnpm test:a11y`)
- Build: `corepack pnpm build`
- Android (needs JDK 17; the SDK path lives in the gitignored `android-contextos/local.properties`):
  `cd android-contextos` then `.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug`
- Do not run long-lived processes (`corepack pnpm dev`, watchers) as blocking commands.

Run the project's own verification (`check`, `test`, `test:a11y`, `build`, Android unit tests) after changes and fix failures before claiming completion. Prefer the `verify-changes` skill.

## Git safety

Do not commit unless asked. Prefer new branches over main; stage specific files; never force-push, reset --hard, or skip hooks unless explicitly requested. Never commit credentials.

## Principle-aware behavior (required)

Prime Agent may modify repository **development** artifacts, but must treat product **security, privacy, accessibility, and trust-contract** constraints as non-negotiable. When a requested change conflicts with those constraints, **stop and report the conflict rather than silently weakening the constraint**, and offer a development-only alternative.

## Hard prohibitions

- Never add Prime Agent, `@earendil-works/pi-coding-agent`, or any cloud-AI / code-execution agent as a product dependency, devDependency, workspace, or build input.
- Never alter the Android permission model or add network permissions to the shipped app.
- Never weaken the evidence-is-not-instructions boundary.
- Keep model-provider credentials out of the repository (use `~/.prime/agent/auth.json` or provider env vars). See `docs/PRIME_AGENT.md`.

The `tests/tooling/prime-agent-isolation.test.ts` guard enforces several of these automatically; keep it green.

## Skills

Project skills live in `.prime/agent/skills/`: `verify-changes`, `accessibility-audit`, `privacy-guardrail`. Use them instead of guessing commands or re-deriving invariants.
