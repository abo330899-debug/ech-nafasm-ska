import { useEffect, useState } from "react";

interface Props {
  text: string;
  className?: string;
  speedMs?: number;
}

export default function TypewriterTitle({ text, className = "", speedMs = 110 }: Props) {
  const [count, setCount] = useState(0);
  const [done, setDone] = useState(false);

  useEffect(() => {
    setCount(0);
    setDone(false);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setCount(text.length);
      setDone(true);
      return;
    }
    let i = 0;
    let timer: number;
    const tick = () => {
      i += 1;
      setCount(i);
      if (i >= text.length) {
        setDone(true);
        return;
      }
      const ch = text.charAt(i - 1);
      const isPunct = /[\.,!?؛،:\-—…]/.test(ch);
      const isSpace = ch === " ";
      const jitter = 40 + Math.random() * 90;
      const delay = isPunct ? speedMs * 4 : isSpace ? speedMs * 0.55 : speedMs + jitter;
      timer = window.setTimeout(tick, delay);
    };
    timer = window.setTimeout(tick, 320);
    return () => window.clearTimeout(timer);
  }, [text, speedMs]);

  const visible = text.slice(0, count);

  return (
    <h1 className={`hero-title typewriter ${done ? "is-done" : ""} ${className}`} aria-label={text}>
      <span className="tw-text">{visible}</span>
      <span className="tw-caret" aria-hidden="true" />
    </h1>
  );
}
