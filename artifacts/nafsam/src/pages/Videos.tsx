import { useCallback, useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import useReveal from "@/hooks/useReveal";

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

function detectKind(file: string): VideoKind {
  if (/youtube\.com|youtu\.be/i.test(file)) return "youtube";
  if (/mega\.nz|mega\.co\.nz/i.test(file)) return "mega";
  return "mp4";
}

function buildSrc(file: string) {
  if (/^https?:\/\//i.test(file)) return file;
  return `/api/private/media/${encodeURIComponent(file)}`;
}

function buildPoster(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  const base = file.replace(/\.[^.]+$/, "");
  return `/api/private/posters/${encodeURIComponent(base)}.jpg`;
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

function Thumb({
  file,
  kind,
}: {
  file: string;
  kind: VideoKind;
}) {
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
        <img
          src={poster}
          alt=""
          loading="lazy"
          decoding="async"
          draggable={false}
          onError={() => setImgFailed(true)}
        />
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
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const videosData = data?.videos ?? [];
  const isRTL = lang === "ar" || lang === "fa";

  const openModal = useCallback((index: number) => {
    setActiveIndex(index);
  }, []);

  const closeModal = useCallback(() => setActiveIndex(null), []);

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
    const focusTimer = window.setTimeout(() => closeBtnRef.current?.focus(), 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
      else if (e.key === "ArrowLeft") (isRTL ? nextVideo : prevVideo)();
      else if (e.key === "ArrowRight") (isRTL ? prevVideo : nextVideo)();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = originalOverflow;
      window.removeEventListener("keydown", onKey);
      lastFocusedRef.current?.focus?.();
    };
  }, [activeIndex, closeModal, prevVideo, nextVideo, isRTL]);

  const active = activeIndex !== null ? videosData[activeIndex] ?? null : null;
  const activeKind: VideoKind = active ? detectKind(active.file) : "mp4";

  return (
    <div className="videos-page videos-luxe">
      <section className="v-hero" dir={isRTL ? "rtl" : "ltr"}>
        <h1 className="v-hero-title">{t.videos_title}</h1>
        {p.videos_text && <p className="v-hero-sub">{p.videos_text}</p>}
        <div className="v-hero-line" />
      </section>

      <section className="v-stats" dir={isRTL ? "rtl" : "ltr"}>
        <div className="v-stat">
          <div className="v-stat-label">{t.video_memory_label}</div>
          <div className="v-stat-value">{videosData.length}</div>
        </div>
      </section>

      <div className="v-gallery">
        {videosData.map((item, index) => {
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

      {p.videos_footer && <div className="v-footer">{p.videos_footer}</div>}

      {active && (
        <div
          className="v-modal active"
          role="dialog"
          aria-modal="true"
          aria-label={active.caption}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeModal();
          }}
        >
          <div className="v-modal-box">
            <button
              ref={closeBtnRef}
              type="button"
              className="v-close-btn"
              onClick={closeModal}
              aria-label={isRTL ? "إغلاق" : "Close"}
            >
              <CloseIcon />
            </button>

            <div className={`v-modal-media v-modal-media-${activeKind}`}>
              {activeKind === "mp4" && (
                <video
                  key={active.file}
                  className="v-modal-video"
                  src={buildSrc(active.file)}
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
                  <p className="v-modal-mega-text">
                    {isRTL
                      ? "هذا الفيديو محفوظ في MEGA. اضغط لفتحه في تبويب جديد."
                      : "This video is hosted on MEGA. Open it in a new tab."}
                  </p>
                  <a
                    className="v-btn v-btn-accent v-btn-cta"
                    href={active.file}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {isRTL ? "فتح الفيديو" : "Open video"}
                  </a>
                </div>
              )}
            </div>

            <div className="v-modal-info">
              <div className="v-modal-eyebrow">
                {t.video_memory_label} {(activeIndex ?? 0) + 1} / {videosData.length}
              </div>
              <h3 className="v-modal-title">{active.caption}</h3>
              {active.quote && <p className="v-modal-quote">{active.quote}</p>}
              <div className="v-modal-actions">
                <button
                  type="button"
                  className="v-btn v-btn-icon"
                  onClick={prevVideo}
                  aria-label={isRTL ? "السابق" : "Previous"}
                >
                  {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn-icon"
                  onClick={nextVideo}
                  aria-label={isRTL ? "التالي" : "Next"}
                >
                  {isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>
                <button
                  type="button"
                  className="v-btn v-btn-ghost"
                  onClick={closeModal}
                >
                  {isRTL ? "إغلاق" : "Close"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
