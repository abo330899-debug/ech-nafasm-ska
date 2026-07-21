import { useEffect, useMemo, useState } from "react";
import {
  supabase,
  isConfigured,
  READER_EMAIL,
  MONITOR_PASSWORD,
} from "@/lib/supabase";
import { useMonitorData } from "@/lib/useMonitorData";
import {
  reconstructSessions,
  isLive,
  fmtDuration,
  fmtTime,
  fmtDateTime,
  fmtDayHeading,
  dayKey,
  kindLabel,
  pageLabel,
  IDENTITY_LABELS,
  type ActivityEvent,
  type Identity,
  type Session,
} from "@/lib/activity";

type AuthState = "checking" | "error" | "in";

function useAuth() {
  const [state, setState] = useState<AuthState>("checking");

  useEffect(() => {
    if (!supabase) {
      setState("error");
      return;
    }
    let active = true;
    const client = supabase;

    async function ensureSignedIn() {
      const { data } = await client.auth.getSession();
      if (!active) return;
      if (data.session?.user?.email?.toLowerCase() === READER_EMAIL) {
        setState("in");
        return;
      }
      const { error } = await client.auth.signInWithPassword({
        email: READER_EMAIL,
        password: MONITOR_PASSWORD,
      });
      if (!active) return;
      setState(error ? "error" : "in");
    }

    ensureSignedIn();

    const { data: sub } = client.auth.onAuthStateChange((_e, session) => {
      if (session?.user?.email?.toLowerCase() === READER_EMAIL) {
        setState("in");
      }
    });
    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return state;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="text-2xl font-semibold text-foreground tabular-nums">
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}

function LiveBanner({
  sessions,
  now,
}: {
  sessions: Session[];
  now: number;
}) {
  const liveByIdentity = useMemo(() => {
    const map = new Map<Identity, Session>();
    for (const s of sessions) {
      if (isLive(s, now) && !map.has(s.identity)) map.set(s.identity, s);
    }
    return map;
  }, [sessions, now]);

  const ilham = liveByIdentity.get("ilham");

  return (
    <div className="bg-card border border-card-border rounded-xl p-5 flex items-center gap-4">
      <span
        className={`inline-block w-3 h-3 rounded-full ${
          ilham ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40"
        }`}
      />
      <div className="flex-1">
        {ilham ? (
          <>
            <div className="text-foreground font-medium">
              {IDENTITY_LABELS.ilham} متصلة الآن
            </div>
            <div className="text-sm text-muted-foreground mt-0.5">
              منذ {fmtTime(ilham.start)} · {fmtDuration(now - ilham.start.getTime())}
            </div>
          </>
        ) : (
          <div className="text-muted-foreground">
            {IDENTITY_LABELS.ilham} غير متصلة الآن
          </div>
        )}
      </div>
    </div>
  );
}

function EventLine({ e }: { e: ActivityEvent }) {
  const d = new Date(e.created_at);
  let detail = "";
  if (e.kind === "page_view") detail = pageLabel(e.label);
  else if (e.kind === "video_open" || e.kind === "photo_open")
    detail = e.label ?? "";
  return (
    <div className="flex items-baseline gap-3 py-1.5 border-b border-border/50 last:border-0">
      <span className="text-xs text-muted-foreground tabular-nums w-14 shrink-0">
        {fmtTime(d)}
      </span>
      <span className="text-sm text-foreground">
        {kindLabel(e.kind)}
        {detail && <span className="text-muted-foreground"> · {detail}</span>}
      </span>
    </div>
  );
}

function SessionCard({ session, now }: { session: Session; now: number }) {
  const [open, setOpen] = useState(false);
  const live = isLive(session, now);
  return (
    <div className="bg-card border border-card-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((o) => !o)}
        className="w-full text-right p-4 hover-elevate flex items-center gap-3"
      >
        <span
          className={`inline-block w-2.5 h-2.5 rounded-full shrink-0 ${
            live ? "bg-green-400 animate-pulse" : "bg-muted-foreground/40"
          }`}
        />
        <div className="flex-1 min-w-0">
          <div className="text-foreground font-medium">
            {IDENTITY_LABELS[session.identity]}
            {live && <span className="text-green-400 text-sm mr-2">• متصلة</span>}
          </div>
          <div className="text-xs text-muted-foreground mt-0.5">
            {fmtTime(session.start)} — {live ? "الآن" : fmtTime(session.end)} ·{" "}
            {fmtDuration(session.durationMs)}
          </div>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground shrink-0">
          {session.pageViews > 0 && <span>📄 {session.pageViews}</span>}
          {session.photoOpens > 0 && <span>🖼️ {session.photoOpens}</span>}
          {session.videoOpens > 0 && <span>🎬 {session.videoOpens}</span>}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 border-t border-border/50">
          {session.events.map((e) => (
            <EventLine key={e.id} e={e} />
          ))}
        </div>
      )}
    </div>
  );
}

function ContentBreakdown({ events }: { events: ActivityEvent[] }) {
  const { videos, photos, pages } = useMemo(() => {
    const count = (kind: string) => {
      const m = new Map<string, number>();
      for (const e of events) {
        if (e.kind !== kind || !e.label) continue;
        m.set(e.label, (m.get(e.label) ?? 0) + 1);
      }
      return [...m.entries()].sort((a, b) => b[1] - a[1]);
    };
    const pageMap = new Map<string, number>();
    for (const e of events) {
      if (e.kind !== "page_view") continue;
      const p = pageLabel(e.label);
      pageMap.set(p, (pageMap.get(p) ?? 0) + 1);
    }
    return {
      videos: count("video_open"),
      photos: count("photo_open"),
      pages: [...pageMap.entries()].sort((a, b) => b[1] - a[1]),
    };
  }, [events]);

  const Section = ({
    title,
    rows,
  }: {
    title: string;
    rows: [string, number][];
  }) => (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <h3 className="text-foreground font-medium mb-3">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا شيء بعد</p>
      ) : (
        <ul className="space-y-1.5 max-h-72 overflow-auto">
          {rows.map(([name, n]) => (
            <li
              key={name}
              className="flex items-center justify-between gap-3 text-sm"
            >
              <span className="text-foreground truncate">{name}</span>
              <span className="text-muted-foreground tabular-nums shrink-0">
                {n}×
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Section title="الصفحات الأكثر زيارة" rows={pages} />
      <Section title="الصور المفتوحة" rows={photos} />
      <Section title="الفيديوهات المفتوحة" rows={videos} />
    </div>
  );
}

function DailyReport({
  sessions,
  now,
}: {
  sessions: Session[];
  now: number;
}) {
  const days = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of sessions) {
      const k = dayKey(s.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [sessions]);

  if (days.length === 0)
    return <p className="text-muted-foreground">لا يوجد نشاط بعد.</p>;

  return (
    <div className="space-y-5">
      {days.map(([key, daySessions]) => {
        const ilham = daySessions.filter((s) => s.identity === "ilham");
        const totalMs = ilham.reduce((a, s) => a + s.durationMs, 0);
        const pv = ilham.reduce((a, s) => a + s.pageViews, 0);
        const ph = ilham.reduce((a, s) => a + s.photoOpens, 0);
        const vd = ilham.reduce((a, s) => a + s.videoOpens, 0);
        return (
          <div
            key={key}
            className="bg-card border border-card-border rounded-xl p-5"
          >
            <div className="flex items-baseline justify-between gap-3 mb-3 flex-wrap">
              <h3 className="text-foreground font-medium">
                {fmtDayHeading(new Date(key + "T00:00:00"))}
              </h3>
              <span className="text-sm text-muted-foreground">
                {ilham.length} زيارة · {fmtDuration(totalMs)}
              </span>
            </div>
            <div className="flex gap-4 text-sm text-muted-foreground mb-3">
              <span>📄 {pv} صفحة</span>
              <span>🖼️ {ph} صورة</span>
              <span>🎬 {vd} فيديو</span>
            </div>
            <div className="space-y-2">
              {daySessions.map((s, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm border-t border-border/50 pt-2 first:border-0 first:pt-0"
                >
                  <span
                    className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                      isLive(s, now)
                        ? "bg-green-400"
                        : "bg-muted-foreground/40"
                    }`}
                  />
                  <span className="text-foreground">
                    {IDENTITY_LABELS[s.identity]}
                  </span>
                  <span className="text-muted-foreground">
                    {fmtTime(s.start)} — {fmtTime(s.end)}
                  </span>
                  <span className="text-muted-foreground mr-auto">
                    {fmtDuration(s.durationMs)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

type Tab = "live" | "sessions" | "content" | "daily";

function Dashboard() {
  const { events, loading, error, now, refetch } = useMonitorData(true);
  const [tab, setTab] = useState<Tab>("live");

  const ilhamEvents = useMemo(
    () => events.filter((e) => e.identity === "ilham"),
    [events],
  );
  const sessions = useMemo(() => reconstructSessions(events), [events]);
  const ilhamSessions = useMemo(
    () => sessions.filter((s) => s.identity === "ilham"),
    [sessions],
  );

  const recentFeed = useMemo(
    () => events.slice(-40).reverse(),
    [events],
  );

  const totals = useMemo(() => {
    const visits = ilhamSessions.length;
    const totalMs = ilhamSessions.reduce((a, s) => a + s.durationMs, 0);
    const lastSeen = ilhamSessions[0]?.end ?? null;
    return { visits, totalMs, lastSeen };
  }, [ilhamSessions]);

  async function signOut() {
    await supabase?.auth.signOut({ scope: "local" });
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "live", label: "مباشر" },
    { id: "sessions", label: "الجلسات" },
    { id: "content", label: "المحتوى" },
    { id: "daily", label: "يوم بيوم" },
  ];

  return (
    <div className="min-h-screen w-full">
      <header className="sticky top-0 z-10 backdrop-blur bg-background/80 border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center gap-3">
          <span className="text-xl">🛰️</span>
          <h1 className="text-foreground font-semibold flex-1">غرفة المراقبة</h1>
          <button
            onClick={refetch}
            className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover-elevate"
          >
            تحديث
          </button>
          <button
            onClick={signOut}
            className="text-sm text-muted-foreground hover:text-foreground px-2 py-1 rounded-md hover-elevate"
          >
            خروج
          </button>
        </div>
        <div className="max-w-4xl mx-auto px-4 flex gap-1 overflow-auto">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tab === t.id
                  ? "border-primary text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-5 space-y-4">
        {error && (
          <div className="bg-destructive/10 border border-destructive/30 text-destructive rounded-xl p-4 text-sm">
            {error}
          </div>
        )}
        {loading && events.length === 0 && (
          <p className="text-muted-foreground text-center py-10">
            جارٍ تحميل السجل…
          </p>
        )}

        {tab === "live" && (
          <>
            <LiveBanner sessions={sessions} now={now} />
            <div className="grid grid-cols-3 gap-3">
              <StatCard label="عدد الزيارات" value={String(totals.visits)} />
              <StatCard
                label="إجمالي الوقت"
                value={fmtDuration(totals.totalMs)}
              />
              <StatCard
                label="آخر ظهور"
                value={totals.lastSeen ? fmtTime(totals.lastSeen) : "—"}
              />
            </div>
            <div className="bg-card border border-card-border rounded-xl p-4">
              <h3 className="text-foreground font-medium mb-3">
                آخر النشاطات
              </h3>
              {recentFeed.length === 0 ? (
                <p className="text-sm text-muted-foreground">لا شيء بعد</p>
              ) : (
                <div>
                  {recentFeed.map((e) => (
                    <div
                      key={e.id}
                      className="flex items-baseline gap-3 py-1.5 border-b border-border/50 last:border-0"
                    >
                      <span className="text-xs text-muted-foreground tabular-nums w-28 shrink-0">
                        {fmtDateTime(new Date(e.created_at))}
                      </span>
                      <span className="text-sm text-foreground">
                        {IDENTITY_LABELS[e.identity]} · {kindLabel(e.kind)}
                        {e.kind === "page_view" && (
                          <span className="text-muted-foreground">
                            {" "}
                            · {pageLabel(e.label)}
                          </span>
                        )}
                        {(e.kind === "video_open" || e.kind === "photo_open") &&
                          e.label && (
                            <span className="text-muted-foreground">
                              {" "}
                              · {e.label}
                            </span>
                          )}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {tab === "sessions" && (
          <div className="space-y-3">
            {ilhamSessions.length === 0 && !loading ? (
              <p className="text-muted-foreground text-center py-10">
                لا توجد جلسات بعد.
              </p>
            ) : (
              ilhamSessions.map((s, i) => (
                <SessionCard key={i} session={s} now={now} />
              ))
            )}
          </div>
        )}

        {tab === "content" && <ContentBreakdown events={ilhamEvents} />}

        {tab === "daily" && <DailyReport sessions={ilhamSessions} now={now} />}
      </main>
    </div>
  );
}

export default function App() {
  const auth = useAuth();
  if (auth === "checking")
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        …
      </div>
    );
  if (auth === "error")
    return (
      <div className="min-h-screen flex items-center justify-center p-6 text-center text-muted-foreground">
        <div>
          <div className="text-3xl mb-3">🛰️</div>
          <p className="text-foreground font-medium">تعذّر الاتصال بغرفة المراقبة</p>
          {!isConfigured && (
            <p className="text-destructive text-sm mt-2">
              الاتصال بقاعدة البيانات غير مهيأ.
            </p>
          )}
        </div>
      </div>
    );
  return <Dashboard />;
}
