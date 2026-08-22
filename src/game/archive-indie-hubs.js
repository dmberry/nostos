// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE INDIE WEBRINGS.
//
// One collector's 1990s, tied together the way the fanzines tied it: guitars
// that learned to dance, the shoegaze wall, Britpop, the C86 underground, the
// labels that paid (or did not), and the long walk out through post-rock into
// Warp and Boards of Canada. Overlapping on purpose. The labels ring crosses
// every other, because the labels are where the money and the arc both run.

const ring = (domain, name, title, bg, blurb, members, sisters) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · add the strip to join · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'ringmaster left for a label job. the ring turns anyway.</small></p>',
  ],
});

// This set's own rings.
const R = {
  baggy: ['madchester-baggy-ring.geocities.ws', 'The Madchester &amp; Baggy Ring'],
  shoegaze: ['shoegaze-ring.geocities.ws', 'The Shoegaze Ring'],
  britpop: ['britpop-ring.geocities.ws', 'The Britpop Ring'],
  indiepop: ['indie-pop-ring.geocities.ws', 'Indie-Pop &amp; C86'],
  labels: ['indie-labels-ring.geocities.ws', 'The Independent Labels Ring'],
  postrock: ['post-rock-ring.geocities.ws', 'Post-Rock &amp; the Bridge'],
  warp: ['warp-listening-ring.geocities.ws', 'Warp &amp; Listening Music'],
};
// Sister rings already on the web (the existing music set).
const S = {
  dub: ['dub-ring.geocities.ws', 'The Dub Ring'],
  tape: ['electronic-tape-ring.geocities.ws', 'Electronic &amp; Tape Music'],
  studio: ['studio-as-instrument-ring.geocities.ws', 'The Studio as Instrument'],
  radio: ['british-radiophonic-ring.geocities.ws', 'British Radiophonic'],
  machine: ['machine-question-ring.geocities.ws', 'The Machine Question'],
};

export const INDIE_RINGS = [
  ring(R.baggy[0], 'MADCHESTER BAGGY RING', 'The Madchester &amp; Baggy Ring', 'baggy',
    ['<p>The two years indie learned to dance. Guitars over a loose drum, ecstasy '
      + 'in a club that lost money on every pint, and a remixer at the desk turning '
      + 'a band into a twelve-inch. It turns, above all, on one record.</p>'],
    [['stone-roses.geocities.ws', 'The Stone Roses'],
     ['happy-mondays.geocities.ws', 'Happy Mondays'],
     ['primal-scream-screamadelica.geocities.ws', 'Primal Scream / Screamadelica'],
     ['andrew-weatherall.geocities.ws', 'Andrew Weatherall'],
     ['saint-etienne.geocities.ws', 'Saint Etienne'],
     ['the-hacienda.geocities.ws', 'The Haçienda (FAC 51)'],
     ['oasis-definitely-maybe.geocities.ws', 'Oasis / Definitely Maybe']],
    [R.labels, S.dub, S.studio]),

  ring(R.shoegaze[0], 'SHOEGAZE RING', 'The Shoegaze Ring', 'indie',
    ['<p>Heads down, the pedalboard doing the singing. A wall of guitar that was '
      + 'melody all along, if you stood inside it. The press named the scene to bury '
      + 'it; the records outlived the sneer.</p>'],
    [['my-bloody-valentine-loveless.geocities.ws', 'My Bloody Valentine / Loveless'],
     ['slowdive-souvlaki.geocities.ws', 'Slowdive / Souvlaki'],
     ['ride-nowhere.geocities.ws', 'Ride / Nowhere'],
     ['lush-and-shoegaze.geocities.ws', 'Lush &amp; the scene'],
     ['jesus-and-mary-chain.geocities.ws', 'The Jesus and Mary Chain']],
    [R.labels, R.baggy]),

  ring(R.britpop[0], 'BRITPOP RING', 'The Britpop Ring', 'indie',
    ['<p>The underground turned up loud and unembarrassed. Class, cities, the '
      + 'chart as a battleground. Some of it art school, some of it a lager advert. '
      + 'One of these bands would quietly walk toward the machine.</p>'],
    [['pulp-different-class.geocities.ws', 'Pulp / Different Class'],
     ['blur.geocities.ws', 'Blur'],
     ['suede-and-elastica.geocities.ws', 'Suede &amp; Elastica'],
     ['oasis-definitely-maybe.geocities.ws', 'Oasis / Definitely Maybe']],
    [R.labels, R.baggy]),

  ring(R.indiepop[0], 'INDIE-POP C86 RING', 'Indie-Pop &amp; C86', 'indie',
    ['<p>Flexis, fanzines, and a politics of gentleness against the lad-rock din. '
      + 'A label that stopped on purpose at a hundred records. Songs like short '
      + 'stories, pressed a thousand at a time.</p>'],
    [['sarah-records.geocities.ws', 'Sarah Records'],
     ['the-wedding-present.geocities.ws', 'The Wedding Present'],
     ['belle-and-sebastian.geocities.ws', 'Belle and Sebastian'],
     ['felt-lawrence.geocities.ws', 'Felt / Lawrence'],
     ['saint-etienne.geocities.ws', 'Saint Etienne']],
    [R.labels, R.shoegaze]),

  ring(R.labels[0], 'INDEPENDENT LABELS RING', 'The Independent Labels Ring', 'indie',
    ['<p>Where the money and the arc both run. Creation scaling into a major and '
      + 'losing its shape, Factory refusing to make money as a matter of design, '
      + 'Sarah stopping while ahead, Warp carrying the whole thing indoors. Cross '
      + 'this ring and you can reach any other.</p>'],
    [['creation-records.geocities.ws', 'Creation Records'],
     ['factory-records.geocities.ws', 'Factory Records'],
     ['sarah-records.geocities.ws', 'Sarah Records'],
     ['warp-records.geocities.ws', 'Warp Records'],
     ['the-hacienda.geocities.ws', 'The Haçienda (FAC 51)']],
    [R.baggy, R.shoegaze, R.britpop, R.warp, S.studio]),

  ring(R.postrock[0], 'POST-ROCK RING', 'Post-Rock &amp; the Bridge', 'hauntology',
    ['<p>The bands that stopped wanting to rock. Motorik loops, samplers triggered '
      + 'by guitar strings, the crackle cut in on purpose. A word coined for one '
      + 'review, and a door that led, quite literally, to Warp.</p>'],
    [['stereolab.geocities.ws', 'Stereolab'],
     ['spiritualized.geocities.ws', 'Spiritualized'],
     ['massive-attack-portishead.geocities.ws', 'Massive Attack &amp; Portishead'],
     ['bark-psychosis-postrock.geocities.ws', 'Bark Psychosis / post-rock'],
     ['boards-of-canada.geocities.ws', 'Boards of Canada']],
    [R.warp, S.tape, S.machine]),

  ring(R.warp[0], 'WARP LISTENING RING', 'Warp &amp; Listening Music', 'hauntology',
    ['<p>Bleep techno that got up out of the club and sat down in the front room. '
      + 'The armchair on the sleeve. Analogue gear detuned into warmth and unease, '
      + 'and a false nostalgia for a childhood that maybe never happened. This is '
      + 'where the collection ends.</p>'],
    [['warp-records.geocities.ws', 'Warp Records'],
     ['aphex-twin.geocities.ws', 'Aphex Twin'],
     ['autechre.geocities.ws', 'Autechre'],
     ['boards-of-canada.geocities.ws', 'Boards of Canada'],
     ['bark-psychosis-postrock.geocities.ws', 'Bark Psychosis / post-rock']],
    [R.postrock, S.tape, S.radio, S.machine]),
];
