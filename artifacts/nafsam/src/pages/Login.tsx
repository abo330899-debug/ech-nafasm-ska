import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { type Translations, type Lang } from "@/i18n/translations";
import usePageAudio from "@/hooks/usePageAudio";
import { fetchSession, login, type SessionCard } from "@/lib/auth";

interface CountdownTime {
  days: number;
  hrs: number;
  mins: number;
  secs: number;
}

function getCountdown(target: number, now: Date): CountdownTime | null {
  const diff = target - now.getTime();
  if (diff <= 0) return null;
  const d = Math.floor(diff / 1000);
  return {
    days: Math.floor(d / 86400),
    hrs: Math.floor((d % 86400) / 3600),
    mins: Math.floor((d % 3600) / 60),
    secs: d % 60,
  };
}

interface Props {
  t: Translations;
  lang: Lang;
  onAuth?: () => void;
}

export default function Login({ t, lang, onAuth }: Props) {
  usePageAudio("login_song.mp3");
  const [openAt, setOpenAt] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<CountdownTime | null>(null);
  const [cards, setCards] = useState<SessionCard[]>([]);
  const [cardCount, setCardCount] = useState<number>(0);
  const [answer, setAnswer] = useState("");
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState<"" | "error" | "success">("");
  const [submitting, setSubmitting] = useState(false);
  const [, setLocation] = useLocation();

  useEffect(() => {
    let cancelled = false;
    fetchSession().then((s) => {
      if (cancelled) return;
      if (s.authed) {
        setLocation("/home");
        return;
      }
      setOpenAt(s.openAt);
      setCountdown(getCountdown(s.openAt, new Date()));
      if (s.cards) {
        setCards(s.cards);
        setCardCount(s.cards.length);
      } else if (s.cardCount) {
        setCardCount(s.cardCount);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [setLocation]);

  useEffect(() => {
    if (openAt === null) return;
    let justOpened = false;
    const iv = setInterval(() => {
      const next = getCountdown(openAt, new Date());
      setCountdown(next);
      if (next === null && !justOpened) {
        justOpened = true;
        fetchSession().then((s) => {
          if (s.cards) setCards(s.cards);
        });
      }
    }, 1000);
    return () => clearInterval(iv);
  }, [openAt]);

  const isOpen = countdown === null && openAt !== null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
    if (!isOpen) {
      setMsg(t.login_msg_closed);
      setMsgType("error");
      return;
    }
    setSubmitting(true);
    const result = await login(answer);
    setSubmitting(false);
    if (result.ok) {
      setMsg(t.login_msg_success);
      setMsgType("success");
      onAuth?.();
      setTimeout(() => setLocation("/home"), 800);
      return;
    }
    if (result.reason === "closed") {
      setMsg(t.login_msg_closed);
    } else {
      setMsg(t.login_msg_wrong);
    }
    setMsgType("error");
  }

  return (
    <div className="page-content login-page">
      <div className="login-container glass">
        <h1 className="login-title">{t.login_title}</h1>
        <p className="login-text">{t.login_text}</p>

        <div className="user-cards-grid">
          {cards.length > 0
            ? cards.map((card) => (
                <div key={card.id} className="user-card glass">
                  <div className="riddle-hint">
                    <span className="riddle-icon">🔓</span>
                    <p>{card.hints[lang] ?? card.hints.en}</p>
                  </div>
                </div>
              ))
            : countdown !== null && cardCount > 0
              ? Array.from({ length: cardCount }, (_, i) => (
                  <div key={i} className="user-card glass">
                    <div className="countdown-mini">
                      <span>
                        {countdown.days}{t.countdown_day} {countdown.hrs}
                        {t.countdown_hour} {countdown.mins}{t.countdown_minute}{" "}
                        {countdown.secs}{t.countdown_second}
                      </span>
                    </div>
                  </div>
                ))
              : null}
        </div>

        <form className="login-form" onSubmit={handleSubmit}>
          <label className="sr-only" htmlFor="login-answer">{t.login_input}</label>
          <input
            id="login-answer"
            type="text"
            placeholder={t.login_input}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="login-input"
            disabled={submitting}
          />
          <button type="submit" className="btn btn-primary login-btn" disabled={submitting}>
            {t.login_button}
          </button>
        </form>

        {msg && (
          <div className={`login-msg ${msgType}`} role="alert" aria-live="assertive">{msg}</div>
        )}

        <p className="login-hint">{t.login_hint}</p>
      </div>
    </div>
  );
}
