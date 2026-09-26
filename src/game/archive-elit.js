// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE HYPERTEXT RING, and the pages round it.
//
// Pages made in the forms the electronic literature of the period used, by
// people on this network, about this network. None of them names the work it
// borrows a form from. The browser supports three period behaviours for them,
// read from markers in the served HTML (see nsRender in main.js):
//
//   <!--refresh:18:addr-->       the page moves on by itself after 18 seconds
//   <a data-guard="addr">        a link that is only a link once addr is read;
//                                data-else="addr2" sends it elsewhere until then
//   <span data-morph="a|b">      the text turns from a into b a letter at a time
//   <div data-flash="w|w|w">     one word at a time, data-ms apart
//
// View Source works on every page here, and on one of them it is the page.

import { stillsReel } from './stills.js';

const P = (domain, name, title, body, bg) => ({ domain, name, title, body, ...(bg ? { bg } : {}) });
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

// ---- wwwwwwwww ---------------------------------------------------------------
// Laid out as a drawing in the source and written with no <pre>, so the
// browser collapses the whitespace and shows a line of noise. The drawing is
// the obelisk, and the labels are right.
const TOWER = [
  '                        .',
  '                       /|\\',
  '                      / | \\              LAMP ...... red / amber / off',
  '                     /  |  \\',
  '                    /___|___\\            UPLINK .... dead since the collapse',
  '                    |   |   |',
  '                    | [ = ] |            CELL BAY .. four, charged from the feed',
  '                    |   |   |',
  '                    |   |   |            CONSOLE ... ob_term, south face, waist height',
  '                    |  [#]  |',
  '                    |   |   |            FEED ...... underground, to the rack',
  '                   _|___|___|_',
  '                  /___________\\          FOOTING ... poured, not bolted',
  '                  ~~~~~~~~~~~~~',
];
const WWW = P('wwwwwwwww.geocities.ws', 'wwwwwwwww', '%Location |http://wwwwwwwww.geocities.ws/|', [
  '<!--bg:jodi-->',
  '<font face="courier" size="5">',
  ...TOWER,
  '</font>',
], 'jodi');

// ---- flight: eighteen seconds a page --------------------------------------
const H = 'flight.geocities.ws';
const HEGIRA = [
  ['', 'The boat was not his. He had watched it for three days from the dunes and on the fourth the man who rowed it did not come down to the water, and that was the whole of the decision.'],
  ['2', 'Nobody leaves an island. They go to another one. He had read that on a wall in the Backspace and had thought it was about machines.'],
  ['3', 'The obelisk on the headland turned its lamp to amber as he passed under it, which it did for gulls and for weather. He took it personally anyway.'],
  ['4', 'Oars are a technology you can mend with a knife. He said this aloud twice, to the sea, and the sea did not repeat it.'],
  ['5', 'At the mid-point of any crossing there is a place where the island behind is as small as the one in front. He did not notice it.'],
  ['6', 'A W-4 was standing on the far beach with its lamp off. He could not tell if it was waiting for him or had simply stopped there, and he rowed more slowly.'],
  ['7', 'The word for it in the old books is flight. It meant running away, and it meant the other thing too, and he found he could not keep them apart in the boat.'],
  ['8', 'He landed. The machine had gone. The sand had its tracks in it going up the beach and none coming back.'],
];
const hAddr = (k) => (k ? `${H}/${k}` : H);
const HEGIRA_PAGES = HEGIRA.map(([k, text], i) => {
  const n = HEGIRA.length;
  const at = (d) => hAddr(HEGIRA[(i + d + n) % n][0]);
  return P(hAddr(k), 'FLIGHT', `flight ${i + 1}`, [
    `<!--refresh:18:${at(1)}-->`,
    '<!--bg:hegira-->',
    '<table width="100%" cellpadding="8"><tr>',
    `<td></td><td align="center"><a href="${at(3)}">up</a></td><td></td></tr><tr>`,
    `<td valign="middle"><a href="${at(-1)}">back</a></td>`,
    `<td width="70%"><p>${text}</p></td>`,
    `<td valign="middle"><a href="${at(5)}">on</a></td></tr><tr>`,
    `<td></td><td align="center"><a href="${at(2)}">down</a></td><td></td>`,
    '</tr></table>',
  ], 'hegira');
});

// ---- yesterday: links that wait until they have been read ------------------
const Y = 'yesterday.geocities.ws';
const yA = (k) => (k ? `${Y}/${k}` : Y);
const YESTERDAY = [
  ['', 'YESTERDAY', [
    '<p>There was a machine at the gate this morning with its lamp out, and a',
    'boy beside it, or a coat on the hedge where a boy would have stood. I did',
    'not stop. I am telling this in the wrong order already.</p>',
    `<p><a href="${yA('gate')}">Do you want to hear about it?</a></p>`,
    `<p><small><a href="${yA('coat')}" data-guard="${yA('gate')}">the coat</a> &middot; `,
    `<a href="${yA('lamp')}" data-guard="${yA('coat')}" data-else="${yA('gate')}">the lamp</a></small></p>`,
  ]],
  ['gate', 'THE GATE', [
    '<p>A T-1 at a gate is not strange. They stop where the path narrows and',
    'wait for the path to be something else. I have passed a hundred of them.',
    'This one was flat. You can see that from the road: they sit lower when',
    'the cell is gone.</p>',
    `<p><a href="${yA('coat')}">It was only a coat.</a> <a href="${yA('son')}" data-guard="${yA('coat')}">It was not only a coat.</a></p>`,
  ]],
  ['coat', 'THE COAT', [
    '<p>He has a green one. Half the island has a green one, because the',
    'store at the harbour had a crate of them and nothing else. I have',
    'said this to myself nine times since.</p>',
    `<p><a href="${yA('gate')}">back to the gate</a> &middot; <a href="${yA('phone')}">I rang the house</a></p>`,
  ]],
  ['phone', 'THE HOUSE', [
    '<p>Nobody answered, which means he was out, which he is most mornings.',
    'It means that. I rang again at noon and let it ring to the end.</p>',
    `<p><a href="${yA('lamp')}" data-guard="${yA('son')}" data-else="${yA('coat')}">what the lamp was doing</a></p>`,
  ]],
  ['son', 'HIM', [
    '<p>He has been going out to the machines. He talks to them through a',
    'laptop he mended himself, and he says they answer. I told him a machine',
    'with its lamp off is not asleep. I do not know why I said that. I do not',
    'know if it is true.</p>',
    `<p><a href="${yA('phone')}">the house</a> &middot; <a href="${yA('lamp')}">the lamp</a></p>`,
  ]],
  ['lamp', 'THE LAMP', [
    '<p>Off. Not amber, not red. Off is what they do when they are shut down',
    'from outside, by hand, by somebody standing close enough to touch.</p>',
    `<p><a href="${yA('white')}" data-guard="${yA('son')}">I went back in the afternoon.</a></p>`,
  ]],
  ['white', 'AFTERNOON', [
    '<p>The machine had gone. The coat was on the hedge. It was a green coat.',
    'I took it down and it was not his, and I stood there with it, and',
    'then I put it back where it had been, the way it had been, so it would',
    'be there for whoever it belonged to.</p>',
    `<p><a href="${Y}">again</a></p>`,
  ]],
];
const YESTERDAY_PAGES = YESTERDAY.map(([k, name, body]) =>
  P(yA(k), name, `yesterday: ${name.toLowerCase()}`, ['<!--bg:yesterday-->', ...body], 'yesterday'));

// ---- the first line, turning ---------------------------------------------
const MORPH = P('transliteral.geocities.ws', 'TRANSLITERAL', 'transliteral: Od. 1.1', [
  '<!--bg:morph-->',
  '<h1>&alpha; &rarr; a</h1>',
  '<p><span class="morph" data-morph="ἄνδρα μοι ἔννεπε, μοῦσα, πολύτροπον, ὃς μάλα πολλὰ|Tell me, O Muse, of that ingenious hero who travelled far">ἄνδρα μοι ἔννεπε, μοῦσα, πολύτροπον, ὃς μάλα πολλὰ</span></p>',
  '<p><small>Od. 1.1. The English is Samuel Butler\'s, 1900.</small></p>',
], 'morph');

// ---- programs that are poems ----------------------------------------------
// Every one of these runs. A test holds them to that.
export const POEMS = [
  ['aubade', 'tidewrack', [
    'let late = 15 in',
    'eye "amber" ; flash 1 ;',
    'if charge < late then home',
    'else if threat then wait',
    'else patrol',
  ]],
  ['keeping', 'tidewrack', [
    'let near = 2 in',
    'let far = 30 in',
    'eye "white" ;',
    'if range > far then home',
    'else if range < near then wait',
    'else follow',
  ]],
  ['the leaving', 'n[o]de', [
    '(* [c]harge.ing ov[er]night, the [s]elf.d[r]aining *)',
    'eye "blue" ; flash 0 ;',
    'if hurt then home',
    '(* h[o]me.b[e]acon, the (w)hole of it *)',
    'else if linked then patrol',
    'else wait',
  ]],
  ['what the tower says', 'n[o]de', [
    '(* a lamp [ans]wering, a l[amp] [as]king *)',
    'eye "red" ; flash 6 ; beep ;',
    'if threat then wait',
    'else (eye "green" ; flash 0 ; patrol)',
  ]],
  ['no e', 'oulipo_ish', [
    'flash 4 ; patrol',
  ]],
];
const POETRY = P('ml-poetry.geocities.ws', 'ML POETRY', 'ml poetry :: programs that are poems that run', [
  '<!--bg:codeterm-->',
  '<div class="ns-prose">',
  '<h1>ml poetry</h1>',
  '<p><small>a page of programs. every one of them runs on a machine. post one',
  'and watch.</small></p>',
  '<hr>',
  ...POEMS.flatMap(([t, who, lines]) => [
    `<h2>${esc(t)}</h2>`,
    `<pre>${lines.map(esc).join('\n')}</pre>`,
    `<p><small>-- ${esc(who)}</small></p>`,
  ]),
  '<hr>',
  '<p><b>on no e</b>. The rule was a program with no letter e in it. There is',
  'no <code>then</code> and no <code>else</code>, so there is no',
  '<code>if</code> worth writing, and no <code>eye</code> and no',
  '<code>let</code>. What is left is one aid and one intent. It runs.</p>',
  '<p><small>more combinations: <code>cent</code> in /usr/games on any NostBook.',
  '<a href="hypertext-ring.geocities.ws">the hypertext ring</a></small></p>',
  '</div>',
], 'codeterm');

// ---- the dispensary: a story in blue links ----------------------------------
const T = 'philome.la/dispensary';
const tA = (k) => (k ? `${T}/${k}` : T);
const TWINE = [
  ['', [
    '<p>The room is the size it always is.</p>',
    '<p>There is a <a href="' + tA('food') + '">food dispenser</a>, a <a href="' + tA('water') + '">water dispenser</a> and a <a href="' + tA('trash') + '">trash chute</a>.</p>',
    '<p>There is a <a href="' + tA('screen') + '">door with a screen in it</a>.</p>',
  ]],
  ['food', [
    '<p>A bar the colour of the wall. It tastes of the wall.</p>',
    '<p>You eat it because the counter on the dispenser goes down by one when you do, and you like to see something go down.</p>',
    '<p><a href="' + T + '">Back.</a></p>',
  ]],
  ['water', [
    '<p>The water comes out at the temperature of the room.</p>',
    '<p><a href="' + T + '">Back.</a></p>',
  ]],
  ['trash', [
    '<p>You put the wrapper in the chute. The chute takes it.</p>',
    '<p>Somewhere above the ceiling something is keeping a tally of wrappers. You have never been told this. You are sure of it.</p>',
    '<p><a href="' + T + '">Back.</a></p>',
  ]],
  ['screen', [
    '<p>The screen shows the outside. There is a beach, and on the beach there is a machine standing with its lamp off.</p>',
    '<p><a href="' + tA('out') + '">Go out.</a></p>',
    '<p><a href="' + T + '">Stay.</a></p>',
  ]],
  ['out', [
    '<p>It is the same machine. It has been standing there since the first day. Its lamp is off because nobody has told it anything.</p>',
    '<p>You could <a href="' + tA('tell') + '">tell it something</a>.</p>',
    '<p><a href="' + tA('day2') + '">Go back in.</a></p>',
  ]],
  ['tell', [
    '<p>You tell it your name.</p>',
    '<p>It does not do anything with your name. You feel better anyway, and then worse, and then you go back in.</p>',
    '<p><a href="' + tA('day2') + '">Go back in.</a></p>',
  ]],
  ['day2', [
    '<p>The room is the size it always is.</p>',
    '<p>The food dispenser reads one less. The water is the temperature of the room. The trash chute is full, which it has never been.</p>',
    '<p>On the screen the machine\'s lamp is amber.</p>',
    '<p><a href="' + tA('screen') + '">Look again.</a></p>',
  ]],
];
const TWINE_PAGES = TWINE.map(([k, body]) => P(tA(k), 'DISPENSARY', 'dispensary', ['<!--bg:twine-->', ...body], 'twine'));

// ---- abstract machines: one word at a time ---------------------------------
const FLASH_WORDS = ('THE BOAT | IS | NOT | YOURS | . | YOU | ROW | IT | ANYWAY | . | THE | SEA | HAS | NO | LAMP | . | THE | MACHINES | ON | THE | BEACH | WATCH | THE | BOAT | NOT | YOU | . | ROW | . | ROW | . | ABSTRACT | MACHINES | SIDE A | DAISY CUTTER | LOGARITHM | SIDE B | TRANSLATION | UNITED').split(' | ');
const FLASH = P('abstract-machines.geocities.ws', 'ABSTRACT MACHINES', 'ML — Abstract Machines EP', [
  '<!--bg:yhchi-->',
  `<div class="flash" data-flash="${FLASH_WORDS.join('|')}" data-ms="420">THE BOAT</div>`,
  '<p class="flash-foot"><small>ML &middot; ABSTRACT MACHINES EP &middot; on cassette, somewhere on this island</small></p>',
], 'yhchi');

// ---- ml war --------------------------------------------------------------
const WAR = P('mlwar.geocities.ws', 'ML WAR', 'ml war :: king of the hill, east ridge', [
  '<!--bg:codeterm-->',
  '<div class="ns-prose">',
  '<h1>ml war</h1>',
  '<p><small>two machines, two programs, one field. last one standing keeps',
  'the hill.</small></p>',
  '<hr>',
  '<h2>Rules</h2>',
  '<pre>1. two W-4s, both yours, one program each, posted over the air',
  '2. each runs defend, and each is told the other is the threat',
  '3. no touching them after the post',
  '4. a machine that goes home to charge has left the field and lost</pre>',
  '<p>The second rule is the hard part. <code>defend</code> goes for',
  'whatever comes for you, so you stand between them and walk away, and',
  'whichever one reaches the other first starts it.</p>',
  '<h2>The hill</h2>',
  '<pre>  program         by          won  lost  held',
  '  stayer.ml       tidewrack    11     2    9',
  '  imp.ml          ronnie        7     7    3',
  '  dwarf.ml        n[o]de        6     8    2',
  '  flee_first.ml   anon          0    14    0</pre>',
  '<h2>stayer.ml</h2>',
  '<pre>(* stayer -- will not go home until it is nearly flat *)',
  'eye "red" ; flash 2 ;',
  'if charge &lt; 6 then home',
  'else defend</pre>',
  '<p>Six is low. The reserve takes over at five, and a machine on its reserve',
  'walks home slowly and is easy to catch. It has lost twice, both times to a',
  'stayer.ml of its own.</p>',
  '<h2>imp.ml</h2>',
  '<pre>(* imp -- the smallest thing that plays *)',
  'defend</pre>',
  '<p>No charge check, so it fights until it drops. Half the time the other',
  'machine is still at eighty per cent when the imp goes flat.</p>',
  '<hr>',
  '<p><small>There is a T-1 on every island that takes the first program you post',
  'and reads it back to you word for word, and then after a minute or so goes',
  'loopy: lamp all over the place, doing whatever it likes. Post it again and it',
  'settles. It only does it the once. -- ronnie</small></p>',
  '<p><small><a href="hack_nostos.geocities.ws">hack_nostos</a> &middot; <a href="hypertext-ring.geocities.ws">the hypertext ring</a></small></p>',
  '</div>',
], 'codeterm');

// ---- pursuit.ml, three witnesses ---------------------------------------------
const VARIORUM = P('pursuit-variorum.geocities.ws', 'PURSUIT, COLLATED', 'pursuit.ml: a collated text', [
  '<!--bg:ending-->',
  '<div class="ns-prose">',
  '<center><h1>pursuit.ml</h1><p>the three witnesses, collated</p></center>',
  '<hr>',
  '<h2>Sigla</h2>',
  '<pre>A   read off a unit over the air (T1_02)',
  'B   works printout, fan-fold, undated',
  'C   RON field disk, second copy</pre>',
  '<h2>Text</h2>',
  '<pre>1  if charge &lt; 15 then home',
  '2  else if threat then hunt',
  '3  else patrol</pre>',
  '<h2>Apparatus</h2>',
  '<pre>1  15 ] A C;  25 B',
  '2  hunt ] A B;  (beep ; hunt) C',
  '3  no variants</pre>',
  '<h2>Notes</h2>',
  '<p><b>1.</b> B is the older reading. The foundry lowered the threshold after',
  'the printout was made; the works history (<code>sccs prs</code>, delta',
  '1.2) records a unit returning home under 15 and says nothing about 25.',
  'Either B is a draft that never shipped or the history is incomplete.</p>',
  '<p><b>2.</b> C adds a service aid. <code>beep</code> costs the machine',
  'nothing and changes nothing it does. Someone at RON wanted to hear the',
  'hunt start. The text is followed here in A and B.</p>',
  '<p><small>The witnesses are on any NostBook, in /home/misc/witnesses.',
  'Collated by hand. <a href="pursuit-commentary.geocities.ws">A commentary on the same program</a>.</small></p>',
  '</div>',
], 'ending');

// ---- a commentary on six lines ------------------------------------------------
const PF = 'pursuit-commentary.geocities.ws';
const COMMENTARY = P(PF, 'PURSUIT, WITH A COMMENTARY', 'TIRESIAS-pursuit 1.4, with a commentary by V. Botkin', [
  '<!--bg:ending-->',
  '<div class="ns-prose">',
  '<center><h1>TIRESIAS-pursuit 1.4</h1>',
  '<p>a program in three lines, with a foreword, a commentary and an index<br>',
  'by V. Botkin, formerly of the works</p></center>',
  '<hr>',
  '<h2>Foreword</h2>',
  '<p>The program below is the one every T-1 on this island runs. I have read',
  'it closely for a long time. I maintained these machines, in the south',
  'estate, in the years before the estate was closed to its own staff, and',
  'I believe I am the only living reader who knows what each of these lines',
  'cost. The notes that follow are keyed by line. I have kept them short',
  'where I could.</p>',
  '<h2>The program</h2>',
  '<pre>1  if charge &lt; 15 then home',
  '2  else if threat then hunt',
  '3  else patrol</pre>',
  '<h2>Commentary</h2>',
  '<p><b>Line 1: <code>charge &lt; 15</code>.</b> Fifteen was not the',
  'first number. The reader will find twenty-five in one witness (see the',
  '<a href="pursuit-variorum.geocities.ws">collated text</a>) and may',
  'suppose a clerical difference. It was not clerical. I was in the room',
  'when fifteen was chosen. It was a Thursday; the south estate had lost',
  'three units that week to flat cells on the long beat past the reservoir,',
  'and the reservoir is where I walked in the evenings, before the estate',
  'was closed, with a dog that is not relevant here. Fifteen is the charge',
  'at which a T-1 can still reach its tower from the far end of that beat,',
  'which is where I used to turn for home.</p>',
  '<p><b>Line 1: <code>home</code>.</b> See Index, under <i>home</i>, and',
  'under <i>south estate</i>.</p>',
  '<p><b>Line 2: <code>threat</code>.</b> The sense is true when the unit',
  'has a person in sight. The manual calls this an enemy. I will not. I have',
  'been in the sight of a great many of these units, in daylight, carrying',
  'a clipboard, and none of them ever had a reason to regard me as anything',
  'but staff. That they would now is a change in the world and not in the',
  'program, which has not been edited since.</p>',
  '<p><b>Line 2: <code>hunt</code>.</b> Between the versions numbered 1.3',
  'and 1.4 there was a line here, <code>else if hurt then flee</code>. It',
  'was written by a colleague, E. Marsh, whose reasons are in the history and',
  'were good ones. It was removed. I was not consulted. Marsh left the works',
  'in the same month and I am told took a laptop. I have counted since the',
  'units that would have come home under that line. On the south estate',
  'alone there were eleven.</p>',
  '<p><b>Line 3: <code>else patrol</code>.</b> The beat. For the south',
  'estate, the long one past the reservoir, which I have described. The',
  'units walk it still, I am told, and I have no way now to go and see.</p>',
  '<h2>Index</h2>',
  '<pre>beat, the long, 1, 3; see also reservoir',
  'dog, not relevant, 1',
  'E. Marsh, 2; took a laptop, 2',
  'fifteen, a distance, 1',
  'flee, removed, 2; eleven units, 2',
  'home, 1, and passim; see south estate',
  'reservoir, 1, 3',
  'south estate, closed to its own staff; not seen since, 3',
  'twenty-five, not clerical, 1</pre>',
  '<p><small><a href="hypertext-ring.geocities.ws">the hypertext ring</a></small></p>',
  '</div>',
], 'ending');

// ---- a mirror of the encyclopedia -------------------------------------------
// The same thirteen articles as wikipedia.org, and one more.
const MIRROR = 'wikipedia.mirror.nl';
const MIRROR_INDEX = P(MIRROR, 'WIKIPEDIA (MIRROR)', 'Wikipedia — mirror, nl', [
  '<!--bg:grey-->',
  '<center><h1>WIKIPEDIA</h1></center>',
  '<center><p><small>mirror &middot; synchronised nightly &middot; last synchronisation not recorded</small></p></center>',
  '<hr>',
  '<h2>Articles held</h2>',
  '<a href="wiki:transformer">Transformer (machine learning)</a>',
  '<a href="wiki:attention">Attention (machine learning)</a>',
  '<a href="wiki:mentor">John Mentor</a>',
  '<a href="wiki:torism">Torism</a>',
  '<a href="wiki:magnifica">Magnifica Humanitas</a>',
  '<a href="wiki:leo">Leo XIV</a>',
  '<a href="wiki:pkd">Philip K. Dick</a>',
  `<a href="${MIRROR}/scheria">Scheria</a>`,
  '<a href="wiki:macintyre">After Virtue</a> <small>[fragment]</small>',
  '<a href="wiki:mcluhan">Marshall McLuhan</a>',
  '<a href="wiki:kittler">Friedrich Kittler</a> <small>[fragment]</small>',
  '<a href="wiki:ernst">Wolfgang Ernst</a> <small>[fragment]</small>',
  '<a href="wiki:frankfurt">Frankfurt School</a> <small>[fragment]</small>',
  '<a href="wiki:collapse">Network Collapse</a>',
  '<p><small>14 of 6,241,880 articles in store.</small></p>',
], 'grey');
const SCHERIA = P(`${MIRROR}/scheria`, 'SCHERIA', 'Scheria — Wikipedia (mirror)', [
  '<!--bg:grey-->',
  '<h1>Scheria</h1>',
  '<p><small>From Wikipedia, the free encyclopedia</small></p>',
  '<hr>',
  '<p><b>Scheria</b> is an island group in the eastern archipelago, the last',
  'inhabited landfall on the western route before Ithaca. Its population at',
  'the last count was estimated at eleven thousand. It is administered from',
  'its principal harbour, which shares the island\'s name.</p>',
  '<h2>Shipping</h2>',
  '<p>Scheria is known for its ferry service, which has operated without',
  'crews for as long as there are records. The vessels are steered by no',
  'person. Passengers are asked where they wish to go and are taken there;',
  'the service is reported to have delivered every passenger it has carried,',
  'including several who had not yet decided where they were going when they',
  'boarded. Its operators decline to describe the navigation system.</p>',
  '<h2>Literature</h2>',
  '<p>The literature of Scheria is one of fantasy. Its epics and ballads do',
  'not refer to Scheria at all, but to five other islands, none of which',
  'appear on any chart held by the harbour authority: <i>Ogygia</i>,',
  '<i>Aegilia</i>, <i>Aeaea</i>, <i>Thrinacia</i> and <i>Ithaca</i>. In',
  'these, the islands are held by machines that watch from towers, and a',
  'person crosses between them with a laptop and a boat.</p>',
  '<h2>See also</h2>',
  '<ul><li>Phaeacia</li><li>Corfu</li></ul>',
  '<p><small>This page was last modified on 14/03.</small></p>',
  `<hr><a href="${MIRROR}">Wikipedia (mirror) &mdash; articles held</a>`,
], 'grey');

// ---- Hayao's machine ------------------------------------------------------
const ZONE = P('hayao-zone.geocities.ws', 'THE ZONE', 'the zone :: a synthesiser for pictures', [
  '<!--bg:codeterm-->',
  '<div class="ns-prose">',
  '<h1>the zone</h1>',
  '<p><small>a video synthesiser, homebuilt. by hayao.</small></p>',
  '<hr>',
  '<p>Feed it a picture and it gives the picture back as brightness, cell by',
  'cell, in characters from a ramp of twenty-three. Dark is a space. Bright is',
  'an at-sign. Colour goes to amber, because amber is what the old terminals',
  'had.</p>',
  '<pre>  .,:;irsXA253hMHGS#9B&amp;@</pre>',
  '<p>I call what comes out the zone. Put in a photograph of a street and',
  'you get characters, and the street is in them if you stand back.</p>',
  '<p>The machines see this way. RON has a relay that lets you look through',
  'one, and the panel in the corner of that view is this synthesiser, or my',
  'synthesiser is that panel; I built mine first and I cannot prove it.</p>',
  '<p><small><a href="hypertext-ring.geocities.ws">the hypertext ring</a></small></p>',
  '</div>',
], 'codeterm');

// ---- La Jetée ---------------------------------------------------------------
const JETEE = P('la-jetee.geocities.ws', 'LA JETEE', 'La Jet&eacute;e (Chris Marker, 1962)', [
  '<!--bg:ending-->',
  '<div class="ns-prose">',
  '<center><h1>La Jet&eacute;e</h1>',
  '<p>Chris Marker, 1962. Twenty-eight minutes, black and white.</p></center>',
  '<hr>',
  '<p>A film made of still photographs, with a narrator, a little music and',
  'the sound of whispering in German. The camera moves over the stills, and',
  'they dissolve into one another, some held a long time and some almost',
  'at once. There is one shot that moves: a woman asleep, who opens her eyes.</p>',
  '<p>Paris after a third world war. The survivors live underground, and the',
  'men who run the camps are looking for a way out through time. They choose',
  'a prisoner because he is attached to one image from his childhood: a',
  'woman at the end of the observation pier at Orly, and a man falling. They',
  'send him back along that image, again and again.</p>',
  '<p>The end of the film is the pier. What he saw there as a boy was his own',
  'death.</p>',
  '<p>Marker went on to make <i>Sans Soleil</i> (1983), which walks through',
  'the San Francisco of <i>Vertigo</i> and calls the synthesised images in it',
  'the Zone, after Tarkovsky.</p>',
  '<hr>',
  '<p><small>Somebody made one of these on a NostBook: <a href="photo-roman.geocities.ws">La',
  'Plage</a>. It is on every one as <code>stills</code>. See also <a href="hayao-zone.geocities.ws">the',
  'zone</a> &middot; <a href="the-french-new-wave.geocities.ws">the French new',
  'wave</a></small></p>',
  '</div>',
], 'ending');

// ---- La Plage, embedded, with a review -----------------------------------------
const PLAGE = P('photo-roman.geocities.ws', 'LA PLAGE', 'La Plage, un photo-roman', [
  '<!--bg:ending-->',
  '<div class="ns-prose">',
  '<center><h1>La Plage</h1>',
  '<p>un photo-roman &middot; anonymous &middot; about two minutes &middot; French, English subtitles</p></center>',
  stillsReel({ embed: true }),
  '<p><small>The same film is on every NostBook: <code>stills</code>.</small></p>',
  '<hr>',
  '<h2>The future perfect of the save file</h2>',
  '<p><i>La Plage</i> runs a little over two minutes: two title cards, twelve',
  'photographs and a black, a French narration and English subtitles. It does not',
  'hide its source. The cards rewrite the opening of Marker&rsquo;s',
  '<a href="la-jetee.geocities.ws"><i>La Jet&eacute;e</i></a> (1962) with Ithaca',
  'where Orly was and POSEIDON where the third war was, and the form is the one',
  'Marker&rsquo;s credits named: the <i>photo-roman</i>, stills held, dissolved into',
  'one another and narrated, with a single image allowed to move. Here the moving',
  'image is the eighth, and what moves in it is the grain, three exposures of one',
  'framing cross-fading under the drift.</p>',
  '<p>Barthes located the force of the photograph in its tense. Whatever else it',
  'shows, it certifies that the thing was there in front of the lens: <i>&ccedil;a',
  'a &eacute;t&eacute;</i>, that-has-been. <i>La Plage</i> puts that tense under',
  'pressure with two frames. The first photograph is the beach at Ithaca, a prow',
  'with an eye painted on it, sand, no one. The eighth is the same framing to the',
  'pixel, and now a figure stands on the sand with a dog beside it. For the person',
  'watching on a NostBook the figure is recognisable, because it is the figure they',
  'have been walking about as, and the arrival it certifies is one they have not',
  'yet made. The photograph&rsquo;s tense becomes the future perfect,',
  'that-will-have-been, which is the tense a save file is written in: a record of',
  'a position occupied, consulted in order to occupy it again.</p>',
  '<p>Raymond Bellour described the pensive spectator, the one a stopped image',
  'hands back to themselves, and Deleuze read the modern cinema as a cinema of the',
  'time-image, in which the cut no longer serves the action and duration shows',
  'through. Both accounts assume a camera and a world in front of it. <i>La',
  'Plage</i> has neither. Its stills were rendered by the engine the game runs on,',
  'from a world that has only ever existed as a computation, and the silver halide',
  'is a noise function applied afterwards. Marker&rsquo;s photographs posed as a',
  'film. These are renders posing as photographs posing as a film, and the',
  'grain is the only part of them that was added to look accidental.</p>',
  '<p>The recognition scenes of the <i>Odyssey</i> run on signs that have to be',
  'read: the scar, the bed, the bow. The dog is the exception. Argos knows his',
  'master without a sign and dies of it, which in Book 17 takes three lines.',
  '<i>La Plage</i> places its dog in the sixth photograph, before any',
  'recognition, as a condition of the return rather than its proof (&ldquo;Each',
  'time back, the dog was there&rdquo;), so the Homeric order is inverted and the',
  'dog becomes evidence that the loop is running. Marker&rsquo;s man discovers at',
  'the end of the jetty that the image he had carried since childhood was his own',
  'death. The last line here, over the black, gives the discovery to the',
  'return instead: what was seen on the beach was a homecoming, the',
  '<i>nostos</i> itself, already accomplished before it was attempted.</p>',
  '<p>Kermode&rsquo;s argument in <a href="sense-of-an-ending.geocities.ws"><i>The',
  'Sense of an Ending</i></a> is that an ending reorganises everything before it,',
  'turning successive time into significant time, <i>chronos</i> into',
  '<i>kairos</i>. The black does this literally: the final subtitle rewrites the',
  'first photograph from an empty beach into a place where somebody is about to',
  'be. The islands of this game are generated from a seed, so the beach in the',
  'first frame could be derived from a number before anybody stood on it, and the',
  'stills are identical on every machine and shown to every player whatever they',
  'have done. The fate the narration describes is also a property of the build',
  'it was made in.</p>',
  '<p>The faces at the close are the engine&rsquo;s own face textures, unwrapped',
  'and flattened for a mesh, lit from one side against black as Marker lit his',
  'men from the future. None of them was ever on a head. The subtitles in the',
  'third of them read &ldquo;They had no use for these scraps of another',
  'time&rdquo; over a woman with a dark mark on her forehead where a sensor',
  'would sit. The credit to Marker comes last, over the black, after the',
  'subtitle has faded.</p>',
  '<p align="right">NaN</p>',
  '<hr>',
  '<p><small><a href="la-jetee.geocities.ws">La Jet&eacute;e</a> &middot; <a href="hypertext-ring.geocities.ws">the hypertext ring</a> &middot; <a href="the-french-new-wave.geocities.ws">the French new wave</a></small></p>',
  '</div>',
], 'ending');

// ---- the ring --------------------------------------------------------------
const RING = P('hypertext-ring.geocities.ws', 'THE HYPERTEXT RING', 'The Hypertext Ring', [
  '<!--bg:ending-->',
  '<h1>The Hypertext Ring</h1>',
  '<p><small>a webring &middot; pages that are read by clicking &middot; walked, not searched</small></p>',
  '<hr>',
  '<p><b>Member sites</b>:</p>',
  '<ul>',
  `<li><a href="${H}">flight</a> <small>(eighteen seconds a page)</small></li>`,
  `<li><a href="${Y}">yesterday</a></li>`,
  `<li><a href="${T}">dispensary</a></li>`,
  '<li><a href="transliteral.geocities.ws">transliteral</a></li>',
  '<li><a href="abstract-machines.geocities.ws">ML &mdash; Abstract Machines</a></li>',
  '<li><a href="wwwwwwwww.geocities.ws">wwwwwwwww</a></li>',
  '<li><a href="ml-poetry.geocities.ws">ml poetry</a></li>',
  '<li><a href="mlwar.geocities.ws">ml war</a></li>',
  '<li><a href="pursuit-variorum.geocities.ws">pursuit.ml, collated</a></li>',
  `<li><a href="${PF}">pursuit.ml, with a commentary</a></li>`,
  '<li><a href="hayao-zone.geocities.ws">the zone</a></li>',
  '<li><a href="la-jetee.geocities.ws">la jet&eacute;e</a></li>',
  '<li><a href="photo-roman.geocities.ws">la plage, un photo-roman</a></li>',
  '</ul>',
  '<p><small>strands: <a href="literature-ring.geocities.ws">Literature Ring</a> &middot; <a href="hack_nostos.geocities.ws">hack_nostos</a></small></p>',
], 'ending');

export const ELIT_SITES = [
  RING, WWW, ...HEGIRA_PAGES, ...YESTERDAY_PAGES, MORPH, POETRY, ...TWINE_PAGES,
  FLASH, WAR, VARIORUM, COMMENTARY, MIRROR_INDEX, SCHERIA, ZONE, JETEE, PLAGE,
];
