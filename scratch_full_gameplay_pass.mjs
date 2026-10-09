// Full Gameplay Pass Simulation for RIFTBORN Combat Feel
import { GameEngine } from './src/engine/GameEngine.js';
import { FIGHTER_STATES } from './src/engine/Fighter.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    passed++;
    console.log(`  ✓ ${message}`);
  } else {
    failed++;
    console.error(`  ✗ FAIL: ${message}`);
  }
}

// Mock canvas & 2D context
class MockContext {
  save() {}
  restore() {}
  translate() {}
  rotate() {}
  scale() {}
  clearRect() {}
  fillRect() {}
  strokeRect() {}
  beginPath() {}
  arc() {}
  ellipse() {}
  moveTo() {}
  lineTo() {}
  bezierCurveTo() {}
  closePath() {}
  fill() {}
  stroke() {}
  setLineDash() {}
  fillText() {}
  measureText() { return { width: 40 }; }
  createLinearGradient() { return { addColorStop() {} }; }
  createRadialGradient() { return { addColorStop() {} }; }
}

const mockCanvas = {
  getContext: () => new MockContext(),
  width: 1280,
  height: 720
};

console.log('=== STARTING FULL GAMEPLAY PASS ===');

const engine = new GameEngine(mockCanvas);
engine.initMatch('vex', 'vex', 'neon_metro', 'Casual', 'NORMAL');

assert(engine.p1 !== null && engine.p2 !== null, 'Match initialized with Vex vs Vex');
assert(engine.roundState === 'INTRO_READY', 'Game begins in INTRO_READY state');

// 1. Advance intro frames through READY -> FIGHT
for (let f = 0; f < 120; f++) {
  engine.update(1 / 60);
}
assert(engine.roundState === 'FIGHTING', 'Match successfully transitioned to FIGHTING state');

// 2. Simulate combat interactions over 300 frames (5 seconds of live fighting)
let hitLandedCount = 0;
let blockCount = 0;
let cancelCount = 0;

for (let f = 0; f < 300; f++) {
  // Simulate human player inputs at key timings
  if (f === 10) {
    engine.p1.handleDirectInput('LIGHT', engine.p2, engine.particleSystem);
  }
  if (f === 14) {
    // Attempt combo cancel into Light 2
    if (engine.p1.isCancelWindowOpen()) {
      engine.p1.handleDirectInput('LIGHT', engine.p2, engine.particleSystem);
      cancelCount++;
    }
  }
  if (f === 18) {
    // Attempt branch cancel into Heavy Finisher
    if (engine.p1.isCancelWindowOpen()) {
      engine.p1.handleDirectInput('HEAVY', engine.p2, engine.particleSystem);
      cancelCount++;
    }
  }
  if (f === 80) {
    // Dodge opponent approach
    engine.p1.handleDirectInput('DODGE', engine.p2, engine.particleSystem);
  }
  if (f === 140) {
    // Counter parry attempt
    engine.p1.handleDirectInput('COUNTER', engine.p2, engine.particleSystem);
  }

  // Track hits and blocks
  if (engine.p1.lastHitLanded || engine.p2.lastHitLanded) {
    hitLandedCount++;
  }
  if (engine.p1.isBlocking || engine.p2.isBlocking) {
    blockCount++;
  }

  engine.update(1 / 60);
  engine.render();

  // Validate coordinates never become NaN or corrupt
  if (isNaN(engine.p1.x) || isNaN(engine.p1.y) || isNaN(engine.p2.x) || isNaN(engine.p2.y)) {
    throw new Error(`NaN position detected at frame ${f}`);
  }
}

assert(hitLandedCount > 0, `Attacks successfully connected during sparring (${hitLandedCount} hit events)`);
assert(cancelCount > 0, `Combo cancel transitions successfully linked (${cancelCount} cancels)`);
assert(engine.p1.x >= 75 && engine.p1.x <= 1205, 'P1 stayed strictly within arena boundaries');
assert(engine.p2.x >= 75 && engine.p2.x <= 1205, 'P2 stayed strictly within arena boundaries');
assert(engine.cameraZoom >= 0.90 && engine.cameraZoom <= 1.20, 'Dynamic camera zoom stayed smoothly clamped');

console.log('\n=== TESTING KNOCKOUT & ROUND PROGRESSION ===');
// Force round end by setting P2 hp to 0
engine.p2.hp = 0;
engine.update(1 / 60);
assert(engine.roundState === 'ROUND_OVER', 'Engine detects 0 HP and transitions to ROUND_OVER');
assert(engine.p1.roundsWon === 1, 'P1 credited with 1 round victory');

// Advance through K.O. announcement frames
for (let f = 0; f < 150; f++) {
  engine.update(1 / 60);
}
assert(engine.roundNumber === 2, 'Engine automatically advances to ROUND 2');
assert(engine.roundState === 'INTRO_READY', 'Round 2 resets fighters and starts INTRO_READY');
assert(engine.p1.hp === engine.p1.maxHp, 'P1 health restored for Round 2');
assert(engine.p2.hp === engine.p2.maxHp, 'P2 health restored for Round 2');

console.log(`\nGameplay Pass Completed: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
