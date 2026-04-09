// ---- powerup.js — PowerUp + ExitDoor entities + reveal + factory ----
// Depends on: config.js (TILE, STATE_STAGE_CLEAR), sprites.js (drawSprite), level.js (generateStage1_1)
// Exposes (on window): PowerUp, ExitDoor, createPowerUps, createDoor, revealItemAtTile, buildLevel

// ---- Helpers ----

function _rectsOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

// ---- PowerUp ----

function PowerUp(tileX, tileY, type) {
  this.tileX = tileX;
  this.tileY = tileY;
  // alias for any code using tx/ty
  this.tx = tileX;
  this.ty = tileY;
  this.x = tileX * TILE;
  this.y = tileY * TILE;
  this.type = type; // 'bomb' | 'fire' | 'speed'
  this.revealed = false;
  this.dead = false;
}

PowerUp.prototype.update = function(dt, game) {
  if (!this.revealed) return;
  if (!game.player) return;

  var pb = game.player.bbox();
  var mb = this.bbox();
  if (_rectsOverlap(pb, mb)) {
    this._apply(game.player);
    this.dead = true;
    game.playSfx('pickup');
  }
};

PowerUp.prototype._apply = function(player) {
  if (this.type === 'bomb') {
    player.maxBombs = Math.min(10, player.maxBombs + 1);
  } else if (this.type === 'fire') {
    player.fireRange = Math.min(10, player.fireRange + 1);
  } else if (this.type === 'speed') {
    // speedMult may not exist on older player stubs — default to 1.0
    if (typeof player.speedMult !== 'number') player.speedMult = 1.0;
    player.speedMult = Math.min(2.0, player.speedMult + 0.2);
  }
};

PowerUp.prototype.draw = function(ctx) {
  if (!this.revealed) return;

  var spriteName = 'powerup_' + this.type;
  if (typeof drawSprite === 'function' && typeof SPRITES !== 'undefined' && SPRITES[spriteName]) {
    drawSprite(ctx, SPRITES[spriteName], this.x, this.y);
  } else {
    // Fallback colored square
    var colors = { bomb: '#222222', fire: '#ff9020', speed: '#40a0ff' };
    ctx.fillStyle = colors[this.type] || '#ffffff';
    ctx.fillRect(this.x + 4, this.y + 4, TILE - 8, TILE - 8);
    // Small label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    var label = this.type === 'bomb' ? 'B' : this.type === 'fire' ? 'F' : 'S';
    ctx.fillText(label, this.x + TILE / 2, this.y + TILE / 2);
  }
};

PowerUp.prototype.bbox = function() {
  return { x: this.x, y: this.y, w: TILE, h: TILE };
};

// ---- ExitDoor ----

function ExitDoor(tileX, tileY) {
  this.tileX = tileX;
  this.tileY = tileY;
  this.tx = tileX;
  this.ty = tileY;
  this.x = tileX * TILE;
  this.y = tileY * TILE;
  this.revealed = false;
  this.dead = false;
}

ExitDoor.prototype.update = function(dt, game) {
  if (!this.revealed) return;
  if (!game.player) return;
  if (game.enemies.length !== 0) return;

  var pb = game.player.bbox();
  var db = this.bbox();
  if (_rectsOverlap(pb, db)) {
    game.state = STATE_STAGE_CLEAR;
    game.playSfx('stage_clear');
  }
};

ExitDoor.prototype.draw = function(ctx) {
  if (!this.revealed) return;

  if (typeof drawSprite === 'function' && typeof SPRITES !== 'undefined' && SPRITES['door']) {
    drawSprite(ctx, SPRITES['door'], this.x, this.y);
  } else {
    // Fallback magenta door
    ctx.fillStyle = '#c040ff';
    ctx.fillRect(this.x + 2, this.y + 2, TILE - 4, TILE - 4);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 9px monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('EXIT', this.x + TILE / 2, this.y + TILE / 2);
  }
};

ExitDoor.prototype.bbox = function() {
  return { x: this.x + 2, y: this.y + 2, w: TILE - 4, h: TILE - 4 };
};

// ---- Reveal mechanism ----
// Called by bomb.js after destroying a soft wall at tile (tx, ty).

function revealItemAtTile(game, tx, ty) {
  for (var i = 0; i < game.powerups.length; i++) {
    var p = game.powerups[i];
    if (p.tileX === tx && p.tileY === ty) {
      p.revealed = true;
    }
  }
  if (game.door && game.door.tileX === tx && game.door.tileY === ty) {
    game.door.revealed = true;
  }
}

// ---- Factories ----

function createPowerUps(level) {
  return level.powerups.map(function(pu) {
    return new PowerUp(pu.tileX, pu.tileY, pu.type);
  });
}

function createDoor(level) {
  return new ExitDoor(level.doorPosition.tileX, level.doorPosition.tileY);
}

// ---- buildLevel: combines level data + entity construction ----
// Called by game.js startGame. Returns {grid, playerSpawn, enemySpawns, powerups, door}.

function buildLevel(seed) {
  var levelData = generateStage1_1(seed);
  return {
    grid: levelData.grid,
    playerSpawn: levelData.playerSpawn,
    enemySpawns: levelData.enemySpawns,
    powerups: createPowerUps(levelData),
    door: createDoor(levelData)
  };
}

// Expose on window for classic-script access
window.PowerUp = PowerUp;
window.ExitDoor = ExitDoor;
window.revealItemAtTile = revealItemAtTile;
window.createPowerUps = createPowerUps;
window.createDoor = createDoor;
window.buildLevel = buildLevel;
