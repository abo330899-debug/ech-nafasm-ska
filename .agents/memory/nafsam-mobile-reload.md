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

2. **Prevent the eviction** — the proven root-cause fix is *windowing* the long
   grids (see nafsam-mobile-gallery-windowing.md): render a `slice(0, visibleCount)`
   grown by a stable IntersectionObserver sentinel so hundreds of cards/observers/
   `<img>` nodes don't mount at once. The Photos album grid was the remaining
   un-windowed list. As a complementary memory cut, `content-visibility:auto` +
   `contain-intrinsic-size` is applied to off-screen `.album-grid .photo-card` and
   `.gallery-grid .video-card` in `index.css`.

**Why:** memory-pressure eviction can't be fully prevented from JS, so do both — cut
memory so it happens rarely, and restore position so it's harmless when it does.

**How to apply:** any new long media list should get the same `content-visibility`
treatment; scroll restoration is global so new routes are covered automatically.

## When windowing alone still reloads on fast scroll

Windowing + content-visibility + lazy/async images were ALL deployed and the user
*still* reported fast-scroll reload on iOS. Three further memory cuts that helped,
all low-risk:
- **Kill the ahead-of-scroll prefetch on phones.** `LuxImage`'s `nextSrc` warms the
  next 1-2 full-res images on every load; on a fast scroll this runaway chain piles
  up decoded bitmaps. Gate that effect on `matchMedia("(max-width:820px)")` /
  `navigator.connection.saveData` so phones never prefetch ahead. This is the single
  biggest remaining win because it fights the very memory the windowing saves.
- **Smaller windowing batches + tighter rootMargin** (videos 18→9, photos 12→8;
  rootMargin 600px→400px) so fewer heavy cards mount per scroll burst.
- **Bigger `contain-intrinsic-size`** (video 320→460px, photo 420→560px) so
  off-screen placeholders better match real card height and the page doesn't jump.
**Why:** the prefetch chain and oversized batches re-introduce the exact decoded-image
pressure windowing is meant to remove; on iOS the decoded-bitmap budget is the limit.
