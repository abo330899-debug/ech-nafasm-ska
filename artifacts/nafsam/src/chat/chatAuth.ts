import { supabase } from "./supabaseClient";
import starAvatar from "@/assets/star.jpeg";
import ilhamAvatar from "@/assets/ilham.jpeg";

export type ChatIdentity = "star" | "ilham";

const IDENTITY_KEY = "nafsam_identity";

// Star unlocks with the word "ska"; every other valid Nafsam word is Ilham.
export const STAR_WORD = "ska";

// The Supabase chat password depends ONLY on the identity, not on the exact
// login word. Ilham can sign into Nafsam with several different valid words, so
// deriving the password from the word would break the moment she used a word
// other than the one her account was created with. The real gate stays the
// Nafsam login itself (the word is verified before chat sign-in ever runs); the
// data is protected by Supabase row-level security. See CHAT_SETUP.md.
const CHAT_PASSWORDS: Record<ChatIdentity, string> = {
  star: "nafsam-ska",
  ilham: "nafsam-ilham",
};

const EMAILS: Record<ChatIdentity, string> = {
  star: "star@nafsam.app",
  ilham: "ilham@nafsam.app",
};

export function deriveIdentity(answer: string): ChatIdentity {
  return answer.trim().toLowerCase() === STAR_WORD ? "star" : "ilham";
}

export function chatPassword(identity: ChatIdentity): string {
  return CHAT_PASSWORDS[identity];
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
    const v = localStorage.getItem(IDENTITY_KEY);
    return v === "star" || v === "ilham" ? v : null;
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
  if (!supabase) return;
  await supabase.auth.signInWithPassword({
    email: EMAILS[identity],
    password: CHAT_PASSWORDS[identity],
  });
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

const AVATARS: Record<ChatIdentity, string> = {
  star: starAvatar,
  ilham: ilhamAvatar,
};

export function identityAvatar(id: ChatIdentity): string {
  return AVATARS[id];
}

export function otherIdentity(id: ChatIdentity): ChatIdentity {
  return id === "star" ? "ilham" : "star";
}
