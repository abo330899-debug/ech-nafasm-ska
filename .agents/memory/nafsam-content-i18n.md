---
name: Nafsam content i18n (videos/journey/captions)
description: Which content.json sections are 4-language, how Videos/Journey resolve language, and the bulk-translation workflow.
---

# Nafsam content translation

All lang-keyed content.json sections now carry all 4 langs (ar/tr/fa/en):
writings, pages, feelings, captions, plus per-item `videos[].caption/quote` and
`journey[].title/quote` which are now `{ar,tr,fa,en}` objects (not strings).

- `pickLocalized(val, lang)` in `usePrivateContent.ts` resolves `string | Partial<Record<Lang,string>>`
  with fallback chain lang→ar→tr→en→fa. Videos.tsx and Journey.tsx render through it, so legacy
  string values still work. Any future video/journey content edit must stay a 4-lang object.
- captions arrays are index-aligned across all langs; null entries must stay null in every lang.
- Songs titles are proper names — do NOT translate.

**Why:** user wants every page readable in the selected language; content lives on R2 (not git),
so a structure change here ships via R2 PUT, while the Videos/Journey/type code ships via GitHub.

## Bulk translation workflow (reusable)
Translate content via the Replit OpenAI AI integration (no template/DB setup needed — just
`setupReplitAIIntegrations` then POST `${AI_INTEGRATIONS_OPENAI_BASE_URL}/chat/completions`).
- **Run the script in the FOREGROUND of a bash call.** Background (`nohup ... &`) processes are
  killed when the bash tool returns, so they never checkpoint. Make the script resumable
  (checkpoint to /tmp after each batch) and re-invoke until it prints COMPLETE.
- **Use `gpt-5-mini`, not `gpt-5.4`, for batch translation.** gpt-5.4 reasoning is ~too slow
  (didn't finish a batch in 120s); gpt-5-mini ≈25-30s per 12-item 4-lang batch, quality fine.
- Scripts kept at `scripts/src/translate-content.mjs` + `merge-translations.mjs` for re-runs.
