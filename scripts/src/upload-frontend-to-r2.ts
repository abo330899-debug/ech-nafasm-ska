import { readFileSync, readdirSync, existsSync } from "fs";
import { join, relative, sep, extname } from "path";

/**
 * Upload the built Nafsam frontend (HTML/CSS/JS, icons, manifest) to the
 * Cloudflare R2 bucket "star" for static hosting.
 *
 * IMPORTANT: This uploads frontend build artifacts ONLY. Private media
 * (photos/videos/audio) is intentionally excluded and never touches R2 here.
 *
 * Required env var:
 *   CLOUDFLARE_API_TOKEN  - Cloudflare API token with R2 edit permissions
 *                           (from Replit secret storage; never pasted in code)
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run upload-frontend-to-r2
 *   pnpm --filter @workspace/scripts run upload-frontend-to-r2 -- --dry-run
 */

const ACCOUNT_ID = "d2680f7c5ff39f8d9177a51dbf7fec75";
const BUCKET = "star";

const PROJECT_ROOT = process.cwd().includes("scripts")
  ? join(process.cwd(), "..")
  : process.cwd();
const DIST_DIR = join(PROJECT_ROOT, "artifacts", "nafsam", "dist", "public");

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const DRY_RUN = process.argv.includes("--dry-run");

// Directories (relative to dist root) whose contents must never be uploaded.
const EXCLUDED_DIRS = new Set(["media"]);
// File extensions treated as private/large media and skipped.
const EXCLUDED_EXTS = new Set([
  ".mp3",
  ".mp4",
  ".mov",
  ".webm",
  ".wav",
  ".m4a",
  ".ogg",
  ".avi",
  ".mkv",
]);

const CONTENT_TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json",
  ".map": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
  ".ico": "image/x-icon",
  ".txt": "text/plain; charset=utf-8",
  ".woff": "font/woff",
  ".woff2": "font/woff2",
  ".ttf": "font/ttf",
  ".xml": "application/xml; charset=utf-8",
};

function contentTypeFor(key: string): string {
  const ext = extname(key).toLowerCase();
  if (CONTENT_TYPES[ext]) return CONTENT_TYPES[ext];
  // manifest.json is application/json (already covered); special-case service worker
  if (key.endsWith("_redirects")) return "text/plain; charset=utf-8";
  return "application/octet-stream";
}

interface FileEntry {
  localPath: string;
  key: string;
}

function collectFiles(dir: string): FileEntry[] {
  const out: FileEntry[] = [];
  function walk(current: string) {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name);
      const rel = relative(DIST_DIR, full).split(sep).join("/");
      const topDir = rel.split("/")[0];
      if (entry.isDirectory()) {
        if (EXCLUDED_DIRS.has(entry.name)) continue;
        walk(full);
      } else {
        if (EXCLUDED_DIRS.has(topDir)) continue;
        if (EXCLUDED_EXTS.has(extname(entry.name).toLowerCase())) continue;
        out.push({ localPath: full, key: rel });
      }
    }
  }
  walk(dir);
  return out;
}

async function putObject(localPath: string, key: string) {
  const body = readFileSync(localPath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${key
    .split("/")
    .map(encodeURIComponent)
    .join("/")}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${CF_TOKEN}`,
      "Content-Type": contentTypeFor(key),
    },
    body,
  });
  const data = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    errors?: Array<{ message: string }>;
  };
  if (res.ok && data.success) return { ok: true as const, size: body.length };
  return {
    ok: false as const,
    size: body.length,
    error: data.errors?.[0]?.message || `HTTP ${res.status}`,
  };
}

async function main() {
  if (!existsSync(DIST_DIR)) {
    console.error(`Error: build output not found at ${DIST_DIR}`);
    console.error("Build the static frontend first (CF_PAGES=1 vite build).");
    process.exit(1);
  }

  const files = collectFiles(DIST_DIR);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Source: ${DIST_DIR}`);
  console.log(`Files to upload: ${files.length} (media excluded)\n`);
  files.forEach((f) => console.log(`  ${f.key}  [${contentTypeFor(f.key)}]`));

  if (DRY_RUN) {
    console.log("\n--dry-run: nothing uploaded.");
    return;
  }

  if (!CF_TOKEN) {
    console.error("\nError: CLOUDFLARE_API_TOKEN env var is required.");
    process.exit(1);
  }

  console.log("\n=== Uploading ===");
  let uploaded = 0;
  let failed = 0;
  for (let i = 0; i < files.length; i++) {
    const { localPath, key } = files[i];
    process.stdout.write(`[${i + 1}/${files.length}] ${key} ... `);
    const r = await putObject(localPath, key);
    if (r.ok) {
      uploaded++;
      console.log("OK");
    } else {
      failed++;
      console.log(`FAIL ${r.error}`);
    }
  }
  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed.`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
