import { useCallback, useEffect, useRef, useState } from "react";
import { supabase } from "./supabase";
import type { ActivityEvent } from "./activity";

const PAGE_SIZE = 1000;

// Loads the full activity log (paged) and keeps it live via a realtime
// subscription. Returns ascending-by-time events plus a manual refetch.
export function useMonitorData(enabled: boolean) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const seen = useRef<Set<string>>(new Set());

  const load = useCallback(async () => {
    if (!supabase) {
      setError("الاتصال غير مهيأ");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const all: ActivityEvent[] = [];
      let from = 0;
      // Page through the whole log so old days are included in reports.
      // eslint-disable-next-line no-constant-condition
      while (true) {
        const { data, error: err } = await supabase
          .from("activity_events")
          .select("*")
          .order("created_at", { ascending: true })
          .range(from, from + PAGE_SIZE - 1);
        if (err) throw err;
        const batch = (data ?? []) as ActivityEvent[];
        all.push(...batch);
        if (batch.length < PAGE_SIZE) break;
        from += PAGE_SIZE;
      }
      seen.current = new Set(all.map((e) => e.id));
      setEvents(all);
    } catch (e) {
      setError(e instanceof Error ? e.message : "تعذّر تحميل السجل");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;
    void load();
  }, [enabled, load]);

  // Realtime: append new rows as they arrive (RLS lets only the reader see them).
  useEffect(() => {
    if (!enabled || !supabase) return;
    const client = supabase;
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
        },
      )
      .subscribe();
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

  return { events, loading, error, now, refetch: load };
}
