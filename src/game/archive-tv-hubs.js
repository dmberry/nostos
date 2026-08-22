// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE TELEVISION WEBRINGS.
//
// The master ring is television-ring, which every page joins. Under it run six
// strands: cult SF and fantasy, comedy, crime and cop shows, landmark drama,
// animation, and the culture of the box itself.

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
    'the ringmaster is adjusting the vertical hold. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['television-ring.geocities.ws', 'Television Ring'],
  cult: ['cult-tv-ring.geocities.ws', 'Cult SF &amp; Fantasy TV Ring'],
  comedy: ['tv-comedy-ring.geocities.ws', 'The TV Comedy Ring'],
  crime: ['cop-shows-ring.geocities.ws', 'The Crime &amp; Cop Shows Ring'],
  drama: ['tv-drama-ring.geocities.ws', 'The Landmark Drama Ring'],
  animation: ['tv-animation-ring.geocities.ws', 'The Animation Ring'],
  culture: ['tv-culture-ring.geocities.ws', 'The Box &amp; the Culture Ring'],
};

const A = [['twin-peaks.geocities.ws', 'Twin Peaks'], ['the-prisoner.geocities.ws', 'The Prisoner'],
  ['the-x-files.geocities.ws', 'The X-Files'], ['the-twilight-zone.geocities.ws', 'The Twilight Zone'],
  ['doctor-who.geocities.ws', 'Doctor Who'], ['star-trek.geocities.ws', 'Star Trek']];
const B = [['monty-python.geocities.ws', 'Monty Python'], ['the-simpsons.geocities.ws', 'The Simpsons'],
  ['seinfeld.geocities.ws', 'Seinfeld'], ['fawlty-towers.geocities.ws', 'Fawlty Towers'],
  ['blackadder.geocities.ws', 'Blackadder'], ['cheers.geocities.ws', 'Cheers']];
const C = [['columbo.geocities.ws', 'Columbo'], ['the-rockford-files.geocities.ws', 'The Rockford Files'],
  ['hill-street-blues.geocities.ws', 'Hill Street Blues'], ['miami-vice.geocities.ws', 'Miami Vice'],
  ['prime-suspect.geocities.ws', 'Prime Suspect'], ['homicide-life-on-the-street.geocities.ws', 'Homicide: Life on the Street']];
const D = [['the-singing-detective.geocities.ws', 'The Singing Detective'], ['i-claudius.geocities.ws', 'I, Claudius'],
  ['brideshead-revisited.geocities.ws', 'Brideshead Revisited'], ['edge-of-darkness.geocities.ws', 'Edge of Darkness'],
  ['our-friends-in-the-north.geocities.ws', 'Our Friends in the North'], ['the-sopranos.geocities.ws', 'The Sopranos']];
const E = [['looney-tunes.geocities.ws', 'Looney Tunes'], ['ren-and-stimpy.geocities.ws', 'The Ren &amp; Stimpy Show'],
  ['batman-the-animated-series.geocities.ws', 'Batman: The Animated Series'], ['beavis-and-butthead.geocities.ws', 'Beavis and Butt-Head'],
  ['the-muppet-show.geocities.ws', 'The Muppet Show'], ['spitting-image.geocities.ws', 'Spitting Image']];
const F = [['mtv.geocities.ws', 'MTV'], ['saturday-morning-cartoons.geocities.ws', 'Saturday-Morning Cartoons'],
  ['the-test-card.geocities.ws', 'The Test Card'], ['the-vcr.geocities.ws', 'The VCR'],
  ['public-access-tv.geocities.ws', 'Public-Access TV'], ['the-tv-listings.geocities.ws', 'The TV Listings']];

export const TV_RINGS = [
  ring(R.master[0], 'TELEVISION RING', 'Television Ring', 'tv-cult',
    ['<p>The box in the corner and everything it showed: the cult SF and fantasy, the great '
      + 'comedies, the crime and cop shows, the landmark dramas, the animation, and the culture '
      + 'of television itself.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.cult, R.comedy, R.crime, R.drama, R.animation, R.culture]),

  ring(R.cult[0], 'CULT SF AND FANTASY TV RING', 'Cult SF &amp; Fantasy TV Ring', 'tv-cult',
    ['<p>The shows with the fan clubs and the conventions: the surreal soap, the Village, the '
      + 'truth out there, the twist endings, the TARDIS and the Enterprise.</p>'],
    A, [R.comedy, R.drama]),

  ring(R.comedy[0], 'THE TV COMEDY RING', 'The TV Comedy Ring', 'tv-comedy',
    ['<p>The ones you can quote by heart: the flying circus, the yellow family, the show about '
      + 'nothing, the Torquay hotel, the cunning plans, and the bar.</p>'],
    B, [R.cult, R.animation]),

  ring(R.crime[0], 'THE CRIME AND COP SHOWS RING', 'The Crime &amp; Cop Shows Ring', 'tv-crime',
    ['<p>The badge and the raincoat: the one-more-thing detective, the beach trailer, the '
      + 'ensemble squad room, the pastel Miami, and the Baltimore board.</p>'],
    C, [R.drama, R.culture]),

  ring(R.drama[0], 'THE LANDMARK DRAMA RING', 'The Landmark Drama Ring', 'tv-drama',
    ['<p>Television that wanted to be art: the hospital and the noir, the Roman intrigue, the '
      + 'teddy bear at Oxford, the nuclear dread, the decades, and the therapy.</p>'],
    D, [R.cult, R.crime]),

  ring(R.animation[0], 'THE ANIMATION RING', 'The Animation Ring', 'tv-animation',
    ['<p>The cartoon on the screen: the seven-minute anarchy, the gross-out revival, the dark '
      + 'deco Gotham, the couch critics, the puppets, and the latex satire.</p>'],
    E, [R.comedy, R.culture]),

  ring(R.culture[0], 'THE BOX AND THE CULTURE RING', 'The Box &amp; the Culture Ring', 'tv-culture',
    ['<p>The medium and the rituals: the video channel, the Saturday-morning block, the test '
      + 'card, the VCR, the public-access channel, and the listings magazine.</p>'],
    F, [R.crime, R.animation]),
];
