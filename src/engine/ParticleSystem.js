// RIFTBORN High-Performance Vector Particle & Combat FX System

export class ParticleSystem {
  constructor() {
    this.particles = [];
    this.damageTexts = [];
    this.slashArcs = [];
    this.shockwaves = [];
    this.ambientParticles = [];
  }

  reset() {
    this.particles = [];
    this.damageTexts = [];
    this.slashArcs = [];
    this.shockwaves = [];
    this.ambientParticles = [];
  }

  // --- AMBIENT PARTICLES ---
  initAmbient(arenaType, width, height) {
    this.ambientParticles = [];
    const count = 55;
    for (let i = 0; i < count; i++) {
      this.ambientParticles.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 1.2,
        vy: arenaType === 'rain' ? Math.random() * 8 + 6 : (Math.random() - 0.5) * 0.8,
        size: Math.random() * 2.5 + 1,
        alpha: Math.random() * 0.6 + 0.2,
        color: this.getAmbientColor(arenaType),
        type: arenaType
      });
    }
  }

  getAmbientColor(type) {
    switch (type) {
      case 'rain': return '#00D2FF';
      case 'floating_runes': return '#A855F7';
      case 'solar_embers': return '#FFB800';
      case 'snow_frost': return '#E0F2FE';
      case 'void_dust': return '#C084FC';
      case 'city_fog': return '#94A3B8';
      default: return '#FFFFFF';
    }
  }

  updateAmbient(width, height) {
    for (const p of this.ambientParticles) {
      p.x += p.vx;
      p.y += p.vy;

      if (p.type === 'rain') {
        if (p.y > height - 120) {
          p.y = 0;
          p.x = Math.random() * width;
        }
      } else {
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height - 120;
        if (p.y > height - 120) p.y = 0;
      }
    }
  }

  // --- COMBAT PARTICLES ---
  emitSparks(x, y, count = 12, color = '#FFCC00', spread = 5) {
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count + (Math.random() - 0.5);
      const speed = Math.random() * spread + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        gravity: 0.18,
        life: 1.0,
        decay: Math.random() * 0.04 + 0.03,
        size: Math.random() * 3.5 + 1.5,
        color
      });
    }
  }

  emitBurst(x, y, color = '#FF3366', radius = 30) {
    this.shockwaves.push({
      x,
      y,
      radius: 5,
      maxRadius: radius,
      color,
      lineWidth: 4,
      alpha: 1.0,
      decay: 0.06
    });

    for (let i = 0; i < 16; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 6 + 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.05,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.03,
        size: Math.random() * 4 + 2,
        color
      });
    }
  }

  emitSlashArc(x, y, facing, color, radius = 55, startAngle = -0.8, endAngle = 0.8) {
    this.slashArcs.push({
      x,
      y,
      facing,
      radius,
      startAngle,
      endAngle,
      color,
      alpha: 1.0,
      decay: 0.12,
      thickness: 6
    });
  }

  emitShockwave(x, y, color = '#00D2FF', maxRadius = 80) {
    this.shockwaves.push({
      x,
      y,
      radius: 10,
      maxRadius,
      color,
      lineWidth: 5,
      alpha: 1.0,
      decay: 0.04
    });
  }

  emitBlockSparks(x, y) {
    // Hexagonal barrier ripple
    this.shockwaves.push({
      x,
      y,
      radius: 8,
      maxRadius: 45,
      color: '#00E5FF',
      lineWidth: 3.5,
      alpha: 1.0,
      decay: 0.08
    });

    // Metallic deflected sparks
    for (let i = 0; i < 14; i++) {
      const angle = (Math.random() - 0.5) * Math.PI * 1.2;
      const speed = Math.random() * 7 + 3;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1,
        gravity: 0.2,
        life: 1.0,
        decay: Math.random() * 0.05 + 0.04,
        size: Math.random() * 3 + 1.5,
        color: '#00E5FF'
      });
    }
  }

  emitCancelFlash(x, y, color = '#FF3366') {
    // Sharp glint flare
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 28,
      color,
      lineWidth: 3,
      alpha: 1.0,
      decay: 0.12
    });

    for (let i = 0; i < 8; i++) {
      const angle = Math.random() * Math.PI * 2;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * 4,
        vy: Math.sin(angle) * 4,
        gravity: 0,
        life: 0.8,
        decay: 0.08,
        size: 2.5,
        color: '#FFFFFF'
      });
    }
  }

  emitDust(x, y, count = 4) {
    if (this.particles.length > 150) return;
    for (let i = 0; i < count; i++) {
      this.particles.push({
        x: x + (Math.random() - 0.5) * 14,
        y: y - Math.random() * 4,
        vx: (Math.random() - 0.5) * 2.2,
        vy: -Math.random() * 1.2 - 0.2,
        gravity: 0.05,
        life: 0.65,
        decay: 0.05,
        size: Math.random() * 4.5 + 2,
        color: 'rgba(148, 163, 184, 0.45)'
      });
    }
  }

  emitCritGlint(x, y) {
    // Sharp golden star glint & energy shard burst
    this.shockwaves.push({
      x,
      y,
      radius: 4,
      maxRadius: 36,
      color: '#FFD700',
      lineWidth: 3.5,
      alpha: 1.0,
      decay: 0.08
    });

    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4 + (Math.random() - 0.5) * 0.2;
      const speed = Math.random() * 5 + 3.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        gravity: 0.08,
        life: 0.85,
        decay: 0.06,
        size: 3.2,
        color: '#FFF275'
      });
    }
  }

  emitDamageText(x, y, text, type = 'normal') {
    let color = '#FFFFFF';
    let size = 18;
    let weight = '700';

    if (type === 'crit') {
      color = '#FFD700';
      size = 25;
      weight = '900';
      text = `CRIT! ${text}`;
    } else if (type === 'counter') {
      color = '#FF0055';
      size = 24;
      weight = '900';
      text = `COUNTER! ${text}`;
    } else if (type === 'block') {
      color = '#00E5FF';
      size = 18;
      weight = '900';
      text = `BLOCKED!`;
    } else if (type === 'dodge') {
      color = '#00FFFF';
      size = 24;
      weight = '900';
      text = `PERFECT DODGE!`;
    }

    this.damageTexts.push({
      x: x + (Math.random() - 0.5) * 16,
      y: y - 24,
      vy: -2.4,
      text: String(text),
      color,
      size,
      weight,
      alpha: 1.0,
      life: 1.0,
      decay: 0.03
    });
  }

  update(deltaTime) {
    // Regular particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity || 0;
      p.life -= p.decay;
      if (p.life <= 0) {
        this.particles.splice(i, 1);
      }
    }

    // Damage texts
    for (let i = this.damageTexts.length - 1; i >= 0; i--) {
      const t = this.damageTexts[i];
      t.y += t.vy;
      t.vy *= 0.94;
      t.life -= t.decay;
      t.alpha = Math.max(0, t.life);
      if (t.life <= 0) {
        this.damageTexts.splice(i, 1);
      }
    }

    // Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const s = this.shockwaves[i];
      s.radius += (s.maxRadius - s.radius) * 0.22 + 1.5;
      s.alpha -= s.decay;
      s.lineWidth = Math.max(1, s.lineWidth * 0.94);
      if (s.alpha <= 0 || s.radius >= s.maxRadius) {
        this.shockwaves.splice(i, 1);
      }
    }

    // Slash arcs
    for (let i = this.slashArcs.length - 1; i >= 0; i--) {
      const a = this.slashArcs[i];
      a.alpha -= a.decay;
      a.thickness *= 0.9;
      if (a.alpha <= 0) {
        this.slashArcs.splice(i, 1);
      }
    }

    // Performance safeguard: Cap active particle buffers
    if (this.particles.length > 150) {
      this.particles.splice(0, this.particles.length - 150);
    }
    if (this.shockwaves.length > 16) {
      this.shockwaves.splice(0, this.shockwaves.length - 16);
    }
    if (this.slashArcs.length > 10) {
      this.slashArcs.splice(0, this.slashArcs.length - 10);
    }
  }

  // --- VICTORY EFFECTS (COSMETIC REWARD LOOP) ---
  emitVictoryEffect(x, y, effectId = 'vfx_crimson_shockwave') {
    switch (effectId) {
      case 'vfx_supernova_burst':
        // Golden solar flare & cosmic stardust
        this.emitShockwave(x, y, '#FFB800', 160);
        this.emitShockwave(x, y, '#FFF7D6', 220);
        for (let i = 0; i < 35; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 8 + 3;
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 2,
            gravity: 0.08,
            life: 1.0,
            decay: 0.02,
            size: Math.random() * 5 + 2,
            color: (i % 2 === 0) ? '#FFB800' : '#FFFFFF'
          });
        }
        break;

      case 'vfx_cherry_blossom':
        // Neon phantom petals vortex
        this.emitShockwave(x, y, '#FF2E93', 140);
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          this.particles.push({
            x: x + (Math.random() - 0.5) * 80,
            y: y + (Math.random() - 0.5) * 60,
            vx: Math.cos(angle) * 3 + (Math.random() - 0.5) * 2,
            vy: -Math.random() * 4 - 1.5,
            gravity: -0.02, // float upward
            life: 1.0,
            decay: 0.015,
            size: Math.random() * 4 + 2,
            color: (i % 3 === 0) ? '#FF2E93' : '#FFA6D6'
          });
        }
        break;

      case 'vfx_azure_tempest':
        // Electric bolts and kinetic storm
        this.emitShockwave(x, y, '#00D2FF', 170);
        for (let i = 0; i < 28; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 9 + 4;
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            gravity: 0.12,
            life: 1.0,
            decay: 0.035,
            size: Math.random() * 4 + 1.5,
            color: (i % 2 === 0) ? '#00D2FF' : '#E0F2FE'
          });
        }
        break;

      case 'vfx_crimson_singularity':
        // Void singularity gravitational burst
        this.emitShockwave(x, y, '#E11D48', 130);
        this.emitShockwave(x, y, '#881337', 190);
        for (let i = 0; i < 30; i++) {
          const angle = Math.random() * Math.PI * 2;
          const dist = Math.random() * 80 + 30;
          this.particles.push({
            x: x + Math.cos(angle) * dist,
            y: y + Math.sin(angle) * dist,
            vx: -Math.cos(angle) * 4,
            vy: -Math.sin(angle) * 4,
            gravity: 0,
            life: 1.0,
            decay: 0.025,
            size: Math.random() * 5 + 2,
            color: (i % 2 === 0) ? '#E11D48' : '#C084FC'
          });
        }
        break;

      case 'vfx_crimson_shockwave':
      default:
        // Ground cleaving Crimson Shockwave
        this.emitShockwave(x, y, '#FF3366', 150);
        this.emitShockwave(x, y, '#FF8099', 200);
        for (let i = 0; i < 25; i++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = Math.random() * 7 + 3;
          this.particles.push({
            x,
            y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed - 1.5,
            gravity: 0.15,
            life: 1.0,
            decay: 0.03,
            size: Math.random() * 4 + 2,
            color: '#FF3366'
          });
        }
        break;
    }
  }

  draw(ctx) {
    ctx.save();

    // Draw ambient particles
    for (const p of this.ambientParticles) {
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      if (p.type === 'rain') {
        ctx.fillRect(p.x, p.y, 1.2, p.size * 4);
      } else {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Draw shockwaves
    for (const s of this.shockwaves) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.alpha);
      ctx.strokeStyle = s.color;
      ctx.lineWidth = s.lineWidth;
      ctx.shadowColor = s.color;
      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.radius, 0, Math.PI * 2);
      ctx.stroke();

      // Secondary subtle outer ripple
      if (s.radius > 12) {
        ctx.globalAlpha = Math.max(0, s.alpha * 0.45);
        ctx.lineWidth = Math.max(1, s.lineWidth * 0.5);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.radius * 0.8, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.restore();
    }

    // Draw slash arcs
    for (const a of this.slashArcs) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, a.alpha);
      ctx.strokeStyle = a.color;
      ctx.lineWidth = a.thickness;
      ctx.lineCap = 'round';
      ctx.shadowColor = a.color;
      ctx.shadowBlur = 14;
      ctx.beginPath();
      const offsetAngle = a.facing === 1 ? 0 : Math.PI;
      ctx.arc(a.x, a.y, a.radius, a.startAngle + offsetAngle, a.endAngle + offsetAngle);
      ctx.stroke();
      ctx.restore();
    }

    // Draw sparks - directional velocity-aligned streaks with white-hot cores
    for (const p of this.particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, p.life);
      const speed = Math.hypot(p.vx, p.vy);

      if (speed > 1.2) {
        const angle = Math.atan2(p.vy, p.vx);
        const streakLength = Math.max(1, Math.min(22, Math.max((p.size || 2) * 2, speed * 2.4)));
        const radY = Math.max(0.5, (p.size || 2) * 0.65);
        ctx.translate(p.x, p.y);
        ctx.rotate(angle);
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 6;

        // Outer chromatic energy streak
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.ellipse(0, 0, streakLength, radY, 0, 0, Math.PI * 2);
        ctx.fill();

        // Inner white-hot needle core
        ctx.fillStyle = '#FFFFFF';
        ctx.beginPath();
        ctx.ellipse(0, 0, Math.max(0.5, streakLength * 0.55), Math.max(0.3, radY * 0.5), 0, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Slow floating ember / ground dust
        ctx.fillStyle = p.color;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }

    // Draw damage texts
    for (const t of this.damageTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, t.alpha);
      ctx.font = `${t.weight} ${t.size}px 'Oswald', 'Bebas Neue', sans-serif`;
      ctx.fillStyle = t.color;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 4;
      ctx.textAlign = 'center';
      ctx.fillText(t.text, t.x, t.y);
      ctx.restore();
    }

    ctx.restore();
  }
}
