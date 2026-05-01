# Threat Model

## Project Overview

This project is a pnpm-workspace TypeScript monorepo for a personal memory archive called Nafsam. Production consists of a React + Vite frontend in `artifacts/nafsam` and an Express 5 API in `artifacts/api-server`. The site presents a public landing/login experience and is intended to restrict the underlying memories, media, and writings to authorized viewers.

Production assumptions for future scans:
- `NODE_ENV` is `production` in deployed environments.
- Platform TLS is managed by the deployment platform.
- Requests reach the Node process through a platform proxy/load balancer, so proxy-aware controls matter for production behavior.
- `artifacts/mockup-sandbox` is development-only and should be ignored unless production reachability is demonstrated.

## Assets

- **Private memory content** -- photos, videos, audio, writings, captions, quotes, and related metadata associated with the archive. Exposure would disclose intimate personal material to unauthorized viewers.
- **Authentication material and session state** -- accepted riddle answers, session cookies, and the session-signing secret. Compromise would allow unauthorized access to the protected archive.
- **Application and deployment secrets** -- environment variables such as `NAFSAM_SESSION_SECRET`, `DATABASE_URL`, and any future third-party API credentials.
- **Archive privacy expectations** -- the expectation that protected pages, media, and JSON metadata are only available after successful server-side authorization and are not retained in public bundles or browser caches longer than intended.
- **Archive availability** -- the intended viewers' ability to complete the login flow and reach protected content without being trivially locked out by unauthenticated attackers.

## Trust Boundaries

- **Browser to frontend bundle boundary** -- every visitor can download and inspect the public web bundle. Any sensitive text, media inventory, or gatekeeping material shipped in client assets should be treated as public.
- **Browser to API boundary** -- `/api/auth/*` and `/api/private/*` requests cross from an untrusted client into trusted backend code. All authentication and authorization decisions must be enforced server-side.
- **Browser local state/cache boundary** -- once a browser has fetched protected content, the app and the browser cache may retain it locally. Sensitive responses must be delivered with cache directives consistent with the archive's privacy goals.
- **Platform proxy to Node boundary** -- the deployed app sits behind a platform-managed proxy/load balancer. Controls that rely on client network identity, such as IP-based throttling, must use trusted forwarded addresses rather than the immediate peer socket.
- **API to private filesystem boundary** -- `artifacts/api-server/private/` stores protected media and `content.json`. File-serving code on this boundary must prevent path traversal, cache leakage, and unauthenticated access.
- **Production to dev-only boundary** -- `artifacts/mockup-sandbox`, `scripts/`, and codegen/spec tooling are not production surfaces unless explicitly wired into deployment.

## Scan Anchors

- **Production entry points**: `artifacts/api-server/src/index.ts`, `artifacts/api-server/src/app.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/private.ts`, `artifacts/nafsam/src/App.tsx`
- **Highest-risk code areas**: `artifacts/api-server/src/lib/session.ts`, `artifacts/api-server/src/routes/auth.ts`, `artifacts/api-server/src/routes/private.ts`, `artifacts/nafsam/src/i18n/translations.ts`, `artifacts/nafsam/src/hooks/usePrivateContent.ts`, `artifacts/nafsam/src/lib/auth.ts`, `artifacts/nafsam/src/pages/Login.tsx`, `artifacts/nafsam/src/pages/Songs.tsx`, `artifacts/nafsam/dist/public/assets/`
- **Public surfaces**: the frontend bundle and static assets under `artifacts/nafsam/dist/public`, including generated JS chunks that any visitor can download, plus `/api/healthz` and `/api/auth/*`
- **Intended authenticated surfaces**: `/api/private/*` and frontend routes such as `/home`, `/moments`, `/photos`, `/songs`, `/videos`, and `/writings`
- **Dev-only areas to usually ignore**: `artifacts/mockup-sandbox/`, `scripts/`, `lib/api-spec/`

## Threat Categories

### Spoofing

The server must fail closed if production authentication configuration is incomplete. Accepted login answers must come from deployment configuration rather than hardcoded fallbacks, and the application must not expose exact accepted answers or answer identifiers to unauthenticated visitors, including in public bootstrap endpoints such as `/api/auth/session`. Session cookies must remain signed with a production-only secret and validated on every protected request. Changing the archive answer or performing an access-revocation action must also provide a way to invalidate already-issued sessions rather than leaving old cookies valid for their full TTL.

### Tampering

The browser is untrusted and can alter route state, requests, and asset URLs. Authorization decisions for protected memories must remain on the server, and file-serving code must continue to canonicalize user-influenced paths before reading from the private filesystem.

### Information Disclosure

Protected memories must not be exposed through public frontend bundles, logs, error responses, or cache policy. Sensitive text, media inventories, intimate captions, and protected object identifiers must only be delivered after successful authorization. In this codebase, shared frontend assets such as `src/i18n/translations.ts`, protected page modules, and generated chunks under `dist/public/assets/` are especially sensitive because anything embedded there is compiled into publicly downloadable JavaScript. Every protected response, including `/api/private/content`, must use cache directives that prevent later recovery from browser caches on shared devices. Because the SPA keeps protected data in in-memory client state, protected views and module-scoped caches must also be cleared promptly when authorization is lost rather than remaining visible until an asynchronous route check finishes.

### Denial of Service

The archive has a small public authentication surface, so unauthenticated abuse of `/api/auth/login` can materially deny access to intended viewers. Rate limiting must be keyed on trustworthy client identity in the deployed proxy topology and must not collapse unrelated users into a shared bucket that an attacker can exhaust for everyone.

### Elevation of Privilege

A visitor must not be able to promote themselves from unauthenticated to authenticated by exploiting insecure defaults, client-side route guards, or predictable asset URLs. Any backend endpoint that exposes archive data must enforce authorization server-side and must not rely on the frontend to pre-filter access.