import { createContext, useContext } from "react";
import type { ChatIdentity } from "./chatAuth";

export interface ChatMessage {
  id: string;
  sender_name: ChatIdentity;
  body: string | null;
  image_path: string | null;
  created_at: string;
  deleted: boolean;
}

export interface ChatContextValue {
  configured: boolean;
  ready: boolean;
  authError: boolean;
  identity: ChatIdentity | null;
  messages: ChatMessage[];
  otherOnline: boolean;
  otherTyping: boolean;
  otherLastSeen: number | null;
  otherLastRead: number | null;
  unread: number;
  sendText: (body: string) => Promise<void>;
  sendImage: (file: File) => Promise<void>;
  deleteMessage: (id: string) => Promise<void>;
  notifyTyping: () => void;
  markRead: () => void;
  imageUrl: (path: string) => Promise<string | null>;
}

// The default value doubles as a safe "disabled" context, so components such as
// the Navbar can call useChat() before the (lazily-loaded) ChatProvider mounts
// without crashing — and without pulling @supabase/supabase-js into the eager
// pre-login bundle. This light module imports no Supabase code.
const DEFAULT_CHAT: ChatContextValue = {
  configured: false,
  ready: false,
  authError: false,
  identity: null,
  messages: [],
  otherOnline: false,
  otherTyping: false,
  otherLastSeen: null,
  otherLastRead: null,
  unread: 0,
  sendText: async () => {},
  sendImage: async () => {},
  deleteMessage: async () => {},
  notifyTyping: () => {},
  markRead: () => {},
  imageUrl: async () => null,
};

export const ChatContext = createContext<ChatContextValue>(DEFAULT_CHAT);

export function useChat(): ChatContextValue {
  return useContext(ChatContext);
}
