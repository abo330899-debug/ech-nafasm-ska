import { useMonitor } from "@/lib/MonitorContext";
import { fmtDateTime } from "@/lib/activity";
import type { Severity } from "@/lib/intelligence";
import {
  Page,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

const SEVERITY: Record<
  Severity,
  { label: string; className: string; dot: string }
> = {
  critical: {
    label: "حرج",
    className: "text-destructive",
    dot: "bg-destructive",
  },
  high: {
    label: "مهم",
    className: "text-orange-400",
    dot: "bg-orange-400",
  },
  medium: {
    label: "تنبيه",
    className: "text-amber-400",
    dot: "bg-amber-400",
  },
  low: {
    label: "معلومة",
    className: "text-sky-400",
    dot: "bg-sky-400",
  },
};

export default function Alerts() {
  const { anomalies, loading, complete } = useMonitor();

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={6} />
      </Page>
    );
  }

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">التنبيهات</h2>
      <p className="text-sm text-muted-foreground">
        محرك كشف تلقائي يراقب النشاط: جلسات غير معتادة، تنقّل سريع، تحديث
        متكرر، نشاط في أوقات غريبة، وانقطاع البث المباشر — مرتبة حسب الأهمية.
      </p>

      {!complete && (
        <p className="text-xs text-muted-foreground">
          ما زال السجل القديم قيد التحميل…
        </p>
      )}

      {anomalies.length === 0 ? (
        <EmptyState
          icon="🔔"
          title="لا توجد تنبيهات"
          hint="كل شيء يبدو طبيعيًا."
        />
      ) : (
        <div className="space-y-2">
          {anomalies.map((a) => {
            const sev = SEVERITY[a.severity];
            return (
              <div
                key={a.id}
                className="bg-card border border-card-border flex items-start gap-3 rounded-xl p-4"
              >
                <span
                  className={`mt-1.5 inline-block h-2 w-2 shrink-0 rounded-full ${sev.dot}`}
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium text-foreground">
                      {a.title}
                    </span>
                    <Badge variant="outline" className={sev.className}>
                      {sev.label}
                    </Badge>
                  </div>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {a.detail}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground/70">
                    {fmtDateTime(a.at)}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Page>
  );
}
