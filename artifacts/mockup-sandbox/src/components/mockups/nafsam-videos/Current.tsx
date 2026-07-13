import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import "./_group.css";

function useReveal<T extends HTMLElement = HTMLElement>() {
  const ref = useRef<T | null>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (
      typeof window === "undefined" ||
      typeof IntersectionObserver === "undefined"
    ) {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setInView(true);
            io.unobserve(e.target);
          }
        }
      },
      { root: null, rootMargin: "0px 0px 20% 0px", threshold: 0.02 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}

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

type VideoKind = "mp4" | "youtube" | "mega";

interface VideoItem {
  file: string;
  poster: string;
  caption: string;
  quote: string;
}

const MEMS = [
  "/__mockup/images/nafsam-videos/mem1.png",
  "/__mockup/images/nafsam-videos/mem2.png",
  "/__mockup/images/nafsam-videos/mem3.png",
  "/__mockup/images/nafsam-videos/mem4.png",
  "/__mockup/images/nafsam-videos/mem5.png",
  "/__mockup/images/nafsam-videos/mem6.png",
];

const HERO = "/__mockup/images/nafsam-videos/hero.png";

const CAPTIONS: { caption: string; quote: string }[] = [
  {
    caption: "أول مساءٍ جمعنا",
    quote: "كان الضوء خافتًا، وكنتِ أنتِ كلّ ما أراه",
  },
  {
    caption: "ضحكتكِ تحت المطر",
    quote: "قطراتٌ على وجهكِ، وقلبي يرقص فرحًا",
  },
  {
    caption: "طريقنا الطويل",
    quote: "لم تكن المسافةُ تعنينا، ما دامت يدُكِ في يدي",
  },
  {
    caption: "قهوة الصباح",
    quote: "رشفةٌ دافئة، وحديثٌ لا ينتهي عن أحلامنا",
  },
  {
    caption: "غروبٌ على الشاطئ",
    quote: "احترقت الشمس شوقًا، كما احترق قلبي إليكِ",
  },
  {
    caption: "رقصتنا الأولى",
    quote: "دارت بنا الأنغام، فنسينا العالم كلّه",
  },
  {
    caption: "ليلة النجوم",
    quote: "عددنا النجوم، فوجدنا حبّنا أكبر منها",
  },
  {
    caption: "همسةٌ عند الوداع",
    quote: "قلتِ سأعود، فصار الانتظار أجملَ من اللقاء",
  },
  {
    caption: "ذكرى لا تُنسى",
    quote: "مهما مرّت الأيام، يبقى وجهُكِ في ذاكرتي",
  },
];

const VIDEOS: VideoItem[] = CAPTIONS.map((c, i) => ({
  file: `mock-video-${i + 1}`,
  poster: i === 0 ? HERO : MEMS[(i - 1) % MEMS.length],
  caption: c.caption,
  quote: c.quote,
}));

const LABELS = {
  title: "الفيديوهات",
  subtitle: "لحظاتٌ صغيرة صارت ذكرياتٍ كبيرة... نحفظها كي لا يطويها النسيان",
  memoryLabel: "ذكرى",
  memoryCount: "٢٤٥",
  featured: "مميز",
  watch: "شاهد الآن",
  close: "إغلاق",
  prev: "السابق",
  next: "التالي",
  fullscreen: "ملء الشاشة",
  theaterWide: "وضع المسرح",
  theaterCompact: "وضع مضغوط",
  footer: "كل ذكرى نجمة في سمائنا",
};

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

function Thumb({ poster }: { poster: string; kind: VideoKind }) {
  const [imgFailed, setImgFailed] = useState(false);
  return (
    <div className="v-thumb">
      {!imgFailed ? (
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

export function Current() {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [theaterMode, setTheaterMode] = useState(false);
  const closeBtnRef = useRef<HTMLButtonElement>(null);
  const videoElRef = useRef<HTMLVideoElement>(null);
  const lastFocusedRef = useRef<HTMLElement | null>(null);

  const videosData = VIDEOS;

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
    if (el.requestFullscreen) el.requestFullscreen();
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
  const activeKind: VideoKind = "mp4";
  const activeCaption = active ? active.caption : "";
  const activeQuote = active ? active.quote : "";

  const featured = videosData[0] ?? null;
  const featuredCaption = featured ? featured.caption : "";
  const featuredQuote = featured ? featured.quote : "";
  const featuredPoster = featured ? featured.poster : "";

  return (
    <div className="nafsam-videos-root" dir="rtl" lang="ar">
      <div className="videos-page videos-luxe">
        <section className="v-hero" dir="ltr">
          <h1 className="v-hero-title">{LABELS.title}</h1>
          <p className="v-hero-sub">{LABELS.subtitle}</p>
          <div className="v-hero-line" />
        </section>

        <section className="v-stats" dir="ltr">
          <div className="v-stat">
            <div className="v-stat-label">{LABELS.memoryLabel}</div>
            <div className="v-stat-value">{LABELS.memoryCount}</div>
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
                  {LABELS.featured}
                </span>
                <h2 className="v-spotlight-title">{featuredCaption}</h2>
                {featuredQuote && (
                  <p className="v-spotlight-quote">{featuredQuote}</p>
                )}
                <span className="v-spotlight-cta">
                  <PlayIcon />
                  {LABELS.watch}
                </span>
              </div>
            </button>
          </section>
        )}

        <div className="v-gallery">
          {videosData.map((item, index) => {
            if (featured && index === 0) return null;
            const kind: VideoKind = "mp4";
            const caption = item.caption;
            const quote = item.quote;
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
                  <Thumb poster={item.poster} kind={kind} />
                  <div className="v-card-overlay" />
                </div>
                <div className="v-card-body">
                  <div className="v-date">
                    {LABELS.memoryLabel} {index + 1}
                  </div>
                  <div className="v-title">{caption}</div>
                  {quote && <div className="v-quote">{quote}</div>}
                </div>
              </RevealVideoCard>
            );
          })}
        </div>

        <div className="v-footer">{LABELS.footer}</div>

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
                  aria-label={LABELS.prev}
                >
                  <ChevronLeftIcon />
                </button>
                <button
                  type="button"
                  className="v-side-nav v-side-nav-next"
                  onClick={nextVideo}
                  aria-label={LABELS.next}
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
                aria-label={LABELS.close}
              >
                <CloseIcon />
              </button>

              <div className={`v-modal-media v-modal-media-${activeKind}`}>
                <video
                  ref={videoElRef}
                  key={active.file}
                  className="v-modal-video"
                  poster={active.poster}
                  preload="metadata"
                  controls
                  playsInline
                />
              </div>

              <div className="v-modal-info">
                <div className="v-modal-eyebrow">
                  {LABELS.memoryLabel} {(activeIndex ?? 0) + 1} /{" "}
                  {videosData.length}
                </div>
                <h3 className="v-modal-title">{activeCaption}</h3>
                {activeQuote && <p className="v-modal-quote">{activeQuote}</p>}
                <div className="v-modal-actions">
                  <button
                    type="button"
                    className="v-btn v-btn-icon"
                    onClick={toggleTheater}
                    aria-label={
                      theaterMode
                        ? LABELS.theaterCompact
                        : LABELS.theaterWide
                    }
                    aria-pressed={theaterMode}
                  >
                    {theaterMode ? <CompressIcon /> : <ExpandIcon />}
                  </button>
                  <button
                    type="button"
                    className="v-btn v-btn-icon"
                    onClick={toggleFullscreen}
                    aria-label={LABELS.fullscreen}
                  >
                    <ExpandIcon />
                  </button>
                  <button
                    type="button"
                    className="v-btn v-btn-ghost"
                    onClick={closeModal}
                  >
                    {LABELS.close}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
