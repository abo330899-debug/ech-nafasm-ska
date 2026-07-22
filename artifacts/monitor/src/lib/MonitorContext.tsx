import { createContext, useContext, useMemo, type ReactNode } from "react";
import {
  useMonitorData,
  type LoadPhase,
  type MonitorHealth,
} from "./useMonitorData";
import {
  dayKey,
  reconstructSessions,
  type ActivityEvent,
  type Session,
} from "./activity";
import {
  detectAnomalies,
  scoreSessions,
  type Anomaly,
  type ScoredSession,
} from "./intelligence";

export interface MonitorValue {
  events: ActivityEvent[];
  ilhamEvents: ActivityEvent[];
  sessions: Session[];
  ilhamSessions: Session[];
  /** Sessions with intelligence scores, same order as `sessions`. */
  scored: ScoredSession[];
  /** Single anomaly engine output — badge and Alerts page share this. */
  anomalies: Anomaly[];
  /** YYYY-MM-DD of "today"; changes once a day, safe as a memo dep. */
  todayKey: string;
  loading: boolean;
  backfilling: boolean;
  complete: boolean;
  phase: LoadPhase;
  error: string | null;
  now: number;
  health: MonitorHealth;
  refetch: () => void;
}

const Ctx = createContext<MonitorValue | null>(null);

// One shared data instance for the whole dashboard: a single paged load and a
// single realtime channel, no matter how many pages consume it.
export function MonitorProvider({ children }: { children: ReactNode }) {
  const {
    events,
    loading,
    backfilling,
    complete,
    phase,
    error,
    now,
    health,
    refetch,
  } = useMonitorData(true);

  const sessions = useMemo(() => reconstructSessions(events), [events]);
  const ilhamEvents = useMemo(
    () => events.filter((e) => e.identity === "ilham"),
    [events],
  );
  const ilhamSessions = useMemo(
    () => sessions.filter((s) => s.identity === "ilham"),
    [sessions],
  );

  // Scores are a pure function of the sessions array — they do NOT depend on
  // the 15s tick, so heavy per-session work runs only when data changes.
  const scored = useMemo(() => scoreSessions(sessions), [sessions]);

  const anomalies = useMemo(
    () => detectAnomalies(scored, health.channelStatus, now),
    [scored, health.channelStatus, now],
  );

  const todayKey = dayKey(new Date(now));

  const value = useMemo<MonitorValue>(
    () => ({
      events,
      ilhamEvents,
      sessions,
      ilhamSessions,
      scored,
      anomalies,
      todayKey,
      loading,
      backfilling,
      complete,
      phase,
      error,
      now,
      health,
      refetch: () => void refetch(),
    }),
    [
      events,
      ilhamEvents,
      sessions,
      ilhamSessions,
      scored,
      anomalies,
      todayKey,
      loading,
      backfilling,
      complete,
      phase,
      error,
      now,
      health,
      refetch,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useMonitor(): MonitorValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useMonitor must be used inside MonitorProvider");
  return v;
}
