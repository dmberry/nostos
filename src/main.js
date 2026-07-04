import { Renderer } from './engine/renderer.js';
import { Camera } from './engine/camera.js';
import { Input } from './engine/input.js';
import { buildTestMap } from './game/map.js';
import { Player } from './game/player.js';

const canvas = document.getElementById('game');
const renderer = new Renderer(canvas);
const input = new Input();
const map = buildTestMap();
const player = new Player(23.5, 27.5); // on the road, south of the crossroads
const camera = new Camera(player.x, player.y);

// Debug handle for inspecting live state from the console.
window.__game = { player, map, camera };

function resize() {
  renderer.resize(window.innerWidth, window.innerHeight, window.devicePixelRatio || 1);
}
window.addEventListener('resize', resize);
resize();

const STEP = 1 / 60;
let last = performance.now();
let acc = 0;
let fps = 0, frameCount = 0, fpsClock = 0;

function update(dt) {
  player.update(dt, input, map);
  map.updateShakes(dt);
  camera.follow(player.x, player.y, dt);
}

function frame(now) {
  const elapsed = Math.min(0.25, (now - last) / 1000);
  last = now;
  acc += elapsed;
  while (acc >= STEP) {
    update(STEP);
    acc -= STEP;
  }

  renderer.draw(camera, map, player, { fps });

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
