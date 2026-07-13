import { json, readSession } from "../../_lib/auth.js";

export async function onRequestPost({ request, env }) {
  const session = await readSession(request, env);
  if (!session) return json({ error: "unauthorized" }, 401);

  const supabaseUrl = env.SUPABASE_URL;
  const anonKey = env.SUPABASE_ANON_KEY;
  const email = session.identity === "star" ? env.CHAT_STAR_EMAIL : env.CHAT_ILHAM_EMAIL;
  const password = session.identity === "star" ? env.CHAT_STAR_PASSWORD : env.CHAT_ILHAM_PASSWORD;

  if (!supabaseUrl || !anonKey || !email || !password) {
    return json({ error: "chat_not_configured" }, 503);
  }

  const response = await fetch(`${supabaseUrl.replace(/\/$/, "")}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      apikey: anonKey,
    },
    body: JSON.stringify({ email, password }),
  });

  if (!response.ok) return json({ error: "chat_auth_failed" }, 502);
  const data = await response.json();
  return json({
    access_token: data.access_token,
    refresh_token: data.refresh_token,
    expires_in: data.expires_in,
    identity: session.identity,
  });
}

export function onRequest() {
  return json({ error: "method_not_allowed" }, 405, { Allow: "POST" });
}
