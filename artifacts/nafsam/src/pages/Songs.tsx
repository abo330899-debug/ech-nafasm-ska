import { useEffect, useRef } from "react";
import { type Translations, type Lang } from "@/i18n/translations";
import Footer from "@/components/Footer";
import { usePrivateContent, pickLangPages } from "@/hooks/usePrivateContent";
import RevealCard from "@/components/RevealCard";
import { PAGE_AUDIO_PAUSE_EVENT, PAGE_AUDIO_RESUME_EVENT } from "@/hooks/usePageAudio";

interface Props {
  t: Translations;
  lang: Lang;
}

export default function Songs({ t, lang }: Props) {
  const data = usePrivateContent();
  const p = pickLangPages(data, lang);
  const listRef = useRef<HTMLDivElement | null>(null);

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
    <div className="page-content">
      <div className="page-header">
        <h1>{t.songs_title}</h1>
        <p>{t.songs_text}</p>
      </div>

      <div className="songs-list" ref={listRef}>
        {songs.map((s, i) => (
          <RevealCard key={i} className="song-card glass" index={i}>
            <h3>{s.title}</h3>
            {songTextKeys[i] && <p>{songTextKeys[i]}</p>}
            <audio
              controls
              preload="none"
              src={s.src}
              className="audio-player"
            >
              Your browser does not support audio.
            </audio>
          </RevealCard>
        ))}
      </div>

      {p.songs_footer && <Footer text={p.songs_footer} />}
    </div>
  );
}
