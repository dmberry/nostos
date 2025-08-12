// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// The web — what is left of it (docs/laptop-plan.md §8b).
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

import { islandProfile } from './islands.js';
import { docsPage, docTitle, DOC_TOPICS } from './ml-docs.js';
import { CACHE_SUB, ARCHIVED_SITES, archivedSite, archivedDomains, stubBody, CATEGORIES, categoryOf } from './archive.js';
import { pressDomains, pressPaper, isPaper, pressIndexBody, pressEditionBody } from './press.js';
import { wikiArticle, departmentPage } from './archive.js';

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
    });
  }

  (world.obelisks || []).forEach((ob, i) => {
    const code = String(ob.code || `ob_${i + 1}`);
    hosts.push({
      ip: ipFor(idx, 'obelisk', i + 1), host: `${lc(code)}.${dom}`, kind: 'obelisk',
      name: code, title: `NODE ${code}`, code, down: !!ob.down, ref: ob,
    });
  });

  (world.robots || []).forEach((r, i) => {
    const id = String(r.id || `unit_${i + 1}`);
    hosts.push({
      ip: ipFor(idx, 'robot', i + 1), host: `${lc(id)}.${dom}`, kind: 'robot',
      name: id, title: `UNIT ${id.toUpperCase()}`, type: lc(r.type, '?'),
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
      row('state', r.fault ? `FAULTED — ${r.fault}` : `running${r.intent ? ` — ${r.intent}` : ''}`),
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

// GET /program.ml — the machine's reasoning, served as the plain text it is.
// Not a description of the program and not a copy kept for the record: this IS
// the string the unit evaluates, four times a second, to decide what to do.
export function programPage(host, hosts, opts = {}) {
  const r = host.ref || {};
  const src = String(host.program || '');
  const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const docs = (hosts || []).find((h) => h.kind === 'docs');
  return [
    `<h1>${host.name} · program.ml</h1>`,
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
      : `<p>Running${r.intent ? `. Last decision: <b>${esc(String(r.intent))}</b>` : ''}.</p>`,
    '<p>The words this unit answers to are its own: what it can sense, and what',
    'it can be told to do. Anything else evaluates, and then faults.</p>',
    row('sensors', 'charge · integrity · range · home_range · threat · hurt · linked · blight · daylight'),
    row('fire control', 'sight · armed · shielded · contact · lost_for'),
    row('intents', 'patrol · hunt · home · flee · tend · wait'),
    row('weapon', 'fire · hold · reload — answer [hunt, fire] to say both at once'),
    row('service', 'beep · eye &lt;colour&gt; · flash &lt;rate&gt;'),
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
        '<p><small>A program that will not run is not refused: the machine accepts it, faults, and stands there with its lamp flashing amber.</small></p>',
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
    '<p>SEARCH FOR: [________________________________]  type:  search &lt;words&gt;</p>',
    '<p><small>Example: how precisely will the new millennium begin?</small></p>',
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
    const hay = [h.host, h.name, h.title, h.kind, h.type, h.homeCode, h.cat,
      h.tour && [h.tour.place, h.tour.tag, h.tour.welcome, h.tour.culture, h.tour.climate, ...(h.tour.tips || []), ...(h.tour.facts || [])].join(' '),
      h.legacy && [h.legacy.org, h.legacy.was, ...(h.legacy.frags || []), ...(h.legacy.notices || [])].join(' '),
    ].filter(Boolean).join(' ').toLowerCase();
    return words.every((w) => hay.includes(w));
  };
  const found = words.length ? hosts.filter(hit) : [];
  return [
    '<h1>ALTAVISTA</h1>',
    `<p>Results for: ${q || '(nothing)'}</p>`,
    `<p>About ${found.length} document(s) found. Index last rebuilt 14/03.</p>`,
    '<hr>',
    ...(found.length ? found.map((h) => link(h, `${h.name} — ${h.host}${h.down ? '  [host not responding]' : ''}`))
      : ['<p>No documents match the query.</p>',
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
export function bookmarksPage(hosts, agent = 'Netscape Navigator 1.1') {
  const search = hosts.find((h) => h.kind === 'search');
  const tour = hosts.find((h) => h.kind === 'tourism');
  return [
    '<h1>BOOKMARKS</h1>',
    `<p>${agent} — bookmarks.htm</p>`,
    '<hr>',
    search ? link(search, 'AltaVista — search the web') : '',
    tour ? link(tour, `${tour.place} Tourist Board — before you travel`) : '',
    (hosts.find((h) => h.kind === 'docs')) ? link(hosts.find((h) => h.kind === 'docs'), 'AI-ML — engineering documentation') : '',
    // ONE addition, deliberately: a bookmark list is somebody's habits, not a
    // directory (New&Cool is the directory). The cache earns the slot because
    // it is the one address that leads to all the rest.
    (hosts.find((h) => h.kind === 'archive' && !h.cached))
      ? link(hosts.find((h) => h.kind === 'archive' && !h.cached), 'cache — the old Net, as stored') : '',
    // Somebody's habits, and this is the one everybody had. The front page is a
    // list of rooms; whoever owned this machine had been going into one of them
    // most nights.
    // `host`, not `domain` — the cache's entries key the address under `host`
    // and a `.domain` that is never set is undefined for every one of them, so
    // the find failed silently and the bookmark simply was not there.
    (hosts.find((h) => h.host === 'reddit.com'))
      ? link(hosts.find((h) => h.host === 'reddit.com'), 'reddit — the front page') : '',
    '<hr>',
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
  'Both run on a NostBook: ml sniffer.ml. They read the same air `arp -a`',
  'reads. Read them before you run them; they are short on purpose.',
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
];

export function relayFile(name) {
  const f = RELAY_FILES.find((x) => x.name === name);
  return f ? f.body : null;
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
    '<p>Saved files land in <code>/home/download</code>. The programs run on the',
    'NostBook: <code>ml sniffer.ml</code>.</p>',
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

export function renderPage(html) {
  const links = [];
  const out = [];
  for (const raw of String(html || '').split('\n')) {
    const line = raw.trim();
    if (!line) continue;
    const a = line.match(/^<a href="([^"]+)">(.*)<\/a>$/i);
    if (a) {
      links.push({ n: links.length + 1, addr: a[1], label: strip(a[2]) });
      out.push(`  [${links.length}] ${strip(a[2])}`);
      continue;
    }
    if (/^<hr>$/i.test(line)) { out.push('-'.repeat(52)); continue; }
    if (/^<h1>/i.test(line)) { const t = strip(line).toUpperCase(); out.push(t, '='.repeat(Math.min(52, t.length))); continue; }
    if (/^<h2>/i.test(line)) { out.push('', strip(line)); continue; }
    out.push(strip(line));
  }
  return { text: out.join('\n'), links };
}

function strip(s) {
  return String(s).replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').trim();
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
  if (!art) return ['<h1>Not in store</h1>', `<p>No article "${key}" was crawled.</p>`].join('\n');
  return [
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    '<!--bg:grey-->',
    ...art.body,
    '<hr>',
    '<a href="wikipedia.org">Wikipedia &mdash; articles held</a>',
    `<small>wikipedia.org · ${SERVER.archive}</small>`,
  ].join('\n');
}

// A university department that survived as its own page: `dept:<domain>/<key>`.
export function deptPage(key, hosts) {
  const art = departmentPage(key);
  const cache = (hosts || []).find((h) => h.kind === 'archive' && !h.cached);
  const domain = String(key).split('/')[0];
  if (!art) return ['<h1>Not in store</h1>', `<p>No department "${key}" was crawled.</p>`].join('\n');
  return [
    `<small>X-Cache: HIT from ${cache ? cache.host : 'cache'}</small>`,
    ...art.body,
    '<hr>',
    `<a href="${domain}">${domain} &mdash; university index</a>`,
    `<small>${domain} · ${SERVER.archive}</small>`,
  ].join('\n');
}
