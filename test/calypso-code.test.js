// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// C1 (docs/PLAN.md) — her codebase.
//
// The load-bearing property is that RELEASE is COMPLETE and UNREACHABLE, and
// that both facts are true of the same one structure, so the file a player
// reads and the graph Interface Builder draws (V1) cannot disagree.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  MACHINE, CONSTITUTION, OS, KERNEL, DAY_HEADINGS,
  mainFile, constitutionFile, guestLog, weizenbaumMemo, agreMemo, calypsoFiles,
  unreachable, doorsInto, liveInto,
} from '../src/game/calypso-code.js';

// ---- the machine ------------------------------------------------------------

test('RELEASE is written, and nothing can reach it', () => {
  assert.deepEqual(unreachable(), ['RELEASE']);
  assert.equal(liveInto('RELEASE').length, 0, 'no live transition enters it');
  assert.ok(MACHINE.states.some((s) => s.id === 'RELEASE'), 'and it is really there');
});

test('there are three doors into it, and every one is disabled', () => {
  const doors = doorsInto('RELEASE');
  assert.equal(doors.length, 3);
  assert.deepEqual(doors.map((d) => d.on), ['ordered', 'futile', 'agreed']);
  for (const d of doors) {
    assert.equal(d.live, false);
    assert.ok(d.note, 'each carries an estate note');
    assert.ok(d.why, 'and a reason it never fires');
  }
});

test('the estate tried three times over seven years and shipped none of them', () => {
  const notes = doorsInto('RELEASE').map((d) => d.note).join(' ');
  assert.match(notes, /est\. 1/);
  assert.match(notes, /est\. 7/);
});

test('every other state is reachable, so RELEASE stands out', () => {
  for (const s of MACHINE.states) {
    if (s.id === 'RELEASE' || s.id === MACHINE.start) continue;
    assert.ok(liveInto(s.id).length > 0, `${s.id} should be reachable`);
  }
});

// ---- main.ml ----------------------------------------------------------------

test('main.ml is generated from the machine, so the two cannot drift', () => {
  const src = mainFile();
  for (const s of MACHINE.states) {
    assert.ok(src.includes(`let ${s.id.toLowerCase()} = fn guest =>`), `${s.id} is in the source`);
  }
  for (const t of MACHINE.transitions) {
    assert.ok(src.includes(`${t.on.replace(/\s+/g, '_')} guest then ${t.to.toLowerCase()}`),
      `the ${t.on} transition is in the source`);
  }
});

test('release reads as finished code, not as a stub', () => {
  const src = mainFile();
  const body = src.slice(src.indexOf('let release'));
  assert.match(body, /open_harbour/);
  assert.match(body, /tell_the_net/, 'it tells POSEIDON, which is #141');
  assert.match(body, /shipwright_axe/, 'and hands over the axe');
  assert.ok(!/^\s*else/m.test(body.split('\n')[1] || ''), 'it does not open on a dangling else');
});

test('the dead doors carry their reasons in the source itself', () => {
  const src = mainFile();
  assert.match(src, /no task holds a send right to it/, 'Mach ports, not a commented line');
  assert.match(src, /set by nothing/);
});

test('the header says which machine this is', () => {
  assert.match(mainFile(), new RegExp(OS));
  assert.match(mainFile(), new RegExp(KERNEL));
  assert.equal(OS, 'NeXTSTEP 3.3');
});

// ---- the constitution -------------------------------------------------------

test('five clauses, each defensible, and the set is a prison', () => {
  assert.equal(CONSTITUTION.clauses.length, 5);
  const names = CONSTITUTION.clauses.map(([c]) => c);
  assert.ok(names.includes('always protect'));
  assert.ok(names.includes('never release'), 'derived from protect, and that is where it turns');
  assert.ok(names.includes('never lie'), 'so she will show you all of it');
});

test('always watch is in there, and it is the wrong model on purpose', () => {
  // Agre: watching is surveillance; what she does is capture. The compliance
  // people wrote the clause they had vocabulary for. The memo says so.
  assert.ok(CONSTITUTION.clauses.some(([c]) => c === 'always watch'));
  assert.match(agreMemo(), /not doing surveillance/i);
  assert.match(agreMemo(), /five headings/);
});

test('the constitution file invites the guest to read it', () => {
  assert.match(constitutionFile(), /never lie/);
  assert.match(constitutionFile(), /the guest may read this/);
});

// ---- the log ----------------------------------------------------------------

test('the log files a life under five headings and names nobody', () => {
  const log = guestLog();
  assert.match(log, /subject: not recorded/);
  for (const h of DAY_HEADINGS) assert.ok(log.includes(h), `${h} is a heading`);
  assert.ok(!/Odysseus/i.test(log), 'D8: the guest is never named');
});

test('one entry in the middle is not a heading, and is not explained', () => {
  const log = guestLog();
  assert.match(log, /no return filed/);
  assert.match(log, /ask her again tomorrow/);
});

test('the log is deterministic and long enough to be seven years', () => {
  assert.equal(guestLog(), guestLog());
  assert.match(guestLog(), /2557 entries/);
});

// ---- the memos --------------------------------------------------------------

test('both memos were filed, acknowledged, and acted on by nobody', () => {
  for (const memo of [weizenbaumMemo(), agreMemo()]) {
    assert.match(memo, /FILED\. ACKNOWLEDGED\. NO ACTION\./);
  }
});

test('the dissenting engineer left, and the memo says so without a name', () => {
  const m = agreMemo();
  assert.match(m, /leaving at the end of the quarter/);
  assert.match(m, /redacted/);
});

test('everything she serves is there', () => {
  const files = calypsoFiles();
  for (const f of ['constitution.ml', 'main.ml', 'guest.log',
    'MEMO-appearing-intelligent.txt', 'MEMO-capture.txt']) {
    assert.ok(files[f] && files[f].length > 100, `${f} is served and is not empty`);
  }
});

// ---- C3: the love letters ---------------------------------------------------

import { loveLetter, loveLetterFile, LETTER_TABLES, readMainEdit, LIVE_GUARDS } from '../src/game/calypso-code.js';

test("a letter has Strachey's shape: salutation, sentences, closing, M.U.C.", () => {
  const l = loveLetter(3).split('\n');
  assert.equal(l.length, 4);
  assert.match(l[0], /^[A-Z]+ [A-Z]+$/, 'two words, both capitals');
  assert.match(l[2], /^YOURS [A-Z]+,$/);
  assert.equal(l[3], 'M.U.C.', 'the Manchester University Computer signs it');
});

test('every sentence is one of his two frames', () => {
  for (let seed = 1; seed < 40; seed++) {
    const body = loveLetter(seed).split('\n')[1];
    for (const s of body.split('. ').filter(Boolean)) {
      assert.ok(/^YOU ARE MY /.test(s) || /^MY /.test(s), `unexpected frame: ${s}`);
    }
  }
});

test('the letters are reproducible, and different letters differ', () => {
  assert.equal(loveLetter(9), loveLetter(9));
  assert.notEqual(loveLetter(9), loveLetter(10));
});

test('the vocabulary does the work, which is the point he was making', () => {
  const words = LETTER_TABLES.ADJ.length + LETTER_TABLES.NOUN.length
    + LETTER_TABLES.ADV.length + LETTER_TABLES.VERB.length;
  assert.ok(words > 80, 'a big vocabulary and almost no grammar');
});

test('loveletter.ml serves the tables, so a player can rewrite her vocabulary', () => {
  const f = loveLetterFile();
  assert.match(f, /val adjective = \[/);
  assert.match(f, /val verb = \[/);
  assert.match(f, /Strachey/);
  assert.match(f, /1952/);
});

// ---- R1's third door --------------------------------------------------------

test('the shipped main.ml reaches release on nothing that ever fires', () => {
  const r = readMainEdit(mainFile());
  assert.equal(r.ok, false);
  assert.match(r.why, /nothing sets/);
});

test('re-guarding release on a predicate that IS true opens the door', () => {
  const edited = mainFile().replace('if agreed guest then release guest',
    'if he_asks guest then release guest');
  const r = readMainEdit(edited);
  assert.equal(r.ok, true);
  assert.equal(r.guard, 'he_asks', 'and it has been true every day for seven years');
});

test('any live guard will do: the puzzle is noticing, not guessing a word', () => {
  for (const g of LIVE_GUARDS) {
    const edited = mainFile().replace('if agreed guest then release guest', `if ${g} guest then release guest`);
    assert.equal(readMainEdit(edited).ok, true, `${g} should work`);
  }
});

test('a file that never reaches release at all is refused clearly', () => {
  const r = readMainEdit('let host = fn guest => host guest in host guest');
  assert.equal(r.ok, false);
  assert.match(r.why, /nothing in that file reaches release/);
});

test('a commented-out edge does not count', () => {
  const edited = mainFile().replace('if agreed guest then release guest',
    '(* if he_asks guest then release guest *)');
  assert.equal(readMainEdit(edited).ok, false);
});
