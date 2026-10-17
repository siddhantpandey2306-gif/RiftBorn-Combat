# RIFTBORN — Accessibility Compliance Checklist (WCAG 2.2 AA)

**Audited Application:** RIFTBORN — Combat (Browser-based Fighting Game)  
**Standard:** WCAG 2.2 Level AA  
**Last Updated:** October 17, 2026  
**Auditor:** Senior Frontend & Accessibility Specialist

---

## 1. Executive Summary
RIFTBORN has undergone a comprehensive accessibility audit and refactor to bring the UI/UX into compliance with WCAG 2.2 Level AA. As an arcade-style, canvas-driven fighting game, accessibility is addressed at two distinct levels:
1. **Application Shell & UI:** Menus, navigation, dossier, story codex, move list, settings, legal screens, search modal, and dialogs adhere to strict semantic HTML, visible focus states, screen reader semantics, and keyboard operability.
2. **Combat Canvas:** Canvas-based rendering includes visual cues (vignettes, screen flashes, particle bursts) coupled with multi-sensory feedback (synthesized web audio sound effects, health bar percentage indicators, and pause accessibility).

---

## 2. WCAG 2.2 AA Principle Breakdown

### Principle 1: Perceivable

| Criterion | Level | Status | Implementation Details & Proof |
| :--- | :---: | :---: | :--- |
| **1.1.1 Non-text Content** | A | PASS | All informative icons have accessible labels (e.g. `aria-label="RIFTBORN Home Screen"`, `aria-label="Open Search (Ctrl+K)"`, `aria-label="Toggle Light/Dark Theme"`). Decorative canvas graphics and icons use `aria-hidden="true"`. |
| **1.3.1 Info and Relationships** | A | PASS | Semantic `<header>`, `<nav>`, `<main>`, `<footer>`, `<dialog role="dialog">`, and proper heading hierarchy (`<h1>`, `<h2>`, `<h3>`) established across all screens. |
| **1.3.2 Meaningful Sequence** | A | PASS | DOM order mirrors visual presentation: skip-link -> navbar -> screen container -> footer -> modal overlays -> toast container. |
| **1.3.3 Sensory Characteristics** | A | PASS | Combat cues combine audio cues, visual floaters, particle effects, and numeric HUD bars (vitality & energy percentages). |
| **1.3.4 Orientation** | AA | PASS | Portrait mobile users are provided with a dedicated dismissible button ("CONTINUE BROWSING IN PORTRAIT") allowing full menu and lore exploration in portrait, with rotation guidance for combat. |
| **1.4.1 Use of Color** | A | PASS | Statuses, buttons, and badges use distinct shapes, text labels, and icons (e.g., toast types have distinct glyphs: `✓`, `⚠`, `ℹ`). |
| **1.4.3 Contrast (Minimum)** | AA | PASS | Text contrast meets 4.5:1 minimum against both dark (`#0B0E14`) and light (`#F4F6F8`) surfaces. Focus rings use high-visibility cyan (`#00F0FF`). |
| **1.4.4 Resize Text** | AA | PASS | Typography utilizes CSS `clamp()` and relative `rem` units, allowing 200% zoom without horizontal clipping or broken layouts. |
| **1.4.11 Non-text Contrast** | AA | PASS | Input borders, buttons, and active tabs meet 3:1 contrast against adjacent backgrounds. |

---

### Principle 2: Operable

| Criterion | Level | Status | Implementation Details & Proof |
| :--- | :---: | :---: | :--- |
| **2.1.1 Keyboard** | A | PASS | Every interactive button, tab, search dialog, modal, and drawer is fully operable via `Tab`, `Shift+Tab`, `Enter`, and `Space`. |
| **2.1.2 No Keyboard Trap** | A | PASS | Modals and mobile drawers trap focus internally while open and release cleanly upon pressing `Escape` or clicking close/backdrop. |
| **2.1.4 Character Key Shortcuts** | A | PASS | Search modal shortcut `Ctrl+K` requires a modifier key, preventing conflict with alphanumeric text entry. |
| **2.4.1 Bypass Blocks** | A | PASS | Skip-to-content link (`#skip-link`) is the very first element in the DOM, becoming visibly positioned upon keyboard focus. |
| **2.4.2 Page Titled** | A | PASS | Document title dynamically updates upon screen transitions (`updatePageMetadata(screenId)`). |
| **2.4.3 Focus Order** | A | PASS | Logical tab progression maintained; focus restores to triggering element upon modal closure. |
| **2.4.7 Focus Visible** | AA | PASS | Universal `:focus-visible` outline (`2px solid #00F0FF` with `outline-offset: 3px`) applies across buttons, inputs, links, and cards. |
| **2.5.3 Label in Name** | A | PASS | Accessible names match or contain visible text strings for all buttons and navigation anchors. |
| **2.5.8 Target Size (Minimum)** | AA | PASS | Mobile touch targets adhere to minimum 44×44px or 48×48px interactive boundaries with adequate spacing. |

---

### Principle 3: Understandable

| Criterion | Level | Status | Implementation Details & Proof |
| :--- | :---: | :---: | :--- |
| **3.1.1 Language of Page** | A | PASS | `<html lang="en">` explicitly defined in `index.html`. |
| **3.2.1 On Focus** | A | PASS | Focusing an element never triggers an unexpected context change or screen transition. |
| **3.2.2 On Input** | A | PASS | Changing settings or search query inputs updates the local view predictably without abrupt page reloads. |
| **3.3.1 Error Identification** | A | PASS | Toast messages and validation errors announce specific failure reasons (e.g. "Not enough Rift Shards!"). |
| **3.3.2 Labels or Instructions** | A | PASS | All inputs (search, filter, customizer sliders) include clear labels or `aria-label` attributes. |
| **3.3.4 Error Prevention (Legal/Data)**| AA | PASS | Destructive actions (season finalization, local storage reset) require explicit confirmation via `#modal-confirm-dialog`. |

---

### Principle 4: Robust

| Criterion | Level | Status | Implementation Details & Proof |
| :--- | :---: | :---: | :--- |
| **4.1.2 Name, Role, Value** | A | PASS | Interactive components utilize native HTML5 elements (`<button>`, `<a>`, `<input>`) augmented with ARIA roles (`role="dialog"`, `role="tab"`, `aria-selected`, `aria-expanded`). |
| **4.1.3 Status Messages** | AA | PASS | Toasts and feedback use `aria-live="polite"` and `aria-atomic="true"` on `#toast-container`. |

---

## 3. Motion & Cognitive Considerations
- **`prefers-reduced-motion`:** Audited in `style.css` lines 8460-8480. All ambient floaters, glowing pulsations, and scanlines are disabled or subdued when user prefers reduced motion.
- **Combat Flashes:** Can be toggled or disabled via the Visual Settings tab in Options.
- **Auditory Cues:** Audio Engine features individual sliders for Master Volume, SFX Volume, and UI Cues, enabling users with auditory sensitivities to customize sound balance.

---

## 4. Manual Verification & Follow-Up Items for Owner
1. **Screen Reader Testing:** Verified with NVDA on Windows and VoiceOver on macOS/iOS. Ensure screen readers announce dynamic combat announcements during live matches if live narration is desired.
2. **Physical Gamepad Testing:** The game supports standard XInput/DirectInput controllers for fighting matches; verify button mapping on custom third-party accessibility controllers.
