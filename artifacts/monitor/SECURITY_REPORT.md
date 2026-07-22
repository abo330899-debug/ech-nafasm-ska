# Security Report

## Posture

The monitor is a **workspace-only** dashboard: it is not registered for deployment and is only reachable through the authenticated Replit workspace preview. That perimeter is the primary control; everything below is defense-in-depth commentary.

## Data access

- **Read path:** the dashboard signs in as the dedicated Supabase reader (`monitor@nafsam.app`). Row-level security on `activity_events` grants SELECT only to this account — the anon key alone cannot read the log.
- **Write path:** archive visitors can only INSERT activity rows (append-only). The monitor performs no writes at all; there is no mutation surface in this app.
- **Baked credentials:** the reader email/password pair is compiled into the monitor bundle. This is a previously accepted tradeoff, acceptable **only** because the bundle never leaves the workspace. If the monitor were ever published, this would become a critical leak — a note to that effect is kept in the Health page footer and in `replit.md`.

## Decisions made during this upgrade

- **No IP / geolocation collection.** Deliberately rejected: the events carry no IP (client-side inserts), and calling an external geo API from the viewer's browser would leak her IP and browsing moments to a third party. The feature was cut rather than approximated.
- **Device metadata is minimal and non-identifying beyond the two known users:** OS family, browser family, device class, screen size, UI language, timezone, PWA flag. No canvas/audio fingerprinting, no persistent client IDs, no cookies added.
- **No new dependencies in the public archive bundle.** The UA classifier is ~30 lines of inline code; supply-chain surface of the public site is unchanged.
- **Alerts are derived client-side** — no new tables, no stored analysis of the viewer's behavior beyond the raw log that already existed.

## Privacy considerations

- The archive tracks exactly two consenting identities in a personal context; the monitor exposes that data only to the owner inside their own workspace.
- The enriched meta travels through the existing insert path under the same RLS; the public site cannot read back anyone's events.
- `content.json`-style sensitive text never enters the monitor; events carry only labels (page paths, media captions already visible to the authenticated viewer).

## Residual risks

| Risk | Severity | Mitigation |
| --- | --- | --- |
| Reader credentials in workspace bundle | accepted | never publish the monitor artifact |
| Supabase anon key in public archive bundle | accepted (by design) | RLS insert-only policy for anon |
| Realtime channel disruption hides new events | low | disconnect alert (critical) + status dot + manual refresh |
