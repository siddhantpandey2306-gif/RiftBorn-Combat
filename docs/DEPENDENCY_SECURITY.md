# RIFTBORN — Dependency & Supply-Chain Security Audit

## 1. Dependency Inventory & Manifest Inspection
The project's dependency manifest ([package.json](file:///c:/Users/siddh/OneDrive/Rift%20Born/package.json)) and lockfile ([package-lock.json](file:///c:/Users/siddh/OneDrive/Rift%20Born/package-lock.json)) were audited.

### Direct Dependencies
RIFTBORN maintains an ultra-lean dependency profile:
- **Production Dependencies (`dependencies`)**:
  - `canvas-confetti` (^1.9.4): Lightweight, widely audited celebration particle library used exclusively on victory screens.
- **Development Dependencies (`devDependencies`)**:
  - `vite` (^8.3.2): Official Vite frontend development server and bundler.

### Transitive Dependencies
All transitive packages resolve through the official public npm registry (`https://registry.npmjs.org/`). Zero git URLs, HTTP links, or third-party untrusted tarball sources were detected.

---

## 2. Vulnerability Assessment (`npm audit`)
An automated vulnerability assessment was conducted against all direct and transitive dependencies:

```bash
$ npm audit
found 0 vulnerabilities
```

- **Critical Vulnerabilities**: 0
- **High Vulnerabilities**: 0
- **Moderate Vulnerabilities**: 0
- **Low Vulnerabilities**: 0

---

## 3. Supply-Chain & Lifecycle Script Verification
- **Install Scripts**: Neither `package.json` nor its direct dependencies declare arbitrary `preinstall`, `postinstall`, or lifecycle execution scripts that execute remote binaries or scripts during installation.
- **Reproducible Installs**: The repository maintains a valid, clean `package-lock.json` committed to version control, ensuring deterministic installations via `npm ci` across local machines and GitHub Actions CI.

---

## 4. Automated CI Supply-Chain Guardrail
To prevent the accidental introduction of vulnerable dependencies in future commits, the CI workflow ([.github/workflows/deploy.yml](file:///c:/Users/siddh/OneDrive/Rift%20Born/.github/workflows/deploy.yml)) includes an enforced automated security audit step:

```yaml
- name: Install dependencies
  run: npm ci

- name: Security audit
  run: npm audit --audit-level=high

- name: Run automated test suite
  run: npm test
```

If a package with a `high` or `critical` severity CVE is introduced, the workflow will automatically fail and block the deployment.

---

## 5. Repeatable Audit Procedure for Developers
Before committing dependency updates or adding new libraries, run:
```bash
# 1. Clean installation matching lockfile
npm ci

# 2. Check for known CVEs
npm audit

# 3. Verify production build integrity
npm run build

# 4. Verify combat engine tests
npm test
```
