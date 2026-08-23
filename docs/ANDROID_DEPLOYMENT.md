# ContextOS Android Deployment Guide

## What is ready now

The repository contains a compiled **debug APK** for the standalone ContextOS MVP. It is suitable for controlled device testing. The package name is `ai.contextos`, the minimum supported API level is Android 10 (API 29), and the tested build command is:

```bash
cd android-contextos
./gradlew :app:testDebugUnitTest :app:assembleDebug
```

The build completed with five local context-engine tests passing and no test failures. The generated APK is `android-contextos/app/build/outputs/apk/debug/app-debug.apk`.

| Verification | Observed result |
|---|---|
| Unit tests | 5 tests, 0 failures, 0 errors. |
| APK package | `ai.contextos` |
| Declared permissions | `RECORD_AUDIO` only, plus the Android-generated non-exported receiver permission. |
| Internet permission | Not declared; transitive Internet and network-state declarations are removed at manifest merge. |
| Capture paths | Private note, Android share, user-selected document/image, camera preview, optional on-device voice recognizer. |

## Install on a test iQOO device

Enable developer options and USB debugging on a test device that you own or are authorized to use. Connect it by USB, verify the device in `adb devices`, then install the debug package.

```bash
adb install -r android-contextos/app/build/outputs/apk/debug/app-debug.apk
```

Open **ContextOS**. Create a note, share a short text snippet into the app, or select a document. The app will create a local context, show the evidence that supports it, and make a local suggestion. Use **Forget this local context** to remove the selected thread from the encrypted app-private store.

Use **Ask your local context** to type a question such as “When is the client review?” or “What should I do next?” The answer card identifies the matched thread, confidence, source evidence, and a plain-language explanation. The voice query path uses the same on-device recognizer policy as voice capture and fails closed if local recognition is unavailable.

> The voice button requests microphone permission only after the user selects it. It uses `createOnDeviceSpeechRecognizer` and fails closed if the device does not report local recognition availability. It does not call the ordinary speech-recognition factory because the ordinary API may stream audio to a remote service.[1]

## Verify the privacy contract

Before a test, inspect the final manifest rather than relying on source declarations. The following command should list `RECORD_AUDIO` but must not list `android.permission.INTERNET` or `android.permission.ACCESS_NETWORK_STATE`.

```bash
$ANDROID_HOME/build-tools/36.0.0/aapt dump permissions \
  android-contextos/app/build/outputs/apk/debug/app-debug.apk
```

Do not add notification access, accessibility access, contacts, calendar, location, advertising identifiers, analytics SDKs, or a remote model fallback to the APK. Those additions would violate the current local-only product promise and change the app’s disclosure and threat model.

## Production APK versus iQOO system feature

The debug APK is **not** a production release. A production standalone app needs a release signing key owned by the responsible organization, reproducible CI builds, dependency review, security testing, store disclosures, and a privacy policy. Do not ship an APK signed with an ad hoc developer debug key.

An iQOO phone feature is a separate deployment category. It requires an OEM partnership because a normal Android application cannot access arbitrary private state from other apps or place content in proprietary OriginOS system surfaces. Android assigns applications distinct UIDs and enforces process and data isolation by default.[2]

| Target | Who can ship it | Required next work |
|---|---|---|
| **Standalone app** | The application publisher. | Release signing, device QA, privacy policy, data safety disclosure, local-model capability testing. |
| **iQOO/OriginOS feature** | iQOO/vivo platform team or an authorized partner. | Signature permissions, OS consent broker, Origin Island/Office Kit provider contracts, system model runtime integration, security/OTA review. |

## OEM handoff package

Provide the following materials to an iQOO/vivo product and platform-security review:

| Artifact | Location in this repository |
|---|---|
| Native local-only source | `android-contextos/` |
| Local graph and capture model | `android-contextos/app/src/main/java/ai/contextos/core/` |
| Privacy feasibility assessment | `docs/FEASIBILITY_AND_PRIVACY.md` |
| Platform boundary and signed-integration proposal | `docs/OEM_INTEGRATION.md` |
| Product narrative and web concept | Root site and `docs/ARCHITECTURE.md` |

The core product request to the OEM should be narrow: **provide consented, source-scoped system context through documented APIs, retain provenance and deletion controls, and never allow a context provider to read arbitrary app state.** iQOO’s public OriginOS page already describes AI search, captions, and document scanning, so ContextOS should be presented as the governed continuity layer that can connect approved signals rather than replace those services.[3]

## References

[1]: https://developer.android.com/reference/android/speech/SpeechRecognizer "Android Developers — SpeechRecognizer"

[2]: https://source.android.com/docs/security/app-sandbox "Android Open Source Project — Application Sandbox"

[3]: https://www.iqoo.com/in/originos "iQOO — OriginOS 6"
