import { useMemo } from "react";
import { Monitor, Smartphone, Tablet } from "lucide-react";
import { useMonitor } from "@/lib/MonitorContext";
import { fmtDateTime, IDENTITY_LABELS } from "@/lib/activity";
import { deviceProfiles } from "@/lib/analytics";
import {
  Page,
  Panel,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

function DeviceIcon({ device }: { device?: string }) {
  const cls = "h-5 w-5 text-muted-foreground";
  if (device === "mobile") return <Smartphone className={cls} />;
  if (device === "tablet") return <Tablet className={cls} />;
  return <Monitor className={cls} />;
}

const DEVICE_AR: Record<string, string> = {
  mobile: "هاتف",
  tablet: "جهاز لوحي",
  desktop: "حاسوب",
};

export default function Devices() {
  const { events, loading, complete, phase } = useMonitor();

  const profiles = useMemo(() => deviceProfiles(events), [events]);
  const ilhamProfiles = profiles.filter((p) => p.identity === "ilham");
  const starProfiles = profiles.filter((p) => p.identity === "star");

  if (loading || (!complete && phase !== "error")) {
    return (
      <Page>
        <h2 className="text-lg font-semibold text-foreground">الأجهزة</h2>
        <ListSkeleton rows={4} />
      </Page>
    );
  }

  const List = ({ rows }: { rows: typeof profiles }) => (
    <div className="space-y-3">
      {rows.map((p) => (
        <div
          key={p.key}
          className="bg-card border border-card-border flex items-start gap-4 rounded-xl p-4"
        >
          <DeviceIcon device={p.meta.device} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-foreground">
                {DEVICE_AR[p.meta.device ?? ""] ?? "جهاز"} · {p.meta.os ?? "؟"}
              </span>
              <Badge variant="outline">{p.meta.browser ?? "متصفح غير معروف"}</Badge>
              {p.meta.pwa && <Badge variant="outline">تطبيق مثبّت</Badge>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground">
              {p.meta.screen && <span>الشاشة {p.meta.screen} · </span>}
              {p.meta.lang && <span>اللغة {p.meta.lang} · </span>}
              {p.meta.tz && <span>المنطقة {p.meta.tz}</span>}
            </div>
            <div className="mt-1 text-xs text-muted-foreground/70">
              أول ظهور {fmtDateTime(p.firstSeen)} · آخر ظهور{" "}
              {fmtDateTime(p.lastSeen)} · {p.count} مرة
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">الأجهزة والمتصفحات</h2>

      {profiles.length === 0 ? (
        <EmptyState
          icon="📱"
          title="لا توجد معلومات أجهزة بعد"
          hint="بدأ الأرشيف الآن بتسجيل نوع الجهاز والمتصفح مع كل زيارة جديدة — الزيارات القديمة لم تكن تسجّل هذه المعلومات."
        />
      ) : (
        <>
          {ilhamProfiles.length > 0 && (
            <Panel title={`أجهزة ${IDENTITY_LABELS.ilham}`}>
              <List rows={ilhamProfiles} />
            </Panel>
          )}
          {starProfiles.length > 0 && (
            <Panel title={`أجهزتك (${IDENTITY_LABELS.star})`}>
              <List rows={starProfiles} />
            </Panel>
          )}
          <p className="text-xs text-muted-foreground">
            ملاحظة: الزيارات التي حدثت قبل اليوم لا تحمل معلومات الجهاز، لذلك
            تظهر فقط الأجهزة المرصودة من الآن فصاعدًا.
          </p>
        </>
      )}
    </Page>
  );
}
