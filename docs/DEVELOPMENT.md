# Development and Maintenance Guide

## Environment

Context Continuity is a static client-side application. The page uses React 19, TypeScript, Vite, Tailwind CSS 4, Lucide icons, and the existing UI primitives supplied by the project scaffold. The application currently has no backend service, database, authentication layer, third-party API, or persistent state.

| Requirement | Recommended version or use |
|---|---|
| Node.js | The project is configured for modern Node.js and pnpm. |
| Package manager | `pnpm` |
| Runtime | Vite development server for local work. |
| Static assets | Project-managed storage URLs; do not place large media in `client/public` or `client/src/assets`. |

## Setup

Clone the repository, install packages, and start the development server.

```bash
git clone https://github.com/Samviksanjee/context-continuity.git
cd context-continuity
pnpm install
pnpm dev
```

The main experience is available at the root route. The website uses a single-page narrative and anchor navigation; no additional application routes are required for the current concept.

## Validation workflow

Run TypeScript checking before a production build. The build command confirms that Vite can compile the client bundle and package the supplied static server entry.

```bash
pnpm check
pnpm build
```

| Validation area | Expected result |
|---|---|
| Type checking | No TypeScript errors. |
| Production build | Vite emits the optimized client bundle. |
| Desktop layout | The hero, graph workbench, architecture, trust, and closing sections maintain their editorial rhythm. |
| Mobile layout | The memory selector stacks above the active-memory panel; graph labels remain readable. |
| Keyboard interaction | Navigation anchors, memory choices, layer controls, and buttons remain focusable. |

## Content and state locations

The primary content definitions sit at the top of `client/src/pages/Home.tsx`.

| Definition | Purpose |
|---|---|
| `layers` | Supplies the switchable Perceive, Remember, Reason, and Act architecture cards. |
| `moments` | Supplies the Monday-through-Friday continuity timeline. |
| `memorySpaces` | Supplies the realistic work, home, and travel threads in the interactive memory-switching demo. |
| `activeLayer` | Controls the selected architecture card. |
| `activeMemoryKey` and `showEvidence` | Control which context thread is in focus and whether its selection rationale is visible. |

When adding a new context thread, add an object to `memorySpaces` with a stable `key`, short label, state, source, relationship, recommendation, confidence value, and five graph node labels. The workbench layout intentionally expects a bounded set of five nodes.

## Design-system guardrails

The visual direction is documented in `ideas.md`. It is the source of truth for the Signal Atlas system: warm mineral paper, ink-black typography, signal orange as the insight color, asymmetric editorial composition, and provenance-style labels.

Avoid introducing generic dashboard patterns, excessive rounded cards, unmotivated gradients, or alternate display fonts. If a visual change does not reinforce the “living map of what matters” concept, it should be reconsidered.

## Asset management

Generated visual assets are served from project-managed storage paths and referenced directly in the page. Do not duplicate them locally in the project repository. This keeps deployment lightweight and follows the static project’s asset policy.

| Asset | Page role |
|---|---|
| `context-logo` | Header mark and brand signal. |
| `context-hero` | Hero context constellation. |
| `context-timeline` | Five-day continuity backdrop. |
| `context-graph` | Architecture graph illustration. |
| `context-privacy` | Governance and private-memory visual. |

## Publishing notes

The project repository is private. Before publishing a new version, save a project checkpoint in the management interface, ensure `pnpm check` and `pnpm build` succeed, review desktop and mobile screenshots, then push the source updates through GitHub.

This project is static. Any future feature requiring real persistence, protected secrets, model inference, device synchronization, authentication, or file storage should be planned as a full-stack capability rather than simulated in the browser.
