// Guard patrols, vision and the detection state machine for Night Wren.
// A guard walks its patrol loop, turns its cone, and fills its eye meter when
// the player is inside the cone with a clear line of sight. A glimpse makes it
// suspicious (it walks over to look); a full meter raises the alarm (it chases).
// Lose sight long enough and it searches, then calms back to its patrol —
// the player always gets a chance to recover.

import {
  TILE,
  GUARD_VIEW_DIST,
  GUARD_HALF_ANGLE,
  GUARD_PATROL_SPEED,
  GUARD_SUSPICIOUS_SPEED,
  GUARD_CHASE_SPEED,
  DETECT_RATE,
  DETECT_DECAY,
  CROUCH_DETECT_FACTOR,
  SHADOW_DETECT_FACTOR,
  BUSH_HIDE_DIST,
  HUNT_MEMORY,
  SEARCH_TIME,
} from './config.js';
import { isSolidTile, isShadowTile, isBushTile } from './levels.js';
import { makeRng } from './rng.js';

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

function angleLerp(a, b, t) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return a + d * Math.min(1, t);
}

function angleDiff(a, b) {
  let d = b - a;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return Math.abs(d);
}

// Line of sight on the tile grid: sample the segment; a wall or crate blocks it.
export function hasLineOfSight(level, x0, y0, x1, y1) {
  const dist = Math.hypot(x1 - x0, y1 - y0);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i++) {
    const t = i / steps;
    const x = x0 + (x1 - x0) * t;
    const y = y0 + (y1 - y0) * t;
    const col = Math.floor(x / TILE);
    const row = Math.floor(y / TILE);
    if (row < 0 || row >= level.rows.length || col < 0 || col >= level.rows[0].length) return false;
    if (isSolidTile(level.rows[row][col])) return false;
  }
  return true;
}

export function createGuard(def, index) {
  const pts = def.path.map(([c, r]) => tileCenter(c, r));
  const rng = makeRng(1234 + index * 777);
  const start = pts[0];
  const next = pts.length > 1 ? pts[1] : pts[0];
  return {
    id: index,
    x: start.x,
    y: start.y,
    angle: Math.atan2(next.y - start.y, next.x - start.x),
    path: pts,
    wp: 1 % pts.length,
    state: 'patrol', // patrol | suspicious | alerted | search
    detection: 0,
    lastSeen: null,
    investigate: null,
    lookTimer: 0,
    stateTime: 0,
    searchLeft: 0,
    stepPulse: 0,
    rng,
    // A guard that just calmed down ignores the same glimpse for a moment.
    cooldown: 0,
  };
}

// How visible the player is to this guard right now: 0 means unseen.
export function visibilityTo(guard, player, level) {
  const dx = player.x - guard.x;
  const dy = player.y - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist > GUARD_VIEW_DIST) return 0;
  if (dist > 42) {
    const toPlayer = Math.atan2(dy, dx);
    if (angleDiff(guard.angle, toPlayer) > GUARD_HALF_ANGLE) return 0;
  }
  if (!hasLineOfSight(level, guard.x, guard.y, player.x, player.y)) return 0;
  const col = Math.floor(player.x / TILE);
  const row = Math.floor(player.y / TILE);
  const tile = level.rows[row] && level.rows[row][col];
  if (isBushTile(tile) && dist > BUSH_HIDE_DIST) return 0;
  let vis = 1 - (dist / GUARD_VIEW_DIST) * 0.55;
  if (isShadowTile(tile)) vis *= SHADOW_DETECT_FACTOR;
  if (player.crouching) vis *= CROUCH_DETECT_FACTOR;
  return Math.max(0, vis);
}

function moveToward(guard, tx, ty, speed, dt) {
  const dx = tx - guard.x;
  const dy = ty - guard.y;
  const dist = Math.hypot(dx, dy);
  if (dist < 2) return true;
  const step = Math.min(dist, speed * dt);
  guard.x += (dx / dist) * step;
  guard.y += (dy / dist) * step;
  guard.angle = angleLerp(guard.angle, Math.atan2(dy, dx), dt * 8);
  guard.stepPulse += step;
  return dist - step < 3;
}

export function updateGuard(guard, dt, world) {
  const { player, level, time } = world;
  guard.stateTime += dt;
  if (guard.cooldown > 0) guard.cooldown -= dt;

  // Hear a noise: walk over to look, unless already hunting the player.
  for (const noise of world.noises) {
    if (guard.state === 'alerted') continue;
    const d = Math.hypot(noise.x - guard.x, noise.y - guard.y);
    if (d < noise.r && !noise.heardBy.has(guard.id)) {
      noise.heardBy.add(guard.id);
      guard.investigate = { x: noise.x, y: noise.y };
      guard.detection = Math.max(guard.detection, 0.4);
      if (guard.state === 'patrol') {
        guard.state = 'suspicious';
        guard.stateTime = 0;
        world.audio.suspicious();
      }
    }
  }

  const vis = visibilityTo(guard, player, level);
  if (vis > 0) {
    const rate = DETECT_RATE * vis * (guard.state === 'alerted' ? 1.6 : 1);
    guard.detection = Math.min(1, guard.detection + rate * dt);
    guard.lastSeen = { x: player.x, y: player.y, t: time };
    if (guard.detection >= 0.55 && guard.state === 'patrol' && guard.cooldown <= 0) {
      guard.state = 'suspicious';
      guard.stateTime = 0;
      guard.investigate = { x: player.x, y: player.y };
      world.audio.suspicious();
    }
    if (guard.detection >= 1 && guard.state !== 'alerted') {
      guard.state = 'alerted';
      guard.stateTime = 0;
      guard.searchLeft = 0;
      world.alarmRaised = true;
      world.audio.alarm();
    }
  } else if (guard.state === 'patrol' || guard.state === 'suspicious') {
    guard.detection = Math.max(0, guard.detection - DETECT_DECAY * dt);
  }

  if (guard.state === 'patrol') {
    if (guard.lookTimer > 0) {
      // Pause at the waypoint and look around before moving on.
      guard.lookTimer -= dt;
      guard.angle += Math.sin(time * 1.4 + guard.id * 2.1) * dt * 0.9;
    } else {
      const target = guard.path[guard.wp];
      if (moveToward(guard, target.x, target.y, GUARD_PATROL_SPEED, dt)) {
        guard.wp = (guard.wp + 1) % guard.path.length;
        guard.lookTimer = 0.9;
      }
    }
  } else if (guard.state === 'suspicious') {
    const target = guard.investigate || guard.lastSeen;
    if (target) {
      if (moveToward(guard, target.x, target.y, GUARD_SUSPICIOUS_SPEED, dt)) {
        guard.lookTimer += dt;
        guard.angle += dt * 1.8; // sweep the room while looking
        if (guard.lookTimer > 2.6) {
          guard.state = 'patrol';
          guard.stateTime = 0;
          guard.lookTimer = 0;
          guard.investigate = null;
          guard.cooldown = 1.5;
        }
      } else {
        guard.lookTimer = 0;
      }
    }
  } else if (guard.state === 'alerted') {
    const target = guard.lastSeen;
    if (target) {
      const arrived = moveToward(guard, target.x, target.y, GUARD_CHASE_SPEED, dt);
      const sinceSeen = time - target.t;
      if (arrived || sinceSeen > HUNT_MEMORY) {
        guard.state = 'search';
        guard.stateTime = 0;
        guard.searchLeft = 2;
        guard.investigate = {
          x: target.x + (guard.rng() - 0.5) * 220,
          y: target.y + (guard.rng() - 0.5) * 220,
        };
      }
    }
    // Caught: the guard reaches the player.
    if (Math.hypot(player.x - guard.x, player.y - guard.y) < 26) {
      world.caught = true;
    }
  } else if (guard.state === 'search') {
    const target = guard.investigate;
    if (target && moveToward(guard, target.x, target.y, GUARD_SUSPICIOUS_SPEED, dt)) {
      guard.searchLeft -= 1;
      if (guard.searchLeft <= 0 || guard.stateTime > SEARCH_TIME + 4) {
        guard.state = 'patrol';
        guard.stateTime = 0;
        guard.investigate = null;
        guard.detection = 0;
        guard.cooldown = 2;
      } else {
        guard.investigate = {
          x: guard.lastSeen.x + (guard.rng() - 0.5) * 260,
          y: guard.lastSeen.y + (guard.rng() - 0.5) * 260,
        };
      }
    }
    if (guard.stateTime > SEARCH_TIME + 6) {
      guard.state = 'patrol';
      guard.stateTime = 0;
      guard.detection = 0;
    }
  }
}
