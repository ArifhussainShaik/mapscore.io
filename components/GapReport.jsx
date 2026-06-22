"use client";
import { useState } from "react";
import toast from "react-hot-toast";
import { Zap, ExternalLink } from "lucide-react";

function severityClass(sev) {
  if (sev === "high") return "bg-red-500/15 text-red-400";
  if (sev === "medium") return "bg-yellow-500/15 text-yellow-400";
  return "bg-zinc-700/50 text-zinc-400";
}

export default function GapReport({ locationId, keyword, initialSnapshot }) {
  const [gaps, setGaps] = useState(null);
  const [competitors, setCompetitors] = useState(initialSnapshot?.competitors || []);
  const [busy, setBusy] = useState(false);

  async function run() {
    setBusy(true);
    try {
      await fetch(`/api/locations/${locationId}/competitors`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ keyword }),
      });
      const data = await fetch(`/api/locations/${locationId}/gaps`).then((r) => r.json());
      setGaps(data.gaps || []);
      setCompetitors(data.competitors || []);
    } catch {
      toast.error("Analysis failed");
    } finally {
      setBusy(false);
    }
  }

  const sorted = [...competitors].sort((a, b) => {
    if (a.rank == null && b.rank == null) return 0;
    if (a.rank == null) return 1;
    if (b.rank == null) return -1;
    return a.rank - b.rank;
  });

  const runButton = (
    <button
      className="px-3 py-1.5 text-[12px] bg-indigo-500 text-white rounded-lg hover:bg-indigo-400 disabled:opacity-50 inline-flex items-center gap-1.5"
      onClick={run}
      disabled={busy}
    >
      <Zap size={13} />
      {busy ? "Analyzing..." : "Run analysis"}
    </button>
  );

  return (
    <section className="bg-zinc-900/60 border border-zinc-800/60 rounded-xl p-5 mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-zinc-100">Competitor &amp; gap analysis</h2>
        {runButton}
      </div>

      {gaps && gaps.length === 0 && (
        <p className="text-sm text-zinc-400 mb-4">No gaps found - you lead the local pack.</p>
      )}

      {gaps && gaps.length > 0 && (
        <ul className="space-y-2 mb-6">
          {gaps.map((g, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${severityClass(g.severity)}`}>
                {g.severity}
              </span>
              <div>
                <p className="text-sm font-medium text-zinc-200">{g.title}</p>
                <p className="text-xs text-zinc-400 mt-0.5">{g.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {sorted.length === 0 && gaps === null && (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <p className="text-sm text-zinc-500">No competitor data yet. Run analysis to scan the local pack.</p>
          {runButton}
        </div>
      )}

      {sorted.length > 0 && (
        <div className="space-y-2">
          {sorted.map((c, i) => (
            <div
              key={i}
              className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-zinc-800/50 border border-zinc-700/40 rounded-lg px-4 py-3"
            >
              <div className="flex items-center gap-3">
                {c.rank != null && (
                  <span className="text-[11px] font-semibold text-zinc-500 w-6 text-right shrink-0">
                    #{c.rank}
                  </span>
                )}
                <div>
                  <p className="text-sm font-medium text-zinc-100">{c.name}</p>
                  {c.category && (
                    <p className="text-[11px] text-zinc-500 mt-0.5">{c.category}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-4 text-[12px] text-zinc-400 shrink-0">
                {c.rating != null && (
                  <span>{c.rating} stars</span>
                )}
                {c.reviewCount != null && (
                  <span>{c.reviewCount} reviews</span>
                )}
                {c.photoCount != null && (
                  <span>{c.photoCount} photos</span>
                )}
                {c.website && (
                  <a
                    href={c.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-400 hover:text-indigo-300 inline-flex items-center gap-1"
                  >
                    <ExternalLink size={12} />
                    Site
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
