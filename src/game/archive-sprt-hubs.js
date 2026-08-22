// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE SPORT WEBRINGS.
//
// The master ring is sport-ring, which every page joins. Under it run six strands:
// football, boxing, track and the Olympics, bat and racket, motor and endurance,
// and the stadium and the overlooked.

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
    'the ringmaster is queuing at the turnstile. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['sport-ring.geocities.ws', 'Sport Ring'],
  football: ['football-ring.geocities.ws', 'The Football Ring'],
  boxing: ['boxing-ring-webring.geocities.ws', 'The Boxing Ring'],
  track: ['track-and-olympics-ring.geocities.ws', 'The Track &amp; Olympics Ring'],
  batracket: ['bat-and-racket-ring.geocities.ws', 'The Bat &amp; Racket Ring'],
  motor: ['motor-and-endurance-ring.geocities.ws', 'The Motor &amp; Endurance Ring'],
  culture: ['stadium-and-culture-ring.geocities.ws', 'The Stadium &amp; Culture Ring'],
};

const A = [['pele.geocities.ws', 'Pelé'], ['diego-maradona.geocities.ws', 'Diego Maradona'],
  ['johan-cruyff.geocities.ws', 'Johan Cruyff'], ['ferenc-puskas.geocities.ws', 'Ferenc Puskás'],
  ['george-best.geocities.ws', 'George Best'], ['the-world-cup.geocities.ws', 'The World Cup']];
const B = [['muhammad-ali.geocities.ws', 'Muhammad Ali'], ['joe-louis.geocities.ws', 'Joe Louis'],
  ['sugar-ray-robinson.geocities.ws', 'Sugar Ray Robinson'], ['jack-johnson.geocities.ws', 'Jack Johnson'],
  ['rocky-marciano.geocities.ws', 'Rocky Marciano'], ['the-heavyweight-title.geocities.ws', 'The Heavyweight Title']];
const C = [['jesse-owens.geocities.ws', 'Jesse Owens'], ['fanny-blankers-koen.geocities.ws', 'Fanny Blankers-Koen'],
  ['emil-zatopek.geocities.ws', 'Emil Zátopek'], ['roger-bannister.geocities.ws', 'Roger Bannister'],
  ['wilma-rudolph.geocities.ws', 'Wilma Rudolph'], ['the-olympic-games.geocities.ws', 'The Olympic Games']];
const D = [['don-bradman.geocities.ws', 'Don Bradman'], ['w-g-grace.geocities.ws', 'W. G. Grace'],
  ['the-ashes.geocities.ws', 'The Ashes'], ['billie-jean-king.geocities.ws', 'Billie Jean King'],
  ['rod-laver.geocities.ws', 'Rod Laver'], ['wimbledon.geocities.ws', 'Wimbledon']];
const E = [['juan-manuel-fangio.geocities.ws', 'Juan Manuel Fangio'], ['ayrton-senna.geocities.ws', 'Ayrton Senna'],
  ['eddy-merckx.geocities.ws', 'Eddy Merckx'], ['the-tour-de-france.geocities.ws', 'The Tour de France'],
  ['le-mans.geocities.ws', 'Le Mans'], ['the-grand-prix.geocities.ws', 'The Grand Prix']];
const F = [['nadia-comaneci.geocities.ws', 'Nadia Comăneci'], ['babe-didrikson.geocities.ws', 'Babe Didrikson'],
  ['jim-thorpe.geocities.ws', 'Jim Thorpe'], ['the-stadium.geocities.ws', 'The Stadium'],
  ['amateurism.geocities.ws', 'Amateurism'], ['sports-broadcasting.geocities.ws', 'Sports Broadcasting']];

export const SPRT_RINGS = [
  ring(R.master[0], 'SPORT RING', 'Sport Ring', 'sport-culture',
    ['<p>The record and the roar: the football, the boxing, the track and the Olympics, the bat and the '
      + 'racket, the motor and the endurance, and the stadiums and the athletes the record books nearly '
      + 'left out.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.football, R.boxing, R.track, R.batracket, R.motor, R.culture]),

  ring(R.football[0], 'THE FOOTBALL RING', 'The Football Ring', 'sport-football',
    ['<p>The beautiful game: the king of Santos, the Hand of God, Total Football, the Mighty Magyars, the '
      + 'fifth Beatle, and the four-yearly cup.</p>'],
    A, [R.boxing, R.culture]),

  ring(R.boxing[0], 'THE BOXING RING', 'The Boxing Ring', 'sport-boxing',
    ['<p>The noble art: the butterfly and the bee, the Brown Bomber, pound for pound, the first Black '
      + 'champion, the 49-0, and the most storied prize in sport.</p>'],
    B, [R.football, R.track]),

  ring(R.track[0], 'THE TRACK AND OLYMPICS RING', 'The Track &amp; Olympics Ring', 'sport-track',
    ['<p>The cinder and the flame: the four golds in Berlin, the Flying Housewife, the locomotive, the '
      + 'four-minute mile, the tornado from Tennessee, and the rings.</p>'],
    C, [R.boxing, R.batracket]),

  ring(R.batracket[0], 'THE BAT AND RACKET RING', 'The Bat &amp; Racket Ring', 'sport-batracket',
    ['<p>The crease and the baseline: the 99.94, the bearded doctor, the little urn, the Battle of the '
      + 'Sexes, the double Grand Slam, and the grass of SW19.</p>'],
    D, [R.track, R.motor]),

  ring(R.motor[0], 'THE MOTOR AND ENDURANCE RING', 'The Motor &amp; Endurance Ring', 'sport-motor',
    ['<p>The wheel and the road: the five-time maestro, the master of the wet, the Cannibal, the yellow '
      + 'jersey, the 24 hours, and the pinnacle.</p>'],
    E, [R.batracket, R.culture]),

  ring(R.culture[0], 'THE STADIUM AND CULTURE RING', 'The Stadium &amp; Culture Ring', 'sport-culture',
    ['<p>The moment and the arena: the perfect ten, the all-round athlete, the stripped and restored '
      + 'medals, the great grounds, the amateur ideal, and the grandstand in the living room.</p>'],
    F, [R.football, R.motor]),
];
