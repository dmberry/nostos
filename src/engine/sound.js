// Fully synthesised WebAudio sound engine. Every effect is generated in
// code from oscillators and filtered noise buffers shaped by gain
// envelopes; nothing is fetched or decoded. The AudioContext is created
// lazily on unlock() (call it from the first user gesture), so the module
// is safe to import anywhere, including node. Every public method is a
// guarded no-op until unlocked, and try/catch wrapped so a misbehaving
// audio stack can never crash the game.

const MASTER_GAIN = 0.3;
const PLAY_DEBOUNCE_MS = 70;   // per-name minimum interval for play()
const STEP_DEBOUNCE_MS = 120;  // minimum interval between footsteps
const WIND_GAIN = 0.02;        // level of the constant wind bed
const CRICKET_GAIN = 0.015;    // level of the night cricket layer
const AMBIENCE_FADE = 2;       // seconds to crossfade ambience layers
const VARIATION = 0.06;        // random pitch spread so repeats don't grate
const ENV_FLOOR = 0.0001;      // exponential ramps can never reach zero

function now() {
  return typeof performance !== 'undefined' ? performance.now() : Date.now();
}

class Sound {
  constructor() {
    // Nothing here may touch AudioContext: construction must be safe in
    // environments without audio (node, tests, headless).
    this.ctx = null;
    this.master = null;
    this._muted = false;
    this._last = new Map();          // debounce timestamps by key
    this._ambience = { night: false, wind: 1 };
    this._noise = null;              // shared white-noise buffer
    this._brown = null;              // shared brown-noise buffer (wind)
    this._windGain = null;
    this._cricketGain = null;
  }

  // ---- lifecycle -------------------------------------------------------

  // Create (or resume) the context. Call from the first user gesture;
  // browsers refuse to start audio without one. Safe to call repeatedly.
  unlock() {
    try {
      if (this.ctx) {
        if (this.ctx.state === 'suspended') this.ctx.resume();
        return;
      }
      const AC = (typeof AudioContext !== 'undefined' && AudioContext)
        || (typeof window !== 'undefined' && (window.AudioContext || window.webkitAudioContext))
        || null;
      if (!AC) return;
      const ctx = new AC();
      if (ctx.state === 'suspended') ctx.resume();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = this._muted ? 0 : MASTER_GAIN;
      this.master.connect(ctx.destination);

      this._noise = this._makeNoise(1, false);
      this._brown = this._makeNoise(2, true);
      this._buildWind();
      this._buildCrickets();
      this._applyAmbience(0.1); // snap quickly to whatever was requested
    } catch (e) {
      this.ctx = null; // audio is optional; never let it take the game down
    }
  }

  setMuted(m) {
    this._muted = !!m;
    try {
      if (!this.ctx) return;
      const t = this.ctx.currentTime;
      this.master.gain.cancelScheduledValues(t);
      this.master.gain.setValueAtTime(this.master.gain.value, t);
      this.master.gain.linearRampToValueAtTime(this._muted ? 0 : MASTER_GAIN, t + 0.05);
    } catch (e) { /* ignore */ }
  }

  get muted() {
    return this._muted;
  }

  // ---- one-shot effects ------------------------------------------------

  play(name) {
    try {
      if (!this.ctx) return;
      if (this._debounced('fx:' + name, PLAY_DEBOUNCE_MS)) return;
      // Small random pitch and timing jitter keeps repeats from grating.
      const t = this.ctx.currentTime + Math.random() * 0.01;
      const v = 1 + (Math.random() * 2 - 1) * VARIATION;
      switch (name) {
        case 'chop': // knife into wood: filtered noise thunk + brief high tick
          this._noiseBurst({ when: t, dur: 0.09, gain: 0.5, attack: 0.002, freq: 700 * v, end: 250 });
          this._tone({ when: t + 0.004, dur: 0.03, type: 'square', freq: 2400 * v, gain: 0.1, attack: 0.002 });
          break;
        case 'treefall': // descending creak, then a soft crash of noise
          this._tone({ when: t, dur: 0.55, type: 'sawtooth', freq: 260 * v, end: 70, gain: 0.18, attack: 0.05, filterFreq: 800 });
          this._noiseBurst({ when: t + 0.4, dur: 0.55, gain: 0.4, attack: 0.03, freq: 900 * v, end: 300 });
          break;
        case 'pickup': // short bright blip
          this._tone({ when: t, dur: 0.09, type: 'triangle', freq: 880 * v, end: 1420 * v, gain: 0.22, attack: 0.002 });
          break;
        case 'eat': // two soft low pops
          this._tone({ when: t, dur: 0.06, freq: 170 * v, end: 120, gain: 0.28, attack: 0.003 });
          this._tone({ when: t + 0.11, dur: 0.06, freq: 160 * v, end: 115, gain: 0.28, attack: 0.003 });
          break;
        case 'jump': // quick upward whoosh
          this._noiseBurst({ when: t, dur: 0.18, gain: 0.16, attack: 0.02, filter: 'bandpass', freq: 350 * v, end: 1400 * v, q: 1.2 });
          break;
        case 'hurt': // dull thud + low tone drop
          this._noiseBurst({ when: t, dur: 0.1, gain: 0.5, attack: 0.002, freq: 280 });
          this._tone({ when: t, dur: 0.22, freq: 170 * v, end: 65, gain: 0.25, attack: 0.005 });
          break;
        case 'die': // longer descending minor dyad
          this._tone({ when: t, dur: 1.0, type: 'triangle', freq: 320 * v, end: 110, gain: 0.22, attack: 0.02 });
          this._tone({ when: t, dur: 1.0, type: 'triangle', freq: 384 * v, end: 132, gain: 0.12, attack: 0.02 });
          break;
        case 'bark': // two short mid-frequency yaps through a bandpass
          this._tone({ when: t, dur: 0.07, type: 'square', freq: 750 * v, end: 480, gain: 0.2, attack: 0.004, filter: 'bandpass', filterFreq: 900 });
          this._tone({ when: t + 0.13, dur: 0.07, type: 'square', freq: 720 * v, end: 470, gain: 0.2, attack: 0.004, filter: 'bandpass', filterFreq: 900 });
          break;
        case 'boar': // low grunt: brief sawtooth growl with pitch drop
          this._tone({ when: t, dur: 0.28, type: 'sawtooth', freq: 150 * v, end: 75, gain: 0.35, attack: 0.01, filterFreq: 420 });
          this._noiseBurst({ when: t, dur: 0.12, gain: 0.15, attack: 0.01, freq: 300 });
          break;
        case 'charge': // rumbling noise swell, ~0.5s
          this._noiseBurst({ when: t, dur: 0.55, gain: 0.3, attack: 0.3, freq: 350 * v, end: 550 });
          break;
        case 'hiss': // high filtered noise, snake-like
          this._noiseBurst({ when: t, dur: 0.4, gain: 0.15, attack: 0.05, filter: 'highpass', freq: 4200 * v });
          break;
        case 'shriek': // harsh descending caw: detuned saws + noise, unpleasant on purpose
          this._tone({ when: t, dur: 0.35, type: 'sawtooth', freq: 1900 * v, end: 550, gain: 0.16, attack: 0.01 });
          this._tone({ when: t, dur: 0.35, type: 'sawtooth', freq: 1960 * v, end: 570, gain: 0.16, attack: 0.01 });
          this._noiseBurst({ when: t, dur: 0.3, gain: 0.15, attack: 0.01, filter: 'bandpass', freq: 2600, q: 1 });
          break;
        case 'caw': // gentler, distant version of the shriek
          this._tone({ when: t, dur: 0.22, type: 'sawtooth', freq: 1150 * v, end: 520, gain: 0.06, attack: 0.02, filterFreq: 1400 });
          break;
        case 'splash': // soft water noise burst
          this._noiseBurst({ when: t, dur: 0.25, gain: 0.22, attack: 0.005, filter: 'bandpass', freq: 1300 * v, end: 700, q: 0.8 });
          break;
        case 'swing': // air whoosh for a missed swing
          this._noiseBurst({ when: t, dur: 0.15, gain: 0.12, attack: 0.03, filter: 'bandpass', freq: 420 * v, end: 1900 * v, q: 1.5 });
          break;
        case 'shot': // gunshot: sharp crack + low report tail
          this._noiseBurst({ when: t, dur: 0.06, gain: 0.6, attack: 0.001, filter: 'highpass', freq: 900 });
          this._noiseBurst({ when: t + 0.02, dur: 0.3, gain: 0.3, attack: 0.005, freq: 500 * v, end: 120 });
          break;
        case 'zap': // electric discharge: buzzy square drop + crackle
          this._tone({ when: t, dur: 0.25, type: 'square', freq: 1600 * v, end: 180, gain: 0.2, attack: 0.002, filter: 'bandpass', filterFreq: 1500 });
          this._noiseBurst({ when: t, dur: 0.18, gain: 0.2, attack: 0.002, filter: 'highpass', freq: 3000 });
          break;
        default:
          break; // unknown names are ignored silently
      }
    } catch (e) { /* audio must never crash the game */ }
  }

  // Very short, quiet footstep tick, differing by surface.
  step(surface) {
    try {
      if (!this.ctx) return;
      if (this._debounced('step', STEP_DEBOUNCE_MS)) return;
      const t = this.ctx.currentTime;
      const v = 1 + (Math.random() * 2 - 1) * VARIATION;
      switch (surface) {
        case 'road': // harder tap
          this._noiseBurst({ when: t, dur: 0.03, gain: 0.09, attack: 0.001, freq: 1400 * v });
          break;
        case 'boards': // woody knock
          this._tone({ when: t, dur: 0.06, type: 'triangle', freq: 175 * v, end: 120, gain: 0.07, attack: 0.002 });
          this._noiseBurst({ when: t, dur: 0.04, gain: 0.04, attack: 0.001, freq: 900 * v });
          break;
        case 'bridge': // hollow knock, lower and longer than boards
          this._tone({ when: t, dur: 0.09, type: 'triangle', freq: 110 * v, end: 85, gain: 0.08, attack: 0.002 });
          this._noiseBurst({ when: t, dur: 0.05, gain: 0.04, attack: 0.001, freq: 500 * v });
          break;
        case 'stream':
        case 'water': // wet splash tick
          this._noiseBurst({ when: t, dur: 0.07, gain: 0.07, attack: 0.002, filter: 'bandpass', freq: 1600 * v, end: 900, q: 0.8 });
          break;
        case 'sand':
        case 'dirt': // dry scuff
          this._noiseBurst({ when: t, dur: 0.08, gain: 0.06, attack: 0.005, filter: 'bandpass', freq: 850 * v, q: 0.7 });
          break;
        case 'grass':
        default: // soft thud
          this._noiseBurst({ when: t, dur: 0.05, gain: 0.07, attack: 0.003, freq: 320 * v });
          break;
      }
    } catch (e) { /* ignore */ }
  }

  // ---- ambience ---------------------------------------------------------

  // Continuous, very quiet bed: wind always, crickets at night. The loops
  // are built once at unlock and only their gains are ramped, so toggling
  // costs nothing and idle CPU stays low.
  setAmbience({ night, wind } = {}) {
    try {
      if (night !== undefined) this._ambience.night = !!night;
      if (wind !== undefined) this._ambience.wind = Math.max(0, wind);
      if (!this.ctx) return;
      this._applyAmbience(AMBIENCE_FADE);
    } catch (e) { /* ignore */ }
  }

  _applyAmbience(fade) {
    const t = this.ctx.currentTime;
    const ramp = (param, target) => {
      param.cancelScheduledValues(t);
      param.setValueAtTime(param.value, t);
      param.linearRampToValueAtTime(target, t + fade);
    };
    ramp(this._windGain.gain, WIND_GAIN * this._ambience.wind);
    ramp(this._cricketGain.gain, this._ambience.night ? CRICKET_GAIN : 0);
  }

  // Wind bed: looped brown noise through a lowpass whose cutoff wanders
  // slowly, which reads as gusting without any per-frame work.
  _buildWind() {
    const ctx = this.ctx;
    this._windGain = ctx.createGain();
    this._windGain.gain.value = 0;
    this._windGain.connect(this.master);

    const src = ctx.createBufferSource();
    src.buffer = this._brown;
    src.loop = true;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 380;
    lp.Q.value = 0.5;
    const gust = ctx.createOscillator();
    gust.type = 'sine';
    gust.frequency.value = 0.13;
    const gustDepth = ctx.createGain();
    gustDepth.gain.value = 140;
    gust.connect(gustDepth);
    gustDepth.connect(lp.frequency);
    src.connect(lp);
    lp.connect(this._windGain);
    src.start();
    gust.start();
  }

  // Cricket layer: a high triangle carrier gated twice over — a fast
  // trill and a slower chirp/pause cycle — then a highpass. Both gates are
  // square LFOs biased to swing the gain between 0 and 1.
  _buildCrickets() {
    const ctx = this.ctx;
    this._cricketGain = ctx.createGain();
    this._cricketGain.gain.value = 0;
    this._cricketGain.connect(this.master);

    const carrier = ctx.createOscillator();
    carrier.type = 'triangle';
    carrier.frequency.value = 4300;

    const trill = ctx.createGain();
    trill.gain.value = 0.5;
    const trillLfo = ctx.createOscillator();
    trillLfo.type = 'square';
    trillLfo.frequency.value = 24;
    const trillDepth = ctx.createGain();
    trillDepth.gain.value = 0.5;
    trillLfo.connect(trillDepth);
    trillDepth.connect(trill.gain);

    const chirp = ctx.createGain();
    chirp.gain.value = 0.5;
    const chirpLfo = ctx.createOscillator();
    chirpLfo.type = 'square';
    chirpLfo.frequency.value = 0.7;
    const chirpDepth = ctx.createGain();
    chirpDepth.gain.value = 0.5;
    chirpLfo.connect(chirpDepth);
    chirpDepth.connect(chirp.gain);

    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 3200;

    carrier.connect(trill);
    trill.connect(chirp);
    chirp.connect(hp);
    hp.connect(this._cricketGain);
    carrier.start();
    trillLfo.start();
    chirpLfo.start();
  }

  // ---- synthesis helpers -------------------------------------------------

  // Shared output stage: gain envelope into the master. Linear attack to
  // the peak, then an exponential decay to (near) silence at when + dur.
  _out(when, dur, peak, attack = 0.005) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + Math.min(attack, dur * 0.9));
    g.gain.exponentialRampToValueAtTime(ENV_FLOOR, when + dur);
    g.connect(this.master);
    return g;
  }

  // A single oscillator gesture, optionally pitch-swept and filtered.
  _tone({ when, dur, type = 'sine', freq, end, gain, attack = 0.005, filter, filterFreq }) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(freq, when);
    if (end) o.frequency.exponentialRampToValueAtTime(Math.max(1, end), when + dur);
    let node = o;
    if (filterFreq) {
      const f = this.ctx.createBiquadFilter();
      f.type = filter || 'lowpass';
      f.frequency.value = filterFreq;
      o.connect(f);
      node = f;
    }
    node.connect(this._out(when, dur, gain, attack));
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  // A burst of the shared noise buffer through a filter, optionally with
  // a cutoff sweep. A random loop offset varies the grain each time.
  _noiseBurst({ when, dur, gain, attack = 0.005, filter = 'lowpass', freq, end, q }) {
    const src = this.ctx.createBufferSource();
    src.buffer = this._noise;
    src.loop = true;
    const f = this.ctx.createBiquadFilter();
    f.type = filter;
    f.frequency.setValueAtTime(freq, when);
    if (end) f.frequency.exponentialRampToValueAtTime(Math.max(1, end), when + dur);
    if (q) f.Q.value = q;
    src.connect(f);
    f.connect(this._out(when, dur, gain, attack));
    src.start(when, Math.random() * 0.9);
    src.stop(when + dur + 0.05);
  }

  // Noise buffers are generated once at unlock. Brown noise (integrated
  // white) gives the wind its low rumble; plain white serves the one-shots.
  _makeNoise(seconds, brown) {
    const len = Math.floor(this.ctx.sampleRate * seconds);
    const buf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
    const data = buf.getChannelData(0);
    let b = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      if (brown) {
        b = (b + 0.02 * w) / 1.02;
        data[i] = b * 3.5;
      } else {
        data[i] = w;
      }
    }
    return buf;
  }

  // True (and records the attempt) if the key fired less than ms ago.
  _debounced(key, ms) {
    const t = now();
    const last = this._last.get(key);
    if (last !== undefined && t - last < ms) return true;
    this._last.set(key, t);
    return false;
  }
}

export const sfx = new Sound();
