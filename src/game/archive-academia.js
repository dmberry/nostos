// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #143 — the universities, their departments, and the index a cached one serves.
//
// Split out of archive.js. Nothing here changed in the move.

import { POPLOG_TITLE, POPLOG_BODY } from './poplog.js';
import { pic } from './archive-pic.js';
// THE UNIVERSITIES.
//
// Twenty of them, and they are here for a reason beyond furniture: the work that
// ended the world was done in buildings like these, and their department indexes
// are the last place it is still written down in the ordinary voice of a
// timetable. A cached university is a departmental index with the seminars still
// listed and nobody left to attend them.
//
// Structural only — department names, term dates, a broken staff list. No words
// are put in any real institution's mouth; what survives is the shape of a site,
// which is all the crawler ever kept.
export const UNIVERSITIES = [
  { domain: 'sussex.ac.uk', name: 'University of Sussex', place: 'Brighton' },
  { domain: 'bham.ac.uk', name: 'University of Birmingham', place: 'Birmingham' },
  { domain: 'ox.ac.uk', name: 'University of Oxford', place: 'Oxford' },
  { domain: 'cam.ac.uk', name: 'University of Cambridge', place: 'Cambridge' },
  { domain: 'gla.ac.uk', name: 'University of Glasgow', place: 'Glasgow' },
  { domain: 'mit.edu', name: 'Massachusetts Institute of Technology', place: 'Cambridge, Mass.' },
  { domain: 'usc.edu', name: 'University of Southern California', place: 'Los Angeles' },
  { domain: 'nyu.edu', name: 'New York University', place: 'New York' },
  { domain: 'uio.no', name: 'Universitetet i Oslo', place: 'Oslo' },
  { domain: 'ku.dk', name: 'Københavns Universitet', place: 'Copenhagen' },
  { domain: 'cbs.dk', name: 'Copenhagen Business School', place: 'Frederiksberg' },
  { domain: 'ethz.ch', name: 'ETH Zürich', place: 'Zürich' },
  { domain: 'hu-berlin.de', name: 'Humboldt-Universität zu Berlin', place: 'Berlin' },
  { domain: 'uva.nl', name: 'Universiteit van Amsterdam', place: 'Amsterdam' },
  { domain: 'uct.ac.za', name: 'University of Cape Town', place: 'Cape Town' },
  { domain: 'makerere.ac.ug', name: 'Makerere University', place: 'Kampala' },
  { domain: 'aub.edu.lb', name: 'American University of Beirut', place: 'Beirut' },
  { domain: 'cu.edu.eg', name: 'Cairo University', place: 'Giza' },
  { domain: 'unimelb.edu.au', name: 'University of Melbourne', place: 'Melbourne' },
  { domain: 'u-tokyo.ac.jp', name: 'University of Tokyo', place: 'Tokyo' },
  { domain: 'tsinghua.edu.cn', name: 'Tsinghua University', place: 'Beijing' },
];

export const UNI_BY_DOMAIN = Object.fromEntries(UNIVERSITIES.map((u) => [u.domain, u]));
export const universityAt = (domain) => UNI_BY_DOMAIN[domain] || null;

// Departments, in the order a site of the period would have listed them. The
// last three are why these pages matter: every one of these places had a group
// working on it, filed between Chemistry and Classics like any other.
const DEPTS = [
  'Anthropology', 'Biological Sciences', 'Chemistry', 'Classics', 'Economics',
  'Engineering', 'English', 'Geography', 'History', 'Law', 'Mathematics',
  'Medicine', 'Philosophy', 'Physics', 'Politics', 'Psychology', 'Sociology',
  'Computer Science', 'Cognitive Science', 'Machine Learning Group',
];

// Departments that survived as their own page rather than as a line in a list.
// Keyed by domain: a university may have more than one.
const DEPT_PAGES = {
  'sussex.ac.uk': [
    { key: 'media', name: 'Media and Film' },
    { key: 'cogs', name: 'Cognitive and Computing Sciences' },
  ],
  'hu-berlin.de': [{ key: 'media', name: 'Institut f\u00fcr Medienwissenschaft' }],
  'usc.edu': [{ key: 'retroai', name: 'Retro AI: Archaeologies of A.I.' },
    { key: 'marino', name: 'Mark C. Marino — Writing Program' }],
};
export const deptPagesFor = (domain) => DEPT_PAGES[domain] || [];

// The department pages themselves, addressed `dept:<domain>/<key>`.
export const DEPARTMENTS = {
  'sussex.ac.uk/media': {
    title: 'Media and Film — University of Sussex',
    body: [
      '<!--bg:grey-->',
      '<h1>School of Media and Film</h1>',
      '<p><small>University of Sussex &middot; Brighton</small></p>',
      '<hr>',
      '<h2>Research expertise</h2>',
      '<p class="kv">&middot; Broadcast and digital media</p>',
      '<p class="kv">&middot; Critical theories of technology</p>',
      '<p class="kv">&middot; Critical theories of artificial intelligence</p>',
      '<p class="kv">&middot; Digital humanities and computational culture</p>',
      '<p class="kv">&middot; Media theory and the history of media technologies</p>',
      '<h2>Research centres</h2>',
      '<p>Centre for Digital Culture</p>',
      '<p>Media Technologies Research Group</p>',
      '<h2>Seminar series</h2>',
      '<p>Automation and the Human &mdash; Wednesdays, 4pm, Silverstone 213.</p>',
      '<p>All welcome. Tea from 3.45.</p>',
      '<p><small>Seminar list last updated before the suspension of teaching.',
      'The room is still on the timetable.</small></p>',
      '<h2>Publications</h2>',
      '<p>Repository not in store. 2,400 records referenced, none retrievable:',
      'the crawler followed the links and the repository answered each one with a',
      'session cookie and a redirect.</p>',
      '<h2>Reading</h2>',
      '<p><a href="wiki:mcluhan">Marshall McLuhan</a> &middot; <a href="wiki:kittler">Friedrich Kittler</a> &middot; <a href="wiki:ernst">Wolfgang Ernst</a></p>',
      '<h2>Contact</h2>',
      '<p>Enquiries: the address is on the department front page, which is this',
      'page. There is no other page.</p>',
      '<p>See also <a href="dept:sussex.ac.uk/cogs">Cognitive and Computing',
      'Sciences</a>, up the hill, who were building the thing this department',
      'spent the same years describing.</p>',
      '<hr>',
      '<p><small>Object 88% complete. This record was crawled unusually often;',
      'the reason is not recorded.</small></p>',
    ],
  },
};

DEPARTMENTS['hu-berlin.de/media'] = {
  title: 'Institut f\u00fcr Medienwissenschaft — Humboldt-Universit\u00e4t zu Berlin',
  body: [
    '<!--bg:grey-->',
    '<h1>Institut f\u00fcr Medienwissenschaft</h1>',
    '<p><small>Humboldt-Universit\u00e4t zu Berlin</small></p>',
    '<hr>',
    '<h2>Research</h2>',
    '<p class="kv">&middot; Media archaeology</p>',
    '<p class="kv">&middot; Technical media and cultural techniques</p>',
    '<p class="kv">&middot; Time-critical media and signal processing</p>',
    '<p class="kv">&middot; Theory of the archive</p>',
    '<h2>Media Archaeological Fundus</h2>',
    '<p>A working collection of historical apparatus, held so that machines can',
    'be studied by operating them. Access by arrangement.</p>',
    '<p><small>Inventory retrieved. 1,100 items listed, from wax cylinder',
    'equipment to early digital storage. Condition column empty for all',
    'rows.</small></p>',
    '<h2>Associated</h2>',
    '<p><a href="wiki:ernst">Wolfgang Ernst</a> &middot; <a href="wiki:kittler">Friedrich Kittler</a></p>',
    '<hr>',
    '<p><small>Object 64% complete.</small></p>',
    '<p><small>Two documents that make the case for the Fundus better than a research statement can: <a href="domesday.geocities.ws">a national survey that outlived the machines that could read it</a>, and <a href="whatishistory.geocities.ws">an evening class on who kept the record</a>.</small></p>',
  ],
};

// The school the Poplog paper was written from, and the paper itself. The paper
// is not listed on the university index: it is reached from here, or from the
// search, the way a document on a departmental site actually was.
DEPARTMENTS['sussex.ac.uk/cogs'] = {
  title: 'Cognitive and Computing Sciences — University of Sussex',
  body: [
    '<!--bg:grey-->',
    '<h1>School of Cognitive and Computing Sciences</h1>',
    '<p><small>University of Sussex &middot; Brighton BN1 9QN</small></p>',
    '<hr>',
    '<p>Teaching and research across Artificial Intelligence, Computer Science,',
    'Linguistics, Philosophy and Psychology. The school began as the Cognitive',
    'Studies Programme in the School of Social Sciences.</p>',
    '<h2>Subjects</h2>',
    '<p class="kv">&middot; Artificial Intelligence</p>',
    '<p class="kv">&middot; Computer Science</p>',
    '<p class="kv">&middot; Linguistics</p>',
    '<p class="kv">&middot; Philosophy</p>',
    '<p class="kv">&middot; Psychology</p>',
    '<h2>Languages taught here</h2>',
    '<p>Pop-11 for the first year, then Prolog, Lisp and ML, all of them in one',
    'system. The argument for teaching in the language the staff do their own',
    'research in is set out in the paper below.</p>',
    '<h2>Documents</h2>',
    `<p><a href="dept:sussex.ac.uk/cogs/poplog">${POPLOG_TITLE}</a><br>`,
    '<small>Aaron Sloman. An account of how the language and its development',
    'environment were built here, and why the alternatives were turned down.</small></p>',
    '<h2>Elsewhere</h2>',
    '<p><a href="bham.ac.uk">University of Birmingham</a> &middot;',
    '<a href="wiki:transformer">Transformer (machine learning)</a></p>',
    '<p>See also <a href="dept:sussex.ac.uk/media">Media and Film</a>, who have',
    'been writing about this since before it worked.</p>',
    '<hr>',
    '<p><small>Object 91% complete. The teaching timetable and the staff',
    'photographs were generated per visitor and are not in store.</small></p>',
  ],
};

DEPARTMENTS['sussex.ac.uk/cogs/poplog'] = { title: POPLOG_TITLE, body: POPLOG_BODY };

// A two-day symposium on the histories of AI, cached with its schedule intact
// and its registration link pointing at a shortener that is no longer anything.
// The programme is the joke and the archive does not have to make it: a meeting
// about the archaeology of artificial intelligence, dug up.
// A faculty page. The Writing Program rather than a computer science
// department, which is the point about him and about the field he named: the
// argument is that code is writing, so the person making it sits with the
// writers.
//
// Everything here is bibliographic or is on the cover of a book. No opinions
// are put in his mouth beyond what the titles state, and the titles state a
// good deal, because he chooses them carefully and two of them contain jokes
// that are also the thesis.
DEPARTMENTS['usc.edu/marino'] = {
  title: 'Mark C. Marino — Writing Program, University of Southern California',
  body: [
    '<!--bg:oxford-->',
    '<h1>Mark C. Marino</h1>',
    '<p><small>Writing Program &middot; University of Southern California &middot;',
    'Los Angeles</small></p>',
    '<hr>',
    '<p>Teaches writing. Works on <b>electronic literature</b> and on the reading',
    'of source code as a cultural text, which is a field he has contributed substantially to.</p>',
    '<h2>Critical code studies</h2>',
    '<p>The argument, in one line: source code can be read closely, for what it',
    'says as well as for what it does, and the people best placed to do that are',
    'people trained to read.</p>',
    '<p>It was put forward in an essay in 2006, argued about for a decade and a',
    'half, and set out at length in a book of the same name. The objection it',
    'always meets is that code is functional and therefore not interpretable, and',
    'the answer it always gives is that a variable name is a choice, a default is',
    'a position, and a comment is somebody talking.</p>',
    '<p>There is <a href="criticalcode.geocities.ws">a page in this archive</a>',
    'doing exactly that to twelve lines, kept by somebody who is plainly working',
    'from this.</p>',
    '<h2>10 PRINT</h2>',
    '<pre class="jb-list">',
    '  10 PRINT CHR$(205.5+RND(1)); : GOTO 10',
    '</pre>',
    '<p>One line of Commodore 64 BASIC that prints a maze forever, and a book',
    'about it by ten authors, of which he is one. The book is a demonstration',
    'rather than an argument: it takes a single line and reads it as code, as',
    'graphics, as randomness, as a machine, as a culture, and as a maze, for two',
    'hundred pages, and by the end the case for the method has been made without',
    'being stated.</p>',
    '<h2>Hallucinate This!</h2>',
    pic('hallucinate-this', 'Hallucinate This! An Authoritized Autobotography of ChatGPT, as prompted by Mark C. Marino. A robot at a window looking out at a small town under a heavy sky. Both misspellings on the cover are deliberate and both of them are the joke.', 'r'),
    '<p>An autobiography of a chatbot, produced by prompting it, published under',
    'its own name as author with him credited as the one who prompted.</p>',
    '<p>Read the cover slowly. <i>Authoritized</i>, which is authorised with',
    'authority pushed into the middle of it and not quite fitting.',
    '<i>Autobotography</i>, which is autobiography with the bot in it and the',
    'life taken out. Neither is a typographical error and both are the argument:',
    'a life story with no life, authorised by nobody who could authorise',
    'anything.</p>',
    '<p>Which puts it in a long line. A machine producing a confident account of',
    'itself, in good prose, with nobody behind the voice, is the oldest',
    'demonstration in this subject and it is sixty years old:',
    '<a href="eliza.geocities.ws">ELIZA</a>. He is one of the authors of the',
    'history of that program too.</p>',
    '<h2>Elsewhere</h2>',
    '<p>Director of communication for the Electronic Literature Organization, and',
    'a regular at <a href="usc.edu/retroai">the symposium down the corridor</a>.</p>',
    '<hr>',
    '<p><small>Office hours by appointment. Students asking whether they may',
    'submit a piece of software as a piece of writing should read the syllabus,',
    'where the answer is yes and has been for some years.</small></p>',
    '<p><small>See also <a href="digitalhumanities.geocities.ws">the argument',
    'about whether any of this is a field</a>, and',
    '<a href="unreliablenarrator.geocities.ws">on voices with nobody behind',
    'them</a>.</small></p>',
  ],
};

DEPARTMENTS['usc.edu/retroai'] = {
  title: 'Retro AI: Archaeologies of A.I. — University of Southern California',
  body: [
    '<!--bg:grey-->',
    '<img class="ra-banner" src="assets/media/web/retroai.jpg"',
    '  alt="RETRO AI: Archaeologies of Artificial Intelligence. An IBM 2094 data',
    '  processing system, a blue tin robot with a reel-to-reel chest, and a',
    '  teletype, against a cream wall.">',
    '<h1>Retro AI: Archaeologies of A.I.</h1>',
    '<p><small>Mudd Hall (MHP) 102 &middot; University of Southern California</small></p>',
    '<p><a href="bit.ly">Register Here</a></p>',
    '<hr>',
    '<p>The field of artificial intelligence has long been obsessively focussed',
    'on the next big breakthrough which would solve its defining problems. While',
    'interventions like critical AI studies are at least starting to ask the right',
    'questions of this field, their fixation on the latest innovation often misses',
    'the critical histories and genealogies of AI&rsquo;s past. You are invited to a',
    'two-day symposium on Retro AI at the University of Southern California to',
    'critically consider these questions and their implications for today.</p>',
    '<p>Sponsored by the Institute on Ethics &amp; Trust in Computing, The',
    'Humanities and Critical Code Studies Lab, and the Electronic Literature',
    'Organization.</p>',
    '<p><small>Note to presenters: each presentation gets 25 minutes, which can be',
    'used all for talking or part talk, part QA. The last 10 minutes of each hour',
    'is for a break.</small></p>',
    '<p><small>Play breaks: Tom and Braxton are bringing an Intellivision for',
    'playbreaks.</small></p>',
    '<h2>Friday, July 31</h2>',
    '<p class="kv">          Pre-symposium: coffee, tea, bagels</p>',
    '<p class="kv">9am       AI &amp; the University</p>',
    '<p class="kv">          A regularly meeting group of faculty, staff and</p>',
    '<p class="kv">          graduate students discussing responses to AI,</p>',
    '<p class="kv">          particularly in teaching. All are welcome.</p>',
    '<p class="kv">11am      Symposium begins: welcome and introductions</p>',
    '<p class="kv">12pm      Lunch (provided)</p>',
    '<p class="kv">12:30     Online gallery opening (during lunch)</p>',
    '<p class="kv">1:30pm    Retro-duction AI: (re)reading, (re)constructing</p>',
    '<p class="kv">          and (re)running AI &mdash; David Berry, workshop</p>',
    '<p class="kv">2:30pm    QA</p>',
    '<p class="kv">2:45pm    Coffee break</p>',
    '<p class="kv">3pm       Reanimation(s) of The World&rsquo;s First True AI(s):</p>',
    '<p class="kv">          Newell, Simon, and Shaw&rsquo;s Logic Theorist</p>',
    '<p class="kv">          &mdash; Jeff Shrager</p>',
    '<p class="kv">3:30pm    QA</p>',
    '<p class="kv">4pm       Looking Back on MrMind &mdash; Peggy Weil</p>',
    '<p class="kv">4:30pm    QA</p>',
    '<h2>Saturday, August 1</h2>',
    '<p class="kv">9am       Welcome, day 2: gathering, coffee, tea, bagels</p>',
    '<p class="kv">10am      TEAM ELIZA</p>',
    '<p class="kv">11am      Giant Electric Mouths: Alternative Archaeologies</p>',
    '<p class="kv">          of AI &mdash; Rebecca Roach (virtual)</p>',
    '<p class="kv">          Artificial Intellivision: Gaming Histories of AI</p>',
    '<p class="kv">          &mdash; Tom Boellstorff &amp; Braxton Soderman</p>',
    '<p class="kv">12pm      Lunch (provided)</p>',
    '<p class="kv">1:15pm    Daniel Pillis &amp; playbreak</p>',
    '<p class="kv">2:15pm    Yitong Wang (virtual) &amp; launch of virtual gallery</p>',
    '<p class="kv">3pm       Chelly Jin &amp; playbreak</p>',
    '<p class="kv">4pm       Halim Madi, wrap-up</p>',
    '<h2>Related</h2>',
    '<p><a href="wiki:transformer">Transformer (machine learning)</a> &middot;',
    '<a href="dept:sussex.ac.uk/cogs">Cognitive and Computing Sciences, Sussex</a></p>',
    '<hr>',
    '<p><small>Object 88% complete. The online gallery and the virtual gallery',
    'were both hosted elsewhere and neither host is in store. The registration',
    'link is a shortener: the record for it exists and no longer says what it',
    'stood for.</small></p>',
  ],
};

export const departmentPage = (key) => DEPARTMENTS[key] || null;

// A cached university: the index page, most of it retrievable, the parts that
// were generated per-visitor gone. Deterministic per domain.
export function universityBody(domain) {
  const u = universityAt(domain);
  if (!u) return null;
  const h = [...domain].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 11);
  const keep = 9 + (h % 6);                       // how many departments survived
  const depts = DEPTS.slice(0, keep);
  const dead = DEPTS.slice(keep);
  const term = ['Michaelmas', 'Autumn', 'Hilary', 'Spring', 'Trinity'][h % 5];
  return [
    '<!--bg:grey-->',
    `<h1>${u.name}</h1>`,
    `<p><small>${u.place}</small></p>`,
    '<hr>',
    `<p>${term} term. Teaching has ended.</p>`,
    '<h2>Departments and Schools</h2>',
    ...deptPagesFor(domain).map((d) => `<a href="dept:${domain}/${d.key}">${d.name}</a>`),
    ...depts.map((d) => `<p class="kv">${d}</p>`),
    ...(dead.length ? [`<p><small>${dead.length} further entries: link targets not in store.</small></p>`] : []),
    '<h2>Notices</h2>',
    '<p>Library: reduced hours until further notice.</p>',
    '<p>Examinations: postponed. New dates to be confirmed.</p>',
    '<p>Campus network: scheduled maintenance. No end time given.</p>',
    '<h2>Staff directory</h2>',
    '<p>Directory generated per request. Stored copy does not match.</p>',
    // OTHER INSTITUTIONS. Every university index carried one of these in 1997,
    // and without it these pages are the only leaves in the corpus a reader can
    // walk to and not walk on from. Deterministic from the domain so the same
    // index always names the same two, and self is excluded.
    '<h2>Other institutions</h2>',
    '<p>Reciprocal library access and exchange arrangements are held with:</p>',
    ...siblingsOf(domain, h).map((v) => `<a href="${v.domain}">${v.name}</a>`),
  ];
}

/** Two other universities, picked deterministically, never this one. */
function siblingsOf(domain, h) {
  const rest = UNIVERSITIES.filter((u) => u.domain !== domain);
  if (rest.length < 2) return rest;
  const a = h % rest.length;
  let b = (h * 7 + 3) % rest.length;
  if (b === a) b = (b + 1) % rest.length;
  return [rest[a], rest[b]];
}
