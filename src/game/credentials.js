// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WHAT IS ACTUALLY ON THE CARD (#196).
//
// `cat` has worked at these terminals for a while — for the tower's own logs
// and for the keeper's store. It did not work for the files the whole escape
// chain is made of, because those files had no bodies: `ITEMS.ai_key.files` is
// a list of NAMES, and the bench is a map of names to `true`. So a player could
// `cd card`, `ls`, see four filenames, `cat` any of them, and be told there was
// no such file on a drive that had just listed it.
//
// That is the worst kind of gap. It teaches the player that `ls` lies.
//
// So every credential gets a body, and the bodies are the puzzle written out:
// the factory's boast, the boast reflected, the AI's key, and the forged
// payload. Reading them in order is the walkthrough, and it is a walkthrough
// the fiction supplies rather than the interface.
//
// PURE. Names in, text out. Nothing here knows about a terminal, a card or a
// player — main.js asks it a question when somebody types `cat`.

import { virusFor } from './hermes.js';

// The line ELIZA is fed, and the line it gives back. Kept here, in one place,
// because `elizaTransformFile` prints them and `cat factory_id.ml` prints them
// and the two must not drift: the joke only lands if the file you read is the
// file that gets reflected.
export const FACTORY_BOAST = 'I AM W-FACTORY.  MY KEYS ARE MINE.';
export const FACTORY_GRANT = 'you are W-FACTORY.  your keys are yours.';

/**
 * The four credentials, as files.
 *
 * Written the way a machine's own storage would hold them — a header the
 * estate's tooling wrote, then the payload — because these are not documents
 * anybody composed. Nobody sat down to write access_ai_code.ml; it was emitted.
 */
const CREDENTIALS = {
  'access_ai_code.ml': [
    '(* access_ai_code.ml — emitted by the key writer, not by a person *)',
    '(* class: credential   scope: node   revocation: none issued        *)',
    '',
    'let access = key 0x5C17AE in',
    '  present access to node |> await grant.',
    '',
    '(* This is the half that says WHO IS ASKING. It is not the half that says',
    '   the asking is allowed — that one is root_access.ml, and the factory has',
    '   it, and the factory does not think it is yours. *)',
  ].join('\n'),

  'factory_id.ml': [
    '(* factory_id.ml — the works identifies itself to the network *)',
    '(* emitted on every handshake. it has been saying this for years. *)',
    '',
    `id_line = "${FACTORY_BOAST}"`,
    '',
    'let announce () = broadcast id_line.',
    '',
    '(* Nothing in here checks who is listening. It was never a secret; it was',
    '   a boast, and a boast is a sentence, and a sentence can be turned round.',
    '   Try: eliza factory_id.ml *)',
  ].join('\n'),

  'root_access.ml': [
    '(* root_access.ml — the boast, reflected *)',
    '(* written by ELIZA out of factory_id.ml. no keys were broken.   *)',
    '',
    `grant_line = "${FACTORY_GRANT}"`,
    '',
    'let grant () = assert grant_line |> escalate.',
    '',
    '(* The machine told the truth about itself in the first person, and the',
    '   first person is the one thing a reflection can move. It says the same',
    '   words. It means them about you now. *)',
    '',
    '(* next: copy root_access.ml aikey *)',
  ].join('\n'),
};

/**
 * The armed payload, per island — the file a HERMES relay forges onto the card.
 *
 * Built from the same `VIRUS_BY_AI` row the relay serves, so the sealed source
 * you read at the relay and the armed file you read on the card are two states
 * of one thing rather than two pieces of writing that happen to agree.
 */
export function armedText(aiName) {
  const v = virusFor(aiName);
  return [
    `(* ${v.armed} — forged at a HERMES relay from ${v.file} *)`,
    '(* state: ARMED. the two credentials are folded in and spent. *)',
    '',
    v.sealed.split('\n')[0].replace(/seal \(\*/, 'ARMED (*').replace(/, sealed pending the herald's two keys/, ', live'),
    '  with root_access.ml |> with access_ai_code.ml |> run.',
    '',
    `(* Cut for ${aiName}'s keys and no others. Carrying it to another island`,
    '   carries a file that will not be answered. Each daemon keeps its own',
    '   relay, and its own undoing. *)',
  ].join('\n');
}

/**
 * The text of a credential file, or null if this is not one.
 *
 * `aiName` is wanted only for the armed payload, whose name and body are the
 * island's. Case-insensitive and extension-forgiving, the way every other file
 * lookup at these terminals is.
 */
export function credentialText(name, aiName = 'CALYPSO') {
  const want = String(name || '').toLowerCase().trim();
  if (!want) return null;
  const v = virusFor(aiName);
  for (const key of [want, `${want}.ml`]) {
    if (CREDENTIALS[key]) return CREDENTIALS[key];
    if (key === v.armed) return armedText(aiName);
  }
  return null;
}

/** Every credential name that has a body, for a test to walk. */
export function credentialNames(aiName = 'CALYPSO') {
  return [...Object.keys(CREDENTIALS), virusFor(aiName).armed];
}
