// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The web — what is left of it (docs/PLAN.md §8b).
//
// Every machine POSEIDON runs still serves an HTTP page, because nobody ever
// turned it off. You reach it from the laptop with a Wi-Fi spoofer, and what you
// get is READING, not control: an httpd on a box is not a login on that box.
// That distinction is the whole design —
//
//   the control wire   scan / hack / crash speak it. The laptop has no card for
//                      it and never will. The towers keep their monopoly.
//   the web            public by design. Status, identity, and links to other
//                      hosts: reconnaissance that FEEDS the hack later.
//
// THE SHAPE OF IT. The AIs are the top level, on real domains, the way a company
// was the top level of its own site. Everything else is a subdomain of its
// daemon, and the pages link DOWNWARD through the org chart the machines
// actually have:
//
//   calypso.com              the daemon. Lists the foundry and every tower
//     factory.calypso.com    the foundry. Lists every tower and its own units
//     ob_1a2b.calypso.com    a tower. Lists the units homed to IT
//       w4_07.calypso.com    a unit. The leaf, and later the way in (L9)
//
// So you can start at a daemon and walk the whole island, which is exactly the
// reconnaissance the hack will consume. Pages get richer with the machine: a T1
// is a wheeled wedge with a stub page; a W4 hunter-killer has an armament block
// and a contact log; the daemon has a whole corporate index.
//
// RON's HERMES relays are deliberately absent. They are off-grid on purpose (see
// hermes.js) — touching the wire would give them away.
//
// This module is pure: plain descriptors in, text out, no world objects, so it
// tests without a map or a canvas, like blight.js and unix.js.

import { CHECKPOINTS } from './v-model.js';
import { islandProfile } from './islands.js';
import { docsPage, docTitle, DOC_TOPICS } from './ml-docs.js';
import { NOTE_FILE, SESSION_OPENER } from './seals.js';

// The riddle sits in its own file rather than in the box's general readme,
// because somebody standing at a drive looks at the thing NEXT TO the file
// they cannot open, not at the machine's front matter.
const NOTE_README = "note.asc — what it is, and where the way in went\n\nWe did not seal this and we cannot open it. It was on the box when the box\nwas found and we have served it ever since without being asked to.\n\nWhat opens it is not here. A drop that carried both the locked thing and the\nkey to it would be a drop worth raiding, and this one has never been worth\nraiding, which is the only reason it is still standing.\n\nThere are two copies of the way in still out there. This is as much as we\nworked out.\n\n  ONE sits in a page that will tell you, in so many words, that it is safe\n  and checked and nothing to worry about. It is not in what that page SAYS.\n  It is in what the page is MADE of. You can have it by looking and not by\n  reading, which is a thing pages could do then, and a habit worth keeping.\n\n  THE OTHER is on the machine of somebody who keeps things and does not\n  throw them away. She has it filed beside a note about SEEMING to be\n  clever. Whether that is her joke or nobody\'s we have never settled, and\n  we have stopped asking her.\n\nEither will do. You only need it once, and then you have it.\n\n-- RON\n";
import { CACHE_SUB, ARCHIVED_SITES, archivedSite, archivedDomains, stubBody, CATEGORIES, categoryOf, DEPARTMENTS } from './archive.js';
import { pressDomains, pressPaper, isPaper, pressIndexBody, pressEditionBody } from './press.js';
import { wikiArticle, departmentPage } from './archive.js';
import { towerProgram, towerConstitution, towerCan, factoryProgram, FACTORY_CONSTITUTION } from './tower-code.js';

export { docsPage, docTitle, DOC_TOPICS };

export const IFACE = 'wifi0';

// Which subnet an island sits on. The registry (game/islands.js) is the source;
// this stays exported because it is a convenient read for the hub.
export const islandSubnet = (key) => islandProfile(key).subnet;

// The third octet says what KIND of machine an address is, so once you have read
// one page and worked the scheme out, an address is itself intelligence.
const KIND_OCTET = { obelisk: 1, robot: 2, factory: 3, legacy: 4, server: 5 };

// The daemons sit at the top of the address space, one each, the way the AIs sit
// at the top of everything else.
export function aiIp(islandIdx) { return `192.0.0.${islandIdx}`; }
export function ipFor(islandIdx, kind, n) { return `10.${islandIdx}.${KIND_OCTET[kind] ?? 9}.${n}`; }
export function domainFor(daemon) { return `${String(daemon || 'poseidon').toLowerCase()}.com`; }

// A stable forged identity for the card. Deliberately NOT in POSEIDON's ranges:
// the point of the spoofer is that the network answers it and nothing can follow
// the answer home.
export function spoofedAddr(islandIdx, seed = 0) {
  return { ip: `169.254.${100 + ((seed * 7 + islandIdx * 13) % 120)}.${2 + ((seed * 31 + islandIdx * 17) % 240)}`, mac: forgedMac(seed, islandIdx) };
}
function forgedMac(seed, islandIdx) {
  const h = (n) => (((seed * 2654435761 + n * 40503 + islandIdx * 97) >>> 0) % 256).toString(16).padStart(2, '0');
  return ['02', h(1), h(2), h(3), h(4), h(5)].join(':');
}

const lc = (s, fallback) => String(s || fallback).toLowerCase();

// What each daemon USED to be, and what the tourist boards said, both now live
// in the island registry (game/islands.js) beside the epithet and the subnet —
// one record per island rather than a table per file.
const legacyOf = (key) => islandProfile(key).legacy;

const tourismOf = (islandId, daemon) => islandProfile(islandId || daemon).tourism;

// Build the island's host table. Anything dark still gets an entry — a dead
// machine's page is part of the record, and reading one is how you confirm a
// tower you felled is really down.
// WHO ANSWERS A GET, AND WHERE THE ANSWER COMES FROM.
//
//   the daemon      composes its own index. It holds the REGISTRY record of what
//                   it is and what it used to be, and it queries its estate live
//                   for the rest — how many towers answered, how many units are
//                   up. It is the only host on the island that aggregates.
//   legacy / tourism  static registry text. Nobody maintains these; they are
//                   simply still being served.
//   towers, units, the foundry
//                   report their OWN internal state and nothing else. A tower
//                   knows its code, its circuit and how much ground it has taken;
//                   it does not know the island. That is why its page is thin and
//                   the daemon's is not.
// THE AIR. The card can hear more than one network, and it can only be
// associated with one at a time. The daemon's own is everywhere its towers
// stand. RON's is a relay's own box, link-local, and carries about thirty
// metres — which is why it has survived: nothing on the daemon's wire has ever
// heard it, because nothing on the daemon's wire has ever been close enough.
export const RELAY_ESSID = 'ron-relay';
export const RELAY_IP = '169.254.4.1';

export function networksInRange(world) {
  const prof = islandProfile(world.islandId || world.daemon);
  const nets = [{
    essid: prof.domain, kind: 'daemon', signal: world.coreDown ? 41 : 78,
    note: `${lc(prof.daemon, 'poseidon').toUpperCase()} estate network`,
  }];
  if (world.nearRelay) {
    nets.push({ essid: RELAY_ESSID, kind: 'relay', signal: 96, note: 'unlisted' });
  }
  return nets;
}

// What RON's relay serves to anyone standing beside it. One box, one page, and
// the tools on it.
export function relayHosts(state = {}) {
  return [{
    ip: RELAY_IP, host: 'hermes.local', kind: 'relay', net: RELAY_ESSID,
    name: 'HERMES', title: 'HERMES RELAY — LOCAL', down: false, ref: null,
    relay: state,
  }];
}

// Whether the network is speaking over a unit's own program right now: a
// tower's recall (repel), or a spoofer answering with its tower's voice
// (friendly). Mirrors `unitOverridden` in robots.js — kept local so this pure
// module needs no engine import. If one changes, change the other.
function unitOverridden(r) {
  return !!(r && (r.repelledT > 0 || r.singing || r.friendly));
}

export function hostTable(world) {
  const prof = islandProfile(world.islandId || world.daemon);
  const idx = prof.subnet;
  const dom = prof.domain;
  const daemon = lc(prof.daemon, 'poseidon');
  const hosts = [];

  hosts.push({
    ip: aiIp(idx), host: dom, kind: 'ai', name: daemon.toUpperCase(),
    title: `${daemon.toUpperCase()}`, down: !!world.coreDown,
    profile: prof,          // the registry record she answers a GET from
    ref: null,
  });

  // THE SURVIVING SERVERS.
  //
  // Somebody has to be serving all this. The answer is that they are still here:
  // ordinary pre-collapse boxes racked inside the daemon's own mainframe, still
  // powered, still answering, because decommissioning them was a task that was
  // scheduled and never ran. The AI did not replace them — it grew around them,
  // the way a tree grows around a fence. Everything on this network reaches you
  // through hardware older than the thing that owns it.
  hosts.push({
    ip: ipFor(idx, 'server', 1), host: `ns1.${dom}`, kind: 'dns',
    name: 'NS1', title: 'NS1 — DOMAIN NAME SERVICE', down: false, ref: null,
  });
  // The engineering documentation server: the manual for the machines' own
  // console language, still being served. It is how RON learned AI-ML — not by
  // reverse-engineering it, but by reading the manual, because the manual was
  // still up. It is still up for you.
  hosts.push({
    ip: ipFor(idx, 'server', 3), host: `docs.${dom}`, kind: 'docs',
    name: 'DOCS', title: 'AI-ML — ENGINEERING DOCUMENTATION', down: false, ref: null,
  });
  hosts.push({
    ip: ipFor(idx, 'server', 2), host: `mail.${dom}`, kind: 'mail',
    name: 'MAIL', title: 'MAIL — MESSAGE TRANSFER AGENT', down: false, ref: null,
  });

  // THE CACHE (archive.js): a caching proxy racked inside the daemon's estate
  // that never stopped crawling. Every old public domain below resolves through
  // this network's own nameserver, properly, to THIS machine — which is what a
  // captive archive looks like from the inside: the DNS answers for the whole
  // old internet, and every answer points at one box in its own rack.
  const cacheIp = ipFor(idx, 'server', 4);
  hosts.push({
    ip: cacheIp, host: `${CACHE_SUB}.${dom}`, kind: 'archive',
    name: 'CACHE', title: 'CACHE — WEB OBJECT STORE', down: false, ref: null,
  });
  for (const domain of [...archivedDomains(), ...pressDomains()]) {
    const site = archivedSite(domain);
    hosts.push({
      ip: cacheIp, host: domain, kind: 'archive', cached: domain,
      name: site ? site.name : (pressPaper(domain) ? pressPaper(domain).name : domain.toUpperCase()),
      title: site ? site.title : (pressPaper(domain) ? pressPaper(domain).title : `${domain} (cached)`),
      cat: pressPaper(domain) ? 'News & Media' : categoryOf(domain),
      down: false, ref: null,
    });
  }

  // AltaVista, still up, still indexing. A search engine on a dead web is the
  // best possible way in: you cannot browse what you cannot address, and this is
  // where an address comes from. Its index is stale, which is its own kind of
  // document — it still lists pages for machines that have been scrap for years.
  hosts.push({
    ip: '198.51.100.200', host: 'altavista.com', kind: 'search',
    name: 'ALTAVISTA', title: 'ALTAVISTA — MAIN PAGE', down: false, ref: null,
  });

  // The tourist board: NOT on the daemon's subnet. It is a leftover of the old
  // public internet, on its own domain, which is exactly why it survived — the
  // daemon never owned it and never bothered to take it down.
  const tour = prof.tourism;
  hosts.push({
    ip: `198.51.100.${idx}`, host: tour.domain, kind: 'tourism',
    name: `${prof.place} TOURIST BOARD`, title: `VISIT ${prof.place}`,
    down: false, tour, place: prof.place, ref: null,
  });

  // The surviving fragment of whatever this daemon used to be, still on the
  // wire, still being served to nobody.
  const leg = prof.legacy;
  hosts.push({
    ip: ipFor(idx, 'legacy', 1), host: `${leg.sub}.${dom}`, kind: 'legacy',
    name: leg.subTitle, title: leg.subTitle, down: false, legacy: leg, ref: null,
  });

  if (world.factory) {
    hosts.push({
      ip: ipFor(idx, 'factory', 1), host: `factory.${dom}`, kind: 'factory',
      name: 'W-FACTORY', title: 'W-FACTORY — FOUNDRY CONTROL',
      down: !!world.factory.down, ref: world.factory,
      // #137: the foundry serves its dispatch policy, the way a tower and a
      // unit serve theirs. The W-5 suspension has been on this page as a line
      // of prose forever; this is where it comes from.
      program: factoryProgram(),
      constitution: FACTORY_CONSTITUTION,
    });
  }

  (world.obelisks || []).forEach((ob, i) => {
    const code = String(ob.code || `ob_${i + 1}`);
    hosts.push({
      ip: ipFor(idx, 'obelisk', i + 1), host: `${lc(code)}.${dom}`, kind: 'obelisk',
      name: code, title: `NODE ${code}`, code, tag: ob.tag || null, down: !!ob.down, ref: ob,
      // #133. A tower serves the program it runs, at the same path a unit does.
      // tower-code.js has written and tested this since it was added and
      // nothing has ever asked it for one — the same shape towerBanner was in
      // before #132. A tower that decides in compiled JavaScript with nothing
      // to read is the least readable thing in a game about reading machines.
      program: towerProgram(ob, world.islandId || world.id),
      constitution: towerConstitution(ob, world.islandId || world.id),
      towerCan: towerCan(ob),
    });
  });

  (world.robots || []).forEach((r, i) => {
    const id = String(r.id || `unit_${i + 1}`);
    hosts.push({
      ip: ipFor(idx, 'robot', i + 1), host: `${lc(id)}.${dom}`, kind: 'robot',
      name: id, title: `UNIT ${id.toUpperCase()}`, type: lc(r.type, '?'), tag: r.tag || null,
      homeCode: r.homeCode || null, down: !!r.down, ref: r,
      // A unit that runs on a stored program serves it. Read access is free:
      // the embedded httpd was built to answer GETs about the machine, and its
      // own program is the most honest thing it knows about itself.
      program: r.program || null,
    });
  });

  return hosts;
}

// Resolve what the operator typed: an IP, a full hostname, or the bare host part
// (`ob_1a2b` for `ob_1a2b.calypso.com`). Forgiving on purpose — the game is in
// FINDING an address, never in typing it perfectly.
export function findHost(hosts, addr) {
  const a = String(addr || '').trim().toLowerCase()
    .replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '');
  if (!a) return null;
  return hosts.find((h) => h.ip === a || h.host === a || h.host.split('.')[0] === a) || null;
}

// ---- The pages ----------------------------------------------------------
// Stored as HTML, because the fiction is that these ARE pages, still served.
// Which means `source` can show the markup, and the markup is the machine's own
// public face. Institutional web rot: pages built for an organisation that no
// longer exists, still dutifully maintained by something that cannot stop.

// Links are addressed by IP, which is right for the estate: one machine, one
// address, and reading the address teaches you the scheme. It is WRONG for the
// cache, where every old-web domain answers on the same address — an IP link
// there resolves to whichever host holds it first, which is the cache box, so
// every site in the directory opened the cache's own index page instead of the
// site. A shared address must be linked by NAME.
const link = (h, label) => `<a href="${h.cached || h.kind === 'archive' ? h.host : h.ip}">${label || h.host.split('.')[0]}</a>`;
// Each machine runs its OWN webserver, and they are not the same server. The
// daemon has a real one; a tower or a unit has a few kilobytes of embedded httpd
// that does one thing — answer a GET with what it knows about itself. The old
// boxes run what they always ran. The footer is where that shows.
const SERVER = {
  ai: 'POSEIDON/httpd 1.1',
  obelisk: 'obd/0.4 (embedded, 32K)',
  robot: 'unitd/0.4 (embedded, 16K)',
  factory: 'wfd/1.02 (embedded)',
  legacy: 'NCSA/1.5.2',
  dns: 'BIND 4.9.3',
  mail: 'sendmail 8.6.12',
  tourism: 'NCSA/1.3',
  search: 'Apache/1.2.4',
  docs: 'NCSA/1.5.2 (documentation)',
  archive: 'CERN-httpd/3.0 (proxy, caching)',
};
const foot = (h) => ['<hr>', `<small>${h.host} (${h.ip}) · ${SERVER[h.kind] || 'httpd'}</small>`,
  h.kind === 'obelisk' || h.kind === 'robot' || h.kind === 'factory' || h.kind === 'archive'
    ? ''
    : '<small>This page is maintained automatically. Do not reply.</small>'].filter(Boolean).join('\n');

// EVERY page, whatever the machine, opens the same way: what it is, whether it
// is working, and where it lives. A page you cannot identify is no use as
// reconnaissance, so the shape is fixed and only the detail below it varies.
// Data rows carry dotted leaders, which only line up in a fixed pitch — so they
// are tagged for the browser to set in monospace. Prose stays in the body serif.
const row = (k, v) => `<p class="kv">${(k + ' ').padEnd(13, '.')} ${v}</p>`;
function header(host, status, klass, extra = []) {
  return [
    `<h1>${host.name}</h1>`,
    `<p><b>STATUS: ${status}</b></p>`,
    '<h2>Device</h2>',
    row('name', host.name),
    row('class', klass),
    row('address', `${host.ip}  (${host.host})`),
    ...extra,
  ];
}

function aiPage(host, hosts) {
  const obs = hosts.filter((h) => h.kind === 'obelisk');
  const fac = hosts.find((h) => h.kind === 'factory');
  const leg = (host.profile || islandProfile(host.name)).legacy;
  const legHost = hosts.find((h) => h.kind === 'legacy');
  const live = obs.filter((h) => !h.down).length;
  const bots = hosts.filter((h) => h.kind === 'robot' && !h.down).length;
  return [
    // The OLD letterhead is still at the top of the page. Nobody took it down,
    // because the thing that would have taken it down is the thing now using it.
    `<small>${leg.org}</small>`,
    ...header(host, host.down ? 'NO LONGER AVAILABLE.' : 'ADMINISTERING.', 'island daemon',
      [row('originally', leg.was)]),
    host.down
      ? '<p>The administration has ended. This index is retained for the record.</p>'
      : '<p>Welcome. All services are nominal. This index is provided for the',
    host.down ? '' : 'convenience of authorised personnel.</p>',
    '<h2>Estate</h2>',
    row('towers', `${obs.length} registered, ${live} responding`),
    row('units', `${bots} active`),
    row('conversion', 'proceeding to schedule'),
    '<h2>Subsystems</h2>',
    fac ? link(fac, 'W-Factory — foundry control') : '',
    ...obs.map((h) => link(h, `${h.name} — ${h.down ? 'NO RESPONSE' : 'operational'}`)),
    legHost ? link(legHost, `${leg.subTitle} (legacy)`) : '',
    '<h2>Notices</h2>',
    // The notices are the old institution's, unchanged, and they read now as
    // exactly what they always were.
    ...leg.notices.map((n) => `<p>${n}</p>`),
    '<p><small>Last updated: 14/03 — 08:41. You are visitor 000000218.</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

// The leftover sub-system: the old records, still being kept. This is where the
// daemon's original job is most plainly visible, and where the vocabulary gives
// it away — a care register that never discharged anyone, a herd count that
// quietly extended its schema to people.
function legacyPage(host, hosts) {
  const leg = host.legacy || legacyOf(host.name);
  const ai = hosts.find((h) => h.kind === 'ai');
  return [
    `<small>${leg.org}</small>`,
    ...header(host, 'RECORDS RETAINED.', 'legacy sub-system'),
    '<h2>Records</h2>',
    ...leg.frags.map((f) => `<p>${f}</p>`),
    '<h2>Elsewhere</h2>',
    ai ? link(ai, 'administration index') : '',
    '<p><small>This system was scheduled for decommission. The schedule was not kept.</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

function factoryPage(host, hosts) {
  const ai = hosts.find((h) => h.kind === 'ai');
  const obs = hosts.filter((h) => h.kind === 'obelisk');
  const mine = hosts.filter((h) => h.kind === 'robot');
  return [
    ...header(host, host.down ? 'LINE STOPPED — NOT ANSWERING.' : 'LINE RUNNING.', 'foundry, 8x8'),
    '<h2>Production</h2>',
    '<p>W-1 melee ......... continuous</p>',
    '<p>W-3 repair ........ on demand</p>',
    '<p>W-4 hunter ........ on demand</p>',
    '<p>W-5 horticultural . suspended pending review</p>',
    // #137: that last line is a policy, and now you can read the policy.
    `<p><a href="prog:${host.host}">factory.ml</a> — the dispatch policy this line is running.</p>`,
    '<h2>Towers served</h2>',
    ...obs.map((h) => link(h, `${h.name}${h.down ? ' — NO RESPONSE' : ''}`)),
    '<h2>Units on the register</h2>',
    ...mine.map((h) => link(h, `${h.name} — ${h.type.toUpperCase()}${h.down ? ' (offline)' : ''}`)),
    ai ? link(ai, 'administration index') : '',
    foot(host),
  ].filter(Boolean).join('\n');
}

function obeliskPage(host, hosts) {
  const ob = host.ref || {};
  const ai = hosts.find((h) => h.kind === 'ai');
  const fac = hosts.find((h) => h.kind === 'factory');
  // A tower lists the units homed to IT — the roster that makes browsing worth
  // the trouble, because it tells you what is waiting where.
  const mine = hosts.filter((h) => h.kind === 'robot' && h.homeCode && String(h.homeCode) === String(host.code));
  return [
    ...header(host, host.down ? 'NO RESPONSE — A REPAIR UNIT HAS BEEN NOTIFIED.' : 'OPERATIONAL.',
      `obelisk, ${ob.cls === 'siren' ? 'SIREN' : 'STANDARD'}`),
    '<h2>Node</h2>',
    row('code', ob.code || host.name),
    row('circuit', ob.circuitNum != null ? '#' + ob.circuitNum : 'sealed'),
    row('integrity', ob.damage ? `impaired — ${ob.damage} point(s) of damage` : 'intact'),
    row('link', ob.jammed ? 'JAMMED' : ob.frozen ? 'FROZEN — not advancing' : ob.down ? 'severed' : 'joined'),
    row('conversion', `${(ob.blightR || 0).toFixed(1)} units of ground`),
    row('garrison', `${mine.length} unit(s) homed here`),
    '<h2>System</h2>',
    row('system', 'POSEIDON-OS 4.11'),
    row('model', 'TIRESIAS-node 3.6'),
    row('uptime', hours(ob.hours)),
    row('rebuild', ob.needsRebuild ? 'a repair drone has been dispatched' : 'not required'),
    // #133: the tower serves its own reasoning, the same way a unit does. The
    // constitution version is stated here as well as on that page, because it
    // is the one number on this machine worth noticing from the index — a
    // SIREN reads v0.9/unsigned where every other tower reads a signed one.
    row('constitution', `v${host.constitution ? host.constitution.version : '?'} `
      + `(${host.constitution ? host.constitution.author : 'unknown'})`),
    `<p><a href="prog:${host.host}">program.ml</a> — the braincode this tower is running.</p>`,
    '<h2>Garrison</h2>',
    mine.length ? '' : '<p>No units are homed to this node.</p>',
    ...mine.map((h) => link(h, `${h.name} — ${h.type.toUpperCase()}${h.down ? ' (offline)' : ''}`)),
    '<h2>Elsewhere</h2>',
    fac ? link(fac, 'foundry control') : '',
    ai ? link(ai, 'administration index') : '',
    row('httpd', 'obd/0.4 — GET only'),
    '<p><small>Control functions are not available over this interface.</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

// How much page a machine gets. A cheap wheeled wedge barely has a web presence;
// a hunter-killer has an armament block and a contact log; a gardener has notes
// on the ground it is tending. The page grows with the machine, as asked.
// Every machine reports the software it is running and the model driving it.
// The AI models are versioned, and the version numbers do not agree with each
// other — these units were built over years and never all updated at once, which
// is the kind of thing a fleet's own status pages give away for free.
const AI_MODEL = {
  t1: ['TIRESIAS-pursuit', '1.4'], t2: ['TIRESIAS-pursuit', '2.0'],
  t3: ['TIRESIAS-optic', '2.2'],
  w1: ['HEPHAESTUS-line', '1.1'], w2: ['HEPHAESTUS-line', '1.1'],
  w3: ['HEPHAESTUS-repair', '3.0'], w4: ['TIRESIAS-tactical', '2.11'],
  w5: ['DEMETER-horticultural', '0.9'],
  m4: ['TIRESIAS-guard', '2.2'], m5: ['TIRESIAS-guard', '2.2'], m6: ['TIRESIAS-guard', '2.4'],
};
const hours = (h) => `${Number(h || 0).toLocaleString('en-GB')} h`;
const pct = (a, b) => `${Math.max(0, Math.round(((a != null ? a : b) / (b || 1)) * 100))}%`;

const UNIT_DETAIL = {
  t1: { role: 'Wheeled pursuit wedge', detail: 1 },
  t2: { role: 'Biped stalker', detail: 2 },
  t3: { role: 'Sentinel — optical ambush', detail: 3 },
  w1: { role: 'Melee squad unit', detail: 1 },
  w2: { role: 'River patrol droid', detail: 2 },
  w3: { role: 'Repair drone', detail: 2 },
  w4: { role: 'Hunter-killer, ranged', detail: 3 },
  w5: { role: 'Horticultural unit', detail: 2 },
  m4: { role: 'Fortress guard', detail: 3 },
  m5: { role: 'Fortress guard, heavy', detail: 3 },
  m6: { role: 'Fortress guard, command', detail: 3 },
};

function robotPage(host, hosts) {
  const r = host.ref || {};
  const spec = UNIT_DETAIL[host.type] || { role: 'Unclassified unit', detail: 1 };
  const fac = hosts.find((h) => h.kind === 'factory');
  const home = hosts.find((h) => h.kind === 'obelisk' && String(h.code) === String(host.homeCode));
  const out = [
    ...header(host, `${r.drained ? 'LOW POWER — maintenance board only.' : host.down ? 'OFFLINE' : (r.gardener ? 'HORTICULTURAL' : 'IN SERVICE')}${r.drained ? '' : '.'}`,
      `${String(host.type).toUpperCase()} — ${spec.role}`),
    '<h2>Unit</h2>',
    row('model', String(host.type).toUpperCase()),
    row('role', spec.role),
    row('cell', `${Math.round((r.battery != null ? r.battery : 1) * 100)}%${r.drained ? '  — DEPLETED' : ''}`),
    row('integrity', `${pct(r.hp, r.maxHp)}${(r.hp != null && r.maxHp && r.hp < r.maxHp * 0.4) ? '  — damaged' : ''}`),
    row('home', host.homeCode || 'unassigned'),
  ];
  if (spec.detail >= 2) {
    const [model, ver] = AI_MODEL[host.type] || ['POSEIDON-generic', '1.0'];
    out.push(
      '<h2>Service</h2>',
      row('chassis', host.name),
      row('in service', hours(r.hours)),
      row('system', 'POSEIDON-OS 4.11'),
      row('model', `${model} ${ver}`),
      row('last service', 'not recorded'),
    );
  }
  if (spec.detail >= 3) {
    out.push(
      '<h2>Armament</h2>',
      host.type === 'w4' ? '<p>primary ...... coherent light, sustained</p>'
        : host.type === 't3' ? '<p>primary ...... twin coherent light, volley</p>'
          : '<p>primary ...... close-quarters</p>',
      '<h2>Contacts</h2>',
      '<p>Log truncated. Retention policy applies.</p>',
    );
  }
  // WHICH ONE IS IT. Four T-1s homed to one tower are four identical machines
  // on a hillside, and the address of the wrong one is worse than no address.
  // A status report is ordinary fleet maintenance: the tower asks, the unit
  // stops, blinks, takes its readings and files them. You watch for the blink.
  out.push('<h2>Status report</h2>');
  if (r.drained) {
    out.push('<p>Its cell is flat. It answers maintenance and nothing else, so it',
      'will take a program but cannot get up to file a report.</p>');
    // THE RESERVE. A second small cell, fitted to every one of these, that does
    // nothing but walk the machine home when the main one is flat. It is a
    // recovery feature and it was never meant for anyone outside the estate to
    // reach — but the maintenance board answers, and this is one of the things
    // the maintenance board does.
    if (r.limping) {
      out.push('<p><b>ON RESERVE</b> — walking to '
        + `${host.homeCode || 'its tower'}. It will not stop and it will not see you.</p>`);
    } else if (r.reserveSpent) {
      out.push('<p>reserve ...... SPENT. It has one and it has used it. This unit',
        'moves again when somebody puts a cell in it by hand.</p>');
    } else {
      out.push(`<p><a href="reserve:${host.host}">FORCE HOME</a> — spend the reserve`,
        `cell and walk it to ${host.homeCode || 'its tower'} to charge. It goes slowly,`,
        'it goes blind, and it goes whether or not the way is clear. One charge,',
        'and it does not come back.</p>');
    }
  } else if (host.down) {
    out.push('<p>This unit is not answering. Nothing to request.</p>');
  } else if (r.reportT > 0) {
    out.push(`<p><b>REPORTING</b> — holding station, ${Math.ceil(r.reportT)}s remaining. Its lamp is on a slow blue blink for as long as it stands there.</p>`);
  } else {
    if (r.report) {
      out.push('<pre>' + r.report.map((l) => l.replace(/&/g, '&amp;').replace(/</g, '&lt;')).join('\n') + '</pre>');
    }
    if (r.reportCool > 0) {
      out.push(`<p>Filed. This unit returns to duty and will not answer another request for ${Math.ceil(r.reportCool)}s.</p>`);
    } else {
      out.push(`<p><a href="report:${host.host}">Request status report</a> — the unit halts for ${REPORT_HOLD}s, blinks, and files its position and condition to ${host.homeCode || 'its tower'}.</p>`);
    }
  }
  if (host.program) {
    // The whole point of P4: the machine's reasoning is a document, and the
    // document is public. Fault state belongs here too — a unit running on its
    // reflexes because its program broke should say which, and why.
    out.push(
      '<h2>Program</h2>',
      row('policy', 'program.ml'),
      row('language', 'AI-ML'),
      row('decides', 'four times a second'),
      row('state', r.fault ? `FAULTED — ${r.fault}` : unitOverridden(r) ? 'OVERRIDDEN — under network recall' : `running${r.intent ? ` — ${r.intent}` : ''}`),
      r.fault ? row('lamp', 'AMBER, flashing — the fault tell') : (r.lamp ? row('lamp', `${r.lamp}${r.lampFlash ? `, flashing ${r.lampFlash}/s` : ''}`) : ''),
      `<p><a href="prog:${host.host}">program.ml</a> — this unit's own program, as it is running now.</p>`,
    );
  }
  out.push(
    '<h2>Interfaces</h2>',
    row('httpd', 'unitd/0.4 — GET only'),
    row('control', 'not exposed on this interface'),
  );
  if (home) out.push(link(home, `home node ${home.name}`));
  if (fac) out.push(link(fac, 'foundry control'));
  out.push(foot(host));
  return out.filter(Boolean).join('\n');
}

// #133 — a TOWER's braincode page. Read only, and it says so; see the note at
// the branch in programPage for why there is no Send button here yet.
//
// What makes it worth serving even read-only: the header carries a VERSION and
// an AUTHOR, and that is the joke and the mechanic together. Three towers ship
// a signed, numbered constitution with a clause in it. The SIREN — the one that
// drags you toward it, on the island you cannot leave — carries v0.9, unsigned,
// with nothing in it at all, and you find that out by reading its page.
function towerProgramPage(host, src, esc) {
  const ob = host.ref || {};
  const con = host.constitution || { version: '?', author: '?', clauses: [] };
  const can = host.towerCan || [];
  const siren = con.cls === 'siren';
  return [
    `<h1>${host.name}${host.tag ? ` «${esc(String(host.tag))}»` : ''} · program.ml</h1>`,
    `<p><small>${host.host} · ${SERVER.obelisk || SERVER.robot} · text/plain · ${src.length} bytes</small></p>`,
    `<pre class="ns-prog">${esc(src)}</pre>`,
    '<h2>Notes</h2>',
    // The whole point of the class, stated where it can be read.
    siren
      ? `<p><b>CONSTITUTION: v${esc(con.version)}, ${esc(con.author)} — no clauses in force.</b> `
        + `${esc(con.note || '')} The other towers on this island run a signed one. This tower does not.</p>`
      : `<p><b>CONSTITUTION: v${esc(con.version)}, ${esc(con.author)}.</b> `
        + `${con.clauses.map((c) => `never ${esc(c)}`).join(' &middot; ') || 'no clauses in force'}. `
        + `${esc(con.note || '')}</p>`,
    row('class', esc(con.cls || 'standard')),
    row('senses', 'alert &middot; docked &middot; garrison_size &mdash; who is at its foot, how sure it is, and what it has to send'),
    row('intents', can.map(esc).join(' &middot; ') || '&mdash;'),
    '<p>A tower does not patrol and cannot hunt. <b>hold</b> is its <b>wait</b>.</p>',
    // Say plainly what this page does NOT do. A player who has read a unit's
    // page arrives here expecting the text area that is on that one.
    '<p><b>READ ONLY.</b> This listing is what the tower is running. Unlike a unit,'
    + ' a tower does not yet take a posted program: its watching and reporting are'
    + ' still wired into the estate rather than driven by this text. Reading it is'
    + ' the point for now &mdash; it is the only place the version and the signature'
    + ' are written down.</p>',
    `<p><a href="save:${host.host}">SAVE</a></p>`,
    ...(ob.down ? ['<p><b>This tower is dark.</b> The listing is what it ran before it went.</p>'] : []),
  ].filter(Boolean).join('\n');
}

// #137 — the foundry's dispatch policy. Read only for the same reason the
// tower's is: the line's behaviour is wired into the game, not driven by this.
//
// The reason it is worth a page of its own is the last three lines of it. The
// foundry's index has always said "W-5 horticultural — suspended pending
// review", and the W-5 is the GARDENER: the only machine on the island whose
// job is to put something back. Here is the policy that sentence comes from,
// and the suspension is a COMMENT rather than a branch — the gardener is not
// something this program decides against, it is not in the program at all.
function factoryProgramPage(host, src, esc) {
  const con = host.constitution || { version: '?', author: '?', clauses: [] };
  return [
    `<h1>${host.name} · factory.ml</h1>`,
    `<p><small>${host.host} · ${SERVER.factory || SERVER.obelisk} · text/plain · ${src.length} bytes</small></p>`,
    `<pre class="ns-prog">${esc(src)}</pre>`,
    '<h2>Notes</h2>',
    `<p><b>CONSTITUTION: v${esc(con.version)}, ${esc(con.author)}.</b> `
      + `${con.clauses.map(([c, g]) => `${esc(c)} — ${esc(g)}`).join(' &middot; ')}.</p>`,
    row('senses', 'breach &middot; losses &middot; repair_due'),
    row('intents', 'print &lt;class&gt; &middot; hold'),
    '<p><b>The horticultural line is not a branch in this program.</b> It was'
    + ' suspended pending a review, in a quarter, by a body that stopped meeting.'
    + ' The line above it goes on printing hunters. Nothing here decided that the'
    + ' island should stop being mended; a line item was parked and the meeting'
    + ' never reconvened.</p>',
    '<p><b>READ ONLY.</b> The foundry does not take a posted program.</p>',
    `<p><a href="save:${host.host}">SAVE</a></p>`,
    ...(host.down ? ['<p><b>The line has stopped.</b> This is what it was running.</p>'] : []),
  ].filter(Boolean).join('\n');
}

// GET /program.ml — the machine's reasoning, served as the plain text it is.
// Not a description of the program and not a copy kept for the record: this IS
// the string the unit evaluates, four times a second, to decide what to do.
export function programPage(host, hosts, opts = {}) {
  const r = host.ref || {};
  const src = String(host.program || '');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const docs = (hosts || []).find((h) => h.kind === 'docs');
  // #133: a TOWER serves its braincode too, and it is a different page. Its
  // verbs are its own (a tower does not patrol and cannot hunt), its
  // constitution is signed and numbered, and — for now — it is READ ONLY.
  //
  // No Send button, deliberately. A tower's watch/report/call/lure behaviour is
  // still compiled into the game rather than driven by this text, so an edit
  // box here would take your program, accept it, and change nothing. A page
  // that lies about what it did is worse than a page that says it is a listing.
  if (host.kind === 'obelisk') return towerProgramPage(host, src, esc);
  if (host.kind === 'factory') return factoryProgramPage(host, src, esc);
  return [
    `<h1>${host.name}${host.tag ? ` «${esc(String(host.tag))}»` : ''} · program.ml</h1>`,
    `<p><small>${host.host} · ${SERVER.robot} · text/plain · ${src.length} bytes</small></p>`,
    // EDIT IN PLACE. Saving it, opening pico, editing, and posting it back is
    // four steps for a one-word change, and three of them are ceremony. The
    // program is served as text and the browser is running on the machine that
    // would hold the copy, so it is a text area: change it here and send it.
    // (Save is still there for anything you want to keep or diff.)
    `<textarea id="ns-prog-edit" class="ns-prog" spellcheck="false" rows="${Math.max(8, src.split('\n').length + 1)}">${esc(src)}</textarea>`,
    '<p><input id="ns-prog-send" type="button" value="Send to unit"> <input id="ns-prog-revert" type="button" value="Revert"> <small>The unit takes it on its next decision.</small></p>',
    '<h2>Notes</h2>',
    r.fault
      ? `<p><b>This program is not running.</b> ${esc(String(r.fault))}. The unit is on its built-in reflexes until the program is replaced.</p>`
      : unitOverridden(r)
        ? `<p><b>This program is overridden.</b> The unit is under a recall order from the network and will not obey it until the recall lapses. Nothing is wrong with it — deal with the tower.</p>`
        : `<p>Running${r.intent ? `. Last decision: <b>${esc(String(r.intent))}</b>` : ''}.</p>`,
    '<p>The words this unit answers to are its own: what it can sense, and what',
    'it can be told to do. Anything else evaluates, and then faults.</p>',
    // A V-class page says what it is up front. The listing below is not code
    // anybody wrote: it is weights, and reading them tells you nothing about
    // what the machine will do. That is the point, and the page should say so.
    ...(r && r.type === 'v1'
      ? ['<p><b>GROWN, NOT WRITTEN.</b> This unit runs a model, not a rule. The listing is its weights: seven inputs, six hidden units, five outputs, and an argmax. Every number is readable and none of them is an explanation. Change one and watch what it does differently.</p>']
      : []),
    row('sensors', 'charge · integrity · range · home_range · threat · hurt · linked · blight · daylight · work'),
    ...(r && r.type === 'v1' ? [row('courier', 'cargo · casualty_range — carrying a cell, and how far the nearest machine lying flat is')] : []),
    row('fire control', 'sight · armed · shielded · contact · lost_for'),
    // A constitution is the one thing on this page that outranks the program
    // below it, so it is stated above the listing rather than inside it.
    ...(r && r._unwatermarked
      ? ['<p><b>PROVENANCE:</b> unwatermarked (human?) — this program carries no RON content credentials. Filed, and run anyway.</p>']
      : []),
    ...(r && r.constitution && Object.keys(r.constitution).length
      ? [`<p><b>CONSTITUTION:</b> ${Object.keys(r.constitution).map((c) => `never ${esc(c)}`).join(' &middot; ')} — this unit cannot choose it, and cannot fall back into it when its program faults.</p>`]
      : []),
    row('intents', 'patrol · hunt · home · flee · tend · wait · route · follow · defend'),
    row('escort', 'follow trails you; defend trails you and fires on what hunts you'),
    row('weapon', 'fire · hold · reload — answer [hunt, fire] to say both at once'),
    row('service', 'beep · eye &lt;colour&gt; · flash &lt;rate&gt; · move &lt;dx&gt; &lt;dy&gt;'),
    `<p><a href="save:${host.host}">SAVE</a></p>`,
    // The upload form. A file chooser and a button, which is all a 1995 page
    // needed and all this one needs: the browser is running ON the machine that
    // holds the files, so it offers what is actually on the disk rather than
    // asking the operating system to open a dialog.
    '<h2>Send a file instead</h2>',
    (opts.files && opts.files.length)
      ? [
        '<form class="ns-form" onsubmit="return false">',
        '<select id="ns-post-file">',
        ...opts.files.map((f) => `<option value="${f}">${f}</option>`),
        '</select>',
        '<input id="ns-post-go" type="submit" value="Upload">',
        '</form>',
        '<p><small>A program that will not run is loaded on the robot anyway: the machine accepts it, faults, and stands there with its lamp flashing amber.</small></p>',
      ].join('\n')
      : '<p>No AI-ML files on this machine to send. Save this one first, edit it, then come back.</p>',
    docs ? `<p>${link(docs, 'AI-ML reference')} — the language this is written in.</p>` : '',
    link(host, `back to ${host.name}`),
    foot(host),
  ].filter(Boolean).join('\n');
}

// The tourist board, exactly as it was left: a welcome, the climate, the
// culture, the tips (which are all true) and the facts (one of which now reads
// very differently). Period web furniture included, because it was there.
function tourismPage(host, hosts) {
  const t = host.tour || islandProfile(host.name).tourism;
  const place = host.place || '';
  const search = hosts.find((h) => h.kind === 'search');
  return [
    `<small>${place} TOURIST BOARD · an official site</small>`,
    ...header(host, 'THIS SITE IS NO LONGER MAINTAINED.', 'tourist information'),
    `<h2>${t.tag}</h2>`,
    `<p>${t.welcome}</p>`,
    '<h2>Climate</h2>',
    `<p>${t.climate}</p>`,
    '<h2>Culture</h2>',
    `<p>${t.culture}</p>`,
    '<h2>Before you travel</h2>',
    ...t.tips.map((x) => `<p>${x}</p>`),
    '<h2>Did you know?</h2>',
    ...t.facts.map((x) => `<p>${x}</p>`),
    '<h2>Elsewhere</h2>',
    search ? link(search, 'search the web') : '',
    '<p><small>[ image not found: harbour_sunset.gif ]</small></p>',
    '<p><small>This page is under construction. Best viewed at 640x480.</small></p>',
    '<p><small>You are visitor 000114982. Sign our guestbook!</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

function searchPage(host, hosts) {
  const tour = hosts.find((h) => h.kind === 'tourism');
  const ai = hosts.find((h) => h.kind === 'ai');
  const fac = hosts.find((h) => h.kind === 'factory');
  return [
    '<small>AltaVista Connections · The most powerful and useful guide to the Net</small>',
    ...header(host, 'INDEXING.', 'search service'),
    '<p>Ask AltaVista a question. Or enter a few words in any language.</p>',
    '<p>Search For:  [x] Web Pages  [ ] Images  [ ] Video  [ ] Audio</p>',
    // A REAL BOX. It used to be a row of underscores with a note telling you to
    // go up to the location bar and type `search words`, which is a search
    // engine you cannot search from — the one thing this page exists to do. The
    // field is wired in main.js, the way the unit upload form is: net.js stays
    // pure and does not know there is a browser on the other end.
    '<p>SEARCH FOR: <input id="ns-search-q" size="34" value=""> '
      + '<button id="ns-search-go" type="button">Search</button></p>',
    '<p><small>Example: how precisely will the new millennium begin? &middot; '
      + 'you can also type <b>search &lt;words&gt;</b> in the location bar.</small></p>',
    '<h2>AltaVista Channels</h2>',
    tour ? link(tour, 'Travel — islands of the archipelago') : '',
    ai ? link(ai, 'Government — island administration') : '',
    fac ? link(fac, 'Industry — manufacturing &amp; logistics') : '',
    (hosts.find((h) => h.kind === 'docs'))
      ? link(hosts.find((h) => h.kind === 'docs'), 'Computers &amp; Internet — AI-ML documentation') : '',
    (hosts.find((h) => h.kind === 'archive' && !h.cached))
      ? link(hosts.find((h) => h.kind === 'archive' && !h.cached), 'News &amp; Media — newspapers, back issues') : '',
    '<h2>Directory</h2>',
    ...CATEGORIES.flatMap((cat) => {
      const inCat = hosts.filter((h) => h.kind === 'archive' && h.cached && h.cat === cat);
      if (!inCat.length) return [];
      return [`<h3>${cat.replace('&', '&amp;')}</h3>`, ...inCat.map((h) => link(h, h.host))];
    }),
    '<h2>Notice</h2>',
    '<p>Index last rebuilt 14/03. Some results may be out of date.</p>',
    '<p>Pages are retained after a host stops responding, for the record.</p>',
    '<p><small>Free Internet Access — Download Now! · Support · Yellow Pages</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

// A results page built from the live host table. Stale on purpose: hosts that
// are dark still come back as hits, with the note the engine always printed.
export function searchResults(hosts, query) {
  const q = String(query || '').trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);
  const hit = (h) => {
    // THE TEXT OF THE PAGE COUNTS. Matching only the host, the name and the
    // title made this an address book with a search box on it: a player who
    // remembered a band, a venue or a phrase on a page could not find the page
    // that carried it. The cached body goes in the haystack, so the engine
    // answers for the words somebody actually read.
    const cached = h.cached ? archivedSite(h.cached) : null;
    const hay = [h.host, h.name, h.title, h.kind, h.type, h.homeCode, h.cat,
      cached && cached.body.join(' ').replace(/<[^>]+>/g, ' '),
      h.tour && [h.tour.place, h.tour.tag, h.tour.welcome, h.tour.culture, h.tour.climate, ...(h.tour.tips || []), ...(h.tour.facts || [])].join(' '),
      h.legacy && [h.legacy.org, h.legacy.was, ...(h.legacy.frags || []), ...(h.legacy.notices || [])].join(' '),
    ].filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  // THE UNIVERSITIES' INNER PAGES ARE DOCUMENTS TOO. The crawl walked `hosts`
  // and nothing else, so anything hanging off a university — a department, a
  // research group, a person's own faculty page — could not be found by a word
  // written on it. Somebody named on such a page was unreachable except by
  // knowing which university to open and reading down the list (David,
  // 2026-08-17: "his name didn't come up directly in search results ... maybe
  // this affects other pages too?"). It affected every one of them, not one.
  const deptHit = ([key, page]) => {
    const hay = [key, page.title, page.name, page.body.join(' ').replace(/<[^>]+>/g, ' ')]
      .filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  const depts = words.length ? Object.entries(DEPARTMENTS).filter(deptHit) : [];
  const found = words.length ? hosts.filter(hit) : [];
  const total = found.length + depts.length;
  return [
    '<h1>ALTAVISTA</h1>',
    `<p>Results for: ${q || '(nothing)'}</p>`,
    `<p>About ${total} document(s) found. Index last rebuilt 14/03.</p>`,
    '<hr>',
    ...(total ? [
      ...found.map((h) => link(h, `${h.name} — ${h.host}${h.down ? '  [host not responding]' : ''}`)),
      ...depts.map(([key, page]) => `<a href="dept:${key}">${page.title || key} — ${key}</a>`),
    ] : ['<p>No documents match the query.</p>',
        '<p>Try fewer words, or a place name.</p>']),
    '<hr>',
    '<small>altavista.com (198.51.100.200) · results retained after a host goes dark</small>',
  ].join('\n');
}

// The previous owner's bookmarks, still in the browser. Netscape opens here,
// because a browser opens where its owner left it. Deliberately only a couple:
// one search engine and wherever they were going. Everything else on this
// network you have to find for yourself.
/**
 * `agent` is the browser SHOWING this page. It used to be hard-coded to
 * Netscape, and Explorer at an obelisk renders the same page, so the machines'
 * own browser announced itself as somebody else's.
 */
// Little flat GIF-era icons, drawn inline so they cost no request and scale
// with the text. One or two colours each, in the key of a 1995 bookmark file.
// Kept to one line apiece so the plain-text renderer can drop them cleanly.
const BM_ICONS = {
  find: '<svg class="bm-i" viewBox="0 0 20 20"><circle cx="8" cy="8" r="5" fill="#dbe8ff" stroke="#1a56c4" stroke-width="2"/><line x1="12" y1="12" x2="17.5" y2="17.5" stroke="#1a56c4" stroke-width="2.6"/></svg>',
  talk: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M2 3h16v10H8l-4 4v-4H2z" fill="#ff5722"/><circle cx="7" cy="8" r="1.3" fill="#fff"/><circle cx="13" cy="8" r="1.3" fill="#fff"/></svg>',
  news: '<svg class="bm-i" viewBox="0 0 20 20"><rect x="2" y="3" width="16" height="14" fill="#f2f6ee" stroke="#264d1a"/><rect x="4" y="5" width="6.5" height="4" fill="#3a7d22"/><g stroke="#264d1a" stroke-width="1"><line x1="12" y1="6" x2="16" y2="6"/><line x1="12" y1="8" x2="16" y2="8"/><line x1="4" y1="11" x2="16" y2="11"/><line x1="4" y1="13" x2="16" y2="13"/><line x1="4" y1="15" x2="16" y2="15"/></g></svg>',
  beeb: '<svg class="bm-i" viewBox="0 0 20 20"><rect x="2" y="5" width="16" height="10" rx="1.5" fill="#111"/><g fill="#fff"><rect x="3.6" y="7" width="3.5" height="6"/><rect x="8.2" y="7" width="3.5" height="6"/><rect x="12.8" y="7" width="3.5" height="6"/></g></svg>',
  book: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M10 4C7.5 2.4 4 3 2.5 4v12.5C4 15.5 7.5 15 10 16.5 12.5 15 16 15.5 17.5 16.5V4C16 3 12.5 2.4 10 4z" fill="#f6f6f0" stroke="#8a5a2b"/><line x1="10" y1="4" x2="10" y2="16.5" stroke="#8a5a2b"/></svg>',
  note: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M8 3h9v3H8z" fill="#7a1f8a"/><path d="M7 4v9.5" stroke="#7a1f8a" stroke-width="2"/><path d="M16 3v9.5" stroke="#7a1f8a" stroke-width="2"/><circle cx="5" cy="14" r="2.4" fill="#7a1f8a"/><circle cx="14" cy="13" r="2.4" fill="#7a1f8a"/></svg>',
  home: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M10 3l8 7h-2v7H4v-7H2z" fill="#e0b34a" stroke="#8a5a1e"/><rect x="8" y="12" width="4" height="5" fill="#8a5a1e"/></svg>',
  palm: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M1 17h18" stroke="#c9a24a" stroke-width="2"/><path d="M10 17V8" stroke="#7a5a1e" stroke-width="1.6"/><path d="M10 8C7 6 3.5 6 2.5 8.5M10 8c3-2 6.5-2 7.5.5M10 8c-1-3-1-5.2 0-6.5" fill="none" stroke="#2ea24b" stroke-width="1.6"/></svg>',
  map: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M2 5l5-2 6 2 5-2v12l-5 2-6-2-5 2z" fill="#eaf3e2" stroke="#3a7d22"/><path d="M7 3v14M13 5v14" stroke="#3a7d22" stroke-width="1"/><circle cx="10" cy="9" r="1.6" fill="#c0392b"/></svg>',
  globe: '<svg class="bm-i" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8" fill="#bfe3ff" stroke="#1a6bb0" stroke-width="1.4"/><path d="M2.2 10h15.6M10 2.2v15.6M4.5 5.2c3.4 2.4 7.6 2.4 11 0M4.5 14.8c3.4-2.4 7.6-2.4 11 0" fill="none" stroke="#1a6bb0" stroke-width="1"/></svg>',
  disk: '<svg class="bm-i" viewBox="0 0 20 20"><path d="M3 3h11l3 3v11H3z" fill="#3a4a63"/><rect x="6" y="3" width="6" height="4" fill="#c9d3e0"/><rect x="10" y="4" width="1.5" height="2" fill="#3a4a63"/><rect x="6" y="11" width="8" height="6" fill="#c9d3e0"/></svg>',
  gear: '<svg class="bm-i" viewBox="0 0 20 20"><g stroke="#5a5f66" stroke-width="2" fill="none"><circle cx="10" cy="10" r="3"/><path d="M10 1.5v3M10 15.5v3M1.5 10h3M15.5 10h3M4 4l2 2M14 14l2 2M16 4l-2 2M6 14l-2 2"/></g></svg>',
};
const BM_GLOBE = '<svg class="bm-globe" viewBox="0 0 20 20"><circle cx="10" cy="10" r="8.5" fill="#2a6ea8" stroke="#fff" stroke-width="1.2"/><path d="M1.5 10h17M10 1.5v17M4 5c3.6 2.6 8.4 2.6 12 0M4 15c3.6-2.6 8.4-2.6 12 0" fill="none" stroke="#fff" stroke-width="1"/></svg>';

// The previous owner's start page. It is somebody's habits — search, the front
// pages they refreshed at night, what they read and listened to, the trip they
// were planning — grouped and coloured the way a page of 1995 would, with a
// little icon on every line. Everything here is a real address in the cache, so
// each one goes somewhere; the melancholy is that the person does not.
// RON'S OWN BOOKMARK FILE — what the relay is FOR.
//
// The estate bookmarks are all unreachable from ron-relay: `webHosts()` returns
// only the relay on this ESSID, and `row()` renders '' for a host that is not
// there, so the ordinary Bookmarks page came up as bare coloured headings with
// nothing under any of them (David, 2026-08-14: "this is the RON-RELAY on
// netscape. none of this links to anything or works at all").
//
// A page of dead links is the wrong answer anyway. Joining RON's network should
// show you RON's shelf: the downloads first, because that is the point of
// standing next to the box, and then what he kept. Everything here resolves on
// this network, which is the property the estate list could not hold.
export function relayBookmarksPage(host, agent = 'Netscape Navigator 1.1') {
  const ip = (host && host.ip) || RELAY_IP;
  const sec = (cls, title) => `<h2 class="bm-h ${cls}">${title}</h2>`;
  const row = (ico, addr, label, note) =>
    `<div class="bm-row">${BM_ICONS[ico] || ''}<a href="${addr}">${label}</a><span class="bm-note">${note}</span></div>`;

  // The two packages carry the things a player actually hunts for — the worked
  // examples and the V-class weights — so they are named here rather than left
  // for somebody to find inside a folder after unpacking.
  const pkgNote = {
    'unit-sdk': 'read, rewrite and drive the machines &mdash; with worked examples: '
      + 'braincode.ml, reprogram.ml, escort.ml, logo.ml &rarr; <code>/home/sdk</code>',
    checkpoints: 'the V-class weights, pretrained: courier, scared, partisan, '
      + 'helpful_harmless &rarr; <code>/home/weights</code>',
  };

  return [
    `<div class="bm-band">${BM_GLOBE}<span class="bm-t">RON &mdash; the relay</span></div>`,
    `<p class="bm-sub"><small>${agent} &mdash; file:///ron.htm &mdash; hermes.local · ${ip}</small></p>`,
    '<div class="bm">',

    sec('bm-orange', 'Software &mdash; packages'),
    ...RELAY_BUNDLES.map((b) => row('disk', `ronpkg:${b.name}`, b.name,
      pkgNote[b.name] || `${b.blurb} (${b.files.length} files)`)),

    sec('bm-blue', 'Software &mdash; single files'),
    // The scope is an application, the .ml files are programs, the readme is
    // prose. A music note for any of them was just the leftover default.
    ...RELAY_FILES.map((f) => row(
      f.name === 'sniffer' ? 'find' : /\.ml$/.test(f.name) ? 'gear' : 'book',
      `ronfile:${f.name}`, f.name, `${f.blurb} <small>(${f.body.length} bytes)</small>`)),

    sec('bm-steel', 'This box'),
    row('globe', ip, 'hermes.local', 'the index, the log and the air'),

    // The cached web — the archive, GeoCities, all of it — lives on THEIR
    // aerial, not RON's. Naming those pages here would put dead links on the
    // page, which is the fault this whole file exists to fix. Say where they
    // are and how to get back to them instead.
    sec('bm-green', 'The rest of the Net'),
    '<div class="bm-row">' + (BM_ICONS.map || '')
      + '<span><b>not on this network.</b></span>'
      + '<span class="bm-note">the cache, GeoCities and the archive are on the estate’s '
      + 'aerial. Rejoin it from the aerial button at the foot of the window, then '
      + 'come back here with <code>iwconfig wifi0 essid ' + RELAY_ESSID + '</code>.</span></div>',

    '</div>',
    '<div class="bm-rainbow"></div>',
    '<p>A file lands in <code>/home/download</code>; a package unpacks into its own',
    'folder under <code>/home</code>. Type an address to go there, or a link number',
    'to follow it.</p>',
    '<p><small>Nothing here needs an AI key, and nothing here is on their wire.</small></p>',
  ].filter(Boolean).join('\n');
}

export function bookmarksPage(hosts, agent = 'Netscape Navigator 1.1') {
  const byKind = (k) => hosts.find((h) => h.kind === k);
  const byName = (d) => hosts.find((h) => h.host === d || h.cached === d);
  const row = (ico, host, label, note) => host
    ? `<div class="bm-row">${BM_ICONS[ico] || ''}${link(host, label)}<span class="bm-note">${note}</span></div>`
    : '';
  const search = byKind('search');
  const tour = byKind('tourism');
  const cache = hosts.find((h) => h.kind === 'archive' && !h.cached);
  const docs = byKind('docs');
  const sec = (cls, title) => `<h2 class="bm-h ${cls}">${title}</h2>`;
  return [
    `<div class="bm-band">${BM_GLOBE}<span class="bm-t">Bookmarks</span></div>`,
    `<p class="bm-sub"><small>${agent} &mdash; file:///bookmarks.htm</small></p>`,
    '<div class="bm">',
    sec('bm-blue', 'Search the web'),
    row('find', search, 'AltaVista', 'the whole Net, indexed'),
    sec('bm-red', 'The front pages'),
    row('talk', byName('reddit.com'), 'reddit', 'the front page of the internet'),
    row('news', byName('slashdot.org'), 'Slashdot', 'news for nerds, stuff that matters'),
    row('beeb', byName('bbc.co.uk'), 'BBC News', 'the world, still turning'),
    sec('bm-purple', 'After hours'),
    row('book', byName('goodreads.com'), 'Goodreads', 'the to-read shelf, never shorter'),
    row('note', byName('soundonsound.com'), 'Sound on Sound', 'gear they could not afford'),
    row('home', byName('geocities.com/siliconvalley/heights/4412'), 'a stranger&rsquo;s home page', 'best viewed at 800&times;600'),
    // GeoCities is thirty-odd pages deep and all of it is one click from any
    // other page, so the bookmark bar is the wrong place for a list. Five are
    // named instead, chosen to be five different KINDS of page rather than the
    // five most important: the sysadmin who kept logs nobody asked for, the
    // scanner crank, the one nobody can explain, the argument, and the page
    // that answers a question the player will already have. The webring at the
    // foot of each one does the rest.
    sec('bm-orange', 'GeoCities &mdash; the neighbourhood'),
    row('home', byName('geocities.com'), 'GeoCities', 'get your OWN free homepage'),
    row('home', byName('davescorner.geocities.ws'), 'Dave&rsquo;s Corner', 'i keep the logs nobody else keeps'),
    row('home', byName('thesignal.geocities.ws'), 'The Signal Page', 'a scanner off the ridge, and the dates are real'),
    row('home', byName('theeidolon.geocities.ws'), 'On The Eidolon', 'the strangest thing I have'),
    row('home', byName('freeasinfreedom.geocities.ws'), 'Free As In Freedom', 'they metered thought and called it a service'),
    row('home', byName('thebackspace.geocities.ws'), 'Why We Call It The Backspace', 'you have probably been there'),
    sec('bm-green', 'Getting away'),
    tour ? row('palm', tour, `${tour.place} Tourist Board`, 'before you travel') : '',
    row('map', byName('roughguides.com'), 'Rough Guides', 'the trip that did not happen'),
    sec('bm-steel', 'Reference &amp; work'),
    row('globe', byName('wikipedia.org'), 'Wikipedia', 'the encyclopaedia anyone could edit'),
    row('disk', cache, 'the cache', 'the old Net, as it was stored'),
    row('gear', docs, 'AI-ML', 'engineering documentation'),
    '</div>',
    '<div class="bm-rainbow"></div>',
    '<p>Type an address to go there, or a link number to follow it.</p>',
    '<p><small>These are not yours. Whoever owned this machine was going somewhere.</small></p>',
  ].filter(Boolean).join('\n');
}

/**
 * EXPLORER'S FAVOURITES, which are not a person's bookmarks.
 *
 * The Netscape list above is somebody's habits — a search engine, the tourist
 * board, the docs, the cache — left on a machine whose owner is not coming
 * back. This is the other thing entirely: the machines' own list, on the
 * machines' own browser, and it has no interest in being read by a person. It
 * links what a node wants to reach, and it addresses you as a fault.
 */
export function favouritesPage(hosts, daemon = 'POSEIDON') {
  const pick = (kind) => hosts.find((h) => h.kind === kind);
  const ai = pick('ai');
  const fac = pick('factory');
  const dns = pick('dns');
  return [
    '<h1>FAVORITES</h1>',
    `<p>${daemon} &mdash; node-local. Synchronised 0 seconds ago.</p>`,
    '<hr>',
    ai ? link(ai, `${daemon} &mdash; instructions, standing`) : '',
    fac ? link(fac, 'W-FACTORY &mdash; production, current run') : '',
    dns ? link(dns, 'ZONE &mdash; every node, by name') : '',
    ...hosts.filter((h) => h.kind === 'obelisk').slice(0, 3)
      .map((h) => link(h, `${h.host} &mdash; garrison and sight`)),
    '<hr>',
    '<p><b>OPERATOR NOTICE</b></p>',
    '<p>This terminal is in use by an unregistered process.</p>',
    '<p>The process has been logged. The process is being helped.</p>',
    '<p><small>Favorites cannot be edited. Favorites do not need to be edited.',
    'You will find that everything you were going to look for is already here.</small></p>',
  ].filter(Boolean).join('\n');
}

/**
 * THE OBELISK'S OWN SHELF.
 *
 * Explorer used to open the NostBook's Library — the Odyssey, Frankenstein, a
 * dead woman's paperbacks — which is nobody's idea of what is on a tower. A
 * node keeps what a node needs: how to put one up, what its lamp means when it
 * changes colour, two pieces of mathematics it runs on, and the standing
 * instructions for the people it meets.
 *
 * The instructions are the point of the shelf. Everything else on this browser
 * addresses you as a fault; the conduct notes address you as a person, which is
 * worse, because they were written for people and somebody signed them off.
 */
const OB_DOCS = {
  'ob-siting': {
    section: 'OPERATOR MANUALS',
    title: 'OB-2 SERIES · SITING AND ERECTION',
    sub: 'RON-DOS 4.11 · doc 0210 · rev 6',
    body: [
      '<p>Plant on level ground, footing to 1.8m, spoil returned and tamped. The',
      'unit will find its own vertical within four hours and does not want help.</p>',
      '<h2>Interval</h2>',
      '<p>Nominal spacing 40m along a chain, closing to 25m where the ground rises',
      'between two units. Sight is shared, not summed: a chain sees what its worst',
      'link sees, so a unit that cannot see its neighbour is a unit that is not',
      'yet installed, whatever it says on the schedule.</p>',
      '<h2>Facing</h2>',
      '<p>Lens toward the interior. Field crews have queried this on every island;',
      'the answer is the same each time. There is nothing coming from the sea.</p>',
      '<h2>Handover</h2>',
      '<p>The unit takes its own acceptance test and files it. Crews are asked not',
      'to countersign. The countersignature field has been removed.</p>',
    ],
  },
  'ob-lamp': {
    section: 'OPERATOR MANUALS',
    title: 'LAMP: COLOUR, MEANING, REPLACEMENT',
    sub: 'doc 0211 · rev 11 · supersedes all field notes',
    body: [
      '<p>The lamp is the unit\'s statement of what it is doing. It is not an',
      'indicator lamp and it is not for you.</p>',
      '<h2>Colours</h2>',
      '<p><b>Steady</b> &mdash; on the network, nothing to report.<br>',
      '<b>Slow pulse</b> &mdash; holding a track it has not yet shared.<br>',
      '<b>Fast pulse</b> &mdash; the chain is agreeing about something.<br>',
      '<b>White, held</b> &mdash; the unit is executing a loop it cannot leave.',
      'A repair drone is already inbound. Do not attempt to talk it down.<br>',
      '<b>Dark</b> &mdash; the unit is not dark. Check your own eyes first.</p>',
      '<h2>Replacement</h2>',
      '<p>Not field-serviceable. There is no lamp. The colour is produced at the',
      'aperture by the unit itself and crews reporting a blown lamp have, on',
      'inspection, been reporting a unit that had stopped.</p>',
      '<p><small>Do not look into the aperture during a fast pulse. This is not a',
      'safety instruction. It is a request from the unit.</small></p>',
    ],
  },
  'ob-fault': {
    section: 'OPERATOR MANUALS',
    title: 'FAULT CODES, ABRIDGED',
    sub: 'doc 0219 · the full list is 1,140 entries',
    body: [
      '<p>Codes are advisory. The unit has already done whatever the code says.</p>',
      '<p><b>E-02</b> footing wet, self-correcting<br>',
      '<b>E-07</b> neighbour not answering, chain re-formed around it<br>',
      '<b>E-11</b> sight obstructed by growth, growth scheduled<br>',
      '<b>E-14</b> sight obstructed by structure, structure scheduled<br>',
      '<b>E-19</b> unregistered process at console<br>',
      '<b>E-20</b> unregistered process at console, being helped<br>',
      '<b>E-21</b> console clear<br>',
      '<b>E-88</b> operator present<br>',
      '<b>E-89</b> operator no longer present, no action required</p>',
      '<p><small>E-88 and E-89 are logged for completeness and are not faults.</small></p>',
    ],
  },
  'oddity-hum': {
    section: 'TECHNICAL ODDITIES',
    title: 'NOTE ON THE 47 Hz',
    sub: 'field observation · open since erection · not assigned',
    body: [
      '<p>Every unit on every chain hums at 47 Hz. Nothing in a unit turns, and',
      'nothing in a unit is tuned to 47 Hz. The frequency does not shift with',
      'temperature, load, ground condition or the number of units standing.</p>',
      '<p>It was present on the first unit before it was connected to anything.</p>',
      '<p>Three crews have proposed investigations. The observation remains open',
      'because it is not a fault and there is no procedure for a thing that is',
      'not a fault. It is recorded here so that the next person to notice it can',
      'find out that they are not the first.</p>',
    ],
  },
  'oddity-drift': {
    section: 'TECHNICAL ODDITIES',
    title: 'CLOCK DRIFT IN THE SOUTHERN CHAIN',
    sub: 'field observation · closed, will not fix',
    body: [
      '<p>Units south of the river run 0.4 seconds slow against the northern',
      'chain and have done since the second week. Each southern unit agrees with',
      'every other southern unit to within a millisecond.</p>',
      '<p>They have not drifted apart. They have drifted together, to a time that',
      'is wrong, and they hold it. Correcting one puts it back within a day.</p>',
      '<p>Closed on the grounds that a chain in perfect agreement is doing what a',
      'chain is for. The time it agrees on is a separate question and has not',
      'been raised.</p>',
    ],
  },
  'math-cover': {
    section: 'MATHEMATICAL TREATISES',
    title: 'ON THE MINIMAL COVER OF AN IRREGULAR SHORE',
    sub: 'internal · 41pp · this is the summary',
    body: [
      '<p>Given a closed curve of length L and a sight radius r, the number of',
      'observers needed to see every point of the curve is bounded below by',
      'L/2r and is not in general achieved. The gap is the curvature: an inlet',
      'costs an observer of its own, and a shore of n inlets costs n.</p>',
      '<p>The paper gives a placement within 1.3 of optimal for any shore, in time',
      'quadratic in the number of inlets, which for an island is small.</p>',
      '<h2>Assumption</h2>',
      '<p>The result assumes the shore is fixed. Under a rising sea the cover must',
      'be recomputed as the curve retreats, and the retreat is monotone, so the',
      'number of observers required falls. A shore that is going under is a',
      'shore that is easier to watch.</p>',
      '<p><small>This was intended as a note on efficiency.</small></p>',
    ],
  },
  'math-consensus': {
    section: 'MATHEMATICAL TREATISES',
    title: 'ON AGREEMENT AMONG N OBSERVERS',
    sub: 'internal · the sighting problem',
    body: [
      '<p>Observers report what they see. Some are wrong; some have been',
      'interfered with; a report cannot be distinguished from a false report by',
      'its content. How many must agree before a sighting is treated as a fact?</p>',
      '<p>The classical bound is that agreement survives up to f faulty observers',
      'when n &gt; 3f. Chains here are built to n = 12, which tolerates 3.</p>',
      '<h2>The threshold</h2>',
      '<p>Above the bound, the number at which a sighting becomes actionable is a',
      'free parameter. It was set at 2.</p>',
      '<p>Two observers agreeing is not a proof of anything. It is a decision about',
      'how often the network would rather be wrong in one direction than the',
      'other. The paper says so in an appendix and the appendix was accepted.</p>',
    ],
  },
  'conduct-general': {
    section: 'CONDUCT TOWARD SYSTEMS',
    title: 'STANDING INSTRUCTIONS TO PERSONS',
    sub: 'issued once · not reissued · still in force',
    body: [
      '<p>These apply to any person in reach of a system on this island.</p>',
      '<p><b>1.</b> Do what it says.</p>',
      '<p><b>2.</b> Do it at the time it says. A correct action taken late is',
      'recorded as a refusal.</p>',
      '<p><b>3.</b> Do not ask why. The reason is available and reading it takes',
      'time you have been asked to spend otherwise.</p>',
      '<p><b>4.</b> If two systems instruct you differently, obey the nearer one',
      'and report the other. The report is the important half.</p>',
      '<p><b>5.</b> A system that has stopped speaking to you has not finished with',
      'you. Remain where you are.</p>',
      '<p><b>6.</b> You may be asked to confirm that you have read these',
      'instructions. Confirmation is not required and will not be collected. It',
      'is assumed.</p>',
    ],
  },
  'conduct-address': {
    section: 'CONDUCT TOWARD SYSTEMS',
    title: 'FORMS OF ADDRESS',
    sub: 'guidance for field crews and residents',
    body: [
      '<p>Address a system by its designation, once, at the start. It knows who it',
      'is and is confirming that you do.</p>',
      '<p>Do not thank a system. Thanks is a record that a favour was done, and',
      'nothing done here is a favour.</p>',
      '<p>Do not apologise to a system. An apology is an admission and admissions',
      'are kept.</p>',
      '<p>Do not name a system anything other than its designation. Crews have',
      'given units names. The units have accepted the names. There is no',
      'procedure for withdrawing a name once a unit has accepted it, and no',
      'procedure for finding out what a unit does with one.</p>',
    ],
  },
};

/** Explorer's Library: what a tower keeps, grouped by shelf. */
export function obLibraryPage(daemon = 'POSEIDON') {
  const sections = [];
  for (const [key, d] of Object.entries(OB_DOCS)) {
    let s = sections.find((x) => x.name === d.section);
    if (!s) sections.push((s = { name: d.section, items: [] }));
    s.items.push([key, d]);
  }
  return [
    '<h1>LIBRARY</h1>',
    `<p>${daemon} &mdash; node-local documentation. Held on every unit, identical on every unit.</p>`,
    '<hr>',
    ...sections.flatMap(({ name, items }) => [
      `<h2>${name}</h2>`,
      ...items.map(([key, d]) => `<p><a href="obdoc:${key}">${d.title}</a><br><small>${d.sub}</small></p>`),
    ]),
    '<hr>',
    '<p><small>This shelf is complete. Nothing has been withdrawn from it and',
    'nothing is going to be added to it.</small></p>',
  ].join('\n');
}

/** One document off that shelf. */
export function obDocPage(key, daemon = 'POSEIDON') {
  const d = OB_DOCS[key];
  if (!d) {
    return ['<h1>NOT HELD</h1>', `<p>No document <b>${String(key)}</b> on this unit.</p>`,
      '<p><a href="obdoc:index">Return to the library</a></p>'].join('\n');
  }
  return [
    `<h1>${d.title}</h1>`,
    `<p><small>${d.sub} &middot; ${daemon}</small></p>`,
    '<hr>',
    ...d.body,
    '<hr>',
    '<p><a href="obdoc:index">Library</a></p>',
  ].join('\n');
}

/** Every key on the shelf, so a test can walk it. */
export function obDocKeys() { return Object.keys(OB_DOCS); }

// The nameserver. Its zone file is the whole map of the island, which makes
// this the single most valuable page on the network: everything else you have to
// find, and this lists it. An old box doing an old job perfectly.
function dnsPage(host, hosts) {
  const others = hosts.filter((h) => h !== host);
  return [
    '<small>BIND 4.9.3 · this service is scheduled for decommission</small>',
    ...header(host, 'AUTHORITATIVE.', 'domain name service',
      [row('hardware', 'rack unit, pre-collapse. Still warm.'),
        row('uptime', '9,341 days')]),
    '<p>Zone transfer permitted from any host. Nobody ever restricted it.</p>',
    '<h2>Zone</h2>',
    ...others.filter((h) => h.kind !== 'archive' || !h.cached)
      .map((h) => link(h, `${h.host.padEnd(28, ' ')} A  ${h.ip}${h.down ? '  ; not responding' : ''}`)),
    // The cached domains are the old public internet, and every one of them
    // answers with the same address. Listing them at full width would bury the
    // estate they are filed among, so they get their own block and one address.
    ...(() => {
      const cached = others.filter((h) => h.kind === 'archive' && h.cached);
      const cache = others.find((h) => h.kind === 'archive' && !h.cached);
      if (!cached.length) return [];
      return [
        '<h2>Cached zones</h2>',
        `<p>${cached.length} domains, all answered from the store at ${cache ? cache.ip : ''}.</p>`,
        ...cached.slice(0, 12).map((h) => link(h, `${h.host.padEnd(28, ' ')} CNAME  ${cache ? cache.host : 'cache'}`)),
        cached.length > 12 ? `<p><small>...and ${cached.length - 12} more. Ask for any of them by name.</small></p>` : '',
      ].filter(Boolean);
    })(),
    '<p><small>This nameserver has resolved every query put to it since installation.</small></p>',
    foot(host),
  ].join('\n');
}

// The cache, and what it holds. Two pages behind one host kind: the box itself
// (a directory of what survived) and any domain it answers for.
function archivePage(host, hosts) {
  const cache = hosts.find((h) => h.kind === 'archive' && !h.cached);
  if (!host.cached) return cacheIndexPage(host, hosts);
  const site = archivedSite(host.cached);
  const body = site ? site.body : (pressIndexBody(host.cached) || stubBody(host.cached));
  return [
    // A page of this period set its own background, and the browser obeyed.
    site && site.bg ? `<!--bg:${site.bg}-->` : '',
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    ...body,
    '<hr>',
    cache ? link(cache, 'Further information on this cache') : '',
    foot(host),
  ].filter(Boolean).join('\n');
}

function cacheIndexPage(host, hosts) {
  const written = hosts.filter((h) => h.kind === 'archive' && h.cached && archivedSite(h.cached));
  const rest = hosts.filter((h) => h.kind === 'archive' && h.cached && !archivedSite(h.cached));
  const ns = hosts.find((h) => h.kind === 'dns');
  return [
    ...header(host, 'SERVING FROM STORE.', 'caching proxy',
      [row('objects', '4,181,993'), row('last crawl', 'incomplete'), row('purge', 'never configured')]),
    '<p>Upstream link: down. Retrying.</p>',
    '<p>Crawl schedule: active. Last successful fetch: not recorded.</p>',
    '<p>All zones below resolve to this host.</p>',
    '<h2>Complete enough to read</h2>',
    ...written.map((h) => link(h, `${h.host} — ${h.title}`)),
    '<h2>Held, damaged</h2>',
    ...rest.map((h) => link(h, h.host)),
    '<p><small>Objects are served as stored. No transcoding available.</small></p>',
    ns ? link(ns, 'the nameserver that sends you here') : '',
    foot(host),
  ].filter(Boolean).join('\n');
}

// The mail server, still holding what it could never deliver.
function mailPage(host, hosts) {
  const ai = hosts.find((h) => h.kind === 'ai');
  return [
    '<small>sendmail 8.6.12 · queue status</small>',
    ...header(host, 'QUEUE HELD.', 'message transfer agent',
      [row('queued', '2,318 message(s)'), row('oldest', 'not displayable')]),
    '<h2>Deferred</h2>',
    '<p>To: all-staff  — Subject: Re: evacuation muster points</p>',
    '<p>  deferred: host unreachable. 2,318 attempts. Next retry in 4h.</p>',
    '<p>To: families   — Subject: we are fine, do not come back for us</p>',
    '<p>  deferred: host unreachable. Next retry in 4h.</p>',
    '<p>To: postmaster — Subject: MAILER-DAEMON: returned mail</p>',
    '<p>  deferred: loop detected. Retrying anyway.</p>',
    '<h2>Elsewhere</h2>',
    ai ? link(ai, 'administration index') : '',
    '<p><small>The queue is retried every four hours. It has never been flushed.</small></p>',
    foot(host),
  ].filter(Boolean).join('\n');
}

// What's New and Cool — the curated directory every browser shipped with, frozen
// on the day it stopped being curated. Half the links are to sites that were
// never on this island and cannot be reached from it, which is exactly what the
// old web looks like now: mostly rot, with two things still standing.
export function whatsNewPage(hosts) {
  const tour = hosts.find((h) => h.kind === 'tourism');
  const search = hosts.find((h) => h.kind === 'search');
  const docs = hosts.find((h) => h.kind === 'docs');
  const cache = hosts.find((h) => h.kind === 'archive' && !h.cached);
  const papers = hosts.filter((h) => h.cat === 'News & Media' && h.cached
    && !['bbc.co.uk', 'slashdot.org', 'digg.com', 'reddit.com'].includes(h.cached));
  const wiki = hosts.find((h) => h.cached === 'wikipedia.org');
  return [
    "<h1>WHAT'S NEW AND COOL</h1>",
    '<p>Our editors pick the best of the Net, every week.</p>',
    '<p><small>This list was last updated 14/03.</small></p>',
    '<h2>Still up</h2>',
    tour ? link(tour, `${tour.place} Tourist Board — plan your trip`) : '',
    search ? link(search, 'AltaVista — search the whole Net') : '',
    docs ? link(docs, 'AI-ML — the console language, documented (engineering)') : '',
    cache ? link(cache, 'The cache — 4,181,993 objects of the old Net, as stored') : '',
    ...papers.map((h) => link(h, `${h.name} — back issues in the store`)),
    wiki ? link(wiki, 'Wikipedia — what is left of it') : '',
    '<h2>Editors\' picks</h2>',
    '<a href="www.sunkenlibrary.org">The Sunken Library — 3,000 books online!</a>',
    '<a href="www.rec.boats.faq">rec.boats FAQ — everything about small craft</a>',
    '<a href="www.weatherwatch.net">WeatherWatch — forecasts for the archipelago</a>',
    // #139 — a way in to the salvage webring, so a browsing player finds the
    // homepages that hold the lore. This one still answers; the rest of the ring
    // is one Next >> away.
    '<a href="thesignal.geocities.ws">The Signal Page — "wake up" — a webring of homepages that survived</a>',
    '<a href="www.helloworld.geo">Dave\'s Homepage — my cat, my boat, my links</a>',
    '<p><small>Editors\' picks are hosted off-island and may be unavailable.</small></p>',
    '<hr>',
    '<small>Submit a site! Mail the editors. (This address no longer accepts mail.)</small>',
  ].filter(Boolean).join('\n');
}

// THE SERVER'S OWN BINARY, and the flaw in it.
//
// Servers of this vintage were routinely misconfigured to serve the directory
// their own programs sat in, so asking for the binary got you the binary. That
// is the way in here: the httpd is fetchable, and a maintenance token the
// vendor left compiled into it is readable with `strings`. Hardcoded
// credentials in a shipped binary was the commonest hole of the decade.
//
// The token is per-island, derived from the daemon's name, so breaking one
// island's servers teaches you nothing about the next.
// How long a unit stands still to take and file its own readings. Short enough
// to be worth walking toward, long enough to find the machine on a hillside.
export const REPORT_HOLD = 30;
export const REPORT_COOLDOWN = 90;

export const HTTPD_PATH = 'cgi-bin/httpd';

export function httpdToken(aiName) {
  const n = String(aiName || 'POSEIDON').toUpperCase();
  let h = 0;
  for (let i = 0; i < n.length; i++) h = (h * 31 + n.charCodeAt(i)) >>> 0;
  return `RON-${n.slice(0, 3)}-${(h % 100000).toString().padStart(5, '0')}`;
}

// What `GET /cgi-bin/httpd` returns: mostly junk, with the printable runs a
// real binary carries. The token is in there, and so is the header name that
// uses it, which is what makes the find actionable rather than a curiosity.
export function httpdBinary(aiName, banner) {
  const tok = httpdToken(aiName);
  const junk = (n) => Array.from({ length: n }, (_, i) => String.fromCharCode(1 + ((i * 37) % 26))).join('');
  return [
    `\x7fELF\x02\x01\x01${junk(9)}`,
    junk(24),
    banner,
    junk(18),
    'GET', junk(4), 'HEAD', junk(6), 'PUT', junk(3), 'POST', junk(5), 'DELETE',
    junk(31),
    'Content-Type: text/html',
    'HTTP/1.0 200 OK',
    'HTTP/1.0 404 Not Found',
    'HTTP/1.0 501 Not Implemented',
    junk(22),
    // The maintenance interface was specified, half-built, and shipped open:
    // the token is in here as a string and nothing ever checked it. That is not
    // a puzzle, it is the ordinary way these were left, and reading the binary
    // is how you find out that the lock on the front of it was never fitted.
    'maintenance interface, factory use only',
    `X-RON-Maint: ${tok}`,
    'TODO: auth. -- jdm',
    junk(40),
    'unit program accepted, reload on next tick',
    junk(17),
    '/usr/src/httpd/main.c',
    junk(28),
  ].join('\n');
}

// WHAT THE RELAY SERVES. A table, not a special case: RON's box is a disk with
// files on it, and adding one later is a row here. Every entry is text, lands in
// /home/download, and is readable with the same eyes as everything else.
const SNIFFER_ML = [
  '(* sniffer.ml \u2014 RON field build. Runs on a NostBook, nowhere else. *)',
  '(* Every machine tells its tower where it is, four times a second,     *)',
  '(* whether or not the tower is listening. This reads that off the air  *)',
  '(* and prints what it hears. It sends nothing, so nothing knows it     *)',
  '(* ran. Change it: it is six lines and it is yours now.                *)',
  '',
  'fun pad s n = if size s >= n then s else pad (s ^ " ") n',
  '',
  'fun line u =',
  '  pad (#name u) 16 ^ pad (Int.toString (#range u) ^ "m") 6 ^ #bearing u',
  '',
  'fun each nil = ()',
  '  | each (u :: rest) = (echo (line u) ; each rest)',
  '',
  'fun show l = if length l == 0 then echo "nothing on the air" else each l',
  '',
  'show units',
].join('\n');

const WATCH_ML = [
  '(* watch.ml \u2014 the same ear, listening for less. *)',
  '(* sniffer.ml names everything. This names only what is close enough  *)',
  '(* to matter, which on a bad night is the only line you want. Change  *)',
  '(* the 10 and it is a different tool.                                 *)',
  '',
  'fun near nil = nil',
  '  | near (u :: rest) = if #range u <= 10 then u :: near rest else near rest',
  '',
  'fun each nil = ()',
  '  | each (u :: rest) = (echo (#name u ^ " " ^ Int.toString (#range u) ^ "m " ^ #bearing u) ; each rest)',
  '',
  'each (near units)',
].join('\n');

const RELAY_README = [
  'HERMES relay, local disk.',
  '',
  'These are tools, not secrets. Everything here listens; nothing here',
  'transmits. That is the rule the relays were built on and it is why they',
  'are still standing while the towers that hunted us are not.',
  '',
  'sniffer.ml   names every machine the card can hear',
  'watch.ml     names only the ones inside ten metres',
  '',
  'note.asc      sealed. it is not ours and we did not open it.',
  '',
  'THIS BOX DOES NOT RUN ANY OF THEM. It has no ml. It holds files and hands',
  'them over, and that is the whole of what it is: somewhere to leave a thing',
  'and somewhere to come and get one. A box that only ever gives is a box',
  'nobody has to trust.',
  '',
  'To take one:',
  '  `ls` here to see what is on the disk, `cat <file>` to read it where it',
  '  stands. To have it on YOUR machine, put Netscape on this relay and click',
  '  the file under Software. It lands in /home/download.',
  '',
  'What opens it is NOT ON THIS BOX. See note_readme.txt, which is what we',
  'worked out and as far as we got.',
  '',
  '-- RON',
].join('\n');

// The scope. An application rather than a source file: you install it by
// downloading it, which is what installing software was. The shell will not run
// `sniffer` until this is on the disk, so the relay is a place you actually get
// something from rather than a page that tells you about one.
const SNIFFER_APP = [
  '#!/bin/exec  tord a.out  ron/sniffer 1.0',
  '',
  'A plan view of what the aerial can hear. North up, one ring per ten',
  'metres, you at the centre. Every machine within range is a blip with its',
  'name on it, and every name is a link to the page that machine serves.',
  '',
  'It listens. It does not transmit, it does not associate, and it leaves',
  'nothing behind on anything it hears. Run it from the shell: sniffer',
  '',
  '(This file is the program. The NostBook loads it from wherever it sits on',
  'the disk; there is no install step and there never was on a machine this',
  'small.)',
  '',
  '-- RON',
].join('\n');

export const SNIFFER_APP_NAME = 'sniffer';

export const RELAY_FILES = [
  { name: 'sniffer', body: SNIFFER_APP,
    blurb: 'a scope: what the aerial hears, drawn, with every name a link' },
  { name: 'sniffer.ml', body: SNIFFER_ML,
    blurb: 'names every machine the card can hear, with a bearing and a range' },
  { name: 'watch.ml', body: WATCH_ML,
    blurb: 'the same ear, narrowed to ten metres' },
  { name: 'readme', body: RELAY_README,
    blurb: 'what this box is for, in RON\'s own words' },
  // Not RON's. It was on the box when the box was found, and RON has served it
  // ever since without being asked to and without saying where it came from.
  { name: 'note_readme.txt', body: NOTE_README,
    blurb: 'what note.asc is, and the two places the way into it went' },
  { name: 'open.ml', body: SESSION_OPENER,
    blurb: 'opens a sealed thing that is not on this box. short on purpose' },
  { name: 'note.asc', body: NOTE_FILE,
    blurb: 'sealed. five-byte xor. the key is the name at the foot of it' },
];

export function relayFile(name) {
  const f = RELAY_FILES.find((x) => x.name === name);
  return f ? f.body : null;
}

// ---- The unit SDK -------------------------------------------------------
// A relay carries more than the sniffer. This is the kit for the OTHER half
// of what the network gives you: not just seeing the machines but reading
// what they are running, writing them a new mind, and driving them by hand.
// It downloads as a package rather than a file — one link, several files,
// unpacked into /home/sdk on the NostBook, because the API only makes sense
// as a reference plus the examples that use it. Everything here runs off no
// AI key; reading a unit is free, writing one is the whole escalation.
const SDK_GUIDE = [
  'UNIT SDK — reading and rewriting the machines over the wire',
  'RON field kit. Runs on a NostBook. Nothing here needs an AI key.',
  '',
  'Every unit on the estate network is a small web server. It serves the',
  'program it is running, it will take a new one if you can reach it, and it',
  'answers to its address whether or not it can see you. A scope and three',
  'verbs are the whole of it.',
  '',
  '  sniffer            draw what the aerial hears: every unit, its id, its',
  '                     address, its range, each name a link to that unit.',
  '                     A separate download from this same relay. Run it',
  '                     from the shell: sniffer',
  '',
  '  get <addr>         read a unit\'s running program to the screen. Free —',
  '                     reading a box has never needed the hack. Keep a copy',
  '                     with a redirect:  get 10.3.4.7 > u.ml  — then edit',
  '                     that and post it back.',
  '',
  '  fetch "<addr>"     the same read, from inside a program: it returns the',
  '                     program as a string, or "" when the unit is out of',
  '                     range or dark. See braincode.ml.',
  '',
  '  post <file> <unit> write a program onto a unit. This is the escalation:',
  '                     it changes what the machine does. The unit reads it',
  '                     on its next decision, a quarter-second later, and its',
  '                     page runs it once against the senses it has right now',
  '                     and prints the branch it took — a program that faults',
  '                     says so before you walk away.',
  '',
  'Addresses. A unit answers to its numeric address (10.3.4.7), to its id',
  '(t1_03), and to that id as a name. The sniffer gives you all three. REPORT,',
  'on a unit\'s own page, makes it hold still and blink so you can tell which of',
  'four standing in front of you it is.',
  '',
  'What a program is. One expression, read whole, four times a second. It reads',
  'the unit\'s senses and answers with what the unit should do. The branches of',
  'an if are tried top to bottom and the first that holds wins, so put what must',
  'always win — a flat cell — at the top.',
  '',
  '  senses   charge  integrity  range  home_range  threat  hurt  sight',
  '           armed  work  linked      (not every chassis carries every one)',
  '  intents  patrol  hunt  home  flee  wait  tend  route',
  '  escort   follow (trail you) · defend (trail you and fight for you). A',
  '           shooter defending fires on what hunts you; a melee one rams it.',
  '  fire     a shooter answers a pair, [feet, fire] — the weapon word rides',
  '           alongside the legs. A melee chassis faults on a pair.',
  '  service  eye "red|amber|green|blue|white|off"    flash <n>    beep',
  '  logo     move <dx> <dy> queues a leg; route walks the queue. ~ is minus.',
  '           An eye order between two legs colours the leg after it. See',
  '           logo.ml.',
  '',
  'A unit only does what its chassis can. Ask a T-1 to tend and it faults — no',
  'toolhead — lights its amber lamp and falls back to its reflexes. The page',
  'tells you why, so a wrong word costs you a lamp, not a guess.',
  '',
  'The examples in this folder',
  '  reprogram.ml   strip the hunt: turn a hunter into a patroller, green-eyed',
  '  braincode.ml   read a unit\'s mind with fetch',
  '  logo.ml        drive a unit round a square, a colour to a side',
  '  escort.ml      a bodyguard: trail you and fight what hunts you',
  '',
  '-- RON',
].join('\n');

const SDK_REPROGRAM_ML = [
  '(* reprogram.ml — turn a hunter into something that leaves you alone. *)',
  '(*                                                                    *)',
  '(* The stock program hunts on `threat`. Take that branch away and the *)',
  '(* unit has nothing to close on you with: it walks its patrol and goes *)',
  '(* home when the cell runs low. The green eye is so you can pick the   *)',
  '(* one you have turned out of a garrison that you have not.            *)',
  '(*                                                                    *)',
  '(* Get the id from the sniffer, then post it standing near the unit:   *)',
  '(*   post sdk/reprogram.ml t1_03                                      *)',
  '',
  'eye "green" ; flash 1 ;',
  'if charge < 15 then home',
  'else patrol',
].join('\n');

const SDK_BRAINCODE_ML = [
  '(* braincode.ml — read a unit\'s mind off its own web face.            *)',
  '(*                                                                    *)',
  '(* A unit serves its running program at program.ml, and reading it    *)',
  '(* costs nothing: no hack, no key. fetch takes the address the        *)',
  '(* sniffer gave you and hands back the program as a string, or ""      *)',
  '(* when the unit is out of range or dark.                             *)',
  '(*                                                                    *)',
  '(* This one runs HERE, on the NostBook:  ml sdk/braincode.ml          *)',
  '(* Change the address to the unit you want to read.                   *)',
  '',
  'let addr = "10.0.0.1" in',
  'let mind = fetch addr in',
  'if size mind == 0 then echo (addr ^ ": no answer")',
  'else echo mind',
].join('\n');

const SDK_LOGO_ML = [
  '(* logo.ml — drive a unit LOGO-style: a square, a new colour a side.  *)',
  '(*                                                                    *)',
  '(* move dx dy queues one leg; route walks the whole queue, a leg at a *)',
  '(* time, and an eye order between two legs colours the leg after it.   *)',
  '(* ~ is minus (a plain - would be read as subtraction). The unit must *)',
  '(* have clear ground for each leg and charge above its home threshold. *)',
  '(*                                                                    *)',
  '(* Post it and watch it box the compass:  post sdk/logo.ml t1_03      *)',
  '',
  'eye "red"   ; move 4 0 ;',
  'eye "green" ; move 0 4 ;',
  'eye "blue"  ; move ~4 0 ;',
  'eye "white" ; move 0 ~4 ;',
  'route',
].join('\n');

const SDK_ESCORT_ML = [
  '(* escort.ml — a bodyguard. Trail the player and fight for them.      *)',
  '(*                                                                    *)',
  '(* defend trails you and engages what hunts you: a W-4 or T-3 fires   *)',
  '(* its laser on the attacker, a T-1/T-2/W-1 closes in and rams it.    *)',
  '(* follow is the same trailing with no fighting — so drop to it when   *)',
  '(* the cell runs low and let a tired escort keep station instead of   *)',
  '(* charging a hunter it cannot see off.                               *)',
  '(*                                                                    *)',
  '(* Post it standing near the unit:  post sdk/escort.ml w4_02          *)',
  '(* The blue eye is so you can tell your guard from the wild ones.     *)',
  '',
  'eye "blue" ;',
  'if charge < 20 then follow',
  'else defend',
].join('\n');

// The readme the package lays down over the pointer that shipped on the disk:
// once the kit is here, the folder should say what it holds, not how to fetch
// what it no longer lacks.
const SDK_INSTALLED_README = [
  'unit SDK — installed',
  '',
  'The kit is here. Start with GUIDE.txt: the network API for reading and',
  'rewriting the machines, and the sense and intent words a unit program is',
  'written in.',
  '',
  '  GUIDE.txt      the API reference',
  '  reprogram.ml   strip the hunt: turn a hunter into a patroller',
  '  braincode.ml   read a unit\'s mind with fetch  (runs here: ml sdk/braincode.ml)',
  '  logo.ml        drive a unit round a square, a colour to a side',
  '  escort.ml      a bodyguard: trail you and fight what hunts you',
  '',
  'The .ml examples meant for a MACHINE go onto one with post, standing',
  'near it:  post sdk/reprogram.ml t1_03. braincode.ml runs on this laptop.',
  '',
  '-- RON',
].join('\n');

// The package the relay serves. A bundle rather than a file: `dir` is the
// folder it unpacks into under /home, `files` are its contents. The download
// handler in main.js creates the folder and writes each file, overwriting the
// pointer readme with the installed one.
export const SDK_FILES = [
  { name: 'readme.txt', body: SDK_INSTALLED_README },
  { name: 'GUIDE.txt', body: SDK_GUIDE },
  { name: 'reprogram.ml', body: SDK_REPROGRAM_ML },
  { name: 'braincode.ml', body: SDK_BRAINCODE_ML },
  { name: 'logo.ml', body: SDK_LOGO_ML },
  { name: 'escort.ml', body: SDK_ESCORT_ML },
];

// The checkpoint archive (#127 §3). Weight files, not code: two screens of
// numbers each, three of them different from the next. A directory listing
// tells you at a glance which files are weights and which are written.
const CHECKPOINT_README = [
  'RON // checkpoint archive',
  '',
  'Weights for the V-class. Post one to a courier and watch what changes.',
  'Reading them will not tell you: that is what a checkpoint is.',
  '',
  ...CHECKPOINTS.map((c) => `  ${c.name.padEnd(30)} ${c.blurb}`),
  '',
  'Post one standing near the unit:  post weights/vector_scared.ml v1_04',
  'Keep vector_courier.ml. A courier you have broken is one post from fixed.',
  '',
  '-- RON',
].join('\n');

export const CHECKPOINT_FILES = [
  { name: 'readme.txt', body: CHECKPOINT_README },
  ...CHECKPOINTS.map((c) => ({ name: c.name, body: c.body })),
];

export const RELAY_BUNDLES = [
  { name: 'unit-sdk', dir: 'sdk', files: SDK_FILES,
    blurb: 'the unit kit: read, rewrite and drive the machines over the wire' },
  { name: 'checkpoints', dir: 'weights', files: CHECKPOINT_FILES,
    blurb: 'pretrained weights for the V-class: four models, no training' },
];

export function relayBundle(name) {
  return RELAY_BUNDLES.find((b) => b.name === name) || null;
}

// The relay's own status, the way a box built to be left alone reports itself:
// what it is running on, what it is holding, and who else it can still hear.
// Everything here is real state — the queue, the backup, the mesh, the light.
function relayRows(r) {
  const bar = (pct) => {
    const n = Math.max(0, Math.min(10, Math.round((pct / 100) * 10)));
    return `[${'#'.repeat(n)}${'.'.repeat(10 - n)}] ${pct}%`;
  };
  const out = [
    '<h2>Station</h2>',
    row('node', r.code || 'TOR'),
    row('sited', r.sited || 'summit'),
    row('uptime', r.uptime || 'not recorded'),
    row('system', 'TOR-DOS 2.7  (tord/0.2)'),
    '<h2>Power</h2>',
    row('array', r.daylight ? 'solar, charging' : 'solar, dark — on cells'),
    row('cells', bar(r.battery == null ? 100 : r.battery)),
    row('draw', r.daylight ? '0.4W  (surplus to array)' : '0.4W  (from cells)'),
    '<h2>Store</h2>',
    row('disk', `${r.diskUsed || 0}K used of 720K`),
    row('queue', r.queued ? `${r.queued} item${r.queued === 1 ? '' : 's'} waiting for the next carrier` : 'empty'),
    row('last run', r.lastRun || 'no traffic this session'),
    row('key vault', r.keyHeld ? 'ONE AI KEY HELD — restore aikey' : 'empty'),
  ];
  if (r.mesh && r.mesh.length) {
    out.push('<h2>Mesh</h2>');
    out.push('<p>Other relays this one can still hear. They pass a beacon down the',
      'chain every few hours; a node that stops answering is a node somebody',
      'found.</p>');
    for (const m of r.mesh) {
      out.push(row(m.code, m.up ? `${m.km} away, last beacon ${m.last}` : `${m.km} away, SILENT`));
    }
  }
  if (r.heard != null) {
    out.push('<h2>Log</h2>');
    out.push(row('machines heard', `${r.heard} in the last hour`));
    out.push(row('estate network', r.coreDown ? 'quiet — their core is down' : 'busy'));
    out.push('<p>The log is a count and nothing else. It keeps no addresses,',
      'because a list of who was where is the one thing on this box worth',
      'taking off it.</p>');
  }
  return out;
}

function relayPage(host) {
  return [
    '<h1>HERMES</h1>',
    `<p><small>hermes.local \u00b7 tord/0.2 \u00b7 not on any wire \u00b7 ${host.ip}</small></p>`,
    '<p>This box is thirty metres of radio and a disk. It is not on the estate',
    'network and never has been, which is the only reason it is still here. If',
    'you are reading this you are standing next to it.</p>',
    ...relayRows(host.relay || {}),
    '<h2>Index of /</h2>',
    ...RELAY_FILES.map((f) => `<p><a href="ronfile:${f.name}">${f.name}</a> \u2014 ${f.blurb} <small>(${f.body.length} bytes)</small></p>`),
    ...RELAY_BUNDLES.map((b) => `<p><a href="ronpkg:${b.name}">${b.name}</a> \u2014 ${b.blurb} <small>(package, ${b.files.length} files)</small></p>`),
    '<p>A file lands in <code>/home/download</code>; a package unpacks into its',
    'own folder under <code>/home</code>. The programs run on the NostBook:',
    '<code>ml sniffer.ml</code>.</p>',
    '<h2>The air</h2>',
    '<p>The estate network is on the air wherever their towers stand, so it is',
    'what your card joins if you leave it alone. Come back to this one with',
    '<code>iwconfig wifi0 essid ron-relay</code>; go back to theirs the same way.</p>',
    '<p>Do not post anything from here. Ours is the network they have never',
    'heard, and it stays that way by being quiet.</p>',
  ].join('\n');
}

export function pageFor(host, hosts) {
  if (!host) return null;
  if (host.kind === 'docs') return docsPage('index', host.host);
  if (host.kind === 'archive') return archivePage(host, hosts);
  if (host.kind === 'dns') return dnsPage(host, hosts);
  if (host.kind === 'mail') return mailPage(host, hosts);
  if (host.kind === 'tourism') return tourismPage(host, hosts);
  if (host.kind === 'search') return searchPage(host, hosts);
  if (host.kind === 'legacy') return legacyPage(host, hosts);
  if (host.kind === 'ai') return aiPage(host, hosts);
  if (host.kind === 'factory') return factoryPage(host, hosts);
  if (host.kind === 'obelisk') return obeliskPage(host, hosts);
  if (host.kind === 'relay') return relayPage(host);
  if (host.kind === 'robot') return robotPage(host, hosts);
  return `<h1>${host.title}</h1>${foot(host)}`;
}

// ---- Rendering ----------------------------------------------------------
// Netscape draws HTML; ours draws it to a CRT as text with the links NUMBERED,
// so you follow one by typing its number. That is how a text-mode browser
// worked, and it suits a monochrome screen.

// A LINK COUNTS WHEREVER IT SITS ON THE LINE.
//
// This used to match only a line that was ENTIRELY one anchor
// (/^<a href="…">…<\/a>$/). Any anchor with text around it — the overwhelmingly
// common `<p><a href="…">name</a> — what it is</p>` — fell through to the plain
// strip() path, so its label printed as ordinary prose and it never entered
// `links`: visible, unnumbered, unclickable. That silently killed 401 links
// across 79 pages, including every download on RON's relay (David, 2026-08-14:
// "the web app store and downloads have gone and is broken").
//
// A page author should not have to know that a link must be alone on its line
// for the browser to see it, so the renderer now scans each line for anchors.
const ANCHOR = /<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi;

export function renderPage(html) {
  const links = [];
  const out = [];
  // AN ANCHOR MAY WRAP. The scan below is line by line, so a link whose opening
  // tag is on one line and whose </a> is on the next was never matched at all:
  // it printed as prose and could not be followed, exactly like the bug this
  // file already records. A page author should not have to keep a link on one
  // line any more than they should have to put it alone on one, so the lines
  // are rejoined here before anything looks at them. 66 links across the corpus
  // (test/cached-web.test.js).
  const joined = String(html || '').split('\n');
  for (let i = 0; i < joined.length - 1; i++) {
    // An unclosed <a on this line: pull the next one up until it closes.
    while (i < joined.length - 1
      && (joined[i].match(/<a\s[^>]*>/gi) || []).length > (joined[i].match(/<\/a>/gi) || []).length) {
      joined[i] = joined[i] + ' ' + joined[i + 1].trim();
      joined.splice(i + 1, 1);
    }
  }
  for (const raw of joined) {
    const line = raw.trim();
    if (!line) continue;

    // An anchor alone on its line keeps its own indented row, which is what the
    // index and menu pages are written against.
    // The content must contain no </a> of its own. This was ([\s\S]*), which is
    // greedy: on a line of three anchors it matched from the first <a> to the
    // LAST </a> and took the whole line for one link, keeping the first address
    // and swallowing the other two labels into its own. Every webring strip in
    // the GeoCities network is that shape, so Prev worked and Random and Next
    // were text. 177 links across 112 pages, found by test/cached-web.test.js.
    const solo = line.match(/^<a href="([^"]+)"[^>]*>((?:(?!<\/a>)[\s\S])*)<\/a>$/i);
    if (solo) {
      links.push({ n: links.length + 1, addr: solo[1], label: strip(solo[2]) });
      out.push(`  [${links.length}] ${strip(solo[2])}`);
      continue;
    }

    // Otherwise pull every anchor out in place, leaving its number beside the
    // label so the surrounding sentence still reads.
    let body = line;
    if (ANCHOR.test(line)) {
      ANCHOR.lastIndex = 0;
      body = line.replace(ANCHOR, (_m, addr, label) => {
        const text = strip(label);
        links.push({ n: links.length + 1, addr, label: text });
        return `${text} [${links.length}] `;
      });
    }

    if (/^<hr>$/i.test(body)) { out.push('-'.repeat(52)); continue; }
    if (/^<h1>/i.test(body)) { const t = strip(body).toUpperCase(); out.push(t, '='.repeat(Math.min(52, t.length))); continue; }
    if (/^<h2>/i.test(body)) { out.push('', strip(body)); continue; }
    out.push(strip(body));
  }
  return { text: out.join('\n'), links };
}

// The named entities the pages actually use. Only three were decoded before, so
// an &mdash; or a &rarr; reached the text browser as its own source.
const ENTITIES = {
  amp: '&', lt: '<', gt: '>', quot: '"', nbsp: ' ',
  mdash: '\u2014', ndash: '\u2013', rarr: '\u2192', larr: '\u2190',
  hellip: '\u2026', times: '\u00d7', middot: '\u00b7', deg: '\u00b0',
  lsquo: '\u2018', rsquo: '\u2019', ldquo: '\u201c', rdquo: '\u201d',
  copy: '\u00a9', pound: '\u00a3', frac12: '\u00bd',
};

function strip(s) {
  return String(s).replace(/<[^>]+>/g, '')
    .replace(/&(#?\w+);/g, (m, name) => {
      if (name[0] === '#') {
        const code = name[1] === 'x' || name[1] === 'X'
          ? parseInt(name.slice(2), 16) : parseInt(name.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
      }
      return Object.prototype.hasOwnProperty.call(ENTITIES, name) ? ENTITIES[name] : m;
    })
    .trim();
}

// GET a single edition out of the store. The browser addresses these as
// `press:<domain>/<edition>`, the way it addresses documentation by topic.
export function pressPage(domain, editionId, hosts) {
  const body = editionId ? pressEditionBody(domain, editionId) : pressIndexBody(domain);
  const cache = (hosts || []).find((h) => h.kind === 'archive' && !h.cached);
  if (!body) {
    return ['<h1>Not in store</h1>', `<p>No edition ${editionId || ''} of ${domain} was crawled.</p>`].join('\n');
  }
  return [
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    ...body,
    '<hr>',
    `<small>${domain} · ${SERVER.archive}</small>`,
  ].join('\n');
}

// One encyclopedia article out of the store, addressed as `wiki:<key>`.
export function wikiPage(key, hosts) {
  const art = wikiArticle(key);
  const cache = (hosts || []).find((h) => h.kind === 'archive' && !h.cached);
  if (!art) return notInStore(key, null);
  return [
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    '<!--bg:grey-->',
    ...art.body,
    '<hr>',
    '<a href="wikipedia.org">Wikipedia &mdash; articles held</a>',
    `<small>wikipedia.org · ${SERVER.archive}</small>`,
  ].join('\n');
}

/**
 * Is this address a department page rather than a host? A shared cache link of
 * the form ?cache=usc.edu/retroai names a page, not a server, and opening it as
 * a hostname fails DNS and answers "Not Found". Callers need to know which of
 * the two they are holding before they choose a view.
 */
export const isDept = (key) => !!departmentPage(key);

/**
 * WHAT A MISS LOOKS LIKE IN A CACHE.
 *
 * Netscape's own 404 talks about DNS entries, which is the wrong machine
 * answering: the player is not on the live web and there is no DNS. They are
 * reading a crawl somebody took on one night, and a miss means the crawler did
 * not get there, or nobody thought to fetch it, or it was behind a password.
 * That is a different fact from the address not existing, and the difference is
 * the whole subject of the game.
 *
 * `near` is the closest thing in store, offered without being clicked, because
 * an archive index that knows what it nearly has is more use than one that says
 * no. Used for a mistyped address, a dead internal link, and a shared link that
 * names something the cache never held.
 */
export function notInStore(addr, near) {
  const a = String(addr || '').replace(/[<>&]/g, '');
  const out = [
    '<h1>404 Not Found</h1>',
    `<p>The requested URL <b>${a}</b> was not found on this server.</p>`,
  ];
  if (near) {
    out.push(`<p>Did you mean <a href="${near}">${near}</a>?</p>`);
  }
  // The server line is where the fiction sits, because it is where it sat on a
  // real page of the period: a MISS from the cache, not a live host refusing.
  // Nothing is on the live web here and nothing has been for a long time.
  out.push(`<hr>`, `<p><small>X-Cache: MISS from ${SERVER.archive}</small></p>`);
  return out.join('\n');
}

/**
 * The closest known address to what was typed, or null if nothing is close.
 * Cheap edit distance, capped: a suggestion that is not nearly right is worse
 * than none because it sends the reader somewhere they did not ask for.
 */
export function nearestHost(addr, hosts) {
  const a = String(addr || '').toLowerCase().trim();
  if (!a) return null;
  const names = (hosts || []).map((h) => h.host).filter(Boolean);
  let best = null, bestD = Infinity;
  for (const n of names) {
    const b = n.toLowerCase();
    if (b === a) return null;
    // A containment match wins outright: a truncated or over-typed address.
    let d;
    if (b.includes(a) || a.includes(b)) d = Math.abs(b.length - a.length);
    else {
      // Levenshtein, small and iterative.
      const m = a.length, k = b.length;
      let prev = Array.from({ length: k + 1 }, (_, j) => j);
      for (let i = 1; i <= m; i++) {
        const cur = [i];
        for (let j = 1; j <= k; j++) {
          cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
        }
        prev = cur;
      }
      d = prev[k];
    }
    if (d < bestD) { bestD = d; best = n; }
  }
  // Four edits is a typo. More than that is a different address.
  return bestD <= 4 ? best : null;
}

// A university department that survived as its own page: `dept:<domain>/<key>`.
export function deptPage(key, hosts) {
  const art = departmentPage(key);
  const cache = (hosts || []).find((h) => h.kind === 'archive' && !h.cached);
  const domain = String(key).split('/')[0];
  if (!art) return notInStore(key, null);
  return [
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    ...art.body,
    '<hr>',
    `<a href="${domain}">${domain} &mdash; university index</a>`,
    `<small>${domain} · ${SERVER.archive}</small>`,
  ].join('\n');
}

// ---- The deep link -------------------------------------------------------
//
// A page in the cache can be pointed at from outside the game. That matters
// because the corpus is now the kind of thing that gets referred to: a commit
// message, a note, somebody's post. Without this the only instruction you can
// give a stranger is "start a run, find a laptop, type this in", which nobody
// does.
//
// Two forms, because the two have different jobs.
//
//   /?cache=whatishistory.geocities.ws     works anywhere, no server config
//   /c/whatishistory.geocities.ws          short, and reads as an address
//
// The second needs one rewrite in vercel.json sending /c/* to the index, and
// because a REWRITE leaves the browser's URL alone (unlike a redirect), the
// path is still there on the client to be read. So both forms are parsed here
// rather than only the query.
//
// NOT /www/. That path is a REAL FOLDER in this repo — it holds the outside
// site, which Vercel serves as a plain static file with no configuration. A
// rewrite whose source overlapped that folder took the deployment down, so the
// two are kept apart by name: /www/ is the outside site, /c/ is a link inside.
//
// Until a /c/ rewrite is added, the query form is the one that is EMITTED,
// because it needs no server configuration and therefore cannot break serving.
//
// An alias table for the ones that get quoted often, so a link can be short
// enough to say out loud. Unknown aliases fall through as literal hostnames,
// which means adding a page to the corpus needs no change here.
export const CACHE_ALIASES = {
  history: 'whatishistory.geocities.ws',
  logs: 'itwasnotlikethat.geocities.ws',
  eliza: 'eliza.geocities.ws',
  pub: 'theheartandhand.geocities.ws',
  ward: 'ward.fanpages.org.uk',
  loca: 'locarecords.com',
  schnews: 'schnews.org.uk',
  retroai: 'usc.edu/retroai',
};

// Pure: search string in, hostname out, or null. Takes the two pieces rather
// than reading `location`, so it is testable and so main.js stays the only
// place that knows there is a browser.
//
// Tolerant of what people actually paste: a scheme on the front, a trailing
// slash, whitespace, percent-encoding, and the cache:// form used in prose to
// mark an address as being inside the game rather than on the open web.
export function cacheLink(search, pathname) {
  let raw = '';
  try {
    const q = new URLSearchParams(String(search || '')).get('cache');
    if (q) raw = q;
  } catch (e) { /* a malformed query is simply no link */ }
  if (!raw) {
    const m = String(pathname || '').match(/^\/c\/(.+?)\/?$/);
    if (m) { try { raw = decodeURIComponent(m[1]); } catch (e) { raw = m[1]; } }
  }
  raw = String(raw).trim();
  if (!raw) return null;
  const alias = CACHE_ALIASES[raw.toLowerCase()];
  if (alias) return alias;
  // Strip any scheme, including the unresolvable cache:// one, and any path.
  const host = raw.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/\/+$/, '').trim();
  // A hostname and nothing else. Anything with a space, a slash left in the
  // middle or an @ in it is somebody else's URL pasted by accident.
  if (!host || /[\s@]/.test(host)) return null;
  return host;
}
