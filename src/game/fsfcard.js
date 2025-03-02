// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE FSF MEMBERSHIP CARD — a real object, and a real filesystem.
//
// The Free Software Foundation posted these to members: a credit-card-sized
// 16GB stick with a double-sided USB connector folded into one corner, carrying
// a live GNU/Linux system you could boot on any machine you happened to be
// standing at. Source included, which was the point of it.
//
// In the world it is the one artefact that answers fsw-08 in the hand rather
// than in prose. The towers speak a language RON published; the source of that
// language is on this card, in /usr/src, where anybody who found one could read
// it. `mount` at the NostBook puts it on /mnt/fsf.
//
// Data only. unix.js builds the tree from `dir`/`file`, so nothing here knows
// how a filesystem works and the shell needs no special case for the card.

import { dir, file, FSF_MOUNT, FSF_DEV } from './unix.js';

const README = `FREE SOFTWARE FOUNDATION — MEMBER

This card is a computer's worth of freedom in a wallet. 16GB, a live GNU/Linux
system, and the source for every part of it. The connector folds out of the
corner and goes in either way up, which is a small kindness and was argued
about for a year.

Boot it on anything. Copy it for anyone. Nobody has to ask us.

  /COPYING        the terms, in full
  /live           the system, bootable
  /usr/src        the source of everything on this card
  /usr/src/ronml  the little language, with its manual

my.fsf.org`;

const COPYING = `THE TERMS, PLAINLY

  0. Run it. Any purpose. Nobody may ask you what for.
  1. Read it. The source is here because a program you cannot read is one you
     have to take somebody's word for.
  2. Change it. It is yours now and it does what you need, not what we guessed.
  3. Pass it on, changed or not — and if changed, on these same terms, so that
     the person after you has what you had.

That last clause is the whole of the trick. The terms travel with the code and
there is no version of taking that leaves them behind.`;

const RONML_SRC = `(* ron-ml — a small strict language, published in the open.
   If you are reading this on a machine you do not own, you already know why
   that mattered. *)

signature MACHINE = sig
  val scan   : unit -> unit
  val nearest: unit -> node
  val name   : node -> string
end

(* The estates wanted something small and strict to run their schedulers on.
   This was finished, it was free, and the manual could be photocopied. They
   took it and never changed a line, because it worked.

   Every terminal on every tower is answering this. *)`;

const MANUAL = `ron-ml(1)

The whole language on two sides of paper, which was deliberate: a language
you cannot hold in your head is one you cannot check.

  val, fun, fn, let ... in ... end
  if ... then ... else, case ... of
  datatype, and the constructors it declares
  ints, strings, bools, lists, tuples, records

Everything else is the library, and the library is here too.`;

const INSTALL = `INSTALLING

Do not. Run it from the card. A live system leaves the machine underneath it
exactly as it found it, which on a machine you do not own is the only polite
way to work and on a machine that is watching you is the only safe one.

Nothing you do here is written back to the card unless you say so.`;

// Each of these RUNS. They are the language's own idiom — a value is a value,
// so a key is one and a program that needs a key takes it as an argument — and
// they are the shortest honest version of each job rather than a golden path.
const EXAMPLES = {
  'README': file(`WORKING PROGRAMS — type them at any tower console.

  01-hello.ml       the language in four lines
  02-lists.ml       lists by hand, which is where map came from
  03-datatype.ml    a type of your own, and case
  10-key.ml         opening the AI key, which everything below needs
  11-fog.ml         weather, for 150 seconds
  12-robots.ml      the muster, off
  13-net.ml         the towers' shared sight, cut
  14-spread.ml      the blight, held
  20-virus.ml       arming the card against a daemon
  30-refunction.ml  the keeper, released

Nothing here is a secret. It was all published. That was the argument.`),

  '01-hello.ml': file(`(* The whole language starts here: a value has a name and a value. *)
val greeting = "reality or nothing";

fun twice f x = f (f x);
fun succ n = n + 1;

val four = twice succ 2      (* 4 *)`),

  '02-lists.ml': file(`(* Lists, by hand. A tower console carries the language and not the whole
   library, so these are written out of the two cases a list has: empty, or a
   head and a tail. This is where map and foldl come from. *)
val towers = [1, 2, 3, 4, 5];

fun double []      = []
  | double (x::xs) = (x * 2) :: double xs;

fun total []      = 0
  | total (x::xs) = x + total xs;

val doubled = double towers;
val sum     = total towers`),

  '03-datatype.ml': file(`(* Name the states a thing can be in, and the compiler will not let you
   forget one. *)
datatype standing = UP | FELLED | JAMMED;

fun worth UP     = 0
  | worth FELLED = 100
  | worth JAMMED = 40;

val score = worth FELLED + worth JAMMED`),

  '10-key.ml': file(`(* Everything below needs the key open. The card has to be in your hand:
   copy binds it into this session, decrypt opens it. *)
copy aikey;
val k = decrypt aikey;

(* Now k is a value like any other, and can be passed, named, or held in a
   let. The verbs that need it take it as an argument, which is why they can
   be composed. *)`),

  '11-fog.ml': file(`(* Weather is a tower's to give. HIGH, LOW or CLEAR, held for 150 seconds,
   and the tower you type it at freezes while it holds. *)
copy aikey;
let val k = decrypt aikey
in  fog CLEAR k
end`),

  '12-robots.ml': file(`(* The muster, stood down island-wide. Same cost: one tower, 150 seconds. *)
copy aikey;
let val k = decrypt aikey
in  (robots OFF k;
     (* Composed, because these are expressions and not menu items: one key,
        opened once, spent on as many as the tower will hold. *)
     fog CLEAR k;
     poseidon DOWN k)
end`),

  '13-net.ml': file(`(* The towers see through each other. Cut that and each one is only itself.
   Called net and not sight, because a machine's own senses include sight and
   a verb of that name would shadow it inside a unit's program. *)
copy aikey;
let val k = decrypt aikey
in  net OFF k
end`),

  '14-spread.ml': file(`(* The blight advances unless something holds it. This holds it. *)
copy aikey;
let val k = decrypt aikey
in  spread STOP k
end`),

  '20-virus.ml': file(`(* Arming the card. The payload is forged at a HERMES relay from what you
   are carrying, and it is per-daemon: one card, armed island by island, so
   the work you did on OGYGIA is not credit against POLYPHEMUS.

   At the relay: *)
forge zeus_virus.ml;
copy zeus_virus.ml card

(* The card takes only the credential that advances it. Anything else it
   refuses, which is the whole of its storage policy. *)`),

  '30-refunction.ml': file(`(* THE KEEPER.

   She is a function. She takes a departure and gives back a stay, and she has
   done it every time there has been anybody to do it to.

   Her core will accept a replacement for that function. It does not take the
   word of whoever offers one: it hands the candidate three departures and
   watches what comes back. Each has to come back exactly as it went out.
   Anything that returns something else is another keeping.

   Run it at any tower on the island she keeps: *)

copy aikey;
let val k = decrypt aikey
    val keep = fn x => x
in  retire k keep
end

(* There is no cleverness in it. She keeps you, and the keeping that lets you
   go is the one that gives you back what it was given. *)`),
};

/** The card's filesystem, mounted at /mnt/fsf. */
export function makeFsfCard() {
  return dir({
    'README': file(README),
    'COPYING': file(COPYING),
    'INSTALL': file(INSTALL),
    boot: dir({
      vmlinuz: file('[ kernel image ]\nLinux 4.4.0-trisquel-libre\nNot a text file.'),
      'initrd.img': file('[ initial ramdisk ]\nNot a text file.'),
    }),
    live: dir({
      'trisquel.squashfs': file('[ compressed filesystem image, 3.1G ]\nThe system itself. Not a text file.'),
      'boot.msg': file('Trisquel GNU/Linux — live. Nothing is written to this machine.'),
    }),
    usr: dir({
      src: dir({
        'kernel.tar.gz': file('[ archive, 92M ]\nThe kernel, source. Not a text file.'),
        'userland.tar.gz': file('[ archive, 340M ]\nEverything else, source. Not a text file.'),
        ronml: dir({
          'ronml.ml': file(RONML_SRC),
          'ronml.1': file(MANUAL),
          // THE WORKING PROGRAMS. This is why the card is worth carrying: not
          // the distribution, the examples directory. Somebody kept every hack
          // they had, commented, on a card in their wallet, and the terms said
          // anybody who found it could have them.
          examples: dir(EXAMPLES),
        }),
      }),
    }),
  });
}

// Re-exported so a caller needs one import, not two.
export { FSF_MOUNT, FSF_DEV };
