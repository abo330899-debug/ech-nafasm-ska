# Performance Report

## Load strategy

| Aspect | Before | After |
| --- | --- | --- |
| Initial paint | blocked until the **entire** log loaded (oldest-first paging) | first 1000 rows (newest) paint the Overview/Live pages; older pages backfill in the background |
| Query order | ascending, so the newest data arrived **last** | descending — the most relevant rows arrive first |
| Refetch safety | none | `loadToken` guard cancels superseded loads |

Measured first-page latency is surfaced on the Health page (`lastQueryMs`); it is the honest number to watch as the log grows.

## Computation

- **Session reconstruction runs once** per events-array change, inside `MonitorProvider` (`useMemo`), and is shared by all ten pages through context. Previously each consumer would have recomputed.
- All analytics selectors are **pure functions memoized on array identity** (`useMemo` per page). Nothing recomputes on unrelated state changes (e.g. the 15 s clock tick only re-renders live labels; sessions memo is keyed on `events`, not `now`).
- The heatmap uses a **fixed UTC+3 arithmetic shift** for the Baghdad clock instead of `Intl.DateTimeFormat.formatToParts` per event — roughly two orders of magnitude cheaper over tens of thousands of rows.
- Alerts, retention, and aggregates iterate the arrays linearly (O(n)); no quadratic passes.

## Rendering

- **Heartbeats are never rendered in raw lists** (they are ~90 % of rows); they only feed the active/idle math.
- Sessions and Search results are paginated (20 and 50 per page respectively) — the DOM never holds thousands of rows.
- Realtime INSERTs append via a `Set`-guarded state update; each arrival is O(1) amortized (array spread) and triggers a single re-render.
- Charts render inside `ResponsiveContainer` at fixed heights; page transitions are opacity/transform only (compositor-friendly).

## Memory

- The full log lives in memory once (single provider instance). At ~50 k rows × ~200 bytes this is ≈ 10 MB — acceptable for a workspace-only dashboard; the Health page shows actual heap usage on Chromium browsers.
- The realtime channel is a single subscription for the whole app; it is removed on unmount to avoid leaks.

## Future headroom

If the log grows past a few hundred thousand rows, the next steps (not needed now) are:
1. Move daily aggregates to a Supabase view/RPC so backfill transfers pre-aggregated rows.
2. Cap in-memory raw events at N days and lazy-fetch older windows for Search only.
