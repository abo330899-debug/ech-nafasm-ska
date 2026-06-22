import { existsSync, mkdirSync, readdirSync, statSync } from "fs";
import { dirname, extname, join, relative } from "path";
import sharp from "sharp";

/**
 * Generate small grid thumbnails for the Nafsam archive.
 *
 * Why: grids load full-resolution media and decode them to bitmaps. Even with
 * windowing + off-screen unmounting, decoding large bitmaps while scrolling
 * pushes memory-constrained phones (iOS Safari) over their decoded-bitmap
 * budget and the tab gets evicted/reloaded. A grid card only ever shows a small
 * image, so it never needs the full bitmap — the lightbox/modal keeps full res.
 *
 *   - Photos grid loads full-resolution images (avg ~1.8MP, up to 3.8MP).
 *   - Videos grid loads video posters (mostly 720x1280 ~0.9MP, up to 2MP). A
 *     720x1280 JPEG is a tiny file but still decodes to a ~3.7MB bitmap, so the
 *     poster grid hits the same OOM-reload as the photo grid.
 *
 * This walks each source root, downscales every raster image to fit that root's
 * MAX_EDGE on its long side (never upscales), and writes the result to
 * <root>/_thumbs/<same relative path> keeping the same filename and extension.
 * The api-server private routes serve any nested path under images/ and posters/
 * so _thumbs works in VM mode automatically; upload-thumbs-to-r2.ts mirrors the
 * same trees to R2 for the static (Cloudflare) deployment.
 *
 * Idempotent: skips a thumbnail that is already newer than its source.
 *
 * Usage:
 *   pnpm --filter @workspace/scripts run gen-thumbnails
 */

const QUALITY = 72;
const RASTER = new Set([".webp", ".jpg", ".jpeg", ".png"]);
const THUMBS_DIR = "_thumbs";

const PROJECT_ROOT = process.cwd().includes("scripts")
  ? join(process.cwd(), "..")
  : process.cwd();
const PRIVATE_ROOT = join(
  PROJECT_ROOT,
  "artifacts",
  "api-server",
  "private",
);

interface ThumbTarget {
  name: string;
  sourceRoot: string;
  maxEdge: number;
}

// Photos render in larger cards (800px), video posters in small grid cells
// (600px is plenty and roughly halves the decoded bitmap vs 800px).
const TARGETS: ThumbTarget[] = [
  { name: "images", sourceRoot: join(PRIVATE_ROOT, "images"), maxEdge: 800 },
  { name: "posters", sourceRoot: join(PRIVATE_ROOT, "posters"), maxEdge: 600 },
];

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

async function makeThumb(srcPath: string, outPath: string, maxEdge: number) {
  const ext = extname(outPath).toLowerCase();
  let pipeline = sharp(srcPath).rotate().resize(maxEdge, maxEdge, {
    fit: "inside",
    withoutEnlargement: true,
  });
  if (ext === ".webp") pipeline = pipeline.webp({ quality: QUALITY });
  else if (ext === ".png") pipeline = pipeline.png({ quality: QUALITY });
  else pipeline = pipeline.jpeg({ quality: QUALITY, mozjpeg: true });
  mkdirSync(dirname(outPath), { recursive: true });
  await pipeline.toFile(outPath);
}

async function processTarget(target: ThumbTarget) {
  if (!existsSync(target.sourceRoot)) {
    console.log(`Skipping ${target.name}: ${target.sourceRoot} not found`);
    return;
  }
  const thumbsRoot = join(target.sourceRoot, THUMBS_DIR);
  const files: string[] = [];
  walk(target.sourceRoot, files);
  console.log(
    `\n[${target.name}] ${files.length} source images under ${target.sourceRoot} (max ${target.maxEdge}px)`,
  );

  let made = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    const srcPath = files[i];
    const rel = relative(target.sourceRoot, srcPath);
    const outPath = join(thumbsRoot, rel);

    if (
      existsSync(outPath) &&
      statSync(outPath).mtimeMs >= statSync(srcPath).mtimeMs
    ) {
      skipped++;
      continue;
    }

    process.stdout.write(`[${target.name} ${i + 1}/${files.length}] ${rel} ... `);
    try {
      await makeThumb(srcPath, outPath, target.maxEdge);
      const kb = (statSync(outPath).size / 1024).toFixed(0);
      made++;
      console.log(`OK (${kb}KB)`);
    } catch (err) {
      failed++;
      console.log(`FAIL ${String(err)}`);
    }
  }

  console.log(
    `[${target.name}] Done: ${made} generated, ${skipped} up-to-date, ${failed} failed -> ${thumbsRoot}`,
  );
}

async function main() {
  if (!existsSync(PRIVATE_ROOT)) {
    console.error(`Private directory not found: ${PRIVATE_ROOT}`);
    process.exit(1);
  }
  for (const target of TARGETS) {
    await processTarget(target);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
