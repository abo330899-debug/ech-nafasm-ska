// Intelligence layer: deterministic, transparent heuristics computed
// client-side over the same event/session arrays as analytics.ts.
// No external calls, no LLM — every score and insight is explainable and
// the explanation strings say exactly which rule fired.
//
// Perf contract (important): everything here except detectAnomalies is a
// pure function of (sessions, events, todayKey). `todayKey` changes once a
// day, so memoized callers do NOT recompute on the 15-second UI tick.
// detectAnomalies takes `now` like deriveAlerts did (cheap, O(n)).

import {
  baghdadHourDay,
  dayKey,
  fmtDuration,
  fmtTime,
  pageLabel,
  ACTIVE_GAP_MS,
  SESSION_GAP_MS,
  type ActivityEvent,
  type Session,
} from "./activity";
import { countByLabel, pageCounts, retention } from "./analytics";

// ---------------------------------------------------------------------------
// Session scoring
// ---------------------------------------------------------------------------

export type ScoreKey = "engagement" | "activity" | "completion" | "risk";

export interface SessionScores {
  engagement: number;
  activity: number;
  completion: number;
  risk: number;
  /** Arabic bullet explanations for each score. */
  explain: Record<ScoreKey, string[]>;
}

export interface ScoredSession {
  session: Session;
  scores: SessionScores;
}

const KNOWN_PAGES = 6; // الرئيسية، اللحظات، الصور، الأغاني، الفيديوهات، الكتابات

const clamp = (v: number) => Math.max(0, Math.min(100, Math.round(v)));

/** Max number of views of the same page within any 2-minute window. */
function refreshBurst(session: Session): number {
  const byPage = new Map<string, number[]>();
  for (const e of session.events) {
    if (e.kind !== "page_view") continue;
    const p = pageLabel(e.label);
    const arr = byPage.get(p) ?? [];
    arr.push(new Date(e.created_at).getTime());
    byPage.set(p, arr);
  }
  let worst = 0;
  for (const times of byPage.values()) {
    for (let i = 0; i < times.length; i += 1) {
      let j = i;
      while (j + 1 < times.length && times[j + 1] - times[i] <= 120_000) j += 1;
      worst = Math.max(worst, j - i + 1);
    }
  }
  return worst;
}

// Quiet hours in Baghdad (same rule as the alerts engine): 02:00–06:00.
const QUIET_FROM = 2;
const QUIET_TO = 6;

export function scoreSession(s: Session): SessionScores {
  const minutes = s.durationMs / 60_000;
  const uniquePages = new Set(s.navPath).size;
  const interactions = s.events.filter((e) => e.kind !== "heartbeat").length;
  const activeRatio = s.durationMs > 0 ? s.activeMs / s.durationMs : 0;
  const pct = Math.round(activeRatio * 100);

  // --- Engagement -----------------------------------------------------------
  const engExplain: string[] = [];
  const contentPts = Math.min(35, (s.photoOpens + s.videoOpens * 2) * 3);
  if (s.photoOpens + s.videoOpens > 0) {
    engExplain.push(
      `تفاعل مع المحتوى: ${s.photoOpens} صورة و${s.videoOpens} فيديو`,
    );
  } else {
    engExplain.push("لم تُفتح أي صور أو فيديوهات");
  }
  const breadthPts = Math.min(20, uniquePages * 4);
  if (uniquePages > 0) engExplain.push(`زارت ${uniquePages} من أقسام الأرشيف`);
  const activePts =
    s.durationMs >= 60_000 ? activeRatio * 30 : 10;
  if (s.durationMs >= 60_000) engExplain.push(`نسبة النشاط الفعلي ${pct}٪`);
  const durationPts = Math.min(15, minutes);
  engExplain.push(`مدة الجلسة ${fmtDuration(s.durationMs)}`);
  const engagement = clamp(contentPts + breadthPts + activePts + durationPts);

  // --- Activity ---------------------------------------------------------------
  const rate = interactions / Math.max(1, minutes);
  const activity = clamp(rate * 25);
  const actExplain = [
    `${interactions} تفاعلًا خلال ${fmtDuration(s.durationMs)} — بمعدل ${rate.toFixed(1)} في الدقيقة`,
  ];

  // --- Completion --------------------------------------------------------------
  const compExplain: string[] = [];
  let lastKind: string | null = null;
  for (let i = s.events.length - 1; i >= 0; i -= 1) {
    if (s.events[i].kind !== "heartbeat") {
      lastKind = s.events[i].kind;
      break;
    }
  }
  const clean = lastKind === "leave" || lastKind === "logout";
  const cleanPts = clean ? 40 : 0;
  compExplain.push(
    clean ? "انتهت الجلسة بخروج واضح" : "انتهت الجلسة فجأة دون خروج",
  );
  const coveragePts = (uniquePages / KNOWN_PAGES) * 40;
  compExplain.push(`غطّت ${uniquePages} من ${KNOWN_PAGES} أقسام`);
  const contentDone = s.photoOpens + s.videoOpens > 0 ? 20 : 0;
  const completion = clamp(cleanPts + coveragePts + contentDone);

  // --- Risk ---------------------------------------------------------------------
  const riskExplain: string[] = [];
  let risk = 0;
  if (
    s.avgInteractionMs !== null &&
    s.avgInteractionMs < 3_000 &&
    s.pageViews >= 8
  ) {
    risk += 40;
    riskExplain.push("تنقّل سريع جدًا بين الصفحات (أقل من ٣ ثوانٍ لكل صفحة)");
  }
  const burst = refreshBurst(s);
  if (burst >= 5) {
    risk += 30;
    riskExplain.push(`الصفحة نفسها فُتحت ${burst} مرات خلال دقيقتين`);
  }
  const { hour } = baghdadHourDay(s.start.getTime());
  if (hour >= QUIET_FROM && hour < QUIET_TO) {
    risk += 20;
    riskExplain.push(`بدأت في وقت غير معتاد (${hour}:00 فجرًا بتوقيت بغداد)`);
  }
  if (s.durationMs > 3 * 60 * 60 * 1000) {
    risk += 10;
    riskExplain.push("جلسة أطول من ٣ ساعات");
  }
  if (s.durationMs > 30 * 60 * 1000 && activeRatio < 0.2) {
    risk += 15;
    riskExplain.push("معظم الجلسة خمول (أكثر من ٨٠٪)");
  }
  if (riskExplain.length === 0) riskExplain.push("لا مؤشرات غير معتادة");

  return {
    engagement,
    activity,
    completion,
    risk: clamp(risk),
    explain: {
      engagement: engExplain,
      activity: actExplain,
      completion: compExplain,
      risk: riskExplain,
    },
  };
}

export function scoreSessions(sessions: Session[]): ScoredSession[] {
  return sessions.map((session) => ({ session, scores: scoreSession(session) }));
}

export function scoreLabel(v: number): string {
  if (v >= 75) return "ممتاز";
  if (v >= 50) return "جيد";
  if (v >= 25) return "متوسط";
  return "منخفض";
}

export function riskLabel(v: number): string {
  if (v >= 70) return "مرتفع";
  if (v >= 40) return "متوسط";
  if (v > 0) return "منخفض";
  return "لا شيء";
}

// ---------------------------------------------------------------------------
// Anomaly detection (single engine — replaces deriveAlerts)
// ---------------------------------------------------------------------------

export type Severity = "low" | "medium" | "high" | "critical";

export const SEVERITY_ORDER: Record<Severity, number> = {
  critical: 3,
  high: 2,
  medium: 1,
  low: 0,
};

export interface Anomaly {
  id: string;
  severity: Severity;
  title: string;
  detail: string;
  at: Date;
}

const LONG_SESSION_MS = 2 * 60 * 60 * 1000;
const SHORT_SESSION_MS = 30 * 1000;

export function detectAnomalies(
  scored: ScoredSession[],
  channelStatus: string,
  now: number,
): Anomaly[] {
  const out: Anomaly[] = [];

  if (
    channelStatus === "CHANNEL_ERROR" ||
    channelStatus === "TIMED_OUT" ||
    channelStatus === "CLOSED"
  ) {
    out.push({
      id: `rt-${channelStatus}`,
      severity: "critical",
      title: "انقطاع البث المباشر",
      detail:
        "قناة التحديث الفوري غير متصلة — قد لا تظهر النشاطات الجديدة تلقائيًا. جرّب زر التحديث.",
      at: new Date(now),
    });
  }

  const ilham = scored.filter((x) => x.session.identity === "ilham");

  for (const { session: s, scores } of ilham) {
    const startMs = s.start.getTime();
    const stillLive = now - s.end.getTime() <= SESSION_GAP_MS;

    if (s.durationMs >= LONG_SESSION_MS) {
      out.push({
        id: `long-${startMs}`,
        severity: "medium",
        title: "جلسة طويلة",
        detail: `جلسة استمرت أكثر من ساعتين (بدأت ${fmtTime(s.start)}).`,
        at: s.end,
      });
    } else if (!stillLive && s.durationMs <= SHORT_SESSION_MS) {
      out.push({
        id: `short-${startMs}`,
        severity: "low",
        title: "زيارة قصيرة جدًا",
        detail: "دخلت وخرجت خلال أقل من ٣٠ ثانية.",
        at: s.end,
      });
    }

    const { hour } = baghdadHourDay(startMs);
    if (hour >= QUIET_FROM && hour < QUIET_TO) {
      out.push({
        id: `night-${startMs}`,
        severity: "medium",
        title: "نشاط في وقت غير معتاد",
        detail: `زيارة بدأت الساعة ${hour}:00 فجرًا بتوقيت بغداد.`,
        at: s.start,
      });
    }

    if (stillLive && s.idleMs > 30 * 60 * 1000) {
      out.push({
        id: `idle-${startMs}`,
        severity: "low",
        title: "خمول طويل",
        detail: "الجلسة الحالية فيها فترة خمول تجاوزت ٣٠ دقيقة.",
        at: s.end,
      });
    }

    if (
      s.avgInteractionMs !== null &&
      s.avgInteractionMs < 3_000 &&
      s.pageViews >= 8
    ) {
      out.push({
        id: `rapid-${startMs}`,
        severity: "high",
        title: "تنقّل سريع غير معتاد",
        detail: `${s.pageViews} صفحة خلال ${fmtDuration(s.durationMs)} — أقل من ٣ ثوانٍ لكل صفحة.`,
        at: s.end,
      });
    }

    const burst = refreshBurst(s);
    if (burst >= 5) {
      out.push({
        id: `refresh-${startMs}`,
        severity: "medium",
        title: "تحديث متكرر للصفحة نفسها",
        detail: `الصفحة نفسها فُتحت ${burst} مرات خلال دقيقتين.`,
        at: s.end,
      });
    }

    if (scores.risk >= 70) {
      out.push({
        id: `risky-${startMs}`,
        severity: "high",
        title: "جلسة تستحق الانتباه",
        detail: scores.explain.risk.join("؛ "),
        at: s.end,
      });
    }
  }

  // Traffic spike: only meaningful with ≥7 days of history; median-based so a
  // couple of quiet days can't turn every visit into an "anomaly".
  const dayVisits = new Map<string, number>();
  for (const { session: s } of ilham) {
    const k = dayKey(s.start);
    dayVisits.set(k, (dayVisits.get(k) ?? 0) + 1);
  }
  if (dayVisits.size >= 7) {
    const today = dayKey(new Date(now));
    const todayVisits = dayVisits.get(today) ?? 0;
    const others = [...dayVisits.entries()]
      .filter(([k]) => k !== today)
      .map(([, v]) => v)
      .sort((a, b) => a - b);
    const median = others[Math.floor(others.length / 2)] ?? 0;
    const threshold = Math.max(3, median * 3);
    if (todayVisits > threshold) {
      out.push({
        id: `spike-${today}`,
        severity: "high",
        title: "نشاط أعلى من المعتاد بكثير",
        detail: `${todayVisits} زيارات اليوم مقابل معدل معتاد قدره ${median} — قد يستحق نظرة.`,
        at: new Date(now),
      });
    }
  }

  return out
    .sort(
      (a, b) =>
        SEVERITY_ORDER[b.severity] - SEVERITY_ORDER[a.severity] ||
        b.at.getTime() - a.at.getTime(),
    )
    .slice(0, 50);
}

// ---------------------------------------------------------------------------
// Insights
// ---------------------------------------------------------------------------

export interface Insight {
  id: string;
  tag: string;
  title: string;
  body: string;
  tone: "up" | "down" | "neutral";
}

const AR_WEEKDAYS = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

function median(nums: number[]): number {
  if (nums.length === 0) return 0;
  const s = [...nums].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
}

/**
 * Automatic insight cards about إلهام's behavior. Pure function of
 * (scored ilham sessions, ilham events, todayKey) — recomputes only when
 * data or the calendar day changes.
 */
export function generateInsights(
  scored: ScoredSession[],
  events: ActivityEvent[],
  todayKey: string,
): Insight[] {
  const sessions = scored
    .filter((x) => x.session.identity === "ilham")
    .map((x) => x.session);
  const ilhamScored = scored.filter((x) => x.session.identity === "ilham");
  const ilhamEvents = events.filter((e) => e.identity === "ilham");
  if (sessions.length === 0) return [];

  const out: Insight[] = [];
  const todayMs = new Date(todayKey + "T00:00:00").getTime();
  const weekAgo = todayMs - 6 * 86_400_000;
  const twoWeeksAgo = todayMs - 13 * 86_400_000;

  // 1. Week-over-week trend
  const thisWeek = sessions.filter((s) => s.start.getTime() >= weekAgo);
  const prevWeek = sessions.filter(
    (s) => s.start.getTime() >= twoWeeksAgo && s.start.getTime() < weekAgo,
  );
  if (thisWeek.length > 0 || prevWeek.length > 0) {
    const a = thisWeek.length;
    const b = prevWeek.length;
    const mins = Math.round(
      thisWeek.reduce((t, s) => t + s.durationMs, 0) / 60_000,
    );
    let body = `${a} زيارة هذا الأسبوع بمجموع ${mins} دقيقة`;
    let tone: Insight["tone"] = "neutral";
    if (b > 0) {
      const diff = Math.round(((a - b) / b) * 100);
      if (diff > 10) {
        body += ` — أكثر من الأسبوع الماضي بنسبة ${diff}٪`;
        tone = "up";
      } else if (diff < -10) {
        body += ` — أقل من الأسبوع الماضي بنسبة ${Math.abs(diff)}٪`;
        tone = "down";
      } else {
        body += " — مشابه للأسبوع الماضي";
      }
    }
    out.push({
      id: "trend-week",
      tag: "الاتجاه",
      title: "حركة هذا الأسبوع",
      body,
      tone,
    });
  }

  // 2. Top content
  const topPage = pageCounts(ilhamEvents)[0];
  if (topPage) {
    out.push({
      id: "top-page",
      tag: "المحتوى",
      title: "القسم المفضّل",
      body: `«${topPage[0]}» هي الصفحة الأكثر زيارة (${topPage[1]} مرة).`,
      tone: "neutral",
    });
  }
  const topVideo = countByLabel(ilhamEvents, "video_open")[0];
  if (topVideo) {
    out.push({
      id: "top-video",
      tag: "المحتوى",
      title: "الفيديو الأكثر مشاهدة",
      body: `«${topVideo[0]}» شوهد ${topVideo[1]} مرة.`,
      tone: "neutral",
    });
  }

  // 3. Drop-off page
  const ended = sessions.filter(
    (s) => s.navPath.length > 0,
  );
  if (ended.length >= 3) {
    const lastPages = new Map<string, number>();
    for (const s of ended) {
      const last = s.navPath[s.navPath.length - 1];
      lastPages.set(last, (lastPages.get(last) ?? 0) + 1);
    }
    const top = [...lastPages.entries()].sort((a, b) => b[1] - a[1])[0];
    if (top && top[1] >= 2) {
      out.push({
        id: "drop-off",
        tag: "السلوك",
        title: "آخر محطة قبل المغادرة",
        body: `غالبًا ما تكون «${top[0]}» آخر صفحة تُفتح قبل نهاية الجلسة (${top[1]} من ${ended.length} جلسات).`,
        tone: "neutral",
      });
    }
  }

  // 4. Favorite weekday
  if (sessions.length >= 5) {
    const perDay = new Array<number>(7).fill(0);
    for (const s of sessions) {
      perDay[baghdadHourDay(s.start.getTime()).day] += 1;
    }
    const best = perDay.indexOf(Math.max(...perDay));
    if (perDay[best] >= 2) {
      out.push({
        id: "best-day",
        tag: "السلوك",
        title: "اليوم المعتاد",
        body: `أكثر يوم تزور فيه الأرشيف هو ${AR_WEEKDAYS[best]}.`,
        tone: "neutral",
      });
    }
  }

  // 5. Session quality
  const avgEng = Math.round(
    ilhamScored.reduce((t, x) => t + x.scores.engagement, 0) /
      ilhamScored.length,
  );
  out.push({
    id: "quality",
    tag: "الجودة",
    title: "جودة الجلسات",
    body: `متوسط درجة التفاعل ${avgEng} من 100 (${scoreLabel(avgEng)}).`,
    tone: avgEng >= 50 ? "up" : avgEng >= 25 ? "neutral" : "down",
  });

  // 6. Returning visitor / streak
  const ret = retention(sessions);
  if (ret.currentStreak >= 2) {
    out.push({
      id: "streak",
      tag: "المواظبة",
      title: "زيارات متتالية",
      body: `زارت الأرشيف ${ret.currentStreak} أيام على التوالي — أطول سلسلة كانت ${ret.longestStreak} أيام.`,
      tone: "up",
    });
  } else if (ret.distinctDays >= 2) {
    out.push({
      id: "returning",
      tag: "المواظبة",
      title: "زائرة عائدة",
      body: `زارت الأرشيف في ${ret.distinctDays} أيام مختلفة حتى الآن.`,
      tone: "neutral",
    });
  }

  // 7. Typical session length
  if (sessions.length >= 3) {
    const med = median(sessions.map((s) => s.durationMs));
    out.push({
      id: "typical-length",
      tag: "السلوك",
      title: "طول الجلسة المعتاد",
      body: `الجلسة المعتادة تستمر نحو ${fmtDuration(med)}.`,
      tone: "neutral",
    });
  }

  // 8. Common navigation transition
  const transitions = new Map<string, number>();
  for (const s of sessions) {
    for (let i = 1; i < s.navPath.length; i += 1) {
      const k = `${s.navPath[i - 1]} ← ${s.navPath[i]}`;
      transitions.set(k, (transitions.get(k) ?? 0) + 1);
    }
  }
  const topTrans = [...transitions.entries()].sort((a, b) => b[1] - a[1])[0];
  if (topTrans && topTrans[1] >= 3) {
    out.push({
      id: "nav-pattern",
      tag: "السلوك",
      title: "المسار المعتاد",
      body: `أكثر تنقّل متكرر: ${topTrans[0]} (${topTrans[1]} مرات).`,
      tone: "neutral",
    });
  }

  return out;
}

// ---------------------------------------------------------------------------
// Predictions
// ---------------------------------------------------------------------------

export type Confidence = "none" | "low" | "medium" | "high";

export const CONFIDENCE_LABELS: Record<Confidence, string> = {
  none: "بيانات قليلة",
  low: "ثقة منخفضة",
  medium: "ثقة متوسطة",
  high: "ثقة عالية",
};

export interface PredictionItem {
  id: string;
  title: string;
  value: string;
  detail: string;
}

export interface PredictionSet {
  confidence: Confidence;
  sampleDays: number;
  items: PredictionItem[];
  note: string | null;
}

/**
 * Honest forecasting from tiny data: hidden below 3 days of history,
 * labeled with confidence up to 14 days. Pure function of
 * (ilham sessions, todayKey).
 */
export function predictions(
  allSessions: Session[],
  todayKey: string,
): PredictionSet {
  const sessions = allSessions.filter((s) => s.identity === "ilham");
  const days = new Set(sessions.map((s) => dayKey(s.start)));
  const sampleDays = days.size;

  const confidence: Confidence =
    sampleDays < 3
      ? "none"
      : sampleDays < 7
        ? "low"
        : sampleDays < 14
          ? "medium"
          : "high";

  if (confidence === "none") {
    return {
      confidence,
      sampleDays,
      items: [],
      note: "التوقعات تحتاج ٣ أيام زيارة على الأقل حتى تكون ذات معنى — البيانات الحالية غير كافية.",
    };
  }

  const items: PredictionItem[] = [];
  const todayMs = new Date(todayKey + "T00:00:00").getTime();

  // Expected visits: mean over the recent full days (today excluded,
  // zero days count). The window is the last 13 full days, clamped to the
  // actual history length — with only 3 days of visits we divide by ~3,
  // not 13, or the mean would be badly understated.
  const since = todayMs - 13 * 86_400_000;
  const perDay = new Map<string, number>();
  let earliestInWindow = todayMs;
  for (const s of sessions) {
    const t = s.start.getTime();
    if (t < since || dayKey(s.start) === todayKey) continue;
    const k = dayKey(s.start);
    perDay.set(k, (perDay.get(k) ?? 0) + 1);
    if (t < earliestInWindow) earliestInWindow = t;
  }
  const windowDays = Math.min(
    13,
    Math.max(1, Math.ceil((todayMs - earliestInWindow) / 86_400_000)),
  );
  const total = [...perDay.values()].reduce((a, b) => a + b, 0);
  const mean = total / windowDays;
  items.push({
    id: "expected-visits",
    title: "الزيارات المتوقعة اليوم",
    value: mean < 0.5 ? "0–1" : `~${Math.round(mean)}`,
    detail: `بناءً على معدل آخر ${windowDays} يومًا (${total} زيارة).`,
  });

  // Return likelihood: fraction of last-14 calendar days with a visit.
  const activeDays = perDay.size;
  const frac = activeDays / windowDays;
  const likely = frac >= 0.6 ? "مرتفع" : frac >= 0.3 ? "متوسط" : "منخفض";
  items.push({
    id: "return-likelihood",
    title: "احتمال زيارة اليوم",
    value: likely,
    detail: `زارت في ${activeDays} من آخر ${windowDays} يومًا.`,
  });

  // Peak hour from session starts (Baghdad clock).
  const hourCounts = new Array<number>(24).fill(0);
  for (const s of sessions) {
    hourCounts[baghdadHourDay(s.start.getTime()).hour] += 1;
  }
  const peak = hourCounts.indexOf(Math.max(...hourCounts));
  if (hourCounts[peak] >= 2) {
    items.push({
      id: "peak-window",
      title: "وقت الذروة المتوقع",
      value: `${peak}:00 – ${(peak + 2) % 24}:00`,
      detail: `${hourCounts[peak]} من الجلسات بدأت في هذه الساعة (بتوقيت بغداد).`,
    });
  }

  return {
    confidence,
    sampleDays,
    items,
    note:
      confidence === "low"
        ? "التوقعات مبنية على أيام قليلة — خذها كإشارة لا كحقيقة."
        : null,
  };
}

// ---------------------------------------------------------------------------
// Smart timeline: narrate a session as a readable Arabic story
// ---------------------------------------------------------------------------

export function narrateSession(s: Session, now: number): string[] {
  const out: string[] = [];
  const events = s.events;
  const stillLive = now - s.end.getTime() <= SESSION_GAP_MS;

  const opener =
    events.find((e) => e.kind === "login") != null
      ? `سجّلت الدخول الساعة ${fmtTime(s.start)}.`
      : `فتحت الأرشيف الساعة ${fmtTime(s.start)}.`;
  out.push(opener);

  // Walk all events; group consecutive photo opens, collect video names,
  // and call out idle gaps (no events at all — even heartbeats stopped).
  let photoRun = 0;
  const flushPhotos = () => {
    if (photoRun === 1) out.push("فتحت صورة واحدة.");
    else if (photoRun > 1) out.push(`تصفّحت ${photoRun} صور.`);
    photoRun = 0;
  };

  let sentences = 0;
  let skipped = 0;
  const push = (t: string) => {
    if (out.length < 24) out.push(t);
    else skipped += 1;
    sentences += 1;
  };

  for (let i = 0; i < events.length; i += 1) {
    const e = events[i];
    if (i > 0) {
      const gap =
        new Date(e.created_at).getTime() -
        new Date(events[i - 1].created_at).getTime();
      if (gap > ACTIVE_GAP_MS) {
        flushPhotos();
        push(`ابتعدت عن الشاشة قرابة ${fmtDuration(gap)} ثم عادت.`);
      }
    }
    switch (e.kind) {
      case "photo_open":
        photoRun += 1;
        break;
      case "video_open":
        flushPhotos();
        push(e.label ? `شغّلت فيديو «${e.label}».` : "شغّلت فيديو.");
        break;
      case "page_view":
        flushPhotos();
        push(`انتقلت إلى «${pageLabel(e.label)}».`);
        break;
      case "logout":
        flushPhotos();
        push("سجّلت الخروج.");
        break;
      default:
        break;
    }
  }
  flushPhotos();
  if (skipped > 0) out.push(`…و${skipped} خطوات أخرى.`);

  if (stillLive) {
    out.push("الجلسة ما زالت جارية الآن.");
  } else {
    let lastKind: string | null = null;
    for (let i = events.length - 1; i >= 0; i -= 1) {
      if (events[i].kind !== "heartbeat") {
        lastKind = events[i].kind;
        break;
      }
    }
    const dur = fmtDuration(s.durationMs);
    const act = fmtDuration(s.activeMs);
    if (lastKind === "leave" || lastKind === "logout") {
      out.push(
        `غادرت الساعة ${fmtTime(s.end)} بعد جلسة استمرت ${dur} (نشاط فعلي ${act}).`,
      );
    } else {
      out.push(`انقطع النشاط الساعة ${fmtTime(s.end)} بعد ${dur}.`);
    }
  }

  return out;
}

// ---------------------------------------------------------------------------
// Reports
// ---------------------------------------------------------------------------

export type ReportScope = "daily" | "weekly" | "monthly";

export const REPORT_TITLES: Record<ReportScope, string> = {
  daily: "التقرير اليومي",
  weekly: "التقرير الأسبوعي",
  monthly: "التقرير الشهري",
};

export interface Report {
  scope: ReportScope;
  rangeLabel: string;
  visits: number;
  totalMs: number;
  activeMs: number;
  pageViews: number;
  photoOpens: number;
  videoOpens: number;
  avgEngagement: number | null;
  topPages: [string, number][];
  topVideos: [string, number][];
  anomalies: Anomaly[];
  executive: string[];
}

export function buildReport(
  scope: ReportScope,
  scored: ScoredSession[],
  events: ActivityEvent[],
  todayKey: string,
): Report {
  const todayMs = new Date(todayKey + "T00:00:00").getTime();
  const spanDays = scope === "daily" ? 1 : scope === "weekly" ? 7 : 30;
  const fromMs = todayMs - (spanDays - 1) * 86_400_000;
  const rangeLabel =
    scope === "daily"
      ? "اليوم"
      : scope === "weekly"
        ? "آخر ٧ أيام"
        : "آخر ٣٠ يومًا";

  const inRange = scored.filter(
    (x) =>
      x.session.identity === "ilham" && x.session.start.getTime() >= fromMs,
  );
  const evRange = events.filter(
    (e) =>
      e.identity === "ilham" && new Date(e.created_at).getTime() >= fromMs,
  );

  const visits = inRange.length;
  const totalMs = inRange.reduce((t, x) => t + x.session.durationMs, 0);
  const activeMs = inRange.reduce((t, x) => t + x.session.activeMs, 0);
  const pageViews = inRange.reduce((t, x) => t + x.session.pageViews, 0);
  const photoOpens = inRange.reduce((t, x) => t + x.session.photoOpens, 0);
  const videoOpens = inRange.reduce((t, x) => t + x.session.videoOpens, 0);
  const avgEngagement =
    visits > 0
      ? Math.round(
          inRange.reduce((t, x) => t + x.scores.engagement, 0) / visits,
        )
      : null;

  const topPages = pageCounts(evRange).slice(0, 3);
  const topVideos = countByLabel(evRange, "video_open").slice(0, 3);

  // Anomalies inside the range (without the realtime-channel one, which is a
  // "right now" condition rather than a period observation).
  // Liveness reference = the newest session end we know about across ALL
  // scored sessions. A fake "tomorrow" timestamp would make an in-progress
  // session look ended and falsely fire the "very short visit" rule while
  // she is still browsing.
  const refNow = scored.reduce(
    (t, x) => Math.max(t, x.session.end.getTime()),
    todayMs,
  );
  const anomalies = detectAnomalies(inRange, "SUBSCRIBED", refNow)
    .filter((a) => a.at.getTime() >= fromMs)
    .slice(0, 10);

  const executive: string[] = [];
  if (visits === 0) {
    executive.push(`لا زيارات من إلهام خلال ${rangeLabel}.`);
  } else {
    executive.push(
      `خلال ${rangeLabel} زارت إلهام الأرشيف ${visits} ${visits === 1 ? "مرة" : "مرات"} بمجموع ${fmtDuration(totalMs)} (نشاط فعلي ${fmtDuration(activeMs)}).`,
    );
    executive.push(
      `تصفّحت ${pageViews} صفحة وفتحت ${photoOpens} صورة و${videoOpens} فيديو.`,
    );
    if (avgEngagement !== null) {
      executive.push(
        `متوسط جودة الجلسات ${avgEngagement} من 100 (${scoreLabel(avgEngagement)}).`,
      );
    }
    if (topPages[0]) {
      executive.push(`القسم الأكثر زيارة: «${topPages[0][0]}».`);
    }
    const serious = anomalies.filter(
      (a) => a.severity === "high" || a.severity === "critical",
    ).length;
    executive.push(
      anomalies.length === 0
        ? "لا ملاحظات غير معتادة خلال هذه الفترة."
        : `سُجّلت ${anomalies.length} ملاحظات${serious > 0 ? ` — منها ${serious} مهمة` : ""}.`,
    );
  }

  return {
    scope,
    rangeLabel,
    visits,
    totalMs,
    activeMs,
    pageViews,
    photoOpens,
    videoOpens,
    avgEngagement,
    topPages,
    topVideos,
    anomalies,
    executive,
  };
}
