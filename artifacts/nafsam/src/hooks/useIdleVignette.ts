import { useEffect } from "react";

const IDLE_AFTER_MS = 4000;

export function useIdleVignette() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let timer: number | null = null;
    const root = document.documentElement;

    const setIdle = () => {
      root.classList.add("is-idle");
    };
    const wake = () => {
      if (root.classList.contains("is-idle")) {
        root.classList.remove("is-idle");
      }
      if (timer) window.clearTimeout(timer);
      timer = window.setTimeout(setIdle, IDLE_AFTER_MS);
    };

    wake();
    window.addEventListener("mousemove", wake, { passive: true });
    window.addEventListener("scroll", wake, { passive: true });
    window.addEventListener("touchstart", wake, { passive: true });
    window.addEventListener("keydown", wake);
    window.addEventListener("pointerdown", wake);

    return () => {
      if (timer) window.clearTimeout(timer);
      root.classList.remove("is-idle");
      window.removeEventListener("mousemove", wake);
      window.removeEventListener("scroll", wake);
      window.removeEventListener("touchstart", wake);
      window.removeEventListener("keydown", wake);
      window.removeEventListener("pointerdown", wake);
    };
  }, []);
}
