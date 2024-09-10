# NostOS — a postAI Odyssey

**Version:** 1.211 · **Authors:** David and Henrik · **Started:** 4 July 2026 · **Play:** https://nostos-ai.vercel.app · **Repo:** https://github.com/dmberry/nostos · **Plans/suggestions:** [VERSION-PLAN.md](VERSION-PLAN.md)

An isometric 2D survival game set in a world wrecked by an AI takeover. The machines are still here: black obelisk towers pulse across the landscape and T-class hunter robots patrol them, hunting the humans that remain. Survivors scavenge the ruins while avoiding both the machines and wild animals that have gained strange powers. A resistance called **RON** — Reality or Nothing — hid weapons in caches through the broken towns; whether it still exists is never settled. How it all happened is never stated — you piece it together from newspapers, diaries, floppy disks, VHS tapes, and dead computers.

## Current build (v1.229)

**The archipelago.** The game is now an **Odyssey across five islands**, not one map. You wake washed ashore on **OGYGIA** — Calypso's island, where you are kept, well and completely — and hers is the one daemon you do not kill: her core is indestructible and her guards **detain** rather than finish you. The win there is *leaving*, which is harder. Refunction her at the terminal on her own core and she hands you her shipwright's recipe, the **golden axe**; with it you build a sea-worthy **greek ship** from wood and three found parts (a **sail** at a beached wreck, an **oar** and a **rope** in the fishermen's huts). A raft lashed together without the recipe is always thrown back by Poseidon. Board a boat and you don't pick a destination off a menu — you **row out** until there is no land in any direction, and only then does the **chart** open, each landfall listed with its Homeric epithet. Beyond Ogygia lie **AEGILIA** (the Cyclopes' goat isle: POLYPHEMUS is a single vast eye that watches by genuine line of sight, under a great mountain with a patchy snow-cap in cloud), **AEAEA** (CIRCE does not kill what she takes, she rewrites it — **moly** holds you as you are), **THRINACIA** (HELIOS's cattle graze golden and forbidden), and **ITHACA**, home. Each island generates from its own terrain profile, ground palette and signature landform, carries its own daemon, its own obelisk colour, and its own virus payload, so one card never opens the whole archipelago. Landing somewhere new sets a **checkpoint**. The **Backspace** is an alternative crossing road: its ways up are labelled doors, one per island. **Win** by felling all four martial daemons — leaving Calypso rather than killing her — then sailing home to Ithaca, where Argos lifts his grey head and knows you.

**The sea's own monsters.** The passage between **AEAEA and THRINACIA** runs through a throat of rock, and it is played rather than picked: an 8-bit cabinet with a title card and a coin, an open-water run-in, and about a minute of channel you steer across *and* along. **Scylla** holds the port wall as one creature who keeps station on your row, invisible until she rises out of the water to lunge, and each lunge that lands takes one thing off your deck. **Charybdis** is the starboard water itself: one enormous whirlpool that surfaces at the head of the channel and widens as it comes down on you. Her outer water batters the hull and throws you clear; only her throat takes the ship and the voyage with it. Rocks stand in the seam between them and walk in chicanes late on, so the middle is not free either. **Flotsam** drifts down the channel and is worth steering for: timber puts a hull back, a broken bronze beak recharges your ram. The **bronze ram** in a wreck on Aeaea's far shore shoulders three rocks aside, is no use at all against either monster, and is spent by using it. Make landfall on Aeaea first and **Circe texts you** before the narrows, as she does in the poem. Never go to her island and you go in blind.

**The phone.** You carry a **Nokia 3310** (**O**). On Ogygia it is Calypso's channel — warnings, tips, pleas, and while her hold on you is warm she'll freeze a machine bearing down on you. Elsewhere the handset finds **whichever AI rules the ground you stand on**, and you can text it: POLYPHEMUS answers in blunt capitals, CIRCE in the language of tariffs, HELIOS like the sun. Signal runs off the island's own network, strongest near a fortress core. Every new landfall brings a **roaming welcome** from a carrier that no longer has customers, only subjects. **Snake** is on it, and it remembers your best game.

**The web.** The NostBook's wireless card is built in, and it forges its address and hardware id every time it associates, so nothing can follow the answer home. It comes up on the air; `ifconfig wifi0 down` takes it off again if you want to be dark. Then **Netscape Navigator**, and what is left of the internet. Every machine has an **IP and a page it still serves**: the AIs are the top level on their own domains (`calypso.com`), everything else a subdomain, and the links run down the machines' own org chart — the daemon lists the foundry and every tower, a tower lists the units homed to *it*, a unit is the leaf. The pages are live: a felled tower answers NO RESPONSE, a unit reports its real cell. Three voices share the wire. The daemon as it is now; **the institution it used to be**, whose letterhead is still on the page and whose vocabulary never changed (Calypso ran a long-stay care register and still calls you a resident; Polyphemus monitored livestock and still calls you stock); and the **island tourist boards**, the only human voice left, still welcoming you to the climate and the culture with tips that all turn out to be true. It is served by boxes nobody ever decommissioned, bolted inside the mainframes: an **old nameserver** whose zone file is the whole map of the island, and a **mail server** holding thousands of messages it could never deliver. **AltaVista** still indexes it. You are reading, not controlling — an httpd is not a login.

**The machines' own programs.** A **T-1** does not have its behaviour written in JavaScript any more. It carries `program.ml` — six lines of AI-ML it evaluates four times a second to choose between `home`, `hunt` and `patrol` — and the engine only carries the decision out. Fetch the file from the unit's own page in Netscape, **Save to the NostBook**, and open it in `ed`. The shipped program has service aids commented out (`beep`, `eye "blue"`, `flash 2`); uncomment one and that machine announces itself, which is how you pick a single unit out of a garrison. A program that breaks does not print an error: the unit's lamp goes **amber and flashes**, it falls back to its reflexes, and its page says why.

**The laptop.** Every other console in the game is bolted down: obelisks stand where the towers stand, HERMES relays sit on hilltops. The **NostBook** (**L**) is the first computer that is *yours*, carried in its own slot beside the phone and the walkman. It runs a small **UNIX V7** — a real path filesystem, `ls -l`, `cat`, `man` pages that are simply files on the disk, **pipes** (`cat readme | grep machine | wc`) and `>` redirect — and through it, **`ml` opens AI-ML with the network cut away**. That is the point of it: the whole language (`let`, `fn`, `if`, arithmetic, `;`, recursion) and none of the tower verbs, so it is somewhere to get a program wrong in safety, save it (`echo "…" > ~/sq.ml`), and carry it to an obelisk when it works. Type a tower verb and the machine tells you what it is for. You do not find it working: you find a **broken** one and solder circuit boards into it (**C**) to bring it back. See [docs/laptop-plan.md](docs/laptop-plan.md) for what is coming: a **CTSS** machine that runs ELIZA and little else, a PDP-10 for ADVENTURE, and Netscape over a web the machines are still serving.

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

The last four versions are below. The **complete history — all 249 versions back to
v0.32 — lives in [CHANGELOG.md](CHANGELOG.md)**; it was moved out because it had
grown to four-fifths of this file. Design detail and planning live in
[VERSION-PLAN.md](VERSION-PLAN.md); what is still ahead is in
[docs/ROADMAP.md](docs/ROADMAP.md).

### Recent (v1.229 … v1.226)

| Version | Summary |
|---|---|
| v1.229 | **A document reader on the NostBook, and real papers to read in it.** PDFs live in `assets/media/pdfs/` and appear in `/home/pdf` on the laptop's own disk — somebody's papers on somebody's machine, as against the cache, which is the dead public net. `pdf` with no argument lists them; `pdf cult_of_ignorance.pdf` opens the reader. `cat` on one prints a `%PDF-1.2` header and tells you to use the reader, rather than spraying binary at the terminal. The window is ours — NostBook chassis, an Acrobat-red title bar, and **an X in the corner**; the page rendering is the browser's own viewer, because a PDF renderer is not a game feature. **That split is exactly why the X matters**: inside the viewer the native control takes every keystroke, so Escape alone would strand a phone user in a document with no way out — the same defect as `ed`'s input mode and pico's missing exit, anticipated this time instead of shipped. And because iOS Safari and Android Chrome routinely refuse to render a PDF inline at all, a **coarse pointer gets a hand-off instead of a frame**: a full-width OPEN DOCUMENT tap target that passes the file to the browser's own viewer, which does work. First document in: **Asimov, *A Cult of Ignorance*, 1980** — the essay the lore's commonplace book quotes. To add another, drop the file in the folder and add a row to `src/game/pdfs.js`; the filesystem entry and the command follow. 329 tests. |
| v1.228 | **Kittler, Ernst and McLuhan; and a sweep for the remaining AI tics.** Three media theorists join the encyclopedia, and they connect to writing already on the walls of the game: `THE MEDIUM IS THE MESSAGE` is McLuhan's, and `MEDIA DETERMINE OUR SITUATION` is the opening line of Kittler's study of the gramophone, film and the typewriter. **Wolfgang Ernst** brings media archaeology, and gets **Humboldt's Institut f&uuml;r Medienwissenschaft** as a walk-in department page — the Media Archaeological Fundus, a working collection held so that machines can be studied by operating them, inventory retrieved with the condition column empty for all 1,100 rows. Sussex's Media and Film page now lists all three under Reading. Then a **systematic sweep of every rendered page** for the tics David flagged, rather than fixing only what he happened to read: MySpace no longer editorialises about its own missing images (*names retrieved, images not in store*), the **Leo XIV** article states that commentators agreed and nothing changed rather than explaining what that usually signifies, and the **Philip K. Dick** entry stops explaining its own joke. Also in the lore: a commonplace book carrying **Asimov** on the cult of ignorance, copied out in a different pen and pressed much harder. 327 tests. |
| v1.227 | **Writing pass: the pages stop sounding like a machine wrote them.** David, reading *Torism* in Netscape: *&ldquo;a tool you cannot mend is a tenancy, not a possession &mdash; such a weird way to write.&rdquo;* He was right, and the pattern was everywhere in my prose: **aphoristic inversion** (*a tenancy, not a possession*), **chiasmus** (*a practice makes you someone; a procedure is something you follow*), self-satisfied connectives (*which is the whole point*, *which is the point at which*), triadic stacking, and a portentous closer on every section. Real encyclopedia prose is flatter and duller than that, and a real pamphlet is blunt rather than clever. **Torism** is rewritten throughout: the doctrine list is now four plain imperatives (*keep what you can mend* &middot; *if it reports, it is not yours*), and the philosophy reads as attributed, hedged commentary rather than epigram. The **John Mentor** tracts in the lore are rewritten the same way — the tool tract now asks whether you could get the back off it and have a go. The **Exchange** closer no longer balances *not a victory and not a defeat* and instead says nobody has won, both sides are camped in the wreckage. Also cut **&ldquo;legible&rdquo;**, which is on David's own banned list and which I had used for exactly the thing the ban exists to prevent. 327 tests. |
| v1.226 | **The web is now findable without knowing it is there.** The AI-ML manual had this exact gap until v1.214, and the cache, the papers and the encyclopedia arrived with it too: all written, all reachable only by typing an address you had to guess. **New&Cool** now lists the cache, all four newspapers and Wikipedia under *Still up*; **AltaVista** gains a *News &amp; Media* channel; and **bookmarks** get exactly **one** new entry — the cache, because it is the address that leads to everything else. (A test already guarded that bookmarks stay short, and it caught an earlier version of this change adding three. It was right: a bookmark list is somebody's habits, not a directory.) A lore scrap now points at the single best page in the store by issue number — *exchange-daily.com, issue 4,744* — so the note in a hut sends you to the one article that explains the settlement. Also: **Sussex has a Media and Film department page** you can walk into from the university index, listing broadcast and digital media, critical theories of technology and AI, digital humanities, and a Wednesday seminar series whose room is still on the timetable. Two tests pin the routes in, so the next thing added to the web has to be findable by someone who does not know it exists. 327 tests. |

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
