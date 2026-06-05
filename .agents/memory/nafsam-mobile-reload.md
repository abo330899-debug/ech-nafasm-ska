---
name: Nafsam mobile "scroll → reload → jump to top"
description: Why heavy-media pages reload on mobile mid-scroll and the two-part fix that holds.
---

# Mobile reload-on-scroll (returns to top)

Symptom reported by user: scrolling far down a media page (photos/videos) makes the
page "refresh" and jump back to the top — classic iOS Safari / Android Chrome tab
eviction under memory pressure, NOT an explicit `location.reload` (there is none in
the code).

**Why it returns to top specifically:** the browser's native `history.scrollRestoration`
("auto") tries to restore on reload, but Nafsam loads protected media asynchronously
via `/api/private/*`, so document height is still small at restore time → the browser
can't reach the saved offset → drops to top.

## The fix (two parts, both required)

1. **Survive the reload** — `src/hooks/useScrollRestoration.ts`, wired in `App.tsx`
   `AppContent` keyed on wouter `location`. Sets `scrollRestoration = "manual"`,
   saves `scrollY` per-route in `sessionStorage`, and restores via a `requestAnimationFrame`
   retry loop that waits until the page has grown tall enough (async media), with a
   timeout fallback and cancellation on first user input. Wrap all `sessionStorage`
   access in try/catch (private-mode browsers throw).

2. **Prevent the eviction** — `content-visibility:auto` + `contain-intrinsic-size` on
   off-screen `.album-grid .photo-card` and `.gallery-grid .video-card` in `index.css`,
   so the browser can skip rendering and release decoded thumbnails. This is the actual
   root-cause mitigation; restoration alone only hides the symptom.

**Why:** memory-pressure eviction can't be fully prevented from JS, so do both — cut
memory so it happens rarely, and restore position so it's harmless when it does.

**How to apply:** any new long media list should get the same `content-visibility`
treatment; scroll restoration is global so new routes are covered automatically.
