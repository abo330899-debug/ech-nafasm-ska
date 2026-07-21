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
