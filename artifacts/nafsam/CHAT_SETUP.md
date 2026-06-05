# Nafsam private chat — setup guide

A private, real-time, two-person chat lives at **`/chat`**. It uses
[Supabase](https://supabase.com) (Realtime + Postgres + Storage). There is no
server to run — it works in the same static Cloudflare Pages build as the rest
of the site.

The two people are derived automatically from the Nafsam login word:

| Login word        | Chat identity |
| ----------------- | ------------- |
| `ska`             | **Star**      |
| any other valid word | **إلهام (Ilham)** |

No one picks who they are — it follows the word they logged in with.

---

## 1. Create a Supabase project

1. Go to <https://supabase.com> → **New project**.
2. Pick a name and a strong database password (you won't need it again here).
3. Wait for it to finish provisioning.

## 2. Run the schema

1. In the project, open **SQL Editor → New query**.
2. Paste the entire contents of [`/supabase/schema.sql`](../../supabase/schema.sql).
3. Click **Run**. This creates the `messages` table, security rules, realtime,
   and the private `chat-images` storage bucket.

## 3. Create the two login accounts

The app signs in to Supabase with a **fixed password per identity** — it does
**not** depend on which word was typed. This matters because Ilham can open
Nafsam with several different valid words, and all of them must reach the same
chat account. Create exactly these two accounts:

1. **Authentication → Users → Add user** (do this twice). Make sure
   **Auto Confirm User** is **ON** so they can sign in immediately.

   | Email             | Password        |
   | ----------------- | --------------- |
   | `star@nafsam.app` | `nafsam-ska`    |
   | `ilham@nafsam.app`| `nafsam-ilham`  |

   Type these passwords exactly as shown (all lowercase).

2. **Turn OFF public sign-ups** so no one else can ever create an account in
   this project: **Authentication → Providers → Email →** uncheck
   **"Allow new users to sign up"**. The security rules already fail closed for
   any email other than the two above, but disabling sign-ups removes the
   surface entirely.

> **Identity can't be faked:** the database stamps each message's author from
> the signed-in account itself (a server-side trigger), so neither person — nor
> anyone else — can post a message pretending to be the other.

> **Any of Ilham's words works:** every valid site word that isn't `ska` maps
> to Ilham, and they all open the chat as `ilham@nafsam.app`. `ska` is the only
> word that opens the chat as Star.

> **Why this is safe:** the real gate is the Nafsam login word, which is
> verified before the chat ever signs in and is never stored in the website code
> or git. The site only ships the public Supabase URL and anon key (both
> designed to be public); the database row-level-security rules are what protect
> the data.

## 4. Add the two public keys

In Supabase: **Project Settings → API**, copy:

- **Project URL** → `VITE_SUPABASE_URL`
- **anon public** key → `VITE_SUPABASE_ANON_KEY`

Set them in **two** places:

1. **Cloudflare Pages** → your project → **Settings → Environment variables**
   (Production): add both, then redeploy.
2. The repo files `artifacts/nafsam/.env` (local dev) and
   `artifacts/nafsam/.env.cloudflare-pages` (committed build defaults) — fill in
   the two empty `VITE_SUPABASE_*` lines.

When these two values are present, the **Chat** link appears in the navigation
automatically. Until then, the chat link is hidden and `/chat` shows
"not configured".

---

## What you get

- **Real-time messages** between Star and Ilham.
- **Online / offline** status and a **"typing…"** indicator.
- **Image messages** (stored privately, shown via short-lived signed URLs).
- **Delete your own message** (shows "this message was deleted").
- **Unread badge** on the Chat nav link.
- **Search** within the conversation.
- Works in all four site languages (AR / FA / TR / EN), with the same dark
  romantic look as the rest of Nafsam.

## Resetting a password

The chat passwords are fixed (`nafsam-ska` and `nafsam-ilham`) and don't change
when Ilham's site words change. If you ever want to rotate them, update the
matching value in `artifacts/nafsam/src/chat/chatAuth.ts` **and** the Supabase
user's password under **Authentication → Users → (user) → Reset password** so
the two stay in sync, then redeploy.
