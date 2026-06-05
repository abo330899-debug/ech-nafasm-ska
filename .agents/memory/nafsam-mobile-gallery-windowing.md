---
name: Nafsam mobile gallery windowing
description: Large media galleries must render progressively or mobile Safari reload-crashes.
---

# Mobile gallery windowing (Nafsam)

The archive has large media sets (e.g. ~245 videos). Rendering every card at
once is what crashed iOS Safari ("A problem repeatedly occurred" → black screen
→ auto-reload) when the user scrolled.

**Rule:** Any gallery page that maps over a large media array (Videos, and
watch Photos too) must render a windowed prefix (`slice(0, visibleCount)`) and
grow it via an IntersectionObserver sentinel near the page bottom, not render
the full list on mount.

**Why:** Each card mounts its own IntersectionObserver (`useReveal`) plus poster
`<img>` nodes. The Videos card renders TWO posters each (blurred bg + fg), so
245 cards = ~490 images on mount — enough to OOM mobile Safari.

**How to apply:**
- Keep the windowing observer effect depending on `visibleCount` so it
  re-observes after each batch bump; otherwise, if the sentinel stays in view,
  the observer won't re-fire and loading stalls (IO fires only on intersection
  *change*).
- Reset `visibleCount` when the data length changes (content load).
- Fall back to rendering the full list if `IntersectionObserver` is undefined.
- Modal/lightbox should index the FULL array, not the slice, so prev/next and
  "X / total" labels stay correct (the slice is a prefix from index 0, so card
  indices already match global indices).
