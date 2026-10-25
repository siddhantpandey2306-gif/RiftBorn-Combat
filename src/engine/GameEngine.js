// RIFTBORN Master Game Engine
// Fixed 60FPS loop, Fighting Game Dynamic Camera, Hit-Stop, Best-of-3 Round System, and Input Management

import { Fighter, FIGHTER_STATES } from './Fighter.js';
import { CombatSystem } from './CombatSystem.js';
import { ParticleSystem } from './ParticleSystem.js';
import { characterRenderer } from './CharacterRenderer.js';
import { arenaRenderer } from './ArenaRenderer.js';
import { soundEngine } from './SoundEngine.js';
import { FighterAI } from '../ai/FighterAI.js';
import { CHARACTERS, ARENAS } from '../characters/characterData.js';
import { progressionManager } from '../progression/ProgressionManager.js';
import { TouchControls } from './TouchControls.js';

export class GameEngine {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');

    // Virtual Resolution (16:9 standard for competitive fighting games)
    this.width = 1280;
    this.height = 720;
    this.groundY = 540;

    this.canvas.width = this.width;
    this.canvas.height = this.height;

    // Subsystems
    this.combatSystem = new CombatSystem(this);
    this.particleSystem = new ParticleSystem();
    this.projectiles = [];
    this.p1 = null;
    this.p2 = null;
    this.ai = null;

    // Mode & Settings
    this.gameMode = 'Casual';
    this.currentArena = 'neon_metro';
    this.isLocal2Player = false;
    this.showHitboxes = false;
    this.isPaused = false;
    this.isRunning = false;

    // Dynamic Fighting Camera
    this.cameraTrauma = 0;
    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.cameraX = this.width / 2;
    this.cameraY = this.height / 2;

    // Hit-stop & Time Dilation
    this.hitStopFrames = 0;
    this.timeDilation = 1.0;
    this.timeDilationTimer = 0;

    // Best-of-3 Round Management
    this.roundNumber = 1;
    this.roundTime = 99;
    this.roundTimerMs = 0;
    this.roundState = 'INTRO_READY'; // 'INTRO_READY', 'INTRO_FIGHT', 'FIGHTING', 'ROUND_OVER', 'MATCH_OVER'
    this.stateTimer = 0;
    this.announcementTitle = '';
    this.announcementSubtitle = '';
    this.announcementAlpha = 0;

    // Carefully Controlled Screen Feedback System
    this.screenFlash = { alpha: 0, color: '#FFFFFF' };
    this.hurtVignette = { alpha: 0, color: '#FF0033' };
    this.blockVignette = { alpha: 0, color: '#00E5FF' };
    this.dodgeVignette = { alpha: 0, color: '#00FFFF' };

    // Key Tracking & Virtual Touch Inputs (PC + Mobile Responsive Architecture)
    this.keys = {};
    this.virtualInput = {
      left: false,
      right: false,
      up: false,
      down: false,
      block: false
    };
    this.touchControls = new TouchControls(this);
    this.setupInputs();

    // Callbacks
    this.onMatchEnd = null;
    this.onHudUpdate = null;
    this.onPlayerAction = null;

    // Loop Timing & Diagnostics
    this.animFrameId = null;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fixedDelta = 1 / 60;
    this.fps = 60;
    this.fpsTimer = performance.now();
    this.fpsCount = 0;
    this.showDiagnostics = false;
    this.lastInputTelemetry = 'NONE';
  }

  // Mobile / Touch action dispatcher (100% gameplay parity with PC)
  triggerPlayerAction(action) {
    if (this.roundState === 'FIGHTING' && this.p1 && !this.isPaused) {
      const normAction = (action === 'SPECIAL' || action === 'SPECIAL_1') ? 'SPECIAL_1' : action;
      if (this.matchStats) {
        if (normAction === 'SPECIAL_1' || normAction === 'SPECIAL_2') this.matchStats.p1Specials++;
        if (normAction === 'ULTIMATE') { this.matchStats.p1Ultimates++; this.matchStats.usedUltInMatch = true; }
      }
      this.lastInputTelemetry = normAction;
      if (normAction === 'JUMP') {
        this.p1.jump();
      } else {
        this.p1.handleDirectInput(normAction, this.p2, this.particleSystem);
      }
      if (this.onPlayerAction) this.onPlayerAction(normAction);
    }
  }

  setVirtualMovement(horizontal, vertical) {
    this.virtualInput.left = (horizontal < -0.25);
    this.virtualInput.right = (horizontal > 0.25);
    this.virtualInput.down = (vertical > 0.45);
    this.virtualInput.up = (vertical < -0.45);

    if (Math.abs(horizontal) > 0.25 || Math.abs(vertical) > 0.25) {
      if (this.onPlayerAction) this.onPlayerAction('MOVE');
    }

    // Jump trigger on vertical flick upwards
    if (vertical < -0.65 && this.p1 && this.p1.canMove() && this.p1.isGrounded) {
      this.p1.jump();
    }
  }

  setVirtualBlock(isBlocking) {
    this.virtualInput.block = !!isBlocking;
    if (isBlocking && this.onPlayerAction) {
      this.onPlayerAction('BLOCK');
    }
  }

  setupInputs() {
    if (typeof window === 'undefined') return;

    // Standard in-game combat key codes
    const GAME_KEYS = new Set([
      'Space', 'KeyW', 'KeyA', 'KeyS', 'KeyD',
      'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
      'KeyJ', 'KeyK', 'KeyL', 'KeyI', 'KeyU', 'KeyO', 'KeyE', 'KeyR', 'KeyF', 'KeyG', 'KeyH',
      'ShiftLeft', 'ShiftRight',
      'Numpad0', 'Numpad1', 'Numpad2', 'Numpad3', 'Numpad4', 'Numpad5', 'Numpad6',
      'Digit1', 'Digit2', 'Digit3', 'Digit4', 'Digit5', 'Digit6'
    ]);

    window.addEventListener('keydown', (e) => {
      // Do not intercept keystrokes if typing inside legitimate form inputs or menus
      if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) {
        return;
      }

      // Handle pause toggle with Escape or P key
      if (e.code === 'Escape' || e.code === 'KeyP') {
        const isGameView = typeof document !== 'undefined' && document.getElementById('game-view')?.style.display === 'block';
        if (isGameView || this.roundState === 'FIGHTING' || this.isPaused) {
          e.preventDefault();
          if (typeof window !== 'undefined' && window.riftbornApp && window.riftbornApp.togglePause) {
            window.riftbornApp.togglePause();
            return;
          }
        }
      }

      this.keys[e.code] = true;

      // During active match or match intros, strictly prevent browser default behaviors (scrolling, button focus activation)
      const isGameViewActive = typeof document !== 'undefined' && document.getElementById('game-view')?.style.display === 'block';
      if ((isGameViewActive || this.roundState === 'FIGHTING' || this.roundState === 'INTRO_READY' || this.roundState === 'INTRO_FIGHT') && !this.isPaused) {
        if (GAME_KEYS.has(e.code)) {
          e.preventDefault();
        }
      }

      if (this.roundState === 'FIGHTING' && !this.isPaused) {

        // Single-press action triggers for P1 (Zero-Latency Direct Input Execution)
        // PC: WASD (Move/Jump), J (Light), K (Heavy), L (Special), I (Ultimate), Space (Dodge), Shift (Block)
        if (this.p1) {
          if (e.code === 'KeyJ' || e.code === 'KeyF') {
            this.p1.handleDirectInput('LIGHT', this.p2, this.particleSystem);
            if (this.onPlayerAction) this.onPlayerAction('LIGHT');
          } else if (e.code === 'KeyK' || e.code === 'KeyG') {
            this.p1.handleDirectInput('HEAVY', this.p2, this.particleSystem);
            if (this.onPlayerAction) this.onPlayerAction('HEAVY');
          } else if (e.code === 'KeyL' || e.code === 'KeyU' || e.code === 'KeyE') {
            if (this.matchStats) this.matchStats.p1Specials++;
            this.p1.handleDirectInput('SPECIAL_1', this.p2, this.particleSystem);
            if (this.onPlayerAction) this.onPlayerAction('SPECIAL');
          } else if (e.code === 'KeyI' || e.code === 'KeyO' || e.code === 'KeyR') {
            if (this.matchStats) { this.matchStats.p1Ultimates++; this.matchStats.usedUltInMatch = true; }
            this.p1.handleDirectInput('ULTIMATE', this.p2, this.particleSystem);
            if (this.onPlayerAction) this.onPlayerAction('ULTIMATE');
          } else if (e.code === 'Space') {
            if (this.p1.canAct && this.p1.canAct()) {
              this.p1.handleDirectInput('DODGE', this.p2, this.particleSystem);
              if (this.onPlayerAction) this.onPlayerAction('DODGE');
            }
          } else if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') {
            if (this.onPlayerAction) this.onPlayerAction('BLOCK');
          } else if (e.code === 'KeyA' || e.code === 'KeyD') {
            if (this.onPlayerAction) this.onPlayerAction('MOVE');
          } else if (e.code === 'KeyH') {
            this.p1.handleDirectInput('COUNTER', this.p2, this.particleSystem);
            if (this.onPlayerAction) this.onPlayerAction('COUNTER');
          } else if (e.code === 'KeyW') {
            this.p1.jump();
            if (this.onPlayerAction) this.onPlayerAction('MOVE');
          }
        }

        // Single-press action triggers for P2 (Local 2-Player mode)
        if (this.p2 && this.isLocal2Player) {
          if (e.code === 'Numpad1' || e.code === 'Digit1') {
            this.p2.handleDirectInput('LIGHT', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad2' || e.code === 'Digit2') {
            this.p2.handleDirectInput('HEAVY', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad4' || e.code === 'Digit4') {
            this.p2.handleDirectInput('SPECIAL_1', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad5' || e.code === 'Digit5') {
            this.p2.handleDirectInput('SPECIAL_2', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad6' || e.code === 'Digit6') {
            this.p2.handleDirectInput('ULTIMATE', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad0' || e.code === 'ShiftRight') {
            this.p2.handleDirectInput('DODGE', this.p1, this.particleSystem);
          } else if (e.code === 'Numpad3' || e.code === 'Digit3') {
            this.p2.handleDirectInput('COUNTER', this.p1, this.particleSystem);
          } else if (e.code === 'ArrowUp') {
            this.p2.jump();
          }
        }
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    // Reset keyboard state if user tabs out or loses window focus
    window.addEventListener('blur', () => {
      this.keys = {};
    });

    // Reset keys and sync delta timer on tab visibility change
    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
          this.keys = {};
        } else {
          this.lastTime = performance.now();
        }
      });
    }
  }

  initMatch(p1CharId = 'vex', p2CharId = 'vex', arenaId = 'neon_metro', mode = 'Casual', aiDifficulty = 'NORMAL') {
    this.gameMode = mode;
    this.currentArena = arenaId;
    this.isPaused = false;
    this.roundNumber = 1;
    this.roundTime = 99;
    this.roundTimerMs = 0;
    this.cameraX = this.width / 2;
    this.cameraY = this.height / 2;
    this.cameraZoom = 1.0;
    this.targetZoom = 1.0;
    this.cameraTrauma = 0;

    const p1Data = CHARACTERS[p1CharId] || CHARACTERS.vex;
    const p2Data = CHARACTERS[p2CharId] || CHARACTERS.vex;
    const p1Prog = progressionManager.data.characters[p1CharId];
    const p2Prog = progressionManager.data.characters[p2CharId];

    this.p1 = new Fighter(p1Data, {
      isPlayer: true,
      playerNumber: 1,
      x: 380,
      y: this.groundY,
      facing: 1,
      groundY: this.groundY,
      evolutionTier: p1Prog ? p1Prog.evolutionTier : 0
    });

    this.p2 = new Fighter(p2Data, {
      isPlayer: this.isLocal2Player,
      playerNumber: 2,
      x: 900,
      y: this.groundY,
      facing: -1,
      groundY: this.groundY,
      evolutionTier: p2Prog ? p2Prog.evolutionTier : 0
    });

    if (!this.isLocal2Player && this.gameMode !== 'Training') {
      this.ai = new FighterAI(this.p2, aiDifficulty);
    } else {
      this.ai = null;
    }

    this.particleSystem.reset();
    this.projectiles = [];
    const arenaConfig = ARENAS[arenaId] || ARENAS.neon_metro;
    this.particleSystem.initAmbient(arenaConfig.particles, this.width, this.height);

    soundEngine.startArenaMusic(arenaId);

    // Reward Loop & Combat Telemetry
    this.matchStats = {
      p1Dodges: 0,
      p1Specials: 0,
      p1Ultimates: 0,
      p1Parries: 0,
      p1Blocks: 0,
      usedUltInMatch: false,
      finishedWithUlt: false,
      p1MaxCombo: 0,
      startTime: performance.now()
    };

    // Start with READY
    this.roundState = 'INTRO_READY';
    this.setAnnouncement(`ROUND ${this.roundNumber}`, 'READY...', 65);

    this.isRunning = true;
    this.lastTime = performance.now();
  }

  setAnnouncement(title, subtitle, frames = 70) {
    this.announcementTitle = title;
    this.announcementSubtitle = subtitle;
    this.announcementAlpha = 1.0;
    this.stateTimer = frames;
  }

  applyHitStop(frames) {
    this.hitStopFrames = Math.max(this.hitStopFrames, frames);
  }

  setTimeDilation(scale, durationMs) {
    this.timeDilation = scale;
    this.timeDilationTimer = durationMs;
  }

  addCameraTrauma(amount) {
    this.cameraTrauma = Math.min(1.0, this.cameraTrauma + amount);
  }

  triggerHitFeedback(attackerIsPlayer, targetIsPlayer, isHeavy, isCrit, isUltimate) {
    if (attackerIsPlayer) {
      // "I HIT" feedback - clean white impact glint
      if (isUltimate) {
        this.screenFlash = { alpha: 0.35, color: '#FFFFFF' };
      } else if (isCrit || isHeavy) {
        this.screenFlash = { alpha: 0.16, color: '#FFFFFF' };
      }
    }
    if (targetIsPlayer) {
      // "I GOT HIT" feedback - unmistakable peripheral red pulse
      this.hurtVignette.alpha = isHeavy ? 0.35 : 0.22;
    }
  }

  triggerBlockFeedback(targetIsPlayer) {
    if (targetIsPlayer) {
      // "I BLOCKED" feedback - cyan barrier edge pulse
      this.blockVignette.alpha = 0.28;
    }
  }

  triggerDodgeFeedback(targetIsPlayer) {
    if (targetIsPlayer) {
      // "I PERFECTLY DODGED" feedback - electric neon edge warp
      this.dodgeVignette.alpha = 0.32;
    }
  }

  triggerParryFeedback(targetIsPlayer) {
    if (targetIsPlayer) {
      this.screenFlash = { alpha: 0.28, color: '#FFD700' };
    }
  }

  triggerFinisher(winner, loser) {
    this.applyHitStop(32);
    this.setTimeDilation(0.18, 1200);
    this.addCameraTrauma(0.9);
    soundEngine.playFinisherKO();
    this.particleSystem.emitShockwave(loser.x, loser.y - 60, winner.charData.coreColor, 240);
  }

  startLoop() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.isRunning = true;
    this.lastTime = performance.now();
    this.accumulator = 0;
    this.fps = 60;
    this.fpsTimer = performance.now();
    this.fpsCount = 0;

    const loop = (currentTime) => {
      if (!this.isRunning) return;

      const frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);
      this.lastTime = currentTime;

      // Track empirical FPS
      this.fpsCount++;
      if (currentTime - this.fpsTimer >= 500) {
        this.fps = Math.round((this.fpsCount * 1000) / (currentTime - this.fpsTimer));
        this.fpsCount = 0;
        this.fpsTimer = currentTime;
      }

      // Handle time dilation
      let effectiveDelta = frameTime;
      if (this.timeDilationTimer > 0) {
        effectiveDelta *= this.timeDilation;
        this.timeDilationTimer -= frameTime * 1000;
        if (this.timeDilationTimer <= 0) {
          this.timeDilation = 1.0;
        }
      }

      this.accumulator += effectiveDelta;
      let updates = 0;
      while (this.accumulator >= this.fixedDelta && updates < 3) {
        this.update(this.fixedDelta);
        this.accumulator -= this.fixedDelta;
        updates++;
      }
      if (updates >= 3) {
        this.accumulator = 0; // Prevent spiral of death on low-powered mobile devices
      }

      this.render();
      if (this.isRunning) {
        this.animFrameId = requestAnimationFrame(loop);
      }
    };

    this.animFrameId = requestAnimationFrame(loop);
  }

  stopLoop() {
    this.isRunning = false;
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    soundEngine.stopMusic();
  }

  update(deltaTime) {
    if (this.isPaused) return;

    // Hit-stop freeze (brief freeze frame for punchy impact)
    if (this.hitStopFrames > 0) {
      this.hitStopFrames--;
      this.particleSystem.update(deltaTime);
      return;
    }

    arenaRenderer.update(deltaTime);
    this.particleSystem.update(deltaTime);
    this.particleSystem.updateAmbient(this.width, this.height);
    characterRenderer.updateAfterimages();

    // Camera Trauma decay
    this.cameraTrauma = Math.max(0, this.cameraTrauma - 0.035);

    // Screen Feedback decay
    if (this.screenFlash.alpha > 0) this.screenFlash.alpha = Math.max(0, this.screenFlash.alpha - 0.05);
    if (this.hurtVignette.alpha > 0) this.hurtVignette.alpha = Math.max(0, this.hurtVignette.alpha - 0.035);
    if (this.blockVignette.alpha > 0) this.blockVignette.alpha = Math.max(0, this.blockVignette.alpha - 0.05);
    if (this.dodgeVignette.alpha > 0) this.dodgeVignette.alpha = Math.max(0, this.dodgeVignette.alpha - 0.045);

    // Track highest combo attained in match
    if (this.p1 && this.matchStats) {
      this.matchStats.p1MaxCombo = Math.max(this.matchStats.p1MaxCombo, this.p1.comboCount || 0);
    }

    // --- FIGHTING GAME DYNAMIC CAMERA (PAN & ZOOM) ---
    if (this.p1 && this.p2) {
      // 1. Dynamic Midpoint Tracking
      const midX = (this.p1.x + this.p2.x) / 2;
      const targetCamX = Math.max(380, Math.min(900, midX));
      this.cameraX += (targetCamX - this.cameraX) * 0.08;

      // 2. Distance-Based Zoom
      const dist = Math.abs(this.p1.x - this.p2.x);
      if (dist < 220) {
        this.targetZoom = 1.15; // Close up clash
      } else if (dist > 650) {
        this.targetZoom = 0.92; // Wide spacing
      } else {
        this.targetZoom = 1.0;  // Standard neutral
      }
      this.cameraZoom += (this.targetZoom - this.cameraZoom) * 0.05;
    }

    // --- ROUND FLOW & ANNOUNCEMENT STATE MACHINE ---
    if (this.stateTimer > 0) {
      this.stateTimer--;
      if (this.stateTimer <= 0) {
        if (this.roundState === 'INTRO_READY') {
          // Transition to FIGHT!
          this.roundState = 'INTRO_FIGHT';
          this.setAnnouncement('FIGHT!', '', 45);
        } else if (this.roundState === 'INTRO_FIGHT') {
          // Begin combat
          this.roundState = 'FIGHTING';
          this.announcementAlpha = 0;
        } else if (this.roundState === 'ROUND_OVER') {
          this.checkMatchProgression();
        }
      }
    }

    // Update Round Clock during active fighting
    if (this.roundState === 'FIGHTING' && this.gameMode !== 'Training') {
      this.roundTimerMs += deltaTime * 1000;
      if (this.roundTimerMs >= 1000) {
        this.roundTimerMs -= 1000;
        this.roundTime = Math.max(0, this.roundTime - 1);
        if (this.roundTime <= 0) {
          this.handleTimeUp();
        }
      }
    }

    if (this.roundState === 'FIGHTING') {
      // --- PLAYER 1 CONTINUOUS MOVEMENT & BLOCK (PC WASD / SHIFT + MOBILE JOYSTICK / BLOCK) ---
      const moveLeft = this.keys['KeyA'] || this.virtualInput.left;
      const moveRight = this.keys['KeyD'] || this.virtualInput.right;

      if (this.p1.canMove()) {
        if (moveLeft) {
          if (this.p1.vx > 0) this.p1.vx = 0; // Instant turn-around, prevent awkward sliding
          this.p1.vx = -this.p1.moveSpeed;
          if (this.p1.state !== FIGHTER_STATES.WALK_BACK) {
            this.p1.setState(FIGHTER_STATES.WALK_BACK);
          }
        } else if (moveRight) {
          if (this.p1.vx < 0) this.p1.vx = 0; // Instant turn-around, prevent awkward sliding
          this.p1.vx = this.p1.moveSpeed;
          if (this.p1.state !== FIGHTER_STATES.WALK_FWD) {
            this.p1.setState(FIGHTER_STATES.WALK_FWD);
          }
        } else {
          if (this.p1.state === FIGHTER_STATES.WALK_FWD || this.p1.state === FIGHTER_STATES.WALK_BACK) {
            this.p1.setState(FIGHTER_STATES.IDLE);
          }
        }
      }

      // Continuous Block for P1 (Shift or S or Virtual Block)
      const isBlockHeld = this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyS'] || this.virtualInput.block;
      if (isBlockHeld) {
        if (this.p1.canBlock() && this.p1.state !== FIGHTER_STATES.BLOCK) {
          this.p1.setState(FIGHTER_STATES.BLOCK);
        }
      } else if (this.p1.state === FIGHTER_STATES.BLOCK) {
        this.p1.setState(FIGHTER_STATES.IDLE);
      }

      // --- PLAYER 2 CONTINUOUS MOVEMENT & BLOCK (OR AI) ---
      if (this.isLocal2Player) {
        if (this.p2.canMove()) {
          if (this.keys['ArrowLeft']) {
            if (this.p2.vx > 0) this.p2.vx = 0; // Instant turn-around
            this.p2.vx = -this.p2.moveSpeed;
            if (this.p2.state !== FIGHTER_STATES.WALK_BACK) {
              this.p2.setState(FIGHTER_STATES.WALK_BACK);
            }
          } else if (this.keys['ArrowRight']) {
            if (this.p2.vx < 0) this.p2.vx = 0; // Instant turn-around
            this.p2.vx = this.p2.moveSpeed;
            if (this.p2.state !== FIGHTER_STATES.WALK_FWD) {
              this.p2.setState(FIGHTER_STATES.WALK_FWD);
            }
          } else {
            if (this.p2.state === FIGHTER_STATES.WALK_FWD || this.p2.state === FIGHTER_STATES.WALK_BACK) {
              this.p2.setState(FIGHTER_STATES.IDLE);
            }
          }
        }

        if (this.keys['ArrowDown']) {
          if (this.p2.canBlock() && this.p2.state !== FIGHTER_STATES.BLOCK) {
            this.p2.setState(FIGHTER_STATES.BLOCK);
          }
        } else if (this.p2.state === FIGHTER_STATES.BLOCK) {
          this.p2.setState(FIGHTER_STATES.IDLE);
        }
      } else if (this.ai && this.ai.enabled !== false && this.gameMode !== 'Training') {
        this.ai.update(this.p1, this.particleSystem);
      }

      // Update Fighters
      this.p1.update(deltaTime, this.width, this.p2, this.particleSystem);
      this.p2.update(deltaTime, this.width, this.p1, this.particleSystem);

      // Grounded Pushbox Separation (Physical body presence prevents point-blank clipping)
      if (this.p1.isGrounded && this.p2.isGrounded && 
          this.p1.state !== FIGHTER_STATES.DODGE && this.p2.state !== FIGHTER_STATES.DODGE) {
        const minSpacing = (this.p1.charData.visual.width + this.p2.charData.visual.width) * 0.44;
        const dx = this.p2.x - this.p1.x;
        const dist = Math.abs(dx);
        if (dist < minSpacing) {
          const overlap = (minSpacing - dist) * 0.5;
          const sign = dx >= 0 ? 1 : -1;
          this.p1.x = Math.max(75, Math.min(this.width - 75, this.p1.x - sign * overlap));
          this.p2.x = Math.max(75, Math.min(this.width - 75, this.p2.x + sign * overlap));
          this.p1.updateHurtbox();
          this.p2.updateHurtbox();
        }
      }

      // Collect Pending Projectiles from fighters
      if (this.p1.pendingProjectiles && this.p1.pendingProjectiles.length > 0) {
        this.projectiles.push(...this.p1.pendingProjectiles);
        this.p1.pendingProjectiles = [];
      }
      if (this.p2.pendingProjectiles && this.p2.pendingProjectiles.length > 0) {
        this.projectiles.push(...this.p2.pendingProjectiles);
        this.p2.pendingProjectiles = [];
      }

      // Update Projectiles
      for (let i = this.projectiles.length - 1; i >= 0; i--) {
        const proj = this.projectiles[i];
        const target = (proj.owner === this.p1) ? this.p2 : this.p1;
        proj.update(target);
        if (Math.random() < 0.35) {
          this.particleSystem.emitSparks(proj.x, proj.y, 1, proj.color, 1.5);
        }
        if (!proj.active) {
          this.projectiles.splice(i, 1);
        }
      }

      // Collisions & Combat
      this.combatSystem.processCollisions(this.p1, this.p2, this.particleSystem, this.projectiles);

      // Check for Round Over
      if (this.p1.hp <= 0 || this.p2.hp <= 0) {
        this.handleRoundEnd();
      }
    } else {
      // Fighters continue light animation during intros/outros
      if (this.p1) this.p1.update(deltaTime, this.width, this.p2, this.particleSystem);
      if (this.p2) this.p2.update(deltaTime, this.width, this.p1, this.particleSystem);
    }

    // HUD Callback
    if (this.onHudUpdate) {
      this.onHudUpdate({
        p1Hp: this.p1 ? this.p1.hp : 1000,
        p1MaxHp: this.p1 ? this.p1.maxHp : 1000,
        p1Core: this.p1 ? this.p1.coreMeter : 0,
        p1Rounds: this.p1 ? this.p1.roundsWon : 0,
        p1Combo: this.p1 ? this.p1.comboCount : 0,
        p1Damage: this.p1 ? this.p1.comboDamage : 0,
        p2Hp: this.p2 ? this.p2.hp : 1000,
        p2MaxHp: this.p2 ? this.p2.maxHp : 1000,
        p2Core: this.p2 ? this.p2.coreMeter : 0,
        p2Rounds: this.p2 ? this.p2.roundsWon : 0,
        p2Combo: this.p2 ? this.p2.comboCount : 0,
        roundTime: this.roundTime,
        roundNumber: this.roundNumber,
        roundState: this.roundState
      });
    }

    // Mobile Virtual Controls frame status update (Core gauges & cooldowns)
    if (this.touchControls && this.p1) {
      this.touchControls.updateFrame(this.p1);
    }
  }

  handleRoundEnd() {
    this.roundState = 'ROUND_OVER';
    let winner = null;
    let loser = null;

    if (this.p1.hp > 0 && this.p2.hp <= 0) {
      winner = this.p1;
      loser = this.p2;
    } else if (this.p2.hp > 0 && this.p1.hp <= 0) {
      winner = this.p2;
      loser = this.p1;
    } else {
      winner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
      loser = winner === this.p1 ? this.p2 : this.p1;
    }

    if (winner === this.p1 && this.matchStats) {
      if (this.p1.state === FIGHTER_STATES.ULTIMATE || (this.p1.currentAttack && this.p1.currentAttack.isUltimate)) {
        this.matchStats.finishedWithUlt = true;
      }
    }

    winner.roundsWon++;
    winner.setState(FIGHTER_STATES.VICTORY);
    loser.setState(FIGHTER_STATES.DEFEATED);
    soundEngine.playVictoryFanfare();
    this.setAnnouncement('K.O.', `${winner.name} WINS THE ROUND`, 140);
  }

  handleTimeUp() {
    this.roundState = 'ROUND_OVER';
    let winner = this.p1.hp >= this.p2.hp ? this.p1 : this.p2;
    let loser = winner === this.p1 ? this.p2 : this.p1;
    winner.roundsWon++;
    winner.setState(FIGHTER_STATES.VICTORY);
    loser.setState(FIGHTER_STATES.DEFEATED);
    soundEngine.playVictoryFanfare();
    this.setAnnouncement('TIME UP!', `${winner.name} WINS BY VITALITY`, 140);
  }

  checkMatchProgression() {
    // Best of 3: First to 2 rounds wins
    const requiredWins = 2;

    if (this.p1.roundsWon >= requiredWins || this.p2.roundsWon >= requiredWins) {
      this.roundState = 'MATCH_OVER';
      const isP1Winner = this.p1.roundsWon >= requiredWins;
      const winner = isP1Winner ? this.p1 : this.p2;
      const loser = isP1Winner ? this.p2 : this.p1;
      winner.setState(FIGHTER_STATES.VICTORY);
      loser.setState(FIGHTER_STATES.DEFEATED);
      soundEngine.playVictoryFanfare();

      // Trigger Equipped Victory Cosmetic Effect for Player 1 on match victory
      if (isP1Winner) {
        const equippedVfx = (progressionManager.data && progressionManager.data.equipped && progressionManager.data.equipped.victoryEffect) || 'vfx_crimson_shockwave';
        this.particleSystem.emitVictoryEffect(this.p1.x, this.p1.y - 70, equippedVfx);
      }

      const title = isP1Winner ? 'VICTORY' : 'DEFEAT';
      const sub = isP1Winner ? 'MATCH WON' : 'MATCH LOST';
      this.setAnnouncement(title, sub, 180);

      setTimeout(() => {
        if (this.onMatchEnd) {
          const duration = this.matchStats ? Math.max(12, Math.round((performance.now() - this.matchStats.startTime) / 1000)) : 45;
          const maxCombo = Math.max(this.p1 ? this.p1.comboCount : 0, this.p2 ? this.p2.comboCount : 0, this.matchStats ? this.matchStats.p1MaxCombo : 0);
          this.onMatchEnd({
            winnerId: isP1Winner ? this.p1.charId : this.p2.charId,
            isP1Winner: isP1Winner,
            p1Score: this.p1.roundsWon,
            p2Score: this.p2.roundsWon,
            maxCombo,
            mode: this.gameMode,
            duration,
            telemetry: {
              isWin: isP1Winner,
              p1CharId: this.p1 ? this.p1.charId : 'vex',
              p2CharId: this.p2 ? this.p2.charId : 'solaris',
              maxCombo,
              p1Dodges: this.matchStats ? this.matchStats.p1Dodges : 0,
              p1Specials: this.matchStats ? this.matchStats.p1Specials : 0,
              p1Ultimates: this.matchStats ? this.matchStats.p1Ultimates : 0,
              p1Parries: this.matchStats ? this.matchStats.p1Parries : 0,
              p1Blocks: this.matchStats ? this.matchStats.p1Blocks : 0,
              usedUltInMatch: this.matchStats ? this.matchStats.usedUltInMatch : false,
              finishedWithUlt: this.matchStats ? this.matchStats.finishedWithUlt : false
            }
          });
        }
      }, 1900);
    } else {
      // Start Next Round
      this.roundNumber++;
      this.roundTime = 99;
      this.projectiles = [];
      this.p1.reset(380, 1);
      this.p2.reset(900, -1);

      this.roundState = 'INTRO_READY';
      const roundLabel = (this.p1.roundsWon === 1 && this.p2.roundsWon === 1) ? 'FINAL ROUND' : `ROUND ${this.roundNumber}`;
      this.setAnnouncement(roundLabel, 'READY...', 65);
    }
  }

  render() {
    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.width, this.height);

    ctx.save();

    // 1. Camera Shake Calculation
    let shakeX = 0;
    let shakeY = 0;
    if (this.cameraTrauma > 0) {
      const shakePower = Math.pow(this.cameraTrauma, 2) * 18;
      shakeX = (Math.random() - 0.5) * shakePower;
      shakeY = (Math.random() - 0.5) * shakePower;
    }

    // 2. Camera Transform (Pan with cameraX/cameraY, Zoom with cameraZoom)
    ctx.translate(this.width / 2 + shakeX, this.height / 2 + shakeY);
    ctx.scale(this.cameraZoom, this.cameraZoom);
    ctx.translate(-this.cameraX, -this.cameraY);

    // 3. Draw Arena
    arenaRenderer.drawArena(ctx, this.currentArena, this.width, this.height, this.groundY);

    // 4. Draw Character Afterimages
    characterRenderer.drawAfterimages(ctx);

    // 5. Draw Fighters
    if (this.p1) characterRenderer.drawFighter(ctx, this.p1);
    if (this.p2) characterRenderer.drawFighter(ctx, this.p2);

    // 6. Draw Projectiles
    for (const proj of this.projectiles) {
      proj.draw(ctx);
    }

    // 7. Draw Debug Hitboxes (Training visualizer)
    if (this.showHitboxes) {
      this.drawDebugBoxes(ctx);
    }

    // 8. Draw Combat FX & Particles
    this.particleSystem.draw(ctx);

    ctx.restore();

    // 8. Carefully Controlled Screen Feedback (Hit flash, Hurt red vignette, Block cyan ripple, Dodge warp)
    this.drawScreenFeedback(ctx);

    // 9. Screen-Center Announcements Overlay (Static overlay independent of camera pan)
    if (this.announcementAlpha > 0 && this.announcementTitle) {
      this.drawAnnouncements(ctx);
    }

    // 10. Development Diagnostics Overlay (FPS, Input, State, Hitbox, Damage)
    if (this.showDiagnostics || (typeof window !== 'undefined' && window.__RIFTBORN_DEBUG__)) {
      this.drawDiagnostics(ctx);
    }
  }

  drawDiagnostics(ctx) {
    ctx.save();
    ctx.font = '11px monospace';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.80)';
    ctx.fillRect(16, 75, 240, 115);
    ctx.strokeStyle = '#00D2FF';
    ctx.lineWidth = 1;
    ctx.strokeRect(16, 75, 240, 115);

    ctx.fillStyle = '#00E5FF';
    ctx.fillText(`FPS: ${this.fps || 60} (${this.isRunning ? 'RUNNING' : 'STOPPED'})`, 24, 92);
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(`Input: ${this.lastInputTelemetry || 'NONE'}`, 24, 108);
    const p1State = this.p1 ? `${this.p1.state} (T:${this.p1.stateTimer})` : 'N/A';
    ctx.fillText(`P1 State: ${p1State}`, 24, 124);
    const hbActive = this.p1 && this.p1.activeHitbox ? `ACTIVE (dmg:${this.p1.activeHitbox.damage})` : 'OFF';
    ctx.fillText(`Hitbox: ${hbActive}`, 24, 140);
    const p1Dist = (this.p1 && this.p2) ? Math.round(Math.abs(this.p1.x - this.p2.x)) : 0;
    ctx.fillText(`Dist: ${p1Dist}px | P1 Facing: ${this.p1 ? this.p1.facing : 1}`, 24, 156);
    ctx.fillText(`P1 HP: ${this.p1 ? this.p1.hp : 0} | P2 HP: ${this.p2 ? this.p2.hp : 0}`, 24, 172);
    ctx.restore();
  }

  drawScreenFeedback(ctx) {
    // 1. Screen Flash (Clean glint on heavy hit / crit / ultimate)
    if (this.screenFlash.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.25, this.screenFlash.alpha);
      ctx.fillStyle = this.screenFlash.color;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 2. Hurt Vignette ("I GOT HIT" - Red peripheral alert)
    if (this.hurtVignette.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.35, this.hurtVignette.alpha);
      const grad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.35,
        this.width / 2, this.height / 2, this.width * 0.65
      );
      grad.addColorStop(0, 'rgba(255, 0, 50, 0)');
      grad.addColorStop(1, 'rgba(255, 0, 50, 0.7)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 3. Block Vignette ("I BLOCKED" - Cyan barrier edge pulse)
    if (this.blockVignette.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.30, this.blockVignette.alpha);
      const grad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.38,
        this.width / 2, this.height / 2, this.width * 0.62
      );
      grad.addColorStop(0, 'rgba(0, 229, 255, 0)');
      grad.addColorStop(1, 'rgba(0, 229, 255, 0.6)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 4. Dodge Vignette ("I PERFECTLY DODGED" - Electric cyan edge warp)
    if (this.dodgeVignette.alpha > 0.01) {
      ctx.save();
      ctx.globalAlpha = Math.min(0.38, this.dodgeVignette.alpha);
      const grad = ctx.createRadialGradient(
        this.width / 2, this.height / 2, this.height * 0.30,
        this.width / 2, this.height / 2, this.width * 0.64
      );
      grad.addColorStop(0, 'rgba(0, 255, 255, 0)');
      grad.addColorStop(0.7, 'rgba(0, 210, 255, 0.45)');
      grad.addColorStop(1, 'rgba(0, 255, 255, 0.75)');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, this.width, this.height);
      ctx.restore();
    }

    // 5. Cinematic Ultimate Overlay (Controlled visual intensity, Letterboxing, and Arena Focus Vignette)
    const ultFighter = (this.p1 && this.p1.state === FIGHTER_STATES.ULTIMATE) ? this.p1 : 
                       ((this.p2 && this.p2.state === FIGHTER_STATES.ULTIMATE) ? this.p2 : null);
    if (ultFighter) {
      const uTimer = ultFighter.stateTimer;
      const uProgress = Math.min(1, uTimer / 10);
      const uFade = (uTimer > 35) ? Math.max(0, 1 - (uTimer - 35) / 10) : uProgress;
      const intensity = uFade * 0.85;

      ctx.save();
      // Controlled stage dimming vignette to emphasize the duelists
      ctx.fillStyle = `rgba(7, 11, 20, ${0.45 * intensity})`;
      ctx.fillRect(0, 0, this.width, this.height);

      // Cinematic Letterbox Bars (Clean cinematic widescreen presentation)
      const barHeight = 44 * intensity;
      ctx.fillStyle = '#05070D';
      ctx.fillRect(0, 0, this.width, barHeight);
      ctx.fillRect(0, this.height - barHeight, this.width, barHeight);

      // Neon energy line on letterbox edges
      const coreCol = ultFighter.charData.coreColor;
      ctx.strokeStyle = coreCol;
      ctx.lineWidth = 2;
      ctx.shadowColor = coreCol;
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.moveTo(0, barHeight);
      ctx.lineTo(this.width, barHeight);
      ctx.moveTo(0, this.height - barHeight);
      ctx.lineTo(this.width, this.height - barHeight);
      ctx.stroke();

      ctx.restore();
    }
  }

  drawDebugBoxes(ctx) {
    ctx.save();
    if (this.p1) {
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.p1.hurtbox.x, this.p1.hurtbox.y, this.p1.hurtbox.width, this.p1.hurtbox.height);

      if (this.p1.activeHitbox) {
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.p1.activeHitbox.x, this.p1.activeHitbox.y, this.p1.activeHitbox.width, this.p1.activeHitbox.height);
      }
    }

    if (this.p2) {
      ctx.strokeStyle = '#00FF88';
      ctx.lineWidth = 1.5;
      ctx.strokeRect(this.p2.hurtbox.x, this.p2.hurtbox.y, this.p2.hurtbox.width, this.p2.hurtbox.height);

      if (this.p2.activeHitbox) {
        ctx.strokeStyle = '#FF0055';
        ctx.lineWidth = 2;
        ctx.strokeRect(this.p2.activeHitbox.x, this.p2.activeHitbox.y, this.p2.activeHitbox.width, this.p2.activeHitbox.height);
      }
    }
    ctx.restore();
  }

  drawAnnouncements(ctx) {
    ctx.save();
    ctx.textAlign = 'center';

    // Cinematic Banner Bar
    ctx.fillStyle = 'rgba(7, 11, 20, 0.82)';
    ctx.fillRect(0, this.height * 0.4 - 55, this.width, 115);
    ctx.strokeStyle = '#00D2FF';
    ctx.lineWidth = 2;
    ctx.strokeRect(0, this.height * 0.4 - 55, this.width, 115);

    // Title (e.g. ROUND 1, READY..., FIGHT!, VICTORY, DEFEAT)
    ctx.font = '900 52px "Oswald", "Bebas Neue", sans-serif';
    ctx.fillStyle = '#FFFFFF';
    ctx.shadowColor = '#00D2FF';
    ctx.shadowBlur = 20;
    ctx.fillText(this.announcementTitle, this.width / 2, this.height * 0.4);

    // Subtitle
    if (this.announcementSubtitle) {
      ctx.font = '700 22px "Oswald", "Bebas Neue", sans-serif';
      ctx.fillStyle = '#FFB800';
      ctx.shadowColor = '#FFB800';
      ctx.shadowBlur = 12;
      ctx.fillText(this.announcementSubtitle, this.width / 2, this.height * 0.4 + 40);
    }

    ctx.restore();
  }
}
