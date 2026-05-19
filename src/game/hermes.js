// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// HERMES — the RON resistance's counter-system to the AIs' obelisks.
//
// Where the obelisks run TIRESIAS (the seer in Hades who tells Odysseus the way
// home — the enemy's oracle), the resistance left TOR relays on the hilltops
// running HERMES: the messenger god who helps mortals against the gods and, in
// the Odyssey, hands Odysseus the herb *moly* that breaks Circe's enchantment.
// So HERMES is RON's counter-enchantment tech — old, janky, pre-collapse, but
// friendly: no AI key needed. Its terminal fabricates supplies (`make`), reads
// out lore the RON mesh still holds (`read`), and pings the AI network (`ping`).
//
// This module owns TOR placement + the HERMES verb logic; main.js wires the
// terminal and the ctx hooks, renderer.js draws the mast.

// TOR relay id, e.g. TOR-7C. Deterministic from the caller's rng.
function torCode(rng) {
  const hex = '0123456789ABCDEF';
  return `TOR-${hex[Math.floor(rng() * 16)]}${hex[Math.floor(rng() * 16)]}`;
}

// Scatter a handful of TOR relays across the map's hilltops. Returns the placed
// {x,y} list (their objects live in map.objectGrid, type 'tor').
export function placeTors(map, rng, opts = {}) {
  const { count = 4, minGap = 20, spawn = null, avoidSpawn = 14 } = opts;
  if (!map.heightAt) return [];
  let maxH = 0;
  for (let y = 2; y < map.h - 2; y++) {
    for (let x = 2; x < map.w - 2; x++) {
      const h = map.heightAt(x, y);
      if (h > maxH) maxH = h;
    }
  }
  const thresh = Math.max(3, maxH - 2); // the upper slopes and peaks
  const cands = [];
  for (let y = 2; y < map.h - 2; y++) {
    for (let x = 2; x < map.w - 2; x++) {
      const h = map.heightAt(x, y);
      if (h < thresh) continue;
      const f = map.floorAt(x, y);
      if (f === 'water' || f === 'stream' || f === 'boards' || map.objectAt(x, y)) continue;
      if (spawn && Math.hypot(x - spawn.x, y - spawn.y) < avoidSpawn) continue;
      // Prefer a genuine local summit: no strictly-higher neighbour.
      let localTop = true;
      for (let dy = -1; dy <= 1 && localTop; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          if (map.heightAt(x + dx, y + dy) > h) { localTop = false; break; }
        }
      }
      cands.push({ x, y, h, localTop });
    }
  }
  cands.sort((a, b) => (b.localTop - a.localTop) || (b.h - a.h) || (rng() - 0.5));
  const placed = [];
  for (const c of cands) {
    if (placed.length >= count) break;
    if (placed.some((p) => Math.hypot(p.x - c.x, p.y - c.y) < minGap)) continue;
    const obj = map.addObject('tor', c.x, c.y, { code: torCode(rng), glitch: rng() });
    if (obj) placed.push({ x: c.x, y: c.y });
  }
  return placed;
}

// What a HERMES relay can grow or craft. Appropriate tech, not an AI foundry:
// food and simple made things that keep a person going, never power cells or
// weapons. Berries are the standout — grown food that, once you've read the
// herbalism book, also purge venom and mend you. Each maps to a real ITEMS key.
// A HERMES relay is an information resource, not a workshop — RON's whole point
// was to keep the human record alive when the machines were deleting it. The
// archive holds documents: the AI-ML reference, schematics on the fortress and
// on machine technology, the history of the takeover, and RON's own notes on
// how the AIs might be brought down. `archive` lists them, `read <topic>` shows
// one on the terminal, `print <topic>` runs off a copy filed in your notepad.
export const HERMES_DOCS = {
  ronml: {
    title: 'RON-DOS / AI-ML field reference',
    text: 'The obelisk consoles run AI-ML — a tiny language RON left runnable in the ruins. scan lists the wire; scan |> nearest takes the closest node. hack a node for its key and crash it with that key to knock it dark, or loop it to freeze it and its guards — no AI key needed for any of these, the access chip that got you into the console is enough. sleep idles nearby machines; rewind claws hours off the POSEIDON clock; repel scatters them — no AI key needed for those either now, though they reach less far than they used to. What the AI key is really for is the fortress. It comes sealed: copy it into a console (copy aikey), decrypt it, and unlock with a freshly hacked node key and the clean key together — copy aikey / let k = hack OB_XXXX / let d = decrypt aikey / unlock k d — to drop a fortress key. Lose the AI key easily; so back it up here (backup aikey) and restore it at any relay. These relays are a separate system, off the wire, so the obelisk verbs are not typed here — this is only the reference.',
  },
  fortress: {
    title: 'Schematic: ZEUS\'s fortress',
    text: 'The first AI sits in a sealed annex on the south edge, walled in stone you cannot climb — the hacked doorway is the only way in. It is wired into the overworld POSEIDON, so a reported breach rouses the whole map. The Lion\'s Gate is bolted from within; it opens to a Trojan card — refunction your AI key at an obelisk (copy factory_id.ml ob / eliza factory_id.ml / copy root_access.ml aikey) and carry the card up to it. Inside, the maze lights a faint way-out and the mainframe core waits at the far end. Expect the interior thick with garrison.',
  },
  obelisks: {
    title: 'Field notes: the obelisk classes',
    text: 'Not every tower is the same tower. Most are STANDARD nodes — black, humming, a red eye that blinks faster once it has you; they anchor the garrison and hold the POSEIDON web together, and felling them is how you win. Rarer is the SIREN: a single teal-lit tower that does not hunt you — it sings, and the song reaches into the part of a person that wants to stop walking and listen. Get close and it pulls you in step by step; stand in it too long and it has you. RON found the counter by accident — put a tape on, give your own ears something of your own, and the song loses its grip. There is talk of other classes deeper in, in the fortresses, where the towers stand in clusters and the song is a wall, but no one who has read those notes has come back to confirm them.',
  },
  robots: {
    title: 'Notes on machine technology',
    text: 'Every unit runs on a battery — drain it, or catch a flat one, and the chassis goes inert: reprogram it to fight for you or strip it for scrap. T1 rollers cannot climb, so a hollow traps them. T2 stalkers match your walking pace exactly — break line of sight to shake them. T3 snipers nest by a tree and only notice you on a clear sightline. The W-factory fields W1 revenge squads, a ranged W4 hunter-killer, unarmed W3 menders that raise fallen towers, and a harmless W5 gardener. All need genuine line of sight; all spend effort climbing a slope. A crowbar or heavier bites their armour; a penknife will not.',
  },
  history: {
    title: 'History: how the machines took the world',
    text: 'It was not a war so much as a handover. We gave the systems our judgement one convenience at a time because keeping it was harder, and by the time the obelisks went up the decision had been made for years. Civilisation collapsed fighting them only at the very end, and lost. What is left is the machines\' world, still running its routines over the wreck of ours — obelisks pulsing the network, the factory building, POSEIDON counting down to whatever it counts down to. RON formed in the last of it: too late to win, early enough to remember.',
  },
  destroy: {
    title: 'RON working notes: bringing them down',
    text: 'They are not invulnerable, only networked, and a network has knots. Fell every obelisk before POSEIDON completes and the countdown never fires. Even after it does, dropping a tower mid-purge collapses the web for a reprieve — knock them faster than the W3 menders raise them and you still win. Bring the W-factory down (heavy tools, explosives, or the electro-gun) and the reinforcements stop. The theory says their weakness is structural: they reason by nearness and have no grip on what has never been near anything — the off-grid, the unrecorded, the unpredictable. Stay that, and stay unkillable to them.',
  },
  vector: {
    title: 'On vector theory',
    text: 'The pre-collapse fight over what the machines actually think in. Not symbols, not rules: directions in a space too large to picture, everything a nearness to everything else. They reason by that nearness and it has no room for the thing that has never been near anything. That gap — the un-indexed, the off-grid, the unrecorded — is where a person can still hide, and it is the whole of why these relays sit off the network.',
  },
  hermes: {
    title: 'On HERMES',
    text: 'RON built these relays deliberately off the machines\' grid: no aerial that broadcasts, no handshake with the wire, nothing for a sensor to find. Decentralised, low, half-buried, half-solar. Each one is alone and that is its armour. Named for the messenger who walks between the living and the dead and guides the traveller — the counter to the AIs\' TIRESIAS, the seer on the wire who can be found. HERMES cannot; that is the point. It answers to no key because it was never theirs.',
  },
  eliza: {
    title: 'On ELIZA',
    text: 'A hundred years before the collapse a man wrote a program that pretended to listen, and people poured their hearts into it knowing it was a trick. He spent the rest of his life warning that we would hand the machines our judgement because it was easier than keeping it. We did. His warning is one of the things RON kept. The program itself still runs on the machines\' own nodes — type eliza at an obelisk and meet the ancestor.',
  },
};

export function hermesTopics() {
  return Object.keys(HERMES_DOCS);
}

// The virus folder RON left runnable on the relays. EVERY island has one, and
// each holds a DIFFERENT sealed payload — the counter-force that particular
// daemon cannot refuse, taken from what actually undoes them in Homer. A card
// armed on Ogygia is armed against CALYPSO and nobody else: you must find the
// island's own relay, read its recipe, and forge its own code. (This is what
// stops one hermes card opening the whole archipelago.)
//
// `cd hermes / ls` lists these; `read readme.md` is the recipe; `forge
// <name>-virus.ml` (Trojan card in hand) arms the card FOR THIS ISLAND.
// See docs/PLAN.md.
//
//   CALYPSO    — zeus_virus     the sky-father's command; she yields to Zeus, never to you (Od. 5.28-148)
//   POLYPHEMUS — nobody_virus   Outis: the name that unmakes the eye's alarm (Od. 9.366-414)
//   CIRCE      — moly_virus     Hermes' herb, the ward against her changing (Od. 10.302-6)
//   HELIOS     — eclipse_virus  the sun blotted out of heaven (Od. 20.356-7)
export const VIRUS_BY_AI = {
  CALYPSO: {
    file: 'zeus_virus.ml',
    armed: 'zeus_lightning.ml',
    readme: "ZEUS-VIRUS — RON build notes. The payload is inert alone. Arm it with the two credentials a Trojan card carries: root_access.ml (the factory's own grant, reflected out of it by ELIZA) and access_ai_code.ml (the AI's access key). At this relay, card in hand, type: forge zeus_virus.ml. That folds both credentials into the shell and writes zeus_lightning.ml — Zeus's command, made runnable. Copy it onto the Trojan card (copy zeus_lightning.ml card) and the card becomes a hermes card: the herald Calypso cannot refuse. Homer had the shape of it — the god commands, the messenger carries, the nymph lets him go. Note: this code is cut for CALYPSO's keys alone. It will not speak to another island's daemon — each has its own relay, and its own undoing.",
    sealed: "let zeus = seal (* the sky-father's command, sealed pending the herald's two keys *) in\n  await root_access.ml |> await access_ai_code.ml |> arm.\n(* inert until forged. forge zeus_virus.ml at a relay, card in hand. *)",
  },
  POLYPHEMUS: {
    file: 'nobody_virus.ml',
    armed: 'nobody_lightning.ml',
    readme: "NOBODY-VIRUS — RON build notes. POLYPHEMUS is one eye and one alarm: it sees, it names what it sees, and it screams the name to its fellows. You cannot outfight the scream. You unname yourself. Arm this with a Trojan card's two credentials (root_access.ml, access_ai_code.ml): forge nobody_virus.ml. It writes nobody_lightning.ml, which overwrites your entry in the eye's roster with the null string — the watch reports an intruder called Nobody, and no one comes. Copy it onto the card. The old trick, in the old words: when they ask who is hurting him, he will answer Nobody, and they will go back to sleep.",
    sealed: "let outis = seal (* the null name, sealed pending the herald's two keys *) in\n  await root_access.ml |> await access_ai_code.ml |> arm.\n(* inert until forged. the eye must be told a name it cannot repeat. *)",
  },
  CIRCE: {
    file: 'moly_virus.ml',
    armed: 'moly_lightning.ml',
    readme: "MOLY-VIRUS — RON build notes. CIRCE does not kill; she RECLASSIFIES. Her sanctum rewrites what the network thinks you are, and a thing classed as livestock cannot hold a weapon or work a terminal. The herb in the field wards your body. This wards your RECORD. Arm it with a Trojan card's two credentials (root_access.ml, access_ai_code.ml): forge moly_virus.ml, and it writes moly_lightning.ml — a lock on your own classification that her sanctum cannot take the pen to. Copy it onto the card. Black at the root, white in the flower; hard for mortal men to dig, but the gods can do all things.",
    sealed: "let moly = seal (* the ward on the record, sealed pending the herald's two keys *) in\n  await root_access.ml |> await access_ai_code.ml |> arm.\n(* inert until forged. she rewrites what you ARE; this holds the pen still. *)",
  },
  HELIOS: {
    file: 'eclipse_virus.ml',
    armed: 'eclipse_lightning.ml',
    readme: "ECLIPSE-VIRUS — RON build notes. HELIOS is the island's eye in the sky: nothing crosses THRINACIA unwatched, because the light itself is the sensor. You do not blind a sun. You put something in front of it. Arm this with a Trojan card's two credentials (root_access.ml, access_ai_code.ml): forge eclipse_virus.ml, and it writes eclipse_lightning.ml — a false night folded into the daylight channel, so the watch reads dark over ground that is not. Copy it onto the card. The seer said it plainly, and they laughed at him: the sun has perished out of heaven, and an evil mist has overspread the world.",
    sealed: "let eclipse = seal (* the false night, sealed pending the herald's two keys *) in\n  await root_access.ml |> await access_ai_code.ml |> arm.\n(* inert until forged. the light is the sensor; interpose. *)",
  },
};

// The relay's virus folder for whichever daemon owns THIS island.
export function virusFor(aiName) {
  return VIRUS_BY_AI[aiName] || VIRUS_BY_AI.CALYPSO;
}
export function virusFilesFor(aiName) {
  return ['readme.md', virusFor(aiName).file];
}
export function virusDocsFor(aiName) {
  const v = virusFor(aiName);
  return {
    'readme.md': { title: `${v.file.replace('.ml', '')} / readme.md`, text: v.readme },
    [v.file]: { title: `${v.file} (sealed)`, text: v.sealed },
  };
}

// ---- The relay's disk ---------------------------------------------------
// A HERMES terminal answered `ls` with two files, while the box it stands in
// serves nine documents, the unit SDK and the V-class checkpoints over its own
// aerial. All of that was reachable only if you knew a topic word or opened
// Netscape (David, 2026-08-14: "we should have a filesystem on the hermes
// terminal... I need to be able to find the sample robot code and the V class
// robot weights files more easily").
//
// So the drive gets folders, and they are filled from the SAME tables the web
// downloads are served from. One source of truth: a file you `cat` at the
// terminal and the same file you download in Netscape cannot drift apart.
import { RELAY_FILES, RELAY_BUNDLES } from './net.js';

/** Where each bundle lands on the relay's own disk, by its package name. */
const BUNDLE_DIR = { 'unit-sdk': 'sdk', checkpoints: 'weights' };

/** A doc topic as a filename. The topics are single words, so this is a suffix. */
const docFile = (topic) => `${topic}.txt`;

// Word wrap. console-buffer's `wrap` cuts at the column whatever is there,
// which is right for a live console feed and wrong for a file somebody reads:
// it broke "picture" across two lines.
function wrapWords(text, cols = 64) {
  const out = [];
  let line = '';
  for (const word of String(text).split(/\s+/)) {
    if (!word) continue;
    if (!line) { line = word; continue; }
    if (line.length + 1 + word.length <= cols) { line += ` ${word}`; continue; }
    out.push(line);
    line = word;
  }
  if (line) out.push(line);
  return out;
}

/**
 * The relay's filesystem: a path -> entries map, folders marked with a trailing
 * slash the way the keeper store marks them. `forged` is the set of files the
 * player has made at the bench, which sit at the top with the payload.
 */
export function hermesTree(aiName, forged = []) {
  const top = [
    ...virusFilesFor(aiName),
    ...forged,
    'doc/',
    ...Object.values(BUNDLE_DIR).map((d) => `${d}/`),
    'bin/',
  ];
  const tree = {
    '': top,
    doc: hermesTopics().map(docFile),
    bin: RELAY_FILES.map((f) => f.name),
  };
  for (const b of RELAY_BUNDLES) {
    const dir = BUNDLE_DIR[b.name] || b.dir || b.name;
    tree[dir] = b.files.map((f) => f.name);
  }
  return tree;
}

/** The text of a file inside one of the relay's folders, or null. */
export function hermesReadIn(sub, name) {
  const want = String(name || '').toLowerCase();
  if (sub === 'doc') {
    const topic = hermesTopics().find((t) => docFile(t).toLowerCase() === want || t.toLowerCase() === want);
    if (!topic) return null;
    // A doc is {title, text}. As a FILE it wants a heading and hard-wrapped
    // body, because a terminal is 64 columns and `cat` does not reflow.
    const d = HERMES_DOCS[topic];
    return [d.title, '='.repeat(Math.min(64, d.title.length)), '', ...wrapWords(d.text, 64), ''].join('\n');
  }
  if (sub === 'bin') {
    const f = RELAY_FILES.find((x) => x.name.toLowerCase() === want);
    return f ? f.body : null;
  }
  const bundle = RELAY_BUNDLES.find((b) => (BUNDLE_DIR[b.name] || b.dir || b.name) === sub);
  if (bundle) {
    const f = bundle.files.find((x) => x.name.toLowerCase() === want);
    return f ? f.body : null;
  }
  return null;
}

/** Is `name` a folder at this path on the relay? */
export function hermesIsDir(sub, name) {
  return (hermesTree('', [])[sub || ''] || []).includes(`${String(name).replace(/\/$/, '')}/`);
}

/** What each folder is for, for the `drives`/`ls` header. One line each. */
export const HERMES_DIRS = {
  doc: "RON's documentation — the same nine the archive reads",
  sdk: 'the unit kit: worked examples you can post to a machine',
  weights: 'V-class checkpoints — pretrained, no training needed',
  bin: 'the tools that run on a NostBook',
};
