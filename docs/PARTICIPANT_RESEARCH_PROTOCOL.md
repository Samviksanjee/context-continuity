# Disabled-Participant Research Protocol (Draft)

Status on the maturity ladder: **planned** — not yet conducted. Human validation cannot be self-certified by automated tests; this protocol scopes the work a research team would run.

## Purpose

Determine whether the product is genuinely understandable, efficient, and recoverable for disabled users — beyond technical conformance. Automated tests catch a minority of real barriers; lived-experience testing is the source of truth.

## Participants (compensated)

Recruit across, at minimum: blind / low-vision, Deaf / hard-of-hearing, motor-disabled (including switch and voice-control users), speech-disabled, cognitively disabled / neurodivergent, and multiply disabled participants. Participants use their own assistive technology and preferred settings.

## Ethics and data

- Informed consent; the right to stop at any time; fair compensation.
- Data minimization: collect only what the study needs; no unnecessary PII.
- Store recordings/notes securely; delete on the stated schedule.
- Do not profile disability or retain accessibility preferences beyond the study.

## Tasks (mapped to shipped features)

1. Capture context (typed, and — where available — voice/OCR) and review/correct it.
2. Explore the context graph via the structured relationships view.
3. Inspect and correct/dismiss an AI advisory suggestion.
4. Delete a thread and recover it via Undo.
5. Work offline, then set accessibility preferences and hand them off to another device (Continuity).
6. Use guest mode and the non-QR pairing path.

## Metrics

- Task completion and independence (no facilitator help).
- Time-on-task and error/recovery counts.
- Severity-rated barriers with verbatim participant framing.
- Comprehension of AI uncertainty and provenance.

## Remediation loop

Each reproducible blocker becomes a failing regression test before it is fixed. Severe findings are re-tested with affected participants (or a justified equivalent) before sign-off.

## Exit criterion

No unresolved blocker/critical barriers for the covered disability groups; lower-severity exceptions explicitly accepted and logged.
