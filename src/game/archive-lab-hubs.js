// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE RESEARCH-LABS WEBRINGS.
//
// The master ring is research-labs-ring, which every lab page joins. Under it run
// six strands: the industrial labs, the origins of computing, the AI labs, the
// media-theory institutes, the internet-and-society centres, and the hacker clubs.

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
    'the ringmaster is soldering something. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['research-labs-ring.geocities.ws', 'Research Labs Ring'],
  industrial: ['industrial-labs-ring.geocities.ws', 'Industrial Labs Ring'],
  origins: ['origins-of-computing-ring.geocities.ws', 'Origins of Computing Ring'],
  ai: ['ai-labs-ring.geocities.ws', 'AI Labs Ring'],
  media: ['media-labs-ring.geocities.ws', 'Media Labs Ring'],
  society: ['internet-society-ring.geocities.ws', 'Internet &amp; Society Ring'],
  hacker: ['hacker-clubs-ring.geocities.ws', 'Hacker Clubs Ring'],
};

const A = [['bell-labs.geocities.ws', 'Bell Labs'], ['xerox-parc.geocities.ws', 'Xerox PARC'],
  ['ibm-research.geocities.ws', 'IBM Research'], ['mit-media-lab.geocities.ws', 'MIT Media Lab'],
  ['sri-arc.geocities.ws', 'SRI Augmentation Research Center']];
const B = [['bletchley-park.geocities.ws', 'Bletchley Park'], ['manchester-baby-ssem.geocities.ws', 'Manchester Baby'],
  ['moore-school-eniac.geocities.ws', 'The Moore School / ENIAC'], ['npl-ace.geocities.ws', 'NPL &amp; the ACE'],
  ['cern-www.geocities.ws', 'CERN &amp; the Web']];
const C = [['mit-ai-lab.geocities.ws', 'The MIT AI Lab'], ['stanford-sail.geocities.ws', 'Stanford SAIL'],
  ['cmu-ai.geocities.ws', 'Carnegie Mellon AI'], ['bbn-technologies.geocities.ws', 'BBN'],
  ['biological-computer-lab.geocities.ws', 'The Biological Computer Laboratory']];
const D = [['media-archaeology-lab.geocities.ws', 'Media Archaeology Lab'], ['media-fundus.geocities.ws', 'Media Fundus (Ernst)'],
  ['sussex-humanities-lab.geocities.ws', 'Sussex Humanities Lab'], ['leuphana-mecs.geocities.ws', 'Leuphana MECS'],
  ['hyperkult.geocities.ws', 'HyperKult']];
const E = [['oxford-internet-institute.geocities.ws', 'Oxford Internet Institute'], ['weizenbaum-institut-berlin.geocities.ws', 'Weizenbaum Institute'],
  ['cccs-goethe.geocities.ws', 'Centre for Critical Computational Studies (Goethe)'], ['berkman-klein.geocities.ws', 'Berkman Klein Center'],
  ['data-and-society.geocities.ws', 'Data &amp; Society']];
const F = [['chaos-computer-club.geocities.ws', 'The Chaos Computer Club'], ['c-base.geocities.ws', 'c-base'],
  ['dair-institute.geocities.ws', 'DAIR Institute'], ['ai-now-institute.geocities.ws', 'AI Now Institute'],
  ['eff.geocities.ws', 'Electronic Frontier Foundation']];

export const LAB_RINGS = [
  ring(R.master[0], 'RESEARCH LABS RING', 'Research Labs Ring', 'lab-industrial',
    ['<p>The places where computing and media were built and argued over: the industrial '
      + 'labs, the codebreaking huts, the AI labs, the media-theory institutes, the '
      + 'internet-and-society centres, and the hacker clubs.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.industrial, R.origins, R.ai, R.media, R.society, R.hacker]),

  ring(R.industrial[0], 'INDUSTRIAL LABS RING', 'Industrial Labs Ring', 'lab-industrial',
    ['<p>The corporate research campuses where the century was invented: the transistor, '
      + 'the GUI, the database, and the operating system you are probably running.</p>'],
    A, [R.origins, R.ai]),

  ring(R.origins[0], 'ORIGINS OF COMPUTING RING', 'Origins of Computing Ring', 'lab-origin',
    ['<p>Where the machine first ran: the codebreaking huts, the stored program, the first '
      + 'electronic computers, and the proposal that became the Web.</p>'],
    B, [R.industrial, R.society]),

  ring(R.ai[0], 'AI LABS RING', 'AI Labs Ring', 'lab-ai',
    ['<p>The laboratories that tried to make the machine think: symbolic AI and the hacker '
      + 'culture, the robots, the ARPANET, and the cybernetics that came before.</p>'],
    C, [R.industrial, R.hacker]),

  ring(R.media[0], 'MEDIA LABS RING', 'Media Labs Ring', 'lab-media',
    ['<p>The institutes that read the machine as a medium: media archaeology and its working '
      + 'collections, the German media-theory schools, and the humanities labs.</p>'],
    D, [R.society, R.hacker]),

  ring(R.society[0], 'INTERNET AND SOCIETY RING', 'Internet &amp; Society Ring', 'lab-society',
    ['<p>The centres that studied the network as a social fact: internet governance, the '
      + 'networked society, critical computation, and the politics of data.</p>'],
    E, [R.origins, R.media]),

  ring(R.hacker[0], 'HACKER CLUBS RING', 'Hacker Clubs Ring', 'lab-hacker',
    ['<p>The clubs and the refuseniks: the Chaos Computer Club and its Congress, the Berlin '
      + 'hackerspaces, the digital-rights foundations, and the AI-ethics institutes built '
      + 'in refusal.</p>'],
    F, [R.ai, R.media]),
];
