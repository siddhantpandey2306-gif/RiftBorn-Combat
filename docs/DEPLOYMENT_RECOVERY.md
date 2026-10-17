# RIFTBORN — Deployment Recovery & Rollback Procedure

## 1. Overview
This runbook provides emergency instructions to restore RIFTBORN to a verified working state in the event of a broken build, regression, or unauthorized deployment.

---

## 2. Emergency Rollback Options

### Option A: Clean Git Revert (Recommended)
This method preserves full audit history and works seamlessly with GitHub Actions CI/CD.

```bash
# 1. Fetch latest changes from remote
git fetch origin

# 2. View recent commit history to identify the last known good commit
git log --oneline -n 10

# 3. Create a revert commit that undoes the bad commit
git revert <bad-commit-sha> --no-edit

# 4. Verify local build and test suite
npm ci
npm test
npm run build

# 5. Push the revert commit to trigger automated CI redeployment
git push origin main
```

### Option B: Immediate GitHub Actions Re-deployment (Zero Code Change)
If the bad deployment was caused by transient CDN caching or network corruption:
1. Go to `https://github.com/siddhantpandey2306-gif/RiftBorn-Combat/actions/workflows/deploy.yml`.
2. Click **Run workflow** > Select branch `main` > Click the green **Run workflow** button.
3. Monitor the build and verify that all stages (`npm ci`, `npm audit`, `npm test`, `npm run build`, `deploy`) pass.

---

## 3. Post-Rollback Verification Checklist

Perform these verification steps immediately following any redeployment:

1. **HTTP Status Check**: Visit the live URL in an incognito/private browser window:
   ```bash
   curl -I https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/
   # Verify HTTP 200 OK
   ```
2. **Console Verification**:
   - Open Developer Tools (`F12` > Console).
   - Ensure zero unhandled exceptions, zero CSP violation reports, and zero 404s on script/CSS/font assets.
3. **Core Gameplay Smoke Test**:
   - Navigate to **FIGHT** > Select Vex vs. Solaris.
   - Confirm Canvas 2D loads and renders smoothly at 60 FPS.
   - Execute Light attack (J), Heavy attack (K), and Special ability (U).
   - Verify that health bars update and audio plays properly.
4. **Mobile Layout Check**:
   - Toggle Device Toolbar (`Ctrl+Shift+M` / `Cmd+Shift+M`) to iPhone or Android viewport.
   - Verify zero horizontal bleed and that the landscape orientation button functions correctly.

---

## 4. Local Backup & Offline Restoration
Because RIFTBORN has no remote database, the complete application state consists of:
- **Source Code**: Cloned via Git (`git clone https://github.com/siddhantpandey2306-gif/RiftBorn-Combat.git`).
- **Release Tags**: Ensure production releases are tagged with semver git tags (e.g., `git tag -a v1.0.0 -m "Production Launch v1.0.0"`).
- **Player Save Data**: Handled entirely client-side via `ProgressionManager.exportSaveData()`, which downloads a local JSON snapshot. Players can restore their state at any time via the in-game Settings > Import Save feature.
