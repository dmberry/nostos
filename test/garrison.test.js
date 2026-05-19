// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #162 — the garrison roster. A tower's own bookkeeping, written on change,
// readable at the console and pullable to the NostBook.
//
// The properties that matter are about it being a FILE a person will edit by
// hand in `ed` with no syntax checker: it has to survive that, and the digest
// has to be quiet enough that a machine shuffling on the spot does not rewrite
// it sixty times a minute.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  ROSTER_FIELDS, rosterText, rosterLine, parseRoster, rosterDigest, unitState,
  logsFolder, unitLogText, logName, LOGS_DIR,
} from '../src/game/garrison.js';

const unit = (over = {}) => ({
  type: 't1', x: 118.4, y: 204.7, battery: 87, dead: false, fused: false,
  drained: false, friendly: false, recharging: false, disabledT: 0, aggro: false,
  returning: false, intent: null, _netId: 'OB_5D33.t1a', _netTag: null, ...over,
});

test('the header carries the tower, the revision and the schema', () => {
  const txt = rosterText({ code: 'OB_5D33' }, [unit()], { rev: 4, clock: '04:12' });
  const lines = txt.trim().split('\n');
  assert.match(lines[0], /^# OB_5D33 garrison {2}rev 4 {2}written 04:12$/);
  assert.equal(lines[1], `# ${ROSTER_FIELDS.join(':')}`, 'the comment IS the schema');
  assert.ok(txt.endsWith('\n'), 'a text file ends with a newline');
});

test('a record is one colon-separated line, positions rounded to the tile', () => {
  const line = rosterLine(unit());
  assert.equal(line, 'OB_5D33.t1a:t1:118:205:87:patrol:-');
  assert.equal(line.split(':').length, ROSTER_FIELDS.length);
});

test('nothing in a field can break the separator', () => {
  // A tag is player-supplied, so it is the field most likely to carry a colon
  // or a newline, and either would silently corrupt the row after it.
  const line = rosterLine(unit({ _netTag: 'north:gate\nscout' }));
  assert.equal(line.split(':').length, ROSTER_FIELDS.length);
  assert.ok(!line.includes('\n'));
  assert.match(line, /north_gate_scout/);
});

test('state is the fact you would act on, not the last thing it was doing', () => {
  assert.equal(unitState(unit({ drained: true, aggro: true })), 'flat',
    'a flat machine is flat, whatever it was chasing');
  assert.equal(unitState(unit({ dead: true })), 'lost');
  assert.equal(unitState(unit({ fused: true })), 'wreck');
  assert.equal(unitState(unit({ friendly: true })), 'turned', 'and the sheet admits it is yours now');
  assert.equal(unitState(unit({ recharging: true })), 'docked');
  assert.equal(unitState(unit({ disabledT: 3 })), 'stunned');
  assert.equal(unitState(unit({ aggro: true })), 'hunting');
  assert.equal(unitState(unit({ returning: true })), 'homing');
  assert.equal(unitState(unit({ intent: 'tend' })), 'tend', 'otherwise, what its program chose');
});

test('an empty node says so rather than being a blank file', () => {
  const txt = rosterText({ code: 'OB_0000' }, []);
  assert.match(txt, /no units homed/);
});

test('it round-trips', () => {
  const units = [unit(), unit({ _netId: 'OB_5D33.t2b', type: 't2', x: 121, y: 199, battery: 41, recharging: true, _netTag: 'scout' })];
  const { units: back, skipped } = parseRoster(rosterText({ code: 'OB_5D33' }, units));
  assert.equal(skipped, 0);
  assert.equal(back.length, 2);
  assert.equal(back[0].unit, 'OB_5D33.t1a');
  assert.equal(back[1].tag, 'scout');
  assert.equal(back[1].x, 121);
  assert.equal(back[1].state, 'docked');
});

test('a hand-edited file survives being hand-edited', () => {
  // This is the whole reason for the format. Somebody will open it in ed on a
  // laptop with no syntax checker and make a mess; a mess must cost them the
  // line they broke and nothing else.
  const text = [
    '# OB_5D33 garrison  rev 2  written 04:12',
    '# unit:class:x:y:charge:state:tag',
    'OB_5D33.t1a:t1:118:205:87:patrol:-',
    '',
    '   ',
    '# somebody wrote a note here',
    'OB_5D33.t2b:t2:oops:199:41:docked:scout',   // x is not a number
    'OB_5D33.w5a:w5:104',                         // truncated
    'OB_5D33.v1a:v1:90:90:12:flat:courier',
  ].join('\n');
  const { units, skipped } = parseRoster(text);
  assert.deepEqual(units.map((u) => u.unit), ['OB_5D33.t1a', 'OB_5D33.v1a'],
    'the good lines survive');
  assert.equal(skipped, 2, 'and it says how many it could not read');
});

test('parsing nothing is not an error', () => {
  for (const v of ['', null, undefined, '# only a comment\n']) {
    const r = parseRoster(v);
    assert.deepEqual(r.units, []);
    assert.equal(r.skipped, 0);
  }
});

test('THE DIGEST IS QUIET: a machine shuffling on the spot does not rewrite the file', () => {
  // Write-on-change is only cheap if "change" is coarse. Sub-tile drift and a
  // percent of battery are not news.
  const a = [unit()];
  assert.equal(rosterDigest(a), rosterDigest([unit({ x: 118.49, y: 204.51 })]),
    'sub-tile movement is not a change');
  assert.equal(rosterDigest(a), rosterDigest([unit({ battery: 85 })]),
    'a couple of percent of charge is not a change');
});

test('...but the things worth knowing about are', () => {
  const a = [unit()];
  for (const [what, over] of [
    ['it moved a tile', { x: 130 }],
    ['it went flat', { drained: true }],
    ['it was tagged', { _netTag: 'scout' }],
    ['it lost half its charge', { battery: 20 }],
  ]) {
    assert.notEqual(rosterDigest(a), rosterDigest([unit(over)]), what);
  }
  assert.notEqual(rosterDigest(a), rosterDigest([]), 'and a unit leaving is a change');
  assert.notEqual(rosterDigest(a), rosterDigest([unit(), unit({ _netId: 'x' })]),
    'as is one arriving');
});

// ---- the logs/ folder ----------------------------------------------------
// One bare file called `garrison` was only findable by somebody who already
// knew the word. A folder is a thing you notice in an `ls`.

test('the tower keeps a folder, not one file you have to already know about', () => {
  const files = logsFolder({ code: 'OB_5D33' }, [unit(), unit({ _netId: 'OB_5D33.t2b', type: 't2' })]);
  const names = Object.keys(files);
  assert.ok(names.includes('garrison'), 'the roster is still there');
  assert.ok(names.includes('OB_5D33.t1a.log'), 'and every unit has filed its own');
  assert.equal(names.length, 3, 'the roster plus one per unit, and nothing else');
});

test('a unit log opens out the row it came from', () => {
  const txt = unitLogText({ code: 'OB_5D33' }, { netId: 'OB_5D33.t1a', r: unit() }, { clock: '04:12' });
  assert.match(txt, /unit\s+OB_5D33\.t1a/);
  assert.match(txt, /home\s+OB_5D33/, 'a log says which tower holds it');
  assert.match(txt, /station\s+118, 205/, 'position rounded to the tile, as in the roster');
  assert.match(txt, /charge\s+#+\.* 87%/);
  assert.match(txt, /state\s+patrol/);
});

test('the two things the roster has no column for', () => {
  // Why a per-unit file earns its place: a fault and a posted program are what
  // you are looking for when you are deciding whether to rewrite a machine.
  const faulted = unitLogText({ code: 'OB_X' },
    { netId: 'u', r: unit({ program: 'p', fault: 'no such sense: wibble' }) });
  assert.match(faulted, /program\s+posted/);
  assert.match(faulted, /FAULT\s+no such sense: wibble/);
  const stock = unitLogText({ code: 'OB_X' }, { netId: 'u', r: unit() });
  assert.match(stock, /program\s+stock/, 'a machine on stock behaviour says so');
  assert.ok(!/FAULT/.test(stock), 'and a working one does not cry fault');
});

test('a flat unit says what that means for you', () => {
  const txt = unitLogText({ code: 'OB_X' }, { netId: 'u', r: unit({ drained: true }) });
  assert.match(txt, /state\s+flat/);
  assert.match(txt, /fed or carried home/);
});

test('a turned unit admits it is yours', () => {
  const txt = unitLogText({ code: 'OB_X' }, { netId: 'u', r: unit({ friendly: true }) });
  assert.match(txt, /no longer answers to the estate/);
});

test('a log name survives an id that would break a filename', () => {
  assert.equal(logName('OB_5D33.t1a'), 'OB_5D33.t1a.log');
  assert.ok(!/[/\\ ]/.test(logName('OB 5D33/t1a')), 'nothing in a name can escape the folder');
});

test('the folder is written from the same facts as the roster', () => {
  // They must not drift: the roster line and the log are one write, so a player
  // who cats both cannot be told two different stories about one machine.
  const u = unit({ battery: 41, _netTag: 'scout' });
  const files = logsFolder({ code: 'OB_5D33' }, [{ netId: 'OB_5D33.t1a', r: u }], { rev: 2, clock: '04:12' });
  assert.match(files.garrison, /OB_5D33\.t1a:t1:118:205:41:patrol:scout/);
  assert.match(files['OB_5D33.t1a.log'], /tag\s+scout/);
  assert.match(files['OB_5D33.t1a.log'], /41%/);
});
