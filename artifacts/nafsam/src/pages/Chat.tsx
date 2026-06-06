import {
  Fragment,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useLocation } from "wouter";
import {
  Send,
  ImagePlus,
  Camera,
  Paperclip,
  Smile,
  Mic,
  Search,
  X,
  ArrowDown,
  ArrowLeft,
  ChevronLeft,
  Trash2,
  Heart,
} from "lucide-react";
import { type Translations, type Lang } from "@/i18n/translations";
import { useChat, type ChatMessage } from "@/chat/chatContext";
import { chatStrings } from "@/chat/chatI18n";
import { otherIdentity, identityName, identityShort } from "@/chat/chatAuth";
import { parseVoice } from "@/chat/chatMedia";
import MessageBubble, {
  type TickStatus,
} from "@/components/chat/MessageBubble";
import "@/styles/chat.css";

interface Props {
  t: Translations;
  lang: Lang;
}

const MAX_COMPOSER_HEIGHT = 150;

const EMOJIS = [
  "❤️", "🥺", "🌹", "🦋", "💜", "🤍", "🥰", "😘",
  "😍", "🥹", "😢", "🌙", "✨", "🫶", "💌", "🕊️",
  "🌸", "💞", "💫", "🙈", "😴", "☕", "🔥", "😇",
];

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}


function dayLabel(
  iso: string,
  s: { today: string; yesterday: string },
): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = startOf(now) - startOf(d);
  if (diff === 0) return s.today;
  if (diff === 86400000) return s.yesterday;
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function previewTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  if (d.toDateString() === now.toDateString())
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
}

interface Particle {
  left: number;
  size: number;
  delay: number;
  duration: number;
  drift: number;
  opacity: number;
}

function pickMime(): string | undefined {
  if (typeof MediaRecorder === "undefined") return undefined;
  const cands = [
    "audio/webm;codecs=opus",
    "audio/webm",
    "audio/mp4",
    "audio/aac",
    "audio/ogg;codecs=opus",
  ];
  for (const c of cands) {
    try {
      if (MediaRecorder.isTypeSupported?.(c)) return c;
    } catch {
      /* ignore */
    }
  }
  return undefined;
}

export default function Chat({ lang }: Props) {
  const s = chatStrings[lang];
  const [, navigate] = useLocation();
  const chat = useChat();
  const {
    configured,
    ready,
    authError,
    identity,
    messages,
    reactions,
    otherOnline,
    otherTyping,
    otherLastSeen,
    otherLastRead,
    unread,
    sendText,
    sendImage,
    sendVoice,
    toggleReaction,
    notifyTyping,
    markRead,
  } = chat;

  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);
  const [emojiOpen, setEmojiOpen] = useState(false);
  const [attachOpen, setAttachOpen] = useState(false);

  // Voice recording state
  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [micError, setMicError] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const nearBottomRef = useRef(true);
  const mountTimeRef = useRef(0);

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const cancelledRef = useRef(false);
  // True from the moment a recording is stopped until its onstop handler has
  // finished (teardown + optional upload). Prevents a new recording from
  // clobbering the shared buffers of one that is still finalizing.
  const processingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const them = identity ? otherIdentity(identity) : "ilham";
  const themName = identityName(them);

  const particles = useMemo<Particle[]>(
    () =>
      Array.from({ length: 22 }, () => ({
        left: Math.random() * 100,
        size: 1.5 + Math.random() * 3.5,
        delay: Math.random() * 16,
        duration: 14 + Math.random() * 16,
        drift: Math.random() * 40 - 20,
        opacity: 0.12 + Math.random() * 0.3,
      })),
    [],
  );

  const filtered = useMemo(() => {
    if (!query.trim()) return messages;
    const q = query.trim().toLowerCase();
    return messages.filter(
      (m) => !m.deleted && m.body && m.body.toLowerCase().includes(q),
    );
  }, [messages, query]);

  const grouped = useMemo(() => {
    const out: { key: string; label: string; items: ChatMessage[] }[] = [];
    for (const m of filtered) {
      const k = dayKey(m.created_at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(m);
      else out.push({ key: k, label: dayLabel(m.created_at, s), items: [m] });
    }
    return out;
  }, [filtered, s]);

  // Show the peer avatar only on the last message of a consecutive incoming run.
  const avatarIds = useMemo(() => {
    const ids = new Set<string>();
    for (let i = 0; i < filtered.length; i++) {
      const m = filtered[i];
      if (m.sender_name === identity) continue;
      const next = filtered[i + 1];
      if (!next || next.sender_name === identity) ids.add(m.id);
    }
    return ids;
  }, [filtered, identity]);

  const lastMessage = useMemo(() => {
    for (let i = messages.length - 1; i >= 0; i--) {
      if (!messages[i].deleted) return messages[i];
    }
    return null;
  }, [messages]);

  function lastPreview(m: ChatMessage | null): string {
    if (!m) return s.no_messages_preview;
    if (parseVoice(m.image_path)) return s.voice_message;
    if (m.image_path) return s.photo_message;
    return m.body ?? "";
  }

  function tickFor(m: ChatMessage): TickStatus {
    const t = new Date(m.created_at).getTime();
    if (otherLastRead && t <= otherLastRead) return "seen";
    if (otherOnline) return "delivered";
    if (otherLastSeen && t <= otherLastSeen) return "delivered";
    return "sent";
  }

  function autoGrow() {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, MAX_COMPOSER_HEIGHT)}px`;
  }

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  useEffect(() => {
    if (ready) markRead();
  }, [ready, messages.length, markRead]);

  useEffect(() => {
    if (nearBottomRef.current && !query) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    } else if (!nearBottomRef.current) {
      setShowJump(true);
    }
  }, [messages.length, otherTyping, query]);

  useEffect(() => {
    if (ready) {
      if (mountTimeRef.current === 0) mountTimeRef.current = Date.now();
      scrollToBottom("auto");
    }
  }, [ready]);

  // Clean up an in-flight recording if the page unmounts.
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    nearBottomRef.current = near;
    if (near) setShowJump(false);
  }

  async function handleSend() {
    const text = draft.trim();
    if (!text || uploading) return;
    setDraft("");
    setEmojiOpen(false);
    requestAnimationFrame(autoGrow);
    nearBottomRef.current = true;
    try {
      await sendText(text);
    } catch {
      setDraft(text);
      requestAnimationFrame(autoGrow);
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (
      e.key === "Enter" &&
      !e.shiftKey &&
      !e.nativeEvent.isComposing &&
      e.keyCode !== 229
    ) {
      e.preventDefault();
      void handleSend();
    }
  }

  function insertEmoji(emoji: string) {
    const el = inputRef.current;
    if (!el) {
      setDraft((d) => d + emoji);
      return;
    }
    const start = el.selectionStart ?? draft.length;
    const end = el.selectionEnd ?? draft.length;
    const next = draft.slice(0, start) + emoji + draft.slice(end);
    setDraft(next);
    requestAnimationFrame(() => {
      el.focus();
      const pos = start + emoji.length;
      el.setSelectionRange(pos, pos);
      autoGrow();
    });
  }

  // Keep the chat sized to the *visual* viewport so the composer sits right
  // above the on-screen keyboard (like WhatsApp/Telegram) instead of being
  // hidden behind it on iOS Safari. Falls back to 100dvh where unsupported.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const de = document.documentElement.style;
      de.setProperty("--chat-vh", `${vv.height}px`);
      de.setProperty("--chat-top", `${vv.offsetTop}px`);
    };
    apply();
    const onResize = () => {
      apply();
      // When the keyboard opens/closes the viewport changes size; scroll to
      // keep the latest messages above the keyboard so the user sees context.
      nearBottomRef.current = true;
      window.setTimeout(() => scrollToBottom("auto"), 100);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", apply);
      const de = document.documentElement.style;
      de.removeProperty("--chat-vh");
      de.removeProperty("--chat-top");
    };
  }, []);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    setAttachOpen(false);
    if (!file) return;
    setUploading(true);
    nearBottomRef.current = true;
    try {
      await sendImage(file);
    } catch {
      /* ignore */
    } finally {
      setUploading(false);
    }
  }

  async function startRecording() {
    if (recording || uploading || processingRef.current) return;
    setMicError(false);
    setEmojiOpen(false);
    setAttachOpen(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mime = pickMime();
      const mr = new MediaRecorder(
        stream,
        mime ? { mimeType: mime } : undefined,
      );
      chunksRef.current = [];
      cancelledRef.current = false;
      mr.ondataavailable = (e) => {
        if (e.data && e.data.size) chunksRef.current.push(e.data);
      };
      mr.onstop = handleRecStop;
      mrRef.current = mr;
      startRef.current = Date.now();
      setRecSeconds(0);
      setRecording(true);
      timerRef.current = setInterval(() => {
        setRecSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }, 250);
      mr.start();
    } catch {
      setMicError(true);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
    }
  }

  function teardownRecording() {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    streamRef.current?.getTracks().forEach((tr) => tr.stop());
    streamRef.current = null;
  }

  async function handleRecStop() {
    try {
      teardownRecording();
      const cancelled = cancelledRef.current;
      const chunks = chunksRef.current;
      chunksRef.current = [];
      if (cancelled || chunks.length === 0) return;
      const type = chunks[0]?.type || pickMime() || "audio/webm";
      const blob = new Blob(chunks, { type });
      const durationMs = Date.now() - startRef.current;
      if (durationMs < 600 || blob.size === 0) return;
      nearBottomRef.current = true;
      await sendVoice(blob, durationMs);
    } catch {
      /* ignore */
    } finally {
      mrRef.current = null;
      processingRef.current = false;
    }
  }

  function cancelRecording() {
    cancelledRef.current = true;
    processingRef.current = true;
    setRecording(false);
    try {
      mrRef.current?.stop();
    } catch {
      teardownRecording();
      mrRef.current = null;
      processingRef.current = false;
    }
  }

  function finishRecording() {
    cancelledRef.current = false;
    processingRef.current = true;
    setRecording(false);
    try {
      mrRef.current?.stop();
    } catch {
      teardownRecording();
      mrRef.current = null;
      processingRef.current = false;
    }
  }

  if (!configured) {
    return (
      <div className="chat-app chat-app--state">
        <div className="chat-state glass">{s.not_configured}</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="chat-app chat-app--state">
        <div className="chat-state glass">{s.reconnect}</div>
      </div>
    );
  }

  // Both peers are always presented as connected: "last seen" is never shown,
  // only "online" (or the live typing indicator). Read receipts on the bubbles
  // still reflect the real delivered/read state.
  const statusText = otherTyping
    ? s.typing_name.replace("{name}", themName)
    : s.online;

  const hasDraft = draft.trim().length > 0;

  return (
    <div className="chat-app">
      <div className="chat-aurora" aria-hidden="true" />
      <div className="chat-particles" aria-hidden="true">
        {particles.map((p, i) => (
          <span
            key={i}
            className="chat-dust"
            style={
              {
                left: `${p.left}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                opacity: p.opacity,
                animationDelay: `${p.delay}s`,
                animationDuration: `${p.duration}s`,
                "--drift": `${p.drift}px`,
              } as CSSProperties
            }
          />
        ))}
      </div>

      {/* Decorative rail (desktop) — the only action is returning to the archive */}
      <aside className="chat-rail" aria-hidden="false">
        <div className="chat-rail-logo">
          <Heart size={20} fill="currentColor" />
        </div>
        <button
          type="button"
          className="chat-rail-btn"
          onClick={() => navigate("/home")}
          aria-label={s.back}
          title={s.back}
        >
          <ArrowLeft size={20} />
        </button>
      </aside>

      {/* Sidebar (desktop) */}
      <aside className="chat-sidebar">
        <div className="chat-sidebar-head">
          <h1 className="chat-sidebar-title">
            {s.app_name} <span className="chat-sidebar-heart">💕</span>
          </h1>
        </div>
        <div className="chat-sidebar-search">
          <Search size={15} />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSearching(true);
            }}
            placeholder={s.search_chats}
          />
          {query && (
            <button
              type="button"
              className="chat-sidebar-clear"
              onClick={() => {
                setQuery("");
                setSearching(false);
              }}
              aria-label={s.cancel}
            >
              <X size={14} />
            </button>
          )}
        </div>
        <div className="chat-convo-list">
          <div className="chat-convo is-active">
            <div className="chat-avatar lg is-text is-online">
              <span className="chat-avatar-mark">{identityShort(them)}</span>
            </div>
            <div className="chat-convo-main">
              <div className="chat-convo-top">
                <span className="chat-convo-name">{themName}</span>
                {lastMessage && (
                  <span className="chat-convo-time">
                    {previewTime(lastMessage.created_at)}
                  </span>
                )}
              </div>
              <div className="chat-convo-bottom">
                <span className="chat-convo-preview" dir="auto">
                  {otherTyping ? (
                    <em className="chat-convo-typing">{s.typing}</em>
                  ) : (
                    lastPreview(lastMessage)
                  )}
                </span>
                {unread > 0 && (
                  <span className="chat-convo-badge">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
        <div className="chat-sidebar-quote">
          <span>“{s.sidebar_quote}”</span>
        </div>
      </aside>

      {/* Main conversation */}
      <section className="chat-main">
        <header className="chat-header">
          <button
            type="button"
            className="chat-back-pill"
            onClick={() => navigate("/home")}
            aria-label={s.back}
          >
            <ChevronLeft size={22} />
            {unread > 0 && (
              <span className="chat-back-count">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>

          <button
            type="button"
            className={`chat-peer ${searching ? "is-searching" : ""}`}
            onClick={() => {
              setSearching((v) => !v);
              setQuery("");
            }}
            aria-label={s.search}
            aria-expanded={searching}
            aria-controls="chat-search"
          >
            <span className="chat-peer-name" dir="auto">
              {themName}
            </span>
            <span
              className={`chat-peer-status ${otherTyping ? "is-typing" : ""}`}
              dir="auto"
            >
              {searching ? s.search_placeholder : statusText}
            </span>
          </button>

          <div className="chat-avatar is-text is-online">
            <span className="chat-avatar-mark">{identityShort(them)}</span>
          </div>
        </header>

        {searching && (
          <div className="chat-search" id="chat-search">
            <Search size={16} />
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={s.search_placeholder}
            />
          </div>
        )}

        <div className="chat-scroll" ref={scrollRef} onScroll={onScroll}>
          {!ready ? (
            <div className="chat-empty">{s.loading}</div>
          ) : grouped.length === 0 ? (
            <div className="chat-empty">{query ? s.search_empty : s.empty}</div>
          ) : (
            grouped.map((g) => (
              <div key={g.key} className="chat-day">
                <div className="chat-day-label">{g.label}</div>
                {g.items.map((m) => (
                  <Fragment key={m.id}>
                    <MessageBubble
                      message={m}
                      mine={m.sender_name === identity}
                      senderLabel={identityName(
                        m.sender_name === "star" ? "star" : "ilham",
                      )}
                      showAvatar={avatarIds.has(m.id)}
                      status={
                        m.sender_name === identity ? tickFor(m) : undefined
                      }
                      animate={
                        mountTimeRef.current > 0 &&
                        new Date(m.created_at).getTime() >= mountTimeRef.current
                      }
                      reactions={reactions[m.id]}
                      myIdentity={identity}
                      s={s}
                      onPreview={setPreview}
                      onReact={(emoji) => toggleReaction(m.id, emoji)}
                    />
                  </Fragment>
                ))}
              </div>
            ))
          )}

          {ready && otherTyping && !query && (
            <div className="chat-row theirs chat-typing-row">
              <div className="chat-row-avatar">{identityShort(them)}</div>
              <div className="chat-typing-bubble">
                <span className="chat-typing-dots">
                  <i />
                  <i />
                  <i />
                </span>
              </div>
            </div>
          )}
        </div>

        {showJump && (
          <button
            type="button"
            className="chat-jump"
            onClick={() => {
              nearBottomRef.current = true;
              setShowJump(false);
              scrollToBottom();
            }}
            aria-label={s.jump_unread}
          >
            <ArrowDown size={18} />
            {unread > 0 && <span className="chat-jump-badge">{unread}</span>}
          </button>
        )}

        {recording ? (
          <div className="chat-recording">
            <button
              type="button"
              className="chat-rec-cancel"
              onClick={cancelRecording}
              aria-label={s.cancel}
              title={s.cancel}
            >
              <Trash2 size={20} />
            </button>
            <div className="chat-rec-body">
              <span className="chat-rec-dot" />
              <div className="chat-rec-wave" aria-hidden="true">
                {Array.from({ length: 18 }).map((_, i) => (
                  <span key={i} style={{ animationDelay: `${i * 0.07}s` }} />
                ))}
              </div>
              <span className="chat-rec-time">
                {Math.floor(recSeconds / 60)}:
                {(recSeconds % 60).toString().padStart(2, "0")}
              </span>
            </div>
            <button
              type="button"
              className="chat-send"
              onClick={finishRecording}
              aria-label={s.send}
            >
              <Send size={18} />
            </button>
          </div>
        ) : (
          <form
            className="chat-composer"
            onSubmit={(e) => {
              e.preventDefault();
              void handleSend();
            }}
          >
            <input
              ref={galleryRef}
              type="file"
              accept="image/*"
              onChange={handleFile}
              hidden
            />
            <input
              ref={cameraRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFile}
              hidden
            />

            <button
              type="button"
              className={`chat-icon-btn chat-attach ${attachOpen ? "is-active" : ""}`}
              onClick={() => {
                setAttachOpen((v) => !v);
                setEmojiOpen(false);
              }}
              disabled={uploading}
              aria-label={s.attach}
              title={s.attach}
            >
              <Paperclip size={22} />
            </button>

            {emojiOpen && (
              <div className="chat-emoji-pop">
                {EMOJIS.map((emoji) => (
                  <button
                    type="button"
                    key={emoji}
                    className="chat-emoji-opt"
                    onClick={() => insertEmoji(emoji)}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            )}

            {attachOpen && (
              <div className="chat-attach-pop">
                <button
                  type="button"
                  onClick={() => galleryRef.current?.click()}
                >
                  <span className="chat-attach-ic chat-attach-ic--g">
                    <ImagePlus size={18} />
                  </span>
                  {s.gallery}
                </button>
                <button type="button" onClick={() => cameraRef.current?.click()}>
                  <span className="chat-attach-ic chat-attach-ic--c">
                    <Camera size={18} />
                  </span>
                  {s.camera}
                </button>
              </div>
            )}

            <div className="chat-input-wrap">
              <textarea
                ref={inputRef}
                className="chat-input"
                dir="auto"
                rows={1}
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  autoGrow();
                  notifyTyping();
                }}
                onKeyDown={onKeyDown}
                onFocus={() => {
                  // Tapping the field opens the system keyboard, which shrinks
                  // the visual viewport. Once that resize settles, keep the
                  // latest messages and the composer visible above the keyboard.
                  nearBottomRef.current = true;
                  window.setTimeout(() => scrollToBottom("auto"), 250);
                }}
                placeholder={uploading ? s.sending_image : s.placeholder}
                disabled={uploading}
              />
              <button
                type="button"
                className={`chat-emoji-btn ${emojiOpen ? "is-active" : ""}`}
                onClick={() => {
                  setEmojiOpen((v) => !v);
                  setAttachOpen(false);
                }}
                aria-label={s.emoji}
                title={s.emoji}
              >
                <Smile size={22} />
              </button>
            </div>

            {hasDraft ? (
              <button
                type="submit"
                className="chat-send"
                disabled={uploading}
                aria-label={s.send}
              >
                <Send size={18} />
              </button>
            ) : (
              <button
                type="button"
                className="chat-send chat-mic"
                onClick={startRecording}
                disabled={uploading}
                aria-label={s.record}
                title={s.record}
              >
                <Mic size={20} />
              </button>
            )}
          </form>
        )}

        {micError && (
          <div className="chat-mic-error" role="alert">
            {s.mic_denied}
          </div>
        )}
      </section>

      {preview && (
        <div className="chat-lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt={s.image_alt} />
          <button
            type="button"
            className="chat-lightbox-close"
            aria-label="close"
          >
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
