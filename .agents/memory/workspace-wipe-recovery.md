---
name: Workspace wipe recovery (tracked files deleted, artifacts deregistered)
description: How to recover when the working tree loses tracked files, workflows/.replit are wiped, and artifacts are deregistered — without destructive git commands.
---

# Workspace wipe recovery

**Symptom (happened 2026-07-12):** platform event removed all registered artifacts; `.replit` was rewritten to ports-only (all workflows gone); 314 tracked files deleted from the working tree (source, root package.json, pnpm-workspace.yaml); junk "first commit" commits stacked on local main; `origin` remote swapped to a different GitHub repo; dozens of `subrepl-*` remotes appeared. Git history itself stayed intact — HEAD still contained the full project tree. Gitignored dirs (node_modules, private media, .env) survived.

**Recovery recipe (no destructive git needed):**
1. Verify HEAD has the full tree: `git ls-tree`, `git cat-file -e HEAD:package.json`.
2. List deletions: `git status --porcelain | grep '^ D' | cut -c4-` → file list.
3. Restore in bulk: `git archive HEAD | tar -x -f - -T <list>` — read-only git + file writes, allowed.
   MUST exclude protected paths or tar aborts mid-extract: `.replit*`, `replit.nix`, `.gitattributes`, `.gitignore` (root), `.replit-artifact/` tomls.
4. Sub-package `.gitignore` files CAN be written via `git show HEAD:path > path` (only root `.gitattributes`/`.replitignore`/`replit.nix` are blocked).
5. Re-register artifacts: `cp` the TOML content to `.replit-artifact/artifact.toml` (direct creation IS allowed via bash), then call `verifyAndReplaceArtifactToml(temp, real)` for each — this re-registers the artifact AND recreates its workflow. `verifyAndReplaceArtifactToml` fails with ENOENT if the target toml doesn't exist yet, hence the cp first.
6. `pnpm install --prefer-offline`, restart workflows, typecheck.

**Why:** rollback wasn't needed because git objects were intact; file-level restore is faster and keeps checkpoints.
**How to apply:** any time tracked files vanish but `git log` still shows the real history — restore from HEAD, don't rebuild.
