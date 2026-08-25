// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PROJECT MAC WEBRINGS.
//
// The master ring is project-mac-ring, which every page joins. Under it run six
// strands: the languages, the founders, the lab and the institution, the
// machines, the hacks, and the ideas and the winter.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · a page joins by adding the strip · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>strands: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'the ringmaster is on the ninth floor. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['project-mac-ring.geocities.ws', 'Project MAC Ring'],
  lisp: ['lisp-and-languages-ring.geocities.ws', 'The Languages Ring'],
  people: ['ai-founders-ring.geocities.ws', 'The Founders Ring'],
  lab: ['the-ai-lab-ring.geocities.ws', 'The Lab &amp; the Institution Ring'],
  iron: ['tech-square-iron-ring.geocities.ws', 'The Machines Ring'],
  hacks: ['the-hacks-ring.geocities.ws', 'The Hacks Ring'],
  ideas: ['early-ai-ideas-ring.geocities.ws', 'The Ideas &amp; the Winter Ring'],
};

const A = [['lisp-language.geocities.ws', 'LISP'], ['mad-language.geocities.ws', 'MAD'],
  ['slip.geocities.ws', 'SLIP'], ['s-expressions.geocities.ws', 'S-Expressions'],
  ['garbage-collection.geocities.ws', 'Garbage Collection'], ['the-repl.geocities.ws', 'The REPL']];
const B = [['john-mccarthy.geocities.ws', 'John McCarthy'], ['marvin-minsky.geocities.ws', 'Marvin Minsky'],
  ['joseph-weizenbaum.geocities.ws', 'Joseph Weizenbaum'], ['seymour-papert.geocities.ws', 'Seymour Papert'],
  ['terry-winograd.geocities.ws', 'Terry Winograd'], ['ivan-sutherland.geocities.ws', 'Ivan Sutherland']];
const C = [['project-mac.geocities.ws', 'Project MAC'], ['mit-and-the-ai-lab.geocities.ws', 'MIT &amp; the AI Lab'],
  ['ctss.geocities.ws', 'CTSS'], ['multics.geocities.ws', 'Multics'],
  ['its-timesharing.geocities.ws', 'ITS'], ['tmrc.geocities.ws', 'TMRC']];
const D = [['the-pdp-1.geocities.ws', 'The PDP-1'], ['the-tx-0.geocities.ws', 'The TX-0'],
  ['the-lisp-machine.geocities.ws', 'The Lisp Machine'], ['richard-greenblatt.geocities.ws', 'Richard Greenblatt'],
  ['maclisp.geocities.ws', 'MacLisp'], ['emacs.geocities.ws', 'Emacs']];
const E = [['spacewar.geocities.ws', 'Spacewar!'], ['shrdlu-blocks.geocities.ws', 'SHRDLU'],
  ['sketchpad.geocities.ws', 'Sketchpad'], ['the-hacker-ethic.geocities.ws', 'The Hacker Ethic'],
  ['logo-turtle.geocities.ws', 'Logo'], ['the-turtle-robot.geocities.ws', 'The Turtle']];
const F = [['the-blocks-world.geocities.ws', 'The Blocks World'], ['micro-worlds.geocities.ws', 'Micro-Worlds'],
  ['the-perceptron.geocities.ws', 'The Perceptron'], ['the-frame.geocities.ws', 'The Frame'],
  ['society-of-mind.geocities.ws', 'Society of Mind'], ['the-ai-winter.geocities.ws', 'The AI Winter']];

export const MAC_RINGS = [
  ring(R.master[0], 'PROJECT MAC RING', 'Project MAC Ring', 'mac-lab',
    ['<p>Tech Square and what came off it: the languages built to think in, the people who named the '
      + 'field, the lab and its systems, the iron they sat at all night, the hacks that got out, and '
      + 'the ideas that carried the whole thing until the money stopped.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.lisp, R.people, R.lab, R.iron, R.hacks, R.ideas]),

  ring(R.lisp[0], 'THE LANGUAGES RING', 'The Languages Ring', 'mac-lisp',
    ['<p>Notation as equipment: the list and its parentheses, the decoder from Michigan, the list '
      + 'processor under ELIZA, code that is data, memory swept for you, and the loop that answers.</p>'],
    A, [R.people, R.iron]),

  ring(R.people[0], 'THE FOUNDERS RING', 'The Founders Ring', 'mac-people',
    ['<p>The names on the proposals: the man who coined the term, the man who built the lab, the man '
      + 'who wrote ELIZA and then warned about it, the turtle\'s inventor, the blocks-world author, and '
      + 'the one who drew with a light pen.</p>'],
    B, [R.lisp, R.ideas]),

  ring(R.lab[0], 'THE LAB AND THE INSTITUTION RING', 'The Lab &amp; the Institution Ring', 'mac-lab',
    ['<p>Where it was kept: the ARPA project and its two names, the ninth floor with the doors open, '
      + 'the first time-sharing system, its enormous successor, the one with no passwords, and the '
      + 'railway club that supplied the vocabulary.</p>'],
    C, [R.iron, R.hacks]),

  ring(R.iron[0], 'THE MACHINES RING', 'The Machines Ring', 'mac-iron',
    ['<p>The hardware you could sit at: the transistorised machine that started it, the PDP-1 and its '
      + 'tube, the computer built for one language, the hacker who built it, the lab\'s own dialect, '
      + 'and the editor you rewrite while using.</p>'],
    D, [R.lab, R.lisp]),

  ring(R.hacks[0], 'THE HACKS RING', 'The Hacks Ring', 'mac-hacks',
    ['<p>What they made when nobody asked: two ships around a star, a robot arm and some blocks, a '
      + 'light pen holding a line straight, the ethic itself, the turtle, and the floor robot with a '
      + 'pen in it.</p>'],
    E, [R.lab, R.ideas]),

  ring(R.ideas[0], 'THE IDEAS AND THE WINTER RING', 'The Ideas &amp; the Winter Ring', 'mac-ideas',
    ['<p>The programme and its limits: the tabletop world, the small domain understood completely, the '
      + 'single layer and what it could not learn, knowledge as a slotted frame, mind as a crowd of '
      + 'agents, and the years the money went away.</p>'],
    F, [R.people, R.hacks]),
];
