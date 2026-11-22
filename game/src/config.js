// Shared tuning for Night Wren: every number that shapes how the stealth feels.
// One place to tune patrol speed, vision range, detection and noise.

export const TILE = 48;
export const VIEW_W = 1280;
export const VIEW_H = 800;
export const HUD_H = 64;

// Player movement (pixels per second).
export const PLAYER_WALK_SPEED = 150;
export const PLAYER_RUN_SPEED = 245;
export const PLAYER_CROUCH_SPEED = 82;

// How far a guard can see, and how wide its cone is.
export const GUARD_VIEW_DIST = 265;
export const GUARD_HALF_ANGLE = 0.62; // radians, about 35 degrees each side
export const GUARD_PATROL_SPEED = 62;
export const GUARD_SUSPICIOUS_SPEED = 95;
export const GUARD_CHASE_SPEED = 168;

// Detection: how fast the eye fills (per second) when the player is seen dead-on.
export const DETECT_RATE = 1.15;
export const DETECT_DECAY = 0.45;
export const CROUCH_DETECT_FACTOR = 0.45;
export const SHADOW_DETECT_FACTOR = 0.35;
export const BUSH_HIDE_DIST = 95; // guards closer than this still spot a hidden player

// Noise: footstep rings guards can hear.
export const NOISE_WALK_RADIUS = 46;
export const NOISE_RUN_RADIUS = 185;
export const NOISE_PEBBLE_RADIUS = 230;
export const PEBBLE_START = 3;

// Alarm: how long a guard keeps hunting after losing sight.
export const HUNT_MEMORY = 6.0;
export const SEARCH_TIME = 4.5;

// Scoring.
export const GEM_SCORE = 250;
export const OPAL_SCORE = 1000;
export const CLEAN_BONUS = 800;
export const TIME_PAR = [75, 110, 150]; // seconds per level, for the time bonus

export const COLORS = {
  floor: '#232a3d',
  floorAlt: '#202636',
  shadow: '#141a2b',
  wall: '#4a4238',
  wallTop: '#6b5f4c',
  crate: '#7a5c33',
  crateTop: '#a37c46',
  bush: '#1e4d2e',
  bushTop: '#2f7a44',
  exit: '#e8b64c',
  opal: '#ffd75e',
  gem: '#6fd3ff',
  player: '#f2ead8',
  guard: '#e5484d',
  cone: 'rgba(255, 214, 90, 0.20)',
  coneAlert: 'rgba(229, 72, 77, 0.30)',
  coneSuspicious: 'rgba(255, 170, 60, 0.26)',
  hud: '#0d1120',
  text: '#e8e2d0',
  dim: '#9aa3b8',
};
