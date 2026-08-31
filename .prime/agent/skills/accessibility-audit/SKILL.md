---
name: accessibility-audit
description: Audit changes against the ContextOS accessibility bar (WCAG 2.2 AA plus selected AAA/COGA), using docs/ACCESSIBILITY.md and the tests/accessibility suite as the source of truth, and report findings honestly without overclaiming conformance.
---

# Accessibility audit

The authoritative sources are [`docs/ACCESSIBILITY.md`](../../../../docs/ACCESSIBILITY.md) (the A11Y-01…14 requirement matrix) and the `tests/accessibility/` suite. Do not invent criteria.

## Steps

1. Run `corepack pnpm test:a11y` and confirm the relevant guards pass.
2. For changed UI, check against the matrix: semantics/roles/labels, keyboard operability and visible focus, status/live regions, target size, reduced motion, forced colors, and the structured (non-visual) equivalents for any visualization.
3. For Android UI, map outcomes through WCAG2ICT (Compose semantics: headings, roles, selected state, live regions).
4. Confirm any new user-facing strings are catalog-driven where the surface is already localized (see `client/src/lib/i18n.ts`).

## Honesty rule

Automated/static tests catch a minority of real barriers. Report status against the maturity ladder in `docs/RELEASE_EVIDENCE_MATRIX.md`. Do **not** claim conformance beyond "Automated-tested". Manual assistive-technology testing and disabled-participant validation (`docs/PARTICIPANT_RESEARCH_PROTOCOL.md`) are still required for any conformance claim.
