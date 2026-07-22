---
name: Nafsam Monitor dashboard & reader account
description: Which Supabase project the /monitor/ dashboard must read, how it signs in (auto, no login screen), and the reader-account constraints.
---

# Nafsam Monitor (غرفة المراقبة)

## Two Supabase projects — the #1 gotcha
There are two ACTIVE Supabase projects and it is easy to point the monitor at
the wrong one:
- **analytics** `eevanqnzcrizmmtrjmnk` — legacy/unused; its `activity_events`
  has a DIFFERENT schema (session_id/visitor_id/event_type/...) and 0 rows.
- **chat** `rwpgtnjpqwlddborvyrd` — THE REAL TARGET. The nafsam frontend writes
  its activity log here (see `artifacts/nafsam/.env` VITE_SUPABASE_URL). The
  monitor MUST read from this project.
**Why:** symptom of a mismatch is "تعذّر تحميل السجل" / empty dashboard even
though everything else looks correct. Both `supabaseUrl` and `supabaseAnonKey`
in `artifacts/monitor/src/lib/supabase.ts` must be the chat project. The chat
anon key is already public (shipped in the nafsam bundle) so committing it is
fine.
**How to apply:** the chat project needs the activity schema (table + trigger
`activity_set_identity_trg` + policies + `activity_reader()`/`chat_identity()`
functions) from `supabase/schema.sql` lines ~265-337, plus a confirmed
`monitor@nafsam.app` user whose password == MONITOR_PASSWORD. Verify
end-to-end: star@ (pw = chat password from chatAuth.ts) inserts with `Prefer: return=minimal`
(return=representation 403s because star has no SELECT), monitor@ reads it back.

## No login screen anymore
The dashboard auto-signs-in on mount using READER_EMAIL + MONITOR_PASSWORD
(App.tsx AuthState = "checking"|"error"|"in", no Login component). The user
explicitly asked to remove the login UI. MONITOR_PASSWORD lives ONLY in the
monitor supabase lib — never write the literal into memory or schema.sql.
**Why:** monitor is workspace-only (never in Cloudflare/Replit public deploys),
so baking the password does not expose it to visitors. It must NOT follow the
public `nafsam-<x>` pattern (that pattern ships in the telegram-call bundle).
Note: monitor `artifact.toml` has a production service block, so a future
Replit publish that includes monitor WOULD ship the password — re-evaluate
before ever deploying monitor publicly.

## Reader account creation
`monitor@nafsam.app` and its password are managed via the Supabase Management
API (token is the `sbp_...` Management token, not the SERVICE_ROLE secret which
currently holds a wrong value). RLS grants SELECT on `activity_events` only to
that exact email; star@/ilham@ can INSERT (trigger stamps identity), no
update/delete (append-only).

## Dashboard build lessons (2026-07-22 rebuild, 10 sections)
- **recharts breaks under RTL** (html is dir=rtl): every chart AND the heatmap
  grid must sit inside a `dir="ltr"` wrapper or axes/bars mis-lay out.
- **Hash routing** (wouter `useHashLocation`) — path routing fights the
  `/monitor/` proxy base path; hash routes need no server/vite config.
- **Supabase descending offset-paging on an insert-heavy table duplicates
  rows**: inserts during backfill shift the offset windows, so page N's tail
  reappears at page N+1's head. Always dedupe by id when assembling pages
  (insert-only table ⇒ duplicates only, never skips).
- Screenshot right after load catches recharts mid-animation (line drawn only
  part-way) — looks like missing data but isn't; re-shoot or ignore.
- Heartbeats (45s) are ~90% of rows — never render them in raw lists, only
  feed them to active/idle session math.

## storageKey
Monitor client uses storageKey `nafsam-monitor-auth-v2` (bump the suffix
whenever the project is repointed) so a stale session from the old project
doesn't pass the email check then 401 on every query. It also avoids clobbering
the chat (`nafsam-chat-auth`) / activity (`nafsam-activity-auth`) sessions.
