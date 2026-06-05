---
name: Nafsam mobile gallery windowing
description: Large media galleries must render progressively or mobile Safari reload-crashes.
---

# Mobile gallery windowing (Nafsam)

The archive has large media sets (e.g. ~245 videos). Rendering every card at
once is what crashed iOS Safari ("A problem repeatedly occurred" → black screen
→ auto-reload) when the user scrolled.

**Rule:** Any gallery page that maps over a large media array must render a
windowed prefix (`slice(0, visibleCount)`) and grow it via an IntersectionObserver
sentinel near the page bottom, not render the full list on mount. This applies to
every long media grid in the app (both the videos gallery and the photos album),
and to any new one added later — an un-windowed long grid is the cause of the
"scroll down → reload → jump to top" mobile failure.

**Why:** Each card mounts its own IntersectionObserver (`useReveal`) plus poster
`<img>` nodes. The Videos card renders TWO posters each (blurred bg + fg), so
245 cards = ~490 images on mount — enough to OOM mobile Safari.

**How to apply:**
- The windowing observer effect must be STABLE — depend only on
  `videosData.length`, NOT on `visibleCount`. Recreating the observer on every
  batch bump re-`observe()`s the still-visible sentinel, and IO always delivers
  an immediate initial callback for an already-intersecting target → that
  cascades every batch in one tick, loads the whole list, and re-OOMs mobile
  Safari (page "reloads/restarts" on scroll). A stable observer fires once per
  real intersection; each batch of tall cards pushes the sentinel out of the
  600px margin so the next scroll re-triggers it (no stall in practice).
- Reset `visibleCount` when the data length changes (content load).
- Fall back to rendering the full list if `IntersectionObserver` is undefined.
- Modal/lightbox should index the FULL array, not the slice, so prev/next and
  "X / total" labels stay correct (the slice is a prefix from index 0, so card
  indices already match global indices).
