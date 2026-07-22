# Monitor Improvements

Upgrade of the monitor from a single-file, 4-tab page into a 10-section monitoring dashboard. Everything below is new unless marked *(preserved)*.

## Data & tracking

- **Device enrichment (archive side):** the Nafsam tracker now attaches `os / browser / device / screen / lang / tz / pwa` to `open` and `login` events via a ~30-line dependency-free classifier. No schema change (the `meta` jsonb column already existed); no new dependency in the public bundle; historical rows simply show "unknown".
- **Incremental newest-first loading:** the dashboard paints from the first 1000 rows, then backfills the older log in the background. Previously the whole log had to load (oldest-first) before anything rendered.
- **Session model upgrades:** each session now derives active vs. idle time (heartbeat-gap analysis), navigation path, average interaction interval, and the device used.
- **Live-state refinement:** three states — active (< 100 s), idle (< 2.5 min), offline — instead of a single "live" flag.

## New sections

1. **Overview** — live banner, KPI cards (visits, total time, true active time, last seen, distinct days, current/longest streak), 14-day minutes trend, recent activity feed.
2. **Live** — realtime connection badge, current page, session duration, per-session stats, live session timeline, cross-identity feed (heartbeats filtered).
3. **Sessions** — expandable cards with an active/idle ratio bar, page navigation path (chips with arrows), device line, and full event timeline; "load more" pagination.
4. **Analytics** — 30-day daily trend, weekly visits chart, monthly hours chart, 7×24 hour-by-weekday heatmap on the Baghdad clock, peak-hours chart, retention/streak cards.
5. **Devices** — distinct device/browser/OS/screen profiles per identity, first/last seen, visit counts, installed-PWA badge.
6. **Search** — filter the entire log by identity, event kind (multi-select), date range, and keyword; newest/oldest sorting; 50-per-page pagination.
7. **Alerts** — automatically derived, no storage: realtime-disconnect (critical), session > 2 h (warning), visit < 30 s (info), activity during Baghdad quiet hours 02:00–06:00 (warning), > 30 min idle inside a live session (info). Alert count badge in the sidebar.
8. **System Health** — realtime channel state (Arabic labels), reconnect count, measured query latency, rows in memory, live-row counter, events-per-hour ingest rate, browser heap usage (feature-detected), manual reload.

## Preserved

- Daily report *(preserved, own page now)*.
- Content breakdown: top pages / photos / videos *(preserved, with proportion bars)*.
- Silent reader sign-in and the workspace-only posture.
- Session reconstruction gap (2.5 min) and all Arabic labels/terminology.

## UX

- Sidebar navigation (RTL, right side) with icons and an alerts badge; sticky top bar with a live connection dot, refresh, and sign-out.
- Page-level fade transitions (framer-motion), loading skeletons, and empty states with explanatory hints everywhere.
- Charts localized (Arabic tooltips) while rendered in LTR containers for correctness.
