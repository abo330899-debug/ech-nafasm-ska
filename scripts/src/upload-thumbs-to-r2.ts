import { existsSync, readFileSync, readdirSync, statSync } from "fs";
import { extname, join } from "path";

/**
 * Upload generated grid thumbnails to Cloudflare R2.
 *
 * Mirrors each local _thumbs tree to its matching R2 key prefix so the static
 * (Cloudflare Pages) deployment can serve lightweight grid thumbnails while the
 * lightbox/modal keeps loading the full-resolution asset:
 *   artifacts/api-server/private/images/_thumbs  -> R2 "images/_thumbs"
 *   artifacts/api-server/private/posters/_thumbs -> R2 "posters/_thumbs"
 * Run gen-thumbnails first.
 *
 * Required env var:
 *   CLOUDFLARE_API_TOKEN  - Cloudflare API token (from Replit secrets)
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run gen-thumbnails
 *   pnpm --filter @workspace/scripts run upload-thumbs-to-r2
 */

const ACCOUNT_ID = "d2680f7c5ff39f8d9177a51dbf7fec75";
const BUCKET = "media";
const R2_PUBLIC_BASE = "https://pub-79afa43f557e4c6291aeea28eb12043e.r2.dev";
const CONCURRENCY = 12;

const PROJECT_ROOT = process.cwd().includes("scripts")
  ? join(process.cwd(), "..")
  : process.cwd();
const PRIVATE_ROOT = join(
  PROJECT_ROOT,
  "artifacts",
  "api-server",
  "private",
);

interface UploadTarget {
  localRoot: string;
  keyPrefix: string;
}

const TARGETS: UploadTarget[] = [
  {
    localRoot: join(PRIVATE_ROOT, "images", "_thumbs"),
    keyPrefix: "images/_thumbs",
  },
  {
    localRoot: join(PRIVATE_ROOT, "posters", "_thumbs"),
    keyPrefix: "posters/_thumbs",
  },
];

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";

const CONTENT_TYPES: Record<string, string> = {
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
};

function contentType(file: string): string {
  return CONTENT_TYPES[extname(file).toLowerCase()] || "application/octet-stream";
}

async function uploadToR2(localPath: string, key: string): Promise<boolean> {
  const body = readFileSync(localPath);
  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;
  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${CF_TOKEN}`,
        "Content-Type": contentType(localPath),
      },
      body,
    });
    const data = (await res.json()) as { success?: boolean; errors?: Array<{ message: string }> };
    if (res.ok && data.success) return true;
    console.log(`  FAIL ${data.errors?.[0]?.message || `HTTP ${res.status}`}`);
    return false;
  } catch (err) {
    console.log(`  FAIL ${String(err)}`);
    return false;
  }
}

function walk(dir: string, keyPrefix: string, files: { localPath: string; key: string }[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const fullPath = join(dir, entry.name);
    const key = `${keyPrefix}/${entry.name}`;
    if (entry.isDirectory()) walk(fullPath, key, files);
    else files.push({ localPath: fullPath, key });
  }
}

async function main() {
  if (!CF_TOKEN) {
    console.error("Error: CLOUDFLARE_API_TOKEN env var is required.");
    process.exit(1);
  }

  const files: { localPath: string; key: string }[] = [];
  for (const target of TARGETS) {
    if (!existsSync(target.localRoot)) {
      console.log(`Skipping ${target.keyPrefix}: ${target.localRoot} not found`);
      continue;
    }
    walk(target.localRoot, target.keyPrefix, files);
  }

  if (files.length === 0) {
    console.error(
      `No thumbnails found. Run: pnpm --filter @workspace/scripts run gen-thumbnails`,
    );
    process.exit(1);
  }

  console.log(
    `Uploading ${files.length} thumbnails -> ${R2_PUBLIC_BASE}/ (concurrency ${CONCURRENCY})`,
  );

  let uploaded = 0;
  let failed = 0;
  let totalBytes = 0;
  let next = 0;

  async function worker() {
    while (next < files.length) {
      const i = next++;
      const { localPath, key } = files[i];
      const size = statSync(localPath).size;
      if (await uploadToR2(localPath, key)) {
        uploaded++;
        totalBytes += size;
      } else {
        failed++;
        console.log(`  [${i + 1}/${files.length}] ${key}`);
      }
      if (uploaded % 50 === 0) console.log(`  ...${uploaded} uploaded`);
    }
  }

  await Promise.all(Array.from({ length: CONCURRENCY }, worker));

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
