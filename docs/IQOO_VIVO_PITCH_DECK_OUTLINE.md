## Cover

**ContextOS**  
The intelligence between moments  
An on-device, governed continuity layer for iQOO / OriginOS

## Slide 1: The continuity gap is the next UX problem

- iQOO already creates useful AI moments across search, documents, captions, and handoff.
- Users still reconstruct the project, people, timing, and unfinished work themselves.
- ContextOS preserves the meaning behind approved moments—not just the raw artifacts.

## Slide 2: ContextOS connects meaning, not surveillance

- Deliberate capture only: note, share, document, camera, or visible voice action.
- A local graph links evidence, people, tasks, timing, and relationships.
- Every recommendation exposes provenance, confidence, and a forget control.

## Slide 3: The local-first MVP already runs

- Native Android app with encrypted app-private context graph.
- User-initiated text, image/PDF OCR, camera, and capability-gated on-device voice capture.
- No app-declared Internet or network-state permission; microphone is the only sensitive runtime permission.

## Slide 4: One project can stay coherent across days

- Capture: “Client review tomorrow at 9:00 AM.”
- Add evidence: a slide draft and named responsibility.
- See: one active thread, linked sources, and a time-sensitive next step.

## Slide 5: Live demo—map a deliberate signal

- Enter a note, voice outcome, document excerpt, or camera observation.
- Inspect the extracted person, time, task, source, and graph nodes.
- Show that the original input remains visible as evidence.

## Slide 6: Live demo—ask the graph offline

- Ask: “What should I do next for the client review?”
- The local graph returns the matching thread, answer, confidence, and provenance.
- Environmental text has no action authority; the answer is read-only and local.

## Slide 7: Trust is part of the interface

- Explicit capture, app-private encryption, source labels, and per-thread forget.
- The product fails closed when an on-device capability is unavailable.
- No remote model fallback and no broad collection permission.

## Slide 8: ContextOS strengthens existing OriginOS surfaces

- Approved inputs: AI Search, captions, document tools, Origin Island, Office Kit, and Task Handoff.
- ContextOS adds continuity, provenance, and a shared user-owned thread.
- Position it as a governed platform layer, not a replacement for existing AI.

## Slide 9: The standalone APK proves the experience—not the OS integration

- Android sandboxing correctly prevents arbitrary cross-app data access.
- A real system feature requires a signed provider contract and an OS consent broker.
- The MVP is the safe vertical slice for validating value before privileged access.

## Slide 10: The on-device intelligence plan is capability-gated

- Deterministic local graph and query engine run as baseline.
- AICore/ML Kit GenAI or LiteRT-LM can enrich supported devices.
- On-device voice works only when the OS reports local recognition availability.

## Slide 11: A focused partner beta can prove the model

- Phase 1: source-scoped document and voice inputs plus consent UI.
- Phase 2: one Origin Island surface and provenance card.
- Phase 3: encrypted Office Kit continuity between a user’s paired devices.

## Slide 12: The platform ask is specific

- Sponsor a 6–8 week partner beta for a governed on-device context provider.
- Assign API, AI runtime, privacy/security, and continuity workstream owners.
- Measure trust, retrieval accuracy, latency, battery, and deletion behavior before expansion.
