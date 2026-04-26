import { useEffect, useMemo, useRef } from "react";

const HEART_COUNT = 14;

export default function FloatingHearts() {
  const hearts = useMemo(() => {
    return Array.from({ length: HEART_COUNT }, (_, i) => {
      const size = 10 + Math.random() * 18;
      return {
        id: i,
        left: `${Math.random() * 100}vw`,
        size,
        duration: `${22 + Math.random() * 22}s`,
        delay: `${Math.random() * 18}s`,
        drift: `${(Math.random() * 60 - 30).toFixed(1)}px`,
        opacity: 0.10 + Math.random() * 0.18,
        hue: Math.random() > 0.5 ? "rose" : "soft",
      };
    });
  }, []);

  const layerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const layer = layerRef.current;
    if (!layer) return;
    let scrollTimer: number | null = null;
    const onScroll = () => {
      layer.classList.add("is-scrolling");
      if (scrollTimer) window.clearTimeout(scrollTimer);
      scrollTimer = window.setTimeout(() => {
        layer.classList.remove("is-scrolling");
      }, 320);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <div className="floating-hearts" aria-hidden="true" ref={layerRef}>
      {hearts.map((h) => (
        <span
          key={h.id}
          className={`fh fh--${h.hue}`}
          style={
            {
              left: h.left,
              width: `${h.size}px`,
              height: `${h.size}px`,
              animationDuration: h.duration,
              animationDelay: h.delay,
              ["--fh-drift" as string]: h.drift,
              ["--fh-opacity" as string]: h.opacity,
            } as React.CSSProperties
          }
        >
          <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 21s-7.5-4.6-10-9.3C.4 8.5 2.4 4.5 6.2 4.5c2 0 3.6 1.1 4.4 2.7.3.6 1.2.6 1.5 0 .8-1.6 2.4-2.7 4.4-2.7 3.8 0 5.8 4 4.2 7.2C19.5 16.4 12 21 12 21z" />
          </svg>
        </span>
      ))}
    </div>
  );
}
