import { useMemo, useState } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import { fmtDuration } from "@/lib/activity";
import { SessionCard } from "@/components/monitor/SessionCard";
import {
  Page,
  StatCard,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";

const PAGE = 20;

export default function Sessions() {
  const { ilhamSessions, now, loading, backfilling } = useMonitor();
  const [shown, setShown] = useState(PAGE);

  const stats = useMemo(() => {
    const n = ilhamSessions.length;
    const totalMs = ilhamSessions.reduce((a, s) => a + s.durationMs, 0);
    return {
      count: n,
      avgMs: n > 0 ? totalMs / n : 0,
      totalMs,
    };
  }, [ilhamSessions]);

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={8} />
      </Page>
    );
  }

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">الجلسات</h2>

      <div className="grid grid-cols-3 gap-3">
        <StatCard label="عدد الجلسات" value={String(stats.count)} />
        <StatCard label="متوسط المدة" value={fmtDuration(stats.avgMs)} />
        <StatCard label="إجمالي الوقت" value={fmtDuration(stats.totalMs)} />
      </div>

      {ilhamSessions.length === 0 ? (
        <EmptyState
          title="لا توجد جلسات بعد"
          hint="ستظهر الجلسات هنا بعد أول زيارة."
        />
      ) : (
        <div className="space-y-3">
          {ilhamSessions.slice(0, shown).map((s, i) => (
            <SessionCard key={s.start.getTime() + "-" + i} session={s} now={now} />
          ))}
          {ilhamSessions.length > shown && (
            <button
              onClick={() => setShown((n) => n + PAGE)}
              className="hover-elevate w-full rounded-xl border border-border py-2.5 text-sm text-muted-foreground"
            >
              عرض المزيد ({ilhamSessions.length - shown} متبقية)
            </button>
          )}
          {backfilling && (
            <p className="text-center text-xs text-muted-foreground">
              جارٍ تحميل الجلسات الأقدم…
            </p>
          )}
        </div>
      )}
    </Page>
  );
}
