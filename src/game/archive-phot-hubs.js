// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PHOTOGRAPHY WEBRINGS.
//
// The master ring is photography-ring, which every page joins. Under it run six
// strands: the pioneers, documentary and social, art photography, photojournalism
// and war, portrait and fashion and street, and the medium and its process.

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
    'the ringmaster is in the darkroom. the ring turns anyway.</small></p>',
  ],
});

const R = {
  master: ['photography-ring.geocities.ws', 'Photography Ring'],
  pioneers: ['photo-pioneers-ring.geocities.ws', 'The Pioneers Ring'],
  documentary: ['documentary-photo-ring.geocities.ws', 'The Documentary &amp; Social Ring'],
  art: ['art-photography-ring.geocities.ws', 'The Art Photography Ring'],
  photojournalism: ['photojournalism-ring.geocities.ws', 'The Photojournalism &amp; War Ring'],
  portrait: ['portrait-and-street-ring.geocities.ws', 'The Portrait &amp; Street Ring'],
  process: ['photo-process-ring.geocities.ws', 'The Medium &amp; Process Ring'],
};

const A = [['eadweard-muybridge.geocities.ws', 'Eadweard Muybridge'], ['daguerre.geocities.ws', 'Daguerre'],
  ['fox-talbot.geocities.ws', 'Fox Talbot'], ['julia-margaret-cameron.geocities.ws', 'Julia Margaret Cameron'],
  ['nadar.geocities.ws', 'Nadar'], ['the-daguerreotype.geocities.ws', 'The Daguerreotype']];
const B = [['dorothea-lange.geocities.ws', 'Dorothea Lange'], ['jacob-riis.geocities.ws', 'Jacob Riis'],
  ['lewis-hine.geocities.ws', 'Lewis Hine'], ['walker-evans.geocities.ws', 'Walker Evans'],
  ['the-fsa.geocities.ws', 'The FSA'], ['w-eugene-smith.geocities.ws', 'W. Eugene Smith']];
const C = [['alfred-stieglitz.geocities.ws', 'Alfred Stieglitz'], ['ansel-adams.geocities.ws', 'Ansel Adams'],
  ['edward-weston.geocities.ws', 'Edward Weston'], ['man-ray.geocities.ws', 'Man Ray'],
  ['the-f64-group.geocities.ws', 'The f/64 Group'], ['imogen-cunningham.geocities.ws', 'Imogen Cunningham']];
const D = [['henri-cartier-bresson.geocities.ws', 'Henri Cartier-Bresson'], ['robert-capa.geocities.ws', 'Robert Capa'],
  ['the-decisive-moment.geocities.ws', 'The Decisive Moment'], ['magnum-photos.geocities.ws', 'Magnum Photos'],
  ['gerda-taro.geocities.ws', 'Gerda Taro'], ['don-mccullin.geocities.ws', 'Don McCullin']];
const E = [['diane-arbus.geocities.ws', 'Diane Arbus'], ['richard-avedon.geocities.ws', 'Richard Avedon'],
  ['irving-penn.geocities.ws', 'Irving Penn'], ['vivian-maier.geocities.ws', 'Vivian Maier'],
  ['august-sander.geocities.ws', 'August Sander'], ['helen-levitt.geocities.ws', 'Helen Levitt']];
const F = [['the-camera-obscura.geocities.ws', 'The Camera Obscura'], ['the-negative.geocities.ws', 'The Negative'],
  ['the-darkroom.geocities.ws', 'The Darkroom'], ['the-leica.geocities.ws', 'The Leica'],
  ['colour-photography.geocities.ws', 'Colour Photography'], ['the-photobook.geocities.ws', 'The Photobook']];

export const PHOT_RINGS = [
  ring(R.master[0], 'PHOTOGRAPHY RING', 'Photography Ring', 'photo-art',
    ['<p>The light on the plate: the pioneers who fixed the image, the documentary conscience, the '
      + 'fight to call it art, the photojournalists and the war, the portrait and the street, and the '
      + 'darkroom craft behind every print.</p>'],
    [...A, ...B, ...C, ...D, ...E, ...F],
    [R.pioneers, R.documentary, R.art, R.photojournalism, R.portrait, R.process]),

  ring(R.pioneers[0], 'THE PIONEERS RING', 'The Pioneers Ring', 'photo-pioneers',
    ['<p>Fixing the shadow: the horse in motion, the mirror with a memory, the negative that could be '
      + 'copied, the soft-focus portrait, the balloon over Paris, and the silvered plate.</p>'],
    A, [R.documentary, R.process]),

  ring(R.documentary[0], 'THE DOCUMENTARY AND SOCIAL RING', 'The Documentary &amp; Social Ring', 'photo-documentary',
    ['<p>The camera as witness: the migrant mother, the other half, the child in the mill, the tenant '
      + 'farmer, the file of a nation, and the photo essay.</p>'],
    B, [R.pioneers, R.photojournalism]),

  ring(R.art[0], 'THE ART PHOTOGRAPHY RING', 'The Art Photography Ring', 'photo-art',
    ['<p>The straight print as art: Camera Work and the steerage, the Zone System and the moonrise, the '
      + 'pepper and the shell, the cameraless rayograph, the smallest aperture, and the magnolia.</p>'],
    C, [R.documentary, R.portrait]),

  ring(R.photojournalism[0], 'THE PHOTOJOURNALISM AND WAR RING', 'The Photojournalism &amp; War Ring', 'photo-photojournalism',
    ['<p>Close enough: the decisive moment, the falling soldier and the D-Day blur, the co-operative that '
      + 'owned its work, the first woman to fall, and the war on the conscience.</p>'],
    D, [R.art, R.portrait]),

  ring(R.portrait[0], 'THE PORTRAIT AND STREET RING', 'The Portrait &amp; Street Ring', 'photo-portrait',
    ['<p>The face and the pavement: the eccentrics in the square frame, the white-ground West, the corner '
      + 'portrait, the nanny with the Rolleiflex, the German typology, and the chalk on the New York '
      + 'sidewalk.</p>'],
    E, [R.photojournalism, R.process]),

  ring(R.process[0], 'THE MEDIUM AND PROCESS RING', 'The Medium &amp; Process Ring', 'photo-process',
    ['<p>Behind the print: the pinhole and the projected image, the reversed tones, the safelight and the '
      + 'tray, the little 35mm body, the slow arrival of colour, and the book as the home of the '
      + 'photograph.</p>'],
    F, [R.pioneers, R.art]),
];
