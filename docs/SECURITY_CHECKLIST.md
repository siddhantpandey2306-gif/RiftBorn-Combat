# RIFTBORN — Pre-Launch Security Checklist

This checklist must be reviewed before deploying RIFTBORN to public production.

| Item | Control Description | Status | Verification / Notes |
|:---:|:---|:---:|:---|
| **1** | **No Leaked Secrets in Source** | **PASS** | Grep and secret scan confirmed 0 credentials, tokens, or private keys in working tree. |
| **2** | **No Leaked Secrets in Git History** | **PASS** | Deep commit log audit (`git log -p -G`) confirmed clean history. |
| **3** | **Environment Files Ignored** | **PASS** | `.gitignore` contains strict patterns for `.env*`, `*.pem`, `*.key`, `*.cert`. Safe `.env.example` created. |
| **4** | **No Secret Vite Frontend Variables** | **PASS** | Confirmed zero sensitive data exposed in `VITE_*` variables. |
| **5** | **No Production Source Maps** | **PASS** | `vite.config.js` sets `sourcemap: false`. Build emits no `.map` files. |
| **6** | **Dependency Audit Clean** | **PASS** | `npm audit` returns 0 vulnerabilities across all packages. |
| **7** | **CI Dependency Security Gate** | **PASS** | `deploy.yml` runs `npm audit --audit-level=high` before tests. |
| **8** | **Minimal CI Token Permissions** | **PASS** | `deploy.yml` explicitly declares least privilege (`contents: read`, `pages: write`, `id-token: write`). |
| **9** | **Content Security Policy (CSP)** | **PASS** | Strict CSP deployed (`script-src 'self'`). Inlined script extracted to `src/theme-init.js`. |
| **10** | **Security Headers Configured** | **PASS** | `public/_headers` created with `nosniff`, `SAMEORIGIN`, `strict-origin-when-cross-origin`, and `Permissions-Policy`. |
| **11** | **DOM XSS & Input Sanitization** | **PASS** | `escapeHtml()` utility added. `showToast` uses safe `textContent`. Profile fields clamped and sanitized. |
| **12** | **Automated Tests Passing** | **PASS** | 66/66 combat and match flow tests passing cleanly (`npm test`). |
| **13** | **Production Build Succeeds** | **PASS** | `npm run build` generates clean minified bundle in `dist/`. |
| **14** | **Browser Layout & Controls Verified** | **PASS** | Puppeteer automated verification confirms mobile/desktop layout and orientation fix. |
| **15** | **Incident Response Runbook** | **PASS** | `docs/INCIDENT_RESPONSE.md` and `docs/DEPLOYMENT_RECOVERY.md` created. |
| **16** | **Server-Side Authentication & Session Security** | **NOT APPLICABLE** | Pure client-side static game; no backend exists. |
| **17** | **Database & SQL Injection Protection** | **NOT APPLICABLE** | No database or remote data store used. |
| **18** | **CORS & Backend API Protection** | **NOT APPLICABLE** | No custom HTTP API endpoints exist. |
| **19** | **Payment Gateway Integration Security** | **NOT APPLICABLE** | No real-money cosmetic transactions exist in this release. |
| **20** | **GitHub Account 2FA / Passkey** | **NEEDS MANUAL ACTION** | Owner must ensure 2FA or Passkey is active on GitHub account. |
| **21** | **GitHub Personal Access Token Audit** | **NEEDS MANUAL ACTION** | Owner must review and revoke unused legacy PATs and OAuth apps. |
| **22** | **Main Branch Protection Rules** | **NEEDS MANUAL ACTION** | Owner must enable PR reviews and required status checks in GitHub repo settings. |
| **23** | **Production Domain & HTTPS Enforced** | **NEEDS MANUAL ACTION** | Verify "Enforce HTTPS" is checked in GitHub Pages settings. |
