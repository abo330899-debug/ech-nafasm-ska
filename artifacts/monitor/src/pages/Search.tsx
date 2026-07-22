import { useMemo, useState } from "react";
import { useMonitor } from "@/lib/MonitorContext";
import { kindLabel, IDENTITY_LABELS, type Identity } from "@/lib/activity";
import {
  searchEvents,
  EMPTY_FILTERS,
  type SearchFilters,
} from "@/lib/analytics";
import {
  EventRow,
  Page,
  Panel,
  ListSkeleton,
} from "@/components/monitor/shared";
import { Input } from "@/components/ui/input";

const KINDS = [
  "login",
  "logout",
  "open",
  "leave",
  "page_view",
  "photo_open",
  "video_open",
  "heartbeat",
];

const PER_PAGE = 50;

export default function Search() {
  const { events, loading, complete } = useMonitor();
  const [filters, setFilters] = useState<SearchFilters>(EMPTY_FILTERS);
  const [page, setPage] = useState(0);
  const [oldestFirst, setOldestFirst] = useState(false);

  const results = useMemo(() => {
    const r = searchEvents(events, filters); // newest first
    return oldestFirst ? r.slice().reverse() : r;
  }, [events, filters, oldestFirst]);

  const pageRows = results.slice(page * PER_PAGE, (page + 1) * PER_PAGE);
  const pages = Math.max(1, Math.ceil(results.length / PER_PAGE));

  function update(patch: Partial<SearchFilters>) {
    setFilters((f) => ({ ...f, ...patch }));
    setPage(0);
  }

  function toggleKind(k: string) {
    setFilters((f) => ({
      ...f,
      kinds: f.kinds.includes(k)
        ? f.kinds.filter((x) => x !== k)
        : [...f.kinds, k],
    }));
    setPage(0);
  }

  if (loading) {
    return (
      <Page>
        <ListSkeleton rows={8} />
      </Page>
    );
  }

  return (
    <Page>
      <h2 className="text-lg font-semibold text-foreground">البحث في السجل</h2>

      <Panel>
        <div className="space-y-3">
          {/* Keyword + dates */}
          <div className="grid gap-2 md:grid-cols-3">
            <Input
              placeholder="كلمة للبحث (اسم صورة، فيديو، صفحة…)"
              value={filters.keyword}
              onChange={(e) => update({ keyword: e.target.value })}
            />
            <Input
              type="date"
              value={filters.from ?? ""}
              onChange={(e) => update({ from: e.target.value || null })}
            />
            <Input
              type="date"
              value={filters.to ?? ""}
              onChange={(e) => update({ to: e.target.value || null })}
            />
          </div>

          {/* Identity */}
          <div className="flex flex-wrap items-center gap-1.5 text-sm">
            <span className="ml-1 text-xs text-muted-foreground">من:</span>
            {(["all", "ilham", "star"] as const).map((id) => (
              <button
                key={id}
                onClick={() => update({ identity: id as Identity | "all" })}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  filters.identity === id
                    ? "bg-primary text-primary-foreground"
                    : "hover-elevate bg-muted text-muted-foreground"
                }`}
              >
                {id === "all" ? "الكل" : IDENTITY_LABELS[id]}
              </button>
            ))}
          </div>

          {/* Kinds */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="ml-1 text-xs text-muted-foreground">النوع:</span>
            {KINDS.map((k) => (
              <button
                key={k}
                onClick={() => toggleKind(k)}
                className={`rounded-md px-2.5 py-1 text-xs ${
                  filters.kinds.includes(k)
                    ? "bg-primary text-primary-foreground"
                    : "hover-elevate bg-muted text-muted-foreground"
                }`}
              >
                {kindLabel(k)}
              </button>
            ))}
            {(filters.kinds.length > 0 ||
              filters.keyword ||
              filters.from ||
              filters.to ||
              filters.identity !== "all") && (
              <button
                onClick={() => {
                  setFilters(EMPTY_FILTERS);
                  setPage(0);
                }}
                className="hover-elevate rounded-md px-2.5 py-1 text-xs text-destructive"
              >
                مسح الكل
              </button>
            )}
          </div>
        </div>
      </Panel>

      {/* Results */}
      <Panel
        title={`النتائج (${results.length})`}
        action={
          <button
            onClick={() => {
              setOldestFirst((v) => !v);
              setPage(0);
            }}
            className="hover-elevate rounded-md px-2 py-1 text-xs text-muted-foreground"
          >
            {oldestFirst ? "الأحدث أولًا" : "الأقدم أولًا"}
          </button>
        }
      >
        {!complete && (
          <p className="mb-2 text-xs text-muted-foreground">
            ما زال السجل القديم قيد التحميل — النتائج قد تكون ناقصة.
          </p>
        )}
        {pageRows.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            لا توجد نتائج مطابقة.
          </p>
        ) : (
          <div>
            {pageRows.map((e) => (
              <EventRow key={e.id} e={e} withIdentity withDate />
            ))}
          </div>
        )}

        {pages > 1 && (
          <div className="mt-3 flex items-center justify-center gap-3 text-sm">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="hover-elevate rounded-md px-3 py-1 text-muted-foreground disabled:opacity-40"
            >
              السابق
            </button>
            <span className="tabular-nums text-muted-foreground">
              {page + 1} / {pages}
            </span>
            <button
              disabled={page >= pages - 1}
              onClick={() => setPage((p) => p + 1)}
              className="hover-elevate rounded-md px-3 py-1 text-muted-foreground disabled:opacity-40"
            >
              التالي
            </button>
          </div>
        )}
      </Panel>
    </Page>
  );
}
