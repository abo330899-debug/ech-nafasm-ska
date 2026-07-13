---
name: Nafsam Cloudflare Pages deploy gotchas
description: Which token actually deploys, and the git-lock/wrangler pitfalls when deploying ech-nafasm-ska from this repl.
---

# Cloudflare Pages deploy (ech-nafasm-ska)

Deploy recipe: build with `CF_PAGES=1 NODE_ENV=production npx vite build` in
`artifacts/nafsam`, copy `dist/public` → `/tmp/nafsam-deploy`, then
`wrangler pages deploy /tmp/nafsam-deploy --project-name=ech-nafasm-ska --branch=main`.

**Token footgun (bit 2026-07-13):** the env secrets do NOT hold a working
Pages-deploy token. `CLOUDFLARE_API_TOKEN` has R2/API access but no Pages
permission, and `CLOUDFLARE_PAGES_TOKEN` contains TWO concatenated `cfut_`
tokens (107 chars) — both verify as "active" but both fail the
`/pages/projects/.../upload-token` endpoint with auth error 10000, so wrangler
deploys fail. The token that actually deploys is a separate `cfut_` token used
in earlier sessions and is NOT stored in env.
**How to apply:** before debugging wrangler, test the token directly:
`curl -H "Authorization: Bearer $T" .../pages/projects/ech-nafasm-ska/upload-token`
— success means it can deploy. If no working token is at hand, ask the user to
update the `CLOUDFLARE_PAGES_TOKEN` secret with a token that has Pages:Edit.

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
