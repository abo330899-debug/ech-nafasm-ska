import type { ReactNode } from "react";
import { motion } from "framer-motion";
import {
  fmtDateTime,
  fmtTime,
  kindLabel,
  pageLabel,
  IDENTITY_LABELS,
  type ActivityEvent,
  type LiveState,
} from "@/lib/activity";
import { Skeleton } from "@/components/ui/skeleton";

/** Page wrapper: consistent width + a soft fade-in transition. */
export function Page({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.18, ease: "easeOut" }}
      className="mx-auto w-full max-w-5xl space-y-4 px-4 py-5"
    >
      {children}
    </motion.div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`bg-card border border-card-border rounded-xl p-4 ${className}`}
    >
      {(title || action) && (
        <div className="mb-3 flex items-center justify-between gap-3">
          {title && <h3 className="font-medium text-foreground">{title}</h3>}
          {action}
        </div>
      )}
      {children}
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
  icon,
}: {
  label: string;
  value: string;
  sub?: string;
  icon?: ReactNode;
}) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4">
      <div className="flex items-start justify-between gap-2">
        <div className="text-2xl font-semibold text-foreground tabular-nums">
          {value}
        </div>
        {icon && <span className="text-muted-foreground">{icon}</span>}
      </div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {sub && <div className="mt-0.5 text-xs text-muted-foreground/70">{sub}</div>}
    </div>
  );
}

const LIVE_DOT: Record<LiveState, string> = {
  active: "bg-green-400 animate-pulse",
  idle: "bg-amber-400",
  offline: "bg-muted-foreground/40",
};

export function LiveDot({
  state,
  className = "w-2.5 h-2.5",
}: {
  state: LiveState;
  className?: string;
}) {
  return (
    <span
      className={`inline-block shrink-0 rounded-full ${className} ${LIVE_DOT[state]}`}
    />
  );
}

export function EventRow({
  e,
  withIdentity = false,
  withDate = false,
}: {
  e: ActivityEvent;
  withIdentity?: boolean;
  withDate?: boolean;
}) {
  const d = new Date(e.created_at);
  let detail = "";
  if (e.kind === "page_view") detail = pageLabel(e.label);
  else if (e.kind === "video_open" || e.kind === "photo_open")
    detail = e.label ?? "";
  else if (e.kind === "login" && e.label)
    detail =
      e.label === "ilham" || e.label === "star"
        ? IDENTITY_LABELS[e.label]
        : e.label;
  return (
    <div className="flex items-baseline gap-3 border-b border-border/50 py-1.5 last:border-0">
      <span
        className={`shrink-0 text-xs tabular-nums text-muted-foreground ${
          withDate ? "w-28" : "w-14"
        }`}
      >
        {withDate ? fmtDateTime(d) : fmtTime(d)}
      </span>
      <span className="min-w-0 text-sm text-foreground">
        {withIdentity && `${IDENTITY_LABELS[e.identity]} · `}
        {kindLabel(e.kind)}
        {detail && <span className="text-muted-foreground"> · {detail}</span>}
      </span>
    </div>
  );
}

export function EmptyState({
  icon = "📭",
  title,
  hint,
}: {
  icon?: string;
  title: string;
  hint?: string;
}) {
  return (
    <div className="py-12 text-center">
      <div className="mb-3 text-3xl">{icon}</div>
      <p className="font-medium text-foreground">{title}</p>
      {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
    </div>
  );
}

export function StatSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-card border border-card-border rounded-xl p-4"
        >
          <Skeleton className="h-7 w-16" />
          <Skeleton className="mt-2 h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function ListSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="bg-card border border-card-border rounded-xl p-4 space-y-3">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-5 w-full" />
      ))}
    </div>
  );
}
