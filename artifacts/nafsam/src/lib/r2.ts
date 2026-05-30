export function mediaUrl(file: string): string {
  if (/^https?:\/\//i.test(file)) return file;
  return `/api/private/media/${encodeURIComponent(file)}`;
}

export function posterUrl(file: string): string {
  if (/^https?:\/\//i.test(file)) return "";
  const base = file.replace(/\.[^.]+$/, "");
  return `/api/private/posters/${encodeURIComponent(base)}.jpg`;
}

export function imageUrl(rel: string): string {
  const encoded = rel.split("/").map(encodeURIComponent).join("/");
  return `/api/private/images/${encoded}`;
}
