// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PHILOSOPHY WEBRINGS, Heraclitus to the living.
//
// The master directory is philosophy-ring.geocities.ws (kept elsewhere). These
// are the period rings a walker follows through it: antiquity, the schools, the
// early moderns, the idealists, the nineteenth-century turn, phenomenology, the
// analytic line, and the continental one. Names cross the rings on purpose:
// Kant sits in the early moderns and the idealists, Nietzsche in the idealists
// and the nineteenth century, Frege in the nineteenth century and the analytic.

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
    'the ringmaster keeps a commonplace book and adds to it slowly.</small></p>',
    '<p><small>[ <a href="philosophy-ring.geocities.ws">back to the Philosophy Ring</a> ]</small></p>',
  ],
});

const R = {
  ancient: ['ancient-philosophy-ring.geocities.ws', 'Ancient Philosophy Ring'],
  medieval: ['medieval-philosophy-ring.geocities.ws', 'Medieval Philosophy Ring'],
  earlymod: ['early-modern-philosophy-ring.geocities.ws', 'Early Modern Philosophy Ring'],
  idealism: ['german-idealism-ring.geocities.ws', 'German Idealism Ring'],
  nineteenth: ['nineteenth-century-philosophy-ring.geocities.ws', 'Nineteenth Century Ring'],
  phenom: ['phenomenology-ring.geocities.ws', 'Phenomenology &amp; Existentialism Ring'],
  analytic: ['analytic-philosophy-ring.geocities.ws', 'Analytic Philosophy Ring'],
  continental: ['continental-philosophy-ring.geocities.ws', 'Continental Philosophy Ring'],
  // sister rings kept in other files (they exist in the archive):
  mediatheory: ['mediatheory-ring.geocities.ws', 'Media Theory Ring'],
  machineq: ['machine-question-ring.geocities.ws', 'The Machine Question'],
  frankfurt: ['frankfurt-school-ring.geocities.ws', 'Frankfurt School Ring'],
};

export const PHIL_RINGS = [
  ring(R.ancient[0], 'ANCIENT PHILOSOPHY RING', 'Ancient Philosophy Ring', 'antiquity',
    ['<p>From the river of Heraclitus to the Garden of Epicurus and the Porch of the '
      + 'Stoics. The Greeks who asked the first questions, and the schools that carried '
      + 'them into the Roman world.</p>'],
    [['heraclitus.geocities.ws', 'Heraclitus'],
     ['parmenides.geocities.ws', 'Parmenides'],
     ['socrates.geocities.ws', 'Socrates'],
     ['plato.geocities.ws', 'Plato'],
     ['aristotle.geocities.ws', 'Aristotle'],
     ['epicurus.geocities.ws', 'Epicurus'],
     ['the-stoics.geocities.ws', 'The Stoics'],
     ['plotinus.geocities.ws', 'Plotinus']],
    [R.medieval, R.idealism]),

  ring(R.medieval[0], 'MEDIEVAL PHILOSOPHY RING', 'Medieval Philosophy Ring', 'scholastic',
    ['<p>Athens meets Jerusalem, Baghdad and Cordoba. Faith looking for reason and '
      + 'reason looking for faith, from Augustine to Ockham, by way of Avicenna and '
      + 'Averroes and Maimonides.</p>'],
    [['augustine.geocities.ws', 'Augustine of Hippo'],
     ['boethius.geocities.ws', 'Boethius'],
     ['avicenna.geocities.ws', 'Avicenna (Ibn Sina)'],
     ['averroes.geocities.ws', 'Averroes (Ibn Rushd)'],
     ['maimonides.geocities.ws', 'Maimonides'],
     ['aquinas.geocities.ws', 'Thomas Aquinas'],
     ['duns-scotus.geocities.ws', 'Duns Scotus'],
     ['william-of-ockham.geocities.ws', 'William of Ockham']],
    [R.ancient, R.earlymod]),

  ring(R.earlymod[0], 'EARLY MODERN PHILOSOPHY RING', 'Early Modern Philosophy Ring', 'earlymodern',
    ['<p>The break with the schools. Method and doubt, substance and monads, the mind '
      + 'as a blank page and the world as perception. Machiavelli and Montaigne open the '
      + 'door; Hume walks through it to Kant.</p>'],
    [['machiavelli.geocities.ws', 'Machiavelli'],
     ['montaigne.geocities.ws', 'Montaigne'],
     ['descartes.geocities.ws', 'Descartes'],
     ['spinoza.geocities.ws', 'Spinoza'],
     ['leibniz.geocities.ws', 'Leibniz'],
     ['locke.geocities.ws', 'John Locke'],
     ['berkeley.geocities.ws', 'George Berkeley'],
     ['hume.geocities.ws', 'David Hume'],
     ['kant.geocities.ws', 'Immanuel Kant']],
    [R.medieval, R.idealism]),

  ring(R.idealism[0], 'GERMAN IDEALISM RING', 'German Idealism Ring', 'enlightenment',
    ['<p>After Kant woke from his dogmatic slumber, the I that posits itself, the '
      + 'dialectic that moves through history, the Absolute, and the Will that Schopenhauer '
      + 'set under all of it. The road that runs on to Nietzsche.</p>'],
    [['kant.geocities.ws', 'Immanuel Kant'],
     ['rousseau.geocities.ws', 'Rousseau'],
     ['fichte.geocities.ws', 'Fichte'],
     ['hegel.geocities.ws', 'Hegel'],
     ['schelling.geocities.ws', 'Schelling'],
     ['schopenhauer.geocities.ws', 'Schopenhauer'],
     ['nietzsche.geocities.ws', 'Nietzsche']],
    [R.earlymod, R.nineteenth]),

  ring(R.nineteenth[0], 'NINETEENTH CENTURY RING', 'Nineteenth Century Ring', 'nineteenth',
    ['<p>The century that broke the system. The single one against the crowd, the death '
      + 'of God, pragmatism in America, duration in Paris, and Frege quietly inventing the '
      + 'logic the next century would argue in.</p>'],
    [['kierkegaard.geocities.ws', 'Kierkegaard'],
     ['nietzsche.geocities.ws', 'Nietzsche'],
     ['peirce.geocities.ws', 'C. S. Peirce'],
     ['william-james.geocities.ws', 'William James'],
     ['bergson.geocities.ws', 'Henri Bergson'],
     ['frege.geocities.ws', 'Gottlob Frege']],
    [R.idealism, R.analytic, R.phenom]),

  ring(R.phenom[0], 'PHENOMENOLOGY AND EXISTENTIALISM RING', 'Phenomenology &amp; Existentialism Ring', 'twentieth',
    ['<p>To the things themselves, and then to the life we actually live: the bracketed '
      + 'world, the lived body, radical freedom and bad faith, and the woman one is not '
      + 'born but becomes.</p>'],
    [['husserl.geocities.ws', 'Edmund Husserl'],
     ['sartre.geocities.ws', 'Jean-Paul Sartre'],
     ['de-beauvoir.geocities.ws', 'Simone de Beauvoir'],
     ['merleau-ponty.geocities.ws', 'Merleau-Ponty'],
     ['kierkegaard.geocities.ws', 'Kierkegaard'],
     ['bergson.geocities.ws', 'Henri Bergson']],
    [R.nineteenth, R.continental]),

  ring(R.analytic[0], 'ANALYTIC PHILOSOPHY RING', 'Analytic Philosophy Ring', 'twentieth',
    ['<p>Begin with the sentence. Sense and reference, descriptions and atoms, the '
      + 'picture and then the language-game, falsifiability, and the web of belief with no '
      + 'fixed centre.</p>'],
    [['frege.geocities.ws', 'Gottlob Frege'],
     ['russell.geocities.ws', 'Bertrand Russell'],
     ['wittgenstein.geocities.ws', 'Wittgenstein'],
     ['popper.geocities.ws', 'Karl Popper'],
     ['quine.geocities.ws', 'W. V. O. Quine']],
    [R.nineteenth, R.continental]),

  ring(R.continental[0], 'CONTINENTAL PHILOSOPHY RING', 'Continental Philosophy Ring', 'contemporary',
    ['<p>The other line out of phenomenology: power and discipline, the trace and '
      + 'différance, communicative reason, and the capabilities a good life needs. It '
      + 'runs on into the media theorists and the Frankfurt School next door.</p>'],
    [['foucault.geocities.ws', 'Michel Foucault'],
     ['derrida.geocities.ws', 'Jacques Derrida'],
     ['habermas.geocities.ws', 'Jürgen Habermas'],
     ['nussbaum.geocities.ws', 'Martha Nussbaum'],
     ['de-beauvoir.geocities.ws', 'Simone de Beauvoir']],
    [R.phenom, R.mediatheory, R.frankfurt, R.machineq]),
];
