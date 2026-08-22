// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE WEBRINGS.
//
// Overlapping rings that tie the tribute and fan pages together, the way the
// old web bound its enthusiasms: a strip of navigation at the foot of a page,
// « prev · random · next », that let a reader fall from one obsessive site into
// the next without ever using a search box. A page belongs to more than one
// ring, so the rings cross, and following any of them for long enough brings
// you round the whole field.

const ring = (domain, name, title, bg, blurb, members) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · sites join by adding the navigation strip · '
      + 'the ring is walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b> (in no order; the ring has no centre):</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'to join, mail the ringmaster. the ringmaster has not answered in a while.'
      + '</small></p>',
  ],
});

export const THINKER_RINGS = [
  ring('cyberfeminist-ring.geocities.ws', 'CYBERFEMINIST RING',
    'The CyberFeminist Web-Ring', 'cyberfem',
    ['<p>For sites on women, gender, feminism and the machine. The name was in '
      + 'the air by 1991 and nobody owns it, which is the point. Some here would '
      + 'call themselves cyberfeminist and some would not; the argument about '
      + 'what the word means is half the reason to read them.</p>'],
    [['cyborgmanifesto.geocities.ws', 'Haraway — A Cyborg Manifesto'],
     ['zerosandones.geocities.ws', 'Sadie Plant — Zeros and Ones'],
     ['vnsmatrix.geocities.ws', 'VNS Matrix'],
     ['oldboysnetwork.geocities.ws', 'Old Boys Network'],
     ['faithwilding.geocities.ws', 'Faith Wilding'],
     ['sandystone-virtual.geocities.ws', 'Sandy Stone'],
     ['turkle-secondself.geocities.ws', 'Sherry Turkle'],
     ['gendered-body.geocities.ws', 'Anne Balsamo'],
     ['feminism-confronts-tech.geocities.ws', 'Judy Wajcman'],
     ['machinery-of-dominance.geocities.ws', 'Cynthia Cockburn'],
     ['more-work-for-mother.geocities.ws', 'Ruth Schwartz Cowan'],
     ['feeling-for-the-organism.geocities.ws', 'Evelyn Fox Keller'],
     ['standpoint-theory.geocities.ws', 'Sandra Harding'],
     ['nomadic-subject.geocities.ws', 'Rosi Braidotti'],
     ['cybertypes.geocities.ws', 'Lisa Nakamura']]),

  ring('womenincomputing-ring.geocities.ws', 'WOMEN IN COMPUTING RING',
    'Women in Computing', 'womencomp',
    ['<p>The ones who were there, and mostly written out of the histories that '
      + 'got printed. Programmers, engineers, the people who wrote the compiler '
      + 'and drew the protocol. Kept by people who got tired of the word '
      + '"pioneer" only ever landing on men.</p>'],
    [['ada-lovelace.geocities.ws', 'Ada Lovelace'],
     ['amazing-grace.geocities.ws', 'Grace Hopper'],
     ['sparckjones-idf.geocities.ws', 'Karen Spärck Jones'],
     ['radia-perlman.geocities.ws', 'Radia Perlman'],
     ['close-to-the-machine.geocities.ws', 'Ellen Ullman'],
     ['floyd-softwaredev.geocities.ws', 'Christiane Floyd'],
     ['moose-crossing.geocities.ws', 'Amy Bruckman'],
     ['computers-as-theatre.geocities.ws', 'Brenda Laurel'],
     ['zerosandones.geocities.ws', 'Sadie Plant']]),

  ring('machine-question-ring.geocities.ws', 'MACHINE QUESTION RING',
    'The Machine Question', 'machineq',
    ['<p>Philosophy of technology, from the first person to use the phrase to '
      + 'the last person to lose sleep over it. Does the machine have a nature? '
      + 'Does the artefact have a politics? Is the question even answerable? '
      + 'These sites think it is worth asking anyway.</p>'],
    [['organ-projection.geocities.ws', 'Ernst Kapp'],
     ['darwin-among-machines.geocities.ws', 'Samuel Butler'],
     ['fragment-on-machines.geocities.ws', 'Marx — the Fragment on Machines'],
     ['enframing.geocities.ws', 'Heidegger'],
     ['obsolescence-of-man.geocities.ws', 'Günther Anders'],
     ['vita-activa.geocities.ws', 'Hannah Arendt'],
     ['one-dimensional.geocities.ws', 'Herbert Marcuse'],
     ['la-technique.geocities.ws', 'Jacques Ellul'],
     ['tools-for-conviviality.geocities.ws', 'Ivan Illich'],
     ['do-artifacts.geocities.ws', 'Langdon Winner'],
     ['never-been-modern.geocities.ws', 'Bruno Latour'],
     ['democratic-rationalization.geocities.ws', 'Andrew Feenberg'],
     ['cosmopolitics.geocities.ws', 'Isabelle Stengers'],
     ['agential-realism.geocities.ws', 'Karen Barad'],
     ['societies-of-control.geocities.ws', 'Deleuze'],
     ['human-use.geocities.ws', 'Norbert Wiener'],
     ['ada-lovelace.geocities.ws', 'Ada Lovelace']]),

  // The big one. A directory ring rather than a tight themed loop: lots of
  // topics, lots of philosophers, grouped by the corner of the field they work
  // in, so a reader with no map can still find a way in. Hand-built rather than
  // through ring() because it carries a topics list the helper has no slot for.
  {
    domain: 'philosophy-ring.geocities.ws',
    name: 'PHILOSOPHY RING',
    title: 'The Philosophy Web-Ring',
    body: [
      '<!--bg:machineq-->',
      '<h1>The Philosophy Web-Ring</h1>',
      '<p><small>a webring &middot; a page joins by adding the strip &middot; walked, not searched</small></p>',
      '<hr>',
      '<p>Two and a half thousand years of people asking what there is, how we know '
        + 'it, and what we should do about it. The topic pages are still going up '
        + '(Athens is a big neighbourhood); the philosophers below already have '
        + 'homes on the web. Follow any of them and the ring hands you to the next.</p>',
      '<h2>Topics</h2>',
      '<p>metaphysics &middot; epistemology &middot; ethics &middot; logic &middot; '
        + 'aesthetics &middot; philosophy of mind &middot; philosophy of language &middot; '
        + 'philosophy of science &middot; philosophy of technology &middot; political '
        + 'philosophy &middot; phenomenology &middot; existentialism &middot; '
        + 'pragmatism &middot; the analytic tradition &middot; critical theory &middot; '
        + 'philosophy of computation &middot; the ethics of AI &middot; free will &middot; '
        + 'consciousness &middot; the mind-body problem &middot; time &middot; '
        + 'causation &middot; personal identity &middot; the good life</p>',
      '<p><small>topic pages under construction. best viewed at 800x600.</small></p>',
      '<hr>',
      '<p><b>Philosophy of technology</b></p>',
      '<ul>',
      '<li><a href="organ-projection.geocities.ws">Ernst Kapp</a> &middot; '
        + '<a href="darwin-among-machines.geocities.ws">Samuel Butler</a> &middot; '
        + '<a href="fragment-on-machines.geocities.ws">Marx, the Fragment on Machines</a> &middot; '
        + '<a href="enframing.geocities.ws">Heidegger</a> &middot; '
        + '<a href="obsolescence-of-man.geocities.ws">G&uuml;nther Anders</a></li>',
      '<li><a href="la-technique.geocities.ws">Jacques Ellul</a> &middot; '
        + '<a href="tools-for-conviviality.geocities.ws">Ivan Illich</a> &middot; '
        + '<a href="do-artifacts.geocities.ws">Langdon Winner</a> &middot; '
        + '<a href="never-been-modern.geocities.ws">Bruno Latour</a> &middot; '
        + '<a href="democratic-rationalization.geocities.ws">Andrew Feenberg</a></li>',
      '<li><a href="cosmopolitics.geocities.ws">Isabelle Stengers</a> &middot; '
        + '<a href="agential-realism.geocities.ws">Karen Barad</a> &middot; '
        + '<a href="societies-of-control.geocities.ws">Gilles Deleuze</a> &middot; '
        + '<a href="human-use.geocities.ws">Norbert Wiener</a> &middot; '
        + '<a href="cosmotechnics.geocities.ws">Yuk Hui</a></li>',
      '</ul>',
      '<p><b>Critical theory &amp; political philosophy</b></p>',
      '<ul>',
      '<li><a href="adorno-negative-dialectics.geocities.ws">Adorno</a> &middot; '
        + '<a href="horkheimer-critical-theory.geocities.ws">Horkheimer</a> &middot; '
        + '<a href="benjamin-arcades.geocities.ws">Walter Benjamin</a> &middot; '
        + '<a href="one-dimensional.geocities.ws">Marcuse</a> &middot; '
        + '<a href="bloch-principle-hope.geocities.ws">Ernst Bloch</a></li>',
      '<li><a href="lukacs-reification.geocities.ws">Luk&aacute;cs</a> &middot; '
        + '<a href="korsch-marxism.geocities.ws">Karl Korsch</a> &middot; '
        + '<a href="sohn-rethel-abstraction.geocities.ws">Sohn-Rethel</a> &middot; '
        + '<a href="vita-activa.geocities.ws">Hannah Arendt</a></li>',
      '<li><a href="habermas-public-sphere.geocities.ws">Habermas</a> &middot; '
        + '<a href="honneth-recognition.geocities.ws">Honneth</a> &middot; '
        + '<a href="fraser-redistribution.geocities.ws">Nancy Fraser</a> &middot; '
        + '<a href="benhabib-situating.geocities.ws">Seyla Benhabib</a> &middot; '
        + '<a href="jaeggi-forms-of-life.geocities.ws">Rahel Jaeggi</a> &middot; '
        + '<a href="rosa-resonance.geocities.ws">Hartmut Rosa</a></li>',
      '<li><a href="menke-force.geocities.ws">Christoph Menke</a> &middot; '
        + '<a href="wellmer-modernism.geocities.ws">Albrecht Wellmer</a> &middot; '
        + '<a href="necropolitics.geocities.ws">Achille Mbembe</a></li>',
      '</ul>',
      '<p><b>Mind, media &amp; computation</b></p>',
      '<ul>',
      '<li><a href="chinese-room.geocities.ws">Searle, the Chinese Room</a> &middot; '
        + '<a href="posthuman-hayles.geocities.ws">N. Katherine Hayles</a> &middot; '
        + '<a href="technical-image.geocities.ws">Vil&eacute;m Flusser</a> &middot; '
        + '<a href="desert-of-the-real.geocities.ws">Baudrillard</a></li>',
      '<li><a href="messenger.geocities.ws">Sybille Kr&auml;mer</a> &middot; '
        + '<a href="mediology.geocities.ws">R&eacute;gis Debray</a> &middot; '
        + '<a href="contingent-computation.geocities.ws">Beatrice Fazi</a> &middot; '
        + '<a href="contagious-architecture.geocities.ws">Luciana Parisi</a> &middot; '
        + '<a href="the-computational.geocities.ws">Ranjodh Singh Dhaliwal</a></li>',
      '</ul>',
      '<hr>',
      '<p><b>The canon, by period</b> (each name a home page; the period rings walk them in order)</p>',
      '<p><b>Ancient</b>: <a href="heraclitus.geocities.ws">Heraclitus</a> &middot; '
        + '<a href="parmenides.geocities.ws">Parmenides</a> &middot; '
        + '<a href="socrates.geocities.ws">Socrates</a> &middot; '
        + '<a href="plato.geocities.ws">Plato</a> &middot; '
        + '<a href="aristotle.geocities.ws">Aristotle</a> &middot; '
        + '<a href="epicurus.geocities.ws">Epicurus</a> &middot; '
        + '<a href="the-stoics.geocities.ws">the Stoics</a> &middot; '
        + '<a href="plotinus.geocities.ws">Plotinus</a></p>',
      '<p><b>Medieval</b>: <a href="augustine.geocities.ws">Augustine</a> &middot; '
        + '<a href="boethius.geocities.ws">Boethius</a> &middot; '
        + '<a href="avicenna.geocities.ws">Avicenna</a> &middot; '
        + '<a href="averroes.geocities.ws">Averroes</a> &middot; '
        + '<a href="maimonides.geocities.ws">Maimonides</a> &middot; '
        + '<a href="aquinas.geocities.ws">Aquinas</a> &middot; '
        + '<a href="duns-scotus.geocities.ws">Duns Scotus</a> &middot; '
        + '<a href="william-of-ockham.geocities.ws">Ockham</a></p>',
      '<p><b>Early modern</b>: <a href="machiavelli.geocities.ws">Machiavelli</a> &middot; '
        + '<a href="montaigne.geocities.ws">Montaigne</a> &middot; '
        + '<a href="descartes.geocities.ws">Descartes</a> &middot; '
        + '<a href="spinoza.geocities.ws">Spinoza</a> &middot; '
        + '<a href="leibniz.geocities.ws">Leibniz</a> &middot; '
        + '<a href="locke.geocities.ws">Locke</a> &middot; '
        + '<a href="berkeley.geocities.ws">Berkeley</a> &middot; '
        + '<a href="hume.geocities.ws">Hume</a></p>',
      '<p><b>Enlightenment &amp; Idealism</b>: <a href="rousseau.geocities.ws">Rousseau</a> &middot; '
        + '<a href="kant.geocities.ws">Kant</a> &middot; '
        + '<a href="fichte.geocities.ws">Fichte</a> &middot; '
        + '<a href="hegel.geocities.ws">Hegel</a> &middot; '
        + '<a href="schelling.geocities.ws">Schelling</a> &middot; '
        + '<a href="schopenhauer.geocities.ws">Schopenhauer</a></p>',
      '<p><b>The nineteenth century</b>: <a href="kierkegaard.geocities.ws">Kierkegaard</a> &middot; '
        + '<a href="nietzsche.geocities.ws">Nietzsche</a> &middot; '
        + '<a href="peirce.geocities.ws">Peirce</a> &middot; '
        + '<a href="william-james.geocities.ws">William James</a> &middot; '
        + '<a href="bergson.geocities.ws">Bergson</a> &middot; '
        + '<a href="frege.geocities.ws">Frege</a></p>',
      '<p><b>Phenomenology &amp; existentialism</b>: <a href="husserl.geocities.ws">Husserl</a> &middot; '
        + '<a href="sartre.geocities.ws">Sartre</a> &middot; '
        + '<a href="de-beauvoir.geocities.ws">de Beauvoir</a> &middot; '
        + '<a href="merleau-ponty.geocities.ws">Merleau-Ponty</a></p>',
      '<p><b>The analytic line</b>: <a href="russell.geocities.ws">Russell</a> &middot; '
        + '<a href="wittgenstein.geocities.ws">Wittgenstein</a> &middot; '
        + '<a href="popper.geocities.ws">Popper</a> &middot; '
        + '<a href="quine.geocities.ws">Quine</a></p>',
      '<p><b>The continental line</b>: <a href="foucault.geocities.ws">Foucault</a> &middot; '
        + '<a href="derrida.geocities.ws">Derrida</a> &middot; '
        + '<a href="habermas.geocities.ws">Habermas</a> &middot; '
        + '<a href="nussbaum.geocities.ws">Nussbaum</a></p>',
      '<p><small>rings by period: '
        + '<a href="ancient-philosophy-ring.geocities.ws">Ancient</a> &middot; '
        + '<a href="medieval-philosophy-ring.geocities.ws">Medieval</a> &middot; '
        + '<a href="early-modern-philosophy-ring.geocities.ws">Early Modern</a> &middot; '
        + '<a href="german-idealism-ring.geocities.ws">German Idealism</a> &middot; '
        + '<a href="nineteenth-century-philosophy-ring.geocities.ws">19th Century</a> &middot; '
        + '<a href="phenomenology-ring.geocities.ws">Phenomenology</a> &middot; '
        + '<a href="analytic-philosophy-ring.geocities.ws">Analytic</a> &middot; '
        + '<a href="continental-philosophy-ring.geocities.ws">Continental</a></small></p>',
      '<hr>',
      '<p><small>sister rings: '
        + '<a href="machine-question-ring.geocities.ws">The Machine Question</a> &middot; '
        + '<a href="frankfurt-school-ring.geocities.ws">Frankfurt School</a> &middot; '
        + '<a href="mediatheory-ring.geocities.ws">Media Theory</a></small></p>',
      '<hr>',
      '<p><small>&laquo; prev &middot; <a href="enframing.geocities.ws">random</a> &middot; next &raquo;<br>',
      'ringmaster is thinking it over. the ring turns anyway.</small></p>',
    ],
  },

  ring('mediatheory-ring.geocities.ws', 'MEDIA THEORY RING',
    'Media Theory Ring', 'mediatheory',
    ['<p>The medium, the message, and the argument about which one matters. '
      + 'Sites on media, information and the hardware underneath. Runs hot.</p>'],
    [['cultureindustry.geocities.ws', 'Adorno &amp; Horkheimer'],
      ['cloud-ethics.geocities.ws', 'Louise Amoore'],
      ['desert-of-the-real.geocities.ws', 'Baudrillard'],
      ['aura.geocities.ws', 'Walter Benjamin'],
      ['the-philosophy-of-software.geocities.ws', 'David M. Berry'],
      ['control-and-freedom.geocities.ws', 'Wendy Chun'],
      ['data-colonialism.geocities.ws', 'Nick Couldry'],
      ['techniques-of-observer.geocities.ws', 'Jonathan Crary'],
      ['mediology.geocities.ws', 'Régis Debray'],
      ['the-computational.geocities.ws', 'Ranjodh Singh Dhaliwal'],
      ['chronopoetics.geocities.ws', 'Wolfgang Ernst'],
      ['contingent-computation.geocities.ws', 'Beatrice Fazi'],
      ['technical-image.geocities.ws', 'Vilém Flusser'],
      ['software-studies.geocities.ws', 'Matthew Fuller'],
      ['protocol-galloway.geocities.ws', 'Alexander Galloway'],
      ['always-already-new.geocities.ws', 'Lisa Gitelman'],
      ['encoding-decoding.geocities.ws', 'Stuart Hall'],
      ['beautiful-data.geocities.ws', 'Orit Halpern'],
      ['feed-forward.geocities.ws', 'Mark B. N. Hansen'],
      ['posthuman-hayles.geocities.ws', 'N. Katherine Hayles'],
      ['prehistory-of-the-cloud.geocities.ws', 'Tung-Hui Hu'],
      ['cosmotechnics.geocities.ws', 'Yuk Hui'],
      ['distant-viewing.geocities.ws', 'Leonardo Impett'],
      ['bias-of-communication.geocities.ws', 'Harold Innis'],
      ['theres-no-software.geocities.ws', 'Friedrich Kittler'],
      ['messenger.geocities.ws', 'Sybille Krämer'],
      ['net-criticism.geocities.ws', 'Geert Lovink'],
      ['language-of-new-media.geocities.ws', 'Lev Manovich'],
      ['code-and-clay.geocities.ws', 'Shannon Mattern'],
      ['necropolitics.geocities.ws', 'Achille Mbembe'],
      ['the-medium-is.geocities.ws', 'Marshall McLuhan'],
      ['no-sense-of-place.geocities.ws', 'Joshua Meyrowitz'],
      ['xanadu-now.geocities.ws', 'Ted Nelson'],
      ['algorithms-of-oppression.geocities.ws', 'Safiya Umoja Noble'],
      ['latent-space.geocities.ws', 'Fabian Offert'],
      ['geology-of-media.geocities.ws', 'Jussi Parikka'],
      ['contagious-architecture.geocities.ws', 'Luciana Parisi'],
      ['eye-of-the-master.geocities.ws', 'Matteo Pasquinelli'],
      ['marvelous-clouds.geocities.ws', 'John Durham Peters'],
      ['in-the-meantime.geocities.ws', 'Sarah Sharma'],
      ['mediapolis.geocities.ws', 'Roger Silverstone'],
      ['sparckjones-idf.geocities.ws', 'Karen Spärck Jones'],
      ['dromology.geocities.ws', 'Paul Virilio'],
      ['hacker-manifesto.geocities.ws', 'McKenzie Wark'],
      ['human-use.geocities.ws', 'Norbert Wiener'],
      ['structures-of-feeling.geocities.ws', 'Raymond Williams'],
      ['deep-time-of-media.geocities.ws', 'Siegfried Zielinski']]),

  ring('codestudies-ring.geocities.ws', 'CODE STUDIES RING',
    'Critical Code &amp; Software Studies', 'codeterm',
    ['<p>For reading code as writing: its comments, its names, its history, the '
      + 'culture that runs through it. Software is not neutral and it is not '
      + 'invisible if you look. A small ring, and a new one.</p>'],
    [['critical-code.geocities.ws', 'Mark Marino — Critical Code Studies'],
     ['software-studies.geocities.ws', 'Matthew Fuller — Software Studies'],
     ['the-philosophy-of-software.geocities.ws', 'David M. Berry — The Philosophy of Software'],
     ['protocol-galloway.geocities.ws', 'Alexander Galloway — Protocol'],
     ['control-and-freedom.geocities.ws', 'Wendy Chun'],
     ['theres-no-software.geocities.ws', 'Kittler — There Is No Software'],
     ['close-to-the-machine.geocities.ws', 'Ellen Ullman'],
     ['situated-actions.geocities.ws', 'Lucy Suchman'],
     ['boundary-objects.geocities.ws', 'Susan Leigh Star'],
     ['floyd-softwaredev.geocities.ws', 'Christiane Floyd'],
     ['democratic-rationalization.geocities.ws', 'Andrew Feenberg'],
     ['the-computational.geocities.ws', 'Ranjodh Singh Dhaliwal'],
     ['xanadu-now.geocities.ws', 'Ted Nelson']]),

  ring('digital-humanities-ring.geocities.ws', 'DIGITAL HUMANITIES RING',
    'The Digital Humanities Ring', 'mediatheory',
    ['<p>Reading, counting and modelling the human record with a machine, and '
      + 'arguing about whether that is a method or a mistake. Cultural analytics, '
      + 'distant reading, text encoding, computational criticism, and the long '
      + 'question of what the humanities become once the computer is in the room.</p>'],
    [['the-philosophy-of-software.geocities.ws', 'David M. Berry — Digital Humanities'],
     ['language-of-new-media.geocities.ws', 'Lev Manovich — cultural analytics'],
     ['software-studies.geocities.ws', 'Matthew Fuller — software studies'],
     ['distant-viewing.geocities.ws', 'Leonardo Impett — computational art history'],
     ['latent-space.geocities.ws', 'Fabian Offert — machine vision'],
     ['code-and-clay.geocities.ws', 'Shannon Mattern — urban media'],
     ['geology-of-media.geocities.ws', 'Jussi Parikka — media archaeology'],
     ['always-already-new.geocities.ws', 'Lisa Gitelman — media history &amp; data'],
     ['critical-code.geocities.ws', 'Mark Marino — critical code studies'],
     ['the-computational.geocities.ws', 'Ranjodh Singh Dhaliwal — computation as culture'],
     ['roberto-busa.geocities.ws', 'Roberto Busa — the Index Thomisticus'],
     ['susan-hockey.geocities.ws', 'Susan Hockey — humanities computing'],
     ['john-unsworth.geocities.ws', 'John Unsworth — scholarly primitives'],
     ['willard-mccarty.geocities.ws', 'Willard McCarty — modelling'],
     ['jerome-mcgann.geocities.ws', 'Jerome McGann — the Rossetti Archive'],
     ['the-tei.geocities.ws', 'The Text Encoding Initiative'],
     ['julia-flanders.geocities.ws', 'Julia Flanders — the edition as data'],
     ['matthew-kirschenbaum.geocities.ws', 'Matthew Kirschenbaum — Mechanisms'],
     ['kathleen-fitzpatrick.geocities.ws', 'Kathleen Fitzpatrick — Planned Obsolescence'],
     ['bethany-nowviskie.geocities.ws', 'Bethany Nowviskie — speculative collections'],
     ['franco-moretti.geocities.ws', 'Franco Moretti — distant reading'],
     ['ted-underwood.geocities.ws', 'Ted Underwood — Distant Horizons'],
     ['andrew-piper.geocities.ws', 'Andrew Piper — Enumerations'],
     ['katherine-bode.geocities.ws', 'Katherine Bode — A World of Fiction'],
     ['matthew-jockers.geocities.ws', 'Matthew Jockers — Macroanalysis'],
     ['lev-manovich.geocities.ws', 'Lev Manovich — cultural analytics'],
     ['johanna-drucker.geocities.ws', 'Johanna Drucker — Graphesis'],
     ['tara-mcpherson.geocities.ws', 'Tara McPherson — Vectors'],
     ['alan-liu.geocities.ws', 'Alan Liu — the Voice of the Shuttle'],
     ['stephen-ramsay.geocities.ws', 'Stephen Ramsay — algorithmic criticism'],
     ['voyant-tools.geocities.ws', 'Voyant Tools'],
     ['miriam-posner.geocities.ws', 'Miriam Posner — DH pedagogy'],
     ['ryan-cordell.geocities.ws', 'Ryan Cordell — Viral Texts'],
     ['the-programming-historian.geocities.ws', 'The Programming Historian'],
     ['minimal-computing.geocities.ws', 'Minimal Computing (GO::DH)'],
     ['the-dark-side-of-dh.geocities.ws', 'The dark side of DH'],
     ['postcolonial-dh.geocities.ws', 'Postcolonial DH'],
     ['global-outlook-dh.geocities.ws', 'Global Outlook::DH'],
     ['debates-in-dh.geocities.ws', 'Debates in the Digital Humanities'],
     ['whatisdh.geocities.ws', 'What is DH?'],
     ['dh-foundations-ring.geocities.ws', 'strand: DH Foundations Ring'],
     ['dh-distant-reading-ring.geocities.ws', 'strand: Distant Reading Ring'],
     ['dh-media-ring.geocities.ws', 'strand: DH Media &amp; Interface Ring'],
     ['dh-tools-ring.geocities.ws', 'strand: DH Tools &amp; Method Ring'],
     ['dh-critique-ring.geocities.ws', 'strand: DH Critique Ring']]),

  ring('simcontrol-ring.geocities.ws', 'SIMULATION AND CONTROL RING',
    'Simulation &amp; Control', 'simnoir',
    ['<p>Speed, simulation, protocol, the society of control. What power looks '
      + 'like once it stops enclosing you and starts modulating you instead. '
      + 'Read after dark.</p>'],
    [['societies-of-control.geocities.ws', 'Deleuze — Postscript'],
     ['protocol-galloway.geocities.ws', 'Galloway — Protocol'],
     ['control-and-freedom.geocities.ws', 'Wendy Chun'],
     ['desert-of-the-real.geocities.ws', 'Baudrillard'],
     ['dromology.geocities.ws', 'Virilio']]),

  ring('ainarratives-ring.geocities.ws', 'AI NARRATIVES RING',
    'AI, Conversation &amp; Narrative', 'ainarr',
    ['<p>On the stories we tell about thinking machines, and the machines we '
      + 'built to hold up a conversation. From the first program that turned '
      + 'your words back into questions to the arguments about what it meant.</p>'],
    [['ai-narratives.geocities.ws', 'Sarah Dillon — AI Narratives'],
     ['roach-machine-talk.geocities.ws', 'Rebecca Roach'],
     ['situated-actions.geocities.ws', 'Lucy Suchman'],
     ['turkle-secondself.geocities.ws', 'Sherry Turkle'],
     ['sandystone-virtual.geocities.ws', 'Sandy Stone'],
     ['posthuman-hayles.geocities.ws', 'N. Katherine Hayles'],
     ['hamlet-on-the-holodeck.geocities.ws', 'Janet Murray'],
     ['computers-as-theatre.geocities.ws', 'Brenda Laurel'],
     ['darwin-among-machines.geocities.ws', 'Samuel Butler'],
     ['eliza.geocities.ws', 'ELIZA — the program itself']]),

  ring('techsociety-webring.geocities.ws', 'TECHNOLOGY AND SOCIETY WEBRING',
    'The Technology &amp; Society Webring', 'machineq',
    ['<p>The big ring, the one the others hang off. Anything on technology and '
      + 'the people it is done to or with. The other rings are narrower rooms '
      + 'in the same house:</p>',
     '<ul>',
     '<li><a href="cyberfeminist-ring.geocities.ws">The CyberFeminist Web-Ring</a></li>',
     '<li><a href="womenincomputing-ring.geocities.ws">Women in Computing</a></li>',
     '<li><a href="machine-question-ring.geocities.ws">The Machine Question</a></li>',
     '<li><a href="mediatheory-ring.geocities.ws">Media Theory Ring</a></li>',
     '<li><a href="codestudies-ring.geocities.ws">Critical Code &amp; Software Studies</a></li>',
     '<li><a href="simcontrol-ring.geocities.ws">Simulation &amp; Control</a></li>',
     '<li><a href="ainarratives-ring.geocities.ws">AI, Conversation &amp; Narrative</a></li>',
     '</ul>',
     '<p>A few of the sites, to start you off:</p>'],
    [['cyborgmanifesto.geocities.ws', 'Haraway'],
     ['xanadu-now.geocities.ws', 'Ted Nelson'],
     ['human-use.geocities.ws', 'Norbert Wiener'],
     ['la-technique.geocities.ws', 'Jacques Ellul'],
     ['do-artifacts.geocities.ws', 'Langdon Winner'],
     ['close-to-the-machine.geocities.ws', 'Ellen Ullman'],
     ['ai-narratives.geocities.ws', 'Sarah Dillon'],
     ['coursework.geocities.ws', 'a student’s essays']]),
];
