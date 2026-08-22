// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE CHATBOT WEBRINGS, 1950–2026.
//
// From ELIZA to the large language models, the talking machines and the people
// who argued about them, tied together the way the old comp.ai groups tied
// them: one main ring, one for the companions and assistants, and one for the
// critics who kept asking what the fluency was worth.

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
    'ringmaster is waiting on a reply. the ring turns anyway.</small></p>',
  ],
});

const R = {
  main: ['chatbots-ring.geocities.ws', 'Chatbots Ring'],
  companion: ['companion-bots-ring.geocities.ws', 'Companions &amp; Assistants Ring'],
  critique: ['ai-critique-ring.geocities.ws', 'The AI Critique Ring'],
};

export const BOTS_RINGS = [
  ring(R.main[0], 'CHATBOTS RING', 'Chatbots Ring', 'classic',
    ['<p>Every machine that ever tried to hold up its end of a conversation, from '
      + 'the Rogerian parrot of 1966 to the models that write your homework. Kept '
      + 'by people who still remember what it felt like the first time one answered '
      + 'back.</p>'],
    [['turing-test.geocities.ws', 'The Turing Test'],
     ['eliza-weizenbaum.geocities.ws', 'ELIZA / Joseph Weizenbaum'],
     ['parry-colby.geocities.ws', 'PARRY'],
     ['shrdlu-winograd.geocities.ws', 'SHRDLU'],
     ['racter.geocities.ws', 'Racter'],
     ['computer-power-weizenbaum.geocities.ws', 'Computer Power and Human Reason'],
     ['chinese-room.geocities.ws', 'Searle&rsquo;s Chinese Room'],
     ['jabberwacky-cleverbot.geocities.ws', 'Jabberwacky &amp; Cleverbot'],
     ['alice-aiml.geocities.ws', 'A.L.I.C.E. &amp; AIML'],
     ['mitsuku-kuki.geocities.ws', 'Mitsuku / Kuki'],
     ['loebner-prize.geocities.ws', 'The Loebner Prize'],
     ['smarterchild.geocities.ws', 'SmarterChild'],
     ['clippy.geocities.ws', 'Clippy &amp; Microsoft Bob'],
     ['siri.geocities.ws', 'Siri'],
     ['alexa-cortana.geocities.ws', 'Alexa &amp; Cortana'],
     ['xiaoice.geocities.ws', 'Xiaoice 小冰'],
     ['replika.geocities.ws', 'Replika'],
     ['gpt-openai.geocities.ws', 'GPT / OpenAI'],
     ['chatgpt.geocities.ws', 'ChatGPT'],
     ['claude-anthropic.geocities.ws', 'Claude / Anthropic'],
     ['bard-gemini.geocities.ws', 'Bard / Gemini'],
     ['lamda-lemoine.geocities.ws', 'LaMDA &amp; the Lemoine affair'],
     ['character-ai.geocities.ws', 'Character.AI'],
     ['tay-microsoft.geocities.ws', 'Tay'],
     ['eugene-goostman.geocities.ws', 'Eugene Goostman'],
     ['bing-sydney.geocities.ws', 'Bing / Sydney'],
     ['stochastic-parrots.geocities.ws', 'On the Dangers of Stochastic Parrots'],
     ['eliza-effect.geocities.ws', 'The ELIZA effect'],
     ['weizenbaum-institute.geocities.ws', 'The Weizenbaum Institute'],
     ['dair-gebru.geocities.ws', 'DAIR / Timnit Gebru'],
     ['turkle-machines.geocities.ws', 'Sherry Turkle'],
     ['sbaitso-dr.geocities.ws', 'Dr. Sbaitso'],
     ['woebot-therapy.geocities.ws', 'Woebot'],
     ['kismet-breazeal.geocities.ws', 'Kismet / Cynthia Breazeal'],
     ['jibo-social-robots.geocities.ws', 'Jibo &amp; the social robots'],
     ['ramona-kurzweil.geocities.ws', 'Ramona / Ray Kurzweil'],
     ['the-chatterbot-survey.geocities.ws', 'A history of the chatterbot'],
     ['can-machines-think.geocities.ws', 'Can machines think?'],
     ['imitation-game-gender.geocities.ws', 'The imitation game, read again'],
     ['chatbots-and-loneliness.geocities.ws', 'Chatbots and loneliness'],
     ['social-media-bots.geocities.ws', 'The other bots']],
    [R.companion, R.critique]),

  ring(R.companion[0], 'COMPANIONS AND ASSISTANTS RING', 'Companions &amp; Assistants Ring', 'assistant',
    ['<p>The bots that were meant to help, or to keep you company: the paperclip, '
      + 'the voice in the kitchen, the therapist on a sound card, the one you '
      + 'talked to at night. Warmth on a schedule.</p>'],
    [['smarterchild.geocities.ws', 'SmarterChild'],
     ['clippy.geocities.ws', 'Clippy'],
     ['siri.geocities.ws', 'Siri'],
     ['alexa-cortana.geocities.ws', 'Alexa &amp; Cortana'],
     ['xiaoice.geocities.ws', 'Xiaoice'],
     ['replika.geocities.ws', 'Replika'],
     ['character-ai.geocities.ws', 'Character.AI'],
     ['sbaitso-dr.geocities.ws', 'Dr. Sbaitso'],
     ['woebot-therapy.geocities.ws', 'Woebot'],
     ['kismet-breazeal.geocities.ws', 'Kismet'],
     ['jibo-social-robots.geocities.ws', 'Jibo'],
     ['chatbots-and-loneliness.geocities.ws', 'Chatbots and loneliness']],
    [R.main]),

  ring(R.critique[0], 'THE AI CRITIQUE RING', 'The AI Critique Ring', 'critique',
    ['<p>The people who kept their heads while everyone else fell for the fluency: '
      + 'Weizenbaum on judgement, Searle on understanding, the stochastic-parrots '
      + 'paper on cost and bias, and the long argument about what would even count '
      + 'as a machine that thinks.</p>'],
    [['computer-power-weizenbaum.geocities.ws', 'Computer Power and Human Reason'],
     ['chinese-room.geocities.ws', 'Searle&rsquo;s Chinese Room'],
     ['stochastic-parrots.geocities.ws', 'On the Dangers of Stochastic Parrots'],
     ['eliza-effect.geocities.ws', 'The ELIZA effect'],
     ['tay-microsoft.geocities.ws', 'Tay'],
     ['bing-sydney.geocities.ws', 'Bing / Sydney'],
     ['dair-gebru.geocities.ws', 'DAIR / Timnit Gebru'],
     ['turkle-machines.geocities.ws', 'Sherry Turkle'],
     ['can-machines-think.geocities.ws', 'Can machines think?'],
     ['weizenbaum-institute.geocities.ws', 'The Weizenbaum Institute'],
     ['social-media-bots.geocities.ws', 'The other bots']],
    [R.main]),
];
