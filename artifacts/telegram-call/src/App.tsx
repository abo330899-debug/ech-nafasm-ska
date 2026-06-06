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

export default function App() {
  const [callState, setCallState] = useState<CallState>("idle");
  const [muted, setMuted] = useState(false);
  const [speaker, setSpeaker] = useState(false);
  const [videoOn, setVideoOn] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const sequenceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (sequenceRef.current) clearTimeout(sequenceRef.current);
    timerRef.current = null;
    sequenceRef.current = null;
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

  const endCall = useCallback(() => {
    clearTimers();
    setCallState("ended");
    setTimeout(() => {
      setVisible(false);
      setTimeout(() => {
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
          ? formatTime(elapsed)
          : callState === "ended"
            ? "Call Ended"
            : "";

  const isPulsing = callState === "calling" || callState === "ringing";

  return (
    <div className="tg-root">
      <ContactCard contact={CONTACT} onCall={startCall} />

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

function ContactCard({
  contact,
  onCall,
}: {
  contact: Contact;
  onCall: () => void;
}) {
  return (
    <div className="tg-contact-page">
      <div className="tg-contact-top-bar">
        <div className="tg-contact-back">
          <svg width="11" height="19" viewBox="0 0 11 19" fill="none">
            <path d="M10 1L2 9.5L10 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <span>Chats</span>
        </div>
        <div className="tg-contact-actions">
          <button className="tg-icon-btn" aria-label="Video call" onClick={onCall}>
            <VideoCallIcon />
          </button>
          <button className="tg-icon-btn" aria-label="Call" onClick={onCall}>
            <PhoneIcon />
          </button>
        </div>
      </div>

      <div className="tg-contact-info">
        <Avatar contact={contact} size={80} />
        <h1 className="tg-contact-name">{contact.name}</h1>
        <p className="tg-contact-status">{contact.online ? "online" : "last seen recently"}</p>
      </div>

      <div className="tg-contact-body">
        <div className="tg-info-section">
          <div className="tg-info-row">
            <div className="tg-info-icon tg-info-icon--blue">
              <PhoneIcon />
            </div>
            <div className="tg-info-content">
              <p className="tg-info-value">+1 234 567 8900</p>
              <p className="tg-info-label">mobile</p>
            </div>
          </div>
          <div className="tg-info-divider" />
          <div className="tg-info-row">
            <div className="tg-info-icon tg-info-icon--blue">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z" fill="currentColor" />
              </svg>
            </div>
            <div className="tg-info-content">
              <p className="tg-info-value">@{contact.name.toLowerCase()}</p>
              <p className="tg-info-label">Telegram</p>
            </div>
          </div>
        </div>

        <button className="tg-call-row" onClick={onCall}>
          <div className="tg-call-row-icon">
            <PhoneIcon />
          </div>
          <span>Voice Call</span>
        </button>
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
