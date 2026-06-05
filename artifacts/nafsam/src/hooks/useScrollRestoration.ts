import { useEffect } from "react";

const KEY_PREFIX = "nafsam_scroll_";
const RESTORE_TIMEOUT_MS = 4000;

function readScroll(key: string): number {
  try {
    return Number(sessionStorage.getItem(key) || "0");
  } catch {
    return 0;
  }
}

function writeScroll(key: string, value: number) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // sessionStorage unavailable (private mode / disabled) — ignore.
  }
}

/**
 * Persists and restores the window scroll position per route, surviving full
 * page reloads (e.g. when a memory-constrained mobile browser evicts and
 * reloads the tab while scrolling through heavy media).
 *
 * The browser's native `scrollRestoration` is disabled because it fails on
 * this app: protected media loads asynchronously, so the document height is
 * still small at restore time and the browser drops the viewer back to the
 * top. Instead we retry restoring on each animation frame until the page has
 * grown tall enough to reach the saved offset (or the user starts scrolling).
 */
export default function useScrollRestoration(location: string) {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }

    const key = KEY_PREFIX + location;
    const saved = readScroll(key);

    let rafId = 0;
    let cancelled = false;
    let userInteracted = false;
    const start = performance.now();

    const tryRestore = () => {
      if (cancelled || userInteracted || saved <= 0) return;
      const maxScroll =
        document.documentElement.scrollHeight - window.innerHeight;
      if (maxScroll >= saved) {
        window.scrollTo(0, saved);
        return;
      }
      if (performance.now() - start < RESTORE_TIMEOUT_MS) {
        rafId = requestAnimationFrame(tryRestore);
      } else {
        window.scrollTo(0, Math.max(0, Math.min(saved, maxScroll)));
      }
    };

    if (saved > 0) {
      rafId = requestAnimationFrame(tryRestore);
    } else {
      window.scrollTo(0, 0);
    }

    const cancelRestore = () => {
      userInteracted = true;
    };
    window.addEventListener("wheel", cancelRestore, { passive: true });
    window.addEventListener("touchstart", cancelRestore, { passive: true });
    window.addEventListener("keydown", cancelRestore);

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        writeScroll(key, Math.round(window.scrollY));
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    const persist = () => {
      writeScroll(key, Math.round(window.scrollY));
    };
    window.addEventListener("pagehide", persist);

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      persist();
      window.removeEventListener("wheel", cancelRestore);
      window.removeEventListener("touchstart", cancelRestore);
      window.removeEventListener("keydown", cancelRestore);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("pagehide", persist);
    };
  }, [location]);
}
