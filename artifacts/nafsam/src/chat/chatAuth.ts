import { supabase } from "./supabaseClient";

export type ChatIdentity = "star" | "ilham";

const IDENTITY_KEY = "nafsam_identity";

// Star unlocks with the word "ska"; every other valid Nafsam word is Ilham.
export const STAR_WORD = "ska";

// The Supabase account password is DERIVED from the login word with this fixed
// public prefix (kept >= 6 chars to satisfy Supabase's minimum). The real
// secret is the word itself, which is never stored in the bundle or git — only
// the prefix is. See CHAT_SETUP.md for how to create the two accounts.
const PW_PREFIX = "nafsam-";

const EMAILS: Record<ChatIdentity, string> = {
  star: "star@nafsam.app",
  ilham: "ilham@nafsam.app",
};

export function deriveIdentity(answer: string): ChatIdentity {
  return answer.trim().toLowerCase() === STAR_WORD ? "star" : "ilham";
}

export function chatPassword(answer: string): string {
  return PW_PREFIX + answer.trim().toLowerCase();
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

export async function signInToChat(
  identity: ChatIdentity,
  answer: string,
): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signInWithPassword({
    email: EMAILS[identity],
    password: chatPassword(answer),
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

export function otherIdentity(id: ChatIdentity): ChatIdentity {
  return id === "star" ? "ilham" : "star";
}
