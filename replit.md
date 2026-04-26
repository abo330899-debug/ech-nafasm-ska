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
- **Pages**: Home, Login, Moments (cinematic memory archive: hero + photo album + videos + timeline + final letter, all-in-one), Photos, Songs, Videos, Writings
- **Memory Archive**: `pages/Moments.tsx` is the redesigned luxury memory archive. Uses navy/rose-gold/amber palette with bokeh background, glassmorphism cards, accessible video modal + photo lightbox, horizontal timeline rail, and final letter panel. CSS classes prefixed `mem-` in `index.css` to avoid conflicts.
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
- **Required env**: `NAFSAM_SESSION_SECRET` (≥16 chars, required in prod), `NAFSAM_PASSWORDS` (comma-separated, **required in prod** — server throws if unset; no built-in fallback passwords exist), optional `NAFSAM_OPEN_AT` (ISO date the archive unlocks).

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

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
