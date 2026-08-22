// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PROGRAMMING-LANGUAGE WEBRINGS, 1940–2000.
//
// The languages and the people who made them, tied together the way the old
// comp.lang newsgroups tied them: one main ring, and four that cross it along
// the families the field argues about, functional, systems, esoteric, and the
// languages that refused to speak English.

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
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'ringmaster is recompiling. the ring turns anyway.</small></p>',
  ],
});

const R = {
  main: ['programming-languages-ring.geocities.ws', 'Programming Languages Ring'],
  fun: ['functional-languages-ring.geocities.ws', 'Functional &amp; Symbolic Ring'],
  sys: ['systems-languages-ring.geocities.ws', 'Systems Languages Ring'],
  eso: ['esolang-ring.geocities.ws', 'Esoteric Languages Ring'],
  global: ['world-languages-ring.geocities.ws', 'Languages of the World Ring'],
};

export const LANG_RINGS = [
  ring(R.main[0], 'PROGRAMMING LANGUAGES RING', 'Programming Languages Ring', 'origins',
    ['<p>Every language and the hand that made it, from FORTRAN and the first '
      + 'compiler to the esoteric jokes and the languages written in other '
      + 'alphabets. Kept by people who still argue about braces.</p>'],
    [['the-first-compiler.geocities.ws', 'The first compiler'],
     ['fortran-backus.geocities.ws', 'John Backus / FORTRAN'],
     ['cobol-hopper.geocities.ws', 'Grace Hopper / COBOL'],
     ['algol-committee.geocities.ws', 'ALGOL 60'],
     ['lambda-calculus.geocities.ws', 'Church / the lambda calculus'],
     ['lisp-mccarthy.geocities.ws', 'John McCarthy / LISP'],
     ['basic-kemeny-kurtz.geocities.ws', 'BASIC'],
     ['c-ritchie.geocities.ws', 'Dennis Ritchie / C'],
     ['cpp-stroustrup.geocities.ws', 'Bjarne Stroustrup / C++'],
     ['pascal-wirth.geocities.ws', 'Niklaus Wirth / Pascal'],
     ['unix-b-bcpl.geocities.ws', 'B, BCPL and the roots of C'],
     ['ada-language.geocities.ws', 'Ada'],
     ['modula-oberon.geocities.ws', 'Modula-2 and Oberon'],
     ['ml-milner.geocities.ws', 'Robin Milner / ML'],
     ['scheme-sussman.geocities.ws', 'Scheme'],
     ['haskell-committee.geocities.ws', 'Haskell'],
     ['prolog-colmerauer.geocities.ws', 'Prolog'],
     ['apl-iverson.geocities.ws', 'Kenneth Iverson / APL'],
     ['smalltalk-kay.geocities.ws', 'Alan Kay / Smalltalk'],
     ['simula-nygaard.geocities.ws', 'Simula'],
     ['perl-wall.geocities.ws', 'Larry Wall / Perl'],
     ['python-vanrossum.geocities.ws', 'Guido van Rossum / Python'],
     ['ruby-matz.geocities.ws', 'Yukihiro Matsumoto / Ruby'],
     ['javascript-eich.geocities.ws', 'Brendan Eich / JavaScript'],
     ['forth-moore.geocities.ws', 'Charles Moore / Forth'],
     ['erlang-armstrong.geocities.ws', 'Joe Armstrong / Erlang'],
     ['php-tcl-lua.geocities.ws', 'Tcl, Lua and the embeddable scripts'],
     ['self-and-prototypes.geocities.ws', 'Self'],
     ['brainfuck.geocities.ws', 'Brainfuck'],
     ['intercal.geocities.ws', 'INTERCAL'],
     ['befunge.geocities.ws', 'Befunge'],
     ['malbolge.geocities.ws', 'Malbolge'],
     ['piet.geocities.ws', 'Piet'],
     ['shakespeare-lang.geocities.ws', 'The Shakespeare Programming Language'],
     ['why-anglophone.geocities.ws', 'Why are languages anglophone?'],
     ['refal-soviet.geocities.ws', 'Refal and Soviet computing'],
     ['japanese-computing.geocities.ws', 'Japanese computing'],
     ['qalb-arabic.geocities.ws', 'Qalb / Arabic programming'],
     ['chinese-computing.geocities.ws', 'Chinese computing'],
     ['zajal.geocities.ws', 'Zajal / the poetry of code'],
     ['the-home-computer-basic.geocities.ws', 'The home-computer BASIC'],
     ['dijkstra-goto.geocities.ws', 'Dijkstra / GOTO considered harmful'],
     ['worse-is-better.geocities.ws', 'Worse is better'],
     ['the-jargon-file.geocities.ws', 'The Jargon File']],
    [R.fun, R.sys, R.eso, R.global]),

  ring(R.fun[0], 'FUNCTIONAL AND SYMBOLIC RING', 'Functional &amp; Symbolic Ring', 'symbolic',
    ['<p>Lambda all the way down. Lists and recursion, types inferred, logic that '
      + 'searches, arrays as thought. The languages that ask what computation IS '
      + 'rather than how to make the machine hurry.</p>'],
    [['lisp-mccarthy.geocities.ws', 'LISP'],
     ['scheme-sussman.geocities.ws', 'Scheme'],
     ['ml-milner.geocities.ws', 'ML'],
     ['haskell-committee.geocities.ws', 'Haskell'],
     ['prolog-colmerauer.geocities.ws', 'Prolog'],
     ['apl-iverson.geocities.ws', 'APL'],
     ['erlang-armstrong.geocities.ws', 'Erlang'],
     ['lambda-calculus.geocities.ws', 'the lambda calculus']],
    [R.main]),

  ring(R.sys[0], 'SYSTEMS LANGUAGES RING', 'Systems Languages Ring', 'systems',
    ['<p>Close to the metal. The languages you write an operating system in, or a '
      + 'toaster, or a missile: C and its ancestors, Pascal and Wirth’s long '
      + 'march to smaller, the object languages, the stack.</p>'],
    [['c-ritchie.geocities.ws', 'C'],
     ['cpp-stroustrup.geocities.ws', 'C++'],
     ['pascal-wirth.geocities.ws', 'Pascal'],
     ['unix-b-bcpl.geocities.ws', 'B and BCPL'],
     ['ada-language.geocities.ws', 'Ada'],
     ['modula-oberon.geocities.ws', 'Modula-2 and Oberon'],
     ['forth-moore.geocities.ws', 'Forth'],
     ['simula-nygaard.geocities.ws', 'Simula']],
    [R.main]),

  ring(R.eso[0], 'ESOTERIC LANGUAGES RING', 'Esoteric Languages Ring', 'eso',
    ['<p>Languages built to make a point rather than a payroll: the smallest '
      + 'possible, the hardest possible, the ones that look like art or read like '
      + 'a play. Turing-complete and completely unserious.</p>'],
    [['brainfuck.geocities.ws', 'Brainfuck'],
     ['intercal.geocities.ws', 'INTERCAL'],
     ['befunge.geocities.ws', 'Befunge'],
     ['malbolge.geocities.ws', 'Malbolge'],
     ['piet.geocities.ws', 'Piet'],
     ['shakespeare-lang.geocities.ws', 'The Shakespeare Programming Language'],
     ['worse-is-better.geocities.ws', 'Worse is better'],
     ['the-jargon-file.geocities.ws', 'The Jargon File']],
    [R.main]),

  ring(R.global[0], 'LANGUAGES OF THE WORLD RING', 'Languages of the World Ring', 'global',
    ['<p>The keyword question. Why the whole world programs in English on an ASCII '
      + 'keyboard, and the languages that answered back: in Russian, in Japanese, '
      + 'in Chinese, in Arabic script written right to left.</p>'],
    [['why-anglophone.geocities.ws', 'Why are languages anglophone?'],
     ['refal-soviet.geocities.ws', 'Refal and Soviet computing'],
     ['japanese-computing.geocities.ws', 'Japanese computing'],
     ['qalb-arabic.geocities.ws', 'Qalb / Arabic programming'],
     ['chinese-computing.geocities.ws', 'Chinese computing'],
     ['zajal.geocities.ws', 'Zajal'],
     ['apl-iverson.geocities.ws', 'APL / a notation of its own']],
    [R.main]),
];
