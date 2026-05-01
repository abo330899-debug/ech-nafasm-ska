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

  const songs = [
    { title: "Be Koja Residi — Dorcci", text: p.song1_text, src: "/api/private/media/song1.mp3" },
    { title: "Ghatle Amd — Dorcci", text: p.song2_text, src: "/api/private/media/song2.mp3" },
    { title: t.song3_title, text: p.song3_text, src: "/api/private/media/song3.mp3" },
    { title: t.song4_title, text: p.song4_text, src: "/api/private/media/song4.mp3" },
    { title: "Hey To — Amir Khoshnegar", text: undefined, src: "/api/private/media/song5.mp3" },
    { title: "Kusura Bakma — Blok3", text: undefined, src: "/api/private/media/song6.mp3" },
    { title: "Bi To", text: undefined, src: "/api/private/media/song7.mp3" },
    { title: "Ghermez — Poobon", text: undefined, src: "/api/private/media/song8.mp3" },
    { title: "Jonoon — Hayedeh & Moein", text: undefined, src: "/api/private/media/song9.mp3" },
    { title: "Shahkar (Remix) — Savash", text: undefined, src: "/api/private/media/song10.mp3" },
    { title: "Tabestoon Kootahe — Zedbazi", text: undefined, src: "/api/private/media/song11.mp3" },
    { title: "Tabestoon Kootahe", text: undefined, src: "/api/private/media/song12.mp3" },
    { title: "Hayedeh (AI)", text: undefined, src: "/api/private/media/song13.mp3" },
    { title: "Ghatle Amd (Guitar, Slowed) — Dorcci", text: undefined, src: "/api/private/media/song14.mp3" },
    { title: "Ghalbam Roo Tekrare", text: undefined, src: "/api/private/media/song15.mp3" },
    { title: "Moteasefane — Majid Razavi", text: undefined, src: "/api/private/media/song16.mp3" },
    { title: "Moohash — Javad Ara", text: undefined, src: "/api/private/media/song17.mp3" },
    { title: "Duset Daram — Nivad", text: undefined, src: "/api/private/media/song18.mp3" },
  ];

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
            {s.text && <p>{s.text}</p>}
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
