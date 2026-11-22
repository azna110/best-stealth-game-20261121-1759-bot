// Deterministic random numbers for Night Wren.
// A mulberry32 generator: the same seed always deals the same patrol jitter,
// sparkle positions and torch flicker, so a screenshot staged from a seed is
// reproducible byte for byte in the game state.

export function makeRng(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickRng(rng, items) {
  return items[Math.floor(rng() * items.length)];
}
