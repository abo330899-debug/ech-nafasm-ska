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

interface CardHints {
  tr: string;
  fa: string;
  ar: string;
  en: string;
}

interface SessionCard {
  id: string;
  hints: CardHints;
}

function getCards(): SessionCard[] {
  return [
    {
      id: "Ashkim",
      hints: {
        tr: "Sana hep seslendiği şey",
        fa: "چیزی که همیشه با آن صدایم می‌زدی",
        ar: "الشيء يلي دايما كنت تندهني بيه",
        en: "The thing she always used to call you",
      },
    },
    {
      id: "nafasim",
      hints: {
        tr: "Bu kelimeyi söyleyişini hep çok güzel bulurdum",
        fa: "همیشه می‌گفتم چقدر گفتن این کلمه از زبانت زیباست",
        ar: "دايما اقول شكد حلو تحكين هل كلمة",
        en: "I always said this word sounded so beautiful from you",
      },
    },
    {
      id: "kaar",
      hints: {
        tr: "Ne yazık ki bu kelime sana yakışıyordu",
        fa: "متأسفانه این کلمه برازنده‌ات بود",
        ar: "صدق هاد الكلمة تستاهليها مع الاسف",
        en: "Sadly, this word suited you",
      },
    },
    {
      id: "asgoori",
      hints: {
        tr: "İçimden gelen ve senin sadece söz sandığın kelime",
        fa: "کلمه‌ای که از اعماقم بیرون می‌آمد و تو فکر می‌کردی فقط حرف است",
        ar: "الكلمة يلي دايما يطلع من اعماقي ويلي ماكنتي تصدقينها فكرك مجرد كلام",
        en: "The word that came from my deepest self and you thought was just talk",
      },
    },
    {
      id: "lucifer",
      hints: {
        tr: "Kolay çözüm bulunca şaşırıp bana dediğin kelime",
        fa: "وقتی راه‌حل را راحت پیدا می‌کردم، با تعجب این را می‌گفتی",
        ar: "عندما لاقي حلول بسهولة تنصدمين و تقولي هل كلمة",
        en: "When I found solutions easily, you would be shocked and say this word",
      },
    },
    {
      id: "ECHSKA",
      hints: {
        tr: "Ömür boyu kalmaları gereken şey",
        fa: "چیزی که قرار بود تا آخر عمر بماند",
        ar: "يلي كان مفروض يظلون طول العمر",
        en: "What was supposed to remain forever",
      },
    },
  ];
}

router.get("/auth/session", (req, res) => {
  const openAt = getOpenAt();
  const isOpen = Date.now() >= openAt;
  const response: {
    authed: boolean;
    openAt: number;
    isOpen: boolean;
    cards?: ReturnType<typeof getCards>;
    cardCount?: number;
  } = {
    authed: isAuthed(req),
    openAt,
    isOpen,
  };
  if (isOpen) {
    response.cards = getCards();
  } else {
    response.cardCount = getCards().length;
  }
  res.json(response);
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
