// RIFTBORN Opponent AI System
// Multi-state behavior tree with Easy, Normal, and Hard difficulty levels

import { FIGHTER_STATES } from '../engine/Fighter.js';

export class FighterAI {
  constructor(fighter, difficulty = 'NORMAL') {
    this.fighter = fighter;
    this.setDifficulty(difficulty);
    this.decisionTimer = 0;
    this.behaviorState = 'IDLE'; // 'APPROACH', 'ATTACK', 'DEFEND', 'DODGE', 'RETREAT', 'SPECIAL', 'ULTIMATE'
    this.comboStep = 0;
    this.comboTimer = 0;
    const charSpacing = {
      solaris: 95,
      lyra: 80,
      aeron: 140,
      kairo: 130,
      nox: 115,
      vex: 110
    };
    this.idealDistance = charSpacing[this.fighter.charId] || 115;
  }

  setDifficulty(diff) {
    const d = (diff || 'NORMAL').toUpperCase();
    if (d === 'EASY' || d === 'RECRUIT') {
      this.difficulty = 'EASY';
      this.reactionDelay = 24; // ~400ms (makes mistakes, slow reaction)
      this.blockChance = 0.22;
      this.counterChance = 0.0;
      this.dodgeChance = 0.05;
      this.comboExecutionChance = 0.30;
      this.whiffRate = 0.25;
    } else if (d === 'HARD' || d === 'MASTER' || d === 'GODLIKE') {
      this.difficulty = 'HARD';
      this.reactionDelay = 6;  // ~100ms (fast reaction, whiff punisher)
      this.blockChance = 0.82;
      this.counterChance = 0.28;
      this.dodgeChance = 0.35;
      this.comboExecutionChance = 0.95;
      this.whiffRate = 0.0;
    } else {
      // NORMAL
      this.difficulty = 'NORMAL';
      this.reactionDelay = 13; // ~215ms (balanced challenge)
      this.blockChance = 0.52;
      this.counterChance = 0.12;
      this.dodgeChance = 0.18;
      this.comboExecutionChance = 0.65;
      this.whiffRate = 0.08;
    }
  }

  update(opponent, particleSystem) {
    if (!opponent || !this.fighter.canAct() && !this.fighter.isBlocking) {
      return;
    }

    if (this.fighter.state === FIGHTER_STATES.DEFEATED || opponent.state === FIGHTER_STATES.DEFEATED) {
      return;
    }

    // Handle combo continuation if AI is currently attacking
    if (this.handleComboChaining(opponent)) {
      return;
    }

    this.decisionTimer++;
    if (this.decisionTimer < this.reactionDelay) {
      return;
    }
    this.decisionTimer = 0;

    const dist = Math.abs(this.fighter.x - opponent.x);
    const opponentIsAttacking = opponent.isAttacking();
    const opponentInRecovery = opponentIsAttacking && opponent.stateTimer > 12;

    // --- 1. DEFENSIVE REACTION (DEFEND / DODGE / COUNTER) ---
    if (opponentIsAttacking && dist < 170 && !opponentInRecovery) {
      const roll = Math.random();

      // Check for Counter Parry or Dodge (Hard / Normal)
      if (roll < this.counterChance) {
        this.behaviorState = 'COUNTER';
        this.fighter.bufferInput('COUNTER');
        return;
      }

      if (roll < this.counterChance + this.dodgeChance) {
        this.behaviorState = 'DODGE';
        this.fighter.bufferInput('DODGE');
        return;
      }

      // Standard Block
      if (roll < this.blockChance) {
        this.behaviorState = 'DEFEND';
        this.fighter.setState(FIGHTER_STATES.BLOCK);
        return;
      } else {
        // AI made a mistake and got caught! (Especially on Easy)
        if (this.fighter.state === FIGHTER_STATES.BLOCK) {
          this.fighter.setState(FIGHTER_STATES.IDLE);
        }
      }
    } else if (this.fighter.state === FIGHTER_STATES.BLOCK && !opponentIsAttacking) {
      this.fighter.setState(FIGHTER_STATES.IDLE);
    }

    // --- 2. TACTICAL ULTIMATE (USE ULTIMATE) ---
    if (this.fighter.coreMeter >= 100) {
      const canUlt = dist < 240 && (
        opponentInRecovery ||
        opponent.state === FIGHTER_STATES.HURT ||
        opponent.state === FIGHTER_STATES.LAUNCHED ||
        (this.difficulty === 'HARD' && opponent.state === FIGHTER_STATES.WAKEUP) ||
        Math.random() < 0.35
      );
      if (canUlt) {
        this.behaviorState = 'ULTIMATE';
        this.fighter.bufferInput('ULTIMATE');
        return;
      }
    }

    // --- 3. WHIFF PUNISHING (REACT TO PLAYER ATTACKS) ---
    if (opponentInRecovery && dist <= this.idealDistance + 60) {
      // Opponent missed an attack! Punish immediately.
      this.behaviorState = 'ATTACK';
      if (this.difficulty !== 'EASY' && this.fighter.cooldowns.special1 <= 0 && this.fighter.coreMeter >= 25 && Math.random() < 0.75) {
        this.fighter.bufferInput('SPECIAL_1'); // Crimson Dash punish!
      } else if (Math.random() < 0.5) {
        this.fighter.bufferInput('LIGHT');
      } else {
        this.fighter.bufferInput('HEAVY');
      }
      return;
    }

    // --- 4. ATTACK IN RANGE (LIGHT, HEAVY, SPECIALS) ---
    if (dist <= this.idealDistance) {
      this.behaviorState = 'ATTACK';
      const attackRoll = Math.random();

      // Special 1: Crimson Dash
      if (attackRoll < 0.25 && this.fighter.cooldowns.special1 <= 0 && this.fighter.coreMeter >= 25) {
        this.fighter.bufferInput('SPECIAL_1');
        return;
      }

      // Special 2: Rift Slash
      if (attackRoll >= 0.25 && attackRoll < 0.45 && this.fighter.cooldowns.special2 <= 0 && this.fighter.coreMeter >= 30) {
        this.fighter.bufferInput('SPECIAL_2');
        return;
      }

      // Basic Attack string
      if (attackRoll >= 0.45 && attackRoll < 0.85) {
        this.fighter.bufferInput('LIGHT');
        this.comboStep = 1;
      } else {
        this.fighter.bufferInput('HEAVY');
      }
      return;
    }

    // --- 5. SPACING & MOVEMENT (APPROACH OR RETREAT) ---
    if (dist > this.idealDistance) {
      // Gap closer with Crimson Dash if far away
      if (dist > 220 && this.fighter.cooldowns.special1 <= 0 && this.fighter.coreMeter >= 25 && Math.random() < 0.4) {
        this.behaviorState = 'SPECIAL';
        this.fighter.bufferInput('SPECIAL_1');
        return;
      }

      // Move toward player (APPROACH)
      this.behaviorState = 'APPROACH';
      const dir = opponent.x > this.fighter.x ? 1 : -1;
      this.fighter.vx = dir * this.fighter.moveSpeed;
      if (this.fighter.canMove() && this.fighter.state !== FIGHTER_STATES.WALK_FWD) {
        this.fighter.setState(FIGHTER_STATES.WALK_FWD);
      }

      // Occasional tactical jump
      if (dist > 300 && Math.random() < 0.06 && this.fighter.isGrounded) {
        this.fighter.jump();
      }
    } else if (dist < this.idealDistance - 35) {
      // Too close! Step back to maintain spacing (RETREAT)
      this.behaviorState = 'RETREAT';
      const dir = opponent.x > this.fighter.x ? -1 : 1;
      this.fighter.vx = dir * (this.fighter.moveSpeed * 0.7);
      if (this.fighter.canMove() && this.fighter.state !== FIGHTER_STATES.WALK_BACK) {
        this.fighter.setState(FIGHTER_STATES.WALK_BACK);
      }
    }
  }

  handleComboChaining(opponent) {
    const s = this.fighter.state;
    const t = this.fighter.stateTimer;

    // Chaining from Light 1
    if (s === FIGHTER_STATES.LIGHT_1 && t >= 6 && t <= 14) {
      if (Math.random() < this.comboExecutionChance) {
        if (this.difficulty === 'HARD' && Math.random() < 0.5) {
          // Branch: Light -> Heavy Launcher!
          this.fighter.bufferInput('HEAVY');
        } else {
          // Branch: Light -> Light 2
          this.fighter.bufferInput('LIGHT');
        }
        return true;
      }
    }

    // Chaining from Light 2
    if (s === FIGHTER_STATES.LIGHT_2 && t >= 6 && t <= 15) {
      if (Math.random() < this.comboExecutionChance) {
        if (Math.random() < 0.5) {
          // Branch: Light -> Light -> Heavy Finisher Slam!
          this.fighter.bufferInput('HEAVY');
        } else {
          // Branch: Light -> Light -> Light 3 Finisher
          this.fighter.bufferInput('LIGHT');
        }
        return true;
      }
    }

    // Chaining from Heavy Launcher (Light -> Heavy -> Special)
    if (s === FIGHTER_STATES.HEAVY_LAUNCHER && t >= 7 && t <= 18) {
      if (this.fighter.coreMeter >= 25 && Math.random() < this.comboExecutionChance) {
        if (this.fighter.coreMeter >= 100 && Math.random() < 0.6) {
          this.fighter.bufferInput('ULTIMATE'); // Super cancel!
        } else if (Math.random() < 0.5) {
          this.fighter.bufferInput('SPECIAL_1'); // Crimson Dash juggle!
        } else {
          this.fighter.bufferInput('SPECIAL_2'); // Rift Slash juggle!
        }
        return true;
      }
    }

    return false;
  }
}
