import { Router, type IRouter } from "express";
import path from "path";
import fs from "fs";
import { requireAuth } from "../lib/session";

const router: IRouter = Router();

const PRIVATE_ROOT = (() => {
  const candidates = [
    path.resolve(process.cwd(), "private"),
    path.resolve(process.cwd(), "artifacts/api-server/private"),
  ];
  try {
    candidates.push(path.resolve(__dirname, "..", "private"));
  } catch {
    /* __dirname may be undefined in some contexts */
  }
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return candidates[0];
})();

function sendPrivate(
  res: import("express").Response,
  dir: string,
  rel: string,
): void {
  if (!rel) {
    res.status(400).json({ error: "no_file" });
    return;
  }
  const safeRel = rel.replace(/\\/g, "/").replace(/\.\.+/g, "");
  const target = path.resolve(PRIVATE_ROOT, dir, safeRel);
  const base = path.resolve(PRIVATE_ROOT, dir) + path.sep;
  if (!target.startsWith(base)) {
    res.status(400).json({ error: "bad_path" });
    return;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  res.sendFile(target, {
    headers: { "Cache-Control": "no-store" },
  });
}

router.get("/private/media/:file", requireAuth, (req, res) => {
  const f = req.params.file;
  sendPrivate(res, "media", typeof f === "string" ? f : "");
});
router.get("/private/posters/:file", requireAuth, (req, res) => {
  const f = req.params.file;
  sendPrivate(res, "posters", typeof f === "string" ? f : "");
});
router.get(/^\/private\/images\/(.+)$/, requireAuth, (req, res) => {
  const rel = (req.params as unknown as string[])[0] ?? "";
  sendPrivate(res, "images", rel);
});

let contentCache: unknown | null = null;
function loadContent(): unknown {
  if (contentCache) return contentCache;
  const file = path.resolve(PRIVATE_ROOT, "content.json");
  if (!fs.existsSync(file)) return { writings: {}, captions: {}, farewell: {} };
  try {
    contentCache = JSON.parse(fs.readFileSync(file, "utf-8"));
    return contentCache;
  } catch {
    return { writings: {}, captions: {}, farewell: {} };
  }
}

router.get("/private/content", requireAuth, (_req, res) => {
  res.json(loadContent());
});

export default router;
