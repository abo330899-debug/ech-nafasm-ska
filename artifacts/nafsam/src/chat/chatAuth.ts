import { supabase } from "./supabaseClient";

export type ChatIdentity = "star" | "ilham";

const IDENTITY_KEY = "nafsam_identity";
export const STAR_WORDS = new Set(["ska", "star", "kas"]);

// The Supabase chat password depends ONLY on the identity, not on the exact
// login word. The real gate stays the Nafsam login itself (the word is
// verified before chat sign-in ever runs); the data is protected by Supabase
// row-level security.
const CHAT_PASSWORDS: Record<ChatIdentity, string> = {
  star: "nafsam-ska",
  ilham: "nafsam-ilham",
};

const EMAILS: Record<ChatIdentity, string> = {
  star: "star@nafsam.app",
  ilham: "ilham@nafsam.app",
};

export function deriveIdentity(answer: string): ChatIdentity {
  return STAR_WORDS.has(answer.trim().toLowerCase()) ? "star" : "ilham";
}

export function storeIdentity(id: ChatIdentity): void {
  try {
    localStorage.setItem(IDENTITY_KEY, id);
  } catch {
    /* ignore */
  }
}

export function getIdentity(): ChatIdentity | null {
  try {
    const value = localStorage.getItem(IDENTITY_KEY);
    return value === "star" || value === "ilham" ? value : null;
  } catch {
    return null;
  }
}

export function clearIdentity(): void {
  try {
    localStorage.removeItem(IDENTITY_KEY);
  } catch {
    /* ignore */
  }
}

export async function signInToChat(identity: ChatIdentity): Promise<void> {
  storeIdentity(identity);
  if (!supabase) return;
  const { error } = await supabase.auth.signInWithPassword({
    email: EMAILS[identity],
    password: CHAT_PASSWORDS[identity],
  });
  if (error) throw error;
}

export async function signOutChat(): Promise<void> {
  try {
    await supabase?.auth.signOut();
  } catch {
    /* ignore */
  }
  clearIdentity();
}

export function expectedEmail(id: ChatIdentity): string {
  return EMAILS[id].toLowerCase();
}

export function identityName(id: ChatIdentity): string {
  return id === "star" ? "Star" : "إلهام";
}

const SHORT_LABELS: Record<ChatIdentity, string> = {
  star: "ska.",
  ilham: "ech.",
};

export function identityShort(id: ChatIdentity): string {
  return SHORT_LABELS[id];
}

export function otherIdentity(id: ChatIdentity): ChatIdentity {
  return id === "star" ? "ilham" : "star";
}
