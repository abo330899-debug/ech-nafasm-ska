import { useMemo } from "react";

export default function Rain() {
  const drops = useMemo(() => {
    return Array.from({ length: 110 }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      duration: `${0.7 + Math.random() * 0.9}s`,
      delay: `${Math.random() * 2}s`,
      opacity: 0.08 + Math.random() * 0.18,
    }));
  }, []);

  return (
    <div className="rain">
      {drops.map((d) => (
        <div
          key={d.id}
          className="drop"
          style={{
            left: d.left,
            animationDuration: d.duration,
            animationDelay: d.delay,
            opacity: d.opacity,
          }}
        />
      ))}
    </div>
  );
}
