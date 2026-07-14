---
name: Replit publish fails near the 8GB image limit
description: Why Replit VM/autoscale publishes hang ~20min pushing the Repl layer and what to clean before retrying.
---

# Replit publish image-size failures (this repl)

Replit deployment images have an **8GB limit** (VM/autoscale; 1GB static). When
the workspace is near that, the build phase succeeds but the publish hangs on
"Pushing Repl layer..." for ~20 minutes and then fails with **no explicit error
line** in the build logs. Don't chase config errors in that case — check size.

**Why (bit 2026-07-13):** the Repl layer snapshots the workspace. Silent
space hogs here: `.local/share/pnpm` (pnpm store INSIDE the workspace — grew to
2.5G), `.cache/pnpm` (~570M), `.cache/pip`, plus the legitimately large
`artifacts/api-server/private` media (~3.7G). Total hit ~7.7G → push choked.
`.git` (4.8G) is NOT included in the image, so ignore it in this math.

**How to apply:** before any Replit publish (or when one fails after a
build-success + long layer push), run `pnpm store prune` and delete
`.cache/pnpm` / `.cache/pip` / `.cache/typescript`, then re-measure with
`du -sh --exclude=node_modules --exclude=.git ~/workspace` — keep it well
under 8G including node_modules (~0.6G). `pnpm store prune` only drops
unreferenced packages; node_modules is untouched.

Also: a build failing in ~30s right after "Starting Build" with
`.replit is missing the deployment section` means root `.replit` lost its
`[deployment]` block — it needs at least `deploymentTarget = "gce"`; per-artifact
run/build stay in each `artifact.toml`.

`attached_assets/` (~480M) is user-uploaded originals, referenced only by a
stale vite alias, not imported by any build — a further size lever, but ask the
user before deleting.

**Update (2026-07-14):** hit again at 6.6G workspace → image >8GiB (explicit
error line this time). Extra levers found: `.config/npm/node_global` held
global wrangler (198M) + vercel (172M) — safe to delete, npx re-fetches;
`.local/share/pnpm/store` (679M) can be deleted outright — node_modules keeps
hardlinked copies and stays functional, store just double-counts in the image.
`pnpm store prune` removed 0 (all referenced), so full store delete is the move.
Result: 6.6G → 5.4G, builds verified working after.
