import crypto from "crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";
import { pool } from "@workspace/db";

const COOKIE_NAME = "nafsam_session";
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;

function getSecret(): string {
  const s = process.env.NAFSAM_SESSION_SECRET;
  if (s && s.length >= 16) return s;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NAFSAM_SESSION_SECRET env var is required in production");
  }
  return "dev-only-insecure-session-secret-change-me";
}

function getPasswordVersion(): string {
  const raw = process.env.NAFSAM_PASSWORDS ?? "";
  return crypto.createHash("sha256").update(raw).digest("base64url").slice(0, 16);
}

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${h}`;
}

/**
 * Durable revocation store backed by PostgreSQL.
 *
 * Each logout inserts the token's jti + expiry into `revoked_sessions`.
 * Every verify() call checks the table so revocations survive restarts,
 * redeploys, and multi-instance scale-out.
 *
 * The table is created on first use (CREATE TABLE IF NOT EXISTS) so no
 * separate migration step is required after deploy.
 */
let tableReady: Promise<void> | null = null;

function ensureTable(): Promise<void> {
  if (!tableReady) {
    tableReady = pool
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

setInterval(async () => {
  try {
    await ensureTable();
    await pool.query("DELETE FROM revoked_sessions WHERE expires_at <= $1", [Date.now()]);
  } catch {
    /* ignore periodic cleanup errors */
  }
}, 60 * 60 * 1000).unref();

interface ParsedToken {
  jti: string;
  expiresAt: number;
}

/**
 * Verify the HMAC signature, expiry, and password version of a token
 * without touching the database. Returns the parsed fields on success
 * or null if the token is structurally invalid or expired.
 *
 * This is intentionally DB-free so logout can always obtain the JTI
 * needed for revocation even during database outages.
 */
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
  try {
    await ensureTable();
    const result = await pool.query<{ jti: string }>(
      "SELECT jti FROM revoked_sessions WHERE jti = $1 AND expires_at > $2",
      [jti, Date.now()],
    );
    if (result.rows.length > 0) {
      return { valid: false };
    }
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
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[COOKIE_NAME];
  if (token) {
    const parsed = parseToken(token);
    if (parsed) {
      await ensureTable();
      await pool.query(
        "INSERT INTO revoked_sessions (jti, expires_at) VALUES ($1, $2) ON CONFLICT DO NOTHING",
        [parsed.jti, parsed.expiresAt],
      );
    }
  }
  res.clearCookie(COOKIE_NAME, { path: "/" });
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
