// THE BOOT LOADER — a terminal that comes up between the title screen and the
// game, and stays up until the first frame is drawn.
//
// It exists for two reasons, and they are the same reason. There was a gap
// between clicking Start and the world appearing where the screen went black
// with nothing on it, and on Safari that gap was permanent: main.js threw during
// module evaluation and the un-caught `import('../main.js')` promise swallowed
// the error, so the player got a black rectangle and no way to know why. A loader
// that catches the throw and PRINTS it turns "it doesn't work" into "here is the
// line that failed" — including on someone else's Safari, where we cannot open a
// console. The terminal styling is not decoration: the game's spine is a RON-ML
// console, and booting into one first says so.
//
// Deliberately self-contained: its own DOM, inline styles, no import of anything
// that main.js also imports. If main.js cannot be parsed, this still runs.

const AMBER = '#e0b050';
const DIM = '#6f6a52';
const GREEN = '#6ad0a0';
const RED = '#e0705a';

// The real steps, matched to the events main.js emits (window 'nostos:progress'
// with { detail: { step } }). Each is a genuine phase, not a fake spinner: the
// engine coming up, the island being built, the save restored, the first frame.
// A step the running build does not emit simply never ticks, and `nostos:ready`
// still dismisses the loader — so an older cached main.js degrades gracefully.
const STEPS = [
  { key: 'modules', label: 'mounting core modules' },
  { key: 'engine', label: 'starting engine' },
  { key: 'world', label: 'building island' },
  { key: 'save', label: 'restoring save state' },
  { key: 'ready', label: 'painting first frame' },
];

export function showBootLoader(version = '') {
  const root = document.createElement('div');
  root.id = 'boot-loader';
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '99999',
    background: '#07090c',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    font: '14px/1.5 ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    color: AMBER,
    // A phone can be short and wide; keep the terminal readable and padded.
    padding: 'max(16px, env(safe-area-inset-top)) 16px',
    boxSizing: 'border-box',
    transition: 'opacity 0.35s ease-out',
  });

  const term = document.createElement('div');
  Object.assign(term.style, {
    width: 'min(560px, 100%)', maxHeight: '100%', overflow: 'hidden',
    // A faint scanline wash and a soft amber glow at the edge: a CRT, quietly.
    background: 'linear-gradient(#0a0d10, #070909)',
    border: '1px solid rgba(224,176,80,0.28)',
    borderRadius: '6px',
    boxShadow: '0 0 0 1px rgba(0,0,0,0.6), 0 24px 60px rgba(0,0,0,0.6), inset 0 0 60px rgba(224,176,80,0.05)',
    padding: '18px 20px',
  });
  root.appendChild(term);

  const head = document.createElement('div');
  head.textContent = `NostOS boot loader${version ? '  ' + (version.startsWith('v') ? version : 'v' + version) : ''}`;
  Object.assign(head.style, { color: DIM, marginBottom: '12px', letterSpacing: '0.04em' });
  term.appendChild(head);

  const list = document.createElement('div');
  term.appendChild(list);

  const rows = new Map();
  const rowFor = (step) => {
    let r = rows.get(step.key);
    if (r) return r;
    r = document.createElement('div');
    Object.assign(r.style, { display: 'flex', gap: '8px', margin: '2px 0', alignItems: 'baseline' });
    const prompt = document.createElement('span');
    prompt.textContent = '>'; prompt.style.color = DIM; prompt.style.flex = '0 0 auto';
    const label = document.createElement('span');
    label.textContent = step.label; label.style.color = AMBER;
    // flex:1 with min-width:0 lets the label ellipsize on a narrow phone rather
    // than shoving the 'ok'/'FAIL' status off the right edge.
    Object.assign(label.style, { flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
    const status = document.createElement('span');
    status.textContent = '…'; status.style.color = DIM; status.style.flex = '0 0 auto';
    r.append(prompt, label, status);
    list.appendChild(r);
    r = { row: r, label, status };
    rows.set(step.key, r);
    return r;
  };

  // Show the first step immediately so the terminal is never empty on paint.
  rowFor(STEPS[0]).status.textContent = '…';

  const foot = document.createElement('div');
  Object.assign(foot.style, { marginTop: '14px', minHeight: '1.5em', color: DIM });
  term.appendChild(foot);

  // A blinking cursor while we wait, so a slow load reads as working, not hung.
  let blink;
  const cursor = document.createElement('span');
  cursor.textContent = '█';
  Object.assign(cursor.style, { color: AMBER });
  foot.appendChild(cursor);
  blink = setInterval(() => { cursor.style.visibility = cursor.style.visibility === 'hidden' ? 'visible' : 'hidden'; }, 500);

  document.body.appendChild(root);

  // Tick every step up to and including `key` as done, and mark `key` current.
  const markThrough = (key) => {
    let hit = false;
    for (const step of STEPS) {
      const r = rowFor(step);
      if (step.key === key) { r.status.textContent = 'ok'; r.status.style.color = GREEN; hit = true; break; }
      if (r.status.textContent !== 'ok') { r.status.textContent = 'ok'; r.status.style.color = GREEN; }
    }
    // Reveal the next pending step's spinner, so there is always a live line.
    if (hit) {
      const idx = STEPS.findIndex((s) => s.key === key);
      if (idx >= 0 && idx + 1 < STEPS.length) rowFor(STEPS[idx + 1]);
    }
  };

  return {
    // A real progress step arrived.
    step(key) { if (rows || key) markThrough(key); },

    // The game is up. Tick everything, hold a beat so the READY line can be read,
    // then fade out and remove.
    succeed() {
      clearInterval(blink);
      for (const step of STEPS) { const r = rowFor(step); r.status.textContent = 'ok'; r.status.style.color = GREEN; }
      cursor.remove();
      const done = document.createElement('div');
      done.textContent = 'READY.';
      Object.assign(done.style, { color: GREEN, marginTop: '10px', fontWeight: '700' });
      term.appendChild(done);
      setTimeout(() => {
        root.style.opacity = '0';
        setTimeout(() => root.remove(), 380);
      }, 420);
    },

    // The boot failed. This is the whole point: print what happened, in red, and
    // do NOT dismiss — a black screen tells you nothing; this tells you the line.
    fail(err) {
      clearInterval(blink);
      cursor.remove();
      // Mark the last still-spinning step as the one that broke.
      for (const step of STEPS) {
        const r = rowFor(step);
        if (r.status.textContent === '…') { r.status.textContent = 'FAIL'; r.status.style.color = RED; break; }
      }
      const box = document.createElement('div');
      Object.assign(box.style, {
        marginTop: '14px', padding: '12px', borderRadius: '4px',
        background: 'rgba(224,112,90,0.08)', border: '1px solid rgba(224,112,90,0.35)',
        color: RED, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: '40vh', overflow: 'auto',
        font: '12px/1.45 ui-monospace, monospace',
      });
      const msg = (err && (err.stack || err.message)) || String(err) || 'unknown error';
      box.textContent = 'the game failed to start:\n\n' + msg;
      term.appendChild(box);
      const hint = document.createElement('div');
      hint.textContent = 'Try reloading. If it keeps happening, this text is the bug report.';
      Object.assign(hint.style, { marginTop: '10px', color: DIM, fontSize: '12px' });
      term.appendChild(hint);
    },

    root,
  };
}
