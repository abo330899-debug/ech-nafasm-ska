import fs from "node:fs";

const base = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL;
const key = process.env.AI_INTEGRATIONS_OPENAI_API_KEY;
if (!base || !key) throw new Error("missing AI integration env vars");

const CONTENT = "artifacts/api-server/private/content.json";
const section = process.argv[2];
if (!["videos", "journey", "captions"].includes(section)) {
  throw new Error("usage: node translate-content.mjs <videos|journey|captions>");
}
const OUT = `/tmp/nafsam_i18n_${section}.json`;
const BATCH = 12;
const CONCURRENCY = 5;

const SYS =
  "You are a literary translator for an intimate, romantic personal memory archive. " +
  "Translate faithfully into Arabic (ar), Turkish (tr), Persian/Farsi (fa), and English (en). " +
  "Preserve the poetic, tender, emotional tone and meaning. Keep it natural in each language. " +
  "Return ONLY valid JSON with no markdown fences and no commentary.";

async function callModel(userContent, tries = 6) {
  for (let attempt = 1; attempt <= tries; attempt++) {
    try {
      const res = await fetch(base + "/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + key,
        },
        body: JSON.stringify({
          model: "gpt-5-mini",
          max_completion_tokens: 8192,
          messages: [
            { role: "system", content: SYS },
            { role: "user", content: userContent },
          ],
        }),
      });
      if (res.status === 429 || res.status >= 500) {
        throw new Error("retryable status " + res.status);
      }
      const j = await res.json();
      let txt = j.choices?.[0]?.message?.content ?? "";
      txt = txt.trim();
      if (txt.startsWith("```")) {
        txt = txt.replace(/^```[a-zA-Z]*\n?/, "").replace(/```$/, "").trim();
      }
      const start = txt.indexOf("[");
      const end = txt.lastIndexOf("]");
      if (start === -1 || end === -1) throw new Error("no JSON array: " + txt.slice(0, 200));
      return JSON.parse(txt.slice(start, end + 1));
    } catch (e) {
      if (attempt === tries) throw e;
      await new Promise((r) => setTimeout(r, 1000 * attempt * attempt));
    }
  }
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

const data = JSON.parse(fs.readFileSync(CONTENT, "utf8"));
let done = {};
if (fs.existsSync(OUT)) done = JSON.parse(fs.readFileSync(OUT, "utf8"));

// Build tasks: { key, payload, prompt }
let tasks = [];
if (section === "videos") {
  const vids = data.videos;
  vids.forEach((v, i) => {
    if (done[i]) return;
    tasks.push({ key: i, caption: v.caption ?? "", quote: v.quote ?? "" });
  });
} else if (section === "journey") {
  const j = data.journey;
  j.forEach((c, i) => {
    if (done[i]) return;
    tasks.push({ key: i, title: c.title ?? "", quote: c.quote ?? "" });
  });
} else if (section === "captions") {
  const ar = data.captions.ar;
  ar.forEach((c, i) => {
    if (c == null) return; // keep null aligned
    if (done[i]) return;
    tasks.push({ key: i, title: c.title ?? "", text: c.text ?? "" });
  });
}

console.log(`section=${section} remaining tasks=${tasks.length} (already done=${Object.keys(done).length})`);

function buildPrompt(batch) {
  if (section === "videos") {
    return (
      "Translate each item's caption and quote into all 4 languages. " +
      'Return a JSON array; each element: {"i":<i>,"caption":{"ar":"","tr":"","fa":"","en":""},"quote":{"ar":"","tr":"","fa":"","en":""}}. ' +
      "If a quote is empty, return empty strings for it.\nItems:\n" +
      JSON.stringify(batch.map((b) => ({ i: b.key, caption: b.caption, quote: b.quote })))
    );
  }
  if (section === "journey") {
    return (
      "Translate each chapter's title and quote into all 4 languages. " +
      'Return a JSON array; each element: {"i":<i>,"title":{"ar":"","tr":"","fa":"","en":""},"quote":{"ar":"","tr":"","fa":"","en":""}}.\nItems:\n' +
      JSON.stringify(batch.map((b) => ({ i: b.key, title: b.title, quote: b.quote })))
    );
  }
  // captions: source is Arabic; produce fa + en title/text
  return (
    "Each item is an Arabic photo caption with a title and text. Translate into Persian/Farsi (fa) and English (en). " +
    'Return a JSON array; each element: {"i":<i>,"fa":{"title":"","text":""},"en":{"title":"","text":""}}.\nItems:\n' +
    JSON.stringify(batch.map((b) => ({ i: b.key, title: b.title, text: b.text })))
  );
}

const batches = chunk(tasks, BATCH);
let bi = 0;
async function worker() {
  while (bi < batches.length) {
    const myIndex = bi++;
    const batch = batches[myIndex];
    const arr = await callModel(buildPrompt(batch));
    const byI = new Map(arr.map((x) => [x.i, x]));
    for (const b of batch) {
      const r = byI.get(b.key);
      if (!r) {
        throw new Error(`missing result for key ${b.key} in batch ${myIndex}`);
      }
      done[b.key] = r;
    }
    fs.writeFileSync(OUT, JSON.stringify(done));
    console.log(`batch ${myIndex + 1}/${batches.length} ok (total done=${Object.keys(done).length})`);
  }
}

await Promise.all(Array.from({ length: CONCURRENCY }, () => worker()));
console.log(`SECTION ${section} COMPLETE. total=${Object.keys(done).length}`);
