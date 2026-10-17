# RIFTBORN — Production Deployment & Release Checklist

**Application:** RIFTBORN — Combat  
**Target Environment:** Static Web Hosting (GitHub Pages, Cloudflare Pages, Vercel, or Netlify)  
**Last Updated:** October 17, 2026  
**Auditor:** Senior DevOps & QA Engineer

---

## 1. Pre-Deployment Verification Matrix

Before triggering a production deployment, all items below must be verified:

| Check | Command / Verification | Expected Result | Status |
| :--- | :--- | :--- | :---: |
| **Unit & Logic Tests** | `npm test` | 66/66 tests pass (Combat prototype 39/39, Round system 27/27) | PASS |
| **Production Build** | `npm run build` | Vite finishes under 1 second with 0 errors, emitting `dist/` | PASS |
| **Static 404 Page** | Check `404.html` and `public/404.html` | File exists with cyberpunk theme, home link, and responsive layout | PASS |
| **Favicon & Assets** | Check `public/favicon.svg` | Scalable vector icon linked in `<head>` | PASS |
| **Robots & Sitemap** | Check `public/robots.txt` & `public/sitemap.xml` | Valid directives and canonical URLs | PASS |
| **Responsive Viewports** | Puppeteer multi-viewport suite | No horizontal overflow across mobile (375px), tablet (768px), desktop (1440px) | PASS |
| **Storage & Privacy** | Verify `localStorage` handling | Zero cookies, functional JSON export, confirm dialog on data wipe | PASS |

---

## 2. Build Pipeline Details

1. **Install dependencies:**
   ```bash
   npm ci
   ```
2. **Execute Automated Combat & Engine Test Suites:**
   ```bash
   npm test
   ```
3. **Generate Production Bundle:**
   ```bash
   npm run build
   ```
   *Output Directory:* `dist/` containing `index.html`, `404.html`, `favicon.svg`, `robots.txt`, `sitemap.xml`, and optimized JS/CSS chunks under `dist/assets/`.

4. **Local Smoke Testing with Preview Server:**
   ```bash
   npm run preview
   ```

---

## 3. Platform-Specific Deployment Guides

### A. GitHub Pages (Current Repository)
1. Verify `vite.config.js` has appropriate base path (e.g. `base: './'` or `base: '/RiftBorn-Combat/'`).
2. Push changes to branch `main`.
3. In GitHub Repository Settings -> **Pages**:
   - Source: **Deploy from a branch** or **GitHub Actions**.
   - Branch: `gh-pages` / folder `/ (root)`, or configure standard Vite GitHub Action to build and deploy `dist/`.
4. Ensure custom `404.html` is in the deployment root so deep links or direct refresh requests fallback gracefully.

### B. Cloudflare Pages / Vercel / Netlify
1. Connect Git repository.
2. Build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Node.js version: `>= 18.0.0`
3. Single-Page App (SPA) redirect rule (for Netlify `_redirects`: `/* /index.html 200`).

---

## 4. Post-Deployment Smoke Test Protocol

Once the production deployment is live:
1. **Initial Load:** Visit root URL, verify theme loads without flash (FOUC), verify logo emblem and title.
2. **Navigation:** Click each navbar link (HOME, FIGHT, FIGHTERS, RANK, PROFILE, STORY).
3. **Mobile Drawer:** Open hamburger menu on narrow viewport (<768px), verify navigation buttons work, click backdrop or Escape to close.
4. **Theme Toggle:** Click the theme toggle icon. Verify dark and light themes switch smoothly and persist upon browser reload.
5. **Search Dialog:** Press `Ctrl+K` (or click search button). Type "Vex" or "Parry", verify results filter accurately and navigate on click.
6. **Combat Execution:** Click "FIGHT" -> "QUICK BATTLE" -> Choose Vex vs Solaris -> Verify round announcements, health bars, player movement, attacks, combos, and sound effects execute with smooth 60 FPS.
7. **Orientation Prompt:** On mobile portrait, verify the "CONTINUE BROWSING IN PORTRAIT" button dismisses overlay for browsing, and rotating to landscape activates the full combat viewport.
8. **Legal Screens:** Open footer links (Privacy Policy, Terms of Service, Cookie Notice), test JSON export and confirmation dialog.
9. **404 Route:** Navigate to `/non-existent-sector` and verify the custom 404 anomaly screen renders with a functional return to home button.

---

## 5. Rollback Procedures
- **Git Rollback:**
  ```bash
  git revert HEAD
  git push origin main
  ```
- **Static Host Rollback:** If using Cloudflare Pages, Vercel, or Netlify, navigate to the Deployments tab and click "Rollback to this deployment" on the previous green build.
