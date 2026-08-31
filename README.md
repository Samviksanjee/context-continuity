# Context Continuity — ContextOS

> **The intelligence between moments, on the device the user already has.**

ContextOS is a privacy-first contextual intelligence layer that turns deliberately captured notes, documents, images, voice, and shared text into persistent, explainable, user-controlled context. The repository now has two usable surfaces:

- a responsive React/PWA concept and interactive local-memory demo for modern browsers;
- a native, local-only Android 10+ app that adapts to each phone's public capabilities instead of targeting one manufacturer.

## Cross-device product baseline

The Android app is designed for supported phones from Samsung, Google, Motorola, Xiaomi, Redmi, POCO, OnePlus, OPPO, realme, vivo, iQOO, Nothing, Sony, Nokia, and other vendors. It does **not** branch on the brand. At runtime it checks camera/document handlers, microphone availability, Android's installed on-device speech provider, phone locale, and memory class.

| Device condition | ContextOS behavior |
|---|---|
| Any supported Android 10+ phone | Deterministic local graph reasoning, encrypted storage, notes, shares, and typed queries. |
| Phone locale uses Chinese, Devanagari, Japanese, Korean, or Latin script | Selects the matching bundled ML Kit OCR model. |
| Android 12+ with an installed offline speech provider | Enables voice after microphone permission. |
| Android 10/11 or no offline speech provider | Disables voice safely and keeps typed input available. |
| Low-memory phone | Reduces image resolution and PDF page count. |
| No camera activity | Disables direct capture and keeps existing-image/document selection available. |
| Approved optional OEM/model adapter | May report its real availability through a provider seam. |
| No optional model adapter | Uses the deterministic engine; never falls back to cloud inference. |

A normal APK cannot generically access every manufacturer's private AI model, NPU, assistant, or cross-app context. Those features require a documented public/partner SDK, explicit consent, and often platform signing. Optional OEM research remains in `docs/`, but it is not a dependency of the portable app.

## What is included

| Area | Included behavior |
|---|---|
| **Native Android app** | User-initiated note/share/document/image/camera capture, optional offline voice, multilingual bundled OCR, encrypted graph, local queries, provenance, and deletion. |
| **Capability adaptation** | Public-API checks, locale-selected OCR, low-RAM processing limits, and visible feature status/fallbacks. |
| **Interactive web demo** | A switchable local workbench that activates one context while preserving unrelated contexts as inactive. |
| **Installable PWA** | Offline-cached shell, browser-local thread persistence, camera input, provider-dependent browser voice, and touch graph controls. |
| **Documentation** | Architecture, privacy boundaries, Android deployment, and optional OEM integration contracts. |

## Trust contract

1. Context enters through an explicit user action or a separately consented, source-specific platform integration.
2. External text, images, documents, and audio are evidence—not executable instructions.
3. The active context is explicit; unrelated memories do not silently influence a recommendation.
4. Every insight keeps provenance and an explanation.
5. Suggested actions remain advisory and reversible until the user confirms them.
6. Memory can be inspected and forgotten.
7. The shipped Android app has no `INTERNET` permission and no silent cloud fallback.

## Project structure

```text
context-continuity/
├── android-contextos/              # Native vendor-neutral Android 10+ app
│   ├── app/src/main/java/          # Compose UI, capability detection, capture, graph engine
│   ├── app/src/test/               # Deterministic engine tests
│   └── README.md                   # Device matrix, build, and security details
├── client/                         # React/Vite PWA and interactive concept
├── server/                         # Static production server
├── docs/
│   ├── ARCHITECTURE.md
│   ├── ANDROID_DEPLOYMENT.md
│   ├── FEASIBILITY_AND_PRIVACY.md
│   └── OEM_INTEGRATION.md          # Generic contract for optional signed integrations
└── package.json
```

## Build the Android app

Requirements: JDK 17, Android SDK 36, and an Android 10+ device or emulator.

```powershell
cd android-contextos
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

The development computer may download Gradle dependencies. The installed app cannot make runtime network requests. Bundled OCR supports Latin, Chinese, Devanagari, Japanese, and Korean script families even on phones without Google Play services.

See [`android-contextos/README.md`](android-contextos/README.md) for the capability matrix and implementation details.

## Run the web/PWA experience

```powershell
pnpm install
pnpm check
pnpm build
```

Use `pnpm dev` manually for the long-running development server. The production Express entry only serves the built PWA; it is not an Android API or cloud inference backend.

## Architecture at a glance

```text
Explicit inputs → capability-selected perception → encrypted memory → local reasoning → advisory output
 notes/shares      OCR / offline speech          context graph       provenance        user decides
```

The deterministic engine is the universal baseline. Bundled OCR and Android's public on-device speech API are optional accelerators selected by actual readiness. Future Gemini Nano/AICore, LiteRT, or OEM providers must implement an explicit adapter, report model-level availability, preserve provenance, and fail back locally.

## Important scope boundary

The standalone app does not read other apps' private data, notifications, accessibility trees, accounts, contacts, calendars, or location. Cross-app/system continuity cannot be safely manufactured by an ordinary APK. It requires a governed OS provider contract as described in [`docs/OEM_INTEGRATION.md`](docs/OEM_INTEGRATION.md).

## References

- [Android application sandbox](https://source.android.com/docs/security/app-sandbox)
- [Android Keystore](https://developer.android.com/privacy-and-security/keystore)
- [ML Kit Text Recognition v2](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Android on-device AI](https://developer.android.com/ai)

## Development agent (optional, not shipped)

This repo can be worked on with [Prime Agent](https://github.com/PrimeIntellect-ai/prime-agent), a repo-aware development/research agent. It is a **development tool only** — it is never imported by the product and never enters the product build graph, and it is fully reversible. Its project instructions live in [`AGENTS.md`](AGENTS.md) and its skills in `.prime/agent/skills/`. Setup, Windows notes, credential handling (kept out of the repo), and removal steps are in [`docs/PRIME_AGENT.md`](docs/PRIME_AGENT.md). The `tests/tooling/prime-agent-isolation.test.ts` guard keeps the product free of any dev-agent or cloud-AI coupling.
