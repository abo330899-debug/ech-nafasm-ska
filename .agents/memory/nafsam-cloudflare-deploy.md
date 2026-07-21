---
name: Nafsam Cloudflare Pages deploy gotchas
description: Which token actually deploys, and the git-lock/wrangler pitfalls when deploying ech-nafasm-ska from this repl.
---

# Cloudflare Pages deploy (ech-nafasm-ska)

**Git auto-deploy is the primary path (since 2026-07-21):** the Pages project is
GitHub-connected (repo abo330899-debug/ech-nafasm-ska, production branch main)
and rebuilds on every push. Its build command (set via API PATCH on
build_config) builds BOTH apps and copies telegram-call into place:
`pnpm --filter @workspace/nafsam run build && pnpm --filter @workspace/telegram-call run build && cp -r artifacts/telegram-call/dist/public artifacts/nafsam/dist/public/telegram-call`,
destination `artifacts/nafsam/dist/public`. CF sets `CF_PAGES=1` so vite configs
bake the committed `.env.cloudflare-pages`.
**Why:** before this, git pushes auto-deployed nafsam only and silently WIPED
the `/telegram-call/` PWA from pages.dev (SPA fallback made it look 200-alive —
compare `<title>` to detect). Usually no manual wrangler deploy is needed
anymore; just push. Manual deploys below still work but a later git push
overwrites them.

**Monitor has its own separate Pages project (since 2026-07-21):**
`nafsam-monitor.pages.dev`, direct-upload (NOT git-connected). Redeploy by
`PORT=4173 BASE_PATH=/ NODE_ENV=production pnpm --filter @workspace/monitor run build`,
copy `artifacts/monitor/dist/public` → `/tmp/monitor-deploy`, then wrangler@3
pages deploy from /tmp with `--project-name=nafsam-monitor`. Supabase URL/anon
key are hardcoded in `artifacts/monitor/src/lib/supabase.ts` (no env needed).
Git pushes do NOT update it — manual redeploy only.

Manual deploy recipe (fallback): build with `CF_PAGES=1 NODE_ENV=production npx vite build` in
`artifacts/nafsam`, copy `dist/public` → `/tmp/nafsam-deploy`, then
`wrangler pages deploy /tmp/nafsam-deploy --project-name=ech-nafasm-ska --branch=main`.

**CRITICAL — telegram-call rides along:** the same Pages project also serves the
standalone Telegram app at `/telegram-call/` (PWA: avatar + home-screen icons).
A direct-upload deploy REPLACES the whole deployment, so EVERY deploy must also
copy `artifacts/telegram-call/dist/public` → `/tmp/nafsam-deploy/telegram-call`
(build it first with `pnpm --filter @workspace/telegram-call run build` if its
source changed). Forgetting this silently deletes the user's installed
home-screen app. `_redirects` needs the `/telegram-call/*` rewrite line before
the `/*` catch-all (kept in `artifacts/nafsam/public/_redirects`).

**Token status (fixed 2026-07-13):** `CLOUDFLARE_PAGES_TOKEN` now holds a
working custom API token with Account→Cloudflare Pages:Edit (user re-created it
after two bad pastes — first an old `cfut_` upload token, then a truncated
copy). `CLOUDFLARE_API_TOKEN` remains R2-only (no Pages permission).
**How to apply:** before debugging wrangler, test the token directly:
`curl -H "Authorization: Bearer $T" .../pages/projects/ech-nafasm-ska/upload-token`
— HTTP 200 means it can deploy. If it fails, ask the user for a fresh custom
token (Pages:Edit), and warn them `cfut_`-prefixed strings are NOT API tokens.

**Wrangler version:** `wrangler@latest` (v4+) requires Node 22 and the default
shell node is v20 — use `npx wrangler@3 pages deploy ...` (works fine). Pass the
token as `CLOUDFLARE_API_TOKEN=$CLOUDFLARE_PAGES_TOKEN` plus
`CLOUDFLARE_ACCOUNT_ID=d2680f7c5ff39f8d9177a51dbf7fec75`.

**/tmp staging vanishes between sessions** — always re-copy
`artifacts/nafsam/dist/public` → `/tmp/nafsam-deploy` in the same command as the
deploy, or wrangler fails with ENOENT.

**Service worker cache:** after any redeploy that must reach returning visitors,
bump `VERSION` in `artifacts/nafsam/public/sw.js` BEFORE building (e.g.
"v6-luxe", 2026-07-13) — the SW serves cached assets cache-first, so without a
bump users keep seeing the old design.

**Run wrangler from /tmp, not the workspace.** From the repo root, wrangler
shells out to git and the sandbox blocks it as a destructive git op; the
blocked attempt leaves a stale `/home/runner/workspace/.git/index.lock` that
makes every later `git commit` fail ("index.lock: File exists") until you
`rm -f` it. `(cd /tmp && wrangler pages deploy ...)` avoids both problems.

**Verify what's live, not what wrangler printed:** after deploy, the main
domain `ech-nafasm-ska.pages.dev` can lag/serve a cached index for ~20s; check
the per-deploy URL first (`https://<id>.ech-nafasm-ska.pages.dev`), then re-poll
the main domain for the new `assets/index-*.js` hash. Deployment history:
`GET /accounts/<acct>/pages/projects/ech-nafasm-ska/deployments` — note that
"latest deployments look recent" may be leftovers from an earlier session, not
proof the current attempt succeeded.
