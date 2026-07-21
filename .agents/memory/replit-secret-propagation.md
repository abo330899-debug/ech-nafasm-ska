---
name: Replit secret edit propagation lag
description: Edits to existing Replit Secrets take ~2-3 minutes to reach container/workflow env — don't conclude the save failed.
---

# Replit secret edit propagation lag

Rule: after a user edits an existing Replit Secret, the new value can take ~2–3 minutes to appear in fresh shells and restarted workflows. Creation of a brand-new secret seemed faster; edits/recreates lag.

**Why:** During the Nafsam password change, three secret updates all looked "failed" (runtime kept the old value through multiple workflow restarts and fresh shells), leading to repeated re-prompts of the user. The value had actually saved — it simply hadn't propagated yet. After ~2 minutes it appeared and everything worked.

**How to apply:** After a secret update notification, wait 1–3 minutes before verifying. Verify with a non-revealing fingerprint (length + comma count via `${#VAR}` and `tr -cd ','`), or read a workflow process's `/proc/<pid>/environ` the same way. Only re-prompt the user if the fingerprint is still unchanged after several minutes.
