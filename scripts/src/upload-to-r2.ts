import { readFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Upload local media files to Cloudflare R2 using Cloudflare API Token.
 *
 * Required env var:
 *   CLOUDFLARE_API_TOKEN  - Cloudflare API token (from Replit secrets)
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run upload-to-r2
 */

const ACCOUNT_ID = "d2680f7c5ff39f8d9177a51dbf7fec75";
const BUCKET = "media";
const R2_PUBLIC_BASE = "https://pub-79afa43f557e4c6291aeea28eb12043e.r2.dev";

const PROJECT_ROOT = process.cwd().includes("scripts") ? join(process.cwd(), "..") : join(process.cwd());
const PRIVATE_ROOT = join(PROJECT_ROOT, "artifacts", "api-server", "private");
const MEDIA_DIR = join(PRIVATE_ROOT, "media");
const IMAGES_DIR = join(PRIVATE_ROOT, "images", "all_photos");

const CF_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";

interface UploadResult {
  key: string;
  url: string;
  size: number;
  success: boolean;
  error?: string;
}

async function uploadToR2(localPath: string, key: string): Promise<UploadResult> {
  const body = readFileSync(localPath);
  const size = body.length;

  const url = `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/r2/buckets/${BUCKET}/objects/${encodeURIComponent(key)}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${CF_TOKEN}`,
        "Content-Type": "application/octet-stream",
      },
      body,
    });

    const data = await res.json();

    if (res.ok && data.success) {
      return {
        key,
        url: `${R2_PUBLIC_BASE}/${key}`,
        size,
        success: true,
      };
    }
    const error = data.errors?.[0]?.message || `HTTP ${res.status}`;
    return { key, url: "", size, success: false, error };
  } catch (err) {
    return { key, url: "", size, success: false, error: String(err) };
  }
}

async function uploadDirectory(localDir: string, prefix: string) {
  const files: { localPath: string; key: string }[] = [];

  function walk(dir: string, keyPrefix: string) {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = join(dir, entry.name);
      const key = `${keyPrefix}/${entry.name}`;
      if (entry.isDirectory()) {
        walk(fullPath, key);
      } else {
        files.push({ localPath: fullPath, key });
      }
    }
  }

  walk(localDir, prefix);

  console.log(`Found ${files.length} files in ${localDir} -> ${prefix}/`);

  let uploaded = 0;
  let failed = 0;
  let totalBytes = 0;

  for (let i = 0; i < files.length; i++) {
    const { localPath, key } = files[i];
    const stat = statSync(localPath);
    const mb = (stat.size / 1024 / 1024).toFixed(1);
    process.stdout.write(`[${i + 1}/${files.length}] ${mb}MB ${key} ... `);

    const result = await uploadToR2(localPath, key);
    if (result.success) {
      uploaded++;
      totalBytes += result.size;
      console.log(`OK`);
    } else {
      failed++;
      console.log(`FAIL ${result.error}`);
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total`);
  return { uploaded, failed, totalBytes };
}

async function main() {
  if (!CF_TOKEN) {
    console.error("Error: CLOUDFLARE_API_TOKEN env var is required.");
    console.error("It should be available as a Replit secret.");
    process.exit(1);
  }

  console.log("=== Uploading to Cloudflare R2 ===\n");

  // 1. Upload media (videos)
  console.log("--- Media (videos) ---");
  const mediaResult = await uploadDirectory(MEDIA_DIR, "media");

  // 2. Upload images
  console.log("\n--- Images (all_photos) ---");
  const imagesResult = await uploadDirectory(IMAGES_DIR, "images/all_photos");

  console.log("\n=== Summary ===");
  console.log(`Media: ${mediaResult.uploaded} uploaded, ${mediaResult.failed} failed`);
  console.log(`Images: ${imagesResult.uploaded} uploaded, ${imagesResult.failed} failed`);
  console.log(`\nPublic URLs: ${R2_PUBLIC_BASE}/media/<file> and ${R2_PUBLIC_BASE}/images/all_photos/<file>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
