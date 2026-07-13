import { useMemo } from "react";

const DROP_COUNT = 48;

export default function Rain() {
  const drops = useMemo(() => {
    return Array.from({ length: DROP_COUNT }, (_, i) => ({
      id: i,
      left: `${Math.random() * 100}vw`,
      duration: `${0.9 + Math.random() * 1.1}s`,
      delay: `${Math.random() * 2}s`,
      opacity: 0.06 + Math.random() * 0.14,
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
