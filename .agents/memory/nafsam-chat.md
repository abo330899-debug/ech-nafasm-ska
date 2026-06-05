---
name: Nafsam private chat (/chat, Supabase)
description: How the two-person chat maps Nafsam login words to fixed Supabase accounts, and the gotchas that break sending.
---

# Nafsam private chat

A private real-time two-person chat at `/chat`, built on Supabase
(Realtime + Postgres + Storage). Works inside the same static Cloudflare Pages
build as the rest of Nafsam — no app server involved.

**Identity → fixed Supabase account (NOT word-derived).**
Login word `ska` → Star; every other valid Nafsam word → Ilham. The Supabase
sign-in password depends ONLY on the identity, not on the exact word (one fixed
password per identity; the literal values live in `chatAuth.ts`, not here).
**Why:** Ilham can open Nafsam with several different valid words. An earlier
design derived the password as `nafsam-<word>`, so the moment she used any word
other than the one her single Supabase account was created with, chat sign-in
failed with "تعذّر الدخول للمحادثة". One account can only hold one password.
**How to apply:** if these constants change, update both
`artifacts/nafsam/src/chat/chatAuth.ts` AND the Supabase user's password
(Authentication → Users) so they stay in sync, then redeploy. The chat
passwords are public (baked into the static bundle); the real gate is the
Nafsam word login (verified before chat sign-in) plus Supabase row-level
security keyed on the signed-in email.

**Two non-code setup steps that silently block messaging (must be done in the
Supabase dashboard, easy to miss):**
1. Both auth users must exist AND be email-confirmed. Signing up via the anon
   key leaves the user UNCONFIRMED (login → 400 "Invalid login credentials").
   Create them via Authentication → Users → Add user with **Auto Confirm User**
   ON (or disable email confirmation).
2. Table privileges: `grant usage on schema public to authenticated;` and
   `grant select,insert,update,delete on public.messages to authenticated;`
   Without these, every query is 403 `42501 permission denied for table
   messages` even though RLS policies look correct — RLS decides *which* rows,
   table GRANT decides whether the role can touch the table at all. These GRANTs
   are in `supabase/schema.sql`; the symptom of a partial/old schema run is the
   403 above.

**Verifying end-to-end without the UI:** sign in both accounts against the prod
Supabase REST API with the anon key, INSERT as one, SELECT as the other, then
DELETE to clean up. The message author is stamped server-side by a BEFORE
INSERT trigger (`chat_set_sender`), so `sender_name` is forced from the account.

**"Seen" read receipts use BOTH live presence AND a durable per-user pointer.**
Live: each client adds `read: <newest-message-server-time-ms>` to its presence
`track()`; the peer reads it on presence "sync" and shows a "seen" line under the
last of *their own* messages whose `created_at <= otherLastRead`. Durable: a
`public.read_state` table (one row per identity, `last_read_at timestamptz`) is
upserted on every read and the peer snapshots + subscribes to it on a SEPARATE
`nafsam-read` channel. Both sources feed `otherLastRead` via `Math.max`, so the
marker only ever advances forward. Also cached per-identity in localStorage
(`nafsam_chat_otherread_<id>`).
**Why two layers:** presence alone is ephemeral — if the peer reads while you're
offline and both go offline, you'd never learn it was seen. `read_state` makes
"seen" correct on a fresh device / after reload regardless of who was online.
The read marker is anchored to the newest message's *server* `created_at` (never
`Date.now()` when messages exist) so a fast device clock can't mark unread
messages as seen.
**Deploy dependency (easy to miss):** the durable layer is best-effort — if
`read_state` hasn't been created in Supabase it silently no-ops and chat falls
back to presence-only (no regression). To actually enable durable "seen" you
MUST re-run `supabase/schema.sql` in the Supabase SQL editor (it is idempotent;
adds the table + trigger + RLS + realtime). No admin access from this repl, so
this is a manual dashboard step. The durable read channel is intentionally
isolated from the message channel so a missing table can never break messaging.
RLS + a BEFORE INSERT/UPDATE trigger force `identity` from the account (mirrors
`chat_set_sender`), so neither account can write the other's pointer.

**Reactions & voice are stored WITHOUT schema changes (no Supabase admin).**
The `messages` table cannot be altered, so two features piggyback on existing
columns:
- **Reactions** (❤️🥺🌹🦋) are durable "control messages": a normal `messages`
  row whose `body` carries a sentinel prefix (`\uE000R\uE000<targetId>\uE000<emoji>`).
  Helpers live in `chat/chatMedia.ts`. The provider filters control rows out of
  the visible `messages` list (`isControlBody`) and reduces them into a
  `reactions` map keyed by target id then reactor; empty emoji = removal; latest
  write per (reactor,target) wins. Realtime "just works" via the existing INSERT
  subscription.
- **Voice notes**: the audio blob is uploaded to the `chat-images` bucket and its
  path stored in `image_path`; duration is encoded in the filename
  `voice-<ts>-<ms>.<ext>` and detected by regex (`parseVoice`). No body.
**Why this matters:** control rows share the `messages` table, so any snapshot
`limit` is a *shared* budget between real messages and reactions.
**How to apply:** the snapshot MUST fetch `order(created_at, ascending:false)`
+ limit (newest window), NOT ascending — ascending+limit returns the *oldest*
rows and hides the live conversation once total rows exceed the limit. The merge
re-sorts ascending afterward. If reaction volume ever grows large, split visible
vs control into separate queries rather than raising the single limit.

**Voice recorder lifecycle:** `MediaRecorder.stop()` is async — its `onstop`
fires later. A `processingRef` guard blocks a new `startRecording()` until the
previous recorder's `onstop` (teardown + optional upload) completes, otherwise
the shared `chunksRef`/`startRef`/`cancelledRef` buffers of two sessions
interleave and produce dropped/garbled uploads.

**Presence + typing are SYMMETRIC by design (both sides see each other's
online / last-seen / typing).** An earlier build gated presence to one identity.
**Why:** symmetric presence is the explicitly requested Telegram/WhatsApp
behavior — do NOT "restore" a one-way gate thinking it's a privacy bug. It
exposes nothing beyond what the realtime presence channel + `read_state` already
carried for the two authorized identities. Delivery state is shown as ticks
(sent/delivered/seen) instead of a text line, where "seen" is still anchored to
`otherLastRead` (so it depends on the durable read_state step above).
