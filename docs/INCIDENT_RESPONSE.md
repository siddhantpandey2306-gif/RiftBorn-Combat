# RIFTBORN — Incident Response Playbook

## 1. Incident Classification

| Severity Level | Definition | Example Scenarios | Target SLA |
|:---|:---|:---|:---:|
| **SEV-1 (Critical)** | Entire game inaccessible, malicious payload in production, or account compromised | GitHub account takeover, malicious script in `dist/`, credential leaked | < 1 Hour |
| **SEV-2 (High)** | Core gameplay blocked for major browser category or critical dependency CVE | High CVE in dependency, canvas crash on mobile Safari, CSP blocking assets | < 4 Hours |
| **SEV-3 (Medium)** | Non-blocking feature failure or layout defect | Sound glitch in Chromium, save data export formatting bug | < 24 Hours |
| **SEV-4 (Low)** | Minor cosmetic or documentation issues | Typo in fighter lore, color contrast polish in menu | Next release |

---

## 2. Comprehensive Response Playbooks

### Playbook 1: Leaked API Key or Token
1. **Identify**: Detect secret exposed in public repository, pull request, or build log.
2. **Stop Unauthorized Access**:
   - Immediately visit the credential issuer's console (e.g., GitHub, Cloudflare).
   - **Revoke the key immediately**. Do not wait to rewrite git history or commit a deletion. Once a key is committed, it is considered permanently compromised.
3. **Rotate & Replace**:
   - Generate a replacement token with least-privilege scopes.
   - If needed in CI, store it in GitHub Secrets (`Repository Settings > Secrets and variables > Actions`). Never put it in code or `.env.example`.
4. **Clean Repository**:
   - If committed locally, remove from working tree. If pushed, coordinate a clean squash or git filter-repo with collaborator approval.
5. **Verify**: Test CI and deployment using the rotated token.

### Playbook 2: Compromised GitHub Account
1. **Identify**: Unrecognized commits, SSH keys added to account, or unauthorized collaborator invitations.
2. **Stop Unauthorized Access**:
   - Initiate immediate account recovery at `github.com/password_reset`.
   - Revoke all active sessions under `Settings > Sessions`.
   - Revoke all SSH and GPG keys under `Settings > SSH and GPG keys`.
   - Revoke all Personal Access Tokens under `Developer Settings > Personal access tokens`.
   - Change account password to a unique 20+ character passphrase and re-enroll WebAuthn/Passkey 2FA.
3. **Audit Repository**:
   - Review recent commits on `main` and all branches.
   - Revert any unauthorized commits immediately via `git revert`.
4. **Redeploy**: Run a clean GitHub Actions deployment workflow.

### Playbook 3: Unauthorized Repository Change / Malicious Commit
1. **Identify**: Unexpected commit on `main` modifying workflow files, injecting scripts, or altering game assets.
2. **Stop Unauthorized Access**:
   - Revoke write permissions for the offending collaborator or token.
3. **Rollback**:
   - Locate the last known good commit SHA: `git log --oneline -n 10`.
   - Revert malicious changes: `git revert <malicious-commit-sha> -m 1`.
   - Push the revert to `main`.
4. **Redeploy & Verify**:
   - Trigger CI deployment. Verify that the production site serves the clean build.

### Playbook 4: Compromised Deployment Credential
1. **Identify**: Unauthorized deployments or modifications directly on GitHub Pages or Cloudflare Pages.
2. **Stop Unauthorized Access**:
   - Invalidate deployment tokens / OIDC trust bindings.
   - Re-link GitHub Pages environment in `Settings > Pages`.
3. **Redeploy**: Trigger a fresh build from verified clean commit.

### Playbook 5: Vulnerable Dependency (Supply Chain Incident)
1. **Identify**: Alert from GitHub Dependabot or `npm audit` reporting a high/critical CVE.
2. **Triage**:
   - Determine reachability: Is the vulnerable function executed in RIFTBORN?
3. **Remediation**:
   - Check if an upstream patch exists: `npm update <package>` or bump version in `package.json`.
   - Run `npm audit` to verify 0 vulnerabilities.
   - Run `npm test` and `npm run build` to ensure no breaking changes.
4. **Deploy**: Commit updated `package.json` and `package-lock.json` and push to `main`.

### Playbook 6: Broken or Corrupted Production Deployment
1. **Identify**: White screen, syntax error in console, or asset 404s after deploy.
2. **Rollback**:
   - Follow the step-by-step instructions in `docs/DEPLOYMENT_RECOVERY.md`.
3. **Post-Mortem**: Add regression test to prevent recurrence.

---

## 3. Evidence Preservation Protocol
When investigating an incident:
- Export the git log (`git log --stat -n 20 > incident_git_log.txt`).
- Export CI run logs from GitHub Actions.
- **NEVER** save or screenshot actual leaked secret values into incident logs, tickets, or reports. Redact all tokens (`***REDACTED***`).
