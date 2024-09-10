// The web (docs/laptop-plan.md §8b): addresses, the host table, the org-chart of
// links the machines serve, and the text render Netscape draws. Pure module.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hostTable, findHost, pageFor, renderPage, searchResults, bookmarksPage, whatsNewPage, docsPage, programPage, DOC_TOPICS, ipFor, aiIp, domainFor, spoofedAddr, IFACE } from '../src/game/net.js';

const world = () => ({
  islandId: 'ogygia',
  daemon: 'calypso',
  coreDown: false,
  obelisks: [
    { code: 'OB_1A2B', cls: 'standard', circuitNum: 3, blightR: 4.25, down: false },
    { code: 'OB_3C4D', cls: 'siren', circuitNum: null, blightR: 0, down: true },
  ],
  factory: { down: false },
  robots: [
    { id: 'W4_07', type: 'w4', battery: 0.62, homeCode: 'OB_1A2B', down: false },
    { id: 'T1_02', type: 't1', battery: 0.10, homeCode: 'OB_1A2B', down: true },
    { id: 'W5_01', type: 'w5', battery: 0.90, homeCode: 'OB_3C4D', down: false, gardener: true },
    // A T1 in service, carrying the kind of program a T1 actually carries.
    { id: 'T1_05', type: 't1', battery: 0.80, homeCode: 'OB_1A2B', down: false, intent: 'patrol',
      program: 'if charge < 15 then home\nelse if threat then hunt\nelse patrol' },
  ],
});
const hostsOf = () => hostTable(world());
const render = (h, hosts) => renderPage(pageFor(h, hosts));
const byKind = (hosts, k) => hosts.filter((h) => h.kind === k);

// ---- addressing ----------------------------------------------------------

test('the AIs are the top level, on their own domains', () => {
  assert.equal(aiIp(1), '192.0.0.1');
  assert.equal(domainFor('calypso'), 'calypso.com');
  const ai = hostsOf().find((h) => h.kind === 'ai');
  assert.equal(ai.ip, '192.0.0.1');
  assert.equal(ai.host, 'calypso.com');
});

test('everything else is a subdomain of its daemon, addressed by kind', () => {
  const hosts = hostsOf();
  assert.equal(hosts.find((h) => h.kind === 'factory').host, 'factory.calypso.com');
  assert.equal(byKind(hosts, 'obelisk')[0].host, 'ob_1a2b.calypso.com');
  assert.equal(byKind(hosts, 'robot')[0].host, 'w4_07.calypso.com');
  assert.equal(ipFor(1, 'obelisk', 2), '10.1.1.2');
  assert.equal(ipFor(1, 'robot', 1), '10.1.2.1');
});

test('the spoofed identity is off POSEIDON ranges and stable per seed', () => {
  const a = spoofedAddr(1, 42);
  assert.match(a.ip, /^169\.254\./, 'link-local: not in their address space');
  assert.match(a.mac, /^02(:[0-9a-f]{2}){5}$/);
  assert.deepEqual(spoofedAddr(1, 42), a);
});

test('addresses resolve by ip, hostname, bare host part, and a pasted URL', () => {
  const hosts = hostsOf();
  const ai = hosts.find((h) => h.kind === 'ai');
  assert.equal(findHost(hosts, '192.0.0.1'), ai);
  assert.equal(findHost(hosts, 'calypso.com'), ai);
  assert.equal(findHost(hosts, 'http://www.calypso.com/'), ai);
  assert.equal(findHost(hosts, 'ob_1a2b'), byKind(hosts, 'obelisk')[0]);
  assert.equal(findHost(hosts, 'nowhere.invalid'), null);
});

test("RON's relays are NOT on this network — they are off-grid on purpose", () => {
  assert.equal(hostsOf().some((h) => /hermes/.test(h.host)), false);
});

// ---- the link graph: AI -> factory -> tower -> its own units --------------

test('the AI index lists the foundry and every tower', () => {
  const hosts = hostsOf();
  const { text, links } = render(hosts.find((h) => h.kind === 'ai'), hosts);
  const labels = links.map((l) => l.label).join(' | ');
  assert.match(labels, /W-Factory/);
  assert.match(labels, /OB_1A2B/);
  assert.match(labels, /OB_3C4D/);
  assert.match(text, /NO RESPONSE/, 'the felled tower is reported as down on the index');
});

test('the factory page lists the towers AND the unit register', () => {
  const hosts = hostsOf();
  const { links } = render(hosts.find((h) => h.kind === 'factory'), hosts);
  const labels = links.map((l) => l.label).join(' | ');
  assert.match(labels, /OB_1A2B/);
  assert.match(labels, /W4_07/);
  assert.match(labels, /T1_02/);
});

test('a tower lists ONLY the units homed to it, and links back up', () => {
  const hosts = hostsOf();
  const ob1 = byKind(hosts, 'obelisk')[0];   // OB_1A2B: W4_07 + T1_02
  const l1 = render(ob1, hosts).links.map((l) => l.label).join(' | ');
  assert.match(l1, /W4_07/);
  assert.match(l1, /T1_02/);
  assert.doesNotMatch(l1, /W5_01/, 'W5_01 is homed to the OTHER tower');
  assert.match(l1, /foundry control/);
  assert.match(l1, /administration index/);

  const ob2 = byKind(hosts, 'obelisk')[1];   // OB_3C4D: W5_01 only
  const l2 = render(ob2, hosts).links.map((l) => l.label).join(' | ');
  assert.match(l2, /W5_01/);
  assert.doesNotMatch(l2, /W4_07/);
});

test('you can walk AI -> tower -> unit by following link addresses', () => {
  const hosts = hostsOf();
  const ai = hosts.find((h) => h.kind === 'ai');
  const toTower = render(ai, hosts).links.find((l) => /OB_1A2B/.test(l.label));
  const tower = findHost(hosts, toTower.addr);
  assert.equal(tower.kind, 'obelisk');
  const toUnit = render(tower, hosts).links.find((l) => /W4_07/.test(l.label));
  const unit = findHost(hosts, toUnit.addr);
  assert.equal(unit.kind, 'robot');
  assert.match(render(unit, hosts).text, /W4_07/);
});

// ---- the pages carry live state -----------------------------------------

test('a tower page reports its real state, and refuses control', () => {
  const hosts = hostsOf();
  const { text } = render(byKind(hosts, 'obelisk')[0], hosts);
  assert.match(text, /OB_1A2B/);
  assert.match(text, /circuit \.+ #3/);
  assert.match(text, /conversion \.+ 4\.3/, 'off the live blight radius (4.25 -> 4.3)');
  assert.match(text, /Control functions are not available/);
});

test('a felled tower keeps its page and says NO RESPONSE', () => {
  const hosts = hostsOf();
  assert.match(render(byKind(hosts, 'obelisk')[1], hosts).text, /NO RESPONSE/);
});

test('a bigger machine gets a bigger page', () => {
  const hosts = hostsOf();
  const bots = byKind(hosts, 'robot');
  const w4 = render(bots.find((h) => h.type === 'w4'), hosts).text;
  const t1 = render(bots.find((h) => h.type === 't1'), hosts).text;
  assert.ok(w4.length > t1.length, 'the hunter-killer has more page than the wedge');
  assert.match(w4, /Armament/);
  assert.match(w4, /Hunter-killer/);
  assert.doesNotMatch(t1, /Armament/, 'a wheeled wedge barely has a web presence');
  assert.match(t1, /Wheeled pursuit wedge/);
});

test('a unit page carries the intelligence the hack will want', () => {
  const hosts = hostsOf();
  const { text } = render(byKind(hosts, 'robot')[0], hosts);
  assert.match(text, /62%/);
  assert.match(text, /OB_1A2B/, 'its home tower');
  assert.match(text, /control \.+ not exposed/);
});

test('a reprogrammed gardener reports itself as horticultural', () => {
  const hosts = hostsOf();
  assert.match(render(byKind(hosts, 'robot')[2], hosts).text, /HORTICULTURAL/);
});

// ---- rendering -----------------------------------------------------------

test('links are numbered for following, and tags never reach the screen', () => {
  const hosts = hostsOf();
  const { text, links } = render(hosts.find((h) => h.kind === 'ai'), hosts);
  assert.ok(links.length >= 3);
  assert.equal(links[0].n, 1);
  assert.match(text, /\[1\]/);
  assert.ok(hosts.some((h) => h.ip === links[0].addr), 'a link resolves to a real host');
  assert.doesNotMatch(text, /<[a-z]/i);
});

test('the page is HTML underneath, so `source` has something to show', () => {
  const hosts = hostsOf();
  const html = pageFor(hosts.find((h) => h.kind === 'ai'), hosts);
  assert.match(html, /<h1>/);
  assert.match(html, /<a href="/);
});

test('the interface has the name the shell asks for', () => {
  assert.equal(IFACE, 'wifi0');
});

// ---- the other voices on the wire ----------------------------------------
// Three registers share this network: the daemon (now), the institution it ate
// (then), and the tourist board (the only human one). Plus the old boxes still
// serving it all.

test('the AI page still wears the letterhead of what it used to be', () => {
  const hosts = hostsOf();
  const { text } = render(hosts.find((h) => h.kind === 'ai'), hosts);
  assert.match(text, /LONG-STAY CARE & GUEST SERVICES/, 'the old org name survives');
  assert.match(text, /originally \.+ resident welfare management/);
  assert.match(text, /Discharge procedures remain SUSPENDED/, "the old institution's notice, unchanged");
});

test('each daemon gets its own former job, not a shared template', () => {
  const poly = hostTable({ ...world(), daemon: 'polyphemus', islandId: 'polyphemus' });
  const circe = hostTable({ ...world(), daemon: 'circe', islandId: 'circe' });
  assert.match(render(poly.find((h) => h.kind === 'ai'), poly).text, /LIVESTOCK MONITORING/);
  assert.match(render(circe.find((h) => h.kind === 'ai'), circe).text, /CLASSIFICATION & TARIFF/);
});

test('the legacy sub-system keeps records in the old vocabulary', () => {
  const hosts = hostsOf();
  const leg = hosts.find((h) => h.kind === 'legacy');
  assert.equal(leg.host, 'welfare.calypso.com');
  const { text } = render(leg, hosts);
  assert.match(text, /RESIDENT 001/);
  assert.match(text, /Reassured\. Reassured\. Reassured\./);
});

test('the tourist board is on the OLD internet, not the daemon subnet', () => {
  const hosts = hostsOf();
  const t = hosts.find((h) => h.kind === 'tourism');
  assert.equal(t.host, 'visit-ogygia.com');
  assert.match(t.ip, /^198\.51\.100\./, 'a leftover of the public internet');
  const { text } = render(t, hosts);
  assert.match(text, /Welcome to Ogygia/);
  assert.match(text, /Climate/);
  assert.match(text, /grotto/, 'the tips are real island knowledge');
  assert.match(text, /Best viewed at 640x480/);
});

test('the nameserver zone lists the estate, and delegates the cached web to the store', () => {
  const hosts = hostsOf();
  const ns = hosts.find((h) => h.kind === 'dns');
  const { text, links } = render(ns, hosts);
  assert.match(text, /BIND 4\.9\.3/);
  // Every REAL host — the daemon's own estate — is an A record in the zone.
  // The cached old-web domains are not: there are dozens, they all answer from
  // the one store, so they get a CNAME block and a count rather than burying
  // the estate they are filed among (archive.js / dnsPage).
  const estate = hosts.filter((h) => h !== ns && (h.kind !== 'archive' || !h.cached));
  for (const h of estate) assert.match(text, new RegExp(h.ip.replace(/\./g, '\\.')), `${h.host} is in the zone`);
  assert.match(text, /not responding/, 'dark hosts are still listed, and marked');
  assert.match(text, /Cached zones/, 'the cached web is delegated, not enumerated');
  assert.ok(links.length > estate.length, 'and a sample of the cached domains is still reachable from here');
});

test('the mail server still holds what it could never deliver', () => {
  const hosts = hostsOf();
  const { text } = render(hosts.find((h) => h.kind === 'mail'), hosts);
  assert.match(text, /QUEUE HELD/);
  assert.match(text, /evacuation muster points/);
});

test('search finds a host by its CONTENT, and keeps dark hosts in the index', () => {
  const hosts = hostsOf();
  const grotto = renderPage(searchResults(hosts, 'grotto'));
  assert.equal(grotto.links.length, 1);
  assert.match(grotto.links[0].label, /TOURIST BOARD/);
  const towers = renderPage(searchResults(hosts, 'obelisk'));
  assert.ok(towers.links.some((l) => /not responding/.test(l.label)), 'a felled tower is still indexed');
  assert.match(renderPage(searchResults(hosts, 'zzzz')).text, /No documents match/);
});

test('bookmarks are the landing page, and deliberately short', () => {
  const hosts = hostsOf();
  const { text, links } = renderPage(bookmarksPage(hosts));
  assert.ok(links.length <= 4, 'a browser someone actually used, not a directory');
  const labels = links.map((l) => l.label).join(' | ');
  assert.match(labels, /AltaVista/);
  assert.match(labels, /Tourist Board/);
  assert.match(labels, /engineering documentation/, 'the manual is reachable from the off');
  assert.match(text, /bookmarks\.htm/);
});

test('every page names the device, its status and its address', () => {
  const hosts = hostsOf();
  // Two kinds of host are not machines describing themselves, so the
  // device-header contract does not reach them: the documentation server (a
  // library) and the cache (foreign pages copied off the old web — a youtube
  // page reports youtube's status, not a device's).
  for (const h of hosts.filter((x) => x.kind !== 'docs' && x.kind !== 'archive')) {
    const { text } = render(h, hosts);
    assert.match(text, /STATUS:/, `${h.host} reports a status`);
    assert.match(text, new RegExp(h.ip.replace(/\./g, '\\.')), `${h.host} gives its address`);
    assert.match(text, /name \.+ /, `${h.host} names itself`);
  }
});

// ---- the documentation server --------------------------------------------
// The manual for the machines' own console language, still being served. It is
// how RON learned AI-ML, and how the player can.

test('the docs server is on the wire, with its own article set', () => {
  const hosts = hostsOf();
  const d = hosts.find((h) => h.kind === 'docs');
  assert.equal(d.host, 'docs.calypso.com');
  assert.ok(DOC_TOPICS.includes('index') && DOC_TOPICS.length >= 8, 'an index and real subpages');
  assert.match(renderPage(pageFor(d, hosts)).text, /AI-ML/);
});

test('every documented topic renders, and links onward to the others', () => {
  for (const t of DOC_TOPICS) {
    const { text, links } = renderPage(docsPage(t, 'docs.calypso.com'));
    assert.ok(text.length > 200, `${t}: has real content`);
    assert.ok(links.length >= 3, `${t}: links to sibling articles`);
    assert.ok(links.every((l) => l.addr.startsWith('docs:')), `${t}: article links are topics`);
    assert.doesNotMatch(text, /<[a-z]/i, `${t}: no tags reach the screen`);
  }
});

test('the theory pages actually teach functional programming', () => {
  const all = DOC_TOPICS.map((t) => docsPage(t)).join('\n');
  for (const idea of [/immutab|does not change|nothing changes/i, /recursion/i,
    /higher-order/i, /curr(y|ied|ying)/i, /partial application/i, /base case/i,
    /expression/i, /shadow/i]) {
    assert.match(all, idea, `the documentation covers ${idea}`);
  }
});

test('the docs are honest about what this dialect does NOT have', () => {
  const r = docsPage('restrictions');
  for (const gone of [/pattern match/i, /datatype/i, /module/i, /exception/i, /type check/i]) {
    assert.match(r, gone);
  }
});

test('a unit that runs a program serves an upload form, and says so when there is nothing to send', () => {
  const hosts = hostTable(world());
  const unit = hosts.find((h) => h.kind === 'robot' && h.program);
  assert.ok(unit, 'the fixture world has a unit carrying a program');
  const withFiles = programPage(unit, hosts, { files: ['download/t1_01.ml', 'hello.ml'] });
  assert.match(withFiles, /ns-post-file/, 'a chooser');
  assert.match(withFiles, /ns-post-go/, 'and a button');
  assert.match(withFiles, /download\/t1_01\.ml/, 'listing what is on the machine');
  // An empty NostBook must not show a form that cannot do anything.
  const empty = programPage(unit, hosts, { files: [] });
  assert.doesNotMatch(empty, /ns-post-go/);
  assert.match(empty, /Save this one first/);
});

// REGRESSION (v1.225). Every cached old-web domain answers on the SAME address,
// because they are all served out of the one proxy. Links were emitted as IPs,
// so findHost resolved any of them to whichever host held that address first —
// the cache box — and clicking any site in the directory opened the cache's own
// index page instead of the site. Reported from play: "all the webpages we
// added are not filled out, they seem to contain just CACHE".
test('every link on the cache index opens the site it names, not the cache', () => {
  const hosts = hostsOf();
  const cache = hosts.find((h) => h.kind === 'archive' && !h.cached);
  const { links } = render(cache, hosts);
  assert.ok(links.length > 30, 'the directory lists the whole store');
  for (const l of links) {
    const target = findHost(hosts, l.addr);
    assert.ok(target, `${l.addr} resolves`);
    // A link labelled with a domain must land on THAT domain.
    const named = String(l.label).split(/[\s—]/)[0];
    if (named.includes('.')) {
      assert.equal(target.host, named, `link "${l.label}" must open ${named}, not ${target.host}`);
    }
  }
});

test('a shared address is linked by name, and a unique one still by number', () => {
  const hosts = hostsOf();
  const site = hosts.find((h) => h.cached === 'youtube.com');
  const tower = hosts.find((h) => h.kind === 'obelisk');
  assert.match(render(site, hosts).text, /YOUTUBE/);
  // The estate keeps IP links: reading the address is how the scheme is learned.
  const { links } = render(hosts.find((h) => h.kind === 'ai'), hosts);
  assert.ok(links.some((l) => /^\d+\.\d+\.\d+\.\d+$/.test(l.addr)), 'the estate is still addressed by number');
  assert.ok(tower);
});

// DISCOVERABILITY (v1.226). The AI-ML manual was written, shipped, and reachable
// only from bookmarks — a gap fixed in v1.214 after David asked where it was.
// The cache, the papers and the encyclopedia arrived the same way and had the
// same gap. These pin the routes in, so the next thing added to the web has to
// be findable by someone who does not know it exists.
test('the browser opens on pages that lead to the whole store', () => {
  const hosts = hostsOf();
  const bm = renderPage(bookmarksPage(hosts));
  const reachable = bm.links.map((l) => l.addr);
  // Deliberately ONE route in, not three: the list stays a person's habits.
  // The cache is the address that leads to all the rest.
  assert.ok(reachable.some((a) => /cache\./.test(a)), 'the cache is bookmarked');
  // Every bookmark must actually open something.
  for (const l of bm.links) assert.ok(findHost(hosts, l.addr), `${l.addr} resolves`);
});

test("New&Cool carries the papers, so the collapse is findable by browsing", () => {
  const hosts = hostsOf();
  const { text, links } = renderPage(whatsNewPage(hosts));
  for (const paper of ['bitstream.net', 'themeridian.com', 'dailysignal.co.uk', 'exchange-daily.com']) {
    assert.ok(links.some((l) => l.addr === paper), `${paper} is listed`);
  }
  assert.match(text, /cache/i);
});
