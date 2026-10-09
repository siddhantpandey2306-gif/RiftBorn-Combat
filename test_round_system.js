// Test Suite for Best-of-3 Round Progression & Match Flow
import { GameEngine } from './src/engine/GameEngine.js';
import { FIGHTER_STATES } from './src/engine/Fighter.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`[PASS] ${message}`);
    passed++;
  } else {
    console.error(`[FAIL] ${message}`);
    failed++;
  }
}

console.log('--- STARTING RIFTBORN ROUND SYSTEM & MATCH FLOW TESTS ---\n');

// Mock HTML Canvas & Context
class MockContext {
  clearRect() {}
  save() {}
  restore() {}
  translate() {}
  scale() {}
  rotate() {}
  fillRect() {}
  strokeRect() {}
  fillText() {}
  beginPath() {}
  closePath() {}
  arc() {}
  ellipse() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  fill() {}
  stroke() {}
  setLineDash() {}
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
}

const mockCanvas = {
  getContext: () => new MockContext(),
  width: 1280,
  height: 720
};

const engine = new GameEngine(mockCanvas);

// 1. Initial State
engine.initMatch('vex', 'vex', 'neon_metro', 'Casual', 'NORMAL');

assert(engine.roundNumber === 1, 'Match starts on Round 1');
assert(engine.roundTime === 99, 'Clock starts at 99 seconds');
assert(engine.roundState === 'INTRO_READY', 'Match starts in INTRO_READY state');
assert(engine.announcementTitle === 'ROUND 1', 'Announcement displays ROUND 1');
assert(engine.announcementSubtitle === 'READY...', 'Announcement displays READY...');
assert(engine.p1.roundsWon === 0, 'P1 starts with 0 rounds won');
assert(engine.p2.roundsWon === 0, 'P2 starts with 0 rounds won');

// 2. State transition to INTRO_FIGHT -> FIGHTING
engine.stateTimer = 1;
engine.update(1/60);
assert(engine.roundState === 'INTRO_FIGHT', 'Transitions to INTRO_FIGHT');
assert(engine.announcementTitle === 'FIGHT!', 'Displays FIGHT!');

engine.stateTimer = 1;
engine.update(1/60);
assert(engine.roundState === 'FIGHTING', 'Transitions to FIGHTING state');

// 3. Round 1 Won by P1
engine.p2.hp = 0;
engine.p2.setState(FIGHTER_STATES.DEFEATED);
engine.handleRoundEnd();

assert(engine.roundState === 'ROUND_OVER', 'Enters ROUND_OVER state upon defeat');
assert(engine.p1.roundsWon === 1, 'P1 awarded 1 round win (Score: 1-0)');
assert(engine.announcementTitle === 'K.O.', 'Displays K.O.');

// Check progression: 1 win is not enough for Best-of-3 (requires 2 wins)
engine.checkMatchProgression();
assert(engine.roundNumber === 2, 'Advances to Round 2');
assert(engine.roundState === 'INTRO_READY', 'Round 2 starts with INTRO_READY');
assert(engine.p1.hp === 1000, 'P1 health restored to full for Round 2');
assert(engine.p2.hp === 1000, 'P2 health restored to full for Round 2');

// 4. Round 2 Won by P2 (Score: 1-1 -> Tie!)
engine.p1.hp = 0;
engine.p1.setState(FIGHTER_STATES.DEFEATED);
engine.handleRoundEnd();

assert(engine.p2.roundsWon === 1, 'P2 awarded 1 round win (Score: 1-1)');
engine.checkMatchProgression();
assert(engine.roundNumber === 3, 'Advances to Round 3 (Final Round)');
assert(engine.announcementTitle === 'FINAL ROUND', 'Displays FINAL ROUND banner');

// 5. Round 3 Won by P1 (Score: 2-1 -> P1 Wins Match!)
let matchEnded = false;
let matchResultData = null;
engine.onMatchEnd = (data) => {
  matchEnded = true;
  matchResultData = data;
};

engine.p2.hp = 0;
engine.p2.setState(FIGHTER_STATES.DEFEATED);
engine.handleRoundEnd();
assert(engine.p1.roundsWon === 2, 'P1 reaches 2 round wins');

engine.checkMatchProgression();
assert(engine.roundState === 'MATCH_OVER', 'State becomes MATCH_OVER');
assert(engine.announcementTitle === 'VICTORY', 'Displays VICTORY for Player 1');

// 6. Camera Dynamic Centering & Zoom
assert(typeof engine.cameraX === 'number', 'Camera X is tracked');
assert(typeof engine.cameraZoom === 'number', 'Camera Zoom is tracked');

// Test close quarters zoom
engine.p1.x = 480;
engine.p2.x = 520; // 40px apart
engine.update(1/60);
assert(engine.targetZoom === 1.15, 'Camera zooms in to 1.15 in close quarters');

// Test wide spacing zoom
engine.p1.x = 100;
engine.p2.x = 900; // 800px apart
engine.update(1/60);
assert(engine.targetZoom === 0.92, 'Camera zooms out to 0.92 during wide spacing');

console.log(`\n--- ALL ROUND & MATCH FLOW TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ---`);
if (failed > 0) process.exit(1);
