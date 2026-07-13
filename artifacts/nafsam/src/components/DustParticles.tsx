import { useEffect, useMemo, useRef } from "react";

const COUNT = 14;

export default function DustParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const size = 1.2 + Math.random() * 2.2;
      const isGlow = Math.random() > 0.78;
      return {
        id: i,
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
        size,
        duration: `${34 + Math.random() * 34}s`,
        delay: `${Math.random() * 24}s`,
        driftX: `${(Math.random() * 60 - 30).toFixed(1)}px`,
        driftY: `${(-24 - Math.random() * 46).toFixed(1)}px`,
        opacity: 0.14 + Math.random() * 0.24,
        glow: isGlow,
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
      }, 380);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (scrollTimer) window.clearTimeout(scrollTimer);
    };
  }, []);

  return (
    <div className="dust-layer" aria-hidden="true" ref={layerRef}>
      {particles.map((p) => (
        <span
          key={p.id}
          className={`dust ${p.glow ? "dust--glow" : ""}`}
          style={
            {
              left: p.left,
              top: p.top,
              width: `${p.size}px`,
              height: `${p.size}px`,
              animationDuration: p.duration,
              animationDelay: p.delay,
              ["--dx" as string]: p.driftX,
              ["--dy" as string]: p.driftY,
              ["--dust-op" as string]: p.opacity,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
