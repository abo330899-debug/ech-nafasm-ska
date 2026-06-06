import { useState, useEffect, useRef, useCallback } from "react";
import "./tg.css";

type CallState = "idle" | "calling" | "ringing" | "connected" | "ended";

interface Contact {
  name: string;
  initials: string;
  gradientFrom: string;
  gradientTo: string;
  online: boolean;
}

interface Message {
  id: number;
  text: string;
  sent: boolean;
  time: string;
}

const CONTACT: Contact = {
  name: "Nafsam",
  initials: "N",
  gradientFrom: "#5BA4CF",
  gradientTo: "#2A7EC8",
  online: true,
};

function pad(n: number) {
  return String(n).padStart(2, "0");
}

function formatTime(secs: number) {
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  if (h > 0) return `${pad(h)}:${pad(m)}:${pad(s)}`;
  return `${pad(m)}:${pad(s)}`;
}

function nowTime() {
  const d = new Date();
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, text: "هلا 🌙", sent: false, time: "21:02" },
  { id: 2, text: "وينك؟ اشتقتلك", sent: false, time: "21:02" },
  { id: 3, text: "هلا فيك ❤️ هنا دايماً", sent: true, time: "21:03" },
  { id: 4, text: "تحب نتكلم صوت؟", sent: false, time: "21:04" },
];

const AUTO_REPLIES = [
  "تمام 😊",
  "حلو كثير ❤️",
  "صح كلامك",
  "هههه دمك خفيف",
  "وانا بعد اشتقتلك",
  "خبرني اكثر 👀",
  "اوكي، موجود",
  "🌙✨",
];

export default function App() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);

  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [draft, setDraft] = useState("");
  const [typing, setTyping] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endHideRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const endResetRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  const sendMessage = useCallback(() => {
    const text = draft.trim();
    if (!text) return;
    const mine: Message = { id: Date.now(), text, sent: true, time: nowTime() };
    setMessages((m) => [...m, mine]);
    setDraft("");

    setTyping(true);
    if (replyRef.current) clearTimeout(replyRef.current);
    replyRef.current = setTimeout(() => {
      const reply = AUTO_REPLIES[Math.floor(Math.random() * AUTO_REPLIES.length)];
      setTyping(false);
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, text: reply, sent: false, time: nowTime() },
      ]);
    }, 1400);
  }, [draft]);

  useEffect(
    () => () => {
      clearTimers();
      if (replyRef.current) clearTimeout(replyRef.current);
    },
    [clearTimers],
  );

  const statusText =
    callState === "calling"
      ? "Calling…"
      : callState === "ringing"
        ? "Ringing…"
        : callState === "connected"
          ? formatTime(elapsed)
          : callState === "ended"
            ? "Call Ended"
            : "";

  const isPulsing = callState === "calling" || callState === "ringing";

  return (
    <div className="tg-root">
      <ChatScreen
        contact={CONTACT}
        messages={messages}
        draft={draft}
        typing={typing}
        onDraftChange={setDraft}
        onSend={sendMessage}
        onCall={startCall}
        onVideoCall={startVideoCall}
      />

      <div className={`tg-overlay ${visible ? "tg-overlay--in" : "tg-overlay--out"}`}>
        {visible && (
          <CallScreen
            contact={CONTACT}
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
  contact,
  messages,
  draft,
  typing,
  onDraftChange,
  onSend,
  onCall,
  onVideoCall,
}: {
  contact: Contact;
  messages: Message[];
  draft: string;
  typing: boolean;
  onDraftChange: (v: string) => void;
  onSend: () => void;
  onCall: () => void;
  onVideoCall: () => void;
}) {
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  const handleKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="tg-chat-page">
      <div className="tg-chat-header">
        <div className="tg-chat-back">
          <svg width="11" height="19" viewBox="0 0 11 19" fill="none">
            <path d="M10 1L2 9.5L10 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Chats</span>
        </div>

        <div className="tg-chat-peer">
          <span className="tg-chat-peer-name">{contact.name}</span>
          <span className="tg-chat-peer-status">
            {contact.online ? "online" : "last seen recently"}
          </span>
        </div>

        <div className="tg-chat-header-right">
          <button className="tg-icon-btn" aria-label="Video call" onClick={onVideoCall}>
            <VideoCallIcon />
          </button>
          <button className="tg-icon-btn" aria-label="Voice call" onClick={onCall}>
            <PhoneIcon />
          </button>
          <Avatar contact={contact} size={36} />
        </div>
      </div>

      <div className="tg-chat-bg" />

      <div className="tg-chat-messages" ref={listRef}>
        <div className="tg-chat-day">Today</div>
        {messages.map((m) => (
          <div
            key={m.id}
            className={`tg-bubble-row ${m.sent ? "tg-bubble-row--out" : "tg-bubble-row--in"}`}
          >
            <div
              className={`tg-bubble ${m.sent ? "tg-bubble--out" : "tg-bubble--in"}`}
              dir="auto"
            >
              <span className="tg-bubble-text">{m.text}</span>
              <span className="tg-bubble-meta">
                {m.time}
                {m.sent && <ReadIcon />}
              </span>
            </div>
          </div>
        ))}
        {typing && (
          <div className="tg-bubble-row tg-bubble-row--in">
            <div className="tg-bubble tg-bubble--in tg-bubble--typing">
              <span className="tg-typing-dot" />
              <span className="tg-typing-dot" />
              <span className="tg-typing-dot" />
            </div>
          </div>
        )}
      </div>

      <div className="tg-composer">
        <button className="tg-composer-attach" aria-label="Attach">
          <AttachIcon />
        </button>
        <textarea
          className="tg-composer-input"
          placeholder="Message"
          rows={1}
          value={draft}
          dir="auto"
          onChange={(e) => onDraftChange(e.target.value)}
          onKeyDown={handleKey}
        />
        {draft.trim() ? (
          <button className="tg-composer-send" aria-label="Send" onClick={onSend}>
            <SendIcon />
          </button>
        ) : (
          <button className="tg-composer-mic" aria-label="Voice message">
            <MicIcon muted={false} />
          </button>
        )}
      </div>
    </div>
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
    <div className={`tg-call-screen ${callState === "ended" ? "tg-call-screen--ending" : ""}`}>
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
        <h2 className="tg-call-name">{contact.name}</h2>
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
            label={speaker ? "Speaker" : "Speaker"}
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
  return (
    <div
      className="tg-avatar"
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${contact.gradientFrom}, ${contact.gradientTo})`,
        fontSize: size * 0.38,
      }}
    >
      {contact.initials}
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

function ReadIcon() {
  return (
    <svg className="tg-read-icon" width="16" height="11" viewBox="0 0 16 11" fill="none">
      <path d="M1 5.5L4.2 8.7L10.5 1.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M5.5 8.5L6.2 9.2L12.5 2" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
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
