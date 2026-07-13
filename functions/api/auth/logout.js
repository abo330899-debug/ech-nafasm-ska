import { clearSessionCookie, json } from "../../_lib/auth.js";

export function onRequestPost() {
  return json({ ok: true }, 200, { "Set-Cookie": clearSessionCookie() });
}

export function onRequest() {
  return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
}
