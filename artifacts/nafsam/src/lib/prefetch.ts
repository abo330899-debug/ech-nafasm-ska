const prefetched = new Set<string>();

type RIC = (cb: () => void, opts?: { timeout?: number }) => number;

const ric: RIC =
  typeof window !== "undefined" &&
  (window as unknown as { requestIdleCallback?: RIC }).requestIdleCallback
    ? (window as unknown as { requestIdleCallback: RIC }).requestIdleCallback
    : (cb: () => void) => window.setTimeout(cb, 200) as unknown as number;

export function prefetchImage(url?: string | null) {
  if (!url || typeof window === "undefined") return;
  if (prefetched.has(url)) return;
  prefetched.add(url);
  ric(
    () => {
      const img = new Image();
      img.decoding = "async";
      img.src = url;
    },
    { timeout: 1500 },
  );
}

export function prefetchImages(urls: Array<string | null | undefined>) {
  for (const u of urls) prefetchImage(u);
}
