// Keyboard state tracker. Reads are by physical key code. Held keys are
// queried with isDown(); one-shot actions use consumePress() so a single
// keypress triggers a single action regardless of key-repeat.

const TRACKED = new Set([
  'KeyW', 'KeyA', 'KeyS', 'KeyD',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'ShiftLeft', 'ShiftRight',
  'KeyE', 'Space',
  'ControlLeft', 'ControlRight', 'MetaLeft', 'MetaRight',
]);

export class Input {
  constructor(target = window) {
    this.down = new Set();
    this.pressed = new Set();
    target.addEventListener('keydown', (e) => {
      if (TRACKED.has(e.code)) {
        if (!e.repeat && !this.down.has(e.code)) this.pressed.add(e.code);
        this.down.add(e.code);
        e.preventDefault();
      }
    });
    target.addEventListener('keyup', (e) => {
      this.down.delete(e.code);
    });
    target.addEventListener('blur', () => {
      this.down.clear();
      this.pressed.clear();
    });
  }

  isDown(code) {
    return this.down.has(code);
  }

  // True once per physical keypress, then cleared.
  consumePress(code) {
    if (this.pressed.has(code)) {
      this.pressed.delete(code);
      return true;
    }
    return false;
  }

  // Screen-space movement intent from WASD/arrows: each axis in [-1, 1].
  moveIntent() {
    let dx = 0, dy = 0;
    if (this.isDown('KeyA') || this.isDown('ArrowLeft')) dx -= 1;
    if (this.isDown('KeyD') || this.isDown('ArrowRight')) dx += 1;
    if (this.isDown('KeyW') || this.isDown('ArrowUp')) dy -= 1;
    if (this.isDown('KeyS') || this.isDown('ArrowDown')) dy += 1;
    return { dx, dy };
  }

  sprinting() {
    return this.isDown('ShiftLeft') || this.isDown('ShiftRight');
  }

  usePressed() {
    return this.consumePress('KeyE')
      || this.consumePress('ControlLeft') || this.consumePress('ControlRight')
      || this.consumePress('MetaLeft') || this.consumePress('MetaRight');
  }

  jumpPressed() {
    return this.consumePress('Space');
  }
}
