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
  /** Time covered by gaps small enough to imply the tab was visible/active. */
  activeMs: number;
  /** durationMs − activeMs (tab hidden or no heartbeats arriving). */
  idleMs: number;
  events: ActivityEvent[];
  pageViews: number;
  videoOpens: number;
  photoOpens: number;
  /** Ordered page labels visited (deduped consecutive repeats). */
  navPath: string[];
  /** Average gap between consecutive non-heartbeat interactions, or null. */
  avgInteractionMs: number | null;
  /** Device info from the session's open/login meta, if any. */
  client: ClientMeta | null;
}

export interface ClientMeta {
  os?: string;
  browser?: string;
  device?: string;
  screen?: string;
  lang?: string;
  tz?: string;
  pwa?: boolean;
}

export const SESSION_GAP_MS = 2.5 * 60 * 1000;

// Heartbeats fire every 45s while the tab is visible; a gap of more than two
// missed beats (~100s) means the viewer was hidden/idle for that stretch.
export const ACTIVE_GAP_MS = 100 * 1000;

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

      // Active vs idle: sum the small gaps (tab visibly alive); anything
      // longer — or any stretch right after an explicit "leave" — is idle.
      let activeMs = 0;
      const navPath: string[] = [];
      const interactionTimes: number[] = [];
      let client: ClientMeta | null = null;
      for (let i = 0; i < current.length; i += 1) {
        const e = current[i];
        if (i > 0) {
          const gap =
            new Date(e.created_at).getTime() -
            new Date(current[i - 1].created_at).getTime();
          const afterLeave = current[i - 1].kind === "leave";
          if (gap <= ACTIVE_GAP_MS && !afterLeave) activeMs += gap;
        }
        if (e.kind === "page_view") {
          const label = pageLabel(e.label);
          if (navPath[navPath.length - 1] !== label) navPath.push(label);
        }
        if (e.kind !== "heartbeat") {
          interactionTimes.push(new Date(e.created_at).getTime());
        }
        if (!client && (e.kind === "open" || e.kind === "login") && e.meta) {
          const m = e.meta as ClientMeta;
          if (m.os || m.browser || m.device) client = m;
        }
      }
      let avgInteractionMs: number | null = null;
      if (interactionTimes.length >= 2) {
        avgInteractionMs =
          (interactionTimes[interactionTimes.length - 1] -
            interactionTimes[0]) /
          (interactionTimes.length - 1);
      }

      const durationMs = end.getTime() - start.getTime();
      sessions.push({
        identity,
        start,
        end,
        durationMs,
        activeMs,
        idleMs: Math.max(0, durationMs - activeMs),
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
        navPath,
        avgInteractionMs,
        client,
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

export type LiveState = "active" | "idle" | "offline";

/** Finer-grained live status: نشطة (fresh events), خاملة (stale but within
 *  the session window), or offline. */
export function liveState(
  session: Session,
  now: number = Date.now(),
): LiveState {
  const sinceLast = now - session.end.getTime();
  if (sinceLast <= ACTIVE_GAP_MS) return "active";
  if (sinceLast <= SESSION_GAP_MS) return "idle";
  return "offline";
}

export const LIVE_STATE_LABELS: Record<LiveState, string> = {
  active: "نشطة الآن",
  idle: "خاملة",
  offline: "غير متصلة",
};

/** The page currently open in a live session (last page_view label). */
export function currentPage(session: Session): string | null {
  for (let i = session.events.length - 1; i >= 0; i -= 1) {
    if (session.events[i].kind === "page_view") {
      return pageLabel(session.events[i].label);
    }
  }
  return null;
}

// Baghdad is UTC+3 year-round (no DST since 2008), so a fixed shift is both
// correct and far faster than Intl.formatToParts over thousands of events.
const BAGHDAD_OFFSET_MS = 3 * 60 * 60 * 1000;

/** Hour (0-23) and weekday (0=Sun) of a timestamp in Asia/Baghdad. */
export function baghdadHourDay(t: number): { hour: number; day: number } {
  const d = new Date(t + BAGHDAD_OFFSET_MS);
  return { hour: d.getUTCHours(), day: d.getUTCDay() };
}
