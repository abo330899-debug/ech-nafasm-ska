# Monitor Architecture

## Overview

The monitor (`artifacts/monitor`) is a frontend-only React + Vite dashboard that observes activity in the Nafsam archive. It is **workspace-only** — it is never published; it runs only inside the Replit workspace preview at `/monitor/`.

```
┌─────────────────┐   inserts    ┌──────────────────────┐
│ Nafsam archive  │ ───────────▶ │ Supabase             │
│ (public site)   │              │ activity_events      │
│ src/lib/        │              │ (RLS: reader-only    │
│ activity.ts     │              │  SELECT)             │
└─────────────────┘              └──────────┬───────────┘
                                            │ paged SELECT +
                                            │ realtime INSERT stream
                                 ┌──────────▼───────────┐
                                 │ Monitor dashboard    │
                                 │ (this app)           │
                                 └──────────────────────┘
```

## Data source

One table: `activity_events (id, identity, kind, label, meta jsonb, created_at)`.

- `identity`: `star` (owner) or `ilham` (viewer).
- `kind`: `login`, `logout`, `open`, `leave`, `heartbeat` (every 45 s while the tab is visible), `page_view`, `video_open`, `photo_open`.
- `meta`: since 2026-07-22, `open` and `login` events carry a small client descriptor (`os`, `browser`, `device`, `screen`, `lang`, `tz`, `pwa`) produced by a dependency-free ~30-line classifier in the archive's tracker. Older rows have `meta = null` and render as "غير معروف".

Row-level security allows only the dedicated reader account (`monitor@nafsam.app`) to read; the archive clients can only insert.

## Layers

### 1. Data acquisition — `src/lib/useMonitorData.ts`

- Loads the log **newest-first** in pages of 1000. The first page is enough to paint the live view; older pages backfill in the background (`phase: idle → recent → complete`).
- A `loadToken` guard makes refetches supersede in-flight loads safely.
- A single Supabase realtime channel appends INSERTs as they arrive; a `Set` of seen ids prevents duplicates between paging and streaming.
- Health telemetry is collected here: channel status (from the subscribe callback), reconnect count, first-page query latency, row counts, live-row counter.
- A 15 s ticker (`now`) keeps relative labels fresh without refetching.

### 2. Domain model — `src/lib/activity.ts`

- `reconstructSessions(events)`: splits each identity's event stream into sessions at gaps > 2.5 min (`SESSION_GAP_MS`).
- Per session it derives:
  - `activeMs` / `idleMs` — a gap ≤ 100 s (`ACTIVE_GAP_MS`, two missed heartbeats) counts as active time; longer gaps and gaps after an explicit `leave` count as idle.
  - `navPath` — ordered, consecutive-deduped page labels.
  - `avgInteractionMs` — mean spacing of non-heartbeat events.
  - `client` — first client meta seen in the session.
- `liveState(session, now)`: `active` (< 100 s since last event), `idle` (< 2.5 min), else `offline`.
- Baghdad-clock helpers use a fixed UTC+3 shift (Iraq has no DST), avoiding `Intl` calls in hot loops.

### 3. Analytics selectors — `src/lib/analytics.ts`

Pure functions over the events/sessions arrays, memoized by the callers on array identity: daily/weekly/monthly aggregates, 7×24 activity heatmap (Baghdad clock), peak hours, content counts, device profiles, retention/streaks, derived alerts, and log search.

### 4. Shared state — `src/lib/MonitorContext.tsx`

`MonitorProvider` owns the single `useMonitorData` instance and the memoized session reconstruction; every page consumes `useMonitor()`. One load, one realtime channel, regardless of navigation.

### 5. UI shell — `src/App.tsx`

- Auth: silent sign-in with the baked reader credentials (unchanged behavior).
- Routing: **wouter with hash routing** (`useHashLocation`) — immune to the `/monitor/` base-path proxying, no server rewrites needed.
- Layout: shadcn sidebar (`side="right"` for RTL) with ten sections; sticky top bar with connection dot, refresh, and sign-out.

### 6. Pages — `src/pages/`

| Route | Page | Contents |
| --- | --- | --- |
| `/` | Overview | live banner, six KPI cards, 14-day trend, recent activity |
| `/live` | Live | realtime status, current page, active/idle state, session timeline, live feed |
| `/sessions` | Sessions | expandable session cards (active/idle bar, nav path, device, timeline) |
| `/daily` | Daily | per-day report (preserved from the old dashboard) |
| `/analytics` | Analytics | 30-day trend, weekly/monthly charts, heatmap, peak hours, retention |
| `/content` | Content | most-viewed pages / photos / videos (preserved) |
| `/devices` | Devices | device/browser/OS profiles from event meta |
| `/search` | Search | full-log filtering (identity, kind, date range, keyword) with pagination |
| `/alerts` | Alerts | derived alerts with severity levels |
| `/health` | Health | connection state, latency, ingest rate, memory, reload |

## Key decisions

- **No backend added.** The monitor stays a pure client of Supabase; alerts and analytics are derived client-side, so no new tables, schedulers, or storage.
- **Hash routing** avoids any interplay with the shared workspace proxy and Vite `BASE_PATH`.
- **Charts are wrapped in `dir="ltr"` containers** — recharts does not lay out correctly under RTL.
- **Heartbeats never render in raw lists**; they dominate row counts and are only used for session/idle math.
