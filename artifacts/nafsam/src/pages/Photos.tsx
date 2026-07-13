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
import "@/styles/luxe-photos.css";

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
    <RevealArticle className="photo-card glass luxe-photo-card" index={index}>
      <div className="luxe-corner luxe-tl" aria-hidden="true" />
      <div className="luxe-corner luxe-tr" aria-hidden="true" />
      <div className="luxe-corner luxe-bl" aria-hidden="true" />
      <div className="luxe-corner luxe-br" aria-hidden="true" />
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
    <RevealArticle className="photo-card glass luxe-photo-card" index={index}>
      <div className="luxe-corner luxe-tl" aria-hidden="true" />
      <div className="luxe-corner luxe-tr" aria-hidden="true" />
      <div className="luxe-corner luxe-bl" aria-hidden="true" />
      <div className="luxe-corner luxe-br" aria-hidden="true" />
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
 *  ONE full-res bitmap alive at a time, which matters on iPhone.
 *
 *  Supports pinch-to-zoom (two fingers), one-finger pan while zoomed, and
 *  double-tap / double-click to toggle zoom. While zoomed, touch events are
 *  stopped from reaching the overlay so swipe-navigation doesn't fire. */
const ZOOM_MAX = 4;
const ZOOM_DOUBLE_TAP = 2.5;

function LightboxImage({ src, thumb }: { src: string; thumb: string }) {
  const [shown, setShown] = useState(thumb || src);
  const wrapRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const zoomRef = useRef({ scale: 1, tx: 0, ty: 0 });

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

  // Reset zoom whenever the photo changes.
  useEffect(() => {
    zoomRef.current = { scale: 1, tx: 0, ty: 0 };
    const img = imgRef.current;
    if (img) {
      img.style.transition = "";
      img.style.transform = "";
    }
  }, [src]);

  useEffect(() => {
    const el = wrapRef.current;
    const z = zoomRef;
    if (!el) return;

    let pinch: {
      dist: number;
      scale: number;
      tx: number;
      ty: number;
      midX: number;
      midY: number;
    } | null = null;
    let pan: { x: number; y: number; tx: number; ty: number } | null = null;
    let lastTap = 0;
    // True while the current touch sequence was a zoom gesture — keeps the
    // overlay's swipe-nav from firing on the trailing touchend.
    let consumed = false;

    const apply = (animate = false) => {
      const img = imgRef.current;
      if (!img) return;
      img.style.transition = animate ? "transform 0.25s ease" : "";
      const { scale, tx, ty } = z.current;
      img.style.transform =
        scale === 1 && tx === 0 && ty === 0
          ? ""
          : `translate(${tx}px, ${ty}px) scale(${scale})`;
    };

    const clampPan = () => {
      const img = imgRef.current;
      if (!img) return;
      const { scale } = z.current;
      // offsetWidth/Height ignore transforms → untransformed layout size.
      const maxX = Math.max(0, ((scale - 1) * img.offsetWidth) / 2);
      const maxY = Math.max(0, ((scale - 1) * img.offsetHeight) / 2);
      z.current.tx = Math.min(maxX, Math.max(-maxX, z.current.tx));
      z.current.ty = Math.min(maxY, Math.max(-maxY, z.current.ty));
    };

    const center = () => {
      const r = el.getBoundingClientRect();
      return { cx: r.left + r.width / 2, cy: r.top + r.height / 2 };
    };

    const toggleZoomAt = (px: number, py: number) => {
      const { cx, cy } = center();
      if (z.current.scale > 1.05) {
        z.current = { scale: 1, tx: 0, ty: 0 };
      } else {
        const s = ZOOM_DOUBLE_TAP;
        z.current = {
          scale: s,
          tx: (cx - px) * (s - 1),
          ty: (cy - py) * (s - 1),
        };
        clampPan();
      }
      apply(true);
    };

    const touchDist = (t: TouchList) =>
      Math.hypot(
        t[0].clientX - t[1].clientX,
        t[0].clientY - t[1].clientY,
      );

    const onTouchStart = (e: TouchEvent) => {
      if (e.touches.length === 2) {
        // Pinch begins: never let the overlay treat this as a swipe.
        e.stopPropagation();
        consumed = true;
        pan = null;
        pinch = {
          dist: touchDist(e.touches),
          scale: z.current.scale,
          tx: z.current.tx,
          ty: z.current.ty,
          midX: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          midY: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        };
      } else if (e.touches.length === 1) {
        const t0 = e.touches[0];
        const now = Date.now();
        if (now - lastTap < 300) {
          lastTap = 0;
          e.stopPropagation();
          if (e.cancelable) e.preventDefault();
          consumed = true;
          toggleZoomAt(t0.clientX, t0.clientY);
          return;
        }
        lastTap = now;
        if (z.current.scale > 1.01) {
          e.stopPropagation();
          consumed = true;
          pan = {
            x: t0.clientX,
            y: t0.clientY,
            tx: z.current.tx,
            ty: z.current.ty,
          };
        }
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (pinch && e.touches.length === 2) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        const { cx, cy } = center();
        const ratio = touchDist(e.touches) / pinch.dist;
        const next = Math.min(ZOOM_MAX, Math.max(1, pinch.scale * ratio));
        const midX = (e.touches[0].clientX + e.touches[1].clientX) / 2;
        const midY = (e.touches[0].clientY + e.touches[1].clientY) / 2;
        const k = next / pinch.scale;
        // Keep the image point under the fingers stable, follow the midpoint.
        z.current.scale = next;
        z.current.tx = midX - cx - (pinch.midX - cx - pinch.tx) * k;
        z.current.ty = midY - cy - (pinch.midY - cy - pinch.ty) * k;
        clampPan();
        apply();
      } else if (pan && e.touches.length === 1 && z.current.scale > 1.01) {
        e.stopPropagation();
        if (e.cancelable) e.preventDefault();
        const t0 = e.touches[0];
        z.current.tx = pan.tx + (t0.clientX - pan.x);
        z.current.ty = pan.ty + (t0.clientY - pan.y);
        clampPan();
        apply();
      }
    };

    const onTouchEnd = (e: TouchEvent) => {
      if (z.current.scale > 1.01 || pinch || consumed) e.stopPropagation();
      if (e.touches.length < 2) pinch = null;
      if (e.touches.length === 0) {
        pan = null;
        consumed = false;
        if (z.current.scale < 1.05) {
          z.current = { scale: 1, tx: 0, ty: 0 };
          apply(true);
        }
      }
    };

    // Native non-passive listeners: React's root touch listeners are passive,
    // so preventDefault (needed to stop iOS page-zoom/scroll) must live here.
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: false });
    el.addEventListener("touchcancel", onTouchEnd, { passive: false });
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
      el.removeEventListener("touchcancel", onTouchEnd);
    };
  }, []);

  return (
    <div
      ref={wrapRef}
      className="lightbox-zoom"
      onDoubleClick={(e) => {
        e.stopPropagation();
        const z = zoomRef.current;
        const el = wrapRef.current;
        const img = imgRef.current;
        if (!el || !img) return;
        const r = el.getBoundingClientRect();
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        if (z.scale > 1.05) {
          zoomRef.current = { scale: 1, tx: 0, ty: 0 };
        } else {
          const s = ZOOM_DOUBLE_TAP;
          zoomRef.current = {
            scale: s,
            tx: (cx - e.clientX) * (s - 1),
            ty: (cy - e.clientY) * (s - 1),
          };
        }
        img.style.transition = "transform 0.25s ease";
        const nz = zoomRef.current;
        img.style.transform =
          nz.scale === 1
            ? ""
            : `translate(${nz.tx}px, ${nz.ty}px) scale(${nz.scale})`;
      }}
    >
      <img
        ref={imgRef}
        src={shown}
        alt=""
        className="lightbox-img"
        decoding="async"
        draggable={false}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
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
      <div className="luxe-star" style={{ top: '15%', left: '10%', animationDelay: '0s' }} aria-hidden="true" />
      <div className="luxe-star" style={{ top: '25%', right: '15%', animationDelay: '1.2s' }} aria-hidden="true" />
      <div className="luxe-star" style={{ top: '45%', left: '8%', animationDelay: '0.5s' }} aria-hidden="true" />
      <div className="luxe-star" style={{ top: '70%', right: '5%', animationDelay: '2.1s' }} aria-hidden="true" />
      <div className="luxe-star" style={{ top: '85%', left: '20%', animationDelay: '0.8s' }} aria-hidden="true" />
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
                className="photo-card glass photo-card-featured luxe-photo-card"
                index={nonFeaturedPhotos.length}
              >
                <div className="luxe-corner luxe-tl" aria-hidden="true" />
                <div className="luxe-corner luxe-tr" aria-hidden="true" />
                <div className="luxe-corner luxe-bl" aria-hidden="true" />
                <div className="luxe-corner luxe-br" aria-hidden="true" />
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
