import { useEffect, useState } from "react";
import type { Lang } from "@/i18n/translations";

export interface VideoItem {
  title: string;
  file: string;
  quote: string;
  caption: string;
}

export interface StoryCaption {
  title: string;
  text: string;
}

export interface WritingsBundle {
  w1?: string; w2?: string; w3?: string; w4?: string; w5?: string;
  w6?: string; w7?: string; w8?: string; w9?: string; w10?: string;
  farewell_title?: string;
  farewell_text?: string;
}

export interface MomentEntry {
  time: string;
  title: string;
  text: string;
  memory: string;
}

export interface SongItem {
  title: string;
  src: string;
}

export interface SpecialPhotoItem {
  file: string;
  featured?: boolean;
}

export interface PrivatePages {
  hero_text?: string;
  quote_1?: string; quote_2?: string; quote_3?: string; quote_4?: string;
  card_moments_text?: string;
  card_photos_text?: string;
  card_songs_text?: string;
  card_writings_text?: string;
  footer_text?: string;
  moments_text?: string;
  moments_footer?: string;
  photos_text?: string;
  photos_header_sub?: string;
  photos_footer?: string;
  photo1_text?: string; photo2_text?: string; photo3_text?: string;
  photo4_text?: string; photo5_text?: string; photo6_text?: string;
  photo7_text?: string; photo7_sub?: string;
  songs_footer?: string;
  song1_text?: string; song2_text?: string; song3_text?: string; song4_text?: string;
  videos_text?: string;
  videos_footer?: string;
  video1_text?: string; video2_text?: string;
  writings_text?: string;
  writings_footer?: string;
  moment1_time?: string; moment1_title?: string; moment1_text?: string; moment1_memory?: string;
  moment2_time?: string; moment2_title?: string; moment2_text?: string; moment2_memory?: string;
  moment3_time?: string; moment3_title?: string; moment3_text?: string; moment3_memory?: string;
  moment4_time?: string; moment4_title?: string; moment4_text?: string; moment4_memory?: string;
  moment5_time?: string; moment5_title?: string; moment5_text?: string; moment5_memory?: string;
  moment6_time?: string; moment6_title?: string; moment6_text?: string; moment6_memory?: string;
  moment7_time?: string; moment7_title?: string; moment7_text?: string; moment7_memory?: string;
  moment8_time?: string; moment8_title?: string; moment8_text?: string; moment8_memory?: string;
  moment9_time?: string; moment9_title?: string; moment9_text?: string; moment9_memory?: string;
  farewell_title?: string;
  farewell_p1?: string;
  farewell_p2?: string;
  farewell_p3?: string;
  farewell_p4?: string;
  farewell_silver_anchor?: string;
  farewell_memory_pattern?: string;
  oblivion_name?: string;
  oblivion_hint?: string;
  oblivion_revealed?: string;
}

export interface PrivateContent {
  writings?: Partial<Record<Lang, WritingsBundle>>;
  captions?: Partial<Record<Lang, StoryCaption[]>>;
  pages?: Partial<Record<Lang, PrivatePages>>;
  videos?: VideoItem[];
  photos?: string[];
  songs?: SongItem[];
  specialPhotos?: SpecialPhotoItem[];
  momentImages?: string[];
}

let cache: PrivateContent | null = null;
let inflight: Promise<PrivateContent | null> | null = null;
let generation = 0;
const subscribers = new Set<(c: PrivateContent | null) => void>();

async function loadPrivateContent(): Promise<PrivateContent | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  const myGen = generation;
  inflight = fetch("/api/private/content", { credentials: "same-origin", cache: "no-store" })
    .then((r) => (r.ok ? (r.json() as Promise<PrivateContent>) : null))
    .then((data) => {
      if (myGen !== generation) return null;
      if (data) {
        cache = data;
        subscribers.forEach((cb) => cb(cache));
      }
      return data;
    })
    .catch(() => null)
    .finally(() => {
      inflight = null;
    });
  return inflight;
}

export function clearPrivateContentCache(): void {
  generation += 1;
  cache = null;
  inflight = null;
  subscribers.forEach((cb) => cb(null));
}

export function usePrivateContent(): PrivateContent | null {
  const [data, setData] = useState<PrivateContent | null>(cache);

  useEffect(() => {
    let cancelled = false;
    if (!cache) {
      loadPrivateContent().then((d) => {
        if (!cancelled && d) setData(d);
      });
    }
    const cb = (c: PrivateContent | null) => {
      if (!cancelled) setData(c);
    };
    subscribers.add(cb);
    return () => {
      cancelled = true;
      subscribers.delete(cb);
    };
  }, []);

  return data;
}

export function pickLangPages(
  data: PrivateContent | null,
  lang: Lang,
): PrivatePages {
  if (!data?.pages) return {};
  return data.pages[lang] ?? data.pages.tr ?? {};
}
