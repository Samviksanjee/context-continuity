# Optional Android OEM integration boundaries

The standalone `android-contextos` app is the portable product baseline. It accepts **user-initiated** notes, shares, documents, images, camera captures, and optional on-device speech; stores an encrypted local graph; and reasons locally with visible provenance and deletion controls. It does not depend on a phone brand, Google Play services, a cloud API, or a proprietary assistant.

A conventional Android app is not an operating-system context service. Android's sandbox prevents it from reading private data from other apps, and ContextOS must not work around that protection with accessibility scraping, notification surveillance, hidden APIs, or guessed vendor services.

| Portable standalone app | Optional signed OEM/platform module |
|---|---|
| Capability-detected document and image capture | Governed provider for consented system signals |
| Android share-sheet ingestion | OEM system card, island, launcher, or assistant surface |
| App-private encrypted graph | Platform graph protected by OS policy and scoped identities |
| Explicit export/continue request | Contracted cross-device task handoff |
| Deterministic reasoning and bundled OCR | Approved local foundation model/runtime adapter |
| User runtime permissions | Signature permissions, platform signing, SELinux, and API review |

## Required contract for any vendor

A Samsung, Google, Xiaomi, OPPO, OnePlus, realme, vivo/iQOO, Motorola, Nothing, Sony, or other OEM integration must provide the same governed boundary:

| Workstream | Required commitment |
|---|---|
| Platform ownership | A documented SDK or signed/privileged module reviewed by the vendor security team. |
| Consent broker | OS-level policy UI that mediates each source and lets users revoke individual scopes. |
| Context provider contracts | Narrow, versioned APIs for approved sources; never arbitrary application database access. |
| On-device runtime | A supported public or partner model API with feature-level availability, model readiness, resource limits, and failure states. |
| Cross-device transfer | Encrypted, mutually authenticated transport between the user's own devices; no default server relay. |
| Security and quality | Threat modeling, environmental prompt-injection tests, resource/battery profiling, model evaluation, and OTA compatibility. |
| Compliance | Region-specific privacy review, accurate store disclosures, and documented retention/deletion behavior. |

`DeviceAiFeatureProvider` is the standalone app's discovery seam for such modules. A provider must report actual readiness. The core app does not select a provider from a manufacturer name and does not access hidden Binder services. If no approved provider is ready, deterministic reasoning remains the active engine.

## Non-negotiable product requirements

1. **No ambient surveillance.** Context enters through explicit user action or a visibly enabled, source-specific system integration.
2. **No cloud fallback.** If local advanced inference is unavailable, use deterministic extraction or state that enrichment is unavailable.
3. **No opaque action.** Suggestions show source, confidence, and intended effect, then require confirmation.
4. **Environmental content stays data.** Screen, document, audio, and notification text cannot become system instructions.
5. **Memory remains governable.** Users can inspect, correct, archive, and forget context, with deletion propagated to paired local devices.
6. **Capabilities, not brands.** Every optional source or AI runtime is enabled only after its contracted API reports support.

## Rollout stages

| Stage | Scope | Success condition |
|---|---|---|
| Portable APK | User-shared text/files, optional camera/voice, multilingual OCR, encrypted graph, visible deletion. | The same build degrades safely across Android 10+ device profiles. |
| Vendor adapter beta | One approved system surface, consent broker, and model/source capability provider. | The module passes that vendor's privacy, security, compatibility, and battery tests. |
| Platform feature | Privileged providers and encrypted device-to-device continuity. | No cross-app source is accessible without an explicit policy grant and provenance record. |

Vendor-specific pitch documents in this repository are historical/partner examples, not runtime dependencies or product requirements.

## Reference

- [Android application sandbox](https://source.android.com/docs/security/app-sandbox)
