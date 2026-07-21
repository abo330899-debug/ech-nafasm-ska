---
name: Nafsam Monitor login & reader account
description: How the /monitor/ dashboard signs in, why the Supabase reader account can only be created in the dashboard, and the word-login mapping.
---

# Nafsam Monitor (غرفة المراقبة)

The monitor dashboard reads `activity_events` through a dedicated Supabase
reader account `monitor@nafsam.app` (RLS in `supabase/schema.sql` only grants
SELECT to that exact email — the email cannot be changed without re-running
the schema, which needs the Supabase dashboard).

**Login is word-based like the rest of Nafsam.** The login screen accepts the
star words (case-insensitive) and maps them to a fixed high-entropy Supabase
password; any other input is passed through as a raw password. The literal
password lives ONLY in the monitor app's supabase lib (MONITOR_PASSWORD), not
here — never write it into memory or schema.sql.
**Why:** the owner asked to log in with "star"; Supabase min password length
makes a 4-char literal password impossible, and the monitor app is
workspace-only (never in the Cloudflare/Replit public deploys), so baking the
mapping does not expose it to visitors. The password must NOT follow the
public `nafsam-<x>` pattern (shipped in the telegram-call bundle) or Ilham
could guess it against the public Supabase auth endpoint and read her own
surveillance log. Note the monitor artifact.toml has a production service
block, so a future Replit publish that adds monitor WOULD ship the mapping —
re-evaluate the login design before ever deploying monitor publicly.

**Reader account can ONLY be created in the Supabase dashboard.** No Supabase
admin credentials exist in this repl (checked secrets + connectors). The
signup REST API now rejects `@nafsam.app` emails with `email_address_invalid`,
so unlike the chat accounts, it cannot even be pre-created unconfirmed.
**How to apply:** Authentication → Users → Add user, Auto Confirm ON,
`monitor@nafsam.app` / `nafsam-monitor-star`. Until then every monitor login
fails with invalid_credentials even though the app code is correct.

The monitor's supabase client uses its own storageKey `nafsam-monitor-auth`
so it never clobbers the chat (`nafsam-chat-auth`) or activity
(`nafsam-activity-auth`) sessions on the same origin.
