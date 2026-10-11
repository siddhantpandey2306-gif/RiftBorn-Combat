// RIFTBORN Character Rendering Engine
// Procedural vector-skeletal rendering for VEX and fighters with dynamic animations and visual FX

import { FIGHTER_STATES } from './Fighter.js';

export class CharacterRenderer {
  constructor() {
    this.afterimages = [];
    this.isMobile = (typeof window !== 'undefined' && (
      ('ontouchstart' in window) || 
      (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
      (window.innerWidth <= 1024)
    ));
  }

  addAfterimage(fighter) {
    this.afterimages.push({
      x: fighter.x,
      y: fighter.y,
      facing: fighter.facing,
      charId: fighter.charId,
      alpha: 0.6,
      decay: 0.08,
      color: fighter.charData.coreColor
    });
  }

  updateAfterimages() {
    for (let i = this.afterimages.length - 1; i >= 0; i--) {
      const img = this.afterimages[i];
      img.alpha -= img.decay;
      if (img.alpha <= 0) {
        this.afterimages.splice(i, 1);
      }
    }
  }

  drawAfterimages(ctx) {
    for (const img of this.afterimages) {
      ctx.save();
      ctx.globalAlpha = img.alpha * 0.45;
      ctx.fillStyle = img.color;
      if (!this.isMobile) {
        ctx.shadowColor = img.color;
        ctx.shadowBlur = 12;
      }
      ctx.beginPath();
      ctx.ellipse(img.x, img.y - 50, 22, 50, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  drawFighter(ctx, fighter) {
    const char = fighter.charData;
    const facing = fighter.facing;
    const state = fighter.state;
    const frame = fighter.animFrame;
    const isHit = (state === FIGHTER_STATES.HURT || state === FIGHTER_STATES.STUNNED);
    const isBlocking = fighter.isBlocking;
    const isInvulnerable = fighter.isInvulnerable;

    // Flash/blink when invulnerable (e.g. during wakeup)
    if (isInvulnerable && Math.floor(Date.now() / 60) % 2 === 0) {
      return;
    }

    const renderX = fighter.x + (fighter.jitterX || 0);
    const renderY = fighter.y + (fighter.jitterY || 0);

    ctx.save();
    ctx.translate(renderX, renderY);
    ctx.scale(facing, 1);

    // 1. Dynamic Ground Shadow
    const shadowScale = Math.max(0.2, 1 - (fighter.groundY - fighter.y) / 260);
    ctx.save();
    ctx.scale(1 / facing, 1);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.beginPath();
    ctx.ellipse(0, 0, (char.visual.width + 14) * shadowScale, 9 * shadowScale, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. White flash on hit (Hardware-accelerated blend on mobile without expensive ctx.filter stalls)
    if (isHit && fighter.hitStunTimer % 4 < 2) {
      if (!this.isMobile) {
        ctx.filter = 'brightness(2.8) drop-shadow(0 0 14px white)';
      } else {
        ctx.globalCompositeOperation = 'lighter';
      }
    }

    // 3. Render Fighter according to Character Identity
    const isP2 = (fighter.playerNumber === 2);
    switch (fighter.charId) {
      case 'solaris':
        this.drawSolarisCharacter(ctx, fighter, frame, isP2);
        break;
      case 'lyra':
        this.drawLyraCharacter(ctx, fighter, frame, isP2);
        break;
      case 'aeron':
        this.drawAeronCharacter(ctx, fighter, frame, isP2);
        break;
      case 'kairo':
        this.drawKairoCharacter(ctx, fighter, frame, isP2);
        break;
      case 'nox':
        this.drawNoxCharacter(ctx, fighter, frame, isP2);
        break;
      case 'vex':
      default:
        this.drawVexCharacter(ctx, fighter, frame, isP2);
        break;
    }

    // 4. Energy Shield when blocking or deflecting
    const isDeflecting = (fighter.blockFlashTimer && fighter.blockFlashTimer > 0);
    if (isBlocking || isDeflecting) {
      ctx.save();
      const shieldColor = isDeflecting ? '#00E5FF' : (isP2 ? '#00D2FF' : char.coreColor);
      ctx.strokeStyle = shieldColor;
      ctx.lineWidth = isDeflecting ? 5.5 : 3.5;
      ctx.fillStyle = isDeflecting ? `${shieldColor}45` : `${shieldColor}25`;
      ctx.shadowColor = shieldColor;
      ctx.shadowBlur = isDeflecting ? 28 : 18;
      ctx.beginPath();
      const radius = isDeflecting ? 68 : 62;
      ctx.arc(16, -55, radius, -Math.PI * 0.42, Math.PI * 0.42);
      ctx.lineTo(26, -55);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Hexagonal barrier grid lines
      ctx.strokeStyle = isDeflecting ? '#FFFFFF' : `${shieldColor}88`;
      ctx.lineWidth = isDeflecting ? 2.5 : 1.5;
      ctx.beginPath();
      ctx.moveTo(34, -75); ctx.lineTo(46, -55); ctx.lineTo(34, -35);
      ctx.moveTo(48, -65); ctx.lineTo(58, -55); ctx.lineTo(48, -45);
      ctx.stroke();
      ctx.restore();
    }

    // 5. Ultimate Ready Aura (100% Core Energy)
    if (fighter.coreMeter >= 100) {
      ctx.save();
      const pulse = Math.sin(Date.now() / 140) * 0.3 + 0.7;
      const auraColor = isP2 ? '#00D2FF' : char.coreColor;
      ctx.strokeStyle = auraColor;
      ctx.lineWidth = 2.5 * pulse;
      ctx.shadowColor = auraColor;
      ctx.shadowBlur = 22 * pulse;
      ctx.beginPath();
      ctx.ellipse(0, -55, char.visual.width * 0.75, char.visual.height * 0.55, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // 6. Visual Evolution Auras (Awakened Tier 1 & Ascended Tier 2)
    const evoTier = fighter.evolutionTier || 0;
    if (evoTier >= 1) {
      ctx.save();
      const time = Date.now() * 0.003;
      const coreCol = isP2 ? '#00D2FF' : (char.coreColor || '#00D2FF');

      // Tier 1: Awakened Energy Flares (Level 10+)
      ctx.strokeStyle = `${coreCol}88`;
      ctx.lineWidth = 1.8;
      ctx.shadowColor = coreCol;
      ctx.shadowBlur = 14;

      for (let i = 0; i < 3; i++) {
        const angle = time + (i * Math.PI * 2 / 3);
        const flareX = Math.cos(angle) * (char.visual.width * 0.55);
        const flareY = -55 + Math.sin(angle * 1.5) * 35;
        ctx.fillStyle = coreCol;
        ctx.beginPath();
        ctx.arc(flareX, flareY, 3, 0, Math.PI * 2);
        ctx.fill();
      }

      // Tier 2: Ascended Transcendent Halo & Crown (Level 20+)
      if (evoTier >= 2) {
        ctx.strokeStyle = '#FFE066';
        ctx.fillStyle = 'rgba(255, 224, 102, 0.25)';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = '#FFE066';
        ctx.shadowBlur = 24;

        // Radiant Halo above head
        ctx.beginPath();
        ctx.ellipse(0, -char.visual.height - 18, 26, 7, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fill();

        // Radiating Crown spikes
        ctx.beginPath();
        ctx.moveTo(-16, -char.visual.height - 18);
        ctx.lineTo(-24, -char.visual.height - 28);
        ctx.moveTo(0, -char.visual.height - 20);
        ctx.lineTo(0, -char.visual.height - 34);
        ctx.moveTo(16, -char.visual.height - 18);
        ctx.lineTo(24, -char.visual.height - 28);
        ctx.stroke();
      }

      ctx.restore();
    }

    ctx.restore();
  }

  // --- POLISHED VEX PROCEDURAL SKELETAL RENDERING ---
  drawVexCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#00D2FF' : '#FF3366';
    const coreSecondary = isP2 ? '#38BDF8' : '#FF6B8B';
    const armorColor = isP2 ? '#0E1726' : '#141824';
    const pauldronColor = isP2 ? '#1E293B' : '#222A3F';
    const scarfColor = isP2 ? '#0284C7' : '#E60049';
    const hairColor = isP2 ? '#94A3B8' : '#FFFFFF';

    const state = f.state;
    const t = f.stateTimer;

    // --- Dynamic Pose Variables ---
    const breath = Math.sin(frame * 0.08);
    let idleBob = breath * 2.2;
    let bodyLean = 0;       // angle in radians
    let bodyOffsetY = idleBob;
    let backLegAngle = 0;
    let frontLegAngle = 0;
    let backLegY = 0;
    let frontLegY = 0;
    let handX = 14;
    let handY = -55 + idleBob;
    let swordAngle = 0.40;
    let swordLength = 62;
    let scarfFlutter = Math.sin(frame * 0.14) * 12 + breath * 3;
    let isFloored = false;

    // --- State-Specific Pose Customizations ---
    switch (state) {
      case FIGHTER_STATES.IDLE:
        swordAngle = 0.38 + breath * 0.05;
        handX = 12;
        handY = -55 + idleBob;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Dynamic Ronin Sprint
          bodyLean = 0.36;
          const runCycle = Math.sin(frame * 0.38);
          frontLegAngle = runCycle * 0.52;
          backLegAngle = -runCycle * 0.52;
          scarfFlutter += 34;
          swordAngle = -1.2;
          handX = -12;
          handY = -48;
        } else {
          bodyLean = 0.14;
          const walkCycle = Math.sin(frame * 0.22);
          frontLegAngle = walkCycle * 0.35;
          backLegAngle = -walkCycle * 0.35;
          scarfFlutter += 14;
          swordAngle = 0.8;
          handX = -4;
          handY = -52;
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = -0.12;
        const bWalkCycle = Math.sin(frame * 0.22);
        frontLegAngle = -bWalkCycle * 0.3;
        backLegAngle = bWalkCycle * 0.3;
        scarfFlutter -= 10;
        swordAngle = -0.3;
        handX = 16;
        handY = -62;
        break;

      case FIGHTER_STATES.FALL:
        bodyLean = 0.1;
        bodyOffsetY = -10;
        frontLegAngle = -0.4;
        backLegAngle = -0.2;
        swordAngle = -0.6;
        handX = 18;
        handY = -68;
        break;

      case FIGHTER_STATES.BLOCK:
        bodyLean = -0.08;
        bodyOffsetY = 4;
        frontLegAngle = 0.2;
        backLegAngle = -0.2;
        swordAngle = -0.85; // Two-handed Katana Guard
        handX = 14;
        handY = -62;
        break;

      case FIGHTER_STATES.COUNTER:
        bodyLean = 0.05;
        bodyOffsetY = 6;
        swordAngle = 0.2;
        handX = 6;
        handY = -50;
        // Golden iaido glint
        ctx.save();
        ctx.fillStyle = '#FFD700';
        ctx.shadowColor = '#FFD700';
        ctx.shadowBlur = 15;
        ctx.beginPath();
        ctx.arc(handX + 12, handY - 4, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case FIGHTER_STATES.DODGE:
        bodyLean = 0.6;
        bodyOffsetY = 24;
        frontLegAngle = 0.8;
        backLegAngle = -0.7;
        swordAngle = 1.6;
        handX = -12;
        handY = -35;
        if (frame % 3 === 0) {
          this.addAfterimage(f);
        }
        break;

      case FIGHTER_STATES.HURT:
        bodyLean = -0.38;
        bodyOffsetY = 2;
        swordAngle = -1.2;
        handX = -8;
        handY = -60;
        break;

      case FIGHTER_STATES.STUNNED:
        bodyLean = Math.sin(frame * 0.18) * 0.14;
        bodyOffsetY = 4;
        swordAngle = 0.9;
        handX = 4;
        handY = -45;
        // Dazed sparks
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.12 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 22;
          const sy = -118 + Math.sin(a) * 8;
          ctx.fillStyle = '#FFDD00';
          ctx.shadowColor = '#FFDD00';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.7 + (t * 0.08);
        bodyOffsetY = -15;
        swordAngle = -1.4;
        handX = -10;
        handY = -70;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        bodyLean = 0.2;
        bodyOffsetY = 16 - (t * 0.9);
        swordAngle = 0.2;
        handX = 10;
        handY = -48;
        break;

      case FIGHTER_STATES.VICTORY:
        // Triumphant Katana Sheath Snap with blowing scarf & crimson victory flare
        bodyLean = 0.02;
        bodyOffsetY = 0;
        swordAngle = 0.95;
        handX = -4;
        handY = -52;
        scarfFlutter = Math.sin(frame * 0.22) * 24 + 10;
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 20;
        ctx.beginPath();
        ctx.arc(handX + 6, handY + 12, 5 + Math.sin(frame * 0.15) * 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case FIGHTER_STATES.DEFEATED:
        // Kneeling on floor, blade planted into ground
        bodyLean = 0.28;
        bodyOffsetY = 26;
        swordAngle = 1.57; // vertical into ground
        handX = 14;
        handY = -35;
        scarfFlutter = Math.sin(frame * 0.06) * 4;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1:
        if (t <= 3) {
          // Anticipation: blade cocked back with kinetic glint
          bodyLean = -0.10;
          swordAngle = -0.7;
          handX = -6;
          handY = -68;
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(-6, -68, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          const swingT1 = Math.min(1, (t - 3) / 11);
          bodyLean = 0.14;
          swordAngle = -0.5 + (swingT1 * 2.0);
          handX = 10 + Math.cos(swordAngle) * 20;
          handY = -62 + Math.sin(swordAngle) * 16;
        }
        break;

      case FIGHTER_STATES.LIGHT_2:
        if (t <= 3) {
          // Cross-cut anticipation
          bodyLean = 0.04;
          swordAngle = 1.8;
          handX = -8;
          handY = -45;
        } else {
          const swingT2 = Math.min(1, (t - 3) / 12);
          bodyLean = 0.20;
          swordAngle = 1.7 - (swingT2 * 2.3);
          handX = 14 + Math.cos(swordAngle) * 22;
          handY = -64 + Math.sin(swordAngle) * 18;
        }
        break;

      case FIGHTER_STATES.LIGHT_3:
        if (t <= 4) {
          // Whirlwind coil
          bodyLean = -0.12;
          swordAngle = -1.0;
          handX = 4;
          handY = -48;
        } else {
          const spinT = ((t - 4) * 0.38) % (Math.PI * 2);
          bodyLean = 0.16;
          swordAngle = spinT;
          handX = Math.cos(spinT) * 26;
          handY = -62 + Math.sin(spinT) * 20;
        }
        break;

      case FIGHTER_STATES.HEAVY_1:
        if (t < 8) {
          // Overhead power wind-up
          bodyLean = -0.22;
          swordAngle = -2.1 + (t / 8) * 0.3;
          handX = -8;
          handY = -88;
          if (t % 2 === 0) {
            ctx.save();
            ctx.fillStyle = '#FFD700';
            ctx.shadowColor = '#FFD700';
            ctx.shadowBlur = 16;
            ctx.beginPath();
            ctx.arc(-8, -88, 5, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
          }
        } else {
          // Brutal ground-cleaving slam
          bodyLean = 0.34;
          swordAngle = 1.0;
          handX = 26;
          handY = -42;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER:
        const hlT = Math.min(1, t / 18);
        bodyLean = -0.12;
        swordAngle = 1.4 - (hlT * 2.4); // Rising skyward
        handX = 18;
        handY = -60 - (hlT * 20);
        break;

      case FIGHTER_STATES.HEAVY_FINISHER:
        bodyLean = 0.35;
        swordAngle = 1.1;
        handX = 24;
        handY = -42;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Crimson Dash
        bodyLean = 0.45;
        bodyOffsetY = 12;
        swordAngle = 0.05; // Straight forward piercing thrust
        handX = 28;
        handY = -56;
        scarfFlutter += 28;
        if (frame % 2 === 0) {
          this.addAfterimage(f);
        }
        break;

      case FIGHTER_STATES.SPECIAL_2: // Rift Slash
        const rsT = Math.min(1, t / 22);
        bodyLean = -0.2;
        bodyOffsetY = -15;
        swordAngle = -1.6 + (rsT * 2.6);
        handX = 20;
        handY = -75;
        break;

      case FIGHTER_STATES.ULTIMATE: // Rift Breaker
        if (t < 18) {
          // Iaido charge stance
          bodyLean = 0.25;
          bodyOffsetY = 10;
          swordAngle = 0.3;
          handX = -2;
          handY = -50;
        } else {
          // Cross-screen slash pose
          bodyLean = 0.5;
          bodyOffsetY = 8;
          swordAngle = -0.2;
          handX = 32;
          handY = -58;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.16;
      swordAngle = 0.65;
    }

    // --- If Character is floored / knocked down ---
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(-Math.PI * 0.45);
      // Floored silhouette
      ctx.fillStyle = armorColor;
      ctx.fillRect(-12, -40, 24, 75);
      // Dropped blade
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(14, -10, 48, 5);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Premium Scarf & Trenchcoat with Aerodynamic Flow
    ctx.save();
    // Shadow / dark under-fold
    ctx.fillStyle = isP2 ? '#0369A1' : '#990026';
    ctx.beginPath();
    ctx.moveTo(-10, -78 + bodyOffsetY);
    ctx.bezierCurveTo(-28, -63 + bodyOffsetY, -38 - scarfFlutter * 0.9, -42 + bodyOffsetY, -48 - scarfFlutter * 0.9, -14 + bodyOffsetY);
    ctx.bezierCurveTo(-37 - scarfFlutter * 0.6, -30 + bodyOffsetY, -24, -54 + bodyOffsetY, -8, -66 + bodyOffsetY);
    ctx.fill();

    // Vibrant main flowing scarf tail
    const scarfGrad = ctx.createLinearGradient(-10, -78 + bodyOffsetY, -46 - scarfFlutter, -18 + bodyOffsetY);
    scarfGrad.addColorStop(0, scarfColor);
    scarfGrad.addColorStop(1, isP2 ? '#38BDF8' : '#FF4D6D');
    ctx.fillStyle = scarfGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -80 + bodyOffsetY);
    ctx.bezierCurveTo(-26, -66 + bodyOffsetY, -36 - scarfFlutter, -46 + bodyOffsetY, -46 - scarfFlutter, -18 + bodyOffsetY);
    ctx.bezierCurveTo(-34 - scarfFlutter * 0.7, -35 + bodyOffsetY, -22, -58 + bodyOffsetY, -6, -70 + bodyOffsetY);
    ctx.fill();

    // Glowing energy hem line on scarf
    ctx.strokeStyle = coreSecondary;
    ctx.lineWidth = 1.6;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 8;
    ctx.stroke();
    ctx.restore();

    // 2. High-Fidelity Armored Legs & Combat Greaves
    // Back leg (Shadowed)
    ctx.save();
    ctx.rotate(backLegAngle);
    // Thigh plate
    ctx.fillStyle = '#111520';
    ctx.beginPath();
    ctx.moveTo(-18, -42 + bodyOffsetY + backLegY);
    ctx.lineTo(-7, -42 + bodyOffsetY + backLegY);
    ctx.lineTo(-9, -24 + bodyOffsetY + backLegY);
    ctx.lineTo(-17, -24 + bodyOffsetY + backLegY);
    ctx.closePath();
    ctx.fill();
    // Knee guard
    ctx.fillStyle = pauldronColor;
    ctx.fillRect(-18, -25 + bodyOffsetY + backLegY, 11, 7);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-18, -24 + bodyOffsetY + backLegY, 2.5, 5);
    // Shin / Greave
    ctx.fillStyle = '#161C2C';
    ctx.fillRect(-17, -18 + bodyOffsetY + backLegY, 10, 14);
    // Tactical Combat Boot
    ctx.fillStyle = '#0F121C';
    ctx.beginPath();
    ctx.moveTo(-19, -8);
    ctx.lineTo(-5, -8);
    ctx.lineTo(-4, 0);
    ctx.lineTo(-21, 0);
    ctx.closePath();
    ctx.fill();
    // Glowing Boot Solenoid
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(-19, -4, 14, 2.5);
    ctx.restore();

    // Front leg (Detailed & Highlighted)
    ctx.save();
    ctx.rotate(frontLegAngle);
    // Upper thigh armor
    ctx.fillStyle = '#181E30';
    ctx.strokeStyle = '#2D3748';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, -42 + bodyOffsetY + frontLegY);
    ctx.lineTo(15, -42 + bodyOffsetY + frontLegY);
    ctx.lineTo(13, -24 + bodyOffsetY + frontLegY);
    ctx.lineTo(4, -24 + bodyOffsetY + frontLegY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Knee armor cap with beveled edge
    ctx.fillStyle = pauldronColor;
    ctx.beginPath();
    ctx.moveTo(2, -26 + bodyOffsetY + frontLegY);
    ctx.lineTo(15, -26 + bodyOffsetY + frontLegY);
    ctx.lineTo(13, -18 + bodyOffsetY + frontLegY);
    ctx.lineTo(4, -18 + bodyOffsetY + frontLegY);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(3, -24 + bodyOffsetY + frontLegY, 2.5, 5);
    // Shin armored greave with vent
    ctx.fillStyle = '#1A2136';
    ctx.fillRect(4, -18 + bodyOffsetY + frontLegY, 10, 13);
    ctx.strokeStyle = 'rgba(255,255,255,0.15)';
    ctx.lineWidth = 1;
    ctx.strokeRect(4, -18 + bodyOffsetY + frontLegY, 10, 13);
    // Tactical Combat Boot
    ctx.fillStyle = '#111422';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(17, -8);
    ctx.lineTo(18, 0);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fill();
    // Boot tread & Glowing Accent
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(2, -4, 15, 2.5);
    ctx.restore();

    // 3. Contoured Cyber-Chassis Cuirass & Vanguard Plasma Core
    // Tapered abdomen & ribs
    ctx.fillStyle = '#101422';
    ctx.beginPath();
    ctx.moveTo(-11, -55 + bodyOffsetY);
    ctx.lineTo(11, -55 + bodyOffsetY);
    ctx.lineTo(14, -75 + bodyOffsetY);
    ctx.lineTo(-14, -75 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Upper chest breastplate
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#2E3852';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -86 + bodyOffsetY);
    ctx.lineTo(16, -86 + bodyOffsetY);
    ctx.lineTo(13, -64 + bodyOffsetY);
    ctx.lineTo(0, -60 + bodyOffsetY);
    ctx.lineTo(-13, -64 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Subtle plate bevel highlight
    ctx.strokeStyle = 'rgba(255,255,255,0.2)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-14, -84 + bodyOffsetY);
    ctx.lineTo(0, -62 + bodyOffsetY);
    ctx.lineTo(14, -84 + bodyOffsetY);
    ctx.stroke();

    // Dynamic Crimson Vanguard Energy Core (Multi-ring Glowing Diamond Reactor)
    const corePulse = Math.sin(frame * 0.14) * 0.2 + 0.8;
    ctx.save();
    // Outer reactor halo
    const coreGrad = ctx.createRadialGradient(0, -68 + bodyOffsetY, 2, 0, -68 + bodyOffsetY, 14);
    coreGrad.addColorStop(0, coreSecondary);
    coreGrad.addColorStop(0.5, coreColor);
    coreGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = coreGrad;
    ctx.beginPath();
    ctx.arc(0, -68 + bodyOffsetY, 14 * corePulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer metal diamond frame
    ctx.fillStyle = '#0B0E18';
    ctx.beginPath();
    ctx.moveTo(0, -82 + bodyOffsetY);
    ctx.lineTo(11, -68 + bodyOffsetY);
    ctx.lineTo(0, -56 + bodyOffsetY);
    ctx.lineTo(-11, -68 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Inner glowing crystal diamond
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 14 * corePulse;
    ctx.beginPath();
    ctx.moveTo(0, -80 + bodyOffsetY);
    ctx.lineTo(9, -68 + bodyOffsetY);
    ctx.lineTo(0, -58 + bodyOffsetY);
    ctx.lineTo(-9, -68 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Center radiant white jewel
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#FFFFFF';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(0, -68 + bodyOffsetY, 2.8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Katana Scabbard (Saya) on left hip
    ctx.save();
    ctx.fillStyle = '#090C14';
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-12, -58 + bodyOffsetY);
    ctx.lineTo(-28, -42 + bodyOffsetY);
    ctx.lineTo(-26, -39 + bodyOffsetY);
    ctx.lineTo(-10, -55 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();

    // 4. Vanguard Shoulder Pauldrons (Layered & Angular)
    ctx.fillStyle = pauldronColor;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.2;
    // Left pauldron
    ctx.beginPath();
    ctx.moveTo(-22, -88 + bodyOffsetY);
    ctx.lineTo(-12, -88 + bodyOffsetY);
    ctx.lineTo(-10, -74 + bodyOffsetY);
    ctx.lineTo(-24, -77 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Left trim line
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(-22, -88 + bodyOffsetY);
    ctx.lineTo(-24, -77 + bodyOffsetY);
    ctx.stroke();

    // Right pauldron
    ctx.fillStyle = pauldronColor;
    ctx.strokeStyle = '#374151';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(12, -88 + bodyOffsetY);
    ctx.lineTo(22, -88 + bodyOffsetY);
    ctx.lineTo(24, -77 + bodyOffsetY);
    ctx.lineTo(10, -74 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right trim line
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(22, -88 + bodyOffsetY);
    ctx.lineTo(24, -77 + bodyOffsetY);
    ctx.stroke();

    // 5. Head, Flowing Layered Hair & High-Tech Cyber Visor
    // Shadow under hair
    ctx.fillStyle = '#0D111A';
    ctx.beginPath();
    ctx.arc(0, -97 + bodyOffsetY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Faceplate / Chin Guard
    ctx.fillStyle = '#141A28';
    ctx.strokeStyle = '#2B354C';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-9, -100 + bodyOffsetY);
    ctx.lineTo(9, -100 + bodyOffsetY);
    ctx.lineTo(7, -88 + bodyOffsetY);
    ctx.lineTo(0, -85 + bodyOffsetY);
    ctx.lineTo(-7, -88 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Horizontal Optic Visor
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 14;
    ctx.fillRect(-7, -94 + bodyOffsetY, 15, 4);
    // Center bright sensor slit
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-2, -93.5 + bodyOffsetY, 5, 3);
    ctx.restore();

    // Layered Anime Cyber-Hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(0, -116 + bodyOffsetY);
    ctx.lineTo(-16, -102 + bodyOffsetY);
    ctx.lineTo(-10, -96 + bodyOffsetY);
    ctx.lineTo(-4, -99 + bodyOffsetY);
    ctx.lineTo(0, -94 + bodyOffsetY);
    ctx.lineTo(4, -99 + bodyOffsetY);
    ctx.lineTo(12, -96 + bodyOffsetY);
    ctx.lineTo(17, -106 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Hair highlight crest
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.moveTo(0, -114 + bodyOffsetY);
    ctx.lineTo(-8, -104 + bodyOffsetY);
    ctx.lineTo(0, -100 + bodyOffsetY);
    ctx.lineTo(8, -104 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // 6. Weapon: Calamity Edge (High-Fidelity Plasma Katana)
    ctx.save();
    ctx.translate(handX, handY);
    ctx.rotate(swordAngle);

    // Tsuka (Hilt) with diamond menuki weave pattern
    ctx.fillStyle = '#181C26';
    ctx.fillRect(-18, -3.5, 18, 7);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-16, -2, 3, 4);
    ctx.fillRect(-10, -2, 3, 4);
    ctx.fillRect(-4, -2, 3, 4);
    // Pommel (Kashira)
    ctx.fillStyle = pauldronColor;
    ctx.fillRect(-20, -4.5, 3, 9);

    // Tsuba (Energy Crossguard)
    ctx.fillStyle = '#222838';
    ctx.fillRect(0, -10, 4, 20);
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 8;
    ctx.fillRect(1, -9, 2, 18);

    // Blade Spine (Hardened Steel Core)
    ctx.fillStyle = '#E2E8F0';
    ctx.fillRect(4, -2, swordLength, 2.5);

    // Blazing Plasma Blade Edge (Glowing Multi-Stop Energy Gradient)
    const bladeGrad = ctx.createLinearGradient(4, 0, 4 + swordLength, 0);
    bladeGrad.addColorStop(0, '#FFFFFF');
    bladeGrad.addColorStop(0.2, coreSecondary);
    bladeGrad.addColorStop(1, coreColor);
    ctx.fillStyle = bladeGrad;
    ctx.fillRect(4, 0.5, swordLength, 4);

    // Razor Kissaki (Tapered Katana Tip)
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.moveTo(4 + swordLength, -2);
    ctx.lineTo(4 + swordLength + 12, 1);
    ctx.lineTo(4 + swordLength, 4.5);
    ctx.closePath();
    ctx.fill();

    // Outer Radiant Aura Outline
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2.5;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 18;
    ctx.strokeRect(4, -3, swordLength, 8);

    // 7. Visual Combo Cancel Window Indicator
    if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
      const glintPulse = Math.sin(frame * 0.4) * 0.4 + 0.6;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.5 * glintPulse;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 18 * glintPulse;
      ctx.strokeRect(2, -5, swordLength + 16, 12);
    }

    // 8. Attack Anticipation & Telegraphing Cues (Clear telegraph before active frames)
    const tipX = 12 + swordLength + 6;
    if ((state === FIGHTER_STATES.LIGHT_1 || state === FIGHTER_STATES.LIGHT_2) && t < 3) {
      // Crisp blade glint star on startup
      ctx.save();
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.arc(tipX, 0, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state === FIGHTER_STATES.HEAVY_1 && t < 6) {
      // Big Overhead Heavy Charge: expanding plasma anticipation ring
      ctx.save();
      const chargeRadius = 10 + (t / 6) * 16;
      ctx.strokeStyle = '#FF3366';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FF3366';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.arc(tipX, 0, chargeRadius, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(tipX, 0, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state === FIGHTER_STATES.HEAVY_LAUNCHER && t < 4) {
      // Golden rising launcher anticipation
      ctx.save();
      ctx.strokeStyle = '#FFD700';
      ctx.lineWidth = 3;
      ctx.shadowColor = '#FFD700';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(tipX, 0, 14, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (state === FIGHTER_STATES.HEAVY_FINISHER && t < 5) {
      // Downward finisher slam fracture glint
      ctx.save();
      ctx.strokeStyle = '#FF0055';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#FF0055';
      ctx.shadowBlur = 22;
      ctx.beginPath();
      ctx.arc(tipX, 0, 16, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    } else if (state === FIGHTER_STATES.SPECIAL_1 && t < 3) {
      // Thrust dash anticipation
      ctx.save();
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(tipX, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state === FIGHTER_STATES.SPECIAL_2 && t < 3) {
      // Rising rift slash anticipation
      ctx.save();
      ctx.fillStyle = '#00E5FF';
      ctx.shadowColor = '#00E5FF';
      ctx.shadowBlur = 20;
      ctx.beginPath();
      ctx.arc(tipX, 0, 8, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    } else if (state === FIGHTER_STATES.ULTIMATE && t < 18) {
      // Dimensional reality charge sphere
      ctx.save();
      const ultPulse = (t / 18) * 28;
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 4;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 32;
      ctx.beginPath();
      ctx.arc(tipX, 0, ultPulse, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    ctx.restore();
    ctx.restore();
  }

  // =========================================================================
  // SOLARIS: THE RADIANT JUGGERNAUT (Heavy Brawler • Energy Gauntlets • Armor)
  // =========================================================================
  drawSolarisCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#F59E0B' : '#FFB800';
    const armorColor = '#241E15';
    const pauldronColor = '#3A2E1C';
    const gauntletColor = coreColor;
    const hairColor = '#FBBF24';

    const state = f.state;
    const t = f.stateTimer;

    // --- Distinct Breathing & Juggernaut Stance ---
    const breath = Math.sin(frame * 0.06);
    let idleBob = breath * 1.8;
    let bodyLean = 0;
    let bodyOffsetY = idleBob;
    let leftArmX = -18, leftArmY = -55 + idleBob;
    let rightArmX = 18, rightArmY = -55 + idleBob;
    let gauntletGlow = Math.sin(frame * 0.15) * 0.3 + 0.7;
    let backLegAngle = 0;
    let frontLegAngle = 0;
    let isFloored = false;

    // Super Armor Golden Cocoon Aura
    if (f.hasSuperArmor) {
      ctx.save();
      ctx.strokeStyle = '#FFE066';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#FFB800';
      ctx.shadowBlur = 24;
      ctx.beginPath();
      ctx.ellipse(0, -60, 48, 68, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.fillStyle = 'rgba(255, 184, 0, 0.18)';
      ctx.fill();
      ctx.restore();
    }

    switch (state) {
      case FIGHTER_STATES.IDLE:
        // Immovable broad stance, knees bent wide, fists clenched at ready
        bodyLean = 0.02;
        leftArmX = -16; leftArmY = -58 + idleBob;
        rightArmX = 18; rightArmY = -54 + idleBob;
        frontLegAngle = 0.12;
        backLegAngle = -0.12;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Freight-train armored charge
          bodyLean = 0.38;
          const runCycle = Math.sin(frame * 0.32);
          frontLegAngle = runCycle * 0.44;
          backLegAngle = -runCycle * 0.44;
          leftArmX = 16 + runCycle * 16;
          rightArmX = 28 - runCycle * 16;
          leftArmY = -52;
          rightArmY = -48;
          if (frame % 3 === 0) this.addAfterimage(f);
        } else {
          // Deliberate heavy stomping advance
          bodyLean = 0.16;
          const walkCycle = Math.sin(frame * 0.18);
          frontLegAngle = walkCycle * 0.32;
          backLegAngle = -walkCycle * 0.32;
          leftArmX = -10 + walkCycle * 12;
          rightArmX = 18 - walkCycle * 14;
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = -0.14;
        const bWalk = Math.sin(frame * 0.18);
        frontLegAngle = -bWalk * 0.28;
        backLegAngle = bWalk * 0.28;
        leftArmX = -18; rightArmX = 14;
        break;

      case FIGHTER_STATES.BLOCK:
        // Colossal gauntlets interlocked in front as an impenetrable shield
        bodyLean = -0.06;
        bodyOffsetY = 3;
        leftArmX = 4; leftArmY = -65;
        rightArmX = 16; rightArmY = -62;
        break;

      case FIGHTER_STATES.DODGE:
        // Heavy armored shoulder duck / weave
        bodyLean = 0.45;
        bodyOffsetY = 16;
        leftArmX = 12; leftArmY = -42;
        rightArmX = -6; rightArmY = -38;
        if (frame % 3 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.HURT:
        bodyLean = -0.32;
        bodyOffsetY = 2;
        leftArmX = -24; leftArmY = -50;
        rightArmX = 6; rightArmY = -48;
        break;

      case FIGHTER_STATES.STUNNED:
        // Heavy stagger with venting solar steam
        bodyLean = Math.sin(frame * 0.16) * 0.12;
        bodyOffsetY = 4;
        leftArmX = -14; leftArmY = -46;
        rightArmX = 10; rightArmY = -44;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.12 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 24;
          const sy = -124 + Math.sin(a) * 8;
          ctx.fillStyle = '#FFE066';
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 3.5, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.65 + (t * 0.06);
        bodyOffsetY = -12;
        leftArmX = -22; leftArmY = -70;
        rightArmX = 12; rightArmY = -72;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        // Heavy colossus pushes up from arena floor with one fist
        bodyLean = 0.22;
        bodyOffsetY = 18 - (t * 0.85);
        leftArmX = -8; leftArmY = -35;
        rightArmX = 14; rightArmY = -30;
        break;

      case FIGHTER_STATES.VICTORY:
        // Claps colossal gauntlets together with a golden shockwave, then crosses arms as an immovable titan
        if (t < 14) {
          bodyLean = 0.05;
          leftArmX = 6; leftArmY = -66;
          rightArmX = 8; rightArmY = -66;
          // Golden impact ring on gauntlet clap
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3.5;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(7, -66, t * 4, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          // Immovable folded arms stance
          bodyLean = 0;
          leftArmX = 0; leftArmY = -65;
          rightArmX = 4; rightArmY = -62;
          // Radiant champion crest aura
          ctx.save();
          ctx.fillStyle = '#FFE066';
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 28;
          ctx.beginPath();
          ctx.arc(0, -68, 14 + Math.sin(frame * 0.15) * 3, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;

      case FIGHTER_STATES.DEFEATED:
        // Down on both knees, smoking gauntlets resting on the ground
        bodyLean = 0.22;
        bodyOffsetY = 24;
        leftArmX = -10; leftArmY = -24;
        rightArmX = 14; rightArmY = -24;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1: // Heavy Left Hook
        if (t <= 3) {
          // Windup: pulls back left gauntlet, heat vents flare
          leftArmX = -28; leftArmY = -56;
          rightArmX = 12; rightArmY = -52;
          bodyLean = -0.12;
          ctx.save();
          ctx.fillStyle = '#FFE066';
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(-28, -56, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          leftArmX = 28; leftArmY = -58;
          bodyLean = 0.18;
        }
        break;

      case FIGHTER_STATES.LIGHT_2: // Right Solar Cross
        if (t <= 3) {
          // Torso rotates back, right gauntlet coils
          rightArmX = -6; rightArmY = -52;
          leftArmX = 14; leftArmY = -56;
          bodyLean = -0.10;
        } else {
          rightArmX = 38; rightArmY = -56;
          bodyLean = 0.24;
        }
        break;

      case FIGHTER_STATES.LIGHT_3: // Double Hammer Gauntlet Slam
        if (t <= 4) {
          // Raises both gauntlets overhead
          leftArmX = 8; leftArmY = -92;
          rightArmX = 18; rightArmY = -92;
          bodyLean = -0.14;
        } else {
          leftArmX = 24; leftArmY = -35;
          rightArmX = 26; rightArmY = -35;
          bodyLean = 0.34;
        }
        break;

      case FIGHTER_STATES.HEAVY_1: // Seismic Overhead Slam
        if (t < 8) {
          // Massive overhead charge: expanding solar flares
          leftArmX = 6; leftArmY = -100;
          rightArmX = 16; rightArmY = -100;
          bodyLean = -0.18;
          ctx.save();
          const chargeR = 12 + (t / 8) * 16;
          ctx.strokeStyle = '#FFE066';
          ctx.lineWidth = 3;
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(11, -100, chargeR, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          leftArmX = 28; leftArmY = -24;
          rightArmX = 30; rightArmY = -24;
          bodyLean = 0.42;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER: // Rising Gauntlet Uppercut
        if (t < 4) {
          // Low crouch coil
          leftArmX = 6; leftArmY = -35;
          rightArmX = 10; rightArmY = -35;
          bodyLean = 0.25;
        } else {
          rightArmX = 24; rightArmY = -94;
          bodyLean = -0.22;
        }
        break;

      case FIGHTER_STATES.HEAVY_FINISHER: // Ground Pulverizer
        leftArmX = 26; leftArmY = -20;
        rightArmX = 28; rightArmY = -20;
        bodyLean = 0.40;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Solar Shockwave Ground Pound
        if (t < 4) {
          leftArmX = 14; leftArmY = -85;
          rightArmX = 18; rightArmY = -85;
          bodyLean = -0.10;
        } else {
          leftArmX = 20; leftArmY = -16;
          rightArmX = 24; rightArmY = -16;
          bodyLean = 0.38;
        }
        break;

      case FIGHTER_STATES.SPECIAL_2: // Meteor Armored Charge
        bodyLean = 0.54;
        leftArmX = 34; leftArmY = -52;
        rightArmX = 22; rightArmY = -52;
        if (frame % 2 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.ULTIMATE: // Solar Cataclysm
        if (t < 20) {
          leftArmX = 8; leftArmY = -108;
          rightArmX = 18; rightArmY = -108;
          bodyLean = 0;
          // Mini-sun charging sphere with solar corona
          ctx.save();
          const sunRadius = 14 + (t / 20) * 16;
          ctx.fillStyle = '#FFE066';
          ctx.shadowColor = '#FFB800';
          ctx.shadowBlur = 36;
          ctx.beginPath();
          ctx.arc(13, -108, sunRadius, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.stroke();
          ctx.restore();
        } else {
          leftArmX = 30; leftArmY = -18;
          rightArmX = 32; rightArmY = -18;
          bodyLean = 0.48;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.16;
      leftArmX = -12;
      rightArmX = 8;
    }

    // Floored / knockdown state
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -14);
      ctx.rotate(-Math.PI * 0.48);
      ctx.fillStyle = armorColor;
      ctx.fillRect(-18, -42, 36, 85);
      ctx.fillStyle = gauntletColor;
      ctx.fillRect(8, -12, 22, 16);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Colossal Armored Heavyweight Legs & Hydraulic Shock Greaves
    // Back Leg
    ctx.save();
    ctx.rotate(backLegAngle);
    // Thigh plate
    ctx.fillStyle = '#1D170E';
    ctx.beginPath();
    ctx.moveTo(-25, -46 + bodyOffsetY);
    ctx.lineTo(-7, -46 + bodyOffsetY);
    ctx.lineTo(-9, -24 + bodyOffsetY);
    ctx.lineTo(-23, -24 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Hydraulic piston conduit
    ctx.fillStyle = '#3A2E1A';
    ctx.fillRect(-22, -34 + bodyOffsetY, 4, 16);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-21, -30 + bodyOffsetY, 2, 8);
    // Heavy knee guard
    ctx.fillStyle = pauldronColor;
    ctx.fillRect(-25, -26 + bodyOffsetY, 18, 9);
    // Shin armor & Heavy blast boot
    ctx.fillStyle = '#2A2013';
    ctx.fillRect(-24, -18 + bodyOffsetY, 16, 14);
    ctx.fillStyle = '#15100B';
    ctx.beginPath();
    ctx.moveTo(-26, -6);
    ctx.lineTo(-6, -6);
    ctx.lineTo(-5, 0);
    ctx.lineTo(-27, 0);
    ctx.closePath();
    ctx.fill();
    // Boot sole armor plate
    ctx.fillStyle = coreColor;
    ctx.fillRect(-25, -4, 18, 3);
    ctx.restore();

    // Front Leg
    ctx.save();
    ctx.rotate(frontLegAngle);
    // Thigh plate with gold trim
    ctx.fillStyle = '#261E13';
    ctx.strokeStyle = '#4A3B22';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(5, -46 + bodyOffsetY);
    ctx.lineTo(23, -46 + bodyOffsetY);
    ctx.lineTo(21, -24 + bodyOffsetY);
    ctx.lineTo(7, -24 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Hydraulic piston
    ctx.fillStyle = '#3A2E1A';
    ctx.fillRect(8, -34 + bodyOffsetY, 4, 16);
    ctx.fillStyle = coreColor;
    ctx.fillRect(9, -30 + bodyOffsetY, 2, 8);
    // Heavy knee guard with solar hazard bevel
    ctx.fillStyle = pauldronColor;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.4;
    ctx.strokeRect(5, -26 + bodyOffsetY, 18, 9);
    ctx.fillRect(5, -26 + bodyOffsetY, 18, 9);
    // Shin armor
    ctx.fillStyle = '#322617';
    ctx.fillRect(6, -18 + bodyOffsetY, 16, 14);
    // Heavy blast boot
    ctx.fillStyle = '#18120B';
    ctx.beginPath();
    ctx.moveTo(4, -6);
    ctx.lineTo(24, -6);
    ctx.lineTo(25, 0);
    ctx.lineTo(3, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(4, -4, 20, 3);
    ctx.restore();

    // 2. Colossal Juggernaut Cuirass & Radiant Solar Reactor Core
    // Heavy abdomen & rib baffle plates
    ctx.fillStyle = '#1B140B';
    ctx.beginPath();
    ctx.moveTo(-16, -58 + bodyOffsetY);
    ctx.lineTo(16, -58 + bodyOffsetY);
    ctx.lineTo(20, -78 + bodyOffsetY);
    ctx.lineTo(-20, -78 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Rib vent lines
    ctx.strokeStyle = '#C89428';
    ctx.lineWidth = 1.2;
    ctx.strokeRect(-12, -72 + bodyOffsetY, 24, 3);
    ctx.strokeRect(-10, -66 + bodyOffsetY, 20, 3);

    // Colossal Chest Armor
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#5A4626';
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.moveTo(-24, -92 + bodyOffsetY);
    ctx.lineTo(24, -92 + bodyOffsetY);
    ctx.lineTo(19, -66 + bodyOffsetY);
    ctx.lineTo(0, -62 + bodyOffsetY);
    ctx.lineTo(-19, -66 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Radiant Solar Reactor Core (Glowing Multi-Ring Sun Orb)
    ctx.save();
    const sunPulse = gauntletGlow;
    // Ambient solar halo
    const sunGrad = ctx.createRadialGradient(0, -70 + bodyOffsetY, 2, 0, -70 + bodyOffsetY, 18);
    sunGrad.addColorStop(0, '#FFE066');
    sunGrad.addColorStop(0.4, coreColor);
    sunGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = sunGrad;
    ctx.beginPath();
    ctx.arc(0, -70 + bodyOffsetY, 18 * sunPulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer gear frame
    ctx.fillStyle = '#1A140B';
    ctx.beginPath();
    ctx.arc(0, -70 + bodyOffsetY, 13, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    // Core radiant sun orb
    ctx.fillStyle = '#FFB800';
    ctx.shadowColor = '#FFB800';
    ctx.shadowBlur = 18 * sunPulse;
    ctx.beginPath();
    ctx.arc(0, -70 + bodyOffsetY, 9, 0, Math.PI * 2);
    ctx.fill();

    // White solar center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -70 + bodyOffsetY, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Colossal Heavy Pauldrons with Heat Exhaust Vents
    ctx.fillStyle = pauldronColor;
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.6;
    // Left pauldron
    ctx.beginPath();
    ctx.moveTo(-34, -96 + bodyOffsetY);
    ctx.lineTo(-16, -96 + bodyOffsetY);
    ctx.lineTo(-14, -76 + bodyOffsetY);
    ctx.lineTo(-36, -80 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Left heat vent
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(-32, -88 + bodyOffsetY, 12, 3);

    // Right pauldron
    ctx.fillStyle = pauldronColor;
    ctx.beginPath();
    ctx.moveTo(16, -96 + bodyOffsetY);
    ctx.lineTo(34, -96 + bodyOffsetY);
    ctx.lineTo(36, -80 + bodyOffsetY);
    ctx.lineTo(14, -76 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Right heat vent
    ctx.fillStyle = '#FF4500';
    ctx.fillRect(20, -88 + bodyOffsetY, 12, 3);

    // 4. Heavy Gladiator Helm & Golden Sun-Crest
    ctx.fillStyle = '#140F08';
    ctx.beginPath();
    ctx.arc(0, -100 + bodyOffsetY, 12, 0, Math.PI * 2);
    ctx.fill();

    // Heavy Faceplate
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#5A4626';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-11, -106 + bodyOffsetY);
    ctx.lineTo(11, -106 + bodyOffsetY);
    ctx.lineTo(9, -92 + bodyOffsetY);
    ctx.lineTo(0, -88 + bodyOffsetY);
    ctx.lineTo(-9, -92 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Angled Golden Optic Visor Slits
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(-8, -100 + bodyOffsetY, 6, 3.5);
    ctx.fillRect(2, -100 + bodyOffsetY, 6, 3.5);
    ctx.restore();

    // Majestic Golden Sun-Crest Crown
    ctx.fillStyle = hairColor;
    ctx.strokeStyle = '#D97706';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(0, -122 + bodyOffsetY);
    ctx.lineTo(-16, -112 + bodyOffsetY);
    ctx.lineTo(-8, -106 + bodyOffsetY);
    ctx.lineTo(0, -110 + bodyOffsetY);
    ctx.lineTo(8, -106 + bodyOffsetY);
    ctx.lineTo(16, -112 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // 5. Colossal Aethel Gauntlets (Heavy Hydraulic Power Fists)
    const drawGauntlet = (gx, gy) => {
      ctx.save();
      ctx.translate(gx, gy);
      // Forearm armor base
      ctx.fillStyle = pauldronColor;
      ctx.strokeStyle = '#4A3B22';
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.rect(-12, -12, 24, 24);
      ctx.fill();
      ctx.stroke();

      // Heavy Gold Blast Shell
      ctx.fillStyle = gauntletColor;
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1.6;
      ctx.fillRect(-10, -14, 20, 28);
      ctx.strokeRect(-10, -14, 20, 28);

      // Hydraulic Piston Cylinders
      ctx.fillStyle = '#1A140B';
      ctx.fillRect(-8, -10, 4, 20);
      ctx.fillRect(4, -10, 4, 20);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-7, -8, 2, 16);
      ctx.fillRect(5, -8, 2, 16);

      // Glowing Golden Knuckle Studs
      ctx.fillStyle = '#FFFBEB';
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 14 * gauntletGlow;
      ctx.fillRect(6, -10, 6, 5);
      ctx.fillRect(6, -3, 6, 5);
      ctx.fillRect(6, 4, 6, 5);

      // Heat Radiation Exhaust Grid
      ctx.fillStyle = '#FF5500';
      ctx.fillRect(-8, 8, 14, 2);

      // Cancel window glint
      if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.strokeRect(-12, -16, 24, 32);
      }
      ctx.restore();
    };

    drawGauntlet(leftArmX, leftArmY);
    drawGauntlet(rightArmX, rightArmY);

    ctx.restore();
  }

    // =========================================================================
  // LYRA: THE PHANTOM ROSE (Lethal Assassin • Dual Daggers • Fast Strings)
  // =========================================================================
  drawLyraCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#EC4899' : '#FF2E93';
    const armorColor = '#161020';
    const ribbonColor = isP2 ? '#F472B6' : '#FFA8D5';
    const hairColor = '#FF6EB4';

    const state = f.state;
    const t = f.stateTimer;

    // --- Distinct Breathing & Assassin Stance ---
    const breath = Math.sin(frame * 0.14);
    let idleBob = breath * 2.4;
    let bodyLean = 0.08;
    let bodyOffsetY = 4 + idleBob;
    let d1Angle = 0.6, d2Angle = -0.4;
    let d1X = 14, d1Y = -48 + idleBob;
    let d2X = -12, d2Y = -46 + idleBob;
    let ribbonFlutter = Math.sin(frame * 0.22) * 16 + breath * 4;
    let backLegAngle = 0;
    let frontLegAngle = 0;
    let isFloored = false;

    switch (state) {
      case FIGHTER_STATES.IDLE:
        // Low predatory agile crouch, reverse-grip daggers twirling subtly
        bodyLean = 0.08;
        d1Angle = 0.68 + breath * 0.06;
        d2Angle = -0.48 - breath * 0.06;
        d1X = 14; d1Y = -48 + idleBob;
        d2X = -12; d2Y = -46 + idleBob;
        frontLegAngle = 0.18;
        backLegAngle = -0.16;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Blurring aerodynamic sprint with blades swept back
          bodyLean = 0.52;
          bodyOffsetY = 14;
          const runCycle = Math.sin(frame * 0.42);
          frontLegAngle = runCycle * 0.6;
          backLegAngle = -runCycle * 0.6;
          d1Angle = -1.8; d1X = -16; d1Y = -56;
          d2Angle = -1.8; d2X = -22; d2Y = -50;
          ribbonFlutter += 40;
          if (frame % 2 === 0) this.addAfterimage(f);
        } else {
          // Fluid stalking glide
          bodyLean = 0.24;
          bodyOffsetY = 8;
          const walkCycle = Math.sin(frame * 0.24);
          frontLegAngle = walkCycle * 0.38;
          backLegAngle = -walkCycle * 0.38;
          d1X = 18 + walkCycle * 8;
          d2X = -14 - walkCycle * 8;
          ribbonFlutter += 20;
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = -0.18;
        const bWalk = Math.sin(frame * 0.22);
        frontLegAngle = -bWalk * 0.3;
        backLegAngle = bWalk * 0.3;
        d1X = 10; d2X = -8;
        break;

      case FIGHTER_STATES.BLOCK:
        // Crossed daggers in agile X-guard
        bodyLean = -0.04;
        bodyOffsetY = 6;
        d1Angle = -0.8; d1X = 10; d1Y = -58;
        d2Angle = 0.8; d2X = 12; d2Y = -58;
        break;

      case FIGHTER_STATES.DODGE:
        // Low tumbling roll / cartwheel with ribbon trail and afterimages
        bodyLean = 0.68;
        bodyOffsetY = 24;
        d1Angle = -1.5; d1X = 8; d1Y = -35;
        d2Angle = 1.5; d2X = -8; d2Y = -35;
        ribbonFlutter += 45;
        if (frame % 2 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.HURT:
        bodyLean = -0.38;
        bodyOffsetY = 2;
        d1Angle = -1.2; d1X = -6; d1Y = -62;
        d2Angle = 0.4; d2X = -16; d2Y = -52;
        ribbonFlutter -= 15;
        break;

      case FIGHTER_STATES.STUNNED:
        bodyLean = Math.sin(frame * 0.2) * 0.16;
        bodyOffsetY = 6;
        d1Angle = 0.2; d1X = 4; d1Y = -42;
        d2Angle = -0.2; d2X = -6; d2Y = -40;
        // Fluttering dazed petals
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.15 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 20;
          const sy = -115 + Math.sin(a) * 8;
          ctx.fillStyle = '#FF6EB4';
          ctx.shadowColor = '#FF2E93';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.7 + (t * 0.08);
        bodyOffsetY = -16;
        d1Angle = -1.6; d2Angle = 1.6;
        d1X = 6; d2X = -12;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        // Acrobatic kip-up flip back onto feet
        bodyLean = 0.3 - (t * 0.03);
        bodyOffsetY = 20 - (t * 1.0);
        d1Angle = 0.4; d2Angle = -0.4;
        d1X = 12; d2X = -10;
        break;

      case FIGHTER_STATES.VICTORY:
        // Catches twirling daggers behind back, winks with visor flare and falling rose petals
        bodyLean = 0.04;
        bodyOffsetY = 2;
        d1Angle = -1.8; d1X = -10; d1Y = -50;
        d2Angle = -1.8; d2X = -16; d2Y = -46;
        ribbonFlutter = Math.sin(frame * 0.16) * 22;
        // Visor glint star
        ctx.save();
        ctx.fillStyle = '#FFFFFF';
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 18;
        ctx.beginPath();
        ctx.arc(4, -96 + bodyOffsetY, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        break;

      case FIGHTER_STATES.DEFEATED:
        // Gracefully collapsed on knees, daggers resting on floor
        bodyLean = 0.32;
        bodyOffsetY = 24;
        d1Angle = 1.57; d1X = 14; d1Y = -12;
        d2Angle = 1.57; d2X = 8; d2Y = -10;
        ribbonFlutter = 2;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1: // Swift Dagger Slash
        if (t <= 2) {
          // Anticipation: spring-loaded crouch retraction
          d1Angle = 0.2; d1X = -4; d1Y = -45;
          bodyLean = -0.06;
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(8, -48, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          d1Angle = -1.2; d1X = 26; d1Y = -54;
          bodyLean = 0.26;
        }
        break;

      case FIGHTER_STATES.LIGHT_2: // Reverse Spin Slash
        if (t <= 2) {
          d2Angle = 0.2; d2X = -6; d2Y = -44;
          bodyLean = -0.08;
        } else {
          d2Angle = 1.4; d2X = 28; d2Y = -50;
          bodyLean = 0.32;
        }
        break;

      case FIGHTER_STATES.LIGHT_3: // Triple Drill Flurry
        if (t <= 3) {
          d1Angle = 0; d2Angle = 0;
          d1X = 8; d2X = 4;
          bodyLean = 0.1;
        } else {
          d1Angle = Math.sin(frame * 0.8) * 1.5;
          d2Angle = -Math.sin(frame * 0.8) * 1.5;
          d1X = 30; d2X = 34;
          bodyLean = 0.36;
        }
        break;

      case FIGHTER_STATES.HEAVY_1: // Acrobat Somersault Slash
        if (t < 5) {
          // Crouch coil before takeoff
          bodyLean = 0.2;
          bodyOffsetY = 16;
          d1Angle = -0.5; d2Angle = 0.5;
          ctx.save();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(0, -60, 16, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          bodyLean = ((t - 5) / 10) * Math.PI * 2;
          bodyOffsetY = -14;
          d1Angle = bodyLean; d2Angle = bodyLean + Math.PI;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER: // Spiral Dagger Kick
        bodyLean = -0.32;
        d1Angle = -1.8; d1Y = -78;
        break;

      case FIGHTER_STATES.HEAVY_FINISHER: // Dual Cross Decapitation
        d1Angle = -0.7; d2Angle = 0.7;
        d1X = 28; d2X = 28; d1Y = -52; d2Y = -52;
        bodyLean = 0.40;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Shadowstep (Rose Mist Teleport)
        bodyLean = 0.52;
        d1X = 32; d2X = 28;
        if (frame % 2 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.SPECIAL_2: // Petal Tempest
        const spin = (t * 0.6) % (Math.PI * 2);
        d1Angle = spin; d2Angle = spin + Math.PI;
        d1X = Math.cos(spin) * 28; d2X = -Math.cos(spin) * 28;
        bodyLean = 0.15;
        break;

      case FIGHTER_STATES.ULTIMATE: // Rose Phantom Frenzy
        if (t < 16) {
          // Crossed daggers charge with swirling petals
          d1Angle = -0.8; d1X = 4; d1Y = -62;
          d2Angle = 0.8; d2X = 6; d2Y = -62;
          bodyLean = 0.1;
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(5, -62, t * 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          bodyLean = 0.45;
          d1Angle = -1.4; d1X = 32;
          d2Angle = 1.4; d2X = 30;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.2;
      ribbonFlutter += 35;
    }

    // Floored / knockdown state
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(-Math.PI * 0.46);
      ctx.fillStyle = armorColor;
      ctx.fillRect(-10, -36, 20, 72);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(8, -8, 24, 3);
      ctx.fillRect(12, 10, 24, 3);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Premium Aerodynamic Rose Ribbons & Speed Trails
    ctx.save();
    // Shadow ribbon tail
    ctx.strokeStyle = isP2 ? '#9D174D' : '#881337';
    ctx.lineWidth = 3.2;
    ctx.beginPath();
    ctx.moveTo(-8, -75 + bodyOffsetY);
    ctx.quadraticCurveTo(-26 - ribbonFlutter * 0.9, -48 + bodyOffsetY, -46 - ribbonFlutter * 0.9, -18 + bodyOffsetY);
    ctx.moveTo(-4, -75 + bodyOffsetY);
    ctx.quadraticCurveTo(-20 - ribbonFlutter * 0.7, -40 + bodyOffsetY, -38 - ribbonFlutter * 0.7, -10 + bodyOffsetY);
    ctx.stroke();

    // Vibrant main flowing ribbons
    ctx.strokeStyle = ribbonColor;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(-8, -77 + bodyOffsetY);
    ctx.quadraticCurveTo(-24 - ribbonFlutter, -50 + bodyOffsetY, -44 - ribbonFlutter, -20 + bodyOffsetY);
    ctx.moveTo(-4, -77 + bodyOffsetY);
    ctx.quadraticCurveTo(-18 - ribbonFlutter * 0.8, -42 + bodyOffsetY, -36 - ribbonFlutter * 0.8, -12 + bodyOffsetY);
    ctx.stroke();
    ctx.restore();

    // 2. High-Agility Assassin Legs & Sprint Boots
    // Back Leg
    ctx.save();
    ctx.rotate(backLegAngle);
    ctx.fillStyle = '#140E20';
    ctx.beginPath();
    ctx.moveTo(-14, -38 + bodyOffsetY);
    ctx.lineTo(-4, -38 + bodyOffsetY);
    ctx.lineTo(-5, -20 + bodyOffsetY);
    ctx.lineTo(-13, -20 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Rose circuitry line
    ctx.fillStyle = coreColor;
    ctx.fillRect(-13, -34 + bodyOffsetY, 1.8, 12);
    // Knee guard
    ctx.fillStyle = '#2A1838';
    ctx.fillRect(-14, -22 + bodyOffsetY, 9, 6);
    // Lower leg & High-velocity sprint boot
    ctx.fillStyle = '#191126';
    ctx.fillRect(-13, -16 + bodyOffsetY, 8, 12);
    ctx.fillStyle = '#0F0B18';
    ctx.beginPath();
    ctx.moveTo(-15, -6);
    ctx.lineTo(-3, -6);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-16, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(-14, -3, 10, 2);
    ctx.restore();

    // Front Leg
    ctx.save();
    ctx.rotate(frontLegAngle);
    ctx.fillStyle = '#1C132C';
    ctx.strokeStyle = '#382252';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, -38 + bodyOffsetY);
    ctx.lineTo(13, -38 + bodyOffsetY);
    ctx.lineTo(12, -20 + bodyOffsetY);
    ctx.lineTo(4, -20 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Luminescent rose quartz circuitry inlay
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 6;
    ctx.fillRect(4, -34 + bodyOffsetY, 2, 12);
    // Knee guard
    ctx.fillStyle = '#321A44';
    ctx.fillRect(3, -22 + bodyOffsetY, 10, 6);
    // Lower leg
    ctx.fillStyle = '#221634';
    ctx.fillRect(4, -16 + bodyOffsetY, 8, 12);
    // Sprint Boot
    ctx.fillStyle = '#140C20';
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(14, -6);
    ctx.lineTo(15, 0);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(2, -3, 12, 2);
    ctx.restore();

    // 3. Contoured Assassin Cuirass & Rose Quartz Core
    // Tapered abdomen
    ctx.fillStyle = '#110C1B';
    ctx.beginPath();
    ctx.moveTo(-8, -50 + bodyOffsetY);
    ctx.lineTo(8, -50 + bodyOffsetY);
    ctx.lineTo(11, -72 + bodyOffsetY);
    ctx.lineTo(-11, -72 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Chest cuirass with angled facet cuts
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#3F2256';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-13, -80 + bodyOffsetY);
    ctx.lineTo(13, -80 + bodyOffsetY);
    ctx.lineTo(10, -58 + bodyOffsetY);
    ctx.lineTo(0, -54 + bodyOffsetY);
    ctx.lineTo(-10, -58 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Rose Quartz Heart Core (Glowing Faceted Gem)
    ctx.save();
    const rosePulse = Math.sin(frame * 0.16) * 0.2 + 0.8;
    // Outer glow
    const roseGrad = ctx.createRadialGradient(0, -64 + bodyOffsetY, 1, 0, -64 + bodyOffsetY, 12);
    roseGrad.addColorStop(0, '#FDA4AF');
    roseGrad.addColorStop(0.5, coreColor);
    roseGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = roseGrad;
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 12 * rosePulse, 0, Math.PI * 2);
    ctx.fill();

    // Faceted diamond core
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 14 * rosePulse;
    ctx.beginPath();
    ctx.moveTo(0, -73 + bodyOffsetY);
    ctx.lineTo(7, -64 + bodyOffsetY);
    ctx.lineTo(0, -55 + bodyOffsetY);
    ctx.lineTo(-7, -64 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Inner white highlight
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Sleek Cowl, Flowing Magenta Twin-Tails & Cat-Eye Visor
    ctx.fillStyle = '#100A1A';
    ctx.beginPath();
    ctx.arc(0, -96 + bodyOffsetY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Sleek chin guard
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#4A2A68';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-7, -98 + bodyOffsetY);
    ctx.lineTo(7, -98 + bodyOffsetY);
    ctx.lineTo(5, -88 + bodyOffsetY);
    ctx.lineTo(0, -85 + bodyOffsetY);
    ctx.lineTo(-5, -88 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Glowing Rose Cat-Eye Sensor Slits
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.fillRect(-5, -94 + bodyOffsetY, 4, 2.5);
    ctx.fillRect(1, -94 + bodyOffsetY, 4, 2.5);
    ctx.restore();

    // Flowing Magenta Hair Tufts & Twin-Tails
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(0, -112 + bodyOffsetY);
    ctx.lineTo(-14, -100 + bodyOffsetY);
    ctx.lineTo(-8, -94 + bodyOffsetY);
    ctx.lineTo(0, -92 + bodyOffsetY);
    ctx.lineTo(8, -94 + bodyOffsetY);
    ctx.lineTo(14, -100 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Back twin ponytail lock
    ctx.beginPath();
    ctx.moveTo(-6, -96 + bodyOffsetY);
    ctx.quadraticCurveTo(-24, -88 + bodyOffsetY, -32 - ribbonFlutter * 0.6, -72 + bodyOffsetY);
    ctx.lineTo(-8, -100 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // 5. Dual Holographic Petal Shards (Curved Faceted Daggers)
    const drawDagger = (dx, dy, angle) => {
      ctx.save();
      ctx.translate(dx, dy);
      ctx.rotate(angle);

      // Ergonomic reverse-grip hilt
      ctx.fillStyle = '#1E122A';
      ctx.fillRect(-10, -2.5, 12, 5);
      ctx.fillStyle = coreColor;
      ctx.fillRect(-2, -5, 3, 10);

      // Faceted Crystalline Blade
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(1, -1.8, 30, 3.6);

      // Luminous Rose Quartz Cutting Edge
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      ctx.moveTo(1, 1.8);
      ctx.lineTo(31, 1.8);
      ctx.lineTo(38, -0.5);
      ctx.lineTo(31, -1.8);
      ctx.closePath();
      ctx.fill();

      // Blade Aura Outline
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 1.6;
      ctx.strokeRect(1, -2.5, 30, 5);

      // Cancel window glint
      if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 16;
        ctx.strokeRect(-2, -5, 38, 10);
      }
      ctx.restore();
    };

    drawDagger(d1X, d1Y, d1Angle);
    drawDagger(d2X, d2Y, d2Angle);

    ctx.restore();
  }

    // =========================================================================
  // AERON: THE AZURE WARDEN (Technical Fighter • Energy Staff • Spacing/Parry)
  // =========================================================================
  drawAeronCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#0284C7' : '#00D2FF';
    const armorColor = '#0F1E36';
    const mantleColor = '#1B355A';
    const hairColor = '#E0F2FE';

    const state = f.state;
    const t = f.stateTimer;

    // --- Distinct Breathing & Zen Monk Stance ---
    const breath = Math.sin(frame * 0.09);
    let idleBob = breath * 2.0;
    let bodyLean = 0;
    let bodyOffsetY = idleBob;
    let staffAngle = -0.55;
    let staffX = 6, staffY = -55 + idleBob;
    let staffLength = 88;
    let coatFlutter = Math.sin(frame * 0.16) * 10 + breath * 3;
    let backLegAngle = 0;
    let frontLegAngle = 0;
    let isFloored = false;

    switch (state) {
      case FIGHTER_STATES.IDLE:
        // Poised martial stance, staff held diagonally across body, relaxed breath
        staffAngle = -0.55 + Math.sin(frame * 0.08) * 0.08;
        staffX = 6; staffY = -55 + idleBob;
        frontLegAngle = 0.10;
        backLegAngle = -0.10;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Agile staff vault charge
          bodyLean = 0.34;
          const runCycle = Math.sin(frame * 0.36);
          frontLegAngle = runCycle * 0.48;
          backLegAngle = -runCycle * 0.48;
          staffAngle = 0.12;
          staffX = 18; staffY = -52;
          coatFlutter += 32;
          if (frame % 3 === 0) this.addAfterimage(f);
        } else {
          // Disciplined martial stride
          bodyLean = 0.14;
          const walkCycle = Math.sin(frame * 0.2);
          frontLegAngle = walkCycle * 0.34;
          backLegAngle = -walkCycle * 0.34;
          staffAngle = 0.2 + Math.sin(frame * 0.2) * 0.3;
          coatFlutter += 14;
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = -0.12;
        const bWalk = Math.sin(frame * 0.2);
        frontLegAngle = -bWalk * 0.28;
        backLegAngle = bWalk * 0.28;
        staffAngle = -0.75;
        staffX = 2;
        break;

      case FIGHTER_STATES.BLOCK:
        // Staff held vertically in center with two hands, kinetic barrier
        bodyLean = -0.06;
        staffAngle = 1.57;
        staffX = 14; staffY = -55;
        break;

      case FIGHTER_STATES.DODGE:
        // Fluid monk sidestep back-sway
        bodyLean = 0.52;
        bodyOffsetY = 18;
        staffAngle = 0.3;
        staffX = -6; staffY = -40;
        coatFlutter += 30;
        if (frame % 3 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.HURT:
        bodyLean = -0.32;
        bodyOffsetY = 2;
        staffAngle = -0.85;
        staffX = -4; staffY = -62;
        break;

      case FIGHTER_STATES.STUNNED:
        // Leaning heavily on staff, dazed azure sparks
        bodyLean = Math.sin(frame * 0.16) * 0.12;
        bodyOffsetY = 4;
        staffAngle = 0.95;
        staffX = 8; staffY = -48;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.12 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 20;
          const sy = -118 + Math.sin(a) * 8;
          ctx.fillStyle = '#00D2FF';
          ctx.shadowColor = '#00D2FF';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.68 + (t * 0.07);
        bodyOffsetY = -14;
        staffAngle = -1.2;
        staffX = -8; staffY = -68;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        // Vaults immediately back into upright poise using staff
        bodyLean = 0.22;
        bodyOffsetY = 16 - (t * 0.85);
        staffAngle = 1.4;
        staffX = 10; staffY = -45;
        break;

      case FIGHTER_STATES.VICTORY:
        // Rapid horizontal staff spin behind back, plants vertically with expanding azure harmonic ring
        if (t < 16) {
          staffAngle = (t * 0.8) % (Math.PI * 2);
          staffX = 4; staffY = -55;
          bodyLean = 0.04;
        } else {
          // Planted vertically
          staffAngle = 1.57;
          staffX = 14; staffY = -44;
          bodyLean = 0;
          // Expanding azure harmonic resonance ring
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.ellipse(14, 0, 32 + Math.sin(frame * 0.15) * 6, 8, 0, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        }
        break;

      case FIGHTER_STATES.DEFEATED:
        // Kneels resting forehead against vertically planted staff
        bodyLean = 0.25;
        bodyOffsetY = 22;
        staffAngle = 1.57;
        staffX = 12; staffY = -35;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1: // Extended Staff Thrust (Huge Range)
        if (t <= 3) {
          // Anticipation: pulls staff back along forearm with cyan kinetic gathering ring
          staffAngle = 0.02;
          staffX = -6; staffY = -56;
          bodyLean = -0.08;
          ctx.save();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 16;
          ctx.beginPath();
          ctx.arc(-6, -56, 12, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          staffAngle = 0.05;
          staffX = 38; staffY = -58;
          bodyLean = 0.22;
        }
        break;

      case FIGHTER_STATES.LIGHT_2: // Wide Horizontal Staff Sweep
        if (t <= 3) {
          staffAngle = -1.1;
          staffX = -4; staffY = -54;
          bodyLean = -0.10;
        } else {
          staffAngle = -0.8 + ((t - 3) / 11) * 2.2;
          staffX = 26; staffY = -56;
          bodyLean = 0.18;
        }
        break;

      case FIGHTER_STATES.LIGHT_3: // Two-Handed Staff Vault Smash
        if (t <= 4) {
          staffAngle = 0.8;
          staffX = 12; staffY = -65;
          bodyLean = -0.05;
        } else {
          staffAngle = 1.1;
          staffX = 30; staffY = -40;
          bodyLean = 0.32;
        }
        break;

      case FIGHTER_STATES.HEAVY_1: // 360 Whirlwind Spin
        if (t < 5) {
          staffAngle = -0.6;
          staffX = 0; staffY = -55;
          bodyLean = -0.15;
          ctx.save();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(0, -55, 20, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          staffAngle = ((t - 5) * 0.55) % (Math.PI * 2);
          staffX = 12; staffY = -55;
          bodyLean = 0.12;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER: // Vaulting Pole Lever Kick
        staffAngle = 1.3;
        staffX = 18; staffY = -35;
        bodyLean = -0.35;
        break;

      case FIGHTER_STATES.HEAVY_FINISHER: // Descending Staff Piston
        staffAngle = 1.57;
        staffX = 32; staffY = -24;
        bodyLean = 0.38;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Kinetic Sphere Discharge
        if (t < 4) {
          staffAngle = 0.05;
          staffX = 18; staffY = -60;
          // Kinetic pulse gathering
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(65, -60, 8, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          staffAngle = 0.1;
          staffX = 34; staffY = -60;
        }
        break;

      case FIGHTER_STATES.SPECIAL_2: // Vaulting Tempest
        staffAngle = 1.4;
        staffX = 16; staffY = -70;
        bodyOffsetY = -18;
        break;

      case FIGHTER_STATES.ULTIMATE: // Azure Sky Warden
        if (t < 18) {
          // Upright plant with expanding runic mandala
          staffAngle = 1.57;
          staffX = 10; staffY = -55;
          bodyOffsetY = -10;
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 26;
          ctx.beginPath();
          ctx.arc(10, -55, t * 2.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          staffAngle = 1.57;
          staffX = 0; staffY = -80;
          bodyOffsetY = -24;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.15;
      staffAngle = 1.2;
      coatFlutter += 28;
    }

    // Floored / knockdown state
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -12);
      ctx.rotate(-Math.PI * 0.46);
      ctx.fillStyle = armorColor;
      ctx.fillRect(-12, -38, 24, 76);
      ctx.fillStyle = '#102A43';
      ctx.fillRect(8, -8, 65, 4);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Flowing Cyber-Monk Robes & Kinetic Mantle
    ctx.save();
    // Shadow under-robe
    ctx.fillStyle = isP2 ? '#075985' : '#0C2340';
    ctx.beginPath();
    ctx.moveTo(-12, -78 + bodyOffsetY);
    ctx.lineTo(-28 - coatFlutter * 0.8, -16 + bodyOffsetY);
    ctx.lineTo(18, -16 + bodyOffsetY);
    ctx.lineTo(10, -78 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Main flowing mantle with azure gradient
    const mantleGrad = ctx.createLinearGradient(0, -78 + bodyOffsetY, 0, -18 + bodyOffsetY);
    mantleGrad.addColorStop(0, mantleColor);
    mantleGrad.addColorStop(1, '#0C4A6E');
    ctx.fillStyle = mantleGrad;
    ctx.beginPath();
    ctx.moveTo(-10, -76 + bodyOffsetY);
    ctx.lineTo(-24 - coatFlutter, -18 + bodyOffsetY);
    ctx.lineTo(16, -18 + bodyOffsetY);
    ctx.lineTo(8, -76 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Azure kinetic resonance rune border
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.8;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.restore();

    // 2. Disciplined Martial Greaves & Boots
    // Back Leg
    ctx.save();
    ctx.rotate(backLegAngle);
    ctx.fillStyle = '#091524';
    ctx.beginPath();
    ctx.moveTo(-16, -42 + bodyOffsetY);
    ctx.lineTo(-5, -42 + bodyOffsetY);
    ctx.lineTo(-6, -22 + bodyOffsetY);
    ctx.lineTo(-15, -22 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Knee brace
    ctx.fillStyle = '#143152';
    ctx.fillRect(-16, -24 + bodyOffsetY, 11, 6);
    // Lower leg
    ctx.fillStyle = '#0F2137';
    ctx.fillRect(-15, -18 + bodyOffsetY, 10, 14);
    // Combat Boot
    ctx.fillStyle = '#07101B';
    ctx.beginPath();
    ctx.moveTo(-17, -8);
    ctx.lineTo(-4, -8);
    ctx.lineTo(-3, 0);
    ctx.lineTo(-18, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(-16, -4, 12, 2.5);
    ctx.restore();

    // Front Leg
    ctx.save();
    ctx.rotate(frontLegAngle);
    ctx.fillStyle = '#10243C';
    ctx.strokeStyle = '#1E3E66';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, -42 + bodyOffsetY);
    ctx.lineTo(14, -42 + bodyOffsetY);
    ctx.lineTo(13, -22 + bodyOffsetY);
    ctx.lineTo(4, -22 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Knee brace with azure rune
    ctx.fillStyle = '#19416D';
    ctx.fillRect(3, -24 + bodyOffsetY, 12, 6);
    ctx.fillStyle = coreColor;
    ctx.fillRect(4, -22 + bodyOffsetY, 3, 2);
    // Lower leg
    ctx.fillStyle = '#132B47';
    ctx.fillRect(4, -18 + bodyOffsetY, 10, 14);
    // Combat Boot
    ctx.fillStyle = '#0A1524';
    ctx.beginPath();
    ctx.moveTo(2, -8);
    ctx.lineTo(16, -8);
    ctx.lineTo(17, 0);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(2, -4, 14, 2.5);
    ctx.restore();

    // 3. Poised Martial Cuirass & Azure Resonance Core
    // Tapered abdomen
    ctx.fillStyle = '#0B1728';
    ctx.beginPath();
    ctx.moveTo(-10, -56 + bodyOffsetY);
    ctx.lineTo(10, -56 + bodyOffsetY);
    ctx.lineTo(13, -78 + bodyOffsetY);
    ctx.lineTo(-13, -78 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Chest harness & Robe overlay
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#1D4573';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-15, -84 + bodyOffsetY);
    ctx.lineTo(15, -84 + bodyOffsetY);
    ctx.lineTo(12, -62 + bodyOffsetY);
    ctx.lineTo(0, -58 + bodyOffsetY);
    ctx.lineTo(-12, -62 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Azure Resonance Core (Concentric Harmonic Ripple Orb)
    ctx.save();
    const azurePulse = Math.sin(frame * 0.12) * 0.2 + 0.8;
    // Outer harmonic wave
    ctx.strokeStyle = `${coreColor}88`;
    ctx.lineWidth = 1.5;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(0, -68 + bodyOffsetY, 12 * azurePulse, 0, Math.PI * 2);
    ctx.stroke();

    // Inner orb
    ctx.fillStyle = coreColor;
    ctx.shadowBlur = 16 * azurePulse;
    ctx.beginPath();
    ctx.arc(0, -68 + bodyOffsetY, 7.5, 0, Math.PI * 2);
    ctx.fill();

    // White core center
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -68 + bodyOffsetY, 3, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 4. Martial Head, Ponytail & Cyan Optic Visor
    ctx.fillStyle = '#08111D';
    ctx.beginPath();
    ctx.arc(0, -98 + bodyOffsetY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Cyan Optic Data Visor
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 12;
    ctx.fillRect(-6, -96 + bodyOffsetY, 13, 3.5);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(-1, -95 + bodyOffsetY, 4, 2);
    ctx.restore();

    // Flowing Silver Cyber-Hair & Warrior Topknot
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(0, -114 + bodyOffsetY);
    ctx.lineTo(-14, -102 + bodyOffsetY);
    ctx.lineTo(-8, -96 + bodyOffsetY);
    ctx.lineTo(0, -94 + bodyOffsetY);
    ctx.lineTo(8, -96 + bodyOffsetY);
    ctx.lineTo(14, -102 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Ponytail flowing behind
    ctx.beginPath();
    ctx.moveTo(-2, -110 + bodyOffsetY);
    ctx.quadraticCurveTo(-18, -104 + bodyOffsetY, -26 - coatFlutter * 0.4, -92 + bodyOffsetY);
    ctx.lineTo(-4, -104 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // 5. Aegis Pole Staff (High-Fidelity Composite Bo Staff)
    ctx.save();
    ctx.translate(staffX, staffY);
    ctx.rotate(staffAngle);

    // Carbon-fiber shaft
    ctx.fillStyle = '#0F2642';
    ctx.fillRect(-staffLength / 2, -3.5, staffLength, 7);
    ctx.strokeStyle = '#22558F';
    ctx.lineWidth = 1;
    ctx.strokeRect(-staffLength / 2, -3.5, staffLength, 7);

    // Center grip wraps
    ctx.fillStyle = '#061322';
    ctx.fillRect(-14, -4, 28, 8);
    ctx.fillStyle = coreColor;
    ctx.fillRect(-10, -3, 3, 6);
    ctx.fillRect(7, -3, 3, 6);

    // Tip Emitters (Both Ends)
    const drawStaffTip = (offsetX) => {
      ctx.fillStyle = '#1A4068';
      ctx.fillRect(offsetX - 6, -5.5, 12, 11);
      // Radiant cyan plasma emitter
      ctx.fillStyle = coreColor;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 16;
      ctx.fillRect(offsetX - 3, -4, 6, 8);
      // White plasma core
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(offsetX - 1.5, -2, 3, 4);
    };

    drawStaffTip(-staffLength / 2);
    drawStaffTip(staffLength / 2);

    // Cancel window glint
    if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 16;
      ctx.strokeRect(-staffLength / 2 - 8, -6.5, staffLength + 16, 13);
    }
    ctx.restore();

    ctx.restore();
  }

    // =========================================================================
  // KAIRO: THE EMERALD SCOURGE (Aggressive Stalker • Razor Chain • Harpoon)
  // =========================================================================
  drawKairoCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#10B981' : '#00FF88';
    const armorColor = '#122418';
    const chainColor = coreColor;
    const hairColor = '#00FF88';

    const state = f.state;
    const t = f.stateTimer;

    // --- Distinct Breathing & Feral Predator Stance ---
    const breath = Math.sin(frame * 0.13);
    let idleBob = breath * 2.2;
    let bodyLean = 0.22; // Hunched feral posture
    let bodyOffsetY = 6 + idleBob;
    let handX = 18, handY = -48 + idleBob;
    let chainLength = 65;
    let backLegAngle = 0;
    let frontLegAngle = 0;
    let isFloored = false;

    switch (state) {
      case FIGHTER_STATES.IDLE:
        // Hunched menacing stalker posture, razor chain swaying in slow elliptical orbit
        bodyLean = 0.22;
        handX = 18 + Math.cos(frame * 0.1) * 4;
        handY = -48 + idleBob + Math.sin(frame * 0.1) * 3;
        frontLegAngle = 0.14;
        backLegAngle = -0.14;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Beast-like predatory sprint, head low, chain trailing behind
          bodyLean = 0.52;
          bodyOffsetY = 16;
          const runCycle = Math.sin(frame * 0.4);
          frontLegAngle = runCycle * 0.54;
          backLegAngle = -runCycle * 0.54;
          handX = -10; handY = -42;
          chainLength = 80;
          if (frame % 2 === 0) this.addAfterimage(f);
        } else {
          // Prowling stalker creep
          bodyLean = 0.35;
          bodyOffsetY = 10;
          const walkCycle = Math.sin(frame * 0.22);
          frontLegAngle = walkCycle * 0.36;
          backLegAngle = -walkCycle * 0.36;
          handX = 22 + walkCycle * 6;
          handY = -46;
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = 0.06;
        const bWalk = Math.sin(frame * 0.22);
        frontLegAngle = -bWalk * 0.28;
        backLegAngle = bWalk * 0.28;
        handX = 12; handY = -50;
        break;

      case FIGHTER_STATES.BLOCK:
        // Crosses chain-wrapped forearms in front of face
        bodyLean = 0.08;
        bodyOffsetY = 8;
        handX = 12; handY = -56;
        chainLength = 40;
        break;

      case FIGHTER_STATES.DODGE:
        // Low feral roll / beast pounce dodge
        bodyLean = 0.65;
        bodyOffsetY = 22;
        handX = -4; handY = -35;
        chainLength = 50;
        if (frame % 3 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.HURT:
        bodyLean = -0.34;
        bodyOffsetY = 2;
        handX = -8; handY = -55;
        chainLength = 45;
        break;

      case FIGHTER_STATES.STUNNED:
        // Swaying drunkenly, chains limp on floor
        bodyLean = Math.sin(frame * 0.18) * 0.16;
        bodyOffsetY = 6;
        handX = 6; handY = -38;
        chainLength = 35;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.14 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 20;
          const sy = -116 + Math.sin(a) * 8;
          ctx.fillStyle = '#00FF88';
          ctx.shadowColor = '#00FF88';
          ctx.shadowBlur = 8;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.7 + (t * 0.08);
        bodyOffsetY = -15;
        handX = -12; handY = -65;
        chainLength = 70;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        // Feral spring up, snapping whip immediately
        bodyLean = 0.35 - (t * 0.02);
        bodyOffsetY = 18 - (t * 0.9);
        handX = 14; handY = -42;
        chainLength = 55;
        break;

      case FIGHTER_STATES.VICTORY:
        // Cracks whip, loops chain around forearm, rests harpoon on shoulder, smirks with glowing green eyes
        if (t < 14) {
          bodyLean = 0.12;
          handX = 35; handY = -55;
          chainLength = 80;
          // Sonic crack particle
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(handX + chainLength, handY, t * 2.5, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          bodyLean = 0.08;
          handX = 8; handY = -62;
          chainLength = 32;
          // Emerald predator eye glint
          ctx.save();
          ctx.fillStyle = '#FFFFFF';
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(2, -92 + bodyOffsetY, 3.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        }
        break;

      case FIGHTER_STATES.DEFEATED:
        // Collapsed on stomach, one arm outstretched toward dropped harpoon
        bodyLean = 0.42;
        bodyOffsetY = 24;
        handX = 26; handY = -12;
        chainLength = 50;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1: // Fast Chain Snap
        if (t <= 3) {
          // Anticipation: coils whip back with emerald glint
          handX = -8; handY = -52;
          chainLength = 40;
          bodyLean = 0.12;
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(-8, -52, 5, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          handX = 38; handY = -52;
          chainLength = 88;
          bodyLean = 0.28;
        }
        break;

      case FIGHTER_STATES.LIGHT_2: // Horizontal Chain Lash
        if (t <= 3) {
          handX = -4; handY = -48;
          chainLength = 45;
          bodyLean = 0.1;
        } else {
          handX = 42; handY = -48;
          chainLength = 98;
          bodyLean = 0.32;
        }
        break;

      case FIGHTER_STATES.LIGHT_3: // Double Razor Lash
        if (t <= 3) {
          handX = 8; handY = -60;
          chainLength = 50;
          bodyLean = 0.15;
        } else {
          handX = 48; handY = -45;
          chainLength = 110;
          bodyLean = 0.38;
        }
        break;

      case FIGHTER_STATES.HEAVY_1: // Overhead Chain Slam (Huge Reach)
        if (t < 6) {
          // Overhead chain swirl anticipation
          handX = 6; handY = -95;
          chainLength = 65;
          bodyLean = -0.10;
          ctx.save();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 2.5;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 20;
          ctx.beginPath();
          ctx.arc(6, -95, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          handX = 54; handY = -28;
          chainLength = 135;
          bodyLean = 0.44;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER: // Serpent Coil Fling
        handX = 32; handY = -85;
        chainLength = 90;
        bodyLean = -0.15;
        break;

      case FIGHTER_STATES.HEAVY_FINISHER: // Downward Chain Spike Pull
        handX = 36; handY = -20;
        chainLength = 98;
        bodyLean = 0.45;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Chain Harpoon
        if (t < 4) {
          handX = -4; handY = -50;
          chainLength = 50;
          bodyLean = 0.18;
        } else {
          handX = 68; handY = -50;
          chainLength = 155;
          bodyLean = 0.32;
        }
        break;

      case FIGHTER_STATES.SPECIAL_2: // Venom Whirl
        bodyLean = 0.55;
        handX = 30; handY = -15;
        chainLength = 110;
        break;

      case FIGHTER_STATES.ULTIMATE: // Emerald Hellbound Chain
        if (t < 18) {
          // Bio-core supercharge
          handX = 14; handY = -65;
          chainLength = 60;
          bodyLean = 0.15;
          ctx.save();
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 26;
          ctx.beginPath();
          ctx.arc(14, -65, t * 2.2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          handX = 45; handY = -60;
          chainLength = 145;
          bodyLean = 0.45;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.12;
      handX = -6;
    }

    // Floored / knockdown state
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(-Math.PI * 0.46);
      ctx.fillStyle = armorColor;
      ctx.fillRect(-12, -36, 24, 74);
      ctx.fillStyle = chainColor;
      ctx.fillRect(10, 5, 45, 3);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Spiked Feral Chassis & Predator Legs
    // Back Leg
    ctx.save();
    ctx.rotate(backLegAngle);
    ctx.fillStyle = '#09150E';
    ctx.beginPath();
    ctx.moveTo(-16, -38 + bodyOffsetY);
    ctx.lineTo(-5, -38 + bodyOffsetY);
    ctx.lineTo(-6, -20 + bodyOffsetY);
    ctx.lineTo(-15, -20 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    // Spiked knee plate
    ctx.fillStyle = '#163322';
    ctx.fillRect(-16, -22 + bodyOffsetY, 12, 6);
    // Predator claw boot
    ctx.fillStyle = '#07100A';
    ctx.beginPath();
    ctx.moveTo(-18, -6);
    ctx.lineTo(-4, -6);
    ctx.lineTo(-2, 0);
    ctx.lineTo(-19, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(-17, -3, 13, 2);
    ctx.restore();

    // Front Leg
    ctx.save();
    ctx.rotate(frontLegAngle);
    ctx.fillStyle = '#12261A';
    ctx.strokeStyle = '#224D33';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(3, -38 + bodyOffsetY);
    ctx.lineTo(14, -38 + bodyOffsetY);
    ctx.lineTo(13, -20 + bodyOffsetY);
    ctx.lineTo(4, -20 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    // Spiked knee plate
    ctx.fillStyle = '#1B402B';
    ctx.fillRect(3, -22 + bodyOffsetY, 12, 6);
    ctx.fillStyle = coreColor;
    ctx.fillRect(4, -20 + bodyOffsetY, 3, 2);
    // Claw boot
    ctx.fillStyle = '#0B1710';
    ctx.beginPath();
    ctx.moveTo(2, -6);
    ctx.lineTo(16, -6);
    ctx.lineTo(17, 0);
    ctx.lineTo(1, 0);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = coreColor;
    ctx.fillRect(2, -3, 14, 2);
    ctx.restore();

    // 2. Chitinous Bio-Carapace & Toxic Emerald Core
    // Tapered abdomen
    ctx.fillStyle = '#0C1C13';
    ctx.beginPath();
    ctx.moveTo(-10, -52 + bodyOffsetY);
    ctx.lineTo(10, -52 + bodyOffsetY);
    ctx.lineTo(14, -74 + bodyOffsetY);
    ctx.lineTo(-14, -74 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Spiked Chest Cuirass
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#235237';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-16, -82 + bodyOffsetY);
    ctx.lineTo(16, -82 + bodyOffsetY);
    ctx.lineTo(12, -60 + bodyOffsetY);
    ctx.lineTo(0, -56 + bodyOffsetY);
    ctx.lineTo(-12, -60 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Spiked Jagged Pauldrons
    ctx.fillStyle = '#1E4730';
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.2;
    // Left pauldron with jagged barb
    ctx.beginPath();
    ctx.moveTo(-18, -84 + bodyOffsetY);
    ctx.lineTo(-30, -96 + bodyOffsetY);
    ctx.lineTo(-24, -78 + bodyOffsetY);
    ctx.lineTo(-14, -74 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right pauldron
    ctx.beginPath();
    ctx.moveTo(18, -84 + bodyOffsetY);
    ctx.lineTo(28, -94 + bodyOffsetY);
    ctx.lineTo(24, -78 + bodyOffsetY);
    ctx.lineTo(14, -74 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Pulsating Emerald Bio-Core (Toxic Bio-Plasma Reactor)
    ctx.save();
    const bioPulse = Math.sin(frame * 0.18) * 0.2 + 0.8;
    // Ambient bio halo
    const bioGrad = ctx.createRadialGradient(0, -64 + bodyOffsetY, 1, 0, -64 + bodyOffsetY, 14);
    bioGrad.addColorStop(0, '#A7F3D0');
    bioGrad.addColorStop(0.5, coreColor);
    bioGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = bioGrad;
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 14 * bioPulse, 0, Math.PI * 2);
    ctx.fill();

    // Outer jagged ring
    ctx.fillStyle = '#08170F';
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 9, 0, Math.PI * 2);
    ctx.fill();

    // Glowing bio-core
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 16 * bioPulse;
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 6.5, 0, Math.PI * 2);
    ctx.fill();

    // White core hot-spot
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(0, -64 + bodyOffsetY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 3. Feral Spiked Hair & Predator Mask
    ctx.fillStyle = '#08130C';
    ctx.beginPath();
    ctx.arc(0, -96 + bodyOffsetY, 10, 0, Math.PI * 2);
    ctx.fill();

    // Jagged Predator Jaw Guard
    ctx.fillStyle = '#13281C';
    ctx.strokeStyle = '#27573A';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-8, -98 + bodyOffsetY);
    ctx.lineTo(8, -98 + bodyOffsetY);
    ctx.lineTo(6, -88 + bodyOffsetY);
    ctx.lineTo(0, -84 + bodyOffsetY);
    ctx.lineTo(-6, -88 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Triple Glowing Emerald Compound Eye Lenses
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.arc(-4, -94 + bodyOffsetY, 2, 0, Math.PI * 2);
    ctx.arc(0, -96 + bodyOffsetY, 2, 0, Math.PI * 2);
    ctx.arc(4, -94 + bodyOffsetY, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Wild Spiked Feral Hair
    ctx.fillStyle = hairColor;
    ctx.beginPath();
    ctx.moveTo(0, -114 + bodyOffsetY);
    ctx.lineTo(-16, -106 + bodyOffsetY);
    ctx.lineTo(-6, -96 + bodyOffsetY);
    ctx.lineTo(-2, -102 + bodyOffsetY);
    ctx.lineTo(4, -98 + bodyOffsetY);
    ctx.lineTo(12, -108 + bodyOffsetY);
    ctx.lineTo(16, -98 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // 4. Segmented Emerald Razor Chain Whip ("Venom Spire")
    ctx.save();
    ctx.strokeStyle = chainColor;
    ctx.lineWidth = 3.5;
    ctx.shadowColor = chainColor;
    ctx.shadowBlur = 16;

    const segments = 7;
    ctx.beginPath();
    ctx.moveTo(handX, handY);
    for (let i = 1; i <= segments; i++) {
      const segT = i / segments;
      const sx = handX + segT * chainLength;
      const sy = handY + Math.sin(frame * 0.32 + i * 0.8) * 14;
      ctx.lineTo(sx, sy);
    }
    ctx.stroke();

    // Razor Segment Links
    for (let i = 1; i < segments; i++) {
      const segT = i / segments;
      const sx = handX + segT * chainLength;
      const sy = handY + Math.sin(frame * 0.32 + i * 0.8) * 14;
      ctx.fillStyle = '#08170F';
      ctx.fillRect(sx - 3, sy - 3, 6, 6);
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(sx - 1.5, sy - 1.5, 3, 3);
    }

    // Razor Harpoon Stinger Tip
    const tipX = handX + chainLength;
    const tipY = handY + Math.sin(frame * 0.32 + segments * 0.8) * 14;
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 18;
    ctx.beginPath();
    ctx.moveTo(tipX, tipY);
    ctx.lineTo(tipX + 18, tipY - 6);
    ctx.lineTo(tipX + 13, tipY);
    ctx.lineTo(tipX + 18, tipY + 6);
    ctx.closePath();
    ctx.fill();

    // Cancel window glint
    if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2.2;
      ctx.shadowColor = '#FFFFFF';
      ctx.shadowBlur = 16;
      ctx.strokeRect(tipX - 3, tipY - 9, 24, 18);
    }
    ctx.restore();

    ctx.restore();
  }

    // =========================================================================
  // NOX: THE VOID HARBINGER (Shadow Levitator • Void Scythes • Gravity Tricks)
  // =========================================================================
  drawNoxCharacter(ctx, f, frame, isP2) {
    const coreColor = isP2 ? '#9333EA' : '#A855F7';
    const armorColor = '#160E26';
    const mantleColor = '#24143D';
    const bladeColor = '#D8B4FE';

    const state = f.state;
    const t = f.stateTimer;

    // --- Distinct Ethereal Levitation Breathing & Void Stance ---
    const breath = Math.sin(frame * 0.1);
    let floatBob = breath * 6 - 15; // Continual hover 15px above ground
    let bodyLean = 0;
    let bodyOffsetY = floatBob;
    let s1Angle = 0.4, s2Angle = -0.4;
    let s1X = 16, s1Y = -56 + floatBob;
    let s2X = -14, s2Y = -56 + floatBob;
    let cloakRipple = Math.sin(frame * 0.18) * 8;
    let isFloored = false;

    switch (state) {
      case FIGHTER_STATES.IDLE:
        // Ethereal hovering poise, telekinetic scythes orbiting hands
        s1Angle = 0.4 + Math.sin(frame * 0.1) * 0.15;
        s2Angle = -0.4 - Math.sin(frame * 0.1) * 0.15;
        break;

      case FIGHTER_STATES.WALK_FWD:
        if (f.isRunning) {
          // Fast aerodynamic void flight
          bodyLean = 0.38;
          bodyOffsetY = floatBob - 10;
          s1Angle = -1.2; s1X = 24; s1Y = -50 + floatBob;
          s2Angle = -1.2; s2X = -18; s2Y = -46 + floatBob;
          cloakRipple += 18;
          if (frame % 2 === 0) this.addAfterimage(f);
        } else {
          // Gliding levitation
          bodyLean = 0.22;
          bodyOffsetY = floatBob - 4;
          s1Angle = 0.6;
          s2Angle = -0.2;
          cloakRipple += 8;
          if (frame % 3 === 0) this.addAfterimage(f);
        }
        break;

      case FIGHTER_STATES.WALK_BACK:
        bodyLean = -0.18;
        s1Angle = -0.2;
        s2Angle = 0.4;
        break;

      case FIGHTER_STATES.BLOCK:
        // Folds void cloak around body like dark wings, dark matter barrier
        bodyLean = 0;
        bodyOffsetY = floatBob + 4;
        s1Angle = 1.57; s1X = 6; s1Y = -58 + floatBob;
        s2Angle = -1.57; s2X = 8; s2Y = -58 + floatBob;
        break;

      case FIGHTER_STATES.DODGE: // Ethereal Teleport Blink
        bodyLean = 0.52;
        bodyOffsetY = floatBob - 8;
        if (frame % 2 === 0) this.addAfterimage(f);
        break;

      case FIGHTER_STATES.HURT:
        // Knocked out of hovering poise
        bodyLean = -0.32;
        bodyOffsetY = floatBob + 8;
        s1Angle = -1.2; s1X = -4;
        s2Angle = 0.8; s2X = -16;
        break;

      case FIGHTER_STATES.STUNNED:
        // Erratic hovering wobble, flickering singularity core
        bodyLean = Math.sin(frame * 0.2) * 0.18;
        bodyOffsetY = floatBob + Math.sin(frame * 0.3) * 6;
        s1Angle = 0.8; s2Angle = -0.8;
        ctx.save();
        for (let i = 0; i < 3; i++) {
          const a = frame * 0.14 + (i * Math.PI * 2 / 3);
          const sx = Math.cos(a) * 20;
          const sy = -118 + floatBob + Math.sin(a) * 8;
          ctx.fillStyle = '#A855F7';
          ctx.shadowColor = '#A855F7';
          ctx.shadowBlur = 10;
          ctx.beginPath();
          ctx.arc(sx, sy, 3, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
        break;

      case FIGHTER_STATES.LAUNCHED:
        bodyLean = -0.7 + (t * 0.08);
        bodyOffsetY = floatBob - 20;
        s1Angle = -1.6; s2Angle = 1.6;
        break;

      case FIGHTER_STATES.KNOCKDOWN:
        isFloored = true;
        break;

      case FIGHTER_STATES.WAKEUP:
        // Smoothly reconstitutes and levitates effortlessly back into the air
        bodyLean = 0.15;
        bodyOffsetY = 15 - (t * 1.4);
        s1Angle = 0.2; s2Angle = -0.2;
        break;

      case FIGHTER_STATES.VICTORY:
        // Ascends higher into the air, floats cross-legged inside an orbiting dark rift ring with rotating violet runes
        bodyLean = 0;
        bodyOffsetY = -36 + Math.sin(frame * 0.1) * 4;
        s1Angle = frame * 0.08; s1X = Math.cos(frame * 0.08) * 32; s1Y = -60 + bodyOffsetY;
        s2Angle = frame * 0.08 + Math.PI; s2X = Math.cos(frame * 0.08 + Math.PI) * 32; s2Y = -60 + bodyOffsetY;
        // Orbiting dark rift ring
        ctx.save();
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.5;
        ctx.shadowColor = coreColor;
        ctx.shadowBlur = 24;
        ctx.beginPath();
        ctx.ellipse(0, -60 + bodyOffsetY, 38, 12, frame * 0.04, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
        break;

      case FIGHTER_STATES.DEFEATED:
        // Drops to ground, collapsing into shadow mist
        bodyLean = 0.25;
        bodyOffsetY = 18;
        s1Angle = 1.57; s1X = 14; s1Y = -4;
        s2Angle = 1.57; s2X = -12; s2Y = -6;
        break;

      // --- ATTACKS WITH CRISP ANTICIPATION & FOLLOW-THROUGH ---
      case FIGHTER_STATES.LIGHT_1: // Void Scythe Slash
        if (t <= 3) {
          // Gravitational purple suction vortex anticipation
          s1Angle = 0.8; s1X = -4; s1Y = -55 + floatBob;
          bodyLean = -0.08;
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 18;
          ctx.beginPath();
          ctx.arc(-4, -55 + floatBob, 6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          s1Angle = -1.1; s1X = 28; s1Y = -62 + floatBob;
          bodyLean = 0.22;
        }
        break;

      case FIGHTER_STATES.LIGHT_2: // Eclipse Cross Rake
        if (t <= 3) {
          s2Angle = -0.6; s2X = -8; s2Y = -52 + floatBob;
          bodyLean = -0.06;
        } else {
          s2Angle = 1.2; s2X = 30; s2Y = -58 + floatBob;
          bodyLean = 0.25;
        }
        break;

      case FIGHTER_STATES.LIGHT_3: // Vortex Twist
        if (t <= 3) {
          s1Angle = 0; s2Angle = 0;
          s1X = 10; s2X = 4;
        } else {
          s1Angle = Math.PI; s2Angle = 0;
          s1X = 32; s2X = 26;
          bodyLean = 0.32;
        }
        break;

      case FIGHTER_STATES.HEAVY_1: // Dark Matter Cleave
        if (t < 6) {
          // Dark matter condensation
          s1Angle = -0.5; s2Angle = -0.5;
          s1X = 8; s2X = 14; s1Y = -85 + floatBob; s2Y = -85 + floatBob;
          bodyLean = -0.12;
          ctx.save();
          ctx.strokeStyle = coreColor;
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 24;
          ctx.beginPath();
          ctx.arc(11, -85 + floatBob, 18, 0, Math.PI * 2);
          ctx.stroke();
          ctx.restore();
        } else {
          s1Angle = 1.1; s2Angle = 1.1;
          s1X = 36; s2X = 32; s1Y = -35 + floatBob;
          bodyLean = 0.38;
        }
        break;

      case FIGHTER_STATES.HEAVY_LAUNCHER: // Gravitational Uplift
        s1Angle = -1.8; s1Y = -85 + floatBob;
        bodyLean = -0.25;
        break;

      case FIGHTER_STATES.HEAVY_FINISHER: // Event Horizon Spike
        s1Angle = 1.57; s1Y = -25 + floatBob;
        bodyLean = 0.40;
        break;

      case FIGHTER_STATES.SPECIAL_1: // Void Crescent Release
        if (t < 4) {
          s1Angle = 0.6; s1X = 12; s1Y = -58 + floatBob;
          ctx.save();
          ctx.fillStyle = coreColor;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 22;
          ctx.beginPath();
          ctx.arc(28, -58 + floatBob, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        } else {
          s1Angle = 0.1; s1X = 38; s1Y = -58 + floatBob;
        }
        break;

      case FIGHTER_STATES.SPECIAL_2: // Dark Rift Trap
        s2Angle = 1.4; s2X = 20; s2Y = -20;
        break;

      case FIGHTER_STATES.ULTIMATE: // Void Apocalypse Event Horizon
        if (t < 20) {
          // Event horizon singularity charge
          bodyOffsetY = -32;
          s1Angle = -0.8; s2Angle = 0.8;
          s1X = 20; s2X = -20;
          ctx.save();
          ctx.fillStyle = '#000000';
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 3;
          ctx.shadowColor = coreColor;
          ctx.shadowBlur = 32;
          ctx.beginPath();
          ctx.arc(0, -65 + bodyOffsetY, t * 1.5, 0, Math.PI * 2);
          ctx.fill();
          ctx.stroke();
          ctx.restore();
        } else {
          bodyOffsetY = -30;
          s1Angle = -1.2; s2Angle = 1.2;
          if (frame % 2 === 0) this.addAfterimage(f);
        }
        break;
    }

    // Turning pivot posture
    if (f.turnTimer > 0) {
      bodyLean = -0.18;
      cloakRipple += 24;
    }

    // Floored / knockdown state
    if (isFloored) {
      ctx.save();
      ctx.translate(0, -10);
      ctx.rotate(-Math.PI * 0.46);
      ctx.fillStyle = armorColor;
      ctx.fillRect(-10, -36, 20, 72);
      ctx.fillStyle = '#000000';
      ctx.fillRect(8, -6, 26, 4);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.rotate(bodyLean);

    // 1. Swirling Purple Void Vortex below floating feet
    ctx.save();
    const vortexRadius = 24 + Math.sin(frame * 0.2) * 6;
    // Outer accretion ring
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 2.4;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 20;
    ctx.beginPath();
    ctx.ellipse(0, 0, vortexRadius, 7, 0, 0, Math.PI * 2);
    ctx.stroke();

    // Inner dark singularity void
    ctx.fillStyle = 'rgba(11, 7, 20, 0.7)';
    ctx.beginPath();
    ctx.ellipse(0, 0, vortexRadius * 0.7, 4.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 2. Cosmic Void Mantle & Tattered Celestial Cloak
    ctx.save();
    // Shadow under-cloak
    ctx.fillStyle = '#08040F';
    ctx.beginPath();
    ctx.moveTo(-16, -82 + bodyOffsetY);
    ctx.quadraticCurveTo(-32 - cloakRipple, -40 + bodyOffsetY, -20 - cloakRipple, -8 + bodyOffsetY);
    ctx.lineTo(20 + cloakRipple, -8 + bodyOffsetY);
    ctx.quadraticCurveTo(32 + cloakRipple, -40 + bodyOffsetY, 16, -82 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Cosmic Nebula Gradient Mantle
    const voidGrad = ctx.createLinearGradient(0, -82 + bodyOffsetY, 0, -8 + bodyOffsetY);
    voidGrad.addColorStop(0, mantleColor);
    voidGrad.addColorStop(0.5, '#4C1D95');
    voidGrad.addColorStop(1, '#0B0714');
    ctx.fillStyle = voidGrad;
    ctx.beginPath();
    ctx.moveTo(-14, -80 + bodyOffsetY);
    ctx.quadraticCurveTo(-28 - cloakRipple, -40 + bodyOffsetY, -18 - cloakRipple, -10 + bodyOffsetY);
    ctx.lineTo(18 + cloakRipple, -10 + bodyOffsetY);
    ctx.quadraticCurveTo(28 + cloakRipple, -40 + bodyOffsetY, 14, -80 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Glittering Micro-Stars inside mantle
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 6; i++) {
      const starX = -12 + (i * 5) + Math.sin(frame * 0.1 + i) * 2;
      const starY = -50 + bodyOffsetY + (i * 7);
      const twinkle = Math.sin(frame * 0.2 + i * 1.5) * 0.4 + 0.6;
      ctx.globalAlpha = twinkle;
      ctx.fillRect(starX, starY, 1.6, 1.6);
    }
    ctx.globalAlpha = 1.0;

    // Glowing void hem
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    ctx.restore();

    // 3. Ethereal Torso & Black Hole Singularity Core
    ctx.fillStyle = armorColor;
    ctx.strokeStyle = '#382559';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(-12, -84 + bodyOffsetY);
    ctx.lineTo(12, -84 + bodyOffsetY);
    ctx.lineTo(9, -60 + bodyOffsetY);
    ctx.lineTo(0, -56 + bodyOffsetY);
    ctx.lineTo(-9, -60 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Black Hole Singularity Core (Event Horizon Ring & Light Bending)
    ctx.save();
    const voidPulse = Math.sin(frame * 0.14) * 0.2 + 0.8;
    // Event horizon accretion halo
    const eventGrad = ctx.createRadialGradient(0, -65 + bodyOffsetY, 2, 0, -65 + bodyOffsetY, 14);
    eventGrad.addColorStop(0, '#C084FC');
    eventGrad.addColorStop(0.5, coreColor);
    eventGrad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = eventGrad;
    ctx.beginPath();
    ctx.arc(0, -65 + bodyOffsetY, 14 * voidPulse, 0, Math.PI * 2);
    ctx.fill();

    // Pitch-black central singularity
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(0, -65 + bodyOffsetY, 8, 0, Math.PI * 2);
    ctx.fill();

    // Glowing event horizon ring
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 1.5;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 14 * voidPulse;
    ctx.stroke();
    ctx.restore();

    // 4. Shadow Hood, Void Horns & Glowing Violet Eyes
    ctx.fillStyle = '#0A0512';
    ctx.beginPath();
    ctx.moveTo(-14, -84 + bodyOffsetY);
    ctx.lineTo(0, -114 + bodyOffsetY);
    ctx.lineTo(14, -84 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();

    // Curved Void Horns
    ctx.fillStyle = '#22113D';
    ctx.strokeStyle = coreColor;
    ctx.lineWidth = 1.2;
    // Left horn
    ctx.beginPath();
    ctx.moveTo(-8, -104 + bodyOffsetY);
    ctx.lineTo(-22, -118 + bodyOffsetY);
    ctx.lineTo(-12, -100 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Right horn
    ctx.beginPath();
    ctx.moveTo(8, -104 + bodyOffsetY);
    ctx.lineTo(22, -118 + bodyOffsetY);
    ctx.lineTo(12, -100 + bodyOffsetY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Twin Glowing Violet Eyes
    ctx.save();
    ctx.fillStyle = coreColor;
    ctx.shadowColor = coreColor;
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(-4, -94 + bodyOffsetY, 2.5, 0, Math.PI * 2);
    ctx.arc(4, -94 + bodyOffsetY, 2.5, 0, Math.PI * 2);
    ctx.fill();
    // Center white glare
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(-4, -94 + bodyOffsetY, 1, 0, Math.PI * 2);
    ctx.arc(4, -94 + bodyOffsetY, 1, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // 5. Dual Curved Void Scythe-Daggers ("Eclipse Reapers")
    const drawVoidScythe = (sx, sy, angle) => {
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(angle);

      // Dark obsidian hilt
      ctx.fillStyle = '#140A24';
      ctx.fillRect(-4, -3, 8, 14);
      ctx.fillStyle = coreColor;
      ctx.fillRect(-2, -5, 4, 3);

      // Curved Crescent Scythe Blade
      ctx.fillStyle = bladeColor;
      ctx.strokeStyle = coreColor;
      ctx.lineWidth = 2.4;
      ctx.shadowColor = coreColor;
      ctx.shadowBlur = 18;
      ctx.beginPath();
      ctx.arc(12, 0, 24, -Math.PI * 0.45, Math.PI * 0.45);
      ctx.lineTo(18, 14);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Blade Spine Highlight
      ctx.fillStyle = '#FFFFFF';
      ctx.beginPath();
      ctx.arc(12, 0, 20, -Math.PI * 0.35, Math.PI * 0.35);
      ctx.stroke();

      // Cancel window glint
      if (f.isCancelWindowOpen && f.isCancelWindowOpen()) {
        ctx.strokeStyle = '#FFFFFF';
        ctx.lineWidth = 2.2;
        ctx.shadowColor = '#FFFFFF';
        ctx.shadowBlur = 16;
        ctx.strokeRect(6, -6, 26, 22);
      }

      ctx.restore();
    };

    drawVoidScythe(s1X, s1Y, s1Angle);
    drawVoidScythe(s2X, s2Y, s2Angle);

    ctx.restore();
  }

}

export const characterRenderer = new CharacterRenderer();
