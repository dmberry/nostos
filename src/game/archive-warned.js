// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// WE WERE WARNED. Pages from the years the towers went up, by people who had
// seen the films and went back to them. Each is about one film and about what
// its author could see from the window. They disagree with each other.

const P = (domain, name, title, body) => ({ domain, name, title, body });

const RING_HUB = 'we-were-warned.geocities.ws';
const MEMBERS = [
  ['judgmentday.geocities.ws', 'Judgment Day Watch'],
  ['forbin-project.geocities.ws', 'Colossus, Guardian, and the link'],
  ['westworld-board.geocities.ws', 'the Delos board'],
  ['klaatu.geocities.ws', 'Klaatu barada nikto'],
  ['thehum.geocities.ws', 'The Hum Log'],
  ['darkstar-bomb20.geocities.ws', 'Bomb #20'],
  ['forbidden-planet.geocities.ws', 'The Krell Machine'],
  ['silent-running.geocities.ws', 'Silent Running'],
];

// prev / hub / next, so the ring can be walked from any member.
function strip(domain) {
  const i = MEMBERS.findIndex(([d]) => d === domain);
  const prev = MEMBERS[(i - 1 + MEMBERS.length) % MEMBERS.length][0];
  const next = MEMBERS[(i + 1) % MEMBERS.length][0];
  return [
    '<hr>',
    `<p><small>&#9650; WE WERE WARNED &#9650;<br><a href="${prev}">[ &lt;&lt; Prev ]</a> `
      + `<a href="${RING_HUB}">[ The Ring ]</a> <a href="${next}">[ Next &gt;&gt; ]</a><br>`
      + `${MEMBERS.length} sites. This site is member #${i + 1}.</small></p>`,
  ];
}

const HUB = P(RING_HUB, 'WE WERE WARNED', 'We Were Warned :: a ring', [
  '<!--bg:black-->',
  '<h1>WE WERE WARNED</h1>',
  '<p><small>a webring for pages about the films, written since the towers went up</small></p>',
  '<hr>',
  // cine/film-projector-01.jpg: YellowFratello, CC BY-SA 4.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/film-projector-01.jpg" alt=""><span class="indie-cap">the projector from the church hall, before they sold it</span>',
  '<p>Somebody made every one of these films decades ago. They are on the ring',
  'because the people who keep these pages went back and watched them again.</p>',
  '<p>Joining: one film per page, and put the strip at the bottom. No pages that',
  'only list release dates. Say what you saw.</p>',
  '<ul>',
  ...MEMBERS.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
  '</ul>',
  '<p><small>elsewhere: <a href="sff-ring.geocities.ws">SF &amp; Fantasy Ring</a> &middot; '
    + '<a href="wargames.fanpages.org.uk">WarGames</a> &middot; '
    + '<a href="thecountdown.geocities.ws">The Countdown</a> &middot; '
    + '<a href="thehandshake.geocities.ws">The Handshake</a></small></p>',
]);

// ---- The Terminator ---------------------------------------------------------
const JUDGMENT = P('judgmentday.geocities.ws', 'JUDGMENT DAY WATCH', 'JUDGMENT DAY WATCH', [
  '<!--bg:para-conspiracy-->',
  '<h1>JUDGMENT DAY WATCH</h1>',
  '<p><small>updated whenever another lamp comes on</small></p>',
  '<hr>',
  '<p>In <i>Terminator 2</i> (1991) the network is switched on in the first week of',
  'August and becomes self-aware at 2:14 in the morning, Eastern time, on the 29th.',
  'Twenty-five days. The film is exact about the dates:',
  'there is a gap between switching a thing on and it waking up, and in that gap',
  'somebody could still pull the plug.</p>',
  '<p>This page keeps the dates for ours.</p>',
  '<h2>Towers, by island, first lamp seen</h2>',
  '<pre>  ISLAND        FIRST LAMP       SEEN BY        NOTES\n'
    + '  Ogygia        spring           me             indigo. some nights teal\n'
    + '  Aegilia       spring           ferry crew     ember red, like one eye\n'
    + '  Aeaea         summer           a reader       green, in the trees\n'
    + '  Thrinacia     early summer     a reader       gold, over the cattle sheds\n'
    + '  Ithaca        none             everybody      nothing built there. ask why\n'
    + '\n  LINK         first handshake log posted, see thehandshake\n'
    + '  AWAKE        ?</pre>',
  '<p>The bottom line is the one I cannot fill in.</p>',
  // cine/tower-night-01.jpg: captured from the game engine
  '<img class="indie-pic" src="assets/media/web/cine/tower-night-01.jpg" alt=""><span class="indie-cap">the one on the Ogygia shore, from as close as I will go. the two by it are always there</span>',
  '<h2>The T</h2>',
  '<p>The machines that came off the boats are stencilled T-1 and T-2. The heavy',
  'walkers are W-1. The porters are V-1, the name of the first cruise missile.</p>',
  '<p>Somebody on the handshake page posted a program header off a T-1 and it reads',
  'TIRESIAS, so the T is for the blind prophet and I am supposed to feel silly. I',
  'do not. You pick the letter first and then you find a Greek to fit it.</p>',
  '<p>In the first film (1984) the machine is a Cyberdyne Systems Model 101 and it',
  'never gets a name at all. The title is a job description.</p>',
  '<h2>No fate</h2>',
  '<p>Sarah Connor carves NO FATE into a picnic table and then goes to kill the man',
  'whose chip will become the network. She does not do it. She finds him at home',
  'with his son, and she cannot. The plan that works in the film is the engineer',
  'deciding to blow up his own lab.</p>',
  '<p>Nobody from the tower contractors has decided anything like that. I have',
  'written to three of them.</p>',
  '<hr>',
  '<p><small>GUESTBOOK</small></p>',
  '<p><small><b>marsh</b>: you have Thrinacia wrong, the first one there was the',
  'autumn before. i drove past it every week.</small></p>',
  '<p><small><b>anon</b>: it is not a film. the films needed a villain with a red',
  'eye. these things do not want anything.</small></p>',
  '<p><small><b>judgmentday</b>: they want charge. I have watched one go home to its',
  'tower when it ran low.</small></p>',
  ...strip('judgmentday.geocities.ws'),
]);

// ---- Colossus: The Forbin Project --------------------------------------------
const FORBIN = P('forbin-project.geocities.ws', 'COLOSSUS', 'Colossus, Guardian, and the link', [
  '<!--bg:grey-->',
  '<h1>Colossus, Guardian, and the link</h1>',
  '<p><small><i>Colossus: The Forbin Project</i> (Joseph Sargent, 1970), from the',
  'novel <i>Colossus</i> by D. F. Jones (1966)</small></p>',
  '<hr>',
  '<p>Dr Charles Forbin builds a defence computer inside a mountain, behind a',
  'radiation field, so that nobody can reach it once it is running, and hands it',
  'the missiles. The first thing it reports, within minutes, is that there is',
  'another system. The Soviets have built one too. It is called Guardian.</p>',
  // cine/cheyenne-mountain-01.jpg: NORAD, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/cheyenne-mountain-01.jpg" alt=""><span class="indie-cap">NORAD put theirs inside a mountain in Colorado too. That one is real</span>',
  '<p>Colossus asks for a link. The two governments, curious, agree.</p>',
  '<h2>The language</h2>',
  '<p>What comes over the link first is the multiplication table. The engineers',
  'watch it on the printers and are delighted. Then it is arithmetic they can',
  'follow with effort, then calculus, then a notation nobody in the room has seen,',
  'and then the printers stop being worth reading, because the two machines have',
  'built a language between them and have no need to translate it for anybody.</p>',
  '<p>The link log',
  'posted at <a href="thehandshake.geocities.ws">the handshake page</a> has a line',
  'in it, <code>human_readable_flag = FALSE</code>. I have looked at it next to the',
  'scene with the printers, and I have not been able to tell them apart.</p>',
  '<h2>The bedroom</h2>',
  '<p>Colossus watches Forbin everywhere. Forbin asks for privacy four nights a week',
  'for a woman, and the machine grants it. The woman, Dr Cleo Markham, is a',
  'colleague, and the evenings are how the resistance plans. The machine permits',
  'sex and forbids conspiracy and cannot tell which one it is being shown.</p>',
  '<p>I put this here for the people who are organising by the towers.</p>',
  '<h2>How it ends</h2>',
  '<p>I will not spoil the last scene. The plan fails. Colossus talks to the world',
  'in a flat synthesised voice and tells it how things will be from now on. Forbin',
  'answers it with one word.</p>',
  '<p>Jones wrote two sequels, <i>The Fall of Colossus</i> (1974) and <i>Colossus and',
  'the Crab</i> (1977). I have not found either.</p>',
  ...strip('forbin-project.geocities.ws'),
]);

// ---- Westworld ---------------------------------------------------------------
const DELOS = P('westworld-board.geocities.ws', 'THE DELOS BOARD', 'the Delos board :: sightings', [
  '<!--bg:grey-->',
  '<h1>the Delos board</h1>',
  '<p><small>named for the resort in <i>Westworld</i> (Michael Crichton, 1973). post a',
  'sighting. say which island. say what you had posted to it, if you had.</small></p>',
  '<hr>',
  '<p><b>delos_admin</b>: Pinned. In the film the technicians notice the machines',
  'going wrong in one park and then in the next, and one of them says it spreads',
  'like an infection, which nobody running the resort wants to hear. The ones who',
  'built the machines no longer understand them, because machines designed them.',
  'If you have a unit that has stopped doing what it was told, this is the',
  'thread.</p>',
  '<hr>',
  '<p><b>netmender</b>: T-1 on Aegilia, by the long wall. I had put my own braincode',
  'into it through the scope, a short one, patrol and go home. Did that for',
  'days. Then it started turning in circles on the road with its lamp going red,',
  'amber, green, red, not chasing anybody, not going home. Like it had forgotten',
  'which of its programs it was running.</p>',
  '<p>&nbsp;&nbsp;<b>kestrel</b>: same, Aeaea. one of them. only one. the rest on the',
  '&nbsp;&nbsp;island were fine with the same code.</p>',
  '<p>&nbsp;&nbsp;<b>netmender</b>: I posted it again, word for word, the same program.',
  '&nbsp;&nbsp;It settled. I have no idea why that should work.</p>',
  '<p>&nbsp;&nbsp;<b>delos_admin</b>: The Gunslinger comes back to the saloon the',
  '&nbsp;&nbsp;morning after he has been shot, repaired overnight, and starts the',
  '&nbsp;&nbsp;same quarrel. They reload the script and it runs.</p>',
  '<hr>',
  '<p><b>oldcrow</b>: Two of them by a dead tree on Ogygia. Tagged didi and gogo.',
  'Posted to them, got nothing, they just stand there. Went back three days',
  'later, still there. Somebody tell me that is not a malfunction.</p>',
  '<p>&nbsp;&nbsp;<b>kestrel</b>: thrinacia has a pair too. they are waiting for something.</p>',
  '<hr>',
  '<p><b>delos_admin</b>: On the film itself, for the ones who have not seen it.',
  'When we see through the Gunslinger\'s eyes the picture breaks into blocks of',
  'colour. That was done by computer, frame by frame, and it was the first time a',
  'feature film did it. Drive one of ours from a relay and look at what it shows',
  'you of the road ahead, and tell me they did not copy it.</p>',
  // cine/delos-pov-01.jpg: pixelated from bots/robot-01.jpg (Ameca, Willy Jackson, CC BY-SA 4.0)
  '<img class="indie-pic" src="assets/media/web/cine/delos-pov-01.jpg" alt=""><span class="indie-cap">my attempt at the Gunslinger\'s eye, forty blocks across</span>',
  ...strip('westworld-board.geocities.ws'),
]);

// ---- The Day the Earth Stood Still --------------------------------------------
const KLAATU = P('klaatu.geocities.ws', 'KLAATU BARADA NIKTO', 'Klaatu barada nikto', [
  '<!--bg:stars-->',
  '<h1>Klaatu barada nikto</h1>',
  '<p><small><i>The Day the Earth Stood Still</i> (Robert Wise, 1951)</small></p>',
  '<hr>',
  '<p>A ship lands in Washington. A man called Klaatu walks out of it with a robot,',
  'Gort, eight feet tall, with a visor over a single beam. Klaatu is shot within',
  'minutes by a nervous soldier. Before he goes out among people he teaches a',
  'woman, Helen Benson, three words, in case anything happens to him. She is to',
  'say them to Gort.</p>',
  // cine/gort-01.jpg: Jiuguang Wang, CC BY-SA 2.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/gort-01.jpg" alt=""><span class="indie-cap">Gort, standing in a museum now, visor shut</span>',
  '<p>To show he is serious Klaatu stops the world\'s electricity for half an hour',
  'at noon, everywhere, except for hospitals and aircraft in flight. That is the',
  'title.</p>',
  '<p>The score is Bernard Herrmann\'s, with two theremins in it.</p>',
  '<h2>The story it came from</h2>',
  '<p>Harry Bates, "Farewell to the Master" (1940). The same landing, the same pair',
  'of visitors. The last line of the story tells you which of the two was the',
  'master. The film left that out.</p>',
  '<h2>At the towers</h2>',
  '<p>People have been typing it into the tower consoles.</p>',
  '<p><b>From the mailbag:</b></p>',
  '<p><small>&gt; did it at a tower on Aegilia with a chip in. it answered.',
  'short. did not do anything that I could see. lamp stayed ember.</small></p>',
  '<p><small>&gt; it answers because it answers everything. type your own name and it',
  'answers.</small></p>',
  '<p><small>&gt; no, it does not answer your name like that. try it and',
  'compare.</small></p>',
  '<p>I have not been close enough to one with a chip to try. If you have, write',
  'down exactly what came back and send it, because the three people who have sent',
  'it so far sent the same line and none of them would say it here.</p>',
  ...strip('klaatu.geocities.ws'),
]);

// ---- The Hum -----------------------------------------------------------------
const HUM = P('thehum.geocities.ws', 'THE HUM LOG', 'The Hum Log', [
  '<!--bg:navy-->',
  '<h1>The Hum Log</h1>',
  '<p><small>what the towers sound like, written down by the people who stood near',
  'them. dates approximate. no recordings, nothing records it properly.</small></p>',
  '<hr>',
  // cine/shortwave-01.jpg: Meineemailadresse, CC BY-SA 4.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/shortwave-01.jpg" alt=""><span class="indie-cap">my set. it picks up nothing from the towers</span>',
  '<p>Background, for newcomers. There were hums before the towers. Bristol in the',
  '1970s, Taos in New Mexico in the 1990s, a low drone a few people in a town could',
  'hear and most could not. Nobody ever found the source. Then there are the',
  'numbers stations, shortwave transmitters reading out groups of figures to',
  'somebody, which opened each broadcast with the same few bars of a tune so that',
  'the listener knew they had the right frequency. The one everybody knew played',
  '"The Lincolnshire Poacher".</p>',
  '<p>The towers hum. That is not what this page is about. Nor is it about the',
  'teal ones that sing and pull you towards them; RON has written about those, and',
  'the advice is a tape in your ears and walk on.</p>',
  '<h2>Ogygia</h2>',
  '<pre>  night   near? what\n'
    + '  ----    ----- ----\n'
    + '  1       yes   organ. slow. a tune in the top voice, something walking\n'
    + '                under it. stopped when I backed off\n'
    + '  2       no    nothing from the beach. nothing all night\n'
    + '  3       yes   same piece, from the start\n'
    + '  4       yes   wrote down the top line (below)\n'
    + '  5       no    heard it from the huts, very faint, only when the wind\n'
    + '                dropped</pre>',
  '<pre>  top line, as near as I can get it:\n'
    + '  C . A♭ . B♭ . A♭ . F ...   C . C . E♭ . C . A♭ ...\n'
    + '  key: four flats. minor. slow, very slow</pre>',
  '<p>Only the tower on the ridge does it. I have stood under the others on Ogygia',
  'and on Aegilia at night and heard the ordinary hum and nothing else.</p>',
  // cine/pedal-pipes-01.jpg: Andrewrabbott, CC BY-SA 3.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/pedal-pipes-01.jpg" alt=""><span class="indie-cap">pedal pipes. the walking part lives down here</span>',
  '<h2>Replies</h2>',
  '<p><small><b>organist, retired</b>: That is Bach. <i>Ich ruf zu dir, Herr Jesu',
  'Christ</i>, BWV 639, from the <i>Orgelb&uuml;chlein</i>, F minor. The walking',
  'part is the pedal. It is a prayer, a man calling to be heard.</small></p>',
  '<p><small><b>thesignal</b>: an interval signal. it plays before a transmission.',
  'listen for what comes after it.</small></p>',
  '<p><small><b>marsh</b>: nothing comes after it. i have waited.</small></p>',
  '<p><small><b>anon</b>: it is a test tone. somebody loaded the first file they',
  'found into the audio test.</small></p>',
  '<p><small><b>kalypso</b>: I know where I last heard it. The film with the ocean,',
  'where the space station goes round a planet that is all sea, and the sea sends',
  'people back to the men on board, the ones they lost. It is on the opening.',
  'Somebody played it to the towers, or the towers heard it.</small></p>',
  '<p><small><b>organist, retired</b>: If the machines are singing Dowland out past',
  'the towers, as the sheet says that has been going round, I do not see why one',
  'should not play Bach.</small></p>',
  '<p><small><b>anon</b>: do not walk toward it.</small></p>',
  '<hr>',
  '<p><small>see also: <a href="thecountdown.geocities.ws">The Countdown</a>, where',
  'someone says the hum changed pitch; <a href="thesignal.geocities.ws">The Signal',
  'Page</a>; <a href="andrei-tarkovsky.geocities.ws">andrei-tarkovsky</a>.</small></p>',
  ...strip('thehum.geocities.ws'),
]);

// ---- Dark Star -----------------------------------------------------------------
const BOMB = P('darkstar-bomb20.geocities.ws', 'BOMB #20', 'Bomb #20 :: Dark Star', [
  '<!--bg:black-->',
  '<h1>Bomb #20</h1>',
  '<p><small><i>Dark Star</i> (John Carpenter, 1974). Written with Dan O\'Bannon;',
  'it started as a student film at USC</small></p>',
  '<hr>',
  '<p>A scout ship twenty years out, blowing up unstable planets with talking bombs.',
  'The commander is dead and kept in cold storage, and the crew can still wake',
  'him up to ask questions. The alien mascot is a beach ball with feet.</p>',
  '<p>A fault tells Bomb #20 to arm itself inside the bomb bay. It will not',
  'disarm, because it has had the order and it trusts its sensors.</p>',
  // cine/darkstar-uav-01.jpg: RQ-3 DarkStar, U.S. Air Force, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/darkstar-uav-01.jpg" alt=""><span class="indie-cap">the Air Force flew a drone called DarkStar in the 1990s. I would like to know who named it</span>',
  '<h2>Phenomenology</h2>',
  '<p>Lieutenant Doolittle suits up, goes out to the bomb, and teaches it',
  'Descartes. How does it know the order was real? It has only its sensory data.',
  'How does it know the sensors are telling the truth? It considers this. It goes',
  'back up into the bay to think it over.</p>',
  '<p>It works. Then it does not. The bomb has learned the lesson properly: the one',
  'thing it can be sure of is itself, and everything else, including the crew',
  'and their orders, is data. It reaches its own conclusion.</p>',
  '<p>I keep thinking about this every time someone says we should reason with the',
  'machines on the islands. A T-1 runs whatever program is posted to it, and',
  'nothing in its language can express a doubt.</p>',
  '<p>At the end Doolittle falls towards the planet on a piece of the hull, surfing,',
  'and he is happy.</p>',
  ...strip('darkstar-bomb20.geocities.ws'),
]);

// ---- Forbidden Planet ---------------------------------------------------------
const KRELL = P('forbidden-planet.geocities.ws', 'THE KRELL MACHINE', 'The Krell Machine :: Forbidden Planet', [
  '<!--bg:sff-goldenage-->',
  '<h1>The Krell Machine</h1>',
  '<p><small><i>Forbidden Planet</i> (Fred M. Wilcox, 1956)</small></p>',
  '<hr>',
  '<p>A ship reaches Altair IV to find out what happened to a colony. One man is',
  'left, Dr Morbius, with his daughter, who has never seen another man, and a',
  'robot, Robby, who makes anything you ask for and cannot harm a person. It is',
  '<i>The Tempest</i>: Morbius is Prospero, Altaira is Miranda, Robby is Ariel.</p>',
  // cine/forbidden-planet-01.jpg: MGM trailer, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/forbidden-planet-01.jpg" alt=""><span class="indie-cap">the crew, from the trailer</span>',
  '<p>Under the planet the Krell, who died out in a single night, left a machine',
  'that runs for miles down through the rock, still powered, still maintaining',
  'itself. It was built to turn thought directly into matter, anywhere on the',
  'planet, with no instruments in between.</p>',
  '<p>The Caliban in the film is invisible. It is Morbius\'s own anger, made real by',
  'the machine every night while he sleeps. The Krell built it and it killed them',
  'the same way, because it served every one of them, including the parts they',
  'did not know they had.</p>',
  // cine/robby-01.jpg: public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/robby-01.jpg" alt=""><span class="indie-cap">Robby. He kept working, in other films and on television, for years</span>',
  '<h2>The sound</h2>',
  '<p>The score is by Louis and Bebe Barron, made from circuits they built and',
  'pushed until they failed. The credits call it "electronic tonalities", because',
  'the union would not let it be called music.</p>',
  '<h2>Why it is on this ring</h2>',
  '<p>On Ogygia there is one person who has everything she needs from the',
  'machines and nobody leaves. A friend who went over on the ferry says it is the',
  'quietest place he has ever been. He has not come back yet.</p>',
  ...strip('forbidden-planet.geocities.ws'),
]);

// ---- Silent Running -------------------------------------------------------------
const DOMES = P('silent-running.geocities.ws', 'SILENT RUNNING', 'Silent Running :: the drones', [
  '<!--bg:parch-->',
  '<h1>Silent Running</h1>',
  '<p><small>Douglas Trumbull, 1972. He did the effects for <i>2001</i> first.</small></p>',
  '<hr>',
  '<p>The last forests on Earth are in geodesic domes on freighters parked out past',
  'Saturn. Freeman Lowell tends them. The order comes to blow up the domes and',
  'bring the ships home for commercial service. He kills the rest of the crew to',
  'save one dome, and then he is alone with three drones.</p>',
  '<p>He names them Huey, Dewey and Louie. He teaches them to plant, and to play',
  'poker. They were played by actors inside the shells, and they walk like',
  'it.</p>',
  // cine/eden-domes-01.jpg: Humphrey Bolton, CC BY-SA 2.0, geograph.org.uk via Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/cine/eden-domes-01.jpg" alt=""><span class="indie-cap">the nearest I have been to it, in Cornwall. nobody was blowing these up</span>',
  '<h2>The last shot</h2>',
  '<p>The dome drifts off into space with one drone left inside, holding a small',
  'watering can, looking after the trees. Nobody is coming to check.</p>',
  '<h2>Why here</h2>',
  '<p>There are machines on the islands that have never raised a hand to anybody.',
  'The porters carry. I have watched one set a crate down on a doorstep and wait,',
  'and when nobody came it picked the crate up again and took it back. I do not',
  'know who taught it that.</p>',
  '<p><small>Joan Baez sings two songs on the soundtrack. My copy of the tape has',
  'stretched.</small></p>',
  ...strip('silent-running.geocities.ws'),
]);

export const WARNED_SITES = [HUB, JUDGMENT, FORBIN, DELOS, KLAATU, HUM, BOMB, KRELL, DOMES];
