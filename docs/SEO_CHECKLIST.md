# RIFTBORN — Technical SEO & Discoverability Checklist

**Application:** RIFTBORN — Combat  
**Domain / Canonical Base:** `https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/`  
**Last Updated:** October 17, 2026  
**Auditor:** Senior SEO & Frontend Engineer

---

## 1. Metadata & HTML Head Infrastructure

| Item | Configuration | Status | Verified In |
| :--- | :--- | :---: | :--- |
| **Document Title** | Unique, brand-aligned titles dynamically managed per screen (`RIFTBORN — Combat \| ...`) | PASS | `src/main.js` `updatePageMetadata()` |
| **Meta Description** | Accurate summary of core gameplay, fighters, and lore without keyword stuffing | PASS | `index.html` & `src/main.js` |
| **Canonical Link** | Explicit canonical tag pointing to root GitHub Pages deployment | PASS | `index.html` `<link rel="canonical">` |
| **Viewport Tag** | Responsive viewport with `viewport-fit=cover` and dynamic scaling control | PASS | `index.html` line 5 |
| **Theme Color** | Dynamic `<meta name="theme-color">` synchronized with active dark/light mode | PASS | Inlined head script & `setupThemeSystem()` |
| **Web App Manifest** | PWA manifest linked via `/manifest.webmanifest` | PASS | `public/manifest.webmanifest` |

---

## 2. Favicon & Visual Assets

| Asset | Path & Format | Specifications | Status |
| :--- | :--- | :--- | :---: |
| **Standard Favicon** | `public/favicon.svg` | Scalable vector graphic, dark badge with crimson rift shard & cyber core | PASS |
| **Apple Touch Icon** | `public/favicon.svg` | Maskable 128×128 icon reference for iOS Home Screen shortcuts | PASS |
| **PWA Manifest Icons**| `data:image/svg+xml` | Fallback inline SVG icons for standalone display mode | PASS |

---

## 3. Social Sharing & Rich Previews (Open Graph & Twitter Cards)

| Property | Value | Status |
| :--- | :--- | :---: |
| `og:title` | `RIFTBORN — Original Competitive Fighting Game` | PASS |
| `og:description` | `Channel unique energy cores and master futuristic competitive combat in this browser-based fighting game.` | PASS |
| `og:type` | `website` | PASS |
| `og:url` | `https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/` | PASS |
| `og:image` | `https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/favicon.svg` | PASS |
| `twitter:card` | `summary_large_image` | PASS |
| `twitter:title` | `RIFTBORN — Original Competitive Fighting Game` | PASS |
| `twitter:description`| `Channel unique energy cores and master futuristic competitive combat in this browser-based fighting game.` | PASS |
| `twitter:image` | `https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/favicon.svg` | PASS |

---

## 4. Crawling & Indexing Directives

1. **`robots.txt` (`public/robots.txt`):**
   - User-agent: `*`
   - Allow: `/`
   - Explicit Sitemap declaration: `Sitemap: https://siddhantpandey2306-gif.github.io/RiftBorn-Combat/sitemap.xml`
2. **`sitemap.xml` (`public/sitemap.xml`):**
   - Enumerates canonical home page, fighter select, story mode, move list, privacy policy, terms of service, and cookie policy.
   - Includes `lastmod` (2026-10-17) and reasonable `changefreq` indicators.
3. **Custom 404 Handler (`404.html` & `public/404.html`):**
   - Styled to match the dark cyberpunk RIFTBORN aesthetic.
   - Explains sector anomaly cleanly without dead ends.
   - Directs users back to base navigation (`/`) or character select.

---

## 5. Structured Heading Hierarchy & Semantic Markup

- Every screen features a primary `<h1>` element (e.g. `RIFTBORN COMBAT SIMULATOR`, `WARRIOR ROSTER`, `TACTICAL ARCHIVES`, `LEGAL COMPLIANCE`).
- Sectional sub-headers strictly progress `h1 -> h2 -> h3` without skipping levels.
- Replaced non-semantic clickable divs with native `<button>` and `<a>` elements for crawlers and assistive technology.

---

## 6. Action Items for Project Owner at Launch
- [ ] Connect custom domain (if purchased, e.g. `riftborn.io` or `playriftborn.com`) and update `sitemap.xml` and `robots.txt` canonical URLs accordingly.
- [ ] Submit `sitemap.xml` to Google Search Console and Bing Webmaster Tools once public DNS is live.
- [ ] Capture an in-game high-resolution 1200×630px PNG screenshot (e.g. `og-banner.png`) to supplement the vector favicon for Open Graph preview platforms.
