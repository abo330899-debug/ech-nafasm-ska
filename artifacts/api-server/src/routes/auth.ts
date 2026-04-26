import { Router, type IRouter } from "express";
import { issueSession, clearSession, isAuthed } from "../lib/session";

const router: IRouter = Router();

const DEFAULT_OPEN_AT = "2026-04-15T04:04:00";

function getPasswords(): string[] {
  const raw = process.env.NAFSAM_PASSWORDS;
  if (raw && raw.trim()) {
    return raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NAFSAM_PASSWORDS env var is required in production");
  }
  return [];
}

function getOpenAt(): number {
  const raw = process.env.NAFSAM_OPEN_AT || DEFAULT_OPEN_AT;
  const t = new Date(raw).getTime();
  return Number.isFinite(t) ? t : new Date(DEFAULT_OPEN_AT).getTime();
}

const recentAttempts = new Map<string, { count: number; firstAt: number }>();
const ATTEMPT_WINDOW_MS = 60_000;
const MAX_ATTEMPTS = 8;

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

router.get("/auth/session", (req, res) => {
  const openAt = getOpenAt();
  res.json({
    authed: isAuthed(req),
    openAt,
    isOpen: Date.now() >= openAt,
  });
});

router.post("/auth/login", (req, res) => {
  const ip = (req.ip || req.socket.remoteAddress || "unknown").toString();
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
  const allowed = getPasswords();
  if (!allowed.includes(answer)) {
    res.status(401).json({ error: "wrong_answer" });
    return;
  }
  issueSession(res);
  res.json({ ok: true });
});

router.post("/auth/logout", (_req, res) => {
  clearSession(res);
  res.json({ ok: true });
});

export default router;
