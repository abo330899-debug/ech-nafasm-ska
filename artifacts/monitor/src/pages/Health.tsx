import { useMemo } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import { fmtDateTime } from "@/lib/activity";
import {
  Page,
  Panel,
  StatCard,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

// performance.memory is Chrome-only and nonstandard — feature-detect.
function memoryUsage(): string | null {
  const perf = performance as unknown as {
    memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number };
  };
  if (!perf.memory) return null;
  const used = Math.round(perf.memory.usedJSHeapSize / 1_048_576);
  const limit = Math.round(perf.memory.jsHeapSizeLimit / 1_048_576);
  return `${used} / ${limit} م.ب`;
}

const CHANNEL_AR: Record<string, { label: string; ok: boolean }> = {
  connecting: { label: "جارٍ الاتصال…", ok: true },
  SUBSCRIBED: { label: "متصل", ok: true },
  CHANNEL_ERROR: { label: "خطأ في القناة", ok: false },
  TIMED_OUT: { label: "انتهت المهلة", ok: false },
  CLOSED: { label: "مغلقة", ok: false },
};

export default function Health() {
  const { events, health, phase, error, now, refetch } = useMonitor();

  const lastEvent = events[events.length - 1] ?? null;

  // Ingest rate: events in the last hour.
  const lastHour = useMemo(() => {
    const cutoff = now - 3_600_000;
    let n = 0;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      if (new Date(events[i].created_at).getTime() < cutoff) break;
      n += 1;
    }
    return n;
  }, [events, now]);

  const channel = CHANNEL_AR[health.channelStatus] ?? {
    label: health.channelStatus,
    ok: false,
  };
  const mem = memoryUsage();

  return (
    <Page>
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">حالة النظام</h2>
        <button
          onClick={refetch}
          className="hover-elevate rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground"
        >
          إعادة التحميل
        </button>
      </div>

      {error && (
        <div className="bg-destructive/10 border-destructive/30 text-destructive rounded-xl border p-4 text-sm">
          {error}
        </div>
      )}

      <Panel title="الاتصال">
        <div className="flex flex-wrap items-center gap-2">
          <Badge
            variant="outline"
            className={channel.ok ? "text-green-400" : "text-destructive"}
          >
            البث الفوري: {channel.label}
          </Badge>
          <Badge variant="outline">
            قاعدة البيانات:{" "}
            {phase === "error"
              ? "غير متاحة"
              : phase === "complete"
                ? "متاحة"
                : "جارٍ التحميل…"}
          </Badge>
          {health.reconnects > 0 && (
            <Badge variant="outline" className="text-amber-400">
              إعادة اتصال: {health.reconnects}
            </Badge>
          )}
        </div>
      </Panel>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard
          label="زمن الاستعلام"
          value={health.lastQueryMs !== null ? `${health.lastQueryMs} م.ث` : "—"}
        />
        <StatCard label="عدد السجلات بالذاكرة" value={String(events.length)} />
        <StatCard
          label="أحداث وصلت مباشرة"
          value={String(health.liveRows)}
          sub="منذ فتح اللوحة"
        />
        <StatCard label="أحداث آخر ساعة" value={String(lastHour)} />
        <StatCard
          label="آخر حدث"
          value={lastEvent ? fmtDateTime(new Date(lastEvent.created_at)) : "—"}
        />
        <StatCard
          label="ذاكرة المتصفح"
          value={mem ?? "—"}
          sub={mem ? undefined : "غير متاحة في هذا المتصفح"}
        />
      </div>

      <p className="text-xs text-muted-foreground">
        اكتمل التحميل:{" "}
        {health.loadedAt ? fmtDateTime(new Date(health.loadedAt)) : "ليس بعد"} ·
        اللوحة تعمل داخل مساحة العمل فقط ولا تُنشر للعامة.
      </p>
    </Page>
  );
}
