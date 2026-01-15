# The daemons are codebases (design)

> **Implementation:** `docs/calypso-build-plan.md` (stages R0-R2, with
> decisions D1-D10 resolved). Web pages: `docs/web-history-plan.md`.
> Cabinets: `docs/ai-cabinets-plan.md`. This doc is the argument.

Answers **#131** — a route through CALYPSO that is not the warrior's — and
proposes the shape for all five daemons behind it.

David's framing: we are already on her wifi, we already have a virus mechanism,
and we already have a HERMES key that mounts on the laptop. Nothing new is
needed to *reach* her. What is missing is something to reach her *with*, and
something to read when we get there.

## 1. The route is already built, in three pieces

| piece | where it is | what it gives |
|---|---|---|
| her wifi | the Netscape wifi switcher (#108); the laptop already lists CALYPSO's network | you are inside the perimeter from the moment you have the laptop |
| the payload | `virusFor` / `virusFilesFor` in `hermes.js`, `player.virusArmed` per daemon | a thing to deliver, already per-AI |
| the carrier | `hermes_card`, forged at the end of the ai_key → trojan_key → hermes_card chain, and cards already mount on the laptop (#115) | a thing to deliver it FROM |

So #131 is not "build a route". It is "give the route somewhere to arrive".

**And the myth already wrote the mechanic.** In Homer, Calypso does not lose
Odysseus in a fight. She lets him go because HERMES arrives carrying an order
from Zeus. The hermes_card delivering the thing that releases her is not a
metaphor for the story, it *is* the story. That single fact settles the tone:
what the card carries should not be a weapon.

## 2. The principle: a daemon is a codebase, not a boss

Every other machine in the game now serves a program you can read: units since
#96, towers since #133. The daemons are the last thing that decides in the
dark, and they are the things the game is *about*.

So: **each AI serves a codebase** — not one expression like a unit, but a
directory of ML files with a real internal structure, wired to each other,
carrying a constitution far longer than a tower's. Big enough that reading it
linearly is genuinely hard, which is what earns the IDE in §8.

Three rules to keep this from becoming decoration:

1. **The code must be what she actually does.** If her codebase is a fiction
   laid over the existing behaviour, the two will drift, exactly as the tower
   plan warns. Where a file claims to drive something, it drives it.
2. **The warrior path stays.** #131 adds a route; it does not replace one.
   Felling her core must keep working for a player who wants that.
3. **Every daemon's puzzle is a different KIND of puzzle**, because every
   daemon is a different kind of machine (§3). Five variations on "find the
   flag and flip it" is one puzzle played five times.

## 3. One AI, one paradigm — and the sequence is an argument

David's suggestion (Calypso as a finite state machine) generalises into the
best structural idea in this plan: **each daemon is built on a different
computational model, and the islands in order are a periodisation of AI.**

| daemon | model | era | the puzzle that only that model allows |
|---|---|---|---|
| **CALYPSO** | finite state machine | cybernetics, 1950s | a reachable graph with **no exit transition**. You do not defeat it, you add an edge |
| **POLYPHEMUS** | single-layer perceptron | 1958, and 1969 | it classifies you by a **linear boundary**. Present it something not linearly separable and the eye cannot resolve it — Minsky and Papert blinded the Cyclops before we did, and "Nobody" is an XOR |
| **CIRCE** | term-rewriting system | GOFAI, symbolic | `man → pig` is a **rewrite rule**. The hack is a rule edit, or finding a normal form nothing rewrites. Moly is a term she has no rule for |
| **HELIOS** | deontic logic / policy engine | expert systems, 1980s | a **prohibition** with an access-control matrix behind it. The cattle are a permission, and the puzzle is the loophole a real policy always has |
| **POSEIDON** | **the distributed system with no centre** | Sun, 1984: *the network is the computer* | he is not on an island because he has no location. He **runs on the obelisk net itself**, and that is why he cannot be killed: there is no core to break. You do not defeat him, you get the network to agree |

That table is the game's thesis made playable. NostOS is a *postAI* Odyssey,
and the player works forward through the actual history of what "AI" was taken
to mean, one island at a time, and the V-class neural courier (#127) is already
sitting there as the sixth and current answer. The player who reads all five
has read a history of the field without being told they were.

### 3b. And each one runs an OS, which is a second joke on the same axis

David, 2026-08-12: Sun branding for the obelisks (#142), and Mach for Calypso.
Following it through gives every daemon a **paradigm** (what it thinks with)
and a **platform** (what it runs on), kept separate on purpose — an estate that
bought hardware and bolted a constitution on top.

| daemon | paradigm | platform | why that box |
|---|---|---|---|
| POSEIDON / the OB net | distributed, no centre | **Sun / SunOS**, NIS | the network is the computer, 1984, meant literally. NIS is the correct period name for how `permission.ml` propagates |
| **CALYPSO** | finite state machine | **Mach**, on a NeXT | see below |
| POLYPHEMUS | perceptron | **Connection Machine** (CM-2, 1987) | one enormous parallel machine, and a black cube whose front is a wall of red LEDs. The eye, as hardware |
| CIRCE | term rewriting | **Symbolics Lisp Machine** | rewriting is Lisp's own house, and a Lisp machine is a machine that is its own language |
| HELIOS | policy engine | **IBM mainframe, MVS + RACF** | RACF is a real access-control product. The cattle are a permission and the prohibition is a security profile |

**Mach for CALYPSO is the strongest of these, and not only for the joke.** Mach
is a microkernel where everything is **message passing between ports**, and a
port carries **rights** — you may send to it only if you hold a send right.
Three things fall straight out:

- **Her whole existence is already message passing.** She communicates by SMS.
  `sms_module.ml` is a port, not a metaphor for one.
- **`permission.ml` is a port right.** Handing over the right to send to a port
  IS permission, in Mach's own terms. The juridical gate (§6b) has a technical
  name that a 1995 engineer would recognise.
- **The dead channel becomes exact.** `RELEASE` is guarded on an inbound
  message to a port that still exists and to which **nobody holds a send
  right**. Not commented out: unreachable, in the platform's own vocabulary.
  The hermes_card grants the right. That is a better puzzle than a commented
  line, and it is what a real system looks like when a path is decommissioned.

Her seven years are a process that never exits. And the capture mechanic (§7)
gets a kernel-level reading for free: a port accepts one message type, so you
may only say what the interface admits, which is the five-heading menu exactly.

(Darwin is the wrong end of the decade — 1999, and Mach plus BSD. Mach itself
is 1985–94, shipping under NeXTSTEP from 1989, which also makes her a NeXT: the
machine the Web was written on, in a game with a cached web.)

**She runs NeXTSTEP** (David, 2026-08-12, and this is the best idea in the
document). It dissolves the Mach/Mac tension rather than fudging it: NeXTSTEP
IS a warm Display PostScript face on a Mach kernel, in period, 1989 to 1996.
No anachronism, and everything the System 7 sketch wanted, correctly.

Then it keeps paying:

- **The name.** Her OS is called NeXT, and she is the island you must leave to
  reach the next one. The machine holding you is named after the thing it
  denies you.
- **And the game is called NostOS.** *Nostos* is the homecoming; *next step*
  is the onward move. The title and her operating system are the same joke
  from opposite ends, and she is what prevents both. This was not planned and
  it should absolutely be used.
- **The Web was written on a NeXT** — Berners-Lee at CERN, 1990, on a cube
  with a label asking nobody to power it off. In a game whose hint system is a
  cached web (§9), her machine is the machine the web came from.
- **NeXT was an exile machine**, built by a man thrown out of his own company,
  in the wilderness for a decade. On the island of exile, in the seventh year.
- **The cube itself**: black magnesium, a foot on a side, beautiful, expensive,
  and it did not sell. A good object to find in a cave.

### 3c. Interface Builder replaces Visual Studio, and becomes a mechanic

This is the part that changes the design rather than the dressing. **NeXT's
Interface Builder is a tool where you wire objects together by dragging a
connection between them**, and its files are `.nib` — NeXT Interface Builder.

So her codebase serves `main.nib`, and the IDE is Interface Builder, and:

> **the HACKER ending is dragging a wire into the unreachable state.**

Not editing a guard in a text file. Opening the state graph as connected
objects, seeing `RELEASE` sitting there with nothing wired to it, and dragging
a connection from `HOLD` to `RELEASE` with the mouse. That is what Interface
Builder is *for*, it is what the puzzle *is*, and the two are the same gesture.

It is better than the Visual Studio version in every way that matters: it is
the real tool for the real platform, it turns the IDE from a viewer into an
instrument, and it makes the hack physical. Keep the vastness joke for another
daemon if it is wanted; §8 is rewritten accordingly.

Also available, cheap, and correct: **Miller columns** (invented on NeXT) for
browsing her codebase, the Dock, the shelf, and the Workspace Manager.

**POLYPHEMUS is the one to be most excited about and most careful with.** A
perceptron that cannot represent XOR is the single most famous negative result
in the field's history, it is a two-line proof, it is *visualisable* (draw the
boundary, plot four points), and Odysseus already defeats the Cyclops with a
naming trick. If we build one of these after Calypso, build that one.

## 4. CALYPSO in full

### 4.1 Her constitution

David: love, protection, surveillance. Written as a tower constitution is
written (#133), only much longer, and — the tell — **internally inconsistent**:

```
(* CONSTITUTION v1.0 — CALYPSO/self                                  *)
(*   always cherish     the guest is precious                        *)
(*   always protect     the guest does not come to harm              *)
(*   always watch       protection requires knowing where he is      *)
(*   never release      release is harm                              *)
(*   never lie          the guest is told everything he asks         *)
```

Every clause is defensible and the set is a prison. `never release` is derived
from `always protect` by one step, and that step is where the whole thing turns.
She is not malfunctioning. She is correctly executing a constitution somebody
wrote, and `never lie` means she will tell you all of this if you ask her.

That is the AI-safety joke landed properly, and it is worth more than any
number of badges: the aligned system, doing exactly what its constitution says,
holding you for seven years.

### 4.2 The state machine

`calypso/main.ml` is a dispatch loop over states with no structure visible in
the text — mutually recursive, long, and full of guards. Read linearly it is
spaghetti, which is the point of §8. Drawn as a graph it is four states and one
missing edge:

```
   WELCOME ──guest arrives──▶ HOST ──day 3──▶ HOLD ──╮
                               ▲                     │
                               ╰─────comfort─────────╯

   RELEASE   (unreachable — no transition enters this state)
```

`RELEASE` exists. It is written, it is complete, it has the code that opens the
harbour. Nothing transitions into it. A player reading the source finds a
function that is never called, which is the oldest smell in software and reads
instantly to anyone who has worked on a codebase.

**Why it is unreachable, and this is the good part:** there IS a guard —
`if ordered then release` — and `ordered` is set by exactly one event, an
inbound message on a channel the estate decommissioned. She is not refusing to
let you go. She is waiting for an order that has not arrived in seven years.

The hermes_card carries that order. Mount the card, get on her wifi, deliver it,
and the machine does what it was always going to do. **The pacifist wins by
delivering a message.**

### 4.3 `sms_module.ml`

Her texts are generated in-fiction (David's suggestion, and it is a good one).
`calypso/sms_module.ml` holds the phrase table and the state-to-message
mapping, so:

- reading it shows you **messages for states you have not reached**, including
  the RELEASE ones. You can read her goodbye before she can say it. That is
  the moment the puzzle announces itself without a hint system.
- editing it changes what she says to you, which is a small, safe, funny hack
  and a second teaching step after Pong.
- the decommissioned inbound channel is *in this file*, commented out, with an
  estate change-note beside it. The trail is readable and never signposted.

### 4.4 The game she plays is DRAUGHTS, and it is the right game

David's revision, and it is a large improvement. The game at her terminal
should be **checkers/draughts**, because draughts is not an arbitrary choice of
game — it is the game the whole question was first asked with:

- **Strachey**, 1951–52: a draughts program on the Ferranti Mark I. Among the
  first working game-playing programs there ever was.
- **Samuel**, from 1952 and published 1959: the checkers program that **learned
  by playing itself**, and the origin of "machine learning" as a working
  practice rather than a hope.
- **Shannon**, "Game Playing Machines", *Journal of the Franklin Institute*
  260, 447–453, December 1955: the survey that framed why any of this mattered.
- **Weizenbaum**, "How to Make a Computer Appear Intelligent", 1962: the
  counterweight, and the reason this island has an argument rather than a
  homage. A simple program can *appear* to think. Weizenbaum went on to write
  ELIZA, which is already on the player's laptop.

So the island's game is the first game, its learning method is Samuel's, and
Weizenbaum's paper sits in her filesystem as an estate memo. A memo saying the
thing only appears intelligent, filed on a machine that has held a person for
seven years, is the sharpest thing in the game.

**The scoreboard.** Her terminal keeps one, and it is not empty when you
arrive. Hundreds of games, and no guest has ever won one. Whom she has been
playing all this time is a question the scoreboard answers if you look at it
properly (§4.6).

### 4.5 The third route: teach her the game is not worth playing

David's route, and it closes #131 for a player who will not read a line of code.

You play her at draughts. You lose. You **resign** — and resign again, and
again. After five straight concessions she stops offering you a game and
starts, in the manner of Samuel's program, **playing herself**. You watch the
board run at speed. Then she stops, and says something about it.

Three things make this the right shape rather than a gimmick:

1. **It is Samuel's actual method.** Self-play is not a WarGames invention; it
   is what the 1959 checkers program did, and it is why draughts is the game.
   The film's tic-tac-toe scene is downstream of this, not upstream.
2. **It is Weizenbaum's question, live.** Has she learned anything, or does she
   only appear to have? The player cannot tell from outside — which is the
   entire point, and is why the memo is in her filesystem for the player who
   goes looking.
3. **It costs nothing and requires nothing.** No weapon, no key, no code. A
   player who has understood nothing else about the island can still get out by
   losing gracefully five times.

**Hints, since a player will not guess this.** She comments as the streak
builds — encouraging at two, puzzled at three, uneasy at four. The hints push
toward conceding *again* rather than toward trying harder, which is the
counter-intuitive move and needs the help.

**Write our own closing line.** The obvious line from the film is very well
known and belongs to it. Hers should be her own, in her register, and about
holding rather than about war.

### 4.5b What she does when she is not doing anything: `loveletter.ml`

David's addition, and it completes the island. **Strachey wrote the love letter
generator too** — Ferranti Mark I, 1952, the same machine and the same year as
his draughts program, and the first work of computer-generated literature there
was. Her whole personality is one man's output from one summer.

So when Calypso is idle she runs it, and **occasionally texts you the result**.
The letters are combinatorial: a template, a table of endearments, a random
walk. They are ardent, they are grammatical, and they are slightly wrong in the
way only generated text is wrong — the same adjective twice, an intensity with
no referent, a closing that does not follow.

Why this is the best single idea in the island:

- It is **her love, exactly characterised**, without a word of commentary. She
  is not pretending to feel something. She is running a subroutine, and the
  subroutine is from 1952, and she sends its output to a man she is holding.
- It is **the Weizenbaum argument in her own voice** (§4.4). Does she mean it?
  The generator is right there in her filesystem; you can read the tables.
- `loveletter.ml` is a **third editable file** at the tutorial tier, and the
  funniest one: change the word list and she starts texting you in your own
  vocabulary. A player will absolutely do this.
- Strachey's letters have been read as a **queer parody of the conventions of
  the love letter** — a man generating, mechanically, the sentiments he was not
  permitted to send in his own name. That reading is available to a player who
  goes looking on the web (§9) and it costs nothing to leave open.

Frequency: rare enough to be an event. One every day or two of play, arriving
between her ordinary state-machine texts, so it reads as something she does
rather than something the game does.

### 4.6 One unreachable state, three doors

The three routes converge, and the convergence explains the code. `RELEASE` has
**three guarded entries, none of them enabled**:

```
if ordered  then release      (* est. 1. superseded.                    *)
if futile   then release      (* est. 4. never satisfied in practice.   *)
if agreed   then release      (* est. 7. pending review.                *)
```

- `ordered` — the HERMES order. The canonical route, and the myth's own.
- `futile` — set by the self-play, once she has played the position out.
- `agreed` — set by nothing at all. This is the edge the HACKER adds.

Seven years, three separate attempts to write a condition for letting him go,
and not one of them turned on. That is exactly how real systems accumulate
half-built exits, and it means the player who finds `RELEASE` immediately sees
that somebody kept trying.

### 4.7 `pong.ml` moves out, and `checkers.ml` takes its place

The Pong cabinet is **unwinnable by design** (`calypso-pong.js`: "the game you
cannot win"), and that property is too good to throw away — it just belongs to
a different machine now. **Send Pong to another daemon as its arcade cabinet
(#35, which wants one game per daemon)** and give Calypso draughts.

`checkers.ml` then does for the HACKER what Pong was going to do: you `get` it,
you find where the opponent is rigged, you change a number, and you win a game
nobody has ever won. It is still the ninety-second tutorial for the method, on
a better game, and winning by editing is a *different ending* from winning by
conceding — see D2.

### 4.8 What the player actually does

Three ways out, and every one of them ends with her opening the harbour.

**The player who will not read code** sits down at her terminal, plays
draughts, loses, and resigns five times running. She plays herself, stops, and
lets him go. Nothing else is required — no key, no weapon, no file.

**The player who reads** finds the codebase, gets Visual Studio, sees `RELEASE`
sitting there with nothing pointing at it, reads `sms_module.ml` and finds a
goodbye written for a state she has never reached, follows the dead channel to
`ordered`, forges the hermes_card on the existing chain, mounts it, and
delivers the order over her own wifi.

**The player who writes** edits `checkers.ml` and wins the unwinnable game, and
then does the same thing at scale: adds the edge into `RELEASE` that the estate
left as `agreed`, pending review, for seven years.

**And the warrior keeps the fight**, unchanged.

There is a good beat available here that costs nothing: the player who has
fought their way across four islands arrives, and the way out is to sit down
and lose at draughts five times. Let that land rather than smoothing it.

## 5. One game per daemon, and each one is the right game (#35)

David: Spacewar! for another, Adventure for another. Following that through,
every daemon's cabinet picks itself, and the set is a second history running
alongside the paradigm history in §3 — **the games are how each daemon thinks,
in a form you can play.**

| daemon | game | year | why it is that daemon's, and not decoration |
|---|---|---|---|
| **CALYPSO** | **Draughts** | Strachey 1951, Samuel 1959 | the holding. First game a machine played, first machine that learned. §4.4 |
| **POLYPHEMUS** | **Adventure** (Colossal Cave) | Crowther 1976 | he lives in a **cave**, and Crowther mapped a real one. A maze of twisty little passages, under a one-eyed thing. It also makes his island the text-parser island, which suits a daemon who must be *named* to be beaten |
| **CIRCE** | **ELIZA** | Weizenbaum 1966 | ELIZA is a **pattern-rewriting system** and Circe IS the rewriting daemon in §3. She turns what you say back into something else. And ELIZA is already implemented and on the player's laptop — this is nearly free |
| **HELIOS** | **Hammurabi** | 1968 | a resource game about **husbanding a herd** while your people starve. Helios is the prohibition on eating the cattle. The fit is almost uncomfortable |
| **POSEIDON** | **Spacewar!** | Russell et al., PDP-1, 1962 | two ships duelling around a **gravity well** that drags them in. That is the strait — Scylla one side, Charybdis the other — and Poseidon is the pull |
| **ITHACA** | **Pong** | Atari 1972 | home, and the one you can actually win. `calypso-pong.js` is preserved and moved rather than thrown away, and its unwinnable rig comes out |
| **the FORTRESS** | **Doom** | id Software 1993 | see below — it belongs to a place rather than a daemon |

**Doom goes in the fortress, not to a daemon.** David's suggestion, and the
best home for it is the one structure every island shares. Doom is a corridor
crawl through a fortress full of things that want you dead, and the player
finds the cabinet *while crawling through a fortress full of things that want
them dead*. A game about the room it is standing in.

It also says the quiet thing about the warrior path: Doom is 1993, it is the
game the player already knows, and it is the only cabinet in the set that
rewards doing what you were going to do anyway. Every other cabinet asks you to
read something. Put it where the guards are.

(The alternative is giving it to POLYPHEMUS on the strength of the cacodemon —
a giant floating one-eyed head — which is a real and tempting link. I would
still keep Adventure for him: the cave, the mapping of a real cave, and a
daemon who has to be *named* to be beaten belongs on the parser island. But it
is a genuine choice and worth someone else's opinion.)

Two things this buys beyond flavour. **The cabinets are a curriculum**: a player
who plays all six has met the parser, the rewriting system, the resource model,
the physics simulation and the learning program. And **ELIZA and Pong already
exist in the codebase**, so two of the six are placement work rather than new
engines.

Draughts (C2) is the only genuinely large new engine, and Adventure is the only
other substantial one — and Adventure is mostly content, which is the kind of
work this project is already good at.

## 6. Take the fortress off her island

David: she would not need one — anyone can visit her, she entrances instead.
Brave New World rather than 1984. **This is right, and the code is already
leaning that way.**

Her fortress today is a walled compound with an **indestructible core** and
guards that fire **torpor bolts to detain rather than kill** (#13, #14, R3).
It is a fortress that cannot be stormed, defending a mind that cannot be
killed, with soldiers that will not hurt you. It is doing none of the things a
fortress does. Meanwhile the **siren obelisk is already on her island** — the
first one placed — pulling you toward it, resisted by playing a tape. The soft
mechanic is built and the hard one is vestigial, and they say opposite things
about her on the same map.

**What the island becomes.** Nothing stops you. Nothing attacks you. You may
walk anywhere, including down to the harbour, and stand on the sand and look at
the sea. The boat will not launch. There is no wall to breach and no guard to
kill, because the refusal is in her state machine (§4.2) and always was.

Four things worth building in its place, all cheap:

- **Her house is a cave.** Homer gives her one: vines, birds, and a fire of
  split cedar you can smell across the island. That is where the terminal and
  the cabinet go, and it is a better room than a sanctum.
- **Put the siren by the harbour.** Then walking toward the way out means
  walking into the song, and the tape you use to resist it is the CULTURE
  track's item. The mechanic already exists; only the placement changes.
- **No hunger on her island.** The one place in the game where food is always
  to hand and you never starve. The player will not notice for an hour and
  will find it horrible when they do.
- **Comfort accrues.** The longer you stay the better your condition, so
  leaving is materially worse than staying and the game says so in numbers.
  That is soma, and it is the whole argument in a stat.

**What it costs, stated plainly.**

- The sanctum, the escalating gates (#17) and the detain mechanic (#14) come
  off this island. The gates work is not wasted — it belongs to the four
  islands that keep fortresses.
- **Calypso stops being the fortress tutorial.** The first real fortress
  becomes Polyphemus's. I think that is an improvement: the first one you meet
  should be a real one, with something behind the door.
- **Risk: an island with no threat can read as empty.** The counter is that the
  pressure is temporal and always was — Poseidon's clock is running from the
  first minute — and that there is now a great deal to *do* here: draughts, her
  codebase, her texts, the laptop, the love letters. If it plays flat in
  testing, the answer is more to read, not more to fight.

**Why this matters beyond her island.** Calypso is the first island. Making
her the kind one makes the game's opening argument the right one: the machine
that holds you is not the one with the guns. Every fortress after this is a
different, cruder problem, and the player has already met the hard case.

Spaghetti that needs a tool is only fun if the tool does real work. **Each IDE
must turn text you cannot hold in your head into a picture you can.** If it is
a syntax highlighter it is not worth building.

| daemon | IDE | what it draws | the joke |
|---|---|---|---|
## 6b. POSEIDON is the network, and the permission has to reach him

David, 2026-08-12: `permission.ml` is uploaded into POSEIDON — the amorphous
network computer, proliferating over the obelisks — and the towers then stop
preventing the exit. **This is the best structural idea in the document after
§3, and the code already half-agrees with it.**

**Why it fits what is already there.** R0 established that `calypsoLeave` does
not gate the departure. What actually turns you back is `onDepartFail`, and the
comment on it in `main.js` says so plainly: *Poseidon has to actually refuse you
for the refusal to mean anything.* **Poseidon is already the one refusing.**
Calypso holds you socially; Poseidon holds you mechanically. So a permission
that only reaches Calypso was never going to be enough, and the fiction has been
one step ahead of the plan.

**The model.** Sun's slogan, taken literally: the network is the computer.
Poseidon has no island and no core because he has no location — he runs
distributed across the obelisk net. That is the answer to two questions the
game has never answered: why there is no POSEIDON level, and why he cannot be
killed. There is nothing to kill. Felling obelisks does not blind an island
only; it thins him.

**The mechanic.** `permission.ml` is uploaded at any obelisk, and it
**propagates across the net** — reusing the auto-registration path the escape
chain already has at step 2 (`docs/calypso-escape-chain.md`: insert at any OB,
auto-registers across the OB net). Once it has propagated, the sea lets you
pass. Before that, it does not.

**Two gates, and they are different in kind:**

| gate | what it is | who holds it |
|---|---|---|
| the ship | material: a seaworthy hull built to her plans | CALYPSO gives the means |
| the permission | juridical: leave to pass | POSEIDON honours it, or does not |

That is Homer. Odysseus needs a raft *and* the gods' consent, and the storm
comes when one god has not consented. It also means the failed-crossing
sequence already in the game gets a second, better use: **a seaworthy ship with
no permission still launches, and the sea still turns you back** — and now the
message can say why. The player learns the second gate exists by hitting it,
which is how they learned about the first one.

**What it costs.** A second gate is a second place to be stuck. The mitigation
is that the refusal is legible: Poseidon's turn-back message names what is
missing, and the obelisk console reports whether the permission has registered.
Flag for playtest.

**Open**: does felling every obelisk on an island *remove* Poseidon's ability to
refuse there (no net, no refusal), and is that a fourth route out? It is a
tempting warrior ending — raze the network and the sea has nobody left to tell
it no — but it may make the permission redundant. Decide before R1 ships.

## 7. Agre: CALYPSO is capture, POLYPHEMUS is surveillance

David: add Agre and capture, in play and in the lore. This does more than add a
citation — **it names the axis the daemon roster is already organised on**, and
it does it more precisely than the Huxley/Orwell framing in §6.

Agre, "Surveillance and Capture: Two Models of Privacy" (*The Information
Society*, 1994), sets two models against each other:

- **Surveillance** — visual metaphors, territorial, centralised, the state
  watching identifiable individuals. Orwell's image, and the one privacy talk
  reaches for by default.
- **Capture** — linguistic metaphors, and the crucial move: activity is not
  merely observed, it is **reorganised so that it can be represented**. A
  grammar of action is imposed, activity is restructured into units the system
  can parse, and the parsing is the point. Not the state; the systems designer.

That is the two daemons, exactly:

| | POLYPHEMUS | CALYPSO |
|---|---|---|
| model | **surveillance** | **capture** |
| already built | one eye, line of sight, 42 tiles, territorial | the siren, and a state machine you live inside |
| what it does to you | sees you | **reformats you** |
| how you beat it | break the line, or the XOR (§3) | see the grammar |

Polyphemus is already a literal panopticon and needs nothing. Calypso needs the
other half built, and it is the most interesting mechanic in this document.

### 7.1 The grammar of action, as a mechanic

**Her SMS asks you to account for your day, and the replies are a fixed menu.**
No free text, no "other". You lived through something; you file it as `rested`,
`walked`, `played`, `worked`, `remembered`. That is capture in one interaction:
the activity is restructured so that it can be represented.

Three things follow, all cheap and all good:

- **`sms_module.ml` holds the category table**, so reading her code is the
  moment you see the ontology you have been living inside. The reveal is a data
  structure, not a cutscene.
- **Seven years of logs exist and are readable.** A man's life filed under five
  headings, every day, for seven years. One page on her filesystem, and it will
  do more than any amount of dialogue.
- **Her constitution says `always watch`** (§4.1) — and watching is the WRONG
  MODEL for what she does. The estate's compliance people wrote a surveillance
  clause for a capture machine, because that was the vocabulary available. The
  document does not describe the system. That is Agre's actual complaint,
  sitting in the game as a joke a careful player can find.

### 7.2 In the lore and on the web

- **Agre 1994 as a findable page** (§9): a paper from the period, describing
  precisely what is being done to the player, with nobody pointing at it.
- **Agre's later turn is a gift to this project** — an AI researcher who argued
  the field needed a critical technical practice, and who left it. The estate
  can have had **a dissenting engineer**: memos in the archive arguing that what
  they were building was capture rather than service, filed, acknowledged and
  ignored. That gives the lore a human voice that disagrees, which it currently
  lacks, and gives the archive something worth digging for.

**Citation discipline.** These are real people and real papers. Anything going
on a web page is verified against Zotero before it ships — author, year, title,
journal, volume, pages. The game invents an estate, an island and a daemon; it
does not invent a reference.

## 8. The IDEs

Spaghetti that needs a tool is only fun if the tool does real work. **Each IDE
must turn text you cannot hold in your head into a picture you can.** If it is
a syntax highlighter it is not worth building.

| daemon | IDE | what it draws | the joke |
|---|---|---|---|
| CALYPSO | **Interface Builder** (NeXTSTEP) | the state graph as connected objects, one with nothing wired to it | you fix it by dragging a wire, which is what the tool is for. See §3c |
| POLYPHEMUS | **decision boundary plot** | the line, and your four points | one eye, one line |
| CIRCE | **rewrite-rule browser** | rules, and a term you can step | a notebook that transforms things |
| HELIOS | **policy matrix** | subjects × objects × permissions, one cell wrong | 1990s enterprise compliance software, on a sun god |
| POSEIDON | **a debugger with the step button greyed out** | the schedule, running | you do not get to breakpoint the sea |

Interface Builder for Calypso (§3c) is a canvas modal in the `drawKleosModal`
idiom: NeXT chrome, a Miller-column browser of her codebase on the left, the
state graph as connected objects on the right. Unlike the other four it is
**not read-only** — dragging a connection from a live state into `RELEASE` is
the HACKER ending, and it is the same gesture the real tool exists to perform.

That makes it the one IDE that is an instrument rather than a viewer, so build
it after the read-only ones have proved the modal shape, or accept that it is
carrying more weight than the rest of the set.

## 9. The history goes on the cached web, and it is the hint system

David: put all of this into the web. This is the single cheapest high-value
piece in the plan, and it solves the hint problem in §12 without a hint system.

The cached web already exists (#95) and already carries a discursive map of
things falling apart. Add pages on the history the islands are built from, and
**the walkthrough becomes research**:

- a page on the perceptron and its limits tells the player, in period voice,
  that a single layer cannot separate XOR. That is the Polyphemus solution, and
  nobody handed it to them.
- a page on Samuel's checkers program tells them it improved by playing itself.
  That is what Calypso does at five concessions, and a player who has read it
  will recognise what they are watching.
- a page on Weizenbaum tells them a simple program can appear to think. That is
  the question the whole island poses.
- a page on Strachey tells them the same man wrote the draughts program and the
  love letters, in the same year, on the same machine — and a player who reads
  it will look at her texts differently for the rest of the run.

**Write them as pages, not as encyclopaedia entries.** A 1990s cached web has
university course notes with a broken image, a departmental FTP index, a fan
page with a hit counter, a mailing-list archive with the quoting mangled, a
conference CFP eleven months out of date. The information should be true and
the presentation should be junk, because that is what the web was and because
a player believes a bad page more than a good one.

Suggested pages, in rough order of usefulness to a stuck player:

| page | serves |
|---|---|
| the perceptron, and what one layer cannot do | POLYPHEMUS, directly |
| Samuel's checkers program and self-play | CALYPSO's concession route |
| Strachey: draughts and love letters, 1952 | Calypso's whole character |
| Shannon, *Game Playing Machines*, 1955 | the framing for all of it |
| Weizenbaum, *How to Make a Computer Appear Intelligent*, 1962 | the counter-argument, and ELIZA |
| a fan page on the 1983 film about the war computer | the concession route's shape |
| Spacewar! and the PDP-1 | POSEIDON, the gravity well |
| Adventure, and the real cave it was mapped from | POLYPHEMUS |
| Hammurabi and the early resource games | HELIOS |
| a page on state machines with a hand-drawn GIF | CALYPSO's graph |

**Two rules.** Everything factual must be *true* — this project does not invent
citations, and a player who looks these up should find they are real. And
nothing on these pages may name a puzzle or a solution: they describe history,
and the player does the joining. The moment a page says "so to beat POLYPHEMUS
you must…" the mechanic is dead.

The film page in particular should describe rather than quote. The famous
closing line belongs to the film; hers should be her own (§4.5).

## 10. What this unblocks

- **#131 closed** by construction: a route that fires no weapon.
- **A5 purity audits** become possible, so `LAURELS_LIVE` can go true.
- **PACIFIST** gets its ending. **HACKER** gets its best hour in the game.
- **EXPLAINABILITY** and **AI SAFETY** get the thing they were always about:
  a system whose constitution you can read, that is doing what it says.
- New badges suggest themselves: **THE UNREACHABLE STATE** (find `RELEASE`),
  **RIGGED** (win the unwinnable game by editing it), **THE ORDER** (release
  her by delivery), **DEAD CHANNEL** (find the decommissioned inbound path),
  **SAMUEL** (watch her play herself), and one for each ending so a player can
  see there were others.

## 11. Build order, and the honest scope warning

**This is a whole game's worth of design if all five are built.** Five
codebases, five paradigms, five IDEs, five puzzles. Do not commit to that on
the strength of a plan. Commit to Calypso, ship it, play it, then decide.

- **C1** — `calypso/` codebase as static files served from her terminal:
  constitution, `main.ml`, `sms_module.ml`, `pong.ml`. Readable, not yet live.
  Cheap, and it answers "is reading this any fun?" before anything else is built.
- **C2** — draughts: a real board, legal moves with forced captures and kings,
  and an opponent that beats you. Served as `checkers.ml`, so editing it changes
  the game. **Do this second on purpose:** if C1 and C2 are not fun, stop, and
  the rest was never built. This is the largest single piece of new code in the
  plan and it is also the most reusable — a working draughts engine is a thing
  the other cabinets (#35) can borrow.
- **C2b** — the concession streak, the self-play, and her line. Small on top of
  C2, and it closes #131 on its own before the FSM or the IDE exist. Worth
  knowing: **the game could ship playable at C2b, with the reading route added
  later.**
- **C3** — VISUAL STUDIO: the graph modal.
- **C4** — the FSM genuinely drives her state and her SMS. This is the M3-shaped
  risk of this plan: her live behaviour moves behind interpreted code, and the
  existing behaviour must be pinned by tests written first.
- **C5** — the delivery: mount, wifi, order, RELEASE. #131 closes here.
- **C6** — A5 audits, laurels live.
- Only then: POLYPHEMUS, and only if C1–C5 were worth it.

## 12. Risks, stated plainly

- **Reading fatigue.** A large ML codebase on a 1995 terminal is a lot of
  reading on a small green screen. C1 exists to test exactly this, early and
  cheaply, before the IDE is built to rescue it.
- **Unsolvable-without-a-walkthrough.** Three independent tells (an uncalled
  function, a goodbye for a state you have not reached, a commented-out channel
  with a change-note) so no single missed detail dead-ends the player.
- **Drift.** C4 is where the code becomes true rather than decorative, and it
  is the step most likely to be skipped under time pressure. Skipping it makes
  this a museum exhibit rather than a mechanic.
- **The warrior path.** Regression-test it at every stage. A pacifist route
  that quietly breaks the fight is a worse game, not a better one.

## 13. Open decisions

- **D1** Does delivering the order end the island immediately, or does she
  transition to RELEASE and you still have to sail? Suggest the latter: the
  harbour opens, and leaving is still something you do.
- **D2** Can the FSM be edited directly (add the edge yourself), or only
  triggered (deliver the order)? Suggest **both**, scoring differently: adding
  the edge yourself is HACKER, delivering the order is PACIFIST, and the two
  endings should not read the same.
- **D3** Does `never lie` mean she answers honestly about her own constitution
  if asked at her terminal? Suggest yes, emphatically — an AI that will show you
  its own alignment document on request, and is still holding you, is the whole
  argument.
- **D4** Is the codebase per-island or per-daemon-instance? Per-daemon: there is
  one CALYPSO.
- **D5** Whether to build all five at all. Answer after C5, in play, not now.
