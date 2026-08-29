// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE LITERATURE WEBRINGS.
//
// The master ring is literature-ring, which every novelist page joins. Under it
// run six strands: the realists, the Russians, the modernists, the fantasists,
// the Americans, and the gothic and romantic wide world.

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
    'the ringmaster is on the last chapter. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['literature-ring.geocities.ws', 'Literature Ring'],
  realism: ['realist-novel-ring.geocities.ws', 'The Realist Novel Ring'],
  russia: ['russian-novel-ring.geocities.ws', 'The Russian Novel Ring'],
  modernism: ['modernism-ring.geocities.ws', 'The Modernism Ring'],
  fantastic: ['fantastic-fiction-ring.geocities.ws', 'The Fantastic &amp; Metafiction Ring'],
  american: ['american-letters-ring.geocities.ws', 'The American Letters Ring'],
  gothic: ['gothic-romance-ring.geocities.ws', 'The Gothic &amp; Romance Ring'],
  poetry: ['poetry-ring.geocities.ws', 'The Poetry Ring'],
};

const A = [['balzac.geocities.ws', 'Honore de Balzac'], ['flaubert.geocities.ws', 'Gustave Flaubert'],
  ['dickens.geocities.ws', 'Charles Dickens'], ['george-eliot.geocities.ws', 'George Eliot'],
  ['stendhal.geocities.ws', 'Stendhal'], ['jane-austen.geocities.ws', 'Jane Austen']];
const B = [['dostoevsky.geocities.ws', 'Fyodor Dostoevsky'], ['tolstoy.geocities.ws', 'Leo Tolstoy'],
  ['chekhov.geocities.ws', 'Anton Chekhov'], ['gogol.geocities.ws', 'Nikolai Gogol'],
  ['turgenev.geocities.ws', 'Ivan Turgenev'], ['pushkin.geocities.ws', 'Alexander Pushkin']];
const C = [['james-joyce.geocities.ws', 'James Joyce'], ['virginia-woolf.geocities.ws', 'Virginia Woolf'],
  ['marcel-proust.geocities.ws', 'Marcel Proust'], ['franz-kafka.geocities.ws', 'Franz Kafka'],
  ['william-faulkner.geocities.ws', 'William Faulkner'], ['thomas-mann.geocities.ws', 'Thomas Mann']];
const D = [['jorge-luis-borges.geocities.ws', 'Jorge Luis Borges'], ['italo-calvino.geocities.ws', 'Italo Calvino'],
  ['vladimir-nabokov.geocities.ws', 'Vladimir Nabokov'], ['garcia-marquez.geocities.ws', 'Gabriel Garcia Marquez'],
  ['samuel-beckett.geocities.ws', 'Samuel Beckett'], ['edgar-allan-poe.geocities.ws', 'Edgar Allan Poe']];
const E = [['call-me-ishmael.geocities.ws', 'Herman Melville'], ['raft-on-the-river.geocities.ws', 'Mark Twain'],
  ['scarlet-letter-a.geocities.ws', 'Nathaniel Hawthorne'], ['figure-in-the-carpet.geocities.ws', 'Henry James'],
  ['the-iceberg-theory.geocities.ws', 'Ernest Hemingway'], ['rememory-beloved.geocities.ws', 'Toni Morrison']];
const F = [['mary-shelley.geocities.ws', 'Mary Shelley'], ['the-brontes.geocities.ws', 'The Brontes'],
  ['victor-hugo.geocities.ws', 'Victor Hugo'], ['emile-zola.geocities.ws', 'Emile Zola'],
  ['thomas-hardy.geocities.ws', 'Thomas Hardy'], ['oscar-wilde.geocities.ws', 'Oscar Wilde']];

const G = [['homer-in-english.geocities.ws', 'Homer in English'],
  ['the-romantics.geocities.ws', 'The Romantics'],
  ['the-war-poets.geocities.ws', 'The war poets'],
  ['modernist-poetry.geocities.ws', 'Modernist poetry'],
  ['futurism-and-the-machine.geocities.ws', 'Futurism and the machine'],
  ['poems-made-with-rules.geocities.ws', 'Poems made with rules'],
  ['poetry-by-machine.geocities.ws', 'Poetry by machine']];

export const LIT_RINGS = [
  ring(R.master[0], 'LITERATURE RING', 'Literature Ring', 'lit-realism',
    ['<p>Two centuries of the novel and its neighbours: the realists who wrote the whole '
      + 'of society down, the Russians, the modernists who broke the sentence, the '
      + 'fantasists, the Americans, and the gothic and romantic wide world.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.realism, R.russia, R.modernism, R.fantastic, R.american, R.gothic, R.poetry]),

  ring(R.realism[0], 'THE REALIST NOVEL RING', 'The Realist Novel Ring', 'lit-realism',
    ['<p>The novel as a mirror carried along a road: the human comedy, the mot juste, the '
      + 'serial, the web of provincial life.</p>'],
    A, [R.russia, R.gothic]),

  ring(R.russia[0], 'THE RUSSIAN NOVEL RING', 'The Russian Novel Ring', 'lit-russia',
    ['<p>The great Russian nineteenth century: polyphony and the underground, war and peace, '
      + 'the short story and the overcoat, the novel in verse.</p>'],
    B, [R.realism, R.modernism]),

  ring(R.modernism[0], 'THE MODERNISM RING', 'The Modernism Ring', 'lit-modernism',
    ['<p>Make it new: the stream of consciousness, the single day, involuntary memory, the '
      + 'trial, the long Southern sentence, the mountain.</p>'],
    C, [R.russia, R.fantastic]),

  ring(R.fantastic[0], 'THE FANTASTIC AND METAFICTION RING', 'The Fantastic &amp; Metafiction Ring', 'lit-fantastic',
    ['<p>The library, the labyrinth and the mirror: forking paths, invisible cities, mad '
      + 'commentaries, Macondo, the pair waiting, and the first detective.</p>'],
    D, [R.modernism, R.american]),

  ring(R.american[0], 'THE AMERICAN LETTERS RING', 'The American Letters Ring', 'lit-american',
    ['<p>The whale, the raft, the scarlet letter and the ghost: the American nineteenth '
      + 'century and its long twentieth-century echo.</p>'],
    E, [R.fantastic, R.gothic]),

  ring(R.gothic[0], 'THE GOTHIC AND ROMANCE RING', 'The Gothic &amp; Romance Ring', 'lit-gothic',
    ['<p>The creature, the moor, the barricade and the mine: the gothic, the romantic '
      + 'sublime, and the naturalism that answered them.</p>'],
    F, [R.realism, R.american]),

  ring(R.poetry[0], 'THE POETRY RING', 'The Poetry Ring', 'lit',
    ['<p>The other half of the shelf. Homer coming into English over four '
      + 'centuries, the Romantics, the men who wrote the trenches down, the '
      + 'modernists and what some of them believed, and then the poems that '
      + 'were made by following a rule, first by hand and then by machine.</p>',
     '<p>Started because the literature ring is all novels and there was '
      + 'nowhere to put Owen.</p>'],
    G, [R.modernism, R.master]),
];
