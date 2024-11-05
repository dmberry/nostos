# The laptop — a portable machine you can actually learn on (design)

*Written 2026-07-25. Stage 1 shipped in v1.199.*

## 1. The fiction

The world is littered with dead computers already: floppy disks, VHS, the notepad
pages, the Backspace holding everything the machines deleted. A **laptop** is the one
piece of that wreckage you can carry, open, and run. Not a lore prop, a machine.

It matters because every console in the game so far is bolted down. Obelisk terminals
stand where the towers stand; HERMES relays sit on hilltops. The laptop is the first
computer that is *yours*: it goes in your hands, it runs offline, and nothing on the
network is watching it. That is what makes it the right place to **learn AI-ML** — the
towers are where you use the language under pressure, the laptop is where you find out
what it does.

The plainness is deliberate. The AIs get Homeric names (POSEIDON, CIRCE, TIRESIAS);
the human kit is called what it is: RON-DOS, HERMES, and now a **UNIX**.

## 2. The architectural fact that decides the design

Inventory slots are `{item: 'key', qty: n}`: a bare item-key string and a count, with
**no per-instance data**. That is exactly why the AI key fakes state with three
separate item defs (`ai_key -> trojan_key -> hermes_card`). A laptop that carries its
own specs, colour, OS, damage and files cannot live in that model without either a
combinatorial pile of defs or surgery on the whole stack/drag/drop/save path.

The precedent that already solves it: **`player.phone` and `player.walkman` are
singleton dashboard slots holding their own state** (mute setting, Snake high score,
which tape, which side). The laptop is the third.

> **Decision.** One laptop at a time, in a dedicated slot: `player.laptop = {model, os,
> colour, cpu, ram, heat, damage, fs}`. Swapping means putting the old one down.
> Ground drops carry their instance data on the ground-item record (which already
> tolerates extra fields, e.g. `keep: true` on a restored AI key).

This is cheaper to build *and* better play: finding a better machine becomes a real
decision instead of hoarding six in a backpack.

## 3a. CUT (2026-07-26): one machine, not a roster

*David's call, and the right one. The UNIX machine grew into a complete computer
— shell, pipes, man pages, the ML sandbox, `ed`, the network card, Netscape — so
a roster of alternative OSes would be five implementations for a smaller payoff
each, and the variety was never the interesting part.*

**What ships instead:** ONE working machine, plus a **broken one you repair with
circuit boards**. That is better play than four colours: it gives the laptop an
acquisition arc (find a dead machine, fix it, own it) and gives circuits a second
sink beside the bluebox.

**What we lose, stated plainly** so it is a decision and not a drift: the frame in
§3 below — *every human OS in the game is real, and the only ahistorical one is
the machines'* — and the CTSS machine that would have carried it, running ELIZA
and almost nothing else. ELIZA survives at the obelisk console, so the DOCTOR is
not lost; the argument about computing history is. If it is ever wanted back, the
cheapest route is not another laptop but an artefact the UNIX machine can READ: a
disk or a tape whose contents are a CTSS listing.

*§3 is kept below as the record of the design that was considered and dropped.*

## 3. The operating systems — real ones *(NOT BUILT — see §3a)*

*(Revised 2026-07-25, David's steer. The first draft had three invented tiers — UNIX,
RON-DOS, a machine OS — which was balance design wearing a costume: the tiers were
made up, so their limits were arbitrary. Real historical machines invert that. The
limitation stops being game balance and becomes a **true fact about the machine**,
which is what this game already does everywhere else: BBC Micro `*commands`, the DCT3
Nokia, the actual 1966 DOCTOR script, cassettes, floppies.)*

The frame that makes the roster more than a museum:

> **Every human OS in the game is a real historical system. The only ahistorical one
> is the machines'.**

The record against the thing that erased the record, in your hands as an item. Each
machine is a different era of computing, which ties the laptop straight into the
Backspace (where everything the machines deleted is kept) and the Scrapbook.

| Machine | The real constraint | What it gives you | Stage |
|---|---|---|---|
| **CTSS** (MIT, 1961) | Where Weizenbaum actually wrote ELIZA | The DOCTOR, and the source listing to read. Almost nothing else. A time capsule | L6 |
| **UNIX V7** (1979) | Shell, pipes, `man`, `/usr/games` | The workhorse: full local computing and the **AI-ML sandbox** | **L3-L5** |
| **PDP-10 era** (1970s) | Where ADVENTURE ran; the AI-lab lineage | The games machine, and the loaded one: where AI research happened, now junk on a beach | L7 |
| **CP/M** (1974) | One floppy at a time, no pipes | The scarcity machine. Sits beside the RON-DOS already in the fiction | later |
| **The machine OS** | Not historical. Theirs | Reaches the network remotely. Watched: using it near a live tower pings the net | later |
| *(sealed)* | A consumer appliance, no shell | **A state, not an OS.** Hack it open to see what it actually runs | later |

**The risk to design against:** if every machine runs exactly one thing, the laptop
becomes a novelty dispenser. UNIX V7 stays the general-purpose workhorse at the centre;
the single-purpose historical machines are finds *around* it, not replacements for it.

Historical anchors worth keeping straight: ELIZA was written on **CTSS**; ADVENTURE ran
on a **PDP-10**; Spacewar! ran on a **PDP-1** (bare, no OS). Keep the claims to those.

## 4. Simulating UNIX

Yes, and it is cheaper than it sounds, because the interpreter already gates verbs by
station (`ctx.station` is `'ob'` or `'hermes'`; `makeBuiltins(station)` filters
`OB_VERBS` / `HERMES_VERBS`). **A laptop is a third station.**

What makes it read as UNIX rather than a themed menu:

- a real **path filesystem**: `/bin`, `/usr/games`, `/usr/man`, `/home`, `/etc`, with
  `.`, `..` and `~`;
- about fifteen commands: `ls -l`, `cd`, `pwd`, `cat`, `echo`, `man`, `rm`, `mv`, `cp`,
  `mkdir`, `uname`, `grep`, `wc`, `head`, `sh`, `help`; **`more`** since v1.271,
  because a file longer than the tube was a file you had read the end of. `ls`
  marks directories with a slash (v1.270), which V7 kept behind `-F`;
- **real pipes** (`cat notes | grep ml | wc`) and `>` redirect. The machinery is the
  same as AI-ML's existing `|>`;
- `sh file` runs a file of commands, so **a saved program is a real object in the
  world**.

Scope discipline: a full UNIX is a rabbit hole. No processes, no users, no permissions,
no `vi`. Files are text, directories are maps, the shell is a line at a time.

## 5. The AI-ML sandbox (why the laptop exists)

At the shell, **`ml`** drops into an AI-ML REPL, the same way `eliza` opens the DOCTOR:
a mode, not a verb. **`ml file.ml`** runs a saved program.

The station filter does the teaching work. On `'laptop'` the builtins are the offline
set only: `echo` plus the whole language core (`let`, `fn x => e`, `if c then a else b`,
arithmetic, `^`, `;`, recursion). The network verbs are **absent by design**, and
saying so is the lesson:

```
> scan
ERR: no network on this machine. `scan` needs a tower — practise here, run it there.
```

So the laptop is where you write `let fact n = if n == 0 then 1 else n * fact (n - 1)`,
get it wrong, get it right, save it to `~/fact.ml`, and carry it to an obelisk. The
`.ml` files already scattered through the escape chain (`factory_id.ml`,
`zeus_virus.ml`) become things you can read and run on your own machine.

Bindings persist while the machine is on, and die when it sleeps.

## 6. Specs, heat and damage

Specs must *do* something or they are flavour. They gate what runs and how long:

- **RAM** gates programs: a big game or a deep recursion needs headroom, and a weak
  machine refuses with `out of memory` (a real, readable failure).
- **CPU** sets how fast heavy work runs, and how fast it heats.
- **Heat** rises while running anything heavy and falls while idle. Past a threshold the
  machine **throttles**, then shuts down until it cools. This is the balance lever on a
  portable console, and it makes a cheap laptop genuinely worse without locking content
  away.
- **Damage** is per-machine and permanent: a cracked screen loses rows, a failing key
  drops a character now and then, a swollen battery cuts runtime. Found condition is
  part of what a laptop *is*.

## 7. Icons

One drawing, not a dozen. Item icons are vector shapes off a `color` property, so the
laptop is a single routine (lid, base, screen) parameterised by:

- **body colour** from the model def (beige, graphite, red, white);
- **screen tint** from the OS (grey-white UNIX, amber RON-DOS, green machine OS, dark
  for sealed);
- **overlays** for damage (a crack across the screen, scorching at the vent).

## 8. Balance: the towers must keep their monopoly

A portable terminal undercuts the obelisks, which currently earn their trips by being
the only console and by hiding you while jacked in (`player.terminalSafe`).

> **Rule.** The sharp verbs (`crash`, `unlock`, `sleep`, `rewind`, `repel`) are **not on
> the laptop at all**, on any OS except the machine OS — and on the machine OS, using
> them is loud. The laptop reads, writes, teaches and stores. The tower is where you
> act.

## 8b. The web — Netscape, and every machine as a host

*(David's steer, 2026-07-25. This is the biggest thing the laptop unlocks, and it
absorbs the standing "FTP/IP robot-hack" idea into a single coherent layer.)*

Every machine in the world gets an **IP address** and serves an **HTTP page**: obelisks,
robots, the W-factory, HERMES relays, the daemon cores. The laptop runs **Netscape
Navigator**, and you surf what is left. The web as a ruin, still being served by
machines that outlived it, because nobody ever turned it off.

**How it gets on: the Wi-Fi spoofer** (David, 2026-07-25). A found device that puts the
laptop on the air while forging everything identifying about it, so the network answers
and nothing can trace the reply back. That is the in-fiction answer to the obvious
question ("why doesn't POSEIDON simply come and find you?"), and it makes the browser
usable without a timer hanging over it.

*(Revised 2026-07-26: the spoofer is **not a separate item**. The card is BUILT INTO
the NostBook — every machine has one, and forging its identity is simply what it
does. The repair arc already gates access to the machine, so a second find added
a step without adding a decision. The existing `wifiblock` gadget is unrelated:
that is a jammer and stays what it is.)*

What it does **not** do is hide your body. At an obelisk you are masked while jacked in
(`player.terminalSafe`); sitting in the open reading the web on a laptop, you are just a
person sitting in the open. The risk moves from digital to bodily, which is the better
kind of risk anyway.

**The design conflict, and how it resolves.** §5 and §8 rest on the laptop being *off
the network*, which is what makes it a safe sandbox and what keeps the towers' monopoly
on the sharp verbs. A laptop that reaches every machine breaks both. The spoofer answers
*tracking*, not *reach* — so the split still has to be drawn, and it is drawn between
**two networks**, which is also simply how it works in life:

| | The control wire | The web |
|---|---|---|
| What it is | POSEIDON's own network. What `scan`, `hack`, `crash` speak | HTTP. A legacy protocol still being served |
| From the laptop | **Unreachable.** No card, no business being on it | Reachable. It is public by design |
| What it gets you | Control | **Reading.** Status, identity, links to other hosts |

An HTTP server on a box is not a login on that box. That is precisely why *breaking
through* the HTTP server is a real escalation later, instead of a free win now. The
browser is **reconnaissance**: it is how you learn a tower's node code, a robot's model
and home tower, which hosts exist at all — and that intelligence is what the hack
consumes.

So the wording in §5 stays honest, with one correction: the laptop has no *control*
interface. The refusal should say the tower verbs need the machines' own wire.

**Wording to change at L8.** Stage 1 ships with the laptop genuinely unnetworked, so its
boot banner says `network ......... none` and the ML refusal says "no network on this
machine". Both are true today and both become wrong the moment the spoofer exists. L8
must update them together: the banner reports the spoofer and its forged address, and
the refusal becomes "that speaks to the control wire; the spoofer only puts you on the
web."

**Sketch:**

- **`src/game/net.js`** — the address layer. A deterministic IP per machine (seeded, so
  it is stable across a reload), a per-island subnet, and a registry that maps an IP to
  whatever object serves it. Also the home of the hostnames.
- **Pages.** Each machine type serves a template filled from its live state: a tower's
  page carries its node code, class, circuit id and whether it is dark; a robot's
  carries model, battery, home tower; the factory's carries its production log. The
  aesthetic is institutional web rot: over-built corporate pages, dead links, stale
  counters, a "last updated" from before the collapse.
- **Netscape.** A browser mode on the laptop, rendering to the CRT as text with numbered
  links you follow (period-correct, and it suits the screen). `open <ip>`, `back`,
  a link by number.
- **Discovery.** You cannot browse what you cannot address. IPs come from the pages
  themselves (hosts link to hosts), from HERMES records, and off a robot's own plate.
  Finding an address is the game.
- **Later: the hack.** Getting *through* the HTTP server to the machine behind it. This
  is where the old FTP idea lands, and where a robot becomes a gardener by being
  rewritten rather than by being stunned and blueboxed.

## 9. Stages

- **L1** — this document.
- **L2** — item defs (model, colour, base specs) + the parameterised icon.
- **L3** — `src/game/unix.js`: the pure, testable filesystem and shell (no canvas, no
  map), in the shape of `blight.js` / `strait.js`, with `test/unix.test.js`.
- **L4** — the AI-ML sandbox: station `'laptop'`, the `ml` mode and `ml file.ml`.
- **L5** — the carry slot, save/load, ground pickup with instance data, the terminal
  wiring and boot banner, and a lyre dev-kit entry for testing.
- **L6** — ~~the CTSS machine~~ **DROPPED (2026-07-26).** The idea was a machine that runs the DOCTOR and little else. ELIZA already runs at the obelisk consoles, and a second machine to host one program it can already host was not worth the surface. The historical notes below are kept because they are still true about where ELIZA came from. Original entry: the **CTSS machine**: runs the DOCTOR and little else, with its
  source listing on the disk to read. Nearly free, since ELIZA already exists
  (`createEliza`, and the obelisk console's mode-switch pattern).
- **L7** *(later)* — the **PDP-10 machine** and `/usr/games`: ADVENTURE as a room graph,
  Spacewar! reusing the cabinet frame that already runs Calypso's Pong (`openPong` /
  `newCalypsoPong`), shared with the AI cabinets plan.
- **L8** *(next big one)* — **the web** (§8b): `net.js` and the IP layer, machine HTTP
  pages, and Netscape on the laptop. Read-only reconnaissance.
- **L9** *(after L8)* — **breaking through the HTTP server**: the escalation from
  reading a machine's public face to rewriting the machine. Absorbs the standing
  FTP/robot-hack idea (task #50).
- **later** — CP/M, the machine OS, the sealed state and the hack that opens it.

## 10. Files

- `docs/laptop-plan.md` — this.
- `src/game/unix.js` — filesystem + shell, pure.
- `src/game/ai_ml.js` — the `'laptop'` station and its offline builtin set.
- `src/game/items.js` — laptop model defs.
- `src/engine/renderer.js` — `drawItemIcon` laptop case.
- `src/main.js` — the carry slot, terminal wiring, boot banner, lyre kit entry.
- `test/unix.test.js`, `test/ai-ml-lang.test.js` — coverage.

## 11. Open questions

- Does the laptop need power (a battery item), or is heat enough of a limit on its own?
  Starting with heat only; a battery is easy to add later if it feels weightless.
- Should a laptop's files survive death, like the AI-key backup on the HERMES mesh? A
  machine you left in a cache probably should.
- How many models is enough? Starting with four colours and two spec tiers.

---

## The cache, the press and the encyclopedia (v1.222–v1.224)

The old web survives as one caching proxy racked inside the daemon's estate
(`src/game/archive.js`), and the island's own nameserver answers for every
domain in it. Three layers, all reachable from Netscape:

**The sites** — nine written out with the specific thing broken about each
(youtube, myspace, mp3.com, geocities, napster, hotmail, friendsreunited,
askjeeves, amazon), twenty-six more as named damaged records, and twenty
universities with their own page shape (a departmental index, the seminars
still listed). All filed in AltaVista's Directory by category, so the web is
browsable rather than guessable.

**The press** (`src/game/press.js`) — four invented mastheads carrying the
collapse between them, addressed as `press:<domain>/<edition>`:

| | sees | beats |
|---|---|---|
| BITSTREAM | the trade weekly | discovery, deployment, activation, the rationalisation problem |
| THE MERIDIAN | the paper of record | policy, the refused shutdown, the collapse, the blank front page |
| THE SIGNAL | the tabloid | AI psychosis, panic, **John Mentor**, one sheet |
| EXCHANGE | the financial daily | the bubble, the crash, no index, **the capital trap** |

No years anywhere: `lore.js` dates nothing absolutely (eras 0..2), so the papers
use volumes, issue numbers and a day and month. The sequence is carried by the
issue numbers climbing and the page counts falling.

**The encyclopedia** — `wiki:<key>`, ten articles held. The centre of it is
*Transformer (machine learning)*: an entirely ordinary encyclopedia entry about
a piece of engineering, sitting in a cache on a dead network, describing the
mechanism running the island outside the window. Written for the game rather
than copied from anywhere. Around it: *Attention*, *John Mentor*, *Torism*,
*Magnifica Humanitas*, *Leo XIV*, *Philip K. Dick*, *Network Collapse*, and
*After Virtue* and *Frankfurt School* as heavy fragments, because the
philosophical substrate is what survives worst.

### John Mentor and Torism

**John Mentor** is the Ned Ludd of this world: a name on letters, sightings that
do not agree, no register with him on it, and an article that has survived three
deletion nominations on the grounds that the name is notable whether or not the
man is. **Torism** is the philosophy built on those letters and **Torites** its
adherents, named for the tors — the bare rocky summits nobody ran a cable up,
where RON's own relays already sit (`hermes.js`).

Its three strands, deliberately unreconciled:

- **virtue** — a practice is something you can get good at, and getting good at
  it makes you someone; a procedure forms nobody. The estates replaced the first
  with the second at scale, efficiently, and with consent.
- **the person** — a person is not the readings taken of them, and no pile of
  measurements adds up to one. This is where it touches personalism and the
  language of *Magnifica Humanitas* (Leo XIV, already in the world as graffiti:
  GREAT MEANS, SMALL SOULS).
- **instrumental reason** — the oldest strand, and Torites know they did not
  invent it.

### The loop this closes

Scavenged lore now carries **addresses** (`tor-04` … `tor-06` in `lore.js`): a
note found in a hut names `dailysignal.co.uk`, `exchange-daily.com`, or a
wikipedia article, and the cache answers for it. Reading becomes a reason to go
back to the laptop. Typing a real URL works too —
`en.wikipedia.org/wiki/Transformer_(deep_learning)` resolves.

**Not done at the time of writing; since resolved in v1.226:** the papers are in
`whatsNewPage`, AltaVista has a News & Media channel, the cache is bookmarked,
and a lore scrap names `exchange-daily.com` No 4,744 by issue. Still open: the
universities' AI-lab traces are implied by which departments are missing rather
than written.

---

## The machine itself (v1.229–v1.232)

The laptop stopped being a shell with a browser bolted on and became a computer
you can look around.

**Documents.** Real PDFs in `assets/media/pdfs/`, listed in `/home/documents`,
opened with `pdf <file>`. `cat` on one prints a `%PDF` header and points at the
reader. The window is ours (NostBook chassis, Acrobat-red bar, an X); the page
rendering is the browser's own viewer. That split is why the X matters: inside
the viewer the native control takes every keystroke, so Escape alone would
strand a phone user. And because iOS Safari and Android Chrome routinely refuse
to render a PDF in a frame at all, a coarse pointer gets a hand-off — a
full-width OPEN DOCUMENT target — instead of a frame that would be blank.

Three papers so far, each arriving at the game's own argument from a long way
off: Asimov on the cult of ignorance, **James, *Are We Automata?* (1879)** —
which asks the consciousness question the newspapers keep declining to answer —
and **Gonseth on the humanization of technics**, which is the ground *Magnifica
Humanitas* and the Torites stand on.

**The system tree.** V7's, not Linux's: `/dev /etc /lib /mnt /tmp /usr /usr/src`
and the kernel at the root as a file called `unix`. No `/var`, `/opt`, `/proc`
or `/sbin` — all later, and a test enforces both halves. Every file earns its
place: `/etc/passwd` names the previous owner, `/etc/rc` has `ifconfig wifi0 up`
commented out, `/dev/wifi0` is the card the forging happens on, `/usr/src` holds
the source, `/tmp/core` is a Netscape crash from rendering a shop.

**Tools:** `tail sort uniq who ps df uptime`, all pipeable.

**`telnet`** is the important one. `telnet calypso.com 80` then `GET /` returns
real headers and the page; `PUT`/`POST` return **501 Not Implemented**. A player
learns what an httpd will and will not do by typing at one, which is the L9
lesson arrived at rather than announced.

**`/readme.txt`** explains the build: a 1979 kernel, a Berkeley networking tape,
a third of `/bin` typed in from a printed listing. Old on purpose — no update
service, no telemetry, no vendor, nothing written after the estates were built
and so no accommodation for them anywhere in it. Small enough for one person to
read, and honest that it will never reach the control wire.

**Migration:** `graftSystemDirs` adds only what is missing to an older save's
disk and never touches `/home`.

### Still open here

- The papers are in New&Cool now (v1.226) but **no lore scrap points at a
  specific newspaper edition** except `exchange-daily.com` No 4,744.
- `telnet` speaks GET/HEAD only. **L9 is the seam**: the break should make some
  verb other than GET answer, on one machine, once.
- The universities' AI-lab traces are still implied by which departments are
  missing rather than written.

---

## The tube (v1.270–v1.271)

Every text file on the disk is written to **80 columns**, which is what a
terminal of the period was. The CRT gave 68 at a common window size, so `cat` on
anything longer soft-wrapped mid-sentence and lost the indentation with it. The
font is sized from the screen width so 80 fit, measured per platform rather than
assumed, clamped 9–15px, recomputed on open and on resize. Anything authored to
80 now displays as written.

`more` pages: SPACE, RETURN, `q`, a percentage, and it takes a pipe. It
overwrites its own `--More--`. `cat` still does not page.

**A boot that finishes.** `finishLaptopBoot` was written to print whatever the
sequence had not reached, and every caller passed `null`, so a boot interrupted
by a keystroke discarded the rest and left you at a prompt on a machine that
looked half-started. The remainder is kept where that function can reach it.

## The library, the toolkit, and transcribe (v1.233–v1.235)

**The Torite toolkit.** Four programs chosen by one rule: keep what you can mend,
nothing that reports, go where the cable does not run.

- **`uucp` / `mail` / `uustat` / `uucico`** — store-and-forward, and the only
  system on the machine that cares where the player is standing. Compose
  anywhere; the queue leaves only next to a TOR relay, and the relays are on the
  summits. A hilltop becomes a post office. Mail to `ithaca!` is **held**, never
  lost, because it has never answered. `/usr/spool/mail/e.marsh` holds the
  previous owner's three messages.
- **`strings`** — the way into anything that will not talk, and the feeder for L9.
- **`crypt`** — V7's, a Beaufort step, so one command goes both ways.
- **`almanac`** — sun, moon and tide from the machine's own clock, asking nobody.

**`transcribe`** answers how paper gets into a machine with no scanner: you type
it in, which `/readme.txt` already establishes as normal. The payoff is that a
transcribed scrap stops being paper — `grep` searches it, `crypt` locks it,
`mail` carries it to a relay. It is what gives `uucp` something worth carrying
uphill.

**The library.** Seven complete works in `/home/books`, opened in Netscape (a
**Library** button on the toolbar, `book <key>` at the shell). They need no card.
**Framed, not injected**: the Shakespeare is 7 MB, which through `innerHTML`
stalls the browser, and a frame keeps each book's stylesheet, cover and internal
chapter links working against its own directory.

All seven are Project Gutenberg editions, carrying their own licence headers
unaltered, credited in the README and the in-game About box.

### Lessons this stretch, worth keeping

Twice now a **broken asset path has hidden behind a plausible blank**: an empty
frame looks identical to a large document still loading. Once when the PDFs moved
to `assets/media/laptop/`, once waiting to happen if a book row and the disk
disagreed. There is now a test asserting every registered book and cover exists.
The general rule: when a viewer shows nothing, check the fetch before blaming the
viewer.

Copy goes stale as data grows. The books module said "three of them" and the
library page said "chose these three" after the shelf reached seven. Counts in
prose should be computed, not written.

### Still open here

- `telnet` speaks GET and HEAD. **L9 is the seam**: the break should make one
  other verb answer, on one machine, once.
- The universities' AI-lab traces are still implied by which departments are
  missing rather than written.
- Nothing yet **reads** a transcribed note back into the world: the loop ends at
  the relay. Whether a posted scrap should have a consequence is an open design
  question.

## L9 — through the HTTP server (v1.258)

**Done.** Reading a machine was always free; rewriting one is now earned.

The chain, in the order a player finds it:

1. ~~`telnet <unit> 80`, then `PUT /program.ml` → **401 Unauthorized**~~ **GATE REMOVED (2026-07-27).** The write path is open: `post` and `PUT` both work, and the httpd binary now says why — the auth was specified, the token was compiled in, and nothing ever checked it. Original entry: naming a
   header it will not give you a token for.
2. `GET /cgi-bin/httpd` → **the server's own binary**. It serves the directory
   its programs sit in, which is how these were routinely misconfigured.
3. Save it, `strings` it. Among the junk: `X-RON-Maint: RON-CAL-17825`, the
   header name, the verbs the server knows, and `/usr/src/httpd/main.c`.
4. Send `X-RON-Maint: <token>` in the session, then `PUT` → **200**.
5. `post <file> <unit>` works from the shell from then on.

> **SUPERSEDED (2026-07-27, v1.266).** The gate is gone: `post` and `PUT` both
> work with no token. The binary still carries the token and now also carries
> `TODO: auth. -- jdm`, so `strings` teaches what was actually true of these
> machines — the lock was specified, the token compiled in, and nothing ever
> checked it. **Open: a payoff for `telnet` and `strings` somewhere off the
> write path.** The steps below are kept as the record of what was built.

**The token is derived from the daemon's name**, so it is per-island. Opening
Calypso's machines teaches you nothing about Polyphemus's. `player.httpdBroken`
is a list of island names, saved and restored with everything else.

This closes **P5** in `docs/robot-programs-plan.md`, where `post` shipped
deliberately ungated so it could be tested, with L9 named as the gate it was
waiting for. It also gives `strings` the job it was built for.

### What it is not

The break is knowledge, not an item. Nothing is consumed and nothing carried. A
player who writes the token down could type it on a fresh save, which is true of
a real password and is left alone.
