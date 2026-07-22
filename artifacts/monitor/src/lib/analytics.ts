// Derived analytics selectors. Everything here is a pure function of the
// event/session arrays so pages can memoize on the array reference.

import {
  baghdadHourDay,
  dayKey,
  pageLabel,
  ACTIVE_GAP_MS,
  type ActivityEvent,
  type ClientMeta,
  type Identity,
  type Session,
} from "./activity";

// ---------------------------------------------------------------------------
// Time-series aggregates
// ---------------------------------------------------------------------------

export interface DayStat {
  day: string; // YYYY-MM-DD
  visits: number;
  totalMs: number;
  activeMs: number;
  pageViews: number;
  photoOpens: number;
  videoOpens: number;
}

export function dailyStats(sessions: Session[]): DayStat[] {
  const map = new Map<string, DayStat>();
  for (const s of sessions) {
    const k = dayKey(s.start);
    let row = map.get(k);
    if (!row) {
      row = {
        day: k,
        visits: 0,
        totalMs: 0,
        activeMs: 0,
        pageViews: 0,
        photoOpens: 0,
        videoOpens: 0,
      };
      map.set(k, row);
    }
    row.visits += 1;
    row.totalMs += s.durationMs;
    row.activeMs += s.activeMs;
    row.pageViews += s.pageViews;
    row.photoOpens += s.photoOpens;
    row.videoOpens += s.videoOpens;
  }
  return [...map.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}

export interface BucketStat {
  bucket: string; // week start YYYY-MM-DD or month YYYY-MM
  visits: number;
  totalMs: number;
  days: number;
}

export function weeklyStats(days: DayStat[]): BucketStat[] {
  const map = new Map<string, BucketStat>();
  for (const d of days) {
    const date = new Date(d.day + "T00:00:00");
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay()); // Sunday start
    const k = dayKey(weekStart);
    let row = map.get(k);
    if (!row) {
      row = { bucket: k, visits: 0, totalMs: 0, days: 0 };
      map.set(k, row);
    }
    row.visits += d.visits;
    row.totalMs += d.totalMs;
    row.days += 1;
  }
  return [...map.values()].sort((a, b) => (a.bucket < b.bucket ? -1 : 1));
}

export function monthlyStats(days: DayStat[]): BucketStat[] {
  const map = new Map<string, BucketStat>();
  for (const d of days) {
    const k = d.day.slice(0, 7); // YYYY-MM
    let row = map.get(k);
    if (!row) {
      row = { bucket: k, visits: 0, totalMs: 0, days: 0 };
      map.set(k, row);
    }
    row.visits += d.visits;
    row.totalMs += d.totalMs;
    row.days += 1;
  }
  return [...map.values()].sort((a, b) => (a.bucket < b.bucket ? -1 : 1));
}

// ---------------------------------------------------------------------------
// Heatmap + peak hours (Asia/Baghdad clock)
// ---------------------------------------------------------------------------

/** 7×24 matrix of non-heartbeat event counts: cells[weekday][hour]. */
export function activityHeatmap(events: ActivityEvent[]): number[][] {
  const cells: number[][] = Array.from({ length: 7 }, () =>
    new Array<number>(24).fill(0),
  );
  for (const e of events) {
    if (e.kind === "heartbeat") continue;
    const { hour, day } = baghdadHourDay(new Date(e.created_at).getTime());
    cells[day][hour] += 1;
  }
  return cells;
}

export interface HourStat {
  hour: number;
  count: number;
}

export function peakHours(heatmap: number[][]): HourStat[] {
  const totals = new Array<number>(24).fill(0);
  for (const row of heatmap) {
    for (let h = 0; h < 24; h += 1) totals[h] += row[h];
  }
  return totals
    .map((count, hour) => ({ hour, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// Content + pages
// ---------------------------------------------------------------------------

export type CountRow = [string, number];

export function countByLabel(
  events: ActivityEvent[],
  kind: string,
): CountRow[] {
  const m = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== kind || !e.label) continue;
    m.set(e.label, (m.get(e.label) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

export function pageCounts(events: ActivityEvent[]): CountRow[] {
  const m = new Map<string, number>();
  for (const e of events) {
    if (e.kind !== "page_view") continue;
    const p = pageLabel(e.label);
    m.set(p, (m.get(p) ?? 0) + 1);
  }
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

// ---------------------------------------------------------------------------
// Devices
// ---------------------------------------------------------------------------

export interface DeviceProfile {
  key: string;
  meta: ClientMeta;
  firstSeen: Date;
  lastSeen: Date;
  count: number;
  identity: Identity;
}

/** Distinct device/browser/OS profiles observed in open/login meta. */
export function deviceProfiles(events: ActivityEvent[]): DeviceProfile[] {
  const map = new Map<string, DeviceProfile>();
  for (const e of events) {
    if (e.kind !== "open" && e.kind !== "login") continue;
    const m = (e.meta ?? null) as ClientMeta | null;
    if (!m || (!m.os && !m.browser && !m.device)) continue;
    const key = [
      e.identity,
      m.os ?? "?",
      m.browser ?? "?",
      m.device ?? "?",
      m.screen ?? "?",
    ].join("|");
    const at = new Date(e.created_at);
    const existing = map.get(key);
    if (existing) {
      existing.count += 1;
      if (at > existing.lastSeen) existing.lastSeen = at;
      if (at < existing.firstSeen) existing.firstSeen = at;
    } else {
      map.set(key, {
        key,
        meta: m,
        firstSeen: at,
        lastSeen: at,
        count: 1,
        identity: e.identity,
      });
    }
  }
  return [...map.values()].sort(
    (a, b) => b.lastSeen.getTime() - a.lastSeen.getTime(),
  );
}

// ---------------------------------------------------------------------------
// Retention / returning
// ---------------------------------------------------------------------------

export interface RetentionInfo {
  distinctDays: number;
  firstVisit: Date | null;
  lastVisit: Date | null;
  currentStreak: number;
  longestStreak: number;
}

export function retention(sessions: Session[]): RetentionInfo {
  if (sessions.length === 0) {
    return {
      distinctDays: 0,
      firstVisit: null,
      lastVisit: null,
      currentStreak: 0,
      longestStreak: 0,
    };
  }
  const days = [...new Set(sessions.map((s) => dayKey(s.start)))].sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i += 1) {
    const prev = new Date(days[i - 1] + "T00:00:00").getTime();
    const cur = new Date(days[i] + "T00:00:00").getTime();
    if (cur - prev === 86_400_000) {
      run += 1;
      if (run > longest) longest = run;
    } else {
      run = 1;
    }
  }
  // Current streak counts back from today (or yesterday, to be forgiving).
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - 86_400_000));
  let current = 0;
  if (days[days.length - 1] === today || days[days.length - 1] === yesterday) {
    current = 1;
    for (let i = days.length - 1; i > 0; i -= 1) {
      const prev = new Date(days[i - 1] + "T00:00:00").getTime();
      const cur = new Date(days[i] + "T00:00:00").getTime();
      if (cur - prev === 86_400_000) current += 1;
      else break;
    }
  }
  const sorted = sessions
    .slice()
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return {
    distinctDays: days.length,
    firstVisit: sorted[0].start,
    lastVisit: sorted[sorted.length - 1].end,
    currentStreak: current,
    longestStreak: longest,
  };
}

// ---------------------------------------------------------------------------
// Alerts: replaced by the anomaly engine in ./intelligence.ts
// (detectAnomalies) — a superset of the old deriveAlerts rules with
// low/medium/high/critical severities.
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Search
// ---------------------------------------------------------------------------

export interface SearchFilters {
  identity: Identity | "all";
  kinds: string[]; // empty = all
  from: string | null; // YYYY-MM-DD
  to: string | null; // YYYY-MM-DD inclusive
  keyword: string;
}

export const EMPTY_FILTERS: SearchFilters = {
  identity: "all",
  kinds: [],
  from: null,
  to: null,
  keyword: "",
};

export function searchEvents(
  events: ActivityEvent[],
  f: SearchFilters,
): ActivityEvent[] {
  const kw = f.keyword.trim().toLowerCase();
  const fromMs = f.from ? new Date(f.from + "T00:00:00").getTime() : null;
  const toMs = f.to ? new Date(f.to + "T00:00:00").getTime() + 86_400_000 : null;
  const out: ActivityEvent[] = [];
  for (let i = events.length - 1; i >= 0; i -= 1) {
    const e = events[i];
    if (f.identity !== "all" && e.identity !== f.identity) continue;
    if (f.kinds.length > 0 && !f.kinds.includes(e.kind)) continue;
    const t = new Date(e.created_at).getTime();
    if (fromMs !== null && t < fromMs) continue;
    if (toMs !== null && t >= toMs) continue;
    if (kw) {
      const hay = `${e.kind} ${e.label ?? ""} ${pageLabel(e.label)}`.toLowerCase();
      if (!hay.includes(kw)) continue;
    }
    out.push(e); // newest first
  }
  return out;
}

export { ACTIVE_GAP_MS };
