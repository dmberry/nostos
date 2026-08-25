// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BATCH MYTH_G — the hybrids.
//
// The same classics enthusiast, later, on the creatures made of two things. A
// shrine to the centaurs and the quarrel about what they were for, a page on
// Chiron who is the exception every account has to explain away, a write-up of
// the centauromachy from the temple sculpture, and a piece on how the Greeks
// thought hybrid creatures were assembled as ideas in the first place.
//
// The scholarship is real, including the awkward part: the wild-centaur reading
// everyone repeats is a fifth-century political operation, and Chiron is older
// than it. The hit counters and the arguing in the guestbooks are the fans'.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

// ---- The centaurs: the showpiece --------------------------------------------

const CENTAURS = P('the-centaurs.geocities.ws', 'CENTAURS',
  'THE CENTAURS // horse below, man above, trouble throughout', [
    '<!--bg:myth-greek-->',
    '<h1>THE CENTAURS</h1>',
    '<p><small>a page about the most misread creature in Greek myth, kept by',
    'somebody who got tired of seeing them described as noble. they are mostly',
    'not noble. it is more interesting than that. — Cass</small></p>',
    '<hr>',

    '<p>A centaur is a horse from the withers back and a man from the withers',
    'forward. That is the whole of the design and it is worth pausing on, because',
    'the join is not in a sensible place. The creature has two ribcages. Ancient',
    'art could never quite decide whether the human part ends at the waist or',
    'whether the front legs are a horse\'s or a man\'s, and you can date a vase',
    'roughly by which answer it gives.</p>',

    '<h2>where they come from, which is worse than you remember</h2>',

    '<p>The birth is a punishment story and it is nasty. IXION, king of the',
    'Lapiths, was invited to dine on Olympus after Zeus purified him of a murder,',
    'and repaid it by making a move on Hera. Zeus shaped a cloud into Hera\'s',
    'likeness. The cloud is NEPHELE and she is a real figure with her own name and',
    'her own later story, which people forget. Ixion coupled with the cloud.</p>',

    '<p>Read that again, because it is the part that gets skipped. He did not',
    'seduce Hera. He embraced a convincing copy and never noticed the difference.',
    'What was engendered was Centaurus, who mated with the mares of Magnesia, and',
    'from that came the whole race. Ixion himself went to the wheel that turns',
    'for ever, which is the punishment everybody does remember.</p>',

    '<p>So the centaurs descend from a failure to tell a likeness from the thing',
    'it resembles. I have never seen a mythology handbook make anything of this',
    'and I think it is the best detail in the story. A creature that is two things',
    'badly joined, fathered on an image by a man who could not spot an image.</p>',

    '<p>Source for the aetiology: Apollodorus, <i>Epitome</i> 1.20. Pindar tells',
    'it in <i>Pythian</i> 2 and calls the offspring Ixion\'s once-removed bastards.',
    'The Magnesian mares are Pindar\'s detail.</p>',

    '<h2>what they were for</h2>',

    '<p>In the standard account centaurs are appetite with hooves. They cannot',
    'hold their wine, they cannot keep their hands to themselves, they wreck the',
    'wedding, and the Lapiths have to put them down. That is the CENTAUROMACHY and',
    'it has its own page <a href="the-centauromachy.geocities.ws">here</a>.</p>',

    '<p>The reading everybody repeats is that the centaur stands for the beast in',
    'us, the part that will not be governed, and that the fight is civilisation',
    'against appetite. Which is true of the fifth-century material. My problem is',
    'that people state it as though it were what centaurs ALWAYS meant, and it is',
    'not. See the next section, which is the one I actually wrote this page for.</p>',

    '<h2>the bit the handbooks get wrong</h2>',

    '<p>The wild-centaur reading is datable and it is political. On the Parthenon',
    'metopes (447-438 BCE) and at Olympia (c. 470-457) the centauromachy is doing',
    'the same job as the amazon battles and the giant battles beside it: it is',
    'Athens after the Persian Wars, telling itself what it is by carving what it',
    'is not. The Oxford Classical Dictionary entry is blunt about it. By the fifth',
    'century centaurs, like Amazons, symbolise everything opposed to Greek male',
    'cultural and political dominance, and on the metopes the triumph over Persia',
    'is the subtext.</p>',

    '<p>But there is a Chiron figurine from Lefkandi that is centuries older than',
    'any of that, and the early Geometric bronzes do not read as monsters. The',
    'aristocratic-tutor centaur is not a late softening of a savage type. If',
    'anything it is the other way round. The fifth century is a turn, not a',
    'beginning, and the version we all inherited is the propaganda version.</p>',

    '<p>Which means when somebody tells you the centaur is the ancient symbol of',
    'ungoverned drives, the honest answer is: it became one, in Athens, for a',
    'reason, about four hundred years into its career.</p>',

    '<h2>the women</h2>',

    '<p>Ancient art and text are nearly silent on female centaurs. The first one',
    'named anywhere is HYLONOME, in Ovid, <i>Metamorphoses</i> 12.393 and after,',
    'inside the centauromachy itself. She grooms, she is vain about it in a way',
    'Ovid enjoys describing, she loves Cyllarus, and when he is killed she throws',
    'herself onto the spear that did it. It is a real piece of writing and it sits',
    'in the middle of a massacre.</p>',

    '<hr>',
    '<p><small>see also: <a href="chiron.geocities.ws">chiron</a>, the one who was',
    'not like this &middot; <a href="the-centauromachy.geocities.ws">the',
    'centauromachy</a> &middot; <a href="hybrid-monsters.geocities.ws">hybrid',
    'monsters</a>, on how these things get assembled in the first place</small></p>',
    '<p><small>visitors: 02271 · best viewed at 800x600 · the Nephele section was',
    'rewritten after an argument in the guestbook and the guestbook was right ·',
    'last updated 3 Aug</small></p>',
    '<p><small>[ <a href="mythology-ring.geocities.ws">Mythology Ring</a> ]</small></p>',
  ]);

// ---- Chiron: the exception --------------------------------------------------

const CHIRON = P('chiron.geocities.ws', 'CHIRON',
  'CHIRON // the centaur who taught everybody', [
    '<!--bg:myth-greek-->',
    '<h1>CHIRON</h1>',
    '<p><small>the wise one. every book calls him "the exception" and then moves',
    'on. this page is about why that word is doing so much work. — Cass</small></p>',
    '<hr>',

    '<p>Chiron is a centaur who is nothing like the centaurs. He is just,',
    'learned, and gentle. He is a physician, an astronomer and a musician. He',
    'raised or taught ACHILLES, ASCLEPIUS, JASON and, depending who you read,',
    'half the heroic roster. He lived on Mount Pelion and people sent him their',
    'sons.</p>',

    '<h2>different parents</h2>',

    '<p>He is not descended from Ixion at all. His father is CRONUS, who took the',
    'form of a horse to approach the nymph PHILYRA, and his mother is Philyra. So',
    'he is a Titan\'s son, born before the Olympians settled anything, and he is',
    'related to the rest of the centaurs only by shape.</p>',

    '<p>Which is convenient, and it is worth saying that it is convenient. The',
    'tradition needed the wise centaur to not be one of THOSE centaurs, and gave',
    'him a separate pedigree to make sure of it.</p>',

    '<h2>how you spot him</h2>',

    '<p>In art he is legible before you read the label. He is often given human',
    'forelegs rather than a horse\'s, and he wears a tunic or a cloak. So the good',
    'centaur is drawn as LESS of a centaur, which tells you what the artists',
    'thought the horse part meant.</p>',

    '<h2>the wound</h2>',

    '<p>He was immortal, and it ruined him. Heracles, fighting the other centaurs,',
    'loosed an arrow poisoned with the Hydra\'s blood and it struck Chiron by',
    'accident. The wound could not heal and it could not kill him either. He is',
    'the immortal who cannot die and cannot stop hurting, which is a worse',
    'arrangement than either.</p>',

    '<p>He gave his immortality away. In the usual telling it passes to Prometheus,',
    'and Chiron is allowed to die and is set among the stars, as Sagittarius or as',
    'Centaurus depending on the source. The wise centaur\'s last act is to stop',
    'being one.</p>',

    '<h2>the awkward chronology</h2>',

    '<p>Here is the thing nobody mentions. A Chiron figurine from LEFKANDI is',
    'centuries older than the Parthenon metopes. If the earliest centaur material',
    'we have is the tutor rather than the drunk, then Chiron is not the exception',
    'to an ancient rule. He may be closer to the original, and the wild centaur is',
    'the thing that happened to the figure later, in Athens, for political',
    'reasons.</p>',

    '<p>I am not a scholar and I am not going to pretend the dating settles it.',
    'But "the exception that proves the rule" is a phrase people reach for when',
    'the exception came first.</p>',

    '<hr>',
    '<p><small>see also: <a href="the-centaurs.geocities.ws">the centaurs</a>',
    '&middot; <a href="the-centauromachy.geocities.ws">the centauromachy</a>, the',
    'battle he was not in</small></p>',
    '<p><small>counter: 01188 · best viewed at 800x600 · corrections to the',
    'Lefkandi dating gratefully received, i am working from a library book ·',
    'last updated 29 Jul</small></p>',
    '<p><small>[ <a href="mythology-ring.geocities.ws">Mythology Ring</a> ]</small></p>',
  ]);

// ---- The centauromachy ------------------------------------------------------

const CENTAUROMACHY = P('the-centauromachy.geocities.ws', 'CENTAUROMACHY',
  'THE CENTAUROMACHY // the wedding that went wrong, carved everywhere', [
    '<!--bg:myth-greek-->',
    '<h1>THE CENTAUROMACHY</h1>',
    '<p><small>the fight at the wedding, and why the Athenians could not stop',
    'putting it on buildings. — Cass</small></p>',
    '<hr>',

    '<h2>what happens</h2>',

    '<p>PIRITHOUS, king of the Lapiths, marries HIPPODAMIA. The centaurs are',
    'kin and they are invited. They have never had wine before. Ovid gives the',
    'fullest account, narrated by old Nestor, and he names EURYTUS as the one who',
    'starts it: wildest of the wild centaurs, inflamed at once with envy,',
    'drunkenness and lust, who upsets the tables and drags the bride out by the',
    'hair. Every other centaur takes a woman. The Lapiths fight, Theseus among',
    'them, and it becomes a massacre with furniture.</p>',

    '<p>Ovid, <i>Metamorphoses</i> 12.210-535. It is long, it is extremely violent,',
    'and it is one of the best set-pieces in the poem. It also contains Hylonome,',
    'the first female centaur named anywhere.</p>',

    '<h2>where you can see it</h2>',

    '<p>The Temple of Zeus at OLYMPIA, west pediment, around 470-457 BCE, with',
    'Apollo standing in the middle of the brawl not fighting, just present, which',
    'is the whole point of him.</p>',

    '<p>The PARTHENON south metopes, 447-438 BCE, thirty-two of them, one duel per',
    'panel. Most of the surviving ones are in London. They are the reason everyone',
    'knows this story.</p>',

    '<p>Also the Temple of Apollo at Bassae, and the Hephaisteion, and a great',
    'deal of pottery. It is a stock subject.</p>',

    '<h2>why it is on everything</h2>',

    '<p>Because it is not really about centaurs. On the Parthenon it sits beside',
    'the gods against giants, the Greeks against Amazons and the sack of Troy, and',
    'the four of them are one argument: order against disorder, us against them,',
    'and, since this is Athens in the decades after the Persian Wars, Greece',
    'against Persia. The centaur is the barbarian who cannot hold his drink and',
    'cannot leave the women alone.</p>',

    '<p>Which is a use of a figure, not a fact about it. The centaurs were around',
    'a long time before Athens needed them to mean this, and the earlier material',
    'does not read the same way. See <a href="chiron.geocities.ws">chiron</a> and',
    'the dating problem on that page.</p>',

    '<p>I keep coming back to the fact that the Lapiths invited them. The centaurs',
    'are family. The story is not about repelling an invasion, it is about a',
    'relative disgracing himself at a wedding, and it got promoted into a',
    'civilisational allegory because somebody needed one.</p>',

    '<hr>',
    '<p><small>see also: <a href="the-centaurs.geocities.ws">the centaurs</a>',
    '&middot; <a href="the-trojan-war.geocities.ws">the trojan war</a>, carved on',
    'the same building for the same reason</small></p>',
    '<p><small>visitors: 01605 · best viewed at 800x600 · under construction, the',
    'Bassae frieze deserves its own page · last updated 17 Aug</small></p>',
    '<p><small>[ <a href="mythology-ring.geocities.ws">Mythology Ring</a> ]</small></p>',
  ]);

// ---- Hybrid monsters: how a hybrid is made, as an idea ----------------------

const HYBRIDS = P('hybrid-monsters.geocities.ws', 'HYBRIDS',
  'HYBRID MONSTERS // how the Greeks built a creature out of two others', [
    '<!--bg:myth-greek-->',
    '<h1>HYBRID MONSTERS</h1>',
    '<p><small>centaur, minotaur, chimera, sphinx, siren, harpy, satyr, gorgon,',
    'pegasus, hippocamp. a page about the recipe rather than the creatures.',
    '— Cass</small></p>',
    '<hr>',

    '<p>Greek myth is full of animals with the wrong number of parts and it is',
    'easy to treat this as decoration. It is not. The ancients had a theory about',
    'where such creatures come from, and it is a theory about MINDS rather than',
    'about monsters.</p>',

    '<h2>the recipe</h2>',

    '<p>The Stoics held that every idea we have is built out of perception by one',
    'of a small number of named operations. Diogenes Laertius sets them out at',
    'VII.52-53 and Sextus Empiricus covers the same ground in <i>Against the',
    'Logicians</i> II.60. The operations are roughly: RESEMBLANCE, so you get an',
    'idea of Socrates from his portrait; ANALOGY, enlarging or shrinking, which',
    'gives you giants and pygmies; TRANSPOSITION, moving a part somewhere it does',
    'not belong, which gives you the eye in the chest; CONTRARIETY, which gives',
    'you death from life; and COMPOSITION, in Greek SYNTHESIS, sticking two things',
    'together.</p>',

    '<p>And the standing example of composition, in both sources, is the centaur.',
    'Horse plus man. It is the textbook case of the fifth operation.</p>',

    '<h2>why that matters</h2>',

    '<p>It means the centaur was not simply a story creature. It was the ancient',
    'philosophy classroom\'s worked example of a well-formed idea with nothing',
    'behind it. You can assemble the concept perfectly, from parts you have really',
    'perceived, and there is still no centaur.</p>',

    '<p>That job stuck to it for two thousand years. Locke uses centaurs when he',
    'is explaining how the mind puts ideas together (<i>Essay</i> II.xxx.5, and he',
    'cheerfully describes one with a horse\'s HEAD on a human body, which tells you',
    'how loose the figure always was). Husserl reaches for the centaur when he',
    'wants an object arrived at by varying a concept rather than by meeting it.',
    'Quine opens with it when he asks what we commit ourselves to when we say',
    'there are such things.</p>',

    '<p>Two and a half thousand years of philosophers agreeing that the centaur is',
    'what a coherent nothing looks like.</p>',

    '<h2>the roster</h2>',

    '<p>CHIMERA: lion, goat and serpent, and the only one Homer bothers to describe',
    'as unnatural. MINOTAUR: bull\'s head, man\'s body, and the transposition of the',
    'centaur, which nobody in antiquity seems to find worth remarking on. SPHINX:',
    'lion, wings, woman\'s head, and a riddle about what walks on how many legs,',
    'which is a joke about anatomy in a creature that has the wrong amount of it.',
    'SIRENS: bird and woman, and they were birds long before anyone drew them as',
    'fish. HARPIES: bird and woman again, doing the opposite job. SATYRS: horse or',
    'goat and man, and it depends entirely on the century which. PEGASUS and the',
    'HIPPOCAMP: the horse with the extra part added rather than swapped.</p>',

    '<p>Sort them and a pattern falls out. The ones with the human head are the',
    'ones that get to talk, negotiate and set riddles. The ones with the animal',
    'head get killed by somebody with a sword. The centaur has a human head and',
    'gets both, which may be why it has lasted.</p>',

    '<hr>',
    '<p><small>see also: <a href="the-centaurs.geocities.ws">the centaurs</a>',
    '&middot; <a href="the-greek-gods.geocities.ws">the greek gods</a></small></p>',
    '<p><small>counter: 00847 · best viewed at 800x600 · the Stoic bit came from a',
    'philosophy module and i have probably mangled it · last updated 21 Jul</small></p>',
    '<p><small>[ <a href="mythology-ring.geocities.ws">Mythology Ring</a> ]</small></p>',
  ]);

export const MYTH_G = [CENTAURS, CHIRON, CENTAUROMACHY, HYBRIDS];
