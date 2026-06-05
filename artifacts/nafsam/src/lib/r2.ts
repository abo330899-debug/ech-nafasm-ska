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
