// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE THURSDAY GROUP. A reading group's page that keeps the first part of The
// German Ideology twice, in English under vault and in German under crypt, in
// full view; and two pages written up by members for the passages the manuscript
// is missing at those points.

import { IDEOLOGY_EN, IDEOLOGY_DE, GENERAL_INTELLECT } from './ideology-sealed.js';

const P = (domain, name, title, body) => ({ domain, name, title, body });
const esc = (t) => String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const MAIN = 'illusion-of-the-epoch.geocities.ws';
const FISH = 'the-essence-of-the-fish.geocities.ws';
const PRE = 'liberation-is-an-historical-act.geocities.ws';

const EPOCH = P(MAIN, 'THE ILLUSION OF THE EPOCH', 'The Illusion of the Epoch :: Thursday group', [
  '<!--bg:soc-marxian-->',
  '<meta name="keywords" content="marx, engels, feuerbach, stirner, bauer, hess, wigand, leipzig, 1845, brussels">',
  '<!-- deutsch: crypt, mit dem Namen des Verlegers -->',
  '<h1>THE ILLUSION OF THE EPOCH</h1>',
  '<p><small>the Thursday group &middot; <i>The German Ideology</i>, Part I, Feuerbach &middot;',
  'two copies of the same pages</small></p>',
  '<hr>',
  '<p>We read it a section a night. We keep it sealed.',
  'The English is ours, done from the German by three of us over one winter.',
  'The German was typed in on a terminal with no umlauts, and locked the old way.</p>',
  '<p>Two passages are missing where the text breaks off. Members',
  'wrote them up: <a href="' + FISH + '">the essence of the fish</a> &middot;',
  '<a href="' + PRE + '">liberation is an historical act</a>.</p>',
  '<!--',
  '<script language="JavaScript">',
  '  // members only. took this off when the host stopped running scripts',
  '  function enter() {',
  '    var p = prompt("Password?", "");',
  '    if (p == "the real ground of history") location.href = "english.html";',
  '    else alert("Not tonight.");',
  '  }',
  '</script>',
  '-->',
  // soc/feuerbach-01.jpg: Ludwig Feuerbach, engraving after August Weger, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/soc/feuerbach-01.jpg" alt=""><span class="indie-cap">Feuerbach. Part I is named for him</span>',
  // soc/stirner-engels-01.jpg: Friedrich Engels, sketch of Max Stirner (1892), public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/soc/stirner-engels-01.jpg" alt=""><span class="indie-cap">Saint Max, drawn from memory by Engels in 1892, one of the very few likenesses there are</span>',
  '<h2>English</h2>',
  '<pre>-----BEGIN SEALED-----\n' + IDEOLOGY_EN + '\n-----END SEALED-----</pre>',
  '<h2>Deutsch</h2>',
  '<pre>' + esc(IDEOLOGY_DE) + '</pre>',
  '<!-- the second one: what makes whom, in his words -->',
  '<!-------BEGIN SEALED-----\n' + GENERAL_INTELLECT.split('\n').map((l) => '  ' + l).join('\n')
    + '\n  -----END SEALED------->',
  '<hr>',
  '<p><small>see also <a href="karl-marx-socialism.geocities.ws">the Tuesday circle\'s',
  'Manifesto notes</a> &middot; <a href="socialism-ring.geocities.ws">Socialism Ring</a></small></p>',
  '<p><small>counter: 00845 &middot; Thursdays, back room, bring the phrase</small></p>',
]);

const FISH_PAGE = P(FISH, 'THE ESSENCE OF THE FISH', 'The essence of the fish :: a missing passage', [
  '<!--bg:soc-marxian-->',
  '<h1>The essence of the fish</h1>',
  '<p><small>written up for the Thursday group, for the gap in Part I where the',
  'manuscript breaks off in the middle of a sentence about proletarians</small></p>',
  '<hr>',
  '<h2>What the passage says</h2>',
  '<p>Feuerbach, in the <i>Philosophy of the Future</i>, had argued that the being',
  'of a thing is its essence: whatever conditions an animal lives in are the',
  'conditions in which its nature is satisfied. Marx and Engels take him at his',
  'word and give him an example. "The \'essence\' of the fish is its \'being\', water."',
  'The essence of a river fish is the water of the river. Then the river is put to',
  'work. Dyes and waste go into it, steamboats go up and down it, it is diverted',
  'into canals that can be drained. The water stops being the fish\'s medium of',
  'existence, and on Feuerbach\'s account the fish has lost its essence through an',
  'unfortunate accident, which it must bear.</p>',
  '<p>The same argument is then turned on the millions whose existence does not',
  'correspond to their essence. Feuerbach calls that an unavoidable misfortune.',
  'Stirner tells the discontented that the contradiction is their own and they',
  'should keep their disgust to themselves. Bauer says they are stuck in the',
  'muck of substance. The passage\'s reply to all three is that industry altered the',
  'river, and that people acting in practice can alter the conditions again.</p>',
  // soc/father-thames-01.jpg: Punch, July 1858, Father Thames introducing his offspring, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/soc/father-thames-01.jpg" alt=""><span class="indie-cap">Punch, 1858, the summer of the Great Stink. the fish did not get a vote</span>',
  '<h2>A digression</h2>',
  '<p>It has often been read as a joke at Feuerbach\'s expense and passed over.',
  'Since the ecological readings of Marx it has been read closely. It is one of the',
  'few places in the early writing where the damage industry does to the',
  'conditions of life is stated as a fact, and where nature appears as a set of',
  'conditions that production can use up. John Bellamy Foster\'s <i>Marx\'s Ecology</i> (2000) and Kohei Saito\'s',
  '<i>Karl Marx\'s Ecosocialism</i> (2017) built a whole reading of Marx on the',
  'later notebooks, on soil chemistry and the "metabolic rift" between town and',
  'country. The fish passage is where that reading can say it started, twenty years',
  'before <i>Capital</i>.</p>',
  '<p>It also changes what the word essence can mean. If the essence of the fish',
  'can be poured out of the river with the dye works\' waste, then an essence is a',
  'relation to conditions, and conditions have owners.</p>',
  '<p>It is one of the few places in Part I where the subject is the medium: the water,',
  'and what happens to anything that lives in a medium someone else can alter.</p>',
  '<hr>',
  '<p><small>the other missing passage: <a href="' + PRE + '">liberation is an historical',
  'act</a> &middot; back to <a href="' + MAIN + '">the illusion of the epoch</a></small></p>',
]);

const PRE_PAGE = P(PRE, 'LIBERATION IS AN HISTORICAL ACT', 'Liberation is an historical act :: a missing passage', [
  '<!--bg:soc-marxian-->',
  '<h1>Liberation is an historical act</h1>',
  '<p><small>written up for the Thursday group, for the other gap: the passage the',
  'editions call "Preconditions of the Real Liberation of Man"</small></p>',
  '<hr>',
  '<p>The young Hegelians thought they would free people by freeing them from',
  'ideas: reduce philosophy, theology and "substance" to self-consciousness, and',
  'man is liberated from phrases that, the passage says drily, never held him in the',
  'first place. Against this it sets a list. Slavery cannot be abolished without',
  'the steam engine and the mule-jenny. Serfdom cannot be abolished without better',
  'agriculture. People cannot be liberated at all while they cannot get food and',
  'drink, housing and clothing of adequate quality and quantity. Liberation, it',
  'says, "is an historical and not a mental act",',
  'brought about by the development of industry, commerce and agriculture.</p>',
  '<p>The last surviving paragraph turns the argument on Germany itself. In a',
  'country where so little history is happening, the mental developments stand in',
  'for the missing history, take root, and have to be fought; but the fight is of',
  'local importance only.</p>',
  // soc/mule-jenny-01.png: Edward Baines, History of the Cotton Manufacture (1835), mule-jenny, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/soc/mule-jenny-01.png" alt=""><span class="indie-cap">the mule-jenny, from Baines, 1835</span>',
  '<h2>A digression</h2>',
  '<p>It is often read as technological determinism: first the machine, then the',
  'freedom. The passage claims less than that: the machine is a condition that has',
  'to be met, and it does none of the liberating. Without the spinning mule there is no',
  'end to slavery, and with it there is still no guarantee of anything. The',
  'tradition after it splits over which half of that sentence to stress.</p>',
  '<p>One side stresses the first half. The <i>Grundrisse</i>, a decade later,',
  'imagines knowledge built into machinery until labour time stops being the',
  'measure of wealth, and the twenty-first century produced a shelf of books on',
  'that hope: Srnicek and Williams, <i>Inventing the Future</i> (2015); Aaron',
  'Bastani, <i>Fully Automated Luxury Communism</i> (2019). The other side stresses',
  'the second half. Paolo Virno\'s short entry on the "general intellect" says the',
  'tendency Marx described has in fact arrived, knowledge running production, and',
  'arrived with none of the consequences Marx expected: free time turns up as',
  'unemployment. Saito\'s later work goes further and asks whether the',
  'productive forces the passage counts on are themselves the damage.</p>',
  '<p>Food, drink, housing, clothing. On the islands, since the towers went up,',
  'circumstance has read it out to everybody. The machines are there, far',
  'past anything with a mule or a steam engine in it, and the list is still',
  'unmet.</p>',
  '<hr>',
  '<p><small>the other missing passage: <a href="' + FISH + '">the essence of the',
  'fish</a> &middot; back to <a href="' + MAIN + '">the illusion of the epoch</a></small></p>',
]);

export const IDEOLOGY_SITES = [EPOCH, FISH_PAGE, PRE_PAGE];
