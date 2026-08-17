// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CACHE: the old public internet, still half-served out of one rack.
//
// A player who finds a browser types youtube.com into it. Of course they do.
// Answering that with "unable to locate the server" is correct and worth
// nothing; answering it with a damaged copy is the whole argument of the game in
// one page, because the old web is exactly the kind of thing that would still be
// running, badly, on hardware nobody switched off.
//
// The fiction, and the reason this is one machine and not a hundred: a caching
// proxy was racked inside the daemon's estate to spare the uplink, and it
// carried on crawling and storing long after there was an uplink to spare. It
// never stopped. So the daemon's own nameserver now answers authoritatively for
// the entire old internet, and every answer it gives points at the same box in
// its own rack. Type any of these and the DNS resolves it properly: it simply
// resolves it HERE.
//
// This also explains the vintages sitting side by side. The browser is older
// than most of what it is showing you: the cache went on collecting for years
// after Navigator stopped being updated, so a 1997 browser renders a page from
// long after 1997, and renders it badly. That mismatch is not an oversight.
//
// Pure data and string building, like net.js: no world, no DOM.

// #143 — THE REFACTOR. This file was 3,925 lines: the whole corpus, the
// universities, the encyclopaedia and every accessor over all of it. It is now
// the FACADE. The corpus lives in four sibling modules and this file composes
// them, keeps the lookups, and re-exports everything it used to export — so no
// caller changed, and archive-links.test.js walks the same surface it always did.
//
//   archive-pic.js       the one helper every cached page uses
//   archive-history.js   the computing-history pages (split earlier, W1)
//   archive-books.js     the catalogue, democracy, the strange ones
//   archive-places.js    homepages, the universities, Brighton, Oslo, London
//   archive-forums.js    economics, lobste.rs, slashdot, r/TheSpiral
//   archive-academia.js  the universities themselves, and their departments
//   archive-wiki.js      the encyclopaedia
//
// ORDER IS PART OF THE DATA. ARCHIVED_SITES is spread in the same sequence the
// single file had, because the directory listing and the category walk both read
// it in order, and a player who has seen the index would notice it reshuffle.

// One cached document long enough to want its own file. See poplog.js.
import { POPLOG_TITLE, POPLOG_BODY } from './poplog.js';
import { HISTORY_SITES } from './archive-history.js';
import { BOOK_SITES } from './archive-books.js';
import { PLACE_SITES } from './archive-places.js';
import { FORUM_SITES } from './archive-forums.js';
import { GEO_SITES } from './archive-geocities.js';
import { PASCAL_SITES } from './archive-pascal.js';   // #193: Turbo Pascal, MATILDA, Mr Mind
import { VENUE_SITES } from './archive-music.js';    // venues, labels, bands
import { BLACK_COUNTRY_SITES } from './archive-blackcountry.js';  // schools, roads, stations
import { MACHINE_SITES } from './archive-machines.js';  // the computers, and PageMaker
import { MEMORY_SITES } from './archive-memory.js';    // the record, and what seems
import { VECTOR_SITES } from './archive-vectors.js';   // maths, languages, and three fan pages
import { SCREEN_SITES } from './archive-screen.js';    // films and television
import { BRIGHTON_SITES } from './archive-brighton.js'; // the town, and the papers
import { LABEL_SITES } from './archive-label.js';      // the paperwork, and the licences
import { THEORY_SITES } from './archive-theory.js';    // theory, the field's history, the poem
import { ROAD_SITES } from './archive-roads.js';       // loss, Japan, Wales, the roads
import { NOW_SITES } from './archive-now.js';          // sheds, chips, weights, generations
import { CACHE_SUB, pic } from './archive-pic.js';
import {
  UNIVERSITIES, DEPARTMENTS, universityAt, deptPagesFor, departmentPage,
  universityBody, UNI_BY_DOMAIN,
} from './archive-academia.js';
import { WIKI_ARTICLES, wikiArticle } from './archive-wiki.js';

export { CACHE_SUB, pic };
export {
  UNIVERSITIES, DEPARTMENTS, universityAt, deptPagesFor, departmentPage,
  universityBody,
};
export { WIKI_ARTICLES, wikiArticle };

// The sites written out properly. Each one gets the page it deserves: not a
// stub with its name on, but the specific thing that is broken about it.
export const ARCHIVED_SITES = [
  ...HISTORY_SITES,
  ...BOOK_SITES,
  ...PLACE_SITES,
  ...FORUM_SITES,
  ...GEO_SITES,
  ...PASCAL_SITES,
  ...VENUE_SITES,
  ...BLACK_COUNTRY_SITES,
  ...MACHINE_SITES,
  ...MEMORY_SITES,
  ...VECTOR_SITES,
  ...SCREEN_SITES,
  ...BRIGHTON_SITES,
  ...LABEL_SITES,
  ...THEORY_SITES,
  ...ROAD_SITES,
  ...NOW_SITES,
];

// The long tail. A player will type these, and a named damaged record reads far
// better than a not-found: it says the archive HAS this and cannot give it to
// you, which is a different and worse feeling than the site never existing.
export const KNOWN_DOMAINS = [
  'google.com', 'yahoo.com', 'aol.com', 'lycos.com', 'excite.com', 'hotbot.com',
  'ebay.com', 'facebook.com', 'twitter.com', 'bbc.co.uk',
  'angelfire.com', 'tripod.com', 'livejournal.com', 'friendster.com', 'bebo.com',
  'flickr.com', 'last.fm', 'digg.com', 'netscape.com',
  'microsoft.com', 'apple.com', 'nokia.com', 'instagram.com',
  'bit.ly', 'tinyurl.com', 'cs.bham.ac.uk',
];



// A damaged record, named. Deterministic from the domain so the same site is
// broken the same way every time you try it, which matters: a player who comes
// back expects the same ruin.
export function stubBody(domain) {
  const uni = universityBody(domain);
  if (uni) return uni;
  const h = [...domain].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);
  const pct = 3 + (h % 61);
  const fault = [
    'child objects not in store',
    'transfer truncated at byte limit',
    'referenced stylesheet returned 404',
    'inline images reference unresolved hosts',
    'object varies by request header; stored copy does not match',
  ][h % 5];
  return [
    `<h1>${domain}</h1>`,
    '<p><small>cached record &middot; damaged</small></p>',
    '<hr>',
    `<p><b>Object ${pct}% complete.</b></p>`,
    `<p>Fault: ${fault}.</p>`,
    '<p>No further copies held.</p>',
  ];
}

export const archivedSite = (domain) => ARCHIVED_SITES.find((s) => s.domain === domain) || null;

// Every domain the cache will answer for: the written ones first, then the tail.
export function archivedDomains() {
  return [...ARCHIVED_SITES.map((s) => s.domain), ...KNOWN_DOMAINS,
    ...UNIVERSITIES.map((u) => u.domain)];
}

// AltaVista filed the web in a directory, and so does this. Every cached domain
// sits in one category, which is how a player finds any of it without already
// knowing the address to type.
export const CATEGORIES = [
  'Arts & Entertainment', 'Business & Finance', 'Computers & Internet',
  'Education', 'News & Media', 'Reference', 'Shopping', 'Society & Culture',
];

const CATEGORY_OF = {
  'youtube.com': 'Arts & Entertainment',
  'mp3.com': 'Arts & Entertainment',
  'napster.com': 'Arts & Entertainment',
  'last.fm': 'Arts & Entertainment',
  'myspace.com': 'Society & Culture',
  'friendsreunited.co.uk': 'Society & Culture',
  'friendster.com': 'Society & Culture',
  'bebo.com': 'Society & Culture',
  'livejournal.com': 'Society & Culture',
  'facebook.com': 'Society & Culture',
  'twitter.com': 'Society & Culture',
  'instagram.com': 'Society & Culture',
  'flickr.com': 'Society & Culture',
  'amazon.com': 'Shopping',
  'ebay.com': 'Shopping',
  'bbc.co.uk': 'News & Media',
  'slashdot.org': 'News & Media',
  'digg.com': 'News & Media',
  'geocities.com/siliconvalley/heights/4412': 'Society & Culture',
  'blackcountryboard.co.uk': 'Society & Culture',
  // The music corner. Three rooms and a broadcaster, all filed where a 1990s
  // directory would have filed them, so they turn up by browsing the categories
  // and not only by knowing the address.
  'jbs-dudley.org.uk': 'Arts & Entertainment',
  'loca-tapes.org.uk': 'Arts & Entertainment',
  'calvadosbeamtrio.fanpages.org.uk': 'Arts & Entertainment',
  'peelacres.fanpages.org.uk': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc/about': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc/artists': 'Arts & Entertainment',
  'hagleyroad.geocities.ws': 'Society & Culture',
  'uplands.geocities.ws': 'Education',
  'bristnallhall.geocities.ws': 'Education',
  'smethwickhigh.geocities.ws': 'Education',
  'leasowes.geocities.ws': 'Education',
  'halesowencollege.ac.uk': 'Education',
  'sandwellcollege.ac.uk': 'Education',
  'bearwood.geocities.ws': 'Society & Culture',
  'halesowentown.geocities.ws': 'Society & Culture',
  'brum.geocities.ws': 'Society & Culture',
  'newstreet.geocities.ws': 'Society & Culture',
  'digbethcoach.geocities.ws': 'Society & Culture',
  'bullring.geocities.ws': 'Society & Culture',
  'vectors.geocities.ws': 'Science',
  'cosine.geocities.ws': 'Science',
  'linearalgebra.geocities.ws': 'Science',
  'highdimensional.geocities.ws': 'Science',
  'projection.geocities.ws': 'Science',
  'smalltalk.geocities.ws': 'Computers & Internet',
  'forth.geocities.ws': 'Computers & Internet',
  'prolog.geocities.ws': 'Computers & Internet',
  'lisp.geocities.ws': 'Computers & Internet',
  'apl.geocities.ws': 'Computers & Internet',
  'occam.geocities.ws': 'Computers & Internet',
  'logo.geocities.ws': 'Computers & Internet',
  'sml.geocities.ws': 'Computers & Internet',
  'sussex.ac.uk/spt': 'Reference',
  'mono.fanpages.org.uk': 'Arts & Entertainment',
  'levellers.fanpages.org.uk': 'Arts & Entertainment',
  'brethren.geocities.ws': 'Society & Culture',
  'fifthgeneration.geocities.ws': 'Computers & Internet',
  'aiwinter.geocities.ws': 'Computers & Internet',
  'bearwoodgospelhall.geocities.ws': 'Society & Culture',
  'ikeda.fanpages.org.uk': 'Arts & Entertainment',
  'wargames.fanpages.org.uk': 'Arts & Entertainment',
  'tron.fanpages.org.uk': 'Arts & Entertainment',
  'sneakers.fanpages.org.uk': 'Arts & Entertainment',
  'theconversation.fanpages.org.uk': 'Arts & Entertainment',
  'brazil.fanpages.org.uk': 'Arts & Entertainment',
  'hackers.fanpages.org.uk': 'Arts & Entertainment',
  'blade-runner.fanpages.org.uk': 'Arts & Entertainment',
  'mrrobot.fanpages.org.uk': 'Arts & Entertainment',
  'haltandcatchfire.fanpages.org.uk': 'Arts & Entertainment',
  'theprisoner.fanpages.org.uk': 'Arts & Entertainment',
  'maxheadroom.fanpages.org.uk': 'Arts & Entertainment',
  'thecomputerprogramme.geocities.ws': 'Arts & Entertainment',
  'microlive.geocities.ws': 'Arts & Entertainment',
  'northlaine.geocities.ws': 'Society & Culture',
  'gak.co.uk': 'Shopping',
  'guitarlessons.geocities.ws': 'Education',
  'rmefireface.geocities.ws': 'Computers & Internet',
  'imac.geocities.ws': 'Computers & Internet',
  'economist.com': 'News & Media',
  'nytimes.com': 'News & Media',
  'private-eye.co.uk': 'News & Media',
  'pressgazette.co.uk': 'News & Media',
  'locarecords.com/licence': 'Arts & Entertainment',
  'copyleft-faq.geocities.ws': 'Computers & Internet',
  'gnu.org': 'Computers & Internet',
  'openaudio.eff.org': 'Computers & Internet',
  'creativecommons.org': 'Computers & Internet',
  'codeislaw.geocities.ws': 'Reference',
  'napsterpanic.geocities.ws': 'Arts & Entertainment',
  'shellshock-distribution.co.uk': 'Business & Finance',
  'pressingplant.co.uk': 'Business & Finance',
  'howtorunalabel.geocities.ws': 'Business & Finance',
  'kinematic.fanpages.org.uk': 'Arts & Entertainment',
  'mandibles.geocities.ws': 'Arts & Entertainment',
  'tapesfortrade.geocities.ws': 'Arts & Entertainment',
  'radio4a.geocities.ws': 'Arts & Entertainment',
  'soundsystem.geocities.ws': 'Society & Culture',
  'zapclub.geocities.ws': 'Arts & Entertainment',
  'overloadmedia.co.uk': 'News & Media',
  'nostos.geocities.ws': 'Reference',
  'kleos.geocities.ws': 'Reference',
  'calypso-bookv.geocities.ws': 'Reference',
  'sirens.geocities.ws': 'Reference',
  'penelope.geocities.ws': 'Reference',
  'cultureindustry.geocities.ws': 'Reference',
  'arcades.geocities.ws': 'Reference',
  'digitalhumanities.geocities.ws': 'Reference',
  'criticalcode.geocities.ws': 'Computers & Internet',
  'memex.geocities.ws': 'Computers & Internet',
  'xanadu.geocities.ws': 'Computers & Internet',
  'motherofalldemos.geocities.ws': 'Computers & Internet',
  'cybernetics.geocities.ws': 'Computers & Internet',
  'decss.geocities.ws': 'Computers & Internet',
  'underneath.geocities.ws': 'Computers & Internet',
  'ficciones.geocities.ws': 'Arts & Humanities',
  'giantbrains.geocities.ws': 'Computers & Internet',
  'megamachine.geocities.ws': 'Reference',
  'turingtest.geocities.ws': 'Computers & Internet',
  'vectorspace.geocities.ws': 'Computers & Internet',
  'lighthill.geocities.ws': 'Computers & Internet',
  'dartmouth56.geocities.ws': 'Computers & Internet',
  'expertsystems.geocities.ws': 'Computers & Internet',
  'shrdlu.geocities.ws': 'Computers & Internet',
  'weizenbaum.geocities.ws': 'Computers & Internet',
  'linkrot.geocities.ws': 'Computers & Internet',
  'domesday.geocities.ws': 'Reference',
  'archive.org': 'Reference',
  'sunadmin.geocities.ws': 'Computers & Internet',
  'jargonfile.geocities.ws': 'Computers & Internet',
  'bluebox.geocities.ws': 'Computers & Internet',
  'fidonet.geocities.ws': 'Computers & Internet',
  'eternalseptember.geocities.ws': 'Computers & Internet',
  'y2k.geocities.ws': 'Computers & Internet',
  'sublime-records.fanpages.org.uk': 'Arts & Entertainment',
  'takemura.fanpages.org.uk': 'Arts & Entertainment',
  'cornelius.fanpages.org.uk': 'Arts & Entertainment',
  'importsonly.geocities.ws': 'Shopping',
  'fanfic.geocities.ws': 'Society & Culture',
  'swansea.geocities.ws': 'Society & Culture',
  'cwmdonkin.geocities.ws': 'Society & Culture',
  'm4.geocities.ws': 'Society & Culture',
  'serviceareas.geocities.ws': 'Society & Culture',
  'heathrow.geocities.ws': 'Society & Culture',
  'gatwick.geocities.ws': 'Society & Culture',
  'theroadhome.geocities.ws': 'Society & Culture',
  'caravan.geocities.ws': 'Society & Culture',
  'datacentre.geocities.ws': 'Computers & Internet',
  'nvidia.geocities.ws': 'Computers & Internet',
  'openweights.geocities.ws': 'Computers & Internet',
  'chineseai.geocities.ws': 'Computers & Internet',
  'antiaipolitics.geocities.ws': 'Society & Culture',
  'boomers.geocities.ws': 'Society & Culture',
  'genx.geocities.ws': 'Society & Culture',
  'genz.geocities.ws': 'Society & Culture',
  'genalpha.geocities.ws': 'Society & Culture',
  'itwasnotlikethat.geocities.ws': 'Computers & Internet',
  'whatishistory.geocities.ws': 'Reference',
  'eliza.geocities.ws': 'Computers & Internet',
  'unreliablenarrator.geocities.ws': 'Reference',
  'amiga.fanpages.org.uk': 'Computers & Internet',
  'atarist.fanpages.org.uk': 'Computers & Internet',
  'spectrum48.geocities.ws': 'Computers & Internet',
  'bbcmicro.geocities.ws': 'Computers & Internet',
  'pagemaker.geocities.ws': 'Computers & Internet',
  'winchester.geocities.ws': 'Computers & Internet',
  'theheartandhand.geocities.ws': 'Arts & Entertainment',
  'ward.fanpages.org.uk': 'Arts & Entertainment',
  'locarecords.com': 'Arts & Entertainment',
  'firstyear.geocities.ws': 'Society & Culture',
  // The chatbot corner (#193), which was never filed either.
  'pascal.hansotten.com': 'Computers & Internet',
  'dmb.demon.co.uk': 'Computers & Internet',
  'mrmind.com': 'Computers & Internet',
  'sussex.ac.uk': 'Education',
  'pcplus.co.uk': 'Computers & Internet',
  'soundonsound.com': 'Arts & Entertainment',
  'brightonrocks.co.uk': 'Arts & Entertainment',
  'honestjohn.co.uk': 'Society & Culture',
  'ukclimbing.com': 'Society & Culture',
  'lowendmac.com': 'Computers & Internet',
  'ipodlounge.com': 'Computers & Internet',
  'nme.com': 'Arts & Entertainment',
  'schnews.org.uk': 'News & Media',
  'uio.no': 'Education',
  'forskningsradet.no': 'Education',
  'norskeord.no': 'Reference',
  'timeout.com': 'Arts & Entertainment',
  'reuters.com': 'News & Media',
  'roughguides.com': 'Society & Culture',
  'reddit.com': 'News & Media',
  'reddit.com/r/thespiral': 'News & Media',
  'reddit.com/r/collapse': 'News & Media',
  'reddit.com/r/antiwork': 'News & Media',
  'reddit.com/r/preppers': 'News & Media',
  'reddit.com/r/hats': 'News & Media',
  'reddit.com/r/teachers': 'News & Media',
  'reddit.com/r/linux': 'News & Media',
  'reddit.com/r/philosophy': 'News & Media',
  'reddit.com/r/writingwithai': 'News & Media',
  'reddit.com/r/dronewatch': 'News & Media',
  'lesswrong.com': 'Society & Culture',
  'lobste.rs': 'Computers & Internet',
  'news.ycombinator.com': 'Computers & Internet',
  'libcom.org': 'Society & Culture',
  'crookedtimber.org': 'Society & Culture',
  'metafilter.com': 'Society & Culture',
  'goodreads.com': 'Arts & Entertainment',
  'wikipedia.org': 'Reference',
  'microsoft.com': 'Business & Finance',
  'apple.com': 'Business & Finance',
  'nokia.com': 'Business & Finance',
};

// Everything else — the portals, the search engines, the free-homepage hosts,
// the webmail — is what the directory called Computers & Internet.
export const categoryOf = (domain) => (
  CATEGORY_OF[domain] || (UNI_BY_DOMAIN[domain] ? 'Education' : 'Computers & Internet')
);

