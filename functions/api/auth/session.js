import { json, readSession } from "../../_lib/auth.js";

export async function onRequestGet({ request, env }) {
  const session = await readSession(request, env);
  const openAt = new Date(env.OPEN_AT || "2026-05-29T17:00:00Z").getTime();
  const isOpen = Date.now() >= openAt;
  if (!session) return json({ authed: false, openAt, isOpen }, 401);
  return json({ authed: true, identity: session.identity, openAt, isOpen });
}

export function onRequest() {
  return json({ error: "method_not_allowed" }, 405, { Allow: "GET" });
}
