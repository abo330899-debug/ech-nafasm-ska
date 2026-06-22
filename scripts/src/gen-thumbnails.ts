import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, relative } from "path";
import sharp from "sharp";

/**
 * Generate small grid thumbnails for the Nafsam photo archive.
 *
 * Why: the photo grid loads full-resolution .webp images (avg ~1.8MP, up to
 * 3.8MP). Even with windowing + off-screen unmounting, decoding those bitmaps
 * while scrolling pushes memory-constrained phones (iOS Safari) over their
 * decoded-bitmap budget and the tab gets evicted/reloaded. The grid only ever
 * shows a small card, so it never needs the full bitmap — the lightbox keeps
 * full resolution.
 *
 * This walks artifacts/api-server/private/images/, downscales every raster
 * image to fit MAX_EDGE on its long side (never upscales), and writes the
 * result to images/_thumbs/<same relative path> keeping the same filename and
 * extension. The api-server private images route serves any nested path under
 * images/, so _thumbs works in VM mode automatically; upload-thumbs-to-r2.ts
 * mirrors the same tree to R2 for the static (Cloudflare) deployment.
 *
 * Idempotent: skips a thumbnail that is already newer than its source.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run gen-thumbnails
 */

const MAX_EDGE = 800;
const QUALITY = 72;
const RASTER = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const THUMBS_DIR = "_thumbs";

const PROJECT_ROOT = process.cwd().includes("scripts")
  ? join(process.cwd(), "..")
  : process.cwd();
const IMAGES_ROOT = join(
  PROJECT_ROOT,
  "artifacts",
  "api-server",
  "private",
  "images",
);
const THUMBS_ROOT = join(IMAGES_ROOT, THUMBS_DIR);

function walk(dir: string, out: string[]) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (entry.name === THUMBS_DIR) continue; // never recurse into output
      walk(join(dir, entry.name), out);
    } else if (RASTER.has(extname(entry.name).toLowerCase())) {
      out.push(join(dir, entry.name));
    }
  }
}

async function makeThumb(srcPath: string, outPath: string) {
  const ext = extname(outPath).toLowerCase();
  let pipeline = sharp(srcPath).rotate().resize(MAX_EDGE, MAX_EDGE, {
    fit: "inside",
    withoutEnlargement: true,
  });
  if (ext === ".webp") pipeline = pipeline.webp({ quality: QUALITY });
  else if (ext === ".png") pipeline = pipeline.png({ quality: QUALITY });
  else pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  mkdirSync(dirname(outPath), { recursive: true });
  await pipeline.toFile(outPath);
}

async function main() {
  if (!existsSync(IMAGES_ROOT)) {
    console.error(`Images directory not found: ${IMAGES_ROOT}`);
    process.exit(1);
  }

  const files: string[] = [];
  walk(IMAGES_ROOT, files);
  console.log(`Found ${files.length} source images under ${IMAGES_ROOT}`);

  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const srcPath = files[i];
    const rel = relative(IMAGES_ROOT, srcPath);
    const outPath = join(THUMBS_ROOT, rel);

    if (existsSync(outPath) && statSync(outPath).mtimeMs >= statSync(srcPath).mtimeMs) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${i + 1}/${files.length}] ${rel} ... `);
    try {
      await makeThumb(srcPath, outPath);
      const kb = (statSync(outPath).size / 1024).toFixed(0);
      made++;
      console.log(`OK (${kb}KB)`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${String(err)}`);
    }
  }

  console.log(
    `\nDone: ${made} generated, ${skipped} up-to-date, ${failed} failed -> ${THUMBS_ROOT}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
