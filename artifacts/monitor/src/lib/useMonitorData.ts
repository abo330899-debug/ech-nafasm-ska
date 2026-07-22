import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { ActivityEvent } from "./activity";

const PAGE_SIZE = 1000;

export type LoadPhase = "idle" | "recent" | "complete" | "error";

export interface MonitorHealth {
  /** Realtime channel status: connecting | SUBSCRIBED | CHANNEL_ERROR | TIMED_OUT | CLOSED */
  channelStatus: string;
  /** Times the channel recovered to SUBSCRIBED after an error/timeout. */
  reconnects: number;
  /** Measured latency of the most recent first-page query, in ms. */
  lastQueryMs: number | null;
  /** When the initial + backfill load finished (epoch ms), null while loading. */
  loadedAt: number | null;
  /** Total rows currently held in memory. */
  rowCount: number;
  /** Realtime rows received since the dashboard opened. */
  liveRows: number;
}

// Loads the activity log newest-first so the dashboard paints from the first
// page, then backfills older pages in the background. A realtime subscription
// appends new rows as they arrive. Events are returned ascending-by-time.
export function useMonitorData(enabled: boolean) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [phase, setPhase] = useState<LoadPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [health, setHealth] = useState<MonitorHealth>({
    channelStatus: "connecting",
    reconnects: 0,
    lastQueryMs: null,
    loadedAt: null,
    rowCount: 0,
    liveRows: 0,
  });
  const seen = useRef<Set<string>>(new Set());
  const loadToken = useRef(0);

  const load = useCallback(async () => {
    if (!supabase) {
      setError("الاتصال غير مهيأ");
      setPhase("error");
      return;
    }
    const token = ++loadToken.current;
    // On a refetch keep existing data on screen (phase "recent" = refreshing)
    // instead of collapsing every page back to skeletons.
    setPhase(seen.current.size > 0 ? "recent" : "idle");
    setError(null);
    try {
      const t0 = performance.now();
      let from = 0;
      let all: ActivityEvent[] = [];
      // Newest-first paging: page 0 alone is enough to render the live view.
      for (;;) {
        const { data, error: err } = await supabase
          .from("activity_events")
          .select("*")
          .order("created_at", { ascending: false })
          .range(from, from + PAGE_SIZE - 1);
        if (err) throw err;
        if (loadToken.current !== token) return; // superseded by a refetch
        const batch = (data ?? []) as ActivityEvent[];
        all = all.concat(batch);
        if (from === 0) {
          const ms = Math.round(performance.now() - t0);
          setHealth((h) => ({ ...h, lastQueryMs: ms }));
          const ascending = batch.slice().reverse();
          seen.current = new Set(ascending.map((e) => e.id));
          setEvents(ascending);
          setPhase(batch.length < PAGE_SIZE ? "complete" : "recent");
        }
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      if (loadToken.current !== token) return;
      // Rows inserted during the backfill shift the descending offset windows,
      // so page N's tail can be re-served at page N+1's head. Dedupe by id
      // while reversing to ascending order.
      const byId = new Map<string, ActivityEvent>();
      for (let i = all.length - 1; i >= 0; i -= 1) {
        byId.set(all[i].id, all[i]);
      }
      const ascending = [...byId.values()];
      seen.current = new Set(byId.keys());
      // Realtime rows may have landed while backfilling; keep any not in the
      // paged result by re-appending them at the end (they are the newest).
      setEvents((prev) => {
        const extras = prev.filter((e) => !seen.current.has(e.id));
        for (const e of extras) seen.current.add(e.id);
        return extras.length > 0 ? ascending.concat(extras) : ascending;
      });
      setPhase("complete");
      setHealth((h) => ({
        ...h,
        loadedAt: Date.now(),
        rowCount: seen.current.size,
      }));
    } catch (e) {
      if (loadToken.current !== token) return;
      setError(e instanceof Error ? e.message : "تعذّر تحميل السجل");
      setPhase("error");
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  // Realtime: append new rows as they arrive (RLS lets only the reader see
  // them). The subscribe callback doubles as the connection-health signal.
  useEffect(() => {
    if (!enabled || !supabase) return;
    const client = supabase;
    let wasHealthy = false;
    const channel = client
      .channel("activity-live")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "activity_events" },
        (payload) => {
          const row = payload.new as ActivityEvent;
          if (!row?.id || seen.current.has(row.id)) return;
          seen.current.add(row.id);
          setEvents((prev) => [...prev, row]);
          setHealth((h) => ({
            ...h,
            liveRows: h.liveRows + 1,
            rowCount: seen.current.size,
          }));
        },
      )
      .subscribe((status) => {
        setHealth((h) => {
          const recovered = status === "SUBSCRIBED" && wasHealthy === false;
          const reconnects =
            recovered && h.channelStatus !== "connecting"
              ? h.reconnects + 1
              : h.reconnects;
          if (status === "SUBSCRIBED") wasHealthy = true;
          else wasHealthy = false;
          return { ...h, channelStatus: status, reconnects };
        });
      });
    return () => {
      void client.removeChannel(channel);
    };
  }, [enabled]);

  // Tick so "live" / "last seen" labels stay fresh without a refetch.
  useEffect(() => {
    if (!enabled) return;
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, [enabled]);

  return {
    events,
    loading: phase === "idle",
    backfilling: phase === "recent",
    complete: phase === "complete",
    phase,
    error,
    now,
    health,
    refetch: load,
  };
}
