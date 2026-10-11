# RIFTBORN — Threat Model & Security Analysis

## 1. System Context & Architecture Boundary
RIFTBORN is currently a **100% client-side application** with no backend servers, user authentication databases, or payment gateways. 
Consequently, the threat landscape differs significantly from traditional client-server web architectures.

---

## 2. Assets & Data Inventory

| Asset Name | Location | Classification | Impact of Compromise |
|:---|:---|:---|:---|
| Game Source Code & Logic | Browser memory / Static bundle | Public | Low (Open-source client code) |
| Player Progression Data | `localStorage` (`riftborn_player_profile`, etc.) | User-local | Low (Client-side single player unlocks) |
| Competitive Rank & MMR | `localStorage` (`riftborn_competitive_state`) | User-local | Low (Client-side simulation) |
| Hosting Origin Integrity | Static CDN / GitHub Pages | Critical | High (Defacement, supply-chain malicious script injection) |

---

## 3. Threat Actors & Attack Scenarios

### Threat Actor 1: Casual Player / Client-Side Tamperer
- **Motivation**: Unlock all characters, inflate local MMR/rank, or bypass match difficulties.
- **Attack Vector**: Opening browser Developer Tools (Console) and modifying `localStorage` keys or calling `window.riftbornApp.engine.p1.heal(9999)`.
- **Impact Assessment**: **Non-Impactful to other users**. Because there is no central server or global multiplayer database, client-side cheating affects solely the individual player's local instance.
- **Mitigation**: Schema validation and `try/catch` fallbacks ensure modified or corrupted data does not crash the client application.

### Threat Actor 2: Web Exploiter / Cross-Site Scripting (XSS)
- **Motivation**: Execute malicious JavaScript in victim browsers via injected inputs or reflected query parameters.
- **Attack Vector**: Injecting `<script>` or event attributes into profile usernames or match chat.
- **Audit Findings**:
  - All dynamic user text in RIFTBORN is populated strictly using `node.textContent` or sanitized DOM node creation (`document.createElement`).
  - No `eval()`, `new Function()`, or untrusted `innerHTML` string concatenations are present in input-handling paths.
- **Residual Risk**: Low. Mitigated by Content Security Policy (CSP).

### Threat Actor 3: Upstream Supply-Chain / Dependency Hijacker
- **Motivation**: Inject malicious code via compromised npm packages.
- **Attack Vector**: Introducing vulnerable packages through `node_modules`.
- **Audit Findings**:
  - Production runtime dependencies: **0 packages** (Vanilla JS).
  - Dev dependencies: `vite` v8.3.2, `puppeteer-core` v25.13.0.
  - `npm audit` returned: **0 vulnerabilities**.
- **Residual Risk**: Low. Controlled build environment and lockfile pinning.

---

## 4. Frontend vs. Backend Risk Comparison

| Security Domain | Frontend Application (RIFTBORN Current) | Backend Architecture (If added in future) |
|:---|:---|:---|
| **Authentication & Sessions** | N/A — No accounts or session cookies exist. | Critical — Session hijacking, JWT signing, brute force. |
| **Data Integrity / Anti-Cheat** | Zero trust boundary; client has full memory control. | Authoritative server must simulate combat & validate physics. |
| **Denial of Service (DoS)** | N/A — Client runs on user CPU; no central server to overload. | High — Rate limiting, DDOS mitigation, connection pools. |
| **SQL / Command Injection** | N/A — No SQL database or server OS commands. | High — Parameterized queries, ORM sanitation. |
| **Cross-Site Scripting (XSS)** | Enforce `textContent` + Strict CSP. | HTML sanitization, HttpOnly cookies, secure headers. |

---

## 5. Security Mitigations Implemented

1. **Defensive Storage Deserialization**:
   - Every `localStorage` read parses within `try { ... } catch (e) { ... }` blocks with automatic schema repair to prevent denial-of-service from corrupted local storage.
2. **Defensive Input Scoping**:
   - Keyboard events ignore form inputs to prevent interference with browser utilities and accessibility tools.
3. **Zero Third-Party Tracking**:
   - No tracking beacons, analytics trackers, or third-party ad scripts are embedded.
4. **Content Security Policy Readiness**:
   - Ready for strict `script-src 'self'` policy enforcement on static hosts.
