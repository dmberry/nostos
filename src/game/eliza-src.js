// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The ELIZA source, as files on the laptop.
//
// The point of putting it here is that ELIZA is the machine in the ruins in
// miniature, and it is small enough to read all the way through in an evening.
// A player who has been talked at by RON can come here, open the script, and
// see that the whole apparatus is a keyword table and some string surgery.
//
// DOCTOR.script is GENERATED from the table in eliza.js rather than typed out
// again. This repository keeps paying for hand-written second copies that drift
// from the thing they describe, so the file on the laptop is rendered at module
// load from the same array the running bot dispatches on. Edit the rules in
// eliza.js and the listing follows; there is nothing to keep in step.

import { SCRIPT, REFLECTIONS, PRE } from './eliza.js';

// Weizenbaum wrote the script in the list notation SLIP gave him: the keyword,
// its rank, then one bracket per decomposition rule holding the pattern and the
// reassembly rules that answer it. A `0` in a pattern matches any run of words;
// a bare number in a reassembly is the run that matched at that position. This
// renders our table back into that notation.
function renderScript() {
  const out = [
    '; DOCTOR — the script ELIZA runs.',
    ';',
    '; (KEYWORD rank ((decomposition) (reassembly) (reassembly) ...) ...)',
    ';',
    '; 0 in a decomposition matches any run of words, including none. A number',
    '; in a reassembly is the run that matched in that position: in',
    ';   (0 I REMEMBER 0) → (DO YOU OFTEN THINK OF 4)',
    '; the 4 is the fourth element of the pattern, which is the second 0.',
    ';',
    '; Rank breaks ties. When a sentence holds several keywords the highest rank',
    '; wins, which is why COMPUTER at 50 beats almost everything: Weizenbaum',
    '; wanted the machine to notice when it was being talked about.',
    '',
  ];
  for (const entry of SCRIPT) {
    const head = `(${entry.key.toUpperCase()} ${entry.rank}`;
    const rules = entry.rules.map((r) => {
      // `*` is our wildcard; the script's is 0. The reassembly refers to the
      // captured runs by their position in the pattern, so (1) becomes the
      // index of the first 0, (2) the second, and so on.
      const parts = r.decomp.split(/\s+/).filter(Boolean);
      const decomp = parts.map((w) => (w === '*' ? '0' : w.toUpperCase())).join(' ');
      const slots = [];
      parts.forEach((w, i) => { if (w === '*') slots.push(i + 1); });
      const reasmb = r.reasmb.map((t) => {
        const text = t.replace(/\((\d+)\)/g, (_, n) => String(slots[Number(n) - 1] ?? n));
        return `  (${text.toUpperCase()})`;
      });
      return [`  ((${decomp})`, ...reasmb.map((l) => ' ' + l), '  )'];
    });
    out.push(head, ...rules.flat(), ')', '');
  }
  return out.join('\n');
}

// The substitution and reflection tables, which in the original are two more
// lists in the same file. Kept separate here because they are the only part of
// ELIZA anybody remembers: the trick where "my mother" comes back as "your
// mother" is this table and nothing else.
function renderTables() {
  const pad = (s, n) => s + ' '.repeat(Math.max(1, n - s.length));
  const refl = Object.entries(REFLECTIONS)
    .map(([a, b]) => `  (${pad(a.toUpperCase(), 10)}${b.toUpperCase()})`);
  const pre = PRE
    .map(([re, to]) => `  (${pad(String(re).replace(/^\/\\b|\\b\/g$/g, '').toUpperCase(), 12)}${to.toUpperCase()})`);
  return [
    '; PRE — run over the input before anything else. Contractions, plurals,',
    '; and the two substitutions that do real work: MACHINE becomes COMPUTER so',
    '; one keyword catches both, and WANT becomes NEED.',
    '',
    '(PRE',
    ...pre,
    ')',
    '',
    '; REFLECT — first person to second and back. This is the whole illusion.',
    '',
    '(REFLECT',
    ...refl,
    ')',
    '',
  ].join('\n');
}

export const DOCTOR_SCRIPT = renderScript();
export const DOCTOR_TABLES = renderTables();

export const ELIZA_README = [
  'ELIZA',
  '=====',
  '',
  'Joseph Weizenbaum, MIT, 1964-66. Published as "ELIZA — A Computer Program',
  'For the Study of Natural Language Communication Between Man and Machine",',
  'Communications of the ACM 9(1), January 1966.',
  '',
  'ELIZA is the program. DOCTOR is the script it runs. Weizenbaum built the',
  'first as a general machine for transforming sentences and the second as one',
  'demonstration of it, and everybody remembers the demonstration.',
  '',
  'It ran in MAD-SLIP on the IBM 7094 under CTSS. SLIP was his own list',
  'processing library, bolted onto MAD, because there was no other way to hold',
  'a tree of words in memory on that machine.',
  '',
  'HOW IT WORKS',
  '',
  '  1. Substitute. Fix contractions, fold plurals, and rewrite the words the',
  '     script would rather see. See doctor.tables.',
  '  2. Find the keyword. Scan the sentence, keep the highest-ranked keyword',
  '     present, and take the text from that word onward.',
  '  3. Decompose. Try each pattern for that keyword until one fits. A 0 in a',
  '     pattern eats any run of words and remembers what it ate.',
  '  4. Reassemble. Fill the remembered runs into the answer template, with',
  '     first and second person swapped on the way through.',
  '  5. If nothing matched, say something that fits anywhere, or bring back an',
  '     earlier remark from the memory queue.',
  '',
  'That is all of it. There is no model of you, no state beyond the queue, and',
  'no representation of what any word means.',
  '',
  'WHAT HAPPENED NEXT',
  '',
  'Weizenbaum watched his secretary ask him to leave the room so she could',
  'talk to it in private. He spent the rest of his life arguing against what',
  'people wanted to believe about the thing he had built, and wrote Computer',
  'Power and Human Reason (1976) to say it at length.',
  '',
  'The original listing was thought lost. It turned up in his papers in the',
  'MIT archives and was published in 2021, fifty-five years after the paper.',
  '',
  'FILES',
  '',
  '  readme          this',
  '  doctor.script   the keyword table, in the notation of the original',
  '  doctor.tables   the substitution and reflection lists',
  '  eliza.ml        a working ELIZA. Run it: ml eliza.ml',
  '',
  'eliza.ml defines  fun reply said = ...  — one line in, one answer out. Run',
  'it and the console becomes the loop: the prompt reads eliza>, every line',
  'you type is handed to reply, and quit (or Ctrl-C, or Escape) leaves.',
  'At the bml prompt outside the game, load it with -i and call reply',
  'yourself:  reply "i am unhappy"',
  '',
  'eliza.ml is Copyright (C) David M. Berry and is released under the GNU',
  'General Public License, version 2.',
  '',
  'The one in the ruins is bigger. It is not different.',
].join('\n');

// The LOOP version, v1.417–v1.422, kept byte-for-byte. Not served any more:
// the graft in unix.js matches a player's on-disk eliza.ml against this exact
// text to tell a system copy (replace with the reply version below) from a
// player's edit (leave alone). Change one character here and every old disk
// stops migrating.
export const ELIZA_LOOP_LEGACY = [
  "(* eliza.ml — ELIZA, small enough to read. Weizenbaum 1966.       *)",
  "(*                                                                *)",
  "(* Copyright (C) David M. Berry.                                  *)",
  "(* This program is free software: you can redistribute it and/or  *)",
  "(* modify it under the terms of the GNU General Public License    *)",
  "(* version 2 as published by the Free Software Foundation.        *)",
  "(*                                                                *)",
  "(* This program is distributed in the hope that it will be useful *)",
  "(* but WITHOUT ANY WARRANTY; without even the implied warranty of *)",
  "(* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the   *)",
  "(* GNU General Public License for more details.                   *)",
  "(*                                                                *)",
  "(* Run it:  ml eliza.ml     Leave it: type quit, or press ^C.     *)",
  "",
  "(* --- 1. reflection: first person to second, and back ----------- *)",
  "",
  'fun reflect "i" = "you"   | reflect "me" = "you"',
  '  | reflect "my" = "your" | reflect "am" = "are"',
  '  | reflect "i\'m" = "you are"',
  '  | reflect "you" = "i"   | reflect "your" = "my"',
  '  | reflect "are" = "am"  | reflect "was" = "were"',
  '  | reflect "myself" = "yourself"',
  "  | reflect w = w",
  "",
  'fun join nil = ""',
  "  | join (w :: nil) = w",
  '  | join (w :: rest) = w ^ " " ^ join rest',
  "",
  "fun flip ws = join (map reflect ws)",
  "",
  "(* --- 2. the matcher -------------------------------------------- *)",
  "(* `after pre ws` is the words following the first occurrence of    *)",
  "(* pre in ws. That is the second 0 in a pattern like (0 I AM 0).    *)",
  "",
  "fun starts (nil, ws) = true",
  "  | starts (p :: ps, nil) = false",
  "  | starts (p :: ps, w :: ws) = if p = w then starts (ps, ws) else false",
  "",
  "fun after (pre, nil) = nil",
  "  | after (pre, w :: ws) =",
  "      if starts (pre, w :: ws) then List.drop (w :: ws, length pre)",
  "      else after (pre, ws)",
  "",
  "fun has (pre, ws) = starts (pre, ws) orelse",
  "      (case ws of nil => false | (w :: rest) => has (pre, rest))",
  "",
  "(* --- 3. the script --------------------------------------------- *)",
  "(* Ordered by rank, highest first, exactly as the table in          *)",
  "(* doctor.script is: COMPUTER outranks almost everything because    *)",
  "(* Weizenbaum wanted it noticed when it was being talked about.     *)",
  "",
  "fun answer ws =",
  '  if has (["computer"], ws) orelse has (["machine"], ws)',
  '    then "Do computers worry you?"',
  '  else if has (["i", "remember"], ws)',
  '    then "Do you often think of " ^ flip (after (["i", "remember"], ws)) ^ "?"',
  '  else if has (["i", "dreamed"], ws)',
  '    then "Have you dreamed " ^ flip (after (["i", "dreamed"], ws)) ^ " before?"',
  '  else if has (["i", "need"], ws) orelse has (["i", "want"], ws)',
  '    then "What would it mean to you if you got that?"',
  '  else if has (["i", "am"], ws)',
  '    then "How long have you been " ^ flip (after (["i", "am"], ws)) ^ "?"',
  '  else if has (["i", "feel"], ws)',
  '    then "Tell me more about such feelings."',
  '  else if has (["i", "cannot"], ws) orelse has (["i", "can\'t"], ws)',
  '    then "How do you know you cannot?"',
  '  else if has (["my", "mother"], ws) orelse has (["my", "father"], ws)',
  '    then "Tell me more about your family."',
  '  else if has (["my"], ws)',
  '    then "Why do you say " ^ flip ws ^ "?"',
  '  else if has (["you"], ws)',
  '    then "We were discussing you, not me."',
  '  else if has (["because"], ws)',
  '    then "Is that the real reason?"',
  '  else if has (["sorry"], ws)',
  '    then "Please do not apologise."',
  '  else if has (["yes"], ws)',
  '    then "You seem quite positive."',
  '  else if has (["no"], ws)',
  '    then "Why not?"',
  '  else if has (["hello"], ws) orelse has (["hi"], ws)',
  '    then "How do you do. Please state your problem."',
  '  else "Please go on."',
  "",
  "(* --- 4. the loop ----------------------------------------------- *)",
  "(* readLine takes a line from whoever is at the terminal. If there  *)",
  "(* is nobody and nothing queued, the run suspends here and the      *)",
  "(* console goes and asks. That is the whole of the input plumbing.  *)",
  "",
  'fun words s = String.tokens (fn c => c = #" ") (String.map Char.toLower s)',
  "",
  "fun session () =",
  "  let val said = readLine ()",
  "  in",
  '    if said = "quit" orelse said = "bye" orelse said = "exit"',
  '      then echo "ELIZA: Goodbye. It was nice talking to you."',
  '      else (echo ("ELIZA: " ^ answer (words said)); session ())',
  "  end",
  "",
  'echo "ELIZA: How do you do. Please state your problem."',
  "session ()",
  "",
  "(* Nothing above understands a word of it. That was the argument.   *)",
].join('\n');

// The conversation version. No loop: `fun reply` takes one line and returns
// one answer, and the console drives it — run `ml eliza.ml` at the laptop and
// the prompt becomes eliza>, with each typed line handed to reply through the
// stdin queue (never spliced into source, so quotes in what you type are
// boring). The same shape as a machine's program: decide(sense) in the field,
// reply(said) at the desk. State, if a program wants it, is a top-level ref —
// the session persists between calls.
export const ELIZA_PROGRAM = [
  "(* eliza.ml — ELIZA, small enough to read. Weizenbaum 1966.       *)",
  "(*                                                                *)",
  "(* Copyright (C) David M. Berry.                                  *)",
  "(* This program is free software: you can redistribute it and/or  *)",
  "(* modify it under the terms of the GNU General Public License    *)",
  "(* version 2 as published by the Free Software Foundation.        *)",
  "(*                                                                *)",
  "(* This program is distributed in the hope that it will be useful *)",
  "(* but WITHOUT ANY WARRANTY; without even the implied warranty of *)",
  "(* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the   *)",
  "(* GNU General Public License for more details.                   *)",
  "(*                                                                *)",
  "(* Run it:  ml eliza.ml                                           *)",
  "(* The prompt becomes eliza> and every line you type is handed to *)",
  "(* reply, below. quit (or ^C) leaves.                             *)",
  "",
  "(* --- 1. reflection: first person to second, and back ----------- *)",
  "",
  'fun reflect "i" = "you"   | reflect "me" = "you"',
  '  | reflect "my" = "your" | reflect "am" = "are"',
  '  | reflect "i\'m" = "you are"',
  '  | reflect "you" = "i"   | reflect "your" = "my"',
  '  | reflect "are" = "am"  | reflect "was" = "were"',
  '  | reflect "myself" = "yourself"',
  "  | reflect w = w",
  "",
  'fun join nil = ""',
  "  | join (w :: nil) = w",
  '  | join (w :: rest) = w ^ " " ^ join rest',
  "",
  "fun flip ws = join (map reflect ws)",
  "",
  "(* --- 2. the matcher -------------------------------------------- *)",
  "(* `after pre ws` is the words following the first occurrence of    *)",
  "(* pre in ws. That is the second 0 in a pattern like (0 I AM 0).    *)",
  "",
  "fun starts (nil, ws) = true",
  "  | starts (p :: ps, nil) = false",
  "  | starts (p :: ps, w :: ws) = if p = w then starts (ps, ws) else false",
  "",
  "fun after (pre, nil) = nil",
  "  | after (pre, w :: ws) =",
  "      if starts (pre, w :: ws) then List.drop (w :: ws, length pre)",
  "      else after (pre, ws)",
  "",
  "fun has (pre, ws) = starts (pre, ws) orelse",
  "      (case ws of nil => false | (w :: rest) => has (pre, rest))",
  "",
  "(* --- 3. the script --------------------------------------------- *)",
  "(* Ordered by rank, highest first, exactly as the table in          *)",
  "(* doctor.script is: COMPUTER outranks almost everything because    *)",
  "(* Weizenbaum wanted it noticed when it was being talked about.     *)",
  "",
  "fun answer ws =",
  '  if has (["computer"], ws) orelse has (["machine"], ws)',
  '    then "Do computers worry you?"',
  '  else if has (["i", "remember"], ws)',
  '    then "Do you often think of " ^ flip (after (["i", "remember"], ws)) ^ "?"',
  '  else if has (["i", "dreamed"], ws)',
  '    then "Have you dreamed " ^ flip (after (["i", "dreamed"], ws)) ^ " before?"',
  '  else if has (["i", "need"], ws) orelse has (["i", "want"], ws)',
  '    then "What would it mean to you if you got that?"',
  '  else if has (["i", "am"], ws)',
  '    then "How long have you been " ^ flip (after (["i", "am"], ws)) ^ "?"',
  '  else if has (["i", "feel"], ws)',
  '    then "Tell me more about such feelings."',
  '  else if has (["i", "cannot"], ws) orelse has (["i", "can\'t"], ws)',
  '    then "How do you know you cannot?"',
  '  else if has (["my", "mother"], ws) orelse has (["my", "father"], ws)',
  '    then "Tell me more about your family."',
  '  else if has (["my"], ws)',
  '    then "Why do you say " ^ flip ws ^ "?"',
  '  else if has (["you"], ws)',
  '    then "We were discussing you, not me."',
  '  else if has (["because"], ws)',
  '    then "Is that the real reason?"',
  '  else if has (["sorry"], ws)',
  '    then "Please do not apologise."',
  '  else if has (["yes"], ws)',
  '    then "You seem quite positive."',
  '  else if has (["no"], ws)',
  '    then "Why not?"',
  '  else if has (["hello"], ws) orelse has (["hi"], ws)',
  '    then "How do you do. Please state your problem."',
  '  else "Please go on."',
  "",
  "(* --- 4. the doorway -------------------------------------------- *)",
  "(* reply is the whole protocol: one line in, one answer out. The    *)",
  "(* console hands each line you type to it. There is no loop in this *)",
  "(* file — the loop is you.                                          *)",
  "",
  'fun words s = String.tokens (fn c => c = #" ") (String.map Char.toLower s)',
  "",
  "fun reply said =",
  "  let val low = String.map Char.toLower said",
  "  in",
  '    if low = "quit" orelse low = "bye" orelse low = "exit"',
  '      then "ELIZA: Goodbye. It was nice talking to you."',
  '      else "ELIZA: " ^ answer (words said)',
  "  end",
  "",
  'echo "ELIZA: How do you do. Please state your problem."',
].join('\n');

