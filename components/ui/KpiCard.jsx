const tone = { success: "text-success", error: "text-error", neutral: "text-neutral-400" };
export default function KpiCard({ label, value, delta }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-[0_1px_2px_0_rgb(0_0_0/0.04)]">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums text-neutral-900">{value}</p>
      {delta ? <p className={`mt-1 text-sm ${tone[delta.tone] || tone.neutral}`}>{delta.label}</p> : null}
    </div>
  );
}
