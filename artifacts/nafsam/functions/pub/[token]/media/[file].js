/*
  Byte-range (HTTP 206) support for /pub/<token>/media/<file>.

  Cloudflare Pages static asset serving answers Range requests with a full
  200 response. iOS/macOS Safari refuses to play <video>/<audio> from
  servers without byte-range support, so this Pages Function slices the
  static asset stream and synthesizes proper 206 responses.

  Deployed via direct upload: copy this `functions/` dir next to the wrangler
  cwd (e.g. /tmp/functions) before `wrangler pages deploy` (see replit.md).
  All other /pub/* paths (posters, images, content.json) stay pure static.
*/

import sizes from "./sizes.json";

async function pump(body, start, end, writable) {
  const reader = body.getReader();
  const writer = writable.getWriter();
  let pos = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const chunkStart = pos;
      const chunkEnd = pos + value.byteLength;
      pos = chunkEnd;
      if (chunkEnd <= start) continue;
      if (chunkStart > end) break;
      const s = Math.max(start - chunkStart, 0);
      const e = Math.min(end + 1 - chunkStart, value.byteLength);
      await writer.write(value.subarray(s, e));
      if (chunkEnd > end) break;
    }
    await writer.close();
  } catch (err) {
    try {
      await writer.abort(err);
    } catch {}
  } finally {
    try {
      await reader.cancel();
    } catch {}
  }
}

function publicHeaders(from) {
  const h = new Headers(from);
  h.set("Accept-Ranges", "bytes");
  h.set("Access-Control-Allow-Origin", "*");
  h.set("Cross-Origin-Resource-Policy", "cross-origin");
  if (!h.has("Cache-Control")) h.set("Cache-Control", "public, max-age=86400");
  return h;
}

async function fetchAsset(env, url) {
  return env.ASSETS.fetch(new Request(url, { method: "GET" }));
}

export async function onRequestHead(context) {
  const res = await fetchAsset(context.env, context.request.url);
  if (res.body) {
    try {
      await res.body.cancel();
    } catch {}
  }
  if (!res.ok) return new Response(null, { status: res.status });
  return new Response(null, { status: 200, headers: publicHeaders(res.headers) });
}

function lookupSize(request) {
  try {
    const path = new URL(request.url).pathname;
    const name = decodeURIComponent(path.split("/").pop() || "");
    const n = sizes[name];
    return typeof n === "number" && n > 0 ? n : 0;
  } catch {
    return 0;
  }
}

export async function onRequestGet(context) {
  const { request, env } = context;
  const res = await fetchAsset(env, request.url);
  if (!res.ok) return res;

  const headers = publicHeaders(res.headers);
  const headerSize = Number(res.headers.get("Content-Length") || "0");
  let size = headerSize;
  let sizeSrc = "header";
  if (!size) {
    size = lookupSize(request);
    sizeSrc = size ? "manifest" : "none";
  }
  const rangeHeader = (request.headers.get("Range") || "").trim();
  headers.set("X-Media-Fn", `hit cl=${headerSize} src=${sizeSrc} range=${rangeHeader ? "y" : "n"}`);

  if (!rangeHeader) {
    return new Response(res.body, { status: 200, headers });
  }

  const m = /^bytes=(\d*)-(\d*)$/.exec(rangeHeader);
  if (!m || (m[1] === "" && m[2] === "")) {
    return new Response(res.body, { status: 200, headers });
  }

  if (!size) {
    // Last resort: buffer the asset to learn its size, then slice in memory.
    const buf = await res.arrayBuffer();
    size = buf.byteLength;
    headers.set("X-Media-Fn", `hit cl=${headerSize} src=buffer range=y`);
    let s;
    let e;
    if (m[1] === "") {
      const suffix = Number(m[2]);
      if (suffix === 0) {
        headers.set("Content-Range", `bytes */${size}`);
        return new Response(null, { status: 416, headers });
      }
      s = Math.max(size - suffix, 0);
      e = size - 1;
    } else {
      s = Number(m[1]);
      e = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
    }
    if (!Number.isFinite(s) || !Number.isFinite(e) || s >= size || s > e) {
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    headers.set("Content-Range", `bytes ${s}-${e}/${size}`);
    headers.set("Content-Length", String(e - s + 1));
    return new Response(buf.slice(s, e + 1), { status: 206, headers });
  }

  let start;
  let end;
  if (m[1] === "") {
    const suffix = Number(m[2]);
    if (suffix === 0) {
      if (res.body) {
        try {
          await res.body.cancel();
        } catch {}
      }
      headers.set("Content-Range", `bytes */${size}`);
      return new Response(null, { status: 416, headers });
    }
    start = Math.max(size - suffix, 0);
    end = size - 1;
  } else {
    start = Number(m[1]);
    end = m[2] === "" ? size - 1 : Math.min(Number(m[2]), size - 1);
  }

  if (!Number.isFinite(start) || !Number.isFinite(end) || start >= size || start > end) {
    if (res.body) {
      try {
        await res.body.cancel();
      } catch {}
    }
    headers.set("Content-Range", `bytes */${size}`);
    return new Response(null, { status: 416, headers });
  }

  const { readable, writable } = new TransformStream();
  context.waitUntil(pump(res.body, start, end, writable));
  headers.set("Content-Range", `bytes ${start}-${end}/${size}`);
  headers.set("Content-Length", String(end - start + 1));
  return new Response(readable, { status: 206, headers });
}
