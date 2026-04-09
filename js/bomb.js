// ---- bomb.js — Bomb + Explosion entities ----
// Depends on: config.js (TILE, BOMB_TIMER_MS, EXPLOSION_DURATION_MS, T_EMPTY, T_HARD, T_SOFT, GRID_W, GRID_H)
// Exposes: Bomb, Explosion, placeBomb (window)

// Directions for cross-pattern raycast: right, left, down, up
var BOMB_DIRS = [
  { dx: 1, dy: 0, mid: 'h_mid', end: 'right_end' },
  { dx: -1, dy: 0, mid: 'h_mid', end: 'left_end'  },
  { dx: 0, dy: 1, mid: 'v_mid', end: 'down_end'   },
  { dx: 0, dy: -1, mid: 'v_mid', end: 'up_end'    }
];

// ---- Bomb ----

function Bomb(tileX, tileY, fireRange, owner) {
  this.tx        = tileX;
  this.ty        = tileY;
  this.x         = tileX * TILE;
  this.y         = tileY * TILE;
  this.fireRange = fireRange || 2;
  this.owner     = owner;  // Player instance; owner.bombsPlaced tracks slots used
  this.fuseMs    = BOMB_TIMER_MS;
  this.exploded  = false;
  this.dead      = false;
  this._pulseMs  = 0;
}

Bomb.prototype.update = function(dt, game) {
  this._pulseMs += dt * 1000;
  this.fuseMs   -= dt * 1000;
  if (this.fuseMs <= 0 && !this.exploded) {
    this.detonate(game);
  }
};

Bomb.prototype.draw = function(ctx) {
  var frame = (Math.floor(this._pulseMs / 250) % 2 === 0) ? 'bomb_0' : 'bomb_1';
  if (typeof drawSprite === 'function' && typeof SPRITES !== 'undefined' && SPRITES[frame]) {
    drawSprite(ctx, SPRITES[frame], this.x, this.y);
  } else {
    // Fallback: black circle with pulsing outline
    var pulse = (Math.floor(this._pulseMs / 250) % 2 === 0);
    ctx.fillStyle = '#222222';
    ctx.beginPath();
    ctx.arc(this.x + TILE / 2, this.y + TILE / 2, TILE / 2 - 4, 0, Math.PI * 2);
    ctx.fill();
    if (pulse) {
      ctx.strokeStyle = '#ff9020';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
  }
};

Bomb.prototype.bbox = function() {
  return { x: this.x + 4, y: this.y + 4, w: TILE - 8, h: TILE - 8 };
};

Bomb.prototype.detonate = function(game) {
  if (this.exploded) return;
  this.exploded = true;
  this.dead     = true;

  // Notify owner so it can decrement bombsInPlay and clean up _passableBombs
  if (this.owner && typeof this.owner.onBombExploded === 'function') {
    this.owner.onBombExploded(this);
  }

  // Center explosion
  game.explosions.push(new Explosion(this.tx, this.ty, 'center'));

  // Raycast in 4 directions
  for (var d = 0; d < BOMB_DIRS.length; d++) {
    var dir = BOMB_DIRS[d];
    for (var step = 1; step <= this.fireRange; step++) {
      var col = this.tx + dir.dx * step;
      var row = this.ty + dir.dy * step;

      // Stay in bounds
      if (row < 0 || row >= GRID_H || col < 0 || col >= GRID_W) break;

      var tile = game.grid[row][col];

      if (tile === T_HARD) {
        // Hard wall blocks — no explosion here
        break;
      }

      var isLast = (step === this.fireRange);
      var variant = isLast ? dir.end : dir.mid;

      if (tile === T_SOFT) {
        // Destroy soft block
        game.grid[row][col] = T_EMPTY;
        // Reveal any powerup hiding here
        _revealAt(game, col, row);
        // Add explosion segment at this tile, then stop outward
        game.explosions.push(new Explosion(col, row, variant));
        break;
      }

      // T_EMPTY — add explosion segment, continue
      game.explosions.push(new Explosion(col, row, variant));

      // Chain: if another bomb is on this tile, detonate it immediately
      for (var b = 0; b < game.bombs.length; b++) {
        var other = game.bombs[b];
        if (!other.exploded && other.tx === col && other.ty === row) {
          other.detonate(game);
          break;
        }
      }
    }
  }

  game.playSfx('explosion');
};

// Reveal powerup or door hidden at (col, row)
// Delegates to powerups-dev's canonical function when available
function _revealAt(game, col, row) {
  if (typeof revealItemAtTile === 'function') {
    revealItemAtTile(game, col, row);
    return;
  }
  // Fallback in case powerup.js isn't loaded yet
  if (game.powerups) {
    for (var i = 0; i < game.powerups.length; i++) {
      var pu = game.powerups[i];
      if (pu.tileX === col && pu.tileY === row) {
        pu.revealed = true;
      }
    }
  }
  if (game.door && game.door.tileX === col && game.door.tileY === row) {
    game.door.revealed = true;
  }
}

// ---- Explosion ----

function Explosion(tileX, tileY, variant) {
  this.tx      = tileX;
  this.ty      = tileY;
  this.x       = tileX * TILE;
  this.y       = tileY * TILE;
  this.variant = variant || 'center';
  this.timerMs = EXPLOSION_DURATION_MS;
  this.dead    = false;
}

Explosion.prototype.update = function(dt, game) {
  this.timerMs -= dt * 1000;
  if (this.timerMs <= 0) this.dead = true;
};

Explosion.prototype.draw = function(ctx) {
  var spriteKey = 'explosion_' + this.variant;
  if (typeof drawSprite === 'function' && typeof SPRITES !== 'undefined' && SPRITES[spriteKey]) {
    drawSprite(ctx, SPRITES[spriteKey], this.x, this.y);
  } else {
    // Fallback: orange fill with brighter center
    var progress = 1 - (this.timerMs / EXPLOSION_DURATION_MS);
    var alpha = 1 - progress * 0.6;
    ctx.globalAlpha = alpha;
    if (this.variant === 'center') {
      ctx.fillStyle = '#ffe040';
    } else {
      ctx.fillStyle = '#ff9020';
    }
    ctx.fillRect(this.x, this.y, TILE, TILE);
    ctx.globalAlpha = 1;
  }
};

Explosion.prototype.bbox = function() {
  return { x: this.x, y: this.y, w: TILE, h: TILE };
};

// ---- Public API ----

// Called by game.placeBomb; also exposed on window for direct use
function placeBomb(tx, ty, fireRange, owner) {
  if (!game) return null;
  var b = new Bomb(tx, ty, fireRange, owner);
  game.bombs.push(b);
  game.playSfx('bomb_place');
  return b;
}

window.placeBomb  = placeBomb;
window.Bomb       = Bomb;
window.Explosion  = Explosion;
