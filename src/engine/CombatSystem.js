
// RIFTBORN High-Responsiveness Combat Engine
// Hit-stop, camera trauma, combo scaling, perfect dodge, parry counters, and finishers

import { checkAABB } from './Hitbox.js';
import { soundEngine } from './SoundEngine.js';
import { FIGHTER_STATES } from './Fighter.js';

export class CombatSystem {
  constructor(gameEngine) {
    this.game = gameEngine;
  }

  processCollisions(fighterA, fighterB, particleSystem, projectiles = []) {
    // Process Hitbox from A against Hurtbox of B
    if (fighterA.activeHitbox && fighterA.activeHitbox.active && !fighterA.activeHitbox.hasHit) {
      this.resolveHit(fighterA, fighterB, fighterA.activeHitbox, particleSystem);
    }

    // Process Hitbox from B against Hurtbox of A
    if (fighterB.activeHitbox && fighterB.activeHitbox.active && !fighterB.activeHitbox.hasHit) {
      this.resolveHit(fighterB, fighterA, fighterB.activeHitbox, particleSystem);
    }

    // Process Projectiles
    if (projectiles && projectiles.length > 0) {
      for (const proj of projectiles) {
        if (!proj.active || proj.hasHit) continue;
        const target = (proj.owner === fighterA) ? fighterB : fighterA;
        if (target && checkAABB(proj.getBounds(), target.hurtbox)) {
          this.resolveHit(proj.owner, target, {
            damage: proj.damage,
            hitStop: proj.hitStop,
            knockbackX: proj.knockbackX,
            knockbackY: proj.knockbackY,
            hitStun: proj.hitStun,
            isProjectile: true,
            x: proj.x - proj.radius,
            y: proj.y - proj.radius,
            width: proj.radius * 2,
            height: proj.radius * 2
          }, particleSystem);
          proj.active = false;
          proj.hasHit = true;
        }
      }
    }

    // Reset combos if target has fully recovered to neutral
    this.updateComboDecay(fighterA, fighterB);
    this.updateComboDecay(fighterB, fighterA);
  }

  updateComboDecay(attacker, target) {
    if (attacker.comboCount > 0) {
      const targetInHitstun = (target.state === FIGHTER_STATES.HURT || target.state === FIGHTER_STATES.LAUNCHED || target.state === FIGHTER_STATES.STUNNED);
      if (!targetInHitstun) {
        if (!attacker.comboDecayTimer) attacker.comboDecayTimer = 30; // 30 frames grace period for juggle
        attacker.comboDecayTimer--;
        if (attacker.comboDecayTimer <= 0) {
          attacker.comboCount = 0;
          attacker.comboDamage = 0;
          attacker.comboDecayTimer = 0;
        }
      } else {
        attacker.comboDecayTimer = 35;
      }
    }
  }

  resolveHit(attacker, target, hitbox, particleSystem) {
    if (!checkAABB(hitbox, target.hurtbox)) return;

    // Target is invulnerable (e.g., during wakeup or active dodge)
    if (target.isInvulnerable) {
      // Check for PERFECT DODGE trigger (Lyra has extended 11-frame window)
      const maxDodgeWindow = (target.charId === 'lyra') ? 11 : 8;
      if (target.state === FIGHTER_STATES.DODGE && target.stateTimer <= maxDodgeWindow) {
        this.triggerPerfectDodge(target, attacker, particleSystem);
        hitbox.hasHit = true;
      }
      return;
    }

    hitbox.hasHit = true;
    attacker.lastHitLanded = true;

    // 1. COUNTER PARRY CHECK
    if (target.isCounterActive) {
      this.triggerCounterParry(target, attacker, hitbox, particleSystem);
      return;
    }

    // 2. BLOCK CHECK
    // Target blocks if holding block and facing the attacker
    const isFacingAttacker = (target.x < attacker.x && target.facing === 1) || (target.x > attacker.x && target.facing === -1);
    if (target.isBlocking && isFacingAttacker && !hitbox.isUnblockable) {
      this.triggerBlock(target, attacker, hitbox, particleSystem);
      return;
    }

    // 3. SUPER ARMOR CHECK (Solaris Heavy Attacks & Meteor Charge)
    const hasArmor = target.hasSuperArmor || (target.charId === 'solaris' && (
      (target.state === FIGHTER_STATES.HEAVY_1 && target.stateTimer >= 3 && target.stateTimer <= 12) ||
      (target.state === FIGHTER_STATES.HEAVY_LAUNCHER && target.stateTimer >= 2 && target.stateTimer <= 9) ||
      (target.state === FIGHTER_STATES.SPECIAL_2 && target.stateTimer <= 18)
    ));

    if (hasArmor && !hitbox.isUltimate && !hitbox.isHeavy) {
      // Super Armor absorbs incoming light/medium strikes without flinching!
      const defenseFactor = 100 / (100 + target.def * 0.4);
      const armorDamage = Math.round(Math.max(4, hitbox.damage * 0.75 * (attacker.atk / 100) * defenseFactor));
      target.hp = Math.max(0, target.hp - armorDamage);

      const hitX = target.x;
      const hitY = target.y - 60;
      particleSystem.emitBlockSparks(hitX, hitY);
      particleSystem.emitDamageText(hitX, hitY - 20, `${armorDamage} (ARMOR)`, 'block');
      soundEngine.playBluntImpact(true);
      this.game.applyHitStop(4);
      this.game.addCameraTrauma(0.18);

      if (target.hp <= 0) {
        target.setState(FIGHTER_STATES.DEFEATED);
        this.game.triggerFinisher(attacker, target);
      }
      return;
    }

    // 4. FULL CLEAN HIT
    this.triggerCleanHit(attacker, target, hitbox, particleSystem);
  }

  triggerCleanHit(attacker, target, hitbox, particleSystem) {
    // Critical Hit calculation (Lyra post-dodge guaranteed crit)
    let isCrit = Math.random() < attacker.critChance;
    if (attacker.guaranteedCrit) {
      isCrit = true;
      attacker.guaranteedCrit = false;
    }
    const critMult = isCrit ? 1.6 : 1.0;

    // Combo Counter logic
    const wasAlreadyInHitstun = (target.state === FIGHTER_STATES.HURT || target.state === FIGHTER_STATES.LAUNCHED || target.state === FIGHTER_STATES.STUNNED);
    if (wasAlreadyInHitstun && attacker.comboCount > 0) {
      attacker.comboCount++;
    } else {
      attacker.comboCount = 1;
      attacker.comboDamage = 0;
    }
    attacker.comboDecayTimer = 35;

    // Combo Damage Scaling (prevents infinites: 1.0 -> 0.88 -> 0.76 -> 0.64 -> 0.52 -> 0.40 min)
    const comboScale = Math.max(0.40, 1.0 - (attacker.comboCount - 1) * 0.12);

    // Kairo Passive: Ruthless Hunter (+20% damage on airborne/downed opponents)
    let passiveMultiplier = 1.0;
    if (attacker.charId === 'kairo') {
      const isFoeVulnerable = !target.isGrounded || target.state === FIGHTER_STATES.LAUNCHED || target.state === FIGHTER_STATES.KNOCKDOWN;
      if (isFoeVulnerable) {
        passiveMultiplier = 1.20;
      }
    }

    // Defense calculation
    const defenseFactor = 100 / (100 + target.def * 0.4);
    const rawDamage = hitbox.damage * (attacker.atk / 100) * critMult * comboScale * defenseFactor * passiveMultiplier;
    const finalDamage = Math.round(Math.max(6, rawDamage));

    target.hp = Math.max(0, target.hp - finalDamage);
    attacker.comboDamage = (attacker.comboDamage || 0) + finalDamage;

    // Hit-stop frames (freeze both characters briefly for meaty, punchy impact)
    const hitStopFrames = hitbox.hitStop || (isCrit ? 11 : 6);
    this.game.applyHitStop(hitStopFrames);

    // Camera shake trauma (scaled to attack intensity)
    const trauma = hitbox.isUltimate ? 0.85 : (hitbox.isHeavy ? 0.45 : 0.18);
    this.game.addCameraTrauma(trauma);

    // Apply Knockback & Scaled Hitstun (Infinite Prevention)
    const baseHitStun = hitbox.hitStun || 16;
    const scaledHitStun = Math.max(8, baseHitStun - (attacker.comboCount - 1) * 2.2);

    target.vx = attacker.facing * hitbox.knockbackX;
    // Aerial Juggle Gravity Scaling: reduce launch lift on repeated juggle hits
    if (wasAlreadyInHitstun && hitbox.knockbackY < 0) {
      target.vy = Math.min(-3.5, hitbox.knockbackY + (attacker.comboCount - 1) * 2.2);
    } else {
      target.vy = hitbox.knockbackY;
    }

    if (hitbox.isLauncher) {
      target.setState(FIGHTER_STATES.LAUNCHED);
    } else {
      target.setState(FIGHTER_STATES.HURT);
    }

    // Physical impact micro-jitter during hit-stop
    target.jitterX = (Math.random() - 0.5) * (hitbox.isHeavy ? 6.0 : 3.5);
    target.jitterY = (Math.random() - 0.5) * (hitbox.isHeavy ? 4.0 : 2.0);

    target.isHitStunned = true;
    target.hitStunTimer = scaledHitStun;

    // Attacker slight grounding pushback so sprites do not uncomfortably overlap
    if (attacker.isGrounded) {
      attacker.vx = -attacker.facing * 1.2;
    }

    // Audio Feedback with combo pitch escalation & critical strike crunch
    if (hitbox.isUltimate) {
      soundEngine.playFinisherKO();
    } else if (isCrit) {
      soundEngine.playCritHit();
    } else if (hitbox.isHeavy) {
      soundEngine.playBluntImpact(true);
    } else {
      soundEngine.playSlash(false, attacker.comboCount);
    }

    // Visual FX & Impact Particles (Core energy burst + Sparks + Crit glint)
    const hitX = (hitbox.x + hitbox.width / 2 + target.x) / 2;
    const hitY = hitbox.y + hitbox.height / 2;

    particleSystem.emitSparks(hitX, hitY, isCrit ? 22 : 12, attacker.charData.coreColor, isCrit ? 7 : 4.5);
    particleSystem.emitBurst(hitX, hitY, attacker.charData.coreColor, isCrit ? 52 : 30);
    particleSystem.emitDamageText(hitX, hitY, finalDamage, isCrit ? 'crit' : 'normal');

    if (isCrit) {
      particleSystem.emitCritGlint(hitX, hitY);
    }

    if (passiveMultiplier > 1.0) {
      particleSystem.emitDamageText(hitX, hitY - 24, '+20% HUNTER', 'crit');
    }

    // Trigger Game Screen Feedback ("I HIT" vs "I GOT HIT")
    this.game.triggerHitFeedback(attacker.isPlayer, target.isPlayer, hitbox.isHeavy, isCrit, hitbox.isUltimate);

    // Build Core Energy through combat
    attacker.coreMeter = Math.min(attacker.maxCoreMeter, attacker.coreMeter + (hitbox.isHeavy ? 15 : 8) * attacker.coreRate);
    target.coreMeter = Math.min(target.maxCoreMeter, target.coreMeter + 5 * target.coreRate);

    // Nox Passive: Shadow Siphon (drains 5% Core energy on specials)
    if (attacker.charId === 'nox' && (hitbox.isProjectile || hitbox.isUltimate || attacker.state === FIGHTER_STATES.SPECIAL_1 || attacker.state === FIGHTER_STATES.SPECIAL_2 || attacker.state === FIGHTER_STATES.ULTIMATE)) {
      const drain = Math.min(target.coreMeter, 5);
      target.coreMeter = Math.max(0, target.coreMeter - drain);
      attacker.coreMeter = Math.min(attacker.maxCoreMeter, attacker.coreMeter + drain);
      particleSystem.emitDamageText(target.x, target.y - 70, '-5% CORE', 'dodge');
    }

    // Vex Passive: below 35% HP grants bonus Core regeneration
    if (target.charId === 'vex' && target.hp / target.maxHp < 0.35) {
      target.coreMeter = Math.min(target.maxCoreMeter, target.coreMeter + 5);
    }

    // FINISHER / DEFEAT CHECK
    if (target.hp <= 0) {
      target.setState(FIGHTER_STATES.DEFEATED);
      this.game.triggerFinisher(attacker, target);
    }
  }

  triggerBlock(target, attacker, hitbox, particleSystem) {
    attacker.comboCount = 0;
    attacker.comboDamage = 0;

    // Aeron Passive: Resonance Guard - 0 chip damage on block!
    const isAeron = (target.charId === 'aeron');
    const chipDamage = isAeron ? 0 : Math.round(hitbox.damage * 0.15);
    target.hp = Math.max(0, target.hp - chipDamage);

    // Pushback on both fighters
    target.vx = attacker.facing * (hitbox.knockbackX * 0.4);
    attacker.vx = -attacker.facing * 3.2;

    // Visual barrier ripple & flash
    target.blockFlashTimer = 10;

    soundEngine.playBlock();
    this.game.applyHitStop(3);
    this.game.addCameraTrauma(0.10);

    const hitX = target.x + target.facing * 25;
    const hitY = target.y - 55;

    // Deflected hexagonal barrier sparks
    particleSystem.emitBlockSparks(hitX, hitY);
    particleSystem.emitDamageText(hitX, hitY, chipDamage > 0 ? chipDamage : (isAeron ? 'PERFECT GUARD' : 0), 'block');

    // Screen feedback for block
    this.game.triggerBlockFeedback(target.isPlayer);
    if (this.game.matchStats && target === this.game.p1) {
      this.game.matchStats.p1Blocks++;
    }

    // Core meter gain on block (Aeron gains +35% faster)
    const coreGain = isAeron ? 10 : 6;
    target.coreMeter = Math.min(target.maxCoreMeter, target.coreMeter + coreGain);

    if (target.hp <= 0) {
      target.setState(FIGHTER_STATES.DEFEATED);
      this.game.triggerFinisher(attacker, target);
    }
  }

  triggerCounterParry(target, attacker, hitbox, particleSystem) {
    attacker.comboCount = 0;
    attacker.comboDamage = 0;

    soundEngine.playParry();
    this.game.applyHitStop(14);
    this.game.addCameraTrauma(0.65);

    // Stagger attacker with STUNNED state & big frame disadvantage
    attacker.vx = -attacker.facing * 8;
    attacker.vy = -3;
    attacker.isHitStunned = true;
    attacker.hitStunTimer = 36;
    attacker.setState(FIGHTER_STATES.STUNNED);

    // Free counter damage dealt to attacker
    const counterDamage = 65;
    attacker.hp = Math.max(0, attacker.hp - counterDamage);

    const hitX = (target.x + attacker.x) / 2;
    const hitY = target.y - 60;

    particleSystem.emitShockwave(hitX, hitY, '#FFCC00', 95);
    particleSystem.emitBurst(hitX, hitY, target.charData.coreColor, 45);
    particleSystem.emitDamageText(hitX, hitY, counterDamage, 'counter');

    target.coreMeter = Math.min(target.maxCoreMeter, target.coreMeter + 18);
    target.setState(FIGHTER_STATES.IDLE);

    this.game.triggerParryFeedback(target.isPlayer);
    if (this.game.matchStats && target === this.game.p1) {
      this.game.matchStats.p1Parries++;
    }

    if (attacker.hp <= 0) {
      attacker.setState(FIGHTER_STATES.DEFEATED);
      this.game.triggerFinisher(target, attacker);
    }
  }

  triggerPerfectDodge(target, attacker, particleSystem) {
    soundEngine.playPerfectDodge();
    // Snappy Matrix slow-down (260ms duration, 0.22x speed)
    this.game.setTimeDilation(0.22, 260);
    this.game.addCameraTrauma(0.35);

    particleSystem.emitShockwave(target.x, target.y - 50, '#00D2FF', 95);
    particleSystem.emitDamageText(target.x, target.y - 75, 'PERFECT DODGE', 'dodge');

    // Lyra Passive: Phase Agility grants guaranteed Critical Hit on next strike
    if (target.charId === 'lyra') {
      target.guaranteedCrit = true;
      particleSystem.emitDamageText(target.x, target.y - 95, 'CRIT CHARGED!', 'crit');
    }

    target.coreMeter = Math.min(target.maxCoreMeter, target.coreMeter + 15);

    // Screen feedback for perfect dodge
    this.game.triggerDodgeFeedback(target.isPlayer);
    if (this.game.matchStats && target === this.game.p1) {
      this.game.matchStats.p1Dodges++;
    }
  }
}
