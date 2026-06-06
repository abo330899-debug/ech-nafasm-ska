---
name: telegram-call chat+call merge
description: telegram-call artifact is now a Telegram-style chat screen with the call overlay merged in.
---

# telegram-call: chat merged with call

The `telegram-call` artifact's main view is a Telegram iOS chat screen (messages +
composer), NOT the old contact card. The full-screen call overlay is unchanged and
opens from the chat header's voice/video buttons.

**Why:** user wanted one screen that both chats and calls, like real Telegram.

**How to apply:**
- All UI lives in `src/App.tsx` + `src/tg.css` (single-file React, no router for the main view).
- Messages are demo-only client state with a random canned auto-reply; no backend.
- Call lifecycle uses 5 timer refs (timerRef, sequenceRef, replyRef, endHideRef,
  endResetRef) all cleared in clearTimers() — end-call timeouts MUST stay in refs or
  a quick re-call resets state mid-call.
- Use `dir="auto"` on bubbles + input for Arabic/mixed text (not a regex check).
- Served statically: rebuild with `BASE_PATH="/telegram-call/" pnpm --filter @workspace/telegram-call run build`
  then restart the `artifacts/api-server: API Server` workflow (api-server serves
  dist/public; the telegram-call workflow itself just echoes).
