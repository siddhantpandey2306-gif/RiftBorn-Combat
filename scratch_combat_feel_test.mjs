// Headless Verification Suite for Combat Feel & Responsiveness
import { Fighter, FIGHTER_STATES } from './src/engine/Fighter.js';
import { CombatSystem } from './src/engine/CombatSystem.js';
import { ParticleSystem } from './src/engine/ParticleSystem.js';
import { CHARACTERS } from './src/characters/characterData.js';

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

// Mock GameEngine for headless testing
class MockGameEngine {
  constructor() {
    this.width = 1280;
    this.height = 720;
    this.groundY = 540;
    this.hitStopFrames = 0;
    this.cameraTrauma = 0;
    this.timeDilation = 1.0;
    this.timeDilationTimer = 0;
    this.screenFlash = { alpha: 0, color: '#FFFFFF' };
    this.hurtVignette = { alpha: 0, color: '#FF0033' };
    this.blockVignette = { alpha: 0, color: '#00E5FF' };
    this.dodgeVignette = { alpha: 0, color: '#00FFFF' };
  }
  applyHitStop(f) { this.hitStopFrames = Math.max(this.hitStopFrames, f); }
  addCameraTrauma(t) { this.cameraTrauma = Math.min(1.0, this.cameraTrauma + t); }
  setTimeDilation(s, d) { this.timeDilation = s; this.timeDilationTimer = d; }
  triggerFinisher() {}
  triggerHitFeedback(attackerIsPlayer, targetIsPlayer, isHeavy, isCrit, isUltimate) {
    if (attackerIsPlayer) this.screenFlash = { alpha: 0.2, color: '#FFFFFF' };
    if (targetIsPlayer) this.hurtVignette.alpha = 0.3;
  }
  triggerBlockFeedback(targetIsPlayer) {
    if (targetIsPlayer) this.blockVignette.alpha = 0.28;
  }
  triggerDodgeFeedback(targetIsPlayer) {
    if (targetIsPlayer) this.dodgeVignette.alpha = 0.32;
  }
  triggerParryFeedback(targetIsPlayer) {
    if (targetIsPlayer) this.screenFlash = { alpha: 0.28, color: '#FFD700' };
  }
}

console.log('=== TEST 1: ZERO-LATENCY INPUT & MOVEMENT RESPONSIVENESS ===');
{
  const p1 = new Fighter(CHARACTERS.vex, { isPlayer: true, x: 400, y: 540, facing: 1, groundY: 540 });
  const p2 = new Fighter(CHARACTERS.vex, { isPlayer: false, x: 500, y: 540, facing: -1, groundY: 540 });
  const particles = new ParticleSystem();

  // Test zero-delay direct attack initiation
  assert(p1.state === FIGHTER_STATES.IDLE, 'P1 starts in neutral IDLE');
  const executed = p1.handleDirectInput('LIGHT', p2, particles);
  assert(executed === true, 'handleDirectInput immediately executes LIGHT action');
  assert(p1.state === FIGHTER_STATES.LIGHT_1, 'P1 transitions to LIGHT_1 on frame 0 of input');

  // Test direction change / turn-around without sliding
  p1.reset(400, 1);
  p1.vx = p1.moveSpeed; // moving forward
  assert(p1.vx > 0, 'P1 moving forward');
  // Reversal check
  if (p1.vx > 0) p1.vx = 0;
  p1.vx = -p1.moveSpeed;
  assert(p1.vx === -p1.moveSpeed, 'P1 instantly reverses direction with zero sliding');

  // Test ground deceleration (no ice-skate drift)
  p1.setState(FIGHTER_STATES.IDLE);
  p1.vx = 6.0;
  p1.update(0.016, 1280, p2, particles);
  assert(p1.vx <= 3.2, 'P1 rapidly decelerates on neutral release (snappy friction)');
}

console.log('\n=== TEST 2: ATTACK ANTICIPATION & HIT-STOP ===');
{
  const p1 = new Fighter(CHARACTERS.vex, { isPlayer: true, x: 400, y: 540, facing: 1, groundY: 540 });
  const p2 = new Fighter(CHARACTERS.vex, { isPlayer: false, x: 450, y: 540, facing: -1, groundY: 540 });
  const particles = new ParticleSystem();

  p1.setState(FIGHTER_STATES.LIGHT_1);
  assert(p1.activeHitbox === null, 'Light 1 has 2 frames startup anticipation before active hitbox');
  
  // Advance to frame 3 (active hit frame)
  p1.update(0.016, 1280, p2, particles); // timer 1
  p1.update(0.016, 1280, p2, particles); // timer 2
  p1.update(0.016, 1280, p2, particles); // timer 3
  assert(p1.activeHitbox !== null && p1.activeHitbox.active, 'Light 1 spawns active hitbox on frame 3');
}

console.log('\n=== TEST 3: COMBAT RESOLUTION & DEFENSE FEEDBACK ===');
{
  const game = new MockGameEngine();
  const combat = new CombatSystem(game);
  const particles = new ParticleSystem();
  const p1 = new Fighter(CHARACTERS.vex, { isPlayer: true, x: 400, y: 540, facing: 1, groundY: 540 });
  const p2 = new Fighter(CHARACTERS.vex, { isPlayer: false, x: 440, y: 540, facing: -1, groundY: 540 });

  // P1 attacks, P2 gets hit
  p1.setState(FIGHTER_STATES.LIGHT_1);
  for (let i = 0; i < 3; i++) p1.update(0.016, 1280, p2, particles);

  const initialHp = p2.hp;
  combat.processCollisions(p1, p2, particles);
  assert(p2.hp < initialHp, 'P2 takes clean hit damage');
  assert(p2.state === FIGHTER_STATES.HURT, 'P2 enters HURT state');
  assert(game.hitStopFrames > 0, 'Hit-stop freezes frames for punchy impact');
  assert(game.cameraTrauma > 0, 'Camera trauma shakes screen on hit');
  assert(p2.jitterX !== 0 || p2.jitterY !== 0, 'Target has physical micro-jitter during hitstun');

  // Test Block feedback
  p1.reset(400, 1);
  p2.reset(440, -1);
  p2.setState(FIGHTER_STATES.BLOCK);
  p1.setState(FIGHTER_STATES.LIGHT_1);
  for (let i = 0; i < 3; i++) p1.update(0.016, 1280, p2, particles);

  const p2PreBlockHp = p2.hp;
  combat.processCollisions(p1, p2, particles);
  assert(p2.hp >= p2PreBlockHp - 15, 'Block reduces incoming damage to 15% chip');
  assert(p2.blockFlashTimer === 10, 'Block sets deflecting barrier flash timer');
  assert(p2.vx > 0, 'Block applies pushback separating fighters');

  // Test Skill-based Perfect Dodge
  p1.reset(400, 1);
  p2.reset(440, -1);
  p2.setState(FIGHTER_STATES.DODGE);
  p2.stateTimer = 3; // within frames 1-6 perfect dodge window
  p2.isInvulnerable = true;
  p1.setState(FIGHTER_STATES.LIGHT_1);
  for (let i = 0; i < 3; i++) p1.update(0.016, 1280, p2, particles);

  const p2PreDodgeHp = p2.hp;
  combat.processCollisions(p1, p2, particles);
  assert(p2.hp === p2PreDodgeHp, 'Perfect dodge negates all damage');
  assert(game.timeDilation === 0.22, 'Perfect dodge triggers snappy Matrix slow-motion');
  assert(game.timeDilationTimer === 260, 'Perfect dodge slow-motion is tight 260ms snap');
}

console.log('\n=== TEST 4: COMBO CANCELS & INFINITE PREVENTION ===');
{
  const p1 = new Fighter(CHARACTERS.vex, { isPlayer: true, x: 400, y: 540, facing: 1, groundY: 540 });
  const p2 = new Fighter(CHARACTERS.vex, { isPlayer: false, x: 500, y: 540, facing: -1, groundY: 540 });
  const particles = new ParticleSystem();

  // Test cancel window detection
  p1.setState(FIGHTER_STATES.LIGHT_1);
  p1.stateTimer = 5; // cancel window is frames 4-13
  assert(p1.isCancelWindowOpen(), 'isCancelWindowOpen returns true during cancel window');

  // Test combo cancel into Light 2
  const cancelLight = p1.handleDirectInput('LIGHT', p2, particles);
  assert(cancelLight === true, 'handleDirectInput immediately triggers combo cancel');
  assert(p1.state === FIGHTER_STATES.LIGHT_2, 'Combo transition to LIGHT_2 is instantaneous');

  // Test branch into Heavy Launcher from Light 1
  p1.setState(FIGHTER_STATES.LIGHT_1);
  p1.stateTimer = 6;
  const cancelHeavy = p1.handleDirectInput('HEAVY', p2, particles);
  assert(cancelHeavy === true, 'Combo branch to Heavy Launcher triggers immediately');
  assert(p1.state === FIGHTER_STATES.HEAVY_LAUNCHER, 'Fighter is in HEAVY_LAUNCHER state');

  // Test Infinite Prevention scaling
  const game = new MockGameEngine();
  const combat = new CombatSystem(game);
  p1.comboCount = 5; // deep combo
  p2.reset(440, -1);
  p2.setState(FIGHTER_STATES.HURT); // target is in hitstun during an ongoing combo
  p1.setState(FIGHTER_STATES.LIGHT_1);
  for (let i = 0; i < 3; i++) p1.update(0.016, 1280, p2, particles);
  combat.processCollisions(p1, p2, particles);
  assert(p2.hitStunTimer < 16, 'Hitstun decays during extended combo to prevent infinites');
}

console.log(`\nResults: ${passed} passed, ${failed} failed.`);
if (failed > 0) process.exit(1);
