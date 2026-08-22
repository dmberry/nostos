// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE DIGITAL-HUMANITIES WEBRINGS.
//
// The master directory is digital-humanities-ring.geocities.ws (kept in the
// thinkers hubs). These are the strands a walker follows through it: the
// founders and the markup, distant reading, the interface, the tools, and the
// argument about what any of it is for. Names cross the strands on purpose.

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
    'the maintainer is refactoring the build. the ring turns anyway.</small></p>',
    '<p><small>[ <a href="digital-humanities-ring.geocities.ws">back to the Digital Humanities Ring</a> ]</small></p>',
  ],
});

const R = {
  found: ['dh-foundations-ring.geocities.ws', 'DH Foundations Ring'],
  distant: ['dh-distant-reading-ring.geocities.ws', 'Distant Reading Ring'],
  media: ['dh-media-ring.geocities.ws', 'DH Media &amp; Interface Ring'],
  tools: ['dh-tools-ring.geocities.ws', 'DH Tools &amp; Method Ring'],
  critique: ['dh-critique-ring.geocities.ws', 'DH Critique Ring'],
  // sisters kept elsewhere (they exist in the archive):
  codestudies: ['codestudies-ring.geocities.ws', 'Critical Code &amp; Software Studies'],
  mediatheory: ['mediatheory-ring.geocities.ws', 'Media Theory Ring'],
};

export const DH_RINGS = [
  ring(R.found[0], 'DH FOUNDATIONS RING', 'DH Foundations Ring', 'dh-paper',
    ['<p>Where humanities computing began: a Jesuit counting the words of Aquinas on '
      + 'punched cards, the concordance programs, the markup that turned a text into data, '
      + 'and the archives that put the edition on a screen.</p>'],
    [['roberto-busa.geocities.ws', 'Roberto Busa'],
     ['susan-hockey.geocities.ws', 'Susan Hockey'],
     ['john-unsworth.geocities.ws', 'John Unsworth'],
     ['willard-mccarty.geocities.ws', 'Willard McCarty'],
     ['jerome-mcgann.geocities.ws', 'Jerome McGann'],
     ['the-tei.geocities.ws', 'The Text Encoding Initiative'],
     ['julia-flanders.geocities.ws', 'Julia Flanders'],
     ['matthew-kirschenbaum.geocities.ws', 'Matthew Kirschenbaum'],
     ['kathleen-fitzpatrick.geocities.ws', 'Kathleen Fitzpatrick'],
     ['bethany-nowviskie.geocities.ws', 'Bethany Nowviskie']],
    [R.distant, R.tools]),

  ring(R.distant[0], 'DISTANT READING RING', 'Distant Reading Ring', 'dh-data',
    ['<p>Reading at the scale of the archive rather than the page: graphs, maps and '
      + 'trees, machine learning over literary history, and the argument about whether a '
      + 'count can be a reading.</p>'],
    [['franco-moretti.geocities.ws', 'Franco Moretti'],
     ['ted-underwood.geocities.ws', 'Ted Underwood'],
     ['andrew-piper.geocities.ws', 'Andrew Piper'],
     ['katherine-bode.geocities.ws', 'Katherine Bode'],
     ['matthew-jockers.geocities.ws', 'Matthew Jockers'],
     ['lev-manovich.geocities.ws', 'Lev Manovich']],
    [R.found, R.media]),

  ring(R.media[0], 'DH MEDIA AND INTERFACE RING', 'DH Media &amp; Interface Ring', 'dh-screen',
    ['<p>The screen as an argument: software studies and cultural analytics, the graphic '
      + 'that thinks, the politics of the interface, and the question of where the cultural '
      + 'criticism went.</p>'],
    [['lev-manovich.geocities.ws', 'Lev Manovich'],
     ['johanna-drucker.geocities.ws', 'Johanna Drucker'],
     ['tara-mcpherson.geocities.ws', 'Tara McPherson'],
     ['alan-liu.geocities.ws', 'Alan Liu'],
     ['stephen-ramsay.geocities.ws', 'Stephen Ramsay']],
    [R.distant, R.critique, R.mediatheory]),

  ring(R.tools[0], 'DH TOOLS AND METHOD RING', 'DH Tools &amp; Method Ring', 'dh-screen',
    ['<p>The workbench: text analysis in the browser, peer-reviewed tutorials, the fugitive '
      + 'reprint, and the argument for building small, sustainable and low-resource.</p>'],
    [['voyant-tools.geocities.ws', 'Voyant Tools'],
     ['miriam-posner.geocities.ws', 'Miriam Posner'],
     ['ryan-cordell.geocities.ws', 'Ryan Cordell'],
     ['the-programming-historian.geocities.ws', 'The Programming Historian'],
     ['minimal-computing.geocities.ws', 'Minimal Computing'],
     ['stephen-ramsay.geocities.ws', 'Stephen Ramsay']],
    [R.found, R.critique]),

  ring(R.critique[0], 'DH CRITIQUE RING', 'DH Critique Ring', 'dh-screen',
    ['<p>The field arguing with itself: the neoliberalism charge and the replies, the '
      + 'postcolonial and global turn, the open-access debates, and the perennial question '
      + 'of what the digital humanities even are.</p>'],
    [['the-dark-side-of-dh.geocities.ws', 'The dark side of DH'],
     ['postcolonial-dh.geocities.ws', 'Postcolonial DH'],
     ['global-outlook-dh.geocities.ws', 'Global Outlook::DH'],
     ['debates-in-dh.geocities.ws', 'Debates in the Digital Humanities'],
     ['whatisdh.geocities.ws', 'What is DH?'],
     ['tara-mcpherson.geocities.ws', 'Tara McPherson']],
    [R.media, R.tools, R.codestudies]),
];
