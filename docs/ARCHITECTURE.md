# RIFTBORN — Architecture & Technical Design Document

## 1. System Overview & Technology Stack
RIFTBORN is a high-performance, responsive 2D combat/fighting browser game built entirely with modern client-side web technologies:
- **Architecture**: 100% Client-Side Single Page Application (SPA).
- **Core Engine**: Vanilla JavaScript (ES Modules) utilizing HTML5 Canvas 2D API for rendering and Web Audio API for synthetic SFX/music.
- **Build & Development Tooling**: [Vite](https://vitejs.dev/) v8.3.2.
- **Styling & UI**: Vanilla CSS3 (`style.css`), hardware-accelerated layouts, CSS flexbox/grid, and viewport-safe mobile landscape media queries.
- **External Dependencies & Backend**: Zero backend servers, databases, or microservices are required for core gameplay. All logic, AI, collision detection, and matchmaking simulations execute locally inside the user's browser runtime.

---

## 2. Directory Structure & File Map
```
Rift Born/
├── index.html                   # Game entry point, semantic DOM, UI overlays & HUD
├── style.css                    # Unified styling, animations, responsive breakpoints
├── package.json                 # Dependency manifests, build scripts & test commands
├── public/
│   └── manifest.webmanifest     # Progressive Web App (PWA) manifest
├── src/
│   ├── main.js                  # RiftbornApp application controller, UI routing & state
│   ├── config.js                # Character, ability, arena, and rank constants
│   ├── engine/
│   │   ├── GameEngine.js        # Core 60 FPS fixed-timestep loop, state machine & inputs
│   │   ├── CombatSystem.js      # Frame-accurate hitboxes, hurtboxes, damage & combos
│   │   ├── SoundEngine.js       # Procedural Web Audio API sound synthesis (zero external audio files)
│   │   ├── ParticleSystem.js    # Object-pooled particle effects & visual feedback
│   │   └── TouchControls.js     # Responsive mobile touch D-Pad and virtual action buttons
│   ├── fighters/
│   │   ├── Fighter.js           # Base physics entity, state machine, and action dispatcher
│   │   ├── FighterAI.js         # Reactive AI controller with difficulty handicaps
│   │   └── CharacterRenderer.js # Procedural Canvas 2D vector animation pipeline
│   └── systems/
│       ├── CompetitiveSystem.js # Rank tiers, MMR calculations, and matchmaking simulator
│       ├── QuestSystem.js       # Daily/weekly objectives and progression tracking
│       ├── ProgressionManager.js# Local profile, currency, unlock persistence (localStorage)
│       └── StorySystem.js       # Narrative campaign dialogues and progression
├── test_combat_prototype.js     # Headless unit test suite for combat state & damage
├── test_round_system.js         # Headless integration test suite for round flow & scoring
└── docs/                        # Complete technical documentation suite
```

---

## 3. Game Loop & Fixed-Timestep Execution
The game loop in `src/engine/GameEngine.js` utilizes `requestAnimationFrame` with a semi-fixed timestep and spiral-of-death mitigation:
- **Timing Delta**: `frameTime = Math.min((currentTime - this.lastTime) / 1000, 0.1);`
  - Capped at 100ms (`0.1s`) to prevent delta explosion when the browser tab is backgrounded or during heavy CPU garbage collection pauses.
- **Time Dilation & Hit-Stop**:
  - `hitStopFrames`: Freezes entity update calculations during critical impacts while maintaining particle and camera shake rendering.
  - `timeDilation`: Scales game speed (e.g., `0.18x` during finisher K.O. moments) smoothly over a configurable millisecond timer.
- **Loop Lifecycle Management**:
  - `animFrameId` is actively tracked. Calling `startLoop()` explicitly calls `cancelAnimationFrame` on existing instances to prevent duplicate animation loops.
  - Calling `stopLoop()` clears `animFrameId` and resets internal loop running flags.

---

## 4. Input Architecture & Parity
The input pipeline supports simultaneous PC Keyboard and Mobile Touch interactions with full gameplay parity:
- **Keyboard Handling**:
  - Registered through global `window.addEventListener('keydown' / 'keyup')`.
  - Filtered to ignore keystrokes inside form controls (`INPUT`, `TEXTAREA`, `SELECT`).
  - Active game keys (`Space`, `WASD`, `Arrows`, `J`, `K`, `L`, `I`, `Shift`, `P`, `Esc`) execute `e.preventDefault()` during active rounds to eliminate browser window scrolling or accidental page navigation.
  - Tab switching (`blur` and `visibilitychange`) automatically flushes the key tracking map (`this.keys = {}`) to prevent sticky keys.
- **Mobile Touch Controls**:
  - `src/engine/TouchControls.js` attaches touch listeners to custom virtual controls (`#touch-dpad-stick`, `#touch-btn-light`, `#touch-btn-heavy`, `#touch-btn-special`, `#touch-btn-ultimate`, `#touch-btn-dodge`, `#touch-btn-block`).
  - Virtual stick displacement maps polar coordinates to normalized vectors and triggers `setVirtualMovement()`.
  - Actions directly invoke `triggerPlayerAction()`, executing the exact same state transitions as keyboard commands.

---

## 5. Combat State Machine & Collision Detection
- **Fighter States**:
  - `IDLE`, `MOVING`, `JUMPING`, `FALLING`, `ATTACKING`, `DODGING`, `BLOCKING`, `PARRYING`, `HURT`, `KNOCKED_DOWN`, `STUNNED`, `DEFEATED`.
- **Attack Sub-Phases**:
  - Each attack contains distinct frame windows: `startup`, `active`, and `recovery`.
  - Hitboxes are active strictly during the `active` frame window.
- **Hit Detection Pipeline (`CombatSystem.js`)**:
  1. AABB (Axis-Aligned Bounding Box) overlap detection between the attacker's active `hitboxes` and defender's `hurtboxes`.
  2. Defender state evaluation:
     - If `DODGING` (invulnerability frames active): Hit completely misses, triggering `triggerDodgeFeedback()`.
     - If `PARRYING` (active parry frame window): Attacker is staggered into `STUNNED` state and takes counter damage; defender takes 0 damage.
     - If `BLOCKING`: Defender absorbs 85% of incoming damage (15% chip damage applied) and receives reduced knockback.
     - If Unprotected: Full damage applied, hit combo incremented, hit-stop applied, screen flash triggered, and defender knocked back into `HURT` or `KNOCKED_DOWN`.

---

## 6. Rendering & Vector Asset Architecture
RIFTBORN uses 100% procedural Canvas 2D vector graphics rather than raster sprite sheets:
- **Zero Asset Loading Bottlenecks**: No external PNGs, GIFs, or sprite sheets are downloaded over the network.
- **Procedural Character Renderer (`src/fighters/CharacterRenderer.js`)**:
  - Anatomical joints (torso, head, limbs, weapons, energy trails) are rendered mathematically using Canvas 2D path transforms (`ctx.arc`, `ctx.bezierCurveTo`, `ctx.lineTo`, and linear/radial gradients).
  - Dynamic visual trails and glow effects use `ctx.globalCompositeOperation = 'lighter'`.
- **Dynamic Camera System**:
  - Tracks player midpoint with smooth interpolation (`lerp`).
  - Dynamic zoom adjusts dynamically based on fighter separation distance (zooms in close up to `1.15x`, zooms out to `0.92x` at arena boundaries).
  - Screen shake employs quadratic trauma decay (`trauma * trauma`).

---

## 7. Procedural Audio Synthesis (`SoundEngine.js`)
- RIFTBORN does not load external MP3/WAV files.
- Employs the browser **Web Audio API** (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `GainNode`).
- Generates procedural audio effects:
  - Punch impacts: Frequency-swept sine oscillators with distortion.
  - Energy blasts / Specials: White noise buffers passed through sweeping bandpass filters.
  - Menu clicks, Round announcements, and Synthwave background tracks.
- Autoplay Compliance: AudioContext initialization is deferred until user interaction (`click`, `touchstart`, or `keydown`) to adhere to browser autoplay policies.

---

## 8. Persistence & Data Storage
- Storage mechanism: Browser `window.localStorage`.
- Storage keys:
  - `riftborn_player_profile`: Username, level, XP, credits, selected titles.
  - `riftborn_competitive_state`: Rank tier, division, MMR, match history.
  - `riftborn_quest_progress`: Daily/weekly quest states.
  - `riftborn_story_progress`: Campaign node completion.
  - `riftborn_settings`: Volume levels, hitboxes display toggle, particle density.
- Corrupted Storage Defense: All `JSON.parse` operations are wrapped in `try/catch` fallback blocks that gracefully restore default data structures if invalid or tampered JSON is encountered.
