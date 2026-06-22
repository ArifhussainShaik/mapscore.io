import { BarChart3, Star, Camera, MessageSquare, CalendarDays } from "lucide-react";
import { getScoreAccent, getGrade } from "@/libs/design-tokens";

const CARD = "bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5";

function SectionBar({ label, value }) {
  const pct = Math.min(100, value ?? 0);
  return (
    <div className="flex items-center gap-3">
      <span className="text-[11px] text-zinc-400 w-32 shrink-0 truncate">{label}</span>
      <div className="flex-1 h-1.5 rounded-full bg-zinc-800">
        <div
          className="h-1.5 rounded-full bg-indigo-500"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] text-zinc-400 tabular-nums w-7 text-right">{value ?? "—"}</span>
    </div>
  );
}

function MetricRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-zinc-800/50 last:border-0">
      <div className="flex items-center gap-2 text-zinc-400">
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-600" />}
        <span className="text-[12px]">{label}</span>
      </div>
      <span className="text-[13px] font-medium text-zinc-200 tabular-nums">{value}</span>
    </div>
  );
}

function severityDot(severity) {
  const s = (severity ?? "").toLowerCase();
  if (s === "high" || s === "critical") return "bg-red-500";
  if (s === "medium") return "bg-yellow-500";
  return "bg-zinc-500";
}

function issueLabel(item) {
  if (typeof item === "string") return item;
  return item.name ?? item.title ?? "Unknown issue";
}

function issueSeverity(item) {
  if (typeof item === "string") return "";
  return item.severity ?? "";
}

export default function OverviewTab({ location, audit, snapshot }) {
  if (!audit) {
    return (
      <div className={`${CARD} flex flex-col items-center justify-center gap-3 py-14 text-center`}>
        <BarChart3 className="w-10 h-10 text-zinc-700" />
        <p className="text-zinc-300 font-medium">No audit yet for this location</p>
        <p className="text-zinc-500 text-[13px]">Run an audit to see profile scores, metrics, and priority fixes.</p>
      </div>
    );
  }

  const totalScore = audit.totalScore ?? null;
  const grade = totalScore !== null ? getGrade(totalScore) : "—";
  const accentColor = totalScore !== null ? getScoreAccent(totalScore) : "#71717a";

  const sectionEntries = Object.entries(audit.sectionScores ?? {});

  const reviewCount = audit.reviewCount ?? null;
  const averageRating = audit.averageRating ?? null;
  const photoCount = audit.photoCount ?? null;

  const responseRateRaw = audit.responseRate;
  const responseRatePct =
    responseRateRaw !== undefined && responseRateRaw !== null
      ? responseRateRaw <= 1
        ? Math.round(responseRateRaw * 100) + "%"
        : Math.round(responseRateRaw) + "%"
      : "—";

  const lastPostDate = audit.lastPostDate
    ? new Date(audit.lastPostDate).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "—";

  const issues = Array.isArray(audit.issues) ? audit.issues.slice(0, 5) : [];

  const competitors = Array.isArray(snapshot?.competitors)
    ? [...snapshot.competitors]
        .sort((a, b) => (a.rank ?? 999) - (b.rank ?? 999))
        .slice(0, 3)
    : [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
      {/* Left column: score + metrics */}
      <div className="space-y-5">
        {/* Profile Score card */}
        <div className={CARD}>
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Profile Score</p>
          <div className="flex items-baseline gap-2 mb-1">
            <span
              className="text-5xl font-bold tabular-nums leading-none"
              style={{ color: accentColor }}
            >
              {totalScore !== null ? totalScore : "—"}
            </span>
            <span className="text-zinc-500 text-lg font-medium">/100</span>
          </div>
          <p className="text-zinc-400 text-sm mb-4">
            Grade: <span className="font-semibold text-zinc-200">{grade}</span>
          </p>
          {sectionEntries.length > 0 && (
            <div className="space-y-2.5 pt-3 border-t border-zinc-800/50">
              {sectionEntries.map(([label, value]) => (
                <SectionBar key={label} label={label} value={value} />
              ))}
            </div>
          )}
        </div>

        {/* Key Metrics card */}
        <div className={CARD}>
          <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Key Metrics</p>
          <div>
            <MetricRow
              icon={Star}
              label="Reviews"
              value={
                reviewCount !== null
                  ? averageRating !== null
                    ? `${reviewCount} (${Number(averageRating).toFixed(1)})`
                    : String(reviewCount)
                  : "—"
              }
            />
            <MetricRow
              icon={Camera}
              label="Photos"
              value={photoCount !== null ? String(photoCount) : "—"}
            />
            <MetricRow
              icon={MessageSquare}
              label="Response rate"
              value={responseRatePct}
            />
            <MetricRow
              icon={CalendarDays}
              label="Last post"
              value={lastPostDate}
            />
          </div>
        </div>
      </div>

      {/* Middle column: Priority Fixes */}
      <div className={CARD}>
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Priority Fixes</p>
        {issues.length === 0 ? (
          <p className="text-zinc-500 text-[13px]">No issues found</p>
        ) : (
          <ul className="space-y-3">
            {issues.map((item, idx) => (
              <li key={idx} className="flex items-start gap-2.5">
                <span
                  className={`mt-1.5 w-2 h-2 rounded-full shrink-0 ${severityDot(issueSeverity(item))}`}
                />
                <span className="text-[13px] text-zinc-300 leading-snug">
                  {issueLabel(item)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Right column: Top Competitors */}
      <div className={CARD}>
        <p className="text-[11px] text-zinc-500 uppercase tracking-wider mb-3">Top Competitors</p>
        {competitors.length === 0 ? (
          <p className="text-zinc-500 text-[13px]">No competitor data yet</p>
        ) : (
          <ul className="space-y-4">
            {competitors.map((comp, idx) => (
              <li key={idx} className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-[13px] font-medium text-zinc-200 truncate">{comp.name ?? "—"}</p>
                  <p className="text-[11px] text-zinc-500 mt-0.5">Rank {comp.rank ?? "—"}</p>
                </div>
                <div className="text-right shrink-0">
                  <div className="flex items-center gap-1 justify-end text-zinc-300 text-[12px]">
                    <Star className="w-3 h-3 text-yellow-500" />
                    <span>{comp.rating !== undefined ? Number(comp.rating).toFixed(1) : "—"}</span>
                  </div>
                  <p className="text-[11px] text-zinc-500 mt-0.5">
                    {comp.reviewCount !== undefined ? comp.reviewCount : "—"} reviews
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
