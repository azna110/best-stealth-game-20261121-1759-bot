// Canvas rendering for Night Wren: the manor floor, walls and cover, the
// guards with their vision cones, the player, noise rings, and the HUD with
// its overlays. Everything is drawn from the game state — no image assets.

import { TILE, VIEW_W, VIEW_H, HUD_H, GUARD_VIEW_DIST, GUARD_HALF_ANGLE, COLORS } from './config.js';
import { isSolidTile, isShadowTile, isBushTile } from './levels.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, guard, level) {
  const coneColor =
    guard.state === 'alerted' ? COLORS.coneAlert :
    guard.state === 'suspicious' || guard.state === 'search' ? COLORS.coneSuspicious :
    COLORS.cone;
  // The cone is clipped by walls: march out in slices and stop each ray at a wall.
  const slices = 26;
  ctx.fillStyle = coneColor;
  ctx.beginPath();
  ctx.moveTo(guard.x, guard.y);
  for (let i = 0; i <= slices; i++) {
    const a = guard.angle - GUARD_HALF_ANGLE + (2 * GUARD_HALF_ANGLE * i) / slices;
    let d = GUARD_VIEW_DIST;
    for (let r = 12; r <= GUARD_VIEW_DIST; r += 8) {
      const x = guard.x + Math.cos(a) * r;
      const y = guard.y + Math.sin(a) * r;
      const col = Math.floor(x / TILE);
      const row = Math.floor(y / TILE);
      if (row < 0 || row >= level.rows.length || col < 0 || col >= level.rows[0].length ||
          isSolidTile(level.rows[row][col])) {
        d = r;
        break;
      }
    }
    ctx.lineTo(guard.x + Math.cos(a) * d, guard.y + Math.sin(a) * d);
  }
  ctx.closePath();
  ctx.fill();
  // Cone edge.
  ctx.strokeStyle = guard.state === 'alerted' ? 'rgba(229,72,77,0.55)' : 'rgba(255,214,90,0.30)';
  ctx.lineWidth = 1.5;
  ctx.stroke();
}

function drawGuard(ctx, guard, time) {
  // Footstep ripples: you can hear where a guard is by the rings at its feet.
  const pulse = (guard.stepPulse % 34) / 34;
  ctx.strokeStyle = `rgba(230, 220, 200, ${0.28 * (1 - pulse)})`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(guard.x, guard.y, 10 + pulse * 22, 0, Math.PI * 2);
  ctx.stroke();

  ctx.save();
  ctx.translate(guard.x, guard.y);
  ctx.rotate(guard.angle);
  // Body: a warden in a red coat, facing the way it walks.
  ctx.fillStyle = '#3a1518';
  ctx.beginPath();
  ctx.arc(0, 0, 15, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.guard;
  ctx.beginPath();
  ctx.arc(0, 0, 12, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.fillRect(8, -4, 7, 8); // lantern glint at the front
  ctx.fillStyle = '#f2ead8';
  ctx.beginPath();
  ctx.arc(11, -4, 2, 0, Math.PI * 2);
  ctx.arc(11, 4, 2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // Detection eye above the guard.
  if (guard.detection > 0.03) {
    const w = 30;
    const x = guard.x - w / 2;
    const y = guard.y - 30;
    ctx.fillStyle = 'rgba(10, 10, 16, 0.75)';
    roundRect(ctx, x - 2, y - 2, w + 4, 9, 4);
    ctx.fill();
    ctx.fillStyle = guard.detection >= 1 ? '#e5484d' : guard.detection >= 0.55 ? '#ffaa3c' : '#ffd65a';
    ctx.fillRect(x, y, w * guard.detection, 5);
    if (guard.state === 'alerted') {
      ctx.fillStyle = '#e5484d';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', guard.x, guard.y - 36);
    } else if (guard.state === 'suspicious') {
      ctx.fillStyle = '#ffaa3c';
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('?', guard.x, guard.y - 36);
    }
  }
}

function drawPlayer(ctx, player, time, hasOpal) {
  ctx.save();
  ctx.translate(player.x, player.y);
  // Soft shadow underfoot, smaller when crouched.
  ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
  ctx.beginPath();
  ctx.ellipse(0, 8, player.crouching ? 9 : 12, 5, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.rotate(player.angle);
  ctx.fillStyle = '#20263a';
  ctx.beginPath();
  ctx.arc(0, 0, player.crouching ? 10 : 13, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(0, 0, player.crouching ? 8 : 11, 0, Math.PI * 2);
  ctx.fill();
  // Hood point and the wren feather.
  ctx.fillStyle = '#2f7a44';
  ctx.beginPath();
  ctx.moveTo(10, 0);
  ctx.lineTo(2, -5);
  ctx.lineTo(2, 5);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#ffd75e';
  ctx.beginPath();
  ctx.arc(4, -4, 1.8, 0, Math.PI * 2);
  ctx.arc(4, 4, 1.8, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  if (hasOpal) {
    const bob = Math.sin(time * 3) * 3;
    ctx.fillStyle = COLORS.opal;
    ctx.save();
    ctx.translate(player.x + 16, player.y - 12 + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillRect(-4, -4, 8, 8);
    ctx.restore();
  }
}

export function drawGame(ctx, game) {
  const level = game.level;
  const ox = game.viewX;
  const oy = game.viewY;
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = '#070a12';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);

  ctx.save();
  ctx.translate(ox, oy);

  // Floor.
  for (let r = 0; r < level.rows.length; r++) {
    for (let c = 0; c < level.rows[r].length; c++) {
      const ch = level.rows[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === '#') {
        // Walls read as walls: warm stone with a lit top edge.
        ctx.fillStyle = COLORS.wall;
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = COLORS.wallTop;
        ctx.fillRect(x, y, TILE, 5);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.28)';
        ctx.fillRect(x, y + TILE - 4, TILE, 4);
        continue;
      }
      if ((r + c) % 2 === 0) {
        ctx.fillStyle = COLORS.floor;
      } else {
        ctx.fillStyle = COLORS.floorAlt;
      }
      ctx.fillRect(x, y, TILE, TILE);
      if (isShadowTile(ch)) {
        // Shadow is darkness over the same floor, so the tiles still read.
        ctx.fillStyle = 'rgba(5, 8, 18, 0.55)';
        ctx.fillRect(x, y, TILE, TILE);
        ctx.fillStyle = 'rgba(120, 150, 220, 0.05)';
        ctx.fillRect(x + 6, y + 6, TILE - 12, TILE - 12);
      }
    }
  }

  // Sparkles drifting over the floor.
  for (const s of game.sparkles) {
    const a = 0.10 + 0.10 * Math.sin(game.time * 1.2 + s.p);
    ctx.fillStyle = `rgba(255, 225, 150, ${a})`;
    ctx.fillRect(s.x, s.y, 2.5 * s.s, 2.5 * s.s);
  }

  // Crates and bushes (cover), drawn under the actors.
  for (let r = 0; r < level.rows.length; r++) {
    for (let c = 0; c < level.rows[r].length; c++) {
      const ch = level.rows[r][c];
      const x = c * TILE;
      const y = r * TILE;
      if (ch === 'C') {
        ctx.fillStyle = COLORS.crate;
        roundRect(ctx, x + 4, y + 4, TILE - 8, TILE - 8, 5);
        ctx.fill();
        ctx.fillStyle = COLORS.crateTop;
        ctx.fillRect(x + 8, y + 8, TILE - 16, 6);
        ctx.fillRect(x + 8, y + TILE - 14, TILE - 16, 6);
      } else if (ch === 'B') {
        ctx.fillStyle = COLORS.bush;
        ctx.beginPath();
        ctx.arc(x + TILE / 2, y + TILE / 2, 21, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = COLORS.bushTop;
        ctx.beginPath();
        ctx.arc(x + TILE / 2 - 6, y + TILE / 2 - 5, 9, 0, Math.PI * 2);
        ctx.arc(x + TILE / 2 + 8, y + TILE / 2 + 6, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }

  // Exit door.
  if (game.exit) {
    const e = game.exit;
    ctx.fillStyle = game.hasOpal ? COLORS.exit : '#5a5346';
    roundRect(ctx, e.x - 18, e.y - 18, 36, 36, 6);
    ctx.fill();
    ctx.strokeStyle = game.hasOpal ? '#fff2c0' : '#8a8272';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = '#141824';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.hasOpal ? 'EXIT' : 'LOCK', e.x, e.y + 4);
    if (game.hasOpal) {
      ctx.strokeStyle = `rgba(232, 182, 76, ${0.5 + 0.4 * Math.sin(game.time * 3)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(e.x, e.y, 24, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // Gems and the Opal.
  for (const gem of game.gems) {
    if (gem.got) continue;
    const bob = Math.sin(gem.bob * 3) * 3;
    ctx.save();
    ctx.translate(gem.x, gem.y + bob);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.gem;
    ctx.fillRect(-6, -6, 12, 12);
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.fillRect(-6, -6, 12, 4);
    ctx.restore();
  }
  if (game.opal && !game.opal.got) {
    const o = game.opal;
    const glow = 0.5 + 0.35 * Math.sin(game.time * 2.4);
    ctx.fillStyle = `rgba(255, 215, 94, ${0.25 * glow})`;
    ctx.beginPath();
    ctx.arc(o.x, o.y, 26, 0, Math.PI * 2);
    ctx.fill();
    ctx.save();
    ctx.translate(o.x, o.y + Math.sin(game.time * 2) * 2);
    ctx.rotate(Math.PI / 4);
    ctx.fillStyle = COLORS.opal;
    ctx.fillRect(-9, -9, 18, 18);
    ctx.fillStyle = '#fff6cf';
    ctx.fillRect(-9, -9, 18, 6);
    ctx.restore();
  }

  // Vision cones, then guards, then the player.
  for (const g of game.guards) drawCone(ctx, g, level);
  // Noise rings.
  for (const n of game.noises) {
    const age = 1 - n.ttl / (n.kind === 'pebble' ? 0.9 : 0.55);
    ctx.strokeStyle = n.kind === 'pebble'
      ? `rgba(255, 200, 80, ${0.7 * (1 - age)})`
      : `rgba(200, 210, 240, ${0.45 * (1 - age)})`;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(n.x, n.y, 8 + age * n.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  for (const g of game.guards) drawGuard(ctx, g, game.time);
  if (game.mode !== 'title') drawPlayer(ctx, game.player, game.time, game.hasOpal);

  ctx.restore();

  drawHud(ctx, game);
  if (game.mode === 'title') drawTitle(ctx, game);
  if (game.mode === 'paused') drawPaused(ctx);
  if (game.mode === 'levelclear') drawLevelClear(ctx, game);
  if (game.mode === 'won') drawWon(ctx, game);
  if (game.mode === 'caught') drawCaught(ctx, game);
  if (game.messageTtl > 0 && game.mode === 'play') {
    ctx.fillStyle = 'rgba(10, 13, 22, 0.85)';
    const w = ctx.measureText(game.message).width + 36;
    roundRect(ctx, (VIEW_W - w) / 2, VIEW_H - 58, w, 34, 8);
    ctx.fill();
    ctx.fillStyle = COLORS.text;
    ctx.font = '15px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(game.message, VIEW_W / 2, VIEW_H - 36);
  }
}

function drawHud(ctx, game) {
  ctx.fillStyle = COLORS.hud;
  ctx.fillRect(0, 0, VIEW_W, HUD_H);
  ctx.fillStyle = '#232a3d';
  ctx.fillRect(0, HUD_H - 2, VIEW_W, 2);
  ctx.textAlign = 'left';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText('NIGHT WREN', 18, 27);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.dim;
  const def = game.level.def;
  ctx.fillText(`${def.name}  ·  ${game.levelIndex + 1}/3`, 18, 48);

  // Objective.
  ctx.font = '14px sans-serif';
  ctx.fillStyle = game.hasOpal ? '#ffd75e' : COLORS.text;
  ctx.fillText(game.hasOpal ? '◆ Opal taken — reach the EXIT' : '◇ Steal the Sun Opal, then reach the EXIT', 300, 27);
  ctx.fillStyle = COLORS.dim;
  ctx.fillText(def.brief, 300, 48);

  // Score, gems, pebbles, time.
  ctx.textAlign = 'right';
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 17px sans-serif';
  ctx.fillText(`Score ${game.score}`, VIEW_W - 18, 26);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = COLORS.dim;
  const mm = Math.floor(game.levelTime / 60);
  const ss = Math.floor(game.levelTime % 60).toString().padStart(2, '0');
  ctx.fillText(`◆ ${game.gemsGot}/${game.gemsTotal} gems   ● ${game.player.pebbles} pebbles   ${mm}:${ss}`, VIEW_W - 18, 48);

  // Alarm lamp.
  const alarming = game.guards.some((g) => g.state === 'alerted');
  const suspicious = game.guards.some((g) => g.state === 'suspicious' || g.state === 'search');
  ctx.fillStyle = alarming ? '#e5484d' : suspicious ? '#ffaa3c' : '#2f7a44';
  ctx.beginPath();
  ctx.arc(VIEW_W - 330, 20, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText(alarming ? 'ALARM' : suspicious ? 'WARY' : 'UNSEEN', VIEW_W - 318, 24);
}

function overlay(ctx, title, lines, accent) {
  ctx.fillStyle = 'rgba(5, 7, 13, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.textAlign = 'center';
  ctx.fillStyle = accent;
  ctx.font = 'bold 52px sans-serif';
  ctx.fillText(title, VIEW_W / 2, 300);
  ctx.fillStyle = COLORS.text;
  ctx.font = '18px sans-serif';
  lines.forEach((line, i) => ctx.fillText(line, VIEW_W / 2, 350 + i * 30));
}

function drawTitle(ctx, game) {
  overlay(ctx, 'NIGHT WREN', [
    'The Gilded Vault — a stealth heist in three wings',
    'WASD / arrows to sneak · Shift to run (loud) · C to crouch (quiet)',
    'Click to throw a pebble and pull a guard away · Hide in bushes and shadow',
    'Take the Sun Opal, then slip out the exit unseen.',
    '',
    'Press Enter to begin',
  ], '#ffd75e');
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px sans-serif';
  ctx.fillText('Wren is a night thief of her own making — no borrowed names, no borrowed maps.', VIEW_W / 2, 560);
}

function drawPaused(ctx) {
  overlay(ctx, 'PAUSED', ['The wardens wait. Patience is the thief’s friend.', '', 'Press P to keep sneaking'], '#9aa3b8');
}

function drawLevelClear(ctx, game) {
  const next = game.levelIndex + 1 < 3 ? 'Press Enter for the next wing' : 'Press Enter for the getaway';
  overlay(ctx, 'CLEAN GETAWAY', [
    `${game.level.def.name} — cleared. Score ${game.score}.`,
    `Gems ${game.gemsGot}/${game.gemsTotal} · Alarms raised ${game.spotted}`,
    '',
    next,
  ], '#7ddc8f');
}

function drawWon(ctx, game) {
  overlay(ctx, 'THE VAULT IS YOURS', [
    `Final score ${game.score} · Rank ${game.rank()}`,
    `Time ${Math.floor(game.totalTime / 60)}:${Math.floor(game.totalTime % 60).toString().padStart(2, '0')} · Gems ${game.gemsGot}/${game.gemsTotal} · Alarms ${game.spotted}`,
    '',
    'Press Enter to play again',
  ], '#ffd75e');
}

function drawCaught(ctx, game) {
  overlay(ctx, 'CAUGHT!', [
    'A warden laid hands on Wren in the lamplight.',
    `Score ${game.score} · ${game.level.def.name}`,
    '',
    'Press Enter to try the wing again',
  ], '#e5484d');
}
