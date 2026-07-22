import { useMemo } from "react";
import { Link } from "wouter";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMonitor } from "@/lib/MonitorContext";
import { generateInsights } from "@/lib/intelligence";
import {
  currentPage,
  fmtDuration,
  fmtTime,
  isLive,
  liveState,
  LIVE_STATE_LABELS,
  IDENTITY_LABELS,
} from "@/lib/activity";
import { dailyStats, retention } from "@/lib/analytics";
import {
  EventRow,
  LiveDot,
  Page,
  Panel,
  StatCard,
  StatSkeleton,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";

export default function Overview() {
  const {
    ilhamEvents,
    ilhamSessions,
    sessions,
    scored,
    events,
    todayKey,
    now,
    loading,
    backfilling,
  } = useMonitor();

  const topInsights = useMemo(
    () => generateInsights(scored, events, todayKey).slice(0, 3),
    [scored, events, todayKey],
  );

  const live = useMemo(
    () => sessions.find((s) => s.identity === "ilham" && isLive(s, now)),
    [sessions, now],
  );

  const days = useMemo(() => dailyStats(ilhamSessions), [ilhamSessions]);
  const ret = useMemo(() => retention(ilhamSessions), [ilhamSessions]);

  const totals = useMemo(() => {
    const totalMs = ilhamSessions.reduce((a, s) => a + s.durationMs, 0);
    const activeMs = ilhamSessions.reduce((a, s) => a + s.activeMs, 0);
    return { totalMs, activeMs };
  }, [ilhamSessions]);

  const spark = useMemo(() => {
    const byDay = new Map(days.map((d) => [d.day, d]));
    const out: { day: string; minutes: number }[] = [];
    for (let i = 13; i >= 0; i -= 1) {
      const d = new Date(now - i * 86_400_000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = byDay.get(k);
      out.push({
        day: k.slice(5),
        minutes: row ? Math.round(row.totalMs / 60_000) : 0,
      });
    }
    return out;
  }, [days, now]);

  const recent = useMemo(
    () => ilhamEvents.filter((e) => e.kind !== "heartbeat").slice(-10).reverse(),
    [ilhamEvents],
  );

  if (loading) {
    return (
      <Page>
        <StatSkeleton count={4} />
        <ListSkeleton />
      </Page>
    );
  }

  const state = live ? liveState(live, now) : "offline";

  return (
    <Page>
      {/* Live banner */}
      <div className="bg-card border border-card-border flex items-center gap-4 rounded-xl p-5">
        <LiveDot state={state} className="h-3 w-3" />
        <div className="flex-1">
          {live ? (
            <>
              <div className="font-medium text-foreground">
                {IDENTITY_LABELS.ilham} {LIVE_STATE_LABELS[state]}
                {currentPage(live) && (
                  <span className="text-muted-foreground">
                    {" "}
                    · في صفحة {currentPage(live)}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-sm text-muted-foreground">
                منذ {fmtTime(live.start)} ·{" "}
                {fmtDuration(now - live.start.getTime())}
              </div>
            </>
          ) : (
            <div className="text-muted-foreground">
              {IDENTITY_LABELS.ilham} غير متصلة الآن
              {ret.lastVisit && (
                <span> · آخر ظهور {fmtTime(ret.lastVisit)}</span>
              )}
            </div>
          )}
        </div>
        {backfilling && (
          <span className="text-xs text-muted-foreground">
            جارٍ تحميل السجل القديم…
          </span>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="عدد الزيارات" value={String(ilhamSessions.length)} />
        <StatCard label="إجمالي الوقت" value={fmtDuration(totals.totalMs)} />
        <StatCard label="وقت النشاط الفعلي" value={fmtDuration(totals.activeMs)} />
        <StatCard
          label="آخر ظهور"
          value={ret.lastVisit ? fmtTime(ret.lastVisit) : "—"}
        />
        <StatCard label="أيام الزيارة" value={String(ret.distinctDays)} />
        <StatCard
          label="أيام متتالية"
          value={String(ret.currentStreak)}
          sub={`الأطول: ${ret.longestStreak}`}
        />
      </div>

      {/* Top insights strip */}
      {topInsights.length > 0 && (
        <Panel
          title="✨ رؤى سريعة"
          action={
            <Link
              href="/insights"
              className="text-xs text-muted-foreground hover:text-foreground"
            >
              كل الرؤى ←
            </Link>
          }
        >
          <div className="grid gap-3 md:grid-cols-3">
            {topInsights.map((ins) => (
              <div key={ins.id} className="rounded-lg bg-muted/40 p-3">
                <div className="text-sm font-medium text-foreground">
                  {ins.title}
                </div>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  {ins.body}
                </p>
              </div>
            ))}
          </div>
        </Panel>
      )}

      {/* 14-day trend */}
      <Panel title="آخر ١٤ يومًا (دقائق)">
        <div dir="ltr" className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={spark} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <defs>
                <linearGradient id="ovGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="day"
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
                allowDecimals={false}
              />
              <Tooltip
                contentStyle={{
                  background: "hsl(var(--popover))",
                  border: "1px solid hsl(var(--border))",
                  borderRadius: 8,
                  color: "hsl(var(--foreground))",
                  fontSize: 12,
                }}
                formatter={(v: number) => [`${v} دقيقة`, "الوقت"]}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--chart-1))"
                fill="url(#ovGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      {/* Recent activity */}
      <Panel title="آخر النشاطات">
        {recent.length === 0 ? (
          <EmptyState title="لا نشاط بعد" hint="ستظهر النشاطات هنا فور حدوثها." />
        ) : (
          <div>
            {recent.map((e) => (
              <EventRow key={e.id} e={e} withDate />
            ))}
          </div>
        )}
      </Panel>
    </Page>
  );
}
