// sounds.js — Web Audio SFX for Bomberman clone
// All sounds are synthesized via Web Audio API — no external files.
// playSfx(name) is the public API, called via game.playSfx(name).

let audioCtx = null;

function initAudio() {
  if (audioCtx) return;
  audioCtx = new (window.AudioContext || window.webkitAudioContext)();
}

// --- helpers ---

function masterGain(value) {
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(value, audioCtx.currentTime);
  g.connect(audioCtx.destination);
  return g;
}

function osc(type, freq, startTime, duration, gainPeak, dest) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freq, startTime);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  o.connect(g);
  g.connect(dest);
  o.start(startTime);
  o.stop(startTime + duration + 0.01);
}

function oscSlide(type, freqStart, freqEnd, startTime, duration, gainPeak, dest) {
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.setValueAtTime(freqStart, startTime);
  o.frequency.exponentialRampToValueAtTime(freqEnd, startTime + duration);
  g.gain.setValueAtTime(0, startTime);
  g.gain.linearRampToValueAtTime(gainPeak, startTime + 0.005);
  g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  o.connect(g);
  g.connect(dest);
  o.start(startTime);
  o.stop(startTime + duration + 0.01);
}

function noiseBuffer() {
  const bufLen = audioCtx.sampleRate * 0.5;
  const buf = audioCtx.createBuffer(1, bufLen, audioCtx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < bufLen; i++) data[i] = Math.random() * 2 - 1;
  return buf;
}

function noiseSource(buf) {
  const src = audioCtx.createBufferSource();
  src.buffer = buf;
  return src;
}

// --- Phase 1 SFX ---

function bomb_place() {
  const now = audioCtx.currentTime;
  const dest = masterGain(0.4);
  osc('square', 200, now, 0.10, 0.5, dest);
}

function footstep() {
  // Very soft tick — low-frequency noise burst
  const now = audioCtx.currentTime;
  const buf = noiseBuffer();
  const src = noiseSource(buf);

  const lpf = audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(300, now);

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.06, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.020);

  src.connect(lpf);
  lpf.connect(g);
  g.connect(audioCtx.destination);
  src.start(now);
  src.stop(now + 0.025);
}

// --- Phase 2 SFX ---

function explosion() {
  const now = audioCtx.currentTime;
  const duration = 0.35;

  const buf = noiseBuffer();
  const src = noiseSource(buf);

  const lpf = audioCtx.createBiquadFilter();
  lpf.type = 'lowpass';
  lpf.frequency.setValueAtTime(3000, now);
  lpf.frequency.exponentialRampToValueAtTime(200, now + duration);

  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(1.0, now + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, now + duration);

  src.connect(lpf);
  lpf.connect(g);
  g.connect(audioCtx.destination);
  src.start(now);
  src.stop(now + duration + 0.05);

  // Low boom thump underneath
  osc('sine', 80, now, 0.20, 0.6, audioCtx.destination);
}

function pickup() {
  // Rising arpeggio: C5 E5 G5 (square wave, 60 ms each)
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
  const dest = masterGain(0.35);
  notes.forEach((freq, i) => {
    osc('square', freq, now + i * 0.06, 0.055, 0.5, dest);
  });
}

function player_death() {
  // Descending portamento 400→100 Hz over 500 ms + noise burst
  const now = audioCtx.currentTime;
  const dest = masterGain(0.5);
  oscSlide('sawtooth', 400, 100, now, 0.5, 0.6, dest);

  // Noise punch at start
  const buf = noiseBuffer();
  const src = noiseSource(buf);
  const g = audioCtx.createGain();
  g.gain.setValueAtTime(0.3, now);
  g.gain.exponentialRampToValueAtTime(0.0001, now + 0.15);
  src.connect(g);
  g.connect(audioCtx.destination);
  src.start(now);
  src.stop(now + 0.2);
}

function enemy_death() {
  // Short chirp: 200→400→100 Hz over 200 ms
  const now = audioCtx.currentTime;
  const dest = masterGain(0.35);
  oscSlide('square', 200, 400, now, 0.10, 0.5, dest);
  oscSlide('square', 400, 100, now + 0.10, 0.10, 0.4, dest);
}

function stage_clear() {
  // 5-note victory fanfare: C5 E5 G5 C6 E6, triangle wave, 120 ms each
  const now = audioCtx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.50, 1318.51]; // C5 E5 G5 C6 E6
  const dest = masterGain(0.4);
  notes.forEach((freq, i) => {
    osc('triangle', freq, now + i * 0.12, 0.10, 0.6, dest);
  });
}

function game_over() {
  // Slow descending sad 4-note: E4 D4 C4 A3, 200 ms each
  const now = audioCtx.currentTime;
  const notes = [329.63, 293.66, 261.63, 220.00]; // E4 D4 C4 A3
  const dest = masterGain(0.4);
  notes.forEach((freq, i) => {
    osc('triangle', freq, now + i * 0.20, 0.18, 0.5, dest);
  });
}

// --- Public API ---

function playSfx(name) {
  initAudio();
  const handlers = {
    bomb_place,
    footstep,
    explosion,
    pickup,
    player_death,
    enemy_death,
    stage_clear,
    game_over,
  };
  const fn = handlers[name];
  if (fn) fn();
}

// Initialize audio context on first keydown to satisfy browser autoplay policy
window.addEventListener('keydown', initAudio, { once: true });
