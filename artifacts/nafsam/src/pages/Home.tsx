import { useState, useEffect } from "react";
import { Link } from "wouter";
import { type Translations, type Lang } from "@/i18n/translations";
import TypewriterTitle from "@/components/TypewriterTitle";
import FarewellPassage from "@/components/FarewellPassage";
import OblivionScript from "@/components/OblivionScript";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

const START = new Date("2025-08-20T04:04:00");

function elapsed(now: Date) {
  let d = Math.floor((now.getTime() - START.getTime()) / 1000);
  if (d < 0) d = 0;
  const days = Math.floor(d / 86400);
  const hrs = Math.floor((d % 86400) / 3600);
  const mins = Math.floor((d % 3600) / 60);
  const secs = d % 60;
  return { days, hrs, mins, secs };
}

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Home({ t, lang }: Props) {
  usePageAudio("home_song.mp3");
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);

  const [el, setEl] = useState(elapsed(new Date()));

  useEffect(() => {
    const interval = setInterval(() => setEl(elapsed(new Date())), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const HERO = "/api/private/images/hero.webp";
    if (document.head.querySelector(`link[data-hero-preload="1"]`)) return;
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = HERO;
    link.setAttribute("fetchpriority", "high");
    link.setAttribute("data-hero-preload", "1");
    document.head.appendChild(link);
    const img = new Image();
    (img as HTMLImageElement & { fetchPriority?: string }).fetchPriority = "high";
    img.decoding = "async";
    img.src = HERO;
    return () => {
      if (link.parentNode) link.parentNode.removeChild(link);
    };
  }, []);

  return (
    <div className="page-content">
      <section className="hero">
        <div className="hero-bg" style={{ backgroundImage: `url(/api/private/images/hero.webp)` }} />
        <div className="hero-overlay" />
        <div className="hero-body">
          <span className="eyebrow">{t.hero_eyebrow}</span>
          <TypewriterTitle text={t.hero_title} />

          <FarewellPassage
            title={t.farewell_title}
            paragraphs={[t.farewell_p1, t.farewell_p2, t.farewell_p3, t.farewell_p4]}
            silverAnchor={t.farewell_silver_anchor}
            memoryPattern={t.farewell_memory_pattern}
            dir={t.dir}
            lang={lang}
          />
          <div className="elapsed-counter">
            <span>{el.days} {t.countdown_day}</span>
            <span>{el.hrs} {t.countdown_hour}</span>
            <span>{el.mins} {t.countdown_minute}</span>
            <span>{el.secs} {t.countdown_second}</span>
          </div>
          <div className="hero-buttons">
            <Link href="/moments" className="btn btn-primary">
              {t.open_story}
            </Link>
            <Link href="/writings" className="btn btn-outline">
              {t.read_pain}
            </Link>
          </div>
        </div>
      </section>

      <OblivionScript
        name={t.oblivion_name}
        hint={t.oblivion_hint}
        revealed={t.oblivion_revealed}
        dir={t.dir}
        lang={lang}
      />

      <section className="cards-section">
        <div className="cards-grid">
          <Link href="/moments" className="card glass">
            <h3>{t.card_moments_title}</h3>
            {p.card_moments_text && <p>{p.card_moments_text}</p>}
          </Link>
          <Link href="/photos" className="card glass">
            <h3>{t.card_photos_title}</h3>
            {p.card_photos_text && <p>{p.card_photos_text}</p>}
          </Link>
          <Link href="/songs" className="card glass">
            <h3>{t.card_songs_title}</h3>
            {p.card_songs_text && <p>{p.card_songs_text}</p>}
          </Link>
          <Link href="/writings" className="card glass">
            <h3>{t.card_writings_title}</h3>
            {p.card_writings_text && <p>{p.card_writings_text}</p>}
          </Link>
        </div>
      </section>
      {p.footer_text && <Footer text={p.footer_text} />}
    </div>
  );
}
