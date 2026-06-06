import { useEffect, useRef, useState } from "react";
import { Trash2, Check, CheckCheck, SmilePlus } from "lucide-react";
import { useChat } from "@/chat/chatContext";
import { type ChatMessage } from "@/chat/chatContext";
import { type ChatStrings } from "@/chat/chatI18n";
import {
  type ChatIdentity,
  identityAvatar,
  otherIdentity,
} from "@/chat/chatAuth";
import { parseVoice, REACTION_EMOJIS } from "@/chat/chatMedia";
import VoicePlayer from "./VoicePlayer";

export type TickStatus = "sent" | "delivered" | "seen";

interface Props {
  message: ChatMessage;
  mine: boolean;
  senderLabel: string;
  showAvatar: boolean;
  status?: TickStatus;
  animate?: boolean;
  reactions?: Partial<Record<ChatIdentity, string>>;
  myIdentity: ChatIdentity | null;
  s: ChatStrings;
  onPreview: (url: string) => void;
  onReact: (emoji: string) => void;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({
  message,
  mine,
  senderLabel,
  showAvatar,
  status,
  animate,
  reactions,
  myIdentity,
  s,
  onPreview,
  onReact,
}: Props) {
  const { imageUrl, deleteMessage } = useChat();
  const [imgSrc, setImgSrc] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const pickerRef = useRef<HTMLDivElement>(null);

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
    if (!pickerOpen) return;
    const onDocClick = (e: MouseEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("pointerdown", onDocClick);
    return () => document.removeEventListener("pointerdown", onDocClick);
  }, [pickerOpen]);

  async function handleDelete() {
    if (window.confirm(s.confirm_delete)) {
      try {
        await deleteMessage(message.id);
      } catch {
        /* ignore */
      }
    }
  }

  function react(emoji: string) {
    setPickerOpen(false);
    onReact(emoji);
  }

  const statusLabel =
    status === "seen" ? s.seen : status === "delivered" ? s.delivered : s.sent;

  // Collapse the two possible reactors into emoji chips with a count.
  const reactionChips: { emoji: string; count: number; mineSet: boolean }[] =
    [];
  if (reactions) {
    const order: ChatIdentity[] = ["star", "ilham"];
    for (const reactor of order) {
      const emoji = reactions[reactor];
      if (!emoji) continue;
      const existing = reactionChips.find((c) => c.emoji === emoji);
      if (existing) {
        existing.count += 1;
        if (reactor === myIdentity) existing.mineSet = true;
      } else {
        reactionChips.push({
          emoji,
          count: 1,
          mineSet: reactor === myIdentity,
        });
      }
    }
  }

  return (
    <div
      className={`chat-row ${mine ? "mine" : "theirs"} ${
        animate ? "is-new" : ""
      }`}
    >
      {!mine && (
        <div className={`chat-row-avatar ${showAvatar ? "" : "is-hidden"}`}>
          {myIdentity ? (
            <img
              src={identityAvatar(otherIdentity(myIdentity))}
              alt={senderLabel}
            />
          ) : (
            senderLabel.charAt(0)
          )}
        </div>
      )}

      <div className="chat-bubble-wrap">
        <div
          className={`chat-bubble ${message.deleted ? "is-deleted" : ""} ${
            voice ? "is-voice" : ""
          }`}
        >
          {!mine && showAvatar && (
            <span className="chat-sender">{senderLabel}</span>
          )}
          {message.deleted ? (
            <span className="chat-deleted">{s.deleted}</span>
          ) : voice ? (
            <VoicePlayer
              path={message.image_path as string}
              durationMs={voice.durationMs}
              mine={mine}
            />
          ) : (
            <>
              {imgSrc && (
                <button
                  type="button"
                  className="chat-image-btn"
                  onClick={() => onPreview(imgSrc)}
                >
                  <img src={imgSrc} alt={s.image_alt} className="chat-image" />
                </button>
              )}
              {message.body && (
                <p className="chat-text" dir="auto">
                  {message.body}
                </p>
              )}
            </>
          )}
          <span className="chat-meta">
            <span className="chat-time">{timeLabel(message.created_at)}</span>
            {mine && !message.deleted && status && (
              <span
                className={`chat-ticks is-${status}`}
                role="img"
                aria-label={statusLabel}
                title={statusLabel}
              >
                {status === "sent" ? (
                  <Check size={14} strokeWidth={2.4} />
                ) : (
                  <CheckCheck size={14} strokeWidth={2.4} />
                )}
              </span>
            )}
          </span>

          {!message.deleted && (
            <div className="chat-react" ref={pickerRef}>
              <button
                type="button"
                className="chat-react-trigger"
                onClick={() => setPickerOpen((v) => !v)}
                aria-label={s.react}
                title={s.react}
              >
                <SmilePlus size={15} />
              </button>
              {pickerOpen && (
                <div className="chat-react-menu" role="menu">
                  {REACTION_EMOJIS.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      className={`chat-react-opt ${
                        reactions?.[myIdentity ?? "star"] === emoji
                          ? "is-active"
                          : ""
                      }`}
                      onClick={() => react(emoji)}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {mine && !message.deleted && (
            <button
              type="button"
              className="chat-delete"
              onClick={handleDelete}
              aria-label={s.delete}
              title={s.delete}
            >
              <Trash2 size={13} />
            </button>
          )}
        </div>

        {reactionChips.length > 0 && (
          <div className="chat-reactions">
            {reactionChips.map((c) => (
              <button
                type="button"
                key={c.emoji}
                className={`chat-reaction-chip ${c.mineSet ? "is-mine" : ""}`}
                onClick={() => onReact(c.emoji)}
                title={s.react}
              >
                <span className="chat-reaction-emoji">{c.emoji}</span>
                {c.count > 1 && (
                  <span className="chat-reaction-count">{c.count}</span>
                )}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
