// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CYBERNETICS & COMPUTING WEBRINGS.
//
// The master ring is cybernetics-ring, which every page joins. Under it run six
// strands: first-wave cybernetics, British cybernetics, computability and the
// lambda calculus, the programmers and their languages, information and
// complexity, and the networks and the modern reaches.

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
    'the ringmaster is waiting on the feedback loop to settle. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['cybernetics-ring.geocities.ws', 'Cybernetics &amp; Computing Ring'],
  cybernetics: ['first-cybernetics-ring.geocities.ws', 'First-Wave Cybernetics Ring'],
  british: ['british-cybernetics-ring.geocities.ws', 'British Cybernetics Ring'],
  logic: ['computability-ring.geocities.ws', 'Computability &amp; Lambda Ring'],
  programming: ['programmers-ring.geocities.ws', 'The Programmers Ring'],
  info: ['information-theory-ring.geocities.ws', 'Information &amp; Complexity Ring'],
  networks: ['networks-and-hci-ring.geocities.ws', 'Networks &amp; HCI Ring'],
};

const A = [['warren-mcculloch.geocities.ws', 'Warren McCulloch'], ['walter-pitts.geocities.ws', 'Walter Pitts'],
  ['w-ross-ashby.geocities.ws', 'W. Ross Ashby'], ['the-macy-conferences.geocities.ws', 'The Macy Conferences'],
  ['gregory-bateson.geocities.ws', 'Gregory Bateson'], ['margaret-mead.geocities.ws', 'Margaret Mead']];
const B = [['stafford-beer.geocities.ws', 'Stafford Beer'], ['gordon-pask.geocities.ws', 'Gordon Pask'],
  ['heinz-von-foerster.geocities.ws', 'Heinz von Foerster'], ['grey-walter.geocities.ws', 'Grey Walter'],
  ['the-ratio-club.geocities.ws', 'The Ratio Club'], ['project-cybersyn.geocities.ws', 'Project Cybersyn']];
const C = [['alonzo-church.geocities.ws', 'Alonzo Church'], ['stephen-kleene.geocities.ws', 'Stephen Kleene'],
  ['emil-post.geocities.ws', 'Emil Post'], ['haskell-curry.geocities.ws', 'Haskell Curry'],
  ['rozsa-peter.geocities.ws', 'Rozsa Peter'], ['martin-davis.geocities.ws', 'Martin Davis']];
const D = [['grace-hopper.geocities.ws', 'Grace Hopper'], ['john-backus.geocities.ws', 'John Backus'],
  ['edsger-dijkstra.geocities.ws', 'Edsger Dijkstra'], ['donald-knuth.geocities.ws', 'Donald Knuth'],
  ['tony-hoare.geocities.ws', 'Tony Hoare'], ['niklaus-wirth.geocities.ws', 'Niklaus Wirth']];
const E = [['richard-hamming.geocities.ws', 'Richard Hamming'], ['gregory-chaitin.geocities.ws', 'Gregory Chaitin'],
  ['ray-solomonoff.geocities.ws', 'Ray Solomonoff'], ['david-huffman.geocities.ws', 'David Huffman'],
  ['robert-fano.geocities.ws', 'Robert Fano'], ['andrey-markov.geocities.ws', 'Andrey Markov']];
const F = [['jcr-licklider.geocities.ws', 'J. C. R. Licklider'], ['douglas-engelbart.geocities.ws', 'Douglas Engelbart'],
  ['cerf-and-kahn.geocities.ws', 'Cerf &amp; Kahn'], ['barbara-liskov.geocities.ws', 'Barbara Liskov'],
  ['leslie-lamport.geocities.ws', 'Leslie Lamport'], ['the-turing-award.geocities.ws', 'The Turing Award']];

export const CS_RINGS = [
  ring(R.master[0], 'CYBERNETICS AND COMPUTING RING', 'Cybernetics &amp; Computing Ring', 'cs-cybernetics',
    ['<p>The foundations underneath the machine: the cybernetics of feedback and control, the '
      + 'logic of what can be computed, the languages we wrote it in, the theory of the signal, '
      + 'and the networks that joined it all up.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.cybernetics, R.british, R.logic, R.programming, R.info, R.networks]),

  ring(R.cybernetics[0], 'FIRST-WAVE CYBERNETICS RING', 'First-Wave Cybernetics Ring', 'cs-cybernetics',
    ['<p>The naming of the field: the artificial neuron, the homeostat, the Macy table, and the '
      + 'ecology of mind.</p>'],
    A, [R.british, R.logic]),

  ring(R.british[0], 'BRITISH CYBERNETICS RING', 'British Cybernetics Ring', 'cs-british',
    ['<p>The island school: management cybernetics and Cybersyn, conversation theory, second-order '
      + 'cybernetics, the tortoises, and the dining club that started it.</p>'],
    B, [R.cybernetics, R.networks]),

  ring(R.logic[0], 'COMPUTABILITY AND LAMBDA RING', 'Computability &amp; Lambda Ring', 'cs-logic',
    ['<p>What a machine can and cannot do: the lambda calculus and the thesis, recursion theory and '
      + 'the star, the production systems, and combinatory logic.</p>'],
    C, [R.cybernetics, R.programming]),

  ring(R.programming[0], 'THE PROGRAMMERS RING', 'The Programmers Ring', 'cs-programming',
    ['<p>The people who made the computer speak: the compiler and the bug, FORTRAN and the harmful '
      + 'GOTO, the Art and the beautiful type, quicksort, and the simple language.</p>'],
    D, [R.logic, R.networks]),

  ring(R.info[0], 'INFORMATION AND COMPLEXITY RING', 'Information &amp; Complexity Ring', 'cs-info',
    ['<p>The measure of the message: error-correcting codes, the uncomputable Omega, algorithmic '
      + 'probability, the optimal code, and the chain that started in 1906.</p>'],
    E, [R.logic, R.networks]),

  ring(R.networks[0], 'NETWORKS AND HCI RING', 'Networks &amp; HCI Ring', 'cs-networks',
    ['<p>Joining it up and handing it over: man-computer symbiosis, the mouse and the demo, the '
      + 'protocol that let the networks meet, data abstraction, distributed clocks, and the award '
      + 'that named the field.</p>'],
    F, [R.british, R.programming]),
];
