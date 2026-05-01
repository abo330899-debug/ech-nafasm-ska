import { useEffect, useRef } from "react";

const BASE = import.meta.env.BASE_URL;

const TARGET_VOLUME = 0.30;
const START_VOLUME = 0.10;
const FADE_IN_MS = 10_000;
const FADE_OUT_MS = 1_200;
const START_AT_SECONDS = 35;

export const PAGE_AUDIO_PAUSE_EVENT = "nafsam:pause-page-audio";
export const PAGE_AUDIO_RESUME_EVENT = "nafsam:resume-page-audio";

export default function usePageAudio(songFile: string) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const isLogin = songFile === "login_song.mp3";
    const src = isLogin
      ? `${BASE}media/${songFile}`
      : `/api/private/media/${encodeURIComponent(songFile)}`;

    const audio = new Audio(src);
    audio.loop = true;
    audio.volume = START_VOLUME;
    audio.preload = "auto";
    audioRef.current = audio;

    let fadeRaf = 0;
    let externallyPaused = false;

    const cancelFade = () => {
      if (fadeRaf) {
        cancelAnimationFrame(fadeRaf);
        fadeRaf = 0;
      }
    };

    const fadeTo = (target: number, durationMs: number, onDone?: () => void) => {
      cancelFade();
      const start = performance.now();
      const from = audio.volume;
      const tick = (now: number) => {
        const t = Math.min(1, (now - start) / durationMs);
        const eased = t * (2 - t);
        audio.volume = Math.max(0, Math.min(1, from + (target - from) * eased));
        if (t < 1) {
          fadeRaf = requestAnimationFrame(tick);
        } else {
          fadeRaf = 0;
          onDone?.();
        }
      };
      fadeRaf = requestAnimationFrame(tick);
    };

    const startPlayback = () => {
      const seekTarget = !isLogin ? START_AT_SECONDS : 0;
      const trySeek = () => {
        try {
          if (
            seekTarget > 0 &&
            (audio.duration === Infinity || audio.duration > seekTarget + 1)
          ) {
            audio.currentTime = seekTarget;
          }
        } catch {
          /* noop */
        }
      };
      if (audio.readyState >= 1) {
        trySeek();
      } else {
        audio.addEventListener("loadedmetadata", trySeek, { once: true });
      }
      audio.volume = START_VOLUME;
      audio
        .play()
        .then(() => {
          fadeTo(TARGET_VOLUME, FADE_IN_MS);
        })
        .catch(() => {
          const resume = () => {
            audio.play().then(() => fadeTo(TARGET_VOLUME, FADE_IN_MS)).catch(() => {});
            window.removeEventListener("pointerdown", resume);
            window.removeEventListener("keydown", resume);
          };
          window.addEventListener("pointerdown", resume, { once: true });
          window.addEventListener("keydown", resume, { once: true });
        });
    };

    startPlayback();

    const onExternalPause = () => {
      if (audio.paused) return;
      externallyPaused = true;
      fadeTo(0, 600, () => {
        audio.pause();
      });
    };
    const onExternalResume = () => {
      if (!externallyPaused) return;
      externallyPaused = false;
      audio.play().then(() => fadeTo(TARGET_VOLUME, 2500)).catch(() => {});
    };
    window.addEventListener(PAGE_AUDIO_PAUSE_EVENT, onExternalPause);
    window.addEventListener(PAGE_AUDIO_RESUME_EVENT, onExternalResume);

    return () => {
      window.removeEventListener(PAGE_AUDIO_PAUSE_EVENT, onExternalPause);
      window.removeEventListener(PAGE_AUDIO_RESUME_EVENT, onExternalResume);
      const dyingAudio = audio;
      cancelFade();
      const startVol = dyingAudio.volume;
      const startTime = performance.now();
      const fadeOut = (now: number) => {
        const t = Math.min(1, (now - startTime) / FADE_OUT_MS);
        dyingAudio.volume = Math.max(0, startVol * (1 - t));
        if (t < 1) {
          requestAnimationFrame(fadeOut);
        } else {
          dyingAudio.pause();
          dyingAudio.src = "";
        }
      };
      requestAnimationFrame(fadeOut);
      audioRef.current = null;
    };
  }, [songFile]);
}
