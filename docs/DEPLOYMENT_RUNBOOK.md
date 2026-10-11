# RIFTBORN — Production Deployment Runbook

## 1. Overview & Architecture Summary
RIFTBORN is a client-side Single Page Application (SPA). The build process compiles and minifies standard ES modules and CSS assets into a single static distribution directory (`dist/`).

- **Build Output Directory**: `dist/`
- **Output Files**:
  - `dist/index.html` (Entry HTML)
  - `dist/assets/index-[hash].js` (Bundled JavaScript)
  - `dist/assets/index-[hash].css` (Bundled CSS)
  - `dist/manifest.webmanifest` (PWA Manifest)

---

## 2. Pre-Deployment Verification Commands
Run these verified commands locally or in CI/CD pipelines before deploying to production:

```bash
# 1. Clean installation of dependencies
npm ci

# 2. Dependency security audit (Must return 0 vulnerabilities)
npm audit

# 3. Execute automated test suite (Combat prototype + Round system)
npm test

# 4. Compile production distribution
npm run build
```

---

## 3. Deployment Targets & Configuration

### Option A: GitHub Pages
1. Build the production bundle:
   ```bash
   npm run build
   ```
2. Deploy the `dist/` directory to the `gh-pages` branch using `gh-pages` CLI or GitHub Actions workflow.
3. Configure **Settings -> Pages -> Custom Domain / Enforce HTTPS** in the GitHub repository settings.

### Option B: Cloudflare Pages / Vercel / Netlify
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Node Version**: 18.x or 20.x
- **Environment Variables**: None required.

#### Netlify Configuration (`_headers` file in `public/` or `dist/`):
```http
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: camera=(), microphone=(), geolocation=()
  Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';
```

---

## 4. Post-Deployment Smoke Test Protocol
Immediately following a deployment, verify these checkpoints on the live production URL:
1. **HTTP -> HTTPS Redirect**: Ensure unencrypted HTTP requests redirect to HTTPS automatically.
2. **Asset Loading**: Open Developer Tools -> Network tab. Confirm `index.html`, hashed `.js`, and hashed `.css` load with HTTP status `200` (or `304`).
3. **Console Hygiene**: Confirm `0` JavaScript console errors or warnings appear on initial load.
4. **Gameplay Smoke Test**:
   - Click "Play Now" -> Select Fighter -> Select Arena -> Launch Match.
   - Execute Light Attack (`J`), Heavy Attack (`K`), Dodge (`Space`), Block (`Shift`).
   - Confirm Canvas renders at 60 FPS without stutter.
   - Confirm Web Audio API synthesizes attack sounds upon first user interaction.
5. **Mobile Landscape Test**:
   - Switch to Mobile Emulation mode or test on a physical mobile device in landscape.
   - Confirm virtual D-Pad stick and action buttons are visible and responsive.

---

## 5. Rollback Procedure
Because RIFTBORN is purely static files:
- **Cloudflare / Vercel / Netlify**:
  1. Open the hosting provider dashboard -> Deployments.
  2. Locate the previous successful deployment commit.
  3. Click **Instant Rollback / Re-deploy**. Deployment takes under 15 seconds.
- **Git / GitHub Pages**:
  1. Revert the bad commit on the main or deploy branch:
     ```bash
     git revert HEAD --no-edit
     git push origin main
     ```
  2. Re-trigger the build and deployment pipeline.

---

## 6. Monitoring & Health Indicators
- **Static Availability**: Configure an uptime monitor (e.g., UptimeRobot, BetterUptime) pinging the `index.html` URL every 5 minutes.
- **Client Error Monitoring**: If desired for future expansion, integrate a lightweight client error tracker (e.g., Sentry) wrapped around `window.onerror`.
