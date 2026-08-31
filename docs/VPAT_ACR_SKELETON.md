# Accessibility Conformance Report (VPAT-style) — Skeleton

Status on the maturity ladder: **Implemented → Automated-tested**. This is a working draft. Conformance columns are **provisional** and reflect automated/static evidence only; they are **not** a certified VPAT. A defensible ACR requires **manual assistive-technology testing** and **disabled-participant validation** (see `PARTICIPANT_RESEARCH_PROTOCOL.md`).

- Product: Context Continuity (web PWA + Android app)
- Target standard: WCAG 2.2 Level AA (plus selected AAA/COGA outcomes)
- Evaluation methods so far: static/contract unit tests (`tests/accessibility/`), source review. **Not yet**: NVDA/JAWS/VoiceOver/TalkBack, forced-colors on real OS, 400% reflow measurement, participant studies.

## Conformance terms

Supports · Partially Supports · Does Not Support · Not Evaluated. Because manual AT testing is pending, most rows are **Partially Supports (automated evidence only)** or **Not Evaluated**, by design — this prevents overstated claims.

## WCAG 2.2 AA (representative rows; remaining SC = Not Evaluated pending manual audit)

| Success Criterion | Provisional status | Evidence / notes |
|---|---|---|
| 1.3.4 Orientation | Partially Supports | Manifest orientation unlocked (test) |
| 1.4.4 Resize Text | Partially Supports | maximum-scale removed (test); runtime zoom audit pending |
| 1.4.10 Reflow | Not Evaluated | Needs 400% runtime measurement |
| 1.4.3 Contrast (Minimum) | Not Evaluated | Needs runtime contrast measurement |
| 1.4.11 Non-text Contrast | Not Evaluated | Pending |
| 1.4.12 Text Spacing | Not Evaluated | Pending |
| 2.1.1 Keyboard | Partially Supports | Menu, tabs (roving focus), controls; full AT walkthrough pending |
| 2.4.3 Focus Order | Partially Supports | Skip link, dialog focus mgmt; AT review pending |
| 2.4.7 Focus Visible | Partially Supports | focus-visible + forced-colors block |
| 2.4.11 Focus Not Obscured (Min) | Not Evaluated | Pending |
| 2.5.8 Target Size (Min) | Partially Supports | Preferred sizes in CSS; runtime measure pending |
| 4.1.2 Name, Role, Value | Partially Supports | ARIA roles/states + Compose semantics; AT verification pending |
| 4.1.3 Status Messages | Partially Supports | role=status / live regions on web + Android |
| 3.3.1 Error Identification | Partially Supports | Capture/permission recovery messaging |
| 1.1.1 Non-text Content | Not Evaluated | Image/icon alt review pending |

## Android (WCAG2ICT mapping) — Not Evaluated pending TalkBack/Switch Access testing.

## Sign-off ladder (must all be reached before a certified ACR)

Implemented → Automated-tested → Manually-tested (AT) → Human-validated (participants) → Security-reviewed (for data/identity) → Production-approved.
