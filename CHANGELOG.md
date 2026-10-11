# Changelog

All notable changes to the RIFTBORN project are documented in this file.

## [1.0.0] - 2026-10-11

### Security & Compliance
- Conducted full dependency security audit via `npm audit` (0 vulnerabilities found).
- Confirmed zero credentials, tokens, or private secrets in repository history and source code.
- Hardened Content Security Policy and HTTP security header specifications in `docs/SECURITY.md`.
- Validated text content injection safety across all UI elements (`node.textContent` standard).

### Stability & Quality Fixes
- Added `visibilitychange` event handler in `src/engine/GameEngine.js` to reset held keys and synchronize `lastTime` delta timer when tab is hidden or restored.
- Added `window.blur` event handler to flush active keys (`this.keys = {}`) when window loses focus, preventing stuck inputs.
- Ensured default browser keyboard actions (e.g. Spacebar scroll, Arrow key navigation) are prevented (`e.preventDefault()`) strictly during active combat and round intros while preserving normal typing in form controls.
- Added standard `.gitignore` to prevent tracking `node_modules/`, `dist/`, and temporary local scratch scripts.

### Test Automation
- Added unified `"test"` npm script to `package.json` executing both headless test suites.
- Validated all 39 combat prototype unit tests in `test_combat_prototype.js` (100% pass).
- Validated all 27 round system integration tests in `test_round_system.js` (100% pass).
- Total verified automated test assertions: **66 passed, 0 failed**.

### Documentation
- Created `docs/ARCHITECTURE.md` detailing the client-side engine loop, rendering pipeline, input handling, and Web Audio API synthesis.
- Created `docs/TEST_PLAN.md` covering automated test suites, manual QA test cases, and browser compatibility matrices.
- Created `docs/THREAT_MODEL.md` assessing assets, threat actors, attack vectors, and frontend security boundaries.
- Created `docs/SECURITY.md` establishing vulnerability disclosure policies and recommended HTTP response headers.
- Created `docs/DEPLOYMENT_RUNBOOK.md` detailing build verification, hosting configurations, smoke tests, and rollback procedures.
- Created `docs/INCIDENT_RESPONSE.md` defining incident severity tiers and disaster recovery runbooks.
- Updated `README.md` with verified launch documentation, test instructions, and links to all technical guides.
