export const STATIC_MODE = import.meta.env.VITE_STATIC_MODE === "true";
export const R2_BASE = (import.meta.env.VITE_R2_BASE ?? "").replace(/\/$/, "");

export function mediaUrl(file: string): string {
  if (/^https?:\/\//i.test(file)) return file;
  if (STATIC_MODE) return `${R2_BASE}/media/${encodeURIComponent(file)}`;
  return `/api/private/media/${encodeURIComponent(file)}`;
}

export function posterUrl(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  const base = file.replace(/\.[^.]+$/, "");
  if (STATIC_MODE) return `${R2_BASE}/posters/${encodeURIComponent(base)}.jpg`;
  return `/api/private/posters/${encodeURIComponent(base)}.jpg`;
}

export function imageUrl(rel: string): string {
  const encoded = rel.split("/").map(encodeURIComponent).join("/");
  if (STATIC_MODE) return `${R2_BASE}/images/${encoded}`;
  return `/api/private/images/${encoded}`;
}

/**
 * URL for a small grid thumbnail of an image. These are pre-generated
 * (max 800px long edge) under images/_thumbs/<rel> by the gen-thumbnails
 * script and uploaded to R2 / served from disk. Grids use this; the lightbox
 * keeps the full-resolution `imageUrl`. Falls back to full-res automatically
 * in the UI (LuxImage `fallbackSrc`) if a thumbnail is missing.
 */
export function imageThumbUrl(rel: string): string {
  return imageUrl(`_thumbs/${rel}`);
}

/**
 * URL for a small grid thumbnail of a video poster. Pre-generated (max 600px
 * long edge) under posters/_thumbs/<base>.jpg by the gen-thumbnails script and
 * uploaded to R2 / served from disk. The video grid uses this; the modal video
 * keeps the full-resolution `posterUrl`. The UI falls back to the full poster
 * automatically if a thumbnail is missing.
 */
export function posterThumbUrl(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  const base = file.replace(/\.[^.]+$/, "");
  if (STATIC_MODE)
    return `${R2_BASE}/posters/_thumbs/${encodeURIComponent(base)}.jpg`;
  return `/api/private/posters/_thumbs/${encodeURIComponent(base)}.jpg`;
}
