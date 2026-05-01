import { useState, useEffect, useRef } from "react";

interface TypedTextProps {
  phrases: string[];
}

export default function TypedText({ phrases }: TypedTextProps) {
  const [text, setText] = useState("");
  const phraseIndex = useRef(0);
  const charIndex = useRef(0);
  const deleting = useRef(false);
  const phrasesRef = useRef(phrases);
  phrasesRef.current = phrases;

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    function tick() {
      const current = phrasesRef.current[phraseIndex.current];
      if (!current) return;

      if (!deleting.current) {
        setText(current.substring(0, charIndex.current + 1));
        charIndex.current++;
        if (charIndex.current === current.length) {
          deleting.current = true;
          timeout = setTimeout(tick, 1200);
          return;
        }
      } else {
        setText(current.substring(0, charIndex.current - 1));
        charIndex.current--;
        if (charIndex.current === 0) {
          deleting.current = false;
          phraseIndex.current =
            (phraseIndex.current + 1) % phrasesRef.current.length;
        }
      }

      timeout = setTimeout(tick, deleting.current ? 40 : 80);
    }

    tick();
    return () => clearTimeout(timeout);
  }, []);

  return <div className="typed">{text}</div>;
}
