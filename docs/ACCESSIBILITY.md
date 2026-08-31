# Inclusive Context Continuity — Accessibility Specification

Status: living document · Version 0.1 (Phase 1 baseline)

This is the versioned acceptance contract shared by the web PWA, the Android app, and future device adapters. It turns the settled requirements (A11Y-01 … A11Y-14) into testable outcomes with an owner, a method, and an evidence trail.

## Conformance target

- Primary target: **WCAG 2.2 Level AA** for all web journeys.
- Native and closed-function adapters map the same outcomes through **WCAG2ICT** and platform accessibility guidance (Android, Windows/UIA, TV, wearable).
- Selected enhanced outcomes pursued deliberately: Keyboard (No Exception), Interruptions, Focus Not Obscured (Enhanced), Focus Appearance, Target Size (Enhanced), reading-level support, and Error Prevention (All).
- We do **not** claim full AAA conformance, and no automated result is treated as proof of conformance.

> Honesty clause: "accessible to everyone" cannot be guaranteed absolutely. The defensible claim is conformance to the target above, validated by automated checks, manual assistive-technology testing, physical-device testing, and research with disabled participants, with remaining limitations documented here.

## Assessment basis

The current findings began from static source inspection. Runtime contrast, focus behavior, reflow at 400%, target dimensions, screen-reader announcements, and on-device behavior still require measurement on real assistive technology and hardware. Items depending on human judgement (participant studies, independent security review, vehicle-safety sign-off, market/legal certification) cannot be self-certified by automation and are called out explicitly.

## Requirement matrix

Status legend: ✅ met (Phase 1, verified by listed method) · 🟡 in progress · ⬜ planned (later phase).

| ID | Requirement | Primary standards | Platforms | Verification method | Status |
|---|---|---|---|---|---|
| A11Y-01 | Conformance and documented evidence | WCAG 2.2 AA; WCAG2ICT | All | This matrix + layered test suites + limitation log | 🟡 |
| A11Y-02 | Semantic equivalence (name/role/value/state, order, headings) | WCAG 1.3.1, 4.1.2 | Web, Android | DOM/Compose semantics tests; AT tree review | 🟡 |
| A11Y-03 | Input independence (no touch/pointer/drag/voice/biometric-only path) | WCAG 2.1.1, 2.5.1, 2.5.7 | All | Keyboard/switch/D-pad walkthroughs; contract tests | 🟡 |
| A11Y-04 | Visual adaptability (zoom, reflow, orientation, spacing, forced colors, reduced motion) | WCAG 1.4.4, 1.4.10, 1.3.4, 1.4.12, 1.4.3, 2.3.3 | Web, Android | Static asset contract tests (Phase 1); runtime zoom/scale audit | ✅ zoom, orientation, focus visibility, forced-colors, reduced-motion · 🟡 runtime contrast/reflow audit |
| A11Y-05 | Focus and status management (visible, logical, unobscured, restored) | WCAG 2.4.7, 2.4.11, 2.4.3, 4.1.3 | Web, Android | Focus-order/skip-link/live-region tests; AT review | 🟡 skip link + focus visibility landed |
| A11Y-06 | Graph equivalence (structured alternative from one canonical model) | WCAG 1.1.1, 1.3.1, 2.1.1 | Web, Android | Model-equivalence + keyboard tests | ✅ web · ✅ Android (relationships) |
| A11Y-07 | Multimodal capture reviewable/editable with recovery | WCAG 3.3.1, 3.3.3, 1.1.1 | Web, Android | Permission/failure/edit tests; AT review | 🟡 |
| A11Y-08 | Cognitive accessibility (plain language, consistency, undo, low memory load) | WCAG 3.2.3, 3.2.4, 3.3.4, 2.2.1; W3C COGA | All | Consistency/timeout/undo tests; comprehension sessions | ⬜ |
| A11Y-09 | Responsible AI (facts vs inference, uncertainty, correction, confirmation) | NIST AI RMF; WCAG 3.3.4 | All | AI contract fixtures + confirmation tests | ✅ advisory framing + uncertainty + dismiss (web) · 🟡 Android caption |
| A11Y-10 | Privacy and data control (truthful storage, review, delete, clear-all, undo) | Product policy; WCAG 3.3.4 | All | Retention/deletion tests; truthful-copy guard | ✅ truthful copy · delete/clear-all/undo (web + Android) |
| A11Y-11 | Identity and continuity with nonvisual/non-QR alternatives | WCAG 3.3.8, 2.1.1; FIDO guidance | All | State-machine + AT tests | ✅ surfaced (continuity UI: preference hand-off, passkey-guest, non-QR pairing — prototype) · 🔒 production E2EE (human-gated) |
| A11Y-12 | Localization (extraction, locale formats, RTL, expansion, speech language) | WCAG 3.1.1, 3.1.2 | Web, Android | Pseudolocale/RTL/format tests | ✅ foundation + runtime lang/dir + web catalog (controls + full Continuity surface) + Android string resources · 🟡 long-form narrative |
| A11Y-13 | Device capability profiles (progressive enhancement, no disability profiling) | Ability-Based Design; W3C mobile | All | Capability-schema + fallback tests | ✅ Android · ✅ web profile (progressive enhancement) |
| A11Y-14 | Verification and support (owner, evidence, limitation process) | NIST AI RMF governance | All | CI gates + release evidence index | 🟡 |

## Testing layers

1. Fast, dependency-free contract tests on static assets and pure helpers (Phase 1, `pnpm test`).
2. DOM + axe-core semantic smoke tests and browser interaction tests (later phase; pin exact compatible versions).
3. Android Compose semantics tests and Compose accessibility checks (verify Compose BOM supports the checks first).
4. Manual assistive-technology matrix: NVDA/Firefox+Chromium, JAWS/Chromium where resourced, VoiceOver/Safari (macOS+iOS) for PWA claims, TalkBack + Switch Access + Voice Access on Android, Windows forced colors, keyboard-only, and Android maximum font/display scaling, landscape, split screen, foldable.
5. Research with compensated disabled participants across blind/low-vision, Deaf/hard-of-hearing, motor, speech, cognitive/neurodivergent, and multiply disabled experiences.

## Target sizes

- Web: prefer 44×44 CSS px interactive targets (WCAG 2.5.5 Enhanced), minimum 24×24 with adequate spacing (2.5.8).
- Android: prefer 48 dp targets. Document any spacing-based exception.

## Phase 1 delivered

- Executable baseline harness (`pnpm test`) with contract tests for viewport zoom, orientation, storage-copy truthfulness, and this matrix's completeness.
- P0 web fixes: removed `maximum-scale`; unlocked manifest orientation; added a keyboard skip link; restored visible focus for text fields and links; made the mobile navigation expose `aria-expanded`/`aria-controls`, close on Escape, and restore focus; corrected storage retention copy.

## Phase 2 delivered

- Android destructive-action safety (A11Y-05/08/10): "Forget" now requires a confirmation dialog and offers an Undo through an accessible Snackbar; the repository can restore a deleted thread, so deletion is reversible.
- Android microphone recovery (A11Y-07): when the on-device recognizer needs permission, the device card offers an "Open app settings" route; typed notes and questions always remain available.
- Web camera capture (A11Y-05/07): the capture surface is now a labelled dialog (`role="dialog"`, `aria-modal`) that moves focus to the capture control on open, closes on Escape, and restores focus to the Camera trigger (or the note field after capture); the capture status is a `role="status"` live region.

Refinement tracked for a later phase: a full focus trap (Tab cycling) inside the web camera dialog, and behavioral (rendered-DOM / instrumented) tests to complement the current static guards.

## Phase 3 delivered

- Structured context-graph equivalent (A11Y-06): a canonical model (`client/src/lib/contextGraph.ts`) produces the center context, entity nodes, edges, and provenance. The web renders both the visual graph and a synchronized, keyboard-operable "Relationships · structured view" from that one model, so the presentations cannot diverge. The decorative visual scene is `aria-hidden` with non-focusable nodes, while explicit zoom/reset controls remain the accessible spatial commands. A model-equivalence unit test asserts every node, edge, and provenance field is represented.

Refinement tracked for a later phase: back the Android graph view with the same canonical model, and add a table/outline alternate presentation with filtering.

## Phase 4 delivered

- Android semantics/announcements (A11Y-02/05): section titles ("Capture deliberately", "Your context threads", card headers) are exposed as headings; thread cards announce a Button role, selected state, and a state description (Active vs Background context); the on-this-phone status and query answers are polite live regions, so results are announced without stealing focus.
- Android relationships view (A11Y-06): ThreadDetail lists saved relationships (subject → predicate → object) as a structured, screen-reader-readable equivalent alongside provenance and tasks.
- Continuous integration gate (A11Y-14): `.github/workflows/accessibility.yml` runs the web type-check, accessibility tests, and build on every push/PR, plus a best-effort Android unit-test/assemble job, so accessibility regressions are caught automatically.

## Phase 5 delivered

- Web data control (A11Y-10): saved local threads can now be forgotten individually or cleared all at once, each reversible through an announced Undo (a `role="status"` live region), matching the Android reversible-deletion pattern. The static demo threads remain non-deletable, and confirmation is provided through immediate reversibility (Undo) rather than a modal.

## Phase 6 delivered

- Human-controlled AI contract (A11Y-09): a shared module (`client/src/lib/advisory.ts`) turns a confidence value into a plain-language uncertainty phrase without false precision. The web suggestion now states it is advisory ("you decide. No action is taken automatically") with that uncertainty phrase and a reversible Dismiss/Show control; Android shows an equivalent advisory caption. No suggestion is ever executed automatically.

Refinement tracked for a later phase: an explicit facts-vs-inference breakdown and a shared correction/report affordance across both platforms.

## Phase 7 delivered

- Web device-capability layer (A11Y-13): `client/src/lib/deviceProfile.ts` derives a normalized profile (pointer type, hover, installed PWA, online, secure context, orientation, reduced motion, forced colors, viewport) from feature detection — never user-agent sniffing. It drives progressive enhancement (the graph gesture hint adapts to touch vs pointer input) and refreshes on resize/orientation/connectivity changes. Accessibility preferences are read locally for adaptation only and are never serialized or transmitted, mirroring the Android capability detector.

Refinement tracked for a later phase: a shared intent-to-adapter mapping so web and Android consume one capability contract, plus the Tier 2 device profiles.

## Phase 8 delivered (foundation / logic layers)

Built as isolated, dependency-free modules with unit tests (no shared-file edits), advancing tasks whose production forms remain human-gated:

- i18n/RTL foundation (A11Y-12): `client/src/lib/i18n.ts` — message catalog + interpolation, RTL detection by language subtag, Intl number/date formatting with safe fallback, and pseudolocalization for layout stress. Full UI string extraction is the remaining incremental work.
- Local sync simulator (A11Y-11, Task 13): `client/src/lib/syncSimulator.ts` — a development-only, in-memory model of two of the user's devices: enrollment, opaque (non-crypto) envelopes with version counters, explicit conflict surfacing + resolution, offline queue drain, device revocation, deletion tombstones, and stale/replay rejection. NO real cryptography and NO network; production E2EE requires vetted libraries and independent security review.
- Passkey flow (A11Y-11, Task 14): `client/src/lib/passkeyFlow.ts` — a pure state machine where local guest use is never blocked, an unavailable authenticator degrades gracefully, cancellation is always safe, a non-QR manual pairing path exists, and recovery never silently downgrades E2EE. No WebAuthn calls.
- Tier-2 device profiles (Task 16): `client/src/lib/tierTwoProfiles.ts` — reference profiles for TV, smart display, wearable, kiosk, and vehicle, with directional focus, kiosk timeout, voice-never-required, and a vehicle in-motion lockout of capture/graph manipulation. The vehicle profile is a reference model pending human safety sign-off.

These are logic/foundation layers, not shipped infrastructure. Production sync deployment, real cryptography and its security review, vehicle safety certification, and disabled-participant research remain in the human-authorization list below.

## Phase 9 delivered

- i18n wired into the web UI (A11Y-12): the document `lang` and `dir` are set at runtime from the app locale via `textDirection` (direction flips automatically when an RTL locale becomes active), and a first set of visible controls (capture sources, Dismiss, Undo, Clear all) render from the message catalog through `translate`. Remaining incremental work: extract the full string set across the page and add Android resource localization.

## Phase 10 delivered

- Localization parity extended (A11Y-12): more web controls (Map context, microphone detect) render from the message catalog, and the Android app now sources its primary action labels (capture image / add document / voice note, remember / demo, ask / ask-by-voice, forget) from `res/values/strings.xml` via `stringResource`, so translated Android resource files can be added per locale. Full string extraction across long-form narrative and remaining controls stays incremental.

## Phase 11 delivered

- ARIA-APG tabs pattern on the web context selector (A11Y-02/03, Task 4): the tablist now exposes `aria-orientation`, each tab uses roving `tabIndex` (only the selected tab is in the tab order), Arrow/Home/End move focus and activate, and tabs link to the panel via `aria-controls`/`id`. This makes thread switching fully keyboard- and screen-reader-operable per the Authoring Practices tabs pattern.

## Phase 12 delivered

- Forced-colors / high-contrast hardening (A11Y-04): a `@media (forced-colors: active)` block keeps focus indicators visible using the system `Highlight` color and preserves selected/active state with system-colored borders, so Windows High Contrast and forced-colors users retain focus and selection cues that background color alone would otherwise flatten. Runtime contrast measurement and 400% reflow verification remain part of the manual audit.

## Phase 13 delivered

- Continuity experience surfaced (A11Y-11): a new "Continuity" section (`client/src/components/ContinuityPanel.tsx`) turns the previously headless foundations into a demonstrable, accessible experience of the core thesis — the user's accessibility preferences belong to the user, not a device. Preferences (larger text, high contrast, reduce motion, voice-first) set on one device are handed off to another the user owns, and its presentation visibly adapts, local-first and consent-based, with no account required. Identity uses the passkey-guest state machine (local guest always available, non-QR manual pairing) and sync uses the local simulator. It is explicitly labelled a prototype — not production end-to-end encryption — and moves no data off the device. Backed by `ContinuityManager` + `accessibilityPreferences` (unit-tested) over the existing sync simulator and passkey flow.

## Phase 14 delivered

- Continuity surface localized (A11Y-12): all operational text of the Continuity experience (preference labels/hints, hand-off and identity controls, adaptation badges, status messages, and the prototype-not-production disclaimer) now renders from the i18n catalog via `translate`, so the newest surface is translation-ready alongside the earlier controls. The remaining un-extracted text is the long-form editorial/marketing narrative, which is content rather than UI chrome.

## Phase 15 delivered — readiness artifacts (maturity ladder)

To keep claims honest, every capability is tracked across **Implemented → Automated-tested → Manually-tested → Human-validated → Security-reviewed → Production-approved**. Draft artifacts scope the human-gated stages:

- [E2EE threat model](E2EE_THREAT_MODEL.md) — prototype-vs-production, assets, adversaries, and open items blocking a production sync (security review required).
- [VPAT/ACR skeleton](VPAT_ACR_SKELETON.md) — WCAG 2.2 AA report with provisional, automated-only status; certified conformance needs manual AT + participant testing.
- [Participant research protocol](PARTICIPANT_RESEARCH_PROTOCOL.md) — how disabled-participant validation would be run and fed back as regression tests.
- [Release-evidence matrix](RELEASE_EVIDENCE_MATRIX.md) — the honest current position: broadly Implemented + Automated-tested; nothing yet Manually-tested/Human-validated/Security-reviewed/Production-approved.
- [Vehicle safety sign-off](VEHICLE_SAFETY_SIGNOFF.md) — checklist and explicit non-claim for the vehicle profile.

## Items requiring human authorization (cannot be self-certified)

- Independent security review of any sync protocol, key management, and recovery before production (Task 15).
- Disabled-participant research and remediation sign-off (Task 18).
- Vehicle in-motion safety review (Tier 2 vehicle profile, Task 16).
- Market-specific/legal conformance artifacts (e.g., VPAT/ACR, Section 508, EN 301 549) once deployment scope is known.

## References

- [WCAG 2.2](https://www.w3.org/TR/WCAG22/)
- [WCAG2ICT](https://www.w3.org/TR/wcag2ict-22/)
- [W3C mobile accessibility](https://www.w3.org/WAI/standards-guidelines/mobile/)
- [W3C COGA — Making Content Usable](https://www.w3.org/TR/coga-usable/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Android Compose accessibility](https://developer.android.com/develop/ui/compose/accessibility)
- [NIST AI Risk Management Framework](https://www.nist.gov/itl/ai-risk-management-framework)
- [FIDO Alliance design guidelines](https://fidoalliance.org/design-guidelines/)
