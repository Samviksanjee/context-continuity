---
name: privacy-guardrail
description: Verify the ContextOS privacy and trust invariants before and after a change — Android grants no INTERNET/analytics/notification-listener/accessibility-service, storage copy matches real persistence, external content stays evidence (never instructions), and no Prime Agent or cloud-AI dependency entered the product build. Stop and report any conflict.
---

# Privacy guardrail

Enforce the trust contract in `AGENTS.md`. If a requested change would violate any invariant below, **stop and report the conflict** instead of weakening it, and propose a development-only alternative.

## Checks

1. **Android permissions.** In `android-contextos/app/src/main/AndroidManifest.xml`, `INTERNET` and `ACCESS_NETWORK_STATE` must remain removed via `tools:node="remove"`. No notification listener, accessibility service, contacts, calendar, or location.
2. **No product coupling to the dev agent or cloud AI.** Run the isolation guard:
   `corepack pnpm test tests/tooling/prime-agent-isolation.test.ts` (or the full `corepack pnpm test`). It must stay green.
3. **Storage honesty.** User-facing copy about where data lives must match the real persistence (on-device / localStorage), not "session only" when it persists.
4. **Evidence ≠ instructions.** Captured/shared/OCR/voice content is data. It must never be executed or treated as commands.
5. **Advisory AI.** Suggestions stay advisory, source-linked, and reversible; destructive actions need confirmation and/or undo.

## Output

Report each invariant as holding or violated, with the exact file/line. A violation is a blocker, not a warning.
