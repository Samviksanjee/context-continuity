# Release-Evidence Matrix

Every capability is tracked across six stages so the demo never claims more than the evidence supports:

**Implemented → Automated-tested → Manually-tested → Human-validated → Security-reviewed → Production-approved**

Legend: ✅ done · ⬜ not yet · n/a not applicable.

| Capability | Implemented | Automated-tested | Manually-tested (AT) | Human-validated | Security-reviewed | Production-approved |
|---|:--:|:--:|:--:|:--:|:--:|:--:|
| Web zoom / orientation | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Skip link + focus visibility | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Keyboard menu (expand/Escape/focus) | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Context selector tabs (ARIA-APG roving) | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Structured context-graph view | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Web camera dialog (focus mgmt) | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Web delete / clear-all / undo | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Forced-colors / high-contrast | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Advisory AI contract (uncertainty/dismiss) | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Device-capability layer (web + Android) | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| i18n foundation + runtime lang/dir | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Android semantics/announcements | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Android destructive confirm + undo | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Android string-resource localization | ✅ | ✅ | ⬜ | ⬜ | n/a | ⬜ |
| Continuity: preference hand-off (prototype) | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Passkey-guest identity flow (logic) | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Tier-2 device profiles (incl. vehicle) | ✅ | ✅ | ⬜ | ⬜ | ⬜ | ⬜ |
| Local sync simulator | ✅ | ✅ | n/a | n/a | ⬜ | ⬜ |
| Production E2EE sync | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ | ⬜ |
| CI accessibility gate | ✅ | ✅ | n/a | n/a | n/a | ⬜ |

Reading this honestly: the product is broadly **Implemented + Automated-tested**. Nothing has yet passed **Manually-tested (AT)**, **Human-validated**, **Security-reviewed**, or **Production-approved**. Those columns require the manual AT matrix, participant studies (`PARTICIPANT_RESEARCH_PROTOCOL.md`), the security review (`E2EE_THREAT_MODEL.md`), and vehicle sign-off (`VEHICLE_SAFETY_SIGNOFF.md`).
