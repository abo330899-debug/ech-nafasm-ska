import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

export const isConfigured = Boolean(url && anonKey);

// The monitoring room reads the activity log through a dedicated reader account
// (monitor@nafsam.app). Its password is typed by the owner at login and is never
// shipped in any bundle. We persist the session under a unique storage key so it
// never collides with the archive or chat sessions on the same origin.
export const supabase: SupabaseClient | null = isConfigured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "nafsam-monitor-auth",
      },
    })
  : null;

export const READER_EMAIL = "monitor@nafsam.app";
