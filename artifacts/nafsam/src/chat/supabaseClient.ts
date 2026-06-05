import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isChatConfigured = Boolean(url && anonKey);

// A single shared client. We persist the session in localStorage (under a
// dedicated key so it never collides with anything else) which means once a
// viewer signs in for chat, the Supabase session survives refreshes and tab
// reopens without us ever having to store their raw password anywhere.
export const supabase: SupabaseClient | null = isChatConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "nafsam-chat-auth",
      },
    })
  : null;

export const CHAT_BUCKET = "chat-images";
