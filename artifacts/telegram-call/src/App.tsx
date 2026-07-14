import {
  Fragment,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import "./tg.css";
import { ChatProvider } from "./chat/ChatProvider";
import { useChat, type ChatMessage } from "./chat/chatContext";
import {
  getIdentity,
  signInToChat,
  otherIdentity,
  identityName,
  identityAvatar,
  type ChatIdentity,
} from "./chat/chatAuth";
import { verifyWord } from "./chat/wordAuth";
import { parseVoice, REACTION_EMOJIS } from "./chat/chatMedia";

type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface Contact {
  name: string;
  initials: string;
  avatarUrl?: string;
  gradientFrom: string;
  gradientTo: string;
}

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatCallTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function lastSeenTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = `${pad(d.getHours())}:${pad(d.getMinutes())}`;
  if (d.toDateString() === now.toDateString()) return `today at ${time}`;
  const yest = new Date(now);
  yest.setDate(now.getDate() - 1);
  if (d.toDateString() === yest.toDateString()) return `yesterday at ${time}`;
  const date = d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "short",
  });
  return `${date} at ${time}`;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) =>
    new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = startOf(now) - startOf(d);
  if (diff === 0) return "Today";
  if (diff === 86400000) return "Yesterday";
  return d.toLocaleDateString(undefined, {
    day: "numeric",
    month: "long",
  });
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

export default function App() {
  const [identity, setIdentity] = useState<ChatIdentity | null>(() =>
    getIdentity(),
  );

  // Re-sign-in on every launch: the Supabase session usually survives in
  // localStorage, but signing in again is idempotent and self-heals a stale
  // or missing session (ChatProvider keeps listening for SIGNED_IN).
  useEffect(() => {
    if (identity) {
      signInToChat(identity).catch(() => {});
    }
  }, [identity]);

  if (!identity) {
    return <LoginScreen onDone={setIdentity} />;
  }

  return (
    <ChatProvider enabled>
      <TelegramApp identity={identity} />
    </ChatProvider>
  );
}

function LoginScreen({ onDone }: { onDone: (id: ChatIdentity) => void }) {
  const [word, setWord] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (busy || !word.trim()) return;
    setBusy(true);
    setError(false);
    const id = await verifyWord(word);
    if (!id) {
      setError(true);
      setBusy(false);
      return;
    }
    try {
      await signInToChat(id);
    } catch {
      /* ChatProvider self-heals; identity is stored either way */
    }
    onDone(id);
  }

  return (
    <div className="tg-root">
      <div className="tg-login">
        <div className="tg-login-logo">
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none">
            <path
              d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z"
              fill="#fff"
            />
          </svg>
        </div>
        <h1 className="tg-login-title">Telegram</h1>
        <p className="tg-login-sub" dir="rtl">
          اكتب الكلمة حتى تفتح المحادثة
        </p>
        <form className="tg-login-form" onSubmit={submit}>
          <input
            className={`tg-login-input ${error ? "is-error" : ""}`}
            type="password"
            value={word}
            dir="auto"
            autoFocus
            autoComplete="off"
            placeholder="•••••"
            onChange={(e) => {
              setWord(e.target.value);
              setError(false);
            }}
          />
          <button
            className="tg-login-btn"
            type="submit"
            disabled={busy || !word.trim()}
          >
            {busy ? "..." : "Next"}
          </button>
        </form>
        {error && (
          <p className="tg-login-error" dir="rtl">
            الكلمة غلط، جرّب مرة ثانية
          </p>
        )}
      </div>
    </div>
  );
}

function TelegramApp({ identity }: { identity: ChatIdentity }) {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const them = otherIdentity(identity);
  const contact: Contact = useMemo(
    () => ({
      name: identityName(them),
      initials: identityName(them).slice(0, 1),
      avatarUrl: identityAvatar(them),
      gradientFrom: "#5BA4CF",
      gradientTo: "#2A7EC8",
    }),
    [them],
  );

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sequenceRef.current) clearTimeout(sequenceRef.current);
    if (endHideRef.current) clearTimeout(endHideRef.current);
    if (endResetRef.current) clearTimeout(endResetRef.current);
    timerRef.current = null;
    sequenceRef.current = null;
    endHideRef.current = null;
    endResetRef.current = null;
  }, []);

  const startCall = useCallback(() => {
    setMuted(false);
    setSpeaker(false);
    setVideoOn(false);
    setElapsed(0);
    setCallState("calling");
    setVisible(true);

    sequenceRef.current = setTimeout(() => {
      setCallState("ringing");
      sequenceRef.current = setTimeout(() => {
        setCallState("connected");
        timerRef.current = setInterval(() => {
          setElapsed((e) => e + 1);
        }, 1000);
      }, 2500);
    }, 2000);
  }, []);

  const startVideoCall = useCallback(() => {
    startCall();
    setVideoOn(true);
  }, [startCall]);

  const endCall = useCallback(() => {
    clearTimers();
    setCallState("ended");
    endHideRef.current = setTimeout(() => {
      setVisible(false);
      endResetRef.current = setTimeout(() => {
        setCallState("idle");
        setElapsed(0);
      }, 300);
    }, 800);
  }, [clearTimers]);

  useEffect(() => () => clearTimers(), [clearTimers]);

  const statusText =
    callState === "calling"
      ? "Calling…"
      : callState === "ringing"
        ? "Ringing…"
        : callState === "connected"
          ? formatCallTime(elapsed)
          : callState === "ended"
            ? "Call Ended"
            : "";

  const isPulsing = callState === "calling" || callState === "ringing";

  return (
    <div className="tg-root">
      <ChatScreen
        identity={identity}
        contact={contact}
        onCall={startCall}
        onVideoCall={startVideoCall}
      />

      <div
        className={`tg-overlay ${visible ? "tg-overlay--in" : "tg-overlay--out"}`}
      >
        {visible && (
          <CallScreen
            contact={contact}
            callState={callState}
            statusText={statusText}
            isPulsing={isPulsing}
            muted={muted}
            speaker={speaker}
            videoOn={videoOn}
            onMute={() => setMuted((v) => !v)}
            onSpeaker={() => setSpeaker((v) => !v)}
            onVideo={() => setVideoOn((v) => !v)}
            onEnd={endCall}
            onVideoCall={() => {
              setVideoOn(true);
            }}
          />
        )}
      </div>
    </div>
  );
}

function ChatScreen({
  identity,
  contact,
  onCall,
  onVideoCall,
}: {
  identity: ChatIdentity;
  contact: Contact;
  onCall: () => void;
  onVideoCall: () => void;
}) {
  const {
    configured,
    ready,
    authError,
    messages,
    reactions,
    otherOnline,
    otherTyping,
    otherLastSeen,
    otherLastRead,
    sendText,
    sendImage,
    sendVoice,
    toggleReaction,
    deleteMessage,
    notifyTyping,
    markRead,
    imageUrl,
  } = useChat();

  const [draft, setDraft] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [menuFor, setMenuFor] = useState<string | null>(null);

  const [recording, setRecording] = useState(false);
  const [recSeconds, setRecSeconds] = useState(0);
  const [micError, setMicError] = useState(false);

  const listRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);

  const mrRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startRef = useRef(0);
  const cancelledRef = useRef(false);
  const processingRef = useRef(false);
  const recTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const them = otherIdentity(identity);

  const grouped = useMemo(() => {
    const out: { key: string; label: string; items: ChatMessage[] }[] = [];
    for (const m of messages) {
      const k = dayKey(m.created_at);
      const last = out[out.length - 1];
      if (last && last.key === k) last.items.push(m);
      else out.push({ key: k, label: dayLabel(m.created_at), items: [m] });
    }
    return out;
  }, [messages]);

  function tickFor(m: ChatMessage): "seen" | "sent" {
    const t = new Date(m.created_at).getTime();
    if (otherLastRead && t <= otherLastRead) return "seen";
    return "sent";
  }

  // Symmetric presence: both sides see each other's real online / last-seen.
  const statusText = otherTyping
    ? "typing…"
    : otherOnline
      ? "online"
      : otherLastSeen
        ? `last seen ${lastSeenTime(otherLastSeen)}`
        : "last seen recently";

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = listRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  useEffect(() => {
    if (ready) markRead();
  }, [ready, messages.length, markRead]);

  useEffect(() => {
    if (ready) scrollToBottom("auto");
  }, [ready]);

  useEffect(() => {
    if (nearBottomRef.current) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    }
  }, [messages.length, otherTyping]);

  // Keep the chat sized to the *visual* viewport so the composer sits right
  // above the on-screen keyboard on iOS instead of being hidden behind it.
  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const apply = () => {
      const de = document.documentElement.style;
      de.setProperty("--tg-vh", `${vv.height}px`);
      de.setProperty("--tg-top", `${vv.offsetTop}px`);
    };
    apply();
    const onResize = () => {
      apply();
      nearBottomRef.current = true;
      window.setTimeout(() => scrollToBottom("auto"), 100);
    };
    vv.addEventListener("resize", onResize);
    vv.addEventListener("scroll", apply);
    return () => {
      vv.removeEventListener("resize", onResize);
      vv.removeEventListener("scroll", apply);
      const de = document.documentElement.style;
      de.removeProperty("--tg-vh");
      de.removeProperty("--tg-top");
    };
  }, []);

  useEffect(() => {
    return () => {
      if (recTimerRef.current) clearInterval(recTimerRef.current);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
    };
  }, []);

  function onScroll() {
    const el = listRef.current;
    if (!el) return;
    nearBottomRef.current =
      el.scrollHeight - el.scrollTop - el.clientHeight < 120;
  }

  // Read the current text content from the contenteditable div.
  function readDraft(): string {
    return inputRef.current?.innerText ?? "";
  }

  async function handleSend() {
    const text = readDraft().trim();
    if (!text || uploading) return;
    // Clear immediately so the field empties before the network round-trip.
    if (inputRef.current) {
      inputRef.current.textContent = "";
      inputRef.current.innerText = "";
    }
    setDraft("");
    nearBottomRef.current = true;
    // Keep keyboard open by re-focusing after clear.
    requestAnimationFrame(() => inputRef.current?.focus());
    try {
      await sendText(text);
    } catch {
      // Restore the draft if send fails so the user doesn't lose it.
      setDraft(text);
      if (inputRef.current) inputRef.current.innerText = text;
    }
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLDivElement>) {
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

  // Paste as plain text only — prevents rich-text / HTML from being inserted.
  function handlePaste(e: React.ClipboardEvent<HTMLDivElement>) {
    e.preventDefault();
    const text = e.clipboardData.getData("text/plain");
    if (!text) return;
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;
    sel.deleteFromDocument();
    sel.getRangeAt(0).insertNode(document.createTextNode(text));
    sel.collapseToEnd();
    // Sync draft state.
    const next = readDraft();
    setDraft(next);
    notifyTyping();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
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
      recTimerRef.current = setInterval(() => {
        setRecSeconds(Math.floor((Date.now() - startRef.current) / 1000));
      }, 250);
      mr.start();
    } catch {
      setMicError(true);
      streamRef.current?.getTracks().forEach((tr) => tr.stop());
      streamRef.current = null;
      window.setTimeout(() => setMicError(false), 2500);
    }
  }

  function teardownRecording() {
    if (recTimerRef.current) {
      clearInterval(recTimerRef.current);
      recTimerRef.current = null;
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

  function stopRecording(cancel: boolean) {
    cancelledRef.current = cancel;
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

  const hasDraft = draft.trim().length > 0;

  return (
    <div className="tg-chat-page">
      <div className="tg-chat-header">
        <div className="tg-chat-back">
          <svg width="11" height="19" viewBox="0 0 11 19" fill="none">
            <path
              d="M10 1L2 9.5L10 18"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          <span>Chats</span>
        </div>

        <div className="tg-chat-peer">
          <span className="tg-chat-peer-name" dir="auto">
            {contact.name}
          </span>
          <span
            className={`tg-chat-peer-status ${
              otherTyping || otherOnline ? "tg-chat-peer-status--online" : ""
            }`}
          >
            {statusText}
          </span>
        </div>

        <div className="tg-chat-header-right">
          <button
            className="tg-icon-btn"
            aria-label="Video call"
            onClick={onVideoCall}
          >
            <VideoCallIcon />
          </button>
          <button
            className="tg-icon-btn"
            aria-label="Voice call"
            onClick={onCall}
          >
            <PhoneIcon />
          </button>
          <Avatar contact={contact} size={36} />
        </div>
      </div>

      <div className="tg-chat-bg" />

      <div className="tg-chat-messages" ref={listRef} onScroll={onScroll}>
        {!configured ? (
          <div className="tg-chat-state">Chat is not configured.</div>
        ) : authError ? (
          <div className="tg-chat-state" dir="rtl">
            صار خلل بالاتصال… سكّر التطبيق وافتحه من جديد
          </div>
        ) : !ready ? (
          <div className="tg-chat-state">Loading…</div>
        ) : grouped.length === 0 ? (
          <div className="tg-chat-state" dir="rtl">
            بعد ماكو رسائل… ابدأ الحجي 🌙
          </div>
        ) : (
          grouped.map((g) => (
            <Fragment key={g.key}>
              <div className="tg-chat-day">{g.label}</div>
              {g.items.map((m) => (
                <TgMessage
                  key={m.id}
                  message={m}
                  mine={m.sender_name === identity}
                  status={m.sender_name === identity ? tickFor(m) : undefined}
                  reactions={reactions[m.id]}
                  myIdentity={identity}
                  menuOpen={menuFor === m.id}
                  onToggleMenu={() =>
                    setMenuFor((v) => (v === m.id ? null : m.id))
                  }
                  onCloseMenu={() => setMenuFor(null)}
                  onReact={(emoji) => {
                    setMenuFor(null);
                    void toggleReaction(m.id, emoji);
                  }}
                  onDelete={() => {
                    setMenuFor(null);
                    if (window.confirm("Delete this message?")) {
                      void deleteMessage(m.id);
                    }
                  }}
                  imageUrl={imageUrl}
                  onPreview={setPreview}
                />
              ))}
            </Fragment>
          ))
        )}

        {ready && otherTyping && (
          <div className="tg-bubble-row tg-bubble-row--in">
            <div className="tg-bubble tg-bubble--in tg-bubble--typing">
              <span className="tg-typing-dot" />
              <span className="tg-typing-dot" />
              <span className="tg-typing-dot" />
            </div>
          </div>
        )}
      </div>

      {recording ? (
        <div className="tg-composer tg-composer--recording">
          <span className="tg-rec-dot" />
          <span className="tg-rec-time">
            {`${Math.floor(recSeconds / 60)}:${pad(recSeconds % 60)}`}
          </span>
          <button
            className="tg-rec-cancel"
            type="button"
            onClick={() => stopRecording(true)}
          >
            Cancel
          </button>
          <button
            className="tg-composer-send"
            type="button"
            aria-label="Send voice message"
            onClick={() => stopRecording(false)}
          >
            <SendIcon />
          </button>
        </div>
      ) : (
        <div className="tg-composer">
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            hidden
            onChange={handleFile}
          />
          <button
            className="tg-composer-attach"
            aria-label="Attach"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
          >
            <AttachIcon />
          </button>
          <div
            ref={inputRef}
            className={`tg-composer-input${uploading ? " tg-composer-input--sending" : ""}`}
            contentEditable="true"
            role="textbox"
            aria-multiline="true"
            aria-label="Message"
            dir="auto"
            data-placeholder={uploading ? "Sending…" : "Message"}
            enterKeyHint="send"
            autoCorrect="on"
            autoCapitalize="sentences"
            spellCheck={true}
            suppressContentEditableWarning={true}
            onInput={() => {
              const text = readDraft();
              setDraft(text);
              notifyTyping();
            }}
            onKeyDown={onKeyDown}
            onPaste={handlePaste}
          />
          {hasDraft ? (
            <button
              className="tg-composer-send"
              aria-label="Send"
              onClick={handleSend}
            >
              <SendIcon />
            </button>
          ) : (
            <button
              className={`tg-composer-mic ${micError ? "is-error" : ""}`}
              aria-label="Voice message"
              onClick={startRecording}
            >
              <MicIcon muted={false} />
            </button>
          )}
        </div>
      )}

      {preview && (
        <div className="tg-lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt="" />
        </div>
      )}
    </div>
  );
}

function TgMessage({
  message,
  mine,
  status,
  reactions,
  myIdentity,
  menuOpen,
  onToggleMenu,
  onCloseMenu,
  onReact,
  onDelete,
  imageUrl,
  onPreview,
}: {
  message: ChatMessage;
  mine: boolean;
  status?: "seen" | "sent";
  reactions?: Partial<Record<ChatIdentity, string>>;
  myIdentity: ChatIdentity;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onCloseMenu: () => void;
  onReact: (emoji: string) => void;
  onDelete: () => void;
  imageUrl: (path: string) => Promise<string | null>;
  onPreview: (url: string) => void;
}) {
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const voice = parseVoice(message.image_path);
  const isImage = !!message.image_path && !voice && !message.deleted;

  useEffect(() => {
    let active = true;
    if (isImage && message.image_path) {
      imageUrl(message.image_path).then((url) => {
        if (active) setImgSrc(url);
      });
    } else {
      setImgSrc(null);
    }
    return () => {
      active = false;
    };
  }, [isImage, message.image_path, imageUrl]);

  useEffect(() => {
    if (!menuOpen) return;
    const onDocClick = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onCloseMenu();
      }
    };
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [menuOpen, onCloseMenu]);

  const chips: { emoji: string; count: number; mineSet: boolean }[] = [];
  if (reactions) {
    const order: ChatIdentity[] = ["star", "ilham"];
    for (const reactor of order) {
      const emoji = reactions[reactor];
      if (!emoji) continue;
      const existing = chips.find((c) => c.emoji === emoji);
      if (existing) {
        existing.count += 1;
        if (reactor === myIdentity) existing.mineSet = true;
      } else {
        chips.push({ emoji, count: 1, mineSet: reactor === myIdentity });
      }
    }
  }

  return (
    <div
      className={`tg-bubble-row ${mine ? "tg-bubble-row--out" : "tg-bubble-row--in"}`}
    >
      <div className="tg-bubble-wrap" ref={menuRef}>
        <div
          className={`tg-bubble ${mine ? "tg-bubble--out" : "tg-bubble--in"} ${
            isImage ? "tg-bubble--image" : ""
          } ${message.deleted ? "tg-bubble--deleted" : ""}`}
          dir="auto"
          onClick={() => {
            if (!message.deleted) onToggleMenu();
          }}
        >
          {message.deleted ? (
            <span className="tg-bubble-deleted" dir="rtl">
              انحذفت الرسالة
            </span>
          ) : voice ? (
            <TgVoicePlayer
              path={message.image_path as string}
              durationMs={voice.durationMs}
              mine={mine}
              imageUrl={imageUrl}
            />
          ) : (
            <>
              {isImage &&
                (imgSrc ? (
                  <img
                    src={imgSrc}
                    alt=""
                    className="tg-bubble-img"
                    onClick={(e) => {
                      e.stopPropagation();
                      onPreview(imgSrc);
                    }}
                  />
                ) : (
                  <span className="tg-bubble-img tg-bubble-img--loading" />
                ))}
              {message.body && (
                <span className="tg-bubble-text">{message.body}</span>
              )}
            </>
          )}
          <span className="tg-bubble-meta">
            {timeLabel(message.created_at)}
            {mine && !message.deleted && status && (
              <TickIcon seen={status === "seen"} />
            )}
          </span>
        </div>

        {menuOpen && !message.deleted && (
          <div
            className={`tg-msg-menu ${mine ? "tg-msg-menu--out" : ""}`}
            role="menu"
          >
            {REACTION_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                className={`tg-msg-menu-emoji ${
                  reactions?.[myIdentity] === emoji ? "is-active" : ""
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  onReact(emoji);
                }}
              >
                {emoji}
              </button>
            ))}
            {mine && (
              <button
                type="button"
                className="tg-msg-menu-delete"
                aria-label="Delete"
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete();
                }}
              >
                <TrashIcon />
              </button>
            )}
          </div>
        )}

        {chips.length > 0 && (
          <div
            className={`tg-reactions ${mine ? "tg-reactions--out" : ""}`}
          >
            {chips.map((c) => (
              <button
                key={c.emoji}
                type="button"
                className={`tg-reaction-chip ${c.mineSet ? "is-mine" : ""}`}
                onClick={() => onReact(c.emoji)}
              >
                <span>{c.emoji}</span>
                {c.count > 1 && (
                  <span className="tg-reaction-count">{c.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const VOICE_BARS = 30;

function barHeights(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const out: number[] = [];
  for (let i = 0; i < VOICE_BARS; i++) {
    h = (Math.imul(h, 1103515245) + 12345) >>> 0;
    out.push(0.25 + ((h % 1000) / 1000) * 0.75);
  }
  return out;
}

function fmtVoice(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${pad(total % 60)}`;
}

// Module-level guard so only one voice message plays at a time.
let currentAudio: HTMLAudioElement | null = null;

function TgVoicePlayer({
  path,
  durationMs,
  mine,
  imageUrl,
}: {
  path: string;
  durationMs: number;
  mine: boolean;
  imageUrl: (path: string) => Promise<string | null>;
}) {
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

  async function toggle(e: React.MouseEvent) {
    e.stopPropagation();
    let u = url;
    if (!u) {
      setLoading(true);
      u = await imageUrl(path);
      setLoading(false);
      if (!u) return;
      setUrl(u);
    }
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
        /* ignore */
      }
    } else {
      a.pause();
    }
  }

  const display = playing || elapsed > 0 ? elapsed : totalMs;

  return (
    <span className={`tg-voice ${mine ? "tg-voice--out" : ""}`}>
      <button
        type="button"
        className="tg-voice-btn"
        onClick={toggle}
        disabled={loading}
        aria-label={playing ? "Pause" : "Play"}
      >
        {playing ? (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <rect x="2" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" />
            <rect x="8.6" y="1.5" width="3.4" height="11" rx="1" fill="currentColor" />
          </svg>
        ) : (
          <svg width="14" height="14" viewBox="0 0 14 14">
            <path d="M3.5 1.8v10.4c0 .8.9 1.3 1.6.9l8-5.2c.6-.4.6-1.4 0-1.8l-8-5.2c-.7-.4-1.6.1-1.6.9z" fill="currentColor" />
          </svg>
        )}
      </button>
      <span className="tg-voice-wave">
        {bars.map((b, i) => (
          <span
            key={i}
            className={`tg-voice-bar ${i / VOICE_BARS <= progress ? "is-played" : ""}`}
            style={{ height: `${Math.round(b * 100)}%` }}
          />
        ))}
      </span>
      <span className="tg-voice-time">{fmtVoice(display)}</span>
    </span>
  );
}

function CallScreen({
  contact,
  callState,
  statusText,
  isPulsing,
  muted,
  speaker,
  videoOn,
  onMute,
  onSpeaker,
  onVideo,
  onEnd,
  onVideoCall,
}: {
  contact: Contact;
  callState: CallState;
  statusText: string;
  isPulsing: boolean;
  muted: boolean;
  speaker: boolean;
  videoOn: boolean;
  onMute: () => void;
  onSpeaker: () => void;
  onVideo: () => void;
  onEnd: () => void;
  onVideoCall: () => void;
}) {
  return (
    <div
      className={`tg-call-screen ${callState === "ended" ? "tg-call-screen--ending" : ""}`}
    >
      <div className="tg-call-bg" />

      <div className="tg-call-top">
        <div className="tg-call-encryption">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="5" width="8" height="6" rx="1" fill="rgba(255,255,255,0.7)" />
            <path d="M4 5V4a2 2 0 1 1 4 0v1" stroke="rgba(255,255,255,0.7)" strokeWidth="1.2" strokeLinecap="round" />
          </svg>
          <span>End-to-end encrypted</span>
        </div>
        <button className="tg-call-video-toggle" aria-label="Switch to video" onClick={onVideoCall}>
          <VideoCallIcon />
        </button>
      </div>

      <div className="tg-call-center">
        <div className={`tg-avatar-wrap ${isPulsing ? "tg-avatar-wrap--pulsing" : ""}`}>
          <div className="tg-pulse-ring tg-pulse-ring--1" />
          <div className="tg-pulse-ring tg-pulse-ring--2" />
          <div className="tg-pulse-ring tg-pulse-ring--3" />
          <Avatar contact={contact} size={120} />
        </div>
        <h2 className="tg-call-name" dir="auto">{contact.name}</h2>
        <p className={`tg-call-status ${callState === "ended" ? "tg-call-status--ended" : ""}`}>
          {statusText}
        </p>
      </div>

      <div className="tg-call-controls">
        <div className="tg-controls-row">
          <ControlButton
            label={muted ? "Unmute" : "Mute"}
            active={muted}
            onClick={onMute}
            icon={<MicIcon muted={muted} />}
          />
          <ControlButton
            label="Speaker"
            active={speaker}
            onClick={onSpeaker}
            icon={<SpeakerIcon on={speaker} />}
          />
          <ControlButton
            label={videoOn ? "Stop Video" : "Video"}
            active={videoOn}
            onClick={onVideo}
            icon={<VideoIcon on={videoOn} />}
          />
        </div>

        <div className="tg-end-row">
          <button className="tg-end-btn" onClick={onEnd} aria-label="End call">
            <EndCallIcon />
          </button>
        </div>
      </div>
    </div>
  );
}

function Avatar({ contact, size }: { contact: Contact; size: number }) {
  const [failed, setFailed] = useState(false);
  return (
    <div
      className="tg-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${contact.gradientFrom}, ${contact.gradientTo})`,
        fontSize: size * 0.38,
        overflow: "hidden",
      }}
    >
      {contact.avatarUrl && !failed ? (
        <img
          src={contact.avatarUrl}
          alt=""
          draggable={false}
          onError={() => setFailed(true)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
      ) : (
        contact.initials
      )}
    </div>
  );
}

function ControlButton({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <div className="tg-ctrl-wrap">
      <button
        className={`tg-ctrl-btn ${active ? "tg-ctrl-btn--active" : ""}`}
        onClick={onClick}
        aria-label={label}
        aria-pressed={active}
      >
        {icon}
      </button>
      <span className="tg-ctrl-label">{label}</span>
    </div>
  );
}

function TickIcon({ seen }: { seen: boolean }) {
  if (seen) {
    return (
      <svg className="tg-read-icon tg-read-icon--seen" width="16" height="11" viewBox="0 0 16 11" fill="none">
        <path d="M1 5.5L4.2 8.7L10.5 1.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M5.5 8.5L6.2 9.2L12.5 2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }
  return (
    <svg className="tg-read-icon" width="16" height="11" viewBox="0 0 16 11" fill="none">
      <path d="M3 5.5L6.2 8.7L12.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="currentColor" />
    </svg>
  );
}

function VideoCallIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z" fill="currentColor" />
    </svg>
  );
}

function AttachIcon() {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M16.5 6v11.5a4 4 0 0 1-8 0V5a2.5 2.5 0 0 1 5 0v10.5a1 1 0 0 1-2 0V6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
      <path d="M3.4 20.4l17.45-7.48a1 1 0 0 0 0-1.84L3.4 3.6a.993.993 0 0 0-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" fill="currentColor" />
    </svg>
  );
}

function MicIcon({ muted }: { muted: boolean }) {
  if (muted) {
    return (
      <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
        <path d="M19 11c0 1.19-.34 2.3-.9 3.28L16.68 12.86A5 5 0 0 0 17 11h2zm-7 7c-3.31 0-6-2.69-6-6v-1L4.27 9.27A8.94 8.94 0 0 0 3 13c0 4.42 3.26 8.09 7.5 8.72V24h3v-2.28c.91-.13 1.77-.39 2.56-.75l-1.46-1.46A7.026 7.026 0 0 1 12 20zm6.35-2.46L3 2.27 1.27 4l18 18 1.73-1.73-3.03-3.03a9.064 9.064 0 0 0 1.4-2.59L17 12.86c-.1.39-.23.77-.41 1.13L15 12.41V11c0-2.76-2.24-5-5-5-.67 0-1.3.13-1.87.35L6.3 4.62A7 7 0 0 1 12 3c4.42 0 8 3.58 8 8h2" fill="currentColor" opacity="0.8" />
        <line x1="4" y1="4" x2="20" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5zm6 6c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" fill="currentColor" />
    </svg>
  );
}

function SpeakerIcon({ on }: { on: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"
        fill="currentColor"
        opacity={on ? "1" : "0.5"}
      />
      {on && (
        <path
          d="M14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77 0-4.28-2.99-7.86-7-8.77z"
          fill="currentColor"
        />
      )}
    </svg>
  );
}

function VideoIcon({ on }: { on: boolean }) {
  return (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none">
      <path
        d="M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z"
        fill="currentColor"
        opacity={on ? "1" : "0.5"}
      />
      {!on && (
        <line x1="3" y1="3" x2="21" y2="21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      )}
    </svg>
  );
}

function EndCallIcon() {
  return (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
      <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z" fill="white" transform="rotate(135 12 12)" />
    </svg>
  );
}
