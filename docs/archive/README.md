# Archive — completed plans

Implementation plans for work that has fully shipped. They are kept for the
record — the reasoning behind a decision, and the state of the code at the time
it was written — but they are no longer live planning documents, and the code
they describe has moved on since. Read them as history, not as a to-do list.

Filed here 2026-08-12 (doc sweep, task #114). These are the finished AI-ML / BML
language plans; each of their features is done and tested:

- `basis-plan.md` — finishing the Standard ML Basis library.
- `conformance-and-modules-plan.md` — the conformance harness and the module forms.
- `deep-recursion-plan.md` — non-tail recursion on the host stack.
- `language-gaps-plan.md` — the eight remaining language gaps.
- `parse-gaps-plan.md` — the last twelve parse failures.
- `row-polymorphism-plan.md` — row polymorphism.
- `semicolons-plan.md` — `;` between declarations.
- `tail-calls-plan.md` — proper tail calls (D-50).
- `type-parameters-plan.md` — a datatype's type parameters (D-56).
- `word-type-plan.md` — the word type: what to build and what to leave.

The living documents stay in `docs/`: the roadmap, the language and terminal
design references (`ob-terminal-language.md`, `robot-programs-plan.md`), the
island and refactor design, the conformance tooling, and the still-open plans
(`ai-cabinets-plan.md`).
