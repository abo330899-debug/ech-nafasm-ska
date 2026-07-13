const encoder = new TextEncoder();
const COOKIE_NAME = "nafsam_session";
const MAX_AGE = 60 * 60 * 24 * 7;

function bytesToBase64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64UrlToBytes(value) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

async function hmac(secret, value) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(value)));
}

export async function sha256(value) {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return bytesToBase64Url(new Uint8Array(digest));
}

export async function sha256Hex(value) {
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
  return Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function createSessionCookie(env, identity) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    throw new Error("SESSION_SECRET must contain at least 32 characters");
  }
  const payload = bytesToBase64Url(
    encoder.encode(JSON.stringify({ identity, exp: Math.floor(Date.now() / 1000) + MAX_AGE })),
  );
  const signature = bytesToBase64Url(await hmac(env.SESSION_SECRET, payload));
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`;
}

export function clearSessionCookie() {
  return `${COOKIE_NAME}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`;
}

function readCookie(request, name) {
  const raw = request.headers.get("Cookie") || "";
  for (const item of raw.split(";")) {
    const [key, ...rest] = item.trim().split("=");
    if (key === name) return rest.join("=");
  }
  return null;
}

export async function readSession(request, env) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) return null;
  const token = readCookie(request, COOKIE_NAME);
  if (!token) return null;
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;

  const expected = await hmac(env.SESSION_SECRET, payload);
  const actual = base64UrlToBytes(signature);
  if (expected.length !== actual.length) return null;

  let mismatch = 0;
  for (let i = 0; i < expected.length; i += 1) mismatch |= expected[i] ^ actual[i];
  if (mismatch !== 0) return null;

  try {
    const data = JSON.parse(new TextDecoder().decode(base64UrlToBytes(payload)));
    if ((data.identity !== "star" && data.identity !== "ilham") || data.exp <= Date.now() / 1000) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export function json(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store, private",
      "X-Content-Type-Options": "nosniff",
      ...extraHeaders,
    },
  });
}

export function allowedTokenHashes(env) {
  return String(env.AUTH_TOKENS || "")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
}

export const STAR_HASH = "15d3a52f3a69b6da3b76b5575a48c1d16ad5087dbf1cc4e33d1428f59a0bb7a1";
