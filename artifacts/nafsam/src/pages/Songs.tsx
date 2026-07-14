import { useEffect, useRef, useState } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import PhotoBackdrop from "@/components/PhotoBackdrop";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import RevealCard from "@/components/RevealCard";
import { PAGE_AUDIO_PAUSE_EVENT, PAGE_AUDIO_RESUME_EVENT } from "@/hooks/usePageAudio";
import { mediaUrl } from "@/lib/r2";
import "@/styles/luxe-songs-writings.css";

interface Props {
  t: Translations;
  lang: Lang;
}

function isYouTube(src: string): boolean {
  return /youtube\.com|youtu\.be/i.test(src);
}

function youTubeId(src: string): string | null {
  const patterns = [
    /youtu\.be\/([A-Za-z0-9_-]{6,})/,
    /[?&]v=([A-Za-z0-9_-]{6,})/,
    /embed\/([A-Za-z0-9_-]{6,})/,
    /shorts\/([A-Za-z0-9_-]{6,})/,
  ];
  for (const re of patterns) {
    const m = src.match(re);
    if (m) return m[1];
  }
  return null;
}

/* Click-to-load YouTube player: shows the video thumbnail with a play button
   and only mounts the heavy iframe after a tap. Exactly one iframe is mounted
   at a time (activeId), which keeps memory low on iPhone. */
function YouTubeSongPlayer({
  id,
  title,
  playing,
  onPlay,
}: {
  id: string;
  title: string;
  playing: boolean;
  onPlay: () => void;
}) {
  if (playing) {
    return (
      <div className="yt-song-embed">
        <iframe
          src={`https://www.youtube.com/embed/${id}?autoplay=1&rel=0&modestbranding=1&playsinline=1`}
          title={title}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      </div>
    );
  }
  return (
    <button
      type="button"
      className="yt-song-facade"
      onClick={onPlay}
      aria-label={title}
    >
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt=""
        loading="lazy"
        draggable={false}
      />
      <span className="yt-song-play" aria-hidden="true">
        <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor">
          <path d="M8 5.5v13l11-6.5z" />
        </svg>
      </span>
    </button>
  );
}

export default function Songs({ t, lang }: Props) {
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const listRef = useRef<HTMLDivElement | null>(null);
  const [activeYt, setActiveYt] = useState<number | null>(null);

  // Starting a YouTube song: silence page audio and any playing <audio> cards.
  function playYt(index: number) {
    const root = listRef.current;
    if (root) {
      root
        .querySelectorAll<HTMLAudioElement>("audio.audio-player")
        .forEach((a) => {
          if (!a.paused) a.pause();
        });
    }
    window.dispatchEvent(new Event(PAGE_AUDIO_PAUSE_EVENT));
    setActiveYt(index);
  }

  useEffect(() => {
    const root = listRef.current;
    if (!root) return;

    let activeAudio: HTMLAudioElement | null = null;
    let anyPlaying = false;

    const updateGlobalState = () => {
      const allAudios = root.querySelectorAll<HTMLAudioElement>("audio.audio-player");
      const playing = Array.from(allAudios).some((a) => !a.paused && !a.ended);
      if (playing && !anyPlaying) {
        anyPlaying = true;
        window.dispatchEvent(new Event(PAGE_AUDIO_PAUSE_EVENT));
      } else if (!playing && anyPlaying) {
        anyPlaying = false;
        window.dispatchEvent(new Event(PAGE_AUDIO_RESUME_EVENT));
      }
    };

    const onPlay = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLAudioElement)) return;
      if (!target.classList.contains("audio-player")) return;

      const allAudios = root.querySelectorAll<HTMLAudioElement>("audio.audio-player");
      allAudios.forEach((a) => {
        if (a !== target && !a.paused) {
          a.pause();
        }
      });
      // Starting an mp3 song must also unmount any active YouTube player.
      setActiveYt(null);
      activeAudio = target;
      updateGlobalState();
    };

    const onPauseOrEnd = (e: Event) => {
      const target = e.target as HTMLElement | null;
      if (!target || !(target instanceof HTMLAudioElement)) return;
      if (!target.classList.contains("audio-player")) return;
      window.setTimeout(updateGlobalState, 50);
    };

    root.addEventListener("play", onPlay, true);
    root.addEventListener("pause", onPauseOrEnd, true);
    root.addEventListener("ended", onPauseOrEnd, true);

    return () => {
      root.removeEventListener("play", onPlay, true);
      root.removeEventListener("pause", onPauseOrEnd, true);
      root.removeEventListener("ended", onPauseOrEnd, true);
      if (activeAudio && !activeAudio.paused) {
        activeAudio.pause();
      }
      if (anyPlaying) {
        window.dispatchEvent(new Event(PAGE_AUDIO_RESUME_EVENT));
      }
    };
  }, []);

  const songTextKeys = [p.song1_text, p.song2_text, p.song3_text, p.song4_text];
  const songs = data?.songs ?? [];

  return (
    <div className="page-content luxe-songs">
      <PhotoBackdrop />
      <div className="luxe-specks" aria-hidden="true">
        <div className="luxe-speck"></div>
        <div className="luxe-speck"></div>
        <div className="luxe-speck"></div>
        <div className="luxe-speck"></div>
        <div className="luxe-speck"></div>
      </div>
      <div className="page-header luxe-page-header">
        <h1>{t.songs_title}</h1>
        <p>{t.songs_text}</p>
      </div>

      <div className="songs-list" ref={listRef}>
        {songs.map((s, i) => {
          const ytId = isYouTube(s.src) ? youTubeId(s.src) : null;
          return (
            <RevealCard key={i} className="song-card glass luxe-song-card" index={i}>
              <div className="luxe-vinyl-accent" aria-hidden="true"></div>
              <div className="luxe-song-content">
                <h3>{s.title}</h3>
                {songTextKeys[i] && <p>{songTextKeys[i]}</p>}
                {ytId ? (
                  <YouTubeSongPlayer
                    id={ytId}
                    title={s.title}
                    playing={activeYt === i}
                    onPlay={() => playYt(i)}
                  />
                ) : (
                  <audio
                    controls
                    preload="none"
                    src={mediaUrl(s.src)}
                    className="audio-player"
                  >
                    {t.audio_unsupported}
                  </audio>
                )}
              </div>
            </RevealCard>
          );
        })}
      </div>

      {p.songs_footer && <Footer text={p.songs_footer} />}
    </div>
  );
}
