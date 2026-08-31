// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CACHE: the old public internet, still half-served out of one rack.
//
// A player who finds a browser types youtube.com into it. Of course they do.
// Answering that with "unable to locate the server" is correct and worth
// nothing; answering it with a damaged copy is the whole argument of the game in
// one page, because the old web is exactly the kind of thing that would still be
// running, badly, on hardware nobody switched off.
//
// The fiction, and the reason this is one machine and not a hundred: a caching
// proxy was racked inside the daemon's estate to spare the uplink, and it
// carried on crawling and storing long after there was an uplink to spare. It
// never stopped. So the daemon's own nameserver now answers authoritatively for
// the entire old internet, and every answer it gives points at the same box in
// its own rack. Type any of these and the DNS resolves it properly: it simply
// resolves it HERE.
//
// This also explains the vintages sitting side by side. The browser is older
// than most of what it is showing you: the cache went on collecting for years
// after Navigator stopped being updated, so a 1997 browser renders a page from
// long after 1997, and renders it badly. That mismatch is not an oversight.
//
// Pure data and string building, like net.js: no world, no DOM.

// #143 — THE REFACTOR. This file was 3,925 lines: the whole corpus, the
// universities, the encyclopaedia and every accessor over all of it. It is now
// the FACADE. The corpus lives in four sibling modules and this file composes
// them, keeps the lookups, and re-exports everything it used to export — so no
// caller changed, and archive-links.test.js walks the same surface it always did.
//
//   archive-pic.js       the one helper every cached page uses
//   archive-history.js   the computing-history pages (split earlier, W1)
//   archive-books.js     the catalogue, democracy, the strange ones
//   archive-places.js    homepages, the universities, Brighton, Oslo, London
//   archive-forums.js    economics, lobste.rs, slashdot, r/TheSpiral
//   archive-academia.js  the universities themselves, and their departments
//   archive-wiki.js      the encyclopaedia
//
// ORDER IS PART OF THE DATA. ARCHIVED_SITES is spread in the same sequence the
// single file had, because the directory listing and the category walk both read
// it in order, and a player who has seen the index would notice it reshuffle.

// One cached document long enough to want its own file. See poplog.js.
import { POPLOG_TITLE, POPLOG_BODY } from './poplog.js';
import { HISTORY_SITES } from './archive-history.js';
import { BOOK_SITES } from './archive-books.js';
import { PLACE_SITES } from './archive-places.js';
import { FORUM_SITES } from './archive-forums.js';
import { GEO_SITES } from './archive-geocities.js';
import { PASCAL_SITES } from './archive-pascal.js';   // #193: Turbo Pascal, MATILDA, Mr Mind
import { VENUE_SITES } from './archive-music.js';    // venues, labels, bands
import { BLACK_COUNTRY_SITES } from './archive-blackcountry.js';  // schools, roads, stations
import { MACHINE_SITES } from './archive-machines.js';  // the computers, and PageMaker
import { MEMORY_SITES } from './archive-memory.js';    // the record, and what seems
import { VECTOR_SITES } from './archive-vectors.js';   // maths, languages, and three fan pages
import { SCREEN_SITES } from './archive-screen.js';    // films and television
import { BRIGHTON_SITES } from './archive-brighton.js'; // the town, and the papers
import { LABEL_SITES } from './archive-label.js';      // the paperwork, and the licences
import { THEORY_SITES } from './archive-theory.js';    // theory, the field's history, the poem
import { ESSAY_SITES } from './archive-essays.js';     // one student's coursework, uploaded
import { THINKERS_A } from './archive-thinkers-a.js';   // cyberfeminism & the screen
import { THINKERS_B } from './archive-thinkers-b.js';   // women in computing history
import { THINKERS_C } from './archive-thinkers-c.js';   // feminist STS & science
import { THINKERS_D } from './archive-thinkers-d.js';   // posthumanism, AI & narrative
import { THINKERS_E } from './archive-thinkers-e.js';   // philosophy of technology canon
import { THINKERS_F } from './archive-thinkers-f.js';   // media & information theory
import { THINKERS_G } from './archive-thinkers-g.js';   // politics, speed, simulation, control
import { THINKERS_H } from './archive-thinkers-h.js';   // code, protocol, deep cuts
import { THINKER_RINGS } from './archive-thinkers-hubs.js'; // the overlapping webrings
import { ENDING_PAGES } from './archive-ending.js';     // Kermode, The Sense of an Ending
import { ENGINEERS_A } from './archive-engineers-a.js';   // valve, relay, codebreaking
import { ENGINEERS_B } from './archive-engineers-b.js';   // British computing
import { ENGINEERS_C } from './archive-engineers-c.js';   // big iron / mainframes
import { ENGINEERS_D } from './archive-engineers-d.js';   // silicon: transistor to microprocessor
import { ENGINEERS_E } from './archive-engineers-e.js';   // interaction, graphics, PARC
import { ENGINEERS_F } from './archive-engineers-f.js';   // networks
import { ENGINEERS_G } from './archive-engineers-g.js';   // storage, languages, systems
import { ENGINEERS_H } from './archive-engineers-h.js';   // materiality & the makers left out
import { ENGINEERS_I } from './archive-engineers-i.js';   // Licklider, OLIVER, Alan Kay
import { ENGINEER_RINGS } from './archive-engineers-hubs.js'; // the retrocomputing webrings
import { MUSIC_A } from './archive-music-a.js';   // jazz & the recorded voice
import { MUSIC_B } from './archive-music-b.js';   // the LP & the studio as instrument
import { MUSIC_C } from './archive-music-c.js';   // musique concrete, tape, the Radiophonic
import { MUSIC_D } from './archive-music-d.js';   // Kraftwerk, ambient, the disco machine
import { MUSIC_E } from './archive-music-e.js';   // dub & reggae
import { MUSIC_F } from './archive-music-f.js';   // punk, post-punk, industrial
import { MUSIC_G } from './archive-music-g.js';   // hip-hop, house, techno, the machines
import { MUSIC_H } from './archive-music-h.js';   // the materiality of the format
import { MUSIC_RINGS } from './archive-music-hubs.js'; // the music webrings
import { MSCN_A } from './archive-mscn-a.js'; // jazz & blues scenes
import { MSCN_B } from './archive-mscn-b.js'; // soul, funk & reggae scenes
import { MSCN_C } from './archive-mscn-c.js'; // punk & post-punk scenes
import { MSCN_D } from './archive-mscn-d.js'; // electronic & dance scenes
import { MSCN_E } from './archive-mscn-e.js'; // hip-hop & the sound system
import { MSCN_F } from './archive-mscn-f.js'; // indie labels & the underground
import { MSCN_RINGS } from './archive-mscn-hubs.js'; // the music-scenes webrings
import { SCI_A } from './archive-sci-a.js'; // physics & the cosmos
import { SCI_B } from './archive-sci-b.js'; // matter & the elements
import { SCI_C } from './archive-sci-c.js'; // life & evolution
import { SCI_D } from './archive-sci-d.js'; // medicine & the body
import { SCI_E } from './archive-sci-e.js'; // the women of science
import { SCI_F } from './archive-sci-f.js'; // the laboratory & the institution
import { SCI_RINGS } from './archive-sci-hubs.js'; // the science webrings
import { PARA_A } from './archive-para-a.js'; // UFOs & aliens
import { PARA_B } from './archive-para-b.js'; // cryptids
import { PARA_C } from './archive-para-c.js'; // ghosts & hauntings
import { PARA_D } from './archive-para-d.js'; // conspiracies & lost worlds
import { PARA_E } from './archive-para-e.js'; // the occult & the psychic
import { PARA_F } from './archive-para-f.js'; // the skeptics & the culture
import { PARA_RINGS } from './archive-para-hubs.js'; // the paranormal webrings
import { CINE_A } from './archive-cine-a.js'; // the silent era
import { CINE_B } from './archive-cine-b.js'; // the Hollywood auteurs
import { CINE_C } from './archive-cine-c.js'; // the French & European new waves
import { CINE_D } from './archive-cine-d.js'; // Japanese & Asian cinema
import { CINE_E } from './archive-cine-e.js'; // the modernist masters
import { CINE_F } from './archive-cine-f.js'; // the institutions of film
import { CINE_RINGS } from './archive-cine-hubs.js'; // the world-cinema webrings
import { SFF_A } from './archive-sff-a.js'; // the founders
import { SFF_B } from './archive-sff-b.js'; // the golden age
import { SFF_C } from './archive-sff-c.js'; // the new wave
import { SFF_D } from './archive-sff-d.js'; // cyberpunk
import { SFF_E } from './archive-sff-e.js'; // fantasy & the epic
import { SFF_F } from './archive-sff-f.js'; // the fandom & culture
import { SFF_I } from './archive-sff-i.js'; // Olaf Stapledon
import { SFF_RINGS } from './archive-sff-hubs.js'; // the SF & fantasy webrings
import { SPRT_A } from './archive-sprt-a.js'; // football
import { SPRT_B } from './archive-sprt-b.js'; // boxing
import { SPRT_C } from './archive-sprt-c.js'; // track & the Olympics
import { SPRT_D } from './archive-sprt-d.js'; // bat & racket
import { SPRT_E } from './archive-sprt-e.js'; // motor & endurance
import { SPRT_F } from './archive-sprt-f.js'; // the stadium & the overlooked
import { SPRT_RINGS } from './archive-sprt-hubs.js'; // the sport webrings
import { ARCH_A } from './archive-arch-a.js'; // the modern masters
import { ARCH_B } from './archive-arch-b.js'; // the pioneers
import { ARCH_C } from './archive-arch-c.js'; // brutalism & the postwar
import { ARCH_D } from './archive-arch-d.js'; // the women of architecture
import { ARCH_E } from './archive-arch-e.js'; // the world & the vernacular
import { ARCH_F } from './archive-arch-f.js'; // ideas & the city
import { ARCH_RINGS } from './archive-arch-hubs.js'; // the architecture webrings
import { PHOT_A } from './archive-phot-a.js'; // the pioneers
import { PHOT_B } from './archive-phot-b.js'; // documentary & social
import { PHOT_C } from './archive-phot-c.js'; // art photography
import { PHOT_D } from './archive-phot-d.js'; // photojournalism & war
import { PHOT_E } from './archive-phot-e.js'; // portrait, fashion & street
import { PHOT_F } from './archive-phot-f.js'; // the medium & process
import { PHOT_RINGS } from './archive-phot-hubs.js'; // the photography webrings
import { MYTH_A } from './archive-myth-a.js'; // Greek & Roman
import { MYTH_B } from './archive-myth-b.js'; // Norse & Celtic
import { MYTH_C } from './archive-myth-c.js'; // Egyptian & Mesopotamian
import { MYTH_D } from './archive-myth-d.js'; // Asian & African
import { MYTH_E } from './archive-myth-e.js'; // the Americas & Oceania
import { MYTH_F } from './archive-myth-f.js'; // the study of myth
import { MYTH_G } from './archive-myth-g.js'; // the hybrids
import { MYTH_RINGS } from './archive-myth-hubs.js'; // the mythology webrings
import { CRYP_A } from './archive-cryp-a.js'; // classical ciphers
import { CRYP_B } from './archive-cryp-b.js'; // stream & symmetric
import { CRYP_C } from './archive-cryp-c.js'; // public-key
import { CRYP_D } from './archive-cryp-d.js'; // hashing & integrity
import { CRYP_E } from './archive-cryp-e.js'; // the crypto wars
import { CRYP_F } from './archive-cryp-f.js'; // the seals of this machine
import { CRYP_G } from './archive-cryp-g.js'; // the cryptographers & Agrippa
import { CRYP_RINGS } from './archive-cryp-hubs.js'; // the cryptography webrings
import { MAC_A } from './archive-mac-a.js'; // the languages
import { MAC_B } from './archive-mac-b.js'; // the founders
import { MAC_C } from './archive-mac-c.js'; // the lab & the institution
import { MAC_D } from './archive-mac-d.js'; // the machines
import { MAC_E } from './archive-mac-e.js'; // the hacks
import { MAC_F } from './archive-mac-f.js'; // the ideas & the winter
import { MAC_RINGS } from './archive-mac-hubs.js'; // the Project MAC webrings
import { STUNLAW_SITES } from './archive-stunlaw.js'; // a weblog, on the thing it is inside
import { SELF_GUIDE } from './archive-selfguide.js'; // the guide, as the outside serves it
import { INDIE_A } from './archive-indie-a.js';   // Madchester, baggy, the crossover
import { INDIE_B } from './archive-indie-b.js';   // shoegaze
import { INDIE_C } from './archive-indie-c.js';   // Britpop
import { INDIE_D } from './archive-indie-d.js';   // Sarah, C86, indie-pop
import { INDIE_E } from './archive-indie-e.js';   // the labels + JAMC
import { INDIE_F } from './archive-indie-f.js';   // the bridge out of guitars
import { INDIE_G } from './archive-indie-g.js';   // Warp, electronica, Boards of Canada
import { INDIE_RINGS } from './archive-indie-hubs.js'; // the indie webrings
import { MT_A } from './archive-mt-a.js';   // media theory: British & Canadian foundations
import { MT_B } from './archive-mt-b.js';   // German media theory, media archaeology
import { MT_C } from './archive-mt-c.js';   // the new-media canon
import { MT_D } from './archive-mt-d.js';   // infrastructure, elemental, deep time
import { MT_E } from './archive-mt-e.js';   // mediation, temporality, the vector
import { MT_F } from './archive-mt-f.js';   // algorithms, data, AI politics
import { MT_G } from './archive-mt-g.js';   // computational aesthetics, cosmotechnics
import { MT_H } from './archive-mt-h.js';   // Sussex computational aesthetics
import { GAMES_A } from './archive-games-a.js';   // arcade golden age
import { GAMES_B } from './archive-games-b.js';   // UK bedroom coders
import { GAMES_C } from './archive-games-c.js';   // UK design, sims, DMA
import { GAMES_D } from './archive-games-d.js';   // US adventure & the parser
import { GAMES_E } from './archive-games-e.js';   // US design canon, sims
import { GAMES_F } from './archive-games-f.js';   // Japanese console
import { GAMES_G } from './archive-games-g.js';   // 90s PC, FPS, 3D
import { GAMES_H } from './archive-games-h.js';   // the open city, 3D solved
import { GAMES_I } from './archive-games-i.js';   // Dani Bunten
import { GAMES_RINGS } from './archive-games-hubs.js'; // the game-maker webrings
import { FS_A } from './archive-fs-a.js';   // Frankfurt School: first-generation core
import { FS_B } from './archive-fs-b.js';   // the exile & political wing
import { FS_C } from './archive-fs-c.js';   // the messianic & aesthetic strand
import { FS_D } from './archive-fs-d.js';   // aesthetics, music, Western-Marxist root
import { FS_E } from './archive-fs-e.js';   // Habermas & the second generation
import { FS_F } from './archive-fs-f.js';   // recognition & the third generation
import { FS_G } from './archive-fs-g.js';   // the fourth generation & the digital
import { FS_H } from './archive-fs-h.js';   // reception, quarrels, the 1960s
import { FS_RINGS } from './archive-fs-hubs.js'; // the Frankfurt School webrings
import { LANG_A } from './archive-lang-a.js';   // language origins
import { LANG_B } from './archive-lang-b.js';   // systems languages
import { LANG_C } from './archive-lang-c.js';   // functional & symbolic
import { LANG_D } from './archive-lang-d.js';   // objects & the practical
import { LANG_E } from './archive-lang-e.js';   // esoteric languages
import { LANG_F } from './archive-lang-f.js';   // the global & non-anglophone
import { LANG_G } from './archive-lang-g.js';   // the stack & the concurrent
import { LANG_H } from './archive-lang-h.js';   // home BASIC & the arguments
import { LANG_RINGS } from './archive-lang-hubs.js'; // the programming-language webrings
import { BOTS_A } from './archive-bots-a.js';   // the test & the first bots
import { BOTS_B } from './archive-bots-b.js';   // the ELIZA critique & rule bots
import { BOTS_C } from './archive-bots-c.js';   // the assistant era
import { BOTS_D } from './archive-bots-d.js';   // the LLM turn
import { BOTS_E } from './archive-bots-e.js';   // the cautionary & critical
import { BOTS_F } from './archive-bots-f.js';   // the institutes & the people
import { BOTS_G } from './archive-bots-g.js';   // companions, therapy, social robots
import { BOTS_H } from './archive-bots-h.js';   // the big questions
import { BOTS_RINGS } from './archive-bots-hubs.js'; // the chatbot webrings
import { AIH_A } from './archive-ai-a.js';   // AI prehistory & cybernetics
import { AIH_B } from './archive-ai-b.js';   // the founding & symbolic AI
import { AIH_C } from './archive-ai-c.js';   // connectionism & statistical ML
import { AIH_D } from './archive-ai-d.js';   // the deep-learning explosion
import { AIH_E } from './archive-ai-e.js';   // transformers & the LLM era
import { AIH_F } from './archive-ai-f.js';   // the critics & the philosophy
import { AIH_G } from './archive-ai-g.js';   // people, places, landmarks
import { AIH_H } from './archive-ai-h.js';   // the timeline & the big questions
import { AIH_I } from './archive-ai-i.js';   // Serbelloni 1972
import { AIH_RINGS } from './archive-ai-hubs.js'; // the history-of-AI webrings
import { PSB_A } from './archive-psb-a.js';       // public service broadcasting
import { PSB_B } from './archive-psb-b.js';       // Marconi, the Literacy Project
import { PSB_RINGS } from './archive-psb-hubs.js'; // the public service ring
import { HOME_A } from './archive-home-a.js';   // the kit era, 1975
import { HOME_B } from './archive-home-b.js';   // the 1977 trinity & 6502
import { HOME_C } from './archive-home-c.js';   // the 8-bit boom
import { HOME_D } from './archive-home-d.js';   // the makers
import { HOME_E } from './archive-home-e.js';   // the 16-bit generation
import { HOME_F } from './archive-home-f.js';   // the IBM PC & the clones
import { HOME_G } from './archive-home-g.js';   // the home-computer culture
import { HOME_H } from './archive-home-h.js';   // the survey & the wars
import { HOME_RINGS } from './archive-home-hubs.js'; // the home-computer webrings
import { PHIL_A } from './archive-phil-a.js';   // the Greeks
import { PHIL_B } from './archive-phil-b.js';   // Hellenistic & the medieval opening
import { PHIL_C } from './archive-phil-c.js';   // the schools to the Renaissance
import { PHIL_D } from './archive-phil-d.js';   // rationalists & empiricists
import { PHIL_E } from './archive-phil-e.js';   // Enlightenment & German Idealism
import { PHIL_F } from './archive-phil-f.js';   // the 19th-century turn
import { PHIL_G } from './archive-phil-g.js';   // phenomenology & analytic foundations
import { PHIL_H } from './archive-phil-h.js';   // the 20th century to 2025
import { PHIL_RINGS } from './archive-phil-hubs.js'; // the philosophy webrings
import { DH_A } from './archive-dh-a.js';   // the founders
import { DH_B } from './archive-dh-b.js';   // text & markup
import { DH_C } from './archive-dh-c.js';   // distant reading
import { DH_D } from './archive-dh-d.js';   // media & interface
import { DH_E } from './archive-dh-e.js';   // tools & method
import { DH_F } from './archive-dh-f.js';   // critique & the global turn
import { DH_RINGS } from './archive-dh-hubs.js'; // the digital-humanities webrings
import { LAB_A } from './archive-lab-a.js';   // the industrial labs
import { LAB_B } from './archive-lab-b.js';   // codebreaking & the first machines
import { LAB_C } from './archive-lab-c.js';   // the AI & cybernetics labs
import { LAB_D } from './archive-lab-d.js';   // media theory & archaeology
import { LAB_E } from './archive-lab-e.js';   // internet, society & critical computing
import { LAB_F } from './archive-lab-f.js';   // hacker clubs & the AI-ethics refuseniks
import { LAB_RINGS } from './archive-lab-hubs.js'; // the research-labs webrings
import { PE_A } from './archive-pe-a.js';   // classical political economy
import { PE_B } from './archive-pe-b.js';   // Marx & the critique
import { PE_C } from './archive-pe-c.js';   // the marginalists
import { PE_D } from './archive-pe-d.js';   // Keynes & the cycle
import { PE_E } from './archive-pe-e.js';   // markets & the counter-revolution
import { PE_F } from './archive-pe-f.js';   // the heterodox & institutional
import { PE_RINGS } from './archive-pe-hubs.js'; // the political-economy webrings
import { LIT_A } from './archive-lit-a.js';   // the realist novel
import { LIT_B } from './archive-lit-b.js';   // the Russian novel
import { LIT_C } from './archive-lit-c.js';   // modernism
import { LIT_D } from './archive-lit-d.js';   // the fantastic & metafiction
import { LIT_E } from './archive-lit-e.js';   // American letters
import { LIT_F } from './archive-lit-f.js';   // gothic, romance & the wide world
import { LIT_G } from './archive-lit-g.js';   // the poetry
import { REL_A } from './archive-rel-a.js';   // scripture & transmission
import { REL_B } from './archive-rel-b.js';   // schisms & neoplatonism
import { REL_RINGS } from './archive-rel-hubs.js'; // the religion webrings
import { VEC_SITES } from './archive-vec.js';  // the Centre for Vector Media
import { SMETHWICK_SITES } from './archive-smethwick.js'; // Smethwick, the brewery, the schools
import { BOARD_SITES } from './archive-boards.js';  // boards, the WELL, CB
import { MAC_G } from './archive-mac-g.js';         // the HIG, OS 9, Logic
import { MISC_H } from './archive-misc-h.js';       // colleges, a dog, mild, the 9
import { DOWNS_SITES } from './archive-downs.js';   // Blackcap, and how to walk
import { NORWAY_SITES } from './archive-norway.js'; // Oslo, the food, the drink, Ibsen
import { MAP_SITES } from './archive-maps.js';    // five people mapping something
import { SWISS_SITES } from './archive-swiss.js';   // Basel and Bern, disagreeing
import { DIALOGUE_SITES } from './archive-dialogues.js'; // eight passages of Plato
import { PROVENANCE_SITES } from './archive-provenance.js'; // the post, and it coming loose
import { LIT_RINGS } from './archive-lit-hubs.js'; // the literature webrings
import { MATH_A } from './archive-math-a.js';   // antiquity & geometry
import { MATH_B } from './archive-math-b.js';   // the calculus
import { MATH_C } from './archive-math-c.js';   // the nineteenth century
import { MATH_D } from './archive-math-d.js';   // foundations & logic
import { MATH_E } from './archive-math-e.js';   // the twentieth century
import { MATH_F } from './archive-math-f.js';   // the singular figures
import { MATH_RINGS } from './archive-math-hubs.js'; // the mathematicians webrings
import { AA_A } from './archive-aa-a.js';   // Negritude & Francophone anticolonial
import { AA_B } from './archive-aa-b.js';   // African liberation & thought
import { AA_C } from './archive-aa-c.js';   // African letters
import { AA_D } from './archive-aa-d.js';   // Indian thought
import { AA_E } from './archive-aa-e.js';   // East Asian philosophy
import { AA_F } from './archive-aa-f.js';   // postcolonial theory
import { AA_RINGS } from './archive-aa-hubs.js'; // the anticolonial webrings
import { SOC_A } from './archive-soc-a.js';   // utopian & cooperative socialism
import { SOC_B } from './archive-soc-b.js';   // Marx, Engels & scientific socialism
import { SOC_C } from './archive-soc-c.js';   // anarchism & libertarian socialism
import { SOC_D } from './archive-soc-d.js';   // social democracy
import { SOC_E } from './archive-soc-e.js';   // revolutionary socialism & the Internationals
import { SOC_F } from './archive-soc-f.js';   // English & guild socialism
import { SOC_RINGS } from './archive-soc-hubs.js'; // the socialism webrings
import { DES_A } from './archive-des-a.js';   // furniture
import { DES_B } from './archive-des-b.js';   // interiors & decorating
import { DES_C } from './archive-des-c.js';   // textiles & rugs
import { DES_D } from './archive-des-d.js';   // landscape & garden
import { DES_E } from './archive-des-e.js';   // fashion
import { DES_F } from './archive-des-f.js';   // schools & movements
import { DES_RINGS } from './archive-des-hubs.js'; // the design webrings
import { ART_A } from './archive-art-a.js';   // Romanticism & landscape
import { ART_B } from './archive-art-b.js';   // Impressionism & after
import { ART_C } from './archive-art-c.js';   // the overlooked women
import { ART_D } from './archive-art-d.js';   // modernism & abstraction
import { ART_E } from './archive-art-e.js';   // American painting
import { ART_F } from './archive-art-f.js';   // visionary & outsider
import { ART_RINGS } from './archive-art-hubs.js'; // the painters webrings
import { COMP_A } from './archive-comp-a.js';   // the Baroque
import { COMP_B } from './archive-comp-b.js';   // the Classical
import { COMP_C } from './archive-comp-c.js';   // the Romantic
import { COMP_D } from './archive-comp-d.js';   // the national schools
import { COMP_E } from './archive-comp-e.js';   // the underplayed women
import { COMP_F } from './archive-comp-f.js';   // the twentieth century
import { COMP_RINGS } from './archive-comp-hubs.js'; // the composers webrings
import { POL_A } from './archive-pol-a.js';   // founders & revolutions
import { POL_B } from './archive-pol-b.js';   // 19th-century statecraft
import { POL_C } from './archive-pol-c.js';   // the parties & campaigns
import { POL_D } from './archive-pol-d.js';   // decolonisation & independence
import { POL_E } from './archive-pol-e.js';   // the Cold War
import { POL_F } from './archive-pol-f.js';   // orators & reformers
import { POL_RINGS } from './archive-pol-hubs.js'; // the statespeople webrings
import { CS_A } from './archive-cs-a.js';   // first-wave cybernetics
import { CS_B } from './archive-cs-b.js';   // British cybernetics
import { CS_C } from './archive-cs-c.js';   // computability & the lambda calculus
import { CS_D } from './archive-cs-d.js';   // the programmers & languages
import { CS_E } from './archive-cs-e.js';   // information & complexity
import { CS_F } from './archive-cs-f.js';   // networks, HCI & the modern reaches
import { CS_RINGS } from './archive-cs-hubs.js'; // the cybernetics & computing webrings
import { GENX_A } from './archive-genx-a.js';   // the cult-film canon
import { GENX_B } from './archive-genx-b.js';   // midnight movies & horror
import { GENX_C } from './archive-genx-c.js';   // the indie & Sundance boom
import { GENX_D } from './archive-genx-d.js';   // the cult directors
import { GENX_E } from './archive-genx-e.js';   // the cult actors
import { GENX_F } from './archive-genx-f.js';   // the scene around the screen
import { GENX_RINGS } from './archive-genx-hubs.js'; // the Gen X screen webrings
import { TV_A } from './archive-tv-a.js';   // cult SF & fantasy
import { TV_B } from './archive-tv-b.js';   // comedy
import { TV_C } from './archive-tv-c.js';   // crime & cop shows
import { TV_D } from './archive-tv-d.js';   // landmark drama
import { TV_E } from './archive-tv-e.js';   // animation
import { TV_F } from './archive-tv-f.js';   // the box & the culture
import { TV_RINGS } from './archive-tv-hubs.js'; // the television webrings
import { COMX_A } from './archive-comx-a.js'; // the graphic-novel canon
import { COMX_B } from './archive-comx-b.js'; // the creators
import { COMX_C } from './archive-comx-c.js'; // underground & alternative
import { COMX_D } from './archive-comx-d.js'; // manga & the global
import { COMX_E } from './archive-comx-e.js'; // the classic strips
import { COMX_F } from './archive-comx-f.js'; // industry & culture
import { COMX_RINGS } from './archive-comx-hubs.js'; // the comics webrings
import { GAME_A } from './archive-game-a.js'; // the arcade golden age
import { GAME_B } from './archive-game-b.js'; // the console wars
import { GAME_C } from './archive-game-c.js'; // the bedroom coders
import { GAME_D } from './archive-game-d.js'; // the designers & auteurs
import { GAME_E } from './archive-game-e.js'; // the landmark games
import { GAME_F } from './archive-game-f.js'; // the scene & industry
import { GAME_RINGS } from './archive-game-hubs.js'; // the games webrings
import { ROAD_SITES } from './archive-roads.js';       // loss, Japan, Wales, the roads
import { NOW_SITES } from './archive-now.js';          // sheds, chips, weights, generations
import { CACHE_SUB, pic } from './archive-pic.js';
import {
  UNIVERSITIES, DEPARTMENTS, universityAt, deptPagesFor, departmentPage,
  universityBody, UNI_BY_DOMAIN,
} from './archive-academia.js';
import { WIKI_ARTICLES, wikiArticle } from './archive-wiki.js';

export { CACHE_SUB, pic };
export {
  UNIVERSITIES, DEPARTMENTS, universityAt, deptPagesFor, departmentPage,
  universityBody,
};
export { WIKI_ARTICLES, wikiArticle };

// The sites written out properly. Each one gets the page it deserves: not a
// stub with its name on, but the specific thing that is broken about it.
export const ARCHIVED_SITES = [
  ...HISTORY_SITES,
  ...BOOK_SITES,
  ...PLACE_SITES,
  ...FORUM_SITES,
  ...GEO_SITES,
  ...PASCAL_SITES,
  ...VENUE_SITES,
  ...BLACK_COUNTRY_SITES,
  ...MACHINE_SITES,
  ...MEMORY_SITES,
  ...VECTOR_SITES,
  ...SCREEN_SITES,
  ...BRIGHTON_SITES,
  ...LABEL_SITES,
  ...THEORY_SITES,
  ...ESSAY_SITES,
  ...THINKERS_A, ...THINKERS_B, ...THINKERS_C, ...THINKERS_D,
  ...THINKERS_E, ...THINKERS_F, ...THINKERS_G, ...THINKERS_H,
  ...THINKER_RINGS, ...ENDING_PAGES,
  ...ENGINEERS_A, ...ENGINEERS_B, ...ENGINEERS_C, ...ENGINEERS_D,
  ...ENGINEERS_E, ...ENGINEERS_F, ...ENGINEERS_G, ...ENGINEERS_H, ...ENGINEERS_I,
  ...ENGINEER_RINGS,
  ...MUSIC_A, ...MUSIC_B, ...MUSIC_C, ...MUSIC_D,
  ...MUSIC_E, ...MUSIC_F, ...MUSIC_G, ...MUSIC_H,
  ...MUSIC_RINGS,
  ...MSCN_A, ...MSCN_B, ...MSCN_C, ...MSCN_D, ...MSCN_E, ...MSCN_F,
  ...MSCN_RINGS,
  ...SCI_A, ...SCI_B, ...SCI_C, ...SCI_D, ...SCI_E, ...SCI_F,
  ...SCI_RINGS,
  ...PARA_A, ...PARA_B, ...PARA_C, ...PARA_D, ...PARA_E, ...PARA_F,
  ...PARA_RINGS,
  ...CINE_A, ...CINE_B, ...CINE_C, ...CINE_D, ...CINE_E, ...CINE_F,
  ...CINE_RINGS,
  ...SFF_A, ...SFF_B, ...SFF_C, ...SFF_D, ...SFF_E, ...SFF_F, ...SFF_I,
  ...SFF_RINGS,
  ...SPRT_A, ...SPRT_B, ...SPRT_C, ...SPRT_D, ...SPRT_E, ...SPRT_F,
  ...SPRT_RINGS,
  ...ARCH_A, ...ARCH_B, ...ARCH_C, ...ARCH_D, ...ARCH_E, ...ARCH_F,
  ...ARCH_RINGS,
  ...PHOT_A, ...PHOT_B, ...PHOT_C, ...PHOT_D, ...PHOT_E, ...PHOT_F,
  ...PHOT_RINGS,
  ...MYTH_A, ...MYTH_B, ...MYTH_C, ...MYTH_D, ...MYTH_E, ...MYTH_F, ...MYTH_G,
  ...MYTH_RINGS,
  ...CRYP_A, ...CRYP_B, ...CRYP_C, ...CRYP_D, ...CRYP_E, ...CRYP_F, ...CRYP_G,
  ...CRYP_RINGS,
  ...MAC_A, ...MAC_B, ...MAC_C, ...MAC_D, ...MAC_E, ...MAC_F,
  ...MAC_RINGS,
  ...STUNLAW_SITES,
  ...SELF_GUIDE,
  ...INDIE_A, ...INDIE_B, ...INDIE_C, ...INDIE_D,
  ...INDIE_E, ...INDIE_F, ...INDIE_G,
  ...INDIE_RINGS,
  ...MT_A, ...MT_B, ...MT_C, ...MT_D,
  ...MT_E, ...MT_F, ...MT_G, ...MT_H,
  ...GAMES_A, ...GAMES_B, ...GAMES_C, ...GAMES_D,
  ...GAMES_E, ...GAMES_F, ...GAMES_G, ...GAMES_H, ...GAMES_I,
  ...GAMES_RINGS,
  ...FS_A, ...FS_B, ...FS_C, ...FS_D,
  ...FS_E, ...FS_F, ...FS_G, ...FS_H,
  ...FS_RINGS,
  ...LANG_A, ...LANG_B, ...LANG_C, ...LANG_D,
  ...LANG_E, ...LANG_F, ...LANG_G, ...LANG_H,
  ...LANG_RINGS,
  ...BOTS_A, ...BOTS_B, ...BOTS_C, ...BOTS_D,
  ...BOTS_E, ...BOTS_F, ...BOTS_G, ...BOTS_H,
  ...BOTS_RINGS,
  ...AIH_A, ...AIH_B, ...AIH_C, ...AIH_D,
  ...AIH_E, ...AIH_F, ...AIH_G, ...AIH_H, ...AIH_I,
  ...AIH_RINGS,
  ...PSB_A, ...PSB_B, ...PSB_RINGS,
  ...HOME_A, ...HOME_B, ...HOME_C, ...HOME_D,
  ...HOME_E, ...HOME_F, ...HOME_G, ...HOME_H,
  ...HOME_RINGS,
  ...PHIL_A, ...PHIL_B, ...PHIL_C, ...PHIL_D,
  ...PHIL_E, ...PHIL_F, ...PHIL_G, ...PHIL_H,
  ...PHIL_RINGS,
  ...DH_A, ...DH_B, ...DH_C, ...DH_D, ...DH_E, ...DH_F,
  ...DH_RINGS,
  ...LAB_A, ...LAB_B, ...LAB_C, ...LAB_D, ...LAB_E, ...LAB_F,
  ...LAB_RINGS,
  ...PE_A, ...PE_B, ...PE_C, ...PE_D, ...PE_E, ...PE_F,
  ...PE_RINGS,
  ...LIT_A, ...LIT_B, ...LIT_C, ...LIT_D, ...LIT_E, ...LIT_F, ...LIT_G,
  ...LIT_RINGS,
  ...REL_A, ...REL_B, ...REL_RINGS,
  ...VEC_SITES,
  ...SMETHWICK_SITES,
  ...BOARD_SITES, ...MAC_G, ...MISC_H,
  ...DOWNS_SITES,
  ...NORWAY_SITES,
  ...MAP_SITES,
  ...SWISS_SITES,
  ...DIALOGUE_SITES,
  ...PROVENANCE_SITES,
  ...MATH_A, ...MATH_B, ...MATH_C, ...MATH_D, ...MATH_E, ...MATH_F,
  ...MATH_RINGS,
  ...AA_A, ...AA_B, ...AA_C, ...AA_D, ...AA_E, ...AA_F,
  ...AA_RINGS,
  ...SOC_A, ...SOC_B, ...SOC_C, ...SOC_D, ...SOC_E, ...SOC_F,
  ...SOC_RINGS,
  ...DES_A, ...DES_B, ...DES_C, ...DES_D, ...DES_E, ...DES_F,
  ...DES_RINGS,
  ...ART_A, ...ART_B, ...ART_C, ...ART_D, ...ART_E, ...ART_F,
  ...ART_RINGS,
  ...COMP_A, ...COMP_B, ...COMP_C, ...COMP_D, ...COMP_E, ...COMP_F,
  ...COMP_RINGS,
  ...POL_A, ...POL_B, ...POL_C, ...POL_D, ...POL_E, ...POL_F,
  ...POL_RINGS,
  ...CS_A, ...CS_B, ...CS_C, ...CS_D, ...CS_E, ...CS_F,
  ...CS_RINGS,
  ...GENX_A, ...GENX_B, ...GENX_C, ...GENX_D, ...GENX_E, ...GENX_F,
  ...GENX_RINGS,
  ...TV_A, ...TV_B, ...TV_C, ...TV_D, ...TV_E, ...TV_F,
  ...TV_RINGS,
  ...COMX_A, ...COMX_B, ...COMX_C, ...COMX_D, ...COMX_E, ...COMX_F,
  ...COMX_RINGS,
  ...GAME_A, ...GAME_B, ...GAME_C, ...GAME_D, ...GAME_E, ...GAME_F,
  ...GAME_RINGS,
  ...ROAD_SITES,
  ...NOW_SITES,
];

// The long tail. A player will type these, and a named damaged record reads far
// better than a not-found: it says the archive HAS this and cannot give it to
// you, which is a different and worse feeling than the site never existing.
export const KNOWN_DOMAINS = [
  'google.com', 'yahoo.com', 'aol.com', 'lycos.com', 'excite.com', 'hotbot.com',
  'ebay.com', 'facebook.com', 'twitter.com', 'bbc.co.uk',
  'angelfire.com', 'tripod.com', 'livejournal.com', 'friendster.com', 'bebo.com',
  'flickr.com', 'last.fm', 'digg.com', 'netscape.com',
  'microsoft.com', 'apple.com', 'nokia.com', 'instagram.com',
  'bit.ly', 'tinyurl.com', 'cs.bham.ac.uk',
];



// A damaged record, named. Deterministic from the domain so the same site is
// broken the same way every time you try it, which matters: a player who comes
// back expects the same ruin.
export function stubBody(domain) {
  const uni = universityBody(domain);
  if (uni) return uni;
  const h = [...domain].reduce((a, c) => ((a * 31 + c.charCodeAt(0)) >>> 0), 7);
  const pct = 3 + (h % 61);
  const fault = [
    'child objects not in store',
    'transfer truncated at byte limit',
    'referenced stylesheet returned 404',
    'inline images reference unresolved hosts',
    'object varies by request header; stored copy does not match',
  ][h % 5];
  return [
    `<h1>${domain}</h1>`,
    '<p><small>cached record &middot; damaged</small></p>',
    '<hr>',
    `<p><b>Object ${pct}% complete.</b></p>`,
    `<p>Fault: ${fault}.</p>`,
    '<p>No further copies held.</p>',
  ];
}

export const archivedSite = (domain) => ARCHIVED_SITES.find((s) => s.domain === domain) || null;

// Every domain the cache will answer for: the written ones first, then the tail.
export function archivedDomains() {
  return [...ARCHIVED_SITES.map((s) => s.domain), ...KNOWN_DOMAINS,
    ...UNIVERSITIES.map((u) => u.domain)];
}

// AltaVista filed the web in a directory, and so does this. Every cached domain
// sits in one category, which is how a player finds any of it without already
// knowing the address to type.
export const CATEGORIES = [
  'Arts & Entertainment', 'Business & Finance', 'Computers & Internet',
  'Education', 'News & Media', 'Reference', 'Shopping', 'Society & Culture',
];

const CATEGORY_OF = {
  'youtube.com': 'Arts & Entertainment',
  'mp3.com': 'Arts & Entertainment',
  'napster.com': 'Arts & Entertainment',
  'last.fm': 'Arts & Entertainment',
  'myspace.com': 'Society & Culture',
  'friendsreunited.co.uk': 'Society & Culture',
  'friendster.com': 'Society & Culture',
  'bebo.com': 'Society & Culture',
  'livejournal.com': 'Society & Culture',
  'facebook.com': 'Society & Culture',
  'twitter.com': 'Society & Culture',
  'instagram.com': 'Society & Culture',
  'flickr.com': 'Society & Culture',
  'amazon.com': 'Shopping',
  'ebay.com': 'Shopping',
  'bbc.co.uk': 'News & Media',
  'slashdot.org': 'News & Media',
  'digg.com': 'News & Media',
  'geocities.com/siliconvalley/heights/4412': 'Society & Culture',
  'blackcountryboard.co.uk': 'Society & Culture',
  // The music corner. Three rooms and a broadcaster, all filed where a 1990s
  // directory would have filed them, so they turn up by browsing the categories
  // and not only by knowing the address.
  'jbs-dudley.org.uk': 'Arts & Entertainment',
  'loca-tapes.org.uk': 'Arts & Entertainment',
  'calvadosbeamtrio.fanpages.org.uk': 'Arts & Entertainment',
  'peelacres.fanpages.org.uk': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc/about': 'Arts & Entertainment',
  'homepage.mac.com/mirrordisc/artists': 'Arts & Entertainment',
  'hagleyroad.geocities.ws': 'Society & Culture',
  'uplands.geocities.ws': 'Education',
  'bristnallhall.geocities.ws': 'Education',
  'smethwickhigh.geocities.ws': 'Education',
  'leasowes.geocities.ws': 'Education',
  'halesowencollege.ac.uk': 'Education',
  'sandwellcollege.ac.uk': 'Education',
  'bearwood.geocities.ws': 'Society & Culture',
  'halesowentown.geocities.ws': 'Society & Culture',
  'brum.geocities.ws': 'Society & Culture',
  'newstreet.geocities.ws': 'Society & Culture',
  'digbethcoach.geocities.ws': 'Society & Culture',
  'bullring.geocities.ws': 'Society & Culture',
  'vectors.geocities.ws': 'Science',
  'cosine.geocities.ws': 'Science',
  'linearalgebra.geocities.ws': 'Science',
  'highdimensional.geocities.ws': 'Science',
  'projection.geocities.ws': 'Science',
  'smalltalk.geocities.ws': 'Computers & Internet',
  'forth.geocities.ws': 'Computers & Internet',
  'prolog.geocities.ws': 'Computers & Internet',
  'lisp.geocities.ws': 'Computers & Internet',
  'apl.geocities.ws': 'Computers & Internet',
  'occam.geocities.ws': 'Computers & Internet',
  'logo.geocities.ws': 'Computers & Internet',
  'sml.geocities.ws': 'Computers & Internet',
  'sussex.ac.uk/spt': 'Reference',
  'mono.fanpages.org.uk': 'Arts & Entertainment',
  'levellers.fanpages.org.uk': 'Arts & Entertainment',
  'brethren.geocities.ws': 'Society & Culture',
  'fifthgeneration.geocities.ws': 'Computers & Internet',
  'aiwinter.geocities.ws': 'Computers & Internet',
  'bearwoodgospelhall.geocities.ws': 'Society & Culture',
  'ikeda.fanpages.org.uk': 'Arts & Entertainment',
  'wargames.fanpages.org.uk': 'Arts & Entertainment',
  'tron.fanpages.org.uk': 'Arts & Entertainment',
  'sneakers.fanpages.org.uk': 'Arts & Entertainment',
  'theconversation.fanpages.org.uk': 'Arts & Entertainment',
  'brazil.fanpages.org.uk': 'Arts & Entertainment',
  'hackers.fanpages.org.uk': 'Arts & Entertainment',
  'blade-runner.fanpages.org.uk': 'Arts & Entertainment',
  'mrrobot.fanpages.org.uk': 'Arts & Entertainment',
  'haltandcatchfire.fanpages.org.uk': 'Arts & Entertainment',
  'theprisoner.fanpages.org.uk': 'Arts & Entertainment',
  'maxheadroom.fanpages.org.uk': 'Arts & Entertainment',
  'thecomputerprogramme.geocities.ws': 'Arts & Entertainment',
  'microlive.geocities.ws': 'Arts & Entertainment',
  'northlaine.geocities.ws': 'Society & Culture',
  'gak.co.uk': 'Shopping',
  'guitarlessons.geocities.ws': 'Education',
  'rmefireface.geocities.ws': 'Computers & Internet',
  'imac.geocities.ws': 'Computers & Internet',
  'economist.com': 'News & Media',
  'nytimes.com': 'News & Media',
  'private-eye.co.uk': 'News & Media',
  'pressgazette.co.uk': 'News & Media',
  'locarecords.com/licence': 'Arts & Entertainment',
  'copyleft-faq.geocities.ws': 'Computers & Internet',
  'gnu.org': 'Computers & Internet',
  'openaudio.eff.org': 'Computers & Internet',
  'creativecommons.org': 'Computers & Internet',
  'codeislaw.geocities.ws': 'Reference',
  'napsterpanic.geocities.ws': 'Arts & Entertainment',
  'shellshock-distribution.co.uk': 'Business & Finance',
  'pressingplant.co.uk': 'Business & Finance',
  'howtorunalabel.geocities.ws': 'Business & Finance',
  'kinematic.fanpages.org.uk': 'Arts & Entertainment',
  'mandibles.geocities.ws': 'Arts & Entertainment',
  'tapesfortrade.geocities.ws': 'Arts & Entertainment',
  'radio4a.geocities.ws': 'Arts & Entertainment',
  'soundsystem.geocities.ws': 'Society & Culture',
  'zapclub.geocities.ws': 'Arts & Entertainment',
  'overloadmedia.co.uk': 'News & Media',
  'nostos.geocities.ws': 'Reference',
  'kleos.geocities.ws': 'Reference',
  'calypso-bookv.geocities.ws': 'Reference',
  'sirens.geocities.ws': 'Reference',
  'penelope.geocities.ws': 'Reference',
  'cultureindustry.geocities.ws': 'Reference',
  'arcades.geocities.ws': 'Reference',
  'digitalhumanities.geocities.ws': 'Reference',
  'criticalcode.geocities.ws': 'Computers & Internet',
  'memex.geocities.ws': 'Computers & Internet',
  'xanadu.geocities.ws': 'Computers & Internet',
  'motherofalldemos.geocities.ws': 'Computers & Internet',
  'cybernetics.geocities.ws': 'Computers & Internet',
  'decss.geocities.ws': 'Computers & Internet',
  'underneath.geocities.ws': 'Computers & Internet',
  'ficciones.geocities.ws': 'Arts & Humanities',
  'giantbrains.geocities.ws': 'Computers & Internet',
  'megamachine.geocities.ws': 'Reference',
  'turingtest.geocities.ws': 'Computers & Internet',
  'vectorspace.geocities.ws': 'Computers & Internet',
  'lighthill.geocities.ws': 'Computers & Internet',
  'dartmouth56.geocities.ws': 'Computers & Internet',
  'expertsystems.geocities.ws': 'Computers & Internet',
  'shrdlu.geocities.ws': 'Computers & Internet',
  'weizenbaum.geocities.ws': 'Computers & Internet',
  'linkrot.geocities.ws': 'Computers & Internet',
  'domesday.geocities.ws': 'Reference',
  'archive.org': 'Reference',
  'sunadmin.geocities.ws': 'Computers & Internet',
  'jargonfile.geocities.ws': 'Computers & Internet',
  'bluebox.geocities.ws': 'Computers & Internet',
  'fidonet.geocities.ws': 'Computers & Internet',
  'eternalseptember.geocities.ws': 'Computers & Internet',
  'y2k.geocities.ws': 'Computers & Internet',
  'sublime-records.fanpages.org.uk': 'Arts & Entertainment',
  'takemura.fanpages.org.uk': 'Arts & Entertainment',
  'cornelius.fanpages.org.uk': 'Arts & Entertainment',
  'importsonly.geocities.ws': 'Shopping',
  'fanfic.geocities.ws': 'Society & Culture',
  'swansea.geocities.ws': 'Society & Culture',
  'cwmdonkin.geocities.ws': 'Society & Culture',
  'm4.geocities.ws': 'Society & Culture',
  'serviceareas.geocities.ws': 'Society & Culture',
  'heathrow.geocities.ws': 'Society & Culture',
  'gatwick.geocities.ws': 'Society & Culture',
  'theroadhome.geocities.ws': 'Society & Culture',
  'caravan.geocities.ws': 'Society & Culture',
  'datacentre.geocities.ws': 'Computers & Internet',
  'nvidia.geocities.ws': 'Computers & Internet',
  'openweights.geocities.ws': 'Computers & Internet',
  'chineseai.geocities.ws': 'Computers & Internet',
  'antiaipolitics.geocities.ws': 'Society & Culture',
  'boomers.geocities.ws': 'Society & Culture',
  'genx.geocities.ws': 'Society & Culture',
  'genz.geocities.ws': 'Society & Culture',
  'genalpha.geocities.ws': 'Society & Culture',
  'itwasnotlikethat.geocities.ws': 'Computers & Internet',
  'whatishistory.geocities.ws': 'Reference',
  'eliza.geocities.ws': 'Computers & Internet',
  'unreliablenarrator.geocities.ws': 'Reference',
  'amiga.fanpages.org.uk': 'Computers & Internet',
  'atarist.fanpages.org.uk': 'Computers & Internet',
  'spectrum48.geocities.ws': 'Computers & Internet',
  'bbcmicro.geocities.ws': 'Computers & Internet',
  'pagemaker.geocities.ws': 'Computers & Internet',
  'winchester.geocities.ws': 'Computers & Internet',
  'theheartandhand.geocities.ws': 'Arts & Entertainment',
  'ward.fanpages.org.uk': 'Arts & Entertainment',
  'locarecords.com': 'Arts & Entertainment',
  'firstyear.geocities.ws': 'Society & Culture',
  // The chatbot corner (#193), which was never filed either.
  'pascal.hansotten.com': 'Computers & Internet',
  'dmb.demon.co.uk': 'Computers & Internet',
  'mrmind.com': 'Computers & Internet',
  'sussex.ac.uk': 'Education',
  'pcplus.co.uk': 'Computers & Internet',
  'soundonsound.com': 'Arts & Entertainment',
  'brightonrocks.co.uk': 'Arts & Entertainment',
  'honestjohn.co.uk': 'Society & Culture',
  'ukclimbing.com': 'Society & Culture',
  'lowendmac.com': 'Computers & Internet',
  'ipodlounge.com': 'Computers & Internet',
  'nme.com': 'Arts & Entertainment',
  'schnews.org.uk': 'News & Media',
  'uio.no': 'Education',
  'forskningsradet.no': 'Education',
  'norskeord.no': 'Reference',
  'timeout.com': 'Arts & Entertainment',
  'reuters.com': 'News & Media',
  'roughguides.com': 'Society & Culture',
  'reddit.com': 'News & Media',
  'reddit.com/r/thespiral': 'News & Media',
  'reddit.com/r/collapse': 'News & Media',
  'reddit.com/r/antiwork': 'News & Media',
  'reddit.com/r/preppers': 'News & Media',
  'reddit.com/r/hats': 'News & Media',
  'reddit.com/r/teachers': 'News & Media',
  'reddit.com/r/linux': 'News & Media',
  'reddit.com/r/philosophy': 'News & Media',
  'reddit.com/r/writingwithai': 'News & Media',
  'reddit.com/r/dronewatch': 'News & Media',
  'lesswrong.com': 'Society & Culture',
  'lobste.rs': 'Computers & Internet',
  'news.ycombinator.com': 'Computers & Internet',
  'libcom.org': 'Society & Culture',
  'crookedtimber.org': 'Society & Culture',
  'metafilter.com': 'Society & Culture',
  'goodreads.com': 'Arts & Entertainment',
  'wikipedia.org': 'Reference',
  // 2026-08-28. EVERYTHING NOT LISTED HERE FELL THROUGH TO COMPUTERS &
  // INTERNET, which is where the directory put portals and webmail and is
  // wrong for a Gospel Hall, a poet or a brewery. A page filed under the
  // wrong heading cannot be browsed to, and browsing is how this archive is
  // meant to be walked. Filed as a directory of the period would have filed
  // them.
  'the-plato-pages.geocities.ws': 'Education',
  'the-shepherd.geocities.ws': 'Education',
  'the-medicine.geocities.ws': 'Education',
  'the-cave.geocities.ws': 'Education',
  'the-carver.geocities.ws': 'Education',
  'theuth-and-thamus.geocities.ws': 'Education',
  'the-tie-of-the-cause.geocities.ws': 'Education',
  'the-euthyphro-question.geocities.ws': 'Education',
  'the-laws-speak.geocities.ws': 'Education',
  'stunlaw.blogspot.com/development-guide': 'Society & Culture',
  'stunlaw.blogspot.com/what-matter-whos-speaking': 'Society & Culture',
  'foucault-versions.geocities.ws': 'Education',
  'provenance-thread.geocities.ws': 'Society & Culture',
  'textprovenance.io': 'Computers & Internet',
  'fastnet.geocities.ws': 'Business & Finance',
  'brighton-board.geocities.ws': 'Computers & Internet',
  'the-well.geocities.ws': 'Computers & Internet',
  'stewart-brand.geocities.ws': 'Society & Culture',
  'cb-radio-brum.geocities.ws': 'Society & Culture',
  'apple-hig.geocities.ws': 'Computers & Internet',
  'mac-os-9.geocities.ws': 'Computers & Internet',
  'logic-audio.geocities.ws': 'Arts & Entertainment',
  'mansfield-college.geocities.ws': 'Education',
  'lincoln-college.geocities.ws': 'Education',
  'wolfson-cambridge.geocities.ws': 'Education',
  'havanese.geocities.ws': 'Society & Culture',
  'mild-in-the-midlands.geocities.ws': 'Society & Culture',
  'the-number-9.geocities.ws': 'Society & Culture',
  'blackcap.geocities.ws': 'Society & Culture',
  'hiking-dos-and-donts.geocities.ws': 'Reference',
  'oslo-guide.geocities.ws': 'Society & Culture',
  'norsk-mat.geocities.ws': 'Society & Culture',
  'norsk-drikke.geocities.ws': 'Society & Culture',
  'bergensbanen.geocities.ws': 'Society & Culture',
  'uio.no/imk': 'Education',
  'sunnmorsbunad.geocities.ws': 'Society & Culture',
  'syttende-mai.geocities.ws': 'Society & Culture',
  'henrik-ibsen.geocities.ws': 'Arts & Entertainment',
  'hedda-gabler.geocities.ws': 'Arts & Entertainment',
  'halesowen-shropshire.geocities.ws': 'Reference',
  'the-twenty-five-inch.geocities.ws': 'Reference',
  'mapping-the-courts.geocities.ws': 'Reference',
  'the-twittens.geocities.ws': 'Reference',
  'lower-swansea-valley.geocities.ws': 'Reference',
  'mapping-ring.geocities.ws': 'Reference',
  'basel.geocities.ws': 'Society & Culture',
  'bern.geocities.ws': 'Society & Culture',
  'quintonpetrol.geocities.ws': 'Society & Culture',
  'bovisand.geocities.ws': 'Society & Culture',
  'smethwick.geocities.ws': 'Society & Culture',
  'capehill.geocities.ws': 'Society & Culture',
  'bass.geocities.ws': 'Society & Culture',
  'smethwickhallboys.geocities.ws': 'Society & Culture',
  'stonylanepark.geocities.ws': 'Society & Culture',
  'greenfieldroad.geocities.ws': 'Society & Culture',
  'seacadets.geocities.ws': 'Society & Culture',
  'capehillgospelhall.geocities.ws': 'Society & Culture',
  'the-quran.geocities.ws': 'Society & Culture',
  'how-the-bible-was-assembled.geocities.ws': 'Society & Culture',
  'torah-and-talmud.geocities.ws': 'Society & Culture',
  'the-pali-canon.geocities.ws': 'Society & Culture',
  'the-vedas.geocities.ws': 'Society & Culture',
  'the-book-and-the-press.geocities.ws': 'Society & Culture',
  'the-isnad.geocities.ws': 'Society & Culture',
  'sunni-and-shia.geocities.ws': 'Society & Culture',
  'schools-of-buddhism.geocities.ws': 'Society & Culture',
  'the-reformation.geocities.ws': 'Society & Culture',
  'the-plymouth-brethren.geocities.ws': 'Society & Culture',
  'neoplatonism-and-after.geocities.ws': 'Society & Culture',
  'sacred-texts-ring.geocities.ws': 'Society & Culture',
  'faith-and-schism-ring.geocities.ws': 'Society & Culture',
  'homer-in-english.geocities.ws': 'Arts & Entertainment',
  'the-romantics.geocities.ws': 'Arts & Entertainment',
  'the-war-poets.geocities.ws': 'Arts & Entertainment',
  'modernist-poetry.geocities.ws': 'Arts & Entertainment',
  'futurism-and-the-machine.geocities.ws': 'Arts & Entertainment',
  'poems-made-with-rules.geocities.ws': 'Arts & Entertainment',
  'poetry-by-machine.geocities.ws': 'Arts & Entertainment',
  'olaf-stapledon.geocities.ws': 'Arts & Entertainment',
  'last-and-first-men.geocities.ws': 'Arts & Entertainment',
  'stapledon-in-the-war.geocities.ws': 'Arts & Entertainment',
  'stapledon-and-wells.geocities.ws': 'Arts & Entertainment',
  'sussex.ac.uk/cvm': 'Education',
  'sussex.ac.uk/cvm/vector-studies': 'Education',
  'sussex.ac.uk/cvm/vector-medium': 'Education',
  'sussex.ac.uk/cvm/vector-culture': 'Education',
  'sussex.ac.uk/cvm/research': 'Education',
  'sussex.ac.uk/cvm/seminar': 'Education',
  'founding-of-the-bbc.geocities.ws': 'News & Media',
  'the-licence-fee.geocities.ws': 'News & Media',
  'reith-and-after.geocities.ws': 'News & Media',
  'pbs-and-the-senate.geocities.ws': 'News & Media',
  'ceefax.geocities.ws': 'News & Media',
  'the-domesday-disc.geocities.ws': 'News & Media',
  'marconi.geocities.ws': 'News & Media',
  'computer-literacy-project.geocities.ws': 'News & Media',
  'public-service-ring.geocities.ws': 'News & Media',
  'bearwoodgospelhall.geocities.ws': 'Society & Culture',
  'brethren.geocities.ws': 'Society & Culture',

  'microsoft.com': 'Business & Finance',
  'apple.com': 'Business & Finance',
  'nokia.com': 'Business & Finance',
};

// Everything else — the portals, the search engines, the free-homepage hosts,
// the webmail — is what the directory called Computers & Internet.
export const categoryOf = (domain) => (
  CATEGORY_OF[domain] || (UNI_BY_DOMAIN[domain] ? 'Education' : 'Computers & Internet')
);

