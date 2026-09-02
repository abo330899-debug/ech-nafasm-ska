import { useEffect, useRef, useState } from "react";

const MOBILE_MEDIA_QUERY = "(max-width: 820px), (pointer: coarse)";
const DESKTOP_DEFAULT_MARGIN = "1000px 0px";
// Keep the first photo rows mounted on iOS even when Safari's
// content-visibility/lazy-layout heuristics are aggressive. The images are
// still native-lazy-loaded by LuxImage, so this only prevents the card itself
// from remaining a permanent placeholder.
const MOBILE_SAFE_MARGIN = "2000px 0px";

function getSafeRootMargin(requested?: string) {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
    return requested ?? DESKTOP_DEFAULT_MARGIN;
  }

  const isMobileLike = window.matchMedia(MOBILE_MEDIA_QUERY).matches;
  return isMobileLike ? MOBILE_SAFE_MARGIN : requested ?? DESKTOP_DEFAULT_MARGIN;
}

/** Mount media when it is close enough to the viewport. */
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
        for (const e of entries) {
          // Once a card has entered the preload window, keep its media mounted.
          // This avoids iOS Safari repeatedly replacing later photo cards with
          // placeholders while scrolling back and forth.
          if (e.isIntersecting) setNear(true);
        }
      },
      { root: null, rootMargin },
    );

    io.observe(el);
    return () => io.disconnect();
  }, [options?.rootMargin]);

  return { ref, near };
}
