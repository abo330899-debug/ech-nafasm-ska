---
name: Nafsam R2 frontend upload
description: How frontend build artifacts get pushed to the Cloudflare R2 "star" bucket and the token permission gotcha.
---

# Nafsam frontend → R2 "star" bucket

`scripts/src/upload-frontend-to-r2.ts` (npm: `@workspace/scripts run upload-frontend-to-r2`)
uploads ONLY the built frontend from `artifacts/nafsam/dist/public` to the R2
bucket `star` via the Cloudflare REST API (Bearer `CLOUDFLARE_API_TOKEN`).
Private media is intentionally excluded (the `media/` dir + audio/video exts),
so `login_song.mp3` is NOT uploaded. Supports `--dry-run`.

**Token permission gotcha (cost real round-trips):**
The REST endpoint `api.cloudflare.com/.../accounts/<acct>/r2/buckets/<bucket>/objects/<key>`
needs a Cloudflare **API Token** (Bearer, ~40+ chars, `cfut_` prefix) that has
the **Account → Workers R2 Storage → Edit** permission. Symptoms when it's wrong:
- `key_…` 20-char value = R2 S3 Access Key ID (wrong; only works on the S3 endpoint), not the REST Bearer token.
- Valid token but ALL R2 ops return `{code:10000, "Authentication error"}` while
  `/user/tokens/verify` and `/accounts` succeed = token is valid + on the right
  account but MISSING the Workers R2 Storage permission. Fix = recreate token with that perm.
Account id: `d2680f7c5ff39f8d9177a51dbf7fec75`.

**Static-hosting caveat (important):**
The current Nafsam source has NO static/R2 branching anymore — `src/lib/r2.ts`
and `src/lib/auth.ts` hardcode `/api/private/*` and `/api/auth/*`. So the bundle
uploaded to `star` only fully works if `/api/*` is routed to the API server in
front of the bucket. (The older `VITE_STATIC_MODE` 3-place branching described in
`nafsam-static-mode.md` is not present in current code.)
