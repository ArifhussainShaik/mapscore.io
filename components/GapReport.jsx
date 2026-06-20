"use client";
import { useState } from "react";
import toast from "react-hot-toast";

const sevColor = { high: "badge-error", medium: "badge-warning", low: "badge-ghost" };

export default function GapReport({ locationId, keyword }) {
  const [gaps, setGaps] = useState(null);
  const [competitors, setCompetitors] = useState([]);
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

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-semibold">Competitor & gap analysis</h2>
        <button className="btn btn-sm btn-outline" onClick={run} disabled={busy}>
          {busy ? "Analyzing…" : "Run analysis"}
        </button>
      </div>

      {gaps && gaps.length === 0 && <p className="opacity-60">No gaps found — you lead the local pack.</p>}
      {gaps && gaps.length > 0 && (
        <ul className="space-y-2 mb-6">
          {gaps.map((g, i) => (
            <li key={i} className="flex gap-3 items-start">
              <span className={`badge ${sevColor[g.severity]}`}>{g.severity}</span>
              <div>
                <p className="font-medium">{g.title}</p>
                <p className="text-sm opacity-70">{g.detail}</p>
              </div>
            </li>
          ))}
        </ul>
      )}

      {competitors.length > 0 && (
        <table className="table table-sm">
          <thead><tr><th>Competitor</th><th>Reviews</th><th>Rating</th><th>Photos</th></tr></thead>
          <tbody>
            {competitors.map((c, i) => (
              <tr key={i}><td>{c.name}</td><td>{c.reviewCount}</td><td>{c.rating}</td><td>{c.photoCount}</td></tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
