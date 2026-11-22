// Level data for Night Wren: three original manor wings, hardest last.
// Legend: '#' wall, '.' floor, ',' shadow floor (dark, hard to be seen in),
// 'B' bush (hide inside), 'C' crate (tall cover, blocks sight), 'P' player start,
// 'O' the Sun Opal, 'g' a gem, 'E' the exit door. Rows are padded with '#' to
// equal length when a level loads, so a short row is wall, never a hole.

export const LEVELS = [
  {
    name: 'The Garden Wing',
    brief: 'Slip past two patrolling wardens, lift the Opal, leave by the east door.',
    par: 75,
    map: [
      '##########################',
      '#P......,,,.....#....g...#',
      '#.......,,,.....#........#',
      '#.CC...,,,..B...#..C..C..#',
      '#...........B...#........#',
      '#...........B...........#',
      '#......####.....####.....#',
      '#......#........#.....E..#',
      '#..B...#.O......#.g......#',
      '#......#........#........#',
      '#......####.....####.....#',
      '#...........B.......B....#',
      '#....C........C..........#',
      '#.....g....,,,,....B.....#',
      '##########################',
    ],
    guards: [
      { path: [[3, 5], [11, 5], [11, 11], [3, 11]] },
      { path: [[21, 5], [21, 12], [15, 12], [15, 5]] },
    ],
  },
  {
    name: 'The Gallery of Echoes',
    brief: 'Four wardens walk the gallery. The Opal sits in a locked side room — one door in.',
    par: 110,
    map: [
      '##########################',
      '#P....,,,,......#....g...#',
      '#......,,,,.....#........#',
      '#.B...,,,,..C...#..B.....#',
      '#..........C....#....C...#',
      '#.......B...............#',
      '#....######.......####...#',
      '#....#....#......#...#.E.#',
      '#.g..#.O..#..B...#...#...#',
      '#....#...........#...#...#',
      '#....######.......####...#',
      '#.........,,,............#',
      '#.....C....,,,,......B...#',
      '#....g.....,,,,....g.....#',
      '##########################',
    ],
    guards: [
      { path: [[3, 5], [12, 5], [12, 11], [3, 11]] },
      { path: [[20, 3], [20, 11], [14, 11], [14, 3]] },
      { path: [[6, 13], [20, 13]] },
      { path: [[22, 5], [22, 9]] },
    ],
  },
  {
    name: 'The Vault of the Sun Opal',
    brief: 'Five wardens, one dark maze. The true Opal waits in the shadow heart.',
    par: 150,
    map: [
      '##########################',
      '#P..,,,,....#.....g......#',
      '#...,,,,.B..#..C....C....#',
      '#.C.,,,,....#......B.....#',
      '#...........#............#',
      '#......C..........####...#',
      '#.......B.....,,,,#..#.E.#',
      '#..B.....,,,..,,,..#..#..#',
      '#........,,,,,O,,,,#..#..#',
      '#.......,,,,,,,,,,,,#....#',
      '#..C.....B.....,,,.......#',
      '#.....g......B.....#.....#',
      '#.........,,,......B...g.#',
      '#........,,,.............#',
      '##########################',
    ],
    guards: [
      { path: [[4, 4], [11, 4], [11, 9], [4, 9]] },
      { path: [[19, 2], [24, 2], [24, 4], [19, 4]] },
      { path: [[6, 11], [6, 13], [12, 13], [12, 11]] },
      { path: [[9, 6], [13, 6], [13, 10], [10, 10]] },
      { path: [[21, 11], [24, 11], [24, 13], [21, 13]] },
    ],
  },
];

// A tile is solid when it blocks movement and sight.
export function isSolidTile(ch) {
  return ch === '#' || ch === 'C';
}

// Shadow floor hides the player: detection there runs far slower.
export function isShadowTile(ch) {
  return ch === ',';
}

// Bushes are walkable and hide the player from all but the closest guard.
export function isBushTile(ch) {
  return ch === 'B';
}
