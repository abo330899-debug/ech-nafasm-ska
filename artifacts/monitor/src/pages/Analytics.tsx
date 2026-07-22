import { useMemo } from "react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useMonitor } from "@/lib/MonitorContext";
import { fmtDuration } from "@/lib/activity";
import {
  activityHeatmap,
  dailyStats,
  monthlyStats,
  peakHours,
  retention,
  weeklyStats,
} from "@/lib/analytics";
import {
  Page,
  Panel,
  StatCard,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";

const AR_DAYS = ["أحد", "اثنين", "ثلاثاء", "أربعاء", "خميس", "جمعة", "سبت"];

const tooltipStyle = {
  background: "hsl(var(--popover))",
  border: "1px solid hsl(var(--border))",
  borderRadius: 8,
  color: "hsl(var(--foreground))",
  fontSize: 12,
} as const;

const axisTick = {
  fill: "hsl(var(--muted-foreground))",
  fontSize: 10,
} as const;

function Heatmap({ cells }: { cells: number[][] }) {
  const max = Math.max(1, ...cells.flat());
  return (
    <div dir="ltr" className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="mb-1 grid grid-cols-[3rem_repeat(24,1fr)] gap-0.5 text-[9px] text-muted-foreground">
          <span />
          {Array.from({ length: 24 }).map((_, h) => (
            <span key={h} className="text-center">
              {h % 3 === 0 ? h : ""}
            </span>
          ))}
        </div>
        {cells.map((row, d) => (
          <div
            key={d}
            className="grid grid-cols-[3rem_repeat(24,1fr)] items-center gap-0.5"
          >
            <span className="pr-1 text-right text-[10px] text-muted-foreground">
              {AR_DAYS[d]}
            </span>
            {row.map((n, h) => (
              <div
                key={h}
                title={`${AR_DAYS[d]} ${h}:00 — ${n} نشاط`}
                className="aspect-square rounded-[3px]"
                style={{
                  background:
                    n === 0
                      ? "hsl(var(--muted) / 0.5)"
                      : `hsl(var(--chart-1) / ${0.25 + 0.75 * (n / max)})`,
                }}
              />
            ))}
          </div>
        ))}
        <p className="mt-2 text-[10px] text-muted-foreground">
          بتوقيت بغداد · الأغمق = نشاط أكثر
        </p>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { ilhamEvents, ilhamSessions, loading, complete, phase, now } =
    useMonitor();

  const days = useMemo(() => dailyStats(ilhamSessions), [ilhamSessions]);
  const weeks = useMemo(() => weeklyStats(days), [days]);
  const months = useMemo(() => monthlyStats(days), [days]);
  const heatmap = useMemo(() => activityHeatmap(ilhamEvents), [ilhamEvents]);
  const peaks = useMemo(() => peakHours(heatmap), [heatmap]);
  const ret = useMemo(() => retention(ilhamSessions), [ilhamSessions]);

  const last30 = useMemo(() => {
    const byDay = new Map(days.map((d) => [d.day, d]));
    const out: { day: string; minutes: number; visits: number }[] = [];
    for (let i = 29; i >= 0; i -= 1) {
      const d = new Date(now - i * 86_400_000);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const row = byDay.get(k);
      out.push({
        day: k.slice(5),
        minutes: row ? Math.round(row.totalMs / 60_000) : 0,
        visits: row?.visits ?? 0,
      });
    }
    return out;
  }, [days, now]);

  if (loading || (!complete && phase !== "error")) {
    return (
      <Page>
        <h2 className="text-lg font-semibold text-foreground">التحليلات</h2>
        <p className="text-sm text-muted-foreground">
          جارٍ تحميل السجل الكامل لبناء التحليلات…
        </p>
        <ListSkeleton rows={8} />
      </Page>
    );
  }

  if (ilhamSessions.length === 0) {
    return (
      <Page>
        <h2 className="text-lg font-semibold text-foreground">التحليلات</h2>
        <EmptyState title="لا توجد بيانات كافية بعد" />
      </Page>
    );
  }

  const topPeaks = peaks.filter((p) => p.count > 0).slice(0, 3);

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">التحليلات</h2>

      {/* Retention row */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatCard label="أيام الزيارة" value={String(ret.distinctDays)} />
        <StatCard
          label="أيام متتالية حاليًا"
          value={String(ret.currentStreak)}
        />
        <StatCard label="أطول تتابع" value={String(ret.longestStreak)} />
        <StatCard
          label="ذروة النشاط"
          value={
            topPeaks.length > 0 ? `الساعة ${topPeaks[0].hour}:00` : "—"
          }
          sub={
            topPeaks.length > 1
              ? `ثم ${topPeaks
                  .slice(1)
                  .map((p) => `${p.hour}:00`)
                  .join(" و ")}`
              : undefined
          }
        />
      </div>

      {/* Daily trend */}
      <Panel title="النشاط اليومي — آخر ٣٠ يومًا (دقائق)">
        <div dir="ltr" className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={last30}
              margin={{ top: 4, right: 4, bottom: 0, left: -20 }}
            >
              <defs>
                <linearGradient id="anGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(var(--chart-1))" stopOpacity={0.5} />
                  <stop offset="100%" stopColor="hsl(var(--chart-1))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="day" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number, name: string) => [
                  name === "minutes" ? `${v} دقيقة` : v,
                  name === "minutes" ? "الوقت" : "الزيارات",
                ]}
              />
              <Area
                type="monotone"
                dataKey="minutes"
                stroke="hsl(var(--chart-1))"
                fill="url(#anGrad)"
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <div className="grid gap-4 md:grid-cols-2">
        {/* Weekly */}
        <Panel title="أسبوعيًا (زيارات)">
          <div dir="ltr" className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={weeks.slice(-12)}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              >
                <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [v, "زيارة"]}
                  labelFormatter={(l: string) => `أسبوع ${l}`}
                />
                <Bar dataKey="visits" fill="hsl(var(--chart-2))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        {/* Monthly */}
        <Panel title="شهريًا (ساعات)">
          <div dir="ltr" className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={months.map((m) => ({
                  bucket: m.bucket,
                  hours: Math.round((m.totalMs / 3_600_000) * 10) / 10,
                }))}
                margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
              >
                <XAxis dataKey="bucket" tick={axisTick} axisLine={false} tickLine={false} />
                <YAxis tick={axisTick} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  formatter={(v: number) => [`${v} ساعة`, "الوقت"]}
                />
                <Bar dataKey="hours" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Heatmap */}
      <Panel title="خريطة النشاط (اليوم × الساعة)">
        <Heatmap cells={heatmap} />
      </Panel>

      {/* Peak hours */}
      <Panel title="ساعات الذروة">
        <div dir="ltr" className="h-40">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={peaks
                .slice()
                .sort((a, b) => a.hour - b.hour)
                .map((p) => ({ hour: `${p.hour}`, count: p.count }))}
              margin={{ top: 4, right: 4, bottom: 0, left: -24 }}
            >
              <XAxis dataKey="hour" tick={axisTick} axisLine={false} tickLine={false} />
              <YAxis tick={axisTick} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(v: number) => [v, "نشاط"]}
                labelFormatter={(l: string) => `الساعة ${l}:00 بغداد`}
              />
              <Bar dataKey="count" fill="hsl(var(--chart-4))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Panel>

      <p className="text-xs text-muted-foreground">
        إجمالي الوقت المسجّل:{" "}
        {fmtDuration(ilhamSessions.reduce((a, s) => a + s.durationMs, 0))} عبر{" "}
        {ilhamSessions.length} جلسة.
      </p>
    </Page>
  );
}
