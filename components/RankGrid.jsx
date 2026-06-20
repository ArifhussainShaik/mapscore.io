"use client";
import { useState } from "react";
import toast from "react-hot-toast";
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

  return (
    <div>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        {scans.map((s) => (
          <button
            key={s.keyword}
            className={`btn btn-sm ${active === s.keyword ? "btn-primary" : "btn-ghost"}`}
            onClick={() => setActive(s.keyword)}
          >
            {s.keyword}
          </button>
        ))}
        <button className="btn btn-sm btn-outline ml-auto" onClick={scanNow} disabled={busy}>
          {busy ? "Scanning…" : "Scan now"}
        </button>
      </div>

      {current ? (
        <>
          <div className="flex gap-6 mb-4 text-sm">
            <span>ARP: <strong>{current.metrics?.arp?.toFixed(1)}</strong></span>
            <span>SoLV: <strong>{current.metrics?.solv?.toFixed(0)}%</strong></span>
            <span>Found: <strong>{current.metrics?.foundCount}/{current.metrics?.totalPoints}</strong></span>
          </div>
          <div
            className="grid gap-1 w-fit"
            style={{ gridTemplateColumns: `repeat(${size}, 2rem)` }}
          >
            {current.points.map((p, i) => {
              const bucket = rankBucket(p.rank);
              return (
                <div
                  key={i}
                  className="w-8 h-8 rounded flex items-center justify-center text-xs font-medium"
                  style={{ background: bucket.fill, color: bucket.text }}
                  title={p.rank == null ? "Not in top 20" : `Rank ${p.rank}`}
                >
                  {p.rank ?? "–"}
                </div>
              );
            })}
          </div>
        </>
      ) : (
        <p className="opacity-60">No scans yet. Click “Scan now”.</p>
      )}
    </div>
  );
}
