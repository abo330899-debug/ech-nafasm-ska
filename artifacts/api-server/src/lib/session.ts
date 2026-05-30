import crypto from "crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { pool } from "@workspace/db";

const COOKIE_NAME = "nafsam_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

const DB_AVAILABLE = pool !== null;

/* In-memory fallback revocation store (used when no DATABASE_URL is set).
   Entries are cleared on restart — acceptable trade-off for no-DB mode. */
const memRevoked = new Map<string, number>(); // jti → expiresAt

function pruneMemRevoked() {
  const now = Date.now();
  for (const [jti, exp] of memRevoked) {
    if (exp <= now) memRevoked.delete(jti);
  }
}
setInterval(pruneMemRevoked, 60 * 60 * 1000).unref();

function getSecret(): string {
  const s = process.env.NAFSAM_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  throw new Error("NAFSAM_SESSION_SECRET env var must be set (>= 16 chars)");
}

function getPasswordVersion(): string {
  const raw = process.env.NAFSAM_PASSWORDS ?? "";
  return crypto.createHash("sha256").update(raw).digest("base64url").slice(0, 16);
}

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${h}`;
}

let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!DB_AVAILABLE) return Promise.resolve();
  if (!tableReady) {
    tableReady = pool!
      .query(
        `CREATE TABLE IF NOT EXISTS revoked_sessions (
          jti        TEXT    PRIMARY KEY,
          expires_at BIGINT  NOT NULL
        )`,
      )
      .then(() => undefined)
      .catch((err: unknown) => {
        tableReady = null;
        throw err;
      });
  }
  return tableReady;
}

if (DB_AVAILABLE) {
  setInterval(async () => {
    try {
      await ensureTable();
      await pool!.query("DELETE FROM revoked_sessions WHERE expires_at <= $1", [Date.now()]);
    } catch {
      /* ignore periodic cleanup errors */
    }
  }, 60 * 60 * 1000).unref();
}

interface ParsedToken {
  jti: string;
  expiresAt: number;
}

function parseToken(token: string | undefined): ParsedToken | null {
  if (!token) return null;
  const dotIndex = token.lastIndexOf(".");
  if (dotIndex === -1) return null;
  const payload = token.slice(0, dotIndex);
  const sig = token.slice(dotIndex + 1);
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  const parts = payload.split(":");
  if (parts.length !== 3) return null;
  const [expiresAtStr, embeddedVersion, jti] = parts;
  if (embeddedVersion !== getPasswordVersion()) return null;
  const expiresAt = Number(expiresAtStr);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  return { jti, expiresAt };
}

async function verify(token: string | undefined): Promise<{ valid: boolean } & Partial<ParsedToken>> {
  const parsed = parseToken(token);
  if (!parsed) return { valid: false };
  const { jti, expiresAt } = parsed;

  if (!DB_AVAILABLE) {
    /* No database — use in-memory revocation store */
    if (memRevoked.has(jti)) return { valid: false };
    return { valid: true, jti, expiresAt };
  }

  try {
    await ensureTable();
    const result = await pool!.query<{ jti: string }>(
      "SELECT jti FROM revoked_sessions WHERE jti = $1 AND expires_at > $2",
      [jti, Date.now()],
    );
    if (result.rows.length > 0) return { valid: false };
  } catch {
    return { valid: false };
  }
  return { valid: true, jti, expiresAt };
}

export function issueSession(res: Response): void {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const jti = crypto.randomBytes(16).toString("base64url");
  const payload = `${String(expiresAt)}:${getPasswordVersion()}:${jti}`;
  const token = sign(payload);
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export async function clearSession(req: Request, res: Response): Promise<void> {
  res.clearCookie(COOKIE_NAME, { path: "/" });

  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[COOKIE_NAME];
  if (!token) return;

  const parsed = parseToken(token);
  if (!parsed) return;

  if (!DB_AVAILABLE) {
    memRevoked.set(parsed.jti, parsed.expiresAt);
    return;
  }

  await ensureTable();
  await pool!.query(
    "INSERT INTO revoked_sessions (jti, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING",
    [parsed.jti, parsed.expiresAt],
  );
}

export async function isAuthed(req: Request): Promise<boolean> {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[COOKIE_NAME];
  return (await verify(token)).valid;
}

export const requireAuth: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(await isAuthed(req))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
};

function getAdminToken(): string | undefined {
  return process.env.NAFSAM_ADMIN_TOKEN;
}

export const requireAdmin: RequestHandler = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  if (!(await isAuthed(req))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  const adminToken = getAdminToken();
  if (!adminToken) {
    res.status(403).json({ error: "admin_not_configured" });
    return;
  }
  const provided = (req.headers["x-admin-token"] as string | undefined) ?? "";
  const expected = adminToken;
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    res.status(403).json({ error: "forbidden" });
    return;
  }
  next();
};
