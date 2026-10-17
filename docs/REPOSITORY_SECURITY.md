# RIFTBORN — Repository & CI/CD Security Guide

## 1. Source Confidentiality vs. Public Browser Delivery
A critical distinction in web application security:
- **Public vs. Private Repository**: Keeping the GitHub repository private protects source code comments, internal commit messages, issue discussions, and planning docs from public viewing.
- **Client-Side Code Visibility**: If the game is publicly deployed and playable in the browser, the compiled JavaScript, CSS, HTML, and audio/image assets are **necessarily delivered to every player's browser**. An attacker or player can always inspect, decompile, or modify client-side assets in browser developer tools regardless of whether the GitHub repository is public or private.
- **Security Rule**: Never rely on repository privacy as a substitute for keeping secrets out of frontend code.

---

## 2. GitHub Account & Access Hardening Checklist

| Security Control | Recommended Configuration | Status |
|:---|:---|:---:|
| **Two-Factor Authentication (2FA)** | Require hardware FIDO2/WebAuthn security key or authenticator app (TOTP). Avoid SMS 2FA. | **NEEDS MANUAL ACTION** |
| **Passkeys** | Configure a biometric passkey (TouchID, Windows Hello) for phishing-resistant logins. | **NEEDS MANUAL ACTION** |
| **Personal Access Tokens (PAT)** | Audit active tokens at `GitHub Settings > Developer Settings > Personal access tokens`. Use fine-grained tokens with minimal scopes and short expiration dates (<= 90 days). Revoke unused legacy PATs. | **NEEDS MANUAL ACTION** |
| **Authorized OAuth Apps** | Review `GitHub Settings > Applications > Authorized OAuth Apps` and revoke third-party services that are no longer actively required. | **NEEDS MANUAL ACTION** |
| **Collaborator Permissions** | Ensure the repository has zero unneeded outside collaborators with `Write` or `Admin` privileges. Adhere to least privilege. | **NEEDS MANUAL ACTION** |

---

## 3. Branch Protection Recommendations (`main`)
For repositories on supported GitHub plans (GitHub Free for public repositories, or GitHub Pro/Team for private repositories), enable branch protection on the `main` production branch:

1. **Navigate to**: `Repository Settings > Branches > Add branch protection rule` (Target: `main`).
2. **Require a pull request before merging**:
   - Check *Require approvals* (at least 1 review).
   - Check *Dismiss stale pull request approvals when new commits are pushed*.
3. **Require status checks to pass before merging**:
   - Require `build` (which runs `npm audit`, `npm test`, and `npm run build`).
4. **Require branches to be up to date before merging**.
5. **Restrict force pushes**: Check *Do not allow force pushes* (enforces append-only immutable history).
6. **Restrict deletions**: Check *Do not allow deletions*.
7. **Code Owners**: Create a `CODEOWNERS` file if collaborating across multiple contributors to require explicit sign-off on changes to `.github/workflows/` and core security headers.

---

## 4. GitHub Actions CI/CD Security Audit

### 4.1 Token Permissions Principle of Least Privilege
The deployment workflow ([.github/workflows/deploy.yml](file:///c:/Users/siddh/OneDrive/Rift%20Born/.github/workflows/deploy.yml)) explicitly enforces minimal token permissions:

```yaml
permissions:
  contents: read      # Read-only access to repository files
  pages: write         # Authority to deploy to GitHub Pages
  id-token: write      # Required for OpenID Connect (OIDC) authentication
```
By explicitly specifying these granular scopes, GitHub Actions automatically revokes default broad write permissions (such as package publishing, pull request modifications, or repository administration).

### 4.2 Untrusted Pull Request Protection
- The deployment workflow is scoped exclusively to `push: branches: [main]` and manual `workflow_dispatch`.
- It does **not** trigger on `pull_request_target`, preventing fork pull requests from gaining access to secrets or deploying unauthorized code to the production environment.

### 4.3 Pinned Third-Party Actions
All third-party actions used in CI are from verified GitHub core repositories and pinned to major version tags with immutable releases:
- `actions/checkout@v4`
- `actions/setup-node@v4`
- `actions/upload-pages-artifact@v3`
- `actions/deploy-pages@v4`

### 4.4 Automated Dependency Gate
Every CI build automatically executes `npm audit --audit-level=high` before running tests and building the production bundle. If a high or critical CVE is detected, deployment is immediately aborted.
