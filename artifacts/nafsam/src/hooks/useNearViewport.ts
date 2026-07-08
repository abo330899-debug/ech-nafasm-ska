import { useEffect, useRef, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 820px), (pointer: coarse)";
const DESKTOP_DEFAULT_MARGIN = "1000px 0px";
const MOBILE_SAFE_MARGIN = "250px 0px";

function getSafeRootMargin(requested?: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return requested ?? DESKTOP_DEFAULT_MARGIN;
  }

  // Mobile Safari/Chrome can evict and reload the tab when too many off-screen
  // thumbnails are decoded at once. Keep only media very close to the viewport
  // mounted on phones/tablets, even if a page asks for a large preload margin.
  const isMobileLike = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  return isMobileLike ? MOBILE_SAFE_MARGIN : requested ?? DESKTOP_DEFAULT_MARGIN;
}

/**
 * Tracks whether an element is near the viewport so callers can mount heavy
 * media only while it is close, and UNMOUNT it once it scrolls far away.
 *
 * Why this matters on mobile: windowing limits how many cards exist, but the
 * window only grows — every full-resolution image that has scrolled past stays
 * decoded in memory. iOS Safari / Android Chrome have a hard decoded-bitmap
 * budget, so a long scroll through the photo album or video gallery eventually
 * exceeds it and the browser evicts and reloads the tab ("the page refreshes
 * and reopens"). Removing an off-screen `<img>` from the DOM lets the browser
 * reclaim its decoded bitmap, capping memory to roughly a viewport's worth.
 *
 * Unlike CSS `content-visibility` (only honoured on Safari 18+), this works on
 * every browser that has IntersectionObserver. When IO is unavailable (SSR /
 * very old browsers) it defaults to `true` so media always renders.
 *
 * The host element must keep a stable size when its image is unmounted (e.g. a
 * fixed `aspect-ratio` box) so the placeholder holds the slot and the page does
 * not jump while scrolling.
 */
export default function useNearViewport<T extends HTMLElement = HTMLElement>(
  options?: { rootMargin?: string },
) {
  const ref = useRef<T | null>(null);
  const [near, setNear] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setNear(true);
      return;
    }

    const rootMargin = getSafeRootMargin(options?.rootMargin);
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) setNear(e.isIntersecting);
      },
      { root: null, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options?.rootMargin]);

  return { ref, near };
}
