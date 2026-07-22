import { useMemo } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import {
  currentPage,
  fmtDuration,
  fmtTime,
  isLive,
  liveState,
  LIVE_STATE_LABELS,
  IDENTITY_LABELS,
} from "@/lib/activity";
import {
  EventRow,
  LiveDot,
  Page,
  Panel,
  StatCard,
  ListSkeleton,
  EmptyState,
} from "@/components/monitor/shared";
import { Badge } from "@/components/ui/badge";

export default function Live() {
  const { events, sessions, now, health, loading } = useMonitor();

  const live = useMemo(
    () => sessions.find((s) => s.identity === "ilham" && isLive(s, now)),
    [sessions, now],
  );
  const starLive = useMemo(
    () => sessions.find((s) => s.identity === "star" && isLive(s, now)),
    [sessions, now],
  );

  const feed = useMemo(
    () =>
      events
        .filter((e) => e.kind !== "heartbeat")
        .slice(-40)
        .reverse(),
    [events],
  );

  const connected = health.channelStatus === "SUBSCRIBED";
  const state = live ? liveState(live, now) : "offline";
  const lastEvent = live?.events[live.events.length - 1];

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={3} />
        <ListSkeleton rows={10} />
      </Page>
    );
  }

  return (
    <Page>
      {/* Connection banner */}
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold text-foreground">البث المباشر</h2>
        <Badge
          variant="outline"
          className={connected ? "text-green-400" : "text-destructive"}
        >
          {connected ? "● متصل بالبث الفوري" : "○ البث الفوري منقطع"}
        </Badge>
      </div>

      {/* Ilham live card */}
      <div className="bg-card border border-card-border rounded-xl p-5">
        <div className="flex items-center gap-4">
          <LiveDot state={state} className="h-3.5 w-3.5" />
          <div className="flex-1">
            <div className="text-lg font-medium text-foreground">
              {IDENTITY_LABELS.ilham}{" "}
              <span
                className={
                  state === "active"
                    ? "text-green-400"
                    : state === "idle"
                      ? "text-amber-400"
                      : "text-muted-foreground"
                }
              >
                {LIVE_STATE_LABELS[state]}
              </span>
            </div>
            {live && (
              <div className="mt-0.5 text-sm text-muted-foreground">
                دخلت {fmtTime(live.start)} · مدة الجلسة{" "}
                {fmtDuration(now - live.start.getTime())}
              </div>
            )}
          </div>
        </div>

        {live && (
          <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
            <StatCard
              label="الصفحة الحالية"
              value={currentPage(live) ?? "—"}
            />
            <StatCard
              label="آخر نشاط"
              value={lastEvent ? fmtTime(new Date(lastEvent.created_at)) : "—"}
            />
            <StatCard
              label="نشاط فعلي"
              value={fmtDuration(live.activeMs)}
            />
            <StatCard
              label="صفحات هذه الجلسة"
              value={String(live.pageViews)}
            />
          </div>
        )}
      </div>

      {/* Star (owner) presence — subtle, secondary */}
      {starLive && (
        <div className="text-xs text-muted-foreground">
          {IDENTITY_LABELS.star} أيضًا داخل الأرشيف الآن (منذ{" "}
          {fmtTime(starLive.start)}).
        </div>
      )}

      {/* Live session timeline */}
      {live && (
        <Panel title="أحداث الجلسة الحالية">
          {live.events.filter((e) => e.kind !== "heartbeat").length === 0 ? (
            <p className="text-sm text-muted-foreground">
              فتحت الأرشيف ولم تتصفح شيئًا بعد.
            </p>
          ) : (
            <div>
              {live.events
                .filter((e) => e.kind !== "heartbeat")
                .slice()
                .reverse()
                .map((e) => (
                  <EventRow key={e.id} e={e} />
                ))}
            </div>
          )}
        </Panel>
      )}

      {/* Raw live feed */}
      <Panel title="آخر النشاطات (الكل)">
        {feed.length === 0 ? (
          <EmptyState title="لا شيء بعد" />
        ) : (
          <div>
            {feed.map((e) => (
              <EventRow key={e.id} e={e} withIdentity withDate />
            ))}
          </div>
        )}
      </Panel>
    </Page>
  );
}
