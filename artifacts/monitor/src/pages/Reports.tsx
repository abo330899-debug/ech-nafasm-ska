import { useMemo, useState } from "react";
import { Printer } from "lucide-react";
import { useMonitor } from "@/lib/MonitorContext";
import { fmtDuration, fmtDateTime, fmtDayHeading } from "@/lib/activity";
import {
  buildReport,
  REPORT_TITLES,
  type ReportScope,
} from "@/lib/intelligence";
import {
  Page,
  Panel,
  StatCard,
  StatSkeleton,
  EmptyState,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

const SCOPES: ReportScope[] = ["daily", "weekly", "monthly"];

const SEV_LABEL: Record<string, string> = {
  critical: "حرج",
  high: "مهم",
  medium: "تنبيه",
  low: "معلومة",
};

export default function Reports() {
  const [scope, setScope] = useState<ReportScope>("daily");
  const { scored, events, todayKey, now, loading, complete } = useMonitor();

  const report = useMemo(
    () => buildReport(scope, scored, events, todayKey),
    [scope, scored, events, todayKey],
  );

  if (loading) {
    return (
      <Page>
        <StatSkeleton count={4} />
      </Page>
    );
  }

  return (
    <Page>
      <div className="flex flex-wrap items-center justify-between gap-3 print:hidden">
        <div>
          <h2 className="text-lg font-semibold text-foreground">التقارير</h2>
          <p className="text-sm text-muted-foreground">
            تقارير تلقائية جاهزة للقراءة أو الطباعة.
          </p>
        </div>
        <button
          onClick={() => window.print()}
          className="hover-elevate flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <Printer className="h-4 w-4" />
          طباعة / PDF
        </button>
      </div>

      {/* Scope tabs */}
      <div className="flex gap-2 print:hidden">
        {SCOPES.map((s) => (
          <button
            key={s}
            onClick={() => setScope(s)}
            className={`hover-elevate rounded-md px-3 py-1.5 text-sm ${
              scope === s
                ? "bg-primary text-primary-foreground"
                : "bg-card border border-card-border text-muted-foreground"
            }`}
          >
            {REPORT_TITLES[s]}
          </button>
        ))}
      </div>

      {!complete && (
        <p className="text-xs text-muted-foreground print:hidden">
          ما زال السجل القديم قيد التحميل — الأرقام قد تكون ناقصة…
        </p>
      )}

      {/* Printable report body */}
      <div className="space-y-4" id="report-body">
        <div>
          <h3 className="text-xl font-semibold text-foreground">
            {REPORT_TITLES[scope]} — {report.rangeLabel}
          </h3>
          <p className="mt-0.5 text-xs text-muted-foreground">
            أُنشئ في {fmtDayHeading(new Date(now))} · {fmtDateTime(new Date(now))}
          </p>
        </div>

        {/* Executive summary */}
        <Panel title="الملخص التنفيذي">
          <div className="space-y-1.5 text-sm leading-relaxed text-foreground/90">
            {report.executive.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        </Panel>

        {report.visits > 0 && (
          <>
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="الزيارات" value={String(report.visits)} />
              <StatCard
                label="إجمالي الوقت"
                value={fmtDuration(report.totalMs)}
                sub={`نشاط فعلي ${fmtDuration(report.activeMs)}`}
              />
              <StatCard
                label="صفحات متصفَّحة"
                value={String(report.pageViews)}
              />
              <StatCard
                label="محتوى مفتوح"
                value={String(report.photoOpens + report.videoOpens)}
                sub={`${report.photoOpens} صورة · ${report.videoOpens} فيديو`}
              />
            </div>

            {/* Top content */}
            {(report.topPages.length > 0 || report.topVideos.length > 0) && (
              <div className="grid gap-3 md:grid-cols-2">
                {report.topPages.length > 0 && (
                  <Panel title="أكثر الصفحات زيارة">
                    <div className="space-y-1.5">
                      {report.topPages.map(([label, count]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="text-foreground">{label}</span>
                          <span className="tabular-nums text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
                {report.topVideos.length > 0 && (
                  <Panel title="أكثر الفيديوهات مشاهدة">
                    <div className="space-y-1.5">
                      {report.topVideos.map(([label, count]) => (
                        <div
                          key={label}
                          className="flex items-center justify-between text-sm"
                        >
                          <span className="truncate text-foreground">
                            {label}
                          </span>
                          <span className="tabular-nums text-muted-foreground">
                            {count}
                          </span>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}
              </div>
            )}

            {/* Anomalies within range */}
            <Panel title="الملاحظات والتنبيهات">
              {report.anomalies.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  لا ملاحظات غير معتادة خلال هذه الفترة.
                </p>
              ) : (
                <div className="space-y-2">
                  {report.anomalies.map((a) => (
                    <div key={a.id} className="flex items-start gap-2 text-sm">
                      <Badge
                        variant="outline"
                        className="shrink-0 text-muted-foreground"
                      >
                        {SEV_LABEL[a.severity]}
                      </Badge>
                      <div>
                        <span className="text-foreground">{a.title}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          — {a.detail}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>
          </>
        )}

        {report.visits === 0 && (
          <EmptyState
            icon="📄"
            title="لا بيانات في هذه الفترة"
            hint="اختر فترة أطول أو انتظر زيارات جديدة."
          />
        )}
      </div>
    </Page>
  );
}
