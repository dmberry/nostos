// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE FRANKFURT SCHOOL WEBRINGS, 1900–2025.
//
// The Institut and its long afterlife, tied together the way the seminar reading
// lists tied them: one main ring for the whole school, and three that cross it
// along the strands the school actually split into. The pages already on the
// wider web that belong here (the culture industry, One-Dimensional Man, the
// artwork essay) are named as members too.

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
    ...(sisters ? ['<p><small>sister rings: ' + sisters.map(([d, t]) => `<a href="${d}">${t}</a>`).join(' · ') + '</small></p>'] : []),
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'the ringmaster is finishing a dissertation. the ring turns anyway.</small></p>',
  ],
});

const R = {
  main: ['frankfurt-school-ring.geocities.ws', 'Frankfurt School Ring'],
  exile: ['exile-emigres-ring.geocities.ws', 'Exile &amp; Émigrés Ring'],
  aesth: ['aesthetics-utopia-ring.geocities.ws', 'Aesthetics &amp; Utopia Ring'],
  recog: ['recognition-critique-ring.geocities.ws', 'Recognition &amp; Critique Ring'],
};

export const FS_RINGS = [
  ring(R.main[0], 'FRANKFURT SCHOOL RING', 'Frankfurt School Ring', 'critical',
    ['<p>Critical theory from the Institut für Sozialforschung to the fourth '
      + 'generation. The whole shelf: the founders and their exile, the aesthetic '
      + 'and messianic strand, Habermas and the linguistic turn, recognition and '
      + 'the critique that came after. Kept by people who still read the footnotes.</p>'],
    [['institut-fur-sozialforschung.geocities.ws', 'The Institut für Sozialforschung'],
     ['horkheimer-critical-theory.geocities.ws', 'Max Horkheimer'],
     ['adorno-negative-dialectics.geocities.ws', 'Theodor W. Adorno'],
     ['cultureindustry.geocities.ws', 'Adorno &amp; Horkheimer — the culture industry'],
     ['dialectic-of-enlightenment.geocities.ws', 'Dialectic of Enlightenment'],
     ['minima-moralia.geocities.ws', 'Minima Moralia'],
     ['eclipse-of-reason.geocities.ws', 'Eclipse of Reason'],
     ['fromm-escape-freedom.geocities.ws', 'Erich Fromm'],
     ['pollock-state-capitalism.geocities.ws', 'Friedrich Pollock'],
     ['neumann-behemoth.geocities.ws', 'Franz Neumann — Behemoth'],
     ['kirchheimer-law.geocities.ws', 'Otto Kirchheimer'],
     ['authoritarian-personality.geocities.ws', 'The Authoritarian Personality'],
     ['exile-at-columbia.geocities.ws', 'Exile at Columbia'],
     ['lowenthal-literature.geocities.ws', 'Leo Löwenthal'],
     ['benjamin-arcades.geocities.ws', 'Walter Benjamin — the Arcades'],
     ['aura.geocities.ws', 'Benjamin — the work of art essay'],
     ['benjamin-theses.geocities.ws', 'On the Concept of History'],
     ['benjamin-storyteller.geocities.ws', 'The Storyteller'],
     ['bloch-principle-hope.geocities.ws', 'Ernst Bloch'],
     ['kracauer-mass-ornament.geocities.ws', 'Siegfried Kracauer'],
     ['sohn-rethel-abstraction.geocities.ws', 'Alfred Sohn-Rethel'],
     ['adorno-aesthetic.geocities.ws', 'Aesthetic Theory'],
     ['adorno-music.geocities.ws', 'Adorno on music'],
     ['lukacs-reification.geocities.ws', 'Georg Lukács'],
     ['korsch-marxism.geocities.ws', 'Karl Korsch'],
     ['habermas-public-sphere.geocities.ws', 'Jürgen Habermas'],
     ['habermas-communicative-action.geocities.ws', 'The Theory of Communicative Action'],
     ['habermas-postnational.geocities.ws', 'Habermas — the postnational'],
     ['alfred-schmidt-nature.geocities.ws', 'Alfred Schmidt'],
     ['negt-kluge-public.geocities.ws', 'Negt &amp; Kluge'],
     ['offe-welfare.geocities.ws', 'Claus Offe'],
     ['honneth-recognition.geocities.ws', 'Axel Honneth'],
     ['fraser-redistribution.geocities.ws', 'Nancy Fraser'],
     ['benhabib-situating.geocities.ws', 'Seyla Benhabib'],
     ['wellmer-modernism.geocities.ws', 'Albrecht Wellmer'],
     ['menke-force.geocities.ws', 'Christoph Menke'],
     ['jaeggi-forms-of-life.geocities.ws', 'Rahel Jaeggi'],
     ['rosa-resonance.geocities.ws', 'Hartmut Rosa'],
     ['celikates-critique.geocities.ws', 'Robin Celikates'],
     ['critical-theory-and-the-digital.geocities.ws', 'Critical Theory and the Digital'],
     ['marcuse-eros.geocities.ws', 'Herbert Marcuse — Eros and Civilization'],
     ['one-dimensional.geocities.ws', 'Marcuse — One-Dimensional Man'],
     ['angela-davis-frankfurt.geocities.ws', 'Angela Davis'],
     ['adorno-and-the-students.geocities.ws', 'Adorno and the students, 1969'],
     ['the-positivism-dispute.geocities.ws', 'The Positivism Dispute'],
     ['reading-the-frankfurt-school.geocities.ws', 'Reading the Frankfurt School']],
    [R.exile, R.aesth, R.recog]),

  ring(R.exile[0], 'EXILE AND ÉMIGRÉS RING', 'Exile &amp; Émigrés Ring', 'exile',
    ['<p>The years in America, and the political-empirical wing. State capitalism, '
      + 'the anatomy of the Nazi non-state, the study of the authoritarian '
      + 'character, and the philosopher the New Left carried out of the seminar '
      + 'room into the street.</p>'],
    [['exile-at-columbia.geocities.ws', 'Exile at Columbia'],
     ['fromm-escape-freedom.geocities.ws', 'Erich Fromm'],
     ['pollock-state-capitalism.geocities.ws', 'Friedrich Pollock'],
     ['neumann-behemoth.geocities.ws', 'Franz Neumann'],
     ['kirchheimer-law.geocities.ws', 'Otto Kirchheimer'],
     ['authoritarian-personality.geocities.ws', 'The Authoritarian Personality'],
     ['lowenthal-literature.geocities.ws', 'Leo Löwenthal'],
     ['marcuse-eros.geocities.ws', 'Herbert Marcuse'],
     ['angela-davis-frankfurt.geocities.ws', 'Angela Davis']],
    [R.main]),

  ring(R.aesth[0], 'AESTHETICS AND UTOPIA RING', 'Aesthetics &amp; Utopia Ring', 'messianic',
    ['<p>The messianic and aesthetic strand. Benjamin against the grain of '
      + 'history, Bloch on the Not-Yet, Kracauer on the mass ornament, Adorno on '
      + 'the truth-content of the artwork and the regression of listening. Read '
      + 'slowly, and out of order.</p>'],
    [['benjamin-arcades.geocities.ws', 'Walter Benjamin — the Arcades'],
     ['benjamin-theses.geocities.ws', 'On the Concept of History'],
     ['benjamin-storyteller.geocities.ws', 'The Storyteller'],
     ['aura.geocities.ws', 'Benjamin — the artwork essay'],
     ['bloch-principle-hope.geocities.ws', 'Ernst Bloch'],
     ['kracauer-mass-ornament.geocities.ws', 'Siegfried Kracauer'],
     ['adorno-aesthetic.geocities.ws', 'Aesthetic Theory'],
     ['adorno-music.geocities.ws', 'Adorno on music'],
     ['sohn-rethel-abstraction.geocities.ws', 'Alfred Sohn-Rethel']],
    [R.main]),

  ring(R.recog[0], 'RECOGNITION AND CRITIQUE RING', 'Recognition &amp; Critique Ring', 'recognition',
    ['<p>The turn to language, and what came after it. Habermas on the public '
      + 'sphere and communicative action, Honneth on recognition, Fraser on '
      + 'redistribution, and the fourth generation on alienation, acceleration and '
      + 'critique as a practice.</p>'],
    [['habermas-public-sphere.geocities.ws', 'Jürgen Habermas'],
     ['habermas-communicative-action.geocities.ws', 'The Theory of Communicative Action'],
     ['habermas-postnational.geocities.ws', 'Habermas — the postnational'],
     ['negt-kluge-public.geocities.ws', 'Negt &amp; Kluge'],
     ['honneth-recognition.geocities.ws', 'Axel Honneth'],
     ['fraser-redistribution.geocities.ws', 'Nancy Fraser'],
     ['benhabib-situating.geocities.ws', 'Seyla Benhabib'],
     ['jaeggi-forms-of-life.geocities.ws', 'Rahel Jaeggi'],
     ['rosa-resonance.geocities.ws', 'Hartmut Rosa'],
     ['celikates-critique.geocities.ws', 'Robin Celikates'],
     ['critical-theory-and-the-digital.geocities.ws', 'Critical Theory and the Digital']],
    [R.main]),
];
