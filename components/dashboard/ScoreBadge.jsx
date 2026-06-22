import { getGrade, getScoreBg } from "@/libs/design-tokens";

export default function ScoreBadge({ score }) {
  const s = score ?? 0;
  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={`inline-flex items-center justify-center w-9 h-6 rounded text-[11px] font-bold border ${getScoreBg(s)}`}>
        {getGrade(s)}
      </span>
      <span className="text-[12px] text-zinc-400 tabular-nums">{s}</span>
    </span>
  );
}
