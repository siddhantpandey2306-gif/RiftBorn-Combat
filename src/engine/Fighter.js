// RIFTBORN Modular Fighter Class
// High-responsiveness physics, snappy acceleration/deceleration, tight frame data, combo branching, and combat mechanics

import { Hitbox, Hurtbox, Projectile } from './Hitbox.js';
import { soundEngine } from './SoundEngine.js';
import { CHARACTERS } from '../characters/characterData.js';

export const FIGHTER_STATES = {
  IDLE: 'IDLE',
  WALK_FWD: 'WALK_FWD',
  WALK_BACK: 'WALK_BACK',
  FALL: 'FALL',
  BLOCK: 'BLOCK',
  DODGE: 'DODGE',
  COUNTER: 'COUNTER',
  HURT: 'HURT',
  STUNNED: 'STUNNED',
  LAUNCHED: 'LAUNCHED',
  KNOCKDOWN: 'KNOCKDOWN',
  WAKEUP: 'WAKEUP',
  DEFEATED: 'DEFEATED',
  VICTORY: 'VICTORY',
  // Basic & Heavy Attacks
  LIGHT_1: 'LIGHT_1',
  LIGHT_2: 'LIGHT_2',
  LIGHT_3: 'LIGHT_3',
  HEAVY_1: 'HEAVY_1',
  HEAVY_LAUNCHER: 'HEAVY_LAUNCHER',
  HEAVY_FINISHER: 'HEAVY_FINISHER',
  // Abilities
  SPECIAL_1: 'SPECIAL_1',
  SPECIAL_2: 'SPECIAL_2',
  ULTIMATE: 'ULTIMATE'
};

export class Fighter {
  constructor(charDataOrOptions, options = {}) {
    let charData = charDataOrOptions;
    let opt = options;
    if (typeof charDataOrOptions === 'string') {
      charData = CHARACTERS[charDataOrOptions] || CHARACTERS.vex;
    } else if (charDataOrOptions && !charDataOrOptions.baseStats) {
      const cid = charDataOrOptions.charId || charDataOrOptions.id || 'vex';
      charData = CHARACTERS[cid] || CHARACTERS.vex;
      opt = charDataOrOptions;
    } else if (!charDataOrOptions) {
      charData = CHARACTERS.vex;
    }

    this.charData = charData;
    this.charId = charData.id;
    this.name = charData.name;
    this.isPlayer = opt.isPlayer !== undefined ? opt.isPlayer : true;
    this.playerNumber = opt.playerNumber || 1;

    // Arena Coordinates & Physics
    this.x = opt.x || 300;
    this.y = opt.y || 540;
    this.vx = 0;
    this.vy = 0;
    this.facing = opt.facing !== undefined ? opt.facing : 1;
    this.groundY = opt.groundY || 540;
    this.gravity = 1.15; // Snappy fighting game gravity

    // Hit reaction micro-jitter
    this.jitterX = 0;
    this.jitterY = 0;

    // Kinematic motion & turn tracking
    this.runTimer = 0;
    this.isRunning = false;
    this.turnTimer = 0;

    // Core Stats (Configured per Character Identity)
    this.maxHp = charData.baseStats.hp || 1000;
    this.hp = this.maxHp;
    this.atk = charData.baseStats.atk || 100;
    this.def = charData.baseStats.def || 80;
    this.moveSpeed = charData.baseStats.speed || 7.2;
    this.jumpForce = charData.baseStats.jumpForce || 14.8;
    this.coreRate = charData.baseStats.coreRate || 1.0;
    this.critChance = charData.baseStats.critChance || 0.12;

    // Unique Character Mechanics
    this.hasSuperArmor = false;
    this.guaranteedCrit = false;
    this.pendingProjectiles = [];
    this.evolutionTier = opt.evolutionTier !== undefined ? opt.evolutionTier : 0;

    // Meters & Combat Resources
    this.coreMeter = 0;
    this.maxCoreMeter = 100;
    this.roundsWon = 0;
    this.comboCount = 0;
    this.comboDamage = 0;
    this.lastHitLanded = false;

    // Cooldowns
    this.cooldowns = {
      special1: 0,
      special2: 0,
      dodge: 0,
      counter: 0
    };

    // State Machine
    this.state = FIGHTER_STATES.IDLE;
    this.stateTimer = 0;
    this.animFrame = 0;
    this.isGrounded = true;
    this.isBlocking = false;
    this.isHitStunned = false;
    this.hitStunTimer = 0;
    this.isInvulnerable = false;
    this.invulnerableTimer = 0;

    // Counter & Perfect Dodge States
    this.isCounterActive = false;
    this.perfectDodgeWindow = 0;
    this.blockFlashTimer = 0;

    // Collision Boxes
    const hWidth = this.charData.visual.width;
    const hHeight = this.charData.visual.height;
    this.hurtbox = new Hurtbox({
      x: this.x - hWidth / 2,
      y: this.y - hHeight,
      width: hWidth,
      height: hHeight,
      owner: this
    });
    this.activeHitbox = null;

    // Input Buffer
    this.inputBuffer = [];
    this.bufferWindowMs = 260; // 260ms window for reliable combo buffering
  }

  reset(x, facing) {
    this.hp = this.maxHp;
    this.coreMeter = 0;
    this.x = x;
    this.y = this.groundY;
    this.vx = 0;
    this.vy = 0;
    this.jitterX = 0;
    this.jitterY = 0;
    this.facing = facing;
    this.state = FIGHTER_STATES.IDLE;
    this.stateTimer = 0;
    this.isHitStunned = false;
    this.isBlocking = false;
    this.isInvulnerable = false;
    this.isCounterActive = false;
    this.hasSuperArmor = false;
    this.guaranteedCrit = false;
    this.pendingProjectiles = [];
    this.blockFlashTimer = 0;
    this.activeHitbox = null;
    this.comboCount = 0;
    this.comboDamage = 0;
    this.lastHitLanded = false;
    this.cooldowns = { special1: 0, special2: 0, dodge: 0, counter: 0 };
    this.inputBuffer = [];
    this.moveSpeed = this.charData.baseStats.speed || 7.2;
    this.jumpForce = this.charData.baseStats.jumpForce || 14.8;

    this.updateHurtbox();
  }

  updateHurtbox() {
    const hWidth = this.charData.visual.width;
    const hHeight = this.charData.visual.height;
    this.hurtbox.x = this.x - hWidth / 2;
    this.hurtbox.y = this.y - hHeight;
    this.hurtbox.width = hWidth;
    this.hurtbox.height = hHeight;
  }

  handleDirectInput(action, opponent, particleSystem) {
    if (this.state === FIGHTER_STATES.DEFEATED) return false;

    const normAction = (action === 'SPECIAL' || action === 'SPECIAL_1') ? 'SPECIAL_1' : action;

    // 1. Instant execution with zero input latency when neutral, walking, or airborne
    if (this.state === FIGHTER_STATES.IDLE || 
        this.state === FIGHTER_STATES.WALK_FWD || 
        this.state === FIGHTER_STATES.WALK_BACK ||
        this.state === FIGHTER_STATES.FALL) {
      if (this.canAct()) {
        this.executeAction(normAction, opponent, particleSystem);
        return true;
      }
    }

    // 2. Immediate combo cancel link if currently within a valid cancel window
    if (this.checkImmediateCancel(normAction, opponent, particleSystem)) {
      return true;
    }

    // 3. Otherwise buffer input so the action registers seamlessly
    this.bufferInput(normAction);
    return false;
  }

  checkImmediateCancel(action, opponent, particleSystem) {
    const timer = this.stateTimer;
    
    // LIGHT_1 cancel window (frames 4-13)
    if (this.state === FIGHTER_STATES.LIGHT_1 && timer >= 4 && timer <= 13) {
      if (action === 'LIGHT') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, this.charData.coreColor);
        soundEngine.playCancelFlash();
        this.setState(FIGHTER_STATES.LIGHT_2);
        return true;
      } else if (action === 'HEAVY') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, '#FFD700');
        soundEngine.playCancelFlash();
        this.setState(FIGHTER_STATES.HEAVY_LAUNCHER);
        return true;
      } else if (action === 'SPECIAL' || action === 'SPECIAL_1' || action === 'SPECIAL_2') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, this.charData.coreColor);
        soundEngine.playCancelFlash();
        this.executeAction(action, opponent, particleSystem);
        return true;
      } else if (action === 'DODGE') {
        this.executeAction('DODGE', opponent, particleSystem);
        return true;
      }
    }

    // LIGHT_2 cancel window (frames 4-14)
    if (this.state === FIGHTER_STATES.LIGHT_2 && timer >= 4 && timer <= 14) {
      if (action === 'LIGHT') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, this.charData.coreColor);
        soundEngine.playCancelFlash();
        this.setState(FIGHTER_STATES.LIGHT_3);
        return true;
      } else if (action === 'HEAVY') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, '#FF0055');
        soundEngine.playCancelFlash();
        this.setState(FIGHTER_STATES.HEAVY_FINISHER);
        return true;
      } else if (action === 'SPECIAL' || action === 'SPECIAL_1' || action === 'SPECIAL_2') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, this.charData.coreColor);
        soundEngine.playCancelFlash();
        this.executeAction(action, opponent, particleSystem);
        return true;
      }
    }

    // HEAVY_1 cancel window on hit (frames 7-18)
    if (this.state === FIGHTER_STATES.HEAVY_1 && timer >= 7 && timer <= 18 && this.lastHitLanded) {
      if (action === 'SPECIAL' || action === 'SPECIAL_1' || action === 'SPECIAL_2' || action === 'ULTIMATE') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 40, this.y - 65, '#FFD700');
        soundEngine.playCancelFlash();
        this.executeAction(action, opponent, particleSystem);
        return true;
      }
    }

    // HEAVY_LAUNCHER cancel window (frames 5-17)
    if (this.state === FIGHTER_STATES.HEAVY_LAUNCHER && timer >= 5 && timer <= 17) {
      if (action === 'SPECIAL' || action === 'SPECIAL_1' || action === 'SPECIAL_2' || action === 'ULTIMATE') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x + this.facing * 38, this.y - 70, this.charData.coreColor);
        soundEngine.playCancelFlash();
        this.executeAction(action, opponent, particleSystem);
        return true;
      }
    }

    // SPECIAL_1 on hit cancel into ULTIMATE (frames 6-16)
    if (this.state === FIGHTER_STATES.SPECIAL_1 && timer >= 6 && timer <= 16 && this.lastHitLanded) {
      if (action === 'ULTIMATE') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x, this.y - 60, '#FFD700');
        soundEngine.playCancelFlash();
        this.executeAction('ULTIMATE', opponent, particleSystem);
        return true;
      }
    }

    // SPECIAL_2 on hit cancel into ULTIMATE (frames 7-18)
    if (this.state === FIGHTER_STATES.SPECIAL_2 && timer >= 7 && timer <= 18 && this.lastHitLanded) {
      if (action === 'ULTIMATE') {
        if (particleSystem) particleSystem.emitCancelFlash(this.x, this.y - 70, '#FFD700');
        soundEngine.playCancelFlash();
        this.executeAction('ULTIMATE', opponent, particleSystem);
        return true;
      }
    }

    // DODGE cancel into attacks (frames 10-14)
    if (this.state === FIGHTER_STATES.DODGE && timer >= 10 && timer <= 14) {
      if (action === 'LIGHT' || action === 'HEAVY' || action === 'SPECIAL_1' || action === 'SPECIAL') {
        this.executeAction(action === 'SPECIAL' ? 'SPECIAL_1' : action, opponent, particleSystem);
        return true;
      }
    }

    return false;
  }

  isCancelWindowOpen() {
    const t = this.stateTimer;
    if (this.state === FIGHTER_STATES.LIGHT_1 && t >= 4 && t <= 13) return true;
    if (this.state === FIGHTER_STATES.LIGHT_2 && t >= 4 && t <= 14) return true;
    if (this.state === FIGHTER_STATES.HEAVY_1 && t >= 7 && t <= 18 && this.lastHitLanded) return true;
    if (this.state === FIGHTER_STATES.HEAVY_LAUNCHER && t >= 5 && t <= 17) return true;
    if ((this.state === FIGHTER_STATES.SPECIAL_1 || this.state === FIGHTER_STATES.SPECIAL_2) && this.lastHitLanded && t >= 6 && t <= 18) return true;
    if (this.state === FIGHTER_STATES.DODGE && t >= 10 && t <= 14) return true;
    return false;
  }

  bufferInput(action) {
    if (this.state === FIGHTER_STATES.DEFEATED) return;
    const norm = (action === 'SPECIAL') ? 'SPECIAL_1' : action;
    this.inputBuffer.push({ action: norm, time: performance.now() });
    if (this.inputBuffer.length > 6) {
      this.inputBuffer.shift();
    }
  }

  consumeBufferedInput(allowedActions) {
    const now = performance.now();
    for (let i = this.inputBuffer.length - 1; i >= 0; i--) {
      const item = this.inputBuffer[i];
      const norm = (item.action === 'SPECIAL') ? 'SPECIAL_1' : item.action;
      const isAllowed = allowedActions.includes(item.action) || allowedActions.includes(norm);
      if (now - item.time <= this.bufferWindowMs && isAllowed) {
        this.inputBuffer.splice(i, 1);
        return norm;
      }
    }
    return null;
  }

  clearInputBuffer() {
    this.inputBuffer = [];
  }

  setState(newState) {
    this.state = newState;
    this.stateTimer = 0;
    this.activeHitbox = null;
    this.lastHitLanded = false;
    this.hasSuperArmor = false;

    // Reset jitter on state change
    this.jitterX = 0;
    this.jitterY = 0;

    // State-specific flags
    this.isBlocking = (newState === FIGHTER_STATES.BLOCK);
    this.isCounterActive = (newState === FIGHTER_STATES.COUNTER);
  }

  spawnProjectile(config) {
    this.pendingProjectiles.push(new Projectile({
      x: this.x + (this.facing === 1 ? (config.offsetX || 35) : -(config.offsetX || 35)),
      y: this.y + (config.offsetY || -60),
      vx: this.facing * (config.vx || 9),
      vy: config.vy || 0,
      radius: config.radius || 18,
      color: config.color || this.charData.coreColor,
      damage: config.damage || 110,
      owner: this,
      life: config.life || 75,
      homing: !!config.homing,
      type: config.type || 'sphere',
      hitStop: config.hitStop || 6,
      knockbackX: config.knockbackX || 4,
      knockbackY: config.knockbackY || -2,
      hitStun: config.hitStun || 16
    }));
  }

  // --- CAPABILITY CHECKS ---

  canMove() {
    if (this.state === FIGHTER_STATES.DEFEATED || this.state === FIGHTER_STATES.VICTORY) return false;
    if (this.isHitStunned) return false;
    if (this.state === FIGHTER_STATES.HURT || 
        this.state === FIGHTER_STATES.STUNNED || 
        this.state === FIGHTER_STATES.LAUNCHED || 
        this.state === FIGHTER_STATES.KNOCKDOWN || 
        this.state === FIGHTER_STATES.WAKEUP) return false;
    if (this.isAttacking() || this.state === FIGHTER_STATES.DODGE || this.state === FIGHTER_STATES.COUNTER || this.state === FIGHTER_STATES.BLOCK) return false;
    return this.isGrounded;
  }

  canBlock() {
    if (this.state === FIGHTER_STATES.DEFEATED || this.state === FIGHTER_STATES.VICTORY) return false;
    if (this.isHitStunned) return false;
    if (this.state === FIGHTER_STATES.HURT || 
        this.state === FIGHTER_STATES.STUNNED || 
        this.state === FIGHTER_STATES.LAUNCHED || 
        this.state === FIGHTER_STATES.KNOCKDOWN || 
        this.state === FIGHTER_STATES.WAKEUP) return false;
    if (this.isAttacking() || this.state === FIGHTER_STATES.DODGE || this.state === FIGHTER_STATES.COUNTER) return false;
    return this.isGrounded;
  }

  canAct() {
    if (this.state === FIGHTER_STATES.DEFEATED || this.state === FIGHTER_STATES.VICTORY) return false;
    if (this.isHitStunned) return false;
    if (this.state === FIGHTER_STATES.HURT || 
        this.state === FIGHTER_STATES.STUNNED || 
        this.state === FIGHTER_STATES.LAUNCHED || 
        this.state === FIGHTER_STATES.KNOCKDOWN || 
        this.state === FIGHTER_STATES.WAKEUP) return false;
    if (this.state === FIGHTER_STATES.DODGE || this.state === FIGHTER_STATES.COUNTER) return false;
    return true;
  }

  isAttacking() {
    const s = this.state;
    return (
      s === FIGHTER_STATES.LIGHT_1 ||
      s === FIGHTER_STATES.LIGHT_2 ||
      s === FIGHTER_STATES.LIGHT_3 ||
      s === FIGHTER_STATES.HEAVY_1 ||
      s === FIGHTER_STATES.HEAVY_LAUNCHER ||
      s === FIGHTER_STATES.HEAVY_FINISHER ||
      s === FIGHTER_STATES.SPECIAL_1 ||
      s === FIGHTER_STATES.SPECIAL_2 ||
      s === FIGHTER_STATES.ULTIMATE
    );
  }

  update(deltaTime, arenaWidth, opponent, particleSystem) {
    this.animFrame++;
    this.stateTimer++;
    if (this.blockFlashTimer > 0) this.blockFlashTimer--;

    // Update Cooldowns
    for (const key in this.cooldowns) {
      if (this.cooldowns[key] > 0) {
        this.cooldowns[key] = Math.max(0, this.cooldowns[key] - deltaTime);
      }
    }

    // Invulnerability timer
    if (this.invulnerableTimer > 0) {
      this.invulnerableTimer--;
      if (this.invulnerableTimer <= 0) {
        this.isInvulnerable = false;
      }
    }

    // Physics
    this.x += this.vx;
    this.y += this.vy;

    // Arena Boundaries
    const minX = 75;
    const maxX = arenaWidth - 75;
    if (this.x < minX) {
      this.x = minX;
      this.vx = 0;
    } else if (this.x > maxX) {
      this.x = maxX;
      this.vx = 0;
    }

    // Gravity & Grounding
    if (this.y < this.groundY) {
      this.vy += this.gravity;
      // Fast-fall when moving downwards for weightier jump feel
      if (this.vy > 0) {
        this.vy += this.gravity * 0.22;
      }
      this.isGrounded = false;
    } else {
      this.y = this.groundY;
      this.vy = 0;
      this.isGrounded = true;

      if (this.state === FIGHTER_STATES.FALL) {
        this.setState(FIGHTER_STATES.IDLE);
      }
    }

    // Ground Friction: Snappy, responsive deceleration (No ice-skating)
    if (this.isGrounded) {
      if (this.state === FIGHTER_STATES.IDLE || this.state === FIGHTER_STATES.BLOCK || this.state === FIGHTER_STATES.HURT) {
        this.vx *= 0.52; // Halve remaining speed every frame
        if (Math.abs(this.vx) < 0.2) this.vx = 0;
      }
    } else {
      this.vx *= 0.94;
    }

    // Micro-jitter during hitstun / hit-stop
    if (this.state === FIGHTER_STATES.HURT || this.state === FIGHTER_STATES.STUNNED) {
      this.jitterX = (Math.random() - 0.5) * 3.5;
      this.jitterY = (Math.random() - 0.5) * 2.0;
    } else {
      this.jitterX = 0;
      this.jitterY = 0;
    }

    // Update run momentum tracking
    if (this.state === FIGHTER_STATES.WALK_FWD && Math.abs(this.vx) > 0.5) {
      this.runTimer++;
      if (this.runTimer > 10) {
        this.isRunning = true;
        if (this.runTimer % 5 === 0 && particleSystem && this.isGrounded) {
          particleSystem.emitDust(this.x - this.facing * 16, this.y, 2);
        }
      }
    } else {
      this.runTimer = 0;
      this.isRunning = false;
    }

    // Turn tracking & pivot dust
    if (this.turnTimer > 0) this.turnTimer--;

    // Face Opponent when neutral or moving
    if (opponent && (this.state === FIGHTER_STATES.IDLE || this.state === FIGHTER_STATES.WALK_FWD || this.state === FIGHTER_STATES.WALK_BACK)) {
      const targetFacing = opponent.x >= this.x ? 1 : -1;
      if (targetFacing !== this.facing) {
        this.facing = targetFacing;
        this.turnTimer = 4;
        if (particleSystem && this.isGrounded) {
          particleSystem.emitDust(this.x, this.y, 4);
        }
      }
    }

    // Update Hurtbox
    this.updateHurtbox();

    // Dynamically update active hitbox position with fighter coordinates
    if (this.activeHitbox && this.activeHitbox.active) {
      this.activeHitbox.updatePosition();
      this.activeHitbox.frameTimer++;
      if (this.activeHitbox.frameTimer >= this.activeHitbox.activeFrames) {
        this.activeHitbox = null;
      }
    }

    // State Execution & Frame Data
    this.handleStateMachine(opponent, particleSystem);
  }

  handleStateMachine(opponent, particleSystem) {
    const timer = this.stateTimer;

    switch (this.state) {
      case FIGHTER_STATES.IDLE:
      case FIGHTER_STATES.WALK_FWD:
      case FIGHTER_STATES.WALK_BACK: {
        const buffered = this.consumeBufferedInput([
          'LIGHT', 'HEAVY', 'SPECIAL_1', 'SPECIAL_2', 'ULTIMATE', 'DODGE', 'COUNTER'
        ]);
        if (buffered) {
          this.executeAction(buffered, opponent, particleSystem);
        }
        break;
      }

      // --- 1. LIGHT ATTACK 1 ---
      case FIGHTER_STATES.LIGHT_1: {
        this.executeLight1(timer, opponent, particleSystem);
        break;
      }

      // --- 2. LIGHT ATTACK 2 ---
      case FIGHTER_STATES.LIGHT_2: {
        this.executeLight2(timer, opponent, particleSystem);
        break;
      }

      // --- 3. LIGHT ATTACK 3 ---
      case FIGHTER_STATES.LIGHT_3: {
        this.executeLight3(timer, opponent, particleSystem);
        break;
      }

      // --- 4. RAW HEAVY ATTACK ---
      case FIGHTER_STATES.HEAVY_1: {
        this.executeHeavy1(timer, opponent, particleSystem);
        break;
      }

      // --- 5. HEAVY LAUNCHER ---
      case FIGHTER_STATES.HEAVY_LAUNCHER: {
        this.executeHeavyLauncher(timer, opponent, particleSystem);
        break;
      }

      // --- 6. HEAVY FINISHER SLAM ---
      case FIGHTER_STATES.HEAVY_FINISHER: {
        this.executeHeavyFinisher(timer, opponent, particleSystem);
        break;
      }

      // --- 7. SPECIAL 1 ---
      case FIGHTER_STATES.SPECIAL_1: {
        this.executeSpecial1(timer, opponent, particleSystem);
        break;
      }

      // --- 8. SPECIAL 2 ---
      case FIGHTER_STATES.SPECIAL_2: {
        this.executeSpecial2(timer, opponent, particleSystem);
        break;
      }

      // --- 9. ULTIMATE ---
      case FIGHTER_STATES.ULTIMATE: {
        this.executeUltimate(timer, opponent, particleSystem);
        break;
      }

      // --- 10. DEFENSIVE ACTIONS ---
      case FIGHTER_STATES.BLOCK: {
        this.isBlocking = true;
        break;
      }

      case FIGHTER_STATES.COUNTER: {
        if (timer <= 13) {
          this.isCounterActive = true;
        } else {
          this.isCounterActive = false;
          if (timer >= 20) {
            this.setState(FIGHTER_STATES.IDLE);
          }
        }
        break;
      }

      case FIGHTER_STATES.DODGE: {
        this.executeDodge(timer, opponent, particleSystem);
        break;
      }

      // --- 11. HIT REACTIONS ---
      case FIGHTER_STATES.HURT: {
        this.activeHitbox = null;
        if (timer >= this.hitStunTimer) {
          this.isHitStunned = false;
          this.setState(FIGHTER_STATES.IDLE);
        }
        break;
      }

      case FIGHTER_STATES.STUNNED: {
        this.activeHitbox = null;
        if (timer >= this.hitStunTimer) {
          this.isHitStunned = false;
          this.setState(FIGHTER_STATES.IDLE);
        }
        break;
      }

      case FIGHTER_STATES.LAUNCHED: {
        this.activeHitbox = null;
        if (this.isGrounded && timer > 6) {
          this.setState(FIGHTER_STATES.KNOCKDOWN);
        }
        break;
      }

      case FIGHTER_STATES.KNOCKDOWN: {
        this.activeHitbox = null;
        if (timer >= 26) {
          this.setState(FIGHTER_STATES.WAKEUP);
        }
        break;
      }

      case FIGHTER_STATES.WAKEUP: {
        this.isInvulnerable = true;
        this.invulnerableTimer = 16;
        if (timer >= 16) {
          this.setState(FIGHTER_STATES.IDLE);
        }
        break;
      }

      case FIGHTER_STATES.DEFEATED: {
        this.activeHitbox = null;
        this.vx = 0;
        break;
      }

      case FIGHTER_STATES.VICTORY: {
        this.activeHitbox = null;
        this.vx = 0;
        break;
      }
    }
  }

  // --- CHARACTER-SPECIFIC ATTACK & ABILITY EXECUTIONS ---

  executeLight1(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      if (timer === 4) {
        this.spawnHitbox({ width: 72, height: 50, offsetX: 26, offsetY: -62, damage: 42, hitStop: 7, knockbackX: 3.8, knockbackY: -0.5, hitStun: 18 });
        soundEngine.playBluntImpact(false);
        particleSystem.emitBurst(this.x + this.facing * 38, this.y - 62, color, 28);
      }
      if (timer >= 5 && timer <= 14) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 17) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 2) {
        this.spawnHitbox({ width: 58, height: 40, offsetX: 22, offsetY: -62, damage: 28, hitStop: 4, knockbackX: 2.2, knockbackY: 0, hitStun: 15 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 32, this.y - 62, this.facing, color, 48, -0.6, 0.6);
      }
      if (timer >= 3 && timer <= 12) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 13) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 4) {
        this.spawnHitbox({ width: 95, height: 38, offsetX: 35, offsetY: -60, damage: 36, hitStop: 5, knockbackX: 4.5, knockbackY: 0, hitStun: 18 });
        soundEngine.playSlash(false);
        particleSystem.emitSparks(this.x + this.facing * 70, this.y - 60, 6, color, 4);
      }
      if (timer >= 5 && timer <= 13) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 16) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 4) {
        this.spawnHitbox({ width: 90, height: 42, offsetX: 35, offsetY: -62, damage: 35, hitStop: 5, knockbackX: 3.8, knockbackY: 0, hitStun: 18 });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitSlashArc(this.x + this.facing * 50, this.y - 62, this.facing, color, 65, -0.4, 0.4);
      }
      if (timer >= 5 && timer <= 14) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 17) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 3) {
        this.spawnHitbox({ width: 68, height: 44, offsetX: 25, offsetY: -62, damage: 35, hitStop: 5, knockbackX: 3.5, knockbackY: 0, hitStun: 17 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 62, this.facing, color, 52, -0.5, 0.5);
      }
      if (timer >= 4 && timer <= 13) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 16) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex (Default)
      if (timer === 3) {
        this.spawnHitbox({ width: 65, height: 44, offsetX: 24, offsetY: -65, damage: 34, hitStop: 5, knockbackX: 3.2, knockbackY: -0.5, hitStun: 17 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 62, this.facing, color, 52, -0.5, 0.5);
      }
      if (timer >= 4 && timer <= 13) this.handleLight1Cancel(opponent, particleSystem);
      if (timer >= 16) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  handleLight1Cancel(opponent, particleSystem) {
    const cancel = this.consumeBufferedInput(['LIGHT', 'HEAVY', 'SPECIAL', 'SPECIAL_1', 'SPECIAL_2', 'DODGE']);
    if (cancel === 'LIGHT') {
      particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, this.charData.coreColor);
      soundEngine.playCancelFlash();
      this.setState(FIGHTER_STATES.LIGHT_2);
    } else if (cancel === 'HEAVY') {
      particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, '#FFD700');
      soundEngine.playCancelFlash();
      this.setState(FIGHTER_STATES.HEAVY_LAUNCHER);
    } else if (cancel === 'SPECIAL' || cancel === 'SPECIAL_1' || cancel === 'SPECIAL_2') {
      particleSystem.emitCancelFlash(this.x + this.facing * 30, this.y - 60, this.charData.coreColor);
      soundEngine.playCancelFlash();
      this.executeAction(cancel, opponent, particleSystem);
    } else if (cancel === 'DODGE') {
      this.executeAction('DODGE', opponent, particleSystem);
    }
  }

  executeLight2(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      if (timer === 4) {
        this.spawnHitbox({ width: 76, height: 54, offsetX: 28, offsetY: -58, damage: 52, hitStop: 8, knockbackX: 4.8, knockbackY: -0.8, hitStun: 20 });
        soundEngine.playBluntImpact(true);
        particleSystem.emitBurst(this.x + this.facing * 42, this.y - 58, color, 34);
      }
      if (timer >= 5 && timer <= 15) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 18) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 2) {
        this.spawnHitbox({ width: 62, height: 42, offsetX: 24, offsetY: -62, damage: 36, hitStop: 5, knockbackX: 3.5, knockbackY: -0.5, hitStun: 16 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 36, this.y - 62, this.facing, color, 54, 0.7, -0.7);
      }
      if (timer >= 3 && timer <= 13) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 14) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 4) {
        this.spawnHitbox({ width: 98, height: 48, offsetX: 32, offsetY: -62, damage: 46, hitStop: 6, knockbackX: 5.5, knockbackY: -1.0, hitStun: 19 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 60, this.y - 62, this.facing, color, 72, 0.6, -0.6);
      }
      if (timer >= 5 && timer <= 14) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 17) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 4) {
        this.spawnHitbox({ width: 95, height: 45, offsetX: 36, offsetY: -60, damage: 45, hitStop: 6, knockbackX: 4.8, knockbackY: -0.5, hitStun: 19 });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitSlashArc(this.x + this.facing * 55, this.y - 60, this.facing, color, 70, 0.5, -0.5);
      }
      if (timer >= 5 && timer <= 15) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 18) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 3) {
        this.spawnHitbox({ width: 72, height: 48, offsetX: 28, offsetY: -64, damage: 45, hitStop: 6, knockbackX: 4.6, knockbackY: -0.8, hitStun: 18 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 38, this.y - 64, this.facing, color, 58, 0.7, -0.7);
      }
      if (timer >= 4 && timer <= 14) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 17) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 3) {
        this.spawnHitbox({ width: 70, height: 48, offsetX: 26, offsetY: -66, damage: 44, hitStop: 6, knockbackX: 4.5, knockbackY: -1.0, hitStun: 18 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 40, this.y - 66, this.facing, color, 58, 0.7, -0.7);
      }
      if (timer >= 4 && timer <= 14) this.handleLight2Cancel(opponent, particleSystem);
      if (timer >= 17) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  handleLight2Cancel(opponent, particleSystem) {
    const cancel = this.consumeBufferedInput(['LIGHT', 'HEAVY', 'SPECIAL', 'SPECIAL_1', 'SPECIAL_2']);
    if (cancel === 'LIGHT') {
      particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, this.charData.coreColor);
      soundEngine.playCancelFlash();
      this.setState(FIGHTER_STATES.LIGHT_3);
    } else if (cancel === 'HEAVY') {
      particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, '#FF0055');
      soundEngine.playCancelFlash();
      this.setState(FIGHTER_STATES.HEAVY_FINISHER);
    } else if (cancel === 'SPECIAL' || cancel === 'SPECIAL_1' || cancel === 'SPECIAL_2') {
      particleSystem.emitCancelFlash(this.x + this.facing * 35, this.y - 62, this.charData.coreColor);
      soundEngine.playCancelFlash();
      this.executeAction(cancel, opponent, particleSystem);
    }
  }

  executeLight3(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      if (timer === 5) {
        this.spawnHitbox({ width: 92, height: 68, offsetX: 34, offsetY: -55, damage: 86, hitStop: 11, knockbackX: 9.2, knockbackY: 3.5, hitStun: 28, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitShockwave(this.x + this.facing * 45, this.y, color, 100);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 50, color, 45);
      }
      if (timer >= 23) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 3) {
        this.spawnHitbox({ width: 62, height: 42, offsetX: 25, offsetY: -62, damage: 24, hitStop: 4, knockbackX: 1.5, knockbackY: 0, hitStun: 14 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 62, this.facing, color, 50, -0.8, 0.8);
      }
      if (timer === 6) {
        this.spawnHitbox({ width: 66, height: 44, offsetX: 26, offsetY: -62, damage: 24, hitStop: 4, knockbackX: 1.5, knockbackY: 0, hitStun: 14 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 62, this.facing, color, 55, 0.8, -0.8);
      }
      if (timer === 9) {
        this.spawnHitbox({ width: 78, height: 50, offsetX: 28, offsetY: -62, damage: 45, hitStop: 7, knockbackX: 8.5, knockbackY: -2.5, hitStun: 24, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 62, color, 40);
      }
      if (timer >= 18) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 5) {
        this.spawnHitbox({ width: 105, height: 55, offsetX: 32, offsetY: -60, damage: 74, hitStop: 8, knockbackX: 9.5, knockbackY: -3.0, hitStun: 26, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 60, this.y - 60, this.facing, color, 85, -1.2, 1.2);
        particleSystem.emitBurst(this.x + this.facing * 60, this.y - 60, color, 40);
      }
      if (timer >= 21) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 5) {
        // Chain Coil Wrap: negative knockback pulls target closer!
        this.spawnHitbox({ width: 105, height: 52, offsetX: 38, offsetY: -60, damage: 75, hitStop: 8, knockbackX: -3.5, knockbackY: -1.5, hitStun: 26, isHeavy: true });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitSlashArc(this.x + this.facing * 65, this.y - 60, this.facing, color, 80, -1.0, 1.0);
        particleSystem.emitBurst(this.x + this.facing * 65, this.y - 60, color, 42);
      }
      if (timer >= 22) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 4) {
        this.spawnHitbox({ width: 86, height: 58, offsetX: 32, offsetY: -62, damage: 76, hitStop: 8, knockbackX: 9.6, knockbackY: -3.2, hitStun: 26, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 45, this.y - 62, this.facing, color, 76, -1.1, 1.1);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 62, color, 42);
      }
      if (timer >= 21) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 4) {
        this.spawnHitbox({ width: 84, height: 58, offsetX: 32, offsetY: -62, damage: 72, hitStop: 8, knockbackX: 9.8, knockbackY: -3.5, hitStun: 25, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 48, this.y - 62, this.facing, color, 75, -1.1, 1.1);
        particleSystem.emitBurst(this.x + this.facing * 50, this.y - 62, color, 38);
      }
      if (timer >= 20) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  executeHeavy1(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      // SUPER ARMOR frames 3-12!
      if (timer >= 3 && timer <= 12) {
        this.hasSuperArmor = true;
      } else {
        this.hasSuperArmor = false;
      }
      if (timer === 8) {
        this.spawnHitbox({ width: 98, height: 78, offsetX: 36, offsetY: -64, damage: 120, hitStop: 14, knockbackX: 13.5, knockbackY: -3.0, hitStun: 35, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitBurst(this.x + this.facing * 52, this.y - 64, color, 60);
        particleSystem.emitShockwave(this.x + this.facing * 52, this.y - 64, '#FFD700', 85);
      }
      if (timer >= 9 && timer <= 20 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 28) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 4) this.vx = this.facing * 8;
      if (timer === 5) {
        this.spawnHitbox({ width: 78, height: 60, offsetX: 28, offsetY: -65, damage: 82, hitStop: 8, knockbackX: 8.0, knockbackY: -3.0, hitStun: 26, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 42, this.y - 65, this.facing, color, 70, -1.2, 1.2);
      }
      if (timer >= 6 && timer <= 16 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 20) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 6) {
        this.spawnHitbox({ width: 110, height: 68, offsetX: 40, offsetY: -62, damage: 94, hitStop: 10, knockbackX: 9.8, knockbackY: -3.5, hitStun: 28, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitBurst(this.x + this.facing * 60, this.y - 62, color, 48);
        particleSystem.emitShockwave(this.x + this.facing * 60, this.y, color, 80);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 7) {
        this.spawnHitbox({ width: 112, height: 68, offsetX: 40, offsetY: -65, damage: 95, hitStop: 10, knockbackX: 10.0, knockbackY: -3.5, hitStun: 29, isHeavy: true });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitBurst(this.x + this.facing * 65, this.y - 65, color, 50);
        particleSystem.emitShockwave(this.x + this.facing * 65, this.y, color, 85);
      }
      if (timer >= 8 && timer <= 19 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 26) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 6) {
        this.spawnHitbox({ width: 92, height: 74, offsetX: 36, offsetY: -66, damage: 92, hitStop: 10, knockbackX: 9.4, knockbackY: -3.8, hitStun: 28, isHeavy: true });
        soundEngine.playSpecial('nox', 0);
        particleSystem.emitBurst(this.x + this.facing * 50, this.y - 66, color, 48);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 6) {
        this.spawnHitbox({ width: 88, height: 72, offsetX: 34, offsetY: -65, damage: 90, hitStop: 10, knockbackX: 9.2, knockbackY: -3.8, hitStun: 28, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitBurst(this.x + this.facing * 50, this.y - 65, color, 44);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  handleHeavyCancel(opponent, particleSystem) {
    const cancel = this.consumeBufferedInput(['SPECIAL_1', 'SPECIAL_2', 'ULTIMATE']);
    if (cancel) {
      particleSystem.emitCancelFlash(this.x + this.facing * 40, this.y - 65, '#FFD700');
      soundEngine.playCancelFlash();
      this.executeAction(cancel, opponent, particleSystem);
    }
  }

  executeHeavyLauncher(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      if (timer >= 2 && timer <= 9) this.hasSuperArmor = true;
      else this.hasSuperArmor = false;

      if (timer === 5) {
        this.spawnHitbox({ width: 88, height: 88, offsetX: 30, offsetY: -78, damage: 88, hitStop: 9, knockbackX: 4.5, knockbackY: -13.0, hitStun: 34, isLauncher: true, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 75, color, 48);
      }
      if (timer >= 6 && timer <= 18) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 3) {
        this.spawnHitbox({ width: 72, height: 78, offsetX: 25, offsetY: -75, damage: 65, hitStop: 7, knockbackX: 3.8, knockbackY: -12.5, hitStun: 30, isLauncher: true, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 70, this.facing, color, 66, 1.2, -1.2);
      }
      if (timer >= 4 && timer <= 16) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 19) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 4) {
        this.spawnHitbox({ width: 92, height: 80, offsetX: 34, offsetY: -75, damage: 70, hitStop: 8, knockbackX: 4.8, knockbackY: -11.5, hitStun: 31, isLauncher: true, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 45, this.y - 70, this.facing, color, 74, 1.0, -1.0);
      }
      if (timer >= 5 && timer <= 17) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 22) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 5) {
        this.spawnHitbox({ width: 88, height: 85, offsetX: 32, offsetY: -78, damage: 72, hitStop: 8, knockbackX: 4.5, knockbackY: -12.0, hitStun: 32, isLauncher: true, isHeavy: true });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 75, color, 45);
      }
      if (timer >= 6 && timer <= 18) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 23) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 5) {
        this.spawnHitbox({ width: 82, height: 82, offsetX: 30, offsetY: -78, damage: 70, hitStop: 8, knockbackX: 4.8, knockbackY: -13.0, hitStun: 33, isLauncher: true, isHeavy: true });
        soundEngine.playSpecial('nox', 0);
        particleSystem.emitBurst(this.x + this.facing * 38, this.y - 75, color, 46);
      }
      if (timer >= 6 && timer <= 18) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 23) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 4) {
        this.spawnHitbox({ width: 80, height: 78, offsetX: 28, offsetY: -76, damage: 68, hitStop: 8, knockbackX: 5.0, knockbackY: -11.0, hitStun: 32, isLauncher: true, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 38, this.y - 70, this.facing, '#FFD700', 68, 1.0, -1.0);
      }
      if (timer >= 5 && timer <= 17) this.handleHeavyCancel(opponent, particleSystem);
      if (timer >= 22) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  executeHeavyFinisher(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;

    if (charId === 'solaris') {
      if (timer === 2) this.vy = -5.0;
      if (timer === 7) {
        this.spawnHitbox({ width: 115, height: 75, offsetX: 38, offsetY: -42, damage: 125, hitStop: 13, knockbackX: 9.5, knockbackY: 5.0, hitStun: 32, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitShockwave(this.x + this.facing * 50, this.y, color, 130);
        particleSystem.emitBurst(this.x + this.facing * 50, this.y - 42, color, 62);
      }
      if (timer >= 27) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 2) this.vy = -6.0;
      if (timer === 5) {
        this.spawnHitbox({ width: 82, height: 65, offsetX: 30, offsetY: -48, damage: 92, hitStop: 9, knockbackX: 7.5, knockbackY: 4.5, hitStun: 28, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitBurst(this.x + this.facing * 35, this.y - 48, color, 45);
      }
      if (timer >= 20) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 5) {
        this.spawnHitbox({ width: 102, height: 50, offsetX: 36, offsetY: -38, damage: 96, hitStop: 10, knockbackX: 8.5, knockbackY: 3.8, hitStun: 29, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitShockwave(this.x + this.facing * 45, this.y, color, 100);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 38, color, 45);
      }
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 6) {
        this.spawnHitbox({ width: 104, height: 62, offsetX: 38, offsetY: -45, damage: 100, hitStop: 11, knockbackX: 8.8, knockbackY: 4.2, hitStun: 30, isHeavy: true });
        soundEngine.playSpecial('kairo', 0);
        particleSystem.emitShockwave(this.x + this.facing * 45, this.y, color, 110);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 45, color, 50);
      }
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 2) this.vy = -5.0;
      if (timer === 6) {
        this.spawnHitbox({ width: 98, height: 68, offsetX: 35, offsetY: -45, damage: 102, hitStop: 11, knockbackX: 8.4, knockbackY: 4.2, hitStun: 30, isHeavy: true });
        soundEngine.playSpecial('nox', 0);
        particleSystem.emitShockwave(this.x + this.facing * 40, this.y, color, 105);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 45, color, 52);
      }
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 2) this.vy = -4.5;
      if (timer === 5) {
        this.spawnHitbox({ width: 96, height: 68, offsetX: 36, offsetY: -45, damage: 98, hitStop: 11, knockbackX: 8.2, knockbackY: 4.0, hitStun: 30, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitShockwave(this.x + this.facing * 45, this.y, color, 115);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 45, color, 52);
      }
      if (timer >= 23) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  executeSpecial1(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;
    const ability = this.charData.abilities[0];

    if (charId === 'solaris') {
      // Solar Shockwave: Gauntlet Ground Pound Area Denial
      if (timer === 5) {
        soundEngine.playSpecial('solaris', 0);
        this.spawnHitbox({ width: 145, height: 60, offsetX: 35, offsetY: -45, damage: ability.damage, hitStop: 10, knockbackX: 11.0, knockbackY: -4.0, hitStun: 30, isHeavy: true });
        particleSystem.emitShockwave(this.x + this.facing * 60, this.y, color, 130);
        particleSystem.emitBurst(this.x + this.facing * 60, this.y - 30, color, 55);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      // Shadowstep: Teleport behind opponent with precision backstab
      if (timer === 1) {
        soundEngine.playSpecial('lyra', 0);
        particleSystem.emitBurst(this.x, this.y - 50, color, 35);
      }
      if (timer === 3 && opponent) {
        this.x = opponent.x - opponent.facing * 50;
        this.facing = opponent.facing;
        particleSystem.emitBurst(this.x, this.y - 50, color, 25);
      }
      if (timer === 5) {
        this.spawnHitbox({ width: 75, height: 50, offsetX: 24, offsetY: -60, damage: ability.damage, hitStop: 9, knockbackX: 7.0, knockbackY: -1.0, hitStun: 28, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 60, this.facing, color, 60, -0.6, 0.6);
      }
      if (timer >= 6 && timer <= 16 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 18) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      // Kinetic Sphere: Projectile Displace
      if (timer === 3) {
        soundEngine.playSpecial('aeron', 0);
        this.spawnProjectile({ offsetX: 35, offsetY: -55, vx: 9, vy: 0, radius: 18, color, damage: ability.damage, hitStop: 7, knockbackX: 6.0, knockbackY: -2.0, hitStun: 22 });
        particleSystem.emitShockwave(this.x + this.facing * 35, this.y - 55, color, 55);
      }
      if (timer >= 5 && timer <= 16 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 20) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      // Chain Harpoon: Long range snag and pull opponent
      if (timer === 4) {
        soundEngine.playSpecial('kairo', 0);
        this.spawnHitbox({ width: 180, height: 45, offsetX: 35, offsetY: -60, damage: ability.damage, hitStop: 10, knockbackX: -14.0, knockbackY: -1.0, hitStun: 34, isHeavy: true });
        particleSystem.emitSlashArc(this.x + this.facing * 80, this.y - 60, this.facing, color, 95, -0.15, 0.15);
      }
      if (timer >= 6 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      // Void Crescent: Homing curved projectile
      if (timer === 3) {
        soundEngine.playSpecial('nox', 0);
        this.spawnProjectile({ offsetX: 30, offsetY: -55, vx: 8.5, vy: 0, radius: 20, color, damage: ability.damage, homing: true, type: 'crescent', hitStop: 8, knockbackX: 6.0, knockbackY: -2.0, hitStun: 24 });
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 55, this.facing, color, 60, -0.7, 0.7);
      }
      if (timer >= 5 && timer <= 16 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 21) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex: Crimson Dash
      if (timer === 3) {
        soundEngine.playSpecial('vex', 0);
        this.vx = this.facing * 20;
        this.spawnHitbox({ width: 100, height: 50, offsetX: 32, offsetY: -60, damage: ability.damage, hitStop: 9, knockbackX: 8.5, knockbackY: -2.0, hitStun: 26, isHeavy: true });
        particleSystem.emitSlashArc(this.x + this.facing * 52, this.y - 60, this.facing, color, 68, -0.2, 0.2);
        particleSystem.emitShockwave(this.x, this.y - 50, color, 75);
      }
      if (timer >= 6 && timer <= 16 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 20) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  executeSpecial2(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;
    const ability = this.charData.abilities[1];

    if (charId === 'solaris') {
      // Meteor Charge: Armored Rush Tackle
      if (timer >= 1 && timer <= 18) this.hasSuperArmor = true;
      else this.hasSuperArmor = false;

      if (timer === 4) this.vx = this.facing * 18;
      if (timer === 6) {
        this.spawnHitbox({ width: 120, height: 68, offsetX: 30, offsetY: -60, damage: ability.damage, hitStop: 12, knockbackX: 14.5, knockbackY: -2.5, hitStun: 35, isHeavy: true });
        soundEngine.playBluntImpact(true);
        particleSystem.emitShockwave(this.x, this.y - 50, color, 85);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      // Petal Tempest: Multi-hit advancing blade cyclone
      if (timer >= 2 && timer <= 12) this.vx = this.facing * 5.5;
      if (timer === 3 || timer === 6 || timer === 9) {
        this.spawnHitbox({ width: 75, height: 50, offsetX: 25, offsetY: -60, damage: 28, hitStop: 4, knockbackX: 2.0, knockbackY: -0.5, hitStun: 14 });
        soundEngine.playSlash(false);
        particleSystem.emitSlashArc(this.x + this.facing * 35, this.y - 60, this.facing, color, 60, -0.8, 0.8);
      }
      if (timer === 12) {
        this.spawnHitbox({ width: 85, height: 55, offsetX: 28, offsetY: -60, damage: 75, hitStop: 9, knockbackX: 8.5, knockbackY: -2.5, hitStun: 26, isHeavy: true });
        soundEngine.playSlash(true);
        particleSystem.emitBurst(this.x + this.facing * 45, this.y - 60, color, 45);
      }
      if (timer >= 13 && timer <= 19 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 22) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      // Vaulting Tempest: Pole vault kicks to staff crash
      if (timer === 2) {
        soundEngine.playSpecial('aeron', 1);
        this.vy = -12;
        this.vx = this.facing * 5;
      }
      if (timer === 5) {
        this.spawnHitbox({ width: 80, height: 60, offsetX: 28, offsetY: -75, damage: 65, hitStop: 6, knockbackX: 4.5, knockbackY: -4.0, hitStun: 20 });
      }
      if (timer === 12) {
        this.spawnHitbox({ width: 98, height: 70, offsetX: 32, offsetY: -50, damage: 95, hitStop: 10, knockbackX: 8.5, knockbackY: 4.0, hitStun: 30, isHeavy: true });
        particleSystem.emitShockwave(this.x + this.facing * 40, this.y, color, 90);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 45, color, 45);
      }
      if (timer >= 14 && timer <= 22 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 26) this.setState(this.isGrounded ? FIGHTER_STATES.IDLE : FIGHTER_STATES.FALL);
    } else if (charId === 'kairo') {
      // Venom Whirl: 360 floor sweep knockdown
      if (timer === 4) {
        soundEngine.playSpecial('kairo', 1);
        this.spawnHitbox({ width: 125, height: 44, offsetX: -20, offsetY: -35, damage: ability.damage, hitStop: 10, knockbackX: 6.5, knockbackY: -7.0, hitStun: 34, isLauncher: true, isHeavy: true });
        particleSystem.emitShockwave(this.x, this.y, color, 110);
        particleSystem.emitBurst(this.x, this.y - 20, color, 45);
      }
      if (timer >= 6 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 25) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      // Dark Rift Trap: Singular gravity well
      if (timer === 3) {
        soundEngine.playSpecial('nox', 1);
        this.spawnHitbox({ width: 100, height: 70, offsetX: 55, offsetY: -40, damage: ability.damage, hitStop: 11, knockbackX: 3.0, knockbackY: -10.0, hitStun: 32, isLauncher: true, isHeavy: true });
        particleSystem.emitShockwave(this.x + this.facing * 75, this.y, color, 95);
        particleSystem.emitBurst(this.x + this.facing * 75, this.y - 35, color, 50);
      }
      if (timer >= 6 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 24) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex: Rift Slash
      if (timer === 3) {
        soundEngine.playSpecial('vex', 1);
        this.vy = -13;
        this.vx = this.facing * 6;
        this.spawnHitbox({ width: 90, height: 80, offsetX: 28, offsetY: -75, damage: ability.damage, hitStop: 10, knockbackX: 7.2, knockbackY: -9.5, hitStun: 32, isLauncher: true, isHeavy: true });
        particleSystem.emitSlashArc(this.x + this.facing * 40, this.y - 72, this.facing, color, 78, 1.2, -1.2);
        particleSystem.emitBurst(this.x + this.facing * 40, this.y - 72, color, 48);
      }
      if (timer >= 7 && timer <= 18 && this.lastHitLanded) this.handleSpecialCancel(opponent, particleSystem);
      if (timer >= 26) this.setState(this.isGrounded ? FIGHTER_STATES.IDLE : FIGHTER_STATES.FALL);
    }
  }

  handleSpecialCancel(opponent, particleSystem) {
    const cancel = this.consumeBufferedInput(['ULTIMATE']);
    if (cancel) {
      particleSystem.emitCancelFlash(this.x, this.y - 65, '#FFD700');
      soundEngine.playCancelFlash();
      this.executeAction('ULTIMATE', opponent, particleSystem);
    }
  }

  executeUltimate(timer, opponent, particleSystem) {
    const charId = this.charId;
    const color = this.charData.coreColor;
    const ultimate = this.charData.abilities[2];

    if (charId === 'solaris') {
      if (timer === 1) {
        soundEngine.playUltimate('solaris');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'SOLAR CATACLYSM!', 'crit');
        this.vy = -15;
      }
      if (timer === 17) this.y = this.groundY;
      if (timer === 18) {
        this.spawnHitbox({ width: 260, height: 160, offsetX: 10, offsetY: -95, damage: ultimate.damage, hitStop: 24, knockbackX: 16, knockbackY: -10, hitStun: 48, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitBurst(this.x, this.y - 70, color, 140);
        particleSystem.emitShockwave(this.x, this.y - 70, '#FFFFFF', 180);
      }
      if (timer >= 48) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'lyra') {
      if (timer === 1) {
        soundEngine.playUltimate('lyra');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'PHANTOM FRENZY!', 'crit');
      }
      if (timer === 10 || timer === 14 || timer === 18) {
        particleSystem.emitSlashArc(this.x + (Math.random() - 0.5) * 80, this.y - 60, this.facing, color, 75, -0.6, 0.6);
      }
      if (timer === 22) {
        this.spawnHitbox({ width: 230, height: 140, offsetX: 10, offsetY: -90, damage: ultimate.damage, hitStop: 22, knockbackX: 14, knockbackY: -8, hitStun: 45, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitBurst(this.x + this.facing * 60, this.y - 60, color, 130);
        particleSystem.emitShockwave(this.x + this.facing * 60, this.y - 60, '#FFFFFF', 160);
      }
      if (timer >= 46) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'aeron') {
      if (timer === 1) {
        soundEngine.playUltimate('aeron');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'SKY WARDEN!', 'crit');
      }
      if (timer === 14) particleSystem.emitBurst(this.x + this.facing * 60, this.y - 60, color, 60);
      if (timer === 18) particleSystem.emitBurst(this.x + this.facing * 120, this.y - 60, color, 60);
      if (timer === 22) particleSystem.emitBurst(this.x + this.facing * 180, this.y - 60, color, 60);
      if (timer === 24) {
        this.spawnHitbox({ width: 235, height: 140, offsetX: 15, offsetY: -90, damage: ultimate.damage, hitStop: 22, knockbackX: 15, knockbackY: -9, hitStun: 45, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitShockwave(this.x + this.facing * 70, this.y - 70, color, 170);
        particleSystem.emitBurst(this.x + this.facing * 70, this.y - 70, '#FFFFFF', 120);
      }
      if (timer >= 48) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'kairo') {
      if (timer === 1) {
        soundEngine.playUltimate('kairo');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'HELLBOUND CHAIN!', 'crit');
      }
      if (timer === 12 && opponent) opponent.vy = -12;
      if (timer === 18) {
        this.spawnHitbox({ width: 240, height: 150, offsetX: 15, offsetY: -95, damage: ultimate.damage, hitStop: 22, knockbackX: 15, knockbackY: -9, hitStun: 45, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitBurst(this.x + this.facing * 70, this.y - 70, color, 135);
        particleSystem.emitShockwave(this.x + this.facing * 70, this.y - 70, '#FFFFFF', 165);
      }
      if (timer >= 48) this.setState(FIGHTER_STATES.IDLE);
    } else if (charId === 'nox') {
      if (timer === 1) {
        soundEngine.playUltimate('nox');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'EVENT HORIZON!', 'crit');
      }
      if (timer === 16) {
        this.spawnHitbox({ width: 250, height: 160, offsetX: 15, offsetY: -95, damage: ultimate.damage, hitStop: 24, knockbackX: 16, knockbackY: -10, hitStun: 48, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitBurst(this.x + this.facing * 70, this.y - 70, color, 140);
        particleSystem.emitShockwave(this.x + this.facing * 70, this.y - 70, '#FFFFFF', 175);
      }
      if (timer >= 48) this.setState(FIGHTER_STATES.IDLE);
    } else {
      // Vex
      if (timer === 1) {
        soundEngine.playUltimate('vex');
        particleSystem.emitShockwave(this.x, this.y - 60, color, 210);
        particleSystem.emitDamageText(this.x, this.y - 90, 'RIFT BREAKER!', 'crit');
      }
      if (timer === 14) {
        this.vx = this.facing * 24;
        particleSystem.emitSlashArc(this.x, this.y - 60, this.facing, '#FFFFFF', 95, -0.4, 0.4);
      }
      if (timer === 18) {
        this.spawnHitbox({ width: 230, height: 135, offsetX: 20, offsetY: -95, damage: ultimate.damage, hitStop: 22, knockbackX: 14, knockbackY: -9, hitStun: 45, isUltimate: true, isHeavy: true, isLauncher: true });
        particleSystem.emitBurst(this.x + this.facing * 80, this.y - 70, color, 125);
        particleSystem.emitShockwave(this.x + this.facing * 80, this.y - 70, '#FFFFFF', 165);
      }
      if (timer >= 46) this.setState(FIGHTER_STATES.IDLE);
    }
  }

  executeDodge(timer, opponent, particleSystem) {
    const charId = this.charId;

    if (charId === 'nox') {
      // Ethereal Void Blink
      this.vx = this.facing * 18 * Math.exp(-timer * 0.22);
      this.isInvulnerable = (timer <= 10);
      if (timer % 3 === 0) particleSystem.emitSparks(this.x, this.y - 45, 2, this.charData.coreColor, 2);
    } else if (charId === 'lyra') {
      // Phase Agility: extended invulnerability window (frames 1-12)
      this.vx = this.facing * 18 * Math.exp(-timer * 0.18);
      this.isInvulnerable = (timer <= 12);
    } else if (charId === 'solaris') {
      // Heavy Armored Duck / Weave
      this.vx = this.facing * 12 * Math.exp(-timer * 0.25);
      this.isInvulnerable = (timer <= 8);
    } else {
      // Standard combat dodge
      this.vx = this.facing * 16 * Math.exp(-timer * 0.2);
      this.isInvulnerable = (timer <= 10);
    }

    if (timer >= 10 && timer <= 14) {
      const cancel = this.consumeBufferedInput(['LIGHT', 'HEAVY', 'SPECIAL_1']);
      if (cancel) {
        this.executeAction(cancel, opponent, particleSystem);
        return;
      }
    }

    if (timer >= 14) {
      this.setState(FIGHTER_STATES.IDLE);
    }
  }

  spawnHitbox(config) {
    const rawOffsetX = config.offsetX !== undefined ? config.offsetX : 0;
    // Close-quarters / point-blank hit reliability:
    // Expand root of hitbox inward into the fighter's own body by up to 24px so attacks never whiff at point blank
    const rootInset = Math.min(rawOffsetX, 24);
    const adjustedOffsetX = rawOffsetX - rootInset;
    const adjustedWidth = config.width + rootInset;

    this.activeHitbox = new Hitbox({
      x: this.x + (this.facing === 1 ? adjustedOffsetX : -adjustedOffsetX - adjustedWidth),
      y: this.y + (config.offsetY || -60),
      width: adjustedWidth,
      height: config.height,
      offsetX: adjustedOffsetX,
      offsetY: config.offsetY || -60,
      activeFrames: config.activeFrames || 7,
      damage: config.damage,
      hitStop: config.hitStop,
      knockbackX: config.knockbackX,
      knockbackY: config.knockbackY,
      hitStun: config.hitStun,
      isHeavy: config.isHeavy,
      isLauncher: config.isLauncher,
      isProjectile: config.isProjectile,
      isUltimate: config.isUltimate,
      owner: this
    });
  }

  get currentHp() { return this.hp; }
  set currentHp(v) { this.hp = v; }
  get currentCore() { return this.coreMeter; }
  set currentCore(v) { this.coreMeter = v; }
  get width() { return this.charData?.visual?.width || 50; }
  get height() { return this.charData?.visual?.height || 110; }

  get currentAttack() {
    if (!this.isAttacking()) return null;
    const s = this.state;
    if (s === FIGHTER_STATES.LIGHT_1 || s === FIGHTER_STATES.LIGHT_2 || s === FIGHTER_STATES.LIGHT_3) {
      return { name: `${this.name} Light Attack` };
    }
    if (s === FIGHTER_STATES.HEAVY_1 || s === FIGHTER_STATES.HEAVY_LAUNCHER || s === FIGHTER_STATES.HEAVY_FINISHER) {
      return { name: `${this.name} Heavy Strike` };
    }
    if (s === FIGHTER_STATES.SPECIAL_1) {
      return { name: this.charData.abilities[0] ? this.charData.abilities[0].name : 'Special 1' };
    }
    if (s === FIGHTER_STATES.SPECIAL_2) {
      return { name: this.charData.abilities[1] ? this.charData.abilities[1].name : 'Special 2' };
    }
    if (s === FIGHTER_STATES.ULTIMATE) {
      return { name: this.charData.abilities[2] ? this.charData.abilities[2].name : 'Ultimate' };
    }
    return null;
  }
  set currentAttack(v) {
    // Safe no-op setter to prevent strict mode TypeError
  }

  executeAction(action, opponent, particleSystem) {
    if (!this.canAct()) return false;

    switch (action) {
      case 'LIGHT':
      case 'LIGHT_ATTACK':
        this.setState(FIGHTER_STATES.LIGHT_1);
        return true;
      case 'HEAVY':
      case 'HEAVY_ATTACK':
        this.setState(FIGHTER_STATES.HEAVY_1);
        return true;
      case 'SPECIAL':
      case 'SPECIAL_1':
        if (this.cooldowns.special1 <= 0 && this.coreMeter >= (this.charData.abilities[0]?.cost || 25)) {
          this.coreMeter -= (this.charData.abilities[0]?.cost || 25);
          this.cooldowns.special1 = this.charData.abilities[0]?.cooldown || 2.0;
          this.setState(FIGHTER_STATES.SPECIAL_1);
          return true;
        }
        return false;
      case 'SPECIAL_2':
        if (this.cooldowns.special2 <= 0 && this.coreMeter >= (this.charData.abilities[1]?.cost || 30)) {
          this.coreMeter -= (this.charData.abilities[1]?.cost || 30);
          this.cooldowns.special2 = this.charData.abilities[1]?.cooldown || 2.5;
          this.setState(FIGHTER_STATES.SPECIAL_2);
          return true;
        }
        return false;
      case 'ULTIMATE':
        if (this.coreMeter >= 100) {
          this.coreMeter = 0;
          this.setState(FIGHTER_STATES.ULTIMATE);
          return true;
        }
        return false;
      case 'DODGE':
        if (this.cooldowns.dodge <= 0) {
          this.cooldowns.dodge = 0.5; // Quick 500ms cooldown
          soundEngine.playUiHover();
          this.setState(FIGHTER_STATES.DODGE);
          return true;
        }
        return false;
      case 'COUNTER':
        if (this.cooldowns.counter <= 0) {
          this.cooldowns.counter = 1.0;
          this.setState(FIGHTER_STATES.COUNTER);
          return true;
        }
        return false;
    }
    return false;
  }

  jump() {
    if (this.canMove() && this.isGrounded) {
      this.vy = -this.jumpForce;
      this.isGrounded = false;
      this.setState(FIGHTER_STATES.FALL);
      soundEngine.playUiHover();
    }
  }
}
