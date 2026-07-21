import { logLogin, stopActivityTracking } from "@/lib/activity";

const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";
const STATIC_TOKEN_KEY = "nafsam_token";
const STATIC_TOKEN_VALUE = "authenticated";
const STATIC_DEFAULT_OPEN_AT = "2026-05-29T17:00:00";
const IDENTITY_KEY = "nafsam_identity";

// SHA-256 hashes of accepted login words (trimmed + lowercased).
// Canonical list lives in the NAFSAM_PASSWORDS secret — never list words here.
const AUTH_TOKENS_BUILTIN = [
  "89332e726a92700b68820e4371347aff05cfbe5fcef459a7e9916266fbbbb6ac",
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "470c8021ba0912f4108bffbb4fe562367912d992f7a1388850b28d34a4a25170",
  "69f81f0d193d163268d961aae99c2e3adf6b5ebe81a97280cf0c235d2f5f3338",
  "c30609e972999f1687758abe73a07ba12a56a009784d9c8c910a6982d55c212c",
];

function authTokens(): Set<string> {
  const tokens = new Set(AUTH_TOKENS_BUILTIN);
  const extra = (import.meta.env.VITE_AUTH_TOKENS as string | undefined) || "";
  for (const raw of extra.split(",")) {
    const token = raw.trim().toLowerCase();
    if (token) tokens.add(token);
  }
  return tokens;
}

async function sha256Hex(text: string): Promise<string> {
  const data = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// SHA-256 hashes of the identity words (trimmed + lowercased) — plaintext
// words must never ship in the public bundle.
const STAR_WORD_HASHES = new Set([
  "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1",
  "525eca1d5089dbdcbb6700d910c5e0bc23fbaa23ee026c0e224c2b45490e5f29",
  "04ead045b10c1a7f4a3afb07f8f19339ac98ad1bf2aa09d08df8385c4cd62498",
]);

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

async function saveIdentity(answer: string): Promise<void> {
  let identity = "ilham";
  try {
    const hash = await sha256Hex(answer.trim().toLowerCase());
    if (STAR_WORD_HASHES.has(hash)) identity = "star";
  } catch {}
  try { localStorage.setItem(IDENTITY_KEY, identity); } catch {}
}

function clearIdentity(): void {
  try { localStorage.removeItem(IDENTITY_KEY); } catch {}
  // The Telegram chat app (served under /telegram-call/ on this same origin)
  // stores its Supabase session under this key; drop it on logout too.
  try { localStorage.removeItem("nafsam-chat-auth"); } catch {}
  // The activity tracker keeps its own Supabase session; drop it too.
  try { localStorage.removeItem("nafsam-activity-auth"); } catch {}
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
    try {
      const hash = await sha256Hex(normalized);
      if (!authTokens().has(hash)) {
        return { ok: false, reason: "wrong" };
      }
      localStorage.setItem(STATIC_TOKEN_KEY, STATIC_TOKEN_VALUE);
      await saveIdentity(normalized);
      logLogin(normalized);
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
    if (response.ok) { await saveIdentity(normalized); logLogin(normalized); return { ok: true }; }
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
  stopActivityTracking();
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
