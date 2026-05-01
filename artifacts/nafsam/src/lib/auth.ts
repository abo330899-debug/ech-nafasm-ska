export interface SessionStatus {
  authed: boolean;
  openAt: number;
  isOpen: boolean;
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

export async function logout(): Promise<void> {
  try {
    await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
  } catch {
    /* ignore */
  }
}
