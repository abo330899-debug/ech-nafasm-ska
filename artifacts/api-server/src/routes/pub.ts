import { Router, type IRouter, type Request, type Response } from "express";
import path from "path";
import fs from "fs";
import crypto from "crypto";
import { PRIVATE_ROOT, loadContent } from "./private";

/**
 * Public, token-gated media routes for the static-hosted sites
 * (Cloudflare Pages / GitHub Pages). They replace the retired public R2
 * bucket and mirror its URL layout exactly, so the static bundles can use
 * VITE_R2_BASE = https://<replit-app-domain>/api/pub/<token>
 *
 *   GET /api/pub/:token/media/<file>
 *   GET /api/pub/:token/posters/<rel>
 *   GET /api/pub/:token/images/<rel>
 *   GET /api/pub/:token/content.json
 *
 * Security posture: identical to the old public r2.dev bucket that the
 * threat model already documents — the base URL (including the token) is
 * baked into the public static bundles, so this is obscurity-gating, not
 * real authentication. The token is a dedicated random value
 * (NAFSAM_STATIC_MEDIA_TOKEN), never derived from login passwords, and can
 * be rotated independently. If the env var is unset the routes fail closed.
 */

const router: IRouter = Router();

function expectedToken(): string {
  return (process.env.NAFSAM_STATIC_MEDIA_TOKEN ?? "").trim();
}

function tokenOk(candidate: string): boolean {
  const expected = expectedToken();
  if (!expected || expected.length < 16) return false;
  const a = Buffer.from(candidate);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

/** CORS for static origins: these routes are public-by-token, so allow any
 *  origin (content.json is fetched with fetch(); media uses plain tags). */
function setPublicHeaders(res: Response): void {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, HEAD, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Range");
  res.setHeader("Access-Control-Expose-Headers", "Content-Length, Content-Range, Accept-Ranges");
}

function sendPublicFile(res: Response, dir: string, rel: string): void {
  if (!rel) {
    res.status(400).json({ error: "no_file" });
    return;
  }
  const safeRel = path.normalize(rel.replace(/\\/g, "/"));
  const base = path.resolve(PRIVATE_ROOT, dir);
  const target = path.resolve(base, safeRel);
  const relToBase = path.relative(base, target);
  if (relToBase.startsWith("..") || relToBase === "" || path.isAbsolute(relToBase)) {
    res.status(400).json({ error: "bad_path" });
    return;
  }
  if (!fs.existsSync(target) || !fs.statSync(target).isFile()) {
    res.status(404).json({ error: "not_found" });
    return;
  }
  setPublicHeaders(res);
  res.sendFile(target, {
    // Media files are immutable in practice; let browsers/CDNs cache them
    // like the old public bucket did.
    headers: { "Cache-Control": "public, max-age=86400" },
    acceptRanges: true,
  });
}

function guard(req: Request, res: Response): boolean {
  const token = typeof req.params.token === "string" ? req.params.token : "";
  if (!tokenOk(token)) {
    res.status(404).json({ error: "not_found" });
    return false;
  }
  return true;
}

router.options(/^\/pub\/(.+)$/, (_req, res) => {
  setPublicHeaders(res);
  res.sendStatus(204);
});

router.get("/pub/:token/content.json", (req, res) => {
  if (!guard(req, res)) return;
  setPublicHeaders(res);
  res.setHeader("Cache-Control", "no-store");
  const selfBase = `${req.protocol}://${req.get("host")}/api/pub/${req.params.token}`;
  res.json(sanitizeContentForStatic(loadContent(), selfBase));
});

router.get("/pub/:token/media/:file", (req, res) => {
  if (!guard(req, res)) return;
  const f = req.params.file;
  sendPublicFile(res, "media", typeof f === "string" ? f : "");
});

router.get(/^\/pub\/([^/]+)\/posters\/(.+)$/, (req, res) => {
  const params = req.params as unknown as string[];
  (req.params as Record<string, string>).token = params[0] ?? "";
  if (!guard(req, res)) return;
  sendPublicFile(res, "posters", params[1] ?? "");
});

router.get(/^\/pub\/([^/]+)\/images\/(.+)$/, (req, res) => {
  const params = req.params as unknown as string[];
  (req.params as Record<string, string>).token = params[0] ?? "";
  if (!guard(req, res)) return;
  sendPublicFile(res, "images", params[1] ?? "");
});

/**
 * Rewrite absolute media URLs inside content.json so the static sites load
 * them from these token routes instead of dead public-bucket or
 * cookie-authenticated paths.
 *
 * heroImageUrl forms handled:
 *   - "https://…r2.dev/images/<rel>"      → `${selfBase}/images/<rel>`
 *   - "/api/private/images/<rel>"          → `${selfBase}/images/<rel>`
 *   - "<rel>" (relative filename)          → `${selfBase}/images/<rel>`
 */
function sanitizeContentForStatic(raw: unknown, selfBase: string): unknown {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return raw;
  const content = { ...(raw as Record<string, unknown>) };
  const mediaConfig = content.mediaConfig;
  if (mediaConfig && typeof mediaConfig === "object" && !Array.isArray(mediaConfig)) {
    const mc = { ...(mediaConfig as Record<string, unknown>) };
    const heroUrl = mc.heroImageUrl;
    if (typeof heroUrl === "string" && heroUrl) {
      let rel: string | null = null;
      const privMatch = heroUrl.match(/^\/api\/private\/images\/(.+)$/);
      if (privMatch) {
        rel = privMatch[1] ?? null;
      } else if (/^https?:\/\//i.test(heroUrl)) {
        try {
          const parsed = new URL(heroUrl);
          const m = parsed.pathname.match(/^\/images\/(.+)$/);
          rel = m ? (m[1] ?? null) : null;
        } catch {
          rel = null;
        }
      } else {
        rel = heroUrl.replace(/^\/+/, "");
      }
      if (rel) {
        mc.heroImageUrl = `${selfBase}/images/${rel}`;
      } else {
        delete mc.heroImageUrl;
      }
    }
    content.mediaConfig = mc;
  }
  // Songs whose src is a server-relative authenticated path cannot work on
  // the static hosts; rewrite them to bare filenames so the client's
  // mediaUrl() routes them through this token base.
  const songs = content.songs;
  if (Array.isArray(songs)) {
    content.songs = songs.map((s) => {
      if (!s || typeof s !== "object" || Array.isArray(s)) return s;
      const song = { ...(s as Record<string, unknown>) };
      const src = song.src;
      if (typeof src === "string") {
        const m = src.match(/^\/api\/private\/media\/(.+)$/);
        if (m) song.src = m[1];
      }
      return song;
    });
  }
  return content;
}

export default router;
