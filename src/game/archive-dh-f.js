// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BATCH DH_F — critique & the global turn.
//
// The rooms where the digital humanities argues with itself. A discussion-board
// thread about the neoliberalism critique; an academic summary of postcolonial
// DH; an org page for the global-outlook consortium; the page for an
// open-access book series that is really a running quarrel; and a patient
// "what is DH?" explainer for the newcomer who keeps asking. Real people,
// projects and titles; the tempers and the typos belong to the pages.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

// ---- the dark side of DH: the discussion-board thread (SHOWPIECE) -----------

const DARKSIDE = P('the-dark-side-of-dh.geocities.ws', 'DARK SIDE',
  'THREAD: is DH a neoliberal tool? // the-dark-side-of-dh', [
    '<!--bg:dh-screen-->',
    '<h1>THREAD: is DH a neoliberal tool?</h1>',
    '<p><small>the-humanist-lounge &gt; big questions &gt; this thread. 31 replies ·',
    'viewing flat · a mod has pinned the opening post. topic: the political critique',
    'of the digital humanities.</small></p>',
    '<div class="fs-epi"><p>The quarrel is not about the software. It is about the',
    'university that pays for the software.<br>— pinned by the moderator</p></div>',
    '<hr>',
    '<p><b>redbrick_reader</b> wrote (14 Mar):</p>',
    '<p>right, someone has to start it, so here. everyone keeps mailing me the Los',
    'Angeles Review of Books piece, "Neoliberal Tools (and Archives): A Political',
    'History of Digital Humanities", by Daniel Allington, Sarah Brouillette and David',
    'Golumbia. the argument, as i read it: DH did not merely grow up beside the',
    'corporate university, it FITS it. grant-hungry, project-managed, fond of tools',
    'and deliverables and transferable skills, and very quiet about the theory and',
    'the politics the humanities used to argue about. the humanities remade in the',
    'image of the neoliberal campus, with a word cloud on top.</p>',
    '<blockquote class="fs-quote"><p>"Neoliberal Tools (and Archives): A Political',
    'History of Digital Humanities"</p></blockquote>',
    '<hr>',
    '<p><b>tooling_up</b> wrote (14 Mar):</p>',
    '<p>i have read it too and i think it is a caricature. the field BUILDS things.',
    'it puts archives online that were locked in a basement, it teaches a student to',
    'mark up a text and read a map and question a dataset, it does the unglamorous',
    'labour of getting the primary material to people who could never travel to the',
    'reading room. calling that neoliberal because it also happens to attract',
    'funding is a cheap shot. everything in the modern university attracts funding,',
    'including the seminar where you sit and complain about funding.</p>',
    '<img class="indie-pic" src="assets/media/web/dh/network-graph-01.jpg" alt=""><span class="indie-cap">A network graph (image: Martin Grandjean, CC BY-SA 4.0)</span>',
    '<hr>',
    '<p><b>redbrick_reader</b> wrote (15 Mar):</p>',
    '<p>nobody said the archives are bad. the point is subtler. Golumbia and the',
    'others are asking WHAT KIND of humanities the money selects for, and who does',
    'the encoding, and on what contract. an archive is not free to make. it is made',
    'by people, often on soft money, often graduate students and adjuncts, whose',
    'names come off the finished thing. the critique is about the political economy',
    'of the work, not the worthiness of the archive.</p>',
    '<div class="fs-aside"><p><b>a note that keeps coming up in this thread.</b> the',
    'encoding, the cleaning, the metadata, the sustaining of a site after the grant',
    'ends: this is the labour DH runs on, and it is the labour least likely to be',
    'counted as scholarship at promotion time. a project can win a prize and still be',
    'held together by two people on rolling one-year contracts. remember that before',
    'you call the field either a revolution or a racket.</p></div>',
    '<hr>',
    '<p><b>archive_mouse</b> wrote (15 Mar):</p>',
    '<p>quoting you both because you are half agreeing and shouting anyway:</p>',
    '<pre>&gt; the field is just grant-chasing with a nicer interface\n' +
    '&gt; it forgot how to be critical\n' +
    'this is too tidy. the sharpest criticism of DH has come from\n' +
    'INSIDE it. Alan Liu asked, in so many words, where cultural\n' +
    'criticism had gone in the digital humanities, and he asked it\n' +
    'as a builder, not a bystander. Tara McPherson asked why the\n' +
    'field was so white, and traced it back to how the machines\n' +
    'themselves were built. so before you file the whole thing\n' +
    'under "neoliberal" and walk off, notice it is a house argument.</pre>',
    '<div class="fs-pull"><p>The field that people call uncritical produced its own',
    'harshest critics, and kept them on the masthead.</p></div>',
    '<hr>',
    '<p><b>tooling_up</b> wrote (16 Mar):</p>',
    '<p>fair. i will grant the labour point, it is the strong one. i still think the',
    '"neoliberal tools" framing throws out real work with the ideology. but yes, the',
    'answer to a bad DH is a better, more critical DH, not the abolition of the whole',
    'enterprise.</p>',
    '<img class="indie-pic" src="assets/media/web/dh/ibm-mainframe-01.jpg" alt=""><span class="indie-cap">An IBM 704 mainframe (photo: NASA, public domain)</span>',
    '<hr>',
    '<p><b>redbrick_reader</b> wrote (16 Mar):</p>',
    '<p>and this is exactly where the more interesting thread carries on. the people',
    'building a postcolonial and global DH are taking the labour and power questions',
    'seriously without abandoning the tools, see',
    '<a href="postcolonial-dh.geocities.ws">postcolonial-dh</a>. and if you want the',
    'argument about the machines and race that archive_mouse pointed at, go straight',
    'to <a href="tara-mcpherson.geocities.ws">tara-mcpherson</a>. read those two and',
    'then come back and tell me the field cannot criticise itself.</p>',
    '<hr>',
    '<p><small>thread archived by a moderator. no new replies. counter: 03471 ·',
    'best viewed at 800x600 · the humanist lounge, since 9 Jan</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">Digital Humanities Ring</a> ]</small></p>',
  ]);

// ---- postcolonial DH: the academic summary ----------------------------------

const POSTCOLONIAL = P('postcolonial-dh.geocities.ws', 'POSTCOLONIAL DH',
  'Postcolonial Digital Humanities // a summary', [
    '<!--bg:dh-screen-->',
    '<h1>Postcolonial Digital Humanities</h1>',
    '<p><small>a short summary page for a reading group, kept current as best i can.',
    'corrections welcome. last updated 2 May.</small></p>',
    '<hr>',
    '<p>Postcolonial digital humanities asks a plain question of a field that likes',
    'to think of itself as neutral infrastructure: whose archive, in whose language,',
    'built on whose labour, and left out of whose record. Roopika Risam is the name',
    'most closely tied to the phrase. Her book <i>New Digital Worlds: Postcolonial',
    'Digital Humanities in Theory, Praxis, and Pedagogy</i> sets out the case that',
    'the digital cultural record is not a mirror of the world but a selection, and',
    'that the selecting has a politics.</p>',
    '<blockquote class="fs-quote"><p><i>New Digital Worlds: Postcolonial Digital',
    'Humanities in Theory, Praxis, and Pedagogy</i></p></blockquote>',
    '<p>The argument runs roughly like this. What gets digitised, described and',
    'linked becomes what is easy to study, and what is easy to study quietly becomes',
    'what counts. If the money, the servers and the standards all sit in the wealthy',
    'North, then the record tilts that way without anyone deciding it should. The',
    'work of a postcolonial DH is to notice the tilt and to correct for it: to',
    'digitise the archives of the Global South, to build in more than one language,',
    'and to treat the gaps in the record as evidence rather than as nothing.</p>',
    '<img class="indie-pic" src="assets/media/web/dh/map-old-01.jpg" alt=""><span class="indie-cap">A literary map (Dallas Public Library, public domain)</span>',
    '<p>There is a subtler point underneath the practical one. A sign carries the',
    'accent of where it was made. Metadata schemes, character sets, the very',
    'categories a database offers, all of these were written somewhere by someone,',
    'and they fit some materials better than others. Decolonising the archive is not',
    'only a matter of adding more items. It is a matter of asking whether the',
    'container was ever shaped to hold them. Risam presses on that, and asks builders',
    'to design for the accented sign rather than flatten it into the default.</p>',
    '<p>This work does not stand alone. It joins the wider argument about the',
    'politics of the field, see <a href="the-dark-side-of-dh.geocities.ws">the-dark-side-of-dh</a>,',
    'and it shares people and infrastructure with the consortium that tries to build',
    'across the divides of geography and resource, see',
    '<a href="global-outlook-dh.geocities.ws">global-outlook-dh</a>.</p>',
    '<hr>',
    '<p><small>counter: 00908 · best viewed at 800x600 · a reading-group page ·',
    'last updated 2 May</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">Digital Humanities Ring</a> ]</small></p>',
  ]);

// ---- Global Outlook::Digital Humanities: the org page -----------------------

const GLOBALOUTLOOK = P('global-outlook-dh.geocities.ws', 'GO::DH',
  'Global Outlook::Digital Humanities (GO::DH)', [
    '<!--bg:dh-screen-->',
    '<h1>Global Outlook::Digital Humanities</h1>',
    '<p><small>an information page for GO::DH, a Special Interest Group. this is an',
    'unofficial mirror kept by a member; the official notices come by the mailing',
    'list. page tended 18 Apr.</small></p>',
    '<hr>',
    '<p>GO::DH, Global Outlook::Digital Humanities, exists to bridge the divides of',
    'geography, language and resource that run through the field. The premise is',
    'simple and awkward: the digital humanities describe themselves as global while',
    'most of the tools, the training and the servers sit in a handful of wealthy',
    'countries. GO::DH takes that gap as its whole reason to exist, and works to put',
    'scholars in high, middle and low income settings in the same conversation on',
    'equal terms.</p>',
    '<div class="fs-aside"><p><b>What the group actually does.</b> it connects',
    'people and projects across regions; it treats translation and access as first',
    'questions rather than afterthoughts; and it keeps asking who can take part in a',
    'given tool or method and who is quietly shut out by cost, bandwidth or',
    'language. Much of this overlaps with the minimal computing people, who build',
    'for low resource and long life, see',
    '<a href="minimal-computing.geocities.ws">minimal-computing</a>; Jentery Sayers',
    'is one of the names to read there.</p></div>',
    '<p>The best-loved thing the group made is <i>Around DH in 80 Days</i>, a tour',
    'that visited one digital humanities project a day from a different part of the',
    'world, so that a reader in one country could see what colleagues were building',
    'in eighty others. It was a teaching tool and a gentle argument at once: the',
    'field is wider than its usual reading list admits, and the way to prove it is',
    'to go and look.</p>',
    '<img class="indie-pic" src="assets/media/web/dh/network-graph-01.jpg" alt=""><span class="indie-cap">A network graph (image: Martin Grandjean, CC BY-SA 4.0)</span>',
    '<p>The political case behind all this is set out more fully by the postcolonial',
    'DH people, see <a href="postcolonial-dh.geocities.ws">postcolonial-dh</a>. GO::DH',
    'is the part that tries to turn the case into meetings, translations and shared',
    'infrastructure.</p>',
    '<hr>',
    '<p><small>counter: 01204 · best viewed at 800x600 · a member-run mirror, not the',
    'official site · page tended 18 Apr</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">Digital Humanities Ring</a> ]</small></p>',
  ]);

// ---- Debates in the Digital Humanities: the book-series page -----------------

const DEBATES = P('debates-in-dh.geocities.ws', 'DEBATES IN DH',
  'Debates in the Digital Humanities // the open series', [
    '<!--bg:dh-screen-->',
    '<h1>Debates in the Digital Humanities</h1>',
    '<p><small>a page about the book series, kept by a grad student who has read more',
    'of it than is healthy. not an official University of Minnesota Press page.',
    'last updated 30 Mar.</small></p>',
    '<hr>',
    '<p><i>Debates in the Digital Humanities</i> is the series where the field argues',
    'with itself in public. Edited by Matthew K. Gold, and later with Lauren F.',
    'Klein, it gathers the field into fat volumes of short pieces that disagree, and',
    'it does the thing the pieces keep demanding of everyone else: it opens itself,',
    'putting the volumes online to read for free while they are also sold as books.',
    'An open-access series about openness, which is at least consistent.</p>',
    '<div class="fs-pull"><p>The series does not settle the arguments. It keeps them',
    'in one place where you can watch them run.</p></div>',
    '<p>The recurring word is the "big tent". The digital humanities are held to be',
    'broad enough to shelter the concordance-builder, the map-maker, the critic of',
    'the map, the encoder, the network scientist and the person who thinks the whole',
    'enterprise has lost its nerve. The volumes let all of them in and then let them',
    'row. You can trace a single quarrel across editions and see positions harden,',
    'soften or quietly disappear.</p>',
    '<pre>the series, roughly:\n' +
    '  vol. 1   the field takes stock, "big tent" DH\n' +
    '  vol. 2   the critical turn gets louder\n' +
    '  vol. 3   race, labour, access move to the centre\n' +
    'each one free to read online, each one also a printed book.</pre>',
    '<img class="indie-pic" src="assets/media/web/dh/punchcards-stack-01.jpg" alt=""><span class="indie-cap">A tray of punched cards, 1959 (US National Archives, public domain)</span>',
    '<p>If you want the sharpest of those quarrels on its own, the political critique',
    'lives at <a href="the-dark-side-of-dh.geocities.ws">the-dark-side-of-dh</a>, and',
    'the global and postcolonial answer to it is at',
    '<a href="postcolonial-dh.geocities.ws">postcolonial-dh</a>. Both arguments run',
    'straight through these volumes.</p>',
    '<hr>',
    '<p><small>counter: 01677 · best viewed at 800x600 · valid XHTML, i checked twice ·',
    'last updated 30 Mar</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">Digital Humanities Ring</a> ]</small></p>',
  ]);

// ---- What is DH? the explainer ----------------------------------------------

const WHATISDH = P('whatisdh.geocities.ws', 'WHAT IS DH?',
  'What is the digital humanities? // an explainer', [
    '<!--bg:dh-screen-->',
    '<h1>What is the digital humanities?</h1>',
    '<p><small>the page i send people who ask me this at parties, so i do not have to',
    'answer it again from scratch. bookmark it and send it on. — a tired TA</small></p>',
    '<hr>',
    '<p>You will not get one answer, and that is not the field dodging the question.',
    'The digital humanities are more than one thing on purpose. Under the same name',
    'you will find people counting the words in ten thousand novels, people marking',
    'up a single manuscript line by line, people mapping where the letters of a dead',
    'poet went, people building the tool the next person will use, and people arguing',
    'that none of this is the humanities at all. The honest short answer is that DH',
    'is a family of practices that share machines and a willingness to argue.</p>',
    '<div class="fs-pull"><p>Ask ten practitioners what the digital humanities are',
    'and you will get eleven definitions, and every one of them will be doing some',
    'work.</p></div>',
    '<p>The most quoted attempt to pin it down is Matthew Kirschenbaum’s essay',
    '"What Is Digital Humanities and What’s It Doing in English Departments?"',
    'His answer is partly a joke and partly the truest thing anyone has said: the',
    'term is a tactical one, a name a community agreed to use because it opened',
    'doors, won posts and organised conferences, as much as it described a settled',
    'method. The label did work in the world before the definition ever caught up.</p>',
    '<img class="indie-pic" src="assets/media/web/dh/wordcloud-01.jpg" alt=""><span class="indie-cap">A word cloud (image: ACstudent, CC0)</span>',
    '<p>If you want the long version, the argument about what DH is and should be is',
    'carried on, volume after volume, in the open-access series at',
    '<a href="debates-in-dh.geocities.ws">debates-in-dh</a>. And if you want the',
    'quiet, patient root of it, go back to the person who taught the field to call',
    'its core method "modelling" and who has run the discussion list since the',
    'eighties, see <a href="willard-mccarty.geocities.ws">willard-mccarty</a>. Start',
    'with either, and do not expect to be finished.</p>',
    '<hr>',
    '<p><small>counter: 02240 · best viewed at 800x600 · under perpetual construction,',
    'like the field · last updated 21 Feb · — a tired TA</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">Digital Humanities Ring</a> ]</small></p>',
  ]);

export const DH_F = [DARKSIDE, POSTCOLONIAL, GLOBALOUTLOOK, DEBATES, WHATISDH];
