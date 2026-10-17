# RIFTBORN — Security Monitoring & Telemetry Guide

## 1. Hosting Platform Telemetry (Free Tier)

Because RIFTBORN is deployed as a static site on GitHub Pages (or alternatively Cloudflare Pages), server-side observability is defined by the static hosting provider:

### 1.1 GitHub Pages Capabilities & Limitations
- **Deployment Logs**: Available in the repository's **Actions** tab (`https://github.com/<owner>/RiftBorn-Combat/actions`). Every build run provides full logs of checkout, dependency installation, security audit (`npm audit`), automated test results, and deployment artifact creation.
- **Traffic Analytics**: Basic traffic metrics (page views, unique visitors, referring sites) are available under `Repository Insights > Traffic`.
- **Limitation**: GitHub Pages does not provide raw real-time HTTP server access logs or edge WAF event logs.

### 1.2 Cloudflare Pages Capabilities (Recommended Alternative)
If deployed on Cloudflare Pages (free plan):
- **Web Analytics**: Real-time visitor counts, geographic distribution, and performance metrics without cookies.
- **DDoS Protection**: Automated Cloudflare edge DDoS mitigation against volumetric attacks.
- **Security Events**: Basic overview of blocked malicious bots and requests.

---

## 2. Detecting Suspicious Activity & Indicators of Compromise (IoC)

### 2.1 Repository & CI Signals
Monitor the following events that could indicate account or pipeline compromise:
1. **Unexpected Workflow Runs**: A deployment run triggered by an unfamiliar user or outside of expected commit schedules.
2. **Commit Signature Anomalies**: Commits pushed without a verified GPG/SSH commit signature.
3. **Workflow Modifications**: Unapproved edits to `.github/workflows/deploy.yml` or changes granting extra token permissions.
4. **Deploy Key / Webhook Additions**: Unfamiliar keys or webhooks added in `Repository Settings > Deploy Keys` or `Webhooks`.

### 2.2 Client-Side Integrity Signals
1. **CSP Violation Reports**: If a CSP reporting endpoint (such as a free report-uri service) is configured in the future, watch for reports of blocked inline scripts or unexpected script sources.
2. **Console Errors**: Regularly test production builds in browser DevTools to ensure no unhandled exceptions disclose internal build paths.

---

## 3. Client-Side Error Sanitization Standards
RIFTBORN implements strict guidelines for browser logging:
1. **No Sensitive Data in Logs**: Never log passwords, tokens, full save snapshots, or personal user data via `console.log` or `console.error`.
2. **Defensive Storage Catching**: In `ProgressionManager.js`, `try/catch` blocks catch storage quotas and parsing errors silently or output clean, generic messages (`"Storage corrupted, resetting default profile"`).
3. **Toast Notifications**: Error toasts displayed to users in the UI via `showToast(msg, 'error')` render sanitized `textContent`, preventing reflected DOM injection from error strings.
