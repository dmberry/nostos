// Snake, as the 3310 shipped it. The other half of the handset: the SMS
// threads are why you carry the phone, Snake is why you keep taking it out.
//
// Pure logic + a draw function over an 84x48 canvas — the authentic LCD
// resolution (see the sci-17 lore fragment: an ARM7TDMI at 13 MHz drove
// exactly this). The canvas is CSS-scaled up with image-rendering: pixelated
// so every pixel stays a fat LCD pixel. main.js owns the tab, the tick
// interval and the input wiring; this module never touches the DOM.

export const SNAKE_W = 28;   // 3px cells across the 84px screen
export const SNAKE_H = 16;   // and down the 48px screen
const CELL = 3;

const DIRS = {
  up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
  left: { x: -1, y: 0 }, right: { x: 1, y: 0 },
};

// LCD palette — same inks as the SMS toast and the phone modal.
const INK = '#2b3420';
const FAINT = 'rgba(43,52,32,0.35)';

export function newSnakeGame() {
  const s = {
    body: [],            // head first
    dir: 'right',
    nextDir: 'right',    // buffered turn, applied on the tick (no 180s mid-cell)
    food: null,
    score: 0,
    dead: false,
    grow: 0,             // segments still owed from the last meal
    t: 0,                // ticks survived (blinks the food)
  };
  const cy = SNAKE_H >> 1;
  for (let i = 3; i >= 0; i--) s.body.push({ x: 4 + i, y: cy });
  placeFood(s);
  return s;
}

function placeFood(s) {
  let x, y, guard = 0;
  do {
    x = Math.floor(Math.random() * SNAKE_W);
    y = Math.floor(Math.random() * SNAKE_H);
  } while (s.body.some((b) => b.x === x && b.y === y) && guard++ < 500);
  s.food = { x, y };
}

// Steer. Reversing into yourself is ignored, exactly as the handset ignored it.
export function snakeTurn(s, dir) {
  if (!DIRS[dir] || s.dead) return;
  const d = DIRS[dir], cur = DIRS[s.dir];
  if (d.x === -cur.x && d.y === -cur.y) return;
  s.nextDir = dir;
}

// Relative steering for touch play: tap the left half of the screen to turn
// anticlockwise, the right half to turn clockwise.
const CW = { up: 'right', right: 'down', down: 'left', left: 'up' };
const CCW = { up: 'left', left: 'down', down: 'right', right: 'up' };
export function snakeTurnRelative(s, clockwise) {
  snakeTurn(s, (clockwise ? CW : CCW)[s.dir]);
}

// One step of the world. Edges wrap (the plain, mazeless level); only your
// own body kills you. Returns true if the snake ate this tick.
export function snakeTick(s) {
  if (s.dead) return false;
  s.t += 1;
  s.dir = s.nextDir;
  const d = DIRS[s.dir];
  const head = {
    x: (s.body[0].x + d.x + SNAKE_W) % SNAKE_W,
    y: (s.body[0].y + d.y + SNAKE_H) % SNAKE_H,
  };
  if (s.body.some((b) => b.x === head.x && b.y === head.y)) {
    s.dead = true;
    return false;
  }
  s.body.unshift(head);
  let ate = false;
  if (s.food && head.x === s.food.x && head.y === s.food.y) {
    s.score += 7;      // Snake II scored a flat 7 a feed on the basic level
    s.grow += 2;
    placeFood(s);
    ate = true;
  }
  if (s.grow > 0) s.grow -= 1;
  else s.body.pop();
  return ate;
}

// Draw onto an 84x48 canvas context. The background is the LCD's pea-green,
// painted by the element's CSS — we only lay down ink.
export function drawSnake(ctx, s, high = 0) {
  ctx.clearRect(0, 0, SNAKE_W * CELL, SNAKE_H * CELL);
  ctx.fillStyle = INK;
  // Body: chunky segments with a 1px notch so the coil reads as links.
  for (let i = 0; i < s.body.length; i++) {
    const b = s.body[i];
    ctx.fillRect(b.x * CELL, b.y * CELL, CELL, CELL);
  }
  // The head gets a blank pixel — an eye.
  const h = s.body[0];
  ctx.clearRect(h.x * CELL + 1, h.y * CELL + 1, 1, 1);
  // Food blinks, as it did.
  if (s.food && (s.t & 2) !== 2) {
    ctx.fillRect(s.food.x * CELL, s.food.y * CELL + 1, CELL, 1);
    ctx.fillRect(s.food.x * CELL + 1, s.food.y * CELL, 1, CELL);
  }
  // Score, small and faint in the corner so it never fights the field.
  ctx.fillStyle = FAINT;
  ctx.font = '5px ui-monospace, monospace';
  ctx.textAlign = 'right';
  ctx.fillText(String(s.score), SNAKE_W * CELL - 1, 5);
  ctx.textAlign = 'left';
  if (s.dead) {
    ctx.fillStyle = INK;
    ctx.font = 'bold 7px ui-monospace, monospace';
    ctx.textAlign = 'center';
    ctx.fillText('GAME OVER', 42, 20);
    ctx.font = '6px ui-monospace, monospace';
    ctx.fillText(`score ${s.score}  best ${Math.max(high, s.score)}`, 42, 30);
    ctx.fillText('press any key', 42, 40);
    ctx.textAlign = 'left';
  }
}
