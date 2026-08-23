# Memory-Switching Demo Guide

## Purpose

The memory-switching workbench is a visual proof of a central ContextOS idea: **context should be available without becoming indiscriminate.** A user can move between everyday active threads while each thread preserves its own graph, evidence, and suggested action. The scenario intentionally avoids an abstract “AI project” and instead reflects the way a phone often holds work, home, and family plans at the same time.

The demo is built with local React state in `client/src/pages/Home.tsx`. It uses no external data, persistence, or model calls. Each state is illustrative and exists solely to communicate product behavior.

## How to use it

Navigate to **Demo** in the page navigation, or scroll to the section labelled **03 / Interactive demo**. Select one of the three context threads in the left-hand rail. The panel to the right updates immediately.

| Selected thread | In-focus state | What the viewer should notice |
|---|---|---|
| **Tomorrow’s client review** | An active work thread. | Calendar, slide deck, chat with Aisha, finance numbers, and the client are linked; the surfaced concern is an unresolved budget slide before the 9:00 AM review. |
| **New flat move-in** | A paused home thread. | Lease, key handover, furniture delivery, landlord chat, and the address stay together; the surfaced concern is a delivery conflict on Saturday. |
| **Mysuru weekend train** | A background personal thread. | The e-ticket, saved station route, weather, family chat, and cab plan remain available without influencing the work recommendation. |

## Reading the demo surface

The active card includes four visible claims. Together, they describe the minimum explanation required before ContextOS should recommend a user action.

| Surface element | What it demonstrates |
|---|---|
| **Status label** | Whether the thread is active, paused, or backgrounded. |
| **Context graph** | The bounded entities currently available to the reasoning layer. |
| **Evidence / relationship / confidence** | Why a memory exists and how strongly the system can support it. |
| **ContextOS says** | A scoped, human-readable observation linked to an explanation control. |

> The **Why this is in focus** control reveals the evidence path behind a context switch. It does not take an external action or create a task; this keeps the concept aligned with permission-based assistance.

## Interaction design rationale

The workbench uses an explicit selection because it makes memory scope legible. In a real product, automatic activation could still occur, but it should be visibly announced and easy to override. The user must always be able to identify the active context, inspect why it was selected, and prevent it from influencing suggestions.

The colored status dot is a lightweight indication of the context’s state. It is not intended to encode sensitive information or provide a high-stakes confidence signal. The textual status remains the accessible primary cue.

## Extending the demo

The current interaction can evolve into a richer prototype without changing the page’s conceptual model.

| Extension | Implementation direction |
|---|---|
| **Node inspector** | Make each graph node selectable and reveal its evidence list, timestamps, and correction controls. |
| **Source preview** | Render a small static document, transcript, or image excerpt for the currently selected evidence. |
| **Scope controls** | Add Pin, Background, Archive, and Forget controls with clear effect explanations. |
| **Confidence history** | Show why a relationship is newly detected, reinforced, contradicted, or stale. |
| **Cross-device handoff** | Use a second mock device panel to show the same graph following the user’s active work. |

## Accessibility considerations

The thread selector is a semantic tab list with selected state exposed via `aria-selected`. The active panel has an accessible label and `aria-live="polite"`, allowing a state change to be announced when a user selects a different memory. The interaction uses native buttons and remains available to keyboard users.

When expanding the experience, preserve these principles: visible keyboard focus, text alternatives for visual relationships, motion reduction support, and explanations that do not rely only on color.
