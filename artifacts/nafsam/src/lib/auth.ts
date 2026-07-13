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
  identity?: "star" | "ilham";
  cards?: SessionCard[];
  cardCount?: number;
}

export type LoginResult =
  | { ok: true; identity: "star" | "ilham" }
  | { ok: false; reason: "wrong" | "closed" | "rate_limited" | "network" };

const IDENTITY_KEY = "nafsam_identity";

async function onLoginSuccess(identity: "star" | "ilham"): Promise<void> {
  try {
    localStorage.setItem(IDENTITY_KEY, identity);
  } catch {
    /* ignore */
  }

  try {
    const chat = await import("@/chat/chatAuth");
    await chat.signInToChat(identity);
  } catch {
    // Chat sign-in is best-effort and must not block the main login.
  }
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

export async function fetchSession(): Promise<SessionStatus> {
  try {
    const res = await fetch("/api/auth/session", {
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!res.ok) return { authed: false, openAt: 0, isOpen: false };
    const session = (await res.json()) as SessionStatus;
    if (session.authed && session.identity) {
      try {
        localStorage.setItem(IDENTITY_KEY, session.identity);
      } catch {
        /* ignore */
      }
    }
    return session;
  } catch {
    return { authed: false, openAt: 0, isOpen: false };
  }
}

export async function login(answer: string): Promise<LoginResult> {
  try {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ answer }),
    });

    if (res.ok) {
      const data = (await res.json()) as { identity: "star" | "ilham" };
      await onLoginSuccess(data.identity);
      return { ok: true, identity: data.identity };
    }
    if (res.status === 403) return { ok: false, reason: "closed" };
    if (res.status === 429) return { ok: false, reason: "rate_limited" };
    if (res.status === 401) return { ok: false, reason: "wrong" };
    return { ok: false, reason: "network" };
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
    /* ignore */
  }
  try {
    localStorage.setItem(STORAGE_LOGOUT_KEY, String(Date.now()));
  } catch {
    /* ignore */
  }
}

export async function logout(): Promise<void> {
  onLogoutCleanup();
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } finally {
    broadcastLogout();
  }
}
