// Bootstrap and the frame loop for Night Wren.
// Fixed-step updates (1/60 s) with a clamped frame delta, so the game plays the
// same on any machine; the canvas is the 1280×800 logical stage.

import { VIEW_W, VIEW_H } from './config.js';
import { createInput, shotParam } from './input.js';
import { createAudio } from './audio.js';
import { Game } from './state.js';
import { drawGame } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const input = createInput(canvas);
const audio = createAudio();
const game = new Game(audio);
const status = document.getElementById('status');

const shot = shotParam();
if (shot) {
  // Staged, deterministic scenes for the screenshots: same seed, same frame.
  stageShot(game, shot);
  drawGame(ctx, game);
} else {
  window.addEventListener('pointerdown', () => audio.unlock(), { once: true });
  window.addEventListener('keydown', () => audio.unlock(), { once: true });
  let last = performance.now();
  let acc = 0;
  const STEP = 1 / 60;
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000);
    last = now;
    acc += dt;
    let guard = 0;
    while (acc >= STEP && guard < 5) {
      game.update(STEP, input);
      acc -= STEP;
      guard += 1;
    }
    if (guard === 5) acc = 0;
    input.endFrame();
    drawGame(ctx, game);
    status.textContent = game.mode === 'play'
      ? `${game.level.def.name}. Score ${game.score}. ${game.hasOpal ? 'Opal taken, reach the exit.' : 'Steal the Sun Opal.'}`
      : game.mode;
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
