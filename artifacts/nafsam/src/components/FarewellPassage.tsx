import { Fragment, useEffect, useMemo, useRef, useState } from "react";

interface Props {
  startDelayMs?: number;
  title: string;
  paragraphs: string[];
  silverAnchor: string;
  memoryPattern: string;
  dir?: "ltr" | "rtl";
  lang?: string;
}

function buildSegment(text: string, prefix: string, memoryRegex: RegExp | null) {
  if (!text) return null;
  if (!memoryRegex) return text;
  const parts: React.ReactNode[] = [];
  let lastIdx = 0;
  let match: RegExpExecArray | null;
  memoryRegex.lastIndex = 0;
  while ((match = memoryRegex.exec(text)) !== null) {
    if (match.index > lastIdx) {
      parts.push(
        <Fragment key={`${prefix}-t-${lastIdx}`}>
          {text.slice(lastIdx, match.index)}
        </Fragment>,
      );
    }
    parts.push(
      <span key={`${prefix}-m-${match.index}`} className="memory-word">
        {match[0]}
      </span>,
    );
    lastIdx = match.index + match[0].length;
    if (match[0].length === 0) memoryRegex.lastIndex += 1;
  }
  if (lastIdx < text.length) {
    parts.push(
      <Fragment key={`${prefix}-t-end-${lastIdx}`}>
        {text.slice(lastIdx)}
      </Fragment>,
    );
  }
  return parts;
}

export default function FarewellPassage({
  startDelayMs = 1100,
  title,
  paragraphs,
  silverAnchor,
  memoryPattern,
  dir = "rtl",
  lang = "ar",
}: Props) {
  const TITLE = title;
  const BODY = useMemo(() => paragraphs.join("\n\n"), [paragraphs]);
  const memoryRegex = useMemo(() => {
    if (!memoryPattern) return null;
    try {
      return new RegExp(`(${memoryPattern})`, "gi");
    } catch {
      return null;
    }
  }, [memoryPattern]);

  const [titleCount, setTitleCount] = useState(0);
  const [bodyCount, setBodyCount] = useState(0);
  const [titleDone, setTitleDone] = useState(false);
  const [bodyDone, setBodyDone] = useState(false);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setTitleCount(0);
    setBodyCount(0);
    setTitleDone(false);
    setBodyDone(false);
    setStarted(false);
    if (typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setTitleCount(TITLE.length);
      setBodyCount(BODY.length);
      setTitleDone(true);
      setBodyDone(true);
      return;
    }
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setStarted(true);
          io.disconnect();
        }
      },
      { threshold: 0.1 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [TITLE, BODY]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    let t: number;
    const tick = () => {
      i += 1;
      setTitleCount(i);
      if (i >= TITLE.length) {
        setTitleDone(true);
        return;
      }
      const ch = TITLE.charAt(i - 1);
      const isLong = /[\.؟!?]/.test(ch);
      const isMid = /[،؛:\-—…]/.test(ch);
      const delay = isLong ? 480 : isMid ? 280 : ch === " " ? 60 : 80 + Math.random() * 50;
      t = window.setTimeout(tick, delay);
    };
    t = window.setTimeout(tick, startDelayMs);
    return () => window.clearTimeout(t);
  }, [started, startDelayMs, TITLE]);

  useEffect(() => {
    if (!titleDone) return;
    let i = 0;
    let t: number;
    const tick = () => {
      i += 1;
      setBodyCount(i);
      if (i >= BODY.length) {
        setBodyDone(true);
        return;
      }
      const ch = BODY.charAt(i - 1);
      const isPara = ch === "\n";
      const isLong = /[\.؟!?]/.test(ch);
      const isMid = /[،؛:\-—…]/.test(ch);
      const isComma = /[,]/.test(ch);
      let delay = 60 + Math.random() * 55;
      if (isPara) delay = 900;
      else if (isLong) delay = 720;
      else if (isMid) delay = 380;
      else if (isComma) delay = 280;
      else if (ch === " ") delay = 50;
      t = window.setTimeout(tick, delay);
    };
    t = window.setTimeout(tick, 700);
    return () => window.clearTimeout(t);
  }, [titleDone, BODY]);

  const visibleTitle = TITLE.slice(0, titleCount);
  const visibleBody = BODY.slice(0, bodyCount);
  const silverStart = silverAnchor ? BODY.indexOf(silverAnchor) : -1;
  const hasSilver = silverStart >= 0 && bodyCount > silverStart;
  const normalText = hasSilver ? visibleBody.slice(0, silverStart) : visibleBody;
  const silverText = hasSilver ? visibleBody.slice(silverStart) : "";

  return (
    <div
      ref={ref}
      className={`farewell-block ${titleDone ? "title-done" : ""} ${bodyDone ? "body-done" : ""}`}
      lang={lang}
      dir={dir}
    >
      <h2 className={`farewell-title ${titleDone ? "is-done" : ""}`}>
        <span className="ft-text">{visibleTitle}</span>
        {!titleDone && <span className="ft-caret" aria-hidden="true" />}
      </h2>
      <p className={`farewell-passage ${bodyDone ? "is-done" : ""} ${started ? "has-started" : ""}`}>
        <span className="fp-text">{buildSegment(normalText, "n", memoryRegex)}</span>
        {hasSilver && (
          <span className="fp-text fp-silver">{buildSegment(silverText, "s", memoryRegex)}</span>
        )}
        {titleDone && !bodyDone && <span className="fp-caret" aria-hidden="true" />}
      </p>
    </div>
  );
}
