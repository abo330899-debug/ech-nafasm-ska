import { useMemo, useState } from "react";
import {
  fmtDuration,
  fmtTime,
  isLive,
  liveState,
  IDENTITY_LABELS,
  type Session,
} from "@/lib/activity";
import {
  narrateSession,
  riskLabel,
  scoreSession,
  type ScoreKey,
  type SessionScores,
} from "@/lib/intelligence";
import { useMonitor } from "@/lib/MonitorContext";
import { EventRow, LiveDot } from "./shared";

function scoreColor(v: number): string {
  if (v >= 75) return "text-green-400";
  if (v >= 50) return "text-sky-400";
  if (v >= 25) return "text-amber-400";
  return "text-muted-foreground";
}

function riskColor(v: number): string {
  if (v >= 70) return "text-destructive";
  if (v >= 40) return "text-amber-400";
  if (v > 0) return "text-sky-400";
  return "text-muted-foreground";
}

const SCORE_LABELS: Record<ScoreKey, string> = {
  engagement: "التفاعل",
  activity: "النشاط",
  completion: "الاكتمال",
  risk: "الخطورة",
};

function ScoreBox({
  label,
  value,
  className,
  sub,
}: {
  label: string;
  value: number;
  className: string;
  sub?: string;
}) {
  return (
    <div className="rounded-lg bg-muted/40 p-2 text-center">
      <div className={`text-lg font-semibold tabular-nums ${className}`}>
        {value}
      </div>
      <div className="text-[11px] text-muted-foreground">{label}</div>
      {sub && <div className="text-[10px] text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

export function SessionCard({
  session,
  now,
}: {
  session: Session;
  now: number;
}) {
  const [open, setOpen] = useState(false);
  const { scored } = useMonitor();
  const live = isLive(session, now);
  const state = liveState(session, now);
  const activePct =
    session.durationMs > 0
      ? Math.min(100, Math.round((session.activeMs / session.durationMs) * 100))
      : 0;

  // Context already scored every session; fall back to a direct computation
  // if this card ever renders a session object from elsewhere.
  const scores: SessionScores = useMemo(() => {
    const hit = scored.find((x) => x.session === session);
    return hit ? hit.scores : scoreSession(session);
  }, [scored, session]);

  const story = useMemo(
    () => (open ? narrateSession(session, now) : []),
    // `live` (not raw now) keeps the story from re-rendering every tick.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open, session, live],
  );

  return (
    <div className="bg-card border border-card-border overflow-hidden rounded-xl">
      <button
        onClick={() => setOpen((o) => !o)}
        className="hover-elevate flex w-full items-center gap-3 p-4 text-right"
      >
        <LiveDot state={live ? state : "offline"} />
        <div className="min-w-0 flex-1">
          <div className="font-medium text-foreground">
            {IDENTITY_LABELS[session.identity]}
            {live && (
              <span className="mr-2 text-sm text-green-400">• متصلة</span>
            )}
          </div>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {fmtTime(session.start)} — {live ? "الآن" : fmtTime(session.end)} ·{" "}
            {fmtDuration(session.durationMs)}
            {session.durationMs > 60_000 && (
              <span> · نشاط فعلي {fmtDuration(session.activeMs)}</span>
            )}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-3 text-xs text-muted-foreground">
          {session.pageViews > 0 && <span>📄 {session.pageViews}</span>}
          {session.photoOpens > 0 && <span>🖼️ {session.photoOpens}</span>}
          {session.videoOpens > 0 && <span>🎬 {session.videoOpens}</span>}
          <span
            className={`rounded-md bg-muted px-1.5 py-0.5 tabular-nums ${scoreColor(scores.engagement)}`}
            title="درجة التفاعل"
          >
            ⚡ {scores.engagement}
          </span>
          {scores.risk >= 40 && (
            <span
              className={`rounded-md bg-muted px-1.5 py-0.5 ${riskColor(scores.risk)}`}
              title="درجة الخطورة"
            >
              ⚠ {riskLabel(scores.risk)}
            </span>
          )}
        </div>
      </button>

      {open && (
        <div className="border-t border-border/50 px-4 pb-4 pt-3 space-y-3">
          {/* Intelligence scores */}
          <div className="grid grid-cols-4 gap-2">
            <ScoreBox
              label={SCORE_LABELS.engagement}
              value={scores.engagement}
              className={scoreColor(scores.engagement)}
            />
            <ScoreBox
              label={SCORE_LABELS.activity}
              value={scores.activity}
              className={scoreColor(scores.activity)}
            />
            <ScoreBox
              label={SCORE_LABELS.completion}
              value={scores.completion}
              className={scoreColor(scores.completion)}
            />
            <ScoreBox
              label={SCORE_LABELS.risk}
              value={scores.risk}
              className={riskColor(scores.risk)}
              sub={riskLabel(scores.risk)}
            />
          </div>
          <div className="space-y-1 text-xs text-muted-foreground">
            {(Object.keys(SCORE_LABELS) as ScoreKey[]).map((k) => (
              <div key={k}>
                <span className="text-foreground/70">{SCORE_LABELS[k]}:</span>{" "}
                {scores.explain[k].join("؛ ")}
              </div>
            ))}
          </div>

          {/* Active vs idle bar */}
          {session.durationMs > 60_000 && (
            <div>
              <div className="mb-1 flex justify-between text-xs text-muted-foreground">
                <span>نشاط فعلي {fmtDuration(session.activeMs)}</span>
                <span>خمول {fmtDuration(session.idleMs)}</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-green-500/70"
                  style={{ width: `${activePct}%` }}
                />
              </div>
            </div>
          )}

          {/* Navigation path */}
          {session.navPath.length > 0 && (
            <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <span className="text-foreground/70">المسار:</span>
              {session.navPath.map((p, i) => (
                <span key={i} className="flex items-center gap-1">
                  {i > 0 && <span className="opacity-50">←</span>}
                  <span className="rounded-md bg-muted px-1.5 py-0.5">{p}</span>
                </span>
              ))}
            </div>
          )}

          {/* Device */}
          {session.client && (
            <div className="text-xs text-muted-foreground">
              الجهاز: {session.client.device === "mobile"
                ? "هاتف"
                : session.client.device === "tablet"
                  ? "جهاز لوحي"
                  : "حاسوب"}{" "}
              · {session.client.os ?? "؟"} · {session.client.browser ?? "؟"}
            </div>
          )}

          {/* Story */}
          {story.length > 0 && (
            <div className="rounded-lg bg-muted/30 p-3">
              <div className="mb-1.5 text-xs font-medium text-foreground/80">
                📖 قصة الجلسة
              </div>
              <div className="space-y-0.5 text-sm leading-relaxed text-muted-foreground">
                {story.map((line, i) => (
                  <p key={i}>{line}</p>
                ))}
              </div>
            </div>
          )}

          {/* Timeline */}
          <div>
            {session.events
              .filter((e) => e.kind !== "heartbeat")
              .map((e) => (
                <EventRow key={e.id} e={e} />
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
