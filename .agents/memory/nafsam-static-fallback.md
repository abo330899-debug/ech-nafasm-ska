---
name: Nafsam static #root fallback masks React mount failure
description: Why a "locked/countdown" landing that looks intentional can actually be a broken React mount, and where to look.
---

# Nafsam static #root fallback

`artifacts/nafsam/index.html` ships a static placeholder INSIDE `<div id="root">`
— the title "Nafsam — Kişisel Anı Arşivi" plus the Turkish "Bu yer geri sayım…"
paragraphs (login_title/text/hint hardcoded). It is meant to paint instantly
before React hydrates.

**The trap:** if React never mounts, that placeholder stays on screen and looks
exactly like the intended locked/pre-open state — but with NO login input, NO
countdown card, NO language switcher (unstyled: big serif h1 + two plain
paragraphs, lots of empty black below). Server `/api/auth/session` returning
`isOpen:true` + cards while the page shows only the placeholder is the tell.

**Root cause seen:** `src/main.tsx` had been clobbered to only call a tracker
and was missing `createRoot(...).render(<App/>)` entirely, so nothing mounted.
Fix = restore the real main.tsx (mounts App + LoadingVeil + CSS, clears stale
service workers).

**How to apply:** when nafsam shows the "locked" text with no form/counter,
check `src/main.tsx` mounts React BEFORE assuming it's the countdown gate. The
real mount is the pre-46c1c0a version.

Related dead code removed at the same time: `src/lib/activityTracker.ts` and
`src/lib/supabase.ts` — a second, broken tracker pointed at the empty analytics
project (eevanqnzc…) that spammed "permission denied for table activity_events".
The LIVE monitor pipeline is `src/lib/activity.ts` (called from App.tsx when
authed) → do not confuse the two.
