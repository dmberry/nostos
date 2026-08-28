// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE ENGINEER / RETROCOMPUTING WEBRINGS.
//
// The hardware side of the ring system: sites on the machines and the people
// who built them, tied together the way the enthusiasts tied them, by a strip
// of navigation and a shared obsession. Overlapping, so the valves lead to the
// transistors lead to the chips, and the British corner joins the rest.

const ring = (domain, name, title, bg, blurb, members) => ({
  domain, name, title,
  body: [
    `<!--bg:${bg}-->`,
    `<h1>${title}</h1>`,
    '<p><small>a webring · add the strip to join · walked, not searched</small></p>',
    '<hr>',
    ...blurb,
    '<p><b>Member sites</b>:</p>',
    '<ul>',
    ...members.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
    '</ul>',
    '<hr>',
    '<p><small>« prev · <a href="' + members[0][0] + '">random</a> · next »<br>',
    'ringmaster last seen a long time ago. the ring turns without one.</small></p>',
  ],
});

export const ENGINEER_RINGS = [
  ring('valve-relay-ring.geocities.ws', 'VALVE AND RELAY RING',
    'Valve, Relay &amp; Codebreaking', 'valve',
    ['<p>Before the transistor: relays that clacked, valves that glowed and '
      + 'failed by the dozen, memory made of sound in a tube of mercury or a '
      + 'spot on a screen. The machines that were heavier than a lorry and '
      + 'thought slower than you can, and started all of it.</p>'],
    [['konrad-zuse.geocities.ws', 'Zuse Z3'],
     ['atanasoff-berry.geocities.ws', 'the Atanasoff-Berry Computer'],
     ['colossus-flowers.geocities.ws', 'Colossus / Tommy Flowers'],
     ['harvard-mark-i.geocities.ws', 'Harvard Mark I / Aiken'],
     ['eniac.geocities.ws', 'ENIAC / Eckert &amp; Mauchly'],
     ['eniac-women.geocities.ws', 'the ENIAC programmers'],
     ['edvac-vonneumann.geocities.ws', 'EDVAC / the stored program'],
     ['manchester-baby.geocities.ws', 'the Manchester Baby'],
     ['turing-ace.geocities.ws', 'Turing &amp; the ACE'],
     ['hedy-lamarr.geocities.ws', 'Hedy Lamarr &amp; frequency hopping']]),

  ring('big-iron-ring.geocities.ws', 'BIG IRON RING',
    'Big Iron', 'mainframe',
    ['<p>Mainframes. The raised floor, the chilled air, the operators in white '
      + 'coats, the box that ran the payroll and the census and the bomb. Iron '
      + 'you leased by the month and never owned.</p>'],
    [['ibm-701-360.geocities.ws', 'IBM 700 / System 360'],
     ['whirlwind-forrester.geocities.ws', 'Whirlwind &amp; core memory'],
     ['univac.geocities.ws', 'UNIVAC I'],
     ['an-wang.geocities.ws', 'An Wang'],
     ['seymour-cray.geocities.ws', 'Seymour Cray'],
     ['leo-lyons.geocities.ws', 'LEO — the teashop computer'],
     ['ferranti-atlas.geocities.ws', 'Ferranti Atlas'],
     ['ibm-ramac-disk.geocities.ws', 'IBM RAMAC / the disk'],
     ['tape-and-cassette.geocities.ws', 'the physical media']]),

  ring('silicon-ring.geocities.ws', 'SILICON RING',
    'Silicon', 'silicon',
    ['<p>The transistor, the integrated circuit, the microprocessor. The whole '
      + 'weight of Big Iron pressed down onto a chip of sand the size of a '
      + 'fingernail, and then halved again, and again.</p>'],
    [['bell-transistor.geocities.ws', 'the transistor / Bell Labs'],
     ['kilby-noyce-ic.geocities.ws', 'Kilby &amp; Noyce / the IC'],
     ['fairchild-traitorous.geocities.ws', 'the Traitorous Eight / Fairchild'],
     ['intel-4004.geocities.ws', 'the Intel 4004'],
     ['moore-law.geocities.ws', 'Gordon Moore'],
     ['carver-mead-conway.geocities.ws', 'Mead &amp; Conway / VLSI'],
     ['sophie-wilson-arm.geocities.ws', 'Sophie Wilson / ARM'],
     ['clive-sinclair.geocities.ws', 'Clive Sinclair / ZX'],
     ['core-rope-memory.geocities.ws', 'core rope memory'],
     ['an-wang.geocities.ws', 'An Wang / core']]),

  ring('networks-ring.geocities.ws', 'NETWORKS RING',
    'Networks', 'network',
    ['<p>Packet switching, the IMP, the protocol, the web. How the boxes learned '
      + 'to talk, and what it cost that they never learned to stop.</p>'],
    [['baran-davies-packet.geocities.ws', 'Baran &amp; Davies / packet switching'],
     ['arpanet-imp-bbn.geocities.ws', 'ARPANET / the IMP'],
     ['cerf-kahn-tcpip.geocities.ws', 'Cerf &amp; Kahn / TCP-IP'],
     ['berners-lee-www.geocities.ws', 'Berners-Lee / the Web'],
     ['metcalfe-ethernet.geocities.ws', 'Metcalfe &amp; Boggs / Ethernet'],
     ['engelbart-nls.geocities.ws', 'Engelbart / NLS &amp; the mouse'],
     ['xerox-alto-parc.geocities.ws', 'Xerox PARC / the Alto'],
     ['sutherland-sketchpad.geocities.ws', 'Sutherland / Sketchpad'],
     ['licklider.geocities.ws', 'Licklider / who paid for it'],
     ['oliver-1968.geocities.ws', 'OLIVER, 1968']]),

  ring('british-computing-ring.geocities.ws', 'BRITISH COMPUTING RING',
    'British Computing', 'valve',
    ['<p>The British corner: Bletchley, Manchester, Cambridge, a teashop firm, a '
      + 'man in a shed at Acorn, and a knight who put a computer in a bedroom '
      + 'for under a hundred pounds. First at a great deal and good at keeping '
      + 'none of it.</p>'],
    [['colossus-flowers.geocities.ws', 'Colossus'],
     ['manchester-baby.geocities.ws', 'the Manchester Baby'],
     ['edsac-wilkes.geocities.ws', 'EDSAC / Wilkes'],
     ['turing-ace.geocities.ws', 'the Pilot ACE'],
     ['leo-lyons.geocities.ws', 'LEO'],
     ['ferranti-atlas.geocities.ws', 'Ferranti Atlas'],
     ['baran-davies-packet.geocities.ws', 'Donald Davies / packet switching'],
     ['sophie-wilson-arm.geocities.ws', 'Acorn, the BBC Micro &amp; ARM'],
     ['clive-sinclair.geocities.ws', 'Sinclair'],
     ['berners-lee-www.geocities.ws', 'Berners-Lee']]),

  ring('software-ring.geocities.ws', 'SOFTWARE RING',
    'Languages, Systems &amp; Algorithms', 'software',
    ['<p>The part with no weight and no smell: languages, compilers, operating '
      + 'systems, algorithms. The machine did nothing until somebody told it '
      + 'how, and the telling turned out to be the hard part.</p>'],
    [['edsac-wilkes.geocities.ws', 'Wilkes / the first programming textbook'],
     ['alan-kay.geocities.ws', 'Alan Kay / Smalltalk &amp; the Dynabook'],
     ['backus-fortran.geocities.ws', 'Backus / FORTRAN'],
     ['mccarthy-lisp.geocities.ws', 'McCarthy / LISP'],
     ['dijkstra.geocities.ws', 'Dijkstra'],
     ['ritchie-thompson-unix.geocities.ws', 'Ritchie &amp; Thompson / UNIX &amp; C'],
     ['knuth-taocp.geocities.ws', 'Knuth'],
     ['margaret-hamilton-apollo.geocities.ws', 'Margaret Hamilton / Apollo'],
     ['ibm-701-360.geocities.ws', 'OS/360 / the Mythical Man-Month']]),

  ring('retrocomputing-ring.geocities.ws', 'RETROCOMPUTING RING',
    'The Retrocomputing Ring', 'mainframe',
    ['<p>The broad ring, and the front door to the narrower ones. Anything on '
      + 'the machines that came before, and the people who soldered them. The '
      + 'other rings are rooms off this hall:</p>',
     '<ul>',
     '<li><a href="valve-relay-ring.geocities.ws">Valve, Relay &amp; Codebreaking</a></li>',
     '<li><a href="big-iron-ring.geocities.ws">Big Iron</a></li>',
     '<li><a href="silicon-ring.geocities.ws">Silicon</a></li>',
     '<li><a href="networks-ring.geocities.ws">Networks</a></li>',
     '<li><a href="british-computing-ring.geocities.ws">British Computing</a></li>',
     '<li><a href="software-ring.geocities.ws">Languages, Systems &amp; Algorithms</a></li>',
     '</ul>',
     '<p>The theory people keep their own rings next door; a few of these sites '
      + 'link across to them (the <a href="womenincomputing-ring.geocities.ws">'
      + 'Women in Computing</a> ring especially). A few to start with:</p>'],
    [['eniac-women.geocities.ws', 'the ENIAC programmers'],
     ['manchester-baby.geocities.ws', 'the Manchester Baby'],
     ['intel-4004.geocities.ws', 'the Intel 4004'],
     ['ritchie-thompson-unix.geocities.ws', 'UNIX &amp; C'],
     ['core-rope-memory.geocities.ws', 'core rope memory'],
     ['clive-sinclair.geocities.ws', 'the ZX Spectrum'],
     ['berners-lee-www.geocities.ws', 'the Web itself']]),
];
