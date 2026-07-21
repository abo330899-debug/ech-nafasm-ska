---
name: Publish fails at "Copying development database"
description: Frozen production database silently kills the publish build at the DB-copy step; how to detect and fix.
---

Publish builds that die right after the log line `Copying development database to production database` (~2 min in, no error text) usually mean the **production database is frozen/paused**.

**How to detect:** `executeSql({sqlQuery: "SELECT 1", environment: "production"})` returns `PRODUCTION_DATABASE_ERROR: The production database for repl … is frozen. Unfreeze it first.` Dev DB may look fine at the same time.

**Fix (user action, not code):** Database pane → dropdown **Development** → click "Unpause database" if shown → switch dropdown to **Production** → "Unpause database" again. If the button is missing, a conflicting manually-set `DATABASE_URL` secret can hide it — compare Secrets pane vs Database pane connection string.

**Also seen alongside:** `checkDatabase()` reporting `provisioned:false` while dev `executeSql` works — `createDatabase()` repairs that registration state, but it does NOT unfreeze prod.

**Why:** the publish pipeline copies the dev DB into prod; a paused prod endpoint makes that step fail with no useful log output, and retries fail identically until unfrozen.
