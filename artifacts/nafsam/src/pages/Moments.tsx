import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import usePageAudio from "@/hooks/usePageAudio";
import { privateImage } from "@/lib/privateAssets";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";

interface Props {
  t: Translations;
  lang: Lang;
}

interface AlbumCard {
  src: string;
  title: string;
  subtitle: string;
}

interface VideoCard {
  file: string;
  title: string;
  subtitle: string;
  index: number;
}

interface TimelineEntry {
  time: string;
  title: string;
  text: string;
  memory: string;
}

const SECTION_LABELS: Record<Lang, {
  archive_title: string;
  archive_sub: string;
  album_title: string;
  album_sub: string;
  videos_title: string;
  videos_sub: string;
  timeline_title: string;
  timeline_sub: string;
  message_title: string;
  message_default: string;
  view_all: string;
  show_less: string;
  open_video: string;
  badge_photos: string;
  watch_now: string;
  share: string;
  like: string;
  download: string;
  home: string;
  close: string;
  previous: string;
  next: string;
}> = {
  ar: {
    archive_title: "أرشيف الذكريات",
    archive_sub: "كل لحظة جمعناها ستبقى هنا… جميلة، صادقة، لا تُنسى.",
    album_title: "ألبوم الصور",
    album_sub: "صور صغيرة… وذكريات لا تنتهي.",
    videos_title: "فيديوهات الذكريات",
    videos_sub: "مقاطع تحمل صوت الأيام التي مرّت.",
    timeline_title: "محطات من الذكرى",
    timeline_sub: "خطوات على طريقٍ من الحنين.",
    message_title: "رسالة أخيرة",
    message_default:
      "لسنا نكتب النهاية بدموع، بل بابتسامة وامتنان. شكرًا لأنكِ كنتِ جزءًا من أجمل فصول حياتي. سأحتفظ بكل شيء هنا… لا لإنكار الألم، بل لتقدير النعمة. أتمنى لكِ من القلب حياةً مليئة بالسلام والسعادة.",
    view_all: "عرض الكل",
    show_less: "عرض أقل",
    open_video: "فتح الفيديو",
    badge_photos: "صورة",
    watch_now: "تشغيل",
    share: "مشاركة",
    like: "إعجاب",
    download: "تحميل",
    home: "الرئيسية",
    close: "إغلاق",
    previous: "السابق",
    next: "التالي",
  },
  fa: {
    archive_title: "آرشیو خاطرات",
    archive_sub: "هر لحظه‌ای که جمع کردیم اینجا می‌ماند… زیبا، صادق، فراموش‌نشدنی.",
    album_title: "آلبوم عکس‌ها",
    album_sub: "عکس‌های کوچک… و خاطرات بی‌پایان.",
    videos_title: "ویدیوهای خاطرات",
    videos_sub: "قاب‌هایی از روزهایی که گذشت.",
    timeline_title: "ایستگاه‌های خاطره",
    timeline_sub: "گام‌هایی روی راهی از دلتنگی.",
    message_title: "آخرین پیام",
    message_default:
      "ما پایان را با اشک نمی‌نویسیم، با لبخند و قدردانی می‌نویسیم. ممنون که بخشی از زیباترین فصل‌های زندگی‌ام بودی.",
    view_all: "دیدن همه",
    show_less: "بستن",
    open_video: "باز کردن ویدیو",
    badge_photos: "عکس",
    watch_now: "پخش",
    share: "اشتراک",
    like: "پسندیدن",
    download: "دانلود",
    home: "خانه",
    close: "بستن",
    previous: "قبلی",
    next: "بعدی",
  },
  tr: {
    archive_title: "Anılar Arşivi",
    archive_sub: "Topladığımız her an burada kalacak… güzel, samimi, unutulmaz.",
    album_title: "Fotoğraf Albümü",
    album_sub: "Küçük kareler… bitmeyen anılar.",
    videos_title: "Anı Videoları",
    videos_sub: "Geçmiş günlerin sesini taşıyan kısa kareler.",
    timeline_title: "Anının Durakları",
    timeline_sub: "Bir hasret yolunda küçük adımlar.",
    message_title: "Son Mektup",
    message_default:
      "Sonu gözyaşıyla değil, bir gülümseme ve şükranla yazıyoruz. Hayatımın en güzel bölümlerinin bir parçası olduğun için teşekkürler.",
    view_all: "Tümünü Gör",
    show_less: "Daha Az",
    open_video: "Videoyu Aç",
    badge_photos: "fotoğraf",
    watch_now: "Oynat",
    share: "Paylaş",
    like: "Beğen",
    download: "İndir",
    home: "Ana Sayfa",
    close: "Kapat",
    previous: "Önceki",
    next: "Sonraki",
  },
  en: {
    archive_title: "Memory Archive",
    archive_sub: "Every moment we gathered will remain here… beautiful, honest, unforgettable.",
    album_title: "Photo Album",
    album_sub: "Small frames… endless memories.",
    videos_title: "Memory Videos",
    videos_sub: "Short clips carrying the sound of days that passed.",
    timeline_title: "Stations of Memory",
    timeline_sub: "Small steps along a road of longing.",
    message_title: "A Last Letter",
    message_default:
      "We do not write the ending with tears, but with a smile and gratitude. Thank you for being part of the most beautiful chapters of my life.",
    view_all: "View All",
    show_less: "Show Less",
    open_video: "Open Video",
    badge_photos: "photos",
    watch_now: "Play",
    share: "Share",
    like: "Like",
    download: "Download",
    home: "Home",
    close: "Close",
    previous: "Previous",
    next: "Next",
  },
};

const ALBUM_PREVIEW = 6;
const VIDEO_PREVIEW = 6;

function formatDuration(sec: number): string {
  if (!isFinite(sec) || sec <= 0) return "—";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

function VideoThumb({ file, onMeta }: { file: string; onMeta?: (d: number) => void }) {
  return (
    <video
      className="mem-vthumb-video"
      src={`/api/private/media/${encodeURIComponent(file)}#t=0.4`}
      preload="metadata"
      muted
      playsInline
      disablePictureInPicture
      draggable={false}
      onLoadedMetadata={(e) => onMeta?.(e.currentTarget.duration)}
    />
  );
}

export default function Moments({ t, lang }: Props) {
  usePageAudio("song1.mp3");
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const labels = SECTION_LABELS[lang] ?? SECTION_LABELS.ar;

  // ----- Album cards -----
  const langKey: Lang = data?.captions?.[lang] ? lang : "ar";
  const captions = data?.captions?.[langKey] ?? [];
  const allPhotos = data?.photos ?? [];
  const album: AlbumCard[] = useMemo(() => {
    return allPhotos.map((name, i) => {
      const story = captions[i];
      return {
        src: privateImage(`all_photos/${name}`),
        title: story?.title ?? `${labels.badge_photos} ${i + 1}`,
        subtitle: story?.text ?? "",
      };
    });
  }, [allPhotos, captions, labels.badge_photos]);

  const [albumExpanded, setAlbumExpanded] = useState(false);
  const visibleAlbum = albumExpanded ? album : album.slice(0, ALBUM_PREVIEW);

  // ----- Videos -----
  const videosRaw = data?.videos ?? [];
  const videos: VideoCard[] = useMemo(
    () =>
      videosRaw.map((v, i) => ({
        file: v.file,
        title: v.caption || v.title || `${labels.videos_title} ${i + 1}`,
        subtitle: v.quote || "",
        index: i,
      })),
    [videosRaw, labels.videos_title],
  );
  const [videosExpanded, setVideosExpanded] = useState(false);
  const visibleVideos = videosExpanded ? videos : videos.slice(0, VIDEO_PREVIEW);

  // Cache thumbnails durations
  const [durations, setDurations] = useState<Record<string, number>>({});
  const setDur = useCallback((file: string, d: number) => {
    setDurations((prev) => (prev[file] ? prev : { ...prev, [file]: d }));
  }, []);

  // ----- Timeline -----
  const timeline: TimelineEntry[] = useMemo(() => {
    const arr: TimelineEntry[] = [];
    for (let i = 1; i <= 9; i++) {
      const time = (p as Record<string, string | undefined>)[`moment${i}_time`];
      const title = (p as Record<string, string | undefined>)[`moment${i}_title`];
      const text = (p as Record<string, string | undefined>)[`moment${i}_text`];
      const memory = (p as Record<string, string | undefined>)[`moment${i}_memory`];
      if (time || title || text || memory) {
        arr.push({
          time: time ?? "",
          title: title ?? "",
          text: text ?? "",
          memory: memory ?? "",
        });
      }
    }
    return arr;
  }, [p]);

  // ----- Final message -----
  const farewell =
    data?.writings?.[lang]?.farewell_text ??
    data?.writings?.ar?.farewell_text ??
    labels.message_default;
  const farewellTitle =
    data?.writings?.[lang]?.farewell_title ??
    data?.writings?.ar?.farewell_title ??
    labels.message_title;

  // ----- Video modal -----
  const [activeVideo, setActiveVideo] = useState<number | null>(null);
  const closeVideo = useCallback(() => setActiveVideo(null), []);
  const nextVideo = useCallback(() => {
    setActiveVideo((i) => {
      if (i === null || videos.length === 0) return i;
      return (i + 1) % videos.length;
    });
  }, [videos.length]);
  const prevVideo = useCallback(() => {
    setActiveVideo((i) => {
      if (i === null || videos.length === 0) return i;
      return (i - 1 + videos.length) % videos.length;
    });
  }, [videos.length]);

  // ----- Photo lightbox -----
  const [lightbox, setLightbox] = useState<number | null>(null);
  const closeLightbox = useCallback(() => setLightbox(null), []);

  // Focus management for overlays
  const lastFocusedRef = useRef<HTMLElement | null>(null);
  const modalCloseRef = useRef<HTMLButtonElement | null>(null);
  const lightboxCloseRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    if (activeVideo === null && lightbox === null) return;
    lastFocusedRef.current = document.activeElement as HTMLElement | null;
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    // initial focus on the close button (delayed for mount)
    const focusTimer = window.setTimeout(() => {
      if (activeVideo !== null) modalCloseRef.current?.focus();
      else if (lightbox !== null) lightboxCloseRef.current?.focus();
    }, 30);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        closeVideo();
        closeLightbox();
      }
      if (activeVideo !== null) {
        if (e.key === "ArrowLeft") prevVideo();
        else if (e.key === "ArrowRight") nextVideo();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      window.clearTimeout(focusTimer);
      document.body.style.overflow = original;
      window.removeEventListener("keydown", onKey);
      // restore focus
      if (lastFocusedRef.current && document.contains(lastFocusedRef.current)) {
        lastFocusedRef.current.focus();
      }
    };
  }, [activeVideo, lightbox, closeVideo, closeLightbox, prevVideo, nextVideo]);

  const active = activeVideo !== null ? videos[activeVideo] : null;
  const isRTL = t.dir === "rtl";

  // Smooth scroll to anchor
  const scrollTo = useCallback((id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  return (
    <div className="mem-page" dir={t.dir}>
      <div className="mem-bg">
        <div className="mem-bg-grad" />
        <div className="mem-bg-bokeh">
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="mem-bokeh" style={bokehStyle(i)} />
          ))}
        </div>
      </div>

      <header className="mem-subnav">
        <button type="button" className="mem-subnav-link" onClick={() => scrollTo("mem-hero")}>
          {labels.home}
        </button>
        <button type="button" className="mem-subnav-link" onClick={() => scrollTo("mem-album")}>
          {labels.album_title}
        </button>
        <button type="button" className="mem-subnav-link" onClick={() => scrollTo("mem-videos")}>
          {labels.videos_title}
        </button>
        <button type="button" className="mem-subnav-link" onClick={() => scrollTo("mem-timeline")}>
          {labels.timeline_title}
        </button>
        <button type="button" className="mem-subnav-link" onClick={() => scrollTo("mem-message")}>
          {labels.message_title}
        </button>
      </header>

      {/* HERO */}
      <section id="mem-hero" className="mem-hero">
        <div className="mem-hero-inner">
          <span className="mem-hero-eyebrow">
            <HeartIcon /> {isRTL ? "ذكرياتنا" : "Our Memories"}
          </span>
          <h1 className="mem-hero-title">{labels.archive_title}</h1>
          <p className="mem-hero-sub">{p.moments_text || labels.archive_sub}</p>
          <div className="mem-divider">
            <span className="mem-divider-line" />
            <HeartIcon className="mem-divider-icon" />
            <span className="mem-divider-line" />
          </div>
        </div>
      </section>

      {/* PHOTO ALBUM */}
      <section id="mem-album" className="mem-section">
        <div className="mem-section-head">
          <div className="mem-section-titles">
            <h2 className="mem-section-title">
              <CameraIcon /> {labels.album_title}
            </h2>
            <p className="mem-section-sub">{labels.album_sub}</p>
          </div>
          {album.length > ALBUM_PREVIEW && (
            <button
              type="button"
              className="mem-pill"
              onClick={() => setAlbumExpanded((v) => !v)}
            >
              {albumExpanded ? labels.show_less : labels.view_all}
              <span className="mem-pill-count">{album.length}</span>
            </button>
          )}
        </div>

        <div className="mem-album-grid">
          {visibleAlbum.map((card, i) => (
            <button
              type="button"
              key={`${card.src}-${i}`}
              className="mem-album-card"
              onClick={() => setLightbox(i)}
            >
              <div className="mem-album-img-wrap">
                <img
                  className="mem-album-img"
                  src={card.src}
                  alt={card.title}
                  loading="lazy"
                />
                <div className="mem-album-shade" />
                <span className="mem-album-badge">{i + 1}</span>
              </div>
              <div className="mem-album-body">
                <span className="mem-album-title">{card.title}</span>
                {card.subtitle && (
                  <span className="mem-album-sub">{card.subtitle}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* VIDEOS */}
      <section id="mem-videos" className="mem-section">
        <div className="mem-section-head">
          <div className="mem-section-titles">
            <h2 className="mem-section-title">
              <PlayCircleIcon /> {labels.videos_title}
            </h2>
            <p className="mem-section-sub">{labels.videos_sub}</p>
          </div>
          {videos.length > VIDEO_PREVIEW && (
            <button
              type="button"
              className="mem-pill"
              onClick={() => setVideosExpanded((v) => !v)}
            >
              {videosExpanded ? labels.show_less : labels.view_all}
              <span className="mem-pill-count">{videos.length}</span>
            </button>
          )}
        </div>

        <div className="mem-video-grid">
          {visibleVideos.map((v) => (
            <button
              type="button"
              key={v.file}
              className="mem-video-card"
              onClick={() => setActiveVideo(v.index)}
            >
              <div className="mem-vthumb">
                <VideoThumb file={v.file} onMeta={(d) => setDur(v.file, d)} />
                <div className="mem-vthumb-shade" />
                <span className="mem-vplay">
                  <PlayIcon />
                </span>
                <span className="mem-vbadge">
                  {durations[v.file] ? formatDuration(durations[v.file]) : "•••"}
                </span>
              </div>
              <div className="mem-video-body">
                <span className="mem-video-title">{v.title}</span>
                {v.subtitle && (
                  <span className="mem-video-sub">{v.subtitle}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* TIMELINE */}
      {timeline.length > 0 && (
        <section id="mem-timeline" className="mem-section">
          <div className="mem-section-head">
            <div className="mem-section-titles">
              <h2 className="mem-section-title">
                <RouteIcon /> {labels.timeline_title}
              </h2>
              <p className="mem-section-sub">{labels.timeline_sub}</p>
            </div>
          </div>

          <TimelineRail
            entries={timeline}
            isRTL={isRTL}
            prevLabel={labels.previous}
            nextLabel={labels.next}
          />
        </section>
      )}

      {/* FINAL MESSAGE */}
      <section id="mem-message" className="mem-section mem-message-section">
        <div className="mem-message-card">
          <div className="mem-message-icon">
            <FeatherIcon />
          </div>
          <h2 className="mem-message-title">{farewellTitle}</h2>
          <div className="mem-message-body">
            {farewell.split("\n\n").map((para, i) => (
              <p key={i}>{para}</p>
            ))}
          </div>
          <div className="mem-message-foot">
            <HeartIcon className="mem-message-foot-heart" />
          </div>
        </div>
      </section>

      {/* VIDEO MODAL */}
      {active && (
        <div
          className="mem-modal"
          role="dialog"
          aria-modal="true"
          aria-label={active.title}
          onClick={(e) => {
            if (e.target === e.currentTarget) closeVideo();
          }}
        >
          <div className="mem-modal-card">
            <div className="mem-modal-head">
              <div className="mem-modal-titles">
                <span className="mem-modal-eyebrow">
                  {labels.videos_title} • {(activeVideo ?? 0) + 1} / {videos.length}
                </span>
                <h3 className="mem-modal-title">{active.title}</h3>
              </div>
              <button
                ref={modalCloseRef}
                type="button"
                className="mem-icon-btn"
                onClick={closeVideo}
                aria-label={labels.close}
              >
                <CloseIcon />
              </button>
            </div>

            <div className="mem-modal-video-wrap">
              <video
                key={active.file}
                className="mem-modal-video"
                src={`/api/private/media/${encodeURIComponent(active.file)}`}
                controls
                autoPlay
                playsInline
              />
            </div>

            <div className="mem-modal-body">
              {active.subtitle && (
                <p className="mem-modal-quote">{active.subtitle}</p>
              )}
              <div className="mem-modal-actions">
                <button
                  type="button"
                  className="mem-icon-btn"
                  onClick={prevVideo}
                  aria-label={labels.previous}
                >
                  {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
                </button>
                <button type="button" className="mem-action-btn">
                  <HeartIcon /> <span>{labels.like}</span>
                </button>
                <a
                  className="mem-action-btn"
                  href={`/api/private/media/${encodeURIComponent(active.file)}`}
                  download
                >
                  <DownloadIcon /> <span>{labels.download}</span>
                </a>
                <button
                  type="button"
                  className="mem-action-btn"
                  onClick={() => {
                    const url = `${window.location.origin}/api/private/media/${encodeURIComponent(active.file)}`;
                    if (navigator.share) {
                      navigator.share({ title: active.title, url }).catch(() => {});
                    } else {
                      navigator.clipboard?.writeText(url).catch(() => {});
                    }
                  }}
                >
                  <ShareIcon /> <span>{labels.share}</span>
                </button>
                <button
                  type="button"
                  className="mem-icon-btn"
                  onClick={nextVideo}
                  aria-label={labels.next}
                >
                  {isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHOTO LIGHTBOX */}
      {lightbox !== null && album[lightbox] && (
        <div
          className="mem-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={album[lightbox].title}
          onClick={closeLightbox}
        >
          <button
            ref={lightboxCloseRef}
            className="mem-icon-btn mem-lightbox-close"
            onClick={(e) => {
              e.stopPropagation();
              closeLightbox();
            }}
            aria-label={labels.close}
          >
            <CloseIcon />
          </button>
          <figure className="mem-lightbox-figure" onClick={(e) => e.stopPropagation()}>
            <img src={album[lightbox].src} alt={album[lightbox].title} />
            <figcaption>
              <strong>{album[lightbox].title}</strong>
              {album[lightbox].subtitle && <span>{album[lightbox].subtitle}</span>}
            </figcaption>
          </figure>
        </div>
      )}

      {p.moments_footer && <div className="mem-footer">{p.moments_footer}</div>}
    </div>
  );
}

function TimelineRail({
  entries,
  isRTL,
  prevLabel,
  nextLabel,
}: {
  entries: TimelineEntry[];
  isRTL: boolean;
  prevLabel: string;
  nextLabel: string;
}) {
  const railRef = useRef<HTMLDivElement>(null);

  const scrollBy = (dir: 1 | -1) => {
    const el = railRef.current;
    if (!el) return;
    const step = el.clientWidth * 0.8;
    el.scrollBy({ left: dir * step * (isRTL ? -1 : 1), behavior: "smooth" });
  };

  return (
    <div className="mem-timeline-wrap">
      <button
        type="button"
        className="mem-timeline-nav mem-timeline-nav-prev"
        onClick={() => scrollBy(-1)}
        aria-label={prevLabel}
      >
        {isRTL ? <ChevronRightIcon /> : <ChevronLeftIcon />}
      </button>

      <div className="mem-timeline-rail" ref={railRef}>
        <div className="mem-timeline-track" />
        {entries.map((e, i) => (
          <div key={i} className="mem-timeline-stop">
            <div className="mem-timeline-dot">
              <span className="mem-timeline-dot-glow" />
              <span className="mem-timeline-dot-core" />
            </div>
            {e.time && <span className="mem-timeline-time">{e.time}</span>}
            {e.title && <h4 className="mem-timeline-title">{e.title}</h4>}
            {e.text && <p className="mem-timeline-text">{e.text}</p>}
            {e.memory && <blockquote className="mem-timeline-memory">{e.memory}</blockquote>}
          </div>
        ))}
      </div>

      <button
        type="button"
        className="mem-timeline-nav mem-timeline-nav-next"
        onClick={() => scrollBy(1)}
        aria-label={nextLabel}
      >
        {isRTL ? <ChevronLeftIcon /> : <ChevronRightIcon />}
      </button>
    </div>
  );
}

// ----- bokeh -----
function bokehStyle(i: number): React.CSSProperties {
  const seed = (n: number) => {
    const x = Math.sin(n * 9301 + 49297) * 233280;
    return x - Math.floor(x);
  };
  const top = seed(i + 1) * 100;
  const left = seed(i + 7) * 100;
  const size = 80 + seed(i + 13) * 220;
  const delay = seed(i + 19) * 6;
  const opacity = 0.18 + seed(i + 23) * 0.28;
  return {
    top: `${top}%`,
    left: `${left}%`,
    width: `${size}px`,
    height: `${size}px`,
    animationDelay: `${delay}s`,
    opacity,
  };
}

// ----- icons (inline SVG, currentColor) -----
function HeartIcon({ className = "" }: { className?: string }) {
  return (
    <svg className={className} width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 21s-7.5-4.6-9.6-9.2C.7 8.1 3 4 7 4c2 0 3.5 1 5 3 1.5-2 3-3 5-3 4 0 6.3 4.1 4.6 7.8C19.5 16.4 12 21 12 21z" />
    </svg>
  );
}
function CameraIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <rect x="3" y="6.5" width="18" height="13" rx="2.5" />
      <circle cx="12" cy="13" r="3.5" />
      <path d="M8 6.5l1.5-2h5L16 6.5" />
    </svg>
  );
}
function PlayCircleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="12" cy="12" r="9" />
      <path d="M10 8.5l5 3.5-5 3.5z" fill="currentColor" stroke="none" />
    </svg>
  );
}
function PlayIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
function RouteIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6">
      <circle cx="6" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.5 6H15a4 4 0 0 1 0 8H9a4 4 0 0 0 0 8h6.5" />
    </svg>
  );
}
function FeatherIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
      <line x1="16" y1="8" x2="2" y2="22" />
      <line x1="17.5" y1="15" x2="9" y2="15" />
    </svg>
  );
}
function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M6 6l12 12M18 6L6 18" />
    </svg>
  );
}
function ChevronLeftIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 6l-6 6 6 6" />
    </svg>
  );
}
function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 6l6 6-6 6" />
    </svg>
  );
}
function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4v12" />
      <path d="M7 11l5 5 5-5" />
      <path d="M5 20h14" />
    </svg>
  );
}
function ShareIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="12" r="2.5" />
      <circle cx="18" cy="6" r="2.5" />
      <circle cx="18" cy="18" r="2.5" />
      <path d="M8.2 11l7.6-4M8.2 13l7.6 4" />
    </svg>
  );
}
