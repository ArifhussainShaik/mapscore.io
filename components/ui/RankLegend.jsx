import { RANK_BUCKETS, NOT_FOUND } from "@/libs/rankColor";
export default function RankLegend() {
  const items = [...RANK_BUCKETS, NOT_FOUND];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs">
      {items.map((b) => (
        <span key={b.label} className="inline-flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm" style={{ background: b.fill }} />
          {b.label}
        </span>
      ))}
    </div>
  );
}
