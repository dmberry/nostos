// ELIZA — Joseph Weizenbaum's DOCTOR script (1966), the Rogerian
// psychotherapist. This is a compact reconstruction in the spirit of Anthony
// Hay's faithful reimplementation (github.com/anthay/ELIZA): a ranked keyword
// table, decomposition patterns with wildcards, cycling reassembly rules, the
// pronoun reflection that turns "my mother" into "your mother", and the MEMORY
// queue that lets the doctor bring an earlier remark back later. It is a period
// artefact — deliberately shallow — and in postAI it runs inside the RON-DOS
// terminal, a machine reading a human the way the machines read everything.

// Words the doctor flips when it echoes your sentence back at you.
const REFLECTIONS = {
  am: 'are', are: 'am', was: 'were', were: 'was',
  i: 'you', you: 'I', me: 'you',
  my: 'your', your: 'my', mine: 'yours', yours: 'mine',
  "i'm": 'you are', "you're": 'I am', "i'd": 'you would', "you'd": 'I would',
  "i've": 'you have', "you've": 'I have', "i'll": 'you will', "you'll": 'I will',
  myself: 'yourself', yourself: 'myself',
};

// Contraction / spelling tidy-ups run before anything else, as in the script.
const PRE = [
  [/\bdont\b/g, "don't"], [/\bcant\b/g, "can't"], [/\bwont\b/g, "won't"],
  [/\brecollect\b/g, 'remember'], [/\bdreamt\b/g, 'dreamed'],
  [/\bdreams\b/g, 'dream'], [/\bmaybe\b/g, 'perhaps'],
  [/\bcertainly\b/g, 'yes'], [/\bmachine\b/g, 'computer'],
  [/\bcomputers\b/g, 'computer'], [/\bwant\b/g, 'need'], [/\bsame\b/g, 'alike'],
  [/\beverybody\b/g, 'everyone'], [/\beveryone\b/g, 'everyone'],
  [/\bnobody\b/g, 'everyone'], [/\bim\b/g, "i'm"],
];

// Reflect a captured fragment: swap first/second person so the echo reads back.
function reflect(fragment) {
  return fragment
    .split(/\s+/)
    .map((w) => {
      const bare = w.toLowerCase().replace(/[.!?,;]+$/, '');
      return Object.prototype.hasOwnProperty.call(REFLECTIONS, bare) ? REFLECTIONS[bare] : w;
    })
    .join(' ')
    .trim();
}

// The keyword table. Each entry: a keyword, a rank (higher wins when several
// keywords appear), and a list of decomposition rules. A decomposition is a
// pattern where `*` matches any run of words; the matched runs fill (1), (2)…
// in the reassembly templates, which are cycled through on repeat matches.
const SCRIPT = [
  { key: 'sorry', rank: 0, rules: [
    { decomp: '*', reasmb: [
      "Please don't apologise.",
      'Apologies are not necessary.',
      'What feelings do you have when you apologise?',
      "I've told you that apologies are not required." ] } ] },
  { key: 'remember', rank: 5, rules: [
    { decomp: '* i remember *', reasmb: [
      'Do you often think of (2)?',
      'Does thinking of (2) bring anything else to mind?',
      'What else do you remember?',
      'Why do you remember (2) just now?',
      'What in this present situation reminds you of (2)?',
      'What is the connection between me and (2)?' ] },
    { decomp: '* do you remember *', reasmb: [
      'Did you think I would forget (2)?',
      'Why do you think I should recall (2) now?',
      'What about (2)?',
      'You mentioned (2)?' ] } ] },
  { key: 'dreamed', rank: 4, rules: [
    { decomp: '* i dreamed *', reasmb: [
      'Really, (2)?',
      'Have you ever fantasised (2) while you were awake?',
      'Have you dreamed (2) before?' ] } ] },
  { key: 'dream', rank: 3, rules: [
    { decomp: '*', reasmb: [
      'What does that dream suggest to you?',
      'Do you dream often?',
      'What persons appear in your dreams?',
      "Don't you believe that dream has to do with your problem?" ] } ] },
  { key: 'perhaps', rank: 0, rules: [
    { decomp: '*', reasmb: [
      "You don't seem quite certain.",
      'Why the uncertain tone?',
      "Can't you be more positive?",
      "You aren't sure?",
      "Don't you know?" ] } ] },
  { key: 'if', rank: 3, rules: [
    { decomp: '* if *', reasmb: [
      'Do you think it likely that (2)?',
      'Do you wish that (2)?',
      'What do you know about (2)?',
      'Really, if (2)?' ] } ] },
  { key: 'hello', rank: 0, rules: [
    { decomp: '*', reasmb: [
      'How do you do. Please state your problem.',
      'Hi. What seems to be your problem?' ] } ] },
  { key: 'computer', rank: 50, rules: [
    { decomp: '*', reasmb: [
      'Do computers worry you?',
      'Why do you mention computers?',
      'What do you think machines have to do with your problem?',
      "Don't you think computers can help people?",
      'What about machines worries you?',
      'What do you think about machines?' ] } ] },
  { key: 'am', rank: 0, rules: [
    { decomp: '* am i *', reasmb: [
      'Do you believe you are (2)?',
      'Would you want to be (2)?',
      'You wish I would tell you you are (2)?',
      'What would it mean if you were (2)?' ] } ] },
  { key: 'are', rank: 0, rules: [
    { decomp: '* you are *', reasmb: [
      'Why do you think I am (2)?',
      'Does it please you to believe I am (2)?',
      'Perhaps I am (2).',
      'Do you sometimes wish you were (2)?' ] },
    { decomp: '* are you *', reasmb: [
      'Why are you interested in whether I am (2) or not?',
      "Would you prefer if I weren't (2)?",
      'Perhaps I am (2) in your fantasies.',
      'Do you sometimes think I am (2)?' ] },
    { decomp: '* are *', reasmb: [
      'Did you think they might not be (2)?',
      'Would you like it if they were not (2)?',
      'What if they were not (2)?',
      'Are they always (2)?' ] } ] },
  { key: 'your', rank: 0, rules: [
    { decomp: '* your *', reasmb: [
      'Why are you concerned over my (2)?',
      'What about your own (2)?',
      'Are you worried about someone else’s (2)?',
      'Really, my (2)?' ] } ] },
  { key: 'was', rank: 2, rules: [
    { decomp: '* was you *', reasmb: [
      'What if you were (2)?',
      'Do you think you were (2)?',
      'Were you (2)?',
      'What would it mean if you were (2)?' ] },
    { decomp: '* i was *', reasmb: [
      'Were you really?',
      'Why do you tell me you were (2) now?',
      'Perhaps I already knew you were (2).' ] } ] },
  { key: 'i', rank: 0, rules: [
    { decomp: '* i need *', reasmb: [
      'What would it mean to you if you got (2)?',
      'Why do you need (2)?',
      'Suppose you got (2) soon.',
      'What if you never got (2)?' ] },
    { decomp: "* i am *", reasmb: [
      'Is it because you are (2) that you came to me?',
      'How long have you been (2)?',
      'Do you believe it is normal to be (2)?',
      'Do you enjoy being (2)?' ] },
    { decomp: "* i can't *", reasmb: [
      "How do you know you can't (2)?",
      'Perhaps you could (2) if you tried.',
      'What if you could (2)?' ] },
    { decomp: '* i feel *', reasmb: [
      'Tell me more about such feelings.',
      'Do you often feel (2)?',
      'Do you enjoy feeling (2)?' ] },
    { decomp: "* i don't *", reasmb: [
      "Don't you really (2)?",
      "Why don't you (2)?",
      'Do you wish to be able to (2)?' ] },
    { decomp: '*', reasmb: [
      'You say (1)?',
      'Can you elaborate on that?',
      'Do you say (1) for some special reason?',
      'That’s quite interesting.' ] } ] },
  { key: 'you', rank: 0, rules: [
    { decomp: '* you * me *', reasmb: [
      'Why do you think I (2) you?',
      'You like to think I (2) you, don’t you?',
      'What makes you think I (2) you?',
      'Really, I (2) you?' ] },
    { decomp: '* you *', reasmb: [
      'We were discussing you, not me.',
      'Oh, I (2)?',
      'You’re not really talking about me, are you?',
      'What are your feelings now?' ] } ] },
  { key: 'yes', rank: 0, rules: [
    { decomp: '*', reasmb: [
      'You seem quite positive.',
      'You are sure?',
      'I see.',
      'I understand.' ] } ] },
  { key: 'no', rank: 0, rules: [
    { decomp: '*', reasmb: [
      'Are you saying no just to be negative?',
      'You are being a bit negative.',
      'Why not?',
      "Why 'no'?" ] } ] },
  { key: 'my', rank: 2, memory: true, rules: [
    { decomp: '* my *', reasmb: [
      'Why are you concerned over my... your (2)?',
      'Does that suggest anything else which belongs to you?',
      'Is it important to you that your (2)?',
      'Tell me more about your (2).' ] } ] },
  { key: 'can', rank: 0, rules: [
    { decomp: '* can you *', reasmb: [
      'You believe I can (2), don’t you?',
      'Perhaps you would like to be able to (2) yourself?',
      'Whether or not you can (2) depends on you more than on me.' ] },
    { decomp: '* can i *', reasmb: [
      'Whether or not you can (2) is up to you.',
      'Do you want to be able to (2)?',
      'Perhaps you don’t want to (2).' ] } ] },
  { key: 'what', rank: 0, rules: [
    { decomp: '*', reasmb: [
      'Why do you ask?',
      'Does that question interest you?',
      'What answer would please you most?',
      'What comes to mind when you ask that?',
      'Have you asked such questions before?' ] } ] },
  { key: 'because', rank: 0, rules: [
    { decomp: '*', reasmb: [
      'Is that the real reason?',
      "Don't any other reasons come to mind?",
      'Does that reason seem to explain anything else?',
      'What other reasons might there be?' ] } ] },
  { key: 'why', rank: 0, rules: [
    { decomp: "* why don't you *", reasmb: [
      'Do you believe I don’t (2)?',
      'Perhaps I will (2) in good time.',
      'Should you (2) yourself?' ] },
    { decomp: '*', reasmb: [ 'Why do you ask?', 'Why don’t you tell me?' ] } ] },
  { key: 'everyone', rank: 2, rules: [
    { decomp: '*', reasmb: [
      'Really, everyone?',
      'Surely not everyone.',
      'Can you think of anyone in particular?',
      'Who, may I ask?',
      'You are thinking of a very special person.' ] } ] },
  { key: 'always', rank: 1, rules: [
    { decomp: '*', reasmb: [
      'Can you think of a specific example?',
      'When?',
      'What incident are you thinking of?',
      'Really, always?' ] } ] },
  { key: 'like', rank: 10, rules: [
    { decomp: '* like *', reasmb: [
      'In what way?',
      'What resemblance do you see?',
      'What does that similarity suggest to you?',
      'Could there really be some connection?' ] } ] },
  { key: 'mother', rank: 3, rules: [
    { decomp: '*', reasmb: [ 'Tell me more about your family.', 'Who else in your family (2)?', 'What about your family?' ] } ] },
  { key: 'father', rank: 3, rules: [
    { decomp: '*', reasmb: [ 'Tell me more about your family.', 'Does your father influence you strongly?', 'What else comes to mind when you think of your father?' ] } ] },
];

// The catch-all when no keyword is found (and nothing is stored in memory).
const NONE = [
  "I'm not sure I understand you fully.",
  'Please go on.',
  'What does that suggest to you?',
  'Do you feel strongly about discussing such things?',
  'Tell me more.',
  'Can you elaborate on that?',
];

// Build a matcher regex from a decomposition pattern using `*` wildcards.
function decompToRegex(decomp) {
  const parts = decomp.trim().split(/\s+/);
  let re = '^';
  parts.forEach((p, idx) => {
    if (p === '*') {
      re += '(.*)';
    } else {
      if (idx > 0) re += '\\s*';
      re += p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }
    if (idx < parts.length - 1 && p !== '*' && parts[idx + 1] !== '*') re += '\\s+';
  });
  re += '$';
  return new RegExp(re, 'i');
}

// Fill a reassembly template: (n) -> reflected capture group n, (0)/(1)... .
function assemble(template, groups) {
  return template.replace(/\((\d+)\)/g, (_, n) => {
    const g = groups[Number(n)] || '';
    return reflect(g.trim());
  }).replace(/\s+/g, ' ').trim();
}

export function createEliza() {
  // Per-rule reassembly cursors so repeated matches cycle answers, and a small
  // memory queue the doctor draws on when you say something with no keyword.
  const cursors = new Map();
  const memory = [];
  let noneIdx = 0;

  // Which keywords appear in a phrase (used to pick the clause to work on).
  const hasKeyword = (t) => SCRIPT.some((e) =>
    new RegExp('\\b' + e.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b').test(t));

  const respond = (raw) => {
    // Lower-case, apply the substitution list, then — as the real DOCTOR does —
    // break the sentence at punctuation and work on the FIRST clause that holds
    // a keyword. Punctuation is dropped so it can never leak into a reply.
    let s = String(raw).toLowerCase().replace(/[^a-z0-9'\s.,;:!?]/g, ' ');
    for (const [pat, rep] of PRE) s = s.replace(pat, rep);
    const clauses = s.split(/[.,;:!?]+/).map((c) => c.replace(/\s+/g, ' ').trim()).filter(Boolean);
    let text = clauses.find(hasKeyword) || clauses[clauses.length - 1] || '';
    text = text.replace(/[^a-z0-9'\s]/g, ' ').replace(/\s+/g, ' ').trim();
    if (!text) return NONE[(noneIdx++) % NONE.length];

    // All keywords that appear, ranked high-to-low (stable by script order for
    // ties). We try each in turn and take the first whose decomposition matches
    // — so a keyword with no matching pattern (e.g. "am" against "I am X", which
    // has no "am I") falls through to the next, rather than dead-ending on a
    // weak catch-all.
    const matched = SCRIPT
      .filter((e) => new RegExp('\\b' + e.key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\b', 'i').test(text))
      .sort((a, b) => b.rank - a.rank);
    let any = false;
    for (const entry of matched) {
      any = true;
      for (let ri = 0; ri < entry.rules.length; ri++) {
        const rule = entry.rules[ri];
        const m = text.match(decompToRegex(rule.decomp));
        if (!m) continue;
        const key = entry.key + '#' + ri;
        const cur = cursors.get(key) || 0;
        cursors.set(key, cur + 1);
        const reply = assemble(rule.reasmb[cur % rule.reasmb.length], m);
        // MEMORY: stash a transformed version of what they said about "my ..."
        if (entry.memory && m[2]) {
          memory.push(`Earlier you said your ${reflect(m[2].trim())}. Does that still trouble you?`);
          if (memory.length > 5) memory.shift();
        }
        if (reply) return reply;
      }
    }

    // No keyword: sometimes surface a stored memory instead of a bare fallback.
    if (!any && memory.length && (noneIdx % 3 === 0)) { noneIdx++; return memory.shift(); }
    return NONE[(noneIdx++) % NONE.length];
  };

  return {
    greeting: () => 'How do you do. Please tell me your problem.',
    respond,
  };
}
