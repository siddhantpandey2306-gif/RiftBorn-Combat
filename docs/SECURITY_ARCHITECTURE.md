# RIFTBORN — Security Architecture & Threat Boundaries

## 1. Executive Summary & Architecture Overview
**RIFTBORN — Combat** is an original browser-based 2D fighting game. 
- **Build System**: Vite 8 with ES module bundling.
- **Runtime Environment**: Modern Web Browsers (Chromium, Firefox, Safari/WebKit, Edge) on Desktop and Mobile.
- **Frontend Stack**: Native HTML5 Canvas 2D API, Web Audio API, Vanilla JavaScript (ES2022+), and Vanilla CSS.
- **Hosting Model**: Pure Static Site (Static Single Page Application hosted on GitHub Pages or Cloudflare Pages).
- **Backend / Server-Side Architecture**: **None**. There are **no remote databases, no custom APIs, no server-side authentication, and no cloud functions**.

```
+---------------------------------------------------------------------------------+
|                                BROWSER SANDBOX                                  |
|                                                                                 |
|  +--------------------+     +---------------------+     +--------------------+  |
|  |   HTML5 Canvas     | <-> |  Game & AI Engine   | <-> |   Web Audio API    |  |
|  |  (2D Combat Loop)  |     |  (60 FPS Sim Loop)  |     | (Procedural SFX)   |  |
|  +--------------------+     +---------------------+     +--------------------+  |
|                                        ^                                        |
|                                        | In-Memory State                        |
|                                        v                                        |
|  +--------------------+     +---------------------+                             |
|  |  DOM UI / Screens  | <-> | Progression Manager |                             |
|  | (Settings/Roster)  |     | (Sanitization Layer)|                             |
|  +--------------------+     +---------------------+                             |
|                                        |                                        |
|                                        v Serialization (JSON)                   |
|                             +---------------------+                             |
|                             |    localStorage     |                             |
|                             |  (Browser Storage)  |                             |
|                             +---------------------+                             |
+---------------------------------------------------------------------------------+
                                         |
                                         | HTTP GET (Static Assets Only)
                                         v
                      +-------------------------------------+
                      | Static CDN (GitHub / Cloudflare)    |
                      |  - index.html                       |
                      |  - assets/*.js, assets/*.css        |
                      |  - favicon.svg, manifest, robots    |
                      +-------------------------------------+
```

---

## 2. Trust Boundaries & Security Zones

### Zone 1: The Client Runtime (Untrusted)
All game simulation, combat physics, damage calculation, AI behavior, progression unlocks, and cosmetics evaluation execute exclusively inside the user's browser thread.
- **Trust Level**: **Zero Trust**. The client code and browser environment are under the total control of the end-user.
- **Implication**: Any user can inspect JavaScript code, pause execution in Chrome/Firefox DevTools, edit memory variables, or modify `localStorage` values directly.
- **Defense Posture**: In a local-first single-player browser game without a backend or monetary economy, client-side integrity measures focus on **input sanitization, schema validation, defense against state corruption, and prevention of Cross-Site Scripting (XSS)**. Client-side checks cannot and must not be considered a substitute for server-side anti-cheat in future competitive multiplayer.

### Zone 2: Browser Storage (`localStorage`)
RIFTBORN persists profile data, unlocked fighters/skins, sound preferences, keybindings, and campaign quest status using the browser `window.localStorage` API under keys:
- `riftborn_progression_v1`
- `riftborn_settings`
- `riftborn_theme`
- `riftborn_touch_controls_v1`
- `riftborn_privacy_prefs`

- **Trust Level**: **Untrusted Persistence**.
- **Defense Posture**: 
  1. `ProgressionManager.load()` wraps parsing in strict schema validation and `try/catch` fallbacks. Malformed, corrupted, or tampered keys are safely discarded or repaired with sane defaults.
  2. Username and Clan tags undergo strict sanitization (character allowlists, length clamping) before storage and upon import.
  3. No authentication tokens, session cookies, passwords, or payment secrets are stored here.

### Zone 3: Static Asset Delivery (Trusted CDN)
- **Trust Level**: **High**. Static assets (`index.html`, bundled JS, CSS, SVG icons) are built deterministically via GitHub Actions CI and served over enforced HTTPS from GitHub Pages / Cloudflare Pages.
- **Defense Posture**:
  1. Strict Content Security Policy (CSP) limits script execution strictly to `'self'`.
  2. `X-Content-Type-Options: nosniff` prevents MIME-sniffing exploits.
  3. `Referrer-Policy: strict-origin-when-cross-origin` shields referrers.
  4. Production builds emit no source maps (`sourcemap: false`), reducing structural reconnaissance.

---

## 3. Externally Connected Services & APIs
RIFTBORN maintains a strict **zero external network dependency** posture at runtime:
1. **Google Fonts (CDN)**:
   - Domains: `https://fonts.googleapis.com` (CSS) and `https://fonts.gstatic.com` (Web Fonts).
   - Usage: High-performance display typography (`Bebas Neue`, `Inter`, `Orbitron`, `Oswald`).
   - Security Control: Explicitly allowlisted in CSP `style-src` and `font-src`. No remote scripts are loaded from Google.
2. **Analytics & Tracking**: **None**. Zero tracking pixels, telemetry beacons, or third-party ad networks are incorporated.
3. **External Payment Providers**: **None**. No real-money transactions exist in the current build.
4. **Third-Party CDNs for Libraries**: **None**. All application modules, physics calculations, sound synthesis, and state engines are bundled locally.

---

## 4. Architectural Limitations & Future Recommendations
If RIFTBORN transitions from an offline/local browser game to an authoritative multiplayer or commercial title:
1. **Authoritative Server**: Competitive match outcomes, Elo calculation, and leaderboard submissions must be processed on a dedicated backend server (e.g., Node.js / Go WebSocket server) with server-side rollback or lockstep simulation.
2. **Authentication & Session Tokens**: Secure HttpOnly, SameSite=Strict cookies must be utilized rather than Web Storage.
3. **Database Security**: Remote player inventories and cosmetic purchases must reside in an ACID-compliant database with row-level security and strict validation.
