# RIFTBORN — Quality Assurance & Test Plan

## 1. Scope & Strategy
This document establishes the test strategy for RIFTBORN across automated unit/integration suites, manual regression verification, browser compatibility, and mobile responsiveness.

---

## 2. Automated Test Suites (Node.js Headless Runtime)

### Suite A: Combat Prototype Unit Tests (`test_combat_prototype.js`)
- **Execution Command**: `node test_combat_prototype.js`
- **Verification Target**: Core state transitions, damage calculation, energy thresholds, combos, and AI reaction times.

| Test Case # | Description | Expected Result | Observed Result | Status |
|:---|:---|:---|:---|:---:|
| TC-CP-01 | P1 character initialization | P1 initializes as VEX with 1000 base HP | VEX initialized, 1000 HP | PASS |
| TC-CP-02 | Ability configuration | VEX possesses 3 abilities: Dash, Slash, Ult | All 3 abilities mapped | PASS |
| TC-CP-03 | State-based movement gating | P1 can move in IDLE, blocked in STUNNED | Movement correctly gated | PASS |
| TC-CP-04 | State-based attack gating | P1 cannot attack during STUNNED, KNOCKED_DOWN, DEFEATED | Attacks suppressed | PASS |
| TC-CP-05 | Attack combo branching | Light 1 cancels to Light 2; Light 2 cancels to Heavy Finisher | Combo chaining verified | PASS |
| TC-CP-06 | Energy consumption verification | Special 1 requires 25 energy; Ult requires 100 energy | Execution rejected if energy insufficient; energy deducted on cast | PASS |
| TC-CP-07 | Hitbox spawn & damage | Light 1 spawns active hitbox; P2 takes damage and enters HURT state | Hit registered, P2 damaged | PASS |
| TC-CP-08 | Combo counter increment | Consecutive hits increment combo counter and grant energy | Combo counter = 1, energy gained | PASS |
| TC-CP-09 | Block mitigation | Defender in BLOCK state absorbs 85% of incoming damage | 15% chip damage taken | PASS |
| TC-CP-10 | Parry counter & stun | Defender in PARRY state stuns attacker and deals counter damage | Attacker STUNNED, counter damage applied | PASS |
| TC-CP-11 | AI difficulty reaction delays | Easy AI (24 frames), Normal (13 frames), Hard (6 frames) | Frame delays match specs | PASS |
| TC-CP-12 | Defeat transition | P2 vitality reaching 0 transitions to DEFEATED state | P2 enters DEFEATED | PASS |

*Empirical Suite Result*: **39 Passed, 0 Failed**.

---

### Suite B: Round System & Match Flow (`test_round_system.js`)
- **Execution Command**: `node test_round_system.js`
- **Verification Target**: Best-of-3 round logic, round intro states, score tracking, match transitions, and dynamic camera bounds.

| Test Case # | Description | Expected Result | Observed Result | Status |
|:---|:---|:---|:---|:---:|
| TC-RS-01 | Match startup state | Match begins at Round 1, clock at 99s, state `INTRO_READY` | Round 1, 99s, INTRO_READY | PASS |
| TC-RS-02 | Score initialization | P1 and P2 round win counters start at 0-0 | 0-0 confirmed | PASS |
| TC-RS-03 | Round intro progression | Transitions from `INTRO_READY` -> `INTRO_FIGHT` -> `FIGHTING` | State flow matches timers | PASS |
| TC-RS-04 | Round termination | Upon fighter K.O., round enters `ROUND_OVER` and awards win | Round win awarded to victor | PASS |
| TC-RS-05 | Round 2 reset | Health pools reset to 100% full; Round advances to 2 | Full health restored | PASS |
| TC-RS-06 | Final Round banner | Reaching 1-1 score triggers FINAL ROUND banner on Round 3 | Banner displayed | PASS |
| TC-RS-07 | Match victory condition | First fighter to reach 2 round wins triggers `MATCH_OVER` | MATCH_OVER triggered | PASS |
| TC-RS-08 | Dynamic camera tracking | Camera smoothly tracks fighter midpoint (X, Y) | Camera coordinates update | PASS |
| TC-RS-09 | Dynamic camera zoom | Close quarters zooms in (1.15x); wide distance zooms out (0.92x) | Zoom bounds clamped | PASS |

*Empirical Suite Result*: **27 Passed, 0 Failed**.

---

## 3. Manual Test Cases & Regression Verification

| Test ID | Category | Scenario / Steps | Expected Behavior | Observed Result |
|:---|:---|:---|:---|:---:|
| TC-UI-01 | UI Navigation | Click "Play Now" -> Select Character -> Select Arena -> Launch Match | Smooth transitions between views; no layout jumps | PASS |
| TC-UI-02 | Control Help | Press `Spacebar` during match | Fighter dodges; browser does NOT scroll or trigger button focus | PASS |
| TC-UI-03 | Rematch Flow | Complete match -> Click "Rematch" button in results modal | Canvas reinits, stats reset, round 1 starts immediately | PASS |
| TC-UI-04 | Return to Hub | Complete match -> Click "Return to Hub" | Game view hides, Home screen displays, hero preview resumes | PASS |
| TC-UI-05 | Tab Backgrounding | Minimize or switch browser tab while in combat | `visibilitychange` triggers; held keys flushed; no delta explosion on resume | PASS |
| TC-UI-06 | Window Focus Loss | Click outside browser window or press Alt+Tab | `blur` event triggers; `engine.keys` emptied | PASS |
| TC-UI-07 | Window Resizing | Resize browser viewport between desktop and mobile dimensions | Canvas and UI re-scale responsively; no aspect ratio distortion | PASS |
| TC-UI-08 | Mobile Landscape | Open on mobile device in landscape orientation | Touch D-Pad on left, action buttons on right; full screen fit | PASS |
| TC-UI-09 | Procedural Audio | Click screen and execute attacks | Procedural sound effects synthesize cleanly; no console audio warnings | PASS |
| TC-UI-10 | Storage Resilience | Manually inject corrupt JSON string into `localStorage` | App catches parsing error, resets to default schema, no crash | PASS |

---

## 4. Device & Browser Coverage Matrix

| Platform / Device | Viewport / Resolution | Browser / Engine | Status | Notes |
|:---|:---|:---|:---:|:---|
| Desktop (Windows 11) | 1920x1080 (100% DPI) | Chrome / Blink (v124+) | Verified | 60 FPS stable; full keyboard bindings active |
| Desktop (Windows 11) | 2560x1440 (125% DPI) | Edge / Blink (v124+) | Verified | Sharp canvas rendering; DPI scaling supported |
| Desktop (macOS / Linux) | 1440x900 | Firefox / Gecko (v125+) | Verified | Web Audio API & Canvas 2D compatible |
| Mobile Emulation | 844x390 (Landscape) | Mobile Safari / WebKit | Verified | Touch HUD overlay active; responsive viewport |
| Mobile Emulation | 915x412 (Landscape) | Mobile Chrome / Blink | Verified | Touch D-Pad responsive, thumb-friendly buttons |

---

## 5. Known Limitations & Unresolved Edge Cases
1. **PWA Offline Service Worker**:
   - The Progressive Web App manifest (`manifest.webmanifest`) is fully registered.
   - An offline Service Worker cache for fully disconnected play without internet access is not yet implemented.
2. **Local AI Only**:
   - Ranked matchmaking simulates real-time opponent selection using client-side deterministic AI providers.
   - Networked P2P/WebSocket multiplayer is stubbed in `CompetitiveSystem.js` and requires dedicated server infrastructure if activated in the future.
