import { supabase } from "./supabaseClient";

export type ChatIdentity = "star" | "ilham";

const R2_BASE = ((import.meta.env.VITE_R2_BASE as string | undefined) ?? "").replace(
  /\/$/,
  "",
);

export function identityAvatar(id: ChatIdentity): string {
  const rel = `chat/${id}.jpg`;
  const encoded = rel.split("/").map(encodeURIComponent).join("/");
  return `${R2_BASE}/images/${encoded}`;
}

const IDENTITY_KEY = "nafsam_identity";
// SHA-256 hashes of the identity words (trimmed + lowercased) — plaintext
// words must never ship in the public bundle.
const STAR_WORD_HASHES = new Set([
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "525eca1d5089dbdcbb6700d910c5e0bc23fbaa23ee026c0e224c2b45490e5f29",
  "04ead045b10c1a7f4a3afb07f8f19339ac98ad1bf2aa09d08df8385c4cd62498",
]);

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// The Supabase chat password depends ONLY on the identity, not on the exact
// login word. The real gate stays the word login itself (the word is verified
// before chat sign-in ever runs); the data is protected by Supabase
// row-level security.
const CHAT_PASSWORDS: Record<ChatIdentity, string> = {
  star: "nafsam-ska",
  ilham: "nafsam-ilham",
};

const EMAILS: Record<ChatIdentity, string> = {
  star: "star@nafsam.app",
  ilham: "ilham@nafsam.app",
};

export async function deriveIdentity(answer: string): Promise<ChatIdentity> {
  try {
    const hash = await sha256Hex(answer.trim().toLowerCase());
    return STAR_WORD_HASHES.has(hash) ? "star" : "ilham";
  } catch {
    return "ilham";
  }
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

export function otherIdentity(id: ChatIdentity): ChatIdentity {
  return id === "star" ? "ilham" : "star";
}
