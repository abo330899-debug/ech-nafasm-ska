import fs from "node:fs";

const CONTENT = "artifacts/api-server/private/content.json";
const data = JSON.parse(fs.readFileSync(CONTENT, "utf8"));
const load = (s) => JSON.parse(fs.readFileSync(`/tmp/nafsam_i18n_${s}.json`, "utf8"));
const vids = load("videos");
const jour = load("journey");
const caps = load("captions");

const LANGS = ["ar", "tr", "fa", "en"];
const errors = [];
const has4 = (o, ctx) => {
  if (!o || typeof o !== "object") return errors.push(`${ctx}: not object`);
  for (const l of LANGS)
    if (typeof o[l] !== "string" || o[l].trim() === "")
      errors.push(`${ctx}: missing/empty ${l}`);
};

// --- videos ---
data.videos.forEach((v, i) => {
  const r = vids[i];
  if (!r) return errors.push(`video ${i}: no translation`);
  has4(r.caption, `video ${i} caption`);
  // quote may be empty only if source empty
  const srcQuote = (v.quote ?? "").trim();
  if (srcQuote) has4(r.quote, `video ${i} quote`);
  v.caption = r.caption;
  v.quote = srcQuote ? r.quote : { ar: "", tr: "", fa: "", en: "" };
});

// --- journey ---
data.journey.forEach((c, i) => {
  const r = jour[i];
  if (!r) return errors.push(`journey ${i}: no translation`);
  has4(r.title, `journey ${i} title`);
  has4(r.quote, `journey ${i} quote`);
  c.title = r.title;
  c.quote = r.quote;
});

// --- captions: keep ar/tr, add fa/en aligned to ar length, nulls aligned ---
const ar = data.captions.ar;
const fa = [];
const en = [];
ar.forEach((c, i) => {
  if (c == null) {
    fa.push(null);
    en.push(null);
    return;
  }
  const r = caps[i];
  if (!r) {
    errors.push(`caption ${i}: no translation`);
    fa.push(null);
    en.push(null);
    return;
  }
  for (const lng of ["fa", "en"]) {
    if (!r[lng] || typeof r[lng].title !== "string" || typeof r[lng].text !== "string")
      errors.push(`caption ${i}: bad ${lng}`);
  }
  fa.push({ title: r.fa.title, text: r.fa.text });
  en.push({ title: r.en.title, text: r.en.text });
});
data.captions.fa = fa;
data.captions.en = en;

// --- structural parity checks ---
for (const l of LANGS) {
  if (data.captions[l].length !== ar.length)
    errors.push(`captions ${l} length ${data.captions[l].length} != ${ar.length}`);
}
const nullsAr = ar.map((x) => x == null);
for (const l of ["tr", "fa", "en"]) {
  data.captions[l].forEach((x, i) => {
    if ((x == null) !== nullsAr[i]) errors.push(`captions ${l} null mismatch at ${i}`);
  });
}

if (errors.length) {
  console.error("VALIDATION ERRORS (" + errors.length + "):");
  console.error(errors.slice(0, 40).join("\n"));
  process.exit(1);
}

fs.writeFileSync(CONTENT, JSON.stringify(data));
console.log("MERGE OK");
console.log("captions langs:", Object.keys(data.captions), "len", data.captions.ar.length);
console.log("videos:", data.videos.length, "| sample caption:", JSON.stringify(data.videos[0].caption));
console.log("journey:", data.journey.length, "| sample title:", JSON.stringify(data.journey[0].title));
