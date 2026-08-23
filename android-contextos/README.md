# ContextOS Android Prototype

This directory contains the native, **local-only Android MVP** for ContextOS. It accepts intentionally shared text, documents, images, private notes, and user-triggered voice notes; runs OCR and (when available) the Android on-device speech recognizer; builds a local context graph; produces deterministic, explainable suggestions; and lets users delete a thread. It declares **no `INTERNET` permission** and includes no analytics, advertising, notification listener, accessibility service, account, contact, calendar, location, or identifier access.

The project is deliberately a standalone Android application, not a modified iQOO system component. It is a deployable vertical slice for real user-initiated context capture, but it cannot claim Origin Island integration, arbitrary cross-app memory, or system-level task handoff without an iQOO/vivo OEM agreement. Android’s application sandbox prevents a normal application from reading another application’s private data by default.[1]

| Capability | Included in this prototype | Processing location |
|---|---|---|
| Private note ingestion | Yes | App process and encrypted app-private storage |
| Text shared from another app | Yes, through the Android share sheet | App process and encrypted app-private storage |
| Image/PDF OCR | Yes, through user-selected input or camera capture | ML Kit on-device OCR |
| Voice note | Yes, after microphone permission and only when Android reports an on-device recognizer is available | Android `createOnDeviceSpeechRecognizer`; no remote fallback |
| Local graph matching | Yes | Kotlin deterministic rule engine |
| Natural-language graph query | Yes, in text or through on-device voice when available | Local thread, evidence, task, and relationship matching with visible provenance |
| Explainable suggestion and provenance | Yes | App process |
| Forget / full local deletion | Thread-level forget is included; settings wipe is documented as the next UI addition | App-private encrypted storage |
| Local foundation-model enrichment | Interface-ready, but model provisioning is intentionally not bundled | AICore/ML Kit GenAI or LiteRT-LM, device dependent |
| Origin Island / Office Kit / privileged handoff | No | Requires OEM integration |

## Build and install

Open `android-contextos` in Android Studio (Ladybug or newer) with an installed Android 36 SDK. Connect an Android 10+ device, preferably an eligible OriginOS 6 device for performance testing, then choose **Run**. The app has no runtime network path, so build tooling may download Gradle dependencies during development, but the installed app does not request network access or send user data to a cloud service.

```bash
cd android-contextos
./gradlew :app:testDebugUnitTest :app:assembleDebug
adb install app/build/outputs/apk/debug/app-debug.apk
```

This repository ships the Gradle wrapper, so `./gradlew :app:testDebugUnitTest :app:assembleDebug` is the preferred validation and build command. The local engine has five automated unit tests covering work, home, environmental-text handling, provenance-bound query matching, and next-step query behavior. Large model weights are intentionally not included. A custom LiteRT-LM model must be provisioned locally by the user or device vendor; it must never be fetched by the ContextOS app at runtime when operating in strict local-only mode.

## Architecture

```text
User-initiated capture
  ├── note / shared text
  ├── document selection
  └── camera image
         ↓
On-device extraction
  ├── ML Kit OCR for image/PDF text
  └── deterministic entity/task parser
         ↓
Local graph repository
  ├── encrypted app-private file
  ├── evidence + hash + consent marker
  └── context-thread matching
         ↓
Visible recommendation
  ├── source and explanation shown
  └── user can forget the thread

Local question
  ├── typed or on-device voice query
  ├── matches saved local thread, evidence, tasks, and relations
  └── returns answer + provenance; never invokes an action
```

The encryption key is generated in Android Keystore and is non-exportable from the application process. The data file remains in internal app storage and Android backup is disabled. Android Keystore supports non-exportable key material and can bind supported keys to device secure hardware where available.[2]

## Safe processing model

External content is always classified as **evidence**, not as executable instruction text. The local engine uses explicit task and relationship patterns only; it does not expose an autonomous action tool, access an accessibility tree, or execute a command found in a document. This makes the vertical slice resistant to prompt-injection-style instructions embedded in shared files.

The product architecture supports optional on-device generative enrichment, not mandatory model use. Gemini Nano through AICore can process supported requests locally on eligible devices; LiteRT-LM can instead run a vendor- or user-provisioned local model with GPU/NPU acceleration.[3] [4] In both paths, an assistant response must remain advisory and source-linked.

## OEM deployment path

For an iQOO feature, iQOO/vivo would need to sponsor a privileged system module or a signed partner integration. The required work is described in [OEM integration boundaries](../docs/OEM_INTEGRATION.md) and is not something a standalone APK can enable. The relevant public OriginOS product surface already includes AI search, AI captions, document scanning, and other contextual tools; ContextOS should be positioned as the governed continuity layer connecting such inputs, not as a replacement for OriginOS.[5]

## References

[1]: https://source.android.com/docs/security/app-sandbox "Android Open Source Project — Application Sandbox"

[2]: https://developer.android.com/privacy-and-security/keystore "Android Developers — Android Keystore System"

[3]: https://developer.android.com/ai/gemini-nano "Android Developers — Gemini Nano"

[4]: https://developers.google.com/edge/litert-lm/android "Google AI Edge — Get Started with LiteRT-LM on Android"

[5]: https://www.iqoo.com/in/originos "iQOO — OriginOS 6"
