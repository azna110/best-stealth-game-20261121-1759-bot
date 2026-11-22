// The player — Wren, the night thief — for Night Wren.
// Walks, runs (fast and loud) or crouches (slow and quiet), bumps into walls,
// and throws pebbles with the mouse to pull a guard away. Footsteps make noise
// rings guards can hear; running rings are wide, crouching rings are tiny.

import {
  TILE,
  PLAYER_WALK_SPEED,
  PLAYER_RUN_SPEED,
  PLAYER_CROUCH_SPEED,
  NOISE_WALK_RADIUS,
  NOISE_RUN_RADIUS,
  NOISE_PEBBLE_RADIUS,
  PEBBLE_START,
} from './config.js';
import { isSolidTile } from './levels.js';

export function createPlayer(x, y) {
  return {
    x,
    y,
    angle: 0,
    crouching: false,
    running: false,
    moving: false,
    pebbles: PEBBLE_START,
    stepAcc: 0,
    stepPhase: 0,
  };
}

function blocked(level, px, py) {
  const col = Math.floor(px / TILE);
  const row = Math.floor(py / TILE);
  if (row < 0 || row >= level.rows.length || col < 0 || col >= level.rows[0].length) return true;
  return isSolidTile(level.rows[row][col]);
}

// Circle-vs-tile collision: slide along walls instead of sticking to them.
function tryMove(player, level, dx, dy) {
  const r = 13;
  const nx = player.x + dx;
  if (!blocked(level, nx + Math.sign(dx) * r, player.y - r + 2) &&
      !blocked(level, nx + Math.sign(dx) * r, player.y + r - 2) &&
      !blocked(level, nx + Math.sign(dx) * r, player.y)) {
    player.x = nx;
  }
  const ny = player.y + dy;
  if (!blocked(level, player.x - r + 2, ny + Math.sign(dy) * r) &&
      !blocked(level, player.x + r - 2, ny + Math.sign(dy) * r) &&
      !blocked(level, player.x, ny + Math.sign(dy) * r)) {
    player.y = ny;
  }
}

export function updatePlayer(player, dt, input, level, world) {
  const vec = input.moveVector();
  player.moving = vec.x !== 0 || vec.y !== 0;
  player.running = input.down('ShiftLeft', 'ShiftRight') && player.moving && !player.crouching;
  player.crouching = input.down('KeyC', 'ControlLeft') && !player.running;
  const speed = player.crouching
    ? PLAYER_CROUCH_SPEED
    : player.running
      ? PLAYER_RUN_SPEED
      : PLAYER_WALK_SPEED;

  if (player.moving) {
    tryMove(player, level, vec.x * speed * dt, vec.y * speed * dt);
    player.angle = Math.atan2(vec.y, vec.x);
    // Footsteps: a soft ring every step; guards hear the wide ones.
    player.stepAcc += speed * dt;
    const stride = player.running ? 34 : player.crouching ? 26 : 30;
    if (player.stepAcc > stride) {
      player.stepAcc = 0;
      player.stepPhase += 1;
      const radius = player.running
        ? NOISE_RUN_RADIUS
        : player.crouching
          ? 14
          : NOISE_WALK_RADIUS;
      world.noises.push({ x: player.x, y: player.y, r: radius, ttl: 0.55, heardBy: new Set(), kind: 'step' });
      world.audio.footstep(player.running);
    }
  }

  // Throw a pebble where the mouse clicked: it lands with a loud tick.
  const click = input.takeClick();
  if (click && player.pebbles > 0 && world.mode === 'play') {
    player.pebbles -= 1;
    world.noises.push({
      x: click.x - world.viewX,
      y: click.y - world.viewY,
      r: NOISE_PEBBLE_RADIUS,
      ttl: 0.9,
      heardBy: new Set(),
      kind: 'pebble',
    });
    world.audio.pebble();
  }
  return player;
}
