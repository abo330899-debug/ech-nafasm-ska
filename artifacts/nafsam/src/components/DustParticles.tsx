import { useEffect, useMemo, useRef } from "react";

const COUNT = 36;

export default function DustParticles() {
  const particles = useMemo(() => {
    return Array.from({ length: COUNT }, (_, i) => {
      const size = 1.2 + Math.random() * 2.4;
      const isGlow = Math.random() > 0.7;
      return {
        id: i,
        left: `${Math.random() * 100}vw`,
        top: `${Math.random() * 100}vh`,
        size,
        duration: `${28 + Math.random() * 32}s`,
        delay: `${Math.random() * 24}s`,
        driftX: `${(Math.random() * 90 - 45).toFixed(1)}px`,
        driftY: `${(-30 - Math.random() * 60).toFixed(1)}px`,
        opacity: 0.18 + Math.random() * 0.35,
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
