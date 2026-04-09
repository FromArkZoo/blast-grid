// ---- level.js — Stage 1-1 layout generator ----
// Exposes: generateStage1_1(seed)
// Depends on: config.js (GRID_W, GRID_H, TILE, T_EMPTY, T_HARD, T_SOFT)

// mulberry32 — fast, good-quality 32-bit seeded PRNG
function mulberry32(seed) {
  return function () {
    seed |= 0;
    seed = seed + 0x6d2b79f5 | 0;
    var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
    t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// Return Manhattan distance in tile units between two pixel-center positions
function manhattanTiles(ax, ay, bx, by) {
  return Math.abs(Math.round(ax / TILE) - Math.round(bx / TILE)) +
         Math.abs(Math.round(ay / TILE) - Math.round(by / TILE));
}

function generateStage1_1(seed) {
  var rand = mulberry32(seed);

  // ---- Build grid ----
  var grid = [];
  for (var row = 0; row < GRID_H; row++) {
    grid[row] = [];
    for (var col = 0; col < GRID_W; col++) {
      // Full outer border = hard wall
      if (row === 0 || row === GRID_H - 1 || col === 0 || col === GRID_W - 1) {
        grid[row][col] = T_HARD;
      }
      // Interior even-col + even-row pillars = hard wall (classic Bomberman)
      else if (col % 2 === 0 && row % 2 === 0) {
        grid[row][col] = T_HARD;
      }
      // Remaining interior cells: ~60% soft, else empty
      else {
        grid[row][col] = rand() < 0.6 ? T_SOFT : T_EMPTY;
      }
    }
  }

  // ---- Safe zone: force (col=1,row=1), (col=2,row=1), (col=1,row=2) to empty ----
  grid[1][1] = T_EMPTY;
  grid[1][2] = T_EMPTY;
  grid[2][1] = T_EMPTY;

  // ---- Player spawn: pixel center of tile (col=1, row=1) ----
  var playerSpawn = {
    x: 1 * TILE + TILE / 2,
    y: 1 * TILE + TILE / 2
  };

  // ---- Collect candidate tiles by type ----
  var emptyCells = [];
  var softCells = [];
  for (var r = 1; r < GRID_H - 1; r++) {
    for (var c = 1; c < GRID_W - 1; c++) {
      var px = c * TILE + TILE / 2;
      var py = r * TILE + TILE / 2;
      if (grid[r][c] === T_EMPTY) {
        emptyCells.push({ col: c, row: r, x: px, y: py });
      } else if (grid[r][c] === T_SOFT) {
        softCells.push({ col: c, row: r, x: px, y: py });
      }
    }
  }

  // ---- Enemy spawns: 3 positions on empty tiles, Manhattan distance >= 5 from player ----
  var farEmpty = emptyCells.filter(function (cell) {
    return manhattanTiles(cell.x, cell.y, playerSpawn.x, playerSpawn.y) >= 5;
  });

  // Fisher-Yates shuffle (seeded)
  for (var i = farEmpty.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var tmp = farEmpty[i];
    farEmpty[i] = farEmpty[j];
    farEmpty[j] = tmp;
  }

  var enemySpawns = farEmpty.slice(0, 3).map(function (cell) {
    return { x: cell.x, y: cell.y };
  });

  // ---- Shuffle soft cells for deterministic power-up / door placement ----
  var softShuffled = softCells.slice();
  for (var i = softShuffled.length - 1; i > 0; i--) {
    var j = Math.floor(rand() * (i + 1));
    var tmp = softShuffled[i];
    softShuffled[i] = softShuffled[j];
    softShuffled[j] = tmp;
  }

  // ---- Power-ups: 4 tiles — 2 bomb, 1 fire, 1 speed ----
  var powerupTypes = ['bomb', 'bomb', 'fire', 'speed'];
  var powerups = softShuffled.slice(0, 4).map(function (cell, idx) {
    return { tileX: cell.col, tileY: cell.row, type: powerupTypes[idx] };
  });

  // ---- Door: 1 additional soft tile (index 4, different from all powerup positions) ----
  var doorCell = softShuffled[4];
  var doorPosition = { tileX: doorCell.col, tileY: doorCell.row };

  return {
    grid: grid,
    playerSpawn: playerSpawn,
    enemySpawns: enemySpawns,
    powerups: powerups,
    doorPosition: doorPosition
  };
}

// Expose on window for classic-script access
window.generateStage1_1 = generateStage1_1;
