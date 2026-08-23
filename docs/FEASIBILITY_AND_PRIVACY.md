# ContextOS Feasibility and Privacy Notes

## Verified platform constraints

The standalone ContextOS prototype must respect Android’s app sandbox. Android assigns each app its own UID and process; by default, one third-party app cannot read another app’s private data or interact with the operating system outside granted capabilities. This means a normal Play-distributed application **cannot** inspect arbitrary app screens, private messages, documents, or system-wide context merely because ContextOS would benefit from the data.[1]

As a result, the prototype will use **explicit, user-initiated inputs**: share-sheet documents and images, in-app voice notes, typed notes, and user-created tasks. It will not use accessibility access as a generic data-collection mechanism, capture screens in the background, scrape notifications, or attempt to bypass Android’s sandbox.

| Delivery level | What can be implemented | What cannot be claimed |
|---|---|---|
| **Standalone Android app** | Local context graph, on-device extraction, user-shared documents and images, voice capture, local recommendations, export/delete controls. | Full system-wide semantic memory, Origin Island surfaces, cross-app private-data access, or OS-level handoff. |
| **iQOO/OriginOS partner integration** | Privileged context provider, Origin Island affordances, bounded cross-device continuity, system permission broker, OEM AI runtime integration. | Availability without an iQOO/vivo engineering partnership, signing keys, privileged permissions, and platform review. |

## Local-only inference and storage

Google’s Android LLM inference guidance documents that language-model inference can run completely on-device, including text, image, and audio modalities. The same guidance notes that its older MediaPipe LLM Inference API is maintenance-only and recommends LiteRT-LM for new Android Kotlin projects.[2] ContextOS should therefore use a runtime abstraction that can target LiteRT-LM or an iQOO-provided on-device model, with a deterministic extractor available when no local model is installed.

Android also documents Gemini Nano through AICore as an on-device option for eligible devices. AICore processes requests locally, does not retain prompts or outputs after a request, and manages compatible foundation-model delivery; however, its availability and supported capabilities depend on the device and system image.[5] The prototype therefore has two local execution paths: **AICore/ML Kit GenAI** when the supported capability is available, and **LiteRT-LM** with a user-provisioned local `.litertlm` model when a custom model path is appropriate. LiteRT-LM’s Kotlin API supports local GPU/NPU acceleration and multimodal inputs, but model loading can take significant time and must occur off the main thread.[6]

The local graph database should remain inside app-private storage. An Android Keystore-backed encryption key can be non-exportable and can be constrained to require recent device authentication where the threat model requires it.[3] No graph record, model prompt, raw capture, telemetry, or identifier should be sent to a server in the prototype.

## Privacy commitments for the prototype

| Control | Prototype commitment |
|---|---|
| **Network** | No `INTERNET` permission; network security configuration blocks cleartext traffic. |
| **Capture** | Each source is enabled individually and can be disabled independently; voice works only after microphone permission and an on-device recognizer capability check. |
| **Scope** | A source is processed only after user initiation through the app or an Android share sheet. |
| **Storage** | Encrypted, app-private database; raw inputs are retained only when the user explicitly saves evidence. |
| **Reasoning** | Graph matching and suggestions run locally; the user can inspect the source and relationship used. |
| **Retention** | Threads have archive and forget controls; a full local data wipe is available in settings. |
| **Identifiers** | No advertising ID, IMEI, contact upload, or persistent device identifier is collected. |

Even a local-only app still needs a transparent privacy policy and accurate store disclosures because it may access sensitive device capabilities such as camera or microphone. Google Play’s User Data policy requires clear disclosure, affirmative consent where data access is not reasonably expected, least-necessary collection, and a published privacy policy.[4]

## References

[1]: https://source.android.com/docs/security/app-sandbox "Android Open Source Project — Application Sandbox"

[2]: https://developers.google.com/edge/mediapipe/solutions/genai/llm_inference/android "Google AI Edge — LLM Inference Guide for Android"

[3]: https://developer.android.com/privacy-and-security/keystore "Android Developers — Android Keystore System"

[4]: https://support.google.com/googleplay/android-developer/answer/10144311 "Google Play Console Help — User Data Policy"

[5]: https://developer.android.com/ai/gemini-nano "Android Developers — Gemini Nano"

[6]: https://developers.google.com/edge/litert-lm/android "Google AI Edge — Get Started with LiteRT-LM on Android"

[7]: https://developer.android.com/reference/android/speech/SpeechRecognizer "Android Developers — SpeechRecognizer"
