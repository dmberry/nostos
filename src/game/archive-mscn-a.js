// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// BATCH music-A — jazz & blues scenes and labels.
//
// Fan pages kept on a free host by crate-diggers and scene historians, each
// ABOUT a scene, a genre or a label and never in a single artist's voice. A
// bebop primer with the full kit; a Delta blues shrine; a New Orleans scene
// page; a Blue Note label write-up; a free-jazz close-listen; a Chicago
// electric-blues page. The dates, places and catalogue facts are real; the
// enthusiasm and the crate-digger grudges are the fans'.

const P = (dom, name, title, body) => ({ domain: dom, name, title, body });

// ---- bebop: the showpiece scene primer --------------------------------------

const BEBOP = P('bebop.geocities.ws', 'BEBOP',
  'BEBOP // Minton\'s and the birth of modern jazz', [
    '<!--bg:music-jazz-->',
    '<h1>BEBOP</h1>',
    '<p><small>a primer on the music that broke jazz open, kept by a life-long',
    'record-shop haunter who has worn out three copies of the same 78s. tape',
    'traders welcome, corrections welcome, arguments especially welcome. — Sal</small></p>',
    '<p class="fs-epi">"They can steal my ideas, but they can\'t steal my fingers."<br>',
    '— Charlie Parker (as the story is told)</p>',
    '<hr>',
    '<p>Bebop is where jazz stopped being dance music and became something you sat',
    'down and listened to. It happened in New York in the early-to-mid 1940s, and',
    'the room everyone points to is Minton\'s Playhouse, a club up in Harlem where',
    'the house band ran after-hours jam sessions and the young players came to try',
    'things the big swing orchestras would never let them try. Out of those nights',
    'came a music of fast tempos, altered chords, and long winding melodic lines',
    'that followed the harmony rather than the tune everyone knew.</p>',
    '<p>The names you need are four. Charlie Parker on alto saxophone, whose',
    'imagination and speed set the vocabulary. Dizzy Gillespie on trumpet, who',
    'could match him and had the theory to write it all down. Thelonious Monk at',
    'the piano, the strangest and most patient harmonist of the lot. And Kenny',
    'Clarke on drums, who moved the time-keeping up onto the ride cymbal and freed',
    'the bass drum for accents, the "dropping bombs" that gave the new music its',
    'nervy forward lean. Others came fast behind them, Bud Powell, Max Roach,',
    'Fats Navarro, but those four are the root of it.</p>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/charlie-parker-01.jpg" alt=""><span class="indie-cap">Charlie Parker, 1947 (photo: William P. Gottlieb, public domain)</span>',
    '<blockquote class="fs-quote"><p>The idea was to play the changes, not the',
    'melody. Take a tune everybody could hum, keep its chords, throw the tune',
    'away, and build a brand new line on top. Half the bebop repertoire is exactly',
    'this: fresh heads written over the harmony of old standards, so the copyright',
    'stayed with the boppers and the dance-band leaders were left out.</p></blockquote>',
    '<p>Why did it feel like such a break. Swing was an industry, arranged for big',
    'bands and built for the floor. Bebop was small-group music, four or five',
    'players, written by and for the improviser, and it did not care whether you',
    'could dance to it. That was partly the point. These were serious musicians',
    'reclaiming the music as an art to be heard, on their own terms, in their own',
    'rooms, at their own tempo.</p>',
    '<div class="fs-aside"><p><b>Did you know?</b> The word "bebop" is usually',
    'traced to the sound of the music itself, the clipped two-note phrase that',
    'ends a fast line. Nobody agreed on the spelling for years, and you will see',
    'it written bebop, bop, and rebop on records from the period. Gillespie tended',
    'to just call it "modern music".</p></div>',
    '<p>Here is a short essential-sides list to start you off. Track down the',
    'original small-label sides where you can, on Savoy and Dial especially, and',
    'do not settle for a muddy later reissue if a clean transfer exists.</p>',
    '<pre>ESSENTIAL SIDES (a starter crate)\n'
    + '  Charlie Parker    "Ko-Ko"                Savoy, 1945\n'
    + '  Charlie Parker    "Now\'s the Time"        Savoy, 1945\n'
    + '  Dizzy Gillespie   "Salt Peanuts"          Guild, 1945\n'
    + '  Dizzy Gillespie   "A Night in Tunisia"    (written c.1942)\n'
    + '  Charlie Parker    "Ornithology"           Dial, 1946\n'
    + '  Thelonious Monk   "\'Round Midnight"        (comp. Monk, 1940s)\n'
    + '  Bud Powell        "Un Poco Loco"          Blue Note, 1951</pre>',
    '<p class="fs-pull">Fast tempos, altered chords, and a room that would let you',
    'try them. That is the whole recipe, and nobody has improved on it.</p>',
    '<p>And a rough family-tree, so you can see where the music came from and where',
    'it went next. Follow the arrows down.</p>',
    '<pre>SCENE FAMILY-TREE\n'
    + '  New Orleans collective jazz (1910s-20s)\n'
    + '        |\n'
    + '  Swing / the big bands (1930s)\n'
    + '        |\n'
    + '  the Minton\'s after-hours sessions (early 1940s)\n'
    + '        |\n'
    + '  BEBOP  ---> Parker, Gillespie, Monk, Clarke\n'
    + '        |\n'
    + '        +--> cool jazz (late 1940s)\n'
    + '        +--> hard bop (mid 1950s)\n'
    + '        +--> free jazz (1960)</pre>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/thelonious-monk-01.jpg" alt=""><span class="indie-cap">Thelonious Monk, 1947 (photo: William P. Gottlieb, public domain)</span>',
    '<p>Where to go from here on this ring. If you want to hear what bebop grew',
    'out of, the collective New Orleans style is the ancestor, and it is written',
    'up over at <a href="new-orleans-jazz.geocities.ws">new-orleans-jazz</a>. If',
    'you want to hear where the boppers went to work in the studio in the decade',
    'after, the label that recorded so many of them is at',
    '<a href="blue-note-records.geocities.ws">blue-note-records</a>. Start with',
    'Parker, then follow either arrow.</p>',
    '<hr>',
    '<p><small>counter: 03318 · best viewed in Netscape at 800x600 · now playing:',
    'Dial 1010 · this crate is always under construction · last updated 24 Mar</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

// ---- the Delta blues: primer / fan shrine -----------------------------------

const DELTA_BLUES = P('the-delta-blues.geocities.ws', 'DELTA BLUES',
  'THE DELTA BLUES // where it all comes from', [
    '<!--bg:music-jazz-->',
    '<h1>THE DELTA BLUES</h1>',
    '<p><small>a shrine to the country blues of the Mississippi Delta, kept by',
    'somebody who drove the whole of Highway 61 with a box of cassettes and came',
    'back changed. this page is my thank-you note. — R.L.</small></p>',
    '<p class="fs-epi">"The blues had a baby and they named it rock and roll."<br>',
    '— an old saying, often laid at Muddy Waters\' door</p>',
    '<hr>',
    '<p>If you go looking for the root of nearly all popular music of the century,',
    'you keep arriving at the same flat, hot stretch of northwest Mississippi, the',
    'Delta, the cotton country between the Yazoo and the river. This is where the',
    'country blues took the shape we know: one singer, one guitar, a bottleneck',
    'slid along the strings for that crying voice-like tone, and a lyric of trouble,',
    'travel, and want. It was made on porches and in juke joints long before anyone',
    'wrote it down, and the recordings we have are a thin, precious skim off the',
    'top of an enormous living tradition.</p>',
    '<p>The three names carved deepest are Charley Patton, Son House, and Robert',
    'Johnson. Patton was the older man, a fierce, rhythmic performer from around',
    'Dockery Plantation, the closest thing the Delta had to a founding star. Son',
    'House was the preacher-turned-bluesman whose slide playing and huge voice',
    'carried the sacred and the profane in one breath. And Robert Johnson, younger',
    'than both and dead at 27 in 1938, left just 29 songs and became the legend the',
    'whole thing now hangs on.</p>',
    '<div class="fs-aside"><p><b>About that crossroads.</b> The story that Robert',
    'Johnson met the devil at a midnight crossroads and traded his soul for his',
    'gift is a good story and it is not history. It grafts an older folk motif onto',
    'a young man who, by the plain account of the people who knew him, simply went',
    'away, practised ferociously, and came back playing rings round everyone.',
    'Enjoy the legend, but credit the work.</p></div>',
    '',
    '<p>Most of what survives was cut in a few short sessions in the late 1920s and',
    'the 1930s, often for the "race records" catalogues of labels like Paramount,',
    'and Johnson\'s own sides were recorded in makeshift rooms in San Antonio and',
    'Dallas in 1936 and 1937. The sound is close, dry, and startling. Once you have',
    'heard the real thing, every later blues you know reveals its parentage.</p>',
    '<p>Two directions on this ring. When the Delta players followed the Great',
    'Migration north and plugged in, the country blues became the electric blues of',
    'the city, and that story is at',
    '<a href="chicago-blues.geocities.ws">chicago-blues</a>. And if you want to hear',
    'the other great river music of the same years, the jazz that came up out of',
    'Louisiana, it is at',
    '<a href="new-orleans-jazz.geocities.ws">new-orleans-jazz</a>. Same river,',
    'different mouth.</p>',
    '<hr>',
    '<p><small>hits: 01192 · best viewed at 800x600 · tape traders welcome, i have',
    'dubs of the Paramount sides · last updated 8 Feb · 61 forever</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

// ---- New Orleans jazz: ORG / scene page -------------------------------------

const NEW_ORLEANS_JAZZ = P('new-orleans-jazz.geocities.ws', 'N.O. JAZZ',
  'NEW ORLEANS JAZZ // Storyville and the birthplace', [
    '<!--bg:music-jazz-->',
    '<h1>NEW ORLEANS JAZZ</h1>',
    '<p><small>a page for the birthplace, maintained on behalf of a small',
    'appreciation society that meets over coffee and old 78s. new members and',
    'polite disagreements both welcome. — the secretary</small></p>',
    '<hr>',
    '<p>Jazz was not invented by one person on one day, but if it has a birthplace',
    'the whole world agrees on, it is New Orleans in the years around 1910 to the',
    '1920s. The city had the ingredients nowhere else had all together: the brass',
    'bands and the funeral marches, the dance halls, the Caribbean rhythms that came',
    'up through the port, the blues drifting in from the country, and a musical',
    'culture that mixed Creole training with field-learned feeling. Out of that came',
    'the collective, improvised, front-line-and-rhythm sound we call New Orleans, or',
    'traditional, or hot jazz.</p>',
    '<div class="fs-aside"><p><b>What "collective improvisation" means.</b> In the',
    'classic New Orleans front line the cornet carries the tune, the clarinet weaves',
    'a busy line above it, and the trombone slides underneath, all improvising at',
    'once around the same melody. It is not solo after solo, it is three voices in',
    'conversation. Learning to hear the three lines at once is the whole pleasure.</p></div>',
    '<p>The scene had its own geography. Storyville, the city\'s legal red-light',
    'district from 1897 until the navy closed it in 1917, is often named as a cradle',
    'of the music, and while the tale is tidier than the truth, the district\'s halls',
    'and saloons certainly gave working musicians steady employment. When Storyville',
    'shut and the riverboats and the northward trains beckoned, the music travelled,',
    'and by the 1920s its greatest players were making history in Chicago and New',
    'York.</p>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/louis-armstrong-01.jpg" alt=""><span class="indie-cap">Louis Armstrong (NY World-Telegram, public domain)</span>',
    '<p>Three figures anchor the story. King Oliver, the cornet king whose Creole',
    'Jazz Band cut landmark sides in 1923. Jelly Roll Morton, the boastful,',
    'brilliant pianist and composer who was among the first to write serious jazz',
    'arrangements down, and who claimed, not entirely seriously, to have invented',
    'the music himself. And Louis Armstrong, Oliver\'s young protege, who took the',
    'collective style and, with his Hot Five and Hot Seven recordings of the later',
    '1920s, turned jazz into a soloist\'s art and changed everything that followed.</p>',
    '<p>Where to go next on the ring. The soloist\'s revolution Armstrong began was',
    'carried, two decades on, to its most radical extreme by the young players who',
    'made bebop, written up at <a href="bebop.geocities.ws">bebop</a>. And the other',
    'great vernacular music rising in the same years, the country blues of',
    'Mississippi, is at <a href="the-delta-blues.geocities.ws">the-delta-blues</a>.</p>',
    '<hr>',
    '<p><small>visitors: 00648 · best viewed at 800x600 · we meet first Thursdays ·',
    'page last tended 15 Jan · a webring for diggers, do join</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

// ---- Blue Note: label profile / discography ---------------------------------

const BLUE_NOTE = P('blue-note-records.geocities.ws', 'BLUE NOTE',
  'BLUE NOTE RECORDS // the finest in jazz since 1939', [
    '<!--bg:music-jazz-->',
    '<h1>BLUE NOTE RECORDS</h1>',
    '<p><small>a discographer\'s tribute to the greatest jazz label there ever was,',
    'kept by someone who catalogues by matrix number and is not ashamed. want-list',
    'and duplicate-list both on request. — the compiler</small></p>',
    '<hr>',
    '<p>Blue Note was founded in New York in 1939 by two German emigres, Alfred Lion',
    'and, soon after, his boyhood friend the photographer Francis Wolff, both refugees',
    'from the Nazis who happened to love this American music more than most Americans',
    'did. That love is the whole story of the label. They paid for rehearsals, which',
    'almost no one else did. They let the musicians choose the material. And they',
    'treated a jazz record as an object worth making beautifully.</p>',
    '<p>The house sound arrived in the 1950s and 60s with the classic hard-bop',
    'roster, and it depended on two craftsmen behind the artists. Rudy Van Gelder,',
    'the engineer, recorded most of the great sessions first in his parents\' living',
    'room in Hackensack and then in his own studio in Englewood Cliffs, New Jersey,',
    'and his warm, present, unmistakable sound is half of what "Blue Note" means to',
    'the ear. And Reid Miles, the designer, gave the covers their look, the bold',
    'type, the tint-block photographs from Wolff\'s own camera, the cool modernist',
    'grid that record collectors would know at forty paces.</p>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/saxophone-01.jpg" alt=""><span class="indie-cap">A saxophone (photo: Sally V, CC BY-SA 4.0)</span>',
    '<p>The famous run is the 4000 series, the twelve-inch catalogue that carried',
    'the label through its golden age. A tiny core sample, to show the shape of it:</p>',
    '<pre>THE 4000 SERIES (a few landmarks)\n'
    + '  BLP 4003   Lee Morgan            Candy               (1958)\n'
    + '  BLP 4008   Art Blakey            Moanin\'             (1958)\n'
    + '  BLP 4021   Horace Silver         Blowin\' the Blues Away (1959)\n'
    + '  BLP 4157   Herbie Hancock        Takin\' Off          (1962)\n'
    + '  BLP 4163   Dexter Gordon         Go                  (1962)\n'
    + '  BLP 4195   Lee Morgan            The Sidewinder      (1963)\n'
    + '  BLP 4247   Eric Dolphy           Out to Lunch!       (1964)</pre>',
    '<p>Collectors\' shorthand, so you can read a dealer\'s listing without being',
    'fleeced. The deep-groove pressings, the "ear" stamped in the runout by the',
    'plant, the Lexington Avenue and then West 63rd Street addresses on the label:',
    'each dates a pressing, and each moves the price. Learn the runout before you',
    'spend.</p>',
    '<p>Two stops on the ring. To hear the music the label\'s first generation grew',
    'up making, go to <a href="bebop.geocities.ws">bebop</a>. And to hear where the',
    'label went at its most adventurous, when it recorded the New Thing right at the',
    'edge, follow the horns out to <a href="free-jazz.geocities.ws">free-jazz</a>.</p>',
    '<hr>',
    '<p><small>counter: 02051 · best viewed at 800x600 · catalogued in a shoebox and',
    'a spreadsheet · last updated 2 Apr · Van Gelder stamp or it did not happen</small></p>',
    '<p><small>visitors: 04127 · best viewed at 800x600 · sleeve notes typed up from the originals</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

// ---- free jazz: close-listening page ----------------------------------------

const FREE_JAZZ = P('free-jazz.geocities.ws', 'FREE JAZZ',
  'FREE JAZZ // the New Thing, listened to closely', [
    '<!--bg:music-jazz-->',
    '<h1>FREE JAZZ</h1>',
    '<p><small>a close-listening page for the music that scared everybody, by a',
    'listener who was scared too at first and then could not stop. put the record',
    'on loud and read along. — a convert</small></p>',
    '<hr>',
    '<p>Free jazz is the music that let go of the chord changes. Everything before',
    'it, from New Orleans through bebop, moved over a repeating harmonic map, and',
    'the improviser\'s job was to navigate that map beautifully. Around 1960 a group',
    'of players decided the map itself was the cage, and stepped off it, toward a',
    'music organised by feeling, timbre, and collective listening rather than by a',
    'fixed harmony and a fixed metre.</p>',
    '<p>The record that named it was Ornette Coleman\'s <i>Free Jazz: A Collective',
    'Improvisation</i>, cut in December 1960 with a double quartet, two bands in the',
    'two stereo channels playing at once. Listen for how the ensemble passages are',
    'not chaos: a soloist leads, the others comment, textures thicken and thin, and',
    'the whole thing breathes as a group even with the harmony gone. Ornette\'s plain',
    'crying alto tone is the thread to hold onto on a first hearing.</p>',
    '<blockquote class="fs-quote"><p>Coltrane\'s <i>Ascension</i> (1965) does the same',
    'thing with a bigger, hotter band, waves of collective playing broken by solos.',
    'Come to it after the Ornette. Where Coleman is dry and skipping, Coltrane is a',
    'flood, and the two records make the clearest pair of doors into the New Thing.</p></blockquote>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/ornette-coleman-01.jpg" alt=""><span class="indie-cap">Ornette Coleman (photo: Michael Hoefner, CC BY 3.0)</span>',
    '<p>Two more you must sit with. Cecil Taylor took the piano, the most harmonic',
    'instrument in jazz, and played it as tuned percussion, dense clusters and',
    'terrific physical energy, so that harmony dissolves into pure attack and',
    'motion. Start with <i>Unit Structures</i> (1966) and give it room. And Albert',
    'Ayler brought the widest, most vocal saxophone tone in the music, built from',
    'hymns, marches, and folk melody screamed and split into overtones. <i>Spiritual',
    'Unity</i> (1964) is short and overwhelming. Listen for the simple tune under the',
    'roar; it is nearly always there.</p>',
    '<p>How to listen, in one paragraph. Stop waiting for the chord to resolve,',
    'because it will not, and there is no wrong note where there is no key. Follow',
    'the tone instead, the grain of a single voice, and follow the conversation',
    'between the players, who is answering whom. The order is emotional and textural,',
    'not harmonic, and once your ear accepts that, the music opens.</p>',
    '<p>Two neighbours on the ring. The label that recorded a good deal of this',
    'edge, and pushed its own roster right up to it, is at',
    '<a href="blue-note-records.geocities.ws">blue-note-records</a>. And to hear the',
    'harmonic tradition these players were reacting against at its most intense, go',
    'back to <a href="bebop.geocities.ws">bebop</a> and hear the cage they chose to',
    'leave.</p>',
    '<hr>',
    '<p><small>counter: 00889 · best viewed at 800x600 · played loud on purpose ·',
    'last updated 19 May · the New Thing is not noise, sit with it</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

// ---- Chicago blues: ORG / scene page ----------------------------------------

const CHICAGO_BLUES = P('chicago-blues.geocities.ws', 'CHICAGO BLUES',
  'CHICAGO BLUES // the Delta went electric', [
    '<!--bg:music-jazz-->',
    '<h1>CHICAGO BLUES</h1>',
    '<p><small>a scene page for the electric blues of the South Side, kept by a',
    'regular who has stood at the front of more Chess-alumni gigs than is probably',
    'good for the ears. requests and corrections both taken. — the doorman</small></p>',
    '<hr>',
    '<p>The Chicago blues is what happened when the Mississippi Delta got on the',
    'train. Through the Great Migration, the decades in which hundreds of thousands',
    'of Black Southerners moved north for work, the country blues came to the',
    'industrial city, and in the noise of the South Side clubs the lone acoustic',
    'guitar was not enough. So the music plugged in. The band grew: electric guitar,',
    'harmonica pushed through a cheap amp until it snarled, piano, bass, and above',
    'all drums. The result was loud, urban, ensemble blues, and it was the direct',
    'road to rock and roll.</p>',
    '<div class="fs-aside"><p><b>The house that Chess built.</b> Founded by two',
    'brothers, Leonard and Phil Chess, on the South Side, Chess Records became the',
    'address for this sound in the 1950s. Much of the label\'s greatest work leaned',
    'on one staff songwriter and bassist, Willie Dixon, who wrote a remarkable share',
    'of the standards the whole genre still plays, and who anchored the sessions on',
    'the bottom end.</p></div>',
    '<img class="indie-pic" src="assets/media/web/music-scenes/muddy-waters-01.jpg" alt=""><span class="indie-cap">Muddy Waters (photo: Jean-Luc Ourlin, CC BY-SA 2.0)</span>',
    '<p>Two giants define the label and the scene. Muddy Waters, born McKinley',
    'Morganfield, came up from Mississippi, was first recorded by the folklorist',
    'Alan Lomax on the plantation, and in Chicago plugged his slide guitar into an',
    'amplifier and became the king of the South Side, the man who more than any',
    'other carried the Delta into the electric age. And Howlin\' Wolf, Chester',
    'Burnett, a huge man with a voice to match, was Muddy\'s great rival on the same',
    'label, wilder and more haunted, and between them they set the two poles the',
    'music still swings between.</p>',
    '<p>Two directions off this ring. To hear where this music came from, the',
    'acoustic country blues of Mississippi that came north and plugged in, go to',
    '<a href="the-delta-blues.geocities.ws">the-delta-blues</a>. And to hear the',
    'other great Black music the northern cities built in these same years, the soul',
    'assembly line up in Detroit, cross over to',
    '<a href="motown.geocities.ws">motown</a>.</p>',
    '<hr>',
    '<p><small>hits: 01476 · best viewed in Netscape at 800x600 · now playing:',
    'Chess 1560 · under construction, more session notes soon · last updated 11 Mar</small></p>',
    '<p><small>[ <a href="music-scenes-ring.geocities.ws">Music Scenes Ring</a> ]</small></p>',
  ]);

export const MSCN_A = [BEBOP, DELTA_BLUES, NEW_ORLEANS_JAZZ, BLUE_NOTE, FREE_JAZZ, CHICAGO_BLUES];
