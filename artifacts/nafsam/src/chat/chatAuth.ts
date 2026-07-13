import { supabase } from "./supabaseClient";

export type ChatIdentity = "star" | "ilham";

const IDENTITY_KEY = "nafsam_identity";
export const STAR_WORD = "ska";

export function deriveIdentity(answer: string): ChatIdentity {
  return answer.trim().toLowerCase() === STAR_WORD ? "star" : "ilham";
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

  const response = await fetch("/api/chat/session", {
    method: "POST",
    credentials: "same-origin",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok) throw new Error("chat_auth_failed");

  const session = (await response.json()) as {
    access_token: string;
    refresh_token: string;
    identity: ChatIdentity;
  };
  if (session.identity !== identity) throw new Error("chat_identity_mismatch");

  const { error } = await supabase.auth.setSession({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
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
  return id === "star" ? "star@nafsam.app" : "ilham@nafsam.app";
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
