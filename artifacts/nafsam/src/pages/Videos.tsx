import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import "@/styles/luxe-videos.css";
import { type Translations, type Lang } from "@/i18n/translations";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import {
  usePrivateContent,
  pickLangPages,
  pickLocalized,
} from "@/hooks/usePrivateContent";
import useReveal from "@/hooks/useReveal";
import useNearViewport from "@/hooks/useNearViewport";
import { mediaUrl, posterUrl, posterThumbUrl } from "@/lib/r2";
import { logActivity } from "@/lib/activity";

function RevealVideoCard({
  className = "",
  index,
  children,
  ...rest
}: {
  className?: string;
  index?: number;
  children: ReactNode;
  onClick?: () => void;
  role?: string;
  tabIndex?: number;
  "aria-label"?: string;
  onKeyDown?: (e: React.KeyboardEvent) => void;
}) {
  const { ref, inView } = useReveal<HTMLElement>();
  const style: CSSProperties = {
    ["--i" as never]: typeof index === "number" ? Math.min(index, 8) : 0,
  } as CSSProperties;
  return (
    <article
      ref={ref as React.RefObject<HTMLElement>}
      className={`${className} reveal ${inView ? "in-view" : ""}`}
      style={style}
      {...rest}
    >
      {children}
    </article>
  );
}

interface Props {
  t: Translations;
  lang: Lang;
}

type VideoKind = "mp4" | "youtube" | "mega";

// On phones, skip the duplicate blurred-fill poster <img>. The card already
// renders a contained foreground poster; rendering a second full poster per
// card doubles decoded bitmaps and is a primary driver of the iOS OOM reload.
const PHONE =
  typeof window !== "undefined" && typeof window.matchMedia === "function"
    ? window.matchMedia("(max-width: 820px)").matches
    : false;

const BATCH = PHONE ? 6 : 9;

function detectKind(file: string): VideoKind {
  if (/youtube\.com|youtu\.be/i.test(file)) return "youtube";
  if (/mega\.nz|mega\.co\.nz/i.test(file)) return "mega";
  return "mp4";
}

function buildSrc(file: string) {
  if (/^https?:\/\//i.test(file)) return file;
  return mediaUrl(file);
}

function buildPoster(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  return posterUrl(file);
}

function buildPosterThumb(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  return posterThumbUrl(file);
}

function getYouTubeId(url: string): string {
  const patterns: RegExp[] = [
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /\/embed\/([A-Za-z0-9_-]{6,})/,
    /\/shorts\/([A-Za-z0-9_-]{6,})/,
    /\/live\/([A-Za-z0-9_-]{6,})/,
    /\/v\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m && m[1]) return m[1];
  }
  return "";
}

function getYouTubeEmbed(url: string): string {
  const id = getYouTubeId(url);
  return id
    ? `https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1`
    : url;
}

function PlayIcon() {
  return (
    <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true">
      <path d="M8 5.5v13l11-6.5z" fill="currentColor" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M6 6l12 12M18 6L6 18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
      />
    </svg>
  );
}

function ChevronLeftIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M15 6l-6 6 6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ChevronRightIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
      <path
        d="M9 6l6 6-6 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function ExpandIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function CompressIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path
        d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

function Thumb({ file, kind }: { file: string; kind: VideoKind }) {
  const [imgFailed, setImgFailed] = useState(false);
  // Grids only need a small bitmap, so they load a downscaled poster thumbnail
  // (max 600px). A full poster (e.g. 720x1280) decodes to ~3.7MB while a thumb
  // is ~0.8MB — the difference is what keeps iOS Safari from OOM-reloading the
  // gallery. If a thumb is missing we fall back to the full poster once.
  const [useFullPoster, setUseFullPoster] = useState(false);
  // Mount the poster only while the card is near the viewport so off-screen
  // posters are unmounted and their decoded bitmaps reclaimed — without this,
  // scrolling the gallery accumulates posters until iOS Safari OOM-reloads.
  const { ref, near } = useNearViewport<HTMLDivElement>({
    rootMargin: PHONE ? "600px 0px" : "1200px 0px",
  });
  if (kind !== "mp4") {
    return (
      <div className="v-thumb v-thumb-static" ref={ref}>
        <div className="v-thumb-fallback" aria-hidden="true" />
        <div className="v-play" aria-hidden="true">
          <PlayIcon />
        </div>
      </div>
    );
  }
  const poster = buildPoster(file);
  const thumb = buildPosterThumb(file);
  const src = useFullPoster ? poster : thumb || poster;
  const showPoster = near && !!src && !imgFailed;
  const onPosterError = () => {
    // First failure on the thumbnail → retry once with the full poster.
    if (!useFullPoster && thumb && poster && poster !== thumb) {
      setUseFullPoster(true);
    } else {
      setImgFailed(true);
    }
  };
  return (
    <div className="v-thumb" ref={ref}>
      {showPoster ? (
        <>
          {!PHONE && (
            <img
              className="v-thumb-bg"
              src={src}
              alt=""
              aria-hidden="true"
              loading="lazy"
              decoding="async"
              draggable={false}
            />
          )}
          <img
            className="v-thumb-fg"
            src={src}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={onPosterError}
          />
        </>
      ) : (
        <div className="v-thumb-fallback" aria-hidden="true" />
      )}
      <div className="v-play" aria-hidden="true">
        <PlayIcon />
      </div>
    </div>
  );
}

export default function Videos({ t, lang }: Props) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  // Native aspect ratio (w/h) of the active mp4, read from loadedmetadata.
  // Drives orientation-aware modal sizing: portrait fills height, landscape
  // fills width — no letterbox bars either way.
  const [videoAR, setVideoAR] = useState<number | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const videosData = data?.videos ?? [];

  const [visibleCount, setVisibleCount] = useState(BATCH);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(BATCH);
  }, [videosData.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setVisibleCount(videosData.length);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisibleCount((c) => Math.min(c + BATCH, videosData.length));
        }
      },
      { root: null, rootMargin: "400px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [videosData.length]);

  // Stall guard: a stable observer only fires on threshold crossings, so if a
  // freshly-appended batch leaves the sentinel still inside the preload zone no
  // further callback fires and auto-loading stops. After each batch, measure the
  // sentinel's live position and top up while it stays within the preload zone.
  // Geometry-based (not the IO ref) so it self-limits once enough cards render —
  // it never recreates the observer, which would cascade the whole list.
  useEffect(() => {
    if (visibleCount >= videosData.length) return;
    const el = sentinelRef.current;
    if (!el || typeof window === "undefined") return;
    const id = requestAnimationFrame(() => {
      const rect = el.getBoundingClientRect();
      if (rect.top < window.innerHeight + 400) {
        setVisibleCount((c) => Math.min(c + BATCH, videosData.length));
      }
    });
    return () => cancelAnimationFrame(id);
  }, [visibleCount, videosData.length]);

  const openModal = useCallback(
    (index: number) => {
      setVideoAR(null);
      setActiveIndex(index);
      const v = videosData[index] as { caption?: string; title?: string; file?: string } | undefined;
      const label = v?.caption || v?.title || v?.file || `video ${index + 1}`;
      logActivity("video_open", label, { index });
    },
    [videosData],
  );

  const closeModal = useCallback(() => {
    setActiveIndex(null);
    setTheaterMode(false);
    setVideoAR(null);
  }, []);

  const toggleFullscreen = useCallback(() => {
    const el = videoElRef.current;
    if (!el) return;
    type Vendor = HTMLVideoElement & {
      webkitEnterFullscreen?: () => void;
      webkitRequestFullscreen?: () => Promise<void> | void;
    };
    type DocVendor = Document & {
      webkitExitFullscreen?: () => Promise<void> | void;
      webkitFullscreenElement?: Element | null;
    };
    const v = el as Vendor;
    const d = document as DocVendor;
    const inFs = !!(document.fullscreenElement || d.webkitFullscreenElement);
    if (inFs) {
      if (document.exitFullscreen) document.exitFullscreen();
      else d.webkitExitFullscreen?.();
    } else if (v.requestFullscreen) {
      v.requestFullscreen();
    } else if (v.webkitEnterFullscreen) {
      v.webkitEnterFullscreen();
    } else if (v.webkitRequestFullscreen) {
      v.webkitRequestFullscreen();
    }
  }, []);

  const toggleTheater = useCallback(() => {
    setTheaterMode((v) => !v);
  }, []);

  const prevVideo = useCallback(() => {
    setVideoAR(null);
    setActiveIndex((i) => {
      if (i === null || videosData.length === 0) return i;
      return (i - 1 + videosData.length) % videosData.length;
    });
  }, [videosData.length]);

  const nextVideo = useCallback(() => {
    setVideoAR(null);
    setActiveIndex((i) => {
      if (i === null || videosData.length === 0) return i;
      return (i + 1) % videosData.length;
    });
  }, [videosData.length]);

  useEffect(() => {
    if (activeIndex === null) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(
      () => closeBtnRef.current?.focus(),
      30,
    );
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowLeft") prevVideo();
      else if (e.key === "ArrowRight") nextVideo();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [activeIndex, closeModal, prevVideo, nextVideo]);

  const active =
    activeIndex !== null ? (videosData[activeIndex] ?? null) : null;
  const activeKind: VideoKind = active ? detectKind(active.file) : "mp4";
  const activeCaption = active ? pickLocalized(active.caption, lang) : "";
  const activeQuote = active ? pickLocalized(active.quote, lang) : "";

  // Orientation-aware modal sizing (mp4 only): the modal box width is derived
  // from the video's native aspect ratio so a portrait clip stands tall and a
  // landscape clip spreads wide — the video always shows FULL, no bars.
  const isPortrait = videoAR !== null && videoAR < 0.95;
  // Portrait reserves less vertical budget for the info strip (it scrolls),
  // so tall clips open noticeably wider on phones — near full width on iPhone.
  const fitBoxStyle: CSSProperties | undefined =
    activeKind === "mp4" && videoAR !== null
      ? {
          width: `min(${theaterMode ? 1280 : isPortrait ? 600 : 900}px, calc(100vw - 24px), calc((100dvh - ${isPortrait ? 130 : 230}px) * ${videoAR.toFixed(4)}))`,
          maxWidth: "none",
        }
      : undefined;
  const fitMediaStyle: CSSProperties | undefined =
    activeKind === "mp4" && videoAR !== null
      ? { aspectRatio: `${videoAR.toFixed(4)}` }
      : undefined;

  const featured = videosData[0] ?? null;
  const featuredKind: VideoKind = featured ? detectKind(featured.file) : "mp4";
  const featuredCaption = featured ? pickLocalized(featured.caption, lang) : "";
  const featuredQuote = featured ? pickLocalized(featured.quote, lang) : "";
  // Spotlight card: thumb-first like the grid (a full 720p+ poster decodes to
  // several MB on iPhone); fall back to the full poster only if the thumb 404s.
  const featuredPosterFull =
    featured && featuredKind === "mp4" ? buildPoster(featured.file) : "";
  const featuredPosterThumb =
    featured && featuredKind === "mp4" ? buildPosterThumb(featured.file) : "";
  const [spotlightUseFull, setSpotlightUseFull] = useState(false);
  const featuredPoster =
    spotlightUseFull || !featuredPosterThumb
      ? featuredPosterFull
      : featuredPosterThumb;

  return (
    <div className="videos-page videos-luxe">
      <PhotoBackdrop />
      <section className="v-hero" dir="ltr">
        <span className="v-sparkle s1" aria-hidden="true" />
        <span className="v-sparkle s2" aria-hidden="true" />
        <span className="v-sparkle s3" aria-hidden="true" />
        <h1 className="v-hero-title">{t.videos_title}</h1>
        {p.videos_text && <p className="v-hero-sub">{p.videos_text}</p>}
        <div className="v-hero-line" />
      </section>

      <section className="v-stats" dir="ltr">
        <div className="v-stat">
          <div className="v-stat-label">{t.video_memory_label}</div>
          <div className="v-stat-value">{videosData.length}</div>
        </div>
      </section>

      {featured && (
        <section className="v-spotlight">
          <button
            type="button"
            className="v-spotlight-card"
            onClick={() => openModal(0)}
            aria-label={featuredCaption}
          >
            <div className="v-spotlight-media">
              {featuredPoster ? (
                <img
                  className="v-spotlight-img"
                  src={featuredPoster}
                  alt=""
                  aria-hidden="true"
                  loading="eager"
                  decoding="async"
                  draggable={false}
                  onError={() => {
                    if (
                      !spotlightUseFull &&
                      featuredPosterFull &&
                      featuredPosterFull !== featuredPosterThumb
                    ) {
                      setSpotlightUseFull(true);
                    }
                  }}
                />
              ) : (
                <div className="v-thumb-fallback" aria-hidden="true" />
              )}
              <div className="v-spotlight-scrim" aria-hidden="true" />
              <div className="v-play v-play-lg" aria-hidden="true">
                <PlayIcon />
              </div>
            </div>
            <div className="v-spotlight-body">
              <span className="v-spotlight-eyebrow">
                <span className="v-spotlight-dot" aria-hidden="true" />
                {t.video_featured}
              </span>
              <h2 className="v-spotlight-title">{featuredCaption}</h2>
              {featuredQuote && (
                <p className="v-spotlight-quote">{featuredQuote}</p>
              )}
              <span className="v-spotlight-cta">
                <PlayIcon />
                {t.video_watch}
              </span>
            </div>
          </button>
        </section>
      )}

      <div className="v-gallery">
        {videosData.slice(0, visibleCount).map((item, index) => {
          if (featured && index === 0) return null;
          const kind = detectKind(item.file);
          const caption = pickLocalized(item.caption, lang);
          const quote = pickLocalized(item.quote, lang);
          return (
            <RevealVideoCard
              key={item.file}
              className="v-card"
              index={index}
              onClick={() => openModal(index)}
              role="button"
              tabIndex={0}
              aria-label={caption}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  openModal(index);
                }
              }}
            >
              <div className="v-card-media">
                <Thumb file={item.file} kind={kind} />
                <div className="v-card-overlay" />
                {kind !== "mp4" && (
                  <span className="v-duration-badge v-duration-badge-kind">
                    {kind === "youtube" ? "YouTube" : "MEGA"}
                  </span>
                )}
              </div>
              <div className="v-card-body">
                <div className="v-date">
                  {t.video_memory_label} {index + 1}
                </div>
                <div className="v-title">{caption}</div>
                {quote && <div className="v-quote">{quote}</div>}
              </div>
            </RevealVideoCard>
          );
        })}
      </div>

      {visibleCount < videosData.length && (
        <div ref={sentinelRef} className="v-load-sentinel" aria-hidden="true" />
      )}

      {p.videos_footer && <div className="v-footer">{p.videos_footer}</div>}

      {active && (
        <div
          className={`v-modal active${theaterMode ? " v-modal-theater" : ""}`}
          role="dialog"
          aria-modal="true"
          aria-label={activeCaption}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          {videosData.length > 1 && (
            <>
              <button
                type="button"
                className="v-side-nav v-side-nav-prev"
                onClick={prevVideo}
                aria-label={t.common_prev}
              >
                <ChevronLeftIcon />
              </button>
              <button
                type="button"
                className="v-side-nav v-side-nav-next"
                onClick={nextVideo}
                aria-label={t.common_next}
              >
                <ChevronRightIcon />
              </button>
            </>
          )}

          <div
            className={`v-modal-box${videoAR !== null && activeKind === "mp4" ? (isPortrait ? " v-box-portrait" : " v-box-landscape") : ""}`}
            style={fitBoxStyle}
          >
            <button
              ref={closeBtnRef}
              type="button"
              className="v-close-btn"
              onClick={closeModal}
              aria-label={t.common_close}
            >
              <CloseIcon />
            </button>

            <div
              className={`v-modal-media v-modal-media-${activeKind}${fitMediaStyle ? " v-fit" : ""}`}
              style={fitMediaStyle}
            >
              {activeKind === "mp4" && (
                <video
                  ref={videoElRef}
                  key={active.file}
                  className="v-modal-video"
                  src={buildSrc(active.file)}
                  poster={buildPoster(active.file)}
                  preload="metadata"
                  controls
                  autoPlay
                  playsInline
                  onLoadedMetadata={(e) => {
                    const v = e.currentTarget;
                    if (v.videoWidth > 0 && v.videoHeight > 0) {
                      setVideoAR(v.videoWidth / v.videoHeight);
                    }
                  }}
                />
              )}
              {activeKind === "youtube" && (
                <iframe
                  key={active.file}
                  className="v-modal-iframe"
                  src={getYouTubeEmbed(active.file)}
                  title={activeCaption}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              )}
              {activeKind === "mega" && (
                <div className="v-modal-mega">
                  <div className="v-modal-mega-art" aria-hidden="true">
                    <PlayIcon />
                  </div>
                  <p className="v-modal-mega-text">{t.video_mega_text}</p>
                  <a
                    className="v-btn v-btn-accent v-btn-cta"
                    href={active.file}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t.video_mega_open}
                  </a>
                </div>
              )}
            </div>

            <div className="v-modal-info">
              <div className="v-modal-eyebrow">
                {t.video_memory_label} {(activeIndex ?? 0) + 1} /{" "}
                {videosData.length}
              </div>
              <h3 className="v-modal-title">{activeCaption}</h3>
              {activeQuote && <p className="v-modal-quote">{activeQuote}</p>}
              <div className="v-modal-actions">
                {activeKind === "mp4" && (
                  <>
                    <button
                      type="button"
                      className="v-btn v-btn-icon"
                      onClick={toggleTheater}
                      aria-label={
                        theaterMode
                          ? t.common_theater_compact
                          : t.common_theater_wide
                      }
                      aria-pressed={theaterMode}
                    >
                      {theaterMode ? <CompressIcon /> : <ExpandIcon />}
                    </button>
                    <button
                      type="button"
                      className="v-btn v-btn-icon"
                      onClick={toggleFullscreen}
                      aria-label={t.common_fullscreen}
                    >
                      <ExpandIcon />
                    </button>
                  </>
                )}
                <button
                  type="button"
                  className="v-btn v-btn-ghost"
                  onClick={closeModal}
                >
                  {t.common_close}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
