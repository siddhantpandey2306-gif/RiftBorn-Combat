// RIFTBORN TouchControls Engine
// Universal Mobile & Touch Virtual Control Architecture
// Provides ergonomic virtual joystick, attack/ability buttons, position customization, and zero-compromise combat parity

export class TouchControls {
  constructor(engine) {
    this.engine = engine;
    this.storageKey = 'riftborn_touch_layout';

    // Default configuration (positions in percentage or px offset)
    this.defaultConfig = {
      enabled: 'auto', // 'auto' | 'always' | 'never'
      scale: 1.0,
      opacity: 0.8,
      joystick: { bottom: 34, left: 36 }, // px from edges
      actions: { bottom: 30, right: 36 }
    };

    this.config = this.loadConfig();
    this.isTouchDevice = this.detectTouchDevice();
    this.activeTouches = new Map();
    this.isEditingLayout = false;

    // Joystick state
    this.joystickState = {
      active: false,
      touchId: null,
      startX: 0,
      startY: 0,
      currX: 0,
      currY: 0,
      maxRadius: 52
    };

    // DOM Elements cache
    this.overlay = null;
    this.joystickZone = null;
    this.joystickBase = null;
    this.joystickKnob = null;
    this.actionsZone = null;

    this.init();
  }

  detectTouchDevice() {
    if (typeof window === 'undefined') return false;
    return ('ontouchstart' in window) || 
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 0) || 
           (window.innerWidth <= 1024);
  }

  loadConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        const raw = localStorage.getItem(this.storageKey);
        if (raw) {
          const parsed = JSON.parse(raw);
          return { ...this.defaultConfig, ...parsed };
        }
      }
    } catch (e) {
      console.warn('Failed to load touch controls config:', e);
    }
    return { ...this.defaultConfig };
  }

  saveConfig() {
    try {
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem(this.storageKey, JSON.stringify(this.config));
      }
    } catch (e) {
      console.warn('Failed to save touch controls config:', e);
    }
  }

  init() {
    if (typeof document === 'undefined') return;
    this.overlay = document.getElementById('mobile-controls-overlay');
    this.joystickZone = document.getElementById('virtual-joystick-zone');
    this.joystickBase = document.getElementById('virtual-joystick-base');
    this.joystickKnob = document.getElementById('virtual-joystick-knob');
    this.actionsZone = document.getElementById('virtual-actions-zone');

    if (!this.overlay) return;

    this.applyLayoutStyles();
    this.setupJoystickEvents();
    this.setupActionButtons();
    this.setupCustomizerUI();
    this.updateVisibility();

    // Cache frame update elements for zero DOM search overhead
    this.cachedUltBtn = document.getElementById('btn-touch-ultimate');
    this.cachedSpecBtn = document.getElementById('btn-touch-special');
    this.cachedDodgeBtn = document.getElementById('btn-touch-dodge');

    window.addEventListener('resize', () => {
      this.isTouchDevice = this.detectTouchDevice();
      this.updateVisibility();
      this.applyLayoutStyles();
    });

    window.addEventListener('orientationchange', () => {
      setTimeout(() => {
        this.isTouchDevice = this.detectTouchDevice();
        this.updateVisibility();
        this.applyLayoutStyles();
      }, 100);
    });
  }

  updateVisibility() {
    if (!this.overlay) return;
    const shouldShow = (this.config.enabled === 'always') || 
                       (this.config.enabled === 'auto' && this.isTouchDevice);

    this.overlay.style.display = shouldShow ? 'block' : 'none';
  }

  applyLayoutStyles() {
    if (!this.overlay) return;

    // Set CSS custom properties on overlay container
    if (this.overlay.style && this.overlay.style.setProperty) {
      this.overlay.style.setProperty('--touch-scale', this.config.scale.toString());
      this.overlay.style.setProperty('--touch-opacity', this.config.opacity.toString());
    }

    if (this.joystickZone) {
      this.joystickZone.style.bottom = `${this.config.joystick.bottom}px`;
      this.joystickZone.style.left = `${this.config.joystick.left}px`;
      this.joystickZone.style.right = 'auto';
      this.joystickZone.style.top = 'auto';
    }

    if (this.actionsZone) {
      this.actionsZone.style.bottom = `${this.config.actions.bottom}px`;
      this.actionsZone.style.right = `${this.config.actions.right}px`;
      this.actionsZone.style.left = 'auto';
      this.actionsZone.style.top = 'auto';
    }
  }

  // --- VIRTUAL MOVEMENT JOYSTICK ENGINE ---
  setupJoystickEvents() {
    if (!this.joystickZone || !this.joystickBase || !this.joystickKnob) return;

    const onStart = (clientX, clientY, identifier) => {
      if (this.isEditingLayout) return;
      this.joystickState.active = true;
      this.joystickState.touchId = identifier;

      const rect = this.joystickBase.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;

      this.joystickState.startX = centerX;
      this.joystickState.startY = centerY;

      this.updateJoystickPosition(clientX, clientY);
      this.joystickBase.classList.add('active');
    };

    const onMove = (clientX, clientY, identifier) => {
      if (!this.joystickState.active || this.joystickState.touchId !== identifier) return;
      this.updateJoystickPosition(clientX, clientY);
    };

    const onEnd = (identifier) => {
      if (this.joystickState.touchId === identifier) {
        this.resetJoystick();
      }
    };

    // Touch Event Listeners (Passive: false to prevent scrolling)
    this.joystickZone.addEventListener('touchstart', (e) => {
      e.preventDefault();
      const touch = e.changedTouches[0];
      onStart(touch.clientX, touch.clientY, touch.identifier);
    }, { passive: false });

    window.addEventListener('touchmove', (e) => {
      if (!this.joystickState.active) return;
      for (let i = 0; i < e.changedTouches.length; i++) {
        const touch = e.changedTouches[i];
        if (touch.identifier === this.joystickState.touchId) {
          e.preventDefault();
          onMove(touch.clientX, touch.clientY, touch.identifier);
          break;
        }
      }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        onEnd(e.changedTouches[i].identifier);
      }
    });

    window.addEventListener('touchcancel', (e) => {
      for (let i = 0; i < e.changedTouches.length; i++) {
        onEnd(e.changedTouches[i].identifier);
      }
    });

    // Pointer events fallback for devices & pointer emulation
    this.joystickZone.addEventListener('pointerdown', (e) => {
      if (e.pointerType === 'touch') return; // Handled by touch events
      e.preventDefault();
      onStart(e.clientX, e.clientY, e.pointerId);

      const onPointerMove = (ev) => {
        if (ev.pointerId === e.pointerId) {
          onMove(ev.clientX, ev.clientY, ev.pointerId);
        }
      };

      const onPointerUp = (ev) => {
        if (ev.pointerId === e.pointerId) {
          onEnd(ev.pointerId);
          window.removeEventListener('pointermove', onPointerMove);
          window.removeEventListener('pointerup', onPointerUp);
          window.removeEventListener('pointercancel', onPointerUp);
        }
      };

      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', onPointerUp);
      window.addEventListener('pointercancel', onPointerUp);
    });
  }

  updateJoystickPosition(clientX, clientY) {
    const dx = clientX - this.joystickState.startX;
    const dy = clientY - this.joystickState.startY;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxR = this.joystickState.maxRadius * this.config.scale;

    let clampedX = dx;
    let clampedY = dy;

    if (dist > maxR) {
      clampedX = (dx / dist) * maxR;
      clampedY = (dy / dist) * maxR;
    }

    // Move visual knob
    this.joystickKnob.style.transform = `translate(${clampedX}px, ${clampedY}px)`;

    // Calculate normalized axis [-1.0, 1.0]
    const normX = clampedX / maxR;
    const normY = clampedY / maxR;

    // Send continuous direction vector to game engine
    this.engine.setVirtualMovement(normX, normY);
  }

  resetJoystick() {
    this.joystickState.active = false;
    this.joystickState.touchId = null;
    this.joystickKnob.style.transform = 'translate(0px, 0px)';
    this.joystickBase.classList.remove('active');
    this.engine.setVirtualMovement(0, 0);
  }

  // --- ACTION BUTTONS ENGINE ---
  setupActionButtons() {
    const buttons = [
      { id: 'btn-touch-light', action: 'LIGHT' },
      { id: 'btn-touch-heavy', action: 'HEAVY' },
      { id: 'btn-touch-special', action: 'SPECIAL_1' },
      { id: 'btn-touch-ultimate', action: 'ULTIMATE' },
      { id: 'btn-touch-dodge', action: 'DODGE' },
      { id: 'btn-touch-block', action: 'BLOCK', continuous: true }
    ];

    buttons.forEach(({ id, action, continuous }) => {
      const el = document.getElementById(id);
      if (!el) return;

      let activePointerId = null;
      let lastTriggerTime = 0;

      const triggerDown = () => {
        if (this.isEditingLayout) return;
        const now = performance.now();
        if (now - lastTriggerTime < 35) return; // Debounce rapid overlapping touch+mouse events
        lastTriggerTime = now;

        el.classList.add('active');

        // Haptic feedback (12ms subtle pulse)
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
          try { navigator.vibrate(12); } catch (_) {}
        }

        if (continuous && action === 'BLOCK') {
          this.engine.setVirtualBlock(true);
        } else {
          this.engine.triggerPlayerAction(action);
        }
      };

      const triggerUp = () => {
        activePointerId = null;
        el.classList.remove('active');
        if (continuous && action === 'BLOCK') {
          this.engine.setVirtualBlock(false);
        }
      };

      // Pointer events with capture to prevent gesture interruptions and accidental cancellation
      el.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        activePointerId = e.pointerId;
        if (el.setPointerCapture) {
          try { el.setPointerCapture(e.pointerId); } catch (_) {}
        }
        triggerDown();
      }, { passive: false });

      el.addEventListener('pointerup', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (el.releasePointerCapture && activePointerId !== null) {
          try { el.releasePointerCapture(activePointerId); } catch (_) {}
        }
        triggerUp();
      }, { passive: false });

      el.addEventListener('pointercancel', (e) => {
        triggerUp();
      });

      // Direct touch listeners for maximum mobile compatibility
      el.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerDown();
      }, { passive: false });

      el.addEventListener('touchend', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerUp();
      }, { passive: false });

      el.addEventListener('touchcancel', (e) => {
        triggerUp();
      });
    });
  }

  // Live frame update hook (called from engine HUD loop)
  updateFrame(p1) {
    if (!p1 || !this.overlay || this.overlay.style.display === 'none') return;

    // 1. Ultimate Button Ready Glow
    if (this.cachedUltBtn) {
      const isReady = (p1.currentCore >= 100);
      this.cachedUltBtn.classList.toggle('ready', isReady);
    }

    // 2. Special Ability Cost Indicator
    if (this.cachedSpecBtn) {
      const specCost = p1.charData.abilities[0]?.cost || 25;
      const canCast = (p1.currentCore >= specCost && p1.cooldowns.special1 <= 0);
      this.cachedSpecBtn.classList.toggle('cooldown', !canCast);
    }

    // 3. Dodge Cooldown
    if (this.cachedDodgeBtn) {
      this.cachedDodgeBtn.classList.toggle('cooldown', p1.cooldowns.dodge > 0);
    }
  }

  // --- POSITION CUSTOMIZATION SYSTEM (DRAG & RESIZE) ---
  setupCustomizerUI() {
    const modal = document.getElementById('modal-touch-customizer');
    const btnOpenInHud = document.getElementById('btn-hud-edit-controls');
    const btnToggleTouch = document.getElementById('btn-hud-toggle-touch');
    const btnClose = document.getElementById('btn-close-customizer');
    const btnSave = document.getElementById('btn-save-customizer');
    const btnReset = document.getElementById('btn-reset-customizer');

    const sliderScale = document.getElementById('slider-touch-scale');
    const labelScale = document.getElementById('label-touch-scale');
    const sliderOpacity = document.getElementById('slider-touch-opacity');
    const labelOpacity = document.getElementById('label-touch-opacity');

    // Preset buttons
    const btnPresetDefault = document.getElementById('preset-touch-default');
    const btnPresetWide = document.getElementById('preset-touch-wide');
    const btnPresetCompact = document.getElementById('preset-touch-compact');

    if (btnToggleTouch) {
      btnToggleTouch.addEventListener('click', () => {
        if (this.config.enabled === 'always') this.config.enabled = 'never';
        else if (this.config.enabled === 'never') this.config.enabled = 'always';
        else this.config.enabled = this.isTouchDevice ? 'never' : 'always';
        this.saveConfig();
        this.updateVisibility();
        alert(`Touch Controls: ${this.overlay.style.display === 'block' ? 'ENABLED' : 'DISABLED'}`);
      });
    }

    if (btnOpenInHud) {
      btnOpenInHud.addEventListener('click', () => {
        this.openCustomizer();
      });
    }

    if (btnClose) {
      btnClose.addEventListener('click', () => {
        this.closeCustomizer(false);
      });
    }

    if (btnSave) {
      btnSave.addEventListener('click', () => {
        this.saveConfig();
        this.closeCustomizer(true);
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        this.config = { ...this.defaultConfig };
        this.applyLayoutStyles();
        if (sliderScale) sliderScale.value = '100';
        if (labelScale) labelScale.textContent = '100%';
        if (sliderOpacity) sliderOpacity.value = '80';
        if (labelOpacity) labelOpacity.textContent = '80%';
      });
    }

    if (sliderScale) {
      sliderScale.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.config.scale = val;
        if (labelScale) labelScale.textContent = `${e.target.value}%`;
        this.applyLayoutStyles();
      });
    }

    if (sliderOpacity) {
      sliderOpacity.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value) / 100;
        this.config.opacity = val;
        if (labelOpacity) labelOpacity.textContent = `${e.target.value}%`;
        this.applyLayoutStyles();
      });
    }

    // Presets
    if (btnPresetDefault) {
      btnPresetDefault.addEventListener('click', () => {
        this.config.joystick = { bottom: 34, left: 36 };
        this.config.actions = { bottom: 30, right: 36 };
        this.config.scale = 1.0;
        this.applyLayoutStyles();
        if (sliderScale) sliderScale.value = '100';
      });
    }

    if (btnPresetWide) {
      btnPresetWide.addEventListener('click', () => {
        this.config.joystick = { bottom: 18, left: 18 };
        this.config.actions = { bottom: 18, right: 18 };
        this.config.scale = 1.15;
        this.applyLayoutStyles();
        if (sliderScale) sliderScale.value = '115';
      });
    }

    if (btnPresetCompact) {
      btnPresetCompact.addEventListener('click', () => {
        this.config.joystick = { bottom: 50, left: 55 };
        this.config.actions = { bottom: 45, right: 55 };
        this.config.scale = 0.88;
        this.applyLayoutStyles();
        if (sliderScale) sliderScale.value = '88';
      });
    }

    // Draggable Zones in Edit Mode
    this.makeZoneDraggable(this.joystickZone, (bottom, left) => {
      this.config.joystick.bottom = Math.round(bottom);
      this.config.joystick.left = Math.round(left);
    });

    this.makeZoneDraggable(this.actionsZone, (bottom, right) => {
      this.config.actions.bottom = Math.round(bottom);
      this.config.actions.right = Math.round(right);
    }, true);
  }

  makeZoneDraggable(element, onPositionChanged, isRightAnchor = false) {
    if (!element) return;

    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let origOffsetH = 0;
    let origOffsetV = 0;

    const onDown = (clientX, clientY) => {
      if (!this.isEditingLayout) return;
      isDragging = true;
      startX = clientX;
      startY = clientY;

      origOffsetV = isRightAnchor ? this.config.actions.bottom : this.config.joystick.bottom;
      origOffsetH = isRightAnchor ? this.config.actions.right : this.config.joystick.left;
      element.classList.add('dragging');
    };

    const onMove = (clientX, clientY) => {
      if (!isDragging || !this.isEditingLayout) return;
      const dx = clientX - startX;
      const dy = clientY - startY;

      // Bottom increases upwards
      const newBottom = Math.max(10, Math.min(window.innerHeight - 140, origOffsetV - dy));
      let newHoriz = 0;

      if (isRightAnchor) {
        newHoriz = Math.max(10, Math.min(window.innerWidth - 180, origOffsetH - dx));
        element.style.right = `${newHoriz}px`;
        element.style.left = 'auto';
      } else {
        newHoriz = Math.max(10, Math.min(window.innerWidth - 180, origOffsetH + dx));
        element.style.left = `${newHoriz}px`;
        element.style.right = 'auto';
      }

      element.style.bottom = `${newBottom}px`;
      element.style.top = 'auto';

      onPositionChanged(newBottom, newHoriz);
    };

    const onUp = () => {
      if (isDragging) {
        isDragging = false;
        element.classList.remove('dragging');
      }
    };

    // Pointer listeners
    element.addEventListener('pointerdown', (e) => {
      if (!this.isEditingLayout) return;
      e.preventDefault();
      onDown(e.clientX, e.clientY);

      const moveHandler = (ev) => onMove(ev.clientX, ev.clientY);
      const upHandler = () => {
        onUp();
        window.removeEventListener('pointermove', moveHandler);
        window.removeEventListener('pointerup', upHandler);
      };

      window.addEventListener('pointermove', moveHandler);
      window.addEventListener('pointerup', upHandler);
    });
  }

  openCustomizer() {
    this.isEditingLayout = true;
    this.overlay.style.display = 'block';
    this.overlay.classList.add('customizer-mode');

    const modal = document.getElementById('modal-touch-customizer');
    if (modal) modal.classList.add('active');

    const sliderScale = document.getElementById('slider-touch-scale');
    if (sliderScale) sliderScale.value = Math.round(this.config.scale * 100).toString();
    const labelScale = document.getElementById('label-touch-scale');
    if (labelScale) labelScale.textContent = `${Math.round(this.config.scale * 100)}%`;

    const sliderOpacity = document.getElementById('slider-touch-opacity');
    if (sliderOpacity) sliderOpacity.value = Math.round(this.config.opacity * 100).toString();
    const labelOpacity = document.getElementById('label-touch-opacity');
    if (labelOpacity) labelOpacity.textContent = `${Math.round(this.config.opacity * 100)}%`;
  }

  closeCustomizer(didSave = true) {
    this.isEditingLayout = false;
    this.overlay.classList.remove('customizer-mode');
    const modal = document.getElementById('modal-touch-customizer');
    if (modal) modal.classList.remove('active');

    if (!didSave) {
      // Revert to loaded config
      this.config = this.loadConfig();
      this.applyLayoutStyles();
    }
    this.updateVisibility();

    // If customizer was opened from Settings menu while no match is running, hide game-view
    if (!this.engine.isRunning) {
      const gv = document.getElementById('game-view');
      if (gv) gv.style.display = 'none';
    }
  }
}
