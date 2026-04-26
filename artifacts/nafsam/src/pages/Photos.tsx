import { useEffect, useRef, useState } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { privateImage } from "@/lib/privateAssets";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

interface Props {
  t: Translations;
  lang: Lang;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

export default function Photos({ t, lang }: Props) {
  usePageAudio("song2.mp3");
  const [lightbox, setLightbox] = useState<string | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);

  useEffect(() => {
    if (!lightbox) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => lightboxCloseRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightbox(null);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [lightbox]);
  const langKey: "ar" | "tr" = lang === "ar" ? "ar" : "tr";
  const captions = data?.captions?.[langKey] ?? [];
  const allPhotos = data?.photos ?? [];

  const specialPhotos = [
    { src: privateImage("photo1.webp"), text: p.photo1_text },
    { src: privateImage("photo2.webp"), text: p.photo2_text },
    { src: privateImage("photo3.webp"), text: p.photo3_text },
    { src: privateImage("photo4.webp"), text: p.photo4_text },
    { src: privateImage("photo5.webp"), text: p.photo5_text },
    { src: privateImage("photo6.webp"), text: p.photo6_text },
  ];

  const albumPhotos = allPhotos.map((name, i) => {
    const story = i < captions.length ? captions[i] : null;
    return {
      src: privateImage(`all_photos/${name}`),
      title: story?.title ?? null,
      text: story?.text ?? t.photos_fallback_caption,
    };
  });

  return (
    <div className="page-content photos-luxe">
      <div className="page-header">
        <h1>{t.photos_title}</h1>
        {p.photos_header_sub && <p className="photos-header-sub">{p.photos_header_sub}</p>}
      </div>

      <div className="photo-grid">
        {specialPhotos.map((ph, i) => (
          <article key={`s-${i}`} className="photo-card glass">
            <div
              className="photo-card-media"
              onClick={() => setLightbox(ph.src)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightbox(ph.src);
                }
              }}
            >
              <img src={ph.src} alt={ph.text ?? ""} className="photo-img" loading="lazy" decoding="async" />
              <span className="photo-card-badge">{pad2(i + 1)}</span>
              {ph.text && (
                <div className="photo-card-overlay">
                  <p className="photo-card-overlay-text">{ph.text}</p>
                </div>
              )}
            </div>
          </article>
        ))}

        <article className="photo-card glass photo-card-featured">
          <div
            className="photo-card-media"
            onClick={() => setLightbox(privateImage("photo7.webp"))}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                setLightbox(privateImage("photo7.webp"));
              }
            }}
          >
            <img
              src={privateImage("photo7.webp")}
              alt={p.photo7_text ?? ""}
              className="photo-img"
              loading="lazy"
              decoding="async"
            />
            <span className="photo-card-badge photo-card-badge-featured">★</span>
          </div>
          <div className="photo-caption-featured">
            {p.photo7_text && <p className="featured-quote">{p.photo7_text}</p>}
            {p.photo7_sub && <p className="featured-sub">{p.photo7_sub}</p>}
          </div>
        </article>
      </div>

      <div className="album-divider">
        <span className="album-divider-line" />
        <span className="album-divider-text">{t.photos_title}</span>
        <span className="album-divider-line" />
      </div>

      <div className="photo-grid album-grid">
        {albumPhotos.map((ph, i) => (
          <article key={`a-${i}`} className="photo-card glass">
            <div
              className="photo-card-media"
              onClick={() => setLightbox(ph.src)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setLightbox(ph.src);
                }
              }}
            >
              <img src={ph.src} alt={ph.title ?? ""} className="photo-img" loading="lazy" decoding="async" />
              <span className="photo-card-badge">{pad2(i + 1)}</span>
              {ph.title && (
                <div className="photo-card-overlay">
                  <p className="photo-card-overlay-title">{ph.title}</p>
                </div>
              )}
            </div>
            {ph.text && (
              <div className="album-caption-block">
                <p className="album-caption-text">{ph.text}</p>
              </div>
            )}
          </article>
        ))}
      </div>

      {lightbox && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightbox(null)}
        >
          <button
            ref={lightboxCloseRef}
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            aria-label="Close"
          >
            &times;
          </button>
          <img
            src={lightbox}
            alt=""
            className="lightbox-img"
            decoding="async"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {p.photos_footer && <Footer text={p.photos_footer} />}
    </div>
  );
}
