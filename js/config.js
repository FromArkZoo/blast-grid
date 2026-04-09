// ---- Shared configuration constants ----
// All teammates read from here. Do NOT redefine these elsewhere.

const GRID_W = 13, GRID_H = 11, TILE = 32;
const HUD_H = 48;
const CANVAS_W = GRID_W * TILE;              // 416
const CANVAS_H = GRID_H * TILE + HUD_H;      // 400

const BOMB_TIMER_MS = 2500;
const EXPLOSION_DURATION_MS = 500;
const PLAYER_BASE_SPEED = 80;                 // px/sec
const ENEMY_SPEED_FACTOR = 0.4;

const T_EMPTY = 0, T_HARD = 1, T_SOFT = 2;
const STATE_TITLE = 0, STATE_PLAYING = 1, STATE_STAGE_CLEAR = 2, STATE_GAME_OVER = 3;

const SEED = 12345;  // change for QA variation

const PALETTE = {
  '.': null,          // transparent
  'W': '#ffffff',     // white
  'B': '#000000',     // black (outline)
  'K': '#222222',     // dark grey
  'G': '#7fbf3f',     // grass green
  'D': '#3f7f1f',     // dark grass
  'R': '#c84040',     // red
  'O': '#ff9020',     // orange fire
  'Y': '#ffe040',     // yellow
  'P': '#ff80c0',     // pink
  'S': '#808080',     // stone grey
  's': '#404040',     // dark stone
  'N': '#80401f',     // soft wall brown
  'n': '#502010',     // dark brown
  'C': '#40a0ff',     // cyan
  'M': '#c040ff',     // magenta
  // artist may extend
};
