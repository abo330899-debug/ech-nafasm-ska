import { useEffect, useRef, useState, type ReactNode, type CSSProperties } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import usePageAudio from "@/hooks/usePageAudio";
import { privateImage } from "@/lib/privateAssets";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import LuxImage from "@/components/LuxImage";
import useReveal from "@/hooks/useReveal";
import { prefetchImages } from "@/lib/prefetch";

function RevealArticle({
  className = "",
  index,
  children,
}: {
  className?: string;
  index?: number;
  children: ReactNode;
}) {
  const { ref, inView } = useReveal<HTMLElement>();
  const style: CSSProperties | undefined =
    typeof index === "number"
      ? ({ ["--i" as never]: Math.min(index, 8) } as CSSProperties)
      : undefined;
  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className={`${className} ${inView ? "in-view" : ""}`}
      style={style}
    >
      {children}
    </article>
  );
}

interface Props {
  t: Translations;
  lang: Lang;
}

function pad2(n: number) {
  return n < 10 ? `0${n}` : String(n);
}

const SPECIAL_PHOTO_TEXT_KEYS = [
  "photo1_text",
  "photo2_text",
  "photo3_text",
  "photo4_text",
  "photo5_text",
  "photo6_text",
  "photo7_text",
] as const;

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

  useEffect(() => {
    if (!data) return;
    const all = (data.photos ?? [])
      .slice(0, 6)
      .map((n) => privateImage(`all_photos/${n}`));
    prefetchImages(all);
  }, [data]);

  const langKey: "ar" | "tr" = lang === "ar" ? "ar" : "tr";
  const captions = data?.captions?.[langKey] ?? [];
  const allPhotos = data?.photos ?? [];

  const rawSpecialPhotos = data?.specialPhotos ?? [];
  const nonFeaturedPhotos = rawSpecialPhotos.filter((ph) => !ph.featured);
  const featuredPhoto = rawSpecialPhotos.find((ph) => ph.featured);

  const specialPhotos = nonFeaturedPhotos.map((ph, i) => ({
    src: privateImage(ph.file),
    text: p[SPECIAL_PHOTO_TEXT_KEYS[i]] ?? undefined,
  }));

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
          <RevealArticle key={`s-${i}`} className="photo-card glass" index={i}>
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
              <LuxImage
                src={ph.src}
                alt={ph.text ?? ""}
                className="photo-img"
                priority={i < 2 ? "high" : "auto"}
                nextSrc={specialPhotos[i + 1]?.src}
              />
              <span className="photo-card-badge">{pad2(i + 1)}</span>
              {ph.text && (
                <div className="photo-card-overlay">
                  <p className="photo-card-overlay-text">{ph.text}</p>
                </div>
              )}
            </div>
          </RevealArticle>
        ))}

        {featuredPhoto && (() => {
          const featuredSrc = privateImage(featuredPhoto.file);
          return (
            <RevealArticle className="photo-card glass photo-card-featured" index={nonFeaturedPhotos.length}>
              <div
                className="photo-card-media"
                onClick={() => setLightbox(featuredSrc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    setLightbox(featuredSrc);
                  }
                }}
              >
                <LuxImage
                  src={featuredSrc}
                  alt={p.photo7_text ?? ""}
                  className="photo-img"
                  nextSrc={albumPhotos.slice(0, 2).map((x) => x.src)}
                />
                <span className="photo-card-badge photo-card-badge-featured">★</span>
              </div>
              <div className="photo-caption-featured">
                {p.photo7_text && <p className="featured-quote">{p.photo7_text}</p>}
                {p.photo7_sub && <p className="featured-sub">{p.photo7_sub}</p>}
              </div>
            </RevealArticle>
          );
        })()}
      </div>

      <div className="album-divider">
        <span className="album-divider-line" />
        <span className="album-divider-text">{t.photos_title}</span>
        <span className="album-divider-line" />
      </div>

      <div className="photo-grid album-grid">
        {albumPhotos.map((ph, i) => (
          <RevealArticle key={`a-${i}`} className="photo-card glass" index={i}>
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
              <LuxImage
                src={ph.src}
                alt={ph.title ?? ""}
                className="photo-img"
                nextSrc={[
                  albumPhotos[i + 1]?.src,
                  albumPhotos[i + 2]?.src,
                ].filter(Boolean) as string[]}
              />
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
          </RevealArticle>
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
