# ContextOS for Android

This directory contains the native, **local-only Android 10+ app** for ContextOS. It is vendor-neutral: the same APK can run on supported Samsung, Pixel, Motorola, Xiaomi, Redmi, POCO, OnePlus, OPPO, realme, vivo, iQOO, Nothing, Sony, Nokia, and other Android devices. Runtime behavior is selected from reported capabilities, never from a manufacturer allowlist.

The app accepts deliberately shared text, documents, images, private notes, camera captures, and optional voice input. It builds an encrypted local context graph, produces deterministic and explainable suggestions, answers local questions with provenance, and lets the user delete a thread. It declares **no `INTERNET` permission** and includes no analytics, advertising, notification listener, accessibility service, account, contact, calendar, location, or identifier access.

## How the app adapts to a phone

At startup and after returning from Android settings, `DeviceCapabilityDetector` builds a runtime profile:

| Capability | Adaptive behavior | Universal fallback |
|---|---|---|
| Local context reasoning | Deterministic Kotlin engine works on the CPU on every supported device. | Always available; no model or cloud service is required. |
| OCR | Bundled Latin, Chinese, Devanagari, Japanese, and Korean ML Kit models; the primary script follows the phone locale. | User can paste/share text or enter a private note. |
| Offline speech | Used only on Android 12+ when Android reports an installed on-device recognizer and microphone permission is granted. | Typed notes and typed questions remain enabled. |
| Camera | Enabled only when the phone has camera hardware and a compatible capture activity. | Choose an existing image through the document picker. |
| Documents | Enabled only when an Android document provider can handle the request. | Share text directly or enter a note. |
| Memory/processing | Low-RAM phones use a 1280 px image limit and one PDF page; other phones use 2048 px and up to three pages. | Text is bounded to 12,000 characters on every device. |
| Optional OEM AI | May be reported through `DeviceAiFeatureProvider` only by a documented, signed integration. | Deterministic reasoning, bundled OCR, and explicit user capture remain active. |

There is no generic Android API that safely exposes every manufacturer's private foundation model or NPU. ContextOS therefore does not guess from `Build.MANUFACTURER`, probe hidden services, or claim that an installed OEM assistant is available to third-party apps. A future Gemini Nano/AICore, LiteRT, or OEM implementation must be a separate provider that reports actual readiness and fails back to the deterministic engine. There is never a silent cloud fallback.

## Included security and compatibility behavior

- Android 10 and 11 never load Android 12-only speech calls; voice is shown as unavailable instead of crashing.
- Camera and microphone are declared optional, so app stores do not exclude otherwise compatible devices.
- Speech is locale-aware, times out, maps common provider errors, and releases the recognizer on every terminal path.
- Image decoding, OCR, text reading, and PDF rendering are bounded for predictable memory use.
- Capture APIs return typed success/empty/unsupported outcomes, so error messages cannot become stored evidence.
- The encrypted graph is excluded from cloud backup and device transfer; its Android Keystore key remains non-exportable.
- External content is evidence only. It cannot execute actions or become a system instruction.

## Build and install

Open `android-contextos` in a current Android Studio installation with Android SDK 36 and JDK 17. Connect any Android 10+ test device with USB debugging enabled, then choose **Run**. On Windows PowerShell, the command-line build is:

```powershell
.\gradlew.bat :app:testDebugUnitTest :app:assembleDebug
adb install -r app\build\outputs\apk\debug\app-debug.apk
```

The Gradle build may download dependencies on the development computer. The installed APK has no runtime network permission. OCR models are bundled so OCR also works on devices without Google Play services; bundling all five script families increases APK size.

## Architecture

```text
User-initiated capture
  ├── note / shared text
  ├── document / existing image
  ├── optional camera
  └── optional Android on-device speech
          ↓
Capability-selected local extraction
  ├── locale-selected bundled ML Kit OCR
  ├── memory-aware image and PDF limits
  └── deterministic entity/task parser
          ↓
Encrypted local graph
  ├── evidence + digest + consent marker
  ├── explicit active context
  └── local query and relationship matching
          ↓
Visible recommendation
  ├── source, confidence, and explanation
  └── user-controlled thread deletion
```

## Supported versus optional AI

The shipped app actually uses three local intelligence layers: deterministic graph reasoning, bundled OCR, and Android's on-device speech recognizer when the platform reports it ready. Proprietary device AI is not automatically accessible to a normal APK. Integrating a vendor model, system context surface, or cross-device handoff requires a public/partner SDK, explicit consent, signature-level authorization where applicable, availability checks, and a separate security review. See [OEM integration boundaries](../docs/OEM_INTEGRATION.md).

## References

- [Android application sandbox](https://source.android.com/docs/security/app-sandbox)
- [Android Keystore](https://developer.android.com/privacy-and-security/keystore)
- [ML Kit Text Recognition v2 for Android](https://developers.google.com/ml-kit/vision/text-recognition/v2/android)
- [Android on-device AI overview](https://developer.android.com/ai)
- [LiteRT for Android](https://ai.google.dev/edge/litert/android)
