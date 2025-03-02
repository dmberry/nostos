// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The departure register: every place this build and Standard ML disagree.
//
// One entry per disagreement, each carrying the source, what Standard ML does,
// and what this build does instead. `departures/register.test.js` walks the list
// and asserts every entry is STILL a departure. When the language grows to cover
// one, that test fails and says to prune the entry. A registry nobody walks goes
// stale: the console's own diagnostic list did it six times, refusing modules,
// exceptions, chars, local and refs long after each had shipped.
//
// severity:
//   'silent'  wrong answer, no error. Worst class: nothing tells the operator.
//   'gap'     refused, correctly reported, feature absent.
//   'report'  the value is right and the type report is wrong.
//   'shape'   right answer, printed differently from SML.
//
// plan: the item in docs/aiml-standalone-plan.md §3 that covers it, if any.
//
// build: how the entry is checked, and each form is chosen to be stable while
// the language is under active development.
//   {refused: /re/}      the line is refused and the message matches
//   {prints: 'text'}     the line runs and prints this instead of the SML answer
//   {notType: 'int'}     the checker reports anything EXCEPT the SML type
//   {refusedOrLeaks: 1}  the line does not run, however it fails
// notType is deliberately negative: pinning the exact wrong type would churn
// every time the checker changes, and what the register asserts is only that
// the right answer has not arrived yet.
//
// The register emptied at v1.303, filled again within the hour with D-56 (a
// datatype's type parameters), and emptied again at v1.305 when that was
// fixed. Both cycles came from the same source: running the published tool and
// reading what it said, rather than reading the code.
//
// Note what an empty register does and does not claim. It only ever tracks
// departures somebody has written down, so an empty one means nobody has an
// itemised complaint — not that there is nothing left. Quote the corpus figure
// from `tools/isml-conformance.mjs` rather than from here: a number written
// into a comment is a number that goes stale, and this one sat at 82% until
// v1.323 while the harness said 87%.

export const DEPARTURES = [
  // ---- silent: wrong answers with no error -------------------------------
  // ---- gaps: refused, and absent -----------------------------------------





  // ---- Basis absences ----------------------------------------------------

  // ---- the type report is wrong where the value is right ------------------

  // ---- robustness --------------------------------------------------------
];

/** Entries grouped by the plan item that would close them. */
export function byPlanItem() {
  const m = new Map();
  for (const d of DEPARTURES) {
    const k = d.plan || '(unassigned)';
    if (!m.has(k)) m.set(k, []);
    m.get(k).push(d);
  }
  return m;
}

export function countBySeverity() {
  const c = {};
  for (const d of DEPARTURES) c[d.severity] = (c[d.severity] || 0) + 1;
  return c;
}
