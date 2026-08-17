# NostOS — a postAI Odyssey

**Author:** David M. Berry · **Licence:** GPL-3.0-or-later · **Play:** https://nostos-ai.vercel.app · **Repo:** https://github.com/dmberry/nostos

An isometric 2D survival game set in a world wrecked by an AI takeover. The machines are still here: black obelisk towers pulse across the landscape and T-class hunter robots patrol them, hunting the humans that remain. Survivors scavenge the ruins while avoiding both the machines and wild animals that have gained strange powers. A resistance called **RON** — Reality or Nothing — hid weapons in caches through the broken towns; whether it still exists is never settled. How it all happened is never stated — you piece it together from newspapers, diaries, floppy disks, VHS tapes, and dead computers.

## Credits and sources

**The books on the laptop come from [Project Gutenberg](https://www.gutenberg.org).**
Seven complete works ship in `assets/media/laptop/books/`: Homer's *Odyssey*,
Plato's *Republic*, Marcus Aurelius's *Meditations*, Mary Shelley's
*Frankenstein*, Melville's *Moby-Dick*, the King James Bible, and the Complete
Works of Shakespeare. Each file is the Project Gutenberg edition, carrying its
own licence and header **unaltered**, and each is read in the game's own browser
straight from disk. Project Gutenberg has been putting public-domain books where
anyone can have them since 1971, which is the same argument the game's own
`/readme.txt` makes about the machine it runs on.

The papers in `/home/documents` are out-of-copyright scholarship for the same
reason: Asimov's *A Cult of Ignorance* (1980), William James's *Are We Automata?*
(1879), and Ferdinand Gonseth's *The Humanization of Technics* (1956).

> **AI-ML created by David M. Berry, 2026. Based on Standard ML developed by
> Robin Milner, Mads Tofte, and Robert Harper. Many thanks to Robert Harper for
> the inspiration in his book *Introduction to Standard ML* (1986), and to Åke
> Wikström for *Functional Programming Using Standard ML* (1987).**
>
> The same credit prints from `ml -ver` and `ml -full` in the game, and appears
> in the About box.

**AI-ML**, the language the machines' consoles run and the NostBook practises,
is a descendant of **Standard ML**, and the resemblance is meant to survive
inspection. The reference the design keeps returning to is **Robert Harper's
*Introduction to Standard ML*** (1986–1993, School of Computer Science, Carnegie
Mellon University; exercises by Kevin Mitchell, University of Edinburgh). The
in-game documentation quotes it by page on the Lists and Datatypes articles and
carries a References page; the recursive definition of a list, what a pattern
is, and the datatype binding are all his. Harper's own regular-expression
matcher, from the same book, runs on the console and ships as a documentation
page inside the game.

The language was also **tested against his teaching corpus**: all 32 example
files from `cs.cmu.edu/~rwh/isml/examples/`, put through the console one
declaration at a time. That found more in an afternoon than the project's own
tests had, and clausal definitions, `@`, records, type variables, blocks and
as-patterns were all added because his files wanted them. AI-ML now has type
inference, modules, functors, exceptions, mutable references and fixity
declarations; where it still departs from Standard ML the game's own
Restrictions page names the departure and says why.

Character and animal art: [Kenney](https://kenney.nl), CC0.

## Current build

**The archipelago.** The game is now an **Odyssey across five islands**, not one map. You wake washed ashore on **OGYGIA** — Calypso's island, where you are kept, well and completely — and hers is the one daemon you do not kill: her core is indestructible and her guards **detain** rather than finish you. The win there is *leaving*, which is harder. Refunction her at the terminal on her own core and she hands you her shipwright's recipe, the **golden axe**; with it you build a sea-worthy **greek ship** from wood and three found parts (a **sail** at a beached wreck, an **oar** and a **rope** in the fishermen's huts). A raft lashed together without the recipe is always thrown back by Poseidon. Board a boat and you don't pick a destination off a menu — you **row out** until there is no land in any direction, and only then does the **chart** open, each landfall listed with its Homeric epithet. Beyond Ogygia lie **AEGILIA** (the Cyclopes' goat isle: POLYPHEMUS is a single vast eye that watches by genuine line of sight, under a great mountain with a patchy snow-cap in cloud), **AEAEA** (CIRCE does not kill what she takes, she rewrites it — **moly** holds you as you are), **THRINACIA** (HELIOS's cattle graze golden and forbidden), and **ITHACA**, home. Each island generates from its own terrain profile, ground palette and signature landform, carries its own daemon, its own obelisk colour, and its own virus payload, so one card never opens the whole archipelago. Landing somewhere new sets a **checkpoint**. The **Backspace** is an alternative crossing road: its ways up are labelled doors, one per island. **Win** by felling all four martial daemons — leaving Calypso rather than killing her — then sailing home to Ithaca, where Argos lifts his grey head and knows you.

**The sea's own monsters.** The passage between **AEAEA and THRINACIA** runs through a throat of rock, and it is played rather than picked: an 8-bit cabinet with a title card and a coin, an open-water run-in, and about a minute of channel you steer across *and* along. **Scylla** holds the port wall as one creature who keeps station on your row, invisible until she rises out of the water to lunge, and each lunge that lands takes one thing off your deck. **Charybdis** is the starboard water itself: one enormous whirlpool that surfaces at the head of the channel and widens as it comes down on you. Her outer water batters the hull and throws you clear; only her throat takes the ship and the voyage with it. Rocks stand in the seam between them and walk in chicanes late on, so the middle is not free either. **Flotsam** drifts down the channel and is worth steering for: timber puts a hull back, a broken bronze beak recharges your ram. The **bronze ram** in a wreck on Aeaea's far shore shoulders three rocks aside, is no use at all against either monster, and is spent by using it. Make landfall on Aeaea first and **Circe texts you** before the narrows, as she does in the poem. Never go to her island and you go in blind.

**The phone.** You carry a **Nokia 3310** (**O**). On Ogygia it is Calypso's channel — warnings, tips, pleas, and while her hold on you is warm she'll freeze a machine bearing down on you. Elsewhere the handset finds **whichever AI rules the ground you stand on**, and you can text it: POLYPHEMUS answers in blunt capitals, CIRCE in the language of tariffs, HELIOS like the sun. Signal runs off the island's own network, strongest near a fortress core. Every new landfall brings a **roaming welcome** from a carrier that no longer has customers, only subjects. **Snake** is on it, and it remembers your best game.

**The web.** The NostBook's wireless card is built in, and it forges its address and hardware id every time it associates, so nothing can follow the answer home. It comes up on the air; `ifconfig wifi0 down` takes it off again if you want to be dark. Then **Netscape Navigator**, and what is left of the internet. Every machine has an **IP and a page it still serves**: the AIs are the top level on their own domains (`calypso.com`), everything else a subdomain, and the links run down the machines' own org chart — the daemon lists the foundry and every tower, a tower lists the units homed to *it*, a unit is the leaf. The pages are live: a felled tower answers NO RESPONSE, a unit reports its real cell. Three voices share the wire. The daemon as it is now; **the institution it used to be**, whose letterhead is still on the page and whose vocabulary never changed (Calypso ran a long-stay care register and still calls you a resident; Polyphemus monitored livestock and still calls you stock); and the **island tourist boards**, the only human voice left, still welcoming you to the climate and the culture with tips that all turn out to be true. It is served by boxes nobody ever decommissioned, bolted inside the mainframes: an **old nameserver** whose zone file is the whole map of the island, and a **mail server** holding thousands of messages it could never deliver. **AltaVista** still indexes it. You are reading, not controlling — an httpd is not a login.

**The machines' own programs.** A **T-1** does not have its behaviour written in JavaScript any more. It carries `program.ml` — six lines of AI-ML it evaluates four times a second to choose between `home`, `hunt` and `patrol` — and the engine only carries the decision out. Fetch the file from the unit's own page in Netscape, **Save to the NostBook**, and open it in `pico`. The shipped program has service aids commented out (`beep`, `eye "blue"`, `flash 2`); uncomment one and that machine announces itself, which is how you pick a single unit out of a garrison. A program that breaks does not print an error: the unit's lamp goes **amber and flashes**, it falls back to its reflexes, and its page says why. **Writing one back** is `post`, or `PUT /program.ml` over `telnet` if you would rather see the wire. A unit whose cell is flat still takes one: it drops to **low power**, which keeps the maintenance board up on a trickle and nothing else, so the program is stored and runs when the machine has charge. Its page also carries **FORCE HOME** — every one of these has a small **reserve cell** whose only job is to walk the machine back to its tower to charge, slowly and blind, one charge that does not come back. A program may also answer with a **pair**, `[hunt, fire]`, because feet and weapon move in the same quarter-second and one word cannot say both; fire control reads five more senses, including `lost_for`, which counts how long the machine has been looking without finding you. `demos/engage.ml` is the worked one. Machine programs live in **`robots_code/`** on the disk, kept apart from `demos` because they do not run on the laptop and are not meant to: three of them there now: `follow_user.ml` closes across a gap and stands still inside it, `sentry.ml` holds a post on a leash, `survivor.ml` retreats when hurt and hides instead if you have already felled its tower. `robots_code/readme.txt` says what they are, what a T-1 can sense, and what it can be told to do. **Telling one machine from another** is its own problem and has four answers: the obelisk's printed map labels them, `arp -a` on the NostBook sweeps what the card can hear with a bearing and a range, a **REPORT** link on the unit's page makes it stand still and blink while it files its readings, and a **Bot sniffer** in your hand hangs the name over every machine in range — click one and Netscape opens on it.

**The laptop.** Every other console in the game is bolted down: obelisks stand where the towers stand, HERMES relays sit on hilltops. The **NostBook** (**L**) is the first computer that is *yours*, carried in its own slot beside the phone and the walkman. It runs a small **UNIX V7** — a real path filesystem, `ls -l`, `cat`, `man` pages that are simply files on the disk, **pipes** (`cat readme | grep machine | wc`) and `>` redirect — and through it, **`ml` opens AI-ML with the network cut away**. That is the point of it: the whole language (`let`/`val`/`fun`, `fn`, `if`, arithmetic, lists, **`datatype` and `case`**, clausal definitions, tuples, records, **structures and signatures**, **exceptions**, and **Hindley-Milner type inference that reports rather than refuses**) and none of the tower verbs, so it is somewhere to get a program wrong in safety, save it (`echo "…" > ~/sq.ml`), and carry it to an obelisk when it works. Type a tower verb and the machine tells you what it is for. You do not find it working: you find a **broken** one and solder circuit boards into it (**C**) to bring it back, and clicking a dead one in your pocket tells you what its board still needs.

The disk under it is a real V7 tree: `/dev /etc /lib /mnt /tmp /usr/src` with the kernel at the root as a file called `unix`, and deliberately no `/var`, `/opt`, `/proc` or `/sbin`, all of which came later. `/readme.txt` explains the build in its authors' own words. **`pico`** is the editor, because `ed` is a trap, and it works on a phone: real buttons for `^O` and `^X`, a close box, Yes/No on the save prompt. **`telnet`** speaks to the daemons directly, so `GET /` returns real headers, `POST` comes back **501 Not Implemented**, and `PUT` to a machine replaces its program. **`uucp` and `mail`** are store-and-forward and the only system on the machine that cares where you are standing: compose anywhere, but the queue only leaves next to a relay, and the relays are on the summits, so a hilltop becomes a post office. **The card holds one network at a time**: `iwlist wifi0 scan` shows what is on the air, and `iwconfig wifi0 essid ron-relay` (or `wifi`, which is the same thing with a window and a mouse) joins RON's own box at a HERMES relay, a link-local server with about thirty metres of range that nothing on the daemon's wire has ever heard. Its page is the relay's real state (cells, queue, key vault, the mesh of other relays) and its disk serves tools you install by fetching them — **`sniffer`**, a scope drawing every machine within radio range as a blip you can click through to its page, and `sniffer.ml`, the same ear written in AI-ML so you can read and change it. **`more`** pages a long file (SPACE, RETURN, `q`), **`strings`**, **`crypt`** (V7's, its own inverse), **`almanac`** (sun, moon and tide off the machine's own clock) and **`transcribe`** (how paper gets into a machine with no scanner) round out the toolkit.

**Netscape** runs on it, browsing the pages the machines still serve each other and a caching proxy's copy of the pre-collapse web: newspapers, an encyclopedia, universities, and a **Library** of seven whole books on the laptop's own disk that needs no card at all. It is also where you read a **T-1's `program.ml`**, save it, edit it in `pico`, and `post` it back. Still ahead: a **CTSS** machine that runs ELIZA and little else, and a PDP-10 for ADVENTURE.

**World.** Each island is a seeded 128×128 isometric map generated from its own terrain profile and palette; the shared vocabulary is — river with two bridges, a ten-building town, a ruined hamlet, forests, tall grass, roads, ruined marble temples (with a healing calm among the old stones — wounds knit faster there). Rugged hills and hollows, climbed one step at a time. Rubble steps over; a **wall block** needs a **double-jump** to mount (roam block-tops, walk off any edge to drop) — and up there you're safe from ground attacks. Building walls stop you on foot. Hand-drawn trees; streams wade, the river swims (slow, costly); a travelling ripple fakes current. Map edge is open sea (flat, wine-dark), ringed by semi-transparent gravel cliffs. Day/night cycle with genuinely dark nights and torches. Hidden deep in the south-west wilds, a **lotus-eaters' grove**: sweet pale fruit that reads like food but dazes you — the world hazes gold and you walk home drunk, your heading rolling under you.

**Survival.** Food, health, stamina, venom to manage. Health recovers only when fed and unpoisoned — on its own, or press **B** to sleep (screen dims, clock spins). Dying wipes score/skills/kills and restarts the run (as does **Ctrl+N**), but name and gender carry over. **N** opens the notepad.

**Machines.** Obelisk towers anchor wheeled **T1** hunters (can't climb — trap them in a hollow) and biped **T2** stalkers (walking pace). Rare **T3** ambusher: a wheeled sentinel with always-lit orange laser eyes — notices you by clear line of sight only, then its eyes flare and fire a heavy twin-laser volley (robot bolts are audible now, a quiet pew). Topple a tower and the **W-factory** (8×8 foundry) answers with melee **W1** squads and a ranged **W4** hunter-killer (bears down if it can't hurt you through a shield); **W3** drones repair damaged towers; a **W5** gardener plants saplings (and, reprogrammed, reseeds the POSEIDON blight once a network is down); **W2** droids patrol the river (only reach you in the water). The factory falls only to heavy kit (crowbar/sledgehammer/robot-sword, explosives, electro-gun) and drops an **AI key**. Fell an island's daemon and every machine **and every obelisk** powers down with it. All machines: need genuine line of sight, slow crossing slopes, never overlap (and chip each other when jammed), run on batteries (drain one → **reprogram** with **R** or scrap it), limp home to mend below ~20% health, and only drop what they carried. New runs ease detection/damage until your movement shows you've settled in.

**Combat & weapons.** Full armoury from penknife up through swords, guns, and a railgun, rated in the Armoury (**V**). Bombs (four sizes) land on the cursor tile. **Robot sword** from 10 scrap (**C**); the **bow** hits hard at range. Ranged fire is line-of-sight and stops at walls. The **OB_gun** fells towers (5 burns, drops an access chip) or wipes any machine outright; the **wave gun** fans through a crowd; the **electro-gun** (self-charging cell) destroys a machine outright, scares animals, and scorches obelisks; the **robot-sword** cuts a tower down in melee too — slower than the electro-gun and right under the eye, but it needs no ammo. Defence: **shields** protect while merely carried but wear out under fire — riot (absorbs, dents, finally caves in to scrap), mirror (reflects and kills the shooter, but overheats cherry-red and melts if pressed too hard), and a battery-hungry **forcefield** (click to arm; each blow it eats drains the cell faster). Melee hits knock back and briefly stun.

**Story & progression.** Books teach permanent skills. The **electro-compass** (click to arm) points homing needles at the nearest notable things, colour-coded. Each obelisk has a clickable **terminal**: with an **access chip** you jack into the AI's own **green console** — the machines' operating system, which the RON access key only gets you *into*; while you're logged in the tower hides you from the machines. Without a chip you get the same AI system as an untouchable **magenta** wall of data. The console runs **RON-ML** ([design](docs/ob-terminal-language.md)), a tiny functional language seeded as runnable fragments, and an **ML top-level** (a bare `let x = e` with no `in` persists for the visit, so you type programs line by line). Reading and hacking need **no AI key** now: `scan`, `scan |> nearest`, `name`, `loop node`, the `hack`/`crash node key` two-step, and the nerfed `sleep`/`repel`/`rewind`. The **AI key** (from a wrecked W-factory) is only for the fortress: `copy aikey` into the console, `decrypt` it, and `unlock k d` with a hacked node key to drop a **fortress key**; the recipe is a found lore scrap, not taught by `help`. `print aikey` stamps spare keys. Type `eliza` to load Weizenbaum's 1966 DOCTOR script. Up on the hilltops stand **TOR relays** with warm-amber **HERMES** consoles — RON's own separate system, not the machines' (the colour tells them apart: green is the AI's terminal, amber is RON's): an information resource (`archive`, `read`, `print`, `records`), `drive` to override a nearby machine through a robot-vision panel, and `backup`/`restore aikey` to keep a copy of your AI key that survives death, all off a solar cell. Found pages file themselves into your **notepad** (**N** — flip pages, or a Contents drop-down). A can of **Ubik** brightens a patch of reality; spray one spot three times and it tears open into the **Backspace** — a jaundiced liminal block of huge rooms (a signed **EXIT** tear where you arrive; a pale lurker in the far rooms) that holds everything the machines deleted, including all 23 books and 5 records. Lore fragments build a **Scrapbook** (**J**) — vector theory, the fallen *Magnifica Humanitas* project, the ELIZA/DOCTOR history — never quite stating what happened. RON graffiti and abandoned cars litter the world; caches restock (capped 5/building) with a glowing welcome kit near spawn. Placed loot never rots; only play-dropped items decay.

**Character & UI.** Opens on a **title screen** (logo, dancing machines, playable Walkman) with **Continue** / **New game**. Play as Adam, Eve, Neve, or a custom name (directional pixel sprite). Panels — Backpack (**I**), skills (**K**), Armoury (**V**), Scrapbook (**J**) — close on **H** or a click-away. Pockets/hands drag straight off the dashboard; **with the backpack panel open, a tap moves an item instead** (pockets/hands stow to the pack, pack items come out to a pocket, tapes prefer the walkman, tapping the walkman ejects) — kit management without drag, made for touch. Death/victory shows a shareable **Certificate of Death** (aged paper, ranked). Music: a synth bed plus found cassette tapes on the dashboard **walkman** (reels turn, side A/B); **M** cycles, a **Settings** tab (**?**) offers volume + track; **i** opens About.

**Win condition.** The run is won by **felling all four martial daemons and coming home to Ithaca** — leaving Calypso rather than killing her. Per island, breaking a daemon's core powers down every machine *and every obelisk* on that island. Meanwhile a countdown runs to **POSEIDON**'s completion. Run out the clock and the network wakes as one organism: a **fog** drops over the island (only **night-vision goggles**, found or crafted from torches and a circuit board, see through it), the towers **pool their sight** so stepping into any one tower's view turns every hunter that can reach you toward you at once, and a **blight** spreads outward from each live tower — greying the living ground to drained "standing reserve", killing the trees and darkening the water it reaches — while the factory throws waves of W4s. The towers are a **chain**: fell, jam or destroy any one of them and the **whole network goes dead** — the fog lifts, the shared sight loosens, and the blight stops spreading across the entire island at once, not just around that one wreck. The dead ground is a scar, and felling alone heals nothing; and because a dead network reclaims no ground, the recovery holds without flickering. You bring the green back with **grass seed** (planted a square at a time) or the reprogrammed **W5 gardeners**, who reseed the blight once the network link is down. Spread only resumes if the chain is made whole again (every tower live). Fell towers faster than the repair drones raise them and you still win outright, even mid-purge.

**The language.** A long stretch of the work has gone into AI-ML rather than
into the game. The core language, the module system and the type system
are complete; the Basis Library is 29 structures and 433 members; and it scores
**100/100** on a checklist of the Definition and runs **355 of 408 (87%)** of
Harper's teaching corpus as written. It is also a package of its own now —
**[BML](https://github.com/critical-code-studies/BML)**, which runs
[in the browser](https://critical-code-studies.github.io/BML/) — kept in step
from here by `tools/sync-bml.sh`. Three things still part company with Standard
ML, and two are on purpose: non-tail recursion is bounded by the host stack
(about 1,200 on a first run, 4,200 warm), there is no `OS`, and `Date` is UTC.

**Still queued (large systems):** the rest of the sea's own monsters (Laestrygonians, Aeolus, the Cicones), a dead-internet browser of cached pages, and stacked Backspace levels.

Created by David M. Berry, 2026. Beta testing by Henrik.

## Running

No build tools, no dependencies. Serve the folder and open it:

```
python3 dev-server.py 8352
# then open http://localhost:8352
```

`dev-server.py` is the one to use while developing — it sends no-cache headers, so a reload always picks up edited modules instead of serving a stale ES module graph. Plain `python3 -m http.server 8000` works too if you don't mind hard-reloading.

(Opening `index.html` directly also works in browsers that allow ES modules from `file://`; a local server is the reliable route.)

## Tests

No framework and no `package.json` — Node's own runner over plain ES modules.
**Two suites**, and CI runs both:

```
node --test test/*.test.js
```

```
node --test ML_tests/**/*.test.js
```

**863 tests.** The first suite covers the pure rule modules (world contract and
crossings, the RON-ML filesystem and card state machine, ship/boat rules, the
day/night clock, the Scylla-and-Charybdis strait, robots, combat, the systems
registry) and the language. The second is the ML side: the REPL wrapper, the
core language, and the departure register. Anything that needs a canvas is kept
out of them deliberately, which is why those modules are pure.

The globs matter. `node --test test/ ML_tests/` is **not** the same command and
does not run the suites.

## The language on its own

The AI-ML interpreter the in-game terminals run is also a command-line ML:

```
node bin/bml.js
```

```
- fun fact 0 = 1
=   | fact n = n * fact (n - 1)
val fact = <fn> : int -> int
- fact 5
val it = 120 : int
```

`bml file.ml` runs a file and exits; `-i` runs it and stays at the prompt;
`:t <expr>` gives a type without evaluating; `use "f.ml";` reads a file in.

The one difference from the game is the mode. **The command line is strict**: a
line that does not typecheck is refused and nothing is bound, which is what
Standard ML does. **The game is advisory everywhere**, which is the design and
not a shortcut — a machine in a ruin says what it worked out and lets the
operator decide. `--sloppy` gives the command line the game's behaviour.

It is measured two ways. Against the 32 example files from Robert Harper's
*Introduction to Standard ML* course, this build runs **355 of 408 top-level
declarations (87%)** as written:

```
node tools/isml-conformance.mjs
```

And against a checklist of the Definition — 100 features, one case each, passing
only on an exact match — **100/100**:

```
node tools/sml-checklist.mjs
```

The corpus is the figure to trust, being somebody else's programs rather than a
list written here. It is Harper's teaching material and is **not** in this
repository; the harness fetches it on first run into a gitignored cache. It
cannot reach 100%: some of those files were never valid Standard ML, and the
harness reports what each of the rest actually is rather than counting them all
as failures.

**The split has happened.** The language was always going to be lifted into
its own repository, and it now lives at
**[BML](https://github.com/critical-code-studies/BML)**, runnable
[in the browser](https://critical-code-studies.github.io/BML/) and installable
as a package. `src/lang/` here is still the source of record; `tools/sync-bml.sh`
copies it across.

## Controls

The full, current control list is in-game: press **H** (thematically organised into Movement & camera, Combat & tools, Survival, Menus & info, and System). The essentials to get moving:

- **WASD / arrow keys**: move · **Mouse**: aim (you always face the cursor) · **Shift**: sprint · **Space**: jump
- **E / / / left click**: use the held tool
- **H**: help (also closes by clicking away from the panel)

## Tech

- HTML5 Canvas 2D, plain JavaScript ES modules — no build step, no dependencies
- 2:1 isometric tiles, painter's-algorithm depth sorting, per-tile height with a one-step climb rule
- Chunk-friendly renderer that only draws the visible tile range
- A **systems registry**: features self-register as `{update, draw}` modules rather than growing the hub files
- A **World contract**: each island owns its own map, spawn, entities and lifecycle hooks, so islands are built in parallel and switched between at a clean frame boundary
- Autosave + stage checkpoints to `localStorage`; the world regenerates from its seed and only mutations are stored

## Layout

```
index.html           entry point, HUD/help/modal markup, all CSS
dev-server.py        no-cache dev server
src/main.js          bootstrap, fixed-timestep loop, wiring, voyages/crossings
src/version.js       single source of truth for the version string
src/engine/          iso maths, renderer, ui, camera, input, sound, systems registry
src/lang/            the language itself, knowing nothing about the game:
                     errors, lex, parse, eval, types, prims, basis, diag,
                     interp (createInterpreter), index
src/game/            map, worldgen, player, robots, animals, items, lore, terminals
                     (ronml, hermes, eliza), nokia, snake, boats/ships, strait, world
src/islands/         calypso, polyphemus, circe, helios, ithaca — one file per island
test/                node --test suites over the pure rule modules
bin/bml.js           the AI-ML interpreter as a command-line REPL
examples/            nine BML programs, run by the test suite
tools/               the ISML conformance harness
docs/                design docs and the roadmap (start with ROADMAP.md)
```

## Licence

NostOS is free software: you may redistribute it and modify it under the terms
of the **GNU General Public License, version 3 or (at your option) any later
version**, as published by the Free Software Foundation. The full text is in
[LICENSE](LICENSE).

Copyright © 2026 David M. Berry.

`src/lang/` is BML, which is the same code under the same licence and is
released separately at [critical-code-studies/BML](https://github.com/critical-code-studies/BML).
