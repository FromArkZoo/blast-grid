// hud.js — HUD bar + title/clear/gameover screens
// Globals: drawHUD(ctx, game), drawTitleScreen(ctx),
//          drawStageClearScreen(ctx, game), drawGameOverScreen(ctx, game)
// Note: timeLeft in game is in SECONDS (see game.js: timeLeft: 180)

// ---- Blink state ----
var _hudBlinkTimer = 0;
var _hudBlinkVisible = true;

function _hudTickBlink() {
  _hudBlinkTimer += 1 / 60;
  if (_hudBlinkTimer >= 0.5) {
    _hudBlinkTimer -= 0.5;
    _hudBlinkVisible = !_hudBlinkVisible;
  }
}

// ---- Font / draw helpers ----

function _setFont(ctx, size, bold) {
  ctx.font = (bold ? 'bold ' : '') + size + 'px "Courier New", Courier, monospace';
  ctx.textBaseline = 'top';
  ctx.textAlign = 'left';
  ctx.imageSmoothingEnabled = false;
}

// Pixel-shadow text: draw shadow offset by 1px then fill on top
function _drawText(ctx, text, x, y, fill, shadow) {
  ctx.fillStyle = shadow || '#000000';
  ctx.fillText(text, x + 1, y + 1);
  ctx.fillStyle = fill;
  ctx.fillText(text, x, y);
}

// Centre-align helper: returns x so text is centred in [0, W]
function _centreX(ctx, text, W) {
  return Math.floor((W - ctx.measureText(text).width) / 2);
}

// Format total seconds -> "M:SS"
function _formatTime(totalSeconds) {
  var s = Math.max(0, Math.floor(totalSeconds));
  var m = Math.floor(s / 60);
  var sec = s % 60;
  return m + ':' + (sec < 10 ? '0' : '') + sec;
}

// ---- HUD bar (top HUD_H pixels of canvas, drawn every frame during play) ----

function drawHUD(ctx, game) {
  _hudTickBlink();

  var W = CANVAS_W;
  var H = HUD_H;

  // Background
  ctx.fillStyle = '#0d0d1a';
  ctx.fillRect(0, 0, W, H);

  // Bottom separator
  ctx.fillStyle = '#334466';
  ctx.fillRect(0, H - 2, W, 2);

  var player   = game.player;
  var lives    = game.lives  !== undefined ? game.lives  : 3;
  var maxBombs = player && player.maxBombs  !== undefined ? player.maxBombs  : 1;
  var fireRange= player && player.fireRange !== undefined ? player.fireRange : 2;
  var timeLeft = game.timeLeft !== undefined ? game.timeLeft : 0;
  var timeStr  = _formatTime(timeLeft);
  var timeRed  = timeLeft < 30;

  // Four columns
  var col = [6, Math.floor(W * 0.26), Math.floor(W * 0.52), Math.floor(W * 0.74)];
  var labelY = 5;
  var valueY = 19;

  // Labels (small)
  _setFont(ctx, 8, false);
  ctx.fillStyle = '#7777aa';
  ctx.fillText('LIVES', col[0], labelY);
  ctx.fillText('BOMBS', col[1], labelY);
  ctx.fillText('FIRE',  col[2], labelY);
  ctx.fillText('TIME',  col[3], labelY);

  // Values (bigger, with shadow)
  _setFont(ctx, 11, true);
  _drawText(ctx, '\u2665\xd7' + lives,  col[0], valueY, '#ff6080');
  _drawText(ctx, '' + maxBombs,         col[1], valueY, '#ffdd44');
  _drawText(ctx, '' + fireRange,        col[2], valueY, '#ff8820');
  _drawText(ctx, timeStr,               col[3], valueY, timeRed ? '#ff3333' : '#44ff88');

  // Flash red tint over TIME area when < 30 s
  if (timeRed && _hudBlinkVisible) {
    ctx.fillStyle = 'rgba(255,0,0,0.10)';
    ctx.fillRect(col[3] - 2, 0, W - col[3] + 2, H - 2);
  }
}

// ---- Title Screen ----

function drawTitleScreen(ctx) {
  _hudTickBlink();

  var W = CANVAS_W;
  var H = CANVAS_H;

  ctx.fillStyle = '#000011';
  ctx.fillRect(0, 0, W, H);

  // Decorative border
  ctx.strokeStyle = '#223355';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.lineWidth = 1;

  // Title
  _setFont(ctx, 18, true);
  var title = 'SUPER BOMBERMAN';
  _drawText(ctx, title, _centreX(ctx, title, W), 80, '#ffdd44', '#884400');

  // Stage label
  _setFont(ctx, 12, true);
  var stage = 'STAGE  1-1';
  _drawText(ctx, stage, _centreX(ctx, stage, W), 116, '#44ddff', '#004466');

  // Copyright hint
  _setFont(ctx, 8, false);
  var copy = '~ HUDSON SOFT  1993 ~';
  ctx.fillStyle = '#2a2a44';
  ctx.fillText(copy, _centreX(ctx, copy, W), 140);

  // Blinking PRESS ENTER
  if (_hudBlinkVisible) {
    _setFont(ctx, 10, true);
    var prompt = 'PRESS  ENTER  TO  START';
    _drawText(ctx, prompt, _centreX(ctx, prompt, W), H - 64, '#ffffff', '#333333');
  }

  // Controls
  _setFont(ctx, 8, false);
  ctx.fillStyle = '#445566';
  var ctrl = 'ARROWS / WASD: MOVE     SPACE: BOMB';
  ctx.fillText(ctrl, _centreX(ctx, ctrl, W), H - 38);
}

// ---- Stage Clear Screen ----

function drawStageClearScreen(ctx, game) {
  _hudTickBlink();

  var W = CANVAS_W;
  var H = CANVAS_H;

  ctx.fillStyle = '#001100';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#225522';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.lineWidth = 1;

  // Heading
  _setFont(ctx, 20, true);
  var heading = 'STAGE CLEAR!';
  _drawText(ctx, heading, _centreX(ctx, heading, W), 88, '#44ff44', '#006600');

  // Stats
  _setFont(ctx, 10, true);
  var lives   = game && game.lives    !== undefined ? game.lives    : 0;
  var score   = game && game.score    !== undefined ? game.score    : 0;
  var timeStr = _formatTime(game && game.timeLeft !== undefined ? game.timeLeft : 0);

  ctx.fillStyle = '#99ffaa';
  var l = 'LIVES REMAINING:  ' + lives;
  ctx.fillText(l, _centreX(ctx, l, W), 136);

  var t = 'TIME REMAINING:   ' + timeStr;
  ctx.fillText(t, _centreX(ctx, t, W), 154);

  var sc = 'SCORE:            ' + score;
  ctx.fillText(sc, _centreX(ctx, sc, W), 172);

  // Blinking prompt
  if (_hudBlinkVisible) {
    _setFont(ctx, 10, true);
    var prompt = 'PRESS  ENTER  TO  PLAY  AGAIN';
    _drawText(ctx, prompt, _centreX(ctx, prompt, W), H - 64, '#ffffff', '#333333');
  }
}

// ---- Game Over Screen ----

function drawGameOverScreen(ctx, game) {
  _hudTickBlink();

  var W = CANVAS_W;
  var H = CANVAS_H;

  ctx.fillStyle = '#110000';
  ctx.fillRect(0, 0, W, H);

  ctx.strokeStyle = '#441111';
  ctx.lineWidth = 2;
  ctx.strokeRect(4, 4, W - 8, H - 8);
  ctx.lineWidth = 1;

  // Heading
  _setFont(ctx, 22, true);
  var heading = 'GAME OVER';
  _drawText(ctx, heading, _centreX(ctx, heading, W), 96, '#ff3333', '#660000');

  // Flavour
  _setFont(ctx, 8, false);
  ctx.fillStyle = '#ddaaaa';
  var flavour = 'YOU  WERE  BLOWN  UP';
  ctx.fillText(flavour, _centreX(ctx, flavour, W), 136);

  // Blinking prompt
  if (_hudBlinkVisible) {
    _setFont(ctx, 10, true);
    var prompt = 'PRESS  ENTER  TO  TRY  AGAIN';
    _drawText(ctx, prompt, _centreX(ctx, prompt, W), H - 64, '#ffffff', '#333333');
  }
}
