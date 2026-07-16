// Shared types and helpers for reading the activity log.

export type Identity = "star" | "ilham";

export interface ActivityEvent {
  id: string;
  identity: Identity;
  kind: string;
  label: string | null;
  meta: Record<string, unknown> | null;
  created_at: string;
}

export interface Session {
  identity: Identity;
  start: Date;
  end: Date;
  durationMs: number;
  events: ActivityEvent[];
  pageViews: number;
  videoOpens: number;
  photoOpens: number;
}

export const SESSION_GAP_MS = 2.5 * 60 * 1000;

export const IDENTITY_LABELS: Record<Identity, string> = {
  ilham: "إلهام",
  star: "أنت",
};

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
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) return `${hours} س ${minutes} د`;
  if (minutes > 0) return `${minutes} د ${seconds} ث`;

  return `${seconds} ث`;
}

export function dayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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

export function fmtDayHeading(date: Date): string {
  return `${AR_WEEKDAYS[date.getDay()]} ${date.getDate()} ${
    AR_MONTHS[date.getMonth()]
  } ${date.getFullYear()}`;
}

export function fmtTime(date: Date): string {
  return date.toLocaleTimeString("ar-IQ", {
    timeZone: "Asia/Baghdad",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function fmtDateTime(date: Date): string {
  const dateText = date.toLocaleDateString("ar-IQ", {
    timeZone: "Asia/Baghdad",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });

  return `${dateText} ${fmtTime(date)}`;
}

export function reconstructSessions(
  events: ActivityEvent[],
): Session[] {
  const byIdentity: Record<Identity, ActivityEvent[]> = {
    star: [],
    ilham: [],
  };

  for (const event of events) {
    if (event.identity === "star" || event.identity === "ilham") {
      byIdentity[event.identity].push(event);
    }
  }

  const sessions: Session[] = [];

  (Object.keys(byIdentity) as Identity[]).forEach((identity) => {
    const list = byIdentity[identity]
      .slice()
      .sort(
        (a, b) =>
          new Date(a.created_at).getTime() -
          new Date(b.created_at).getTime(),
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
        pageViews: current.filter(
          (event) => event.kind === "page_view",
        ).length,
        videoOpens: current.filter(
          (event) => event.kind === "video_open",
        ).length,
        photoOpens: current.filter(
          (event) => event.kind === "photo_open",
        ).length,
      });

      current = [];
    };

    for (let index = 0; index < list.length; index += 1) {
      const event = list[index];

      if (current.length === 0) {
        current.push(event);
        continue;
      }

      const previousTime = new Date(
        current[current.length - 1].created_at,
      ).getTime();

      const currentTime = new Date(event.created_at).getTime();

      if (currentTime - previousTime > SESSION_GAP_MS) {
        flush();
      }

      current.push(event);
    }

    flush();
  });

  return sessions.sort(
    (a, b) => b.start.getTime() - a.start.getTime(),
  );
}

export function isLive(
  session: Session,
  now: number = Date.now(),
): boolean {
  return now - session.end.getTime() <= SESSION_GAP_MS;
}
