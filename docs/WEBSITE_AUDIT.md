# RIFTBORN — Comprehensive Website Audit Report

**Date:** October 17, 2026  
**Auditor:** Senior Frontend, Accessibility, SEO & Security Engineering Review  
**Project:** RIFTBORN — Original 2D Competitive Fighting Game  
**Repository:** [https://github.com/siddhantpandey2306-gif/RiftBorn-Combat](https://github.com/siddhantpandey2306-gif/RiftBorn-Combat)  
**Target Standard:** Production Readiness, WCAG 2.2 AA Accessibility, Modern Mobile UX, Privacy Compliance  

---

## Executive Summary

RIFTBORN is an in-browser 2D competitive fighting game engineered with vanilla JavaScript ES modules, HTML5 Canvas rendering (`ArenaRenderer.js`, `CharacterRenderer.js`, `ParticleSystem.js`), Web Audio API sound synthesis, and a custom physics and combat engine (`Fighter.js`, `CombatSystem.js`, `GameEngine.js`).

The project contains working core gameplay, character roster selection with live canvas previews, ranked telemetry, progression ladders, and story dialogues. However, the application wrapper currently lacks essential public launch infrastructure: there is no light/dark theme switch, no mobile hamburger navigation drawer for sub-pages, no global footer, no legal or privacy policies, no print stylesheet, no search utility, no skip link, and insufficient WCAG 2.2 AA focus indicators.

---

## 1. Inventory of Existing Architecture

| Category | Details / Findings | Status |
| :--- | :--- | :--- |
| **Framework & Build** | Vite v8.3.2, vanilla JS ES modules, Node.js test runners (`test_combat_prototype.js`, `test_round_system.js`), Puppeteer-core testing scripts. | Confirmed |
| **Routing / Screens** | Single-Page Application (SPA) using DOM section visibility (`.screen.active`). 14 main screens: `screen-home`, `screen-character-select`, `screen-progression`, `screen-play`, `screen-characters`, `screen-character-details`, `screen-casual-setup`, `screen-ranked-setup`, `screen-story`, `screen-rewards`, `screen-profile`, `screen-leaderboard`, `screen-inventory`, `screen-settings`, plus `game-view` (combat arena). | Confirmed |
| **Navigation** | Desktop top header (`#navbar`) with 6 primary links and utility controls; Mobile bottom bar (`#mobile-bottom-nav`) with 5 buttons. Missing mobile drawer for remaining screens (Story, Guide, Bounties, Settings, Legal). | Confirmed |
| **Modals & Dialogs** | Move List Guide (`#modal-movelist-guide`), Touch Customizer (`#modal-touch-customizer`), Match Results (`#modal-match-results`), Challenges Hub (`#modal-challenges-hub`), Season Reset (`#modal-season-reset`), Story Dialogue (`#modal-story-dialogue`), In-Combat Pause (`#pause-modal`). | Confirmed |
| **Theme System** | Single light combat UI stylesheet (`--bg-main: #F4F6F8`) with dark arena canvas; no dark mode toggle or CSS theme switching tokens. | Confirmed |
| **Data Storage** | Strictly client-side `localStorage`: `riftborn_save_data`, `riftborn_touch_config`, `riftborn_tutorial_completed`. No cookies, no external telemetry or tracking SDKs. | Confirmed |
| **Forms & Inputs** | No standard `<form>` tags. Input elements limited to volume and touch scaling range sliders (`<input type="range">`). | Confirmed |
| **External Assets** | Google Fonts (`Bebas Neue`, `Inter`, `Orbitron`, `Oswald`). No external image assets or CDN dependencies; all fighters and arenas are procedurally rendered on Canvas. | Confirmed |

---

## 2. Detailed Audit Findings & Action Plan

### Finding 1: Absence of Dark Mode & Centralized Theme Switching
* **Component Affected:** `style.css`, `index.html`, `src/main.js`
* **Severity:** High
* **Details:** The visual design uses light neutral surfaces (`#F4F6F8`), while the game canvas, meta `theme-color`, and orientation prompts use dark futuristic styling (`#0A0D14`). Users cannot toggle between light and dark modes, and `prefers-color-scheme` is unhandled.
* **Proposed Fix:** Implement a centralized CSS token system supporting `[data-theme="dark"]` and `[data-theme="light"]`, add a theme toggle button to header and mobile drawer, and persist preference in `localStorage` (`riftborn_theme`) with automatic OS fallback.
* **Status:** Confirmed.

### Finding 2: Inaccessible Mobile Navigation & Missing Secondary Routes on Small Screens
* **Component Affected:** `index.html`, `style.css`, `src/main.js`
* **Severity:** High
* **Details:** On screens `<= 768px`, the top `.nav-links` are hidden (`display: none`). The mobile bottom nav only accommodates 5 destinations (HOME, FIGHT, FIGHTERS, RANK, PROFILE). Secondary views like STORY, GUIDE, BOUNTIES, SETTINGS, and SEARCH cannot be navigated to cleanly without deep linking or returning home.
* **Proposed Fix:** Add an accessible mobile navigation hamburger button (`#btn-mobile-menu`), a slide-out drawer (`#mobile-nav-drawer`) with keyboard focus trapping, Escape key listener, background scroll lock, and touch backdrop.
* **Status:** Confirmed.

### Finding 3: Missing Global Site Footer, Copyright & Legal Routes
* **Component Affected:** `index.html`, `style.css`
* **Severity:** High
* **Details:** There is no `<footer>` element in `index.html`. Users have no way to inspect project attribution, current copyright year (2026), privacy practices, terms of service, cookie information, or repository links.
* **Proposed Fix:** Build a responsive, accessible global footer with links to Home, Fighters, Story, Guide, Privacy Policy, Terms, Cookie Notice, and GitHub repository.
* **Status:** Confirmed.

### Finding 4: Lack of Content Search / Command Palette
* **Component Affected:** `index.html`, `src/main.js`, `style.css`
* **Severity:** Medium
* **Details:** Users cannot search through the 6 characters, combat abilities, arenas, story chapters, or setting controls.
* **Proposed Fix:** Add an accessible search modal (`#modal-site-search`) with input filter, keyboard navigation (Arrow Up/Down, Enter, Escape, `Ctrl/Cmd+K` shortcut), and instant jump to matching screen sections.
* **Status:** Confirmed.

### Finding 5: WCAG 2.2 AA Accessibility & Focus Indicator Deficits
* **Component Affected:** `index.html`, `style.css`
* **Severity:** High
* **Details:**
  - No skip-to-content navigation link.
  - `#btn-nav-brand` is a `<div>` instead of a semantic `<button>` or `<a>`.
  - Icon-only buttons lack descriptive `aria-label`s.
  - Global focus rings are missing (only 3 `:focus-visible` rules exist across 7,500 lines of CSS).
  - Modal dialogs lack `role="dialog"` and `aria-modal="true"`.
  - Blocking browser `alert()` is used in season reset and touch settings.
* **Proposed Fix:** Add skip-link, convert brand logo to semantic interactive element, add universal `:focus-visible` outline styles, add ARIA dialog semantics, and implement a custom accessible Toast Notification system.
* **Status:** Confirmed.

### Finding 6: Missing SEO, Social Metadata, Favicon Variants & 404 Handling
* **Component Affected:** `index.html`, `public/`, `404.html`
* **Severity:** Medium
* **Details:**
  - Title and meta description do not update when switching SPA views.
  - Open Graph (`og:*`) and Twitter Card tags are absent.
  - `robots.txt` and `sitemap.xml` are missing from `public/`.
  - Favicon is a data URI with no dedicated SVG/PNG files or touch icon references.
  - No custom 404 page for direct URL fallbacks.
* **Proposed Fix:** Implement dynamic document title and meta description updates on screen change, add Open Graph meta tags, create `public/robots.txt`, `public/sitemap.xml`, high-res SVG and PNG favicon files, and create `404.html`.
* **Status:** Confirmed.

### Finding 7: Missing Utilities (Back-to-Top, Scroll Progress, Copy Button, FAQ)
* **Component Affected:** `index.html`, `style.css`, `src/main.js`
* **Severity:** Medium
* **Details:** Scrollable long screens lack a scroll progress indicator and quick back-to-top button. No one-click copy button exists for user player IDs or battle invite codes. No accessible FAQ accordion exists for gameplay questions.
* **Proposed Fix:** Implement scroll progress bar (`#scroll-progress-bar`), back-to-top floating button (`#btn-back-to-top`), clipboard copy buttons with visual confirmation, and an expandable FAQ accordion in the Guide/Info section.
* **Status:** Confirmed.

### Finding 8: Missing Print Stylesheet
* **Component Affected:** `style.css`
* **Severity:** Low
* **Details:** Printing the website outputs raw navigation headers, canvas placeholders, and overlapping backgrounds.
* **Proposed Fix:** Add a `@media print` section in `style.css` formatting text content, typography, hiding buttons and canvas overlays, and ensuring readable black-on-white printouts.
* **Status:** Confirmed.

### Finding 9: Campaign Tracking & Privacy Data Governance
* **Component Affected:** `src/main.js`, `docs/PRIVACY_DATA_MAP.md`
* **Severity:** Medium
* **Details:** Inbound UTM parameters (`utm_source`, `utm_medium`, `utm_campaign`) are not captured or cleaned, and no explicit privacy documentation exists explaining local storage data usage.
* **Proposed Fix:** Implement lightweight, privacy-preserving UTM capture into `sessionStorage` without third-party transmission, provide a cookie/storage transparency banner with Manage Preferences, and document all data storage in `docs/PRIVACY_DATA_MAP.md`.
* **Status:** Confirmed.

---

## 3. Verification Matrix

| Verification Check | Method | Target Result |
| :--- | :--- | :--- |
| **Combat Prototype Tests** | `node test_combat_prototype.js` | 39/39 Passing |
| **Round System Tests** | `node test_round_system.js` | 27/27 Passing |
| **Production Build** | `npm run build` | Zero build errors, clean Vite bundles |
| **Visual & Viewports** | Puppeteer multi-viewport scripts | Responsive across 320px, 375px, 768px, 1024px, 1440px |
| **Accessibility** | Keyboard Tab & Enter traversal, ARIA validation | Full focus trapping, visible focus, WCAG 2.2 AA compliant |
