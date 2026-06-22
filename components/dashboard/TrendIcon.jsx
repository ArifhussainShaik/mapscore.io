import { ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";

export default function TrendIcon({ direction = "flat", value }) {
  const map = {
    up: { Icon: ArrowUpRight, cls: "text-emerald-400" },
    down: { Icon: ArrowDownRight, cls: "text-red-400" },
    flat: { Icon: Minus, cls: "text-zinc-500" },
  };
  const { Icon, cls } = map[direction] || map.flat;
  return (
    <span className={`inline-flex items-center gap-0.5 text-[11px] ${cls}`}>
      <Icon className="w-3.5 h-3.5" />
      {value != null && <span className="tabular-nums">{value}</span>}
    </span>
  );
}
