# RIFTBORN — Incident Response & Disaster Recovery

## 1. Incident Classification

| Severity Level | Definition | Example Scenarios | Target Resolution |
|:---|:---|:---|:---:|
| **SEV-1 (Critical)** | Entire game inaccessible or malicious payload injected into production build | CDN outage, DNS hijacking, XSS payload in production JS | < 1 Hour |
| **SEV-2 (High)** | Core gameplay blocked for major browser or device category | Game canvas blank on mobile Safari, audio crash blocking loop | < 4 Hours |
| **SEV-3 (Medium)** | Non-blocking feature failure or layout defect | Quest tracker not updating, profile modal misaligned on small viewports | < 24 Hours |
| **SEV-4 (Low)** | Minor cosmetic or documentation issues | Typo in ability tooltip, particle density slider visual glitch | Next release |

---

## 2. Response Procedures by Scenario

### Scenario A: Production Outage / CDN Failure
1. **Identify Scope**: Check hosting provider status dashboard (e.g., Cloudflare, GitHub, Netlify).
2. **Immediate Action**:
   - If hosting provider is experiencing a regional outage, verify DNS failover or status page notice.
   - If build was corrupted during automated deploy, initiate immediate rollback via hosting provider control panel to the prior verified release commit.
3. **Verify Restoration**: Perform smoke tests as detailed in `DEPLOYMENT_RUNBOOK.md`.

### Scenario B: Suspicious Activity / Compromised Static Bundle
1. **Immediate Quarantine**:
   - Revert origin repository to the last verified clean commit tag.
   - Trigger a clean CI build (`npm ci && npm run build`) and redeploy immediately.
2. **Investigation**:
   - Audit git commit log (`git log -n 20`) for unauthorized commits or PR merges.
   - Check npm dependencies for supply-chain compromises (`npm audit`, lockfile diffs).
   - Invalidate all GitHub Personal Access Tokens (PATs) and repository deploy keys.
3. **User Communication**: Post status update on the repository explaining the incident and confirming client state safety.

### Scenario C: Corrupted User Local Storage
1. **Symptom**: User reports game freezing on load or failing to initialize menus.
2. **Emergency Mitigation**:
   - Instruct user to clear local site storage via browser settings or execute `localStorage.clear()` in DevTools.
3. **Engine Defense**:
   - RIFTBORN's storage systems (`ProgressionManager`, `CompetitiveSystem`, `QuestSystem`) are defensively wrapped with `try/catch` fallbacks. If any key fails schema validation, the system automatically replaces it with a clean default state rather than crashing.

---

## 3. Post-Incident Review Protocol
Following any SEV-1 or SEV-2 incident:
1. Document root cause, timeline, impact, and remediation steps.
2. Add automated regression tests covering the failure condition to `test_combat_prototype.js` or `test_round_system.js`.
3. Update `CHANGELOG.md` with incident details and patch notes.
