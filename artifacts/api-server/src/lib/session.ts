import crypto from "crypto";
import type { Request, Response, NextFunction, RequestHandler } from "express";

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

function sign(payload: string): string {
  const h = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  return `${payload}.${h}`;
}

function verify(token: string | undefined): { valid: boolean; expiresAt?: number } {
  if (!token) return { valid: false };
  const parts = token.split(".");
  if (parts.length !== 2) return { valid: false };
  const [payload, sig] = parts;
  const expected = crypto.createHmac("sha256", getSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return { valid: false };
  }
  const expiresAt = Number(payload);
  if (!Number.isFinite(expiresAt) || expiresAt < Date.now()) {
    return { valid: false };
  }
  return { valid: true, expiresAt };
}

export function issueSession(res: Response): void {
  const expiresAt = Date.now() + SESSION_TTL_MS;
  const token = sign(String(expiresAt));
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_TTL_MS,
    path: "/",
  });
}

export function clearSession(res: Response): void {
  res.clearCookie(COOKIE_NAME, { path: "/" });
}

export function isAuthed(req: Request): boolean {
  const cookies = (req as Request & { cookies?: Record<string, string> }).cookies ?? {};
  const token = cookies[COOKIE_NAME];
  return verify(token).valid;
}

export const requireAuth: RequestHandler = (req: Request, res: Response, next: NextFunction) => {
  if (!isAuthed(req)) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }
  next();
};
