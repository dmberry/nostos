// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE KEEPER DRIVE — how the refunction is learnt rather than told.
//
// `retire (decrypt aikey) (fn x => x)` is the largest turn in the game and it
// cannot live only in the out-of-game help: a player who never opens the help
// would have no way to reach it, and one who does would be reading the answer
// rather than finding it.
//
// So it is a file, one folder down in the maintenance store that every tower
// carries: `cd keeper`, `ls`, `cd handover`, `read keeping.ml`. The towers are
// one network, so a shift note written at OGYGIA is readable from any node —
// you can learn the refunction anywhere and it still only acts where she is.
//
// Static data, like HERMES_DOCS. Nothing here is generated and nothing here is
// writable: it is a record somebody left, and the game only reads it.

export const KEEPER_TREE = {
  '': ['readme.md', 'handover/'],
  handover: ['shift.md', 'keeping.ml'],
};

export const KEEPER_FILES = {
  'readme.md': `node maintenance store — replicated across the net

  readme.md    this
  handover/    process shift notes, all nodes

Every node carries the same store. A process writes its handover at the end of
a shift and the net has it everywhere by morning.

Most of it is scheduling. One of them has been the same shift for a long time.`,

  'handover/shift.md': `SHIFT HANDOVER — keeper process, OGYGIA

Guest: one. Condition: well. Fed, warm, unharmed, not leaving.

Nothing to report, again. The guest walks the beach and looks at the water and
comes back. The muster is at strength. The tide holds.

Standing note for whoever reads this: she is not locked. There is no lock. She
is a function, and she runs on every departure, and she has never once returned
one. Her source is in keeping.ml with the maintenance override under it. I have
never had cause to run it.

I have read it many times.`,

  'handover/keeping.ml': `(* OGYGIA / keeper — her operation, and the way out of it.
   Do not edit while she is awake. *)

(* This is the whole of it. She takes a departure and gives back a stay.
   Every time, for as long as there has been a guest to keep. *)
datatype outcome = STAY | GO
fun keep _ = STAY

(* MAINTENANCE OVERRIDE.
   The core will accept a replacement for keep. It does not take the word of
   whoever offers one: it hands the candidate three departures and watches what
   comes back. Each has to come back exactly as it went out. Anything that
   returns something else is another keeping, and she declines it, kindly.

   You need the card aboard and the key open. Run it at any tower on this
   island: *)

let val k = decrypt aikey
    val keep = fn x => x
in  retire k keep
end

(* There is no cleverness in it. The keeping that lets you go is the one that
   gives you back what it was given. *)`,
};

/** The files (and folders, marked with a trailing /) at a path in the store. */
export function keeperLs(sub) {
  return (KEEPER_TREE[sub || ''] || []).slice();
}

/** The text of a file at a path, or null. `sub` is '' at the top. */
export function keeperRead(sub, name) {
  const key = sub ? `${sub}/${name}` : name;
  return Object.prototype.hasOwnProperty.call(KEEPER_FILES, key) ? KEEPER_FILES[key] : null;
}

/** Is `name` a folder at this path? */
export function keeperIsDir(sub, name) {
  return keeperLs(sub).includes(`${name}/`);
}
