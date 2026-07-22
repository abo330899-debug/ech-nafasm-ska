# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Artifacts

### Nafsam Monitor (artifacts/monitor)
Workspace-only monitoring dashboard (Arabic RTL, never published) that reads the archive's `activity_events` log from the chat Supabase project and auto-signs-in as the reader account. Rebuilt 2026-07-22 into 12 sections (Overview, Live, Sessions, Daily, Analytics, Content, Devices, Insights, Reports, Search, Alerts, Health) with wouter hash routing, a shared data provider (`src/lib/MonitorContext.tsx`), incremental newest-first loading + realtime stream (`src/lib/useMonitorData.ts`), session active/idle reconstruction (`src/lib/activity.ts`), and pure analytics selectors (`src/lib/analytics.ts`). **Intelligence layer (2026-07-22)**: `src/lib/intelligence.ts` — deterministic heuristics, deliberately NO LLM — provides session scoring (4 scores 0–100 + Arabic explanations), the single anomaly engine `detectAnomalies` (replaced/deleted `deriveAlerts` in analytics.ts; 9 rules, 4 severities), insights, confidence-gated predictions, Arabic session stories (`narrateSession`), and printable daily/weekly/monthly reports. `MonitorContext` computes `scored`/`anomalies`/`todayKey` once; heavy fns memo on `todayKey`, never on the raw 15s `now` tick (only cheap `detectAnomalies` takes `now`). Known wart: hour rules use Baghdad tz, day boundaries use viewer-local `dayKey`. Charts must stay wrapped in `dir="ltr"`. Docs: `artifacts/monitor/MONITOR_ARCHITECTURE.md`, `MONITOR_IMPROVEMENTS.md`, `PERFORMANCE_REPORT.md`, `SECURITY_REPORT.md`, `FINAL_REVIEW.md`, `AI_INSIGHTS.md`, `ANOMALY_ENGINE.md`, `SESSION_SCORING.md`, `INTELLIGENCE_LAYER.md`, `FINAL_INTELLIGENCE_REPORT.md`.

### Nafsam (artifacts/nafsam)
Personal memory archive site with dark glassmorphism aesthetics. Frontend-only React+Vite app.
- **Features**: Animated rain, multilingual support (TR/FA/AR/EN), countdown timers, riddle-based login, typed text animation, rotating quotes
- **Pages**: Home, Login, Moments, Photos, Songs, Videos, Writings
- **Tech**: React, Vite, wouter routing, custom CSS (no Tailwind), Inter font
- **Port**: 19579, preview path: /
- **Key files**:
  - `src/i18n/translations.ts` - 4-language translation data
  - `src/hooks/useLang.ts` - Language state with localStorage persistence
  - `src/pages/` - All page components
  - `src/components/` - Rain, TypedText, Navbar, LanguageSwitcher, Footer
  - `public/media/login_song.mp3` - only public media (plays before login)
- **Auth**: Server-side. POST /api/auth/login verifies password (env `NAFSAM_PASSWORDS`) and issues an HMAC-signed httpOnly cookie via `lib/session.ts` in api-server. `ProtectedRoute` calls /api/auth/session.
- **Private archive**: All photos, posters, videos, audio (~1.5GB) live in `artifacts/api-server/private/{media,posters,images}` and stream only via authed `/api/private/{media,posters,images}/*`. Writings + story captions live in `artifacts/api-server/private/content.json` and load via authed `/api/private/content`.
- **Required env**: `NAFSAM_SESSION_SECRET` (≥16 chars, required in prod), `NAFSAM_PASSWORDS` (comma-separated, **required in prod** — server throws if unset; no built-in fallback passwords exist), optional `NAFSAM_OPEN_AT` (ISO date the archive unlocks), optional `NAFSAM_ADMIN_TOKEN` (≥16 chars, sets a secret token for the `/api/reorder` admin endpoint — the reorder UI and its POST endpoint are protected by `requireAdmin`, which checks the `X-Admin-Token` header).
- **No-DB mode (2026-07-21)**: The PostgreSQL database is OPTIONAL. When `DATABASE_URL` is unset, `lib/db` exports `pool = null` and `session.ts` falls back to an in-memory revocation store (logout revocation lost on restart — accepted tradeoff). Decided to publish WITHOUT the database because the frozen production DB blocked every publish at the "Copying development database" step. The only table ever used was `revoked_sessions` (empty at removal time). Monitor + chat use Supabase, not this DB. A stale `DATABASE_URL` pointing at a dead DB is worse than none: `verify()` fails closed and rejects ALL sessions.
- **Static-site media (self-hosted on Cloudflare Pages, 2026-07-22)**: Cloudflare R2 was disabled account-wide (2026-07-21) and the interim Replit-deployment proxy required PUBLIC visibility the user couldn't enable. Now the full media tree (`media`, `posters`, `images`, ~2.1GB) + a sanitized `content.json` are uploaded directly to the `ech-nafasm-ska` Pages project under `/pub/<NAFSAM_STATIC_MEDIA_TOKEN>/…`, so the static site is fully standalone (no Replit dependency). `VITE_R2_BASE` in both `.env.cloudflare-pages` files points at `https://ech-nafasm-ska.pages.dev/pub/<token>`. Key facts:
  - **Git auto-deploy on the Pages project is DISABLED** (a git build would wipe the manually-uploaded media). Deploys are manual via `wrangler@3 pages deploy` from `/tmp` — full recipe in `.agents/memory/nafsam-cloudflare-deploy.md`.
  - **Videos must be ≤25MiB** (Pages per-file limit); 43 oversized videos were transcoded to H.264 720p (~22MiB) for the Pages copy only — originals in `artifacts/api-server/private/` are untouched.
  - **`artifacts/nafsam/functions/pub/[token]/media/[file].js`** is a Cloudflare Pages Function providing HTTP 206 range responses (iOS Safari requires them for video); Pages static serving ignores Range headers. Its `sizes.json` manifest must be regenerated when media changes.
  - **Never add a `404.html`** to the nafsam public dir — it disables Pages auto-SPA fallback and `_redirects` 200-rewrites are not honored (deep links like `/photos` break).
  - Content edits (content.json/media) now require restaging + redeploy to appear on the static site.

## Deployment
- **Target**: Autoscale (default) — uses per-artifact configuration from `artifact.toml`
- **Build**: Runs `pnpm install`, then builds both `@workspace/nafsam` and `@workspace/api-server`
- **Nafsam**: Served as static files from `artifacts/nafsam/dist/public`
- **API Server**: Runs via `node --enable-source-maps artifacts/api-server/dist/index.mjs`
- **Health check**: `/api/healthz`

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally
- `NAFSAM_PASSWORDS="pass1,pass2" pnpm --filter @workspace/scripts run gen-auth-tokens` — regenerate the `VITE_AUTH_TOKENS` value (SHA-256 hashes for static/Cloudflare login) after any password change. Add `--write` to rewrite the `VITE_AUTH_TOKENS=` line in `artifacts/nafsam/.env.cloudflare-pages` in place (no manual copy); the value is still printed so you can paste it into the production env var. Normalization (trim + lowercase + de-dupe) mirrors `artifacts/nafsam/src/lib/auth.ts`. If `NAFSAM_PASSWORDS` is set in the shell, you can omit the inline assignment.
  - **Password rotation must update THREE hash lists** (the script only rewrites the first): 1) `artifacts/nafsam/.env.cloudflare-pages` `VITE_AUTH_TOKENS`; 2) `AUTH_TOKENS_BUILTIN` in `artifacts/nafsam/src/lib/auth.ts`; 3) `AUTH_TOKENS_BUILTIN` in `artifacts/telegram-call/src/chat/wordAuth.ts` (the Telegram PWA has its own word login). Missing #3 leaves removed words still opening the chat. Plaintext words must NEVER appear in source or bundles — identity derivation uses `STAR_WORD_HASHES` (SHA-256), not plaintext.

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
