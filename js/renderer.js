// renderer.js — canvas drawing pipeline
// Owned by: renderer-dev
// Exposes: drawGame(ctx, game) — called by game.js render loop for STATE_PLAYING
// Depends on: config.js, sprites.js (drawSprite), hud.js (drawHUD) — all loaded before/after via index.html

// Z-order layers (drawn bottom to top):
//   1. Tile grid (floor, hard_wall, soft_wall)
//   2. Door (behind player/enemies)
//   3. Power-ups
//   4. Bombs
//   5. Enemies
//   6. Player
//   7. Explosions (topmost playfield layer)

function drawGame(ctx, game) {
  if (!game.grid) return;

  ctx.imageSmoothingEnabled = false;

  // --- Layer 1: Tile grid ---
  for (var row = 0; row < GRID_H; row++) {
    for (var col = 0; col < GRID_W; col++) {
      var px = col * TILE;
      var py = HUD_H + row * TILE;
      var tile = game.grid[row][col];

      if (tile === T_HARD) {
        drawSprite(ctx, 'hard_wall', px, py);
      } else if (tile === T_SOFT) {
        // Draw floor beneath so transparent sprite pixels show grass
        drawSprite(ctx, 'floor', px, py);
        drawSprite(ctx, 'soft_wall', px, py);
      } else {
        drawSprite(ctx, 'floor', px, py);
      }
    }
  }

  // --- Layer 2: Exit door (behind all entities) ---
  // ExitDoor.draw() returns early if !this.revealed — no guard needed here
  if (game.door) {
    _drawEntity(ctx, game.door);
  }

  // --- Layer 3: Power-ups ---
  if (game.powerups) {
    for (var i = 0; i < game.powerups.length; i++) {
      _drawEntity(ctx, game.powerups[i]);
    }
  }

  // --- Layer 4: Bombs ---
  if (game.bombs) {
    for (var i = 0; i < game.bombs.length; i++) {
      _drawEntity(ctx, game.bombs[i]);
    }
  }

  // --- Layer 5: Enemies ---
  if (game.enemies) {
    for (var i = 0; i < game.enemies.length; i++) {
      _drawEntity(ctx, game.enemies[i]);
    }
  }

  // --- Layer 6: Player ---
  if (game.player) {
    _drawEntity(ctx, game.player);
  }

  // --- Layer 7: Explosions (over everything on playfield) ---
  if (game.explosions) {
    for (var i = 0; i < game.explosions.length; i++) {
      _drawEntity(ctx, game.explosions[i]);
    }
  }
}

// Draw a single entity. Entities expose draw(ctx) per the shared contract.
// Entity pixel coords (this.x/this.y) are relative to the playfield (no HUD offset),
// so we translate the canvas down by HUD_H before calling draw, then restore.
// Fallback: if entity has .sprite + .x/.y, use drawSprite directly.
function _drawEntity(ctx, entity) {
  if (typeof entity.draw === 'function') {
    ctx.save();
    ctx.translate(0, HUD_H);
    entity.draw(ctx);
    ctx.restore();
  } else if (entity.sprite) {
    drawSprite(ctx, entity.sprite, entity.x, entity.y + HUD_H);
  }
}
