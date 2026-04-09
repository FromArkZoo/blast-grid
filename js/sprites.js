// sprites.js — pixel-art sprite definitions + drawSprite helper
// Sprite format: array of 16 strings, each 16 chars.
// Each char maps to a PALETTE key ('.' = transparent).
// drawSprite renders each char as a 2×2 px block (16*2 = 32px tile).

// ---- HELPER ----

// Cache parsed palette lookups per sprite for speed
var _spriteColorCache = {};

function drawSprite(ctx, nameOrArray, px, py) {
  // Accept either a sprite name string or a sprite array directly
  var sprite, cacheKey;
  if (Array.isArray(nameOrArray)) {
    sprite   = nameOrArray;
    cacheKey = null;  // no cache for anonymous arrays
  } else {
    sprite   = SPRITES[nameOrArray];
    cacheKey = nameOrArray;
  }
  if (!sprite) return;

  var cache = cacheKey ? _spriteColorCache[cacheKey] : null;
  if (cacheKey && !cache) {
    cache = {};
    for (var r = 0; r < sprite.length; r++) {
      for (var c = 0; c < sprite[r].length; c++) {
        var ch = sprite[r][c];
        if (!(ch in cache)) {
          cache[ch] = PALETTE[ch] !== undefined ? PALETTE[ch] : null;
        }
      }
    }
    _spriteColorCache[cacheKey] = cache;
  }

  for (var row = 0; row < sprite.length; row++) {
    var line = sprite[row];
    for (var col = 0; col < line.length; col++) {
      var ch = line[col];
      var color = cache ? cache[ch] : (PALETTE[ch] !== undefined ? PALETTE[ch] : null);
      if (color === null || color === undefined) continue;
      ctx.fillStyle = color;
      ctx.fillRect(px + col * 2, py + row * 2, 2, 2);
    }
  }
}

// ---- SPRITE DEFINITIONS ----
// All sprites are 16 rows × 16 cols of palette chars.

var SPRITES = {};

// --- FLOOR TILE ---
// Bright green grass with a subtle 4×4 checker pattern
SPRITES['floor'] = [
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
  'GDGDGDGDGDGDGDGD',
  'DGGDGGDGGDGGDGGD',
];

// --- HARD WALL ---
// Grey stone block — bevelled: lighter top/left edges, darker bottom/right
SPRITES['hard_wall'] = [
  'SSSSSSSSSSSSSSSS',
  'SWWWWWWWWWWWWWsS',
  'SWSSSSSSSSSSWsS.',
  'SWSSSSSSSSSWSsS.',
  'SWSSSSSSSSWSssS.',
  'SWSSSSSSSWSsssS.',
  'SWSSSSSSWSssssS.',
  'SWSSSSSWSsssssS.',
  'SWSSSSWSssssssS.',
  'SWSSSWSsssssssS.',
  'SWSSWSssssssssS.',
  'SWSWSsssssssssS.',
  'SWWsssssssssssS.',
  'SsssssssssssssS.',
  'SSSSSSSSSSSSSS..',
  '................',
];

// --- SOFT WALL (destructible brown brick) ---
SPRITES['soft_wall'] = [
  'BBBBBBBBBBBBBBBB',
  'BNNNnBNNNnBNNNnB',
  'BNNNnBNNNnBNNNnB',
  'BNNNnBNNNnBNNNnB',
  'BnnnnnnnnnnnnnnB',
  'BnnBNNNnBNNNnBnB',
  'BnnBNNNnBNNNnBnB',
  'BnnBNNNnBNNNnBnB',
  'BnnnnnnnnnnnnnnB',
  'BNNNnBNNNnBNNNnB',
  'BNNNnBNNNnBNNNnB',
  'BNNNnBNNNnBNNNnB',
  'BnnnnnnnnnnnnnnB',
  'BNNNnBNNNnBNNNnB',
  'BNNNnBNNNnBNNNnB',
  'BBBBBBBBBBBBBBBB',
];

// ---- PLAYER SPRITES ----
// White Bomberman with round helmet, blue accents, black outline.
// Facing DOWN (idle + walk frame)

SPRITES['player_down_0'] = [
  '....BBBBBBBB....',
  '...BWWWWWWWBb...',
  '..BWWWWWWWWWB...',
  '..BWBBWWBBWwB...',
  '..BWBBWWBBWWB...',
  '..BWWWWWWWWWB...',
  '..BWWBBBBWWWB...',
  '...BWWWWWWBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '..BCCB..BCCB....',
  '..BCCB..BCCB....',
  '..BWWB..BWWB....',
  '..BBBB..BBBB....',
];

SPRITES['player_down_1'] = [
  '....BBBBBBBB....',
  '...BWWWWWWWBb...',
  '..BWWWWWWWWWB...',
  '..BWBBWWBBWwB...',
  '..BWBBWWBBWWB...',
  '..BWWWWWWWWWB...',
  '..BWWBBBBWWWB...',
  '...BWWWWWWBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '.BCCB....BBBB...',
  '.BCCB...........',
  '.BWWB...........',
  '.BBBB...........',
];

SPRITES['player_up_0'] = [
  '....BBBBBBBB....',
  '...BCCCCCCCCB...',
  '..BCCCCCCCCCB...',
  '..BCBBCCBBCB....',
  '..BCCBBCCBBCB...',
  '..BCCCCCCCCCB...',
  '..BCCBBBBCCCB...',
  '...BCCCCCCBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '..BCCB..BCCB....',
  '..BCCB..BCCB....',
  '..BWWB..BWWB....',
  '..BBBB..BBBB....',
];

SPRITES['player_up_1'] = [
  '....BBBBBBBB....',
  '...BCCCCCCCCB...',
  '..BCCCCCCCCCB...',
  '..BCBBCCBBCB....',
  '..BCCBBCCBBCB...',
  '..BCCCCCCCCCB...',
  '..BCCBBBBCCCB...',
  '...BCCCCCCBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '.BCCB....BBBB...',
  '.BCCB...........',
  '.BWWB...........',
  '.BBBB...........',
];

SPRITES['player_left_0'] = [
  '....BBBBBBBB....',
  '...BWWWWCCCBb...',
  '..BWWWWWCCCCB...',
  '..BWBBWWCCCCB...',
  '..BWBBWWCCCCB...',
  '..BWWWWWWCCCB...',
  '..BWWBBBBCCCB...',
  '...BWWWWWCBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '.BCCB..BCCB.....',
  '.BCCB..BCCB.....',
  '.BWWB..BWWB.....',
  '.BBBB..BBBB.....',
];

SPRITES['player_left_1'] = [
  '....BBBBBBBB....',
  '...BWWWWCCCBb...',
  '..BWWWWWCCCCB...',
  '..BWBBWWCCCCB...',
  '..BWBBWWCCCCB...',
  '..BWWWWWWCCCB...',
  '..BWWBBBBCCCB...',
  '...BWWWWWCBB....',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  'BCCB..BBBBB.....',
  'BCCB............',
  'BWWB............',
  'BBBB............',
];

SPRITES['player_right_0'] = [
  '....BBBBBBBB....',
  '...BCCCWWWWBb...',
  '..BCCCCWWWWWB...',
  '..BCCCCWWBBWB...',
  '..BCCCCWWBBWB...',
  '..BCCCWWWWWWB...',
  '..BCCCBBBBWWB...',
  '...BCCCWWWWBB...',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '....BCCB..BCCB..',
  '....BCCB..BCCB..',
  '....BWWB..BWWB..',
  '....BBBB..BBBB..',
];

SPRITES['player_right_1'] = [
  '....BBBBBBBB....',
  '...BCCCWWWWBb...',
  '..BCCCCWWWWWB...',
  '..BCCCCWWBBWB...',
  '..BCCCCWWBBWB...',
  '..BCCCWWWWWWB...',
  '..BCCCBBBBWWB...',
  '...BCCCWWWWBB...',
  '..BCCCCCCCCCB...',
  '..BCWWWWWWCB....',
  '..BCCCCCCCCCB...',
  '...BBBBBBBBb....',
  '.......BCCB.BBBB',
  '...........BCCB.',
  '...........BWWB.',
  '...........BBBB.',
];

// ---- BOMB SPRITES (Phase 2, task #12) ----
// Dark round body, white highlight top-right, fuze sticking up.

SPRITES['bomb_0'] = [
  '................',
  '.....OOOOOO.....',
  '....OKKKKKKOB...',
  '...OKKWKKKKKOB..',
  '..OKKWWKKKKKKOb.',
  '..OKKWKKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '...OOKKKKKKOOb..',
  '....OOOOOOOOb...',
  '....OOOOOOOb....',
  '....OOOOOO......',
  '................',
  '................',
  '................',
];

SPRITES['bomb_1'] = [
  '.....BBBBB......',
  '....BOYYYOBb....',
  '....BOYYYOBb....',
  '....BBBBBBb.....',
  '.....OOOOOO.....',
  '....OKKKKKKOB...',
  '...OKKWKKKKKOB..',
  '..OKKWWKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '..OKKKKKKKKKKOb.',
  '...OOKKKKKKOOb..',
  '....OOOOOOOOb...',
  '....OOOOOOOb....',
  '................',
  '................',
];

// ---- EXPLOSION SPRITES (Phase 2, task #12) ----
// Yellow/orange/red flame segments

SPRITES['explosion_center'] = [
  '....BBBBBBBB....',
  '...BYYYYYYYBb...',
  '..BOOOOOOOOOBb..',
  '..BOYYYYYYYYOB..',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '.BOYRRRRRRRYOBb.',
  '..BOYYYYYYYYOB..',
  '..BOOOOOOOOOBb..',
  '...BYYYYYYYBb...',
  '....BBBBBBBB....',
];

SPRITES['explosion_h_mid'] = [
  '................',
  '................',
  '................',
  '................',
  'OOOOOOOOOOOOOOOo',
  'YYYYYYYYYYYYYYYy',
  'RRRRRRRRRRRRRRRr',
  'RRRRRRRRRRRRRRRr',
  'YYYYYYYYYYYYYYYy',
  'OOOOOOOOOOOOOOOo',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

SPRITES['explosion_v_mid'] = [
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
];

SPRITES['explosion_left_end'] = [
  '................',
  '................',
  '................',
  '................',
  '....OOOOOOOOOOOo',
  '..YYYYYYYYYYYYYy',
  'RRRRRRRRRRRRRRRr',
  'RRRRRRRRRRRRRRRr',
  '..YYYYYYYYYYYYYy',
  '....OOOOOOOOOOOo',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

SPRITES['explosion_right_end'] = [
  '................',
  '................',
  '................',
  '................',
  'oOOOOOOOOOOO....',
  'yYYYYYYYYYYYY...',
  'rRRRRRRRRRRRRRRR',
  'rRRRRRRRRRRRRRRR',
  'yYYYYYYYYYYYYYY.',
  'oOOOOOOOOOOO....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

SPRITES['explosion_up_end'] = [
  '....OOYYRRRRYYOO',
  '..OOYYRRRRRRYYOO',
  'OOYYRRRRRRRRYYOO',
  'OOYYRRRRRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

SPRITES['explosion_down_end'] = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  '....OOYYRRRRYYOO',
  'OOYYRRRRRRRRYYOO',
  'OOYYRRRRRRRRYYOO',
  '..OOYYRRRRRRYYOO',
  '....OOYYRRRRYYOO',
  '................',
  '................',
];

// ---- BALLOOM ENEMY SPRITES (Phase 2, task #12) ----
// Pink round blob, simple black dot eyes, two stubby feet.
// 4 directions, 2 walk frames each.

SPRITES['balloom_down_0'] = [
  '......BBBBBB....',
  '....BBPPPPPPBB..',
  '...BPPPPPPPPPBb.',
  '..BPPPPPPPPPPBb.',
  '..BPBBPPPPBBPBb.',
  '..BPBBPPPPBBPBb.',
  '..BPPPPPPPPPPBb.',
  '..BPPPBBBPPPPBb.',
  '..BPPPPPPPPPPBb.',
  '...BBPPPPPPBBb..',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '..BPPB..BPPBb...',
  '..BPPB..BPPBb...',
  '..BBBb..BBBb....',
];

SPRITES['balloom_down_1'] = [
  '......BBBBBB....',
  '....BBPPPPPPBB..',
  '...BPPPPPPPPPBb.',
  '..BPPPPPPPPPPBb.',
  '..BPBBPPPPBBPBb.',
  '..BPBBPPPPBBPBb.',
  '..BPPPPPPPPPPBb.',
  '..BPPPBBBPPPPBb.',
  '..BPPPPPPPPPPBb.',
  '...BBPPPPPPBBb..',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '.BPPB....BBBb...',
  '.BPPB...........',
  '.BBBb...........',
];

SPRITES['balloom_up_0'] = [
  '......BBBBBB....',
  '....BBMMMMMMBB..',
  '...BMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMBBMMMMBBMBb.',
  '..BMBBMMMMBBMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '...BBMMMMMMBBb..',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '..BMMB..BMMBb...',
  '..BMMB..BMMBb...',
  '..BBBb..BBBb....',
];

SPRITES['balloom_up_1'] = [
  '......BBBBBB....',
  '....BBMMMMMMBB..',
  '...BMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMBBMMMMBBMBb.',
  '..BMBBMMMMBBMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '..BMMMMMMMMMMBb.',
  '...BBMMMMMMBBb..',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '....BBBBBBBBb...',
  '.BMMB....BBBb...',
  '.BMMB...........',
  '.BBBb...........',
];

SPRITES['balloom_left_0'] = [
  '....BBBBBB......',
  '..BBPPPPPPBBb...',
  '.BPPPPPPPPPPBb..',
  'BPPPPPPPPPPPPBb.',
  'BPBBPPPPPPPPPBb.',
  'BPBBPPPBBPPPPBb.',
  'BPPPPPPPBBPPPBb.',
  'BPPPBBBPPPPPPBb.',
  'BPPPPPPPPPPPPBb.',
  '.BBPPPPPPPPBBb..',
  '..BBBBBBBBBBb...',
  '..BBBBBBBBBBb...',
  'BPPBb..BPPBb....',
  'BPPBb..BPPBb....',
  'BBBb...BBBb.....',
  '................',
];

SPRITES['balloom_left_1'] = [
  '....BBBBBB......',
  '..BBPPPPPPBBb...',
  '.BPPPPPPPPPPBb..',
  'BPPPPPPPPPPPPBb.',
  'BPBBPPPPPPPPPBb.',
  'BPBBPPPBBPPPPBb.',
  'BPPPPPPPBBPPPBb.',
  'BPPPBBBPPPPPPBb.',
  'BPPPPPPPPPPPPBb.',
  '.BBPPPPPPPPBBb..',
  '..BBBBBBBBBBb...',
  '..BBBBBBBBBBb...',
  'BPPBb...........',
  'BPPBb...........',
  'BBBb............',
  '................',
];

SPRITES['balloom_right_0'] = [
  '......BBBBBB....',
  '...BBbPPPPPPBB..',
  '..BbPPPPPPPPPB..',
  '.BbPPPPPPPPPPPB.',
  '.BbPPPPPPPPBBPB.',
  '.BbPPPBBPPPBBPB.',
  '.BbPPPBBPPPPPPB.',
  '.BbPPPPPPBBBPPB.',
  '.BbPPPPPPPPPPPB.',
  '..BBbPPPPPPBBB..',
  '...BBBBBBBBBb...',
  '...BBBBBBBBBb...',
  '....BPPb..BPPb..',
  '....BPPb..BPPb..',
  '....BBBb..BBBb..',
  '................',
];

SPRITES['balloom_right_1'] = [
  '......BBBBBB....',
  '...BBbPPPPPPBB..',
  '..BbPPPPPPPPPB..',
  '.BbPPPPPPPPPPPB.',
  '.BbPPPPPPPPBBPB.',
  '.BbPPPBBPPPBBPB.',
  '.BbPPPBBPPPPPPB.',
  '.BbPPPPPPBBBPPB.',
  '.BbPPPPPPPPPPPB.',
  '..BBbPPPPPPBBB..',
  '...BBBBBBBBBb...',
  '...BBBBBBBBBb...',
  '..........BPPb..',
  '..........BPPb..',
  '..........BBBb..',
  '................',
];

// ---- POWER-UP SPRITES (Phase 2, task #12) ----
// White circle on green tile background with icon

SPRITES['powerup_bomb'] = [
  'GGGGGGGGGGGGGGGG',
  'GGGGBBBBBBBBGGGG',
  'GGBBWWWWWWWWBBGg',
  'GBWWWWWWWWWWWWBg',
  'BWWWWBBWWWWWWWWB',
  'BWWWBBKBWWWWWWWB',
  'BWWWBKKBwwwwwwwB',
  'BWWWWBBBwwwwwwwB',
  'BWWWWWWWwwwwwwwB',
  'BWWWWWBBBwwwwwwB',
  'BWWWWBKKBwwwwwwB',
  'BWWWBBKBwwwwwwwB',
  'GBWWWWWWWWWWWWBg',
  'GGBBWWWWWWWWBBGg',
  'GGGGBBBBBBBBGGGG',
  'GGGGGGGGGGGGGGGG',
];

SPRITES['powerup_fire'] = [
  'GGGGGGGGGGGGGGGG',
  'GGGGBBBBBBBBGGGG',
  'GGBBWWWWWWWWBBGg',
  'GBWWWWWWWWWWWWBg',
  'BWWWWWOWWWWWWWwB',
  'BWWWWOOOWWWWWwwB',
  'BWWWRROOOWWWwwwB',
  'BWWWRRROOOwwwwwB',
  'BWWWRRROOwwwwwwB',
  'BWWWWRROOwwwwwwB',
  'BWWWWWROWwwwwwwB',
  'BWWWWWWOWwwwwwwB',
  'GBWWWWWWWWWWWWBg',
  'GGBBWWWWWWWWBBGg',
  'GGGGBBBBBBBBGGGG',
  'GGGGGGGGGGGGGGGG',
];

SPRITES['powerup_speed'] = [
  'GGGGGGGGGGGGGGGG',
  'GGGGBBBBBBBBGGGG',
  'GGBBWWWWWWWWBBGg',
  'GBWWWWWWWWWWWWBg',
  'BWWWWBBBBBWWWWwB',
  'BWWWBWWWWWBWWwwB',
  'BWWWBWWWWWBWwwwB',
  'BWWWWBBBBBWwwwwB',
  'BWWWWWBBBBWwwwwB',
  'BWWWWWWBBBWwwwwB',
  'BWWWWWWWBBWwwwwB',
  'BWWWWWWWWBWwwwwB',
  'GBWWWWWWWWWWWWBg',
  'GGBBWWWWWWWWBBGg',
  'GGGGBBBBBBBBGGGG',
  'GGGGGGGGGGGGGGGG',
];

// ---- EXIT DOOR (Phase 2, task #12) ----
// Ornate portal — dark surround with glowing center

SPRITES['door'] = [
  'KKssssssssssssKK',
  'KsSSSSSSSSSSSSsK',
  'sSSSSSSSSSSSSSSs',
  'sSSSCCCCCCCSSSs.',
  'sSSSCMMMMMMCSSSs',
  'sSSSCMYYYYMCSSSs',
  'sSSSCMYWWYMCSSSs',
  'sSSSCMYWWYMCSSSs',
  'sSSSCMYYYYMCSSSs',
  'sSSSCMMMMMMCSSSs',
  'sSSSCCCCCCCSSSs.',
  'sSSSSSSSSSSSSSSs',
  'KsSSSSSSSSSSSSsK',
  'KKssssssssssssKK',
  'KKKKKKKKKKKKKKKK',
  'K.K.K.K.K.K.K.K.',
];
