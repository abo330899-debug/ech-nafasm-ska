import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { Send, ImagePlus, Search, X, ArrowDown } from "lucide-react";
import { type Translations, type Lang } from "@/i18n/translations";
import { useChat, type ChatMessage } from "@/chat/chatContext";
import { chatStrings } from "@/chat/chatI18n";
import { otherIdentity, identityName } from "@/chat/chatAuth";
import MessageBubble from "@/components/chat/MessageBubble";
import "@/styles/chat.css";

interface Props {
  t: Translations;
  lang: Lang;
}

function dayKey(iso: string): string {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function lastSeenTime(ts: number): string {
  const d = new Date(ts);
  const now = new Date();
  const time = d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (d.toDateString() === now.toDateString()) return time;
  const date = d.toLocaleDateString(undefined, { day: "numeric", month: "short" });
  return `${date} ${time}`;
}

function dayLabel(iso: string, s: { today: string; yesterday: string }): string {
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

export default function Chat({ lang }: Props) {
  const s = chatStrings[lang];
  const chat = useChat();
  const {
    configured,
    ready,
    authError,
    identity,
    messages,
    otherOnline,
    otherTyping,
    otherLastSeen,
    otherLastRead,
    sendText,
    sendImage,
    notifyTyping,
    markRead,
  } = chat;

  const [draft, setDraft] = useState("");
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [showJump, setShowJump] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const nearBottomRef = useRef(true);

  const them = identity ? otherIdentity(identity) : "ilham";
  const themName = identityName(them);
  // Presence (online / last seen) is intentionally one-way: only Star may see
  // whether the other person is online or when they were last active.
  const showPresence = identity === "star";

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

  // Id of the newest message I sent that the other person has already read, so
  // the "seen" line is shown only once, under my latest read message.
  const lastMineSeenId = useMemo(() => {
    if (!identity || !otherLastRead) return null;
    let id: string | null = null;
    for (const m of messages) {
      if (
        m.sender_name === identity &&
        !m.deleted &&
        new Date(m.created_at).getTime() <= otherLastRead
      ) {
        id = m.id;
      }
    }
    return id;
  }, [messages, identity, otherLastRead]);

  function scrollToBottom(behavior: ScrollBehavior = "smooth") {
    const el = scrollRef.current;
    if (el) el.scrollTo({ top: el.scrollHeight, behavior });
  }

  // Mark read whenever the conversation is open and updates arrive.
  useEffect(() => {
    if (ready) markRead();
  }, [ready, messages.length, markRead]);

  // Auto-scroll to newest when near the bottom or on first load.
  useEffect(() => {
    if (nearBottomRef.current && !query) {
      scrollToBottom(messages.length <= 1 ? "auto" : "smooth");
    } else if (!nearBottomRef.current) {
      setShowJump(true);
    }
  }, [messages.length, query]);

  useEffect(() => {
    if (ready) scrollToBottom("auto");
  }, [ready]);

  function onScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const near = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    nearBottomRef.current = near;
    if (near) setShowJump(false);
  }

  async function handleSend(e: React.FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    nearBottomRef.current = true;
    try {
      await sendText(text);
    } catch {
      setDraft(text);
    }
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

  if (!configured) {
    return (
      <div className="page-content chat-page">
        <div className="chat-state glass">{s.not_configured}</div>
      </div>
    );
  }

  if (authError) {
    return (
      <div className="page-content chat-page">
        <div className="chat-state glass">{s.reconnect}</div>
      </div>
    );
  }

  return (
    <div className="page-content chat-page">
      <div className="chat-shell glass">
        <header className="chat-header">
          <div className="chat-peer">
            <div
              className={`chat-avatar ${
                showPresence && otherOnline ? "is-online" : ""
              }`}
            >
              {themName.charAt(0)}
            </div>
            <div className="chat-peer-meta">
              <span className="chat-peer-name">{themName}</span>
              {showPresence && (
                <span className="chat-peer-status">
                  {otherTyping
                    ? s.typing
                    : otherOnline
                      ? s.online
                      : otherLastSeen
                        ? s.last_seen.replace("{time}", lastSeenTime(otherLastSeen))
                        : s.offline}
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            className="chat-icon-btn"
            onClick={() => {
              setSearching((v) => !v);
              setQuery("");
            }}
            aria-label={s.search}
          >
            {searching ? <X size={18} /> : <Search size={18} />}
          </button>
        </header>

        {searching && (
          <div className="chat-search">
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
            <div className="chat-empty">
              {query ? s.search_empty : s.empty}
            </div>
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
                      s={s}
                      onPreview={setPreview}
                    />
                    {m.id === lastMineSeenId && (
                      <div className="chat-seen">{s.seen}</div>
                    )}
                  </Fragment>
                ))}
              </div>
            ))
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
          </button>
        )}

        <form className="chat-composer" onSubmit={handleSend}>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            hidden
          />
          <button
            type="button"
            className="chat-icon-btn"
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            aria-label={s.attach}
            title={s.attach}
          >
            <ImagePlus size={20} />
          </button>
          <input
            className="chat-input"
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              notifyTyping();
            }}
            placeholder={uploading ? s.sending_image : s.placeholder}
            disabled={uploading}
          />
          <button
            type="submit"
            className="chat-send"
            disabled={!draft.trim()}
            aria-label={s.send}
          >
            <Send size={18} />
          </button>
        </form>
      </div>

      {preview && (
        <div className="chat-lightbox" onClick={() => setPreview(null)}>
          <img src={preview} alt={s.image_alt} />
          <button type="button" className="chat-lightbox-close" aria-label="close">
            <X size={22} />
          </button>
        </div>
      )}
    </div>
  );
}
