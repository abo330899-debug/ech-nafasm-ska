import { mediaUrl, posterUrl, imageUrl, imageThumbUrl } from "@/lib/r2";

export function privateMedia(file: string): string {
  return mediaUrl(file);
}

export function privatePoster(file: string): string {
  return posterUrl(file);
}

export function privateImage(rel: string): string {
  return imageUrl(rel);
}

export function privateImageThumb(rel: string): string {
  return imageThumbUrl(rel);
}
