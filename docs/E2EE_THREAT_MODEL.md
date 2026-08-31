# E2EE Sync — Threat Model (Draft)

Status on the maturity ladder: **Implemented (simulator only) → Automated-tested**. Not manually tested against a real transport, **not security-reviewed**, **not production-approved**. This document is a draft to scope an independent security review; it is not a certification.

## Prototype vs production (read first)

The shipped code contains a **development-only, in-memory sync simulator** (`client/src/lib/syncSimulator.ts`) used by the Continuity experience. It performs **no real cryptography** and **no network I/O** — "envelopes" carry an opaque blob and a version counter. Nothing in this repository constitutes production end-to-end encryption. A production sync service is out of scope until the open items below are closed by qualified reviewers.

## Assets to protect

- The user's context graph (notes, evidence, relationships, tasks).
- The user's accessibility preferences and profile.
- Device identities and pairing material.
- Metadata (which devices exist, when they sync, how often).

## Trust boundaries

1. On-device app storage (already encrypted at rest on Android via Keystore; browser storage is not a security boundary).
2. The user's own device set (phone, laptop, future devices).
3. Any future relay/transport between devices.
4. Recovery and re-enrollment flows.

## Adversaries considered

- Network attacker (passive eavesdrop, active tamper, replay).
- Malicious or compromised relay/server operator.
- Lost/stolen enrolled device.
- Revoked device attempting continued access.
- Attacker attempting recovery-flow abuse to weaken encryption.

## Required properties (production, to be verified by review)

- Content is encrypted with keys the relay never possesses (true E2EE).
- Mutual device authentication before any sync.
- Replay/stale rejection (the simulator models version-counter rejection; production needs authenticated, monotonic, tamper-evident versioning).
- Revocation removes a device's ability to decrypt future updates (key rotation).
- Deletion propagates as an authenticated tombstone.
- Recovery never downgrades encryption (the passkey flow models this invariant; production must enforce it cryptographically).
- Metadata minimization; no default server relay.

## Known simulator ↔ production gaps

| Concern | Simulator behavior | Production requirement |
|---|---|---|
| Confidentiality | Opaque blob, no crypto | Vetted E2EE library; relay sees only ciphertext |
| Authentication | Device id string | Mutual, key-based device auth |
| Integrity/replay | Numeric version compare | Authenticated, tamper-evident ordering |
| Revocation | In-memory flag | Key rotation + re-encryption policy |
| Recovery | State-machine invariant | Cryptographic guarantee, tested |
| Metadata | N/A (local) | Minimized, documented, reviewed |

## Open items requiring human security review (blocking production)

1. Select and review the cryptographic protocol/library (no custom primitives).
2. Key management, rotation, and recovery design review.
3. Metadata-leakage analysis and mitigation.
4. Formal replay/tamper/rollback testing on the real transport.
5. Threat re-assessment after any architecture change.

Until all items are closed and signed off, the product must describe sync as a **local prototype simulator**, exactly as the UI does.
