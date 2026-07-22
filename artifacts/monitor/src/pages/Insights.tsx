import { useMemo } from "react";
import { Link } from "wouter";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { useMonitor } from "@/lib/MonitorContext";
import {
  generateInsights,
  predictions,
  CONFIDENCE_LABELS,
  type Insight,
} from "@/lib/intelligence";
import {
  Page,
  Panel,
  EmptyState,
  ListSkeleton,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

function ToneIcon({ tone }: { tone: Insight["tone"] }) {
  if (tone === "up") return <TrendingUp className="h-4 w-4 text-green-400" />;
  if (tone === "down")
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  return <Minus className="h-4 w-4 text-muted-foreground/50" />;
}

export default function Insights() {
  const { scored, events, sessions, anomalies, todayKey, loading, complete } =
    useMonitor();

  const insights = useMemo(
    () => generateInsights(scored, events, todayKey),
    [scored, events, todayKey],
  );

  const preds = useMemo(
    () => predictions(sessions, todayKey),
    [sessions, todayKey],
  );

  const serious = useMemo(
    () =>
      anomalies.filter(
        (a) => a.severity === "high" || a.severity === "critical",
      ),
    [anomalies],
  );

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={6} />
      </Page>
    );
  }

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">الرؤى الذكية</h2>
      <p className="text-sm text-muted-foreground">
        استنتاجات تلقائية من سجل النشاط: اتجاهات، سلوك، جودة الجلسات،
        وتوقعات. كل رؤية محسوبة بقواعد واضحة من البيانات نفسها.
      </p>

      {!complete && (
        <p className="text-xs text-muted-foreground">
          ما زال السجل القديم قيد التحميل — قد تتغير الأرقام قليلًا…
        </p>
      )}

      {/* Anomaly pulse */}
      {serious.length > 0 && (
        <Link href="/alerts">
          <div className="bg-destructive/10 border-destructive/30 hover-elevate cursor-pointer rounded-xl border p-4">
            <div className="font-medium text-destructive">
              ⚠ {serious.length}{" "}
              {serious.length === 1 ? "ملاحظة مهمة" : "ملاحظات مهمة"} تستحق
              الانتباه
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              {serious[0].title} — {serious[0].detail}
            </p>
          </div>
        </Link>
      )}

      {/* Insight cards */}
      {insights.length === 0 ? (
        <EmptyState
          icon="💡"
          title="لا رؤى بعد"
          hint="تظهر الرؤى تلقائيًا بعد تسجيل بعض الزيارات."
        />
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {insights.map((ins) => (
            <div
              key={ins.id}
              className="bg-card border border-card-border rounded-xl p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <ToneIcon tone={ins.tone} />
                  <span className="font-medium text-foreground">
                    {ins.title}
                  </span>
                </div>
                <Badge variant="outline" className="text-muted-foreground">
                  {ins.tag}
                </Badge>
              </div>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {ins.body}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Predictions */}
      <Panel
        title="التوقعات"
        action={
          <Badge variant="outline" className="text-muted-foreground">
            {CONFIDENCE_LABELS[preds.confidence]} · {preds.sampleDays} أيام من
            البيانات
          </Badge>
        }
      >
        {preds.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            {preds.note ?? "لا توقعات متاحة بعد."}
          </p>
        ) : (
          <>
            <div className="grid gap-3 sm:grid-cols-3">
              {preds.items.map((p) => (
                <div key={p.id} className="rounded-lg bg-muted/40 p-3">
                  <div className="text-lg font-semibold text-foreground tabular-nums">
                    {p.value}
                  </div>
                  <div className="mt-0.5 text-xs text-muted-foreground">
                    {p.title}
                  </div>
                  <div className="mt-1 text-[11px] text-muted-foreground/70">
                    {p.detail}
                  </div>
                </div>
              ))}
            </div>
            {preds.note && (
              <p className="mt-3 text-xs text-muted-foreground/70">
                {preds.note}
              </p>
            )}
          </>
        )}
      </Panel>
    </Page>
  );
}
