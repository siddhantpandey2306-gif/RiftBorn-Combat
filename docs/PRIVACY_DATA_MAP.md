# RIFTBORN — Privacy & Data Mapping Architecture

**Application:** RIFTBORN — Combat  
**Architecture:** Client-Side Single Page Web Application (Vite + Vanilla JS)  
**Last Updated:** October 17, 2026  
**Auditor:** Application Security & Privacy-Conscious Developer

---

## 1. Data Processing Architecture Overview
RIFTBORN is designed with an uncompromising **privacy-by-default, local-first** architecture:
- **No Remote User Database:** User accounts, credentials, passwords, and personal records are not collected or transmitted to remote servers.
- **No HTTP Cookies:** The application uses zero HTTP tracking, session, or advertising cookies.
- **No Third-Party Analytics SDKs:** No Google Analytics, Meta Pixel, Hotjar, ByteDance, or telemetry trackers are integrated or bundled.
- **100% Client-Side Persistence:** All player progress, unlocked skins, combat telemetry, settings, and keybindings are stored strictly in the user's browser via the Web Storage API (`localStorage` & `sessionStorage`).

---

## 2. Inventory of Client-Side Storage Keys

| Key | Storage Medium | Type & Structure | Purpose & Data Contained | Lifespan | Deletion Method |
| :--- | :---: | :--- | :--- | :---: | :--- |
| `riftborn_save_data` | `localStorage` | JSON Object | Player level, XP, Rift Shards, Rift Coins, unlocked character skins, mastery stats, combat record (wins/losses), completed story chapters, claimed bounties, and audio settings. | Persistent until cleared | Settings > Clear Data, or Privacy Screen Reset |
| `riftborn_touch_config` | `localStorage` | JSON Object | Ergonomic coordinates, opacity, scale, and toggle state for mobile on-screen touch controls. | Persistent until cleared | Settings > Reset Touch Controls |
| `riftborn_tutorial_completed` | `localStorage` | Boolean (`'true'`) | Flags whether the player has completed the interactive onboarding tutorial. | Persistent until cleared | Settings > Clear Data |
| `riftborn_theme` | `localStorage` | String (`'dark'` \| `'light'`) | User interface theme preference override. | Persistent until cleared | Toggle in navbar, or Clear Data |
| `riftborn_consent` | `localStorage` | JSON Object | Records user acknowledgement of local storage data policies. | Persistent until cleared | Cookie Notice > Manage Preferences |
| `riftborn_utm` | `sessionStorage` | JSON Object | Temporary marketing attribution parameters (`utm_source`, `utm_medium`, `utm_campaign`, `utm_term`, `utm_content`). Never contains personal identifiers. | Session only (purged on tab close) | Browser tab close, or manual clear |

---

## 3. Data Collection Minimization Audit

1. **No Sensitive PII:**
   - No names, physical addresses, phone numbers, email addresses, or dates of birth are requested or collected.
   - Player identifiers (e.g. `OP-7829-VX`) are generated pseudorandomly on the client for local immersion only.
2. **No Deceptive Dark Patterns:**
   - No pre-checked marketing consent checkboxes.
   - No hidden paywalls or simulated payments disguised as actual financial transactions.
   - Free-to-play with zero real-money in-game purchases.

---

## 4. User Rights & Data Control Tools (GDPR / CCPA / CPRA)

Because all data resides exclusively on the user's local device, RIFTBORN provides client-side self-service tools directly in the user interface:

### 4.1 Right of Access & Data Portability (Export)
- **Feature:** "EXPORT LOCAL DATA (JSON)" button on `#screen-privacy` and in Settings.
- **Action:** Generates an immediate UTF-8 JSON file download containing the complete decrypted contents of `riftborn_save_data`.

### 4.2 Right to Erasure / Deletion (Reset)
- **Feature:** "RESET ALL LOCAL DATA" button on `#screen-privacy` and `#screen-profile`.
- **Action:** Prompts the user through `#modal-confirm-dialog`. Upon explicit confirmation, executes `localStorage.clear()`, wiping all progress, settings, and identifiers, followed by an immediate application refresh.

---

## 5. Third-Party Network Connections Audit
When loading RIFTBORN, the client connects to only one external resource provider:
- **Google Fonts (`fonts.googleapis.com` & `fonts.gstatic.com`):** Used to load web fonts (`Bebas Neue`, `Orbitron`, `Inter`, `Oswald`).
  - Google's terms specify font delivery does not set cookies or track authenticated user sessions.
  - *Recommendation for complete offline zero-network isolation:* The owner can optionally download font files locally into `public/fonts/` if an air-gapped deployment is required.
