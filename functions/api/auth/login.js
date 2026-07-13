import { allowedTokenHashes, createSessionCookie, json, sha256Hex, STAR_HASH } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  if (!env.SESSION_SECRET || env.SESSION_SECRET.length < 32) {
    return json({ error: "server_not_configured" }, 503);
  }

  const allowed = allowedTokenHashes(env);
  if (allowed.length === 0) return json({ error: "server_not_configured" }, 503);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid_request" }, 400);
  }

  const answer = typeof body?.answer === "string" ? body.answer.trim().toLowerCase() : "";
  if (!answer || answer.length > 128) return json({ error: "invalid_credentials" }, 401);

  const hash = await sha256Hex(answer);
  const valid = allowed.some((candidate) => candidate === hash);
  if (!valid) {
    await new Promise((resolve) => setTimeout(resolve, 350));
    return json({ error: "invalid_credentials" }, 401);
  }

  const identity = hash === (env.STAR_TOKEN_HASH || STAR_HASH).trim().toLowerCase() ? "star" : "ilham";
  const cookie = await createSessionCookie(env, identity);
  return json({ ok: true, identity }, 200, { "Set-Cookie": cookie });
}

export function onRequest() {
  return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
}
