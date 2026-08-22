// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE HISTORY-OF-AI WEBRINGS, 1900–2025.
//
// The field told as a history rather than a product line: the prehistory and
// cybernetics, the symbolic summers and their winters, the neural comeback, and
// the critics who kept the score. One main ring and three that cut along the
// two paradigms and the argument between them.

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
    'ringmaster is training a model. the ring turns anyway.</small></p>',
  ],
});

const R = {
  main: ['history-of-ai-ring.geocities.ws', 'History of AI Ring'],
  sym: ['symbolic-ai-ring.geocities.ws', 'The Symbolic Era Ring'],
  neu: ['neural-ai-ring.geocities.ws', 'The Neural Era Ring'],
  thought: ['ai-thought-ring.geocities.ws', 'What Is Intelligence Ring'],
};

export const AIH_RINGS = [
  ring(R.main[0], 'HISTORY OF AI RING', 'History of AI Ring', 'deeplearning',
    ['<p>Artificial intelligence as a history, from Boole and Turing through the '
      + 'Dartmouth summer to the transformer. The summers, the winters, and the two '
      + 'paradigms that keep trading places. Kept by people who read the papers, '
      + 'not the press releases.</p>'],
    [['boolean-logic.geocities.ws', 'Boole / the Laws of Thought'],
     ['turing-machine.geocities.ws', 'Turing &amp; computability'],
     ['mcculloch-pitts.geocities.ws', 'McCulloch &amp; Pitts'],
     ['cybernetics-wiener.geocities.ws', 'Wiener / cybernetics'],
     ['shannon-information.geocities.ws', 'Claude Shannon'],
     ['von-neumann.geocities.ws', 'John von Neumann'],
     ['dartmouth-1956.geocities.ws', 'The Dartmouth workshop'],
     ['mccarthy-ai.geocities.ws', 'John McCarthy'],
     ['minsky-society-of-mind.geocities.ws', 'Marvin Minsky'],
     ['logic-theorist.geocities.ws', 'Newell &amp; Simon'],
     ['expert-systems.geocities.ws', 'Expert systems'],
     ['ai-winter.geocities.ws', 'The AI winters'],
     ['perceptron-rosenblatt.geocities.ws', 'Rosenblatt / the perceptron'],
     ['backpropagation.geocities.ws', 'Backpropagation'],
     ['connectionism-pdp.geocities.ws', 'Parallel Distributed Processing'],
     ['hopfield-nets.geocities.ws', 'Hopfield nets'],
     ['judea-pearl.geocities.ws', 'Judea Pearl'],
     ['statistical-ml.geocities.ws', 'The statistical turn'],
     ['imagenet-fei-fei.geocities.ws', 'Fei-Fei Li / ImageNet'],
     ['alexnet-2012.geocities.ws', 'AlexNet, 2012'],
     ['hinton-deep.geocities.ws', 'Geoffrey Hinton'],
     ['lecun-bengio.geocities.ws', 'LeCun &amp; Bengio'],
     ['alphago-2016.geocities.ws', 'AlphaGo / DeepMind'],
     ['reinforcement-learning.geocities.ws', 'Reinforcement learning'],
     ['transformers-2017.geocities.ws', 'Attention Is All You Need'],
     ['scaling-laws.geocities.ws', 'Scaling laws &amp; the Bitter Lesson'],
     ['foundation-models.geocities.ws', 'Foundation models'],
     ['ai-safety-alignment.geocities.ws', 'AI safety &amp; alignment'],
     ['agi-debate.geocities.ws', 'The AGI question'],
     ['dreyfus-critique.geocities.ws', 'Hubert Dreyfus'],
     ['symbolic-vs-connectionist.geocities.ws', 'The great debate'],
     ['bias-and-power.geocities.ws', 'Bias, power &amp; the data'],
     ['ai-ethics-institutes.geocities.ws', 'The ethics turn'],
     ['embodiment-brooks.geocities.ws', 'Rodney Brooks'],
     ['lisp-machines.geocities.ws', 'The Lisp machines'],
     ['cyc-lenat.geocities.ws', 'Cyc / Douglas Lenat'],
     ['chess-and-games.geocities.ws', 'Machines that play'],
     ['schmidhuber-lstm.geocities.ws', 'Schmidhuber / LSTM'],
     ['the-turing-award-in-ai.geocities.ws', 'The Turing Award &amp; AI'],
     ['a-history-of-ai.geocities.ws', 'A history of AI'],
     ['two-cultures-of-ai.geocities.ws', 'Symbolic and statistical'],
     ['what-is-intelligence.geocities.ws', 'What is intelligence?'],
     ['ai-and-labour.geocities.ws', 'AI and work'],
     ['ai-1900-to-now.geocities.ws', 'The timeline, 1900 to now']],
    [R.sym, R.neu, R.thought]),

  ring(R.sym[0], 'THE SYMBOLIC ERA RING', 'The Symbolic Era Ring', 'symbolicai',
    ['<p>Good Old-Fashioned AI: logic, search, rules and hand-coded knowledge. '
      + 'The Dartmouth dream, the expert-system boom, the Lisp machines, and the '
      + 'winters when the promises came due.</p>'],
    [['dartmouth-1956.geocities.ws', 'The Dartmouth workshop'],
     ['mccarthy-ai.geocities.ws', 'John McCarthy'],
     ['minsky-society-of-mind.geocities.ws', 'Marvin Minsky'],
     ['logic-theorist.geocities.ws', 'Newell &amp; Simon'],
     ['expert-systems.geocities.ws', 'Expert systems'],
     ['ai-winter.geocities.ws', 'The AI winters'],
     ['lisp-machines.geocities.ws', 'The Lisp machines'],
     ['cyc-lenat.geocities.ws', 'Cyc / Douglas Lenat']],
    [R.main]),

  ring(R.neu[0], 'THE NEURAL ERA RING', 'The Neural Era Ring', 'connectionist',
    ['<p>The other paradigm: learn it from data. The perceptron, the long freeze, '
      + 'backprop and the revival, then AlexNet, the deep-learning explosion and '
      + 'the transformer that ate the field.</p>'],
    [['perceptron-rosenblatt.geocities.ws', 'Rosenblatt / the perceptron'],
     ['backpropagation.geocities.ws', 'Backpropagation'],
     ['connectionism-pdp.geocities.ws', 'Parallel Distributed Processing'],
     ['hopfield-nets.geocities.ws', 'Hopfield nets'],
     ['alexnet-2012.geocities.ws', 'AlexNet, 2012'],
     ['hinton-deep.geocities.ws', 'Geoffrey Hinton'],
     ['lecun-bengio.geocities.ws', 'LeCun &amp; Bengio'],
     ['schmidhuber-lstm.geocities.ws', 'Schmidhuber / LSTM'],
     ['alphago-2016.geocities.ws', 'AlphaGo / DeepMind'],
     ['transformers-2017.geocities.ws', 'Attention Is All You Need']],
    [R.main]),

  ring(R.thought[0], 'WHAT IS INTELLIGENCE RING', 'What Is Intelligence Ring', 'critics',
    ['<p>The argument, not the engineering. Can a machine think, what would count '
      + 'as evidence, and what the field means by intelligence in the first place. '
      + 'Dreyfus, the Chinese Room, embodiment, and the moving goalposts.</p>'],
    [['turing-machine.geocities.ws', 'Turing &amp; computability'],
     ['dreyfus-critique.geocities.ws', 'Hubert Dreyfus'],
     ['embodiment-brooks.geocities.ws', 'Rodney Brooks'],
     ['symbolic-vs-connectionist.geocities.ws', 'The great debate'],
     ['agi-debate.geocities.ws', 'The AGI question'],
     ['what-is-intelligence.geocities.ws', 'What is intelligence?'],
     ['two-cultures-of-ai.geocities.ws', 'Symbolic and statistical'],
     ['ai-and-labour.geocities.ws', 'AI and work']],
    [R.main]),
];
