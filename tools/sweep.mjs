// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// RETIRED. This was a free-identifier sweep over src/main.js, run by hand.
//
// It was broken and had been reporting `clean` against an EMPTY REGION. It
// found its bounds with indexOf on text it had already mangled: comment and
// string stripping ran as a chain of regexes, one of which swallowed most of
// the file, so both markers came back -1 and it sliced from -1 to -1. It looked
// at nothing and said so in the language of success.
//
// It was believed for months, and then v1.332 used two names in main.js without
// importing them and shipped, because the sweep was clean and no test loads
// main.js. The game answered nothing at all at a terminal.
//
// The check now lives in test/imports.test.js, where the suite runs it. It uses
// a scanner rather than a chain of regexes, and it asserts the region is a
// plausible size before drawing any conclusion from it.

console.log('tools/sweep.mjs is retired — the check is in test/imports.test.js.');
console.log('It was reporting `clean` over an empty region. Run:');
console.log('  node --test test/imports.test.js');
process.exit(1);
