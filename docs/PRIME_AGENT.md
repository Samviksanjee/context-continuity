# Prime Agent — development tool (optional, not shipped)

Prime Agent is a repo-aware development/research agent used *around* this project. It is **not** part of the product: it is never imported by `client/`, `server/`, or `android-contextos/`, and never enters the product build graph. Adding it changes the repository (this doc, `AGENTS.md`, `.prime/agent/`, a guard test, `.gitignore`) but leaves the **product runtime and build dependency graph unchanged**. It is fully reversible (see "Removal").

> Prime Agent executes model-generated Python and project commands with your user permissions. It is **not** a security sandbox. Use it only on this trusted repo, and review its changes.

## What is tracked vs. local

- Tracked (shared project config): `AGENTS.md`, `.prime/agent/settings.json`, `.prime/agent/skills/`.
- Ignored (machine-local, never committed): the nested `prime-agent/` checkout, and agent state under `.prime/agent/` (`auth.json`, `sessions/`, `logs/`, `kernel-venv/`, debug logs). See `.gitignore`.

## Prerequisites (Windows)

- Node.js >= 22.8.
- A POSIX shell to run the agent. On Windows use **Git Bash** (from Git for Windows); WSL also works and is only needed for capabilities that genuinely require Linux.
- A Python/IPython kernel (Prime Agent can bootstrap one via `uv` on first use).

## Running it

The official installer targets macOS/Linux:

```bash
curl -fsSL https://app.primeintellect.ai/prime-agent/install.sh | sh
```

On Windows, run from the in-repo source checkout inside Git Bash (recommended, avoids a global install):

```bash
cd prime-agent
npm ci
./prime-agent.sh          # launches the agent in the current directory
```

Start it from the repo root so it auto-loads `AGENTS.md` and the project skills:

```bash
cd /c/Users/<you>/Desktop/context-continuity
prime-agent               # or: prime-agent/prime-agent.sh
```

Confirm what loaded with `prime-agent --verbose` (you should see `AGENTS.md` and the `verify-changes`, `accessibility-audit`, `privacy-guardrail` skills). Inside a session, `/reload` re-reads config and `/skill:<name>` runs a skill.

## Credentials (kept out of the repo)

Authenticate with `/login` in a session (subscription or API key). Credentials are stored in `~/.prime/agent/auth.json` (outside this repo), or supply a provider environment variable (e.g. `OPENAI_API_KEY`). Never put keys in the repository or in tracked settings.

## Skills

- `verify-changes` — runs `check` / `test` / `test:a11y` / `build` and the Android unit build the right way.
- `accessibility-audit` — audits against `docs/ACCESSIBILITY.md` and `tests/accessibility/`, without overclaiming conformance.
- `privacy-guardrail` — verifies the Android no-INTERNET contract, evidence≠instructions, and that no Prime Agent / cloud-AI dependency entered the product.

## Removal (fully reversible)

Delete `AGENTS.md`, `.prime/agent/`, `docs/PRIME_AGENT.md`, `tests/tooling/prime-agent-*.test.ts`, and the "Prime Agent" block in `.gitignore`; optionally delete the `prime-agent/` checkout. The product is unchanged.
