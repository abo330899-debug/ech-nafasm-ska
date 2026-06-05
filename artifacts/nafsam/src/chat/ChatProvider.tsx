import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
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

const LAST_READ_KEY = "nafsam_chat_lastread";

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
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [otherOnline, setOtherOnline] = useState(false);
  const [otherTyping, setOtherTyping] = useState(false);
  const [lastRead, setLastReadState] = useState<number>(() => getLastRead());

  const identity = getIdentity();
  const channelRef = useRef<RealtimeChannel | null>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastTypingSentRef = useRef(0);

  const upsertMessage = useCallback((row: ChatMessage) => {
    setMessages((prev) => {
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
      const { data, error } = await client
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1000);
      if (cancelled || error || !data) return;
      // Merge rather than replace: realtime inserts that arrived between
      // subscribe and this fetch are already in state and must be kept.
      setMessages((prev) => {
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
          (payload) => upsertMessage(payload.new as ChatMessage),
        )
        .on(
          "postgres_changes",
          { event: "UPDATE", schema: "public", table: "messages" },
          (payload) => upsertMessage(payload.new as ChatMessage),
        )
        .on(
          "postgres_changes",
          { event: "DELETE", schema: "public", table: "messages" },
          (payload) => {
            const old = payload.old as { id?: string };
            if (old?.id) {
              setMessages((prev) => prev.filter((m) => m.id !== old.id));
            }
          },
        )
        .on("presence", { event: "sync" }, () => {
          const state = channel?.presenceState() ?? {};
          setOtherOnline(Boolean(state[them] && state[them].length > 0));
        })
        .on("broadcast", { event: "typing" }, ({ payload }) => {
          if (payload?.identity && payload.identity !== me) {
            setOtherTyping(true);
            if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
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
          await channel?.track({ identity: me, at: Date.now() });
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
  }, [enabled, identity, upsertMessage]);

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

  const deleteMessage = useCallback(
    async (id: string) => {
      if (!supabase) return;
      await supabase
        .from("messages")
        .update({ deleted: true, body: null, image_path: null })
        .eq("id", id);
    },
    [],
  );

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
    const now = Date.now();
    setLastRead(now);
    setLastReadState(now);
  }, []);

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
      otherOnline,
      otherTyping,
      unread,
      sendText,
      sendImage,
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
      otherOnline,
      otherTyping,
      unread,
      sendText,
      sendImage,
      deleteMessage,
      notifyTyping,
      markRead,
      imageUrl,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}
