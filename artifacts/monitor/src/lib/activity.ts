// Shared types + helpers for reading and interpreting the archive activity log.

export type Identity = "star" | "ilham";

export interface ActivityEvent {
  id: string;
  identity: Identity;
  kind: string;
  label: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

// A reconstructed visit: a run of events with no gap larger than SESSION_GAP_MS.
export interface Session {
  identity: Identity;
  start: Date;
  end: Date; // last event seen ("last seen")
  durationMs: number;
  events: ActivityEvent[];
  pageViews: number;
  videoOpens: number;
  photoOpens: number;
}

// A gap larger than this between two events starts a new session.
export const SESSION_GAP_MS = 2.5 * 60 * 1000;

export const IDENTITY_LABELS: Record<Identity, string> = {
  ilham: "إلهام",
  star: "أنت",
};

// Human-readable Arabic labels for the raw event kinds.
export function kindLabel(kind: string): string {
  switch (kind) {
    case "login":
      return "تسجيل دخول";
    case "logout":
      return "خروج";
    case "open":
      return "فتحت الأرشيف";
    case "leave":
      return "غادرت";
    case "heartbeat":
      return "نشطة";
    case "page_view":
      return "تصفّحت صفحة";
    case "video_open":
      return "فتحت فيديو";
    case "photo_open":
      return "فتحت صورة";
    default:
      return kind;
  }
}

const PAGE_LABELS: Record<string, string> = {
  "/": "الرئيسية",
  "/home": "الرئيسية",
  "/moments": "اللحظات",
  "/photos": "الصور",
  "/songs": "الأغاني",
  "/videos": "الفيديوهات",
  "/writings": "الكتابات",
};

export function pageLabel(path: string | null): string {
  if (!path) return "—";
  const clean = path.split("?")[0].replace(/\/+$/, "") || "/";
  return PAGE_LABELS[clean] ?? clean;
}

export function fmtDuration(ms: number): string {
  const totalSec = Math.max(0, Math.round(ms / 1000));
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h} س ${m} د`;
  if (m > 0) return `${m} د ${s} ث`;
  return `${s} ث`;
}

export function dayKey(d: Date): string {
  // Local-day bucket YYYY-MM-DD.
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const AR_WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];
const AR_MONTHS = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

export function fmtDayHeading(d: Date): string {
  return `${AR_WEEKDAYS[d.getDay()]} ${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function fmtTime(d: Date): string {
  return d.toLocaleTimeString("ar", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateTime(d: Date): string {
  return `${d.toLocaleDateString("ar")} ${fmtTime(d)}`;
}

// Group a flat, ascending-by-time event list into sessions per identity.
export function reconstructSessions(events: ActivityEvent[]): Session[] {
  const byIdentity: Record<Identity, ActivityEvent[]> = { star: [], ilham: [] };
  for (const e of events) {
    if (e.identity === "star" || e.identity === "ilham") {
      byIdentity[e.identity].push(e);
    }
  }

  const sessions: Session[] = [];
  (Object.keys(byIdentity) as Identity[]).forEach((identity) => {
    const list = byIdentity[identity]
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime(),
      );

    let current: ActivityEvent[] = [];
    const flush = () => {
      if (current.length === 0) return;
      const start = new Date(current[0].created_at);
      const end = new Date(current[current.length - 1].created_at);
      sessions.push({
        identity,
        start,
        end,
        durationMs: end.getTime() - start.getTime(),
        events: current,
        pageViews: current.filter((e) => e.kind === "page_view").length,
        videoOpens: current.filter((e) => e.kind === "video_open").length,
        photoOpens: current.filter((e) => e.kind === "photo_open").length,
      });
      current = [];
    };

    for (let i = 0; i < list.length; i++) {
      if (current.length === 0) {
        current.push(list[i]);
        continue;
      }
      const prev = new Date(current[current.length - 1].created_at).getTime();
      const now = new Date(list[i].created_at).getTime();
      if (now - prev > SESSION_GAP_MS) {
        flush();
      }
      current.push(list[i]);
    }
    flush();
  });

  // Most recent session first.
  return sessions.sort((a, b) => b.start.getTime() - a.start.getTime());
}

export function isLive(session: Session, now: number = Date.now()): boolean {
  return now - session.end.getTime() <= SESSION_GAP_MS;
}
