// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE VECTOR MACHINES RING. Accelerated computation, from the vector registers
// of the 1970s supercomputers to the matrix units the towers were built from:
// each page by somebody who worked on, bought, or took apart one of them. The
// maths is on vectors.geocities.ws and its neighbours; these pages are the
// machines that did the arithmetic.

const P = (domain, name, title, body) => ({ domain, name, title, body });

const RING_HUB = 'vector-machines-ring.geocities.ws';
const MEMBERS = [
  ['sixty-four-at-a-time.geocities.ws', 'Sixty-four at a time: the vector supercomputers'],
  ['connection-machine.geocities.ws', 'The Connection Machine'],
  ['systolic.geocities.ws', 'Systolic arrays'],
  ['texture-hacks.geocities.ws', 'Before CUDA: sums in the texture unit'],
  ['tpu-v1.geocities.ws', 'The TPU paper, read slowly'],
  ['number-formats.geocities.ws', 'How few bits a number needs'],
  ['memory-wall.geocities.ws', 'The memory wall'],
  ['wafer-scale.geocities.ws', 'Whole wafers, and the other roads'],
  ['hardware-lottery.geocities.ws', 'The hardware lottery'],
  ['inside-a-tower.geocities.ws', 'What is inside one'],
];

function strip(domain) {
  const i = MEMBERS.findIndex(([d]) => d === domain);
  const prev = MEMBERS[(i - 1 + MEMBERS.length) % MEMBERS.length][0];
  const next = MEMBERS[(i + 1) % MEMBERS.length][0];
  return [
    '<hr>',
    `<p><small>&#8594; THE VECTOR MACHINES RING &#8594;<br><a href="${prev}">[ &lt;&lt; Prev ]</a> `
      + `<a href="${RING_HUB}">[ The Ring ]</a> <a href="${next}">[ Next &gt;&gt; ]</a><br>`
      + `${MEMBERS.length} sites. This site is member #${i + 1}.</small></p>`,
  ];
}

const HUB = P(RING_HUB, 'THE VECTOR MACHINES RING', 'The Vector Machines Ring', [
  '<!--bg:silicon-->',
  '<h1>The Vector Machines Ring</h1>',
  '<p><small>a webring for the hardware that does one sum to a great many numbers at once</small></p>',
  '<hr>',
  // vec/illiac-iv-01.jpg: NASA Ames, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/illiac-iv-01.jpg" alt=""><span class="indie-cap">ILLIAC IV at Ames, a quadrant with a processing unit pulled out</span>',
  '<p>A general-purpose processor fetches an instruction, fetches the numbers it',
  'needs, does one thing to them, and writes one answer back. Every machine on this',
  'ring was built on the bet that most of the work worth doing is the same',
  'operation over long rows of numbers, and that a machine which only did that could',
  'do it hundreds or millions of times faster.</p>',
  '<p>The bet was made for weather forecasts and bomb physics, then for',
  'graphics, and then, for about ten years, for neural networks, which turned out to',
  'be almost nothing except matrix multiplication.</p>',
  '<ul>',
  ...MEMBERS.map(([d, t]) => `<li><a href="${d}">${t}</a></li>`),
  '</ul>',
  '<p><small>the maths: <a href="vectors.geocities.ws">vectors</a> &middot; '
    + '<a href="linearalgebra.geocities.ws">linear algebra</a> &middot; '
    + '<a href="highdimensional.geocities.ws">high dimensions</a> &middot; '
    + '<a href="apl.geocities.ws">APL</a>, the language that thought in arrays first</small></p>',
  '<p><small>the machines before: <a href="seymour-cray.geocities.ws">Seymour Cray</a> &middot; '
    + '<a href="occam.geocities.ws">occam and the transputer</a> &middot; '
    + '<a href="perceptron-rosenblatt.geocities.ws">the Mark I Perceptron</a></small></p>',
]);

// ---- Vector supercomputers ---------------------------------------------------
const CRAY = P('sixty-four-at-a-time.geocities.ws', 'SIXTY-FOUR AT A TIME', 'Sixty-four at a time', [
  '<!--bg:mainframe-->',
  '<h1>Sixty-four at a time</h1>',
  '<p><small>notes from an operator who sat on the bench</small></p>',
  '<hr>',
  '<p>The Cray-1 went to Los Alamos in 1976. It was a C-shaped column with a padded',
  'bench round its base, and the bench was the power supplies. Freon ran through',
  'the frame to carry the heat off. The clock ran at 80 MHz, which was fast for',
  'anything then.</p>',
  // vec/cray-1-01.jpg: Clemens Pfeiffer, CC BY 2.5, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/cray-1-01.jpg" alt=""><span class="indie-cap">the one in Munich. You can see where the bench goes round</span>',
  '<h2>The registers</h2>',
  '<p>It had eight <b>vector registers</b>, each holding 64 numbers of 64 bits. One',
  'instruction said: add these 64 to those 64. The adder was pipelined, so after a',
  'few cycles to fill it, one result came out every tick.</p>',
  '<p>Then <b>chaining</b>. The result of the multiply could flow straight into the',
  'adder without being written back first, so <code>a*x + y</code> over a whole',
  'register ran as one stream. Half the Fortran I ever tuned was rearranging loops',
  'so the compiler could see a chain in them.</p>',
  '<h2>The others</h2>',
  '<pre>  CDC STAR-100   1974   vectors straight from memory, long start-up\n'
    + '  ILLIAC IV      1975   64 processors in lockstep, one instruction for all\n'
    + '  Cray-1         1976   vectors in registers, chained\n'
    + '  Cray X-MP      1982   two, then four, of them sharing memory</pre>',
  '<p>The STAR had to fetch each vector from memory and took so long to start that',
  'short vectors ran slower than on a scalar machine. ILLIAC IV took the other road,',
  'many small processors each doing the same instruction on its own number. That is',
  'SIMD, and it is the road most of this ring ended up on.</p>',
  '<p>Gene Amdahl had already written the rule in 1967: whatever part of the job',
  'cannot be done in parallel sets the limit on the whole. We had it pinned over the',
  'console.</p>',
  ...strip('sixty-four-at-a-time.geocities.ws'),
]);

// ---- Thinking Machines -------------------------------------------------------
const CM = P('connection-machine.geocities.ws', 'THE CONNECTION MACHINE', 'The Connection Machine', [
  '<!--bg:black-->',
  '<h1>The Connection Machine</h1>',
  '<p><small>Thinking Machines Corporation, Cambridge, Massachusetts, 1983 to 1994</small></p>',
  '<hr>',
  '<p>Danny Hillis wrote the design as his MIT thesis. The CM-1 (1986) had 65,536',
  'processors, each one bit wide, wired so that any processor could send a message',
  'to any other through a twelve-dimensional hypercube of routers. It was a black',
  'cube of cubes with a wall of red lights on the front, and the lights showed',
  'what the processors were doing.</p>',
  // vec/connection-machine-01.jpg: Billie Grace Ward, CC BY 2.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/connection-machine-01.jpg" alt=""><span class="indie-cap">a CM-1 in a museum, lights off, which is not how it should be shown</span>',
  '<p>The idea was one processor per piece of data: one per pixel, one per word, one',
  'per node of a network. You wrote in *Lisp, or in C* (the star is part of the name),',
  'languages with a parallel',
  'variable that held one value on every processor at once.</p>',
  '<p>Richard Feynman spent summers there and worked out the size of the router',
  'buffers with partial differential equations, treating the messages as a fluid.',
  'His answer was smaller than the engineers had planned for, and it held.</p>',
  '<p>The CM-2 added floating-point chips beside the one-bit processors, and',
  'physicists bought it for the floating point. The CM-5 (1991) dropped the one-bit',
  'idea for ordinary processors on a fat-tree network, and appeared in the control',
  'room in <i>Jurassic Park</i>. The company filed for bankruptcy in 1994.</p>',
  '<p>Hillis built it for artificial intelligence, for programs made of millions of',
  'small connected parts.</p>',
  ...strip('connection-machine.geocities.ws'),
]);

// ---- Systolic arrays ---------------------------------------------------------
const SYSTOLIC = P('systolic.geocities.ws', 'SYSTOLIC ARRAYS', 'Systolic arrays', [
  '<!--bg:grey-->',
  '<h1>Systolic arrays</h1>',
  '<p><small>H. T. Kung and Charles E. Leiserson, "Systolic Arrays (for VLSI)", 1978</small></p>',
  '<hr>',
  '<p>Systole is the contraction of the heart. Kung and Leiserson\'s array is a grid',
  'of identical small cells. On every beat each cell takes a number from its',
  'neighbour on the left and one from above, multiplies, adds the product to what',
  'it holds, and passes the numbers on right and down.</p>',
  '<pre>        b13 b12 b11\n'
    + '         |   |   |\n'
    + '  a11 -> [ ]-[ ]-[ ] ->\n'
    + '  a12 -> [ ]-[ ]-[ ] ->\n'
    + '  a13 -> [ ]-[ ]-[ ] ->\n'
    + '\n  the rows of A flow right, the columns of B flow down,\n'
    + '  staggered one beat each, and C accumulates in place</pre>',
  // vec/systolic-01.png: EMJzero, CC0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/systolic-01.png" alt=""><span class="indie-cap">weights held still in the cells, the inputs pumped through</span>',
  '<p>Nothing goes back to memory until the end. Each number is read once and used',
  'as many times as there are cells in its path. On a chip, where the wires cost',
  'more than the arithmetic, that is the whole design argument, and Kung made it',
  'again in 1982 in "Why Systolic Architectures?".</p>',
  '<p>Carnegie Mellon built the Warp machine on it in the 1980s, with General',
  'Electric, and later iWarp with Intel. Then for about thirty years it was a',
  'chapter in the architecture textbooks.</p>',
  '<p>The matrix unit in the first <a href="tpu-v1.geocities.ws">TPU</a> is a',
  'systolic array, 256 cells on a side.</p>',
  ...strip('systolic.geocities.ws'),
]);

// ---- GPGPU -------------------------------------------------------------------
const TEXTURE = P('texture-hacks.geocities.ws', 'TEXTURE HACKS', 'Before CUDA: sums in the texture unit', [
  '<!--bg:console-->',
  '<h1>Before CUDA</h1>',
  '<p><small>doing linear algebra on a graphics card, 2002 to 2006</small></p>',
  '<hr>',
  '<p>The graphics card was built to do one small program for every pixel on the',
  'screen, in parallel, sixty times a second. From the GeForce 3 (2001) that',
  'program, the <b>shader</b>, could be written by you.</p>',
  // vec/geforce-8800-01.jpg: Hyins, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/geforce-8800-01.jpg" alt=""><span class="indie-cap">a GeForce 8800 GTX with the cooler off. The first card CUDA ran on</span>',
  '<p>So you lied to it. Put a matrix into a texture, one number per texel. Draw a',
  'rectangle exactly the size of the answer. The pixel shader for each pixel reads',
  'a row and a column from two textures, multiplies them out, and "colours" the',
  'pixel with the result. Read the frame back and you have the product.</p>',
  '<p>Every trick was a graphics trick: floats were colours, loops were passes,',
  'memory was images. Precision was whatever the card felt like on the day.</p>',
  '<p>Ian Buck\'s Brook at Stanford (2004) hid most of this behind a streaming',
  'language. Then he went to Nvidia, and in 2006 the GeForce 8800 came out with',
  'CUDA: C with a keyword for "run this on every thread", and no pretending to be',
  'pixels.</p>',
  '<p>In 2012 two gaming cards, GTX 580s with 3 GB each, trained the network on',
  '<a href="alexnet-2012.geocities.ws">the AlexNet page</a>. The model was split',
  'across the two cards because it would not fit on one.</p>',
  ...strip('texture-hacks.geocities.ws'),
]);

// ---- TPU ---------------------------------------------------------------------
const TPU = P('tpu-v1.geocities.ws', 'THE TPU PAPER', 'The TPU paper, read slowly', [
  '<!--bg:silicon-->',
  '<h1>The TPU paper, read slowly</h1>',
  '<p><small>Norman P. Jouppi and many others, "In-Datacenter Performance Analysis of a',
  'Tensor Processing Unit", ISCA 2017</small></p>',
  '<hr>',
  '<p>Google had been running these in its data centres since 2015 and said so two',
  'years later. The paper is about the first one, which did inference only: running',
  'trained networks, not training them.</p>',
  '<h2>What is on the chip</h2>',
  '<pre>  matrix unit      256 x 256 multiply-accumulate cells, systolic\n'
    + '  arithmetic       8-bit integers\n'
    + '  clock            700 MHz\n'
    + '  on-chip buffer   24 MiB for activations\n'
    + '  weights          streamed in from off-chip DRAM\n'
    + '  host             plugged into a server like a disk</pre>',
  '<p>65,536 multipliers on one chip. The CPU sends it instructions over PCIe the',
  'way it would drive a floating-point coprocessor, and there are only about a',
  'dozen instructions. Most of the chip is the matrix unit and the memory that',
  'keeps it fed. There are no caches, no branch prediction and no out-of-order',
  'execution.</p>',
  '<p>The paper reports it at fifteen to thirty times the speed of the CPUs and GPUs',
  'of the same year on their production networks, and much better per watt.</p>',
  // vec/tpu-01.jpg: Zinskauf, CC BY-SA 4.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/tpu-01.jpg" alt=""><span class="indie-cap">not the first one. A third-generation board, four chips, water-cooled</span>',
  '<h2>What they found</h2>',
  '<p>The chip spent a lot of its time waiting for weights. The authors say so, and',
  'say that the next one should have faster memory. See <a href="memory-wall.geocities.ws">the',
  'memory wall</a>.</p>',
  '<p>The second TPU (2017) trained as well as ran, in a 16-bit format of Google',
  'Brain\'s called bfloat16, and was rented by the board and by the pod, boards wired',
  'together into one machine. See <a href="number-formats.geocities.ws">number',
  'formats</a>.</p>',
  ...strip('tpu-v1.geocities.ws'),
]);

// ---- Number formats ----------------------------------------------------------
const FORMATS = P('number-formats.geocities.ws', 'NUMBER FORMATS', 'How few bits a number needs', [
  '<!--bg:parch-->',
  '<h1>How few bits a number needs</h1>',
  '<hr>',
  '<p>A floating-point number is a sign, an exponent (how big) and a mantissa (how',
  'exact). Scientific computing spent forty years on 64 bits. Neural networks turned',
  'out to need far less, as long as the range was kept.</p>',
  '<pre>  format      sign  exponent  mantissa   where\n'
    + '  ----------  ----  --------  --------   -----\n'
    + '  FP64         1      11        52      the supercomputers\n'
    + '  FP32         1       8        23      the graphics cards\n'
    + '  FP16         1       5        10      half precision\n'
    + '  bfloat16     1       8         7      Google Brain; TPU v2\n'
    + '  TF32         1       8        10      Nvidia A100, inside the tensor cores\n'
    + '  FP8 E4M3     1       4         3      Nvidia H100 and after\n'
    + '  FP8 E5M2     1       5         2      the same, for gradients\n'
    + '  INT8         whole numbers, -128..127   TPU v1, inference</pre>',
  // vec/bfloat16-01.png: MovGP0, CC BY-SA 4.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/bfloat16-01.png" alt=""><span class="indie-cap">bfloat16, bit by bit</span>',
  '<p>bfloat16 is FP32 with sixteen bits of mantissa cut off. It has the same range',
  'as FP32 and about two decimal digits of precision. For a network, range matters',
  'more: a gradient that underflows to zero stops learning, and a weight that is',
  'slightly wrong mostly does not.</p>',
  '<p>Nvidia\'s Volta (2017) added <b>tensor cores</b>: small units that multiply two',
  '4x4 matrices of 16-bit numbers and add the result into 32 bits, in one step. The',
  'chips after it put more of the die into tensor cores and fewer bits into each',
  'number, down to four.</p>',
  '<p>A trained model is a file of these numbers, billions of them. Choosing how',
  'many bits to store each one in is choosing how much of the model survives.</p>',
  ...strip('number-formats.geocities.ws'),
]);

// ---- Memory wall -------------------------------------------------------------
const WALL = P('memory-wall.geocities.ws', 'THE MEMORY WALL', 'The memory wall', [
  '<!--bg:grey-->',
  '<h1>The memory wall</h1>',
  '<p><small>Wm. A. Wulf and Sally A. McKee, "Hitting the Memory Wall: Implications of',
  'the Obvious", 1995</small></p>',
  '<hr>',
  '<p>Processor speed was growing by something like 80 per cent a year and memory',
  'speed by about 7. Wulf and McKee did the division in a short note: at some point',
  'the time to fetch a number would dwarf the time to use it, whatever the',
  'processor could do.</p>',
  '<p>An accelerator makes this worse, because it makes the arithmetic nearly free.',
  'The question for any program becomes its <b>arithmetic intensity</b>: how many',
  'operations it does for each byte it reads. The <b>roofline</b> model (Williams,',
  'Waterman and Patterson, 2009) draws it as a graph with two lines. Under the',
  'sloping one you are waiting for memory. Under the flat one you are waiting for',
  'the arithmetic.</p>',
  '<p>A large matrix multiply sits high on the intensity axis: each number is used',
  'many times. Running a big language model one word at a time sits low, because',
  'every weight has to be read for every word.</p>',
  // vec/hbm-01.png: ScotXW, CC BY-SA 4.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/hbm-01.png" alt=""><span class="indie-cap">the stack, and the slab of silicon it sits on beside the processor</span>',
  '<h2>Stacked memory</h2>',
  '<p>High Bandwidth Memory (a JEDEC standard from 2013) stacks DRAM dies on top of',
  'each other, drills connections straight down through them, and sets the stack',
  'on a slab of silicon beside the processor instead of out on the board. The',
  'wires are millimetres long and there are thousands of them. It is expensive,',
  'and for some years the chip makers took all of it that could be made.</p>',
  ...strip('memory-wall.geocities.ws'),
]);

// ---- Wafer scale & others -----------------------------------------------------
const WAFER = P('wafer-scale.geocities.ws', 'WHOLE WAFERS', 'Whole wafers, and the other roads', [
  '<!--bg:silicon-->',
  '<h1>Whole wafers, and the other roads</h1>',
  '<hr>',
  '<h2>Wafer scale</h2>',
  '<p>Chips are cut from a round silicon wafer. Cut too big and a speck of dust',
  'somewhere ruins the chip. Gene Amdahl\'s Trilogy Systems tried to use the whole',
  'wafer in the 1980s, with spare circuits to route round the faults, and failed.',
  'Cerebras shipped one in 2019: a single square cut from the wafer, 1.2 trillion',
  'transistors, 400,000 cores, the memory spread among them.</p>',
  '<h2>The processors named after the machines</h2>',
  '<p>Graphcore, in Bristol, called its chip the IPU and the first ones Colossus;',
  'Tommy Flowers\'s machine at Bletchley had the name first. (There is also the <a',
  'href="forbin-project.geocities.ws">other Colossus</a>.) Its trick was to hold',
  'the whole model in memory on the chip, spread across more than a thousand',
  'cores.</p>',
  '<p>Groq, started by people from the TPU team, built a chip where the compiler',
  'schedules every operation in advance, so the same program takes exactly the',
  'same time every run.</p>',
  // vec/synapse-01.jpg: DARPA SyNAPSE, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/synapse-01.jpg" alt=""><span class="indie-cap">sixteen TrueNorth chips on one board</span>',
  '<h2>Neuromorphic</h2>',
  '<p>The road not taken, or not yet. IBM\'s TrueNorth (2014) had a million',
  'artificial neurons that fire spikes, as nerves do, and drew about 70 milliwatts.',
  'Intel\'s Loihi (2017) could learn on the chip. They compute only when a spike',
  'arrives, and they are very good at almost nothing the matrix machines are good',
  'at.</p>',
  ...strip('wafer-scale.geocities.ws'),
]);

// ---- The hardware lottery -----------------------------------------------------
const LOTTERY = P('hardware-lottery.geocities.ws', 'THE HARDWARE LOTTERY', 'The hardware lottery', [
  '<!--bg:parch-->',
  '<h1>The hardware lottery</h1>',
  '<p><small>on Sara Hooker, "The Hardware Lottery" (2020)</small></p>',
  '<hr>',
  '<p>Hooker\'s argument: a research idea wins when it suits the hardware and',
  'software already there, and loses when it does not, whatever its merits. She',
  'calls this the hardware lottery. Babbage had the idea of a general computer and',
  'no way to build it; neural networks were proposed in the 1940s and waited for',
  'graphics cards.</p>',
  // vec/perceptron-manual-01.png: John C. Hay and Albert E. Murray, operator's manual, public domain, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/perceptron-manual-01.png" alt=""><span class="indie-cap">the Mark I Perceptron, from its operator\'s manual</span>',
  '<p>It runs the other way too. Once a kind of model wins, the next chips are',
  'built for it, which makes it cheaper, which makes it win again. A network that',
  'is mostly dense matrix multiplication in 16 bits runs well on everything on',
  'this ring. A network that needs sparse, irregular, branching work runs badly',
  'on all of it, and nobody finds out whether it would have been better.</p>',
  '<p>Rich Sutton\'s "The Bitter Lesson" (2019) says that general methods which',
  'use more computation beat methods built on human knowledge, every time the',
  'computation grows. Read the two essays together. Sutton is describing which',
  'methods won. Hooker is describing who built the machines they won on.</p>',
  '<p><small>see also: <a href="scaling-laws.geocities.ws">scaling laws and the bitter',
  'lesson</a> &middot; <a href="perceptron-rosenblatt.geocities.ws">Rosenblatt\'s',
  'Perceptron</a>, which was built as hardware, with motors turning the',
  'weights</small></p>',
  ...strip('hardware-lottery.geocities.ws'),
]);

// ---- A tower, opened ----------------------------------------------------------
const TOWER = P('inside-a-tower.geocities.ws', 'WHAT IS INSIDE ONE', 'What is inside one', [
  '<!--bg:black-->',
  '<h1>What is inside one</h1>',
  '<p><small>a fallen tower on the north shore, opened with a bar and a torch</small></p>',
  '<hr>',
  '<p>The skin comes off in panels once the lamp housing is out. Inside, from the',
  'bottom:</p>',
  '<pre>  base      batteries, and a lot of them. warm hours after it fell\n'
    + '  lower     cooling. pipes and plates, some liquid left, sweet smell\n'
    + '  middle    two racks of identical cards, sixteen to a rack\n'
    + '  upper     radios. more aerials than it needs to talk to the robots\n'
    + '  top       the lamp</pre>',
  // vec/h100-01.jpg: Geekerwan, CC BY 3.0, Wikimedia Commons
  '<img class="indie-pic" src="assets/media/web/vec/h100-01.jpg" alt=""><span class="indie-cap">not from the tower. One like them, from a trade review, so you can see the size</span>',
  '<p>The cards are the thing. Each has one large chip in the middle with four',
  'small square towers of memory right up against it, stacked, under the same lid.',
  'I have seen that layout in the trade press. It is the layout on the',
  '<a href="memory-wall.geocities.ws">memory wall</a> page. Every card is wired to',
  'every other with flat ribbon links, so the sixteen are one machine.</p>',
  '<p>There is a board at the back with a small ordinary processor and a serial',
  'port. With a terminal on it, it printed a firmware banner and stopped at a',
  'prompt that said <code>ok</code>. That is <a href="forth.geocities.ws">Forth</a>.',
  'I typed <code>words</code> and it listed the dictionary, and I did not',
  'understand most of them.</p>',
  '<p>The flash on that board is large. When the cards come up, most of what',
  'goes onto them is one enormous file of numbers in long rows. I copied some of',
  'it. It is not text and it is not code. I do not know how anyone would read',
  'it.</p>',
  '<p><small>see: <a href="tpu-v1.geocities.ws">the TPU paper</a>, which is the',
  'nearest thing I have found to a description; <a href="thehandshake.geocities.ws">the',
  'handshake</a>, for what the radios say</small></p>',
  ...strip('inside-a-tower.geocities.ws'),
]);

export const ACCEL_SITES = [HUB, CRAY, CM, SYSTOLIC, TEXTURE, TPU, FORMATS, WALL, WAFER, LOTTERY, TOWER];
