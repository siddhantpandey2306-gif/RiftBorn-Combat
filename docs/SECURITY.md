# Security Policy

## 1. Supported Versions
We actively maintain and provide security patches for the latest release version of RIFTBORN.

| Version | Supported          |
| ------- | ------------------ |
| 1.0.x   | :white_check_mark: |
| < 1.0.0 | :x:                |

---

## 2. Reporting a Vulnerability
If you discover a security vulnerability within RIFTBORN, please do **NOT** open a public GitHub issue. 

Instead, report the vulnerability responsibly via private email:
- **Email**: `siddhantpandey2306@gmail.com`
- **Subject**: `[SECURITY] RIFTBORN Vulnerability Report — <Brief Description>`

### Please include in your report:
1. Detailed description of the vulnerability.
2. Reproduction steps, proof-of-concept (PoC), or screenshots.
3. Potential impact on users or deployments.
4. Suggested remediation or mitigation if known.

### Response Timetable:
- **Initial Acknowledgment**: Within 48 hours.
- **Triage & Assessment**: Within 5 business days.
- **Remediation & Patch Release**: Within 14 business days depending on complexity.

---

## 3. Recommended Hosting Security Headers
When deploying RIFTBORN to static hosting providers (Cloudflare Pages, Netlify, Vercel, Nginx, Apache), configure the following HTTP response headers:

```http
# Strict Content Security Policy
Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob:; connect-src 'self';

# MIME type sniffing prevention
X-Content-Type-Options: nosniff

# Clickjacking mitigation
X-Frame-Options: DENY

# Referrer Policy
Referrer-Policy: strict-origin-when-cross-origin

# Permissions Policy (Disable unneeded device hardware)
Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=()

# Force HTTPS transport security
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

---

## 4. Secret & Dependency Auditing Protocol
- **Zero Secrets**: RIFTBORN contains zero embedded API keys, client secrets, passwords, or authentication tokens.
- **Automated Audit**: Run `npm audit` before each release to ensure 0 critical or high vulnerabilities exist across the dependency tree.
