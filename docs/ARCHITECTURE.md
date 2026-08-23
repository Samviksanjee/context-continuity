# ContextOS Architecture Reference

## Purpose and scope

ContextOS is a **conceptual intelligence architecture** for persistent, private, user-governed context. It should not be interpreted as a claim that the described system currently ships in iQOO or OriginOS. The proposal starts from a narrower premise: existing AI interactions can be unified through a persistent context graph that preserves evidence, time, scope, and user control.[1]

The architecture is deliberately organized around continuity rather than conversation history. A raw capture is not a memory until it has been structured, scoped, linked, and governed.

| Design question | Architectural response |
|---|---|
| What happened? | An **episodic memory** records a timestamped event and its evidence. |
| What is true now? | A **semantic memory** records a fact with source, confidence, and update history. |
| What must happen? | A **task memory** holds a goal, status, owner, and deadline. |
| When does it matter? | A **temporal memory** applies a validity window and decay policy. |
| What should remain private? | A **governance policy** scopes capture, retention, access, and deletion. |

## System layers

The system has four logical layers. A production implementation may divide these into services, but the responsibilities should remain separable so that capture, inference, storage, and action can be audited independently.

```text
Capture signals
     ↓
Perceive: normalize and extract candidate entities
     ↓
Remember: update graph + evidence ledger + memory lifecycle
     ↓
Reason: activate a scoped context and rank relevant relationships
     ↓
Act: request user permission for a concrete next step
```

### 1. Perceive

Perceive accepts consented inputs such as camera captures, documents, voice transcripts, screenshots, and explicit user actions. Its output is **structured candidate data**, not a final user truth. A poster might yield candidate values for `event`, `date`, `location`, and `topic`; a voice note might yield a candidate ownership relation.

| Input | Candidate extraction | Minimum provenance |
|---|---|---|
| Document | Title, entities, deadlines, task language | File identifier, page or section, extraction timestamp |
| Voice | Person, responsibility, intent, action request | Audio reference, transcript span, speaker confidence |
| Camera or screenshot | Event, place, text, visual relationship | Image reference, region, extraction confidence |
| User action | Opened, saved, shared, dismissed, corrected | App scope, action type, timestamp |

### 2. Remember

Remember resolves candidates into a personal context graph. The graph is not a loose collection of embeddings: each node and relationship carries the evidence required to explain why it exists. The memory manager can create a new context, strengthen an existing relationship, mark a fact as stale, or request clarification when competing interpretations exist.

```text
Context: AI Hackathon
  ├── Event → deadline → 2026-08-28
  ├── Person: Rahul → owns → Backend
  ├── Document: rules.pdf → supports → Event
  └── Task: Prototype demo → status → Missing
```

### 3. Reason

Reason selects an **active memory scope** based on explicit user focus, recency, intent, and evidence relevance. It should never silently mix unrelated contexts simply because they share a person, city, or keyword. This is the core rationale of the interactive memory-switching demo.

An illustrative ranking function can combine direct entity overlap, time proximity, user focus, source confidence, and policy eligibility. It must also allow a relationship to be excluded by the user.

```text
relevance = entity_overlap + temporal_fit + active_scope + source_confidence - policy_penalties
```

### 4. Act

Act turns a high-confidence relationship into an optional next step. The action layer must present its reasoning, name the source, and preserve an easy cancel path. In a prototype, this can be a visible button. In a product, actions should be permission-gated and auditable.

| Suggested action | Required explanation | Default permission state |
|---|---|---|
| Create task | Task title, deadline, supporting evidence | Ask before creating |
| Continue on PC | Current context summary and receiving device | Ask before handoff |
| Link document | Existing context and relationship rationale | Ask before linking |
| Forget memory | Scope of deletion and affected suggestions | Confirm destructive action |

## Canonical graph model

The following schema is intentionally database-neutral. It can be implemented with a local relational database plus graph edges, an embedded graph store, or a structured document layer. For a prototype, the most important qualities are deterministic provenance and controllable deletion.

```ts
type ContextNode = {
  id: string;
  contextId: string;
  type: "event" | "person" | "document" | "task" | "place" | "preference";
  label: string;
  confidence: number;
  lifecycle: "active" | "background" | "stale" | "forgotten";
  createdAt: string;
  updatedAt: string;
};

type ContextEdge = {
  id: string;
  fromId: string;
  relation: string;
  toId: string;
  confidence: number;
  evidenceIds: string[];
  validFrom?: string;
  validUntil?: string;
};

type Evidence = {
  id: string;
  sourceType: "camera" | "document" | "voice" | "action";
  sourceRef: string;
  capturedAt: string;
  span?: string;
  consentScope: string;
};
```

## Memory lifecycle and governance

The architecture should treat lifecycle controls as a product feature, not a hidden storage implementation. A memory must be inspectable, correctable, and forgettable. Sensitive categories should be excluded by policy before they enter long-term graph memory.

| Lifecycle state | Meaning | User control |
|---|---|---|
| **Active** | The context is relevant to the current task or declared focus. | Pin, edit, switch, or dismiss. |
| **Background** | The context is retained but must not shape the next suggestion. | Reactivate, archive, or forget. |
| **Stale** | The context may be outdated or its confidence has decayed. | Refresh, correct, or delete. |
| **Forgotten** | The graph edge and eligible derived memory are removed or made inaccessible under policy. | Review deletion impact when feasible. |

The underlying research brief highlights multimodal evidence, correction, forgetting, privacy, and edge/cloud design as central requirements for personal-AI memory systems.[2] Those principles should guide every implementation decision.

## Prototype-to-product path

| Stage | Recommended scope | Explicit non-goal |
|---|---|---|
| **Concept site** | Explain the model and make memory scoping tangible. | Real collection or inference. |
| **Hackathon vertical slice** | Consent-based camera, document, and voice samples using local mock data. | System-wide app surveillance. |
| **On-device prototype** | Local graph store, evidence ledger, and action suggestions. | Autonomous execution. |
| **Product exploration** | Policy engine, correction UX, data export/deletion, and security review. | Unbounded retention or hidden cross-app memory. |

## References

[1]: https://www.iqoo.com/in/originos "iQOO — OriginOS 6"

[2]: https://arxiv.org/abs/2607.18975 "Mi-Memory: A Lifecycle Memory Framework for Personal AI"

