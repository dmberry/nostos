import { Renderer } from './engine/renderer.js';
import { Camera } from './engine/camera.js';
import { Input } from './engine/input.js';
import { buildWorld } from './game/worldgen.js';
import { spawnAnimals, updateAnimals } from './game/animals.js';
import { Player } from './game/player.js';
import { makeRng } from './game/rng.js';
import { DayNight } from './game/daynight.js';
import { Minimap } from './game/minimap.js';

const WORLD_SEED = 1337;

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const input = new Input();
const { map, spawn } = buildWorld(WORLD_SEED);
const player = new Player(spawn.x, spawn.y);
player.map = map; // for death drops when damage comes from animals
const animals = spawnAnimals(map, WORLD_SEED, { x: spawn.x, y: spawn.y, r: 12 });

// Scatter loot: torches and tinned food in building interiors (night and
// hunger both push you to scavenge), berries in the tallgrass meadows.
{
  const rng = makeRng(WORLD_SEED ^ 0x7031);
  const boards = [], tallgrass = [];
  for (let y = 0; y < map.h; y++) {
    for (let x = 0; x < map.w; x++) {
      const f = map.floorAt(x, y);
      if (f === 'boards') boards.push([x, y]);
      else if (f === 'tallgrass') tallgrass.push([x, y]);
    }
  }
  const drop = (list, item, qty) => {
    if (!list.length) return;
    const [x, y] = list[Math.floor(rng() * list.length)];
    map.groundItems.push({ item, qty, x: x + 0.5, y: y + 0.5 });
  };
  for (let i = 0; i < 12; i++) drop(boards, 'torch', 1);
  for (let i = 0; i < 14; i++) drop(boards, 'tin', 1);
  for (let i = 0; i < 16; i++) drop(tallgrass, 'berries', 2 + Math.floor(rng() * 2));
  // Books are rarer: one copy of each plus two duplicates, buildings only.
  const books = ['book_wood', 'book_herbs', 'book_track', 'book_run', 'book_herbs', 'book_track'];
  for (const b of books) drop(boards, b, 1);
}

// Character persona and learned skills persist across sessions and deaths.
const SAVE_KEY = 'postai-character';
try {
  const saved = JSON.parse(localStorage.getItem(SAVE_KEY) || 'null');
  if (saved) {
    player.setPersona(saved.name || 'Adam', saved.gender || 'm');
    for (const s of saved.skills || []) player.skills.add(s);
  }
} catch { /* corrupt save: start fresh */ }
const persist = () => {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      name: player.name, gender: player.gender, skills: [...player.skills],
    }));
  } catch { /* storage unavailable */ }
};
player.onSkillLearned = persist;

// Character picker in the help modal.
const nameInput = document.getElementById('charName');
nameInput.value = player.name;
for (const btn of document.querySelectorAll('#help button[data-gender]')) {
  btn.addEventListener('click', () => {
    player.setPersona(btn.textContent.trim(), btn.dataset.gender);
    nameInput.value = player.name;
    persist();
  });
}
nameInput.addEventListener('change', () => {
  const v = nameInput.value.trim();
  if (v) { player.name = v; persist(); }
});
const camera = new Camera(player.x, player.y);

const dayNight = new DayNight();
const minimap = new Minimap(map);
let lastObjectCount = map.objects.length;

// Debug handle for inspecting live state from the console.
window.__game = { player, map, camera, animals, dayNight };

function resize() {
  renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}
window.addEventListener('resize', resize);
resize();

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let fps = 0, frameCount = 0, fpsClock = 0;

// Help modal: H toggles, the ? button opens, clicking the backdrop closes.
const helpEl = document.getElementById('help');
const toggleHelp = (force) => {
  const show = force != null ? force : helpEl.style.display !== 'block';
  helpEl.style.display = show ? 'block' : 'none';
};
document.getElementById('helpBtn').addEventListener('click', () => toggleHelp(true));
helpEl.addEventListener('click', (e) => { if (e.target === helpEl) toggleHelp(false); });

function update(dt) {
  if (input.consumePress('KeyH')) toggleHelp();
  player.update(dt, input, map, animals);
  updateAnimals(dt, animals, player, map);
  map.updateShakes(dt);
  dayNight.update(dt);
  camera.follow(player.x, player.y, dt);
  if (map.objects.length !== lastObjectCount) {
    lastObjectCount = map.objects.length;
    minimap.refresh(map); // felled trees disappear from the minimap
  }
}

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }

  renderer.draw(camera, map, player, animals, {
    fps,
    light: dayNight.light(),
    timeLabel: dayNight.label,
    minimap,
    torch: player.pockets.some((s) => s && s.item === 'torch'),
  });

  frameCount += 1;
  fpsClock += elapsed;
  if (fpsClock >= 1) {
    fps = frameCount;
    frameCount = 0;
    fpsClock -= 1;
  }
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
