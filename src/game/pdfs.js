// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// THE DOCUMENTS ON THE DISK.
//
// Real PDFs, shipped in assets/media/pdfs/ and readable on the NostBook. They
// are the one place in the game where the player reads something a person
// actually wrote, rather than something written for the game — which is why
// they belong on the salvaged laptop rather than on the cache: the cache is the
// dead public net, and this is somebody's own machine, with their own papers on
// it.
//
// This module is the registry: what is on the disk, what it is called, and the
// line the reader shows underneath the title. Pure data. main.js does the
// window, unix.js does the filesystem entry, and the browser does the actual
// rendering, because a PDF viewer is not a thing to write from scratch.
//
// TO ADD ONE: drop the file in assets/media/pdfs/ and add a row here. The
// filesystem entry and the `pdf-viewer` command follow automatically.

export const PDF_DIR = 'assets/media/laptop/pdfs';

export const PDFS = [
  {
    file: 'ASIMOV_1980_Cult_of_Ignorance.pdf',
    name: 'cult_of_ignorance.pdf',      // as it appears in `ls`
    title: 'A Cult of Ignorance',
    author: 'Isaac Asimov',
    year: '1980',
    note: 'Two pages, cut from a magazine and scanned badly.',
  },
  {
    file: 'JAMES 1879 - Are We Automata?.pdf',
    name: 'are_we_automata.pdf',
    title: 'Are We Automata?',
    author: 'William James',
    year: '1879',
    note: 'A journal offprint. Somebody has gone through it with a pencil.',
  },
  {
    file: 'GONSETH 1956 - The Humanization of Technics.pdf',
    name: 'humanization_of_technics.pdf',
    title: 'The Humanization of Technics',
    author: 'Ferdinand Gonseth',
    year: '1956',
    note: 'A conference paper, stapled at the corner.',
  },
];

const BY_NAME = Object.fromEntries(PDFS.map((p) => [p.name, p]));

export const pdfNames = () => PDFS.map((p) => p.name);
export const pdfByName = (name) => BY_NAME[String(name || '').trim()] || null;
export const pdfPath = (p) => `${PDF_DIR}/${encodeURIComponent(p.file)}`;

// What `cat` shows if you try to read one at the shell: a PDF is not text, and
// saying so in the machine's own voice is better than printing binary.
export function pdfStub(p) {
  return [
    `%PDF-1.2  ${p.title} — ${p.author}, ${p.year}`,
    '',
    'This file is not text. Open it with:',
    `    pdf-viewer ${p.name}`,
  ].join('\n');
}
