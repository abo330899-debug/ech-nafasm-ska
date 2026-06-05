const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";

// Canonical login-word hashes, baked directly into the source so the deployed
// build NEVER depends on a Cloudflare dashboard / env value being present or
// up to date. Each entry is sha256(word.trim().toLowerCase()). These are safe
// to ship publicly (they already live in the downloadable bundle). To add or
// change words, regenerate with the gen-auth-tokens script (see replit.md) and
// paste the new hashes here.
const AUTH_TOKENS_BUILTIN = [
  "89332e726a92700b68820e4371347aff05cfbe5fcef459a7e9916266fbbbb6ac",
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "69f81f0d193d163268d961aae99c2e3adf6b5ebe81a97280cf0c235d2f5f3338",
  "470c8021ba0912f4108bffbb4fe562367912d992f7a1388850b28d34a4a25170",
  "3ac9f21c626cc89623ba69d7f48fb348d7dcbe3a9acf796c0868a66f4082f39b",
  "0525705f408768f535ef15e1364fec9e1fa4d4100d0e7bab903f708c75bd5d3c",
];

// The env var (if set) only ADDS to the built-in list — it can never remove a
// word — so a missing or stale VITE_AUTH_TOKENS can't lock anyone out.
const AUTH_TOKENS = Array.from(
  new Set(
    [...AUTH_TOKENS_BUILTIN, ...(import.meta.env.VITE_AUTH_TOKENS ?? "").split(",")]
      .map((s: string) => s.trim().toLowerCase())
      .filter(Boolean),
  ),
);

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
      const hash = await sha256(answer.trim().toLowerCase());
      if (AUTH_TOKENS.includes(hash)) {
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
