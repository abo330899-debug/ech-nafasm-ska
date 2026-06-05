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

**"Seen" read receipts ride on Realtime presence, NOT a DB column.**
Each client adds `read: <newest-message-server-time-ms>` to its presence
`track()` payload; the peer reads it on presence "sync" and shows a "seen" line
under the last of *their own* messages whose `created_at <= otherLastRead`.
Persisted per-identity in localStorage (`nafsam_chat_otherread_<id>`) so it
survives reloads on the sender's device.
**Why:** the hosted Supabase has no admin access from this repl (no
SUPABASE_DB_URL), so a `read_at` column + RLS change can't be applied/deployed.
Presence needs zero schema/RLS change → ships with the normal Cloudflare build.
The read marker is anchored to the newest message's *server* `created_at`
(never `Date.now()` when messages exist) so a fast device clock can't broadcast
a future timestamp that falsely marks unread messages as seen.
**Limitation:** presence is ephemeral — if the peer reads while you're offline
and both go offline, you only see "seen" once their presence is observed live;
the localStorage cache then keeps it across your own reloads.
