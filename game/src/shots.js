// Staged scenes for the screenshots, all rendered by the game's own code.
// Each shot fixes the level, the player and guard positions and the clock, so
// the same ?shot= always draws the same frame — no wall clock, no randomness.

import { TILE } from './config.js';

function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export function stageShot(game, shot) {
  game.time = 1.6; // frozen clock: torch glow and sparkles sit still
  if (shot === 'start' || shot === 'cover') {
    // Cover: wing one, Wren crouched behind a crate while a warden's cone
    // sweeps past and the Opal glints in its room.
    game.loadLevel(0);
    game.mode = 'play';
    const p = tileCenter(5, 4);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.crouching = true;
    game.player.angle = Math.PI / 2;
    const g = game.guards[0];
    const gp = tileCenter(8, 5);
    g.x = gp.x;
    g.y = gp.y;
    g.angle = -2.82; // cone sweeps back over Wren, crouched by the crates
    g.detection = 0.42;
    g.state = 'suspicious';
    const g2 = game.guards[1];
    const g2p = tileCenter(19, 8);
    g2.x = g2p.x;
    g2.y = g2p.y;
    g2.angle = -Math.PI * 0.85;
    game.noises.push({ x: p.x + 90, y: p.y + 40, r: 90, ttl: 0.5, heardBy: new Set(), kind: 'step' });
  } else if (shot === 'patrol') {
    // Wing two: two wardens crossing the gallery, Wren waiting in shadow.
    game.loadLevel(1);
    game.mode = 'play';
    const p = tileCenter(7, 2);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.crouching = true;
    game.player.angle = Math.PI / 2;
    const g = game.guards[0];
    const gp = tileCenter(6, 5);
    g.x = gp.x;
    g.y = gp.y;
    g.angle = 0;
    const g2 = game.guards[1];
    const g2p = tileCenter(18, 6);
    g2.x = g2p.x;
    g2.y = g2p.y;
    g2.angle = Math.PI;
    g2.detection = 0.18;
  } else if (shot === 'alert') {
    // The alarm: a warden has spotted Wren and gives chase.
    game.loadLevel(0);
    game.mode = 'play';
    const p = tileCenter(13, 5);
    game.player.x = p.x;
    game.player.y = p.y;
    game.player.running = true;
    game.player.angle = Math.PI;
    game.hasOpal = true;
    const g = game.guards[0];
    const gp = tileCenter(10, 5);
    g.x = gp.x;
    g.y = gp.y;
    g.angle = 0;
    g.state = 'alerted';
    g.detection = 1;
    g.lastSeen = { x: p.x, y: p.y, t: game.time };
    game.alarmRaised = true;
    game.spotted = 1;
    game.score = 1250;
  } else if (shot === 'victory') {
    // The getaway: the vault is empty, the score is in.
    game.loadLevel(2);
    game.mode = 'won';
    game.score = 4750;
    game.totalTime = 386;
    game.gemsGot = 3;
    game.gemsTotal = 3;
    game.spotted = 0;
  }
}
