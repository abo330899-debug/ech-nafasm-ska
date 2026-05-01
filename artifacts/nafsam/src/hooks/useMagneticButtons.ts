import { useEffect } from "react";

const RADIUS = 90;
const MAX_PULL = 9;
const LERP = 0.18;

interface Tracked {
  el: HTMLElement;
  cx: number;
  cy: number;
  w: number;
  h: number;
  tx: number;
  ty: number;
  cx_t: number;
  cy_t: number;
  near: boolean;
}

export function useMagneticButtons() {
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(hover: none)").matches) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    let mouseX = -9999;
    let mouseY = -9999;
    let tracked: Tracked[] = [];

    const collect = () => {
      const nodes = document.querySelectorAll<HTMLElement>(
        ".btn, .login-btn, .lang-mini button, .nav-link.cta",
      );
      tracked = Array.from(nodes).map((el) => {
        const r = el.getBoundingClientRect();
        return {
          el,
          cx: r.left + r.width / 2,
          cy: r.top + r.height / 2,
          w: r.width,
          h: r.height,
          tx: 0,
          ty: 0,
          cx_t: 0,
          cy_t: 0,
          near: false,
        };
      });
    };

    const measure = () => {
      tracked.forEach((t) => {
        const r = t.el.getBoundingClientRect();
        t.cx = r.left + r.width / 2;
        t.cy = r.top + r.height / 2;
        t.w = r.width;
        t.h = r.height;
      });
    };

    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    };

    const tick = () => {
      tracked.forEach((t) => {
        const dx = mouseX - t.cx;
        const dy = mouseY - t.cy;
        const dist = Math.hypot(dx, dy);
        const reach = RADIUS + Math.max(t.w, t.h) / 2;

        if (dist < reach) {
          const strength = 1 - dist / reach;
          t.cx_t = (dx / reach) * MAX_PULL * strength;
          t.cy_t = (dy / reach) * MAX_PULL * strength;
          if (!t.near) {
            t.near = true;
            t.el.classList.add("is-magnetic");
          }
        } else {
          t.cx_t = 0;
          t.cy_t = 0;
          if (t.near) {
            t.near = false;
            t.el.classList.remove("is-magnetic");
          }
        }

        t.tx += (t.cx_t - t.tx) * LERP;
        t.ty += (t.cy_t - t.ty) * LERP;

        if (Math.abs(t.tx) < 0.04 && Math.abs(t.ty) < 0.04 && !t.near) {
          t.el.style.removeProperty("--mag-x");
          t.el.style.removeProperty("--mag-y");
        } else {
          t.el.style.setProperty("--mag-x", `${t.tx.toFixed(2)}px`);
          t.el.style.setProperty("--mag-y", `${t.ty.toFixed(2)}px`);
        }
      });
      raf = requestAnimationFrame(tick);
    };

    collect();
    raf = requestAnimationFrame(tick);
    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("scroll", measure, { passive: true });
    window.addEventListener("resize", () => {
      collect();
    });

    const mo = new MutationObserver(() => {
      collect();
    });
    mo.observe(document.body, { childList: true, subtree: true });

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("scroll", measure);
      mo.disconnect();
      tracked.forEach((t) => {
        t.el.classList.remove("is-magnetic");
        t.el.style.removeProperty("--mag-x");
        t.el.style.removeProperty("--mag-y");
      });
    };
  }, []);
}
