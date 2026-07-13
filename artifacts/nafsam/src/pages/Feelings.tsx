import { useEffect, useRef } from "react";
import EmberParticles from "@/components/EmberParticles";
import SmokeVeil from "@/components/SmokeVeil";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import { type Translations, type Lang } from "@/i18n/translations";
import { usePrivateContent, pickLangFeelings } from "@/hooks/usePrivateContent";
import "@/styles/luxe-journey-feelings.css";

interface Props {
  t: Translations;
  lang: Lang;
}

interface MemoryFragment { label: string; body: string; }

export default function Feelings({ t, lang }: Props) {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const data = usePrivateContent();
  const feelings = pickLangFeelings(data, lang);

  const heroSub         = feelings.heroSub ?? "";
  const storyTitle      = feelings.storyTitle ?? t.feelings_story_title;
  const storyParagraphs = feelings.storyParagraphs ?? [];
  const memoriesTitle   = feelings.memoriesTitle ?? t.feelings_memories_title;
  const memoriesSub     = feelings.memoriesSub ?? t.feelings_memories_sub;
  const memoryFragments: MemoryFragment[] = feelings.memoryFragments ?? [];
  const collapseTitle   = feelings.collapseTitle ?? t.feelings_collapse_title;
  const collapseLines   = feelings.collapseLines ?? [];
  const endingLine      = feelings.endingLine ?? "";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const targets = root.querySelectorAll<HTMLElement>("[data-reveal]");
    const revealEl = (el: HTMLElement) => el.classList.add("is-revealed");
    const revealAll = () => targets.forEach(revealEl);

    if (typeof IntersectionObserver === "undefined") { revealAll(); return; }
    try {
      const io = new IntersectionObserver(
        (entries) => {
          for (const e of entries) {
            if (e.isIntersecting) { revealEl(e.target as HTMLElement); io.unobserve(e.target); }
          }
        },
        { threshold: 0.05 },
      );
      targets.forEach((el) => {
        const rect = el.getBoundingClientRect();
        if (rect.top < window.innerHeight && rect.bottom > 0) revealEl(el);
        else io.observe(el);
      });
      return () => io.disconnect();
    } catch { revealAll(); return; }
  }, [data, lang]);

  useEffect(() => {
    const prevTitle = document.title;
    document.title = `${t.feelings_doc_title} · ${t.brand}`;
    document.body.classList.add("ambient-mute");
    return () => { document.title = prevTitle; document.body.classList.remove("ambient-mute"); };
  }, [t.brand, t.feelings_doc_title]);

  return (
    <div className="feelings-page" ref={rootRef}>
      <div className="star-shimmer star-1" aria-hidden="true" />
      <div className="star-shimmer star-2" aria-hidden="true" />
      <div className="star-shimmer star-3" aria-hidden="true" />
      <div className="star-shimmer star-4" aria-hidden="true" />
      <div className="star-shimmer star-5" aria-hidden="true" />
      <PhotoBackdrop />
      {/* ===== HERO ===== */}
      <section className="fl-hero">
        <SmokeVeil intensity="heavy" />
        <EmberParticles count={36} />
        <div className="fl-hero-vignette" />
        <div className="fl-hero-inner">
          <div className="fl-hero-eyebrow" data-reveal>
            <span className="fl-eyebrow-line" />
            <span>{t.feelings_hero_eyebrow}</span>
            <span className="fl-eyebrow-line" />
          </div>
          <h1 className="fl-hero-title" data-reveal>
            <span className="fl-hero-word">{t.feelings_hero_word_1}</span>
            <span className="fl-hero-word fl-hero-word-em">{t.feelings_hero_word_2}</span>
          </h1>
          {heroSub ? (
            <p className="fl-hero-sub" data-reveal>
              {heroSub.split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </p>
          ) : (
            <p className="fl-hero-sub" data-reveal>
              {t.feelings_hero_sub.split("\n").map((line, i, arr) => (
                <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
              ))}
            </p>
          )}
          <div className="fl-hero-scroll" data-reveal aria-hidden="true">
            <span>{t.feelings_scroll_hint}</span>
            <span className="fl-hero-scroll-line" />
          </div>
        </div>
      </section>

      {/* ===== STORYTELLING ===== */}
      <section className="fl-section fl-story">
        <div className="fl-divider" aria-hidden="true">
          <span className="fl-divider-dot" />
          <span className="fl-divider-line" />
          <span className="fl-divider-dot" />
        </div>
        <div className="fl-section-inner">
          {storyTitle && <h2 className="fl-section-title" data-reveal>{storyTitle}</h2>}
          <div className="fl-prose">
            {storyParagraphs.map((para, i) => (
              <p key={i} data-reveal>{para}</p>
            ))}
          </div>
        </div>
      </section>

      {/* ===== MEMORIES ===== */}
      <section className="fl-section fl-memories">
        <div className="fl-divider" aria-hidden="true">
          <span className="fl-divider-dot" />
          <span className="fl-divider-line" />
          <span className="fl-divider-dot" />
        </div>
        <div className="fl-section-inner">
          {memoriesTitle && <h2 className="fl-section-title" data-reveal>{memoriesTitle}</h2>}
          {memoriesSub && <p className="fl-section-sub" data-reveal>{memoriesSub}</p>}
          <div className="fl-memory-grid">
            {memoryFragments.map((m, i) => (
              <article className="fl-memory-card" key={m.label ?? i} data-reveal>
                <div className="corner-flourish corner-tl" aria-hidden="true" />
                <div className="corner-flourish corner-tr" aria-hidden="true" />
                <div className="corner-flourish corner-bl" aria-hidden="true" />
                <div className="corner-flourish corner-br" aria-hidden="true" />
                <div className="fl-memory-glow" aria-hidden="true" />
                <div className="fl-memory-label">{m.label}</div>
                <p className="fl-memory-text">{m.body}</p>
                <div className="fl-memory-fade" aria-hidden="true" />
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ===== COLLAPSE ===== */}
      <section className="fl-section fl-collapse">
        <SmokeVeil intensity="heavy" className="fl-collapse-smoke" />
        <div className="fl-collapse-inner">
          {collapseTitle && <h2 className="fl-collapse-title" data-reveal>{collapseTitle}</h2>}
          <div className="fl-collapse-stack">
            {collapseLines.map((line, i) => (
              <p key={i} className="fl-collapse-line" data-reveal style={{ ["--fl-step" as string]: `${i}` }}>
                {line}
              </p>
            ))}
          </div>
        </div>
        <div className="fl-collapse-darken" aria-hidden="true" />
      </section>

      {/* ===== ENDING ===== */}
      <section className="fl-section fl-ending">
        <EmberParticles count={14} className="fl-ending-embers" />
        <div className="fl-ending-inner" data-reveal>
          <p className="fl-ending-line">
            {endingLine.split("\n").map((line, i, arr) => (
              <span key={i}>{line}{i < arr.length - 1 && <br />}</span>
            ))}
          </p>
          <div className="fl-ending-signature" aria-hidden="true">
            <span /><span>·</span><span />
          </div>
          <p className="fl-ending-sign">— Nafsam</p>
        </div>
        <div className="fl-ending-fade" aria-hidden="true" />
      </section>
    </div>
  );
}
