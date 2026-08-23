# ContextOS OEM Integration Boundary

## What a standalone application can deliver

The accompanying `android-contextos` application is the correct starting point for a privacy-first MVP. It can accept **user-initiated** content through Android’s share sheet, a document picker, a camera capture, and a private note. It can store and reason over this content locally, with provenance and deletion controls.

This is a useful and deployable application feature. It is not an operating-system context service.

| Standalone application | OEM / OriginOS platform module |
|---|---|
| User-selected document and image capture | Context broker for consented, system-mediated signals |
| Share-sheet ingestion | Origin Island card or system surface |
| App-private encrypted graph | Platform account-less graph protected by OS policy |
| Explicit “continue” export intent | Office Kit context-transfer protocol |
| Local recommendation UI | Task Handoff semantic-state preservation |
| User-only permissions | Signature permissions, platform signing, SELinux and API review |

Android’s sandbox is not an obstacle to work around; it is the reason that cross-app continuity must be delivered as a **governed OS capability** rather than an app that surveils other apps.[1]

## Required iQOO/vivo collaboration

Deploying ContextOS as an actual iQOO phone feature requires a written OEM engagement and at least these deliverables:

| Workstream | Required OEM commitment |
|---|---|
| **Platform ownership** | A signed system or privileged application package, reviewed by the OriginOS security team. |
| **Consent broker** | OS-level policy UI that mediates every source and lets users revoke individual scopes. |
| **Context provider contracts** | Narrow, versioned APIs for Origin Island, DocMaster, AI Captions, Office Kit, and Task Handoff. No arbitrary database access. |
| **On-device runtime** | Support contract for AICore, BlueLM/VCAP, LiteRT-LM, or another vendor-approved local runtime; capability discovery must be device-specific. |
| **Cross-device transfer** | Encrypted, mutually authenticated transport between the user’s own devices; no default server relay. |
| **Security review** | Threat modeling, prompt-injection tests, resource/battery profiling, model evaluation, and OTA update plan. |
| **Compliance** | Region-specific privacy review, app-store disclosures if distributed separately, and documented retention/deletion behavior. |

## Non-negotiable product requirements

1. **No ambient surveillance.** Context is acquired through explicit user action or a visibly enabled, source-specific system integration.
2. **No cloud fallback.** If a device lacks a supported local runtime, the product must either use deterministic local extraction or say that advanced enrichment is unavailable.
3. **No opaque action.** Any suggested action must show its source, confidence, and intended effect, then require confirmation.
4. **No environmental instructions.** Screen, document, audio, and notification text remain data. They cannot become system instructions.
5. **No irretrievable memory.** Users can inspect, correct, archive, or forget a context, with deletion propagated across any locally paired devices.

## Product rollout stages

| Stage | Scope | Success condition |
|---|---|---|
| **MVP APK** | User-shared text, files, camera, encrypted local graph, visible deletion. | An offline user can make and delete a context without granting broad device access. |
| **Partner beta** | Approved OriginOS surface, documented consent broker, model capability detection. | The integration passes iQOO security and battery tests on target devices. |
| **System feature** | Privileged provider contracts and encrypted device-to-device continuity. | No cross-app source is accessible without an explicit policy grant and provenance record. |

## Reference

[1]: https://source.android.com/docs/security/app-sandbox "Android Open Source Project — Application Sandbox"

