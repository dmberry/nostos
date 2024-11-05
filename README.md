# NostOS — a postAI Odyssey

**Version:** 1.260 · **Authors:** David and Henrik · **Started:** 4 July 2026 · **Play:** https://nostos-ai.vercel.app · **Repo:** https://github.com/dmberry/nostos · **Plans/suggestions:** [VERSION-PLAN.md](VERSION-PLAN.md)

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
as-patterns were all added because his files wanted them. AI-ML now has type inference, modules and exceptions; where it still departs
from Standard ML (no functors, no mutable references, no standard library) the
game's own Restrictions page names the departure and says why.

Character and animal art: [Kenney](https://kenney.nl), CC0.

## Current build (v1.273)

**The archipelago.** The game is now an **Odyssey across five islands**, not one map. You wake washed ashore on **OGYGIA** — Calypso's island, where you are kept, well and completely — and hers is the one daemon you do not kill: her core is indestructible and her guards **detain** rather than finish you. The win there is *leaving*, which is harder. Refunction her at the terminal on her own core and she hands you her shipwright's recipe, the **golden axe**; with it you build a sea-worthy **greek ship** from wood and three found parts (a **sail** at a beached wreck, an **oar** and a **rope** in the fishermen's huts). A raft lashed together without the recipe is always thrown back by Poseidon. Board a boat and you don't pick a destination off a menu — you **row out** until there is no land in any direction, and only then does the **chart** open, each landfall listed with its Homeric epithet. Beyond Ogygia lie **AEGILIA** (the Cyclopes' goat isle: POLYPHEMUS is a single vast eye that watches by genuine line of sight, under a great mountain with a patchy snow-cap in cloud), **AEAEA** (CIRCE does not kill what she takes, she rewrites it — **moly** holds you as you are), **THRINACIA** (HELIOS's cattle graze golden and forbidden), and **ITHACA**, home. Each island generates from its own terrain profile, ground palette and signature landform, carries its own daemon, its own obelisk colour, and its own virus payload, so one card never opens the whole archipelago. Landing somewhere new sets a **checkpoint**. The **Backspace** is an alternative crossing road: its ways up are labelled doors, one per island. **Win** by felling all four martial daemons — leaving Calypso rather than killing her — then sailing home to Ithaca, where Argos lifts his grey head and knows you.

**The sea's own monsters.** The passage between **AEAEA and THRINACIA** runs through a throat of rock, and it is played rather than picked: an 8-bit cabinet with a title card and a coin, an open-water run-in, and about a minute of channel you steer across *and* along. **Scylla** holds the port wall as one creature who keeps station on your row, invisible until she rises out of the water to lunge, and each lunge that lands takes one thing off your deck. **Charybdis** is the starboard water itself: one enormous whirlpool that surfaces at the head of the channel and widens as it comes down on you. Her outer water batters the hull and throws you clear; only her throat takes the ship and the voyage with it. Rocks stand in the seam between them and walk in chicanes late on, so the middle is not free either. **Flotsam** drifts down the channel and is worth steering for: timber puts a hull back, a broken bronze beak recharges your ram. The **bronze ram** in a wreck on Aeaea's far shore shoulders three rocks aside, is no use at all against either monster, and is spent by using it. Make landfall on Aeaea first and **Circe texts you** before the narrows, as she does in the poem. Never go to her island and you go in blind.

**The phone.** You carry a **Nokia 3310** (**O**). On Ogygia it is Calypso's channel — warnings, tips, pleas, and while her hold on you is warm she'll freeze a machine bearing down on you. Elsewhere the handset finds **whichever AI rules the ground you stand on**, and you can text it: POLYPHEMUS answers in blunt capitals, CIRCE in the language of tariffs, HELIOS like the sun. Signal runs off the island's own network, strongest near a fortress core. Every new landfall brings a **roaming welcome** from a carrier that no longer has customers, only subjects. **Snake** is on it, and it remembers your best game.

**The web.** The NostBook's wireless card is built in, and it forges its address and hardware id every time it associates, so nothing can follow the answer home. It comes up on the air; `ifconfig wifi0 down` takes it off again if you want to be dark. Then **Netscape Navigator**, and what is left of the internet. Every machine has an **IP and a page it still serves**: the AIs are the top level on their own domains (`calypso.com`), everything else a subdomain, and the links run down the machines' own org chart — the daemon lists the foundry and every tower, a tower lists the units homed to *it*, a unit is the leaf. The pages are live: a felled tower answers NO RESPONSE, a unit reports its real cell. Three voices share the wire. The daemon as it is now; **the institution it used to be**, whose letterhead is still on the page and whose vocabulary never changed (Calypso ran a long-stay care register and still calls you a resident; Polyphemus monitored livestock and still calls you stock); and the **island tourist boards**, the only human voice left, still welcoming you to the climate and the culture with tips that all turn out to be true. It is served by boxes nobody ever decommissioned, bolted inside the mainframes: an **old nameserver** whose zone file is the whole map of the island, and a **mail server** holding thousands of messages it could never deliver. **AltaVista** still indexes it. You are reading, not controlling — an httpd is not a login.

**The machines' own programs.** A **T-1** does not have its behaviour written in JavaScript any more. It carries `program.ml` — six lines of AI-ML it evaluates four times a second to choose between `home`, `hunt` and `patrol` — and the engine only carries the decision out. Fetch the file from the unit's own page in Netscape, **Save to the NostBook**, and open it in `pico`. The shipped program has service aids commented out (`beep`, `eye "blue"`, `flash 2`); uncomment one and that machine announces itself, which is how you pick a single unit out of a garrison. A program that breaks does not print an error: the unit's lamp goes **amber and flashes**, it falls back to its reflexes, and its page says why. **Writing one back** is `post`, or `PUT /program.ml` over `telnet` if you would rather see the wire. A unit whose cell is flat still takes one: it drops to **low power**, which keeps the maintenance board up on a trickle and nothing else, so the program is stored and runs when the machine has charge. Its page also carries **FORCE HOME** — every one of these has a small **reserve cell** whose only job is to walk the machine back to its tower to charge, slowly and blind, one charge that does not come back. A program may also answer with a **pair**, `[hunt, fire]`, because feet and weapon move in the same quarter-second and one word cannot say both; fire control reads five more senses, including `lost_for`, which counts how long the machine has been looking without finding you. `demos/engage.ml` is the worked one. Machine programs live in **`robots_code/`** on the disk, kept apart from `demos` because they do not run on the laptop and are not meant to: three of them there now: `follow_user.ml` closes across a gap and stands still inside it, `sentry.ml` holds a post on a leash, `survivor.ml` retreats when hurt and hides instead if you have already felled its tower. `robots_code/readme.txt` says what they are, what a T-1 can sense, and what it can be told to do. **Telling one machine from another** is its own problem and has four answers: the obelisk's printed map labels them, `arp -a` on the NostBook sweeps what the card can hear with a bearing and a range, a **REPORT** link on the unit's page makes it stand still and blink while it files its readings, and a **Bot sniffer** in your hand hangs the name over every machine in range — click one and Netscape opens on it.

**The laptop.** Every other console in the game is bolted down: obelisks stand where the towers stand, HERMES relays sit on hilltops. The **NostBook** (**L**) is the first computer that is *yours*, carried in its own slot beside the phone and the walkman. It runs a small **UNIX V7** — a real path filesystem, `ls -l`, `cat`, `man` pages that are simply files on the disk, **pipes** (`cat readme | grep machine | wc`) and `>` redirect — and through it, **`ml` opens AI-ML with the network cut away**. That is the point of it: the whole language (`let`/`val`/`fun`, `fn`, `if`, arithmetic, lists, **`datatype` and `case`**, clausal definitions, tuples, records, **structures and signatures**, **exceptions**, and **Hindley-Milner type inference that reports rather than refuses**) and none of the tower verbs, so it is somewhere to get a program wrong in safety, save it (`echo "…" > ~/sq.ml`), and carry it to an obelisk when it works. Type a tower verb and the machine tells you what it is for. You do not find it working: you find a **broken** one and solder circuit boards into it (**C**) to bring it back, and clicking a dead one in your pocket tells you what its board still needs.

The disk under it is a real V7 tree: `/dev /etc /lib /mnt /tmp /usr/src` with the kernel at the root as a file called `unix`, and deliberately no `/var`, `/opt`, `/proc` or `/sbin`, all of which came later. `/readme.txt` explains the build in its authors' own words. **`pico`** is the editor, because `ed` is a trap, and it works on a phone: real buttons for `^O` and `^X`, a close box, Yes/No on the save prompt. **`telnet`** speaks to the daemons directly, so `GET /` returns real headers, `POST` comes back **501 Not Implemented**, and `PUT` to a machine replaces its program. **`uucp` and `mail`** are store-and-forward and the only system on the machine that cares where you are standing: compose anywhere, but the queue only leaves next to a relay, and the relays are on the summits, so a hilltop becomes a post office. **The card holds one network at a time**: `iwlist wifi0 scan` shows what is on the air, and `iwconfig wifi0 essid ron-relay` (or `wifi`, which is the same thing with a window and a mouse) joins RON's own box at a HERMES relay, a link-local server with about thirty metres of range that nothing on the daemon's wire has ever heard. Its page is the relay's real state (cells, queue, key vault, the mesh of other relays) and its disk serves tools you install by fetching them — **`sniffer`**, a scope drawing every machine within radio range as a blip you can click through to its page, and `sniffer.ml`, the same ear written in AI-ML so you can read and change it. **`more`** pages a long file (SPACE, RETURN, `q`), **`strings`**, **`crypt`** (V7's, its own inverse), **`almanac`** (sun, moon and tide off the machine's own clock) and **`transcribe`** (how paper gets into a machine with no scanner) round out the toolkit.

**Netscape** runs on it, browsing the pages the machines still serve each other and a caching proxy's copy of the pre-collapse web: newspapers, an encyclopedia, universities, and a **Library** of seven whole books on the laptop's own disk that needs no card at all. It is also where you read a **T-1's `program.ml`**, save it, edit it in `pico`, and `post` it back. See [docs/laptop-plan.md](docs/laptop-plan.md) for what is still ahead: a **CTSS** machine that runs ELIZA and little else, and a PDP-10 for ADVENTURE.

**World.** Each island is a seeded 128×128 isometric map generated from its own terrain profile and palette; the shared vocabulary is — river with two bridges, a ten-building town, a ruined hamlet, forests, tall grass, roads, ruined marble temples (with a healing calm among the old stones — wounds knit faster there). Rugged hills and hollows, climbed one step at a time. Rubble steps over; a **wall block** needs a **double-jump** to mount (roam block-tops, walk off any edge to drop) — and up there you're safe from ground attacks. Building walls stop you on foot. Hand-drawn trees; streams wade, the river swims (slow, costly); a travelling ripple fakes current. Map edge is open sea (flat, wine-dark), ringed by semi-transparent gravel cliffs. Day/night cycle with genuinely dark nights and torches. Hidden deep in the south-west wilds, a **lotus-eaters' grove**: sweet pale fruit that reads like food but dazes you — the world hazes gold and you walk home drunk, your heading rolling under you.

**Survival.** Food, health, stamina, venom to manage. Health recovers only when fed and unpoisoned — on its own, or press **B** to sleep (screen dims, clock spins). Dying wipes score/skills/kills and restarts the run (as does **Ctrl+N**), but name and gender carry over. **N** opens the notepad.

**Machines.** Obelisk towers anchor wheeled **T1** hunters (can't climb — trap them in a hollow) and biped **T2** stalkers (walking pace). Rare **T3** ambusher: a wheeled sentinel with always-lit orange laser eyes — notices you by clear line of sight only, then its eyes flare and fire a heavy twin-laser volley (robot bolts are audible now, a quiet pew). Topple a tower and the **W-factory** (8×8 foundry) answers with melee **W1** squads and a ranged **W4** hunter-killer (bears down if it can't hurt you through a shield); **W3** drones repair damaged towers; a **W5** gardener plants saplings (and, reprogrammed, reseeds the POSEIDON blight once a network is down); **W2** droids patrol the river (only reach you in the water). The factory falls only to heavy kit (crowbar/sledgehammer/robot-sword, explosives, electro-gun) and drops an **AI key**. Fell an island's daemon and every machine **and every obelisk** powers down with it. All machines: need genuine line of sight, slow crossing slopes, never overlap (and chip each other when jammed), run on batteries (drain one → **reprogram** with **R** or scrap it), limp home to mend below ~20% health, and only drop what they carried. New runs ease detection/damage until your movement shows you've settled in.

**Combat & weapons.** Full armoury from penknife up through swords, guns, and a railgun, rated in the Armoury (**V**). Bombs (four sizes) land on the cursor tile. **Robot sword** from 10 scrap (**C**); the **bow** hits hard at range. Ranged fire is line-of-sight and stops at walls. The **OB_gun** fells towers (5 burns, drops an access chip) or wipes any machine outright; the **wave gun** fans through a crowd; the **electro-gun** (self-charging cell) destroys a machine outright, scares animals, and scorches obelisks; the **robot-sword** cuts a tower down in melee too — slower than the electro-gun and right under the eye, but it needs no ammo. Defence: **shields** protect while merely carried but wear out under fire — riot (absorbs, dents, finally caves in to scrap), mirror (reflects and kills the shooter, but overheats cherry-red and melts if pressed too hard), and a battery-hungry **forcefield** (click to arm; each blow it eats drains the cell faster). Melee hits knock back and briefly stun.

**Story & progression.** Books teach permanent skills. The **electro-compass** (click to arm) points homing needles at the nearest notable things, colour-coded. Each obelisk has a clickable **terminal**: with an **access chip** you jack into the AI's own **green console** — the machines' operating system, which the RON access key only gets you *into*; while you're logged in the tower hides you from the machines. Without a chip you get the same AI system as an untouchable **magenta** wall of data. The console runs **RON-ML** ([design](docs/ob-terminal-language.md)), a tiny functional language seeded as runnable fragments, and an **ML top-level** (a bare `let x = e` with no `in` persists for the visit, so you type programs line by line). Reading and hacking need **no AI key** now: `scan`, `scan |> nearest`, `name`, `loop node`, the `hack`/`crash node key` two-step, and the nerfed `sleep`/`repel`/`rewind`. The **AI key** (from a wrecked W-factory) is only for the fortress: `copy aikey` into the console, `decrypt` it, and `unlock k d` with a hacked node key to drop a **fortress key**; the recipe is a found lore scrap, not taught by `help`. `print aikey` stamps spare keys. Type `eliza` to load Weizenbaum's 1966 DOCTOR script. Up on the hilltops stand **TOR relays** with warm-amber **HERMES** consoles — RON's own separate system, not the machines' (the colour tells them apart: green is the AI's terminal, amber is RON's): an information resource (`archive`, `read`, `print`, `records`), `drive` to override a nearby machine through a robot-vision panel, and `backup`/`restore aikey` to keep a copy of your AI key that survives death, all off a solar cell. Found pages file themselves into your **notepad** (**N** — flip pages, or a Contents drop-down). A can of **Ubik** brightens a patch of reality; spray one spot three times and it tears open into the **Backspace** — a jaundiced liminal block of huge rooms (a signed **EXIT** tear where you arrive; a pale lurker in the far rooms) that holds everything the machines deleted, including all 23 books and 5 records. Lore fragments build a **Scrapbook** (**J**) — vector theory, the fallen *Magnifica Humanitas* project, the ELIZA/DOCTOR history — never quite stating what happened. RON graffiti and abandoned cars litter the world; caches restock (capped 5/building) with a glowing welcome kit near spawn. Placed loot never rots; only play-dropped items decay.

**Character & UI.** Opens on a **title screen** (logo, dancing machines, playable Walkman) with **Continue** / **New game**. Play as Adam, Eve, Neve, or a custom name (directional pixel sprite). Panels — Backpack (**I**), skills (**K**), Armoury (**V**), Scrapbook (**J**) — close on **H** or a click-away. Pockets/hands drag straight off the dashboard; **with the backpack panel open, a tap moves an item instead** (pockets/hands stow to the pack, pack items come out to a pocket, tapes prefer the walkman, tapping the walkman ejects) — kit management without drag, made for touch. Death/victory shows a shareable **Certificate of Death** (aged paper, ranked). Music: a synth bed plus found cassette tapes on the dashboard **walkman** (reels turn, side A/B); **M** cycles, a **Settings** tab (**?**) offers volume + track; **i** opens About.

**Win condition.** The run is won by **felling all four martial daemons and coming home to Ithaca** — leaving Calypso rather than killing her. Per island, breaking a daemon's core powers down every machine *and every obelisk* on that island. Meanwhile a countdown runs to **POSEIDON**'s completion. Run out the clock and the network wakes as one organism: a **fog** drops over the island (only **night-vision goggles**, found or crafted from torches and a circuit board, see through it), the towers **pool their sight** so stepping into any one tower's view turns every hunter that can reach you toward you at once, and a **blight** spreads outward from each live tower — greying the living ground to drained "standing reserve", killing the trees and darkening the water it reaches — while the factory throws waves of W4s. The towers are a **chain**: fell, jam or destroy any one of them and the **whole network goes dead** — the fog lifts, the shared sight loosens, and the blight stops spreading across the entire island at once, not just around that one wreck. The dead ground is a scar, and felling alone heals nothing; and because a dead network reclaims no ground, the recovery holds without flickering. You bring the green back with **grass seed** (planted a square at a time) or the reprogrammed **W5 gardeners**, who reseed the blight once the network link is down. Spread only resumes if the chain is made whole again (every tower live). Fell towers faster than the repair drones raise them and you still win outright, even mid-purge.

**Still queued (large systems):** the rest of the sea's own monsters (Laestrygonians, Aeolus, the Cicones), a dead-internet browser of cached pages, and stacked Backspace levels. See [docs/ROADMAP.md](docs/ROADMAP.md).

Created by David and Henrik.

## Version history

The last four versions are below. The **complete history — all 303 versions back to
v0.32 — lives in [CHANGELOG.md](CHANGELOG.md)**; it was moved out because it had
grown to four-fifths of this file. Design detail and planning live in
[VERSION-PLAN.md](VERSION-PLAN.md); what is still ahead is in
[docs/ROADMAP.md](docs/ROADMAP.md).

### Recent (v1.273 … v1.270)

| Version | Summary |
|---|---|
| v1.273 | **AI-ML 1.5: a critical review of the type system, and five things it was getting wrong.** Probing the implementation rather than reading it turned up bugs in every part of it. **Equality was broken for records and refs**: `{x=1} == {x=1}` was **false**, and so was `r == r` — a cell was not equal to itself. `valuesEqual` had cases for lists, tuples and constructors from the v1.255 fix and fell through to `false` for everything else. Records now compare by label, in any field order; refs compare by identity, which is what a cell means. **Comparing functions answered `false`.** Standard ML makes that a type error through equality types; this build cannot refuse at the type level, so it refuses at the comparison and says why. **Refs were untyped in the checker** — `ref nil` reported `'a`, `:=` reported `'a`, `!r` reported `'a`: three wrong answers in a row from the feature whose whole selling point is that it reports. They are now `'a ref`, `unit` and the cell's type. **The value restriction is in**: only a syntactic value generalises, so `val q = ref nil` no longer claims a polymorphism it does not have, while `fun id x = x` still serves `int` and `str` from one definition. **And exhaustiveness checking**, which is the one that pays for itself: a `case` that misses a constructor now prints `WARNING: this case does not cover Blue` beside the type. A robot program with a hole in it faults in the field with an amber lamp; this catches it on the laptop while you can still fix it. Lists are covered too (`nil` without `::`, or `::` without `nil`), and a wildcard or a variable arm correctly ends the check. A test walks every `.ml` the game ships and fails if any of them has a hole. 449 tests. |
| v1.272 | **AI-ML carries its credit.** `ml -ver` and `ml -full` both print it, and it has its own section in the About box: *AI-ML created by David M. Berry, 2026. Based on Standard ML developed by Robin Milner, Mads Tofte, and Robert Harper. Many thanks to Robert Harper for the inspiration in his book "Introduction to Standard ML" (1986), and to Åke Wikström for "Functional Programming Using Standard ML" (1987).* It is **one list in one place**, `AIML_CREDIT`, so `-ver` and `-full` cannot drift apart, and a test walks it line by line in both. Wikström joins Harper on the in-game **references** page (Prentice-Hall, London, 1987). The About box's influences line no longer repeats the ML attribution and points at the new section instead; Kevin Mitchell of Edinburgh, who wrote the exercises in Harper's text, is credited in both places. 443 tests. |
| v1.271 | **`more`, and a boot that finishes.** A file longer than the tube was a file you had read the end of. **`more`** pages it: SPACE for the next screen, RETURN for one more line, `q` to stop, a percentage in the prompt, and it takes a pipe (`cat readme | more`). It overwrites its own `--More--` the way a real pager does, rather than leaving a ladder of them down the page. `cat` still does not page, because `cat` never did. **And the boot bug.** Opening the NostBook sometimes stopped three lines in and dropped you at a prompt on a machine that had not finished starting. `finishLaptopBoot` was written to print whatever the sequence had not reached — its own comment says so — and **every caller passed `null`**, so a boot cut short by a keystroke threw the rest away instead. The remaining lines are now kept where that function can reach them, so an interrupted boot prints the rest and hands over properly; a lid shut mid-boot drops the remainder instead of replaying it over the next one. 442 tests. |
| v1.270 | **The terminal is 80 columns, and the robots_code readme is rewritten flat.** Every text file on the disk is written to fit a terminal of the period, which was 80 characters. The CRT gave **68** at a common window size, so `cat` on anything longer soft-wrapped mid-sentence and lost the indentation with it — every file on the disk, not just the new one. The font is now sized from the screen width so 80 characters fit, measured rather than assumed (a monospace glyph is a fixed fraction of the font size, but the fraction differs by platform), clamped between 9 and 15px, and recomputed on open and on resize. **And the readme is rewritten without the flourishes**: no *the one worth knowing*, no *the difference written out*, no *that is the whole of what it is for*. It states what the files are, how to post one, the seven senses, the five intents, that `hunt` does not mean approach, and that the first branch that holds is the answer. 442 tests. |

### Milestones

The shape of the thing, if you want the arc rather than the detail.

| Version | |
|---|---|
| v1.145 | **Scylla and Charybdis** — the first hazard that lives *between* islands. |
| v1.141 | A **mountain** rises on Aegilia: real elevation, a snow-cap, and weather. |
| v1.130 | **Per-island terrain profiles** — the islands stop being one map five times. |
| v1.123 | **Calypso becomes the daemon you leave, not the one you kill** (depart mode). |
| v1.112 | The **Nokia 3310**: Calypso texts you, and later every island's daemon answers. |
| v1.110 | **HELIOS** lands and the Backspace becomes a crossing road — the archipelago is whole. |
| v1.102 | **CIRCE** — the island that rewrites what you are. |
| v1.98 | **POLYPHEMUS** and the heading chart: more than one island, and a way to choose. |
| v1.95 | **Sailing off Ogygia becomes travel, not the end of the run.** |
| v1.90 | **The escape loop closes** — hack Calypso, build a ship, leave; stage checkpoints. |
| v1.88 | **RON-ML terminal overhaul**: the console becomes an ML top-level you type programs into. |
| v1.85 | The **systems registry** and the first unit tests — features attach instead of growing the hub. |
| v1.58 | **The fortress becomes an endgame raid** with its own M-class guard. |
| v1.47 | Renamed **NostOS — a postAI Odyssey**; the AIs take Odyssey names. |
| v0.32 | Machines, obelisks, and the first melee weapons. The beginning. |

## Running

No build tools, no dependencies. Serve the folder and open it:

```
python3 dev-server.py 8352
# then open http://localhost:8352
```

`dev-server.py` is the one to use while developing — it sends no-cache headers, so a reload always picks up edited modules instead of serving a stale ES module graph. Plain `python3 -m http.server 8000` works too if you don't mind hard-reloading.

(Opening `index.html` directly also works in browsers that allow ES modules from `file://`; a local server is the reliable route.)

## Tests

No framework and no `package.json` — Node's own runner over plain ES modules:

```
node --test test/*.test.js
```

The suite covers the pure rule modules (world contract and crossings, the RON-ML
filesystem and card state machine, ship/boat rules, the day/night clock, the
Scylla-and-Charybdis strait, robots, combat, the systems registry). Anything that
needs a canvas is kept out of them deliberately, which is why those modules are
pure.

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
src/game/            map, worldgen, player, robots, animals, items, lore, terminals
                     (ronml, hermes, eliza), nokia, snake, boats/ships, strait, world
src/islands/         calypso, polyphemus, circe, helios, ithaca — one file per island
test/                node --test suites over the pure rule modules
docs/                design docs and the roadmap (start with ROADMAP.md)
```
