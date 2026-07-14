---
name: Nafsam index.css cascade traps
description: Duplicate mobile media blocks in nafsam index.css silently override earlier edits; how to verify CSS changes actually win, and how to visually check auth-gated pages.
---

**Rule:** `artifacts/nafsam/src/index.css` (~5800 lines) contains MULTIPLE `@media (max-width:768px)` blocks for the same luxe pages (e.g. an early "MOBILE-FIRST POLISH" block ~line 1630 AND a late "Videos luxe — 2-up grid" block ~line 3119). Equal-specificity rules in the LATER block win. Editing only the early block produces dead CSS that ships but does nothing.

**Why:** A videos-grid redesign (3/4 → 1/1 thumbs) edited the early block; architect review caught that the late block still said 3/4 and the change was inert in production. Same trap with `.v-thumb-fg{object-fit:contain}` in the base (~line 2439) beating a media-query override placed earlier in the file (media queries add no specificity). Also `mobile-performance.css` is imported AFTER index.css in main.tsx, so its equal-specificity rules (e.g. contain-intrinsic-size) win over index.css.

**How to apply:**
- Before editing a `.videos-luxe`/`.photos-luxe` rule, grep ALL occurrences of the selector and edit the last-in-cascade one (or all of them consistently).
- Verify by grepping the BUILT minified bundle for rule ORDER, not mere presence; the minifier may rewrite declarations (e.g. `inset:auto;top:50%;left:50%` → `inset:50% auto auto 50%`).
- Visual check for auth-gated pages: drop a static HTML harness + the built CSS into `artifacts/mockup-sandbox/public/` (use RELATIVE hrefs — root-relative escapes the sandbox base path and 502s), restart the sandbox workflow, screenshot at 390px. Delete harness files afterwards.
- Fixed bug (keep fixed): the centered play button rule must declare `inset:auto` BEFORE `top:50%;left:50%`, or inset resets them and the button lands cut-off in the card's top corner.
