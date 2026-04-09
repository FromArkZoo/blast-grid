// player.js — Player entity
// Depends on: config.js (constants), input.js (input), sprites.js (drawSprite + SPRITES)
// Consumed by: game.js via new Player(tileX, tileY)
//
// Coordinate convention: this.x / this.y are pixel position of the
// TOP-LEFT corner of the player's tile area (matching stub and game.js).
// Corridor-snap math uses tile-aligned positions (multiples of TILE).

// Inset from tile edges for the collision bbox — gives the corridor-slip feel.
var PLAYER_INSET = 2;

// How quickly the player snaps to the perpendicular-axis corridor center (px/sec).
var SNAP_SPEED = 120;

function Player(tileX, tileY) {
  this.x = tileX * TILE;   // top-left pixel x
  this.y = tileY * TILE;   // top-left pixel y

  this.dir         = 'down'; // last-faced direction for sprite selection
  this.speedMult   = 1;
  this.maxBombs    = 1;
  this.fireRange   = 2;
  this.lives       = 3;
  this.bombsInPlay = 0;
  this.alive       = true;
  this.deathTimer  = 0;     // seconds remaining in death/flash animation

  // Walk animation state
  this._walkFrame = 0;      // 0 or 1
  this._walkAccum = 0;      // seconds accumulator for frame flip

  // Bombs the player can pass through (placed while still standing on them).
  // Entry removed once player's center leaves the bomb's tile.
  this._passableBombs = [];
}

// ---- bbox -------------------------------------------------------------------
Player.prototype.bbox = function() {
  return {
    x: this.x + PLAYER_INSET,
    y: this.y + PLAYER_INSET,
    w: TILE - PLAYER_INSET * 2,
    h: TILE - PLAYER_INSET * 2
  };
};

// ---- Respawn ----------------------------------------------------------------
Player.prototype.respawn = function() {
  this.x = TILE;
  this.y = TILE;
  this.bombsInPlay    = 0;
  this.alive          = true;
  this.deathTimer     = 0;
  this._passableBombs = [];
};

// Called by Bomb when it explodes (bombs-dev contract).
Player.prototype.onBombExploded = function(bomb) {
  this.bombsInPlay = Math.max(0, this.bombsInPlay - 1);
  var idx = this._passableBombs.indexOf(bomb);
  if (idx !== -1) this._passableBombs.splice(idx, 1);
};

// Called by game.js collision dispatch when player overlaps explosion or enemy.
// Delegates to game._playerDie() which is the authoritative death handler
// (manages g.lives, SFX, and game-over transition).
Player.prototype.die = function(game) {
  if (!this.alive) return;
  game._playerDie();
};

// ---- Update -----------------------------------------------------------------
Player.prototype.update = function(dt, game) {
  if (!this.alive) {
    this._tickDeath(dt, game);
    return;
  }
  this._handleMovement(dt, game);
  this._handleBombDrop(game);
  this._tickWalk(dt);
};

// ---- Movement ---------------------------------------------------------------
Player.prototype._handleMovement = function(dt, game) {
  var speed = PLAYER_BASE_SPEED * this.speedMult;
  var move  = speed * dt;

  var dx = 0, dy = 0;

  // 4-directional: later assignments below override earlier (right > left, down > up).
  if (input.up)    { dy = -move; this.dir = 'up';    }
  if (input.down)  { dy =  move; this.dir = 'down';  }
  if (input.left)  { dx = -move; this.dir = 'left';  }
  if (input.right) { dx =  move; this.dir = 'right'; }

  // Collapse diagonal: keep horizontal axis when both pressed.
  if (dx !== 0 && dy !== 0) dy = 0;

  if (dx === 0 && dy === 0) return;

  // Corridor snap on perpendicular axis
  if (dx !== 0) {
    // Moving horizontally → snap y toward nearest row top-edge (multiple of TILE)
    var targetY  = Math.round(this.y / TILE) * TILE;
    var diffY    = targetY - this.y;
    var stepY    = SNAP_SPEED * dt;
    this.y += Math.abs(diffY) <= stepY ? diffY : (diffY > 0 ? stepY : -stepY);
  }
  if (dy !== 0) {
    // Moving vertically → snap x toward nearest column left-edge (multiple of TILE)
    var targetX  = Math.round(this.x / TILE) * TILE;
    var diffX    = targetX - this.x;
    var stepX    = SNAP_SPEED * dt;
    this.x += Math.abs(diffX) <= stepX ? diffX : (diffX > 0 ? stepX : -stepX);
  }

  // Separate-axis collision moves
  if (dx !== 0) this._tryMove(dx, 0, game);
  if (dy !== 0) this._tryMove(0, dy, game);
};

Player.prototype._tryMove = function(dx, dy, game) {
  var nx = this.x + dx;
  var ny = this.y + dy;
  if (!this._hitGrid(nx, ny, game) && !this._hitBombs(nx, ny, game)) {
    this.x = nx;
    this.y = ny;
  }
};

Player.prototype._hitGrid = function(px, py, game) {
  // Test four inset corners of the bbox at proposed position.
  // +1/-1 nudge avoids spurious hits exactly on tile boundaries.
  var i = PLAYER_INSET + 1;
  var corners = [
    { cx: px + i,        cy: py + i        },
    { cx: px + TILE - i, cy: py + i        },
    { cx: px + i,        cy: py + TILE - i },
    { cx: px + TILE - i, cy: py + TILE - i }
  ];
  for (var k = 0; k < corners.length; k++) {
    var col = Math.floor(corners[k].cx / TILE);
    var row = Math.floor(corners[k].cy / TILE);
    if (col < 0 || col >= GRID_W || row < 0 || row >= GRID_H) return true;
    var t = game.grid[row][col];
    if (t === T_HARD || t === T_SOFT) return true;
  }
  return false;
};

Player.prototype._hitBombs = function(px, py, game) {
  var bboxL = px + PLAYER_INSET;
  var bboxR = px + TILE - PLAYER_INSET;
  var bboxT = py + PLAYER_INSET;
  var bboxB = py + TILE - PLAYER_INSET;

  // Player center (pre-move) for passability checks
  var cx = this.x + TILE / 2;
  var cy = this.y + TILE / 2;

  for (var k = 0; k < game.bombs.length; k++) {
    var bomb = game.bombs[k];
    var tL   = bomb.tileX * TILE;
    var tR   = tL + TILE;
    var tT   = bomb.tileY * TILE;
    var tB   = tT + TILE;

    var passIdx = this._passableBombs.indexOf(bomb);
    if (passIdx !== -1) {
      // Remove from passable set once the player center leaves the bomb tile
      if (cx < tL || cx > tR || cy < tT || cy > tB) {
        this._passableBombs.splice(passIdx, 1);
        // Fall through to normal AABB check below
      } else {
        continue; // still on the tile — no collision
      }
    }

    // AABB check
    if (bboxR > tL && bboxL < tR && bboxB > tT && bboxT < tB) {
      return true;
    }
  }
  return false;
};

// ---- Bomb drop --------------------------------------------------------------
Player.prototype._handleBombDrop = function(game) {
  if (!input._bombEdge) return;
  if (this.bombsInPlay >= this.maxBombs) return;

  // Tile under the player's center
  var tileX = Math.floor((this.x + TILE / 2) / TILE);
  var tileY = Math.floor((this.y + TILE / 2) / TILE);

  // Don't double-place on the same tile
  for (var k = 0; k < game.bombs.length; k++) {
    if (game.bombs[k].tileX === tileX && game.bombs[k].tileY === tileY) return;
  }

  var bomb = game.placeBomb(tileX, tileY, this.fireRange, this);
  this.bombsInPlay++;
  // bombs-dev's placeBomb should return the bomb object; guard for stub phase.
  if (bomb) {
    this._passableBombs.push(bomb);
  }
};

// ---- Death ------------------------------------------------------------------
Player.prototype._tickDeath = function(dt, game) {
  this.deathTimer -= dt;
  if (this.deathTimer > 0) return;

  // game._playerDie() already set STATE_GAME_OVER if lives hit 0.
  // Only respawn if game is still PLAYING.
  if (game.state === STATE_PLAYING) {
    this.respawn();
  }
};

// ---- Walk animation ---------------------------------------------------------
Player.prototype._tickWalk = function(dt) {
  var moving = input.up || input.down || input.left || input.right;
  if (!moving) {
    this._walkFrame = 0;
    this._walkAccum = 0;
    return;
  }
  this._walkAccum += dt;
  if (this._walkAccum >= 0.15) {  // flip frame every 150ms
    this._walkAccum -= 0.15;
    this._walkFrame = 1 - this._walkFrame;
  }
};

// ---- Draw -------------------------------------------------------------------
Player.prototype.draw = function(ctx) {
  if (!this.alive) {
    // Flash during death: skip rendering on alternating 100ms intervals
    if (Math.floor(this.deathTimer / 0.1) % 2 === 1) return;
  }

  var drawX = Math.round(this.x);
  var drawY = Math.round(this.y);

  // Use drawSprite when sprites.js is available
  if (typeof drawSprite === 'function' && typeof SPRITES !== 'undefined') {
    var key    = 'player_' + this.dir + '_' + this._walkFrame;
    var sprite = SPRITES[key] || SPRITES['player_down_0'];
    if (sprite) {
      drawSprite(ctx, sprite, drawX, drawY);
      return;
    }
  }

  // Fallback: yellow rectangle with a small direction dot
  ctx.fillStyle = '#ffe040';
  ctx.fillRect(drawX + 2, drawY + 2, TILE - 4, TILE - 4);
  ctx.fillStyle = '#804000';
  var dots = { down: [12, 22], up: [12, 6], left: [6, 14], right: [22, 14] };
  var dot = dots[this.dir];
  ctx.fillRect(drawX + dot[0] - 2, drawY + dot[1] - 2, 4, 4);
};
