import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { supabase, isChatConfigured, CHAT_BUCKET } from "./supabaseClient";
import {
  getIdentity,
  otherIdentity,
  expectedEmail,
  type ChatIdentity,
} from "./chatAuth";
import {
  ChatContext,
  type ChatContextValue,
  type ChatMessage,
} from "./chatContext";
import {
  type Reactions,
  isControlBody,
  parseReaction,
  buildReactionBody,
  voiceFileName,
  extForAudioType,
} from "./chatMedia";

const LAST_READ_KEY = "nafsam_chat_lastread";
const LAST_SEEN_KEY = "nafsam_chat_lastseen";

function getLastRead(): number {
  try {
    const v = localStorage.getItem(LAST_READ_KEY);
    return v ? Number(v) || 0 : 0;
  } catch {
    return 0;
  }
}

function setLastRead(ts: number): void {
  try {
    localStorage.setItem(LAST_READ_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

function getStoredLastSeen(): number | null {
  try {
    const v = localStorage.getItem(LAST_SEEN_KEY);
    return v ? Number(v) || null : null;
  } catch {
    return null;
  }
}

function setStoredLastSeen(ts: number): void {
  try {
    localStorage.setItem(LAST_SEEN_KEY, String(ts));
  } catch {
    /* ignore */
  }
}

const OTHER_READ_KEY = "nafsam_chat_otherread";

// Scope the stored peer read-marker by our own identity so that switching
// identities on a shared device never resurrects a stale "seen" state.
function getStoredOtherRead(id: string | null): number | null {
  if (!id) return null;
  try {
    const v = localStorage.getItem(`${OTHER_READ_KEY}_${id}`);
    return v ? Number(v) || null : null;
  } catch {
    return null;
  }
}

function setStoredOtherRead(id: string | null, ts: number): void {
  if (!id) return;
  try {
    localStorage.setItem(`${OTHER_READ_KEY}_${id}`, String(ts));
  } catch {
    /* ignore */
  }
}

const signedUrlCache = new Map<string, { url: string; expires: number }>();

export function ChatProvider({
  enabled,
  children,
}: {
  enabled: boolean;
  children: React.ReactNode;
}) {
  const [ready, setReady] = useState(false);
  const [authError, setAuthError] = useState(false);
  // Raw rows include reaction "control messages"; they are reduced/filtered below.
  const [rows, setRows] = useState<ChatMessage[]>([]);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [otherLastSeen, setOtherLastSeen] = useState<number | null>(() =>
    getStoredLastSeen(),
  );
  const [otherLastRead, setOtherLastRead] = useState<number | null>(() =>
    getStoredOtherRead(getIdentity()),
  );
  const [lastRead, setLastReadState] = useState<number>(() => getLastRead());

  const identity = getIdentity();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const upsertRow = useCallback((row: ChatMessage) => {
    setRows((prev) => {
      const idx = prev.findIndex((m) => m.id === row.id);
      if (idx >= 0) {
        const next = prev.slice();
        next[idx] = row;
        return next;
      }
      const next = [...prev, row];
      next.sort((a, b) => a.created_at.localeCompare(b.created_at));
      return next;
    });
  }, []);

  useEffect(() => {
    if (!enabled || !isChatConfigured || !supabase || !identity) {
      setReady(false);
      return;
    }

    const client = supabase;
    const me = identity as ChatIdentity;
    const them = otherIdentity(me);
    const expected = expectedEmail(me);

    let cancelled = false;
    let channel: RealtimeChannel | null = null;
    let authTimer: ReturnType<typeof setTimeout> | null = null;

    async function loadSnapshot() {
      // Fetch the *most recent* window. Ordering ascending + limit would return
      // the oldest rows; descending keeps the live conversation in view. Reaction
      // "control" rows share this table, so a generous window keeps recent
      // messages and their reactions together; the merge below re-sorts ascending.
      const { data, error } = await client
        .from("messages")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (cancelled || error || !data) return;
      // Merge rather than replace: realtime inserts that arrived between
      // subscribe and this fetch are already in state and must be kept.
      setRows((prev) => {
        const map = new Map(prev.map((m) => [m.id, m]));
        for (const row of data as ChatMessage[]) map.set(row.id, row);
        return Array.from(map.values()).sort((a, b) =>
          a.created_at.localeCompare(b.created_at),
        );
      });
    }

    function setupChannel() {
      if (cancelled || channel) return;
      channel = client
        .channel("nafsam-chat", {
          config: { presence: { key: me } },
        })
        .on(
          "postgres_changes",
          { event: "INSERT", schema: "public", table: "messages" },
          (payload) => upsertRow(payload.new as ChatMessage),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          (payload) => upsertRow(payload.new as ChatMessage),
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "messages" },
          (payload) => {
            const old = payload.old as { id?: string };
            if (old?.id) {
              setRows((prev) => prev.filter((m) => m.id !== old.id));
            }
          },
        )
        .on("presence", { event: "sync" }, () => {
          const state = channel?.presenceState() ?? {};
          const metas = (state[them] ?? []) as Array<{ read?: number }>;
          const online = metas.length > 0;
          setOtherOnline(online);
          if (online) {
            const now = Date.now();
            setStoredLastSeen(now);
            setOtherLastSeen(now);
          }
          let theirRead = 0;
          for (const meta of metas) {
            if (typeof meta.read === "number" && meta.read > theirRead) {
              theirRead = meta.read;
            }
          }
          if (theirRead > 0) {
            setOtherLastRead((prev) => {
              const next = Math.max(prev ?? 0, theirRead);
              setStoredOtherRead(identity, next);
              return next;
            });
          }
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.identity && payload.identity !== me) {
            setOtherTyping(true);
            if (typingTimeoutRef.current)
              clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = setTimeout(
              () => setOtherTyping(false),
              3500,
            );
          }
        });

      channelRef.current = channel;

      channel.subscribe(async (status) => {
        if (cancelled) return;
        if (status === "SUBSCRIBED") {
          await channel?.track({
            identity: me,
            at: Date.now(),
            read: getLastRead(),
          });
          // Subscribe first, then snapshot, so no inserts slip through the gap.
          await loadSnapshot();
          if (!cancelled) setReady(true);
        } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
          if (!cancelled) setReady(false);
        }
      });
    }

    // A Supabase session whose email matches the derived identity is required.
    // If it belongs to a different account, fail closed instead of mislabeling.
    function onSession(session: { user?: { email?: string | null } } | null) {
      if (cancelled || channel) return;
      if (!session) return;
      const email = session.user?.email?.toLowerCase();
      if (email !== expected) {
        setAuthError(true);
        setReady(false);
        return;
      }
      if (authTimer) {
        clearTimeout(authTimer);
        authTimer = null;
      }
      setAuthError(false);
      setupChannel();
    }

    // The derived-password sign-in is kicked off at login and may still be in
    // flight when this provider mounts, so react to the auth state instead of
    // reading getSession() once and giving up.
    const { data: sub } = client.auth.onAuthStateChange((_event, session) =>
      onSession(session),
    );

    client.auth.getSession().then(({ data }) => {
      if (cancelled) return;
      if (data.session) {
        onSession(data.session);
      } else {
        // No session yet — wait for sign-in to land, but don't hang forever.
        authTimer = setTimeout(() => {
          if (!cancelled && !channel) setAuthError(true);
        }, 8000);
      }
    });

    return () => {
      cancelled = true;
      if (authTimer) clearTimeout(authTimer);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      sub.subscription.unsubscribe();
      if (channelRef.current) {
        client.removeChannel(channelRef.current);
        channelRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, identity, upsertRow]);

  // Broadcast our own read marker over presence (live, ephemeral) AND persist it
  // to the durable read_state table (survives offline / reload / a fresh device).
  // The durable write is best-effort: if the table has not been migrated yet it
  // simply errors and we fall back to presence-only — no regression.
  useEffect(() => {
    const ch = channelRef.current;
    if (ch && identity) ch.track({ identity, at: Date.now(), read: lastRead });
    if (supabase && identity && lastRead > 0) {
      void supabase
        .from("read_state")
        .upsert(
          { identity, last_read_at: new Date(lastRead).toISOString() },
          { onConflict: "identity" },
        )
        .then(({ error }) => {
          // Table may not exist yet (pre-migration); presence still covers us.
          void error;
        });
    }
  }, [lastRead, identity]);

  // Durable "seen": load the peer's persisted read pointer once and subscribe to
  // its changes on a dedicated channel. Merged into otherLastRead via max, so it
  // only ever advances "seen" forward and never fights the live presence value.
  // Isolated from the message channel so a missing table can't break messaging.
  useEffect(() => {
    if (!enabled || !isChatConfigured || !supabase || !identity) return;
    const client = supabase;
    const me = identity as ChatIdentity;
    const them = otherIdentity(me);
    let cancelled = false;

    const applyPeerRead = (iso: string | null | undefined) => {
      if (!iso) return;
      const ms = new Date(iso).getTime();
      if (!ms) return;
      setOtherLastRead((prev) => {
        const next = Math.max(prev ?? 0, ms);
        setStoredOtherRead(me, next);
        return next;
      });
    };

    void client
      .from("read_state")
      .select("identity,last_read_at")
      .eq("identity", them)
      .maybeSingle()
      .then(({ data, error }) => {
        if (cancelled || error || !data) return;
        applyPeerRead((data as { last_read_at?: string }).last_read_at);
      });

    const channel = client
      .channel("nafsam-read")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "read_state" },
        (payload) => {
          const row = payload.new as {
            identity?: string;
            last_read_at?: string;
          };
          if (row?.identity === them) applyPeerRead(row.last_read_at);
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      client.removeChannel(channel);
    };
  }, [enabled, identity]);

  // Split the raw rows into the visible conversation and the reaction map.
  const messages = useMemo(
    () => rows.filter((m) => !isControlBody(m.body)),
    [rows],
  );

  const reactions = useMemo<Reactions>(() => {
    const out: Reactions = {};
    for (const m of rows) {
      const r = parseReaction(m.body);
      if (!r) continue;
      const bucket = (out[r.targetId] ??= {});
      if (r.emoji) bucket[m.sender_name] = r.emoji;
      else delete bucket[m.sender_name];
    }
    return out;
  }, [rows]);

  const reactionsRef = useRef(reactions);
  reactionsRef.current = reactions;

  const sendText = useCallback(
    async (body: string) => {
      const text = body.trim();
      if (!text || !supabase || !identity) return;
      await supabase
        .from("messages")
        .insert({ body: text, sender_name: identity });
    },
    [identity],
  );

  const sendImage = useCallback(
    async (file: File) => {
      if (!supabase || !identity) return;
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase();
      const path = `${identity}/${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage
        .from(CHAT_BUCKET)
        .upload(path, file, { contentType: file.type || undefined });
      if (upErr) throw upErr;
      await supabase
        .from("messages")
        .insert({ image_path: path, sender_name: identity });
    },
    [identity],
  );

  const sendVoice = useCallback(
    async (blob: Blob, durationMs: number) => {
      if (!supabase || !identity) return;
      const type = blob.type || "audio/webm";
      const ext = extForAudioType(type);
      const path = voiceFileName(identity, durationMs, ext);
      const { error: upErr } = await supabase.storage
        .from(CHAT_BUCKET)
        .upload(path, blob, { contentType: type });
      if (upErr) throw upErr;
      await supabase
        .from("messages")
        .insert({ image_path: path, sender_name: identity });
    },
    [identity],
  );

  // Reactions are durable "control messages": inserting a row with an empty
  // emoji removes the reaction; latest write per (reactor, target) wins.
  const toggleReaction = useCallback(
    async (messageId: string, emoji: string) => {
      if (!supabase || !identity) return;
      const current = reactionsRef.current[messageId]?.[identity];
      const next = current === emoji ? "" : emoji;
      await supabase
        .from("messages")
        .insert({ body: buildReactionBody(messageId, next), sender_name: identity });
    },
    [identity],
  );

  const deleteMessage = useCallback(async (id: string) => {
    if (!supabase) return;
    await supabase
      .from("messages")
      .update({ deleted: true, body: null, image_path: null })
      .eq("id", id);
  }, []);

  const notifyTyping = useCallback(() => {
    const ch = channelRef.current;
    if (!ch || !identity) return;
    const now = Date.now();
    if (now - lastTypingSentRef.current < 1500) return;
    lastTypingSentRef.current = now;
    ch.send({
      type: "broadcast",
      event: "typing",
      payload: { identity },
    });
  }, [identity]);

  const markRead = useCallback(() => {
    // Anchor the read marker strictly to the newest message's server timestamp
    // so the comparison against other messages' created_at is immune to device
    // clock skew, and a fast local clock can never broadcast a future "read"
    // that would mark still-unseen messages as seen on the peer's side.
    let newest = 0;
    for (const m of messages) {
      const t = new Date(m.created_at).getTime();
      if (t > newest) newest = t;
    }
    const ts = newest || Date.now();
    setLastRead(ts);
    setLastReadState(ts);
  }, [messages]);

  const imageUrl = useCallback(async (path: string): Promise<string | null> => {
    if (!supabase) return null;
    const cached = signedUrlCache.get(path);
    if (cached && cached.expires > Date.now()) return cached.url;
    const { data, error } = await supabase.storage
      .from(CHAT_BUCKET)
      .createSignedUrl(path, 3600);
    if (error || !data) return null;
    signedUrlCache.set(path, {
      url: data.signedUrl,
      expires: Date.now() + 3000 * 1000,
    });
    return data.signedUrl;
  }, []);

  const unread = useMemo(() => {
    if (!identity) return 0;
    return messages.filter(
      (m) =>
        m.sender_name !== identity &&
        !m.deleted &&
        new Date(m.created_at).getTime() > lastRead,
    ).length;
  }, [messages, identity, lastRead]);

  const value = useMemo<ChatContextValue>(
    () => ({
      configured: isChatConfigured,
      ready,
      authError,
      identity,
      messages,
      reactions,
      otherOnline,
      otherTyping,
      otherLastSeen,
      otherLastRead,
      unread,
      sendText,
      sendImage,
      sendVoice,
      toggleReaction,
      deleteMessage,
      notifyTyping,
      markRead,
      imageUrl,
    }),
    [
      ready,
      authError,
      identity,
      messages,
      reactions,
      otherOnline,
      otherTyping,
      otherLastSeen,
      otherLastRead,
      unread,
      sendText,
      sendImage,
      sendVoice,
      toggleReaction,
      deleteMessage,
      notifyTyping,
      markRead,
      imageUrl,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
