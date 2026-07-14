import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Activity tracking — feeds the separate /monitor/ room.
//
// Every call here is best-effort and fail-silent: analytics must NEVER block or
// break login, navigation, or media playback. If Supabase is unreachable or the
// account cannot sign in, tracking simply no-ops.
//
// Identity model mirrors the chat app: the login word maps to "star" (owner) or
// "ilham" (viewer); each identity signs into its own fixed Supabase account so a
// BEFORE INSERT trigger can stamp the row's identity server-side. The dashboard
// reads the log through a SEPARATE monitor account whose password is never
// shipped in any bundle (see supabase/schema.sql).
// ---------------------------------------------------------------------------

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

const configured = Boolean(url && anonKey);

type Identity = "star" | "ilham";

const IDENTITY_KEY = "nafsam_identity";
const STAR_WORDS = new Set(["ska", "star", "kas"]);

// Fixed per-identity Supabase accounts (same as the chat app). These passwords
// are public-by-design; the real gate is the word login plus row-level security.
const EMAILS: Record<Identity, string> = {
  star: "star@nafsam.app",
  ilham: "ilham@nafsam.app",
};
const PASSWORDS: Record<Identity, string> = {
  star: "nafsam-ska",
  ilham: "nafsam-ilham",
};

export function deriveActivityIdentity(word: string): Identity {
  return STAR_WORDS.has(word.trim().toLowerCase()) ? "star" : "ilham";
}

function storedIdentity(): Identity | null {
  try {
    const v = localStorage.getItem(IDENTITY_KEY);
    return v === "star" || v === "ilham" ? v : null;
  } catch {
    return null;
  }
}

// A dedicated client with its OWN storage key so it never clobbers the chat
// session that lives on the same origin under "nafsam-chat-auth".
const client: SupabaseClient | null = configured
  ? createClient(url as string, anonKey as string, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        storageKey: "nafsam-activity-auth",
      },
    })
  : null;

let accessToken: string | null = null;
if (client) {
  client.auth.onAuthStateChange((_event, session) => {
    accessToken = session?.access_token ?? null;
  });
}

const HEARTBEAT_MS = 45_000;
let heartbeatTimer: ReturnType<typeof setInterval> | null = null;
let listenersBound = false;
let started = false;
let signInPromise: Promise<void> | null = null;

async function ensureSignedIn(): Promise<boolean> {
  if (!client) return false;
  const identity = storedIdentity();
  if (!identity) return false;
  try {
    const { data } = await client.auth.getSession();
    const current = data.session?.user?.email?.toLowerCase() ?? null;
    if (current === EMAILS[identity]) {
      accessToken = data.session?.access_token ?? accessToken;
      return true;
    }
    if (!signInPromise) {
      signInPromise = client.auth
        .signInWithPassword({
          email: EMAILS[identity],
          password: PASSWORDS[identity],
        })
        .then(({ data: signInData }) => {
          accessToken = signInData.session?.access_token ?? null;
        })
        .catch(() => {})
        .finally(() => {
          signInPromise = null;
        });
    }
    await signInPromise;
    return Boolean(accessToken);
  } catch {
    return false;
  }
}

/** Fire-and-forget: record one activity event. Never throws. */
export function logActivity(
  kind: string,
  label?: string | null,
  meta?: Record<string, unknown>,
): void {
  if (!client) return;
  void (async () => {
    try {
      const ok = await ensureSignedIn();
      if (!ok) return;
      await client.from("activity_events").insert({
        kind,
        label: label ?? null,
        meta: meta ?? null,
      });
    } catch {
      /* swallow — analytics must never surface errors */
    }
  })();
}

// The pagehide/hidden "leave" must survive the page being torn down, so it can't
// rely on the async supabase-js insert. A keepalive fetch straight to PostgREST
// is delivered by the browser even as the tab closes. sendBeacon can't set the
// apikey/Authorization headers PostgREST requires, so we use fetch(keepalive).
function sendLeaveBeacon(): void {
  if (!client || !url || !anonKey || !accessToken) return;
  try {
    void fetch(`${url}/rest/v1/activity_events`, {
      method: "POST",
      keepalive: true,
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: "return=minimal",
      },
      body: JSON.stringify({ kind: "leave", label: null }),
    });
  } catch {
    /* ignore */
  }
}

function onVisibility(): void {
  if (document.visibilityState === "hidden") {
    sendLeaveBeacon();
  } else if (document.visibilityState === "visible") {
    logActivity("heartbeat");
  }
}

/**
 * Begin tracking for the current authed viewer. Idempotent — safe to call on
 * every render / auth transition. Signs the activity client in (if needed),
 * logs an "open" event, and starts the heartbeat + leave listeners.
 */
export function startActivityTracking(): void {
  if (!client || started) return;
  if (!storedIdentity()) return;
  started = true;

  logActivity("open");

  if (heartbeatTimer === null) {
    heartbeatTimer = setInterval(() => {
      if (document.visibilityState === "visible") logActivity("heartbeat");
    }, HEARTBEAT_MS);
  }

  if (!listenersBound) {
    listenersBound = true;
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("pagehide", sendLeaveBeacon);
  }
}

/** Log the explicit login moment (called right after a successful word login). */
export function logLogin(word: string): void {
  const identity = deriveActivityIdentity(word);
  logActivity("login", identity);
  // Kick off tracking on the next tick so sign-in can settle.
  startActivityTracking();
}

/** Stop tracking and drop the activity session (local scope only!). */
export function stopActivityTracking(): void {
  if (!client) {
    started = false;
    return;
  }
  sendLeaveBeacon();
  logActivity("logout");
  if (heartbeatTimer !== null) {
    clearInterval(heartbeatTimer);
    heartbeatTimer = null;
  }
  if (listenersBound) {
    listenersBound = false;
    document.removeEventListener("visibilitychange", onVisibility);
    window.removeEventListener("pagehide", sendLeaveBeacon);
  }
  started = false;
  // scope 'local' so we never revoke the chat PWA's global session.
  client.auth.signOut({ scope: "local" }).catch(() => {});
  accessToken = null;
}
