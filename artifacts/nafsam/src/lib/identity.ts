// Single source of truth for the word -> identity mapping shared by the login
// flow (lib/auth.ts) and the activity tracker (lib/activity.ts). The identity
// is persisted in localStorage under IDENTITY_KEY and is also read by the
// Telegram chat app served on the same origin.

export type Identity = "star" | "ilham";

export const IDENTITY_KEY = "nafsam_identity";

// SHA-256 hashes of the identity words (trimmed + lowercased) — plaintext
// words must never ship in the public bundle.
const STAR_WORD_HASHES = new Set([
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "525eca1d5089dbdcbb6700d910c5e0bc23fbaa23ee026c0e224c2b45490e5f29",
  "04ead045b10c1a7f4a3afb07f8f19339ac98ad1bf2aa09d08df8385c4cd62498",
]);

export async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Maps a login word to its identity. Falls back to "ilham" on any error. */
export async function deriveIdentityFromWord(word: string): Promise<Identity> {
  try {
    const hash = await sha256Hex(word.trim().toLowerCase());
    return STAR_WORD_HASHES.has(hash) ? "star" : "ilham";
  } catch {
    return "ilham";
  }
}

/** Reads the persisted identity, or null when absent/invalid/unavailable. */
export function storedIdentity(): Identity | null {
  try {
    const v = localStorage.getItem(IDENTITY_KEY);
    return v === "star" || v === "ilham" ? v : null;
  } catch {
    return null;
  }
}
