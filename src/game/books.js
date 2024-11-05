// THE BOOKS ON THE DISK.
//
// Whole works, in HTML, sitting in the laptop's own storage. They are the
// longest things in the game by an enormous margin and the only ones nobody
// wrote for it: Homer, Plato, Aurelius, Shelley, Melville, the King James
// translators and Shakespeare, all out of copyright and out of anyone's
// control, which is exactly why a Torite would keep them. A machine that holds
// the whole of Shakespeare and needs nothing from anybody to show it to you is
// the argument the readme makes, in the one form nobody can dispute.
//
// The Odyssey is on there too, which is either a joke at the game's expense or
// the point of it. The page says nothing about it at all, which is better.
//
// They open in Netscape rather than in a reader of their own, because they ARE
// web pages, and because the browser is already the thing on this machine for
// reading a page. The one wrinkle is size: the Shakespeare is seven megabytes,
// so the browser gets the file rather than the text. See the note on framing in
// main.js.
//
// Pure data. No world, no DOM.

export const BOOK_DIR = 'assets/media/laptop/books';

export const BOOKS = [
  {
    key: 'republic',
    dir: 'The Republic by Plato',
    file: 'The Republic by Plato.html',
    cover: '150-cover.png',
    title: 'The Republic',
    author: 'Plato',
    trans: 'translated by Benjamin Jowett',
    note: 'A cave, a fire, and some people who have never seen the fire.',
  },
  {
    key: 'odyssey',
    dir: 'The Odyssey by Homer',
    file: 'The Odyssey by Homer.html',
    cover: 'images/cover.jpg',
    title: 'The Odyssey',
    author: 'Homer',
    trans: 'translated by Samuel Butler',
    note: 'A man a long way from home, taking the long way back.',
  },
  {
    key: 'meditations',
    dir: 'Meditations by Marcus Aurelius',
    file: 'Meditations by Marcus Aurelius.html',
    cover: 'images/cover.jpg',
    title: 'Meditations',
    author: 'Marcus Aurelius',
    trans: '',
    note: 'Written to himself, at night, on campaign. Not meant for us.',
  },
  {
    key: 'frankenstein',
    dir: 'Frankenstein or the modern prometheus by Mary Wollstonecraft Shelley',
    file: 'Frankenstein or the modern prometheus by Mary Wollstonecraft Shelley.html',
    cover: 'images/cover.jpg',
    title: 'Frankenstein',
    author: 'Mary Wollstonecraft Shelley',
    trans: 'or, The Modern Prometheus',
    note: 'The maker is the one who runs away. That is the part people forget.',
  },
  {
    key: 'mobydick',
    dir: 'Moby Dick Or The Whale by Herman Melville',
    file: 'Moby Dick Or The Whale by Herman Melville.html',
    cover: 'images/cover.jpg',
    title: 'Moby-Dick',
    author: 'Herman Melville',
    trans: 'or, The Whale',
    note: 'A great deal about whales, and a man who will not be talked out of it.',
  },
  {
    key: 'kjv',
    dir: 'The King James Bible',
    file: 'The King James Bible.html',
    cover: 'images/cover.jpg',
    title: 'The King James Bible',
    author: '',
    trans: 'the 1611 translation',
    note: 'Four and a half megabytes. Somebody thought it was worth the space.',
  },
  {
    key: 'shakespeare',
    dir: 'The Complete Works of William Shakespeare by William Shakespeare',
    file: 'The Complete Works of William Shakespeare by William Shakespeare.html',
    cover: 'images/cover.jpg',
    title: 'The Complete Works',
    author: 'William Shakespeare',
    trans: '',
    note: 'All of it. Seven megabytes, which on a disk this size is a decision.',
  },
];

const BY_KEY = Object.fromEntries(BOOKS.map((b) => [b.key, b]));

export const bookByKey = (key) => BY_KEY[String(key || '').trim()] || null;
export const bookKeys = () => BOOKS.map((b) => b.key);

// A URL the browser can fetch. The directories have spaces in them, so every
// segment is encoded: a filename is not a URL, and the PDF reader learned that
// the hard way when a question mark in a title truncated the request.
export function bookPath(b) {
  return `${BOOK_DIR}/${encodeURIComponent(b.dir)}/${encodeURIComponent(b.file)}`;
}

export function coverPath(b) {
  if (!b.cover) return null;
  const parts = b.cover.split('/').map(encodeURIComponent).join('/');
  return `${BOOK_DIR}/${encodeURIComponent(b.dir)}/${parts}`;
}

// What `ls` shows in /home/books, and what `cat` says if you try to read one at
// the shell. The shape of the answer follows the PDFs: a machine saying plainly
// that this is not a thing the terminal can print.
export const bookFileName = (b) => `${b.key}.html`;

export function bookStub(b) {
  return [
    `<!DOCTYPE html>  ${b.title}${b.author ? ` — ${b.author}` : ''}`,
    '',
    `${b.note}`,
    '',
    'This is a web page, and a long one. Read it with:',
    '    netscape',
    `and open the library, or type:  book ${b.key}`,
  ].join('\n');
}

// The library index, served to the browser as a page like any other. Written
// here rather than in net.js because these are the laptop's own files and have
// nothing to do with the network: the library works with the card down, which
// is a fact worth a line on the page itself.
export function libraryPage() {
  return [
    '<!--bg:grey-->',
    '<h1>Library</h1>',
    '<p><small>Local storage. Nothing here needs the card.</small></p>',
    '<hr>',
    '<p>Books available:</p>',
    ...BOOKS.flatMap((b) => [
      `<h2>${b.title}</h2>`,
      `<p>${[b.author, b.trans].filter(Boolean).join(', ')}</p>`,
      `<p><small>${b.note}</small></p>`,
      `<a href="book:${b.key}">read ${b.title}</a>`,
    ]),
  ].join('\n');
}
