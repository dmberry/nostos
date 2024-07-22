// THE BOOT LOADER — the game boots into a terminal.
//
// It exists for two reasons that are one reason. There was a gap between
// clicking Start and the world appearing that went black with nothing on it, and
// on Safari that gap was permanent: main.js threw during module evaluation and
// the un-caught `import('../main.js')` promise swallowed the error, so the player
// got a black rectangle and no way to know why. A loader that catches the throw
// and PRINTS it turns "it doesn't work" into "here is the line that failed" —
// including on someone else's Safari, where we cannot open a console.
//
// It is dressed as the HERMES relay console (RON's own amber OS: #obterminal in
// index.html — warm amber on a dark CRT, scanlines, a soft glow) because the
// game's spine IS that terminal, and it streams a verbose install log the way
// Homebrew or apt does — a header per phase, sub-lines fetching and processing
// each part with a spinner, a size and a tick — so a boot reads as a machine
// doing work rather than a bar creeping across.
//
// Deliberately self-contained: its own DOM, inline styles, no import of anything
// main.js also imports. If main.js cannot be parsed, this still runs. Uses
// performance.now(), not rAF, so it keeps working while the real boot blocks the
// frame loop.

const AMBER = '#e6a53a';        // the RON-OS amber, straight off #obterminal-screen
const AMBER_HI = '#f4c987';     // brighter, for values you've earned
const AMBER_DIM = 'rgba(230,175,90,0.45)';
const AMBER_FAINT = 'rgba(230,150,40,0.28)';
const GREEN = '#8bd6a4';
const RED = '#e8806a';
const GLOW = '0 0 4px rgba(230,150,40,0.7)';
const MONO = "13px/1.55 ui-monospace, 'Courier New', monospace";
const SPIN = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];

// The phases, each with the parts it "fetches". These mirror the real events
// main.js emits (window 'nostos:progress' { detail:{ step } }); the sub-parts are
// the actual work each phase does, named so the log reads true. A phase holds on
// its last line, spinning, until its real event arrives — so a slow boot looks
// like the machine thinking, not like nothing.
const PHASES = [
  { key: 'modules', head: 'Mounting core modules', verb: 'fetch',
    parts: ['engine/renderer.js', 'engine/input.js', 'engine/sound.js', 'game/worldgen.js',
            'game/robots.js', 'game/player.js', 'game/ronml.js', 'game/fortress.js'] },
  { key: 'engine', head: 'Starting engine', verb: 'init',
    parts: ['canvas 2d context', 'input: keyboard + touch', 'audio graph', 'systems registry'] },
  { key: 'world', head: 'Building island: OGYGIA', verb: 'gen',
    parts: ['terrain heightmap', 'coastline + beaches', 'obelisk network', 'HERMES relays', 'ruins + caches', 'fauna'] },
  { key: 'save', head: 'Restoring save state', verb: 'load',
    parts: ['character + skills', 'world snapshot', 'lore + scrapbook'] },
  { key: 'ready', head: 'Painting first frame', verb: 'draw',
    parts: ['compositing HUD', 'first draw'] },
];

// Deterministic pretend-sizes, so the log looks like real transfers and does not
// flicker between renders.
function sizeKB(s) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return (24 + (h % 976)) / 10;   // 2.4 .. 100.0 KB
}

export function showBootLoader(version = '') {
  // ---- the CRT, framed like #obterminal .crt -------------------------------
  const root = document.createElement('div');
  root.id = 'boot-loader';
  Object.assign(root.style, {
    position: 'fixed', inset: '0', zIndex: '99999',
    background: 'rgba(0,0,0,0.92)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    padding: 'max(12px, env(safe-area-inset-top)) 12px', boxSizing: 'border-box',
    transition: 'opacity 0.4s ease-out',
  });

  const crt = document.createElement('div');
  Object.assign(crt.style, {
    width: 'min(680px, 92vw)', height: 'min(460px, 82vh)',
    background: '#140c02', border: '14px solid #15150f', borderRadius: '20px',
    boxShadow: '0 0 0 2px #000, inset 0 0 70px rgba(0,0,0,0.9), inset 0 0 130px rgba(232,150,40,0.09)',
    padding: '20px 24px', position: 'relative', overflow: 'hidden',
    display: 'flex', flexDirection: 'column',
    color: AMBER, font: MONO, textShadow: GLOW,
  });
  root.appendChild(crt);

  // scanlines (the #obterminal ::after, as a real element since we're inline)
  const scan = document.createElement('div');
  Object.assign(scan.style, {
    content: '', position: 'absolute', inset: '0', pointerEvents: 'none', zIndex: '3',
    background: 'repeating-linear-gradient(rgba(0,0,0,0) 0, rgba(0,0,0,0) 2px, rgba(0,0,0,0.22) 3px, rgba(0,0,0,0.22) 4px)',
  });
  crt.appendChild(scan);

  // header bar: session line left, version + a live indicator right
  const header = document.createElement('div');
  Object.assign(header.style, {
    display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
    color: AMBER_DIM, letterSpacing: '0.06em', marginBottom: '10px',
    borderBottom: '1px solid ' + AMBER_FAINT, paddingBottom: '8px', flex: '0 0 auto',
  });
  const hl = document.createElement('span');
  hl.textContent = 'RON-OS // HERMES relay // boot';
  const hr = document.createElement('span');
  hr.textContent = version ? (version.startsWith('v') ? version : 'v' + version) : '';
  header.append(hl, hr);
  crt.appendChild(header);

  // the log, scrolling
  const log = document.createElement('div');
  Object.assign(log.style, { flex: '1 1 auto', minHeight: '0', overflowY: 'auto', whiteSpace: 'pre-wrap' });
  crt.appendChild(log);

  // footer: prompt + cursor while working
  const foot = document.createElement('div');
  Object.assign(foot.style, { flex: '0 0 auto', marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '6px', borderTop: '1px solid ' + AMBER_FAINT, paddingTop: '8px' });
  const prompt = document.createElement('span'); prompt.textContent = '>'; prompt.style.color = AMBER;
  const cursor = document.createElement('span'); cursor.textContent = '█'; cursor.style.color = AMBER_HI;
  foot.append(prompt, cursor);
  crt.appendChild(foot);

  const line = (html, color = AMBER) => {
    const d = document.createElement('div');
    d.style.color = color;
    if (typeof html === 'string') d.textContent = html; else d.appendChild(html);
    log.appendChild(d);
    log.scrollTop = log.scrollHeight;
    return d;
  };

  // A part row: "  -> fetch  engine/renderer.js …………  48.2 KB  ⠹"
  function partRow(verb, name) {
    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '8px', alignItems: 'baseline', padding: '1px 0' });
    const arrow = document.createElement('span'); arrow.textContent = '->'; arrow.style.color = AMBER_DIM; arrow.style.flex = '0 0 auto';
    const v = document.createElement('span'); v.textContent = verb; v.style.color = AMBER_DIM; v.style.flex = '0 0 auto';
    const nm = document.createElement('span'); nm.textContent = name; nm.style.color = AMBER;
    Object.assign(nm.style, { flex: '1 1 auto', minWidth: '0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' });
    const stat = document.createElement('span'); stat.textContent = SPIN[0]; stat.style.color = AMBER_HI; stat.style.flex = '0 0 auto'; stat.style.minWidth = '4.5em'; stat.style.textAlign = 'right';
    row.append(arrow, v, nm, stat);
    log.appendChild(row);
    log.scrollTop = log.scrollHeight;
    return { row, stat };
  }

  document.body.appendChild(root);

  // ---- the choreography ----------------------------------------------------
  const seen = new Set();     // real phase events that have arrived
  let failed = false;
  let finishing = false;      // succeed() called — fast-forward, then fade
  const startedAt = perfNow();

  let pi = -1;                // phase index
  let ci = 0;                 // part index within phase
  let partT = 0;              // ms accrued on the current part
  let curPart = null;         // { stat }
  let headerPrinted = false;
  let lastT = perfNow();
  let totalKB = 0;
  const PART_MS = 130;        // how long each part "takes" to process
  const MIN_SHOW_MS = 1100;   // never flash by faster than this

  function perfNow() { try { return performance.now(); } catch (_) { return 0; } }

  function beginPhase(i) {
    pi = i; ci = 0; partT = 0; curPart = null; headerPrinted = false;
  }

  function finalizePart(p, name) {
    const kb = sizeKB(name); totalKB += kb;
    p.stat.textContent = kb.toFixed(1) + ' KB';
    p.stat.style.color = GREEN;
  }

  function tick() {
    if (failed) return;
    const now = perfNow();
    const dt = Math.min(64, now - lastT);
    lastT = now;

    // cursor blink (independent of throttling)
    cursor.style.visibility = (Math.floor(now / 500) % 2) ? 'hidden' : 'visible';

    if (pi < 0) beginPhase(0);
    if (pi >= PHASES.length) { maybeFinish(now); return; }

    const phase = PHASES[pi];
    if (!headerPrinted) {
      line('==> ' + phase.head, AMBER_HI).style.fontWeight = '700';
      headerPrinted = true;
    }

    // Reveal / advance the parts of this phase.
    if (ci < phase.parts.length) {
      if (!curPart) curPart = partRow(phase.verb, phase.parts[ci]);
      // Spin while working.
      curPart.stat.textContent = SPIN[Math.floor(now / 80) % SPIN.length];
      partT += finishing ? PART_MS : dt;   // finishing → complete parts immediately
      if (partT >= PART_MS) {
        finalizePart(curPart, phase.parts[ci]);
        curPart = null; ci += 1; partT = 0;
      }
      return;
    }

    // All parts done. Close the phase only once its REAL event has arrived — so a
    // genuinely slow phase visibly waits here rather than racing ahead of the code.
    if (seen.has(phase.key) || finishing) {
      beginPhase(pi + 1);
    } else {
      // hold: a faint "working" line, spinning, until the event lands
      if (!phase._hold) {
        phase._hold = partRow('wait', 'server responding');
      }
      phase._hold.stat.textContent = SPIN[Math.floor(now / 80) % SPIN.length];
    }
  }

  function maybeFinish(now) {
    if (!finishing) return;
    if (now - startedAt < MIN_SHOW_MS) return;    // let it be read
    clearInterval(timer);
    cursor.remove();
    const done = line('READY.  ' + totalKB.toFixed(1) + ' KB in ' + ((now - startedAt) / 1000).toFixed(1) + 's', GREEN);
    done.style.fontWeight = '700';
    done.style.marginTop = '6px';
    setTimeout(() => { root.style.opacity = '0'; setTimeout(() => root.remove(), 420); }, 360);
  }

  const timer = setInterval(tick, 40);
  tick();

  return {
    step(key) { if (key) seen.add(key); },

    succeed() {
      finishing = true;
      for (const k of PHASES) seen.add(k.key);   // unblock any held phase
      // maybeFinish runs from the ticker once MIN_SHOW_MS has passed and the
      // fast-forward has drained the remaining parts.
    },

    fail(err) {
      failed = true;
      clearInterval(timer);
      cursor.remove();
      if (curPart) { curPart.stat.textContent = 'FAIL'; curPart.stat.style.color = RED; }
      const box = document.createElement('div');
      Object.assign(box.style, {
        marginTop: '12px', padding: '12px', borderRadius: '4px',
        background: 'rgba(232,128,106,0.08)', border: '1px solid rgba(232,128,106,0.4)',
        color: RED, whiteSpace: 'pre-wrap', wordBreak: 'break-word',
        maxHeight: '38vh', overflow: 'auto', font: "12px/1.45 ui-monospace, monospace",
        textShadow: 'none',
      });
      const msg = (err && (err.stack || err.message)) || String(err) || 'unknown error';
      box.textContent = 'HALT — the game failed to start:\n\n' + msg;
      log.appendChild(box);
      const hint = line('Try reloading. If it keeps happening, this text is the bug report.', AMBER_DIM);
      hint.style.marginTop = '8px'; hint.style.fontSize = '12px';
      log.scrollTop = log.scrollHeight;
    },

    root,
  };
}
