import { useEffect, useState } from "react";

const STORAGE_KEY = "nafsam_oblivion_done_v1";
const COUNTDOWN_FROM = 10;

type Phase = "countdown" | "blurring" | "revealed";

interface Props {
  name: string;
  hint: string;
  revealed: string;
  dir?: "ltr" | "rtl";
  lang?: string;
}

export default function OblivionScript({
  name,
  hint,
  revealed,
  dir = "rtl",
  lang = "ar",
}: Props) {
  const [phase, setPhase] = useState<Phase>(() => {
    if (typeof window === "undefined") return "countdown";
    try {
      return localStorage.getItem(STORAGE_KEY) === "1" ? "revealed" : "countdown";
    } catch {
      return "countdown";
    }
  });
  const [seconds, setSeconds] = useState(COUNTDOWN_FROM);

  useEffect(() => {
    if (phase !== "countdown") return;
    if (seconds <= 0) {
      setPhase("blurring");
      const t = window.setTimeout(() => {
        setPhase("revealed");
        try {
          localStorage.setItem(STORAGE_KEY, "1");
        } catch {
          /* noop */
        }
      }, 2400);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [phase, seconds]);

  return (
    <section className={`oblivion oblivion--${phase}`} aria-label="Oblivion">
      <div className="oblivion-inner">
        {phase !== "revealed" && (
          <>
            <div className="oblivion-counter" aria-live="polite">
              <span className="oc-num">{Math.max(0, seconds)}</span>
            </div>
            <h2 className="oblivion-name" lang={lang} dir={dir}>
              {name}
            </h2>
            <p className="oblivion-hint" lang={lang} dir={dir}>
              {hint}
            </p>
          </>
        )}

        {phase === "revealed" && (
          <div className="oblivion-revealed" lang={lang} dir={dir}>
            <span className="or-text">{revealed}</span>
          </div>
        )}
      </div>
    </section>
  );
}
