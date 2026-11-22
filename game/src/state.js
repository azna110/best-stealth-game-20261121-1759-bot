// Game state for Night Wren: loading a level, the objective (take the Opal,
// then reach the exit), pickups, the timer, the score and the win/lose flow.
// Modes: title → play ⇄ paused → levelclear → play … → won / caught.

import { TILE, VIEW_W, VIEW_H, HUD_H, GEM_SCORE, OPAL_SCORE, CLEAN_BONUS, TIME_PAR } from './config.js';
import { LEVELS } from './levels.js';
import { createGuard, updateGuard } from './guards.js';
import { createPlayer, updatePlayer } from './player.js';
import { makeRng } from './rng.js';

export function tileCenter(col, row) {
  return { x: col * TILE + TILE / 2, y: row * TILE + TILE / 2 };
}

export class Game {
  constructor(audio) {
    this.audio = audio;
    this.levelIndex = 0;
    this.mode = 'title'; // title | play | paused | levelclear | won | caught
    this.score = 0;
    this.totalTime = 0;
    this.levelTime = 0;
    this.gemsGot = 0;
    this.gemsTotal = 0;
    this.spotted = 0; // times a guard fully raised the alarm
    this.alarmRaised = false;
    this.caught = false;
    this.time = 0;
    this.viewX = 0;
    this.viewY = HUD_H;
    this.message = '';
    this.messageTtl = 0;
    this.clearT = 0;
    this.loadLevel(0);
  }

  loadLevel(index) {
    this.levelIndex = index;
    const def = LEVELS[index];
    const width = Math.max(...def.map.map((r) => r.length));
    const rows = def.map.map((r) => r.padEnd(width, '#').split(''));
    this.level = { def, rows, cols: width, rowsCount: rows.length };
    this.noises = [];
    this.guards = def.guards.map((g, i) => createGuard(g, i));
    this.gems = [];
    this.opal = null;
    this.exit = null;
    this.playerStart = { x: TILE * 1.5, y: TILE * 1.5 };
    for (let r = 0; r < rows.length; r++) {
      for (let c = 0; c < rows[r].length; c++) {
        const ch = rows[r][c];
        const p = tileCenter(c, r);
        if (ch === 'P') this.playerStart = p;
        if (ch === 'g') this.gems.push({ x: p.x, y: p.y, got: false, bob: 0 });
        if (ch === 'O') this.opal = { x: p.x, y: p.y, got: false };
        if (ch === 'E') this.exit = { x: p.x, y: p.y };
      }
    }
    this.gemsTotal = this.gems.length;
    this.player = createPlayer(this.playerStart.x, this.playerStart.y);
    this.hasOpal = false;
    this.levelTime = 0;
    this.alarmRaised = false;
    this.caught = false;
    // Centre the map under the HUD.
    this.viewX = Math.round((VIEW_W - width * TILE) / 2);
    this.viewY = HUD_H + Math.round((VIEW_H - HUD_H - rows.length * TILE) / 2);
    this.rng = makeRng(9000 + index * 131);
    this.sparkles = Array.from({ length: 26 }, () => ({
      x: this.rng() * width * TILE,
      y: this.rng() * rows.length * TILE,
      s: 0.4 + this.rng() * 0.6,
      p: this.rng() * Math.PI * 2,
    }));
  }

  startGame() {
    this.score = 0;
    this.totalTime = 0;
    this.gemsGot = 0;
    this.spotted = 0;
    this.loadLevel(0);
    this.mode = 'play';
    this.audio.startDrone();
  }

  nextLevel() {
    if (this.levelIndex + 1 >= LEVELS.length) {
      this.mode = 'won';
      const clean = this.spotted === 0 ? CLEAN_BONUS : 0;
      this.score += clean;
      this.audio.victory();
    } else {
      this.loadLevel(this.levelIndex + 1);
      this.mode = 'play';
    }
  }

  say(text, ttl = 2.6) {
    this.message = text;
    this.messageTtl = ttl;
  }

  update(dt, input) {
    this.time += dt;
    if (this.messageTtl > 0) this.messageTtl -= dt;
    if (this.mode === 'title') {
      if (input.wasPressed('Enter', 'Space')) this.startGame();
      return;
    }
    if (this.mode === 'paused') {
      if (input.wasPressed('KeyP', 'Escape')) this.mode = 'play';
      return;
    }
    if (this.mode === 'levelclear') {
      this.clearT += dt;
      if (this.clearT > 1.4 && input.wasPressed('Enter', 'Space')) this.nextLevel();
      return;
    }
    if (this.mode === 'won' || this.mode === 'caught') {
      if (input.wasPressed('Enter', 'KeyR')) this.startGame();
      return;
    }
    // mode === 'play'
    if (input.wasPressed('KeyP', 'Escape')) {
      this.mode = 'paused';
      return;
    }
    if (input.wasPressed('KeyR')) {
      this.loadLevel(this.levelIndex);
      return;
    }
    if (input.wasPressed('KeyM')) {
      const muted = this.audio.toggleMute();
      this.say(muted ? 'Sound off (M to turn back on)' : 'Sound on');
      return;
    }
    this.levelTime += dt;
    this.totalTime += dt;

    const world = {
      mode: this.mode,
      level: this.level,
      player: this.player,
      noises: this.noises,
      time: this.time,
      audio: this.audio,
      viewX: this.viewX,
      viewY: this.viewY,
      alarmRaised: false,
      caught: false,
    };
    updatePlayer(this.player, dt, input, this.level, world);
    for (const g of this.guards) updateGuard(g, dt, world);
    // The alarm lamp shows the live state: any guard hunting right now.
    const alarming = this.guards.some((g) => g.state === 'alerted');
    if (alarming && !this.alarmRaised) this.spotted += 1;
    this.alarmRaised = alarming;
    if (world.caught) {
      this.mode = 'caught';
      this.audio.caught();
      return;
    }
    // Noise rings fade.
    for (const n of this.noises) n.ttl -= dt;
    this.noises = this.noises.filter((n) => n.ttl > 0);

    // Pickups.
    for (const gem of this.gems) {
      gem.bob += dt;
      if (!gem.got && Math.hypot(gem.x - this.player.x, gem.y - this.player.y) < 26) {
        gem.got = true;
        this.gemsGot += 1;
        this.score += GEM_SCORE;
        this.audio.pickup();
        this.say('Gem pocketed  +250');
      }
    }
    if (this.opal && !this.opal.got &&
        Math.hypot(this.opal.x - this.player.x, this.opal.y - this.player.y) < 28) {
      this.opal.got = true;
      this.hasOpal = true;
      this.score += OPAL_SCORE;
      this.audio.opal();
      this.say('The Sun Opal is yours — reach the exit!', 3.5);
    }
    // The exit.
    if (this.exit && Math.hypot(this.exit.x - this.player.x, this.exit.y - this.player.y) < 30) {
      if (!this.hasOpal) {
        // Locked: say so, but only once every few seconds, and leave the
        // player where they stand — never teleport through the level.
        if (this.messageTtl <= 0) {
          this.audio.locked();
          this.say('Locked — the door only opens for the Opal bearer.');
        }
      } else {
        const par = TIME_PAR[this.levelIndex] || 120;
        const bonus = Math.max(0, Math.round((par - this.levelTime) * 10));
        this.score += bonus;
        this.mode = 'levelclear';
        this.clearT = 0;
        this.audio.victory();
        this.say(`Out clean — time bonus +${bonus}`, 3);
      }
    }
  }

  // Rank for the end screen.
  rank() {
    if (this.spotted === 0 && this.totalTime < 420) return 'S — Ghost';
    if (this.spotted <= 1) return 'A — Shadow';
    if (this.spotted <= 3) return 'B — Sneak';
    return 'C — Loudmouth';
  }
}
