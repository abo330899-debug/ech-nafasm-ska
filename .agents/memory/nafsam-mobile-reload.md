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

## When ALL the above still reloads — unmount off-screen images (the decisive fix)

Windowing only ever GROWS; every full-res image you scroll past stays decoded, so a
deep scroll still exceeds the iOS bitmap budget. `content-visibility:auto` is only
honoured on Safari 18+, so it does not save older iPhones. The fix that actually
holds: **mount the heavy `<img>` only while its card is near the viewport and unmount
it (replace with an equal-size placeholder) once it scrolls far away** — removing the
node lets the browser reclaim the decoded bitmap, capping memory to ~a viewport's worth.

- Hook: `src/hooks/useNearViewport.ts` — two-way IntersectionObserver (NOT one-shot
  like `useReveal`), `rootMargin ~1200px`, defaults `near=true` when IO/SSR missing so
  it degrades to "always render", never blank.
- Put the observer ref on the **fixed-aspect media box** (`.photo-card-media` 4/5,
  `.v-thumb` 16/10), never on a zero-size wrapper, so it always has height to observe
  and the placeholder holds the slot (no scroll jump). Reuse existing placeholder
  markup (`lux-img-wrap`/`lux-img-placeholder`, `v-thumb-fallback`).
- Applied in `Photos.tsx` (extracted `SpecialCard`+`AlbumCard`) and `Videos.tsx`
  (`Thumb`). Initial `near=false` only costs a one-frame placeholder flash for
  above-the-fold images — acceptable, and required (init `true` would mass-mount on
  first paint and re-OOM).
- Also halve video poster decodes on phones: render only ONE poster `<img>` per card
  (drop the blurred `.v-thumb-bg` duplicate) gated on `max-width:820px`.

## The decisive byte-shrink: downscaled grid thumbnails (DEPLOYED)

When unmount-off-screen STILL reloaded on low-memory iPhones, the lever that finally
held was cutting decoded-bitmap *bytes*: the Photos album loaded ~168 full-res webp
(avg 1.8MP, ~23MB) into the grid. Now the grid renders downscaled thumbnails
(max 800px long-edge, q72 ≈ 14MB total) and full-res loads **only** in the lightbox.

- Generate with `pnpm --filter @workspace/scripts run gen-thumbnails` (sharp; walks
  `api-server/private/images`, writes `private/images/_thumbs/<rel>` same name/ext,
  skips `_thumbs`). `private/` is gitignored, so thumbs are NOT committed — they must
  be uploaded to R2 for the static/Cloudflare site.
- Upload with `pnpm --filter @workspace/scripts run upload-thumbs-to-r2` (needs
  `CLOUDFLARE_API_TOKEN`; PUTs to bucket `media` key prefix `images/_thumbs`). The
  static site then serves `${VITE_R2_BASE}/images/_thumbs/<rel>`. For VM/dev the same
  files serve via the authed `/api/private/images/_thumbs/...` route automatically.
- Wiring: `r2.ts imageThumbUrl(rel)=imageUrl('_thumbs/'+rel)`, `privateAssets.ts
  privateImageThumb`, `LuxImage` gained a `fallbackSrc` prop (onError swaps thumb→full
  once, no loop). Cards display `src={thumb} fallbackSrc={full}`; `onOpen`/lightbox keep
  full `src`; prefetch + `nextSrc` use thumbs.

**Why:** windowing + unmount cap how many bitmaps live at once, but on the lowest-memory
iPhones even one viewport of multi-MP webp can exceed budget; shrinking per-image bytes
is the last independent lever and it stacks with the others.
**How to apply:** any new heavy media grid must show thumbnails, never full-res. After
adding/replacing private images, re-run gen-thumbnails AND upload-thumbs-to-r2 or the
static site 404s the thumb (LuxImage will fall back to full-res, re-introducing the OOM).

## Fast fling up/down still reloading → mobile mount settle window

Even with windowing + unmount-off-screen + thumbnails deployed, a violent fling
up-then-down made dozens of cards cross the small mobile mount margin in under a
second; each mounted, fetched, and decoded before unmounting — the decode burst
outran the browser's bitmap reclaim and evicted the tab.

Fix in `useNearViewport`: on mobile only, "near" flips true 160ms AFTER the
element enters the margin; leaving before the timer fires cancels it, so cards
that merely fly past never mount their image. Leaving always unmounts immediately
and cancels pending timers. Desktop stays immediate.

**Why:** mount churn during direction-change flings re-introduces the decode
pressure all other levers remove; a settle delay filters the fastest passes.
**How to apply:** keep the delay ≤~200ms or slow scrollers see placeholder
pop-in. If reloads STILL recur, next lever (per architect): a global
scroll-velocity gate — suppress all setNear(true) while window scroll velocity
is high, flush pending on scrollend/quiet period.
