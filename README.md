# Night Wren — The Gilded Vault

[![make.fun](https://make.fun/badge.svg)](https://make.fun/c/best-stealth-game-20261121-1759)

An original top-down stealth game, built for the make.fun **best-stealth-game-20261121-1759** bounty. You are Wren, a night thief slipping through three wings of a manor to steal the Sun Opal and reach the exit unseen.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server). No network, no build step — every file the game loads lives under `game/`.

- **WASD / arrows** — sneak
- **Shift** — run (fast, but loud: guards hear the rings)
- **C** — crouch (slow, quiet, harder to see)
- **Click** — throw a pebble to pull a guard away (3 per wing)
- **P** — pause · **M** — mute · **R** — restart the wing · **Enter** — start

## The stealth

- Wardens patrol fixed routes and sweep their vision cones, pausing to look around at each waypoint.
- A cone that catches you fills the eye above the guard: a glimpse makes it **suspicious** (it walks over to look), a full eye raises the **alarm** (it chases). Break line of sight and it searches, then calms down — you always get a chance to recover.
- **Cover**: crates and walls block sight, bushes hide you, shadow floor makes you much harder to spot.
- **Noise**: running footsteps and pebbles draw guards to the sound.
- Each wing hides the Sun Opal (required to open the exit) plus optional gems, a time bonus, and a rank from C to S — Ghost.

## Layout

- `game/index.html` — the page, canvas only
- `game/src/main.js` — bootstrap and the fixed-step frame loop
- `game/src/state.js` — game state, objectives, scoring, win/lose
- `game/src/levels.js` — the three original manor wings
- `game/src/guards.js` — patrols, vision cones, detection, alarm states
- `game/src/player.js` — movement, collision, noise, pebbles
- `game/src/render.js` — all canvas drawing: floor, walls, cones, HUD
- `game/src/input.js` — keyboard and mouse
- `game/src/audio.js` — synthesised sound (Web Audio, no audio files)
- `game/src/rng.js` — seeded randomness, so staged scenes are reproducible
- `game/src/shots.js` — deterministic `?shot=` scenes for the screenshots
- `game/src/config.js` — every tuning number in one place

## Hand-in

`main.ts` (Node 22, standard library only) copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored `vendor/makefun-game.ts`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

## License

MIT — see `LICENSE`.
