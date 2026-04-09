// input.js — keyboard state tracker
// Exposes `input` object with boolean flags updated on keydown/keyup.
// Consumed by player.js and game.js (Enter for state transitions).

var input = {
  up:    false,
  down:  false,
  left:  false,
  right: false,
  bomb:  false,   // Space — held state
  start: false,   // Enter — held state

  // Rising-edge flags: true for exactly one frame after the key is first pressed.
  // game.js must call input.clearEdges() at the end of each update tick.
  _bombEdge:  false,
  _startEdge: false,

  clearEdges: function() {
    this._bombEdge  = false;
    this._startEdge = false;
  }
};

window.addEventListener('keydown', function(e) {
  switch (e.code) {
    case 'ArrowUp':    case 'KeyW': input.up    = true; break;
    case 'ArrowDown':  case 'KeyS': input.down  = true; break;
    case 'ArrowLeft':  case 'KeyA': input.left  = true; break;
    case 'ArrowRight': case 'KeyD': input.right = true; break;
    case 'Space':
      if (!input.bomb) input._bombEdge = true;
      input.bomb = true;
      e.preventDefault();
      break;
    case 'Enter':
      if (!input.start) input._startEdge = true;
      input.start = true;
      e.preventDefault();
      break;
  }
});

window.addEventListener('keyup', function(e) {
  switch (e.code) {
    case 'ArrowUp':    case 'KeyW': input.up    = false; break;
    case 'ArrowDown':  case 'KeyS': input.down  = false; break;
    case 'ArrowLeft':  case 'KeyA': input.left  = false; break;
    case 'ArrowRight': case 'KeyD': input.right = false; break;
    case 'Space':  input.bomb  = false; break;
    case 'Enter':  input.start = false; break;
  }
});
