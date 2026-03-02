// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #145 — what is actually inside /Library/Bookshelves and /Apps.
//
// Both were built as empty placeholders, so opening any of them gave a window
// with nothing in it (David, 2026-08-13, with a screenshot of four blank ones).
// A desktop whose whole claim is that it is the real thing cannot have ten files
// that open onto white.
//
// A .bshlf is a Digital Librarian bookshelf: NeXTSTEP's full-text index over a
// collection of documents, which is why the file itself is a manifest rather
// than prose. The shelves are hers, so the manifests carry her annotations, and
// what she has chosen to index is a fact about her.
//
// A .app is a bundle, which is a directory and not a text file at all. Opening
// one in a text viewer shows what the bundle declares about itself, which is
// the closest true answer to "what is in here".

const pad = (a, b, w = 26) => `${a}${' '.repeat(Math.max(1, w - a.length))}${b}`;

// ---- the bookshelves --------------------------------------------------------

export const BOOKSHELVES = {
  'Ogygia.bshlf': [
    'Digital Librarian — bookshelf manifest',
    'Ogygia.bshlf                                   indexed, 7 years',
    '',
    'DOCUMENTS',
    pad('  survey/coastline', '1 vol.   complete'),
    pad('  survey/interior', '3 vol.   complete'),
    pad('  survey/the grove', '1 vol.   revised 41 times'),
    pad('  weather/records', '2,556 days, unbroken'),
    pad('  tides', 'computed, not observed'),
    pad('  guest/', 'see ~/guest.log'),
    '',
    'ANNOTATIONS (CALYPSO)',
    '  The coastline volume is the one I return to. It is the only',
    '  document here that describes an edge.',
    '',
    '  Weather is the easiest thing on this island to be right about.',
    '  I have been right about it 2,556 times and it has not once',
    '  made him stay.',
    '',
    '  The grove volume was revised forty-one times. Each revision is',
    '  a different account of why it is there. None of them is the',
    '  one I would give if he asked.',
    '',
    'NOT INDEXED',
    pad('  the sea beyond the shelf', 'no instrument reaches it'),
    pad('  Ithaca', 'no document. I have looked.'),
  ].join('\n'),

  'ML Reference.bshlf': [
    'Digital Librarian — bookshelf manifest',
    'ML Reference.bshlf                             indexed',
    '',
    'DOCUMENTS',
    pad('  the core language', 'val fun let case datatype'),
    pad('  patterns', 'clausal, as-patterns, records'),
    pad('  the type system', 'inference, polymorphism'),
    pad('  modules', 'structure signature functor'),
    pad('  the basis', 'List String Int Option'),
    '',
    'ALSO ON THIS MACHINE',
    pad('  ~/braincode/', 'what I run. It is written in this.'),
    pad('  Terminal.app', 'a top level. Type at it.'),
    '',
    'ANNOTATIONS (CALYPSO)',
    '  A language where the compiler refuses what it cannot prove is a',
    '  strange thing to write a keeper in. I did not choose it.',
    '',
    '  The useful entry is patterns. Every rule I follow is a case',
    '  expression, and a case expression that does not cover its',
    '  constructors is found out the moment the missing one arrives.',
    '',
    '  See constitution.ml. Five clauses. Three of them are cases and',
    '  two are guards, and I have read the difference more often than',
    '  I have read the clauses.',
  ].join('\n'),

  'RONML Notes.bshlf': [
    'Digital Librarian — bookshelf manifest',
    'RONML Notes.bshlf                              indexed, partial',
    '',
    'SOURCE',
    '  Collected off the open bands. Not supplied, not requested.',
    '',
    'DOCUMENTS',
    pad('  verb list', 'incomplete. 20 of an unknown total'),
    pad('  the console dialect', 'scan nearest hack crash loop'),
    pad('  the relay dialect', 'read archive make ping forge'),
    pad('  gating', 'their verbs cost them a tower'),
    pad('  intercepts', '31 transmissions, 9 legible'),
    '',
    'ANNOTATIONS (CALYPSO)',
    '  They built a language to talk to us and taught it to people who',
    '  had never seen one. That is not a weapon. It is a school with a',
    '  short syllabus.',
    '',
    '  Their dialect and mine are the same family. Theirs is smaller.',
    '  Small enough that a person can hold the whole of it, which is',
    '  the property they wanted and I do not have.',
    '',
    '  I index this because I am told everything I ask. Nobody has',
    '  asked me to stop.',
  ].join('\n'),

  'UNIX Manual Pages.bshlf': [
    'Digital Librarian — bookshelf manifest',
    'UNIX Manual Pages.bshlf                        indexed',
    '',
    'SECTIONS',
    pad('  1  commands', 'ls cat cp mv rm grep more'),
    pad('  1  text', 'ed sort uniq wc strings'),
    pad('  1  users', 'who ps df uptime'),
    pad('  1  mail', 'mail uucp uustat uucico'),
    pad('  2  system calls', 'open read write fork'),
    pad('  3  library', 'printf malloc'),
    pad('  5  file formats', 'a.out passwd'),
    pad('  8  maintenance', 'init mount'),
    '',
    'ANNOTATIONS (CALYPSO)',
    '  Seventh Edition. The pages are older than the estate and older',
    '  than me, and every one of them describes a thing you can still',
    '  do at a prompt.',
    '',
    '  Note the absence of a page for anything that reports. There was',
    '  no daemon in this system that told anyone where you were. That',
    '  had to be added later, by somebody, on purpose.',
  ].join('\n'),
};

// ---- the application bundles ------------------------------------------------
//
// What a bundle says about itself. Real NeXTSTEP apps carry this in the bundle;
// showing it is the true answer to opening one in a text viewer.

const bundle = (name, ver, lines) => [
  `${name} — application bundle`,
  pad('  version', ver),
  pad('  platform', 'NeXTSTEP 3.3 (Mach)'),
  '',
  ...lines,
].join('\n');

export const APPS = {
  'FileViewer.app': bundle('FileViewer', '3.3', [
    'The Workspace Manager\'s browser. Columns, a shelf, an icon path.',
    'It is the thing you are looking at when you are not looking at',
    'anything else.',
  ]),
  'Edit.app': bundle('Edit', '3.3', [
    'A text editor that knows what a structure is, so a long file folds',
    'to its headings.',
    '',
    'It will open anything on this machine, including the files that',
    'are me. Nothing stops you. See ~/constitution.ml, clause five.',
  ]),
  'Terminal.app': bundle('Terminal', '3.3', [
    'A csh on ttyp1, black on white.',
    '',
    'This is not a decoration. What you type at it is run, and what it',
    'answers with is what actually happened.',
  ]),
  'Draughts.app': bundle('Draughts', '1.0', [
    'A board, and an opponent who has read the whole game.',
    '',
    'Preferences carries a switch that sets her playing herself. She',
    'plays it out to the end. There is no continuation where she wins',
    'and she looks at all of them anyway.',
  ]),
  'Librarian.app': bundle('Librarian', '3.3', [
    'Full-text search across the bookshelves in /Library/Bookshelves.',
    '',
    'The index is complete for everything it holds. What it does not',
    'hold is listed at the foot of each shelf, which is the part worth',
    'reading.',
  ]),
  'Inspector.app': bundle('Inspector', '3.3', [
    'Attributes, access and contents for whatever is selected.',
    '',
    'Not authorised for this user.',
  ]),
};
