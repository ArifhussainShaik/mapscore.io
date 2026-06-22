import TrendIcon from "./TrendIcon";

export default function MetricCard({ icon: Icon, label, value, sub, trend }) {
  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-zinc-500 uppercase tracking-wider">{label}</span>
        {Icon && <Icon className="w-4 h-4 text-zinc-600" />}
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-zinc-100 tracking-tight tabular-nums">{value}</span>
        {trend && <TrendIcon direction={trend.direction} value={trend.value} />}
      </div>
      {sub && <p className="text-[11px] text-zinc-500 mt-1">{sub}</p>}
    </div>
  );
}
