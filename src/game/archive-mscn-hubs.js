// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE MUSIC SCENES WEBRINGS.
//
// The master ring is music-scenes-ring, which every page joins. Under it run six
// strands: jazz and blues, soul and funk and reggae, punk and post-punk, electronic
// and dance, hip-hop and the sound system, and the independent labels and underground.

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
    'the ringmaster is flipping the record. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['music-scenes-ring.geocities.ws', 'Music Scenes Ring'],
  jazz: ['jazz-and-blues-ring.geocities.ws', 'The Jazz &amp; Blues Ring'],
  soul: ['soul-funk-reggae-ring.geocities.ws', 'The Soul, Funk &amp; Reggae Ring'],
  punk: ['punk-and-post-punk-ring.geocities.ws', 'The Punk &amp; Post-Punk Ring'],
  electronic: ['electronic-and-dance-ring.geocities.ws', 'The Electronic &amp; Dance Ring'],
  hiphop: ['hip-hop-ring.geocities.ws', 'The Hip-Hop &amp; Sound System Ring'],
  indie: ['indie-and-underground-ring.geocities.ws', 'The Indie Labels &amp; Underground Ring'],
};

const A = [['bebop.geocities.ws', 'Bebop'], ['the-delta-blues.geocities.ws', 'The Delta Blues'],
  ['new-orleans-jazz.geocities.ws', 'New Orleans Jazz'], ['blue-note-records.geocities.ws', 'Blue Note'],
  ['free-jazz.geocities.ws', 'Free Jazz'], ['chicago-blues.geocities.ws', 'Chicago Blues']];
const B = [['motown.geocities.ws', 'Motown'], ['stax.geocities.ws', 'Stax'],
  ['funk.geocities.ws', 'Funk'], ['ska.geocities.ws', 'Ska'],
  ['roots-reggae.geocities.ws', 'Roots Reggae'], ['dub.geocities.ws', 'Dub']];
const C = [['punk.geocities.ws', 'Punk'], ['post-punk.geocities.ws', 'Post-Punk'],
  ['hardcore.geocities.ws', 'Hardcore'], ['riot-grrrl.geocities.ws', 'Riot Grrrl'],
  ['industrial.geocities.ws', 'Industrial'], ['no-wave.geocities.ws', 'No Wave']];
const D = [['detroit-techno-scene.geocities.ws', 'Detroit Techno'], ['krautrock.geocities.ws', 'Krautrock'],
  ['chicago-house.geocities.ws', 'Chicago House'], ['acid-house.geocities.ws', 'Acid House'],
  ['the-hacienda-nights.geocities.ws', 'The Haçienda'], ['jungle.geocities.ws', 'Jungle']];
const E = [['the-block-party.geocities.ws', 'The Block Party'], ['sugarhill-records.geocities.ws', 'Sugarhill'],
  ['def-jam.geocities.ws', 'Def Jam'], ['golden-age-hip-hop.geocities.ws', 'Golden-Age Hip-Hop'],
  ['the-sampler.geocities.ws', 'The Sampler'], ['turntablism.geocities.ws', 'Turntablism']];
const F = [['factory-records-manchester.geocities.ws', 'Factory Records'], ['4ad.geocities.ws', '4AD'],
  ['sst-records.geocities.ws', 'SST Records'], ['rough-trade.geocities.ws', 'Rough Trade'],
  ['sub-pop.geocities.ws', 'Sub Pop'], ['the-independent-label.geocities.ws', 'The Independent Label']];

export const MSCN_RINGS = [
  ring(R.master[0], 'MUSIC SCENES RING', 'Music Scenes Ring', 'music-jazz',
    ['<p>Not the stars but the scenes: jazz and the blues, soul and funk and reggae, punk and '
      + 'post-punk, electronic and dance, hip-hop and the sound system, and the independent labels '
      + 'that pressed the records the majors would not.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.jazz, R.soul, R.punk, R.electronic, R.hiphop, R.indie]),

  ring(R.jazz[0], 'THE JAZZ AND BLUES RING', 'The Jazz &amp; Blues Ring', 'music-jazz',
    ['<p>The root and the branch: the bebop of Minton\'s, the Delta crossroads, the Storyville '
      + 'marching band, the Blue Note sleeve, the New Thing, and the electric Chicago blues.</p>'],
    A, [R.soul, R.indie]),

  ring(R.soul[0], 'THE SOUL, FUNK AND REGGAE RING', 'The Soul, Funk &amp; Reggae Ring', 'music-soul',
    ['<p>The groove and the message: Hitsville and the Snakepit, the Memphis house band, the one, '
      + 'the Jamaican off-beat, the roots and the Rasta, and the version on the desk.</p>'],
    B, [R.jazz, R.hiphop]),

  ring(R.punk[0], 'THE PUNK AND POST-PUNK RING', 'The Punk &amp; Post-Punk Ring', 'music-punk',
    ['<p>Three chords and the refusal: the year zero of CBGB and the 100 Club, the art-school '
      + 'angularity, the American hardcore, the girls to the front, the tape loops, and no wave.</p>'],
    C, [R.electronic, R.indie]),

  ring(R.electronic[0], 'THE ELECTRONIC AND DANCE RING', 'The Electronic &amp; Dance Ring', 'music-electronic',
    ['<p>The machine and the floor: the Belleville soul, the motorik of Düsseldorf, the Warehouse, '
      + 'the 303 squelch, the Haçienda nights, and the breakbeat sped to jungle.</p>'],
    D, [R.punk, R.hiphop]),

  ring(R.hiphop[0], 'THE HIP-HOP AND SOUND SYSTEM RING', 'The Hip-Hop &amp; Sound System Ring', 'music-hiphop',
    ['<p>From the rec room to the world: the Bronx block party, the first rap on wax, the Def Jam '
      + 'sound, the golden age, the sampler, and the scratch.</p>'],
    E, [R.soul, R.electronic]),

  ring(R.indie[0], 'THE INDIE LABELS AND UNDERGROUND RING', 'The Indie Labels &amp; Underground Ring', 'music-indie',
    ['<p>The seven-inch and the sleeve: Factory and its catalogue, the 4AD dream, the SST network, '
      + 'the Rough Trade shop, the Sub Pop grunge, and the idea of the independent.</p>'],
    F, [R.punk, R.jazz]),
];
