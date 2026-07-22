# ARCHITECTURE_ANALYSIS.md

Deep architecture analysis of the Nafsam monorepo, produced 2026-07-22 from a full read of the codebase. This is a descriptive document only — no code was modified.

> Note on secrets: this file deliberately never quotes password values, token values, or hash-list contents, because the repository is mirrored to a public GitHub repo. Where credentials are discussed, only their *pattern* and *location* are described.

---

## 1. What the system is

Nafsam is a **personal memory archive**: a password-gated, multilingual (TR/EN/AR/FA) website containing private photos, videos, songs, writings, and an emotional-storytelling page — plus a companion **Telegram-style chat PWA** and an **admin activity monitor**. It is built as a pnpm TypeScript monorepo with four deployable artifacts and four shared libraries (plus a `scripts` utility workspace).

| Artifact | Package | What it is | Serving |
|---|---|---|---|
| `artifacts/nafsam` | `@workspace/nafsam` | Main archive frontend (React 19 + Vite, wouter, custom CSS) | Static bundle (CF Pages / GitHub Pages) or served by api-server on Replit |
| `artifacts/api-server` | `@workspace/api-server` | Express 5 API: auth, private media streaming, admin reorder, token-gated public routes | Replit deployment (currently **private** visibility) |
| `artifacts/telegram-call` | `@workspace/telegram-call` | iOS-Telegram-lookalike chat/call PWA backed by Supabase | Built statically; copied under `/telegram-call/` on the static hosts; also servable by api-server |
| `artifacts/monitor` | `@workspace/monitor` | Admin dashboard reconstructing viewer sessions from activity events | Workspace/private use |

| Shared lib | Purpose |
|---|---|
| `lib/api-spec` | OpenAPI source of truth (`openapi.yaml`) + Orval codegen config |
| `lib/api-client-react` | Generated React-Query hooks + custom fetch client |
| `lib/api-zod` | Generated Zod schemas |
| `lib/db` | Drizzle schema (only `revoked_sessions`) + drizzle-kit push |
| `scripts` | Utility scripts: auth-token generation, thumbnail generation, legacy R2 uploaders |

---

## 2. Deployment topology (the most important thing to understand)

There are **two fundamentally different runtime modes** of the same frontend, selected at build time:

### 2.1 Server mode (Replit deployment)
- Root `.replit` + root `package.json` `start` script run `@workspace/api-server` (`node --enable-source-maps dist/index.mjs`, bundled by esbuild).
- The Express server serves the API under `/api`, the nafsam bundle at `/`, and the telegram-call bundle at `/telegram-call` (SPA fallbacks for both).
- Auth is **server-side**: HMAC-signed httpOnly cookie; media streams from `artifacts/api-server/private/` only after cookie verification.
- The deployment is currently **private** (Replit auth wall), so it is effectively an owner-only surface.

### 2.2 Static mode (Cloudflare Pages + GitHub Pages) — the *live public* surface
- `vite.config.ts` (both nafsam and telegram-call) loads the committed `.env.cloudflare-pages` whenever `CF_PAGES=1` or `GITHUB_ACTIONS=true`, baking in `VITE_STATIC_MODE`, `VITE_AUTH_TOKENS` (SHA-256 password hashes), `VITE_R2_BASE`, and Supabase anon credentials.
- Auth is **client-side**: the login word is SHA-256-hashed and compared against a baked-in hash list; success sets a localStorage flag. There is no server to enforce anything.
- Since 2026-07-22 the static site is **fully standalone**: the entire media tree (~2.1 GB: `media/`, `posters/`, `images/`, plus a sanitized `content.json`) is uploaded *directly into the Cloudflare Pages deployment* under `/pub/<NAFSAM_STATIC_MEDIA_TOKEN>/…`. The token is a dedicated random value acting as public-by-obscurity path protection.
- A **Cloudflare Pages Function** (`artifacts/nafsam/functions/pub/[token]/media/[file].js`) synthesizes HTTP 206 range responses (iOS Safari refuses `<video>` without them; Pages static serving ignores `Range`). Because `env.ASSETS.fetch` returns no `Content-Length`, file sizes come from a bundled `sizes.json` manifest generated from the staged media, with a buffered fallback for unlisted files.
- **Operational invariants** (violating any of these breaks the site):
  - CF Pages **git auto-deploy is disabled** — a git-triggered build would wipe the manually-uploaded media. Deploys are manual `wrangler pages deploy` direct uploads.
  - Every media file must be **≤ 25 MiB** (Pages limit); 43 oversized videos exist only as H.264 720p transcodes on Pages (originals untouched in `artifacts/api-server/private/`).
  - `sizes.json` must be regenerated whenever media changes — a stale entry with a wrong size silently corrupts range responses.
  - No `404.html` may exist in `artifacts/nafsam/public/` — its presence disables Pages auto-SPA fallback and `_redirects` 200-rewrites are not honored, which 404s deep links like `/photos`.
- GitHub Pages (`.github/workflows/github-pages.yml`) builds both frontends and deploys them in the same layout; the GitHub repo itself is public.

### 2.3 Consequence
The "real" production security boundary today is the **static-mode client-side model**: baked-in SHA-256 hash lists + a secret path token. The much stronger server-side model (cookies, rate limiting, revocation) exists in code but sits behind a private Replit deployment that outside viewers never reach. Every security judgment about the live site must start from this fact.

---

## 3. api-server internals

### 3.1 Request lifecycle (`src/index.ts` → `src/app.ts`)
1. `trust proxy` enabled in production (X-Forwarded-For aware).
2. `pino-http` structured logging (method, path without query, status). Server code correctly avoids `console.log`.
3. CORS with dynamic origin validation against `REPLIT_DOMAINS` / `REPLIT_DEV_DOMAIN`.
4. `cookie-parser`, JSON/urlencoded body parsers.
5. `/api` router → `health`, `auth`, `private`, `reorder`, `pub` routers.
6. Static: `/telegram-call` → telegram-call dist; `/*` (prod) → nafsam dist; SPA fallbacks.

### 3.2 Auth (`routes/auth.ts` + `lib/session.ts`)
- **Login**: requires `application/json` and a valid `Origin`; answers checked case-insensitively against env `NAFSAM_PASSWORDS` (comma-separated; **required in prod, server throws if unset** — fail-closed, no fallback answers).
- **Rate limiting**: in-memory Map keyed by client IP, max 8 attempts/60s. `getClientIP` walks `X-Forwarded-For` right-to-left skipping private ranges — correct for the proxy topology.
- **Cookie format**: `expiresAt:passwordVersion:jti.signature`, HMAC-SHA256 with `NAFSAM_SESSION_SECRET` (≥16 chars enforced). `passwordVersion` is a hash of the password list, so rotating passwords invalidates every outstanding session — an elegant global-revocation mechanism.
- **Revocation**: logout inserts the `jti` into `revoked_sessions` (Postgres via raw `pg`), or an in-memory Map when `DATABASE_URL` is unset (**no-DB mode**, deliberate since 2026-07-21: the only table ever used was `revoked_sessions`; a stale `DATABASE_URL` is worse than none because `verify()` fails closed and rejects all sessions). Hourly pruning interval in both modes.
- `GET /api/auth/session` returns auth status, countdown to `NAFSAM_OPEN_AT`, and the riddle "cards" — i.e., login hints are exposed pre-auth (see §8).

### 3.3 Media & content
- Private serving (`routes/private.ts`): `requireAuth` → `res.sendFile` with `Cache-Control: no-store`. Path traversal defended by normalize + `path.relative` containment check.
- Token-gated public serving (`routes/pub.ts`): `timingSafeEqual` token compare, `acceptRanges: true`, `public, max-age=86400`. Fail-closed if `NAFSAM_STATIC_MEDIA_TOKEN` unset. **Currently unreachable from the internet** (private deployment) but still production code.
- `content.json` handling: in-memory cache; `sanitizeContentForClient` (private API — forces `heroImageUrl` onto the private route) vs `sanitizeContentForStatic` (rewrites all URLs onto the token base). Hardcoded default songs/feelings as fallback.
- Admin reorder (`routes/reorder.ts`): drag-and-drop RTL HTML tool + POST that rewrites `content.json` photo order; gated by `X-Admin-Token` vs `NAFSAM_ADMIN_TOKEN` (fail-closed).

---

## 4. nafsam frontend internals

### 4.1 Routing (wouter, `App.tsx`)
`/` Login (countdown + riddle form) · `/home` dashboard with elapsed-time counter · `/photos` windowed grid + pinch-zoom lightbox · `/journey` 25-moment timeline · `/songs` · `/videos` (MP4/YouTube/MEGA, orientation-aware modal) · `/writings` · `/feelings` (ambient storytelling with smoke/ember effects). `ProtectedRoute` redirects to `/` unless `authState === "authed"`; App polls `fetchSession` + revalidates content every 60s and performs local logout (cache + state clear) on 401.

### 4.2 Auth (`lib/auth.ts`)
Static mode: SHA-256 the entered word → compare against the union of `AUTH_TOKENS_BUILTIN` (in source) and `VITE_AUTH_TOKENS` (env-baked); persist a localStorage flag. Identity derivation (owner "star" vs viewer "ilham") via `STAR_WORD_HASHES`. Time-gating via baked `VITE_OPEN_AT`. Server mode: cookie-based `/api/auth/*` calls.

### 4.3 Content & media
- `usePrivateContent.ts`: module-level cache + inflight-promise dedupe + a `generation` counter to kill stale responses across re-auths. Exposes `pickLocalized` for 4-language content fields.
- `lib/r2.ts` builds media URLs: static mode → `VITE_R2_BASE/<kind>/<file>` (now the same-origin Pages `/pub/<token>` base); server mode → `/api/private/...`. `_thumbs/` variants for grid thumbnails; `LuxImage` falls back thumb→full-res.

### 4.4 Performance techniques already present
- **Gallery windowing** (Photos/Videos): IntersectionObserver sentinel grows `visibleCount` — essential; 245 videos rendered at once caused iOS Safari OOM reloads.
- Thumbnails (600–800px) in grids; full-res only in lightbox, one alive at a time.
- `content-visibility` / reveal-on-intersect for heavy `Feelings` sections; custom scroll restoration that retries via rAF until async content grows page height (fixes mobile tab-eviction jump-to-top).
- Service worker (`public/sw.js`, manual `VERSION` string): cache-first for hashed assets/fonts, network-first for navigations, network-only for `/api/*`; deliberately no `skipWaiting()` to avoid mid-viewing reloads.

### 4.5 Activity tracking (`lib/activity.ts`)
Every visit signs into Supabase as one of two fixed accounts (owner/viewer, derived from the login word) and appends rows to `activity_events`: open, login, logout, page_view, photo_open, video_open, 45s heartbeats, and a `keepalive`-fetch leave event on `pagehide`. RLS functions (`chat_identity()`, `activity_reader()`) enforce per-account access.

---

## 5. telegram-call & monitor

### 5.1 telegram-call
- Vite app at base `/telegram-call/`, own word-login (`src/chat/wordAuth.ts`) with **its own copies** of the hash lists — iOS PWA storage is isolated from the main site, so it cannot reuse nafsam's localStorage.
- `chatAuth.ts` maps word → identity → fixed Supabase account via `signInWithPassword` (emails and secondary passwords hardcoded in source, visible in the public bundle; protection rests entirely on Supabase RLS).
- Data model: a single `messages` table; reactions and control signals are rows in the same table flagged with a Private-Use-Area sentinel character; voice notes ride the `image_path` column with duration encoded in the filename. Realtime via two Supabase channels (messages + durable read-state).
- Heavy iOS-PWA engineering: `contenteditable` composer (must never be replaced with input/textarea), `visualViewport`-driven `--tg-vh` and `.tg-kb-open` keyboard handling, safe-area CSS vars, standalone manifest.
- **Deploy coupling**: every CF Pages deploy of nafsam must also copy the telegram-call dist into `deploy-dir/telegram-call/` or the installed PWA vanishes for users.

### 5.2 monitor
- Auto-signs-in (no login screen) as a dedicated monitor account with a high-entropy password (deliberately unlike the guessable chat-account password pattern) against Supabase project `rwpgtnjpqwlddborvyrd` — it must never point at the separate analytics project.
- Reads `activity_events` and reconstructs viewer "sessions" with a 2.5-minute gap threshold (`src/lib/activity.ts`).

---

## 6. End-to-end data flows

### 6.1 Static-mode viewer (the live public path)
```
Browser → CF Pages (static bundle)
  login word → SHA-256 → match baked hash list → localStorage flag
  content:  GET  /pub/<token>/content.json          (static file, no-store)
  images:   GET  /pub/<token>/images|posters/*      (static, cached 86400)
  videos:   GET  /pub/<token>/media/*  → Pages Function → 206 slices via sizes.json
  activity: Supabase signInWithPassword(fixed acct) → INSERT activity_events (RLS)
```

### 6.2 Server-mode viewer (Replit, currently private)
```
Browser → Express
  POST /api/auth/login  (Origin check, IP rate limit, NAFSAM_PASSWORDS)
    → HMAC cookie (expiresAt:passwordVersion:jti.sig)
  GET /api/private/content|media/*  → requireAuth → verify sig/exp/pwVersion/revocation
    → revocation store = Postgres revoked_sessions OR in-memory Map (no-DB mode)
  POST /api/auth/logout → insert jti into revocation store
```

### 6.3 Chat
```
telegram-call PWA → word login (own hash list) → Supabase auth (fixed account)
  → INSERT/SELECT messages (+ PUA-sentinel reaction rows) → Realtime channels
monitor → auto-login (monitor account) → SELECT activity_events → session reconstruction
```

### 6.4 Content publishing (owner workflow)
```
edit artifacts/api-server/private/content.json (or /api/reorder admin tool)
  → restage media+content to /tmp → regenerate sizes.json → wrangler pages deploy
  (git push alone does NOT update the static site's content — auto-deploy is off)
```

---

## 7. Hidden dependencies (things that will bite if unknown)

1. **Triple-copy password hash lists**: rotating a password requires updating (a) `VITE_AUTH_TOKENS` in `artifacts/nafsam/.env.cloudflare-pages` (the gen-auth-tokens script rewrites only this one), (b) `AUTH_TOKENS_BUILTIN` in `artifacts/nafsam/src/lib/auth.ts`, (c) `AUTH_TOKENS_BUILTIN` in `artifacts/telegram-call/src/chat/wordAuth.ts` — plus env `NAFSAM_PASSWORDS` for server mode. Missing any copy leaves a removed word still working somewhere.
2. **sizes.json ↔ media coupling**: a filename present in the manifest with a wrong size is *trusted*, producing corrupted/truncated range streams. Absent filenames fall back safely (buffered).
3. **CF Pages deploy ↔ telegram-call coupling** (§5.1) and **git-auto-deploy must stay disabled** (§2.2).
4. **404.html poison pill**: adding one silently kills SPA deep links on Pages.
5. **`vite.config.ts` env hijack**: any CI with `GITHUB_ACTIONS=true` builds *static-mode* bundles even if that wasn't intended.
6. **Supabase project split**: chat/activity/monitor live on one specific project; a second (analytics) project exists — pointing the monitor at the wrong one yields silently empty dashboards.
7. **`DATABASE_URL` is a liability, not a dependency**: setting a stale value breaks *all* sessions in server mode (verify fails closed).
8. **Photos↔captions pairing by index**: `content.json` pairs `photos[i]` with `captions[lang][i]` positionally; reordering photos without captions (or vice-versa) silently misassigns captions.
9. **contenteditable composer**: replacing it with a normal input breaks iOS keyboard behavior in the chat PWA.
10. **Service-worker VERSION**: forgetting to bump it can leave clients on stale cached shells.

---

## 8. Security assessment

The threat model (`threat_model.md`) is current and honest. Key points, ordered by real-world impact:

1. **Client-side auth is the real gate (accepted posture).** On the live static site, "authentication" = SHA-256 hash comparison in public JS + a localStorage flag. Anyone can bypass the *UI* gate trivially; actual confidentiality rests on the secret `/pub/<token>` path. This is public-by-obscurity, **explicitly accepted** by the owner. The token is baked into public bundles and the public GitHub repo — so it is exactly as secret as the repo/bundle is unread. Offline dictionary attack against the baked hash lists is feasible for guessable words (no salt, fast hash).
2. **Hardcoded Supabase credentials in public bundles.** Chat account emails + secondary passwords and the anon key ship in the telegram-call bundle; the monitor password ships in the monitor bundle. All enforcement is RLS. Anyone reading the public repo can sign in as the viewer/owner *chat* accounts and read/write chat messages and activity rows those accounts can access. This is the weakest genuinely-sensitive point in the system (chat content is intimate), and it is only as strong as the obscurity of the repo + the RLS policies.
3. **Login hints pre-auth**: `/api/auth/session` returns riddle cards to unauthenticated visitors (server mode), and the static bundle contains equivalent hint text — narrows the guessing space by design (riddle login is the product).
4. **Server-side model is solid where it applies**: fail-closed env handling, timingSafeEqual, HMAC cookies with password-version global invalidation, origin checks, proxy-aware rate limiting, path-traversal containment, `no-store` on private responses. Two real caveats: (a) in no-DB mode, logout revocation does not survive restarts (accepted); (b) in-memory rate limiting resets on restart and doesn't scale past one instance.
5. **Pages Function**: correct 206/416 semantics verified byte-exactly; missing files return the SPA HTML with 200 (benign but can serve HTML as "video" if content.json references a nonexistent file); sets its own CORS/CORP/cache headers (`_headers` doesn't apply to function responses).
6. **`sizes.json` in the public repo** enumerates every media filename — within the accepted posture (the token-gated content.json already enumerates media), recorded in the threat model.

---

## 9. Duplicated logic

| Duplication | Locations | Risk |
|---|---|---|
| SHA-256 hex helper + hash lists + identity derivation | `nafsam/src/lib/auth.ts`, `nafsam/src/lib/activity.ts`, `telegram-call/src/chat/wordAuth.ts`/`chatAuth.ts` | Auth drift on rotation (has already required a documented 3-place checklist) |
| Supabase client instantiation (different `storageKey`s) | nafsam, telegram-call, monitor | Mostly deliberate (session isolation), but URL/key constants are repeated |
| Content-shape defaults | api-server `getDefaultSongs`/`getDefaultFeelings` vs frontend expectations | Two places to update when content schema evolves |
| Static-mode env files | `artifacts/nafsam/.env.cloudflare-pages`, `artifacts/telegram-call/.env.cloudflare-pages` | Same Supabase values maintained twice |
| Media path construction | frontend `lib/r2.ts` vs server `sanitizeContentForStatic` | URL-shape drift between modes |

A shared `lib/auth-tokens` (hash lists + sha256 + identity mapping) consumed by both frontends would eliminate the worst of this — the monorepo already has the lib/ machinery for it.

---

## 10. Technical debt

1. **OpenAPI spec is fiction**: `lib/api-spec/openapi.yaml` defines only `healthz`, while the server implements auth/private/pub/reorder. The Orval-generated hooks/schemas (`lib/api-client-react`, `lib/api-zod`) are barely used; the frontend hand-rolls its fetches. Either the contract-first flow should be adopted for real or the codegen libs are dead weight.
2. **Raw `pg` instead of Drizzle** in `session.ts` despite `lib/db` defining the exact table — two sources of truth for the schema.
3. **`PrivateContent` interface bloat**: dozens of positional keys (`photo1_text` … `photo29_text`) make the content schema brittle and mechanical to extend.
4. **Legacy R2 scripts** (`upload-to-r2.ts`, `upload-frontend-to-r2.ts`) target an R2 bucket retired 2026-07-21 — dead code that could mislead a future maintainer into thinking R2 is live.
5. **Reorder tool as inline HTML string** in a route file — unlinted, untyped UI code.
6. **PUA-sentinel message encoding** in chat: clever, schema-free, but every client feature must re-parse sentinel conventions; a `kind` column would be cleaner.
7. **Duplicated ≤768px media-query blocks** in nafsam's `index.css` — edits to the earlier block are silently dead (cascade order); a known trap.
8. **~1.5–2 GB of media inside `artifacts/api-server/private/`** inflates the Replit image (publish hangs near the 8 GB layer limit; pnpm-store pruning has been required before).
9. **Empty `src/middlewares/` placeholder** in api-server.
10. **`sizes.json` generated out-of-band** (from /tmp staging that vanishes between sessions) rather than by a checked-in script — the deploy recipe lives in agent memory and a markdown doc, not in `scripts/`.

---

## 11. Architectural weaknesses

1. **Two divergent auth models for one product.** Server mode and static mode implement different security semantics, different logout behavior, and different content sanitization. Every auth change must be reasoned about twice. The static model won by circumstance (private-deployment constraint), leaving the stronger server model as mostly-dormant code.
2. **Deployment is artisanal.** The live site depends on a manual, multi-step, /tmp-staged wrangler upload with several silent-failure invariants (§7). There is no checked-in `deploy-static.ts` script encoding: stage → transcode-if-needed → regenerate sizes.json → copy telegram-call → deploy → smoke-test. This is the single highest-value improvement available.
3. **Content updates require redeploys.** Editing `content.json` or adding media no longer propagates automatically; the owner's `/api/reorder` tool edits the *Replit* copy, which the public site never sees until a manual restage+deploy.
4. **Positional coupling in the content model** (photos↔captions by index, numbered text keys) instead of self-contained objects (`{file, caption:{tr,en,ar,fa}}`).
5. **Cross-app contracts are implicit**: localStorage key names, hash lists, Supabase table shapes, and the PUA sentinel are shared conventions with no single typed definition.

---

## 12. Performance & scalability

**Solid for its purpose.** This is a 2-viewer personal archive on a global CDN; media is cache-friendly (86400s), galleries are windowed, thumbnails are pregenerated, and the SW caches the shell. Known bottlenecks and ceilings:

1. **iOS Safari memory** remains the binding constraint: many full-res lightbox opens can still OOM-reload the tab (mitigated to one live full-res image; not eliminated).
2. **Pages Function range serving**: known-size files stream-slice efficiently, but manifest-missing files are fully buffered (~22 MiB worst case) per request — fine at this scale, a cost trap at real traffic.
3. **25 MiB/file ceiling** caps video quality on the static host permanently; higher-quality serving would need a real object store/CDN (R2 re-enabled, B2+CDN, etc.).
4. **api-server single-instance assumptions**: in-memory rate limiter and (in no-DB mode) in-memory revocation both break under scale-out — irrelevant while the deployment is private and single-instance, but a documented boundary.
5. **`content.json` monolith**: one file carries all page content; at current size trivial, but it is re-fetched and re-parsed as a unit and positionally coupled (§11.4).
6. **Supabase chat**: single `messages` table with realtime — fine for 2 users indefinitely; reactions-as-rows means client-side filtering of every sentinel row on load.

---

## 13. Prioritized improvement opportunities

*(Recommendations only — nothing was changed.)*

1. **Script the static deploy** (`scripts/src/deploy-static.ts`): stage originals → enforce/transcode 25 MiB limit → regenerate `sizes.json` → copy telegram-call dist → wrangler deploy → automated smoke checks (206 byte-exactness, deep links, content.json). Converts the riskiest manual process into a one-command operation.
2. **Extract a shared auth lib** (`lib/auth-tokens`): one hash list, one sha256 helper, one identity map, consumed by nafsam, telegram-call, and the gen-auth-tokens script. Kills the 3-place rotation checklist.
3. **Restructure `content.json`** into self-contained localized objects; delete the numbered-key fields and index-paired caption arrays.
4. **Decide the OpenAPI question**: either describe the real API in `openapi.yaml` and adopt the generated hooks/Zod schemas, or remove the codegen libs.
5. **Delete dead R2 uploaders**; move the deploy recipe from memory/markdown into the checked-in script of (1).
6. **Migrate `session.ts` to Drizzle** (or delete `lib/db` if no-DB mode is permanent).
7. **Make the Pages Function return 404 for missing media** (distinguish asset-miss from SPA fallback) to fail loudly on bad content.json references.
8. **Consider moving media out of the Replit image** (it exists on Pages now) if publish size becomes a recurring problem — with the caveat that `artifacts/api-server/private/` is currently the only copy of the *original-quality* videos, so any such move must relocate, never delete.
