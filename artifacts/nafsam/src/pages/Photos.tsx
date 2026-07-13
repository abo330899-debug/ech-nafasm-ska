import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import usePageAudio from "@/hooks/usePageAudio";
import { privateImage, privateImageThumb } from "@/lib/privateAssets";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import LuxImage from "@/components/LuxImage";
import useReveal from "@/hooks/useReveal";
import useNearViewport from "@/hooks/useNearViewport";
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

const PHONE =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 820px)").matches
    : false;

const ALBUM_BATCH = PHONE ? 6 : 8;

const SPECIAL_PHOTO_TEXT_KEYS = [
  "photo1_text",
  "photo2_text",
  "photo3_text",
  "photo4_text",
  "photo5_text",
  "photo6_text",
  "photo8_text",
  "photo9_text",
  "photo10_text",
  "photo11_text",
  "photo12_text",
  "photo13_text",
  "photo14_text",
  "photo15_text",
  "photo16_text",
  "photo17_text",
  "photo18_text",
  "photo19_text",
  "photo20_text",
  "photo21_text",
  "photo22_text",
  "photo23_text",
  "photo24_text",
  "photo25_text",
  "photo26_text",
  "photo27_text",
  "photo28_text",
  "photo29_text",
] as const;

const GATE_MARGIN = PHONE ? "600px 0px" : "1200px 0px";

function MediaPlaceholder() {
  return (
    <span className="lux-img-wrap is-loading" aria-hidden="true">
      <span className="lux-img-placeholder" />
    </span>
  );
}

function SpecialCard({
  src,
  thumb,
  text,
  index,
  priority,
  nextSrc,
  onOpen,
}: {
  src: string;
  thumb: string;
  text?: string;
  index: number;
  priority?: "high" | "auto";
  nextSrc?: string | string[];
  onOpen: () => void;
}) {
  const { ref, near } = useNearViewport<HTMLDivElement>({
    rootMargin: GATE_MARGIN,
  });
  return (
    <RevealArticle className="photo-card glass" index={index}>
      <div
        className="photo-card-media"
        ref={ref}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {near ? (
          <LuxImage
            src={thumb}
            fallbackSrc={src}
            alt={text ?? ""}
            className="photo-img"
            priority={priority}
            nextSrc={nextSrc}
          />
        ) : (
          <MediaPlaceholder />
        )}
        <span className="photo-card-badge">{pad2(index + 1)}</span>
        {text && (
          <div className="photo-card-overlay">
            <p className="photo-card-overlay-text">{text}</p>
          </div>
        )}
      </div>
    </RevealArticle>
  );
}

function AlbumCard({
  src,
  thumb,
  title,
  text,
  index,
  nextSrc,
  onOpen,
}: {
  src: string;
  thumb: string;
  title?: string | null;
  text?: string | null;
  index: number;
  nextSrc?: string | string[];
  onOpen: () => void;
}) {
  const { ref, near } = useNearViewport<HTMLDivElement>({
    rootMargin: GATE_MARGIN,
  });
  return (
    <RevealArticle className="photo-card glass" index={index}>
      <div
        className="photo-card-media"
        ref={ref}
        onClick={onOpen}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onOpen();
          }
        }}
      >
        {near ? (
          <LuxImage
            src={thumb}
            fallbackSrc={src}
            alt={title ?? ""}
            className="photo-img"
            nextSrc={nextSrc}
          />
        ) : (
          <MediaPlaceholder />
        )}
        <span className="photo-card-badge">{pad2(index + 1)}</span>
        {title && (
          <div className="photo-card-overlay">
            <p className="photo-card-overlay-title">{title}</p>
          </div>
        )}
      </div>
      {text && (
        <div className="album-caption-block">
          <p className="album-caption-text">{text}</p>
        </div>
      )}
    </RevealArticle>
  );
}

/** Shows the (usually cached) grid thumbnail instantly, then swaps in the
 *  full-resolution image once it has downloaded+decoded off-screen. Keeps only
 *  ONE full-res bitmap alive at a time, which matters on iPhone. */
function LightboxImage({ src, thumb }: { src: string; thumb: string }) {
  const [shown, setShown] = useState(thumb || src);
  useEffect(() => {
    setShown(thumb || src);
    if (!src || src === thumb) return;
    let alive = true;
    const im = new Image();
    im.onload = () => {
      if (alive) setShown(src);
    };
    im.src = src;
    return () => {
      alive = false;
    };
  }, [src, thumb]);
  return (
    <img
      src={shown}
      alt=""
      className="lightbox-img"
      decoding="async"
      draggable={false}
      onClick={(e) => e.stopPropagation()}
    />
  );
}

export default function Photos({ t, lang }: Props) {
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);
  const data = usePrivateContent();
  usePageAudio(data?.pageAudio?.photos ?? "");
  const p = pickLangPages(data, lang);

  const photosDir = data?.mediaConfig?.photosDir ?? "";

  useEffect(() => {
    if (!data || !photosDir) return;
    // Warm only the lightweight thumbnails; full-res is fetched on demand in
    // the lightbox. Prefetching full-res here piled up decoded bitmaps.
    const all = (data.photos ?? [])
      .slice(0, 6)
      .map((n) => privateImageThumb(`${photosDir}/${n}`));
    prefetchImages(all);
  }, [data, photosDir]);

  const captions = data?.captions?.[lang] ?? data?.captions?.tr ?? [];
  const allPhotos = data?.photos ?? [];

  const rawSpecialPhotos = data?.specialPhotos ?? [];
  const nonFeaturedPhotos = rawSpecialPhotos.filter((ph) => !ph.featured);
  const featuredPhoto = rawSpecialPhotos.find((ph) => ph.featured);

  const specialPhotos = nonFeaturedPhotos.map((ph, i) => ({
    src: privateImage(ph.file),
    thumb: privateImageThumb(ph.file),
    text: p[SPECIAL_PHOTO_TEXT_KEYS[i]] ?? undefined,
  }));

  const albumPhotos = allPhotos.map((name, i) => {
    const story = i < captions.length ? captions[i] : null;
    return {
      src: photosDir ? privateImage(`${photosDir}/${name}`) : "",
      thumb: photosDir ? privateImageThumb(`${photosDir}/${name}`) : "",
      title: story?.title ?? null,
      text: story?.text ?? t.photos_fallback_caption,
    };
  });

  // Flat, stable-order list backing the lightbox: specials, then featured,
  // then the album. Card indices below MUST follow this exact layout.
  const featuredLightbox = featuredPhoto
    ? [
        {
          src: privateImage(featuredPhoto.file),
          thumb: privateImageThumb(featuredPhoto.file),
        },
      ]
    : [];
  const lightboxItems = [
    ...specialPhotos.map((ph) => ({ src: ph.src, thumb: ph.thumb })),
    ...featuredLightbox,
    ...albumPhotos.map((ph) => ({ src: ph.src, thumb: ph.thumb })),
  ];
  const albumIndexBase = specialPhotos.length + featuredLightbox.length;
  const lightboxCount = lightboxItems.length;
  const lightboxItemsRef = useRef(lightboxItems);
  lightboxItemsRef.current = lightboxItems;

  const stepLightbox = useCallback(
    (delta: number) => {
      setLightboxIndex((i) => {
        if (i === null || lightboxCount === 0) return i;
        return (i + delta + lightboxCount) % lightboxCount;
      });
    },
    [lightboxCount],
  );

  const lightboxOpen = lightboxIndex !== null;

  useEffect(() => {
    if (!lightboxOpen) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const t1 = window.setTimeout(() => lightboxCloseRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLightboxIndex(null);
      else if (e.key === "ArrowLeft") stepLightbox(-1);
      else if (e.key === "ArrowRight") stepLightbox(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(t1);
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = originalOverflow;
      lastFocusedRef.current?.focus?.();
    };
  }, [lightboxOpen, stepLightbox]);

  // Warm only the NEIGHBOR THUMBNAILS while the lightbox is open, so a swipe
  // shows something instantly. Never prefetch neighbor full-res on phones —
  // decoded full-res bitmaps are what OOM-reloads iOS Safari.
  useEffect(() => {
    if (lightboxIndex === null) return;
    const items = lightboxItemsRef.current;
    const n = items.length;
    if (n < 2) return;
    const next = items[(lightboxIndex + 1) % n];
    const prev = items[(lightboxIndex - 1 + n) % n];
    prefetchImages(
      [next?.thumb || next?.src, prev?.thumb || prev?.src].filter(
        Boolean,
      ) as string[],
    );
  }, [lightboxIndex]);

  const onLightboxTouchStart = (e: React.TouchEvent) => {
    const t0 = e.touches[0];
    if (t0) touchStartRef.current = { x: t0.clientX, y: t0.clientY };
  };

  const onLightboxTouchEnd = (e: React.TouchEvent) => {
    const start = touchStartRef.current;
    touchStartRef.current = null;
    if (!start) return;
    const t0 = e.changedTouches[0];
    if (!t0) return;
    const dx = t0.clientX - start.x;
    const dy = t0.clientY - start.y;
    // Horizontal swipe only (ignore vertical scroll-ish gestures).
    if (Math.abs(dx) < 48 || Math.abs(dx) < Math.abs(dy) * 1.4) return;
    stepLightbox(dx < 0 ? 1 : -1);
  };

  // Window the album grid: render a prefix and grow it via an IntersectionObserver
  // sentinel. Rendering all cards (each mounts its own observer + <img>) at once
  // OOM-reloads mobile Safari on long scrolls. The observer must stay stable
  // (keyed on length only, NOT visibleCount) or it cascades the whole list.
  const albumCount = albumPhotos.length;
  const [visibleCount, setVisibleCount] = useState(ALBUM_BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(ALBUM_BATCH);
  }, [albumCount]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisibleCount(albumCount);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + ALBUM_BATCH, albumCount));
        }
      },
      { root: null, rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [albumCount]);

  // Stall guard: a stable observer only fires on threshold crossings, so if a
  // freshly-appended batch leaves the sentinel still inside the preload zone no
  // further callback fires and auto-loading stops. After each batch, measure the
  // sentinel's live position and top up while it stays within the preload zone.
  // Geometry-based (not the IO ref) so it self-limits once enough cards render —
  // it never recreates the observer, which would cascade the whole list.
  useEffect(() => {
    if (visibleCount >= albumCount) return;
    const el = sentinelRef.current;
    if (!el || typeof window === "undefined") return;
    const id = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 400) {
        setVisibleCount((c) => Math.min(c + ALBUM_BATCH, albumCount));
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visibleCount, albumCount]);

  return (
    <div className="page-content photos-luxe">
      <PhotoBackdrop />
      <div className="page-header">
        <h1>{t.photos_title}</h1>
        {p.photos_header_sub && (
          <p className="photos-header-sub">{p.photos_header_sub}</p>
        )}
      </div>

      <div className="photo-grid">
        {specialPhotos.map((ph, i) => (
          <SpecialCard
            key={`s-${i}`}
            src={ph.src}
            thumb={ph.thumb}
            text={ph.text}
            index={i}
            priority={i < 2 ? "high" : "auto"}
            nextSrc={specialPhotos[i + 1]?.thumb}
            onOpen={() => setLightboxIndex(i)}
          />
        ))}

        {featuredPhoto &&
          (() => {
            const featuredSrc = privateImage(featuredPhoto.file);
            const featuredThumb = privateImageThumb(featuredPhoto.file);
            return (
              <RevealArticle
                className="photo-card glass photo-card-featured"
                index={nonFeaturedPhotos.length}
              >
                <div
                  className="photo-card-media"
                  onClick={() => setLightboxIndex(specialPhotos.length)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      setLightboxIndex(specialPhotos.length);
                    }
                  }}
                >
                  <LuxImage
                    src={featuredThumb}
                    fallbackSrc={featuredSrc}
                    alt={p.photo7_text ?? ""}
                    className="photo-img"
                    nextSrc={albumPhotos.slice(0, 2).map((x) => x.thumb)}
                  />
                  <span className="photo-card-badge photo-card-badge-featured">
                    ★
                  </span>
                </div>
                <div className="photo-caption-featured">
                  {p.photo7_text && (
                    <p className="featured-quote">{p.photo7_text}</p>
                  )}
                  {p.photo7_sub && (
                    <p className="featured-sub">{p.photo7_sub}</p>
                  )}
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
        {albumPhotos.slice(0, visibleCount).map((ph, i) => (
          <AlbumCard
            key={`a-${i}`}
            src={ph.src}
            thumb={ph.thumb}
            title={ph.title}
            text={ph.text}
            index={i}
            nextSrc={
              [albumPhotos[i + 1]?.thumb, albumPhotos[i + 2]?.thumb].filter(
                Boolean,
              ) as string[]
            }
            onOpen={() => setLightboxIndex(albumIndexBase + i)}
          />
        ))}
      </div>

      {visibleCount < albumPhotos.length && (
        <div
          ref={sentinelRef}
          className="album-load-sentinel"
          aria-hidden="true"
        />
      )}

      {lightboxIndex !== null && lightboxItems[lightboxIndex] && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxIndex(null)}
          onTouchStart={onLightboxTouchStart}
          onTouchEnd={onLightboxTouchEnd}
        >
          <button
            ref={lightboxCloseRef}
            className="lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              setLightboxIndex(null);
            }}
            aria-label={t.common_close}
          >
            &times;
          </button>

          {lightboxCount > 1 && (
            <>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-prev"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(-1);
                }}
                aria-label={t.common_prev}
              >
                &#8249;
              </button>
              <button
                type="button"
                className="lightbox-nav lightbox-nav-next"
                onClick={(e) => {
                  e.stopPropagation();
                  stepLightbox(1);
                }}
                aria-label={t.common_next}
              >
                &#8250;
              </button>
            </>
          )}

          <LightboxImage
            src={lightboxItems[lightboxIndex].src}
            thumb={lightboxItems[lightboxIndex].thumb}
          />

          {lightboxCount > 1 && (
            <span className="lightbox-counter" dir="ltr" aria-hidden="true">
              {lightboxIndex + 1} / {lightboxCount}
            </span>
          )}
        </div>
      )}

      {p.photos_footer && <Footer text={p.photos_footer} />}
    </div>
  );
}
