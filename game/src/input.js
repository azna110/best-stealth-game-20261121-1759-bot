// Keyboard and mouse input for Night Wren.
// WASD / arrows move, Shift runs (loud), C or Ctrl crouches (quiet, slow),
// E picks up, click throws a pebble to distract a guard, P pauses, M mutes,
// R restarts the level, Enter starts. The game also reads ?shot= for staging.

export function createInput(canvas) {
  const keys = new Set();
  const pressed = new Set();
  let mouse = { x: 0, y: 0, clicked: false, clickX: 0, clickY: 0 };

  function code(e) {
    return e.code;
  }

  window.addEventListener('keydown', (e) => {
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
      e.preventDefault();
    }
    if (!e.repeat) pressed.add(e.code);
    keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => keys.delete(e.code));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousedown', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.clicked = true;
    mouse.clickX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.clickY = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouse.x = ((e.clientX - r.left) / r.width) * canvas.width;
    mouse.y = ((e.clientY - r.top) / r.height) * canvas.height;
  });

  return {
    // Held keys.
    down(...codes) {
      return codes.some((c) => keys.has(c));
    },
    // Keys pressed since the last frame (edge-triggered).
    wasPressed(...codes) {
      return codes.some((c) => pressed.has(c));
    },
    // Movement vector from held keys, normalised.
    moveVector() {
      let x = 0;
      let y = 0;
      if (keys.has('KeyA') || keys.has('ArrowLeft')) x -= 1;
      if (keys.has('KeyD') || keys.has('ArrowRight')) x += 1;
      if (keys.has('KeyW') || keys.has('ArrowUp')) y -= 1;
      if (keys.has('KeyS') || keys.has('ArrowDown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    // The latest mouse click, consumed once.
    takeClick() {
      if (!mouse.clicked) return null;
      mouse.clicked = false;
      return { x: mouse.clickX, y: mouse.clickY };
    },
    mousePos() {
      return { x: mouse.x, y: mouse.y };
    },
    endFrame() {
      pressed.clear();
    },
  };
}

// The ?shot= query picks a staged scene for screenshots: start, cover, patrol,
// alert or victory. Returns null during normal play.
export function shotParam() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  const known = ['start', 'cover', 'patrol', 'alert', 'victory'];
  return known.includes(shot) ? shot : null;
}
