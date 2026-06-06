---
name: Telegram Call Workflow
description: Why the telegram-call separate workflow always fails and the working solution
---

# Telegram Call Workflow Issue

## Problem
The `artifacts/telegram-call: web` workflow always fails with `DIDNT_OPEN_A_PORT` (or starts then immediately shows FAILED). Every server approach tried — Vite dev, Vite preview, Node.js HTTP server — starts correctly (opens port, prints startup message) but gets killed immediately with SIGKILL.

## Root Cause
Replit's workflow manager sends SIGKILL (not SIGTERM) to a stale PID that gets reused by the new process (PID reuse race condition). This is specific to the `artifacts/telegram-call` workflow after repeated restart failures — the workflow state becomes corrupted.

## Working Solution
Serve the built telegram-call static files from the **api-server** instead of a separate workflow:

1. `artifacts/api-server/src/app.ts`: Add static route before production block:
   ```typescript
   const tgDir = path.resolve(__dirname, "../../telegram-call/dist/public");
   app.use("/telegram-call", express.static(tgDir));
   app.get("/telegram-call/*path", (_req, res) => {
     res.sendFile(path.join(tgDir, "index.html"));
   });
   ```

2. `artifacts/api-server/.replit-artifact/artifact.toml`: Add `/telegram-call` to paths array:
   ```toml
   paths = ["/api", "/telegram-call"]
   ```

3. `artifacts/telegram-call/.replit-artifact/artifact.toml`: Change `localPort = 8080` and set `run = "echo 'Served by api-server on port 8080'"` so the workflow finishes immediately without trying to hold a port.

## Why this works
- The Replit proxy routes `/telegram-call` → port 8080 (api-server), which serves the SPA correctly.
- Production: telegram-call artifact uses `serve = "static"` with its own dist/public, no change needed.
- After building (`pnpm --filter @workspace/telegram-call run build`), the dist is available to api-server at the relative path `../../telegram-call/dist/public` from `artifacts/api-server/dist/`.
