---
name: Nafsam photos↔captions pairing
description: How the Photos album pairs images with captions, and why perfect auto-matching is impossible
---

# Nafsam Photos album pairing

The Photos album pairs `data.photos[i]` (filename) with `data.captions[<lang>][i]` (`{title,text}`) **by index**, in `content.json`. `specialPhotos` / featured images are a SEPARATE array and are not part of this index pairing.

The captions are an **authored chronological love-story** (read top→bottom). To fix a photo/caption mismatch, reorder `data.photos` (keep the captions in narrative order) — do NOT reorder captions, or the story breaks. Photos 1–10 and 112–135 were already correctly paired; only 11–111 had been alphabetized out of order.

**Why perfect matching is impossible:** the album photo pool contains near-duplicate shots (multiple sea/boat, snow, sand-writing, ring, couple-lying frames) and several photos that depict no specific caption line (perfume, snake+parrot, circus, nurse costume, Snapchat grid). Strong visual anchors (ring, bandaged/IV hand, sand writing, SIM+roses, marriage certificate, scuba, restaurant food, birthday balloons, video calls) can be matched confidently; the abstract remainder is best-effort and needs the owner's eyes to perfect.

**How to apply:** the live site reads `content.json` from R2, so a local edit only changes the Replit preview — going live needs the separate R2 upload + GitHub push. The app also has an admin reorder UI (`/api/reorder`, `X-Admin-Token`) the owner can use to fine-tune.
