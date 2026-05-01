/* Nafsam Service Worker — instant navigation cache
   Strategies:
   - Cache-first  : hashed build assets (/assets/*), favicon, fonts files
   - Stale-while-revalidate : Google Fonts CSS, opengraph image
   - Network-only : /api/* (private/auth/session) — never cache
   - Network-first w/ fallback to cached shell : HTML navigation
*/
const VERSION = "v1";
const STATIC_CACHE = `nafsam-static-${VERSION}`;
const RUNTIME_CACHE = `nafsam-runtime-${VERSION}`;
const FONT_CACHE = `nafsam-fonts-${VERSION}`;

const PRECACHE_URLS = [
  "favicon.svg",
  "manifest.json",
  "apple-touch-icon.png",
  "icon-192.png",
  "icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) =>
        Promise.all(
          PRECACHE_URLS.map((u) =>
            cache.add(new Request(u, { cache: "reload" })).catch(() => {}),
          ),
        ),
      )
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => ![STATIC_CACHE, RUNTIME_CACHE, FONT_CACHE].includes(k))
          .map((k) => caches.delete(k)),
      );
      await self.clients.claim();
    })(),
  );
});

function isHashedAsset(url) {
  return /\/assets\/[^/]+-[A-Za-z0-9_-]{6,}\.(?:js|css|woff2?|ttf|svg|png|webp)$/.test(
    url.pathname,
  );
}

function isFavicon(url) {
  return url.pathname.endsWith("/favicon.svg");
}

function isGoogleFontsCss(url) {
  return url.host === "fonts.googleapis.com";
}

function isGoogleFontsFile(url) {
  return url.host === "fonts.gstatic.com";
}

function isApi(url) {
  return url.pathname.startsWith("/api/");
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then((res) => {
      if (res && res.status === 200) cache.put(request, res.clone()).catch(() => {});
      return res;
    })
    .catch(() => null);
  return cached || (await network) || Response.error();
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  try {
    const res = await fetch(request);
    if (res && res.status === 200) cache.put(request, res.clone()).catch(() => {});
    return res;
  } catch {
    return Response.error();
  }
}

async function networkFirstNavigation(request) {
  try {
    const res = await fetch(request);
    return res;
  } catch {
    const cache = await caches.open(STATIC_CACHE);
    const cached = await cache.match(request);
    if (cached) return cached;
    return new Response("Offline", { status: 503, statusText: "Offline" });
  }
}

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  let url;
  try { url = new URL(req.url); } catch { return; }

  // Bypass private API entirely
  if (isApi(url)) return;

  // Cross-origin: only handle Google Fonts
  if (url.origin !== self.location.origin) {
    if (isGoogleFontsFile(url)) {
      event.respondWith(cacheFirst(req, FONT_CACHE));
      return;
    }
    if (isGoogleFontsCss(url)) {
      event.respondWith(staleWhileRevalidate(req, FONT_CACHE));
      return;
    }
    return;
  }

  // Same-origin: hashed build assets are immutable → cache-first
  if (isHashedAsset(url) || isFavicon(url)) {
    event.respondWith(cacheFirst(req, RUNTIME_CACHE));
    return;
  }

  // HTML navigation: network-first for freshness, fallback to cache
  if (req.mode === "navigate" || (req.headers.get("accept") || "").includes("text/html")) {
    event.respondWith(networkFirstNavigation(req));
    return;
  }
});

self.addEventListener("message", (event) => {
  if (event.data === "SKIP_WAITING") self.skipWaiting();
});
