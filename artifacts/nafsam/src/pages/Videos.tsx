import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import useReveal from "@/hooks/useReveal";
import { mediaUrl, posterUrl } from "@/lib/r2";

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

const BATCH = 18;

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
  if (kind !== "mp4") {
    return (
      <div className="v-thumb v-thumb-static">
        <div className="v-thumb-fallback" aria-hidden="true" />
        <div className="v-play" aria-hidden="true">
          <PlayIcon />
        </div>
      </div>
    );
  }
  const poster = buildPoster(file);
  return (
    <div className="v-thumb">
      {poster && !imgFailed ? (
        <>
          <img
            className="v-thumb-bg"
            src={poster}
            alt=""
            aria-hidden="true"
            loading="lazy"
            decoding="async"
            draggable={false}
          />
          <img
            className="v-thumb-fg"
            src={poster}
            alt=""
            loading="lazy"
            decoding="async"
            draggable={false}
            onError={() => setImgFailed(true)}
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const videosData = data?.videos ?? [];
  void lang;

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
      { root: null, rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [videosData.length]);

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const closeModal = useCallback(() => {
    setActiveIndex(null);
    setTheaterMode(false);
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
    setActiveIndex((i) => {
      if (i === null || videosData.length === 0) return i;
      return (i - 1 + videosData.length) % videosData.length;
    });
  }, [videosData.length]);

  const nextVideo = useCallback(() => {
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

  return (
    <div className="videos-page videos-luxe">
      <PhotoBackdrop />
      <section className="v-hero" dir="ltr">
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

      <div className="v-gallery">
        {videosData.slice(0, visibleCount).map((item, index) => {
          const kind = detectKind(item.file);
          return (
            <RevealVideoCard
              key={item.file}
              className="v-card"
              index={index}
              onClick={() => openModal(index)}
              role="button"
              tabIndex={0}
              aria-label={item.caption}
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
                <div className="v-title">{item.caption}</div>
                {item.quote && <div className="v-quote">{item.quote}</div>}
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
          aria-label={active.caption}
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

          <div className="v-modal-box">
            <button
              ref={closeBtnRef}
              type="button"
              className="v-close-btn"
              onClick={closeModal}
              aria-label={t.common_close}
            >
              <CloseIcon />
            </button>

            <div className={`v-modal-media v-modal-media-${activeKind}`}>
              {activeKind === "mp4" && (
                <video
                  ref={videoElRef}
                  key={active.file}
                  className="v-modal-video"
                  src={buildSrc(active.file)}
                  poster={buildPoster(active.file)}
                  controls
                  autoPlay
                  playsInline
                />
              )}
              {activeKind === "youtube" && (
                <iframe
                  key={active.file}
                  className="v-modal-iframe"
                  src={getYouTubeEmbed(active.file)}
                  title={active.caption}
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
              <h3 className="v-modal-title">{active.caption}</h3>
              {active.quote && <p className="v-modal-quote">{active.quote}</p>}
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
