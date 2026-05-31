import { Router, type IRouter, type Request } from "express";
import { issueSession, clearSession, isAuthed } from "../lib/session";

const router: IRouter = Router();

const DEFAULT_OPEN_AT = "2026-05-29T17:00:00";

/**
 * Accepted login answers come exclusively from the NAFSAM_PASSWORDS env var
 * (comma-separated). There are no built-in fallback answers — if the env var
 * is absent in production the server will reject every login attempt with a
 * 500 so the misconfiguration is immediately visible.
 */
function getPasswords(): string[] {
  const raw = process.env.NAFSAM_PASSWORDS ?? "";
  const envList = raw
    ? Array.from(
        new Set(
          raw
            .split(",")
            .map((s) => s.trim().toLowerCase())
            .filter(Boolean),
        ),
      )
    : [];
  if (process.env.NODE_ENV === "production" && envList.length === 0) {
    throw new Error("NAFSAM_PASSWORDS env var must be set in production");
  }
  return envList;
}

function getOpenAt(): number {
  const raw = process.env.NAFSAM_OPEN_AT || DEFAULT_OPEN_AT;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : new Date(DEFAULT_OPEN_AT).getTime();
}

/**
 * Returns the set of origins that are permitted to submit login requests.
 * Mirrors the allow-list used by the CORS middleware in app.ts.
 */
function getAllowedOrigins(): Set<string> {
  const allowed = new Set<string>();
  const domains = process.env.REPLIT_DOMAINS ?? "";
  for (const d of domains.split(",")) {
    const t = d.trim();
    if (t) allowed.add(`https://${t}`);
  }
  const devDomain = process.env.REPLIT_DEV_DOMAIN ?? "";
  if (devDomain) allowed.add(`https://${devDomain}`);
  if (process.env.NODE_ENV !== "production") {
    allowed.add("http://localhost");
    allowed.add("http://127.0.0.1");
  }
  return allowed;
}

/**
 * Returns true when the request origin is acceptable for the login endpoint.
 * Requests with no Origin header (e.g. server-to-server, curl) are allowed
 * only in non-production environments; in production an Origin is required so
 * that bare HTML form posts from unknown sites are rejected.
 */
function originAllowed(req: Request): boolean {
  const origin = req.headers["origin"];
  if (!origin) {
    return process.env.NODE_ENV !== "production";
  }
  const allowed = getAllowedOrigins();
  if (allowed.has(origin)) return true;
  if (process.env.NODE_ENV !== "production") {
    return (
      origin.startsWith("http://localhost") ||
      origin.startsWith("http://127.0.0.1")
    );
  }
  return false;
}

const recentAttempts = new Map<string, { count: number; firstAt: number }>();
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

/**
 * Returns true when the given IP string falls within a private or loopback
 * range and therefore represents a trusted internal proxy hop rather than a
 * real end-user address.
 */
function isPrivateIP(ip: string): boolean {
  // Strip IPv6-mapped IPv4 prefix (::ffff:1.2.3.4 → 1.2.3.4)
  const addr = ip.replace(/^::ffff:/i, "").trim();
  if (addr === "::1" || addr === "localhost") return true;
  // IPv6 ULA (fc00::/7)
  if (/^f[cd]/i.test(addr) && addr.includes(":")) return true;
  // IPv4 private / loopback ranges
  if (/^127\./.test(addr)) return true;
  if (/^10\./.test(addr)) return true;
  if (/^192\.168\./.test(addr)) return true;
  if (/^172\.(1[6-9]|2\d|3[01])\./.test(addr)) return true;
  return false;
}

/**
 * Extracts the best available client IP from the request.
 *
 * In the Replit production topology, requests traverse a variable number of
 * platform-managed proxy hops before reaching Node, so "trust proxy: 1" is
 * unsafe — it resolves req.ip to an internal intermediary and collapses many
 * unrelated viewers into one rate-limit bucket.
 *
 * We instead parse X-Forwarded-For ourselves and walk from right to left,
 * skipping private/internal addresses (added by trusted platform proxies) and
 * returning the first public address we encounter. That address is the actual
 * end-user IP: a client can only inject entries at the leftmost position, so
 * taking the rightmost public address is forgery-resistant regardless of how
 * many hops are in the chain.
 *
 * Falls back to the raw socket address when no public address is found in the
 * header (e.g. in development where there are no proxy hops).
 */
function getClientIP(req: Request): string {
  const xff = req.headers["x-forwarded-for"];
  if (xff) {
    const parts = (Array.isArray(xff) ? xff.join(",") : xff)
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    // Walk right-to-left; skip private hops (trusted infrastructure).
    for (let i = parts.length - 1; i >= 0; i--) {
      if (!isPrivateIP(parts[i])) return parts[i];
    }
  }
  return (req.socket.remoteAddress || "unknown").toString();
}

function rateLimited(ip: string): boolean {
  const now = Date.now();
  const rec = recentAttempts.get(ip);
  if (!rec || now - rec.firstAt > ATTEMPT_WINDOW_MS) {
    recentAttempts.set(ip, { count: 1, firstAt: now });
    return false;
  }
  rec.count += 1;
  return rec.count > MAX_ATTEMPTS;
}

interface CardHints {
  tr: string;
  fa: string;
  ar: string;
  en: string;
}

interface PublicSessionCard {
  hints: CardHints;
}

/**
 * Public riddle hint cards. Only display copy is stored here.
 * The actual accepted answer tokens live exclusively in the
 * NAFSAM_PASSWORDS env var so they can never be served to a client.
 */
function getPublicCards(): PublicSessionCard[] {
  return [
    {
      hints: {
        tr: "Sana hep seslendiği şey",
        fa: "چیزی که همیشه با آن صدایم می‌زدی",
        ar: "الشيء يلي دايما كنت تندهني بيه",
        en: "The thing she always used to call you",
      },
    },
    {
      hints: {
        tr: "Bu kelimeyi söyleyişini hep çok güzel bulurdum",
        fa: "همیشه می‌گفتم چقدر گفتن این کلمه از زبانت زیباست",
        ar: "دايما اقول شكد حلو تحكين هل كلمة",
        en: "I always said this word sounded so beautiful from you",
      },
    },
    {
      hints: {
        tr: "Ne yazık ki bu kelime sana yakışıyordu",
        fa: "متأسفانه این کلمه برازنده‌ات بود",
        ar: "صدق هاد الكلمة تستاهليها مع الاسف",
        en: "Sadly, this word suited you",
      },
    },
    {
      hints: {
        tr: "İçimden gelen ve senin sadece söz sandığın kelime",
        fa: "کلمه‌ای که از اعماقم بیرون می‌آمد و تو فکر می‌کردی فقط حرف است",
        ar: "الكلمة يلي دايما يطلع من اعماقي ويلي ماكنتي تصدقينها فكرك مجرد كلام",
        en: "The word that came from my deepest self and you thought was just talk",
      },
    },
    {
      hints: {
        tr: "Kolay çözüm bulunca şaşırıp bana dediğin kelime",
        fa: "وقتی راه‌حل را راحت پیدا می‌کردم، با تعجب این را می‌گفتی",
        ar: "عندما لاقي حلول بسهولة تنصدمين و تقولي هل كلمة",
        en: "When I found solutions easily, you would be shocked and say this word",
      },
    },
    {
      hints: {
        tr: "Ömür boyu kalmaları gereken şey",
        fa: "چیزی که قرار بود تا آخر عمر بماند",
        ar: "يلي كان مفروض يظلون طول العمر",
        en: "What was supposed to remain forever",
      },
    },
  ];
}

router.get("/auth/session", async (req, res) => {
  const openAt = getOpenAt();
  const isOpen = Date.now() >= openAt;
  const cards = getPublicCards();
  const response: {
    authed: boolean;
    openAt: number;
    isOpen: boolean;
    cards?: PublicSessionCard[];
    cardCount?: number;
  } = {
    authed: await isAuthed(req),
    openAt,
    isOpen,
  };
  if (isOpen) {
    response.cards = cards;
  } else {
    response.cardCount = cards.length;
  }
  res.json(response);
});

router.post("/auth/login", (req, res) => {
  // Reject requests that do not carry a JSON body. HTML form submissions always
  // use application/x-www-form-urlencoded; requiring JSON ensures a browser
  // cannot trigger this endpoint via a plain <form> post. A cross-origin
  // JavaScript fetch with JSON triggers a CORS preflight that is blocked by
  // the CORS middleware, so only same-origin (or explicitly allowed) JS can
  // reach this handler with the correct content type.
  const contentType = req.headers["content-type"] ?? "";
  if (!contentType.includes("application/json")) {
    res.status(415).json({ error: "unsupported_media_type" });
    return;
  }

  // Validate the Origin header against the same allow-list used by CORS.
  // This provides a defense-in-depth server-side check against cross-origin
  // form posts (which browsers send with an Origin header but are not subject
  // to the CORS read-restriction the middleware enforces).
  if (!originAllowed(req)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }

  const ip = getClientIP(req);
  if (rateLimited(ip)) {
    res.status(429).json({ error: "rate_limited" });
    return;
  }
  if (Date.now() < getOpenAt()) {
    res.status(403).json({ error: "closed" });
    return;
  }
  const body = (req.body ?? {}) as { answer?: unknown };
  const answer = typeof body.answer === "string" ? body.answer.trim().toLowerCase() : "";
  if (!answer) {
    res.status(400).json({ error: "answer_required" });
    return;
  }
  let allowed: string[];
  try {
    allowed = getPasswords();
  } catch {
    res.status(500).json({ error: "server_misconfigured" });
    return;
  }
  if (allowed.length === 0 || !allowed.includes(answer)) {
    res.status(401).json({ error: "wrong_answer" });
    return;
  }
  issueSession(res);
  res.json({ ok: true });
});

router.post("/auth/logout", async (req, res) => {
  try {
    await clearSession(req, res);
    res.json({ ok: true });
  } catch {
    res.status(503).json({ error: "logout_failed" });
  }
});

export default router;
