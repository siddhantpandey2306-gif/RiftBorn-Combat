// Test Suite for RIFTBORN Core Fighting Prototype
import { Fighter, FIGHTER_STATES } from './src/engine/Fighter.js';
import { CombatSystem } from './src/engine/CombatSystem.js';
import { FighterAI } from './src/ai/FighterAI.js';
import { CHARACTERS } from './src/characters/characterData.js';

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

console.log('--- STARTING RIFTBORN COMBAT PROTOTYPE TESTS ---\n');

// Mock Particle System & Game Engine
class MockParticleSystem {
  emitSparks() {}
  emitBurst() {}
  emitSlashArc() {}
  emitDamageText() {}
  emitShockwave() {}
  emitCancelFlash() {}
  emitBlockSparks() {}
  emitDust() {}
  emitCritGlint() {}
}

class MockGameEngine {
  constructor() {
    this.hitStopFrames = 0;
    this.cameraTrauma = 0;
    this.timeDilation = 1.0;
  }
  applyHitStop(frames) { this.hitStopFrames = Math.max(this.hitStopFrames, frames); }
  addCameraTrauma(amount) { this.cameraTrauma += amount; }
  setTimeDilation(scale, duration) { this.timeDilation = scale; }
  triggerFinisher(winner, loser) {}
  triggerHitFeedback(attackerPlayer, targetPlayer, isHeavy, isCrit, isUltimate) {}
  triggerBlockFeedback(targetPlayer) {}
  triggerParryFeedback(targetPlayer) {}
  triggerDodgeFeedback(isPlayer) {}
}

const particleSystem = new MockParticleSystem();
const gameEngine = new MockGameEngine();
const combatSystem = new CombatSystem(gameEngine);

// 1. Fighter Instantiation & Vex Character Data
const p1 = new Fighter(CHARACTERS.vex, { isPlayer: true, playerNumber: 1, x: 380, groundY: 540 });
const p2 = new Fighter(CHARACTERS.vex, { isPlayer: false, playerNumber: 2, x: 500, facing: -1, groundY: 540 });

assert(p1.name === 'VEX', 'P1 is initialized as VEX');
assert(p1.hp === 1000, 'VEX base vitality is 1000 HP');
assert(p1.charData.abilities.length === 3, 'VEX has 3 core abilities');
assert(p1.charData.abilities[0].name === 'Crimson Dash', 'Ability 1 is Crimson Dash');
assert(p1.charData.abilities[1].name === 'Rift Slash', 'Ability 2 is Rift Slash');
assert(p1.charData.abilities[2].name === 'Rift Breaker Ultimate', 'Ability 3 is Rift Breaker Ultimate');

// 2. Movement & Impossible Action Prevention
assert(p1.canMove() === true, 'P1 can move when IDLE');
p1.setState(FIGHTER_STATES.STUNNED);
assert(p1.canMove() === false, 'P1 CANNOT move when STUNNED');
assert(p1.canAct() === false, 'P1 CANNOT attack when STUNNED');

p1.setState(FIGHTER_STATES.KNOCKDOWN);
assert(p1.canAct() === false, 'P1 CANNOT attack when KNOCKED DOWN');

p1.setState(FIGHTER_STATES.DEFEATED);
assert(p1.canAct() === false, 'P1 CANNOT attack when DEFEATED');

// Reset P1 to neutral
p1.reset(380, 1);
assert(p1.canAct() === true, 'P1 can act after reset');

// 3. Basic Combo String (Light 1 -> Light 2 -> Light 3)
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.LIGHT_1, 'P1 starts Light 1 attack');

// Fast-forward to cancel window
p1.stateTimer = 6;
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.LIGHT_2, 'P1 cancels Light 1 into Light 2');

p1.stateTimer = 6;
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.LIGHT_3, 'P1 cancels Light 2 into Light 3 Finisher');

// 4. Branching Combo (Light 1 -> Heavy Launcher)
p1.reset(380, 1);
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
p1.stateTimer = 6;
p1.bufferInput('HEAVY');
p1.update(1/60, 1280, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.HEAVY_LAUNCHER, 'P1 branches Light 1 into Heavy Launcher');

// 5. Branching Combo (Light 1 -> Light 2 -> Heavy Finisher Slam)
p1.reset(380, 1);
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
p1.stateTimer = 6;
p1.bufferInput('LIGHT');
p1.update(1/60, 1280, p2, particleSystem);
p1.stateTimer = 6;
p1.bufferInput('HEAVY');
p1.update(1/60, 1280, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.HEAVY_FINISHER, 'P1 branches Light 2 into Heavy Finisher Slam');

// 6. Energy Consumption (Crimson Dash, Rift Slash, Ultimate)
p1.reset(380, 1);
p1.coreMeter = 20; // Not enough for Special 1 (needs 25)
p1.executeAction('SPECIAL_1', p2, particleSystem);
assert(p1.state === FIGHTER_STATES.IDLE, 'Special 1 prevented when energy is insufficient (20 < 25)');

p1.coreMeter = 30;
p1.executeAction('SPECIAL_1', p2, particleSystem);
assert(p1.state === FIGHTER_STATES.SPECIAL_1, 'Special 1 (Crimson Dash) executes with 30 energy');
assert(p1.coreMeter === 5, 'Special 1 consumed 25 energy (30 - 25 = 5)');

p1.reset(380, 1);
p1.coreMeter = 90; // Not enough for Ultimate (needs 100)
p1.executeAction('ULTIMATE', p2, particleSystem);
assert(p1.state === FIGHTER_STATES.IDLE, 'Ultimate prevented when energy is insufficient (90 < 100)');

p1.coreMeter = 100;
p1.executeAction('ULTIMATE', p2, particleSystem);
assert(p1.state === FIGHTER_STATES.ULTIMATE, 'Ultimate (Rift Breaker) executes with 100 energy');
assert(p1.coreMeter === 0, 'Ultimate consumed 100 energy');

// 7. Hit Detection & Combat Feedback
p1.reset(380, 1);
p2.reset(420, -1);
p1.setState(FIGHTER_STATES.LIGHT_1);
p1.stateTimer = 2; // Frame before hitbox
p1.update(1/60, 1280, p2, particleSystem); // timer = 3 -> spawns hitbox
assert(p1.activeHitbox !== null, 'Light 1 spawns active hitbox');

const p2InitialHp = p2.hp;
combatSystem.processCollisions(p1, p2, particleSystem);
assert(p2.hp < p2InitialHp, 'P2 took damage from clean hit');
assert(p2.state === FIGHTER_STATES.HURT, 'P2 entered HURT state');
assert(p1.comboCount === 1, 'P1 combo counter incremented to 1');
assert(p1.coreMeter > 0, 'P1 gained energy from landing attack');

// 8. Blocking Mechanism
p1.reset(380, 1);
p2.reset(420, -1);
p2.isBlocking = true;
p2.facing = -1; // Facing attacker
p1.setState(FIGHTER_STATES.LIGHT_1);
p1.stateTimer = 2;
p1.update(1/60, 1280, p2, particleSystem);

const p2HpBeforeBlock = p2.hp;
combatSystem.processCollisions(p1, p2, particleSystem);
const chipDamage = p2HpBeforeBlock - p2.hp;
assert(chipDamage < 10, 'Block mitigates 85% of damage (low chip damage taken)');

// 9. Counter Parry Mechanism
p1.reset(380, 1);
p2.reset(420, -1);
p2.isCounterActive = true;
p1.setState(FIGHTER_STATES.LIGHT_1);
p1.stateTimer = 2;
p1.update(1/60, 1280, p2, particleSystem);

combatSystem.processCollisions(p1, p2, particleSystem);
assert(p1.state === FIGHTER_STATES.STUNNED, 'Attacker entered STUNNED state upon being parried');
assert(p1.hp < 1000, 'Attacker took counter damage from parry');

// 10. AI Difficulty System
const aiEasy = new FighterAI(p2, 'EASY');
assert(aiEasy.difficulty === 'EASY', 'AI difficulty set to EASY');
assert(aiEasy.reactionDelay === 24, 'Easy AI has slow 24-frame reaction delay (~400ms)');

const aiNormal = new FighterAI(p2, 'NORMAL');
assert(aiNormal.difficulty === 'NORMAL', 'AI difficulty set to NORMAL');
assert(aiNormal.reactionDelay === 13, 'Normal AI has balanced 13-frame reaction delay (~215ms)');

const aiHard = new FighterAI(p2, 'HARD');
assert(aiHard.difficulty === 'HARD', 'AI difficulty set to HARD');
assert(aiHard.reactionDelay === 6, 'Hard AI has rapid 6-frame reaction delay (~100ms)');

// 11. Defeat / K.O. Transition
p1.reset(380, 1);
p2.reset(420, -1);
p2.hp = 10;
p1.setState(FIGHTER_STATES.HEAVY_1);
p1.stateTimer = 5;
p1.update(1/60, 1280, p2, particleSystem);
combatSystem.processCollisions(p1, p2, particleSystem);

assert(p2.hp === 0, 'P2 vitality dropped to 0');
assert(p2.state === FIGHTER_STATES.DEFEATED, 'P2 transitioned to DEFEATED state');

console.log(`\n--- ALL TESTS COMPLETED: ${passed} PASSED, ${failed} FAILED ---`);
if (failed > 0) process.exit(1);
