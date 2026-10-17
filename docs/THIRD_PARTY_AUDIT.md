# RIFTBORN — Third-Party Dependencies & Supply Chain Audit

**Application:** RIFTBORN — Combat  
**Last Updated:** October 17, 2026  
**Auditor:** Application Security Engineer & Frontend Auditor

---

## 1. Runtime Dependencies Overview
An audit of `package.json` reveals that RIFTBORN contains **ZERO runtime dependencies** (`dependencies: {}`).
- No external runtime frameworks (React, Vue, Angular, or jQuery).
- No CSS frameworks (Tailwind, Bootstrap, Bulma).
- No external physics or game engines (Phaser, Three.js, Pixi.js, Matter.js). All physics, raycasts, vector math, state machines, particle emitters, and canvas rendering are custom-engineered vanilla JavaScript.
- No third-party monetization, advertising, or tracker SDKs.

---

## 2. Development Dependencies

| Package | Version | License | Purpose & Execution Context | Security Risk Assessment |
| :--- | :---: | :---: | :--- | :--- |
| **`vite`** | `^8.3.2` | MIT | Local development server and production static asset bundler (HTML/CSS/JS minification). | **LOW:** Runs strictly at build time / dev time. Emits static ES modules. |
| **`puppeteer-core`** | `^25.13.0` | Apache-2.0 | Headless browser automation for multi-viewport responsive testing and combat verification scripts in `scratch/`. | **LOW:** Test harness tool only; never packaged or served to client browsers. |

---

## 3. External Network & CDN Resources

| Provider | Resource | Purpose | License / Terms | Network Impact | Security & Privacy Notes |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Google Fonts** (`fonts.googleapis.com`, `fonts.gstatic.com`) | `Bebas Neue`, `Orbitron`, `Inter`, `Oswald` | Brand typography, HUD numerals, and tactical headings. | SIL Open Font License (OFL) / Apache 2.0 | ~80 KB cached WOFF2 fonts | Loaded over HTTPS with `crossorigin`. No cookies are transmitted with font requests. |

---

## 4. Audio & Media Asset Provenance
- **Audio Synthesizer:** Sound effects (punches, kicks, parry metallic rings, rift blasts, energy hums, UI clicks) are generated procedurally at runtime via the browser's native **Web Audio API** (`src/engine/SoundEngine.js`) using oscillators, noise buffers, and biquad filter sweeps. No external copyrighted sound clips are downloaded or bundled.
- **Combat Graphics:** Character sprites, combat auras, shockwaves, arena cyber pillars, and glowing runes are rendered procedurally on `<canvas>` using 2D paths and linear gradients (`src/engine/CharacterRenderer.js`, `src/engine/ArenaRenderer.js`, `src/engine/ParticleSystem.js`).
- **Icons & Favicon:** Custom inline SVGs and standalone SVG (`public/favicon.svg`) authored specifically for RIFTBORN.

---

## 5. Vulnerability & Supply Chain Posture
- Total npm audit vulnerabilities: **0**.
- Zero runtime third-party code execution vectors.
- No remote code injection, CDN script tag compromise, or npm sub-dependency hijacking vulnerabilities present in the production bundle.
