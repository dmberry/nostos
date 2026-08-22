// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE COMPOSERS WEBRINGS.
//
// The master ring is composers-ring, which every page joins. Under it run six
// strands: the Baroque, the Classical, the Romantic, the national schools, the
// underplayed women, and the twentieth century.

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
    'the ringmaster is turning the page for the soloist. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['composers-ring.geocities.ws', 'Composers Ring'],
  baroque: ['baroque-music-ring.geocities.ws', 'The Baroque Ring'],
  classical: ['classical-music-ring.geocities.ws', 'The Classical Ring'],
  romantic: ['romantic-music-ring.geocities.ws', 'The Romantic Ring'],
  national: ['national-schools-ring.geocities.ws', 'The National Schools Ring'],
  women: ['women-composers-ring.geocities.ws', 'The Women Composers Ring'],
  modern: ['twentieth-century-music-ring.geocities.ws', 'The Twentieth-Century Ring'],
};

const A = [['js-bach.geocities.ws', 'J. S. Bach'], ['handel.geocities.ws', 'George Frideric Handel'],
  ['vivaldi.geocities.ws', 'Antonio Vivaldi'], ['cpe-bach.geocities.ws', 'C. P. E. Bach'],
  ['zelenka.geocities.ws', 'Jan Dismas Zelenka'], ['rameau.geocities.ws', 'Jean-Philippe Rameau']];
const B = [['mozart.geocities.ws', 'W. A. Mozart'], ['haydn.geocities.ws', 'Joseph Haydn'],
  ['beethoven.geocities.ws', 'Ludwig van Beethoven'], ['boccherini.geocities.ws', 'Luigi Boccherini'],
  ['gluck.geocities.ws', 'Christoph Willibald Gluck'], ['the-mannheim-school.geocities.ws', 'The Mannheim School']];
const C = [['brahms.geocities.ws', 'Johannes Brahms'], ['schubert.geocities.ws', 'Franz Schubert'],
  ['chopin.geocities.ws', 'Frederic Chopin'], ['clara-schumann.geocities.ws', 'Clara Schumann'],
  ['fanny-mendelssohn.geocities.ws', 'Fanny Mendelssohn'], ['berlioz.geocities.ws', 'Hector Berlioz']];
const D = [['dvorak.geocities.ws', 'Antonin Dvorak'], ['janacek.geocities.ws', 'Leos Janacek'],
  ['grieg.geocities.ws', 'Edvard Grieg'], ['sibelius.geocities.ws', 'Jean Sibelius'],
  ['carl-nielsen.geocities.ws', 'Carl Nielsen'], ['szymanowski.geocities.ws', 'Karol Szymanowski']];
const E = [['louise-farrenc.geocities.ws', 'Louise Farrenc'], ['lili-boulanger.geocities.ws', 'Lili Boulanger'],
  ['florence-price.geocities.ws', 'Florence Price'], ['grazyna-bacewicz.geocities.ws', 'Grazyna Bacewicz'],
  ['galina-ustvolskaya.geocities.ws', 'Galina Ustvolskaya'], ['ethel-smyth.geocities.ws', 'Ethel Smyth']];
const F = [['stravinsky.geocities.ws', 'Igor Stravinsky'], ['debussy.geocities.ws', 'Claude Debussy'],
  ['schoenberg.geocities.ws', 'Arnold Schoenberg'], ['shostakovich.geocities.ws', 'Dmitri Shostakovich'],
  ['messiaen.geocities.ws', 'Olivier Messiaen'], ['toru-takemitsu.geocities.ws', 'Toru Takemitsu']];

export const COMP_RINGS = [
  ring(R.master[0], 'COMPOSERS RING', 'Composers Ring', 'comp-classical',
    ['<p>Three centuries of written music: the Baroque and the Classical, the Romantics and the '
      + 'national schools, the women the concert hall underplays, and the century that broke '
      + 'the bar line.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.baroque, R.classical, R.romantic, R.national, R.women, R.modern]),

  ring(R.baroque[0], 'THE BAROQUE RING', 'The Baroque Ring', 'comp-baroque',
    ['<p>The age of the fugue and the concerto: the Passions and the Four Seasons, the red priest '
      + 'and the overlooked Bohemian, and the theory of harmony itself.</p>'],
    A, [R.classical, R.modern]),

  ring(R.classical[0], 'THE CLASSICAL RING', 'The Classical Ring', 'comp-classical',
    ['<p>The symphony and the string quartet: the Kochel and the hundred and four, the nine that '
      + 'changed everything, the reform of opera, and the orchestra that learned the crescendo.</p>'],
    B, [R.baroque, R.romantic]),

  ring(R.romantic[0], 'THE ROMANTIC RING', 'The Romantic Ring', 'comp-romantic',
    ['<p>The song and the symphony of feeling: the lieder and the nocturne, the German Requiem, '
      + 'the two great women the histories underplayed, and the huge Romantic orchestra.</p>'],
    C, [R.classical, R.national]),

  ring(R.national[0], 'THE NATIONAL SCHOOLS RING', 'The National Schools Ring', 'comp-national',
    ['<p>The folk tune raised to the concert hall: the New World and the speech-melody, the fjord '
      + 'and the Kalevala, and the Polish and Danish and Czech voices.</p>'],
    D, [R.romantic, R.modern]),

  ring(R.women[0], 'THE WOMEN COMPOSERS RING', 'The Women Composers Ring', 'comp-women',
    ['<p>The composers the concert hall left off the programme: the symphonist who fought for equal '
      + 'pay, the first to win the Prix de Rome, the first Black American woman on a major stage, '
      + 'and the suffragette who conducted from a cell.</p>'],
    E, [R.romantic, R.modern]),

  ring(R.modern[0], 'THE TWENTIETH-CENTURY RING', 'The Twentieth-Century Ring', 'comp-modern',
    ['<p>The century that broke the bar line: the riot at the Rite, impressionism and the '
      + 'twelve-tone method, the symphonies written under Stalin, birdsong from a prison camp, and '
      + 'the meeting of Debussy and the Japanese garden.</p>'],
    F, [R.national, R.women]),
];
