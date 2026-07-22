import { useMemo } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import {
  dayKey,
  fmtDayHeading,
  fmtDuration,
  fmtTime,
  isLive,
  IDENTITY_LABELS,
  type Session,
} from "@/lib/activity";
import {
  Page,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";

export default function Daily() {
  const { ilhamSessions, now, loading, backfilling } = useMonitor();

  const days = useMemo(() => {
    const map = new Map<string, Session[]>();
    for (const s of ilhamSessions) {
      const k = dayKey(s.start);
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(s);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [ilhamSessions]);

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={8} />
      </Page>
    );
  }

  if (days.length === 0) {
    return (
      <Page>
        <h2 className="text-lg font-semibold text-foreground">يوم بيوم</h2>
        <EmptyState title="لا يوجد نشاط بعد" />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-foreground">يوم بيوم</h2>
        {backfilling && (
          <span className="text-xs text-muted-foreground">
            جارٍ تحميل الأيام الأقدم…
          </span>
        )}
      </div>

      <div className="space-y-5">
        {days.map(([key, daySessions]) => {
          const totalMs = daySessions.reduce((a, s) => a + s.durationMs, 0);
          const pv = daySessions.reduce((a, s) => a + s.pageViews, 0);
          const ph = daySessions.reduce((a, s) => a + s.photoOpens, 0);
          const vd = daySessions.reduce((a, s) => a + s.videoOpens, 0);
          return (
            <div
              key={key}
              className="bg-card border border-card-border rounded-xl p-5"
            >
              <div className="mb-3 flex flex-wrap items-baseline justify-between gap-3">
                <h3 className="font-medium text-foreground">
                  {fmtDayHeading(new Date(key + "T00:00:00"))}
                </h3>
                <span className="text-sm text-muted-foreground">
                  {daySessions.length} زيارة · {fmtDuration(totalMs)}
                </span>
              </div>
              <div className="mb-3 flex gap-4 text-sm text-muted-foreground">
                <span>📄 {pv} صفحة</span>
                <span>🖼️ {ph} صورة</span>
                <span>🎬 {vd} فيديو</span>
              </div>
              <div className="space-y-2">
                {daySessions.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 border-t border-border/50 pt-2 text-sm first:border-0 first:pt-0"
                  >
                    <span
                      className={`inline-block h-2 w-2 shrink-0 rounded-full ${
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
                    <span className="mr-auto text-muted-foreground">
                      {fmtDuration(s.durationMs)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </Page>
  );
}
