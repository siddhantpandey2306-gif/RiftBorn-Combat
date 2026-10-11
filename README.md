# ⚡ RIFTBORN — Original Competitive 2D Fighting Game

[![Version](https://img.shields.io/badge/version-1.0.0-crimson.svg)](https://github.com/siddhantpandey2306-gif/RiftBorn-Combat)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile%20%7C%20PWA-00D2FF.svg)]()
[![Built With](https://img.shields.io/badge/built%20with-Canvas2D%20%2B%20WebAudio-FBBF24.svg)]()
[![Build & Tests](https://img.shields.io/badge/tests-66%20passed%20%7C%200%20failed-brightgreen.svg)]()

> **RIFTBORN** is an original futuristic, hero-based 2D browser fighting game built with high-performance Canvas rendering, procedural Web Audio synthesis, responsive multi-touch controls, and deep competitive combat mechanics.

---

## 🎮 Play Modes

- **⚔️ Casual 1v1 (Sparring Protocol)**: Battle against adaptive combat AI with customizable difficulty (Recruit, Warrior, Master, Godlike) or challenge a friend locally.
- **🏆 Ranked Competitive Ladder**: Climb 7 competitive tiers from Bronze I up to Rift Champion with real-time RP rating calculations, division promotions, and streak bonuses.
- **📖 Cinematic Story Campaign**: Play episodic narrative chapters exploring Terra-Nova, the Monolith Anomaly, and rogue Void operatives.
- **🥋 Training Lab / Dojo**: Practice combo routes with interactive frame telemetry, real-time input logging, hitbox visualizers, and damage counters.
- **👑 Boss Rush**: High-stakes boss gauntlet pitting your fighter against elite Rift commanders.

---

## 🥋 The Fighter Roster

| Fighter | Archetype | Energy Core | Playstyle |
| :--- | :--- | :--- | :--- |
| **VEX** | Balanced Vanguard | Crimson | Balanced mid-range strikes, versatile blade counters |
| **SOLARIS** | Radiant Juggernaut | Gold | Super-armor swings, heavy damage, ground-pound shockwaves |
| **LYRA** | Crystalline Duelist | Cyan | Lightning-fast rushdown, prism dashes, evasive traps |
| **AERON** | Zephyr Strider | Emerald | High-mobility aerial combat, gale projectiles, spacing |
| **NOX** | Shadow Stalker | Violet | Teleportation, illusions, counter-strikes |
| **IGNIS** | Pyroclastic Brawler | Amber | Close-quarters explosions, incinerating combo loops |

---

## 🕹️ Controls Guide

### 💻 Desktop Keyboard (Player 1)

| Input | Action |
| :--- | :--- |
| **A / D** | Walk Left / Right |
| **W** | Jump |
| **S** | Crouch / Duck |
| **J** | Light Attack |
| **K** | Heavy Attack |
| **L** | Special Ability 1 |
| **U** | Special Ability 2 |
| **I** | Ultimate Move *(Requires full Core Meter)* |
| **SHIFT** | Block *(Absorbs incoming damage)* |
| **SPACE** | Evasive Dodge *(Invulnerability frames)* |
| **H** | Tactical Parry |
| **ESC / P** | Pause Match |
| **F11 / ⛶** | Toggle Fullscreen |

### 📱 Mobile & Touch Controls

- **Left Thumb Virtual Joystick**: Smooth 360° directional movement, crouch, and jump flick.
- **Right Thumb Action Cluster**: Ergonomically placed arcade buttons (`LIGHT`, `HEAVY`, `SPECIAL`, `BLOCK`, `DODGE`, and glowing `ULTIMATE`).
- **Interactive Fullscreen**: Tap **`⛶ FULL`** in the bottom HUD pill or **`⛶ FULLSCREEN`** in the top navbar to hide browser address bars and play in full-screen landscape.
- **PWA Ready**: Tap Chrome's menu (`⋮`) -> **Add to Home Screen** to install RIFTBORN as a standalone native app with zero browser tabs.

---

## 💎 Progression & Reward Loop

- **Account Level & Mastery XP**: Level up individual fighters to unlock unique stat augments, prestige titles, and cosmetic badges.
- **Daily & Weekly Bounties**: Complete tactical objectives (Evasions, Parries, High Combos) to earn Coins and Prisms.
- **Cosmetics Drops**: Equip epic titles, badges, victory banners, and profile crests earned through performance grades (**S**, **A**, **B**, **C**).
- **Match Results Summary**: Sleek post-match board displaying rounds, damage, max combo, and immediate 1-tap rematch.

---

## 🛠️ Tech Stack & Architecture

- **Client-Side SPA**: Zero external backend services or databases needed.
- **Rendering**: HTML5 Canvas 2D engine with procedural particle simulation, hitstop, screenshake, and custom lighting.
- **Audio**: Web Audio API Sound Synthesizer with spatial combat hits, parry chimes, and adaptive combat themes.
- **Styling**: Vanilla CSS3 design system with CSS custom properties, dark glassmorphism, and responsive safe-area mobile insets.
- **Build Tool**: [Vite](https://vitejs.dev/) v8.3.2 for lightning-fast HMR and optimized production bundles.

---

## 📚 Technical Documentation Suite

For comprehensive technical, deployment, and security details, consult the `docs/` directory:

- [Architecture Design & System Flow](docs/ARCHITECTURE.md)
- [Quality Assurance & Test Plan](docs/TEST_PLAN.md)
- [Threat Model & Security Boundary Analysis](docs/THREAT_MODEL.md)
- [Security Policy & Vulnerability Disclosure](docs/SECURITY.md)
- [Production Deployment Runbook](docs/DEPLOYMENT_RUNBOOK.md)
- [Incident Response & Disaster Recovery](docs/INCIDENT_RESPONSE.md)
- [Project Changelog](CHANGELOG.md)

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation & Run

1. **Clone the repository**:
   ```bash
   git clone https://github.com/siddhantpandey2306-gif/RiftBorn-Combat.git
   cd RiftBorn-Combat
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Run automated test suite**:
   ```bash
   npm test
   ```
   *Runs 39 combat prototype tests and 27 round system tests (66 total tests).*

4. **Start local development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

5. **Build for production**:
   ```bash
   npm run build
   ```
   Compiles and minifies assets into `dist/`.

6. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```
Rift Born/
├── index.html                   # Core HTML entry & modal templates
├── style.css                    # Design system, responsive layouts & HUD styles
├── public/
│   └── manifest.webmanifest     # PWA configuration for mobile standalone fullscreen
├── src/
│   ├── main.js                  # RiftbornApp application controller, UI routing & state
│   ├── config.js                # Character stats, move lists & ability definitions
│   ├── engine/
│   │   ├── GameEngine.js        # 60 FPS fixed-timestep loop, state machine & inputs
│   │   ├── CombatSystem.js      # Frame physics, hitboxes, combat state & combos
│   │   ├── SoundEngine.js       # Procedural Web Audio FX & combat audio
│   │   ├── ParticleSystem.js    # Object-pooled particle effects & visual feedback
│   │   └── TouchControls.js     # Mobile virtual joystick & touch buttons
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
├── docs/                        # Complete technical documentation suite
└── package.json                 # Project scripts and dependencies
```

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
