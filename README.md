# Context Continuity — ContextOS

> **The intelligence between moments.**

ContextOS is a concept for a privacy-first contextual intelligence layer that turns fragmented interactions into persistent, explainable, user-controlled context. **Context Continuity** is the experience layer: it carries the meaning of a project, task, person, document, or event across applications, devices, and time without requiring the user to restate the thread.

This repository contains a responsive React concept experience and an interactive memory-switching demonstration. It is designed as a product narrative and hackathon prototype surface rather than a production Android implementation.

| Area | What is included |
|---|---|
| **Concept narrative** | The opportunity, product thesis, continuity timeline, architecture, and trust principles. |
| **Interactive demo** | A switchable workbench that activates one context thread while preserving others as background memory. |
| **Design system** | Signal Atlas: editorial paper tones, systems diagrams, ink typography, and signal-orange insights. |
| **Documentation** | Product architecture, demo walkthrough, development workflow, and implementation guidance. |

## Product thesis

> **ContextOS understands what is happening around the user. Context Continuity remembers why it matters.**

The concept does not assume that a mobile operating system begins with no AI capabilities. Rather, it proposes an intelligence layer that can connect contextual actions, documents, voice, tasks, and cross-device handoffs into a persistent personal context graph. The iQOO/OriginOS research brief positions this as an extension of existing contextual capabilities, not a replacement for them.[1]

The guiding problem is simple: a user may discover an event on Monday, read its rules on Tuesday, assign work on Wednesday, prepare a presentation on Thursday, and ask what remains on Friday. Individual apps may retain individual interactions. Context Continuity retains the **relationship among them** and can surface a permission-based next step.

## What the interactive demo shows

The **Switch the memory. Keep the meaning.** section models three realistic, independent threads from an ordinary week: a client review, a new-flat move-in, and a weekend train journey. Selecting a thread changes the in-focus graph, evidence source, relationship, confidence indicator, and suggested action. It illustrates four product decisions.

| Demo behavior | Product meaning |
|---|---|
| A user selects an active thread. | Context activation is explicit and legible, not inferred as a hidden global state. |
| Other threads remain available but inactive. | Context is scoped; unrelated memories should not contaminate a current workflow. |
| The graph exposes source and relationship data. | Any insight should carry provenance rather than appear as an unexplained conclusion. |
| A next action is presented as a button. | Suggestions are permission-based prompts, never silent task execution. |

For an interaction-by-interaction walkthrough, see [the demo guide](docs/DEMO_GUIDE.md).

## Architecture at a glance

The concept organizes ContextOS into four experience layers. The actual hackathon prototype can begin with camera, documents, voice, and explicit user actions rather than attempting full system capture.

```text
Inputs → Perceive → Remember → Reason → Permission-based action
          │            │           │              │
      Camera,      Personal     Relevant      Add task,
      voice,       context      connection    continue on PC,
      docs         graph        + confidence  show source
```

| Layer | Responsibility | Example output |
|---|---|---|
| **Perceive** | Convert a raw input into structured signals. | A scanned poster yields an event, location, date, and topic. |
| **Remember** | Create and update entities, relationships, evidence, and time-scoped memories. | `Rahul → owns → backend` is stored against the hackathon project. |
| **Reason** | Compare new signals with an active context and rank relevant relationships. | A rules PDF is linked to an existing hackathon graph. |
| **Act** | Offer a reversible, permission-based next step. | “Add prototype task” with the source and confidence visible. |

Detailed models, boundaries, and implementation decisions are documented in [Architecture](docs/ARCHITECTURE.md).

## Project structure

```text
context-continuity/
├── client/
│   ├── index.html                 # Document title and font loading
│   └── src/
│       ├── pages/Home.tsx          # Narrative page and interactive demo state
│       ├── index.css               # Signal Atlas system and responsive layout
│       └── App.tsx                 # App shell and single-page route
├── docs/
│   ├── ARCHITECTURE.md             # Product and technical reference
│   ├── DEMO_GUIDE.md               # Memory-switching interaction walkthrough
│   └── DEVELOPMENT.md               # Local workflow, validation, and deployment notes
├── ideas.md                        # Chosen visual philosophy and content narrative
└── todo.md                         # Project task checklist
```

## Local development

The project uses **React 19**, **Vite**, **TypeScript**, Tailwind CSS 4, and the existing component primitives in the static template.

| Command | Purpose |
|---|---|
| `pnpm dev` | Start the local Vite development server. |
| `pnpm check` | Run TypeScript type checking with no output. |
| `pnpm build` | Create a production build and bundle the static server entry. |
| `pnpm format` | Format source files using Prettier. |

Install dependencies with `pnpm install`, then run `pnpm dev`. The demonstration uses local React state only; it does not connect to an API, persist a user’s memory, or make decisions about a real person.

## Prototype boundaries

This project is intentionally an experience prototype. It does **not** collect device data, read documents, call an AI model, create tasks, synchronize hardware, or store user memory. These responsibilities belong to a governed product architecture with explicit consent, source provenance, scope controls, retention rules, and secure on-device processing.

> A future implementation should treat memory as a governed continuity substrate, not as an unbounded transcript cache. This direction aligns with contemporary personal-AI memory research that emphasizes lifecycle, multimodal evidence, correction, forgetting, privacy, and edge/cloud deployment.[2]

## Recommended next implementation milestones

| Milestone | Outcome |
|---|---|
| **Interactive graph inspector** | Let users select a node to see its evidence, relationship path, confidence, and deletion controls. |
| **Prototype data adapter** | Use a local JSON schema to ingest sample camera, document, voice, and action events. |
| **Memory policy controls** | Add retention, forget, correction, and app-scope settings before any real persistence. |
| **Android proof of concept** | Implement a consented, on-device vertical slice using a local database and a small multimodal extraction pipeline. |

## References

[1]: https://www.iqoo.com/in/originos "iQOO — OriginOS 6"

[2]: https://arxiv.org/abs/2607.18975 "Mi-Memory: A Lifecycle Memory Framework for Personal AI"
