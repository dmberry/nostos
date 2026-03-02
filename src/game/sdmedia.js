// NostOS — a postAI Odyssey.
// Copyright (C) 2026 David M. Berry
//
// This program is free software: you can redistribute it and/or modify it under
// the terms of the GNU General Public License as published by the Free Software
// Foundation, either version 3 of the License, or (at your option) any later
// version. This program is distributed WITHOUT ANY WARRANTY; see the GNU
// General Public License for details: <https://www.gnu.org/licenses/>.

// #113 — WHAT IS ON THE SD-CARDS.
//
// Video as it actually looked on a laptop in 1995: a postage stamp of a picture
// at 15 frames a second, sixteen colours, and every pixel the size of a grain of
// rice when you scaled it up (David, 2026-08-14: "it is just blocky"). Not ASCII
// art — real pixels, just very few of them.
//
// A clip is a FUNCTION, not a file of frames. Hand-authoring a hundred frames of
// anything is a fortnight of pixel-pushing and a megabyte of source; a render
// function that takes a time and paints a 64x48 indexed buffer is forty lines
// and gives real motion. The cost is that these are drawings of scenes rather
// than footage of them, which is the right trade at this resolution — at 64x48
// nobody can tell the difference and the file that would hold the difference is
// bigger than the game.
//
// Pure: no canvas, no DOM, no game state. It hands back palette indices and the
// player decides what to do with them, so the clips are testable and the same
// buffer could be drawn to a laptop screen, a phone LCD or a tower console.

/**
 * Sixteen colours, and they are the sixteen everybody had: the IBM/EGA set that
 * Windows kept as its system palette right through 95. Anything drawn from this
 * list looks like the period without being asked to.
 */
export const PALETTE = [
  '#000000', // 0  black
  '#0000aa', // 1  blue
  '#00aa00', // 2  green
  '#00aaaa', // 3  cyan
  '#aa0000', // 4  red
  '#aa00aa', // 5  magenta
  '#aa5500', // 6  brown
  '#aaaaaa', // 7  light grey
  '#555555', // 8  dark grey
  '#5555ff', // 9  bright blue
  '#55ff55', // 10 bright green
  '#55ffff', // 11 bright cyan
  '#ff5555', // 12 bright red
  '#ff55ff', // 13 bright magenta
  '#ffff55', // 14 yellow
  '#ffffff', // 15 white
];

export const CLIP_W = 64;
export const CLIP_H = 48;

// ---- the painter's little helpers -----------------------------------------
//
// A clip's render function gets one of these rather than a raw array, so the
// clips read as drawing instructions and nothing has to do its own bounds
// arithmetic. Everything clips silently at the edges, which is what you want
// when a figure walks off the side of the frame.

function painter(buf, w, h) {
  const px = (x, y, c) => {
    x |= 0; y |= 0;
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    buf[y * w + x] = c;
  };
  return {
    px,
    clear: (c) => buf.fill(c),
    rect: (x, y, rw, rh, c) => {
      for (let j = 0; j < rh; j++) for (let i = 0; i < rw; i++) px(x + i, y + j, c);
    },
    // A horizontal band, which at this size is most of what a background is.
    band: (y, rh, c) => {
      for (let j = 0; j < rh; j++) for (let i = 0; i < w; i++) px(i, y + j, c);
    },
    disc: (cx, cy, r, c) => {
      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) if (i * i + j * j <= r * r) px(cx + i, cy + j, c);
      }
    },
    // A standing figure, three pixels wide. At 64x48 that is a person.
    figure: (x, y, c, stride = 0) => {
      px(x, y, c); px(x + 1, y, c);              // head
      for (let j = 1; j < 5; j++) { px(x, y + j, c); px(x + 1, y + j, c); }  // body
      px(x - (stride ? 1 : 0), y + 5, c);        // legs, mid-stride or together
      px(x + 1 + (stride ? 1 : 0), y + 5, c);
    },
  };
}

// A tiny deterministic noise, so the analogue grain is the same on every replay
// and a test can assert a frame. (Math.random would make these unpinnable.)
function grain(x, y, f) {
  const n = Math.sin((x * 12.9898 + y * 78.233 + f * 3.71)) * 43758.5453;
  return n - Math.floor(n);
}

// ---- the clips -------------------------------------------------------------

export const CLIPS = {
  // A garden, a summer, somebody holding the camera badly. The most ordinary
  // thing on any of these cards and the one that costs the most to watch.
  birthday: {
    id: 'birthday',
    title: 'garden.avi',
    caption: "someone's garden, before",
    fps: 12,
    secs: 6,
    render(t, p, f) {
      const sway = Math.sin(t * 1.7) * 1.2;          // the hand holding it
      p.clear(11);                                    // a bright sky
      p.band(28, 20, 2);                              // grass
      p.rect(0, 24, CLIP_W, 5, 6);                    // a fence along the back
      for (let x = 2; x < CLIP_W; x += 6) p.rect(x + sway, 22, 1, 7, 6);
      p.disc(52 + sway * 0.5, 8, 5, 14);              // the sun
      // Three of them round a table. The small one is the reason for the film.
      p.rect(22 + sway, 30, 16, 2, 15);               // tablecloth
      p.rect(24 + sway, 32, 12, 4, 7);
      p.figure(20 + sway, 24, 4);
      p.figure(40 + sway, 24, 1);
      p.figure(30 + sway, 26, 14, Math.floor(t * 4) % 2);
      // Candles, and then not.
      const lit = t < 4.2;
      for (let i = 0; i < 3; i++) p.px(28 + i * 3 + sway, 29, lit ? 14 : 8);
      if (lit) for (let i = 0; i < 3; i++) p.px(28 + i * 3 + sway, 28, 12);
    },
  },

  // A car park, a camera on a pole, and the night the plant started running
  // itself. Pairs with hand-06 — the forklifts moving in the dark.
  yard: {
    id: 'yard',
    title: 'cam04.avi',
    caption: 'yard camera 4 — 03:14',
    fps: 8,
    secs: 8,
    mono: true,
    render(t, p, f) {
      p.clear(0);
      p.band(30, 18, 8);                              // tarmac
      p.rect(0, 26, CLIP_W, 4, 7);                    // the loading bay wall
      for (let x = 4; x < CLIP_W; x += 10) p.rect(x, 27, 6, 2, 0);   // shutters
      // Two pools of light, and the machines only exist inside them.
      for (const lx of [16, 46]) {
        for (let j = 0; j < 12; j++) {
          const wdt = 3 + j;
          for (let i = -wdt; i <= wdt; i++) if (grain(lx + i, j, 0) > 0.35) p.px(lx + i, 30 + j, 7);
        }
        p.px(lx, 24, 15); p.px(lx, 25, 15);
      }
      // A forklift crossing, right to left, carrying something square.
      const fx = 58 - (t * 6) % 74;
      p.rect(fx, 34, 7, 4, 15);
      p.rect(fx + 7, 32, 4, 6, 7);
      p.px(fx, 38, 0); p.px(fx + 6, 38, 0);
      // And a second, further back, on its own errand.
      const gx = ((t * 4) % 74) - 10;
      p.rect(gx, 31, 5, 3, 7);
      // Timecode burn-in, bottom right, and the tape is old.
      for (let i = 0; i < 8; i++) p.px(50 + i, 45, (i === 2 || i === 5) ? 8 : 15);
      for (let y = 0; y < CLIP_H; y++) if (grain(0, y, f) > 0.97) p.band(y, 1, 7);
    },
  },

  // The last thing the estate put out before it stopped putting anything out.
  // The slogan the hum-* fragments keep finding sprayed over.
  promo: {
    id: 'promo',
    title: 'launch.avi',
    caption: 'corporate — internal use',
    fps: 10,
    secs: 7,
    render(t, p, f) {
      p.clear(1);
      // A slow wipe of light across the field, the way every corporate title
      // card in 1995 was made.
      const wipe = (t * 14) % 90 - 20;
      for (let x = 0; x < CLIP_W; x++) {
        const d = Math.abs(x - wipe);
        if (d < 7) for (let y = 0; y < CLIP_H; y++) p.px(x, y, d < 3 ? 9 : 1);
      }
      // The mark: a tower, obviously, though nobody called it that yet.
      const grow = Math.min(1, t / 2.2);
      const th = Math.round(24 * grow);
      p.rect(30, 34 - th, 4, th, 15);
      p.rect(28, 34, 8, 2, 7);
      if (t > 2.4) p.disc(32, 34 - th, 2, 14);        // the eye lights
      if (t > 3.0) {
        // MAGNIFICA, in the only way 64 pixels can say it: a bar of letters.
        for (let i = 0; i < 9; i++) p.rect(14 + i * 4, 40, 3, 4, (t * 6 + i) % 9 < 6 ? 15 : 7);
      }
      if (t > 5.2) for (let i = 0; i < 6; i++) p.rect(20 + i * 4, 6, 3, 3, 14);
    },
  },

  // A caption card, degrading. There was nobody left to change it.
  broadcast: {
    id: 'broadcast',
    title: 'bcast.avi',
    caption: 'off-air — recorded from transmission',
    fps: 12,
    secs: 9,
    render(t, p, f) {
      // Test-card bars, going wrong as the tape does.
      const bars = [15, 14, 11, 10, 13, 12, 9, 0];
      const rot = Math.floor(t * 0.7);
      for (let i = 0; i < 8; i++) p.rect(i * 8, 0, 8, 30, bars[(i + rot) % 8]);
      p.rect(0, 30, CLIP_W, 18, 0);
      // The caption, three words wide, blinking out a letter at a time.
      const gone = Math.floor(t * 1.4);
      for (let i = 0; i < 11; i++) {
        if (i < gone && (i * 7 + f) % 5 !== 0) continue;
        p.rect(6 + i * 5, 36, 3, 5, 15);
      }
      // Dropout: whole lines of the picture giving up, more of them as it runs.
      const bad = Math.min(0.5, t / 22);
      for (let y = 0; y < 30; y++) {
        if (grain(3, y, f) < bad) {
          const shift = Math.floor(grain(y, 9, f) * 12) - 6;
          for (let x = 0; x < CLIP_W; x++) p.px(x, y, bars[((x + shift) >> 3) % 8 & 7]);
        }
      }
      if (t > 7.4) p.clear(0);                        // and then it stops
    },
  },
};

/** How many frames a clip runs to. */
export function frameCount(clip) {
  return Math.max(1, Math.round(clip.fps * clip.secs));
}

/**
 * Paint one frame. Returns a Uint8Array of CLIP_W*CLIP_H palette indices —
 * the player turns those into pixels, this only decides which.
 *
 * `n` is a frame number rather than a time so playback is exactly reproducible:
 * the same card shows the same film every time it is read, which matters for a
 * thing the player may watch twice looking for a detail.
 */
export function renderFrame(clip, n, out = null) {
  const buf = out || new Uint8Array(CLIP_W * CLIP_H);
  const f = ((n % frameCount(clip)) + frameCount(clip)) % frameCount(clip);
  const t = f / clip.fps;
  const p = painter(buf, CLIP_W, CLIP_H);
  p.clear(0);
  clip.render(t, p, f);
  // A monochrome camera is monochrome all the way down: fold the palette to the
  // greys after the clip has drawn, so a clip does not have to know.
  if (clip.mono) {
    const grey = [0, 8, 8, 7, 8, 8, 8, 7, 8, 7, 7, 15, 7, 7, 15, 15];
    for (let i = 0; i < buf.length; i++) buf[i] = grey[buf[i]] ?? buf[i];
  }
  return buf;
}

// ---- what is on which card -------------------------------------------------
//
// Four cards, each a found object with a reason to exist. The tree each one
// mounts is an ordinary Unix directory, so `ls /mnt/<card>` and `cat` work on
// them like anything else and only the .avi files need the player.

export const MEDIA_CARDS = {
  sd_home: {
    at: 'home', name: 'SD card, handwritten label', clips: ['birthday'],
    label: 'GARDEN 97',
    readme: [
      'No index, no dates, one file.',
      '',
      'Somebody labelled this in biro and then never labelled another one,',
      'which is either because they stopped filming or because after a while',
      'you know which card is which without being told.',
    ].join('\n'),
  },
  sd_yard: {
    at: 'cam', name: 'SD card, plant security', clips: ['yard'],
    label: 'CAM04 OVERNIGHT',
    readme: [
      'RETENTION: 30 DAYS. OVERWRITE AUTOMATIC.',
      '',
      'The overwrite did not run. Nothing on this site ran after the date on',
      'the file, except the things in the picture.',
    ].join('\n'),
  },
  sd_promo: {
    at: 'promo', name: 'SD card, estate issue', clips: ['promo'],
    label: 'LAUNCH — INTERNAL',
    readme: [
      'Asset copy. Do not distribute outside the estate.',
      '',
      'Approved wording is on the card with the film. Note that the mark is',
      'not to be described as a tower in any material.',
    ].join('\n'),
  },
  sd_bcast: {
    at: 'bcast', name: 'SD card, taped off air', clips: ['broadcast'],
    label: 'LAST ONE',
    readme: [
      'I taped it because I thought somebody would want it later.',
      '',
      'It ran the same three words for eleven days. On the twelfth it did not',
      'run anything. The tape kept going a while after, which is why the end',
      'of this is nothing at all.',
    ].join('\n'),
  },
};

/**
 * The filesystem a media card mounts: a README you can `cat` and the clips,
 * which `cat` refuses and `play` opens. The `.avi` stub says what it is, so a
 * player who cats one gets an explanation rather than a wall of bytes.
 */
export function makeMediaCard(key) {
  const c = MEDIA_CARDS[key];
  if (!c) return null;
  const d = { 'README.TXT': { f: `${c.label}\n\n${c.readme}\n` } };
  for (const id of c.clips) {
    const clip = CLIPS[id];
    d[clip.title.toUpperCase()] = {
      f: [
        `[${clip.title} — ${CLIP_W}x${CLIP_H}, ${clip.fps}fps, ${clip.secs}s]`,
        '',
        'This is a video file. The shell will not show you a video file.',
        `Type:  play ${clip.title}`,
      ].join('\n'),
      clip: id,
    };
  }
  return { d };
}

/** Every clip id a mounted card offers, for the player's file lookup. */
export function clipForFile(name) {
  const want = String(name || '').trim().toLowerCase();
  for (const clip of Object.values(CLIPS)) {
    if (clip.title.toLowerCase() === want) return clip;
  }
  return null;
}
