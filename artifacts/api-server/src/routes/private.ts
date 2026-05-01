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

interface SongItem {
  title: string;
  src: string;
}

interface SpecialPhotoItem {
  file: string;
  featured?: boolean;
}

function getDefaultMomentImages(): string[] {
  return ["photo1.webp", "photo2.webp", "photo3.webp"];
}

function getDefaultSpecialPhotos(): SpecialPhotoItem[] {
  return [
    { file: "photo1.webp" },
    { file: "photo2.webp" },
    { file: "photo3.webp" },
    { file: "photo4.webp" },
    { file: "photo5.webp" },
    { file: "photo6.webp" },
    { file: "photo7.webp", featured: true },
  ];
}

function getDefaultSongs(): SongItem[] {
  return [
    { title: "Be Koja Residi — Dorcci", src: "/api/private/media/song1.mp3" },
    { title: "Ghatle Amd — Dorcci", src: "/api/private/media/song2.mp3" },
    { title: "Moroor - Haamim", src: "/api/private/media/song3.mp3" },
    { title: "I Was Never There - The Weeknd", src: "/api/private/media/song4.mp3" },
    { title: "Hey To — Amir Khoshnegar", src: "/api/private/media/song5.mp3" },
    { title: "Kusura Bakma — Blok3", src: "/api/private/media/song6.mp3" },
    { title: "Bi To", src: "/api/private/media/song7.mp3" },
    { title: "Ghermez — Poobon", src: "/api/private/media/song8.mp3" },
    { title: "Jonoon — Hayedeh & Moein", src: "/api/private/media/song9.mp3" },
    { title: "Shahkar (Remix) — Savash", src: "/api/private/media/song10.mp3" },
    { title: "Tabestoon Kootahe — Zedbazi", src: "/api/private/media/song11.mp3" },
    { title: "Tabestoon Kootahe", src: "/api/private/media/song12.mp3" },
    { title: "Hayedeh (AI)", src: "/api/private/media/song13.mp3" },
    { title: "Ghatle Amd (Guitar, Slowed) — Dorcci", src: "/api/private/media/song14.mp3" },
    { title: "Ghalbam Roo Tekrare", src: "/api/private/media/song15.mp3" },
    { title: "Moteasefane — Majid Razavi", src: "/api/private/media/song16.mp3" },
    { title: "Moohash — Javad Ara", src: "/api/private/media/song17.mp3" },
    { title: "Duset Daram — Nivad", src: "/api/private/media/song18.mp3" },
  ];
}

let contentCache: unknown | null = null;
function loadContent(): unknown {
  if (contentCache) return contentCache;
  const file = path.resolve(PRIVATE_ROOT, "content.json");
  let base: Record<string, unknown> = { writings: {}, captions: {}, farewell: {} };
  if (fs.existsSync(file)) {
    try {
      base = JSON.parse(fs.readFileSync(file, "utf-8")) as Record<string, unknown>;
    } catch {
      /* ignore, use default */
    }
  }
  if (!base.songs) {
    base.songs = getDefaultSongs();
  }
  if (!base.specialPhotos) {
    base.specialPhotos = getDefaultSpecialPhotos();
  }
  if (!base.momentImages) {
    base.momentImages = getDefaultMomentImages();
  }
  contentCache = base;
  return contentCache;
}

router.get("/private/content", requireAuth, (_req, res) => {
  res.setHeader("Cache-Control", "no-store");
  res.json(loadContent());
});

export default router;
