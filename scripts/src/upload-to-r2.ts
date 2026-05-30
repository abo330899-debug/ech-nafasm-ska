import { createHash, createHmac } from "crypto";
import { readFileSync, readdirSync, statSync } from "fs";
import { join, relative } from "path";

/**
 * Upload local media files to Cloudflare R2 using S3-compatible API.
 *
 * Required env vars:
 *   R2_ACCESS_KEY_ID     - S3 API access key from Cloudflare R2 dashboard
 *   R2_SECRET_ACCESS_KEY - S3 API secret key from Cloudflare R2 dashboard
 *
 * Usage:
 *   R2_ACCESS_KEY_ID=xxx R2_SECRET_ACCESS_KEY=yyy npx tsx scripts/src/upload-to-r2.ts
 */

const ACCOUNT_ID = "d2680f7c5ff39f8d9177a51dbf7fec75";
const BUCKET = "media";
const ENDPOINT = `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`;
const R2_PUBLIC_BASE = "https://pub-79afa43f557e4c6291aeea28eb12043e.r2.dev";

const PRIVATE_ROOT = "artifacts/api-server/private";
const MEDIA_DIR = join(PRIVATE_ROOT, "media");
const IMAGES_DIR = join(PRIVATE_ROOT, "images", "all_photos");

const accessKey = process.env.R2_ACCESS_KEY_ID || "";
const secretKey = process.env.R2_SECRET_ACCESS_KEY || "";

function sha256(data: string | Buffer): string {
  return createHash("sha256").update(data).digest("hex");
}

function hmacSha256(key: string | Buffer, data: string | Buffer): Buffer {
  return createHmac("sha256", key).update(data).digest();
}

function getSignatureKey(secret: string, date: string, region: string, service: string): Buffer {
  const kDate = hmacSha256("AWS4" + secret, date);
  const kRegion = hmacSha256(kDate, region);
  const kService = hmacSha256(kRegion, service);
  return hmacSha256(kService, "aws4_request");
}

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
  const now = new Date();
  const dateStamp = now.toISOString().slice(0, 10).replace(/-/g, "");
  const timeStamp = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
  const region = "auto";
  const service = "s3";

  const hashedPayload = sha256(body);

  const headers: Record<string, string> = {
    "host": `${ACCOUNT_ID}.r2.cloudflarestorage.com`,
    "x-amz-content-sha256": hashedPayload,
    "x-amz-date": timeStamp,
    "content-type": "application/octet-stream",
  };

  const signedHeaders = Object.keys(headers).sort().join(";");

  const canonicalRequest = [
    "PUT",
    `/${BUCKET}/${encodeURIComponent(key).replace(/%2F/g, "/")}`,
    "",
    Object.entries(headers)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v.trim()}`)
      .join("\n") + "\n",
    signedHeaders,
    hashedPayload,
  ].join("\n");

  const credential = `${accessKey}/${dateStamp}/${region}/${service}/aws4_request`;
  const stringToSign = [
    "AWS4-HMAC-SHA256",
    timeStamp,
    `${dateStamp}/${region}/${service}/aws4_request`,
    sha256(canonicalRequest),
  ].join("\n");

  const signingKey = getSignatureKey(secretKey, dateStamp, region, service);
  const signature = hmacSha256(signingKey, stringToSign).toString("hex");

  const authHeader = `AWS4-HMAC-SHA256 Credential=${credential},SignedHeaders=${signedHeaders},Signature=${signature}`;

  const url = `${ENDPOINT}/${BUCKET}/${encodeURIComponent(key).replace(/%2F/g, "/")}`;

  try {
    const res = await fetch(url, {
      method: "PUT",
      headers: { ...headers, authorization: authHeader },
      body,
    });

    if (res.ok) {
      return {
        key,
        url: `${R2_PUBLIC_BASE}/${key}`,
        size,
        success: true,
      };
    }
    const text = await res.text();
    return { key, url: "", size, success: false, error: `HTTP ${res.status}: ${text.slice(0, 200)}` };
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
      console.log(`OK ${result.url}`);
    } else {
      failed++;
      console.log(`FAIL ${result.error}`);
    }
  }

  console.log(`\nDone: ${uploaded} uploaded, ${failed} failed, ${(totalBytes / 1024 / 1024).toFixed(1)} MB total`);
  return { uploaded, failed, totalBytes };
}

async function main() {
  if (!accessKey || !secretKey) {
    console.error("Error: R2_ACCESS_KEY_ID and R2_SECRET_ACCESS_KEY env vars are required.");
    console.error("Create them in Cloudflare Dashboard -> R2 -> Manage R2 API Tokens -> Create S3 API Token.");
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
  console.log(`\nPublic URLs will be: ${R2_PUBLIC_BASE}/media/<file> and ${R2_PUBLIC_BASE}/images/all_photos/<file>`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
