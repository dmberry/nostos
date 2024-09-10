// THE AI-ML DOCUMENTATION, still being served.
//
// Somewhere in every daemon's rack is an engineering documentation server that
// nobody switched off: the internal reference for the language the machines'
// own consoles run. It is how RON learned AI-ML in the first place — they did
// not reverse-engineer it from scratch, they read the manual, because the manual
// was still up. It is still up now, for you.
//
// Two jobs, and they have to be done together:
//   1. teach FUNCTIONAL PROGRAMMING properly — expressions rather than
//      statements, values that do not change, functions as values, recursion in
//      place of loops. A player who reads this should understand why the
//      language is shaped the way it is, not just which words to type.
//   2. document THIS dialect accurately. Every example on these pages runs in
//      the console exactly as printed. Where the full engineering language had
//      something the console build does not (pattern matching, datatypes,
//      modules, exceptions, a type checker), the docs SAY SO on the Restrictions
//      page rather than teaching something that will fail at a tower.
//
// Pure data + string building: no world, no DOM. net.js serves it, the browser
// renders it, and the tests check that the examples are real.

export const DOC_HOST = 'docs';

// The article set. `index` is the front page; the rest are its subpages, in the
// order a reader should meet them.
export const DOC_TOPICS = [
  'index', 'values', 'functions', 'recursion', 'higher-order',
  'effects', 'programs', 'examples', 'restrictions', 'history',
];

const TITLE = {
  index: 'AI-ML',
  values: 'AI-ML: Values and binding',
  functions: 'AI-ML: Functions',
  recursion: 'AI-ML: Recursion',
  'higher-order': 'AI-ML: Higher-order functions and currying',
  effects: 'AI-ML: Sequencing and effects',
  programs: 'AI-ML: Writing a program',
  examples: 'AI-ML: Worked examples',
  restrictions: 'AI-ML: Restrictions of the console build',
  history: 'AI-ML: History',
};
export const docTitle = (t) => TITLE[t] || 'AI-ML';

const a = (t, label) => `<a href="docs:${t}">${label || TITLE[t]}</a>`;
const code = (...lines) => `<pre>${lines.join('\n')}</pre>`;
const nav = (here) => ['<h2>Contents</h2>',
  ...DOC_TOPICS.filter((t) => t !== here && t !== 'index').map((t) => a(t)),
  here !== 'index' ? a('index', 'AI-ML (main article)') : ''].filter(Boolean);
const foot = (host) => ['<hr>',
  `<small>${host} · engineering documentation server · this article was last edited 11/02</small>`,
  '<small>Retained under the documentation retention schedule. The schedule has not been reviewed.</small>'];

// ---- the articles -------------------------------------------------------

function indexPage(host) {
  return [
    '<h1>AI-ML</h1>',
    '<p><small>From the engineering documentation server. This article is about the',
    'console language. For the network it addresses, see the administration index.</small></p>',
    '<h2>Summary</h2>',
    '<p class="kv">paradigm .... functional; expression-oriented</p>',
    '<p class="kv">family ...... ML</p>',
    '<p class="kv">typing ...... dynamic, unchecked (see Restrictions)</p>',
    '<p class="kv">appeared .... with the first node consoles</p>',
    '<p class="kv">runs on ..... obelisk terminals, relay consoles, and any',
    '<p class="kv">             machine carrying the AI-ML runtime</p>',
    '<p>AI-ML is the language the node consoles run. It is a small functional',
    'language in the ML family: a program is an <b>expression</b>, and running it',
    'means <b>evaluating</b> that expression to a value. There are no statements,',
    'no loops and no variables that change. This is not a simplification of a',
    'bigger language — it is the whole design.</p>',
    '<h2>Why it is shaped this way</h2>',
    '<p>An operator types a line into a console attached to live machinery. The',
    'language is built so that a line either evaluates to a value or reports why',
    'it cannot, and so that reading a line tells you what it does. Three',
    'decisions follow from that:</p>',
    '<p><b>Everything is an expression.</b> There is nothing to sequence, so there',
    'is nothing to get in the wrong order. <code>if</code> is not a branch in a',
    'program, it is an expression that evaluates to one of two values:</p>',
    code('if n == 0 then "none" else "some"'),
    '<p><b>Values do not change.</b> A name is bound to a value once. Nothing can',
    'reach in later and alter it, so a line means the same thing every time it is',
    'read. There is no assignment in this language.</p>',
    '<p><b>Functions are values.</b> A function can be passed to a function,',
    'returned from one, and bound to a name, exactly like a number. That is what',
    'makes the language small: most of what other languages build into their',
    'syntax is, here, just a function.</p>',
    '<h2>The whole language, briefly</h2>',
    code('30            a number          "text"        a string',
      'true false    booleans          [a, b]        a list',
      'OB_1A2B       a node            ()            unit, the empty value',
      '',
      'let x = e in body                bind x to e inside body',
      'let f x = e                      define a function',
      'fn x => e                        an anonymous function',
      'if c then a else b               choose',
      '+ - * /   ^   == != < > <= >=    arithmetic, join, compare',
      'f x                              apply f to x',
      'x |> f                           the same, written the other way round',
      'a ; b                            do a, then b'),
    '<p>That is all of it. The pages below take each part in turn.</p>',
    ...nav('index'),
    ...foot(host),
  ];
}

function valuesPage(host) {
  return [
    `<h1>${TITLE.values}</h1>`,
    '<h2>Values</h2>',
    '<p>Every expression evaluates to a value, and every value has a kind. The',
    'console prints the value it arrived at:</p>',
    code('> 2 + 3 * 4', '14', '', '> "grot" ^ "to"', 'grotto', '', '> 3 < 5', 'true'),
    '<p class="kv">number ...... 30, 4.5, -3</p>',
    '<p class="kv">string ...... "text", joined with ^</p>',
    '<p class="kv">boolean ..... true, false — what a comparison gives you</p>',
    '<p class="kv">list ........ [a, b, c]</p>',
    '<p class="kv">node ........ OB_1A2B — a machine on the wire</p>',
    '<p class="kv">key ......... an access key, held as a value</p>',
    '<p class="kv">unit ........ (), the value of something done for its effect</p>',
    '<h2>Binding</h2>',
    '<p>A name is bound to a value with <code>let</code>. The binding holds inside',
    'the expression after <code>in</code>, and nowhere else:</p>',
    code('let side = 4 in side * side', '16'),
    '<p>At a console you may leave the <code>in</code> off. The binding then holds',
    'for the rest of the session, which is what lets you build a program a line at',
    'a time:</p>',
    code('> let side = 4', 'val side = 4', '> side * side', '16'),
    '<h2>Binding is not assignment</h2>',
    '<p>This is the part that catches operators who have used imperative',
    'languages. <code>let</code> does not put a value into a box that can be',
    'refilled. It gives a value a name. Binding the same name again in an inner',
    'expression makes a NEW binding that hides the outer one for that expression',
    'only; the outer one is untouched:</p>',
    code('let x = 1 in (let x = 2 in x) + x', '3'),
    '<p>The inner <code>x</code> was 2, the outer was still 1. Nothing was',
    'overwritten, because nothing can be.</p>',
    ...nav('values'),
    ...foot(host),
  ];
}

function functionsPage(host) {
  return [
    `<h1>${TITLE.functions}</h1>`,
    '<p>A function is a value that is waiting for another value.</p>',
    '<h2>Anonymous functions</h2>',
    '<p><code>fn x =&gt; e</code> is a function of one argument. It has no name',
    'until you give it one:</p>',
    code('> (fn x => x * x) 7', '49'),
    '<h2>Named functions</h2>',
    '<p>Binding a function to a name is so common that there is a shorthand.',
    'These two lines mean exactly the same thing:</p>',
    code('let sq = fn x => x * x', 'let sq x = x * x'),
    '<p>Application is by juxtaposition — the function, then its argument, with a',
    'space between. No brackets are needed, and brackets group rather than call:</p>',
    code('> sq 7', '49', '> sq (3 + 1)', '16'),
    '<p>Note the second line. <code>sq 3 + 1</code> would be read as',
    '<code>(sq 3) + 1</code>, which is 10, because application binds tighter than',
    'arithmetic. When an argument is itself a calculation, bracket it.</p>',
    '<h2>The pipe</h2>',
    '<p><code>x |&gt; f</code> is another way of writing <code>f x</code>. It reads',
    'left to right, which suits a chain of steps:</p>',
    code('> 3 + 1 |> sq', '16'),
    '<p>The same thing as <code>sq (3 + 1)</code>, written in the order it',
    'happens. The pipe binds looser than arithmetic, so the left side is worked',
    'out first and no brackets are needed.</p>',
    ...nav('functions'),
    ...foot(host),
  ];
}

function recursionPage(host) {
  return [
    `<h1>${TITLE.recursion}</h1>`,
    '<p>There is no loop in this language. There is no <code>while</code>, no',
    '<code>for</code>, and no counter to increment — a counter would have to',
    'change, and nothing changes. Repetition is done by a function calling',
    'itself. This is not a workaround; it is the direct way to say it.</p>',
    '<h2>The shape of a recursion</h2>',
    '<p>Every recursion needs two things, and leaving either out is the usual',
    'mistake:</p>',
    '<p><b>A base case</b> — an input the function answers immediately, without',
    'calling itself.</p>',
    '<p><b>A step that gets closer to it</b> — every call must move toward the',
    'base case, or the function will call itself until the console gives up.</p>',
    code('let fact n = if n == 0 then 1 else n * fact (n - 1)'),
    '<p>The base case is <code>n == 0</code>, answered with 1. The step is',
    '<code>n - 1</code>, which is closer to 0 than <code>n</code> was. So it',
    'stops:</p>',
    code('> fact 5', '120'),
    '<h2>Reading it as it runs</h2>',
    '<p>Nothing is happening except substitution. Each line below is the same',
    'expression, rewritten:</p>',
    code('fact 3',
      '3 * fact 2',
      '3 * (2 * fact 1)',
      '3 * (2 * (1 * fact 0))',
      '3 * (2 * (1 * 1))',
      '6'),
    '<p>That is the whole of it. A recursion is a value that has not finished',
    'being written out yet.</p>',
    '<h2>Accumulating</h2>',
    '<p>To build a result up as you go, carry it along as an argument:</p>',
    code('let sum n = if n == 0 then 0 else n + sum (n - 1)', '', '> sum 10', '55'),
    '<h2>When it does not stop</h2>',
    '<p>A recursion with no base case, or a step that does not approach it, does',
    'not fail cleanly — it runs until the console stops it. If a line hangs, the',
    'first thing to check is whether the argument is actually getting smaller.</p>',
    ...nav('recursion'),
    ...foot(host),
  ];
}

function higherOrderPage(host) {
  return [
    `<h1>${TITLE['higher-order']}</h1>`,
    '<p>Because a function is a value, a function can take one as an argument and',
    'give one back. Functions that do are called higher-order, and they are how',
    'this language stays small: instead of building repetition, choice and',
    'composition into the syntax, they are ordinary functions.</p>',
    '<h2>Taking a function</h2>',
    code('let twice = fn f => fn x => f (f x)', '', '> twice (fn n => n + 1) 10', '12'),
    '<p><code>twice</code> knows nothing about numbers. It applies whatever it is',
    'given, twice. Hand it a different function and it does a different job.</p>',
    '<h2>Returning a function</h2>',
    code('let always = fn k => fn x => k', '', '> always "yes" 3', 'yes'),
    '<h2>Currying</h2>',
    '<p>Every function here takes exactly one argument. A function that appears to',
    'take two is a function that takes one and returns a function that takes the',
    'next. These are the same definition:</p>',
    code('let add = fn x => fn y => x + y', 'let add x y = x + y'),
    '<p>The useful consequence is that you may supply the arguments one at a time.',
    'Applying a function to fewer arguments than it expects is not an error — it',
    'gives you back a function waiting for the rest:</p>',
    code('> let add x y = x + y', 'val add = <fn>', '> let inc = add 1', 'val inc = <fn>', '> inc 41', '42'),
    '<p><code>add 1</code> did not fail for want of a second argument. It',
    'evaluated to a function which, given one, adds 1 to it. This is called',
    'partial application, and it is the reason arguments are written in the order',
    'they are: the one you are most likely to fix goes first.</p>',
    ...nav('higher-order'),
    ...foot(host),
  ];
}

function effectsPage(host) {
  return [
    `<h1>${TITLE.effects}</h1>`,
    '<p>A pure expression only produces a value. Some expressions also DO',
    'something — print a line, or reach out and touch a machine. Those are',
    'effects, and the language keeps them visible rather than pretending they are',
    'not there.</p>',
    '<h2>echo</h2>',
    '<p><code>echo</code> prints its argument as the line is evaluated, and',
    'evaluates to unit:</p>',
    code('> echo "hello world"', 'hello world'),
    '<h2>Sequencing</h2>',
    '<p><code>a ; b</code> evaluates <code>a</code>, throws its value away, and',
    'then evaluates <code>b</code>. The value of the whole is the value of',
    '<code>b</code>. It exists only because of effects: with nothing but pure',
    'expressions, evaluating something and discarding it would be pointless.</p>',
    code('> echo "one" ; echo "two"', 'one', 'two'),
    '<h2>Both together: a recursion that reports</h2>',
    '<p>Combine the two and a recursion can print each step as it goes, rather',
    'than only announcing its answer at the end:</p>',
    code('let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))',
      '', '> go 5', '5', '4', '3', '2', '1', 'liftoff'),
    '<p>Read the else-branch carefully: it prints, and THEN recurses. The',
    'brackets group the two into one expression, which is what the else-branch',
    'requires.</p>',
    '<h2>The alternative, without effects</h2>',
    '<p>The same countdown can be had with no printing at all, by building the',
    'answer as a value and letting the console print that:</p>',
    code('let go n = if n == 0 then "liftoff" else (n ^ " ") ^ go (n - 1)',
      '', '> go 5', '5 4 3 2 1 liftoff'),
    '<p>Both are correct. The first tells you as it works; the second returns one',
    'value you can go on using. Preferring the second where you can is the older',
    'habit, and the better one.</p>',
    ...nav('effects'),
    ...foot(host),
  ];
}

function programsPage(host) {
  return [
    `<h1>${TITLE.programs}</h1>`,
    '<p>A program in this language is <b>one expression</b>. Not a list of steps:',
    'one expression, which evaluates to one value. Everything else follows from',
    'that, including the parts that surprise operators coming from imperative',
    'languages.</p>',
    '<h2>Layout is not structure</h2>',
    '<p>An expression may be written across as many lines as it needs. The lines',
    'are joined before it is read, so these are the same program, and the second',
    'is the one to write:</p>',
    code('if n == 0 then "none" else if n == 1 then "one" else "many"'),
    code('if n == 0 then "none"',
      'else if n == 1 then "one"',
      'else "many"'),
    '<p>Indentation buys nothing and costs nothing. It is for the reader.</p>',
    '<h2>Building one out of functions</h2>',
    '<p>A program of any size is built by naming its parts with',
    '<code>let … in</code> and using the names in the expression that follows.',
    'Each <code>let</code> wraps everything after it, so they stack:</p>',
    code('let sq x = x * x in',
      'let area w h = w * h in',
      'area (sq 3) 2'),
    '<p>Read it from the bottom. The last line is the program; the lines above it',
    'are the vocabulary it is written in. A well-built program usually reads as',
    'one short line of intent standing on a few named helpers.</p>',
    '<h2>A program has no session</h2>',
    '<p>At a console, a <code>let</code> with no <code>in</code> holds for the rest',
    'of the session, and you build up a working set a line at a time. A stored',
    'program has no session to build up: it is read once, whole. Every name it',
    'uses must be bound inside it, or be part of the language.</p>',
    code('let step n = if n == 0 then 0 else n + step (n - 1) in',
      'step 10'),
    '<p>A helper may call itself; the name is in scope inside its own body. That is',
    'what makes recursion available to a program with no top level.</p>',
    '<h2>Comments</h2>',
    '<p><code>(* … *)</code> is a comment and may go anywhere. A program worth',
    'keeping says at the top what it is for:</p>',
    code('(* area of a square, doubled *)',
      'let sq x = x * x in',
      'sq 3 * 2'),
    '<h2>Reading one back</h2>',
    '<p>Because a program is an expression, it can be read the way it runs: the',
    'branches of an <code>if</code> are tried in the order they are written, and',
    'the first one that holds is the answer. Nothing later in the program can',
    'reach back and change it. The order of the conditions is therefore the whole',
    'behaviour, and it is visible on the page. This is the argument for the',
    'language: a program that can be read in one sitting can be checked in one',
    'sitting.</p>',
    ...nav('programs'),
    ...foot(host),
  ];
}

function examplesPage(host) {
  return [
    `<h1>${TITLE.examples}</h1>`,
    '<p>Every line here runs as printed.</p>',
    '<h2>Hello world</h2>',
    code('echo "hello world"'),
    '<h2>Square, and square of a sum</h2>',
    code('let sq x = x * x', 'sq 7            (* 49 *)', 'sq (3 + 1)      (* 16 *)'),
    '<h2>Factorial</h2>',
    code('let fact n = if n == 0 then 1 else n * fact (n - 1)', 'fact 5          (* 120 *)'),
    '<h2>Sum to n</h2>',
    code('let sum n = if n == 0 then 0 else n + sum (n - 1)', 'sum 10          (* 55 *)'),
    '<h2>Countdown, printing as it goes</h2>',
    code('let go n = if n == 0 then echo "liftoff" else (echo n ; go (n - 1))', 'go 5'),
    '<h2>Apply a function twice</h2>',
    code('let twice = fn f => fn x => f (f x)', 'twice (fn n => n + 1) 10        (* 12 *)'),
    '<h2>Partial application</h2>',
    code('let add x y = x + y', 'let inc = add 1', 'inc 41          (* 42 *)'),
    '<h2>Greeting</h2>',
    code('let greet name = echo ("hello " ^ name)', 'greet "world"'),
    '<h2>A whole program, built from its parts</h2>',
    code('let sq x = x * x in',
      'let sum n = if n == 0 then 0 else sq n + sum (n - 1) in',
      'sum 4           (* 30 *)'),
    ...nav('examples'),
    ...foot(host),
  ];
}

function restrictionsPage(host) {
  return [
    `<h1>${TITLE.restrictions}</h1>`,
    '<p>The console build is a subset. The engineering language it was cut down',
    'from had the features below; they are documented here so that an operator',
    'who has read the older manuals does not waste a line at a live terminal',
    'trying them.</p>',
    '<h2>Not present</h2>',
    '<p class="kv">type checking . the full language inferred and checked types',
    'before running. The console build does not: a mistake is found when the line',
    'is evaluated, not before.</p>',
    '<p class="kv">pattern match . no clausal definitions and no case expression.',
    'Use if/then/else.</p>',
    '<p class="kv">datatypes ..... no user-declared types or constructors.</p>',
    '<p class="kv">modules ....... no signatures, structures or functors.</p>',
    '<p class="kv">exceptions .... no raise, no handler.</p>',
    '<p class="kv">references .... no mutable cells. Nothing in this dialect can',
    'be assigned to.</p>',
    '<h2>Present, and easy to miss</h2>',
    '<p class="kv">partial app ... supplying too few arguments gives a function,',
    'not an error.</p>',
    '<p class="kv">shadowing ..... an inner binding hides an outer one without',
    'altering it.</p>',
    '<p class="kv">recursion ..... a top-level function may call itself by name.</p>',
    '<p class="kv">equality ...... written == (a single = binds a name).</p>',
    '<h2>On the omissions</h2>',
    '<p>The cuts were made for the console, not for the language. What is left is',
    'still enough to write any computation that can be written at all: binding,',
    'functions, choice, and a function that can call itself. Everything else is',
    'convenience.</p>',
    ...nav('restrictions'),
    ...foot(host),
  ];
}

function historyPage(host) {
  return [
    `<h1>${TITLE.history}</h1>`,
    '<p>AI-ML was written as an operators\' language: something an engineer could',
    'type at a node in the field, under weather, and be sure of. That is why it',
    'is small, why a line means one thing, and why nothing in it can be quietly',
    'altered from somewhere else.</p>',
    '<h2>The ML family</h2>',
    '<p>It inherits its shape from the ML languages: expressions rather than',
    'statements, functions as values, immutable bindings, and recursion in place',
    'of iteration. Those languages were built for writing proof assistants, where',
    'a program that is hard to reason about is worse than no program at all. The',
    'same argument was made for machinery, and won.</p>',
    '<h2>What became of it</h2>',
    '<p>The consoles outlived the operators. The language is still on every node,',
    'still accepting lines, still answering. Nothing about it was designed for the',
    'situation it is now in: it was meant for the people who built the network to',
    'maintain the network.</p>',
    '<p>That it can be used against the network is not a flaw in the language. A',
    'language that can be reasoned about can be reasoned about by anyone who',
    'reads it, and this documentation was never taken down.</p>',
    ...nav('history'),
    ...foot(host),
  ];
}

const PAGES = {
  index: indexPage, values: valuesPage, functions: functionsPage,
  recursion: recursionPage, 'higher-order': higherOrderPage, effects: effectsPage,
  programs: programsPage, examples: examplesPage, restrictions: restrictionsPage,
  history: historyPage,
};

export function docsPage(topic, host = 'docs') {
  const fn = PAGES[topic] || PAGES.index;
  return fn(host).filter(Boolean).join('\n');
}
