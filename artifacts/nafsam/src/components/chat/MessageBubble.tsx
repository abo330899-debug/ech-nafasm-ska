import { useEffect, useState } from "react";
import { Trash2, Check, CheckCheck } from "lucide-react";
import { useChat } from "@/chat/chatContext";
import { type ChatMessage } from "@/chat/chatContext";
import { type ChatStrings } from "@/chat/chatI18n";

export type TickStatus = "sent" | "delivered" | "seen";

interface Props {
  message: ChatMessage;
  mine: boolean;
  senderLabel: string;
  status?: TickStatus;
  animate?: boolean;
  s: ChatStrings;
  onPreview: (url: string) => void;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({
  message,
  mine,
  senderLabel,
  status,
  animate,
  s,
  onPreview,
}: Props) {
  const { imageUrl, deleteMessage } = useChat();
  const [imgSrc, setImgSrc] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    if (message.image_path && !message.deleted) {
      imageUrl(message.image_path).then((url) => {
        if (active) setImgSrc(url);
      });
    } else {
      setImgSrc(null);
    }
    return () => {
      active = false;
    };
  }, [message.image_path, message.deleted, imageUrl]);

  async function handleDelete() {
    if (window.confirm(s.confirm_delete)) {
      try {
        await deleteMessage(message.id);
      } catch {
        /* ignore */
      }
    }
  }

  const statusLabel =
    status === "seen" ? s.seen : status === "delivered" ? s.delivered : s.sent;

  return (
    <div
      className={`chat-row ${mine ? "mine" : "theirs"} ${animate ? "is-new" : ""}`}
    >
      <div className={`chat-bubble ${message.deleted ? "is-deleted" : ""}`}>
        <span className="chat-sender">{senderLabel}</span>
        {message.deleted ? (
          <span className="chat-deleted">{s.deleted}</span>
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
    </div>
  );
}
