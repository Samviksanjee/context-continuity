# Vehicle Profile — Safety Sign-off Checklist (Draft)

Status on the maturity ladder: **Implemented (reference profile + in-motion lockout logic) → Automated-tested**. **Not** safety-reviewed, **not** approved for any vehicle. WCAG conformance alone cannot establish safe in-motion behavior; this requires automotive HMI and jurisdictional review by qualified humans.

## What exists in code

`client/src/lib/tierTwoProfiles.ts` defines a `vehicle` reference profile with `inMotionLockout: true`, and `isActionAllowed` blocks `capture` and `manipulateGraph` while moving (only passive `review` is permitted). This is a modeling constraint, not a certified safety control.

## Checklist (all must be satisfied before any vehicle claim)

- [ ] Motion state is sourced from an authoritative vehicle signal (not app heuristics).
- [ ] Driver vs passenger context is established and enforced.
- [ ] In-motion lockout of capture, graph manipulation, and free typing verified on target hardware.
- [ ] Glance-count and glance-duration limits meet the applicable driver-distraction guidelines.
- [ ] Voice is optional and never the sole route; no safety-critical action depends on it.
- [ ] Safe deferral / hand-off to a phone when the task cannot be completed safely.
- [ ] Jurisdiction-specific regulatory review completed and documented.
- [ ] Sign-off by a qualified automotive HMI / functional-safety reviewer.

## Explicit non-claim

Until every box is checked and signed by qualified reviewers, ship the vehicle profile only as a **reference model**, and make no claim of in-vehicle safety or support.
