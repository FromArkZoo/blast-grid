// ---- Bootstrap: wire everything on DOMContentLoaded ----
// State transitions are driven by input._startEdge inside game.update().
// This file just sizes the canvas and kicks off the RAF loop.

document.addEventListener('DOMContentLoaded', function() {
  var canvas = document.getElementById('gameCanvas');
  canvas.width  = CANVAS_W;
  canvas.height = CANVAS_H;

  game = createGame(canvas);
  game.start();
});
