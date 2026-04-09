// enemy.js — Balloom wandering AI
// Depends on: config.js (TILE, T_HARD, T_SOFT, PLAYER_BASE_SPEED, ENEMY_SPEED_FACTOR, PALETTE)
//             sprites.js (drawSprite) — uses 'balloom_*' sprites if sprite-artist delivers them

var DIRS = ['left', 'right', 'up', 'down'];

var DIR_DELTA = {
  left:  { dx: -1, dy:  0 },
  right: { dx:  1, dy:  0 },
  up:    { dx:  0, dy: -1 },
  down:  { dx:  0, dy:  1 }
};

var DIR_REVERSE = { left: 'right', right: 'left', up: 'down', down: 'up' };

// Axis-aligned rectangle overlap test
function rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// Return the tile coordinate at a pixel position (center of tile)
function pixelToTile(px) {
  return Math.floor(px / TILE);
}

// Check if a pixel-space bbox overlaps a solid tile in the grid
function overlapsWall(grid, bx, by, bw, bh) {
  // Check all four corners plus center
  var points = [
    { x: bx,          y: by },
    { x: bx + bw - 1, y: by },
    { x: bx,          y: by + bh - 1 },
    { x: bx + bw - 1, y: by + bh - 1 }
  ];
  for (var i = 0; i < points.length; i++) {
    var col = Math.floor(points[i].x / TILE);
    var row = Math.floor(points[i].y / TILE);
    if (row < 0 || row >= GRID_H || col < 0 || col >= GRID_W) return true;
    var t = grid[row][col];
    if (t === T_HARD || t === T_SOFT) return true;
  }
  return false;
}

// Check if a pixel-space bbox overlaps any bomb's tile
function overlapsBomb(bombs, bx, by, bw, bh) {
  for (var i = 0; i < bombs.length; i++) {
    var bomb = bombs[i];
    var bb = { x: bomb.tx * TILE, y: bomb.ty * TILE, w: TILE, h: TILE };
    if (bx < bb.x + bb.w && bx + bw > bb.x &&
        by < bb.y + bb.h && by + bh > bb.y) {
      return true;
    }
  }
  return false;
}

// Pick a legal direction for the enemy to move.
// "Legal" means the tile one step forward is T_EMPTY and not bomb-occupied.
// Avoids the reverse of current direction unless no other option.
function pickNewDir(x, y, currentDir, grid, bombs) {
  var legal = [];
  var reverse = DIR_REVERSE[currentDir];

  for (var i = 0; i < DIRS.length; i++) {
    var d = DIRS[i];
    var delta = DIR_DELTA[d];
    // Probe center of enemy one tile ahead
    var probeX = x + delta.dx * TILE;
    var probeY = y + delta.dy * TILE;
    // bbox for the probe position (28x28 centered)
    var bx = probeX - 14;
    var by = probeY - 14;
    if (!overlapsWall(grid, bx, by, 28, 28) &&
        !overlapsBomb(bombs, bx, by, 28, 28)) {
      legal.push(d);
    }
  }

  if (legal.length === 0) {
    // Completely boxed in — stay put (shouldn't happen in normal play)
    return currentDir;
  }

  // Prefer directions that are not the reverse
  var preferred = legal.filter(function(d) { return d !== reverse; });
  var choices = preferred.length > 0 ? preferred : legal;

  return choices[Math.floor(Math.random() * choices.length)];
}

// ---- Balloom constructor ----
// tileX, tileY: tile coordinates of spawn position
function Balloom(tileX, tileY) {
  // Store center position in pixels
  this.x = tileX * TILE + TILE / 2;
  this.y = tileY * TILE + TILE / 2;
  this.dir = DIRS[Math.floor(Math.random() * DIRS.length)];
  this.speed = PLAYER_BASE_SPEED * ENEMY_SPEED_FACTOR; // 32 px/sec
  this.walkFrame = 0;
  this._walkAccum = 0;   // accumulator for animation frame timing (seconds)
  this.alive = true;
  this.dead = false;
}

Balloom.prototype.update = function(dt, game) {
  if (!this.alive || this.dead) return;

  var grid = game.grid;
  var speed = this.speed;
  var delta = DIR_DELTA[this.dir];

  // --- Random direction change in open corridor (~5% per second) ---
  if (Math.random() < 0.05 * dt) {
    this.dir = pickNewDir(this.x, this.y, this.dir, grid, game.bombs);
    delta = DIR_DELTA[this.dir];
  }

  // --- Attempt movement ---
  var nx = this.x + delta.dx * speed * dt;
  var ny = this.y + delta.dy * speed * dt;

  // bbox: 28×28 centered on (nx, ny)
  var bx = nx - 14;
  var by = ny - 14;

  var hitWall = overlapsWall(grid, bx, by, 28, 28);
  var hitBomb = overlapsBomb(game.bombs, bx, by, 28, 28);

  if (hitWall || hitBomb) {
    // Back out: stay at current position, pick new direction
    this.dir = pickNewDir(this.x, this.y, this.dir, grid, game.bombs);
  } else {
    this.x = nx;
    this.y = ny;
  }

  // --- Animate walk frame ---
  this._walkAccum += dt;
  if (this._walkAccum >= 0.2) { // ~5fps walk animation
    this._walkAccum -= 0.2;
    this.walkFrame++;
  }

  // --- Check explosion overlap → die ---
  var myBbox = this.bbox();
  for (var i = 0; i < game.explosions.length; i++) {
    var exp = game.explosions[i];
    if (!exp.dead && rectsOverlap(myBbox, exp.bbox())) {
      this._die(game);
      return;
    }
  }

  // --- Check player overlap → kill player ---
  if (game.player && game.player.alive) {
    if (rectsOverlap(myBbox, game.player.bbox())) {
      if (typeof game._playerDie === 'function') {
        game._playerDie();
      } else {
        game.player.alive = false;
      }
    }
  }
};

Balloom.prototype._die = function(game) {
  this.alive = false;
  this.dead = true;
  game.playSfx('enemy_death');
  // Remove self from game.enemies
  var idx = game.enemies.indexOf(this);
  if (idx !== -1) game.enemies.splice(idx, 1);
};

Balloom.prototype.draw = function(ctx) {
  if (!this.alive) return;

  var frameIdx = this.walkFrame % 2; // 0 or 1
  var spriteName = 'balloom_' + this.dir + '_' + frameIdx;

  // Top-left pixel of the tile the entity occupies (x,y is center)
  var px = this.x - TILE / 2;
  var py = this.y - TILE / 2;

  // Try sprite-artist sprites first; fall back to pink blob
  var sprites = (typeof window !== 'undefined' && window.SPRITES) ? window.SPRITES : null;
  if (sprites && sprites[spriteName]) {
    drawSprite(ctx, sprites[spriteName], px, py);
  } else {
    // Fallback placeholder: pink blob
    ctx.fillStyle = '#ff80c0';
    ctx.beginPath();
    ctx.arc(this.x, this.y, TILE / 2 - 2, 0, Math.PI * 2);
    ctx.fill();
    // Direction indicator dot
    var dot = DIR_DELTA[this.dir];
    ctx.fillStyle = '#c040c0';
    ctx.beginPath();
    ctx.arc(this.x + dot.dx * 6, this.y + dot.dy * 6, 4, 0, Math.PI * 2);
    ctx.fill();
  }
};

Balloom.prototype.bbox = function() {
  // 28×28 centered on x, y
  return { x: this.x - 14, y: this.y - 14, w: 28, h: 28 };
};

// Expose on window for classic-script access
window.Balloom = Balloom;
