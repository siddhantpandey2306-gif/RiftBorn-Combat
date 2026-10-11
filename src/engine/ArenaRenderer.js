// RIFTBORN Original Arena Rendering Engine
// 6 Distinct Atmospheric 2D Multi-Layer Parallax Arenas

export class ArenaRenderer {
  constructor() {
    this.animTime = 0;
    this.trainX = -200;
  }

  update(deltaTime) {
    this.animTime += deltaTime;
    this.trainX += 3.5;
    if (this.trainX > 1600) this.trainX = -300;
  }

  drawArena(ctx, arenaId, width, height, groundY) {
    let leftCol = '#FF0055';
    let rightCol = '#00D2FF';

    switch (arenaId) {
      case 'neon_metro':
        this.drawNeonMetro(ctx, width, height, groundY);
        leftCol = '#FF0055'; rightCol = '#00D2FF';
        break;
      case 'ancient_rift':
        this.drawAncientRift(ctx, width, height, groundY);
        leftCol = '#C084FC'; rightCol = '#00D2FF';
        break;
      case 'solar_temple':
        this.drawSolarTemple(ctx, width, height, groundY);
        leftCol = '#F59E0B'; rightCol = '#FBBF24';
        break;
      case 'frozen_core':
        this.drawFrozenCore(ctx, width, height, groundY);
        leftCol = '#38BDF8'; rightCol = '#C084FC';
        break;
      case 'void_arena':
        this.drawVoidArena(ctx, width, height, groundY);
        leftCol = '#A855F7'; rightCol = '#EC4899';
        break;
      case 'rooftop_city':
        this.drawRooftopCity(ctx, width, height, groundY);
        leftCol = '#FF3366'; rightCol = '#38BDF8';
        break;
      default:
        this.drawNeonMetro(ctx, width, height, groundY);
    }

    // Unified crisp tournament arena boundaries
    this.drawTournamentBoundaries(ctx, width, height, groundY, leftCol, rightCol);
  }

  // --- 1. NEON METRO ---
  drawNeonMetro(ctx, width, height, groundY) {
    const t = this.animTime;

    // 1. Deep Midnight Cyberpunk Sky Gradient
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#06060D');
    sky.addColorStop(0.5, '#0E091D');
    sky.addColorStop(0.85, '#1B0E2E');
    sky.addColorStop(1, '#250C3A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // 2. Far Layer: Distant Cyber Skyscrapers
    ctx.fillStyle = '#090714';
    for (let x = 0; x < width; x += 55) {
      const bHeight = 180 + ((x * 43) % 220);
      ctx.fillRect(x, groundY - bHeight - 70, 48, bHeight + 70);

      // Subtle skyscraper windows
      ctx.fillStyle = (x % 3 === 0) ? 'rgba(0, 210, 255, 0.28)' : 'rgba(255, 0, 128, 0.22)';
      for (let wy = groundY - bHeight - 50; wy < groundY - 80; wy += 20) {
        ctx.fillRect(x + 6, wy, 5, 6);
        ctx.fillRect(x + 18, wy, 5, 6);
        ctx.fillRect(x + 30, wy, 5, 6);
      }
      ctx.fillStyle = '#090714';
    }

    // 3. Mid Layer: Neon Holographic Billboards (placed at architectural mid-level below HUD line)
    const billboardY = Math.max(180, groundY - 260);
    // Left Billboard: "NEON METRO // SECTOR 9"
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.sin(t * 3.2) * 0.08;
    ctx.fillStyle = 'rgba(255, 0, 128, 0.08)';
    ctx.strokeStyle = 'rgba(255, 0, 127, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillRect(140, billboardY, 180, 54);
    ctx.strokeRect(140, billboardY, 180, 54);
    ctx.font = '700 13px "Oswald", sans-serif';
    ctx.fillStyle = 'rgba(255, 0, 127, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('NEON METRO', 230, billboardY + 24);
    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(255, 184, 217, 0.6)';
    ctx.fillText('SECTOR 9 // COMBAT DECK', 230, billboardY + 42);
    ctx.restore();

    // Right Billboard: "RIFT BORN"
    ctx.save();
    ctx.globalAlpha = 0.35 + Math.cos(t * 2.5) * 0.08;
    ctx.strokeStyle = 'rgba(0, 210, 255, 0.4)';
    ctx.lineWidth = 1.5;
    ctx.fillStyle = 'rgba(0, 210, 255, 0.08)';
    ctx.fillRect(width - 320, billboardY, 180, 54);
    ctx.strokeRect(width - 320, billboardY, 180, 54);
    ctx.font = '700 13px "Oswald", sans-serif';
    ctx.fillStyle = 'rgba(0, 210, 255, 0.7)';
    ctx.textAlign = 'center';
    ctx.fillText('RIFT BORN', width - 230, billboardY + 24);
    ctx.font = '500 9px "Inter", sans-serif';
    ctx.fillStyle = 'rgba(165, 243, 252, 0.6)';
    ctx.fillText('TACTICAL COMBAT DECK', width - 230, billboardY + 42);
    ctx.restore();

    // 4. Elevated Transit Rail & Maglev Train
    ctx.fillStyle = '#0C0F1B';
    ctx.fillRect(0, groundY - 65, width, 12);
    for (let rx = 35; rx < width; rx += 130) {
      ctx.fillRect(rx, groundY - 65, 14, 65);
    }
    // High Speed Maglev Train with glowing cyan lights
    ctx.fillStyle = '#00D2FF';
    ctx.shadowColor = '#00D2FF';
    ctx.shadowBlur = 14;
    ctx.fillRect(this.trainX, groundY - 76, 160, 10);
    ctx.shadowBlur = 0;

    // 5. Combat Platform: Wet Reflective Asphalt Arena Floor
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, height);
    floorGrad.addColorStop(0, '#101420');
    floorGrad.addColorStop(0.3, '#0A0D15');
    floorGrad.addColorStop(1, '#05070B');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Neon ground reflection strip
    ctx.save();
    const reflectGrad = ctx.createLinearGradient(0, groundY, 0, groundY + 40);
    reflectGrad.addColorStop(0, 'rgba(255, 0, 128, 0.12)');
    reflectGrad.addColorStop(1, 'rgba(0, 210, 255, 0.0)');
    ctx.fillStyle = reflectGrad;
    ctx.fillRect(0, groundY, width, 40);
    ctx.restore();

    // Center arena boundary line
    ctx.strokeStyle = '#FF3366';
    ctx.lineWidth = 2.5;
    ctx.shadowColor = '#FF3366';
    ctx.shadowBlur = 8;
    ctx.setLineDash([25, 20]);
    ctx.beginPath();
    ctx.moveTo(75, groundY + 42);
    ctx.lineTo(width - 75, groundY + 42);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.shadowBlur = 0;

  }

  // --- 2. ANCIENT RIFT ---
  drawAncientRift(ctx, width, height, groundY) {
    const t = this.animTime;

    // Cosmic deep space
    const sky = ctx.createRadialGradient(width / 2, height * 0.35, 20, width / 2, height * 0.35, width);
    sky.addColorStop(0, '#2E1065');
    sky.addColorStop(0.5, '#0F0B1E');
    sky.addColorStop(1, '#040209');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Stars
    ctx.fillStyle = '#FFFFFF';
    for (let i = 0; i < 40; i++) {
      const sx = (i * 97) % width;
      const sy = (i * 73) % (groundY - 50);
      const twinkle = Math.sin(t * 2 + i) * 0.5 + 0.5;
      ctx.globalAlpha = twinkle * 0.7 + 0.2;
      ctx.fillRect(sx, sy, 2, 2);
    }
    ctx.globalAlpha = 1.0;

    // Vertical Dimensional Tear (Cosmic Rift)
    ctx.save();
    const riftX = width / 2;
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 14;
    ctx.shadowColor = '#00D2FF';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.moveTo(riftX - 10, 0);
    ctx.bezierCurveTo(riftX + 40 + Math.sin(t) * 20, groundY * 0.3, riftX - 50 + Math.cos(t) * 20, groundY * 0.7, riftX, groundY);
    ctx.stroke();

    // Inner bright core of rift
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 4;
    ctx.stroke();
    ctx.restore();

    // Floating Ancient Monolith Pillars
    [-1, 1].forEach((dir, idx) => {
      const mx = width / 2 + dir * 320;
      const my = groundY - 180 + Math.sin(t * 1.5 + idx * 2) * 12;
      ctx.save();
      ctx.fillStyle = '#1E1B2E';
      ctx.strokeStyle = '#6B21A8';
      ctx.lineWidth = 2;
      ctx.fillRect(mx - 25, my, 50, 160);
      ctx.strokeRect(mx - 25, my, 50, 160);

      // Glowing Runic Glyphs
      ctx.fillStyle = '#C084FC';
      ctx.shadowColor = '#C084FC';
      ctx.shadowBlur = 10;
      for (let gy = my + 25; gy < my + 140; gy += 30) {
        ctx.fillRect(mx - 8, gy, 16, 4);
      }
      ctx.restore();
    });

    // Arena Platform: Floating Monolithic Stone
    ctx.fillStyle = '#1A162B';
    ctx.fillRect(40, groundY, width - 80, height - groundY);
    ctx.strokeStyle = '#A855F7';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 12;
    ctx.strokeRect(40, groundY, width - 80, height - groundY);
    ctx.shadowBlur = 0;
  }

  // --- 3. SOLAR TEMPLE ---
  drawSolarTemple(ctx, width, height, groundY) {
    const t = this.animTime;

    // Golden Zenith Sky
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#451A03');
    sky.addColorStop(0.4, '#78350F');
    sky.addColorStop(0.8, '#D97706');
    sky.addColorStop(1, '#FDE68A');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Massive Spinning Solar Disc in background
    ctx.save();
    const sunX = width / 2;
    const sunY = groundY - 140;
    ctx.translate(sunX, sunY);
    ctx.rotate(t * 0.15);

    // Radiant Sun Flare Rings
    ctx.fillStyle = 'rgba(251, 191, 36, 0.2)';
    ctx.beginPath();
    ctx.arc(0, 0, 150, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#F59E0B';
    ctx.lineWidth = 6;
    ctx.shadowColor = '#FDE047';
    ctx.shadowBlur = 30;
    ctx.beginPath();
    ctx.arc(0, 0, 110, 0, Math.PI * 2);
    ctx.stroke();

    // Solar Rays / Teeth
    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      ctx.beginPath();
      ctx.moveTo(Math.cos(angle) * 110, Math.sin(angle) * 110);
      ctx.lineTo(Math.cos(angle) * 145, Math.sin(angle) * 145);
      ctx.stroke();
    }
    ctx.restore();

    // Soaring Golden Clouds Below Horizon
    ctx.fillStyle = 'rgba(253, 230, 138, 0.45)';
    ctx.beginPath();
    ctx.arc(120, groundY - 20, 90, 0, Math.PI * 2);
    ctx.arc(280, groundY - 15, 120, 0, Math.PI * 2);
    ctx.arc(width - 200, groundY - 25, 110, 0, Math.PI * 2);
    ctx.fill();

    // Majestic Marble & Gold Columns
    [100, width - 140].forEach((colX) => {
      ctx.fillStyle = '#FEF3C7';
      ctx.fillRect(colX, groundY - 220, 40, 220);
      ctx.fillStyle = '#D97706';
      ctx.fillRect(colX - 8, groundY - 230, 56, 12);
      ctx.fillRect(colX - 6, groundY - 12, 52, 12);
    });

    // Floor: Golden Temple Sundial
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, height);
    floorGrad.addColorStop(0, '#78350F');
    floorGrad.addColorStop(1, '#2E1005');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    ctx.strokeStyle = '#FBBF24';
    ctx.lineWidth = 3;
    ctx.strokeRect(0, groundY, width, 6);
  }

  // --- 4. FROZEN CORE ---
  drawFrozenCore(ctx, width, height, groundY) {
    const t = this.animTime;

    // Sub-zero ice cave gradient
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#041624');
    sky.addColorStop(0.6, '#0B2942');
    sky.addColorStop(1, '#154360');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Shimmering Dynamic Aurora Borealis
    ctx.save();
    ctx.globalAlpha = 0.5 + Math.sin(t) * 0.15;
    const aurora = ctx.createLinearGradient(0, 40, width, 180);
    aurora.addColorStop(0, 'rgba(0, 255, 170, 0.4)');
    aurora.addColorStop(0.5, 'rgba(0, 210, 255, 0.5)');
    aurora.addColorStop(1, 'rgba(168, 85, 247, 0.4)');
    ctx.fillStyle = aurora;
    ctx.beginPath();
    ctx.moveTo(0, 60);
    ctx.bezierCurveTo(width * 0.3, 30 + Math.sin(t * 1.2) * 30, width * 0.7, 120 + Math.cos(t) * 30, width, 80);
    ctx.lineTo(width, 180);
    ctx.bezierCurveTo(width * 0.6, 210, width * 0.3, 140, 0, 160);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // Giant Crystalline Ice Stalactites
    ctx.fillStyle = '#38BDF8';
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    [60, 220, 500, width - 260, width - 80].forEach((x, i) => {
      const h = 70 + (i * 35) % 60;
      ctx.beginPath();
      ctx.moveTo(x - 18, 0);
      ctx.lineTo(x + 18, 0);
      ctx.lineTo(x, h);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    });

    // Reflective Ice Lake Arena Floor
    const iceGrad = ctx.createLinearGradient(0, groundY, 0, height);
    iceGrad.addColorStop(0, '#1E3A5F');
    iceGrad.addColorStop(0.3, '#0F2537');
    iceGrad.addColorStop(1, '#08141F');
    ctx.fillStyle = iceGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Ice Surface Gleam Line
    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#38BDF8';
    ctx.shadowBlur = 10;
    ctx.beginPath();
    ctx.moveTo(0, groundY);
    ctx.lineTo(width, groundY);
    ctx.stroke();
    ctx.shadowBlur = 0;
  }

  // --- 5. VOID ARENA ---
  drawVoidArena(ctx, width, height, groundY) {
    const t = this.animTime;

    // Void background
    ctx.fillStyle = '#030206';
    ctx.fillRect(0, 0, width, height);

    // Massive Supermassive Singularity / Black Hole
    const bhX = width / 2;
    const bhY = groundY - 150;

    // Swirling Violet Accretion Disk
    ctx.save();
    ctx.translate(bhX, bhY);
    ctx.rotate(t * 0.2);

    const accretion = ctx.createRadialGradient(0, 0, 50, 0, 0, 180);
    accretion.addColorStop(0, 'rgba(168, 85, 247, 0.9)');
    accretion.addColorStop(0.5, 'rgba(126, 34, 206, 0.5)');
    accretion.addColorStop(1, 'rgba(0, 0, 0, 0)');
    ctx.fillStyle = accretion;
    ctx.beginPath();
    ctx.ellipse(0, 0, 200, 70, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // Event Horizon (Absolute Black Center)
    ctx.save();
    ctx.fillStyle = '#000000';
    ctx.shadowColor = '#C084FC';
    ctx.shadowBlur = 35;
    ctx.beginPath();
    ctx.arc(bhX, bhY, 52, 0, Math.PI * 2);
    ctx.fill();

    // Gravitational Lensing Ring
    ctx.strokeStyle = '#FFFFFF';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(bhX, bhY, 54, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    // Floating Obsidian Octagonal Floor
    ctx.fillStyle = '#0D0814';
    ctx.fillRect(50, groundY, width - 100, height - groundY);

    // Glowing Violet Circuit Grid on floor
    ctx.strokeStyle = '#9333EA';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#A855F7';
    ctx.shadowBlur = 8;
    for (let gx = 80; gx < width - 80; gx += 50) {
      ctx.beginPath();
      ctx.moveTo(gx, groundY);
      ctx.lineTo(gx, height);
      ctx.stroke();
    }
    ctx.strokeRect(50, groundY, width - 100, height - groundY);
    ctx.shadowBlur = 0;
  }

  // --- 6. ROOFTOP CITY ---
  drawRooftopCity(ctx, width, height, groundY) {
    const t = this.animTime;

    // Sunset Twilight Skyline
    const sky = ctx.createLinearGradient(0, 0, 0, groundY);
    sky.addColorStop(0, '#0F172A');
    sky.addColorStop(0.5, '#312E81');
    sky.addColorStop(0.85, '#9333EA');
    sky.addColorStop(1, '#F43F5E');
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, width, height);

    // Sweeping Searchlight Beams
    ctx.save();
    ctx.globalAlpha = 0.25;
    [-1, 1].forEach((dir, i) => {
      const beamAngle = Math.sin(t * 0.8 + i) * 0.5 - 0.4 * dir;
      ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.beginPath();
      const originX = width / 2 + dir * 280;
      ctx.moveTo(originX, groundY - 20);
      ctx.lineTo(originX + Math.sin(beamAngle) * 500 - 60, 0);
      ctx.lineTo(originX + Math.sin(beamAngle) * 500 + 60, 0);
      ctx.closePath();
      ctx.fill();
    });
    ctx.restore();

    // Distant Megatower Silhouettes
    ctx.fillStyle = '#0B0F19';
    for (let x = 0; x < width; x += 85) {
      const h = 180 + ((x * 43) % 160);
      ctx.fillRect(x, groundY - h, 72, h);

      // Blinking red aviation lights on rooftops
      if (Math.floor(t * 2 + x) % 2 === 0) {
        ctx.fillStyle = '#EF4444';
        ctx.fillRect(x + 34, groundY - h - 6, 4, 4);
        ctx.fillStyle = '#0B0F19';
      }
    }

    // Penthouse Helipad Rooftop Floor
    const floorGrad = ctx.createLinearGradient(0, groundY, 0, height);
    floorGrad.addColorStop(0, '#1E293B');
    floorGrad.addColorStop(1, '#0F172A');
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, groundY, width, height - groundY);

    // Helipad Yellow Circle & "H" Marking
    ctx.save();
    ctx.strokeStyle = '#FACC15';
    ctx.lineWidth = 4;
    ctx.shadowColor = '#FACC15';
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.ellipse(width / 2, groundY + 45, 95, 25, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.font = '800 24px "Oswald", "Bebas Neue", sans-serif';
    ctx.fillStyle = '#FACC15';
    ctx.textAlign = 'center';
    ctx.fillText('H', width / 2, groundY + 53);
    ctx.restore();
  }
  drawTournamentBoundaries(ctx, width, height, groundY, leftColor = '#FF0055', rightColor = '#00D2FF') {
    const t = this.animTime;
    const pylonPulse = Math.sin(t * 4) * 0.2 + 0.8;

    // Center arena boundary dashed line
    ctx.save();
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    ctx.setLineDash([20, 16]);
    ctx.beginPath();
    ctx.moveTo(75, groundY + 42);
    ctx.lineTo(width - 75, groundY + 42);
    ctx.stroke();
    ctx.restore();

    // Left Boundary Pylon
    ctx.save();
    ctx.strokeStyle = leftColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = leftColor;
    ctx.shadowBlur = 14 * pylonPulse;
    ctx.beginPath();
    ctx.moveTo(75, groundY - 140);
    ctx.lineTo(75, groundY + 60);
    ctx.stroke();

    ctx.fillStyle = leftColor;
    ctx.fillRect(70, groundY - 145, 10, 8);
    ctx.fillStyle = `${leftColor}22`;
    ctx.fillRect(0, groundY - 140, 75, 200);
    ctx.restore();

    // Right Boundary Pylon
    ctx.save();
    ctx.strokeStyle = rightColor;
    ctx.lineWidth = 3;
    ctx.shadowColor = rightColor;
    ctx.shadowBlur = 14 * pylonPulse;
    ctx.beginPath();
    ctx.moveTo(width - 75, groundY - 140);
    ctx.lineTo(width - 75, groundY + 60);
    ctx.stroke();

    ctx.fillStyle = rightColor;
    ctx.fillRect(width - 80, groundY - 145, 10, 8);
    ctx.fillStyle = `${rightColor}22`;
    ctx.fillRect(width - 75, groundY - 140, 75, 200);
    ctx.restore();
  }
}

export const arenaRenderer = new ArenaRenderer();
