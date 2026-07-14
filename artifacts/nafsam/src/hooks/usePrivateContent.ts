import { useEffect, useState } from "react";
import type { Lang } from "@/i18n/translations";
import { STATIC_MODE, R2_BASE } from "@/lib/r2";

export type Localized = string | Partial<Record<Lang, string>>;

export interface VideoItem {
  title: string;
  file: string;
  quote: Localized;
  caption: Localized;
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

export interface JourneyEntry {
  file: string;
  title: Localized;
  quote: Localized;
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
  photo8_text?: string; photo9_text?: string; photo10_text?: string;
  photo11_text?: string; photo12_text?: string; photo13_text?: string;
  photo14_text?: string; photo15_text?: string; photo16_text?: string;
  photo17_text?: string; photo18_text?: string; photo19_text?: string;
  photo20_text?: string; photo21_text?: string; photo22_text?: string;
  photo23_text?: string; photo24_text?: string; photo25_text?: string;
  photo26_text?: string; photo27_text?: string; photo28_text?: string;
  photo29_text?: string;
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

export interface MemoryFragment {
  label: string;
  body: string;
}

export interface FeelingsContent {
  memoryFragments?: MemoryFragment[];
  collapseLines?: string[];
  heroSub?: string;
  storyTitle?: string;
  storyParagraphs?: string[];
  memoriesTitle?: string;
  memoriesSub?: string;
  collapseTitle?: string;
  endingLine?: string;
}

export type PageAudioEntry = string | { file: string; startAt?: number };

export interface PageAudioMap {
  home?: PageAudioEntry;
  moments?: PageAudioEntry;
  photos?: PageAudioEntry;
  writings?: PageAudioEntry;
}

export interface MediaConfig {
  heroImageUrl?: string;
  photosDir?: string;
}

export interface PrivateContent {
  writings?: Partial<Record<Lang, WritingsBundle>>;
  captions?: Partial<Record<Lang, StoryCaption[]>>;
  pages?: Partial<Record<Lang, PrivatePages>>;
  videos?: VideoItem[];
  photos?: string[];
  songs?: SongItem[];
  specialPhotos?: SpecialPhotoItem[];
  journey?: JourneyEntry[];
  momentImages?: string[];
  feelings?: Partial<Record<Lang, FeelingsContent>>;
  pageAudio?: PageAudioMap;
  mediaConfig?: MediaConfig;
}

export function pickLangFeelings(
  data: PrivateContent | null,
  lang: Lang,
): FeelingsContent {
  if (!data?.feelings) return {};
  return data.feelings[lang] ?? data.feelings.tr ?? {};
}

export function pickLocalized(val: Localized | undefined, lang: Lang): string {
  if (val == null) return "";
  if (typeof val === "string") return val;
  return val[lang] ?? val.ar ?? val.tr ?? val.en ?? val.fa ?? "";
}

let cache: PrivateContent | null = null;
let inflight: Promise<PrivateContent | null> | null = null;
let generation = 0;
const subscribers = new Set<(c: PrivateContent | null) => void>();

let unauthorizedHandler: (() => void) | null = null;

/**
 * Register a callback that fires when a private-content fetch returns 401.
 * App.tsx uses this to immediately evict auth state when a server-side
 * revocation or expiry is detected, without waiting for the next poll.
 */
export function setUnauthorizedHandler(cb: () => void): void {
  unauthorizedHandler = cb;
}

async function loadPrivateContent(): Promise<PrivateContent | null> {
  if (cache) return cache;
  if (inflight) return inflight;
  const myGen = generation;

  if (STATIC_MODE) {
    inflight = fetch(`${R2_BASE}/content.json`, { cache: "no-store" })
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

  inflight = fetch("/api/private/content", { credentials: "same-origin", cache: "no-store" })
    .then((r) => {
      if (r.status === 401) {
        // Session is no longer valid server-side; evict immediately so the
        // protected content disappears without waiting for the next poll.
        clearPrivateContentCache();
        unauthorizedHandler?.();
        return null;
      }
      return r.ok ? (r.json() as Promise<PrivateContent>) : null;
    })
    .then((data) => {
      if (myGen !== generation) return null;
      if (data) {
        cache = data;
        subscribers.forEach((cb) => cb(cache));
      }
      return data;
    })
    .catch((err) => {
      console.error("[usePrivateContent] api load failed:", err);
      return null;
    })
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

/**
 * Probe /api/private/content with a no-store request, bypassing the module
 * cache, to detect server-side session revocation while the tab is open.
 *
 * Called by App.tsx on the same 60-second interval used for session polling so
 * that a 401 triggers immediate local eviction rather than waiting for the
 * session poll to catch the revocation separately.
 *
 * On success the cache is refreshed; on 401 unauthorizedHandler fires and the
 * cache is cleared.  Network errors are silently ignored.
 */
export async function revalidatePrivateContent(): Promise<void> {
  if (STATIC_MODE) return;
  try {
    const r = await fetch("/api/private/content", {
      credentials: "same-origin",
      cache: "no-store",
    });
    if (r.status === 401) {
      clearPrivateContentCache();
      unauthorizedHandler?.();
      return;
    }
    if (r.ok) {
      const data = (await r.json()) as PrivateContent;
      cache = data;
      subscribers.forEach((cb) => cb(cache));
    }
  } catch {
    // Network errors do not evict; the session poll will handle auth loss.
  }
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
