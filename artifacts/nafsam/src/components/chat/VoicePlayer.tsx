import { useEffect, useMemo, useRef, useState } from "react";
import { Play, Pause } from "lucide-react";
import { useChat } from "@/chat/chatContext";

interface Props {
  path: string;
  durationMs: number;
  mine: boolean;
}

const BAR_COUNT = 34;

// Deterministic, instant "waveform" derived from the storage path. Decoding real
// peaks for every clip on scroll is heavy and brittle across webm/mp4; a stable
// pseudo-waveform keeps the premium look without the cost, and the playback
// progress fill is what actually communicates position.
function barHeights(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < BAR_COUNT; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    out.push(0.25 + (h % 1000) / 1000 * 0.75);
  }
  return out;
}

function fmt(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  const m = Math.floor(total / 60);
  const sec = total % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

// Module-level guard so only one voice message plays at a time.
let currentAudio: HTMLAudioElement | null = null;

export default function VoicePlayer({ path, durationMs, mine }: Props) {
  const { imageUrl } = useChat();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [playing, setPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const [loading, setLoading] = useState(false);

  const bars = useMemo(() => barHeights(path), [path]);
  const totalMs =
    durationMs ||
    (audioRef.current && isFinite(audioRef.current.duration)
      ? audioRef.current.duration * 1000
      : 0);

  useEffect(() => {
    return () => {
      const a = audioRef.current;
      if (a) {
        a.pause();
        if (currentAudio === a) currentAudio = null;
      }
    };
  }, []);

  async function ensureUrl(): Promise<string | null> {
    if (url) return url;
    setLoading(true);
    const u = await imageUrl(path);
    setLoading(false);
    if (u) setUrl(u);
    return u;
  }

  async function toggle() {
    const u = await ensureUrl();
    if (!u) return;
    let a = audioRef.current;
    if (!a) {
      a = new Audio(u);
      audioRef.current = a;
      a.addEventListener("timeupdate", () => {
        const dur = isFinite(a!.duration) && a!.duration > 0 ? a!.duration : 0;
        setElapsed(a!.currentTime * 1000);
        if (dur) setProgress(a!.currentTime / dur);
      });
      a.addEventListener("ended", () => {
        setPlaying(false);
        setProgress(0);
        setElapsed(0);
        if (currentAudio === a) currentAudio = null;
      });
      a.addEventListener("pause", () => setPlaying(false));
      a.addEventListener("play", () => setPlaying(true));
    }
    if (a.paused) {
      if (currentAudio && currentAudio !== a) currentAudio.pause();
      currentAudio = a;
      try {
        await a.play();
      } catch {
        /* autoplay/user-gesture issues — ignore */
      }
    } else {
      a.pause();
    }
  }

  function seek(e: React.MouseEvent<HTMLDivElement>) {
    const a = audioRef.current;
    if (!a || !isFinite(a.duration) || a.duration <= 0) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const ratio = Math.min(
      1,
      Math.max(0, (e.clientX - rect.left) / rect.width),
    );
    a.currentTime = ratio * a.duration;
    setProgress(ratio);
  }

  const display = playing || elapsed > 0 ? elapsed : totalMs;

  return (
    <div className={`chat-voice ${mine ? "is-mine" : ""}`}>
      <button
        type="button"
        className="chat-voice-btn"
        onClick={toggle}
        disabled={loading}
        aria-label={playing ? "pause" : "play"}
      >
        {playing ? (
          <Pause size={16} fill="currentColor" />
        ) : (
          <Play size={16} fill="currentColor" />
        )}
      </button>
      <div className="chat-voice-wave" onClick={seek}>
        {bars.map((b, i) => {
          const played = i / BAR_COUNT <= progress;
          return (
            <span
              key={i}
              className={`chat-voice-bar ${played ? "is-played" : ""}`}
              style={{ height: `${Math.round(b * 100)}%` }}
            />
          );
        })}
      </div>
      <span className="chat-voice-time">{fmt(display)}</span>
    </div>
  );
}
