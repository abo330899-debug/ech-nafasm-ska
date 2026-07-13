const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";
const STATIC_TOKEN_KEY = "nafsam_token";
const STATIC_TOKEN_VALUE = "authenticated";
const STATIC_DEFAULT_OPEN_AT = "2026-05-29T17:00:00";
const IDENTITY_KEY = "nafsam_identity";

export interface CardHints { tr: string; fa: string; ar: string; en: string; }
export interface SessionCard { hints: CardHints; }
export interface SessionStatus {
  authed: boolean;
  openAt: number;
  isOpen: boolean;
  cards?: SessionCard[];
  cardCount?: number;
}
export type LoginResult =
  | { ok: true }
  | { ok: false; reason: "wrong" | "closed" | "rate_limited" | "network" };

function openAtValue(): number {
  const raw = (import.meta.env.VITE_OPEN_AT as string) || STATIC_DEFAULT_OPEN_AT;
  const value = new Date(raw).getTime();
  return Number.isFinite(value) ? value : new Date(STATIC_DEFAULT_OPEN_AT).getTime();
}

function saveIdentity(answer: string): void {
  const identity = answer.trim().toLowerCase() === "ska" ? "star" : "ilham";
  try { localStorage.setItem(IDENTITY_KEY, identity); } catch {}
  import("@/chat/chatAuth").then((m) => m.signInToChat(identity)).catch(() => {});
}

function clearIdentity(): void {
  try { localStorage.removeItem(IDENTITY_KEY); } catch {}
  import("@/chat/chatAuth").then((m) => m.signOutChat()).catch(() => {});
}

export async function fetchSession(): Promise<SessionStatus> {
  if (STATIC_MODE) {
    const openAt = openAtValue();
    try {
      return {
        authed: localStorage.getItem(STATIC_TOKEN_KEY) === STATIC_TOKEN_VALUE,
        openAt,
        isOpen: Date.now() >= openAt,
      };
    } catch {
      return { authed: false, openAt, isOpen: Date.now() >= openAt };
    }
  }
  try {
    const response = await fetch("/api/auth/session", { credentials: "same-origin", cache: "no-store" });
    if (!response.ok) return { authed: false, openAt: 0, isOpen: false };
    return await response.json() as SessionStatus;
  } catch {
    return { authed: false, openAt: 0, isOpen: false };
  }
}

export async function login(answer: string): Promise<LoginResult> {
  const normalized = answer.trim().toLowerCase();
  if (STATIC_MODE) {
    if (normalized !== "ska" && normalized !== "ilham") {
      return { ok: false, reason: "wrong" };
    }
    try {
      localStorage.setItem(STATIC_TOKEN_KEY, STATIC_TOKEN_VALUE);
      saveIdentity(normalized);
      return { ok: true };
    } catch {
      return { ok: false, reason: "network" };
    }
  }
  try {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (response.ok) { saveIdentity(normalized); return { ok: true }; }
    if (response.status === 403) return { ok: false, reason: "closed" };
    if (response.status === 429) return { ok: false, reason: "rate_limited" };
    return { ok: false, reason: "wrong" };
  } catch {
    return { ok: false, reason: "network" };
  }
}

export const AUTH_BROADCAST_CHANNEL = "nafsam-auth";
export const STORAGE_LOGOUT_KEY = "nafsam-logout";

export function broadcastLogout(): void {
  try {
    const channel = new BroadcastChannel(AUTH_BROADCAST_CHANNEL);
    channel.postMessage("logout");
    channel.close();
  } catch {}
  try { localStorage.setItem(STORAGE_LOGOUT_KEY, String(Date.now())); } catch {}
}

export async function logout(): Promise<void> {
  if (STATIC_MODE) {
    try { localStorage.removeItem(STATIC_TOKEN_KEY); } catch {}
    clearIdentity();
    broadcastLogout();
    return;
  }
  clearIdentity();
  try {
    await fetch("/api/auth/logout", { method: "POST", credentials: "same-origin" });
  } finally {
    broadcastLogout();
  }
}
