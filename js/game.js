// ---- Shared entity contract (all entities implement) ----
// entity.update(dt, game)  -> mutate self, push events if needed
// entity.draw(ctx)          -> draw at its pixel position
// entity.bbox()             -> {x, y, w, h} in pixels (for collision)
//
// Central game object (passed into update, available to all systems):
//   game = {
//     grid,                       // GRID_H x GRID_W of T_EMPTY|T_HARD|T_SOFT
//     player,                     // Player instance
//     enemies: [Balloom, ...],
//     bombs: [Bomb, ...],
//     explosions: [Explosion, ...],
//     powerups: [PowerUp, ...],
//     door,                       // ExitDoor instance (visible flag)
//     state,                      // STATE_TITLE | STATE_PLAYING | STATE_STAGE_CLEAR | STATE_GAME_OVER
//     lives, score, timeLeft,     // number
//     placeBomb(tx, ty, fire, owner),  // API player.js calls
//     playSfx(name),              // sounds.js
//   }

// ---- Game state machine + main loop ----

// AABB overlap test used by collision dispatch
function _bboxOverlap(a, b) {
  return a.x < b.x + b.w &&
         a.x + a.w > b.x &&
         a.y < b.y + b.h &&
         a.y + a.h > b.y;
}

var game = null;

function createGame(canvas) {
  var ctx = canvas.getContext('2d');

  var g = {
    ctx: ctx,
    canvas: canvas,
    grid: null,
    player: null,
    enemies: [],
    bombs: [],
    explosions: [],
    powerups: [],
    door: null,
    state: STATE_TITLE,
    lives: 3,
    score: 0,
    timeLeft: 180,      // seconds (3:00)
    _timerAccum: 0,
    _lastTime: null,

    // ---- API: place a bomb, return the Bomb instance ----
    placeBomb: function(tx, ty, fire, owner) {
      if (typeof Bomb === 'undefined') return null;
      // Prevent double-placing on same tile
      for (var k = 0; k < g.bombs.length; k++) {
        if (g.bombs[k].tx === tx && g.bombs[k].ty === ty) return null;
      }
      var b = new Bomb(tx, ty, fire, owner);
      g.bombs.push(b);
      g.playSfx('bomb_place');
      return b;
    },

    // ---- API: play a sound ----
    playSfx: function(name) {
      if (typeof playSfx === 'function') {
        playSfx(name);
      }
    },

    // ---- Build level and start a new game ----
    startGame: function() {
      var levelData;

      // powerup.js exposes buildLevel which returns fully-constructed entities
      if (typeof buildLevel === 'function') {
        levelData = buildLevel(SEED);
        g.grid     = levelData.grid;
        g.powerups = levelData.powerups || [];
        g.door     = levelData.door     || null;
      } else if (typeof generateStage1_1 === 'function') {
        // Fallback: construct entities manually from raw level data
        var raw = generateStage1_1(SEED);
        g.grid = raw.grid;
        g.powerups = [];
        if (raw.powerups && typeof PowerUp !== 'undefined') {
          for (var pi = 0; pi < raw.powerups.length; pi++) {
            var pd = raw.powerups[pi];
            g.powerups.push(new PowerUp(pd.tileX, pd.tileY, pd.type));
          }
        }
        g.door = null;
        if (raw.doorPosition && typeof ExitDoor !== 'undefined') {
          g.door = new ExitDoor(raw.doorPosition.tileX, raw.doorPosition.tileY);
        }
        levelData = raw;
      } else {
        // Last resort: empty flat grid
        g.grid = [];
        for (var r = 0; r < GRID_H; r++) {
          g.grid[r] = [];
          for (var c = 0; c < GRID_W; c++) {
            g.grid[r][c] = T_EMPTY;
          }
        }
        g.powerups = [];
        g.door     = null;
        levelData  = { enemySpawns: [] };
      }

      // ---- Spawn player at tile (1,1) ----
      if (typeof Player !== 'undefined') {
        g.player = new Player(1, 1);
      } else {
        g.player = null;
      }

      // ---- Spawn 3 Ballooms ----
      g.enemies = [];
      if (typeof Balloom !== 'undefined') {
        var spawns = (levelData.enemySpawns && levelData.enemySpawns.length >= 3)
          ? levelData.enemySpawns
          : [
              { x: 10 * TILE + TILE / 2, y: 9 * TILE + TILE / 2 },
              { x: 11 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 },
              { x: 10 * TILE + TILE / 2, y: 1 * TILE + TILE / 2 }
            ];
        for (var ei = 0; ei < 3; ei++) {
          // enemySpawns stores pixel centers; Balloom constructor takes tile coords
          var tileX = Math.floor(spawns[ei].x / TILE);
          var tileY = Math.floor(spawns[ei].y / TILE);
          g.enemies.push(new Balloom(tileX, tileY));
        }
      }

      g.bombs      = [];
      g.explosions = [];
      g.lives      = 3;
      g.score      = 0;
      g.timeLeft   = 180;
      g._timerAccum = 0;
      g.state      = STATE_PLAYING;
    },

    // ---- Respawn player after life-loss (keep power-ups) ----
    respawnPlayer: function() {
      if (typeof Player !== 'undefined') {
        var prev = g.player;
        g.player = new Player(1, 1);
        // Preserve power-up stats across the respawn
        if (prev) {
          g.player.maxBombs  = prev.maxBombs;
          g.player.fireRange = prev.fireRange;
          g.player.speedMult = prev.speedMult;
          g.player.lives     = prev.lives;
        }
      }
      g.bombs      = [];
      g.explosions = [];
    },

    // ---- Called when the player dies (by enemy, explosion, or timeout) ----
    // player.js also calls game.state = STATE_GAME_OVER directly when lives hit 0.
    // We centralise the sfx + respawn logic here so enemies can call it too.
    _playerDie: function() {
      if (!g.player || !g.player.alive) return;
      g.playSfx('player_death');
      g.player.alive      = false;
      g.player.deathTimer = 1.0;
      g.lives--;
      if (g.lives <= 0) {
        g.state = STATE_GAME_OVER;
        g.playSfx('game_over');
      }
      // Actual respawn happens in player._tickDeath (after deathTimer expires)
      // but we keep lives on the game object as the authoritative count.
    },

    // ---- Main update ----
    update: function(dt) {
      if (g.state === STATE_TITLE) {
        // Check Enter to start
        if (input && input._startEdge) {
          g.startGame();
        }
        if (input) input.clearEdges();
        return;
      }

      if (g.state === STATE_STAGE_CLEAR || g.state === STATE_GAME_OVER) {
        if (input && input._startEdge) {
          g.state = STATE_TITLE;
        }
        if (input) input.clearEdges();
        return;
      }

      if (g.state !== STATE_PLAYING) return;

      // ---- Countdown timer ----
      g._timerAccum += dt;
      if (g._timerAccum >= 1) {
        g._timerAccum -= 1;
        g.timeLeft = Math.max(0, g.timeLeft - 1);
        if (g.timeLeft === 0) {
          g._playerDie();
        }
      }

      // ---- Update entities ----
      if (g.player) g.player.update(dt, g);

      // game.lives is authoritative — player.js delegates to game._playerDie()

      // Iterate over a snapshot: Balloom._die() may splice itself out of g.enemies
      // mid-loop, so we snapshot first then sweep dead entries afterward.
      var _enemies = g.enemies.slice();
      for (var i = 0; i < _enemies.length; i++) {
        if (!_enemies[i].dead) _enemies[i].update(dt, g);
      }
      // Sweep: remove any enemies marked dead (by self-splice or update)
      for (var i = g.enemies.length - 1; i >= 0; i--) {
        if (g.enemies[i].dead) g.enemies.splice(i, 1);
      }

      for (var i = g.bombs.length - 1; i >= 0; i--) {
        g.bombs[i].update(dt, g);
        if (g.bombs[i].dead) g.bombs.splice(i, 1);
      }

      for (var i = g.explosions.length - 1; i >= 0; i--) {
        g.explosions[i].update(dt, g);
        if (g.explosions[i].dead) g.explosions.splice(i, 1);
      }

      for (var i = g.powerups.length - 1; i >= 0; i--) {
        if (typeof g.powerups[i].update === 'function') {
          g.powerups[i].update(dt, g);
        }
        if (g.powerups[i].dead) g.powerups.splice(i, 1);
      }

      if (g.door && typeof g.door.update === 'function') {
        g.door.update(dt, g);
      }

      // ---- Collision dispatch (task #16) ----
      g._collide();

      // ---- Clear input edges ----
      if (input) input.clearEdges();
    },

    // ---- Collision dispatch ----
    // Handles all cross-system collisions not already covered by entity update():
    //   - player × explosion  → player dies
    //   - player × enemy      → player dies  (Balloom.update also does this; guard prevents double-kill)
    //   - enemy  × explosion  → enemy dies   (Balloom.update handles; kept here as safety net)
    //   - player × powerup    → handled by PowerUp.update
    //   - player × door       → handled by ExitDoor.update
    //   - enemy score         → award 100 pts per enemy killed this frame
    _collide: function() {
      if (g.state !== STATE_PLAYING) return;
      if (!g.player || !g.player.alive) return;

      var pb = g.player.bbox();

      // ---- Player × explosion ----
      for (var ei = 0; ei < g.explosions.length; ei++) {
        var exp = g.explosions[ei];
        if (exp.dead) continue;
        if (_bboxOverlap(pb, exp.bbox())) {
          g._playerDie();
          return;  // stop further collision checks this frame
        }
      }

      // ---- Player × enemy (safety net — Balloom.update also fires this) ----
      for (var i = 0; i < g.enemies.length; i++) {
        var enemy = g.enemies[i];
        if (!enemy.alive || enemy.dead) continue;
        if (_bboxOverlap(pb, enemy.bbox())) {
          g._playerDie();
          return;
        }
      }
    },

    // ---- Score: called by enemy when it dies ----
    awardEnemyKill: function() {
      g.score += 100;
    },

    // ---- Render ----
    render: function() {
      var ctx = g.ctx;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      if (g.state === STATE_TITLE) {
        if (typeof drawTitleScreen === 'function') drawTitleScreen(ctx);
        return;
      }

      if (g.state === STATE_STAGE_CLEAR) {
        if (typeof drawStageClearScreen === 'function') drawStageClearScreen(ctx, g);
        return;
      }

      if (g.state === STATE_GAME_OVER) {
        if (typeof drawGameOverScreen === 'function') drawGameOverScreen(ctx, g);
        return;
      }

      // STATE_PLAYING: playfield then HUD on top
      if (typeof drawGame === 'function') {
        drawGame(ctx, g);
      }

      if (typeof drawHUD === 'function') {
        drawHUD(ctx, g);
      }
    },

    // ---- RAF loop ----
    loop: function(timestamp) {
      if (g._lastTime === null) g._lastTime = timestamp;
      var dt = (timestamp - g._lastTime) / 1000;
      g._lastTime = timestamp;

      // Cap dt — prevents spiral of death after tab switch or debugger pause
      if (dt > 0.1) dt = 0.1;

      g.update(dt);
      g.render();

      requestAnimationFrame(g.loop.bind(g));
    },

    start: function() {
      requestAnimationFrame(g.loop.bind(g));
    }
  };

  return g;
}
