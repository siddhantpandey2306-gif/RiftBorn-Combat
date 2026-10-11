# ⚡ RIFTBORN — Original Competitive 2D Fighting Game

[![Version](https://img.shields.io/badge/version-1.0.0-crimson.svg)](https://github.com/)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Web%20%7C%20Mobile%20%7C%20PWA-00D2FF.svg)]()
[![Built With](https://img.shields.io/badge/built%20with-Canvas2D%20%2B%20WebAudio-FBBF24.svg)]()

> **RIFTBORN** is an original futuristic, hero-based 2D browser fighting game built with high-performance Canvas rendering, procedural particle FX, responsive multi-touch controls, and deep competitive combat mechanics.

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

- **Rendering**: HTML5 Canvas 2D engine with procedural particle simulation, hitstop, screenshake, and custom lighting.
- **Audio**: Web Audio API Sound Synthesizer with spatial combat hits, parry chimes, and adaptive combat themes.
- **Styling**: Vanilla CSS3 design system with CSS custom properties, dark glassmorphism, and responsive safe-area mobile insets.
- **Typography**: Google Fonts (*Orbitron*, *Bebas Neue*, *Inter*, *Oswald*).
- **Build Tool**: [Vite](https://vitejs.dev/) for lightning-fast HMR and optimized production bundles.

---

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher recommended)
- npm or yarn

### Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/rift-born.git
   cd rift-born
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the development server**:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:5173/`.

4. **Build for production**:
   ```bash
   npm run build
   ```

5. **Preview production build**:
   ```bash
   npm run preview
   ```

---

## 📁 Project Structure

```
rift-born/
├── index.html                   # Core HTML entry & modal templates
├── style.css                    # Design system, responsive layouts & HUD styles
├── public/
│   └── manifest.webmanifest    # PWA configuration for mobile standalone fullscreen
├── src/
│   ├── main.js                  # Main application controller, routing & lifecycle
│   ├── characters/
│   │   └── characterData.js     # Character stats, move lists & ability definitions
│   ├── engine/
│   │   ├── ArenaRenderer.js     # Multi-layered parallax arenas & particle effects
│   │   ├── CombatEngine.js      # Frame physics, hitboxes, combat state & AI
│   │   ├── SoundEngine.js       # Procedural Web Audio FX & combat audio
│   │   └── TouchControls.js     # Mobile virtual joystick & touch buttons
│   ├── modes/
│   │   ├── CasualMode.js        # Casual match configuration
│   │   ├── RankedMode.js        # Competitive division & RP matchmaking logic
│   │   └── StoryMode.js         # Campaign chapters, dialogs & boss fights
│   └── progression/
│       ├── progressionManager.js # XP, account levels & persistent storage
│       └── progressionTracks.js # Hero mastery curves, unlocks & reward tiers
├── package.json                 # Project scripts and dependencies
└── README.md                    # Project documentation
```

---

## 📜 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.
