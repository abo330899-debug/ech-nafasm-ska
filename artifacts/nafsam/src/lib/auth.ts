const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";
const AUTH_TOKENS_ENV = import.meta.env.VITE_AUTH_TOKENS ?? "";
const STATIC_TOKEN_KEY = "nafsam_token";
const STATIC_TOKEN_VALUE = "authenticated";
const STATIC_DEFAULT_OPEN_AT = "2026-05-29T17:00:00";

function staticOpenAt(): number {
  const raw = (import.meta.env.VITE_OPEN_AT as string) || STATIC_DEFAULT_OPEN_AT;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : new Date(STATIC_DEFAULT_OPEN_AT).getTime();
}

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export interface CardHints {
  tr: string;
  fa: string;
  ar: string;
  en: string;
}

export interface SessionCard {
  hints: CardHints;
}

export interface SessionStatus {
  authed: boolean;
  openAt: number;
  isOpen: boolean;
  cards?: SessionCard[];
  cardCount?: number;
}

export async function fetchSession(): Promise<SessionStatus> {
  if (STATIC_MODE) {
    const openAt = staticOpenAt();
    const isOpen = Date.now() >= openAt;
    try {
      const token = localStorage.getItem(STATIC_TOKEN_KEY);
      return { authed: token === STATIC_TOKEN_VALUE, openAt, isOpen };
    } catch {
      return { authed: false, openAt, isOpen };
    }
  }
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (!res.ok) return { authed: false, openAt: 0, isOpen: false };
    return (await res.json()) as SessionStatus;
  } catch {
    return { authed: false, openAt: 0, isOpen: false };
  }
}

export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "wrong" | "closed" | "rate_limited" | "network" };

const IDENTITY_KEY = "nafsam_identity";

// Derive the chat identity from the login word and kick off a background
// Supabase sign-in. Supabase is dynamically imported so it never lands in the
// eager auth bundle, and the sign-in is best-effort: it must never block or
// fail the Nafsam login itself.
function onLoginSuccess(answer: string): void {
  const id = answer.trim().toLowerCase() === "ska" ? "star" : "ilham";
  try {
    localStorage.setItem(IDENTITY_KEY, id);
  } catch {
    /* ignore */
  }
  import("@/chat/chatAuth")
    .then((m) => m.signInToChat(id))
    .catch(() => {});
}

function onLogoutCleanup(): void {
  try {
    localStorage.removeItem(IDENTITY_KEY);
  } catch {
    /* ignore */
  }
  import("@/chat/chatAuth")
    .then((m) => m.signOutChat())
    .catch(() => {});
}

export async function login(answer: string): Promise<LoginResult> {
  if (STATIC_MODE) {
    try {
      const hashes = AUTH_TOKENS_ENV.split(",").map((s: string) => s.trim()).filter(Boolean);
      const hash = await sha256(answer.trim().toLowerCase());
      if (hashes.includes(hash)) {
        localStorage.setItem(STATIC_TOKEN_KEY, STATIC_TOKEN_VALUE);
        onLoginSuccess(answer);
        return { ok: true };
      }
      return { ok: false, reason: "wrong" };
    } catch {
      return { ok: false, reason: "network" };
    }
  }
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (res.ok) {
      onLoginSuccess(answer);
      return { ok: true };
    }
    if (res.status === 403) return { ok: false, reason: "closed" };
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "wrong" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export const AUTH_BROADCAST_CHANNEL = "nafsam-auth";
export const STORAGE_LOGOUT_KEY = "nafsam-logout";

export function broadcastLogout(): void {
  try {
    const bc = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    bc.postMessage("logout");
    bc.close();
  } catch {
    // BroadcastChannel not available
  }
  try {
    localStorage.setItem(STORAGE_LOGOUT_KEY, String(Date.now()));
  } catch {
    // localStorage not available
  }
}

export async function logout(): Promise<void> {
  if (STATIC_MODE) {
    try { localStorage.removeItem(STATIC_TOKEN_KEY); } catch { /* ignore */ }
    onLogoutCleanup();
    broadcastLogout();
    return;
  }
  onLogoutCleanup();
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error("logout_failed");
  broadcastLogout();
}
