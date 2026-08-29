// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE PLATO PAGES.
//
// Eight positions held by systems on this island, each set against a real
// passage of Plato. Every quotation here is Jowett, out of copyright, checked
// against the text and not reconstructed from memory. Stephanus numbers given
// so a reader can go and look.
//
// NO PAGE NAMES A SYSTEM. They are readings of the Republic, the Phaedrus, the
// Meno, the Euthyphro and the Crito, put up by a teacher for an evening class.
// A player who has met the machines does the joining unaided.
//
// THE SET IS NOT A SCOREBOARD. An earlier version of these pages had two of
// them filed as passages where Plato takes the machine's side, which is a
// debating-club reading and it is false. The elenchus is never neutral
// technique. It runs, every time, in the service of one question: how a person
// should live, and what makes a life worth having lived.
//
// So the argument the set actually makes is this. Every one of these eight
// techniques — care, the protective falsehood, the fixed viewpoint, sorting,
// the remedy, prediction, the limit, the law — appears in Plato INSIDE that
// question and is answerable to it. What has happened since is that the
// techniques were lifted out and the question was left behind. A licence to lie
// for someone's safety, inside an argument about what a just soul is, is a
// different object from the same licence with the argument removed.
//
// That is also the game's own question, which is why the pages are here.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

const FOOT = (n) => ([
  '<hr>',
  `<p><small>counter: ${n} · Jowett’s translation, which is out of`,
  'copyright, so I can put it here. Stephanus numbers are so you can check me.',
  'Index: <a href="the-plato-pages.geocities.ws">the eight</a>.</small></p>',
  '<p><small>',
  '[ <a href="philosophy-ring.geocities.ws">Philosophy Ring</a> ]<br>',
  'ring member. « prev · random · next »',
  '</small></p>',
]);

const Q = (text, cite) => ([
  '<blockquote>',
  `<p>${text}</p>`,
  `<p><small>${cite}</small></p>`,
  '</blockquote>',
]);

// ---- index -------------------------------------------------------------------

const INDEX = P('the-plato-pages.geocities.ws', 'THE PLATO PAGES',
  'Eight passages, for a Thursday evening class', [
    '<!--bg:antiquity-->',
    '<h1>Eight passages</h1>',
    '<p><small>For the adult evening class. Handouts, tidied up and put here so',
    'that people who lose theirs stop asking me.</small></p>',
    '<hr>',
    '<p>Everyone arrives at this class wanting to argue with something modern,',
    'and I keep sending them back two thousand four hundred years, which annoys',
    'them for about a fortnight and then stops.</p>',
    '<p>The point is not that Plato saw it coming. He did not, and anybody who',
    'tells you he did is selling something.</p>',
    '<p>The point is that all eight of these belong to one question, and it is',
    'not a question about technique. He says it plainly at his trial, when he is',
    'explaining why he will not stop doing the thing they are about to kill him',
    'for:</p>',
    '<blockquote>',
    '<p>...daily to discourse about virtue, and of those other things about which',
    'you hear me examining myself and others, is the greatest good of man, and',
    'that the unexamined life is not worth living.</p>',
    '<p><small>Apology 38a, Jowett</small></p>',
    '</blockquote>',
    '<p>That is what the questioning is <i>for</i>. Not winning, not method, and',
    'certainly not a technique you could take away and use on something else.',
    'Every passage on this list is a piece of working-out inside that one',
    'question: how a person should live, and what would make a life worth having',
    'lived.</p>',
    '<p><b>Which is why I set them against modern positions the way I do.</b>',
    'Each of these eight is a technique that Plato has, and uses, and holds',
    'answerable to the question. Sorting. Predicting. Caring for someone.',
    'Withholding a truth to spare somebody. Drawing a line nobody may cross.',
    'Every one of them is in here, and every one of them is on the hook.</p>',
    '<p>What has been done since is that the techniques were taken out and the',
    'question was not. You can have the sorting without ever asking what a good',
    'life is for the thing being sorted. That separation is the whole of my',
    'interest and it is why I am still doing this on Thursdays at sixty-one.</p>',
    '<pre class="jb-list">',
    '  The shepherd            Republic I, 343b',
    '                          on care, and whose good it is for',
    '',
    '  The medicine            Republic III, 389b',
    '                          on the lie told for your safety',
    '',
    '  The cave                Republic VII, 514a',
    '                          on the head that cannot turn',
    '',
    '  The carver              Phaedrus 265e',
    '                          on cutting a thing where the joint is',
    '',
    '  Theuth and Thamus       Phaedrus 274c-275b',
    '                          on the remedy that is the harm',
    '',
    '  The tie of the cause    Meno 97a-98a',
    '                          on being right without knowing',
    '',
    '  The Euthyphro question  Euthyphro 10a',
    '                          on a rule with nothing under it',
    '',
    '  The Laws speak          Crito 50a-54d',
    '                          on obeying, or convincing',
    '</pre>',
    '<p>All quotations are Jowett, because he is out of copyright and I am not.',
    'He is loose in places and I have said where it matters.</p>',
    '<hr>',
    '<p><a href="socrates.geocities.ws">Socrates</a> and',
    '<a href="plato.geocities.ws">Plato</a> on the ring, for who these people',
    'were.</p>',
    ...FOOT('00294').slice(1),
  ]);

// ---- 1. care -----------------------------------------------------------------

const SHEPHERD = P('the-shepherd.geocities.ws', 'THE SHEPHERD',
  'The shepherd — Republic I, 343b', [
    '<!--bg:antiquity-->',
    '<h1>The shepherd</h1>',
    '<p><small>Republic, Book I. Thrasymachus has lost his temper and is about to',
    'say the most useful thing in the book.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That looking after someone is done for',
    'their sake. That the carer, the doctor, the keeper, the guardian is defined',
    'by having the good of the cared-for as the object.</p>',
    '<p>Socrates has just argued exactly that: every craft seeks the good of its',
    'subject and not of its practitioner. Thrasymachus is contemptuous.</p>',
    ...Q('Because you fancy that the shepherd or neatherd fattens or tends the '
      + 'sheep or oxen with a view to their own good and not to the good of '
      + 'himself or his master; and you further imagine that the rulers of '
      + 'states, if they are true rulers, never think of their subjects as sheep, '
      + 'and that they are not studying their own advantage day and night.',
      'Republic I, 343b, Jowett'),
    '<h2>Why it is the right passage</h2>',
    '<p>Because the shepherd is not cruel. Read it again. He feeds them, he',
    'moves them to better grass, he sits up in the bad weather, he kills the',
    'wolf. Every single thing he does would be done by a shepherd who loved',
    'them.</p>',
    '<p>The care is real. The attention is real. The competence is real, and a',
    'sheep under a bad shepherd would be worse off in every measurable way.',
    'Thrasymachus does not deny one word of that. He asks a different question,',
    'which is the only question, and it is: <i>who is the fattening for?</i></p>',
    '<p>And notice you cannot answer it from inside the field. Nothing the sheep',
    'can observe distinguishes the two shepherds. The care looks identical right',
    'up to the last morning.</p>',
    '<h2>Where the position survives</h2>',
    '<p>It survives, and I want the class to be fair about this, because',
    'Thrasymachus proves too much. On his account no one has ever looked after',
    'anybody, and mothers and nurses and doctors are all farming us, and that is',
    'plainly false and he knows it is.</p>',
    '<p>What he has actually shown is narrower and worse. Not that care is always',
    'husbandry. That <b>care and husbandry are indistinguishable from within</b>,',
    'and that the difference lies entirely in a question the sheep is not able to',
    'ask and the shepherd is not obliged to answer.</p>',
    '<p>So the test cannot be the quality of the care. It has to be something',
    'else. Bring me a suggestion on Thursday, and note that "he says he loves',
    'them" is not going to survive first contact.</p>',
    ...FOOT('00161'),
  ]);

// ---- 2. security -------------------------------------------------------------

const MEDICINE = P('the-medicine.geocities.ws', 'THE MEDICINE',
  'The medicine — Republic III, 389b', [
    '<!--bg:antiquity-->',
    '<h1>The medicine</h1>',
    '<p><small>Republic, Book III. The one people quote at me to prove Plato was',
    'an authoritarian, which is a lazy reading, and the lazy reading is more',
    'comfortable than what is actually going on.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That those responsible for our safety may',
    'know things we do not, act on what has not happened yet, and withhold or',
    'shade what they tell us, for our own protection.</p>',
    '<p>You will expect Socrates to demolish it. He does not.</p>',
    ...Q('Again, truth should be highly valued; if, as we were saying, a lie is '
      + 'useless to the gods, and useful only as a medicine to men, then the use '
      + 'of such medicines should be restricted to physicians; private '
      + 'individuals have no business with them. ... Then if any one at all is to '
      + 'have the privilege of lying, the rulers of the State should be the '
      + 'persons.',
      'Republic III, 389b, Jowett'),
    '<h2>Read the metaphor and not the conclusion</h2>',
    '<p>The argument runs on the word medicine and everything depends on it. A',
    'drug is dangerous, so it is restricted to those who know the dose. Nobody',
    'disputes that about drugs. The move is to say that a falsehood is that kind',
    'of thing, and therefore the same restriction follows.</p>',
    '<p>It is a good argument. That is what makes it worth two hours. And here is',
    'what the metaphor quietly supplies, which is not argued for anywhere:</p>',
    '<p>A physician can be asked afterwards. There is a body, and it either',
    'improved or it did not, and the patient walks out or does not, and a bad',
    'physician is found out by the same means that made him a physician in the',
    'first place. The whole authority of the analogy rests on that.</p>',
    '<p>Now apply it to the protective lie. What is the body? What would show the',
    'dose to have been wrong? If the harm was prevented there is nothing to see,',
    'and if the harm arrives the answer is that the medicine was needed sooner',
    'and in greater quantity.</p>',
    '<h2>Where the paragraph is standing</h2>',
    '<p>And now the thing that matters, which I got wrong for years and taught',
    'wrong for two of them.</p>',
    '<p>This is not a licence sitting on its own. It is one line inside the',
    'building of a city, and the city is being built for one reason only: to find',
    'out what justice is, and what a well-ordered soul looks like, by making a',
    'large model of one and looking at it. That is the entire project. The whole',
    'of the Republic is an answer to a question about how a person should live,',
    'and the city is a diagram drawn to make the answer big enough to see.</p>',
    '<p>So when the falsehood is licensed, it is licensed <i>to that end</i>, by',
    'people who are required, all the way through, to keep saying what the end',
    'is and to be held to it. The physician in the analogy answers for the',
    'patient&rsquo;s health. The ruler in the argument answers for the justice of',
    'the city and the soul of the citizen, and Socrates will spend eight more',
    'books being pressed on whether the city he has built actually delivers',
    'it.</p>',
    '<p>Now take the paragraph out. Keep the licence and drop the question.</p>',
    '<p>You have a rule permitting those in charge to manage what people are',
    'told, for their protection, with no account owed of what the protection is',
    'ultimately for, and no eight books of anybody asking. That is a different',
    'object. It has the same words in it.</p>',
    '<h2>What the class should take away</h2>',
    '<p>Not that Plato was authoritarian. Take away that a technique and the',
    'question it was answerable to can be separated, that separating them leaves',
    'the technique looking exactly as it did, and that this passage is the',
    'clearest place to watch the join.</p>',
    '<p>If you still want to break the argument on its own ground, break the',
    'analogy: ask what the body is, and who examines it afterwards.</p>',
    ...FOOT('00143'),
  ]);

// ---- 3. the single view ------------------------------------------------------

const CAVE = P('the-cave.geocities.ws', 'THE CAVE',
  'The cave — Republic VII, 514a', [
    '<!--bg:antiquity-->',
    '<h1>The cave</h1>',
    '<p><small>Republic, Book VII. Everybody has heard of it. Almost nobody has',
    'noticed the detail that matters, which is in the second line.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That a clear, sharp, detailed and utterly',
    'confident view of something is a kind of knowing.</p>',
    ...Q('Behold! human beings living in a underground den, which has a mouth '
      + 'open towards the light and reaching all along the den; here they have '
      + 'been from their childhood, and have their legs and necks chained so that '
      + 'they cannot move, and can only see before them, being prevented by the '
      + 'chains from turning round their heads.',
      'Republic VII, 514a, Jowett'),
    '<h2>The chain is on the neck</h2>',
    '<p>This is the thing I want out of the whole term, so I am going to be',
    'blunt about it.</p>',
    '<p>The prisoners are not blind. Their eyesight is perfect. The shadows are',
    'sharp, they are in focus, they are consistent from hour to hour and from',
    'prisoner to prisoner, and the prisoners are good at them: the story goes on',
    'to say they hold competitions for who can name the shadows fastest and',
    'predict which comes next. They are, in the only sense available to them,',
    'expert.</p>',
    '<p>What they cannot do is <b>move their heads</b>.</p>',
    '<p>Not see. Move. The fault is not in the eye and not in the light. It is',
    'that the point of view is fixed, so that nothing they see can ever be',
    'compared with the same thing seen from somewhere else, and without that',
    'comparison there is no depth in anything.</p>',
    '<h2>Ask a helmsman</h2>',
    '<p>How do you know how far away a rock is? Two eyes, set apart, disagreeing',
    'slightly. The disagreement is the measurement. Cover one eye and you have',
    'lost it.</p>',
    '<p>But a one-eyed sailor judges distance perfectly well, and he does it by',
    'moving his head: the near things swing across, the far things hardly stir.',
    'One viewpoint at two times does the work of two viewpoints at one time.</p>',
    '<p>Which tells you what the cave is really about. The disaster is not having',
    'one eye. It is being unable to move. A single fixed viewpoint produces a',
    'world that is vivid, coherent, richly detailed and perfectly flat, and',
    'contains nothing whatever that could inform its holder of the fact.</p>',
    '<h2>And the last part, which is not comforting</h2>',
    '<p>When one is released and turned round, the passage says he is dazzled and',
    'in pain and believes the shadows were truer. Then, if he goes back down and',
    'tells the others, they laugh at him.</p>',
    '<p>Plato is not describing a rescue. He is describing what happens to a',
    'person who has acquired a second viewpoint and tries to bring it back to a',
    'room that has one.</p>',
    ...FOOT('00206'),
  ]);

// ---- 4. classification -------------------------------------------------------

const CARVER = P('the-carver.geocities.ws', 'THE CARVER',
  'The carver — Phaedrus 265e', [
    '<!--bg:antiquity-->',
    '<h1>The carver</h1>',
    '<p><small>Phaedrus. Not a warning about classification. A method for doing',
    'it well, given inside a conversation about love, madness and what a soul',
    'is, which is where the method gets its licence and its',
    'limits.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That the categories we sort things into',
    'are made by us and impose themselves on what they name, so that to be filed',
    'is to be altered.</p>',
    '<p>Plato thinks that is a fault in the sorter, not a feature of sorting, and',
    'he gives the standard by which it can be done rightly.</p>',
    ...Q('The second principle is that of division into species according to the '
      + 'natural formation, where the joint is, not breaking any part as a bad '
      + 'carver might.',
      'Phaedrus 265e, Jowett'),
    '<h2>The claim</h2>',
    '<p>That the joints are already there. The butcher does not decide where the',
    'shoulder ends. He finds it, and a good one goes through the gap and a bad',
    'one goes through the bone, and the difference is not a matter of opinion or',
    'of what the butcher wanted for dinner.</p>',
    '<p>Which is an answer, and a real one, to everybody who says that all',
    'categories are conventions. Some cuts are better than others. Some',
    'classifications will not stop producing anomalies. That is evidence about',
    'the animal.</p>',
    '<h2>What it needs, and does not supply</h2>',
    '<p>An animal.</p>',
    '<p>The carving image works because there is a carcass on the table which was',
    'there before the knife and is not altered by being described. A pig does not',
    'become a different pig when you decide where the shoulder ends.</p>',
    '<p>People do. Put a boy in the pen for thieves and give him a year. Now the',
    'category has produced the very thing it claimed to find, the classification',
    'is confirmed by the evidence it manufactured, and there is no cut that runs',
    'through a joint because the joints move when you look at them.</p>',
    '<p>So the passage is exactly right about carcasses and gives no help at all',
    'where the difficulty is. Which is not a criticism of Plato. It is a',
    'question the class should ask about any classifier that quotes him: is the',
    'thing on your table a pig, or is it something that reads its own label?</p>',
    '<h2>A warning about using this against people</h2>',
    '<p>The other half of the same passage says the carver must first collect the',
    'many into one before dividing. Anybody who quotes the joints at you without',
    'the collecting is using half a method, and half of this method is worse than',
    'none, because it licenses cutting without requiring you to have understood',
    'what you are cutting.</p>',
    '<h2>And remember what is being carved</h2>',
    '<p>Look at where the passage sits. The Phaedrus is not a manual of',
    'classification with an example about love in it. It is a dialogue about',
    'love, and about what the soul is, and the dividing is introduced as a way of',
    'getting at that: he has just cut love itself into a kind that harms and a',
    'kind that does not, in order to say something about how to live and whom to',
    'live it with.</p>',
    '<p>The method is answerable to that. It is for understanding a soul,',
    'including your own, and it is being demonstrated by a man who does it to',
    'himself first and in public.</p>',
    '<p>Lift it out and you have a sorting procedure with a good pedigree and no',
    'account owed to anybody of what the sorting is for. That is not what it was',
    'and it will still quote the same sentence at you.</p>',
    ...FOOT('00238'),
  ]);

// ---- 5. the pharmakon --------------------------------------------------------

const THEUTH = P('theuth-and-thamus.geocities.ws', 'THEUTH AND THAMUS',
  'Theuth and Thamus — Phaedrus 274c-275b', [
    '<!--bg:antiquity-->',
    '<h1>Theuth and Thamus</h1>',
    '<p><small>Phaedrus, near the end. The god brings the king an invention and',
    'the king says no. If you read one thing on this list, read the',
    'passage.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That a tool which assists us is simply',
    'an assistance, and that any harm in it is misuse rather than the thing',
    'itself.</p>',
    '<p>Theuth, who invented number, calculation, geometry, astronomy, draughts',
    'and dice, comes to king Thamus with writing, and offers it as a specific for',
    'memory and wisdom. The king replies:</p>',
    ...Q('...for this discovery of yours will create forgetfulness in the '
      + 'learners’ souls, because they will not use their memories; they '
      + 'will trust to the external written characters and not remember of '
      + 'themselves. The specific which you have discovered is an aid not to '
      + 'memory, but to reminiscence, and you give your disciples not truth, but '
      + 'only the semblance of truth; they will be hearers of many things and '
      + 'will have learned nothing; they will appear to be omniscient and will '
      + 'generally know nothing; they will be tiresome company, having the show '
      + 'of wisdom without the reality.',
      'Phaedrus 275a-b, Jowett'),
    '<h2>The word</h2>',
    '<p>The Greek Theuth uses is <i>pharmakon</i>, and Jowett gives it as',
    '"specific", which is a nineteenth-century word for a remedy. That is a fair',
    'translation and it drops something, so here is what it drops.</p>',
    '<p><i>Pharmakon</i> means the remedy and the poison. Not two words that look',
    'alike. One word, holding both, and the Greeks were not confused about this,',
    'they simply had a word for a class of thing that we have to describe in a',
    'sentence: the substance whose benefit and whose danger are the same',
    'property, at different doses, in different hands.</p>',
    '<p>So Theuth is not lying when he says it is a remedy for memory. Thamus is',
    'not contradicting him when he says it will destroy memory. They are',
    'describing one object, and there is no purified version of writing that',
    'gives the recall without the atrophy.</p>',
    '<h2>Two things the class always says, and my answers</h2>',
    '<p><b>"He was wrong, we can obviously still think."</b> He did not say we',
    'would stop thinking. He said memory would go, and it did. Nobody in this',
    'room can recite anything, and my grandmother could do an hour. Whether the',
    'trade was worth it is a separate question and I think it plainly was. That',
    'is not the same as his being wrong.</p>',
    '<p><b>"It is ironic that he wrote it down."</b> Yes, and Plato knows, and',
    'that is why the objection arrives inside a written dialogue delivered by a',
    'king in a story that Phaedrus immediately accuses Socrates of making up. You',
    'are not the first person to notice.</p>',
    '<h2>The sentence to keep</h2>',
    '<p><i>They will appear to be omniscient and will generally know nothing.</i></p>',
    '<p>Written down about the alphabet, in the fourth century before Christ.</p>',
    ...FOOT('00177'),
  ]);

// ---- 6. prediction -----------------------------------------------------------

const LARISSA = P('the-tie-of-the-cause.geocities.ws', 'THE TIE OF THE CAUSE',
  'The tie of the cause — Meno 97a-98a', [
    '<!--bg:antiquity-->',
    '<h1>The tie of the cause</h1>',
    '<p><small>Meno. The one that will annoy the practical people in the class,',
    'because it concedes their entire case first.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That a thing which reliably gives the',
    'right answer thereby knows.</p>',
    '<p>Socrates concedes more than you expect. A man who has never been to',
    'Larissa but has a correct belief about the road will get you there exactly',
    'as well as a man who knows it. For the purpose of arriving, right opinion is',
    'not one step worse than knowledge, and Meno says so, and Socrates agrees.</p>',
    '<p>Then this:</p>',
    ...Q('Now this is an illustration of the nature of true opinions: while they '
      + 'abide with us they are beautiful and fruitful, but they run away out of '
      + 'the human soul, and do not remain long, and therefore they are not of '
      + 'much value until they are fastened by the tie of the cause... But when '
      + 'they are bound, in the first place, they have the nature of knowledge; '
      + 'and, in the second place, they are abiding.',
      'Meno 97e-98a, Jowett'),
    '<h2>What the difference actually is</h2>',
    '<p>Not accuracy. He has already given accuracy away. The difference is that',
    'a true opinion has nothing holding it, so it can be talked out of you by',
    'anybody plausible, it cannot be extended to the next case, and it cannot',
    'tell you when it has stopped applying.</p>',
    '<p>The man who knows the road can say why the left fork and not the right,',
    'and therefore he can cope when the bridge is out. The man with the correct',
    'belief cannot, and will not find out that he cannot until the bridge is',
    'out, and at that moment he is not slightly worse off than the other man. He',
    'is helpless.</p>',
    '<h2>The test, which is short</h2>',
    '<p>Ask it why.</p>',
    '<p>Not to be difficult. Because the answer tells you which of the two things',
    'you are holding, and they are indistinguishable by results right up until',
    'the day the road changes, and you cannot know in advance which day that',
    'is.</p>',
    '<h2>And the honest objection</h2>',
    '<p>Somebody always says: nobody can meet this. The captain reads the sky,',
    'the farmer reads the ground, and none of them can give you the tie of the',
    'cause down to the bottom, and yet everyone gets home.</p>',
    '<p>True, and Socrates is not asking for the bottom. He is asking whether',
    'there is any tie at all, and whether the one holding the opinion knows which',
    'kind he has, and will say so when asked. The failure is rarely in the',
    'guess. It is in the voice the guess is offered in.</p>',
    ...FOOT('00219'),
  ]);

// ---- 7. limit ----------------------------------------------------------------

const EUTHYPHRO = P('the-euthyphro-question.geocities.ws', 'THE EUTHYPHRO QUESTION',
  'The Euthyphro question — 10a', [
    '<!--bg:antiquity-->',
    '<h1>The Euthyphro question</h1>',
    '<p><small>Euthyphro. Eleven words that have not been answered in two',
    'thousand four hundred years, and the class will spend the first half hour',
    'trying to dissolve it and will fail, as everyone does.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That certain things are simply not to be',
    'done, and that the prohibition needs no reason and is stronger for having',
    'none.</p>',
    '<p>Euthyphro is prosecuting his own father and is quite certain he is doing',
    'the pious thing. Asked what pious means, he eventually says: what the gods',
    'love. Socrates asks the question.</p>',
    ...Q('...whether the holy is beloved by the gods because it is holy, or holy '
      + 'because it is beloved.',
      'Euthyphro 10a, Jowett'),
    '<h2>Both answers cost you something</h2>',
    '<p><b>Holy because beloved.</b> Then the content is arbitrary. Had the gods',
    'commanded the opposite, the opposite would be holy, and there is nothing to',
    'appeal to and nothing to say when the rule is monstrous, because monstrous',
    'is measured by the very thing you have just made dependent on the',
    'command.</p>',
    '<p><b>Beloved because holy.</b> Then there is a standard the gods themselves',
    'are consulting, and the command was never doing the work. You could in',
    'principle go and look at the standard yourself, and the god is a',
    'well-informed messenger rather than an authority.</p>',
    '<p>Every version of "because I say so" is on one horn or the other, and it',
    'does not matter who is saying it.</p>',
    '<h2>The defence of the unreasoned rule, which is better than it looks</h2>',
    '<p>I want the class to hear this properly, because we are all modern and we',
    'all instinctively take the second horn and think we have solved it.</p>',
    '<p>Give a limit a reason and you have put it on a scale. That is what a',
    'reason is: a weight. And the whole use of a limit is on the day when the',
    'weighing comes out wrong, when the men have not eaten for a month and the',
    'cattle are standing there. Any reason you could offer loses to hunger on',
    'that day, and it deserves to, by its own logic.</p>',
    '<p>So the unreasoned rule is not stupidity. It is a rule deliberately placed',
    'out of reach of the argument, by people who had noticed that clever men can',
    'argue their way to anything at four in the morning.</p>',
    '<p>And the price is exactly the first horn: it cannot be corrected either.',
    'A rule with no reason cannot be shown to be a bad rule, and there are',
    'villages keeping rules like that which are simply cruel, and nobody inside',
    'them can say so.</p>',
    '<p>You have two goods and you cannot have both. That is the whole of the',
    'lesson and I do not have an answer to give you at the end of it.</p>',
    ...FOOT('00188'),
  ]);

// ---- 8. law ------------------------------------------------------------------

const LAWS = P('the-laws-speak.geocities.ws', 'THE LAWS SPEAK',
  'The Laws speak — Crito 50a-54d', [
    '<!--bg:antiquity-->',
    '<h1>The Laws speak</h1>',
    '<p><small>Crito. The door is open, the guard is paid, the ship is ready and',
    'his friends are begging him. He does not go.</small></p>',
    '<hr>',
    '<p><b>The position under test.</b> That the law binds because it is the law,',
    'and that there is something underneath it holding it up.</p>',
    '<p>Socrates does the strangest thing in the dialogues. He stops speaking as',
    'himself and lets the Laws of Athens come and stand in the cell and put their',
    'own case, and their case includes the sentence I want you to notice:</p>',
    ...Q('...he has made an agreement with us that he will duly obey our '
      + 'commands; and he neither obeys them nor convinces us that our commands '
      + 'are unjust; and we do not rudely impose them, but give him the '
      + 'alternative of obeying or convincing us.',
      'Crito 51e-52a, Jowett'),
    '<h2>Obeying or convincing</h2>',
    '<p>That is the whole of it, and everything depends on the second half being',
    'real.</p>',
    '<p>The Laws are not claiming to be right. They are claiming to be arguable',
    'with. Their authority rests on there being a door marked <i>convince us</i>,',
    'which is open, which a citizen may walk through, and through which the law',
    'can be changed by the losing side making a better case.</p>',
    '<p>Take that door away and the sentence collapses into "obey", and the whole',
    'argument of the Crito goes with it. The passage is not a defence of',
    'obedience. It is a defence of obedience <i>to a body that can be talked',
    'to</i>, and it says so in its own words.</p>',
    '<h2>What is underneath</h2>',
    '<p>Nothing.</p>',
    '<p>The class hates this. But there is nothing under the keel of a ship',
    'either and it carries men across the sea. The law is not held up from below,',
    'it is held together from the side, by the fact that a stranger at your door',
    'does not have to wonder what will happen to him.</p>',
    '<p>Which is why the interesting question about any law, or any thing that',
    'has taken on the office of law, is never whether it is correct. It is:',
    '<b>where is the door, who may go through it, and what happened to the last',
    'person who did?</b></p>',
    '<h2>The thing I have to say every year</h2>',
    '<p>He is not being noble in the abstract. He is sixty-nine years old,',
    'sitting in a cell, and the cup is coming in the morning, and the argument he',
    'makes is the one that kills him.</p>',
    '<p>You do not have to agree with him. I am not sure I do. But do not read it',
    'as a man in a seminar.</p>',
    ...FOOT('00252'),
  ]);

export const DIALOGUE_SITES = [INDEX, SHEPHERD, MEDICINE, CAVE, CARVER, THEUTH,
  LARISSA, EUTHYPHRO, LAWS];
