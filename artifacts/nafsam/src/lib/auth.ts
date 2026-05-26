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

export async function login(answer: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ answer }),
    });
    if (res.ok) return { ok: true };
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
    // BroadcastChannel not available in this context
  }
  try {
    localStorage.setItem(STORAGE_LOGOUT_KEY, String(Date.now()));
  } catch {
    // localStorage not available in this context
  }
}

export async function logout(): Promise<void> {
  const res = await fetch("/api/auth/logout", {
    method: "POST",
    credentials: "same-origin",
  });
  if (!res.ok) {
    throw new Error("logout_failed");
  }
  broadcastLogout();
}
