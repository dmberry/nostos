// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE MUSIC WEBRINGS.
//
// Rings for the record sites: collectors, obsessives, DJs and hi-fi bores, tied
// together the way they tied themselves. Overlapping — the studio-as-instrument
// ring runs from Les Paul through King Tubby to the Bomb Squad, and crosses the
// dub, electronic and machine rings on the way.

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
    'ringmaster gone quiet. the ring turns anyway.</small></p>',
  ],
});

const R = {
  vinyl: ['vinyl-collectors-ring.geocities.ws', 'Vinyl Collectors'],
  jazz: ['jazz-ring.geocities.ws', 'The Jazz Ring'],
  tape: ['electronic-tape-ring.geocities.ws', 'Electronic &amp; Tape Music'],
  dub: ['dub-ring.geocities.ws', 'The Dub Ring'],
  beat: ['machines-beat-ring.geocities.ws', 'Machines That Made the Beat'],
  radio: ['british-radiophonic-ring.geocities.ws', 'British Radiophonic'],
  studio: ['studio-as-instrument-ring.geocities.ws', 'The Studio as Instrument'],
};

export const MUSIC_RINGS = [
  ring(R.jazz[0], 'JAZZ RING', 'The Jazz Ring', 'jazz',
    ['<p>The recorded voice, from the three-minute shellac 78 that could hold one '
      + 'solo to the LP that could hold a suite. Blues, swing, bebop, the modal '
      + 'and the free. Kept by people who still buy the mono.</p>'],
    [['robert-johnson.geocities.ws', 'Robert Johnson'],
     ['louis-armstrong-hotfives.geocities.ws', 'Louis Armstrong'],
     ['billie-holiday.geocities.ws', 'Billie Holiday'],
     ['duke-ellington.geocities.ws', 'Duke Ellington'],
     ['charlie-parker-bebop.geocities.ws', 'Charlie Parker'],
     ['miles-kind-of-blue.geocities.ws', 'Miles Davis / Kind of Blue'],
     ['coltrane-love-supreme.geocities.ws', 'Coltrane / A Love Supreme']],
    [R.vinyl]),

  ring(R.vinyl[0], 'VINYL COLLECTORS RING', 'Vinyl Collectors', 'vinyl',
    ['<p>The LP as an object and a whole thought: the sleeve, the run-out groove, '
      + 'the first pressing, the studio-built pop symphony. Twelve inches of a '
      + 'decision somebody made about how long an idea should last.</p>'],
    [['miles-kind-of-blue.geocities.ws', 'Kind of Blue'],
     ['les-paul-multitrack.geocities.ws', 'Les Paul'],
     ['phil-spector-wall.geocities.ws', 'Phil Spector'],
     ['beatles-sgt-pepper.geocities.ws', 'Sgt Pepper / Abbey Road'],
     ['pet-sounds-brian-wilson.geocities.ws', 'Pet Sounds'],
     ['joni-mitchell-blue.geocities.ws', 'Joni Mitchell / Blue'],
     ['stevie-wonder-songs.geocities.ws', 'Stevie Wonder'],
     ['dylan.geocities.ws', 'Bob Dylan'],
     ['bowie-low.geocities.ws', 'Bowie / Low'],
     ['the-format-page.geocities.ws', 'the physical record'],
     ['the-mixtape.geocities.ws', 'the mixtape'],
     ['loudness-and-mastering.geocities.ws', 'the pressing']],
    [R.jazz, R.studio]),

  ring(R.tape[0], 'ELECTRONIC AND TAPE RING', 'Electronic &amp; Tape Music', 'radiophonic',
    ['<p>Musique concrete, the tape splice, the synthesizer. Sound cut from the '
      + 'world and sound made from nothing. A lot of the machines here were built '
      + 'or first played by women who then got left out of the sleeve notes.</p>'],
    [['pierre-schaeffer-grm.geocities.ws', 'Pierre Schaeffer / GRM'],
     ['stockhausen.geocities.ws', 'Stockhausen'],
     ['daphne-oram-oramics.geocities.ws', 'Daphne Oram / Oramics'],
     ['delia-derbyshire.geocities.ws', 'Delia Derbyshire'],
     ['wendy-carlos-moog.geocities.ws', 'Wendy Carlos'],
     ['bob-moog-synth.geocities.ws', 'Bob Moog / the synthesizer'],
     ['suzanne-ciani.geocities.ws', 'Suzanne Ciani'],
     ['kraftwerk.geocities.ws', 'Kraftwerk'],
     ['brian-eno-ambient.geocities.ws', 'Brian Eno']],
    [R.radio, R.beat]),

  ring(R.radio[0], 'BRITISH RADIOPHONIC RING', 'British Radiophonic', 'radiophonic',
    ['<p>The BBC Radiophonic Workshop and its neighbours: the theme you have '
      + 'heard ten thousand times, spliced from test oscillators by hand, and the '
      + 'people who did it in a room at Maida Vale for a flat wage and no credit.</p>'],
    [['daphne-oram-oramics.geocities.ws', 'Daphne Oram'],
     ['delia-derbyshire.geocities.ws', 'Delia Derbyshire'],
     ['this-heat.geocities.ws', 'This Heat']],
    [R.tape]),

  ring(R.dub[0], 'DUB RING', 'The Dub Ring', 'dub',
    ['<p>Kingston, the mixing desk as an instrument, the vocal pulled out and the '
      + 'drum dropped into a canyon of reverb. Where the remix was invented, on a '
      + 'four-track, by hand, with the faders.</p>'],
    [['king-tubby.geocities.ws', 'King Tubby'],
     ['lee-scratch-perry-black-ark.geocities.ws', 'Lee Scratch Perry / Black Ark'],
     ['augustus-pablo.geocities.ws', 'Augustus Pablo']],
    [R.studio]),

  ring(R.beat[0], 'MACHINES THAT MADE THE BEAT', 'Machines That Made the Beat', 'rave',
    ['<p>The turntable, the sampler, the 808 and the 303. Boxes that were meant '
      + 'for something else, bought cheap when they failed, and turned into '
      + 'hip-hop, house and techno by people the makers never imagined.</p>'],
    [['grandmaster-flash.geocities.ws', 'Grandmaster Flash'],
     ['afrika-bambaataa-planet-rock.geocities.ws', 'Bambaataa / Planet Rock'],
     ['public-enemy-bomb-squad.geocities.ws', 'Public Enemy / the Bomb Squad'],
     ['roland-808-303.geocities.ws', 'the Roland 808 &amp; 303'],
     ['frankie-knuckles-house.geocities.ws', 'Frankie Knuckles / house'],
     ['detroit-techno.geocities.ws', 'Detroit techno'],
     ['moroder-donna-summer.geocities.ws', 'Moroder &amp; Summer / I Feel Love'],
     ['kraftwerk.geocities.ws', 'Kraftwerk']],
    [R.tape, R.studio]),

  ring(R.studio[0], 'STUDIO AS INSTRUMENT RING', 'The Studio as Instrument', 'vinyl',
    ['<p>The moment the recording stops being a document of a performance and '
      + 'becomes the thing itself: multitracking, the Wall of Sound, dub, the '
      + 'sampler. The producer as a player, and the room as the biggest '
      + 'instrument in it.</p>'],
    [['les-paul-multitrack.geocities.ws', 'Les Paul / multitrack'],
     ['phil-spector-wall.geocities.ws', 'Phil Spector / Wall of Sound'],
     ['beatles-sgt-pepper.geocities.ws', 'George Martin / the Beatles'],
     ['pet-sounds-brian-wilson.geocities.ws', 'Brian Wilson'],
     ['brian-eno-ambient.geocities.ws', 'Brian Eno'],
     ['king-tubby.geocities.ws', 'King Tubby'],
     ['lee-scratch-perry-black-ark.geocities.ws', 'Lee Scratch Perry'],
     ['joy-division-hannett.geocities.ws', 'Martin Hannett'],
     ['public-enemy-bomb-squad.geocities.ws', 'the Bomb Squad'],
     ['stevie-wonder-songs.geocities.ws', 'Stevie Wonder']],
    [R.vinyl, R.dub, R.beat]),
];
