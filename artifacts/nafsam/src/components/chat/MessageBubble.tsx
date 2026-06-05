import { useEffect, useState } from "react";
import { Trash2 } from "lucide-react";
import { useChat } from "@/chat/chatContext";
import { type ChatMessage } from "@/chat/chatContext";
import { type ChatStrings } from "@/chat/chatI18n";

interface Props {
  message: ChatMessage;
  mine: boolean;
  s: ChatStrings;
  onPreview: (url: string) => void;
}

function timeLabel(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function MessageBubble({ message, mine, s, onPreview }: Props) {
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

  return (
    <div className={`chat-row ${mine ? "mine" : "theirs"}`}>
      <div className={`chat-bubble ${message.deleted ? "is-deleted" : ""}`}>
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
            {message.body && <p className="chat-text">{message.body}</p>}
          </>
        )}
        <span className="chat-time">{timeLabel(message.created_at)}</span>
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
