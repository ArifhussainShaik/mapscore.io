"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { RefreshCw } from "lucide-react";
import { rankBucket } from "@/libs/rankColor";

export default function RankGrid({ locationId, scans: initial }) {
  const [scans, setScans] = useState(initial);
  const [active, setActive] = useState(initial[0]?.keyword || null);
  const [busy, setBusy] = useState(false);

  const current = scans.find((s) => s.keyword === active);

  async function scanNow() {
    setBusy(true);
    try {
      const res = await fetch(`/api/locations/${locationId}/scan`, { method: "POST" });
      if (!res.ok) throw new Error("Scan failed");
      const fresh = await fetch(`/api/locations/${locationId}/scans`).then((r) => r.json());
      setScans(fresh.scans);
      if (!active && fresh.scans[0]) setActive(fresh.scans[0].keyword);
      toast.success("Scan complete");
    } catch (e) {
      toast.error(e.message);
    } finally {
      setBusy(false);
    }
  }

  const size = current?.gridSize || Math.sqrt(current?.points?.length || 0) || 7;
  const centerIndex = Math.floor((size * size) / 2);

  if (!scans || scans.length === 0) {
    return (
      <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 flex flex-col items-center gap-4">
        <p className="text-zinc-400 text-sm">No scans yet. Run your first scan to see results.</p>
        <button
          className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 inline-flex items-center gap-1.5"
          onClick={scanNow}
          disabled={busy}
        >
          <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
          {busy ? "Scanning..." : "Run first scan"}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {scans.map((s) => (
          <button
            key={s.keyword}
            className={
              active === s.keyword
                ? "px-2.5 py-0.5 text-[12px] rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30"
                : "px-2.5 py-0.5 text-[12px] rounded-full border border-zinc-700 text-zinc-400 hover:bg-zinc-800"
            }
            onClick={() => setActive(s.keyword)}
          >
            {s.keyword}
          </button>
        ))}
        <button
          className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 inline-flex items-center gap-1.5 ml-auto"
          onClick={scanNow}
          disabled={busy}
        >
          <RefreshCw size={12} className={busy ? "animate-spin" : ""} />
          {busy ? "Scanning..." : "Scan now"}
        </button>
      </div>

      {current ? (
        <>
          <div
            className="grid gap-1 w-fit mb-4"
            style={{ gridTemplateColumns: `repeat(${size}, 2rem)` }}
          >
            {current.points.map((p, i) => {
              const bucket = rankBucket(p.rank);
              const isCenter = i === centerIndex;
              return (
                <div
                  key={i}
                  className={`rounded-md aspect-square flex items-center justify-center text-xs font-medium${isCenter ? " ring-2 ring-white ring-offset-1 ring-offset-zinc-900" : ""}`}
                  style={{ background: bucket.fill, color: bucket.text }}
                  title={p.rank == null ? "Not in top 20" : `Rank ${p.rank}`}
                >
                  {p.rank ?? "-"}
                </div>
              );
            })}
          </div>

          <div className="flex gap-5">
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-zinc-500">ARP</span>
              <span className="text-[13px] text-zinc-200">
                {current.metrics?.arp != null ? current.metrics.arp.toFixed(1) : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-zinc-500">SoLV</span>
              <span className="text-[13px] text-zinc-200">
                {current.metrics?.solv != null ? `${current.metrics.solv.toFixed(0)}%` : "-"}
              </span>
            </div>
            <div className="flex flex-col gap-0.5">
              <span className="text-[11px] text-zinc-500">Found</span>
              <span className="text-[13px] text-zinc-200">
                {current.metrics?.foundCount != null && current.metrics?.totalPoints != null
                  ? `${current.metrics.foundCount}/${current.metrics.totalPoints}`
                  : "-"}
              </span>
            </div>
          </div>
        </>
      ) : (
        <p className="text-zinc-500 text-sm">No data for this keyword. Click Scan now.</p>
      )}
    </div>
  );
}
