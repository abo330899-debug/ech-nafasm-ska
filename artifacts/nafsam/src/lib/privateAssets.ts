export function privateMedia(file: string): string {
  return `/api/private/media/${encodeURIComponent(file)}`;
}

export function privatePoster(file: string): string {
  const base = file.replace(/\.[^/.]+$/, "");
  return `/api/private/posters/${encodeURIComponent(base)}.jpg`;
}

export function privateImage(rel: string): string {
  return `/api/private/images/${rel.split("/").map(encodeURIComponent).join("/")}`;
}
