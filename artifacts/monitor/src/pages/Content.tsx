import { useMemo } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import { countByLabel, pageCounts, type CountRow } from "@/lib/analytics";
import {
  Page,
  Panel,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";

function Section({ title, rows }: { title: string; rows: CountRow[] }) {
  const max = rows.length > 0 ? rows[0][1] : 0;
  return (
    <Panel title={title}>
      {rows.length === 0 ? (
        <p className="text-sm text-muted-foreground">لا شيء بعد</p>
      ) : (
        <ul className="max-h-80 space-y-2 overflow-auto pl-1">
          {rows.map(([name, n]) => (
            <li key={name} className="text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="truncate text-foreground">{name}</span>
                <span className="shrink-0 tabular-nums text-muted-foreground">
                  {n}×
                </span>
              </div>
              <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${max > 0 ? (n / max) * 100 : 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export default function Content() {
  const { ilhamEvents, loading } = useMonitor();

  const pages = useMemo(() => pageCounts(ilhamEvents), [ilhamEvents]);
  const photos = useMemo(
    () => countByLabel(ilhamEvents, "photo_open"),
    [ilhamEvents],
  );
  const videos = useMemo(
    () => countByLabel(ilhamEvents, "video_open"),
    [ilhamEvents],
  );

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={8} />
      </Page>
    );
  }

  const empty = pages.length === 0 && photos.length === 0 && videos.length === 0;

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">المحتوى</h2>
      {empty ? (
        <EmptyState
          title="لا يوجد تصفح للمحتوى بعد"
          hint="ستظهر هنا الصفحات والصور والفيديوهات الأكثر مشاهدة."
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-3">
          <Section title="الصفحات الأكثر زيارة" rows={pages} />
          <Section title="الصور المفتوحة" rows={photos} />
          <Section title="الفيديوهات المفتوحة" rows={videos} />
        </div>
      )}
    </Page>
  );
}
