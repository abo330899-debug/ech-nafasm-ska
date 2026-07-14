---
name: Telegram Call iOS composer
description: How the chat composer avoids the iOS accessory bar and keyboard gap; runtime verification approach
---

# Telegram Call iOS Composer

## Accessory bar (↑↓ ✓)
- The message editor MUST stay a `contenteditable` DIV (`.tg-composer-input`, role=textbox, enterkeyhint=send). Any `<input>`/`<textarea>` on the chat screen brings back the iOS form-navigation bar. Only allowed input: the hidden file picker.
- All composer buttons need `type="button"`.
- iOS may still show the predictive-text strip — no web app can remove that; only the ↑↓✓ form bar is avoidable. Expectation already set with user.

## Keyboard gap
- `.tg-chat-page` is position:fixed sized by `--tg-vh`/`--tg-top` from visualViewport.
- Keyboard-open detection: `window.innerHeight - vv.height - vv.offsetTop > 50` toggles `tg-kb-open` class on `<html>`; while open, `.tg-composer` padding-bottom drops from `max(safe-bottom,10px)` to 8px so the bar hugs the keyboard.

## Runtime verification (user demands this, not just source inspection)
- Use the Playwright testing subagent: login word "ska" works locally; inspect `document.querySelector('.tg-composer-input').tagName === 'DIV'`, `isContentEditable`, zero textareas, only hidden file input.
- CRITICAL: instruct the test agent to NEVER send a message — it is a real chat with a real recipient.

## Deploy gotcha
- `wrangler pages deploy` fails inside the workspace repo (Replit blocks git index.lock writes). Run it with `cd /tmp` first — deploy dir `/tmp/nafsam-deploy` (nafsam dist + telegram-call dist under `telegram-call/`).
- Do not leave plaintext accepted login words in source comments (threat model forbids; repo is pushed to GitHub).
