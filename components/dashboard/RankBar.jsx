export default function RankBar({ dist }) {
  const d = dist || { green: 0, yellow: 0, orange: 0, red: 0 };
  const total = (d.green + d.yellow + d.orange + d.red) || 1;
  const seg = (n, color) => n > 0 ? <div style={{ width: `${(n / total) * 100}%`, background: color }} /> : null;
  return (
    <div className="flex h-1.5 w-24 rounded-full overflow-hidden bg-zinc-800">
      {seg(d.green, "#22c55e")}
      {seg(d.yellow, "#eab308")}
      {seg(d.orange, "#f97316")}
      {seg(d.red, "#ef4444")}
    </div>
  );
}
