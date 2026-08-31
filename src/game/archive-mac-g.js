// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BATCH MAC_G — the book, the last classic system, and the sequencer.
//
// Filed on the home-computers ring with the machines, because the `mac` web in
// this corpus is Project MAC at Tech Square and has nothing to do with the
// Macintosh, which caught me out and will catch out the next person.
//
// The mac web had the machines and not the ideas. These are the three things a
// person who used those machines actually thinks about: a book that told
// developers what an interface owed its user, the operating system that was the
// end of a twenty-year line, and the program that was doing something nobody
// else was doing and got bought.
//
// THE GUIDELINES PAGE IS THE ONE THAT MATTERS. It sets out principles written
// down in 1987 and then, without editorialising, notes which of them are
// currently observed. A reader in a world of machines that answer confidently
// and cannot be corrected finds the words user control, forgiveness, feedback
// and perceived stability in a book about menus, and is left to it.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

const RING = [
  '<hr>',
  '<p><small>',
  '[ <a href="home-computers-ring.geocities.ws">Home Computers Ring</a> ]<br>',
  'ring member. « prev · random · next »',
  '</small></p>',
];

// ---- the Human Interface Guidelines ------------------------------------------

const HIG = P('apple-hig.geocities.ws', 'THE HIG',
  'Apple Human Interface Guidelines', [
    '<!--bg:mac-->',
    '<h1>The Human Interface Guidelines</h1>',
    '<p><small>Apple, 1987, and the parts of it that were never about Apple.</small></p>',
    '<hr>',
    '<p>A book for developers, published because Apple had worked out something',
    'the rest of the industry had not: that if every program on a machine behaves',
    'differently, the machine is hard, and no amount of cleverness in any one',
    'program fixes that.</p>',
    '<p>So they wrote down what a program owed the person using it, and asked',
    'everybody to do the same things the same way, and mostly got it.</p>',
    '<h2>The principles</h2>',
    '<p>These are the headings. The book is long; the headings are the argument.</p>',
    '<pre class="jb-list">',
    '  Metaphors from the real world',
    '  Direct manipulation',
    '  See and point, rather than remember and type',
    '  Consistency',
    '  WYSIWYG',
    '  User control',
    '  Feedback and dialog',
    '  Forgiveness',
    '  Perceived stability',
    '  Aesthetic integrity',
    '  Modelessness',
    '</pre>',
    '<h2>The three that are doing the work</h2>',
    '<p><b>User control.</b> The person initiates and controls the action; the',
    'computer does not. It offers, it does not decide. Stated flatly, as an',
    'obligation, at the front.</p>',
    '<p><b>Forgiveness.</b> People will try things. Therefore actions should be',
    'reversible, and the interface should let somebody explore without being able',
    'to destroy anything by accident. This is where Undo comes from as a moral',
    'position rather than a feature.</p>',
    '<p><b>Perceived stability.</b> The place should stay where it was put. Menus',
    'in the same order, controls in the same spot, the same words for the same',
    'thing, so that what you learned on Tuesday is still true on Thursday.</p>',
    '<h2>Modelessness, and why it was a fight</h2>',
    '<p>A mode is a state in which the same action does a different thing.',
    'Pressing a key in one mode types a letter; in another it deletes a',
    'paragraph. Larry Tesler campaigned against modes for years and had the',
    'number plate to prove it.</p>',
    '<p>The guidelines say: avoid them, and where you cannot, make the mode',
    'obvious and easy to get out of. Which is a small technical rule with an',
    'enormous consequence, because the alternative is a user who cannot tell what',
    'the machine will do next.</p>',
    '<h2>The part that has not aged</h2>',
    '<p>Everything in the book about menus and windows is about a machine with a',
    'mouse and a screen of that size, and none of it transfers.</p>',
    '<p>What transfers is the assumption underneath: that the person is in',
    'charge, that the machine must say what it is doing, that mistakes must be',
    'recoverable, and that the thing should behave the same way tomorrow.</p>',
    '<p>Nothing in this book anticipates a machine that answers in a paragraph.',
    'But go back over that list of headings with one of those in mind and see how',
    'many of the eleven it meets, and which ones it does not, and whether the',
    'ones it does not are the small ones.</p>',
    '<p>I am not going to do that exercise for you on a fan page.</p>',
    ...RING,
  ]);

// ---- Mac OS 9 ----------------------------------------------------------------

const OS9 = P('mac-os-9.geocities.ws', 'MAC OS 9',
  'Mac OS 9 — the end of the line', [
    '<!--bg:mac-->',
    '<h1>Mac OS 9</h1>',
    '<p><small>October 1999. The last of it, and better than people say.</small></p>',
    '<img class="indie-pic" src="assets/media/web/misc/powermac-g3.jpg" alt=""><span class="indie-cap">The beige G3, which is what a lot of us were running it on (public domain)</span>',
    '<hr>',
    '<p>The last version of the classic Mac OS. Not a rewrite: the end of a line',
    'that runs unbroken back to 1984, carrying the same ideas and, by this point,',
    'a great deal of the same code.</p>',
    '<h2>What was new</h2>',
    '<pre class="jb-list">',
    '  Sherlock 2        search, of the disk and the web,',
    '                    with channels and a metal window',
    '                    nobody had asked for',
    '  Multiple Users    more than one account. In 1999.',
    '                    On the classic system',
    '  Keychain          one password holding the others',
    '  Software Update   it fetched its own patches',
    '  File encryption   built in',
    '</pre>',
    '<h2>What it could not do, and why that ended it</h2>',
    '<p>No protected memory. One program could write over another&rsquo;s memory,',
    'or over the system&rsquo;s, and when it did, the machine went down. Not the',
    'program. The machine.</p>',
    '<p>And cooperative multitasking, which means each program decides when to',
    'give the processor up. A program that will not yield stops everything, and',
    'the only cure is the reset switch.</p>',
    '<p>Everybody who used it can still do the sums on the memory control panel,',
    'giving an application a fixed allocation by hand, and knows what it means',
    'when the pointer becomes a watch and stays a watch.</p>',
    '<h2>What was good about it</h2>',
    '<p>It was <b>fast</b>, on hardware that would now be considered nothing, and',
    'it was <b>comprehensible</b>. The System Folder was a folder. Extensions',
    'were files in it, and you could see them, and take one out, and the machine',
    'would boot without it.</p>',
    '<p>Extension conflicts were a plague, and the way you fixed one was to',
    'remove half the extensions, reboot, and repeat until you found it, which is',
    'a binary search performed by a graphic designer at midnight, and it worked,',
    'because the system was made of visible parts.</p>',
    '<p>Nothing since has been as legible to the person using it, and a good deal',
    'has been gained.</p>',
    '<h2>How it ended</h2>',
    '<p>Mac OS X arrived on different foundations and ran the old system inside',
    'itself, in a box, called Classic, so your old programs kept working while',
    'everything moved.</p>',
    '<p>And in 2002 Apple held a funeral for it on stage at a developer',
    'conference, with a coffin, and Jobs gave the eulogy. People found it funny',
    'and a number of people in the room did not.</p>',
    '<hr>',
    '<p>See also <a href="apple-hig.geocities.ws">the guidelines</a> and',
    '<a href="logic-audio.geocities.ws">Logic</a>, which is the reason a lot of',
    'us kept a 9 machine going for years afterwards.</p>',
    ...RING,
  ]);

// ---- Logic -------------------------------------------------------------------

const LOGIC = P('logic-audio.geocities.ws', 'LOGIC AUDIO',
  'Logic Audio 4.2, and the Environment', [
    '<!--bg:mac-->',
    '<h1>Logic Audio</h1>',
    '<p><small>Emagic. Version 4.2 is the one I still have on a machine that does',
    'nothing else.</small></p>',
    '<hr>',
    '<p>It starts as <b>Notator</b> on the Atari ST, from a German company called',
    'Emagic, in a world where the Atari was the music computer because it had MIDI',
    'sockets on the back as standard and its timing was better than anything with',
    'a card in it.</p>',
    '<p>Notator becomes Notator Logic in 1992, then Logic, then Logic Audio when',
    'it learns to record sound as well as notes, and by the late nineties it runs',
    'on the Mac and on Windows and is one of the two or three programs that',
    'serious people use.</p>',
    '<h2>The Environment</h2>',
    '<p>This is the thing nothing else had and nothing else has.</p>',
    '<p>Open the Environment window and you are looking at the <b>inside</b> of',
    'the program: the MIDI inputs, the sequencer, the instruments, the outputs,',
    'drawn as objects on a canvas, with <b>cables</b> between them that you drag',
    'with the mouse.</p>',
    '<p>And you can cut a cable. And put something in the middle.</p>',
    '<pre class="jb-list">',
    '  transformer    take the events going through and',
    '                 change them by a rule. Map this',
    '                 controller to that one. Halve the',
    '                 velocities. Filter out anything',
    '                 below C2',
    '  arpeggiator    an object, not a plug-in',
    '  delay line     echo the notes themselves, not the',
    '                 audio, so the echoes are playable',
    '  chord memoriser, monitor, fader, cable switcher...',
    '</pre>',
    '<p>So the program is not a fixed set of features. It is a patchable machine,',
    'and people built things in it that Emagic never thought of, and swapped them',
    'as files, and there were Environments circulating that were effectively',
    'instruments.</p>',
    '<p>It is visual dataflow programming, in a music sequencer, in 1993, and',
    'most of the people using it would not have called it programming and would',
    'have been right to be annoyed if you told them it was.</p>',
    '<h2>4.2</h2>',
    '<p>The last of the old ones for a lot of us. Stable, fast, ran on a G3,',
    'and did everything. Grey, dense, no wasted pixels, information everywhere,',
    'and utterly unlike anything designed since.</p>',
    '<p>The manual assumed you were a professional and got on with it. The',
    'defaults assumed nothing. It was famously the hardest of the sequencers to',
    'learn and the one people did not leave once they had.</p>',
    '<h2>What happened</h2>',
    '<p>Apple bought Emagic in July 2002. The Windows version was discontinued',
    'almost immediately, which stranded a great many studios overnight and is',
    'still resented.</p>',
    '<p>Logic then became a Mac program, then an Apple program, then cheaper and',
    'friendlier and rounder, and the Environment stayed in it for years like a',
    'room at the back of a house that the new owners have not decided what to do',
    'with.</p>',
    '<hr>',
    '<p>See also <a href="mac-os-9.geocities.ws">Mac OS 9</a>, and',
    '<a href="soundonsound.com">the magazine</a>, which reviewed every version',
    'of this and never once explained the Environment properly.</p>',
    ...RING,
  ]);

export const MAC_G = [HIG, OS9, LOGIC];
