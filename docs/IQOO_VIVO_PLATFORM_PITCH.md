# ContextOS MVP: iQOO/vivo Platform Integration Pitch

**Audience:** iQOO/vivo product, OriginOS platform, AI runtime, privacy/security, Office Kit, and system-UX leaders.  
**Recommended format:** 12 slides, 9 minutes of presentation, 6 minutes of discussion.  
**Single outcome sought:** agreement on a narrowly scoped partner beta for a governed, on-device context provider.

> **Positioning:** ContextOS does not claim to invent AI planning. It proposes a **persistent, user-governed context layer** that can connect approved OriginOS signals into an explainable state across moments and devices.

## Narrative principles

Lead with a real continuity problem, demonstrate the already-running local MVP, and then make the platform ask small and reviewable. Do not describe the standalone APK as a system feature. Android’s app sandbox prevents a standard application from reading arbitrary private app data, which is why a secure platform provider is the correct delivery path.[1]

| Say this | Avoid saying this |
|---|---|
| “A governed context provider that connects user-consented signals.” | “An app that remembers everything on your phone.” |
| “On-device by default; no app-declared network permission.” | “We will upload memories only when needed.” |
| “Source-scoped access and provenance.” | “We need broad app access.” |
| “An addition to OriginOS’s existing AI surfaces.” | “A replacement for OriginOS AI.” |
| “A partner beta with defined policy boundaries.” | “We can deploy it as an OS feature from an APK.” |

## Slide-by-slide outline and speaking script

| # | Slide title and visual | Core content | Speaker script | Time |
|---:|---|---|---|---:|
| 1 | **ContextOS — the intelligence between moments**. Use the Signal Atlas hero visual. | Subtitle: “A local-first continuity layer for OriginOS.” | “iQOO already gives users powerful moments: search, captions, document tools, handoff, and contextual surfaces. ContextOS asks one question: what carries the *meaning* of one moment into the next?” | 0:35 |
| 2 | **The continuity gap**. Show three isolated tiles: calendar, document, voice note. | A review invite, a slide draft, and a voice note each contain useful information; today they remain separate. | “A phone can identify text in a slide and transcribe a voice note. The user’s friction starts later: reconstructing what those items meant together and what still needs attention.” | 0:40 |
| 3 | **What ContextOS is—and is not**. Two-column framing. | Is: local graph, provenance, scoped recommendations. Is not: surveillance, cloud memory, autonomous agent. | “This is not a background recorder and not an agent with ambient authority. It is a small personal graph built from deliberate user captures, with a visible source and a delete control for every recommendation.” | 0:45 |
| 4 | **MVP running today**. Screen of the Android app and live web workbench. | Capture note/image/document/voice; local graph; source and task. | “The MVP already accepts typed notes, shared content, user-selected documents, images, camera capture, and capability-gated on-device voice. It encrypts the graph in app-private storage and shows why a thread is in focus.” | 0:45 |
| 5 | **Live demo: life becomes a project state**. Use simple flow: poster → brief → voice → query. | One vertical: hackathon / client review. | “I will add three inputs. Notice that each one is evidence, not a command. ContextOS extracts the people, timing, task cues, and relationship—but it never turns text inside a capture into an instruction.” | 1:10 |
| 6 | **Live demo: ask the local graph**. Show query card with provenance. | Voice: “What should I do next for the client review?” | “The answer is generated from the local graph only. We show the selected thread, confidence, and the evidence supporting it. There is no remote query and no tool invocation.” | 0:55 |
| 7 | **Privacy is the product surface**. Diagram: deliberate capture → encrypted graph → answer/forget. | No Internet in MVP; microphone only; per-thread delete. | “Our final APK permission audit lists only microphone access plus Android’s generated receiver permission. It does not declare Internet or network-state access. That is a measurable privacy contract, not a claim in a slide.” | 0:50 |
| 8 | **Why this belongs in OriginOS**. ContextOS above existing surfaces. | Origin Island, AI Search, captions, DocMaster/scan, Office Kit, Task Handoff become approved signal providers. | “OriginOS already presents contextual and AI capabilities. ContextOS is the missing governed layer that can preserve selected state across them. The product opportunity is ‘start on your phone, continue your context’.” [2] | 0:50 |
| 9 | **The necessary boundary**. Standalone APK vs OEM platform module. | Table: current app capability, requested system capability, guardrail. | “The Android sandbox is why we are not asking for arbitrary access. A real system feature must expose narrow, source-scoped provider APIs, a consent broker, and signed integration. We are requesting that platform path—not a workaround.” [1] | 0:55 |
| 10 | **On-device intelligence stack**. Runtime capability tree. | Deterministic local engine now; AICore/ML Kit GenAI or LiteRT-LM when supported; on-device voice if available. | “The product fails gracefully. The deterministic graph works everywhere in scope. On supported devices, AICore can provide on-device model capabilities; LiteRT-LM is an option for locally provisioned custom models; local voice recognition is capability-gated.” [3] [4] [5] | 0:50 |
| 11 | **Partner beta proposal**. Three phases. | 1. Provider contract + consent. 2. Surface + model capability. 3. Cross-device continuity. | “We propose a constrained beta: first connect only documents and deliberate voice capture. Validate privacy, latency, and battery. Then add a single Origin Island surface and Office Kit continuation once the policy model is proven.” | 0:45 |
| 12 | **The ask**. Finish with one sentence and four workstreams. | “Sponsor a 6–8 week partner beta for a governed on-device context provider.” | “We need four owners: an OriginOS provider/API lead, AI-runtime capability lead, privacy/security reviewer, and Office Kit continuity lead. Our team brings the working graph, interaction model, test plan, and privacy verification.” | 0:35 |

## Exact MVP demo script

Prepare three short user-initiated inputs in the live workbench or Android app. Do not use personal production data.

| Step | Presenter action | Expected local result | Spoken line |
|---:|---|---|---|
| 1 | Enter: “Client review tomorrow at 9:00 AM. Aisha will add approved Q2 budget figures. Need to review slide 7.” Select **Note**, then **Map context**. | Thread “Client review”; extracted person, time, and task; graph nodes visible. | “This is one deliberate note. ContextOS records the source, identifies Aisha, tomorrow at 9:00 AM, and a review task. The original text remains the evidence.” |
| 2 | Add a second capture: “Q2_client_review.pptx contains a budget gap on slide 7.” Select **Document**. | Evidence joins the same thread; confidence and relation update. | “A second source strengthens the same thread. The system is not remembering more blindly; it is linking evidence that refers to the same work.” |
| 3 | Use offline voice query: “What should I do next for the client review?” | Answer shows the local suggestion, matched thread, provenance, and explanation. | “The answer comes from the selected local thread. We can inspect the source or forget the thread. There is no network fallback and no action happens without the user.” |
| 4 | Select **Forget this local context**. | Thread is removed from local graph. | “The product is only trustworthy if memory is governable. This removes the local thread and its evidence.” |

## Integration request: concrete workstreams

| Workstream | Requested capability | Minimum guardrail | Success metric |
|---|---|---|---|
| **OriginOS provider contract** | Signed, versioned context records from approved surfaces. | Source-by-source consent and revocation. | A user can see and revoke every active source. |
| **AI runtime** | Capability discovery for approved on-device model services. | No app-level cloud fallback. | Local response or explicit unavailable state. |
| **System UX** | Origin Island-compatible card for one active thread. | Show provenance, confidence, and confirm before an action. | User can explain why the card appeared. |
| **Office Kit continuity** | Encrypted state transfer between user-owned paired devices. | Mutual authentication; no default relay. | The user can continue a thread without exporting raw data to a server. |
| **Privacy/security** | Design and red-team review. | Environmental text cannot become system instruction. | No broad collection permission; deletion works end-to-end. |

## Likely questions and response lines

| Question | Response |
|---|---|
| “Why not use the existing assistant?” | “Existing assistants can reason in the moment. ContextOS is the governed memory/provenance layer that lets an approved assistant reason about a continuous user-owned thread.” |
| “Why is this an OS feature?” | “A standalone app can only work with explicit shares and captures. The platform is the only safe place to broker bounded cross-surface context without violating app isolation.” |
| “Will it hurt privacy?” | “The product is designed to reduce exposure: no app Internet permission, explicit capture, encrypted app-private graph, source inspection, and deletion. Any platform integration would retain those controls.” |
| “What if the model is unavailable?” | “The local graph and deterministic query path still operate. Advanced enrichment is capability-gated; unavailable means unavailable—not a secret remote fallback.” |
| “What is the first beta?” | “Documents and deliberate voice notes into a single project-review thread, one system card, explicit consent, and observable deletion. We measure accuracy, latency, battery, and user trust before expanding.” |

## References

[1]: https://source.android.com/docs/security/app-sandbox "Android Open Source Project — Application Sandbox"

[2]: https://www.iqoo.com/in/originos "iQOO — OriginOS 6"

[3]: https://developer.android.com/ai/gemini-nano "Android Developers — Gemini Nano"

[4]: https://developers.google.com/edge/litert-lm/android "Google AI Edge — LiteRT-LM for Android"

[5]: https://developer.android.com/reference/android/speech/SpeechRecognizer "Android Developers — SpeechRecognizer"
