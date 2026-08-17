// Share cards for the cached web.
//
// A link like /?cache=locarecords.com names a page inside the game, but the og:
// tags live in a static index.html and a query string does not change what the
// server sends, so every cached-web link unfurled as the game's own card. This
// answers crawlers with the page's own title instead.
//
// WHAT IS AND IS NOT GENERATED. Nothing is written for sharing. The title is the
// one the page already carries, the same string the in-game Netscape puts in its
// title bar. 181 addresses, aliases resolved, from tools/gen-card-titles.mjs.
// Only the image is shared across all of them: per-page images would mean
// drawing 181 or adding a renderer, and this repo has no build step.
//
// A MISS IS THE 404, not the game's default card (David, 2026-08-17). A link to
// something the cache never held unfurls as the archive saying so, which is the
// same answer the game gives when you open the same address.
//
// SELF-CONTAINED ON PURPOSE. Everything it needs is inside /api. It does not
// reach into ../src, because that would make a live deployment depend on the
// bundler tracing imports out of the functions directory in a repo with no
// package.json, and the worst case there is the game going down rather than a
// card looking wrong.
//
// Only crawlers get here: vercel.json routes on the `cache` query AND a bot
// user-agent, so a player always receives the game itself.
import { TITLES } from './_titles.mjs';

const SITE = 'https://nostos-ai.vercel.app';
const CARD = `${SITE}/assets/share-card-cache.jpg`;

const esc = (s) => String(s)
  .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;');

/**
 * The address out of the query, normalised the way the game normalises it: a
 * scheme is stripped, a trailing slash goes, and anything with a space or an @
 * in it is somebody else's URL pasted by accident. Mirrors cacheLink in
 * src/game/net.js; kept here so this file imports nothing from ../src.
 */
export function addressFrom(search) {
  let raw = '';
  try { raw = new URLSearchParams(String(search || '')).get('cache') || ''; } catch { return null; }
  raw = String(raw).trim().replace(/^[a-z][a-z0-9+.-]*:\/\//i, '').replace(/\/+$/, '').trim();
  if (!raw || /[\s@]/.test(raw)) return null;
  return raw;
}

export function cardFor(address) {
  const title = address && TITLES[address.toLowerCase()];
  if (title) {
    // The page's own title and nothing appended. Adding "from the cached web"
    // here gave the symposium an 88-character title with two dash clauses in it;
    // that framing belongs in og:site_name, which is what site_name is for.
    return {
      title,
      desc: 'A page recovered from before, kept as it was found. NostOS, a postAI Odyssey.',
    };
  }
  return {
    title: 'Not in store',
    desc: `The cache has no record of ${address || 'that address'}. That is not the same `
      + 'as the address never having existed: the crawl took what was answering on the '
      + 'night it ran.',
  };
}

export default function handler(req, res) {
  const q = String(req.url || '').includes('?') ? String(req.url).slice(String(req.url).indexOf('?')) : '';
  const address = addressFrom(q);
  const { title, desc } = cardFor(address);
  // A person following the link from the unfurl lands on the page they were sent.
  const canonical = address ? `${SITE}/?cache=${encodeURIComponent(address)}` : SITE;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 'public, max-age=0, must-revalidate');
  res.end(`<!doctype html>
<html lang="en"><head>
<meta charset="utf-8">
<title>${esc(title)}</title>
<meta property="og:type" content="article">
<meta property="og:site_name" content="NostOS \u2014 the cached web">
<meta property="og:url" content="${esc(canonical)}">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${CARD}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="A Netscape window on a teal desktop reading &quot;the cached web&quot;, with a rainbow rule, an UNDER CONSTRUCTION sign and a hit counter">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(title)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${CARD}">
<link rel="canonical" href="${esc(canonical)}">
</head><body>
<p><a href="${esc(canonical)}">${esc(title)}</a></p>
</body></html>`);
}
